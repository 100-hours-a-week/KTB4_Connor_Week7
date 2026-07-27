import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { fetchRoom } from "../../api/booking.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { BookingReviewList } from "../../features/book-room/BookingReviewList.jsx";
import { BookingStepLayout } from "../../features/book-room/BookingStepLayout.jsx";
import { SubmitBookingButton } from "../../features/book-room/SubmitBookingButton.jsx";
import { useBookingDraft } from "../../features/book-room/model/BookingDraftProvider.jsx";
import { recoverBookingMutation } from "../../features/book-room/recoverBookingMutation.js";

function getIncompleteBookingRoute(draft) {
  if (!draft.roomId) return "/rooms";
  if (!draft.date || !draft.startTime || !draft.endTime) {
    return `/booking/${encodeURIComponent(draft.roomId)}/date-time`;
  }
  if (!draft.topic.trim() || draft.attendeeChips.length === 0) {
    return "/booking/information";
  }
  return "";
}

function BookingReviewPage({ loadRoom = fetchRoom, create, update }) {
  const navigate = useNavigate();
  const { recoverUnauthorized } = useAuth();
  const { draft, editingReservationId, dispatch } = useBookingDraft();
  const completedRef = useRef(false);
  const guardRoute = completedRef.current
    ? ""
    : getIncompleteBookingRoute(draft);
  const [roomState, setRoomState] = useState({
    status: "loading",
    room: null,
    error: "",
  });
  const [submissionError, setSubmissionError] = useState("");

  useEffect(() => {
    if (completedRef.current || guardRoute) return undefined;
    const controller = new AbortController();
    loadRoom(draft.roomId, { signal: controller.signal })
      .then((room) => {
        if (controller.signal.aborted) return;
        if (draft.attendeeChips.length > room.capacity) {
          sessionStorage.setItem(
            "bookingFeedback",
            `최대 ${room.capacity}명까지 이용할 수 있어요.`,
          );
          navigate("/booking/information", { replace: true });
          return;
        }
        dispatch({
          type: "updateInformation",
          information: {
            roomName: room.name,
            roomCapacity: room.capacity,
          },
        });
        setRoomState({ status: "success", room, error: "" });
      })
      .catch((error) => {
        if (controller.signal.aborted || recoverUnauthorized(error)) return;
        setRoomState({
          status: "error",
          room: null,
          error: "예약 내용을 불러오지 못했어요.",
        });
      });
    return () => controller.abort();
  }, [
    dispatch,
    draft.attendeeChips.length,
    draft.roomId,
    guardRoute,
    loadRoom,
    navigate,
    recoverUnauthorized,
  ]);

  if (guardRoute) return <Navigate to={guardRoute} replace />;

  return (
    <BookingStepLayout
      backTo="/booking/information"
      backLabel="예약 정보 입력으로 돌아가기"
      onExit={() => {
        dispatch({ type: "changeRoom" });
        navigate(editingReservationId ? "/rooms?mode=change" : "/rooms");
      }}
      nextDisabled
      nextLabel={editingReservationId ? "예약 변경" : "예약 확정"}
      nextControl={
        roomState.room ? (
          <SubmitBookingButton
            draft={draft}
            editingReservationId={editingReservationId}
            create={create}
            update={update}
            clear={() => dispatch({ type: "clear" })}
            onCompleted={(reservation) => {
              completedRef.current = true;
              navigate(
                editingReservationId
                  ? `/reservations/${encodeURIComponent(reservation.reservationId)}`
                  : `/booking/confirmed/${encodeURIComponent(reservation.reservationId)}`,
                editingReservationId
                  ? undefined
                  : { state: { reservation } },
              );
            }}
            onRecover={(error) =>
              recoverBookingMutation(error, {
                roomId: draft.roomId,
                dispatch,
                navigate,
                setFeedback: setSubmissionError,
                recoverUnauthorized,
              })
            }
          />
        ) : undefined
      }
    >
      <main className="booking-page">
        <p className="booking-step">3/3</p>
        <h2 tabIndex={-1}>
          {editingReservationId
            ? "변경 내용을 확인해 주세요"
            : "예약 내용을 확인해 주세요"}
        </h2>
        {roomState.status === "loading" ? (
          <p className="booking-content-state" aria-live="polite">
            예약 내용을 불러오는 중이에요.
          </p>
        ) : null}
        {roomState.status === "error" ? (
          <p
            className="booking-content-state is-error"
            aria-live="polite"
          >
            {roomState.error}
          </p>
        ) : null}
        {roomState.room ? (
          <BookingReviewList room={roomState.room} draft={draft} />
        ) : null}
        {submissionError ? (
          <p
            className="booking-inline-feedback is-error"
            aria-live="polite"
          >
            {submissionError}
          </p>
        ) : null}
      </main>
    </BookingStepLayout>
  );
}

export { BookingReviewPage, getIncompleteBookingRoute };

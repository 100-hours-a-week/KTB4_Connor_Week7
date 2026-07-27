import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { fetchRoom } from "../../api/booking.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import {
  BookingInformationForm,
  FORM_ID,
} from "../../features/book-room/BookingInformationForm.jsx";
import { BookingStepLayout } from "../../features/book-room/BookingStepLayout.jsx";
import { useBookingDraft } from "../../features/book-room/model/BookingDraftProvider.jsx";

function getInformationGuardRoute(draft) {
  if (!draft.roomId) return "/rooms";
  if (!draft.date || !draft.startTime || !draft.endTime) {
    return `/booking/${encodeURIComponent(draft.roomId)}/date-time`;
  }
  return "";
}

function BookingInformationPage({ loadRoom = fetchRoom }) {
  const navigate = useNavigate();
  const { user, recoverUnauthorized } = useAuth();
  const { draft, editingReservationId, dispatch } = useBookingDraft();
  const guardRoute = getInformationGuardRoute(draft);
  const [requestVersion, setRequestVersion] = useState(0);
  const [informationValid, setInformationValid] = useState(false);
  const [feedback] = useState(
    () => sessionStorage.getItem("bookingFeedback") || "",
  );
  const [roomState, setRoomState] = useState({
    status: "loading",
    room: null,
    error: "",
  });

  useEffect(() => {
    if (!guardRoute && feedback) {
      sessionStorage.removeItem("bookingFeedback");
    }
  }, [feedback, guardRoute]);

  useEffect(() => {
    if (guardRoute) return undefined;
    const controller = new AbortController();
    setRoomState({ status: "loading", room: null, error: "" });
    loadRoom(draft.roomId, { signal: controller.signal })
      .then((room) => {
        if (controller.signal.aborted) return;
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
        if (
          error?.status === 404 ||
          error?.data?.code === "ROOM_INACTIVE"
        ) {
          dispatch({ type: "changeRoom" });
          sessionStorage.setItem(
            "roomsFeedback",
            "이 회의실은 더 이상 예약할 수 없어요.",
          );
          navigate("/rooms", { replace: true });
          return;
        }
        setRoomState({
          status: "error",
          room: null,
          error: "회의실 정보를 불러오지 못했어요.",
        });
      });
    return () => controller.abort();
  }, [
    dispatch,
    draft.roomId,
    guardRoute,
    loadRoom,
    navigate,
    recoverUnauthorized,
    requestVersion,
  ]);

  if (guardRoute) return <Navigate to={guardRoute} replace />;

  return (
    <BookingStepLayout
      backTo={`/booking/${encodeURIComponent(draft.roomId)}/date-time`}
      backLabel="날짜와 시간 선택으로 돌아가기"
      onExit={() => {
        dispatch({ type: "changeRoom" });
        navigate(editingReservationId ? "/rooms?mode=change" : "/rooms");
      }}
      nextAriaDisabled={!informationValid}
      nextDisabled={roomState.status !== "success"}
      nextForm={FORM_ID}
      nextType="submit"
    >
      <main className="booking-page">
        <p className="booking-step">2/3</p>
        <h2 tabIndex={-1}>
          {editingReservationId
            ? "변경할 예약 정보를 확인해 주세요"
            : "예약 정보를 입력해 주세요"}
        </h2>

        {roomState.status === "loading" ? (
          <p className="booking-content-state" aria-live="polite">
            회의실 정보를 불러오는 중이에요.
          </p>
        ) : null}
        {roomState.status === "error" ? (
          <p
            className="booking-content-state is-error"
            aria-live="polite"
          >
            {roomState.error}{" "}
            <button
              type="button"
              onClick={() => setRequestVersion((version) => version + 1)}
            >
              다시 시도
            </button>
          </p>
        ) : null}
        {roomState.room ? (
          <>
            <section
              className="selected-room-summary"
              aria-label="선택한 회의실"
              aria-live="polite"
            >
              <strong>{roomState.room.name}</strong>
              <span>
                {[
                  roomState.room.location,
                  `최대 ${roomState.room.capacity}명`,
                  ...roomState.room.facilities,
                ].join(", ")}
              </span>
            </section>
            <BookingInformationForm
              draft={draft}
              room={roomState.room}
              reserverName={user.nickname}
              onValidityChange={setInformationValid}
              onSave={(information) => {
                dispatch({ type: "updateInformation", information });
                navigate("/booking/review");
              }}
            />
          </>
        ) : null}
      </main>
    </BookingStepLayout>
  );
}

export { BookingInformationPage, getInformationGuardRoute };

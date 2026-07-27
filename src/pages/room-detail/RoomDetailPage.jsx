import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchRoom } from "../../api/booking.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { RoomDetail } from "../../entities/room/RoomDetail.jsx";
import { StartBookingButton } from "../../features/book-room/StartBookingButton.jsx";
import { ContentState } from "../../shared/ui/ContentState.jsx";
import { createBookingDraftStore } from "../../utils/booking-draft.js";

function RoomDetailPage({ loadRoom = fetchRoom }) {
  const { recoverUnauthorized } = useAuth();
  const navigate = useNavigate();
  const { roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({
    status: "loading",
    room: null,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", room: null, error: "" });

    loadRoom(roomId, { signal: controller.signal })
      .then((room) => {
        if (!controller.signal.aborted) {
          setState({ status: "success", room, error: "" });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted || recoverUnauthorized(error)) return;
        const unavailable = error.data?.code === "ROOM_INACTIVE";
        let errorMessage = "회의실 정보를 불러오지 못했어요.";
        if (error.status === 404) errorMessage = "회의실을 찾을 수 없어요.";
        if (unavailable) errorMessage = "현재 예약할 수 없는 회의실이에요.";
        setState({
          status: error.status === 404 || unavailable ? "not-found" : "error",
          room: null,
          error: errorMessage,
        });
      });

    return () => controller.abort();
  }, [loadRoom, recoverUnauthorized, roomId]);

  if (state.status === "not-found" || state.status === "error") {
    return (
      <main className="booking-body booking-page room-detail-page">
        <h1 tabIndex={-1}>회의실 상세</h1>
        <section className="booking-content-state is-error" aria-live="polite">
          <p>{state.error}</p>
          <Link to="/rooms">회의실 목록으로</Link>
        </section>
      </main>
    );
  }

  const room = state.room;
  const store = createBookingDraftStore(sessionStorage);
  const editing =
    searchParams.get("mode") === "change" &&
    Boolean(store.getEditingReservationId());

  function startBooking(selectedRoom) {
    const roomDraft = {
      roomId: selectedRoom.roomId,
      roomName: selectedRoom.name,
      roomCapacity: selectedRoom.capacity,
    };

    if (editing) {
      store.changeRoom();
      store.update(roomDraft);
    } else {
      store.startBooking(roomDraft);
    }
    navigate(`/booking/${encodeURIComponent(selectedRoom.roomId)}/date-time`);
  }

  return (
    <div className="booking-body booking-app-shell room-detail-shell">
      <main className="booking-page room-detail-page">
        <h1 tabIndex={-1}>회의실 상세</h1>
        <ContentState
          status={state.status}
          loadingMessage="회의실 정보를 불러오는 중이에요."
        >
          {room ? (
            <>
              {!room.active ? (
                <p className="booking-content-state" aria-live="polite">
                  현재 예약할 수 없는 회의실이에요.
                </p>
              ) : null}
              <RoomDetail room={room} />
            </>
          ) : null}
        </ContentState>
      </main>
      {room ? (
        <footer className="booking-footer">
          <StartBookingButton
            room={room}
            mode={editing ? "change" : "create"}
            onStart={startBooking}
          />
        </footer>
      ) : null}
    </div>
  );
}

export { RoomDetailPage };

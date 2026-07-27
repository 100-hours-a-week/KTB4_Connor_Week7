import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { fetchRooms } from "../../api/booking.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { RoomCard } from "../../entities/room/RoomCard.jsx";
import { ContentState } from "../../shared/ui/ContentState.jsx";
import { createBookingDraftStore } from "../../utils/booking-draft.js";

function RoomsPage({ loadRooms = fetchRooms }) {
  const { recoverUnauthorized } = useAuth();
  const [searchParams] = useSearchParams();
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    rooms: [],
    error: "",
  });
  const store = useMemo(
    () => createBookingDraftStore(sessionStorage),
    [],
  );
  const editing =
    searchParams.get("mode") === "change" &&
    Boolean(store.getEditingReservationId());

  useEffect(() => {
    if (!editing) store.clear();
  }, [editing, store]);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", rooms: [], error: "" });

    loadRooms({ signal: controller.signal })
      .then((rooms) => {
        if (controller.signal.aborted) return;
        setState({
          status: rooms.length ? "success" : "empty",
          rooms,
          error: "",
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || recoverUnauthorized(error)) return;
        setState({
          status: "error",
          rooms: [],
          error: error.message || "회의실을 불러오지 못했어요.",
        });
      });

    return () => controller.abort();
  }, [loadRooms, recoverUnauthorized, requestVersion]);

  return (
    <main className="booking-body booking-app-shell is-navigation-free booking-page rooms-page">
      <div className="rooms-introduction">
        <h1 tabIndex={-1}>회의실</h1>
        <h2>어떤 회의실을 이용할까요?</h2>
        <p className="booking-page-description">
          공간을 선택하면 예약 가능한 시간을 확인할 수 있어요.
        </p>
      </div>
      <ContentState
        status={state.status}
        loadingMessage="회의실을 불러오는 중이에요."
        emptyMessage="예약 가능한 회의실이 없어요."
        errorMessage="회의실을 불러오지 못했어요."
        onRetry={() => setRequestVersion((version) => version + 1)}
      >
        <section className="rooms-card-list" aria-label="회의실 목록">
          {state.rooms.map((item) => (
            <RoomCard key={item.roomId} room={item} editing={editing} />
          ))}
        </section>
      </ContentState>
    </main>
  );
}

export { RoomsPage };

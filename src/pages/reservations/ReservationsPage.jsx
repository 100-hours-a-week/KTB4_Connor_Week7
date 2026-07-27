import { useEffect, useRef, useState } from "react";
import { fetchMyReservations } from "../../api/booking.js";
import { useAuth } from "../../app/providers/AuthProvider.jsx";
import { ReservationCard } from "../../entities/reservation/ReservationCard.jsx";
import { ReservationStatusFilter } from "../../features/manage-reservation/ReservationStatusFilter.jsx";
import { ContentState } from "../../shared/ui/ContentState.jsx";

const PAGE_SIZE = 5;
const summaryLabels = {
  UPCOMING: "다가오는 예약",
  PAST: "완료한 예약",
  CANCELED: "취소한 예약",
};
const emptyMessages = {
  UPCOMING: "예정된 예약이 없어요.",
  PAST: "완료된 예약이 없어요.",
  CANCELED: "취소된 예약이 없어요.",
};

function mergeReservations(current, incoming) {
  const byId = new Map(current.map((reservation) => [reservation.reservationId, reservation]));
  incoming.forEach((reservation) => byId.set(reservation.reservationId, reservation));
  return [...byId.values()];
}

function ReservationsPage({ loadReservations = fetchMyReservations }) {
  const { recoverUnauthorized } = useAuth();
  const [state, setState] = useState({
    statusFilter: "UPCOMING",
    status: "loading",
    items: [],
    nextCursor: null,
  });
  const requestRef = useRef({
    id: 0,
    status: "UPCOMING",
    controller: null,
    loading: false,
    mounted: true,
  });

  function loadPage({ status = state.statusFilter, reset = false } = {}) {
    if (requestRef.current.loading && !reset) return;

    requestRef.current.controller?.abort();
    const requestId = requestRef.current.id + 1;
    const controller = new AbortController();
    const cursor = reset ? "" : state.nextCursor || "";
    requestRef.current = {
      id: requestId,
      status,
      controller,
      loading: true,
      mounted: requestRef.current.mounted,
    };
    setState((current) => ({
      ...current,
      statusFilter: status,
      status: "loading",
      items: reset ? [] : current.items,
      nextCursor: reset ? null : current.nextCursor,
    }));

    loadReservations({
      status,
      cursor,
      size: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((page) => {
        if (
          controller.signal.aborted ||
          !requestRef.current.mounted ||
          requestRef.current.id !== requestId ||
          requestRef.current.status !== status
        ) {
          return;
        }
        setState((current) => {
          const items = mergeReservations(reset ? [] : current.items, page.items);
          return {
            statusFilter: status,
            status: items.length ? "success" : "empty",
            items,
            nextCursor: page.nextCursor,
          };
        });
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          !requestRef.current.mounted ||
          requestRef.current.id !== requestId
        ) {
          return;
        }
        if (recoverUnauthorized(error)) return;
        setState((current) => ({ ...current, status: "error" }));
      })
      .finally(() => {
        if (requestRef.current.id === requestId) {
          requestRef.current.loading = false;
          requestRef.current.controller = null;
        }
      });
  }

  useEffect(() => {
    requestRef.current.mounted = true;
    loadPage({ status: "UPCOMING", reset: true });
    return () => {
      requestRef.current.mounted = false;
      requestRef.current.controller?.abort();
      requestRef.current.id += 1;
    };
  }, [loadReservations]);

  const contentStatus = state.items.length > 0 ? "success" : state.status;

  return (
    <div className="booking-body booking-app-shell is-navigation-free">
      <main className="booking-page reservations-page">
        <h1 tabIndex={-1}>내 예약</h1>
        <h2 className="visually-hidden">예약 상태별 내역</h2>
        <ReservationStatusFilter
          value={state.statusFilter}
          onChange={(status) => loadPage({ status, reset: true })}
        />
        <section className="reservation-summary" aria-live="polite">
          <span>{summaryLabels[state.statusFilter]}</span>
          <strong>{state.items.length}건</strong>
        </section>
        <ContentState
          status={contentStatus}
          loadingMessage="예약 목록을 불러오는 중이에요."
          emptyMessage={emptyMessages[state.statusFilter]}
          errorMessage="예약 목록을 불러오지 못했어요."
          onRetry={() => loadPage({
            status: state.statusFilter,
            reset: state.items.length === 0,
          })}
        >
          <section className="reservation-card-list" aria-label="내 예약 목록">
            {state.items.map((reservation) => (
              <ReservationCard
                key={reservation.reservationId}
                reservation={reservation}
              />
            ))}
          </section>
        </ContentState>
        {state.items.length > 0 && state.status === "loading" ? (
          <p aria-live="polite">예약 목록을 더 불러오는 중이에요.</p>
        ) : null}
        {state.items.length > 0 && state.status === "error" ? (
          <p className="booking-content-state is-error" aria-live="polite">
            예약 목록을 더 불러오지 못했어요. <button type="button" onClick={() => loadPage()}>
              다시 시도
            </button>
          </p>
        ) : null}
        {state.nextCursor ? (
          <button
            className="reservation-load-more"
            type="button"
            disabled={state.status === "loading"}
            onClick={() => loadPage()}
          >
            더 보기
          </button>
        ) : null}
      </main>
    </div>
  );
}

export { ReservationsPage };

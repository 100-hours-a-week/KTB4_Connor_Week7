import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { fetchReservation } from "../../api/booking.js";
import { useAuth } from "../../app/providers/AuthProvider.jsx";
import { ReservationDetail } from "../../entities/reservation/ReservationDetail.jsx";

function ReservationDetailPage({ loadReservation = fetchReservation }) {
  const { reservationId = "" } = useParams();
  const { recoverUnauthorized } = useAuth();
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    reservation: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    if (!reservationId) {
      setState({ status: "notFound", reservation: null });
      return () => controller.abort();
    }

    setState({ status: "loading", reservation: null });
    loadReservation(reservationId, { signal: controller.signal })
      .then((reservation) => {
        if (!controller.signal.aborted) {
          setState({ status: "success", reservation });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted || recoverUnauthorized(error)) return;
        setState({
          status:
            error?.status === 403
              ? "forbidden"
              : error?.status === 404
                ? "notFound"
                : "error",
          reservation: null,
        });
      });

    return () => controller.abort();
  }, [loadReservation, requestVersion, reservationId]);

  function renderState() {
    if (state.status === "loading") {
      return <p className="booking-content-state" aria-live="polite">예약 정보를 불러오는 중이에요.</p>;
    }
    if (state.status === "forbidden") {
      return (
        <p className="booking-content-state is-error" aria-live="polite">
          이 예약을 확인할 권한이 없어요.
        </p>
      );
    }
    if (state.status === "notFound") {
      return (
        <p className="booking-content-state is-error" aria-live="polite">
          예약을 찾을 수 없어요.
        </p>
      );
    }
    if (state.status === "error") {
      return (
        <section className="booking-content-state is-error" aria-live="polite">
          <p>예약 정보를 불러오지 못했어요.</p>
          <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>
            다시 시도
          </button>
        </section>
      );
    }
    return <ReservationDetail reservation={state.reservation} />;
  }

  return (
    <div className="booking-body booking-app-shell is-navigation-free">
      <main className="booking-page reservation-detail-page">
        <h1 tabIndex={-1}>예약 상세</h1>
        {renderState()}
      </main>
    </div>
  );
}

export { ReservationDetailPage };

import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { fetchReservation } from "../../api/booking.js";
import { useAuth } from "../../features/auth/AuthProvider.jsx";
import { BookingConfirmationSummary } from "../../features/booking/components/BookingConfirmationSummary.jsx";

function BookingConfirmedPage({
  loadReservation = fetchReservation,
}) {
  const { reservationId } = useParams();
  const { state: navigationState } = useLocation();
  const { recoverUnauthorized, user } = useAuth();
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState(() => ({
    status: navigationState?.reservation ? "success" : "loading",
    reservation: navigationState?.reservation || null,
    refreshError: false,
  }));

  useEffect(() => {
    const controller = new AbortController();
    if (!navigationState?.reservation) {
      setState({
        status: "loading",
        reservation: null,
        refreshError: false,
      });
    }
    loadReservation(reservationId, { signal: controller.signal })
      .then((reservation) => {
        if (!controller.signal.aborted) {
          setState({
            status: "success",
            reservation,
            refreshError: false,
          });
        }
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          recoverUnauthorized(error)
        ) {
          return;
        }
        if (
          navigationState?.reservation &&
          error?.status !== 403 &&
          error?.status !== 404
        ) {
          setState((current) => ({ ...current, refreshError: true }));
          return;
        }
        let status = "error";
        if (error?.status === 403) status = "forbidden";
        if (error?.status === 404) status = "notFound";
        setState({ status, reservation: null, refreshError: false });
      });
    return () => controller.abort();
  }, [
    loadReservation,
    navigationState?.reservation,
    recoverUnauthorized,
    requestVersion,
    reservationId,
  ]);

  return (
    <div className="booking-body booking-app-shell booking-confirmed-shell">
      <header className="booking-app-bar">
        <h1>회의실 예약</h1>
        <span />
      </header>
      <main className="booking-page booking-confirmed-page">
        <img
          className="booking-success-icon"
          src="/assets/icons/booking-success-3d.png"
          alt=""
          width="72"
          height="72"
        />
        <h2 tabIndex={-1}>예약 완료</h2>
        <p>내 예약에서 상세 내용을 확인할 수 있어요.</p>
        <BookingConfirmationSummary
          state={state}
          fallbackReserverName={user.nickname}
          onRetry={() => setRequestVersion((version) => version + 1)}
        />
        <Link
          className="booking-secondary-button"
          to="/reservations"
        >
          내 예약 보기
        </Link>
      </main>
      <footer className="booking-footer">
        <Link
          className="booking-primary-link"
          to="/rooms"
        >
          확인
        </Link>
      </footer>
    </div>
  );
}

export { BookingConfirmedPage };

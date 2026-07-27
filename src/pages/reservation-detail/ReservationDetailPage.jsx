import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  cancelReservation,
  fetchReservation,
} from "../../api/booking.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { ReservationDetail } from "../../entities/reservation/ReservationDetail.jsx";
import { CancelReservationButton } from "../../features/manage-reservation/CancelReservationButton.jsx";
import { StartReservationEditButton } from "../../features/manage-reservation/StartReservationEditButton.jsx";

function ReservationDetailPage({
  loadReservation = fetchReservation,
  cancel = cancelReservation,
}) {
  const { reservationId = "" } = useParams();
  const { recoverUnauthorized } = useAuth();
  const actionFeedbackRef = useRef(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [actionError, setActionError] = useState("");
  const [actionsForbidden, setActionsForbidden] = useState(false);
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

    setActionError("");
    setActionsForbidden(false);
    setState({ status: "loading", reservation: null });
    loadReservation(reservationId, { signal: controller.signal })
      .then((reservation) => {
        if (!controller.signal.aborted) {
          setState({ status: "success", reservation });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted || recoverUnauthorized(error)) return;
        let status = "error";
        if (error?.status === 403) status = "forbidden";
        if (error?.status === 404) status = "notFound";
        setState({ status, reservation: null });
      });

    return () => controller.abort();
  }, [
    loadReservation,
    recoverUnauthorized,
    requestVersion,
    reservationId,
  ]);

  useEffect(() => {
    if (actionsForbidden) actionFeedbackRef.current?.focus();
  }, [actionsForbidden]);

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
    const reservation = state.reservation;
    const manageable =
      reservation.status === "CONFIRMED" &&
      new Date(reservation.startAt) > new Date();

    return (
      <>
        <ReservationDetail reservation={reservation} />
        {actionError ? (
          <p
            ref={actionFeedbackRef}
            className="booking-inline-feedback is-error"
            aria-live="assertive"
            tabIndex={-1}
          >
            {actionError}
          </p>
        ) : null}
        {manageable && !actionsForbidden ? (
          <div className="reservation-detail-actions">
            <StartReservationEditButton reservation={reservation} />
            <CancelReservationButton
              reservation={reservation}
              cancel={cancel}
              onCanceled={() =>
                setRequestVersion((version) => version + 1)
              }
              onUnauthorized={recoverUnauthorized}
              onForbidden={(message) => {
                setActionsForbidden(true);
                setActionError(message);
              }}
              onError={setActionError}
            />
          </div>
        ) : null}
      </>
    );
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

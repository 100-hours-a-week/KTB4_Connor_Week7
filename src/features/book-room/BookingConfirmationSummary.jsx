import {
  formatBookingDate,
  formatTime,
} from "../../utils/booking-format.js";

function BookingConfirmationSummary({
  state,
  fallbackReserverName,
  onRetry,
}) {
  if (state.status === "loading") {
    return (
      <section className="confirmed-summary" aria-live="polite">
        예약 결과를 불러오는 중이에요.
      </section>
    );
  }

  if (state.status !== "success") {
    const message =
      state.status === "forbidden"
        ? "이 예약을 확인할 권한이 없어요."
        : state.status === "notFound"
          ? "예약 정보를 찾을 수 없어요."
          : "예약 결과를 불러오지 못했어요.";

    return (
      <section className="confirmed-summary" aria-live="polite">
        <p>{message}</p>
        {state.status === "error" ? (
          <button type="button" onClick={onRetry}>
            다시 시도
          </button>
        ) : null}
      </section>
    );
  }

  const { reservation } = state;
  const date = reservation.startAt.slice(0, 10);
  const startTime = reservation.startAt.slice(11, 16);
  const endTime = reservation.endAt.slice(11, 16);
  const items = [
    ["회의실", reservation.room.name],
    ["예약자", reservation.reserverName || fallbackReserverName || "나"],
    ["날짜", formatBookingDate(date)],
    ["시간", `${formatTime(startTime)}~${formatTime(endTime)}`],
    [
      "예약 정보",
      `${reservation.topic} (${reservation.attendees.length}명)`,
    ],
  ];

  return (
    <section className="confirmed-summary" aria-live="polite">
      <dl className="confirmed-summary-list">
        {items.map(([label, value]) => (
          <div className="confirmed-summary-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export { BookingConfirmationSummary };

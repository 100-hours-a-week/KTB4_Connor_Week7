import {
  formatBookingDate,
  formatDuration,
  formatTime,
} from "../../utils/booking-format.js";

function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function BookingScheduleSummary({ date, startTime, endTime }) {
  let schedule = "날짜를 선택해 주세요";
  let duration = "";

  if (date && (!startTime || !endTime)) {
    schedule = `${formatBookingDate(date)} 시간을 선택해 주세요`;
  }
  if (date && startTime && endTime) {
    schedule = `${formatBookingDate(date)} ${formatTime(startTime)}~${formatTime(endTime)}`;
    duration = formatDuration(toMinutes(endTime) - toMinutes(startTime));
  }

  return (
    <section className="booking-selection-summary" aria-live="polite">
      <span className="booking-summary-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        </svg>
      </span>
      <div>
        <strong>{schedule}</strong>
        <span>{duration}</span>
      </div>
    </section>
  );
}

export { BookingScheduleSummary };

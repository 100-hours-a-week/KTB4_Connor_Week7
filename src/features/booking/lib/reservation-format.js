import { formatBookingSchedule } from "./booking-format.js";

const RESERVATION_STATUS_LABELS = {
  CONFIRMED: "예약 완료",
  COMPLETED: "이용 완료",
  CANCELED_BY_USER: "예약 취소",
};

function formatReservationSchedule({ startAt, endAt }) {
  return formatBookingSchedule({
    date: startAt.slice(0, 10),
    startTime: startAt.slice(11, 16),
    endTime: endAt.slice(11, 16),
  });
}

function formatReservationTimestamp(value) {
  if (!value) return "정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getReservationStatusLabel(status) {
  return RESERVATION_STATUS_LABELS[status] || status;
}

export { formatReservationSchedule, formatReservationTimestamp, getReservationStatusLabel };

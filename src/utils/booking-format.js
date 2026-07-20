const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatBookingDate(dateString) {
  const date = parseLocalDate(dateString);
  return `${date.getMonth() + 1}. ${date.getDate()}(${KOREAN_WEEKDAYS[date.getDay()]})`;
}

function formatTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;
  return `${period} ${displayHour}:${String(minute).padStart(2, "0")}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}분 이용`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분 이용` : `${hours}시간 이용`;
}

function formatBookingSchedule({ date, startTime, endTime }) {
  return `${formatBookingDate(date)} · ${formatTime(startTime)}~${formatTime(endTime)}`;
}

export { formatBookingDate, formatBookingSchedule, formatDuration, formatTime, parseLocalDate };

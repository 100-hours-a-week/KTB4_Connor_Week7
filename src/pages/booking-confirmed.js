import { fetchReservation } from "../api/booking.js";
import { formatBookingDate, formatTime } from "../utils/booking-format.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h2");
const summary = document.querySelector("[data-confirmed-summary]");
const newBookingLink = document.querySelector("[data-new-booking]");
const myReservationsLink = document.querySelector("[data-my-reservations]");

function readLastConfirmedReservation(reservationId) {
  try {
    const reservation = JSON.parse(sessionStorage.getItem("lastConfirmedReservation") || "null");
    return reservation?.reservationId === reservationId ? reservation : null;
  } catch {
    return null;
  }
}

function renderReservation(reservation) {
  const date = reservation.startAt.slice(0, 10);
  const startTime = reservation.startAt.slice(11, 16);
  const endTime = reservation.endAt.slice(11, 16);
  const details = [
    ["회의실", reservation.room.name],
    ["예약자", reservation.reserverName || sessionStorage.getItem("nickname") || "나"],
    ["날짜", formatBookingDate(date)],
    ["시간", `${formatTime(startTime)}~${formatTime(endTime)}`],
    ["예약 정보", `${reservation.topic} (${reservation.attendees.length}명)`],
  ];
  const list = document.createElement("dl");
  list.className = "confirmed-summary-list";

  details.forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    row.className = "confirmed-summary-row";
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    list.append(row);
  });

  summary.replaceChildren(list);
}

async function loadReservation() {
  const reservationId = new URLSearchParams(globalThis.location.search).get("reservationId");
  if (!reservationId) {
    summary.textContent = "예약 정보가 없어요. 새 예약을 시작해 주세요.";
    return;
  }
  const lastConfirmedReservation = readLastConfirmedReservation(reservationId);
  if (lastConfirmedReservation) renderReservation(lastConfirmedReservation);

  try {
    renderReservation(await fetchReservation(reservationId));
  } catch (error) {
    if (handleUnauthorized(error)) return;
    if (lastConfirmedReservation) return;
    if (error.status === 403) {
      summary.textContent = "이 예약을 확인할 권한이 없어요.";
      return;
    }
    summary.hidden = true;
  }
}

newBookingLink.href = routes.rooms;
myReservationsLink.href = routes.reservations;
newBookingLink.addEventListener("click", () => sessionStorage.removeItem("lastConfirmedReservation"));
if (requireAccessToken()) {
  heading.focus();
  loadReservation();
}

import { fetchReservation } from "../api/booking.js";
import { formatBookingSchedule } from "../utils/booking-format.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h2");
const summary = document.querySelector("[data-confirmed-summary]");
const reservationNumber = document.querySelector("[data-reservation-number]");
const newBookingLink = document.querySelector("[data-new-booking]");
const myReservationsLink = document.querySelector("[data-my-reservations]");

function renderReservation(reservation) {
  const date = reservation.startAt.slice(0, 10);
  const startTime = reservation.startAt.slice(11, 16);
  const endTime = reservation.endAt.slice(11, 16);
  const roomName = document.createElement("strong");
  const schedule = document.createElement("span");
  const topic = document.createElement("span");
  roomName.textContent = reservation.room.name;
  schedule.textContent = formatBookingSchedule({ date, startTime, endTime });
  topic.textContent = `${reservation.topic} · ${reservation.attendees.length}명`;
  summary.replaceChildren(roomName, schedule, topic);
  reservationNumber.textContent = `예약 번호 ${reservation.reservationId}`;
}

async function loadReservation() {
  const reservationId = new URLSearchParams(globalThis.location.search).get("reservationId");
  if (!reservationId) {
    summary.textContent = "예약 번호가 없어요. 새 예약을 시작해 주세요.";
    return;
  }

  try {
    renderReservation(await fetchReservation(reservationId));
  } catch (error) {
    if (handleUnauthorized(error)) return;
    summary.textContent =
      error.status === 403
        ? "이 예약을 확인할 권한이 없어요."
        : "예약 결과를 찾을 수 없어요. 새 예약을 시작해 주세요.";
  }
}

newBookingLink.href = routes.rooms;
myReservationsLink.href = routes.reservations;
newBookingLink.addEventListener("click", () => sessionStorage.removeItem("lastConfirmedReservation"));
if (requireAccessToken()) {
  heading.focus();
  loadReservation();
}

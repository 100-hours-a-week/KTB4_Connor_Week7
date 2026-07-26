import { fetchMyReservations } from "../api/booking.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { formatReservationSchedule } from "../utils/reservation-format.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h1");
const filterButtons = [...document.querySelectorAll("[data-reservation-filter]")];
const reservationState = document.querySelector("[data-reservation-state]");
const reservationList = document.querySelector("[data-reservation-list]");
const loadMoreButton = document.querySelector("[data-load-more]");
const reservationSummaryLabel = document.querySelector("[data-reservation-summary-label]");
const reservationSummaryCount = document.querySelector("[data-reservation-summary-count]");

const summaryLabels = {
  UPCOMING: "다가오는 예약",
  PAST: "완료한 예약",
  CANCELED: "취소한 예약",
};

let activeStatus = "UPCOMING";
let nextCursor = null;
let loading = false;
let requestController = null;
let requestSequence = 0;

function createReservationImage(room) {
  if (room.imageUrl) {
    const image = document.createElement("img");
    image.className = "reservation-card-image";
    image.src = room.imageUrl;
    image.alt = `${room.name} 대표 이미지`;
    image.loading = "lazy";
    return image;
  }
  const placeholder = document.createElement("span");
  placeholder.className = "reservation-card-image reservation-card-image-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.textContent = room.name.slice(0, 1);
  return placeholder;
}

function createReservationCard(reservation) {
  const link = document.createElement("a");
  link.className = "reservation-card";
  link.href = routes.reservationDetail(reservation.reservationId);

  const content = document.createElement("span");
  content.className = "reservation-card-content";
  const headingRow = document.createElement("span");
  headingRow.className = "reservation-card-heading";
  const roomName = document.createElement("strong");
  roomName.textContent = reservation.room.name;
  const schedule = document.createElement("span");
  schedule.textContent = formatReservationSchedule(reservation);
  const topic = document.createElement("span");
  topic.className = "reservation-card-topic";
  topic.textContent = reservation.topic;
  const attendeeCount = document.createElement("span");
  attendeeCount.textContent = `참석자 ${reservation.attendees.length}명`;
  headingRow.append(roomName);
  content.append(headingRow, schedule, topic, attendeeCount);
  link.append(createReservationImage(reservation.room), content);
  return link;
}

function updateSummary() {
  reservationSummaryLabel.textContent = summaryLabels[activeStatus];
  reservationSummaryCount.textContent = `${reservationList.children.length}건`;
}

function showState(message, { error = false } = {}) {
  reservationState.hidden = false;
  reservationState.className = error
    ? "booking-content-state is-error"
    : "booking-content-state";
  reservationState.textContent = message;
}

function showLoadError() {
  showState("예약 목록을 불러오지 못했어요. ", { error: true });
  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "다시 시도";
  retryButton.addEventListener("click", () => loadReservations({ reset: reservationList.children.length === 0 }));
  reservationState.append(retryButton);
}

async function loadReservations({ reset = false } = {}) {
  if (loading && !reset) return;
  const requestId = requestSequence + 1;
  requestSequence = requestId;
  const requestedStatus = activeStatus;
  loading = true;
  loadMoreButton.disabled = true;
  requestController?.abort();
  requestController = new AbortController();
  if (reset) {
    reservationList.replaceChildren();
    nextCursor = null;
    updateSummary();
    showState("예약 목록을 불러오는 중이에요.");
  }

  try {
    const page = await fetchMyReservations({
      status: requestedStatus,
      cursor: reset ? "" : nextCursor || "",
      size: 5,
      signal: requestController.signal,
    });
    if (requestId !== requestSequence || requestedStatus !== activeStatus) return;
    page.items.forEach((reservation) => reservationList.append(createReservationCard(reservation)));
    updateSummary();
    nextCursor = page.nextCursor;
    loadMoreButton.hidden = !nextCursor;
    if (reservationList.children.length === 0) {
      showState(
        activeStatus === "UPCOMING"
          ? "예정된 예약이 없어요."
          : activeStatus === "PAST"
            ? "완료된 예약이 없어요."
            : "취소된 예약이 없어요.",
      );
    } else {
      reservationState.hidden = true;
    }
  } catch (error) {
    if (requestId !== requestSequence || error.name === "AbortError" || handleUnauthorized(error)) return;
    showLoadError();
  } finally {
    if (requestId === requestSequence) {
      loading = false;
      loadMoreButton.disabled = false;
    }
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.reservationFilter;
    filterButtons.forEach((candidate) =>
      candidate.setAttribute("aria-pressed", String(candidate === button)),
    );
    reservationSummaryLabel.textContent = summaryLabels[activeStatus];
    loadReservations({ reset: true });
  });
});

loadMoreButton.addEventListener("click", () => loadReservations());

if (requireAccessToken()) {
  bookingDraftStore.clear();
  heading.focus();
  loadReservations({ reset: true });
}

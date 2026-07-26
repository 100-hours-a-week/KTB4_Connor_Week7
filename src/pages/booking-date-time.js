import { fetchRoomDaySlots, fetchRoomMonthAvailability } from "../api/booking.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import {
  formatBookingDate,
  formatDuration,
  formatTime,
  parseLocalDate,
} from "../utils/booking-format.js";
import { selectTimeRange } from "../utils/booking-time.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h2");
const roomDetailLink = document.querySelector("[data-room-detail-link]");
const selectedRoomName = document.querySelector("[data-selected-room-name]");
const changeRoomButton = document.querySelector("[data-change-room]");
const bookingFeedback = document.querySelector("[data-booking-feedback]");
const calendarHeading = document.querySelector("[data-calendar-heading]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const calendarState = document.querySelector("[data-calendar-state]");
const previousMonthButton = document.querySelector("[data-previous-month]");
const nextMonthButton = document.querySelector("[data-next-month]");
const timeline = document.querySelector("[data-timeline]");
const timelineState = document.querySelector("[data-timeline-state]");
const timeHelper = document.querySelector("[data-time-helper]");
const scheduleSummary = document.querySelector("[data-schedule-summary]");
const durationSummary = document.querySelector("[data-duration-summary]");
const nextButton = document.querySelector("[data-next-button]");

const today = new Date();
today.setHours(0, 0, 0, 0);
const draft = bookingDraftStore.read();
const editingReservationId = bookingDraftStore.getEditingReservationId();
const routeRoomId = new URLSearchParams(globalThis.location.search).get("roomId");
const validRoomDraft = Boolean(routeRoomId && routeRoomId === draft.roomId && draft.roomName);
const initialMonth = draft.date ? parseLocalDate(draft.date) : today;
let visibleMonth = new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1);
let slots = [];
let maximumDurationMinutes = 120;
let currentRange = null;
let pointerAnchorIndex = null;
let pointerMoved = false;

function syncMonthButtons() {
  const isCurrentMonth =
    visibleMonth.getFullYear() === today.getFullYear() &&
    visibleMonth.getMonth() === today.getMonth();
  previousMonthButton.disabled = isCurrentMonth;
  nextMonthButton.disabled = false;
}

function renderSummary() {
  const currentDraft = bookingDraftStore.read();
  if (!currentDraft.date) {
    scheduleSummary.textContent = "날짜를 선택해 주세요";
    durationSummary.textContent = "";
    return;
  }

  if (!currentDraft.startTime || !currentDraft.endTime) {
    scheduleSummary.textContent = `${formatBookingDate(currentDraft.date)} 시간을 선택해 주세요`;
    durationSummary.textContent = "";
    return;
  }

  scheduleSummary.textContent = `${formatBookingDate(currentDraft.date)} ${formatTime(currentDraft.startTime)}~${formatTime(currentDraft.endTime)}`;
  durationSummary.textContent = formatDuration(currentRange?.durationMinutes || 30);
}

function getSelectedBounds() {
  if (!currentRange) return { firstIndex: -1, lastIndex: -1 };
  return {
    firstIndex: slots.findIndex((slot) => slot.startTime === currentRange.startTime),
    lastIndex: slots.findIndex((slot) => slot.endTime === currentRange.endTime),
  };
}

function syncTimelineSelection() {
  const { firstIndex, lastIndex } = getSelectedBounds();
  timeline.querySelectorAll(".timeline-slot").forEach((button, index) => {
    const selected = index >= firstIndex && index <= lastIndex;
    button.classList.toggle("is-selected", selected);
    button.classList.toggle("is-start-handle", selected && index === firstIndex);
    button.classList.toggle("is-end-handle", selected && index === lastIndex);
    button.setAttribute("aria-pressed", String(selected));
    if (selected && (index === firstIndex || index === lastIndex)) {
      button.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight");
    } else {
      button.removeAttribute("aria-keyshortcuts");
    }
  });
}

function applyRange(anchorIndex, targetIndex) {
  const nextRange = selectTimeRange(slots, anchorIndex, targetIndex, maximumDurationMinutes);
  if (!nextRange) return;

  currentRange = nextRange;
  bookingDraftStore.update({ startTime: nextRange.startTime, endTime: nextRange.endTime });
  nextButton.disabled = false;
  timeHelper.textContent =
    nextRange.limitedBy === "duration"
      ? "최대 2시간까지 예약할 수 있어요."
      : nextRange.limitedBy === "availability"
        ? "이 시간에는 예약할 수 없어요."
        : "";
  syncTimelineSelection();
  renderSummary();
}

function closestSlotIndex(clientX, clientY) {
  const directTarget = document.elementFromPoint(clientX, clientY)?.closest(".timeline-slot");
  if (directTarget) return Number(directTarget.dataset.slotIndex);

  const buttons = [...timeline.querySelectorAll(".timeline-slot:not(:disabled)")];
  return Number(
    buttons.reduce((closest, button) => {
      const bounds = button.getBoundingClientRect();
      const distance = Math.abs(clientX - (bounds.left + bounds.width / 2));
      return !closest || distance < closest.distance
        ? { distance, index: button.dataset.slotIndex }
        : closest;
    }, null)?.index,
  );
}

function handlePointerDown(event) {
  const button = event.target.closest(".timeline-slot:not(:disabled)");
  if (!button) return;
  pointerAnchorIndex = Number(button.dataset.slotIndex);
  pointerMoved = false;
  timeline.setPointerCapture(event.pointerId);
  applyRange(pointerAnchorIndex, pointerAnchorIndex);
}

function handleMouseDown(event) {
  const button = event.target.closest(".timeline-slot:not(:disabled)");
  if (!button) return;
  pointerAnchorIndex = Number(button.dataset.slotIndex);
  pointerMoved = false;
  applyRange(pointerAnchorIndex, pointerAnchorIndex);
}

function handleMouseMove(event) {
  if (pointerAnchorIndex == null || event.buttons !== 1) return;
  const targetIndex = closestSlotIndex(event.clientX, event.clientY);
  if (!Number.isInteger(targetIndex)) return;
  pointerMoved ||= targetIndex !== pointerAnchorIndex;
  applyRange(pointerAnchorIndex, targetIndex);
}

function handleMouseUp() {
  pointerAnchorIndex = null;
}

function handlePointerMove(event) {
  if (pointerAnchorIndex == null || !timeline.hasPointerCapture(event.pointerId)) return;
  const targetIndex = closestSlotIndex(event.clientX, event.clientY);
  if (!Number.isInteger(targetIndex)) return;
  pointerMoved ||= targetIndex !== pointerAnchorIndex;
  applyRange(pointerAnchorIndex, targetIndex);

  const bounds = timeline.getBoundingClientRect();
  if (event.clientX < bounds.left + 36) timeline.scrollBy({ left: -20 });
  if (event.clientX > bounds.right - 36) timeline.scrollBy({ left: 20 });
}

function handlePointerEnd(event) {
  if (timeline.hasPointerCapture(event.pointerId)) timeline.releasePointerCapture(event.pointerId);
  pointerAnchorIndex = null;
}

function handleTimelineClick(event) {
  const button = event.target.closest(".timeline-slot:not(:disabled)");
  if (!button || pointerMoved) return;
  const index = Number(button.dataset.slotIndex);
  applyRange(index, index);
}

function handleTimelineKeydown(event) {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const button = event.target.closest(".timeline-slot");
  if (!button || !button.classList.contains("is-selected")) return;

  const { firstIndex, lastIndex } = getSelectedBounds();
  const index = Number(button.dataset.slotIndex);
  const delta = event.key === "ArrowLeft" ? -1 : 1;
  let nextFirst = firstIndex;
  let nextLast = lastIndex;

  if (index === firstIndex) nextFirst = Math.min(firstIndex + delta, lastIndex);
  if (index === lastIndex) nextLast = Math.max(lastIndex + delta, firstIndex);
  if (!slots[nextFirst] || !slots[nextLast]) return;

  event.preventDefault();
  applyRange(nextFirst, nextLast);
  timeline.querySelector(`[data-slot-index="${index === firstIndex ? nextFirst : nextLast}"]`)?.focus();
}

function renderTimeline() {
  timeline.replaceChildren();
  slots.forEach((slot, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "timeline-slot";
    button.dataset.slotIndex = index;
    button.textContent = slot.startTime;
    button.disabled = slot.state !== "AVAILABLE";
    button.setAttribute("aria-pressed", "false");
    if (button.disabled) button.setAttribute("aria-label", `${slot.startTime}, 예약 불가`);
    timeline.append(button);
  });
  timeline.hidden = false;
  timelineState.hidden = true;

  const currentDraft = bookingDraftStore.read();
  const startIndex = slots.findIndex((slot) => slot.startTime === currentDraft.startTime);
  const endIndex = slots.findIndex((slot) => slot.endTime === currentDraft.endTime);
  if (startIndex >= 0 && endIndex >= startIndex) applyRange(startIndex, endIndex);
}

function renderRetry(container, message, retry) {
  container.textContent = `${message} `;
  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "다시 시도";
  retryButton.addEventListener("click", retry);
  container.append(retryButton);
}

function handleInactiveRoom(error) {
  if (error?.data?.code !== "ROOM_INACTIVE") return false;
  sessionStorage.setItem("roomsFeedback", "이 회의실은 더 이상 예약할 수 없어요.");
  globalThis.location.replace(routes.rooms);
  return true;
}

async function loadDay(date) {
  timeline.hidden = true;
  timelineState.hidden = false;
  timelineState.textContent = "시간 정보를 불러오는 중이에요.";
  nextButton.disabled = true;
  timeHelper.textContent = "";
  currentRange = null;
  try {
    const data = await fetchRoomDaySlots({ roomId: draft.roomId, date });
    slots = data.slots;
    maximumDurationMinutes = data.maximumDurationMinutes || 120;
    if (slots.every((slot) => slot.state !== "AVAILABLE")) {
      timelineState.textContent = "이 날짜에는 예약 가능한 시간이 없어요.";
      return;
    }
    renderTimeline();
  } catch (error) {
    if (handleUnauthorized(error)) return;
    if (handleInactiveRoom(error)) return;
    renderRetry(timelineState, "시간 정보를 불러오지 못했어요.", () => loadDay(date));
  }
}

function selectDate(date) {
  const currentDraft = bookingDraftStore.read();
  if (currentDraft.date !== date) {
    bookingDraftStore.update({ date, startTime: "", endTime: "" });
  }
  calendarGrid.querySelectorAll(".calendar-date").forEach((button) => {
    const selected = button.dataset.date === date;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderSummary();
  loadDay(date);
}

function renderCalendar(data) {
  calendarGrid.replaceChildren();
  const firstWeekday = new Date(data.year, data.month - 1, 1).getDay();
  for (let index = 0; index < firstWeekday; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    calendarGrid.append(spacer);
  }

  const currentDraft = bookingDraftStore.read();
  const statusLabels = {
    CLOSED: "휴무",
    FULL: "마감",
    OUTSIDE: "기간 밖",
    PAST: "지난날",
  };
  data.dates.forEach(({ date, status }) => {
    const parsedDate = parseLocalDate(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-date";
    button.dataset.date = date;
    button.disabled = status !== "AVAILABLE";
    button.dataset.status = status.toLowerCase();
    button.setAttribute("aria-pressed", String(date === currentDraft.date));
    button.classList.toggle("is-selected", date === currentDraft.date);
    const dayNumber = document.createElement("span");
    dayNumber.textContent = parsedDate.getDate();
    button.append(dayNumber);
    if (statusLabels[status]) {
      const statusLabel = document.createElement("small");
      statusLabel.textContent = statusLabels[status];
      button.append(statusLabel);
    }
    if (date === new Date().toLocaleDateString("sv-SE")) {
      button.classList.add("is-today");
      button.setAttribute("aria-label", `오늘 ${parsedDate.getDate()}일`);
    }
    button.addEventListener("click", () => selectDate(date));
    calendarGrid.append(button);
  });
}

async function loadMonth() {
  calendarHeading.textContent = `${visibleMonth.getFullYear()}. ${visibleMonth.getMonth() + 1}`;
  calendarGrid.replaceChildren();
  calendarState.hidden = false;
  calendarState.textContent = "날짜 정보를 불러오는 중이에요.";
  syncMonthButtons();
  try {
    const data = await fetchRoomMonthAvailability({
      roomId: draft.roomId,
      year: visibleMonth.getFullYear(),
      month: visibleMonth.getMonth() + 1,
    });
    renderCalendar(data);
    calendarState.hidden = true;
  } catch (error) {
    if (handleUnauthorized(error)) return;
    if (handleInactiveRoom(error)) return;
    renderRetry(calendarState, "날짜 정보를 불러오지 못했어요.", loadMonth);
  }
}

previousMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  loadMonth();
});
nextMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  loadMonth();
});
document.querySelector("[data-scroll-left]").addEventListener("click", () => timeline.scrollBy({ left: -220, behavior: "smooth" }));
document.querySelector("[data-scroll-right]").addEventListener("click", () => timeline.scrollBy({ left: 220, behavior: "smooth" }));
timeline.addEventListener("pointerdown", handlePointerDown);
timeline.addEventListener("pointermove", handlePointerMove);
timeline.addEventListener("pointerup", handlePointerEnd);
timeline.addEventListener("pointercancel", handlePointerEnd);
timeline.addEventListener("mousedown", handleMouseDown);
timeline.addEventListener("mousemove", handleMouseMove);
globalThis.addEventListener("mouseup", handleMouseUp);
timeline.addEventListener("click", handleTimelineClick);
timeline.addEventListener("keydown", handleTimelineKeydown);
nextButton.addEventListener("click", () => {
  if (!nextButton.disabled) globalThis.location.href = routes.bookingInfo;
});

changeRoomButton.addEventListener("click", () => {
  bookingDraftStore.changeRoom();
  globalThis.location.href = editingReservationId ? routes.roomsForEditing : routes.rooms;
});

if (requireAccessToken()) {
  if (!validRoomDraft) {
    globalThis.location.replace(routeRoomId ? routes.roomDetail(routeRoomId) : routes.rooms);
  } else {
    roomDetailLink.href = editingReservationId
      ? routes.reservationDetail(editingReservationId)
      : routes.roomDetail(draft.roomId);
    if (editingReservationId) roomDetailLink.setAttribute("aria-label", "예약 상세로 돌아가기");
    selectedRoomName.textContent = draft.roomName;
    if (editingReservationId) heading.textContent = "예약 날짜와 시간을 변경해 주세요";
    const feedback = sessionStorage.getItem("bookingFeedback");
    if (feedback) {
      bookingFeedback.hidden = false;
      bookingFeedback.textContent = feedback;
      sessionStorage.removeItem("bookingFeedback");
    }
    heading.focus();
    renderSummary();
    loadMonth().then(() => {
      if (draft.date) loadDay(draft.date);
    });
  }
}

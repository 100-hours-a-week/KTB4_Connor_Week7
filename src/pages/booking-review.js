import { createReservation, fetchRoom, updateReservation } from "../api/booking.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { formatBookingSchedule } from "../utils/booking-format.js";
import { buildReservationPayload, getReservationErrorAction } from "../utils/booking-validation.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h2");
const exitBookingButton = document.querySelector("[data-exit-booking]");
const reviewState = document.querySelector("[data-review-state]");
const reviewList = document.querySelector("[data-review-list]");
const feedback = document.querySelector("[data-review-feedback]");
const confirmButton = document.querySelector("[data-confirm-button]");
const draft = bookingDraftStore.read();
const editingReservationId = bookingDraftStore.getEditingReservationId();
const confirmButtonLabel = editingReservationId ? "예약 변경" : "예약 확정";

const incompleteRoute = !draft.roomId
  ? routes.rooms
  : !draft.date || !draft.startTime || !draft.endTime
    ? routes.bookingDateTime(draft.roomId)
    : !draft.topic.trim() || draft.attendeeChips.length === 0
      ? routes.bookingInfo
      : "";

function addReviewItem(label, value, editRoute, { editable = true } = {}) {
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value || "없음";
  wrapper.append(term, description);
  if (editable) {
    const editLink = document.createElement("a");
    editLink.href = editRoute;
    editLink.textContent = "수정";
    editLink.setAttribute("aria-label", `${label} 수정`);
    wrapper.append(editLink);
  }
  reviewList.append(wrapper);
}

async function renderReview() {
  try {
    const room = await fetchRoom(draft.roomId);
    if (draft.attendeeChips.length > room.capacity) {
      sessionStorage.setItem("bookingFeedback", `최대 ${room.capacity}명까지 이용할 수 있어요.`);
      globalThis.location.replace(routes.bookingInfo);
      return;
    }
    reviewList.replaceChildren();
    bookingDraftStore.update({ roomName: room.name, roomCapacity: room.capacity });
    addReviewItem("회의실", `${room.name} (${room.location})`, routes.rooms, { editable: false });
    addReviewItem("날짜와 시간", formatBookingSchedule(draft), routes.bookingDateTime(draft.roomId));
    addReviewItem("회의 주제", draft.topic.trim(), routes.bookingInfo);
    addReviewItem("참석자", `${draft.attendeeChips.length}명 (${draft.attendeeChips.join(", ")})`, routes.bookingInfo);
    addReviewItem("추가 정보", draft.additionalInfo.trim(), routes.bookingInfo);
    reviewState.hidden = true;
    reviewList.hidden = false;
    confirmButton.disabled = false;
  } catch (error) {
    if (handleUnauthorized(error)) return;
    reviewState.textContent = "예약 내용을 불러오지 못했어요.";
  }
}

async function confirmReservation() {
  if (confirmButton.disabled) return;
  confirmButton.disabled = true;
  confirmButton.textContent = editingReservationId ? "변경 중…" : "예약 중…";
  feedback.hidden = true;
  try {
    const idempotencyKey = globalThis.crypto?.randomUUID?.() || `request-${Date.now()}`;
    const payload = buildReservationPayload(draft, idempotencyKey);
    const reservation = editingReservationId
      ? await updateReservation(editingReservationId, payload)
      : await createReservation(payload);
    sessionStorage.setItem("lastConfirmedReservation", JSON.stringify(reservation));
    bookingDraftStore.clear();
    globalThis.location.href = editingReservationId
      ? routes.reservationDetail(reservation.reservationId)
      : routes.bookingConfirmed(reservation.reservationId);
  } catch (error) {
    if (handleUnauthorized(error)) return;
    if (error.data?.code === "ROOM_INACTIVE") {
      sessionStorage.setItem("roomsFeedback", "이 회의실은 더 이상 예약할 수 없어요.");
      globalThis.location.href = routes.rooms;
      return;
    }
    const action = getReservationErrorAction(error);
    if (action.clearTime) bookingDraftStore.clearTime();
    if (action.step !== "review") {
      sessionStorage.setItem("bookingFeedback", action.message);
      globalThis.location.href = action.step === "dateTime"
        ? routes.bookingDateTime(draft.roomId)
        : routes.bookingInfo;
      return;
    }
    feedback.textContent = action.message;
    feedback.hidden = false;
    confirmButton.disabled = false;
    confirmButton.textContent = confirmButtonLabel;
  }
}

exitBookingButton.addEventListener("click", () => {
  bookingDraftStore.changeRoom();
  globalThis.location.href = editingReservationId ? routes.roomsForEditing : routes.rooms;
});

if (requireAccessToken()) {
  if (incompleteRoute) {
    globalThis.location.replace(incompleteRoute);
  } else {
    if (editingReservationId) heading.textContent = "변경 내용을 확인해 주세요";
    confirmButton.textContent = confirmButtonLabel;
    confirmButton.addEventListener("click", confirmReservation);
    heading.focus();
    renderReview();
  }
}

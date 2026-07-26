import { cancelReservation, fetchReservation } from "../api/booking.js";
import { createConfirmDialog } from "../components/confirm-dialog.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import {
  formatReservationSchedule,
  formatReservationTimestamp,
  getReservationStatusLabel,
} from "../utils/reservation-format.js";
import { routes } from "../utils/routes.js";

const reservationId = new URLSearchParams(globalThis.location.search).get("reservationId");
const reservationState = document.querySelector("[data-reservation-state]");
const reservationDetail = document.querySelector("[data-reservation-detail]");
const statusBadge = document.querySelector("[data-reservation-status]");
const topicHeading = document.querySelector("[data-reservation-topic]");
const summary = document.querySelector("[data-reservation-summary]");
const adminReason = document.querySelector("[data-admin-reason]");
const feedback = document.querySelector("[data-reservation-feedback]");
const actions = document.querySelector("[data-reservation-actions]");
const changeButton = document.querySelector("[data-change-reservation]");
const cancelButton = document.querySelector("[data-cancel-reservation]");
const dialogBackdrop = document.querySelector("[data-cancel-dialog]");
const dialogDescription = document.querySelector("#cancel-dialog-description");
const dialogCancelButton = document.querySelector("[data-dialog-cancel]");
const dialogConfirmButton = document.querySelector("[data-dialog-confirm]");
let reservation = null;

const cancelDialog = createConfirmDialog({
  backdrop: dialogBackdrop,
  cancelButton: dialogCancelButton,
  confirmButton: dialogConfirmButton,
  descriptionElement: dialogDescription,
  returnFocusElement: cancelButton,
});

function addDetailItem(label, value) {
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value || "없음";
  wrapper.append(term, description);
  summary.append(wrapper);
}

function canManageReservation(value) {
  return value.status === "CONFIRMED" && new Date(value.startAt) > new Date();
}

function renderReservation(value) {
  reservation = value;
  statusBadge.className = `reservation-status-badge is-${value.status.toLowerCase()}`;
  statusBadge.textContent = getReservationStatusLabel(value.status);
  topicHeading.textContent = value.topic;
  summary.replaceChildren();
  addDetailItem("회의실", `${value.room.name} (${value.room.location})`);
  addDetailItem("날짜와 시간", formatReservationSchedule(value));
  addDetailItem("참석자", `${value.attendees.length}명 (${value.attendees.join(", ")})`);
  addDetailItem("추가 정보", value.additionalInfo);
  addDetailItem("예약 번호", value.reservationId);
  addDetailItem("생성 시각", formatReservationTimestamp(value.createdAt));
  addDetailItem("변경 시각", formatReservationTimestamp(value.updatedAt));
  const hasAdminReason = value.status === "CANCELED_BY_ADMIN" && value.adminCancelReason;
  adminReason.hidden = !hasAdminReason;
  if (hasAdminReason) adminReason.querySelector("p").textContent = value.adminCancelReason;
  actions.hidden = !canManageReservation(value);
  feedback.hidden = true;
  reservationState.hidden = true;
  reservationDetail.hidden = false;
  topicHeading.focus();
}

function showLoadFailure(error) {
  reservationState.className = "booking-content-state is-error";
  reservationState.textContent =
    error.status === 403
      ? "이 예약을 확인할 권한이 없어요."
      : error.status === 404
        ? "예약을 찾을 수 없어요."
        : "예약 정보를 불러오지 못했어요. ";
  if (![403, 404].includes(error.status)) {
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.textContent = "다시 시도";
    retryButton.addEventListener("click", loadReservation);
    reservationState.append(retryButton);
  }
}

async function loadReservation() {
  if (!reservationId) {
    showLoadFailure({ status: 404 });
    return;
  }
  reservationState.hidden = false;
  reservationState.textContent = "예약 정보를 불러오는 중이에요.";
  try {
    renderReservation(await fetchReservation(reservationId));
  } catch (error) {
    if (handleUnauthorized(error)) return;
    showLoadFailure(error);
  }
}

changeButton.addEventListener("click", () => {
  bookingDraftStore.startEditing(reservation.reservationId, {
    date: reservation.startAt.slice(0, 10),
    startTime: reservation.startAt.slice(11, 16),
    endTime: reservation.endAt.slice(11, 16),
    roomId: reservation.roomId,
    roomName: reservation.room.name,
    roomCapacity: reservation.room.capacity,
    topic: reservation.topic,
    attendeeChips: reservation.attendees,
    additionalInfo: reservation.additionalInfo,
  });
  globalThis.location.href = routes.bookingDateTime(reservation.roomId);
});

cancelButton.addEventListener("click", () => {
  cancelDialog.open({
    description: `${reservation.room.name}, ${formatReservationSchedule(reservation)}`,
  });
});

dialogConfirmButton.addEventListener("click", async () => {
  cancelDialog.setConfirmButtonLoading(true);
  dialogConfirmButton.textContent = "취소 중…";
  try {
    await cancelReservation(reservation.reservationId);
    cancelDialog.close({ restoreFocus: false });
    await loadReservation();
  } catch (error) {
    if (handleUnauthorized(error)) return;
    cancelDialog.close();
    feedback.textContent = "예약을 취소하지 못했어요. 다시 시도해 주세요.";
    feedback.hidden = false;
  } finally {
    cancelDialog.setConfirmButtonLoading(false);
    dialogConfirmButton.textContent = "예약 취소";
  }
});

if (requireAccessToken()) loadReservation();

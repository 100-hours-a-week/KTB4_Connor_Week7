import { fetchRoom } from "../api/booking.js";
import { parseAttendeeInput } from "../utils/attendee-parser.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h2");
const backLink = document.querySelector("[data-back-link]");
const reserverName = document.querySelector("[data-reserver-name]");
const roomSummary = document.querySelector("[data-room-summary]");
const roomError = document.querySelector("[data-room-error]");
const topicInput = document.querySelector("#booking-topic");
const topicError = document.querySelector("#topic-error");
const attendeeField = document.querySelector("[data-attendee-field]");
const attendeeBox = document.querySelector("[data-attendee-box]");
const attendeeInput = document.querySelector("#attendee-input");
const attendeeChipsContainer = document.querySelector("[data-attendee-chips]");
const attendeeCount = document.querySelector("[data-attendee-count]");
const attendeeError = document.querySelector("#attendee-error");
const additionalInfoInput = document.querySelector("#additional-info");
const nextButton = document.querySelector("[data-next-button]");
const draft = bookingDraftStore.read();
const editingReservationId = bookingDraftStore.getEditingReservationId();
let room = null;
let attendeeChips = [...draft.attendeeChips];
let showValidationErrors = false;

if (!draft.roomId) {
  globalThis.location.replace(routes.rooms);
} else if (!draft.date || !draft.startTime || !draft.endTime) {
  globalThis.location.replace(routes.bookingDateTime(draft.roomId));
}

function renderAttendeeChips() {
  attendeeChipsContainer.replaceChildren();
  attendeeChips.forEach((name) => {
    const chip = document.createElement("span");
    chip.className = "attendee-chip";
    chip.textContent = name;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `${name} 참석자 삭제`);
    const removeIcon = document.createElement("img");
    removeIcon.src = "../assets/icons/attendee-remove.svg";
    removeIcon.alt = "";
    removeIcon.setAttribute("aria-hidden", "true");
    removeButton.append(removeIcon);
    removeButton.addEventListener("click", () => {
      attendeeChips = attendeeChips.filter((candidate) => candidate !== name);
      bookingDraftStore.update({ attendeeChips });
      renderAttendeeChips();
      syncValidation();
    });
    chip.append(removeButton);
    attendeeChipsContainer.append(chip);
  });
  attendeeCount.textContent = room ? `${attendeeChips.length} / ${room.capacity}명` : `${attendeeChips.length}명`;
}

function syncValidation(showTopicError = false) {
  showValidationErrors ||= showTopicError;
  const topicValid = topicInput.value.trim().length > 0;
  const hasAttendee = attendeeChips.length > 0;
  const roomUnavailable = !room;
  const capacityExceeded = room && attendeeChips.length > room.capacity;
  const topicInvalid = showValidationErrors && !topicValid;
  const attendeeInvalid = capacityExceeded || (showValidationErrors && !hasAttendee);
  topicError.textContent = topicInvalid ? "회의 주제를 입력해 주세요." : "";
  topicInput.setAttribute("aria-invalid", String(topicInvalid));
  topicInput.closest(".booking-field").classList.toggle("is-error", topicInvalid);
  attendeeError.textContent = capacityExceeded
    ? `최대 ${room.capacity}명까지 이용할 수 있어요.`
    : showValidationErrors && !hasAttendee
      ? "참석자를 한 명 이상 추가해 주세요."
      : "";
  attendeeField.classList.toggle("is-error", Boolean(attendeeInvalid));
  attendeeBox.classList.toggle("is-error", Boolean(attendeeInvalid));
  attendeeInput.setAttribute("aria-invalid", String(Boolean(attendeeInvalid)));
  nextButton.setAttribute("aria-disabled", String(roomUnavailable || !topicValid || !hasAttendee || capacityExceeded));
}

function saveTextFields() {
  bookingDraftStore.update({
    topic: topicInput.value,
    additionalInfo: additionalInfoInput.value,
  });
}

function handleAttendeeInput() {
  const parsed = parseAttendeeInput({ rawValue: attendeeInput.value, existingChips: attendeeChips });
  if (parsed.chipsToAdd.length > 0) {
    attendeeChips = [...attendeeChips, ...parsed.chipsToAdd];
    attendeeInput.value = parsed.remainingValue;
    bookingDraftStore.update({ attendeeChips });
    renderAttendeeChips();
  }
  syncValidation();
}

async function loadRoom() {
  roomError.hidden = true;
  try {
    room = await fetchRoom(draft.roomId);
    bookingDraftStore.update({ roomName: room.name, roomCapacity: room.capacity });
    const roomName = document.createElement("strong");
    const roomMetadata = document.createElement("span");
    roomName.textContent = room.name;
    roomMetadata.textContent = [room.location, `최대 ${room.capacity}명`, ...room.facilities].join(" · ");
    roomSummary.replaceChildren(roomName, roomMetadata);
    renderAttendeeChips();
    syncValidation();
  } catch (error) {
    if (handleUnauthorized(error)) return;
    if (error.status === 404 || error.data?.code === "ROOM_INACTIVE") {
      sessionStorage.setItem("roomsFeedback", "이 회의실은 더 이상 예약할 수 없어요.");
      globalThis.location.replace(routes.rooms);
      return;
    }
    roomError.textContent = "회의실 정보를 불러오지 못했어요. ";
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.textContent = "다시 시도";
    retryButton.addEventListener("click", loadRoom);
    roomError.append(retryButton);
    roomError.hidden = false;
  }
}

backLink.href = routes.bookingDateTime(draft.roomId);
reserverName.textContent = sessionStorage.getItem("nickname") || "로그인 사용자";
topicInput.value = draft.topic;
additionalInfoInput.value = draft.additionalInfo;
topicInput.addEventListener("input", () => {
  saveTextFields();
  syncValidation();
});
additionalInfoInput.addEventListener("input", saveTextFields);
attendeeInput.addEventListener("input", handleAttendeeInput);
nextButton.addEventListener("click", () => {
  syncValidation(true);
  if (nextButton.getAttribute("aria-disabled") === "false") {
    saveTextFields();
    globalThis.location.href = routes.bookingReview;
    return;
  }
  const capacityExceeded = room && attendeeChips.length > room.capacity;
  const target = topicInput.value.trim() ? attendeeField : topicInput;
  target.scrollIntoView({
    behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "center",
  });
  (capacityExceeded || topicInput.value.trim() ? attendeeInput : topicInput).focus({ preventScroll: true });
});

if (requireAccessToken()) {
  if (editingReservationId) heading.textContent = "변경할 예약 정보를 확인해 주세요";
  heading.focus();
  renderAttendeeChips();
  loadRoom();
}

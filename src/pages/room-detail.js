import { fetchRoom } from "../api/booking.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { formatDuration } from "../utils/booking-format.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { routes } from "../utils/routes.js";

const roomState = document.querySelector("[data-room-state]");
const roomDetail = document.querySelector("[data-room-detail]");
const bookButton = document.querySelector("[data-book-button]");
const searchParams = new URLSearchParams(globalThis.location.search);
const roomId = searchParams.get("roomId");
const isEditingRoomChange =
  searchParams.get("mode") === "change" &&
  Boolean(bookingDraftStore.getEditingReservationId());
const roomsLink = document.querySelector("[data-rooms-link]");
let room = null;

if (isEditingRoomChange) roomsLink.href = routes.roomsForEditing;

function renderRoomImage() {
  const container = document.querySelector("[data-room-image]");
  if (room.imageUrl) {
    const image = document.createElement("img");
    image.src = room.imageUrl;
    image.alt = `${room.name} 대표 이미지`;
    container.replaceChildren(image);
    return;
  }
  container.classList.add("room-image-placeholder");
  container.setAttribute("aria-hidden", "true");
  container.textContent = room.name.slice(0, 1);
}

function renderRoom() {
  renderRoomImage();
  document.querySelector("[data-room-name]").textContent = room.name;
  document.querySelector("[data-room-location]").textContent = room.location;
  document.querySelector("[data-room-description]").textContent = room.description;
  document.querySelector("[data-room-capacity]").textContent = `최대 ${room.capacity}명`;
  document.querySelector("[data-room-hours]").textContent = room.operatingHours;
  document.querySelector("[data-room-policy]").textContent = `최소 ${formatDuration(room.minimumDurationMinutes)} · 최대 ${formatDuration(room.maximumDurationMinutes)}`;
  document.querySelector("[data-room-guide]").textContent = room.usageGuide;
  const facilities = document.querySelector("[data-room-facilities]");
  facilities.replaceChildren();
  const facilityNames = room.facilities.length > 0 ? room.facilities : ["별도 설비 없음"];
  facilityNames.forEach((facility) => {
    const item = document.createElement("li");
    item.textContent = facility;
    facilities.append(item);
  });
  roomState.hidden = true;
  roomDetail.hidden = false;
  bookButton.disabled = !room.active;
  if (!room.active) {
    roomState.hidden = false;
    roomState.textContent = "현재 예약할 수 없는 회의실이에요.";
  }
  document.querySelector("[data-room-name]").focus();
}

function showNotFound(message = "회의실을 찾을 수 없어요.") {
  roomState.textContent = `${message} `;
  const listLink = document.createElement("a");
  listLink.href = routes.rooms;
  listLink.textContent = "회의실 목록으로";
  roomState.append(listLink);
}

async function loadRoom() {
  if (!roomId) {
    showNotFound();
    return;
  }
  try {
    room = await fetchRoom(roomId);
    renderRoom();
  } catch (error) {
    if (handleUnauthorized(error)) return;
    showNotFound(error.status === 404 ? "회의실을 찾을 수 없어요." : "회의실 정보를 불러오지 못했어요.");
  }
}

bookButton.addEventListener("click", () => {
  if (!room?.active) return;
  const roomDraft = {
    roomId: room.roomId,
    roomName: room.name,
    roomCapacity: room.capacity,
  };
  if (isEditingRoomChange) {
    bookingDraftStore.changeRoom();
    bookingDraftStore.update(roomDraft);
  } else {
    bookingDraftStore.startBooking(roomDraft);
  }
  globalThis.location.href = routes.bookingDateTime(room.roomId);
});

if (requireAccessToken()) loadRoom();

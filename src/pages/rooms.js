import { fetchRooms } from "../api/booking.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h2");
const roomState = document.querySelector("[data-room-state]");
const roomList = document.querySelector("[data-room-list]");
const isEditingRoomChange =
  new URLSearchParams(globalThis.location.search).get("mode") === "change" &&
  Boolean(bookingDraftStore.getEditingReservationId());

function createRoomImage(room) {
  if (room.imageUrl) {
    const image = document.createElement("img");
    image.src = room.imageUrl;
    image.alt = `${room.name} 대표 이미지`;
    image.loading = "lazy";
    return image;
  }
  const placeholder = document.createElement("div");
  placeholder.className = "room-image-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.textContent = room.name.slice(0, 1);
  return placeholder;
}

function createRoomCard(room) {
  const link = document.createElement("a");
  link.className = "rooms-card";
  link.href = isEditingRoomChange
    ? routes.roomDetailForEditing(room.roomId)
    : routes.roomDetail(room.roomId);
  link.dataset.roomId = room.roomId;

  const content = document.createElement("span");
  content.className = "rooms-card-content";
  const name = document.createElement("strong");
  const location = document.createElement("span");
  const metadata = document.createElement("span");
  const status = document.createElement("span");
  name.textContent = room.name;
  location.textContent = room.location;
  const facilityNames = room.facilities.length > 0 ? room.facilities.slice(0, 3) : ["장비 없음"];
  metadata.textContent = [`최대 ${room.capacity}명`, ...facilityNames].join(" · ");
  status.className = "rooms-card-status";
  status.textContent = "예약 가능";
  content.append(name, location, metadata, status);
  link.append(createRoomImage(room), content);
  return link;
}

function renderSkeletons() {
  roomList.replaceChildren();
  for (let index = 0; index < 3; index += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = "rooms-card rooms-card-skeleton";
    skeleton.setAttribute("aria-hidden", "true");
    roomList.append(skeleton);
  }
}

function showError() {
  roomList.replaceChildren();
  roomState.hidden = false;
  roomState.className = "booking-content-state is-error";
  roomState.textContent = "회의실을 불러오지 못했어요. ";
  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "다시 시도";
  retryButton.addEventListener("click", loadRooms);
  roomState.append(retryButton);
}

async function loadRooms() {
  roomState.hidden = false;
  roomState.className = "booking-content-state";
  roomState.textContent = "회의실을 불러오는 중이에요.";
  renderSkeletons();
  try {
    const rooms = await fetchRooms();
    roomList.replaceChildren();
    if (rooms.length === 0) {
      roomState.textContent = "예약 가능한 회의실이 없어요.";
      return;
    }
    roomState.hidden = true;
    rooms.forEach((room) => roomList.append(createRoomCard(room)));
    const feedback = sessionStorage.getItem("roomsFeedback");
    if (feedback) {
      roomState.hidden = false;
      roomState.className = "booking-content-state is-error";
      roomState.textContent = feedback;
      sessionStorage.removeItem("roomsFeedback");
    }
  } catch (error) {
    if (handleUnauthorized(error)) return;
    showError();
  }
}

if (requireAccessToken()) {
  if (!isEditingRoomChange) bookingDraftStore.clear();
  heading.focus();
  loadRooms();
}

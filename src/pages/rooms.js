import { fetchRooms } from "../api/booking.js";
import { createHeaderProfile } from "../components/header-profile.js?v=3";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { bookingDraftStore } from "../utils/booking-draft.js";
import { routes } from "../utils/routes.js";

const heading = document.querySelector("h2");
const roomState = document.querySelector("[data-room-state]");
const roomList = document.querySelector("[data-room-list]");
const isEditingRoomChange =
  new URLSearchParams(globalThis.location.search).get("mode") === "change" &&
  Boolean(bookingDraftStore.getEditingReservationId());
const facilityIconNames = { TV: "tv", 화이트보드: "whiteboard", 보드마카: "marker" };
const headerProfile = createHeaderProfile();

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
  const card = document.createElement("article");
  card.className = "rooms-card";
  card.dataset.roomId = room.roomId;
  const link = document.createElement("a");
  link.className = "rooms-card-link";
  link.href = isEditingRoomChange
    ? routes.roomDetailForEditing(room.roomId)
    : routes.roomDetail(room.roomId);

  const content = document.createElement("div");
  content.className = "rooms-card-content";
  const name = document.createElement("strong");
  const location = document.createElement("span");
  const capacity = document.createElement("span");
  const facilities = document.createElement("ul");
  facilities.className = "rooms-card-facilities";
  name.textContent = room.name;
  location.className = "rooms-card-location";
  const locationIcon = document.createElement("img");
  locationIcon.className = "rooms-card-location-icon";
  locationIcon.src = "../assets/icons/location-pin.svg";
  locationIcon.alt = "";
  location.append(locationIcon, room.location.replace(/\s*\u00b7\s*/g, ", "));
  const facilityNames = room.facilities.length > 0 ? room.facilities.slice(0, 3) : ["장비 없음"];
  capacity.textContent = `최대 인원 ${room.capacity}명`;
  facilityNames.forEach((facility) => {
    const item = document.createElement("li");
    const iconName = facilityIconNames[facility];
    if (iconName) {
      const icon = document.createElement("span");
      icon.className = `facility-icon facility-icon--${iconName}`;
      icon.setAttribute("aria-hidden", "true");
      item.append(icon);
    }
    item.append(facility);
    facilities.append(item);
  });
  link.append(name);
  const facilityCarousel = document.createElement("div");
  facilityCarousel.className = "rooms-card-facility-carousel";
  if (facilityNames.length > 1) {
    facilityCarousel.classList.add("has-controls", "at-start");
    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "rooms-card-facility-nav";
    previousButton.setAttribute("aria-label", `${room.name} 이전 설비`);
    previousButton.textContent = "‹";
    previousButton.addEventListener("click", () => {
      facilities.scrollBy({ left: -96, behavior: "smooth" });
    });
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "rooms-card-facility-nav";
    nextButton.setAttribute("aria-label", `${room.name} 다음 설비`);
    nextButton.textContent = "›";
    nextButton.addEventListener("click", () => {
      facilities.scrollBy({ left: 96, behavior: "smooth" });
    });
    facilityCarousel.append(previousButton, facilities, nextButton);
    const updateFacilityNavigation = () => {
      const atStart = facilities.scrollLeft <= 1;
      const atEnd = facilities.scrollLeft >= facilities.scrollWidth - facilities.clientWidth - 1;
      previousButton.disabled = atStart;
      nextButton.disabled = atEnd;
      previousButton.classList.toggle("is-hidden", atStart);
      nextButton.classList.toggle("is-hidden", atEnd);
      facilityCarousel.classList.toggle("at-start", atStart);
      facilityCarousel.classList.toggle("at-end", atEnd);
    };
    facilities.addEventListener("scroll", updateFacilityNavigation, { passive: true });
    requestAnimationFrame(updateFacilityNavigation);
  } else {
    facilityCarousel.append(facilities);
  }
  content.append(link, location, capacity, facilityCarousel);
  card.append(createRoomImage(room), content);
  return card;
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
  headerProfile.loadCurrentUser();
  loadRooms();
}

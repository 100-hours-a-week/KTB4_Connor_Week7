const isPagesPage = globalThis.location.pathname.includes("/pages/");
const pagePrefix = isPagesPage ? "" : "pages/";
const rootPrefix = isPagesPage ? "../" : "";

const routes = {
  login: `${rootPrefix}index.html`,
  signup: `${pagePrefix}signup.html`,
  rooms: `${pagePrefix}rooms.html`,
  roomsForEditing: `${pagePrefix}rooms.html?mode=change`,
  roomDetail(roomId) {
    return `${pagePrefix}room-detail.html?roomId=${encodeURIComponent(roomId)}`;
  },
  roomDetailForEditing(roomId) {
    return `${pagePrefix}room-detail.html?roomId=${encodeURIComponent(roomId)}&mode=change`;
  },
  bookingDateTime(roomId) {
    return `${pagePrefix}booking-date-time.html?roomId=${encodeURIComponent(roomId)}`;
  },
  bookingInfo: `${pagePrefix}booking-info.html`,
  bookingReview: `${pagePrefix}booking-review.html`,
  bookingConfirmed(reservationId) {
    return `${pagePrefix}booking-confirmed.html?reservationId=${encodeURIComponent(reservationId)}`;
  },
  reservations: `${pagePrefix}reservations.html`,
  reservationDetail(reservationId) {
    return `${pagePrefix}reservation-detail.html?reservationId=${encodeURIComponent(reservationId)}`;
  },
  posts: `${pagePrefix}posts.html`,
  postCreate: `${pagePrefix}post-create.html`,
  postDetail(postId) {
    return `${pagePrefix}post-detail.html?postId=${encodeURIComponent(postId)}`;
  },
  postEdit(postId) {
    return `${pagePrefix}post-edit.html?postId=${encodeURIComponent(postId)}`;
  },
};

export { routes };

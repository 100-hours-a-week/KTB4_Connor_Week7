import { createAuthHeaders } from "../shared/lib/session.js";
import { request } from "./client.js";

function queryString(values) {
  return new URLSearchParams(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ).toString();
}

function fetchRooms({ signal } = {}) {
  return request("/api/rooms", { headers: createAuthHeaders(), signal });
}

function fetchRoom(roomId, { signal } = {}) {
  return request(`/api/rooms/${encodeURIComponent(roomId)}`, {
    headers: createAuthHeaders(),
    signal,
  });
}

function fetchRoomMonthAvailability({ roomId, year, month, signal } = {}) {
  const monthValue = `${year}-${String(month).padStart(2, "0")}`;
  return request(
    `/api/rooms/${encodeURIComponent(roomId)}/availability/month?${queryString({ month: monthValue })}`,
    { headers: createAuthHeaders(), signal },
  );
}

function fetchRoomDaySlots({
  roomId,
  date,
  excludeReservationId,
  signal,
} = {}) {
  return request(
    `/api/rooms/${encodeURIComponent(roomId)}/availability/day?${queryString({
      date,
      excludeReservationId,
    })}`,
    { headers: createAuthHeaders(), signal },
  );
}

function fetchReservation(reservationId, { signal } = {}) {
  return request(`/api/reservations/${encodeURIComponent(reservationId)}`, {
    headers: createAuthHeaders(),
    signal,
  });
}

function fetchMyReservations({
  status = "UPCOMING",
  page = 0,
  size = 20,
  sortOrder = "DESC",
  signal,
} = {}) {
  return request(`/api/reservations/me?${queryString({ status, page, size, sortOrder })}`, {
    headers: createAuthHeaders(),
    signal,
  });
}

function createReservation(payload, { signal } = {}) {
  return request("/api/reservations", {
    method: "POST",
    headers: createAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    signal,
  });
}

function updateReservation(reservationId, payload, { signal } = {}) {
  return request(`/api/reservations/${encodeURIComponent(reservationId)}`, {
    method: "PATCH",
    headers: createAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    signal,
  });
}

function cancelReservation(reservationId, { signal } = {}) {
  return request(`/api/reservations/${encodeURIComponent(reservationId)}`, {
    method: "DELETE",
    headers: createAuthHeaders(),
    signal,
  });
}

export {
  cancelReservation,
  createReservation,
  fetchMyReservations,
  fetchReservation,
  fetchRoom,
  fetchRoomDaySlots,
  fetchRoomMonthAvailability,
  fetchRooms,
  updateReservation,
};

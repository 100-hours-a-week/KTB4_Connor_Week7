import { USE_BOOKING_FIXTURES } from "../config.js";
import { createAuthHeaders } from "../shared/lib/session.js";
import { request } from "./client.js";
import {
  cancelFixtureReservation,
  createFixtureReservation,
  fetchFixtureDaySlots,
  fetchFixtureMyReservations,
  fetchFixtureMonthAvailability,
  fetchFixtureReservation,
  fetchFixtureRoom,
  fetchFixtureRooms,
  updateFixtureReservation,
} from "./booking-fixtures.js";

function queryString(values) {
  return new URLSearchParams(values).toString();
}

function fetchRooms({ signal } = {}) {
  if (USE_BOOKING_FIXTURES) return fetchFixtureRooms();
  return request("/api/rooms", { headers: createAuthHeaders(), signal });
}

function fetchRoom(roomId, { signal } = {}) {
  if (USE_BOOKING_FIXTURES) return fetchFixtureRoom(roomId);
  return request(`/api/rooms/${encodeURIComponent(roomId)}`, {
    headers: createAuthHeaders(),
    signal,
  });
}

function fetchRoomMonthAvailability({ roomId, year, month, signal } = {}) {
  if (USE_BOOKING_FIXTURES) return fetchFixtureMonthAvailability({ roomId, year, month });
  const monthValue = `${year}-${String(month).padStart(2, "0")}`;
  return request(
    `/api/rooms/${encodeURIComponent(roomId)}/availability/month?${queryString({ month: monthValue })}`,
    { headers: createAuthHeaders(), signal },
  );
}

function fetchRoomDaySlots({ roomId, date, signal } = {}) {
  if (USE_BOOKING_FIXTURES) return fetchFixtureDaySlots({ roomId, date });
  return request(
    `/api/rooms/${encodeURIComponent(roomId)}/availability/day?${queryString({ date })}`,
    { headers: createAuthHeaders(), signal },
  );
}

function fetchReservation(reservationId, { signal } = {}) {
  if (USE_BOOKING_FIXTURES) return fetchFixtureReservation(reservationId);
  return request(`/api/reservations/${encodeURIComponent(reservationId)}`, {
    headers: createAuthHeaders(),
    signal,
  });
}

function fetchMyReservations({ status, cursor = "", size = 10, signal } = {}) {
  if (USE_BOOKING_FIXTURES) return fetchFixtureMyReservations({ status, cursor, size });
  return request(`/api/reservations/me?${queryString({ status, cursor, size })}`, {
    headers: createAuthHeaders(),
    signal,
  });
}

function createReservation(payload, { signal } = {}) {
  if (USE_BOOKING_FIXTURES) return createFixtureReservation(payload);
  return request("/api/reservations", {
    method: "POST",
    headers: createAuthHeaders({
      "Content-Type": "application/json",
      "Idempotency-Key": payload.idempotencyKey,
    }),
    body: JSON.stringify(payload),
    signal,
  });
}

function updateReservation(reservationId, payload, { signal } = {}) {
  if (USE_BOOKING_FIXTURES) return updateFixtureReservation(reservationId, payload);
  return request(`/api/reservations/${encodeURIComponent(reservationId)}`, {
    method: "PATCH",
    headers: createAuthHeaders({
      "Content-Type": "application/json",
      "Idempotency-Key": payload.idempotencyKey,
    }),
    body: JSON.stringify(payload),
    signal,
  });
}

function cancelReservation(reservationId, { signal } = {}) {
  if (USE_BOOKING_FIXTURES) return cancelFixtureReservation(reservationId);
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

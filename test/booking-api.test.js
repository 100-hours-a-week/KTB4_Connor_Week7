import assert from "node:assert/strict";
import test from "node:test";

function createStorage(values = {}) {
  const entries = new Map(Object.entries(values));
  return {
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, value);
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
}

globalThis.APP_CONFIG = {
  API_BASE_URL: "http://api.test",
  BOOKING_DATA_SOURCE: "api",
};
globalThis.sessionStorage = createStorage({ accessToken: "access-token" });

const {
  createReservation,
  fetchMyReservations,
  fetchRoomDaySlots,
  updateReservation,
} = await import("../src/api/booking.js");

function respond(data = {}) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

test("예약 목록은 page, size, sortOrder를 전송한다", async () => {
  let requestUrl;
  globalThis.fetch = (url) => {
    requestUrl = url;
    return respond({ items: [], hasNext: false });
  };

  await fetchMyReservations({
    status: "PAST",
    page: 2,
    size: 5,
    sortOrder: "ASC",
  });

  assert.equal(
    requestUrl,
    "http://api.test/api/reservations/me?status=PAST&page=2&size=5&sortOrder=ASC",
  );
});

test("일간 가용성은 수정 중인 예약 ID만 선택적으로 전송한다", async () => {
  const requestUrls = [];
  globalThis.fetch = (url) => {
    requestUrls.push(url);
    return respond({ maximumDurationMinutes: 120, slots: [] });
  };

  await fetchRoomDaySlots({
    roomId: 5,
    date: "2026-08-03",
    excludeReservationId: 51,
  });
  await fetchRoomDaySlots({ roomId: 5, date: "2026-08-03" });

  assert.deepEqual(requestUrls, [
    "http://api.test/api/rooms/5/availability/day?date=2026-08-03&excludeReservationId=51",
    "http://api.test/api/rooms/5/availability/day?date=2026-08-03",
  ]);
});

test("예약 생성과 변경은 멱등성 헤더 없이 LocalDateTime body를 전송한다", async () => {
  const requests = [];
  globalThis.fetch = (url, options) => {
    requests.push({ url, options });
    return respond({ reservationId: 51 });
  };
  const payload = {
    roomId: 5,
    startAt: "2026-08-03T10:00:00",
    endAt: "2026-08-03T11:00:00",
    topic: "API 연결 확인",
    attendees: ["코너"],
    additionalInfo: "",
  };

  await createReservation(payload);
  await updateReservation(51, payload);

  assert.deepEqual(
    requests.map(({ url, options }) => ({
      url,
      method: options.method,
      headers: options.headers,
      body: JSON.parse(options.body),
    })),
    [
      {
        url: "http://api.test/api/reservations",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer access-token",
        },
        body: payload,
      },
      {
        url: "http://api.test/api/reservations/51",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer access-token",
        },
        body: payload,
      },
    ],
  );
});

import assert from "node:assert/strict";
import test from "node:test";

globalThis.APP_CONFIG = {
  API_BASE_URL: "http://localhost:8080",
  BOOKING_DATA_SOURCE: "api",
};

const { fetchRoom } = await import("../src/api/booking.js");

test("백엔드 회의실 응답을 상세 화면 모델로 변환한다", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalSessionStorage;
  });

  globalThis.sessionStorage = { getItem: () => null };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        roomId: 1,
        name: "RYAN2",
        location: "R2",
        capacity: 6,
        facilities: ["TV"],
        description: "최대 6명이 이용할 수 있는 회의실입니다.",
        guide: "TV를 사용할 수 있어요.",
        openTime: "09:00",
        closeTime: "23:00",
        imageUrl: null,
        active: true,
      }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

  const room = await fetchRoom(1);

  assert.equal(room.operatingHours, "09:00~23:00");
  assert.equal(room.usageGuide, "TV를 사용할 수 있어요.");
  assert.equal("minimumDurationMinutes" in room, false);
  assert.equal("maximumDurationMinutes" in room, false);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  createFixtureReservationStore,
  fetchFixtureDaySlots,
  fetchFixtureRooms,
} from "../src/api/booking-fixtures.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("회의실 fixture 목록은 실제 회의실 정보와 이미지를 제공한다", async () => {
  const rooms = await fetchFixtureRooms();

  assert.deepEqual(
    rooms.map(({ roomId, name, capacity, facilities, imageUrl }) => ({
      roomId,
      name,
      capacity,
      facilities,
      imageUrl,
    })),
    [
      {
        roomId: "ryan2",
        name: "RYAN2",
        capacity: 6,
        facilities: ["TV", "화이트보드", "보드마카"],
        imageUrl: "../assets/rooms/ryan2.png",
      },
      {
        roomId: "ryan3",
        name: "RYAN3",
        capacity: 8,
        facilities: ["TV", "화이트보드", "보드마카"],
        imageUrl: "../assets/rooms/ryan3.png",
      },
      {
        roomId: "sangbae2",
        name: "SANGBAE2",
        capacity: 8,
        facilities: ["TV", "화이트보드", "보드마카"],
        imageUrl: "../assets/rooms/sangbae2.png",
      },
      {
        roomId: "t1",
        name: "T1",
        capacity: 6,
        facilities: [],
        imageUrl: "../assets/rooms/t1.png",
      },
      {
        roomId: "t2",
        name: "T2",
        capacity: 6,
        facilities: [],
        imageUrl: "../assets/rooms/t2.png",
      },
      {
        roomId: "t3",
        name: "T3",
        capacity: 5,
        facilities: [],
        imageUrl: "../assets/rooms/t3.png",
      },
    ],
  );
});

test("내 예약 fixture는 예정·지난·취소 예약을 필터링하고 페이지로 나눈다", async () => {
  const store = createFixtureReservationStore({
    storage: createMemoryStorage(),
    now: () => new Date("2026-07-20T09:00:00+09:00"),
  });

  const upcoming = await store.fetchMyReservations({ status: "UPCOMING", size: 1 });
  const past = await store.fetchMyReservations({ status: "PAST", size: 5 });
  const canceled = await store.fetchMyReservations({ status: "CANCELED", size: 5 });

  assert.equal(upcoming.items.length, 1);
  assert.equal(upcoming.items[0].status, "CONFIRMED");
  assert.equal(upcoming.nextCursor, null);
  assert.deepEqual(past.items.map(({ status }) => status), ["COMPLETED"]);
  assert.deepEqual(
    canceled.items.map(({ status }) => status),
    ["CANCELED_BY_ADMIN", "CANCELED_BY_USER"],
  );
});

test("내 예약 fixture는 로그인 사용자의 예약만 조회하고 변경할 수 있다", async () => {
  const storage = createMemoryStorage();
  storage.setItem("userId", "current-user");
  storage.setItem(
    "fixtureReservations",
    JSON.stringify([
      {
        reservationId: "mine",
        ownerId: "current-user",
        status: "CONFIRMED",
        roomId: "ryan2",
        startAt: "2026-07-21T09:00:00+09:00",
        endAt: "2026-07-21T09:30:00+09:00",
        updatedAt: "2026-07-20T09:00:00+09:00",
      },
      {
        reservationId: "another-users",
        ownerId: "another-user",
        status: "CONFIRMED",
        roomId: "t2",
        startAt: "2026-07-21T09:00:00+09:00",
        endAt: "2026-07-21T10:00:00+09:00",
        updatedAt: "2026-07-20T09:00:00+09:00",
      },
    ]),
  );
  const store = createFixtureReservationStore({
    storage,
    now: () => new Date("2026-07-20T09:00:00+09:00"),
  });

  const upcoming = await store.fetchMyReservations({ status: "UPCOMING" });

  assert.deepEqual(upcoming.items.map(({ reservationId }) => reservationId), ["mine"]);
  await assert.rejects(
    () => store.fetchReservation("another-users"),
    (error) => error.status === 403 && error.data?.code === "RESERVATION_FORBIDDEN",
  );
  await assert.rejects(
    () => store.cancelReservation("another-users"),
    (error) => error.status === 403 && error.data?.code === "RESERVATION_FORBIDDEN",
  );
  await assert.rejects(
    () => store.updateReservation("another-users", {}),
    (error) => error.status === 403 && error.data?.code === "RESERVATION_FORBIDDEN",
  );
});

test("다른 사용자의 확정 예약도 fixture 시간 슬롯을 막는다", async () => {
  const originalStorage = globalThis.sessionStorage;
  const storage = createMemoryStorage();
  storage.setItem("userId", "current-user");
  storage.setItem("roomBookingEditingReservationId", "another-users");
  storage.setItem(
    "fixtureReservations",
    JSON.stringify([
      {
        reservationId: "another-users",
        ownerId: "another-user",
        status: "CONFIRMED",
        roomId: "t2",
        startAt: "2026-07-21T09:00:00+09:00",
        endAt: "2026-07-21T10:00:00+09:00",
        updatedAt: "2026-07-20T09:00:00+09:00",
      },
    ]),
  );
  globalThis.sessionStorage = storage;
  try {
    const slots = await fetchFixtureDaySlots({ roomId: "t2", date: "2026-07-21" });

    assert.deepEqual(slots.slots.slice(0, 2).map(({ state }) => state), ["UNAVAILABLE", "UNAVAILABLE"]);
  } finally {
    if (originalStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = originalStorage;
  }
});

test("종료된 확정 예약은 예정이 아니라 이용 완료로 조회한다", async () => {
  const storage = createMemoryStorage();
  storage.setItem(
    "fixtureReservations",
    JSON.stringify([
      {
        reservationId: "confirmed-ended",
        status: "CONFIRMED",
        startAt: "2026-07-19T10:00:00+09:00",
        endAt: "2026-07-19T11:00:00+09:00",
        updatedAt: "2026-07-19T11:00:00+09:00",
      },
    ]),
  );
  const store = createFixtureReservationStore({
    storage,
    now: () => new Date("2026-07-20T09:00:00+09:00"),
  });

  const upcoming = await store.fetchMyReservations({ status: "UPCOMING" });
  const past = await store.fetchMyReservations({ status: "PAST" });

  assert.equal(upcoming.items.length, 0);
  assert.equal(past.items[0].status, "COMPLETED");
});

test("예약 취소 fixture는 상세 상태를 바꾸고 반복 요청에도 같은 결과를 반환한다", async () => {
  const store = createFixtureReservationStore({
    storage: createMemoryStorage(),
    now: () => new Date("2026-07-20T09:00:00+09:00"),
  });

  const firstResult = await store.cancelReservation("fixture-upcoming-1");
  const secondResult = await store.cancelReservation("fixture-upcoming-1");
  const detail = await store.fetchReservation("fixture-upcoming-1");

  assert.equal(firstResult.status, "CANCELED_BY_USER");
  assert.deepEqual(secondResult, firstResult);
  assert.deepEqual(detail, firstResult);
});

test("예약 변경 fixture는 새 조건이 유효할 때만 기존 예약을 교체한다", async () => {
  const store = createFixtureReservationStore({
    storage: createMemoryStorage(),
    now: () => new Date("2026-07-20T09:00:00+09:00"),
  });
  const validChange = {
    roomId: "ryan2",
    startAt: "2026-07-21T16:00:00+09:00",
    endAt: "2026-07-21T17:00:00+09:00",
    topic: "변경한 프로젝트 회의",
    attendees: ["김현", "이도윤"],
    additionalInfo: "변경된 요청",
    idempotencyKey: "change-1",
  };

  const changed = await store.updateReservation("fixture-upcoming-1", validChange);
  await assert.rejects(
    () =>
      store.updateReservation("fixture-upcoming-1", {
        ...validChange,
        startAt: "2026-07-21T12:00:00+09:00",
        endAt: "2026-07-21T12:30:00+09:00",
      }),
    (error) => error.data?.code === "RESERVATION_CONFLICT",
  );
  const detail = await store.fetchReservation("fixture-upcoming-1");

  assert.equal(changed.topic, "변경한 프로젝트 회의");
  assert.equal(detail.startAt, "2026-07-21T16:00:00+09:00");
  assert.equal(detail.topic, "변경한 프로젝트 회의");
});

test("새 fixture 예약은 내 예정 예약과 상세 조회에 즉시 반영된다", async () => {
  const store = createFixtureReservationStore({
    storage: createMemoryStorage(),
    now: () => new Date("2026-07-20T09:00:00+09:00"),
  });
  const created = await store.createReservation({
    roomId: "t2",
    startAt: "2026-07-21T09:00:00+09:00",
    endAt: "2026-07-21T10:00:00+09:00",
    topic: "새 예약",
    attendees: ["김현"],
    additionalInfo: "",
    idempotencyKey: "create-1",
  });

  const upcoming = await store.fetchMyReservations({ status: "UPCOMING", size: 10 });
  const detail = await store.fetchReservation(created.reservationId);

  assert.equal(created.status, "CONFIRMED");
  assert.equal(detail.topic, "새 예약");
  assert.equal(
    upcoming.items.some(({ reservationId }) => reservationId === created.reservationId),
    true,
  );
});

test("확정 예약은 시간 슬롯을 막고 취소하면 다시 예약 가능하게 만든다", async () => {
  const originalStorage = globalThis.sessionStorage;
  const storage = createMemoryStorage();
  globalThis.sessionStorage = storage;
  try {
    const store = createFixtureReservationStore({
      storage,
      now: () => new Date("2026-07-20T09:00:00+09:00"),
    });
    const created = await store.createReservation({
      roomId: "t2",
      startAt: "2026-07-21T09:00:00+09:00",
      endAt: "2026-07-21T10:00:00+09:00",
      topic: "슬롯 확인",
      attendees: ["김현"],
      additionalInfo: "",
      idempotencyKey: "slot-1",
    });

    storage.setItem("roomBookingEditingReservationId", created.reservationId);
    const editing = await fetchFixtureDaySlots({ roomId: "t2", date: "2026-07-21" });
    storage.removeItem("roomBookingEditingReservationId");
    const reserved = await fetchFixtureDaySlots({ roomId: "t2", date: "2026-07-21" });
    await store.cancelReservation(created.reservationId);
    const canceled = await fetchFixtureDaySlots({ roomId: "t2", date: "2026-07-21" });

    assert.deepEqual(editing.slots.slice(0, 2).map(({ state }) => state), ["AVAILABLE", "AVAILABLE"]);
    assert.deepEqual(reserved.slots.slice(0, 2).map(({ state }) => state), ["UNAVAILABLE", "UNAVAILABLE"]);
    assert.deepEqual(canceled.slots.slice(0, 2).map(({ state }) => state), ["AVAILABLE", "AVAILABLE"]);
  } finally {
    if (originalStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = originalStorage;
  }
});

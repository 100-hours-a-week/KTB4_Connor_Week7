import assert from "node:assert/strict";
import test from "node:test";

import {
  BOOKING_DRAFT_KEY,
  EMPTY_BOOKING_DRAFT,
  createBookingDraftStore,
} from "../src/utils/booking-draft.js";

function createMemoryStorage(initialValue) {
  const values = new Map();
  if (initialValue !== undefined) values.set(BOOKING_DRAFT_KEY, initialValue);
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, nextValue) {
      values.set(key, nextValue);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("날짜나 시간이 바뀌어도 회의실과 작성한 예약 정보를 유지한다", () => {
  const storage = createMemoryStorage();
  const draftStore = createBookingDraftStore(storage);
  draftStore.update({
    date: "2026-07-20",
    startTime: "10:00",
    endTime: "11:00",
    roomId: "room-a",
    roomName: "A 회의실",
    roomCapacity: 6,
    topic: "프로젝트 회의",
    attendeeChips: ["김현"],
  });

  const updatedDraft = draftStore.update({ startTime: "11:00", endTime: "12:00" });

  assert.equal(updatedDraft.roomId, "room-a");
  assert.equal(updatedDraft.roomName, "A 회의실");
  assert.equal(updatedDraft.roomCapacity, 6);
  assert.equal(updatedDraft.topic, "프로젝트 회의");
  assert.deepEqual(updatedDraft.attendeeChips, ["김현"]);
});

test("회의실 변경은 예약 초안 전체를 삭제한다", () => {
  const storage = createMemoryStorage();
  const draftStore = createBookingDraftStore(storage);
  draftStore.update({
    date: "2026-07-20",
    startTime: "10:00",
    endTime: "11:00",
    roomId: "room-a",
    roomName: "A 회의실",
    roomCapacity: 6,
    topic: "프로젝트 회의",
    attendeeChips: ["김현"],
  });

  draftStore.changeRoom();

  assert.deepEqual(draftStore.read(), EMPTY_BOOKING_DRAFT);
});

test("예약 충돌은 날짜와 작성 정보를 유지하고 시간만 삭제한다", () => {
  const storage = createMemoryStorage();
  const draftStore = createBookingDraftStore(storage);
  draftStore.update({
    date: "2026-07-20",
    startTime: "10:00",
    endTime: "11:00",
    roomId: "room-a",
    roomName: "A 회의실",
    roomCapacity: 6,
    topic: "프로젝트 회의",
    attendeeChips: ["김현"],
  });

  const updatedDraft = draftStore.clearTime();

  assert.equal(updatedDraft.date, "2026-07-20");
  assert.equal(updatedDraft.startTime, "");
  assert.equal(updatedDraft.endTime, "");
  assert.equal(updatedDraft.roomId, "room-a");
  assert.equal(updatedDraft.topic, "프로젝트 회의");
  assert.deepEqual(updatedDraft.attendeeChips, ["김현"]);
});

test("깨진 초안은 빈 초안으로 복구한다", () => {
  const storage = createMemoryStorage("not-json");
  const draftStore = createBookingDraftStore(storage);

  assert.deepEqual(draftStore.read(), EMPTY_BOOKING_DRAFT);
});

test("예약 변경 ID는 회의실을 바꿔도 유지하고 변경 완료 시 삭제한다", () => {
  const draftStore = createBookingDraftStore(createMemoryStorage());
  draftStore.startEditing("reservation-1", {
    roomId: "ryan2",
    roomName: "RYAN2",
    roomCapacity: 6,
    date: "2026-07-21",
    startTime: "10:00",
    endTime: "11:00",
    topic: "프로젝트 회의",
    attendeeChips: ["김현"],
  });

  draftStore.changeRoom();

  assert.equal(draftStore.getEditingReservationId(), "reservation-1");
  assert.deepEqual(draftStore.read(), EMPTY_BOOKING_DRAFT);

  draftStore.clear();

  assert.equal(draftStore.getEditingReservationId(), "");
});

test("일반 예약 시작은 남아 있는 예약 변경 ID를 삭제한다", () => {
  const draftStore = createBookingDraftStore(createMemoryStorage());
  draftStore.startEditing("reservation-1", {
    roomId: "ryan2",
    roomName: "RYAN2",
    roomCapacity: 6,
  });

  const newDraft = draftStore.startBooking({
    roomId: "t3",
    roomName: "T3",
    roomCapacity: 5,
  });

  assert.equal(draftStore.getEditingReservationId(), "");
  assert.equal(newDraft.roomId, "t3");
});

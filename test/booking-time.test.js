import assert from "node:assert/strict";
import test from "node:test";

import { selectTimeRange } from "../src/features/booking/lib/booking-time.js";

const slots = [
  { startTime: "10:00", endTime: "10:30", state: "AVAILABLE" },
  { startTime: "10:30", endTime: "11:00", state: "AVAILABLE" },
  { startTime: "11:00", endTime: "11:30", state: "UNAVAILABLE" },
  { startTime: "11:30", endTime: "12:00", state: "AVAILABLE" },
  { startTime: "12:00", endTime: "12:30", state: "AVAILABLE" },
  { startTime: "12:30", endTime: "13:00", state: "AVAILABLE" },
  { startTime: "13:00", endTime: "13:30", state: "AVAILABLE" },
  { startTime: "13:30", endTime: "14:00", state: "AVAILABLE" },
];

test("선택한 회의실의 연속된 예약 가능 구간을 선택한다", () => {
  assert.deepEqual(selectTimeRange(slots, 0, 1), {
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    limitedBy: null,
  });
});

test("예약 불가 슬롯 앞에서 선택을 멈춘다", () => {
  assert.deepEqual(selectTimeRange(slots, 0, 2), {
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    limitedBy: "availability",
  });
});

test("2시간을 넘는 드래그는 2시간에서 멈춘다", () => {
  assert.deepEqual(selectTimeRange(slots, 3, 7), {
    startTime: "11:30",
    endTime: "13:30",
    durationMinutes: 120,
    limitedBy: "duration",
  });
});

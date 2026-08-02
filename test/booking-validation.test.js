import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReservationPayload,
  getReservationErrorAction,
} from "../src/features/booking/lib/booking-validation.js";

test("예약 초안을 LocalDateTime 서버 요청으로 변환한다", () => {
  assert.deepEqual(
    buildReservationPayload(
      {
        date: "2026-07-21",
        startTime: "10:00",
        endTime: "11:00",
        roomId: 5,
        topic: " 프로젝트 회의 ",
        attendeeChips: ["김현", "이도윤"],
        additionalInfo: " 모니터 사용 ",
      },
    ),
    {
      roomId: 5,
      startAt: "2026-07-21T10:00:00",
      endAt: "2026-07-21T11:00:00",
      topic: "프로젝트 회의",
      attendees: ["김현", "이도윤"],
      additionalInfo: "모니터 사용",
    },
  );
});

test("동시 예약 충돌은 작성 내용을 유지하고 시간만 다시 선택한다", () => {
  assert.deepEqual(
    getReservationErrorAction({ status: 409, data: { code: "RESERVATION_CONFLICT" } }),
    { step: "dateTime", clearTime: true, message: "방금 다른 예약이 확정되었어요." },
  );
});

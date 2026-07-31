import assert from "node:assert/strict";
import test from "node:test";

import { parseAttendeeInput } from "../src/features/booking/lib/attendee-parser.js";

test("쉼표로 끝난 이름만 중복 없이 참석자 칩으로 만든다", () => {
  assert.deepEqual(
    parseAttendeeInput({
      rawValue: "김현, 이도윤, 김현, 박서준",
      existingChips: ["최유진"],
    }),
    {
      chipsToAdd: ["김현", "이도윤"],
      remainingValue: " 박서준",
    },
  );
});

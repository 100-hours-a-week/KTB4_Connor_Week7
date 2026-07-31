import { useRef, useState } from "react";
import { parseAttendeeInput } from "../lib/attendee-parser.js";

function AttendeeInput({
  value,
  capacity,
  error = "",
  inputRef,
  onChange,
}) {
  const [buffer, setBuffer] = useState("");
  const composingRef = useRef(false);
  const capacityExceeded = value.length > capacity;
  const errorMessage = capacityExceeded
    ? `최대 ${capacity}명까지 이용할 수 있어요.`
    : error;

  function parse(rawValue) {
    setBuffer(rawValue);
    if (composingRef.current) return;

    const { chipsToAdd, remainingValue } = parseAttendeeInput({
      rawValue,
      existingChips: value,
    });
    if (chipsToAdd.length > 0) onChange([...value, ...chipsToAdd]);
    setBuffer(remainingValue);
  }

  return (
    <>
      <div
        className={`attendee-input-box${capacityExceeded ? " is-error" : ""}`}
      >
        <div className="attendee-chips">
          {value.map((name) => (
            <span className="attendee-chip" key={name}>
              {name}
              <button
                type="button"
                aria-label={`${name} 참석자 삭제`}
                onClick={() =>
                  onChange(value.filter((candidate) => candidate !== name))
                }
              >
                <img
                  src="/assets/icons/attendee-remove.svg"
                  alt=""
                  aria-hidden="true"
                />
              </button>
            </span>
          ))}
        </div>
        <input
          id="attendee-input"
          ref={inputRef}
          value={buffer}
          placeholder="이름을 입력하고 쉼표(,)를 눌러 주세요"
          aria-label="참석자"
          aria-describedby="attendee-guide attendee-error"
          aria-invalid={Boolean(errorMessage)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(event) => {
            composingRef.current = false;
            parse(event.currentTarget.value);
          }}
          onChange={(event) => parse(event.target.value)}
        />
      </div>
      <p className="booking-field-guide" id="attendee-guide">
        이름 뒤에 쉼표를 입력하면 참석자로 추가돼요. 예약자 본인이
        참석하는 경우 본인 이름도 입력해 주세요.
      </p>
      <p
        className="booking-field-error"
        id="attendee-error"
        aria-live="polite"
      >
        {errorMessage}
      </p>
    </>
  );
}

export { AttendeeInput };

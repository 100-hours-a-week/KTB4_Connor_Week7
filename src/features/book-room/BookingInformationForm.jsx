import { useEffect, useRef, useState } from "react";
import { AttendeeInput } from "./AttendeeInput.jsx";

const FORM_ID = "booking-information-form";

function BookingInformationForm({
  draft,
  room,
  reserverName,
  onValidityChange,
  onSave,
}) {
  const [topic, setTopic] = useState(draft.topic);
  const [attendeeChips, setAttendeeChips] = useState(draft.attendeeChips);
  const [additionalInfo, setAdditionalInfo] = useState(draft.additionalInfo);
  const [showValidation, setShowValidation] = useState(false);
  const topicRef = useRef(null);
  const attendeeRef = useRef(null);
  const topicValid = topic.trim().length > 0;
  const hasAttendee = attendeeChips.length > 0;
  const capacityExceeded = attendeeChips.length > room.capacity;
  const canSubmit = topicValid && hasAttendee && !capacityExceeded;
  const topicError =
    showValidation && !topicValid ? "회의 주제를 입력해 주세요." : "";
  const attendeeError =
    showValidation && !hasAttendee
      ? "참석자를 한 명 이상 추가해 주세요."
      : "";

  useEffect(() => {
    onValidityChange(canSubmit);
  }, [canSubmit, onValidityChange]);

  function submit(event) {
    event.preventDefault();
    setShowValidation(true);
    if (!canSubmit) {
      (topicValid ? attendeeRef : topicRef).current?.focus();
      return;
    }
    onSave({ topic, attendeeChips, additionalInfo });
  }

  return (
    <form
      className="booking-info-form"
      id={FORM_ID}
      noValidate
      onSubmit={submit}
    >
      <div className="booking-field booking-readonly-field">
        <span>예약자</span>
        <strong>{reserverName || "로그인 사용자"}</strong>
        <p>예약자는 참석 인원에 자동으로 포함되지 않아요.</p>
      </div>
      <div className={`booking-field${topicError ? " is-error" : ""}`}>
        <label htmlFor="booking-topic">
          회의 주제 <span>필수</span>
        </label>
        <input
          id="booking-topic"
          ref={topicRef}
          value={topic}
          maxLength={100}
          placeholder="회의 주제를 입력해 주세요"
          required
          aria-invalid={Boolean(topicError)}
          aria-describedby="topic-error"
          onChange={(event) => setTopic(event.target.value)}
        />
        <p
          className="booking-field-error"
          id="topic-error"
          aria-live="polite"
        >
          {topicError}
        </p>
      </div>

      <div
        className={`booking-field attendee-field${
          attendeeError || capacityExceeded ? " is-error" : ""
        }`}
      >
        <div className="booking-field-heading">
          <label htmlFor="attendee-input">
            참석자 <span>필수</span>
          </label>
          <strong>
            {attendeeChips.length} / {room.capacity}명
          </strong>
        </div>
        <AttendeeInput
          value={attendeeChips}
          capacity={room.capacity}
          error={attendeeError}
          inputRef={attendeeRef}
          onChange={setAttendeeChips}
        />
      </div>

      <div className="booking-field">
        <label htmlFor="additional-info">
          추가 정보 <span>선택</span>
        </label>
        <textarea
          id="additional-info"
          value={additionalInfo}
          maxLength={500}
          placeholder="필요한 설비나 요청사항을 입력해 주세요"
          onChange={(event) => setAdditionalInfo(event.target.value)}
        />
      </div>
    </form>
  );
}

export { BookingInformationForm, FORM_ID };

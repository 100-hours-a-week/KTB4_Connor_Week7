import { useRef, useState } from "react";
import {
  createReservation,
  updateReservation,
} from "../../api/booking.js";
import { buildReservationPayload } from "../../utils/booking-validation.js";

function SubmitBookingButton({
  draft,
  editingReservationId,
  create = createReservation,
  update = updateReservation,
  clear,
  onCompleted,
  onRecover,
  createIdempotencyKey = () =>
    globalThis.crypto?.randomUUID?.() || `request-${Date.now()}`,
}) {
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef("");
  let label = editingReservationId ? "예약 변경" : "예약 확정";
  if (submitting) label = editingReservationId ? "변경 중…" : "예약 중…";

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    idempotencyKeyRef.current ||= createIdempotencyKey();
    const payload = buildReservationPayload(
      draft,
      idempotencyKeyRef.current,
    );

    try {
      const result = editingReservationId
        ? await update(editingReservationId, payload)
        : await create(payload);
      onCompleted(result);
      clear();
    } catch (error) {
      onRecover(error);
      setSubmitting(false);
    }
  }

  return (
    <button
      className="booking-primary-button"
      type="button"
      disabled={submitting}
      aria-busy={submitting}
      onClick={submit}
    >
      {label}
    </button>
  );
}

export { SubmitBookingButton };

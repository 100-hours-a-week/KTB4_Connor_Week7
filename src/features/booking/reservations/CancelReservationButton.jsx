import { useEffect, useRef, useState } from "react";
import { cancelReservation } from "../../../api/booking.js";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog.jsx";
import { formatReservationSchedule } from "../lib/reservation-format.js";

function CancelReservationButton({
  reservation,
  cancel = cancelReservation,
  onCanceled,
  onUnauthorized,
  onForbidden,
  onError,
}) {
  const openerRef = useRef(null);
  const requestRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [restoreFocus, setRestoreFocus] = useState(true);

  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [],
  );

  function openDialog() {
    onError?.("");
    setRestoreFocus(true);
    setOpen(true);
  }

  async function confirmCancellation() {
    if (busy) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    onError?.("");

    try {
      await cancel(reservation.reservationId, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setRestoreFocus(false);
      setOpen(false);
      await onCanceled?.();
    } catch (error) {
      if (controller.signal.aborted) return;
      if (onUnauthorized?.(error)) {
        setRestoreFocus(false);
        setOpen(false);
        return;
      }
      setRestoreFocus(true);
      setOpen(false);
      if (error?.status === 403) {
        onForbidden?.(
          error.message || "이 예약을 취소할 권한이 없어요.",
        );
        return;
      }
      onError?.(
        error?.message ||
          "예약을 취소하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  return (
    <>
      <button
        ref={openerRef}
        className="reservation-cancel-button"
        type="button"
        onClick={openDialog}
      >
        예약 취소
      </button>
      <ConfirmDialog
        open={open}
        title="예약을 취소할까요?"
        description={`${reservation.room.name}, ${formatReservationSchedule(reservation)}`}
        busy={busy}
        cancelLabel="돌아가기"
        confirmLabel="취소하기"
        busyLabel="취소 중…"
        restoreFocus={restoreFocus}
        returnFocusRef={openerRef}
        onCancel={() => setOpen(false)}
        onConfirm={confirmCancellation}
      />
    </>
  );
}

export { CancelReservationButton };

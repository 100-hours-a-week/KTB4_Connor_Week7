import { useEffect, useRef } from "react";

function ConfirmDialog({
  open,
  title,
  description,
  busy,
  cancelLabel = "취소",
  confirmLabel = "확인",
  busyLabel = "처리 중...",
  restoreFocus = true,
  onCancel,
  onConfirm,
  returnFocusRef,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (open) {
      if (!dialog.open) dialog.showModal();
      cancelButtonRef.current?.focus();
      wasOpen.current = true;
      return;
    }

    if (!wasOpen.current) return;
    if (dialog.open) dialog.close();
    if (restoreFocus) returnFocusRef.current?.focus();
    wasOpen.current = false;
  }, [open, restoreFocus, returnFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-description">{description}</p>
      <div className="dialog-actions">
        <button
          ref={cancelButtonRef}
          className="dialog-cancel"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          className="dialog-confirm"
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={onConfirm}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export { ConfirmDialog };

import { useRef, useState } from "react";
import { PROFILE_WITHDRAW_FAILURE } from "../../shared/constants/messages.js";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog.jsx";

function WithdrawAccountButton({
  withdraw,
  onUnauthorized,
  onWithdrawn,
}) {
  const openerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restoreFocus, setRestoreFocus] = useState(true);

  function openDialog() {
    setError("");
    setRestoreFocus(true);
    setOpen(true);
  }

  async function confirmWithdrawal() {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await withdraw();
      setRestoreFocus(false);
      setOpen(false);
      onWithdrawn();
    } catch (requestError) {
      if (onUnauthorized(requestError)) {
        setRestoreFocus(false);
        setOpen(false);
        return;
      }
      setOpen(false);
      setError(requestError.message || PROFILE_WITHDRAW_FAILURE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={openerRef}
        className="withdraw-button"
        type="button"
        onClick={openDialog}
      >
        회원 탈퇴
      </button>
      <p className="helper-text form-helper" aria-live="polite">
        {error}
      </p>
      <ConfirmDialog
        open={open}
        title="회원탈퇴 하시겠습니까?"
        description="작성된 게시글과 댓글은 삭제됩니다."
        busy={busy}
        confirmLabel="탈퇴하기"
        busyLabel="탈퇴 중..."
        restoreFocus={restoreFocus}
        returnFocusRef={openerRef}
        onCancel={() => setOpen(false)}
        onConfirm={confirmWithdrawal}
      />
    </>
  );
}

export { WithdrawAccountButton };

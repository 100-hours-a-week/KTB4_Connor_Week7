import { Link } from "react-router";

function BookingStepLayout({
  backTo,
  backLabel,
  onExit,
  nextDisabled,
  onNext,
  children,
}) {
  return (
    <div className="booking-body booking-app-shell booking-step-shell">
      <header className="booking-app-bar booking-flow-app-bar">
        <Link to={backTo} aria-label={backLabel}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m14 5-7 7 7 7M7 12h11" />
          </svg>
        </Link>
        <h1>회의실 예약</h1>
        <button type="button" onClick={onExit} aria-label="회의실 목록으로">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </button>
      </header>
      {children}
      <footer className="booking-footer">
        <button
          className="booking-primary-button"
          type="button"
          disabled={nextDisabled}
          onClick={onNext}
        >
          다음
        </button>
      </footer>
    </div>
  );
}

export { BookingStepLayout };

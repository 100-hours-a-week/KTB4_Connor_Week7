function ContentState({
  status,
  loadingMessage,
  emptyMessage,
  errorMessage,
  onRetry,
  children,
}) {
  if (status === "loading") {
    return <p className="booking-content-state" aria-live="polite">{loadingMessage}</p>;
  }
  if (status === "empty") {
    return <p className="booking-content-state">{emptyMessage}</p>;
  }
  if (status === "error") {
    return (
      <section className="booking-content-state is-error" aria-live="polite">
        <p>{errorMessage}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            다시 시도
          </button>
        ) : null}
      </section>
    );
  }
  return children;
}

export { ContentState };

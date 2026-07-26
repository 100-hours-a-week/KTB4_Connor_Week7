function Toast({ open, message }) {
  return (
    <p className="toast" role="status" aria-live="polite" hidden={!open}>
      {message}
    </p>
  );
}

export { Toast };

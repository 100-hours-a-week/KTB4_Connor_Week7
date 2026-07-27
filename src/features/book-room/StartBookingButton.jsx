function StartBookingButton({ room, mode = "create", onStart }) {
  return (
    <button
      className="booking-primary-button"
      type="button"
      disabled={!room.active}
      onClick={() => onStart(room)}
    >
      {mode === "change" ? "회의실 변경하기" : "예약하기"}
    </button>
  );
}

export { StartBookingButton };

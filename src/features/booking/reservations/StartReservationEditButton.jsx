import { useNavigate } from "react-router";
import { createBookingDraftStore } from "../model/bookingDraftStore.js";

function StartReservationEditButton({
  reservation,
  startEditing,
  onStarted,
}) {
  const navigate = useNavigate();

  function start() {
    const draft = {
      roomId: reservation.roomId,
      roomName: reservation.room.name,
      roomCapacity: reservation.room.capacity,
      date: reservation.startAt.slice(0, 10),
      startTime: reservation.startAt.slice(11, 16),
      endTime: reservation.endAt.slice(11, 16),
      topic: reservation.topic,
      attendeeChips: [...reservation.attendees],
      additionalInfo: reservation.additionalInfo || "",
    };
    const route = `/booking/${encodeURIComponent(reservation.roomId)}/date-time`;

    if (startEditing) {
      startEditing(reservation.reservationId, draft);
    } else {
      createBookingDraftStore(
        globalThis.sessionStorage,
      ).startEditing(reservation.reservationId, draft);
    }
    if (onStarted) onStarted(route);
    else navigate(route);
  }

  return (
    <button
      className="booking-secondary-button"
      type="button"
      onClick={start}
    >
      예약 변경
    </button>
  );
}

export { StartReservationEditButton };

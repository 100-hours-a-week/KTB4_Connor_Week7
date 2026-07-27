import { useNavigate } from "react-router";
import { createBookingDraftStore } from "../../utils/booking-draft.js";

function StartReservationEditButton({
  reservation,
  startEditing,
  onStarted,
}) {
  const navigate = useNavigate();
  const manageable =
    reservation.status === "CONFIRMED" &&
    new Date(reservation.startAt) > new Date();

  if (!manageable) return null;

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
    <div className="reservation-detail-actions">
      <button
        className="booking-secondary-button"
        type="button"
        onClick={start}
      >
        예약 변경
      </button>
    </div>
  );
}

export { StartReservationEditButton };

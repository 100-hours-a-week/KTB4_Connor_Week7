import { useState } from "react";
import { Link } from "react-router";
import { formatReservationSchedule } from "../../utils/reservation-format.js";

function ReservationCard({ reservation }) {
  const [imageFailed, setImageFailed] = useState(false);
  const room = reservation.room;

  return (
    <Link
      className="reservation-card"
      to={`/reservations/${encodeURIComponent(reservation.reservationId)}`}
    >
      {room.imageUrl && !imageFailed ? (
        <img
          className="reservation-card-image"
          src={room.imageUrl}
          alt={`${room.name} 대표 이미지`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="reservation-card-image reservation-card-image-placeholder"
          aria-hidden="true"
        >
          {room.name.slice(0, 1)}
        </span>
      )}
      <span className="reservation-card-content">
        <span className="reservation-card-heading">
          <strong>{room.name}</strong>
        </span>
        <span>{formatReservationSchedule(reservation)}</span>
        <span className="reservation-card-topic">{reservation.topic}</span>
        <span>참석자 {reservation.attendees.length}명</span>
      </span>
    </Link>
  );
}

export { ReservationCard };

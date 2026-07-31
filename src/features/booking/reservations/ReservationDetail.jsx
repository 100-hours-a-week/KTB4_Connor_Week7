import {
  formatReservationSchedule,
  formatReservationTimestamp,
  getReservationStatusLabel,
} from "../lib/reservation-format.js";

function DetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "없음"}</dd>
    </div>
  );
}

function ReservationDetail({ reservation }) {
  const hasAdminReason =
    reservation.status === "CANCELED_BY_ADMIN" && reservation.adminCancelReason;

  return (
    <article className="reservation-detail">
      <p className={`reservation-status-badge is-${reservation.status.toLowerCase()}`}>
        {getReservationStatusLabel(reservation.status)}
      </p>
      <h2 tabIndex={-1}>{reservation.topic}</h2>
      <dl className="reservation-detail-list">
        <DetailItem
          label="회의실"
          value={`${reservation.room.name} (${reservation.room.location})`}
        />
        <DetailItem
          label="날짜와 시간"
          value={formatReservationSchedule(reservation)}
        />
        <DetailItem
          label="참석자"
          value={`${reservation.attendees.length}명 (${reservation.attendees.join(", ")})`}
        />
        <DetailItem label="추가 정보" value={reservation.additionalInfo} />
        <DetailItem label="예약 번호" value={reservation.reservationId} />
        <DetailItem
          label="생성 시각"
          value={formatReservationTimestamp(reservation.createdAt)}
        />
        <DetailItem
          label="변경 시각"
          value={formatReservationTimestamp(reservation.updatedAt)}
        />
      </dl>
      {hasAdminReason ? (
        <section className="reservation-admin-reason">
          <h3>관리자 취소 사유</h3>
          <p>{reservation.adminCancelReason}</p>
        </section>
      ) : null}
    </article>
  );
}

export { ReservationDetail };

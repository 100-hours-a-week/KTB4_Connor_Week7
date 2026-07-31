import { useState } from "react";
import { formatDuration } from "../lib/booking-format.js";

function RoomDetail({ room }) {
  const [imageFailed, setImageFailed] = useState(false);
  const facilities = room.facilities.length
    ? room.facilities
    : ["별도 설비 없음"];

  return (
    <article className="room-detail">
      <div
        className={`room-detail-image${!room.imageUrl || imageFailed ? " room-image-placeholder" : ""}`}
      >
        {room.imageUrl && !imageFailed ? (
          <img
            src={room.imageUrl}
            alt={`${room.name} 대표 이미지`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden="true">
            {room.name.slice(0, 1)}
          </span>
        )}
      </div>
      <header>
        <h2 tabIndex={-1}>{room.name}</h2>
        <p>{room.location.replace(/\s*·\s*/g, ", ")}</p>
      </header>
      <section aria-labelledby="room-summary-heading">
        <h3 id="room-summary-heading">공간 정보</h3>
        <p>{room.description}</p>
        <p>최대 {room.capacity}명</p>
      </section>
      <section aria-labelledby="room-facilities-heading">
        <h3 id="room-facilities-heading">설비</h3>
        <ul className="facility-list">
          {facilities.map((facility) => (
            <li key={facility}>
              <span>{facility}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="room-hours-heading">
        <h3 id="room-hours-heading">운영 시간</h3>
        <p>{room.operatingHours}</p>
        <p>
          최소 {formatDuration(room.minimumDurationMinutes)}, 최대{" "}
          {formatDuration(room.maximumDurationMinutes)}
        </p>
      </section>
      <section aria-labelledby="room-guide-heading">
        <h3 id="room-guide-heading">이용 안내</h3>
        <p>{room.usageGuide}</p>
      </section>
    </article>
  );
}

export { RoomDetail };

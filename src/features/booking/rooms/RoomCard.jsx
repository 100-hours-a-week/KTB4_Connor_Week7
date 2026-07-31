import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

function RoomCard({ room, editing = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [scrollPosition, setScrollPosition] = useState({
    atStart: true,
    atEnd: false,
  });
  const facilitiesRef = useRef(null);
  const facilities = room.facilities.length
    ? room.facilities.slice(0, 3)
    : ["장비 없음"];
  const hasControls = facilities.length > 1;

  function updateScrollPosition() {
    const list = facilitiesRef.current;
    if (!list) return;
    setScrollPosition({
      atStart: list.scrollLeft <= 1,
      atEnd: list.scrollLeft >= list.scrollWidth - list.clientWidth - 1,
    });
  }

  useEffect(updateScrollPosition, []);

  function scrollFacilities(left) {
    facilitiesRef.current?.scrollBy({ left, behavior: "smooth" });
  }

  return (
    <article className="rooms-card">
      {room.imageUrl && !imageFailed ? (
        <img
          src={room.imageUrl}
          alt={`${room.name} 대표 이미지`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="room-image-placeholder" aria-hidden="true">
          {room.name.slice(0, 1)}
        </div>
      )}
      <div className="rooms-card-content">
        <Link
          className="rooms-card-link"
          to={`/rooms/${encodeURIComponent(room.roomId)}${editing ? "?mode=change" : ""}`}
        >
          <strong>{room.name}</strong>
        </Link>
        <span className="rooms-card-location">
          <img
            className="rooms-card-location-icon"
            src="/assets/icons/location-pin.svg"
            alt=""
          />
          {room.location.replace(/\s*·\s*/g, ", ")}
        </span>
        <span>최대 인원 {room.capacity}명</span>
        <div
          className={[
            "rooms-card-facility-carousel",
            hasControls ? "has-controls" : "",
            scrollPosition.atStart ? "at-start" : "",
            scrollPosition.atEnd ? "at-end" : "",
          ].filter(Boolean).join(" ")}
        >
          {hasControls ? (
            <button
              className={`rooms-card-facility-nav${scrollPosition.atStart ? " is-hidden" : ""}`}
              type="button"
              aria-label={`${room.name} 이전 설비`}
              disabled={scrollPosition.atStart}
              onClick={() => scrollFacilities(-96)}
            >
              ‹
            </button>
          ) : null}
          <ul
            className="rooms-card-facilities"
            ref={facilitiesRef}
            onScroll={updateScrollPosition}
          >
            {facilities.map((facility) => (
              <li key={facility}>
                {facility}
              </li>
            ))}
          </ul>
          {hasControls ? (
            <button
              className={`rooms-card-facility-nav${scrollPosition.atEnd ? " is-hidden" : ""}`}
              type="button"
              aria-label={`${room.name} 다음 설비`}
              disabled={scrollPosition.atEnd}
              onClick={() => scrollFacilities(96)}
            >
              ›
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export { RoomCard };

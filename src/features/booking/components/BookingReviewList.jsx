import { Link } from "react-router";
import { formatBookingSchedule } from "../lib/booking-format.js";

function BookingReviewList({ room, draft }) {
  const items = [
    {
      label: "회의실",
      value: `${room.name} (${room.location})`,
    },
    {
      label: "날짜와 시간",
      value: formatBookingSchedule(draft),
      to: `/booking/${encodeURIComponent(draft.roomId)}/date-time`,
    },
    {
      label: "회의 주제",
      value: draft.topic.trim(),
      to: "/booking/information",
    },
    {
      label: "참석자",
      value: `${draft.attendeeChips.length}명 (${draft.attendeeChips.join(", ")})`,
      to: "/booking/information",
    },
    {
      label: "추가 정보",
      value: draft.additionalInfo.trim() || "없음",
      to: "/booking/information",
    },
  ];

  return (
    <dl className="booking-review-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.to ? (
            <Link to={item.to} aria-label={`${item.label} 수정`}>
              수정
            </Link>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

export { BookingReviewList };

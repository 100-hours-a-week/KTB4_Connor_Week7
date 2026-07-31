const filters = [
  ["UPCOMING", "예정"],
  ["PAST", "완료"],
  ["CANCELED", "취소"],
];

function ReservationStatusFilter({ value, onChange }) {
  return (
    <div className="reservation-filter-list" aria-label="예약 상태 필터">
      {filters.map(([status, label]) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          onClick={() => onChange(status)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export { ReservationStatusFilter };

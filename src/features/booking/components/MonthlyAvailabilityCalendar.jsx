const DATE_STATUS_LABELS = {
  FULL: "마감",
  OUTSIDE: "기간 밖",
  PAST: "지난날",
};

function formatDateLabel(date) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function MonthlyAvailabilityCalendar({
  data,
  selectedDate,
  onSelect,
  onPreviousMonth,
  onNextMonth,
  previousMonthDisabled = false,
}) {
  const firstWeekday = new Date(data.year, data.month - 1, 1).getDay();
  const today = new Date().toLocaleDateString("sv-SE");

  return (
    <section className="calendar-section" aria-labelledby="calendar-heading">
      <div className="calendar-heading-row">
        <button
          type="button"
          aria-label="이전 달"
          disabled={previousMonthDisabled}
          onClick={onPreviousMonth}
        >
          ‹
        </button>
        <h3 id="calendar-heading">
          {data.year}. {data.month}
        </h3>
        <button type="button" aria-label="다음 달" onClick={onNextMonth}>
          ›
        </button>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        <span>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>
      <div className="calendar-grid">
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`spacer-${index}`} className="calendar-spacer" />
        ))}
        {data.dates.map((item) => {
          const selected = item.date === selectedDate;
          const statusLabel = DATE_STATUS_LABELS[item.status];
          return (
            <button
              key={item.date}
              type="button"
              className={[
                "calendar-date",
                selected ? "is-selected" : "",
                item.date === today ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-status={item.status.toLowerCase()}
              disabled={item.status !== "AVAILABLE"}
              aria-label={`${formatDateLabel(item.date)}${statusLabel ? `, ${statusLabel}` : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(item.date)}
            >
              <span>{Number(item.date.slice(-2))}</span>
              {statusLabel ? <small>{statusLabel}</small> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { MonthlyAvailabilityCalendar };

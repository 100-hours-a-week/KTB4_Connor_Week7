import { useEffect, useRef, useState } from "react";
import { selectTimeRange } from "../lib/booking-time.js";

function TimeRangeSelector({
  slots,
  maximumDurationMinutes,
  value = null,
  onSelect,
}) {
  const timelineRef = useRef(null);
  const [preview, setPreview] = useState(value);
  const previewRef = useRef(value);
  const pointerAnchorRef = useRef(null);
  const ignoreNextClickRef = useRef(false);

  useEffect(() => {
    setPreview(value);
    previewRef.current = value;
  }, [value?.endTime, value?.startTime]);

  function applyRange(anchorIndex, targetIndex, commit = true) {
    const range = selectTimeRange(
      slots,
      anchorIndex,
      targetIndex,
      maximumDurationMinutes,
    );
    if (!range) return null;
    setPreview(range);
    previewRef.current = range;
    if (commit) onSelect(range);
    return range;
  }

  function handleKeyDown(event, index) {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key) || !preview) return;

    const firstIndex = slots.findIndex(
      (slot) => slot.startTime === preview.startTime,
    );
    const lastIndex = slots.findIndex(
      (slot) => slot.endTime === preview.endTime,
    );
    if (index !== firstIndex && index !== lastIndex) return;

    const delta = event.key === "ArrowLeft" ? -1 : 1;
    const nextFirst =
      index === firstIndex
        ? Math.min(firstIndex + delta, lastIndex)
        : firstIndex;
    const nextLast =
      index === lastIndex
        ? Math.max(lastIndex + delta, firstIndex)
        : lastIndex;
    if (!slots[nextFirst] || !slots[nextLast]) return;

    event.preventDefault();
    const nextRange = applyRange(nextFirst, nextLast);
    if (!nextRange) return;
    const appliedFirstIndex = slots.findIndex(
      (slot) => slot.startTime === nextRange.startTime,
    );
    const appliedLastIndex = slots.findIndex(
      (slot) => slot.endTime === nextRange.endTime,
    );
    let nextFocusIndex =
      index === firstIndex ? appliedFirstIndex : appliedLastIndex;
    if (firstIndex === lastIndex && event.key === "ArrowRight") {
      nextFocusIndex = appliedLastIndex;
    }
    timelineRef.current
      ?.querySelector(`[data-slot-index="${nextFocusIndex}"]`)
      ?.focus();
  }

  function handlePointerMove(event) {
    if (pointerAnchorRef.current === null) return;
    const target =
      event.target.closest?.("[data-slot-index]") ??
      document
        .elementFromPoint?.(event.clientX, event.clientY)
        ?.closest("[data-slot-index]");
    if (!target) return;
    applyRange(
      pointerAnchorRef.current,
      Number(target.dataset.slotIndex),
      false,
    );
  }

  function finishPointerSelection(event) {
    if (pointerAnchorRef.current === null) return;
    if (timelineRef.current?.hasPointerCapture?.(event.pointerId)) {
      timelineRef.current.releasePointerCapture(event.pointerId);
    }
    pointerAnchorRef.current = null;
    if (previewRef.current) onSelect(previewRef.current);
  }

  const firstIndex = preview
    ? slots.findIndex((slot) => slot.startTime === preview.startTime)
    : -1;
  const lastIndex = preview
    ? slots.findIndex((slot) => slot.endTime === preview.endTime)
    : -1;

  return (
    <section className="timeline-section" aria-labelledby="timeline-heading">
      <div className="timeline-heading-row">
        <div>
          <h3 id="timeline-heading">이용 시간</h3>
          <p>시간을 누르거나 좌우로 드래그해 선택하세요.</p>
        </div>
        <div className="timeline-scroll-buttons">
          <button
            type="button"
            aria-label="이전 시간 보기"
            onClick={() =>
              timelineRef.current?.scrollBy({
                left: -220,
                behavior: "smooth",
              })
            }
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 시간 보기"
            onClick={() =>
              timelineRef.current?.scrollBy({
                left: 220,
                behavior: "smooth",
              })
            }
          >
            ›
          </button>
        </div>
      </div>
      <div
        ref={timelineRef}
        className="timeline-scroll"
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerSelection}
        onPointerCancel={finishPointerSelection}
      >
        {slots.map((slot, index) => {
          const selected = firstIndex <= index && index <= lastIndex;
          return (
            <button
              key={slot.startTime}
              type="button"
              className={[
                "timeline-slot",
                selected ? "is-selected" : "",
                selected && index === firstIndex ? "is-start-handle" : "",
                selected && index === lastIndex ? "is-end-handle" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-slot-index={index}
              disabled={slot.state !== "AVAILABLE"}
              aria-label={
                slot.state === "AVAILABLE"
                  ? `${slot.startTime}부터 ${slot.endTime}까지`
                  : `${slot.startTime}, 예약 불가`
              }
              aria-pressed={selected}
              aria-keyshortcuts={
                selected && (index === firstIndex || index === lastIndex)
                  ? "ArrowLeft ArrowRight"
                  : undefined
              }
              onClick={() => {
                if (ignoreNextClickRef.current) {
                  ignoreNextClickRef.current = false;
                  return;
                }
                applyRange(index, index);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPointerDown={(event) => {
                pointerAnchorRef.current = index;
                ignoreNextClickRef.current = true;
                applyRange(index, index, false);
                timelineRef.current?.setPointerCapture?.(event.pointerId);
              }}
            >
              {slot.startTime}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { TimeRangeSelector };

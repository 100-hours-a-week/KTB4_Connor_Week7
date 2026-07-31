const SLOT_MINUTES = 30;
const DEFAULT_MAXIMUM_DURATION_MINUTES = 120;

function selectTimeRange(
  slots,
  anchorIndex,
  targetIndex,
  maximumDurationMinutes = DEFAULT_MAXIMUM_DURATION_MINUTES,
) {
  if (slots[anchorIndex]?.state !== "AVAILABLE") return null;

  const direction = targetIndex >= anchorIndex ? 1 : -1;
  const requestedSlotCount = Math.abs(targetIndex - anchorIndex) + 1;
  const maximumSlotCount = Math.max(1, Math.floor(maximumDurationMinutes / SLOT_MINUTES));
  const selectedIndexes = [anchorIndex];
  let limitedBy = requestedSlotCount > maximumSlotCount ? "duration" : null;

  for (let offset = 1; offset < Math.min(requestedSlotCount, maximumSlotCount); offset += 1) {
    const nextIndex = anchorIndex + offset * direction;
    const nextSlot = slots[nextIndex];
    if (!nextSlot) break;

    if (nextSlot.state !== "AVAILABLE") {
      limitedBy = "availability";
      break;
    }

    selectedIndexes.push(nextIndex);
  }

  const firstIndex = Math.min(...selectedIndexes);
  const lastIndex = Math.max(...selectedIndexes);

  return {
    startTime: slots[firstIndex].startTime,
    endTime: slots[lastIndex].endTime,
    durationMinutes: selectedIndexes.length * SLOT_MINUTES,
    limitedBy,
  };
}

export { DEFAULT_MAXIMUM_DURATION_MINUTES, SLOT_MINUTES, selectTimeRange };

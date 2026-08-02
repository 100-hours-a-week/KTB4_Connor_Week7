function buildReservationPayload(draft) {
  return {
    roomId: draft.roomId,
    startAt: `${draft.date}T${draft.startTime}:00`,
    endAt: `${draft.date}T${draft.endTime}:00`,
    topic: draft.topic.trim(),
    attendees: [...draft.attendeeChips],
    additionalInfo: draft.additionalInfo.trim(),
  };
}

function getReservationErrorAction(error) {
  if (error?.status === 409 && error?.data?.code === "RESERVATION_CONFLICT") {
    return {
      step: "dateTime",
      clearTime: true,
      message: "방금 다른 예약이 확정되었어요.",
    };
  }

  if (error?.status === 409 && error?.data?.code === "CAPACITY_EXCEEDED") {
    return {
      step: "information",
      clearTime: false,
      message: error.message || "선택한 회의실의 정원을 확인해 주세요.",
    };
  }

  return {
    step: "review",
    clearTime: false,
    message: error?.message || "예약을 확정하지 못했어요. 다시 시도해 주세요.",
  };
}

export { buildReservationPayload, getReservationErrorAction };

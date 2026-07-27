import {
  emptyDraft,
  normalizeDraft,
} from "../../../utils/booking-draft.js";

function createEmptyBookingState() {
  return { draft: emptyDraft(), editingReservationId: "" };
}

function bookingDraftReducer(state, action) {
  switch (action.type) {
    case "startBooking":
      return {
        draft: normalizeDraft({
          roomId: action.room.roomId,
          roomName: action.room.name,
          roomCapacity: action.room.capacity,
        }),
        editingReservationId: "",
      };
    case "startEditing":
      return {
        draft: normalizeDraft(action.draft),
        editingReservationId: action.reservationId,
      };
    case "selectDate":
      return {
        ...state,
        draft: {
          ...state.draft,
          date: action.date,
          startTime: "",
          endTime: "",
        },
      };
    case "selectTimeRange":
      return {
        ...state,
        draft: {
          ...state.draft,
          startTime: action.range.startTime,
          endTime: action.range.endTime,
        },
      };
    case "updateInformation":
      return {
        ...state,
        draft: normalizeDraft({
          ...state.draft,
          ...action.information,
        }),
      };
    case "clearTime":
      return {
        ...state,
        draft: { ...state.draft, startTime: "", endTime: "" },
      };
    case "changeRoom":
      return {
        draft: emptyDraft(),
        editingReservationId: state.editingReservationId,
      };
    case "clear":
      return createEmptyBookingState();
    default:
      return state;
  }
}

export { bookingDraftReducer, createEmptyBookingState };

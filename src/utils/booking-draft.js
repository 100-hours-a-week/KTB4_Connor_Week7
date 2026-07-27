const BOOKING_DRAFT_KEY = "roomBookingDraft";
const BOOKING_EDITING_RESERVATION_KEY = "roomBookingEditingReservationId";

const EMPTY_BOOKING_DRAFT = Object.freeze({
  date: "",
  startTime: "",
  endTime: "",
  roomId: "",
  roomName: "",
  roomCapacity: 0,
  topic: "",
  attendeeChips: [],
  additionalInfo: "",
});

function emptyDraft() {
  return { ...EMPTY_BOOKING_DRAFT, attendeeChips: [] };
}

function normalizeDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyDraft();

  return {
    ...emptyDraft(),
    ...value,
    attendeeChips: Array.isArray(value.attendeeChips) ? value.attendeeChips : [],
  };
}

function createBookingDraftStore(storage = globalThis.sessionStorage) {
  function read() {
    try {
      return normalizeDraft(JSON.parse(storage.getItem(BOOKING_DRAFT_KEY) || "null"));
    } catch {
      storage.removeItem(BOOKING_DRAFT_KEY);
      return emptyDraft();
    }
  }

  function update(patch) {
    const currentDraft = read();
    const nextDraft = normalizeDraft({
      ...currentDraft,
      ...patch,
    });

    storage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(nextDraft));
    return nextDraft;
  }

  function clearTime() {
    return update({ startTime: "", endTime: "" });
  }

  function changeRoom() {
    storage.removeItem(BOOKING_DRAFT_KEY);
  }

  function getEditingReservationId() {
    return storage.getItem(BOOKING_EDITING_RESERVATION_KEY) || "";
  }

  function startEditing(reservationId, draft) {
    storage.removeItem(BOOKING_DRAFT_KEY);
    storage.setItem(BOOKING_EDITING_RESERVATION_KEY, reservationId);
    return update(draft);
  }

  function startBooking(draft) {
    clear();
    return update(draft);
  }

  function clear() {
    storage.removeItem(BOOKING_DRAFT_KEY);
    storage.removeItem(BOOKING_EDITING_RESERVATION_KEY);
  }

  return {
    changeRoom,
    clear,
    clearTime,
    getEditingReservationId,
    read,
    startBooking,
    startEditing,
    update,
  };
}

const bookingDraftStore = createBookingDraftStore();

export {
  BOOKING_DRAFT_KEY,
  BOOKING_EDITING_RESERVATION_KEY,
  EMPTY_BOOKING_DRAFT,
  bookingDraftStore,
  createBookingDraftStore,
  emptyDraft,
  normalizeDraft,
};

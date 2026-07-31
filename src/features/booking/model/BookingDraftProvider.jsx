import { createContext, useContext, useEffect, useReducer } from "react";
import {
  BOOKING_DRAFT_KEY,
  BOOKING_EDITING_RESERVATION_KEY,
  emptyDraft,
  normalizeDraft,
} from "./bookingDraftStore.js";
import { bookingDraftReducer } from "./bookingDraft.js";

const BookingDraftContext = createContext(null);

function hasDraftValue(draft) {
  return Object.entries(draft).some(([key, value]) =>
    key === "attendeeChips" ? value.length > 0 : Boolean(value),
  );
}

function readBookingState(storage) {
  let draft = emptyDraft();
  try {
    draft = normalizeDraft(
      JSON.parse(storage.getItem(BOOKING_DRAFT_KEY) || "null"),
    );
  } catch {
    storage.removeItem(BOOKING_DRAFT_KEY);
  }

  return {
    draft,
    editingReservationId:
      storage.getItem(BOOKING_EDITING_RESERVATION_KEY) || "",
  };
}

function persistBookingState(storage, state) {
  if (hasDraftValue(state.draft)) {
    storage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify(normalizeDraft(state.draft)),
    );
  } else {
    storage.removeItem(BOOKING_DRAFT_KEY);
  }

  if (state.editingReservationId) {
    storage.setItem(
      BOOKING_EDITING_RESERVATION_KEY,
      state.editingReservationId,
    );
  } else {
    storage.removeItem(BOOKING_EDITING_RESERVATION_KEY);
  }
}

function BookingDraftProvider({
  children,
  storage = globalThis.sessionStorage,
}) {
  const [state, dispatch] = useReducer(
    bookingDraftReducer,
    storage,
    readBookingState,
  );

  useEffect(() => {
    persistBookingState(storage, state);
  }, [state, storage]);

  return (
    <BookingDraftContext.Provider value={{ ...state, dispatch }}>
      {children}
    </BookingDraftContext.Provider>
  );
}

function useBookingDraft() {
  const value = useContext(BookingDraftContext);
  if (value === null) {
    throw new Error(
      "useBookingDraft must be used inside BookingDraftProvider",
    );
  }
  return value;
}

export {
  BookingDraftProvider,
  persistBookingState,
  readBookingState,
  useBookingDraft,
};

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  BOOKING_DRAFT_KEY,
  BOOKING_EDITING_RESERVATION_KEY,
} from "../../src/features/booking/model/bookingDraftStore.js";
import {
  bookingDraftReducer,
  createEmptyBookingState,
} from "../../src/features/booking/model/bookingDraft.js";
import {
  BookingDraftProvider,
  persistBookingState,
  readBookingState,
  useBookingDraft,
} from "../../src/features/booking/model/BookingDraftProvider.jsx";

function createMemoryStorage(initialEntries = []) {
  const values = new Map(initialEntries);
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe("bookingDraftReducer", () => {
  it("일반 예약 시작은 이전 예약 변경 ID를 삭제한다", () => {
    const current = {
      ...createEmptyBookingState(),
      editingReservationId: "reservation-1",
    };

    const next = bookingDraftReducer(current, {
      type: "startBooking",
      room: { roomId: "t2", name: "T2", capacity: 6 },
    });

    expect(next).toEqual({
      draft: {
        date: "",
        startTime: "",
        endTime: "",
        roomId: "t2",
        roomName: "T2",
        roomCapacity: 6,
        topic: "",
        attendeeChips: [],
        additionalInfo: "",
      },
      editingReservationId: "",
    });
  });

  it("예약 충돌 복구는 날짜와 작성 정보를 유지하고 시간만 삭제한다", () => {
    const current = {
      draft: {
        ...createEmptyBookingState().draft,
        date: "2026-07-26",
        startTime: "09:00",
        endTime: "10:00",
        topic: "회의",
        attendeeChips: ["김현"],
      },
      editingReservationId: "",
    };

    const next = bookingDraftReducer(current, { type: "clearTime" });

    expect(next.draft).toMatchObject({
      date: "2026-07-26",
      startTime: "",
      endTime: "",
      topic: "회의",
      attendeeChips: ["김현"],
    });
  });

  it("예약 변경 시작은 예약 ID와 기존 초안을 함께 설정한다", () => {
    const next = bookingDraftReducer(createEmptyBookingState(), {
      type: "startEditing",
      reservationId: "reservation-1",
      draft: {
        roomId: "ryan2",
        roomName: "RYAN2",
        roomCapacity: 6,
        date: "2026-07-27",
        attendeeChips: ["김현"],
      },
    });

    expect(next.editingReservationId).toBe("reservation-1");
    expect(next.draft).toMatchObject({
      roomId: "ryan2",
      date: "2026-07-27",
      attendeeChips: ["김현"],
    });
  });

  it("날짜를 바꾸면 기존 시간 범위를 삭제한다", () => {
    const current = {
      ...createEmptyBookingState(),
      draft: {
        ...createEmptyBookingState().draft,
        startTime: "09:00",
        endTime: "10:00",
      },
    };

    const next = bookingDraftReducer(current, {
      type: "selectDate",
      date: "2026-07-28",
    });

    expect(next.draft).toMatchObject({
      date: "2026-07-28",
      startTime: "",
      endTime: "",
    });
  });

  it("선택한 시간 범위를 초안에 반영한다", () => {
    const next = bookingDraftReducer(createEmptyBookingState(), {
      type: "selectTimeRange",
      range: { startTime: "09:00", endTime: "10:30" },
    });

    expect(next.draft).toMatchObject({
      startTime: "09:00",
      endTime: "10:30",
    });
  });

  it("예약 정보를 기존 회의실과 일정에 합친다", () => {
    const current = {
      ...createEmptyBookingState(),
      draft: {
        ...createEmptyBookingState().draft,
        roomId: "ryan2",
        date: "2026-07-28",
      },
    };

    const next = bookingDraftReducer(current, {
      type: "updateInformation",
      information: {
        topic: "프로젝트 회의",
        attendeeChips: ["김현"],
        additionalInfo: "화이트보드 사용",
      },
    });

    expect(next.draft).toMatchObject({
      roomId: "ryan2",
      date: "2026-07-28",
      topic: "프로젝트 회의",
      attendeeChips: ["김현"],
      additionalInfo: "화이트보드 사용",
    });
  });

  it("회의실 변경은 예약 변경 ID만 유지하고 초안을 비운다", () => {
    const current = {
      draft: {
        ...createEmptyBookingState().draft,
        roomId: "ryan2",
        topic: "프로젝트 회의",
      },
      editingReservationId: "reservation-1",
    };

    const next = bookingDraftReducer(current, { type: "changeRoom" });

    expect(next).toEqual({
      draft: createEmptyBookingState().draft,
      editingReservationId: "reservation-1",
    });
  });

  it("전체 초기화는 초안과 예약 변경 ID를 모두 비운다", () => {
    const current = {
      draft: {
        ...createEmptyBookingState().draft,
        roomId: "ryan2",
      },
      editingReservationId: "reservation-1",
    };

    expect(bookingDraftReducer(current, { type: "clear" })).toEqual(
      createEmptyBookingState(),
    );
  });
});

describe("예약 초안 저장 경계", () => {
  it("저장된 초안과 예약 변경 ID를 정규화해 복원한다", () => {
    const storage = createMemoryStorage([
      [BOOKING_DRAFT_KEY, JSON.stringify({ roomId: "ryan2" })],
      [BOOKING_EDITING_RESERVATION_KEY, "reservation-1"],
    ]);

    expect(readBookingState(storage)).toEqual({
      draft: {
        ...createEmptyBookingState().draft,
        roomId: "ryan2",
      },
      editingReservationId: "reservation-1",
    });
  });

  it("손상된 초안 JSON은 저장소에서 제거하고 빈 초안으로 복구한다", () => {
    const storage = createMemoryStorage([
      [BOOKING_DRAFT_KEY, "not-json"],
      [BOOKING_EDITING_RESERVATION_KEY, "reservation-1"],
    ]);

    expect(readBookingState(storage)).toEqual({
      draft: createEmptyBookingState().draft,
      editingReservationId: "reservation-1",
    });
    expect(storage.getItem(BOOKING_DRAFT_KEY)).toBeNull();
  });

  it("초안과 예약 변경 ID가 비면 두 저장 key를 삭제한다", () => {
    const storage = createMemoryStorage([
      [BOOKING_DRAFT_KEY, JSON.stringify({ roomId: "ryan2" })],
      [BOOKING_EDITING_RESERVATION_KEY, "reservation-1"],
    ]);

    persistBookingState(storage, createEmptyBookingState());

    expect(storage.getItem(BOOKING_DRAFT_KEY)).toBeNull();
    expect(storage.getItem(BOOKING_EDITING_RESERVATION_KEY)).toBeNull();
  });

  it("Provider가 복원한 상태를 제공하고 reducer 변경을 저장한다", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage([
      [
        BOOKING_DRAFT_KEY,
        JSON.stringify({
          roomId: "ryan2",
          startTime: "09:00",
          endTime: "10:00",
        }),
      ],
    ]);

    function Probe() {
      const { draft, dispatch } = useBookingDraft();
      return (
        <>
          <span>{draft.roomId}</span>
          <button type="button" onClick={() => dispatch({ type: "clearTime" })}>
            시간 초기화
          </button>
        </>
      );
    }

    render(
      <BookingDraftProvider storage={storage}>
        <Probe />
      </BookingDraftProvider>,
    );

    expect(screen.getByText("ryan2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "시간 초기화" }));
    expect(JSON.parse(storage.getItem(BOOKING_DRAFT_KEY))).toMatchObject({
      roomId: "ryan2",
      startTime: "",
      endTime: "",
    });
  });
});

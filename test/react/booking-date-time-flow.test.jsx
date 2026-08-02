import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/features/auth/AuthProvider.jsx";
import { BookingDraftProvider } from "../../src/features/booking/model/BookingDraftProvider.jsx";
import { MonthlyAvailabilityCalendar } from "../../src/features/booking/components/MonthlyAvailabilityCalendar.jsx";
import { TimeRangeSelector } from "../../src/features/booking/components/TimeRangeSelector.jsx";
import { BookingDateTimePage } from "../../src/pages/booking-date-time/BookingDateTimePage.jsx";
import {
  BOOKING_DRAFT_KEY,
  BOOKING_EDITING_RESERVATION_KEY,
} from "../../src/features/booking/model/bookingDraftStore.js";

const slots = [
  { startTime: "09:00", endTime: "09:30", state: "AVAILABLE" },
  { startTime: "09:30", endTime: "10:00", state: "AVAILABLE" },
  { startTime: "10:00", endTime: "10:30", state: "UNAVAILABLE" },
];
const longSlots = [
  { startTime: "09:00", endTime: "09:30", state: "AVAILABLE" },
  { startTime: "09:30", endTime: "10:00", state: "AVAILABLE" },
  { startTime: "10:00", endTime: "10:30", state: "AVAILABLE" },
  { startTime: "10:30", endTime: "11:00", state: "AVAILABLE" },
  { startTime: "11:00", endTime: "11:30", state: "AVAILABLE" },
];

it("선택한 시간의 끝을 오른쪽 화살표로 늘린다", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(
    <TimeRangeSelector
      slots={slots}
      maximumDurationMinutes={120}
      onSelect={onSelect}
    />,
  );

  const firstSlot = screen.getByRole("button", { name: /09:00/ });
  await user.click(firstSlot);
  firstSlot.focus();
  await user.keyboard("{ArrowRight}");

  expect(onSelect).toHaveBeenLastCalledWith({
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    limitedBy: null,
  });
  expect(
    screen.getByRole("button", { name: /^09:30부터/ }),
  ).toHaveFocus();
});

it("포인터로 연속된 두 시간을 선택한다", () => {
  const onSelect = vi.fn();
  const { container } = render(
    <TimeRangeSelector
      slots={slots}
      maximumDurationMinutes={120}
      onSelect={onSelect}
    />,
  );
  const firstSlot = screen.getByRole("button", { name: /^09:00부터/ });
  const secondSlot = screen.getByRole("button", { name: /^09:30부터/ });
  const timeline = container.querySelector(".timeline-scroll");

  fireEvent.pointerDown(firstSlot, { pointerId: 1 });
  fireEvent.pointerMove(secondSlot, { pointerId: 1 });
  fireEvent.pointerUp(timeline, { pointerId: 1 });

  expect(onSelect).toHaveBeenLastCalledWith({
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    limitedBy: null,
  });
});

it("키보드 선택은 불가 시간 앞에서 멈춘다", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(
    <TimeRangeSelector
      slots={slots}
      maximumDurationMinutes={120}
      onSelect={onSelect}
    />,
  );
  const firstSlot = screen.getByRole("button", { name: /^09:00부터/ });

  await user.click(firstSlot);
  await user.keyboard("{ArrowRight}{ArrowRight}");

  expect(onSelect).toHaveBeenLastCalledWith({
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    limitedBy: "availability",
  });
});

it("최대 시간을 넘기면 선택 범위와 키보드 초점을 마지막 허용 시간에 둔다", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(
    <TimeRangeSelector
      slots={longSlots}
      maximumDurationMinutes={120}
      onSelect={onSelect}
    />,
  );
  const firstSlot = screen.getByRole("button", { name: /^09:00부터/ });

  await user.click(firstSlot);
  await user.keyboard(
    "{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}",
  );

  expect(onSelect).toHaveBeenLastCalledWith({
    startTime: "09:00",
    endTime: "11:00",
    durationMinutes: 120,
    limitedBy: "duration",
  });
  expect(
    screen.getByRole("button", { name: /^10:30부터/ }),
  ).toHaveFocus();
});

it("예약할 수 없는 날짜의 상태를 표시하고 선택을 막는다", () => {
  render(
    <MonthlyAvailabilityCalendar
      data={{
        year: 2026,
        month: 7,
        dates: [
          { date: "2026-07-27", status: "AVAILABLE" },
          { date: "2026-07-28", status: "FULL" },
        ],
      }}
      selectedDate="2026-07-27"
      onSelect={vi.fn()}
      onPreviousMonth={vi.fn()}
      onNextMonth={vi.fn()}
      previousMonthDisabled
    />,
  );

  expect(
    screen.getByRole("button", { name: "2026년 7월 27일" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: "2026년 7월 28일, 마감" }),
  ).toBeDisabled();
  expect(screen.getByText("마감")).toBeInTheDocument();
});

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="현재 경로">{location.pathname}</output>;
}

function getCurrentMonthTestDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return {
    year,
    month,
    date: `${year}-${String(month).padStart(2, "0")}-28`,
    label: `${year}년 ${month}월 28일`,
  };
}

function renderPage({
  path = "/booking/t2/date-time",
  loadMonth = vi.fn().mockResolvedValue({
    year: 2026,
    month: 7,
    dates: [],
  }),
  loadDay = vi.fn().mockResolvedValue({
    maximumDurationMinutes: 120,
    slots: [],
  }),
} = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <BookingDraftProvider>
          <CurrentPath />
          <Routes>
            <Route
              path="/booking/:roomId/date-time"
              element={
                <BookingDateTimePage
                  loadMonth={loadMonth}
                  loadDay={loadDay}
                />
              }
            />
            <Route path="*" element={<div />} />
          </Routes>
        </BookingDraftProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("예약 날짜·시간 화면", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("accessToken", "token");
  });

  it("예약 초안에 회의실이 없으면 회의실 목록으로 복구한다", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/rooms"),
    );
  });

  it("URL 회의실과 초안 회의실이 다르면 URL 회의실 상세로 복구한다", async () => {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ roomId: "t2", roomName: "T2", roomCapacity: 6 }),
    );
    renderPage({ path: "/booking/other/date-time" });

    expect(await screen.findByLabelText("현재 경로")).toHaveTextContent(
      "/rooms/other",
    );
  });

  it("날짜와 시간을 선택한 뒤 예약 정보 단계로 이동한다", async () => {
    const user = userEvent.setup();
    const currentMonth = getCurrentMonthTestDate();
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        roomId: "t2",
        roomName: "T2",
        roomCapacity: 6,
      }),
    );
    const loadMonth = vi.fn().mockResolvedValue({
      year: currentMonth.year,
      month: currentMonth.month,
      dates: [
        {
          date: `${currentMonth.date.slice(0, -2)}27`,
          status: "PAST",
        },
        { date: currentMonth.date, status: "AVAILABLE" },
      ],
    });
    const loadDay = vi.fn().mockResolvedValue({
      maximumDurationMinutes: 120,
      slots,
    });
    renderPage({ loadMonth, loadDay });

    await user.click(
      await screen.findByRole("button", { name: currentMonth.label }),
    );
    await user.click(
      await screen.findByRole("button", { name: /^09:00부터/ }),
    );
    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(loadMonth).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: "t2",
        year: currentMonth.year,
        month: currentMonth.month,
      }),
    );
    expect(loadDay).toHaveBeenCalledWith(
      expect.objectContaining({ roomId: "t2", date: currentMonth.date }),
    );
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
      "/booking/information",
    );
  });

  it("저장된 날짜와 시간 선택을 복원한다", async () => {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        roomId: "t2",
        roomName: "T2",
        roomCapacity: 6,
        date: "2026-07-28",
        startTime: "09:00",
        endTime: "10:00",
      }),
    );
    renderPage({
      loadMonth: vi.fn().mockResolvedValue({
        year: 2026,
        month: 7,
        dates: [{ date: "2026-07-28", status: "AVAILABLE" }],
      }),
      loadDay: vi.fn().mockResolvedValue({
        maximumDurationMinutes: 120,
        slots,
      }),
    });

    expect(
      await screen.findByText("7. 28(화) 오전 9:00~오전 10:00"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^09:00부터/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("예약 변경 중에는 일간 가용성에서 현재 예약을 제외한다", async () => {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        roomId: 5,
        roomName: "T2",
        roomCapacity: 6,
        date: "2026-07-28",
      }),
    );
    sessionStorage.setItem(BOOKING_EDITING_RESERVATION_KEY, "51");
    const loadDay = vi.fn().mockResolvedValue({
      maximumDurationMinutes: 120,
      slots,
    });

    renderPage({
      path: "/booking/5/date-time",
      loadMonth: vi.fn().mockResolvedValue({
        year: 2026,
        month: 7,
        dates: [{ date: "2026-07-28", status: "AVAILABLE" }],
      }),
      loadDay,
    });

    await waitFor(() =>
      expect(loadDay).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: "5",
          date: "2026-07-28",
          excludeReservationId: "51",
        }),
      ),
    );
  });

  it("날짜를 바꾸면 기존 시간만 지우고 다음 이동을 막는다", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        roomId: "t2",
        roomName: "T2",
        roomCapacity: 6,
        date: "2026-07-28",
        startTime: "09:00",
        endTime: "10:00",
        topic: "프로젝트 회의",
      }),
    );
    renderPage({
      loadMonth: vi.fn().mockResolvedValue({
        year: 2026,
        month: 7,
        dates: [
          { date: "2026-07-28", status: "AVAILABLE" },
          { date: "2026-07-29", status: "AVAILABLE" },
        ],
      }),
      loadDay: vi.fn().mockResolvedValue({
        maximumDurationMinutes: 120,
        slots,
      }),
    });

    await user.click(
      await screen.findByRole("button", { name: "2026년 7월 29일" }),
    );

    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
    await waitFor(() =>
      expect(
        JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY)),
      ).toMatchObject({
        date: "2026-07-29",
        startTime: "",
        endTime: "",
        topic: "프로젝트 회의",
      }),
    );
  });

  it("예약 가능한 시간이 없으면 빈 상태를 표시한다", async () => {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        roomId: "t2",
        roomName: "T2",
        roomCapacity: 6,
        date: "2026-07-28",
      }),
    );
    renderPage({
      loadMonth: vi.fn().mockResolvedValue({
        year: 2026,
        month: 7,
        dates: [{ date: "2026-07-28", status: "AVAILABLE" }],
      }),
      loadDay: vi.fn().mockResolvedValue({
        maximumDurationMinutes: 120,
        slots: slots.map((slot) => ({ ...slot, state: "UNAVAILABLE" })),
      }),
    });

    expect(
      await screen.findByText("이 날짜에는 예약 가능한 시간이 없어요."),
    ).toBeInTheDocument();
  });

  it("예약 복구 피드백을 한 번 표시하고 저장소에서 지운다", async () => {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ roomId: "t2", roomName: "T2", roomCapacity: 6 }),
    );
    sessionStorage.setItem(
      "bookingFeedback",
      "예약 시간이 겹쳐 다시 선택해 주세요.",
    );
    renderPage();

    expect(
      await screen.findByText("예약 시간이 겹쳐 다시 선택해 주세요."),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("bookingFeedback")).toBeNull();
  });

  it("월 조회 실패 후 다시 시도한다", async () => {
    const user = userEvent.setup();
    const currentMonth = getCurrentMonthTestDate();
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ roomId: "t2", roomName: "T2", roomCapacity: 6 }),
    );
    const loadMonth = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        year: currentMonth.year,
        month: currentMonth.month,
        dates: [{ date: currentMonth.date, status: "AVAILABLE" }],
      });
    renderPage({ loadMonth });

    await user.click(
      await screen.findByRole("button", { name: "다시 시도" }),
    );

    expect(
      await screen.findByRole("button", { name: currentMonth.label }),
    ).toBeInTheDocument();
    expect(loadMonth).toHaveBeenCalledTimes(2);
  });

  it("일별 시간 조회 실패 후 다시 시도한다", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        roomId: "t2",
        roomName: "T2",
        roomCapacity: 6,
        date: "2026-07-28",
      }),
    );
    const loadDay = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        maximumDurationMinutes: 120,
        slots,
      });
    renderPage({
      loadMonth: vi.fn().mockResolvedValue({
        year: 2026,
        month: 7,
        dates: [{ date: "2026-07-28", status: "AVAILABLE" }],
      }),
      loadDay,
    });

    await user.click(
      await screen.findByRole("button", { name: "다시 시도" }),
    );

    expect(
      await screen.findByRole("button", { name: /^09:00부터/ }),
    ).toBeInTheDocument();
    expect(loadDay).toHaveBeenCalledTimes(2);
  });

  it("비활성 회의실 오류면 초안을 비우고 목록으로 복구한다", async () => {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ roomId: "t2", roomName: "T2", roomCapacity: 6 }),
    );
    const error = Object.assign(new Error("inactive"), {
      data: { code: "ROOM_INACTIVE" },
    });
    renderPage({ loadMonth: vi.fn().mockRejectedValue(error) });

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/rooms"),
    );
    expect(sessionStorage.getItem("roomsFeedback")).toBe(
      "이 회의실은 더 이상 예약할 수 없어요.",
    );
    await waitFor(() =>
      expect(sessionStorage.getItem(BOOKING_DRAFT_KEY)).toBeNull(),
    );
  });

  it("401이면 인증을 지우고 로그인 화면으로 복구한다", async () => {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ roomId: "t2", roomName: "T2", roomCapacity: 6 }),
    );
    const error = Object.assign(new Error("unauthorized"), { status: 401 });
    renderPage({ loadMonth: vi.fn().mockRejectedValue(error) });

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/login"),
    );
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });
});

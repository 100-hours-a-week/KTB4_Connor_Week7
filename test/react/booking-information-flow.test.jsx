import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/features/auth/AuthProvider.jsx";
import { AttendeeInput } from "../../src/features/booking/components/AttendeeInput.jsx";
import { BookingDraftProvider } from "../../src/features/booking/model/BookingDraftProvider.jsx";
import { BookingInformationPage } from "../../src/pages/booking-information/BookingInformationPage.jsx";
import { BookingReviewPage } from "../../src/pages/booking-review/BookingReviewPage.jsx";
import { BOOKING_DRAFT_KEY } from "../../src/features/booking/model/bookingDraftStore.js";

function AttendeeHarness({ initialValue = [], capacity = 6 }) {
  const [value, setValue] = useState(initialValue);
  return (
    <AttendeeInput
      value={value}
      capacity={capacity}
      onChange={setValue}
    />
  );
}

it("쉼표로 끝난 이름을 중복 없이 chip으로 만든다", async () => {
  const user = userEvent.setup();
  render(<AttendeeHarness />);

  await user.type(
    screen.getByLabelText("참석자"),
    "김현, 김현, 이도윤,",
  );

  expect(screen.getByText("김현")).toBeInTheDocument();
  expect(screen.getByText("이도윤")).toBeInTheDocument();
  expect(screen.getAllByText("김현")).toHaveLength(1);
});

it("빈 이름은 chip으로 만들지 않고 삭제 버튼으로 참석자를 제거한다", async () => {
  const user = userEvent.setup();
  render(<AttendeeHarness initialValue={["김현"]} />);

  await user.type(screen.getByLabelText("참석자"), " ,");
  expect(
    screen.getAllByRole("button", { name: /참석자 삭제/ }),
  ).toHaveLength(1);

  await user.click(
    screen.getByRole("button", { name: "김현 참석자 삭제" }),
  );
  expect(screen.queryByText("김현")).not.toBeInTheDocument();
});

it("한글 조합 중에는 쉼표를 chip으로 확정하지 않는다", () => {
  render(<AttendeeHarness />);
  const input = screen.getByLabelText("참석자");

  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: "김현," } });
  expect(screen.queryByText("김현")).not.toBeInTheDocument();

  fireEvent.compositionEnd(input, { data: "김현," });
  expect(screen.getByText("김현")).toBeInTheDocument();
});

it("정원을 넘으면 입력과 오류 메시지를 연결한다", () => {
  render(
    <AttendeeHarness
      initialValue={["김현", "이도윤", "최하늘"]}
      capacity={2}
    />,
  );

  expect(screen.getByLabelText("참석자")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(screen.getByText("최대 2명까지 이용할 수 있어요.")).toBeInTheDocument();
});

const room = {
  roomId: "t2",
  name: "T2",
  location: "인포데스크 옆",
  capacity: 2,
  facilities: ["TV", "화이트보드"],
  description: "프로젝트 회의실",
  operatingHours: "09:00~18:00",
  usageGuide: "깨끗하게 사용해 주세요.",
  minimumDurationMinutes: 30,
  maximumDurationMinutes: 120,
  imageUrl: "/assets/rooms/t2.png",
  active: true,
};

const scheduleDraft = {
  roomId: "t2",
  roomName: "T2",
  roomCapacity: 2,
  date: "2026-07-28",
  startTime: "09:00",
  endTime: "10:00",
};

const completeDraft = {
  ...scheduleDraft,
  topic: "프로젝트 회의",
  attendeeChips: ["김현", "이도윤"],
  additionalInfo: "화이트보드를 사용합니다.",
};

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="현재 경로">{location.pathname}</output>;
}

function saveDraft(draft) {
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
}

function renderBookingPage({
  path,
  draft,
  informationLoadRoom = vi.fn().mockResolvedValue(room),
  reviewLoadRoom = vi.fn().mockResolvedValue(room),
}) {
  if (draft) saveDraft(draft);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <BookingDraftProvider>
          <CurrentPath />
          <Routes>
            <Route
              path="/booking/information"
              element={
                <BookingInformationPage loadRoom={informationLoadRoom} />
              }
            />
            <Route
              path="/booking/review"
              element={<BookingReviewPage loadRoom={reviewLoadRoom} />}
            />
            <Route path="*" element={<div />} />
          </Routes>
        </BookingDraftProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("예약 정보 화면", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("accessToken", "token");
    sessionStorage.setItem("nickname", "코너");
  });

  it("예약 초안에 회의실이 없으면 회의실 목록으로 복구한다", async () => {
    renderBookingPage({ path: "/booking/information" });

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/rooms"),
    );
  });

  it("날짜와 시간이 없으면 날짜와 시간 단계로 복구한다", async () => {
    renderBookingPage({
      path: "/booking/information",
      draft: { roomId: "t2", roomName: "T2", roomCapacity: 2 },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
        "/booking/t2/date-time",
      ),
    );
  });

  it("정보를 저장하고 검토 단계로 이동한다", async () => {
    const user = userEvent.setup();
    renderBookingPage({
      path: "/booking/information",
      draft: scheduleDraft,
    });

    await screen.findByText(/인포데스크 옆/);
    await user.type(screen.getByLabelText(/^회의 주제/), "프로젝트 회의");
    await user.type(screen.getByLabelText("참석자"), "김현, 이도윤,");
    await user.type(
      screen.getByLabelText(/^추가 정보/),
      "화이트보드를 사용합니다.",
    );
    const nextButton = screen.getByRole("button", { name: "다음" });
    expect(nextButton).toHaveAttribute("aria-disabled", "false");
    await user.click(nextButton);

    expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
      "/booking/review",
    );
    await waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY))).toMatchObject(
        completeDraft,
      ),
    );
  });

  it("필수 정보가 없으면 최초 오류 입력으로 초점을 옮긴다", async () => {
    const user = userEvent.setup();
    renderBookingPage({
      path: "/booking/information",
      draft: scheduleDraft,
    });

    await screen.findByText(/인포데스크 옆/);
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByLabelText(/^회의 주제/)).toHaveFocus();
    expect(screen.getByText("회의 주제를 입력해 주세요.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^회의 주제/), "주간 회의");
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByLabelText("참석자")).toHaveFocus();
    expect(
      screen.getByText("참석자를 한 명 이상 추가해 주세요."),
    ).toBeInTheDocument();
  });

  it("현재 회의실 정원을 넘으면 다음 단계 이동을 막는다", async () => {
    sessionStorage.setItem(
      "bookingFeedback",
      "최대 2명까지 이용할 수 있어요.",
    );
    renderBookingPage({
      path: "/booking/information",
      draft: {
        ...scheduleDraft,
        topic: "주간 회의",
        attendeeChips: ["김현", "이도윤", "최하늘"],
      },
    });

    expect(
      await screen.findByText("최대 2명까지 이용할 수 있어요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(sessionStorage.getItem("bookingFeedback")).toBeNull();
  });

  it("회의실 조회 실패 후 다시 시도한다", async () => {
    const user = userEvent.setup();
    const loadRoom = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(room);
    renderBookingPage({
      path: "/booking/information",
      draft: scheduleDraft,
      informationLoadRoom: loadRoom,
    });

    await user.click(
      await screen.findByRole("button", { name: "다시 시도" }),
    );

    expect(await screen.findByText(/인포데스크 옆/)).toBeInTheDocument();
    expect(loadRoom).toHaveBeenCalledTimes(2);
  });
});

describe("예약 검토 화면", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("accessToken", "token");
    sessionStorage.setItem("nickname", "코너");
  });

  it("회의 주제나 참석자가 없으면 정보 입력 단계로 복구한다", async () => {
    renderBookingPage({
      path: "/booking/review",
      draft: scheduleDraft,
    });

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
        "/booking/information",
      ),
    );
  });

  it("예약 내용을 표시하고 일정과 정보 수정 링크를 제공한다", async () => {
    renderBookingPage({
      path: "/booking/review",
      draft: completeDraft,
    });

    expect(await screen.findByText("T2 (인포데스크 옆)")).toBeInTheDocument();
    expect(
      screen.getByText("7. 28(화) 오전 9:00~오전 10:00"),
    ).toBeInTheDocument();
    expect(screen.getByText("2명 (김현, 이도윤)")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "회의실 수정" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "날짜와 시간 수정" }),
    ).toHaveAttribute("href", "/booking/t2/date-time");
    expect(
      screen.getByRole("link", { name: "회의 주제 수정" }),
    ).toHaveAttribute("href", "/booking/information");
    expect(
      screen.getByRole("link", { name: "참석자 수정" }),
    ).toHaveAttribute("href", "/booking/information");
    expect(
      screen.getByRole("link", { name: "추가 정보 수정" }),
    ).toHaveAttribute("href", "/booking/information");
  });

  it("최신 회의실 정원을 넘으면 입력값을 유지하고 정보 단계로 복구한다", async () => {
    renderBookingPage({
      path: "/booking/review",
      draft: {
        ...completeDraft,
        attendeeChips: ["김현", "이도윤", "최하늘"],
      },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
        "/booking/information",
      ),
    );
    expect(
      await screen.findByText("최대 2명까지 이용할 수 있어요."),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("bookingFeedback")).toBeNull();
    expect(
      JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY)).attendeeChips,
    ).toEqual(["김현", "이도윤", "최하늘"]);
  });
});

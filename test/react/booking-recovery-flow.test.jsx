import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/app/providers/AuthProvider.jsx";
import { BookingDraftProvider } from "../../src/features/book-room/model/BookingDraftProvider.jsx";
import { BookingReviewPage } from "../../src/pages/booking-review/BookingReviewPage.jsx";
import { BOOKING_DRAFT_KEY } from "../../src/utils/booking-draft.js";

const draft = {
  roomId: "t2",
  roomName: "T2",
  roomCapacity: 6,
  date: "2026-07-28",
  startTime: "09:00",
  endTime: "10:00",
  topic: "프로젝트 회의",
  attendeeChips: ["김현", "이도윤"],
  additionalInfo: "화이트보드 사용",
};

const room = {
  roomId: "t2",
  name: "T2",
  location: "인포데스크 옆",
  capacity: 6,
};

function CurrentPath() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

function renderReviewPage(error) {
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));

  render(
    <MemoryRouter initialEntries={["/booking/review"]}>
      <AuthProvider>
        <BookingDraftProvider>
          <CurrentPath />
          <Routes>
            <Route
              path="/booking/review"
              element={
                <BookingReviewPage
                  loadRoom={vi.fn().mockResolvedValue(room)}
                  create={vi.fn().mockRejectedValue(error)}
                />
              }
            />
            <Route path="*" element={<p>복구 경로</p>} />
          </Routes>
        </BookingDraftProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function submitReservation() {
  const user = userEvent.setup();
  await screen.findByText("T2 (인포데스크 옆)");
  await user.click(screen.getByRole("button", { name: "예약 확정" }));
}

describe("예약 mutation 오류 복구", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("accessToken", "token");
    sessionStorage.setItem("userId", "user-1");
    sessionStorage.setItem("nickname", "코너");
  });

  it("예약 충돌은 시간만 지우고 날짜·시간 단계로 보낸다", async () => {
    renderReviewPage(
      Object.assign(new Error("충돌"), {
        status: 409,
        data: { code: "RESERVATION_CONFLICT" },
      }),
    );

    await submitReservation();

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
        "/booking/t2/date-time",
      ),
    );
    await waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY))).toEqual({
        ...draft,
        startTime: "",
        endTime: "",
      }),
    );
    expect(sessionStorage.getItem("bookingFeedback")).toBe(
      "방금 다른 예약이 확정되었어요.",
    );
  });

  it("정원 초과는 초안을 유지하고 정보 단계로 보낸다", async () => {
    renderReviewPage(
      Object.assign(new Error("최대 1명까지 이용할 수 있어요."), {
        status: 409,
        data: { code: "CAPACITY_EXCEEDED" },
      }),
    );

    await submitReservation();

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
        "/booking/information",
      ),
    );
    expect(JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY))).toEqual(
      draft,
    );
    expect(sessionStorage.getItem("bookingFeedback")).toBe(
      "최대 1명까지 이용할 수 있어요.",
    );
  });

  it("비활성 회의실은 초안을 비우고 회의실 목록으로 보낸다", async () => {
    renderReviewPage(
      Object.assign(new Error("비활성 회의실"), {
        data: { code: "ROOM_INACTIVE" },
      }),
    );

    await submitReservation();

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
        "/rooms",
      ),
    );
    await waitFor(() =>
      expect(sessionStorage.getItem(BOOKING_DRAFT_KEY)).toBeNull(),
    );
    expect(sessionStorage.getItem("roomsFeedback")).toBe(
      "이 회의실은 더 이상 예약할 수 없어요.",
    );
  });

  it("401은 인증 복구만 수행한다", async () => {
    renderReviewPage(
      Object.assign(new Error("인증 만료"), { status: 401 }),
    );

    await submitReservation();

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
        "/login",
      ),
    );
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("loginFeedback")).toBe(
      "로그인이 만료되었어요. 다시 로그인해 주세요.",
    );
  });

  it("알 수 없는 오류는 초안을 보존하고 다시 제출할 수 있다", async () => {
    renderReviewPage(new Error("네트워크 연결을 확인해 주세요."));

    await submitReservation();

    expect(
      await screen.findByText("네트워크 연결을 확인해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예약 확정" })).toBeEnabled();
    expect(JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY))).toEqual(
      draft,
    );
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
      "/booking/review",
    );
  });
});

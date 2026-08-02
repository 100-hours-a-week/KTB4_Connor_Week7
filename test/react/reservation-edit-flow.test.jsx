import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/features/auth/AuthProvider.jsx";
import { ReservationDetailPage } from "../../src/pages/reservation-detail/ReservationDetailPage.jsx";
import {
  BOOKING_DRAFT_KEY,
  BOOKING_EDITING_RESERVATION_KEY,
} from "../../src/features/booking/model/bookingDraftStore.js";

const reservation = {
  reservationId: "reservation-1",
  roomId: "t2",
  room: {
    roomId: "t2",
    name: "T2",
    location: "인포데스크 옆",
    capacity: 6,
  },
  startAt: "2099-07-28T09:00:00",
  endAt: "2099-07-28T10:00:00",
  topic: "프로젝트 회의",
  attendees: ["김현", "이도윤"],
  additionalInfo: "화이트보드 사용",
  status: "CONFIRMED",
  canChange: true,
  canCancel: true,
  createdAt: "2026-07-20T10:00:00",
  updatedAt: "2026-07-20T10:00:00",
};

function renderDetail(value = reservation) {
  sessionStorage.setItem("accessToken", "test-token");
  return render(
    <MemoryRouter initialEntries={["/reservations/reservation-1"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/reservations/:reservationId"
            element={
              <ReservationDetailPage
                loadReservation={vi.fn().mockResolvedValue(value)}
              />
            }
          />
          <Route
            path="/booking/:roomId/date-time"
            element={<h1>예약 날짜와 시간 변경</h1>}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("예약 변경 진입", () => {
  beforeEach(() => sessionStorage.clear());

  it("예약 상세를 draft로 저장하고 날짜·시간 변경 route로 이동한다", async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(
      await screen.findByRole("button", { name: "예약 변경" }),
    );

    expect(
      screen.getByRole("heading", { name: "예약 날짜와 시간 변경" }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(BOOKING_EDITING_RESERVATION_KEY)).toBe(
      "reservation-1",
    );
    expect(JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY))).toEqual({
      roomId: "t2",
      roomName: "T2",
      roomCapacity: 6,
      date: "2099-07-28",
      startTime: "09:00",
      endTime: "10:00",
      topic: "프로젝트 회의",
      attendeeChips: ["김현", "이도윤"],
      additionalInfo: "화이트보드 사용",
    });
  });

  it.each([
    ["완료된 예약", { status: "COMPLETED", canChange: false, canCancel: false }],
    [
      "이미 시작한 예약",
      {
        startAt: "2020-07-28T09:00:00",
        endAt: "2020-07-28T10:00:00",
        canChange: false,
        canCancel: false,
      },
    ],
  ])("%s에는 변경 버튼을 표시하지 않는다", async (_name, patch) => {
    renderDetail({ ...reservation, ...patch });

    expect(
      await screen.findByRole("heading", { name: "프로젝트 회의" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "예약 변경" }),
    ).not.toBeInTheDocument();
  });
});

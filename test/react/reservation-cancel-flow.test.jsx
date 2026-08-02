import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/features/auth/AuthProvider.jsx";
import { ReservationDetailPage } from "../../src/pages/reservation-detail/ReservationDetailPage.jsx";

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

function renderDetail({
  loadReservation = vi.fn().mockResolvedValue(reservation),
  cancel = vi.fn(),
} = {}) {
  sessionStorage.setItem("accessToken", "test-token");
  return render(
    <MemoryRouter initialEntries={["/reservations/reservation-1"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/reservations/:reservationId"
            element={
              <ReservationDetailPage
                loadReservation={loadReservation}
                cancel={cancel}
              />
            }
          />
          <Route path="/login" element={<h1>로그인</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("예약 취소", () => {
  beforeEach(() => sessionStorage.clear());

  it("확인 중 중복 요청을 막고 취소된 최신 상세를 다시 조회한다", async () => {
    const user = userEvent.setup();
    let resolveCancel;
    const cancel = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveCancel = resolve;
        }),
    );
    const canceled = {
      ...reservation,
      status: "CANCELED_BY_USER",
      canChange: false,
      canCancel: false,
      updatedAt: "2026-07-27T10:00:00",
    };
    const loadReservation = vi
      .fn()
      .mockResolvedValueOnce(reservation)
      .mockResolvedValueOnce(canceled);
    renderDetail({ loadReservation, cancel });

    await user.click(
      await screen.findByRole("button", { name: "예약 취소" }),
    );
    expect(screen.getByRole("button", { name: "돌아가기" })).toHaveFocus();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "T2, 7. 28(화) 오전 9:00~오전 10:00",
    );

    await user.click(screen.getByRole("button", { name: "취소하기" }));
    await user.click(screen.getByRole("button", { name: "취소 중…" }));

    expect(cancel).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledWith(
      "reservation-1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByRole("button", { name: "취소 중…" })).toBeDisabled();

    resolveCancel(canceled);

    await waitFor(() => expect(loadReservation).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("예약 취소")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "예약 취소" }),
    ).not.toBeInTheDocument();
  });

  it("돌아가기와 Escape는 요청하지 않고 호출 버튼으로 초점을 돌린다", async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    renderDetail({ cancel });

    const opener = await screen.findByRole("button", { name: "예약 취소" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "돌아가기" }));
    expect(opener).toHaveFocus();

    await user.click(opener);
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    await waitFor(() => expect(opener).toHaveFocus());
    expect(cancel).not.toHaveBeenCalled();
  });

  it("409 실패는 상세를 유지하고 오류와 호출 버튼 초점을 복구한다", async () => {
    const user = userEvent.setup();
    const error = Object.assign(new Error("이 예약은 취소할 수 없어요."), {
      status: 409,
    });
    renderDetail({ cancel: vi.fn().mockRejectedValue(error) });

    const opener = await screen.findByRole("button", { name: "예약 취소" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "취소하기" }));

    expect(
      await screen.findByText("이 예약은 취소할 수 없어요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "프로젝트 회의" })).toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("403 실패는 상세를 유지하고 관리 action을 제거한다", async () => {
    const user = userEvent.setup();
    const error = Object.assign(
      new Error("이 예약을 취소할 권한이 없어요."),
      { status: 403 },
    );
    renderDetail({ cancel: vi.fn().mockRejectedValue(error) });

    await user.click(
      await screen.findByRole("button", { name: "예약 취소" }),
    );
    await user.click(screen.getByRole("button", { name: "취소하기" }));

    const feedback = await screen.findByText(
      "이 예약을 취소할 권한이 없어요.",
    );
    expect(feedback).toHaveFocus();
    expect(screen.getByRole("heading", { name: "프로젝트 회의" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "예약 변경" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "예약 취소" }),
    ).not.toBeInTheDocument();
  });

  it("401 실패는 공통 인증 복구로 로그인 route로 이동한다", async () => {
    const user = userEvent.setup();
    const error = Object.assign(new Error("expired"), { status: 401 });
    renderDetail({ cancel: vi.fn().mockRejectedValue(error) });

    await user.click(
      await screen.findByRole("button", { name: "예약 취소" }),
    );
    await user.click(screen.getByRole("button", { name: "취소하기" }));

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });

  it("상세 화면이 사라지면 진행 중인 취소 요청을 중단한다", async () => {
    const user = userEvent.setup();
    let requestSignal;
    const cancel = vi.fn((_reservationId, { signal }) => {
      requestSignal = signal;
      return new Promise(() => {});
    });
    const { unmount } = renderDetail({ cancel });

    await user.click(
      await screen.findByRole("button", { name: "예약 취소" }),
    );
    await user.click(screen.getByRole("button", { name: "취소하기" }));
    await waitFor(() => expect(requestSignal).toBeInstanceOf(AbortSignal));

    unmount();

    expect(requestSignal.aborted).toBe(true);
  });
});

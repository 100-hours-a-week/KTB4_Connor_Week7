import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/app/providers/AuthProvider.jsx";
import { ReservationDetailPage } from "../../src/pages/reservation-detail/ReservationDetailPage.jsx";
import { ReservationsPage } from "../../src/pages/reservations/ReservationsPage.jsx";

function renderReservations(loadReservations) {
  sessionStorage.setItem("accessToken", "test-token");
  return render(
    <MemoryRouter initialEntries={["/reservations"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/reservations"
            element={<ReservationsPage loadReservations={loadReservations} />}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("내 예약 목록과 상세", () => {
  beforeEach(() => sessionStorage.clear());

  const room = {
    roomId: "ryan2",
    name: "RYAN2",
    location: "인포데스크 옆",
    imageUrl: "/room.png",
  };

  const upcoming = {
    reservationId: "reservation-upcoming",
    room,
    startAt: "2026-07-28T10:00:00+09:00",
    endAt: "2026-07-28T11:00:00+09:00",
    topic: "프로젝트 회의",
    attendees: ["김현", "이도윤"],
    additionalInfo: "화이트보드를 사용할 예정입니다.",
    status: "CONFIRMED",
    createdAt: "2026-07-20T10:00:00+09:00",
    updatedAt: "2026-07-20T10:00:00+09:00",
  };

  const past = {
    ...upcoming,
    reservationId: "reservation-past",
    topic: "완료한 스터디",
    status: "COMPLETED",
  };

  function renderReservationsWithRoute(loadReservations, initialEntry = "/reservations") {
    sessionStorage.setItem("accessToken", "test-token");
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/reservations"
              element={<ReservationsPage loadReservations={loadReservations} />}
            />
            <Route path="/login" element={<h1>로그인</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  function renderReservationDetail(loadReservation, initialEntry = "/reservations/reservation-upcoming") {
    sessionStorage.setItem("accessToken", "test-token");
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/reservations/:reservationId"
              element={<ReservationDetailPage loadReservation={loadReservation} />}
            />
            <Route path="/login" element={<h1>로그인</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it("예약 목록을 불러오는 동안 loading 상태를 표시한다", () => {
    renderReservations(() => new Promise(() => {}));

    expect(screen.getByText("예약 목록을 불러오는 중이에요.")).toBeInTheDocument();
  });

  it("예약 목록과 접근 가능한 상세 링크를 표시한다", async () => {
    const loadReservations = vi.fn().mockResolvedValue({
      items: [upcoming],
      nextCursor: null,
    });
    renderReservations(loadReservations);

    expect(await screen.findByText("프로젝트 회의")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RYAN2/ })).toHaveAttribute(
      "href",
      "/reservations/reservation-upcoming",
    );
    expect(loadReservations).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "UPCOMING",
        cursor: "",
        size: 5,
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("필터 변경 시 이전 요청을 중단하고 늦은 응답을 무시한다", async () => {
    const user = userEvent.setup();
    const requests = [];
    const loadReservations = vi.fn(({ status, signal }) =>
      new Promise((resolve, reject) => {
        requests.push({ status, signal, resolve });
        signal.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      }),
    );
    renderReservationsWithRoute(loadReservations);

    await waitFor(() => expect(requests).toHaveLength(1));
    await user.click(screen.getByRole("button", { name: "완료" }));
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0].signal.aborted).toBe(true);

    requests[0].resolve({ items: [upcoming], nextCursor: null });
    requests[1].resolve({ items: [past], nextCursor: null });

    expect(await screen.findByText("완료한 스터디")).toBeInTheDocument();
    expect(screen.queryByText("프로젝트 회의")).not.toBeInTheDocument();
  });

  it("cursor로 더 불러오고 중복 예약은 한 번만 표시한다", async () => {
    const user = userEvent.setup();
    const loadReservations = vi
      .fn()
      .mockResolvedValueOnce({ items: [upcoming], nextCursor: "1" })
      .mockResolvedValueOnce({
        items: [upcoming, { ...past, reservationId: "reservation-second" }],
        nextCursor: null,
      });
    renderReservationsWithRoute(loadReservations);

    expect(await screen.findByText("프로젝트 회의")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "더 보기" }));

    expect(await screen.findByText("완료한 스터디")).toBeInTheDocument();
    expect(loadReservations).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "UPCOMING", cursor: "1" }),
    );
    expect(screen.getAllByText("프로젝트 회의")).toHaveLength(1);
  });

  it("결과가 없으면 필터에 맞는 empty 상태를 표시한다", async () => {
    renderReservationsWithRoute(
      vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    );

    expect(await screen.findByText("예정된 예약이 없어요.")).toBeInTheDocument();
  });

  it("첫 조회 실패 후 다시 시도한다", async () => {
    const user = userEvent.setup();
    const loadReservations = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ items: [upcoming], nextCursor: null });
    renderReservationsWithRoute(loadReservations);

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("프로젝트 회의")).toBeInTheDocument();
    expect(loadReservations).toHaveBeenCalledTimes(2);
  });

  it("추가 조회 실패에서도 기존 목록을 유지하고 다시 시도한다", async () => {
    const user = userEvent.setup();
    const loadReservations = vi
      .fn()
      .mockResolvedValueOnce({ items: [upcoming], nextCursor: "1" })
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ items: [past], nextCursor: null });
    renderReservationsWithRoute(loadReservations);

    await screen.findByText("프로젝트 회의");
    await user.click(screen.getByRole("button", { name: "더 보기" }));
    expect(await screen.findByText("예약 목록을 더 불러오지 못했어요.")).toBeInTheDocument();
    expect(screen.getByText("프로젝트 회의")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByText("완료한 스터디")).toBeInTheDocument();
  });

  it("401은 공통 인증 복구를 사용해 로그인으로 이동한다", async () => {
    const error = Object.assign(new Error("expired"), { status: 401 });
    renderReservationsWithRoute(vi.fn().mockRejectedValue(error));

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });

  it("목록 화면이 사라지면 진행 중인 조회를 중단한다", async () => {
    let requestSignal;
    const loadReservations = vi.fn(({ signal }) => {
      requestSignal = signal;
      return new Promise(() => {});
    });
    const { unmount } = renderReservationsWithRoute(loadReservations);

    await waitFor(() => expect(requestSignal).toBeInstanceOf(AbortSignal));
    unmount();

    expect(requestSignal.aborted).toBe(true);
  });

  it("예약 상세를 불러오는 동안 loading 상태를 표시한다", () => {
    renderReservationDetail(() => new Promise(() => {}));

    expect(screen.getByText("예약 정보를 불러오는 중이에요.")).toBeInTheDocument();
  });

  it("URL reservationId로 상세 정보를 조회하고 표시 컴포넌트만 렌더링한다", async () => {
    const loadReservation = vi.fn().mockResolvedValue(upcoming);
    renderReservationDetail(loadReservation);

    expect(await screen.findByRole("heading", { name: "프로젝트 회의" })).toBeInTheDocument();
    expect(screen.getByText("예약 확정")).toBeInTheDocument();
    expect(screen.getByText("RYAN2 (인포데스크 옆)")).toBeInTheDocument();
    expect(screen.getByText("참석자", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "예약 변경" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "예약 취소" })).not.toBeInTheDocument();
    expect(loadReservation).toHaveBeenCalledWith(
      "reservation-upcoming",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it.each([
    [403, "이 예약을 확인할 권한이 없어요."],
    [404, "예약을 찾을 수 없어요."],
  ])("예약 상세 %s 오류를 표시하고 재시도를 제공하지 않는다", async (status, message) => {
    const error = Object.assign(new Error(message), { status });
    renderReservationDetail(vi.fn().mockRejectedValue(error));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
  });

  it("일반 상세 조회 오류에서 다시 시도한다", async () => {
    const loadReservation = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(upcoming);
    const user = userEvent.setup();
    renderReservationDetail(loadReservation);

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("heading", { name: "프로젝트 회의" })).toBeInTheDocument();
    expect(loadReservation).toHaveBeenCalledTimes(2);
  });

  it("상세 조회 401은 공통 인증 복구를 사용한다", async () => {
    const error = Object.assign(new Error("expired"), { status: 401 });
    renderReservationDetail(vi.fn().mockRejectedValue(error));

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });

  it("상세 화면이 사라지면 진행 중인 조회를 중단한다", async () => {
    let requestSignal;
    const loadReservation = vi.fn((_reservationId, { signal }) => {
      requestSignal = signal;
      return new Promise(() => {});
    });
    const { unmount } = renderReservationDetail(loadReservation);

    await waitFor(() => expect(requestSignal).toBeInstanceOf(AbortSignal));
    unmount();

    expect(requestSignal.aborted).toBe(true);
  });
});

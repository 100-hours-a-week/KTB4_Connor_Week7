import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/app/providers/AuthProvider.jsx";
import { useAuth } from "../../src/features/authenticate/AuthContext.jsx";
import { AppRouter } from "../../src/app/router/AppRouter.jsx";
import { RouteErrorBoundary } from "../../src/app/router/RouteErrorBoundary.jsx";
import { RouteFocus } from "../../src/app/router/RouteFocus.jsx";
import { BOOKING_DRAFT_KEY } from "../../src/utils/booking-draft.js";

function saveAuthenticatedSnapshot() {
  sessionStorage.setItem("accessToken", "token");
  sessionStorage.setItem("userId", "user-1");
  sessionStorage.setItem("nickname", "코너");
  sessionStorage.setItem("profileImage", "/profile.png");
}

function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <RouteFocus />
        <AppRouter />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function AuthenticationProbe() {
  const {
    user,
    accessToken,
    saveAuthenticatedUser,
    updateAuthenticatedUser,
    recoverUnauthorized,
  } = useAuth();
  const location = useLocation();
  const [recovered, setRecovered] = useState(null);

  return (
    <main>
      <h1 tabIndex={-1}>인증 확인</h1>
      <output aria-label="현재 경로">{location.pathname}</output>
      <output aria-label="인증 토큰">{accessToken}</output>
      <output aria-label="사용자 별명">{user.nickname}</output>
      <output aria-label="복구 결과">{String(recovered)}</output>
      <button
        type="button"
        onClick={() =>
          saveAuthenticatedUser({
            accessToken: "saved-token",
            userId: "saved-user",
            nickname: "저장 사용자",
            profileImage: null,
          })
        }
      >
        인증 저장
      </button>
      <button
        type="button"
        onClick={() => updateAuthenticatedUser({ nickname: "수정 사용자" })}
      >
        사용자 수정
      </button>
      <button
        type="button"
        onClick={() => setRecovered(recoverUnauthorized({ status: 401 }))}
      >
        401 복구
      </button>
      <button
        type="button"
        onClick={() => setRecovered(recoverUnauthorized({ status: 500 }))}
      >
        500 유지
      </button>
    </main>
  );
}

function renderAuthenticationProbe() {
  return render(
    <MemoryRouter initialEntries={["/rooms"]}>
      <AuthProvider>
        <AuthenticationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function NavigationProbe() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate("/signup")}>
      회원가입으로 이동
    </button>
  );
}

function ThrowingPage() {
  throw new Error("render failure");
}

describe("AppRouter", () => {
  beforeEach(() => sessionStorage.clear());

  it("루트에서 비로그인 사용자를 로그인 route로 보낸다", async () => {
    renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: "로그인" }),
    ).toBeInTheDocument();
  });

  it("루트에서 인증 사용자를 회의실 route로 보낸다", async () => {
    saveAuthenticatedSnapshot();
    renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: "회의실" }),
    ).toBeInTheDocument();
  });

  it("비로그인 사용자를 보호 route에서 로그인 route로 보낸다", async () => {
    renderRoute("/reservations");

    expect(
      await screen.findByRole("heading", { name: "로그인" }),
    ).toBeInTheDocument();
  });

  it("인증 사용자가 로그인 route에 접근하면 회의실 route로 보낸다", async () => {
    saveAuthenticatedSnapshot();
    renderRoute("/login");

    expect(
      await screen.findByRole("heading", { name: "회의실" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["/login", "로그인"],
    ["/signup", "회원가입"],
  ])("%s 공개 route를 표시한다", async (path, heading) => {
    renderRoute(path);

    expect(
      await screen.findByRole("heading", { name: heading }),
    ).toBeInTheDocument();
  });

  it.each([
    ["/profile", "회원정보수정"],
    ["/profile/password", "비밀번호 수정"],
    ["/rooms", "회의실"],
    ["/rooms/ryan2", "회의실 상세"],
    ["/booking/confirmed/reservation-1", "예약 완료"],
    ["/reservations", "내 예약"],
    ["/reservations/reservation-1", "예약 상세"],
  ])("%s 보호 route를 표시한다", async (path, heading) => {
    saveAuthenticatedSnapshot();
    renderRoute(path);

    expect(
      await screen.findByRole("heading", { name: heading }),
    ).toBeInTheDocument();
  });

  it("예약 완료 route 직접 진입에서 조회 결과를 표시한다", async () => {
    saveAuthenticatedSnapshot();
    renderRoute("/booking/confirmed/missing-reservation");

    expect(
      await screen.findByText("예약 정보를 찾을 수 없어요."),
    ).toBeInTheDocument();
  });

  it.each([
    ["/booking/information", "예약 정보를 입력해 주세요", false],
    ["/booking/review", "예약 내용을 확인해 주세요", true],
  ])(
    "%s 예약 route를 유효한 초안과 함께 표시한다",
    async (path, heading, includeInformation) => {
      saveAuthenticatedSnapshot();
      sessionStorage.setItem(
        BOOKING_DRAFT_KEY,
        JSON.stringify({
          roomId: "ryan2",
          roomName: "RYAN2",
          roomCapacity: 6,
          date: "2026-07-28",
          startTime: "09:00",
          endTime: "10:00",
          topic: includeInformation ? "프로젝트 회의" : "",
          attendeeChips: includeInformation ? ["코너"] : [],
        }),
      );
      renderRoute(path);

      expect(
        await screen.findByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    },
  );

  it("예약 초안과 일치하는 날짜·시간 화면을 표시한다", async () => {
    saveAuthenticatedSnapshot();
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        roomId: "ryan2",
        roomName: "RYAN2",
        roomCapacity: 6,
      }),
    );
    renderRoute("/booking/ryan2/date-time");

    expect(
      await screen.findByRole("heading", {
        name: "날짜와 시간을 선택해 주세요",
      }),
    ).toBeInTheDocument();
  });

  it("알 수 없는 route를 인증 상태에 맞는 시작 route로 보낸다", async () => {
    renderRoute("/unknown");

    expect(
      await screen.findByRole("heading", { name: "로그인" }),
    ).toBeInTheDocument();
  });

  it("예약 route에서만 저장된 예약 초안을 Provider로 복원한다", async () => {
    saveAuthenticatedSnapshot();
    sessionStorage.setItem(BOOKING_DRAFT_KEY, "not-json");

    const profile = renderRoute("/profile");
    await screen.findByRole("heading", { name: "회원정보수정" });
    expect(sessionStorage.getItem(BOOKING_DRAFT_KEY)).toBe("not-json");
    profile.unmount();

    renderRoute("/booking/information");
    await screen.findByRole("heading", { name: "회의실" });
    expect(sessionStorage.getItem(BOOKING_DRAFT_KEY)).toBeNull();
  });
});

describe("AuthProvider", () => {
  beforeEach(() => sessionStorage.clear());

  it("인증 사용자를 저장소와 React 상태에 함께 저장한다", async () => {
    const user = userEvent.setup();
    renderAuthenticationProbe();

    await user.click(screen.getByRole("button", { name: "인증 저장" }));

    expect(screen.getByLabelText("인증 토큰")).toHaveTextContent("saved-token");
    expect(screen.getByLabelText("사용자 별명")).toHaveTextContent("저장 사용자");
    expect(sessionStorage.getItem("accessToken")).toBe("saved-token");
    expect(sessionStorage.getItem("userId")).toBe("saved-user");
    expect(sessionStorage.getItem("nickname")).toBe("저장 사용자");
  });

  it("사용자 snapshot을 저장소와 React 상태에서 갱신한다", async () => {
    const user = userEvent.setup();
    saveAuthenticatedSnapshot();
    renderAuthenticationProbe();

    await user.click(screen.getByRole("button", { name: "사용자 수정" }));

    expect(screen.getByLabelText("사용자 별명")).toHaveTextContent("수정 사용자");
    expect(sessionStorage.getItem("nickname")).toBe("수정 사용자");
  });

  it("401이면 인증을 지우고 로그인 route로 복구한다", async () => {
    const user = userEvent.setup();
    saveAuthenticatedSnapshot();
    renderAuthenticationProbe();

    await user.click(screen.getByRole("button", { name: "401 복구" }));

    expect(screen.getByLabelText("복구 결과")).toHaveTextContent("true");
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/login");
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("userId")).toBeNull();
    expect(sessionStorage.getItem("nickname")).toBeNull();
    expect(sessionStorage.getItem("profileImage")).toBeNull();
    expect(sessionStorage.getItem("loginFeedback")).toBe(
      "로그인이 만료되었어요. 다시 로그인해 주세요.",
    );
  });

  it("401이 아니면 인증과 현재 route를 유지한다", async () => {
    const user = userEvent.setup();
    saveAuthenticatedSnapshot();
    renderAuthenticationProbe();

    await user.click(screen.getByRole("button", { name: "500 유지" }));

    expect(screen.getByLabelText("복구 결과")).toHaveTextContent("false");
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/rooms");
    expect(sessionStorage.getItem("accessToken")).toBe("token");
  });
});

describe("route 사용자 복구", () => {
  beforeEach(() => sessionStorage.clear());

  it("route 이동 뒤 새 화면의 주 heading으로 초점을 옮긴다", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <NavigationProbe />
          <RouteFocus />
          <AppRouter />
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: "회원가입으로 이동" }),
    );

    expect(
      await screen.findByRole("heading", { name: "회원가입" }),
    ).toHaveFocus();
  });

  it("예상하지 못한 render 오류에 복구 경로를 표시한다", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      render(
        <RouteErrorBoundary>
          <ThrowingPage />
        </RouteErrorBoundary>,
      );
    } finally {
      consoleError.mockRestore();
    }

    expect(
      screen.getByRole("heading", { name: "화면을 표시하지 못했어요." }),
    ).toHaveFocus();
    expect(screen.getByRole("link", { name: "처음으로 돌아가기" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});

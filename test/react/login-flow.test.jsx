import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/app/providers/AuthProvider.jsx";
import { AppRouter } from "../../src/app/router/AppRouter.jsx";
import { LoginForm } from "../../src/features/authenticate/LoginForm.jsx";
import { LogoutButton } from "../../src/features/authenticate/LogoutButton.jsx";
import { LoginPage } from "../../src/pages/login/LoginPage.jsx";

function saveAuthenticatedSnapshot() {
  sessionStorage.setItem("accessToken", "token");
  sessionStorage.setItem("userId", "user-1");
  sessionStorage.setItem("nickname", "코너");
  sessionStorage.setItem("profileImage", "/profile.png");
}

function LocationProbe() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

function renderLogoutButton(logoutRequest) {
  return render(
    <MemoryRouter initialEntries={["/rooms"]}>
      <AuthProvider>
        <LogoutButton logoutRequest={logoutRequest} />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function fillValidLoginForm(user) {
  await user.type(screen.getByLabelText("이메일"), "connor@example.com");
  await user.type(screen.getByLabelText("비밀번호"), "Password1!");
}

describe("LoginForm", () => {
  beforeEach(() => sessionStorage.clear());

  it("유효한 입력으로 로그인하고 인증 사용자를 전달한다", async () => {
    const user = userEvent.setup();
    const authenticatedUser = {
      accessToken: "token",
      userId: "user-1",
      nickname: "코너",
      profileImage: null,
    };
    const authenticate = vi.fn().mockResolvedValue(authenticatedUser);
    const onAuthenticated = vi.fn();

    render(
      <LoginForm
        authenticate={authenticate}
        onAuthenticated={onAuthenticated}
      />,
    );

    await fillValidLoginForm(user);
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(authenticate).toHaveBeenCalledWith({
      email: "connor@example.com",
      password: "Password1!",
    });
    expect(onAuthenticated).toHaveBeenCalledWith(authenticatedUser);
  });

  it("필수 입력과 이메일 형식 오류를 각 입력에 표시한다", async () => {
    const user = userEvent.setup();

    render(
      <LoginForm authenticate={vi.fn()} onAuthenticated={vi.fn()} />,
    );

    await user.click(screen.getByLabelText("이메일"));
    await user.tab();
    expect(screen.getByText("* 이메일을 입력해주세요.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("이메일"), "invalid-email");
    await user.tab();
    expect(
      screen.getByText("* 올바른 이메일 주소 형식을 입력해주세요."),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("비밀번호"));
    await user.tab();
    expect(screen.getByText("* 비밀번호를 입력해주세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
  });

  it("서버 실패를 form 오류로 표시하고 입력을 보존한다", async () => {
    const user = userEvent.setup();
    const authenticate = vi
      .fn()
      .mockRejectedValue(new Error("* 아이디 또는 비밀번호를 확인해주세요"));

    render(
      <LoginForm
        authenticate={authenticate}
        onAuthenticated={vi.fn()}
      />,
    );

    await fillValidLoginForm(user);
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("* 아이디 또는 비밀번호를 확인해주세요"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toHaveValue(
      "connor@example.com",
    );
    expect(screen.getByLabelText("비밀번호")).toHaveValue("Password1!");
  });

  it("로그인 요청 중 중복 제출을 막는다", async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const authenticate = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );

    render(
      <LoginForm
        authenticate={authenticate}
        onAuthenticated={vi.fn()}
      />,
    );

    await fillValidLoginForm(user);
    const submitButton = screen.getByRole("button", { name: "로그인" });
    await user.click(submitButton);
    await user.click(screen.getByRole("button", { name: "로그인 중..." }));

    expect(authenticate).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "로그인 중..." })).toBeDisabled();

    resolveLogin({
      accessToken: "token",
      userId: "user-1",
      nickname: "코너",
      profileImage: null,
    });
  });
});

describe("LoginPage", () => {
  beforeEach(() => sessionStorage.clear());

  it("브랜드 헤더와 모바일 앱 셸 안에 로그인 화면을 표시한다", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "홈으로" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("main").closest(".auth-app-shell")).toHaveClass(
      "booking-body",
      "booking-app-shell",
      "auth-app-shell",
    );
  });

  it("인증 만료 피드백을 한 번 표시하고 저장소에서 지운다", () => {
    sessionStorage.setItem(
      "loginFeedback",
      "로그인이 만료되었어요. 다시 로그인해 주세요.",
    );

    const { unmount } = render(
      <StrictMode>
        <MemoryRouter initialEntries={["/login"]}>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      </StrictMode>,
    );

    expect(
      screen.getByText("로그인이 만료되었어요. 다시 로그인해 주세요."),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("loginFeedback")).toBeNull();

    unmount();
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/login"]}>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      </StrictMode>,
    );

    expect(
      screen.queryByText("로그인이 만료되었어요. 다시 로그인해 주세요."),
    ).not.toBeInTheDocument();
  });
});

describe("LogoutButton", () => {
  beforeEach(() => sessionStorage.clear());

  it("로그아웃 성공 후 인증 정보를 지우고 로그인 route로 이동한다", async () => {
    const user = userEvent.setup();
    saveAuthenticatedSnapshot();
    renderLogoutButton(vi.fn().mockResolvedValue(undefined));

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("userId")).toBeNull();
    expect(sessionStorage.getItem("nickname")).toBeNull();
    expect(sessionStorage.getItem("profileImage")).toBeNull();
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/login");
  });

  it("서버 로그아웃 실패에도 인증 정보를 지우고 로그인 route로 이동한다", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    saveAuthenticatedSnapshot();
    renderLogoutButton(vi.fn().mockRejectedValue(new Error("network error")));

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(consoleError).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/login");
    consoleError.mockRestore();
  });

  it("로그아웃 요청 중 중복 클릭을 막는다", async () => {
    const user = userEvent.setup();
    let resolveLogout;
    const logoutRequest = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogout = resolve;
        }),
    );
    saveAuthenticatedSnapshot();
    renderLogoutButton(logoutRequest);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));
    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(logoutRequest).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeDisabled();

    resolveLogout();
  });

});

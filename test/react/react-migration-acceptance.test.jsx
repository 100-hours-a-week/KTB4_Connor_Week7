import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../../src/app/providers/AuthProvider.jsx";
import { AppRouter } from "../../src/app/router/AppRouter.jsx";

function renderRoute(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("React 마이그레이션 route 수용 기준", () => {
  beforeEach(() => sessionStorage.clear());

  it.each([
    ["/login", "로그인"],
    ["/signup", "회원가입"],
  ])("%s 공개 route는 직접 열 수 있다", async (route, heading) => {
    renderRoute(route);

    expect(
      await screen.findByRole("heading", { name: heading }),
    ).toBeInTheDocument();
  });

  it.each([
    "/profile",
    "/profile/password",
    "/rooms",
    "/rooms/ryan2",
    "/booking/ryan2/date-time",
    "/booking/information",
    "/booking/review",
    "/booking/confirmed/reservation-1",
    "/reservations",
    "/reservations/reservation-1",
  ])("%s 보호 route는 비로그인 직접 진입을 로그인으로 복구한다", async (route) => {
    renderRoute(route);

    expect(
      await screen.findByRole("heading", { name: "로그인" }),
    ).toBeInTheDocument();
  });
});

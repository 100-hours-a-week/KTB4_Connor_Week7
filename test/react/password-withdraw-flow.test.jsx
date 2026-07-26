import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/app/providers/AuthProvider.jsx";
import { PasswordChangeForm } from "../../src/features/manage-profile/PasswordChangeForm.jsx";
import { WithdrawAccountButton } from "../../src/features/manage-profile/WithdrawAccountButton.jsx";
import { ProfileEditPage } from "../../src/pages/profile-edit/ProfileEditPage.jsx";

const currentUser = {
  userId: "user-1",
  email: "connor@example.com",
  nickname: "코너",
  profileImage: null,
};

function LocationProbe() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

function saveAuthenticatedSnapshot() {
  sessionStorage.setItem("accessToken", "token");
  sessionStorage.setItem("userId", "user-1");
  sessionStorage.setItem("nickname", "코너");
}

async function fillValidPasswordForm(user) {
  await user.type(screen.getByLabelText("현재 비밀번호"), "Password1!");
  await user.type(screen.getByLabelText("새 비밀번호"), "Password2!");
  await user.type(screen.getByLabelText("새 비밀번호 확인"), "Password2!");
}

describe("비밀번호 변경", () => {
  beforeEach(() => sessionStorage.clear());

  it("현재 비밀번호와 일치하는 새 비밀번호를 전송하고 form을 비운다", async () => {
    const user = userEvent.setup();
    const changePassword = vi.fn().mockResolvedValue({});

    render(
      <PasswordChangeForm
        changePassword={changePassword}
        onUnauthorized={vi.fn(() => false)}
      />,
    );

    await fillValidPasswordForm(user);
    await user.click(screen.getByRole("button", { name: "수정하기" }));

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "Password1!",
      newPassword: "Password2!",
    });
    expect(screen.getByLabelText("현재 비밀번호")).toHaveValue("");
    expect(screen.getByLabelText("새 비밀번호")).toHaveValue("");
    expect(screen.getByLabelText("새 비밀번호 확인")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("수정완료");
  });

  it("현재 비밀번호·새 비밀번호 정책·확인 불일치를 각 helper에 표시한다", async () => {
    const user = userEvent.setup();

    render(
      <PasswordChangeForm
        changePassword={vi.fn()}
        onUnauthorized={vi.fn(() => false)}
      />,
    );

    const currentPassword = screen.getByLabelText("현재 비밀번호");
    await user.click(currentPassword);
    await user.tab();
    expect(
      screen.getByText("*현재 비밀번호를 입력해주세요"),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("새 비밀번호"), "weak");
    await user.tab();
    expect(
      screen.getByText(
        "*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.",
      ),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("새 비밀번호 확인"), "different");
    await user.tab();
    expect(screen.getByText("*비밀번호가 다릅니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수정하기" })).toBeDisabled();
  });

  it("서버 실패 시 입력을 보존하고 요청 중 중복 제출을 막는다", async () => {
    const user = userEvent.setup();
    let rejectChange;
    const changePassword = vi.fn(
      () =>
        new Promise((resolve, reject) => {
          rejectChange = reject;
        }),
    );

    render(
      <PasswordChangeForm
        changePassword={changePassword}
        onUnauthorized={vi.fn(() => false)}
      />,
    );

    await fillValidPasswordForm(user);
    await user.click(screen.getByRole("button", { name: "수정하기" }));
    await user.click(screen.getByRole("button", { name: "수정 중..." }));

    expect(changePassword).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "수정 중..." })).toBeDisabled();

    rejectChange(new Error("*비밀번호 수정에 실패했습니다."));

    expect(
      await screen.findByText("*비밀번호 수정에 실패했습니다."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("현재 비밀번호")).toHaveValue("Password1!");
    expect(screen.getByLabelText("새 비밀번호")).toHaveValue("Password2!");
  });

  it("401이면 인증 복구 경계에 오류를 전달한다", async () => {
    const user = userEvent.setup();
    const unauthorized = Object.assign(new Error("인증 만료"), {
      status: 401,
    });
    const onUnauthorized = vi.fn(() => true);

    render(
      <PasswordChangeForm
        changePassword={vi.fn().mockRejectedValue(unauthorized)}
        onUnauthorized={onUnauthorized}
      />,
    );

    await fillValidPasswordForm(user);
    await user.click(screen.getByRole("button", { name: "수정하기" }));

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledWith(unauthorized));
    expect(
      screen.queryByText("*비밀번호 수정에 실패했습니다."),
    ).not.toBeInTheDocument();
  });
});

describe("회원 탈퇴", () => {
  beforeEach(() => sessionStorage.clear());

  it("취소와 Escape는 탈퇴하지 않고 호출 버튼으로 초점을 돌린다", async () => {
    const user = userEvent.setup();
    const withdraw = vi.fn();

    render(
      <WithdrawAccountButton
        withdraw={withdraw}
        onUnauthorized={vi.fn(() => false)}
        onWithdrawn={vi.fn()}
      />,
    );

    const opener = screen.getByRole("button", { name: "회원 탈퇴" });
    await user.click(opener);
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(opener).toHaveFocus();
    expect(withdraw).not.toHaveBeenCalled();

    await user.click(opener);
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    await waitFor(() => expect(opener).toHaveFocus());
    expect(withdraw).not.toHaveBeenCalled();
  });

  it("확인 요청 중 중복 클릭을 막고 성공 결과를 전달한다", async () => {
    const user = userEvent.setup();
    let resolveWithdraw;
    const withdraw = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveWithdraw = resolve;
        }),
    );
    const onWithdrawn = vi.fn();

    render(
      <WithdrawAccountButton
        withdraw={withdraw}
        onUnauthorized={vi.fn(() => false)}
        onWithdrawn={onWithdrawn}
      />,
    );

    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));
    await user.click(screen.getByRole("button", { name: "탈퇴 중..." }));

    expect(withdraw).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "탈퇴 중..." })).toBeDisabled();

    resolveWithdraw();
    await waitFor(() => expect(onWithdrawn).toHaveBeenCalledOnce());
  });

  it("탈퇴 실패 시 dialog를 닫고 오류와 호출 버튼 focus를 복구한다", async () => {
    const user = userEvent.setup();

    render(
      <WithdrawAccountButton
        withdraw={vi
          .fn()
          .mockRejectedValue(new Error("*회원 탈퇴에 실패했습니다."))}
        onUnauthorized={vi.fn(() => false)}
        onWithdrawn={vi.fn()}
      />,
    );

    const opener = screen.getByRole("button", { name: "회원 탈퇴" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(
      await screen.findByText("*회원 탈퇴에 실패했습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { hidden: true }),
    ).not.toHaveAttribute("open");
    expect(opener).toHaveFocus();
  });

  it("탈퇴 성공 후 인증 정보를 지우고 로그인 route로 이동한다", async () => {
    const user = userEvent.setup();
    saveAuthenticatedSnapshot();

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AuthProvider>
          <ProfileEditPage
            loadProfile={vi.fn().mockResolvedValue(currentUser)}
            upload={vi.fn()}
            updateProfile={vi.fn()}
            withdraw={vi.fn().mockResolvedValue(undefined)}
          />
          <LocationProbe />
        </AuthProvider>
      </MemoryRouter>,
    );

    await screen.findByLabelText("닉네임");
    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/login"),
    );
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("userId")).toBeNull();
    expect(sessionStorage.getItem("nickname")).toBeNull();
  });
});

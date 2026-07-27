import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "../../src/features/register-user/SignupForm.jsx";
import { SignupPage } from "../../src/pages/signup/SignupPage.jsx";

const imageFile = new File(["image"], "profile.png", {
  type: "image/png",
});
const NativeURL = globalThis.URL;

async function fillValidSignupForm(user) {
  await user.upload(screen.getByLabelText("프로필 사진"), imageFile);
  await user.type(screen.getByLabelText("이메일*"), "connor@example.com");
  await user.type(screen.getByLabelText("비밀번호*"), "Password1!");
  await user.type(screen.getByLabelText("비밀번호 확인*"), "Password1!");
  await user.type(screen.getByLabelText("닉네임*"), "코너");
}

function LocationProbe() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

describe("회원가입 흐름", () => {
  beforeEach(() => {
    class TestURL extends NativeURL {}
    TestURL.createObjectURL = vi.fn(() => "blob:profile");
    TestURL.revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", TestURL);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("이미지 업로드가 끝난 뒤 회원가입 payload를 전송한다", async () => {
    const user = userEvent.setup();
    const calls = [];
    const upload = vi.fn(async () => {
      calls.push("upload");
      return "/images/profile.png";
    });
    const register = vi.fn(async () => {
      calls.push("signup");
    });
    const onCompleted = vi.fn();

    render(
      <SignupForm
        upload={upload}
        register={register}
        onCompleted={onCompleted}
      />,
    );

    await fillValidSignupForm(user);
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    await waitFor(() => expect(onCompleted).toHaveBeenCalledOnce());
    expect(calls).toEqual(["upload", "signup"]);
    expect(register).toHaveBeenCalledWith({
      email: "connor@example.com",
      password: "Password1!",
      nickname: "코너",
      profileImage: "/images/profile.png",
    });
  });

  it("필수값이 없으면 각 field 오류를 표시하고 요청하지 않는다", () => {
    const upload = vi.fn(() => new Promise(() => {}));
    const register = vi.fn();
    const { container } = render(
      <SignupForm
        upload={upload}
        register={register}
        onCompleted={vi.fn()}
      />,
    );

    fireEvent.submit(container.querySelector("form"));

    expect(
      screen.getByText("*프로필 사진을 추가해주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("*이메일을 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("*비밀번호를 입력해주세요")).toBeInTheDocument();
    expect(
      screen.getByText("*비밀번호를 한번더 입력해주세요"),
    ).toBeInTheDocument();
    expect(screen.getByText("*닉네임을 입력해주세요.")).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "회원가입" })).toBeDisabled();
  });

  it("이메일 공백과 형식 오류를 구분하고 요청하지 않는다", async () => {
    const user = userEvent.setup();
    const upload = vi.fn();
    const { container } = render(
      <SignupForm
        upload={upload}
        register={vi.fn()}
        onCompleted={vi.fn()}
      />,
    );

    await fillValidSignupForm(user);
    const email = screen.getByLabelText("이메일*");

    await user.clear(email);
    await user.type(email, "connor @example.com");
    fireEvent.submit(container.querySelector("form"));
    expect(
      screen.getByText("*이메일에는 공백을 사용할 수 없습니다."),
    ).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();

    await user.clear(email);
    await user.type(email, "invalid-email");
    fireEvent.submit(container.querySelector("form"));
    expect(
      screen.getByText(
        "*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)",
      ),
    ).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it("비밀번호 정책과 확인 불일치를 구분하고 요청하지 않는다", async () => {
    const user = userEvent.setup();
    const upload = vi.fn();
    const { container } = render(
      <SignupForm
        upload={upload}
        register={vi.fn()}
        onCompleted={vi.fn()}
      />,
    );

    await fillValidSignupForm(user);
    const password = screen.getByLabelText("비밀번호*");
    const passwordConfirm = screen.getByLabelText("비밀번호 확인*");

    await user.clear(password);
    await user.type(password, "password");
    await user.clear(passwordConfirm);
    await user.type(passwordConfirm, "password");
    fireEvent.submit(container.querySelector("form"));
    expect(
      screen.getByText(
        "*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.",
      ),
    ).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();

    await user.clear(password);
    await user.type(password, "Password1!");
    await user.clear(passwordConfirm);
    await user.type(passwordConfirm, "Password2!");
    fireEvent.submit(container.querySelector("form"));
    expect(screen.getByText("*비밀번호가 다릅니다.")).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it("닉네임 공백과 10자 초과 오류를 구분하고 요청하지 않는다", async () => {
    const user = userEvent.setup();
    const upload = vi.fn();
    const { container } = render(
      <SignupForm
        upload={upload}
        register={vi.fn()}
        onCompleted={vi.fn()}
      />,
    );

    await fillValidSignupForm(user);
    const nickname = screen.getByLabelText("닉네임*");

    await user.clear(nickname);
    await user.type(nickname, "코 너");
    fireEvent.submit(container.querySelector("form"));
    expect(screen.getByText("*띄어쓰기를 없애주세요")).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();

    await user.clear(nickname);
    await user.type(nickname, "열한글자닉네임입니다요");
    fireEvent.submit(container.querySelector("form"));
    expect(
      screen.getByText("*닉네임은 최대 10자까지 작성 가능합니다."),
    ).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it("이미지 업로드가 실패하면 회원가입 요청을 보내지 않고 입력을 유지한다", async () => {
    const user = userEvent.setup();
    const register = vi.fn();
    render(
      <SignupForm
        upload={vi.fn().mockRejectedValue(
          new Error("*회원가입에 실패했습니다. 다시 시도해주세요."),
        )}
        register={register}
        onCompleted={vi.fn()}
      />,
    );

    await fillValidSignupForm(user);
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      await screen.findByText("*회원가입에 실패했습니다. 다시 시도해주세요."),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    expect(screen.getByLabelText("이메일*")).toHaveValue(
      "connor@example.com",
    );
    expect(screen.getByLabelText("닉네임*")).toHaveValue("코너");
  });

  it("이메일 중복 오류를 이메일 helper에 표시한다", async () => {
    const user = userEvent.setup();
    render(
      <SignupForm
        upload={vi.fn().mockResolvedValue("/images/profile.png")}
        register={vi
          .fn()
          .mockRejectedValue(new Error("이미 사용 중인 이메일입니다."))}
        onCompleted={vi.fn()}
      />,
    );

    await fillValidSignupForm(user);
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      await screen.findByText("*중복된 이메일 입니다."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("이메일*")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("닉네임 중복 오류를 닉네임 helper에 표시한다", async () => {
    const user = userEvent.setup();
    render(
      <SignupForm
        upload={vi.fn().mockResolvedValue("/images/profile.png")}
        register={vi
          .fn()
          .mockRejectedValue(new Error("이미 사용 중인 닉네임입니다."))}
        onCompleted={vi.fn()}
      />,
    );

    await fillValidSignupForm(user);
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      await screen.findByText("*중복된 닉네임 입니다."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("닉네임*")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("프로필 파일 변경과 unmount에서 object URL을 해제한다", async () => {
    const user = userEvent.setup();
    URL.createObjectURL
      .mockReturnValueOnce("blob:first-profile")
      .mockReturnValueOnce("blob:second-profile");
    const { unmount } = render(
      <SignupForm
        upload={vi.fn()}
        register={vi.fn()}
        onCompleted={vi.fn()}
      />,
    );
    const profileInput = screen.getByLabelText("프로필 사진");
    const firstFile = new File(["first"], "first.png", { type: "image/png" });
    const secondFile = new File(["second"], "second.png", {
      type: "image/png",
    });

    await user.upload(profileInput, firstFile);
    expect(screen.getByAltText("선택한 프로필 사진 미리보기")).toHaveAttribute(
      "src",
      "blob:first-profile",
    );

    await user.upload(profileInput, secondFile);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first-profile");
    expect(screen.getByAltText("선택한 프로필 사진 미리보기")).toHaveAttribute(
      "src",
      "blob:second-profile",
    );

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:second-profile");
  });

  it("회원가입 완료 후 로그인 route로 이동한다", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <SignupPage
          upload={vi.fn().mockResolvedValue("/images/profile.png")}
          register={vi.fn().mockResolvedValue({ userId: "user-1" })}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "회원가입" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "이전 페이지로 이동" }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", { name: "로그인하러 가기" }),
    ).toHaveAttribute("href", "/login");

    await fillValidSignupForm(user);
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/login"),
    );
  });

  it("각 입력을 떠날 때 해당 필수 오류를 표시한다", async () => {
    const user = userEvent.setup();
    render(
      <SignupForm
        upload={vi.fn()}
        register={vi.fn()}
        onCompleted={vi.fn()}
      />,
    );

    fireEvent.blur(screen.getByLabelText("프로필 사진"));
    expect(
      screen.getByText("*프로필 사진을 추가해주세요."),
    ).toBeInTheDocument();

    for (const [label, message] of [
      ["이메일*", "*이메일을 입력해주세요."],
      ["비밀번호*", "*비밀번호를 입력해주세요"],
      ["비밀번호 확인*", "*비밀번호를 한번더 입력해주세요"],
      ["닉네임*", "*닉네임을 입력해주세요."],
    ]) {
      await user.click(screen.getByLabelText(label));
      await user.tab();
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });
});

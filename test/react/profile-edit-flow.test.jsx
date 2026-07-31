import { StrictMode } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AppLayout } from "../../src/app/layout/AppLayout.jsx";
import { AuthProvider } from "../../src/features/auth/AuthProvider.jsx";
import { UserAvatar } from "../../src/shared/ui/UserAvatar.jsx";
import { ProfileEditForm } from "../../src/features/profile/ProfileEditForm.jsx";
import { ProfileEditPage } from "../../src/pages/profile-edit/ProfileEditPage.jsx";

const currentUser = {
  userId: "user-1",
  email: "connor@example.com",
  nickname: "기존닉네임",
  profileImage: "/images/old.png",
};
const imageFile = new File(["image"], "profile.png", { type: "image/png" });
const NativeURL = globalThis.URL;

function LocationProbe() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

function renderProfilePage(props, { strict = false } = {}) {
  const content = (
    <MemoryRouter initialEntries={["/profile"]}>
      <AuthProvider>
        <ProfileEditPage {...props} />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>
  );

  return render(strict ? <StrictMode>{content}</StrictMode> : content);
}

function renderProfileForm(props = {}) {
  return render(
    <ProfileEditForm
      user={currentUser}
      upload={vi.fn()}
      updateProfile={vi.fn()}
      onUpdated={vi.fn()}
      onUnauthorized={vi.fn(() => false)}
      {...props}
    />,
  );
}

describe("프로필 조회·수정 흐름", () => {
  beforeEach(() => {
    sessionStorage.clear();
    class TestURL extends NativeURL {}
    TestURL.createObjectURL = vi.fn(() => "blob:profile");
    TestURL.revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", TestURL);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("공통 헤더와 마이페이지 제목을 표시한다", async () => {
    renderProfilePage({
      loadProfile: vi.fn().mockResolvedValue(currentUser),
      upload: vi.fn(),
      updateProfile: vi.fn(),
    });

    expect(screen.getByRole("link", { name: "회의실 목록으로" })).toHaveAttribute(
      "href",
      "/rooms",
    );
    expect(
      screen.getByRole("heading", { name: "마이페이지", level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue("기존닉네임")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "비밀번호 수정" })).toHaveAttribute(
      "href",
      "/profile/password",
    );
  });

  it("현재 정보를 표시하고 기존 이미지와 변경한 닉네임을 저장한다", async () => {
    const user = userEvent.setup();
    const updateProfile = vi.fn().mockResolvedValue({
      userId: "user-1",
      nickname: "새닉네임",
      profileImage: "/images/old.png",
    });

    renderProfilePage({
      loadProfile: vi.fn().mockResolvedValue(currentUser),
      upload: vi.fn(),
      updateProfile,
    });

    expect(await screen.findByDisplayValue("기존닉네임")).toBeInTheDocument();
    expect(screen.getByText("connor@example.com")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("닉네임"));
    await user.type(screen.getByLabelText("닉네임"), "새닉네임");
    await user.click(screen.getByRole("button", { name: "수정하기" }));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({
        nickname: "새닉네임",
        profileImage: "/images/old.png",
      }),
    );
    expect(screen.getByText("connor@example.com")).toBeInTheDocument();
    expect(await screen.findByText("수정완료")).toBeVisible();
  });

  it("조회 실패를 표시하고 다시 시도해 현재 정보를 불러온다", async () => {
    const user = userEvent.setup();
    const loadProfile = vi
      .fn()
      .mockRejectedValueOnce(new Error("회원정보 조회 실패"))
      .mockResolvedValueOnce(currentUser);

    renderProfilePage({
      loadProfile,
      upload: vi.fn(),
      updateProfile: vi.fn(),
    });

    expect(screen.getByText("회원정보를 불러오는 중입니다.")).toBeInTheDocument();
    expect(await screen.findByText("회원정보 조회 실패")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByDisplayValue("기존닉네임")).toBeInTheDocument();
    expect(loadProfile).toHaveBeenCalledTimes(2);
    expect(loadProfile).toHaveBeenCalledWith(
      "*회원정보를 불러오지 못했습니다.",
    );
  });

  it("조회 401이면 인증을 지우고 로그인 route로 이동한다", async () => {
    sessionStorage.setItem("accessToken", "expired-token");
    sessionStorage.setItem("nickname", "기존닉네임");
    const unauthorized = Object.assign(new Error("인증 만료"), {
      status: 401,
    });

    renderProfilePage({
      loadProfile: vi.fn().mockRejectedValue(unauthorized),
      upload: vi.fn(),
      updateProfile: vi.fn(),
    });

    await waitFor(() =>
      expect(screen.getByLabelText("현재 경로")).toHaveTextContent("/login"),
    );
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("loginFeedback")).toBe(
      "로그인이 만료되었어요. 다시 로그인해 주세요.",
    );
  });

  it("StrictMode에서도 현재 정보 조회를 한 번만 시작한다", async () => {
    const loadProfile = vi.fn().mockResolvedValue(currentUser);

    renderProfilePage(
      {
        loadProfile,
        upload: vi.fn(),
        updateProfile: vi.fn(),
      },
      { strict: true },
    );

    expect(await screen.findByDisplayValue("기존닉네임")).toBeInTheDocument();
    expect(loadProfile).toHaveBeenCalledOnce();
  });

  it("새 이미지를 업로드한 뒤 받은 URL로 프로필을 수정한다", async () => {
    const user = userEvent.setup();
    const calls = [];
    const upload = vi.fn(async () => {
      calls.push("upload");
      return "/images/new.png";
    });
    const updateProfile = vi.fn(async () => {
      calls.push("update");
      return {
        userId: "user-1",
        nickname: "기존닉네임",
        profileImage: "/images/new.png",
      };
    });

    renderProfileForm({ upload, updateProfile });

    await user.upload(screen.getByLabelText("프로필 사진*"), imageFile);
    await user.click(screen.getByRole("button", { name: "수정하기" }));

    await waitFor(() => expect(calls).toEqual(["upload", "update"]));
    expect(updateProfile).toHaveBeenCalledWith({
      nickname: "기존닉네임",
      profileImage: "/images/new.png",
    });
  });

  it("이미지 업로드가 실패하면 수정 요청을 보내지 않고 입력을 유지한다", async () => {
    const user = userEvent.setup();
    const updateProfile = vi.fn();
    renderProfileForm({
      upload: vi
        .fn()
        .mockRejectedValue(new Error("*회원정보 수정에 실패했습니다.")),
      updateProfile,
    });

    await user.upload(screen.getByLabelText("프로필 사진*"), imageFile);
    await user.clear(screen.getByLabelText("닉네임"));
    await user.type(screen.getByLabelText("닉네임"), "유지할닉네임");
    await user.click(screen.getByRole("button", { name: "수정하기" }));

    expect(
      await screen.findByText("*회원정보 수정에 실패했습니다."),
    ).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.getByLabelText("닉네임")).toHaveValue("유지할닉네임");
  });

  it("닉네임 검증과 중복 오류를 닉네임 helper에 표시한다", async () => {
    const user = userEvent.setup();
    const updateProfile = vi
      .fn()
      .mockRejectedValue(new Error("이미 사용 중인 닉네임입니다."));
    renderProfileForm({ updateProfile });
    const nickname = screen.getByLabelText("닉네임");

    await user.clear(nickname);
    fireEvent.blur(nickname);
    expect(screen.getByText("*닉네임을 입력해주세요.")).toBeInTheDocument();

    await user.type(nickname, "공 백");
    fireEvent.blur(nickname);
    expect(screen.getByText("*띄어쓰기를 없애주세요")).toBeInTheDocument();

    await user.clear(nickname);
    await user.type(nickname, "열한글자닉네임입니다요");
    fireEvent.blur(nickname);
    expect(
      screen.getByText("*닉네임은 최대 10자 까지 작성 가능합니다."),
    ).toBeInTheDocument();

    await user.clear(nickname);
    await user.type(nickname, "중복닉네임");
    await user.click(screen.getByRole("button", { name: "수정하기" }));
    expect(
      await screen.findByText("*중복된 닉네임 입니다."),
    ).toBeInTheDocument();
    expect(nickname).toHaveAttribute("aria-invalid", "true");
  });

  it("새 파일 변경과 unmount에서 object URL을 해제한다", async () => {
    const user = userEvent.setup();
    URL.createObjectURL
      .mockReturnValueOnce("blob:first-profile")
      .mockReturnValueOnce("blob:second-profile");
    const { unmount } = renderProfileForm();
    const profileInput = screen.getByLabelText("프로필 사진*");
    const secondFile = new File(["second"], "second.png", {
      type: "image/png",
    });

    await user.upload(profileInput, imageFile);
    expect(
      screen.getByAltText("기존닉네임 프로필 사진"),
    ).toHaveAttribute("src", "blob:first-profile");

    await user.upload(profileInput, secondFile);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first-profile");

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:second-profile");
  });

  it("이미지가 없거나 로드에 실패하면 닉네임 첫 글자를 표시한다", () => {
    const { rerender } = render(
      <UserAvatar imageUrl="" nickname="코너" />,
    );

    expect(screen.getByText("코")).toBeInTheDocument();

    rerender(<UserAvatar imageUrl="/broken.png" nickname="코너" />);
    fireEvent.error(screen.getByAltText("코너 프로필 사진"));
    expect(screen.getByText("코")).toBeInTheDocument();
  });

  it("수정 응답으로 form과 header avatar를 함께 갱신한다", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("accessToken", "token");
    sessionStorage.setItem("nickname", "기존닉네임");
    const updateProfile = vi.fn().mockResolvedValue({
      userId: "user-1",
      nickname: "새닉네임",
      profileImage: "/images/new.png",
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route
                path="/profile"
                element={
                  <ProfileEditPage
                    loadProfile={vi.fn().mockResolvedValue(currentUser)}
                    upload={vi.fn()}
                    updateProfile={updateProfile}
                  />
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    const nickname = await screen.findByLabelText("닉네임");
    await user.clear(nickname);
    await user.type(nickname, "새닉네임");
    await user.click(screen.getByRole("button", { name: "수정하기" }));

    const profileButton = screen.getByRole("button", {
      name: "사용자 메뉴 열기",
    });
    expect(
      await within(profileButton).findByAltText("새닉네임 프로필 사진"),
    ).toHaveAttribute("src", "http://localhost:8080/images/new.png");
    expect(sessionStorage.getItem("nickname")).toBe("새닉네임");
    expect(sessionStorage.getItem("profileImage")).toBe("/images/new.png");
  });
});

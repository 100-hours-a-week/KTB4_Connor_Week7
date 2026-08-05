import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/features/auth/AuthProvider.jsx";
import { RoomDetailPage } from "../../src/pages/room-detail/RoomDetailPage.jsx";
import { RoomsPage } from "../../src/pages/rooms/RoomsPage.jsx";
import {
  BOOKING_EDITING_RESERVATION_KEY,
  createBookingDraftStore,
} from "../../src/features/booking/model/bookingDraftStore.js";

const room = {
  roomId: "t2",
  name: "T2",
  location: "인포데스크 옆",
  capacity: 6,
  facilities: ["TV", "화이트보드", "보드마카"],
  description: "좌석 구성에 따라 4~6명이 이용할 수 있어요.",
  operatingHours: "09:00~18:00",
  usageGuide: "깨끗하게 사용해 주세요.",
  minimumDurationMinutes: 30,
  maximumDurationMinutes: 120,
  imageUrl: "/broken-room.png",
  active: true,
};

function renderRooms(loadRooms, initialEntry = "/rooms") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <RoomsPage loadRooms={loadRooms} />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="현재 경로">{location.pathname}</output>;
}

function renderRoomDetail(loadRoom, initialEntry = "/rooms/t2") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/rooms/:roomId"
            element={<RoomDetailPage loadRoom={loadRoom} />}
          />
          <Route
            path="/booking/:roomId/date-time"
            element={<CurrentPath />}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("회의실 목록", () => {
  beforeEach(() => sessionStorage.clear());

  it("불러오는 동안 loading 상태를 표시한다", () => {
    renderRooms(() => new Promise(() => {}));

    expect(screen.getByText("회의실을 불러오는 중이에요.")).toBeInTheDocument();
  });

  it("회의실과 상세 링크를 표시한다", async () => {
    const user = userEvent.setup();
    renderRooms(vi.fn().mockResolvedValue([room]));

    expect(await screen.findByRole("link", { name: "T2" })).toHaveAttribute(
      "href",
      "/rooms/t2",
    );
    expect(screen.getByRole("link", { name: "회의실 목록으로" })).toHaveAttribute(
      "href",
      "/rooms",
    );

    const profileButton = screen.getByRole("button", {
      name: "사용자 메뉴 열기",
    });
    await user.click(profileButton);

    expect(screen.getByRole("link", { name: "내 예약" })).toHaveAttribute(
      "href",
      "/reservations",
    );
    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "사용자 메뉴" })).not.toBeInTheDocument();
    expect(profileButton).toHaveFocus();
    expect(screen.getByRole("main")).toHaveClass("rooms-page");
    expect(screen.getByText("최대 인원 6명")).toBeInTheDocument();
  });

  it("예약 변경 중에는 상세 링크에 변경 mode를 유지한다", async () => {
    sessionStorage.setItem(BOOKING_EDITING_RESERVATION_KEY, "reservation-1");
    renderRooms(vi.fn().mockResolvedValue([room]), "/rooms?mode=change");

    expect(await screen.findByRole("link", { name: "T2" })).toHaveAttribute(
      "href",
      "/rooms/t2?mode=change",
    );
  });

  it("빈 결과를 표시한다", async () => {
    renderRooms(vi.fn().mockResolvedValue([]));

    expect(
      await screen.findByText("예약 가능한 회의실이 없어요."),
    ).toBeInTheDocument();
  });

  it("조회 실패 후 다시 시도한다", async () => {
    const user = userEvent.setup();
    const loadRooms = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([room]);
    renderRooms(loadRooms);

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("link", { name: "T2" })).toBeInTheDocument();
    expect(loadRooms).toHaveBeenCalledTimes(2);
  });

  it("이미지 로드 실패 시 이미지를 제거하고 fallback을 표시한다", async () => {
    renderRooms(vi.fn().mockResolvedValue([room]));

    fireEvent.error(
      await screen.findByRole("img", { name: "T2 대표 이미지" }),
    );

    expect(
      screen.queryByRole("img", { name: "T2 대표 이미지" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".room-image-placeholder")).toHaveTextContent(
      "T",
    );
  });
});

describe("회의실 상세와 예약 시작", () => {
  beforeEach(() => sessionStorage.clear());

  it("회의실 상세를 표시하고 예약을 시작한다", async () => {
    const user = userEvent.setup();
    renderRoomDetail(vi.fn().mockResolvedValue(room));

    expect(
      await screen.findByRole("heading", { name: "T2" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "예약하기" }));

    expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
      "/booking/t2/date-time",
    );
    expect(createBookingDraftStore(sessionStorage).read()).toMatchObject({
      roomId: "t2",
      roomName: "T2",
      roomCapacity: 6,
    });
  });

  it("이용시간 정책 필드가 없으면 NaN을 표시하지 않는다", async () => {
    const roomWithoutDuration = { ...room };
    delete roomWithoutDuration.minimumDurationMinutes;
    delete roomWithoutDuration.maximumDurationMinutes;
    renderRoomDetail(vi.fn().mockResolvedValue(roomWithoutDuration));

    expect(await screen.findByRole("heading", { name: "T2" })).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it("예약 변경 중 회의실을 바꾸면 변경 ID를 유지한다", async () => {
    const user = userEvent.setup();
    const store = createBookingDraftStore(sessionStorage);
    store.startEditing("reservation-1", {
      roomId: "old-room",
      roomName: "기존 회의실",
      roomCapacity: 4,
      topic: "기존 주제",
    });
    renderRoomDetail(
      vi.fn().mockResolvedValue(room),
      "/rooms/t2?mode=change",
    );

    await user.click(
      await screen.findByRole("button", { name: "회의실 변경하기" }),
    );

    expect(store.getEditingReservationId()).toBe("reservation-1");
    expect(store.read()).toMatchObject({
      roomId: "t2",
      roomName: "T2",
      roomCapacity: 6,
      topic: "",
    });
  });

  it("없는 회의실이면 목록 복구 링크를 표시한다", async () => {
    const error = Object.assign(new Error("not found"), { status: 404 });
    renderRoomDetail(vi.fn().mockRejectedValue(error));

    expect(
      await screen.findByRole("link", { name: "회의실 목록으로" }),
    ).toHaveAttribute("href", "/rooms");
  });

  it("비활성 회의실은 예약을 막는다", async () => {
    renderRoomDetail(vi.fn().mockResolvedValue({ ...room, active: false }));

    expect(
      await screen.findByText("현재 예약할 수 없는 회의실이에요."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "예약하기" }),
    ).toBeDisabled();
  });

  it("상세 이미지 로드 실패 시 이미지 영역에 fallback을 표시한다", async () => {
    renderRoomDetail(vi.fn().mockResolvedValue(room));

    fireEvent.error(
      await screen.findByRole("img", { name: "T2 대표 이미지" }),
    );

    expect(document.querySelector(".room-detail-image")).toHaveClass(
      "room-image-placeholder",
    );
    expect(document.querySelector(".room-detail-image")).toHaveTextContent("T");
  });
});

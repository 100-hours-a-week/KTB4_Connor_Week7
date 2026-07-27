import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/app/providers/AuthProvider.jsx";
import { BookingDraftProvider } from "../../src/features/book-room/model/BookingDraftProvider.jsx";
import { SubmitBookingButton } from "../../src/features/book-room/SubmitBookingButton.jsx";
import { BookingConfirmedPage } from "../../src/pages/booking-confirmed/BookingConfirmedPage.jsx";
import { BookingReviewPage } from "../../src/pages/booking-review/BookingReviewPage.jsx";
import {
  BOOKING_DRAFT_KEY,
  BOOKING_EDITING_RESERVATION_KEY,
} from "../../src/utils/booking-draft.js";

const draft = {
  roomId: "t2",
  roomName: "T2",
  roomCapacity: 6,
  date: "2026-07-28",
  startTime: "09:00",
  endTime: "10:00",
  topic: " 프로젝트 회의 ",
  attendeeChips: ["김현", "이도윤"],
  additionalInfo: " 화이트보드 사용 ",
};

const reservation = {
  reservationId: "reservation-1",
  room: {
    roomId: "t2",
    name: "T2",
    location: "인포데스크 옆",
  },
  reserverName: "코너",
  startAt: "2026-07-28T09:00:00+09:00",
  endAt: "2026-07-28T10:00:00+09:00",
  topic: "프로젝트 회의",
  attendees: ["김현", "이도윤"],
  additionalInfo: "화이트보드 사용",
  status: "CONFIRMED",
};

it("예약을 한 번 생성하고 성공 후 draft를 지운다", async () => {
  const user = userEvent.setup();
  const create = vi.fn().mockResolvedValue(reservation);
  const clear = vi.fn();
  const onCompleted = vi.fn();

  render(
    <SubmitBookingButton
      draft={draft}
      editingReservationId=""
      create={create}
      update={vi.fn()}
      clear={clear}
      onCompleted={onCompleted}
      onRecover={vi.fn()}
      createIdempotencyKey={() => "request-1"}
    />,
  );

  await user.click(screen.getByRole("button", { name: "예약 확정" }));

  expect(create).toHaveBeenCalledOnce();
  expect(create).toHaveBeenCalledWith({
    roomId: "t2",
    startAt: "2026-07-28T09:00:00+09:00",
    endAt: "2026-07-28T10:00:00+09:00",
    topic: "프로젝트 회의",
    attendees: ["김현", "이도윤"],
    additionalInfo: "화이트보드 사용",
    idempotencyKey: "request-1",
  });
  expect(clear).toHaveBeenCalledOnce();
  expect(onCompleted).toHaveBeenCalledWith(reservation);
});

it("제출 중에는 같은 예약을 다시 생성하지 않는다", async () => {
  const user = userEvent.setup();
  let finish;
  const create = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );

  render(
    <SubmitBookingButton
      draft={draft}
      editingReservationId=""
      create={create}
      update={vi.fn()}
      clear={vi.fn()}
      onCompleted={vi.fn()}
      onRecover={vi.fn()}
      createIdempotencyKey={() => "request-1"}
    />,
  );

  const button = screen.getByRole("button", { name: "예약 확정" });
  await user.click(button);
  await user.click(button);

  expect(create).toHaveBeenCalledOnce();
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");

  finish(reservation);
});

it("예약 변경 중이면 기존 예약을 갱신한다", async () => {
  const user = userEvent.setup();
  const create = vi.fn();
  const update = vi.fn().mockResolvedValue(reservation);

  render(
    <SubmitBookingButton
      draft={draft}
      editingReservationId="reservation-1"
      create={create}
      update={update}
      clear={vi.fn()}
      onCompleted={vi.fn()}
      onRecover={vi.fn()}
      createIdempotencyKey={() => "request-1"}
    />,
  );

  await user.click(screen.getByRole("button", { name: "예약 변경" }));

  expect(create).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith(
    "reservation-1",
    expect.objectContaining({ idempotencyKey: "request-1" }),
  );
});

function CurrentPath() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

function renderReviewPage({
  create = vi.fn(),
  update = vi.fn(),
  editingReservationId = "",
}) {
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  if (editingReservationId) {
    sessionStorage.setItem(
      BOOKING_EDITING_RESERVATION_KEY,
      editingReservationId,
    );
  }

  return render(
    <MemoryRouter initialEntries={["/booking/review"]}>
      <AuthProvider>
        <BookingDraftProvider>
          <CurrentPath />
          <Routes>
            <Route
              path="/booking/review"
              element={
                <BookingReviewPage
                  loadRoom={vi.fn().mockResolvedValue({
                    ...reservation.room,
                    capacity: 6,
                  })}
                  create={create}
                  update={update}
                />
              }
            />
            <Route
              path="/booking/confirmed/:reservationId"
              element={<p>예약 완료 경로</p>}
            />
            <Route
              path="/reservations/:reservationId"
              element={<p>예약 상세 경로</p>}
            />
          </Routes>
        </BookingDraftProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("예약 검토 제출", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("accessToken", "token");
    sessionStorage.setItem("userId", "user-1");
    sessionStorage.setItem("nickname", "코너");
  });

  it("생성 결과를 navigation state로 전달하고 완료 route로 이동한다", async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(reservation);
    renderReviewPage({ create });

    await screen.findByText("T2 (인포데스크 옆)");
    await user.click(screen.getByRole("button", { name: "예약 확정" }));

    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
      "/booking/confirmed/reservation-1",
    );
    expect(sessionStorage.getItem("lastConfirmedReservation")).toBeNull();
    expect(sessionStorage.getItem(BOOKING_DRAFT_KEY)).toBeNull();
  });

  it("변경 결과를 저장하고 예약 상세 route로 이동한다", async () => {
    const user = userEvent.setup();
    const update = vi.fn().mockResolvedValue(reservation);
    renderReviewPage({
      update,
      editingReservationId: "reservation-1",
    });

    await screen.findByText("T2 (인포데스크 옆)");
    await user.click(screen.getByRole("button", { name: "예약 변경" }));

    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(screen.getByLabelText("현재 경로")).toHaveTextContent(
      "/reservations/reservation-1",
    );
    expect(sessionStorage.getItem(BOOKING_DRAFT_KEY)).toBeNull();
    expect(
      sessionStorage.getItem(BOOKING_EDITING_RESERVATION_KEY),
    ).toBeNull();
  });
});

function renderConfirmedPage({
  navigationReservation,
  loadReservation,
}) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/booking/confirmed/reservation-1",
          state: navigationReservation
            ? { reservation: navigationReservation }
            : null,
        },
      ]}
    >
      <AuthProvider>
        <Routes>
          <Route
            path="/booking/confirmed/:reservationId"
            element={
              <BookingConfirmedPage
                loadReservation={loadReservation}
              />
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("예약 완료 화면", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("accessToken", "token");
    sessionStorage.setItem("nickname", "코너");
  });

  it("성공 응답을 즉시 표시하고 최신 예약 정보로 교체한다", async () => {
    let finish;
    const loadReservation = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderConfirmedPage({
      navigationReservation: reservation,
      loadReservation,
    });

    expect(screen.getByText("프로젝트 회의 (2명)")).toBeInTheDocument();

    finish({ ...reservation, topic: "최신 프로젝트 회의" });

    expect(
      await screen.findByText("최신 프로젝트 회의 (2명)"),
    ).toBeInTheDocument();
    expect(loadReservation).toHaveBeenCalledWith(
      "reservation-1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("최신 조회가 실패하면 기존 내용을 유지하고 다시 시도한다", async () => {
    const user = userEvent.setup();
    const loadReservation = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ...reservation, topic: "최신 프로젝트 회의" });
    renderConfirmedPage({
      navigationReservation: reservation,
      loadReservation,
    });

    expect(screen.getByText("프로젝트 회의 (2명)")).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: "다시 시도" }),
    );

    expect(
      await screen.findByText("최신 프로젝트 회의 (2명)"),
    ).toBeInTheDocument();
    expect(loadReservation).toHaveBeenCalledTimes(2);
  });

  it("응답에 예약자 이름이 없으면 로그인 사용자 닉네임을 표시한다", () => {
    const { reserverName, ...reservationWithoutName } = reservation;
    renderConfirmedPage({
      navigationReservation: reservationWithoutName,
      loadReservation: vi.fn(() => new Promise(() => {})),
    });

    expect(screen.getByText("코너")).toBeInTheDocument();
  });

  it.each([
    [403, "이 예약을 확인할 권한이 없어요."],
    [404, "예약 정보를 찾을 수 없어요."],
  ])("직접 진입 조회가 %s이면 복구 안내를 표시한다", async (
    status,
    message,
  ) => {
    renderConfirmedPage({
      loadReservation: vi.fn().mockRejectedValue({ status }),
    });

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "내 예약 보기" }),
    ).toHaveAttribute("href", "/reservations");
  });

  it("직접 진입 조회 실패 후 다시 시도한다", async () => {
    const user = userEvent.setup();
    const loadReservation = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(reservation);
    renderConfirmedPage({ loadReservation });

    await user.click(
      await screen.findByRole("button", { name: "다시 시도" }),
    );

    expect(await screen.findByText("프로젝트 회의 (2명)"))
      .toBeInTheDocument();
    expect(loadReservation).toHaveBeenCalledTimes(2);
  });
});

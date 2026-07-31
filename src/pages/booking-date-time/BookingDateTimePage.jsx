import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import {
  fetchRoomDaySlots,
  fetchRoomMonthAvailability,
} from "../../api/booking.js";
import { useAuth } from "../../features/auth/AuthProvider.jsx";
import { BookingScheduleSummary } from "../../features/booking/components/BookingScheduleSummary.jsx";
import { BookingStepLayout } from "../../features/booking/components/BookingStepLayout.jsx";
import { MonthlyAvailabilityCalendar } from "../../features/booking/components/MonthlyAvailabilityCalendar.jsx";
import { TimeRangeSelector } from "../../features/booking/components/TimeRangeSelector.jsx";
import { useBookingDraft } from "../../features/booking/model/BookingDraftProvider.jsx";
import { parseLocalDate } from "../../features/booking/lib/booking-format.js";

function getDateTimeGuardRoute(routeRoomId, draft) {
  if (!draft.roomId) return "/rooms";
  if (routeRoomId !== draft.roomId) {
    return routeRoomId
      ? `/rooms/${encodeURIComponent(routeRoomId)}`
      : "/rooms";
  }
  return "";
}

function getInitialMonth(date) {
  const initialDate = date ? parseLocalDate(date) : new Date();
  return {
    year: initialDate.getFullYear(),
    month: initialDate.getMonth() + 1,
  };
}

function BookingDateTimePage({
  loadMonth = fetchRoomMonthAvailability,
  loadDay = fetchRoomDaySlots,
}) {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const { recoverUnauthorized } = useAuth();
  const { draft, editingReservationId, dispatch } = useBookingDraft();
  const guardRoute = getDateTimeGuardRoute(roomId, draft);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getInitialMonth(draft.date),
  );
  const [monthRequestVersion, setMonthRequestVersion] = useState(0);
  const [dayRequestVersion, setDayRequestVersion] = useState(0);
  const [monthState, setMonthState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [dayState, setDayState] = useState({
    status: draft.date ? "loading" : "idle",
    slots: [],
    maximumDurationMinutes: 120,
    error: "",
  });
  const [selectionNotice, setSelectionNotice] = useState("");
  const [feedback] = useState(
    () => sessionStorage.getItem("bookingFeedback") || "",
  );

  const recoverAvailabilityError = useCallback((error) => {
    if (recoverUnauthorized(error)) return true;
    if (error?.data?.code !== "ROOM_INACTIVE") return false;
    dispatch({ type: "changeRoom" });
    sessionStorage.setItem(
      "roomsFeedback",
      "이 회의실은 더 이상 예약할 수 없어요.",
    );
    navigate("/rooms", { replace: true });
    return true;
  }, [dispatch, navigate, recoverUnauthorized]);

  useEffect(() => {
    if (feedback) sessionStorage.removeItem("bookingFeedback");
  }, [feedback]);

  useEffect(() => {
    if (guardRoute) return undefined;
    const controller = new AbortController();
    setMonthState((current) => ({
      status: "loading",
      data: current.data,
      error: "",
    }));
    loadMonth({
      roomId,
      year: visibleMonth.year,
      month: visibleMonth.month,
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setMonthState({ status: "success", data, error: "" });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted || recoverAvailabilityError(error)) return;
        setMonthState((current) => ({
          status: "error",
          data: current.data,
          error: "날짜 정보를 불러오지 못했어요.",
        }));
      });
    return () => controller.abort();
  }, [
    guardRoute,
    loadMonth,
    monthRequestVersion,
    recoverAvailabilityError,
    roomId,
    visibleMonth.month,
    visibleMonth.year,
  ]);

  useEffect(() => {
    if (guardRoute || !draft.date) {
      setDayState({
        status: "idle",
        slots: [],
        maximumDurationMinutes: 120,
        error: "",
      });
      return undefined;
    }

    const controller = new AbortController();
    setDayState((current) => ({
      ...current,
      status: "loading",
      error: "",
    }));
    loadDay({ roomId, date: draft.date, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setDayState({
          status: data.slots.some((slot) => slot.state === "AVAILABLE")
            ? "success"
            : "empty",
          slots: data.slots,
          maximumDurationMinutes: data.maximumDurationMinutes || 120,
          error: "",
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || recoverAvailabilityError(error)) return;
        setDayState((current) => ({
          ...current,
          status: "error",
          error: "시간 정보를 불러오지 못했어요.",
        }));
      });
    return () => controller.abort();
  }, [
    dayRequestVersion,
    draft.date,
    guardRoute,
    loadDay,
    recoverAvailabilityError,
    roomId,
  ]);

  if (guardRoute) return <Navigate to={guardRoute} replace />;

  const currentMonth = getInitialMonth("");
  const previousMonthDisabled =
    visibleMonth.year === currentMonth.year &&
    visibleMonth.month === currentMonth.month;
  const selectedRange =
    draft.startTime && draft.endTime
      ? { startTime: draft.startTime, endTime: draft.endTime }
      : null;
  const backTo = editingReservationId
    ? `/reservations/${encodeURIComponent(editingReservationId)}`
    : `/rooms/${encodeURIComponent(draft.roomId)}`;

  function changeMonth(offset) {
    const date = new Date(
      visibleMonth.year,
      visibleMonth.month - 1 + offset,
      1,
    );
    setVisibleMonth({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }

  function selectDate(date) {
    if (draft.date !== date) {
      dispatch({ type: "selectDate", date });
      setSelectionNotice("");
    }
  }

  function selectRange(range) {
    dispatch({ type: "selectTimeRange", range });
    let notice = "";
    if (range.limitedBy === "duration") {
      notice = "최대 2시간까지 예약할 수 있어요.";
    }
    if (range.limitedBy === "availability") {
      notice = "이 시간에는 예약할 수 없어요.";
    }
    setSelectionNotice(notice);
  }

  const displayedMonth =
    monthState.data?.year === visibleMonth.year &&
    monthState.data?.month === visibleMonth.month
      ? monthState.data
      : null;
  let dayStateMessage = "날짜를 먼저 선택해 주세요.";
  if (dayState.status === "loading") {
    dayStateMessage = "시간 정보를 불러오는 중이에요.";
  }
  if (dayState.status === "empty") {
    dayStateMessage = "이 날짜에는 예약 가능한 시간이 없어요.";
  }

  return (
    <BookingStepLayout
      backTo={backTo}
      backLabel={
        editingReservationId
          ? "예약 상세로 돌아가기"
          : "회의실 상세로 돌아가기"
      }
      onExit={() => {
        dispatch({ type: "changeRoom" });
        navigate(editingReservationId ? "/rooms?mode=change" : "/rooms");
      }}
      nextDisabled={!draft.date || !draft.startTime || !draft.endTime}
      onNext={() => navigate("/booking/information")}
    >
      <main className="booking-page booking-date-time-page">
        <p className="booking-step">1/3</p>
        <h2 tabIndex={-1}>
          {editingReservationId
            ? "예약 날짜와 시간을 변경해 주세요"
            : "날짜와 시간을 선택해 주세요"}
        </h2>
        <section className="selected-booking-room" aria-label="선택한 회의실">
          <div>
            <span>선택한 회의실</span>
            <strong>{draft.roomName}</strong>
          </div>
        </section>
        {feedback ? (
          <p className="booking-inline-feedback" aria-live="assertive">
            {feedback}
          </p>
        ) : null}
        <BookingScheduleSummary
          date={draft.date}
          startTime={draft.startTime}
          endTime={draft.endTime}
        />

        {displayedMonth ? (
          <>
            {monthState.status === "error" ? (
              <div className="booking-loading" aria-live="polite">
                {monthState.error}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setMonthRequestVersion((version) => version + 1)
                  }
                >
                  다시 시도
                </button>
              </div>
            ) : null}
            <MonthlyAvailabilityCalendar
              data={displayedMonth}
              selectedDate={draft.date}
              onSelect={selectDate}
              onPreviousMonth={() => changeMonth(-1)}
              onNextMonth={() => changeMonth(1)}
              previousMonthDisabled={previousMonthDisabled}
            />
          </>
        ) : (
          <div className="booking-loading" aria-live="polite">
            {monthState.status === "error" ? (
              <>
                {monthState.error}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setMonthRequestVersion((version) => version + 1)
                  }
                >
                  다시 시도
                </button>
              </>
            ) : (
              "날짜 정보를 불러오는 중이에요."
            )}
          </div>
        )}

        {dayState.status === "success" ? (
          <TimeRangeSelector
            slots={dayState.slots}
            maximumDurationMinutes={dayState.maximumDurationMinutes}
            value={selectedRange}
            onSelect={selectRange}
          />
        ) : (
          <section
            className="timeline-section"
            aria-labelledby="timeline-heading"
          >
            <div className="timeline-heading-row">
              <div>
                <h3 id="timeline-heading">이용 시간</h3>
                <p>시간을 누르거나 좌우로 드래그해 선택하세요.</p>
              </div>
            </div>
            <div className="timeline-placeholder" aria-live="polite">
              {dayState.status === "error" ? (
                <>
                  {dayState.error}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setDayRequestVersion((version) => version + 1)
                    }
                  >
                    다시 시도
                  </button>
                </>
              ) : (
                dayStateMessage
              )}
            </div>
          </section>
        )}
        <p className="booking-helper" aria-live="polite">
          {selectionNotice}
        </p>
      </main>
    </BookingStepLayout>
  );
}

export { BookingDateTimePage, getDateTimeGuardRoute };

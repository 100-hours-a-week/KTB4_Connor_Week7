import { getReservationErrorAction } from "./lib/booking-validation.js";

function recoverBookingMutation(error, {
  roomId,
  dispatch,
  navigate,
  setFeedback,
  recoverUnauthorized,
}) {
  if (recoverUnauthorized(error)) return true;

  if (error?.data?.code === "ROOM_INACTIVE") {
    dispatch({ type: "changeRoom" });
    globalThis.sessionStorage.setItem(
      "roomsFeedback",
      "이 회의실은 더 이상 예약할 수 없어요.",
    );
    navigate("/rooms");
    return true;
  }

  const action = getReservationErrorAction(error);
  if (action.clearTime) dispatch({ type: "clearTime" });

  if (action.step === "dateTime") {
    globalThis.sessionStorage.setItem("bookingFeedback", action.message);
    navigate(`/booking/${encodeURIComponent(roomId)}/date-time`);
    return true;
  }

  if (action.step === "information") {
    globalThis.sessionStorage.setItem("bookingFeedback", action.message);
    navigate("/booking/information");
    return true;
  }

  setFeedback(action.message);
  return false;
}

export { recoverBookingMutation };

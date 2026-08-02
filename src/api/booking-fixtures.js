const FIXTURE_ROOMS = [
  {
    roomId: 1,
    name: "RYAN2",
    location: "R2",
    capacity: 6,
    facilities: ["TV", "화이트보드", "보드마카"],
    description: "최대 6명이 이용할 수 있는 회의실입니다.",
    guide: "TV, 화이트보드, 보드마카를 사용할 수 있어요.",
    openTime: "09:00",
    closeTime: "23:00",
    imageUrl: "https://images.kbtroom.cloud/content/rooms/ryan2.png",
    active: true,
  },
  {
    roomId: 2,
    name: "RYAN3",
    location: "R3",
    capacity: 8,
    facilities: ["TV", "화이트보드", "보드마카"],
    description: "최대 8명이 이용할 수 있는 회의실입니다.",
    guide: "TV, 화이트보드, 보드마카를 사용할 수 있어요.",
    openTime: "09:00",
    closeTime: "23:00",
    imageUrl: "https://images.kbtroom.cloud/content/rooms/ryan3.png",
    active: true,
  },
  {
    roomId: 3,
    name: "SANGBAE2",
    location: "S2",
    capacity: 8,
    facilities: ["TV", "화이트보드", "보드마카"],
    description: "최대 8명이 이용할 수 있는 회의실입니다.",
    guide: "TV, 화이트보드, 보드마카를 사용할 수 있어요.",
    openTime: "09:00",
    closeTime: "23:00",
    imageUrl: "https://images.kbtroom.cloud/content/rooms/sangbae2.png",
    active: true,
  },
  {
    roomId: 4,
    name: "T1",
    location: "G1 사무실 옆, 타운홀 좌측",
    capacity: 6,
    facilities: [],
    description: "좌석 구성에 따라 4~6명이 이용할 수 있어요.",
    guide: "별도 장비가 없으며 의자가 부족할 수 있어요.",
    openTime: "09:00",
    closeTime: "23:00",
    imageUrl: "https://images.kbtroom.cloud/content/rooms/t1.png",
    active: true,
  },
  {
    roomId: 5,
    name: "T2",
    location: "인포데스크 옆",
    capacity: 6,
    facilities: [],
    description: "좌석 구성에 따라 4~6명이 이용할 수 있어요.",
    guide: "별도 장비가 없으며 의자가 부족할 수 있어요.",
    openTime: "09:00",
    closeTime: "23:00",
    imageUrl: "https://images.kbtroom.cloud/content/rooms/t2.png",
    active: true,
  },
  {
    roomId: 6,
    name: "T3",
    location: "타운홀 우측",
    capacity: 5,
    facilities: [],
    description: "좌석 구성에 따라 4~5명이 이용할 수 있어요.",
    guide: "별도 장비가 없어요.",
    openTime: "09:00",
    closeTime: "23:00",
    imageUrl: "https://images.kbtroom.cloud/content/rooms/t3.png",
    active: true,
  },
];

const FIXTURE_RESERVATIONS_KEY = "fixtureReservationsV2";

function delay(value, milliseconds = 180) {
  return new Promise((resolve) => globalThis.setTimeout(() => resolve(value), milliseconds));
}

function fixtureError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.data = { code };
  return error;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${toDateKey(date)}T${hours}:${minutes}:${seconds}`;
}

function findRoom(roomId) {
  return FIXTURE_ROOMS.find((room) => String(room.roomId) === String(roomId));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function offsetDateKey(baseDate, dayOffset) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + dayOffset);
  return toDateKey(date);
}

function createSeedReservations(now, ownerId) {
  const createdAt = new Date(now);
  createdAt.setDate(createdAt.getDate() - 7);
  const earlierUpdatedAt = new Date(now);
  earlierUpdatedAt.setDate(earlierUpdatedAt.getDate() - 1);

  return [
    {
      reservationId: 1001,
      ownerId,
      status: "CONFIRMED",
      roomId: 1,
      room: findRoom(1),
      startAt: `${offsetDateKey(now, 1)}T10:00:00`,
      endAt: `${offsetDateKey(now, 1)}T11:00:00`,
      topic: "프로젝트 회의",
      attendees: ["김현", "이도윤"],
      additionalInfo: "화이트보드를 사용할 예정입니다.",
      createdAt: toLocalDateTime(createdAt),
      updatedAt: toLocalDateTime(createdAt),
    },
    {
      reservationId: 1002,
      ownerId,
      status: "COMPLETED",
      roomId: 2,
      room: findRoom(2),
      startAt: `${offsetDateKey(now, -2)}T14:00:00`,
      endAt: `${offsetDateKey(now, -2)}T15:00:00`,
      topic: "지난 스터디 회의",
      attendees: ["박서준", "최유진", "정하늘"],
      additionalInfo: "",
      createdAt: toLocalDateTime(createdAt),
      updatedAt: toLocalDateTime(createdAt),
    },
    {
      reservationId: 1003,
      ownerId,
      status: "CANCELED_BY_USER",
      roomId: 4,
      room: findRoom(4),
      startAt: `${offsetDateKey(now, 2)}T11:00:00`,
      endAt: `${offsetDateKey(now, 2)}T12:00:00`,
      topic: "취소한 인터뷰 연습",
      attendees: ["김현"],
      additionalInfo: "",
      createdAt: toLocalDateTime(createdAt),
      updatedAt: toLocalDateTime(earlierUpdatedAt),
    },
  ];
}

function createFixtureReservationStore({ storage = globalThis.sessionStorage, now = () => new Date() } = {}) {
  function getCurrentOwnerId() {
    return String(storage?.getItem("userId") || "fixture-current-user");
  }

  function readAll() {
    let reservations = null;
    try {
      reservations = JSON.parse(storage?.getItem(FIXTURE_RESERVATIONS_KEY) || "null");
    } catch {
      reservations = null;
    }
    if (!Array.isArray(reservations)) {
      reservations = createSeedReservations(now(), getCurrentOwnerId());
      storage?.setItem(FIXTURE_RESERVATIONS_KEY, JSON.stringify(reservations));
    } else if (reservations.some((reservation) => !reservation.ownerId)) {
      reservations = reservations.map((reservation) => ({
        ...reservation,
        ownerId: reservation.ownerId || getCurrentOwnerId(),
      }));
      storage?.setItem(FIXTURE_RESERVATIONS_KEY, JSON.stringify(reservations));
    }
    return reservations;
  }

  function writeAll(reservations) {
    storage?.setItem(FIXTURE_RESERVATIONS_KEY, JSON.stringify(reservations));
  }

  function findReservation(reservationId) {
    const reservation = readAll().find(
      (candidate) => String(candidate.reservationId) === String(reservationId),
    );
    if (!reservation) {
      throw fixtureError("예약을 찾을 수 없어요.", 404, "RESERVATION_NOT_FOUND");
    }
    return reservation;
  }

  function findOwnedReservation(reservationId) {
    const reservation = findReservation(reservationId);
    if (reservation.ownerId !== getCurrentOwnerId()) {
      throw fixtureError("이 예약에 접근할 수 없어요.", 403, "RESERVATION_FORBIDDEN");
    }
    return reservation;
  }

  function toPublicReservation(reservation) {
    const currentReservation = withCurrentStatus(reservation);
    const { ownerId: _ownerId, ...publicReservation } = currentReservation;
    const changeDeadline = new Date(currentReservation.startAt);
    changeDeadline.setHours(changeDeadline.getHours() - 1);
    const changeable =
      currentReservation.status === "CONFIRMED" &&
      new Date(now()) <= changeDeadline;
    return {
      ...publicReservation,
      canChange: changeable,
      canCancel: changeable,
    };
  }

  function withCurrentStatus(reservation) {
    if (reservation.status === "CONFIRMED" && new Date(reservation.endAt) <= new Date(now())) {
      return { ...reservation, status: "COMPLETED" };
    }
    return reservation;
  }

  function validateReservationPayload(payload, { excludeReservationId = "" } = {}) {
    const room = findRoom(payload.roomId);
    if (!room) {
      throw fixtureError("회의실을 찾을 수 없어요.", 404, "ROOM_NOT_FOUND");
    }
    if (!room.active) {
      throw fixtureError("이 회의실은 더 이상 예약할 수 없어요.", 409, "ROOM_INACTIVE");
    }
    if (payload.attendees.length > room.capacity) {
      throw fixtureError(`최대 ${room.capacity}명까지 이용할 수 있어요.`, 409, "CAPACITY_EXCEEDED");
    }

    const date = payload.startAt.slice(0, 10);
    const startTime = payload.startAt.slice(11, 16);
    const endTime = payload.endAt.slice(11, 16);
    const selectedSlots = createSlots(room.roomId, date).filter(
      (slot) => slot.startTime >= startTime && slot.endTime <= endTime,
    );
    const overlapsReservation = readAll().some(
      (reservation) =>
        String(reservation.reservationId) !== String(excludeReservationId) &&
        reservation.status === "CONFIRMED" &&
        String(reservation.roomId) === String(payload.roomId) &&
        reservation.startAt < payload.endAt &&
        reservation.endAt > payload.startAt,
    );
    if (
      selectedSlots.length === 0 ||
      selectedSlots.some((slot) => slot.state !== "AVAILABLE") ||
      overlapsReservation
    ) {
      throw fixtureError("방금 다른 예약이 확정되었어요.", 409, "RESERVATION_CONFLICT");
    }
    return room;
  }

  async function fetchMyReservations({
    status = "UPCOMING",
    page = 0,
    size = 20,
    sortOrder = "DESC",
  } = {}) {
    const reservations = readAll()
      .filter((reservation) => reservation.ownerId === getCurrentOwnerId())
      .map(withCurrentStatus)
      .filter((reservation) => {
        if (status === "UPCOMING") return reservation.status === "CONFIRMED";
        if (status === "PAST") return reservation.status === "COMPLETED";
        if (status === "CANCELED") return reservation.status === "CANCELED_BY_USER";
        return true;
      });
    reservations.sort((left, right) => {
      const direction = sortOrder === "ASC" ? 1 : -1;
      const startComparison = left.startAt.localeCompare(right.startAt);
      if (startComparison !== 0) return startComparison * direction;
      return (Number(left.reservationId) - Number(right.reservationId)) * direction;
    });

    const pageNumber = Math.max(0, Number.parseInt(page, 10) || 0);
    const pageSize = Math.max(1, Number(size) || 20);
    const startIndex = pageNumber * pageSize;
    const items = reservations.slice(startIndex, startIndex + pageSize);
    return {
      items: clone(items.map(toPublicReservation)),
      hasNext: startIndex + items.length < reservations.length,
    };
  }

  async function fetchReservation(reservationId) {
    return clone(toPublicReservation(withCurrentStatus(findOwnedReservation(reservationId))));
  }

  async function fetchConfirmedReservations({ roomId, date, excludeReservationId = "" }) {
    const excludedReservation = readAll().find(
      (reservation) =>
        String(reservation.reservationId) === String(excludeReservationId) &&
        reservation.ownerId === getCurrentOwnerId(),
    );
    const effectiveExcludeId = excludedReservation?.reservationId || "";
    return clone(
      readAll()
        .map(withCurrentStatus)
        .filter(
          (reservation) =>
            reservation.status === "CONFIRMED" &&
            String(reservation.reservationId) !== String(effectiveExcludeId) &&
            String(reservation.roomId) === String(roomId) &&
            reservation.startAt.startsWith(date),
        )
        .map(toPublicReservation),
    );
  }

  async function createReservation(payload) {
    const reservations = readAll();
    const room = validateReservationPayload(payload);
    const changedAt = toLocalDateTime(new Date(now()));
    const reservation = {
      reservationId:
        Math.max(0, ...reservations.map(({ reservationId }) => Number(reservationId) || 0)) + 1,
      ownerId: getCurrentOwnerId(),
      status: "CONFIRMED",
      ...payload,
      room,
      createdAt: changedAt,
      updatedAt: changedAt,
    };
    writeAll([reservation, ...reservations]);
    return clone(toPublicReservation(reservation));
  }

  async function cancelReservation(reservationId) {
    const reservations = readAll();
    const reservation = findOwnedReservation(reservationId);
    if (reservation.status === "CANCELED_BY_USER") {
      return clone(toPublicReservation(reservation));
    }
    if (!toPublicReservation(reservation).canCancel) {
      throw fixtureError("이 예약은 취소할 수 없어요.", 409, "RESERVATION_NOT_CHANGEABLE");
    }
    const canceledReservation = {
      ...reservation,
      status: "CANCELED_BY_USER",
      updatedAt: toLocalDateTime(new Date(now())),
    };
    writeAll(
      reservations.map((candidate) =>
        String(candidate.reservationId) === String(reservationId)
          ? canceledReservation
          : candidate,
      ),
    );
    return clone(toPublicReservation(canceledReservation));
  }

  async function updateReservation(reservationId, payload) {
    const reservations = readAll();
    const reservation = findOwnedReservation(reservationId);
    if (!toPublicReservation(reservation).canChange) {
      throw fixtureError("이 예약은 변경할 수 없어요.", 409, "RESERVATION_NOT_CHANGEABLE");
    }
    const room = validateReservationPayload(payload, { excludeReservationId: reservationId });
    const updatedReservation = {
      ...reservation,
      ...payload,
      room,
      status: "CONFIRMED",
      updatedAt: toLocalDateTime(new Date(now())),
    };
    writeAll(
      reservations.map((candidate) =>
        String(candidate.reservationId) === String(reservationId)
          ? updatedReservation
          : candidate,
      ),
    );
    return clone(toPublicReservation(updatedReservation));
  }

  return {
    cancelReservation,
    createReservation,
    fetchConfirmedReservations,
    fetchMyReservations,
    fetchReservation,
    updateReservation,
  };
}

function createSlots(roomId, date) {
  const daySeed = Number(date.slice(-2));
  const unavailableIndexes = {
    1: [(daySeed + 3) % 28, (daySeed + 4) % 28],
    2: [(daySeed + 7) % 28, (daySeed + 8) % 28, (daySeed + 9) % 28],
    3: [(daySeed + 12) % 28, (daySeed + 13) % 28],
    4: [(daySeed + 2) % 28, (daySeed + 3) % 28],
    5: [(daySeed + 9) % 28, (daySeed + 10) % 28],
    6: [(daySeed + 14) % 28, (daySeed + 15) % 28],
  }[String(roomId)] || [];

  return Array.from({ length: 28 }, (_, index) => {
    const totalMinutes = 9 * 60 + index * 30;
    const endTotalMinutes = totalMinutes + 30;
    return {
      startTime: `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`,
      endTime: `${String(Math.floor(endTotalMinutes / 60)).padStart(2, "0")}:${String(endTotalMinutes % 60).padStart(2, "0")}`,
      state: unavailableIndexes.includes(index) ? "UNAVAILABLE" : "AVAILABLE",
    };
  });
}

async function fetchFixtureRooms() {
  return delay(FIXTURE_ROOMS.filter((room) => room.active));
}

async function fetchFixtureRoom(roomId) {
  const room = findRoom(roomId);
  if (!room) throw fixtureError("회의실을 찾을 수 없어요.", 404, "ROOM_NOT_FOUND");
  return delay(room);
}

async function fetchFixtureMonthAvailability({ roomId, year, month }) {
  const room = findRoom(roomId);
  if (!room) throw fixtureError("회의실을 찾을 수 없어요.", 404, "ROOM_NOT_FOUND");
  if (!room.active) throw fixtureError("이 회의실은 더 이상 예약할 수 없어요.", 409, "ROOM_INACTIVE");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastBookableDate = new Date(today);
  lastBookableDate.setDate(lastBookableDate.getDate() + 60);
  const lastDay = new Date(year, month, 0).getDate();

  return delay({
    year,
    month,
    dates: Array.from({ length: lastDay }, (_, index) => {
      const date = new Date(year, month - 1, index + 1);
      const isPast = date < today;
      const isOutsideRange = date > lastBookableDate;
      const isFull = (index + room.roomId) % 11 === 0;
      return {
        date: toDateKey(date),
        status: isPast
          ? "PAST"
          : isOutsideRange
            ? "OUTSIDE"
            : isFull
              ? "FULL"
              : "AVAILABLE",
      };
    }),
  });
}

async function fetchFixtureDaySlots(
  { roomId, date, excludeReservationId = "" },
  { storage = globalThis.sessionStorage, now = () => new Date() } = {},
) {
  const room = findRoom(roomId);
  if (!room) throw fixtureError("회의실을 찾을 수 없어요.", 404, "ROOM_NOT_FOUND");
  if (!room.active) throw fixtureError("이 회의실은 더 이상 예약할 수 없어요.", 409, "ROOM_INACTIVE");
  const store = createFixtureReservationStore({ storage, now });
  const roomReservations = await store.fetchConfirmedReservations({
    roomId,
    date,
    excludeReservationId,
  });
  const slots = createSlots(roomId, date).map((slot) => {
    const reserved = roomReservations.some((reservation) => {
      const startTime = reservation.startAt.slice(11, 16);
      const endTime = reservation.endAt.slice(11, 16);
      return startTime < slot.endTime && endTime > slot.startTime;
    });
    return reserved ? { ...slot, state: "UNAVAILABLE" } : slot;
  });
  return delay({ maximumDurationMinutes: 120, slots });
}

async function createFixtureReservation(payload) {
  const store = createFixtureReservationStore();
  return delay(await store.createReservation(payload), 300);
}

async function fetchFixtureReservation(reservationId) {
  const store = createFixtureReservationStore();
  return delay(await store.fetchReservation(reservationId));
}

async function fetchFixtureMyReservations(options = {}) {
  const store = createFixtureReservationStore();
  return delay(await store.fetchMyReservations(options));
}

async function updateFixtureReservation(reservationId, payload) {
  const store = createFixtureReservationStore();
  return delay(await store.updateReservation(reservationId, payload), 300);
}

async function cancelFixtureReservation(reservationId) {
  const store = createFixtureReservationStore();
  return delay(await store.cancelReservation(reservationId), 300);
}

export {
  cancelFixtureReservation,
  createFixtureReservationStore,
  createFixtureReservation,
  fetchFixtureDaySlots,
  fetchFixtureMyReservations,
  fetchFixtureMonthAvailability,
  fetchFixtureReservation,
  fetchFixtureRoom,
  fetchFixtureRooms,
  updateFixtureReservation,
};

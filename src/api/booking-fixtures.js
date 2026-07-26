const FIXTURE_ROOMS = [
  {
    roomId: "ryan2",
    name: "RYAN2",
    location: "R2",
    capacity: 6,
    facilities: ["TV", "화이트보드", "보드마카"],
    description: "최대 6명이 이용할 수 있는 회의실입니다.",
    operatingHours: "운영 시간 정보 없음",
    usageGuide: "TV, 화이트보드, 보드마카를 사용할 수 있어요.",
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 120,
    imageUrl: "../assets/rooms/ryan2.png",
    active: true,
    displayOrder: 1,
  },
  {
    roomId: "ryan3",
    name: "RYAN3",
    location: "R3",
    capacity: 8,
    facilities: ["TV", "화이트보드", "보드마카"],
    description: "최대 8명이 이용할 수 있는 회의실입니다.",
    operatingHours: "운영 시간 정보 없음",
    usageGuide: "TV, 화이트보드, 보드마카를 사용할 수 있어요.",
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 120,
    imageUrl: "../assets/rooms/ryan3.png",
    active: true,
    displayOrder: 2,
  },
  {
    roomId: "sangbae2",
    name: "SANGBAE2",
    location: "S2",
    capacity: 8,
    facilities: ["TV", "화이트보드", "보드마카"],
    description: "최대 8명이 이용할 수 있는 회의실입니다.",
    operatingHours: "운영 시간 정보 없음",
    usageGuide: "TV, 화이트보드, 보드마카를 사용할 수 있어요.",
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 120,
    imageUrl: "../assets/rooms/sangbae2.png",
    active: true,
    displayOrder: 3,
  },
  {
    roomId: "t1",
    name: "T1",
    location: "G1 사무실 옆, 타운홀 좌측",
    capacity: 6,
    facilities: [],
    description: "좌석 구성에 따라 4~6명이 이용할 수 있어요.",
    operatingHours: "운영 시간 정보 없음",
    usageGuide: "별도 장비가 없으며 의자가 부족할 수 있어요.",
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 120,
    imageUrl: "../assets/rooms/t1.png",
    active: true,
    displayOrder: 4,
  },
  {
    roomId: "t2",
    name: "T2",
    location: "인포데스크 옆",
    capacity: 6,
    facilities: [],
    description: "좌석 구성에 따라 4~6명이 이용할 수 있어요.",
    operatingHours: "운영 시간 정보 없음",
    usageGuide: "별도 장비가 없으며 의자가 부족할 수 있어요.",
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 120,
    imageUrl: "../assets/rooms/t2.png",
    active: true,
    displayOrder: 5,
  },
  {
    roomId: "t3",
    name: "T3",
    location: "타운홀 우측",
    capacity: 5,
    facilities: [],
    description: "좌석 구성에 따라 4~5명이 이용할 수 있어요.",
    operatingHours: "운영 시간 정보 없음",
    usageGuide: "별도 장비가 없어요.",
    minimumDurationMinutes: 30,
    maximumDurationMinutes: 120,
    imageUrl: "../assets/rooms/t3.png",
    active: true,
    displayOrder: 6,
  },
];

const FIXTURE_RESERVATIONS_KEY = "fixtureReservations";

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

function findRoom(roomId) {
  return FIXTURE_ROOMS.find((room) => room.roomId === roomId);
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
  const updatedAt = new Date(now);
  const earlierUpdatedAt = new Date(now);
  earlierUpdatedAt.setDate(earlierUpdatedAt.getDate() - 1);

  return [
    {
      reservationId: "fixture-upcoming-1",
      ownerId,
      status: "CONFIRMED",
      roomId: "ryan2",
      room: findRoom("ryan2"),
      startAt: `${offsetDateKey(now, 1)}T10:00:00+09:00`,
      endAt: `${offsetDateKey(now, 1)}T11:00:00+09:00`,
      topic: "프로젝트 회의",
      attendees: ["김현", "이도윤"],
      additionalInfo: "화이트보드를 사용할 예정입니다.",
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    },
    {
      reservationId: "fixture-past-1",
      ownerId,
      status: "COMPLETED",
      roomId: "ryan3",
      room: findRoom("ryan3"),
      startAt: `${offsetDateKey(now, -2)}T14:00:00+09:00`,
      endAt: `${offsetDateKey(now, -2)}T15:00:00+09:00`,
      topic: "지난 스터디 회의",
      attendees: ["박서준", "최유진", "정하늘"],
      additionalInfo: "",
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    },
    {
      reservationId: "fixture-canceled-user",
      ownerId,
      status: "CANCELED_BY_USER",
      roomId: "t1",
      room: findRoom("t1"),
      startAt: `${offsetDateKey(now, 2)}T11:00:00+09:00`,
      endAt: `${offsetDateKey(now, 2)}T12:00:00+09:00`,
      topic: "취소한 인터뷰 연습",
      attendees: ["김현"],
      additionalInfo: "",
      createdAt: createdAt.toISOString(),
      updatedAt: earlierUpdatedAt.toISOString(),
    },
    {
      reservationId: "fixture-canceled-admin",
      ownerId,
      status: "CANCELED_BY_ADMIN",
      roomId: "sangbae2",
      room: findRoom("sangbae2"),
      startAt: `${offsetDateKey(now, 3)}T15:00:00+09:00`,
      endAt: `${offsetDateKey(now, 3)}T16:00:00+09:00`,
      topic: "운영 일정으로 취소된 회의",
      attendees: ["이도윤", "최유진"],
      additionalInfo: "",
      adminCancelReason: "부트캠프 운영 일정으로 회의실을 사용할 수 없어요.",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
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
    const reservation = readAll().find((candidate) => candidate.reservationId === reservationId);
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
    const { ownerId: _ownerId, ...publicReservation } = reservation;
    return publicReservation;
  }

  function withCurrentStatus(reservation) {
    if (reservation.status === "CONFIRMED" && new Date(reservation.endAt) <= new Date(now())) {
      return { ...reservation, status: "COMPLETED" };
    }
    return reservation;
  }

  function validateReservationPayload(payload, { excludeReservationId = "" } = {}) {
    const room = findRoom(payload.roomId);
    if (!room || !room.active) {
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
        reservation.reservationId !== excludeReservationId &&
        reservation.status === "CONFIRMED" &&
        reservation.roomId === payload.roomId &&
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

  async function fetchMyReservations({ status = "UPCOMING", cursor = "", size = 10 } = {}) {
    const reservations = readAll()
      .filter((reservation) => reservation.ownerId === getCurrentOwnerId())
      .map(withCurrentStatus)
      .filter((reservation) => {
        if (status === "UPCOMING") return reservation.status === "CONFIRMED";
        if (status === "PAST") return reservation.status === "COMPLETED";
        if (status === "CANCELED") return reservation.status.startsWith("CANCELED_");
        return true;
      });
    reservations.sort((left, right) => {
      if (status === "UPCOMING") return left.startAt.localeCompare(right.startAt);
      if (status === "PAST") return right.startAt.localeCompare(left.startAt);
      return right.updatedAt.localeCompare(left.updatedAt);
    });

    const startIndex = Math.max(0, Number.parseInt(cursor || "0", 10) || 0);
    const pageSize = Math.max(1, Number(size) || 10);
    const items = reservations.slice(startIndex, startIndex + pageSize);
    const nextIndex = startIndex + items.length;
    return {
      items: clone(items.map(toPublicReservation)),
      nextCursor: nextIndex < reservations.length ? String(nextIndex) : null,
    };
  }

  async function fetchReservation(reservationId) {
    return clone(toPublicReservation(withCurrentStatus(findOwnedReservation(reservationId))));
  }

  async function fetchConfirmedReservations({ roomId, date, excludeReservationId = "" }) {
    const excludedReservation = readAll().find(
      (reservation) =>
        reservation.reservationId === excludeReservationId &&
        reservation.ownerId === getCurrentOwnerId(),
    );
    const effectiveExcludeId = excludedReservation?.reservationId || "";
    return clone(
      readAll()
        .map(withCurrentStatus)
        .filter(
          (reservation) =>
            reservation.status === "CONFIRMED" &&
            reservation.reservationId !== effectiveExcludeId &&
            reservation.roomId === roomId &&
            reservation.startAt.startsWith(date),
        )
        .map(toPublicReservation),
    );
  }

  async function createReservation(payload) {
    const reservations = readAll();
    const existingReservation = reservations.find(
      (reservation) =>
        reservation.ownerId === getCurrentOwnerId() &&
        reservation.idempotencyKey === payload.idempotencyKey,
    );
    if (existingReservation) return clone(toPublicReservation(existingReservation));

    const room = validateReservationPayload(payload);
    const changedAt = new Date(now()).toISOString();
    const reservation = {
      reservationId: globalThis.crypto?.randomUUID?.() || `reservation-${Date.now()}`,
      ownerId: getCurrentOwnerId(),
      status: "CONFIRMED",
      ...payload,
      room,
      createdAt: changedAt,
      updatedAt: changedAt,
    };
    writeAll([reservation, ...reservations]);
    storage?.setItem("lastConfirmedReservation", JSON.stringify(reservation));
    return clone(toPublicReservation(reservation));
  }

  async function cancelReservation(reservationId) {
    const reservations = readAll();
    const reservation = findOwnedReservation(reservationId);
    if (reservation.status === "CANCELED_BY_USER") {
      return clone(toPublicReservation(reservation));
    }
    if (withCurrentStatus(reservation).status !== "CONFIRMED") {
      throw fixtureError("이 예약은 취소할 수 없어요.", 409, "RESERVATION_NOT_CHANGEABLE");
    }
    const canceledReservation = {
      ...reservation,
      status: "CANCELED_BY_USER",
      updatedAt: new Date(now()).toISOString(),
    };
    writeAll(
      reservations.map((candidate) =>
        candidate.reservationId === reservationId ? canceledReservation : candidate,
      ),
    );
    return clone(toPublicReservation(canceledReservation));
  }

  async function updateReservation(reservationId, payload) {
    const reservations = readAll();
    const reservation = findOwnedReservation(reservationId);
    if (withCurrentStatus(reservation).status !== "CONFIRMED") {
      throw fixtureError("이 예약은 변경할 수 없어요.", 409, "RESERVATION_NOT_CHANGEABLE");
    }
    const room = validateReservationPayload(payload, { excludeReservationId: reservationId });
    const updatedReservation = {
      ...reservation,
      ...payload,
      room,
      status: "CONFIRMED",
      updatedAt: new Date(now()).toISOString(),
    };
    writeAll(
      reservations.map((candidate) =>
        candidate.reservationId === reservationId ? updatedReservation : candidate,
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
    ryan2: [(daySeed + 3) % 18, (daySeed + 4) % 18],
    ryan3: [(daySeed + 7) % 18, (daySeed + 8) % 18, (daySeed + 9) % 18],
    sangbae2: [(daySeed + 12) % 18, (daySeed + 13) % 18],
    t1: [(daySeed + 2) % 18, (daySeed + 3) % 18],
    t2: [(daySeed + 9) % 18, (daySeed + 10) % 18],
    t3: [(daySeed + 14) % 18, (daySeed + 15) % 18],
  }[roomId] || [];

  return Array.from({ length: 18 }, (_, index) => {
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
  return delay(
    FIXTURE_ROOMS.filter((room) => room.active).sort(
      (left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, "ko"),
    ),
  );
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
      const isClosed = date.getDay() === 0;
      const isPast = date < today;
      const isOutsideRange = date > lastBookableDate;
      const isFull = !isClosed && (index + room.displayOrder) % 11 === 0;
      return {
        date: toDateKey(date),
        status: isPast
          ? "PAST"
          : isOutsideRange
            ? "OUTSIDE"
            : isClosed
              ? "CLOSED"
              : isFull
                ? "FULL"
                : "AVAILABLE",
      };
    }),
  });
}

async function fetchFixtureDaySlots({ roomId, date }) {
  const room = findRoom(roomId);
  if (!room) throw fixtureError("회의실을 찾을 수 없어요.", 404, "ROOM_NOT_FOUND");
  if (!room.active) throw fixtureError("이 회의실은 더 이상 예약할 수 없어요.", 409, "ROOM_INACTIVE");
  const store = createFixtureReservationStore();
  const editingReservationId = globalThis.sessionStorage?.getItem("roomBookingEditingReservationId") || "";
  const roomReservations = await store.fetchConfirmedReservations({
    roomId,
    date,
    excludeReservationId: editingReservationId,
  });
  const slots = createSlots(roomId, date).map((slot) => {
    const reserved = roomReservations.some((reservation) => {
      const startTime = reservation.startAt.slice(11, 16);
      const endTime = reservation.endAt.slice(11, 16);
      return startTime < slot.endTime && endTime > slot.startTime;
    });
    return reserved ? { ...slot, state: "UNAVAILABLE" } : slot;
  });
  return delay({ maximumDurationMinutes: room.maximumDurationMinutes, slots });
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

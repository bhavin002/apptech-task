import { afterAll, beforeEach, describe, expect, it } from "vitest";

import Booking from "../src/models/booking.model";
import Resource from "../src/models/resource.model";
import {
  api,
  bearer,
  book,
  closeDatabase,
  createUser,
  getResource,
  resetDatabase,
} from "./helpers";

// Room A: Europe/London, Mon-Fri 09:00-17:00. 2026-01-12 is a Monday (GMT).
const at = (time: string) => `2026-01-12T${time}:00Z`;

const countBookings = (resourceId: number, start: string, end: string) =>
  Booking.count({
    where: {
      resourceId,
      startTime: new Date(start),
      endTime: new Date(end),
    },
  });

describe("POST /api/bookings", () => {
  let roomA: Resource;
  let token: string;
  let userId: number;

  beforeEach(async () => {
    await resetDatabase();
    roomA = await getResource("Room A");
    ({ token, id: userId } = await createUser());
  });

  afterAll(closeDatabase);

  it("creates a booking for the authenticated user", async () => {
    const response = await book(token, roomA.id, at("09:00"), at("09:30"))
      .expect(201);

    expect(response.body.data).toMatchObject({
      userId,
      resourceId: roomA.id,
      startTime: "2026-01-12T09:00:00Z",
      endTime: "2026-01-12T09:30:00Z",
      resource: { name: "Room A", timezone: "Europe/London" },
    });

    const stored = await Booking.findByPk(response.body.data.id);
    expect(stored?.startTime.toISOString()).toBe("2026-01-12T09:00:00.000Z");
    expect(stored?.userId).toBe(userId);
  });

  it("ignores a client supplied userId", async () => {
    const other = await createUser();

    const response = await api()
      .post("/api/bookings")
      .set(bearer(token))
      .send({ resourceId: roomA.id, userId: other.id, startTime: at("09:00"), endTime: at("09:30") });

    // Unknown fields are rejected by validation; the user never comes from the body.
    expect(response.status).toBe(400);
    expect(await Booking.count()).toBe(0);
  });

  it("accepts instants given with a non-UTC offset", async () => {
    // 14:30 in India is 09:00 in London in January.
    const response = await book(
      token,
      roomA.id,
      "2026-01-12T14:30:00+05:30",
      "2026-01-12T15:00:00+05:30"
    ).expect(201);

    expect(response.body.data.startTime).toBe("2026-01-12T09:00:00Z");
  });

  it("accepts the final slot ending exactly at closing time", async () => {
    await book(token, roomA.id, at("16:30"), at("17:00")).expect(201);
  });

  it.each([
    ["before opening", at("08:30"), at("09:00")],
    ["after closing", at("17:00"), at("17:30")],
    ["extending beyond closing", at("16:45"), at("17:15")],
    ["not aligned to a slot", at("09:15"), at("09:45")],
    ["longer than one slot", at("09:00"), at("10:00")],
    ["shorter than one slot", at("09:00"), at("09:15")],
    ["end before start", at("09:30"), at("09:00")],
    ["on a weekend", "2026-01-17T10:00:00Z", "2026-01-17T10:30:00Z"],
  ])("rejects a booking %s with 400", async (_label, start, end) => {
    const response = await book(token, roomA.id, start, end);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(await Booking.count()).toBe(0);
  });

  it("rejects instants without a timezone offset", async () => {
    // Would be a valid slot if read as UTC; must be rejected regardless of
    // the server's own timezone.
    const response = await book(token, roomA.id, "2026-01-12T09:00:00", "2026-01-12T09:30:00")
      .expect(400);

    expect(response.body.message).toBe("Validation error");
    expect(await Booking.count()).toBe(0);
  });

  it("returns 404 for an unknown resource", async () => {
    await book(token, 9999, at("09:00"), at("09:30")).expect(404);
  });

  describe("half-open intervals", () => {
    it("allows adjacent bookings", async () => {
      await book(token, roomA.id, at("09:00"), at("09:30")).expect(201);
      await book(token, roomA.id, at("09:30"), at("10:00")).expect(201);

      expect(await Booking.count({ where: { resourceId: roomA.id } })).toBe(2);
    });

    it("rejects an identical interval with 409", async () => {
      await book(token, roomA.id, at("09:00"), at("09:30")).expect(201);

      const response = await book(token, roomA.id, at("09:00"), at("09:30"));

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("This slot has already been booked.");
      expect(await countBookings(roomA.id, at("09:00"), at("09:30"))).toBe(1);
    });

    it("lets the database reject a partially overlapping interval", async () => {
      await book(token, roomA.id, at("09:00"), at("09:30")).expect(201);

      // Bypass the API to prove the constraint itself does the work.
      await expect(
        Booking.create({
          userId,
          resourceId: roomA.id,
          startTime: new Date(at("09:15")),
          endTime: new Date(at("09:45")),
        })
      ).rejects.toMatchObject({ parent: { code: "23P01" } });

      // Adjacent rows are fine at database level too.
      await Booking.create({
        userId,
        resourceId: roomA.id,
        startTime: new Date(at("08:30")),
        endTime: new Date(at("09:00")),
      });
    });

    it("allows the same interval on a different resource", async () => {
      const roomB = await getResource("Room B");

      await book(token, roomA.id, at("09:00"), at("09:30")).expect(201);
      // 09:00Z = 14:30 in Kolkata, inside Room B's 10:00-18:00.
      await book(token, roomB.id, at("09:00"), at("09:30")).expect(201);
    });
  });

  describe("concurrency", () => {
    it("two simultaneous requests for the same slot: exactly one succeeds", async () => {
      const otherUser = await createUser();

      const responses = await Promise.all([
        book(token, roomA.id, at("11:00"), at("11:30")),
        book(otherUser.token, roomA.id, at("11:00"), at("11:30")),
      ]);

      const statuses = responses.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409]);
      expect(await countBookings(roomA.id, at("11:00"), at("11:30"))).toBe(1);
    });

    it("ten simultaneous requests for the same slot: exactly one succeeds", async () => {
      const users = await Promise.all(
        Array.from({ length: 10 }, () => createUser())
      );

      const responses = await Promise.all(
        users.map((user) => book(user.token, roomA.id, at("12:00"), at("12:30")))
      );

      const statuses = responses.map((r) => r.status);
      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(9);
      expect(await countBookings(roomA.id, at("12:00"), at("12:30"))).toBe(1);
    });
  });

  describe("authentication and authorization", () => {
    it("rejects booking without a token", async () => {
      await api()
        .post("/api/bookings")
        .send({ resourceId: roomA.id, startTime: at("09:00"), endTime: at("09:30") })
        .expect(401);

      expect(await Booking.count()).toBe(0);
    });

    it("rejects booking with an invalid token", async () => {
      await book("not-a-jwt", roomA.id, at("09:00"), at("09:30")).expect(401);

      expect(await Booking.count()).toBe(0);
    });

    it("prevents users from reading or deleting another user's booking", async () => {
      const created = await book(token, roomA.id, at("09:00"), at("09:30"))
        .expect(201);
      const bookingId = created.body.data.id;
      const intruder = await createUser();

      await api()
        .get(`/api/bookings/${bookingId}`)
        .set(bearer(intruder.token))
        .expect(403);
      await api()
        .delete(`/api/bookings/${bookingId}`)
        .set(bearer(intruder.token))
        .expect(403);

      const ownList = await api()
        .get("/api/bookings")
        .set(bearer(intruder.token))
        .expect(200);
      expect(ownList.body.data).toEqual([]);

      const owner = await api()
        .get(`/api/bookings/${bookingId}`)
        .set(bearer(token))
        .expect(200);
      expect(owner.body.data.startTime).toBe("2026-01-12T09:00:00Z");
      expect(await Booking.count()).toBe(1);
    });

    it("returns 404 for a missing booking", async () => {
      await api().get("/api/bookings/9999").set(bearer(token)).expect(404);
    });
  });
});

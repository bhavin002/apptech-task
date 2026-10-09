import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  api,
  bearer,
  book,
  closeDatabase,
  createUser,
  getResource,
  resetDatabase,
} from "./helpers";

const MONDAY = "2026-01-12";
const SATURDAY = "2026-01-17";

describe("GET /api/resources/:id/availability", () => {
  let token: string;

  beforeEach(async () => {
    await resetDatabase();
    token = (await createUser()).token;
  });

  afterAll(closeDatabase);

  const slotsFor = async (
    resourceId: number,
    date: string,
    timezone?: string
  ) => {
    const response = await api()
      .get(`/api/resources/${resourceId}/availability`)
      .query(timezone ? { date, timezone } : { date })
      .set(bearer(token))
      .expect(200);

    return response.body.data;
  };

  it("lists the seeded resources with their weekly rules", async () => {
    const response = await api()
      .get("/api/resources")
      .set(bearer(token))
      .expect(200);

    const names = response.body.data.map((r: any) => r.name);
    expect(names).toEqual(["Room A", "Room B", "Consultant C"]);
    expect(response.body.data[0].timezone).toBe("Europe/London");
    expect(response.body.data[0].Availabilities).toHaveLength(5);
  });

  it("generates 30 minute slots within working hours on a working day", async () => {
    const roomA = await getResource("Room A");
    const data = await slotsFor(roomA.id, MONDAY);

    expect(data.slotMinutes).toBe(30);
    expect(data.slots).toHaveLength(16); // 09:00-17:00
    expect(data.slots[0]).toMatchObject({
      startTime: "2026-01-12T09:00:00Z",
      endTime: "2026-01-12T09:30:00Z",
      status: "available",
      resourceLocal: { start: "09:00", end: "09:30", utcOffset: "+00:00" },
    });
    // The final slot ends exactly at closing time.
    expect(data.slots[15]).toMatchObject({
      startTime: "2026-01-12T16:30:00Z",
      endTime: "2026-01-12T17:00:00Z",
    });
  });

  it("uses the resource's own timezone for working hours", async () => {
    const roomB = await getResource("Room B");
    const data = await slotsFor(roomB.id, MONDAY);

    // 10:00 Asia/Kolkata (+05:30) is 04:30 UTC.
    expect(data.slots).toHaveLength(16);
    expect(data.slots[0].startTime).toBe("2026-01-12T04:30:00Z");
    expect(data.slots[15].endTime).toBe("2026-01-12T12:30:00Z");
  });

  it("returns no slots on a non-working day", async () => {
    const roomA = await getResource("Room A");
    const data = await slotsFor(roomA.id, SATURDAY);

    expect(data.slots).toEqual([]);
  });

  it("keeps local opening hours correct across a DST change", async () => {
    const roomA = await getResource("Room A");
    const consultant = await getResource("Consultant C");

    // London: Friday before (GMT) and Monday after (BST) 2026-03-29.
    expect((await slotsFor(roomA.id, "2026-03-27")).slots[0].startTime)
      .toBe("2026-03-27T09:00:00Z");
    expect((await slotsFor(roomA.id, "2026-03-30")).slots[0].startTime)
      .toBe("2026-03-30T08:00:00Z");

    // New York: Friday before (EST) and Monday after (EDT) 2026-03-08.
    expect((await slotsFor(consultant.id, "2026-03-06")).slots[0].startTime)
      .toBe("2026-03-06T14:00:00Z");
    expect((await slotsFor(consultant.id, "2026-03-09")).slots[0].startTime)
      .toBe("2026-03-09T13:00:00Z");
  });

  it("marks booked slots as booked", async () => {
    const roomA = await getResource("Room A");

    await book(token, roomA.id, "2026-01-12T10:00:00Z", "2026-01-12T10:30:00Z")
      .expect(201);

    const data = await slotsFor(roomA.id, MONDAY);
    const booked = data.slots.filter((s: any) => s.status === "booked");

    expect(booked.map((s: any) => s.startTime)).toEqual([
      "2026-01-12T10:00:00Z",
    ]);
  });

  it("returns the weekly rules when no date is given", async () => {
    const roomA = await getResource("Room A");

    const response = await api()
      .get(`/api/resources/${roomA.id}/availability`)
      .set(bearer(token))
      .expect(200);

    expect(response.body.data.map((r: any) => r.dayOfWeek)).toEqual([1, 2, 3, 4, 5]);
    expect(response.body.data[0]).toMatchObject({
      startTime: "09:00:00",
      endTime: "17:00:00",
    });
  });

  it("rejects malformed dates and timezones with 400", async () => {
    const roomA = await getResource("Room A");
    const url = `/api/resources/${roomA.id}/availability`;

    for (const query of [
      { date: "12-01-2026" },
      { date: "2026-13-01" },
      { date: "2026-02-30" },
      { date: MONDAY, timezone: "Mars/Olympus" },
    ]) {
      await api().get(url).query(query).set(bearer(token)).expect(400);
    }
  });

  it("returns 404 for an unknown resource and 401 without a token", async () => {
    await api()
      .get("/api/resources/9999/availability")
      .query({ date: MONDAY })
      .set(bearer(token))
      .expect(404);

    await api()
      .get("/api/resources/1/availability")
      .query({ date: MONDAY })
      .expect(401);
  });
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import Availability from "../src/models/availability.model";
import Resource from "../src/models/resource.model";
import { DayOfWeek } from "../src/models/common.model";
import {
  api,
  bearer,
  book,
  closeDatabase,
  createUser,
  getResource,
  resetDatabase,
} from "./helpers";

describe("timezones", () => {
  let token: string;
  let roomA: Resource;

  beforeEach(async () => {
    await resetDatabase();
    token = (await createUser()).token;
    roomA = await getResource("Room A");
  });

  afterAll(closeDatabase);

  const slotsFor = async (resourceId: number, date: string, timezone?: string) =>
    (
      await api()
        .get(`/api/resources/${resourceId}/availability`)
        .query(timezone ? { date, timezone } : { date })
        .set(bearer(token))
        .expect(200)
    ).body.data;

  it("shows a London winter slot in Asia/Kolkata", async () => {
    const data = await slotsFor(roomA.id, "2026-01-12", "Asia/Kolkata");

    expect(data.displayTimezone).toBe("Asia/Kolkata");
    expect(data.slots[0]).toMatchObject({
      startTime: "2026-01-12T09:00:00Z",
      resourceLocal: { start: "09:00", utcOffset: "+00:00" },
      display: {
        start: "2026-01-12T14:30:00+05:30",
        end: "2026-01-12T15:00:00+05:30",
      },
    });
  });

  it("shows a London summer slot in Asia/Kolkata", async () => {
    // 2026-07-13 is a Monday; London is on BST (+01:00).
    const data = await slotsFor(roomA.id, "2026-07-13", "Asia/Kolkata");

    expect(data.slots[0]).toMatchObject({
      startTime: "2026-07-13T08:00:00Z",
      resourceLocal: { start: "09:00", utcOffset: "+01:00" },
      display: { start: "2026-07-13T13:30:00+05:30" },
    });
  });

  it("changing the display timezone does not change slot instants", async () => {
    const instants = async (timezone?: string) =>
      (await slotsFor(roomA.id, "2026-01-12", timezone)).slots.map(
        (s: any) => [s.startTime, s.endTime]
      );

    const reference = await instants();

    expect(await instants("Asia/Kolkata")).toEqual(reference);
    expect(await instants("America/Los_Angeles")).toEqual(reference);
    expect(await instants("Pacific/Auckland")).toEqual(reference);
  });

  describe("DST through the API", () => {
    let night: Resource;

    // A London resource open on Sundays 00:00-04:00 so the transitions
    // fall inside working hours.
    beforeEach(async () => {
      night = await Resource.create({ name: "Night Desk", timezone: "Europe/London" });
      await Availability.create({
        resourceId: night.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        startTime: "00:00",
        endTime: "04:00",
      });
    });

    it("spring forward: no slot for the missing hour", async () => {
      const data = await slotsFor(night.id, "2026-03-29");

      expect(data.slots.map((s: any) => s.resourceLocal.start)).toEqual([
        "00:00", "00:30", "02:00", "02:30", "03:00", "03:30",
      ]);
    });

    it("fall back: both 01:00 occurrences are listed and bookable separately", async () => {
      const data = await slotsFor(night.id, "2026-10-25");
      const oneAm = data.slots.filter((s: any) => s.resourceLocal.start === "01:00");

      expect(oneAm).toHaveLength(2);
      expect(oneAm.map((s: any) => s.resourceLocal.utcOffset)).toEqual(["+01:00", "+00:00"]);
      expect(oneAm.map((s: any) => s.startTime)).toEqual([
        "2026-10-25T00:00:00Z",
        "2026-10-25T01:00:00Z",
      ]);

      for (const slot of oneAm) {
        await book(token, night.id, slot.startTime, slot.endTime).expect(201);
      }

      const after = await slotsFor(night.id, "2026-10-25");
      const booked = after.slots.filter((s: any) => s.status === "booked");
      expect(booked.map((s: any) => s.startTime)).toEqual([
        "2026-10-25T00:00:00Z",
        "2026-10-25T01:00:00Z",
      ]);
    });
  });
});

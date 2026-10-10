import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { SLOT_MINUTES } from "../src/config/booking";
import Booking from "../src/models/booking.model";
import Resource from "../src/models/resource.model";
import {
  book,
  closeDatabase,
  createUser,
  getResource,
  getSlots,
  plusMinutes,
  resetDatabase,
  slotFrom,
} from "./helpers";

// Room A (Europe/London) is open Monday 09:00-17:00.
// 2026-01-12 is a Monday in winter, so London time equals UTC.
const MONDAY = "2026-01-12";
const OPENING = "2026-01-12T09:00:00Z";
const CLOSING = "2026-01-12T17:00:00Z";
const HALF = SLOT_MINUTES / 2;

describe("booking rules", () => {
  let roomA: Resource;
  let token: string;

  beforeEach(async () => {
    await resetDatabase();
    roomA = await getResource("Room A");
    token = (await createUser()).token;
  });

  afterAll(closeDatabase);

  // Guarantee 3: anything booked outside the weekly availability is rejected.
  describe("weekly availability", () => {
    it("accepts the first slot at opening and the last slot ending exactly at closing", async () => {
      const first = slotFrom(OPENING);
      const last = slotFrom(plusMinutes(CLOSING, -SLOT_MINUTES));

      await book(token, roomA.id, first.start, first.end).expect(201);
      await book(token, roomA.id, last.start, last.end).expect(201);
    });

    it.each([
      ["before opening", slotFrom(plusMinutes(OPENING, -SLOT_MINUTES))],
      ["after closing", slotFrom(CLOSING)],
      ["running past closing", slotFrom(plusMinutes(CLOSING, -HALF))],
      ["not aligned to the slot grid", slotFrom(plusMinutes(OPENING, HALF))],
      ["longer than one slot", { start: OPENING, end: plusMinutes(OPENING, 2 * SLOT_MINUTES) }],
      ["on a day the resource is closed (Tuesday)", slotFrom("2026-01-13T10:00:00Z")],
    ])("rejects a booking %s with 400", async (_label, slot) => {
      const response = await book(token, roomA.id, slot.start, slot.end);

      expect(response.status).toBe(400);
      expect(await Booking.count()).toBe(0);
    });
  });

  // Intervals are [start, end): a slot ending at 10:00 and one starting at 10:00 do not overlap.
  describe("half-open intervals", () => {
    it("allows back-to-back bookings", async () => {
      const first = slotFrom("2026-01-12T10:00:00Z");
      const next = slotFrom(first.end);

      await book(token, roomA.id, first.start, first.end).expect(201);
      await book(token, roomA.id, next.start, next.end).expect(201);
    });

    it("marks only the booked slot as taken, not its neighbours", async () => {
      const taken = slotFrom("2026-01-12T10:00:00Z");
      await book(token, roomA.id, taken.start, taken.end).expect(201);

      const slots = await getSlots(token, roomA.id, MONDAY);
      const status = (start: string) => slots.find((s) => s.startTime === start)?.status;

      expect(slots.filter((s) => s.status === "booked").map((s) => s.startTime)).toEqual([taken.start]);
      expect(status(plusMinutes(taken.start, -SLOT_MINUTES))).toBe("available"); // ends at 10:00
      expect(status(taken.end)).toBe("available"); // starts where the booking ends
    });

    it("rejects the same slot a second time with 409", async () => {
      const slot = slotFrom("2026-01-12T10:00:00Z");
      await book(token, roomA.id, slot.start, slot.end).expect(201);

      await book(token, roomA.id, slot.start, slot.end).expect(409);
    });
  });
});

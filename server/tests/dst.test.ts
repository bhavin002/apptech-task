import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { SLOT_MINUTES } from "../src/config/booking";
import { generateSlots } from "../src/services/availability.service";

// Pure slot generation, no database. All dates below are Sundays on which
// the clocks change.
const local = (iso: DateTime, zone: string) =>
  iso.setZone(zone).toFormat("HH:mm ZZ");

const utc = (iso: DateTime) =>
  iso.toUTC().toISO({ suppressMilliseconds: true });

describe("DST slot generation", () => {
  it("uses a 30 minute slot length", () => {
    expect(SLOT_MINUTES).toBe(30);
  });

  it("spring forward (Europe/London 2026-03-29): skips the nonexistent 01:00-02:00 hour", () => {
    const slots = generateSlots("Europe/London", "2026-03-29", [
      { startTime: "00:00", endTime: "04:00" },
    ]);

    // 00:00 GMT -> 04:00 BST is only 3 real hours.
    expect(slots).toHaveLength(6);
    expect(slots.map((s) => local(s.start, "Europe/London"))).toEqual([
      "00:00 +00:00",
      "00:30 +00:00",
      "02:00 +01:00",
      "02:30 +01:00",
      "03:00 +01:00",
      "03:30 +01:00",
    ]);
    expect(utc(slots[2].start)).toBe("2026-03-29T01:00:00Z");

    const localHours = slots.map(
      (s) => s.start.setZone("Europe/London").hour
    );
    expect(localHours).not.toContain(1);

    // Every slot is exactly 30 real minutes.
    for (const slot of slots) {
      expect(slot.end.diff(slot.start, "minutes").minutes).toBe(30);
    }
  });

  it("spring forward: an opening time inside the gap is moved forward by the gap length", () => {
    const slots = generateSlots("Europe/London", "2026-03-29", [
      { startTime: "01:30", endTime: "03:00" },
    ]);

    expect(slots.map((s) => local(s.start, "Europe/London"))).toEqual([
      "02:30 +01:00",
    ]);
  });

  it("spring forward (America/New_York 2026-03-08): skips 02:00-03:00", () => {
    const slots = generateSlots("America/New_York", "2026-03-08", [
      { startTime: "00:00", endTime: "04:00" },
    ]);

    expect(slots).toHaveLength(6);
    expect(slots.map((s) => local(s.start, "America/New_York"))).toEqual([
      "00:00 -05:00",
      "00:30 -05:00",
      "01:00 -05:00",
      "01:30 -05:00",
      "03:00 -04:00",
      "03:30 -04:00",
    ]);
  });

  it("fall back (Europe/London 2026-10-25): both 01:xx occurrences exist as distinct instants", () => {
    const slots = generateSlots("Europe/London", "2026-10-25", [
      { startTime: "00:00", endTime: "04:00" },
    ]);

    // 00:00 BST -> 04:00 GMT is 5 real hours.
    expect(slots).toHaveLength(10);
    expect(slots.map((s) => local(s.start, "Europe/London"))).toEqual([
      "00:00 +01:00",
      "00:30 +01:00",
      "01:00 +01:00",
      "01:30 +01:00",
      "01:00 +00:00",
      "01:30 +00:00",
      "02:00 +00:00",
      "02:30 +00:00",
      "03:00 +00:00",
      "03:30 +00:00",
    ]);

    // Same wall-clock label, different instants, no duplicates.
    expect(utc(slots[2].start)).toBe("2026-10-25T00:00:00Z");
    expect(utc(slots[4].start)).toBe("2026-10-25T01:00:00Z");
    const instants = new Set(slots.map((s) => s.start.toMillis()));
    expect(instants.size).toBe(slots.length);
  });

  it("fall back: an ambiguous closing time resolves to the earlier occurrence", () => {
    const slots = generateSlots("Europe/London", "2026-10-25", [
      { startTime: "00:00", endTime: "01:30" },
    ]);

    expect(slots.map((s) => local(s.start, "Europe/London"))).toEqual([
      "00:00 +01:00",
      "00:30 +01:00",
      "01:00 +01:00",
    ]);
  });

  it("does not assume a 24 hour day", () => {
    const allDay = [{ startTime: "00:00", endTime: "23:30" }];

    expect(generateSlots("Europe/London", "2026-03-28", allDay)).toHaveLength(47);
    expect(generateSlots("Europe/London", "2026-03-29", allDay)).toHaveLength(45);
    expect(generateSlots("Europe/London", "2026-10-25", allDay)).toHaveLength(49);
  });

  it("deduplicates overlapping availability rules", () => {
    const slots = generateSlots("Europe/London", "2026-01-12", [
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "09:30", endTime: "10:30" },
    ]);

    expect(slots.map((s) => utc(s.start))).toEqual([
      "2026-01-12T09:00:00Z",
      "2026-01-12T09:30:00Z",
      "2026-01-12T10:00:00Z",
    ]);
  });
});

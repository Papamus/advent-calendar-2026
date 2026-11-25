import { expect, test } from "@playwright/test";
import {
  getCalendarDayStatus,
  getWarsawCalendarTime,
  isCalendarDayUnlocked,
} from "../src/lib/calendar/date-gate";

test("uses the Warsaw date when midnight crosses the UTC day boundary", () => {
  const justBeforeMidnight = new Date("2026-11-30T22:59:00.000Z");
  const midnightInWarsaw = new Date("2026-11-30T23:00:00.000Z");

  expect(getWarsawCalendarTime(justBeforeMidnight)).toMatchObject({
    month: 11,
    day: 30,
    hour: 23,
  });
  expect(getWarsawCalendarTime(midnightInWarsaw)).toMatchObject({
    month: 12,
    day: 1,
    hour: 0,
  });
  expect(isCalendarDayUnlocked(1, justBeforeMidnight)).toBe(false);
  expect(isCalendarDayUnlocked(1, midnightInWarsaw)).toBe(true);
});

test("uses the Warsaw daylight-saving transition", () => {
  const beforeClockChange = getWarsawCalendarTime(
    new Date("2026-03-29T00:59:00.000Z"),
  );
  const afterClockChange = getWarsawCalendarTime(
    new Date("2026-03-29T01:00:00.000Z"),
  );

  expect(beforeClockChange.hour).toBe(1);
  expect(afterClockChange.hour).toBe(3);
});

test("handles December day boundaries and previously opened gifts", () => {
  const decemberFirst = new Date("2026-12-01T12:00:00.000Z");
  const decemberTwentyFourth = new Date("2026-12-24T12:00:00.000Z");
  const afterAdvent = new Date("2026-12-25T12:00:00.000Z");

  expect(getCalendarDayStatus(2, null, decemberFirst)).toBe("locked");
  expect(getCalendarDayStatus(1, null, decemberFirst)).toBe("ready");
  expect(getCalendarDayStatus(2, "2026-12-02T00:00:00.000Z", decemberFirst)).toBe(
    "opened",
  );
  expect(isCalendarDayUnlocked(24, decemberTwentyFourth)).toBe(true);
  expect(isCalendarDayUnlocked(24, afterAdvent)).toBe(true);
});

test("does not unlock unopened gifts outside December", () => {
  expect(isCalendarDayUnlocked(1, new Date("2026-11-30T12:00:00.000Z"))).toBe(
    false,
  );
  expect(isCalendarDayUnlocked(1, new Date("2027-01-01T12:00:00.000Z"))).toBe(
    false,
  );
});

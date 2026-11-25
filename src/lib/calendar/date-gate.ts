import type { CalendarDayStatus } from "@/types/calendar";

export const CALENDAR_TIME_ZONE = "Europe/Warsaw";
export const CALENDAR_DAY_COUNT = 24;

export interface WarsawCalendarTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const warsawDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CALENDAR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getWarsawCalendarTime(now: Date = new Date()): WarsawCalendarTime {
  const parts = Object.fromEntries(
    warsawDateFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

export function isCalendarDayUnlocked(
  dayNumber: number,
  now: Date = new Date(),
): boolean {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > CALENDAR_DAY_COUNT) {
    return false;
  }

  const localTime = getWarsawCalendarTime(now);
  return localTime.month === 12 && dayNumber <= localTime.day;
}

export function getCalendarDayStatus(
  dayNumber: number,
  openedAt: string | null,
  now: Date = new Date(),
): CalendarDayStatus {
  if (openedAt !== null) {
    return "opened";
  }

  return isCalendarDayUnlocked(dayNumber, now) ? "ready" : "locked";
}

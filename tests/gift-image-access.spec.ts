import { expect, test } from "@playwright/test";
import { getGiftImageAccessError } from "../src/lib/calendar/gift-image-access";
import { isCalendarDayUnlocked } from "../src/lib/calendar/date-gate";

test("blocks images for unlocked days until opened_at is recorded", async () => {
  const now = new Date("2026-12-01T12:00:00.000Z");
  expect(isCalendarDayUnlocked(1, now)).toBe(true);

  const response = getGiftImageAccessError(null);
  expect(response?.status).toBe(403);
  await expect(response?.json()).resolves.toEqual({
    error: "This gift image is not available.",
  });
});

test("permits image access after the day has been opened", () => {
  expect(getGiftImageAccessError("2026-12-01T00:00:00.000Z")).toBeNull();
});

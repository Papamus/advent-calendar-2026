import { expect, test } from "@playwright/test";
import type {
  CalendarDayListResponse,
  CalendarDaySummary,
  OpenedGiftDetails,
} from "../src/types/calendar";

const calendarResponse: CalendarDayListResponse = {
  days: [{ dayNumber: 1, status: "locked" }],
};

const openedGift: OpenedGiftDetails = {
  dayNumber: 1,
  status: "opened",
  title: "Ciepły początek",
  description: "Przykładowy opis prezentu.",
  imageUrl: "/api/gifts/1/image",
};

const invalidLockedDay = {
  dayNumber: 1,
  status: "locked",
  // @ts-expect-error Gift details must not be part of a calendar summary.
  description: "Nie powinien być widoczny na liście.",
} satisfies CalendarDaySummary;

void [calendarResponse, openedGift, invalidLockedDay];

test("calendar page starts and renders all 24 windows", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Kalendarz Adwentowy" }),
  ).toBeVisible();
  await expect(page.getByTestId("calendar-day")).toHaveCount(24);
});

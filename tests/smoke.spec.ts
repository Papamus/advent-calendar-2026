import { expect, test } from "@playwright/test";
import type {
  CalendarDayListResponse,
  CalendarDaySummary,
  OpenedGiftDetails,
} from "../src/types/calendar";

const calendarResponse: CalendarDayListResponse = [
  { dayNumber: 1, status: "locked" },
];

const openedGift: OpenedGiftDetails = {
  dayNumber: 1,
  status: "opened",
  title: "Ciepły początek",
  description: "Przykładowy opis prezentu.",
  imageUrl: "/api/gifts/1/image",
  openedAt: "2026-12-01T00:00:00.000Z",
};

const invalidLockedDay = {
  dayNumber: 1,
  status: "locked",
  // @ts-expect-error Gift details must not be part of a calendar summary.
  description: "Nie powinien być widoczny na liście.",
} satisfies CalendarDaySummary;

void [calendarResponse, openedGift, invalidLockedDay];

test("unauthenticated visitors see the sign-in form", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Otwórz drzwi do grudniowej magii" }),
  ).toBeVisible();
  await expect(page.getByLabel("Adres e-mail")).toBeVisible();
});

test("calendar and image APIs reject requests without a session", async ({
  request,
}) => {
  const calendarResponse = await request.get("/api/calendar");
  const imageResponse = await request.get("/api/gifts/1/image");
  const openResponse = await request.post("/api/calendar/1/open");

  expect(calendarResponse.status()).toBe(401);
  expect(imageResponse.status()).toBe(401);
  expect(openResponse.status()).toBe(401);
});

test("cron endpoint rejects requests without its bearer secret", async ({
  request,
}) => {
  const response = await request.get("/api/cron/notifications");

  expect(response.status()).toBe(401);
});

test("magic-link requests for an ineligible address stay neutral", async ({
  request,
}) => {
  const response = await request.post("/api/auth/request-link", {
    data: { email: "" },
  });

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({
    message: "If the address is eligible, a sign-in link has been sent.",
  });
});

test("magic-link verification rejects malformed tokens", async ({ request }) => {
  const response = await request.post("/api/auth/verify", {
    data: { token: "invalid" },
  });

  expect(response.status()).toBe(401);
});

test("logout clears the session cookie with strict, HTTP-only attributes", async ({
  request,
}) => {
  const response = await request.post("/api/auth/logout");
  const setCookie = response.headers()["set-cookie"] ?? "";

  expect(response.status()).toBe(200);
  expect(setCookie).toContain("HttpOnly");
  expect(setCookie).toMatch(/SameSite=Strict/i);
  expect(setCookie).toContain("Path=/");
  expect(setCookie).toContain("Max-Age=0");
});

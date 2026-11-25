import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { CalendarDayListResponse } from "../src/types/calendar";

function createCalendar(
  overrides: Partial<Record<number, "locked" | "ready" | "opened">> = {},
): CalendarDayListResponse {
  return Array.from({ length: 24 }, (_, index) => {
    const dayNumber = index + 1;
    return {
      dayNumber,
      status: overrides[dayNumber] ?? "locked",
    };
  });
}

async function mockCalendar(
  page: Page,
  days: CalendarDayListResponse,
) {
  await page.route("**/api/calendar", (route) =>
    route.fulfill({ status: 200, json: days }),
  );
}

test("shows the neutral Magic Link confirmation after sign-in request", async ({
  page,
}) => {
  await page.route("**/api/calendar", (route) =>
    route.fulfill({ status: 401, json: { error: "Unauthorized" } }),
  );
  await page.route("**/api/auth/request-link", (route) =>
    route.fulfill({
      status: 200,
      json: {
        message: "If the address is eligible, a sign-in link has been sent.",
      },
    }),
  );

  await page.goto("/");
  await page.getByLabel("Adres e-mail").fill("guest@example.com");
  await page.getByRole("button", { name: "Wyślij link do logowania" }).click();

  await expect(
    page.getByRole("status").filter({
      hasText: "Jeśli adres jest uprawniony, link do logowania został wysłany.",
    }),
  ).toBeVisible();
});

test("renders 24 status-driven windows after an authenticated calendar response", async ({
  page,
}) => {
  const days = createCalendar({ 1: "ready", 2: "opened" });
  await mockCalendar(page, days);

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Kalendarz Adwentowy" }),
  ).toBeVisible();
  await expect(page.getByTestId("calendar-day")).toHaveCount(24);
  await expect(
    page.getByRole("button", { name: "Dzień 1, dostępne do otwarcia" }),
  ).toHaveAttribute("data-day-status", "ready");
  await expect(
    page.getByRole("button", { name: "Dzień 2, otwarte" }),
  ).toHaveAttribute("data-day-status", "opened");
});

test("opens a ready day, animates its door, and reveals the protected gift", async ({
  page,
}) => {
  await mockCalendar(page, createCalendar({ 1: "ready" }));
  await page.route("**/api/calendar/1/open", (route) =>
    route.fulfill({
      status: 200,
      json: {
        dayNumber: 1,
        status: "opened",
        title: "Ciepły początek",
        description: "Chwila tylko dla Ciebie.",
        imageUrl: "/api/gifts/1/image",
        openedAt: "2026-12-01T00:00:00.000Z",
      },
    }),
  );
  await page.route("**/api/gifts/1/image", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320"><rect width="240" height="320" fill="#0B1D16"/></svg>',
    }),
  );

  await page.goto("/");
  await expect(page.getByTestId("calendar-day")).toHaveCount(24);
  await page
    .getByRole("button", { name: "Dzień 1, dostępne do otwarcia" })
    .click();

  await expect(
    page.getByRole("button", { name: "Dzień 1, otwarte" }),
  ).toHaveAttribute("data-day-status", "opened");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ciepły początek" }),
  ).toBeVisible();
  await expect(page.getByText("Chwila tylko dla Ciebie.")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Ilustracja prezentu: Ciepły początek" }),
  ).toHaveClass(/gift-modal-image--loaded/);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("locked days show a message and never call the open endpoint", async ({
  page,
}) => {
  let openRequests = 0;
  await mockCalendar(page, createCalendar());
  await page.route("**/api/calendar/**/open", async (route) => {
    openRequests += 1;
    await route.fulfill({ status: 403, json: { error: "Forbidden" } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Dzień 24, zamknięte" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Okienko 24 otworzy się dopiero w swoim dniu grudnia.",
  );
  expect(openRequests).toBe(0);
});

test("keeps all 24 calendar buttons usable on mobile-sized screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCalendar(page, createCalendar({ 1: "ready" }));

  await page.goto("/");

  await expect(page.getByTestId("calendar-day")).toHaveCount(24);
  await expect(
    page.getByRole("button", { name: "Dzień 24, zamknięte" }),
  ).toBeInViewport();
});

test("logs out and returns to the sign-in form", async ({ page }) => {
  await mockCalendar(page, createCalendar({ 1: "ready" }));
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 200, json: { authenticated: false } }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Wyloguj się" }).click();

  await expect(
    page.getByRole("heading", { name: "Otwórz drzwi do grudniowej magii" }),
  ).toBeVisible();
});

test("automatically verifies a Magic Link before returning home", async ({
  page,
}) => {
  let verifyRequests = 0;
  await page.route("**/api/auth/verify", async (route) => {
    verifyRequests += 1;
    await route.fulfill({ status: 200, json: { authenticated: true } });
  });
  await page.route("**/api/calendar", (route) =>
    route.fulfill({ status: 401, json: { error: "Unauthorized" } }),
  );

  await page.goto("/auth/verify?token=sample-magic-token");

  await expect(
    page.getByRole("heading", { name: "Link potwierdzony" }),
  ).toBeVisible();
  await expect(page).toHaveURL("/");
  expect(verifyRequests).toBe(1);
});

test("shows a clear error for a used or expired Magic Link", async ({ page }) => {
  await page.route("**/api/auth/verify", (route) =>
    route.fulfill({
      status: 401,
      json: { error: "Invalid or expired sign-in link." },
    }),
  );

  await page.goto("/auth/verify?token=expired-token");

  await expect(
    page.getByRole("heading", { name: "Link jest nieaktualny" }),
  ).toBeVisible();
  await expect(
    page.locator(".form-message--error"),
  ).toContainText(
    "Ten link wygasł albo został już użyty.",
  );
});

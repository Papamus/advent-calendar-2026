import { timingSafeEqual } from "node:crypto";
import { getWarsawCalendarTime } from "@/lib/calendar/date-gate";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { getAppUrl, getRequiredEnv } from "@/lib/env";
import { internalServerError, jsonResponse } from "@/lib/http/responses";
import { ensureCalendarSeeded, getSupabaseServerClient } from "@/lib/supabase/server";

type NotificationType = "unlocked" | "reminder";

type NotificationSendResult =
  | { sent: boolean }
  | { error: Response };

function isAuthorizedCronRequest(authorizationHeader: string | null): boolean {
  const expected = Buffer.from(`Bearer ${getRequiredEnv("CRON_SECRET")}`);
  const received = Buffer.from(authorizationHeader ?? "");

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

function getApplicationUrl(): string {
  return getAppUrl("/").toString();
}

async function hasNotificationBeenSent(
  dayNumber: number,
  notificationType: NotificationType,
): Promise<{ sent: boolean; error: Error | null }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("day_number", dayNumber)
    .eq("notification_type", notificationType)
    .maybeSingle();

  return { sent: data !== null, error };
}

async function sendCalendarNotification(
  dayNumber: number,
  notificationType: NotificationType,
  calendarYear: number,
): Promise<NotificationSendResult> {
  const existing = await hasNotificationBeenSent(dayNumber, notificationType);
  if (existing.error) {
    return {
      error: internalServerError(
        "Failed to check notification history.",
        existing.error,
      ),
    };
  }
  if (existing.sent) {
    return { sent: false };
  }

  const calendarUrl = getApplicationUrl();
  const isReminder = notificationType === "reminder";
  const subject = isReminder
    ? `Twoje okienko ${dayNumber} wciąż czeka`
    : `Otworzyło się okienko ${dayNumber}`;
  const text = isReminder
    ? `Okienko ${dayNumber} czeka na Ciebie: ${calendarUrl}`
    : `Nowe okienko ${dayNumber} jest już dostępne: ${calendarUrl}`;
  const html = `<p>${isReminder ? "Twoje dzisiejsze okienko wciąż czeka." : "Otworzyło się nowe okienko."}</p><p><a href="${calendarUrl}">Otwórz Kalendarz Adwentowy</a></p>`;

  try {
    await sendTransactionalEmail({
      to: getRequiredEnv("ALLOWED_RECIPIENT_EMAIL"),
      subject,
      text,
      html,
      idempotencyKey: `advent-${calendarYear}-${dayNumber}-${notificationType}`,
    });
  } catch (error) {
    return {
      error: internalServerError(
        "Failed to send a calendar notification.",
        error,
      ),
    };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("notification_logs").insert({
    day_number: dayNumber,
    notification_type: notificationType,
  });

  if (error) {
    if (error.code === "23505") {
      return { sent: false };
    }

    return { error: internalServerError("Failed to log a sent notification.", error) };
  }

  return { sent: true };
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const localTime = getWarsawCalendarTime();
  if (localTime.month !== 12 || localTime.day < 1 || localTime.day > 24) {
    return jsonResponse({ sent: false, reason: "outside-advent-calendar" });
  }

  let notificationType: NotificationType;
  if (localTime.hour === 0) {
    notificationType = "unlocked";
  } else if (localTime.hour === 17) {
    notificationType = "reminder";
  } else {
    return jsonResponse({ sent: false, reason: "outside-notification-window" });
  }

  await ensureCalendarSeeded();
  const dayNumber = localTime.day;

  if (notificationType === "reminder") {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("advent_days")
      .select("opened_at")
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (error) {
      return internalServerError("Failed to check whether today's gift was opened.", error);
    }

    if (!data || data.opened_at !== null) {
      return jsonResponse({ sent: false, reason: "gift-already-opened" });
    }
  }

  const result = await sendCalendarNotification(
    dayNumber,
    notificationType,
    localTime.year,
  );
  if ("error" in result) {
    return result.error;
  }

  return jsonResponse({
    sent: result.sent,
    dayNumber,
    notificationType,
    ...(result.sent ? {} : { reason: "already-sent" }),
  });
}

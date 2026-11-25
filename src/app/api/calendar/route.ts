import { getCalendarDayStatus, CALENDAR_DAY_COUNT } from "@/lib/calendar/date-gate";
import { verifySession } from "@/lib/auth/session";
import { internalServerError, jsonResponse } from "@/lib/http/responses";
import {
  ensureCalendarSeeded,
  getSupabaseServerClient,
} from "@/lib/supabase/server";
import type {
  CalendarDayListResponse,
  CalendarDaySummary,
} from "@/types/calendar";

export async function GET(): Promise<Response> {
  const session = await verifySession();
  if (!session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  await ensureCalendarSeeded();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("advent_days")
    .select("day_number, opened_at")
    .order("day_number");

  if (error) {
    return internalServerError("Failed to load calendar days.", error);
  }

  const rows = new Map(
    (data ?? []).map((row) => [row.day_number, row.opened_at]),
  );
  const now = new Date();
  const days: CalendarDayListResponse = Array.from(
    { length: CALENDAR_DAY_COUNT },
    (_, index): CalendarDaySummary => {
      const dayNumber = index + 1;
      return {
        dayNumber,
        status: getCalendarDayStatus(
          dayNumber,
          rows.get(dayNumber) ?? null,
          now,
        ),
      };
    },
  );

  return jsonResponse(days);
}

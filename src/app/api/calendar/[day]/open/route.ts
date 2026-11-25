import { isCalendarDayUnlocked } from "@/lib/calendar/date-gate";
import type { OpenedGiftDetails } from "@/types/calendar";
import { verifySession } from "@/lib/auth/session";
import { internalServerError, jsonResponse } from "@/lib/http/responses";
import { ensureCalendarSeeded, getSupabaseServerClient } from "@/lib/supabase/server";

interface OpenDayContext {
  params: Promise<{ day: string }>;
}

function parseDayNumber(day: string): number | null {
  if (!/^(?:[1-9]|1\d|2[0-4])$/.test(day)) {
    return null;
  }

  return Number(day);
}

export async function POST(
  _request: Request,
  context: OpenDayContext,
): Promise<Response> {
  const session = await verifySession();
  if (!session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { day } = await context.params;
  const dayNumber = parseDayNumber(day);
  if (dayNumber === null) {
    return jsonResponse({ error: "Invalid calendar day." }, 400);
  }

  await ensureCalendarSeeded();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("advent_days")
    .select("day_number, title, description, image_storage_path, opened_at")
    .eq("day_number", dayNumber)
    .maybeSingle();

  if (error) {
    return internalServerError("Failed to load the requested gift.", error);
  }
  if (!data) {
    return jsonResponse({ error: "Gift not found." }, 404);
  }

  if (data.opened_at === null && !isCalendarDayUnlocked(dayNumber)) {
    return jsonResponse({ error: "This gift is not available yet." }, 403);
  }

  let openedAt = data.opened_at;
  if (openedAt === null) {
    const { data: updated, error: updateError } = await supabase
      .rpc("mark_advent_day_opened", { p_day_number: dayNumber })
      .maybeSingle();

    if (updateError) {
      return internalServerError("Failed to mark the requested gift as opened.", updateError);
    }

    if (updated) {
      openedAt = updated.opened_at;
    }
  }

  if (openedAt === null) {
    return internalServerError(
      "Failed to confirm the opened state of the requested gift.",
      new Error(`Gift day ${dayNumber} has no opened_at timestamp after update.`),
    );
  }

  const response: OpenedGiftDetails = {
    dayNumber: data.day_number,
    status: "opened",
    title: data.title,
    description: data.description,
    imageUrl: `/api/gifts/${dayNumber}/image`,
    openedAt,
  };

  return jsonResponse(response);
}

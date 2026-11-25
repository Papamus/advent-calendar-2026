import { giftsSeed } from "@/data/gifts-seed";
import { isCalendarDayUnlocked } from "@/lib/calendar/date-gate";
import { verifySession } from "@/lib/auth/session";
import { internalServerError, jsonResponse } from "@/lib/http/responses";
import { ensureCalendarSeeded, getSupabaseServerClient } from "@/lib/supabase/server";

interface GiftImageContext {
  params: Promise<{ day: string }>;
}

function parseDayNumber(day: string): number | null {
  if (!/^(?:[1-9]|1\d|2[0-4])$/.test(day)) {
    return null;
  }

  return Number(day);
}

function imageHeaders(contentType: string): Headers {
  return new Headers({
    "Cache-Control": "private, no-store",
    "Content-Type": contentType,
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "X-Content-Type-Options": "nosniff",
  });
}

export async function GET(
  _request: Request,
  context: GiftImageContext,
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
    .select("image_storage_path, opened_at")
    .eq("day_number", dayNumber)
    .maybeSingle();

  if (error) {
    return internalServerError("Failed to load the requested gift image.", error);
  }
  if (!data) {
    return jsonResponse({ error: "Gift not found." }, 404);
  }

  if (data.opened_at === null && !isCalendarDayUnlocked(dayNumber)) {
    return jsonResponse({ error: "This gift image is not available." }, 403);
  }

  const { data: file, error: storageError } = await supabase.storage
    .from("gifts")
    .download(data.image_storage_path);

  if (storageError && storageError.statusCode !== "404") {
    return internalServerError("Failed to download the requested gift image.", storageError);
  }

  if (file) {
    return new Response(file, {
      headers: imageHeaders(file.type || "application/octet-stream"),
    });
  }

  const placeholder = giftsSeed.find((seed) => seed.dayNumber === dayNumber);
  if (!placeholder) {
    return internalServerError(
      "Missing gift placeholder.",
      new Error(`No image placeholder exists for day ${dayNumber}.`),
    );
  }

  return new Response(placeholder.imageSvg, {
    headers: imageHeaders("image/svg+xml; charset=utf-8"),
  });
}

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { giftsSeed } from "@/data/gifts-seed";
import { getRequiredEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function getSupabaseServerClient() {
  return createClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

let seedPromise: Promise<void> | undefined;

async function seedCalendar(): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("advent_days").upsert(
    giftsSeed.map(({ dayNumber, title, description }) => ({
      day_number: dayNumber,
      title,
      description,
      image_storage_path: `day-${dayNumber.toString().padStart(2, "0")}.svg`,
    })),
    { onConflict: "day_number", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(`Failed to seed advent calendar: ${error.message}`);
  }
}

export async function ensureCalendarSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedCalendar();
  }

  try {
    await seedPromise;
  } catch (error) {
    seedPromise = undefined;
    throw error;
  }
}

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/session";
import { getRequiredEnv } from "@/lib/env";
import { internalServerError, jsonResponse } from "@/lib/http/responses";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const invalidTokenResponse = { error: "Invalid or expired sign-in link." };
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

function isTokenRequest(value: unknown): value is { token: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string" &&
    tokenPattern.test(value.token)
  );
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (!isTokenRequest(body)) {
    return jsonResponse(invalidTokenResponse, 401);
  }

  const email = getRequiredEnv("ALLOWED_RECIPIENT_EMAIL").trim().toLowerCase();
  const sessionToken = await createSessionToken(email);
  const tokenHash = createHash("sha256").update(body.token).digest("hex");
  const now = new Date().toISOString();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("magic_tokens")
    .update({ used_at: now })
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();

  if (error) {
    return internalServerError("Failed to verify a magic-link token.", error);
  }

  if (!data) {
    return jsonResponse(invalidTokenResponse, 401);
  }

  const response = NextResponse.json(
    { authenticated: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return response;
}

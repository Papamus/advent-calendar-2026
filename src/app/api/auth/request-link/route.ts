import { randomBytes, createHash } from "node:crypto";
import { getAppUrl, getRequiredEnv } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { internalServerError, jsonResponse } from "@/lib/http/responses";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const neutralResponse = {
  message: "If the address is eligible, a sign-in link has been sent.",
};

function isEmailRequest(value: unknown): value is { email: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (!isEmailRequest(body)) {
    return jsonResponse(neutralResponse);
  }

  const recipient = body.email.trim().toLowerCase();
  const allowedRecipient = getRequiredEnv("ALLOWED_RECIPIENT_EMAIL")
    .trim()
    .toLowerCase();

  if (!recipient || recipient !== allowedRecipient) {
    return jsonResponse(neutralResponse);
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("magic_tokens").insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    return internalServerError("Failed to store a magic-link token.", error);
  }

  const appUrl = getAppUrl("/auth/verify");
  appUrl.hash = new URLSearchParams({ token }).toString();
  const verificationUrl = appUrl.toString();

  try {
    await sendTransactionalEmail({
      to: allowedRecipient,
      subject: "Twój link do Kalendarza Adwentowego",
      text: `Otwórz ten link, a następnie potwierdź logowanie: ${verificationUrl}`,
      html: `<p>Otrzymasz dostęp po potwierdzeniu logowania.</p><p><a href="${verificationUrl}">Potwierdź logowanie</a></p>`,
    });
  } catch (error) {
    return internalServerError("Failed to send a magic-link email.", error);
  }

  return jsonResponse(neutralResponse);
}

import "server-only";

import { cookies } from "next/headers";
import { errors, jwtVerify, SignJWT } from "jose";
import { getRequiredEnv } from "@/lib/env";

export const SESSION_COOKIE_NAME = "advent_session";
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;

const SESSION_ISSUER = "advent-calendar-2026";
const SESSION_AUDIENCE = "advent-calendar-user";

function getSessionSecret(): Uint8Array {
  const secret = getRequiredEnv("AUTH_SECRET");
  const encodedSecret = new TextEncoder().encode(secret);

  if (encodedSecret.byteLength < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 bytes.");
  }

  return encodedSecret;
}

export async function createSessionToken(email: string): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(email)
    .setIssuedAt(nowInSeconds)
    .setExpirationTime(nowInSeconds + SESSION_DURATION_SECONDS)
    .sign(getSessionSecret());
}

export interface VerifiedSession {
  email: string;
}

export async function verifySession(): Promise<VerifiedSession | null> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }

  const allowedEmail = getRequiredEnv("ALLOWED_RECIPIENT_EMAIL")
    .trim()
    .toLowerCase();

  try {
    const { payload } = await jwtVerify(sessionCookie, getSessionSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (
      typeof payload.email !== "string" ||
      payload.email.toLowerCase() !== allowedEmail ||
      payload.sub?.toLowerCase() !== allowedEmail
    ) {
      return null;
    }

    return { email: allowedEmail };
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return null;
    }

    throw error;
  }
}

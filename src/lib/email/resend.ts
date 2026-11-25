import "server-only";

import { Resend } from "resend";
import { getRequiredEnv } from "@/lib/env";

export interface TransactionalEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
}

export async function sendTransactionalEmail(
  message: TransactionalEmail,
): Promise<void> {
  const { idempotencyKey, ...email } = message;
  const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
  const { error } = await resend.emails.send(
    {
      from: getRequiredEnv("RESEND_FROM_EMAIL"),
      ...email,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) {
    throw new Error(`Resend email delivery failed: ${error.message}`);
  }
}

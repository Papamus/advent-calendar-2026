import { jsonResponse } from "@/lib/http/responses";

export function getGiftImageAccessError(openedAt: string | null): Response | null {
  if (openedAt !== null) {
    return null;
  }

  return jsonResponse({ error: "This gift image is not available." }, 403);
}

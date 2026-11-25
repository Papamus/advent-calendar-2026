export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "private, no-store");

  return Response.json(body, { status, headers: responseHeaders });
}

export function internalServerError(context: string, error: unknown): Response {
  console.error(context, error);
  return jsonResponse({ error: "Internal server error" }, 500);
}

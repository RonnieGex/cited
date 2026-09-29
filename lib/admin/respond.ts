import type { AdminGuard } from "./guard.ts";

export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function guardResponse(guarded: Exclude<AdminGuard, { status: "ok" }>): Response {
  if (guarded.status === "unconfigured") {
    return json(
      {
        status: "unconfigured",
        error: `the panel needs ${guarded.missing.join(" and ")}; fill the variable in the environment of the server, never with a value in the repository`,
      },
      503,
    );
  }

  if (guarded.status === "forbidden") {
    return json(
      { status: "forbidden", error: "the request does not come from the panel" },
      403,
    );
  }

  return json({ status: "unauthorized", error: "the panel needs a session" }, 401);
}

export async function bodyOf(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json") === false) {
    return null;
  }

  try {
    const parsed: unknown = await request.json();

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

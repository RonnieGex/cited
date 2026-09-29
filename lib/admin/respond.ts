import { OWNER_WORDS, type AdminGuard } from "./guard.ts";

export const PANEL_NOT_CONFIGURED = "panel_not_configured";
export const ADMIN_PASSWORD_TOO_SHORT = "admin_password_too_short";

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

// An installation that is not finished is not a detail of whoever installs: the route answers the code and the words of
// the owner, and the names of the variables that are missing go to the log of the server (`lib/admin/guard.ts`) and to
// the page "For the installer". They are never part of a response of `/api/admin/*`.
export function guardResponse(guarded: Exclude<AdminGuard, { status: "ok" }>): Response {
  if (guarded.status === "unconfigured") {
    return json(
      {
        status: PANEL_NOT_CONFIGURED,
        reason: PANEL_NOT_CONFIGURED,
        error: OWNER_WORDS.unconfigured,
      },
      503,
    );
  }

  if (guarded.status === "short-password") {
    return json(
      {
        status: ADMIN_PASSWORD_TOO_SHORT,
        reason: ADMIN_PASSWORD_TOO_SHORT,
        error: OWNER_WORDS.shortPassword,
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

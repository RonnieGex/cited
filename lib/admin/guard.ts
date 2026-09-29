import { SESSION_COOKIE, adminConfig, cookieFrom, verifySession, type AdminEnvironment } from "./session.ts";

export type AdminGuard =
  | { status: "ok" }
  | { status: "unconfigured"; missing: string[] }
  | { status: "unauthorized" }
  | { status: "forbidden" };

const mutations = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function missingAdminVariables(environment: AdminEnvironment): string[] {
  return adminConfig(environment).missing;
}

function ownOrigins(request: Request): string[] {
  const url = new URL(request.url);
  const origins = new Set<string>([url.origin]);
  const host = request.headers.get("host")?.trim() ?? "";

  if (host.length > 0) {
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "";
    const protocol = forwarded.length > 0 ? forwarded : url.protocol.replace(":", "");

    origins.add(`${protocol}://${host}`);
  }

  return [...origins];
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  return origin !== null && ownOrigins(request).includes(origin);
}

export function guardSession(
  token: string | undefined,
  environment: AdminEnvironment,
  now: Date = new Date(),
): AdminGuard {
  const config = adminConfig(environment);

  if (config.missing.length > 0) {
    return { status: "unconfigured", missing: config.missing };
  }

  return verifySession(config.secret, token, now) ? { status: "ok" } : { status: "unauthorized" };
}

export function guardRequest(
  request: Request,
  environment: AdminEnvironment,
  now: Date = new Date(),
): AdminGuard {
  const guarded = guardSession(
    cookieFrom(request.headers.get("cookie"), SESSION_COOKIE),
    environment,
    now,
  );

  if (guarded.status !== "ok") {
    return guarded;
  }

  if (mutations.has(request.method.toUpperCase()) && sameOrigin(request) === false) {
    return { status: "forbidden" };
  }

  return { status: "ok" };
}

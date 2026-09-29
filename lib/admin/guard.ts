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

  if (mutations.has(request.method.toUpperCase())) {
    const origin = request.headers.get("origin");

    if (origin === null || origin !== new URL(request.url).origin) {
      return { status: "forbidden" };
    }
  }

  return { status: "ok" };
}

import {
  ADMIN_PASSWORD_MIN_LENGTH,
  SESSION_COOKIE,
  adminConfig,
  cookieFrom,
  verifySession,
  type AdminConfig,
  type AdminEnvironment,
} from "./session.ts";

export type AdminBlock =
  | { status: "unconfigured"; missing: string[] }
  | { status: "short-password"; minimum: number };

export type AdminGuard =
  | { status: "ok" }
  | AdminBlock
  | { status: "unauthorized" }
  | { status: "forbidden" };

const mutations = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function missingAdminVariables(environment: AdminEnvironment): string[] {
  return adminConfig(environment).missing;
}

function blockOf(config: AdminConfig): AdminBlock | null {
  if (config.missing.length > 0) {
    return { status: "unconfigured", missing: config.missing };
  }

  if (config.shortPassword) {
    return { status: "short-password", minimum: ADMIN_PASSWORD_MIN_LENGTH };
  }

  return null;
}

export function adminBlock(environment: AdminEnvironment): AdminBlock | null {
  return blockOf(adminConfig(environment));
}

export function adminProblem(environment: AdminEnvironment): string | null {
  const block = adminBlock(environment);

  if (block === null) {
    return null;
  }

  if (block.status === "unconfigured") {
    return `the panel needs ${block.missing.join(" and ")}: fill the variable in the environment of the server and start it again`;
  }

  return `ADMIN_PASSWORD has fewer than ${block.minimum} characters: choose a longer password in the environment of the server and start it again`;
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
  const block = blockOf(config);

  if (block !== null) {
    return block;
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

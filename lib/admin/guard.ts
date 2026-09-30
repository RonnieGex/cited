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

// The words of the owner for every answer and every page that is not "For the installer": the name of a variable of the
// environment is a diagnostic of whoever installs, so it is written once in the log of the server and it stays on that
// page. Everything else reads the sentence.
export const OWNER_WORDS = {
  unconfigured: "the panel cannot answer yet: whoever installs Cited has to finish the installation on the server",
  shortPassword:
    "the panel cannot answer yet: the password of the panel is too short, and whoever installs Cited has to set a longer one on the server",
} as const;

// One line per state, not one per request: the guard runs on every call of the panel and the log of a server that is
// not configured yet does not need the same sentence a thousand times.
const written = new Set<string>();

function writeOnce(line: string): void {
  if (written.has(line)) {
    return;
  }

  written.add(line);
  console.error(line);
}

export function missingAdminVariables(environment: AdminEnvironment): string[] {
  return adminConfig(environment).missing;
}

function blockOf(config: AdminConfig): AdminBlock | null {
  if (config.missing.length > 0) {
    const block: AdminBlock = { status: "unconfigured", missing: config.missing };

    writeOnce(`the panel is not configured: the environment of the server is missing ${block.missing.join(", ")}`);

    return block;
  }

  if (config.shortPassword) {
    const block: AdminBlock = { status: "short-password", minimum: ADMIN_PASSWORD_MIN_LENGTH };

    writeOnce(`the panel is not configured: ADMIN_PASSWORD has fewer than ${block.minimum} characters`);

    return block;
  }

  return null;
}

export function adminBlock(environment: AdminEnvironment): AdminBlock | null {
  return blockOf(adminConfig(environment));
}

export type AdminProblemOptions = {
  // Only the page "For the installer" (`/admin`) may name the variables it has to receive.
  installerPage?: boolean;
};

export function adminProblem(
  environment: AdminEnvironment,
  options: AdminProblemOptions = {},
): string | null {
  const block = adminBlock(environment);

  if (block === null) {
    return null;
  }

  const installer = options.installerPage === true;

  if (block.status === "unconfigured") {
    return installer
      ? `the panel needs ${block.missing.join(" and ")}: fill the variable in the environment of the server and start it again`
      : OWNER_WORDS.unconfigured;
  }

  return installer
    ? `ADMIN_PASSWORD has fewer than ${block.minimum} characters: choose a longer password in the environment of the server and start it again`
    : OWNER_WORDS.shortPassword;
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

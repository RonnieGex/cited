import { clearFailures, lockState, registerFailure } from "../../../../lib/admin/lockout.ts";
import { bodyOf, guardResponse, json } from "../../../../lib/admin/respond.ts";
import {
  adminConfig,
  isSecureHost,
  passwordMatches,
  sessionCookie,
  sessionToken,
} from "../../../../lib/admin/session.ts";
import { clientIp, hashIp } from "../../../../lib/guards/ip.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";

export const runtime = "nodejs";

function refused(origin: string | null, url: string): boolean {
  return origin === null || origin !== new URL(url).origin;
}

export async function POST(request: Request): Promise<Response> {
  const environment = process.env;
  const config = adminConfig(environment);

  if (config.missing.length > 0) {
    return guardResponse({ status: "unconfigured", missing: config.missing });
  }

  if (refused(request.headers.get("origin"), request.url)) {
    return guardResponse({ status: "forbidden" });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json") === false) {
    return json({ status: "invalid", error: "the request must carry a JSON body" }, 415);
  }

  const body = await bodyOf(request);
  const password = body?.["password"];

  if (typeof password !== "string") {
    return json({ status: "invalid", error: 'the body must be {"password": string}' }, 400);
  }

  const now = new Date();
  const store = await sharedStore(environment);
  const ipHash = hashIp(clientIp(request, environment), config.secret);
  const lock = await lockState(store, ipHash, now);

  if (lock.locked) {
    return json(
      {
        status: "locked",
        error: `too many failed attempts from this address; try again in ${lock.retryAfterSeconds} seconds`,
      },
      429,
      { "retry-after": String(lock.retryAfterSeconds) },
    );
  }

  if (passwordMatches(config.password, password) === false) {
    await registerFailure(store, ipHash, now);

    return json({ status: "invalid", error: "the password is not the one of the panel" }, 401);
  }

  await clearFailures(store, ipHash);

  const secure = isSecureHost(new URL(request.url).host);

  return json({ status: "ok" }, 200, {
    "set-cookie": sessionCookie(sessionToken(config.secret, now), secure),
  });
}

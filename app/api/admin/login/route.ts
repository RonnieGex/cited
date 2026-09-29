import {
  UNKNOWN_ADDRESS_DELAY_MS,
  clearFailures,
  lockState,
  registerFailure,
} from "../../../../lib/admin/lockout.ts";
import { adminBlock, sameOrigin } from "../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../lib/admin/respond.ts";
import {
  adminConfig,
  isSecureHost,
  passwordMatches,
  sessionCookie,
  sessionToken,
} from "../../../../lib/admin/session.ts";
import { clientAddress, hashIp } from "../../../../lib/guards/ip.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";

export const runtime = "nodejs";

const invalidPassword = { status: "invalid", error: "the password is not the one of the panel" };

async function waitBeforeAnswering(startedAt: number): Promise<void> {
  let remaining = UNKNOWN_ADDRESS_DELAY_MS - (Date.now() - startedAt);

  while (remaining > 0) {
    await new Promise((wake) => setTimeout(wake, remaining));

    remaining = UNKNOWN_ADDRESS_DELAY_MS - (Date.now() - startedAt);
  }
}

function signedIn(request: Request, secret: string, now: Date): Response {
  const secure = isSecureHost(new URL(request.url).host);

  return json({ status: "ok" }, 200, {
    "set-cookie": sessionCookie(sessionToken(secret, now), secure),
  });
}

export async function POST(request: Request): Promise<Response> {
  const environment = process.env;
  const startedAt = Date.now();
  const block = adminBlock(environment);

  if (block !== null) {
    return guardResponse(block);
  }

  if (sameOrigin(request) === false) {
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
  const config = adminConfig(environment);
  const address = clientAddress(request, environment);

  if (address === null) {
    if (passwordMatches(config.password, password) === false) {
      await waitBeforeAnswering(startedAt);

      return json(invalidPassword, 401);
    }

    return signedIn(request, config.secret, now);
  }

  const store = await sharedStore(environment);
  const ipHash = hashIp(address, config.secret);
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

    return json(invalidPassword, 401);
  }

  await clearFailures(store, ipHash);

  return signedIn(request, config.secret, now);
}

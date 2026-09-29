import type { Store } from "../store/index.ts";

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MINUTES = 15;

const windowMs = LOGIN_WINDOW_MINUTES * 60 * 1000;

export type LockState = {
  locked: boolean;
  retryAfterSeconds: number;
  failures: number;
};

type Attempts = { windowStart: string; count: number };

function windowEnd(windowStart: string): number {
  return new Date(windowStart).getTime() + windowMs;
}

async function active(
  store: Store,
  ipHash: string,
  now: Date,
): Promise<Attempts | null> {
  const since = new Date(now.getTime() - windowMs).toISOString();
  const found = await store.loginAttempts(ipHash, since);

  if (found === null) {
    return null;
  }

  return windowEnd(found.windowStart) > now.getTime() ? found : null;
}

function stateOf(now: Date, failures: number, windowStart: string | null): LockState {
  if (failures < LOGIN_MAX_FAILURES || windowStart === null) {
    return { locked: false, retryAfterSeconds: 0, failures };
  }

  return {
    locked: true,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((windowEnd(windowStart) - now.getTime()) / 1000),
    ),
    failures,
  };
}

export async function lockState(store: Store, ipHash: string, now: Date): Promise<LockState> {
  const found = await active(store, ipHash, now);

  return found === null ? stateOf(now, 0, null) : stateOf(now, found.count, found.windowStart);
}

export async function registerFailure(
  store: Store,
  ipHash: string,
  now: Date,
): Promise<LockState> {
  await store.deleteLoginAttemptsBefore(
    new Date(now.getTime() - windowMs).toISOString(),
  );

  const found = await active(store, ipHash, now);
  const windowStart = found?.windowStart ?? now.toISOString();
  const count = await store.recordLoginFailure(ipHash, windowStart);

  return stateOf(now, count, windowStart);
}

export async function clearFailures(store: Store, ipHash: string): Promise<void> {
  await store.clearLoginFailures(ipHash);
}

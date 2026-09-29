import type { Store } from "../store/index.ts";
import { dayOf, daysBefore, hourWindowStart } from "./window.ts";

export const PURGE_INTERVAL_MS = 60 * 60 * 1000;

export type PurgeReport = {
  purged: boolean;
  conversations: number;
  windows: number;
  days: number;
  lastPurgeAt: number;
};

export function shouldPurge(lastPurgeAt: number | null, now: Date): boolean {
  return lastPurgeAt === null || now.getTime() - lastPurgeAt >= PURGE_INTERVAL_MS;
}

export async function purgeStore(
  store: Store,
  input: { now: Date; retentionDays: number; lastPurgeAt: number | null },
): Promise<PurgeReport> {
  if (shouldPurge(input.lastPurgeAt, input.now) === false) {
    return {
      purged: false,
      conversations: 0,
      windows: 0,
      days: 0,
      lastPurgeAt: input.lastPurgeAt ?? 0,
    };
  }

  const conversations = await store.deleteConversationsBefore(
    daysBefore(input.now, input.retentionDays),
  );
  const windows = await store.deleteRateLimitsBefore(hourWindowStart(input.now));
  const days = await store.deleteModelCallsBefore(dayOf(input.now));

  return { purged: true, conversations, windows, days, lastPurgeAt: input.now.getTime() };
}

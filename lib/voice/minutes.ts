/**
 * The daily cap of voice minutes (design decision 5): the counter lives in the store, one row per UTC day, and a
 * session reserves five minutes before it starts, whether or not the visitor uses them. The route that hands out a
 * signed URL is the only caller, so a browser can never start a session the day has no room for.
 *
 * A day starts only when its reserved total plus the reservation of the session stays within the limit. A limit below
 * the reservation therefore allows no session at all, and the room says which of the two cases refused it: the day is
 * spent, or the limit never fits a session. The store enforces both in one statement, which is what makes the answer
 * true even when two visitors arrive at once.
 */

import type { ChatEnvironment } from "../models/types.ts";
import type { Store } from "../store/index.ts";
import { VOICE_SESSION_MINUTES, voiceMinuteLimit } from "./config.ts";

export type SessionRefusal = "spent" | "below-session";

export type SessionRoom =
  | { ok: true; minutes: number }
  | { ok: false; limit: number; reason: SessionRefusal };

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export async function reserveSession(
  store: Store,
  input: { now?: Date; environment?: ChatEnvironment },
): Promise<SessionRoom> {
  const limit = voiceMinuteLimit(input.environment ?? process.env);
  const day = utcDay(input.now ?? new Date());

  if (limit < VOICE_SESSION_MINUTES) {
    return { ok: false, limit, reason: "below-session" };
  }

  const reserved = await store.reserveVoiceMinutes(day, VOICE_SESSION_MINUTES, limit);

  if (reserved === null) {
    return { ok: false, limit, reason: "spent" };
  }

  return { ok: true, minutes: reserved };
}

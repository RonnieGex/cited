/**
 * The Bearer of the server tool. The comparison is constant time, so a wrong secret cannot be found one character at
 * a time, and an installation that declares no secret refuses every call instead of accepting an empty one.
 */

import { timingSafeEqual } from "node:crypto";

export function bearerOf(header: string | null): string | null {
  if (header === null) {
    return null;
  }

  const prefix = "Bearer ";

  if (header.startsWith(prefix) === false) {
    return null;
  }

  return header.slice(prefix.length);
}

export function secretMatches(provided: string | null, expected: string): boolean {
  if (provided === null || expected.length === 0) {
    return false;
  }

  const left = Buffer.from(provided, "utf8");
  const right = Buffer.from(expected, "utf8");

  if (left.length !== right.length) {
    // A constant-time call over the same length keeps the length of the secret out of the timing as well.
    timingSafeEqual(right, right);

    return false;
  }

  return timingSafeEqual(left, right);
}

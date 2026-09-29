export function hourWindowStart(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()),
  ).toISOString();
}

export function nextHourStart(now: Date): Date {
  const start = new Date(hourWindowStart(now));

  return new Date(start.getTime() + 60 * 60 * 1000);
}

export function retryAfterSeconds(now: Date): number {
  return Math.max(1, Math.ceil((nextHourStart(now).getTime() - now.getTime()) / 1000));
}

export function dayOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function daysBefore(now: Date, days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

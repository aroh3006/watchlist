/**
 * Timezone-aware date helpers for activity/streak calculations.
 *
 * A watch event's `watchedAt` is stored as an absolute UTC instant. To decide
 * which *calendar day* it belongs to for a user, we must render it in that
 * user's configured timezone (default DEFAULT_TIMEZONE / "UTC") rather than
 * always using UTC or the server's local time.
 */

export function dateKeyInTimezone(date: Date, timeZone: string): string {
  // en-CA gives YYYY-MM-DD directly.
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function todayKeyInTimezone(timeZone: string): string {
  return dateKeyInTimezone(new Date(), timeZone);
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function keysBetween(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cursor = startKey;
  while (cursor <= endKey) {
    keys.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return keys;
}

export function daysAgoKey(days: number, timeZone: string): string {
  return addDaysToKey(todayKeyInTimezone(timeZone), -days);
}

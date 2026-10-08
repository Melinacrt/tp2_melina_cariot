import type { Booking } from "../store.js";

/** Un créneau libre sur une journée, bornes ISO 8601 UTC. */
export interface FreeSlot {
  startsAt: string;
  endsAt: string;
}

/** Résultat de calcul de disponibilités, sans exception. */
export type AvailabilityResult = { ok: true; value: FreeSlot[] } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Formate un timestamp ms en ISO 8601 UTC sans millisecondes. */
function toIsoNoMillis(ms: number): string {
  return new Date(ms).toISOString().replace(".000Z", "Z");
}

/** Calcule les créneaux libres d'une salle sur la journée demandée. */
export function getFreeSlotsForDay(bookings: Booking[], date: string): AvailabilityResult {
  if (!DATE_RE.test(date)) {
    return { ok: false, error: "date invalide, format attendu : YYYY-MM-DD" };
  }
  const dayStart = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(dayStart)) {
    return { ok: false, error: "date invalide, format attendu : YYYY-MM-DD" };
  }
  // Rejette les dates inexistantes type 2026-13-40 que Date.parse peut normaliser.
  if (toIsoNoMillis(dayStart).slice(0, 10) !== date) {
    return { ok: false, error: "date invalide, format attendu : YYYY-MM-DD" };
  }
  const dayEnd = dayStart + 24 * 3600 * 1000;

  const busy: Array<{ start: number; end: number }> = [];
  for (const b of bookings) {
    const s = Date.parse(b.startsAt);
    const e = Date.parse(b.endsAt);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) {
      continue;
    }
    if (e <= dayStart || s >= dayEnd) {
      continue;
    }
    busy.push({ start: Math.max(s, dayStart), end: Math.min(e, dayEnd) });
  }
  busy.sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const slot of busy) {
    const last = merged[merged.length - 1];
    if (last && slot.start <= last.end) {
      last.end = Math.max(last.end, slot.end);
    } else {
      merged.push({ ...slot });
    }
  }

  const free: FreeSlot[] = [];
  let cursor = dayStart;
  for (const slot of merged) {
    if (slot.start > cursor) {
      free.push({ startsAt: toIsoNoMillis(cursor), endsAt: toIsoNoMillis(slot.start) });
    }
    cursor = Math.max(cursor, slot.end);
  }
  if (cursor < dayEnd) {
    free.push({ startsAt: toIsoNoMillis(cursor), endsAt: toIsoNoMillis(dayEnd) });
  }

  return { ok: true, value: free };
}

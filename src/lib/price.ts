import type { Room } from "../store.js";

const WEEKEND_SURCHARGE = 20;

/** Vrai si la date (ISO 8601 UTC) tombe un samedi ou un dimanche. */
export function isWeekend(startsAt: string): boolean {
  const day = new Date(startsAt).getUTCDay();
  return day === 0 || day === 6;
}

/** Nombre d'heures (fractionnaire) entre deux bornes ISO 8601 UTC. */
export function hoursBetween(startsAt: string, endsAt: string): number {
  return (Date.parse(endsAt) - Date.parse(startsAt)) / 3600000;
}

/** Prix d'un créneau : heures au tarif de la salle, +20 le week-end. */
export function priceFor(room: Room, startsAt: string, endsAt: string): number {
  const base = room.hourlyRate * hoursBetween(startsAt, endsAt);
  if (isWeekend(startsAt)) {
    return base + WEEKEND_SURCHARGE;
  }
  return base;
}

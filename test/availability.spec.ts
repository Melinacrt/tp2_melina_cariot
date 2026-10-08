import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { getFreeSlotsForDay } from "../src/lib/availability.js";

interface AvailabilityBody {
  roomId?: string;
  date?: string;
  freeSlots?: Array<{ startsAt: string; endsAt: string }>;
  [key: string]: unknown;
}

async function call(path: string): Promise<{ status: number; body: AvailabilityBody }> {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    return { status: res.status, body: (await res.json()) as AvailabilityBody };
  } finally {
    server.close();
  }
}

describe("GET /rooms/:id/availability", () => {
  it("renvoie 404 pour une salle inconnue", async () => {
    const res = await call("/rooms/cave/availability?date=2026-10-05");
    expect(res.status).toBe(404);
  });

  it("renvoie 400 quand la date est absente", async () => {
    const res = await call("/rooms/salle-a/availability");
    expect(res.status).toBe(400);
  });

  it("renvoie 400 pour une date mal formée", async () => {
    const res = await call("/rooms/salle-a/availability?date=pas-une-date");
    expect(res.status).toBe(400);
  });

  it("renvoie la journée entière quand il n'y a aucune réservation", async () => {
    const res = await call("/rooms/labo/availability?date=2026-10-05");
    expect(res.status).toBe(200);
    expect(res.body.roomId).toBe("labo");
    expect(res.body.date).toBe("2026-10-05");
    expect(res.body.freeSlots).toEqual([
      { startsAt: "2026-10-05T00:00:00Z", endsAt: "2026-10-06T00:00:00Z" }
    ]);
  });

  it("découpe la journée autour d'une réservation existante", async () => {
    // seed : salle-a réservée 09:00-11:00 le 2026-10-05 (voir src/store.ts)
    const res = await call("/rooms/salle-a/availability?date=2026-10-05");
    expect(res.status).toBe(200);
    expect(res.body.freeSlots).toEqual([
      { startsAt: "2026-10-05T00:00:00Z", endsAt: "2026-10-05T09:00:00Z" },
      { startsAt: "2026-10-05T11:00:00Z", endsAt: "2026-10-06T00:00:00Z" }
    ]);
  });

  it("ignore les réservations des autres jours", async () => {
    const res = await call("/rooms/salle-a/availability?date=2026-10-06");
    expect(res.status).toBe(200);
    expect(res.body.freeSlots).toEqual([
      { startsAt: "2026-10-06T00:00:00Z", endsAt: "2026-10-07T00:00:00Z" }
    ]);
  });
});

describe("getFreeSlotsForDay", () => {
  it("fusionne les créneaux qui se chevauchent", () => {
    const result = getFreeSlotsForDay(
      [
        {
          id: "b1",
          roomId: "salle-a",
          who: "a",
          people: 2,
          startsAt: "2026-10-05T09:00:00Z",
          endsAt: "2026-10-05T11:00:00Z",
          price: 50
        },
        {
          id: "b2",
          roomId: "salle-a",
          who: "b",
          people: 2,
          startsAt: "2026-10-05T10:30:00Z",
          endsAt: "2026-10-05T12:00:00Z",
          price: 50
        }
      ],
      "2026-10-05"
    );
    expect(result).toEqual({
      ok: true,
      value: [
        { startsAt: "2026-10-05T00:00:00Z", endsAt: "2026-10-05T09:00:00Z" },
        { startsAt: "2026-10-05T12:00:00Z", endsAt: "2026-10-06T00:00:00Z" }
      ]
    });
  });

  it("retourne une erreur sans lever pour une date invalide", () => {
    expect(getFreeSlotsForDay([], "2026-13-40")).toEqual({
      ok: false,
      error: "date invalide, format attendu : YYYY-MM-DD"
    });
  });
});

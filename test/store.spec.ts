import { describe, it, expect } from "vitest";
import { rooms, findRoom, bookingsForRoom } from "../src/store.js";

describe("store", () => {
  it("expose le catalogue de salles", () => {
    expect(rooms.length).toBeGreaterThan(0);
  });

  it("retrouve une salle par son identifiant", () => {
    const room = findRoom("salle-a");
    expect(room?.id).toBe("salle-a");
    expect(room?.capacity).toBe(12);
  });

  it("retourne les reservations d'une salle connue", () => {
    expect(bookingsForRoom("salle-a").length).toBeGreaterThan(0);
  });

  it("ne retourne aucune reservation pour une salle libre", () => {
    expect(bookingsForRoom("salle-b")).toHaveLength(0);
  });
});

import { Router } from "express";
import { rooms, findRoom, bookingsForRoom } from "../store.js";
import { getFreeSlotsForDay } from "../lib/availability.js";

export const roomsRouter = Router();

roomsRouter.get("/", (_req, res) => {
  res.json({ rooms });
});

roomsRouter.get("/:id", (req, res) => {
  const room = findRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "salle inconnue" });
    return;
  }
  res.json({ room, bookings: bookingsForRoom(room.id) });
});

roomsRouter.get("/:id/availability", (req, res) => {
  const room = findRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "salle inconnue" });
    return;
  }
  const date = req.query.date;
  if (typeof date !== "string" || date.trim() === "") {
    res.status(400).json({ error: "date manquante, format attendu : YYYY-MM-DD" });
    return;
  }
  const result = getFreeSlotsForDay(bookingsForRoom(room.id), date);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ roomId: room.id, date, freeSlots: result.value });
});

import { Router } from "express";
import {
  getAvailableSlots,
  bookSlot,
  getBookings,
  cancelBooking,
  setAvailability,
} from "../services/booking.service.js";

const router = Router();

// Get available slots
router.get("/slots", async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 7;
    const slots = await getAvailableSlots(daysAhead);
    res.json({ slots, timezone: "Asia/Kolkata (IST)" });
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ error: "Failed to get available slots" });
  }
});

// Book a slot
router.post("/book", async (req, res) => {
  try {
    const { date, time, name, email, purpose } = req.body;

    if (!date || !time || !name) {
      return res.status(400).json({
        error: "date, time, and name are required",
      });
    }

    const result = await bookSlot({ date, time, name, email, purpose });
    res.json(result);
  } catch (error) {
    console.error("Book slot error:", error);
    res.status(500).json({ error: "Failed to book slot" });
  }
});

// Get all bookings (admin)
router.get("/", async (req, res) => {
  try {
    const bookings = await getBookings();
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: "Failed to get bookings" });
  }
});

// Cancel a booking (admin)
router.delete("/:id", async (req, res) => {
  try {
    await cancelBooking(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Update availability (admin)
router.put("/availability", async (req, res) => {
  try {
    await setAvailability(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update availability" });
  }
});

export default router;

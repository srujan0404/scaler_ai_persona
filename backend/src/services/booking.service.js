import { getDb } from "./db.service.js";
import { createCalendarEvent } from "./google-calendar.service.js";

const COLLECTION = "bookings";
const AVAILABILITY_COLLECTION = "availability";

// Default availability: Mon-Fri, 10:00-18:00 IST
const DEFAULT_AVAILABILITY = {
  timezone: "Asia/Kolkata",
  slotDurationMinutes: 30,
  days: {
    1: { start: "10:00", end: "18:00" }, // Monday
    2: { start: "10:00", end: "18:00" }, // Tuesday
    3: { start: "10:00", end: "18:00" }, // Wednesday
    4: { start: "10:00", end: "18:00" }, // Thursday
    5: { start: "10:00", end: "18:00" }, // Friday
  },
};

export async function getAvailability() {
  const db = getDb();
  const custom = await db.collection(AVAILABILITY_COLLECTION).findOne({ type: "weekly" });
  return custom || DEFAULT_AVAILABILITY;
}

export async function getAvailableSlots(daysAhead = 7) {
  const availability = await getAvailability();
  const db = getDb();

  // Get existing bookings for the next N days
  const now = new Date();
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const existingBookings = await db
    .collection(COLLECTION)
    .find({
      status: { $ne: "cancelled" },
    })
    .toArray();

  // Use the stored date + time fields (IST) for matching, not UTC datetime
  const bookedSlots = new Set(
    existingBookings.map((b) => `${b.date}T${b.time}`)
  );

  const slots = [];

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...

    const dayAvailability = availability.days[dayOfWeek];
    if (!dayAvailability) continue;

    const [startH, startM] = dayAvailability.start.split(":").map(Number);
    const [endH, endM] = dayAvailability.end.split(":").map(Number);

    // Generate slots
    let currentH = startH;
    let currentM = startM;

    while (currentH < endH || (currentH === endH && currentM < endM)) {
      const slotDate = new Date(date);
      // Set time in IST (UTC+5:30)
      slotDate.setUTCHours(currentH - 5, currentM - 30, 0, 0);

      // Only include future slots
      if (slotDate > now) {
        const dateStr = date.toISOString().slice(0, 10);
        const timeStr = `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`;
        const slotKey = `${dateStr}T${timeStr}`;

        if (!bookedSlots.has(slotKey)) {
          slots.push({
            date: dateStr,
            time: timeStr,
            datetime: slotDate,
            available: true,
          });
        }
      }

      // Advance by slot duration
      currentM += availability.slotDurationMinutes;
      if (currentM >= 60) {
        currentH += Math.floor(currentM / 60);
        currentM = currentM % 60;
      }
    }
  }

  return slots;
}

export async function bookSlot({ date, time, name, email, purpose }) {
  const db = getDb();

  // Parse datetime
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const datetime = new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30));

  // Check if slot is still available
  const existing = await db.collection(COLLECTION).findOne({
    date,
    time,
    status: { $ne: "cancelled" },
  });

  if (existing) {
    return { success: false, error: "This slot is already booked. Please choose another time." };
  }

  const booking = {
    date,
    time,
    datetime,
    name,
    email: email || "",
    purpose: purpose || "Interview discussion",
    status: "confirmed",
    createdAt: new Date(),
  };

  const result = await db.collection(COLLECTION).insertOne(booking);

  // Create Google Calendar event
  let calendarEvent = null;
  try {
    calendarEvent = await createCalendarEvent({ date, time, name, email, purpose });
    if (calendarEvent) {
      await db.collection(COLLECTION).updateOne(
        { _id: result.insertedId },
        { $set: { googleEventId: calendarEvent.eventId, meetLink: calendarEvent.meetLink } }
      );
    }
  } catch (err) {
    console.error("Google Calendar sync failed (booking still saved):", err.message);
  }

  const meetInfo = calendarEvent?.meetLink
    ? ` A Google Meet link has been created: ${calendarEvent.meetLink}`
    : "";

  return {
    success: true,
    booking: {
      id: result.insertedId.toString(),
      ...booking,
      meetLink: calendarEvent?.meetLink || null,
      calendarLink: calendarEvent?.htmlLink || null,
      confirmationMessage: `Meeting booked for ${date} at ${time} IST with ${name}.${meetInfo} You'll receive a confirmation shortly.`,
    },
  };
}

export async function getBookings() {
  const db = getDb();
  return db
    .collection(COLLECTION)
    .find({ status: { $ne: "cancelled" } })
    .sort({ datetime: 1 })
    .toArray();
}

export async function cancelBooking(bookingId) {
  const db = getDb();
  const { ObjectId } = await import("mongodb");
  await db
    .collection(COLLECTION)
    .updateOne({ _id: new ObjectId(bookingId) }, { $set: { status: "cancelled" } });
}

export async function setAvailability(availabilityData) {
  const db = getDb();
  await db
    .collection(AVAILABILITY_COLLECTION)
    .updateOne(
      { type: "weekly" },
      { $set: { ...availabilityData, type: "weekly", updatedAt: new Date() } },
      { upsert: true }
    );
}

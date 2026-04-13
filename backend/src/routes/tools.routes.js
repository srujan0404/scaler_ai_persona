import { Router } from "express";
import { getAvailableSlots, bookSlot } from "../services/booking.service.js";
import { retrieveContext } from "../services/rag.service.js";

const router = Router();

router.post("/get-available-slots", async (req, res) => {
  try {
    const slots = await getAvailableSlots(7);
    const byDate = {};
    for (const s of slots) {
      if (!byDate[s.date]) byDate[s.date] = [];
      byDate[s.date].push(s.time);
    }
    const summary = Object.entries(byDate)
      .map(([date, times]) => `${date}: ${times[0]} to ${times[times.length - 1]} IST`)
      .join("; ");

    res.json({
      results: [
        {
          toolCallId: req.body.toolCallId || "default",
          result: JSON.stringify({
            available_dates: Object.entries(byDate).map(([date, times]) => ({
              date,
              slots: times,
              range: `${times[0]} - ${times[times.length - 1]} IST`,
            })),
            message:
              slots.length > 0
                ? `Available: ${summary}. Each slot is 30 minutes.`
                : "No available slots in the next 7 days.",
          }),
        },
      ],
    });
  } catch (error) {
    console.error("get-available-slots error:", error);
    res.status(500).json({ error: "Failed to get slots" });
  }
});

router.post("/book-meeting", async (req, res) => {
  try {
    const { date, time, name, email, purpose } = req.body;

    if (!date || !time || !name) {
      return res.json({
        results: [
          {
            toolCallId: req.body.toolCallId || "default",
            result: JSON.stringify({
              success: false,
              error: "Please provide date (YYYY-MM-DD), time (HH:MM), and name.",
            }),
          },
        ],
      });
    }

    const result = await bookSlot({
      date,
      time,
      name,
      email: email || "",
      purpose: purpose || "Interview discussion",
    });

    res.json({
      results: [
        {
          toolCallId: req.body.toolCallId || "default",
          result: JSON.stringify(result),
        },
      ],
    });
  } catch (error) {
    console.error("book-meeting error:", error);
    res.status(500).json({ error: "Failed to book meeting" });
  }
});

router.post("/get-background-info", async (req, res) => {
  try {
    const question = req.body.question || req.body.topic || "general background";

    const chunks = await retrieveContext(question, 6);
    const context = chunks.map((c) => c.content).join("\n\n");
    const sources = chunks.map((c) => c.source).join(", ");

    res.json({
      results: [
        {
          toolCallId: req.body.toolCallId || "default",
          result: JSON.stringify({
            context,
            sources,
            note: "Retrieved from Srujan's actual resume and GitHub repos via RAG. Use ONLY this context to answer.",
          }),
        },
      ],
    });
  } catch (error) {
    console.error("get-background-info error:", error);
    res.status(500).json({ error: "Failed to retrieve info" });
  }
});

export default router;

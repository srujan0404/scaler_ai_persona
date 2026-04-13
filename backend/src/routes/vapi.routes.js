import { Router } from "express";
import { getAvailableSlots, bookSlot } from "../services/booking.service.js";
import { retrieveContext } from "../services/rag.service.js";

const router = Router();

router.post("/webhook", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message in request" });
    }

    switch (message.type) {
      case "tool-calls":
        return handleToolCalls(message, res);

      case "status-update":
        console.log("Vapi status update:", message.status);
        return res.json({ ok: true });

      case "end-of-call-report":
        console.log("Call ended:", message.endedReason);
        return res.json({ ok: true });

      case "function-call":
        return handleLegacyFunctionCall(message, res);

      default:
        console.log("Unknown Vapi message type:", message.type);
        return res.json({ ok: true });
    }
  } catch (error) {
    console.error("Vapi webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function handleToolCalls(message, res) {
  const results = [];

  for (const toolCall of message.toolCallList || []) {
    const functionName = toolCall.function?.name;
    let args = {};
    try {
      args =
        typeof toolCall.function?.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function?.arguments || {};
    } catch {}

    let result;

    switch (functionName) {
      case "get_available_slots": {
        const slots = await getAvailableSlots(7);
        const byDate = {};
        for (const s of slots) {
          if (!byDate[s.date]) byDate[s.date] = [];
          byDate[s.date].push(s.time);
        }
        const summary = Object.entries(byDate)
          .map(([date, times]) => `${date}: ${times[0]} to ${times[times.length - 1]} IST`)
          .join("; ");
        result = {
          available_dates: Object.entries(byDate).map(([date, times]) => ({
            date,
            slots: times,
            range: `${times[0]} - ${times[times.length - 1]} IST`,
          })),
          message:
            slots.length > 0
              ? `I have availability on the following days: ${summary}. Each slot is 30 minutes. Which date and time works for you?`
              : "No available slots in the next 7 days.",
        };
        break;
      }

      case "book_meeting": {
        const bookingResult = await bookSlot({
          date: args.date,
          time: args.time,
          name: args.name || "Unknown",
          email: args.email || "",
          purpose: args.purpose || "Interview discussion",
        });
        result = bookingResult;
        break;
      }

      case "get_background_info": {
        // RAG-grounded retrieval — fetches from actual resume and GitHub data
        const query = args.question || args.topic || "general background";
        const chunks = await retrieveContext(query, 6);
        const context = chunks.map((c) => c.content).join("\n\n");
        result = {
          context,
          source: chunks.map((c) => c.source).join(", "),
          note: "This information was retrieved from Srujan's actual resume and GitHub repositories via RAG. Use ONLY this context to answer.",
        };
        break;
      }

      default:
        result = { error: `Unknown function: ${functionName}` };
    }

    results.push({
      toolCallId: toolCall.id,
      result: typeof result === "string" ? result : JSON.stringify(result),
    });
  }

  res.json({ results });
}

async function handleLegacyFunctionCall(message, res) {
  const functionName = message.functionCall?.name;
  let args = {};
  try {
    args =
      typeof message.functionCall?.parameters === "string"
        ? JSON.parse(message.functionCall.parameters)
        : message.functionCall?.parameters || {};
  } catch {}

  let result;

  switch (functionName) {
    case "get_available_slots": {
      const slots = await getAvailableSlots(7);
      const byDate = {};
      for (const s of slots) {
        if (!byDate[s.date]) byDate[s.date] = [];
        byDate[s.date].push(s.time);
      }
      const summary = Object.entries(byDate)
        .map(([d, t]) => `${d}: ${t[0]}-${t[t.length - 1]}`)
        .join("; ");
      result = summary || "No available slots.";
      break;
    }
    case "book_meeting": {
      const bookingResult = await bookSlot(args);
      result = bookingResult.success
        ? bookingResult.booking.confirmationMessage
        : bookingResult.error;
      break;
    }
    case "get_background_info": {
      const query = args.question || args.topic || "general";
      const chunks = await retrieveContext(query, 6);
      result = chunks.map((c) => c.content).join("\n\n");
      break;
    }
    default:
      result = `Unknown function: ${functionName}`;
  }

  res.json({ result });
}

export default router;

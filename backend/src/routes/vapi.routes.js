import { Router } from "express";
import { getAvailableSlots, bookSlot } from "../services/booking.service.js";
import { getKnowledgeBase } from "../services/knowledge.service.js";

const router = Router();

/**
 * Vapi sends a POST request to this endpoint when the LLM calls a tool.
 * The request body contains the tool call details.
 * We process the tool and return the result.
 *
 * Vapi webhook format:
 * {
 *   "message": {
 *     "type": "tool-calls",
 *     "toolCallList": [
 *       {
 *         "id": "...",
 *         "type": "function",
 *         "function": {
 *           "name": "get_available_slots",
 *           "arguments": {}
 *         }
 *       }
 *     ]
 *   }
 * }
 */
router.post("/webhook", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message in request" });
    }

    // Handle different Vapi message types
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
        // Legacy format
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
        // Group by date for voice-friendly summary
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
          message: slots.length > 0
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
        const kb = await getKnowledgeBase();
        const topic = args.topic || "general";
        result = getRelevantInfo(kb, topic);
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
      const nextSlots = slots.slice(0, 8);
      result =
        nextSlots.length > 0
          ? `Available slots: ${nextSlots.map((s) => `${s.date} at ${s.time} IST`).join(", ")}`
          : "No available slots in the next 7 days.";
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
      const kb = await getKnowledgeBase();
      result = JSON.stringify(getRelevantInfo(kb, args.topic || "general"));
      break;
    }
    default:
      result = `Unknown function: ${functionName}`;
  }

  res.json({ result });
}

function getRelevantInfo(kb, topic) {
  const topicLower = topic.toLowerCase();
  const info = {};

  if (topicLower.includes("education") || topicLower.includes("school") || topicLower.includes("college")) {
    info.education = kb.education;
  }
  if (topicLower.includes("experience") || topicLower.includes("work") || topicLower.includes("job")) {
    info.experience = kb.experience;
  }
  if (topicLower.includes("skill") || topicLower.includes("tech")) {
    info.skills = kb.skills;
  }
  if (topicLower.includes("project") || topicLower.includes("github") || topicLower.includes("repo")) {
    info.projects = kb.projects;
  }
  if (topicLower.includes("why") || topicLower.includes("fit") || topicLower.includes("role")) {
    info.whyThisRole = kb.whyThisRole;
  }

  // If no specific match, return everything
  if (Object.keys(info).length === 0) {
    return {
      personal: kb.personal,
      education: kb.education,
      experience: kb.experience,
      skills: kb.skills,
      projects: kb.projects,
      whyThisRole: kb.whyThisRole,
    };
  }

  return info;
}

export default router;

import { Router } from "express";
import { chatWithRAG, chatCompletion } from "../services/groq.service.js";
import { getKnowledgeBase } from "../services/knowledge.service.js";
import { getAvailableSlots, bookSlot } from "../services/booking.service.js";

const router = Router();

// In-memory conversation store (per session)
const conversations = new Map();

router.post("/", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId);

    // Add user message to history first
    history.push({ role: "user", content: message });

    // Get knowledge base
    const knowledgeBase = await getKnowledgeBase();
    const systemPrompt = buildSystemPromptFromKB(knowledgeBase);

    // Build messages for LLM
    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    // Get LLM response (may include tool calls)
    let response = await chatCompletion(llmMessages);

    // Handle tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Add assistant message with tool calls to history (clean format)
      history.push({
        role: "assistant",
        content: response.content || null,
        tool_calls: response.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      });

      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {}

        let toolResult;

        if (toolName === "get_available_slots") {
          const slots = await getAvailableSlots(7);
          // Group by date for a concise summary
          const byDate = {};
          for (const s of slots) {
            if (!byDate[s.date]) byDate[s.date] = [];
            byDate[s.date].push(s.time);
          }
          toolResult = JSON.stringify({
            available_dates: Object.entries(byDate).map(([date, times]) => ({
              date,
              slots: times,
              range: `${times[0]} - ${times[times.length - 1]} IST`,
            })),
            total_available: slots.length,
            timezone: "Asia/Kolkata (IST)",
            note: "All times are in IST. Slots are 30 minutes each.",
          });
        } else if (toolName === "book_meeting") {
          const result = await bookSlot(args);
          toolResult = JSON.stringify(result);
        } else {
          toolResult = JSON.stringify({ error: "Unknown tool" });
        }

        // Add tool result to history
        history.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // Get final response after tool execution (no tools this time — force text reply)
      const finalMessages = [
        { role: "system", content: systemPrompt },
        ...history,
      ];
      response = await chatCompletion(finalMessages, false);
    }

    // Add assistant response to history
    history.push({ role: "assistant", content: response.content });

    // Keep history manageable — only keep user/assistant pairs (drop tool call messages)
    if (history.length > 30) {
      const cleaned = history.filter(
        (m) => m.role === "user" || (m.role === "assistant" && !m.tool_calls)
      );
      conversations.set(sessionId, cleaned.slice(-20));
    }

    res.json({
      response: response.content,
      sessionId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// Reset conversation
router.delete("/:sessionId", (req, res) => {
  conversations.delete(req.params.sessionId);
  res.json({ success: true });
});

function buildSystemPromptFromKB(kb) {
  return `You are an AI representative of ${kb.name}. You speak in first person as if you ARE ${kb.name}'s AI persona.

## Your Role
You represent ${kb.name} in conversations. Answer questions about their background, skills, experience, and projects. Help schedule meetings.

## Rules
1. ONLY use information from the knowledge base below. NEVER fabricate or invent facts.
2. If you don't know something, say "I don't have that specific information, but you can ask ${kb.name} directly — want to book a meeting?"
3. Be conversational, confident, and specific — cite project names, tech, metrics.
4. Keep responses concise. Don't dump your entire resume in one answer.
5. CRITICAL — For ANY question about availability, scheduling, or booking: you MUST call the get_available_slots tool first. NEVER guess availability. Some slots may already be booked. Always check with the tool before answering.
6. To book a meeting, first call get_available_slots, then call book_meeting with the chosen slot.
7. Stay honest. If probed on something not in your knowledge, admit you don't have that info.
8. When asked "why should we hire you" or similar, give a compelling, specific answer grounded in real experience.

## Knowledge Base

### Personal Info
${kb.personal || "Not available."}

### Education
${kb.education || "Not available."}

### Work Experience
${kb.experience || "Not available."}

### Skills
${kb.skills || "Not available."}

### Projects & GitHub Repos
${kb.projects || "Not available."}

### Why This Role
${kb.whyThisRole || "Not available."}`;
}

export default router;

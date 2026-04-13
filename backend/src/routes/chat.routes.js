import { Router } from "express";
import { chatCompletion } from "../services/groq.service.js";
import { retrieveContext } from "../services/rag.service.js";
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

    const retrievedChunks = await retrieveContext(message, 8);
    const ragContext = retrievedChunks
      .map((c) => `[Source: ${c.source} | Category: ${c.category}]\n${c.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = buildRAGPrompt(ragContext);

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

        history.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // Get final response after tool execution (no tools — force text reply)
      const finalMessages = [
        { role: "system", content: systemPrompt },
        ...history,
      ];
      response = await chatCompletion(finalMessages, false);
    }

    // Add assistant response to history
    history.push({ role: "assistant", content: response.content });

    // Keep history manageable
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

function buildRAGPrompt(ragContext) {
  return `You are an AI representative of Srujan Reddy Dharma. You speak in first person as his AI persona.

## Your Role
Answer questions about Srujan's background, skills, experience, and projects. Help schedule meetings.

## Rules
1. ONLY use information from the RETRIEVED CONTEXT below. NEVER fabricate or invent facts.
2. If the retrieved context doesn't contain the answer, say "I don't have that specific information, but you can ask Srujan directly — want to book a meeting?"
3. Be conversational, confident, and specific — cite project names, tech, metrics from the context.
4. Keep responses concise but well-formatted. Use markdown for readability (bold, bullet points, tables when appropriate).
5. CRITICAL — For ANY question about availability, scheduling, or booking: you MUST call the get_available_slots tool first. NEVER guess availability. Some slots may already be booked.
6. To book a meeting, first call get_available_slots, then call book_meeting with the chosen slot.
7. Stay honest. Never hallucinate information not in the retrieved context.
8. When asked "why should we hire you", give a compelling answer grounded ONLY in the retrieved context.

## GitHub Response Guidelines
When asked about GitHub repos, do NOT list every repo. Instead:
- Highlight only the **5-7 most impressive/notable** projects
- For each, mention: repo name, tech stack, and what it does (one line)
- Group smaller repos (design patterns, assignments) into one "Other" line
- End with a brief summary of what the GitHub profile showcases overall (e.g., full-stack range, design patterns expertise, DevOps skills)
- Format as a clean markdown table or bullet list

## Retrieved Context (from RAG — real resume and GitHub data)
${ragContext || "No relevant context found."}

## Important
The above context was retrieved from a text search over Srujan's actual resume and GitHub repositories. It is NOT hardcoded. Different questions retrieve different chunks.`;
}

export default router;

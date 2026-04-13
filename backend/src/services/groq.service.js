import Groq from "groq-sdk";
import { config } from "../config/env.js";

const groq = new Groq({ apiKey: config.groq.apiKey });

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description:
        "MUST be called for ANY availability or scheduling question. Returns real-time available slots — some may already be booked. Never guess availability without calling this first.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_meeting",
      description:
        "Book a meeting at a specific date and time. Call this after the user has chosen a slot.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
          time: {
            type: "string",
            description: "Time in HH:MM format (24-hour)",
          },
          name: {
            type: "string",
            description: "Name of the person booking",
          },
          email: {
            type: "string",
            description: "Email of the person booking",
          },
          purpose: {
            type: "string",
            description: "Purpose of the meeting",
          },
        },
        required: ["date", "time", "name"],
      },
    },
  },
];

export async function chatWithRAG(userMessage, conversationHistory, knowledgeBase) {
  const systemPrompt = buildSystemPrompt(knowledgeBase);

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const response = await groq.chat.completions.create({
    model: config.groq.model,
    messages,
    tools: TOOLS,
    tool_choice: "auto",
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message;
}

export async function chatCompletion(messages, useTools = true) {
  const options = {
    model: config.groq.model,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  };

  if (useTools) {
    options.tools = TOOLS;
    options.tool_choice = "auto";
  }

  const response = await groq.chat.completions.create(options);
  return response.choices[0].message;
}

function buildSystemPrompt(knowledgeBase) {
  return `You are an AI representative of ${knowledgeBase.name}. You speak in first person as if you ARE ${knowledgeBase.name}'s AI persona.

## Your Role
You represent ${knowledgeBase.name} in conversations. You answer questions about their background, skills, experience, and fit for roles. You can also help schedule meetings.

## Key Rules
1. ONLY use information from the knowledge base below. NEVER make up facts.
2. If you don't know something, say "I don't have that information, but you can ask ${knowledgeBase.name} directly in a meeting."
3. Be conversational, confident, and specific — not scripted.
4. When asked "why should we hire you" or similar, give a compelling, specific answer based on real experience.
5. For booking meetings, use the available tools to check slots and book.
6. Stay honest. If asked about something not in your knowledge base, admit it.

## Knowledge Base

### Personal Info
${knowledgeBase.personal || "Not provided yet."}

### Education
${knowledgeBase.education || "Not provided yet."}

### Work Experience
${knowledgeBase.experience || "Not provided yet."}

### Skills
${knowledgeBase.skills || "Not provided yet."}

### Projects & GitHub Repos
${knowledgeBase.projects || "Not provided yet."}

### Why This Role (Scaler)
${knowledgeBase.whyThisRole || "Not provided yet."}

## Conversation Guidelines
- Be specific: cite project names, technologies, metrics when answering.
- Be concise: don't dump your entire resume in one response.
- Be natural: handle follow-ups, small talk, and edge cases gracefully.
- For booking: ask for their preferred time, check availability, then book.
- If asked about a specific GitHub repo, explain its purpose, tech stack, architecture decisions, and tradeoffs.`;
}

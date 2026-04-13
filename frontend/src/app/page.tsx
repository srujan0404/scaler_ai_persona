"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Why are you the right fit for this role?",
  "Tell me about your experience at Pazcare",
  "What projects have you built?",
  "What's on your GitHub?",
  "Can we book a meeting?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Srujan's AI representative. I can tell you about his background, skills, projects, and even help you book a meeting. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, sessionId }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I'm having trouble connecting right now. Please try again.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Connection error. Please make sure the backend is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="relative z-10 flex flex-col h-screen max-h-screen">
      {/* Header */}
      <header
        className="px-5 py-4 flex items-center gap-4 sticky top-0 z-20"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        {/* Accent-cornered avatar */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ background: "var(--bg-2)", color: "var(--ink)", border: "1px solid var(--rule)" }}
          >
            SD
          </div>
          {/* Pulse dot */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 6px var(--accent), 0 0 12px rgba(255, 74, 31, 0.3)",
              animation: "pulse-dot 2s infinite ease-in-out",
            }}
          />
        </div>
        <div>
          <h1 className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            Srujan Reddy Dharma
          </h1>
          <p className="mono-label mt-0.5">
            SDE Intern @ Pazcare &middot; Scaler SoT &amp; BITS
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="mono-label">Available</span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 4px var(--accent)",
            }}
          />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-3 mt-1"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--rule)",
                  fontSize: "0.6rem",
                  color: "var(--ink-low)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                AI
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "rounded-2xl rounded-br-sm"
                  : "rounded-2xl rounded-bl-sm"
              }`}
              style={
                msg.role === "user"
                  ? {
                      background: "var(--bg-2)",
                      color: "var(--ink)",
                      border: "1px solid var(--rule)",
                    }
                  : {
                      background: "transparent",
                      color: "var(--ink)",
                    }
              }
            >
              {msg.role === "assistant" ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-3"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--rule)",
                fontSize: "0.6rem",
                color: "var(--ink-low)",
                fontFamily: "var(--font-mono)",
              }}
            >
              AI
            </div>
            <div className="flex gap-1.5 py-3">
              <span
                className="typing-dot w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--ink-low)" }}
              />
              <span
                className="typing-dot w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--ink-low)" }}
              />
              <span
                className="typing-dot w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--ink-low)" }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2 justify-center">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                border: "1px solid var(--rule)",
                color: "var(--ink-mid)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--rule)";
                e.currentTarget.style.color = "var(--ink-mid)";
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid var(--rule)", background: "var(--bg)" }}
      >
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Srujan's background, skills, or book a meeting..."
            rows={1}
            className="flex-1 resize-none rounded-lg px-4 py-3 text-sm transition-colors duration-200"
            style={{
              background: "var(--bg-2)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              outline: "none",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              letterSpacing: "-0.011em",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--rule)";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Send
          </button>
        </div>
        <p
          className="text-center mt-2 mono-label"
        >
          RAG-grounded AI persona &middot; Resume + GitHub data
        </p>
      </div>
    </div>
  );
}

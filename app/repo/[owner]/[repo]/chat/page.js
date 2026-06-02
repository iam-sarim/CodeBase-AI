"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Image from "next/image";

export default function ChatPage({ params }) {
  const { owner, repo } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const storageKey = `chat_${owner}_${repo}`;

  // Load chat history from localStorage on page open
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I've analyzed **${owner}/${repo}**. Ask me anything about the codebase!`,
        },
      ]);
    }
  }, [owner, repo]);

  // Save chat history to localStorage on every message
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          owner,
          repo,
          history: updatedMessages.slice(-6),
        }),
      });

      const data = await res.json();

      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer,
            sources: data.sources,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${data.error}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const initial = [
      {
        role: "assistant",
        content: `Hi! I've analyzed **${owner}/${repo}**. Ask me anything about the codebase!`,
      },
    ];
    setMessages(initial);
    localStorage.removeItem(storageKey);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#07090e" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 65%)",
        }}
      />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4"
        style={{
          background: "rgba(7,9,14,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => router.push(`/repo/${owner}/${repo}`)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94A3B8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.09)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "#94A3B8";
            }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>

          {/* Divider */}
          <div
            className="w-px h-5 hidden sm:block"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />

          {/* Repo identity */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/codebaseai-logo.png"
              alt="CodebaseAI"
              width={200}
              height={200}
              className="h-7 sm:h-8 w-auto object-contain flex-shrink-0"
            />
            <div>
              <h1
                className="font-semibold text-sm leading-tight"
                style={{ color: "#F1F5F9" }}
              >
                {owner}/<span style={{ color: "#ffffff" }}>{repo}</span>
              </h1>
              <p
                className="text-xs leading-tight mt-0.5"
                style={{ color: "#334155" }}
              >
                AI Codebase Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Clear chat */}
        <button
          onClick={clearChat}
          className="flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#475569",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            e.currentTarget.style.color = "#F87171";
            e.currentTarget.style.background = "rgba(239,68,68,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "#475569";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </header>

      {/* ── Messages ── */}
      <div className="relative z-10 flex-1 overflow-y-auto py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Empty state */}
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2
                className="font-semibold text-base mb-2"
                style={{ color: "#F1F5F9" }}
              >
                Ask anything about this repo
              </h2>
              <p
                className="text-sm max-w-xs leading-relaxed"
                style={{ color: "#334155" }}
              >
                Try asking about authentication, architecture, APIs, or how
                specific features work.
              </p>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {[
                  "How is auth handled?",
                  "Explain the folder structure",
                  "How does the API work?",
                  "What are the main dependencies?",
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3.5 py-2 rounded-full transition-all duration-200"
                    style={{
                      background: "rgba(13,19,30,0.8)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#64748B",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(59,130,246,0.3)";
                      e.currentTarget.style.color = "#60A5FA";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.07)";
                      e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* AI avatar */}
              {msg.role !== "user" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-3 mt-1"
                  style={{
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
              )}

              <div
                className="max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3.5"
                style={
                  msg.role === "user"
                    ? {
                        background: "#3B82F6",
                        color: "#ffffff",
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: "rgba(13,19,30,0.9)",
                        color: "#CBD5E1",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <p
                      className="text-xs mb-2 flex items-center gap-1.5"
                      style={{ color: "#475569" }}
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(msg.sources)].map((source, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-lg font-mono"
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            color: "#60A5FA",
                            border: "1px solid rgba(59,130,246,0.18)",
                          }}
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div className="flex justify-start">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-3 mt-1"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div
                className="rounded-2xl px-5 py-4 flex items-center gap-1.5"
                style={{
                  background: "rgba(13,19,30,0.9)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderBottomLeftRadius: 4,
                }}
              >
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      background: "#3B82F6",
                      animationDelay: `${delay}ms`,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div
        className="sticky bottom-0 z-10"
        style={{
          background: "rgba(7,9,14,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div
            className="flex gap-3 items-center rounded-2xl px-4 py-3 transition-all duration-200"
            style={{
              background: "rgba(13,19,30,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocusCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)")
            }
            onBlurCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
            }
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder="Ask anything about this codebase..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm focus:outline-none resize-none"
              style={{ color: "#F1F5F9", caretColor: "#3B82F6" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 transition-all duration-200"
              style={{
                background:
                  loading || !input?.trim()
                    ? "rgba(255,255,255,0.05)"
                    : "#3B82F6",
                color: loading || !input?.trim() ? "#334155" : "#ffffff",
                boxShadow:
                  loading || !input?.trim()
                    ? "none"
                    : "0 0 16px rgba(59,130,246,0.35)",
              }}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: "#1E293B" }}>
            Press Enter to send · answers are based on the actual source code
          </p>
        </div>
      </div>
    </div>
  );
}

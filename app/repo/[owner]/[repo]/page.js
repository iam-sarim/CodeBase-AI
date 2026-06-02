"use client";

import MermaidDiagram from "@/app/components/MermaidDiagram";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Image from "next/image";

export default function RepoPage({ params }) {
  const { owner, repo } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repoInfo, setRepoInfo] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [repoError, setRepoError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status]);

  useEffect(() => {
    if (session) fetchFiles();
  }, [session]);

  useEffect(() => {
    if (session && owner && repo) {
      checkIfAnalyzed();
    }
  }, [session, owner, repo]);

  const checkIfAnalyzed = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/status`);
      const { data } = await res.json();

      if (data?.analyzed) {
        setAnalyzed(true);
        setAnalyzeStatus(
          `✅ Previously analyzed on ${new Date(data.analyzedAt).toLocaleDateString()}`,
        );
        fetchSummary();
      }
    } catch (error) {
      console.error("Status check error:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/files`);
      const data = await res.json();

      if (data.error) {
        setRepoError(
          `Repository "${owner}/${repo}" not found. Please check the URL and try again.`,
        );
        setLoading(false);
        return;
      }

      setFiles(data.files || []);
      setRepoInfo(data.repoInfo);
    } catch (error) {
      setRepoError("Something went wrong. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleAnalyze = async (forceReanalyze = false) => {
    setAnalyzing(true);
    setAnalyzeStatus("Checking repository status...");

    try {
      setAnalyzeStatus(
        "Analyzing files and generating embeddings... this may take a minute ⏳",
      );

      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, forceReanalyze }),
      });

      const data = await res.json();

      if (data.success) {
        setAnalyzed(true);
        setAnalyzeStatus(`✅ ${data.message}`);
        fetchSummary();
      } else {
        setAnalyzeStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setAnalyzeStatus(`❌ Error: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/summary`);
      const data = await res.json();
      if (!data.error) setSummary(data);
    } catch (error) {
      console.error("Summary error:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  {
    /* ── Loading State ── */
  }
  if (status === "loading" || loading || statusLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#07090e" }}
      >
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-10 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  background: "#3B82F6",
                  animationDelay: `${delay}ms`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <p className="font-semibold text-base" style={{ color: "#F1F5F9" }}>
            Loading repository...
          </p>
          <p className="text-sm" style={{ color: "#334155" }}>
            Checking analysis status
          </p>
        </div>
      </div>
    );
  }

  {
    /* ── Error State ── */
  }
  if (repoError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#07090e" }}
      >
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-10 text-center max-w-md mx-auto">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F87171"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="font-bold text-2xl mb-3" style={{ color: "#F1F5F9" }}>
            Repository Not Found
          </h2>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "#64748B" }}
          >
            {repoError}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all duration-200 mx-auto"
            style={{
              background: "#3B82F6",
              color: "#ffffff",
              boxShadow: "0 0 24px rgba(59,130,246,0.3)",
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
            Back to Dashboard
          </button>
        </div>
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
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 65%)",
        }}
      />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{
          background: "rgba(7,9,14,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => router.push("/dashboard")}
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
                <span style={{ color: "#64748B" }}>{owner}/</span>
                {repo}
              </h1>
              {repoInfo?.description && (
                <p
                  className="text-xs leading-tight mt-0.5 hidden sm:block max-w-xs truncate"
                  style={{ color: "#334155" }}
                >
                  {repoInfo.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Analyzed badge */}
        {analyzed && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{
              background: "rgba(34,197,94,0.08)",
              color: "#4ADE80",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Analyzed
          </span>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full space-y-5">
        {/* ── Analyze Card ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(13,19,30,0.85)",
            border: `1px solid ${analyzed ? "rgba(34,197,94,0.2)" : "rgba(59,130,246,0.18)"}`,
            backdropFilter: "blur(12px)",
            boxShadow: analyzed
              ? "0 0 40px rgba(34,197,94,0.04)"
              : "0 0 40px rgba(59,130,246,0.05)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: analyzed
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(59,130,246,0.1)",
                  border: `1px solid ${analyzed ? "rgba(34,197,94,0.2)" : "rgba(59,130,246,0.2)"}`,
                }}
              >
                {analyzed ? (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4ADE80"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                )}
              </div>
              <div>
                <h2
                  className="font-semibold text-base"
                  style={{ color: "#F1F5F9" }}
                >
                  AI Analysis
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#475569" }}>
                  {analyzed
                    ? "Repository analyzed — Q&A and architecture insights are ready"
                    : "Analyze this repository to enable AI-powered Q&A and architecture insights"}
                </p>
                {analyzeStatus && !analyzed && (
                  <p
                    className="text-xs mt-2 flex items-center gap-1.5"
                    style={{ color: "#60A5FA" }}
                  >
                    <svg
                      className="w-3 h-3 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {analyzeStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {analyzed && !analyzing && (
                <button
                  onClick={() => handleAnalyze(true)}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748B",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.18)";
                    e.currentTarget.style.color = "#94A3B8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Re-analyze
                </button>
              )}

              <button
                onClick={() => handleAnalyze(false)}
                disabled={analyzing || analyzed}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: analyzed
                    ? "rgba(34,197,94,0.1)"
                    : analyzing
                      ? "rgba(255,255,255,0.04)"
                      : "#3B82F6",
                  color: analyzed
                    ? "#4ADE80"
                    : analyzing
                      ? "#475569"
                      : "#ffffff",
                  border: analyzed ? "1px solid rgba(34,197,94,0.2)" : "none",
                  boxShadow:
                    !analyzed && !analyzing
                      ? "0 0 20px rgba(59,130,246,0.3)"
                      : "none",
                  cursor: analyzed || analyzing ? "default" : "pointer",
                }}
              >
                {analyzing && (
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {analyzed
                  ? "Analysis Complete"
                  : analyzing
                    ? "Analyzing..."
                    : "Analyze Repository"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Architecture Summary ── */}
        {summaryLoading && (
          <div
            className="rounded-2xl p-6 flex items-center gap-3"
            style={{
              background: "rgba(13,19,30,0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <svg
              className="w-4 h-4 animate-spin flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <p className="text-sm" style={{ color: "#475569" }}>
              Generating architecture summary...
            </p>
          </div>
        )}

        {summary && (
          <div
            className="rounded-2xl p-6 space-y-6"
            style={{
              background: "rgba(13,19,30,0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Title */}
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h2 className="font-bold text-lg" style={{ color: "#F1F5F9" }}>
                Architecture Summary
              </h2>
            </div>

            <div
              className="h-px"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />

            {/* Overview */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#3B82F6" }}
              >
                Overview
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#94A3B8" }}
              >
                {summary.overview}
              </p>
            </div>

            {/* Tech Stack */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#3B82F6" }}
              >
                Tech Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.techStack?.map((tech, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(59,130,246,0.08)",
                      color: "#93C5FD",
                      border: "1px solid rgba(59,130,246,0.15)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Architecture */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#3B82F6" }}
              >
                Architecture
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#94A3B8" }}
              >
                {summary.architecture}
              </p>
            </div>

            {/* Project Structure */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#3B82F6" }}
              >
                Project Structure
              </p>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(7,9,14,0.8)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {summary.folders?.map((folder, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 px-4 py-3 text-sm transition-colors"
                    style={{
                      borderBottom:
                        i < summary.folders.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(59,130,246,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      className="font-mono text-xs flex-shrink-0 min-w-32 pt-0.5"
                      style={{ color: "#F59E0B" }}
                    >
                      {folder.name}
                    </span>
                    <span className="text-sm" style={{ color: "#64748B" }}>
                      {folder.purpose}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagram */}
            {summary?.diagram && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "#3B82F6" }}
                >
                  Architecture Diagram
                </p>
                <div
                  className="rounded-xl overflow-hidden p-4"
                  style={{
                    background: "rgba(7,9,14,0.8)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <MermaidDiagram chart={summary.diagram} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Chat CTA ── */}
        {analyzed && (
          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.2)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 0 48px rgba(59,130,246,0.06)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.25)",
                }}
              >
                <svg
                  className="w-4 h-4"
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
              <div>
                <h2
                  className="font-semibold text-base mb-1"
                  style={{ color: "#F1F5F9" }}
                >
                  Chat with this Codebase
                </h2>
                <p className="text-sm" style={{ color: "#475569" }}>
                  Ask anything about this repository — architecture, functions,
                  logic, anything.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/repo/${owner}/${repo}/chat`)}
              className="flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer"
              style={{
                background: "#3B82F6",
                color: "#ffffff",
                boxShadow: "0 0 18px rgba(59,130,246,0.35)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(59,130,246,0.55)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 16px rgba(59,130,246,0.35)")
              }
            >
              Start Chat
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Files List ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(13,19,30,0.85)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Files header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span
                className="text-sm font-medium"
                style={{ color: "#F1F5F9" }}
              >
                Repository Files
              </span>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#475569",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {files.length} files
            </span>
          </div>

          {/* Files */}
          <div
            className="divide-y"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-5 py-2.5 transition-colors"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(59,130,246,0.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {file.type === "dir" ? (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
                <span
                  className="text-sm font-mono flex-1 truncate"
                  style={{ color: file.type === "dir" ? "#CBD5E1" : "#94A3B8" }}
                >
                  {file.path}
                </span>
                {file.size && (
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "#334155" }}
                  >
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

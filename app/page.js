"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "#07090e" }}
    >
      {/* Blue ambient glow — hero atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
      radial-gradient(ellipse 80% 50% at 50% -5%, rgba(59,130,246,0.25) 0%, transparent 70%),
      radial-gradient(ellipse 60% 35% at 50% -5%, rgba(59,130,246,0.20) 0%, transparent 60%)
    `,
        }}
      />

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{
          background: "rgba(7,9,14,0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
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
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span
            className="font-bold text-base tracking-tight"
            style={{ color: "#ffffff" }}
          >
            CodebaseAI
          </span>
        </div>

        {/* Nav CTA */}
        <button
          onClick={() => signIn("github")}
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer"
          style={{
            background: "#3B82F6",
            color: "#ffffff",
            boxShadow: "0 0 20px rgba(59,130,246,0.25)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0 0 28px rgba(59,130,246,0.45)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.25)")
          }
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Sign in with GitHub
        </button>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-24 md:py-32">
        {/* Eyebrow badge */}
        {/* <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase"
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            color: "#60A5FA",
          }}
        >
          <span style={{ color: "#3B82F6" }}>✦</span>
          AI-Powered Codebase Understanding
        </div> */}

        {/* Main heading */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl"
          style={{ color: "#ffffff" }}
        >
          Understand any{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #93C5FD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            GitHub repo
          </span>
          <br className="hidden sm:block" /> instantly
        </h1>

        {/* Subtext */}
        <p
          className="text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          Paste any GitHub repository URL and let AI analyze the entire
          codebase. Get architecture summaries, diagrams, and ask any question
          about the code.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-5 w-full max-w-md sm:max-w-none justify-center">
          <button
            onClick={() => signIn("github")}
            className="flex items-center justify-center gap-3 text-base font-bold px-8 py-4 rounded-full transition-all duration-200 w-full sm:w-auto cursor-pointer"
            style={{
              background: "#3B82F6",
              color: "#ffffff",
              boxShadow: "0 0 20px rgba(59,130,246,0.35)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 28px rgba(59,130,246,0.55)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 32px rgba(59,130,246,0.35)")
            }
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub — it's free
          </button>
        </div>

        <p className="text-sm" style={{ color: "#475569" }}>
          No credit card required · Free to get started
        </p>

        {/* Section divider */}
        <div className="flex items-center gap-4 max-w-4xl w-full mt-20 mb-10">
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "#1E293B" }}
          >
            Everything you need
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        </div>

        {/* ── Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full text-left">
          {[
            {
              icon: (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              ),
              title: "Analyze Any Repo",
              desc: "Paste any public GitHub URL and AI reads the entire codebase — files, structure, dependencies — in minutes.",
            },
            {
              icon: (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: "Ask Any Question",
              desc: 'Ask anything — "where is auth handled?", "how does payment work?" — and get precise answers from actual code.',
            },
            {
              icon: (
                <svg
                  className="w-5 h-5"
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
              ),
              title: "Architecture Diagrams",
              desc: "Get auto-generated architecture summaries and visual diagrams of any codebase, instantly.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{
                background: "rgba(13,19,30,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(59,130,246,0.28)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")
              }
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 flex-shrink-0"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.18)",
                }}
              >
                {feature.icon}
              </div>
              <h3
                className="font-semibold text-base mb-2"
                style={{ color: "#F1F5F9" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#64748B" }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-6 py-6 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-sm" style={{ color: "#1E293B" }}>
          Built with Next.js · Supabase · HuggingFace · Groq
        </p>
      </footer>
    </div>
  );
}

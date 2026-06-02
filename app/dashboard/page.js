"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [analyzedRepos, setAnalyzedRepos] = useState([]);
  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchRepos();
      fetchAnalyzedRepos();
    }
  }, [session]);

  const fetchRepos = async () => {
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      setRepos(data);
    } catch (error) {
      console.error("Error fetching repos:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAnalyzedRepos = async () => {
    try {
      const res = await fetch("/api/analyzed-repos");
      const data = await res.json();
      setAnalyzedRepos(data);
    } catch (error) {
      console.error("Error fetching analyzed repos:", error);
    }
  };

  const handleUrlAnalyze = () => {
    setUrlError("");
    try {
      const url = new URL(repoUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length < 2) {
        setUrlError("Please enter a valid GitHub repo URL");
        return;
      }
      router.push(`/repo/${parts[0]}/${parts[1]}`);
    } catch {
      setUrlError("Please enter a valid GitHub repo URL");
    }
  };

  if (status === "loading" || loading) {
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
      {/* <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 65%)",
        }}
      /> */}
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
          background: "rgba(7,9,14,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <Image
          src="/codebaseai-logo-watermark.png"
          width={500}
          height={500}
          alt="CodebaseAI"
          className="object-contain"
          style={{ height: "44px", width: "160px" }}
        />

        {/* User area */}
        <div className="flex items-center gap-3">
          {/* Avatar + name — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2.5">
            <img
              src={session?.user?.image}
              alt="avatar"
              className="w-8 h-8 rounded-full"
              style={{
                outline: "1px solid rgba(255,255,255,0.1)",
                outlineOffset: 1,
              }}
            />
            <span className="text-sm" style={{ color: "#94A3B8" }}>
              {session?.user?.name}
            </span>
          </div>

          {/* Avatar only on mobile */}
          <img
            src={session?.user?.image}
            alt="avatar"
            className="w-8 h-8 rounded-full sm:hidden"
          />

          <button
            onClick={() => signOut()}
            className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 cursor-pointer"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94A3B8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#94A3B8";
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* ── URL Analyze Card ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-10"
          style={{
            background: "rgba(13,19,30,0.85)",
            border: "1px solid rgba(59,130,246,0.18)",
            backdropFilter: "blur(12px)",
            // boxShadow: "0 0 48px rgba(59,130,246,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h2 className="font-bold text-xl" style={{ color: "#ffffff" }}>
              Analyze Any GitHub Repository
            </h2>
          </div>

          <p className="text-sm mb-6 pl-12" style={{ color: "#475569" }}>
            Paste any public GitHub URL to get an instant architecture breakdown
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlAnalyze()}
              placeholder="https://github.com/facebook/react"
              className="flex-1 text-sm px-4 py-3.5 rounded-xl transition-all duration-200 focus:outline-none"
              style={{
                background: "rgba(7,9,14,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F1F5F9",
                caretColor: "#3B82F6",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
              }
            />
            <button
              onClick={handleUrlAnalyze}
              className="flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 whitespace-nowrap text-sm cursor-pointer"
              style={{
                background: "#3B82F6",
                color: "#ffffff",
                boxShadow: "0 0 12px rgba(59,130,246,0.3)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 17px rgba(59,130,246,0.5)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 12px rgba(59,130,246,0.3)")
              }
            >
              Analyze
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

          {urlError && (
            <p
              className="text-sm mt-3 flex items-center gap-1.5"
              style={{ color: "#F87171" }}
            >
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {urlError}
            </p>
          )}
          <p className="text-xs mt-3" style={{ color: "#1E293B" }}>
            Works with any public GitHub repository
          </p>
        </div>

        {/* ── Recently Analyzed ── */}
        {analyzedRepos.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-bold text-lg" style={{ color: "#ffffff" }}>
                Recently Analyzed
              </h2>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  color: "#60A5FA",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                {analyzedRepos.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyzedRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() =>
                    router.push(`/repo/${repo.owner}/${repo.repo}`)
                  }
                  className="rounded-xl p-5 cursor-pointer transition-all duration-200"
                  style={{
                    background: "rgba(13,19,30,0.7)",
                    border: "1px solid rgba(59,130,246,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
                    e.currentTarget.style.background = "rgba(13,19,30,0.95)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.15)";
                    e.currentTarget.style.background = "rgba(13,19,30,0.7)";
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="font-semibold text-sm truncate pr-2"
                      style={{ color: "#F1F5F9" }}
                    >
                      {repo.repo}
                    </h3>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1"
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
                  </div>

                  <p className="text-xs mb-4" style={{ color: "#334155" }}>
                    {repo.owner}/{repo.repo}
                  </p>

                  <div
                    className="flex items-center justify-between text-xs pt-3"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      color: "#475569",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {repo.file_count} files
                    </div>
                    <span>
                      {new Date(repo.analyzed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Your Repositories ── */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-bold text-lg" style={{ color: "#ffffff" }}>
              Your Repositories
            </h2>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#475569",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {repos.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() =>
                  router.push(`/repo/${repo.owner.login}/${repo.name}`)
                }
                className="rounded-xl p-5 cursor-pointer transition-all duration-200"
                style={{
                  background: "rgba(13,19,30,0.7)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                  e.currentTarget.style.background = "rgba(13,19,30,0.95)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.background = "rgba(13,19,30,0.7)";
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="font-semibold text-sm truncate pr-2"
                    style={{ color: "#F1F5F9" }}
                  >
                    {repo.name}
                  </h3>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
                    style={{
                      background: repo.private
                        ? "rgba(251,191,36,0.08)"
                        : "rgba(59,130,246,0.08)",
                      color: repo.private ? "#FCD34D" : "#60A5FA",
                      border: `1px solid ${repo.private ? "rgba(251,191,36,0.2)" : "rgba(59,130,246,0.15)"}`,
                    }}
                  >
                    {repo.private ? "Private" : "Public"}
                  </span>
                </div>

                <p
                  className="text-sm line-clamp-2 mb-4 leading-relaxed"
                  style={{ color: "#64748B" }}
                >
                  {repo.description || "No description provided"}
                </p>

                <div
                  className="flex items-center gap-4 text-xs pt-3"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    color: "#475569",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {repo.stargazers_count}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="18" r="3" />
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
                      <path d="M12 12v3" />
                    </svg>
                    {repo.forks_count}
                  </div>
                  {repo.language && (
                    <span
                      className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: "rgba(59,130,246,0.08)",
                        color: "#60A5FA",
                        border: "1px solid rgba(59,130,246,0.15)",
                      }}
                    >
                      {repo.language}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

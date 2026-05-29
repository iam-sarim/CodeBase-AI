"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status]);

  useEffect(() => {
    if (session) fetchRepos();
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
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-white font-bold text-lg">CodebaseAI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={session?.user?.image}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-gray-400 text-sm">{session?.user?.name}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-400 hover:text-white text-sm transition-colors border border-gray-700 px-3 py-1.5 rounded-lg"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* URL Input */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-10">
          <h2 className="text-white font-bold text-2xl mb-2">
            🔍 Analyze Any GitHub Repository
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Paste any public GitHub URL to get started
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlAnalyze()}
              placeholder="https://github.com/facebook/react"
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleUrlAnalyze}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 whitespace-nowrap"
            >
              Analyze →
            </button>
          </div>
          {urlError && <p className="text-red-400 text-sm mt-2">{urlError}</p>}
          <p className="text-gray-600 text-xs mt-3">
            Works with any public GitHub repository
          </p>
        </div>

        {/* Your Repos */}
        <div>
          <h2 className="text-white font-bold text-xl mb-6">
            Your Repositories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() =>
                  router.push(`/repo/${repo.owner.login}/${repo.name}`)
                }
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                    {repo.name}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                    {repo.private ? "🔒 Private" : "🌐 Public"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {repo.description || "No description provided"}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>⭐ {repo.stargazers_count}</span>
                  <span>🍴 {repo.forks_count}</span>
                  {repo.language && (
                    <span className="ml-auto text-blue-400">
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

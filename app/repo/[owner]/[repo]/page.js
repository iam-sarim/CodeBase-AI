"use client";

import MermaidDiagram from "@/app/components/MermaidDiagram";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

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

  if (status === "loading" || loading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <p className="text-white text-lg">Loading repository...</p>
          <p className="text-gray-500 text-sm">Checking analysis status</p>
        </div>
      </div>
    );
  }
  if (repoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="text-6xl">😕</div>
          <h2 className="text-white text-2xl font-bold">
            Repository Not Found
          </h2>
          <p className="text-gray-400">{repoError}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {owner}/{repo}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {repoInfo?.description || "No description"}
            </p>
          </div>
        </div>

        {/* Analyze Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold text-lg mb-2">
            🧠 AI Analysis
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Analyze this repository to enable AI-powered Q&A and architecture
            insights
          </p>
          <button
            onClick={() => handleAnalyze(false)}
            disabled={analyzing || analyzed}
            className={`font-semibold py-3 px-6 rounded-xl transition-all duration-200 
              ${
                analyzed
                  ? "bg-green-600 text-white cursor-default"
                  : analyzing
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
          >
            {analyzed
              ? "✅ Analysis Complete"
              : analyzing
                ? "Analyzing..."
                : "🧠 Analyze this Repository"}
          </button>
          {analyzeStatus && (
            <p className="text-gray-400 text-sm mt-3">{analyzeStatus}</p>
          )}
        </div>
        {analyzeStatus && (
          <p className="text-gray-400 text-sm mt-3">{analyzeStatus}</p>
        )}

        {/* Re-analyze button — only shows after analysis */}
        {analyzed && !analyzing && (
          <button
            onClick={() => handleAnalyze(true)}
            className="ml-3 text-gray-400 hover:text-white text-sm border border-gray-700 hover:border-gray-500 px-4 py-3 rounded-xl transition-all duration-200 mt-3 mb-3"
          >
            🔄 Re-analyze
          </button>
        )}

        {/* Architecture Summary */}
        {summaryLoading && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <p className="text-gray-400">Generating architecture summary...</p>
          </div>
        )}

        {summary && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 space-y-6">
            <h2 className="text-white font-semibold text-xl">
              📐 Architecture Summary
            </h2>

            {/* Overview */}
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Overview</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {summary.overview}
              </p>
            </div>

            {/* Tech Stack */}
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {summary.techStack?.map((tech, i) => (
                  <span
                    key={i}
                    className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Architecture */}
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Architecture</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {summary.architecture}
              </p>
            </div>

            {/* Folders */}
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">
                Project Structure
              </h3>
              <div className="space-y-2">
                {summary.folders?.map((folder, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-yellow-400 font-mono min-w-32">
                      {folder.name}
                    </span>
                    <span className="text-gray-400">{folder.purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Diagram */}
        {summary?.diagram && (
          <div>
            <h3 className="text-blue-400 font-semibold mb-3">
              Architecture Diagram
            </h3>
            <MermaidDiagram chart={summary.diagram} />
          </div>
        )}

        {/* Chat Button */}
        {analyzed && (
          <div className="bg-blue-900 border border-blue-700 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-2">
              💬 Chat with this Codebase
            </h2>
            <p className="text-blue-300 text-sm mb-4">
              Ask anything about this repository — architecture, functions,
              logic, anything.
            </p>
            <button
              onClick={() => router.push(`/repo/${owner}/${repo}/chat`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              💬 Start Chat
            </button>
          </div>
        )}

        {/* Files List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <p className="text-gray-400 text-sm">{files.length} files found</p>
          </div>
          <div className="divide-y divide-gray-800">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-500 text-sm">
                  {file.type === "dir" ? "📁" : "📄"}
                </span>
                <span className="text-gray-300 text-sm font-mono">
                  {file.path}
                </span>
                {file.size && (
                  <span className="text-gray-600 text-xs ml-auto">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

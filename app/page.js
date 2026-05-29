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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-white font-bold text-lg">CodebaseAI</span>
        </div>
        <button
          onClick={() => signIn("github")}
          className="bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-all text-sm"
        >
          Sign in with GitHub
        </button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        {/* Badge */}
        <div className="bg-blue-950 border border-blue-800 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          ✨ AI-Powered Codebase Understanding
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Understand any
          <span className="text-blue-400"> GitHub repo </span>
          instantly
        </h1>

        {/* Subheading */}
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Paste any GitHub repository URL and let AI analyze the entire
          codebase. Get architecture summaries, diagrams, and ask any question
          about the code.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => signIn("github")}
          className="flex items-center gap-3 bg-white text-gray-900 font-bold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-all duration-200 text-lg shadow-2xl"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub — it's free
        </button>

        <p className="text-gray-600 text-sm mt-4">No credit card required</p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mt-20 text-left">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Analyze Any Repo
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Paste any public GitHub URL and AI will read the entire codebase
              in minutes.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Ask Any Question
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ask anything — "where is auth handled?", "how does payment work?"
              — and get answers from actual code.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">📐</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Architecture Diagrams
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Get auto-generated architecture summaries and visual diagrams of
              any codebase.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 text-center">
        <p className="text-gray-600 text-sm">
          Built with Next.js, Supabase, HuggingFace and Groq
        </p>
      </footer>
    </div>
  );
}

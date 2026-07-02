# CodebaseAI

> **Understand any GitHub repository, instantly.**

CodebaseAI is an AI-powered developer tool that lets you analyze any public GitHub repository in seconds. Paste a repo URL, and the app reads the entire codebase — generating architecture summaries, visual diagrams, and an intelligent chatbot you can ask anything about the code.

**Live Demo → [codebaseai.vercel.app](https://codebaseai.vercel.app)**

---

## ✨ Features

- **🔍 Analyze Any Public Repo** — Paste any GitHub URL and AI will index the entire codebase. No cloning, no extensions, no setup.
- **📐 Architecture Summary** — Automatically generates a project overview, detected tech stack, architecture explanation, and folder-by-folder breakdown.
- **🗺️ Visual Architecture Diagrams** — Auto-generated Mermaid.js flowcharts that visualize how the major components connect.
- **💬 Codebase Chat** — Ask natural-language questions and get answers grounded in the actual source code, with cited file references.
- **🧠 Conversation Memory** — The AI remembers previous messages in a session, enabling natural multi-turn follow-up questions.
- **🔄 Smart Re-Indexing** — One-click re-analysis refreshes the AI's understanding after code changes, without creating duplicate data.
- **🕒 Recently Analyzed** — Previously analyzed repos are cached and instantly available again — no reprocessing needed.
- **🔐 GitHub OAuth** — Secure sign-in with GitHub; your own repositories are surfaced for quick one-click analysis.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS |
| **Authentication** | NextAuth.js + GitHub OAuth |
| **GitHub Integration** | Octokit (GitHub REST API) |
| **AI — Embeddings** | HuggingFace Inference API (`all-MiniLM-L6-v2`) |
| **AI — Language Model** | Groq (`llama-3.3-70b-versatile`) |
| **Vector Database** | Supabase (PostgreSQL + pgvector) |
| **Diagram Rendering** | Mermaid.js |
| **Deployment** | Vercel |

---

## 🏗️ How It Works

```
User pastes a GitHub repo URL
          ↓
GitHub API fetches all source files
          ↓
Files are split into smart chunks
          ↓
HuggingFace generates vector embeddings for each chunk
          ↓
Embeddings stored in Supabase pgvector
          ↓
Groq + Llama 3 generates architecture summary & diagram
          ↓
User asks a question
          ↓
Question is embedded → similar chunks retrieved via pgvector
          ↓
Groq answers using the actual source code as context
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [GitHub OAuth App](https://github.com/settings/developers)
- A [Google AI Studio](https://aistudio.google.com) account (for Gemini API key)
- A [HuggingFace](https://huggingface.co) account (free token)
- A [Groq](https://console.groq.com) account (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/iam-sarim/codebase-onboarding-ai.git
cd codebase-onboarding-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Code chunks table
create table code_chunks (
  id bigserial primary key,
  repo_name text not null,
  file_path text not null,
  content text not null,
  embedding vector(384),
  created_at timestamp default now()
);

create index on code_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Analyzed repos table
create table analyzed_repos (
  id bigserial primary key,
  repo_name text unique not null,
  owner text not null,
  repo text not null,
  overview text,
  tech_stack text[],
  architecture text,
  folders jsonb,
  diagram text,
  file_count int,
  analyzed_at timestamp default now(),
  updated_at timestamp default now()
);

-- Similarity search function
create or replace function match_code_chunks(
  query_embedding vector(384),
  match_repo text,
  match_count int
)
returns table(
  id bigint,
  file_path text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    code_chunks.id,
    code_chunks.file_path,
    code_chunks.content,
    1 - (code_chunks.embedding <=> query_embedding) as similarity
  from code_chunks
  where code_chunks.repo_name = match_repo
  order by code_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```bash
# Gemini (Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# NextAuth
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# HuggingFace
HUGGINGFACE_API_KEY=hf_your_token_here

# Groq
GROQ_API_KEY=gsk_your_key_here
```

> **Generate NEXTAUTH_SECRET:** Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in your terminal.

### 5. Set up GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set the callback URL to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret** into your `.env.local`

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
codebase-onboarding-ai/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # GitHub OAuth handler
│   │   ├── repos/                 # List user repos + fetch repo files
│   │   │   └── [owner]/[repo]/
│   │   │       ├── files/         # Fetch repo file tree
│   │   │       ├── summary/       # Generate/retrieve architecture summary
│   │   │       └── status/        # Check if repo has been analyzed
│   │   ├── embed/                 # RAG pipeline — embed and store repo
│   │   ├── chat/                  # Q&A chat endpoint
│   │   └── analyzed-repos/        # Recently analyzed repos list
│   ├── dashboard/                 # Main dashboard page
│   ├── repo/[owner]/[repo]/       # Repo analysis page
│   │   └── chat/                  # Codebase chat page
│   ├── components/
│   │   └── MermaidDiagram.js      # Architecture diagram renderer
│   ├── layout.js
│   ├── page.js                    # Landing page
│   ├── providers.js               # NextAuth session provider
│   └── globals.css
└── lib/
    ├── auth.js                    # NextAuth configuration
    ├── gemini.js                  # HuggingFace embeddings + Groq LLM
    ├── github.js                  # Octokit GitHub client
    └── supabase.js                # Supabase client
```

---

## 🔑 Key Design Decisions

**Provider-agnostic AI layer** — The embedding and language model providers are abstracted behind a single interface, making it easy to swap or upgrade AI providers without a rewrite.

**Shared analysis cache** — Once any user analyzes a public repository, the result is reused for every subsequent user. This avoids reprocessing popular repos repeatedly and scales efficiently.

**Client-side chat history** — Conversation history is stored in `localStorage` per repository, keeping the database lean while ensuring messages persist across sessions.

**Idempotent re-indexing** — Re-analyzing a repository cleanly deletes and replaces only that repo's data, preventing duplicate records.

---

## 🌐 Deployment

This project is designed to deploy on [Vercel](https://vercel.com) with zero configuration.

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Update your GitHub OAuth App's callback URL to `https://your-app.vercel.app/api/auth/callback/github`
5. Deploy

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request



## 👨‍💻 Author

**Muhammad Sarim Awan**
- GitHub: [@iam-sarim](https://github.com/iam-sarim)
- Portfolio: [msarimawan.vercel.app](https://msarimawan.vercel.app)
- Live Project: [codebaseai.vercel.app](https://codebaseai.vercel.app)

---

## ⭐ If you find this useful, give it a star!

Built with ❤️ using Next.js, Supabase, HuggingFace, and Groq.

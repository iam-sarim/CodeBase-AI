import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/gemini";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { question, owner, repo, history } = await request.json();

    if (!question || !owner || !repo) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Step 1 — Embed the question
    const questionEmbedding = await generateEmbedding(question);

    // Step 2 — Find most relevant code chunks
    const { data: chunks, error } = await supabase.rpc("match_code_chunks", {
      query_embedding: questionEmbedding,
      match_repo: `${owner}/${repo}`,
      match_count: 5,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Step 3 — Build context from chunks
    const context = chunks
      .map(
        (chunk) => `File: ${chunk.file_path}\n\`\`\`\n${chunk.content}\n\`\`\``,
      )
      .join("\n\n");

    // Step 4 — Build conversation history for memory
    const conversationHistory = (history || [])
      .slice(-6)
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Step 5 — Ask Groq with context + memory
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an expert code assistant helping developers understand the GitHub repository "${owner}/${repo}".

Here are the most relevant code snippets for the current question:

${context}

Use this code context to answer questions accurately. Reference specific files and functions when relevant. If the answer is not in the provided code, say so honestly. Remember the conversation history to provide contextual follow-up answers.`,
        },
        ...conversationHistory,
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    return Response.json({
      answer,
      sources: chunks.map((c) => c.file_path),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

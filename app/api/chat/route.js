import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateEmbedding, generateAnswer } from "@/lib/gemini";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { question, owner, repo } = await request.json();

    if (!question || !owner || !repo) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Step 1 — Embed the question
    const questionEmbedding = await generateEmbedding(question);

    console.log("Question embedding length:", questionEmbedding.length);
    console.log("Repo name being searched:", `${owner}/${repo}`);

    // Step 2 — Find most relevant code chunks from Supabase
    const { data: chunks, error } = await supabase.rpc("match_code_chunks", {
      query_embedding: questionEmbedding,
      match_repo: `${owner}/${repo}`,
      match_count: 5,
    });

    console.log("Supabase error:", error);

    console.log("Chunks found:", chunks?.length);
    console.log("First chunk:", chunks?.[0]);

    if (error) {
      console.error("Supabase search error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Step 3 — Build context from relevant chunks
    const context = chunks
      .map(
        (chunk) => `File: ${chunk.file_path}\n\`\`\`\n${chunk.content}\n\`\`\``,
      )
      .join("\n\n");

    // Step 4 — Ask Groq with the context
    const prompt = `You are an expert code assistant helping developers understand a GitHub repository.

Here are the most relevant code snippets from the repository "${owner}/${repo}":

${context}

Based on the code above, please answer this question:
${question}

Be specific and reference the actual code when answering. If the answer is not in the provided code snippets, say so honestly.`;

    const answer = await generateAnswer(prompt);

    return Response.json({
      answer,
      sources: chunks.map((c) => c.file_path),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

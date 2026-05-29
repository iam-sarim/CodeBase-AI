import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateAnswer } from "@/lib/gemini";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const { owner, repo } = await params;

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get a sample of chunks from the repo
    const { data: chunks, error } = await supabase
      .from("code_chunks")
      .select("file_path, content")
      .eq("repo_name", `${owner}/${repo}`)
      .limit(20);

    if (error) throw error;

    if (!chunks || chunks.length === 0) {
      return Response.json(
        {
          error: "No data found. Please analyze the repository first.",
        },
        { status: 404 },
      );
    }

    // Build context from chunks
    const fileList = [...new Set(chunks.map((c) => c.file_path))].join("\n");
    const codeContext = chunks
      .slice(0, 10)
      .map((c) => `File: ${c.file_path}\n${c.content}`)
      .join("\n\n");

    // Generate architecture summary
    const prompt = `You are an expert software architect. Analyze this GitHub repository and provide a structured summary.

Repository: ${owner}/${repo}

Files in repository:
${fileList}

Code samples:
${codeContext}

Please provide a JSON response with exactly this structure (no markdown, pure JSON):
{
  "overview": "2-3 sentence description of what this project does",
  "techStack": ["technology1", "technology2", "technology3"],
  "architecture": "2-3 sentences about the project architecture and structure",
  "folders": [
    {"name": "folder or file name", "purpose": "what it does"}
  ],
  "diagram": "graph TD\\n A[User] --> B[Frontend]\\n B --> C[Backend]\\n C --> D[Database]"
}

For the diagram field, create a Mermaid.js flowchart showing the main components and how they connect.
Return ONLY the JSON, no other text.`;

    const answer = await generateAnswer(prompt);

    // Clean and parse JSON
    const cleaned = answer
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const summary = JSON.parse(cleaned);

    return Response.json(summary);
  } catch (error) {
    console.error("Summary error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOctokit } from "@/lib/github";
import { supabase } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/gemini";

const ALLOWED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".cs",
  ".go",
  ".rb",
  ".php",
  ".swift",
  ".kt",
  ".rs",
  ".vue",
  ".html",
  ".css",
  ".scss",
  ".md",
  ".json",
  ".yaml",
  ".yml",
];

const IGNORED_PATHS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
  "__pycache__",
  ".venv",
];

function shouldProcessFile(filePath) {
  const hasIgnoredPath = IGNORED_PATHS.some((ignored) =>
    filePath.includes(ignored),
  );
  if (hasIgnoredPath) return false;
  return ALLOWED_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

function chunkContent(content, filePath, chunkSize = 1500) {
  const chunks = [];
  const lines = content.split("\n");
  let currentChunk = "";
  let chunkIndex = 0;

  for (const line of lines) {
    if ((currentChunk + line).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        file_path: filePath,
        chunk_index: chunkIndex,
      });
      currentChunk = line + "\n";
      chunkIndex++;
    } else {
      currentChunk += line + "\n";
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      file_path: filePath,
      chunk_index: chunkIndex,
    });
  }

  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, forceReanalyze } = await request.json();

    if (!owner || !repo) {
      return Response.json(
        { error: "Owner and repo are required" },
        { status: 400 },
      );
    }

    const repoName = `${owner}/${repo}`;

    // Check if already analyzed
    if (!forceReanalyze) {
      const { data: existing } = await supabase
        .from("analyzed_repos")
        .select("id, analyzed_at, file_count")
        .eq("repo_name", repoName)
        .single();

      if (existing) {
        return Response.json({
          success: true,
          alreadyAnalyzed: true,
          processedFiles: existing.file_count,
          message: `Repository already analyzed on ${new Date(existing.analyzed_at).toLocaleDateString()}`,
        });
      }
    }

    const octokit = getOctokit(session.accessToken);

    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "true",
    });

    const filesToProcess = tree.tree.filter(
      (item) => item.type === "blob" && shouldProcessFile(item.path),
    );

    // Delete old chunks
    await supabase.from("code_chunks").delete().eq("repo_name", repoName);

    let processedCount = 0;

    for (const file of filesToProcess) {
      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        if (!fileData.content || fileData.size > 100000) continue;

        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8",
        );
        if (content.trim().length === 0) continue;

        const chunks = chunkContent(content, file.path);

        for (const chunk of chunks) {
          const embedding = await generateEmbedding(chunk.content);
          await sleep(200);

          await supabase.from("code_chunks").insert({
            repo_name: repoName,
            file_path: chunk.file_path,
            content: chunk.content,
            embedding,
          });
        }

        processedCount++;
      } catch (fileError) {
        console.error(`Error processing file ${file.path}:`, fileError.message);
        continue;
      }
    }

    // Mark repo as analyzed
    await supabase.from("analyzed_repos").upsert(
      {
        repo_name: repoName,
        owner,
        repo,
        file_count: processedCount,
        analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "repo_name" },
    );

    return Response.json({
      success: true,
      alreadyAnalyzed: false,
      processedFiles: processedCount,
      totalFiles: filesToProcess.length,
      message: `Successfully analyzed ${processedCount} files`,
    });
  } catch (error) {
    console.error("Embed error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

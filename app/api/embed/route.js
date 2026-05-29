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
  ".env.example",
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
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) =>
    filePath.endsWith(ext),
  );
  return hasAllowedExt;
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

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo } = await request.json();

    if (!owner || !repo) {
      return Response.json(
        { error: "Owner and repo are required" },
        { status: 400 },
      );
    }

    const octokit = getOctokit(session.accessToken);

    // Step 1 - Get all files in the repo
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "true",
    });

    const filesToProcess = tree.tree.filter(
      (item) => item.type === "blob" && shouldProcessFile(item.path),
    );

    // Step 2 - Delete old chunks for this repo if re-analyzing
    await supabase
      .from("code_chunks")
      .delete()
      .eq("repo_name", `${owner}/${repo}`);

    // Step 3 - Fetch content, chunk, embed and store
    let processedCount = 0;
    console.log(`Found ${filesToProcess.length} files to process`);

    for (const file of filesToProcess) {
      try {
        console.log(`Processing: ${file.path}`);

        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        if (!fileData.content || fileData.size > 100000) {
          console.log(`Skipping ${file.path} - too large or no content`);
          continue;
        }

        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8",
        );

        if (content.trim().length === 0) {
          console.log(`Skipping ${file.path} - empty file`);
          continue;
        }

        const chunks = chunkContent(content, file.path);
        console.log(`${file.path} → ${chunks.length} chunks`);

        for (const chunk of chunks) {
          console.log(`Embedding chunk from ${file.path}...`);
          const embedding = await generateEmbedding(chunk.content);
          console.log(`Embedding generated, length: ${embedding.length}`);

          const { error } = await supabase.from("code_chunks").insert({
            repo_name: `${owner}/${repo}`,
            file_path: chunk.file_path,
            content: chunk.content,
            embedding,
          });

          if (error) {
            console.error(`Supabase insert error:`, error);
          } else {
            console.log(`Stored chunk from ${file.path} ✅`);
          }
        }

        processedCount++;
      } catch (fileError) {
        console.error(`Error processing file ${file.path}:`, fileError.message);
        continue;
      }
    }

    return Response.json({
      success: true,
      processedFiles: processedCount,
      totalFiles: filesToProcess.length,
      message: `Successfully analyzed ${processedCount} files`,
    });
  } catch (error) {
    console.error("Embed error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

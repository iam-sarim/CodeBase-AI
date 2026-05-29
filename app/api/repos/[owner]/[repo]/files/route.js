import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOctokit } from "@/lib/github";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const { owner, repo } = await params;

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const octokit = getOctokit(session.accessToken);

    const { data: repoInfo } = await octokit.repos.get({
      owner,
      repo,
    });

    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "true",
    });

    const files = tree.tree.filter(
      (item) =>
        item.type === "blob" &&
        !item.path.includes("node_modules") &&
        !item.path.includes(".git") &&
        !item.path.includes("package-lock.json"),
    );

    return Response.json({ files, repoInfo });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

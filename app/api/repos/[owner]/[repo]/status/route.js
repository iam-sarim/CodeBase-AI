import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const { owner, repo } = await params;

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("analyzed_repos")
    .select("analyzed_at, file_count")
    .eq("repo_name", `${owner}/${repo}`)
    .single();

  if (data) {
    return Response.json({
      data: {
        analyzed: true,
        analyzedAt: data.analyzed_at,
        fileCount: data.file_count,
      },
    });
  }

  return Response.json({ data: { analyzed: false } });
}

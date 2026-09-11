const API = "https://api.vercel.com";

export type DeployStatus =
  | { configured: false; reason: string; dashboardUrl: string | null }
  | {
      configured: true;
      state: string;
      createdAt: number | null;
      readyAt: number | null;
      durationMs: number | null;
      target: string | null;
      url: string | null;
      commitSha: string | null;
      commitMessage: string | null;
      branch: string | null;
      errorMessage: string | null;
      inspectorUrl: string | null;
      dashboardUrl: string | null;
    };

/** يقرأ آخر عملية نشر (Redeploy) من Vercel ويرجع حالتها ورابط السجلات */
export async function fetchLastDeployment(): Promise<DeployStatus> {
  const token = process.env["VERCEL_TOKEN"];
  const projectId = process.env["VERCEL_PROJECT_ID"];
  const teamId = process.env["VERCEL_TEAM_ID"];
  const dashboardUrl = projectId
    ? `https://vercel.com/dashboard?projectId=${encodeURIComponent(projectId)}`
    : null;

  if (!token || !projectId) {
    return {
      configured: false,
      reason: !token
        ? "لم يتم ضبط مفتاح Vercel (VERCEL_TOKEN)."
        : "لم يتم ضبط معرّف مشروع Vercel (VERCEL_PROJECT_ID).",
      dashboardUrl,
    };
  }

  const params = new URLSearchParams({ projectId, limit: "1" });
  if (teamId) params.set("teamId", teamId);

  const res = await fetch(`${API}/v6/deployments?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`vercel_api_${res.status}`);

  const json = (await res.json()) as { deployments?: any[] };
  const d = json.deployments?.[0];
  if (!d) {
    return { configured: false, reason: "لا توجد عمليات نشر بعد لهذا المشروع.", dashboardUrl };
  }

  const meta = d.meta ?? {};
  const created = d.createdAt ?? d.created ?? null;
  const ready = d.ready ?? null;

  return {
    configured: true,
    state: String(d.state ?? d.readyState ?? "UNKNOWN"),
    createdAt: created,
    readyAt: ready,
    durationMs: created && ready ? ready - created : null,
    target: d.target ?? null,
    url: d.url ? `https://${d.url}` : null,
    commitSha: (meta.githubCommitSha ?? meta.gitlabCommitSha ?? meta.bitbucketCommitSha ?? null) as
      string | null,
    commitMessage: (meta.githubCommitMessage ??
      meta.gitlabCommitMessage ??
      meta.bitbucketCommitMessage ??
      null) as string | null,
    branch: (meta.githubCommitRef ?? meta.gitlabCommitRef ?? meta.bitbucketCommitRef ?? null) as
      string | null,
    errorMessage: d.errorMessage ?? null,
    inspectorUrl: d.inspectorUrl ?? (d.url ? `https://${d.url}/_logs` : null),
    dashboardUrl,
  };
}

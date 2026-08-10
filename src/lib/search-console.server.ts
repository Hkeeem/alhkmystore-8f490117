// Google Search Console access through the Lovable connector gateway.
// Server-only: never import from client code.

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

function headers() {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const connectionApiKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableApiKey || !connectionApiKey) {
    throw new Error("search_console_not_connected");
  }
  return {
    Authorization: `Bearer ${lovableApiKey}`,
    "X-Connection-Api-Key": connectionApiKey,
  };
}

async function gatewayFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    console.error(`GSC gateway failed [${response.status}]: ${body}`);
    throw new Error(`gsc_request_failed_${response.status}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

export async function listVerifiedProperties(targetUrl: string): Promise<string[]> {
  const json = (await gatewayFetch("/webmasters/v3/sites")) as { siteEntry?: SiteEntry[] };
  const target = new URL(targetUrl);
  return (json.siteEntry ?? [])
    .filter((e) => e.permissionLevel !== "siteUnverifiedUser" && coversTarget(e.siteUrl, target))
    .map((e) => e.siteUrl);
}

export type SitemapRow = {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  errors: number;
  warnings: number;
  submitted: number;
  indexed: number;
  isPending: boolean;
};

export async function listSitemaps(siteUrl: string): Promise<SitemapRow[]> {
  const json = (await gatewayFetch(
    `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
  )) as {
    sitemap?: Array<{
      path?: string;
      lastSubmitted?: string;
      lastDownloaded?: string;
      errors?: string;
      warnings?: string;
      isPending?: boolean;
      contents?: Array<{ submitted?: string; indexed?: string }>;
    }>;
  };
  return (json.sitemap ?? []).map((s) => {
    const contents = s.contents ?? [];
    return {
      path: s.path ?? "",
      lastSubmitted: s.lastSubmitted ?? null,
      lastDownloaded: s.lastDownloaded ?? null,
      errors: Number(s.errors ?? 0),
      warnings: Number(s.warnings ?? 0),
      submitted: contents.reduce((sum, c) => sum + Number(c.submitted ?? 0), 0),
      indexed: contents.reduce((sum, c) => sum + Number(c.indexed ?? 0), 0),
      isPending: Boolean(s.isPending),
    };
  });
}

export type InspectionRow = {
  url: string;
  verdict: string;
  coverageState: string;
  lastCrawlTime: string | null;
  robotsTxtState: string;
  indexingState: string;
  isIndexed: boolean;
  error?: string;
};

export async function inspectUrls(siteUrl: string, urls: string[]): Promise<InspectionRow[]> {
  const rows: InspectionRow[] = [];
  for (const url of urls) {
    try {
      const json = (await gatewayFetch("/v1/urlInspection/index:inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionUrl: url, siteUrl }),
      })) as {
        inspectionResult?: {
          indexStatusResult?: {
            verdict?: string;
            coverageState?: string;
            lastCrawlTime?: string;
            robotsTxtState?: string;
            indexingState?: string;
          };
        };
      };
      const r = json.inspectionResult?.indexStatusResult ?? {};
      rows.push({
        url,
        verdict: r.verdict ?? "VERDICT_UNSPECIFIED",
        coverageState: r.coverageState ?? "—",
        lastCrawlTime: r.lastCrawlTime ?? null,
        robotsTxtState: r.robotsTxtState ?? "—",
        indexingState: r.indexingState ?? "—",
        isIndexed: r.verdict === "PASS",
      });
    } catch (error) {
      rows.push({
        url,
        verdict: "ERROR",
        coverageState: "—",
        lastCrawlTime: null,
        robotsTxtState: "—",
        indexingState: "—",
        isIndexed: false,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }
  return rows;
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Minimal typing shim for editor/tsserver environments that don't load Deno globals.
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

type SocialImageResult = {
  sourceUrl: string;
  imageUrl: string | null;
};

type RequestBody = {
  sources?: string[];
  urls?: string[];
  sourceUrl?: string;
  url?: string;
};

// Shared secret token (hard-coded as requested). Keep private.
const SOCIAL_IMAGE_TOKEN = "cmlnX_4jzR0y5G7q1s3cJmV0dZQpYdJ0aT0kK6R3bWw";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "x-client-info, apikey, content-type, x-social-image-token",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getProvidedToken(req: Request): string | null {
  const headerToken = req.headers.get("x-social-image-token");
  return headerToken?.trim() || null;
}

function requireToken(req: Request): { ok: true } | { ok: false; response: Response } {
  const provided = getProvidedToken(req);
  if (!provided || provided !== SOCIAL_IMAGE_TOKEN) {
    return {
      ok: false,
      response: jsonResponse(
        {
          success: false,
          error: "Unauthorized",
          details: "Provide a valid x-social-image-token header",
        },
        401,
      ),
    };
  }

  return { ok: true };
}

function normalizeSources(body: RequestBody): string[] {
  const list = body.sources ?? body.urls ?? [];
  const single = body.sourceUrl ?? body.url;
  const combined = [...list, ...(single ? [single] : [])]
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean);

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const u of combined) {
    if (!seen.has(u)) {
      seen.add(u);
      unique.push(u);
    }
  }
  return unique;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extractFromDom(html: string, baseUrl: string): string | null {
  // DOMParser is available in Supabase Edge runtime; keep a safe fallback just in case.
  if (typeof DOMParser === "undefined") return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return null;

  const metaCandidates: Array<{ selector: string; attr: string }> = [
    { selector: 'meta[property="og:image"]', attr: "content" },
    { selector: 'meta[name="og:image"]', attr: "content" },
    { selector: 'meta[name="twitter:image"]', attr: "content" },
    { selector: 'meta[property="twitter:image"]', attr: "content" },
    { selector: 'meta[name="twitter:image:src"]', attr: "content" },
    { selector: 'link[rel="image_src"]', attr: "href" },
  ];

  for (const c of metaCandidates) {
    const el = doc.querySelector(c.selector);
    const raw = el?.getAttribute(c.attr)?.trim();
    if (!raw) continue;

    try {
      return new URL(raw, baseUrl).toString();
    } catch {
      // ignore
    }
  }

  return null;
}

function extractFromHtmlRegex(html: string, baseUrl: string): string | null {
  const patterns: RegExp[] = [
    /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i,
    /<meta\s+[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["'][^>]*>/i,
    /<link\s+[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["'][^>]*>/i,
    /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']image_src["'][^>]*>/i,
  ];

  for (const re of patterns) {
    const match = html.match(re);
    const raw = match?.[1]?.trim();
    if (!raw) continue;

    try {
      return new URL(raw, baseUrl).toString();
    } catch {
      // ignore
    }
  }

  return null;
}

async function fetchSocialImage(sourceUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(sourceUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; SupabaseEdgeFunction/1.0)",
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    // Many news sites respond with text/html; if they don’t, we can still try parsing.
    const html = await res.text();
    if (!html || html.length < 50) return null;

    const baseUrl = res.url || sourceUrl;

    // Prefer DOM parsing, then fallback to regex.
    const fromDom = extractFromDom(html, baseUrl);
    if (fromDom) return fromDom;

    const fromRegex = extractFromHtmlRegex(html, baseUrl);
    if (fromRegex) return fromRegex;

    // A very small heuristic: if content-type isn’t HTML and no tags found, return null.
    if (!contentType.toLowerCase().includes("html")) return null;

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed", details: "Use POST" },
      405,
    );
  }

  const tokenCheck = requireToken(req);
  if (!tokenCheck.ok) return tokenCheck.response;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse(
      { success: false, error: "Invalid JSON", details: "Body must be JSON" },
      400,
    );
  }

  const sources = normalizeSources(body);
  if (sources.length === 0) {
    return jsonResponse(
      {
        success: false,
        error: "Missing sources",
        details: "Provide { sources: string[] } (or { urls: string[] })",
      },
      400,
    );
  }

  if (sources.length > 50) {
    return jsonResponse(
      {
        success: false,
        error: "Too many sources",
        details: "Max 50 URLs per request",
      },
      400,
    );
  }

  const invalid = sources.filter((u) => !isValidHttpUrl(u));
  if (invalid.length > 0) {
    return jsonResponse(
      {
        success: false,
        error: "Invalid URL(s)",
        details: `Invalid: ${invalid.slice(0, 5).join(", ")}${invalid.length > 5 ? "..." : ""}`,
      },
      400,
    );
  }

  const results: SocialImageResult[] = await Promise.all(
    sources.map(async (sourceUrl) => ({
      sourceUrl,
      imageUrl: await fetchSocialImage(sourceUrl),
    })),
  );

  return jsonResponse({ success: true, results });
});

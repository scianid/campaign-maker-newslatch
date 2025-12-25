import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export type CoreArticle = {
  url?: string | null;
  [key: string]: unknown;
};

function normalizeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
    return null;
  } catch {
    return null;
  }
}

function parseTagAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};

  // Handles key="value" and key='value'.
  const re = /([\w:-]+)\s*=\s*(["'])(.*?)\2/g;
  for (const match of tag.matchAll(re)) {
    const key = match[1]?.toLowerCase();
    const val = match[3] ?? '';
    if (key) attrs[key] = val;
  }

  return attrs;
}

function resolveMaybeRelativeUrl(raw: string, baseUrl: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:')) return null;

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractSocialImageUrl(html: string, pageUrl: string): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  const metaCandidates: Array<{ key: string; contentKey: string }> = [
    { key: 'og:image:secure_url', contentKey: 'content' },
    { key: 'og:image', contentKey: 'content' },
    { key: 'twitter:image', contentKey: 'content' },
    { key: 'twitter:image:src', contentKey: 'content' },
  ];

  for (const { key, contentKey } of metaCandidates) {
    for (const tag of metaTags) {
      const attrs = parseTagAttributes(tag);
      const prop = (attrs.property ?? '').toLowerCase();
      const name = (attrs.name ?? '').toLowerCase();

      if (prop !== key && name !== key) continue;

      const content = attrs[contentKey];
      if (!content) continue;

      const resolved = resolveMaybeRelativeUrl(content, pageUrl);
      if (resolved) return resolved;
    }
  }

  // Fallback: <link rel="image_src" href="...">
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    const attrs = parseTagAttributes(tag);
    const rel = (attrs.rel ?? '').toLowerCase();
    if (rel !== 'image_src') continue;

    const href = attrs.href;
    if (!href) continue;

    const resolved = resolveMaybeRelativeUrl(href, pageUrl);
    if (resolved) return resolved;
  }

  return null;
}

async function fetchTextWithTimeout(
  url: string,
  opts: { timeoutMs: number; signal?: AbortSignal },
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), opts.timeoutMs);

  const combinedSignal = opts.signal
    ? AbortSignal.any([opts.signal, controller.signal])
    : controller.signal;

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: combinedSignal,
      headers: {
        // Some sites block default edge-runtime UA; this helps a bit.
        'User-Agent': 'Mozilla/5.0 (compatible; SupabaseEdge/1.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function firstSocialImageFromCoreArticles(
  coreArticles: CoreArticle[],
  opts?: { maxCandidates?: number; perRequestTimeoutMs?: number },
): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  const perRequestTimeoutMs = opts?.perRequestTimeoutMs ?? 7000;
  const maxCandidates = Math.max(1, Math.min(opts?.maxCandidates ?? 10, 30));

  const urls = coreArticles
    .map((a) => normalizeHttpUrl(a?.url))
    .filter((u): u is string => Boolean(u));

  const uniqueUrls = Array.from(new Set(urls)).slice(0, maxCandidates);
  if (uniqueUrls.length === 0) return null;

  const controllers = uniqueUrls.map(() => new AbortController());

  const tasks = uniqueUrls.map((sourceUrl, index) => (async () => {
    const html = await fetchTextWithTimeout(sourceUrl, {
      timeoutMs: perRequestTimeoutMs,
      signal: controllers[index].signal,
    });

    const imageUrl = extractSocialImageUrl(html, sourceUrl);
    if (!imageUrl) {
      throw new Error('No social image found');
    }

    return { imageUrl, sourceUrl, index };
  })());

  try {
    const winner = await Promise.any(tasks);

    // Abort the rest.
    for (let i = 0; i < controllers.length; i++) {
      if (i !== winner.index) controllers[i].abort('winner-selected');
    }

    return { imageUrl: winner.imageUrl, sourceUrl: winner.sourceUrl };
  } catch {
    // All failed.
    return null;
  }
}

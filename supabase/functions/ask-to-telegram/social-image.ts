import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export type CoreArticle = {
  url?: string | null;
  [key: string]: unknown;
};

export type DownloadedImage = {
  sourceUrl: string;
  imageUrl: string;
  bytes: Uint8Array;
  contentType: string;
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

function isLikelyImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return ct.startsWith('image/');
}

async function readStreamWithLimit(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel('max-bytes');
      } catch {
        // ignore
      }
      throw new Error(`Image too large (${total} bytes > ${maxBytes})`);
    }

    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function downloadImageWithTimeout(
  imageUrl: string,
  opts: { timeoutMs: number; maxBytes: number; signal?: AbortSignal },
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), opts.timeoutMs);

  const combinedSignal = opts.signal
    ? AbortSignal.any([opts.signal, controller.signal])
    : controller.signal;

  try {
    const res = await fetch(imageUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: combinedSignal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SupabaseEdge/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!isLikelyImageContentType(contentType)) {
      throw new Error(`Not an image (content-type=${contentType || 'unknown'})`);
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength) {
      const parsed = Number(contentLength);
      if (Number.isFinite(parsed) && parsed > opts.maxBytes) {
        throw new Error(`Image too large (content-length=${parsed} > ${opts.maxBytes})`);
      }
    }

    if (!res.body) {
      // Fallback if body isn't a stream.
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > opts.maxBytes) {
        throw new Error(`Image too large (${buf.byteLength} bytes > ${opts.maxBytes})`);
      }
      return { bytes: buf, contentType };
    }

    const bytes = await readStreamWithLimit(res.body, opts.maxBytes);
    return { bytes, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

export async function firstSocialImageFromCoreArticles(
  coreArticles: CoreArticle[],
  opts?: { maxCandidates?: number; perRequestTimeoutMs?: number },
): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  const perRequestTimeoutMs = opts?.perRequestTimeoutMs ?? 25000;
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

export async function firstDownloadedSocialImageFromCoreArticles(
  coreArticles: CoreArticle[],
  opts?: {
    maxCandidates?: number;
    perPageTimeoutMs?: number;
    perImageTimeoutMs?: number;
    maxImageBytes?: number;
  },
): Promise<DownloadedImage | null> {
  const perPageTimeoutMs = opts?.perPageTimeoutMs ?? 25000;
  const perImageTimeoutMs = opts?.perImageTimeoutMs ?? 15000;
  const maxImageBytes = opts?.maxImageBytes ?? 8_000_000;
  const maxCandidates = Math.max(1, Math.min(opts?.maxCandidates ?? 10, 30));

  const urls = coreArticles
    .map((a) => normalizeHttpUrl(a?.url))
    .filter((u): u is string => Boolean(u));

  const uniqueUrls = Array.from(new Set(urls)).slice(0, maxCandidates);
  if (uniqueUrls.length === 0) return null;

  const controllers = uniqueUrls.map(() => new AbortController());

  const tasks = uniqueUrls.map((sourceUrl, index) => (async () => {
    const html = await fetchTextWithTimeout(sourceUrl, {
      timeoutMs: perPageTimeoutMs,
      signal: controllers[index].signal,
    });

    const imageUrl = extractSocialImageUrl(html, sourceUrl);
    if (!imageUrl) {
      throw new Error('No social image found');
    }

    const downloaded = await downloadImageWithTimeout(imageUrl, {
      timeoutMs: perImageTimeoutMs,
      maxBytes: maxImageBytes,
      signal: controllers[index].signal,
    });

    return {
      sourceUrl,
      imageUrl,
      bytes: downloaded.bytes,
      contentType: downloaded.contentType,
      index,
    };
  })());

  try {
    const winner = await Promise.any(tasks);

    // Abort the rest.
    for (let i = 0; i < controllers.length; i++) {
      if (i !== winner.index) controllers[i].abort('winner-selected');
    }

    return {
      sourceUrl: winner.sourceUrl,
      imageUrl: winner.imageUrl,
      bytes: winner.bytes,
      contentType: winner.contentType,
    };
  } catch {
    return null;
  }
}

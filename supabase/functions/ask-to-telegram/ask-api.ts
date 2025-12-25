import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

const ASK_API_SUBMIT_URL = 'http://34.165.46.113:8080/api/v1/ask';
const ASK_API_STATUS_BASE_URL = 'http://34.165.46.113:8080/api/v1/ask';

export interface AskSubmitResponse {
  queryId: string;
  status: string;
  message?: string;
}

export interface AskCompletedResponse {
  queryId?: string;
  status: string;
  progress?: unknown;
  result?: {
    answer?: string;
    coreArticles?: Array<{
      url?: string | null;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export class AskApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'AskApiError';
    this.status = status;
    this.body = body;
  }
}

async function readResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}

function buildStatusUrl(queryId: string): string {
  const normalizedBase = ASK_API_STATUS_BASE_URL.endsWith('/')
    ? ASK_API_STATUS_BASE_URL.slice(0, -1)
    : ASK_API_STATUS_BASE_URL;
  return `${normalizedBase}/${encodeURIComponent(queryId)}/status`;
}

export async function submitQuestion(
  question: string,
  includeSources: boolean,
  inboundApiKey?: string,
): Promise<AskSubmitResponse> {
  const headers = (apiKey?: string): HeadersInit =>
    apiKey ? { 'x-api-key': apiKey } : {};

  const res = await fetch(ASK_API_SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers(inboundApiKey) },
    body: JSON.stringify({ question, includeSources }),
  });

  const body = await readResponseBody(res);
  const data = body as AskSubmitResponse;

  if (!res.ok) {
    throw new AskApiError('ASK submit failed', res.status, body);
  }

  if (!data?.queryId) {
    throw new Error(`ASK submit response missing queryId: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function pollUntilCompleted(
  queryId: string,
  opts: { timeoutMs: number; pollIntervalMs: number },
  inboundApiKey?: string,
): Promise<AskCompletedResponse> {
  const startedAt = Date.now();
  let lastBody: unknown = null;
  let lastStatus: string | null = null;

  const fetchStatus = async (): Promise<{ res: Response; body: unknown; data: AskCompletedResponse }> => {
    const statusUrl = buildStatusUrl(queryId);
    const res = await fetch(statusUrl, {
      method: 'GET',
      headers: inboundApiKey ? { 'x-api-key': inboundApiKey } : undefined,
    });
    const body = await readResponseBody(res);
    const data = body as AskCompletedResponse;
    return { res, body, data };
  };

  while (true) {
    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs > opts.timeoutMs) {
      throw new AskApiError('ASK status timeout', 504, {
        queryId,
        elapsedMs,
        timeoutMs: opts.timeoutMs,
        pollIntervalMs: opts.pollIntervalMs,
        lastStatus,
        lastBody,
      });
    }

    const { res, body, data } = await fetchStatus();
    lastBody = body;
    lastStatus = typeof data?.status === 'string' ? data.status : null;

    if (!res.ok) {
      throw new AskApiError('ASK status failed', res.status, body);
    }

    if (data.status === 'COMPLETED') {
      const coreArticles = data?.result?.coreArticles;
      const hasCoreArticles = Array.isArray(coreArticles) && coreArticles.length > 0;

      // ASK sometimes marks COMPLETED before delayed fields (like coreArticles) are populated.
      // Wait 5s and re-fetch once to pick up the remaining data.
      if (!hasCoreArticles) {
        const remainingMs = opts.timeoutMs - (Date.now() - startedAt);
        if (remainingMs > 0) {
          const delayMs = Math.min(5000, remainingMs);
          await new Promise((r) => setTimeout(r, delayMs));
        }

        const retryElapsedMs = Date.now() - startedAt;
        if (retryElapsedMs <= opts.timeoutMs) {
          const retry = await fetchStatus();
          lastBody = retry.body;
          lastStatus = typeof retry.data?.status === 'string' ? retry.data.status : null;

          if (!retry.res.ok) {
            throw new AskApiError('ASK status failed', retry.res.status, retry.body);
          }

          if (retry.data?.status === 'COMPLETED') {
            return retry.data;
          }

          if (retry.data?.status === 'FAILED') {
            throw new Error(`ASK query FAILED: ${JSON.stringify(retry.data)}`);
          }

          // If it regressed to non-terminal status, continue polling normally.
        }
      }

      return data;
    }

    if (data.status === 'FAILED') {
      throw new Error(`ASK query FAILED: ${JSON.stringify(data)}`);
    }

    await new Promise((r) => setTimeout(r, opts.pollIntervalMs));
  }
}

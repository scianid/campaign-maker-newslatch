import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
}

const PROXY_BASE = 'https://moshemaman7.wixsite.com/keep-them-alive/_functions/'

const defaultCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

function corsHeadersFor(req: Request): Record<string, string> {
  const requestedHeaders = req.headers.get('access-control-request-headers')
  if (!requestedHeaders) return defaultCorsHeaders

  return {
    ...defaultCorsHeaders,
    'Access-Control-Allow-Headers': requestedHeaders,
  }
}

const allowedMethods = new Set(['OPTIONS', 'GET', 'POST', 'PATCH', 'DELETE'])

const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

function buildTargetUrl(requestUrl: URL): URL {
  const target = new URL(PROXY_BASE)

  const prefix = '/task-service'
  let restPath = requestUrl.pathname

  if (restPath === prefix) {
    restPath = ''
  } else if (restPath.startsWith(prefix + '/')) {
    restPath = restPath.slice(prefix.length + 1)
  }

  const basePath = target.pathname.endsWith('/')
    ? target.pathname
    : target.pathname + '/'
  const cleanedRest = restPath.replace(/^\/+/, '')

  target.pathname = basePath + cleanedRest
  target.search = requestUrl.search

  return target
}

function copyRequestHeaders(req: Request): Headers {
  const out = new Headers()

  for (const [key, value] of req.headers.entries()) {
    const lower = key.toLowerCase()
    if (hopByHopHeaders.has(lower)) continue
    if (lower === 'host') continue
    if (lower === 'content-length') continue

    out.set(key, value)
  }

  return out
}

function copyResponseHeaders(upstream: Response): Headers {
  const out = new Headers()

  for (const [key, value] of upstream.headers.entries()) {
    const lower = key.toLowerCase()
    if (hopByHopHeaders.has(lower)) continue

    out.set(key, value)
  }

  return out
}

Deno.serve(async (req: Request) => {
  const method = req.method.toUpperCase()
  const corsHeaders = corsHeadersFor(req)

  if (!allowedMethods.has(method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  const requestUrl = new URL(req.url)
  const targetUrl = buildTargetUrl(requestUrl)

  try {
    const outboundHeaders = copyRequestHeaders(req)
    outboundHeaders.set('x-forwarded-method', method)
    outboundHeaders.set(
      'x-forwarded-proto',
      requestUrl.protocol.replace(':', '')
    )
    outboundHeaders.set('x-forwarded-host', requestUrl.host)
    outboundHeaders.set('x-forwarded-path', requestUrl.pathname)

    const upstream = await fetch(targetUrl, {
      method,
      headers: outboundHeaders,
      body: method === 'GET' ? undefined : req.body,
    })

    const responseHeaders = copyResponseHeaders(upstream)
    for (const [k, v] of Object.entries(corsHeaders)) responseHeaders.set(k, v)

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Bad gateway',
        message: error instanceof Error ? error.message : 'Unknown error',
        target: targetUrl.toString(),
      }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

export type HTTPMethods = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type HTTPSearchParams = URLSearchParams | Record<string, string>

export type HTTPHeaders = Record<string, string>

export type Fetch = (url: RequestInfo, init?: RequestInit) => Promise<Response>

export type HTTPClient = { fetch: Fetch }

export const isMultipartBody = (body: any): body is MultipartBody => {
  return body && typeof body === 'object' && body.body && body[Symbol.toStringTag] === 'MultipartBody'
}

export class MultipartBody {
  constructor(public body: any) {}
  get [Symbol.toStringTag](): string {
    return 'MultipartBody'
  }
}

export function mergeHTTPSearchParams(
  target: HTTPSearchParams | undefined | null,
  source: HTTPSearchParams | undefined | null,
) {
  const sourceQuery = new URLSearchParams(source || [])
  const targetQuery = new URLSearchParams(target || [])

  sourceQuery.forEach((value, key) => {
    if (targetQuery.has(key)) return

    targetQuery.set(key, value)
  })

  return targetQuery
}

export function calculateContentLength(body: unknown): string | null {
  if (typeof body === 'string') {
    if (typeof Buffer !== 'undefined') {
      return Buffer.byteLength(body, 'utf8').toString()
    }

    if (typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder()
      const encoded = encoder.encode(body)
      return encoded.length.toString()
    }
  }

  return null
}

export function calculateDefaultRetryTimeoutMillis(retriesRemaining: number, maxRetries: number): number {
  const initialRetryDelay = 0.5
  const maxRetryDelay = 2

  const numRetries = maxRetries - retriesRemaining

  // Apply exponential backoff, but not more than the max.
  const sleepSeconds = Math.min(initialRetryDelay * Math.pow(numRetries - 1, 2), maxRetryDelay)

  // Apply some jitter, plus-or-minus half a second.
  const jitter = Math.random() - 0.5

  return (sleepSeconds + jitter) * 1000
}

export const createResponseHeaders = (headers: Awaited<ReturnType<Fetch>>['headers']): Record<string, string> => {
  return new Proxy(
    Object.fromEntries(
      // @ts-ignore
      headers.entries(),
    ),
    {
      get(target, name) {
        const key = name.toString()
        return target[key.toLowerCase()] || target[key]
      },
    },
  )
}

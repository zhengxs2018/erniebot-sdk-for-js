import { debuglog, getGlobalObject, castToError, safeJSON } from '../shared'

import {
  HTTPClient,
  Fetch,
  HTTPMethods,
  HTTPSearchParams,
  APIRequestInit,
  APIHeaders,
  APIRequestConfig,
  APIRequestOptions,
  APIResponseProps,
  MaybePromise,
} from '../interfaces'

import { APIStream } from './streaming'
import { APIPromise } from './promise'
import { APIError, APIUserAbortError, APIConnectionError, APIConnectionTimeoutError } from '../error'

const debug = debuglog('erniebot:client')

export class MultipartBody {
  constructor(public body: any) {}

  get [Symbol.toStringTag](): string {
    return 'MultipartBody'
  }
}

export interface APIClientOptions {
  /**
   * Override the default base URL for the API, e.g., "https://api.example.com/v2/"
   */
  baseURL?: string

  /**
   * 请求头
   */
  headers?: APIHeaders

  /**
   * The maximum amount of time (in milliseconds) that the client should wait for a response
   * from the server before timing out a single request.
   *
   * Note that request timeouts are retried by default, so in a worst-case scenario you may wait
   * much longer than this timeout before the promise succeeds or fails.
   *
   * @defaultValue 10 minutes
   */
  timeout?: number

  /**
   * TODO 待实现
   *
   * @defaultValue 2
   */
  maxRetries?: number

  /**
   * 网络请求
   */
  fetch?: Fetch

  // 允许动态配置
  [key: string]: any
}

export class APIClient {
  baseURL: string
  headers: APIHeaders
  timeout: number
  maxRetries: number
  fetch: Fetch

  constructor(options: APIClientOptions = {}) {
    const {
      baseURL = '',
      headers = {},
      timeout = 600000,
      maxRetries = 2,
      fetch = getGlobalObject().fetch,
    } = options || {}

    this.fetch = fetch
    this.baseURL = baseURL
    this.timeout = timeout
    this.headers = headers
    this.maxRetries = maxRetries
  }

  get<Rsp>(path: string, opts?: Omit<APIRequestConfig, 'method'>): APIPromise<Rsp> {
    return this.methodRequest('get', path, opts)
  }

  post<Rsp>(path: string, opts?: Omit<APIRequestConfig, 'method'>): APIPromise<Rsp> {
    return this.methodRequest('post', path, opts)
  }

  patch<Rsp>(path: string, opts?: Omit<APIRequestConfig, 'method'>): APIPromise<Rsp> {
    return this.methodRequest('patch', path, opts)
  }

  put<Rsp>(path: string, opts?: Omit<APIRequestConfig, 'method'>): APIPromise<Rsp> {
    return this.methodRequest('put', path, opts)
  }

  delete<Rsp>(path: string, opts?: Omit<APIRequestConfig, 'method'>): APIPromise<Rsp> {
    return this.methodRequest('delete', path, opts)
  }

  private methodRequest<Rsp = any>(
    method: HTTPMethods,
    path: string,
    options?: Omit<APIRequestConfig, 'method'>,
  ): APIPromise<Rsp> {
    return this.request({ ...options, method, path })
  }

  request<Rsp = any>(options: APIRequestOptions, remainingRetries: number | null = null): APIPromise<Rsp> {
    return new APIPromise(this.makeRequest(options, remainingRetries), (props) => this.parseResponse<Rsp>(props))
  }

  protected async defaultQuery(): Promise<HTTPSearchParams> {
    return {}
  }

  /**
   * Override this to add your own default headers, for example:
   *
   * ```js
   *  {
   *    ...super.defaultHeaders(),
   *    Authorization: 'Bearer 123',
   *  }
   * ```
   */
  protected defaultHeaders(options: APIRequestOptions): APIHeaders {
    return {
      ...this.headers,
      Accept: options.stream ? 'text/event-stream' : 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': this.getUserAgent(),
      ...this.authHeaders(options),
    }
  }

  protected async parseResponse<T>({ response, options, controller }: APIResponseProps): Promise<T> {
    const headers = response.headers
    if (options.stream) {
      debug('response', response.status, response.url, headers, response.body)

      // Note: there is an invariant here that isn't represented in the type system
      // that if you set `stream: true` the response type must also be `Stream<T>`
      return APIStream.fromSSEResponse<T>(response, controller) as T
    }

    const contentType = headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const json = await response.json()

      debug('response', response.status, response.url, headers, json)

      return json as T
    }

    // TODO handle blob, arraybuffer, other content types, etc.
    const text = await response.text()
    debug('response', response.status, response.url, headers, text)
    return text as any as T
  }

  protected authHeaders(options: APIRequestOptions): APIHeaders {
    return {}
  }

  protected getUserAgent(): string {
    return getGlobalObject().navigator?.userAgent || ''
  }

  protected validateHeaders(headers: APIHeaders, customHeaders: APIHeaders) {}

  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  protected prepareRequest(
    request: APIRequestInit,
    { url, options }: { url: string; options: APIRequestOptions },
  ): MaybePromise<any> {}

  protected getRequestClient(): HTTPClient {
    return { fetch: this.fetch }
  }

  async fetchWithTimeout(
    url: RequestInfo,
    init: RequestInit | undefined,
    ms: number,
    controller: AbortController,
  ): Promise<Response> {
    const { signal, ...options } = init || {}

    if (signal) signal.addEventListener('abort', () => controller.abort())

    const timeout = setTimeout(() => controller.abort(), ms)

    return this.getRequestClient()
      .fetch.call(undefined, url, { signal: controller.signal, ...options })
      .finally(() => clearTimeout(timeout))
  }

  protected async buildURL({ path, query }: APIRequestOptions): Promise<string> {
    const url = new URL(path, this.baseURL)
    const searchParams = mergeHTTPSearchParams(query, await this.defaultQuery())

    if (searchParams.size) {
      url.search = searchParams.toString()
    }

    return url.toString()
  }

  // TODO 实现请求重试
  private async makeRequest(options: APIRequestOptions, retriesRemaining?: number | null): Promise<APIResponseProps> {
    const { req, url, timeout } = await this.buildRequest(options)

    await this.prepareRequest(req as APIRequestInit, { url, options })

    debug('request', url, options, req.headers)

    if (options.signal?.aborted) {
      throw new APIUserAbortError()
    }

    const controller = new AbortController()
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError)

    if (response instanceof Error) {
      if (options.signal?.aborted) {
        throw new APIUserAbortError()
      }

      if (response.name === 'AbortError') {
        throw new APIConnectionTimeoutError()
      }

      throw new APIConnectionError({ cause: response })
    }

    const responseHeaders = response.headers

    if (!response.ok) {
      const errText = await response.text().catch((e) => castToError(e).message)
      const errJSON = safeJSON(errText)
      const errMessage = errJSON ? undefined : errText

      debug('response', response.status, url, responseHeaders, errMessage)

      throw this.makeStatusError(response.status, errJSON, errMessage, responseHeaders)
    }

    return { response, options, controller }
  }

  protected makeStatusError(
    status: number | undefined,
    error: unknown | undefined,
    message: string | undefined,
    headers: Headers | undefined,
  ) {
    return APIError.generate(status, error, message, headers)
  }

  private async buildRequest(options: APIRequestOptions): Promise<{ req: RequestInit; url: string; timeout: number }> {
    const { method = 'POST', timeout = this.timeout, headers: headers = {} } = options

    const url = await this.buildURL(options)

    const body: BodyInit | null = isMultipartBody(options.body)
      ? options.body.body
      : options.body
      ? JSON.stringify(options.body)
      : null
    const contentLength = calculateContentLength(body)

    const reqHeaders: APIHeaders = {
      ...(contentLength && { 'Content-Length': contentLength }),
      ...this.defaultHeaders(options),
      ...headers,
    }

    const req: APIRequestInit = {
      method,
      body,
      headers: reqHeaders,
      signal: options.signal ?? null,
    }

    this.validateHeaders(reqHeaders, headers)

    return { req, url, timeout } as const
  }
}

export function isMultipartBody(body: any): body is MultipartBody {
  return body && typeof body === 'object' && body.body && body[Symbol.toStringTag] === 'MultipartBody'
}

export function calculateContentLength(body: BodyInit | null) {
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

export function mergeHTTPSearchParams(target: HTTPSearchParams | undefined, source?: HTTPSearchParams) {
  const targetQuery = new URLSearchParams(target || [])
  const sourceQuery = new URLSearchParams(source || [])

  sourceQuery.forEach((value, key) => {
    if (targetQuery.has(key)) return

    targetQuery.set(key, value)
  })

  return targetQuery
}

export function createResponseHeaders(headers: Awaited<ReturnType<Fetch>>['headers']): Record<string, string> {
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

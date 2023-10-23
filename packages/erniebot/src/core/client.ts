import type { Agent } from 'node:http'

import {
  debug,
  globalObject,
  castToError,
  safeJSON,
  calculateContentLength,
  Fetch,
  HTTPMethods,
  HTTPHeaders,
  HTTPSearchParams,
  HTTPClient,
  mergeHTTPSearchParams,
  isMultipartBody,
} from '../cross-platform'

import { Stream } from './streaming'
import { APIError, APIUserAbortError, APIConnectionError, APIConnectionTimeoutError } from './error'

export type PromiseOrValue<T> = T | Promise<T>

export type APIResponseProps = {
  response: Response
  options: FinalRequestOptions
  controller: AbortController
}

/**
 * A subclass of `Promise` providing additional helper methods
 * for interacting with the SDK.
 */
export class APIPromise<T> extends Promise<T> {
  private parsedPromise: Promise<T> | undefined

  constructor(
    private responsePromise: Promise<APIResponseProps>,
    private parseResponse: (props: APIResponseProps) => PromiseOrValue<T>,
  ) {
    super((resolve) => {
      // this is maybe a bit weird but this has to be a no-op to not implicitly
      // parse the response body; instead .then, .catch, .finally are overridden
      // to parse the response
      resolve(null as any)
    })
  }

  _thenUnwrap<U>(transform: (data: T) => U): APIPromise<U> {
    return new APIPromise(this.responsePromise, async (props) => transform(await this.parseResponse(props)))
  }

  asResponse(): Promise<Response> {
    return this.responsePromise.then((p) => p.response)
  }

  async withResponse(): Promise<{ data: T; response: Response }> {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()])
    return { data, response }
  }

  private parse(): Promise<T> {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then(this.parseResponse)
    }
    return this.parsedPromise
  }

  override then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.parse().then(onfulfilled, onrejected)
  }

  override catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<T | TResult> {
    return this.parse().catch(onrejected)
  }

  override finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.parse().finally(onfinally)
  }
}

export interface FinalRequestOptions<Body = any> extends Omit<RequestInit, 'body' | 'headers'> {
  path: string

  body?: Body | Record<'body', BodyInit | null> | null

  query?: HTTPSearchParams

  headers?: HTTPHeaders

  timeout?: number

  stream?: boolean

  maxRetries?: number

  httpAgent?: Agent
}

export type APIRequestOptions = Omit<FinalRequestOptions, 'path' | 'method'>

export interface APIClientOptions {
  /**
   * Override the default base URL for the API, e.g., "https://api.example.com/v2/"
   */
  baseURL?: string

  /**
   * 代理地址
   */
  proxy?: string | null

  /**
   * HTTP 请求代理
   */
  httpAgent?: Agent | null

  /**
   * 请求头
   */
  headers?: HTTPHeaders

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
   * The maximum number of times that the client will retry a request in case of a
   * temporary failure, like a network error or a 5XX error from the server.
   *
   * @defaultValue 2
   */
  maxRetries?: number

  /**
   * 网络请求
   */
  fetch?: Fetch
}

export class APIClient {
  baseURL: string

  maxRetries?: number

  timeout: number

  proxy?: string | null

  httpAgent?: Agent | null

  headers?: HTTPHeaders

  fetch: Fetch

  constructor(options: APIClientOptions) {
    const { baseURL = '', timeout = 600000, proxy, httpAgent, maxRetries = 2, fetch = globalObject.fetch } = options

    this.fetch = fetch

    this.baseURL = baseURL
    this.timeout = timeout
    this.proxy = proxy
    this.httpAgent = httpAgent
    this.maxRetries = maxRetries
  }

  get<Rsp>(path: string, opts?: APIRequestOptions): APIPromise<Rsp> {
    return this.methodRequest('get', path, opts)
  }

  post<Rsp>(path: string, opts?: APIRequestOptions): APIPromise<Rsp> {
    return this.methodRequest('post', path, opts)
  }

  patch<Rsp>(path: string, opts?: APIRequestOptions): APIPromise<Rsp> {
    return this.methodRequest('patch', path, opts)
  }

  put<Rsp>(path: string, opts?: APIRequestOptions): APIPromise<Rsp> {
    return this.methodRequest('put', path, opts)
  }

  delete<Rsp>(path: string, opts?: APIRequestOptions): APIPromise<Rsp> {
    return this.methodRequest('delete', path, opts)
  }

  request<Rsp = any>(options: FinalRequestOptions, remainingRetries: number | null = null): APIPromise<Rsp> {
    return new APIPromise(this.makeRequest(options, remainingRetries), (props) => this.parseResponse<Rsp>(props))
  }

  private methodRequest<Rsp = any>(method: HTTPMethods, path: string, options?: APIRequestOptions): APIPromise<Rsp> {
    return this.request({ ...options, method, path })
  }

  protected defaultQuery(): HTTPSearchParams {
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
  protected defaultHeaders(options: FinalRequestOptions): HTTPHeaders {
    return {
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
      return Stream.fromSSEResponse(response, controller) as any
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

  protected getUserAgent(): string {
    return 'javascript'
  }

  protected authHeaders(options: FinalRequestOptions): HTTPHeaders {
    return {}
  }

  protected validateHeaders(headers: HTTPHeaders, customHeaders: HTTPHeaders) {}

  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  protected async prepareRequest(
    request: RequestInit,
    { url, options }: { url: string; options: FinalRequestOptions },
  ): Promise<void> {}

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

  protected buildURL({ path, query }: FinalRequestOptions): string {
    const url = new URL(path, this.baseURL)
    const searchParams = mergeHTTPSearchParams(query, this.defaultQuery())

    if (searchParams.size) {
      url.search = searchParams.toString()
    }

    return url.toString()
  }

  // TODO 实现请求重试
  private async makeRequest(options: FinalRequestOptions, retriesRemaining?: number | null): Promise<APIResponseProps> {
    const { req, url, timeout } = this.buildRequest(options)

    await this.prepareRequest(req, { url, options })

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

  private buildRequest(options: FinalRequestOptions): { req: RequestInit; url: string; timeout: number } {
    const { method, timeout = this.timeout, headers: headers = {}, httpAgent = this.httpAgent } = options

    const url = this.buildURL(options)

    const body: BodyInit | null = isMultipartBody(options.body)
      ? options.body.body
      : options.body
      ? JSON.stringify(options.body)
      : null
    const contentLength = this.calculateContentLength(body)

    const reqHeaders: HTTPHeaders = {
      ...(contentLength && { 'Content-Length': contentLength }),
      ...this.defaultHeaders(options),
      ...headers,
    }

    const req: RequestInit = {
      method,
      body,
      headers: reqHeaders,
      ...(httpAgent && { agent: httpAgent }),
      signal: options.signal ?? null,
    }

    this.validateHeaders(reqHeaders, headers)

    return { req, url, timeout }
  }

  protected calculateContentLength(body: BodyInit | null) {
    return calculateContentLength(body)
  }
}

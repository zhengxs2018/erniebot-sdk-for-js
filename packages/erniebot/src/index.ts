import * as Core from './client'
import * as API from './resources'
import * as Errors from './error'

import { VERSION } from './version'
import { buildBackend, APIType } from './backends'
import {
  APIRequestInit,
  APIBackend,
  APIHeaders,
  APIResponseProps,
  APIRequestOptions,
  APIBody,
  HTTPSearchParams,
} from './interfaces'
import { inBrowser, readEnv, debuglog } from './shared'

const debug = debuglog('ernie')

export interface EBOptions extends Core.APIClientOptions {
  /**
   * Defaults to process.env['EB_API_TYPE'].
   *
   * @defaultValue aistudio
   */
  apiType?: APIType

  /**
   * Defaults to process.env['EB_ACCESS_TOKEN'].
   *
   * @defaultValue aistudio
   */
  token?: string

  /**
   * Defaults to process.env['EB_SK'].
   *
   * @defaultValue aistudio
   */
  sk?: string

  /**
   * Defaults to process.env['EB_AK'].
   *
   * @defaultValue aistudio
   */
  ak?: string

  /**
   * By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   * Only set this option to `true` if you understand the risks and have appropriate mitigations in place.
   */
  dangerouslyAllowBrowser?: boolean
}

export class ErnieBot extends Core.APIClient {
  #apiType!: APIType

  #backend!: APIBackend

  token?: string

  sk?: string

  ak?: string

  /**
   * API Client for interfacing with the ERNIE Bot API.
   */
  constructor(public options?: EBOptions) {
    const {
      apiType = readEnv('EB_API_TYPE') || 'aistudio',
      token = readEnv('EB_ACCESS_TOKEN'),
      ak = readEnv('EB_AK'),
      sk = readEnv('EB_SK'),
      dangerouslyAllowBrowser = false,
      ...rest
    } = options || {}

    super(rest)

    if (!dangerouslyAllowBrowser && inBrowser) {
      throw new Errors.EBError(
        "It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew ErnieBot({ apiKey, dangerouslyAllowBrowser: true });",
      )
    }

    this.ak = ak
    this.sk = sk
    this.token = token
    this.apiType = apiType
  }

  get apiType() {
    return this.#apiType
  }

  set apiType(apiType: APIType) {
    const backend = buildBackend(apiType)

    backend.setup?.(this)

    this.#apiType = backend.apiType
    this.#backend = backend

    debug('apiType', apiType)
  }

  get backend() {
    return this.backend
  }

  set backend(backend: APIBackend) {
    backend.setup?.(this)

    this.#backend = backend
    this.apiType = backend.apiType

    debug('backend', this.apiType)
  }

  chat: API.Chat = new API.Chat(this)

  embeddings: API.Embeddings = new API.Embeddings(this)

  protected getUserAgent(): string {
    return `ERNIEBot JS-SDK/${VERSION} Backend/${this.#backend.apiType}`
  }

  getResourcePath(path: string, model: string): string | undefined {
    const backend = this.#backend
    if (typeof backend.getResourcePath === 'function') {
      return backend.getResourcePath(path, model)
    }

    const resource = backend.resources[path]
    if (resource) {
      const { resourceId, models } = resource
      const { moduleId } = models[model]

      if (moduleId) return `${backend.baseURL}/${resourceId}/${moduleId}`

      throw new InvalidArgumentError(`${model} is not a supported model.`)
    }
  }

  protected async defaultQuery(): Promise<HTTPSearchParams> {
    return this.#backend.defaultQuery?.() || {}
  }

  protected override async buildURL(options: APIRequestOptions): Promise<string> {
    const { path, body } = options
    const model = (body as APIBody)?.model

    if (model) {
      const resourcePath = this.getResourcePath(path, model)
      if (resourcePath) {
        const defaultQuery = await this.defaultQuery()
        const searchParams = Core.mergeHTTPSearchParams(options.query, defaultQuery)

        const url = new URL(resourcePath)
        url.search = searchParams.toString()

        return url.toString()
      }
    }

    return super.buildURL(options)
  }

  protected override authHeaders(options: APIRequestOptions): APIHeaders {
    const backend = this.#backend

    if (typeof backend.authHeaders === 'function') {
      return backend.authHeaders(options)
    }

    return super.authHeaders(options)
  }

  protected override prepareRequest(req: APIRequestInit, init: { url: string; options: APIRequestOptions }) {
    return this.#backend.prepareRequest?.(req, init)
  }

  protected override parseResponse<T>(props: APIResponseProps): Promise<T> {
    const backend = this.#backend
    if (typeof backend.parseResponse === 'function') {
      return backend.parseResponse(props)
    }

    return super.parseResponse(props)
  }

  static ErnieBot = this

  static version = VERSION
  static EBError = Errors.EBError
  static InvalidArgumentError = Errors.InvalidArgumentError
  static UnsupportedAPITypeError = Errors.UnsupportedAPITypeError
  static APIError = Errors.APIError
  static APIConnectionError = Errors.APIConnectionError
  static APIConnectionTimeoutError = Errors.APIConnectionTimeoutError
  static APIUserAbortError = Errors.APIUserAbortError
}

export const {
  EBError,
  InvalidArgumentError,
  UnsupportedAPITypeError,
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
} = Errors

export namespace ErnieBot {
  export type Chat = API.Chat
  export type ChatCompletion = API.ChatCompletion
  export type ChatCompletionChunk = API.ChatCompletionChunk
  export type ChatCompletionMessage = API.ChatCompletionMessage
  export type ChatCompletionMessageParam = API.ChatCompletionMessageParam
  export type ChatCompletionRole = API.ChatCompletionRole
  export type ChatCompletionCreateParams = API.ChatCompletionCreateParams
  export type ChatCompletionCreateParamsNonStreaming = API.ChatCompletionCreateParamsNonStreaming
  export type ChatCompletionCreateParamsStreaming = API.ChatCompletionCreateParamsStreaming

  export type Embeddings = API.Embeddings
  export type CreateEmbeddingResponse = API.CreateEmbeddingResponse
  export type Embedding = API.Embedding
  export type EmbeddingCreateParams = API.EmbeddingCreateParams
}

export default ErnieBot

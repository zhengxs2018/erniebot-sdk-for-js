import { aiStudioBackend, EBBackend, EBBackendObject } from './backends'
import {
  APIClient,
  APIClientOptions,
  APIResponseProps,
  FinalRequestOptions,
  UnsupportedAPITypeError,
  InvalidArgumentError,
} from './core'
import { mergeHTTPSearchParams, HTTPHeaders, readEnv } from './cross-platform'
import { Chat, Embeddings } from './resources'
import { VERSION } from './version'

export type APIType = (string & NonNullable<unknown>) | 'aistudio'

export interface EBConfig {
  /**
   * Defaults to process.env['EB_ACCESS_TOKEN'].
   */
  token?: string | null

  /**
   * Defaults to process.env['EB_AK'].
   */
  ak?: string | null

  /**
   * Defaults to process.env['EB_SK'].
   */
  sk?: string | null
}

export interface EBOptions extends APIClientOptions, EBConfig {
  /**
   * Defaults to process.env['EB_API_TYPE'].
   *
   * @defaultValue aistudio
   */
  apiType?: APIType

  /**
   * By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   * Only set this option to `true` if you understand the risks and have appropriate mitigations in place.
   */
  dangerouslyAllowBrowser?: boolean
}

export class ErnieBot extends APIClient {
  static version = VERSION

  static backends: Record<string, EBBackend> = {
    aistudio: aiStudioBackend,
  }

  private _apiType!: APIType

  private _backend!: EBBackendObject

  config: EBConfig

  /**
   * API Client for interfacing with the ERNIE Bot API.
   */
  constructor(public options?: EBOptions) {
    const {
      apiType = 'aistudio',
      token = readEnv('EB_ACCESS_TOKEN'),
      ak = readEnv('EB_AK'),
      sk = readEnv('EB_SK'),
      ...rest
    } = options || {}

    super(rest)

    this.apiType = apiType
    this.config = {
      token,
      ak,
      sk,
    }
  }

  get apiType() {
    return this._apiType
  }

  set apiType(apiType: APIType) {
    this._backend = this.makeBackend(apiType)
    this._apiType = apiType
  }

  chat: Chat = new Chat(this)

  embeddings: Embeddings = new Embeddings(this)

  protected getUserAgent(): string {
    return `ErnieBot/JS-SDK ${VERSION}`
  }

  protected override authHeaders(options: FinalRequestOptions<any>): HTTPHeaders {
    const backend = this._backend

    if (typeof backend.authHeaders === 'function') {
      return backend.authHeaders(options)
    }

    return super.authHeaders(options)
  }

  protected override async prepareRequest(request: RequestInit): Promise<void> {
    const backend = this._backend

    if (typeof backend.prepareRequest === 'function') {
      await backend.prepareRequest(request)
    }
  }

  protected override parseResponse<T>(props: APIResponseProps): Promise<T> {
    const backend = this._backend
    if (typeof backend.parseResponse === 'function') {
      return backend.parseResponse(props)
    }

    return super.parseResponse(props)
  }

  private getRequestPath(path: string, model: string): string {
    const backend = this._backend
    const apiInfo = backend.resources[path]

    if (!apiInfo) return `${this.baseURL}${path}`

    if (model in apiInfo['models']) {
      return `${backend.baseURL}/${apiInfo['resourceId']}/${apiInfo['models'][model]['modelId']}`
    }

    throw new InvalidArgumentError(`${model} is not a supported model.`)
  }

  protected override buildURL(options: FinalRequestOptions): string {
    const model = options?.body?.model || ''
    const url = new URL(this.getRequestPath(options.path, model))

    const searchParams = mergeHTTPSearchParams(options.query, this.defaultQuery())

    if (searchParams.size) {
      url.search = searchParams.toString()
    }

    return url.toString()
  }

  makeBackend(apiType: APIType): EBBackendObject {
    const backend = ErnieBot.backends[apiType]

    if (backend) return typeof backend === 'function' ? backend(this) : backend

    throw new UnsupportedAPITypeError(`${apiType} cannot be recognized as an API type.`)
  }
}

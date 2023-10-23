import { AIStudioBackend, EBBackend } from './backends'
import {
  APIClient,
  APIClientOptions,
  APIResponseProps,
  FinalRequestOptions,
  EBError,
  UnsupportedAPITypeError,
  InvalidArgumentError,
} from './core'
import { mergeHTTPSearchParams, readEnv } from './cross-platform'
import { Chat, Embeddings } from './resources'
import { VERSION } from './version'

export type APIType = (string & NonNullable<unknown>) | 'aistudio'

export interface EBOptions extends APIClientOptions {
  /**
   * Defaults to process.env['EB_API_TYPE'].
   *
   * @defaultValue aistudio
   */
  apiType?: APIType

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

  /**
   * By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   * Only set this option to `true` if you understand the risks and have appropriate mitigations in place.
   */
  dangerouslyAllowBrowser?: boolean
}

export class ErnieBot extends APIClient {
  static version = VERSION

  static backends: Record<string, EBBackend> = {
    aistudio: AIStudioBackend,
  }

  private _apiType!: APIType

  private _token!: string

  private _backend!: EBBackend

  /**
   * API Client for interfacing with the ERNIE Bot API.
   */
  constructor(public options: EBOptions) {
    super(options)

    const { apiType = 'aistudio', token = readEnv('EB_ACCESS_TOKEN') } = options

    if (token == null) {
      throw new EBError(
        "The EB_ACCESS_TOKEN environment variable is missing or empty; either provide it, or instantiate the ErnieBot client with an token option, like new ErnieBot({ token: 'My API Access Token' }).",
      )
    }

    this.apiType = apiType
    this._token = token
  }

  get apiType() {
    return this._apiType
  }

  set apiType(apiType: APIType) {
    this._backend = ErnieBot.makeBackend(apiType)
    this._apiType = apiType
  }

  chat: Chat = new Chat(this)

  embeddings: Embeddings = new Embeddings(this)

  protected getUserAgent(): string {
    return `ErnieBot/JS-SDK ${VERSION}`
  }

  protected override authHeaders() {
    return { authorization: `token ${this._token}` }
  }

  protected override parseResponse(props: APIResponseProps) {
    return this._backend.parseResponse(props)
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

  static makeBackend(apiType: APIType) {
    const backend = ErnieBot.backends[apiType]

    if (!backend) {
      throw new UnsupportedAPITypeError(`${apiType} cannot be recognized as an API type.`)
    }

    return backend
  }
}

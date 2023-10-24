import { sha256, debuglog, normalize } from '../../shared'

const debug = debuglog('erniebot-backend-bce:auth')

export type Headers = Record<string, string>

export interface AuthCredentials {
  ak: string
  sk: string
}

export class AuthSignature {
  headersToSign: string[] = ['host', 'content-md5', 'content-length', 'content-type']

  constructor(private credentials: AuthCredentials) {}

  /**
   * Generate the signature based on http://gollum.baidu.com/AuthenticationMechanism
   *
   * @param method - The http request method, such as GET, POST, DELETE, PUT, ...
   * @param resource  - The request path.
   * @param params  - The query strings.
   * @param headers  - The http request headers.
   * @param timestamp  - Set the current timestamp.
   * @param expirationInSeconds  - The signature validation time.
   * @param headersToSign - The request headers list which will be used to calcualate the signature.
   * @returns The signature.
   */
  async generateAuthorization(
    method: string,
    resource: string,
    params?: Record<string, string>,
    headers?: Record<string, string>,
    timestamp?: number,
    expirationInSeconds = 1800,
    headersToSign?: string[],
  ): Promise<string> {
    const now = timestamp ? new Date(timestamp * 1000) : new Date()

    const { ak, sk } = this.credentials

    const isoTimestamp = now.toISOString().replace(/\.\d+Z$/, 'Z')
    const rawSessionKey = `'bce-auth-v1/${ak}/${isoTimestamp}/${expirationInSeconds}`

    debug('rawSessionKey = %j', rawSessionKey)

    const sessionKey = await sha256(rawSessionKey, sk)

    const canonicalUri = this.uriCanonicalization(resource)
    const canonicalQueryString = this.queryStringCanonicalization(params || {})

    const [canonicalHeaders, signedHeaders] = this.headersCanonicalization(headers || {}, headersToSign)

    debug('canonicalUri = %j', canonicalUri)
    debug('canonicalQueryString = %j', canonicalQueryString)
    debug('canonicalHeaders = %j', canonicalHeaders)
    debug('signedHeaders = %j', signedHeaders)

    const rawSignature = [method, canonicalUri, canonicalQueryString, canonicalHeaders.join('\n')].join('\n')

    debug('rawSignature = %j', rawSignature)
    debug('sessionKey = %j', sessionKey)

    const signature = await sha256(rawSignature, sessionKey)

    if (signedHeaders.length) {
      return [rawSessionKey, signedHeaders.join(';'), signature].join('/')
    }

    return `${rawSessionKey}//${signature}`
  }

  /**
   * 规范化网址
   *
   * @see https://developers.google.com/search/docs/crawling-indexing/canonicalization?hl=zh-cn
   * @param uri - 网址
   * @returns
   */
  uriCanonicalization(uri: string): string {
    return uri
  }

  /**
   * Canonical the query strings.
   *
   * @see http://gollum.baidu.com/AuthenticationMechanism#生成CanonicalQueryString
   * @param params - The query strings.
   */
  queryStringCanonicalization(params: Record<string, string>): string {
    const canonicalQueryString: string[] = []

    for (const key of Object.keys(params)) {
      if (key.toLowerCase() === 'authorization') {
        continue
      }

      const value = params[key] == null ? '' : params[key]
      canonicalQueryString.push(key + '=' + normalize(value))
    }

    canonicalQueryString.sort()

    return canonicalQueryString.join('&')
  }

  /**
   * Canonical the http request headers.
   *
   * @see http://gollum.baidu.com/AuthenticationMechanism#生成CanonicalHeaders
   * @param headers - The http request headers.
   * @param headersToSign - The request headers list which will be used to calcualate the signature.
   * @returns canonicalHeaders and signedHeaders
   */
  headersCanonicalization(headers: Headers, headersToSign?: string[]): readonly [string[], string[]] {
    if (!headersToSign || headersToSign.length === 0) {
      headersToSign = this.headersToSign
    }

    debug('headers = %j, headersToSign = %j', headers, headersToSign)

    const headersMap: Record<string, boolean> = {}

    headersToSign.forEach(function (item) {
      headersMap[item.toLowerCase()] = true
    })

    const canonicalHeaders: string[] = []
    const signedHeaders: string[] = []

    for (const [rawValue, rawKey] of Object.entries(headers)) {
      if (rawValue == null) continue

      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue
      if (value === '') continue

      const key = rawKey.toLowerCase()

      if (/^x\-bce\-/.test(key) || headersMap[key] === true) {
        const header = `${normalize(key)}:${normalize(value)}`
        canonicalHeaders.push(header)
      }
    }

    canonicalHeaders.sort()

    canonicalHeaders.forEach(function (item) {
      signedHeaders.push(item.split(':')[0])
    })

    return [canonicalHeaders, signedHeaders]
  }
}

// TODO 支持 Token 缓存
export class TokenManager {
  #promise?: Promise<string>

  #expiredAt?: number

  #token?: string

  getAccessToken(credentials: AuthCredentials): Promise<string> {
    const promise = this.#promise
    if (promise) return promise

    if (this.#token && this.#expiredAt && this.#expiredAt > Date.now()) {
      return Promise.resolve(this.#token)
    }

    this.#promise = this.requestAccessToken(credentials).then((res) => {
      this.#token = res.access_token
      this.#expiredAt = Date.now() + (res.expires_in - 120) * 1000
      return this.#token
    })

    this.#promise.finally(() => {
      this.#promise = undefined
    })

    return this.#promise
  }

  requestAccessToken({ ak, sk }: AuthCredentials): Promise<{
    access_token: string
    expires_in: number
  }> {
    const url = new URL('https://aip.baidubce.com/oauth/2.0/token')

    url.search = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: ak,
      client_secret: sk,
    }).toString()

    return fetch(url, {
      method: 'GET',
    }).then((res) => res.json())
  }
}

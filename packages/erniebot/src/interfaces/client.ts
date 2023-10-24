export type HTTPMethods = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type HTTPSearchParams = URLSearchParams | Record<string, string>

export type Fetch = (url: RequestInfo, init?: RequestInit) => Promise<Response>

export type HTTPClient = { fetch: Fetch }

export type APIHeaders = Record<string, string>

export type APIBody = Record<string, any>

export type APIMultipartBody = {
  body?: BodyInit | null
}

export interface APIRequestInit extends RequestInit {
  method: string
  headers: Record<string, string>
}

export interface APIRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  path: string

  query?: HTTPSearchParams

  body?: APIBody | APIMultipartBody | null | undefined

  headers?: APIHeaders

  timeout?: number

  stream?: boolean

  maxRetries?: number
}

export type APIRequestConfig = Omit<APIRequestOptions, 'path'>

export type APIResponseProps = {
  response: Response
  options: APIRequestOptions
  controller: AbortController
}

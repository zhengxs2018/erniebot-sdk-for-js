import ERNIEBot from './index'
import { InvalidArgumentError, APIError } from './error'
import type {
  HTTPSearchParams,
  APIRequestInit,
  APIResponseProps,
  APIRequestOptions,
  APIHeaders,
  MaybePromise,
} from './interfaces'
import { APIStream } from './client'
import { debuglog } from './shared'

export type APIBackendModuleInfo = {
  moduleId: string
}

export type APIBackendResourceInfo = {
  resourceId: string
  models: {
    [model: string]: APIBackendModuleInfo
  }
}

export type APIBackendResources = {
  [resource: string]: APIBackendResourceInfo
}

export abstract class APIBackend {
  client!: ERNIEBot

  abstract apiType: string

  abstract baseURL: string

  abstract resources: APIBackendResources

  setup(client: ERNIEBot) {
    this.client = client
  }

  /**
   * 覆盖当前请求路径
   *
   * @param path - 当前路径
   * @param model - 请求模型
   * @returns 返回空值将使用预设的路径
   */
  overrideResourcePath(path: string, model: string): string | undefined {
    const resource = this.resources[path]
    if (resource) {
      const { resourceId, models } = resource
      const { moduleId } = models[model]

      if (moduleId) return `${this.baseURL}/${resourceId}/${moduleId}`

      throw new InvalidArgumentError(`${model} is not a supported model.`)
    }
  }

  /**
   * 返回默认请求参数
   */
  defaultQuery(): MaybePromise<HTTPSearchParams> {
    return {}
  }

  /**
   * 添加授权请求头
   */
  authHeaders(options: APIRequestOptions): APIHeaders {
    return {}
  }

  /**
   * 预处理请求
   */
  prepareRequest(req: APIRequestInit, init: { url: string; options: APIRequestOptions }): MaybePromise<void> {}

  transformResponse(type: 'json', data: any) {
    return data
  }

  async parseResponse({ response, options, controller }: APIResponseProps): Promise<any> {
    const debug = debuglog(`erniebot:backend:${this.apiType}`)

    const headers = response.headers
    if (options.stream) {
      debug('response', response.status, response.url, headers, response.body)

      // Note: there is an invariant here that isn't represented in the type system
      // that if you set `stream: true` the response type must also be `Stream<T>`
      return APIStream.fromSSEResponse(response, controller)
    }

    const contentType = headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const json = await response.json()

      debug('response', response.status, response.url, headers, json)

      // 兼容 AIStudio 和 BCE 的 Error Codes
      const errorCode = json['errorCode'] ?? json['error_code'] ?? 0
      if (errorCode === 0) return this.transformResponse('json', json)

      const message = json['errorMsg'] ?? json['error_msg'] ?? 'unknown error'
      return Promise.reject(this.makeStatusError(errorCode, json, message, headers))
    }

    // TODO handle blob, arraybuffer, other content types, etc.
    const text = await response.text()
    debug('response', response.status, response.url, headers, text)
    return text as any
  }

  protected makeStatusError(ecode: number | undefined, error: Error, message: string, headers: Headers) {
    let status: number | undefined
    if (ecode === 2) {
      status = 500
    } else if (ecode === 6) {
      status = 403
    } else if (ecode === 17 || ecode === 18 || ecode === 19 || ecode === 40407) {
      status = 429
    } else if (ecode === 110 || ecode === 111 || ecode === 40401) {
      // InvalidToken or TokenExpired
      status = 401
    } else if (ecode === 336003 || ecode === 336100) {
      // InvalidParameter or TryAgain
      status = 400
    }

    return APIError.generate(status, error, message, headers)
  }
}

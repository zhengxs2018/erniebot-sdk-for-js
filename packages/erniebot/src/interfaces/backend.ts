import type { ErnieBot } from '../index'
import type { HTTPSearchParams } from '../interfaces'
import type { APIRequestInit, APIResponseProps, APIRequestOptions } from './client'
import type { MaybePromise } from './common'

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

export interface APIBackend {
  apiType: string

  baseURL: string

  resources: APIBackendResources

  setup?: (client: ErnieBot) => void

  defaultQuery?: () => MaybePromise<HTTPSearchParams>

  getResourcePath?: (path: string, model: string) => string | undefined

  authHeaders?: (options: APIRequestOptions) => Record<string, string>

  prepareRequest?: (req: APIRequestInit, init: { url: string; options: APIRequestOptions }) => MaybePromise<void>

  parseResponse?: (props: APIResponseProps) => Promise<any>
}

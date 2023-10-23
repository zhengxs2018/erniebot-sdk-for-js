import { APIResponseProps, FinalRequestOptions } from '../core/client'
import type { ErnieBot } from '../erniebot'

export interface APIInfo {
  resourceId: string

  models: {
    [key: string]: {
      modelId: string
    }
  }
}

export interface EBBackendObject {
  baseURL: string
  apiType: string
  resources: Record<string, APIInfo>
  authHeaders?: (options: FinalRequestOptions<any>) => Record<string, string>
  prepareRequest?: (request: RequestInit) => Promise<void>
  parseResponse?: (props: APIResponseProps) => Promise<any>
}

export type EBBackendFunction = (erniebot: ErnieBot) => EBBackendObject

export type EBBackend = EBBackendFunction | EBBackendObject

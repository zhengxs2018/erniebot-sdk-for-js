export interface APIInfo {
  resourceId: string

  models: {
    [key: string]: {
      modelId: string
    }
  }
}

export interface EBBackend {
  baseURL: string
  apiType: string
  resources: Record<string, APIInfo>
}

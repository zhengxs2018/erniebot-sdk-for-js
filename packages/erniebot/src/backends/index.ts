import { UnsupportedAPITypeError } from '../error'
import { APIBackend } from '../interfaces'

import { aiStudio } from './aistudio'
import { qianFan } from './bce'

export type APIType = (string & NonNullable<unknown>) | 'aistudio' | 'qianfan'

const backends: Record<APIType, APIBackend> = {
  aistudio: aiStudio,
  qianfan: qianFan,
}

export function buildBackend(apiType: APIType): APIBackend {
  const backend = backends[apiType.toLowerCase()]
  if (backend) return backend

  throw new UnsupportedAPITypeError(`${apiType} cannot be recognized as an API type.`)
}

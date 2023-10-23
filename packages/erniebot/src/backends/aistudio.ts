import { readEnv, debug } from '../cross-platform'
import { EBError, APIError, APIResponseProps, Stream } from '../core'
import { ErnieBot } from '../erniebot'
import { EBBackendFunction, EBBackendObject } from './backend'

export class AIStudioBackend implements EBBackendObject {
  constructor(private api: ErnieBot) {}

  apiType = 'aistudio'

  baseURL = 'https://aistudio.baidu.com/llm/lmapi/v1'

  resources = {
    '/chat/completions': {
      resourceId: 'chat',
      models: {
        'ernie-bot': {
          modelId: 'completions',
        },
        'ernie-bot-turbo': {
          modelId: 'eb-instant',
        },
        'ernie-bot-4': {
          modelId: 'completions_pro',
        },
      },
    },
    '/embeddings': {
      resourceId: 'embeddings',
      models: {
        'ernie-text-embedding': {
          modelId: 'embedding-v1',
        },
      },
    },
  }

  authHeaders() {
    const { token = readEnv('AISTUDIO_ACCESS_TOKEN') } = this.api.config

    if (token == null) {
      throw new EBError(
        "The EB_ACCESS_TOKEN environment variable is missing or empty; either provide it, or instantiate the ErnieBot client with an token option, like new ErnieBot({ token: 'My API Access Token' }).",
      )
    }

    return { authorization: `token ${token}` }
  }

  async parseResponse<T>({ response, options, controller }: APIResponseProps): Promise<T> {
    const headers = response.headers
    if (options.stream) {
      debug('response', response.status, response.url, headers, response.body)

      // Note: there is an invariant here that isn't represented in the type system
      // that if you set `stream: true` the response type must also be `Stream<T>`
      return Stream.fromSSEResponse(response, controller) as any
    }

    const contentType = headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const json = await response.json()

      debug('response', response.status, response.url, headers, json)

      const errorCode = json.errorCode
      if (errorCode === 0) return json.result as T

      return Promise.reject(APIError.generate(errorCode, null, json['errorMsg'], headers))
    }

    // TODO handle blob, arraybuffer, other content types, etc.
    const text = await response.text()
    debug('response', response.status, response.url, headers, text)
    return text as any as T
  }
}

export const aiStudioBackend: EBBackendFunction = (api) => new AIStudioBackend(api)

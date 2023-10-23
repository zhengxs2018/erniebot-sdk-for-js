import { readEnv } from '../cross-platform'
import { EBError } from '../core'
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
}

export const aiStudioBackend: EBBackendFunction = (api) => new AIStudioBackend(api)

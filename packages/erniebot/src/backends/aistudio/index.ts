import { APIBackend } from '../../backend'
import { EBError } from '../../error'
import { readEnv } from '../../shared'

class AIStudioBackend extends APIBackend {
  apiType = 'aistudio' as const

  baseURL = 'https://aistudio.baidu.com/llm/lmapi/v1'

  resources = {
    '/chat/completions': {
      resourceId: 'chat',
      models: {
        'ernie-bot': { moduleId: 'completions' },
        'ernie-bot-turbo': { moduleId: 'eb-instant' },
        'ernie-bot-4': { moduleId: 'completions_pro' },
      },
    },
    '/embeddings': {
      resourceId: 'embeddings',
      models: {
        'ernie-text-embedding': { moduleId: 'embedding-v1' },
      },
    },
  }

  override authHeaders() {
    const { token = readEnv('AISTUDIO_ACCESS_TOKEN') } = this.client

    if (token == null) {
      throw new EBError(
        "The EB_ACCESS_TOKEN environment variable is missing or empty; either provide it, or instantiate the ErnieBot client with an token option, like new ErnieBot({ token: 'My API Access Token' }).",
      )
    }

    return { authorization: `token ${token}` }
  }

  override transformResponse(type: 'json', data: any) {
    return data.result
  }
}

export const aiStudio = new AIStudioBackend()

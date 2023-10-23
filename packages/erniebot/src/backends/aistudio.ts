import { EBBackend } from './backend'

export const AIStudioBackend: EBBackend = {
  apiType: 'aistudio',
  baseURL: 'https://aistudio.baidu.com/llm/lmapi/v1',
  resources: {
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
  },
}

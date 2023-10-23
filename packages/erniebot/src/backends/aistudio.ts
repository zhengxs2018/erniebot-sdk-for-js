import { APIResponseProps, APIError, Stream } from '../core'
import { debug } from '../cross-platform'

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
  async parseResponse({ response, options, controller }: APIResponseProps) {
    const headers = response.headers
    if (options.stream) {
      debug('response', response.status, response.url, headers, response.body)

      return Stream.fromSSEResponse(response, controller) as any
    }

    const contentType = headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const json = await responseon()

      debug('response', response.status, response.url, headers, json)

      if (json.errorCode === 0) return json.result

      const message = json.errorMsg
      return Promise.reject(APIError.generate(json.errorCode, json, message, headers))
    }

    // TODO handle blob, arraybuffer, other content types, etc.
    const text = await response.text()
    debug('response', response.status, response.url, headers, text)
    return text
  },
}

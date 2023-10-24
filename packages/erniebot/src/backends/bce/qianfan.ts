import ErnieBot from '../../index'
import { EBError } from '../../error'
import { APIBackend } from '../../interfaces'
import { readEnv } from '../../shared'

import { TokenManager } from './auth'

export class QianFanLegacyBackend extends TokenManager implements APIBackend {
  apiType = 'qianfan' as const

  baseURL = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop'

  resources: APIBackend['resources'] = {
    '/chat/completions': {
      resourceId: 'chat',
      models: {
        'ernie-bot': {
          moduleId: 'completions',
        },
        'ernie-bot-turbo': {
          moduleId: 'eb-instant',
        },
        'ernie-bot-4': {
          moduleId: 'completions_pro',
        },
      },
    },
  }

  client!: ErnieBot

  setup(client: ErnieBot) {
    this.client = client
  }

  async defaultQuery() {
    const { ak = readEnv('QIANFAN_AK'), sk = readEnv('QIANFAN_SK') } = this.client

    if (ak == null || sk == null) {
      throw new EBError('Invalid access key ID or secret access key')
    }

    return { access_token: await this.getAccessToken({ ak, sk }) }
  }
}

export const qianFan = new QianFanLegacyBackend()

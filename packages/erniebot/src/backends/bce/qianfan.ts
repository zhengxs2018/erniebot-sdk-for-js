import { APIError, EBError } from '../../error'
import { APIBackend } from '../../backend'
import { readEnv, debuglog } from '../../shared'

import { TokenManager } from './auth'

const debug = debuglog('erniebot:backend:qianfan')

export class QianFanLegacyBackend extends APIBackend {
  apiType = 'qianfan' as const

  baseURL = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop'

  resources = {
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

  errCodes = {
    2: 500,
    6: 403,
  }

  tokenManager = new TokenManager()

  override async defaultQuery() {
    const { ak = readEnv('QIANFAN_AK'), sk = readEnv('QIANFAN_SK') } = this.client

    if (ak == null || sk == null) {
      throw new EBError('Invalid access key ID or secret access key')
    }

    return { access_token: await this.tokenManager.getAccessToken({ ak, sk }) }
  }
}

export const qianFan = new QianFanLegacyBackend()

import ErnieBot from '@zhengxs/erniebot'

const erniebot = new ErnieBot()

async function main() {
  const response = await erniebot.chat.completions.create({
    model: 'ernie-bot',
    messages: [
      {
        role: 'user',
        content: '深圳市今天气温多少摄氏度？',
      },
    ],
    functions: [
      {
        name: 'get_current_temperature',
        description: '获取指定城市的气温',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: '城市名称',
            },
            unit: {
              type: 'string',
              enum: ['摄氏度', '华氏度'],
            },
          },
          required: ['location', 'unit'],
        },
        responses: {
          type: 'object',
          properties: {
            temperature: {
              type: 'integer',
              description: '城市气温',
            },
            unit: {
              type: 'string',
              enum: ['摄氏度', '华氏度'],
            },
          },
        },
      },
    ],
  })

  console.log(response)
}

main()

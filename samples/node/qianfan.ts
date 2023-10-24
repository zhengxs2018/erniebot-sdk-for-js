import ErnieBot from '@zhengxs/erniebot'

const erniebot = new ErnieBot()

erniebot.apiType = 'qianfan'

async function main() {
  const response = await erniebot.chat.completions.create({
    model: 'ernie-bot-4',
    messages: [
      {
        role: 'user',
        content: 'hello',
      },
    ],
  })

  console.log(response)
}

main()

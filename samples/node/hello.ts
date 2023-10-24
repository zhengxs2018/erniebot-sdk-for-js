import ErnieBot from '@zhengxs/erniebot'

const erniebot = new ErnieBot()

async function main() {
  const response = await erniebot.chat.completions.create({
    model: 'ernie-bot',
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

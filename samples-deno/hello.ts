import { ErnieBot } from 'npm:@zhengxs/erniebot'

const erniebot = new ErnieBot({
  apiType: 'aistudio',
})

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

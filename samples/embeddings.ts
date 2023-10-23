import { ErnieBot } from '@zhengxs/erniebot'

const erniebot = new ErnieBot({
  apiType: 'aistudio',
})

async function main() {
  const response = await erniebot.embeddings.create({
    model: 'ernie-text-embedding',
    input: ['深圳市今天气温多少摄氏度？'],
  })

  console.log(response)
}

main()

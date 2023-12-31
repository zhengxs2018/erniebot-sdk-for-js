# @zhengxs/erniebot

> 非官方 JS-SDK，请勿在生产中使用

可以调用文心大模型的能力，包含文本创作、通用对话、语义向量、AI作图等。

## 安装

```sh
# With NPM
$ npm i -S @zhengxs/erniebot

# With Yarn
$ yarn add @zhengxs/erniebot

# With PNPM
$ pnpm add @zhengxs/erniebot
```

## 使用

```ts
import ErnieBot from '@zhengxs/erniebot'

const erniebot = new ErnieBot({
  apiType: 'aistudio',
  token: 'My API Access Token', // defaults to process.env["EB_ACCESS_TOKEN"]
})

async function main() {
  const chatCompletion = await erniebot.chat.completions.create({
    model: 'ernie-bot',
    messages: [{ role: 'user', content: 'Say this is a test' }],
  })

  console.log(chatCompletion.result)
}

main()
```

更多内容请查看 [ERNIEBot SDK for JavaScript](https://github.com/zhengxs2018/erniebot-sdk-for-js) 文档。

## License

MIT

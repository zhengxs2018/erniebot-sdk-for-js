# ERNIE Bot SDK for JavaScript

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

目前仅支持 [AI Studio](https://aistudio.baidu.com) 后端。

```ts
import { ErnieBot } from '@zhengxs/erniebot'

const erniebot = new ErnieBot({
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

## 参考

- [openai-node](https://github.com/openai/openai-node)
- [ERNIE-Bot-SDK](https://github.com/PaddlePaddle/ERNIE-Bot-SDK)

## 待办事项

- 平台支持
  - [x] [AI Studio](https://aistudio.baidu.com/)
  - [ ] [文心千帆](https://cloud.baidu.com/product/wenxinworkshop)
  - [ ] [文心一言](https://yiyan.baidu.com)
- 功能支持
  - [x] ChatCompletion
  - [x] Embedding
  - [ ] Image
  - [ ] ChatFile
  - [ ] FineTuning

**注意：** 后续兼容 openai，可能会调整 API 的输出格式。

## License

MIT

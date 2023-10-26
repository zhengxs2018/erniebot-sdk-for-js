# ERNIE Bot SDK for JavaScript

[![Typescript](https://img.shields.io/badge/lang-typescript-informational?style=flat-square)](https://www.typescriptlang.org)[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)[![npm package](https://img.shields.io/npm/v/@zhengxs/erniebot.svg?style=flat-square)](https://www.npmjs.com/package/@zhengxs/erniebot)[![npm downloads](https://img.shields.io/npm/dt/@zhengxs/erniebot.svg?style=flat-square)](https://www.npmjs.com/package/@zhengxs/erniebot)![License](https://img.shields.io/npm/l/@zhengxs/js.tree.svg?style=flat-square)

> 非官方 JS-SDK，请勿在生产中使用

可以调用文心大模型的能力，包含文本创作、通用对话、语义向量、AI作图等。

**注意：** 后续兼容 openai，可能会调整 API 的输出格式。

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

### AI Studio

默认是 [AI Studio](https://aistudio.baidu.com) 后端。

```ts
import ERNIEBot from '@zhengxs/erniebot'

const erniebot = new ERNIEBot({
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

### 文心千帆

可以切换为 [文心千帆](https://cloud.baidu.com/product/wenxinworkshop) 后端。

```ts
import ERNIEBot from '@zhengxs/erniebot'

const erniebot = new ERNIEBot({
  apiType: 'qianfan',
  ak: 'My APP Access Token', // defaults to process.env["EB_AK"]
  sk: 'My APP Secret Token', // defaults to process.env["EB_SK"]
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

## CLI

使用全局安装

```sh
# With NPM
$ npm i -g @zhengxs/erniebot-cli

# With Yarn
$ yarn global @zhengxs/erniebot-cli

# With PNPM
$ pnpm add --global @zhengxs/erniebot-cli
```

使用 `erniebot` 命令运行。

```sh
$ erniebot
```

## 参考

- [openai-node](https://github.com/openai/openai-node)
- [ERNIE-Bot-SDK](https://github.com/PaddlePaddle/ERNIE-Bot-SDK)

## 待办事项

- 后端支持
  - [x] [AI Studio](https://aistudio.baidu.com/)
  - [x] [文心千帆](https://cloud.baidu.com/product/wenxinworkshop)
  - [ ] [文心一言](https://yiyan.baidu.com)
- 功能支持
  - [x] ChatCompletion
  - [x] Embedding
  - [ ] Images
  - [ ] Files
  - [ ] FineTuning
- 运行时支持
  - [x] NodeJS
  - [x] Deno.js
  - [ ] 浏览器
  - [ ] 非标准 JS 环境，如：小程序

## License

MIT

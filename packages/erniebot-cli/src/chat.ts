import { Command } from 'commander'
import ora from 'ora'
import colors from 'ansi-colors'
import enquirer from 'enquirer'

import { ErnieBot, EBOptions, ChatCompletionCreateParamsNonStreaming } from '@zhengxs/erniebot'

import { VERSION } from './version'

const banner = ` _____ ____  _   _ ___ _____   ____        _
| ____|  _ \\| \\ | |_ _| ____| | __ )  ___ | |_
|  _| | |_) |  \\| || ||  _|   |  _ \\ / _ \\| __|
| |___|  _ <| |\\  || || |___  | |_) | (_) | |_
|_____|_| \\_\\_| \\_|___|_____| |____/ \\___/ \\__|

JS-SDK v${ErnieBot.version} | CLI v${VERSION}
=====================

你好，我是文心一言 ERNIE Bot。
`

const MSG_FORMAT = `${colors.blueBright('⚉')} 一言 ${colors.dim('·')} %s`
const MSG_ERROR_FORMAT = `${colors.redBright('✘')} 系统 ${colors.dim('·')} %s`

// TODO 支持输入文件
const cmd = new Command('chat')

cmd.description('聊天对话')
cmd.option('-m,--model <string>', '模型', 'ernie-bot')
cmd.option('--token', 'Access Token')

async function ensureCookie(options: EBOptions) {
  if (!options.token) {
    options.token = process.env.EB_ACCESS_TOKEN
  }

  if (options.token) return

  const answer = await enquirer.prompt<{ token: string }>({
    type: 'invisible',
    name: 'token',
    message: `Access Token (安全模式)`,
    required: true,
  })

  options.token = answer.token
  console.log('')
}

cmd.action(async (options: EBOptions & { model?: string }) => {
  console.clear()
  console.log(banner)

  await ensureCookie(options)

  const { model = 'ernie-bot', ...rest } = options

  const api = new ErnieBot(rest)

  const context: ChatCompletionCreateParamsNonStreaming = {
    model: model,
    messages: [],
  }

  type UserInput = { value: string }
  let input: UserInput

  while (true) {
    input = await enquirer.prompt<UserInput>({
      type: 'text',
      name: 'value',
      message: '你说',
      required: true,
      // @ts-ignore
      footer() {
        return colors.dim('(输入 "/" 回车，可选择指令)')
      },
    })

    if (input.value === '/') {
      input = await enquirer.prompt<UserInput>({
        type: 'autocomplete',
        name: 'value',
        message: '选择指令',
        choices: ['/new', '/continue', '/retry', '/exit'],
      })
    }

    if (input.value === '/continue') continue

    if (input.value === '/exit') {
      console.clear()
      console.log(MSG_FORMAT, '好的，期待我们下一次相遇！')
      process.exit(0)
    }

    if (input.value === '/new') {
      context.messages = []
      console.clear()
      console.log(MSG_FORMAT, '好的，让我们重新开始吧。')
      continue
    }

    const content = input.value

    const lastMessage = context.messages[context.messages.length - 1]
    if (content === '/retry') {
      if (lastMessage?.role !== 'user') {
        console.error(MSG_ERROR_FORMAT, colors.red('请输入内容后重试'))
        continue
      }
    } else {
      if (lastMessage?.role === 'user') {
        lastMessage.content = content
      } else {
        context.messages.push({ role: 'user', content })
      }
    }

    const spinner = ora('✦ Thinking...').start()

    try {
      const res = await api.chat.completions.create(context)

      spinner.stop()

      console.log(MSG_FORMAT, res.result)

      context.messages.push({
        role: 'assistant',
        content: res.result,
      })
    } catch (error) {
      spinner.stop()
      console.error(MSG_ERROR_FORMAT, colors.red((error as Error).message))
    } finally {
      console.log('')
    }
  }
})

export default cmd

import { Command } from 'commander'

import chat from './chat'
import { VERSION } from './version'

const cmd = new Command('erniebot')

cmd.version(VERSION)

cmd.addCommand(chat, {
  isDefault: true,
})

export default cmd

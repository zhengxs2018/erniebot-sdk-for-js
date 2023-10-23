import { Command } from 'commander'

import chat from './chat'

const cmd = new Command('erniebot')

cmd.addCommand(chat, {
  isDefault: true
})

export default cmd

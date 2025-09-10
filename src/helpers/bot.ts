// Dependencies
import { ContextMessageUpdate, Telegraf } from 'telegraf'
const TelegrafBot = require('telegraf')

// Validate required environment variables
if (!process.env.TOKEN) {
  console.error('ERROR: TOKEN environment variable is required')
  process.exit(1)
}

export const bot = new TelegrafBot(process.env.TOKEN) as Telegraf<
  ContextMessageUpdate
>

// Initialize bot info with error handling
bot.telegram.getMe()
  .then(botInfo => {
    const anybot = bot as any
    anybot.options.username = botInfo.username
    console.info(`Bot initialized as @${botInfo.username}`)
  })
  .catch(error => {
    console.error('Failed to initialize bot:', error.message)
    process.exit(1)
  })

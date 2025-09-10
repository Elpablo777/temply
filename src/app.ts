// Config dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })

// Dependencies
import { bot } from './helpers/bot'
import { checkTime } from './middlewares/checkTime'
import { setupHelp } from './commands/help'
import { setupI18N } from './helpers/i18n'
import { setupLanguage } from './commands/language'
import { attachUser } from './middlewares/attachUser'
import { setupNewtemplate } from './commands/newtemplate'
import { setupInline } from './helpers/inline'
import { setupDeletetemplate } from './commands/deletetemplate'
import { setupPreview } from './commands/preview'
import { setupAppendtemplate } from './commands/appendtemplate'

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.info('SIGTERM received, shutting down gracefully')
  bot.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.info('SIGINT received, shutting down gracefully')
  bot.stop()
  process.exit(0)
})

// Setup middleware (order matters)
bot.use(checkTime)
bot.use(attachUser)

// Setup localization
try {
  setupI18N(bot)
} catch (error) {
  console.error('Failed to setup i18n:', error.message)
  process.exit(1)
}

// Setup inline functionality
try {
  setupInline(bot)
} catch (error) {
  console.error('Failed to setup inline:', error.message)
}

// Setup commands
try {
  setupHelp(bot)
  setupLanguage(bot)
  setupNewtemplate(bot)
  setupAppendtemplate(bot)
  setupDeletetemplate(bot)
  setupPreview(bot)
} catch (error) {
  console.error('Failed to setup commands:', error.message)
  process.exit(1)
}

// Enhanced error handling
bot.catch((error, ctx) => {
  console.error('Bot error occurred:', {
    error: error.message,
    updateType: ctx.updateType,
    userId: ctx.from ? ctx.from.id : null,
    chatId: ctx.chat ? ctx.chat.id : null,
    stack: error.stack
  })
  
  // Try to notify user of error (but don't fail if this fails)
  try {
    if (ctx.reply) {
      ctx.reply('Sorry, an unexpected error occurred. Please try again later.')
    }
  } catch (replyError) {
    console.error('Failed to send error message to user:', replyError.message)
  }
})

// Start bot with error handling
try {
  bot.startPolling()
  console.info('Bot is up and running')
} catch (error) {
  console.error('Failed to start bot polling:', error.message)
  process.exit(1)
}

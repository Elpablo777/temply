// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'

export function setupHelp(bot: Telegraf<ContextMessageUpdate>) {
  bot.command(['help', 'start'], (ctx) => {
    try {
      ctx.replyWithHTML(ctx.i18n.t('helpTemply'), {
        disable_web_page_preview: true,
      })
    } catch (error) {
      console.error('Error in help command:', error.message)
      ctx.reply('Welcome! This bot helps you manage message templates.')
    }
  })
}

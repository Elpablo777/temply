// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'

export function setupPreview(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('preview', async ctx => {
    try {
      if (!ctx.dbuser) {
        return ctx.reply('Error: User data not available. Please try again.')
      }
      
      ctx.dbuser.hidePreview = !ctx.dbuser.hidePreview
      await (ctx.dbuser as any).save()
      
      ctx.replyWithHTML(
        ctx.i18n.t(ctx.dbuser.hidePreview ? 'previewOff' : 'previewOn')
      )
    } catch (error) {
      console.error('Error in preview command:', error.message)
      ctx.reply('Failed to toggle preview setting. Please try again.')
    }
  })
}

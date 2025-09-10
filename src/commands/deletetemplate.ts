// Dependencies
import { Telegraf, ContextMessageUpdate, Markup as m } from 'telegraf'
import { User } from '../models'

export function setupDeletetemplate(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('deletetemplate', (ctx) => {
    try {
      return ctx.reply(ctx.i18n.t('deletetemplate'), {
        reply_markup: templateKeyboard(ctx.dbuser),
      })
    } catch (error) {
      console.error('Error in deletetemplate command:', error.message)
      ctx.reply('Sorry, there was an error processing your request.')
    }
  })

  bot.action(/r~.+/, async (ctx) => {
    try {
      if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
        console.warn('Invalid callback query data received')
        return
      }

      const callbackData = ctx.callbackQuery.data
      const parts = callbackData.split('~')
      
      if (parts.length !== 2 || parts[0] !== 'r') {
        console.warn('Malformed callback data:', callbackData)
        return ctx.answerCbQuery('Invalid action')
      }

      const templateNamePrefix = parts[1]
      if (!templateNamePrefix || templateNamePrefix.length === 0) {
        return ctx.answerCbQuery('Invalid template name')
      }

      const originalLength = ctx.dbuser.templates.length
      ctx.dbuser.templates = ctx.dbuser.templates.filter(
        (t) => !t.name.startsWith(templateNamePrefix)
      )
      
      if (ctx.dbuser.templates.length === originalLength) {
        return ctx.answerCbQuery('Template not found')
      }

      await (ctx.dbuser as any).save()
      
      try {
        await ctx.editMessageReplyMarkup(templateKeyboard(ctx.dbuser))
        ctx.answerCbQuery('Template deleted successfully')
      } catch (editError) {
        console.error('Error updating keyboard:', editError.message)
        ctx.answerCbQuery('Template deleted, but failed to update list')
      }
    } catch (error) {
      console.error('Error in delete template action:', error.message)
      ctx.answerCbQuery('Failed to delete template')
    }
  })
}

function templateKeyboard(user: User) {
  try {
    if (!user || !user.templates || user.templates.length === 0) {
      return m.inlineKeyboard([])
    }

    const result = []
    user.templates.forEach((template) => {
      if (!template || !template.name) {
        return // Skip invalid templates
      }
      
      const humanName =
        template.name.length > 30
          ? `${template.name.slice(0, 30)}...`
          : template.name
      
      // Use only the first 30 characters for the callback data to ensure uniqueness
      const callbackData = `r~${template.name.substr(0, 30)}`
      
      result.push([
        m.callbackButton(humanName, callbackData),
      ])
    })
    
    return m.inlineKeyboard(result)
  } catch (error) {
    console.error('Error creating template keyboard:', error.message)
    return m.inlineKeyboard([])
  }
}

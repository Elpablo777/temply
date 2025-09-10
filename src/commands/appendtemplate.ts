// Dependencies
import { Telegraf, ContextMessageUpdate, Extra } from 'telegraf'
import { Template } from '../models'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export function setupAppendtemplate(bot: Telegraf<ContextMessageUpdate>) {
  bot.command(['appendtemplate'], ctx => {
    try {
      ctx.replyWithHTML(ctx.i18n.t('appendtemplate'))
    } catch (error) {
      console.error('Error in appendtemplate command:', error.message)
      ctx.reply('Sorry, there was an error processing your request.')
    }
  })

  // Detect replies
  bot.use(async (ctx, next) => {
    try {
      if (
        !ctx.message ||
        !ctx.message.text ||
        !ctx.message.reply_to_message ||
        !ctx.message.reply_to_message.from ||
        !ctx.message.reply_to_message.from.username ||
        ctx.message.reply_to_message.from.username !== bot.options.username ||
        !ctx.message.reply_to_message.text ||
        !ctx.message.reply_to_message.text.includes('👍') ||
        ctx.message.text.split(': ').length < 2
      ) {
        return next()
      }

      // Validate input length
      if (ctx.message.text.length > 4096) {
        return ctx.reply('Text is too long. Please keep it under 4096 characters.')
      }

      const parts = ctx.message.text.split(': ')
      let name = parts[0]
      
      // Validate template name
      if (!name || name.trim().length === 0) {
        return ctx.reply('Template name cannot be empty.')
      }
      
      if (name.length > 60) {
        name = `${name.substring(0, 57)}...`
      }
      
      const textArray = [...parts]
      textArray.shift()
      const text = textArray.join(': ')
      
      // Validate append text
      if (!text || text.trim().length === 0) {
        return ctx.reply('Text to append cannot be empty.')
      }

      if (!ctx.dbuser || !ctx.dbuser.templates) {
        return ctx.reply('Error: User data not available. Please try again.')
      }

      let templateFound = false
      
      for (const template of ctx.dbuser.templates) {
        if (template && template.name === name) {
          templateFound = true
          
          // Check if the appended text would exceed limits
          const newText = `${template.text}${text}`
          if (newText.length > 4096) {
            return ctx.reply('Appending this text would make the template too long (max 4096 characters).')
          }
          
          template.text = newText
          
          // Sanitize the updated template
          if (template.sanitize) {
            template.sanitize()
          }
          
          try {
            await ctx.replyWithHTML(template.text)
            await (ctx.dbuser as any).save()

            await ctx.reply(ctx.i18n.t('appendtemplate_success'), Extra.inReplyTo(
              ctx.message.message_id
            ) as ExtraReplyMessage)
          } catch (err) {
            console.error('Error appending to template:', err.message)
            if (err.message.includes('HTML')) {
              await ctx.reply('Invalid HTML in template. Please check your formatting.')
            } else {
              await ctx.reply('Failed to append to template. Please try again.')
            }
          }
          break
        }
      }
      
      if (!templateFound) {
        ctx.reply('Template not found. Please check the template name.')
      }
    } catch (error) {
      console.error('Error in appendtemplate middleware:', error.message)
      if (ctx.reply) {
        ctx.reply('Sorry, there was an error processing your request.')
      }
    }
  })
}

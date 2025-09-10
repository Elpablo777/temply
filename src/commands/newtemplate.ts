// Dependencies
import { Telegraf, ContextMessageUpdate, Extra } from 'telegraf'
import { Template } from '../models'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export function setupNewtemplate(bot: Telegraf<ContextMessageUpdate>) {
  bot.command(['newtemplate'], ctx => {
    try {
      ctx.replyWithHTML(ctx.i18n.t('newtemplate'))
    } catch (error) {
      console.error('Error in newtemplate command:', error.message)
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
        !ctx.message.reply_to_message.text.includes('💪') ||
        ctx.message.text.split(': ').length < 2
      ) {
        return next()
      }

      // Validate input length
      if (ctx.message.text.length > 4096) {
        return ctx.reply('Template is too long. Please keep it under 4096 characters.')
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
      
      // Validate template text
      if (!text || text.trim().length === 0) {
        return ctx.reply('Template text cannot be empty.')
      }

      const template = new Template()
      template.name = name
      template.text = text
      
      // Sanitize the template
      template.sanitize()

      // Check for duplicate template names
      const existingTemplate = ctx.dbuser.templates.find(t => t.name === template.name)
      if (existingTemplate) {
        return ctx.reply('A template with this name already exists. Please choose a different name.')
      }

      // Check template limit
      if (ctx.dbuser.templates.length >= 100) {
        return ctx.reply('You have reached the maximum number of templates (100). Please delete some templates first.')
      }

      try {
        await ctx.replyWithHTML(template.text)
        ctx.dbuser.templates.push(template)
        await (ctx.dbuser as any).save()

        await ctx.reply(ctx.i18n.t('newtemplate_success'), Extra.inReplyTo(
          ctx.message.message_id
        ) as ExtraReplyMessage)
      } catch (err) {
        console.error('Error saving template:', err.message)
        if (err.message.includes('HTML')) {
          await ctx.reply('Invalid HTML in template. Please check your formatting.')
        } else {
          await ctx.reply('Failed to save template. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error in newtemplate middleware:', error.message)
      if (ctx.reply) {
        ctx.reply('Sorry, there was an error processing your template.')
      }
    }
  })
}

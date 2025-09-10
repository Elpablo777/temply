// Dependencies
import { Telegraf, ContextMessageUpdate, Markup as m, Extra } from 'telegraf'
import { readdirSync, readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'
import { ExtraEditMessage } from 'telegraf/typings/telegram-types'

export function setupLanguage(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('language', (ctx) => {
    try {
      ctx.reply(ctx.i18n.t('languageTemply'), {
        reply_markup: languageKeyboard(),
      })
    } catch (error) {
      console.error('Error in language command:', error.message)
      ctx.reply('Sorry, there was an error loading the language selection.')
    }
  })

  bot.action(
    localesFiles().map((file) => file.split('.')[0]),
    async (ctx) => {
      try {
        if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
          return ctx.answerCbQuery('Invalid language selection')
        }

        const languageCode = ctx.callbackQuery.data
        
        // Validate language code
        const availableLocales = localesFiles().map(file => file.split('.')[0])
        if (!availableLocales.includes(languageCode)) {
          return ctx.answerCbQuery('Invalid language code')
        }

        if (!ctx.dbuser) {
          return ctx.answerCbQuery('User data not available')
        }

        let user = ctx.dbuser
        user.language = languageCode
        user = await (user as any).save()
        
        const message = ctx.callbackQuery.message
        if (!message) {
          return ctx.answerCbQuery('Language updated successfully')
        }

        const anyI18N = ctx.i18n as any
        anyI18N.locale(languageCode)

        await ctx.telegram.editMessageText(
          message.chat.id,
          message.message_id,
          undefined,
          ctx.i18n.t('language_selected_temply'),
          Extra.HTML(true) as ExtraEditMessage
        )
        
        ctx.answerCbQuery('Language updated successfully')
      } catch (error) {
        console.error('Error in language selection:', error.message)
        ctx.answerCbQuery('Failed to update language')
      }
    }
  )
}

function languageKeyboard() {
  try {
    const locales = localesFiles()
    const result = []
    
    locales.forEach((locale, index) => {
      try {
        const localeCode = locale.split('.')[0]
        const localeData = safeLoad(
          readFileSync(`${__dirname}/../../locales/${locale}`, 'utf8')
        )
        
        if (!localeData || !localeData.name) {
          console.warn(`Invalid locale data for ${locale}`)
          return
        }
        
        const localeName = localeData.name
        
        if (index % 2 == 0) {
          if (index === 0) {
            result.push([m.callbackButton(localeName, localeCode)])
          } else {
            result[result.length - 1].push(m.callbackButton(localeName, localeCode))
          }
        } else {
          result[result.length - 1].push(m.callbackButton(localeName, localeCode))
          if (index < locales.length - 1) {
            result.push([])
          }
        }
      } catch (error) {
        console.error(`Error processing locale ${locale}:`, error.message)
      }
    })
    
    return m.inlineKeyboard(result)
  } catch (error) {
    console.error('Error creating language keyboard:', error.message)
    return m.inlineKeyboard([])
  }
}

function localesFiles() {
  try {
    const localesDir = `${__dirname}/../../locales`
    return readdirSync(localesDir).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
  } catch (error) {
    console.error('Error reading locales directory:', error.message)
    return []
  }
}

// Dependencies
import I18N from 'telegraf-i18n'
import Telegraf, { ContextMessageUpdate } from 'telegraf'
const dirtyI18N = require('telegraf-i18n')

let i18n: I18N

try {
  i18n = new dirtyI18N({
    directory: `${__dirname}/../../locales`,
    defaultLanguage: 'en',
    sessionName: 'session',
    useSession: false,
    allowMissing: true,
    defaultLanguageOnMissing: 'en',
  }) as I18N
} catch (error) {
  console.error('Failed to initialize i18n:', error.message)
  throw error
}

export function setupI18N(bot: Telegraf<ContextMessageUpdate>) {
  try {
    bot.use(i18n.middleware())
    bot.use((ctx, next) => {
      try {
        const anyI18N = ctx.i18n as any
        const userLanguage = ctx.dbuser && ctx.dbuser.language ? ctx.dbuser.language : 'en'
        anyI18N.locale(userLanguage)
        next()
      } catch (error) {
        console.error('Error setting user locale:', error.message)
        // Fallback to default language
        const anyI18N = ctx.i18n as any
        anyI18N.locale('en')
        next()
      }
    })
  } catch (error) {
    console.error('Error setting up i18n middleware:', error.message)
    throw error
  }
}

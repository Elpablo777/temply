// Dependencies
import { findUser } from '../models'
import { ContextMessageUpdate } from 'telegraf'

export async function attachUser(ctx: ContextMessageUpdate, next) {
  try {
    if (!ctx.from || !ctx.from.id) {
      console.warn('Message received without valid user information')
      return
    }
    
    const dbuser = await findUser(ctx.from.id)
    ctx.dbuser = dbuser
    next()
  } catch (error) {
    console.error('Error attaching user:', error.message)
    // Don't expose internal errors to user, but log them
    if (ctx.reply) {
      ctx.reply('Sorry, there was a temporary error. Please try again.')
    }
  }
}

import { ContextMessageUpdate } from 'telegraf'

export async function checkTime(ctx: ContextMessageUpdate, next: () => any) {
  try {
    const currentTime = new Date().getTime() / 1000
    const timeThreshold = 5 * 60 // 5 minutes
    
    switch (ctx.updateType) {
      case 'message':
        if (ctx.message && ctx.message.date) {
          if (currentTime - ctx.message.date < timeThreshold) {
            next()
          } else {
            console.log(
              `Ignoring old message from user ${ctx.from ? ctx.from.id : 'unknown'} in chat ${
                ctx.chat ? ctx.chat.id : 'unknown'
              } (age: ${Math.round(currentTime - ctx.message.date)}s)`
            )
          }
        } else {
          console.warn('Message received without date information')
          next() // Allow message through if date is missing
        }
        break
        
      case 'callback_query':
        if (
          ctx.callbackQuery &&
          ctx.callbackQuery.message &&
          ctx.callbackQuery.message.date
        ) {
          if (currentTime - ctx.callbackQuery.message.date < timeThreshold) {
            next()
          } else {
            console.log(
              `Ignoring old callback query from user ${ctx.from ? ctx.from.id : 'unknown'} in chat ${
                ctx.chat ? ctx.chat.id : 'unknown'
              } (age: ${Math.round(currentTime - ctx.callbackQuery.message.date)}s)`
            )
          }
        } else {
          console.warn('Callback query received without message date information')
          next() // Allow callback through if date is missing
        }
        break
        
      default:
        next()
        break
    }
  } catch (error) {
    console.error('Error in checkTime middleware:', error.message)
    // Continue processing on error to prevent blocking the bot
    next()
  }
}

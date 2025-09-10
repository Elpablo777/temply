// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'
const fuzzysearch = require('fuzzysearch')
import { v4 as uuid } from 'uuid'

export function setupInline(bot: Telegraf<ContextMessageUpdate>) {
  bot.on('inline_query', async (ctx) => {
    try {
      const { inlineQuery, answerInlineQuery, dbuser } = ctx
      
      if (!inlineQuery || !dbuser) {
        return answerInlineQuery([])
      }

      const offset = parseInt(inlineQuery.offset) || 0
      
      if (offset < 0) {
        return answerInlineQuery([])
      }

      let templates = dbuser.templates || []
      
      // Filter templates if query is provided
      if (inlineQuery.query && inlineQuery.query.trim().length > 0) {
        const query = inlineQuery.query.trim().toLowerCase()
        templates = templates.filter((t) => {
          if (!t || !t.text) return false
          try {
            return fuzzysearch(query, t.text.toLowerCase()) || 
                   fuzzysearch(query, (t.name || '').toLowerCase())
          } catch (error) {
            console.error('Error in fuzzy search:', error.message)
            return false
          }
        })
      }

      // Validate templates before processing
      templates = templates.filter(t => t && t.name && t.text)
      
      // Paginate results
      const paginatedTemplates = templates.slice(offset, offset + 30)
      
      const results = paginatedTemplates.map((template) => {
        try {
          return {
            type: 'article',
            id: uuid(),
            title: template.name || 'Untitled',
            description: template.text.length > 100 
              ? `${template.text.substring(0, 97)}...` 
              : template.text,
            input_message_content: {
              message_text: template.text,
              parse_mode: 'HTML',
              disable_web_page_preview: dbuser.hidePreview || false,
            },
          }
        } catch (error) {
          console.error('Error processing template for inline result:', error.message)
          return null
        }
      }).filter(result => result !== null)

      return answerInlineQuery(results, {
        next_offset: offset + 30 < templates.length ? `${offset + 30}` : '',
        is_personal: true,
        cache_time: 0,
      })
    } catch (error) {
      console.error('Error in inline query handler:', error.message)
      // Return empty results on error to prevent bot failure
      return ctx.answerInlineQuery([])
    }
  })
}

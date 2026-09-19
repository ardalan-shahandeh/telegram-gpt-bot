import 'dotenv/config'
import OpenAI from 'openai'
import { Telegraf } from 'telegraf'
import {
  clearMessages,
  getMessages,
  saveMessage,
} from './database'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

bot.start((ctx) => {
  clearMessages(ctx.from.id)

  ctx.reply(
    'سلام 👋 من دستیار هوش مصنوعی تو هستم.\n\nهر چیزی می‌خوای بپرس!'
  )
})

bot.command('newchat', (ctx) => {
  clearMessages(ctx.from.id)

  ctx.reply('✅ گفت‌وگوی جدید شروع شد.')
})

bot.command('clear', (ctx) => {
  clearMessages(ctx.from.id)

  ctx.reply('🗑️ تاریخچه گفت‌وگوی شما پاک شد.')
})

bot.on('text', async (ctx) => {
  try {
    const userId = ctx.from.id
    const userMessage = ctx.message.text

    saveMessage(userId, 'user', userMessage)

    const history = getMessages(userId)

    await ctx.sendChatAction('typing')

    const response = await ai.chat.completions.create({
      model: 'openrouter/free',
      messages: history,
    })

    const answer = response.choices[0]?.message?.content

    if (!answer) {
      await ctx.reply('متأسفانه جوابی دریافت نکردم 😕')
      return
    }

    saveMessage(userId, 'assistant', answer)

    await ctx.reply(answer)
  } catch (error) {
    console.error('AI Error:', error)

    await ctx.reply(
      'متأسفانه مشکلی در ارتباط با هوش مصنوعی پیش آمد 😕'
    )
  }
})

bot.launch()

console.log('🤖 Telegram bot is running...')
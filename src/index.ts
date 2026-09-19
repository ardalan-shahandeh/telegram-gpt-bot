import 'dotenv/config'
import OpenAI from 'openai'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

bot.start((ctx) => {
  ctx.reply('سلام 👋 من دستیار هوش مصنوعی تو هستم. هر چیزی می‌خوای بپرس!')
})

bot.on('text', async (ctx) => {
  try {
    const userMessage = ctx.message.text

    await ctx.sendChatAction('typing')

    const response = await ai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    const answer = response.choices[0]?.message?.content

    if (!answer) {
      await ctx.reply('متأسفانه جوابی دریافت نکردم 😕')
      return
    }

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
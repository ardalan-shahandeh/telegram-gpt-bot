import 'dotenv/config'
import OpenAI from 'openai'
import { Telegraf } from 'telegraf'

import {
  createConversation,
  getConversationByIdForUser,
  getConversationMessages,
  getOrCreateActiveConversation,
  getUserConversations,
  saveMessage,
  setActiveConversation,
} from './database'

const bot = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN!
)

const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

bot.start((ctx) => {
  const userId = ctx.from.id

  const conversationId =
    createConversation(userId)

  setActiveConversation(
    userId,
    conversationId
  )

  ctx.reply(
    'سلام 👋 من دستیار هوش مصنوعی تو هستم.\n\n' +
      'یک گفت‌وگوی جدید برایت ساخته شد. هر چیزی می‌خوای بپرس!'
  )
})

bot.command('newchat', (ctx) => {
  const userId = ctx.from.id

  const conversationId =
    createConversation(userId)

  setActiveConversation(
    userId,
    conversationId
  )

  ctx.reply(
    `✅ گفت‌وگوی جدید ساخته شد.\n\n` +
      `Conversation ID: ${conversationId}`
  )
})

bot.command('chats', (ctx) => {
  const userId = ctx.from.id

  const conversations =
    getUserConversations(userId)

  if (conversations.length === 0) {
    ctx.reply(
      'هنوز هیچ گفت‌وگویی نداری.'
    )

    return
  }

  const text = conversations
    .map(
      (conversation, index) =>
        `${index + 1}. ${conversation.title} (ID: ${conversation.id})`
    )
    .join('\n')

  ctx.reply(
    `💬 گفت‌وگوهای شما:\n\n${text}\n\n` +
      `برای ورود به یک گفت‌وگو:\n` +
      `/switch ID`
  )
})

bot.command('switch', (ctx) => {
  const userId = ctx.from.id

  const parts =
    ctx.message.text.trim().split(/\s+/)

  const conversationId =
    Number(parts[1])

  if (!conversationId) {
    ctx.reply(
      '❌ لطفاً ID گفت‌وگو را وارد کن.\n\n' +
        'مثال:\n' +
        '/switch 2'
    )

    return
  }

  const conversation =
    getConversationByIdForUser(
      userId,
      conversationId
    )

  if (!conversation) {
    ctx.reply(
      '❌ این گفت‌وگو پیدا نشد.'
    )

    return
  }

  setActiveConversation(
    userId,
    conversation.id
  )

  ctx.reply(
    `✅ وارد گفت‌وگوی "${conversation.title}" شدی.\n\n` +
      `Conversation ID: ${conversation.id}`
  )
})

bot.on('text', async (ctx) => {
  try {
    const userId = ctx.from.id
    const userMessage = ctx.message.text

    const conversationId =
      getOrCreateActiveConversation(
        userId
      )

    saveMessage(
      conversationId,
      'user',
      userMessage
    )

    const history =
      getConversationMessages(
        conversationId
      )

    await ctx.sendChatAction(
      'typing'
    )

    const response =
      await ai.chat.completions.create({
        model: 'openrouter/free',
        messages: history,
      })

    const answer =
      response.choices[0]?.message?.content

    if (!answer) {
      await ctx.reply(
        'متأسفانه جوابی دریافت نکردم 😕'
      )

      return
    }

    saveMessage(
      conversationId,
      'assistant',
      answer
    )

    await ctx.reply(answer)
  } catch (error) {
    console.error(
      'AI Error:',
      error
    )

    await ctx.reply(
      'متأسفانه مشکلی در ارتباط با هوش مصنوعی پیش آمد 😕'
    )
  }
})

bot.launch()

console.log(
  '🤖 Telegram bot is running...'
)
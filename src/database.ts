import Database from 'better-sqlite3'

const db = new Database('data/bot.db')

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id)
      REFERENCES conversations(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    user_id INTEGER PRIMARY KEY,
    active_conversation_id INTEGER NOT NULL,

    FOREIGN KEY (active_conversation_id)
      REFERENCES conversations(id)
      ON DELETE CASCADE
  );
`)

export function createConversation(
  userId: number,
  title = 'New Chat'
) {
  const result = db
    .prepare(`
      INSERT INTO conversations (user_id, title)
      VALUES (?, ?)
    `)
    .run(userId, title)

  return Number(result.lastInsertRowid)
}

export function getConversationByIdForUser(
  userId: number,
  conversationId: number
) {
  return db
    .prepare(`
      SELECT *
      FROM conversations
      WHERE id = ?
        AND user_id = ?
    `)
    .get(conversationId, userId) as
    | {
        id: number
        user_id: number
        title: string
        created_at: string
      }
    | undefined
}

export function setActiveConversation(
  userId: number,
  conversationId: number
) {
  db.prepare(`
    INSERT INTO user_sessions (
      user_id,
      active_conversation_id
    )
    VALUES (?, ?)

    ON CONFLICT(user_id)
    DO UPDATE SET
      active_conversation_id = excluded.active_conversation_id
  `).run(userId, conversationId)
}

export function getActiveConversation(userId: number) {
  const session = db
    .prepare(`
      SELECT active_conversation_id
      FROM user_sessions
      WHERE user_id = ?
    `)
    .get(userId) as
    | {
        active_conversation_id: number
      }
    | undefined

  if (!session) {
    return undefined
  }

  return getConversationByIdForUser(
    userId,
    session.active_conversation_id
  )
}

export function getOrCreateActiveConversation(
  userId: number
) {
  const activeConversation =
    getActiveConversation(userId)

  if (activeConversation) {
    return activeConversation.id
  }

  const conversationId =
    createConversation(userId)

  setActiveConversation(
    userId,
    conversationId
  )

  return conversationId
}

export function getConversationMessages(
  conversationId: number
) {
  return db
    .prepare(`
      SELECT role, content
      FROM messages
      WHERE conversation_id = ?
      ORDER BY id ASC
    `)
    .all(conversationId) as {
    role: 'user' | 'assistant'
    content: string
  }[]
}

export function saveMessage(
  conversationId: number,
  role: 'user' | 'assistant',
  content: string
) {
  db.prepare(`
    INSERT INTO messages (
      conversation_id,
      role,
      content
    )
    VALUES (?, ?, ?)
  `).run(
    conversationId,
    role,
    content
  )
}

export function getUserConversations(
  userId: number
) {
  return db
    .prepare(`
      SELECT *
      FROM conversations
      WHERE user_id = ?
      ORDER BY id DESC
    `)
    .all(userId) as {
    id: number
    user_id: number
    title: string
    created_at: string
  }[]
}
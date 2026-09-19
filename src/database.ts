import Database from 'better-sqlite3'

const db = new Database('data/bot.db')

db.pragma('journal_mode = WAL')

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

export function getLatestConversation(userId: number) {
  return db
    .prepare(`
      SELECT *
      FROM conversations
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1
    `)
    .get(userId) as
    | {
        id: number
        user_id: number
        title: string
        created_at: string
      }
    | undefined
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
  `).run(conversationId, role, content)
}

export function getUserConversations(userId: number) {
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
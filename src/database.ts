import Database from 'better-sqlite3'

const db = new Database('data/bot.db')

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function saveMessage(
  userId: number,
  role: 'user' | 'assistant',
  content: string
) {
  const statement = db.prepare(`
    INSERT INTO messages (user_id, role, content)
    VALUES (?, ?, ?)
  `)

  statement.run(userId, role, content)
}

export function getMessages(userId: number) {
  return db
    .prepare(`
      SELECT role, content
      FROM messages
      WHERE user_id = ?
      ORDER BY id ASC
    `)
    .all(userId) as {
    role: 'user' | 'assistant'
    content: string
  }[]
}

export function clearMessages(userId: number) {
  db.prepare(`
    DELETE FROM messages
    WHERE user_id = ?
  `).run(userId)
}
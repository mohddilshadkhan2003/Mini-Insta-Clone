const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'instagram.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(user_id, post_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  console.log('Creating database indexes...');
  
  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_follows_unique ON follows(follower_id, following_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

  console.log('Database initialized successfully with indexes');
}

module.exports = { db, initDatabase };

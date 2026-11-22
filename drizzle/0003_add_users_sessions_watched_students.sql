CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE watched_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

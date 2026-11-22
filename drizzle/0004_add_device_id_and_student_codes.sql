ALTER TABLE attempts ADD COLUMN device_id TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE student_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

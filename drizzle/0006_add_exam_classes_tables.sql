ALTER TABLE attempts ADD COLUMN class_id INTEGER;
--> statement-breakpoint
ALTER TABLE attempts ADD COLUMN class_name TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE exam_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  class_name TEXT NOT NULL,
  jenjang TEXT NOT NULL,
  subject_id TEXT NOT NULL DEFAULT '',
  subject_name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  question_count INTEGER NOT NULL DEFAULT 20,
  duration_minutes INTEGER NOT NULL DEFAULT 20,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open',
  package_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  closed_at INTEGER
);
--> statement-breakpoint
CREATE TABLE class_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  device_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress',
  score INTEGER,
  correct INTEGER,
  total INTEGER,
  duration_sec INTEGER,
  attempt_id INTEGER,
  joined_at INTEGER NOT NULL,
  finished_at INTEGER
);

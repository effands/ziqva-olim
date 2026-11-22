DROP TABLE entries;
--> statement-breakpoint
CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL DEFAULT 'Peserta',
  jenjang TEXT NOT NULL,
  mapel TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'ujian',
  score INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

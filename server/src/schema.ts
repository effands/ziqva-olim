import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentName: text("student_name").notNull().default("Peserta"),
  jenjang: text("jenjang").notNull(),
  // Kelas peserta di dalam jenjangnya saat sesi dikerjakan (id kelas:
  // TK "A"/"B", SD "1".."6", SMP "7".."9", SMA "10".."12"). Kosong untuk
  // attempt lama sebelum fitur kelas ada. Papan Peringkat & Challenge
  // tetap per jenjang — kelas tidak memecah divisi.
  kelas: text("kelas").notNull().default(""),
  mapel: text("mapel").notNull(),
  mode: text("mode").notNull().default("ujian"),
  score: integer("score").notNull(),
  correct: integer("correct").notNull(),
  total: integer("total").notNull(),
  durationSec: integer("duration_sec").notNull().default(0),
  deviceId: text("device_id").notNull().default(""),
  // Tertaut ke Kelas Ujian bila percobaan ini berasal dari sesi kelas
  // (null untuk latihan/ujian mandiri biasa).
  classId: integer("class_id"),
  className: text("class_name").notNull().default(""),
  // Penanda sesi Uji Coba Superadmin: klien mengirim true bila saat sesi
  // disimpan pengguna sedang login sebagai Superadmin (admin). Attempt
  // uji coba tetap tampil di Prestasiku pemilik, tetapi TIDAK dihitung di
  // Papan Peringkat, Challenge Bulanan, maupun statistik Panel Superadmin.
  isTrial: integer("is_trial", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Kelas Ujian yang dibuat guru (Mode Kelas Ujian). Paket soal yang sama
// untuk satu kelas disimpan sebagai JSON di package_json; urutan soal &
// pilihan diacak di perangkat masing-masing siswa saat sesi dimulai.
export const examClasses = sqliteTable("exam_classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: integer("teacher_id").notNull(),
  className: text("class_name").notNull(),
  jenjang: text("jenjang").notNull(),
  subjectId: text("subject_id").notNull().default(""),
  subjectName: text("subject_name").notNull(),
  level: integer("level").notNull().default(1),
  questionCount: integer("question_count").notNull().default(20),
  durationMinutes: integer("duration_minutes").notNull().default(20),
  code: text("code").notNull().unique(),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  packageJson: text("package_json").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
});

// Peserta satu Kelas Ujian. Satu baris per nama (name_key) per kelas:
// nama yang sama bergabung lagi dianggap peserta yang sama (dilanjutkan
// bila belum selesai, ditolak sebagai "sudah selesai" bila sudah selesai)
// supaya peringkat kelas tidak kacau oleh duplikat.
export const classParticipants = sqliteTable("class_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull(),
  studentName: text("student_name").notNull(),
  nameKey: text("name_key").notNull(),
  deviceId: text("device_id").notNull().default(""),
  status: text("status", { enum: ["in_progress", "finished"] }).notNull().default("in_progress"),
  score: integer("score"),
  correct: integer("correct"),
  total: integer("total"),
  durationSec: integer("duration_sec"),
  attemptId: integer("attempt_id"),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
});

export const studentCodes = sqliteTable("student_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentName: text("student_name").notNull(),
  nameKey: text("name_key").notNull().unique(),
  code: text("code").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["guru", "orangtua", "admin"] }).notNull(),
  organization: text("organization").notNull().default(""),
  // Kontak untuk info olimpiade: minimal salah satu diisi saat daftar
  // (ditegakkan di aksi register). Akun lama kolomnya kosong.
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull().default(""),
  // Detail Profil Saya (bisa diedit lewat aksi updateProfile): nama anak
  // (untuk orang tua), kota/kabupaten, dan alamat sekolah.
  childName: text("child_name").notNull().default(""),
  city: text("city").notNull().default(""),
  schoolAddress: text("school_address").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const watchedStudents = sqliteTable("watched_students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  studentName: text("student_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Pengaturan aplikasi key-value yang bisa diubah Superadmin dari panel
// (judul challenge bulanan, teks hadiah, target sesi Finisher).
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Kehadiran perangkat: satu baris per perangkat (device_id unik), diperbarui
// tiap heartbeat dari klien. Baris dengan last_seen dalam jendela ONLINE_WINDOW
// dihitung sebagai "pemakai online" saat ini.
export const presence = sqliteTable("presence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().unique(),
  lastSeen: integer("last_seen", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

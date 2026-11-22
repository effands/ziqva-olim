import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import * as schema from "./schema";

async function hashPassword(password: string, salt: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomHex(bytes: number) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function makePasswordRecord(password: string) {
  const salt = randomHex(16);
  return `${salt}$${await hashPassword(password, salt)}`;
}
async function checkPassword(password: string, record: string) {
  const [salt = "", hash = ""] = record.split("$");
  return (await hashPassword(password, salt)) === hash;
}

const userShape = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  role: z.string(),
  organization: z.string(),
});

type UserRow = typeof schema.users.$inferSelect;

function toUser(u: UserRow) {
  return { id: u.id, name: u.name, username: u.username, role: u.role, organization: u.organization };
}

async function userForToken(ctx: Ctx, token: string): Promise<UserRow> {
  const db = ctx.db<typeof schema>();
  const sess = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token)).limit(1);
  const s = sess[0];
  if (!s) throw new Error("Sesi login sudah berakhir. Silakan masuk lagi.");
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, s.userId)).limit(1);
  const u = rows[0];
  if (!u) throw new Error("Akun tidak ditemukan. Silakan masuk lagi.");
  return u;
}

async function createSession(ctx: Ctx, userId: number) {
  const db = ctx.db<typeof schema>();
  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  await db.insert(schema.sessions).values({ userId, token });
  return token;
}

async function requireAdmin(ctx: Ctx, token: string): Promise<UserRow> {
  const user = await userForToken(ctx, token);
  if (user.role !== "admin") throw new Error("Hanya Superadmin yang bisa membuka dan mengelola panel ini.");
  return user;
}

function nameKey(name: string) {
  return name.trim().toLowerCase();
}
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeMonitorCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}
async function ensureStudentCode(ctx: Ctx, studentName: string) {
  const db = ctx.db<typeof schema>();
  const key = nameKey(studentName);
  const rows = await db.select().from(schema.studentCodes).where(eq(schema.studentCodes.nameKey, key)).limit(1);
  const existing = rows[0];
  if (existing) return existing.code;
  const code = makeMonitorCode();
  await db.insert(schema.studentCodes).values({ studentName: studentName.trim(), nameKey: key, code });
  return code;
}

// Jendela "online": perangkat dihitung sedang online bila heartbeat terakhirnya
// masuk dalam 90 detik terakhir (klien mengirim heartbeat tiap ±30 detik).
const ONLINE_WINDOW_MS = 90_000;

async function countOnline(ctx: Ctx): Promise<number> {
  const db = ctx.db<typeof schema>();
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const rows = await db.select({ id: schema.presence.id })
    .from(schema.presence)
    .where(gte(schema.presence.lastSeen, cutoff));
  return rows.length;
}

const attemptShape = z.object({
  id: z.number(),
  student_name: z.string(),
  jenjang: z.string(),
  mapel: z.string(),
  mode: z.string(),
  score: z.number(),
  correct: z.number(),
  total: z.number(),
  duration_sec: z.number(),
  created_at: z.string(),
  monitor_code: z.string(),
  class_id: z.number().nullable(),
  class_name: z.string(),
});

/* ---------------- Mode Kelas Ujian ---------------- */
const questionShape = z.object({
  q: z.string().min(1).max(2000),
  stimulus: z.string().max(2000).optional(),
  emoji: z.string().max(16).optional(),
  options: z.array(z.string().min(1).max(500)).min(3).max(5),
  answer: z.number().int().min(0).max(4),
  explain: z.string().max(2000),
});
type QuestionData = z.infer<typeof questionShape>;

/* Soal versi SISWA untuk Kelas Ujian: TANPA kunci jawaban (answer) dan
   TANPA pembahasan (explain). Kunci hanya tinggal di server untuk
   penilaian submitClassResult — siswa tidak bisa membaca jawaban dari
   data yang diterima perangkatnya selama ujian berlangsung. */
const studentQuestionShape = z.object({
  q: z.string(),
  stimulus: z.string().optional(),
  emoji: z.string().optional(),
  options: z.array(z.string()),
});
function toStudentQuestion(q: QuestionData) {
  const sq: { q: string; options: string[]; stimulus?: string; emoji?: string } = { q: q.q, options: q.options };
  if (q.stimulus) sq.stimulus = q.stimulus;
  if (q.emoji) sq.emoji = q.emoji;
  return sq;
}

const classInfoShape = z.object({
  id: z.number(),
  class_name: z.string(),
  jenjang: z.string(),
  subject_id: z.string(),
  subject_name: z.string(),
  level: z.number(),
  question_count: z.number(),
  duration_minutes: z.number(),
  code: z.string(),
  status: z.string(),
  created_at: z.string(),
  participant_count: z.number(),
  finished_count: z.number(),
});
const participantShape = z.object({
  id: z.number(),
  student_name: z.string(),
  status: z.string(),
  score: z.number().nullable(),
  correct: z.number().nullable(),
  total: z.number().nullable(),
  duration_sec: z.number().nullable(),
  joined_at: z.string(),
  finished_at: z.string().nullable(),
});
const rankingEntryShape = z.object({
  rank: z.number(),
  participant_id: z.number(),
  student_name: z.string(),
  score: z.number(),
  correct: z.number(),
  total: z.number(),
  duration_sec: z.number(),
  finished_at: z.string(),
});
type ClassRow = typeof schema.examClasses.$inferSelect;
type ParticipantRow = typeof schema.classParticipants.$inferSelect;

function makeClassCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `KLS-${[...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")}`;
}
function normalizeClassCode(raw: string): string {
  const c = raw.trim().toUpperCase().replace(/\s+/g, "");
  return c.startsWith("KLS-") || c.startsWith("KLS") ? (c.startsWith("KLS-") ? c : `KLS-${c.slice(3)}`) : c;
}
function parsePackage(json: string): QuestionData[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as QuestionData[];
  } catch { return []; }
}
function rankFinished(participants: ParticipantRow[]) {
  const finished = participants.filter((p) => p.status === "finished" && p.score !== null);
  finished.sort((a, b) =>
    (b.score ?? 0) - (a.score ?? 0) ||
    (a.durationSec ?? 0) - (b.durationSec ?? 0) ||
    (a.finishedAt?.getTime() ?? 0) - (b.finishedAt?.getTime() ?? 0),
  );
  return finished.map((p, i) => ({
    rank: i + 1,
    participant_id: p.id,
    student_name: p.studentName,
    score: p.score ?? 0,
    correct: p.correct ?? 0,
    total: p.total ?? 0,
    duration_sec: p.durationSec ?? 0,
    finished_at: p.finishedAt ? p.finishedAt.toISOString() : p.joinedAt.toISOString(),
  }));
}
function toParticipant(p: ParticipantRow) {
  return {
    id: p.id,
    student_name: p.studentName,
    status: p.status,
    score: p.score,
    correct: p.correct,
    total: p.total,
    duration_sec: p.durationSec,
    joined_at: p.joinedAt.toISOString(),
    finished_at: p.finishedAt ? p.finishedAt.toISOString() : null,
  };
}
function toClassInfo(c: ClassRow, participants: ParticipantRow[]) {
  return {
    id: c.id,
    class_name: c.className,
    jenjang: c.jenjang,
    subject_id: c.subjectId,
    subject_name: c.subjectName,
    level: c.level,
    question_count: c.questionCount,
    duration_minutes: c.durationMinutes,
    code: c.code,
    status: c.status,
    created_at: c.createdAt.toISOString(),
    participant_count: participants.length,
    finished_count: participants.filter((p) => p.status === "finished").length,
  };
}

export const Actions = {
  saveAttempt: defineAction({
    description: "Saves one finished olympiad practice attempt with its score and returns the student's monitoring code.",
    request: z.object({
      student_name: z.string().trim().min(1).max(40),
      jenjang: z.string().min(1).max(20),
      mapel: z.string().min(1).max(60),
      mode: z.enum(["ujian", "latihan"]),
      score: z.number().int().min(0).max(100),
      correct: z.number().int().min(0).max(100),
      total: z.number().int().min(1).max(100),
      duration_sec: z.number().int().min(0).max(86400),
      device_id: z.string().max(100).default(""),
    }),
    response: z.object({ id: z.number(), monitor_code: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const result = await db
        .insert(schema.attempts)
        .values({
          studentName: args.student_name,
          jenjang: args.jenjang,
          mapel: args.mapel,
          mode: args.mode,
          score: args.score,
          correct: args.correct,
          total: args.total,
          durationSec: args.duration_sec,
          deviceId: args.device_id,
        })
        .returning({ id: schema.attempts.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Gagal menyimpan hasil latihan.");
      const monitorCode = await ensureStudentCode(ctx, args.student_name);
      ctx.invalidateQueries();
      return { id: inserted.id, monitor_code: monitorCode };
    },
  }),

  listAttempts: defineAction({
    description: "Lists practice attempts recorded on this device only, newest first, with summary stats and each student's monitoring code.",
    request: z.object({
      limit: z.number().int().positive().max(100).default(30),
      device_id: z.string().max(100).default(""),
    }),
    response: z.object({
      attempts: z.array(attemptShape),
      stats: z.object({
        total_attempts: z.number(),
        average_score: z.number(),
        best_score: z.number(),
        total_questions: z.number(),
        total_correct: z.number(),
      }),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      // Riwayat "Prestasiku" hanya menampilkan latihan dari perangkat ini sendiri,
      // bukan data semua peserta.
      const rows = args.device_id
        ? await db.select().from(schema.attempts)
            .where(eq(schema.attempts.deviceId, args.device_id))
            .orderBy(desc(schema.attempts.id)).limit(500)
        : [];
      const codeRows = await db.select().from(schema.studentCodes);
      const codeByKey = new Map(codeRows.map((c) => [c.nameKey, c.code]));
      const totalAttempts = rows.length;
      const avg = totalAttempts
        ? Math.round(rows.reduce((s, r) => s + r.score, 0) / totalAttempts)
        : 0;
      const best = totalAttempts ? Math.max(...rows.map((r) => r.score)) : 0;
      return {
        attempts: rows.slice(0, args.limit).map((r) => ({
          id: r.id,
          student_name: r.studentName,
          jenjang: r.jenjang,
          mapel: r.mapel,
          mode: r.mode,
          score: r.score,
          correct: r.correct,
          total: r.total,
          duration_sec: r.durationSec,
          created_at: r.createdAt.toISOString(),
          monitor_code: codeByKey.get(nameKey(r.studentName)) ?? "",
          class_id: r.classId ?? null,
          class_name: r.className ?? "",
        })),
        stats: {
          total_attempts: totalAttempts,
          average_score: avg,
          best_score: best,
          total_questions: rows.reduce((s, r) => s + r.total, 0),
          total_correct: rows.reduce((s, r) => s + r.correct, 0),
        },
      };
    },
  }),

  getLeaderboard: defineAction({
    description: "Returns the public leaderboard for one jenjang: each participant appears once with their best score in that jenjang (all subjects combined), ranked by score descending and, for equal scores, by fastest completion time.",
    request: z.object({
      jenjang: z.string().min(1).max(20),
      limit: z.number().int().positive().max(100).default(50),
    }),
    response: z.object({
      jenjang: z.string(),
      total_participants: z.number(),
      total_attempts: z.number(),
      entries: z.array(z.object({
        rank: z.number(),
        student_name: z.string(),
        score: z.number(),
        correct: z.number(),
        total: z.number(),
        duration_sec: z.number(),
        mapel: z.string(),
        mode: z.string(),
        created_at: z.string(),
        attempts_count: z.number(),
      })),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.attempts)
        .where(eq(schema.attempts.jenjang, args.jenjang))
        .orderBy(desc(schema.attempts.id)).limit(5000);

      // Satu baris per peserta (berdasarkan nama): ambil percobaan dengan
      // skor TERBAIK peserta itu di jenjang ini; bila skor terbaiknya sama
      // di beberapa percobaan, ambil yang waktu pengerjaannya TERCEPAT
      // (lalu yang paling awal diraih).
      type Row = (typeof rows)[number];
      const byStudent = new Map<string, { best: Row; count: number }>();
      for (const r of rows) {
        const key = nameKey(r.studentName);
        const cur = byStudent.get(key);
        if (!cur) { byStudent.set(key, { best: r, count: 1 }); continue; }
        cur.count += 1;
        const b = cur.best;
        const better =
          r.score > b.score ||
          (r.score === b.score && r.durationSec < b.durationSec) ||
          (r.score === b.score && r.durationSec === b.durationSec && r.createdAt.getTime() < b.createdAt.getTime());
        if (better) cur.best = r;
      }

      // Urutan peringkat: nilai tertinggi dulu; nilai sama → tercepat
      // mengerjakan yang menang; masih sama → yang meraihnya lebih dulu.
      const ranked = [...byStudent.values()].sort((a, b) =>
        b.best.score - a.best.score ||
        a.best.durationSec - b.best.durationSec ||
        a.best.createdAt.getTime() - b.best.createdAt.getTime(),
      );

      return {
        jenjang: args.jenjang,
        total_participants: ranked.length,
        total_attempts: rows.length,
        entries: ranked.slice(0, args.limit).map((g, i) => ({
          rank: i + 1,
          student_name: g.best.studentName,
          score: g.best.score,
          correct: g.best.correct,
          total: g.best.total,
          duration_sec: g.best.durationSec,
          mapel: g.best.mapel,
          mode: g.best.mode,
          created_at: g.best.createdAt.toISOString(),
          attempts_count: g.count,
        })),
      };
    },
  }),

  register: defineAction({
    description: "Creates a teacher (guru), parent (orang tua), or the single Superadmin (admin) account for monitoring student scores.",
    request: z.object({
      name: z.string().trim().min(1, "Nama wajib diisi").max(60),
      username: z.string().trim().toLowerCase().min(3, "Username minimal 3 karakter").max(30).regex(/^[a-z0-9_.]+$/, "Username hanya boleh huruf kecil, angka, titik, dan garis bawah"),
      password: z.string().min(6, "Kata sandi minimal 6 karakter").max(72),
      role: z.enum(["guru", "orangtua", "admin"]),
      organization: z.string().trim().max(80).default(""),
      whatsapp: z.string().trim().max(30).default(""),
      email: z.string().trim().max(120).default(""),
    }),
    response: z.object({ token: z.string(), user: userShape }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      // Minimal salah satu kontak wajib diisi, supaya pemilik bisa mengirim
      // info olimpiade terbaru ke pendaftar.
      if (!args.whatsapp && !args.email) {
        throw new Error("Isi minimal salah satu: Nomor WhatsApp atau Email, supaya kami bisa mengirim info olimpiade terbaru.");
      }
      // Superadmin hanya boleh ada SATU di seluruh aplikasi (akun pemilik).
      if (args.role === "admin") {
        const admins = await db.select({ id: schema.users.id }).from(schema.users)
          .where(eq(schema.users.role, "admin")).limit(1);
        if (admins[0]) throw new Error("Akun Superadmin sudah ada. Hanya boleh ada satu Superadmin.");
      }
      const existing = await db.select().from(schema.users).where(eq(schema.users.username, args.username)).limit(1);
      if (existing[0]) throw new Error("Username itu sudah dipakai. Coba username lain atau masuk dengan akun yang ada.");
      const inserted = await db.insert(schema.users).values({
        name: args.name, username: args.username,
        passwordHash: await makePasswordRecord(args.password),
        role: args.role, organization: args.organization,
        whatsapp: args.whatsapp, email: args.email,
      }).returning();
      const user = inserted[0];
      if (!user) throw new Error("Gagal membuat akun. Coba lagi ya.");
      const token = await createSession(ctx, user.id);
      ctx.invalidateQueries();
      return { token, user: toUser(user) };
    },
  }),

  login: defineAction({
    description: "Logs in a teacher, parent, or admin account with a single identifier field: the account's username, registered WhatsApp number, or registered email, plus password.",
    request: z.object({
      identifier: z.string().trim().min(1).max(120),
      password: z.string().min(1).max(72),
    }),
    response: z.object({ token: z.string(), user: userShape }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const needle = args.identifier.trim();
      const lower = needle.toLowerCase();
      // Normalisasi nomor WA: hanya angka; awalan 62 dan 0 dianggap sama
      // (62812… ≡ 0812…), supaya pengguna bebas mengetik format mana pun.
      const canonWa = (v: string) => {
        const d = v.replace(/\D/g, "");
        return d.startsWith("62") ? `0${d.slice(2)}` : d;
      };
      const needleWa = canonWa(needle);
      let user: UserRow | undefined;
      const byUsername = await db.select().from(schema.users).where(eq(schema.users.username, lower)).limit(1);
      user = byUsername[0];
      if (!user) {
        // Email tersimpan apa adanya saat daftar → bandingkan huruf kecil
        // di kedua sisi; WA tersimpan apa adanya → bandingkan sesudah
        // normalisasi. Tabel akun kecil, jadi pemindaian ini murah.
        const all = await db.select().from(schema.users);
        user = all.find((u) => u.email !== "" && u.email.trim().toLowerCase() === lower)
          ?? (needleWa.length >= 9
            ? all.find((u) => u.whatsapp !== "" && canonWa(u.whatsapp) === needleWa)
            : undefined);
      }
      if (!user || !(await checkPassword(args.password, user.passwordHash))) {
        throw new Error("Data masuk atau kata sandi salah. Periksa lagi ya.");
      }
      const token = await createSession(ctx, user.id);
      return { token, user: toUser(user) };
    },
  }),

  me: defineAction({
    description: "Returns the currently logged-in teacher/parent account for a session token, or null.",
    request: z.object({ token: z.string().max(200) }),
    response: z.object({ user: userShape.nullable() }),
    async handler(ctx, args) {
      if (!args.token) return { user: null };
      try {
        const u = await userForToken(ctx, args.token);
        return { user: toUser(u) };
      } catch {
        return { user: null };
      }
    },
  }),

  logout: defineAction({
    description: "Logs out a teacher/parent session token.",
    request: z.object({ token: z.string().max(200) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.sessions).where(eq(schema.sessions.token, args.token));
      return { ok: true };
    },
  }),

  addWatchedStudent: defineAction({
    description: "Adds a student to the logged-in teacher/parent roster after verifying the student's monitoring code.",
    request: z.object({
      token: z.string().min(1).max(200),
      student_name: z.string().trim().min(1, "Nama anak wajib diisi").max(40),
      code: z.string().trim().min(1, "Kode pantau wajib diisi").max(12),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const user = await userForToken(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const codeRows = await db.select().from(schema.studentCodes)
        .where(eq(schema.studentCodes.nameKey, nameKey(args.student_name))).limit(1);
      const codeRow = codeRows[0];
      if (!codeRow || codeRow.code !== args.code.trim().toUpperCase()) {
        throw new Error("Kode pantau tidak cocok untuk nama itu. Minta kode pantau yang tampil di layar hasil / Prestasiku anak, lalu coba lagi.");
      }
      const existing = await db.select().from(schema.watchedStudents)
        .where(and(eq(schema.watchedStudents.userId, user.id), eq(schema.watchedStudents.studentName, args.student_name)));
      const dup = existing.find((w) => w.studentName.toLowerCase() === args.student_name.toLowerCase());
      if (dup) return { id: dup.id };
      const inserted = await db.insert(schema.watchedStudents)
        .values({ userId: user.id, studentName: args.student_name }).returning({ id: schema.watchedStudents.id });
      const row = inserted[0];
      if (!row) throw new Error("Gagal menambahkan anak. Coba lagi ya.");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  removeWatchedStudent: defineAction({
    description: "Removes a student name from the logged-in parent's watch list.",
    request: z.object({ token: z.string().min(1).max(200), id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const user = await userForToken(ctx, args.token);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.watchedStudents)
        .where(and(eq(schema.watchedStudents.id, args.id), eq(schema.watchedStudents.userId, user.id)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  monitorDashboard: defineAction({
    description: "Returns monitoring data scoped to the students on the logged-in teacher/parent roster (each added with that student's monitoring code).",
    request: z.object({ token: z.string().min(1).max(200) }),
    response: z.object({
      user: userShape,
      watched: z.array(z.object({ id: z.number(), student_name: z.string() })),
      attempts: z.array(attemptShape),
      students: z.array(z.object({
        student_name: z.string(),
        attempts: z.number(),
        average_score: z.number(),
        best_score: z.number(),
        total_correct: z.number(),
        total_questions: z.number(),
        last_at: z.string(),
        last_mapel: z.string(),
      })),
    }),
    async handler(ctx, args) {
      const user = await userForToken(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const watchedRows = await db.select().from(schema.watchedStudents)
        .where(eq(schema.watchedStudents.userId, user.id)).orderBy(desc(schema.watchedStudents.id));
      const watched = watchedRows.map((w) => ({ id: w.id, student_name: w.studentName }));

      const all = await db.select().from(schema.attempts).orderBy(desc(schema.attempts.id)).limit(1000);
      // Guru maupun orang tua hanya melihat peserta di daftar pantau mereka sendiri
      // (yang ditambahkan dengan kode pantau peserta) — bukan data semua anak.
      const visible = all.filter((a) => watched.some((w) => w.student_name.toLowerCase() === a.studentName.toLowerCase()));

      const byStudent = new Map<string, typeof visible>();
      for (const a of visible) {
        const key = a.studentName;
        const list = byStudent.get(key) ?? [];
        list.push(a);
        byStudent.set(key, list);
      }
      const students = [...byStudent.entries()].map(([studentName, list]) => {
        const first = list[0];
        return {
          student_name: studentName,
          attempts: list.length,
          average_score: Math.round(list.reduce((s, r) => s + r.score, 0) / list.length),
          best_score: Math.max(...list.map((r) => r.score)),
          total_correct: list.reduce((s, r) => s + r.correct, 0),
          total_questions: list.reduce((s, r) => s + r.total, 0),
          last_at: first ? first.createdAt.toISOString() : new Date(0).toISOString(),
          last_mapel: first ? first.mapel : "",
        };
      }).sort((a, b) => b.average_score - a.average_score || b.attempts - a.attempts);

      return {
        user: toUser(user),
        watched,
        attempts: visible.slice(0, 100).map((r) => ({
          id: r.id, student_name: r.studentName, jenjang: r.jenjang, mapel: r.mapel, mode: r.mode,
          score: r.score, correct: r.correct, total: r.total, duration_sec: r.durationSec,
          created_at: r.createdAt.toISOString(), monitor_code: "",
          class_id: r.classId ?? null, class_name: r.className ?? "",
        })),
        students,
      };
    },
  }),

  deleteAttempt: defineAction({
    description: "Deletes one practice attempt recorded on this device from its history.",
    request: z.object({ id: z.number().int().positive(), device_id: z.string().max(100).default("") }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.attempts)
        .where(and(eq(schema.attempts.id, args.id), eq(schema.attempts.deviceId, args.device_id)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  heartbeat: defineAction({
    description: "Records this device as currently present (online) and returns how many devices are online right now.",
    request: z.object({ device_id: z.string().trim().min(1).max(100) }),
    response: z.object({ online: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const now = new Date();
      const existing = await db.select().from(schema.presence)
        .where(eq(schema.presence.deviceId, args.device_id)).limit(1);
      if (existing[0]) {
        await db.update(schema.presence)
          .set({ lastSeen: now })
          .where(eq(schema.presence.deviceId, args.device_id));
      } else {
        await db.insert(schema.presence).values({ deviceId: args.device_id, lastSeen: now });
      }
      // Bersihkan baris kehadiran yang sudah lama mati agar tabel tetap kecil.
      await db.delete(schema.presence)
        .where(lt(schema.presence.lastSeen, new Date(Date.now() - 24 * 60 * 60 * 1000)));
      return { online: await countOnline(ctx) };
    },
  }),

  getOnlineCount: defineAction({
    description: "Returns how many devices are currently online (heartbeat within the last 90 seconds).",
    request: z.object({}),
    response: z.object({ online: z.number() }),
    async handler(ctx) {
      return { online: await countOnline(ctx) };
    },
  }),

  resetAllData: defineAction({
    description: "Resets all trial data on this device: deletes its practice history, orphaned monitoring codes, and (when a parent/teacher token is given) that account's watch list and session, so the app starts completely fresh.",
    request: z.object({
      device_id: z.string().max(100).default(""),
      token: z.string().max(200).default(""),
    }),
    response: z.object({ ok: z.literal(true), deleted_attempts: z.number(), cleared_watched: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; deleted_attempts: number; cleared_watched: number }> {
      const db = ctx.db<typeof schema>();
      let deletedAttempts = 0;
      let clearedWatched = 0;

      if (args.device_id) {
        // Baris kehadiran perangkat ini ikut dihapus: device_id akan diputar
        // oleh klien, jadi perangkat lama tidak boleh tertinggal sebagai online.
        await db.delete(schema.presence).where(eq(schema.presence.deviceId, args.device_id));
        const deviceRows = await db.select().from(schema.attempts).where(eq(schema.attempts.deviceId, args.device_id));
        deletedAttempts = deviceRows.length;
        if (deviceRows.length > 0) {
          const nameKeys = [...new Set(deviceRows.map((r) => nameKey(r.studentName)))];
          await db.delete(schema.attempts).where(eq(schema.attempts.deviceId, args.device_id));
          // Hapus Kode Pantau yang sudah tidak punya riwayat latihan sama sekali
          // (dari perangkat mana pun), supaya mulai benar-benar bersih.
          const remainingAll = await db.select().from(schema.attempts).limit(5000);
          for (const key of nameKeys) {
            const hasAny = remainingAll.some((a) => nameKey(a.studentName) === key);
            if (!hasAny) {
              await db.delete(schema.studentCodes).where(eq(schema.studentCodes.nameKey, key));
            }
          }
        }
      }

      if (args.token) {
        try {
          const user = await userForToken(ctx, args.token);
          const watchedRows = await db.select().from(schema.watchedStudents).where(eq(schema.watchedStudents.userId, user.id));
          clearedWatched = watchedRows.length;
          await db.delete(schema.watchedStudents).where(eq(schema.watchedStudents.userId, user.id));
          await db.delete(schema.sessions).where(eq(schema.sessions.token, args.token));
        } catch {
          // Token sudah tidak valid — reset perangkat tetap dilanjutkan.
        }
      }

      ctx.invalidateQueries();
      return { ok: true as const, deleted_attempts: deletedAttempts, cleared_watched: clearedWatched };
    },
  }),

  createExamClass: defineAction({
    description: "Creates an exam class (Mode Kelas Ujian) for a logged-in teacher: stores one shared question package and returns the class with its shareable class code.",
    request: z.object({
      token: z.string().min(1).max(200),
      class_name: z.string().trim().min(1, "Nama kelas wajib diisi").max(60),
      jenjang: z.string().min(1).max(20),
      subject_id: z.string().max(60).default(""),
      subject_name: z.string().trim().min(1).max(60),
      level: z.number().int().min(1).max(5),
      question_count: z.number().int().min(5).max(30),
      duration_minutes: z.number().int().min(5).max(120),
      questions: z.array(questionShape).min(5).max(30),
    }),
    response: z.object({ class: classInfoShape }),
    async handler(ctx, args) {
      const user = await userForToken(ctx, args.token);
      if (user.role !== "guru") throw new Error("Hanya akun Guru yang bisa membuat Kelas Ujian. Masuk dengan akun Guru dulu ya.");
      if (args.questions.length !== args.question_count) {
        throw new Error(`Paket soal tidak lengkap: butuh ${args.question_count} soal, terkirim ${args.questions.length}. Coba buat lagi ya.`);
      }
      for (const q of args.questions) {
        if (q.answer < 0 || q.answer >= q.options.length) throw new Error("Ada soal dengan kunci jawaban tidak valid. Coba buat paket lagi ya.");
      }
      const db = ctx.db<typeof schema>();
      let code = makeClassCode();
      for (let attempt = 0; attempt < 10; attempt++) {
        const clash = await db.select({ id: schema.examClasses.id }).from(schema.examClasses).where(eq(schema.examClasses.code, code)).limit(1);
        if (!clash[0]) break;
        code = makeClassCode();
      }
      const inserted = await db.insert(schema.examClasses).values({
        teacherId: user.id,
        className: args.class_name,
        jenjang: args.jenjang,
        subjectId: args.subject_id,
        subjectName: args.subject_name,
        level: args.level,
        questionCount: args.question_count,
        durationMinutes: args.duration_minutes,
        code,
        status: "open",
        packageJson: JSON.stringify(args.questions),
      }).returning();
      const row = inserted[0];
      if (!row) throw new Error("Gagal membuat kelas. Coba lagi ya.");
      ctx.invalidateQueries();
      return { class: toClassInfo(row, []) };
    },
  }),

  listMyClasses: defineAction({
    description: "Lists exam classes created by the logged-in teacher, newest first, with participant and finished counts.",
    request: z.object({ token: z.string().min(1).max(200) }),
    response: z.object({ classes: z.array(classInfoShape) }),
    async handler(ctx, args) {
      const user = await userForToken(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.examClasses)
        .where(eq(schema.examClasses.teacherId, user.id)).orderBy(desc(schema.examClasses.id)).limit(100);
      const classes = [];
      for (const c of rows) {
        const parts = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, c.id));
        classes.push(toClassInfo(c, parts));
      }
      return { classes };
    },
  }),

  getClassDashboard: defineAction({
    description: "Returns the live dashboard for one of the teacher's exam classes: all participants with status, plus the class ranking (score desc, fastest time wins ties).",
    request: z.object({ token: z.string().min(1).max(200), class_id: z.number().int().positive() }),
    response: z.object({
      class: classInfoShape,
      participants: z.array(participantShape),
      ranking: z.array(rankingEntryShape),
    }),
    async handler(ctx, args) {
      const user = await userForToken(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.examClasses).where(eq(schema.examClasses.id, args.class_id)).limit(1);
      const cls = rows[0];
      if (!cls || cls.teacherId !== user.id) throw new Error("Kelas tidak ditemukan atau bukan kelas kamu.");
      const parts = await db.select().from(schema.classParticipants)
        .where(eq(schema.classParticipants.classId, cls.id)).orderBy(desc(schema.classParticipants.id));
      return {
        class: toClassInfo(cls, parts),
        participants: parts.map(toParticipant),
        ranking: rankFinished(parts),
      };
    },
  }),

  closeExamClass: defineAction({
    description: "Closes one of the teacher's exam classes so its class code no longer accepts new students.",
    request: z.object({ token: z.string().min(1).max(200), class_id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true), class: classInfoShape }),
    async handler(ctx, args): Promise<{ ok: true; class: z.infer<typeof classInfoShape> }> {
      const user = await userForToken(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.examClasses).where(eq(schema.examClasses.id, args.class_id)).limit(1);
      const cls = rows[0];
      if (!cls || cls.teacherId !== user.id) throw new Error("Kelas tidak ditemukan atau bukan kelas kamu.");
      await db.update(schema.examClasses).set({ status: "closed", closedAt: new Date() }).where(eq(schema.examClasses.id, cls.id));
      const updatedRows = await db.select().from(schema.examClasses).where(eq(schema.examClasses.id, cls.id)).limit(1);
      const updated = updatedRows[0] ?? { ...cls, status: "closed" as const, closedAt: new Date() };
      const parts = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, cls.id));
      ctx.invalidateQueries();
      return { ok: true as const, class: toClassInfo(updated, parts) };
    },
  }),

  joinClass: defineAction({
    description: "Joins an open exam class by class code without an account: creates or resumes the participant with this name and returns the shared question package, or reports the student already finished with their result and the class ranking.",
    request: z.object({
      student_name: z.string().trim().min(1, "Nama peserta wajib diisi").max(40),
      code: z.string().trim().min(1, "Kode Kelas wajib diisi").max(16),
      device_id: z.string().max(100).default(""),
    }),
    response: z.object({
      status: z.enum(["joined", "resumed", "already_finished"]),
      class: classInfoShape,
      participant_id: z.number(),
      student_name: z.string(),
      questions: z.array(studentQuestionShape).nullable(),
      result: z.object({
        score: z.number(), correct: z.number(), total: z.number(), duration_sec: z.number(), rank: z.number(),
      }).nullable(),
      ranking: z.array(rankingEntryShape),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const code = normalizeClassCode(args.code);
      const rows = await db.select().from(schema.examClasses).where(eq(schema.examClasses.code, code)).limit(1);
      const cls = rows[0];
      if (!cls) throw new Error("Kode Kelas tidak ditemukan. Periksa lagi kode dari gurumu ya — contohnya KLS-XXXXXX.");
      if (cls.status !== "open") throw new Error(`Kelas "${cls.className}" sudah ditutup oleh guru, jadi kode ini tidak bisa dipakai lagi.`);
      const key = nameKey(args.student_name);
      const parts = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, cls.id));
      const existing = parts.find((p) => p.nameKey === key);
      const ranking = rankFinished(parts);
      if (existing && existing.status === "finished") {
        const mine = ranking.find((r) => r.participant_id === existing.id);
        return {
          status: "already_finished" as const,
          class: toClassInfo(cls, parts),
          participant_id: existing.id,
          student_name: existing.studentName,
          questions: null,
          result: {
            score: existing.score ?? 0,
            correct: existing.correct ?? 0,
            total: existing.total ?? cls.questionCount,
            duration_sec: existing.durationSec ?? 0,
            rank: mine?.rank ?? ranking.length,
          },
          ranking,
        };
      }
      const questions = parsePackage(cls.packageJson);
      if (questions.length === 0) throw new Error("Paket soal kelas ini tidak bisa dimuat. Minta guru membuat kelas baru ya.");
      // Yang dikirim ke perangkat siswa HANYA teks soal + pilihan jawaban;
      // kunci (answer) dan pembahasan (explain) tetap di server.
      const studentQuestions = questions.map(toStudentQuestion);
      if (existing) {
        return {
          status: "resumed" as const,
          class: toClassInfo(cls, parts),
          participant_id: existing.id,
          student_name: existing.studentName,
          questions: studentQuestions,
          result: null,
          ranking,
        };
      }
      const inserted = await db.insert(schema.classParticipants).values({
        classId: cls.id,
        studentName: args.student_name.trim(),
        nameKey: key,
        deviceId: args.device_id,
        status: "in_progress",
      }).returning({ id: schema.classParticipants.id });
      const row = inserted[0];
      if (!row) throw new Error("Gagal bergabung ke kelas. Coba lagi ya.");
      const partsAfter = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, cls.id));
      ctx.invalidateQueries();
      return {
        status: "joined" as const,
        class: toClassInfo(cls, partsAfter),
        participant_id: row.id,
        student_name: args.student_name.trim(),
        questions: studentQuestions,
        result: null,
        ranking: rankFinished(partsAfter),
      };
    },
  }),

  submitClassResult: defineAction({
    description: "Submits a student's exam-class answers: the server scores them against the stored class package, saves a linked attempt (also visible on the jenjang leaderboard), marks the participant finished, and returns the score plus current class ranking.",
    request: z.object({
      class_id: z.number().int().positive(),
      participant_id: z.number().int().positive(),
      student_name: z.string().trim().min(1).max(40),
      // Jawaban dikirim sebagai teks soal + teks pilihan yang dipilih siswa.
      // Urutan soal & pilihan diacak per siswa, jadi server mencocokkan
      // berdasarkan teks soal dan membandingkan teks pilihan dengan kunci
      // pada paket asli — skor tetap benar walau urutannya berbeda-beda.
      submissions: z.array(z.object({
        q: z.string().min(1).max(2000),
        chosen: z.string().max(500).nullable(),
      })).max(30),
      duration_sec: z.number().int().min(0).max(86400),
      device_id: z.string().max(100).default(""),
    }),
    response: z.object({
      score: z.number(),
      correct: z.number(),
      total: z.number(),
      duration_sec: z.number(),
      rank: z.number(),
      finished_count: z.number(),
      participant_count: z.number(),
      monitor_code: z.string(),
      attempt_id: z.number(),
      ranking: z.array(rankingEntryShape),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const classRows = await db.select().from(schema.examClasses).where(eq(schema.examClasses.id, args.class_id)).limit(1);
      const cls = classRows[0];
      if (!cls) throw new Error("Kelas tidak ditemukan.");
      const partRows = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.id, args.participant_id)).limit(1);
      const part = partRows[0];
      if (!part || part.classId !== cls.id || part.nameKey !== nameKey(args.student_name)) {
        throw new Error("Data peserta kelas tidak cocok. Bergabunglah lagi dengan nama dan Kode Kelas yang sama ya.");
      }
      if (part.status === "finished" && part.attemptId) {
        const parts = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, cls.id));
        const ranking = rankFinished(parts);
        const mine = ranking.find((r) => r.participant_id === part.id);
        return {
          score: part.score ?? 0,
          correct: part.correct ?? 0,
          total: part.total ?? cls.questionCount,
          duration_sec: part.durationSec ?? 0,
          rank: mine?.rank ?? ranking.length,
          finished_count: ranking.length,
          participant_count: parts.length,
          monitor_code: await ensureStudentCode(ctx, part.studentName),
          attempt_id: part.attemptId,
          ranking,
        };
      }
      const questions = parsePackage(cls.packageJson);
      if (questions.length === 0) throw new Error("Paket soal kelas ini tidak bisa dimuat.");
      let correct = 0;
      for (const sub of args.submissions) {
        const orig = questions.find((q) => q.q === sub.q);
        if (orig && sub.chosen !== null && sub.chosen === (orig.options[orig.answer] ?? "")) correct += 1;
      }
      const total = questions.length;
      const score = Math.round((correct / total) * 100);
      const inserted = await db.insert(schema.attempts).values({
        studentName: part.studentName,
        jenjang: cls.jenjang,
        mapel: cls.subjectName,
        mode: "ujian",
        score,
        correct,
        total,
        durationSec: args.duration_sec,
        deviceId: args.device_id || part.deviceId,
        classId: cls.id,
        className: cls.className,
      }).returning({ id: schema.attempts.id });
      const attempt = inserted[0];
      if (!attempt) throw new Error("Gagal menyimpan hasil ujian kelas.");
      await db.update(schema.classParticipants).set({
        status: "finished",
        score,
        correct,
        total,
        durationSec: args.duration_sec,
        attemptId: attempt.id,
        finishedAt: new Date(),
      }).where(eq(schema.classParticipants.id, part.id));
      const monitorCode = await ensureStudentCode(ctx, part.studentName);
      const parts = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, cls.id));
      const ranking = rankFinished(parts);
      const mine = ranking.find((r) => r.participant_id === part.id);
      ctx.invalidateQueries();
      return {
        score,
        correct,
        total,
        duration_sec: args.duration_sec,
        rank: mine?.rank ?? ranking.length,
        finished_count: ranking.length,
        participant_count: parts.length,
        monitor_code: monitorCode,
        attempt_id: attempt.id,
        ranking,
      };
    },
  }),

  getClassRankingByCode: defineAction({
    description: "Returns an exam class's public standing by its class code: class info, finished ranking (score desc, fastest wins ties), and how many students are still working.",
    request: z.object({ code: z.string().trim().min(1).max(16) }),
    response: z.object({
      class: classInfoShape,
      ranking: z.array(rankingEntryShape),
      in_progress: z.array(z.string()),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const code = normalizeClassCode(args.code);
      const rows = await db.select().from(schema.examClasses).where(eq(schema.examClasses.code, code)).limit(1);
      const cls = rows[0];
      if (!cls) throw new Error("Kode Kelas tidak ditemukan.");
      const parts = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, cls.id));
      return {
        class: toClassInfo(cls, parts),
        ranking: rankFinished(parts),
        in_progress: parts.filter((p) => p.status === "in_progress").map((p) => p.studentName),
      };
    },
  }),

  /* ---------------- SUPERADMIN ----------------
     Satu akun pemilik (role "admin") untuk memantau jumlah & mengelola
     seluruh data aplikasi: akun, kelas, dan nilai dari semua peserta. */
  adminExists: defineAction({
    description: "Reports whether the single Superadmin account has already been created (used to show or hide the Superadmin option on the registration form).",
    request: z.object({}),
    response: z.object({ exists: z.boolean() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ id: schema.users.id }).from(schema.users)
        .where(eq(schema.users.role, "admin")).limit(1);
      return { exists: rows.length > 0 };
    },
  }),

  adminDashboard: defineAction({
    description: "Returns global monitoring data for the Superadmin only: account totals per role, unique participants, total score sessions, exam-class totals, current online count, all accounts, all classes, and the 50 most recent score activities.",
    request: z.object({ token: z.string().min(1).max(200) }),
    response: z.object({
      totals: z.object({
        total_users: z.number(),
        guru: z.number(),
        orangtua: z.number(),
        admin: z.number(),
        unique_students: z.number(),
        total_attempts: z.number(),
        total_classes: z.number(),
        open_classes: z.number(),
        closed_classes: z.number(),
        class_participants: z.number(),
        online: z.number(),
      }),
      users: z.array(z.object({
        id: z.number(),
        name: z.string(),
        username: z.string(),
        role: z.string(),
        organization: z.string(),
        whatsapp: z.string(),
        email: z.string(),
        created_at: z.string(),
      })),
      classes: z.array(z.object({
        id: z.number(),
        class_name: z.string(),
        teacher_name: z.string(),
        jenjang: z.string(),
        subject_name: z.string(),
        level: z.number(),
        status: z.string(),
        participant_count: z.number(),
        finished_count: z.number(),
        created_at: z.string(),
      })),
      recent_attempts: z.array(z.object({
        id: z.number(),
        student_name: z.string(),
        jenjang: z.string(),
        mapel: z.string(),
        mode: z.string(),
        score: z.number(),
        correct: z.number(),
        total: z.number(),
        duration_sec: z.number(),
        created_at: z.string(),
      })),
    }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.token);
      const db = ctx.db<typeof schema>();

      const userRows = await db.select().from(schema.users).orderBy(desc(schema.users.id)).limit(1000);
      const attemptRows = await db.select().from(schema.attempts).orderBy(desc(schema.attempts.id)).limit(5000);
      const uniqueStudents = new Set(attemptRows.map((a) => nameKey(a.studentName))).size;

      const classRows = await db.select().from(schema.examClasses).orderBy(desc(schema.examClasses.id)).limit(500);
      const teacherNameById = new Map(userRows.map((u) => [u.id, u.name]));
      const classes = [];
      let classParticipants = 0;
      for (const c of classRows) {
        const parts = await db.select().from(schema.classParticipants).where(eq(schema.classParticipants.classId, c.id));
        classParticipants += parts.length;
        classes.push({
          id: c.id,
          class_name: c.className,
          teacher_name: teacherNameById.get(c.teacherId) ?? "(akun guru sudah dihapus)",
          jenjang: c.jenjang,
          subject_name: c.subjectName,
          level: c.level,
          status: c.status,
          participant_count: parts.length,
          finished_count: parts.filter((p) => p.status === "finished").length,
          created_at: c.createdAt.toISOString(),
        });
      }

      return {
        totals: {
          total_users: userRows.length,
          guru: userRows.filter((u) => u.role === "guru").length,
          orangtua: userRows.filter((u) => u.role === "orangtua").length,
          admin: userRows.filter((u) => u.role === "admin").length,
          unique_students: uniqueStudents,
          total_attempts: attemptRows.length,
          total_classes: classRows.length,
          open_classes: classRows.filter((c) => c.status === "open").length,
          closed_classes: classRows.filter((c) => c.status === "closed").length,
          class_participants: classParticipants,
          online: await countOnline(ctx),
        },
        users: userRows.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          organization: u.organization,
          whatsapp: u.whatsapp ?? "",
          email: u.email ?? "",
          created_at: u.createdAt.toISOString(),
        })),
        classes,
        recent_attempts: attemptRows.slice(0, 50).map((r) => ({
          id: r.id,
          student_name: r.studentName,
          jenjang: r.jenjang,
          mapel: r.mapel,
          mode: r.mode,
          score: r.score,
          correct: r.correct,
          total: r.total,
          duration_sec: r.durationSec,
          created_at: r.createdAt.toISOString(),
        })),
      };
    },
  }),

  adminDeleteUser: defineAction({
    description: "Superadmin only: deletes one teacher/parent account together with its sessions and watch list. The Superadmin cannot delete their own account or another admin account.",
    request: z.object({ token: z.string().min(1).max(200), user_id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const admin = await requireAdmin(ctx, args.token);
      if (args.user_id === admin.id) throw new Error("Kamu tidak bisa menghapus akun Superadmin milikmu sendiri.");
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.users).where(eq(schema.users.id, args.user_id)).limit(1);
      const target = rows[0];
      if (!target) throw new Error("Akun itu sudah tidak ada.");
      if (target.role === "admin") throw new Error("Akun Superadmin lain tidak bisa dihapus.");
      await db.delete(schema.watchedStudents).where(eq(schema.watchedStudents.userId, target.id));
      await db.delete(schema.sessions).where(eq(schema.sessions.userId, target.id));
      await db.delete(schema.users).where(eq(schema.users.id, target.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  adminDeleteClass: defineAction({
    description: "Superadmin only: deletes one exam class together with all of its participants.",
    request: z.object({ token: z.string().min(1).max(200), class_id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ id: schema.examClasses.id }).from(schema.examClasses)
        .where(eq(schema.examClasses.id, args.class_id)).limit(1);
      if (!rows[0]) throw new Error("Kelas itu sudah tidak ada.");
      await db.delete(schema.classParticipants).where(eq(schema.classParticipants.classId, args.class_id));
      await db.delete(schema.examClasses).where(eq(schema.examClasses.id, args.class_id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  adminDeleteAttempt: defineAction({
    description: "Superadmin only: deletes one score/attempt row from any participant.",
    request: z.object({ token: z.string().min(1).max(200), attempt_id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.token);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.attempts).where(eq(schema.attempts.id, args.attempt_id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),
} satisfies ActionsModule;

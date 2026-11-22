import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { and, desc, eq } from "drizzle-orm";
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
});

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

  register: defineAction({
    description: "Creates a teacher (guru) or parent (orang tua) account for monitoring student scores.",
    request: z.object({
      name: z.string().trim().min(1, "Nama wajib diisi").max(60),
      username: z.string().trim().toLowerCase().min(3, "Username minimal 3 karakter").max(30).regex(/^[a-z0-9_.]+$/, "Username hanya boleh huruf kecil, angka, titik, dan garis bawah"),
      password: z.string().min(6, "Kata sandi minimal 6 karakter").max(72),
      role: z.enum(["guru", "orangtua"]),
      organization: z.string().trim().max(80).default(""),
    }),
    response: z.object({ token: z.string(), user: userShape }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.users).where(eq(schema.users.username, args.username)).limit(1);
      if (existing[0]) throw new Error("Username itu sudah dipakai. Coba username lain atau masuk dengan akun yang ada.");
      const inserted = await db.insert(schema.users).values({
        name: args.name, username: args.username,
        passwordHash: await makePasswordRecord(args.password),
        role: args.role, organization: args.organization,
      }).returning();
      const user = inserted[0];
      if (!user) throw new Error("Gagal membuat akun. Coba lagi ya.");
      const token = await createSession(ctx, user.id);
      ctx.invalidateQueries();
      return { token, user: toUser(user) };
    },
  }),

  login: defineAction({
    description: "Logs in a teacher or parent account and returns a session token.",
    request: z.object({
      username: z.string().trim().toLowerCase().min(1).max(30),
      password: z.string().min(1).max(72),
    }),
    response: z.object({ token: z.string(), user: userShape }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.users).where(eq(schema.users.username, args.username)).limit(1);
      const user = rows[0];
      if (!user || !(await checkPassword(args.password, user.passwordHash))) {
        throw new Error("Username atau kata sandi salah. Periksa lagi ya.");
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
} satisfies ActionsModule;

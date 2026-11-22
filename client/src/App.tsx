import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import {
JENJANG, SCHOOL_TYPES, SUBJECTS, getPackage, medalFor, motivationFor, subjectsFor,
type JenjangId, type Question, type SchoolType,
} from "./data/questions";
import heroImg from "./assets/media-generation-hero-kids-olympiad-0-8efd557a-635d-47a5-88c3-3e408d6372e3.webp";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";

const FIELDS = actionFields<typeof Actions>();

type View = "home" | "quiz" | "result" | "history" | "login" | "dashboard";
type Mode = "ujian" | "latihan";
type Role = "guru" | "orangtua";
type SessionUser = { id: number; name: string; username: string; role: string; organization: string };

const TOKEN_KEY = "ziqva-olim-token";
const DEVICE_KEY = "ziqva-olim-device";
function getDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch { return ""; }
}

const LETTERS = ["A", "B", "C", "D", "E"];

function fmtTime(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function fmtDur(sec: number) {
  if (sec < 60) return `${sec} dtk`;
  return `${Math.floor(sec / 60)} mnt ${sec % 60} dtk`;
}

function speak(text: string, english: boolean) {
  try {
    window.speechSynthesis?.cancel();
    const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = english ? "en-US" : "id-ID";
    u.rate = 0.92;
    window.speechSynthesis?.speak(u);
  } catch { /* suara tidak tersedia */ }
}

/* ---------------- QUIZ ---------------- */
function QuizView(props: {
  jenjang: JenjangId; subjectName: string; subjectId: string; mode: Mode;
  questions: Question[]; onFinish: (answers: (number | null)[], usedSec: number) => void; onQuit: () => void;
}) {
  const { questions, mode } = props;
  const totalTime = questions.length * 60;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(() => questions.map(() => false));
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const startRef = useRef(Date.now());
  const finishedRef = useRef(false);

  const english = props.subjectId.includes("inggris") || props.subjectId.startsWith("cambridge-eng");
  const current = questions[idx];
  const answeredCount = answers.filter((a) => a !== null).length;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const used = Math.min(totalTime, Math.round((Date.now() - startRef.current) / 1000));
    props.onFinish(answers, used);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setTimeout(finish, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!current) return null;
  const isRevealed = mode === "latihan" && revealed[idx];
  const lowTime = timeLeft <= 60;

  const choose = (opt: number) => {
    if (isRevealed) return;
    setAnswers((prev) => prev.map((a, i) => (i === idx ? opt : a)));
    if (mode === "latihan") setRevealed((prev) => prev.map((r, i) => (i === idx ? true : r)));
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28">
      {/* HUD ala video: progress + timer */}
      <div className="sticky top-[64px] z-20 -mx-4 px-4 py-2" style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-center">
            <div className="font-display text-lg leading-none font-bold" style={{ color: "var(--accent)" }}>{answeredCount}<span className="text-sm" style={{ color: "var(--dim)" }}>/{questions.length}</span></div>
            <div className="text-[11px]" style={{ color: "var(--dim)" }}>terjawab</div>
          </div>
          <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface2)" }} role="progressbar" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={questions.length} aria-label="Kemajuan soal">
            <div className="h-full rounded-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%`, background: "var(--gold)" }} />
          </div>
          <div className="text-center">
            <div className={`font-display text-lg leading-none font-bold ${lowTime ? "text-red-500" : ""}`} style={lowTime ? undefined : { color: "var(--accent)" }}>⏱ {fmtTime(timeLeft)}</div>
            <div className="text-[11px]" style={{ color: "var(--dim)" }}>{mode === "ujian" ? "Mode Ujian" : "Mode Latihan"}</div>
          </div>
          <button type="button" onClick={props.onQuit} aria-label="Keluar dari kuis" className="rounded-full px-3 py-2 text-sm font-bold" style={{ background: "var(--surface2)", color: "var(--dim)" }}>✕</button>
        </div>
      </div>

      <p className="mt-2 text-sm font-bold" style={{ color: "var(--dim)" }}>{props.jenjang} • {props.subjectName} • Soal {idx + 1} dari {questions.length}</p>

      <div className="pop-in mt-2 rounded-3xl p-5 shadow-sm" key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {current.emoji && <div className="floaty mb-2 text-5xl" aria-hidden>{current.emoji}</div>}
        {current.stimulus && <p className="mb-3 rounded-xl px-3 py-2 text-[15px] leading-relaxed" style={{ background: "var(--surface2)" }}>{current.stimulus}</p>}
        <h2 className="text-lg leading-snug font-bold whitespace-pre-line">{current.q}</h2>

        <button type="button" onClick={() => speak(`${current.q}. Pilihan: ${current.options.join(". ")}`, english)} aria-label="Dengarkan soal dibacakan"
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: "#E84393" }}>
          ▶ 🔊 Dengarkan Soal
        </button>

        <div className="mt-4 grid gap-2.5">
          {current.options.map((opt, oi) => {
            const selected = answers[idx] === oi;
            const isAnswer = oi === current.answer;
            let bg = "var(--surface)", border = "var(--border)", color = "var(--text)";
            if (isRevealed) {
              if (isAnswer) { bg = "#E2F4E9"; border = "#1E7A46"; }
              else if (selected) { bg = "#FAE7E9"; border = "#D6336C"; }
            } else if (selected) { bg = "#FDE7F3"; border = "#E84393"; }
            return (
              <button key={oi} type="button" onClick={() => choose(oi)} aria-label={`Pilihan ${LETTERS[oi]}: ${opt}`} aria-pressed={selected}
                className="flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold transition"
                style={{ background: bg, border: `2px solid ${border}`, color }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
                  style={{ background: selected || (isRevealed && isAnswer) ? "#E84393" : "var(--surface2)", color: selected || (isRevealed && isAnswer) ? "#fff" : "var(--dim)" }}>
                  {isRevealed && isAnswer ? "✓" : isRevealed && selected ? "✕" : LETTERS[oi]}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {isRevealed && (
          <div className="pop-in mt-4 rounded-2xl px-4 py-3 text-sm leading-relaxed" style={{ background: "#E2F4E9", border: "1px solid #1E7A46" }}>
            <strong>Pembahasan:</strong> {current.explain}
          </div>
        )}
      </div>

      {/* Palette */}
      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Nomor soal">
        {questions.map((_, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)} aria-label={`Ke soal ${i + 1}`}
            className="h-10 w-10 rounded-xl font-display text-sm font-bold"
            style={{
              background: i === idx ? "var(--accent)" : answers[i] !== null ? "var(--gold)" : "var(--surface)",
              color: i === idx || answers[i] !== null ? "#fff" : "var(--dim)",
              border: "1px solid var(--border)",
            }}>{i + 1}</button>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2" style={{ background: "var(--bg)" }}>
        <div className="mx-auto flex max-w-3xl gap-2">
          <button type="button" disabled={idx === 0} onClick={() => setIdx(idx - 1)} aria-label="Soal sebelumnya"
            className="min-h-[52px] flex-1 rounded-2xl font-display text-base font-bold disabled:opacity-40" style={{ background: "var(--surface)", border: "2px solid var(--border)" }}>← Sebelumnya</button>
          {idx < questions.length - 1 ? (
            <button type="button" onClick={() => setIdx(idx + 1)} aria-label="Soal berikutnya"
              className="min-h-[52px] flex-[2] rounded-2xl font-display text-base font-bold text-white" style={{ background: "var(--accent)" }}>Berikutnya →</button>
          ) : (
            <button type="button" onClick={() => setConfirmSubmit(true)} aria-label="Kumpulkan jawaban"
              className="min-h-[52px] flex-[2] rounded-2xl font-display text-base font-bold text-white" style={{ background: "#1E7A46" }}>🏁 Kumpulkan</button>
          )}
        </div>
        {idx === questions.length - 1 && mode === "ujian" && (
          <button type="button" onClick={() => setConfirmSubmit(true)} className="sr-only">Kumpulkan</button>
        )}
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Konfirmasi kumpulkan">
          <div className="pop-in w-full max-w-sm rounded-3xl p-6" style={{ background: "var(--surface)" }}>
            <h3 className="font-display text-xl font-bold">Kumpulkan sekarang?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>
              Kamu sudah menjawab {answeredCount} dari {questions.length} soal.
              {answeredCount < questions.length && " Soal yang kosong dihitung salah, sama seperti olimpiade sungguhan."}
            </p>
            <div className="mt-5 grid gap-2">
              <button type="button" onClick={finish} className="min-h-[52px] rounded-2xl font-display text-base font-bold text-white" style={{ background: "#1E7A46" }}>Ya, Kumpulkan 🏁</button>
              <button type="button" onClick={() => setConfirmSubmit(false)} className="min-h-[52px] rounded-2xl font-display text-base font-bold" style={{ background: "var(--surface2)" }}>Periksa Lagi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- LOGIN GURU / ORANG TUA ---------------- */
function AuthView(props: { onSuccess: (token: string, user: SessionUser) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("orangtua");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState("");

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (r) => props.onSuccess(r.token, r.user),
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal masuk. Coba lagi ya."),
  });
  const register = useMutation({
    mutationFn: api.register,
    onSuccess: (r) => props.onSuccess(r.token, r.user),
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal membuat akun. Coba lagi ya."),
  });
  const busy = login.isPending || register.isPending;

  const submit = () => {
    setError("");
    if (tab === "login") {
      if (!username.trim() || !password) { setError("Isi username dan kata sandi dulu ya."); return; }
      login.mutate({ username: username.trim(), password });
    } else {
      if (!name.trim()) { setError("Isi nama lengkap dulu ya."); return; }
      if (username.trim().length < 3) { setError("Username minimal 3 karakter (huruf kecil, angka, titik, garis bawah)."); return; }
      if (password.length < 6) { setError("Kata sandi minimal 6 karakter."); return; }
      register.mutate({ name: name.trim(), username: username.trim(), password, role, organization: organization.trim() });
    }
  };

  const inputCls = "mt-1.5 min-h-[52px] w-full rounded-2xl px-4 text-base font-semibold outline-none";
  const inputStyle = { background: "var(--surface2)", border: "2px solid var(--border)" } as const;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10">
      <section className="mt-5 rounded-3xl p-6 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="text-center text-5xl" aria-hidden>👨‍🏫 👨‍👩‍👧</div>
        <h1 className="font-display mt-2 text-center text-2xl font-extrabold">Login Guru &amp; Orang Tua</h1>
        <p className="mt-1 text-center text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
          Pantau skor, perkembangan, dan riwayat latihan anak / murid dari satu tempat.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Masuk atau daftar">
          <button type="button" role="tab" aria-selected={tab === "login"} onClick={() => { setTab("login"); setError(""); }}
            className="min-h-[48px] rounded-2xl font-display font-bold"
            style={{ background: tab === "login" ? "var(--accent)" : "var(--surface2)", color: tab === "login" ? "#fff" : "var(--text)" }}>Masuk</button>
          <button type="button" role="tab" aria-selected={tab === "register"} onClick={() => { setTab("register"); setError(""); }}
            className="min-h-[48px] rounded-2xl font-display font-bold"
            style={{ background: tab === "register" ? "var(--accent)" : "var(--surface2)", color: tab === "register" ? "#fff" : "var(--text)" }}>Daftar Baru</button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {tab === "register" && (
            <>
              <div>
                <span className="font-display text-sm font-bold" id="role-label">Saya adalah</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="role-label">
                  <button type="button" role="radio" aria-checked={role === "orangtua"} onClick={() => setRole("orangtua")}
                    className="rounded-2xl p-3.5 text-left" style={{ background: role === "orangtua" ? "#FDE7F3" : "var(--surface2)", border: `2px solid ${role === "orangtua" ? "#E84393" : "var(--border)"}` }}>
                    <div className="font-display font-bold">👨‍👩‍👧 Orang Tua</div>
                    <div className="text-xs" style={{ color: "var(--dim)" }}>Pantau skor anak sendiri</div>
                  </button>
                  <button type="button" role="radio" aria-checked={role === "guru"} onClick={() => setRole("guru")}
                    className="rounded-2xl p-3.5 text-left" style={{ background: role === "guru" ? "#E7EBFF" : "var(--surface2)", border: `2px solid ${role === "guru" ? "var(--accent)" : "var(--border)"}` }}>
                    <div className="font-display font-bold">👨‍🏫 Guru</div>
                    <div className="text-xs" style={{ color: "var(--dim)" }}>Pantau murid di kelasnya &amp; papan peringkat kelas</div>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="reg-name" className="font-display text-sm font-bold">Nama Lengkap</label>
                <input id="reg-name" {...FIELDS.register.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Ibu Sari / Pak Budi" className={inputCls} style={inputStyle} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="reg-org" className="font-display text-sm font-bold">{role === "guru" ? "Sekolah / Kelas (opsional)" : "Sekolah Anak (opsional)"}</label>
                <input id="reg-org" {...FIELDS.register.organization} value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder={role === "guru" ? "Contoh: SDN 1 Malang — Kelas 4" : "Contoh: TK Islam Sabilillah"} className={inputCls} style={inputStyle} autoComplete="organization" />
              </div>
            </>
          )}
          <div>
            <label htmlFor="auth-username" className="font-display text-sm font-bold">Username</label>
            {tab === "login"
              ? <input id="auth-username" {...FIELDS.login.username} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username kamu" className={inputCls} style={inputStyle} autoComplete="username" />
              : <input id="auth-username" {...FIELDS.register.username} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="huruf kecil, contoh: ibu_sari" className={inputCls} style={inputStyle} autoComplete="username" />}
          </div>
          <div>
            <label htmlFor="auth-password" className="font-display text-sm font-bold">Kata Sandi</label>
            {tab === "login"
              ? <input id="auth-password" {...FIELDS.login.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} style={inputStyle} autoComplete="current-password" />
              : <input id="auth-password" {...FIELDS.register.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" className={inputCls} style={inputStyle} autoComplete="new-password" />}
          </div>
          {error && <p className="rounded-xl px-3 py-2 text-sm font-bold text-red-600" style={{ background: "#FAE7E9" }} role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="font-display min-h-[56px] rounded-2xl text-lg font-extrabold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
            {busy ? "Memproses…" : tab === "login" ? "🔑 Masuk & Pantau Skor" : "✅ Buat Akun & Masuk"}
          </button>
        </form>
        <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: "var(--dim)" }}>
          Akun tersimpan aman di ZIQVA OLIM. Anak tetap latihan tanpa akun — cukup isi nama peserta seperti biasa. Setelah selesai, layar hasil menampilkan <strong>Kode Pantau</strong>; Bapak/Ibu memasukkan nama + kode itu di dashboard untuk mulai memantau, jadi skor anak tidak bisa dilihat orang lain.
        </p>
      </section>
    </main>
  );
}

/* ---------------- DASHBOARD PANTAU ---------------- */
function MonitorView(props: { token: string; user: SessionUser; onLogout: () => void; onPractice: () => void }) {
  const queryClient = useQueryClient();
  const { token, user } = props;
  const isGuru = user.role === "guru";
  const dash = useQuery({ queryKey: ["monitor", token], queryFn: () => api.monitorDashboard({ token }) });
  const [childName, setChildName] = useState("");
  const [childCode, setChildCode] = useState("");
  const [childError, setChildError] = useState("");
  const [search, setSearch] = useState("");

  const addWatched = useMutation({
    mutationFn: api.addWatchedStudent,
    onSuccess: () => { setChildName(""); setChildCode(""); setChildError(""); queryClient.invalidateQueries({ queryKey: ["monitor"] }); },
    onError: (e) => setChildError(e instanceof Error ? e.message : "Gagal menambahkan. Coba lagi ya."),
  });
  const removeWatched = useMutation({
    mutationFn: api.removeWatchedStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitor"] }),
  });

  const data = dash.data;
  const students = (data?.students ?? []).filter((s) => !search.trim() || s.student_name.toLowerCase().includes(search.trim().toLowerCase()));
  const attempts = (data?.attempts ?? []).filter((a) => !search.trim() || a.student_name.toLowerCase().includes(search.trim().toLowerCase()));
  const totalAttempts = data?.attempts.length ?? 0;
  const avgAll = data && data.attempts.length ? Math.round(data.attempts.reduce((s, a) => s + a.score, 0) / data.attempts.length) : 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10">
      <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ background: "var(--surface2)" }} aria-hidden>{isGuru ? "👨‍🏫" : "👨‍👩‍👧"}</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-xl font-extrabold">Halo, {user.name}!</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--dim)" }}>
              {isGuru ? "🧑‍🏫 Guru" : "👨‍👩‍👧 Orang Tua"} • @{user.username}{user.organization ? ` • ${user.organization}` : ""}
            </p>
          </div>
          <button type="button" onClick={() => dash.refetch()} aria-label="Segarkan data pantauan" className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold" style={{ background: "var(--surface2)" }}>🔄 Segarkan</button>
          <button type="button" onClick={props.onLogout} aria-label="Keluar dari akun" className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold text-white" style={{ background: "#D6336C" }}>Keluar</button>
        </div>
      </section>

      {dash.isPending && <p className="mt-4" style={{ color: "var(--dim)" }}>Memuat data pantauan…</p>}
      {dash.isError && (
        <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="font-display text-lg font-bold">Sesi login sudah berakhir</p>
          <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Silakan masuk lagi untuk melanjutkan memantau.</p>
          <button type="button" onClick={props.onLogout} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>Masuk Lagi</button>
        </div>
      )}

      {data && (
        <>
          {(
            <section className="mt-4 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h2 className="font-display text-lg font-bold">{isGuru ? "🧑‍🎓 Murid di Kelas Saya" : "👧 Anak yang Dipantau"}</h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--dim)" }}>
                Masukkan nama peserta <strong>persis</strong> seperti saat latihan <strong>dan Kode Pantau</strong>-nya — kode itu tampil di layar hasil &amp; Prestasiku peserta setelah selesai latihan. Hanya peserta yang Bapak/Ibu tambahkan dengan kode yang benar yang bisa dipantau.
              </p>
              <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => {
                e.preventDefault();
                if (!childName.trim()) { setChildError(isGuru ? "Isi nama murid dulu ya." : "Isi nama anak dulu ya."); return; }
                if (!childCode.trim()) { setChildError("Isi Kode Pantau dulu ya — kodenya ada di layar hasil / Prestasiku peserta."); return; }
                setChildError("");
                addWatched.mutate({ token, student_name: childName.trim(), code: childCode.trim() });
              }}>
                <label htmlFor="child-name" className="sr-only">{isGuru ? "Nama murid yang dipantau" : "Nama anak yang dipantau"}</label>
                <input id="child-name" {...FIELDS.addWatchedStudent.student_name} value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Nama peserta, contoh: Aisyah" className="min-h-[52px] flex-1 rounded-2xl px-4 text-base font-semibold outline-none" style={{ background: "var(--surface2)", border: "2px solid var(--border)" }} />
                <label htmlFor="child-code" className="sr-only">Kode pantau peserta</label>
                <input id="child-code" {...FIELDS.addWatchedStudent.code} value={childCode} onChange={(e) => setChildCode(e.target.value.toUpperCase())} placeholder="KODE PANTAU" className="font-display min-h-[52px] rounded-2xl px-4 text-base font-bold tracking-widest uppercase outline-none sm:w-44" style={{ background: "var(--surface2)", border: "2px solid var(--border)" }} />
                <button type="submit" disabled={addWatched.isPending} className="font-display min-h-[52px] rounded-2xl px-6 font-bold text-white disabled:opacity-50" style={{ background: "#1E7A46" }}>＋ Tambah</button>
              </form>
              {childError && <p className="mt-2 text-sm font-bold text-red-500" role="alert">{childError}</p>}
              {data.watched.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.watched.map((w) => (
                    <span key={w.id} className="inline-flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4 font-display text-sm font-bold" style={{ background: "var(--surface2)" }}>
                      👧 {w.student_name}
                      <button type="button" onClick={() => removeWatched.mutate({ token, id: w.id })} aria-label={`Berhenti memantau ${w.student_name}`} className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "#D6336C" }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: isGuru ? "Murid Dipantau" : "Anak Dipantau", value: `${data.watched.length}`, icon: "🧒" },
              { label: "Total Latihan", value: `${totalAttempts}×`, icon: "🎯" },
              { label: "Rata-rata Skor", value: `${avgAll}`, icon: "📊" },
              { label: "Skor Terbaik", value: `${data.attempts.length ? Math.max(...data.attempts.map((a) => a.score)) : 0}`, icon: "🏆" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="text-2xl" aria-hidden>{c.icon}</div>
                <div className="font-display text-2xl font-extrabold">{c.value}</div>
                <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>{c.label}</div>
              </div>
            ))}
          </div>

          {isGuru && (
            <div className="mt-4">
              <label htmlFor="monitor-search" className="sr-only">Cari nama murid</label>
              <input id="monitor-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Cari nama murid…" maxLength={40} className="min-h-[52px] w-full rounded-2xl px-4 text-base font-semibold outline-none" style={{ background: "var(--surface)", border: "2px solid var(--border)" }} />
            </div>
          )}

          {data.students.length === 0 ? (
            <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="text-5xl" aria-hidden>📭</div>
              <p className="font-display mt-2 text-lg font-bold">{data.watched.length === 0 ? (isGuru ? "Belum ada murid di daftar pantau" : "Belum ada anak yang dipantau") : "Peserta belum punya skor"}</p>
              <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: "var(--dim)" }}>
                {data.watched.length === 0
                  ? "Tambahkan nama peserta + Kode Pantau di atas — kode tampil di layar hasil peserta setelah selesai latihan. Setelah ditambahkan, peringkat dan skornya tampil di sini."
                  : "Minta peserta menyelesaikan satu paket soal dengan nama yang sama persis, lalu tekan Segarkan."}
              </p>
              <button type="button" onClick={props.onPractice} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>Mulai Latihan →</button>
            </div>
          ) : (
            <>
              <h2 className="font-display mt-6 text-lg font-bold">{isGuru ? "🏆 Papan Peringkat Kelas Saya" : "📈 Perkembangan Anak"}</h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {students.map((s, i) => (
                  <article key={s.student_name} className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white" style={{ background: i === 0 ? "#D97706" : i === 1 ? "#6E6785" : i === 2 ? "#B45309" : "var(--accent)" }}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display font-bold">{s.student_name}</div>
                        <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>{s.attempts}× latihan • {s.total_correct}/{s.total_questions} soal benar</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-xl leading-none font-extrabold" style={{ color: medalFor(s.average_score).color }}>{s.average_score}</div>
                        <div className="text-[10px] font-bold" style={{ color: "var(--dim)" }}>RATA-RATA</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-bold">
                      <span style={{ color: medalFor(s.best_score).color }}>🏅 Terbaik {s.best_score} — {medalFor(s.best_score).label}</span>
                      <span style={{ color: "var(--dim)" }}>Terakhir: {s.last_mapel} • {new Date(s.last_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{ background: "var(--surface2)" }} role="progressbar" aria-valuenow={s.average_score} aria-valuemin={0} aria-valuemax={100} aria-label={`Rata-rata skor ${s.student_name}`}>
                      <div className="h-full rounded-full" style={{ width: `${s.average_score}%`, background: "var(--gold)" }} />
                    </div>
                  </article>
                ))}
              </div>

              <h2 className="font-display mt-6 text-lg font-bold">🕐 Latihan Terbaru</h2>
              <div className="mt-2 grid gap-2">
                {attempts.slice(0, 30).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="font-display flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white" style={{ background: a.score >= 75 ? "#1E7A46" : a.score >= 60 ? "#D97706" : "#6E6785" }}>
                      <span className="text-lg leading-none font-extrabold">{a.score}</span>
                      <span className="text-[9px] font-bold">SKOR</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display font-bold">{a.student_name} — {a.mapel} • {a.jenjang}</div>
                      <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>
                        {a.correct}/{a.total} benar • {a.mode === "ujian" ? "🏆 Ujian" : "✏️ Latihan"} • {fmtDur(a.duration_sec)} • {new Date(a.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-xs font-bold" style={{ color: medalFor(a.score).color }}>🏅 {medalFor(a.score).label}</div>
                    </div>
                  </div>
                ))}
                {attempts.length === 0 && <p className="text-sm" style={{ color: "var(--dim)" }}>Tidak ada murid yang cocok dengan pencarian itu.</p>}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

/* ---------------- APP ---------------- */
export function App() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("home");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [school, setSchool] = useState<SchoolType>("umum");
  const [jenjang, setJenjang] = useState<JenjangId>("TK");
  const [subjectId, setSubjectId] = useState<string>("inggris");
  const [mode, setMode] = useState<Mode>("ujian");
  const [lastResult, setLastResult] = useState<{ answers: (number | null)[]; usedSec: number; correct: number; score: number } | null>(null);
  const [token, setToken] = useState<string>(() => { try { return localStorage.getItem(TOKEN_KEY) ?? ""; } catch { return ""; } });
  const me = useQuery({ queryKey: ["me", token], queryFn: () => api.me({ token }), enabled: token.length > 0 });
  const sessionUser: SessionUser | null = token && me.data ? me.data.user : null;

  const handleAuthSuccess = (t: string, _user: SessionUser) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* penyimpanan tidak tersedia */ }
    setToken(t);
    setView("dashboard");
    window.scrollTo({ top: 0 });
  };
  const logout = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* abaikan */ }
      setToken("");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setView("home");
    },
  });
  const handleLogout = () => { if (token) logout.mutate({ token }); else setView("home"); };

  const [deviceId] = useState<string>(() => getDeviceId());
  const [monitorCode, setMonitorCode] = useState("");
  const history = useQuery({ queryKey: ["attempts", deviceId], queryFn: () => api.listAttempts({ limit: 30, device_id: deviceId }) });
  const saveAttempt = useMutation({
    mutationFn: api.saveAttempt,
    onSuccess: (r) => { setMonitorCode(r.monitor_code); queryClient.invalidateQueries({ queryKey: ["attempts"] }); },
    onError: (e) => alertSaveError(e),
  });
  const deleteAttempt = useMutation({
    mutationFn: api.deleteAttempt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attempts"] }),
  });
  function alertSaveError(e: unknown) {
    // Kegagalan simpan tidak menghalangi layar hasil; tampilkan pesan singkat.
    console.warn("saveAttempt failed", e);
  }

  const subjects = useMemo(() => subjectsFor(jenjang, school), [jenjang, school]);
  const activeSubject = subjects.find((s) => s.id === subjectId) ?? subjects[0];
  const questions = activeSubject ? getPackage(jenjang, activeSubject.id) : [];

  useEffect(() => {
    if (activeSubject && activeSubject.id !== subjectId) setSubjectId(activeSubject.id);
  }, [activeSubject, subjectId]);

  const startQuiz = () => {
    if (!name.trim()) { setNameError("Isi nama peserta dulu ya, supaya hasil latihannya tercatat."); return; }
    if (questions.length === 0) return;
    setLastResult(null);
    setMonitorCode("");
    setView("quiz");
    window.scrollTo({ top: 0 });
  };

  const handleFinish = (answers: (number | null)[], usedSec: number) => {
    const correct = questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    setLastResult({ answers, usedSec, correct, score });
    setView("result");
    window.scrollTo({ top: 0 });
    if (activeSubject) {
      saveAttempt.mutate({
        student_name: name.trim(), jenjang, mapel: activeSubject.name, mode,
        score, correct, total: questions.length, duration_sec: usedSec, device_id: deviceId,
      });
    }
  };

  const stats = history.data?.stats;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="sticky top-0 z-30 pt-safe" style={{ background: "var(--accent)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl" style={{ background: "var(--gold)" }} aria-hidden>🏆</span>
            <div className="leading-none">
              <div className="font-display text-xl font-extrabold tracking-wide text-white">ZIQVA <span style={{ color: "var(--gold)" }}>OLIM</span></div>
              <div className="text-[11px] font-semibold text-white/70">Latihan Olimpiade TK – SMA</div>
            </div>
          </div>
          <nav className="ml-auto flex gap-2" aria-label="Navigasi utama">
            <button type="button" onClick={() => setView("home")} aria-label="Ke beranda"
              className="min-h-[40px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: view === "home" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "home" ? "#2B2440" : "#fff" }}>Beranda</button>
            <button type="button" onClick={() => setView("history")} aria-label="Lihat riwayat dan prestasiku"
              className="min-h-[40px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: view === "history" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "history" ? "#2B2440" : "#fff" }}>🏅 Prestasiku</button>
            <button type="button" onClick={() => setView(sessionUser ? "dashboard" : "login")} aria-label={sessionUser ? "Ke dashboard pantau guru dan orang tua" : "Masuk sebagai guru atau orang tua"}
              className="min-h-[40px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: view === "dashboard" || view === "login" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "dashboard" || view === "login" ? "#2B2440" : "#fff" }}>
              {sessionUser ? `👀 Pantau (${sessionUser.name.split(" ")[0]})` : "👨‍🏫 Guru & Ortu"}
            </button>
          </nav>
        </div>
      </header>

      {view === "login" && <AuthView onSuccess={handleAuthSuccess} />}

      {view === "dashboard" && sessionUser && (
        <MonitorView token={token} user={sessionUser} onLogout={handleLogout} onPractice={() => setView("home")} />
      )}
      {view === "dashboard" && !sessionUser && !me.isPending && (
        <main className="mx-auto w-full max-w-md px-4 pb-10">
          <div className="mt-5 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-5xl" aria-hidden>🔑</div>
            <p className="font-display mt-2 text-lg font-bold">Kamu belum masuk</p>
            <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Guru &amp; orang tua perlu masuk dulu untuk memantau skor anak / murid.</p>
            <button type="button" onClick={() => setView("login")} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>Masuk / Daftar →</button>
          </div>
        </main>
      )}

      {view === "quiz" && activeSubject && (
        <QuizView jenjang={jenjang} subjectName={activeSubject.name} subjectId={activeSubject.id} mode={mode}
          questions={questions} onFinish={handleFinish} onQuit={() => setView("home")} />
      )}

      {view === "home" && (
        <main className="mx-auto w-full max-w-5xl px-4 pb-10">
          <section className="mt-4 overflow-hidden rounded-3xl shadow-sm" style={{ border: "1px solid var(--border)" }}>
            <img src={heroImg} alt="Ilustrasi anak-anak Indonesia dari TK sampai SMA merayakan kemenangan olimpiade dengan piala dan medali" className="h-44 w-full object-cover object-top sm:h-64" />
            <div className="p-5 sm:p-6" style={{ background: "var(--surface)" }}>
              <h1 className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">Berlatih seperti di Olimpiade Nasional — dari TK sampai SMA 🏅</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--dim)" }}>
                Formatnya meniru video contoh Olimpiade PAUD/TK: soal pilihan ganda, tombol <strong>“Dengarkan Soal”</strong>, penghitung waktu,
                indikator progres, dan skor besar di akhir — kini untuk <strong>semua jenjang &amp; semua mata pelajaran</strong>:
                Matematika, Bahasa Inggris, IPA/Sains, Sejarah, Bahasa Jawa, Bahasa Arab, PAI, Akidah, Fikih, Qur'an Hadis, SKI, Agama Kristen, sampai kelas Cambridge.
              </p>
              {stats && stats.total_attempts > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                  <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>🎯 {stats.total_attempts}× latihan</span>
                  <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>📊 Rata-rata {stats.average_score}</span>
                  <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>🏆 Terbaik {stats.best_score}</span>
                  <button type="button" onClick={() => setView("history")} className="rounded-full px-3 py-1.5 text-white" style={{ background: "var(--accent)" }}>Lihat Prestasiku →</button>
                </div>
              )}
            </div>
          </section>

          {/* Login guru & orang tua */}
          <section className="mt-5 flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:flex-row sm:items-center" style={{ background: "var(--surface)", border: "2px solid var(--accent)" }}>
            <div className="text-4xl" aria-hidden>{sessionUser ? "👀" : "👨‍🏫"}</div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">{sessionUser ? `Halo, ${sessionUser.name} — skor terbaru sudah menunggu` : "Guru & Orang Tua: pantau skor anak di sini"}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                {sessionUser
                  ? "Buka dashboard pantau untuk melihat peringkat, rata-rata, dan latihan terbaru."
                  : "Buat akun gratis sebagai guru atau orang tua, lalu tambahkan nama peserta + Kode Pantau-nya (tampil di layar hasil anak) untuk melihat skor, rata-rata, dan peringkatnya."}
              </p>
            </div>
            <button type="button" onClick={() => setView(sessionUser ? "dashboard" : "login")} aria-label={sessionUser ? "Buka dashboard pantau" : "Masuk atau daftar sebagai guru atau orang tua"}
              className="font-display min-h-[52px] shrink-0 rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>
              {sessionUser ? "👀 Buka Pantauan" : "🔑 Masuk / Daftar"}
            </button>
          </section>

          {/* Nama */}
          <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <label htmlFor="student-name" className="font-display text-lg font-bold">👤 Nama Peserta</label>
            <input id="student-name" value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }}
              placeholder="Contoh: Aisyah / Budi / Caca" maxLength={40}
              className="mt-2 min-h-[52px] w-full rounded-2xl px-4 text-base font-semibold outline-none"
              style={{ background: "var(--surface2)", border: "2px solid var(--border)" }} />
            {nameError && <p className="mt-2 text-sm font-bold text-red-500" role="alert">{nameError}</p>}
          </section>

          {/* Tipe sekolah */}
          <section className="mt-5">
            <h2 className="font-display text-lg font-bold">🏫 1 · Pilih Jenis Sekolah</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {SCHOOL_TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => setSchool(t.id)} aria-pressed={school === t.id} aria-label={`Jenis sekolah ${t.name}`}
                  className="rounded-2xl p-3.5 text-left transition"
                  style={{ background: school === t.id ? "var(--accent)" : "var(--surface)", color: school === t.id ? "#fff" : "var(--text)", border: "2px solid var(--border)" }}>
                  <div className="font-display text-[15px] font-bold">{t.name}</div>
                  <div className="mt-0.5 text-xs leading-snug" style={{ color: school === t.id ? "rgba(255,255,255,.75)" : "var(--dim)" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Jenjang */}
          <section className="mt-5">
            <h2 className="font-display text-lg font-bold">🎓 2 · Pilih Jenjang</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {JENJANG.map((j) => (
                <button key={j.id} type="button" onClick={() => setJenjang(j.id)} aria-pressed={jenjang === j.id} aria-label={`Jenjang ${j.name}`}
                  className="rounded-2xl p-4 text-left transition"
                  style={{ background: jenjang === j.id ? j.color : "var(--surface)", color: jenjang === j.id ? "#fff" : "var(--text)", border: "2px solid var(--border)" }}>
                  <div className="font-display text-lg font-extrabold">{j.name}</div>
                  <div className="mt-0.5 text-xs leading-snug" style={{ color: jenjang === j.id ? "rgba(255,255,255,.8)" : "var(--dim)" }}>{j.sub}</div>
                  <div className="mt-1 text-xs font-bold" style={{ color: jenjang === j.id ? "#FFE9A8" : "var(--dim)" }}>Usia {j.ages}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Mapel */}
          <section className="mt-5">
            <h2 className="font-display text-lg font-bold">📚 3 · Pilih Mata Pelajaran Olimpiade</h2>
            <p className="text-sm" style={{ color: "var(--dim)" }}>{subjects.length} mapel tersedia untuk {JENJANG.find((j) => j.id === jenjang)?.name} • {SCHOOL_TYPES.find((t) => t.id === school)?.name}. Ketuk mapel untuk memilih paket soalnya.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {subjects.map((s) => {
                const count = getPackage(jenjang, s.id).length;
                const active = activeSubject?.id === s.id;
                return (
                  <button key={s.id} type="button" disabled={count === 0} onClick={() => setSubjectId(s.id)} aria-pressed={active} aria-label={`Mapel ${s.name}, ${count} soal`}
                    className="rounded-2xl p-3.5 text-left transition disabled:opacity-40"
                    style={{ background: active ? s.bg : "var(--surface)", border: `2px solid ${active ? s.color : "var(--border)"}` }}>
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 font-display text-xs font-extrabold text-white" style={{ background: s.color }}>{s.short}</span>
                    <div className="mt-2 font-display text-[15px] leading-tight font-bold">{s.name}</div>
                    <div className="mt-0.5 text-xs font-semibold" style={{ color: "var(--dim)" }}>{count} soal • ±{count} menit</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Mode + start */}
          <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-display text-lg font-bold">⚡ 4 · Pilih Mode &amp; Mulai</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode("ujian")} aria-pressed={mode === "ujian"} aria-label="Mode ujian seperti olimpiade asli"
                className="rounded-2xl p-4 text-left" style={{ background: mode === "ujian" ? "#1E2A78" : "var(--surface2)", color: mode === "ujian" ? "#fff" : "var(--text)", border: "2px solid var(--border)" }}>
                <div className="font-display font-bold">🏆 Mode Ujian</div>
                <div className="mt-0.5 text-xs leading-snug" style={{ color: mode === "ujian" ? "rgba(255,255,255,.75)" : "var(--dim)" }}>Seperti video: timer berjalan, jawaban terkunci, skor &amp; review di akhir.</div>
              </button>
              <button type="button" onClick={() => setMode("latihan")} aria-pressed={mode === "latihan"} aria-label="Mode latihan dengan pembahasan langsung"
                className="rounded-2xl p-4 text-left" style={{ background: mode === "latihan" ? "#1E7A46" : "var(--surface2)", color: mode === "latihan" ? "#fff" : "var(--text)", border: "2px solid var(--border)" }}>
                <div className="font-display font-bold">✏️ Mode Latihan</div>
                <div className="mt-0.5 text-xs leading-snug" style={{ color: mode === "latihan" ? "rgba(255,255,255,.8)" : "var(--dim)" }}>Setiap jawaban langsung dicek + ada pembahasan. Cocok untuk belajar.</div>
              </button>
            </div>
            <button type="button" onClick={startQuiz} disabled={questions.length === 0} aria-label={`Mulai latihan ${activeSubject?.name ?? ""} jenjang ${jenjang}`}
              className="font-display mt-4 min-h-[60px] w-full rounded-2xl text-xl font-extrabold text-white shadow disabled:opacity-40" style={{ background: "var(--gold)", color: "#2B2440" }}>
              🚀 Mulai — {activeSubject?.name} • {jenjang} ({questions.length} soal)
            </button>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--dim)" }}>⏱ Waktu: 1 menit per soal • 🔊 Gunakan tombol “Dengarkan Soal” untuk soal listening seperti di video</p>
          </section>

          {/* Analisa video */}
          <section className="mt-5 rounded-3xl p-5" style={{ background: "var(--surface2)", border: "1px dashed var(--border)" }}>
            <h2 className="font-display text-base font-bold">🎬 Pola dari Video Contoh (Olimpiade Nasional PAUD/TK)</h2>
            <ul className="mt-2 grid gap-1.5 text-sm leading-relaxed sm:grid-cols-2" style={{ color: "var(--dim)" }}>
              <li>✅ 20 soal pilihan ganda dengan batas waktu &amp; indikator progres (0/20)</li>
              <li>✅ Setiap soal punya audio listening yang bisa diputar ulang</li>
              <li>✅ Tipe soal TK: angka terkecil, menyusun huruf jadi kata, melengkapi kata, angka di antara, urutan gambar kegiatan harian</li>
              <li>✅ Di akhir muncul skor besar (contoh: 60 = 12/20 benar) + pesan penyemangat</li>
            </ul>
            <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>ZIQVA OLIM memakai pola persis itu, lalu menaikkannya bertingkat: soal makin menantang dari TK → SD → SMP → SMA sesuai kurikulum tiap jenjang &amp; jenis sekolah.</p>
          </section>
        </main>
      )}

      {view === "result" && lastResult && activeSubject && (
        <main className="mx-auto w-full max-w-3xl px-4 pb-10">
          <section className="pop-in mt-4 rounded-3xl p-6 text-center shadow-sm" style={{ background: "linear-gradient(160deg,#FFF7E0,#FFEFC4)", border: "2px solid var(--gold)", color: "#2B2440" }}>
            <p className="text-sm font-bold tracking-wide" style={{ color: "#92600A" }}>HASIL {mode === "ujian" ? "UJIAN" : "LATIHAN"} • {activeSubject.name.toUpperCase()} • {jenjang}</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "#92600A" }}>Peserta: {name}</p>
            <div className="font-display my-2 text-[84px] leading-none font-extrabold" style={{ color: "#D97706" }}>{lastResult.score}</div>
            <p className="font-display text-lg font-bold">({lastResult.correct}/{questions.length} benar) • ⏱ {fmtDur(lastResult.usedSec)}</p>
            <p className="mt-1 font-display text-xl font-extrabold" style={{ color: medalFor(lastResult.score).color }}>🏅 {medalFor(lastResult.score).label}</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-semibold">{motivationFor(lastResult.score)}</p>
            {saveAttempt.isPending && <p className="mt-2 text-xs">Menyimpan hasil ke Prestasiku…</p>}
            {monitorCode && (
              <div className="mx-auto mt-4 max-w-md rounded-2xl px-4 py-3" style={{ background: "#fff", border: "2px dashed #D97706" }}>
                <p className="text-xs font-bold tracking-wide" style={{ color: "#92600A" }}>🔑 KODE PANTAU {name.toUpperCase()}</p>
                <p className="font-display text-3xl font-extrabold tracking-[0.3em]" style={{ color: "#2B2440" }}>{monitorCode}</p>
                <p className="text-xs font-semibold" style={{ color: "#92600A" }}>Berikan kode ini ke guru / orang tua supaya mereka bisa memantau skormu dari akun mereka.</p>
              </div>
            )}
          </section>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setView("home")} className="min-h-[54px] rounded-2xl font-display text-base font-bold text-white" style={{ background: "var(--accent)" }} aria-label="Kembali ke beranda">🏠 Beranda</button>
            <button type="button" onClick={startQuiz} className="min-h-[54px] rounded-2xl font-display text-base font-bold" style={{ background: "var(--gold)", color: "#2B2440" }} aria-label="Ulangi paket soal ini">🔁 Latihan Lagi</button>
          </div>

          <h2 className="font-display mt-6 text-lg font-bold">🔍 Review &amp; Pembahasan</h2>
          <div className="mt-2 grid gap-3">
            {questions.map((q, i) => {
              const user = lastResult.answers[i];
              const right = user === q.answer;
              return (
                <article key={i} className="rounded-2xl p-4" style={{ background: "var(--surface)", border: `2px solid ${right ? "#1E7A46" : "#D6336C"}` }}>
                  <p className="font-bold whitespace-pre-line"><span style={{ color: right ? "#1E7A46" : "#D6336C" }}>{right ? "✓" : "✕"} Soal {i + 1}.</span> {q.emoji ? `${q.emoji} ` : ""}{q.q}</p>
                  <p className="mt-1.5 text-sm">Jawabanmu: <strong>{user === null || user === undefined ? "— (kosong)" : `${LETTERS[user]}. ${q.options[user]}`}</strong></p>
                  {!right && <p className="text-sm">Jawaban benar: <strong>{LETTERS[q.answer]}. {q.options[q.answer]}</strong></p>}
                  <p className="mt-1.5 rounded-xl px-3 py-2 text-sm leading-relaxed" style={{ background: "var(--surface2)" }}><strong>Pembahasan:</strong> {q.explain}</p>
                </article>
              );
            })}
          </div>
        </main>
      )}

      {view === "history" && (
        <main className="mx-auto w-full max-w-3xl px-4 pb-10">
          <h1 className="font-display mt-5 text-2xl font-extrabold">🏅 Prestasiku</h1>
          {history.isPending && <p className="mt-3" style={{ color: "var(--dim)" }}>Memuat riwayat…</p>}
          {history.data && stats && stats.total_attempts === 0 && (
            <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="text-5xl" aria-hidden>🎯</div>
              <p className="font-display mt-2 text-lg font-bold">Belum ada latihan yang selesai</p>
              <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Selesaikan satu paket soal, dan skor + medalimu akan tercatat di sini.</p>
              <button type="button" onClick={() => setView("home")} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>Mulai Latihan Pertama →</button>
            </div>
          )}
          {history.data && stats && stats.total_attempts > 0 && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Total Latihan", value: `${stats.total_attempts}×`, icon: "🎯" },
                  { label: "Rata-rata Skor", value: `${stats.average_score}`, icon: "📊" },
                  { label: "Skor Terbaik", value: `${stats.best_score}`, icon: "🏆" },
                  { label: "Soal Benar", value: `${stats.total_correct}/${stats.total_questions}`, icon: "✅" },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="text-2xl" aria-hidden>{c.icon}</div>
                    <div className="font-display text-2xl font-extrabold">{c.value}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2">
                {history.data.attempts.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="font-display flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white" style={{ background: a.score >= 75 ? "#1E7A46" : a.score >= 60 ? "#D97706" : "#6E6785" }}>
                      <span className="text-lg leading-none font-extrabold">{a.score}</span>
                      <span className="text-[9px] font-bold">SKOR</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display font-bold">{a.mapel} • {a.jenjang}</div>
                      <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>
                        {a.student_name} • {a.correct}/{a.total} benar • {a.mode === "ujian" ? "🏆 Ujian" : "✏️ Latihan"} • {fmtDur(a.duration_sec)} • {new Date(a.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-xs font-bold" style={{ color: medalFor(a.score).color }}>🏅 {medalFor(a.score).label}</div>
                      {a.monitor_code && <div className="mt-0.5 text-xs font-bold" style={{ color: "var(--dim)" }}>🔑 Kode Pantau: <span className="tracking-widest">{a.monitor_code}</span> — untuk guru / orang tua</div>}
                    </div>
                    <button type="button" onClick={() => deleteAttempt.mutate({ id: a.id, device_id: deviceId })} aria-label={`Hapus riwayat ${a.mapel} skor ${a.score}`}
                      className="min-h-[40px] shrink-0 rounded-full px-3 text-sm font-bold" style={{ background: "var(--surface2)", color: "var(--dim)" }}>Hapus</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      )}

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs" style={{ color: "var(--dim)" }}>
        ZIQVA OLIM — Latihan Olimpiade TK/PAUD, SD/MI, SMP/MTs, SMA/SMK/MA, Sekolah Kristen &amp; Cambridge. Berlatih setiap hari, raih medali emasmu! 🏆
      </footer>
    </div>
  );
}

// keep SUBJECTS referenced for tree-shaking clarity in some bundlers
void SUBJECTS;

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import {
BANK, JENJANG, LEVELS, SCHOOL_TYPES, SUBJECTS, SESSION_SIZE, UNLOCK_SCORE, buildSession, medalFor, motivationFor, subjectsFor,
type JenjangId, type Question, type SchoolType,
} from "./data/questions";

/** Total soal inti tertulis di bank soal (di luar variasi acak generator). */
const TOTAL_AUTHORED = Object.values(BANK).reduce(
  (sum, bySubject) => sum + Object.values(bySubject ?? {}).reduce((a, qs) => a + (qs?.length ?? 0), 0),
  0,
);
import { materialFor } from "./data/materials";
import { modulesFor, moduleForQuestion, type LibraryModule } from "./data/library";
import heroImg from "./assets/media-generation-hero-kids-olympiad-0-8efd557a-635d-47a5-88c3-3e408d6372e3.webp";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";

const FIELDS = actionFields<typeof Actions>();

type View = "home" | "quiz" | "result" | "history" | "login" | "dashboard" | "belajar";
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

/* ---------------- SUARA: TTS (Dengarkan Soal) + efek klik WebAudio ----------------
   Semua suara hanya berbunyi dari ketukan user (user gesture) — tidak ada
   autoplay. Pengaturan ON/OFF tersimpan di perangkat dan mematikan SEMUA
   suara (TTS + efek klik). */
const SOUND_KEY = "ziqva-sound-v2";
const SOUND_KEY_LAMA = "ziqva-sound";
function loadSoundOn(): boolean {
  // Kunci penyimpanan BARU (v2): status OFF yang mungkin tersimpan tanpa
  // disadari dari versi lama TIDAK terbawa — semua perangkat mulai dari ON
  // pada versi ini. Setelah itu, pilihan user di kunci v2 yang berlaku, dan
  // chip "Suara: ON/OFF" selalu menampilkan keadaan yang sesungguhnya.
  try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
}

export function langForSubject(subjectId: string): string {
  if (subjectId === "korea") return "ko-KR";
  if (subjectId === "jepang") return "ja-JP";
  if (subjectId === "mandarin") return "zh-CN";
  if (subjectId === "jawa") return "jv-ID";
  if (subjectId === "arab") return "ar-SA";
  if (subjectId.includes("inggris") || subjectId.startsWith("cambridge-eng")) return "en-US";
  return "id-ID";
}

/* Cache daftar suara perangkat — dihangatkan sejak halaman dibuka dan pada
   ketukan pertama, supaya saat tombol Dengarkan Soal diketuk, speak() dapat
   dipanggil SINKRON di dalam handler klik yang sama. Di Android Chrome,
   speak() yang dipanggil setelah await / jeda async sering gagal diam-diam. */
let voiceCache: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  try {
    if ("speechSynthesis" in window) {
      const v = window.speechSynthesis.getVoices();
      if (v.length) voiceCache = v;
    }
  } catch { /* abaikan */ }
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  try { window.speechSynthesis.addEventListener("voiceschanged", refreshVoices); } catch { /* abaikan */ }
}

export interface SpeakOpts {
  setSpeaking: (b: boolean) => void;
  onStatus?: (msg: string) => void;
  onStart?: () => void;
}

/* ---------- Pemilihan voice PALING NATURAL + parameter ramah anak ----------
   Voice bawaan sebagian HP terdengar kaku seperti robot (monoton, nada
   rendah) — tidak ramah untuk anak. Karena itu voice dipilih memakai skor:
   voice Google (mis. "Google Bahasa Indonesia", "Google US English") dan
   voice bertanda natural/neural/enhanced diprioritaskan; voice robotik
   (eSpeak & suara novelty) dihindari selama ada alternatif yang lebih
   natural. Pitch dibuat sedikit lebih tinggi & hangat (1,1 — tidak pernah
   di bawah 1,0), rate sedikit lebih lambat (0,92–0,95) agar jelas dan mudah
   diikuti anak. Teks panjang dipecah per kalimat dan diucapkan berurutan
   supaya intonasinya hidup, bukan satu napas monoton. */
function voiceScore(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (n.includes("google")) s += 100;
  if (/natural|neural|enhanced|premium/.test(n)) s += 60;
  if (/espeak|fred|albert|bad news|bubbles|cellos|deranged|hysterical|trinoids|whisper|zarvox|grandpa|grandma/.test(n)) s -= 120;
  if (v.default) s += 5;
  return s;
}
interface PickedVoice { voice?: SpeechSynthesisVoice; matched: boolean; natural: boolean }
function pickVoice(lang: string): PickedVoice {
  const voices = voiceCache;
  if (!voices.length) return { matched: false, natural: false };
  const norm = (s: string) => s.toLowerCase().replace("_", "-");
  const target = norm(lang);
  const prefix = target.split("-")[0] ?? target;
  const exact = voices.filter((v) => norm(v.lang) === target);
  const byPrefix = voices.filter((v) => norm(v.lang).startsWith(prefix));
  const pool = exact.length ? exact : byPrefix;
  if (!pool.length) {
    const fb = voices.find((v) => v.default) ?? [...voices].sort((a, b) => voiceScore(b) - voiceScore(a))[0];
    return { voice: fb, matched: false, natural: fb ? voiceScore(fb) >= 60 : false };
  }
  const best = [...pool].sort((a, b) => voiceScore(b) - voiceScore(a))[0];
  return { voice: best, matched: true, natural: best ? voiceScore(best) >= 60 : false };
}
function rateForLang(lang: string): number {
  const p = lang.toLowerCase().split("-")[0] ?? "";
  return p === "ar" || p === "ko" || p === "ja" || p === "zh" || p === "jv" ? 0.92 : 0.95;
}
/** Pecah teks menjadi kalimat-kalimat pendek (maks ±160 karakter) agar
    intonasi bacaan hidup — bukan satu napas monoton seperti robot. */
function splitSentences(text: string): string[] {
  const raw = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
  const chunks: string[] = [];
  for (const piece of raw) {
    let p = piece.trim();
    if (!p) continue;
    while (p.length > 160) {
      const cut = p.lastIndexOf(" ", 160);
      const idx = cut > 60 ? cut : 160;
      chunks.push(p.slice(0, idx).trim());
      p = p.slice(idx).trim();
    }
    if (p) chunks.push(p);
  }
  return chunks.length ? chunks : [text];
}

/**
 * Ucapkan teks dengan pola paling andal & paling ramah anak di HP:
 * - utterance pertama dibuat & speak() dipanggil sinkron dari klik;
 * - voice dipilih dengan pickVoice() (paling natural untuk bahasanya);
 *   bila voice bahasa tujuan TIDAK ada, pakai voice default perangkat dan
 *   JANGAN paksa u.lang ke bahasa itu (penyebab umum TTS bisu di Android);
 * - teks dipecah per kalimat (splitSentences) dan diucapkan berurutan;
 * - pitch 1,1 & rate 0,92–0,95 (rateForLang) agar hangat dan jelas;
 * - resume() dipanggil sebelum speak; cancel() hanya bila sedang berbicara,
 *   dan speak berikutnya diberi jeda kecil agar antrean tidak macet;
 * - bila TTS error, bunyi nada WebAudio singkat berbunyi sebagai indikator
 *   bahwa tombol bekerja, dan pesan status tampil jelas di layar.
 */
function speakText(text: string, lang: string, opts: SpeakOpts): boolean {
  const { setSpeaking, onStatus } = opts;
  if (!("speechSynthesis" in window)) {
    setSpeaking(false);
    onStatus?.("Browser perangkat ini tidak mendukung suara bacaan (TTS). Coba buka dengan Chrome di Android atau Safari di iPhone, ya.");
    return false;
  }
  const synth = window.speechSynthesis;
  // Bangunkan jalur WebAudio dalam gestur klik yang sama — di banyak HP,
  // jalur audio yang belum pernah dibangunkan membuat SEMUA bunyi bisu.
  ensureAudioCtx();
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim();
  if (!clean) { setSpeaking(false); return true; }
  refreshVoices();
  const picked = pickVoice(lang);
  const voice = picked.voice;
  const chunks = splitSentences(clean);
  let started = false;
  let stopped = false;
  let ci = 0;
  const speakChunk = () => {
    if (stopped) return;
    if (ci >= chunks.length) { setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(chunks[ci]);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang; // pakai bahasa voice yang benar-benar ada di perangkat
    }
    u.rate = rateForLang(lang);
    u.pitch = 1.1; // sedikit lebih tinggi & hangat — ramah anak, tidak kaku
    u.onstart = () => { if (ci === 0) { started = true; opts.onStart?.(); } setSpeaking(true); };
    u.onend = () => { ci += 1; speakChunk(); };
    u.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") { stopped = true; setSpeaking(false); return; }
      stopped = true;
      setSpeaking(false);
      sfxSelect(); // indikator bunyi: tombol bekerja walau TTS gagal
      onStatus?.(`Suara bacaan gagal diputar di perangkat ini (${e.error}). Ketuk tombol 🔊 Tes Suara untuk melihat diagnosa lengkapnya.`);
    };
    try { synth.resume(); } catch { /* abaikan */ }
    try {
      synth.speak(u);
    } catch {
      stopped = true;
      setSpeaking(false);
      sfxSelect();
      onStatus?.("Suara bacaan gagal dimulai. Ketuk tombol 🔊 Tes Suara untuk melihat diagnosa lengkapnya.");
    }
  };
  const doSpeak = () => {
    setSpeaking(true);
    speakChunk();
    window.setTimeout(() => {
      if (!started && !stopped) onStatus?.("Bacaan belum juga mulai — mesin suara (TTS) di browser ini tampaknya tidak aktif. Ketuk tombol 🔊 Tes Suara untuk diagnosa lengkap, atau buka ZIQVA OLIM dengan Chrome dan pastikan Speech Services by Google aktif.");
    }, 2800);
    window.setTimeout(() => setSpeaking(false), Math.min(60000, 6000 + clean.length * 110));
  };
  if (!picked.matched && voiceCache.length > 0) {
    onStatus?.("Suara untuk bahasa soal ini belum terpasang di HP — memakai suara bawaan perangkat, jadi pelafalannya mungkin berbeda.");
  }
  if (synth.speaking || synth.pending) {
    // Antrean lama dibersihkan dulu; speak diberi jeda kecil sesudah cancel
    // agar tidak macet seperti yang sering terjadi di Android Chrome.
    try { synth.cancel(); } catch { /* abaikan */ }
    window.setTimeout(doSpeak, 90);
  } else {
    doSpeak(); // sinkron di dalam handler klik — jalur paling andal
  }
  return true;
}

/* Efek suara WebAudio — dibuat langsung di browser, tanpa file audio. */
let audioCtx: AudioContext | null = null;
function ensureAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    // resume() dipanggil SINKRON di dalam handler klik yang sedang berjalan
    // (bukan ditunda), setiap kali statusnya belum "running" — termasuk
    // status "interrupted" di iOS. Context yang tidak pernah ter-resume di
    // dalam gestur user adalah penyebab klasik SEMUA bunyi bisu total.
    if (audioCtx.state !== "running") void audioCtx.resume();
    return audioCtx;
  } catch { return null; }
}
/** Bangunkan jalur audio di dalam klik ini juga: dipanggil di awal setiap
    handler tombol suara/jawaban, bukan hanya pada ketukan pertama. */
function unlockAudio() { ensureAudioCtx(); }
function tone(freq: number, startIn: number, dur: number, peak = 0.12, type: OscillatorType = "sine") {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + startIn;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}
/** Bunyi pilih jawaban: pendek, ceria, jelas terdengar, aman untuk anak. */
function sfxSelect() { tone(740, 0, 0.09, 0.22, "triangle"); tone(988, 0.05, 0.1, 0.18, "triangle"); }
/** Bunyi jawaban benar (Mode Latihan): nada naik ceria. */
function sfxCorrect() { tone(523, 0, 0.11, 0.2); tone(659, 0.09, 0.11, 0.2); tone(784, 0.18, 0.16, 0.22); }
/** Bunyi jawaban salah (Mode Latihan): nada turun lembut, tidak menusuk. */
function sfxWrong() { tone(330, 0, 0.16, 0.12); tone(262, 0.13, 0.22, 0.1); }
/** Bunyi perayaan kecil (dapat lencana / naik level). */
function sfxCelebrate() { tone(523, 0, 0.12, 0.18); tone(659, 0.1, 0.12, 0.18); tone(784, 0.2, 0.12, 0.18); tone(1047, 0.3, 0.22, 0.2); }
/** Nada tes: tiga nada naik dengan gain BESAR (0,4) — harus terdengar jelas
    bila jalur bunyi perangkat terbuka. Sengaja tidak pelan. */
function sfxTest() {
  tone(659, 0, 0.22, 0.4, "triangle");
  tone(880, 0.24, 0.22, 0.4, "triangle");
  tone(1175, 0.48, 0.36, 0.42, "triangle");
}

/**
 * Tes Suara menyeluruh — dipanggil SINKRON dari klik tombol "🔊 Tes Suara":
 * 1) buat + resume AudioContext saat itu juga, lalu putar nada tes yang
 *    jelas & cukup keras lewat WebAudio;
 * 2) laporkan status AudioContext (running/suspended/…), jumlah voice TTS
 *    di perangkat beserta daftar bahasanya, dan voice yang akan dipakai;
 * 3) bacakan kalimat tes pendek lewat jalur TTS yang sama dengan
 *    Dengarkan Soal, dan laporkan hasil persisnya (mulai / error apa).
 * Semua hasil ditulis ke layar lewat onLines supaya user bisa membacanya
 * dan melaporkannya — tidak ada lagi kegagalan yang diam-diam.
 */
function runSoundTest(opts: { onLines: (lines: string[]) => void; setSpeaking?: (b: boolean) => void }) {
  const lines: string[] = [];
  const push = (s: string) => { lines.push(s); opts.onLines([...lines]); };
  push("🔍 Memeriksa jalur suara perangkat ini…");
  const ctx = ensureAudioCtx();
  if (!ctx) {
    push("❌ Browser ini tidak mendukung WebAudio (AudioContext) — efek bunyi tidak bisa diputar di browser ini.");
  } else {
    push(`🎛️ AudioContext: status "${ctx.state}", sample rate ${ctx.sampleRate} Hz.`);
    sfxTest();
    window.setTimeout(() => {
      push(ctx.state === "running"
        ? "🎵 Nada tes diputar dengan AudioContext RUNNING — jalur bunyi perangkat terbuka, tiga nada naik tadi harusnya terdengar jelas."
        : `⚠️ AudioContext masih "${ctx.state}" setelah nada tes — browser menahan jalur bunyi. Ketuk layar sekali, lalu ketuk Tes Suara lagi.`);
    }, 650);
  }
  if (!("speechSynthesis" in window)) {
    push("❌ Browser ini tidak mendukung suara bacaan (TTS). Coba buka ZIQVA OLIM dengan Chrome di Android atau Safari di iPhone, ya.");
    return;
  }
  refreshVoices();
  const vs = voiceCache;
  const langs = [...new Set(vs.map((v) => v.lang))];
  push(`🗣️ Suara bacaan (TTS) terpasang di perangkat: ${vs.length} suara. Bahasa yang tersedia: ${langs.length ? langs.join(", ") : "— (daftar masih kosong)"}.`);
  if (vs.length === 0) {
    push("⚠️ Daftar suara TTS kosong — mesin suara perangkat belum aktif. Di Android, pasang/aktifkan \"Speech Services by Google\" dari Play Store, lalu buka lagi halaman ini dan ketuk Tes Suara.");
  }
  const picked = pickVoice("id-ID");
  if (picked.voice) {
    push(`🎙️ Voice untuk Bahasa Indonesia: "${picked.voice.name}" (${picked.voice.lang})${picked.natural ? " — voice natural, bagus!" : ""}`);
  }
  if (vs.length > 0 && !vs.some((v) => voiceScore(v) >= 60)) {
    push("💡 Perangkat ini hanya memiliki voice bawaan yang memang terdengar kaku seperti robot — itu sifat voice-nya, bukan kesalahan kamu. Agar suara jauh lebih natural dan ramah anak, pasang \"Speech Services by Google\" dari Play Store, lalu pilih suara \"Google Bahasa Indonesia\" di Pengaturan › Bahasa & masukan › Text-to-speech. Setelah itu buka lagi ZIQVA OLIM dan ketuk Tes Suara.");
  }
  let ttsStarted = false;
  speakText("Halo! Ini tes suara ZIQVA OLIM. Satu, dua, tiga — suara berbunyi dengan jelas dan ramah!", "id-ID", {
    setSpeaking: opts.setSpeaking ?? (() => { /* tanpa indikator visual */ }),
    onStart: () => { ttsStarted = true; push("✅ Kalimat tes MULAI dibacakan — mesin TTS bekerja. Kalau kalimat tadi terdengar, tombol Dengarkan Soal juga akan berbunyi."); },
    onStatus: (m) => push(`ℹ️ ${m}`),
  });
  window.setTimeout(() => {
    if (!ttsStarted) push("⚠️ Kalimat tes belum mulai dibacakan setelah 3 detik — TTS tidak merespons di browser ini. Coba buka ZIQVA OLIM dengan Chrome (Android) / Safari (iPhone), dan pastikan Speech Services by Google aktif.");
  }, 3000);
}

/* ---------------- REWARDS & LEVEL (tersimpan di perangkat) ---------------- */
const REWARD_KEY = "ziqva-rewards-v1";
const LEVEL_KEY = "ziqva-levels-v1";
const SEEN_KEY = "ziqva-seen-v1";
interface Rewards { points: number; totalCorrect: number; totalSessions: number; streak: number; lastDay: string; badges: string[] }
const EMPTY_REWARDS: Rewards = { points: 0, totalCorrect: 0, totalSessions: 0, streak: 0, lastDay: "", badges: [] };
function loadRewards(): Rewards {
  try {
    const raw = localStorage.getItem(REWARD_KEY);
    if (!raw) return { ...EMPTY_REWARDS };
    return { ...EMPTY_REWARDS, ...(JSON.parse(raw) as Partial<Rewards>) };
  } catch { return { ...EMPTY_REWARDS }; }
}
function saveRewards(r: Rewards) { try { localStorage.setItem(REWARD_KEY, JSON.stringify(r)); } catch { /* abaikan */ } }

interface BadgeDef { id: string; icon: string; name: string; desc: string }
const BADGES: BadgeDef[] = [
  { id: "pertama", icon: "🎯", name: "Langkah Pertama", desc: "Selesaikan 1 sesi latihan pertamamu" },
  { id: "benar50", icon: "⭐", name: "Pengumpul Bintang", desc: "Kumpulkan 50 jawaban benar" },
  { id: "benar200", icon: "🌟", name: "Bintang Bersinar", desc: "Kumpulkan 200 jawaban benar" },
  { id: "benar500", icon: "💎", name: "Master Bintang", desc: "Kumpulkan 500 jawaban benar" },
  { id: "sesi10", icon: "🏃", name: "Rajin Berlatih", desc: "Selesaikan 10 sesi latihan" },
  { id: "sesi30", icon: "🏆", name: "Pejuang Olimpiade", desc: "Selesaikan 30 sesi latihan" },
  { id: "skor80", icon: "🎖️", name: "Nyaris Sempurna", desc: "Raih skor 80 atau lebih dalam satu sesi" },
  { id: "sempurna", icon: "👑", name: "Sempurna!", desc: "Raih skor 100 dalam satu sesi" },
  { id: "streak3", icon: "🔥", name: "Api Menyala", desc: "Latihan 3 hari berturut-turut" },
  { id: "streak7", icon: "🌋", name: "Seminggu Penuh", desc: "Latihan 7 hari berturut-turut" },
  { id: "naiklevel", icon: "🚀", name: "Naik Level", desc: "Buka level kesulitan berikutnya (skor 80+)" },
];
function dayStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

type LevelStore = Record<string, { unlocked: number; best: Record<string, number> }>;
function loadLevels(): LevelStore {
  try {
    const raw = localStorage.getItem(LEVEL_KEY);
    return raw ? (JSON.parse(raw) as LevelStore) : {};
  } catch { return {}; }
}
function saveLevels(s: LevelStore) { try { localStorage.setItem(LEVEL_KEY, JSON.stringify(s)); } catch { /* abaikan */ } }

/* ---------------- QUIZ ---------------- */
function QuizView(props: {
  jenjang: JenjangId; subjectName: string; subjectId: string; mode: Mode; levelLabel: string;
  soundOn: boolean; onToggleSound: () => void;
  questions: Question[]; onFinish: (answers: (number | null)[], usedSec: number) => void; onQuit: () => void;
  onInfo?: (q: Question) => void;
  quitSignal?: number;
}) {
  const { questions, mode } = props;
  const totalTime = questions.length * 60;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(() => questions.map(() => false));
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  // Klik logo header saat sesi berjalan membuka konfirmasi keluar yang sama.
  useEffect(() => {
    if ((props.quitSignal ?? 0) > 0) setConfirmQuit(true);
  }, [props.quitSignal]);
  const [speaking, setSpeaking] = useState(false);
  const [ttsMsg, setTtsMsg] = useState("");
  const startRef = useRef(Date.now());
  const finishedRef = useRef(false);

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

  // Hentikan bacaan TTS saat keluar dari kuis.
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* abaikan */ } }, []);

  const handleListen = () => {
    if (!current) return;
    unlockAudio(); // bangunkan jalur audio sinkron di dalam klik ini
    if (!props.soundOn) {
      setTtsMsg("Suara sedang OFF. Ketuk tombol “Suara: OFF” di samping tombol Dengarkan Soal untuk menyalakannya.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      setTtsMsg("Maaf, browser perangkat ini tidak mendukung suara bacaan (TTS). Coba Chrome di Android atau Safari di iPhone, ya.");
      return;
    }
    setTtsMsg("");
    speakText(`${current.q}. Pilihan: ${current.options.join(". ")}`, langForSubject(props.subjectId), { setSpeaking, onStatus: setTtsMsg });
  };

  const [testLines, setTestLines] = useState<string[]>([]);
  const handleTestSound = () => {
    // Tes suara sekaligus memastikan pengaturan suara aplikasi ON — bila
    // masih OFF, nyalakan dulu dari klik ini supaya tesnya benar-benar bunyi.
    if (!props.soundOn) props.onToggleSound();
    unlockAudio();
    setTestLines(["🔍 Memeriksa jalur suara perangkat ini…"]);
    runSoundTest({ onLines: setTestLines, setSpeaking });
  };

  if (!current) return null;
  const isRevealed = mode === "latihan" && revealed[idx];
  const lowTime = timeLeft <= 60;

  const choose = (opt: number) => {
    if (isRevealed) return;
    setAnswers((prev) => prev.map((a, i) => (i === idx ? opt : a)));
    if (props.soundOn) {
      if (mode === "latihan") {
        if (opt === current.answer) { sfxSelect(); window.setTimeout(sfxCorrect, 110); }
        else sfxWrong();
      } else {
        sfxSelect();
      }
    }
    if (mode === "latihan") setRevealed((prev) => prev.map((r, i) => (i === idx ? true : r)));
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28">
      {/* HUD kuis: progress + timer */}
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
          <button type="button" onClick={props.onToggleSound} aria-label={props.soundOn ? "Matikan semua suara" : "Nyalakan suara"} aria-pressed={props.soundOn} className="rounded-full px-3 py-2 text-sm font-bold" style={{ background: "var(--surface2)", color: "var(--dim)" }}>{props.soundOn ? "🔊" : "🔇"}</button>
          <button type="button" onClick={() => setConfirmQuit(true)} aria-label="Keluar dari kuis" className="rounded-full px-3 py-2 text-sm font-bold" style={{ background: "var(--surface2)", color: "var(--dim)" }}>✕</button>
        </div>
      </div>

      <p className="mt-2 text-sm font-bold" style={{ color: "var(--dim)" }}>{props.jenjang} • {props.subjectName} • {props.levelLabel} • Soal {idx + 1} dari {questions.length}</p>

      <div className="pop-in relative mt-2 rounded-3xl p-5 shadow-sm" key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {mode === "latihan" && props.onInfo && <InfoIcon onClick={() => props.onInfo?.(current)} />}
        {current.emoji && <div className="floaty mb-2 text-5xl" aria-hidden>{current.emoji}</div>}
        {current.stimulus && <p className="mb-3 rounded-xl px-3 py-2 text-[15px] leading-relaxed" style={{ background: "var(--surface2)" }}>{current.stimulus}</p>}
        <h2 className="pr-8 text-lg leading-snug font-bold whitespace-pre-line">{current.q}</h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleListen} aria-label="Dengarkan soal dibacakan" aria-live="polite"
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white ${speaking ? "speaking" : ""}`} style={{ background: speaking ? "#C2255C" : "#E84393" }}>
            {speaking ? "🔊 Sedang dibacakan…" : "▶ 🔊 Dengarkan Soal"}
          </button>
          <button type="button" onClick={props.onToggleSound} aria-pressed={props.soundOn}
            aria-label={props.soundOn ? "Suara sedang ON — ketuk untuk mematikan semua suara" : "Suara sedang OFF — ketuk untuk menyalakan suara"}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold"
            style={{ background: props.soundOn ? "#E2F4E9" : "#FAE7E9", color: props.soundOn ? "#1E7A46" : "#B02A37", border: `2px solid ${props.soundOn ? "#1E7A46" : "#B02A37"}` }}>
            {props.soundOn ? "🔊 Suara: ON" : "🔇 Suara: OFF"}
          </button>
          <button type="button" onClick={handleTestSound} aria-label="Tes suara: putar nada tes dan kalimat percobaan, lalu tampilkan diagnosa suara"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold"
            style={{ background: "var(--surface2)", color: "var(--accent)", border: "2px solid var(--accent)" }}>
            🔊 Tes Suara
          </button>
        </div>
        {!props.soundOn && <p className="mt-2 text-xs font-bold" style={{ color: "#B02A37" }}>Suara sedang OFF — ketuk tombol “Suara: OFF” di atas untuk menyalakan, lalu Dengarkan Soal akan berbunyi.</p>}
        {ttsMsg && <p className="mt-2 rounded-xl px-3 py-2 text-xs font-bold" style={{ background: "#FBF0DA", color: "#92600A" }} role="status">{ttsMsg}</p>}
        {testLines.length > 0 && (
          <div className="mt-2 rounded-xl px-3 py-2 text-xs leading-relaxed font-semibold" style={{ background: "var(--surface2)", color: "var(--text)" }} role="status" aria-label="Hasil diagnosa suara">
            <p className="font-display text-[13px] font-bold">🔍 Diagnosa Suara</p>
            <ul className="mt-1 list-none space-y-0.5">
              {testLines.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        )}

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

      {confirmQuit && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Konfirmasi keluar dari sesi">
          <div className="pop-in w-full max-w-sm rounded-3xl p-6" style={{ background: "var(--surface)" }}>
            <h3 className="font-display text-xl font-bold">Keluar dari sesi ini?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>
              Kamu sudah menjawab {answeredCount} dari {questions.length} soal. Jika keluar sekarang, progres sesi ini hilang dan tidak tersimpan. Lanjutkan mengerjakan?
            </p>
            <div className="mt-5 grid gap-2">
              <button type="button" onClick={() => setConfirmQuit(false)} className="min-h-[52px] rounded-2xl font-display text-base font-bold text-white" style={{ background: "var(--accent)" }}>Lanjut Mengerjakan ✏️</button>
              <button type="button" onClick={props.onQuit} className="min-h-[52px] rounded-2xl font-display text-base font-bold" style={{ background: "var(--surface2)", color: "#B02A37" }}>Ya, Keluar ke Beranda</button>
            </div>
          </div>
        </div>
      )}

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

/* ---------------- PERPUSTAKAAN BELAJAR ---------------- */
function BelajarView(props: {
  jenjang: JenjangId;
  initialSubject: string;
  onPractice: (subjectId: string) => void;
  onOpenModule: (module: LibraryModule, jenjang: JenjangId, subjectId: string) => void;
}) {
  const [libJenjang, setLibJenjang] = useState<JenjangId>(props.jenjang);
  const libSubjects = useMemo(() => SUBJECTS.filter((s) => s.jenjang.includes(libJenjang)), [libJenjang]);
  const [sel, setSel] = useState(props.initialSubject);
  const active = libSubjects.find((s) => s.id === sel) ?? libSubjects[0];
  const material = active ? materialFor(active.id) : null;
  const modules = active ? modulesFor(libJenjang, active.id) : [];
  useEffect(() => { setSel(props.initialSubject); }, [props.initialSubject]);
  useEffect(() => { setLibJenjang(props.jenjang); }, [props.jenjang]);
  if (!active) return null;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10">
      <section className="mt-4 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h1 className="font-display text-2xl font-extrabold">📚 Perpustakaan Belajar — Modul per Jenjang &amp; Mapel</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--dim)" }}>
          Perpustakaan lengkap untuk belajar dari dasar: pilih jenjang dan mata pelajaran, lalu buka modul topiknya —
          ada penjelasan konsep, contoh dalam kehidupan sehari-hari, dan rangkuman. Khusus Sains/IPA, lingkupnya lengkap per jenjang:
          makhluk hidup &amp; lingkungan, tubuh manusia, energi, bumi &amp; alam semesta, zat &amp; materi, gaya &amp; gerak, listrik &amp; magnet, ekosistem, sampai Fisika, Kimia, dan Biologi yang lebih dalam. ✨
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pilih jenjang perpustakaan">
          {JENJANG.map((j) => (
            <button key={j.id} type="button" onClick={() => setLibJenjang(j.id)} aria-pressed={libJenjang === j.id} aria-label={`Perpustakaan jenjang ${j.name}`}
              className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: libJenjang === j.id ? "var(--accent)" : "var(--surface2)", color: libJenjang === j.id ? "#fff" : "var(--dim)", border: "1px solid var(--border)" }}>
              {j.name}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <nav className="grid grid-cols-2 gap-2 self-start sm:grid-cols-3 lg:grid-cols-1" aria-label="Pilih bahan belajar mata pelajaran">
          {libSubjects.map((s) => (
            <button key={s.id} type="button" onClick={() => setSel(s.id)} aria-pressed={active.id === s.id} aria-label={`Bahan belajar ${s.name}`}
              className="rounded-2xl p-3 text-left transition"
              style={{ background: active.id === s.id ? s.bg : "var(--surface)", border: `2px solid ${active.id === s.id ? s.color : "var(--border)"}` }}>
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 font-display text-[11px] font-extrabold text-white" style={{ background: s.color }}>{s.short}</span>
              <span className="mt-1 block font-display text-sm leading-tight font-bold">{s.name}</span>
            </button>
          ))}
        </nav>

        <article className="rounded-3xl p-5 shadow-sm sm:p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {!material ? (
            <p style={{ color: "var(--dim)" }}>Materi untuk mapel ini sedang disiapkan. Sementara itu, langsung latihan saja — pembahasan di setiap soal akan membantumu belajar!</p>
          ) : (
            <>
              <h2 className="font-display text-xl leading-snug font-extrabold">{material.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--dim)" }}>{material.intro}</p>
              {material.focus[props.jenjang] && (
                <p className="mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed font-semibold" style={{ background: "var(--surface2)" }}>
                  🎯 <strong>Fokus untuk jenjang {props.jenjang}:</strong> {material.focus[props.jenjang]}
                </p>
              )}
              {modules.length > 0 && (
                <section className="mt-5" aria-label={`Modul belajar ${active.name} jenjang ${libJenjang}`}>
                  <h3 className="font-display text-base font-extrabold">🧩 Modul Topik — {active.name} • {JENJANG.find((j) => j.id === libJenjang)?.name}</h3>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--dim)" }}>Ketuk modul untuk membaca materi lengkapnya. Modul yang sama juga terbuka dari ikon <strong>i</strong> pada soal latihan yang topiknya sesuai.</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {modules.map((m) => (
                      <button key={m.id} type="button" onClick={() => props.onOpenModule(m, libJenjang, active.id)} aria-label={`Buka modul ${m.title}`}
                        className="flex min-h-[64px] items-center gap-3 rounded-2xl p-3 text-left transition"
                        style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <span className="text-3xl" aria-hidden>{m.emoji}</span>
                        <span className="min-w-0">
                          <span className="block font-display text-sm leading-tight font-bold">{m.title}</span>
                          <span className="block text-xs font-semibold" style={{ color: "var(--dim)" }}>Konsep • Contoh nyata • Rangkuman →</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <h3 className="font-display mt-5 text-base font-extrabold">📖 Materi Dasar {active.name}</h3>
              <div className="mt-2 grid gap-4">
                {material.sections.map((sec) => (
                  <section key={sec.h}>
                    <h3 className="font-display text-base font-bold" style={{ color: "var(--accent)" }}>{sec.h}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed">{sec.body}</p>
                  </section>
                ))}
              </div>
              <div className="mt-5 rounded-2xl px-4 py-3" style={{ background: "#E2F4E9", border: "1px solid #1E7A46" }}>
                <h3 className="font-display text-sm font-bold">💡 Tips agar makin penasaran</h3>
                <ul className="mt-1 grid gap-1 text-sm leading-relaxed">
                  {material.tips.map((t) => <li key={t}>• {t}</li>)}
                </ul>
              </div>
              <button type="button" onClick={() => props.onPractice(active.id)} aria-label={`Mulai latihan ${active.name}`}
                className="font-display mt-5 min-h-[54px] w-full rounded-2xl text-lg font-extrabold text-white" style={{ background: "var(--accent)" }}>
                🎯 Sudah Paham? Latihan {active.name} Sekarang →
              </button>
            </>
          )}
        </article>
      </div>
    </main>
  );
}

/* ---------------- IKON INFO MATERI (samar, target sentuh besar) ---------------- */
function InfoIcon(props: { onClick: () => void }) {
  return (
    <button type="button" onClick={props.onClick} aria-label="Lihat materi pembahasan"
      className="absolute top-1.5 right-1.5 z-10 flex h-11 w-11 items-start justify-end p-0"
      style={{ background: "transparent" }}>
      <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-extrabold italic transition"
        style={{ background: "var(--surface2)", color: "var(--accent)", border: "1.5px solid var(--border)", opacity: 0.5 }}>
        i
      </span>
    </button>
  );
}

/* ---------------- HALAMAN MODUL BELAJAR ---------------- */
function ModuleView(props: {
  module: LibraryModule;
  jenjang: JenjangId;
  subjectName: string;
  question?: Question;
  backLabel: string;
  onBack: () => void;
  onPractice?: () => void;
}) {
  const m = props.module;
  const q = props.question;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--bg)" }} role="dialog" aria-modal="true" aria-label={`Modul belajar ${m.title}`}>
      <main className="mx-auto w-full max-w-3xl px-4 pb-12">
        <div className="sticky top-0 z-10 -mx-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3" style={{ background: "var(--bg)" }}>
          <button type="button" onClick={props.onBack} aria-label={props.backLabel}
            className="font-display min-h-[48px] rounded-full px-5 text-base font-extrabold text-white shadow" style={{ background: "var(--accent)" }}>
            ← {props.backLabel}
          </button>
        </div>

        {q && (
          <section className="pop-in mt-2 rounded-3xl p-5" style={{ background: "#FFF8EC", border: "2px solid var(--gold)" }} aria-label="Soal yang sedang dipelajari">
            <h2 className="font-display text-sm font-extrabold tracking-wide" style={{ color: "#92600A" }}>🧐 SOAL YANG SEDANG KAMU PELAJARI</h2>
            <p className="mt-2 font-bold whitespace-pre-line">{q.emoji ? `${q.emoji} ` : ""}{q.q}</p>
            <p className="mt-2 text-sm">Jawaban benar: <strong>{LETTERS[q.answer]}. {q.options[q.answer]}</strong></p>
            <p className="mt-2 rounded-xl px-3 py-2 text-sm leading-relaxed" style={{ background: "var(--surface)" }}><strong>Pembahasan soal:</strong> {q.explain}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>Di bawah ini materi lengkap topik soal tersebut — baca pelan-pelan, lalu kembali dan coba lagi. Kamu pasti bisa! 💪</p>
          </section>
        )}

        <article className="mt-4 rounded-3xl p-5 shadow-sm sm:p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-5xl" aria-hidden>{m.emoji}</div>
          <h1 className="font-display mt-2 text-2xl leading-snug font-extrabold">{m.title}</h1>
          <p className="mt-1 text-sm font-bold" style={{ color: "var(--dim)" }}>{props.subjectName} • Jenjang {JENJANG.find((j) => j.id === props.jenjang)?.name ?? props.jenjang} • Modul Perpustakaan Belajar</p>

          <section className="mt-5">
            <h2 className="font-display text-lg font-extrabold" style={{ color: "var(--accent)" }}>📖 Konsep dari Dasar</h2>
            <p className="mt-1 text-[15px] leading-relaxed">{m.concept}</p>
          </section>
          <section className="mt-5">
            <h2 className="font-display text-lg font-extrabold" style={{ color: "var(--accent)" }}>🏠 Contoh dalam Kehidupan Sehari-hari</h2>
            <p className="mt-1 rounded-2xl px-4 py-3 text-[15px] leading-relaxed" style={{ background: "var(--surface2)" }}>{m.example}</p>
          </section>
          <section className="mt-5 rounded-2xl px-4 py-3" style={{ background: "#E2F4E9", border: "1px solid #1E7A46" }}>
            <h2 className="font-display text-base font-extrabold">📝 Rangkuman — Ingat Ini Saja</h2>
            <p className="mt-1 text-[15px] leading-relaxed font-semibold">{m.summary}</p>
          </section>

          <div className="mt-6 grid gap-2">
            <button type="button" onClick={props.onBack} className="font-display min-h-[54px] rounded-2xl text-lg font-extrabold text-white" style={{ background: "var(--accent)" }} aria-label={props.backLabel}>
              ← {props.backLabel}
            </button>
            {props.onPractice && (
              <button type="button" onClick={props.onPractice} className="font-display min-h-[54px] rounded-2xl text-lg font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }} aria-label={`Latihan soal ${props.subjectName}`}>
                🎯 Uji Pemahaman: Latihan {props.subjectName} →
              </button>
            )}
          </div>
        </article>
      </main>
    </div>
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
  const [level, setLevel] = useState(1);
  const [sessionQ, setSessionQ] = useState<Question[]>([]);
  const [sessionLevel, setSessionLevel] = useState(1);
  const [soundOn, setSoundOn] = useState<boolean>(() => loadSoundOn());
  const [testLines, setTestLines] = useState<string[]>([]);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const handleTestSound = () => {
    // Tes suara memastikan pengaturan suara aplikasi ON lebih dulu — bila
    // masih OFF (mis. tersimpan dari sesi lama), nyalakan dari klik ini.
    if (!soundOn) {
      setSoundOn(true);
      try { localStorage.setItem(SOUND_KEY, "on"); } catch { /* abaikan */ }
    }
    unlockAudio();
    setShowTestPanel(true);
    setTestLines(["🔍 Memeriksa jalur suara perangkat ini…"]);
    runSoundTest({ onLines: setTestLines });
  };
  const [rewards, setRewards] = useState<Rewards>(() => loadRewards());
  const [levelStore, setLevelStore] = useState<LevelStore>(() => loadLevels());
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [unlockedNow, setUnlockedNow] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [welcomeSpeaking, setWelcomeSpeaking] = useState(false);
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

  const [deviceId, setDeviceId] = useState<string>(() => getDeviceId());
  const [showReset, setShowReset] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetDoneMsg, setResetDoneMsg] = useState("");
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
  const resetAll = useMutation({
    mutationFn: api.resetAllData,
    onError: (e) => setResetError(e instanceof Error ? e.message : "Reset di server gagal. Data di perangkat ini tetap dibersihkan — coba lagi bila perlu."),
  });

  const doResetAll = async () => {
    if (resetText.trim().toUpperCase() !== "RESET") return;
    setResetError("");
    let serverNote = "";
    try {
      const res = await resetAll.mutateAsync({ device_id: deviceId, token: token ?? "" });
      serverNote = res.deleted_attempts > 0 ? ` ${res.deleted_attempts} riwayat latihan terhapus.` : "";
    } catch {
      // Server gagal tidak menghalangi pembersihan lokal di bawah.
      serverNote = "";
    }
    // Bersihkan SEMUA data coba-coba yang tersimpan di perangkat ini.
    try {
      localStorage.removeItem(REWARD_KEY);
      localStorage.removeItem(LEVEL_KEY);
      localStorage.removeItem(SEEN_KEY);
      localStorage.removeItem(SOUND_KEY);
      localStorage.removeItem(SOUND_KEY_LAMA);
      localStorage.removeItem(TOKEN_KEY);
    } catch { /* abaikan */ }
    // Putar ID perangkat baru supaya riwayat lama benar-benar tidak terbawa.
    let newDeviceId = deviceId;
    try {
      const nid = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, nid);
      newDeviceId = nid;
    } catch { /* abaikan */ }
    setDeviceId(newDeviceId);
    setRewards({ ...EMPTY_REWARDS });
    setLevelStore({});
    setLevel(1);
    setName("");
    setNameError("");
    setMonitorCode("");
    setLastResult(null);
    setSessionQ([]);
    setNewBadges([]);
    setEarnedPoints(0);
    setUnlockedNow(null);
    setToken("");
    setSoundOn(true);
    setShowWelcome(true);
    setShowReset(false);
    setResetText("");
    setResetDoneMsg(`✅ Berhasil direset! Semua data coba-coba sudah bersih.${serverNote} Sekarang ZIQVA OLIM seperti baru pertama kali dibuka — silakan mulai untuk anak dengan nama aslinya.`);
    queryClient.invalidateQueries({ queryKey: ["attempts"] });
    queryClient.invalidateQueries({ queryKey: ["monitor"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    setView("home");
    window.scrollTo({ top: 0 });
  };
  function alertSaveError(e: unknown) {
    // Kegagalan simpan tidak menghalangi layar hasil; tampilkan pesan singkat.
    console.warn("saveAttempt failed", e);
  }

  const subjects = useMemo(() => subjectsFor(jenjang, school), [jenjang, school]);
  const activeSubject = subjects.find((s) => s.id === subjectId) ?? subjects[0];
  const questions = sessionQ;

  // Perpustakaan Belajar: konteks modul yang sedang dibuka (overlay di atas
  // tampilan apa pun, jadi sesi kuis & posisi review tidak hilang).
  const [moduleCtx, setModuleCtx] = useState<{
    module: LibraryModule; jenjang: JenjangId; subjectId: string; subjectName: string;
    question?: Question; backLabel: string; fromLibrary: boolean;
  } | null>(null);

  const openModuleForQuestion = (q: Question, backLabel: string) => {
    if (!activeSubject) return;
    const m = moduleForQuestion(jenjang, activeSubject.id, q);
    if (!m) return;
    setModuleCtx({ module: m, jenjang, subjectId: activeSubject.id, subjectName: activeSubject.name, question: q, backLabel, fromLibrary: false });
  };
  // Logo header: kembali ke Beranda dari halaman mana pun. Bila sedang di
  // tengah sesi kuis, logo memicu dialog konfirmasi keluar yang sama dengan
  // tombol ✕ di dalam kuis (sinyal diteruskan ke QuizView).
  const [quitSignal, setQuitSignal] = useState(0);
  const handleLogoClick = () => {
    if (view === "quiz") { setQuitSignal((s) => s + 1); return; }
    setView("home");
    window.scrollTo({ top: 0 });
  };
  const openModuleFromLibrary = (m: LibraryModule, j: JenjangId, sid: string) => {
    const subj = SUBJECTS.find((s) => s.id === sid);
    setModuleCtx({ module: m, jenjang: j, subjectId: sid, subjectName: subj?.name ?? sid, backLabel: "Kembali ke Perpustakaan", fromLibrary: true });
  };

  useEffect(() => {
    if (activeSubject && activeSubject.id !== subjectId) setSubjectId(activeSubject.id);
  }, [activeSubject, subjectId]);

  // Sambutan otomatis hilang sendiri setelah beberapa detik (bisa ditutup lebih cepat).
  useEffect(() => {
    if (!showWelcome) return;
    const t = window.setTimeout(() => setShowWelcome(false), 12000);
    return () => window.clearTimeout(t);
  }, [showWelcome]);

  // Hangatkan mesin suara pada SETIAP ketukan di mana pun (bukan hanya
  // ketukan pertama): daftar voice TTS dimuat lebih awal dan AudioContext
  // di-resume di dalam gestur itu juga, supaya tombol Dengarkan Soal & efek
  // klik langsung berbunyi saat diketuk (kebijakan audio HP). Listener ini
  // murah: resume() hanya benar-benar bekerja bila status belum "running".
  useEffect(() => {
    const warm = () => { refreshVoices(); unlockAudio(); };
    window.addEventListener("pointerdown", warm);
    return () => window.removeEventListener("pointerdown", warm);
  }, []);

  const toggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev;
      try { localStorage.setItem(SOUND_KEY, next ? "on" : "off"); } catch { /* abaikan */ }
      if (!next) { try { window.speechSynthesis?.cancel(); } catch { /* abaikan */ } }
      else unlockAudio(); // menyalakan suara = bangunkan jalur audio dalam klik ini
      return next;
    });
  };

  const comboKey = activeSubject ? `${jenjang}|${activeSubject.id}` : "";
  const unlockedLevel = levelStore[comboKey]?.unlocked ?? 1;
  const bestThisLevel = activeSubject ? levelStore[comboKey]?.best?.[String(level)] : undefined;

  // Di Mode Ujian, level pilihan tidak boleh melewati level yang sudah terbuka.
  useEffect(() => {
    if (mode === "ujian" && level > unlockedLevel) setLevel(unlockedLevel);
  }, [mode, level, unlockedLevel, comboKey]);

  const startQuiz = () => {
    if (!name.trim()) { setNameError("Isi nama peserta dulu ya, supaya hasil latihannya tercatat."); return; }
    if (!activeSubject) return;
    const qs = buildSession(jenjang, activeSubject.id, level, SESSION_SIZE);
    if (qs.length === 0) return;
    setSessionQ(qs);
    setSessionLevel(level);
    setLastResult(null);
    setNewBadges([]);
    setEarnedPoints(0);
    setUnlockedNow(null);
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

    /* --- rewards: poin, bintang, streak, lencana --- */
    const gained = correct * 10 + (score >= UNLOCK_SCORE ? 20 : 0) + (score === 100 ? 30 : 0);
    setEarnedPoints(gained);
    const today = dayStr(new Date());
    const yest = dayStr(new Date(Date.now() - 86400000));
    const next: Rewards = { ...rewards, points: rewards.points + gained, totalCorrect: rewards.totalCorrect + correct, totalSessions: rewards.totalSessions + 1 };
    if (rewards.lastDay === today) next.streak = Math.max(1, rewards.streak);
    else if (rewards.lastDay === yest) next.streak = rewards.streak + 1;
    else next.streak = 1;
    next.lastDay = today;

    /* --- progres level: skor 80+ membuka level berikutnya --- */
    let leveledUp = false;
    if (activeSubject) {
      const key = `${jenjang}|${activeSubject.id}`;
      const prev = levelStore[key] ?? { unlocked: 1, best: {} as Record<string, number> };
      const newBest: Record<string, number> = {
        ...prev.best,
        [String(sessionLevel)]: Math.max(prev.best[String(sessionLevel)] ?? 0, score),
      };
      let newUnlocked = prev.unlocked;
      if (score >= UNLOCK_SCORE && sessionLevel >= prev.unlocked && sessionLevel < 5) {
        newUnlocked = sessionLevel + 1;
        leveledUp = true;
        setUnlockedNow(sessionLevel + 1);
      }
      const updated: LevelStore = { ...levelStore, [key]: { unlocked: newUnlocked, best: newBest } };
      setLevelStore(updated);
      saveLevels(updated);
    }

    const has = new Set(next.badges);
    const fresh: string[] = [];
    const award = (id: string, cond: boolean) => { if (cond && !has.has(id)) { has.add(id); fresh.push(id); } };
    award("pertama", next.totalSessions >= 1);
    award("benar50", next.totalCorrect >= 50);
    award("benar200", next.totalCorrect >= 200);
    award("benar500", next.totalCorrect >= 500);
    award("sesi10", next.totalSessions >= 10);
    award("sesi30", next.totalSessions >= 30);
    award("skor80", score >= UNLOCK_SCORE);
    award("sempurna", score === 100);
    award("streak3", next.streak >= 3);
    award("streak7", next.streak >= 7);
    award("naiklevel", leveledUp || has.has("naiklevel"));
    next.badges = [...has];
    setRewards(next);
    saveRewards(next);
    setNewBadges(fresh);
    if ((fresh.length > 0 || leveledUp) && soundOn) sfxCelebrate();
  };

  const stats = history.data?.stats;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="sticky top-0 z-30 pt-safe" style={{ background: "var(--accent)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <button type="button" onClick={handleLogoClick} aria-label="Kembali ke Beranda" title="Kembali ke Beranda"
            className="flex cursor-pointer items-center gap-2 rounded-2xl text-left transition hover:opacity-90">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl" style={{ background: "var(--gold)" }} aria-hidden>🏆</span>
            <span className="leading-none">
              <span className="font-display block text-xl font-extrabold tracking-wide text-white">ZIQVA <span style={{ color: "var(--gold)" }}>OLIM</span></span>
              <span className="block text-[11px] font-semibold text-white/70">Latihan Olimpiade TK – SMA</span>
            </span>
          </button>
          <nav className="ml-auto flex flex-wrap gap-2" aria-label="Navigasi utama">
            <button type="button" onClick={() => setView("home")} aria-label="Ke beranda"
              className="min-h-[40px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: view === "home" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "home" ? "#2B2440" : "#fff" }}>Beranda</button>
            <button type="button" onClick={() => setView("belajar")} aria-label="Buka perpustakaan belajar"
              className="min-h-[40px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: view === "belajar" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "belajar" ? "#2B2440" : "#fff" }}>📚 Perpustakaan</button>
            <button type="button" onClick={() => setView("history")} aria-label="Lihat riwayat dan prestasiku"
              className="min-h-[40px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: view === "history" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "history" ? "#2B2440" : "#fff" }}>🏅 Prestasiku</button>
            <button type="button" onClick={() => setView(sessionUser ? "dashboard" : "login")} aria-label={sessionUser ? "Ke dashboard pantau guru dan orang tua" : "Masuk sebagai guru atau orang tua"}
              className="min-h-[40px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: view === "dashboard" || view === "login" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "dashboard" || view === "login" ? "#2B2440" : "#fff" }}>
              {sessionUser ? `👀 Pantau (${sessionUser.name.split(" ")[0]})` : "👨‍🏫 Guru & Ortu"}
            </button>
            <button type="button" onClick={toggleSound} aria-label={soundOn ? "Matikan semua suara (bacaan soal dan efek klik)" : "Nyalakan suara"} aria-pressed={soundOn}
              className="min-h-[40px] rounded-full px-3 font-display text-sm font-bold"
              style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>{soundOn ? "🔊 Suara ON" : "🔇 Suara OFF"}</button>
            <button type="button" onClick={handleTestSound} aria-label="Tes suara: putar nada tes dan kalimat percobaan, lalu tampilkan diagnosa suara"
              className="min-h-[40px] rounded-full px-3 font-display text-sm font-bold"
              style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>🔊 Tes Suara</button>
          </nav>
        </div>
      </header>

      {showTestPanel && (
        <div className="mx-auto w-full max-w-5xl px-4">
          <section className="pop-in mt-3 rounded-3xl p-4 shadow-sm sm:p-5" style={{ background: "var(--surface)", border: "2px solid var(--accent)" }} role="status" aria-label="Hasil diagnosa suara">
            <div className="flex items-start gap-2">
              <h2 className="font-display flex-1 text-base font-bold">🔍 Diagnosa Suara</h2>
              <button type="button" onClick={() => setShowTestPanel(false)} aria-label="Tutup diagnosa suara" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: "var(--surface2)" }}>✕</button>
            </div>
            <ul className="mt-1 list-none space-y-1 text-[13px] leading-relaxed font-semibold">
              {testLines.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
            <p className="mt-2 text-xs" style={{ color: "var(--dim)" }}>Bila nada tes dan kalimat tes tetap tidak terdengar, salin teks diagnosa di atas dan kirimkan ke kami — dari situ penyebab pastinya terlihat.</p>
          </section>
        </div>
      )}

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
          levelLabel={`Level ${sessionLevel} · ${LEVELS[sessionLevel - 1]?.name ?? ""}`}
          soundOn={soundOn} onToggleSound={toggleSound}
          questions={questions} onFinish={handleFinish} onQuit={() => setView("home")} quitSignal={quitSignal}
          onInfo={(q) => openModuleForQuestion(q, "Kembali ke Soal")} />
      )}

      {view === "belajar" && (
        <BelajarView jenjang={jenjang} initialSubject={activeSubject?.id ?? subjects[0]?.id ?? "matematika"}
          onPractice={(sid) => { setSubjectId(sid); setView("home"); window.scrollTo({ top: 0 }); }}
          onOpenModule={openModuleFromLibrary} />
      )}

      {view === "home" && (
        <main className="mx-auto w-full max-w-5xl px-4 pb-10">
          {resetDoneMsg && (
            <section className="pop-in mt-4 flex items-start gap-3 rounded-3xl p-5 shadow-sm" style={{ background: "#E2F4E9", border: "2px solid #1E7A46" }} role="status" aria-label="Reset berhasil">
              <span className="text-3xl" aria-hidden>🎉</span>
              <p className="flex-1 text-[15px] leading-relaxed font-semibold">{resetDoneMsg}</p>
              <button type="button" onClick={() => setResetDoneMsg("")} aria-label="Tutup pesan reset berhasil" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: "#fff" }}>✕</button>
            </section>
          )}
          {showWelcome && (
            <section className="pop-in relative mt-4 overflow-hidden rounded-3xl p-5 text-center shadow-sm sm:p-6" style={{ background: "linear-gradient(150deg,#FFF3DC,#FDE7F3)", border: "2px solid var(--gold)" }} aria-label="Sambutan selamat datang">
              <button type="button" onClick={() => setShowWelcome(false)} aria-label="Tutup sambutan" className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: "rgba(255,255,255,.7)", color: "#92600A" }}>✕</button>
              <div className="flex items-end justify-center gap-2 text-4xl sm:text-5xl" aria-hidden>
                <span className="sparkle inline-block">⭐</span>
                <span className="floaty inline-block text-6xl sm:text-7xl">🏆</span>
                <span className="sparkle inline-block" style={{ animationDelay: ".6s" }}>✨</span>
                <span className="wiggle inline-block">🎉</span>
                <span className="sparkle inline-block" style={{ animationDelay: "1.1s" }}>⭐</span>
              </div>
              <h2 className="fade-up font-display mt-2 text-2xl font-extrabold sm:text-3xl" style={{ animationDelay: ".1s" }}>Selamat Datang, Pejuang Olimpiade! 🎓</h2>
              <p className="fade-up mx-auto mt-2 max-w-xl text-[15px] leading-relaxed font-semibold" style={{ animationDelay: ".3s", color: "#7A5B12" }}>
                Di ZIQVA OLIM kamu bisa membaca <strong>bahan belajar dari dasar</strong>, lalu menantang <strong>{SESSION_SIZE} soal acak yang selalu baru</strong> di setiap sesi —
                dari Level 1 Pemula sampai Level 5 Ahli Olimpiade. Setiap jawaban benar mengumpulkan ⭐ bintang, 🪙 poin, dan lencana. Jaga api streak-mu tetap menyala! 🔥
              </p>
              <div className="fade-up mt-4 flex flex-wrap justify-center gap-2" style={{ animationDelay: ".5s" }}>
                <button type="button" onClick={() => setShowWelcome(false)} className="font-display min-h-[48px] rounded-full px-5 font-bold text-white" style={{ background: "var(--accent)" }}>🚀 Ayo Mulai!</button>
                <button type="button" onClick={() => { setShowWelcome(false); setView("belajar"); }} className="font-display min-h-[48px] rounded-full px-5 font-bold" style={{ background: "#fff", border: "2px solid var(--gold)", color: "#92600A" }}>📚 Jelajahi Perpustakaan</button>
                <button type="button" onClick={() => {
                    if (!soundOn) { setWelcomeMsg("Suara sedang OFF — nyalakan tombol 🔊 Suara ON di bagian atas halaman dulu, ya."); return; }
                    setWelcomeMsg("");
                    speakText("Selamat datang di ZIQVA OLIM! Ayo belajar dari dasar, kumpulkan bintang dan lencana, dan taklukkan soal olimpiade dari Level 1 sampai Level 5. Semangat, Pejuang Olimpiade!", "id-ID", { setSpeaking: setWelcomeSpeaking, onStatus: setWelcomeMsg });
                  }} aria-label="Dengarkan sambutan dengan suara"
                  className={`font-display min-h-[48px] rounded-full px-5 font-bold text-white ${welcomeSpeaking ? "speaking" : ""}`} style={{ background: "#E84393" }}>
                  {welcomeSpeaking ? "🔊 Sedang menyapa…" : "🔊 Dengarkan Sambutan"}
                </button>
              </div>
              {welcomeMsg && <p className="mt-2 text-xs font-bold" style={{ color: "#92600A" }} role="status">{welcomeMsg}</p>}
            </section>
          )}
          <section className="mt-4 overflow-hidden rounded-3xl shadow-sm" style={{ border: "1px solid var(--border)" }}>
            <img src={heroImg} alt="Ilustrasi anak-anak Indonesia dari TK sampai SMA merayakan kemenangan olimpiade dengan piala dan medali" className="h-44 w-full object-cover object-top sm:h-64" />
            <div className="p-5 sm:p-6" style={{ background: "var(--surface)" }}>
              <h1 className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">Latihan Olimpiade Interaktif — dari TK/PAUD sampai SMA/SMK/MA 🏅</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--dim)" }}>
                Platform latihan olimpiade interaktif untuk semua jenjang, dari TK/PAUD hingga SMA/SMK/MA: <strong>{SESSION_SIZE} soal pilihan ganda dalam {SESSION_SIZE} menit</strong> dengan
                audio soal lewat tombol <strong>“Dengarkan Soal”</strong>, penghitung waktu, indikator progres, dan skor akhir — untuk Matematika, Bahasa Inggris, IPA/Sains, Sejarah,
                Bahasa Jawa, Bahasa Arab, PAI, Akidah Akhlak, Fikih, Qur'an Hadis, SKI, Agama Kristen, hingga kelas Cambridge, ditambah Bahasa Korea, Bahasa Jepang, dan Bahasa Mandarin.
                Setiap sesi berisi <strong>{SESSION_SIZE} soal acak yang selalu baru</strong> (dicoba seratus kali pun tetap fresh),
                berjenjang dari <strong>Level 1 Pemula sampai Level 5 Ahli Olimpiade</strong> — skor {UNLOCK_SCORE}+ membuka level berikutnya!
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>📚 Total {TOTAL_AUTHORED} soal inti tertulis</span>
                <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>🎲 298.000+ variasi soal acak dari generator</span>
                <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>🗂️ {SUBJECTS.length} mapel • 4 jenjang • 5 level</span>
              </div>
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

          {/* Rewards strip */}
          <section className="mt-5 flex flex-wrap items-center gap-2 rounded-3xl p-4 shadow-sm" style={{ background: "var(--surface)", border: "2px solid var(--gold)" }} aria-label="Hadiah dan pencapaian saya">
            <span className="font-display text-base font-extrabold">🎁 Hadiahku:</span>
            <span className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: "var(--surface2)" }}>⭐ {rewards.totalCorrect} Bintang</span>
            <span className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: "var(--surface2)" }}>🪙 {rewards.points} Poin</span>
            <span className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: "var(--surface2)" }}>🔥 {rewards.streak} hari streak</span>
            <span className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: "var(--surface2)" }}>🏅 {rewards.badges.length}/{BADGES.length} lencana</span>
            <button type="button" onClick={() => setView("history")} className="rounded-full px-3 py-1.5 text-sm font-bold text-white" style={{ background: "var(--accent)" }}>Lihat Lencana →</button>
            {rewards.totalSessions === 0 && <p className="w-full text-sm font-semibold" style={{ color: "var(--dim)" }}>Selesaikan sesi pertamamu untuk membuka lencana 🎯 <strong>Langkah Pertama</strong> — setiap jawaban benar bernilai 10 poin + 1 bintang!</p>}
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
                const active = activeSubject?.id === s.id;
                const un = levelStore[`${jenjang}|${s.id}`]?.unlocked ?? 1;
                return (
                  <button key={s.id} type="button" onClick={() => setSubjectId(s.id)} aria-pressed={active} aria-label={`Mapel ${s.name}, ${SESSION_SIZE} soal acak per sesi, level terbuka sampai ${un}`}
                    className="rounded-2xl p-3.5 text-left transition"
                    style={{ background: active ? s.bg : "var(--surface)", border: `2px solid ${active ? s.color : "var(--border)"}` }}>
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 font-display text-xs font-extrabold text-white" style={{ background: s.color }}>{s.short}</span>
                    <div className="mt-2 font-display text-[15px] leading-tight font-bold">{s.name}</div>
                    <div className="mt-0.5 text-xs font-semibold" style={{ color: "var(--dim)" }}>{SESSION_SIZE} soal acak • Level 1–{un} terbuka</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Level kesulitan */}
          <section className="mt-5">
            <h2 className="font-display text-lg font-bold">🎚️ 4 · Pilih Level Kesulitan</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
              Setiap mapel punya 5 level. Raih skor <strong>{UNLOCK_SCORE}+</strong> untuk membuka level berikutnya — untuk {activeSubject?.name ?? "mapel ini"} kamu sudah membuka sampai <strong>Level {unlockedLevel}</strong>.
              {mode === "ujian" ? " Di Mode Ujian, level terkunci belum bisa dipilih; di Mode Latihan semua level bebas dicoba." : " Kamu sedang di Mode Latihan: semua level bebas dicoba."}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {LEVELS.map((lv) => {
                const locked = mode === "ujian" && lv.n > unlockedLevel;
                const isSel = level === lv.n;
                const best = levelStore[comboKey]?.best?.[String(lv.n)];
                return (
                  <button key={lv.n} type="button" disabled={locked} onClick={() => setLevel(lv.n)} aria-pressed={isSel}
                    aria-label={`Level ${lv.n} ${lv.name}${locked ? `, terkunci. Raih skor ${UNLOCK_SCORE} di level ${lv.n - 1} untuk membuka.` : ""}`}
                    className="rounded-2xl p-3.5 text-left transition disabled:opacity-50"
                    style={{ background: isSel ? "var(--accent)" : "var(--surface)", color: isSel ? "#fff" : "var(--text)", border: "2px solid var(--border)" }}>
                    <div className="font-display text-base font-extrabold">{locked ? "🔒" : "⭐"} Level {lv.n}</div>
                    <div className="font-display text-sm font-bold">{lv.name}</div>
                    <div className="mt-0.5 text-xs leading-snug" style={{ color: isSel ? "rgba(255,255,255,.8)" : "var(--dim)" }}>
                      {locked ? `Skor ${UNLOCK_SCORE}+ di Level ${lv.n - 1} untuk membuka` : best !== undefined ? `Skor terbaikmu: ${best}` : "Belum pernah dicoba"}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm leading-relaxed font-semibold" style={{ color: "var(--accent)" }}>
              Level {level} · {LEVELS[level - 1]?.name}: {LEVELS[level - 1]?.desc}
              {bestThisLevel !== undefined && <> Skor terbaikmu di level ini: <strong>{bestThisLevel}</strong>.</>}
            </p>
          </section>

          {/* Mode + start */}
          <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-display text-lg font-bold">🚀 5 · Pilih Mode &amp; Mulai</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode("ujian")} aria-pressed={mode === "ujian"} aria-label="Mode ujian seperti olimpiade asli"
                className="rounded-2xl p-4 text-left" style={{ background: mode === "ujian" ? "#1E2A78" : "var(--surface2)", color: mode === "ujian" ? "#fff" : "var(--text)", border: "2px solid var(--border)" }}>
                <div className="font-display font-bold">🏆 Mode Ujian</div>
                <div className="mt-0.5 text-xs leading-snug" style={{ color: mode === "ujian" ? "rgba(255,255,255,.75)" : "var(--dim)" }}>Format ujian resmi: timer berjalan, jawaban terkunci, skor &amp; review di akhir.</div>
              </button>
              <button type="button" onClick={() => setMode("latihan")} aria-pressed={mode === "latihan"} aria-label="Mode latihan dengan pembahasan langsung"
                className="rounded-2xl p-4 text-left" style={{ background: mode === "latihan" ? "#1E7A46" : "var(--surface2)", color: mode === "latihan" ? "#fff" : "var(--text)", border: "2px solid var(--border)" }}>
                <div className="font-display font-bold">✏️ Mode Latihan</div>
                <div className="mt-0.5 text-xs leading-snug" style={{ color: mode === "latihan" ? "rgba(255,255,255,.8)" : "var(--dim)" }}>Setiap jawaban langsung dicek + ada pembahasan. Cocok untuk belajar.</div>
              </button>
            </div>
            <button type="button" onClick={startQuiz} disabled={!activeSubject} aria-label={`Mulai latihan ${activeSubject?.name ?? ""} jenjang ${jenjang} level ${level}`}
              className="font-display mt-4 min-h-[60px] w-full rounded-2xl text-xl font-extrabold text-white shadow disabled:opacity-40" style={{ background: "var(--gold)", color: "#2B2440" }}>
              🚀 Mulai — {activeSubject?.name} • {jenjang} • Level {level} ({SESSION_SIZE} soal acak)
            </button>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--dim)" }}>⏱ Waktu: 1 menit per soal ({SESSION_SIZE} soal = {SESSION_SIZE} menit) • 🔊 Gunakan tombol “Dengarkan Soal” untuk mendengar soal dibacakan • 📚 Belum paham materinya? Buka menu <strong>Perpustakaan</strong> di atas, atau ketuk ikon <strong>i</strong> pada soal saat Mode Latihan</p>
          </section>

          {/* Format standar olimpiade */}
          <section className="mt-5 rounded-3xl p-5" style={{ background: "var(--surface2)", border: "1px dashed var(--border)" }}>
            <h2 className="font-display text-base font-bold">🏅 Format Standar Olimpiade di ZIQVA OLIM</h2>
            <ul className="mt-2 grid gap-1.5 text-sm leading-relaxed sm:grid-cols-2" style={{ color: "var(--dim)" }}>
              <li>✅ 20 soal pilihan ganda dengan batas waktu &amp; indikator progres (0/20)</li>
              <li>✅ Setiap soal punya audio listening yang bisa diputar ulang</li>
              <li>✅ Tipe soal TK: angka terkecil, menyusun huruf jadi kata, melengkapi kata, angka di antara, urutan kegiatan harian</li>
              <li>✅ Di akhir muncul skor besar (misalnya skor 60 berarti 12 dari 20 soal benar), pesan penyemangat, dan pembahasan tiap soal</li>
            </ul>
            <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>Soal disusun bertingkat sesuai kurikulum: makin menantang dari TK → SD → SMP → SMA, untuk sekolah umum, madrasah, sekolah Kristen, dan Cambridge.</p>
          </section>

          {/* Reset semua — untuk orang tua / guru yang baru coba-coba */}
          <section className="mt-5 flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:flex-row sm:items-center" style={{ background: "var(--surface)", border: "2px dashed #D6336C" }} aria-label="Reset semua data coba-coba">
            <div className="text-4xl" aria-hidden>🔄</div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">Baru coba-coba &amp; sudah cocok?</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                Tekan <strong>Reset Semua</strong> untuk menghapus seluruh data percobaan di perangkat ini — riwayat skor, poin, lencana, progres level, dan daftar pantau — lalu mulai bersih untuk anak dengan data aslinya.
              </p>
            </div>
            <button type="button" onClick={() => { setResetText(""); setResetError(""); setShowReset(true); }} aria-label="Buka konfirmasi reset semua data"
              className="font-display min-h-[52px] shrink-0 rounded-2xl px-6 font-bold text-white" style={{ background: "#D6336C" }}>
              🗑️ Reset Semua
            </button>
          </section>
        </main>
      )}

      {view === "result" && lastResult && activeSubject && (
        <main className="mx-auto w-full max-w-3xl px-4 pb-10">
          <section className="pop-in mt-4 rounded-3xl p-6 text-center shadow-sm" style={{ background: "linear-gradient(160deg,#FFF7E0,#FFEFC4)", border: "2px solid var(--gold)", color: "#2B2440" }}>
            <p className="text-sm font-bold tracking-wide" style={{ color: "#92600A" }}>HASIL {mode === "ujian" ? "UJIAN" : "LATIHAN"} • {activeSubject.name.toUpperCase()} • {jenjang} • LEVEL {sessionLevel} {LEVELS[sessionLevel - 1]?.name.toUpperCase()}</p>
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

          {/* Rewards yang baru didapat */}
          <section className="pop-in mt-4 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "2px solid var(--gold)" }} aria-label="Hadiah yang kamu dapatkan">
            <h2 className="font-display text-lg font-extrabold">🎁 Hadiah Sesi Ini</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>🪙 +{earnedPoints} Poin</span>
              <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>⭐ +{lastResult.correct} Bintang</span>
              <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>🔥 Streak {rewards.streak} hari</span>
              <span className="rounded-full px-3 py-1.5" style={{ background: "var(--surface2)" }}>🪙 Total {rewards.points} Poin • ⭐ {rewards.totalCorrect} Bintang</span>
            </div>
            {unlockedNow !== null && (
              <p className="pop-in mt-3 rounded-2xl px-4 py-3 font-display text-base font-extrabold" style={{ background: "#E2F4E9", border: "1px solid #1E7A46" }}>
                🚀 HEBAT! Skor {lastResult.score} membuka <strong>Level {unlockedNow} · {LEVELS[unlockedNow - 1]?.name}</strong> untuk {activeSubject.name}! Berani coba soal yang lebih menantang?
              </p>
            )}
            {unlockedNow === null && sessionLevel < 5 && lastResult.score < UNLOCK_SCORE && (
              <p className="mt-3 text-sm font-semibold" style={{ color: "var(--dim)" }}>
                Sedikit lagi! Raih skor <strong>{UNLOCK_SCORE}+</strong> di Level {sessionLevel} untuk membuka Level {sessionLevel + 1} · {LEVELS[sessionLevel]?.name}. Baca pembahasan di bawah, lalu coba lagi — soal berikutnya selalu baru! ✨
              </p>
            )}
            {newBadges.length > 0 && (
              <div className="mt-3 grid gap-2">
                {newBadges.map((id) => {
                  const b = BADGES.find((x) => x.id === id);
                  if (!b) return null;
                  return (
                    <p key={id} className="pop-in flex items-center gap-3 rounded-2xl px-4 py-3 font-bold" style={{ background: "#FFF3DC", border: "1px solid var(--gold)" }}>
                      <span className="text-3xl" aria-hidden>{b.icon}</span>
                      <span>Lencana baru terbuka: <strong>{b.name}</strong> — {b.desc}</span>
                    </p>
                  );
                })}
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
                <article key={i} className="relative rounded-2xl p-4" style={{ background: "var(--surface)", border: `2px solid ${right ? "#1E7A46" : "#D6336C"}` }}>
                  <InfoIcon onClick={() => openModuleForQuestion(q, "Kembali ke Review & Pembahasan")} />
                  <p className="pr-8 font-bold whitespace-pre-line"><span style={{ color: right ? "#1E7A46" : "#D6336C" }}>{right ? "✓" : "✕"} Soal {i + 1}.</span> {q.emoji ? `${q.emoji} ` : ""}{q.q}</p>
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

          {/* Rewards & lencana */}
          <section className="mt-4 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} aria-label="Poin, bintang, streak, dan lencana saya">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Poin", value: `${rewards.points}`, icon: "🪙" },
                { label: "Bintang (jawaban benar)", value: `${rewards.totalCorrect}`, icon: "⭐" },
                { label: "Streak Latihan", value: `${rewards.streak} hari`, icon: "🔥" },
                { label: "Lencana Terbuka", value: `${rewards.badges.length}/${BADGES.length}`, icon: "🏅" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-3 text-center" style={{ background: "var(--surface2)" }}>
                  <div className="text-2xl" aria-hidden>{c.icon}</div>
                  <div className="font-display text-xl font-extrabold">{c.value}</div>
                  <div className="text-[11px] font-semibold" style={{ color: "var(--dim)" }}>{c.label}</div>
                </div>
              ))}
            </div>
            <h2 className="font-display mt-4 text-base font-bold">🎖️ Koleksi Lencana</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {BADGES.map((b) => {
                const owned = rewards.badges.includes(b.id);
                return (
                  <div key={b.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: owned ? "#FFF3DC" : "var(--surface2)", border: `1px solid ${owned ? "var(--gold)" : "var(--border)"}`, opacity: owned ? 1 : 0.65 }}>
                    <span className="text-3xl" aria-hidden style={owned ? undefined : { filter: "grayscale(1)" }}>{b.icon}</span>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold">{b.name} {owned ? "✅" : "🔒"}</div>
                      <div className="text-xs leading-snug" style={{ color: "var(--dim)" }}>{b.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <h2 className="font-display mt-4 text-base font-bold">🎚️ Progres Level per Mapel ({jenjang})</h2>
            <div className="mt-2 grid gap-1.5">
              {subjects.map((s) => {
                const st = levelStore[`${jenjang}|${s.id}`];
                const un = st?.unlocked ?? 1;
                return (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="w-36 shrink-0 truncate font-display font-bold">{s.name}</span>
                    <div className="flex gap-1" aria-label={`${s.name}: level terbuka sampai ${un} dari 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-extrabold" style={{ background: n <= un ? "var(--gold)" : "var(--surface2)", color: n <= un ? "#2B2440" : "var(--dim)", border: "1px solid var(--border)" }}>{n}</span>
                      ))}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "var(--dim)" }}>{un >= 5 ? "Semua level terbuka! 👑" : `Skor ${UNLOCK_SCORE}+ di Level ${un} membuka Level ${un + 1}`}</span>
                  </div>
                );
              })}
            </div>
          </section>
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

          {/* Zona Reset — hapus semua data coba-coba */}
          <section className="mt-6 rounded-3xl p-5" style={{ background: "#FFF5F7", border: "2px dashed #D6336C" }} aria-label="Zona reset semua data">
            <h2 className="font-display text-lg font-extrabold" style={{ color: "#A4133C" }}>🔄 Zona Reset — Mulai dari Nol Lagi</h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
              Untuk Bapak/Ibu yang tadi <strong>baru coba-coba dulu</strong> dan sekarang sudah cocok: tombol ini menghapus <strong>SEMUA</strong> data percobaan di perangkat ini sekaligus —
              riwayat Prestasiku, poin &amp; bintang, streak, semua lencana, progres level (kembali ke Level 1), riwayat soal yang sudah keluar, nama peserta, dan daftar pantau Guru/Ortu (kamu juga akan keluar dari akun pantau di perangkat ini).
              Setelah reset, tampilannya seperti baru pertama kali dibuka.
            </p>
            <p className="mt-2 text-sm leading-relaxed font-bold" style={{ color: "#A4133C" }}>⚠️ Data yang sudah direset tidak bisa dikembalikan. Akun Guru/Ortu tetap ada dan bisa dipakai masuk lagi — hanya daftar pantau &amp; riwayat coba-cobanya yang dikosongkan.</p>
            <button type="button" onClick={() => { setResetText(""); setResetError(""); setShowReset(true); }} aria-label="Buka konfirmasi reset semua data"
              className="font-display mt-4 min-h-[56px] w-full rounded-2xl text-lg font-extrabold text-white" style={{ background: "#D6336C" }}>
              🗑️ Reset Semua Data
            </button>
          </section>
        </main>
      )}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Konfirmasi reset semua data">
          <div className="pop-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-6" style={{ background: "var(--surface)" }}>
            <div className="text-center text-5xl" aria-hidden>🗑️</div>
            <h2 className="font-display mt-2 text-center text-xl font-extrabold">Reset Semua Data?</h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
              Semua data coba-coba di <strong>perangkat ini</strong> akan dihapus permanen:
            </p>
            <ul className="mt-2 grid gap-1 text-sm leading-relaxed font-semibold">
              <li>• 📜 Riwayat latihan &amp; skor di Prestasiku{stats && stats.total_attempts > 0 ? ` (${stats.total_attempts}× latihan)` : ""}</li>
              <li>• 🪙 Poin ({rewards.points}), ⭐ bintang ({rewards.totalCorrect}), 🔥 streak ({rewards.streak} hari) &amp; {rewards.badges.length} lencana</li>
              <li>• 🎚️ Progres level semua mapel — kembali ke Level 1</li>
              <li>• 🎲 Riwayat soal yang sudah pernah keluar (soal jadi fresh lagi)</li>
              <li>• 👤 Nama peserta yang terisi &amp; pengaturan suara</li>
              {sessionUser && <li>• 👀 Daftar pantau {sessionUser.name} dikosongkan &amp; kamu keluar dari akun pantau di perangkat ini</li>}
            </ul>
            <p className="mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed font-bold" style={{ background: "#FBF0DA", color: "#92600A" }}>
              Yang TIDAK ikut terhapus: bank soal, Perpustakaan Belajar, dan akun Guru/Ortu (tetap bisa dipakai masuk lagi). Reset ini hanya membersihkan perangkat ini — perangkat lain tidak terpengaruh.
            </p>
            <div className="mt-4">
              <label htmlFor="reset-confirm" className="font-display text-sm font-bold">Ketik <span style={{ color: "#D6336C" }}>RESET</span> untuk memastikan</label>
              <input id="reset-confirm" value={resetText} onChange={(e) => setResetText(e.target.value.toUpperCase())} placeholder="Ketik RESET di sini" maxLength={10} autoComplete="off"
                className="font-display mt-1.5 min-h-[52px] w-full rounded-2xl px-4 text-center text-lg font-extrabold tracking-[0.25em] uppercase outline-none" style={{ background: "var(--surface2)", border: "2px solid var(--border)" }} />
            </div>
            {resetError && <p className="mt-2 text-sm font-bold text-red-500" role="alert">{resetError}</p>}
            <div className="mt-5 grid gap-2">
              <button type="button" disabled={resetText.trim().toUpperCase() !== "RESET" || resetAll.isPending} onClick={() => void doResetAll()}
                aria-label="Ya, reset semua data sekarang"
                className="font-display min-h-[56px] rounded-2xl text-lg font-extrabold text-white disabled:opacity-40" style={{ background: "#D6336C" }}>
                {resetAll.isPending ? "Sedang mereset…" : "Ya, Reset Semua Sekarang 🗑️"}
              </button>
              <button type="button" onClick={() => { setShowReset(false); setResetText(""); setResetError(""); }} aria-label="Batalkan reset"
                className="font-display min-h-[52px] rounded-2xl font-bold" style={{ background: "var(--surface2)" }}>
                Batal, Jangan Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {moduleCtx && (
        <ModuleView module={moduleCtx.module} jenjang={moduleCtx.jenjang} subjectName={moduleCtx.subjectName}
          question={moduleCtx.question} backLabel={moduleCtx.backLabel}
          onBack={() => setModuleCtx(null)}
          onPractice={moduleCtx.fromLibrary ? () => { const sid = moduleCtx.subjectId; setModuleCtx(null); setSubjectId(sid); setView("home"); window.scrollTo({ top: 0 }); } : undefined} />
      )}

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs" style={{ color: "var(--dim)" }}>
        ZIQVA OLIM — Latihan Olimpiade TK/PAUD, SD/MI, SMP/MTs, SMA/SMK/MA, Sekolah Kristen &amp; Cambridge. Berlatih setiap hari, raih medali emasmu! 🏆
      </footer>
    </div>
  );
}

// keep SUBJECTS referenced for tree-shaking clarity in some bundlers
void SUBJECTS;

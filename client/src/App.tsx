import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import {
BANK, JENJANG, LEVELS, SCHOOL_TYPES, SUBJECTS, SESSION_SIZE, UNLOCK_SCORE, buildSession, medalFor, motivationFor, subjectsFor,
type JenjangId, type Question, type SchoolType,
} from "./data/questions";

/** Total soal inti tertulis di bank soal (di luar variasi acak generator). */
const TOTAL_AUTHORED = Object.values(BANK).reduce(
  (sum, bySubject) => sum + Object.values(bySubject ?? {}).reduce((a, qs) => a + (qs?.length ?? 0), 0),
  0,
);
import { shuffle, shuffleOptions } from "./data/generators";
import { materialFor } from "./data/materials";
import { modulesFor, moduleForQuestion, type LibraryModule } from "./data/library";
import heroImg from "./assets/media-generation-hero-kids-olympiad-0-8efd557a-635d-47a5-88c3-3e408d6372e3.webp";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";

const FIELDS = actionFields<typeof Actions>();

type View = "home" | "quiz" | "result" | "history" | "login" | "dashboard" | "belajar" | "ranking" | "challenge" | "joinClass" | "classResult" | "admin" | "profile";
type Mode = "ujian" | "latihan";
type Role = "guru" | "orangtua" | "admin";
type SessionUser = {
  id: number; name: string; username: string; role: string; organization: string;
  whatsapp: string; email: string; child_name: string; city: string; school_address: string;
};

/** Label peran yang tampil di area profil & menu akun. */
function roleLabel(role: string) {
  return role === "admin" ? "Superadmin" : role === "guru" ? "Guru" : "Orang Tua";
}
/** Inisial untuk lingkaran avatar profil (maks. 2 huruf dari nama). */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const ini = parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}

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
function fmtNum(n: number) {
  return n.toLocaleString("id-ID");
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

export function langForSubject(subjectId: string, english = false): string {
  // Mode Cambridge: SEMUA soal dibacakan dengan suara Bahasa Inggris.
  if (english) return "en-US";
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
/* Generasi bicara: setiap speakText() baru dan setiap stopSpeaking()
   menaikkannya. speakChunk/doSpeak yang tertunda memeriksa generasi ini —
   bila sudah berubah, bacaan lama TIDAK jadi dimulai/dilanjutkan. Ini
   memastikan menekan "Berikutnya" menghentikan suara secara total, termasuk
   utterance yang masih menunggu jeda sesudah cancel(). */
let speechGeneration = 0;
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
  /** Paksa rate ini untuk SEMUA potongan (dipakai Dengarkan Soal: 1,1 rata
      untuk semua bahasa, termasuk potongan Inggris yang dulu diperlambat).
      Bila tidak diisi, berlaku rate per bahasa (rateForLang) + perlambatan
      potongan `slow` — jalur sambutan Beranda & Tes Suara, tidak berubah. */
  rate?: number;
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

/* ---------- Pembacaan soal SADAR BAHASA per potongan ----------
   Soal Bahasa Inggris di sekolah non-Cambridge itu CAMPURAN: pengantarnya
   Bahasa Indonesia, kata target & pilihan jawabannya Bahasa Inggris.
   Dibacakan satu suara, kata Inggrisnya jadi berlafal Indonesia (atau
   sebaliknya) dan terdengar janggal. Karena itu teks soal dipecah menjadi
   potongan-potongan bahasa (SpeechSegment) dan tiap potongan diucapkan
   dengan voice bahasanya sendiri, dengan jeda singkat di titik ganti
   bahasa dan lafal sedikit lebih lambat untuk kata target Inggris.
   Teks yang TAMPIL di layar tidak berubah sama sekali — pemecahan ini
   hanya untuk teks yang dikirim ke speech synthesis. */
export interface SpeechSegment { text: string; lang: string; slow?: boolean }

/* Kamus petunjuk bahasa: kata-kata fungsi & kata yang sangat khas salah
   satu bahasa, dipakai menebak bahasa sepotong teks pendek (terutama isi
   tanda kutip dan batang soal yang seluruhnya berbahasa Inggris). */
const EN_HINT = new Set(("the of is are was were has have had in on at to a an and or but if as by for from with without what which who whom whose when where why how she he they it we you this that these those there here do does did be been being am will would can could should choose correct word words sentence sentences letter letters number numbers means mean meaning opposite antonym synonym plural singular past present tense form verb verbs noun nouns adjective adverb english indonesian look read how many much smallest biggest largest first last every yesterday today tomorrow goes go going went come comes say says said cat dog bird fish black white red blue green book school student students teacher class house family mother father water apple banana animal animals body head hand eye ear nose mouth one two three four five six seven eight nine ten hardware software keyboard mouse monitor printer internet online website email file program download upload server digital computer laptop smartphone network system information energy power photosynthesis cell").split(/\s+/));
const ID_HINT = new Set(("yang dari adalah kata katanya dengan untuk dalam pada ini itu tidak bukan atau dan di ke berapa manakah berikut pilihlah pilih kalimat huruf suku terdiri pertama terakhir tunggal jamak lawan berlawanan semakna persamaan arti artinya bahasa inggris indonesia bentuk baku majas tanda baca ejaan termasuk merupakan disebut dinamakan terjadi jumlah selisih hasil bilangan angka tentukan nilai zat unsur larutan asam basa organ tubuh hewan tumbuhan daun akar batang bunga tanah air udara matahari bumi bulan bintang planet musim hujan ibu ayah anak guru murid sekolah rumah pasar sungai gunung laut desa kota provinsi negara pulau sila lambang dasar hukum hak kewajiban warga tuhan allah nabi kitab surah ayat salat puasa zakat haji wudu masjid gereja doa ibadah malaikat").split(/\s+/));

/** Tebak bahasa sepotong teks dari kata-kata petunjuknya: "en", "id",
    atau null bila tidak ada sinyal yang cukup kuat. */
function guessLang(text: string): "en" | "id" | null {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  let en = 0, id = 0;
  for (const w of words) {
    if (EN_HINT.has(w)) en += 1;
    if (ID_HINT.has(w)) id += 1;
  }
  if (en > id && en >= 1) return "en";
  if (id > en && id >= 1) return "id";
  return null;
}

/** Pecah teks pada tanda kutip (“…” atau "…"): potongan di dalam kutip
    ditandai quoted, sisanya tidak. Tanda kutipnya sendiri dibuang dari
    teks yang akan dibacakan. */
function splitByQuotes(text: string): { text: string; quoted: boolean }[] {
  const parts: { text: string; quoted: boolean }[] = [];
  const re = /“[^”]*”|"[^"]*"/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), quoted: false });
    parts.push({ text: m[0].slice(1, -1), quoted: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), quoted: false });
  return parts.length ? parts : [{ text, quoted: false }];
}

/**
 * Susun potongan-potongan bacaan untuk satu soal. STRUKTUR SELALU SAMA di
 * semua mapel/jenjang/jenis sekolah/mode, supaya bacaan tidak pernah
 * berhenti di tengah: (1) stimulus (bila ada) + batang soal, (2) potongan
 * "Pilihan:"/"Choices:" SENDIRI, (3) SETIAP pilihan jawaban sebagai
 * potongan SENDIRI berawalan hurufnya ("A. …", "B. …", …) — pilihan tidak
 * pernah digabung menjadi satu blob dengan batang soal, jadi rantai
 * bacaan punya tautan terpisah untuk tiap pilihan sampai pilihan
 * terakhir selesai dibacakan.
 * Bahasa tiap potongan mengikuti segmentasi sadar bahasa:
 * - Cambridge (english): semua potongan full Bahasa Inggris.
 * - Mapel bahasa asing lain (Arab/Korea/Jepang/Mandarin/Jawa): semua
 *   potongan bahasa mapelnya.
 * - Mapel Bahasa Inggris non-Cambridge: pengantar Indonesia → id-ID; kata/
 *   frasa Inggris (di dalam kutip maupun batang soal berbahasa Inggris)
 *   → en-US; pilihan jawaban berbahasa Inggris → en-US (awalan "Pilihan:"
 *   tetap Indonesia). Arah soal menentukan bahasa pilihan: "Bahasa
 *   Inggris dari …" → pilihan Inggris; "… artinya …" → pilihan Indonesia.
 * - Mapel lain: batang soal Indonesia, kecuali potongan dalam tanda kutip
 *   yang jelas berbahasa Inggris (istilah) → en-US.
 */
function buildQuestionSpeech(question: string, options: string[], subjectId: string, english: boolean, stimulus?: string): SpeechSegment[] {
  const letter = (i: number) => LETTERS[i] ?? `${i + 1}`;
  const stim = (stimulus ?? "").replace(/\s+/g, " ").trim();
  const stemText = stim ? (/[.!?…]$/.test(stim) ? `${stim} ${question}` : `${stim}. ${question}`) : question;
  /** Tiap pilihan = satu potongan sendiri berawalan hurufnya. */
  const optionSegs = (lang: string, slow = false): SpeechSegment[] =>
    options.map((opt, i) => {
      const t = opt.replace(/\s+/g, " ").trim();
      return { text: `${letter(i)}. ${/[.!?…]$/.test(t) ? t : `${t}.`}`, lang, slow };
    });
  if (english) {
    return [{ text: stemText, lang: "en-US" }, { text: "Choices:", lang: "en-US" }, ...optionSegs("en-US")];
  }
  const isEnglishSubject = subjectId.includes("inggris") || subjectId.startsWith("cambridge-eng");
  const base = langForSubject(subjectId);
  if (!isEnglishSubject && base !== "id-ID") {
    return [{ text: stemText, lang: base }, { text: "Pilihan:", lang: base }, ...optionSegs(base)];
  }
  const lower = question.toLowerCase();
  const parts = splitByQuotes(stemText);
  // Bahasa pilihan jawaban mengikuti arah soal.
  let answerEnglish: boolean;
  if (/bahasa inggris dari/.test(lower)) answerEnglish = true;
  else if (/\bartinya\b/.test(lower) || /\barti kata\b/.test(lower) || /\barti dari\b/.test(lower)) answerEnglish = false;
  else {
    const frameGuess = guessLang(parts.filter((p) => !p.quoted).map((p) => p.text).join(" "));
    answerEnglish = frameGuess === "en" ? true : isEnglishSubject;
  }
  const segs: SpeechSegment[] = [];
  const push = (text: string, lang: string, slow = false) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t) return;
    const lastSeg = segs[segs.length - 1];
    if (lastSeg && lastSeg.lang === lang && !!lastSeg.slow === slow) lastSeg.text += ` ${t}`;
    else segs.push({ text: t, lang, slow });
  };
  parts.forEach((part, i) => {
    if (!part.quoted) {
      // Batang soal: Bahasa Inggris utuh (mis. "The opposite of … is …")
      // dibacakan Inggris; pengantar Indonesia tetap Indonesia.
      const g = isEnglishSubject ? guessLang(part.text) : null;
      push(part.text, g === "en" ? "en-US" : "id-ID");
      return;
    }
    if (isEnglishSubject) {
      // Kata di dalam kutip pada mapel Bahasa Inggris umumnya kata target
      // Inggris — KECUALI bila pengantarnya menunjukkan kata itu justru
      // kata Indonesia yang ditanyakan padanannya ("Bahasa Inggris dari
      // “burung”", "berlawanan arti dengan “panas”").
      const prev = (parts[i - 1]?.text ?? "").toLowerCase();
      const quotedIsIndonesian = /bahasa inggris dari\s*$/.test(prev) || /berlawanan arti dengan\s*$/.test(prev) || /semakna dengan\s*$/.test(prev) || guessLang(part.text) === "id";
      if (quotedIsIndonesian) push(part.text, "id-ID");
      else push(part.text, "en-US", true);
      return;
    }
    // Mapel lain: isi kutip yang jelas istilah Inggris dibacakan Inggris.
    const g = guessLang(part.text);
    const wordCount = (part.text.match(/[a-z]+/gi) ?? []).length;
    if (g === "en" || (g === null && wordCount >= 3)) push(part.text, "en-US", true);
    else push(part.text, "id-ID");
  });
  // Tutup batang soal dengan titik agar ada jeda sebelum daftar pilihan.
  const lastStem = segs[segs.length - 1];
  if (lastStem && !/[.!?…]$/.test(lastStem.text)) lastStem.text += ".";
  // "Pilihan:" adalah potongan SENDIRI (tidak digabung ke potongan batang
  // soal lewat push), lalu tiap pilihan satu potongan sendiri berawalan
  // hurufnya — rantai bacaan wajib berlanjut sampai pilihan terakhir.
  segs.push({ text: "Pilihan:", lang: "id-ID" });
  segs.push(...optionSegs(answerEnglish ? "en-US" : "id-ID", answerEnglish));
  return segs.length > 1 ? segs : [{ text: stemText, lang: "id-ID" }, { text: "Pilihan:", lang: "id-ID" }, ...optionSegs("id-ID")];
}

/**
 * Ucapkan teks dengan pola paling andal & paling ramah anak di HP:
 * - utterance pertama dibuat & speak() dipanggil sinkron dari klik;
 * - voice dipilih dengan pickVoice() (paling natural untuk bahasanya);
 *   bila voice bahasa tujuan TIDAK ada, pakai voice default perangkat dan
 *   JANGAN paksa u.lang ke bahasa itu (penyebab umum TTS bisu di Android);
 * - teks dipecah per kalimat (splitSentences) dan diucapkan berurutan;
 * - pitch 1,1; rate bawaan 0,92–0,95 (rateForLang), KECUALI bila pemanggil
 *   memberi opts.rate — Dengarkan Soal memberi 1,1 RATA untuk semua
 *   potongan bahasa (permintaan user: bacaan 0,92–0,95 terasa terlalu
 *   lambat), termasuk potongan Inggris yang dulu diperlambat (slow);
 * - resume() dipanggil sebelum speak; cancel() hanya bila sedang berbicara,
 *   dan speak berikutnya diberi jeda kecil agar antrean tidak macet;
 * - RANTAI TIDAK BOLEH PUTUS DI TENGAH: sebagian mesin TTS HP kadang
 *   gagal menembakkan onend untuk satu utterance (bacaan berhenti diam-
 *   diam sesudah batang soal, pilihan tidak terbaca) atau menembakkan
 *   onerror untuk satu potongan saja. Karena itu tiap potongan punya
 *   watchdog: bila onend/onerror tak kunjung datang melewati perkiraan
 *   durasi ucapnya, bacaan DIPAKSA lanjut ke potongan berikutnya; dan
 *   onerror satu potongan (selain cancel/interrupted dari user) hanya
 *   melewati potongan itu, tidak menghentikan seluruh bacaan. Pesan
 *   gagal + nada indikator hanya tampil bila SEMUA potongan gagal dan
 *   tidak ada satu pun yang sempat mulai.
 *
 * Versi multi-potongan (speakSegments): tiap SpeechSegment diucapkan
 * dengan voice & rate bahasanya sendiri; di titik GANTI BAHASA antar
 * potongan disisipkan jeda ±320 ms agar perpindahan suaranya terasa
 * natural, tidak menyambung paksa; potongan bertanda slow (kata target
 * Bahasa Inggris) dibacakan ±15% lebih lambat pada jalur rate bawaan.
 */
interface SpeechChunk { text: string; voice?: SpeechSynthesisVoice; lang: string; rate: number; langSwitch: boolean }
function speakSegments(segments: SpeechSegment[], opts: SpeakOpts): boolean {
  const { setSpeaking, onStatus } = opts;
  if (!("speechSynthesis" in window)) {
    setSpeaking(false);
    onStatus?.("Browser perangkat ini tidak mendukung suara bacaan (TTS). Coba buka dengan Chrome di Android atau Safari di iPhone, ya.");
    return false;
  }
  const synth = window.speechSynthesis;
  // Bacaan ini menjadi generasi bicara terbaru; stopSpeaking() (mis. saat
  // peserta menekan Berikutnya) menaikkan generasi dan membatalkannya.
  speechGeneration += 1;
  const gen = speechGeneration;
  // Bangunkan jalur WebAudio dalam gestur klik yang sama — di banyak HP,
  // jalur audio yang belum pernah dibangunkan membuat SEMUA bunyi bisu.
  ensureAudioCtx();
  refreshVoices();
  const chunks: SpeechChunk[] = [];
  let anyUnmatched = false;
  let totalLen = 0;
  for (const seg of segments) {
    const clean = seg.text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim();
    if (!clean) continue;
    totalLen += clean.length;
    const picked = pickVoice(seg.lang);
    if (!picked.matched && voiceCache.length > 0) anyUnmatched = true;
    const rate = opts.rate !== undefined ? opts.rate : rateForLang(seg.lang) * (seg.slow ? 0.85 : 1);
    for (const piece of splitSentences(clean)) {
      const prev = chunks[chunks.length - 1];
      chunks.push({ text: piece, voice: picked.voice, lang: seg.lang, rate, langSwitch: !!prev && prev.lang !== seg.lang });
    }
  }
  if (!chunks.length) { setSpeaking(false); return true; }
  let started = false;
  let stopped = false;
  let ci = 0;
  let failCount = 0;
  let lastError = "";
  /** Rantai selesai: matikan indikator; pesan gagal hanya bila TIDAK ADA
      satu pun potongan yang sempat dibacakan dan memang ada yang error. */
  const finishChain = () => {
    setSpeaking(false);
    if (!started && failCount > 0) {
      sfxSelect(); // indikator bunyi: tombol bekerja walau TTS gagal
      onStatus?.(`Suara bacaan gagal diputar di perangkat ini${lastError ? ` (${lastError})` : ""}. Ketuk tombol 🔊 Tes Suara untuk melihat diagnosa lengkapnya.`);
    }
  };
  const speakChunk = () => {
    if (stopped) return;
    if (gen !== speechGeneration) { stopped = true; setSpeaking(false); return; }
    if (ci >= chunks.length) { finishChain(); return; }
    const myIndex = ci;
    const chunk = chunks[myIndex] as SpeechChunk;
    // `settled` menandai utterance potongan INI sudah ditangani (selesai,
    // error, atau dipaksa lanjut oleh watchdog) — callback terlambat dari
    // utterance yang sama (mis. onerror "canceled" akibat cancel watchdog)
    // tidak boleh mengutak-atik rantai lagi.
    let settled = false;
    let watchdog: number | undefined;
    const advance = (delay: number) => {
      if (settled) return;
      settled = true;
      if (watchdog !== undefined) window.clearTimeout(watchdog);
      if (stopped || gen !== speechGeneration) { setSpeaking(false); return; }
      ci = myIndex + 1;
      if (ci >= chunks.length) { finishChain(); return; }
      const next = chunks[ci];
      // Jeda singkat yang natural di titik ganti bahasa, supaya suara
      // Indonesia dan suara Inggris tidak terdengar menyambung paksa.
      const d = next?.langSwitch ? Math.max(delay, 320) : delay;
      if (d > 0) window.setTimeout(speakChunk, d);
      else speakChunk();
    };
    const u = new SpeechSynthesisUtterance(chunk.text);
    if (chunk.voice) {
      u.voice = chunk.voice;
      u.lang = chunk.voice.lang; // pakai bahasa voice yang benar-benar ada di perangkat
    }
    u.rate = chunk.rate;
    u.pitch = 1.1; // sedikit lebih tinggi & hangat — ramah anak, tidak kaku
    u.onstart = () => { if (myIndex === 0) { started = true; opts.onStart?.(); } setSpeaking(true); };
    u.onend = () => advance(0);
    u.onerror = (e) => {
      if (settled) return; // callback terlambat dari potongan yang sudah dilewati
      if (e.error === "canceled" || e.error === "interrupted") {
        // Cancel dari stopSpeaking()/pindah soal (generasi sudah berganti)
        // menghentikan rantai; cancel lain (mis. dari watchdog potongan
        // sebelumnya) tidak boleh mematikan bacaan — lanjutkan saja.
        if (gen !== speechGeneration) { settled = true; if (watchdog !== undefined) window.clearTimeout(watchdog); stopped = true; setSpeaking(false); return; }
        advance(0);
        return;
      }
      // Satu potongan error TIDAK menghentikan seluruh bacaan: catat dan
      // lanjut ke potongan berikutnya sampai pilihan terakhir selesai.
      failCount += 1;
      lastError = e.error;
      advance(0);
    };
    // Watchdog per potongan: perkiraan durasi ucap (panjang teks ÷ rate)
    // ditambah margin besar. Bila onend/onerror tak kunjung datang —
    // kegagalan diam yang membuat bacaan berhenti sesudah batang soal —
    // potong paksa utterance itu dan lanjutkan rantai ke potongan
    // berikutnya, apa pun isinya (termasuk pilihan terakhir).
    const estMs = Math.min(30000, Math.max(4000, 2500 + (chunk.text.length * 110) / Math.max(0.5, chunk.rate)));
    watchdog = window.setTimeout(() => {
      if (settled || stopped || gen !== speechGeneration) return;
      try { synth.cancel(); } catch { /* abaikan */ }
      advance(120);
    }, estMs);
    try { synth.resume(); } catch { /* abaikan */ }
    try {
      synth.speak(u);
    } catch {
      failCount += 1;
      lastError = "gagal dimulai";
      advance(0);
    }
  };
  const doSpeak = () => {
    if (gen !== speechGeneration) { setSpeaking(false); return; }
    setSpeaking(true);
    speakChunk();
    window.setTimeout(() => {
      if (!started && !stopped && gen === speechGeneration) onStatus?.("Bacaan belum juga mulai — mesin suara (TTS) di browser ini tampaknya tidak aktif. Ketuk tombol 🔊 Tes Suara untuk diagnosa lengkap, atau buka ZIQVA OLIM dengan Chrome dan pastikan Speech Services by Google aktif.");
    }, 2800);
    window.setTimeout(() => setSpeaking(false), Math.min(150000, 8000 + totalLen * 170));
  };
  if (anyUnmatched) {
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

/** Pembungkus satu bahasa untuk pemanggil lama (sambutan & tes suara). */
function speakText(text: string, lang: string, opts: SpeakOpts): boolean {
  return speakSegments([{ text, lang }], opts);
}

/**
 * Hentikan bacaan suara (TTS) SAAT ITU JUGA — dipanggil setiap kali peserta
 * pindah soal (Berikutnya / Sebelumnya / nomor soal / Kumpulkan / Keluar),
 * karena peserta yang berpikir cepat tidak perlu menunggu bacaan soal
 * sebelumnya selesai. speechSynthesis.cancel() menghentikan utterance yang
 * sedang berbunyi maupun yang masih antre, tanpa jeda.
 */
export function stopSpeaking() {
  speechGeneration += 1; // batalkan juga speak() yang masih terjadwal (jeda 90 ms sesudah cancel)
  try { window.speechSynthesis?.cancel(); } catch { /* abaikan */ }
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
  /** Total waktu sesi dalam detik (Kelas Ujian memakai waktu dari guru, bukan 1 menit per soal). */
  totalTimeSec?: number;
  /** Label konteks sesi, mis. nama Kelas Ujian — tampil di atas daftar soal. */
  contextLabel?: string;
  /** Mode Cambridge: soal full Bahasa Inggris — TTS memakai suara Inggris. */
  english?: boolean;
}) {
  const { questions, mode } = props;
  const totalTime = props.totalTimeSec ?? questions.length * 60;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(() => questions.map(() => false));
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  // Klik logo header saat sesi berjalan membuka konfirmasi keluar yang sama.
  useEffect(() => {
    if ((props.quitSignal ?? 0) > 0) { stopSpeaking(); setConfirmQuit(true); }
  }, [props.quitSignal]);
  const [speaking, setSpeaking] = useState(false);
  const [ttsMsg, setTtsMsg] = useState("");
  const startRef = useRef(Date.now());
  const finishedRef = useRef(false);

  const current = questions[idx];
  const answeredCount = answers.filter((a) => a !== null).length;

  /** Hentikan bacaan suara SEKARANG juga (tanpa menunggu selesai) dan
      matikan indikator "Sedang dibacakan…". Dipakai di semua perpindahan. */
  const stopVoice = () => { stopSpeaking(); setSpeaking(false); };

  /** Pindah ke soal lain — bacaan soal sebelumnya WAJIB berhenti langsung,
      karena peserta yang berpikir cepat sudah tidak mendengarkan soal itu. */
  const goTo = (next: number) => { stopVoice(); setIdx(next); };

  // Jaring pengaman: perubahan nomor soal dari jalur mana pun selalu
  // menghentikan bacaan yang sedang berbunyi.
  useEffect(() => { stopSpeaking(); setSpeaking(false); }, [idx]);

  const finish = () => {
    if (finishedRef.current) return;
    stopVoice();
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
  useEffect(() => () => { stopSpeaking(); }, []);

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
    // Bacaan LENGKAP & sadar bahasa per potongan: stimulus (bila ada) +
    // batang soal, lalu "Pilihan:", lalu SETIAP pilihan A/B/C/D satu per
    // satu sampai selesai (lihat buildQuestionSpeech) — pengantar
    // Indonesia dibacakan suara Indonesia, kata target & pilihan Bahasa
    // Inggris dibacakan suara Inggris. Teks tampil tidak berubah.
    // Rate 1,1 rata untuk semua potongan (permintaan user).
    speakSegments(buildQuestionSpeech(current.q, current.options, props.subjectId, !!props.english, current.stimulus), { setSpeaking, onStatus: setTtsMsg, rate: 1.1 });
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
          <button type="button" onClick={() => { stopVoice(); setConfirmQuit(true); }} aria-label="Keluar dari kuis" className="rounded-full px-3 py-2 text-sm font-bold" style={{ background: "var(--surface2)", color: "var(--dim)" }}>✕</button>
        </div>
      </div>

      {props.contextLabel && <p className="font-display mt-2 rounded-xl px-3 py-2 text-sm font-extrabold" style={{ background: "#FFF3DC", border: "1px solid var(--gold)", color: "#92600A" }}>{props.contextLabel}</p>}
      <p className="mt-2 text-sm font-bold" style={{ color: "var(--dim)" }}>{props.jenjang} • {props.subjectName} • {props.levelLabel} • Soal {idx + 1} dari {questions.length}</p>

      <div className="pop-in relative mt-2 rounded-3xl p-5 shadow-sm" key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {mode === "latihan" && props.onInfo && <InfoIcon onClick={() => { stopVoice(); props.onInfo?.(current); }} />}
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
          <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Ke soal ${i + 1}`}
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
          <button type="button" disabled={idx === 0} onClick={() => goTo(idx - 1)} aria-label="Soal sebelumnya — bacaan suara berhenti"
            className="min-h-[52px] flex-1 rounded-2xl font-display text-base font-bold disabled:opacity-40" style={{ background: "var(--surface)", border: "2px solid var(--border)" }}>← Sebelumnya</button>
          {idx < questions.length - 1 ? (
            <button type="button" onClick={() => goTo(idx + 1)} aria-label="Soal berikutnya — bacaan suara berhenti"
              className="min-h-[52px] flex-[2] rounded-2xl font-display text-base font-bold text-white" style={{ background: "var(--accent)" }}>Berikutnya →</button>
          ) : (
            <button type="button" onClick={() => { stopVoice(); setConfirmSubmit(true); }} aria-label="Kumpulkan jawaban"
              className="min-h-[52px] flex-[2] rounded-2xl font-display text-base font-bold text-white" style={{ background: "#1E7A46" }}>🏁 Kumpulkan</button>
          )}
        </div>
        {idx === questions.length - 1 && mode === "ujian" && (
          <button type="button" onClick={() => { stopVoice(); setConfirmSubmit(true); }} className="sr-only">Kumpulkan</button>
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
              <button type="button" onClick={() => { stopVoice(); props.onQuit(); }} className="min-h-[52px] rounded-2xl font-display text-base font-bold" style={{ background: "var(--surface2)", color: "#B02A37" }}>Ya, Keluar ke Beranda</button>
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

/** Pindahkan fokus keyboard langsung ke kolom formulir dengan id ini
 *  (dipakai saat validasi gagal, supaya user tidak perlu mencari kolomnya). */
function focusField(id: string) {
  document.getElementById(id)?.focus();
}

/* ---------------- ATURAN NAMA PESERTA / AKUN ----------------
   Cerminan aturan yang sama di server (register, updateProfile,
   joinClass, saveAttempt): nama wajib minimal 3 huruf sesudah spasi
   pinggir dibuang, dan tidak boleh mengandung kata jorok. Pengecekan
   kata jorok menormalisasi nama dulu — huruf kecil, leet umum disamakan
   (0=o, 1=i, 3=e, 4=a, 5=s, 7=t, @=a, $=s), lalu semua karakter selain
   a-z dibuang (spasi & tanda baca di antara huruf ikut hilang) — baru
   dicocokkan sebagai substring, jadi akal-akalan seperti "t0l0l" atau
   "t a i" tetap ketahuan. Mengembalikan pesan penolakan PERSIS seperti
   di server, atau null bila nama lolos. */
const NAME_MIN_MESSAGE = "Nama minimal 3 huruf ya.";
const NAME_PROFANE_MESSAGE = "Nama mengandung kata yang tidak sopan. Ganti nama lain ya.";
const BANNED_NAME_WORDS = [
  "tai", "taik", "jancok", "jancuk", "memek", "pelacur", "tolol", "bodoh",
  "kontol", "ngentot", "entot", "bangsat", "bajingan", "goblok", "lonte",
  "sundal", "brengsek", "keparat", "asu", "kimak", "peler",
  "fuck", "shit", "bitch",
];
const NAME_LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
};
function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return NAME_MIN_MESSAGE;
  const normalized = trimmed
    .toLowerCase()
    .split("")
    .map((ch) => NAME_LEET_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z]/g, "");
  if (BANNED_NAME_WORDS.some((w) => normalized.includes(w))) return NAME_PROFANE_MESSAGE;
  return null;
}

/* ---------------- LOGIN GURU / ORANG TUA ---------------- */
function AuthView(props: { onSuccess: (token: string, user: SessionUser) => void; initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(props.initialTab ?? "login");
  const [role, setRole] = useState<Role>("orangtua");
  // Pilihan Superadmin hanya tampil selama akun Superadmin BELUM pernah
  // dibuat — server juga menolak pembuatan admin kedua (satu-satunya).
  const adminQ = useQuery({ queryKey: ["admin-exists"], queryFn: () => api.adminExists({}) });
  const adminAvailable = adminQ.data ? !adminQ.data.exists : false;
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (r) => props.onSuccess(r.token, r.user),
    onError: (e) => { setError(e instanceof Error ? e.message : "Gagal masuk. Coba lagi ya."); focusField("auth-username"); },
  });
  const register = useMutation({
    mutationFn: api.register,
    onSuccess: (r) => props.onSuccess(r.token, r.user),
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Gagal membuat akun. Coba lagi ya.";
      setError(msg);
      if (msg.toLowerCase().includes("username")) focusField("auth-username");
      else if (msg.toLowerCase().includes("whatsapp") || msg.toLowerCase().includes("email")) focusField("reg-whatsapp");
      else if (msg.toLowerCase().includes("nama")) focusField("reg-name");
    },
  });
  const busy = login.isPending || register.isPending;

  const submit = () => {
    setError("");
    if (tab === "login") {
      if (!username.trim()) { setError("Isi username, nomor WhatsApp, atau email dulu ya."); focusField("auth-username"); return; }
      if (!password) { setError("Isi kata sandi dulu ya."); focusField("auth-password"); return; }
      login.mutate({ identifier: username.trim(), password });
    } else {
      const nameProblem = validateDisplayName(name);
      if (nameProblem) { setError(nameProblem); focusField("reg-name"); return; }
      if (username.trim().length < 3) { setError("Username minimal 3 karakter (huruf kecil, angka, titik, garis bawah)."); focusField("auth-username"); return; }
      if (password.length < 6) { setError("Kata sandi minimal 6 karakter."); focusField("auth-password"); return; }
      if (!whatsapp.trim() && !email.trim()) { setError("Isi minimal salah satu: Nomor WhatsApp atau Email, supaya kami bisa mengirim info olimpiade terbaru."); focusField("reg-whatsapp"); return; }
      register.mutate({ name: name.trim(), username: username.trim(), password, role, organization: organization.trim(), whatsapp: whatsapp.trim(), email: email.trim() });
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
                  {adminAvailable && (
                    <button type="button" role="radio" aria-checked={role === "admin"} onClick={() => setRole("admin")}
                      className="rounded-2xl p-3.5 text-left sm:col-span-2" style={{ background: role === "admin" ? "#FFF3DC" : "var(--surface2)", border: `2px solid ${role === "admin" ? "var(--gold)" : "var(--border)"}` }}>
                      <div className="font-display font-bold">🛡️ Superadmin</div>
                      <div className="text-xs" style={{ color: "var(--dim)" }}>Khusus pemilik aplikasi — pantau &amp; kelola semua data. Hanya bisa dibuat satu kali.</div>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="reg-name" className="font-display text-sm font-bold">Nama Lengkap</label>
                <input id="reg-name" {...FIELDS.register.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Ibu Sari / Pak Budi" className={inputCls} style={inputStyle} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="reg-org" className="font-display text-sm font-bold">{role === "guru" ? "Sekolah / Kelas (opsional)" : role === "admin" ? "Organisasi (opsional)" : "Sekolah Anak (opsional)"}</label>
                <input id="reg-org" {...FIELDS.register.organization} value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder={role === "guru" ? "Contoh: SDN 1 Malang — Kelas 4" : role === "admin" ? "Contoh: Pemilik ZIQVA OLIM" : "Contoh: TK Islam Sabilillah"} className={inputCls} style={inputStyle} autoComplete="organization" />
              </div>
              <div>
                <label htmlFor="reg-whatsapp" className="font-display text-sm font-bold">Nomor WhatsApp</label>
                <input id="reg-whatsapp" {...FIELDS.register.whatsapp} type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08xxxxxxxxxx" className={inputCls} style={inputStyle} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="reg-email" className="font-display text-sm font-bold">Email</label>
                <input id="reg-email" {...FIELDS.register.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className={inputCls} style={inputStyle} autoComplete="email" />
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--dim)" }}>Minimal isi salah satu — untuk menerima info olimpiade terbaru. Tidak dibagikan ke siapa pun.</p>
              </div>
            </>
          )}
          <div>
            <label htmlFor="auth-username" className="font-display text-sm font-bold">{tab === "login" ? "Username / No. WhatsApp / Email" : "Username"}</label>
            {tab === "login"
              ? <input id="auth-username" {...FIELDS.login.identifier} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username, 08xxxxxxxxxx, atau email" className={inputCls} style={inputStyle} autoComplete="username" />
              : <input id="auth-username" {...FIELDS.register.username} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="huruf kecil, contoh: ibu_sari" className={inputCls} style={inputStyle} autoComplete="username" />}
            {tab === "login" && <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--dim)" }}>Masuk bisa pakai salah satu: username, nomor WhatsApp, atau email yang dipakai saat daftar.</p>}
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

/* ---------------- MODE KELAS UJIAN ----------------
   Guru (akun Guru) membuat kelas: satu paket soal yang sama disimpan di
   server beserta Kode Kelas. Siswa bergabung tanpa akun (nama + kode);
   urutan soal & pilihan diacak per siswa di perangkatnya. Penilaian
   dilakukan server dari teks soal + teks pilihan, jadi tetap akurat
   walau urutan tiap siswa berbeda. */
type ExamClassInfo = ApiResponse<typeof api, "listMyClasses">["classes"][number];
type ExamParticipant = ApiResponse<typeof api, "getClassDashboard">["participants"][number];
type ExamRankingEntry = ApiResponse<typeof api, "getClassDashboard">["ranking"][number];

/** Soal kelas versi siswa: server TIDAK mengirim kunci jawaban maupun
    pembahasan selama ujian — hanya teks soal & pilihan. Penilaian
    dilakukan server dari teks soal + teks pilihan yang dikirim balik. */
type ExamStudentQuestion = NonNullable<ApiResponse<typeof api, "joinClass">["questions"]>[number];
interface JoinStartPayload {
  classInfo: ExamClassInfo;
  participantId: number;
  studentName: string;
  questions: ExamStudentQuestion[];
  resumed: boolean;
}
interface ActiveClassSession {
  classId: number; participantId: number; className: string; code: string;
  jenjang: JenjangId; subjectId: string; subjectName: string; level: number; durationMinutes: number;
}
type ClassResultData = ApiResponse<typeof api, "submitClassResult">;
interface PendingClassSubmission {
  class_id: number; participant_id: number; student_name: string;
  submissions: { q: string; chosen: string | null }[]; duration_sec: number; device_id: string;
}

/** Bangun paket soal kelas: gabungkan beberapa sesi buildSession sampai
    jumlah uniknya mencapai target (bank + generator selalu cukup). */
function buildClassPackage(jenjang: JenjangId, subjectId: string, level: number, count: number, english = false): Question[] {
  const byText = new Map<string, Question>();
  for (let round = 0; round < 6 && byText.size < count; round++) {
    for (const q of buildSession(jenjang, subjectId, level, count, english)) {
      if (!byText.has(q.q)) byText.set(q.q, q);
    }
  }
  return [...byText.values()].slice(0, count);
}

function ClassRankingList(props: { ranking: ExamRankingEntry[]; myName?: string }) {
  if (props.ranking.length === 0) {
    return <p className="text-sm font-semibold" style={{ color: "var(--dim)" }}>Belum ada peserta yang selesai — peringkat kelas muncul begitu ada yang mengumpulkan.</p>;
  }
  const myKey = (props.myName ?? "").trim().toLowerCase();
  return (
    <div className="grid gap-2">
      {props.ranking.map((r) => {
        const isMe = myKey !== "" && r.student_name.trim().toLowerCase() === myKey;
        return (
          <div key={r.participant_id} className="flex items-center gap-3 rounded-2xl p-3.5"
            style={{ background: isMe ? "#FFF3DC" : "var(--surface)", border: `2px solid ${isMe ? "var(--gold)" : "var(--border)"}` }}
            aria-label={`Peringkat ${r.rank}: ${r.student_name}, nilai ${r.score}, waktu ${fmtDur(r.duration_sec)}`}>
            <span className="text-2xl" aria-hidden>{RANK_MEDALS[r.rank - 1] ?? ""}</span>
            <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white" style={{ background: r.rank === 1 ? "#D97706" : "var(--accent)" }}>{r.rank}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display font-bold">{r.student_name} {isMe && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: "var(--accent)" }}>KAMU</span>}</div>
              <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>{r.correct}/{r.total} benar • ⏱ {fmtDur(r.duration_sec)} • selesai {new Date(r.finished_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-2xl leading-none font-extrabold" style={{ color: medalFor(r.score).color }}>{r.score}</div>
              <div className="text-[10px] font-bold" style={{ color: "var(--dim)" }}>NILAI</div>
            </div>
          </div>
        );
      })}
      <p className="text-xs leading-relaxed" style={{ color: "var(--dim)" }}>Aturan peringkat kelas: nilai tertinggi dulu — nilai sama, yang mengerjakan paling cepat yang menang.</p>
    </div>
  );
}

function downloadClassCsv(cls: ExamClassInfo, ranking: ExamRankingEntry[], participants: ExamParticipant[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rankedIds = new Set(ranking.map((r) => r.participant_id));
  const lines: string[] = [
    ["Peringkat", "Nama Peserta", "Status", "Nilai", "Benar", "Total Soal", "Waktu (detik)", "Waktu", "Selesai Pada"].map(esc).join(","),
  ];
  for (const r of ranking) {
    lines.push([r.rank, r.student_name, "Selesai", r.score, r.correct, r.total, r.duration_sec, fmtDur(r.duration_sec), new Date(r.finished_at).toLocaleString("id-ID")].map(esc).join(","));
  }
  for (const p of participants.filter((x) => !rankedIds.has(x.id))) {
    lines.push(["", p.student_name, "Sedang mengerjakan", "", "", "", "", "", ""].map(esc).join(","));
  }
  const blob = new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekap-${cls.class_name.replace(/[^\w-]+/g, "-")}-${cls.code}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- Panel Kelas Ujian untuk Guru (di dalam dashboard) ---------- */
function TeacherClassesSection(props: { token: string }) {
  const { token } = props;
  const queryClient = useQueryClient();
  const classesQ = useQuery({ queryKey: ["myClasses", token], queryFn: () => api.listMyClasses({ token }), refetchInterval: 8000, refetchIntervalInBackground: false });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const dashQ = useQuery({
    queryKey: ["classDashboard", token, selectedId],
    queryFn: () => api.getClassDashboard({ token, class_id: selectedId as number }),
    enabled: selectedId !== null,
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  });

  const [cName, setCName] = useState("");
  const [cJenjang, setCJenjang] = useState<JenjangId>("SD");
  const cSubjects = useMemo(() => SUBJECTS.filter((s) => s.jenjang.includes(cJenjang)), [cJenjang]);
  const [cSubjectId, setCSubjectId] = useState<string>("matematika");
  const cSubject = cSubjects.find((s) => s.id === cSubjectId) ?? cSubjects[0];
  const [cLevel, setCLevel] = useState(1);
  const [cCount, setCCount] = useState(20);
  const [cDuration, setCDuration] = useState(20);
  const [createError, setCreateError] = useState("");
  const [createdMsg, setCreatedMsg] = useState("");

  const createClass = useMutation({
    mutationFn: api.createExamClass,
    onSuccess: (r) => {
      setCreatedMsg(`✅ Kelas "${r.class.class_name}" berhasil dibuat! Kode Kelas: ${r.class.code} — tulis kode ini di papan tulis / kirim ke grup kelas. Siswa tinggal pilih "Gabung Kelas" di Beranda, isi nama + kode itu.`);
      setCName("");
      setSelectedId(r.class.id);
      queryClient.invalidateQueries({ queryKey: ["myClasses"] });
    },
    onError: (e) => setCreateError(e instanceof Error ? e.message : "Gagal membuat kelas. Coba lagi ya."),
  });
  const closeClass = useMutation({
    mutationFn: api.closeExamClass,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["myClasses"] }); queryClient.invalidateQueries({ queryKey: ["classDashboard"] }); },
    onError: (e) => setCreateError(e instanceof Error ? e.message : "Gagal menutup kelas. Coba lagi ya."),
  });

  const submitCreate = () => {
    setCreateError("");
    setCreatedMsg("");
    if (!cName.trim()) { setCreateError("Isi nama kelas dulu ya, contoh: Kelas 5A."); focusField("class-name"); return; }
    if (!cSubject) { setCreateError("Pilih mata pelajaran dulu ya."); return; }
    const count = Math.min(30, Math.max(5, Math.round(cCount) || 20));
    const duration = Math.min(120, Math.max(5, Math.round(cDuration) || count));
    const questions = buildClassPackage(cJenjang, cSubject.id, cLevel, count);
    if (questions.length < count) { setCreateError(`Paket soal baru terkumpul ${questions.length} dari ${count} soal. Coba jenjang / mapel / level lain ya.`); return; }
    createClass.mutate({
      token,
      class_name: cName.trim(),
      jenjang: cJenjang,
      subject_id: cSubject.id,
      subject_name: cSubject.name,
      level: cLevel,
      question_count: count,
      duration_minutes: duration,
      questions: questions.map((q) => {
        const base: { q: string; options: string[]; answer: number; explain: string; stimulus?: string; emoji?: string } = { q: q.q, options: q.options, answer: q.answer, explain: q.explain };
        if (q.stimulus) base.stimulus = q.stimulus;
        if (q.emoji) base.emoji = q.emoji;
        return base;
      }),
    });
  };

  const inputCls = "mt-1.5 min-h-[52px] w-full rounded-2xl px-4 text-base font-semibold outline-none";
  const inputStyle = { background: "var(--surface2)", border: "2px solid var(--border)" } as const;
  const dash = dashQ.data;

  return (
    <section className="mt-4 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "2px solid var(--accent)" }} aria-label="Mode Kelas Ujian">
      <h2 className="font-display text-lg font-bold">🏫 Mode Kelas Ujian</h2>
      <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
        Buat satu kelas ujian untuk seluruh kelasmu: atur jenjang, mapel, level, jumlah soal, dan waktu — sistem memberi <strong>Kode Kelas</strong>.
        Siswa bergabung dari Beranda dengan nama + kode itu (tanpa akun), mengerjakan paket yang sama dengan urutan soal &amp; pilihan yang <strong>diacak per siswa</strong>, murni Mode Ujian (tanpa ikon i &amp; tanpa pembahasan).
        Dashboard di bawah ini <strong>live</strong> — siapa sudah bergabung, sedang mengerjakan, sudah selesai, nilainya, dan peringkat kelasnya.
      </p>

      <form className="mt-4 grid gap-3" onSubmit={(e) => { e.preventDefault(); submitCreate(); }}>
        <div>
          <label htmlFor="class-name" className="font-display text-sm font-bold">Nama Kelas</label>
          <input id="class-name" {...FIELDS.createExamClass.class_name} value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Contoh: Kelas 5A / Kelas 8B — Matematika" className={inputCls} style={inputStyle} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="class-jenjang" className="font-display text-sm font-bold">Jenjang</label>
            <select id="class-jenjang" value={cJenjang} onChange={(e) => { const j = e.target.value as JenjangId; setCJenjang(j); const first = SUBJECTS.find((s) => s.jenjang.includes(j)); if (first) setCSubjectId(first.id); }} className={inputCls} style={inputStyle} aria-label="Jenjang kelas ujian">
              {JENJANG.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="class-subject" className="font-display text-sm font-bold">Mata Pelajaran</label>
            <select id="class-subject" value={cSubject?.id ?? ""} onChange={(e) => setCSubjectId(e.target.value)} className={inputCls} style={inputStyle} aria-label="Mata pelajaran kelas ujian">
              {cSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="class-level" className="font-display text-sm font-bold">Level Kesulitan</label>
            <select id="class-level" value={cLevel} onChange={(e) => setCLevel(Number(e.target.value))} className={inputCls} style={inputStyle} aria-label="Level kesulitan kelas ujian">
              {LEVELS.map((lv) => <option key={lv.n} value={lv.n}>Level {lv.n} — {lv.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="class-count" className="font-display text-sm font-bold">Jumlah Soal</label>
              <input id="class-count" {...FIELDS.createExamClass.question_count} type="number" value={cCount} onChange={(e) => { const v = Number(e.target.value); setCCount(v); if (v >= 5 && v <= 30) setCDuration(v); }} className={inputCls} style={inputStyle} aria-label="Jumlah soal kelas ujian, 5 sampai 30" />
            </div>
            <div>
              <label htmlFor="class-duration" className="font-display text-sm font-bold">Waktu (menit)</label>
              <input id="class-duration" {...FIELDS.createExamClass.duration_minutes} type="number" value={cDuration} onChange={(e) => setCDuration(Number(e.target.value))} className={inputCls} style={inputStyle} aria-label="Waktu pengerjaan kelas ujian dalam menit, 5 sampai 120" />
            </div>
          </div>
        </div>
        {createError && <p className="rounded-xl px-3 py-2 text-sm font-bold text-red-600" style={{ background: "#FAE7E9" }} role="alert">{createError}</p>}
        {createdMsg && <p className="rounded-xl px-3 py-2 text-sm font-bold" style={{ background: "#E2F4E9", color: "#1E7A46" }} role="status">{createdMsg}</p>}
        <button type="submit" disabled={createClass.isPending} className="font-display min-h-[56px] rounded-2xl text-lg font-extrabold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
          {createClass.isPending ? "Sedang menyiapkan paket soal…" : "🏫 Buat Kelas & Dapatkan Kode Kelas"}
        </button>
      </form>

      <h3 className="font-display mt-6 text-base font-bold">📋 Kelas Ujian Saya</h3>
      {classesQ.isPending && <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Memuat kelas…</p>}
      {classesQ.data && classesQ.data.classes.length === 0 && (
        <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Belum ada kelas ujian. Buat kelas pertamamu dengan formulir di atas — kodenya langsung bisa dibagikan ke siswa.</p>
      )}
      <div className="mt-2 grid gap-2">
        {(classesQ.data?.classes ?? []).map((c) => (
          <div key={c.id} className="rounded-2xl p-4" style={{ background: selectedId === c.id ? "#FFF3DC" : "var(--surface2)", border: `2px solid ${selectedId === c.id ? "var(--gold)" : "var(--border)"}` }}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-display truncate font-extrabold">{c.class_name}</div>
                <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>
                  {c.jenjang} • {c.subject_name} • Level {c.level} • {c.question_count} soal • ⏱ {c.duration_minutes} menit • 👥 {c.participant_count} bergabung • ✅ {c.finished_count} selesai
                </div>
              </div>
              <span className="font-display rounded-xl px-3 py-2 text-base font-extrabold tracking-widest" style={{ background: "var(--surface)", border: "2px dashed var(--accent)", color: "var(--accent)" }} aria-label={`Kode kelas ${c.code}`}>{c.code}</span>
              <span className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white" style={{ background: c.status === "open" ? "#1E7A46" : "#6E6785" }}>{c.status === "open" ? "🟢 DIBUKA" : "🔒 DITUTUP"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedId(selectedId === c.id ? null : c.id)} aria-label={`Lihat dashboard live kelas ${c.class_name}`} aria-expanded={selectedId === c.id}
                className="font-display min-h-[44px] rounded-full px-4 text-sm font-bold text-white" style={{ background: "var(--accent)" }}>
                {selectedId === c.id ? "Tutup Dashboard" : "📊 Dashboard Live"}
              </button>
              {c.status === "open" && (
                <button type="button" onClick={() => closeClass.mutate({ token, class_id: c.id })} disabled={closeClass.isPending} aria-label={`Tutup kelas ${c.class_name} supaya kodenya berhenti berlaku`}
                  className="font-display min-h-[44px] rounded-full px-4 text-sm font-bold disabled:opacity-50" style={{ background: "var(--surface)", border: "2px solid #B02A37", color: "#B02A37" }}>
                  🔒 Tutup Kelas
                </button>
              )}
            </div>

            {selectedId === c.id && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} aria-label={`Dashboard live kelas ${c.class_name}`}>
                {dashQ.isPending && <p className="text-sm" style={{ color: "var(--dim)" }}>Memuat dashboard kelas…</p>}
                {dashQ.isError && <p className="text-sm font-bold text-red-500" role="alert">Dashboard belum bisa dimuat. <button type="button" onClick={() => dashQ.refetch()} className="underline">Coba lagi</button></p>}
                {dash && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="flex-1 text-sm font-bold">📡 Live — diperbarui otomatis tiap beberapa detik. 👥 {dash.class.participant_count} bergabung • ✏️ {dash.participants.filter((p) => p.status === "in_progress").length} sedang mengerjakan • ✅ {dash.class.finished_count} selesai</p>
                      <button type="button" onClick={() => dashQ.refetch()} aria-label="Segarkan dashboard kelas sekarang" className="font-display min-h-[40px] rounded-full px-3 text-sm font-bold" style={{ background: "var(--surface2)" }}>🔄 Segarkan</button>
                      <button type="button" onClick={() => downloadClassCsv(dash.class, dash.ranking, dash.participants)} aria-label={`Unduh rekap hasil kelas ${dash.class.class_name} sebagai file CSV`}
                        className="font-display min-h-[40px] rounded-full px-3 text-sm font-bold text-white" style={{ background: "#1E7A46" }}>⬇️ Unduh Rekap (CSV)</button>
                    </div>
                    <h4 className="font-display mt-4 text-sm font-extrabold">👥 Daftar Siswa</h4>
                    {dash.participants.length === 0 ? (
                      <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Belum ada siswa yang bergabung. Bagikan Kode Kelas <strong>{dash.class.code}</strong> — siswa membuka ZIQVA OLIM, memilih <strong>Gabung Kelas</strong>, lalu mengisi nama + kode itu.</p>
                    ) : (
                      <div className="mt-2 grid gap-1.5">
                        {dash.participants.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--surface2)" }}>
                            <span className="text-xl" aria-hidden>{p.status === "finished" ? "✅" : "✏️"}</span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-display text-sm font-bold">{p.student_name}</div>
                              <div className="text-[11px] font-semibold" style={{ color: "var(--dim)" }}>
                                Bergabung {new Date(p.joined_at).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                                {p.finished_at ? ` • Selesai ${new Date(p.finished_at).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
                              </div>
                            </div>
                            {p.status === "finished" ? (
                              <span className="text-right">
                                <span className="font-display block text-lg leading-none font-extrabold" style={{ color: medalFor(p.score ?? 0).color }}>{p.score}</span>
                                <span className="block text-[10px] font-bold" style={{ color: "var(--dim)" }}>{p.correct}/{p.total} • ⏱ {fmtDur(p.duration_sec ?? 0)}</span>
                              </span>
                            ) : (
                              <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: "#FBF0DA", color: "#92600A" }}>SEDANG MENGERJAKAN</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <h4 className="font-display mt-4 text-sm font-extrabold">🏆 Peringkat Kelas — {dash.class.class_name}</h4>
                    <div className="mt-2"><ClassRankingList ranking={dash.ranking} /></div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Gabung Kelas untuk Siswa (tanpa akun) ---------- */
function JoinClassView(props: { initialName: string; deviceId: string; onStart: (payload: JoinStartPayload) => void; onHome: () => void }) {
  const [joinName, setJoinName] = useState(props.initialName);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [finished, setFinished] = useState<{ classInfo: ExamClassInfo; result: { score: number; correct: number; total: number; duration_sec: number; rank: number }; ranking: ExamRankingEntry[] } | null>(null);

  const join = useMutation({
    mutationFn: api.joinClass,
    onSuccess: (r) => {
      setJoinError("");
      if (r.status === "already_finished" && r.result) {
        setFinished({ classInfo: r.class, result: r.result, ranking: r.ranking });
        return;
      }
      props.onStart({
        classInfo: r.class,
        participantId: r.participant_id,
        studentName: r.student_name,
        questions: r.questions ?? [],
        resumed: r.status === "resumed",
      });
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Gagal bergabung ke kelas. Coba lagi ya.";
      setJoinError(msg);
      if (msg.toLowerCase().includes("nama")) focusField("join-name");
      else focusField("join-code");
    },
  });

  const submitJoin = () => {
    setJoinError("");
    const nameProblem = validateDisplayName(joinName);
    if (nameProblem) { setJoinError(nameProblem); focusField("join-name"); return; }
    if (!joinCode.trim()) { setJoinError("Isi Kode Kelas dulu ya — kodenya dari gurumu, contoh: KLS-XXXXXX."); focusField("join-code"); return; }
    join.mutate({ student_name: joinName.trim(), code: joinCode.trim(), device_id: props.deviceId });
  };

  const inputCls = "mt-1.5 min-h-[56px] w-full rounded-2xl px-4 text-base font-semibold outline-none";
  const inputStyle = { background: "var(--surface2)", border: "2px solid var(--border)" } as const;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10">
      <section className="mt-5 rounded-3xl p-6 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="text-center text-5xl" aria-hidden>🏫</div>
        <h1 className="font-display mt-2 text-center text-2xl font-extrabold">Gabung Kelas Ujian</h1>
        <p className="mt-1 text-center text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
          Tanpa daftar akun: isi <strong>namamu</strong> dan <strong>Kode Kelas</strong> dari gurumu, lalu langsung mengerjakan ujian kelasnya.
          Paket soalnya sama untuk satu kelas, tapi urutan soal &amp; pilihan diacak khusus untukmu — jadi tidak bisa menyontek urutan teman. Murni Mode Ujian: ada timer dari guru, tanpa pembahasan.
        </p>

        {finished ? (
          <div className="pop-in mt-5" role="status" aria-label="Kamu sudah menyelesaikan kelas ini">
            <div className="rounded-3xl p-5 text-center" style={{ background: "linear-gradient(160deg,#FFF7E0,#FFEFC4)", border: "2px solid var(--gold)", color: "#2B2440" }}>
              <p className="text-sm font-bold tracking-wide" style={{ color: "#92600A" }}>KAMU SUDAH SELESAI — {finished.classInfo.class_name.toUpperCase()}</p>
              <div className="font-display my-1 text-[72px] leading-none font-extrabold" style={{ color: "#D97706" }}>{finished.result.score}</div>
              <p className="font-display font-bold">({finished.result.correct}/{finished.result.total} benar) • ⏱ {fmtDur(finished.result.duration_sec)}</p>
              <p className="font-display mt-1 text-lg font-extrabold">🏆 Peringkat #{finished.result.rank} di kelas ini (sementara)</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "#92600A" }}>Nama yang sama dianggap peserta yang sama, jadi ujian kelas ini tidak dikerjakan dua kali — peringkat kelas tetap adil.</p>
            </div>
            <h2 className="font-display mt-4 text-base font-bold">🏆 Peringkat Kelas Sementara</h2>
            <div className="mt-2"><ClassRankingList ranking={finished.ranking} myName={joinName} /></div>
            <button type="button" onClick={props.onHome} className="font-display mt-4 min-h-[54px] w-full rounded-2xl text-lg font-extrabold text-white" style={{ background: "var(--accent)" }}>🏠 Kembali ke Beranda</button>
          </div>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={(e) => { e.preventDefault(); submitJoin(); }}>
            <div>
              <label htmlFor="join-name" className="font-display text-sm font-bold">Nama Peserta</label>
              <input id="join-name" {...FIELDS.joinClass.student_name} value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Contoh: Aisyah / Budi / Caca" className={inputCls} style={inputStyle} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="join-code" className="font-display text-sm font-bold">Kode Kelas dari Guru</label>
              <input id="join-code" {...FIELDS.joinClass.code} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="KLS-XXXXXX" className={`${inputCls} font-display text-center text-xl font-extrabold tracking-[0.2em] uppercase`} style={inputStyle} autoComplete="off" />
            </div>
            {joinError && <p className="rounded-xl px-3 py-2 text-sm font-bold text-red-600" style={{ background: "#FAE7E9" }} role="alert">{joinError}</p>}
            <button type="submit" disabled={join.isPending} className="font-display min-h-[56px] rounded-2xl text-lg font-extrabold text-white disabled:opacity-50" style={{ background: "#1E7A46" }}>
              {join.isPending ? "Sedang masuk kelas…" : "🚀 Masuk Kelas & Mulai Ujian"}
            </button>
            <button type="button" onClick={props.onHome} className="font-display min-h-[48px] rounded-2xl font-bold" style={{ background: "var(--surface2)" }}>← Kembali ke Beranda</button>
            <p className="text-center text-xs leading-relaxed" style={{ color: "var(--dim)" }}>
              Untuk uji coba sendiri: buat kelas dulu dari akun Guru (menu Guru &amp; Ortu → Mode Kelas Ujian), salin kodenya, lalu kembali ke sini dan bergabung sebagai siswa dengan nama lain — bisa dari perangkat yang sama.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}

/* ---------------- DASHBOARD PANTAU ---------------- */
function MonitorView(props: { token: string; user: SessionUser; onLogout: () => void; onPractice: () => void; onProfile: () => void }) {
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
    onError: (e) => { setChildError(e instanceof Error ? e.message : "Gagal menambahkan. Coba lagi ya."); focusField("child-code"); },
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
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ background: "var(--surface2)" }} aria-hidden>{isGuru ? "👨‍🏫" : user.role === "admin" ? "🛡️" : "👨‍👩‍👧"}</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-xl font-extrabold">Halo, {user.name}!</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--dim)" }}>
              {isGuru ? "🧑‍🏫 Guru" : user.role === "admin" ? "🛡️ Superadmin" : "👨‍👩‍👧 Orang Tua"} • @{user.username}{user.organization ? ` • ${user.organization}` : ""}
            </p>
          </div>
          <button type="button" onClick={() => dash.refetch()} aria-label="Segarkan data pantauan" className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold" style={{ background: "var(--surface2)" }}>🔄 Segarkan</button>
          <button type="button" onClick={props.onProfile} aria-label="Buka halaman profil saya" className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold" style={{ background: "var(--surface2)" }}>👤 Profil Saya</button>
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
                if (!childName.trim()) { setChildError(isGuru ? "Isi nama murid dulu ya." : "Isi nama anak dulu ya."); focusField("child-name"); return; }
                if (!childCode.trim()) { setChildError("Isi Kode Pantau dulu ya — kodenya ada di layar hasil / Prestasiku peserta."); focusField("child-code"); return; }
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

          {isGuru && <TeacherClassesSection token={token} />}

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
                      <div className="truncate font-display font-bold">{a.student_name} — {a.mapel} • {a.jenjang}{a.class_name ? ` • 🏫 ${a.class_name}` : ""}</div>
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

/* ---------------- PANEL SUPERADMIN ----------------
   Hanya untuk akun pemilik (role "admin"). Menampilkan jumlah global
   seluruh aplikasi (akun per peran, peserta unik, total sesi nilai,
   kelas ujian, pemakai online) dan pengelolaan: hapus akun, hapus
   kelas, hapus baris nilai — semua lewat aksi server khusus admin
   dengan konfirmasi di dalam halaman sebelum menghapus. */
type AdminConfirm = { kind: "user" | "class" | "attempt"; id: number; label: string } | null;

function adminRoleLabel(role: string) {
  if (role === "admin") return "🛡️ Superadmin";
  if (role === "guru") return "👨‍🏫 Guru";
  return "👨‍👩‍👧 Orang Tua";
}

/** Ubah nomor WhatsApp lokal menjadi tautan wa.me internasional:
    hanya angka, awalan 0 diganti 62. */
function waChatUrl(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

function AdminView(props: { token: string; user: SessionUser; onLogout: () => void; onProfile: () => void }) {
  const queryClient = useQueryClient();
  const { token, user } = props;
  const dash = useQuery({ queryKey: ["admin-dashboard", token], queryFn: () => api.adminDashboard({ token }) });
  const [confirm, setConfirm] = useState<AdminConfirm>(null);
  const [actionError, setActionError] = useState("");

  const afterDelete = () => { setConfirm(null); setActionError(""); queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }); };
  const onDeleteError = (e: unknown) => setActionError(e instanceof Error ? e.message : "Gagal menghapus. Coba lagi ya.");
  const delUser = useMutation({ mutationFn: api.adminDeleteUser, onSuccess: afterDelete, onError: onDeleteError });
  const delClass = useMutation({ mutationFn: api.adminDeleteClass, onSuccess: afterDelete, onError: onDeleteError });
  const delAttempt = useMutation({ mutationFn: api.adminDeleteAttempt, onSuccess: afterDelete, onError: onDeleteError });
  const deleting = delUser.isPending || delClass.isPending || delAttempt.isPending;

  const runDelete = () => {
    if (!confirm) return;
    setActionError("");
    if (confirm.kind === "user") delUser.mutate({ token, user_id: confirm.id });
    else if (confirm.kind === "class") delClass.mutate({ token, class_id: confirm.id });
    else delAttempt.mutate({ token, attempt_id: confirm.id });
  };

  const data = dash.data;
  const t = data?.totals;
  // Baris tabel selalu berupa array (kosong saat memuat/gagal) supaya
  // struktur panel — header tabel + baris kosong yang sopan — tetap tampil.
  const users = data?.users ?? [];
  const classes = data?.classes ?? [];
  const recentAttempts = data?.recent_attempts ?? [];
  // Angka ringkasan dihitung LANGSUNG dari baris tabel yang tampil, supaya
  // selalu sama dengan isi tabel & kartu statistik — tidak pernah 0 padahal
  // tabelnya berisi data.
  const adminCount = users.filter((u) => u.role === "admin").length;
  const openClassCount = classes.filter((c) => c.status === "open").length;
  const closedClassCount = classes.length - openClassCount;
  const totalClassParticipants = classes.reduce((sum, c) => sum + c.participant_count, 0);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10">
      <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "2px solid var(--gold)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ background: "#FFF3DC" }} aria-hidden>🛡️</span>
          <div className="min-w-0 flex-1 basis-48">
            <h1 className="font-display text-xl font-extrabold">Panel Superadmin — Halo, {user.name}!</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--dim)" }}>
              🛡️ Superadmin • @{user.username}{user.organization ? ` • ${user.organization}` : ""} • Pantau jumlah &amp; kelola seluruh data ZIQVA OLIM
            </p>
          </div>
          <button type="button" onClick={() => dash.refetch()} aria-label="Segarkan data superadmin" className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold" style={{ background: "var(--surface2)" }}>🔄 Segarkan</button>
          <button type="button" onClick={props.onProfile} aria-label="Buka halaman profil saya" className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold" style={{ background: "var(--surface2)" }}>👤 Profil Saya</button>
          <button type="button" onClick={props.onLogout} aria-label="Keluar dari akun superadmin" className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold text-white" style={{ background: "#D6336C" }}>Keluar</button>
        </div>
      </section>

      {/* Struktur panel SELALU tampil — kartu statistik + tiga tabel dengan
          header kolom — walau data masih kosong, sedang dimuat, atau gagal
          dimuat, supaya panel tidak pernah tampil kosong polos. */}
      {dash.isError && (
        <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "2px solid #D6336C" }} role="alert">
          <p className="font-display text-lg font-bold">⚠️ Data superadmin gagal dimuat</p>
          <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Koneksi atau server sedang bermasalah, atau sesi login sudah berakhir. Struktur panel tetap ditampilkan di bawah — coba muat ulang datanya ya.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => dash.refetch()} className="font-display min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>🔄 Coba Lagi</button>
            <button type="button" onClick={props.onLogout} className="font-display min-h-[52px] rounded-2xl px-6 font-bold" style={{ background: "var(--surface2)" }}>Masuk Lagi</button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-busy={dash.isPending}>
        {[
          { label: "Total Peserta", value: t ? `${t.unique_students}` : "0", icon: "🧒" },
          { label: "Total Sesi Latihan/Ujian", value: t ? `${t.total_attempts}` : "0", icon: "🎯" },
          { label: "Akun Guru", value: t ? `${t.guru}` : "0", icon: "👨‍🏫" },
          { label: "Akun Orang Tua", value: t ? `${t.orangtua}` : "0", icon: "👨‍👩‍👧" },
          { label: "Kelas Aktif", value: t ? `${t.open_classes}` : "0", icon: "🏫" },
          { label: "Sedang Online", value: t ? `${t.online}` : "0", icon: "🟢" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-2xl" aria-hidden>{c.icon}</div>
            {dash.isPending ? (
              <div className="mx-auto mt-1 h-8 w-14 animate-pulse rounded-lg" style={{ background: "var(--surface2)" }} role="status" aria-label="Memuat angka statistik" />
            ) : (
              <div className="font-display text-2xl font-extrabold">{c.value}</div>
            )}
            <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>{c.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold" style={{ color: "var(--dim)" }}>
        Total akun terdaftar: {users.length} (termasuk {adminCount} Superadmin) • Total Kelas Ujian: {classes.length} ({openClassCount} aktif, {closedClassCount} ditutup) • Total peserta kelas: {totalClassParticipants}
      </p>
      {dash.isPending && <p className="mt-3 text-center text-sm font-semibold" style={{ color: "var(--dim)" }} role="status">⏳ Memuat data superadmin…</p>}

      <AdminChallengeCard token={token} />

      <h2 className="font-display mt-6 text-lg font-bold">👥 Akun Terdaftar ({users.length})</h2>
      <div className="mt-2 overflow-x-auto rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <table className="w-full min-w-[600px] border-collapse text-left text-[13px]">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "9%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Nama", "Username", "Peran", "Organisasi", "WhatsApp", "Email", "Terdaftar", "Aksi"].map((h) => (
                <th key={h} scope="col" className="px-2 py-2 sm:px-2.5 text-xs font-extrabold whitespace-nowrap" style={{ color: "var(--dim)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dash.isPending ? (
              <tr><td colSpan={8} className="px-2 py-6 text-center font-semibold" style={{ color: "var(--dim)" }}>⏳ Memuat data akun…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="px-2 py-6 text-center font-semibold" style={{ color: "var(--dim)" }}>Belum ada akun terdaftar.</td></tr>
            ) : users.map((u) => {
              const isSelf = u.id === user.id;
              const isAdmin = u.role === "admin";
              return (
                <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-2 py-2.5 sm:px-2.5 font-display font-bold whitespace-nowrap">{u.name}</td>
                  <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap" style={{ color: "var(--dim)" }}>@{u.username}</td>
                  <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{adminRoleLabel(u.role)}</td>
                  <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{u.organization || "—"}</td>
                  <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">
                    {u.whatsapp ? (
                      <a href={waChatUrl(u.whatsapp)} target="_blank" rel="noreferrer" aria-label={`Chat WhatsApp ${u.name}`} className="font-bold underline" style={{ color: "#1E7A46" }}>💬 {u.whatsapp}</a>
                    ) : "—"}
                  </td>
                  <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">
                    {u.email ? (
                      <a href={`mailto:${u.email}`} aria-label={`Kirim email ke ${u.name}`} className="underline" style={{ color: "var(--accent)" }}>{u.email}</a>
                    ) : "—"}
                  </td>
                  <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap" style={{ color: "var(--dim)" }}>{new Date(u.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">
                    {isSelf ? (
                      <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "#FFF3DC", color: "#92600A" }}>Akun kamu</span>
                    ) : isAdmin ? (
                      <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "var(--surface2)", color: "var(--dim)" }}>Superadmin</span>
                    ) : (
                      <button type="button" onClick={() => { setActionError(""); setConfirm({ kind: "user", id: u.id, label: `akun ${u.name} (@${u.username})` }); }}
                        aria-label={`Hapus akun ${u.name}`}
                        className="min-h-[40px] rounded-full px-3 font-display text-[13px] font-bold text-white" style={{ background: "#D6336C" }}>🗑️ Hapus</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="font-display mt-6 text-lg font-bold">🏫 Semua Kelas Ujian ({classes.length})</h2>
      <div className="mt-2 overflow-x-auto rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <colgroup>
            <col style={{ width: "17%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Nama Kelas", "Guru", "Jenjang", "Mapel", "Level", "Status", "Peserta", "Selesai", "Aksi"].map((h) => (
                <th key={h} scope="col" className="px-2 py-2 sm:px-2.5 text-xs font-extrabold whitespace-nowrap" style={{ color: "var(--dim)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dash.isPending ? (
              <tr><td colSpan={9} className="px-2 py-6 text-center font-semibold" style={{ color: "var(--dim)" }}>⏳ Memuat data kelas…</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={9} className="px-2 py-6 text-center font-semibold" style={{ color: "var(--dim)" }}>Belum ada kelas.</td></tr>
            ) : classes.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-2 py-2.5 sm:px-2.5 font-display font-bold whitespace-nowrap">{c.class_name}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{c.teacher_name}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{c.jenjang}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{c.subject_name}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">Level {c.level}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{c.status === "open" ? "🟢 Aktif" : "🔴 Ditutup"}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{c.participant_count} peserta</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{c.finished_count} selesai</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">
                  <button type="button" onClick={() => { setActionError(""); setConfirm({ kind: "class", id: c.id, label: `kelas "${c.class_name}" beserta semua pesertanya` }); }}
                    aria-label={`Hapus kelas ${c.class_name}`}
                    className="min-h-[40px] rounded-full px-3 font-display text-[13px] font-bold text-white" style={{ background: "#D6336C" }}>🗑️ Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-display mt-6 text-lg font-bold">🕐 Aktivitas Nilai Terakhir (50 terbaru)</h2>
      <div className="mt-2 overflow-x-auto rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <table className="w-full min-w-[600px] border-collapse text-left text-[13px]">
          <colgroup>
            <col style={{ width: "15%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Peserta", "Jenjang", "Mapel", "Mode", "Skor", "Hasil", "Durasi", "Waktu", "Aksi"].map((h) => (
                <th key={h} scope="col" className="px-2 py-2 sm:px-2.5 text-xs font-extrabold whitespace-nowrap" style={{ color: "var(--dim)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dash.isPending ? (
              <tr><td colSpan={9} className="px-2 py-6 text-center font-semibold" style={{ color: "var(--dim)" }}>⏳ Memuat aktivitas nilai…</td></tr>
            ) : recentAttempts.length === 0 ? (
              <tr><td colSpan={9} className="px-2 py-6 text-center font-semibold" style={{ color: "var(--dim)" }}>Belum ada aktivitas nilai.</td></tr>
            ) : recentAttempts.map((a) => (
              <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-2 py-2.5 sm:px-2.5 font-display font-bold whitespace-nowrap">{a.student_name}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{a.jenjang}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{a.mapel}{a.class_name === "Ujian Sertifikat" ? <span className="font-display ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap" style={{ background: "#FFF3DC", color: "#92600A", border: "1px solid var(--gold)" }}>🏆 Ujian Sertifikat</span> : a.class_name ? <span className="ml-1.5 text-xs font-semibold whitespace-nowrap" style={{ color: "var(--dim)" }}>🏫 {a.class_name}</span> : null}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{a.mode === "ujian" ? "🏆 Ujian" : "✏️ Latihan"}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">
                  <span className="font-display inline-flex min-w-[44px] items-center justify-center rounded-lg px-2 py-1 font-extrabold text-white" style={{ background: a.score >= 75 ? "#1E7A46" : a.score >= 60 ? "#D97706" : "#6E6785" }}>{a.score}</span>
                </td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{a.correct}/{a.total} benar</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">{fmtDur(a.duration_sec)}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap" style={{ color: "var(--dim)" }}>{new Date(a.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-2 py-2.5 sm:px-2.5 whitespace-nowrap">
                  <button type="button" onClick={() => { setActionError(""); setConfirm({ kind: "attempt", id: a.id, label: `nilai ${a.student_name} (${a.mapel}, skor ${a.score})` }); }}
                    aria-label={`Hapus nilai ${a.student_name} pada ${a.mapel}`}
                    className="min-h-[40px] rounded-full px-3 font-display text-[13px] font-bold text-white" style={{ background: "#D6336C" }}>🗑️ Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Konfirmasi hapus data">
          <section className="pop-in w-full max-w-md rounded-3xl p-6 shadow-xl" style={{ background: "var(--surface)", border: "2px solid #D6336C" }}>
            <div className="text-center text-5xl" aria-hidden>⚠️</div>
            <h2 className="font-display mt-2 text-center text-xl font-extrabold">Hapus {confirm.label}?</h2>
            <p className="mt-1 text-center text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
              Data yang sudah dihapus <strong>tidak bisa dikembalikan</strong>. Pastikan memang data ini yang mau dihapus ya.
            </p>
            {actionError && <p className="mt-3 rounded-xl px-3 py-2 text-sm font-bold text-red-600" style={{ background: "#FAE7E9" }} role="alert">{actionError}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setConfirm(null); setActionError(""); }} disabled={deleting}
                className="font-display min-h-[52px] rounded-2xl font-bold disabled:opacity-50" style={{ background: "var(--surface2)" }}>Batal</button>
              <button type="button" onClick={runDelete} disabled={deleting}
                className="font-display min-h-[52px] rounded-2xl font-bold text-white disabled:opacity-50" style={{ background: "#D6336C" }}>
                {deleting ? "Menghapus…" : "🗑️ Ya, Hapus"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

/* ---------------- PAPAN PERINGKAT PER JENJANG ----------------
   Peringkat resmi per jenjang, berdasarkan NAMA PESERTA. Setiap peserta
   tampil SATU kali dengan skor TERBAIKnya di jenjang itu (semua mapel
   digabung). Urutan: nilai tertinggi dulu — bila nilainya SAMA, yang
   menyelesaikan lebih CEPAT yang menang (aturan dari permintaan user).
   Data diambil dari aksi server getLeaderboard (semua perangkat). */
const RANK_MEDALS = ["🥇", "🥈", "🥉"];
function LeaderboardView(props: { initialJenjang: JenjangId; myName: string; onPractice: () => void }) {
  const [selJenjang, setSelJenjang] = useState<JenjangId>(props.initialJenjang);
  useEffect(() => { setSelJenjang(props.initialJenjang); }, [props.initialJenjang]);
  const board = useQuery({ queryKey: ["leaderboard", selJenjang], queryFn: () => api.getLeaderboard({ jenjang: selJenjang, limit: 50 }) });
  const entries = board.data?.entries ?? [];
  const myKey = props.myName.trim().toLowerCase();
  const myEntry = myKey ? entries.find((e) => e.student_name.trim().toLowerCase() === myKey) : undefined;
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const jenjangName = JENJANG.find((j) => j.id === selJenjang)?.name ?? selJenjang;

  const rowStyle = (isMe: boolean) => ({
    background: isMe ? "#FFF3DC" : "var(--surface)",
    border: `2px solid ${isMe ? "var(--gold)" : "var(--border)"}`,
  } as const);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10">
      <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold">🏆 Papan Peringkat per Jenjang</h1>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
              Peringkat berdasarkan <strong>nama peserta</strong>: setiap peserta tampil satu kali dengan <strong>skor terbaiknya</strong> di jenjang ini (semua mata pelajaran digabung).
              Bila nilainya <strong>sama</strong>, yang menang adalah yang <strong>mengerjakan paling cepat</strong> ⏱️ — jadi kerjakan dengan tepat <em>dan</em> cepat!
            </p>
          </div>
          <button type="button" onClick={() => board.refetch()} aria-label="Segarkan papan peringkat" className="min-h-[44px] shrink-0 rounded-full px-4 font-display text-sm font-bold" style={{ background: "var(--surface2)" }}>🔄 Segarkan</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pilih jenjang peringkat">
          {JENJANG.map((j) => (
            <button key={j.id} type="button" onClick={() => setSelJenjang(j.id)} aria-pressed={selJenjang === j.id} aria-label={`Peringkat jenjang ${j.name}`}
              className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold"
              style={{ background: selJenjang === j.id ? "var(--accent)" : "var(--surface2)", color: selJenjang === j.id ? "#fff" : "var(--dim)", border: "1px solid var(--border)" }}>
              {j.name}
            </button>
          ))}
        </div>
        {board.data && board.data.total_participants > 0 && (
          <p className="mt-3 text-sm font-bold" style={{ color: "var(--dim)" }}>
            👥 {board.data.total_participants} peserta • 🎯 {board.data.total_attempts} sesi selesai di jenjang {jenjangName}
          </p>
        )}
      </section>

      {myKey && board.data && (
        myEntry ? (
          <section className="pop-in mt-4 rounded-3xl p-4 text-center shadow-sm" style={{ background: "#FFF3DC", border: "2px solid var(--gold)" }} role="status" aria-label="Posisi peringkat saya">
            <p className="font-display text-lg font-extrabold">🎉 {props.myName.trim()} ada di peringkat #{myEntry.rank} jenjang {jenjangName}!</p>
            <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--dim)" }}>Skor terbaik {myEntry.score} • ⏱ {fmtDur(myEntry.duration_sec)} • {myEntry.mapel}. {myEntry.rank > 1 ? "Sedikit lagi naik ke puncak — coba lagi dan kerjakan lebih cepat!" : "Kamu sang juara jenjang ini — pertahankan posisimu! 👑"}</p>
          </section>
        ) : (
          <section className="mt-4 rounded-3xl p-4 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }} role="status" aria-label="Nama saya belum masuk peringkat">
            <p className="text-sm font-semibold" style={{ color: "var(--dim)" }}>Nama <strong>{props.myName.trim()}</strong> belum masuk peringkat jenjang {jenjangName} — selesaikan satu sesi di jenjang ini, lalu namamu tampil di sini. 💪</p>
          </section>
        )
      )}

      {board.isPending && <p className="mt-4" style={{ color: "var(--dim)" }}>Memuat papan peringkat…</p>}
      {board.isError && (
        <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="font-display text-lg font-bold">Peringkat belum bisa dimuat</p>
          <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Koneksi atau server sedang bermasalah. Coba lagi ya.</p>
          <button type="button" onClick={() => board.refetch()} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>🔄 Coba Lagi</button>
        </div>
      )}

      {board.data && entries.length === 0 && (
        <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-5xl" aria-hidden>🏆</div>
          <p className="font-display mt-2 text-lg font-bold">Belum ada pemenang di jenjang {jenjangName}</p>
          <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: "var(--dim)" }}>Peringkat ini masih kosong — jadilah peserta pertama yang naik podium! Selesaikan satu sesi {SESSION_SIZE} soal di jenjang {jenjangName}, dan namamu langsung tercatat di sini.</p>
          <button type="button" onClick={props.onPractice} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>🚀 Mulai Latihan Sekarang →</button>
        </div>
      )}

      {podium.length > 0 && (
        <>
          <h2 className="font-display mt-6 text-lg font-bold">👑 Podium Juara — {jenjangName}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {podium.map((e) => {
              const isMe = myKey !== "" && e.student_name.trim().toLowerCase() === myKey;
              return (
                <article key={e.rank} className="pop-in rounded-3xl p-4 text-center shadow-sm" style={rowStyle(isMe)} aria-label={`Peringkat ${e.rank}: ${e.student_name}, skor ${e.score}, waktu ${fmtDur(e.duration_sec)}`}>
                  <div className="text-4xl" aria-hidden>{RANK_MEDALS[e.rank - 1]}</div>
                  <div className="font-display mt-1 truncate text-lg font-extrabold">{e.student_name} {isMe && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: "var(--accent)" }}>KAMU</span>}</div>
                  <div className="font-display text-4xl leading-none font-extrabold" style={{ color: medalFor(e.score).color }}>{e.score}</div>
                  <div className="mt-1 text-xs font-bold" style={{ color: "var(--dim)" }}>SKOR TERBAIK • ⏱ {fmtDur(e.duration_sec)}</div>
                  <div className="mt-1.5 text-xs leading-relaxed font-semibold" style={{ color: "var(--dim)" }}>
                    {e.mapel} • {e.correct}/{e.total} benar<br />
                    {e.attempts_count}× latihan di jenjang ini • {new Date(e.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="font-display mt-6 text-lg font-bold">📋 Peringkat Berikutnya</h2>
          <div className="mt-2 grid gap-2">
            {rest.map((e) => {
              const isMe = myKey !== "" && e.student_name.trim().toLowerCase() === myKey;
              return (
                <div key={e.rank} className="flex items-center gap-3 rounded-2xl p-4" style={rowStyle(isMe)} aria-label={`Peringkat ${e.rank}: ${e.student_name}, skor ${e.score}, waktu ${fmtDur(e.duration_sec)}`}>
                  <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white" style={{ background: "var(--accent)" }}>{e.rank}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display font-bold">{e.student_name} {isMe && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: "var(--accent)" }}>KAMU</span>}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>
                      {e.mapel} • {e.correct}/{e.total} benar • ⏱ {fmtDur(e.duration_sec)} • {e.attempts_count}× latihan • {new Date(e.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-2xl leading-none font-extrabold" style={{ color: medalFor(e.score).color }}>{e.score}</div>
                    <div className="text-[10px] font-bold" style={{ color: "var(--dim)" }}>SKOR</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {entries.length > 0 && (
        <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: "var(--dim)" }}>
          Aturan peringkat: skor terbaik per nama peserta di jenjang ini • nilai sama → waktu pengerjaan tercepat menang • peringkat diperbarui setiap ada sesi yang selesai.
        </p>
      )}
    </main>
  );
}

/* ---------------- SISTEM POIN & CHALLENGE BULANAN ----------------
   Poin & Skor Juara dihitung SERVER dari nilai sungguhan bulan berjalan
   (aksi getMonthlyChallenge): POIN = jawaban benar × 10,
   SKOR JUARA = poin × ketepatan. FINISHER = sesi bulan ini mencapai
   target dari pengaturan Superadmin. Judul & hadiah juga dari pengaturan
   (aksi getSettings / adminSetSetting). */
type ChallengeEntry = ApiResponse<typeof api, "getMonthlyChallenge">["entries"][number];

function FinisherBadge() {
  return (
    <span className="font-display inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap" style={{ background: "#1E7A46", color: "#fff" }}>🏁 Finisher</span>
  );
}

function ChallengePodiumCard(props: { entry: ChallengeEntry; rank: number; isMe: boolean }) {
  const { entry: e, rank, isMe } = props;
  return (
    <article className="pop-in rounded-3xl p-4 text-center shadow-sm sm:p-5"
      style={{ background: isMe ? "#FFF3DC" : "var(--surface)", border: `2px solid ${isMe ? "var(--gold)" : "var(--border)"}` }}
      aria-label={`Peringkat ${rank}: ${e.name}, Skor Juara ${e.champion_score}, ${e.points} poin, ketepatan ${e.accuracy} persen, ${e.sessions} sesi${e.finisher ? ", Finisher" : ""}`}>
      <div className="text-4xl" aria-hidden>{RANK_MEDALS[rank - 1]}</div>
      <div className="font-display mt-1 truncate text-lg font-extrabold">
        {e.name}{" "}
        {isMe && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: "var(--accent)" }}>Ini kamu!</span>}
      </div>
      <div className="text-xs font-bold" style={{ color: "var(--dim)" }}>{e.jenjang}</div>
      <div className="font-display mt-1 text-4xl leading-none font-extrabold" style={{ color: "#D97706" }}>{fmtNum(e.champion_score)}</div>
      <div className="mt-1 text-xs font-bold tracking-wide" style={{ color: "var(--dim)" }}>SKOR JUARA</div>
      <div className="mt-1.5 text-xs leading-relaxed font-semibold" style={{ color: "var(--dim)" }}>
        🪙 {fmtNum(e.points)} poin • 🎯 {e.accuracy}% tepat • 📚 {e.sessions} sesi
      </div>
      {e.finisher && <div className="mt-2"><FinisherBadge /></div>}
    </article>
  );
}

const CHALLENGE_DIVISIONS: { id: string; label: string }[] = [
  { id: "", label: "Semua" },
  { id: "TK", label: "TK" },
  { id: "SD", label: "SD" },
  { id: "SMP", label: "SMP" },
  { id: "SMA", label: "SMA" },
];

function ChallengeView(props: { myName: string; onPractice: () => void }) {
  const [division, setDivision] = useState("");
  const global = useQuery({ queryKey: ["monthly-challenge", ""], queryFn: () => api.getMonthlyChallenge({}) });
  const board = useQuery({
    queryKey: ["monthly-challenge", division],
    queryFn: () => api.getMonthlyChallenge(division ? { jenjang: division } : {}),
  });
  const g = global.data;
  const settings = board.data?.settings ?? g?.settings;
  const period = g?.period ?? board.data?.period;
  const title = settings?.challenge_title?.trim()
    ? settings.challenge_title
    : `Challenge ${period?.label ?? "Bulan Ini"}`;
  const target = settings?.target_sessions ?? 10;
  const entries = board.data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myKey = props.myName.trim().toLowerCase();
  const isMe = (e: ChallengeEntry) => myKey !== "" && e.name.trim().toLowerCase() === myKey;
  const divisionLabel = division === "" ? "Semua Divisi" : `Divisi ${division}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10">
      <section className="mt-5 rounded-3xl p-5 shadow-sm sm:p-6 lg:p-8" style={{ background: "linear-gradient(150deg,#1E2A78,#2B3A9E)", border: "2px solid var(--gold)", color: "#fff" }}>
        <span className="font-display inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }}>
          🟢 SEDANG BERJALAN{period ? ` • SISA ${period.days_left} HARI` : ""}
        </span>
        <h1 className="font-display mt-3 text-2xl leading-tight font-extrabold sm:text-3xl">🏆 {title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.85)" }}>
          Kumpulkan poin dari jawaban benar sepanjang {period?.label ?? "bulan ini"}, jaga ketepatanmu, dan jadilah juara divisimu.
          Hanya <strong>Finisher</strong> — peserta yang menuntaskan minimal <strong>{target} sesi</strong> bulan ini — yang berhak menyandang gelar juara &amp; menerima hadiah! 🎁
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-2xl px-4 py-2 text-center" style={{ background: "rgba(255,255,255,.14)" }}>
            <span className="font-display block text-xl leading-none font-extrabold">{g ? fmtNum(g.total_participants) : "…"}</span>
            <span className="text-[11px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,.8)" }}>PESERTA BULAN INI</span>
          </span>
          <span className="rounded-2xl px-4 py-2 text-center" style={{ background: "rgba(255,255,255,.14)" }}>
            <span className="font-display block text-xl leading-none font-extrabold">{g ? fmtNum(g.total_finishers) : "…"}</span>
            <span className="text-[11px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,.8)" }}>SUDAH FINISHER</span>
          </span>
          <button type="button" onClick={() => { global.refetch(); board.refetch(); }} aria-label="Segarkan papan challenge"
            className="font-display ml-auto min-h-[44px] self-center rounded-full px-4 text-sm font-bold" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>🔄 Segarkan</button>
        </div>
      </section>

      <section className="mt-4 rounded-3xl p-5 shadow-sm sm:p-6" style={{ background: "#FFF7E0", border: "2px solid var(--gold)" }} aria-label="Hadiah challenge bulan ini">
        <h2 className="font-display text-lg font-extrabold" style={{ color: "#92600A" }}>🎁 Hadiah Bulan Ini</h2>
        {settings?.prize_text?.trim() ? (
          <p className="mt-1 text-[15px] leading-relaxed font-semibold whitespace-pre-line" style={{ color: "#5C430A" }}>{settings.prize_text}</p>
        ) : (
          <p className="mt-1 text-[15px] leading-relaxed font-semibold" style={{ color: "#5C430A" }}>
            Hadiah bulan ini sedang disiapkan — kumpulkan poin sebanyak-banyaknya! Juara tiap divisi berhak atas hadiah &amp; sertifikat.
          </p>
        )}
      </section>

      <section className="mt-4 rounded-3xl p-5 shadow-sm sm:p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} aria-label="Cara bermain challenge">
        <h2 className="font-display text-lg font-extrabold">🎮 Cara Mainnya</h2>
        <ul className="mt-2 grid gap-2 text-sm leading-relaxed font-semibold sm:grid-cols-3 lg:gap-3" style={{ color: "var(--dim)" }}>
          <li className="rounded-2xl p-3 lg:p-4" style={{ background: "var(--surface2)" }}>🪙 <strong style={{ color: "var(--text)" }}>Kumpulkan Poin</strong><br />Setiap jawaban benar = <strong style={{ color: "var(--text)" }}>10 poin</strong>, dari semua sesi yang kamu selesaikan bulan ini.</li>
          <li className="rounded-2xl p-3 lg:p-4" style={{ background: "var(--surface2)" }}>👑 <strong style={{ color: "var(--text)" }}>Skor Juara = Poin × Ketepatan</strong><br />Rajin saja tidak cukup — jawabanmu juga harus tepat. Asal cepat tanpa benar tidak akan menang!</li>
          <li className="rounded-2xl p-3 lg:p-4" style={{ background: "var(--surface2)" }}>🏁 <strong style={{ color: "var(--text)" }}>Jadi Finisher</strong><br />Tuntaskan minimal <strong style={{ color: "var(--text)" }}>{target} sesi</strong> bulan ini untuk berhak menjadi juara divisimu.</li>
        </ul>
      </section>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Pilih divisi challenge">
        {CHALLENGE_DIVISIONS.map((d) => (
          <button key={d.id || "semua"} type="button" onClick={() => setDivision(d.id)} aria-pressed={division === d.id} aria-label={`Lihat papan challenge ${d.label === "Semua" ? "semua divisi" : `divisi ${d.label}`}`}
            className="min-h-[44px] rounded-full px-4 font-display text-sm font-bold"
            style={{ background: division === d.id ? "var(--accent)" : "var(--surface)", color: division === d.id ? "#fff" : "var(--dim)", border: "1px solid var(--border)" }}>
            {d.label}
          </button>
        ))}
      </div>

      {board.isPending && <p className="mt-4" style={{ color: "var(--dim)" }} role="status">Memuat papan challenge…</p>}
      {board.isError && (
        <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="font-display text-lg font-bold">Papan challenge belum bisa dimuat</p>
          <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Koneksi atau server sedang bermasalah. Coba lagi ya.</p>
          <button type="button" onClick={() => board.refetch()} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>🔄 Coba Lagi</button>
        </div>
      )}

      {board.data && entries.length === 0 && (
        <div className="mt-4 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-5xl" aria-hidden>🏆</div>
          <p className="font-display mt-2 text-lg font-bold">Belum ada peserta bulan ini — jadilah yang pertama naik podium!</p>
          <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: "var(--dim)" }}>
            {division === "" ? "Papan challenge bulan ini masih kosong." : `Divisi ${division} masih kosong bulan ini.`} Selesaikan sesimu sekarang — setiap jawaban benar langsung jadi poin!
          </p>
          <button type="button" onClick={props.onPractice} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>🚀 Mulai &amp; Kumpulkan Poin →</button>
        </div>
      )}

      {podium.length > 0 && (
        <>
          <h2 className="font-display mt-6 text-lg font-bold">👑 Podium — {divisionLabel}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:gap-3">
            {podium.map((e, i) => (
              <ChallengePodiumCard key={`${e.name}-${i}`} entry={e} rank={i + 1} isMe={isMe(e)} />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="font-display mt-6 text-lg font-bold">📋 Peringkat Berikutnya — {divisionLabel}</h2>
          <div className="mt-2 grid gap-2 xl:grid-cols-2">
            {rest.map((e, i) => {
              const rank = i + 4;
              const me = isMe(e);
              return (
                <div key={`${e.name}-${rank}`} className="flex items-center gap-3 rounded-2xl p-4"
                  style={{ background: me ? "#FFF3DC" : "var(--surface)", border: `2px solid ${me ? "var(--gold)" : "var(--border)"}` }}
                  aria-label={`Peringkat ${rank}: ${e.name}, jenjang ${e.jenjang}, Skor Juara ${e.champion_score}, ${e.points} poin, ${e.questions} soal, ketepatan ${e.accuracy} persen, ${e.sessions} sesi${e.finisher ? ", Finisher" : ""}`}>
                  <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white" style={{ background: "var(--accent)" }}>{rank}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display font-bold">
                      {e.name}{" "}
                      {me && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: "var(--accent)" }}>Ini kamu!</span>}{" "}
                      {e.finisher && <FinisherBadge />}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>
                      {e.jenjang} • 🪙 {fmtNum(e.points)} poin • 📚 {fmtNum(e.questions)} soal • 🎯 {e.accuracy}% tepat • {e.sessions} sesi • {e.finisher ? "🏁 Finisher" : `Menuju Finisher (${e.sessions}/${target} sesi)`}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-2xl leading-none font-extrabold" style={{ color: "#D97706" }}>{fmtNum(e.champion_score)}</div>
                    <div className="text-[10px] font-bold" style={{ color: "var(--dim)" }}>SKOR JUARA</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {entries.length > 0 && (
        <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: "var(--dim)" }}>
          Aturan challenge: poin = jawaban benar bulan ini × 10 • Skor Juara = poin × ketepatan • Finisher (≥ {target} sesi) yang berhak menjadi juara • papan diperbarui setiap ada sesi yang selesai.
        </p>
      )}
    </main>
  );
}

/* Papan juara ringkas di Beranda: podium 3 teratas global bulan berjalan
   + peringkat 4–5, gaya visual ZIQVA OLIM (biru dongker & emas). */
function HomeChampionBoard(props: { myName: string; onOpenChallenge: () => void; onPractice: () => void }) {
  const board = useQuery({ queryKey: ["monthly-challenge", ""], queryFn: () => api.getMonthlyChallenge({}) });
  const data = board.data;
  const entries = data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3, 5);
  const myKey = props.myName.trim().toLowerCase();
  const target = data?.settings.target_sessions ?? 10;

  return (
    <section className="mt-5 overflow-hidden rounded-3xl shadow-sm" style={{ background: "linear-gradient(155deg,#1E2A78,#232F6E)", border: "2px solid var(--gold)", color: "#fff" }} aria-label="Papan juara bulan ini">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display flex-1 text-xl font-extrabold sm:text-2xl">🌟 Papan Juara Bulan Ini</h2>
          {data && (
            <span className="font-display rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }}>
              {data.period.label.toUpperCase()} • SISA {data.period.days_left} HARI
            </span>
          )}
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.85)" }}>
          Para pejuang teratas bulan ini berebut hadiah juara! Setiap jawaban benar = <strong>10 poin</strong>, dan <strong>Skor Juara = poin × ketepatan</strong>.
          Baru pertama kali di sini? Selesaikan sesimu, tuntaskan {target} sesi untuk jadi <strong>Finisher</strong>, dan namamu bisa tampil di podium ini! 🚀
        </p>

        {board.isPending && <p className="mt-4 text-sm font-semibold" style={{ color: "rgba(255,255,255,.8)" }} role="status">⏳ Memuat papan juara…</p>}
        {board.isError && (
          <div className="mt-4">
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>Papan juara belum bisa dimuat saat ini.</p>
            <button type="button" onClick={() => board.refetch()} className="font-display mt-2 min-h-[44px] rounded-full px-4 text-sm font-bold" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>🔄 Coba Lagi</button>
          </div>
        )}

        {data && entries.length === 0 && (
          <div className="mt-4 rounded-3xl p-5 text-center" style={{ background: "rgba(255,255,255,.1)", border: "2px dashed var(--gold)" }}>
            <div className="text-4xl" aria-hidden>👑</div>
            <p className="font-display mt-1 text-lg font-extrabold">Podium bulan ini masih kosong — selesaikan sesimu dan jadilah juara pertama!</p>
            <button type="button" onClick={props.onPractice} className="font-display mt-3 min-h-[52px] rounded-2xl px-6 font-bold" style={{ background: "var(--gold)", color: "#2B2440" }}>🚀 Mulai Sesi Pertamaku</button>
          </div>
        )}

        {podium.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {podium.map((e, i) => {
              const me = myKey !== "" && e.name.trim().toLowerCase() === myKey;
              return (
                <article key={`${e.name}-${i}`} className="rounded-3xl p-4 text-center" style={{ background: me ? "#FFF3DC" : "rgba(255,255,255,.1)", color: me ? "#2B2440" : "#fff", border: `2px solid ${me ? "var(--gold)" : "rgba(255,255,255,.25)"}` }}
                  aria-label={`Peringkat ${i + 1} bulan ini: ${e.name}, Skor Juara ${e.champion_score}`}>
                  <div className="text-3xl" aria-hidden>{RANK_MEDALS[i]}</div>
                  <div className="font-display mt-0.5 truncate text-base font-extrabold">{e.name} {me && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: "var(--accent)" }}>Ini kamu!</span>}</div>
                  <div className="font-display text-3xl leading-none font-extrabold" style={{ color: "#D97706" }}>{fmtNum(e.champion_score)}</div>
                  <div className="text-[11px] font-bold tracking-wide" style={{ color: me ? "var(--dim)" : "rgba(255,255,255,.75)" }}>
                    SKOR JUARA • {e.jenjang} • 🪙 {fmtNum(e.points)} poin • 🎯 {e.accuracy}% • {e.sessions} sesi{e.finisher ? " • 🏁 Finisher" : ""}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {rest.length > 0 && (
          <div className="mt-2 grid gap-2">
            {rest.map((e, i) => {
              const rank = i + 4;
              const me = myKey !== "" && e.name.trim().toLowerCase() === myKey;
              return (
                <div key={`${e.name}-${rank}`} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: me ? "#FFF3DC" : "rgba(255,255,255,.08)", color: me ? "#2B2440" : "#fff", border: "1px solid rgba(255,255,255,.2)" }}
                  aria-label={`Peringkat ${rank} bulan ini: ${e.name}, Skor Juara ${e.champion_score}`}>
                  <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }}>{rank}</span>
                  <div className="min-w-0 flex-1 truncate font-display font-bold">{e.name} {me && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: "var(--accent)" }}>Ini kamu!</span>}</div>
                  <div className="shrink-0 text-xs font-semibold" style={{ color: me ? "var(--dim)" : "rgba(255,255,255,.75)" }}>{e.jenjang} • {e.sessions} sesi{e.finisher ? " • 🏁" : ""}</div>
                  <div className="font-display shrink-0 text-xl font-extrabold" style={{ color: "#FFB62E" }}>{fmtNum(e.champion_score)}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="flex-1 text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
            {data ? `👥 ${fmtNum(data.total_participants)} peserta ikut bulan ini • 🏁 ${fmtNum(data.total_finishers)} sudah Finisher.` : ""} Hadiah &amp; sertifikat menanti juara tiap divisi!
          </p>
          <button type="button" onClick={props.onOpenChallenge} aria-label="Buka halaman challenge bulanan"
            className="font-display min-h-[52px] shrink-0 rounded-2xl px-6 font-bold" style={{ background: "var(--gold)", color: "#2B2440" }}>
            🏆 Lihat Challenge
          </button>
        </div>
      </div>
    </section>
  );
}

/* Kartu pengaturan Challenge di Panel Superadmin: judul, hadiah, dan
   target Finisher disimpan lewat adminSetSetting; ringkasan bulan
   berjalan membantu pemilik menentukan pemenang di akhir bulan. */
function AdminChallengeCard(props: { token: string }) {
  const queryClient = useQueryClient();
  const { token } = props;
  const settingsQ = useQuery({ queryKey: ["challenge-settings"], queryFn: () => api.getSettings({}) });
  const board = useQuery({ queryKey: ["monthly-challenge", ""], queryFn: () => api.getMonthlyChallenge({}) });
  const [title, setTitle] = useState("");
  const [prize, setPrize] = useState("");
  const [target, setTarget] = useState("10");
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    if (settingsQ.data && !loaded) {
      setTitle(settingsQ.data.challenge_title);
      setPrize(settingsQ.data.prize_text);
      setTarget(String(settingsQ.data.target_sessions));
      setLoaded(true);
    }
  }, [settingsQ.data, loaded]);

  const save = useMutation({
    mutationFn: async () => {
      await api.adminSetSetting({ token, key: "challenge_title", value: title });
      await api.adminSetSetting({ token, key: "prize_text", value: prize });
      return api.adminSetSetting({ token, key: "challenge_target_sessions", value: target });
    },
    onSuccess: () => {
      setMsg("✅ Pengaturan challenge tersimpan — judul, hadiah & target Finisher sudah diperbarui di Beranda dan halaman Challenge.");
      setErr("");
      queryClient.invalidateQueries({ queryKey: ["challenge-settings"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-challenge"] });
    },
    onError: (e: unknown) => {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan pengaturan. Coba lagi ya.");
      setMsg("");
    },
  });

  const top3 = board.data?.entries.slice(0, 3) ?? [];
  const inputStyle = { background: "var(--surface2)", border: "2px solid var(--border)" } as const;

  return (
    <section className="mt-6 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "2px solid var(--gold)" }} aria-label="Pengaturan challenge bulanan">
      <h2 className="font-display text-lg font-bold">🎁 Pengaturan Challenge</h2>
      <p className="mt-0.5 text-sm" style={{ color: "var(--dim)" }}>
        Judul, hadiah, dan target Finisher di bawah ini tampil langsung di Beranda &amp; halaman Challenge. Kosongkan judul untuk memakai nama bawaan “Challenge &lt;Bulan&gt; &lt;Tahun&gt;”.
      </p>
      <div className="mt-3 grid gap-3">
        <div>
          <label htmlFor="challenge-title" className="font-display text-sm font-bold">Judul Challenge</label>
          <input id="challenge-title" {...FIELDS.adminSetSetting.value} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Challenge November: Istana Ilmu"
            className="mt-1 min-h-[48px] w-full rounded-2xl px-4 text-base font-semibold outline-none" style={inputStyle} />
        </div>
        <div>
          <label htmlFor="challenge-prize" className="font-display text-sm font-bold">Hadiah Bulan Ini</label>
          <textarea id="challenge-prize" {...FIELDS.adminSetSetting.value} value={prize} onChange={(e) => setPrize(e.target.value)} rows={4}
            placeholder={"Contoh:\nJuara 1 tiap divisi: fresh money Rp100.000 + tumbler + sertifikat cetak\nJuara 2–3: tumbler + sertifikat cetak\nSemua Finisher: sertifikat digital"}
            className="mt-1 w-full rounded-2xl px-4 py-3 text-base font-semibold outline-none" style={inputStyle} />
          <p className="mt-1 text-xs font-semibold" style={{ color: "var(--dim)" }}>Boleh multi-baris — tulis satu hadiah per baris agar mudah dibaca peserta.</p>
        </div>
        <div className="max-w-xs">
          <label htmlFor="challenge-target" className="font-display text-sm font-bold">Target Finisher (sesi per bulan)</label>
          <input id="challenge-target" {...FIELDS.adminSetSetting.value} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="10" aria-describedby="challenge-target-help"
            className="mt-1 min-h-[48px] w-full rounded-2xl px-4 text-base font-semibold outline-none" style={inputStyle} />
          <p id="challenge-target-help" className="mt-1 text-xs font-semibold" style={{ color: "var(--dim)" }}>Peserta dengan sesi bulan ini ≥ angka ini berstatus Finisher dan berhak menjadi juara.</p>
        </div>
      </div>
      {msg && <p className="mt-3 rounded-xl px-3 py-2 text-sm font-bold" style={{ background: "#E2F4E9", color: "#14532D" }} role="status">{msg}</p>}
      {err && <p className="mt-3 rounded-xl px-3 py-2 text-sm font-bold text-red-600" style={{ background: "#FAE7E9" }} role="alert">{err}</p>}
      <button type="button" onClick={() => { setMsg(""); setErr(""); save.mutate(); }} disabled={save.isPending || settingsQ.isPending}
        aria-label="Simpan pengaturan challenge"
        className="font-display mt-3 min-h-[52px] rounded-2xl px-6 font-bold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
        {save.isPending ? "Menyimpan…" : "💾 Simpan Pengaturan Challenge"}
      </button>

      <div className="mt-5 rounded-2xl p-4" style={{ background: "var(--surface2)" }} aria-label="Ringkasan challenge bulan berjalan">
        <h3 className="font-display text-base font-extrabold">📊 Ringkasan Bulan Berjalan{board.data ? ` — ${board.data.period.label}` : ""}</h3>
        {board.isPending ? (
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--dim)" }} role="status">⏳ Memuat ringkasan challenge…</p>
        ) : board.isError ? (
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--dim)" }}>Ringkasan belum bisa dimuat. <button type="button" onClick={() => board.refetch()} className="font-bold underline">Coba lagi</button></p>
        ) : board.data && board.data.entries.length === 0 ? (
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--dim)" }}>Belum ada peserta bulan ini — belum ada calon pemenang.</p>
        ) : board.data ? (
          <>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--dim)" }}>
              👥 {fmtNum(board.data.total_participants)} peserta • 🏁 {fmtNum(board.data.total_finishers)} Finisher • ⏳ sisa {board.data.period.days_left} hari
            </p>
            <ol className="mt-2 grid gap-1.5">
              {top3.map((e, i) => (
                <li key={`${e.name}-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "var(--surface)" }}>
                  <span aria-hidden>{RANK_MEDALS[i]}</span>
                  <span className="font-display font-bold">{e.name}</span>
                  <span style={{ color: "var(--dim)" }}>{e.jenjang} • Skor Juara {fmtNum(e.champion_score)} • 🪙 {fmtNum(e.points)} poin • 🎯 {e.accuracy}% • {e.sessions} sesi</span>
                  {e.finisher && <FinisherBadge />}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs font-semibold" style={{ color: "var(--dim)" }}>Di akhir bulan, tentukan pemenang dari papan ini: utamakan Finisher dengan Skor Juara tertinggi di tiap divisi (TK/SD/SMP/SMA) lewat halaman Challenge.</p>
          </>
        ) : null}
      </div>
    </section>
  );
}

/* ---------------- PERPUSTAKAAN BELAJAR ---------------- */
function BelajarView(props: {
  jenjang: JenjangId;
  initialSubject: string;
  english?: boolean;
  onPractice: (subjectId: string) => void;
  onOpenModule: (module: LibraryModule, jenjang: JenjangId, subjectId: string) => void;
}) {
  const [libJenjang, setLibJenjang] = useState<JenjangId>(props.jenjang);
  const libSubjects = useMemo(() => SUBJECTS.filter((s) => s.jenjang.includes(libJenjang)), [libJenjang]);
  const [sel, setSel] = useState(props.initialSubject);
  const active = libSubjects.find((s) => s.id === sel) ?? libSubjects[0];
  const material = active ? materialFor(active.id) : null;
  const modules = active ? modulesFor(libJenjang, active.id, props.english) : [];
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
/* ---------------- AJAKAN DAFTAR (Guru & Orang Tua) ----------------
   Kartu ajakan mendaftar agar peringkat & pencapaian siswa terpantau dan
   tidak ter-reset. Murni tampilan: tombolnya membuka halaman Guru & Ortu
   pada tab Daftar Baru. Varian Beranda bisa ditutup permanen per perangkat
   (localStorage ziqva-cta-daftar-v1). */
const CTA_DISMISS_KEY = "ziqva-cta-daftar-v1";

function DaftarCtaCard(props: { variant: "home" | "result" | "history"; onDaftar: () => void; onClose?: () => void }) {
  if (props.variant === "result") {
    return (
      <div className="mx-auto mt-4 max-w-md rounded-2xl px-4 py-3 text-left" style={{ background: "#fff", border: "2px solid var(--gold)" }} aria-label="Ajakan mendaftar untuk guru dan orang tua">
        <p className="text-sm leading-relaxed font-semibold" style={{ color: "#2B2440" }}>
          🏆 Nilai kamu sudah masuk papan peringkat! Minta Ayah/Bunda atau gurumu mendaftar dan memasukkan Kode Pantau ini, supaya peringkat dan pencapaianmu terus terpantau dan tidak ter-reset. Daftarnya <strong>100% gratis</strong> — semua latihan di ZIQVA OLIM memang gratis, tanpa biaya apa pun! 🎁
        </p>
        <button type="button" onClick={props.onDaftar} aria-label="Daftar sebagai guru atau orang tua"
          className="font-display mt-3 min-h-[48px] w-full rounded-2xl px-5 font-bold text-white" style={{ background: "var(--accent)" }}>
          👨‍🏫 Daftar Guru / Orang Tua
        </button>
      </div>
    );
  }
  return (
    <section className="pop-in relative mt-5 rounded-3xl p-5 shadow-sm" style={{ background: "linear-gradient(150deg,#FFF3DC,#FDE7F3)", border: "2px solid var(--gold)" }} aria-label="Ajakan mendaftar untuk guru dan orang tua">
      {props.onClose && (
        <button type="button" onClick={props.onClose} aria-label="Tutup ajakan daftar" className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: "rgba(255,255,255,.7)", color: "#92600A" }}>✕</button>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="text-4xl" aria-hidden>📣</div>
        <div className="flex-1">
          <span className="font-display mb-1.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: "#1E7A46" }}>🎁 100% GRATIS</span>
          <h2 className="font-display pr-8 text-lg font-bold sm:pr-0">Ayo Daftar, Biar Pencapaian Tidak Hilang!</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
            {props.variant === "home"
              ? <>Daftarkan akun <strong>Guru / Orang Tua</strong> untuk memantau peringkat dan pencapaian siswa. Nilai dan riwayat tersimpan aman di awan — <strong>tidak ter-reset dan tidak hilang</strong> walau ganti HP atau browser.</>
              : <>Dengan akun <strong>Guru / Orang Tua</strong>, peringkat dan pencapaian bisa dipantau dari perangkat mana pun. Nilai dan riwayat tersimpan aman di awan — <strong>tidak ter-reset dan tidak hilang</strong> walau ganti HP atau browser.</>}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed font-semibold" style={{ color: "#1E7A46" }}>
            ZIQVA OLIM dibuat benar-benar gratis untuk latihan olimpiade — bekal masa depan anak, tanpa biaya apa pun. Ayo coba sekarang!
          </p>
        </div>
        <button type="button" onClick={props.onDaftar} aria-label={props.variant === "home" ? "Daftar sekarang sebagai guru atau orang tua, gratis" : "Daftar sebagai guru atau orang tua"}
          className="font-display min-h-[54px] shrink-0 rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>
          {props.variant === "home" ? "📝 Daftar Sekarang — Gratis" : "👨‍🏫 Daftar Guru / Orang Tua"}
        </button>
      </div>
    </section>
  );
}

/* ---------------- PROFIL SAYA ----------------
   Halaman data diri untuk pengguna yang login (Guru / Orang Tua /
   Superadmin): nama, nama anak, sekolah/instansi, WhatsApp, email, kota,
   dan alamat sekolah — semua bisa diedit & disimpan lewat updateProfile.
   Username & peran tampil sebagai info tetap. */
function ProfileView(props: { token: string; user: SessionUser; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { user } = props;
  const [pName, setPName] = useState(user.name);
  const [pChild, setPChild] = useState(user.child_name);
  const [pOrg, setPOrg] = useState(user.organization);
  const [pWa, setPWa] = useState(user.whatsapp);
  const [pEmail, setPEmail] = useState(user.email);
  const [pCity, setPCity] = useState(user.city);
  const [pAddr, setPAddr] = useState(user.school_address);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const save = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      setError("");
      setSavedMsg("✅ Profil berhasil disimpan! Data terbarumu sudah tercatat.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan profil. Coba lagi ya.";
      setSavedMsg("");
      setError(msg);
      if (msg.toLowerCase().includes("nama")) focusField("profile-name");
    },
  });

  const submit = () => {
    const nameProblem = validateDisplayName(pName);
    if (nameProblem) { setError(nameProblem); setSavedMsg(""); focusField("profile-name"); return; }
    if (!pWa.trim() && !pEmail.trim()) {
      setError("Isi minimal salah satu: Nomor WhatsApp atau Email, supaya kami bisa mengirim info olimpiade terbaru.");
      setSavedMsg("");
      focusField(pWa.trim() ? "profile-email" : "profile-whatsapp");
      return;
    }
    setError("");
    save.mutate({
      token: props.token, name: pName.trim(), child_name: pChild.trim(), organization: pOrg.trim(),
      whatsapp: pWa.trim(), email: pEmail.trim(), city: pCity.trim(), school_address: pAddr.trim(),
    });
  };

  const inputCls = "mt-1.5 min-h-[52px] w-full rounded-2xl px-4 text-base font-semibold outline-none";
  const inputStyle = { background: "var(--surface2)", border: "2px solid var(--border)" } as const;
  const labelCls = "font-display text-sm font-bold";
  const childLabel = user.role === "orangtua" ? "Nama Anak" : user.role === "guru" ? "Nama Anak (boleh dikosongkan)" : "Nama Anak (boleh dikosongkan)";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-10">
      <section className="mt-5 rounded-3xl p-5 shadow-sm sm:p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }} aria-hidden>{initialsOf(user.name)}</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-xl font-extrabold">👤 Profil Saya</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--dim)" }}>@{user.username} • {roleLabel(user.role)} — username &amp; peran tidak bisa diubah</p>
          </div>
          <button type="button" onClick={props.onBack} aria-label="Kembali ke dashboard" className="font-display min-h-[44px] rounded-full px-4 text-sm font-bold" style={{ background: "var(--surface2)" }}>← Kembali</button>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="profile-name" className={labelCls}>Nama Lengkap *</label>
            <input id="profile-name" {...FIELDS.updateProfile.name} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Nama lengkap kamu" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="profile-child" className={labelCls}>{childLabel}</label>
            <input id="profile-child" {...FIELDS.updateProfile.child_name} value={pChild} onChange={(e) => setPChild(e.target.value)} placeholder={user.role === "orangtua" ? "Nama anak yang dipantau / peserta" : "Nama anak, bila ada"} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="profile-org" className={labelCls}>Nama Sekolah / Instansi</label>
            <input id="profile-org" {...FIELDS.updateProfile.organization} value={pOrg} onChange={(e) => setPOrg(e.target.value)} placeholder="Contoh: SD Negeri 1 Sukamaju / RA Al-Ikhlas" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-whatsapp" className={labelCls}>Nomor WhatsApp</label>
              <input id="profile-whatsapp" {...FIELDS.updateProfile.whatsapp} value={pWa} onChange={(e) => setPWa(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="profile-email" className={labelCls}>Email</label>
              <input id="profile-email" {...FIELDS.updateProfile.email} value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="nama@email.com" inputMode="email" className={inputCls} style={inputStyle} />
            </div>
          </div>
          <p className="-mt-2 text-xs font-semibold" style={{ color: "var(--dim)" }}>Minimal isi salah satu (WhatsApp atau Email) — untuk menerima info olimpiade terbaru. Tidak dibagikan ke siapa pun.</p>
          <div>
            <label htmlFor="profile-city" className={labelCls}>Kota / Kabupaten</label>
            <input id="profile-city" {...FIELDS.updateProfile.city} value={pCity} onChange={(e) => setPCity(e.target.value)} placeholder="Contoh: Bandung / Kab. Sleman" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="profile-address" className={labelCls}>Alamat Sekolah</label>
            <textarea id="profile-address" {...FIELDS.updateProfile.school_address} value={pAddr} onChange={(e) => setPAddr(e.target.value)} placeholder="Jalan, nomor, kelurahan/desa, kecamatan — alamat sekolah atau instansi" rows={3}
              className="mt-1.5 w-full rounded-2xl px-4 py-3 text-base font-semibold outline-none" style={inputStyle} />
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl px-3 py-2 text-sm font-bold text-red-600" style={{ background: "#FAE7E9" }} role="alert">{error}</p>}
        {savedMsg && <p className="pop-in mt-4 rounded-xl px-3 py-2 text-sm font-bold" style={{ background: "#E2F4E9", color: "#14532D" }} role="status">{savedMsg}</p>}
        <button type="button" onClick={submit} disabled={save.isPending} aria-label="Simpan perubahan profil saya"
          className="font-display mt-5 min-h-[56px] w-full rounded-2xl text-lg font-extrabold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
          {save.isPending ? "Sedang menyimpan…" : "💾 Simpan Profil"}
        </button>
      </section>
    </main>
  );
}

/* ---------------- SERTIFIKAT PRESTASI ----------------
   Sertifikat resmi ZIQVA OLIM digambar di perangkat pengguna (canvas)
   sebagai PNG A4 mendatar 1754×1240. Hanya untuk attempt bertanda
   "Ujian Sertifikat" dengan skor ≥ 80 (lulus). Nama di sertifikat terisi
   otomatis dari nama peserta dan BISA DIUBAH di pratinjau — perubahan
   hanya berlaku untuk gambar sertifikat itu, tidak mengubah data skor. */
export const CERT_EXAM_LABEL = "Ujian Sertifikat";
export const CERT_PASS_SCORE = 80;

export interface CertData {
  id: number; student_name: string; mapel: string; jenjang: string;
  score: number; correct: number; total: number; created_at: string;
}

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export function certNumber(attemptId: number, createdAt: string): string {
  const d = new Date(createdAt);
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const roman = Number.isNaN(d.getTime()) ? "I" : (ROMAN_MONTHS[d.getMonth()] ?? "I");
  return `ZO/SERT/${year}/${roman}/${String(attemptId).padStart(6, "0")}`;
}

/** Gambar sertifikat lengkap ke canvas 1754×1240 (A4 mendatar @150dpi). */
export function drawCertificate(canvas: HTMLCanvasElement, data: CertData, displayName: string) {
  const W = 1754, H = 1240;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Palet warna per jenjang: bingkai, judul, nama penerima, dan pita medali
  // mengikuti warna khas jenjangnya; emas & kertas makin kaya di jenjang atas.
  const SD_PALETTE = { primary: "#1E2A78", gold: "#C9A227", goldDark: "#9A7B1C", goldLight: "#F7E7B4", paperA: "#FFFCF3", paperB: "#FFF1D4", ribbon: "#1E2A78" };
  const PALETTES: Record<string, typeof SD_PALETTE> = {
    TK: { primary: "#8A5FBF", gold: "#D9B84A", goldDark: "#A9852A", goldLight: "#FAEFC0", paperA: "#FEFAFF", paperB: "#FCECF5", ribbon: "#C86BA5" },
    SD: SD_PALETTE,
    SMP: { primary: "#0B5D50", gold: "#C9A227", goldDark: "#9A7B1C", goldLight: "#F7E7B4", paperA: "#F7FCF9", paperB: "#E7F4EC", ribbon: "#0B5D50" },
    SMA: { primary: "#6E1423", gold: "#C9971F", goldDark: "#96700F", goldLight: "#F9E9B8", paperA: "#FDF9EE", paperB: "#F5E8CB", ribbon: "#6E1423" },
  };
  const P = PALETTES[data.jenjang] ?? SD_PALETTE;
  const NAVY = P.primary, GOLD = P.gold, GOLD_DARK = P.goldDark, INK = "#2B2440", RED = "#B02A37";
  const cx = W / 2;

  // Kertas bergradasi halus khas jenjang + watermark bintang samar di tengah.
  const paperGrad = ctx.createLinearGradient(0, 0, W, H);
  paperGrad.addColorStop(0, P.paperA); paperGrad.addColorStop(1, P.paperB);
  ctx.fillStyle = paperGrad; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.055; ctx.fillStyle = GOLD_DARK;
  ctx.font = "620px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("★", cx, 640);
  ctx.restore();

  // Bingkai ganda: warna utama jenjang tebal di luar, emas di dalam.
  ctx.strokeStyle = NAVY; ctx.lineWidth = 10; ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(52, 52, W - 104, H - 104);
  ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.strokeRect(66, 66, W - 132, H - 132);
  // Ornamen sudut: belah ketupat emas + garis siku warna jenjang.
  const corner = (x: number, y: number, sx: number, sy: number) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 64); ctx.lineTo(0, 0); ctx.lineTo(64, 0); ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.moveTo(26, 10); ctx.lineTo(36, 26); ctx.lineTo(26, 42); ctx.lineTo(16, 26); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  corner(84, 84, 1, 1); corner(W - 84, 84, -1, 1); corner(84, H - 84, 1, -1); corner(W - 84, H - 84, -1, -1);

  // Pita motif berlian/permata kecil emas samar mengelilingi bagian dalam
  // bingkai (sisi bawah bagian tengah dikosongkan untuk catatan kaki).
  ctx.save();
  ctx.globalAlpha = 0.5; ctx.fillStyle = GOLD;
  const bandDia = (x: number, y: number) => {
    ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill();
  };
  for (let x = 190; x <= W - 190; x += 46) {
    bandDia(x, 92);
    if (Math.abs(x - cx) > 430) bandDia(x, H - 92);
  }
  for (let y = 190; y <= H - 190; y += 46) { bandDia(92, y); bandDia(W - 92, y); }
  ctx.restore();

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  // Emblem medali emas di atas kop: cakram emas berisi bintang dengan cincin
  // ganda, dan dua pita kecil berwarna jenjang menggantung di bawah medali.
  const medalY = 158;
  const drawRibbon = (dir: number) => {
    ctx.save(); ctx.translate(cx + dir * 24, medalY + 44); ctx.rotate(dir * 0.16);
    ctx.beginPath();
    ctx.moveTo(-13, -26); ctx.lineTo(13, -26); ctx.lineTo(13, 52); ctx.lineTo(0, 38); ctx.lineTo(-13, 52);
    ctx.closePath();
    ctx.fillStyle = P.ribbon; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = GOLD_DARK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, 34);
    ctx.lineWidth = 3; ctx.strokeStyle = GOLD; ctx.stroke();
    ctx.restore();
  };
  drawRibbon(-1); drawRibbon(1);
  // Cincin luar tipis — cincin kedua medali.
  ctx.beginPath(); ctx.arc(cx, medalY, 66, 0, Math.PI * 2);
  ctx.lineWidth = 3; ctx.strokeStyle = GOLD; ctx.stroke();
  // Cakram medali bergradasi emas dengan lingkaran bintang di dalamnya.
  const medalGrad = ctx.createRadialGradient(cx - 18, medalY - 20, 8, cx, medalY, 58);
  medalGrad.addColorStop(0, P.goldLight); medalGrad.addColorStop(0.65, GOLD); medalGrad.addColorStop(1, GOLD_DARK);
  ctx.beginPath(); ctx.arc(cx, medalY, 56, 0, Math.PI * 2);
  ctx.fillStyle = medalGrad; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = GOLD_DARK; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, medalY, 45, 0, Math.PI * 2);
  ctx.fillStyle = P.goldLight; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = GOLD_DARK; ctx.stroke();
  ctx.fillStyle = GOLD_DARK; ctx.font = "46px Georgia, serif"; ctx.textBaseline = "middle";
  ctx.fillText("★", cx, medalY + 3);
  ctx.textBaseline = "alphabetic";

  // Kop resmi.
  ctx.fillStyle = NAVY; ctx.font = "800 64px 'Baloo 2', Georgia, serif";
  ctx.fillText("ZIQVA OLIM", cx, 312);
  ctx.fillStyle = GOLD_DARK; ctx.font = "700 25px Georgia, serif";
  ctx.fillText("P L A T F O R M   O L I M P I A D E   D I G I T A L   I N D O N E S I A", cx, 350);
  // Garis pemisah emas berujung berlian, dengan berlian di tengahnya.
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 330, 372); ctx.lineTo(cx + 330, 372); ctx.stroke();
  ctx.fillStyle = GOLD;
  const sepDia = (x: number, s: number) => {
    ctx.beginPath(); ctx.moveTo(x, 372 - s); ctx.lineTo(x + s, 372); ctx.lineTo(x, 372 + s); ctx.lineTo(x - s, 372); ctx.closePath(); ctx.fill();
  };
  sepDia(cx - 330, 8); sepDia(cx + 330, 8); sepDia(cx, 9);

  // Judul + nomor sertifikat.
  ctx.fillStyle = NAVY; ctx.font = "700 76px Georgia, 'Times New Roman', serif";
  ctx.fillText("SERTIFIKAT PRESTASI", cx, 462);
  ctx.fillStyle = "#6E6785"; ctx.font = "600 24px Georgia, serif";
  ctx.fillText(`Nomor: ${certNumber(data.id, data.created_at)}`, cx, 504);

  ctx.fillStyle = INK; ctx.font = "italic 30px Georgia, serif";
  ctx.fillText("Diberikan dengan bangga kepada:", cx, 570);

  // Nama peserta besar + garis bawah emas.
  const nameText = (displayName.trim() || data.student_name).slice(0, 48);
  let nameSize = 84;
  ctx.font = `800 ${nameSize}px 'Baloo 2', Georgia, serif`;
  while (ctx.measureText(nameText).width > 1300 && nameSize > 40) { nameSize -= 4; ctx.font = `800 ${nameSize}px 'Baloo 2', Georgia, serif`; }
  ctx.fillStyle = NAVY;
  ctx.fillText(nameText, cx, 664);
  const nameW = Math.min(ctx.measureText(nameText).width + 30, 1360);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx - nameW / 2, 686); ctx.lineTo(cx + nameW / 2, 686); ctx.stroke();

  // Keterangan pencapaian di bawah nama (huruf emas kapital).
  const medal = medalFor(data.score);
  const achievement = `PERAIH ${medal.label.toUpperCase()}`;
  ctx.fillStyle = GOLD_DARK; ctx.font = "800 34px Georgia, serif";
  ctx.fillText(achievement.split("").join(" "), cx, 740);

  // Kalimat resmi — lebar dibatasi 1080px supaya tidak menabrak stempel.
  const body = `Atas prestasi dan keberhasilannya menyelesaikan seluruh 5 Level Olimpiade ${data.mapel} Jenjang ${data.jenjang} dan lulus Ujian Sertifikat ZIQVA OLIM dengan skor ${data.score} (${data.correct} dari ${data.total} soal benar).`;
  ctx.fillStyle = INK; ctx.font = "28px Georgia, serif";
  const words = body.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 1080 && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, 800 + i * 42));

  // Blok bawah: tanggal (kiri), stempel (tengah-kiri), tanda tangan (kanan).
  const bottomY = 1010;
  const dateStr = new Date(data.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = "26px Georgia, serif";
  ctx.fillText(`Diterbitkan pada ${dateStr}`, 150, bottomY - 60);

  // Stempel bundar merah dengan bintang di tengah.
  const stampX = 320, stampY = 1064;
  ctx.save(); ctx.translate(stampX, stampY); ctx.rotate(-0.16);
  ctx.globalAlpha = 0.88;
  ctx.beginPath(); ctx.arc(0, 0, 104, 0, Math.PI * 2);
  ctx.lineWidth = 5; ctx.strokeStyle = RED; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 88, 0, Math.PI * 2);
  ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = RED; ctx.textAlign = "center";
  ctx.font = "800 25px Georgia, serif";
  ctx.fillText("ZIQVA OLIM", 0, -34);
  ctx.font = "34px Georgia, serif";
  ctx.fillText("★", 0, 12);
  ctx.font = "800 19px Georgia, serif";
  ctx.fillText("SERTIFIKAT RESMI", 0, 48);
  ctx.restore();

  // Tanda tangan Pimpinan.
  const signX = 1330;
  ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = "26px Georgia, serif";
  ctx.fillText("Pimpinan ZIQVA OLIM", signX, bottomY - 96);
  ctx.fillStyle = NAVY; ctx.font = "italic 700 54px 'Segoe Script', 'Brush Script MT', cursive";
  ctx.fillText("Ziqva Olim", signX, bottomY - 24);
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(signX - 150, bottomY + 2); ctx.lineTo(signX + 150, bottomY + 2); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = "700 26px Georgia, serif";
  ctx.fillText("Tim ZIQVA OLIM", signX, bottomY + 42);

  // Catatan kaki.
  ctx.textAlign = "center"; ctx.fillStyle = "#6E6785"; ctx.font = "italic 21px Georgia, serif";
  ctx.fillText("Sertifikat ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.", cx, H - 96);
}

function CertificateModal(props: { data: CertData; onClose: () => void }) {
  const { data } = props;
  const [certName, setCertName] = useState(data.student_name);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) drawCertificate(canvasRef.current, data, certName);
  }, [data, certName]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCertificate(canvas, data, certName);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sertifikat-ZIQVA-OLIM-${(certName.trim() || data.student_name).replace(/[^\w-]+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Pratinjau sertifikat prestasi">
      <div className="pop-in max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 shadow-xl sm:p-6" style={{ background: "var(--surface)" }}>
        <div className="flex items-start gap-2">
          <h2 className="font-display flex-1 text-xl font-extrabold">📜 Sertifikat Prestasi — {data.mapel} {data.jenjang}</h2>
          <button type="button" onClick={props.onClose} aria-label="Tutup pratinjau sertifikat" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold" style={{ background: "var(--surface2)" }}>✕</button>
        </div>
        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--dim)" }}>
          Lulus Ujian Sertifikat dengan skor <strong>{data.score}</strong> ({data.correct}/{data.total} benar) • {medalFor(data.score).label} • No. {certNumber(data.id, data.created_at)}
        </p>
        <div className="mt-4">
          <label htmlFor="cert-name" className="font-display text-sm font-bold">Nama di Sertifikat</label>
          <input id="cert-name" value={certName} onChange={(e) => setCertName(e.target.value)} maxLength={48}
            placeholder="Nama yang tercetak di sertifikat" aria-label="Nama yang tercetak di sertifikat, bisa diubah sebelum mengunduh"
            className="mt-1.5 min-h-[52px] w-full rounded-2xl px-4 text-base font-semibold outline-none" style={{ background: "var(--surface2)", border: "2px solid var(--border)" }} />
          <p className="mt-1 text-xs font-semibold" style={{ color: "var(--dim)" }}>Terisi otomatis dari nama peserta. Boleh diganti — misalnya nama anak bila yang bermain akun orang tuanya. Nama yang diganti hanya berlaku di sertifikat ini; data skor &amp; peringkat tetap memakai nama peserta.</p>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          <canvas ref={canvasRef} className="block h-auto w-full" role="img" aria-label={`Pratinjau sertifikat prestasi atas nama ${certName.trim() || data.student_name}, peraih ${medalFor(data.score).label} Olimpiade ${data.mapel} jenjang ${data.jenjang}`} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={download} aria-label="Unduh sertifikat sebagai gambar PNG resolusi tinggi"
            className="font-display min-h-[56px] rounded-2xl text-base font-extrabold text-white" style={{ background: "var(--accent)" }}>📜 Unduh Sertifikat (PNG)</button>
          <button type="button" onClick={props.onClose} aria-label="Tutup pratinjau sertifikat"
            className="font-display min-h-[56px] rounded-2xl text-base font-bold" style={{ background: "var(--surface2)" }}>Nanti Saja</button>
        </div>
      </div>
    </div>
  );
}

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
  // true bila sesi terakhir disimpan sebagai Uji Coba Superadmin (login
  // sebagai admin saat sesi selesai) — ditampilkan sebagai catatan di
  // layar hasil; sesi seperti ini tidak dihitung ke peringkat/Challenge.
  const [lastWasTrial, setLastWasTrial] = useState(false);
  // Ujian Sertifikat: sesi khusus campuran Level 3–5 yang terbuka setelah
  // kelima level satu mapel tuntas; attempt-nya ditandai class_name khusus.
  const [certSession, setCertSession] = useState(false);
  const [lastAttemptId, setLastAttemptId] = useState<number | null>(null);
  const [certModal, setCertModal] = useState<CertData | null>(null);
  const [token, setToken] = useState<string>(() => { try { return localStorage.getItem(TOKEN_KEY) ?? ""; } catch { return ""; } });
  const me = useQuery({ queryKey: ["me", token], queryFn: () => api.me({ token }), enabled: token.length > 0 });
  const sessionUser: SessionUser | null = token && me.data ? me.data.user : null;
  // Menu kecil di bawah avatar profil (kanan atas header).
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => { setProfileOpen(false); }, [view]);

  // Ajakan daftar: tab awal halaman Guru & Ortu + status kartu ajakan
  // Beranda yang sudah ditutup di perangkat ini.
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "register">("login");
  const [ctaDismissed, setCtaDismissed] = useState<boolean>(() => { try { return localStorage.getItem(CTA_DISMISS_KEY) === "1"; } catch { return false; } });
  const dismissCta = () => { setCtaDismissed(true); try { localStorage.setItem(CTA_DISMISS_KEY, "1"); } catch { /* abaikan */ } };
  const openRegister = () => { setAuthInitialTab("register"); setView("login"); window.scrollTo({ top: 0 }); };
  const openLogin = () => { setAuthInitialTab("login"); setView("login"); window.scrollTo({ top: 0 }); };

  const handleAuthSuccess = (t: string, user: SessionUser) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* penyimpanan tidak tersedia */ }
    setToken(t);
    setView(user.role === "admin" ? "admin" : "dashboard");
    window.scrollTo({ top: 0 });
  };
  const logout = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* abaikan */ }
      setToken("");
      setAuthInitialTab("login");
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
  // Kehadiran online: heartbeat berkala menandai perangkat ini sedang aktif;
  // server membalas jumlah perangkat yang heartbeat-nya masih segar (online).
  const onlineQ = useQuery({
    queryKey: ["online", deviceId],
    queryFn: () => api.heartbeat({ device_id: deviceId }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const onlineCount = onlineQ.data?.online;
  const saveAttempt = useMutation({
    mutationFn: api.saveAttempt,
    onSuccess: (r) => { setMonitorCode(r.monitor_code); setLastAttemptId(r.id); queryClient.invalidateQueries({ queryKey: ["attempts"] }); queryClient.invalidateQueries({ queryKey: ["leaderboard"] }); queryClient.invalidateQueries({ queryKey: ["monthly-challenge"] }); },
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
      localStorage.removeItem(CTA_DISMISS_KEY);
    } catch { /* abaikan */ }
    // Putar ID perangkat baru supaya riwayat lama benar-benar tidak terbawa.
    let newDeviceId = deviceId;
    try {
      const nid = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, nid);
      newDeviceId = nid;
    } catch { /* abaikan */ }
    setDeviceId(newDeviceId);
    setClassSession(null);
    setClassResult(null);
    setPendingClassSubmission(null);
    setCertSession(false);
    setLastAttemptId(null);
    setCertModal(null);
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
    setCtaDismissed(false);
    setSoundOn(true);
    setShowWelcome(true);
    setShowReset(false);
    setResetText("");
    setResetDoneMsg(`✅ Berhasil direset! Semua data coba-coba sudah bersih.${serverNote} Sekarang ZIQVA OLIM seperti baru pertama kali dibuka — silakan mulai untuk anak dengan nama aslinya.`);
    queryClient.invalidateQueries({ queryKey: ["attempts"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] }); queryClient.invalidateQueries({ queryKey: ["monthly-challenge"] });
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
    const m = moduleForQuestion(jenjang, activeSubject.id, q, school === "cambridge");
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
      if (!next) stopSpeaking();
      else unlockAudio(); // menyalakan suara = bangunkan jalur audio dalam klik ini
      return next;
    });
  };

  const comboKey = activeSubject ? `${jenjang}|${activeSubject.id}` : "";
  const unlockedLevel = levelStore[comboKey]?.unlocked ?? 1;
  const bestThisLevel = activeSubject ? levelStore[comboKey]?.best?.[String(level)] : undefined;
  // Tantangan Sertifikat mapel terpilih: level dianggap TUNTAS bila skor
  // terbaiknya ≥ UNLOCK_SCORE (sistem buka level yang sama). Kelima level
  // tuntas → Ujian Sertifikat terbuka.
  const certBest = (activeSubject ? levelStore[comboKey]?.best : undefined) ?? {};
  const certDoneCount = [1, 2, 3, 4, 5].filter((n) => (certBest[String(n)] ?? 0) >= UNLOCK_SCORE).length;
  const certUnlocked = certDoneCount >= 5;

  // Di Mode Ujian, level pilihan tidak boleh melewati level yang sudah terbuka.
  useEffect(() => {
    if (mode === "ujian" && level > unlockedLevel) setLevel(unlockedLevel);
  }, [mode, level, unlockedLevel, comboKey]);

  /* ---------- Mode Kelas Ujian: sesi aktif & hasil ---------- */
  const [classSession, setClassSession] = useState<ActiveClassSession | null>(null);
  const [classResult, setClassResult] = useState<ClassResultData | null>(null);
  const [pendingClassSubmission, setPendingClassSubmission] = useState<PendingClassSubmission | null>(null);
  const [classSubmitError, setClassSubmitError] = useState("");

  const submitClassResult = useMutation({
    mutationFn: api.submitClassResult,
    onSuccess: (r) => {
      setClassResult(r);
      setClassSubmitError("");
      setMonitorCode(r.monitor_code);
      queryClient.invalidateQueries({ queryKey: ["attempts"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] }); queryClient.invalidateQueries({ queryKey: ["monthly-challenge"] });
      queryClient.invalidateQueries({ queryKey: ["myClasses"] });
      queryClient.invalidateQueries({ queryKey: ["classDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["monitor"] });
    },
    onError: (e) => setClassSubmitError(e instanceof Error ? e.message : "Hasil ujian kelas gagal tersimpan. Periksa koneksi lalu coba kirim lagi ya."),
  });
  const refreshClassRanking = useMutation({
    mutationFn: api.getClassRankingByCode,
    onSuccess: (r) => {
      setClassResult((prev) => {
        if (!prev || !classSession) return prev;
        const mine = r.ranking.find((x) => x.participant_id === classSession.participantId);
        return { ...prev, ranking: r.ranking, finished_count: r.class.finished_count, participant_count: r.class.participant_count, rank: mine?.rank ?? prev.rank };
      });
    },
  });

  const handleClassStart = (payload: JoinStartPayload) => {
    // Paket soal sama untuk satu kelas, tetapi urutan soal DAN urutan
    // pilihan jawaban diacak khusus untuk siswa ini. Soal dari server
    // tidak membawa kunci jawaban (answer diisi -1 = tidak ada kunci di
    // perangkat ini); penilaian murni dilakukan server saat pengumpulan.
    const asQuestions: Question[] = payload.questions.map((q) => {
      const base: Question = { q: q.q, options: q.options, answer: -1, explain: "" };
      if (q.stimulus) base.stimulus = q.stimulus;
      if (q.emoji) base.emoji = q.emoji;
      return base;
    });
    const shuffled = shuffle(asQuestions).map((q) => shuffleOptions(q));
    setName(payload.studentName);
    setNameError("");
    setClassSession({
      classId: payload.classInfo.id,
      participantId: payload.participantId,
      className: payload.classInfo.class_name,
      code: payload.classInfo.code,
      jenjang: payload.classInfo.jenjang as JenjangId,
      subjectId: payload.classInfo.subject_id,
      subjectName: payload.classInfo.subject_name,
      level: payload.classInfo.level,
      durationMinutes: payload.classInfo.duration_minutes,
    });
    setSessionQ(shuffled);
    setCertSession(false);
    setClassResult(null);
    setPendingClassSubmission(null);
    setClassSubmitError("");
    setMonitorCode("");
    setMode("ujian");
    setView("quiz");
    window.scrollTo({ top: 0 });
  };

  const handleClassFinish = (answers: (number | null)[], usedSec: number) => {
    if (!classSession) return;
    const submissions = sessionQ.map((q, i) => {
      const chosenIdx = answers[i];
      return { q: q.q, chosen: chosenIdx !== null && chosenIdx !== undefined ? (q.options[chosenIdx] ?? null) : null };
    });
    const payload: PendingClassSubmission = {
      class_id: classSession.classId,
      participant_id: classSession.participantId,
      student_name: name.trim() || "Peserta",
      submissions,
      duration_sec: usedSec,
      device_id: deviceId,
    };
    setPendingClassSubmission(payload);
    setClassResult(null);
    setClassSubmitError("");
    setView("classResult");
    window.scrollTo({ top: 0 });
    submitClassResult.mutate(payload);
  };

  const quitClassQuiz = () => {
    // Keluar di tengah ujian kelas: peserta tetap tercatat "sedang
    // mengerjakan" di dashboard guru dan bisa bergabung lagi dengan
    // nama + kode yang sama untuk melanjutkan dari awal sesi.
    setClassSession(null);
    setSessionQ([]);
    setView("home");
    window.scrollTo({ top: 0 });
  };

  const startQuiz = () => {
    const nameProblem = validateDisplayName(name);
    if (nameProblem) { setNameError(nameProblem); focusField("student-name"); return; }
    if (!activeSubject) return;
    const qs = buildSession(jenjang, activeSubject.id, level, SESSION_SIZE, school === "cambridge");
    if (qs.length === 0) return;
    setSessionQ(qs);
    setSessionLevel(level);
    setCertSession(false);
    setLastAttemptId(null);
    setLastResult(null);
    setLastWasTrial(false);
    setNewBadges([]);
    setEarnedPoints(0);
    setUnlockedNow(null);
    setMonitorCode("");
    setView("quiz");
    window.scrollTo({ top: 0 });
  };

  /* Ujian Sertifikat: 20 soal campuran tingkat tersulit (gabungan Level
     3–5), murni Mode Ujian tanpa ikon bantuan "i". Hanya bisa dimulai bila
     kelima level mapel ini sudah tuntas (tombolnya pun baru tampil saat
     itu) — hasilnya disimpan dengan penanda class_name "Ujian Sertifikat". */
  const startCertExam = () => {
    const nameProblem = validateDisplayName(name);
    if (nameProblem) { setNameError(nameProblem); focusField("student-name"); return; }
    if (!activeSubject) return;
    const english = school === "cambridge";
    const seen = new Set<string>();
    const pool: Question[] = [];
    const push = (list: Question[]) => {
      for (const q of list) {
        const k = q.q.trim().toLowerCase();
        if (!seen.has(k)) { seen.add(k); pool.push(q); }
      }
    };
    push(buildSession(jenjang, activeSubject.id, 5, 8, english));
    push(buildSession(jenjang, activeSubject.id, 4, 8, english));
    push(buildSession(jenjang, activeSubject.id, 3, 8, english));
    const qs = shuffle(pool).slice(0, SESSION_SIZE);
    if (qs.length === 0) return;
    setSessionQ(qs);
    setSessionLevel(5);
    setMode("ujian");
    setCertSession(true);
    setLastAttemptId(null);
    setLastResult(null);
    setLastWasTrial(false);
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
      // Sesi yang disimpan selagi login sebagai Superadmin adalah sesi uji
      // coba pemilik: ditandai is_trial agar tidak ikut peringkat/Challenge.
      const wasTrial = sessionUser?.role === "admin";
      setLastWasTrial(wasTrial);
      saveAttempt.mutate({
        student_name: name.trim(), jenjang, mapel: activeSubject.name, mode,
        score, correct, total: questions.length, duration_sec: usedSec, device_id: deviceId,
        class_name: certSession ? CERT_EXAM_LABEL : "",
        is_trial: wasTrial,
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
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleLogoClick} aria-label="Kembali ke Beranda" title="Kembali ke Beranda"
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-2xl text-left transition hover:opacity-90">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg sm:h-10 sm:w-10 sm:text-xl" style={{ background: "var(--gold)" }} aria-hidden>🏆</span>
              <span className="leading-none">
                <span className="font-display block text-lg font-extrabold tracking-wide whitespace-nowrap text-white sm:text-xl">ZIQVA <span style={{ color: "var(--gold)" }}>OLIM</span></span>
                <span className="mt-0.5 hidden text-[11px] font-semibold text-white/70 min-[480px]:block">Platform Olimpiade Digital Indonesia</span>
              </span>
            </button>
            <span className="ml-1 hidden min-h-[32px] shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white min-[560px]:flex"
              style={{ background: "rgba(255,255,255,.15)" }} role="status"
              aria-label={onlineCount != null ? `${onlineCount} pemakai sedang online sekarang` : "Menghitung pemakai yang sedang online"}>
              <span className="online-dot inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "#4ADE80" }} aria-hidden />
              {onlineCount != null ? `${onlineCount} online` : "… online"}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* Kontrol suara ringkas: ON/OFF + Tes Suara dalam satu kelompok kecil di kanan atas — tidak memakan baris sendiri. */}
              <div className="flex items-center gap-0.5 rounded-full p-1" style={{ background: "rgba(255,255,255,.15)" }} role="group" aria-label="Pengaturan suara">
                <button type="button" onClick={toggleSound} aria-pressed={soundOn}
                  aria-label={soundOn ? "Suara sedang ON — ketuk untuk mematikan semua suara (bacaan soal dan efek klik)" : "Suara sedang OFF — ketuk untuk menyalakan suara"}
                  title={soundOn ? "Suara ON — ketuk untuk mematikan" : "Suara OFF — ketuk untuk menyalakan"}
                  className="font-display flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-bold text-white transition hover:bg-white/10">
                  <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span><span>{soundOn ? "ON" : "OFF"}</span>
                </button>
                <button type="button" onClick={handleTestSound} aria-label="Tes suara: putar nada tes dan kalimat percobaan, lalu tampilkan diagnosa suara" title="Tes Suara"
                  className="font-display flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-bold text-white transition hover:bg-white/10">
                  <span aria-hidden>🔊</span><span className="hidden sm:inline">Tes</span>
                </button>
              </div>
              {/* Area profil kanan atas: avatar + menu akun bila sudah masuk; tombol Masuk / Daftar bila belum. */}
              {sessionUser ? (
                <div className="relative">
                  <button type="button" onClick={() => setProfileOpen((o) => !o)} aria-haspopup="menu" aria-expanded={profileOpen}
                    aria-label={`Menu profil ${sessionUser.name}, ${roleLabel(sessionUser.role)}`}
                    className="flex items-center gap-2 rounded-full py-0.5 pr-0.5 transition hover:opacity-90 md:pr-2" style={{ background: "rgba(255,255,255,.15)" }}>
                    <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }} aria-hidden>{initialsOf(sessionUser.name)}</span>
                    <span className="hidden text-left leading-tight md:block">
                      <span className="block max-w-[120px] truncate text-xs font-bold text-white">{sessionUser.name.split(" ")[0]}</span>
                      <span className="block text-[10px] font-semibold text-white/70">{roleLabel(sessionUser.role)}</span>
                    </span>
                    <span className="hidden pr-1 text-[10px] text-white/80 md:block" aria-hidden>▾</span>
                  </button>
                  {profileOpen && (
                    <>
                      <button type="button" aria-label="Tutup menu profil" className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileOpen(false)} />
                      <div role="menu" aria-label="Menu akun" className="pop-in absolute top-[calc(100%+8px)] right-0 z-50 w-64 rounded-2xl p-2 shadow-xl" style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2.5 px-2 py-2">
                          <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }} aria-hidden>{initialsOf(sessionUser.name)}</span>
                          <div className="min-w-0">
                            <div className="truncate font-display font-bold">{sessionUser.name}</div>
                            <div className="truncate text-xs font-semibold" style={{ color: "var(--dim)" }}>@{sessionUser.username} • {roleLabel(sessionUser.role)}</div>
                            {sessionUser.organization && <div className="truncate text-xs" style={{ color: "var(--dim)" }}>{sessionUser.organization}</div>}
                          </div>
                        </div>
                        <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
                        {sessionUser.role === "admin" && (
                          <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); setView("admin"); }} aria-label="Buka panel superadmin"
                            className="font-display flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold transition hover:opacity-80" style={{ background: "var(--surface2)" }}>🛡️ Panel Superadmin</button>
                        )}
                        <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); setView("profile"); }} aria-label="Buka halaman profil saya"
                          className="font-display mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold transition hover:opacity-80" style={{ background: "var(--surface2)" }}>👤 Profil Saya</button>
                        <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); setView("dashboard"); }} aria-label="Buka dashboard pantau"
                          className="font-display mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold transition hover:opacity-80" style={{ background: "var(--surface2)" }}>👀 Dashboard Pantau</button>
                        <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); handleLogout(); }} aria-label="Keluar dari akun"
                          className="font-display mt-1 flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-red-600 transition hover:opacity-80" style={{ background: "#FAE7E9" }}>🚪 Keluar</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button type="button" onClick={openLogin} aria-label="Masuk atau daftar sebagai guru, orang tua, atau admin"
                  className="font-display flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-xs font-extrabold whitespace-nowrap sm:px-4 sm:text-sm" style={{ background: "var(--gold)", color: "#2B2440" }}>
                  🔑 <span className="hidden min-[420px]:inline">Masuk / Daftar</span><span className="min-[420px]:hidden">Masuk</span>
                </button>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap gap-1.5 lg:flex-nowrap lg:gap-2" aria-label="Navigasi utama">
            <button type="button" onClick={() => setView("home")} aria-label="Ke beranda"
              className="font-display flex min-h-[44px] flex-1 basis-[31%] items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight font-bold sm:min-h-[40px] sm:px-3 sm:text-sm lg:flex-none lg:basis-auto lg:px-4"
              style={{ background: view === "home" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "home" ? "#2B2440" : "#fff" }}>Beranda</button>
            <button type="button" onClick={() => setView("belajar")} aria-label="Buka perpustakaan belajar"
              className="font-display flex min-h-[44px] flex-1 basis-[31%] items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight font-bold sm:min-h-[40px] sm:px-3 sm:text-sm lg:flex-none lg:basis-auto lg:px-4"
              style={{ background: view === "belajar" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "belajar" ? "#2B2440" : "#fff" }}>📚 Perpustakaan</button>
            <button type="button" onClick={() => setView("history")} aria-label="Lihat riwayat dan prestasiku"
              className="font-display flex min-h-[44px] flex-1 basis-[31%] items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight font-bold sm:min-h-[40px] sm:px-3 sm:text-sm lg:flex-none lg:basis-auto lg:px-4"
              style={{ background: view === "history" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "history" ? "#2B2440" : "#fff" }}>🏅 Prestasiku</button>
            <button type="button" onClick={() => { stopSpeaking(); setView("ranking"); }} aria-label="Lihat papan peringkat per jenjang"
              className="font-display flex min-h-[44px] flex-1 basis-[31%] items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight font-bold sm:min-h-[40px] sm:px-3 sm:text-sm lg:flex-none lg:basis-auto lg:px-4"
              style={{ background: view === "ranking" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "ranking" ? "#2B2440" : "#fff" }}>🏆 Peringkat</button>
            <button type="button" onClick={() => { stopSpeaking(); setView("challenge"); }} aria-label="Buka halaman challenge bulanan"
              className="font-display flex min-h-[44px] flex-1 basis-[31%] items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight font-bold sm:min-h-[40px] sm:px-3 sm:text-sm lg:flex-none lg:basis-auto lg:px-4"
              style={{ background: view === "challenge" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "challenge" ? "#2B2440" : "#fff" }}>🏆 Challenge</button>
            <button type="button" onClick={() => { if (sessionUser) setView("dashboard"); else openLogin(); }} aria-label={sessionUser ? "Ke dashboard pantau guru dan orang tua" : "Masuk sebagai guru atau orang tua"}
              className="font-display flex min-h-[44px] flex-1 basis-[31%] items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight font-bold sm:min-h-[40px] sm:px-3 sm:text-sm lg:flex-none lg:basis-auto lg:px-4"
              style={{ background: view === "dashboard" || view === "login" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "dashboard" || view === "login" ? "#2B2440" : "#fff" }}>
              {sessionUser ? `👀 Pantau (${sessionUser.name.split(" ")[0]})` : "👨‍🏫 Guru & Ortu"}
            </button>
            {sessionUser?.role === "admin" && (
              <button type="button" onClick={() => setView("admin")} aria-label="Buka panel superadmin"
                className="font-display flex min-h-[44px] flex-1 basis-[31%] items-center justify-center rounded-full px-2 py-1 text-center text-xs leading-tight font-bold sm:min-h-[40px] sm:px-3 sm:text-sm lg:flex-none lg:basis-auto lg:px-4"
                style={{ background: view === "admin" ? "var(--gold)" : "rgba(255,255,255,.15)", color: view === "admin" ? "#2B2440" : "#fff" }}>🛡️ Panel Superadmin</button>
            )}
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

      {view === "login" && <AuthView initialTab={authInitialTab} onSuccess={handleAuthSuccess} />}

      {view === "dashboard" && sessionUser && (
        <MonitorView token={token} user={sessionUser} onLogout={handleLogout} onPractice={() => setView("home")} onProfile={() => setView("profile")} />
      )}
      {view === "profile" && sessionUser && (
        <ProfileView token={token} user={sessionUser} onBack={() => setView(sessionUser.role === "admin" ? "admin" : "dashboard")} />
      )}
      {view === "profile" && !sessionUser && !me.isPending && (
        <main className="mx-auto w-full max-w-md px-4 pb-10">
          <div className="mt-5 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-5xl" aria-hidden>👤</div>
            <p className="font-display mt-2 text-lg font-bold">Masuk dulu untuk melihat Profil Saya</p>
            <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Halaman profil berisi data Guru / Orang Tua / Superadmin yang sedang masuk.</p>
            <button type="button" onClick={() => setView("login")} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>Masuk / Daftar →</button>
          </div>
        </main>
      )}
      {view === "admin" && sessionUser?.role === "admin" && (
        <AdminView token={token} user={sessionUser} onLogout={handleLogout} onProfile={() => setView("profile")} />
      )}
      {view === "admin" && sessionUser?.role !== "admin" && !me.isPending && (
        <main className="mx-auto w-full max-w-md px-4 pb-10">
          <div className="mt-5 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-5xl" aria-hidden>🛡️</div>
            <p className="font-display mt-2 text-lg font-bold">Panel Superadmin khusus pemilik aplikasi</p>
            <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Masuk dengan akun Superadmin untuk memantau &amp; mengelola seluruh data.</p>
            <button type="button" onClick={() => setView(sessionUser ? "dashboard" : "login")} className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white" style={{ background: "var(--accent)" }}>{sessionUser ? "Ke Dashboard Pantau" : "Masuk / Daftar →"}</button>
          </div>
        </main>
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

      {view === "quiz" && classSession && (
        <QuizView jenjang={classSession.jenjang} subjectName={classSession.subjectName} subjectId={classSession.subjectId} mode="ujian"
          levelLabel={`Level ${classSession.level} · ${LEVELS[classSession.level - 1]?.name ?? ""}`}
          soundOn={soundOn} onToggleSound={toggleSound}
          questions={questions} onFinish={handleClassFinish} onQuit={quitClassQuiz} quitSignal={quitSignal}
          english={school === "cambridge"}
          totalTimeSec={classSession.durationMinutes * 60}
          contextLabel={`🏫 Kelas Ujian: ${classSession.className} • Kode ${classSession.code} • Murni Mode Ujian — kerjakan sendiri ya!`} />
      )}

      {view === "quiz" && !classSession && activeSubject && (
        <QuizView jenjang={jenjang} subjectName={activeSubject.name} subjectId={activeSubject.id} mode={mode}
          levelLabel={certSession ? "🏆 Ujian Sertifikat · Campuran Level 3–5" : `Level ${sessionLevel} · ${LEVELS[sessionLevel - 1]?.name ?? ""}`}
          soundOn={soundOn} onToggleSound={toggleSound}
          questions={questions} onFinish={handleFinish} onQuit={() => setView("home")} quitSignal={quitSignal}
          english={school === "cambridge"}
          contextLabel={certSession ? `🏆 Ujian Sertifikat ${activeSubject.name} — ${SESSION_SIZE} soal tersulit campuran Level 3–5, murni Mode Ujian. Raih skor ${CERT_PASS_SCORE}+ untuk membuka Sertifikat Prestasimu!` : undefined}
          onInfo={certSession ? undefined : (q) => openModuleForQuestion(q, "Kembali ke Soal")} />
      )}

      {view === "joinClass" && (
        <JoinClassView initialName={name} deviceId={deviceId} onHome={() => { setView("home"); window.scrollTo({ top: 0 }); }}
          onStart={handleClassStart} />
      )}

      {view === "classResult" && (
        <main className="mx-auto w-full max-w-3xl px-4 pb-10">
          {submitClassResult.isPending && !classResult && (
            <section className="mt-5 rounded-3xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} role="status" aria-label="Sedang menyimpan hasil ujian kelas">
              <div className="text-5xl" aria-hidden>⏳</div>
              <p className="font-display mt-2 text-lg font-bold">Sedang menyimpan hasil ujian kelasmu…</p>
              <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Server sedang menilai jawabanmu dari paket soal kelas. Sebentar ya.</p>
            </section>
          )}
          {classSubmitError && !classResult && pendingClassSubmission && (
            <section className="mt-5 rounded-3xl p-6 text-center" style={{ background: "#FAE7E9", border: "2px solid #D6336C" }} role="alert" aria-label="Hasil ujian kelas gagal tersimpan">
              <div className="text-5xl" aria-hidden>⚠️</div>
              <p className="font-display mt-2 text-lg font-bold">Hasil belum tersimpan</p>
              <p className="mt-1 text-sm font-semibold">{classSubmitError}</p>
              <button type="button" onClick={() => submitClassResult.mutate(pendingClassSubmission)} disabled={submitClassResult.isPending}
                className="font-display mt-4 min-h-[52px] rounded-2xl px-6 font-bold text-white disabled:opacity-50" style={{ background: "#B02A37" }}>
                {submitClassResult.isPending ? "Sedang mengirim…" : "🔁 Kirim Lagi Hasilku"}
              </button>
            </section>
          )}
          {classResult && classSession && (
            <>
              <section className="pop-in mt-4 rounded-3xl p-6 text-center shadow-sm" style={{ background: "linear-gradient(160deg,#FFF7E0,#FFEFC4)", border: "2px solid var(--gold)", color: "#2B2440" }}>
                <p className="text-sm font-bold tracking-wide" style={{ color: "#92600A" }}>HASIL KELAS UJIAN • {classSession.className.toUpperCase()} • {classSession.code}</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "#92600A" }}>{classSession.subjectName} • {classSession.jenjang} • Level {classSession.level} • Peserta: {name}</p>
                <div className="font-display my-2 text-[84px] leading-none font-extrabold" style={{ color: "#D97706" }}>{classResult.score}</div>
                <p className="font-display text-lg font-bold">({classResult.correct}/{classResult.total} benar) • ⏱ {fmtDur(classResult.duration_sec)}</p>
                <p className="font-display mt-1 text-xl font-extrabold" style={{ color: medalFor(classResult.score).color }}>🏅 {medalFor(classResult.score).label}</p>
                <p className="font-display pop-in mx-auto mt-3 max-w-md rounded-2xl px-4 py-3 text-lg font-extrabold" style={{ background: "#fff", border: "2px dashed #D97706" }}>
                  🏆 Peringkat sementaramu: #{classResult.rank} dari {classResult.finished_count} peserta yang sudah selesai
                  <span className="block text-sm font-semibold" style={{ color: "#92600A" }}>{classResult.participant_count} peserta sudah bergabung di kelas ini. Peringkat bisa berubah selama teman-temanmu masih mengerjakan — nilai sama, yang tercepat yang menang.</span>
                </p>
                {classResult.monitor_code && (
                  <p className="mt-3 text-xs font-bold" style={{ color: "#92600A" }}>🔑 Kode Pantau kamu: <span className="tracking-[0.25em]">{classResult.monitor_code}</span> — hasil ini juga tercatat di Prestasiku, Papan Peringkat jenjang {classSession.jenjang}, dan dashboard gurumu (dengan nama kelas {classSession.className}).</p>
                )}
              </section>

              <section className="mt-4 rounded-3xl p-5 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} aria-label="Peringkat kelas sementara">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display flex-1 text-lg font-extrabold">🏆 Peringkat Kelas — {classSession.className}</h2>
                  <button type="button" onClick={() => refreshClassRanking.mutate({ code: classSession.code })} disabled={refreshClassRanking.isPending}
                    aria-label="Segarkan peringkat kelas sementara" className="font-display min-h-[44px] rounded-full px-4 text-sm font-bold disabled:opacity-50" style={{ background: "var(--surface2)" }}>
                    {refreshClassRanking.isPending ? "Memuat…" : "🔄 Segarkan"}
                  </button>
                </div>
                <div className="mt-3"><ClassRankingList ranking={classResult.ranking} myName={name} /></div>
              </section>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setClassSession(null); setView("home"); window.scrollTo({ top: 0 }); }} className="min-h-[54px] rounded-2xl font-display text-base font-bold text-white" style={{ background: "var(--accent)" }} aria-label="Kembali ke beranda">🏠 Beranda</button>
                <button type="button" onClick={() => { setJenjang(classSession.jenjang); setView("ranking"); window.scrollTo({ top: 0 }); }} className="min-h-[54px] rounded-2xl font-display text-base font-bold text-white" style={{ background: "#D97706" }} aria-label={`Lihat papan peringkat jenjang ${classSession.jenjang}`}>🏆 Peringkat Jenjang {classSession.jenjang}</button>
              </div>
              <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: "var(--dim)" }}>Pembahasan soal kelas tidak ditampilkan di sini supaya teman yang masih mengerjakan tidak mendapat bocoran. Setelah kelas ditutup guru, belajar lagi lewat Perpustakaan &amp; Mode Latihan ya! 📚</p>
            </>
          )}
        </main>
      )}

      {view === "ranking" && (
        <LeaderboardView initialJenjang={jenjang} myName={name} onPractice={() => { setView("home"); window.scrollTo({ top: 0 }); }} />
      )}

      {view === "challenge" && (
        <ChallengeView myName={name} onPractice={() => { setView("home"); window.scrollTo({ top: 0 }); }} />
      )}

      {view === "belajar" && (
        <BelajarView jenjang={jenjang} english={school === "cambridge"} initialSubject={activeSubject?.id ?? subjects[0]?.id ?? "matematika"}
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
            <section className="pop-in relative mt-4 overflow-hidden rounded-3xl p-4 text-center shadow-sm sm:p-6" style={{ background: "linear-gradient(150deg,#FFF3DC,#FDE7F3)", border: "2px solid var(--gold)" }} aria-label="Sambutan selamat datang">
              <button type="button" onClick={() => setShowWelcome(false)} aria-label="Tutup sambutan" className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: "rgba(255,255,255,.7)", color: "#92600A" }}>✕</button>
              <div className="flex items-end justify-center gap-2 text-3xl sm:text-5xl" aria-hidden>
                <span className="sparkle inline-block">⭐</span>
                <span className="floaty inline-block text-5xl sm:text-7xl">🏆</span>
                <span className="sparkle inline-block" style={{ animationDelay: ".6s" }}>✨</span>
                <span className="wiggle inline-block">🎉</span>
                <span className="sparkle inline-block" style={{ animationDelay: "1.1s" }}>⭐</span>
              </div>
              <h2 className="fade-up font-display mt-2 text-xl font-extrabold sm:text-3xl" style={{ animationDelay: ".1s" }}>Selamat Datang, Pejuang Olimpiade! 🎓</h2>
              <p className="fade-up mx-auto mt-2 max-w-xl text-sm leading-relaxed font-semibold sm:text-[15px]" style={{ animationDelay: ".3s", color: "#7A5B12" }}>
                Di ZIQVA OLIM kamu bisa membaca <strong>bahan belajar dari dasar</strong>, lalu menantang <strong>{SESSION_SIZE} soal acak yang selalu baru</strong> di setiap sesi —
                dari Level 1 Pemula sampai Level 5 Ahli Olimpiade. Setiap jawaban benar mengumpulkan ⭐ bintang, 🪙 poin, dan lencana. Jaga api streak-mu tetap menyala! 🔥
              </p>
              <div className="fade-up mt-4 grid grid-cols-2 justify-center gap-2 min-[560px]:flex min-[560px]:flex-wrap" style={{ animationDelay: ".5s" }}>
                <button type="button" onClick={() => setShowWelcome(false)} className="font-display min-h-[44px] rounded-full px-3 text-sm font-bold text-white sm:min-h-[48px] sm:px-5 sm:text-base" style={{ background: "var(--accent)" }}>🚀 Ayo Mulai!</button>
                <button type="button" onClick={() => { setShowWelcome(false); setView("belajar"); }} className="font-display min-h-[44px] rounded-full px-3 text-sm font-bold sm:min-h-[48px] sm:px-5 sm:text-base" style={{ background: "#fff", border: "2px solid var(--gold)", color: "#92600A" }}>📚 Jelajahi Perpustakaan</button>
                <button type="button" onClick={() => {
                    if (!soundOn) { setWelcomeMsg("Suara sedang OFF — nyalakan tombol suara 🔊 ON di kanan atas halaman dulu, ya."); return; }
                    setWelcomeMsg("");
                    speakText("Selamat datang di ZIQVA OLIM! Ayo belajar dari dasar, kumpulkan bintang dan lencana, dan taklukkan soal olimpiade dari Level 1 sampai Level 5. Semangat, Pejuang Olimpiade!", "id-ID", { setSpeaking: setWelcomeSpeaking, onStatus: setWelcomeMsg });
                  }} aria-label="Dengarkan sambutan dengan suara"
                  className={`font-display col-span-2 min-h-[44px] rounded-full px-3 text-sm font-bold text-white min-[560px]:col-span-1 sm:min-h-[48px] sm:px-5 sm:text-base ${welcomeSpeaking ? "speaking" : ""}`} style={{ background: "#E84393" }}>
                  {welcomeSpeaking ? "🔊 Sedang menyapa…" : "🔊 Dengarkan Sambutan"}
                </button>
              </div>
              {welcomeMsg && <p className="mt-2 text-xs font-bold" style={{ color: "#92600A" }} role="status">{welcomeMsg}</p>}
            </section>
          )}
          <section className="mt-4 overflow-hidden rounded-3xl shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} aria-label="Tentang ZIQVA OLIM">
            <div className="grid lg:grid-cols-2">
              <div className="order-2 p-5 sm:p-7 lg:order-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className="font-display inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold text-white shadow sm:text-base" style={{ background: "#1E7A46" }} aria-label="Seratus persen gratis">🎁 100% GRATIS</span>
                  <span className="font-display text-sm font-extrabold sm:text-base" style={{ color: "#1E7A46" }}>— Bekal Masa Depan Anak</span>
                </div>
                <h1 className="font-display mt-3 text-2xl leading-tight font-extrabold text-balance sm:text-3xl">Latihan Olimpiade Interaktif — dari TK/PAUD sampai SMA/SMK/MA 🏅</h1>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--dim)" }}>
                  Platform latihan olimpiade interaktif untuk semua jenjang — sekolah umum, madrasah, sekolah Kristen, dan Cambridge.
                </p>
                <ul className="mt-4 grid gap-2 min-[480px]:grid-cols-2">
                  <li className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: "var(--surface2)" }}>
                    <span className="text-2xl leading-none" aria-hidden>🎯</span>
                    <span><span className="font-display block text-sm font-bold">{SESSION_SIZE} soal pilihan ganda</span><span className="block text-xs leading-snug" style={{ color: "var(--dim)" }}>{SESSION_SIZE} menit, dengan timer, indikator progres &amp; skor akhir</span></span>
                  </li>
                  <li className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: "var(--surface2)" }}>
                    <span className="text-2xl leading-none" aria-hidden>🔊</span>
                    <span><span className="font-display block text-sm font-bold">Audio “Dengarkan Soal”</span><span className="block text-xs leading-snug" style={{ color: "var(--dim)" }}>Soal dibacakan dengan suara dan bisa diulang kapan pun</span></span>
                  </li>
                  <li className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: "var(--surface2)" }}>
                    <span className="text-2xl leading-none" aria-hidden>🎲</span>
                    <span><span className="font-display block text-sm font-bold">Soal acak selalu baru</span><span className="block text-xs leading-snug" style={{ color: "var(--dim)" }}>Dicoba seratus kali pun tetap fresh — bukan soal template</span></span>
                  </li>
                  <li className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: "var(--surface2)" }}>
                    <span className="text-2xl leading-none" aria-hidden>🎚️</span>
                    <span><span className="font-display block text-sm font-bold">Level 1 – 5</span><span className="block text-xs leading-snug" style={{ color: "var(--dim)" }}>Dari Pemula sampai Ahli Olimpiade — skor {UNLOCK_SCORE}+ membuka level berikutnya</span></span>
                  </li>
                  <li className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: "var(--surface2)" }}>
                    <span className="text-2xl leading-none" aria-hidden>📚</span>
                    <span><span className="font-display block text-sm font-bold">Bahan belajar dari dasar</span><span className="block text-xs leading-snug" style={{ color: "var(--dim)" }}>Perpustakaan materi per jenjang &amp; mapel, plus pembahasan tiap soal</span></span>
                  </li>
                  <li className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: "var(--surface2)" }}>
                    <span className="text-2xl leading-none" aria-hidden>👀</span>
                    <span><span className="font-display block text-sm font-bold">Pantauan guru &amp; orang tua</span><span className="block text-xs leading-snug" style={{ color: "var(--dim)" }}>Skor, peringkat &amp; pencapaian terpantau — tidak ter-reset</span></span>
                  </li>
                </ul>
                <div className="mt-4">
                  <p className="text-xs font-extrabold tracking-wide" style={{ color: "var(--dim)" }}>{SUBJECTS.length} MATA PELAJARAN</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {["Matematika", "Bahasa Inggris", "IPA / Sains", "Sejarah", "Bahasa Jawa", "Bahasa Arab", "PAI", "Akidah Akhlak", "Fikih", "Qur'an Hadis", "SKI", "Agama Kristen", "Bahasa Korea", "Bahasa Jepang", "Bahasa Mandarin"].map((n) => (
                      <span key={n} className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "var(--surface2)" }}>{n}</span>
                    ))}
                  </div>
                </div>
                <p className="mt-4 rounded-2xl px-4 py-3 text-sm leading-relaxed font-semibold" style={{ background: "#E2F4E9", color: "#14532D" }}>
                  Dibuat benar-benar gratis untuk latihan olimpiade anak Indonesia — semua soal, bahan belajar, dan pantauan nilainya bebas dipakai siapa saja. Ayo coba sekarang, tanpa biaya apa pun! 🎉
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
              <div className="order-1 lg:order-2">
                <img src={heroImg} alt="Ilustrasi anak-anak Indonesia dari TK sampai SMA merayakan kemenangan olimpiade dengan piala dan medali" className="block h-44 w-full object-cover object-top sm:h-60 lg:h-full lg:min-h-[340px] lg:[object-position:62%_top]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px lg:grid-cols-4" style={{ background: "var(--border)" }} aria-label="Statistik ZIQVA OLIM">
              <div className="flex items-center justify-center px-3 py-3 text-center text-[13px] font-bold" style={{ background: "var(--surface2)" }}>📚 Total {TOTAL_AUTHORED} soal inti tertulis</div>
              <div className="flex items-center justify-center px-3 py-3 text-center text-[13px] font-bold" style={{ background: "var(--surface2)" }}>🎲 298.000+ variasi soal acak</div>
              <div className="flex items-center justify-center px-3 py-3 text-center text-[13px] font-bold" style={{ background: "var(--surface2)" }}>🗂️ {SUBJECTS.length} mapel • 4 jenjang • 5 level</div>
              <div className="flex items-center justify-center gap-2 px-3 py-3 text-center text-[13px] font-bold" style={{ background: "var(--surface2)" }} role="status"
                aria-label={onlineCount != null ? `${onlineCount} pemakai sedang online sekarang` : "Menghitung pemakai yang sedang online"}>
                <span className="online-dot inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "#22C55E" }} aria-hidden />
                {onlineCount != null ? `${onlineCount} pemakai online sekarang` : "Menghitung pemakai online…"}
              </div>
            </div>
          </section>

          {/* Ajakan daftar Guru & Ortu — hilang bila sudah login atau sudah ditutup di perangkat ini */}
          {!sessionUser && !ctaDismissed && (
            <DaftarCtaCard variant="home" onDaftar={openRegister} onClose={dismissCta} />
          )}

          {/* Rewards strip */}
          <section className="mt-5 flex flex-wrap items-center gap-2 rounded-3xl p-4 shadow-sm" style={{ background: "var(--surface)", border: "2px solid var(--gold)" }} aria-label="Hadiah dan pencapaian saya">
            <span className="font-display w-full text-base font-extrabold sm:w-auto">🎁 Hadiahku:</span>
            <span className="rounded-full px-3 py-1.5 text-center text-sm font-bold max-sm:flex-1 max-sm:basis-[46%]" style={{ background: "var(--surface2)" }}>⭐ {rewards.totalCorrect} Bintang</span>
            <span className="rounded-full px-3 py-1.5 text-center text-sm font-bold max-sm:flex-1 max-sm:basis-[46%]" style={{ background: "var(--surface2)" }}>🪙 {rewards.points} Poin</span>
            <span className="rounded-full px-3 py-1.5 text-center text-sm font-bold max-sm:flex-1 max-sm:basis-[46%]" style={{ background: "var(--surface2)" }}>🔥 {rewards.streak} hari streak</span>
            <span className="rounded-full px-3 py-1.5 text-center text-sm font-bold max-sm:flex-1 max-sm:basis-[46%]" style={{ background: "var(--surface2)" }}>🏅 {rewards.badges.length}/{BADGES.length} lencana</span>
            <button type="button" onClick={() => setView("history")} className="rounded-full px-3 py-1.5 text-sm font-bold text-white max-sm:min-h-[44px] max-sm:w-full" style={{ background: "var(--accent)" }}>Lihat Lencana →</button>
            {rewards.totalSessions === 0 && <p className="w-full text-sm font-semibold" style={{ color: "var(--dim)" }}>Selesaikan sesi pertamamu untuk membuka lencana 🎯 <strong>Langkah Pertama</strong> — setiap jawaban benar bernilai 10 poin + 1 bintang!</p>}
          </section>

          {/* Papan peringkat per jenjang */}
          <section className="mt-5 flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:flex-row sm:items-center" style={{ background: "linear-gradient(150deg,#FFF3DC,#FDE7F3)", border: "2px solid var(--gold)" }} aria-label="Papan peringkat per jenjang">
            <div className="text-4xl" aria-hidden>🏆</div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">Papan Peringkat — siapa juara di jenjangmu?</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                Setiap jenjang (TK, SD, SMP, SMA) punya juaranya sendiri, diurutkan dari <strong>nama peserta</strong> dengan skor terbaiknya.
                Nilai sama? Yang <strong>mengerjakan paling cepat</strong> yang menang. Selesaikan sesi dan lihat posisimu!
              </p>
            </div>
            <button type="button" onClick={() => setView("ranking")} aria-label="Buka papan peringkat per jenjang"
              className="font-display min-h-[52px] shrink-0 rounded-2xl px-6 font-bold" style={{ background: "var(--gold)", color: "#2B2440" }}>
              🏆 Lihat Peringkat
            </button>
          </section>

          {/* Papan Juara Bulan Ini — sistem poin & challenge bulanan */}
          <HomeChampionBoard myName={name}
            onOpenChallenge={() => { stopSpeaking(); setView("challenge"); window.scrollTo({ top: 0 }); }}
            onPractice={() => { const el = document.getElementById("student-name"); el?.scrollIntoView({ behavior: "smooth", block: "center" }); el?.focus(); }} />

          {/* Gabung Kelas Ujian */}
          <section className="mt-5 flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:flex-row sm:items-center" style={{ background: "linear-gradient(150deg,#E2F4E9,#DFF6F9)", border: "2px solid #1E7A46" }} aria-label="Gabung kelas ujian dari guru">
            <div className="text-4xl" aria-hidden>🏫</div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">Ada Kode Kelas dari Gurumu? Gabung Kelas Ujian di sini!</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                Guru membuat kelas ujian dan membagikan <strong>Kode Kelas</strong> (contoh: KLS-XXXXXX). Kamu tinggal isi <strong>nama + kode</strong> — tanpa akun, langsung mengerjakan paket ujian kelasmu dengan peringkat kelas langsung. Gurumu bisa memantau dari dashboard-nya secara live.
              </p>
            </div>
            <button type="button" onClick={() => { stopSpeaking(); setView("joinClass"); window.scrollTo({ top: 0 }); }} aria-label="Buka formulir gabung kelas ujian"
              className="font-display min-h-[52px] shrink-0 rounded-2xl px-6 font-bold text-white" style={{ background: "#1E7A46" }}>
              🏫 Gabung Kelas
            </button>
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
            <button type="button" onClick={() => { if (sessionUser) setView("dashboard"); else openLogin(); }} aria-label={sessionUser ? "Buka dashboard pantau" : "Masuk atau daftar sebagai guru atau orang tua"}
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
                    {s.competition && (
                      <span className="font-display ml-2 inline-flex items-center rounded-full px-2 py-1 align-top text-[11px] font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }} aria-label="Paket Kompetisi — latihan gaya lomba">🏆 Paket Kompetisi</span>
                    )}
                    <div className="mt-2 font-display text-[15px] leading-tight font-bold">{s.name}</div>
                    <div className="mt-0.5 text-xs font-semibold" style={{ color: "var(--dim)" }}>{SESSION_SIZE} soal acak • Level 1–{un} terbuka{s.competition ? " • Kompetisi" : ""}</div>
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

          {/* Tantangan Sertifikat mapel terpilih */}
          <section className="mt-5 rounded-3xl p-5 shadow-sm" style={{ background: certUnlocked ? "linear-gradient(150deg,#FFF7E0,#FFEFC4)" : "var(--surface)", border: `2px solid ${certUnlocked ? "var(--gold)" : "var(--border)"}` }} aria-label={`Tantangan sertifikat ${activeSubject?.name ?? ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display flex-1 text-lg font-bold">🏆 Tantangan Sertifikat — {activeSubject?.name}</h2>
              <span className="font-display rounded-full px-3 py-1.5 text-sm font-extrabold" style={{ background: certUnlocked ? "var(--gold)" : "var(--surface2)", color: certUnlocked ? "#2B2440" : "var(--dim)" }}>
                Tantangan Sertifikat: {certDoneCount}/5 level tuntas
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`Progres level ${activeSubject?.name ?? ""}: ${certDoneCount} dari 5 level tuntas`}>
              {[1, 2, 3, 4, 5].map((n) => {
                const best = certBest[String(n)];
                const done = (best ?? 0) >= UNLOCK_SCORE;
                return (
                  <span key={n} className="font-display inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold"
                    style={{ background: done ? "#1E7A46" : "var(--surface2)", color: done ? "#fff" : "var(--dim)", border: "1px solid var(--border)" }}>
                    {done ? "✅" : "🎚️"} Level {n}{best !== undefined ? ` • ${best}` : " • —"}
                  </span>
                );
              })}
            </div>
            {certUnlocked ? (
              <>
                <p className="mt-3 text-sm leading-relaxed font-semibold">
                  🎉 Luar biasa! Kamu sudah menuntaskan <strong>seluruh 5 level {activeSubject?.name}</strong> (skor terbaik Level 5: {certBest["5"]}). Ujian penentunya sudah terbuka:
                  {SESSION_SIZE} soal campuran tersulit (Level 3–5), murni Mode Ujian tanpa bantuan. Raih skor <strong>{CERT_PASS_SCORE}+</strong> dan <strong>Sertifikat Prestasi resmi ZIQVA OLIM</strong> jadi milikmu — bisa diunduh &amp; dicetak!
                </p>
                <button type="button" onClick={startCertExam} aria-label={`Mulai ujian sertifikat ${activeSubject?.name ?? ""} jenjang ${jenjang}`}
                  className="font-display mt-3 min-h-[56px] w-full rounded-2xl text-lg font-extrabold shadow sm:w-auto sm:px-8" style={{ background: "var(--gold)", color: "#2B2440" }}>
                  🏆 Ujian Sertifikat — {activeSubject?.name} • {jenjang}
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                Tuntaskan <strong>kelima level {activeSubject?.name}</strong> — raih skor terbaik <strong>{UNLOCK_SCORE}+</strong> di setiap level — untuk membuka <strong>🏆 Ujian Sertifikat</strong>:
                ujian penentu {SESSION_SIZE} soal tersulit yang hadiahnya <strong>Sertifikat Prestasi resmi</strong> yang bisa diunduh. Kurang {5 - certDoneCount} level lagi — semangat! 💪
              </p>
            )}
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
            <p className="text-sm font-bold tracking-wide" style={{ color: "#92600A" }}>{certSession ? `HASIL UJIAN SERTIFIKAT • ${activeSubject.name.toUpperCase()} • ${jenjang}` : `HASIL ${mode === "ujian" ? "UJIAN" : "LATIHAN"} • ${activeSubject.name.toUpperCase()} • ${jenjang} • LEVEL ${sessionLevel} ${LEVELS[sessionLevel - 1]?.name.toUpperCase()}`}</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "#92600A" }}>Peserta: {name}</p>
            <div className="font-display my-2 text-[84px] leading-none font-extrabold" style={{ color: "#D97706" }}>{lastResult.score}</div>
            <p className="font-display text-lg font-bold">({lastResult.correct}/{questions.length} benar) • ⏱ {fmtDur(lastResult.usedSec)}</p>
            <p className="mt-1 font-display text-xl font-extrabold" style={{ color: medalFor(lastResult.score).color }}>🏅 {medalFor(lastResult.score).label}</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-semibold">{motivationFor(lastResult.score)}</p>
            {saveAttempt.isPending && <p className="mt-2 text-xs">Menyimpan hasil ke Prestasiku…</p>}
            {lastWasTrial && (
              <p className="mx-auto mt-3 max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-bold" style={{ background: "#fff", border: "2px dashed #6E6785", color: "#57506E" }} role="status">
                🧪 Sesi Uji Coba Superadmin — sesi ini <strong>tidak dihitung</strong> ke peringkat, poin Challenge, maupun statistik. Hasilnya tetap tersimpan di Prestasiku untuk kamu periksa sendiri.
              </p>
            )}
            {monitorCode && (
              <div className="mx-auto mt-4 max-w-md rounded-2xl px-4 py-3" style={{ background: "#fff", border: "2px dashed #D97706" }}>
                <p className="text-xs font-bold tracking-wide" style={{ color: "#92600A" }}>🔑 KODE PANTAU {name.toUpperCase()}</p>
                <p className="font-display text-3xl font-extrabold tracking-[0.3em]" style={{ color: "#2B2440" }}>{monitorCode}</p>
                <p className="text-xs font-semibold" style={{ color: "#92600A" }}>Berikan kode ini ke guru / orang tua supaya mereka bisa memantau skormu dari akun mereka.</p>
              </div>
            )}
            {certSession && lastResult.score >= CERT_PASS_SCORE && (
              <div className="pop-in mx-auto mt-4 max-w-md rounded-2xl px-4 py-4" style={{ background: "#fff", border: "2px solid var(--gold)" }} role="status" aria-label="Kamu lulus ujian sertifikat">
                <p className="font-display text-lg font-extrabold" style={{ color: "#92600A" }}>🎉 LULUS UJIAN SERTIFIKAT!</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "#92600A" }}>
                  Kamu berhak atas <strong>Sertifikat Prestasi resmi ZIQVA OLIM</strong> — {medalFor(lastResult.score).label} Olimpiade {activeSubject.name} Jenjang {jenjang}. Namamu terisi otomatis dan masih bisa diganti dulu sebelum mengunduh (misalnya nama lengkapmu yang resmi).
                </p>
                <button type="button" disabled={lastAttemptId === null}
                  onClick={() => lastAttemptId !== null && setCertModal({ id: lastAttemptId, student_name: name.trim() || "Peserta", mapel: activeSubject.name, jenjang, score: lastResult.score, correct: lastResult.correct, total: questions.length, created_at: new Date().toISOString() })}
                  aria-label="Buka pratinjau dan unduh sertifikat prestasi"
                  className="font-display mt-3 min-h-[54px] w-full rounded-2xl text-base font-extrabold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
                  {lastAttemptId === null ? "⏳ Menyiapkan Sertifikat…" : "📜 Unduh Sertifikat"}
                </button>
              </div>
            )}
            {certSession && lastResult.score < CERT_PASS_SCORE && (
              <div className="mx-auto mt-4 max-w-md rounded-2xl px-4 py-4" style={{ background: "#fff", border: "2px dashed #D97706" }} role="status" aria-label="Belum lulus ujian sertifikat">
                <p className="font-display text-base font-extrabold" style={{ color: "#92600A" }}>💪 Sedikit lagi menuju Sertifikat!</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "#92600A" }}>
                  Skormu {lastResult.score} — target lulus Ujian Sertifikat adalah <strong>{CERT_PASS_SCORE}+</strong>. Kabar baiknya: tantanganmu tinggal satu langkah, karena kelima level {activeSubject.name} sudah kamu tuntaskan (5/5). Baca lagi pembahasan di bawah, lalu coba Ujian Sertifikat sekali lagi — soalnya selalu baru!
                </p>
                <button type="button" onClick={startCertExam} aria-label={`Coba lagi ujian sertifikat ${activeSubject.name}`}
                  className="font-display mt-3 min-h-[52px] w-full rounded-2xl text-base font-extrabold" style={{ background: "var(--gold)", color: "#2B2440" }}>
                  🔁 Coba Ujian Sertifikat Lagi
                </button>
              </div>
            )}
            {!sessionUser && <DaftarCtaCard variant="result" onDaftar={openRegister} />}
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
          <button type="button" onClick={() => setView("ranking")} className="mt-2 min-h-[54px] w-full rounded-2xl font-display text-base font-bold text-white" style={{ background: "#D97706" }} aria-label={`Lihat posisi peringkat saya di jenjang ${jenjang}`}>
            🏆 Lihat Peringkatku di Jenjang {jenjang} — nilai sama, yang tercepat menang!
          </button>

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

          {/* Ajakan daftar Guru & Ortu — hanya bila belum ada sesi login di perangkat ini */}
          {!sessionUser && <DaftarCtaCard variant="history" onDaftar={openRegister} />}

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
                      <div className="truncate font-display font-bold">{a.mapel} • {a.jenjang}{a.class_name === CERT_EXAM_LABEL ? " • 🏆 Ujian Sertifikat" : a.class_name ? ` • 🏫 Kelas: ${a.class_name}` : ""}{a.is_trial && <span className="font-display ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 align-middle text-[11px] font-extrabold whitespace-nowrap" style={{ background: "#E8EEF7", color: "#1E2A78", border: "1px solid #B9C6E8" }}>🧪 Uji Coba</span>}</div>
                      <div className="text-xs font-semibold" style={{ color: "var(--dim)" }}>
                        {a.student_name} • {a.correct}/{a.total} benar • {a.mode === "ujian" ? "🏆 Ujian" : "✏️ Latihan"} • {fmtDur(a.duration_sec)} • {new Date(a.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-xs font-bold" style={{ color: medalFor(a.score).color }}>🏅 {medalFor(a.score).label}</div>
                      {a.monitor_code && <div className="mt-0.5 text-xs font-bold" style={{ color: "var(--dim)" }}>🔑 Kode Pantau: <span className="tracking-widest">{a.monitor_code}</span> — untuk guru / orang tua</div>}
                      {a.class_name === CERT_EXAM_LABEL && a.score >= CERT_PASS_SCORE && (
                        <button type="button"
                          onClick={() => setCertModal({ id: a.id, student_name: a.student_name, mapel: a.mapel, jenjang: a.jenjang, score: a.score, correct: a.correct, total: a.total, created_at: a.created_at })}
                          aria-label={`Unduh sertifikat prestasi untuk ${a.mapel} skor ${a.score}`}
                          className="font-display mt-1.5 inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-extrabold text-white" style={{ background: "var(--accent)" }}>
                          📜 Sertifikat
                        </button>
                      )}
                      {a.class_name === CERT_EXAM_LABEL && a.score < CERT_PASS_SCORE && (
                        <div className="mt-0.5 text-xs font-bold" style={{ color: "#92600A" }}>🏆 Ujian Sertifikat — belum lulus (target {CERT_PASS_SCORE}+). Tuntaskan lagi dari Beranda ya!</div>
                      )}
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

      {certModal && (
        <CertificateModal data={certModal} onClose={() => setCertModal(null)} />
      )}

      {moduleCtx && (
        <ModuleView module={moduleCtx.module} jenjang={moduleCtx.jenjang} subjectName={moduleCtx.subjectName}
          question={moduleCtx.question} backLabel={moduleCtx.backLabel}
          onBack={() => setModuleCtx(null)}
          onPractice={moduleCtx.fromLibrary ? () => { const sid = moduleCtx.subjectId; setModuleCtx(null); setSubjectId(sid); setView("home"); window.scrollTo({ top: 0 }); } : undefined} />
      )}

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs" style={{ color: "var(--dim)" }}>
        ZIQVA OLIM — Platform Olimpiade Digital Indonesia untuk TK/PAUD, SD/MI, SMP/MTs, SMA/SMK/MA, Sekolah Kristen &amp; Cambridge. Berlatih setiap hari, raih medali emasmu! 🏆
      </footer>
    </div>
  );
}

// keep SUBJECTS referenced for tree-shaking clarity in some bundlers
void SUBJECTS;

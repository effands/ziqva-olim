// Bank soal original ZIQVA OLIM — disusun mengikuti format standar
// olimpiade (pilihan ganda, listening, urutan gambar, pola bilangan)
// dan diperluas ke semua jenjang & mata pelajaran.
//
// Sesi soal TIDAK lagi memakai bank ini secara mentah: buildSession()
// mencampur soal bank (dengan level kesulitan menurut urutannya) dengan
// soal baru dari generator prosedural (generators.ts), mengacak posisi
// pilihan jawaban, membuang duplikat, dan memprioritaskan soal yang
// belum pernah keluar di perangkat ini.

import { bandCoordFor, generateQuestions, shuffle, shuffleOptions } from "./generators";
import { BANK_EN, generateQuestionsEn } from "./cambridge";

export type JenjangId = "TK" | "SD" | "SMP" | "SMA";
export type SchoolType = "umum" | "madrasah" | "kristen" | "cambridge";

export interface Question {
  q: string;
  stimulus?: string;
  emoji?: string;
  options: string[];
  answer: number;
  explain: string;
  /**
   * Level kesulitan eksplisit (1–5) untuk pemetaan pita kelas di
   * buildSession. Tanpa nilai ini, level soal tertulis diturunkan dari
   * urutannya di dalam bank mapelnya.
   */
  lv?: number;
}

export interface SubjectDef {
  id: string;
  name: string;
  short: string;
  color: string;
  bg: string;
  school: SchoolType[] | "all";
  jenjang: JenjangId[];
  /** Paket Kompetisi: latihan gaya lomba (Nalaria / Kanguru) — ditandai lencana khusus di kartu mapel. */
  competition?: boolean;
}

export const SCHOOL_TYPES: { id: SchoolType; name: string; desc: string }[] = [
  { id: "umum", name: "Umum / Negeri", desc: "TK • SD • SMP • SMA • SMK negeri & swasta" },
  { id: "madrasah", name: "Madrasah", desc: "RA (setara TK) • MI • MTs • MA + mapel keislaman lengkap" },
  { id: "kristen", name: "Sekolah Kristen", desc: "TK • SD • SMP • SMA Kristen + Agama Kristen" },
  { id: "cambridge", name: "Cambridge Internasional", desc: "TK / Early Years • Primary • Secondary — soal berbahasa Inggris" },
];

export const JENJANG: { id: JenjangId; name: string; sub: string; ages: string; color: string }[] = [
  { id: "TK", name: "TK / PAUD", sub: "TK A • TK B • Kelompok Bermain", ages: "4–6 tahun", color: "#F0563C" },
  { id: "SD", name: "SD / MI", sub: "Kelas 1–6 • SD Negeri • MI • SD Kristen", ages: "7–12 tahun", color: "#0E9F8A" },
  { id: "SMP", name: "SMP / MTs", sub: "Kelas 7–9 • SMP • MTs • SMP Kristen", ages: "13–15 tahun", color: "#2E7CD6" },
  { id: "SMA", name: "SMA / SMK / MA", sub: "Kelas 10–12 • SMA • SMK • MA • SMA Kristen", ages: "16–18 tahun", color: "#7C4DBE" },
];

/* ---------------- KELAS di dalam jenjang ----------------
   Jenjang TIDAK dipukul rata: setiap jenjang punya kelas-kelasnya, dan
   kelas yang dipilih peserta menggeser pita topik & kesulitan soal
   (lihat banding di generators.ts), menyaring modul Perpustakaan yang
   khas kelas tertentu, dan tercatat di setiap attempt. */
export interface KelasDef {
  /** Id kelas yang disimpan: TK "A"/"B", SD "1".."6", SMP "7".."9", SMA "10".."12". */
  id: string;
  /** Label tampil, mis. "Kelas 3" / "Kelompok A". */
  label: string;
  /** Petunjuk topik khas kelas ini (tampil kecil di kartu pilihan kelas). */
  hint: string;
}

export const KELAS_BY_JENJANG: Record<JenjangId, KelasDef[]> = {
  TK: [
    { id: "A", label: "Kelompok A", hint: "Berhitung & bermain paling dasar" },
    { id: "B", label: "Kelompok B", hint: "Siap masuk SD: huruf, angka & pola" },
  ],
  SD: [
    { id: "1", label: "Kelas 1", hint: "Bilangan s.d. 99, tambah–kurang sederhana" },
    { id: "2", label: "Kelas 2", hint: "Tambah–kurang ratusan, perkalian dasar" },
    { id: "3", label: "Kelas 3", hint: "Perkalian & pembagian, pecahan sederhana" },
    { id: "4", label: "Kelas 4", hint: "Pecahan & desimal, FPB–KPK, bangun datar" },
    { id: "5", label: "Kelas 5", hint: "Pecahan lanjut, persen, bangun ruang" },
    { id: "6", label: "Kelas 6", hint: "Persen & data, bangun ruang, siap SMP" },
  ],
  SMP: [
    { id: "7", label: "Kelas 7", hint: "Bilangan bulat, aljabar dasar, himpunan" },
    { id: "8", label: "Kelas 8", hint: "Pola & relasi, Pythagoras, bangun ruang" },
    { id: "9", label: "Kelas 9", hint: "Pangkat & akar, peluang, siap SMA" },
  ],
  SMA: [
    { id: "10", label: "Kelas 10", hint: "Eksponen, fungsi, trigonometri dasar" },
    { id: "11", label: "Kelas 11", hint: "Barisan & deret, matriks, lingkaran" },
    { id: "12", label: "Kelas 12", hint: "Limit, turunan, integral, siap kuliah" },
  ],
};

export function kelasList(jenjang: JenjangId): KelasDef[] {
  return KELAS_BY_JENJANG[jenjang];
}

/** Kelas bawaan bila peserta belum memilih: kelas tengah jenjangnya. */
export function defaultKelas(jenjang: JenjangId): string {
  const list = KELAS_BY_JENJANG[jenjang];
  const mid = list[Math.floor((list.length - 1) / 2)] ?? list[0];
  return mid ? mid.id : "";
}

export function kelasDef(jenjang: JenjangId, kelas: string): KelasDef | undefined {
  return KELAS_BY_JENJANG[jenjang].find((k) => k.id === kelas);
}

/** Label kelas untuk id tersimpan; string kosong bila kelas tidak dikenal. */
export function kelasLabel(jenjang: JenjangId, kelas: string): string {
  return kelasDef(jenjang, kelas)?.label ?? "";
}

/** Label lengkap "SD • Kelas 3" (tanpa kelas bila id kosong/tidak dikenal). */
export function jenjangKelasLabel(jenjang: string, kelas: string): string {
  const lbl = (KELAS_BY_JENJANG[jenjang as JenjangId] ?? []).find((k) => k.id === kelas)?.label ?? "";
  return lbl ? `${jenjang} • ${lbl}` : jenjang;
}

/**
 * Posisi kelas di dalam jenjangnya, 0 (kelas terendah) .. 1 (kelas
 * tertinggi). Inilah "pita kelas" yang menggeser kesulitan & topik soal.
 */
export function kelasBand(jenjang: JenjangId, kelas: string): number {
  const list = KELAS_BY_JENJANG[jenjang];
  const idx = list.findIndex((k) => k.id === kelas);
  if (idx < 0 || list.length <= 1) return 0.5;
  return idx / (list.length - 1);
}

export const SUBJECTS: SubjectDef[] = [
  { id: "inggris", name: "Bahasa Inggris", short: "ENG", color: "#E84393", bg: "#FDE7F3", school: "all", jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "matematika", name: "Matematika", short: "MTK", color: "#1E2A78", bg: "#E6E9FA", school: "all", jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "nalaria", name: "Matematika Nalaria", short: "NAL", color: "#B45309", bg: "#FEF3C7", school: ["umum", "madrasah", "kristen"], jenjang: ["TK", "SD", "SMP", "SMA"], competition: true },
  { id: "kanguru-matematika", name: "Kanguru Matematika", short: "KGM", color: "#0F766E", bg: "#CCFBF1", school: ["umum", "madrasah", "kristen"], jenjang: ["TK", "SD", "SMP", "SMA"], competition: true },
  { id: "kanguru-bahasa", name: "Kanguru Bahasa", short: "KGB", color: "#BE185D", bg: "#FCE7F3", school: ["umum", "madrasah", "kristen"], jenjang: ["TK", "SD", "SMP", "SMA"], competition: true },
  { id: "seamo", name: "Matematika SEAMO Style", short: "SEA", color: "#2563EB", bg: "#DBEAFE", school: ["umum", "madrasah", "kristen"], jenjang: ["TK", "SD", "SMP", "SMA"], competition: true },
  { id: "sasmo", name: "Matematika SASMO Style", short: "SAS", color: "#C2410C", bg: "#FFEDD5", school: ["umum", "madrasah", "kristen"], jenjang: ["TK", "SD", "SMP", "SMA"], competition: true },
  { id: "amo", name: "Matematika AMO Style", short: "AMO", color: "#B91C1C", bg: "#FEE2E2", school: ["umum", "madrasah", "kristen"], jenjang: ["TK", "SD", "SMP", "SMA"], competition: true },
  { id: "jso", name: "Sains JSO Style", short: "JSO", color: "#15803D", bg: "#DCFCE7", school: ["umum", "madrasah", "kristen"], jenjang: ["TK", "SD", "SMP", "SMA"], competition: true },
  { id: "sains", name: "IPA / Sains", short: "IPA", color: "#0E9F8A", bg: "#E0F5F0", school: "all", jenjang: ["TK", "SD", "SMP"] },
  { id: "biologi", name: "Biologi", short: "BIO", color: "#2F9E44", bg: "#E6F7EA", school: "all", jenjang: ["SMA"] },
  { id: "fisika", name: "Fisika", short: "FIS", color: "#1971C2", bg: "#E3F0FB", school: "all", jenjang: ["SMA"] },
  { id: "kimia", name: "Kimia", short: "KIM", color: "#E8590C", bg: "#FDEEE3", school: "all", jenjang: ["SMA"] },
  { id: "indonesia", name: "Bahasa Indonesia", short: "BIN", color: "#C2255C", bg: "#FBE7EF", school: ["umum", "madrasah", "kristen"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "ips", name: "IPS & Sejarah", short: "IPS", color: "#A0610B", bg: "#FBF0DA", school: "all", jenjang: ["SD", "SMP", "SMA"] },
  { id: "ppkn", name: "PPKn / Kewarganegaraan", short: "PKN", color: "#B02A37", bg: "#FAE7E9", school: ["umum", "madrasah", "kristen"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "informatika", name: "Komputer / Informatika", short: "INF", color: "#364FC7", bg: "#E7EBFC", school: "all", jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "sejarah", name: "Sejarah", short: "SEJ", color: "#8A5A2B", bg: "#F7EBD9", school: "all", jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "jawa", name: "Bahasa Jawa", short: "JAW", color: "#8A5A12", bg: "#F7ECD4", school: ["umum", "madrasah", "kristen"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "arab", name: "Bahasa Arab", short: "ARB", color: "#0B7285", bg: "#DFF6F9", school: ["madrasah"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "pai", name: "Pend. Agama Islam (PAI)", short: "PAI", color: "#1E7A46", bg: "#E2F4E9", school: ["madrasah", "umum"], jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "akidah", name: "Akidah Akhlak", short: "AKD", color: "#2B8A3E", bg: "#E6F6EC", school: ["madrasah"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "fikih", name: "Fikih", short: "FKH", color: "#5F3DC4", bg: "#EEE9FB", school: ["madrasah"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "quranhadis", name: "Al-Qur'an Hadis", short: "QRH", color: "#0B7285", bg: "#DFF6F9", school: ["madrasah"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "ski", name: "Sejarah Kebudayaan Islam", short: "SKI", color: "#92580A", bg: "#F8EEDD", school: ["madrasah"], jenjang: ["SMP", "SMA"] },
  { id: "kristen", name: "Pend. Agama Kristen", short: "PAK", color: "#7048B6", bg: "#F0EAFB", school: ["kristen"], jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "cambridge-eng", name: "Cambridge English", short: "CEN", color: "#0A5CAD", bg: "#E1EFFB", school: ["cambridge"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "cambridge-sci", name: "Cambridge Science", short: "CSC", color: "#087F5B", bg: "#DFF7EE", school: ["cambridge"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "cambridge-math", name: "Cambridge Maths", short: "CMA", color: "#9C36B5", bg: "#F6E4FA", school: ["cambridge"], jenjang: ["SD", "SMP", "SMA"] },
  { id: "korea", name: "Bahasa Korea", short: "KOR", color: "#0A5CAD", bg: "#E1EFFB", school: "all", jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "jepang", name: "Bahasa Jepang", short: "JPN", color: "#D6336C", bg: "#FDE7F3", school: "all", jenjang: ["TK", "SD", "SMP", "SMA"] },
  { id: "mandarin", name: "Bahasa Mandarin", short: "MAN", color: "#E03131", bg: "#FDE7E7", school: "all", jenjang: ["TK", "SD", "SMP", "SMA"] },
];

export function subjectsFor(jenjang: JenjangId, school: SchoolType): SubjectDef[] {
  return SUBJECTS.filter(
    (s) => s.jenjang.includes(jenjang) && (s.school === "all" || s.school.includes(school)),
  );
}

type Bank = Partial<Record<JenjangId, Partial<Record<string, Question[]>>>>;

export const BANK: Bank = {
  TK: {
    inggris: [
      { q: "Look at the numbers! 4, 9, 11, 15, 19, 23, 28 — Which number is the “SMALLEST”?", emoji: "🔢", options: ["4", "9", "28"], answer: 0, explain: "Urutan dari terkecil: 4 < 9 < 11 < 15 < 19 < 23 < 28. Jadi yang terkecil adalah 4." },
      { q: "Arrange the letters to form the correct word! N – E – T", emoji: "🔤", options: ["Net", "Ten", "Tea"], answer: 1, explain: "N–E–T disusun menjadi TEN, artinya sepuluh (10)." },
      { q: "Which number is between 14 and 16?", emoji: "🔢", options: ["13", "15", "17"], answer: 1, explain: "Bilangan di antara 14 dan 16 adalah 15." },
      { q: "Complete the word! C _ T (a pet that says “meow”)", emoji: "🐱", options: ["A", "E", "O"], answer: 0, explain: "C-A-T = CAT, artinya kucing." },
      { q: "Look at the pictures: 1) wake up 🛏️  2) brush teeth 🪥  3) eat breakfast 🥣  4) go to school 🎒 — What does the child do AFTER eating breakfast?", emoji: "🎒", options: ["Go to bed", "Brush teeth", "Go to school"], answer: 2, explain: "Setelah sarapan (nomor 3), kegiatan berikutnya nomor 4 adalah pergi ke sekolah." },
      { q: "What colour is a banana?", emoji: "🍌", options: ["Blue", "Yellow", "Black"], answer: 1, explain: "Pisang berwarna kuning — yellow." },
      { q: "How many legs does a dog have?", emoji: "🐶", options: ["Two", "Four", "Six"], answer: 1, explain: "Anjing berkaki empat — four." },
      { q: "Listen and choose: “I see a RED apple.” Which fruit is red?", emoji: "🍎", options: ["🍌 Banana", "🍎 Apple", "🍇 Grapes"], answer: 1, explain: "Red apple = apel merah." },
    ],
    matematika: [
      { q: "Hitung bintang berikut: ⭐⭐⭐⭐⭐⭐ — Ada berapa bintang?", emoji: "⭐", options: ["5", "6", "7"], answer: 1, explain: "Hitung satu-satu: 1, 2, 3, 4, 5, 6. Ada 6 bintang." },
      { q: "Angka berapa yang hilang? 2, 4, __, 8, 10", emoji: "🔢", options: ["5", "6", "7"], answer: 1, explain: "Polanya loncat 2: 2, 4, 6, 8, 10." },
      { q: "Mana yang LEBIH BESAR?", emoji: "⚖️", options: ["8", "3", "5"], answer: 0, explain: "8 lebih besar dari 5 dan 3." },
      { q: "🍎🍎 + 🍎🍎🍎 = … apel?", emoji: "🍎", options: ["4", "5", "6"], answer: 1, explain: "2 + 3 = 5 apel." },
      { q: "Bentuk apa yang TIDAK punya sudut?", emoji: "⭕", options: ["Segitiga", "Persegi", "Lingkaran"], answer: 2, explain: "Lingkaran melengkung dan tidak memiliki sudut." },
      { q: "Setelah angka 17 adalah …", emoji: "🔢", options: ["16", "18", "20"], answer: 1, explain: "Urutan bilangan: …16, 17, 18, 19…" },
      { q: "Di taman ada 4 burung 🐦. Lalu datang lagi 3 burung 🐦. Sekarang ada berapa burung semuanya?", emoji: "🐦", options: ["6", "7", "8"], answer: 1, explain: "Hitung semuanya: 4 + 3 = 7 burung." },
      { q: "Ibu membawa 9 permen 🍬. Permen itu dimakan adik 2 buah. Sisa permen Ibu adalah …", emoji: "🍬", options: ["6", "7", "8"], answer: 1, explain: "9 − 2 = 7. Permen berkurang karena dimakan adik." },
    ],
    sains: [
      { q: "Hewan apa yang bisa terbang?", emoji: "🦋", options: ["Ikan", "Kupu-kupu", "Kucing"], answer: 1, explain: "Kupu-kupu punya sayap dan bisa terbang." },
      { q: "Kita melihat dengan …", emoji: "👀", options: ["Telinga", "Mata", "Hidung"], answer: 1, explain: "Mata adalah indera penglihatan." },
      { q: "Tanaman butuh apa supaya tumbuh?", emoji: "🌱", options: ["Air dan matahari", "Mainan", "Sepatu"], answer: 0, explain: "Tanaman butuh air dan cahaya matahari untuk tumbuh." },
      { q: "Suara sapi adalah …", emoji: "🐄", options: ["Meong", "Moo", "Guk guk"], answer: 1, explain: "Sapi bersuara “moo”." },
      { q: "Benda apa yang ada di langit pada malam hari?", emoji: "🌙", options: ["Matahari", "Bulan dan bintang", "Pelangi"], answer: 1, explain: "Malam hari kita melihat bulan dan bintang." },
      { q: "Pagi ini hujan turun 🌧️. Benda apa yang dipakai supaya badan tidak basah?", emoji: "☂️", options: ["Payung", "Kacamata hitam", "Topi ulang tahun"], answer: 0, explain: "Payung melindungi kita dari air hujan." },
      { q: "Bunga di pot disiram air setiap hari 💧🌷. Apa yang terjadi pada bunga itu?", emoji: "🌷", options: ["Bunga tumbuh segar", "Bunga berubah jadi batu", "Bunga hilang"], answer: 0, explain: "Tanaman butuh air supaya bisa tumbuh segar." },
    ],
    informatika: [
      { q: "Alat kecil yang digerakkan tangan untuk memindahkan panah di layar adalah …", emoji: "🖱️", options: ["Mouse", "Buku", "Penggaris"], answer: 0, explain: "Mouse menggerakkan panah (kursor) di layar." },
      { q: "Kita mengetik huruf dengan …", emoji: "⌨️", options: ["Speaker", "Keyboard", "Kipas"], answer: 1, explain: "Keyboard penuh huruf untuk mengetik." },
      { q: "Gambar dan tulisan dari komputer tampil di …", emoji: "🖥️", options: ["Layar / monitor", "Bawah meja", "Dalam tas"], answer: 0, explain: "Monitor menampilkan gambar dan tulisan." },
      { q: "Suara musik dari tablet keluar dari …", emoji: "🔊", options: ["Charger", "Speaker", "Kamera"], answer: 1, explain: "Speaker mengeluarkan suara." },
      { q: "Tablet dan HP bisa dipakai dengan menyentuh …", emoji: "📱", options: ["Layarnya", "Kabelnya", "Kotaknya"], answer: 0, explain: "Tablet & HP memakai layar sentuh." },
      { q: "Sebelum bermain HP, kita harus …", emoji: "🙋", options: ["Sembunyi-sembunyi", "Minta izin orang tua", "Bermain semalaman"], answer: 1, explain: "Selalu minta izin orang tua dulu." },
      { q: "Kalau mata sudah lelah bermain gawai, kita harus …", emoji: "👀", options: ["Istirahat dan melihat jauh", "Makin dekat ke layar", "Tidak tidur"], answer: 0, explain: "Istirahatkan mata secara teratur." },
      { q: "Ada orang asing mengajak bicara di game. Kita harus …", emoji: "🛡️", options: ["Memberi alamat rumah", "Ikut saja", "Beri tahu orang tua"], answer: 2, explain: "Jangan bicara dengan orang asing di internet; beri tahu orang tua." },
      { q: "Alat untuk mencetak gambar ke kertas adalah …", emoji: "🖨️", options: ["Printer", "Mouse", "Monitor"], answer: 0, explain: "Printer mencetak ke kertas." },
      { q: "Kalau baterai HP habis, kita mengisinya dengan …", emoji: "🔌", options: ["Air", "Charger", "Pasir"], answer: 1, explain: "Charger mengisi daya baterai." },
    ],
    sejarah: [
      { q: "Bendera negara kita berwarna …", emoji: "🇮🇩", options: ["Merah dan putih", "Biru dan kuning", "Hijau dan hitam"], answer: 0, explain: "Bendera Indonesia merah di atas, putih di bawah." },
      { q: "Lagu kebangsaan Indonesia adalah …", emoji: "🎵", options: ["Indonesia Raya", "Balonku", "Cicak di Dinding"], answer: 0, explain: "Indonesia Raya adalah lagu kebangsaan kita." },
      { q: "Hari Kemerdekaan Indonesia adalah tanggal …", emoji: "🎉", options: ["1 Januari", "17 Agustus", "25 Desember"], answer: 1, explain: "Indonesia merdeka 17 Agustus 1945." },
      { q: "Lambang negara Indonesia adalah …", emoji: "🦅", options: ["Garuda Pancasila", "Komodo", "Banteng"], answer: 0, explain: "Garuda Pancasila lambang negara kita." },
      { q: "Presiden pertama Indonesia adalah …", emoji: "👨", options: ["Ir. Soekarno", "Joko Widodo", "B.J. Habibie"], answer: 0, explain: "Ir. Soekarno presiden pertama Indonesia." },
      { q: "Wakil presiden pertama Indonesia adalah …", emoji: "👨", options: ["Moh. Hatta", "Soeharto", "Adam Malik"], answer: 0, explain: "Moh. Hatta adalah wakil presiden pertama." },
      { q: "Bendera pusaka kemerdekaan dijahit oleh Ibu …", emoji: "🧵", options: ["Kartini", "Fatmawati", "Cut Nyak Dien"], answer: 1, explain: "Ibu Fatmawati menjahit Bendera Pusaka." },
      { q: "Pahlawan adalah orang yang …", emoji: "🦸", options: ["Berani membela negara", "Suka marah-marah", "Paling kaya"], answer: 0, explain: "Pahlawan berani dan berjuang untuk negara." },
      { q: "Bahasa persatuan kita adalah Bahasa …", emoji: "🗣️", options: ["Inggris", "Indonesia", "Belanda"], answer: 1, explain: "Bahasa Indonesia adalah bahasa persatuan." },
      { q: "Ibu kota negara Indonesia adalah …", emoji: "🏙️", options: ["Jakarta", "Bandung", "Medan"], answer: 0, explain: "Jakarta adalah ibu kota negara." },
      { q: "Tugu Monas yang tinggi ada di kota …", emoji: "🗼", options: ["Surabaya", "Jakarta", "Semarang"], answer: 1, explain: "Monas (Monumen Nasional) berdiri di Jakarta." },
      { q: "Setiap tanggal 10 November kita memperingati Hari …", emoji: "🎖️", options: ["Pahlawan", "Ibu", "Anak"], answer: 0, explain: "10 November adalah Hari Pahlawan." },
      { q: "Teks proklamasi kemerdekaan dibacakan oleh …", emoji: "📜", options: ["Ir. Soekarno", "Pangeran Diponegoro", "Gajah Mada"], answer: 0, explain: "Ir. Soekarno membacakan teks proklamasi pada 17 Agustus 1945." },
      { q: "Warna merah pada bendera kita artinya …", emoji: "❤️", options: ["Berani", "Mengantuk", "Dingin"], answer: 0, explain: "Merah melambangkan keberanian, putih kesucian." },
    ],
    pai: [
      { q: "Siapa Tuhan kita?", emoji: "🌟", options: ["Allah SWT", "Matahari", "Bulan"], answer: 0, explain: "Tuhan kita adalah Allah SWT, Pencipta alam semesta." },
      { q: "Sebelum makan kita membaca …", emoji: "🍽️", options: ["Basmalah (Bismillah)", "Hamdalah", "Takbir"], answer: 0, explain: "Sebelum makan kita membaca basmalah: Bismillahirrahmanirrahim." },
      { q: "Nabi kita bernama Nabi …", emoji: "🌙", options: ["Muhammad SAW", "Ibrahim AS", "Musa AS"], answer: 0, explain: "Nabi terakhir dan teladan kita adalah Nabi Muhammad SAW." },
      { q: "Rukun Islam yang pertama adalah …", emoji: "🕌", options: ["Salat", "Syahadat", "Puasa"], answer: 1, explain: "Rukun Islam: 1) Syahadat, 2) Salat, 3) Zakat, 4) Puasa, 5) Haji." },
      { q: "Setelah makan kita mengucapkan …", emoji: "🙏", options: ["Alhamdulillah", "Astaghfirullah", "Subhanallah"], answer: 0, explain: "Alhamdulillah = segala puji bagi Allah, tanda syukur setelah makan." },
    ],
    kristen: [
      { q: "Siapa yang menciptakan langit dan bumi?", emoji: "🌍", options: ["Tuhan Allah", "Manusia", "Malaikat"], answer: 0, explain: "Kejadian 1:1 — Pada mulanya Allah menciptakan langit dan bumi." },
      { q: "Yesus lahir di kota …", emoji: "⭐", options: ["Betlehem", "Roma", "Mesir"], answer: 0, explain: "Yesus lahir di Betlehem (Matius 2:1)." },
      { q: "Kita berbicara dengan Tuhan melalui …", emoji: "🙏", options: ["Doa", "Tidur", "Bermain"], answer: 0, explain: "Doa adalah cara kita berbicara dengan Tuhan." },
      { q: "Hari ibadah orang Kristen ke gereja adalah hari …", emoji: "⛪", options: ["Senin", "Jumat", "Minggu"], answer: 2, explain: "Umat Kristen beribadah bersama di gereja pada hari Minggu." },
      { q: "Perintah Tuhan: Kasihilah …", emoji: "❤️", options: ["Sesamamu", "Mainanmu saja", "Dirimu saja"], answer: 0, explain: "“Kasihilah sesamamu manusia seperti dirimu sendiri” (Matius 22:39)." },
    ],
  },
  SD: {
    matematika: [
      { q: "Pola bilangan: 3, 6, 11, 18, 27, … Bilangan berikutnya adalah …", options: ["36", "38", "40", "42"], answer: 1, lv: 4, explain: "Selisihnya +3, +5, +7, +9 (bilangan ganjil). Berikutnya +11 → 27 + 11 = 38." },
      { q: "Hasil dari 24 × 15 + 60 : 12 adalah …", options: ["355", "365", "370", "375"], answer: 1, lv: 4, explain: "24×15=360; 60:12=5; 360+5=365. Perkalian & pembagian dikerjakan lebih dulu." },
      { q: "Sebuah tali 3/4 meter dipotong menjadi 3 bagian sama panjang. Setiap bagian … meter.", options: ["1/4", "1/3", "1/2", "3/4"], answer: 0, lv: 5, explain: "3/4 : 3 = 3/4 × 1/3 = 1/4 meter." },
      { q: "FPB dari 36 dan 48 adalah …", options: ["6", "8", "12", "18"], answer: 2, lv: 4, explain: "36=2²×3², 48=2⁴×3. FPB=2²×3=12." },
      { q: "Jumlah dua bilangan prima terkecil yang lebih dari 20 adalah …", options: ["46", "48", "50", "52"], answer: 3, lv: 5, explain: "Bilangan prima setelah 20 yang terkecil adalah 23 dan 29. 23 + 29 = 52." },
      { q: "Keliling persegi panjang 12 cm × 7 cm adalah … cm", options: ["38", "42", "76", "84"], answer: 0, lv: 4, explain: "K = 2×(12+7) = 2×19 = 38 cm." },
      { q: "Hasil dari 5² + 3³ adalah …", options: ["34", "43", "52", "61"], answer: 2, lv: 5, explain: "5²=25, 3³=27, 25+27=52." },
      { q: "Rata-rata nilai 6, 8, 7, 9, 10 adalah …", options: ["7", "8", "8,5", "9"], answer: 1, lv: 4, explain: "Jumlah=40, 40:5=8." },
      { q: "Sebuah toko menjual 1 lusin pensil seharga Rp24.000. Harga 1 pensil adalah …", options: ["Rp1.000", "Rp2.000", "Rp2.400", "Rp12.000"], answer: 1, lv: 4, explain: "Langkah 1: 1 lusin = 12 pensil. Langkah 2: harga satuan = 24.000 : 12 = Rp2.000." },
      { q: "Nilai ulangan Dina selama seminggu: 80, 90, 70, 100, 60. Nilai tertinggi dan terendah berturut-turut adalah …", options: ["100 dan 60", "90 dan 70", "100 dan 70", "90 dan 60"], answer: 0, lv: 3, explain: "Langkah 1: urutkan nilai dari yang kecil: 60, 70, 80, 90, 100. Langkah 2: yang paling besar adalah 100 dan yang paling kecil adalah 60." },
      { q: "Sebuah bus berangkat pukul 08.15 dan tiba pukul 10.45. Lama perjalanan bus adalah …", options: ["2 jam", "2 jam 15 menit", "2 jam 30 menit", "3 jam"], answer: 2, lv: 3, explain: "Langkah 1: dari 08.15 ke 10.15 adalah 2 jam. Langkah 2: dari 10.15 ke 10.45 adalah 30 menit. Jadi lama perjalanan 2 jam 30 menit." },
      { q: "Pernyataan yang BENAR tentang pecahan adalah …", options: ["1/2 lebih besar dari 3/4", "2/4 sama dengan 1/2", "1/3 lebih besar dari 1/2", "3/4 lebih kecil dari 1/4"], answer: 1, lv: 4, explain: "Langkah 1: sederhanakan 2/4 dengan membagi pembilang dan penyebut dengan 2, hasilnya 1/2 — jadi 2/4 sama dengan 1/2. Langkah 2: pilihan lain salah: 1/2 < 3/4, 1/3 < 1/2, dan 3/4 > 1/4." },
    ],
    inggris: [
      { q: "Read: “Sinta goes to school by bicycle every morning.” How does Sinta go to school?", options: ["By bus", "By bicycle", "On foot", "By car"], answer: 1, explain: "Kalimatnya jelas: by bicycle = dengan sepeda." },
      { q: "Choose the correct sentence!", options: ["She have a new bag.", "She has a new bag.", "She haves a new bag.", "She having a new bag."], answer: 1, explain: "Subjek tunggal (she) memakai has." },
      { q: "Arrange: library – I – books – in – the – read", options: ["I read books in the library.", "I books read in the library.", "Read I books the library in.", "In the library books I read."], answer: 0, explain: "Susunan S-V-O-K: I (S) read (V) books (O) in the library (K)." },
      { q: "The opposite of “brave” is …", options: ["Strong", "Afraid", "Happy", "Clever"], answer: 1, explain: "Brave = berani, lawan katanya afraid = takut." },
      { q: "There are … months in a year.", options: ["Ten", "Eleven", "Twelve", "Twenty"], answer: 2, explain: "Satu tahun ada 12 bulan — twelve." },
      { q: "My father’s sister is my …", options: ["Uncle", "Aunt", "Cousin", "Grandmother"], answer: 1, explain: "Saudara perempuan ayah = bibi = aunt." },
    ],
    sains: [
      { q: "Bagian tumbuhan yang berfungsi menyerap air dan zat hara dari tanah adalah …", options: ["Daun", "Batang", "Akar", "Bunga"], answer: 2, explain: "Akar menyerap air & mineral dari tanah." },
      { q: "Perubahan wujud benda dari cair menjadi gas disebut …", options: ["Membeku", "Menguap", "Mencair", "Mengembun"], answer: 1, explain: "Cair → gas = menguap (evaporasi)." },
      { q: "Sumber energi utama bagi kehidupan di Bumi adalah …", options: ["Bulan", "Matahari", "Bintang", "Api"], answer: 1, explain: "Matahari adalah sumber energi utama di Bumi." },
      { q: "Hewan yang mengalami metamorfosis sempurna adalah …", options: ["Ayam", "Kecoa", "Kupu-kupu", "Belalang"], answer: 2, explain: "Kupu-kupu: telur → larva (ulat) → pupa (kepompong) → dewasa." },
      { q: "Gaya yang menyebabkan buah jatuh ke tanah adalah gaya …", options: ["Gesek", "Magnet", "Gravitasi", "Otot"], answer: 2, explain: "Gravitasi Bumi menarik benda ke bawah." },
      { q: "Urutan planet dari yang terdekat dengan Matahari adalah …", options: ["Venus, Merkurius, Bumi", "Merkurius, Venus, Bumi", "Bumi, Venus, Mars", "Merkurius, Bumi, Venus"], answer: 1, explain: "Merkurius – Venus – Bumi – Mars – Jupiter – Saturnus – Uranus – Neptunus." },
      { q: "Dua pot tanaman diletakkan di tempat berbeda. Pot A di dekat jendela yang terang, pot B di dalam lemari yang gelap. Setelah seminggu, tanaman yang diperkirakan tumbuh lebih sehat adalah …", options: ["Pot B, karena gelap membuat daun lebar", "Pot A, karena tanaman butuh cahaya matahari untuk fotosintesis", "Keduanya sama sehatnya", "Pot B, karena lemari lebih hangat"], answer: 1, explain: "Tanaman memerlukan cahaya matahari untuk berfotosintesis (membuat makanan). Di tempat gelap tanaman menjadi pucat, kurus, dan lemah." },
      { q: "Suhu air dalam gelas diukur setiap 5 menit: 30°C, 34°C, 38°C, 42°C. Kesimpulan yang tepat dari data itu adalah …", options: ["Air semakin dingin", "Suhu air naik 4°C setiap 5 menit", "Suhu air tetap", "Suhu air naik 10°C setiap 5 menit"], answer: 1, explain: "Langkah 1: hitung selisih tiap pengukuran: 34−30 = 4, 38−34 = 4, 42−38 = 4. Langkah 2: kenaikannya tetap, yaitu 4°C setiap 5 menit." },
      { q: "Sebuah magnet didekatkan ke beberapa benda: paku besi menempel, penghapus tidak menempel, peniti menempel, kertas tidak menempel. Kesimpulan yang tepat adalah …", options: ["Magnet menarik semua benda", "Magnet hanya menarik benda dari logam besi", "Magnet menarik benda yang kecil saja", "Magnet tidak menarik benda apa pun"], answer: 1, explain: "Paku dan peniti terbuat dari besi sehingga tertarik magnet. Penghapus dan kertas bukan logam besi sehingga tidak tertarik — jadi magnet hanya menarik benda logam tertentu seperti besi." },
      { q: "Ibu menjemur pakaian basah di bawah sinar matahari. Setelah beberapa jam pakaian menjadi kering karena …", options: ["Air pada pakaian membeku", "Air pada pakaian menguap oleh panas matahari", "Air meresap ke tali jemuran", "Angin mengubah air menjadi debu"], answer: 1, explain: "Panas matahari membuat air pada pakaian berubah menjadi uap air (menguap) ke udara, sehingga pakaian menjadi kering." },
    ],
    indonesia: [
      { q: "Ide pokok paragraf biasanya terdapat pada kalimat …", options: ["Penjelas", "Utama", "Terakhir saja", "Judul"], answer: 1, explain: "Ide pokok terdapat pada kalimat utama paragraf." },
      { q: "Antonim kata “rajin” adalah …", options: ["Giat", "Malas", "Pintar", "Cepat"], answer: 1, explain: "Rajin lawan katanya malas." },
      { q: "Kalimat yang menggunakan huruf kapital dengan benar adalah …", options: ["andi pergi ke jakarta.", "Andi pergi ke Jakarta.", "Andi pergi ke jakarta.", "andi Pergi ke Jakarta."], answer: 1, explain: "Awal kalimat dan nama kota memakai huruf kapital: Andi, Jakarta." },
      { q: "“Ibu memasak nasi di dapur.” Kata kerjanya adalah …", options: ["Ibu", "Memasak", "Nasi", "Dapur"], answer: 1, explain: "Memasak adalah kata kerja (predikat)." },
      { q: "Peribahasa “Berakit-rakit ke hulu, berenang-renang ke tepian” artinya …", options: ["Bersakit-sakit dahulu, bersenang-senang kemudian", "Suka bermain air", "Pandai berenang", "Suka bepergian"], answer: 0, explain: "Artinya bersusah payah dahulu, baru menikmati hasilnya kemudian." },
    ],
    ips: [
      { q: "Proklamasi Kemerdekaan Indonesia dibacakan pada tanggal …", options: ["17 Agustus 1945", "20 Mei 1908", "28 Oktober 1928", "1 Juni 1945"], answer: 0, explain: "Proklamasi dibacakan Soekarno pada 17 Agustus 1945." },
      { q: "Candi Borobudur terletak di provinsi …", options: ["Jawa Timur", "Jawa Tengah", "DI Yogyakarta", "Jawa Barat"], answer: 1, explain: "Borobudur berada di Magelang, Jawa Tengah." },
      { q: "Kegiatan membeli barang dari luar negeri disebut …", options: ["Ekspor", "Impor", "Produksi", "Distribusi"], answer: 1, explain: "Impor = membeli dari luar negeri; ekspor = menjual ke luar negeri." },
      { q: "Sungai terpanjang di Indonesia adalah …", options: ["Sungai Musi", "Sungai Barito", "Sungai Kapuas", "Sungai Bengawan Solo"], answer: 2, explain: "Sungai Kapuas di Kalimantan Barat adalah yang terpanjang (±1.143 km)." },
      { q: "Lambang negara Indonesia adalah …", options: ["Garuda Pancasila", "Bendera Merah Putih", "Burung Merak", "Pohon Beringin"], answer: 0, explain: "Lambang negara adalah Garuda Pancasila." },
    ],
    ppkn: [
      { q: "Sila ke-2 Pancasila berbunyi …", options: ["Ketuhanan Yang Maha Esa", "Kemanusiaan yang adil dan beradab", "Persatuan Indonesia", "Keadilan sosial bagi seluruh rakyat Indonesia"], answer: 1, explain: "Urutan sila: 1 Ketuhanan, 2 Kemanusiaan, 3 Persatuan, 4 Kerakyatan, 5 Keadilan sosial." },
      { q: "Sikap yang sesuai sila ke-3 adalah …", options: ["Suka menolong tetangga", "Bangga memakai produk Indonesia", "Rajin beribadah", "Adil kepada semua teman"], answer: 1, explain: "Sila ke-3 Persatuan Indonesia: cinta tanah air, bangga produk dalam negeri." },
      { q: "UUD 1945 disahkan pada tanggal …", options: ["17 Agustus 1945", "18 Agustus 1945", "28 Oktober 1928", "22 Juni 1945"], answer: 1, explain: "UUD 1945 disahkan PPKI pada 18 Agustus 1945." },
      { q: "Musyawarah dilakukan untuk mencapai …", options: ["Kemenangan kelompok", "Mufakat bersama", "Keputusan sepihak", "Hadiah"], answer: 1, explain: "Musyawarah bertujuan mencapai mufakat demi kepentingan bersama." },
    ],
    informatika: [
      { q: "Perangkat komputer yang berfungsi sebagai “otak” untuk memproses data adalah …", options: ["Monitor", "CPU / Prosesor", "Printer", "Mouse"], answer: 1, explain: "Prosesor (CPU) memproses semua perintah dan data." },
      { q: "Berikut ini yang termasuk perangkat lunak (software) adalah …", options: ["Keyboard", "Harddisk", "Microsoft Word", "RAM"], answer: 2, explain: "Microsoft Word adalah aplikasi/software; lainnya perangkat keras." },
      { q: "Satuan data yang paling kecil adalah …", options: ["Byte", "Bit", "Kilobyte", "Gigabyte"], answer: 1, explain: "Bit adalah satuan data terkecil; 8 bit = 1 byte." },
      { q: "Untuk menyimpan file agar aman dari virus, kita sebaiknya …", options: ["Membuka semua lampiran email", "Membuat salinan cadangan (backup)", "Mematikan antivirus", "Berbagi kata sandi"], answer: 1, explain: "Backup rutin melindungi data dari kerusakan & virus." },
    ],
    jawa: [
      { q: "“Sugeng enjing” tegese …", options: ["Selamat malam", "Selamat pagi", "Selamat siang", "Selamat tinggal"], answer: 1, explain: "Enjing = pagi, sugeng enjing = selamat pagi." },
      { q: "Basa krama inggil (paling alus) saka tembung “mangan” yaiku …", options: ["Nedha", "Dahar", "Melu", "Ngombe"], answer: 1, explain: "Krama inggil “mangan” = dahar. “Nedha” iku krama biasa, dudu sing paling alus." },
      { q: "Aksara Jawa “ꦲ” diwaca …", options: ["Na", "Ha", "Ca", "Ra"], answer: 1, explain: "ꦲ = ha, aksara pertama hanacaraka." },
      { q: "“Bapak tindak dhateng kantor” — tembung “tindak” tegese …", options: ["Makan", "Pergi / berangkat", "Tidur", "Duduk"], answer: 1, explain: "Tindak (krama) = pergi/berangkat." },
    ],
    arab: [
      { q: "Bahasa Arabnya “buku” adalah …", options: ["قَلَمٌ", "كِتَابٌ", "بَابٌ", "مَاءٌ"], answer: 1, explain: "كِتَابٌ (kitābun) = buku. قَلَمٌ = pena." },
      { q: "Kata “مَدْرَسَةٌ” artinya …", options: ["Rumah", "Masjid", "Sekolah", "Pasar"], answer: 2, explain: "مَدْرَسَةٌ (madrasatun) = sekolah." },
      { q: "Huruf hijaiyah berjumlah …", options: ["26", "28", "32", "30"], answer: 1, explain: "Huruf hijaiyah ada 28 huruf, dari alif sampai ya (hamzah tidak dihitung sebagai huruf tersendiri)." },
      { q: "“صَبَاحُ الْخَيْرِ” artinya …", options: ["Selamat malam", "Selamat pagi", "Terima kasih", "Sampai jumpa"], answer: 1, explain: "Ṣabāḥul khair = selamat pagi." },
    ],
    pai: [
      { q: "Rukun iman berjumlah …", options: ["5", "6", "7", "4"], answer: 1, explain: "Rukun iman ada 6: iman kepada Allah, malaikat, kitab, rasul, hari kiamat, qada & qadar." },
      { q: "Kitab suci umat Islam adalah …", options: ["Injil", "Taurat", "Al-Qur'an", "Zabur"], answer: 2, explain: "Al-Qur'an diturunkan kepada Nabi Muhammad SAW." },
      { q: "Salat Subuh berjumlah … rakaat", options: ["2", "3", "4", "5"], answer: 0, explain: "Subuh 2 rakaat, Zuhur 4, Asar 4, Magrib 3, Isya 4." },
      { q: "Malaikat yang bertugas menyampaikan wahyu adalah …", options: ["Mikail", "Jibril", "Izrail", "Israfil"], answer: 1, explain: "Malaikat Jibril menyampaikan wahyu kepada para nabi." },
      { q: "Bulan puasa bagi umat Islam adalah bulan …", options: ["Syawal", "Rajab", "Ramadan", "Muharam"], answer: 2, explain: "Puasa wajib dilakukan pada bulan Ramadan." },
    ],
    akidah: [
      { q: "Sifat wajib Allah “Wujud” artinya …", options: ["Ada", "Kekal", "Berdiri sendiri", "Maha Esa"], answer: 0, explain: "Wujud = Allah itu ada." },
      { q: "Asmaul Husna “Ar-Rahman” artinya Allah Maha …", options: ["Melihat", "Pengasih", "Mendengar", "Mengetahui"], answer: 1, explain: "Ar-Rahman = Maha Pengasih." },
      { q: "Berperilaku jujur termasuk akhlak …", options: ["Tercela", "Terpuji", "Biasa", "Terlarang"], answer: 1, explain: "Jujur adalah akhlak terpuji (mahmudah)." },
      { q: "Iman kepada hari akhir termasuk rukun iman ke-…", options: ["3", "4", "5", "6"], answer: 2, explain: "Urutan: Allah(1), malaikat(2), kitab(3), rasul(4), hari kiamat(5), qada-qadar(6)." },
    ],
    fikih: [
      { q: "Air yang suci dan dapat menyucikan disebut air …", options: ["Mutlak", "Mustakmal", "Mukhalit", "Najis"], answer: 0, explain: "Air mutlak = suci dan menyucikan, misal air hujan, sumur, sungai." },
      { q: "Wudu membasuh wajah sebanyak … kali dianjurkan", options: ["1", "2", "3", "5"], answer: 2, explain: "Disunahkan membasuh anggota wudu tiga kali." },
      { q: "Hal yang membatalkan puasa adalah …", options: ["Tidur siang", "Makan dengan sengaja", "Berkumur saat wudu", "Mandi"], answer: 1, explain: "Makan/minum dengan sengaja membatalkan puasa." },
      { q: "Zakat fitrah dibayarkan pada bulan …", options: ["Ramadan menjelang Idulfitri", "Syawal setelah lebaran", "Muharam", "Zulhijah"], answer: 0, explain: "Zakat fitrah ditunaikan di bulan Ramadan sebelum salat Idulfitri." },
    ],
    quranhadis: [
      { q: "Surah pertama dalam Al-Qur'an adalah …", options: ["Al-Baqarah", "Al-Fatihah", "Yasin", "Al-Ikhlas"], answer: 1, explain: "Al-Fatihah adalah surah pembuka (Ummul Kitab)." },
      { q: "Al-Qur'an terdiri dari … surah", options: ["99", "110", "114", "120"], answer: 2, explain: "Al-Qur'an terdiri dari 114 surah dan 30 juz." },
      { q: "Wahyu pertama turun di Gua …", options: ["Tsur", "Hira", "Nur", "Uhud"], answer: 1, explain: "Wahyu pertama (Al-'Alaq 1–5) turun di Gua Hira." },
      { q: "Hadis “Innamal a'malu binniyat” mengajarkan pentingnya …", options: ["Kekayaan", "Niat dalam beramal", "Kecepatan", "Kedudukan"], answer: 1, explain: "“Sesungguhnya amal itu tergantung niatnya” (HR. Bukhari-Muslim)." },
    ],
    kristen: [
      { q: "Kitab pertama dalam Alkitab adalah …", options: ["Mazmur", "Kejadian", "Matius", "Keluaran"], answer: 1, explain: "Kejadian menceritakan penciptaan dunia oleh Allah." },
      { q: "Yesus mengajar murid-murid-Nya berdoa dengan doa …", options: ["Doa Bapa Kami", "Doa Syafaat", "Doa Pagi", "Doa Makan"], answer: 0, explain: "Doa Bapa Kami diajarkan Yesus (Matius 6:9–13)." },
      { q: "Buah Roh yang pertama menurut Galatia 5:22 adalah …", options: ["Sukacita", "Kasih", "Damai sejahtera", "Kesabaran"], answer: 1, explain: "“Buah Roh ialah: kasih, sukacita, damai sejahtera, …”" },
      { q: "Nabi yang memimpin bangsa Israel keluar dari Mesir adalah …", options: ["Abraham", "Daud", "Musa", "Elia"], answer: 2, explain: "Musa memimpin Keluaran (Eksodus) dari perbudakan Mesir." },
      { q: "Perayaan kelahiran Yesus disebut …", options: ["Paskah", "Natal", "Pentakosta", "Kenaikan"], answer: 1, explain: "Natal = kelahiran Yesus, 25 Desember." },
    ],
    "cambridge-eng": [
      { q: "Choose the correct sentence: “Tom ___ to school by bus yesterday.”", options: ["go", "goes", "went", "going"], answer: 2, explain: "“Yesterday” = past tense → went." },
      { q: "Which word is an adjective?", options: ["Quickly", "Beautiful", "Run", "Happiness"], answer: 1, explain: "Beautiful describes a noun → adjective." },
      { q: "The plural of “child” is …", options: ["Childs", "Childes", "Children", "Childrens"], answer: 2, explain: "Irregular plural: child → children." },
      { q: "Read: “The cat is under the table.” Where is the cat?", options: ["On the table", "Under the table", "Behind the door", "In the box"], answer: 1, explain: "Under = di bawah." },
    ],
    "cambridge-sci": [
      { q: "Which part of the plant makes food using sunlight?", options: ["Root", "Stem", "Leaf", "Flower"], answer: 2, explain: "Leaves photosynthesise — they make food from sunlight, water and air." },
      { q: "Water boils at … °C", options: ["50", "80", "100", "120"], answer: 2, explain: "At sea level, water boils at 100 °C." },
      { q: "Which animal is a mammal?", options: ["Shark", "Dolphin", "Octopus", "Penguin"], answer: 1, explain: "Dolphins are mammals: they breathe air and feed milk to their young." },
      { q: "The force that pulls objects to Earth is …", options: ["Friction", "Magnetism", "Gravity", "Push"], answer: 2, explain: "Gravity pulls everything towards the Earth." },
    ],
    "cambridge-math": [
      { q: "What is 7 × 8?", options: ["54", "56", "63", "48"], answer: 1, explain: "7 × 8 = 56." },
      { q: "Which fraction is biggest?", options: ["1/2", "1/4", "3/4", "1/3"], answer: 2, explain: "3/4 = 0.75 is the largest." },
      { q: "Next in the sequence: 5, 10, 20, 40, …", options: ["50", "60", "80", "100"], answer: 2, explain: "Each number doubles: 40 × 2 = 80." },
      { q: "A square has sides of 6 cm. Its perimeter is …", options: ["12 cm", "24 cm", "36 cm", "18 cm"], answer: 1, explain: "Perimeter = 4 × 6 = 24 cm." },
    ],
  },
  SMP: {
    matematika: [
      { q: "Hasil dari (−3)² + 4 × (−2) − 5 adalah …", options: ["−4", "−6", "4", "6"], answer: 0, explain: "(−3)²=9; 4×(−2)=−8; 9−8−5=−4." },
      { q: "Jika 3x − 7 = 2x + 5, maka nilai x adalah …", options: ["10", "11", "12", "13"], answer: 2, explain: "3x−2x = 5+7 → x = 12." },
      { q: "Barisan 2, 5, 10, 17, 26, … suku berikutnya adalah …", options: ["35", "36", "37", "38"], answer: 2, explain: "Selisih +3,+5,+7,+9, berikutnya +11 → 26+11=37. (Pola n²+1)" },
      { q: "Sebuah peta berskala 1 : 500.000. Jarak dua kota 7 cm di peta, jarak sebenarnya … km", options: ["3,5", "35", "70", "350"], answer: 1, explain: "7 × 500.000 cm = 3.500.000 cm = 35 km." },
      { q: "Peluang muncul mata dadu prima pada satu kali lemparan adalah …", options: ["1/6", "1/3", "1/2", "2/3"], answer: 2, explain: "Mata prima: 2,3,5 → 3 dari 6 = 1/2." },
      { q: "Gradien garis yang melalui (2,3) dan (6,11) adalah …", options: ["1", "2", "3", "4"], answer: 1, explain: "m = (11−3)/(6−2) = 8/4 = 2." },
      { q: "Luas permukaan kubus dengan rusuk 5 cm adalah … cm²", options: ["125", "150", "100", "75"], answer: 1, explain: "6 × 5² = 6 × 25 = 150 cm²." },
      { q: "Sebuah toko memberi diskon 20% untuk sepatu seharga Rp250.000, lalu ada potongan tambahan Rp10.000 di kasir. Harga akhir yang dibayar adalah …", options: ["Rp180.000", "Rp190.000", "Rp200.000", "Rp210.000"], answer: 1, explain: "Langkah 1: diskon 20% = 20/100 × 250.000 = Rp50.000, sehingga harga menjadi 250.000 − 50.000 = Rp200.000. Langkah 2: dikurangi potongan kasir: 200.000 − 10.000 = Rp190.000." },
      { q: "Data nilai ulangan satu kelas: 6, 7, 8, 7, 9, 7, 8. Median data tersebut adalah …", options: ["6", "7", "8", "9"], answer: 1, explain: "Langkah 1: urutkan data dari kecil: 6, 7, 7, 7, 8, 8, 9. Langkah 2: ada 7 data, nilai tengahnya adalah data ke-4, yaitu 7." },
      { q: "Sebuah tangga sepanjang 13 m disandarkan ke dinding. Ujung bawah tangga berjarak 5 m dari dinding. Tinggi ujung atas tangga dari lantai adalah … m", options: ["8", "10", "12", "18"], answer: 2, explain: "Langkah 1: tangga, dinding, dan lantai membentuk segitiga siku-siku dengan tangga sebagai sisi miring. Langkah 2: tinggi = √(13² − 5²) = √(169 − 25) = √144 = 12 m." },
    ],
    inggris: [
      { q: "“The report ___ by the students yesterday.” Choose the correct passive form!", options: ["writes", "wrote", "was written", "is writing"], answer: 2, explain: "Passive past: was/were + V3 (written). Yesterday → was written." },
      { q: "Read: “Dolphins are intelligent mammals. They can learn tricks and communicate with sounds.” The main idea is …", options: ["Dolphins live in the sea", "Dolphins are intelligent mammals", "Dolphins eat fish", "Dolphins are big animals"], answer: 1, explain: "Kalimat pertama adalah ide pokok; kalimat kedua mendukungnya." },
      { q: "She has lived in Bandung ___ 2019.", options: ["for", "since", "from", "until"], answer: 1, explain: "Present perfect + titik waktu (2019) memakai since." },
      { q: "Choose the correct indirect speech: Direct: “I am busy,” he said. → He said that …", options: ["he is busy", "he was busy", "I was busy", "he busy"], answer: 1, explain: "Reported speech: am → was, I → he." },
      { q: "The synonym of “rapid” is …", options: ["Slow", "Fast", "Weak", "Late"], answer: 1, explain: "Rapid = cepat = fast." },
    ],
    sains: [
      { q: "Persamaan reaksi fotosintesis yang benar adalah …", options: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", "CO₂ + H₂O → O₂ + H₂", "6O₂ + 6H₂O → C₆H₁₂O₆ + CO₂"], answer: 0, explain: "Fotosintesis: karbon dioksida + air —(cahaya, klorofil)→ glukosa + oksigen." },
      { q: "Sebuah benda bermassa 4 kg dipercepat 3 m/s². Gaya yang bekerja adalah … N", options: ["7", "12", "1,33", "24"], answer: 1, explain: "Hukum II Newton: F = m × a = 4 × 3 = 12 N." },
      { q: "Organel sel yang berfungsi sebagai tempat respirasi sel penghasil energi adalah …", options: ["Ribosom", "Nukleus", "Mitokondria", "Vakuola"], answer: 2, explain: "Mitokondria = “powerhouse of the cell”, menghasilkan ATP." },
      { q: "pH larutan yang bersifat asam adalah …", options: ["pH = 7", "pH > 7", "pH < 7", "pH = 14"], answer: 2, explain: "Asam: pH<7, netral: 7, basa: pH>7." },
      { q: "Perpindahan panas tanpa melalui zat perantara disebut …", options: ["Konduksi", "Konveksi", "Radiasi", "Isolasi"], answer: 2, explain: "Radiasi: panas matahari sampai ke Bumi tanpa medium." },
      { q: "Satuan SI untuk kuat arus listrik adalah …", options: ["Volt", "Ohm", "Ampere", "Watt"], answer: 2, explain: "Kuat arus = Ampere (A); tegangan = Volt; hambatan = Ohm; daya = Watt." },
      { q: "Percobaan: tiga tanaman sejenis diberi air berbeda — A 50 ml/hari, B 100 ml/hari, C 200 ml/hari. Tinggi tanaman setelah 2 minggu: A 8 cm, B 14 cm, C 10 cm. Kesimpulan paling tepat adalah …", options: ["Semakin banyak air, semakin tinggi tanaman", "Pemberian air 100 ml/hari memberi pertumbuhan terbaik pada percobaan ini", "Air tidak berpengaruh pada pertumbuhan", "Tanaman C pasti mati karena kebanyakan air"], answer: 1, explain: "Data menunjukkan tanaman B (100 ml/hari) tumbuh paling tinggi, 14 cm. Tanaman C yang diberi air paling banyak justru lebih pendek dari B, jadi kesimpulan harus mengikuti data: ada jumlah air yang pas, bukan sekadar semakin banyak semakin baik." },
      { q: "Sebuah rangkaian memakai baterai 12 V dan lampu berhambatan 4 Ω. Kuat arus yang mengalir adalah … A", options: ["0,33", "3", "8", "48"], answer: 1, explain: "Langkah 1: gunakan Hukum Ohm: I = V : R. Langkah 2: I = 12 : 4 = 3 A." },
      { q: "Pada percobaan fotosintesis, tanaman air di gelas yang diletakkan di tempat terang mengeluarkan banyak gelembung, sedangkan di tempat gelap tidak. Gelembung itu adalah gas … dan percobaan ini membuktikan fotosintesis membutuhkan …", options: ["Karbon dioksida; air", "Oksigen; cahaya matahari", "Nitrogen; pupuk", "Uap air; tanah"], answer: 1, explain: "Gelembung yang keluar dari tanaman air saat fotosintesis adalah gas oksigen, hasil fotosintesis. Karena gelembung hanya muncul di tempat terang, cahaya matahari terbukti menjadi syarat fotosintesis." },
    ],
    indonesia: [
      { q: "Kalimat berikut yang merupakan kalimat efektif adalah …", options: ["Para siswa-siswa sedang belajar.", "Siswa sedang belajar di kelas.", "Kepada para hadirin dimohon berdiri.", "Demi untuk kelancaran acara ini…"], answer: 1, explain: "Kalimat efektif hemat kata: “para” + jamak (siswa-siswa) adalah pemborosan." },
      { q: "Teks yang bertujuan meyakinkan pembaca agar mengikuti ajakan penulis disebut teks …", options: ["Narasi", "Deskripsi", "Persuasi", "Eksplanasi"], answer: 2, explain: "Teks persuasi bersifat mengajak/meyakinkan pembaca." },
      { q: "Makna kata “signifikan” adalah …", options: ["Penting / berarti", "Cepat", "Mahal", "Sulit"], answer: 0, explain: "Signifikan = penting, berarti, berpengaruh nyata." },
      { q: "Penulisan kata serapan yang baku adalah …", options: ["Apotik", "Analisa", "Praktik", "Jaman"], answer: 2, explain: "Baku: apotek, analisis, praktik, zaman." },
    ],
    ips: [
      { q: "Peristiwa Rengasdengklok terjadi pada tanggal …", options: ["15 Agustus 1945", "16 Agustus 1945", "17 Agustus 1945", "14 Agustus 1945"], answer: 1, explain: "16 Agustus 1945: golongan muda membawa Soekarno-Hatta ke Rengasdengklok." },
      { q: "Kerajaan Hindu tertua di Indonesia adalah …", options: ["Majapahit", "Sriwijaya", "Kutai", "Tarumanegara"], answer: 2, explain: "Kutai (abad ke-4 M) dibuktikan dengan Prasasti Yupa di Kalimantan Timur." },
      { q: "Inflasi adalah …", options: ["Penurunan harga terus-menerus", "Kenaikan harga barang secara umum dan terus-menerus", "Kenaikan nilai mata uang", "Bertambahnya jumlah uang logam"], answer: 1, explain: "Inflasi = kenaikan harga umum secara terus-menerus, nilai uang menurun." },
      { q: "Letak astronomis Indonesia adalah …", options: ["6°LU–11°LS dan 95°BT–141°BT", "0°–10°LS dan 90°–140°BT", "6°LU–11°LU dan 95°–141°BT", "11°LU–6°LS dan 95°–141°BT"], answer: 0, explain: "Indonesia: 6°LU–11°LS, 95°BT–141°BT → iklim tropis." },
    ],
    ppkn: [
      { q: "Lembaga negara yang berwenang mengubah dan menetapkan UUD adalah …", options: ["DPR", "MPR", "Presiden", "MK"], answer: 1, explain: "MPR berwenang mengubah & menetapkan UUD (Pasal 3 UUD 1945)." },
      { q: "Hak asasi manusia diatur dalam UUD 1945 Pasal …", options: ["27", "28A–28J", "29", "31"], answer: 1, explain: "Bab XA Pasal 28A–28J mengatur HAM." },
      { q: "Pemilu pertama di Indonesia dilaksanakan pada tahun …", options: ["1945", "1950", "1955", "1971"], answer: 2, explain: "Pemilu pertama: 1955 (memilih DPR & Konstituante)." },
    ],
    informatika: [
      { q: "Dalam pemrograman, struktur “jika … maka …” disebut struktur …", options: ["Perulangan", "Percabangan / seleksi", "Fungsi", "Array"], answer: 1, explain: "If-then adalah struktur seleksi/percabangan (selection)." },
      { q: "Hasil konversi bilangan biner 1010 ke desimal adalah …", options: ["8", "9", "10", "12"], answer: 2, explain: "1010₂ = 8+0+2+0 = 10." },
      { q: "Algoritma yang mengurutkan data dengan membandingkan pasangan elemen bersebelahan berulang kali adalah …", options: ["Binary search", "Bubble sort", "Merge sort", "Hashing"], answer: 1, explain: "Bubble sort menukar pasangan bersebelahan hingga terurut." },
      { q: "Protokol yang digunakan untuk transfer halaman web yang aman adalah …", options: ["FTP", "SMTP", "HTTPS", "POP3"], answer: 2, explain: "HTTPS = HTTP + enkripsi TLS untuk web yang aman." },
    ],
    jawa: [
      { q: "Tembang macapat sing cacahing gatra ana 10 lan asring kanggo menehi pitutur yaiku …", options: ["Maskumambang", "Dandanggula", "Pocung", "Megatruh"], answer: 1, explain: "Dandanggula nduweni 10 gatra saben sapada lan asring kanggo pitutur. Maskumambang 4 gatra, Pocung 4 gatra, Megatruh 5 gatra." },
      { q: "“Kula badhe tindak dhateng pasar.” Ukara kasebut migunakake basa …", options: ["Ngoko lugu", "Ngoko alus", "Krama alus", "Basa kasar"], answer: 2, explain: "Kula, badhe, tindak, dhateng = krama alus." },
      { q: "Paribasan “Jer basuki mawa bea” tegese …", options: ["Kabeh gegayuhan mbutuhake wragad/pengorbanan", "Wong sugih mesthi seneng", "Bea iku larang", "Kudu ngirit tansah"], answer: 0, explain: "Setiap cita-cita memerlukan biaya/pengorbanan." },
      { q: "Aksara Jawa pasangan saka “ꦠ” yaiku …", options: ["꧀ꦠ", "ꦠ꧀", "꧀ꦢ", "ꦢ꧀"], answer: 0, explain: "Pasangan ditulis di bawah aksara sebelumnya dengan pangkon: ꧀ꦠ." },
    ],
    arab: [
      { q: "Kata “اِذْهَبْ إِلَى الْمَدْرَسَةِ” — kata “اِذْهَبْ” adalah fi'il …", options: ["Madhi", "Mudhari'", "Amr (perintah)", "Nahi"], answer: 2, explain: "اِذْهَبْ = pergilah! → fi'il amr (kata kerja perintah)." },
      { q: "Jumlah huruf pada kata “مُعَلِّمٌ” adalah …", options: ["4", "5", "6", "3"], answer: 0, explain: "مُعَلِّمٌ tersusun dari م – ع – ل – م = 4 huruf. Syaddah (ّ) pada ل adalah tanda baca, bukan huruf baru." },
      { q: "Dhamir (kata ganti) untuk “dia perempuan” adalah …", options: ["هُوَ", "هِيَ", "أَنْتَ", "نَحْنُ"], answer: 1, explain: "هُوَ = dia laki-laki; هِيَ = dia perempuan." },
      { q: "Lawan kata dari “كَبِيرٌ” (besar) adalah …", options: ["طَوِيلٌ", "صَغِيرٌ", "جَدِيدٌ", "قَرِيبٌ"], answer: 1, explain: "كَبِيرٌ (besar) >< صَغِيرٌ (kecil)." },
    ],
    pai: [
      { q: "Sumber hukum Islam yang kedua setelah Al-Qur'an adalah …", options: ["Ijma'", "Hadis / Sunnah", "Qiyas", "Ijtihad"], answer: 1, explain: "Urutan: Al-Qur'an, Hadis, Ijma', Qiyas." },
      { q: "Peristiwa Isra Mikraj terjadi untuk menerima perintah …", options: ["Puasa", "Salat lima waktu", "Zakat", "Haji"], answer: 1, explain: "Pada Isra Mikraj Nabi menerima perintah salat lima waktu." },
      { q: "Zakat mal wajib dikeluarkan bila harta mencapai …", options: ["Nisab dan haul", "Setengah nisab", "Sepuluh dinar", "Cukup untuk makan"], answer: 0, explain: "Syarat zakat mal: mencapai nisab & berlalu satu haul (tahun)." },
      { q: "Sikap toleransi antarumat beragama disebut …", options: ["Fanatik", "Tasamuh", "Takabur", "Hasad"], answer: 1, explain: "Tasamuh = toleransi, menghargai perbedaan." },
    ],
    akidah: [
      { q: "Sifat mustahil bagi Allah yang berlawanan dengan “Qidam” adalah …", options: ["Hudus (baru)", "'Adam (tidak ada)", "Fana (rusak)", "Mumatsalah (menyerupai)"], answer: 0, explain: "Qidam = terdahulu tanpa permulaan; mustahilnya hudus = baru/berpermulaan." },
      { q: "Percaya kepada kitab-kitab Allah termasuk rukun iman ke-…", options: ["2", "3", "4", "5"], answer: 1, explain: "Rukun iman ke-3: iman kepada kitab-kitab Allah." },
      { q: "Penyakit hati berupa merasa diri paling benar dan meremehkan orang lain disebut …", options: ["Riya'", "Takabur / sombong", "Hasad", "Bakhil"], answer: 1, explain: "Takabur = sombong, akhlak tercela yang harus dijauhi." },
    ],
    fikih: [
      { q: "Salat yang hukumnya fardu kifayah adalah salat …", options: ["Zuhur", "Jenazah", "Rawatib", "Duha"], answer: 1, explain: "Salat jenazah fardu kifayah: gugur kewajiban bila sebagian muslim melakukannya." },
      { q: "Kadar zakat emas yang wajib dikeluarkan adalah …", options: ["2,5%", "5%", "10%", "20%"], answer: 0, explain: "Zakat emas/perak/perniagaan = 2,5% bila mencapai nisab & haul." },
      { q: "Puasa yang hukumnya haram dilakukan adalah puasa pada …", options: ["Senin-Kamis", "Hari raya Idulfitri", "Ayyamul bidh", "Asyura"], answer: 1, explain: "Diharamkan berpuasa pada hari raya Idulfitri & Iduladha serta hari tasyrik." },
    ],
    quranhadis: [
      { q: "Surah terpanjang dalam Al-Qur'an adalah …", options: ["Ali Imran", "Al-Baqarah", "An-Nisa", "Al-Maidah"], answer: 1, explain: "Al-Baqarah: 286 ayat, surah terpanjang." },
      { q: "Ilmu yang mempelajari sanad dan matan hadis disebut ilmu …", options: ["Tafsir", "Mustalah hadis", "Nahwu", "Fiqih"], answer: 1, explain: "Mustalah hadis mengkaji perawi (sanad) dan isi (matan) hadis." },
      { q: "Hadis yang diriwayatkan oleh banyak perawi pada setiap tingkatan disebut hadis …", options: ["Ahad", "Mutawatir", "Mursal", "Mu'dal"], answer: 1, explain: "Mutawatir: diriwayatkan perawi sangat banyak, mustahil bersepakat dusta." },
    ],
    ski: [
      { q: "Khalifah pertama setelah wafatnya Nabi Muhammad SAW adalah …", options: ["Umar bin Khattab", "Abu Bakar As-Siddiq", "Usman bin Affan", "Ali bin Abi Thalib"], answer: 1, explain: "Abu Bakar menjadi khalifah pertama (632–634 M)." },
      { q: "Perjanjian Hudaibiyah terjadi pada tahun … Hijriah", options: ["5 H", "6 H", "7 H", "8 H"], answer: 1, explain: "Perjanjian Hudaibiyah: 6 H antara muslim Madinah dan Quraisy Makkah." },
      { q: "Dinasti Abbasiyah berpusat di kota …", options: ["Damaskus", "Bagdad", "Kairo", "Cordoba"], answer: 1, explain: "Abbasiyah beribu kota di Bagdad; Umayyah di Damaskus." },
    ],
    kristen: [
      { q: "Hukum yang terutama menurut Yesus adalah …", options: ["Mengasihi Allah dan sesama", "Rajin bekerja", "Menjaga hari Sabat saja", "Memberi persembahan besar"], answer: 0, explain: "Matius 22:37–39 — kasih kepada Allah & sesama adalah hukum terutama." },
      { q: "Raja Israel yang membangun Bait Allah di Yerusalem adalah …", options: ["Daud", "Salomo", "Saul", "Hizkia"], answer: 1, explain: "Salomo, anak Daud, membangun Bait Allah (1 Raja-raja 6)." },
      { q: "Hari turunnya Roh Kudus disebut …", options: ["Natal", "Paskah", "Pentakosta", "Epifani"], answer: 2, explain: "Pentakosta (Kisah 2): Roh Kudus turun atas para rasul." },
      { q: "Tokoh yang saleh dan tetap setia meski kehilangan segalanya dalam Perjanjian Lama adalah …", options: ["Ayub", "Yunus", "Lot", "Esau"], answer: 0, explain: "Ayub tetap setia kepada Allah dalam penderitaan." },
    ],
    "cambridge-eng": [
      { q: "Choose the correct sentence in the present perfect:", options: ["I have saw that film.", "I have seen that film.", "I has seen that film.", "I have see that film."], answer: 1, explain: "Present perfect: have + past participle (seen)." },
      { q: "“Despite the rain, the match continued.” The word “despite” shows …", options: ["Cause", "Contrast / concession", "Time", "Purpose"], answer: 1, explain: "Despite = walaupun → concession/contrast." },
      { q: "Which is the correct comparative form?", options: ["More better", "Best than", "Better than", "More good than"], answer: 2, explain: "Good → better (irregular comparative) + than." },
    ],
    "cambridge-sci": [
      { q: "Which gas do plants absorb for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2, explain: "Plants absorb CO₂ and release oxygen." },
      { q: "The unit of force is the …", options: ["Joule", "Newton", "Pascal", "Watt"], answer: 1, explain: "Force is measured in newtons (N)." },
      { q: "Which of these is a chemical change?", options: ["Melting ice", "Cutting paper", "Burning wood", "Dissolving sugar"], answer: 2, explain: "Burning creates new substances (ash, gases) → chemical change." },
    ],
    "cambridge-math": [
      { q: "Simplify: 3/4 + 2/3 =", options: ["5/7", "17/12", "6/12", "5/12"], answer: 1, explain: "Common denominator 12: 9/12 + 8/12 = 17/12." },
      { q: "If x + 5 = 12, then 2x = …", options: ["14", "7", "17", "24"], answer: 0, explain: "x = 7, so 2x = 14." },
      { q: "What is 15% of 200?", options: ["15", "20", "30", "35"], answer: 2, explain: "0.15 × 200 = 30." },
    ],
  },
  SMA: {
    matematika: [
      { q: "Jika f(x) = 2x² − 3x + 1, maka f'(x) adalah …", options: ["4x − 3", "2x − 3", "4x + 1", "x² − 3"], answer: 0, explain: "Turunan: d/dx(2x²)=4x, d/dx(−3x)=−3, konstanta→0. f'(x)=4x−3." },
      { q: "Nilai dari lim (x→2) (x² − 4)/(x − 2) adalah …", options: ["0", "2", "4", "Tidak ada"], answer: 2, explain: "(x²−4)=(x−2)(x+2). Sederhanakan → x+2 → x=2 menghasilkan 4." },
      { q: "Suku ke-10 barisan aritmetika 4, 7, 10, 13, … adalah …", options: ["28", "31", "34", "30"], answer: 1, explain: "Un = a+(n−1)b = 4+9×3 = 31." },
      { q: "Jika ²log 8 + ³log 27 = …", options: ["5", "6", "7", "9"], answer: 1, explain: "²log8=3, ³log27=3, jumlah=6." },
      { q: "Persamaan lingkaran berpusat (0,0) melalui titik (3,4) memiliki jari-jari …", options: ["5", "7", "25", "12"], answer: 0, explain: "r = √(3²+4²) = √25 = 5." },
      { q: "Dari 7 siswa dipilih 3 orang pengurus. Banyak cara memilih adalah …", options: ["21", "35", "210", "343"], answer: 1, explain: "Kombinasi C(7,3) = 7!/(3!4!) = 35." },
      { q: "Diketahui f(x) = 2x + 3 dan g(x) = x² − 1. Nilai (f ∘ g)(2) adalah …", options: ["7", "9", "11", "15"], answer: 1, explain: "Langkah 1: kerjakan fungsi yang di dalam dulu: g(2) = 2² − 1 = 3. Langkah 2: masukkan hasilnya ke f: f(3) = 2×3 + 3 = 9." },
      { q: "Sebuah dadu dan sebuah koin dilempar bersamaan. Peluang muncul mata dadu genap dan sisi angka pada koin adalah …", options: ["1/2", "1/4", "1/6", "1/12"], answer: 1, explain: "Langkah 1: peluang mata dadu genap = 3/6 = 1/2, peluang sisi angka pada koin = 1/2. Langkah 2: kedua kejadian saling bebas, jadi peluangnya dikalikan: 1/2 × 1/2 = 1/4." },
      { q: "Nilai rata-rata 5 siswa adalah 78. Setelah ditambah satu siswa baru, rata-ratanya menjadi 80. Nilai siswa baru adalah …", options: ["82", "88", "90", "92"], answer: 2, explain: "Langkah 1: jumlah nilai awal = 5 × 78 = 390. Langkah 2: jumlah nilai akhir = 6 × 80 = 480. Langkah 3: nilai siswa baru = 480 − 390 = 90." },
    ],
    inggris: [
      { q: "“Had I known about the traffic, I ___ earlier.”", options: ["will leave", "would leave", "would have left", "leave"], answer: 2, explain: "Third conditional (inversi Had I…): would have + V3." },
      { q: "Read: “Renewable energy is no longer a luxury but a necessity…” The writer’s tone is best described as …", options: ["Humorous", "Persuasive / urgent", "Indifferent", "Sarcastic"], answer: 1, explain: "“No longer a luxury but a necessity” menegaskan urgensi — nada persuasif." },
      { q: "Choose the sentence with the correct subjunctive:", options: ["I suggest that he goes now.", "I suggest that he go now.", "I suggest that he going now.", "I suggest that he went now yesterday."], answer: 1, explain: "Setelah suggest that…, kata kerja bentuk dasar (base form): go." },
      { q: "The phrase “break the ice” in a meeting means …", options: ["To end the meeting", "To start a conversation and ease awkwardness", "To cool the room", "To postpone discussion"], answer: 1, explain: "Idiom: mencairkan suasana / memulai percakapan agar tidak canggung." },
    ],
    biologi: [
      { q: "Pada respirasi aerob, tahap yang menghasilkan ATP paling banyak adalah …", options: ["Glikolisis", "Siklus Krebs", "Rantai transpor elektron", "Fermentasi"], answer: 2, explain: "Transpor elektron menghasilkan ±34 ATP, jauh lebih banyak dari glikolisis (2) & Krebs (2)." },
      { q: "Persilangan monohibrid Aa × Aa menghasilkan fenotipe dominan : resesif = …", options: ["1 : 1", "3 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1"], answer: 1, explain: "Genotipe 1AA:2Aa:1aa → fenotipe 3 dominan : 1 resesif." },
      { q: "Enzim yang berfungsi menyambung fragmen Okazaki pada replikasi DNA adalah …", options: ["Helikase", "Primase", "DNA ligase", "Topoisomerase"], answer: 2, explain: "DNA ligase menyambung fragmen Okazaki pada untai lagging." },
      { q: "Organ pernapasan pada serangga adalah …", options: ["Paru-paru", "Insang", "Trakea", "Kulit"], answer: 2, explain: "Serangga bernapas melalui sistem trakea & spirakel." },
      { q: "Pada persilangan monohibrid Aa × Aa, perbandingan fenotipe keturunannya adalah …", options: ["1 : 1", "3 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1"], answer: 1, explain: "Keturunannya bergenotipe AA (1), Aa (2), aa (1). Sifat dominan tampak pada AA dan Aa, yaitu 3 bagian; sifat resesif hanya tampak pada aa, 1 bagian. Jadi fenotipenya 3 : 1 — sedangkan 1 : 2 : 1 adalah perbandingan genotipenya." },
    ],
    fisika: [
      { q: "Sebuah mobil bergerak dengan kecepatan awal 10 m/s dan percepatan 2 m/s² selama 5 s. Kecepatan akhirnya … m/s", options: ["15", "20", "25", "12"], answer: 1, explain: "v = v₀ + at = 10 + 2×5 = 20 m/s." },
      { q: "Energi kinetik benda 2 kg yang bergerak 10 m/s adalah … J", options: ["20", "50", "100", "200"], answer: 2, explain: "Ek = ½mv² = ½×2×100 = 100 J." },
      { q: "Periode getaran pegas dinyatakan T = 2π√(m/k). Jika massa dijadikan 4 kali, periode menjadi …", options: ["Tetap", "2 kali semula", "4 kali semula", "Setengah kali"], answer: 1, explain: "T sebanding √m → m×4 → T×2." },
      { q: "Hambatan 6 Ω dan 3 Ω diparalel, hambatan penggantinya … Ω", options: ["9", "2", "4,5", "18"], answer: 1, explain: "1/R = 1/6+1/3 = 1/2 → R = 2 Ω." },
      { q: "Sebuah benda dijatuhkan dari ketinggian 20 m (g = 10 m/s²). Kecepatan benda sesaat sebelum menyentuh tanah adalah … m/s", options: ["10", "20", "30", "40"], answer: 1, explain: "Langkah 1: untuk gerak jatuh bebas gunakan v² = 2gh. Langkah 2: v = √(2 × 10 × 20) = √400 = 20 m/s." },
      { q: "Sebuah lampu 60 W menyala 5 jam setiap hari. Energi listrik yang dipakai lampu itu dalam 30 hari adalah … kWh", options: ["9", "18", "36", "90"], answer: 0, explain: "Langkah 1: energi per hari = 60 W × 5 jam = 300 Wh = 0,3 kWh. Langkah 2: selama 30 hari = 0,3 × 30 = 9 kWh." },
    ],
    kimia: [
      { q: "Konfigurasi elektron unsur dengan nomor atom 26 (Fe) adalah …", options: ["[Ar] 4s² 3d⁶", "[Ar] 4s¹ 3d⁷", "[Ar] 3d⁸", "[Ne] 4s² 3d⁶"], answer: 0, explain: "Fe (Z=26): 1s²2s²2p⁶3s²3p⁶4s²3d⁶ = [Ar] 4s² 3d⁶." },
      { q: "pH larutan HCl 0,01 M adalah …", options: ["1", "2", "3", "12"], answer: 1, explain: "HCl asam kuat: [H⁺]=10⁻² → pH = 2." },
      { q: "Bilangan oksidasi S dalam H₂SO₄ adalah …", options: ["+2", "+4", "+6", "−2"], answer: 2, explain: "2(+1) + S + 4(−2) = 0 → S = +6." },
      { q: "Larutan penyangga (buffer) terdiri dari …", options: ["Asam kuat + basa kuat", "Asam lemah + basa konjugasinya", "Garam + air saja", "Asam kuat + garamnya"], answer: 1, explain: "Buffer: asam lemah + basa konjugasi (atau basa lemah + asam konjugasi)." },
      { q: "Sebanyak 0,2 mol NaOH dilarutkan dalam air hingga volumenya 500 mL. Molaritas larutan tersebut adalah … M", options: ["0,1", "0,2", "0,4", "1,0"], answer: 2, explain: "Langkah 1: ubah volume ke liter: 500 mL = 0,5 L. Langkah 2: M = mol : volume = 0,2 : 0,5 = 0,4 M." },
    ],
    indonesia: [
      { q: "Kalimat yang mengandung majas personifikasi adalah …", options: ["Wajahnya bersinar seperti bulan.", "Angin malam berbisik menyampaikan rindu.", "Ia berlari secepat kilat.", "Rumahnya besar bak istana."], answer: 1, explain: "Personifikasi: benda mati (angin) seolah berperilaku seperti manusia (berbisik)." },
      { q: "Struktur teks eksposisi yang berisi penegasan kembali pendapat penulis disebut …", options: ["Tesis", "Argumentasi", "Penegasan ulang", "Orientasi"], answer: 2, explain: "Eksposisi: tesis → argumentasi → penegasan ulang (reiterasi)." },
      { q: "Kata berimbuhan yang bermakna kausatif (menyebabkan) adalah …", options: ["Memperbesar", "Terbesar", "Pembesaran", "Besar-besaran"], answer: 0, explain: "Memper- pada “memperbesar” bermakna menyebabkan jadi besar." },
    ],
    ips: [
      { q: "Teori ekonomi yang menekankan peran pemerintah seminimal mungkin (laissez-faire) dikemukakan oleh …", options: ["Karl Marx", "Adam Smith", "John Maynard Keynes", "David Ricardo"], answer: 1, explain: "Adam Smith, “The Wealth of Nations” (1776), bapak ekonomi klasik." },
      { q: "Perang Dunia II di kawasan Pasifik berakhir setelah pengeboman Hiroshima & Nagasaki pada tahun …", options: ["1943", "1944", "1945", "1946"], answer: 2, explain: "Agustus 1945; Jepang menyerah, WWII berakhir." },
      { q: "Fungsi devisa bagi suatu negara antara lain untuk …", options: ["Membayar impor dan utang luar negeri", "Mencetak uang baru", "Menurunkan inflasi secara langsung", "Membayar gaji ASN"], answer: 0, explain: "Devisa dipakai untuk transaksi luar negeri: impor, utang, jasa." },
      { q: "Konsep “Dwifungsi ABRI” dan stabilitas politik yang kuat adalah ciri masa …", options: ["Demokrasi Liberal", "Demokrasi Terpimpin", "Orde Baru", "Reformasi"], answer: 2, explain: "Orde Baru (1966–1998) menonjolkan stabilitas & dwifungsi ABRI." },
    ],
    ppkn: [
      { q: "Menurut teori trias politica Montesquieu, kekuasaan yudikatif di Indonesia dijalankan oleh …", options: ["Presiden & DPR", "MA dan MK", "MPR", "KPK"], answer: 1, explain: "Yudikatif: Mahkamah Agung & Mahkamah Konstitusi (serta KY mengusulkan hakim agung)." },
      { q: "Amandemen UUD 1945 pertama kali dilakukan pada tahun …", options: ["1998", "1999", "2000", "2002"], answer: 1, explain: "Amandemen I: Sidang Umum MPR 1999; total 4 kali (1999–2002)." },
      { q: "Asas pemilu di Indonesia adalah …", options: ["Luber dan jurdil", "Cepat dan murah", "Terbuka dan rahasia penuh", "Langsung oleh MPR"], answer: 0, explain: "Luber: langsung, umum, bebas, rahasia; Jurdil: jujur & adil." },
    ],
    informatika: [
      { q: "Kompleksitas waktu algoritma binary search adalah …", options: ["O(n)", "O(n log n)", "O(log n)", "O(n²)"], answer: 2, explain: "Binary search membagi data menjadi dua setiap langkah → O(log n)." },
      { q: "Dalam basis data relasional, atribut yang unik mengidentifikasi setiap baris disebut …", options: ["Foreign key", "Primary key", "Candidate key saja", "Index biasa"], answer: 1, explain: "Primary key: unik & tidak boleh NULL, identitas baris." },
      { q: "Model OSI layer yang bertanggung jawab untuk pengalamatan IP dan routing adalah …", options: ["Data link", "Network", "Transport", "Session"], answer: 1, explain: "Layer 3 (Network): IP & routing; Transport: TCP/UDP." },
      { q: "Serangan yang membanjiri server dengan lalu lintas palsu hingga lumpuh disebut …", options: ["Phishing", "DDoS", "Sniffing", "Spoofing email"], answer: 1, explain: "DDoS = Distributed Denial of Service." },
    ],
    jawa: [
      { q: "Sastrawan Jawa pangripta novel “Kadurakan ing Kidul Dringu” yaiku …", options: ["Suparto Brata", "Ahmad Tohari", "Pramoedya Ananta Toer", "W.S. Rendra"], answer: 0, explain: "Suparto Brata adalah sastrawan Jawa produktif, pangripta “Kadurakan ing Kidul Dringu” dan banyak novel Jawa lainnya." },
      { q: "Basa krama alus/inggil paling trep dipigunakake nalika matur marang …", options: ["Kanca akrab sing sak umur", "Wong sing diajeni, kayata guru lan wong tuwa", "Adhi kandung ing omah", "Dhewekan ing kamar"], answer: 1, explain: "Krama alus/inggil kanggo ngajeni lawan tutur sing luwih tuwa utawa diajeni, kayata guru lan wong tuwa." },
      { q: "Tegese paribasan “Kacang ora lali marang lanjaran” yaiku …", options: ["Wong ora lali marang asale / wong tuwane", "Kacang iku dawa", "Anak kudu manut", "Tetulung marang tangga"], answer: 0, explain: "Anak/orang tidak melupakan asal-usul dan orang tuanya." },
    ],
    arab: [
      { q: "Kata “كَتَبَ الطَّالِبُ الدَّرْسَ” — kata “الدَّرْسَ” berkedudukan sebagai …", options: ["Fa'il", "Maf'ul bih", "Mubtada'", "Khabar"], answer: 1, explain: "الدَّرْسَ adalah objek (maf'ul bih) dari كَتَبَ; fa'il-nya الطَّالِبُ." },
      { q: "Jamak taksir dari “كِتَابٌ” adalah …", options: ["كِتَابَانِ", "كُتُبٌ", "كَاتِبُونَ", "مَكْتَبَاتٌ"], answer: 1, explain: "كِتَابٌ → كُتُبٌ (jamak taksir)." },
      { q: "Huruf jar pada kalimat “ذَهَبْتُ إِلَى الْمَسْجِدِ” adalah …", options: ["ذَهَبْتُ", "إِلَى", "الْمَسْجِدِ", "Tidak ada"], answer: 1, explain: "إِلَى adalah huruf jar; الْمَسْجِدِ majrur dengan kasrah." },
    ],
    pai: [
      { q: "Dalam ilmu waris (faraid), bagian istri bila pewaris mempunyai anak adalah …", options: ["1/4", "1/8", "1/2", "1/3"], answer: 1, explain: "QS An-Nisa 12: istri mendapat 1/8 bila ada anak; 1/4 bila tidak ada anak." },
      { q: "Muamalah jual beli yang mengandung ketidakjelasan (gharar) hukumnya …", options: ["Wajib", "Sunnah", "Dilarang / tidak sah", "Makruh saja"], answer: 2, explain: "Rasulullah melarang jual beli gharar (HR. Muslim) karena merugikan salah satu pihak." },
      { q: "Konsep keadilan Allah & kebebasan manusia yang seimbang adalah paham …", options: ["Jabariyah murni", "Qadariyah murni", "Asy'ariyah (kasb)", "Mu'tazilah ekstrem"], answer: 2, explain: "Asy'ariyah: manusia berikhtiar (kasb), Allah yang menciptakan perbuatan." },
    ],
    akidah: [
      { q: "Aliran teologi yang mengedepankan akal dan berpendapat manusia bebas berkehendak adalah …", options: ["Asy'ariyah", "Mu'tazilah", "Jabariyah", "Maturidiyah"], answer: 1, explain: "Mu'tazilah: rasional, free will, termasuk lima prinsip (usul al-khamsah)." },
      { q: "Sifat jaiz bagi Rasul adalah …", options: ["Siddiq", "A'radh basyariyah (sifat kemanusiaan biasa)", "Kitman", "Khianat"], answer: 1, explain: "Jaiz rasul: bersifat manusiawi biasa seperti makan, minum, sakit — tanpa mengurangi kemuliaan." },
      { q: "Tauhid rububiyah adalah mengesakan Allah dalam …", options: ["Ibadah", "Perbuatan-Nya: mencipta, memberi rezeki, mengatur alam", "Nama & sifat saja", "Hukum syariat"], answer: 1, explain: "Rububiyah: Allah satu-satunya Pencipta, Pengatur, Pemberi rezeki." },
    ],
    fikih: [
      { q: "Akad pemberian kuasa kepada orang lain untuk melakukan suatu pekerjaan disebut …", options: ["Ijarah", "Wakalah", "Kafalah", "Hawalah"], answer: 1, explain: "Wakalah = perwakilan; ijarah = sewa jasa; kafalah = penanggungan." },
      { q: "Syarat sah jual beli antara lain penjual & pembeli harus …", options: ["Kaya raya", "Berakal & balig (cakap hukum)", "Seagama", "Bertempat tinggal sama"], answer: 1, explain: "Para pihak harus cakap hukum: balig, berakal, atas kehendak sendiri." },
      { q: "Utang piutang yang mensyaratkan tambahan pembayaran termasuk …", options: ["Qard hasan", "Riba yang diharamkan", "Sedekah", "Zakat"], answer: 1, explain: "Tambahan yang disyaratkan atas utang adalah riba nasi'ah — haram." },
    ],
    quranhadis: [
      { q: "Surah Al-Kahfi dianjurkan dibaca pada hari …", options: ["Senin", "Rabu", "Jumat", "Ahad saja"], answer: 2, explain: "Membaca Al-Kahfi pada hari Jumat adalah sunnah yang dianjurkan (HR. Ad-Darimi dll.)." },
      { q: "Metode penafsiran Al-Qur'an dengan Al-Qur'an & hadis disebut tafsir …", options: ["Bil ra'yi", "Bil ma'tsur", "Isyari", "Ilmi"], answer: 1, explain: "Tafsir bil ma'tsur: bersumber riwayat (Qur'an, hadis, perkataan sahabat)." },
      { q: "Hadis yang sanadnya bersambung hingga Rasulullah disebut hadis …", options: ["Mauquf", "Marfu'", "Maqthu'", "Mursal sahabi"], answer: 1, explain: "Marfu': disandarkan kepada Nabi SAW; mauquf: berhenti pada sahabat." },
    ],
    ski: [
      { q: "Pusat pembelajaran & penerjemahan ilmu pada masa Abbasiyah yang terkenal adalah …", options: ["Baitul Hikmah di Bagdad", "Universitas Al-Azhar awal", "Observatorium Maragha saja", "Madrasah Nizamiyah saja"], answer: 0, explain: "Baitul Hikmah (Bagdad, era Al-Ma'mun) menjadi pusat penerjemahan & riset." },
      { q: "Ibnu Sina terkenal dengan karya kedokterannya yang berjudul …", options: ["Al-Qanun fi ath-Thibb", "Ihya Ulumuddin", "Al-Muqaddimah", "Rihlah"], answer: 0, explain: "Al-Qanun fi ath-Thibb (Canon of Medicine) jadi rujukan Eropa berabad-abad. Muqaddimah = Ibnu Khaldun; Ihya = Al-Ghazali." },
      { q: "Kejayaan Islam di Andalusia berpusat di kota …", options: ["Sevilla saja", "Cordoba", "Granada saja", "Toledo"], answer: 1, explain: "Cordoba menjadi ibu kota & pusat ilmu Andalusia pada masa Umayyah II." },
    ],
    kristen: [
      { q: "Surat Paulus yang membahas pembenaran oleh iman secara mendalam adalah Surat …", options: ["Roma", "Korintus saja", "Filemon", "Yakobus"], answer: 0, explain: "Surat Roma adalah uraian teologis Paulus tentang Injil & pembenaran oleh iman." },
      { q: "Reformasi Gereja dimulai Martin Luther pada tahun …", options: ["1417", "1517", "1617", "1717"], answer: 1, explain: "31 Oktober 1517: Luther memakukan 95 tesis di Wittenberg." },
      { q: "“Sola fide, sola gratia, sola scriptura” adalah semboyan dari gerakan …", options: ["Konsili Trente", "Reformasi Protestan", "Ortodoks Timur", "Pentakosta modern"], answer: 1, explain: "Tiga sola adalah prinsip utama Reformasi Protestan." },
    ],
    "cambridge-eng": [
      { q: "Choose the correctly punctuated sentence:", options: ["Its a shame that the teams losing.", "It's a shame that the team's losing.", "Its a shame that the team's losing.", "It's a shame that the teams' losing."], answer: 1, explain: "It's = it is; team's = possessive singular." },
      { q: "“The committee ___ reached its decision.” (formal British English)", options: ["have", "has", "are", "were"], answer: 1, explain: "Collective noun treated as singular unit → has." },
      { q: "Which sentence uses the passive correctly?", options: ["The bridge was built in 1990.", "The bridge was build in 1990.", "The bridge is build in 1990.", "The bridge built was in 1990."], answer: 0, explain: "Passive past: was + past participle (built)." },
    ],
    "cambridge-sci": [
      { q: "A 2 kg mass accelerates at 3 m/s². The resultant force is …", options: ["1.5 N", "5 N", "6 N", "0.67 N"], answer: 2, explain: "F = ma = 2 × 3 = 6 N." },
      { q: "Which element has the chemical symbol Fe?", options: ["Lead", "Iron", "Fluorine", "Zinc"], answer: 1, explain: "Fe (from Latin ferrum) = iron." },
      { q: "In genetics, a genotype of Bb is described as …", options: ["Homozygous dominant", "Heterozygous", "Homozygous recessive", "Hemizygous"], answer: 1, explain: "Two different alleles (B and b) = heterozygous." },
    ],
    "cambridge-math": [
      { q: "Solve: 3(x − 2) = 15 → x = …", options: ["5", "7", "9", "3"], answer: 1, explain: "x − 2 = 5 → x = 7." },
      { q: "The gradient of the line y = 4x − 7 is …", options: ["−7", "4", "−4", "7"], answer: 1, explain: "In y = mx + c, m = 4." },
      { q: "A circle has radius 7 cm. Using π ≈ 22/7, its circumference is …", options: ["22 cm", "44 cm", "154 cm", "49 cm"], answer: 1, explain: "C = 2πr = 2 × 22/7 × 7 = 44 cm." },
    ],
  },
};

/* ===== Paket Kompetisi — soal inti tertulis ORIGINAL (gaya lomba, bukan salinan soal resmi) =====
   Generator proseduralnya ada di generators.ts (nalariaGens / kanguruMathGens / kanguruBahasaGens). */
if (BANK.TK) {
  BANK.TK["nalaria"] = [
    { q: "Dengar ceritanya: Sinta punya 🍓🍓🍓 stroberi, lalu Ibu memberi 🍓🍓 lagi. Stroberi Sinta sekarang ada …", emoji: "🍓", options: ["4", "5", "6"], answer: 1, explain: "3 + 2 = 5 stroberi. Soal nalaria selalu bercerita — hitung bendanya satu-satu." },
    { q: "Ada 🐥🐥🐥🐥 anak ayam. Satu anak ayam masuk kandang. Yang masih di luar ada …", emoji: "🐥", options: ["2", "3", "4"], answer: 1, explain: "4 − 1 = 3 anak ayam." },
    { q: "Pola gambar: ⭐ 🌙 ⭐ 🌙 ⭐ … Gambar berikutnya adalah …", emoji: "⭐", options: ["⭐", "🌙", "☀️"], answer: 1, explain: "Polanya bergantian bintang–bulan, jadi sesudah bintang adalah bulan." },
    { q: "Bima punya 6 kelereng, Tita punya 4 kelereng. Siapa yang kelerengnya LEBIH BANYAK?", emoji: "🔮", options: ["Bima", "Tita", "Sama banyak"], answer: 0, explain: "6 lebih banyak dari 4, jadi Bima." },
  ];
  BANK.TK["kanguru-matematika"] = [
    { q: "Hitung kaki-kakinya: 🐶 satu anjing punya berapa kaki?", emoji: "🐶", options: ["2", "4", "6"], answer: 1, explain: "Anjing berkaki 4." },
    { q: "Pola: 🔴 🔵 🔴 🔵 🔴 … Berikutnya warna apa?", emoji: "🔴", options: ["🔴 Merah", "🔵 Biru", "🟢 Hijau"], answer: 1, explain: "Pola bergantian merah–biru, berikutnya biru." },
    { q: "Gambar mana yang BERBEDA sendiri?", emoji: "🍎", options: ["🍎🍎🍎🍌", "🍎🍎🍎🍎", "🍌🍌🍌🍌"], answer: 0, explain: "Pilihan pertama campur: 3 apel + 1 pisang, yang lain seragam." },
    { q: "Di antrean, Dita berdiri paling depan. Di belakang Dita ada Rara, lalu Eko. Siapa yang paling BELAKANG?", emoji: "🚶", options: ["Dita", "Rara", "Eko"], answer: 2, explain: "Urutan antrean: Dita – Rara – Eko. Paling belakang Eko." },
  ];
  BANK.TK["kanguru-bahasa"] = [
    { q: "Yang dipakai di kaki adalah …", emoji: "🧦", options: ["Kaos kaki", "Topi", "Baju"], answer: 0, explain: "Kaos kaki dipakai di kaki. Topi di kepala, baju di badan." },
    { q: "Lawan kata “besar” adalah …", emoji: "🐘", options: ["Kecil", "Tinggi", "Panjang"], answer: 0, explain: "Besar >< kecil." },
    { q: "Huruf pertama kata “BOLA” adalah …", emoji: "⚽", options: ["B", "O", "L"], answer: 0, explain: "B-O-L-A, huruf pertamanya B." },
    { q: "In English, “cat” artinya …", emoji: "🐱", options: ["Kucing", "Anjing", "Burung"], answer: 0, explain: "Cat = kucing dalam Bahasa Inggris." },
  ];
}
if (BANK.SD) {
  BANK.SD["nalaria"] = [
    { q: "Nadia membeli 3 pensil @Rp2.000 dan 1 penghapus Rp3.000. Ia membayar dengan Rp10.000. Kembaliannya adalah …", options: ["Rp1.000", "Rp2.000", "Rp4.000", "Rp9.000"], answer: 0, explain: "Total = 3×2.000 + 3.000 = Rp9.000. Kembalian = 10.000 − 9.000 = Rp1.000." },
    { q: "Sebanyak 27 permen dibagikan rata ke 4 anak. Setiap anak mendapat … permen dan sisanya …", options: ["6, sisa 3", "7, sisa 1", "6, sisa 1", "5, sisa 7"], answer: 0, explain: "27 : 4 = 6 sisa 3, karena 4×6=24 dan 27−24=3." },
    { q: "Pola kursi di kelas: baris 1 ada 2 kursi, baris 2 ada 4, baris 3 ada 6. Baris ke-6 ada … kursi", options: ["10", "12", "14", "18"], answer: 1, explain: "Polanya bilangan genap: baris n ada 2×n kursi. Baris 6 → 12." },
    { q: "Bus berangkat pukul 07.15 dan tiba pukul 09.45. Lama perjalanannya adalah …", options: ["2 jam 15 menit", "2 jam 30 menit", "3 jam 30 menit", "1 jam 30 menit"], answer: 1, explain: "07.15 → 09.15 = 2 jam, lalu +30 menit = 2 jam 30 menit." },
    { q: "Di kotak ada bola merah dan biru. Jumlah semua bola 12. Bola biru ada 5. Bola merah ada …", options: ["5", "6", "7", "17"], answer: 2, explain: "12 − 5 = 7 bola merah. Baca cerita pelan-pelan dan pisahkan yang diketahui dari yang ditanyakan." },
  ];
  BANK.SD["kanguru-matematika"] = [
    { q: "Pola angka: 1, 3, 6, 10, 15, … Angka berikutnya adalah …", options: ["18", "20", "21", "25"], answer: 2, explain: "Selisihnya +2, +3, +4, +5, berikutnya +6 → 15+6=21 (bilangan segitiga)." },
    { q: "Kanguru melompat 3 meter tiap lompatan. Untuk menempuh 27 meter ia butuh … lompatan", options: ["7", "8", "9", "12"], answer: 2, explain: "27 : 3 = 9 lompatan." },
    { q: "Di antrean tiket, Rian urutan ke-4 dari depan dan ke-3 dari belakang. Jumlah anak di antrean adalah …", options: ["5", "6", "7", "8"], answer: 1, explain: "4 + 3 − 1 = 6. Rian dihitung dua kali, kurangi 1." },
    { q: "Selembar kertas dilipat jadi 2 satu kali, lalu digunting 1 lubang di tengah lipatan. Saat dibuka, lubangnya ada …", options: ["1", "2", "3", "4"], answer: 1, explain: "Satu lipatan menggandakan lubang: 1 lubang × 2 lapisan = 2 lubang." },
    { q: "Umur Sinta 9 tahun. Umur kakaknya 5 tahun lebih tua. Jumlah umur mereka adalah … tahun", options: ["14", "19", "23", "28"], answer: 2, explain: "Kakak 9+5=14. Jumlah = 9+14 = 23 tahun." },
  ];
  BANK.SD["kanguru-bahasa"] = [
    { q: "Urutan abjad yang BENAR untuk kata: apel, buku, ceri, duku adalah …", options: ["apel, buku, ceri, duku", "buku, apel, ceri, duku", "apel, ceri, buku, duku", "duku, ceri, buku, apel"], answer: 0, explain: "Huruf awal a < b < c < d, urutannya sudah benar." },
    { q: "Kata “berlari” terdiri dari … suku kata", options: ["2", "3", "4", "1"], answer: 1, explain: "ber-la-ri = 3 suku kata." },
    { q: "Kalimat rumpang: “Ibu pergi ke pasar untuk membeli … .” Yang paling logis adalah …", options: ["sayuran", "sepeda motor baru di toko mainan", "awan", "angka tujuh"], answer: 0, explain: "Di pasar orang membeli sayuran — pilihan lain tidak logis di pasar." },
    { q: "Lawan kata “berani” dalam kalimat “Anak itu berani tampil di panggung” adalah …", options: ["takut", "kuat", "cepat", "pandai"], answer: 0, explain: "Berani >< takut." },
    { q: "Huruf yang hilang: S _ P _ T U (alas kaki). Kata lengkapnya adalah …", options: ["SEPATU", "SAPITU", "SEPETU", "SUPATU"], answer: 0, explain: "S-E-P-A-T-U = SEPATU." },
  ];
}
if (BANK.SMP) {
  BANK.SMP["nalaria"] = [
    { q: "Sebuah toko memberi diskon 20% untuk tas Rp250.000, lalu pembeli memakai voucher potongan Rp10.000. Yang dibayar adalah …", options: ["Rp180.000", "Rp190.000", "Rp200.000", "Rp220.000"], answer: 1, explain: "Diskon dulu: 250.000×80% = 200.000, lalu voucher: 200.000−10.000 = Rp190.000." },
    { q: "Rata-rata nilai 5 siswa adalah 80. Empat siswa nilainya 75, 85, 90, 70. Nilai siswa kelima adalah …", options: ["75", "80", "85", "90"], answer: 1, explain: "Total = 5×80=400. Empat siswa = 320. Siswa kelima = 400−320 = 80." },
    { q: "Dalam kelas, 18 siswa suka sepak bola, 12 suka basket, 5 suka keduanya, dan total siswa 30. Yang tidak suka keduanya adalah …", options: ["0", "5", "10", "25"], answer: 1, explain: "Suka minimal satu = 18+12−5 = 25. Tidak suka keduanya = 30−25 = 5. Hati-hati: 5 yang suka keduanya sudah termasuk di kedua kelompok." },
    { q: "Motor melaju 60 km/jam. Jarak 90 km ditempuh dalam …", options: ["1 jam", "1,5 jam", "2 jam", "0,5 jam"], answer: 1, explain: "Waktu = jarak : kecepatan = 90 : 60 = 1,5 jam." },
  ];
  BANK.SMP["kanguru-matematika"] = [
    { q: "Pola: 2, 6, 12, 20, 30, … Suku berikutnya adalah …", options: ["36", "40", "42", "44"], answer: 2, explain: "Selisih +4, +6, +8, +10, berikutnya +12 → 42. (Pola n(n+1).)" },
    { q: "Lima tahun lalu umur Ayah 4 kali umur anaknya. Sekarang umur anak 12 tahun. Umur Ayah sekarang adalah …", options: ["33", "38", "43", "48"], answer: 0, explain: "Lima tahun lalu anak berumur 12−5 = 7 tahun, Ayah 4×7 = 28 tahun. Sekarang Ayah 28+5 = 33 tahun." },
    { q: "Sebuah roda berputar 90° searah jarum jam dari arah utara. Sekarang ia menghadap ke …", options: ["Timur", "Selatan", "Barat", "Utara"], answer: 0, explain: "Putaran 90° searah jarum jam dari utara → timur." },
    { q: "Kertas dilipat jadi 2 sebanyak dua kali, lalu dibuat 1 lubang. Saat dibuka penuh, lubangnya ada …", options: ["2", "3", "4", "8"], answer: 2, explain: "Dua lipatan = 4 lapisan, 1 lubang × 4 = 4 lubang." },
  ];
  BANK.SMP["kanguru-bahasa"] = [
    { q: "Kata yang TIDAK sekelompok maknanya adalah: gembira, riang, ceria, cemas — yang berbeda adalah …", options: ["gembira", "riang", "ceria", "cemas"], answer: 3, explain: "Gembira, riang, ceria sama-sama senang; cemas berarti khawatir." },
    { q: "Kalimat yang paling logis melengkapi: “Karena hujan turun sangat deras, maka …”", options: ["pertandingan ditunda sampai cuaca membaik", "kami memutuskan berenang lebih lama", "jemuran cepat kering", "sungai menjadi kering"], answer: 0, explain: "Akibat logis hujan deras adalah kegiatan luar ditunda." },
    { q: "Urutan abjad kata-kata berikut yang benar: zebra, apel, mangga, buku adalah …", options: ["apel, buku, mangga, zebra", "buku, apel, mangga, zebra", "apel, mangga, buku, zebra", "zebra, mangga, buku, apel"], answer: 0, explain: "a < b < m < z." },
    { q: "Kata “ada” (a-d-a) mengikuti pola huruf … (huruf yang sama diberi huruf pola yang sama)", options: ["ABA", "ABC", "AAB", "ABB"], answer: 0, explain: "a-d-a: huruf pertama dan ketiga sama-sama “a” → pola ABA." },
  ];
}
if (BANK.SMA) {
  BANK.SMA["nalaria"] = [
    { q: "Campuran: 2 liter sirup berkadar gula 30% dicampur 3 liter air tanpa gula. Kadar gula campuran adalah …", options: ["12%", "15%", "18%", "30%"], answer: 0, explain: "Gula = 2×30% = 0,6 liter dalam 5 liter → 0,6/5 = 12%." },
    { q: "Dua pekerja bersama menyelesaikan pekerjaan dalam 6 hari. Pekerja A sendiri butuh 10 hari. Pekerja B sendiri butuh … hari", options: ["12", "15", "16", "20"], answer: 1, explain: "1/B = 1/6 − 1/10 = 2/30 = 1/15 → B butuh 15 hari." },
    { q: "Himpunan: dari 50 siswa, 28 ikut Pramuka, 25 ikut PMR, 12 ikut keduanya. Yang tidak ikut keduanya adalah …", options: ["3", "9", "15", "41"], answer: 1, explain: "Ikut minimal satu = 28+25−12 = 41. Tidak ikut = 50−41 = 9." },
    { q: "Sebuah mobil berangkat pukul 08.00 dengan kecepatan 80 km/jam. Mobil kedua berangkat pukul 08.30 dari tempat sama dengan kecepatan 100 km/jam searah. Mobil kedua menyusul pada pukul …", options: ["09.30", "10.00", "10.30", "11.00"], answer: 2, explain: "Selisih jarak awal = 80 × 0,5 jam = 40 km. Kecepatan relatif = 100 − 80 = 20 km/jam, jadi tersusul dalam 40:20 = 2 jam setelah 08.30, yaitu pukul 10.30." },
  ];
  BANK.SMA["kanguru-matematika"] = [
    { q: "Barisan: 3, 7, 13, 21, 31, … Suku berikutnya adalah …", options: ["39", "41", "43", "45"], answer: 2, explain: "Selisih +4, +6, +8, +10, berikutnya +12 → 43." },
    { q: "Di sebuah barisan tempat duduk 7 orang, A duduk di tengah. B di sebelah kiri A, C di paling kanan. Posisi C dari kiri adalah ke-…", options: ["5", "6", "7", "4"], answer: 2, explain: "7 kursi, paling kanan adalah posisi ke-7 dari kiri." },
    { q: "Sebuah kubus dicat seluruh permukaannya lalu dipotong menjadi 27 kubus kecil sama besar. Kubus kecil dengan tepat 2 sisi bercat ada …", options: ["8", "12", "6", "18"], answer: 1, explain: "Kubus kecil di tengah tiap rusuk: 12 rusuk × 1 = 12." },
  ];
  BANK.SMA["kanguru-bahasa"] = [
    { q: "Makna kata “signifikan” pada kalimat “Kenaikan harga berdampak signifikan bagi warga” adalah …", options: ["Penting dan berpengaruh nyata", "Sedikit dan sepele", "Cepat sekali", "Mahal"], answer: 0, explain: "Signifikan = penting/berarti dan berdampak nyata." },
    { q: "Pasangan kata yang berantonim adalah …", options: ["abstrak – konkret", "abstrak – nyata samar", "sinonim – makna", "cepat – lekas"], answer: 0, explain: "Abstrak (tak berwujud) >< konkret (nyata berwujud)." },
    { q: "Kalimat rumpang logis: “Meskipun sudah belajar semalaman, Raka tetap … karena soal ujiannya jauh lebih sulit dari perkiraan.” Kata yang paling tepat adalah …", options: ["gagal", "berhasil gemilang", "santai saja", "terkenal"], answer: 0, explain: "Kata “meskipun” menuntut hasil yang berlawanan dengan usaha: gagal adalah yang logis." },
  ];
}

/* ===== Paket Gaya Internasional — soal inti tertulis ORIGINAL buatan ZIQVA OLIM =====
   Mengikuti CIRI KHAS topik, format, dan tingkat kesulitan lomba SEAMO / SASMO /
   AMO / JSO — BUKAN soal resmi lomba tersebut dan bukan salinan past paper mana pun.
   Semua soal ditulis sendiri dengan angka, nama, dan konteks acak; kunci dihitung manual.
   Generator proseduralnya ada di generators.ts (seamoGens / sasmoGens / amoGens / jsoGens). */
if (BANK.TK) {
  BANK.TK["seamo"] = [
    { q: "Pola gambar: 🔺 🔺 ⭕ 🔺 🔺 ⭕ 🔺 … Gambar berikutnya adalah …", emoji: "🔺", options: ["🔺 Segitiga", "⭕ Lingkaran", "⬛ Persegi"], answer: 0, explain: "Polanya berulang: segitiga, segitiga, lingkaran. Sesudah segitiga yang sendiri, berikutnya segitiga lagi." },
    { q: "Rani punya ⭐⭐⭐⭐ bintang. Beni punya ⭐⭐ bintang. Siapa yang bintangnya PALING BANYAK?", emoji: "⭐", options: ["Rani", "Beni", "Sama banyak"], answer: 0, explain: "4 bintang lebih banyak dari 2 bintang, jadi Rani." },
    { q: "Ada 3 burung di pohon 🐦🐦🐦. Datang 2 burung lagi 🐦🐦. Burung sekarang ada …", emoji: "🐦", options: ["4", "5", "6"], answer: 1, explain: "3 + 2 = 5 burung. Berpikir dulu: burungnya bertambah, bukan berkurang." },
    { q: "Kelompok gambar yang BERBEDA sendiri (ada gambar lain di dalamnya) adalah …", emoji: "🍎", options: ["🍎🍎🍎🍎", "🍎🍎🍌🍎", "🍌🍌🍌🍌"], answer: 1, explain: "Kelompok kedua campur: ada pisang di antara apel. Kelompok lain seragam semua." },
  ];
  BANK.TK["sasmo"] = [
    { q: "Sebanyak 6 permen dibagi rata kepada 2 anak. Setiap anak mendapat … permen", emoji: "🍬", options: ["2", "3", "4"], answer: 1, explain: "6 : 2 = 3. Berbagi rata artinya semua anak mendapat jumlah yang sama." },
    { q: "Dita punya 4 pensil. Ibu memberi 1 pak berisi 2 pensil lagi. Pensil Dita sekarang ada …", emoji: "✏️", options: ["5", "6", "7"], answer: 1, explain: "4 + 2 = 6 pensil. Soal cerita sehari-hari: gabungkan yang lama dan yang baru." },
    { q: "Sebuah kue dipotong menjadi 4 bagian sama besar. Satu bagian dimakan. Sisa kue ada … bagian", emoji: "🍰", options: ["2", "3", "4"], answer: 1, explain: "4 − 1 = 3 bagian kue." },
    { q: "Hitung jari satu tanganmu! Ada … jari", emoji: "🖐️", options: ["4", "5", "10"], answer: 1, explain: "Satu tangan punya 5 jari. Dua tangan baru 10 jari." },
  ];
  BANK.TK["amo"] = [
    { q: "Noah punya 3 bola baseball ⚾⚾⚾. Temannya memberi 2 bola lagi ⚾⚾. Bola Noah sekarang ada …", emoji: "⚾", options: ["4", "5", "6"], answer: 1, explain: "3 + 2 = 5 bola. Baseball adalah olahraga kesayangan anak-anak di Amerika." },
    { q: "Bus sekolah mengantar 3 anak. Lalu 3 anak lagi naik di halte berikutnya. Anak di dalam bus sekarang ada …", emoji: "🚌", options: ["5", "6", "7"], answer: 1, explain: "3 + 3 = 6 anak." },
    { q: "Satu permen harganya 1 koin dolar. Ben punya 5 koin dolar dan membeli 1 permen. Sisa koin Ben ada …", emoji: "🪙", options: ["3", "4", "5"], answer: 1, explain: "5 − 1 = 4 koin dolar." },
    { q: "Ava melihat 4 daun musim gugur 🍂🍂🍂🍂, lalu menemukan 1 daun lagi 🍂. Daun Ava sekarang ada …", emoji: "🍂", options: ["4", "5", "6"], answer: 1, explain: "4 + 1 = 5 daun." },
  ];
  BANK.TK["jso"] = [
    { q: "Tanaman tumbuh sehat bila diberi …", emoji: "🌱", options: ["Air dan cahaya matahari", "Mainan", "Batu besar"], answer: 0, explain: "Ilmuwan cilik tahu: tanaman butuh air dan cahaya matahari untuk tumbuh." },
    { q: "Benda yang TENGGELAM bila dimasukkan ke air adalah …", emoji: "🪨", options: ["Batu kecil", "Daun", "Gabus"], answer: 0, explain: "Batu kecil tenggelam; daun dan gabus mengapung. Coba buktikan di baskom air!" },
    { q: "Kita bisa melihat bayangan kita di lantai karena ada …", emoji: "🔦", options: ["Cahaya", "Suara", "Angin"], answer: 0, explain: "Bayangan terbentuk saat cahaya terhalang badan kita." },
    { q: "Hewan yang hidup di air adalah …", emoji: "🐠", options: ["Ikan", "Ayam", "Kucing"], answer: 0, explain: "Ikan hidup di air dan bernapas dengan insang." },
  ];
}
if (BANK.SD) {
  BANK.SD["seamo"] = [
    { q: "Pola bilangan: 5, 9, 17, 33, … Bilangan berikutnya adalah …", options: ["49", "57", "65", "66"], answer: 2, explain: "Selisihnya +4, +8, +16 — selalu dua kali lipat. Berikutnya +32 → 33 + 32 = 65." },
    { q: "Umur Ani dua kali umur Budi. Umur Budi 6 tahun. Umur Caca 3 tahun lebih tua dari Budi. Yang PALING TUA adalah …", options: ["Ani (12 tahun)", "Budi (6 tahun)", "Caca (9 tahun)", "Sama tua"], answer: 0, explain: "Ani = 2 × 6 = 12 tahun, Caca = 6 + 3 = 9 tahun. Paling tua Ani." },
    { q: "Read in English: A basket has 24 oranges. They are shared equally among 6 children. Each child gets … oranges", options: ["3", "4", "5", "6"], answer: 1, explain: "24 : 6 = 4 oranges for each child. (24 jeruk dibagi rata ke 6 anak, tiap anak 4.)" },
    { q: "Bilangan yang BERBEDA sendiri karena BUKAN kelipatan 3 adalah …", options: ["9", "12", "15", "20"], answer: 3, explain: "9, 12, dan 15 habis dibagi 3. 20 bukan kelipatan 3." },
    { q: "Pola gambar: ⭐⭐🌙 ⭐⭐🌙 ⭐⭐ … Gambar ke-8 adalah …", options: ["⭐ Bintang", "🌙 Bulan", "☀️ Matahari", "☁️ Awan"], answer: 0, explain: "Pola berulang tiap 3 gambar: bintang, bintang, bulan. Gambar ke-7 dan ke-8 adalah bintang." },
  ];
  BANK.SD["sasmo"] = [
    { q: "Trik hitung cerdas: 1 + 2 + 3 + … + 10 = … (Pasangkan 1+10, 2+9, … masing-masing 11, ada 5 pasang)", options: ["45", "50", "55", "60"], answer: 2, explain: "5 pasang × 11 = 55. Trik pasangan ini dipakai matematikawan kecil Gauss!" },
    { q: "Sebanyak 5 teman saling berjabat tangan. Setiap pasang berjabat tangan tepat 1 kali. Total jabat tangan ada …", options: ["5", "10", "15", "20"], answer: 1, explain: "Pasangan dari 5 orang: (5 × 4) : 2 = 10 jabat tangan." },
    { q: "Pak A berisi 4 pensil seharga Rp8.000. Di toko lain, 1 pensil dijual Rp2.500. Harga per pensil yang LEBIH MURAH adalah …", options: ["Pak A (Rp2.000 per pensil)", "Toko lain (Rp2.500 per pensil)", "Sama saja", "Tidak bisa dibandingkan"], answer: 0, explain: "Pak A: 8.000 : 4 = Rp2.000 per pensil, lebih murah dari Rp2.500." },
    { q: "Kelas mulai pukul 07.30. Pelajaran pertama 35 menit, istirahat 10 menit, pelajaran kedua 35 menit. Pelajaran kedua selesai pukul …", options: ["08.40", "08.50", "09.00", "08.30"], answer: 1, explain: "07.30 + 35 menit = 08.05; + 10 menit = 08.15; + 35 menit = 08.50." },
    { q: "Sebanyak 23 siswa akan dibagi ke kelompok berisi 5 anak. Kelompok penuh yang terbentuk ada … dan sisanya … anak", options: ["4 kelompok, sisa 3", "5 kelompok, sisa 0", "4 kelompok, sisa 5", "3 kelompok, sisa 8"], answer: 0, explain: "23 : 5 = 4 sisa 3, karena 4 × 5 = 20 dan 23 − 20 = 3." },
  ];
  BANK.SD["amo"] = [
    { q: "Seorang peternak di Texas mengumpulkan 3 lusin telur. (1 lusin = 12 butir) Telur seluruhnya ada … butir", options: ["15", "24", "36", "48"], answer: 2, explain: "3 × 12 = 36 butir telur. Di Amerika, telur juga sering dijual per lusin (dozen)." },
    { q: "Tinggi sebuah pintu adalah 6 feet (kaki). (1 foot = 12 inches) Tinggi pintu itu sama dengan … inches", options: ["18", "60", "72", "120"], answer: 2, explain: "6 × 12 = 72 inches. Foot dan inch adalah satuan panjang yang dipakai di Amerika." },
    { q: "Noah membayar dengan uang $10 untuk mainan seharga $7,25. Kembalian Noah adalah …", options: ["$2,75", "$3,75", "$2,25", "$3,25"], answer: 0, explain: "$10,00 − $7,25 = $2,75. Dolar ($) adalah mata uang Amerika; 1 dolar = 100 cents." },
    { q: "Bus sekolah menempuh 12 mil pada pagi hari dan 9 mil pada sore hari. Pola ini berulang selama 2 hari. Total jarak yang ditempuh adalah … mil", options: ["21", "30", "42", "48"], answer: 2, explain: "Per hari 12 + 9 = 21 mil. Selama 2 hari: 21 × 2 = 42 mil." },
    { q: "Emma membaca 4 halaman setiap hari. Setelah 2 minggu (14 hari), halaman yang dibaca Emma ada …", options: ["28", "42", "56", "70"], answer: 2, explain: "4 × 14 = 56 halaman." },
  ];
  BANK.SD["jso"] = [
    { q: "Dua tanaman sejenis ditanam di pot yang sama besar. Tanaman A disiram setiap hari, tanaman B tidak disiram. Dalam percobaan ini, hal yang SENGAJA DIBEDAKAN adalah …", options: ["Pemberian air", "Jenis tanaman", "Ukuran pot", "Warna pot"], answer: 0, explain: "Percobaan yang baik hanya membedakan SATU hal: pemberian air. Yang lain dibuat sama." },
    { q: "Benda yang MENGAPUNG di air adalah …", options: ["Gabus", "Batu", "Koin logam", "Sendok besi"], answer: 0, explain: "Gabus ringan dan mengapung; batu, koin, dan sendok besi tenggelam." },
    { q: "Hasil pengamatan suhu: Senin 30°C, Selasa 28°C, Rabu 32°C, Kamis 31°C. Hari TERPANAS adalah …", options: ["Senin", "Selasa", "Rabu", "Kamis"], answer: 2, explain: "Suhu tertinggi 32°C terjadi pada hari Rabu. Ilmuwan selalu membaca data dengan teliti." },
    { q: "Magnet akan menarik benda yang terbuat dari …", options: ["Besi", "Kayu", "Plastik", "Karet"], answer: 0, explain: "Magnet menarik logam besi (dan baja); kayu, plastik, dan karet tidak tertarik." },
    { q: "Bayangan tubuh kita terlihat paling PANJANG pada …", options: ["Pagi hari", "Tengah hari tepat", "Dalam ruangan gelap", "Malam tanpa lampu"], answer: 0, explain: "Pagi hari matahari masih rendah, jadi bayangan memanjang. Tengah hari bayangan paling pendek." },
  ];
}
if (BANK.SMP) {
  BANK.SMP["seamo"] = [
    { q: "Read in English: A school printed 240 worksheets and packed them equally into 8 classes. One class then used 12 worksheets. How many worksheets are left in that class?", options: ["18", "28", "30", "42"], answer: 0, explain: "240 : 8 = 30 worksheets per class; 30 − 12 = 18 left. (Tiap kelas 30 lembar; dipakai 12, sisa 18.)" },
    { q: "Pola bilangan: 2, 3, 7, 16, 32, 57, … Suku berikutnya adalah …", options: ["82", "89", "93", "107"], answer: 2, explain: "Selisihnya 1, 4, 9, 16, 25 — bilangan kuadrat! Berikutnya +36 → 57 + 36 = 93." },
    { q: "Dina lebih tinggi dari Eka. Eka lebih tinggi dari Fajar. Fajar lebih tinggi dari Gita. Yang PALING PENDEK adalah …", options: ["Dina", "Eka", "Fajar", "Gita"], answer: 3, explain: "Urutannya Dina > Eka > Fajar > Gita. Yang paling pendek Gita." },
    { q: "Satu-satunya bilangan prima yang genap adalah …", options: ["0", "1", "2", "4"], answer: 2, explain: "2 adalah bilangan prima (hanya bisa dibagi 1 dan dirinya) dan satu-satunya yang genap; prima lain semuanya ganjil." },
  ];
  BANK.SMP["sasmo"] = [
    { q: "Trik Gauss: 1 + 2 + 3 + … + 40 = …", options: ["780", "800", "820", "840"], answer: 2, explain: "Jumlah 1..n = n(n+1)/2 = 40 × 41 / 2 = 820." },
    { q: "Hitung cerdas: 25 × 16 = … (Trik: 25 × 4 = 100, dan 16 = 4 × 4)", options: ["350", "400", "450", "500"], answer: 1, explain: "25 × 16 = 25 × 4 × 4 = 100 × 4 = 400." },
    { q: "Toko A menjual tas Rp200.000 dengan diskon 30%. Toko B menjual tas yang sama Rp150.000 dengan diskon 10%. Harga akhir yang LEBIH MURAH ada di …", options: ["Toko A (Rp140.000)", "Toko B (Rp135.000)", "Sama murah", "Tidak bisa ditentukan"], answer: 1, explain: "Toko A: 200.000 × 70% = Rp140.000. Toko B: 150.000 × 90% = Rp135.000. Toko B lebih murah — jangan tertipu persen diskon yang besar!" },
    { q: "Dalam sebuah foto kelas, 8 siswa saling berjabat tangan, setiap pasang tepat 1 kali. Total jabat tangan adalah …", options: ["16", "28", "36", "56"], answer: 1, explain: "(8 × 7) : 2 = 28 jabat tangan." },
  ];
  BANK.SMP["amo"] = [
    { q: "Jarak dua kota adalah 50 mil. (1 mil ≈ 1,6 km) Jarak itu kira-kira sama dengan … km", options: ["50", "65", "80", "110"], answer: 2, explain: "50 × 1,6 = 80 km. Mil (mile) adalah satuan jarak utama di jalan-jalan Amerika." },
    { q: "Sebuah tangki berisi 6 gallons air. (1 gallon = 4 quarts) Isi tangki itu sama dengan … quarts", options: ["10", "18", "24", "30"], answer: 2, explain: "6 × 4 = 24 quarts." },
    { q: "Liam bekerja 5 jam dengan upah $9 per jam. Ia lalu membeli topi seharga $17. Sisa uang Liam adalah …", options: ["$26", "$28", "$32", "$45"], answer: 1, explain: "Upah = 5 × $9 = $45. Sisa = 45 − 17 = $28. Soal bertahap: hitung penghasilan dulu, baru kurangi belanja." },
    { q: "Suhu udara di Chicago adalah 68°F. Berapa suhu itu dalam Celsius? (Rumus: C = (F − 32) × 5/9)", options: ["15°C", "20°C", "25°C", "36°C"], answer: 1, explain: "(68 − 32) × 5/9 = 36 × 5/9 = 20°C. Amerika memakai Fahrenheit, Indonesia memakai Celsius." },
  ];
  BANK.SMP["jso"] = [
    { q: "Dalam percobaan pengaruh pupuk, dua tanaman sejenis diberi cahaya dan air yang sama; hanya pupuknya yang berbeda. Cahaya dan air dalam percobaan ini disebut …", options: ["Variabel kontrol (dibuat sama)", "Variabel bebas (yang diuji)", "Variabel terikat (hasil)", "Hipotesis"], answer: 0, explain: "Hal yang sengaja dibuat SAMA disebut variabel kontrol, agar hasil hanya dipengaruhi pupuk (variabel bebas)." },
    { q: "Pengamatan kecambah: hari ke-1 tinggi 2 cm, hari ke-2 tinggi 5 cm, hari ke-3 tinggi 9 cm. Pertumbuhan dari hari ke-2 ke hari ke-3 adalah … cm", options: ["3", "4", "5", "7"], answer: 1, explain: "9 − 5 = 4 cm. Pertumbuhan adalah selisih dua pengukuran berurutan." },
    { q: "Es di gelas A (ruang hangat) mencair dalam 10 menit, sedangkan es yang sama di gelas B (kulkas) mencair dalam 40 menit. Kesimpulan yang TEPAT adalah …", options: ["Suhu yang lebih tinggi membuat es lebih cepat mencair", "Es di kulkas lebih besar", "Gelas A lebih bagus", "Es selalu mencair dalam 10 menit"], answer: 0, explain: "Satu-satunya perbedaan adalah suhu tempat, jadi suhu itulah penyebab perbedaan waktu mencair." },
    { q: "Peristiwa berikut yang merupakan perubahan FISIKA (tidak membentuk zat baru) adalah …", options: ["Es mencair menjadi air", "Kayu terbakar menjadi abu", "Besi berkarat", "Susu menjadi asam"], answer: 0, explain: "Es mencair hanya berubah wujud; airnya tetap H₂O. Terbakar, berkarat, dan menjadi asam membentuk zat baru (perubahan kimia)." },
  ];
}
if (BANK.SMA) {
  BANK.SMA["seamo"] = [
    { q: "Read in English: The sum of three consecutive even numbers is 48. The largest of the three numbers is …", options: ["16", "18", "20", "22"], answer: 1, explain: "The numbers are 14, 16, and 18 (sum 48). The largest is 18. (Bilangan genap berurutan: 14, 16, 18.)" },
    { q: "Pola bilangan: 1, 2, 6, 24, 120, … Suku berikutnya adalah …", options: ["240", "360", "600", "720"], answer: 3, explain: "Polanya ×2, ×3, ×4, ×5 — berikutnya ×6 → 120 × 6 = 720. (Ini pola faktorial!)" },
    { q: "Premis: Semua peserta babak final adalah peraih skor 80 ke atas. Raka adalah peserta babak final. Kesimpulan yang PASTI benar adalah …", options: ["Skor Raka 80 ke atas", "Skor Raka tepat 100", "Raka juara pertama", "Raka peserta termuda"], answer: 0, explain: "Karena Raka peserta final dan semua peserta final berskor 80 ke atas, skor Raka pasti 80 ke atas. Pilihan lain tidak bisa dipastikan." },
    { q: "Dalam sebuah deret, setiap suku diperoleh dengan mengali suku sebelumnya dengan 3 lalu menguranginya dengan 1: 2, 5, 14, 41, … Suku berikutnya adalah …", options: ["82", "122", "123", "125"], answer: 1, explain: "41 × 3 − 1 = 122. Periksa pola dari awal: 2×3−1=5, 5×3−1=14, 14×3−1=41." },
  ];
  BANK.SMA["sasmo"] = [
    { q: "Trik Gauss: 1 + 2 + 3 + … + 100 = …", options: ["4.950", "5.000", "5.050", "5.100"], answer: 2, explain: "100 × 101 / 2 = 5.050. Pasangan 1+100, 2+99, … masing-masing 101, ada 50 pasang." },
    { q: "Hitung cerdas: 999 × 37 = … (Trik: 999 = 1.000 − 1)", options: ["36.900", "36.963", "37.000", "37.963"], answer: 1, explain: "999 × 37 = 37.000 − 37 = 36.963." },
    { q: "Sebuah ponsel seharga Rp2.400.000 dibeli dengan uang muka Rp400.000, sisanya dicicil 8 kali sama besar tanpa bunga. Besar cicilan per bulan adalah …", options: ["Rp200.000", "Rp250.000", "Rp300.000", "Rp340.000"], answer: 1, explain: "Sisa utang = 2.400.000 − 400.000 = Rp2.000.000. Cicilan = 2.000.000 : 8 = Rp250.000." },
  ];
  BANK.SMA["amo"] = [
    { q: "Sebuah mobil melaju 60 mil per jam (mph) di jalan tol Amerika. (1 mil ≈ 1,6 km) Kecepatan itu kira-kira sama dengan … km/jam", options: ["76", "86", "96", "106"], answer: 2, explain: "60 × 1,6 = 96 km/jam." },
    { q: "Perjalanan darat (road trip): sebuah keluarga berkendara 4 jam per hari dengan kecepatan rata-rata 50 mil/jam, selama 3 hari. Total jarak perjalanan mereka adalah … mil", options: ["350", "500", "600", "750"], answer: 2, explain: "Per hari 4 × 50 = 200 mil. Selama 3 hari: 200 × 3 = 600 mil. Kerjakan bertahap!" },
    { q: "Prakiraan cuaca di New York: 104°F. Suhu itu dalam Celsius adalah … (C = (F − 32) × 5/9)", options: ["35°C", "40°C", "45°C", "72°C"], answer: 1, explain: "(104 − 32) × 5/9 = 72 × 5/9 = 40°C." },
  ];
  BANK.SMA["jso"] = [
    { q: "Dalam percobaan obat pertumbuhan tanaman, kelompok KONTROL adalah kelompok yang …", options: ["Tidak diberi perlakuan, sebagai pembanding", "Diberi perlakuan paling banyak", "Tumbuh paling cepat", "Ditanam terakhir"], answer: 0, explain: "Kelompok kontrol tidak menerima perlakuan yang diuji, agar perbedaan hasil bisa dibandingkan secara adil." },
    { q: "Data pertumbuhan kecambah per minggu: perlakuan A +6 cm, B +4 cm, C +9 cm, D +5 cm. Kesimpulan paling tepat dari data ini adalah …", options: ["Perlakuan C memberi pertumbuhan terbesar pada percobaan ini", "Perlakuan B selalu yang terbaik", "Semua perlakuan sama saja", "Data tidak bisa dibandingkan"], answer: 0, explain: "Angka terbesar adalah C (+9 cm). Kesimpulan ilmiah harus berdasarkan data, bukan tebakan." },
    { q: "Pernyataan yang merupakan HIPOTESIS ilmiah (dapat diuji dengan percobaan) adalah …", options: ["Tanaman yang menerima cahaya lebih banyak akan tumbuh lebih cepat", "Tanaman hijau adalah tanaman tercantik", "Semua tanaman pasti suka musik", "Tanaman sebaiknya ditanam hari Senin"], answer: 0, explain: "Hipotesis harus bisa diuji dan diukur: cahaya dan kecepatan tumbuh keduanya dapat diamati dalam percobaan." },
  ];
}

/* ---------------- Level kesulitan & pembangun sesi ---------------- */
export interface LevelDef {
  n: number;
  name: string;
  desc: string;
}
export const LEVELS: LevelDef[] = [
  { n: 1, name: "Pemula", desc: "Konsep paling dasar, jawaban langsung. Cocok untuk pemanasan dan percaya diri." },
  { n: 2, name: "Mudah", desc: "Masih ringan, mulai ada variasi dan satu langkah berpikir." },
  { n: 3, name: "Sedang", desc: "Butuh dua langkah berpikir, perbandingan, atau mengingat lebih banyak." },
  { n: 4, name: "Sulit", desc: "Analisis dan penalaran multi-langkah; pilihan jawaban dibuat mirip-mirip." },
  { n: 5, name: "Ahli Olimpiade", desc: "Tantangan tersulit setara soal lomba olimpiade sungguhan. Berani coba?" },
];
/** Jumlah soal per sesi — format standar olimpiade: 20 soal, 1 menit per soal. */
export const SESSION_SIZE = 20;
/** Skor minimum pada suatu level agar level berikutnya terbuka otomatis. */
export const UNLOCK_SCORE = 80;

const SEEN_KEY = "ziqva-seen-v1";
function qkey(q: Question): string {
  return `${q.q}::${q.options[q.answer] ?? ""}`;
}
function loadSeen(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

/** Bank soal tertulis mentah (tanpa acak) untuk jenjang + mapel.
    Mode Cambridge (english): pakai BANK_EN; mapel cambridge-* memang
    sudah berbahasa Inggris di BANK sehingga dipakai apa adanya. Bila
    padanan Inggris belum ada, kembalikan kosong (generator Inggris
    mengisi sesi) — jangan bocorkan soal Bahasa Indonesia. */
export function getPackage(jenjang: JenjangId, subjectId: string, english = false): Question[] {
  if (english) {
    const en = BANK_EN[jenjang]?.[subjectId];
    if (en) return en;
    if (subjectId.startsWith("cambridge-")) return BANK[jenjang]?.[subjectId] ?? [];
    return [];
  }
  return BANK[jenjang]?.[subjectId] ?? [];
}

/**
 * Bangun satu sesi soal: `count` soal unik (default 20) untuk
 * jenjang + mapel + level, diacak dari bank tertulis + generator,
 * tanpa pengulangan di dalam sesi, dan memprioritaskan soal yang
 * belum pernah keluar di perangkat ini.
 */
export function buildSession(jenjang: JenjangId, subjectId: string, level: number, count: number = SESSION_SIZE, english = false, kelas?: string): Question[] {
  const band01 = kelas ? kelasBand(jenjang, kelas) : undefined;
  const combo = `${jenjang}|${subjectId}|${level}${english ? "|en" : ""}${kelas ? `|k${kelas}` : ""}`;
  const authoredAll = getPackage(jenjang, subjectId, english);
  const total = authoredAll.length;
  const withLevel = authoredAll.map((q, i) => ({
    q,
    lv: q.lv !== undefined ? Math.min(5, Math.max(1, q.lv)) : Math.min(5, 1 + Math.floor((i * 5) / Math.max(1, total))),
  }));
  // Soal inti tertulis dipetakan ke kelas yang sesuai: posisi kesulitan
  // soal (menurut urutannya di bank) harus berada di dalam / dekat pita
  // kelas terpilih — soal khas kelas rendah tidak muncul di kelas tinggi
  // dan sebaliknya. Bila saringan membuat bank kosong, pakai bank penuh.
  let authoredPool = withLevel;
  let authoredExcluded: typeof withLevel = [];
  if (band01 !== undefined) {
    const classCenter = band01 * 0.65 + 0.175;
    const inBand = withLevel.filter((a) => Math.abs((a.lv - 1) / 4 - classCenter) <= 0.42);
    authoredPool = inBand;
    authoredExcluded = withLevel.filter((a) => !inBand.includes(a));
  }
  const targetPos = band01 !== undefined ? bandCoordFor(level, band01) : (level - 1) / 4;
  const ordered = [...authoredPool].sort((a, b) => Math.abs((a.lv - 1) / 4 - targetPos) - Math.abs((b.lv - 1) / 4 - targetPos));

  const pool: Question[] = [];
  const inPool = new Set<string>();
  const inPoolText = new Set<string>();
  const push = (q: Question) => {
    const k = qkey(q);
    const t = q.q.trim().toLowerCase();
    // Satu teks soal hanya boleh muncul sekali dalam pool sesi, walau
    // bank tertulis dan generator memuat soal yang sama.
    if (!inPool.has(k) && !inPoolText.has(t)) {
      inPool.add(k);
      inPoolText.add(t);
      pool.push(q);
    }
  };
  for (const a of ordered) push(shuffleOptions(a.q));
  for (let round = 0; round < 4 && pool.length < count * 2; round++) {
    const gen = english
      ? generateQuestionsEn(jenjang, subjectId, level, count * 2, band01)
      : generateQuestions(jenjang, subjectId, level, count * 2, band01);
    for (const q of gen) push(q);
  }
  // Jaring pengaman kelengkapan sesi: bila bank di dalam pita kelas
  // untuk kombinasi ini benar-benar tipis (pool unik tidak mencapai
  // jumlah soal sesi), lengkapi dari bank jenjang penuh supaya sesi
  // selalu utuh. Pada mapel berbank besar (mis. Matematika) jaring ini
  // tidak pernah terpicu.
  if (band01 !== undefined && pool.length < count) {
    // Utamakan soal tertulis yang tersisih saringan kelas sebelum
    // membuka bank generator jenjang penuh.
    for (const a of authoredExcluded) push(shuffleOptions(a.q));
    for (let round = 0; round < 4 && pool.length < count; round++) {
      const gen = english
        ? generateQuestionsEn(jenjang, subjectId, level, count * 2)
        : generateQuestions(jenjang, subjectId, level, count * 2);
      for (const q of gen) push(q);
    }
  }

  const store = loadSeen();
  const seenSet = new Set(store[combo] ?? []);
  const fresh = shuffle(pool.filter((q) => !seenSet.has(qkey(q))));
  const old = shuffle(pool.filter((q) => seenSet.has(qkey(q))));
  let session = [...fresh, ...old].slice(0, count);
  if (session.length < count) {
    // Bank benar-benar habis: isi sisa sesi dengan variasi acak ulang dari pool.
    const extra = shuffle(pool).slice(0, count - session.length).map((q) => shuffleOptions(q));
    const keys = new Set(session.map(qkey));
    session = [...session, ...extra.filter((q) => !keys.has(qkey(q)))];
  }

  const merged = [...(store[combo] ?? []), ...session.map(qkey)];
  store[combo] = [...new Set(merged)].slice(-600);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(store));
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return session;
}

export function medalFor(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Medali Emas", color: "#B8860B" };
  if (score >= 75) return { label: "Medali Perak", color: "#5B6B7B" };
  if (score >= 60) return { label: "Medali Perunggu", color: "#9C6642" };
  return { label: "Terus Berlatih", color: "#6B7280" };
}

export function motivationFor(score: number): string {
  if (score >= 90) return "Luar biasa! Kamu siap melaju ke babak final olimpiade. Pertahankan!";
  if (score >= 75) return "Hebat! Sedikit lagi menuju emas — periksa pembahasan soal yang salah, ya.";
  if (score >= 60) return "Bagus! Terus berlatih untuk hasil terbaik, seperti pejuang olimpiade sejati.";
  return "Tidak apa-apa, semua juara mulai dari latihan. Baca pembahasannya dan coba lagi!";
}

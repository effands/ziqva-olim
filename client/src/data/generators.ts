// Generator soal prosedural ZIQVA OLIM.
//
// Setiap generator menghasilkan soal BARU setiap dipanggil: angka, nama,
// konteks, data, dan pilihan jawaban diacak dari bank data besar per
// jenjang x mapel. Jawaban soal hitungan selalu DIHITUNG oleh kode (bukan
// ditebak), dan soal hafalan memakai bank pasangan/fakta dengan pengecoh
// yang disampling berbeda-beda — sehingga kombinasi soal yang mungkin
// mencapai ratusan sampai ribuan variasi per jenjang x mapel, dan dua sesi
// hampir tidak pernah sama.

import type { JenjangId, Question } from "./questions";

/* ---------------- util acak ---------------- */
const rnd = (n: number) => Math.floor(Math.random() * n);
export const ri = (a: number, b: number) => a + rnd(b - a + 1);
export function pick<T>(arr: readonly T[]): T {
  return arr[rnd(arr.length)] as T;
}
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    const t = a[i] as T;
    a[i] = a[j] as T;
    a[j] = t;
  }
  return a;
}
export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}
const fmt = (n: number) => n.toLocaleString("id-ID");
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

/* ---------------- pembangun soal ---------------- */
export function mkq(
  q: string,
  correct: string,
  distractors: string[],
  explain: string,
  emoji?: string,
  four = true,
): Question | null {
  const need = four ? 3 : 2;
  const ds = [...new Set(distractors.map((s) => s.trim()))].filter((d) => d !== "" && d !== correct);
  if (ds.length < need) return null;
  const options = shuffle([correct, ...ds.slice(0, need)]);
  const base: Question = { q, options, answer: options.indexOf(correct), explain };
  if (emoji) base.emoji = emoji;
  return base;
}

/** Acak ulang urutan pilihan jawaban soal yang sudah ada. */
export function shuffleOptions(q: Question): Question {
  const correct = q.options[q.answer] ?? "";
  const options = shuffle(q.options);
  return { ...q, options, answer: options.indexOf(correct) };
}

export type Gen = () => Question | null;

/* Bank pasangan [istilah, nilai]: soal dua arah, pengecoh disampling dari pasangan lain. */
export interface PairBank {
  pairs: readonly (readonly [string, string])[];
  askA: (a: string) => string;
  askB: (b: string) => string;
  exA: (a: string, b: string) => string;
  exB: (a: string, b: string) => string;
  emoji?: string;
  four?: boolean;
}
export function pairGen(bank: PairBank): Gen {
  const four = bank.four ?? true;
  return () => {
    const pair = pick(bank.pairs);
    const a = pair[0];
    const b = pair[1];
    if (Math.random() < 0.5) {
      const ds = sample(bank.pairs.filter((p) => p[1] !== b), 3).map((p) => p[1]);
      return mkq(bank.askA(a), b, ds, bank.exA(a, b), bank.emoji, four);
    }
    const ds = sample(bank.pairs.filter((p) => p[0] !== a && p[1] !== b), 3).map((p) => p[0]);
    return mkq(bank.askB(b), a, ds, bank.exB(a, b), bank.emoji, four);
  };
}

/* Bank fakta: [soal, jawaban benar, [pengecoh...], pembahasan] */
export type Fact = readonly [string, string, readonly string[], string];
export function factGen(facts: readonly Fact[], four = true): Gen {
  return () => {
    const f = pick(facts);
    return mkq(f[0], f[1], [...f[2]], f[3], undefined, four);
  };
}

/* Klasifikasi: item -> kategori; pilihan jawabannya adalah kategori-kategorinya. */
export function classifyGen(
  items: readonly { item: string; cat: string }[],
  ask: (item: string) => string,
  ex: (item: string, cat: string) => string,
  four = true,
): Gen {
  const cats = [...new Set(items.map((i) => i.cat))];
  return () => {
    const it = pick(items);
    const ds = sample(cats.filter((c) => c !== it.cat), 3);
    return mkq(ask(it.item), it.cat, ds, ex(it.item, it.cat), undefined, four);
  };
}

/* ---------------- bank bersama lintas jenjang ---------------- */
export const NAMES = [
  "Aisyah", "Budi", "Caca", "Dimas", "Eka", "Fajar", "Gita", "Hana", "Ivan", "Joko",
  "Kirana", "Lukman", "Maya", "Nadia", "Putri", "Rafi", "Sinta", "Tono", "Umar", "Vina",
  "Wati", "Yoga", "Zahra", "Rina", "Andi", "Sari", "Rizky", "Dewi", "Bagas", "Intan",
] as const;

export const MALAIKAT: readonly (readonly [string, string])[] = [
  ["Jibril", "Menyampaikan wahyu kepada para nabi dan rasul"],
  ["Mikail", "Membagikan rezeki dan menurunkan hujan"],
  ["Israfil", "Meniup sangkakala pada hari kiamat"],
  ["Izrail", "Mencabut nyawa makhluk hidup"],
  ["Munkar", "Menanyai manusia di alam kubur"],
  ["Nakir", "Menanyai manusia di alam kubur bersama Munkar"],
  ["Raqib", "Mencatat amal baik manusia"],
  ["Atid", "Mencatat amal buruk manusia"],
  ["Malik", "Menjaga pintu neraka"],
  ["Ridwan", "Menjaga pintu surga"],
];

export const KITAB_NABI: readonly (readonly [string, string])[] = [
  ["Taurat", "Nabi Musa AS"],
  ["Zabur", "Nabi Daud AS"],
  ["Injil", "Nabi Isa AS"],
  ["Al-Qur'an", "Nabi Muhammad SAW"],
];

export const RAKAAT: readonly (readonly [string, string])[] = [
  ["Subuh", "2"],
  ["Zuhur", "4"],
  ["Asar", "4"],
  ["Magrib", "3"],
  ["Isya", "4"],
];

export const RUKUN_ISLAM = ["Syahadat", "Salat", "Zakat", "Puasa Ramadan", "Haji bagi yang mampu"] as const;
export const RUKUN_IMAN = [
  "Iman kepada Allah", "Iman kepada malaikat", "Iman kepada kitab-kitab Allah",
  "Iman kepada rasul-rasul Allah", "Iman kepada hari kiamat", "Iman kepada qada dan qadar",
] as const;
export const BULAN_HIJRIAH = [
  "Muharam", "Safar", "Rabiulawal", "Rabiulakhir", "Jumadilawal", "Jumadilakhir",
  "Rajab", "Syakban", "Ramadan", "Syawal", "Zulkaidah", "Zulhijah",
] as const;

export const ASMAUL: readonly (readonly [string, string])[] = [
  ["Ar-Rahman", "Maha Pengasih"], ["Ar-Rahim", "Maha Penyayang"], ["Al-Malik", "Maha Merajai / Raja"],
  ["Al-Quddus", "Maha Suci"], ["As-Salam", "Maha Memberi Kesejahteraan"], ["Al-Khaliq", "Maha Pencipta"],
  ["Al-Alim", "Maha Mengetahui"], ["As-Sami'", "Maha Mendengar"], ["Al-Bashir", "Maha Melihat"],
  ["Ar-Razzaq", "Maha Pemberi Rezeki"], ["Al-Ghaffar", "Maha Pengampun"], ["Al-Hakim", "Maha Bijaksana"],
  ["Al-Adl", "Maha Adil"], ["Al-Lathif", "Maha Lembut"], ["Al-Khabir", "Maha Mengetahui Segala Rahasia"],
  ["Al-Qadir", "Maha Kuasa"], ["Al-Awwal", "Maha Awal"], ["Al-Akhir", "Maha Akhir"],
];

export const SIFAT_WAJIB: readonly (readonly [string, string])[] = [
  ["Wujud", "Ada"], ["Qidam", "Terdahulu tanpa permulaan"], ["Baqa", "Kekal, tidak binasa"],
  ["Mukhalafatu lil Hawadits", "Berbeda dengan semua makhluk"], ["Qiyamuhu Binafsihi", "Berdiri sendiri, tidak butuh yang lain"],
  ["Wahdaniyah", "Maha Esa / Tunggal"], ["Qudrat", "Maha Kuasa"], ["Iradat", "Maha Berkehendak"],
  ["Ilmu", "Maha Mengetahui"], ["Hayat", "Maha Hidup"], ["Sama'", "Maha Mendengar"],
  ["Bashar", "Maha Melihat"], ["Kalam", "Maha Berfirman"],
];

export const TOKOH_KRISTEN: readonly (readonly [string, string])[] = [
  ["Nuh", "Membangun bahtera dan selamat dari air bah"],
  ["Abraham", "Bapa orang beriman, dipanggil Allah meninggalkan negerinya"],
  ["Musa", "Memimpin bangsa Israel keluar dari perbudakan Mesir"],
  ["Daud", "Mengalahkan raksasa Goliat dan menjadi raja Israel"],
  ["Salomo", "Raja penuh hikmat yang membangun Bait Allah"],
  ["Yusuf (anak Yakub)", "Dijual oleh saudara-saudaranya dan menjadi orang kepercayaan Firaun"],
  ["Yunus", "Ditelan ikan besar selama tiga hari"],
  ["Daniel", "Tetap setia berdoa dan selamat di gua singa"],
  ["Maria", "Ibu Yesus"],
  ["Yohanes Pembaptis", "Membaptis Yesus di Sungai Yordan"],
  ["Petrus", "Murid Yesus yang berprofesi sebagai nelayan"],
  ["Paulus", "Rasul yang memberitakan Injil kepada bangsa-bangsa non-Yahudi"],
  ["Adam", "Manusia pertama yang diciptakan Allah"],
  ["Samuel", "Dipanggil Tuhan sejak masih kecil di Bait Allah"],
  ["Yosua", "Memimpin bangsa Israel memasuki Tanah Kanaan"],
  ["Elia", "Nabi yang berdoa hingga api turun dari langit di Gunung Karmel"],
];

export const PERAYAAN_KRISTEN: readonly (readonly [string, string])[] = [
  ["Natal", "Kelahiran Yesus Kristus"],
  ["Paskah", "Kebangkitan Yesus Kristus dari kematian"],
  ["Pentakosta", "Turunnya Roh Kudus atas para rasul"],
  ["Kenaikan Tuhan Yesus", "Yesus naik ke surga"],
  ["Jumat Agung", "Peringatan penyaliban dan wafat Yesus"],
];

export const PROVINSI_IBUKOTA: readonly (readonly [string, string])[] = [
  ["Aceh", "Banda Aceh"], ["Sumatera Utara", "Medan"], ["Sumatera Barat", "Padang"],
  ["Riau", "Pekanbaru"], ["Jambi", "Jambi"], ["Sumatera Selatan", "Palembang"],
  ["Bengkulu", "Bengkulu"], ["Lampung", "Bandar Lampung"], ["Banten", "Serang"],
  ["Jawa Barat", "Bandung"], ["Jawa Tengah", "Semarang"], ["DI Yogyakarta", "Yogyakarta"],
  ["Jawa Timur", "Surabaya"], ["Bali", "Denpasar"], ["Kalimantan Barat", "Pontianak"],
  ["Kalimantan Timur", "Samarinda"], ["Kalimantan Selatan", "Banjarbaru"],
  ["Sulawesi Selatan", "Makassar"], ["Sulawesi Utara", "Manado"], ["Papua", "Jayapura"],
  ["Maluku", "Ambon"], ["Nusa Tenggara Barat", "Mataram"], ["Nusa Tenggara Timur", "Kupang"],
  ["Gorontalo", "Gorontalo"], ["Sulawesi Barat", "Mamuju"], ["Kepulauan Riau", "Tanjung Pinang"],
];

export const UNSUR_SIMBOL: readonly (readonly [string, string])[] = [
  ["Hidrogen", "H"], ["Helium", "He"], ["Litium", "Li"], ["Karbon", "C"], ["Nitrogen", "N"],
  ["Oksigen", "O"], ["Natrium", "Na"], ["Magnesium", "Mg"], ["Aluminium", "Al"], ["Silikon", "Si"],
  ["Fosfor", "P"], ["Belerang (Sulfur)", "S"], ["Klor", "Cl"], ["Kalium", "K"], ["Kalsium", "Ca"],
  ["Besi", "Fe"], ["Tembaga", "Cu"], ["Seng", "Zn"], ["Perak", "Ag"], ["Emas", "Au"],
  ["Raksa", "Hg"], ["Timbal", "Pb"], ["Timah", "Sn"], ["Platina", "Pt"], ["Nikel", "Ni"],
];

/* ================================================================
   BANK BAHASA — Jawa (diperbanyak), Korea, Jepang, Mandarin.
   Pasangan [Indonesia, kata asing]. Soal dibuat dua arah, pengecoh
   disampling dari kosakata lain -> ratusan variasi per bahasa.
   ================================================================ */
export const JAWA_KRAMA: readonly (readonly [string, string])[] = [
  ["makan (ngoko: mangan)", "dahar"], ["minum (ngoko: ngombe)", "ngunjuk"], ["pergi (ngoko: lunga)", "tindak"],
  ["datang (ngoko: teka)", "rawuh"], ["tidur (ngoko: turu)", "sare"], ["rumah (ngoko: omah)", "dalem"],
  ["sakit (ngoko: lara)", "gerah"], ["besar (ngoko: gedhe)", "ageng"], ["kecil (ngoko: cilik)", "alit"],
  ["nama (ngoko: jeneng)", "asma"], ["kepala (ngoko: sirah)", "mustaka"], ["saya (ngoko: aku)", "kula"],
  ["kamu (ngoko: kowe)", "panjenengan"], ["bapak", "rama"], ["perut (ngoko: weteng)", "madaran"],
  ["mata (ngoko: mripat)", "soca"], ["tangan (ngoko: tangan)", "asta"], ["duduk (ngoko: lungguh)", "pinarak"],
  ["mati (ngoko: mati)", "seda"], ["pulang (ngoko: mulih)", "kondur"], ["baik (ngoko: apik)", "sae"],
  ["banyak (ngoko: akeh)", "kathah"], ["sedikit (ngoko: sithik)", "sekedhik"], ["baru (ngoko: anyar)", "enggal"],
];
export const JAWA_VOCAB: readonly (readonly [string, string])[] = [
  ["pagi", "enjing"], ["siang", "siyang"], ["sore", "sonten"], ["malam", "dalu"], ["terima kasih", "matur nuwun"],
  ["selamat pagi", "sugeng enjing"], ["selamat malam", "sugeng dalu"], ["air", "toya"], ["nasi", "sekul"],
  ["anak", "lare"], ["ibu", "ibu / biyung"], ["pasar", "peken"], ["jalan", "margi"], ["uang", "arta"],
  ["buku", "buku / pustaka"], ["sekolah", "sekolah / pawiyatan"], ["hari ini", "dinten menika"], ["besok", "benjing"],
  ["kemarin", "kala wingi"], ["satu", "setunggal"], ["dua", "kalih"], ["tiga", "tiga"], ["empat", "sekawan"],
  ["lima", "gangsal"], ["enam", "enem"], ["tujuh", "pitu"], ["delapan", "wolu"], ["sembilan", "sanga"], ["sepuluh", "sedasa"],
];
export const JAWA_AKSARA: readonly (readonly [string, string])[] = [
  ["ha", "ꦲ"], ["na", "ꦤ"], ["ca", "ꦕ"], ["ra", "ꦫ"], ["ka", "ꦏ"], ["da", "ꦢ"], ["ta", "ꦠ"],
  ["sa", "ꦱ"], ["wa", "ꦮ"], ["la", "ꦭ"], ["pa", "ꦥ"], ["dha", "ꦝ"], ["ja", "ꦗ"], ["ya", "ꦪ"],
  ["nya", "ꦚ"], ["ma", "ꦩ"], ["ga", "ꦒ"], ["ba", "ꦧ"], ["tha", "ꦛ"], ["nga", "ꦔ"],
];

export const KOREA_VOCAB: readonly (readonly [string, string])[] = [
  ["halo / hai", "안녕하세요 (annyeonghaseyo)"], ["terima kasih", "감사합니다 (gamsahamnida)"],
  ["selamat tinggal (ke yang pergi)", "안녕히 가세요 (annyeonghi gaseyo)"], ["ya", "네 (ne)"], ["tidak", "아니요 (aniyo)"],
  ["satu (Sino: il)", "일 (il)"], ["dua (Sino: i)", "이 (i)"], ["tiga (Sino: sam)", "삼 (sam)"],
  ["empat (Sino: sa)", "사 (sa)"], ["lima (Sino: o)", "오 (o)"], ["enam (Sino: yuk)", "육 (yuk)"],
  ["tujuh (Sino: chil)", "칠 (chil)"], ["delapan (Sino: pal)", "팔 (pal)"], ["sembilan (Sino: gu)", "구 (gu)"],
  ["sepuluh (Sino: sip)", "십 (sip)"], ["satu (asli: hana)", "하나 (hana)"], ["dua (asli: dul)", "둘 (dul)"],
  ["tiga (asli: set)", "셋 (set)"], ["air", "물 (mul)"], ["nasi / makanan", "밥 (bap)"], ["sekolah", "학교 (hakgyo)"],
  ["buku", "책 (chaek)"], ["teman", "친구 (chingu)"], ["ibu", "엄마 (eomma)"], ["ayah", "아빠 (appa)"],
  ["kucing", "고양이 (goyangi)"], ["anjing", "강아지 (gangaji)"], ["apel", "사과 (sagwa)"], ["susu", "우유 (uyu)"],
  ["merah", "빨간색 (ppalgansaek)"], ["biru", "파란색 (paransaek)"], ["kuning", "노란색 (noransaek)"],
  ["hari ini", "오늘 (oneul)"], ["besok", "내일 (naeil)"], ["kemarin", "어제 (eoje)"], ["saya", "저 (jeo) / 나 (na)"],
  ["senang / bahagia", "행복해요 (haengbokhaeyo)"], ["cinta", "사랑 (sarang)"], ["guru", "선생님 (seonsaengnim)"],
  ["siswa", "학생 (haksaeng)"], ["rumah", "집 (jip)"], ["mobil", "자동차 (jadongcha)"], ["matahari", "태양 (taeyang)"],
  ["bulan", "달 (dal)"], ["bintang", "별 (byeol)"], ["laut", "바다 (bada)"], ["gunung", "산 (san)"],
];
export const KOREA_FACTS: readonly Fact[] = [
  ["Partikel penanda subjek dalam bahasa Korea adalah …", "이/가 (i/ga)", ["을/를 (eul/reul)", "은/는 (eun/neun)", "에서 (eseo)"], "이/가 menandai subjek; 을/를 menandai objek; 은/는 menandai topik."],
  ["Partikel penanda objek dalam bahasa Korea adalah …", "을/를 (eul/reul)", ["이/가 (i/ga)", "도 (do)", "와/과 (wa/gwa)"], "Objek ditandai 을 (setelah konsonan) / 를 (setelah vokal)."],
  ["Akhiran kalimat formal sopan bahasa Korea adalah …", "입니다 / -ㅂ니다 (imnida)", ["-아/어 (a/eo)", "-다 (da)", "-지 (ji)"], "Gaya formal sopan memakai akhiran -입니다 dan -ㅂ니다/습니다."],
  ["“저는 학생입니다” artinya …", "Saya adalah seorang siswa", ["Saya pergi ke sekolah", "Dia adalah guru saya", "Kami semua siswa"], "저는 = saya (topik), 학생 = siswa, 입니다 = adalah."],
  ["Kata “왜” dalam bahasa Korea artinya …", "Mengapa", ["Kapan", "Di mana", "Siapa"], "왜 (wae) = mengapa; 언제 = kapan; 어디 = di mana; 누구 = siapa."],
  ["Kata tanya “어디 (eodi)” artinya …", "Di mana", ["Kapan", "Berapa", "Apa"], "어디 = di mana; 언제 = kapan; 얼마 = berapa (harga); 뭐 = apa."],
  ["Urutan kata dasar kalimat bahasa Korea adalah …", "Subjek – Objek – Predikat (SOP)", ["Subjek – Predikat – Objek (SPO)", "Predikat – Subjek – Objek (PSO)", "Objek – Predikat – Subjek (OPS)"], "Bahasa Korea berurutan SOP: kata kerja selalu di akhir kalimat."],
  ["“학교에 가요” artinya …", "Pergi ke sekolah", ["Datang dari sekolah", "Belajar di rumah", "Membaca buku sekolah"], "학교 = sekolah, 에 = ke (partikel arah), 가요 = pergi."],
  ["Hangul diciptakan pada masa raja …", "Raja Sejong yang Agung", ["Raja Gwanggaeto", "Raja Taejo", "Raja Jeongjo"], "Raja Sejong menciptakan Hangul (Hunminjeongeum) pada abad ke-15 (1443/1446)."],
  ["Jumlah huruf dasar Hangul adalah …", "24 huruf (14 konsonan + 10 vokal)", ["26 huruf", "21 huruf", "40 huruf"], "Hangul dasar: 14 konsonan dasar dan 10 vokal dasar."],
];

export const JEPANG_VOCAB: readonly (readonly [string, string])[] = [
  ["selamat pagi", "おはよう (ohayou)"], ["halo / selamat siang", "こんにちは (konnichiwa)"],
  ["selamat malam", "こんばんは (konbanwa)"], ["terima kasih", "ありがとう (arigatou)"],
  ["terima kasih banyak (sopan)", "ありがとうございます (arigatou gozaimasu)"], ["permisi / maaf", "すみません (sumimasen)"],
  ["selamat tinggal", "さようなら (sayounara)"], ["satu", "一 (ichi)"], ["dua", "二 (ni)"], ["tiga", "三 (san)"],
  ["empat", "四 (yon / shi)"], ["lima", "五 (go)"], ["enam", "六 (roku)"], ["tujuh", "七 (nana / shichi)"],
  ["delapan", "八 (hachi)"], ["sembilan", "九 (kyuu)"], ["sepuluh", "十 (juu)"], ["air", "水 (mizu)"],
  ["sekolah", "学校 (gakkou)"], ["buku", "本 (hon)"], ["teman", "友達 (tomodachi)"], ["ibu", "母 (haha) / お母さん (okaasan)"],
  ["ayah", "父 (chichi) / お父さん (otousan)"], ["kucing", "猫 (neko)"], ["anjing", "犬 (inu)"], ["ikan", "魚 (sakana)"],
  ["apel", "りんご (ringo)"], ["susu", "牛乳 (gyuunyuu)"], ["merah", "赤 (aka)"], ["biru", "青 (ao)"],
  ["putih", "白 (shiro)"], ["hitam", "黒 (kuro)"], ["hari ini", "今日 (kyou)"], ["besok", "明日 (ashita)"],
  ["kemarin", "昨日 (kinou)"], ["saya", "私 (watashi)"], ["guru", "先生 (sensei)"], ["siswa", "学生 (gakusei)"],
  ["rumah", "家 (ie)"], ["mobil", "車 (kuruma)"], ["matahari", "太陽 (taiyou)"], ["bulan", "月 (tsuki)"],
  ["gunung", "山 (yama)"], ["laut / samudra", "海 (umi)"], ["hujan", "雨 (ame)"], ["salju", "雪 (yuki)"],
];
export const JEPANG_KANA: readonly (readonly [string, string])[] = [
  ["a", "あ"], ["i", "い"], ["u", "う"], ["e", "え"], ["o", "お"], ["ka", "か"], ["ki", "き"], ["ku", "く"],
  ["ke", "け"], ["ko", "こ"], ["sa", "さ"], ["shi", "し"], ["su", "す"], ["se", "せ"], ["so", "そ"],
  ["ta", "た"], ["chi", "ち"], ["tsu", "つ"], ["te", "て"], ["to", "と"], ["na", "な"], ["ni", "に"],
  ["nu", "ぬ"], ["ne", "ね"], ["no", "の"], ["ha", "は"], ["hi", "ひ"], ["fu", "ふ"], ["he", "へ"], ["ho", "ほ"],
  ["ma", "ま"], ["mi", "み"], ["mu", "む"], ["me", "め"], ["mo", "も"], ["ya", "や"], ["yu", "ゆ"], ["yo", "よ"],
  ["ra", "ら"], ["ri", "り"], ["ru", "る"], ["re", "れ"], ["ro", "ろ"], ["wa", "わ"], ["wo", "を"], ["n", "ん"],
];
export const JEPANG_FACTS: readonly Fact[] = [
  ["Partikel penanda topik kalimat dalam bahasa Jepang adalah …", "は (dibaca 'wa')", ["を (wo)", "に (ni)", "が (ga) saja untuk semua"], "Topik ditandai partikel は yang ditulis 'ha' tetapi dibaca 'wa'."],
  ["“わたしは学生です” (watashi wa gakusei desu) artinya …", "Saya adalah seorang siswa", ["Saya pergi ke sekolah", "Dia bukan siswa", "Kami semua guru"], "わたし = saya, は = partikel topik, 学生 = siswa, です = adalah (sopan)."],
  ["Partikel penanda objek dalam bahasa Jepang adalah …", "を (dibaca 'o')", ["は (wa)", "へ (e)", "と (to)"], "Objek ditandai を; は topik; へ arah; と 'dan/bersama'."],
  ["Bentuk sopan (masu) dari kata kerja 'makan' (食べる taberu) adalah …", "食べます (tabemasu)", ["食べた (tabeta)", "食べない (tabenai)", "食べたい (tabetai)"], "Bentuk -masu adalah bentuk sopan waktu sekarang/masa depan."],
  ["Kata “せんせい” (sensei) digunakan untuk memanggil …", "Guru / orang yang dihormati keahliannya", ["Teman sebaya", "Adik kelas", "Orang asing di jalan"], "Sensei dipakai untuk guru, dokter, dan ahli yang dihormati."],
  ["“ありがとう” diucapkan ketika …", "Berterima kasih kepada seseorang", ["Meminta maaf", "Berpamitan pulang", "Meminta tolong"], "ありがとう (arigatou) = terima kasih."],
  ["Huruf Jepang yang dipakai untuk kata serapan asing adalah …", "Katakana", ["Hiragana", "Kanji", "Romaji"], "Katakana dipakai untuk kata asing, nama asing, dan penekanan."],
  ["Kanji “山” dibaca 'yama' dan artinya …", "Gunung", ["Sungai", "Laut", "Hutan"], "山 = gunung (yama / san). 川 = sungai, 海 = laut, 森 = hutan."],
];

export const MANDARIN_VOCAB: readonly (readonly [string, string])[] = [
  ["halo", "你好 (nǐ hǎo)"], ["terima kasih", "谢谢 (xièxie)"], ["selamat pagi", "早上好 (zǎoshang hǎo)"],
  ["selamat tinggal / sampai jumpa", "再见 (zàijiàn)"], ["ya / benar", "是 (shì)"], ["tidak / bukan", "不 (bù)"],
  ["satu", "一 (yī)"], ["dua", "二 (èr)"], ["tiga", "三 (sān)"], ["empat", "四 (sì)"], ["lima", "五 (wǔ)"],
  ["enam", "六 (liù)"], ["tujuh", "七 (qī)"], ["delapan", "八 (bā)"], ["sembilan", "九 (jiǔ)"], ["sepuluh", "十 (shí)"],
  ["seratus", "百 (bǎi)"], ["air", "水 (shuǐ)"], ["nasi (matang)", "饭 (fàn)"], ["sekolah", "学校 (xuéxiào)"],
  ["buku", "书 (shū)"], ["teman", "朋友 (péngyou)"], ["ibu", "妈妈 (māma)"], ["ayah", "爸爸 (bàba)"],
  ["kucing", "猫 (māo)"], ["anjing", "狗 (gǒu)"], ["ikan", "鱼 (yú)"], ["apel", "苹果 (píngguǒ)"],
  ["merah", "红色 (hóngsè)"], ["biru", "蓝色 (lánsè)"], ["kuning", "黄色 (huángsè)"], ["putih", "白色 (báisè)"],
  ["hari ini", "今天 (jīntiān)"], ["besok", "明天 (míngtiān)"], ["kemarin", "昨天 (zuótiān)"], ["saya", "我 (wǒ)"],
  ["kamu", "你 (nǐ)"], ["dia (laki-laki)", "他 (tā)"], ["guru", "老师 (lǎoshī)"], ["siswa", "学生 (xuésheng)"],
  ["rumah", "家 (jiā)"], ["matahari", "太阳 (tàiyáng)"], ["bulan", "月亮 (yuèliang)"], ["gunung", "山 (shān)"],
  ["laut", "海 (hǎi)"], ["cinta / suka", "爱 (ài)"], ["senang / gembira", "高兴 (gāoxìng)"],
];
export const MANDARIN_FACTS: readonly Fact[] = [
  ["Bahasa Mandarin memiliki … nada dasar yang mengubah arti kata", "4 nada", ["2 nada", "6 nada", "Tidak bernada"], "Mandarin punya 4 nada: datar tinggi, naik, turun-naik, dan turun. Contoh: mā (ibu), má (rami), mǎ (kuda), mà (memarahi)."],
  ["“我是学生” (Wǒ shì xuésheng) artinya …", "Saya adalah seorang siswa", ["Saya pergi ke sekolah", "Dia adalah guru", "Kami semua teman"], "我 = saya, 是 = adalah, 学生 = siswa."],
  ["Kata “吗 (ma)” di akhir kalimat berfungsi untuk …", "Membuat kalimat tanya ya/tidak", ["Menandai masa lalu", "Membuat kalimat perintah", "Menunjukkan kepemilikan"], "吗 (ma) di akhir kalimat pernyataan mengubahnya menjadi pertanyaan ya/tidak."],
  ["Partikel “的 (de)” dalam “我的书” menunjukkan …", "Kepemilikan (buku saya)", ["Pertanyaan", "Masa depan", "Larangan"], "的 (de) menandai kepemilikan: 我的书 = buku saya."],
  ["Satuan / kata ukur umum untuk buku dalam Mandarin adalah …", "本 (běn)", ["个 (gè)", "只 (zhī)", "条 (tiáo)"], "Buku memakai kata ukur 本; 个 umum; 只 untuk hewan; 条 untuk benda panjang."],
  ["“你好吗?” (Nǐ hǎo ma?) artinya …", "Apa kabarmu?", ["Siapa namamu?", "Kamu mau pergi?", "Berapa harganya?"], "你好 = halo, 吗 = partikel tanya → 'Apa kabarmu?'"],
  ["Urutan kata dasar kalimat Mandarin adalah …", "Subjek – Predikat – Objek (SPO)", ["Subjek – Objek – Predikat (SOP)", "Predikat – Objek – Subjek (POS)", "Objek – Subjek – Predikat (OSP)"], "Mandarin berurutan SPO seperti bahasa Indonesia: 我吃饭 (saya makan nasi)."],
  ["Karakter “人 (rén)” artinya …", "Orang / manusia", ["Gunung", "Air", "Mulut"], "人 = orang. 山 = gunung, 水 = air, 口 = mulut."],
];

/** Generator kosakata bahasa asing: tingkat kesulitan mengikuti jenjang. */
export function langVocabGens(
  vocab: readonly (readonly [string, string])[],
  langName: string,
  jenjang: JenjangId,
  extraFacts: readonly Fact[] = [],
): Gen[] {
  const limit = jenjang === "TK" ? 20 : jenjang === "SD" ? 32 : vocab.length;
  const slice = vocab.slice(0, limit);
  const gens: Gen[] = [
    pairGen({
      pairs: slice,
      askA: (a) => `Dalam Bahasa ${langName}, “${a}” adalah …`,
      askB: (b) => `“${b}” dalam Bahasa ${langName} artinya …`,
      exA: (a, b) => `“${a}” dalam Bahasa ${langName} adalah ${b}.`,
      exB: (a, b) => `${b} artinya “${a}”.`,
      four: jenjang !== "TK",
    }),
  ];
  if (extraFacts.length && jenjang !== "TK") gens.push(factGen(extraFacts));
  return gens;
}

/* ================================================================
   SISTEM LEVEL — setiap generator menerima level 1..5.
   Level 1: konsep dasar, jawaban langsung. Level 3: dua langkah /
   perbandingan. Level 5: analisis, multi-langkah, pengecoh mirip.
   Untuk bank pasangan/fakta, level memilih "jendela" materi:
   urutan bank disusun dari dasar -> lanjut, jendela bergeser naik
   seiring level, jadi soal benar-benar makin sulit.
   ================================================================ */
export type LGen = (level: number) => Question | null;

export function windowOf<T>(arr: readonly T[], level: number): T[] {
  const n = arr.length;
  if (n <= 10) return [...arr];
  const size = Math.max(6, Math.ceil(n * 0.55));
  const maxStart = n - size;
  const start = Math.round(((Math.min(5, Math.max(1, level)) - 1) / 4) * maxStart);
  return arr.slice(start, start + size) as T[];
}
export function pairGenL(bank: PairBank): LGen {
  return (level) => pairGen({ ...bank, pairs: windowOf(bank.pairs, level) })();
}
export function factGenL(facts: readonly Fact[], four = true): LGen {
  return (level) => factGen(windowOf(facts, level) as Fact[], four)();
}
/** Generator kosakata bahasa dengan jendela level. */
export function langVocabGensL(
  vocab: readonly (readonly [string, string])[],
  langName: string,
  jenjang: JenjangId,
  extraFacts: readonly Fact[] = [],
): LGen[] {
  const limit = jenjang === "TK" ? 20 : jenjang === "SD" ? 34 : vocab.length;
  const slice = vocab.slice(0, limit);
  const gens: LGen[] = [
    pairGenL({
      pairs: slice,
      askA: (a) => `Dalam Bahasa ${langName}, “${a}” adalah …`,
      askB: (b) => `“${b}” dalam Bahasa ${langName} artinya …`,
      exA: (a, b) => `“${a}” dalam Bahasa ${langName} adalah ${b}.`,
      exB: (a, b) => `${b} artinya “${a}”.`,
      four: jenjang !== "TK",
    }),
  ];
  if (extraFacts.length && jenjang !== "TK") gens.push(factGenL(extraFacts));
  return gens;
}

/* ---------------- bank bersama tambahan ---------------- */
export const EN_VOCAB: readonly (readonly [string, string])[] = [
  ["book", "buku"], ["pencil", "pensil"], ["teacher", "guru"], ["student", "siswa / murid"], ["school", "sekolah"],
  ["cat", "kucing"], ["dog", "anjing"], ["bird", "burung"], ["fish", "ikan"], ["horse", "kuda"],
  ["apple", "apel"], ["banana", "pisang"], ["rice", "nasi"], ["water", "air"], ["milk", "susu"],
  ["sun", "matahari"], ["moon", "bulan"], ["star", "bintang"], ["rain", "hujan"], ["tree", "pohon"],
  ["house", "rumah"], ["door", "pintu"], ["window", "jendela"], ["chair", "kursi"], ["table", "meja"],
  ["happy", "senang"], ["sad", "sedih"], ["big", "besar"], ["small", "kecil"], ["fast", "cepat"],
  ["run", "berlari"], ["eat", "makan"], ["drink", "minum"], ["read", "membaca"], ["write", "menulis"],
  ["morning", "pagi"], ["night", "malam"], ["friend", "teman"], ["family", "keluarga"], ["market", "pasar"],
  ["mountain", "gunung"], ["river", "sungai"], ["sea", "laut"], ["garden", "kebun / taman"], ["library", "perpustakaan"],
];
export const EN_OPPOSITES: readonly (readonly [string, string])[] = [
  ["big", "small"], ["hot", "cold"], ["fast", "slow"], ["happy", "sad"], ["brave", "afraid"],
  ["strong", "weak"], ["easy", "difficult"], ["rich", "poor"], ["young", "old"], ["tall", "short"],
  ["clean", "dirty"], ["bright", "dark"], ["early", "late"], ["safe", "dangerous"], ["near", "far"],
  ["true", "false"], ["loud", "quiet"], ["full", "empty"], ["begin", "end"], ["buy", "sell"],
];
export const EN_PAST: readonly (readonly [string, string])[] = [
  ["go", "went"], ["eat", "ate"], ["drink", "drank"], ["run", "ran"], ["read", "read (dibaca 'red')"],
  ["write", "wrote"], ["see", "saw"], ["buy", "bought"], ["take", "took"], ["give", "gave"],
  ["swim", "swam"], ["sing", "sang"], ["come", "came"], ["make", "made"], ["sleep", "slept"],
  ["teach", "taught"], ["bring", "brought"], ["think", "thought"], ["find", "found"], ["speak", "spoke"],
];
export const EN_PLURALS: readonly (readonly [string, string])[] = [
  ["child", "children"], ["tooth", "teeth"], ["foot", "feet"], ["mouse", "mice"], ["man", "men"],
  ["woman", "women"], ["leaf", "leaves"], ["knife", "knives"], ["tomato", "tomatoes"], ["box", "boxes"],
  ["watch", "watches"], ["baby", "babies"], ["city", "cities"], ["bus", "buses"], ["hero", "heroes"],
];
export const ARAB_VOCAB: readonly (readonly [string, string])[] = [
  ["كِتَابٌ (kitābun)", "buku"], ["قَلَمٌ (qalamun)", "pena"], ["مَدْرَسَةٌ (madrasatun)", "sekolah"],
  ["بَيْتٌ (baitun)", "rumah"], ["مَسْجِدٌ (masjidun)", "masjid"], ["بَابٌ (bābun)", "pintu"],
  ["مَاءٌ (mā'un)", "air"], ["شَمْسٌ (syamsun)", "matahari"], ["قَمَرٌ (qamarun)", "bulan"],
  ["نَجْمٌ (najmun)", "bintang"], ["وَلَدٌ (waladun)", "anak laki-laki"], ["بِنْتٌ (bintun)", "anak perempuan"],
  ["مُعَلِّمٌ (mu'allimun)", "guru"], ["طَالِبٌ (thālibun)", "siswa"], ["سَيَّارَةٌ (sayyāratun)", "mobil"],
  ["حِصَانٌ (hishānun)", "kuda"], ["قِطٌّ (qiththun)", "kucing"], ["كَلْبٌ (kalbun)", "anjing"],
  ["سَمَكٌ (samakun)", "ikan"], ["طَائِرٌ (thā'irun)", "burung"], ["شَجَرَةٌ (syajaratun)", "pohon"],
  ["زَهْرَةٌ (zahratun)", "bunga"], ["نَهْرٌ (nahrun)", "sungai"], ["بَحْرٌ (bahrun)", "laut"],
  ["جَبَلٌ (jabalun)", "gunung"], ["مَدِينَةٌ (madīnatun)", "kota"], ["سُوقٌ (sūqun)", "pasar"],
  ["صَدِيقٌ (shadīqun)", "teman"], ["أُمٌّ (ummun)", "ibu"], ["أَبٌ (abun)", "ayah"],
];
export const DHAMIR: readonly (readonly [string, string])[] = [
  ["هُوَ (huwa)", "dia laki-laki"], ["هِيَ (hiya)", "dia perempuan"], ["أَنْتَ (anta)", "kamu laki-laki"],
  ["أَنْتِ (anti)", "kamu perempuan"], ["أَنَا (anā)", "saya"], ["نَحْنُ (nahnu)", "kami / kita"],
  ["هُمْ (hum)", "mereka laki-laki"], ["أَنْتُمْ (antum)", "kalian laki-laki"],
];
export const SILA: readonly (readonly [string, string])[] = [
  ["Sila ke-1", "Ketuhanan Yang Maha Esa"], ["Sila ke-2", "Kemanusiaan yang adil dan beradab"],
  ["Sila ke-3", "Persatuan Indonesia"], ["Sila ke-4", "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan"],
  ["Sila ke-5", "Keadilan sosial bagi seluruh rakyat Indonesia"],
];
export const SILA_LAMBANG: readonly (readonly [string, string])[] = [
  ["Sila ke-1", "Bintang"], ["Sila ke-2", "Rantai"], ["Sila ke-3", "Pohon beringin"],
  ["Sila ke-4", "Kepala banteng"], ["Sila ke-5", "Padi dan kapas"],
];
export const PAHLAWAN: readonly (readonly [string, string])[] = [
  ["Cut Nyak Dien", "Aceh"], ["Pattimura (Thomas Matulessy)", "Maluku"], ["Pangeran Diponegoro", "Jawa Tengah"],
  ["Tuanku Imam Bonjol", "Sumatera Barat"], ["Sultan Hasanuddin", "Sulawesi Selatan"], ["R.A. Kartini", "Jawa Tengah (Jepara)"],
  ["Jenderal Sudirman", "Jawa Tengah (Purbalingga)"], ["Bung Tomo (Sutomo)", "Jawa Timur (Surabaya)"],
  ["I Gusti Ngurah Rai", "Bali"], ["Martha Christina Tiahahu", "Maluku"],
];
export const DINASTI: readonly (readonly [string, string])[] = [
  ["Dinasti Umayyah", "Damaskus"], ["Dinasti Abbasiyah", "Bagdad"], ["Dinasti Fatimiyah", "Kairo"],
  ["Dinasti Ayyubiyah", "Kairo / Damaskus"], ["Kesultanan Utsmaniyah (Ottoman)", "Istanbul"], ["Dinasti Safawiyah", "Isfahan (Persia)"],
  ["Kesultanan Mughal", "Delhi / Agra (India)"],
];
export const TOKOH_KARYA: readonly (readonly [string, string])[] = [
  ["Ibnu Sina", "Al-Qanun fi ath-Thibb (Canon Kedokteran)"], ["Al-Khawarizmi", "Kitab Al-Jabr (dasar aljabar)"],
  ["Ibnu Khaldun", "Al-Muqaddimah (pengantar ilmu sejarah & sosiologi)"], ["Al-Ghazali", "Ihya Ulumuddin"],
  ["Ibnu Rusyd (Averroes)", "Bidayatul Mujtahid & komentar filsafat Aristoteles"], ["Al-Farabi", "Al-Madinah Al-Fadhilah (Negara Utama)"],
  ["Ar-Razi (Rhazes)", "Al-Hawi (ensiklopedia kedokteran)"], ["Ibnu Haytham (Alhazen)", "Kitab al-Manazir (ilmu optik)"],
  ["Jalaluddin Rumi", "Matsnawi (syair sufistik)"], ["Al-Battani", "Tabel astronomi & trigonometri"],
];
export const ENZIM: readonly (readonly [string, string])[] = [
  ["Amilase (ptialin)", "Mengubah amilum / zat tepung menjadi gula"], ["Pepsin", "Mengubah protein menjadi pepton"],
  ["Lipase", "Mengubah lemak menjadi asam lemak dan gliserol"], ["Tripsin", "Mengubah protein / pepton menjadi asam amino"],
  ["Laktase", "Mengubah laktosa (gula susu) menjadi glukosa dan galaktosa"], ["Maltase", "Mengubah maltosa menjadi glukosa"],
  ["Sukrase", "Mengubah sukrosa menjadi glukosa dan fruktosa"], ["Renin (pada lambung bayi)", "Mengendapkan kasein susu"],
];
export const ORGANEL: readonly (readonly [string, string])[] = [
  ["Mitokondria", "Tempat respirasi sel, penghasil energi (ATP)"], ["Ribosom", "Tempat sintesis protein"],
  ["Nukleus (inti sel)", "Mengatur seluruh kegiatan sel & membawa materi genetik"], ["Vakuola", "Menyimpan cadangan makanan & zat sisa"],
  ["Kloroplas", "Tempat fotosintesis pada sel tumbuhan"], ["Membran sel", "Mengatur keluar-masuk zat & melindungi sel"],
  ["Sitoplasma", "Cairan tempat organel berada & reaksi kimia sel"], ["Badan Golgi", "Mengemas & menyalurkan hasil sintesis protein"],
  ["Lisosom", "Mencerna zat asing & organel rusak"], ["Dinding sel", "Memberi bentuk & kekuatan pada sel tumbuhan"],
];
export const ANTONIM_ID: readonly (readonly [string, string])[] = [
  ["rajin", "malas"], ["besar", "kecil"], ["tinggi", "rendah"], ["cepat", "lambat"], ["panas", "dingin"],
  ["terang", "gelap"], ["jauh", "dekat"], ["berat", "ringan"], ["kasar", "halus"], ["berani", "takut"],
  ["jujur", "curang"], ["sombong", "rendah hati"], ["boros", "hemat"], ["kuno", "modern"],
  ["awal", "akhir"], ["naik", "turun"], ["membeli", "menjual"], ["datang", "pergi"], ["senang", "sedih"], ["pintar", "bodoh"],
];
export const SINONIM_ID: readonly (readonly [string, string])[] = [
  ["bahagia", "gembira"], ["cepat", "lekas"], ["melihat", "memandang"], ["besar", "akbar / raya"],
  ["pandai", "cerdas"], ["marah", "gusar"], ["rumah", "kediaman"], ["berani", "gagah"],
  ["sulit", "sukar"], ["indah", "elok"], ["kaya", "makmur"], ["sedih", "duka"], ["teman", "sahabat"], ["pergi", "berangkat"],
];
export const PERIBAHASA: readonly (readonly [string, string])[] = [
  ["Berakit-rakit ke hulu, berenang-renang ke tepian", "Bersakit-sakit dahulu, bersenang-senang kemudian"],
  ["Rajin pangkal pandai, hemat pangkal kaya", "Rajin membuat pandai dan hemat membuat kaya"],
  ["Tong kosong nyaring bunyinya", "Orang yang banyak bicara biasanya kurang ilmu"],
  ["Sambil menyelam minum air", "Mengerjakan dua pekerjaan sekaligus dalam satu waktu"],
  ["Besar pasak daripada tiang", "Pengeluaran lebih besar daripada pemasukan"],
  ["Air beriak tanda tak dalam", "Orang yang banyak bicara biasanya dangkal ilmunya"],
  ["Sekali merengkuh dayung, dua tiga pulau terlampaui", "Satu usaha menyelesaikan beberapa tujuan sekaligus"],
  ["Di mana bumi dipijak, di situ langit dijunjung", "Hormati adat dan aturan tempat kita berada"],
  ["Berat sama dipikul, ringan sama dijinjing", "Suka duka ditanggung bersama / gotong royong"],
  ["Tak ada rotan, akar pun jadi", "Gunakan apa yang ada bila yang terbaik tidak tersedia"],
];
export const KATA_BAKU: readonly (readonly [string, string])[] = [
  ["apotik", "apotek"], ["analisa", "analisis"], ["jaman", "zaman"], ["ijin", "izin"], ["atlit", "atlet"],
  ["coklat", "cokelat"], ["resiko", "risiko"], ["nasehat", "nasihat"], ["praktek", "praktik"], ["obyek", "objek"],
  ["subyek", "subjek"], ["aktip", "aktif"], ["efektip", "efektif"], ["kwalitas", "kualitas"], ["sistim", "sistem"],
  ["karir", "karier"], ["konkrit", "konkret"], ["komplek", "kompleks"], ["detil", "detail"], ["formil", "formal"],
];
export const AKAD: readonly (readonly [string, string])[] = [
  ["Wakalah", "Pemberian kuasa / perwakilan kepada orang lain"], ["Ijarah", "Sewa-menyewa jasa atau barang"],
  ["Kafalah", "Penanggungan utang / jaminan oleh pihak ketiga"], ["Hawalah", "Pengalihan utang kepada pihak lain"],
  ["Mudharabah", "Kerja sama modal dari pemilik, usaha dari pengelola, untung dibagi"], ["Syirkah", "Persekutuan / kongsi dua pihak atau lebih"],
  ["Rahn", "Gadai: menahan barang sebagai jaminan utang"], ["Qardh", "Pinjaman kebajikan tanpa tambahan"],
  ["Salam", "Jual beli pesanan dengan pembayaran di muka"], ["Istishna'", "Jual beli pembuatan barang sesuai pesanan spesifikasi"],
];
export const ALIRAN: readonly (readonly [string, string])[] = [
  ["Jabariyah", "Manusia terpaksa oleh takdir, tidak punya kehendak bebas"], ["Qadariyah", "Manusia bebas berkehendak & bertanggung jawab atas perbuatannya"],
  ["Mu'tazilah", "Mengedepankan akal, manusia bebas berkehendak, Allah wajib berlaku adil menurut akal"],
  ["Asy'ariyah", "Jalan tengah: manusia berikhtiar (kasb), Allah yang menciptakan perbuatan"],
  ["Maturidiyah", "Mirip Asy'ariyah, menekankan keseimbangan wahyu dan akal"], ["Murji'ah", "Menunda penilaian iman pelaku dosa besar kepada Allah"],
];

/* ================================================================
   GENERATOR PER JENJANG x MAPEL (level-aware)
   ================================================================ */
const EMOJIS = ["⭐", "🍎", "🐶", "🌸", "🍌", "🐱", "🍓", "🦋", "🍇", "🐠"] as const;
const ITEMS_ID = ["pensil", "buku", "permen", "stiker", "kelereng", "apel", "jeruk", "balon", "kartu", "biskuit"] as const;

function numOpts(correct: number, spreads: number[]): (string | number)[] {
  return [correct, ...spreads.map((s) => correct + s)];
}
function mkNum(q: string, correct: number, distractors: number[], explain: string, emoji?: string, four = true): Question | null {
  return mkq(q, fmt(correct), distractors.map((d) => fmt(d)), explain, emoji, four);
}

/* ---------- TK ---------- */
const tkCount: LGen = (level) => {
  const e = pick(EMOJIS);
  const n = ri(2, 4 + level * 2);
  return mkNum(`Hitung gambar berikut: ${e.repeat(n)} — Ada berapa jumlahnya?`, n, [n - 1, n + 1, n + 2].filter((x) => x > 0), `Hitung satu-satu ada ${n}.`, e, false);
};
const tkAddSub: LGen = (level) => {
  const max = 4 + level * 3;
  const a = ri(1, max);
  const b = ri(1, max);
  if (Math.random() < 0.5 || a < b) {
    return mkNum(`${a} + ${b} = …`, a + b, [a + b - 1, a + b + 1, a + b + 2], `${a} + ${b} = ${a + b}.`, "🔢", false);
  }
  return mkNum(`${a} − ${b} = …`, a - b, [a - b + 1, a - b - 1, a - b + 2].filter((x) => x >= 0), `${a} − ${b} = ${a - b}.`, "🔢", false);
};
const tkCompare: LGen = () => {
  const set = sample([3, 5, 7, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 24, 25, 27, 30], 3);
  const smallest = Math.random() < 0.5;
  const ans = smallest ? Math.min(...set) : Math.max(...set);
  return mkq(
    `Perhatikan bilangan: ${set.join(", ")} — Bilangan yang paling ${smallest ? "KECIL" : "BESAR"} adalah …`,
    String(ans), set.filter((x) => x !== ans).map(String),
    `Urutkan dulu: ${[...set].sort((x, y) => x - y).join(" < ")}. Yang paling ${smallest ? "kecil" : "besar"} adalah ${ans}.`,
    "🔢", false,
  );
};
const tkMissing: LGen = (level) => {
  const step = pick(level >= 3 ? [1, 2, 5, 10] : [1, 2]);
  const start = ri(1, 12);
  const seq = [0, 1, 2, 3, 4].map((i) => start + i * step);
  const miss = ri(1, 3);
  const shown = seq.map((v, i) => (i === miss ? "__" : String(v))).join(", ");
  const ans = seq[miss] as number;
  return mkNum(`Bilangan apa yang hilang? ${shown}`, ans, [ans - step, ans + step, ans + 1].filter((x) => x > 0 && x !== ans), `Polanya loncat ${step}: setelah ${seq[miss - 1]} adalah ${ans}.`, "🔢", false);
};
const TK_SAINS_PAIRS: readonly (readonly [string, string])[] = [
  ["Ikan", "Air (laut / sungai / kolam)"], ["Burung", "Langit dan pohon"], ["Sapi", "Padang rumput / peternakan"],
  ["Katak", "Kolam dan darat"], ["Lebah", "Sekitar bunga dan sarang"], ["Monyet", "Pohon di hutan"],
  ["Kelinci", "Lubang tanah dan kebun"], ["Kupu-kupu", "Taman bunga"],
];
const TK_SAINS_FACTS: readonly Fact[] = [
  ["Hewan apa yang bisa terbang?", "Kupu-kupu", ["Ikan", "Kucing"], "Kupu-kupu punya sayap dan bisa terbang."],
  ["Kita melihat dengan …", "Mata", ["Telinga", "Hidung"], "Mata adalah indera penglihatan."],
  ["Kita mendengar suara dengan …", "Telinga", ["Mata", "Kulit"], "Telinga adalah indera pendengaran."],
  ["Tanaman butuh apa supaya tumbuh subur?", "Air dan cahaya matahari", ["Mainan", "Sepatu"], "Tanaman butuh air dan cahaya matahari untuk tumbuh."],
  ["Suara sapi adalah …", "Moo", ["Meong", "Guk guk"], "Sapi bersuara “moo”."],
  ["Suara kucing adalah …", "Meong", ["Moo", "Kukuruyuk"], "Kucing bersuara “meong”."],
  ["Benda apa yang terlihat di langit pada malam hari?", "Bulan dan bintang", ["Matahari", "Pelangi"], "Malam hari kita melihat bulan dan bintang."],
  ["Warna daun yang sehat umumnya …", "Hijau", ["Ungu", "Hitam"], "Daun berwarna hijau karena mengandung klorofil."],
  ["Hewan yang suka makan wortel adalah …", "Kelinci", ["Singa", "Elang"], "Kelinci sangat suka wortel dan sayuran."],
  ["Kita mencium bau dengan …", "Hidung", ["Mata", "Tangan"], "Hidung adalah indera penciuman."],
];
const TK_PAI_FACTS: readonly Fact[] = [
  ["Siapa Tuhan kita?", "Allah SWT", ["Matahari", "Bulan"], "Tuhan kita adalah Allah SWT, Pencipta alam semesta."],
  ["Sebelum makan kita membaca …", "Basmalah (Bismillah)", ["Hamdalah", "Takbir"], "Sebelum makan membaca basmalah: Bismillahirrahmanirrahim."],
  ["Setelah makan kita mengucapkan …", "Alhamdulillah", ["Astaghfirullah", "Subhanallah"], "Alhamdulillah tanda syukur setelah makan."],
  ["Nabi terakhir kita bernama Nabi …", "Muhammad SAW", ["Ibrahim AS", "Musa AS"], "Nabi terakhir dan teladan kita adalah Nabi Muhammad SAW."],
  ["Rukun Islam yang pertama adalah …", "Syahadat", ["Salat", "Puasa"], "Rukun Islam: 1) Syahadat, 2) Salat, 3) Zakat, 4) Puasa, 5) Haji."],
  ["Kitab suci umat Islam adalah …", "Al-Qur'an", ["Injil", "Taurat"], "Al-Qur'an diturunkan kepada Nabi Muhammad SAW."],
  ["Tempat ibadah umat Islam adalah …", "Masjid", ["Gereja", "Pura"], "Umat Islam beribadah di masjid."],
  ["Bulan puasa umat Islam adalah bulan …", "Ramadan", ["Syawal", "Muharam"], "Puasa wajib dilakukan pada bulan Ramadan."],
];
const TK_KRISTEN_FACTS: readonly Fact[] = [
  ["Siapa yang menciptakan langit dan bumi?", "Tuhan Allah", ["Manusia", "Malaikat"], "Kejadian 1:1 — Pada mulanya Allah menciptakan langit dan bumi."],
  ["Yesus lahir di kota …", "Betlehem", ["Roma", "Mesir"], "Yesus lahir di Betlehem (Matius 2:1)."],
  ["Kita berbicara dengan Tuhan melalui …", "Doa", ["Tidur", "Bermain"], "Doa adalah cara kita berbicara dengan Tuhan."],
  ["Hari ibadah orang Kristen ke gereja adalah hari …", "Minggu", ["Senin", "Jumat"], "Umat Kristen beribadah bersama di gereja pada hari Minggu."],
  ["Kitab suci orang Kristen adalah …", "Alkitab", ["Al-Qur'an", "Tripitaka"], "Alkitab adalah firman Tuhan bagi umat Kristen."],
  ["Manusia pertama yang diciptakan Tuhan adalah …", "Adam", ["Nuh", "Abraham"], "Adam adalah manusia pertama (Kejadian 1–2)."],
  ["Perayaan kelahiran Yesus disebut …", "Natal", ["Paskah", "Pentakosta"], "Natal = kelahiran Yesus, diperingati 25 Desember."],
  ["Perintah Tuhan: Kasihilah …", "Sesamamu manusia", ["Mainanmu saja", "Dirimu saja"], "“Kasihilah sesamamu manusia seperti dirimu sendiri” (Matius 22:39)."],
];
const TK_ENG_PAIRS: readonly (readonly [string, string])[] = [
  ["cat", "kucing"], ["dog", "anjing"], ["bird", "burung"], ["fish", "ikan"], ["duck", "bebek"],
  ["red", "merah"], ["blue", "biru"], ["yellow", "kuning"], ["green", "hijau"], ["black", "hitam"],
  ["one", "satu"], ["two", "dua"], ["three", "tiga"], ["four", "empat"], ["five", "lima"],
  ["apple", "apel"], ["banana", "pisang"], ["sun", "matahari"], ["moon", "bulan"], ["star", "bintang"],
  ["book", "buku"], ["ball", "bola"], ["milk", "susu"], ["egg", "telur"], ["hand", "tangan"],
];
const tkEngArrange: LGen = () => {
  const words: readonly (readonly [string, string])[] = [
    ["CAT", "kucing"], ["DOG", "anjing"], ["PIG", "babi"], ["COW", "sapi"], ["HEN", "ayam betina"],
    ["BEE", "lebah"], ["ANT", "semut"], ["EGG", "telur"], ["SUN", "matahari"], ["BUS", "bus"],
    ["TEN", "sepuluh"], ["RED", "merah"], ["FISH", "ikan"], ["CAKE", "kue"], ["BIRD", "burung"],
    ["LION", "singa"], ["BEAR", "beruang"], ["DUCK", "bebek"], ["GOAT", "kambing"], ["BALL", "bola"],
  ];
  const w = pick(words);
  const letters = shuffle(w[0].split("")).join(" – ");
  const others = sample(words.filter((x) => x[0] !== w[0]), 2).map((x) => x[0][0] + x[0].slice(1).toLowerCase());
  const correct = w[0][0] + w[0].slice(1).toLowerCase();
  return mkq(`Arrange the letters to form the correct word! ${letters}`, correct, others, `${w[0].split("").join("–")} menjadi ${correct.toUpperCase()}, artinya ${w[1]}.`, "🔤", false);
};

/* ---------- SD ---------- */
const sdAddSub: LGen = (level) => {
  const max = [60, 300, 1500, 12000, 150000][level - 1] ?? 60;
  const a = ri(5, max);
  const b = ri(4, max);
  if (Math.random() < 0.5) return mkNum(`Hasil dari ${fmt(a)} + ${fmt(b)} adalah …`, a + b, [a + b - 10, a + b + 10, a + b - 100], `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`);
  const [x, y] = a >= b ? [a, b] : [b, a];
  return mkNum(`Hasil dari ${fmt(x)} − ${fmt(y)} adalah …`, x - y, [x - y + 10, x - y - 10, x - y + 100].filter((v) => v >= 0), `${fmt(x)} − ${fmt(y)} = ${fmt(x - y)}.`);
};
const sdMulDiv: LGen = (level) => {
  if (Math.random() < 0.5) {
    const a = level >= 4 ? ri(12, 48) : ri(3, 6 + level * 3);
    const b = level >= 5 ? ri(12, 36) : ri(3, 9);
    return mkNum(`Hasil dari ${a} × ${b} adalah …`, a * b, [a * b - a, a * b + b, a * b + 10], `${a} × ${b} = ${a * b}.`);
  }
  const b = ri(2, 9 + level);
  const q = ri(3, 9 + level * 4);
  return mkNum(`Hasil dari ${b * q} : ${b} adalah …`, q, [q - 1, q + 1, q + 2], `${b * q} : ${b} = ${q}, karena ${b} × ${q} = ${b * q}.`);
};
const sdMixed: LGen = (level) => {
  if (level < 2) return null;
  const a = ri(3, 9 + level * 2);
  const b = ri(3, 9);
  const c = ri(2, 40);
  return mkNum(`Hasil dari ${a} × ${b} + ${c} adalah …`, a * b + c, [a * (b + c), a * b - c, a * b + c + 10], `Kerjakan perkalian dulu: ${a}×${b}=${a * b}, lalu + ${c} = ${a * b + c}.`);
};
const sdFraction: LGen = (level) => {
  if (level < 3) return null;
  const den = pick([4, 5, 6, 8, 10, 12]);
  const a = ri(1, den - 2);
  const b = ri(1, den - 1 - a);
  const sum = a + b;
  const g = gcd(sum, den);
  const ans = `${sum / g}/${den / g}`;
  const wrong = [`${sum}/${den}`, `${a + b + 1}/${den}`, `${sum}/${den + 1}`].filter((w) => w !== ans);
  return mkq(`Hasil dari ${a}/${den} + ${b}/${den} adalah …`, ans, wrong, `Penyebut sama: (${a}+${b})/${den} = ${sum}/${den}${g > 1 ? `, disederhanakan menjadi ${ans}` : ""}.`);
};
const sdFpbKpk: LGen = (level) => {
  if (level < 4) return null;
  const pairs: readonly (readonly [number, number])[] = [[12, 18], [16, 24], [20, 30], [24, 36], [18, 27], [15, 25], [28, 42], [36, 48], [8, 12], [9, 15]];
  const p = pick(pairs);
  const a = p[0];
  const b = p[1];
  if (Math.random() < 0.5) {
    const v = gcd(a, b);
    return mkNum(`FPB dari ${a} dan ${b} adalah …`, v, [v + 2, v * 2, Math.max(2, v - 2)], `Faktor bersama terbesar dari ${a} dan ${b} adalah ${v}.`);
  }
  const v = lcm(a, b);
  return mkNum(`KPK dari ${a} dan ${b} adalah …`, v, [v + a, v * 2, v - b], `Kelipatan persekutuan terkecil dari ${a} dan ${b} adalah ${v}.`);
};
const sdGeometry: LGen = (level) => {
  const kind = ri(0, 2);
  if (kind === 0) {
    const s = ri(3, 8 + level * 4);
    return Math.random() < 0.5
      ? mkNum(`Keliling persegi dengan sisi ${s} cm adalah … cm`, 4 * s, [2 * s, s * s, 4 * s + 4], `Keliling persegi = 4 × ${s} = ${4 * s} cm.`)
      : mkNum(`Luas persegi dengan sisi ${s} cm adalah … cm²`, s * s, [4 * s, 2 * s, s * s + s], `Luas persegi = ${s} × ${s} = ${s * s} cm².`);
  }
  if (kind === 1) {
    const p = ri(4, 10 + level * 4);
    const l = ri(3, p - 1);
    return Math.random() < 0.5
      ? mkNum(`Keliling persegi panjang ${p} cm × ${l} cm adalah … cm`, 2 * (p + l), [p + l, p * l, 2 * (p + l) + 4], `K = 2×(${p}+${l}) = ${2 * (p + l)} cm.`)
      : mkNum(`Luas persegi panjang ${p} cm × ${l} cm adalah … cm²`, p * l, [2 * (p + l), p + l, p * l + p], `L = ${p} × ${l} = ${p * l} cm².`);
  }
  const a = ri(4, 12 + level * 2);
  const t = pick([4, 6, 8, 10, 12]);
  return mkNum(`Luas segitiga dengan alas ${a} cm dan tinggi ${t} cm adalah … cm²`, (a * t) / 2, [a * t, (a * t) / 2 + a, a + t], `L = ½ × ${a} × ${t} = ${(a * t) / 2} cm².`);
};
const sdAverage: LGen = (level) => {
  if (level < 3) return null;
  const n = pick([4, 5]);
  const vals = Array.from({ length: n }, () => ri(4, 10) * 10 + pick([0, 5]));
  const avg = vals.reduce((s, v) => s + v, 0) / n;
  if (!Number.isInteger(avg)) return sdAverage(level);
  return mkNum(`Rata-rata dari nilai ${vals.join(", ")} adalah …`, avg, [avg - 5, avg + 5, avg + 10], `Jumlah = ${vals.reduce((s, v) => s + v, 0)}, dibagi ${n} = ${avg}.`);
};
const sdSequence: LGen = (level) => {
  const start = ri(2, 20);
  const diff = ri(2, 3 + level * 2);
  const seq = [0, 1, 2, 3].map((i) => start + i * diff);
  const ans = start + 4 * diff;
  return mkNum(`Pola bilangan: ${seq.join(", ")}, … Bilangan berikutnya adalah …`, ans, [ans - diff, ans + diff, ans + 1], `Polanya selalu +${diff}, jadi berikutnya ${seq[3]} + ${diff} = ${ans}.`);
};
const sdWordProblem: LGen = (level) => {
  if (level < 2) return null;
  const name = pick(NAMES);
  const item = pick(ITEMS_ID);
  const qty = ri(2, 6 + level * 2);
  const price = pick([500, 1000, 1500, 2000, 2500, 3000, 5000]) * (level >= 4 ? ri(1, 4) : 1);
  if (Math.random() < 0.5) {
    return mkNum(`${name} membeli ${qty} ${item} dengan harga Rp${fmt(price)} per buah. Total yang harus dibayar adalah …`, qty * price, [qty * price - price, qty * price + price, (qty + 1) * price], `${qty} × Rp${fmt(price)} = Rp${fmt(qty * price)}.`);
  }
  const money = pick([20000, 50000, 100000]);
  const total = qty * price;
  if (total >= money) return sdWordProblem(level);
  return mkNum(`${name} membeli ${qty} ${item} seharga Rp${fmt(price)} per buah dan membayar dengan Rp${fmt(money)}. Kembaliannya adalah …`, money - total, [money - total + price, money - total - 1000, total], `Total belanja ${qty}×${fmt(price)} = Rp${fmt(total)}. Kembalian = ${fmt(money)} − ${fmt(total)} = Rp${fmt(money - total)}.`);
};
const sdEngPast: LGen = () => {
  const v = pick(EN_PAST);
  const name = pick(["Sinta", "Budi", "Rina", "Andi", "Dewi", "Rafi"]);
  const places: readonly (readonly [string, string])[] = [
    ["go", "to school"], ["eat", "breakfast at home"], ["drink", "a glass of milk"], ["read", "a story book"],
    ["write", "a letter"], ["see", "a rainbow"], ["buy", "new shoes"], ["swim", "in the pool"], ["sleep", "early last night"],
  ];
  const scene = places.find((p) => p[0] === v[0]);
  const tail = scene ? scene[1] : "yesterday";
  const wrong = sample(EN_PAST.filter((p) => p[1] !== v[1]), 3).map((p) => p[1]);
  return mkq(`Yesterday, ${name} ___ ${tail}. (kata kerja: ${v[0]})`, v[1], wrong, `Bentuk lampau (past tense) dari “${v[0]}” adalah “${v[1]}”.`);
};
const SD_SAINS_PAIRS: readonly (readonly [string, string])[] = [
  ["Akar", "Menyerap air dan zat hara dari tanah"], ["Daun", "Tempat fotosintesis / membuat makanan"],
  ["Batang", "Menopang tumbuhan & menyalurkan air dan makanan"], ["Bunga", "Alat perkembangbiakan tumbuhan"],
  ["Jantung", "Memompa darah ke seluruh tubuh"], ["Paru-paru", "Tempat pertukaran oksigen dan karbon dioksida"],
  ["Otak", "Mengatur pikiran dan seluruh kegiatan tubuh"], ["Lambung", "Mencerna makanan secara kimiawi"],
  ["Hati", "Menetralkan racun dan menghasilkan empedu"], ["Ginjal", "Menyaring darah dan membentuk urine"],
  ["Kulit", "Melindungi tubuh & indera peraba"], ["Tulang", "Menopang dan melindungi organ tubuh"],
];
const SD_SAINS_CLASSIFY = [
  ...["Kupu-kupu", "Katak", "Nyamuk", "Lalat"].map((x) => ({ item: x, cat: "Metamorfosis sempurna" })),
  ...["Belalang", "Kecoa", "Capung", "Jangkrik"].map((x) => ({ item: x, cat: "Metamorfosis tidak sempurna" })),
  ...["Ayam", "Kucing", "Ikan", "Ular"].map((x) => ({ item: x, cat: "Tidak bermetamorfosis" })),
] as const;
const SD_SAINS_FACTS: readonly Fact[] = [
  ["Perubahan wujud benda dari cair menjadi gas disebut …", "Menguap", ["Membeku", "Mencair", "Mengembun"], "Cair → gas = menguap (evaporasi)."],
  ["Perubahan wujud benda dari gas menjadi cair disebut …", "Mengembun", ["Menguap", "Membeku", "Menyublim"], "Gas → cair = mengembun, contohnya embun di pagi hari."],
  ["Perubahan wujud benda dari padat menjadi cair disebut …", "Mencair", ["Membeku", "Menguap", "Mengembun"], "Padat → cair = mencair, misalnya es menjadi air."],
  ["Sumber energi utama bagi kehidupan di Bumi adalah …", "Matahari", ["Bulan", "Bintang", "Api"], "Matahari adalah sumber energi utama di Bumi."],
  ["Gaya yang menyebabkan buah jatuh ke tanah adalah gaya …", "Gravitasi", ["Gesek", "Magnet", "Otot"], "Gravitasi Bumi menarik benda ke bawah."],
  ["Planet yang paling dekat dengan Matahari adalah …", "Merkurius", ["Venus", "Bumi", "Mars"], "Urutan: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus."],
  ["Planet tempat kita tinggal adalah …", "Bumi", ["Mars", "Venus", "Jupiter"], "Bumi adalah planet ketiga dari Matahari dan tempat tinggal kita."],
  ["Planet terbesar di tata surya adalah …", "Jupiter", ["Saturnus", "Neptunus", "Uranus"], "Jupiter adalah planet raksasa terbesar."],
  ["Benda langit yang memancarkan cahaya sendiri adalah …", "Bintang", ["Planet", "Bulan", "Komet"], "Bintang memancarkan cahaya sendiri; planet memantulkan cahaya bintang."],
  ["Alat untuk mengukur suhu adalah …", "Termometer", ["Barometer", "Amperemeter", "Dinamometer"], "Termometer mengukur suhu; barometer tekanan udara; amperemeter kuat arus."],
];
const planetGen: LGen = () => {
  const planets = ["Merkurius", "Venus", "Bumi", "Mars", "Jupiter", "Saturnus", "Uranus", "Neptunus"];
  const i = ri(0, planets.length - 1);
  const name = planets[i] as string;
  if (Math.random() < 0.5) {
    return mkq(`Planet yang berada tepat SETELAH ${name} (menjauhi Matahari) adalah …`, planets[i + 1] ?? "Tidak ada, ia planet terakhir", sample(planets.filter((p) => p !== planets[i + 1]), 3), `Urutan planet: ${planets.join(" – ")}.`);
  }
  return mkq(`Planet urutan ke-${i + 1} dari Matahari adalah …`, name, sample(planets.filter((p) => p !== name), 3), `Urutan planet dari Matahari: ${planets.join(" – ")}.`);
};
const INF_CLASSIFY = [
  ...["Keyboard", "Mouse", "Scanner", "Mikrofon", "Kamera web", "Layar sentuh"].map((x) => ({ item: x, cat: "Perangkat input" })),
  ...["Monitor", "Printer", "Speaker", "Proyektor", "Headphone"].map((x) => ({ item: x, cat: "Perangkat output" })),
  ...["CPU / Prosesor", "RAM", "Motherboard"].map((x) => ({ item: x, cat: "Perangkat proses" })),
  ...["Harddisk", "SSD", "Flashdisk", "Kartu memori"].map((x) => ({ item: x, cat: "Perangkat penyimpanan" })),
  ...["Microsoft Word", "Paint", "Google Chrome", "Kalkulator (aplikasi)", "Game edukasi"].map((x) => ({ item: x, cat: "Perangkat lunak (software)" })),
] as const;
const PAI_ORDER_GEN: LGen = (level) => {
  const useIman = Math.random() < 0.5;
  const list = useIman ? RUKUN_IMAN : RUKUN_ISLAM;
  const idx = ri(0, list.length - 1);
  const ans = list[idx] as string;
  return mkq(`${useIman ? "Rukun iman" : "Rukun Islam"} yang ke-${idx + 1} adalah …`, ans, sample(list.filter((x) => x !== ans), 3), `Urutan ${useIman ? "rukun iman" : "rukun Islam"}: ${list.join("; ")}.`);
};
const rakaatGen: LGen = () => {
  const r = pick(RAKAAT);
  return mkq(`Salat ${r[0]} berjumlah … rakaat`, r[1], sample(["2", "3", "4", "5"].filter((x) => x !== r[1]), 3), `Salat ${r[0]} dikerjakan ${r[1]} rakaat. (Subuh 2, Zuhur 4, Asar 4, Magrib 3, Isya 4 — total 17 rakaat sehari.)`);
};
const bulanGen: LGen = (level) => {
  if (level < 2) return null;
  const idx = ri(0, BULAN_HIJRIAH.length - 1);
  const ans = BULAN_HIJRIAH[idx] as string;
  return mkq(`Bulan Hijriah urutan ke-${idx + 1} adalah …`, ans, sample(BULAN_HIJRIAH.filter((x) => x !== ans), 3), `Urutan bulan Hijriah: ${BULAN_HIJRIAH.join(", ")}.`);
};

/* ---------- SMP ---------- */
const smpEquation: LGen = (level) => {
  const a = ri(2, 3 + level);
  const x = ri(2, 12);
  const b = ri(1, 15);
  const c = a * x + b;
  return mkNum(`Jika ${a}x + ${b} = ${c}, maka nilai x adalah …`, x, [x - 1, x + 1, x + 2], `${a}x = ${c} − ${b} = ${c - b}, jadi x = ${c - b} : ${a} = ${x}.`);
};
const smpNegOps: LGen = (level) => {
  const a = ri(2, 6 + level * 2);
  const b = ri(2, 6 + level);
  const mode = ri(0, 2);
  if (mode === 0) return mkNum(`Hasil dari (−${a}) × ${b} adalah …`, -a * b, [a * b, -a * b + a, -a * b - b], `Negatif × positif = negatif: (−${a})×${b} = ${-a * b}.`);
  if (mode === 1) return mkNum(`Hasil dari (−${a})² adalah …`, a * a, [-a * a, 2 * a, a * a + a], `(−${a})² = (−${a})×(−${a}) = ${a * a} (negatif × negatif = positif).`);
  return mkNum(`Hasil dari ${a} − (−${b}) adalah …`, a + b, [a - b, -(a + b), a + b + 1], `Mengurangi bilangan negatif sama dengan menambah: ${a} − (−${b}) = ${a} + ${b} = ${a + b}.`);
};
const smpSequence: LGen = (level) => {
  const a = ri(2, 15);
  const d = ri(2, 4 + level);
  const n = ri(6, 12);
  const un = a + (n - 1) * d;
  return mkNum(`Suku ke-${n} barisan aritmetika ${a}, ${a + d}, ${a + 2 * d}, … adalah …`, un, [un - d, un + d, a + n * d], `Un = a + (n−1)b = ${a} + ${n - 1}×${d} = ${un}.`);
};
const smpGradient: LGen = (level) => {
  if (level < 3) return null;
  const x1 = ri(0, 4);
  const y1 = ri(0, 6);
  const m = ri(1, 4);
  const dx = ri(2, 5);
  const x2 = x1 + dx;
  const y2 = y1 + m * dx;
  return mkNum(`Gradien garis yang melalui titik (${x1}, ${y1}) dan (${x2}, ${y2}) adalah …`, m, [m + 1, Math.max(1, m - 1), m + 2], `m = (y₂−y₁)/(x₂−x₁) = (${y2}−${y1})/(${x2}−${x1}) = ${m * dx}/${dx} = ${m}.`);
};
const smpProbability: LGen = (level) => {
  if (level < 2) return null;
  if (Math.random() < 0.5) {
    const faces = [1, 2, 3, 4, 5, 6];
    const primes = faces.filter(isPrime);
    return mkq("Sebuah dadu dilempar satu kali. Peluang muncul mata dadu prima adalah …", `${primes.length}/6 = 1/2`, ["1/6", "1/3", "2/3"], `Mata dadu prima: ${primes.join(", ")} → ${primes.length} dari 6 kemungkinan = 1/2.`);
  }
  const red = ri(2, 6);
  const blue = ri(2, 6);
  const total = red + blue;
  const g = gcd(red, total);
  return mkq(`Dalam kantong ada ${red} kelereng merah dan ${blue} kelereng biru. Peluang mengambil satu kelereng merah adalah …`, `${red / g}/${total / g}`, [`${red}/${total + 2}`, `${blue}/${total}`, `${red + 1}/${total}`], `Peluang = jumlah merah : total = ${red} : ${total} = ${red / g}/${total / g}.`);
};
const smpScale: LGen = (level) => {
  if (level < 2) return null;
  const scale = pick([100000, 200000, 250000, 500000, 1000000]);
  const cm = ri(2, 9);
  const km = (cm * scale) / 100000;
  return mkNum(`Peta berskala 1 : ${fmt(scale)}. Jarak dua tempat pada peta ${cm} cm. Jarak sebenarnya adalah … km`, km, [km / 2, km * 2, km + 5], `${cm} × ${fmt(scale)} cm = ${fmt(cm * scale)} cm = ${km} km.`);
};
const SMP_SAINS_FACTS: readonly Fact[] = [
  ["Organel sel yang berfungsi sebagai tempat respirasi penghasil energi adalah …", "Mitokondria", ["Ribosom", "Nukleus", "Vakuola"], "Mitokondria = “powerhouse of the cell”, menghasilkan ATP."],
  ["Persamaan umum fotosintesis adalah …", "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", ["C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", "CO₂ + O₂ → C₆H₁₂O₆", "6O₂ + 6H₂O → C₆H₁₂O₆ + CO₂"], "Fotosintesis: CO₂ + air —(cahaya & klorofil)→ glukosa + oksigen."],
  ["pH larutan yang bersifat asam adalah …", "pH < 7", ["pH = 7", "pH > 7", "pH = 14"], "Asam: pH<7, netral: 7, basa: pH>7."],
  ["Perpindahan panas tanpa melalui zat perantara disebut …", "Radiasi", ["Konduksi", "Konveksi", "Isolasi"], "Radiasi: panas matahari sampai ke Bumi tanpa medium."],
  ["Satuan SI untuk kuat arus listrik adalah …", "Ampere", ["Volt", "Ohm", "Watt"], "Kuat arus = Ampere; tegangan = Volt; hambatan = Ohm; daya = Watt."],
  ["Satuan SI untuk gaya adalah …", "Newton", ["Joule", "Pascal", "Watt"], "Gaya diukur dalam Newton (N); energi Joule; tekanan Pascal; daya Watt."],
  ["Zat hijau daun yang menangkap cahaya untuk fotosintesis adalah …", "Klorofil", ["Hemoglobin", "Melanin", "Karoten"], "Klorofil memberi warna hijau dan menangkap energi cahaya."],
  ["Campuran yang serba sama (tidak dapat dibedakan bagiannya) disebut campuran …", "Homogen", ["Heterogen", "Suspensi", "Koloid kasar"], "Campuran homogen tercampur merata, contohnya air gula."],
];
const smpPhysics: LGen = (level) => {
  const kind = ri(0, 2);
  if (kind === 0) {
    const m = ri(2, 4 + level * 2);
    const a = ri(2, 9);
    return mkNum(`Benda bermassa ${m} kg dipercepat ${a} m/s². Gaya yang bekerja adalah … N`, m * a, [m + a, m * a + m, m * a - a], `Hukum II Newton: F = m × a = ${m} × ${a} = ${m * a} N.`);
  }
  if (kind === 1) {
    const s = pick([60, 80, 100, 120, 150, 200, 240, 300]);
    const t = pick([2, 3, 4, 5, 6, 10]);
    const v = s / t;
    if (!Number.isInteger(v)) return smpPhysics(level);
    return mkNum(`Sebuah mobil menempuh jarak ${s} m dalam ${t} detik. Kecepatan rata-ratanya adalah … m/s`, v, [v + 2, v - 2, v * 2], `v = s : t = ${s} : ${t} = ${v} m/s.`);
  }
  const m = ri(2, 20 + level * 10);
  const vol = pick([2, 4, 5, 10]);
  const rho = m / vol;
  if (!Number.isInteger(rho)) return smpPhysics(level);
  return mkNum(`Benda bermassa ${m} kg bervolume ${vol} m³. Massa jenisnya adalah … kg/m³`, rho, [rho + 1, rho * 2, Math.max(1, rho - 1)], `ρ = m : V = ${m} : ${vol} = ${rho} kg/m³.`);
};
const phGen: LGen = (level) => {
  if (level < 3) return null;
  const ph = ri(1, 14);
  const cat = ph < 7 ? "Asam" : ph === 7 ? "Netral" : "Basa";
  return mkq(`Larutan dengan pH = ${ph} bersifat …`, cat, ["Asam", "Netral", "Basa"].filter((c) => c !== cat), `pH < 7 asam, pH = 7 netral, pH > 7 basa. pH ${ph} → ${cat.toLowerCase()}.`);
};
const binaryGen: LGen = (level) => {
  const bits = level >= 4 ? ri(4, 6) : level >= 2 ? ri(3, 4) : 3;
  let bin = "1";
  for (let i = 1; i < bits; i++) bin += Math.random() < 0.5 ? "0" : "1";
  const dec = parseInt(bin, 2);
  return mkNum(`Hasil konversi bilangan biner ${bin} ke desimal adalah …`, dec, [dec - 1, dec + 1, dec + 2], `${bin}₂ = ${bin.split("").reverse().map((b, i) => (b === "1" ? String(2 ** i) : "0")).join(" + ")} = ${dec}.`);
};
const SMP_IPS_PAIRS: readonly (readonly [string, string])[] = [
  ["Kutai", "Kerajaan Hindu tertua di Indonesia (dibuktikan Prasasti Yupa)"], ["Sriwijaya", "Kerajaan Buddha maritim berpusat di Palembang"],
  ["Majapahit", "Kerajaan besar berpusat di Jawa Timur, patihnya Gajah Mada"], ["Tarumanegara", "Kerajaan Hindu di Jawa Barat, rajanya Purnawarman"],
  ["Demak", "Kesultanan Islam pertama di Jawa"], ["Mataram Kuno", "Kerajaan yang membangun Candi Borobudur & Prambanan"],
];
const EVENT_YEAR: readonly (readonly [string, string])[] = [
  ["Peristiwa Rengasdengklok", "16 Agustus 1945"], ["Proklamasi Kemerdekaan Indonesia", "17 Agustus 1945"],
  ["Sumpah Pemuda", "28 Oktober 1928"], ["Hari Kebangkitan Nasional (berdirinya Budi Utomo)", "20 Mei 1908"],
  ["Sidang PPKI mengesahkan UUD 1945", "18 Agustus 1945"], ["Perang Diponegoro", "1825–1830"],
  ["Berdirinya VOC", "1602"], ["Sistem Tanam Paksa (Cultuurstelsel) dimulai", "1830"],
  ["Jepang mulai menduduki Indonesia", "1942"], ["Konferensi Meja Bundar", "1949"],
  ["Dekrit Presiden kembali ke UUD 1945", "5 Juli 1959"], ["Awal Reformasi (Soeharto lengser)", "21 Mei 1998"],
];
const LEMBAGA: readonly (readonly [string, string])[] = [
  ["MPR", "Mengubah dan menetapkan UUD, melantik Presiden/Wakil Presiden"], ["DPR", "Membuat undang-undang bersama Presiden, fungsi legislasi, anggaran, pengawasan"],
  ["DPD", "Mengajukan & membahas RUU terkait otonomi daerah"], ["Presiden", "Memegang kekuasaan pemerintahan (eksekutif)"],
  ["Mahkamah Agung", "Kekuasaan kehakiman tertinggi, mengadili pada tingkat kasasi"], ["Mahkamah Konstitusi", "Menguji undang-undang terhadap UUD & memutus sengketa kewenangan lembaga negara"],
  ["BPK", "Memeriksa pengelolaan dan tanggung jawab keuangan negara"], ["KPK", "Memberantas tindak pidana korupsi"],
  ["Komisi Yudisial", "Mengusulkan pengangkatan hakim agung & menjaga kehormatan hakim"], ["KPU", "Menyelenggarakan pemilihan umum"],
];

/* ---------- SMA ---------- */
const smaDerivative: LGen = (level) => {
  const a = ri(1, 2 + level);
  const b = ri(1, 9);
  const c = ri(1, 9);
  if (level >= 4 && Math.random() < 0.5) {
    const x0 = ri(1, 4);
    const val = 2 * a * x0 + b;
    return mkNum(`Jika f(x) = ${a}x² + ${b}x + ${c}, maka f'(${x0}) adalah …`, val, [val - b, val + 2, 2 * a + b], `f'(x) = ${2 * a}x + ${b}; f'(${x0}) = ${2 * a}×${x0} + ${b} = ${val}.`);
  }
  return mkq(`Jika f(x) = ${a}x² − ${b}x + ${c}, maka f'(x) adalah …`, `${2 * a}x − ${b}`, [`${a}x − ${b}`, `${2 * a}x + ${c}`, `${2 * a}x − ${b + 1}`], `Turunan: d/dx(${a}x²)=${2 * a}x, d/dx(−${b}x)=−${b}, konstanta→0.`);
};
const smaLimit: LGen = () => {
  const a = ri(2, 9);
  return mkNum(`Nilai lim (x→${a}) (x² − ${a * a})/(x − ${a}) adalah …`, 2 * a, [a, 2 * a - 1, a * a], `(x²−${a * a}) = (x−${a})(x+${a}); sederhanakan → x+${a}; x=${a} → ${2 * a}.`);
};
const smaLog: LGen = (level) => {
  const base = pick([2, 3, 5, 10]);
  const e1 = ri(1, 3);
  const e2 = ri(1, 3);
  const sum = e1 + e2;
  return mkNum(`Nilai dari ${base}log ${base ** e1} + ${base}log ${base ** e2} adalah …`, sum, [sum - 1, sum + 1, e1 * e2], `${base}log ${base ** e1} = ${e1} dan ${base}log ${base ** e2} = ${e2}; jumlahnya ${sum}.`);
};
const smaSeries: LGen = (level) => {
  const a = ri(2, 12);
  const d = ri(2, 3 + level);
  const n = ri(8, 15);
  const un = a + (n - 1) * d;
  if (level >= 3 && Math.random() < 0.5) {
    const sn = (n / 2) * (a + un);
    return mkNum(`Jumlah ${n} suku pertama deret aritmetika ${a}, ${a + d}, ${a + 2 * d}, … adalah …`, sn, [sn - d * n, un * n, sn + a * n], `Un = ${a}+${n - 1}×${d} = ${un}; Sn = n/2 × (a+Un) = ${n}/2 × ${a + un} = ${sn}.`);
  }
  return mkNum(`Suku ke-${n} barisan aritmetika ${a}, ${a + d}, ${a + 2 * d}, … adalah …`, un, [un - d, un + d, a + n * d], `Un = a + (n−1)b = ${a} + ${n - 1}×${d} = ${un}.`);
};
const smaCombination: LGen = (level) => {
  if (level < 3) return null;
  const n = ri(6, 10);
  const r = pick([2, 3]);
  const comb = r === 2 ? (n * (n - 1)) / 2 : (n * (n - 1) * (n - 2)) / 6;
  return mkNum(`Dari ${n} siswa dipilih ${r} orang pengurus (urutan tidak penting). Banyak cara memilih adalah …`, comb, [comb - n, n * (n - 1), comb + n], `Kombinasi C(${n},${r}) = ${comb} cara.`);
};
const smaPhysics: LGen = (level) => {
  const kind = ri(0, 3);
  if (kind === 0) {
    const v0 = ri(2, 15);
    const a = ri(1, 4);
    const t = ri(2, 6);
    return mkNum(`Mobil bergerak dengan kecepatan awal ${v0} m/s dan percepatan ${a} m/s² selama ${t} s. Kecepatan akhirnya … m/s`, v0 + a * t, [v0 + a * t - a, v0 * a, v0 + t], `v = v₀ + at = ${v0} + ${a}×${t} = ${v0 + a * t} m/s.`);
  }
  if (kind === 1) {
    const m = pick([1, 2, 4, 5]);
    const v = ri(3, 6 + level);
    return mkNum(`Energi kinetik benda bermassa ${m} kg yang bergerak dengan kecepatan ${v} m/s adalah … J`, 0.5 * m * v * v, [m * v, 0.5 * m * v, m * v * v], `Ek = ½mv² = ½×${m}×${v}² = ${0.5 * m * v * v} J.`);
  }
  if (kind === 2) {
    const r1 = pick([2, 3, 4, 6]);
    const r2 = pick([2, 3, 6]);
    if (r1 === r2) return smaPhysics(level);
    const rp = (r1 * r2) / (r1 + r2);
    if (!Number.isInteger(rp)) return smaPhysics(level);
    return mkNum(`Hambatan ${r1} Ω dan ${r2} Ω dirangkai paralel. Hambatan penggantinya … Ω`, rp, [r1 + r2, rp + 1, Math.max(1, rp - 1)], `1/R = 1/${r1} + 1/${r2} → R = ${rp} Ω.`);
  }
  const lam = ri(2, 8);
  const f = ri(5, 40) * 10;
  return mkNum(`Gelombang dengan panjang gelombang ${lam} m dan frekuensi ${f} Hz memiliki cepat rambat … m/s`, lam * f, [lam + f, lam * f / 2, f], `v = λ × f = ${lam} × ${f} = ${lam * f} m/s.`);
};
const smaChemistryPh: LGen = (level) => {
  if (level < 2) return null;
  const n = ri(1, Math.min(6, level + 2));
  if (Math.random() < 0.5) return mkNum(`pH larutan HCl 10⁻${n} M (0,${"0".repeat(Math.max(0, n - 1))}1 M) adalah …`, n, [n + 1, Math.max(1, n - 1), 14 - n], `HCl asam kuat: [H⁺] = 10⁻${n} → pH = ${n}.`);
  return mkNum(`pH larutan NaOH 10⁻${n} M adalah …`, 14 - n, [n, 14 - n - 1, 14 - n + 1], `NaOH basa kuat: pOH = ${n}, pH = 14 − ${n} = ${14 - n}.`);
};
const smaGenetics: LGen = (level) => {
  if (level < 2) return null;
  const crosses: readonly (readonly [string, string, string])[] = [
    ["Aa × Aa", "3 : 1", "Persilangan monohibrid sesama heterozigot menghasilkan fenotipe dominan : resesif = 3 : 1."],
    ["Aa × aa", "1 : 1", "Testcross Aa × aa menghasilkan fenotipe dominan : resesif = 1 : 1."],
    ["AA × aa", "Semua dominan (100%)", "Semua keturunan bergenotipe Aa sehingga berfenotipe dominan semua."],
    ["Aa × Aa (genotipe)", "1 AA : 2 Aa : 1 aa", "Perbandingan genotipe monohibrid Aa × Aa adalah 1 : 2 : 1."],
  ];
  const c = pick(crosses);
  const others = crosses.filter((x) => x[1] !== c[1]).map((x) => x[1]);
  return mkq(`Persilangan monohibrid ${c[0]} menghasilkan perbandingan ${c[0].includes("genotipe") ? "genotipe" : "fenotipe dominan : resesif"} = …`, c[1], sample(others, 3), c[2]);
};
const OSI_PAIRS: readonly (readonly [string, string])[] = [
  ["Physical (Layer 1)", "Mengirim bit mentah melalui media fisik (kabel, sinyal)"], ["Data Link (Layer 2)", "Pengiriman frame antarperangkat satu jaringan & deteksi error"],
  ["Network (Layer 3)", "Pengalamatan IP dan routing antarjaringan"], ["Transport (Layer 4)", "Pengiriman data end-to-end (TCP/UDP), segmentasi & keandalan"],
  ["Session (Layer 5)", "Membuka, mengelola, dan menutup sesi komunikasi"], ["Presentation (Layer 6)", "Enkripsi, kompresi, dan format data"],
  ["Application (Layer 7)", "Antarmuka layanan jaringan untuk aplikasi (HTTP, FTP, SMTP)"],
];
const ATTACK_PAIRS: readonly (readonly [string, string])[] = [
  ["Phishing", "Penipuan untuk mencuri data sensitif lewat pesan/situs palsu"], ["DDoS", "Membanjiri server dengan lalu lintas palsu hingga lumpuh"],
  ["Ransomware", "Malware yang mengenkripsi data dan meminta tebusan"], ["Sniffing", "Mengintip lalu lintas data di jaringan"],
  ["SQL Injection", "Menyisipkan perintah SQL jahat lewat input aplikasi"], ["Spoofing", "Menyamar sebagai pihak tepercaya untuk menipu sistem/korban"],
];
const CAM_SCI_PAIRS: readonly (readonly [string, string])[] = [
  ["Leaf", "Makes food for the plant by photosynthesis"], ["Root", "Absorbs water and minerals from the soil"],
  ["Stem", "Supports the plant and transports water and food"], ["Flower", "The reproductive part of the plant"],
  ["Gravity", "The force that pulls objects towards the Earth"], ["Friction", "The force that opposes motion between surfaces"],
  ["Newton (N)", "The unit of force"], ["Joule (J)", "The unit of energy"], ["Watt (W)", "The unit of power"],
];
const camMath: LGen = (level) => {
  const kind = ri(0, 2);
  if (kind === 0) {
    const a = ri(3, 9 + level * 2);
    const b = ri(3, 12);
    return mkNum(`What is ${a} × ${b}?`, a * b, [a * b - a, a * b + b, a * b + 10], `${a} × ${b} = ${a * b}.`);
  }
  if (kind === 1) {
    const pct = pick([10, 20, 25, 50, 75]);
    const base = pick([100, 200, 240, 400, 80, 120]);
    const v = (pct * base) / 100;
    return mkNum(`What is ${pct}% of ${base}?`, v, [v + 5, v - 5, v * 2], `${pct}% × ${base} = ${v}.`);
  }
  const start = ri(2, 15);
  const diff = ri(2, 3 + level);
  const seq = [0, 1, 2, 3].map((i) => start + i * diff);
  const ans = start + 4 * diff;
  return mkNum(`Next in the sequence: ${seq.join(", ")}, …`, ans, [ans - diff, ans + diff, ans + 1], `Each term increases by ${diff}: ${seq[3]} + ${diff} = ${ans}.`);
};
const fikihZakat: LGen = (level) => {
  if (level < 3) return null;
  const amount = pick([10000000, 20000000, 40000000, 50000000, 80000000, 100000000]);
  const zakat = amount * 0.025;
  return mkNum(`Harta perdagangan Pak Haji mencapai Rp${fmt(amount)} dan sudah mencapai nisab serta haul. Zakat yang wajib dikeluarkan (2,5%) adalah …`, zakat, [amount * 0.05, amount * 0.1, zakat / 2], `Zakat = 2,5% × Rp${fmt(amount)} = Rp${fmt(zakat)}.`);
};
const khalifahGen: LGen = () => {
  const list = ["Abu Bakar As-Siddiq", "Umar bin Khattab", "Utsman bin Affan", "Ali bin Abi Thalib"] as const;
  const idx = ri(0, 3);
  const ans = list[idx] as string;
  return mkq(`Khalifah Khulafaur Rasyidin urutan ke-${idx + 1} adalah …`, ans, sample(list.filter((x) => x !== ans), 3), `Urutan Khulafaur Rasyidin: Abu Bakar, Umar, Utsman, Ali.`);
};

export const SURAH_ARTI: readonly (readonly [string, string])[] = [
  ["Al-Fatihah", "Pembukaan"], ["Al-Ikhlas", "Ikhlas / mengesakan Allah"], ["Al-Falaq", "Waktu subuh"],
  ["An-Nas", "Manusia"], ["Al-Kautsar", "Nikmat yang banyak"], ["Al-'Asr", "Masa / waktu"],
  ["Al-Fil", "Gajah"], ["Quraisy", "Suku Quraisy"], ["Al-Ma'un", "Barang-barang yang berguna"],
  ["An-Nashr", "Pertolongan"], ["Al-Kafirun", "Orang-orang kafir"], ["Al-Lahab", "Sabut api yang menyala"],
  ["Yasin", "Surah ke-36, disebut jantung Al-Qur'an"], ["Al-Mulk", "Kerajaan / kekuasaan Allah"],
  ["Ar-Rahman", "Yang Maha Pengasih"], ["Al-Kahfi", "Gua (kisah pemuda penghuni gua)"],
];
export const HADIS_CLASS: readonly (readonly [string, string])[] = [
  ["Mutawatir", "Diriwayatkan perawi sangat banyak di setiap tingkatan, mustahil bersepakat dusta"],
  ["Ahad", "Diriwayatkan perawi yang jumlahnya tidak mencapai mutawatir"],
  ["Marfu'", "Hadis yang disandarkan kepada Nabi Muhammad SAW"],
  ["Mauquf", "Hadis yang berhenti pada perkataan/perbuatan sahabat"],
  ["Maqthu'", "Hadis yang disandarkan kepada tabi'in"],
  ["Mursal", "Hadis yang gugur sahabatnya dalam sanad (tabi'in langsung dari Nabi)"],
  ["Shahih", "Hadis yang sanadnya bersambung, perawinya adil & kuat hafalan, tanpa cacat"],
  ["Dhaif", "Hadis lemah karena tidak memenuhi syarat shahih"],
];
export const TAFSIR_PAIRS: readonly (readonly [string, string])[] = [
  ["Bil ma'tsur", "Menafsirkan Al-Qur'an dengan Al-Qur'an, hadis, dan perkataan sahabat"],
  ["Bil ra'yi", "Menafsirkan dengan ijtihad akal yang berlandaskan kaidah yang benar"],
  ["Isyari", "Menafsirkan makna batin/isyarat di balik lafaz ayat"],
  ["Ilmi", "Menafsirkan ayat dengan pendekatan ilmu pengetahuan modern"],
  ["Adabi Ijtima'i", "Menafsirkan dengan pendekatan sastra, budaya, dan kemasyarakatan"],
];
export const HAJI_PAIRS: readonly (readonly [string, string])[] = [
  ["Ihram", "Niat memulai haji/umrah dengan pakaian ihram dan larangan tertentu"],
  ["Wukuf", "Berdiam diri di Arafah pada 9 Zulhijah — rukun haji terpenting"],
  ["Tawaf", "Mengelilingi Ka'bah sebanyak tujuh kali putaran"],
  ["Sa'i", "Berlari-lari kecil antara bukit Safa dan Marwah tujuh kali"],
  ["Tahallul", "Mencukur/memotong rambut sebagai tanda selesai ihram"],
  ["Jumrah", "Melempar batu kerikil di Mina pada hari tasyrik"],
  ["Mabit", "Bermalam di Muzdalifah dan Mina pada malam hari tertentu"],
];
export const FARAID_FACTS: readonly Fact[] = [
  ["Dalam faraid, bagian suami bila pewaris mempunyai anak adalah …", "1/4", ["1/2", "1/6", "1/8"], "QS An-Nisa 12: suami mendapat 1/4 bila ada anak; 1/2 bila tidak ada anak."],
  ["Bagian ibu bila pewaris mempunyai anak adalah …", "1/6", ["1/3", "1/4", "1/2"], "Ibu mendapat 1/6 bila pewaris punya anak atau dua saudara lebih; 1/3 bila tidak."],
  ["Bagian seorang anak perempuan tunggal (tanpa anak laki-laki) adalah …", "1/2", ["1/3", "2/3", "1/6"], "Anak perempuan tunggal mendapat 1/2; dua orang atau lebih berbagi 2/3."],
  ["Bagian dua anak perempuan atau lebih (tanpa anak laki-laki) adalah …", "2/3", ["1/2", "1/3", "3/4"], "Dua anak perempuan atau lebih bersama-sama mendapat 2/3."],
  ["Ilmu yang mempelajari pembagian harta warisan dalam Islam disebut …", "Faraid / ilmu mawaris", ["Tajwid", "Mustalah", "Balaghah"], "Faraid mengatur bagian ahli waris sesuai Al-Qur'an dan hadis."],
];
export const fikihFacts2: readonly Fact[] = [
  ["Pengganti wudu/ mandi wajib dengan debu yang suci ketika tidak ada air disebut …", "Tayamum", ["Istinja", "Masah", "Ghusl"], "Tayamum memakai debu suci (QS Al-Maidah: 6)."],
  ["Urutan rukun wudu yang benar setelah membasuh wajah adalah …", "Membasuh kedua tangan sampai siku", ["Mengusap kepala", "Membasuh kaki", "Berkumur saja"], "Rukun wudu: wajah → tangan sampai siku → usap kepala → kaki → tertib."],
  ["Benda najis yang berasal dari bangkai, darah, dan babi termasuk najis …", "Mutawassithah (sedang)", ["Mukhaffafah (ringan)", "Mughallazhah (berat)", "Ma'fu (dimaafkan)"], "Najis sedang: darah, nanah, bangkai. Mughallazhah: anjing & babi."],
  ["Air kencing bayi laki-laki di bawah 2 tahun yang hanya minum ASI termasuk najis …", "Mukhaffafah (ringan)", ["Mughallazhah (berat)", "Mutawassithah (sedang)", "Bukan najis"], "Cara menyucikannya cukup memercikkan air."],
  ["Salat Jumat hukumnya bagi laki-laki muslim yang memenuhi syarat adalah …", "Wajib (fardu ain)", ["Sunah muakadah", "Fardu kifayah", "Makruh"], "Salat Jumat fardu ain bagi laki-laki (QS Al-Jumu'ah: 9)."],
];

/* ---------- registry ---------- */
const paiFactsSD: readonly Fact[] = [
  ["Sumber hukum Islam yang pertama adalah …", "Al-Qur'an", ["Hadis", "Ijma'", "Qiyas"], "Urutan sumber hukum: Al-Qur'an, Hadis, Ijma', Qiyas."],
  ["Malaikat yang bertugas menyampaikan wahyu adalah …", "Jibril", ["Mikail", "Izrail", "Israfil"], "Jibril menyampaikan wahyu; Mikail rezeki & hujan; Izrail nyawa; Israfil sangkakala."],
  ["Nabi pertama adalah Nabi …", "Adam AS", ["Nuh AS", "Ibrahim AS", "Muhammad SAW"], "Nabi Adam adalah nabi dan manusia pertama."],
  ["Peristiwa turunnya wahyu pertama terjadi di …", "Gua Hira", ["Gua Tsur", "Ka'bah", "Masjid Nabawi"], "Wahyu pertama (Al-'Alaq 1–5) turun di Gua Hira."],
  ["Salat wajib dalam sehari semalam berjumlah … waktu", "5 waktu", ["3 waktu", "4 waktu", "7 waktu"], "Salat wajib: Subuh, Zuhur, Asar, Magrib, Isya."],
];
const fikihFacts: readonly Fact[] = [
  ["Air yang suci dan dapat menyucikan disebut air …", "Mutlak", ["Mustakmal", "Najis", "Mukhalit"], "Air mutlak suci & menyucikan: hujan, sumur, sungai, embun."],
  ["Hal yang membatalkan puasa adalah …", "Makan dengan sengaja", ["Tidur siang", "Mandi", "Menangis"], "Makan/minum dengan sengaja membatalkan puasa."],
  ["Zakat fitrah dibayarkan pada bulan …", "Ramadan menjelang Idulfitri", ["Syawal setelah lebaran", "Muharam", "Zulhijah"], "Zakat fitrah ditunaikan di Ramadan sebelum salat Idulfitri."],
  ["Salat yang hukumnya fardu kifayah adalah salat …", "Jenazah", ["Zuhur", "Rawatib", "Duha"], "Salat jenazah fardu kifayah: gugur bila sebagian muslim sudah melakukannya."],
  ["Puasa yang hukumnya haram dilakukan adalah puasa pada …", "Hari raya Idulfitri & Iduladha", ["Senin–Kamis", "Ayyamul bidh", "Asyura"], "Diharamkan puasa pada dua hari raya dan hari tasyrik."],
  ["Membasuh wajah dalam wudu disunahkan sebanyak … kali", "3 kali", ["1 kali", "2 kali", "5 kali"], "Disunahkan membasuh anggota wudu tiga kali."],
];
const qhFacts: readonly Fact[] = [
  ["Surah pertama dalam Al-Qur'an adalah …", "Al-Fatihah", ["Al-Baqarah", "Yasin", "Al-Ikhlas"], "Al-Fatihah adalah surah pembuka (Ummul Kitab)."],
  ["Al-Qur'an terdiri dari … surah", "114 surah", ["99 surah", "110 surah", "120 surah"], "Al-Qur'an terdiri dari 114 surah dan 30 juz."],
  ["Surah terpanjang dalam Al-Qur'an adalah …", "Al-Baqarah (286 ayat)", ["Ali Imran", "An-Nisa", "Al-Maidah"], "Al-Baqarah: 286 ayat, surah terpanjang."],
  ["Surah yang tidak diawali basmalah adalah …", "At-Taubah", ["Al-Fatihah", "Yasin", "Al-Mulk"], "At-Taubah adalah satu-satunya surah tanpa basmalah di awal."],
  ["Hadis “Innamal a'malu binniyat” mengajarkan pentingnya …", "Niat dalam beramal", ["Kekayaan", "Kecepatan", "Kedudukan"], "“Sesungguhnya amal tergantung niatnya” (HR. Bukhari–Muslim)."],
  ["Ilmu yang mempelajari sanad dan matan hadis disebut ilmu …", "Mustalah hadis", ["Tafsir", "Nahwu", "Fiqih"], "Mustalah hadis mengkaji perawi (sanad) dan isi (matan)."],
  ["Hadis yang diriwayatkan banyak perawi di setiap tingkatan disebut hadis …", "Mutawatir", ["Ahad", "Mursal", "Mauquf"], "Mutawatir: perawi sangat banyak, mustahil bersepakat dusta."],
];
const skiFactsSMA: readonly Fact[] = [
  ["Pusat penerjemahan & ilmu pengetahuan masa Abbasiyah adalah …", "Baitul Hikmah di Bagdad", ["Universitas Al-Azhar", "Observatorium Maragha", "Madrasah Nizamiyah"], "Baitul Hikmah (era Al-Ma'mun) menjadi pusat penerjemahan & riset."],
  ["Kejayaan Islam di Andalusia (Spanyol) berpusat di kota …", "Cordoba", ["Sevilla", "Granada", "Toledo"], "Cordoba menjadi ibu kota & pusat ilmu Andalusia masa Umayyah II."],
  ["Perjanjian Hudaibiyah terjadi pada tahun …", "6 Hijriah", ["5 Hijriah", "7 Hijriah", "8 Hijriah"], "Perjanjian Hudaibiyah: 6 H, antara muslim Madinah dan Quraisy Makkah."],
  ["Fathu Makkah (penaklukan damai Makkah) terjadi pada tahun …", "8 Hijriah", ["6 Hijriah", "10 Hijriah", "11 Hijriah"], "Fathu Makkah terjadi Ramadan 8 H."],
];
const kristenFactsAdv: readonly Fact[] = [
  ["Hukum yang terutama menurut Yesus adalah …", "Mengasihi Allah dan mengasihi sesama", ["Rajin bekerja keras", "Menjaga hari Sabat saja", "Memberi persembahan terbesar"], "Matius 22:37–39 — kasih kepada Allah & sesama."],
  ["Raja Israel yang membangun Bait Allah di Yerusalem adalah …", "Salomo", ["Daud", "Saul", "Hizkia"], "Salomo, anak Daud, membangun Bait Allah (1 Raja-raja 6)."],
  ["Hari turunnya Roh Kudus atas para rasul disebut …", "Pentakosta", ["Natal", "Paskah", "Epifani"], "Pentakosta (Kisah Para Rasul 2)."],
  ["Reformasi Gereja oleh Martin Luther dimulai pada tahun …", "1517", ["1417", "1617", "1717"], "31 Oktober 1517: Luther memakukan 95 tesis di Wittenberg."],
  ["“Sola fide, sola gratia, sola scriptura” adalah semboyan gerakan …", "Reformasi Protestan", ["Konsili Trente", "Ortodoks Timur", "Humanisme"], "Tiga sola adalah prinsip utama Reformasi Protestan."],
  ["Surat Paulus yang membahas pembenaran oleh iman secara mendalam adalah Surat …", "Roma", ["Filemon", "Yudas", "3 Yohanes"], "Surat Roma adalah uraian teologis Paulus tentang Injil."],
  ["Jumlah kitab dalam Alkitab Protestan adalah …", "66 kitab (39 PL + 27 PB)", ["73 kitab", "49 kitab", "27 kitab"], "Alkitab Protestan: 66 kitab — Perjanjian Lama 39, Perjanjian Baru 27."],
];
const indoFactsSMP: readonly Fact[] = [
  ["Teks yang bertujuan meyakinkan pembaca agar mengikuti ajakan penulis disebut teks …", "Persuasi", ["Narasi", "Deskripsi", "Eksplanasi"], "Teks persuasi bersifat mengajak/meyakinkan."],
  ["Teks yang menjelaskan proses terjadinya suatu fenomena disebut teks …", "Eksplanasi", ["Narasi", "Persuasi", "Anekdot"], "Eksplanasi menjelaskan proses/fenomena alam atau sosial."],
  ["Makna kata “signifikan” adalah …", "Penting / berarti", ["Cepat", "Mahal", "Sulit"], "Signifikan = penting, berarti, berpengaruh nyata."],
  ["Kalimat yang efektif adalah kalimat yang …", "Hemat kata, jelas, dan sesuai kaidah", ["Sepanjang mungkin", "Memakai banyak kata mubazir", "Selalu diawali kata 'para'"], "Kalimat efektif: hemat, logis, dan padu."],
];
const majasClassify = [
  ...["Angin malam berbisik menyampaikan rindu.", "Ombak menari-nari di tepi pantai.", "Matahari tersenyum menyambut pagi."].map((x) => ({ item: x, cat: "Personifikasi" })),
  ...["Wajahnya bersinar seperti bulan purnama.", "Ia berlari secepat kilat.", "Suaranya merdu bak buluh perindu."].map((x) => ({ item: x, cat: "Simile" })),
  ...["Dia adalah bintang kelas yang selalu bersinar.", "Waktu adalah uang.", "Kampung halamanku, surga kecilku."].map((x) => ({ item: x, cat: "Metafora" })),
  ...["Suaranya menggelegar membelah angkasa.", "Aku sudah meneleponmu sejuta kali!", "Tangisannya membanjiri seluruh ruangan."].map((x) => ({ item: x, cat: "Hiperbola" })),
] as const;

const jawaGens = (jenjang: JenjangId): LGen[] => [
  pairGenL({ pairs: JAWA_KRAMA, askA: (a) => `Basa krama alus saka “${a}” yaiku …`, askB: (b) => `Tembung krama “${b}” iku ngoko/lugu-ne …`, exA: (a, b) => `Krama alus “${a.split(" (")[0]}” yaiku “${b}”.`, exB: (a, b) => `“${b}” iku krama alus saka “${a.split(" (")[0]}”.` }),
  pairGenL({ pairs: JAWA_VOCAB, askA: (a) => `Bahasa Jawa dari “${a}” adalah …`, askB: (b) => `“${b}” artinya …`, exA: (a, b) => `“${a}” dalam Bahasa Jawa: ${b}.`, exB: (a, b) => `${b} artinya “${a}”.` }),
  ...(jenjang !== "TK" ? [pairGenL({ pairs: JAWA_AKSARA, askA: (a) => `Aksara Jawa untuk bunyi “${a}” adalah …`, askB: (b) => `Aksara Jawa “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b} (hanacaraka).`, exB: (a, b) => `${b} dibaca “${a}”.` })] : []),
];

export const GENERATORS: Partial<Record<JenjangId, Record<string, LGen[]>>> = {
  TK: {
    inggris: [pairGenL({ pairs: TK_ENG_PAIRS, askA: (a) => `What is “${a}” in Indonesian? / “${a}” artinya …`, askB: (b) => `Bahasa Inggris dari “${b}” adalah …`, exA: (a, b) => `“${a}” artinya ${b}.`, exB: (a, b) => `“${a}” dalam Bahasa Inggris adalah ${b}.`, four: false }), tkEngArrange, tkCompare],
    matematika: [tkCount, tkAddSub, tkCompare, tkMissing],
    sains: [pairGenL({ pairs: TK_SAINS_PAIRS, askA: (a) => `${a} hidup terutama di …`, askB: (b) => `Hewan yang hidup di ${b.toLowerCase()} adalah …`, exA: (a, b) => `${a} hidup di ${b.toLowerCase()}.`, exB: (a, b) => `Yang hidup di ${b.toLowerCase()} adalah ${a}.`, four: false }), factGenL(TK_SAINS_FACTS, false)],
    pai: [factGenL(TK_PAI_FACTS, false),
      pairGenL({ pairs: MALAIKAT, askA: (a) => `Tugas Malaikat ${a} adalah …`, askB: (b) => `Malaikat yang bertugas “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, b) => `Itu tugas Malaikat ${a}.`, four: false }),
      pairGenL({ pairs: KITAB_NABI, askA: (a) => `Kitab ${a} diturunkan kepada …`, askB: (b) => `Kitab yang diturunkan kepada ${b} adalah …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} menerima kitab ${a}.`, four: false })],
    kristen: [factGenL(TK_KRISTEN_FACTS, false),
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.`, four: false }),
      pairGenL({ pairs: PERAYAAN_KRISTEN, askA: (a) => `Perayaan ${a} memperingati …`, askB: (b) => `Peringatan “${b}” disebut …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu perayaan ${a}.`, four: false })],
    korea: langVocabGensL(KOREA_VOCAB, "Korea", "TK"),
    jepang: [...langVocabGensL(JEPANG_VOCAB, "Jepang", "TK"), pairGenL({ pairs: JEPANG_KANA.slice(0, 15), askA: (a) => `Hiragana untuk bunyi “${a}” adalah …`, askB: (b) => `Hiragana “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b}.`, exB: (a, b) => `${b} dibaca “${a}”.`, four: false })],
    mandarin: langVocabGensL(MANDARIN_VOCAB, "Mandarin", "TK"),
  },
  SD: {
    matematika: [sdAddSub, sdMulDiv, sdMixed, sdFraction, sdFpbKpk, sdGeometry, sdAverage, sdSequence, sdWordProblem],
    inggris: [
      pairGenL({ pairs: EN_VOCAB, askA: (a) => `“${a}” artinya …`, askB: (b) => `Bahasa Inggris dari “${b}” adalah …`, exA: (a, b) => `“${a}” artinya ${b}.`, exB: (a, b) => `“${a}” dalam Bahasa Inggris: ${b}.` }),
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `Kata yang berlawanan arti dengan “${b}” adalah …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Lawan kata ${b} adalah ${a}.` }),
      pairGenL({ pairs: EN_PLURALS, askA: (a) => `The plural of “${a}” is …`, askB: (b) => `Bentuk tunggal dari “${b}” adalah …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} adalah jamak dari ${a}.` }),
      sdEngPast,
    ],
    sains: [
      pairGenL({ pairs: SD_SAINS_PAIRS, askA: (a) => `Fungsi ${a.toLowerCase()} adalah …`, askB: (b) => `Bagian/organ yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, b) => `Yang berfungsi ${b.toLowerCase()} adalah ${a}.` }),
      factGenL(SD_SAINS_FACTS), planetGen,
      classifyGen(SD_SAINS_CLASSIFY.map((x) => ({ item: x.item, cat: x.cat })), (i) => `Hewan ${i} mengalami …`, (i, c) => `${i} termasuk ${c.toLowerCase()}.`),
    ],
    indonesia: [
      pairGenL({ pairs: ANTONIM_ID, askA: (a) => `Antonim (lawan kata) dari “${a}” adalah …`, askB: (b) => `Kata yang berlawanan arti dengan “${b}” adalah …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Lawan kata ${b} adalah ${a}.` }),
      pairGenL({ pairs: SINONIM_ID, askA: (a) => `Sinonim (persamaan kata) dari “${a}” adalah …`, askB: (b) => `Kata yang semakna dengan “${b}” adalah …`, exA: (a, b) => `${a} ≈ ${b}.`, exB: (a, b) => `${b} semakna dengan ${a}.` }),
      pairGenL({ pairs: PERIBAHASA, askA: (a) => `Peribahasa “${a}” artinya …`, askB: (b) => `Peribahasa yang berarti “${b}” adalah …`, exA: (a, b) => `Artinya: ${b}.`, exB: (a, b) => `Peribahasanya: “${a}”.` }),
    ],
    ips: [
      pairGenL({ pairs: PROVINSI_IBUKOTA, askA: (a) => `Ibu kota Provinsi ${a} adalah …`, askB: (b) => `${b} adalah ibu kota Provinsi …`, exA: (a, b) => `Ibu kota ${a} adalah ${b}.`, exB: (a, b) => `${b} ibu kota Provinsi ${a}.` }),
      pairGenL({ pairs: PAHLAWAN, askA: (a) => `${a} adalah pahlawan yang berasal/berjuang di daerah …`, askB: (b) => `Pahlawan dari daerah ${b} adalah …`, exA: (a, b) => `${a} berasal dari ${b}.`, exB: (a, b) => `Dari ${b}: ${a}.` }),
    ],
    ppkn: [
      pairGenL({ pairs: SILA, askA: (a) => `${a} Pancasila berbunyi …`, askB: (b) => `“${b}” adalah bunyi …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: SILA_LAMBANG, askA: (a) => `Lambang ${a.toLowerCase()} Pancasila adalah …`, askB: (b) => `Lambang “${b}” adalah milik …`, exA: (a, b) => `${a} berlambang ${b}.`, exB: (a, b) => `${b} adalah lambang ${a}.` }),
    ],
    informatika: [classifyGen(INF_CLASSIFY.map((x) => ({ item: x.item, cat: x.cat })), (i) => `${i} termasuk kelompok …`, (i, c) => `${i} adalah ${c.toLowerCase()}.`)],
    jawa: jawaGens("SD"),
    arab: [
      pairGenL({ pairs: ARAB_VOCAB, askA: (a) => `Kata “${a}” artinya …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
      pairGenL({ pairs: DHAMIR, askA: (a) => `Dhamir “${a}” artinya …`, askB: (b) => `Dhamir untuk “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” = ${a}.` }),
    ],
    pai: [
      pairGenL({ pairs: MALAIKAT, askA: (a) => `Tugas Malaikat ${a} adalah …`, askB: (b) => `Malaikat yang bertugas “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, b) => `Itu tugas Malaikat ${a}.` }),
      pairGenL({ pairs: KITAB_NABI, askA: (a) => `Kitab ${a} diturunkan kepada …`, askB: (b) => `Kitab suci yang diturunkan kepada ${b} adalah …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} menerima kitab ${a}.` }),
      PAI_ORDER_GEN, rakaatGen, factGenL(paiFactsSD),
    ],
    akidah: [
      pairGenL({ pairs: ASMAUL, askA: (a) => `Asmaul Husna “${a}” artinya Allah Maha …`, askB: (b) => `Nama Allah yang berarti “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” adalah ${a}.` }),
      PAI_ORDER_GEN,
    ],
    fikih: [factGenL(fikihFacts), factGenL(fikihFacts2), rakaatGen,
      factGenL([
        ["Saat berpuasa, “makan dengan sengaja” hukumnya …", "Membatalkan puasa", ["Tidak membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Makan dengan sengaja membatalkan puasa."],
        ["Saat berpuasa, “minum dengan sengaja” hukumnya …", "Membatalkan puasa", ["Tidak membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Minum dengan sengaja membatalkan puasa."],
        ["Saat berpuasa, “muntah yang disengaja” hukumnya …", "Membatalkan puasa", ["Tidak membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Muntah disengaja membatalkan puasa; muntah tidak disengaja tidak."],
        ["Saat berpuasa, “tidur siang” hukumnya …", "Tidak membatalkan puasa", ["Membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Tidur tidak membatalkan puasa."],
        ["Saat berpuasa, “mandi untuk menyegarkan badan” hukumnya …", "Tidak membatalkan puasa", ["Membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Mandi tidak membatalkan puasa, asal air tidak tertelan dengan sengaja."],
        ["Saat berpuasa, “berkumur saat wudu” hukumnya …", "Tidak membatalkan puasa", ["Membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Berkumur saat wudu tidak membatalkan puasa."],
        ["Saat berpuasa, “menangis” hukumnya …", "Tidak membatalkan puasa", ["Membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Menangis tidak membatalkan puasa."],
        ["Saat berpuasa, “makan karena benar-benar lupa” hukumnya …", "Tidak membatalkan puasa", ["Membatalkan puasa", "Membatalkan wudu", "Membatalkan salat"], "Makan karena lupa tidak membatalkan puasa — itu rezeki dari Allah; lanjutkan puasanya."],
      ] as Fact[])],
    quranhadis: [factGenL(qhFacts),
      pairGenL({ pairs: SURAH_ARTI, askA: (a) => `Surah ${a} artinya / dikenal sebagai …`, askB: (b) => `“${b}” adalah arti/gelar dari surah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah surah ${a}.` })],
    kristen: [
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: PERAYAAN_KRISTEN, askA: (a) => `Perayaan ${a} memperingati …`, askB: (b) => `Peringatan “${b}” disebut …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah perayaan ${a}.` }),
    ],
    "cambridge-eng": [
      pairGenL({ pairs: EN_VOCAB, askA: (a) => `What does “${a}” mean in Indonesian?`, askB: (b) => `The English word for “${b}” is …`, exA: (a, b) => `“${a}” means ${b}.`, exB: (a, b) => `“${b}” in English is ${a}.` }),
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The antonym of “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `The opposite of ${b} is ${a}.` }),
      pairGenL({ pairs: EN_PAST, askA: (a) => `The past tense of “${a}” is …`, askB: (b) => `The base form (V1) of “${b}” is …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} comes from ${a}.` }),
    ],
    "cambridge-sci": [
      pairGenL({ pairs: CAM_SCI_PAIRS, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `That is the ${a}.` }),
      factGenL(SD_SAINS_FACTS),
    ],
    "cambridge-math": [camMath],
    korea: langVocabGensL(KOREA_VOCAB, "Korea", "SD", KOREA_FACTS),
    jepang: [...langVocabGensL(JEPANG_VOCAB, "Jepang", "SD", JEPANG_FACTS), pairGenL({ pairs: JEPANG_KANA, askA: (a) => `Hiragana untuk bunyi “${a}” adalah …`, askB: (b) => `Hiragana “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b}.`, exB: (a, b) => `${b} dibaca “${a}”.` })],
    mandarin: langVocabGensL(MANDARIN_VOCAB, "Mandarin", "SD", MANDARIN_FACTS),
  },
  SMP: {
    matematika: [smpNegOps, smpEquation, smpSequence, smpGradient, smpProbability, smpScale, smpPhysics],
    inggris: [
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The synonym/antonym check — the opposite of “${a}” is …`, askB: (b) => `The word opposite in meaning to “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Opposite of ${b}: ${a}.` }),
      pairGenL({ pairs: EN_PAST, askA: (a) => `The past tense (V2) of “${a}” is …`, askB: (b) => `“${b}” is the past tense of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }),
      factGenL([
        ["“The report ___ by the students yesterday.” Choose the correct passive form!", "was written", ["writes", "wrote", "is writing"], "Passive past: was/were + V3 (written)."],
        ["She has lived in Bandung ___ 2019.", "since", ["for", "from", "until"], "Present perfect + titik waktu memakai 'since'."],
        ["Direct: “I am busy,” he said. → He said that …", "he was busy", ["he is busy", "I was busy", "he busy"], "Reported speech: am → was, I → he."],
        ["The synonym of “rapid” is …", "fast", ["slow", "weak", "late"], "Rapid = cepat = fast."],
        ["“Despite the rain, the match continued.” The word “despite” shows …", "contrast / concession (pertentangan)", ["cause", "time", "purpose"], "Despite = walaupun → concession."],
      ] as Fact[]),
    ],
    sains: [factGenL(SMP_SAINS_FACTS), smpPhysics, phGen,
      pairGenL({ pairs: ORGANEL, askA: (a) => `Fungsi organel ${a.toLowerCase()} adalah …`, askB: (b) => `Organel yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` })],
    indonesia: [factGenL(indoFactsSMP),
      pairGenL({ pairs: KATA_BAKU, askA: (a) => `Bentuk baku dari kata “${a}” adalah …`, askB: (b) => `Kata tidak baku dari “${b}” adalah …`, exA: (a, b) => `Baku: ${b} (bukan ${a}).`, exB: (a, b) => `${a} adalah bentuk tidak baku dari ${b}.` }),
      pairGenL({ pairs: PERIBAHASA, askA: (a) => `Peribahasa “${a}” artinya …`, askB: (b) => `Peribahasa yang berarti “${b}” adalah …`, exA: (a, b) => `Artinya: ${b}.`, exB: (a, b) => `Peribahasanya: “${a}”.` })],
    ips: [
      pairGenL({ pairs: EVENT_YEAR, askA: (a) => `${a} terjadi pada …`, askB: (b) => `Peristiwa yang terjadi pada ${b} adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Pada ${b}: ${a}.` }),
      pairGenL({ pairs: SMP_IPS_PAIRS, askA: (a) => `${a} adalah …`, askB: (b) => `“${b}” — itu adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: PROVINSI_IBUKOTA, askA: (a) => `Ibu kota Provinsi ${a} adalah …`, askB: (b) => `${b} adalah ibu kota Provinsi …`, exA: (a, b) => `Ibu kota ${a}: ${b}.`, exB: (a, b) => `${b} ibu kota ${a}.` }),
    ],
    ppkn: [pairGenL({ pairs: LEMBAGA, askA: (a) => `Tugas/wewenang utama ${a} adalah …`, askB: (b) => `“${b}” adalah tugas/wewenang …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu wewenang ${a}.` })],
    informatika: [binaryGen,
      classifyGen(INF_CLASSIFY.map((x) => ({ item: x.item, cat: x.cat })), (i) => `${i} termasuk kelompok …`, (i, c) => `${i} adalah ${c.toLowerCase()}.`),
      factGenL([
        ["Struktur “jika … maka …” dalam pemrograman disebut struktur …", "Percabangan / seleksi", ["Perulangan", "Fungsi", "Array"], "If-then adalah struktur seleksi/percabangan."],
        ["Algoritma pengurutan dengan membandingkan pasangan elemen bersebelahan berulang kali adalah …", "Bubble sort", ["Binary search", "Merge sort", "Hashing"], "Bubble sort menukar pasangan bersebelahan hingga terurut."],
        ["Protokol transfer halaman web yang aman adalah …", "HTTPS", ["FTP", "SMTP", "POP3"], "HTTPS = HTTP + enkripsi TLS."],
        ["Satuan data terkecil adalah …", "Bit", ["Byte", "Kilobyte", "Gigabyte"], "Bit terkecil; 8 bit = 1 byte."],
        ["Jaringan komputer yang mencakup wilayah satu gedung/sekolah disebut …", "LAN (Local Area Network)", ["WAN", "MAN", "Internet"], "LAN = jaringan lokal; MAN = kota; WAN = luas antarwilayah."],
        ["Perangkat yang menghubungkan dua jaringan berbeda dan memilih jalur terbaik disebut …", "Router", ["Hub", "Repeater", "Kabel UTP"], "Router meneruskan paket antarjaringan berdasarkan alamat IP."],
        ["Sistem operasi yang bersifat open source adalah …", "Linux", ["Windows", "macOS", "iOS"], "Linux open source; Windows & macOS berpemilik (proprietary)."],
        ["1 Kilobyte (KB) sama dengan … byte", "1.024 byte", ["1.000 byte", "8 byte", "1.000.000 byte"], "Dalam komputasi, 1 KB = 1.024 byte (2¹⁰)."],
        ["Ekstensi file untuk gambar hasil foto umumnya adalah …", ".jpg / .png", [".docx", ".mp3", ".exe"], ".docx dokumen, .mp3 audio, .exe program."],
      ] as Fact[])],
    jawa: jawaGens("SMP"),
    arab: [
      pairGenL({ pairs: ARAB_VOCAB, askA: (a) => `Kata “${a}” artinya …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
      pairGenL({ pairs: DHAMIR, askA: (a) => `Dhamir “${a}” artinya …`, askB: (b) => `Dhamir untuk “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” = ${a}.` }),
      factGenL([
        ["Kata “اِذْهَبْ” (idzhab) pada kalimat “اِذْهَبْ إِلَى الْمَدْرَسَةِ” adalah fi'il …", "Amr (perintah)", ["Madhi", "Mudhari'", "Nahi"], "اِذْهَبْ = pergilah! → fi'il amr."],
        ["Lawan kata dari “كَبِيرٌ” (besar) adalah …", "صَغِيرٌ (kecil)", ["طَوِيلٌ (panjang)", "جَدِيدٌ (baru)", "قَرِيبٌ (dekat)"], "كَبِيرٌ >< صَغِيرٌ."],
        ["Dhamir untuk “dia perempuan” adalah …", "هِيَ (hiya)", ["هُوَ (huwa)", "أَنْتَ (anta)", "نَحْنُ (nahnu)"], "هُوَ dia laki-laki; هِيَ dia perempuan."],
      ] as Fact[]),
    ],
    pai: [factGenL(paiFactsSD), PAI_ORDER_GEN, rakaatGen, bulanGen],
    akidah: [
      pairGenL({ pairs: SIFAT_WAJIB, askA: (a) => `Sifat wajib Allah “${a}” artinya …`, askB: (b) => `Sifat wajib Allah yang berarti “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” adalah sifat ${a}.` }),
      pairGenL({ pairs: ASMAUL, askA: (a) => `Asmaul Husna “${a}” artinya Allah Maha …`, askB: (b) => `Nama Allah yang berarti “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” adalah ${a}.` }),
    ],
    fikih: [factGenL(fikihFacts), fikihZakat,
      pairGenL({ pairs: HAJI_PAIRS, askA: (a) => `Dalam ibadah haji, ${a} adalah …`, askB: (b) => `“${b}” — itu adalah istilah haji …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` })],
    quranhadis: [factGenL(qhFacts),
      pairGenL({ pairs: HADIS_CLASS, askA: (a) => `Hadis ${a} adalah hadis yang …`, askB: (b) => `“${b}” — itu adalah hadis …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu hadis ${a}.` })],
    ski: [khalifahGen,
      pairGenL({ pairs: DINASTI, askA: (a) => `Pusat pemerintahan ${a} adalah kota …`, askB: (b) => `Dinasti/kesultanan yang berpusat di ${b} adalah …`, exA: (a, b) => `${a} berpusat di ${b}.`, exB: (a, b) => `Yang berpusat di ${b}: ${a}.` }),
      factGenL(skiFactsSMA)],
    kristen: [factGenL(kristenFactsAdv),
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` })],
    "cambridge-eng": [
      pairGenL({ pairs: EN_PAST, askA: (a) => `The past tense (V2) of “${a}” is …`, askB: (b) => `“${b}” is the past tense of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }),
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The antonym of “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Opposite of ${b}: ${a}.` }),
    ],
    "cambridge-sci": [
      pairGenL({ pairs: CAM_SCI_PAIRS, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `That is the ${a}.` }),
      pairGenL({ pairs: UNSUR_SIMBOL, askA: (a) => `The chemical symbol for ${a.toLowerCase()} is …`, askB: (b) => `The symbol “${b}” stands for the element …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} = ${a}.` }),
    ],
    "cambridge-math": [camMath, smpEquation],
    korea: langVocabGensL(KOREA_VOCAB, "Korea", "SMP", KOREA_FACTS),
    jepang: [...langVocabGensL(JEPANG_VOCAB, "Jepang", "SMP", JEPANG_FACTS), pairGenL({ pairs: JEPANG_KANA, askA: (a) => `Hiragana untuk bunyi “${a}” adalah …`, askB: (b) => `Hiragana “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b}.`, exB: (a, b) => `${b} dibaca “${a}”.` })],
    mandarin: langVocabGensL(MANDARIN_VOCAB, "Mandarin", "SMP", MANDARIN_FACTS),
  },
  SMA: {
    matematika: [smaDerivative, smaLimit, smaLog, smaSeries, smaCombination],
    inggris: [
      factGenL([
        ["“Had I known about the traffic, I ___ earlier.”", "would have left", ["will leave", "would leave", "leave"], "Third conditional (inversi 'Had I…'): would have + V3."],
        ["Choose the sentence with the correct subjunctive:", "I suggest that he go now.", ["I suggest that he goes now.", "I suggest that he going now.", "I suggest that he went now yesterday."], "Setelah 'suggest that…', kata kerja bentuk dasar: go."],
        ["The phrase “break the ice” in a meeting means …", "To start a conversation and ease awkwardness", ["To end the meeting", "To cool the room", "To postpone discussion"], "Idiom: mencairkan suasana / memulai percakapan."],
        ["“The committee ___ reached its decision.” (formal British English)", "has", ["have", "are", "were"], "Collective noun sebagai satu kesatuan → has."],
      ] as Fact[]),
      pairGenL({ pairs: EN_PAST, askA: (a) => `The past participle check — the past tense of “${a}” is …`, askB: (b) => `“${b}” is the past form of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }),
    ],
    biologi: [smaGenetics,
      pairGenL({ pairs: ENZIM, askA: (a) => `Enzim ${a} berfungsi …`, askB: (b) => `Enzim yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah enzim ${a}.` }),
      pairGenL({ pairs: ORGANEL, askA: (a) => `Fungsi organel ${a.toLowerCase()} adalah …`, askB: (b) => `Organel yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` }),
      factGenL([
        ["Pada respirasi aerob, tahap penghasil ATP terbanyak adalah …", "Rantai transpor elektron", ["Glikolisis", "Siklus Krebs", "Fermentasi"], "Transpor elektron menghasilkan ±34 ATP."],
        ["Enzim yang menyambung fragmen Okazaki pada replikasi DNA adalah …", "DNA ligase", ["Helikase", "Primase", "Topoisomerase"], "DNA ligase menyambung fragmen Okazaki pada untai lagging."],
        ["Organ pernapasan pada serangga adalah …", "Trakea", ["Paru-paru", "Insang", "Kulit"], "Serangga bernapas lewat sistem trakea & spirakel."],
      ] as Fact[])],
    fisika: [smaPhysics],
    kimia: [smaChemistryPh,
      pairGenL({ pairs: UNSUR_SIMBOL, askA: (a) => `Lambang unsur ${a} adalah …`, askB: (b) => `Unsur dengan lambang “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} = ${a}.` }),
      factGenL([
        ["Konfigurasi elektron Fe (Z = 26) adalah …", "[Ar] 4s² 3d⁶", ["[Ar] 4s¹ 3d⁷", "[Ar] 3d⁸", "[Ne] 4s² 3d⁶"], "Fe: 1s²2s²2p⁶3s²3p⁶4s²3d⁶ = [Ar] 4s² 3d⁶."],
        ["Bilangan oksidasi S dalam H₂SO₄ adalah …", "+6", ["+2", "+4", "−2"], "2(+1) + S + 4(−2) = 0 → S = +6."],
        ["Larutan penyangga (buffer) terdiri dari …", "Asam lemah + basa konjugasinya", ["Asam kuat + basa kuat", "Garam + air saja", "Asam kuat + garamnya"], "Buffer: asam lemah + basa konjugasi (atau sebaliknya)."],
      ] as Fact[])],
    indonesia: [classifyGen(majasClassify.map((x) => ({ item: `“${x.item}”`, cat: x.cat })), (i) => `Kalimat ${i} mengandung majas …`, (i, c) => `Kalimat itu bermajas ${c.toLowerCase()}.`),
      pairGenL({ pairs: KATA_BAKU, askA: (a) => `Bentuk baku dari kata “${a}” adalah …`, askB: (b) => `Kata tidak baku dari “${b}” adalah …`, exA: (a, b) => `Baku: ${b}.`, exB: (a, b) => `${a} tidak baku dari ${b}.` }),
      factGenL([
        ["Struktur teks eksposisi yang berisi penegasan kembali pendapat penulis disebut …", "Penegasan ulang", ["Tesis", "Argumentasi", "Orientasi"], "Eksposisi: tesis → argumentasi → penegasan ulang."],
        ["Kata berimbuhan yang bermakna kausatif (menyebabkan) adalah …", "Memperbesar", ["Terbesar", "Pembesaran", "Besar-besaran"], "“Memper-” pada memperbesar = menyebabkan menjadi besar."],
      ] as Fact[])],
    ips: [
      pairGenL({ pairs: EVENT_YEAR, askA: (a) => `${a} terjadi pada …`, askB: (b) => `Peristiwa yang terjadi pada ${b} adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Pada ${b}: ${a}.` }),
      factGenL([
        ["Teori ekonomi laissez-faire (peran pemerintah seminimal mungkin) dikemukakan oleh …", "Adam Smith", ["Karl Marx", "John Maynard Keynes", "David Ricardo"], "Adam Smith, “The Wealth of Nations” (1776)."],
        ["Perang Dunia II di Pasifik berakhir setelah pengeboman Hiroshima & Nagasaki pada tahun …", "1945", ["1943", "1944", "1946"], "Agustus 1945; Jepang menyerah, WWII berakhir."],
        ["Fungsi devisa bagi suatu negara antara lain untuk …", "Membayar impor dan utang luar negeri", ["Mencetak uang baru", "Menurunkan inflasi secara langsung", "Membayar gaji ASN"], "Devisa dipakai untuk transaksi luar negeri."],
        ["Konsep “Dwifungsi ABRI” dan stabilitas politik yang kuat adalah ciri masa …", "Orde Baru", ["Demokrasi Liberal", "Demokrasi Terpimpin", "Reformasi"], "Orde Baru (1966–1998)."],
      ] as Fact[])],
    ppkn: [pairGenL({ pairs: LEMBAGA, askA: (a) => `Tugas/wewenang utama ${a} adalah …`, askB: (b) => `“${b}” adalah tugas/wewenang …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu wewenang ${a}.` }),
      factGenL([
        ["Menurut trias politica Montesquieu, kekuasaan yudikatif di Indonesia dijalankan oleh …", "MA dan MK", ["Presiden & DPR", "MPR", "KPK"], "Yudikatif: Mahkamah Agung & Mahkamah Konstitusi."],
        ["Amandemen UUD 1945 pertama kali dilakukan pada tahun …", "1999", ["1998", "2000", "2002"], "Amandemen I pada Sidang Umum MPR 1999; total 4 kali (1999–2002)."],
        ["Asas pemilu di Indonesia adalah …", "Luber dan jurdil", ["Cepat dan murah", "Terbuka dan rahasia penuh", "Langsung oleh MPR"], "Luber: langsung, umum, bebas, rahasia; Jurdil: jujur & adil."],
      ] as Fact[])],
    informatika: [
      pairGenL({ pairs: OSI_PAIRS, askA: (a) => `Lapisan OSI ${a} berfungsi untuk …`, askB: (b) => `“${b}” adalah fungsi lapisan OSI …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu fungsi ${a}.` }),
      pairGenL({ pairs: ATTACK_PAIRS, askA: (a) => `Serangan siber “${a}” adalah …`, askB: (b) => `“${b}” — itu adalah serangan …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` }),
      binaryGen,
      factGenL([
        ["Kompleksitas waktu algoritma binary search adalah …", "O(log n)", ["O(n)", "O(n log n)", "O(n²)"], "Binary search membagi data jadi dua tiap langkah → O(log n)."],
        ["Dalam basis data relasional, atribut unik pengidentifikasi setiap baris disebut …", "Primary key", ["Foreign key", "Index biasa", "View"], "Primary key: unik & tidak boleh NULL."],
      ] as Fact[])],
    jawa: jawaGens("SMA"),
    arab: [
      pairGenL({ pairs: ARAB_VOCAB, askA: (a) => `Kata “${a}” artinya …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
      factGenL([
        ["Jamak taksir dari “كِتَابٌ” adalah …", "كُتُبٌ", ["كِتَابَانِ", "كَاتِبُونَ", "مَكْتَبَاتٌ"], "كِتَابٌ → كُتُبٌ (jamak taksir)."],
        ["Huruf jar pada kalimat “ذَهَبْتُ إِلَى الْمَسْجِدِ” adalah …", "إِلَى", ["ذَهَبْتُ", "الْمَسْجِدِ", "Tidak ada"], "إِلَى adalah huruf jar; الْمَسْجِدِ majrur."],
        ["Kata “الدَّرْسَ” pada “كَتَبَ الطَّالِبُ الدَّرْسَ” berkedudukan sebagai …", "Maf'ul bih (objek)", ["Fa'il", "Mubtada'", "Khabar"], "الدَّرْسَ adalah objek dari كَتَبَ; fa'il-nya الطَّالِبُ."],
      ] as Fact[]),
    ],
    pai: [factGenL([
      ["Bagian waris istri bila pewaris mempunyai anak adalah …", "1/8", ["1/4", "1/2", "1/3"], "QS An-Nisa 12: istri mendapat 1/8 bila ada anak; 1/4 bila tidak ada."],
      ["Jual beli yang mengandung ketidakjelasan (gharar) hukumnya …", "Dilarang / tidak sah", ["Wajib", "Sunnah", "Makruh saja"], "Rasulullah melarang jual beli gharar (HR. Muslim)."],
      ["Sumber hukum Islam kedua setelah Al-Qur'an adalah …", "Hadis / Sunnah", ["Ijma'", "Qiyas", "Ijtihad"], "Urutan: Al-Qur'an, Hadis, Ijma', Qiyas."],
    ] as Fact[]), factGenL(FARAID_FACTS), fikihZakat,
      pairGenL({ pairs: ALIRAN, askA: (a) => `Aliran teologi ${a} berpendapat bahwa …`, askB: (b) => `“${b}” adalah pandangan aliran …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu pandangan ${a}.` }),
      pairGenL({ pairs: AKAD, askA: (a) => `Akad ${a} adalah …`, askB: (b) => `“${b}” — itu adalah akad …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu akad ${a}.` })],
    akidah: [
      pairGenL({ pairs: ALIRAN, askA: (a) => `Aliran teologi ${a} berpendapat bahwa …`, askB: (b) => `“${b}” adalah pandangan aliran …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu pandangan ${a}.` }),
      pairGenL({ pairs: SIFAT_WAJIB, askA: (a) => `Sifat wajib Allah “${a}” artinya …`, askB: (b) => `Sifat wajib Allah yang berarti “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” adalah sifat ${a}.` }),
    ],
    fikih: [
      pairGenL({ pairs: AKAD, askA: (a) => `Akad ${a} adalah …`, askB: (b) => `“${b}” — itu adalah akad …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu akad ${a}.` }),
      fikihZakat,
    ],
    quranhadis: [factGenL(qhFacts),
      pairGenL({ pairs: TAFSIR_PAIRS, askA: (a) => `Tafsir ${a} adalah tafsir yang …`, askB: (b) => `“${b}” — itu adalah tafsir …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu tafsir ${a}.` }),
      factGenL([
        ["Metode menafsirkan Al-Qur'an dengan Al-Qur'an & hadis disebut tafsir …", "Bil ma'tsur", ["Bil ra'yi", "Isyari", "Ilmi"], "Tafsir bil ma'tsur bersumber pada riwayat."],
        ["Hadis yang sanadnya bersambung hingga Rasulullah disebut hadis …", "Marfu'", ["Mauquf", "Maqthu'", "Mursal sahabi"], "Marfu' disandarkan kepada Nabi SAW."],
      ] as Fact[])],
    ski: [
      pairGenL({ pairs: TOKOH_KARYA, askA: (a) => `${a} terkenal dengan karya/sumbangannya: …`, askB: (b) => `“${b}” adalah karya/sumbangan dari …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu karya ${a}.` }),
      pairGenL({ pairs: DINASTI, askA: (a) => `Pusat pemerintahan ${a} adalah kota …`, askB: (b) => `Dinasti/kesultanan yang berpusat di ${b} adalah …`, exA: (a, b) => `${a} berpusat di ${b}.`, exB: (a, b) => `Yang berpusat di ${b}: ${a}.` }),
      factGenL(skiFactsSMA), khalifahGen,
    ],
    kristen: [factGenL(kristenFactsAdv),
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: PERAYAAN_KRISTEN, askA: (a) => `Perayaan ${a} memperingati …`, askB: (b) => `Peringatan “${b}” disebut …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Itu adalah perayaan ${a}.` })],
    "cambridge-eng": [
      factGenL([
        ["Choose the correctly punctuated sentence:", "It's a shame that the team's losing.", ["Its a shame that the teams losing.", "Its a shame that the team's losing.", "It's a shame that the teams' losing."], "It's = it is; team's = possessive singular."],
        ["Which sentence uses the passive correctly?", "The bridge was built in 1990.", ["The bridge was build in 1990.", "The bridge is build in 1990.", "The bridge built was in 1990."], "Passive past: was + past participle (built)."],
        ["Choose the correct sentence in the present perfect:", "I have seen that film.", ["I have saw that film.", "I has seen that film.", "I have see that film."], "Present perfect: have + past participle (seen)."],
      ] as Fact[]),
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The antonym of “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Opposite of ${b}: ${a}.` }),
    ],
    "cambridge-sci": [
      pairGenL({ pairs: UNSUR_SIMBOL, askA: (a) => `The chemical symbol for ${a.toLowerCase()} is …`, askB: (b) => `The symbol “${b}” stands for the element …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} = ${a}.` }),
      pairGenL({ pairs: CAM_SCI_PAIRS, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `That is the ${a}.` }),
      smaPhysics,
    ],
    "cambridge-math": [camMath, smaSeries],
    korea: langVocabGensL(KOREA_VOCAB, "Korea", "SMA", KOREA_FACTS),
    jepang: [...langVocabGensL(JEPANG_VOCAB, "Jepang", "SMA", JEPANG_FACTS), pairGenL({ pairs: JEPANG_KANA, askA: (a) => `Hiragana untuk bunyi “${a}” adalah …`, askB: (b) => `Hiragana “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b}.`, exB: (a, b) => `${b} dibaca “${a}”.` })],
    mandarin: langVocabGensL(MANDARIN_VOCAB, "Mandarin", "SMA", MANDARIN_FACTS),
  },
};

/**
 * Hasilkan hingga `want` soal unik dari generator jenjang+mapel+level.
 * Keunikan lapis pertama: teks soal; lapis kedua (pengisi): teks soal sama
 * tetapi set pilihan berbeda tetap dihitung variasi baru.
 */
export function generateQuestions(jenjang: JenjangId, subjectId: string, level: number, want: number): Question[] {
  const gens = GENERATORS[jenjang]?.[subjectId] ?? [];
  if (!gens.length) return [];
  const out: Question[] = [];
  const pending: Question[] = [];
  const seenQ = new Set<string>();
  const seenFull = new Set<string>();
  let guard = 0;
  const maxGuard = want * 80;
  while (out.length < want && guard < maxGuard) {
    guard++;
    const g = gens[rnd(gens.length)];
    if (!g) break;
    const q = g(level);
    if (!q) continue;
    const full = `${q.q}|${[...q.options].sort().join("|")}`;
    if (seenFull.has(full)) continue;
    seenFull.add(full);
    if (seenQ.has(q.q)) {
      pending.push(q);
    } else {
      seenQ.add(q.q);
      out.push(q);
    }
  }
  for (const q of pending) {
    if (out.length >= want) break;
    out.push(q);
  }
  return out;
}

export function hasGenerator(jenjang: JenjangId, subjectId: string): boolean {
  return (GENERATORS[jenjang]?.[subjectId]?.length ?? 0) > 0;
}

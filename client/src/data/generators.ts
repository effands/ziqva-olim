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
  ["Munkar dan Nakir", "Menanyai manusia di alam kubur"],
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
  ["Al-Adl", "Maha Adil"], ["Al-Lathif", "Maha Lembut"], ["Al-Khabir", "Maha Waspada"],
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
  ["kemarin", "kala wingi"], ["satu", "setunggal"], ["dua", "kalih"], ["empat", "sekawan"],
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

/* ================================================================
   PITA KELAS — jenjang tidak dipukul rata. Peserta memilih KELAS di
   dalam jenjangnya (TK: Kelompok A/B; SD: Kelas 1–6; SMP: 7–9; SMA:
   10–12). Kelas menggeser PUSAT kesulitan & topik; Level 1–5 tetap
   tingkat kesulitan halus DI DALAM pita kelas itu.

   Mekanismenya satu koordinat kesulitan d ∈ [0,1]:
     d = posisiKelas × 0,65 + posisiLevel × 0,35
   - Bank pasangan/fakta: windowOf() memakai d (jendela materi 55%
     bank yang berpusat di d) — kelas terendah tidak pernah menyentuh
     bagian teratas bank jenjangnya, kelas tertinggi tidak pernah
     mendapat bagian terbawahnya; generator topik khas kelas yang
     lebih tinggi digerbang bandGate() agar tidak bocor ke bawah.
   - Generator angka: dipanggil dengan level hasil pemetaan d
     (genLevelForCoord) — mis. SD Kelas 1 Level 5 setara level
     generator 2 (pecahan/FPB belum muncul), SD Kelas 6 Level 1
     setara level generator 3 (pecahan dasar memang materi kelas 6).
   - Generator khas kelas (mis. sdGradeMath) membaca band01Now().
   Tanpa kelas (Mode Kelas Ujian guru & alur lama) semua perilaku
   persis seperti sebelumnya: band tidak aktif.
   ================================================================ */
let activeBand01 = -1;
let activeBandCoord = -1;

/** Koordinat kesulitan gabungan kelas (0..1) + level (1..5). */
export function bandCoordFor(level: number, band01: number): number {
  return band01 * 0.65 + ((Math.min(5, Math.max(1, level)) - 1) / 4) * 0.35;
}
/** Level generator (integer 1..5) dari koordinat kesulitan. */
export function genLevelForCoord(coord: number): number {
  return Math.min(5, Math.max(1, 1 + Math.floor(coord * 4.999)));
}
/** Aktifkan pita kelas selama satu putaran generateQuestions (sinkron). */
export function beginBand(coord: number, band01: number): void {
  activeBandCoord = coord;
  activeBand01 = band01;
}
export function endBand(): void {
  activeBandCoord = -1;
  activeBand01 = -1;
}
/** Posisi kelas aktif 0..1, atau -1 bila pita kelas tidak aktif. */
export function band01Now(): number {
  return activeBand01;
}
/**
 * Gerbang pita kelas untuk generator topik khas kelas menengah/atas
 * (mis. pecahan, FPB/KPK, persen): saat pita kelas aktif dan kelas
 * peserta di bawah minBand, generator diam (null) — materi kelas tinggi
 * tidak bocor ke kelas rendah. Tanpa pita kelas, generator berjalan
 * seperti biasa.
 */
export function bandGate(minBand: number, gen: LGen): LGen {
  return (level) => (activeBand01 >= 0 && activeBand01 < minBand ? null : gen(level));
}

export function windowOf<T>(arr: readonly T[], level: number): T[] {
  const n = arr.length;
  if (n <= 10) return [...arr];
  if (activeBandCoord >= 0) {
    const size = Math.max(6, Math.ceil(n * 0.55));
    const start = Math.round(activeBandCoord * (n - size));
    return arr.slice(start, start + size) as T[];
  }
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
/** Versi level-aware dari classifyGen: jendela item bergeser per level. */
export function classifyGenL(
  items: readonly { item: string; cat: string }[],
  ask: (item: string) => string,
  ex: (item: string, cat: string) => string,
  four = true,
): LGen {
  return (level) => classifyGen(windowOf(items, level), ask, ex, four)();
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

/* ---- Bank Bahasa Arab tambahan (perluasan besar) ---- */
export const ARAB_VOCAB2: readonly (readonly [string, string])[] = [
  ["نَافِذَةٌ (nāfidzatun)", "jendela"], ["كُرْسِيٌّ (kursiyyun)", "kursi"], ["مَكْتَبٌ (maktabun)", "meja / kantor"],
  ["سَرِيرٌ (sarīrun)", "tempat tidur"], ["مِصْبَاحٌ (mishbāhun)", "lampu"], ["سَاعَةٌ (sā'atun)", "jam"],
  ["حَقِيبَةٌ (haqībatun)", "tas"], ["مِفْتَاحٌ (miftāhun)", "kunci"], ["هَاتِفٌ (hātifun)", "telepon"],
  ["تِلْفَازٌ (tilfāzun)", "televisi"], ["ثَلَّاجَةٌ (tsallājatun)", "kulkas"], ["مِرْوَحَةٌ (mirwahatun)", "kipas angin"],
  ["دَفْتَرٌ (daftarun)", "buku tulis"], ["مِمْسَحَةٌ (mimsahatun)", "penghapus"], ["مِسْطَرَةٌ (mistharatun)", "penggaris"],
  ["سَبُّورَةٌ (sabbūratun)", "papan tulis"], ["طَبَاشِيرُ (thabāsyīru)", "kapur tulis"], ["فَصْلٌ (fashlun)", "kelas"],
  ["مَكْتَبَةٌ (maktabatun)", "perpustakaan"], ["مَلْعَبٌ (mal'abun)", "lapangan"], ["حَدِيقَةٌ (hadīqatun)", "taman / kebun"],
  ["مَطْبَخٌ (mathbakhun)", "dapur"], ["حَمَّامٌ (hammāmun)", "kamar mandi"], ["غُرْفَةٌ (ghurfatun)", "kamar / ruangan"],
  ["طَرِيقٌ (tharīqun)", "jalan"], ["جِسْرٌ (jisrun)", "jembatan"], ["مَطَارٌ (mathārun)", "bandara"],
  ["مَحَطَّةٌ (mahaththatun)", "stasiun / terminal"], ["مُسْتَشْفَى (mustasyfā)", "rumah sakit"], ["صَيْدَلِيَّةٌ (shaidaliyyatun)", "apotek"],
  ["فُنْدُقٌ (funduqun)", "hotel"], ["مَطْعَمٌ (math'amun)", "restoran"], ["دُكَّانٌ (dukkānun)", "toko / warung"],
  ["خُبْزٌ (khubzun)", "roti"], ["أَرُزٌّ (aruzzun)", "nasi / beras"], ["لَحْمٌ (lahmun)", "daging"],
  ["دَجَاجٌ (dajājun)", "ayam"], ["بَيْضٌ (baidhun)", "telur"], ["حَلِيبٌ (halībun)", "susu"],
  ["شَايٌ (syāyun)", "teh"], ["قَهْوَةٌ (qahwatun)", "kopi"], ["سُكَّرٌ (sukkarun)", "gula"],
  ["مِلْحٌ (milhun)", "garam"], ["عَسَلٌ (ʿasalun)", "madu"], ["تُفَّاحٌ (tuffāhun)", "apel"],
  ["مَوْزٌ (mauzun)", "pisang"], ["بُرْتُقَالٌ (burtuqālun)", "jeruk"], ["عِنَبٌ (ʿinabun)", "anggur"],
  ["بَطِّيخٌ (baththīkhun)", "semangka"], ["تَمْرٌ (tamrun)", "kurma"], ["زَيْتٌ (zaitun)", "minyak"],
  ["رَأْسٌ (ra'sun)", "kepala"], ["عَيْنٌ (ʿainun)", "mata"], ["أَنْفٌ (anfun)", "hidung"],
  ["فَمٌ (famun)", "mulut"], ["أُذُنٌ (udzunun)", "telinga"], ["يَدٌ (yadun)", "tangan"],
  ["رِجْلٌ (rijlun)", "kaki"], ["شَعْرٌ (syaʿrun)", "rambut"], ["سِنٌّ (sinnun)", "gigi"],
  ["قَلْبٌ (qalbun)", "hati / jantung"], ["أَسَدٌ (asadun)", "singa"], ["فِيلٌ (fīlun)", "gajah"],
  ["جَمَلٌ (jamalun)", "unta"], ["غَنَمٌ (ghanamun)", "kambing / domba"], ["بَقَرَةٌ (baqaratun)", "sapi"],
  ["أَرْنَبٌ (arnabun)", "kelinci"], ["فَأْرٌ (fa'run)", "tikus"], ["عُصْفُورٌ (ʿushfūrun)", "burung pipit"],
  ["بَطَّةٌ (baththatun)", "bebek"], ["نَمْلَةٌ (namlatun)", "semut"], ["نَحْلَةٌ (nahlatun)", "lebah"],
  ["فَرَاشَةٌ (farāsyatun)", "kupu-kupu"], ["مَطَرٌ (matharun)", "hujan"], ["ثَلْجٌ (tsaljun)", "salju"],
  ["رِيحٌ (rīhun)", "angin"], ["سَحَابٌ (sahābun)", "awan"], ["أَرْضٌ (ardhun)", "bumi / tanah"],
  ["سَمَاءٌ (samā'un)", "langit"], ["نَارٌ (nārun)", "api"], ["حَجَرٌ (hajarun)", "batu"],
  ["ذَهَبٌ (dzahabun)", "emas"], ["فِضَّةٌ (fidhhatun)", "perak"], ["حَدِيدٌ (hadīdun)", "besi"],
];
export const ARAB_WARNA: readonly (readonly [string, string])[] = [
  ["أَحْمَرُ (ahmaru)", "merah"], ["أَزْرَقُ (azraqu)", "biru"], ["أَخْضَرُ (akhdharu)", "hijau"],
  ["أَصْفَرُ (ashfaru)", "kuning"], ["أَبْيَضُ (abyadhu)", "putih"], ["أَسْوَدُ (aswadu)", "hitam"],
  ["بُنِّيٌّ (bunniyyun)", "cokelat"], ["وَرْدِيٌّ (wardiyyun)", "merah muda / pink"], ["رَمَادِيٌّ (ramādiyyun)", "abu-abu"],
  ["بُرْتُقَالِيٌّ (burtuqāliyyun)", "oranye"], ["بَنَفْسَجِيٌّ (banafsajiyyun)", "ungu"],
];
export const ARAB_HARI: readonly (readonly [string, string])[] = [
  ["الْأَحَدُ (al-ahadu)", "hari Ahad / Minggu"], ["الْإِثْنَيْنِ (al-itsnaini)", "hari Senin"],
  ["الثُّلَاثَاءُ (ats-tsulātsā'u)", "hari Selasa"], ["الْأَرْبِعَاءُ (al-arbiʿā'u)", "hari Rabu"],
  ["الْخَمِيسُ (al-khamīsu)", "hari Kamis"], ["الْجُمُعَةُ (al-jumuʿatu)", "hari Jumat"],
  ["السَّبْتُ (as-sabtu)", "hari Sabtu"],
];
export const ARAB_KELUARGA: readonly (readonly [string, string])[] = [
  ["جَدٌّ (jaddun)", "kakek"], ["جَدَّةٌ (jaddatun)", "nenek"], ["عَمٌّ (ʿammun)", "paman (dari ayah)"],
  ["خَالٌ (khālun)", "paman (dari ibu)"], ["أَخٌ (akhun)", "saudara laki-laki"], ["أُخْتٌ (ukhtun)", "saudara perempuan"],
  ["اِبْنٌ (ibnun)", "anak laki-laki / putra"], ["بِنْتٌ (bintun)", "anak perempuan / putri"], ["زَوْجٌ (zaujun)", "suami"],
  ["زَوْجَةٌ (zaujatun)", "istri"], ["طِفْلٌ (thiflun)", "anak kecil / bayi"], ["عَائِلَةٌ (ʿā'ilatun)", "keluarga"],
];
export const ARAB_LAWAN: readonly (readonly [string, string])[] = [
  ["كَبِيرٌ (kabīrun)", "besar"], ["صَغِيرٌ (shaghīrun)", "kecil"], ["طَوِيلٌ (thawīlun)", "panjang / tinggi"],
  ["قَصِيرٌ (qashīrun)", "pendek"], ["قَرِيبٌ (qarībun)", "dekat"], ["بَعِيدٌ (baʿīdun)", "jauh"],
  ["جَدِيدٌ (jadīdun)", "baru"], ["قَدِيمٌ (qadīmun)", "lama / kuno"], ["سَرِيعٌ (sarīʿun)", "cepat"],
  ["بَطِيءٌ (bathī'un)", "lambat"], ["قَوِيٌّ (qawiyyun)", "kuat"], ["ضَعِيفٌ (dhaʿīfun)", "lemah"],
  ["غَنِيٌّ (ghaniyyun)", "kaya"], ["فَقِيرٌ (faqīrun)", "miskin"], ["نَظِيفٌ (nazhīfun)", "bersih"],
  ["وَسِخٌ (wasikhun)", "kotor"], ["حَارٌّ (hārrun)", "panas"], ["بَارِدٌ (bāridun)", "dingin"],
  ["سَهْلٌ (sahlun)", "mudah"], ["صَعْبٌ (shaʿbun)", "sulit"], ["أَوَّلُ (awwalu)", "pertama"],
  ["آخِرُ (ākhiru)", "terakhir"],
];
export const ARAB_KERJA: readonly (readonly [string, string])[] = [
  ["كَتَبَ (kataba)", "menulis / telah menulis"], ["قَرَأَ (qara'a)", "membaca"], ["ذَهَبَ (dzahaba)", "pergi"],
  ["جَاءَ (jā'a)", "datang"], ["أَكَلَ (akala)", "makan"], ["شَرِبَ (syariba)", "minum"],
  ["جَلَسَ (jalasa)", "duduk"], ["قَامَ (qāma)", "berdiri"], ["نَامَ (nāma)", "tidur"],
  ["لَعِبَ (laʿiba)", "bermain"], ["دَرَسَ (darasa)", "belajar"], ["عَمِلَ (ʿamila)", "bekerja"],
  ["فَتَحَ (fataha)", "membuka"], ["أَغْلَقَ (aghlaqa)", "menutup"], ["سَمِعَ (samiʿa)", "mendengar"],
  ["نَظَرَ (nazhara)", "melihat"], ["تَكَلَّمَ (takallama)", "berbicara"], ["ضَحِكَ (dhahika)", "tertawa"],
  ["بَكَى (bakā)", "menangis"], ["رَكِبَ (rakiba)", "naik / mengendarai"],
];
export const ARAB_FACTS_BESAR: readonly Fact[] = [
  ["Kalimat dalam bahasa Arab yang terdiri dari isim dan isim disebut jumlah …", "Ismiyah", ["Fi'liyah", "Syarathiyah", "Nidaiyah"], "Jumlah ismiyah diawali isim (mubtada' + khabar); jumlah fi'liyah diawali fi'il."],
  ["Kalimat yang diawali fi'il (kata kerja) disebut jumlah …", "Fi'liyah", ["Ismiyah", "Zharfiyah", "Idhafah"], "Jumlah fi'liyah: fi'il + fa'il, misalnya كَتَبَ الطَّالِبُ."],
  ["Kata yang menunjukkan makna dan terikat waktu (lampau, sekarang, akan datang) adalah …", "Fi'il", ["Isim", "Huruf", "Dhamir"], "Fi'il = kata kerja; isim = kata benda; huruf = kata sambung/tugas."],
  ["Tanda isim yang paling mudah dikenali adalah …", "Bertanwin atau berawalan alif lam (ال)", ["Selalu berakhiran fathah", "Selalu diawali huruf jar", "Tidak bisa dibaca"], "Isim dapat bertanwin ( كِتَابٌ ) atau kemasukan ال ( الْكِتَابُ )."],
  ["Isim yang menunjukkan laki-laki disebut isim …", "Mudzakkar", ["Muannats", "Mabni", "Mu'rab"], "Mudzakkar = maskulin; muannats = feminin, biasanya berakhiran ة."],
  ["Kata “مَدْرَسَةٌ” termasuk isim muannats karena …", "Berakhiran ta' marbuthah (ة)", ["Diawali alif lam", "Berakhiran tanwin", "Jumlah hurufnya lima"], "Ta' marbuthah (ة) adalah tanda utama isim muannats."],
  ["Jamak dari “مُسْلِمٌ” (mudzakkar) yang beraturan disebut jamak …", "Mudzakkar salim: مُسْلِمُونَ", ["Taksir", "Muannats salim", "Mutsanna"], "Jamak mudzakkar salim dibentuk dengan ون / ين: مُسْلِمُونَ."],
  ["Jamak muannats salim dari “مُعَلِّمَةٌ” adalah …", "مُعَلِّمَاتٌ", ["مُعَلِّمُونَ", "مَعَالِيمُ", "مُعَلِّمَتَانِ"], "Jamak muannats salim berakhiran ات: مُعَلِّمَةٌ → مُعَلِّمَاتٌ."],
  ["Bentuk mutsanna (dua) dari “طَالِبٌ” adalah …", "طَالِبَانِ", ["طُلَّابٌ", "طَالِبَاتٌ", "طَالِبٌ وَاحِدٌ"], "Mutsanna dibentuk dengan انِ: طَالِبَانِ = dua siswa."],
  ["Kata tunjuk “هٰذَا” dipakai untuk benda yang …", "Dekat dan mudzakkar", ["Jauh dan mudzakkar", "Dekat dan muannats", "Jamak jauh"], "هٰذَا = ini (dekat, laki-laki); هٰذِهِ = ini (perempuan); ذٰلِكَ = itu (laki-laki)."],
  ["Kata tunjuk “ذٰلِكَ” artinya …", "Itu (untuk laki-laki, jauh)", ["Ini (laki-laki)", "Ini (perempuan)", "Mereka"], "ذٰلِكَ = itu (mudzakkar jauh); تِلْكَ = itu (muannats jauh)."],
  ["Pada kalimat “الْعِلْمُ نَافِعٌ”, kata “نَافِعٌ” berkedudukan sebagai …", "Khabar", ["Mubtada'", "Fa'il", "Maf'ul bih"], "الْعِلْمُ = mubtada' (subjek), نَافِعٌ = khabar (predikat): ilmu itu bermanfaat."],
  ["Huruf jar “فِي” pada “فِي الْبَيْتِ” artinya …", "Di dalam / di", ["Dari", "Kepada", "Di atas"], "فِي = di (dalam); مِنْ = dari; إِلَى = ke/kepada; عَلَى = di atas."],
  ["Isim yang didahului huruf jar selalu berakhiran …", "Kasrah (majrur)", ["Fathah", "Dhammah", "Sukun"], "Huruf jar membuat isim sesudahnya majrur: berakhiran kasrah."],
  ["Fi'il mudhari' dari “كَتَبَ” (telah menulis) adalah …", "يَكْتُبُ", ["كَاتِبٌ", "اِكْتُبْ", "كِتَابَةٌ"], "كَتَبَ (madhi) → يَكْتُبُ (mudhari': sedang/akan menulis) → اُكْتُبْ (amr: tulislah!)."],
  ["Kata “لَنْ” sebelum fi'il mudhari' berfungsi untuk …", "Menaﬁkan masa yang akan datang (tidak akan)", ["Menguatkan perintah", "Menanyakan waktu", "Menunjukkan kepemilikan"], "لَنْ يَذْهَبَ = dia tidak akan pergi; fi'il sesudahnya manshub (fathah)."],
  ["Kata tanya “مَاذَا” artinya …", "Apa (yang …)?", ["Siapa?", "Di mana?", "Kapan?"], "مَاذَا = apa; مَنْ = siapa; أَيْنَ = di mana; مَتَى = kapan; كَيْفَ = bagaimana; كَمْ = berapa."],
  ["Kata tanya untuk menanyakan jumlah/bilangan adalah …", "كَمْ", ["مَنْ", "أَيْنَ", "لِمَاذَا"], "كَمْ عَدَدُ الطُّلَّابِ؟ = berapa jumlah siswa?"],
  ["Kata sambung “ثُمَّ” artinya …", "Kemudian / lalu", ["Dan (langsung)", "Atau", "Tetapi"], "وَ = dan; ثُمَّ = kemudian (ada jeda); أَوْ = atau; لٰكِنْ = tetapi."],
  ["Isim nakirah adalah isim yang menunjukkan makna …", "Umum / belum tertentu", ["Khusus / tertentu", "Nama orang", "Kata ganti"], "Nakirah: umum (bertanwin); ma'rifah: tertentu, misalnya berawalan ال atau nama diri."],
];

/* Angka Arab 1–100 dibangun dari tabel — jawaban selalu dihitung dari tabel yang sama. */
const AR_ONES: readonly string[] = ["وَاحِدٌ", "اِثْنَانِ", "ثَلَاثَةٌ", "أَرْبَعَةٌ", "خَمْسَةٌ", "سِتَّةٌ", "سَبْعَةٌ", "ثَمَانِيَةٌ", "تِسْعَةٌ", "عَشَرَةٌ"];
const AR_TEENS: readonly string[] = ["أَحَدَ عَشَرَ", "اِثْنَا عَشَرَ", "ثَلَاثَةَ عَشَرَ", "أَرْبَعَةَ عَشَرَ", "خَمْسَةَ عَشَرَ", "سِتَّةَ عَشَرَ", "سَبْعَةَ عَشَرَ", "ثَمَانِيَةَ عَشَرَ", "تِسْعَةَ عَشَرَ"];
const AR_TENS: readonly string[] = ["عِشْرُونَ", "ثَلَاثُونَ", "أَرْبَعُونَ", "خَمْسُونَ", "سِتُّونَ", "سَبْعُونَ", "ثَمَانُونَ", "تِسْعُونَ"];
export function arabNumberWord(n: number): string {
  if (n === 100) return "مِائَةٌ";
  if (n >= 1 && n <= 10) return AR_ONES[n - 1] as string;
  if (n >= 11 && n <= 19) return AR_TEENS[n - 11] as string;
  const ten = Math.floor(n / 10);
  const rem = n % 10;
  const tenWord = AR_TENS[ten - 2] as string;
  if (rem === 0) return tenWord;
  return `${AR_ONES[rem - 1]} وَ${tenWord}`;
}
export const arabNumGen: LGen = (level) => {
  const ranges: readonly (readonly [number, number])[] = [[1, 10], [1, 20], [11, 50], [21, 99], [1, 100]];
  const range = ranges[Math.min(5, Math.max(1, level)) - 1] ?? [1, 10];
  const n = ri(range[0], range[1]);
  const word = arabNumberWord(n);
  if (Math.random() < 0.5) {
    const ds = [n - 2, n - 1, n + 1, n + 2, n + 10, n - 10]
      .filter((x) => x >= 1 && x <= 100 && x !== n)
      .map((x) => arabNumberWord(x));
    return mkq(`Angka ${n} dalam Bahasa Arab adalah …`, word, ds, `${n} = ${word}.`);
  }
  const ds = [n - 2, n - 1, n + 1, n + 2, n + 10, n - 10].filter((x) => x >= 1 && x <= 100 && x !== n);
  return mkNum(`Kata “${word}” adalah angka …`, n, ds, `${word} = ${n}.`);
};
/* Kata tunjuk هذا / هذه dipilih dari tabel gender kata benda — selalu konsisten. */
const AR_ISYARAH_NOUNS: readonly (readonly [string, string, "m" | "f"])[] = [
  ["كِتَابٌ", "buku", "m"], ["قَلَمٌ", "pena", "m"], ["بَابٌ", "pintu", "m"], ["وَلَدٌ", "anak laki-laki", "m"],
  ["مَسْجِدٌ", "masjid", "m"], ["بَيْتٌ", "rumah", "m"], ["قَمَرٌ", "bulan", "m"], ["حِصَانٌ", "kuda", "m"],
  ["مَكْتَبٌ", "meja", "m"], ["كُرْسِيٌّ", "kursi", "m"], ["مَدْرَسَةٌ", "sekolah", "f"], ["سَيَّارَةٌ", "mobil", "f"],
  ["شَجَرَةٌ", "pohon", "f"], ["زَهْرَةٌ", "bunga", "f"], ["بِنْتٌ", "anak perempuan", "f"], ["شَمْسٌ", "matahari", "f"],
  ["نَافِذَةٌ", "jendela", "f"], ["حَقِيبَةٌ", "tas", "f"], ["سَاعَةٌ", "jam", "f"], ["بَقَرَةٌ", "sapi", "f"],
];
export const arabIsyarahGen: LGen = () => {
  const noun = pick(AR_ISYARAH_NOUNS);
  const word = noun[0];
  const arti = noun[1];
  const gender = noun[2];
  const near = gender === "m" ? "هٰذَا" : "هٰذِهِ";
  const far = gender === "m" ? "ذٰلِكَ" : "تِلْكَ";
  const otherNear = gender === "m" ? "هٰذِهِ" : "هٰذَا";
  const otherFar = gender === "m" ? "تِلْكَ" : "ذٰلِكَ";
  return mkq(
    `Kata tunjuk yang tepat untuk mengawali “${word}” (${arti}) adalah …`,
    near,
    [otherNear, far, otherFar],
    `“${word}” termasuk isim ${gender === "m" ? "mudzakkar (laki-laki)" : "muannats (perempuan)"}, jadi kata tunjuk dekatnya ${near}.`,
  );
};
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
  ["Cut Nyak Dien", "Aceh"], ["Pattimura (Thomas Matulessy)", "Maluku (Ambon)"], ["Pangeran Diponegoro", "Jawa Tengah (Yogyakarta)"],
  ["Tuanku Imam Bonjol", "Sumatera Barat"], ["Sultan Hasanuddin", "Sulawesi Selatan"], ["R.A. Kartini", "Jawa Tengah (Jepara)"],
  ["Jenderal Sudirman", "Jawa Tengah (Purbalingga)"], ["Bung Tomo (Sutomo)", "Jawa Timur (Surabaya)"],
  ["I Gusti Ngurah Rai", "Bali"], ["Martha Christina Tiahahu", "Maluku (Nusalaut)"],
];
export const DINASTI: readonly (readonly [string, string])[] = [
  ["Dinasti Umayyah", "Damaskus"], ["Dinasti Abbasiyah", "Bagdad"], ["Dinasti Fatimiyah", "Kairo"],
  ["Dinasti Umayyah II (Andalusia)", "Cordoba"], ["Kesultanan Utsmaniyah (Ottoman)", "Istanbul"], ["Dinasti Safawiyah", "Isfahan (Persia)"],
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
  // Pita kelas membatasi besar bilangan: Kelas 1 sampai 99, Kelas 2
  // sampai ratusan — walau level di dalam pitanya tinggi.
  const band = band01Now();
  const bandCap = band < 0 ? Number.POSITIVE_INFINITY : band <= 0.01 ? 99 : band <= 0.25 ? 500 : Number.POSITIVE_INFINITY;
  const max = Math.min([60, 300, 1500, 12000, 150000][level - 1] ?? 60, bandCap);
  const a = ri(5, max);
  const b = ri(4, max);
  if (Math.random() < 0.5) return mkNum(`Hasil dari ${fmt(a)} + ${fmt(b)} adalah …`, a + b, [a + b - 10, a + b + 10, a + b - 100], `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`);
  const [x, y] = a >= b ? [a, b] : [b, a];
  return mkNum(`Hasil dari ${fmt(x)} − ${fmt(y)} adalah …`, x - y, [x - y + 10, x - y - 10, x - y + 100].filter((v) => v >= 0), `${fmt(x)} − ${fmt(y)} = ${fmt(x - y)}.`);
};
const sdMulDiv: LGen = (level) => {
  // Kelas 2 (pita 0,2): perkalian & pembagian dasar saja — faktor dan
  // pembagi dibatasi bilangan kecil walau level di pitanya tinggi.
  const band = band01Now();
  if (band >= 0 && band <= 0.25) {
    if (Math.random() < 0.5) {
      const a = pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const b = ri(2, 10);
      return mkNum(`Hasil dari ${a} × ${b} adalah …`, a * b, [a * b - a, a * b + a, a * b + 2], `${a} × ${b} = ${a * b}.`);
    }
    const b = pick([2, 3, 4, 5, 10]);
    const q = ri(2, 10);
    return mkNum(`Hasil dari ${b * q} : ${b} adalah …`, q, [q - 1, q + 1, q + 2], `${b * q} : ${b} = ${q}, karena ${b} × ${q} = ${b * q}.`);
  }
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
  const tail = scene ? scene[1] : "";
  const wrong = sample(EN_PAST.filter((p) => p[1] !== v[1]), 3).map((p) => p[1]);
  return mkq(`Yesterday, ${name} ___${tail ? ` ${tail}` : ""}. (kata kerja: ${v[0]})`, v[1], wrong, `Bentuk lampau (past tense) dari “${v[0]}” adalah “${v[1]}”.`);
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
const PAI_ORDER_GEN: LGen = (_level) => {
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
  return mkNum(`Gradien garis yang melalui titik (${x1}, ${y1}) dan (${x2}, ${y2}) adalah …`, m, [m + 1, m === 1 ? m + 3 : m - 1, m + 2], `m = (y₂−y₁)/(x₂−x₁) = (${y2}−${y1})/(${x2}−${x1}) = ${m * dx}/${dx} = ${m}.`);
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
  // Pengecoh wajib bernilai pecahan BERBEDA dari kunci (mis. 2/4 sama nilainya
  // dengan 1/2 sehingga tidak boleh jadi pengecoh) dan berbeda satu sama lain.
  const seenVal = new Set<string>([`${red / g}/${total / g}`]);
  const ds: string[] = [];
  for (const [n, d] of [[red, total + 2], [red + 1, total], [blue, total + 2], [red + 1, total + 1], [blue + 1, total + 1]] as const) {
    const gg = gcd(n, d);
    const key = `${n / gg}/${d / gg}`;
    if (seenVal.has(key)) continue;
    seenVal.add(key);
    ds.push(`${n}/${d}`);
    if (ds.length === 3) break;
  }
  if (ds.length < 3) return null;
  return mkq(`Dalam kantong ada ${red} kelereng merah dan ${blue} kelereng biru. Peluang mengambil satu kelereng merah adalah …`, `${red / g}/${total / g}`, ds, `Peluang = jumlah merah : total = ${red} : ${total} = ${red / g}/${total / g}.`);
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
const smaLog: LGen = (_level) => {
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
  if (Math.random() < 0.5) return mkNum(`pH larutan HCl 10⁻${n} M (0,${"0".repeat(Math.max(0, n - 1))}1 M) adalah …`, n, [n + 1, n === 1 ? n + 2 : n - 1, 14 - n], `HCl asam kuat: [H⁺] = 10⁻${n} → pH = ${n}.`);
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
  ["Benda najis yang berasal dari bangkai dan darah termasuk najis …", "Mutawassithah (sedang)", ["Mukhaffafah (ringan)", "Mughallazhah (berat)", "Ma'fu (dimaafkan)"], "Najis sedang: darah, nanah, bangkai. Mughallazhah (berat): anjing & babi."],
  ["Najis yang berasal dari anjing dan babi termasuk najis …", "Mughallazhah (berat)", ["Mukhaffafah (ringan)", "Mutawassithah (sedang)", "Ma'fu (dimaafkan)"], "Najis berat disucikan dengan 7 kali basuhan, salah satunya dicampur tanah/debu yang suci."],
  ["Air kencing bayi laki-laki di bawah 2 tahun yang hanya minum ASI termasuk najis …", "Mukhaffafah (ringan)", ["Mughallazhah (berat)", "Mutawassithah (sedang)", "Bukan najis"], "Cara menyucikannya cukup memercikkan air."],
  ["Salat Jumat hukumnya bagi laki-laki muslim yang memenuhi syarat adalah …", "Wajib (fardu ain)", ["Sunah muakadah", "Fardu kifayah", "Makruh"], "Salat Jumat fardu ain bagi laki-laki (QS Al-Jumu'ah: 9)."],
];

/* ================================================================
   GENERATOR MATEMATIKA BARU — semua jawaban DIHITUNG dari parameter
   soal (tidak ada kunci yang diketik manual), untuk TK–SMA Level 1–5.
   ================================================================ */
/* --- TK --- */
const tkBeforeAfter: LGen = (level) => {
  const max = 5 + level * 5;
  const n = ri(2, max);
  const before = Math.random() < 0.5;
  const ans = before ? n - 1 : n + 1;
  return mkNum(`Angka ${before ? "SEBELUM" : "SESUDAH"} ${n} adalah …`, ans, [ans - 1, ans + 1, n + (before ? 1 : -1) * 2].filter((x) => x >= 0 && x !== ans), `Urutannya: ${before ? `${ans}, ${n}` : `${n}, ${ans}`} — jadi ${before ? "sebelum" : "sesudah"} ${n} adalah ${ans}.`, "🔢", false);
};
const tkStoryCount: LGen = (level) => {
  const name = pick(NAMES);
  const item = pick(ITEMS_ID);
  const a = ri(2, 4 + level * 2);
  const b = ri(1, 3 + level);
  if (Math.random() < 0.5) {
    return mkNum(`${name} punya ${a} ${item}. Lalu diberi ${b} ${item} lagi. Sekarang ${item} ${name} ada …`, a + b, [a + b - 1, a + b + 1, a].filter((x) => x > 0), `${a} + ${b} = ${a + b} ${item}.`, "🎁", false);
  }
  const lost = Math.min(b, a - 1);
  return mkNum(`${name} punya ${a} ${item}. Sebanyak ${lost} ${item} diberikan ke temannya. Sisa ${item} ${name} ada …`, a - lost, [a - lost + 1, a - lost - 1, a].filter((x) => x >= 0), `${a} − ${lost} = ${a - lost} ${item}.`, "🎁", false);
};
const TK_SHAPE_FACTS: readonly Fact[] = [
  ["Bangun segitiga mempunyai … sisi", "3 sisi", ["2 sisi", "4 sisi"], "Segitiga: 3 sisi dan 3 sudut."],
  ["Bangun persegi mempunyai … sisi yang sama panjang", "4 sisi", ["3 sisi", "5 sisi"], "Persegi: 4 sisi sama panjang."],
  ["Bangun lingkaran mempunyai … sudut", "0 sudut", ["1 sudut", "4 sudut"], "Lingkaran melengkung, tidak punya sudut."],
  ["Bangun segilima (pentagon) mempunyai … sisi", "5 sisi", ["4 sisi", "6 sisi"], "Segilima = 5 sisi."],
  ["Bangun segienam (heksagon) mempunyai … sisi", "6 sisi", ["5 sisi", "8 sisi"], "Segienam = 6 sisi."],
  ["Roda sepeda berbentuk …", "Lingkaran", ["Segitiga", "Persegi"], "Roda berbentuk lingkaran supaya bisa menggelinding."],
  ["Rambu lalu lintas “berhenti” (stop) umumnya berbentuk …", "Segidelapan", ["Segitiga", "Lingkaran"], "Rambu STOP berbentuk segidelapan (oktagon)."],
];
/* --- SD --- */
const sdRound: LGen = (level) => {
  if (level < 2) return null;
  if (level < 4) {
    const n = ri(12, 995);
    const rounded = Math.round(n / 10) * 10;
    return mkNum(`Bilangan ${fmt(n)} dibulatkan ke puluhan terdekat menjadi …`, rounded, [rounded - 10, rounded + 10, Math.floor(n / 10) * 10 === rounded ? rounded + 10 : Math.floor(n / 10) * 10], `Angka satuan ${n % 10} ${n % 10 >= 5 ? "≥ 5, bulatkan ke atas" : "< 5, bulatkan ke bawah"} → ${fmt(rounded)}.`);
  }
  const n = ri(120, 9950);
  const rounded = Math.round(n / 100) * 100;
  return mkNum(`Bilangan ${fmt(n)} dibulatkan ke ratusan terdekat menjadi …`, rounded, [rounded - 100, rounded + 100, Math.floor(n / 100) * 100 === rounded ? rounded + 100 : Math.floor(n / 100) * 100], `Lihat angka puluhannya (${Math.floor(n / 10) % 10}) → dibulatkan menjadi ${fmt(rounded)}.`);
};
const sdPercent: LGen = (level) => {
  if (level < 3) return null;
  const pct = pick([10, 20, 25, 50, 75]);
  const base = pick([100, 200, 240, 300, 400, 500, 600, 800, 1000]) * (level >= 5 ? ri(1, 3) : 1);
  const v = (pct * base) / 100;
  return mkNum(`Hasil dari ${pct}% dari ${fmt(base)} adalah …`, v, [v + base / 10, Math.max(1, v - base / 20), v * 2], `${pct}% × ${fmt(base)} = ${fmt(v)}.`);
};
const sdClock: LGen = (level) => {
  if (level < 2) return null;
  const h = ri(6, 15);
  const m = pick([0, 15, 30, 45]);
  const durH = level >= 4 ? ri(1, 3) : ri(1, 2);
  const durM = level >= 3 ? pick([0, 15, 30, 45]) : 0;
  const total = h * 60 + m + durH * 60 + durM;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  const ans = `${String(eh).padStart(2, "0")}.${String(em).padStart(2, "0")}`;
  const wrongMin = (total + 30) % (24 * 60);
  const wrong = [
    `${String(Math.floor(wrongMin / 60)).padStart(2, "0")}.${String(wrongMin % 60).padStart(2, "0")}`,
    `${String((eh + 1) % 24).padStart(2, "0")}.${String(em).padStart(2, "0")}`,
    `${String(eh).padStart(2, "0")}.${String((em + 15) % 60).padStart(2, "0")}`,
  ].filter((w) => w !== ans);
  return mkq(`Sebuah kegiatan mulai pukul ${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")} dan berlangsung ${durH} jam${durM ? ` ${durM} menit` : ""}. Kegiatan selesai pukul …`, ans, wrong, `${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")} + ${durH} jam${durM ? ` ${durM} menit` : ""} = ${ans}.`);
};
const sdUnit: LGen = (level) => {
  if (level < 2) return null;
  const units: readonly (readonly [string, string, number])[] = [
    ["km", "m", 1000], ["m", "cm", 100], ["kg", "g", 1000], ["jam", "menit", 60],
    ["menit", "detik", 60], ["minggu", "hari", 7], ["tahun", "bulan", 12], ["lusin", "buah", 12],
  ];
  const u = pick(units);
  const qty = ri(2, level >= 4 ? 25 : 12);
  const ans = qty * u[2];
  return mkNum(`Hasil dari ${qty} ${u[0]} = … ${u[1]}`, ans, [ans - u[2], ans + u[2], qty * (u[2] === 1000 ? 100 : u[2] * 10)], `1 ${u[0]} = ${fmt(u[2])} ${u[1]}, jadi ${qty} ${u[0]} = ${qty} × ${fmt(u[2])} = ${fmt(ans)} ${u[1]}.`);
};
const sdFracCompare: LGen = (level) => {
  if (level < 3) return null;
  const b = pick([3, 4, 5, 6, 8]);
  const d = pick([3, 4, 5, 6, 8].filter((x) => x !== b));
  const a = ri(1, b - 1);
  const c = ri(1, d - 1);
  const left = a * d;
  const right = c * b;
  if (left === right) return sdFracCompare(level);
  const bigger = left > right ? `${a}/${b}` : `${c}/${d}`;
  const smaller = left > right ? `${c}/${d}` : `${a}/${b}`;
  return mkq(`Pecahan yang LEBIH BESAR antara ${a}/${b} dan ${c}/${d} adalah …`, bigger, [smaller, "Sama besar", `${a + c}/${b + d}`], `Samakan penyebut / kali silang: ${a}×${d}=${left} dibanding ${c}×${b}=${right}. Yang lebih besar adalah ${bigger}.`, undefined, false);
};
/* ---------- Topik khas KELAS — Matematika SD ----------
   Isi soal mengikuti kurikulum kelas terpilih (dibaca dari pita kelas
   aktif lewat band01Now): Kelas 1 bilangan s.d. 99 & tambah–kurang
   sederhana; Kelas 2 ratusan & perkalian dasar; Kelas 3 perkalian–
   pembagian & pecahan sederhana; Kelas 4 pecahan senilai, desimal &
   kelipatan; Kelas 5 pecahan beda penyebut, persen & volume; Kelas 6
   persen belanja, skala & data. Tanpa pita kelas generator ini diam
   (null), jadi Mode Kelas Ujian guru tidak berubah. Semua kunci
   DIHITUNG kode dari parameter soal. */
const fracStr = (n: number, d: number): string => {
  const g = gcd(Math.abs(n), Math.abs(d));
  return `${n / g}/${d / g}`;
};
const dec1 = (x: number): string => (Math.round(x * 10) / 10).toFixed(1).replace(".", ",");
export const sdGradeMath: LGen = (level) => {
  const band = band01Now();
  if (band < 0) return null;
  const kind = ri(0, 2);
  /* Kelas 1 — bilangan sampai 99, tambah–kurang sederhana, urutan bilangan */
  if (band <= 0.01) {
    const max = [10, 20, 20, 50, 99][level - 1] ?? 20;
    if (kind === 0) {
      const a = ri(2, max);
      const b = ri(1, max);
      if (Math.random() < 0.5) return mkNum(`Hasil dari ${a} + ${b} adalah …`, a + b, [a + b - 1, a + b + 1, a + b + 2, a + b - 2].filter((x) => x >= 0), `${a} + ${b} = ${a + b}.`, "🔢");
      const [x, y] = a >= b ? [a, b] : [b, a];
      return mkNum(`Hasil dari ${x} − ${y} adalah …`, x - y, [x - y + 1, x - y - 1, x - y + 2, x - y + 10].filter((v) => v >= 0), `${x} − ${y} = ${x - y}.`, "🔢");
    }
    if (kind === 1) {
      const set = sample(Array.from({ length: max }, (_, i) => i + 1), 4);
      const biggest = Math.random() < 0.5;
      const ans = biggest ? Math.max(...set) : Math.min(...set);
      return mkq(`Perhatikan bilangan: ${set.join(", ")}. Bilangan yang paling ${biggest ? "BESAR" : "KECIL"} adalah …`, String(ans), set.filter((v) => v !== ans).map(String), `Urutkan dulu: ${[...set].sort((p, q) => p - q).join(" < ")}. Paling ${biggest ? "besar" : "kecil"} adalah ${ans}.`, "🔢");
    }
    const step = pick([1, 2, 5, 10]);
    const start = ri(1, 40);
    const seq = [0, 1, 2, 3].map((i) => start + i * step);
    const ans = start + 4 * step;
    return mkNum(`Pola bilangan: ${seq.join(", ")}, … Bilangan berikutnya adalah …`, ans, [ans - step, ans + step, ans + 1, ans - 1].filter((v) => v > 0 && v !== ans), `Polanya selalu +${step}, jadi setelah ${seq[3]} adalah ${ans}.`, "🔢");
  }
  /* Kelas 2 — tambah–kurang ratusan, perkalian sebagai penjumlahan berulang, berbagi rata */
  if (band <= 0.25) {
    if (kind === 0) {
      const a = ri(15, 90 + level * 30);
      const b = ri(11, 90 + level * 20);
      if (Math.random() < 0.5) return mkNum(`Hasil dari ${a} + ${b} adalah …`, a + b, [a + b - 10, a + b + 10, a + b - 1, a + b + 1], `${a} + ${b} = ${a + b}. Jumlahkan satuan dengan satuan, puluhan dengan puluhan.`);
      const [x, y] = a >= b ? [a, b] : [b, a];
      return mkNum(`Hasil dari ${x} − ${y} adalah …`, x - y, [x - y + 10, x - y - 10, x - y + 1, x - y - 1].filter((v) => v >= 0), `${x} − ${y} = ${x - y}.`);
    }
    if (kind === 1) {
      const a = pick([2, 3, 4, 5, 10]);
      const b = ri(2, 10);
      return mkNum(`Hasil dari ${a} × ${b} adalah …`, a * b, [a * b - a, a * b + a, a * (b + 1), a * b + 2], `${a} × ${b} artinya ${a} dijumlahkan ${b} kali = ${a * b}.`);
    }
    const d = pick([2, 5, 10]);
    const q = ri(2, 9);
    return mkNum(`${pick(NAMES)} punya ${d * q} permen, dibagikan sama rata kepada ${d} anak. Setiap anak menerima … permen`, q, [q - 1, q + 1, q + 2, d].filter((v) => v > 0 && v !== q), `${d * q} : ${d} = ${q}, karena ${d} × ${q} = ${d * q}.`);
  }
  /* Kelas 3 — perkalian dua angka, pembagian dasar, pecahan sederhana dari benda utuh */
  if (band <= 0.45) {
    if (kind === 0) {
      const a = ri(12, 25 + level * 6);
      const b = ri(3, 9);
      return mkNum(`Hasil dari ${a} × ${b} adalah …`, a * b, [a * b - a, a * b + b, a * b + 10, a * b - 10], `${a} × ${b} = ${a * b}.`);
    }
    if (kind === 1) {
      const b = ri(3, 9);
      const q = ri(11, 25 + level * 3);
      return mkNum(`Hasil dari ${b * q} : ${b} adalah …`, q, [q - 1, q + 1, q + 2, q - 2], `${b * q} : ${b} = ${q}, karena ${b} × ${q} = ${b * q}.`);
    }
    const den = pick([2, 3, 4, 6, 8]);
    const num = ri(1, den - 1);
    const ans = `${num}/${den}`;
    const wrong = [`${num}/${den + 1}`, `${num + 1}/${den}`, `${den - num}/${den}`, `${num}/${den + 2}`].filter((w) => w !== ans);
    return mkq(`Sebuah pizza dipotong menjadi ${den} bagian sama besar. ${pick(NAMES)} mengambil ${num} potong. Bagian pizza yang diambil adalah …`, ans, wrong, `Satu potong adalah 1/${den} bagian, jadi ${num} potong = ${num}/${den}.`, "🍕");
  }
  /* Kelas 4 — pecahan senilai, desimal uang/panjang, kelipatan bilangan */
  if (band <= 0.65) {
    if (kind === 0) {
      const b = pick([3, 4, 5, 6, 8]);
      const a = ri(1, b - 1);
      const k = ri(2, 5);
      const ans = `${a * k}/${b * k}`;
      const wrong = [`${a + 1}/${b}`, `${a}/${b + 1}`, `${a * k}/${b * k + k}`, `${a + 1}/${b + 1}`].filter((w) => w !== ans);
      return mkq(`Pecahan yang SENILAI dengan ${a}/${b} adalah …`, ans, wrong, `Kalikan pembilang dan penyebut dengan bilangan yang sama: ${a}×${k}/${b}×${k} = ${ans}.`);
    }
    if (kind === 1) {
      const a = ri(11, 95) / 10;
      const b = ri(11, 95) / 10;
      const sum = Math.round((a + b) * 10) / 10;
      const wrong = [sum + 0.1, sum - 0.1, sum + 1, sum - 1].filter((v) => v > 0).map(dec1);
      return mkq(`Hasil dari ${dec1(a)} + ${dec1(b)} adalah …`, dec1(sum), wrong, `Jumlahkan bagian desimalnya sejajar koma: ${dec1(a)} + ${dec1(b)} = ${dec1(sum)}.`);
    }
    const base = pick([3, 4, 6, 7, 8, 9]);
    const n = ri(4, 9);
    return mkNum(`Kelipatan ${base} yang ke-${n} adalah …`, base * n, [base * (n - 1), base * (n + 1), base * n + base + 1], `Kelipatan ${base}: ${base}, ${base * 2}, ${base * 3}, … yang ke-${n} adalah ${base} × ${n} = ${base * n}.`);
  }
  /* Kelas 5 — pecahan beda penyebut, persen dari jumlah, volume kubus */
  if (band <= 0.85) {
    if (kind === 0) {
      const d1 = pick([2, 3, 4, 6]);
      const d2 = pick([2, 3, 4, 6, 8].filter((x) => x !== d1 && lcm(x, d1) <= 24));
      const a = ri(1, d1 - 1);
      const b = ri(1, d2 - 1);
      const L = lcm(d1, d2);
      const num = a * (L / d1) + b * (L / d2);
      if (num >= 2 * L) return sdGradeMath(level);
      const ans = fracStr(num, L);
      const wrong = [fracStr(a + b, d1 + d2), fracStr(num + 1, L), fracStr(num - 1, L), fracStr(a + b, L)].filter((w) => w !== ans);
      return mkq(`Hasil dari ${a}/${d1} + ${b}/${d2} adalah …`, ans, wrong, `Samakan penyebutnya menjadi ${L}: ${a}/${d1} = ${a * (L / d1)}/${L} dan ${b}/${d2} = ${b * (L / d2)}/${L}, jumlahnya ${num}/${L}${ans !== `${num}/${L}` ? ` = ${ans}` : ""}.`);
    }
    if (kind === 1) {
      const pct = pick([10, 20, 25, 50, 75]);
      const base = pick([100, 200, 300, 400, 500, 600, 800, 1000]);
      const ans = (base * pct) / 100;
      return mkNum(`${pct}% dari ${fmt(base)} adalah …`, ans, [ans + base / 10, Math.max(1, ans - base / 10), base - ans, ans + 10].filter((v) => v !== ans), `${pct}% × ${fmt(base)} = ${fmt(ans)}.`);
    }
    const s = ri(2, 9);
    return mkNum(`Volume kubus dengan rusuk ${s} cm adalah … cm³`, s * s * s, [s * s, 3 * s, s * s * s + s * s, 6 * s * s].filter((v) => v !== s * s * s), `Volume kubus = rusuk × rusuk × rusuk = ${s} × ${s} × ${s} = ${s * s * s} cm³.`);
  }
  /* Kelas 6 — persen belanja/diskon, skala peta, median & modus data */
  if (kind === 0) {
    const price = pick([40000, 50000, 60000, 80000, 100000, 120000, 150000, 200000]);
    const pct = pick([10, 15, 20, 25, 30, 50]);
    const disc = (price * pct) / 100;
    const pay = price - disc;
    return mkNum(`Sebuah tas berharga Rp${fmt(price)} didiskon ${pct}%. Harga yang harus dibayar adalah …`, pay, [disc, pay + disc / 2, price - pct * 100, pay + 10000].filter((v) => v > 0 && v !== pay), `Diskon = ${pct}% × Rp${fmt(price)} = Rp${fmt(disc)}. Bayar = Rp${fmt(price)} − Rp${fmt(disc)} = Rp${fmt(pay)}.`);
  }
  if (kind === 1) {
    const cm = ri(2, 12);
    return mkNum(`Pada peta berskala 1 : 100.000, jarak dua kota adalah ${cm} cm. Jarak sebenarnya adalah … km`, cm, [cm - 1, cm + 1, cm * 10, cm + 10].filter((v) => v > 0 && v !== cm), `Jarak sebenarnya = ${cm} × 100.000 cm = ${fmt(cm * 100000)} cm = ${cm} km.`);
  }
  const vals = Array.from({ length: 5 }, () => ri(3, 15));
  const sorted = [...vals].sort((p, q) => p - q);
  const med = sorted[2] as number;
  const mean = Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  const wrong = [sorted[0] as number, sorted[4] as number, Math.round(mean), med + 1].filter((v) => v !== med);
  return mkNum(`Data nilai ulangan: ${vals.join(", ")}. Nilai tengah (median) data itu adalah …`, med, wrong, `Urutkan dulu: ${sorted.join(", ")}. Nilai tengahnya adalah data ke-3, yaitu ${med}.`);
};

export const ROMAN_PAIRS: readonly (readonly [string, string])[] = [
  ["1", "I"], ["2", "II"], ["3", "III"], ["4", "IV"], ["5", "V"], ["6", "VI"], ["7", "VII"], ["8", "VIII"],
  ["9", "IX"], ["10", "X"], ["11", "XI"], ["12", "XII"], ["14", "XIV"], ["15", "XV"], ["19", "XIX"],
  ["20", "XX"], ["24", "XXIV"], ["30", "XXX"], ["40", "XL"], ["50", "L"], ["90", "XC"], ["100", "C"],
];
/* --- SMP --- */
const smpDiscount: LGen = (level) => {
  if (level < 2) return null;
  const price = pick([50000, 80000, 100000, 120000, 150000, 200000, 250000, 400000]);
  const disc = pick([10, 20, 25, 30, 40, 50]);
  const pay = price - (price * disc) / 100;
  return mkNum(`Sebuah tas berharga Rp${fmt(price)} mendapat diskon ${disc}%. Harga yang harus dibayar adalah …`, pay, [price - disc * 1000, pay + price / 10, price], `Diskon = ${disc}% × ${fmt(price)} = Rp${fmt((price * disc) / 100)}. Bayar = ${fmt(price)} − ${fmt((price * disc) / 100)} = Rp${fmt(pay)}.`);
};
const smpProfit: LGen = (level) => {
  if (level < 3) return null;
  const buy = pick([20000, 25000, 40000, 50000, 80000, 100000]);
  const pct = pick([5, 10, 20, 25, 40, 50]);
  const profit = Math.random() < 0.6;
  const sell = profit ? buy + (buy * pct) / 100 : buy - (buy * pct) / 100;
  return mkq(`Pedagang membeli barang seharga Rp${fmt(buy)} lalu menjualnya seharga Rp${fmt(sell)}. Persentase ${profit ? "keuntungan" : "kerugian"}nya adalah …`, `${pct}%`, [`${pct - 5}%`, `${pct + 5}%`, `${pct * 2}%`].filter((w) => !w.startsWith("-") && w !== `${pct}%`), `${profit ? "Untung" : "Rugi"} = Rp${fmt(Math.abs(sell - buy))}; ${fmt(Math.abs(sell - buy))} : ${fmt(buy)} × 100% = ${pct}%.`);
};
const smpPythag: LGen = (level) => {
  if (level < 3) return null;
  const triples: readonly (readonly [number, number, number])[] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [10, 24, 26]];
  const t = pick(triples);
  const a = t[0]; const b = t[1]; const c = t[2];
  if (Math.random() < 0.5) {
    return mkNum(`Segitiga siku-siku mempunyai sisi tegak ${a} cm dan ${b} cm. Panjang sisi miringnya (hipotenusa) adalah … cm`, c, [c - 1, c + 2, a + b], `c = √(${a}² + ${b}²) = √${a * a + b * b} = ${c} cm.`);
  }
  return mkNum(`Segitiga siku-siku mempunyai sisi miring ${c} cm dan satu sisi tegak ${a} cm. Sisi tegak lainnya adalah … cm`, b, [b - 2, b + 1, c - a], `b = √(${c}² − ${a}²) = √${c * c - a * a} = ${b} cm.`);
};
const smpCircle: LGen = (level) => {
  if (level < 2) return null;
  const r = pick([7, 14, 21, 28, 35]);
  if (Math.random() < 0.5) {
    const k = 2 * (22 / 7) * r;
    return mkNum(`Keliling lingkaran dengan jari-jari ${r} cm (π = 22/7) adalah … cm`, k, [k - 14, k + 22, (22 / 7) * r], `K = 2πr = 2 × 22/7 × ${r} = ${k} cm.`);
  }
  const area = (22 / 7) * r * r;
  return mkNum(`Luas lingkaran dengan jari-jari ${r} cm (π = 22/7) adalah … cm²`, area, [area - 154, 2 * (22 / 7) * r, area + 154], `L = πr² = 22/7 × ${r}² = ${fmt(area)} cm².`);
};
const smpVolume: LGen = (level) => {
  if (Math.random() < 0.5) {
    const s = ri(3, 8 + level * 2);
    return mkNum(`Volume kubus dengan rusuk ${s} cm adalah … cm³`, s * s * s, [s * s * 6, s * s, s * 12], `V = ${s}³ = ${fmt(s * s * s)} cm³.`);
  }
  const p = ri(4, 12 + level);
  const l = ri(3, 9);
  const t = ri(2, 8);
  const v = p * l * t;
  return mkNum(`Volume balok berukuran ${p} cm × ${l} cm × ${t} cm adalah … cm³`, v, [v + p * l, 2 * (p * l + p * t + l * t), v - t], `V = p×l×t = ${p}×${l}×${t} = ${fmt(v)} cm³.`);
};
const smpAngles: LGen = (_level) => {
  const x = ri(15, 80);
  if (Math.random() < 0.5) {
    return mkNum(`Sudut yang berpenyiku (komplemen) dengan sudut ${x}° adalah …`, 90 - x, [90 - x + 10, 180 - x, x + 15], `Dua sudut berpenyiku jumlahnya 90° → 90 − ${x} = ${90 - x}°.`);
  }
  const y = ri(95, 170);
  return mkNum(`Sudut yang berpelurus (suplemen) dengan sudut ${y}° adalah …`, 180 - y, [180 - y + 10, 180 - y + 20, 270 - y], `Dua sudut berpelurus jumlahnya 180° → 180 − ${y} = ${180 - y}°.`);
};
const smpTwoVar: LGen = (level) => {
  if (level < 4) return null;
  const x = ri(3, 20);
  const y = ri(2, x - 1);
  const s = x + y;
  const d = x - y;
  return mkNum(`Jika x + y = ${s} dan x − y = ${d}, maka nilai x adalah …`, x, [y, x + 1, s - x + 2], `Jumlahkan kedua persamaan: 2x = ${s} + ${d} = ${s + d} → x = ${x}. (y = ${y})`);
};
/* --- SMA --- */
const smaQuadratic: LGen = () => {
  const r1 = pick([-9, -7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8]);
  let r2 = pick([-8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7, 9]);
  if (r2 === r1) r2 = r1 + 2;
  const sum = r1 + r2;
  const prod = r1 * r2;
  // Persamaan (x − r1)(x − r2) = x² − (sum)x + (prod), ditulis dengan tanda yang rapi.
  const bTerm = sum === 0 ? "" : sum > 0 ? ` − ${sum}x` : ` + ${-sum}x`;
  const cTerm = prod === 0 ? "" : prod > 0 ? ` + ${prod}` : ` − ${-prod}`;
  const eq = `x²${bTerm}${cTerm} = 0`;
  const mode = ri(0, 2);
  if (mode === 0) return mkNum(`Jumlah akar-akar persamaan kuadrat ${eq} adalah …`, sum, [sum - 2, sum + 2, prod], `Faktornya (x − (${r1}))(x − (${r2})), akar-akarnya ${r1} dan ${r2}; jumlahnya ${r1} + ${r2} = ${sum}.`);
  if (mode === 1) return mkNum(`Hasil kali akar-akar persamaan kuadrat ${eq} adalah …`, prod, [prod - r1, prod + r2, sum], `Akar-akarnya ${r1} dan ${r2}; hasil kalinya ${r1} × ${r2} = ${prod} (= c/a).`);
  return mkNum(`Jika ${r1} dan ${r2} adalah akar-akar suatu persamaan kuadrat, maka nilai (${r1})² + (${r2})² adalah …`, r1 * r1 + r2 * r2, [sum * sum, prod * 2, r1 * r1 + r2 * r2 + 2], `(${r1})² + (${r2})² = ${r1 * r1} + ${r2 * r2} = ${r1 * r1 + r2 * r2}.`);
};
const smaGeomSeries: LGen = (level) => {
  const a = ri(1, 6);
  const r = pick([2, 3]);
  const n = ri(4, 7);
  const un = a * r ** (n - 1);
  if (level >= 4 && Math.random() < 0.5) {
    const sn = (a * (r ** n - 1)) / (r - 1);
    return mkNum(`Jumlah ${n} suku pertama deret geometri ${a}, ${a * r}, ${a * r * r}, … adalah …`, sn, [sn - un, un * n, sn + a], `Sn = a(rⁿ−1)/(r−1) = ${a}×(${r ** n}−1)/${r - 1} = ${fmt(sn)}.`);
  }
  return mkNum(`Suku ke-${n} barisan geometri ${a}, ${a * r}, ${a * r * r}, … adalah …`, un, [a * r ** (n - 2), un + a, un * r], `Un = a·rⁿ⁻¹ = ${a}×${r}^${n - 1} = ${fmt(un)}.`);
};
const smaDet: LGen = (level) => {
  if (level < 2) return null;
  const a = ri(1, 6); const b = ri(1, 6); const c = ri(1, 6); const d = ri(1, 6);
  const det = a * d - b * c;
  return mkNum(`Determinan matriks [[${a}, ${b}], [${c}, ${d}]] adalah …`, det, [a * d + b * c, det + b, det - c], `det = ${a}×${d} − ${b}×${c} = ${a * d} − ${b * c} = ${det}.`);
};
const smaPerm: LGen = (level) => {
  if (level < 3) return null;
  if (Math.random() < 0.5) {
    const n = ri(4, 7);
    let f = 1; for (let i = 2; i <= n; i++) f *= i;
    return mkNum(`Nilai dari ${n}! (faktorial) adalah …`, f, [f / 2, f + n, f * 2], `${n}! = ${Array.from({ length: n }, (_, i) => i + 1).join(" × ")} = ${fmt(f)}.`);
  }
  const n = ri(5, 9);
  const r = pick([2, 3]);
  let p = 1; for (let i = 0; i < r; i++) p *= n - i;
  return mkNum(`Banyak susunan (permutasi) ${r} orang dari ${n} orang yang tersedia adalah …`, p, [p / (n - r + 1) * r, p + n, p - n], `P(${n},${r}) = ${Array.from({ length: r }, (_, i) => n - i).join(" × ")} = ${fmt(p)}.`);
};
const TRIG_FACTS: readonly Fact[] = [
  ["Nilai sin 30° adalah …", "1/2", ["√3/2", "1", "0"], "Sudut istimewa: sin 30° = 1/2, cos 30° = √3/2."],
  ["Nilai cos 60° adalah …", "1/2", ["√3/2", "√2/2", "0"], "cos 60° = 1/2 (pasangan sin 30°)."],
  ["Nilai tan 45° adalah …", "1", ["1/2", "√3", "1/√3"], "tan 45° = sin/cos = (√2/2)/(√2/2) = 1."],
  ["Nilai sin 90° adalah …", "1", ["0", "1/2", "√3/2"], "sin mencapai maksimum 1 pada 90°."],
  ["Nilai cos 0° adalah …", "1", ["0", "1/2", "-1"], "cos 0° = 1; sin 0° = 0."],
  ["Nilai sin 60° adalah …", "√3/2", ["1/2", "√2/2", "1"], "sin 60° = √3/2 ≈ 0,866."],
  ["Nilai tan 30° adalah …", "1/√3", ["1", "√3", "1/2"], "tan 30° = (1/2)/(√3/2) = 1/√3."],
  ["Nilai sin²x + cos²x untuk setiap x adalah …", "1", ["0", "2", "Bergantung pada x"], "Identitas Pythagoras: sin²x + cos²x = 1."],
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
  ...["Wajahnya bersinar seperti bulan purnama.", "Hatinya lembut seperti kapas.", "Suaranya merdu bak buluh perindu."].map((x) => ({ item: x, cat: "Simile" })),
  ...["Dia adalah bintang kelas yang selalu bersinar.", "Waktu adalah uang.", "Kampung halamanku, surga kecilku."].map((x) => ({ item: x, cat: "Metafora" })),
  ...["Suaranya menggelegar membelah angkasa.", "Aku sudah meneleponmu sejuta kali!", "Tangisannya membanjiri seluruh ruangan."].map((x) => ({ item: x, cat: "Hiperbola" })),
] as const;

const jawaGens = (jenjang: JenjangId): LGen[] => [
  pairGenL({ pairs: JAWA_KRAMA, askA: (a) => `Basa krama alus saka “${a}” yaiku …`, askB: (b) => `Tembung krama “${b}” iku ngoko/lugu-ne …`, exA: (a, b) => `Krama alus “${a.split(" (")[0]}” yaiku “${b}”.`, exB: (a, b) => `“${b}” iku krama alus saka “${a.split(" (")[0]}”.` }),
  pairGenL({ pairs: JAWA_VOCAB, askA: (a) => `Bahasa Jawa dari “${a}” adalah …`, askB: (b) => `“${b}” artinya …`, exA: (a, b) => `“${a}” dalam Bahasa Jawa: ${b}.`, exB: (a, b) => `${b} artinya “${a}”.` }),
  ...(jenjang !== "TK" ? [pairGenL({ pairs: JAWA_AKSARA, askA: (a) => `Aksara Jawa untuk bunyi “${a}” adalah …`, askB: (b) => `Aksara Jawa “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b} (hanacaraka).`, exB: (a, b) => `${b} dibaca “${a}”.` })] : []),
];

/** Set generator Bahasa Arab per jenjang — bank kosakata besar + angka prosedural + nahwu. */
const arabGens = (jenjang: JenjangId): LGen[] => {
  const gens: LGen[] = [
    pairGenL({ pairs: ARAB_VOCAB, askA: (a) => `Kata “${a}” artinya …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
    pairGenL({ pairs: ARAB_VOCAB2, askA: (a) => `Kata “${a}” artinya …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
    pairGenL({ pairs: DHAMIR, askA: (a) => `Dhamir “${a}” artinya …`, askB: (b) => `Dhamir untuk “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” = ${a}.` }),
    pairGenL({ pairs: ARAB_WARNA, askA: (a) => `Warna “${a}” artinya …`, askB: (b) => `Bahasa Arab dari warna “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `Warna ${b}: ${a}.` }),
    pairGenL({ pairs: ARAB_KELUARGA, askA: (a) => `Kata “${a}” artinya …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
    arabNumGen,
  ];
  if (jenjang !== "SD") {
    gens.push(
      pairGenL({ pairs: ARAB_HARI, askA: (a) => `“${a}” adalah nama hari …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} dalam Bahasa Arab: ${a}.` }),
      pairGenL({ pairs: ARAB_LAWAN, askA: (a) => `Kata sifat “${a}” artinya …`, askB: (b) => `Bahasa Arab dari kata sifat “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
      pairGenL({ pairs: ARAB_KERJA, askA: (a) => `Fi'il “${a}” artinya …`, askB: (b) => `Bahasa Arab dari “${b}” adalah …`, exA: (a, b) => `${a} artinya ${b}.`, exB: (a, b) => `“${b}” dalam Bahasa Arab: ${a}.` }),
      arabIsyarahGen,
      factGenL(ARAB_FACTS_BESAR),
    );
  }
  return gens;
};

/* ============ KOMPUTER / INFORMATIKA — semua jenjang ============ */
const TK_KOMPUTER_PAIRS: readonly (readonly [string, string])[] = [
  ["Mouse", "Menggerakkan panah (kursor) di layar"],
  ["Keyboard", "Mengetik huruf dan angka"],
  ["Monitor / layar", "Menampilkan gambar dan tulisan"],
  ["Speaker", "Mengeluarkan suara dan musik"],
  ["Printer", "Mencetak gambar dan tulisan ke kertas"],
  ["Tablet", "Layar sentuh untuk belajar dan bermain"],
  ["Kamera", "Mengambil foto dan video"],
  ["Charger", "Mengisi daya baterai gawai"],
];
const TK_KOMPUTER_FACTS: Fact[] = [
  ["Sebelum bermain HP atau tablet, kita harus …", "Minta izin orang tua", ["Langsung mengambil diam-diam", "Bermain sampai tengah malam"], "Selalu minta izin orang tua sebelum memakai gawai."],
  ["Bermain gawai terlalu lama bisa membuat …", "Mata lelah dan badan pegal", ["Badan makin kuat", "Cepat tinggi"], "Istirahatkan mata dan bergeraklah setelah bermain gawai."],
  ["Jika ada orang asing mengajak bicara lewat game atau internet, kita harus …", "Memberi tahu orang tua", ["Membalas ajakannya", "Memberikan alamat rumah"], "Jangan bicara dengan orang asing di internet; beri tahu orang tua."],
  ["Setelah selesai bermain gawai, sebaiknya kita …", "Istirahat dan bermain di luar", ["Langsung bermain lagi", "Tidak tidur"], "Seimbangkan waktu layar dengan bermain dan bergerak."],
  ["Bagian komputer yang penuh huruf untuk mengetik adalah …", "Keyboard", ["Mouse", "Speaker"], "Keyboard dipakai mengetik huruf dan angka."],
  ["Untuk mendengar suara dari komputer kita memakai …", "Speaker / headphone", ["Printer", "Mouse"], "Speaker mengeluarkan suara."],
];
const IO_CLASSIFY: { item: string; cat: string }[] = [
  ...["Keyboard", "Mouse", "Scanner", "Mikrofon", "Webcam", "Joystick", "Layar sentuh"].map((x) => ({ item: x, cat: "Perangkat masukan (input)" })),
  ...["Monitor", "Printer", "Speaker", "Proyektor", "Headphone"].map((x) => ({ item: x, cat: "Perangkat keluaran (output)" })),
  ...["Flashdisk", "Hard disk", "SSD", "Kartu memori", "CD / DVD"].map((x) => ({ item: x, cat: "Penyimpanan (storage)" })),
];
const SD_TIK_FACTS: Fact[] = [
  ["Dokumen teks Microsoft Word biasanya berakhiran (ekstensi) …", ".docx", [".jpg", ".mp3", ".mp4"], "Ekstensi menunjukkan jenis file: .docx dokumen, .jpg gambar, .mp3 lagu, .mp4 video."],
  ["Aplikasi yang dipakai mengetik surat dan cerita disebut aplikasi …", "Pengolah kata", ["Pengolah gambar", "Pemutar musik", "Kalkulator"], "Pengolah kata (mis. Microsoft Word) untuk mengetik dokumen."],
  ["Kata sandi (password) yang baik adalah yang …", "Panjang dan sulit ditebak orang", ["Sama dengan tanggal lahir", "123456 saja", "Nama sendiri"], "Password kuat: panjang, campuran huruf-angka-simbol, dan rahasia."],
  ["Jika menemukan gambar atau tulisan tidak pantas di internet, kita harus …", "Menutupnya dan memberi tahu guru / orang tua", ["Membagikannya ke teman", "Menyimpannya diam-diam", "Mengklik semua tautannya"], "Internet sehat: tutup konten tidak pantas dan laporkan ke orang dewasa."],
  ["Otak komputer yang memproses semua perintah adalah …", "CPU (prosesor)", ["Monitor", "Kabel", "Kipas"], "CPU = Central Processing Unit, pusat pemrosesan."],
  ["Tempat mengelompokkan file-file di komputer disebut …", "Folder", ["Ikon", "Kertas", "Layar"], "Folder mengelompokkan file agar rapi dan mudah dicari."],
  ["Mengetik dengan sepuluh jari tanpa melihat keyboard disebut …", "Mengetik sentuh (touch typing)", ["Mengetik satu jari", "Mengetik cepat asal-asalan", "Menyalin"], "Touch typing membuat mengetik cepat dan akurat."],
  ["Perangkat lunak dalam bahasa Inggris disebut …", "Software", ["Hardware", "Brainware", "Firmware"], "Software = perangkat lunak; hardware = perangkat keras."],
  ["Jaringan raksasa yang menghubungkan komputer di seluruh dunia adalah …", "Internet", ["Intranet sekolah", "Kabel LAN", "Bluetooth"], "Internet menghubungkan jaringan-jaringan di seluruh dunia."],
];
const FLOW_PAIRS: readonly (readonly [string, string])[] = [
  ["Oval (terminator)", "Mulai dan selesai"],
  ["Persegi panjang", "Proses / langkah pengerjaan"],
  ["Belah ketupat", "Keputusan (pilihan ya / tidak)"],
  ["Jajar genjang", "Input dan output data"],
  ["Panah (garis alir)", "Arah aliran proses"],
];
const MALWARE_PAIRS: readonly (readonly [string, string])[] = [
  ["Virus", "Menempel pada file dan menyebar saat file dibuka"],
  ["Worm", "Menyebar sendiri lewat jaringan tanpa bantuan file"],
  ["Trojan", "Menyamar sebagai program baik padahal jahat"],
  ["Ransomware", "Mengunci data korban dan meminta tebusan"],
  ["Spyware", "Mengintip aktivitas pengguna secara diam-diam"],
  ["Phishing", "Menipu korban agar memberikan data pribadi"],
];
const SMP_TIK_FACTS: Fact[] = [
  ["Tugas utama sistem operasi (operating system) adalah …", "Mengatur perangkat keras dan menjalankan aplikasi", ["Mengetik dokumen", "Memutar musik saja", "Mencetak foto"], "OS seperti Windows, Linux, Android mengatur seluruh kerja komputer."],
  ["Dalam spreadsheet, rumus untuk menjumlahkan data adalah …", "=SUM", ["=TOTAL", "=JUMLAHKAN", "=PLUS"], "Rumus spreadsheet diawali tanda =. =SUM menjumlahkan."],
  ["Dalam spreadsheet, rumus untuk nilai rata-rata adalah …", "=AVERAGE", ["=MEAN", "=RATA", "=SUM"], "=AVERAGE menghitung rata-rata."],
  ["Pertemuan antara baris dan kolom dalam spreadsheet disebut …", "Sel (cell)", ["Tabel", "Grafik", "Halaman"], "Sel adalah kotak pertemuan baris (angka) dan kolom (huruf)."],
  ["Urutan langkah logis untuk menyelesaikan masalah disebut …", "Algoritma", ["Program jadi", "Data", "Kesalahan"], "Algoritma = langkah-langkah logis; program adalah wujud kodenya."],
  ["Diagram alir yang menggambarkan algoritma dengan simbol disebut …", "Flowchart", ["Mind map", "Diagram batang", "Poster"], "Flowchart memakai simbol standar: terminator, proses, keputusan, input/output."],
  ["Autentikasi dua langkah (2FA) membuat akun lebih aman karena …", "Butuh kode tambahan selain kata sandi", ["Kata sandi jadi pendek", "Tidak perlu kata sandi", "Akun jadi publik"], "2FA = kata sandi + kode sekali pakai dari perangkatmu."],
  ["Jaringan komputer di lingkungan satu sekolah/gedung disebut …", "LAN", ["WAN", "MAN", "Internet"], "LAN = Local Area Network (lokal); MAN = kota; WAN = wilayah luas."],
];
const smaTrace: LGen = () => {
  const kind = ri(0, 3);
  if (kind === 0) {
    const a = ri(2, 20), b = ri(2, 20);
    const ans = a + b;
    return mkNum(`Perhatikan potongan program:\nx = ${a}\ny = ${b}\nx = x + y\ncetak x\nNilai yang dicetak adalah …`, ans, [ans + 1, ans - 1, a * b], `x terakhir = ${a} + ${b} = ${ans}.`);
  }
  if (kind === 1) {
    const n = ri(3, 8);
    const ans = (n * (n + 1)) / 2;
    return mkNum(`Perhatikan potongan program:\ntotal = 0\nuntuk i dari 1 sampai ${n}:\n    total = total + i\ncetak total\nNilai yang dicetak adalah …`, ans, [ans + n, ans - 1, n * n], `total = 1+2+…+${n} = ${ans}.`);
  }
  if (kind === 2) {
    const n = ri(3, 9);
    const ans = 2 * n;
    return mkNum(`Perhatikan potongan program:\nhitung = 0\nuntuk i dari 1 sampai ${n}:\n    hitung = hitung + 2\ncetak hitung\nNilai yang dicetak adalah …`, ans, [ans + 2, n, ans - 2], `Perulangan ${n} kali, tiap kali +2 → ${ans}.`);
  }
  const words = ["komputer", "informatika", "algoritma", "internet", "program", "data", "siber", "jaringan"] as const;
  const w = pick(words);
  return mkNum(`Dalam program, kata = "${w}". Nilai dari panjang(kata) adalah …`, w.length, [w.length + 1, w.length - 1, w.length + 2], `"${w}" punya ${w.length} huruf.`);
};
const SMA_TIK_FACTS: Fact[] = [
  ["Perintah SQL untuk mengambil / menampilkan data dari tabel adalah …", "SELECT", ["INSERT", "DELETE", "UPDATE"], "SELECT membaca data; INSERT menambah; UPDATE mengubah; DELETE menghapus."],
  ["Dalam basis data, satu baris data lengkap disebut …", "Record", ["Field", "Tabel", "Kunci"], "Baris = record; kolom = field/atribut."],
  ["Kunci yang menghubungkan satu tabel dengan tabel lain disebut …", "Foreign key", ["Primary key", "Kandidat key", "Super key"], "Foreign key menunjuk primary key di tabel lain."],
  ["DNS dalam jaringan berfungsi untuk …", "Menerjemahkan nama domain menjadi alamat IP", ["Mengenkripsi semua data", "Mempercepat prosesor", "Menyimpan kata sandi"], "DNS = buku telepon internet: nama → alamat IP."],
  ["Alamat IPv4 terdiri dari 4 angka yang masing-masing bernilai …", "0 sampai 255", ["0 sampai 100", "1 sampai 10", "0 sampai 999"], "Setiap oktet IPv4 = 8 bit → 0–255."],
  ["Berpikir komputasional yang berarti memecah masalah besar menjadi bagian-bagian kecil disebut …", "Dekomposisi", ["Abstraksi", "Pengenalan pola", "Debugging"], "Empat pilar: dekomposisi, pengenalan pola, abstraksi, algoritma."],
  ["Berpikir komputasional yang berarti fokus pada hal penting dan mengabaikan detail yang tidak relevan disebut …", "Abstraksi", ["Dekomposisi", "Pengenalan pola", "Kompilasi"], "Abstraksi menyaring hal yang penting saja."],
  ["VPN membuat koneksi internet lebih aman karena …", "Membuat jalur terenkripsi antara perangkat dan server", ["Menghapus semua virus", "Membuat internet gratis", "Mematikan iklan saja"], "VPN mengenkripsi lalu lintas data lewat terowongan aman."],
];
const SD_TIK_PAIRS: readonly (readonly [string, string])[] = [
  ["CPU (prosesor)", "Otak komputer yang memproses semua perintah"],
  ["RAM", "Ingatan sementara saat komputer bekerja"],
  ["Hard disk / SSD", "Menyimpan data secara permanen"],
  ["Modem", "Menghubungkan komputer ke jaringan internet"],
  ["Webcam", "Kamera untuk panggilan video"],
  ["Scanner", "Memindai dokumen atau foto menjadi file"],
  ["Proyektor", "Menampilkan gambar ke layar besar / dinding"],
  ["Flashdisk", "Alat simpan kecil yang mudah dibawa"],
  ["Mikrofon", "Merekam suara kita"],
  ["Headphone", "Mendengar suara tanpa mengganggu orang lain"],
  ["Touchpad", "Pengganti mouse pada laptop"],
  ["Baterai", "Sumber daya laptop dan gawai"],
  ["Monitor", "Menampilkan gambar dan tulisan dari komputer"],
  ["Keyboard", "Mengetik huruf, angka, dan simbol"],
];
const SD_TIK_FACTS2: Fact[] = [
  ["Untuk mencari informasi di internet kita memakai …", "Mesin pencari (search engine)", ["Kalkulator", "Pemutar musik", "Kamera"], "Mesin pencari seperti Google membantu menemukan informasi."],
  ["Surat elektronik yang dikirim lewat internet disebut …", "Email", ["SMS biasa", "Surat pos", "Telegram"], "Email = electronic mail, surat lewat internet."],
  ["Semua yang kita lakukan di internet meninggalkan …", "Jejak digital", ["Jejak kaki", "Bayangan", "Tidak ada jejak"], "Jejak digital sulit dihapus — hati-hati sebelum mengunggah."],
  ["Karya orang lain di internet tidak boleh kita …", "Akui sebagai karya kita sendiri", ["Pelajari dengan izin", "Sebutkan sumbernya", "Hargai"], "Mengakui karya orang lain = plagiat. Sebutkan sumbernya!"],
  ["Sebelum mengunduh aplikasi atau game baru, sebaiknya …", "Minta izin dan cek bersama orang tua / guru", ["Langsung unduh semuanya", "Klik iklan yang muncul", "Matikan antivirus"], "Unduhan sembarangan bisa berisi virus. Selalu izin dulu."],
  ["Jarak mata yang baik dari layar komputer adalah sekitar …", "50–70 cm (sejauh lengan)", ["5 cm", "Sedekat mungkin", "3 meter"], "Jaga jarak pandang dan istirahatkan mata tiap 20 menit."],
  ["Wi-Fi adalah teknologi untuk menghubungkan perangkat …", "Tanpa kabel (nirkabel)", ["Dengan kabel panjang", "Lewat kertas", "Dengan tali"], "Wi-Fi memakai gelombang radio, tanpa kabel."],
  ["Komputer pada awalnya diciptakan terutama untuk membantu …", "Menghitung", ["Bermain game", "Menonton film", "Menggambar"], "Komputer awal adalah mesin hitung raksasa."],
];
const SHORTCUT_PAIRS: readonly (readonly [string, string])[] = [
  ["Ctrl + C", "Menyalin (copy) teks atau file"],
  ["Ctrl + V", "Menempel (paste) hasil salinan"],
  ["Ctrl + X", "Memotong (cut) teks atau file"],
  ["Ctrl + Z", "Membatalkan aksi terakhir (undo)"],
  ["Ctrl + S", "Menyimpan dokumen"],
  ["Ctrl + A", "Memilih semua isi dokumen"],
  ["Ctrl + P", "Mencetak dokumen"],
  ["Ctrl + F", "Mencari kata dalam dokumen / halaman"],
];
const JARINGAN_PAIRS: readonly (readonly [string, string])[] = [
  ["Switch", "Menghubungkan perangkat-perangkat dalam satu jaringan lokal"],
  ["Access point", "Memancarkan sinyal Wi-Fi untuk perangkat nirkabel"],
  ["Server", "Komputer penyedia layanan dan data bagi komputer lain"],
  ["ISP", "Perusahaan penyedia layanan internet"],
  ["Kabel fiber optik", "Mengirim data dengan cahaya, sangat cepat"],
  ["Bluetooth", "Menghubungkan perangkat jarak dekat tanpa kabel"],
];
const SMP_TIK_FACTS2: Fact[] = [
  ["Menyimpan data di server internet agar bisa diakses dari mana saja disebut …", "Komputasi awan (cloud)", ["Fogging", "Offline storage", "Floppy disk"], "Cloud: data tersimpan di pusat data dan diakses via internet."],
  ["File berekstensi .zip adalah …", "Arsip terkompresi berisi satu / banyak file", ["File gambar", "File lagu", "Program virus pasti"], ".zip mengecilkan dan menggabungkan file."],
  ["Tes 'Saya bukan robot' (CAPTCHA) bertujuan untuk …", "Memastikan pengguna adalah manusia, bukan bot", ["Mempercepat internet", "Menghapus virus", "Menguji kecepatan mengetik"], "CAPTCHA menyaring bot otomatis."],
  ["Mode penyamaran (incognito) pada peramban …", "Tidak menyimpan riwayat di perangkat itu, tapi aktivitas tetap terlihat oleh jaringan", ["Membuat kita benar-benar anonim", "Menghapus semua jejak di internet", "Memblokir semua iklan"], "Incognito hanya lokal; ISP/situs tetap bisa melihat aktivitas."],
  ["Memperbarui (update) aplikasi dan sistem operasi penting karena …", "Menambal celah keamanan dan memperbaiki bug", ["Membuat baterai awet selamanya", "Menghapus semua data", "Tidak ada gunanya"], "Update rutin adalah pertahanan keamanan dasar."],
  ["Satuan kecepatan internet 'Mbps' adalah singkatan dari …", "Megabit per detik", ["Megabyte per satuan", "Meter per detik", "Mega pixel"], "Mbps = megabit per second (perhatikan: bit, bukan byte)."],
];
const PROTOKOL_PAIRS: readonly (readonly [string, string])[] = [
  ["HTTP", "Transfer halaman web tanpa enkripsi"],
  ["HTTPS", "Transfer halaman web terenkripsi (aman)"],
  ["FTP", "Transfer file antar komputer"],
  ["SMTP", "Mengirim email keluar dari pengirim"],
  ["POP3", "Mengunduh email dari server ke perangkat"],
  ["IMAP", "Mengakses email yang tetap tersimpan di server"],
  ["TCP", "Pengiriman data yang andal dan berurutan"],
  ["UDP", "Pengiriman data cepat tanpa jaminan urutan"],
];
const SMA_TIK_FACTS2: Fact[] = [
  ["Enkripsi asimetris memakai sepasang kunci, yaitu …", "Kunci publik dan kunci privat", ["Kunci tunggal bersama", "Kata sandi saja", "Sidik jari"], "Kunci publik mengenkripsi; kunci privat (rahasia) mendekripsi."],
  ["Hashing berbeda dari enkripsi karena hashing bersifat …", "Satu arah — tidak bisa dikembalikan ke data asal", ["Dua arah seperti enkripsi", "Hanya untuk gambar", "Selalu bisa ditebak"], "Hash dipakai memeriksa integritas & menyimpan sidik kata sandi."],
  ["Firewall dalam jaringan berfungsi untuk …", "Menyaring lalu lintas data yang masuk dan keluar", ["Mempercepat prosesor", "Menyimpan file cadangan", "Mendinginkan server"], "Firewall adalah gerbang penjaga jaringan."],
  ["Internet of Things (IoT) adalah konsep …", "Benda sehari-hari terhubung ke internet dan saling bertukar data", ["Internet hanya untuk komputer", "Jaringan khusus satelit", "Game daring"], "Contoh IoT: lampu pintar, CCTV daring, sensor pertanian."],
  ["Dalam pembelajaran mesin (machine learning), komputer belajar dari …", "Data latih dalam jumlah besar", ["Perintah yang diketik satu-satu", "Buku manual", "Tebakan acak"], "Model ML menemukan pola dari data latih."],
  ["Layanan perangkat lunak lewat internet tanpa instalasi (mis. dokumen daring) disebut …", "SaaS (Software as a Service)", ["PaaS", "IaaS", "Firmware"], "SaaS: pakai langsung lewat peramban, dikelola penyedia."],
];
function tikGens(jenjang: JenjangId): LGen[] {
  if (jenjang === "TK") {
    return [
      pairGenL({ pairs: TK_KOMPUTER_PAIRS, askA: (a) => `${a} berguna untuk …`, askB: (b) => `Alat yang berguna untuk “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu adalah ${a}.`, four: false }),
      factGenL(TK_KOMPUTER_FACTS, false),
    ];
  }
  if (jenjang === "SD") {
    return [
      classifyGen(INF_CLASSIFY.map((x) => ({ item: x.item, cat: x.cat })), (i) => `${i} termasuk kelompok …`, (i, c) => `${i} adalah ${c.toLowerCase()}.`),
      classifyGen(IO_CLASSIFY.map((x) => ({ item: x.item, cat: x.cat })), (i) => `${i} termasuk kelompok …`, (i, c) => `${i} adalah ${c.toLowerCase()}.`),
      pairGenL({ pairs: SD_TIK_PAIRS, askA: (a) => `${a} berfungsi untuk …`, askB: (b) => `Perangkat yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      factGenL(SD_TIK_FACTS),
      factGenL(SD_TIK_FACTS2),
    ];
  }
  if (jenjang === "SMP") {
    // Melengkapi generator informatika SMP yang sudah terdaftar (biner, klasifikasi, fakta OS/jaringan).
    return [
      pairGenL({ pairs: FLOW_PAIRS, askA: (a) => `Dalam flowchart, simbol ${a.toLowerCase()} berarti …`, askB: (b) => `“${b}” dalam flowchart dilambangkan dengan …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu simbol ${a.toLowerCase()}.` }),
      pairGenL({ pairs: MALWARE_PAIRS, askA: (a) => `Perangkat jahat “${a}” adalah …`, askB: (b) => `“${b}” — itu ciri …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: SHORTCUT_PAIRS, askA: (a) => `Pintasan keyboard ${a} berfungsi untuk …`, askB: (b) => `Untuk “${b.toLowerCase()}”, tekan …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Tekan ${a}.` }),
      pairGenL({ pairs: JARINGAN_PAIRS, askA: (a) => `${a} dalam jaringan komputer berfungsi untuk …`, askB: (b) => `“${b}” — itu adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      factGenL(SMP_TIK_FACTS),
      factGenL(SMP_TIK_FACTS2),
    ];
  }
  // SMA: melengkapi OSI, serangan siber, biner, dan fakta yang sudah terdaftar.
  return [
    pairGenL({ pairs: MALWARE_PAIRS, askA: (a) => `Perangkat jahat “${a}” adalah …`, askB: (b) => `“${b}” — itu ciri …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
    pairGenL({ pairs: PROTOKOL_PAIRS, askA: (a) => `Protokol ${a} berfungsi untuk …`, askB: (b) => `“${b}” adalah fungsi protokol …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu protokol ${a}.` }),
    pairGenL({ pairs: SHORTCUT_PAIRS, askA: (a) => `Pintasan keyboard ${a} berfungsi untuk …`, askB: (b) => `Untuk “${b.toLowerCase()}”, tekan …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Tekan ${a}.` }),
    smaTrace,
    factGenL(SMA_TIK_FACTS),
    factGenL(SMA_TIK_FACTS2),
  ];
}

/* ============ SEJARAH — mapel penuh semua jenjang ============ */
const KERAJAAN: readonly (readonly [string, string])[] = [
  ["Sriwijaya", "Palembang — kerajaan maritim terbesar di Nusantara"],
  ["Majapahit", "Trowulan, Jawa Timur — dipersatukan oleh Gajah Mada"],
  ["Kutai", "Muara Kaman, Kalimantan Timur — prasasti Yupa"],
  ["Tarumanagara", "Bogor, Jawa Barat — prasasti Ciaruteun"],
  ["Mataram Kuno", "Jawa Tengah — membangun Candi Borobudur"],
  ["Demak", "Pesisir Jawa Tengah — kerajaan Islam pertama di Jawa"],
  ["Singasari", "Malang, Jawa Timur — didirikan oleh Ken Arok"],
  ["Kediri", "Kediri, Jawa Timur — terkenal ramalan Jayabaya"],
  ["Pajajaran", "Pakuan Bogor — dipimpin Prabu Siliwangi"],
  ["Aceh Darussalam", "Banda Aceh — masa kejayaan Sultan Iskandar Muda"],
  ["Banten", "Banten — dipimpin Sultan Ageng Tirtayasa"],
  ["Gowa", "Makassar — dipimpin Sultan Hasanuddin"],
];
const PERISTIWA_ID: readonly (readonly [string, string])[] = [
  ["Proklamasi Kemerdekaan Indonesia", "17 Agustus 1945"],
  ["Sumpah Pemuda", "28 Oktober 1928"],
  ["Berdirinya Budi Utomo (Kebangkitan Nasional)", "20 Mei 1908"],
  ["Berdirinya VOC", "Tahun 1602"],
  ["Jepang mulai menduduki Indonesia", "Tahun 1942"],
  ["Konferensi Meja Bundar", "Tahun 1949"],
  ["Pemilu pertama Indonesia", "Tahun 1955"],
  ["Dekrit Presiden kembali ke UUD 1945", "5 Juli 1959"],
  ["Supersemar", "11 Maret 1966"],
  ["Soeharto berhenti sebagai presiden (awal Reformasi)", "21 Mei 1998"],
];
const PERISTIWA_DUNIA: readonly (readonly [string, string])[] = [
  ["Kemerdekaan Amerika Serikat", "4 Juli 1776"],
  ["Revolusi Prancis", "Tahun 1789"],
  ["Perang Dunia I dimulai", "Tahun 1914"],
  ["Perang Dunia II dimulai", "Tahun 1939"],
  ["Jatuhnya Konstantinopel ke Turki Utsmani", "Tahun 1453"],
  ["Manusia pertama terbang ke luar angkasa (Yuri Gagarin)", "Tahun 1961"],
  ["Manusia pertama mendarat di Bulan", "Tahun 1969"],
  ["Runtuhnya Tembok Berlin", "Tahun 1989"],
  ["Bubarnya Uni Soviet (akhir Perang Dingin)", "Tahun 1991"],
];
const TK_SEJARAH_PAIRS: readonly (readonly [string, string])[] = [
  ["Ir. Soekarno", "Presiden pertama Indonesia"],
  ["Moh. Hatta", "Wakil presiden pertama Indonesia"],
  ["Ibu Fatmawati", "Menjahit bendera pusaka"],
  ["Garuda Pancasila", "Lambang negara Indonesia"],
  ["Indonesia Raya", "Lagu kebangsaan Indonesia"],
  ["Merah Putih", "Bendera negara Indonesia"],
  ["Monas", "Tugu tinggi di Jakarta"],
  ["17 Agustus", "Hari Kemerdekaan Indonesia"],
];
const TK_SEJARAH_FACTS: Fact[] = [
  ["Warna bendera negara kita Indonesia adalah …", "Merah dan putih", ["Biru dan kuning", "Hijau dan hitam"], "Bendera Indonesia: merah di atas, putih di bawah. Merah berani, putih suci."],
  ["Lagu kebangsaan negara kita adalah …", "Indonesia Raya", ["Garuda Pancasila", "Maju Tak Gentar"], "Indonesia Raya diciptakan oleh Wage Rudolf Supratman."],
  ["Hari Kemerdekaan Indonesia dirayakan setiap tanggal …", "17 Agustus", ["1 Juni", "20 Mei"], "Indonesia merdeka pada 17 Agustus 1945."],
  ["Lambang negara Indonesia adalah …", "Garuda Pancasila", ["Banteng", "Pohon beringin"], "Garuda Pancasila adalah lambang negara kita."],
  ["Presiden pertama Indonesia adalah …", "Ir. Soekarno", ["Moh. Hatta", "Soeharto"], "Ir. Soekarno presiden pertama; Moh. Hatta wakil presiden pertama."],
  ["Pahlawan adalah orang yang …", "Berani dan baik, membela negara", ["Suka berkelahi", "Paling kaya"], "Pahlawan berjuang untuk negara dan rakyatnya."],
  ["Ibu kota negara Indonesia adalah …", "Jakarta", ["Bandung", "Surabaya"], "Jakarta adalah ibu kota negara (pemerintahan berangsur pindah ke Nusantara/IKN)."],
];
const SEJ_SD_FACTS: Fact[] = [
  ["Teks Proklamasi Kemerdekaan dibacakan oleh …", "Ir. Soekarno", ["Moh. Hatta", "Sutan Sjahrir"], "Soekarno membacakan proklamasi didampingi Moh. Hatta, 17 Agustus 1945 di Jakarta."],
  ["Bendera Merah Putih yang dikibarkan saat proklamasi dijahit oleh …", "Ibu Fatmawati", ["Ibu Kartini", "Cut Nyak Dien"], "Fatmawati, istri Soekarno, menjahit Bendera Pusaka."],
  ["Perusahaan dagang Belanda yang menjajah Indonesia adalah …", "VOC", ["PBB", "KNIL", "BPUPKI"], "VOC (1602) adalah kongsi dagang Belanda yang memonopoli rempah."],
  ["Perang terbesar melawan Belanda di Jawa dipimpin oleh …", "Pangeran Diponegoro", ["Pattimura", "Imam Bonjol"], "Perang Diponegoro / Perang Jawa berlangsung 1825–1830."],
  ["Sistem tanam paksa (cultuurstelsel) membuat rakyat sengsara karena …", "Dipaksa menanam tanaman ekspor untuk Belanda", ["Dilarang pergi ke sekolah", "Harus pindah pulau", "Dilarang berdagang selamanya"], "Tanam paksa (1830) memaksa rakyat menanam kopi, tebu, dll. untuk Belanda."],
  ["Sumpah Pemuda berisi janji bertanah air, berbangsa, dan berbahasa satu, yaitu …", "Indonesia", ["Melayu", "Jawa"], "Sumpah Pemuda 28 Oktober 1928: satu tanah air, bangsa, dan bahasa Indonesia."],
  ["Lagu Indonesia Raya pertama kali dikumandangkan pada peristiwa …", "Sumpah Pemuda 1928", ["Proklamasi 1945", "Kongres Perempuan", "Pemilu 1955"], "W.R. Supratman memainkan Indonesia Raya dengan biola pada Kongres Pemuda II, 1928."],
  ["Kerajaan maritim terbesar yang menguasai Selat Malaka adalah …", "Sriwijaya", ["Majapahit", "Kutai"], "Sriwijaya berpusat di Palembang, kuat di laut dan perdagangan."],
  ["Sumpah Palapa yang terkenal diucapkan oleh …", "Gajah Mada", ["Hayam Wuruk", "Ken Arok"], "Gajah Mada, mahapatih Majapahit, mengucapkan Sumpah Palapa."],
  ["Hari Pahlawan 10 November memperingati pertempuran besar di …", "Surabaya", ["Jakarta", "Medan"], "Pertempuran Surabaya 10 November 1945 melawan Sekutu."],
];
const SEJ_SMP_FACTS: Fact[] = [
  ["Bangsa Eropa pertama yang tiba dan menaklukkan Malaka (1511) adalah …", "Portugis", ["Belanda", "Inggris"], "Portugis dipimpin Alfonso de Albuquerque merebut Malaka tahun 1511."],
  ["Ekspedisi Belanda pertama tiba di Banten (1596) dipimpin oleh …", "Cornelis de Houtman", ["Jan Pieterszoon Coen", "Daendels"], "De Houtman tiba 1596; VOC berdiri 1602."],
  ["Gubernur Jenderal yang membangun jalan raya Anyer–Panarukan adalah …", "Herman Willem Daendels", ["Raffles", "Van den Bosch"], "Daendels (1808–1811) membangun Jalan Raya Pos dengan kerja paksa."],
  ["Gubernur Jenderal Inggris yang menulis buku History of Java adalah …", "Thomas Stamford Raffles", ["Daendels", "Janssens"], "Raffles memerintah 1811–1816 dan menulis History of Java."],
  ["Sistem tanam paksa (1830) diterapkan oleh Gubernur Jenderal …", "Johannes van den Bosch", ["Daendels", "Raffles"], "Van den Bosch memulai cultuurstelsel tahun 1830."],
  ["Organisasi pergerakan nasional pertama, Budi Utomo, didirikan atas gagasan …", "dr. Wahidin Sudirohusodo", ["Ir. Soekarno", "HOS Tjokroaminoto"], "Budi Utomo berdiri 20 Mei 1908; ketuanya dr. Sutomo."],
  ["Tokoh yang dijuluki 'Raja Jawa Tanpa Mahkota' dan memimpin Sarekat Islam adalah …", "HOS Tjokroaminoto", ["Ki Hajar Dewantara", "Douwes Dekker"], "Tjokroaminoto memimpin Sarekat Islam; Soekarno pernah indekos di rumahnya."],
  ["Jepang mulai menduduki Indonesia setelah Belanda menyerah di … (1942)", "Kalijati, Subang", ["Jakarta", "Surabaya"], "Belanda menyerah tanpa syarat kepada Jepang di Kalijati, 8 Maret 1942."],
  ["Badan yang dibentuk Jepang untuk mempersiapkan kemerdekaan Indonesia adalah …", "BPUPKI", ["PPKI saja", "KNIP", "DPR"], "BPUPKI (1945) merumuskan dasar negara; PPKI mengesahkan UUD 1945 pada 18 Agustus 1945."],
  ["Peristiwa membakar kota sendiri agar tidak dikuasai Sekutu (1946) dikenal sebagai …", "Bandung Lautan Api", ["Puputan Margarana", "Serangan Umum"], "Bandung Lautan Api: 24 Maret 1946, warga membakar Bandung selatan."],
  ["Perang Puputan Margarana di Bali (1946) dipimpin oleh …", "I Gusti Ngurah Rai", ["Sultan Hasanuddin", "Untung Surapati"], "Ngurah Rai dan pasukannya gugur dalam Puputan Margarana."],
  ["Serangan Umum 1 Maret 1949 terjadi di kota …", "Yogyakarta", ["Jakarta", "Semarang"], "Serangan Umum merebut Yogyakarta selama 6 jam, membuktikan RI masih ada."],
  ["Hasil Konferensi Meja Bundar (1949) adalah …", "Belanda mengakui kedaulatan Indonesia", ["Indonesia jadi provinsi Belanda", "Perang dilanjutkan", "Ibu kota pindah"], "KMB di Den Haag: Belanda mengakui kedaulatan RIS pada 27 Desember 1949."],
];
const SEJ_SMA_FACTS: Fact[] = [
  ["Sistem pemerintahan pada masa Demokrasi Terpimpin (1959–1965) berpusat pada kepemimpinan …", "Presiden Soekarno", ["Parlemen", "Militer sepenuhnya", "Raja"], "Dekrit 5 Juli 1959 membuka era Demokrasi Terpimpin."],
  ["Peristiwa 30 September 1965 (G30S) menewaskan …", "Enam jenderal dan satu perwira TNI AD", ["Presiden Soekarno", "Seluruh kabinet", "Tidak ada korban"], "Tujuh perwira TNI AD menjadi korban; jenazah ditemukan di Lubang Buaya. Peristiwa ini faktual dan menjadi titik balik sejarah Indonesia."],
  ["Surat perintah yang menjadi dasar peralihan kekuasaan dari Soekarno ke Soeharto (11 Maret 1966) disebut …", "Supersemar", ["Dekrit", "Maklumat", "Tritura"], "Supersemar = Surat Perintah Sebelas Maret 1966."],
  ["Program pembangunan lima tahunan pada masa Orde Baru disebut …", "Repelita", ["Renstra", "Pembangunan Semesta", "Pelita Bangsa"], "Repelita = Rencana Pembangunan Lima Tahun, dimulai 1969."],
  ["Reformasi 1998 ditandai dengan berhentinya Presiden Soeharto dan digantikan oleh …", "B.J. Habibie", ["Abdurrahman Wahid", "Megawati Soekarnoputri"], "Soeharto berhenti 21 Mei 1998; Wakil Presiden B.J. Habibie dilantik menjadi presiden."],
  ["Pemilu pertama pada era Reformasi diselenggarakan pada tahun …", "1999", ["1997", "2004", "2009"], "Pemilu 7 Juni 1999 adalah pemilu demokratis pertama setelah Orde Baru."],
  ["Perang Dunia I (1914–1918) dipicu oleh pembunuhan putra mahkota Austria, Franz Ferdinand, di kota …", "Sarajevo", ["Berlin", "Wina"], "Pembunuhan di Sarajevo, 28 Juni 1914, memicu PD I."],
  ["Perang Dunia II di Eropa dimulai dengan invasi Jerman ke negara …", "Polandia", ["Prancis", "Belanda"], "Invasi 1 September 1939 memulai PD II."],
  ["Serangan Jepang ke pangkalan Amerika Serikat di Pearl Harbor terjadi pada tahun …", "1941", ["1939", "1943"], "Pearl Harbor diserang 7 Desember 1941; AS masuk PD II."],
  ["Kota Jepang yang dijatuhi bom atom pertama dan kedua (Agustus 1945) adalah …", "Hiroshima dan Nagasaki", ["Tokyo dan Osaka", "Kyoto dan Kobe"], "Hiroshima 6 Agustus, Nagasaki 9 Agustus 1945; Jepang menyerah 15 Agustus 1945."],
  ["Perang Dingin adalah ketegangan tanpa perang langsung antara …", "Amerika Serikat dan Uni Soviet", ["Jerman dan Prancis", "Inggris dan Jepang"], "Blok Barat (AS) vs Blok Timur (Uni Soviet), ±1947–1991."],
  ["Aliansi militer Blok Barat yang dibentuk tahun 1949 adalah …", "NATO", ["Pakta Warsawa", "ASEAN", "SEATO"], "NATO 1949; Pakta Warsawa (1955) adalah tandingan Blok Timur."],
  ["Peradaban Mesopotamia berkembang di antara dua sungai, yaitu …", "Tigris dan Eufrat", ["Nil dan Niger", "Gangsa dan Yamuna"], "Mesopotamia (kini Irak) di antara Tigris & Eufrat — tempat tulisan kuneiform lahir."],
  ["Revolusi Industri pertama kali dimulai di negara … dengan penemuan mesin uap", "Inggris", ["Prancis", "Jerman"], "Revolusi Industri mulai di Inggris abad ke-18; mesin uap disempurnakan James Watt."],
  ["Kekosongan kekuasaan (vacuum of power) yang mempercepat Proklamasi 1945 terjadi karena …", "Jepang telah menyerah kepada Sekutu", ["Belanda datang kembali", "BPUPKI dibubarkan rakyat", "Soekarno ditangkap"], "Jepang menyerah 15 Agustus 1945; golongan muda mendesak proklamasi segera (Peristiwa Rengasdengklok)."],
];
function sejarahGens(jenjang: JenjangId): LGen[] {
  if (jenjang === "TK") return [
    pairGenL({ pairs: TK_SEJARAH_PAIRS, askA: (a) => `${a} adalah …`, askB: (b) => `“${b}” — itu adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu adalah ${a}.`, four: false }),
    factGenL(TK_SEJARAH_FACTS, false),
  ];
  const base: LGen[] = [
    pairGenL({ pairs: KERAJAAN, askA: (a) => `Kerajaan ${a} dikenal dengan …`, askB: (b) => `“${b}” adalah ciri kerajaan …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah Kerajaan ${a}.` }),
    pairGenL({ pairs: PAHLAWAN, askA: (a) => `Pahlawan ${a} berasal dari …`, askB: (b) => `Pahlawan yang berasal dari ${b} adalah …`, exA: (a, b) => `${a} berasal dari ${b}.`, exB: (a, b) => `Dari ${b}: ${a}.` }),
    pairGenL({ pairs: PERISTIWA_ID, askA: (a) => `${a} terjadi pada …`, askB: (b) => `Peristiwa yang terjadi pada ${b.toLowerCase()} adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Pada ${b}: ${a}.` }),
    factGenL(SEJ_SD_FACTS),
  ];
  if (jenjang === "SD") return base;
  const mid: LGen[] = [
    ...base,
    pairGenL({ pairs: PERISTIWA_DUNIA, askA: (a) => `${a} terjadi pada …`, askB: (b) => `Peristiwa dunia yang terjadi pada ${b.toLowerCase()} adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Pada ${b}: ${a}.` }),
    factGenL(SEJ_SMP_FACTS),
  ];
  if (jenjang === "SMP") return mid;
  return [...mid, factGenL(SEJ_SMA_FACTS)];
}

/* ================================================================
   PAKET KOMPETISI + SOAL CERITA & BERGAMBAR (edit 2026-11-22)
   Semua soal ORIGINAL gaya lomba: Nalaria (KMNR-style), Kanguru
   Matematika (IKMC-style), Kanguru Bahasa (IKLC-style). Kunci selalu
   DIHITUNG kode dari parameter acak. Ditambah generator soal cerita
   sehari-hari & soal bergambar emoji untuk Matematika/Sains/Bahasa.
   ================================================================ */
const COMP_EMOJI_SETS: readonly (readonly [string, string])[] = [
  ["🍎", "apel"], ["🍌", "pisang"], ["⭐", "bintang"], ["🐶", "anjing"], ["🐱", "kucing"],
  ["🌸", "bunga"], ["🍓", "stroberi"], ["🦋", "kupu-kupu"], ["🍇", "anggur"], ["🐠", "ikan"],
  ["🚗", "mobil"], ["⚽", "bola"], ["🍊", "jeruk"], ["🐢", "kura-kura"], ["🌙", "bulan"],
] as const;
const ACTIVITY_SEQ: readonly (readonly [string, string])[] = [
  ["🛏️ bangun tidur", "bangun tidur"], ["🪥 sikat gigi", "sikat gigi"], ["🥣 sarapan", "sarapan"],
  ["🎒 pergi ke sekolah", "pergi ke sekolah"], ["📚 belajar", "belajar"], ["⚽ bermain", "bermain"],
  ["🛁 mandi", "mandi"], ["🌙 tidur malam", "tidur malam"],
] as const;

/** Soal bergambar emoji: hitung gambar, gambar berbeda, urutan gambar. Level & jenjang mengatur besar angka dan jumlah opsi. */
export function emojiPictureGen(jenjang: JenjangId): LGen {
  const four = jenjang !== "TK";
  return (level) => {
    const kind = ri(0, 2);
    if (kind === 0) {
      const pair = pick(COMP_EMOJI_SETS);
      const e = pair[0];
      const n = jenjang === "TK" ? ri(2, 4 + level * 2) : ri(4, 6 + level * 3);
      return mkNum(`Hitung gambar berikut: ${e.repeat(n)} — Ada berapa ${pair[1]}?`, n, [n - 1, n + 1, n + 2, n - 2].filter((x) => x > 0 && x !== n), `Hitung satu-satu: ada ${n} ${pair[1]}.`, e, four);
    }
    if (kind === 1) {
      const a = pick(COMP_EMOJI_SETS);
      let b = pick(COMP_EMOJI_SETS);
      if (b[0] === a[0]) b = COMP_EMOJI_SETS[(COMP_EMOJI_SETS.indexOf(a) + 3) % COMP_EMOJI_SETS.length] as (readonly [string, string]);
      const total = jenjang === "TK" ? 4 : 5;
      const diffPos = ri(1, total - 1);
      const mixed = Array.from({ length: total }, (_, i) => (i === diffPos ? b[0] : a[0])).join("");
      const uniform = a[0].repeat(total);
      const uniformB = b[0].repeat(total);
      const c = COMP_EMOJI_SETS.find((s) => s[0] !== a[0] && s[0] !== b[0]) ?? a;
      const ds = four ? [uniform, uniformB, c[0].repeat(total)] : [uniform, uniformB];
      return mkq(`Gambar mana yang BERBEDA sendiri (ada gambar lain di dalamnya)?`, mixed, ds, `Kelompok ${mixed} campur: ada ${b[1]} di antara ${a[1]}. Kelompok lain seragam semua.`, a[0], four);
    }
    const start = ri(0, ACTIVITY_SEQ.length - 4);
    const seq = ACTIVITY_SEQ.slice(start, start + 4);
    const askIdx = ri(1, 3);
    const asked = seq[askIdx] as (readonly [string, string]);
    const others = sample(ACTIVITY_SEQ.filter((s) => s[1] !== asked[1]), four ? 3 : 2).map((s) => s[0]);
    const shown = seq.map((s, i) => `${i + 1}) ${s[0]}`).join("  ");
    return mkq(`Urutan kegiatan: ${shown} — Kegiatan nomor ${askIdx + 1} adalah …`, asked[0], others, `Nomor ${askIdx + 1} pada urutan itu adalah ${asked[1]}.`, "🗓️", four);
  };
}

/** Soal cerita sehari-hari Matematika: belanja, memasak, perjalanan, kebun, tabungan, berbagi. */
export function mathStoryGen(jenjang: JenjangId): LGen {
  const four = jenjang !== "TK";
  const big = jenjang === "SMA" ? 4 : jenjang === "SMP" ? 3 : jenjang === "SD" ? 2 : 1;
  return (level) => {
    const name = pick(NAMES);
    const kind = ri(0, 5);
    if (kind === 0) {
      // Belanja & kembalian
      const item = pick(["buku tulis", "pensil warna", "roti", "susu kotak", "penggaris", "apel", "telur"]);
      const qty = ri(2, 3 + level + big);
      const price = pick([1000, 1500, 2000, 2500, 3000, 4000, 5000]) * big;
      const total = qty * price;
      const money = pick([20000, 50000, 100000]) * (big >= 3 ? 2 : 1);
      if (total >= money) return mathStoryGen(jenjang)(level);
      if (Math.random() < 0.5 || jenjang === "TK") {
        return mkNum(`${name} membeli ${qty} ${item} seharga Rp${fmt(price)} per buah. Total belanja ${name} adalah …`, total, [total - price, total + price, total + 1000], `${qty} × Rp${fmt(price)} = Rp${fmt(total)}.`, "🛒", four);
      }
      return mkNum(`${name} membeli ${qty} ${item} seharga Rp${fmt(price)} per buah dan membayar dengan Rp${fmt(money)}. Kembalian ${name} adalah …`, money - total, [money - total + price, money - total - 1000, total], `Total Rp${fmt(total)}; kembalian = ${fmt(money)} − ${fmt(total)} = Rp${fmt(money - total)}.`, "🛒", four);
    }
    if (kind === 1) {
      // Memasak: skala resep
      const eggs = ri(2, 4);
      const scale = ri(2, 3 + Math.min(2, level - 1));
      const need = eggs * scale;
      return mkNum(`Resep untuk 1 loyang memakai ${eggs} telur. Ibu membuat ${scale} loyang. Telur yang dibutuhkan adalah …`, need, [need - eggs, need + eggs, eggs + scale], `${eggs} × ${scale} loyang = ${need} telur. Resep diskala dengan perkalian.`, "🍳", four);
    }
    if (kind === 2) {
      // Perjalanan: jarak-waktu-kecepatan sederhana
      if (jenjang === "TK") {
        const a = ri(2, 9); const b = ri(1, a - 1);
        return mkNum(`${name} berjalan ${a} langkah, lalu ${b} langkah lagi. Total langkah ${name} adalah …`, a + b, [a + b - 1, a + b + 1, a], `${a} + ${b} = ${a + b} langkah.`, "🚶", four);
      }
      const v = pick([5, 10, 12, 15, 20, 30, 40, 60]) * (big >= 3 ? 1 : 1);
      const t = ri(2, 3 + level);
      const s = v * t;
      if (Math.random() < 0.5) return mkNum(`${name} bersepeda dengan kecepatan ${v} km/jam selama ${t} jam. Jarak yang ditempuh adalah … km`, s, [s - v, s + v, v + t], `Jarak = kecepatan × waktu = ${v} × ${t} = ${s} km.`, "🚴", four);
      return mkNum(`${name} menempuh jarak ${s} km dengan kecepatan ${v} km/jam. Waktu tempuhnya adalah … jam`, t, [t - 1, t + 1, t + 2].filter((x) => x > 0), `Waktu = jarak : kecepatan = ${s} : ${v} = ${t} jam.`, "🚴", four);
    }
    if (kind === 3) {
      // Kebun
      const rows = ri(2, 4 + level);
      const per = ri(3, 5 + level + big);
      const total = rows * per;
      return mkNum(`Di kebun ada ${rows} baris tanaman, tiap baris ${per} pohon. Jumlah semua pohon adalah …`, total, [total - per, total + per, rows + per], `${rows} × ${per} = ${total} pohon.`, "🌱", four);
    }
    if (kind === 4) {
      // Tabungan
      const perWeek = pick([2000, 3000, 5000, 10000]) * big;
      const weeks = ri(3, 4 + level * 2);
      const total = perWeek * weeks;
      return mkNum(`${name} menabung Rp${fmt(perWeek)} setiap minggu. Setelah ${weeks} minggu, tabungan ${name} adalah …`, total, [total - perWeek, total + perWeek, perWeek + weeks], `${fmt(perWeek)} × ${weeks} = Rp${fmt(total)}.`, "🐷", four);
    }
    // Berbagi & sisa
    const friends = ri(2, 3 + Math.min(4, level + big));
    const per = ri(2, 5 + level);
    const rem = jenjang === "TK" ? 0 : ri(0, friends - 1);
    const total = friends * per + rem;
    if (rem === 0 || level <= 2) {
      const shown = rem === 0 ? total : friends * per;
      return mkNum(`${shown} permen dibagikan rata kepada ${friends} anak. Setiap anak mendapat … permen`, per, [per - 1, per + 1, per + 2].filter((x) => x > 0), `${shown} : ${friends} = ${per} permen per anak.`, "🍬", four);
    }
    return mkq(`${total} permen dibagikan rata kepada ${friends} anak. Setiap anak mendapat … dan sisanya …`, `${per} permen, sisa ${rem}`, [`${per} permen, sisa ${rem + 1}`, `${per + 1} permen, sisa ${rem}`, `${friends} permen, sisa ${per}`], `${friends} × ${per} = ${total - rem}; ${total} − ${total - rem} = sisa ${rem}.`, "🍬", four);
  };
}

/* ---------- MATEMATIKA NALARIA ---------- */
function nalariaGens(jenjang: JenjangId): LGen[] {
  const four = jenjang !== "TK";
  const big = jenjang === "SMA" ? 4 : jenjang === "SMP" ? 3 : jenjang === "SD" ? 2 : 1;
  const shopping: LGen = (level) => mathStoryGen(jenjang)(level);
  const remainderTrap: LGen = (level) => {
    if (jenjang === "TK") {
      const a = ri(4, 6 + level * 2); const share = 2; const per = Math.floor(a / share); const rem = a % share;
      if (rem === 0) return mkNum(`${a} biskuit dibagikan rata ke 2 anak. Setiap anak mendapat … biskuit`, per, [per - 1, per + 1, a].filter((x) => x > 0), `${a} : 2 = ${per}.`, "🍪", four);
      return mkq(`${a} biskuit dibagikan rata ke 2 anak. Setiap anak mendapat … dan sisanya …`, `${per} biskuit, sisa ${rem}`, [`${per} biskuit, sisa 0`, `${per + 1} biskuit, sisa ${rem}`], `2 × ${per} = ${a - rem}; sisa ${a} − ${a - rem} = ${rem}.`, "🍪", four);
    }
    const divisor = ri(3, 4 + level + big);
    const per = ri(3, 6 + level * 2);
    const rem = ri(1, divisor - 1);
    const total = divisor * per + rem;
    return mkq(`Sebanyak ${total} kelereng dibagikan rata kepada ${divisor} anak. Setiap anak mendapat … dan sisanya …`, `${per} kelereng, sisa ${rem}`, [`${per} kelereng, sisa ${rem + 1}`, `${per + 1} kelereng, sisa ${rem}`, `${per - 1} kelereng, sisa ${rem + divisor}`], `${divisor} × ${per} = ${total - rem}; sisa = ${total} − ${total - rem} = ${rem}. Ini jebakan nalaria klasik: sisa tidak boleh lebih besar dari pembagi.`, "🔮", four);
  };
  const patternLogic: LGen = (level) => {
    if (jenjang === "TK") return emojiPictureGen(jenjang)(level);
    const start = ri(2, 12);
    const mode = ri(0, 2);
    if (mode === 0) {
      const d = ri(2, 3 + level);
      const seq = [0, 1, 2, 3].map((i) => start + i * d);
      const ans = start + 4 * d;
      return mkNum(`Pola bilangan: ${seq.join(", ")}, … Bilangan berikutnya adalah … (pikirkan alasannya, bukan asal tambah!)`, ans, [ans - d, ans + d, ans + 1], `Selisihnya selalu +${d}: ${seq[3]} + ${d} = ${ans}.`, "🔢", four);
    }
    if (mode === 1) {
      const seq = [start, start + 2, start + 5, start + 9, start + 14];
      const ans = start + 20;
      return mkNum(`Pola bilangan: ${seq.join(", ")}, … Bilangan berikutnya adalah …`, ans, [ans - 3, ans + 4, ans - 6], `Selisihnya +2, +3, +4, +5 — berikutnya +6: ${start + 14} + 6 = ${ans}.`, "🔢", four);
    }
    const seq = [1, 2, 4, 7, 11];
    const off = ri(0, 8);
    const shown = seq.map((x) => x + off);
    const ans = 16 + off;
    return mkNum(`Pola bilangan: ${shown.join(", ")}, … Bilangan berikutnya adalah …`, ans, [ans - 4, ans + 5, ans + 1], `Selisihnya +1, +2, +3, +4 — berikutnya +5: ${11 + off} + 5 = ${ans}.`, "🔢", four);
  };
  const compareTrap: LGen = (level) => {
    const nameA = pick(NAMES); let nameB = pick(NAMES); if (nameB === nameA) nameB = "Rina";
    const a = ri(5, 20) * big; const b = a + pick([-6, -4, -3, 3, 4, 6]) * (big >= 2 ? 1 : 1);
    if (b <= 0) return compareTrap(level);
    const more = a > b ? nameA : nameB;
    const ans = `${more} lebih banyak ${Math.abs(a - b)}`;
    const less = more === nameA ? nameB : nameA;
    return mkq(`${nameA} mengumpulkan ${a} stiker. ${nameB} mengumpulkan ${b} stiker. Kesimpulan yang BENAR adalah …`, ans, [`${more} lebih banyak ${Math.abs(a - b) + 2}`, `${less} lebih banyak ${Math.abs(a - b)}`, `Keduanya sama banyak`], `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}. Yang lebih banyak adalah ${more}.`, "⚖️", four);
  };
  const setsLogic: LGen = (level) => {
    if (jenjang === "TK") {
      const red = ri(2, 6); const blue = ri(2, 6);
      return mkNum(`Di kotak ada ${red} bola merah dan ${blue} bola biru. Jumlah semua bola adalah …`, red + blue, [red + blue - 1, red + blue + 1, red * blue], `${red} + ${blue} = ${red + blue} bola.`, "🔴", four);
    }
    const total = pick([25, 30, 36, 40, 50]) + (level >= 4 ? 10 : 0);
    const both = ri(3, 5 + level);
    const onlyA = ri(6, 12 + level * 2);
    const onlyB = ri(5, 11 + level * 2);
    if (onlyA + onlyB + both > total) return setsLogic(level);
    const aTotal = onlyA + both; const bTotal = onlyB + both;
    const neither = total - (onlyA + onlyB + both);
    if (Math.random() < 0.5) {
      return mkNum(`Dari ${total} siswa, ${aTotal} suka matematika, ${bTotal} suka IPA, dan ${both} suka keduanya. Siswa yang suka matematika SAJA adalah …`, onlyA, [aTotal, onlyA + 2, aTotal + both].filter((x) => x >= 0 && x !== onlyA), `Suka matematika saja = ${aTotal} − ${both} (yang suka keduanya) = ${onlyA}.`, "👥", four);
    }
    return mkNum(`Dari ${total} siswa, ${aTotal} suka matematika, ${bTotal} suka IPA, dan ${both} suka keduanya. Siswa yang TIDAK suka keduanya adalah …`, neither, [neither + both, total - aTotal, neither + 3], `Suka minimal satu = ${aTotal} + ${bTotal} − ${both} = ${aTotal + bTotal - both}. Tidak suka keduanya = ${total} − ${aTotal + bTotal - both} = ${neither}.`, "👥", four);
  };
  const speedStory: LGen = (level) => {
    if (jenjang === "TK") return mathStoryGen(jenjang)(level);
    const v = pick([10, 12, 15, 20, 24, 30, 40, 60]);
    const t = ri(2, 3 + level);
    const s = v * t;
    const askTime = Math.random() < 0.5;
    if (askTime) return mkNum(`Sebuah kendaraan menempuh ${s} km dengan kecepatan tetap ${v} km/jam. Waktu yang dibutuhkan adalah … jam`, t, [t - 1, t + 1, s / (v + 10)].filter((x) => Number.isInteger(x) && x > 0 && x !== t), `Waktu = ${s} : ${v} = ${t} jam.`, "🚌", four);
    return mkNum(`Sebuah kendaraan melaju ${v} km/jam selama ${t} jam tanpa berhenti. Jarak tempuhnya adalah … km`, s, [s - v, s + v, v * (t + 1)], `Jarak = ${v} × ${t} = ${s} km.`, "🚌", four);
  };
  const averageTrap: LGen = (level) => {
    if (jenjang === "TK" || jenjang === "SD" && level < 3) return mathStoryGen(jenjang)(level);
    const n = pick([4, 5]);
    const avg = pick([70, 75, 80, 85]);
    const known = Array.from({ length: n - 1 }, () => ri(60, 95));
    const need = n * avg - known.reduce((s, x) => s + x, 0);
    if (need < 0 || need > 100) return averageTrap(level);
    return mkNum(`Rata-rata nilai ${n} siswa adalah ${avg}. Nilai ${n - 1} siswa adalah ${known.join(", ")}. Nilai siswa terakhir adalah …`, need, [need - 5, need + 5, avg].filter((x) => x !== need && x >= 0), `Total nilai = ${n} × ${avg} = ${n * avg}. Jumlah ${n - 1} siswa = ${known.reduce((s, x) => s + x, 0)}. Siswa terakhir = ${n * avg} − ${known.reduce((s, x) => s + x, 0)} = ${need}.`, "📊", four);
  };
  const workMixture: LGen = (level) => {
    if (jenjang !== "SMA" && jenjang !== "SMP") return patternLogic(level);
    if (jenjang === "SMA" && Math.random() < 0.5) {
      const volA = ri(1, 4); const pctA = pick([20, 30, 40, 50]);
      const volB = ri(2, 5); const sugar = (volA * pctA) / 100;
      const totalVol = volA + volB;
      const pct = Math.round((sugar / totalVol) * 1000) / 10;
      if (!Number.isInteger(pct)) return workMixture(level);
      return mkNum(`${volA} liter larutan berkadar ${pctA}% dicampur ${volB} liter air murni (0%). Kadar campuran adalah … %`, pct, [pct + 5, pctA, Math.max(1, pct - 4)], `Zat terlarut = ${volA} × ${pctA}% = ${sugar} liter dalam ${totalVol} liter → ${pct}%.`, "🧪", four);
    }
    const together = pick([4, 6, 8, 12]);
    const aDays = pick([8, 10, 12, 15, 20, 24]);
    // 1/B = 1/together - 1/A harus positif & menghasilkan hari bulat sederhana
    const denom = together * aDays;
    const numer = aDays - together;
    if (numer <= 0 || denom % numer !== 0) return workMixture(level);
    const bDays = denom / numer;
    if (bDays > 60 || !Number.isInteger(bDays)) return workMixture(level);
    return mkNum(`Dua pekerja bersama menyelesaikan pekerjaan dalam ${together} hari. Pekerja A sendiri butuh ${aDays} hari. Pekerja B sendiri butuh … hari`, bDays, [bDays + 5, together + aDays, Math.max(1, bDays - 3)], `1/B = 1/${together} − 1/${aDays} → B = ${bDays} hari.`, "🔧", four);
  };
  return [shopping, remainderTrap, patternLogic, compareTrap, setsLogic, speedStory, averageTrap, workMixture, emojiPictureGen(jenjang)];
}

/* ---------- KANGURU MATEMATIKA ---------- */
function kanguruMathGens(jenjang: JenjangId): LGen[] {
  const four = jenjang !== "TK";
  const queueGen: LGen = () => {
    const names = sample(NAMES, jenjang === "TK" ? 3 : 5);
    const targetIdx = ri(0, names.length - 1);
    const target = names[targetIdx] as string;
    const fromFront = targetIdx + 1;
    const fromBack = names.length - targetIdx;
    if (jenjang === "TK") {
      const askBack = Math.random() < 0.5;
      const correct = askBack ? (names[names.length - 1] as string) : (names[0] as string);
      const others = names.filter((n) => n !== correct);
      return mkq(`Antrean: ${names.join(" – ")} (dari depan ke belakang). Siapa yang paling ${askBack ? "BELAKANG" : "DEPAN"}?`, correct, others.slice(0, 2), `Urutan dari depan: ${names.join(", ")}. Paling ${askBack ? "belakang" : "depan"} adalah ${correct}.`, "🚶", four);
    }
    if (Math.random() < 0.5) {
      const total = names.length;
      return mkNum(`Di antrean, ${target} urutan ke-${fromFront} dari depan dan ke-${fromBack} dari belakang. Jumlah orang di antrean seharusnya … (cek konsistensinya!)`, total, [total - 1, total + 1, fromFront + fromBack], `Jumlah = ${fromFront} + ${fromBack} − 1 = ${total}. Dikurangi 1 karena ${target} terhitung dua kali.`, "🚶", four);
    }
    const total = ri(6, 9 + 4);
    const front = ri(2, total - 2);
    const back = total - front + 1;
    const person = pick(NAMES);
    return mkNum(`${person} urutan ke-${front} dari depan dan ke-${back} dari belakang dalam antrean. Jumlah orang di antrean adalah …`, total, [front + back, total - 1, total + 2], `${front} + ${back} − 1 = ${total} orang.`, "🚶", four);
  };
  const ageGen: LGen = (level) => {
    const child = ri(5, 9 + level * 2);
    const diff = ri(2, 4 + level);
    const older = child + diff;
    if (Math.random() < 0.5 || jenjang === "TK") {
      const c = jenjang === "TK" ? ri(3, 7) : child;
      const d = jenjang === "TK" ? ri(1, 4) : diff;
      return mkNum(`Umur Dina ${c} tahun. Umur kakaknya ${d} tahun lebih tua. Umur kakak Dina adalah … tahun`, c + d, [c + d - 1, c + d + 1, c + d + 2], `${c} + ${d} = ${c + d} tahun.`, "🎂", four);
    }
    const sum = child + older;
    return mkNum(`Umur Sinta ${child} tahun, umur kakaknya ${diff} tahun lebih tua. Jumlah umur mereka adalah … tahun`, sum, [sum - diff, sum + 2, older], `Kakak: ${child}+${diff} = ${older}. Jumlah: ${child}+${older} = ${sum}.`, "🎂", four);
  };
  const foldGen: LGen = () => {
    if (jenjang === "TK") {
      return mkq(`Kertas dilipat jadi 2 satu kali. Kertas itu sekarang punya … lapisan`, "2 lapisan", ["1 lapisan", "3 lapisan"], `Satu lipatan membagi kertas menjadi 2 lapisan.`, "📄", four);
    }
    const folds = ri(1, 3);
    const holes = ri(1, 2);
    const layers = 2 ** folds;
    const ans = layers * holes;
    return mkNum(`Selembar kertas dilipat jadi 2 sebanyak ${folds} kali, lalu dibuat ${holes} lubang menembus semua lapisan. Saat dibuka penuh, jumlah lubang adalah …`, ans, [ans / 2, ans + layers, holes + folds].filter((x) => Number.isInteger(x) && x !== ans), `${folds} lipatan = ${layers} lapisan. ${holes} lubang × ${layers} = ${ans} lubang.`, "📄", four);
  };
  const directionGen: LGen = () => {
    const dirs = ["Utara", "Timur", "Selatan", "Barat"] as const;
    const start = ri(0, 3);
    const turns = pick([90, 180, 270]);
    const clockwise = Math.random() < 0.5;
    const steps = turns / 90;
    const end = clockwise ? (start + steps) % 4 : (start - steps + 8) % 4;
    const ans = dirs[end] as string;
    const others = dirs.filter((d) => d !== ans);
    return mkq(`Kamu menghadap ke ${dirs[start]}. Lalu berputar ${turns}° ke ${clockwise ? "kanan (searah jarum jam)" : "kiri (berlawanan jarum jam)"}. Sekarang kamu menghadap ke …`, ans, sample(others, four ? 3 : 2), `Dari ${dirs[start]}, putar ${turns}° ke ${clockwise ? "kanan" : "kiri"} → ${ans}. Bayangkan kompas: Utara–Timur–Selatan–Barat.`, "🧭", four);
  };
  const clueCountGen: LGen = (level) => {
    // Hitung benda dari petunjuk: roda / kaki
    if (Math.random() < 0.5) {
      const bikes = ri(2, 5 + level);
      const cars = ri(2, 5 + level);
      const wheels = bikes * 2 + cars * 4;
      return mkNum(`Di parkiran ada ${bikes} sepeda (2 roda) dan ${cars} mobil (4 roda). Jumlah semua roda adalah …`, wheels, [wheels - 2, wheels + 4, (bikes + cars) * 3], `Sepeda: ${bikes}×2 = ${bikes * 2}. Mobil: ${cars}×4 = ${cars * 4}. Total ${wheels} roda.`, "🚲", four);
    }
    const cats = ri(2, 6 + level);
    const chickens = ri(2, 6 + level);
    const legs = cats * 4 + chickens * 2;
    return mkNum(`Di kandang ada ${cats} kucing (4 kaki) dan ${chickens} ayam (2 kaki). Jumlah semua kaki adalah …`, legs, [legs - 2, legs + 2, (cats + chickens) * 4], `Kucing: ${cats}×4 = ${cats * 4}. Ayam: ${chickens}×2 = ${chickens * 2}. Total ${legs} kaki.`, "🐱", four);
  };
  const patternVisual: LGen = (level) => {
    if (jenjang === "TK") return emojiPictureGen(jenjang)(level);
    const mode = ri(0, 1);
    if (mode === 0) {
      const a = ri(2, 9); const seq = [a, a * 2, a * 3, a * 4];
      const ans = a * 5;
      return mkNum(`Pola kelipatan: ${seq.join(", ")}, … Berikutnya adalah …`, ans, [ans - a, ans + a, ans + 2], `Polanya kelipatan ${a}: ${a}, ${a * 2}, ${a * 3}, ${a * 4}, ${ans}.`, "🔢", four);
    }
    const start = ri(3, 15);
    const seq = [start, start + 3, start + 7, start + 12, start + 18];
    const ans = start + 25;
    return mkNum(`Pola: ${seq.join(", ")}, … Berikutnya adalah …`, ans, [ans - 5, ans + 6, ans - 7], `Selisih +3, +4, +5, +6, berikutnya +7: ${start + 18} + 7 = ${ans}.`, "🔢", four);
  };
  const cubeShadow: LGen = (level) => {
    if (jenjang === "TK") {
      return mkq(`Bola jika disinari dari atas, bayangannya berbentuk …`, "Lingkaran", ["Segitiga", "Persegi"], `Bayangan bola selalu berbentuk lingkaran dari arah mana pun.`, "🔦", four);
    }
    if (jenjang === "SMA" && level >= 3) {
      // Kubus kecil bercat: klasik Kanguru
      const n = pick([3, 4]);
      const totalSmall = n ** 3;
      const twoFaces = 12 * (n - 2);
      return mkNum(`Sebuah kubus besar tersusun dari ${totalSmall} kubus kecil (${n}×${n}×${n}) dan seluruh permukaannya dicat. Kubus kecil dengan tepat 2 sisi bercat ada …`, twoFaces, [8, twoFaces + 4, 6 * (n - 2) * (n - 2)], `Yang 2 sisi bercat ada di tengah tiap rusuk: 12 rusuk × ${n - 2} = ${twoFaces}. (Sudut = 3 sisi: 8 buah.)`, "🧊", four);
    }
    const s = ri(3, 9);
    return mkNum(`Sebuah persegi punya sisi ${s} cm. Jika semua sisinya diperpanjang 1 cm, keliling barunya adalah … cm`, 4 * (s + 1), [4 * s, 4 * (s + 1) + 4, (s + 1) * (s + 1)], `Sisi baru ${s + 1} cm, keliling = 4 × ${s + 1} = ${4 * (s + 1)} cm.`, "⬛", four);
  };
  return [queueGen, ageGen, foldGen, directionGen, clueCountGen, patternVisual, cubeShadow, emojiPictureGen(jenjang)];
}

/* ---------- KANGURU BAHASA ---------- */
const SYLLABLE_WORDS: readonly (readonly [string, number, string])[] = [
  ["buku", 2, "bu-ku"], ["sekolah", 3, "se-ko-lah"], ["berlari", 3, "ber-la-ri"], ["kupu-kupu", 4, "ku-pu-ku-pu"],
  ["matematika", 5, "ma-te-ma-ti-ka"], ["perpustakaan", 5, "per-pus-ta-ka-an"], ["apel", 2, "a-pel"], ["jendela", 3, "jen-de-la"],
  ["kelinci", 3, "ke-lin-ci"], ["sepeda", 3, "se-pe-da"], ["televisi", 4, "te-le-vi-si"], ["Indonesia", 4, "In-do-ne-sia"],
  ["gembira", 3, "gem-bi-ra"], ["melompat", 3, "me-lom-pat"], ["matahari", 4, "ma-ta-ha-ri"], ["pesawat", 3, "pe-sa-wat"],
] as const;
const ALPHA_WORDS = ["apel", "buku", "ceri", "duku", "elang", "foto", "gajah", "harimau", "ikan", "jerapah", "kuda", "lemon", "mangga", "nanas", "obor", "pisang", "rusa", "sapi", "tomat", "ular", "zebra"] as const;
const HIDDEN_WORDS: readonly (readonly [string, string, string])[] = [
  ["SEPATU", "alas kaki", "S _ P _ T U"], ["BUKU", "bahan bacaan", "B _ K _"], ["MEJA", "tempat menaruh buku", "M _ J _"],
  ["KURSI", "tempat duduk", "K _ RS _"], ["PENSIL", "alat tulis", "P _ NS _ L"], ["SEKOLAH", "tempat belajar", "S _ K _ L _ H"],
  ["JENDELA", "tempat cahaya masuk", "J _ ND _ L _"], ["PAYUNG", "pelindung hujan", "P _ Y _ NG"],
] as const;
const EN_SIMPLE: readonly (readonly [string, string])[] = [
  ["cat", "kucing"], ["dog", "anjing"], ["bird", "burung"], ["fish", "ikan"], ["apple", "apel"], ["book", "buku"],
  ["sun", "matahari"], ["moon", "bulan"], ["star", "bintang"], ["water", "air"], ["milk", "susu"], ["egg", "telur"],
  ["red", "merah"], ["blue", "biru"], ["happy", "senang"], ["big", "besar"], ["small", "kecil"], ["fast", "cepat"],
] as const;
function kanguruBahasaGens(jenjang: JenjangId): LGen[] {
  const four = jenjang !== "TK";
  const alphaGen: LGen = () => {
    const chosen = sample(ALPHA_WORDS, four ? 4 : 3);
    const sorted = [...chosen].sort((a, b) => a.localeCompare(b, "id"));
    const correct = sorted.join(", ");
    const wrong1 = [...chosen].join(", ");
    const wrong2 = [...sorted].reverse().join(", ");
    const wrong3 = [sorted[1], sorted[0], ...sorted.slice(2)].join(", ");
    const distractors = [wrong1, wrong2, wrong3].filter((w) => w !== correct);
    return mkq(`Urutan abjad yang BENAR untuk kata-kata: ${chosen.join(", ")} adalah …`, correct, distractors, `Urutkan dari huruf awal terkecil: ${correct}.`, "🔤", four);
  };
  const syllableGen: LGen = () => {
    const w = pick(SYLLABLE_WORDS);
    return mkNum(`Kata “${w[0]}” terdiri dari … suku kata`, w[1], [w[1] - 1, w[1] + 1, w[1] + 2].filter((x) => x > 0), `“${w[0]}” dipecah: ${w[2]} = ${w[1]} suku kata. Tepuk tangan tiap suku kata untuk mengecek!`, "👏", four);
  };
  const hiddenGen: LGen = () => {
    const h = pick(HIDDEN_WORDS);
    const others = sample(HIDDEN_WORDS.filter((x) => x[0] !== h[0]), four ? 3 : 2).map((x) => x[0]);
    return mkq(`Tebak kata tersembunyi: ${h[2]} — petunjuknya: ${h[1]}. Kata lengkapnya adalah …`, h[0], others, `Huruf-hurufnya membentuk kata ${h[0]} (${h[1]}).`, "🔍", four);
  };
  const meaningContextGen: LGen = () => {
    const useAntonym = Math.random() < 0.5;
    const pairs = useAntonym ? ANTONIM_ID : SINONIM_ID;
    const p = pick(pairs);
    const others = sample(pairs.filter((x) => x[1] !== p[1] && x[0] !== p[0]), four ? 3 : 2).map((x) => x[1]);
    return mkq(`Dalam konteks cerita, ${useAntonym ? "lawan kata" : "persamaan kata"} dari “${p[0]}” adalah …`, p[1], others, `${p[0]} ${useAntonym ? "><" : "≈"} ${p[1]}. Baca kalimat ceritanya untuk memastikan maknanya pas.`, "📖", four);
  };
  const rumpangGen: LGen = () => {
    const scenes: readonly (readonly [string, string, readonly string[]])[] = [
      ["Ibu pergi ke pasar untuk membeli … untuk dimasak malam ini.", "sayuran segar", ["awan mendung", "angka ganjil", "suara merdu"]],
      ["Karena lupa membawa payung, baju Rian menjadi … terkena hujan.", "basah kuyup", ["kering kerontang", "rapi sekali", "wangi bunga"]],
      ["Setelah berlatih setiap hari, Dita akhirnya … lomba menyanyi di sekolahnya.", "memenangkan", ["membatalkan", "melupakan jadwal", "menjual"]],
      ["Pustakawan meminta kami … buku yang dipinjam tepat waktu.", "mengembalikan", ["menyembunyikan", "merobek", "mewarnai sampul"]],
      ["Agar tubuh sehat, kita perlu makan makanan bergizi dan … secara teratur.", "berolahraga", ["begadang", "bermalas-malasan", "melewatkan sarapan selalu"]],
    ];
    const s = pick(scenes);
    return mkq(`Kalimat rumpang — pilih kata yang paling LOGIS: “${s[0]}”`, s[1], [...s[2]], `Pilihan yang masuk akal dalam cerita itu adalah “${s[1]}”. Pilihan lain terdengar janggal bila dibaca utuh.`, "✏️", four);
  };
  const patternWordGen: LGen = () => {
    if (jenjang === "TK") {
      const w = pick(["ada", "apa", "oto", "ini"]);
      return mkq(`Kata “${w}” — huruf pertama dan terakhirnya adalah …`, `Sama-sama huruf “${w[0]}”`, [`Huruf “${w[0]}” dan “${w[2]}” yang berbeda`, `Huruf “${w[1]}” semua`], `“${w}” dibaca ${w.split("").join("-")}: huruf pertama dan terakhir sama, yaitu “${w[0]}”.`, "🔤", four);
    }
    const words: readonly (readonly [string, string])[] = [["ada", "ABA"], ["susu", "ABAB"], ["apa", "ABA"], ["lari", "ABCD"], ["buku", "ABCB"], ["mata", "ABCB"], ["makan", "ABCBD"], ["ibu", "ABC"]];
    const w = pick(words);
    const others = ["ABA", "ABC", "AAB", "ABAB", "ABCD", "ABCB", "ABCBD"].filter((x) => x !== w[1]);
    return mkq(`Pola huruf kata “${w[0]}” (huruf yang sama diberi huruf pola yang sama) adalah …`, w[1], sample(others, four ? 3 : 2), `“${w[0]}”: ${w[0].split("").join("-")} → pola ${w[1]}.`, "🔤", four);
  };
  const englishIntroGen: LGen = () => {
    const p = pick(EN_SIMPLE);
    const others = sample(EN_SIMPLE.filter((x) => x[1] !== p[1]), four ? 3 : 2).map((x) => x[1]);
    if (Math.random() < 0.5) return mkq(`In English, “${p[0]}” artinya …`, p[1], others, `“${p[0]}” dalam Bahasa Inggris artinya ${p[1]}.`, "🇬🇧", four);
    const othersEn = sample(EN_SIMPLE.filter((x) => x[0] !== p[0]), four ? 3 : 2).map((x) => x[0]);
    return mkq(`Bahasa Inggris dari “${p[1]}” adalah …`, p[0], othersEn, `“${p[1]}” dalam Bahasa Inggris adalah “${p[0]}”.`, "🇬🇧", four);
  };
  const firstLetterGen: LGen = () => {
    const w = pick(ALPHA_WORDS);
    const first = w[0] as string;
    const others = sample(ALPHA_WORDS.filter((x) => x[0] !== first), four ? 3 : 2).map((x) => x[0] as string);
    return mkq(`Huruf pertama kata “${w}” adalah …`, first.toUpperCase(), others.map((x) => x.toUpperCase()), `“${w}” diawali huruf ${first.toUpperCase()}.`, "🔤", four);
  };
  return [alphaGen, syllableGen, hiddenGen, meaningContextGen, rumpangGen, patternWordGen, englishIntroGen, firstLetterGen];
}

/* ================================================================
   PAKET GAYA INTERNASIONAL — ORIGINAL buatan ZIQVA OLIM.
   Mengikuti CIRI KHAS topik, format, dan tingkat kesulitan lomba
   SEAMO / SASMO / AMO / JSO. BUKAN soal resmi lomba tersebut dan
   BUKAN salinan past paper mana pun: semua soal digenerasikan
   sendiri dengan angka, nama, dan konteks acak; kunci jawaban
   selalu DIHITUNG oleh kode dari parameter soalnya.
   ================================================================ */
const INTL_NAMES_EN = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Mason", "Sophia", "Lucas", "Mia", "Ethan"] as const;

/* ---------- SEAMO STYLE: penalaran logis, pola visual, cerita Inggris sederhana (jenjang atas) ---------- */
function seamoGens(jenjang: JenjangId): LGen[] {
  const four = jenjang !== "TK";
  const visualPattern: LGen = () => {
    const sets: readonly (readonly [string, string])[] = [["⭐", "🌙"], ["🔺", "⭕"], ["🍎", "🍌"], ["🔴", "🔵"], ["🌸", "🍀"]];
    const pair = pick(sets);
    const a = pair[0]; const b = pair[1];
    const mode = ri(0, 1);
    // Pola A A B berulang (mode 0) atau A B A B bergantian (mode 1)
    const seqArr: string[] = [];
    if (mode === 0) { for (let i = 0; i < 7; i++) seqArr.push(i % 3 === 2 ? b : a); }
    else { for (let i = 0; i < 7; i++) seqArr.push(i % 2 === 0 ? a : b); }
    const next = mode === 0 ? a : b;
    const other = next === a ? b : a;
    const extras = ["☀️", "⬛", "💧", "🍇"].filter((x) => x !== a && x !== b);
    const third = extras[0] as string;
    const fourthOpt = extras[1] as string;
    return mkq(
      `Pola gambar: ${seqArr.join(" ")} … Gambar berikutnya adalah …`,
      next, [other, third, fourthOpt],
      mode === 0
        ? `Polanya berulang tiap 3 gambar: dua ${a} lalu satu ${b}. Sesudah rangkaian terakhir dimulai lagi, berikutnya ${next}.`
        : `Polanya bergantian ${a} – ${b} – ${a} – ${b}. Sesudah ${seqArr[seqArr.length - 1]} berikutnya ${next}.`,
      a, four,
    );
  };
  const numberLogic: LGen = () => {
    if (jenjang === "TK") {
      const start = ri(1, 5);
      const step = pick([1, 2]);
      const seq = [0, 1, 2, 3].map((i) => start + i * step);
      const ans = start + 4 * step;
      return mkNum(`Pola bilangan: ${seq.join(", ")}, … Bilangan berikutnya adalah …`, ans, [ans - step, ans + step, ans + 1].filter((x) => x > 0 && x !== ans), `Setiap langkah bertambah ${step}: ${seq[3]} + ${step} = ${ans}.`, "🔢", four);
    }
    const mode = ri(0, 2);
    if (mode === 0) {
      // Selisih berlipat dua
      const start = ri(2, 8);
      const d0 = pick([2, 3, 4, 5]);
      const seq = [start];
      let d = d0;
      for (let i = 0; i < 4; i++) { seq.push((seq[seq.length - 1] as number) + d); d *= 2; }
      const ans = (seq[seq.length - 1] as number) + d;
      return mkNum(`Pola bilangan: ${seq.join(", ")}, … Bilangan berikutnya adalah … (perhatikan selisihnya!)`, ans, [ans - d0, ans + d, ans - 2].filter((x) => x !== ans), `Selisihnya +${d0}, +${d0 * 2}, +${d0 * 4}, +${d0 * 8} — selalu dua kali lipat. Berikutnya +${d} → ${ans}.`, "🔢", four);
    }
    if (mode === 1) {
      // Selisih bilangan kuadrat
      const start = ri(1, 6);
      const seq = [start];
      for (let i = 1; i <= 4; i++) seq.push((seq[seq.length - 1] as number) + i * i);
      const ans = (seq[seq.length - 1] as number) + 25;
      return mkNum(`Pola bilangan: ${seq.join(", ")}, … Bilangan berikutnya adalah …`, ans, [ans - 9, ans + 11, ans + 25].filter((x) => x !== ans), `Selisihnya +1, +4, +9, +16 — bilangan kuadrat (1², 2², 3², 4²). Berikutnya +25 (5²) → ${ans}.`, "🔢", four);
    }
    // Aturan kali lalu tambah/kurang
    const start = ri(2, 5);
    const mul = pick([2, 3]);
    const seq = [start];
    for (let i = 0; i < 3; i++) seq.push((seq[seq.length - 1] as number) * mul - 1);
    const ans = (seq[seq.length - 1] as number) * mul - 1;
    return mkNum(`Setiap suku diperoleh dengan mengali suku sebelumnya dengan ${mul} lalu mengurangi 1: ${seq.join(", ")}, … Suku berikutnya adalah …`, ans, [ans + mul, ans + 1, ans - 2].filter((x) => x !== ans), `${seq[seq.length - 1]} × ${mul} − 1 = ${ans}. Periksa dari awal: ${seq[0]}×${mul}−1 = ${seq[1]}.`, "🔢", four);
  };
  const orderingLogic: LGen = () => {
    const trio = sample(NAMES, 3);
    const vals = shuffle([ri(5, 9), ri(10, 14), ri(15, 20)]);
    // Urutkan: trio[0] paling besar, trio[1] tengah, trio[2] terkecil (berdasarkan vals yang diurutkan menurun)
    const sorted = [...vals].sort((x, y) => y - x);
    const [big, mid, small] = sorted as [number, number, number];
    const topic = pick(["tinggi badan (cm di atas 100)", "umur (tahun)", "jumlah stiker"] as const);
    const unit = topic.startsWith("tinggi") ? "" : topic.startsWith("umur") ? " tahun" : " stiker";
    const shownVal = (v: number) => (topic.startsWith("tinggi") ? `${100 + v} cm` : `${v}${unit}`);
    if (jenjang === "TK") {
      return mkq(
        `${trio[0]} punya ${big} balon 🎈, ${trio[1]} punya ${mid} balon, ${trio[2]} punya ${small} balon. Siapa yang balonnya PALING BANYAK?`,
        trio[0] as string, [trio[1] as string, trio[2] as string],
        `${big} adalah bilangan terbesar, jadi ${trio[0]} paling banyak. Penalaran SEAMO style: bandingkan semua angka dulu, baru simpulkan.`,
        "🎈", four,
      );
    }
    const askMax = Math.random() < 0.5;
    const correct = askMax ? (trio[0] as string) : (trio[2] as string);
    const correctVal = askMax ? big : small;
    return mkq(
      `Data: ${trio[0]} — ${shownVal(big)}; ${trio[1]} — ${shownVal(mid)}; ${trio[2]} — ${shownVal(small)}. Siapa yang PALING ${askMax ? "BESAR nilainya" : "KECIL nilainya"}?`,
      `${correct} (${shownVal(correctVal)})`,
      [...trio.filter((n) => n !== correct).map((n) => `${n} (${shownVal(n === trio[0] ? big : n === trio[1] ? mid : small)})`), "Semua nilainya sama besar"],
      `Urutkan dulu nilainya: ${shownVal(big)} > ${shownVal(mid)} > ${shownVal(small)}. Yang paling ${askMax ? "besar" : "kecil"} adalah ${correct}.`,
      "📊", four,
    );
  };
  const oddOneLogic: LGen = () => {
    if (jenjang === "TK") return emojiPictureGen(jenjang)(ri(1, 3));
    const mode = ri(0, 2);
    if (mode === 0) {
      const k = pick([3, 4, 5, 6]);
      const mults = [k * ri(2, 4), k * ri(5, 7), k * ri(8, 10)];
      const odd = mults[0] as number + pick([1, 2]);
      const all = shuffle([...mults, odd]);
      return mkNum(`Bilangan yang BERBEDA sendiri karena BUKAN kelipatan ${k} adalah … (deret: ${all.join(", ")})`, odd, mults, `${mults.join(", ")} habis dibagi ${k}; ${odd} tidak habis dibagi ${k}.`, "🔍", four);
    }
    if (mode === 1) {
      const evens = [ri(2, 8) * 2, ri(9, 14) * 2, ri(15, 20) * 2];
      const odd = pick([7, 11, 13, 17, 19, 23, 27, 29].filter((x) => !evens.includes(x)));
      const all = shuffle([...evens, odd]);
      return mkNum(`Bilangan yang BERBEDA sendiri karena satu-satunya yang GANJIL adalah … (deret: ${all.join(", ")})`, odd, evens, `Bilangan lain semuanya genap; ${odd} adalah satu-satunya bilangan ganjil.`, "🔍", four);
    }
    const primes = sample([5, 7, 11, 13, 17, 19, 23, 29], 3);
    const composite = pick([9, 15, 21, 25, 27, 33].filter((x) => !primes.includes(x)));
    const all = shuffle([...primes, composite]);
    return mkNum(`Bilangan yang BERBEDA sendiri karena BUKAN bilangan prima adalah … (deret: ${all.join(", ")})`, composite, primes, `${primes.join(", ")} adalah bilangan prima; ${composite} bisa dibagi bilangan lain selain 1 dan dirinya, jadi bukan prima.`, "🔍", four);
  };
  const englishStory: LGen = (level) => {
    // Ciri khas SEAMO style: soal cerita Bahasa Inggris sederhana — khusus jenjang atas.
    if (jenjang === "TK" || jenjang === "SD") return mathStoryGen(jenjang)(level);
    const name = pick(INTL_NAMES_EN);
    const mode = ri(0, 2);
    if (mode === 0) {
      const groups = pick([3, 4, 6, 8]);
      const per = ri(4, 12);
      const total = groups * per;
      return mkNum(`Read in English: ${total} stickers are shared equally among ${groups} students. Each student gets … stickers`, per, [per - 1, per + 1, per + 2].filter((x) => x > 0 && x !== per), `${total} : ${groups} = ${per}. (Soal cerita Inggris: 'shared equally' artinya dibagi rata.)`, "🌏", four);
    }
    if (mode === 1) {
      const a = ri(12, 30 + level * 5);
      const b = ri(5, a - 3);
      return mkNum(`Read in English: ${name} had ${a} marbles. ${name} gave ${b} marbles to a friend. How many marbles does ${name} have now?`, a - b, [a - b + 1, a - b - 1, a + b].filter((x) => x >= 0 && x !== a - b), `${a} − ${b} = ${a - b}. ('gave' = memberi, jadi jumlahnya berkurang.)`, "🌏", four);
    }
    const rows = ri(3, 6 + level);
    const perRow = ri(4, 9);
    const extra = ri(2, 10);
    const total = rows * perRow + extra;
    return mkNum(`Read in English: A hall has ${rows} rows with ${perRow} chairs in each row, plus ${extra} extra chairs. The total number of chairs is …`, total, [rows * perRow, total - perRow, total + perRow], `${rows} × ${perRow} = ${rows * perRow}; plus ${extra} extra = ${total}. (Kerjakan dua langkah: kali dulu, lalu tambah.)`, "🌏", four);
  };
  const twiceLogic: LGen = (level) => {
    if (jenjang === "TK") return mathStoryGen(jenjang)(level);
    const small = ri(4, 10 + level * 2);
    const big = small * 2;
    const third = small + ri(1, 6);
    const a = pick(NAMES);
    let b = pick(NAMES); if (b === a) b = "Rina";
    let c = pick(NAMES); if (c === a || c === b) c = "Dewi";
    const askMax = Math.random() < 0.5;
    if (askMax) {
      return mkq(
        `Nilai ${b} adalah ${small}. Nilai ${a} adalah DUA KALI nilai ${b}. Nilai ${c} adalah ${third}. Siapa yang nilainya PALING BESAR?`,
        a, [b, c, "Tidak bisa ditentukan"],
        `Nilai ${a} = 2 × ${small} = ${big}, lebih besar dari ${third} (${c}) dan ${small} (${b}). Hitung dulu nilai tersembunyinya!`,
        "🧠", four,
      );
    }
    const sum = big + small + third;
    return mkNum(`Nilai ${b} adalah ${small}. Nilai ${a} adalah dua kali nilai ${b} (${big}). Nilai ${c} adalah ${third}. Jumlah nilai ketiganya adalah …`, sum, [sum - small, sum + 2, big + third], `${small} + ${big} + ${third} = ${sum}.`, "🧠", four);
  };
  return [visualPattern, numberLogic, orderingLogic, oddOneLogic, englishStory, twiceLogic, emojiPictureGen(jenjang)];
}

/* ---------- SASMO STYLE: masalah praktis sehari-hari & trik hitung cerdas ---------- */
function sasmoGens(jenjang: JenjangId): LGen[] {
  const four = jenjang !== "TK";
  const gaussTrick: LGen = () => {
    if (jenjang === "TK") {
      const a = ri(2, 6); const b = ri(2, 6);
      return mkNum(`Hitung cepat dengan pasangan 10: ${a} + ${b} = …`, a + b, [a + b - 1, a + b + 1, 10].filter((x) => x > 0 && x !== a + b), `${a} + ${b} = ${a + b}.`, "⚡", four);
    }
    const n = pick(jenjang === "SMA" ? [50, 60, 80, 100] : jenjang === "SMP" ? [20, 30, 40, 50] : [10, 12, 20]);
    const sum = (n * (n + 1)) / 2;
    return mkNum(`Trik hitung cerdas (pasangan Gauss): 1 + 2 + 3 + … + ${n} = …`, sum, [sum - n, sum + n, (n * n) / 2].filter((x) => Number.isInteger(x) && x !== sum), `Pasangkan ujung dengan ujung: 1+${n}, 2+${n - 1}, … tiap pasang ${n + 1}, ada ${n / 2} pasang → ${n / 2} × ${n + 1} = ${fmt(sum)}. Rumus cepat: n(n+1)/2.`, "⚡", four);
  };
  const handshake: LGen = (level) => {
    if (jenjang === "TK") {
      const a = ri(2, 5);
      return mkNum(`Di kelas ada ${a} anak. Setiap anak berjabat tangan dengan guru 1 kali. Total jabat tangan dengan guru ada …`, a, [a - 1, a + 1, a * 2].filter((x) => x > 0 && x !== a), `Tiap anak 1 jabat tangan, jadi ${a} anak = ${a} jabat tangan.`, "🤝", four);
    }
    const n = ri(4, 6 + level + (jenjang === "SMA" ? 4 : 0));
    const total = (n * (n - 1)) / 2;
    return mkNum(`Sebanyak ${n} orang saling berjabat tangan. Setiap pasang berjabat tangan tepat 1 kali. Total jabat tangan ada …`, total, [total - n + 1, n * (n - 1), total + n].filter((x) => x !== total), `Setiap orang berjabat dengan ${n - 1} orang lain, tetapi tiap jabat tangan terhitung 2 kali → (${n} × ${n - 1}) : 2 = ${total}.`, "🤝", four);
  };
  const unitPrice: LGen = (level) => {
    if (jenjang === "TK") return mathStoryGen(jenjang)(level);
    const qty = pick([2, 4, 5, 10]);
    const perA = pick([1000, 1500, 2000, 2500, 3000]);
    const packPrice = qty * perA;
    const perB = perA + pick([250, 500, 750, 1000]);
    const item = pick(["pensil", "penghapus", "permen", "stiker", "buku tulis"]);
    return mkq(
      `Pak berisi ${qty} ${item} harganya Rp${fmt(packPrice)}. Di toko sebelah, 1 ${item} dijual Rp${fmt(perB)}. Harga per ${item} yang LEBIH MURAH adalah …`,
      `Pak isi ${qty} (Rp${fmt(perA)} per ${item})`,
      [`Toko sebelah (Rp${fmt(perB)} per ${item})`, "Sama saja harganya", "Tidak bisa dibandingkan"],
      `Pak: Rp${fmt(packPrice)} : ${qty} = Rp${fmt(perA)} per ${item}, lebih murah dari Rp${fmt(perB)}. Trik SASMO style: bandingkan selalu harga SATUANnya.`,
      "🏷️", four,
    );
  };
  const schedulePractical: LGen = () => {
    if (jenjang === "TK") {
      const start = ri(2, 6);
      const dur = ri(1, 3);
      return mkNum(`Sinta mulai bermain pukul ${start}.00 dan bermain selama ${dur} jam. Sinta selesai bermain pukul …`, start + dur, [start + dur - 1, start + dur + 1, start].filter((x) => x !== start + dur), `${start}.00 + ${dur} jam = pukul ${start + dur}.00.`, "🕐", four);
    }
    const startH = ri(7, 9);
    const act = pick([25, 30, 35, 40, 45]);
    const breakM = pick([5, 10, 15]);
    const act2 = pick([25, 30, 35, 40]);
    const totalMin = act + breakM + act2;
    const endH = startH + Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    const endStr = `${String(endH).padStart(2, "0")}.${String(endM).padStart(2, "0")}`;
    const wrong1 = `${String(startH + Math.floor((totalMin - 10) / 60)).padStart(2, "0")}.${String((totalMin - 10) % 60).padStart(2, "0")}`;
    const wrong2 = `${String(endH + 1).padStart(2, "0")}.${String(endM).padStart(2, "0")}`;
    return mkq(
      `Kegiatan mulai pukul ${String(startH).padStart(2, "0")}.00. Sesi pertama ${act} menit, istirahat ${breakM} menit, sesi kedua ${act2} menit. Kegiatan selesai pukul …`,
      endStr, [wrong1, wrong2, `${String(startH).padStart(2, "0")}.${String(act % 60).padStart(2, "0")}`].filter((x) => x !== endStr),
      `Total waktu = ${act} + ${breakM} + ${act2} = ${totalMin} menit = ${Math.floor(totalMin / 60)} jam ${totalMin % 60} menit. ${String(startH).padStart(2, "0")}.00 + ${totalMin} menit = ${endStr}.`,
      "🕐", four,
    );
  };
  const cleverMultiply: LGen = () => {
    if (jenjang === "TK" || jenjang === "SD") {
      const a = pick([2, 4, 5, 10]);
      const b = ri(3, 9);
      return mkNum(`Hitung cerdas: ${a} × ${b} = …`, a * b, [a * b - a, a * b + a, a * b + b].filter((x) => x !== a * b), `${a} × ${b} = ${a * b}. Untuk ×5, hitung ×10 lalu bagi 2; untuk ×4, kalikan 2 dua kali.`, "⚡", four);
    }
    const mode = ri(0, 1);
    if (mode === 0) {
      const b = ri(12, 49);
      const ans = 999 * b;
      return mkNum(`Hitung cerdas: 999 × ${b} = … (Trik: 999 = 1.000 − 1)`, ans, [b * 1000, ans - b, ans + 999], `999 × ${b} = ${fmt(b * 1000)} − ${fmt(b)} = ${fmt(ans)}.`, "⚡", four);
    }
    const b = pick([16, 24, 32, 48, 56, 64]);
    const ans = 25 * b;
    return mkNum(`Hitung cerdas: 25 × ${b} = … (Trik: 25 × 4 = 100)`, ans, [ans - 25, ans + 100, b * 20], `25 × ${b} = 25 × 4 × ${b / 4} = 100 × ${b / 4} = ${fmt(ans)}.`, "⚡", four);
  };
  const groupingPractical: LGen = (level) => {
    const per = pick([4, 5, 6, 8, 10]);
    const full = ri(3, 5 + level);
    const rem = ri(1, per - 1);
    const total = per * full + rem;
    if (jenjang === "TK") {
      const smallTotal = ri(4, 9);
      const each = 2;
      const p = Math.floor(smallTotal / each);
      const r = smallTotal % each;
      if (r === 0) return mkNum(`${smallTotal} biskuit dibagi rata ke 2 anak. Tiap anak mendapat … biskuit`, p, [p - 1, p + 1, smallTotal].filter((x) => x > 0 && x !== p), `${smallTotal} : 2 = ${p}.`, "🍪", four);
      return mkq(`${smallTotal} biskuit dibagi rata ke 2 anak. Tiap anak mendapat … dan sisanya …`, `${p} biskuit, sisa ${r}`, [`${p} biskuit, sisa 0`, `${p + 1} biskuit, sisa ${r}`], `2 × ${p} = ${smallTotal - r}; sisa ${r}.`, "🍪", four);
    }
    return mkq(
      `Sebanyak ${total} siswa akan dibagi menjadi kelompok berisi ${per} anak. Kelompok penuh yang terbentuk ada … dan sisanya … anak`,
      `${full} kelompok, sisa ${rem}`,
      [`${full} kelompok, sisa ${rem + 1}`, `${full + 1} kelompok, sisa ${rem}`, `${full - 1} kelompok, sisa ${rem + per}`],
      `${total} : ${per} = ${full} sisa ${rem}, karena ${per} × ${full} = ${total - rem}. Sisa tidak boleh mencapai ${per} — kalau mencapai, bisa jadi satu kelompok lagi!`,
      "👥", four,
    );
  };
  const installment: LGen = (level) => {
    if (jenjang !== "SMA" && jenjang !== "SMP") return mathStoryGen(jenjang)(level);
    const months = pick([4, 6, 8, 10, 12]);
    const perMonth = pick([100, 150, 200, 250, 300]) * 1000;
    const down = pick([200, 300, 400, 500]) * 1000;
    const price = down + months * perMonth;
    return mkNum(`Sebuah barang seharga Rp${fmt(price)} dibeli dengan uang muka Rp${fmt(down)}, sisanya dicicil ${months} kali sama besar tanpa bunga. Cicilan per bulannya adalah …`, perMonth, [perMonth + 50000, Math.round(price / months), perMonth - 50000].filter((x) => x > 0 && x !== perMonth), `Sisa yang dicicil = ${fmt(price)} − ${fmt(down)} = Rp${fmt(price - down)}. Cicilan = ${fmt(price - down)} : ${months} = Rp${fmt(perMonth)}.`, "💳", four);
  };
  return [gaussTrick, handshake, unitPrice, schedulePractical, cleverMultiply, groupingPractical, installment, mathStoryGen(jenjang)];
}

/* ---------- AMO STYLE: soal cerita konteks Amerika (satuan & situasi khas), penalaran bertahap ---------- */
const US_PLACES = ["New York", "Texas", "California", "Chicago", "Florida", "Ohio"] as const;
function amoGens(jenjang: JenjangId): LGen[] {
  const four = jenjang !== "TK";
  const dozenGen: LGen = (level) => {
    const dozens = jenjang === "TK" ? ri(1, 2) : ri(2, 4 + level);
    const total = dozens * 12;
    const item = pick(["telur", "donat", "mawar", "pensil"]);
    if (jenjang === "TK") {
      return mkNum(`Satu lusin (dozen) berisi 12 benda. ${dozens} lusin ${item} berisi … benda`, total, [total - 2, total + 2, dozens * 10].filter((x) => x > 0 && x !== total), `${dozens} × 12 = ${total}. Di Amerika, benda sering dijual per dozen (lusin).`, "🥚", four);
    }
    return mkNum(`Seorang peternak di ${pick(US_PLACES)} mengumpulkan ${dozens} dozen (lusin) ${item}. (1 dozen = 12) Jumlah seluruhnya adalah …`, total, [total - 12, total + 12, dozens * 10], `${dozens} × 12 = ${total}. 'Dozen' adalah kata Inggris untuk lusin.`, "🥚", four);
  };
  const feetInches: LGen = (level) => {
    if (jenjang === "TK") {
      const feet = ri(1, 3);
      return mkNum(`Satu foot (kaki) sama dengan 12 inches. ${feet} feet sama dengan … inches`, feet * 12, [feet * 10, feet * 12 + 2, feet + 12].filter((x) => x !== feet * 12), `${feet} × 12 = ${feet * 12} inches. Foot dan inch adalah satuan panjang Amerika.`, "📏", four);
    }
    const mode = ri(0, 1);
    if (mode === 0) {
      const feet = ri(3, 8 + level);
      return mkNum(`Tinggi sebuah papan adalah ${feet} feet. (1 foot = 12 inches) Tinggi papan itu sama dengan … inches`, feet * 12, [feet * 10, feet * 12 - 6, feet * 12 + 12], `${feet} × 12 = ${feet * 12} inches.`, "📏", four);
    }
    const yards = ri(2, 6 + level);
    return mkNum(`Panjang sebuah taman adalah ${yards} yards. (1 yard = 3 feet) Panjang taman itu sama dengan … feet`, yards * 3, [yards * 2, yards + 3, yards * 12], `${yards} × 3 = ${yards * 3} feet. Urutan satuan Amerika: inch → foot → yard → mile.`, "📏", four);
  };
  const moneySteps: LGen = (level) => {
    const name = pick(INTL_NAMES_EN);
    if (jenjang === "TK") {
      const have = ri(4, 9);
      const spent = ri(1, have - 1);
      return mkNum(`${name} punya ${have} koin dolar. Ia membeli permen seharga ${spent} koin dolar. Sisa koin ${name} ada …`, have - spent, [have - spent + 1, have - spent - 1, have].filter((x) => x >= 0 && x !== have - spent), `${have} − ${spent} = ${have - spent} koin. Dolar adalah mata uang Amerika.`, "🪙", four);
    }
    const price = pick([325, 450, 575, 625, 750, 825]) / 100;
    const pay = 10;
    const change = Math.round((pay - price) * 100) / 100;
    const fmtUs = (v: number) => `$${v.toFixed(2).replace(".", ",")}`;
    if (Math.random() < 0.5 && jenjang !== "SD") {
      const hours = ri(3, 6 + level);
      const wage = ri(7, 12);
      const buy = ri(10, hours * wage - 5);
      const left = hours * wage - buy;
      return mkNum(`${name} bekerja ${hours} jam dengan upah $${wage} per jam di sebuah toko di ${pick(US_PLACES)}. Ia lalu membeli tas seharga $${buy}. Sisa uang ${name} adalah …`, left, [left + wage, hours * wage, left - 5].filter((x) => x >= 0 && x !== left), `Langkah 1: upah = ${hours} × $${wage} = $${hours * wage}. Langkah 2: sisa = ${hours * wage} − ${buy} = $${left}. Soal AMO style dikerjakan bertahap!`, "💵", four);
    }
    return mkq(
      `${name} membayar dengan uang $10 untuk barang seharga ${fmtUs(price)}. Kembalian ${name} adalah …`,
      fmtUs(change),
      [fmtUs(Math.round((change + 1) * 100) / 100), fmtUs(Math.round((change - 0.5) * 100) / 100), fmtUs(price)],
      `$10,00 − ${fmtUs(price)} = ${fmtUs(change)}. 1 dolar = 100 cents, jadi hitung sampai dua angka di belakang koma.`,
      "💵", four,
    );
  };
  const milesGen: LGen = (level) => {
    if (jenjang === "TK") return mathStoryGen(jenjang)(level);
    if (jenjang === "SD") {
      const morning = ri(5, 15);
      const afternoon = ri(4, 12);
      const days = pick([2, 3]);
      const total = (morning + afternoon) * days;
      return mkNum(`Bus sekolah menempuh ${morning} mil pada pagi hari dan ${afternoon} mil pada sore hari. Pola ini berulang selama ${days} hari. Total jaraknya adalah … mil`, total, [morning + afternoon, total - morning, total + afternoon], `Per hari ${morning} + ${afternoon} = ${morning + afternoon} mil. Selama ${days} hari: ${morning + afternoon} × ${days} = ${total} mil.`, "🚌", four);
    }
    const miles = pick([20, 25, 40, 50, 60, 75]);
    const km = Math.round(miles * 1.6);
    return mkNum(`Jarak sebuah kota adalah ${miles} mil dari kota lain. (1 mil ≈ 1,6 km) Jarak itu kira-kira sama dengan … km`, km, [km - 10, km + 10, miles].filter((x) => x !== km), `${miles} × 1,6 = ${km} km. Mil (mile) adalah satuan jarak utama di Amerika.`, "🛣️", four);
  };
  const fahrenheitGen: LGen = () => {
    if (jenjang === "TK" || jenjang === "SD") {
      return mkq(
        `Di Amerika, suhu diukur dengan Fahrenheit (°F). Air membeku pada 32°F. Dalam Celsius (°C), air membeku pada …`,
        "0°C", ["10°C", "32°C", "100°C"],
        `Air membeku pada 0°C = 32°F, dan mendidih pada 100°C = 212°F. Dua skala suhu yang berbeda untuk hal yang sama!`,
        "🌡️", four,
      );
    }
    const c = pick([10, 15, 20, 25, 30, 35, 40]);
    const f = (c * 9) / 5 + 32;
    return mkNum(`Suhu di ${pick(US_PLACES)} adalah ${f}°F. Suhu itu dalam Celsius adalah … (Rumus: C = (F − 32) × 5/9)`, c, [c - 5, c + 5, f - 32].filter((x) => x !== c), `(${f} − 32) × 5/9 = ${f - 32} × 5/9 = ${c}°C.`, "🌡️", four);
  };
  const roadTrip: LGen = (level) => {
    if (jenjang === "TK") return mathStoryGen(jenjang)(level);
    const hours = ri(2, 5);
    const speed = pick([40, 50, 60]);
    const days = ri(2, 3 + Math.min(2, level - 1));
    const total = hours * speed * days;
    return mkNum(`Road trip: sebuah keluarga berkendara ${hours} jam per hari dengan kecepatan rata-rata ${speed} mil/jam, selama ${days} hari. Total jarak perjalanan mereka adalah … mil`, total, [hours * speed, total - speed, total + hours * speed], `Langkah 1: per hari ${hours} × ${speed} = ${hours * speed} mil. Langkah 2: selama ${days} hari = ${hours * speed} × ${days} = ${fmt(total)} mil.`, "🚗", four);
  };
  const gallonGen: LGen = (level) => {
    if (jenjang === "TK" || jenjang === "SD") return dozenGen(level);
    const gallons = ri(2, 8 + level);
    const quarts = gallons * 4;
    return mkNum(`Sebuah tangki berisi ${gallons} gallons air. (1 gallon = 4 quarts) Isi tangki itu sama dengan … quarts`, quarts, [quarts - 4, quarts + 4, gallons * 2], `${gallons} × 4 = ${quarts} quarts. Gallon dan quart adalah satuan isi Amerika.`, "🛢️", four);
  };
  return [dozenGen, feetInches, moneySteps, milesGen, fahrenheitGen, roadTrip, gallonGen];
}

/* ---------- JSO STYLE: sains eksperimen sederhana, pengamatan & penalaran ilmiah ---------- */
function jsoGens(jenjang: JenjangId): LGen[] {
  const four = jenjang !== "TK";
  const floatSink: LGen = () => {
    const floaters = ["Gabus", "Daun kering", "Bola plastik berongga", "Potongan kayu ringan", "Spons kering"];
    const sinkers = ["Batu kecil", "Koin logam", "Sendok besi", "Kunci besi", "Paku"];
    const askFloat = Math.random() < 0.5;
    if (askFloat) {
      const correct = pick(floaters);
      const ds = sample(sinkers, four ? 3 : 2);
      return mkq(`Percobaan mengapung–tenggelam: benda yang MENGAPUNG di air adalah …`, correct, ds, `${correct} mengapung karena ringan dan/atau berongga berisi udara. Benda logam dan batu yang padat akan tenggelam. Ilmuwan cilik: tebak dulu, lalu buktikan!`, "🌊", four);
    }
    const correct = pick(sinkers);
    const ds = sample(floaters, four ? 3 : 2);
    return mkq(`Percobaan mengapung–tenggelam: benda yang TENGGELAM di air adalah …`, correct, ds, `${correct} tenggelam karena padat dan berat untuk ukurannya. Gabus, daun, dan bola berongga mengapung.`, "🌊", four);
  };
  const plantNeeds: LGen = () => {
    if (jenjang === "TK") {
      return mkq(`Agar tanaman tumbuh sehat, tanaman membutuhkan …`, "Air dan cahaya matahari", ["Mainan dan boneka", "Batu dan pasir saja"], `Tanaman memasak makanannya dengan cahaya matahari dan menyerap air lewat akar. Tanpa keduanya tanaman layu.`, "🌱", four);
    }
    const correct = pick(["Air yang cukup", "Cahaya matahari", "Udara (karbon dioksida)"]);
    const ds = ["Musik yang keras", "Cahaya lampu warna-warni setiap jam", "Disimpan di lemari gelap", "Diberi minuman bersoda"].filter((x) => x !== correct);
    return mkq(`Salah satu kebutuhan utama tanaman untuk tumbuh sehat adalah …`, correct, sample(ds, four ? 3 : 2), `Tanaman butuh air, cahaya matahari, dan udara untuk fotosintesis dan tumbuh. Pilihan lain tidak membantu pertumbuhan.`, "🌱", four);
  };
  const variableGen: LGen = (level) => {
    if (jenjang === "TK") return plantNeeds(level);
    const topics: readonly (readonly [string, string])[] = [
      ["pemberian air", "disiram setiap hari vs tidak disiram"],
      ["pupuk", "diberi pupuk vs tidak diberi pupuk"],
      ["cahaya", "ditaruh di tempat terang vs tempat teduh"],
      ["jenis tanah", "ditanam di tanah humus vs tanah berpasir"],
    ];
    const t = pick(topics);
    return mkq(
      `Dua tanaman sejenis ditanam pada pot dan tempat yang sama. Satu-satunya perbedaan: tanaman pertama ${t[1].split(" vs ")[0]}, tanaman kedua ${t[1].split(" vs ")[1]}. Dalam percobaan ini, hal yang SENGAJA DIBEDAKAN (variabel bebas) adalah …`,
      `Perlakuan ${t[0]}`,
      ["Jenis tanaman", "Ukuran pot", "Tempat meletakkan tanaman"],
      `Percobaan yang adil hanya membedakan SATU hal — di sini ${t[0]}. Jenis tanaman, pot, dan tempat dibuat sama agar perbandingan adil (fair test).`,
      "🧪", four,
    );
  };
  const dataTable: LGen = () => {
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const base = jenjang === "TK" ? ri(3, 6) : ri(24, 30);
    // Nilai dibuat BERBEDA semua agar hari terpanas selalu tunggal.
    const offsets = shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, days.length);
    const temps = days.map((_, i) => base + (offsets[i] as number));
    const maxTemp = Math.max(...temps);
    const maxDay = days[temps.indexOf(maxTemp)] as string;
    if (jenjang === "TK") {
      const flowers = [ri(2, 5), ri(2, 5), ri(6, 9)];
      const dayNames = ["Senin", "Selasa", "Rabu"];
      const maxF = Math.max(...flowers);
      const maxD = dayNames[flowers.indexOf(maxF)] as string;
      return mkq(
        `Pengamatan bunga yang mekar: Senin ${flowers[0]} bunga, Selasa ${flowers[1]} bunga, Rabu ${flowers[2]} bunga. Hari dengan bunga mekar PALING BANYAK adalah …`,
        maxD, dayNames.filter((d) => d !== maxD),
        `Bandingkan angkanya: ${flowers.join(", ")}. Yang terbesar ${maxF} pada hari ${maxD}. Ilmuwan selalu membaca data dengan teliti.`,
        "🌸", four,
      );
    }
    if (Math.random() < 0.5) {
      const table = days.map((d, i) => `${d} ${temps[i]}°C`).join(", ");
      return mkq(
        `Hasil pengamatan suhu selama 5 hari: ${table}. Hari TERPANAS adalah …`,
        `${maxDay} (${maxTemp}°C)`,
        days.filter((d) => d !== maxDay).slice(0, four ? 3 : 2).map((d) => `${d} (${temps[days.indexOf(d)]}°C)`),
        `Suhu tertinggi adalah ${maxTemp}°C pada hari ${maxDay}. Baca semua data dulu, baru simpulkan.`,
        "🌡️", four,
      );
    }
    const i1 = ri(0, 3);
    const i2 = i1 + 1;
    const diff = (temps[i2] as number) - (temps[i1] as number);
    const table = days.map((d, i) => `${d} ${temps[i]}°C`).join(", ");
    return mkNum(`Data suhu: ${table}. Selisih suhu hari ${days[i2]} dan hari ${days[i1]} adalah … °C`, Math.abs(diff), [Math.abs(diff) + 1, Math.abs(diff) + 2, Math.abs(diff) === 0 ? 1 : Math.abs(diff) - 1].filter((x) => x >= 0 && x !== Math.abs(diff)), `${temps[i2]} − ${temps[i1]} = ${diff}; selisih (selalu positif) = ${Math.abs(diff)}°C.`, "🌡️", four);
  };
  const growthMeasure: LGen = () => {
    const h1 = ri(2, 6);
    const h2 = h1 + ri(2, 6);
    const h3 = h2 + ri(2, 7);
    if (jenjang === "TK") {
      return mkNum(`Kecambah kemarin tingginya ${h1} cm. Hari ini tingginya ${h2} cm. Kecambah bertambah tinggi … cm`, h2 - h1, [h2 - h1 + 1, h2, h1].filter((x) => x > 0 && x !== h2 - h1), `${h2} − ${h1} = ${h2 - h1} cm. Pertumbuhan diukur dari selisih dua pengukuran.`, "🌱", four);
    }
    const askLast = Math.random() < 0.5;
    const diff = askLast ? h3 - h2 : h2 - h1;
    const from = askLast ? "kedua ke hari ketiga" : "pertama ke hari kedua";
    return mkNum(`Pengamatan kecambah: hari ke-1 tinggi ${h1} cm, hari ke-2 tinggi ${h2} cm, hari ke-3 tinggi ${h3} cm. Pertumbuhan dari hari ${from} adalah … cm`, diff, [diff + 1, diff + 2, h3].filter((x) => x > 0 && x !== diff), `Selisih tinggi dua hari berurutan: ${askLast ? `${h3} − ${h2}` : `${h2} − ${h1}`} = ${diff} cm.`, "🌱", four);
  };
  const magnetShadow: LGen = () => {
    if (Math.random() < 0.5) {
      return mkq(`Magnet akan menarik benda yang terbuat dari …`, "Besi", ["Kayu", "Plastik", "Karet"].slice(0, four ? 3 : 2), `Magnet menarik logam besi dan baja. Kayu, plastik, dan karet tidak tertarik magnet — buktikan dengan percobaan sederhana!`, "🧲", four);
    }
    return mkq(`Bayangan benda terlihat paling PANJANG pada …`, "Pagi hari", ["Tengah hari tepat", "Dalam ruangan gelap total", "Saat lampu dimatikan"].slice(0, four ? 3 : 2), `Pagi (dan sore) matahari masih rendah sehingga bayangan memanjang. Tengah hari matahari di atas kepala, bayangan paling pendek.`, "🔦", four);
  };
  const fairConclusion: LGen = () => {
    if (jenjang === "TK" || jenjang === "SD") {
      return mkq(`Es di tempat hangat mencair lebih cepat daripada es di kulkas. Kesimpulan yang tepat adalah …`, "Tempat hangat membuat es lebih cepat mencair", ["Es di kulkas lebih besar", "Semua es mencair dalam waktu yang sama", "Es tidak bisa mencair di kulkas"].slice(0, four ? 3 : 2), `Satu-satunya perbedaan adalah suhu tempatnya, jadi suhu itulah penyebabnya. Kesimpulan ilmiah berdasarkan bukti percobaan.`, "🧊", four);
    }
    const mode = ri(0, 1);
    if (mode === 0) {
      return mkq(
        `Dalam percobaan pengaruh cahaya, tanaman di tempat terang tumbuh 9 cm, sedangkan tanaman sejenis di tempat gelap tumbuh 3 cm, dengan air dan tanah yang sama. Kesimpulan paling tepat adalah …`,
        "Cahaya membantu tanaman tumbuh lebih cepat pada percobaan ini",
        ["Tanaman di tempat gelap pasti mati", "Air tidak berpengaruh sama sekali", "Semua tanaman selalu tumbuh 9 cm"],
        `Karena hanya cahaya yang berbeda (air & tanah sama), perbedaan pertumbuhan disebabkan cahaya. Kesimpulan tidak boleh melebihi data: 'pada percobaan ini'.`,
        "🔬", four,
      );
    }
    return mkq(
      `Pernyataan yang merupakan HIPOTESIS ilmiah (dapat diuji dengan percobaan) adalah …`,
      "Tanaman yang menerima cahaya lebih banyak akan tumbuh lebih cepat",
      ["Tanaman hijau adalah tanaman tercantik", "Tanaman sebaiknya selalu ditanam hari Senin", "Semua tanaman pasti menyukai musik"],
      `Hipotesis harus bisa DIUJI dan DIUKUR: cahaya dan kecepatan tumbuh keduanya dapat diamati dalam percobaan. Pilihan lain adalah pendapat atau tidak terukur.`,
      "🔬", four,
    );
  };
  const controlGroup: LGen = (level) => {
    if (jenjang !== "SMA" && jenjang !== "SMP") return dataTable(level);
    return mkq(
      `Dalam percobaan obat pertumbuhan tanaman, kelompok KONTROL adalah kelompok yang …`,
      "Tidak diberi perlakuan, sebagai pembanding",
      ["Diberi perlakuan paling banyak", "Tumbuh paling cepat", "Ditanam paling akhir"],
      `Kelompok kontrol tidak menerima perlakuan yang diuji. Tanpa pembanding, kita tidak tahu apakah perubahan disebabkan perlakuan atau hal lain.`,
      "🧪", four,
    );
  };
  const matterChange: LGen = () => {
    if (jenjang === "TK") {
      return mkq(`Es batu yang dibiarkan di meja lama-lama akan …`, "Mencair menjadi air", ["Menjadi lebih besar", "Menghilang tanpa sisa"].slice(0, four ? 3 : 2), `Es mencair karena suhu ruangan lebih hangat. Wujudnya berubah dari padat menjadi cair — percobaan mudah diamati di rumah!`, "🧊", four);
    }
    const physical = pick(["Es mencair menjadi air", "Kertas disobek menjadi dua", "Gula larut dalam air", "Air menguap menjadi uap"]);
    const chemical = ["Kayu terbakar menjadi abu", "Besi berkarat", "Susu menjadi asam", "Telur digoreng hingga matang"];
    return mkq(`Peristiwa yang merupakan perubahan FISIKA (tidak membentuk zat baru) adalah …`, physical, sample(chemical, four ? 3 : 2), `${physical} — hanya wujud/bentuknya yang berubah, zatnya tetap sama. Terbakar, berkarat, dan membusuk membentuk zat baru (perubahan kimia).`, "⚗️", four);
  };
  return [floatSink, plantNeeds, variableGen, dataTable, growthMeasure, magnetShadow, fairConclusion, controlGroup, matterChange, emojiPictureGen(jenjang)];
}

export const GENERATORS: Partial<Record<JenjangId, Record<string, LGen[]>>> = {
  TK: {
    inggris: [pairGenL({ pairs: TK_ENG_PAIRS, askA: (a) => `What is “${a}” in Indonesian? / “${a}” artinya …`, askB: (b) => `Bahasa Inggris dari “${b}” adalah …`, exA: (a, b) => `“${a}” artinya ${b}.`, exB: (a, b) => `“${a}” dalam Bahasa Inggris adalah ${b}.`, four: false }), tkEngArrange, tkCompare],
    matematika: [tkCount, tkAddSub, tkCompare, tkMissing, tkBeforeAfter, tkStoryCount, factGenL(TK_SHAPE_FACTS, false), mathStoryGen("TK"), emojiPictureGen("TK")],
    nalaria: nalariaGens("TK"),
    "kanguru-matematika": kanguruMathGens("TK"),
    "kanguru-bahasa": kanguruBahasaGens("TK"),
    seamo: seamoGens("TK"),
    sasmo: sasmoGens("TK"),
    amo: amoGens("TK"),
    jso: jsoGens("TK"),
    sains: [pairGenL({ pairs: TK_SAINS_PAIRS, askA: (a) => `${a} hidup terutama di …`, askB: (b) => `Hewan yang hidup di ${b.toLowerCase()} adalah …`, exA: (a, b) => `${a} hidup di ${b.toLowerCase()}.`, exB: (a, b) => `Yang hidup di ${b.toLowerCase()} adalah ${a}.`, four: false }), factGenL(TK_SAINS_FACTS, false), emojiPictureGen("TK")],
    pai: [factGenL(TK_PAI_FACTS, false),
      pairGenL({ pairs: MALAIKAT, askA: (a) => `Tugas Malaikat ${a} adalah …`, askB: (b) => `Malaikat yang bertugas “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu tugas Malaikat ${a}.`, four: false }),
      pairGenL({ pairs: KITAB_NABI, askA: (a) => `Kitab ${a} diturunkan kepada …`, askB: (b) => `Kitab yang diturunkan kepada ${b} adalah …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} menerima kitab ${a}.`, four: false })],
    kristen: [factGenL(TK_KRISTEN_FACTS, false),
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.`, four: false }),
      pairGenL({ pairs: PERAYAAN_KRISTEN, askA: (a) => `Perayaan ${a} memperingati …`, askB: (b) => `Peringatan “${b}” disebut …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu perayaan ${a}.`, four: false })],
    korea: langVocabGensL(KOREA_VOCAB, "Korea", "TK"),
    jepang: [...langVocabGensL(JEPANG_VOCAB, "Jepang", "TK"), pairGenL({ pairs: JEPANG_KANA.slice(0, 15), askA: (a) => `Hiragana untuk bunyi “${a}” adalah …`, askB: (b) => `Hiragana “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b}.`, exB: (a, b) => `${b} dibaca “${a}”.`, four: false })],
    mandarin: langVocabGensL(MANDARIN_VOCAB, "Mandarin", "TK"),
    informatika: tikGens("TK"),
    sejarah: sejarahGens("TK"),
  },
  SD: {
    // Gerbang pita kelas (bandGate): topik khas kelas menengah/atas
    // tidak muncul di kelas rendah — perkalian/pembagian mulai Kelas 2,
    // operasi campuran & pecahan & bangun mulai Kelas 3, pembulatan &
    // FPB/KPK & Romawi mulai Kelas 4, rata-rata & persen mulai Kelas 5.
    matematika: [sdAddSub, bandGate(0.15, sdMulDiv), bandGate(0.35, sdMixed), bandGate(0.35, sdFraction), bandGate(0.5, sdFpbKpk), bandGate(0.35, sdGeometry), bandGate(0.75, sdAverage), sdSequence, bandGate(0.15, sdWordProblem), bandGate(0.5, sdRound), bandGate(0.75, sdPercent), bandGate(0.15, sdClock), bandGate(0.15, sdUnit), bandGate(0.35, sdFracCompare), sdGradeMath, sdGradeMath, bandGate(0.15, mathStoryGen("SD")), emojiPictureGen("SD"),
      bandGate(0.5, pairGenL({ pairs: ROMAN_PAIRS, askA: (a) => `Bilangan Romawi dari ${a} adalah …`, askB: (b) => `Angka Romawi “${b}” bernilai …`, exA: (a, b) => `${a} dalam angka Romawi adalah ${b}.`, exB: (a, b) => `${b} bernilai ${a}.` }))],
    nalaria: nalariaGens("SD"),
    "kanguru-matematika": kanguruMathGens("SD"),
    "kanguru-bahasa": kanguruBahasaGens("SD"),
    seamo: seamoGens("SD"),
    sasmo: sasmoGens("SD"),
    amo: amoGens("SD"),
    jso: jsoGens("SD"),
    inggris: [
      pairGenL({ pairs: EN_VOCAB, askA: (a) => `“${a}” artinya …`, askB: (b) => `Bahasa Inggris dari “${b}” adalah …`, exA: (a, b) => `“${a}” artinya ${b}.`, exB: (a, b) => `“${a}” dalam Bahasa Inggris: ${b}.` }),
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `Kata yang berlawanan arti dengan “${b}” adalah …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Lawan kata ${b} adalah ${a}.` }),
      pairGenL({ pairs: EN_PLURALS, askA: (a) => `The plural of “${a}” is …`, askB: (b) => `Bentuk tunggal dari “${b}” adalah …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} adalah jamak dari ${a}.` }),
      sdEngPast,
    ],
    sains: [
      pairGenL({ pairs: SD_SAINS_PAIRS, askA: (a) => `Fungsi ${a.toLowerCase()} adalah …`, askB: (b) => `Bagian/organ yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, b) => `Yang berfungsi ${b.toLowerCase()} adalah ${a}.` }),
      factGenL(SD_SAINS_FACTS), planetGen, emojiPictureGen("SD"),
      classifyGen(SD_SAINS_CLASSIFY.map((x) => ({ item: x.item, cat: x.cat })), (i) => `Hewan ${i} mengalami …`, (i, c) => `${i} termasuk ${c.toLowerCase()}.`),
    ],
    indonesia: [
      pairGenL({ pairs: ANTONIM_ID, askA: (a) => `Antonim (lawan kata) dari “${a}” adalah …`, askB: (b) => `Kata yang berlawanan arti dengan “${b}” adalah …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Lawan kata ${b} adalah ${a}.` }),
      pairGenL({ pairs: SINONIM_ID, askA: (a) => `Sinonim (persamaan kata) dari “${a}” adalah …`, askB: (b) => `Kata yang semakna dengan “${b}” adalah …`, exA: (a, b) => `${a} ≈ ${b}.`, exB: (a, b) => `${b} semakna dengan ${a}.` }),
      pairGenL({ pairs: PERIBAHASA, askA: (a) => `Peribahasa “${a}” artinya …`, askB: (b) => `Peribahasa yang berarti “${b}” adalah …`, exA: (_a, b) => `Artinya: ${b}.`, exB: (a, _b) => `Peribahasanya: “${a}”.` }),
      emojiPictureGen("SD"),
    ],
    ips: [
      pairGenL({ pairs: PROVINSI_IBUKOTA, askA: (a) => `Ibu kota Provinsi ${a} adalah …`, askB: (b) => `${b} adalah ibu kota Provinsi …`, exA: (a, b) => `Ibu kota ${a} adalah ${b}.`, exB: (a, b) => `${b} ibu kota Provinsi ${a}.` }),
      pairGenL({ pairs: PAHLAWAN, askA: (a) => `${a} adalah pahlawan yang berasal/berjuang di daerah …`, askB: (b) => `Pahlawan dari daerah ${b} adalah …`, exA: (a, b) => `${a} berasal dari ${b}.`, exB: (a, b) => `Dari ${b}: ${a}.` }),
    ],
    ppkn: [
      pairGenL({ pairs: SILA, askA: (a) => `${a} Pancasila berbunyi …`, askB: (b) => `“${b}” adalah bunyi …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: SILA_LAMBANG, askA: (a) => `Lambang ${a.toLowerCase()} Pancasila adalah …`, askB: (b) => `Lambang “${b}” adalah milik …`, exA: (a, b) => `${a} berlambang ${b}.`, exB: (a, b) => `${b} adalah lambang ${a}.` }),
    ],
    informatika: tikGens("SD"),
    sejarah: sejarahGens("SD"),
    jawa: jawaGens("SD"),
    arab: arabGens("SD"),
    pai: [
      pairGenL({ pairs: MALAIKAT, askA: (a) => `Tugas Malaikat ${a} adalah …`, askB: (b) => `Malaikat yang bertugas “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b.toLowerCase()}.`, exB: (a, _b) => `Itu tugas Malaikat ${a}.` }),
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
      pairGenL({ pairs: SURAH_ARTI, askA: (a) => `Surah ${a} artinya / dikenal sebagai …`, askB: (b) => `“${b}” adalah arti/gelar dari surah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah surah ${a}.` })],
    kristen: [
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: PERAYAAN_KRISTEN, askA: (a) => `Perayaan ${a} memperingati …`, askB: (b) => `Peringatan “${b}” disebut …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah perayaan ${a}.` }),
    ],
    "cambridge-eng": [
      pairGenL({ pairs: EN_VOCAB, askA: (a) => `What does “${a}” mean in Indonesian?`, askB: (b) => `The English word for “${b}” is …`, exA: (a, b) => `“${a}” means ${b}.`, exB: (a, b) => `“${b}” in English is ${a}.` }),
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The antonym of “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `The opposite of ${b} is ${a}.` }),
      pairGenL({ pairs: EN_PAST, askA: (a) => `The past tense of “${a}” is …`, askB: (b) => `The base form (V1) of “${b}” is …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} comes from ${a}.` }),
    ],
    "cambridge-sci": [
      pairGenL({ pairs: CAM_SCI_PAIRS, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a}.` }),
      factGenL(SD_SAINS_FACTS),
    ],
    "cambridge-math": [camMath],
    korea: langVocabGensL(KOREA_VOCAB, "Korea", "SD", KOREA_FACTS),
    jepang: [...langVocabGensL(JEPANG_VOCAB, "Jepang", "SD", JEPANG_FACTS), pairGenL({ pairs: JEPANG_KANA, askA: (a) => `Hiragana untuk bunyi “${a}” adalah …`, askB: (b) => `Hiragana “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b}.`, exB: (a, b) => `${b} dibaca “${a}”.` })],
    mandarin: langVocabGensL(MANDARIN_VOCAB, "Mandarin", "SD", MANDARIN_FACTS),
  },
  SMP: {
    matematika: [smpNegOps, smpEquation, smpSequence, smpGradient, smpProbability, smpScale, smpPhysics, smpDiscount, smpProfit, smpPythag, smpCircle, smpVolume, smpAngles, smpTwoVar, mathStoryGen("SMP")],
    nalaria: nalariaGens("SMP"),
    "kanguru-matematika": kanguruMathGens("SMP"),
    "kanguru-bahasa": kanguruBahasaGens("SMP"),
    seamo: seamoGens("SMP"),
    sasmo: sasmoGens("SMP"),
    amo: amoGens("SMP"),
    jso: jsoGens("SMP"),
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
      pairGenL({ pairs: ORGANEL, askA: (a) => `Fungsi organel ${a.toLowerCase()} adalah …`, askB: (b) => `Organel yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` })],
    indonesia: [factGenL(indoFactsSMP),
      pairGenL({ pairs: KATA_BAKU, askA: (a) => `Bentuk baku dari kata “${a}” adalah …`, askB: (b) => `Kata tidak baku dari “${b}” adalah …`, exA: (a, b) => `Baku: ${b} (bukan ${a}).`, exB: (a, b) => `${a} adalah bentuk tidak baku dari ${b}.` }),
      pairGenL({ pairs: PERIBAHASA, askA: (a) => `Peribahasa “${a}” artinya …`, askB: (b) => `Peribahasa yang berarti “${b}” adalah …`, exA: (_a, b) => `Artinya: ${b}.`, exB: (a, _b) => `Peribahasanya: “${a}”.` })],
    ips: [
      pairGenL({ pairs: EVENT_YEAR, askA: (a) => `${a} terjadi pada …`, askB: (b) => `Peristiwa yang terjadi pada ${b} adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `Pada ${b}: ${a}.` }),
      pairGenL({ pairs: SMP_IPS_PAIRS, askA: (a) => `${a} adalah …`, askB: (b) => `“${b}” — itu adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: PROVINSI_IBUKOTA, askA: (a) => `Ibu kota Provinsi ${a} adalah …`, askB: (b) => `${b} adalah ibu kota Provinsi …`, exA: (a, b) => `Ibu kota ${a}: ${b}.`, exB: (a, b) => `${b} ibu kota ${a}.` }),
    ],
    ppkn: [pairGenL({ pairs: LEMBAGA, askA: (a) => `Tugas/wewenang utama ${a} adalah …`, askB: (b) => `“${b}” adalah tugas/wewenang …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu wewenang ${a}.` })],
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
      ] as Fact[]), ...tikGens("SMP")],
    sejarah: sejarahGens("SMP"),
    jawa: jawaGens("SMP"),
    arab: [...arabGens("SMP"),
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
      pairGenL({ pairs: HAJI_PAIRS, askA: (a) => `Dalam ibadah haji, ${a} adalah …`, askB: (b) => `“${b}” — itu adalah istilah haji …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` })],
    quranhadis: [factGenL(qhFacts),
      pairGenL({ pairs: HADIS_CLASS, askA: (a) => `Hadis ${a} adalah hadis yang …`, askB: (b) => `“${b}” — itu adalah hadis …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu hadis ${a}.` })],
    ski: [khalifahGen,
      pairGenL({ pairs: DINASTI, askA: (a) => `Pusat pemerintahan ${a} adalah kota …`, askB: (b) => `Dinasti/kesultanan yang berpusat di ${b} adalah …`, exA: (a, b) => `${a} berpusat di ${b}.`, exB: (a, b) => `Yang berpusat di ${b}: ${a}.` }),
      factGenL(skiFactsSMA)],
    kristen: [factGenL(kristenFactsAdv),
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` })],
    "cambridge-eng": [
      pairGenL({ pairs: EN_PAST, askA: (a) => `The past tense (V2) of “${a}” is …`, askB: (b) => `“${b}” is the past tense of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }),
      pairGenL({ pairs: EN_OPPOSITES, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The antonym of “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `Opposite of ${b}: ${a}.` }),
    ],
    "cambridge-sci": [
      pairGenL({ pairs: CAM_SCI_PAIRS, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a}.` }),
      pairGenL({ pairs: UNSUR_SIMBOL, askA: (a) => `The chemical symbol for ${a.toLowerCase()} is …`, askB: (b) => `The symbol “${b}” stands for the element …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} = ${a}.` }),
    ],
    "cambridge-math": [camMath, smpEquation],
    korea: langVocabGensL(KOREA_VOCAB, "Korea", "SMP", KOREA_FACTS),
    jepang: [...langVocabGensL(JEPANG_VOCAB, "Jepang", "SMP", JEPANG_FACTS), pairGenL({ pairs: JEPANG_KANA, askA: (a) => `Hiragana untuk bunyi “${a}” adalah …`, askB: (b) => `Hiragana “${b}” dibaca …`, exA: (a, b) => `Bunyi “${a}” ditulis ${b}.`, exB: (a, b) => `${b} dibaca “${a}”.` })],
    mandarin: langVocabGensL(MANDARIN_VOCAB, "Mandarin", "SMP", MANDARIN_FACTS),
  },
  SMA: {
    matematika: [smaDerivative, smaLimit, smaLog, smaSeries, smaCombination, smaQuadratic, smaGeomSeries, smaDet, smaPerm, factGenL(TRIG_FACTS), mathStoryGen("SMA")],
    nalaria: nalariaGens("SMA"),
    "kanguru-matematika": kanguruMathGens("SMA"),
    "kanguru-bahasa": kanguruBahasaGens("SMA"),
    seamo: seamoGens("SMA"),
    sasmo: sasmoGens("SMA"),
    amo: amoGens("SMA"),
    jso: jsoGens("SMA"),
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
      pairGenL({ pairs: ENZIM, askA: (a) => `Enzim ${a} berfungsi …`, askB: (b) => `Enzim yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah enzim ${a}.` }),
      pairGenL({ pairs: ORGANEL, askA: (a) => `Fungsi organel ${a.toLowerCase()} adalah …`, askB: (b) => `Organel yang berfungsi “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
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
    indonesia: [classifyGen(majasClassify.map((x) => ({ item: `“${x.item}”`, cat: x.cat })), (i) => `Kalimat ${i} mengandung majas …`, (_i, c) => `Kalimat itu bermajas ${c.toLowerCase()}.`),
      pairGenL({ pairs: KATA_BAKU, askA: (a) => `Bentuk baku dari kata “${a}” adalah …`, askB: (b) => `Kata tidak baku dari “${b}” adalah …`, exA: (_a, b) => `Baku: ${b}.`, exB: (a, b) => `${a} tidak baku dari ${b}.` }),
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
    ppkn: [pairGenL({ pairs: LEMBAGA, askA: (a) => `Tugas/wewenang utama ${a} adalah …`, askB: (b) => `“${b}” adalah tugas/wewenang …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu wewenang ${a}.` }),
      factGenL([
        ["Menurut trias politica Montesquieu, kekuasaan yudikatif di Indonesia dijalankan oleh …", "MA dan MK", ["Presiden & DPR", "MPR", "KPK"], "Yudikatif: Mahkamah Agung & Mahkamah Konstitusi."],
        ["Amandemen UUD 1945 pertama kali dilakukan pada tahun …", "1999", ["1998", "2000", "2002"], "Amandemen I pada Sidang Umum MPR 1999; total 4 kali (1999–2002)."],
        ["Asas pemilu di Indonesia adalah …", "Luber dan jurdil", ["Cepat dan murah", "Terbuka dan rahasia penuh", "Langsung oleh MPR"], "Luber: langsung, umum, bebas, rahasia; Jurdil: jujur & adil."],
      ] as Fact[])],
    informatika: [
      pairGenL({ pairs: OSI_PAIRS, askA: (a) => `Lapisan OSI ${a} berfungsi untuk …`, askB: (b) => `“${b}” adalah fungsi lapisan OSI …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu fungsi ${a}.` }),
      pairGenL({ pairs: ATTACK_PAIRS, askA: (a) => `Serangan siber “${a}” adalah …`, askB: (b) => `“${b}” — itu adalah serangan …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      binaryGen,
      factGenL([
        ["Kompleksitas waktu algoritma binary search adalah …", "O(log n)", ["O(n)", "O(n log n)", "O(n²)"], "Binary search membagi data jadi dua tiap langkah → O(log n)."],
        ["Dalam basis data relasional, atribut unik pengidentifikasi setiap baris disebut …", "Primary key", ["Foreign key", "Index biasa", "View"], "Primary key: unik & tidak boleh NULL."],
      ] as Fact[]), ...tikGens("SMA")],
    sejarah: sejarahGens("SMA"),
    jawa: jawaGens("SMA"),
    arab: [...arabGens("SMA"),
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
      pairGenL({ pairs: ALIRAN, askA: (a) => `Aliran teologi ${a} berpendapat bahwa …`, askB: (b) => `“${b}” adalah pandangan aliran …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu pandangan ${a}.` }),
      pairGenL({ pairs: AKAD, askA: (a) => `Akad ${a} adalah …`, askB: (b) => `“${b}” — itu adalah akad …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu akad ${a}.` })],
    akidah: [
      pairGenL({ pairs: ALIRAN, askA: (a) => `Aliran teologi ${a} berpendapat bahwa …`, askB: (b) => `“${b}” adalah pandangan aliran …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu pandangan ${a}.` }),
      pairGenL({ pairs: SIFAT_WAJIB, askA: (a) => `Sifat wajib Allah “${a}” artinya …`, askB: (b) => `Sifat wajib Allah yang berarti “${b}” adalah …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `“${b}” adalah sifat ${a}.` }),
    ],
    fikih: [
      pairGenL({ pairs: AKAD, askA: (a) => `Akad ${a} adalah …`, askB: (b) => `“${b}” — itu adalah akad …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu akad ${a}.` }),
      fikihZakat,
    ],
    quranhadis: [factGenL(qhFacts),
      pairGenL({ pairs: TAFSIR_PAIRS, askA: (a) => `Tafsir ${a} adalah tafsir yang …`, askB: (b) => `“${b}” — itu adalah tafsir …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu tafsir ${a}.` }),
      factGenL([
        ["Metode menafsirkan Al-Qur'an dengan Al-Qur'an & hadis disebut tafsir …", "Bil ma'tsur", ["Bil ra'yi", "Isyari", "Ilmi"], "Tafsir bil ma'tsur bersumber pada riwayat."],
        ["Hadis yang sanadnya bersambung hingga Rasulullah disebut hadis …", "Marfu'", ["Mauquf", "Maqthu'", "Mursal sahabi"], "Marfu' disandarkan kepada Nabi SAW."],
      ] as Fact[])],
    ski: [
      pairGenL({ pairs: TOKOH_KARYA, askA: (a) => `${a} terkenal dengan karya/sumbangannya: …`, askB: (b) => `“${b}” adalah karya/sumbangan dari …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu karya ${a}.` }),
      pairGenL({ pairs: DINASTI, askA: (a) => `Pusat pemerintahan ${a} adalah kota …`, askB: (b) => `Dinasti/kesultanan yang berpusat di ${b} adalah …`, exA: (a, b) => `${a} berpusat di ${b}.`, exB: (a, b) => `Yang berpusat di ${b}: ${a}.` }),
      factGenL(skiFactsSMA), khalifahGen,
    ],
    kristen: [factGenL(kristenFactsAdv),
      pairGenL({ pairs: TOKOH_KRISTEN, askA: (a) => `Tokoh Alkitab ${a} dikenal karena …`, askB: (b) => `Tokoh yang dikenal “${b.toLowerCase()}” adalah …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah ${a}.` }),
      pairGenL({ pairs: PERAYAAN_KRISTEN, askA: (a) => `Perayaan ${a} memperingati …`, askB: (b) => `Peringatan “${b}” disebut …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `Itu adalah perayaan ${a}.` })],
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
      pairGenL({ pairs: CAM_SCI_PAIRS, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a}.` }),
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
export function generateQuestions(jenjang: JenjangId, subjectId: string, level: number, want: number, band01?: number): Question[] {
  const gens = GENERATORS[jenjang]?.[subjectId] ?? [];
  if (!gens.length) return [];
  // Pita kelas aktif: generator dipanggil dengan level hasil pemetaan
  // koordinat kesulitan gabungan, dan windowOf memakai koordinat itu.
  let genLevel = level;
  if (band01 !== undefined) {
    const coord = bandCoordFor(level, band01);
    genLevel = genLevelForCoord(coord);
    beginBand(coord, band01);
  }
  try {
    return generateFromGens(gens, genLevel, want);
  } finally {
    if (band01 !== undefined) endBand();
  }
}

function generateFromGens(gens: LGen[], level: number, want: number): Question[] {
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

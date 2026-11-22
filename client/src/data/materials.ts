// Bahan Belajar ZIQVA OLIM — materi dasar yang ditulis original dengan
// gaya bahasa sendiri dari pengetahuan umum kurikulum (bukan menyalin
// teks situs mana pun). Setiap mapel: pengantar, fokus per jenjang,
// konsep-konsep dasar bertahap, dan tips belajar yang memancing rasa
// ingin tahu.

import type { JenjangId } from "./questions";

export interface MaterialSection {
  h: string;
  body: string;
}
export interface Material {
  title: string;
  intro: string;
  focus: Partial<Record<JenjangId, string>>;
  sections: MaterialSection[];
  tips: string[];
}

export const MATERIALS: Record<string, Material> = {
  matematika: {
    title: "Matematika — Berhitung & Berpikir Pola",
    intro: "Matematika bukan sekadar menghafal rumus, tapi seni melihat pola. Mulai dari berhitung benda di sekitar, lalu naik ke pola bilangan, pecahan, bangun ruang, sampai aljabar dan turunan.",
    focus: {
      TK: "Mengenal angka 1–20, menghitung benda, membandingkan besar-kecil, dan pola sederhana.",
      SD: "Operasi hitung campuran, pecahan, FPB & KPK, bangun datar, dan soal cerita uang.",
      SMP: "Bilangan negatif, persamaan linear, gradien, peluang, dan skala peta.",
      SMA: "Turunan, limit, logaritma, barisan & deret, dan kombinatorika.",
    },
    sections: [
      { h: "1. Urutan mengerjakan hitungan", body: "Selalu kerjakan kurung dulu, lalu pangkat, lalu kali/bagi (dari kiri), terakhir tambah/kurang. Contoh: 6 + 3 × 4 = 6 + 12 = 18, bukan 36." },
      { h: "2. Pecahan itu bagian dari utuh", body: "3/4 artinya 3 bagian dari 4 bagian sama besar. Menjumlah pecahan: samakan penyebutnya dulu. 1/2 + 1/4 = 2/4 + 1/4 = 3/4." },
      { h: "3. FPB & KPK", body: "FPB = faktor bersama terbesar (untuk membagi sama rata). KPK = kelipatan bersama terkecil (untuk jadwal yang bertemu lagi, misalnya dua bus berangkat bersama)." },
      { h: "4. Pola bilangan", body: "Lihat selisih antar suku. Selisih tetap → barisan aritmetika. Selisih bertambah teratur (3, 5, 7, …) → selisihnya sendiri berpola. Tulis selisihnya di bawah barisan, polanya akan terlihat." },
      { h: "5. Aljabar: huruf adalah angka tersembunyi", body: "3x + 5 = 20 artinya 'sesuatu dikali 3 tambah 5 hasilnya 20'. Kurangi 5: 3x = 15, bagi 3: x = 5. Lakukan operasi yang sama di kedua ruas." },
      { h: "6. Turunan (SMA)", body: "Turunan mengukur laju perubahan. Aturan pangkat: turunan xⁿ adalah n·xⁿ⁻¹. Jadi turunan 2x² − 3x + 1 adalah 4x − 3. Konstanta selalu hilang." },
    ],
    tips: ["Gambar atau coret-coret soal cerita — otak lebih mudah berpikir dengan gambar.", "Periksa jawaban dengan cara mundur: masukkan hasilmu kembali ke soal.", "Salah hitung itu biasa; yang penting tahu di langkah mana ia terjadi."],
  },
  inggris: {
    title: "Bahasa Inggris — English from the Basics",
    intro: "English grows one word at a time. Start with everyday words, learn how sentences are built (Subject–Verb–Object), then master tenses: past, present, and future.",
    focus: {
      TK: "Colors, numbers, animals, and simple words with pictures and songs.",
      SD: "Vocabulary, opposites, plurals, simple present, and short reading.",
      SMP: "Past tense, passive voice, reported speech, since vs for.",
      SMA: "Conditionals, subjunctive, idioms, and reading tone & inference.",
    },
    sections: [
      { h: "1. Sentence pattern", body: "English sentences follow S–V–O: 'I (S) read (V) books (O) in the library.' If a sentence feels wrong, check who does what to whom." },
      { h: "2. Opposites & synonyms", body: "Learn words in pairs: brave >< afraid, rapid = fast. Pairing words doubles your vocabulary with half the effort." },
      { h: "3. Irregular plurals & verbs", body: "Some words break the rules: child → children, tooth → teeth, go → went, eat → ate. These must be memorized — flashcards work wonders." },
      { h: "4. Past tense signals", body: "Words like 'yesterday', 'last night', and 'ago' demand the past tense: 'She went to school yesterday.'" },
      { h: "5. Passive voice", body: "Passive = be + V3, used when the doer is unknown or unimportant: 'The report was written by the students.'" },
      { h: "6. Since vs for", body: "'Since' + starting point (since 2019). 'For' + duration (for two years). One question saves you: 'starting point or length of time?'" },
    ],
    tips: ["Label benda di rumah dengan sticky notes berbahasa Inggris.", "Dengarkan soal dengan tombol Dengarkan Soal — telinga yang terlatih membuat listening mudah.", "Baca satu paragraf Inggris setiap hari; tebak arti dari konteks sebelum membuka kamus."],
  },
  sains: {
    title: "IPA / Sains — Memahami Alam Sekitar",
    intro: "Sains dimulai dari pertanyaan 'kenapa?'. Kenapa buah jatuh ke bawah? Kenapa daun hijau? Di sini kita belajar tubuh, tumbuhan, gaya, energi, dan tata surya dari dasar.",
    focus: {
      TK: "Indera, hewan dan habitatnya, siang–malam, dan kebutuhan tanaman.",
      SD: "Bagian tumbuhan & organ tubuh, perubahan wujud benda, gaya, dan planet.",
      SMP: "Sel & organel, fotosintesis, gaya Newton, pH, dan perpindahan panas.",
      SMA: "Lanjut ke Biologi, Fisika, dan Kimia secara terpisah.",
    },
    sections: [
      { h: "1. Perubahan wujud benda", body: "Padat → cair = mencair; cair → gas = menguap; gas → cair = mengembun; cair → padat = membeku. Panas membuat partikel bergerak lebih cepat dan berubah wujud." },
      { h: "2. Fotosintesis", body: "Tumbuhan memasak makanannya: 6CO₂ + 6H₂O —(cahaya + klorofil)→ C₆H₁₂O₆ + 6O₂. Ingat: tumbuhan mengambil CO₂ dan melepas oksigen." },
      { h: "3. Gaya dan gerak", body: "Gravitasi menarik benda ke Bumi. Hukum II Newton: F = m × a — semakin besar massa atau percepatan, semakin besar gaya." },
      { h: "4. Urutan planet", body: "Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus. Jembatan keledai: 'MeVeBu MaJuSaUrNep'." },
      { h: "5. pH: asam, netral, basa", body: "pH < 7 asam (cuka, jeruk), pH = 7 netral (air murni), pH > 7 basa (sabun). Skala pH berjalan 0–14." },
      { h: "6. Perpindahan panas", body: "Konduksi lewat zat padat (sendok logam panas), konveksi lewat aliran zat cair/gas, radiasi tanpa perantara (panas matahari)." },
    ],
    tips: ["Lakukan percobaan kecil di dapur: es mencair, air menguap — sains paling melekat bila dialami.", "Gambar rantai makanan dan organel sel dengan warnamu sendiri.", "Tanyakan 'apa buktinya?' untuk setiap klaim sains — itu cara berpikir ilmuwan."],
  },
  biologi: {
    title: "Biologi — Ilmu tentang Kehidupan",
    intro: "Dari sel terkecil sampai ekosistem terbesar. Kuasai dulu sel dan organel, lalu genetika, enzim, dan respirasi — fondasi semua soal biologi olimpiade.",
    focus: { SMA: "Respirasi aerob & ATP, genetika Mendel, enzim pencernaan & replikasi DNA, sistem organ." },
    sections: [
      { h: "1. Organel sel", body: "Mitokondria = pembangkit energi (ATP). Ribosom = pabrik protein. Nukleus = pusat kendali. Ligase pada replikasi DNA = tukang sambung fragmen Okazaki." },
      { h: "2. Respirasi aerob", body: "Glikolisis (2 ATP) → Siklus Krebs (2 ATP) → Rantai transpor elektron (±34 ATP). Tahap terakhir adalah penghasil energi terbesar." },
      { h: "3. Genetika Mendel", body: "Aa × Aa → genotipe 1 AA : 2 Aa : 1 aa, fenotipe 3 dominan : 1 resesif. Gambar diagram Punnett kotak 2×2 agar tidak tertukar." },
      { h: "4. Enzim pencernaan", body: "Amilase mengurai tepung, pepsin & tripsin protein, lipase lemak, laktase gula susu. Setiap enzim punya satu 'gembok' substratnya." },
    ],
    tips: ["Buat tabel organel vs fungsi dan enzim vs substrat — soal olimpiade suka menukar-nukarnya.", "Untuk genetika, selalu tulis gamet dulu sebelum membuat kotak Punnett."],
  },
  fisika: {
    title: "Fisika — Gerak, Gaya, dan Energi",
    intro: "Fisika adalah matematika yang bercerita tentang dunia nyata. Hafalkan makna setiap rumus, bukan hurufnya: setiap rumus adalah kalimat tentang bagaimana alam bekerja.",
    focus: { SMA: "GLBB, energi kinetik, rangkaian listrik, gelombang, dan pegas." },
    sections: [
      { h: "1. GLBB", body: "v = v₀ + at dan s = v₀t + ½at². Kecepatan berubah teratur karena percepatan tetap." },
      { h: "2. Energi kinetik", body: "Ek = ½mv². Kecepatan berpengaruh kuadrat: kecepatan dua kali lipat → energi empat kali lipat." },
      { h: "3. Rangkaian paralel", body: "1/R = 1/R₁ + 1/R₂. Hambatan paralel selalu lebih kecil dari hambatan terkecilnya — jalan arus bertambah." },
      { h: "4. Gelombang", body: "v = λ × f. Panjang gelombang kali frekuensi sama dengan cepat rambat." },
      { h: "5. Pegas", body: "T = 2π√(m/k). Massa 4 kali → periode 2 kali (karena akar). Perhatikan hubungan akar dan kuadrat dalam rumus." },
    ],
    tips: ["Tulis satuan di setiap langkah — satuan yang salah menandakan rumus yang salah.", "Gambar diagram gaya sebelum menghitung; soal fisika yang digambar separuh selesai."],
  },
  kimia: {
    title: "Kimia — Unsur, Reaksi, dan Larutan",
    intro: "Kimia mempelajari zat dan perubahannya. Mulai dari lambang unsur dan tabel periodik, naik ke konfigurasi elektron, bilangan oksidasi, dan pH.",
    focus: { SMA: "Konfigurasi elektron, pH asam-basa kuat, bilangan oksidasi, dan larutan penyangga." },
    sections: [
      { h: "1. Lambang unsur", body: "Satu atau dua huruf, huruf pertama kapital: Fe (besi), Na (natrium), Au (emas), Hg (raksa). Banyak lambang berasal dari nama Latin." },
      { h: "2. Konfigurasi elektron", body: "Elektron mengisi kulit dari energi terendah: 1s 2s 2p 3s 3p 4s 3d… Fe (26): [Ar] 4s² 3d⁶ — perhatikan 4s terisi sebelum 3d." },
      { h: "3. pH asam & basa kuat", body: "HCl 0,01 M → [H⁺] = 10⁻² → pH = 2. Untuk basa: pOH dulu, lalu pH = 14 − pOH." },
      { h: "4. Bilangan oksidasi", body: "Jumlah biloks dalam senyawa netral = 0. H selalu +1, O hampir selalu −2. Dalam H₂SO₄: 2(+1) + S + 4(−2) = 0, jadi S = +6." },
      { h: "5. Larutan penyangga", body: "Buffer = asam lemah + basa konjugasinya (atau basa lemah + asam konjugasinya). Ia menahan perubahan pH." },
    ],
    tips: ["Hafalkan 20 unsur pertama + logam umum beserta lambangnya dengan kartu acak.", "Selalu cek jumlah atom dan muatan setelah menyetarakan reaksi."],
  },
  indonesia: {
    title: "Bahasa Indonesia — Kata, Kalimat, dan Teks",
    intro: "Bahasa Indonesia yang baik itu jelas dan hemat. Belajar antonim-sinonim, kata baku, kalimat efektif, majas, dan struktur teks — bekal untuk soal literasi olimpiade.",
    focus: {
      SD: "Ide pokok, antonim, huruf kapital, kata kerja, dan peribahasa.",
      SMP: "Kalimat efektif, jenis teks, dan kata baku.",
      SMA: "Majas, struktur teks eksposisi, dan makna imbuhan.",
    },
    sections: [
      { h: "1. Ide pokok & kalimat utama", body: "Ide pokok tinggal di kalimat utama, biasanya di awal (deduktif) atau akhir (induktif) paragraf. Kalimat lain hanya menjelaskannya." },
      { h: "2. Kalimat efektif", body: "Hemat dan tidak mubazir: 'Siswa sedang belajar' — bukan 'Para siswa-siswa'. Hindari pengulangan makna yang sama." },
      { h: "3. Kata baku", body: "Bentuk resmi menurut KBBI: apotek (bukan apotik), analisis (bukan analisa), praktik, zaman, izin, atlet, cokelat, risiko." },
      { h: "4. Peribahasa", body: "Ungkapan bermakna kiasan: 'Berakit-rakit ke hulu…' = bersusah dahulu, bersenang kemudian. Pelajari artinya, bukan hafalan bunyinya." },
      { h: "5. Majas", body: "Personifikasi: benda mati bertingkah seperti manusia ('angin berbisik'). Simile memakai kata seperti/bak. Metafora perbandingan langsung. Hiperbola berlebihan." },
    ],
    tips: ["Baca berita atau cerita satu halaman sehari dan tandai kata yang belum kamu kenal.", "Saat menulis, baca keras-keras kalimatmu — yang janggal di telinga biasanya tidak efektif."],
  },
  ips: {
    title: "IPS & Sejarah — Masyarakat dan Masa Lalu",
    intro: "IPS menghubungkan tempat, waktu, dan manusia: geografi, ekonomi, dan sejarah. Kuasai garis waktu peristiwa besar Indonesia dan konsep ekonomi dasar.",
    focus: {
      SD: "Proklamasi, pahlawan, ibu kota provinsi, ekspor–impor.",
      SMP: "Kerajaan Hindu-Buddha-Islam, inflasi, letak astronomis Indonesia.",
      SMA: "Teori ekonomi, Perang Dunia, devisa, dan masa Orde Baru.",
    },
    sections: [
      { h: "1. Garis waktu kemerdekaan", body: "1908 Budi Utomo → 1928 Sumpah Pemuda → 16 Ags 1945 Rengasdengklok → 17 Ags 1945 Proklamasi → 18 Ags 1945 UUD disahkan." },
      { h: "2. Ekspor & impor", body: "Ekspor = menjual ke luar negeri (menghasilkan devisa). Impor = membeli dari luar negeri (memakai devisa)." },
      { h: "3. Inflasi", body: "Kenaikan harga barang secara umum dan terus-menerus; nilai uang menurun. Lawannya deflasi." },
      { h: "4. Letak astronomis Indonesia", body: "6°LU–11°LS dan 95°BT–141°BT — itulah sebabnya Indonesia beriklim tropis dan punya 3 zona waktu." },
      { h: "5. Kerajaan tertua", body: "Kutai (abad ke-4, Prasasti Yupa) adalah kerajaan Hindu tertua; Sriwijaya pusat Buddha maritim; Majapahit puncak kejayaan di Jawa Timur." },
    ],
    tips: ["Buat garis waktu di dinding kamar; tempel peristiwa sesuai urutannya.", "Hubungkan setiap peristiwa dengan 'sebab → kejadian → akibat' agar tidak sekadar hafal tanggal."],
  },
  ppkn: {
    title: "PPKn — Pancasila & Kewarganegaraan",
    intro: "PPKn mengajarkan bagaimana negara kita diatur dan bagaimana menjadi warga yang baik: Pancasila, UUD 1945, lembaga negara, dan hak asasi manusia.",
    focus: {
      SD: "Bunyi & lambang sila, musyawarah, dan pengesahan UUD 1945.",
      SMP: "Lembaga negara, HAM, dan sejarah pemilu.",
      SMA: "Trias politica, amandemen UUD, dan asas pemilu luber-jurdil.",
    },
    sections: [
      { h: "1. Pancasila & lambangnya", body: "1 Ketuhanan–Bintang, 2 Kemanusiaan–Rantai, 3 Persatuan–Beringin, 4 Kerakyatan–Kepala Banteng, 5 Keadilan Sosial–Padi & Kapas. Pasangan sila-lambang adalah soal favorit." },
      { h: "2. Lembaga negara", body: "MPR mengubah UUD; DPR membuat UU; Presiden menjalankan pemerintahan; MA & MK memegang kekuasaan kehakiman; BPK memeriksa keuangan; KPU menyelenggarakan pemilu." },
      { h: "3. Trias politica", body: "Montesquieu membagi kekuasaan: legislatif (membuat UU), eksekutif (menjalankan), yudikatif (mengadili) — agar tidak ada kekuasaan mutlak." },
      { h: "4. Amandemen UUD 1945", body: "Empat kali: 1999, 2000, 2001, 2002. Amandemen membatasi masa jabatan presiden dan memperkuat HAM (Pasal 28A–28J)." },
    ],
    tips: ["Terapkan sila dalam cerita sehari-hari: menolong tetangga = sila ke-2, musyawarah kelas = sila ke-4.", "Hafalkan lembaga negara lewat fungsinya, bukan singkatannya."],
  },
  informatika: {
    title: "Informatika — Berpikir Komputasional",
    intro: "Informatika adalah cara berpikir memecahkan masalah seperti komputer: runtut, logis, dan efisien. Mulai dari perangkat komputer sampai algoritma dan jaringan.",
    focus: {
      SD: "Perangkat input/output/proses/penyimpanan dan keamanan data.",
      SMP: "Bilangan biner, struktur percabangan, dan jenis algoritma pengurutan.",
      SMA: "Kompleksitas algoritma, model OSI, basis data, dan serangan siber.",
    },
    sections: [
      { h: "1. Empat kelompok perangkat", body: "Input (keyboard, mouse, scanner), proses (CPU, RAM), output (monitor, printer, speaker), penyimpanan (harddisk, SSD, flashdisk). Software adalah programnya, bukan bendanya." },
      { h: "2. Bilangan biner", body: "Komputer hanya mengenal 0 dan 1. 1010₂ = 8+0+2+0 = 10. Setiap posisi bernilai pangkat dua: 1, 2, 4, 8, 16…" },
      { h: "3. Percabangan & perulangan", body: "'Jika … maka …' adalah seleksi. Mengulang perintah adalah looping. Dua struktur ini membentuk hampir semua program." },
      { h: "4. Kompleksitas", body: "Binary search O(log n) jauh lebih cepat dari pencarian linear O(n) pada data besar. Bubble sort O(n²) lambat untuk data raksasa." },
      { h: "5. Model OSI", body: "7 lapisan: Physical, Data Link, Network (IP & routing), Transport (TCP/UDP), Session, Presentation, Application (HTTP)." },
      { h: "6. Keamanan digital", body: "Phishing menipu lewat pesan palsu; DDoS membanjiri server; ransomware menyandera data. Backup rutin dan jangan berbagi kata sandi." },
    ],
    tips: ["Latih logika dengan menulis 'resep' langkah memasak mi instan sejelas mungkin — itu algoritma!", "Ubah bilangan biner kecil setiap hari; mulai dari 1–31."],
  },
};

MATERIALS.jawa = {
  title: "Bahasa Jawa — Unggah-Ungguh & Aksara",
  intro: "Bahasa Jawa punya tingkatan tutur yang menunjukkan sopan santun: ngoko untuk teman akrab, krama untuk menghormati. Ditambah aksara Hanacaraka yang legendaris — belajar Jawa berarti belajar tata krama.",
  focus: {
    SD: "Salam (sugeng enjing), kosakata ngoko–krama dasar, dan aksara ha-na-ca-ra-ka.",
    SMP: "Tembang macapat, tingkatan basa, dan paribasan.",
    SMA: "Sastra Jawa, serat-serat klasik, dan unggah-ungguh lengkap.",
  },
  sections: [
    { h: "1. Tingkatan basa", body: "Ngoko (akrab), madya (tengah), krama (halus). Contoh: mangan → dahar, ngombe → ngunjuk, turu → sare, lunga → tindak, teka → rawuh, omah → dalem." },
    { h: "2. Salam & ungkapan", body: "Sugeng enjing (pagi), sugeng siyang (siang), sugeng sonten (sore), sugeng dalu (malam), matur nuwun (terima kasih), nyuwun pangapunten (mohon maaf)." },
    { h: "3. Aksara Hanacaraka", body: "20 aksara: ha na ca ra ka / da ta sa wa la / pa dha ja ya nya / ma ga ba tha nga. Konon bercerita tentang dua abdi setia Aji Saka: Dora dan Sembada." },
    { h: "4. Tembang macapat", body: "Puisi tradisional beraturan guru gatra (jumlah baris), guru wilangan (suku kata), guru lagu (bunyi akhir). Gambuh: 7 gatra, watak grapyak. Maskumambang: 4 gatra, watak nelangsa. Pangkur: 7 gatra, watak gagah bersemangat." },
    { h: "5. Paribasan", body: "'Jer basuki mawa bea' — setiap cita-cita butuh pengorbanan/biaya. 'Kacang ora lali marang lanjaran' — orang tidak melupakan asal-usulnya." },
  ],
  tips: ["Praktikkan satu kalimat krama setiap hari kepada orang tua atau guru.", "Tulis namamu dengan aksara Jawa — cara seru mengingat Hanacaraka."],
};
MATERIALS.arab = {
  title: "Bahasa Arab — Kosakata & Nahwu Dasar",
  intro: "Bahasa Arab dibaca dari kanan ke kiri dengan 28 huruf hijaiyah. Kuasai kosakata benda sehari-hari, kata ganti (dhamir), dan jenis kata kerja (fi'il) sebagai fondasi.",
  focus: {
    SD: "Kosakata benda, salam, dan huruf hijaiyah.",
    SMP: "Fi'il madhi–mudhari'–amr, dhamir, dan huruf jar.",
    SMA: "Kedudukan kata (i'rab), jamak taksir, dan huruf jar dalam kalimat.",
  },
  sections: [
    { h: "1. Kosakata inti", body: "كِتَابٌ buku, قَلَمٌ pena, مَدْرَسَةٌ sekolah, بَيْتٌ rumah, مَسْجِدٌ masjid, شَمْسٌ matahari, قَمَرٌ bulan. Kelompokkan kata per tema agar mudah diingat." },
    { h: "2. Dhamir (kata ganti)", body: "هُوَ dia (lk), هِيَ dia (pr), أَنْتَ kamu (lk), أَنْتِ kamu (pr), أَنَا saya, نَحْنُ kami/kita." },
    { h: "3. Tiga bentuk fi'il", body: "Madhi = lampau (كَتَبَ telah menulis), mudhari' = sekarang/akan (يَكْتُبُ sedang menulis), amr = perintah (اُكْتُبْ tulislah!)." },
    { h: "4. Huruf jar", body: "إِلَى ke, مِنْ dari, فِي di dalam, عَلَى di atas, بِ dengan, لِ untuk. Kata setelah huruf jar dibaca majrur (kasrah)." },
    { h: "5. Jamak taksir", body: "Jamak yang berubah bentuk: كِتَابٌ → كُتُبٌ, بَيْتٌ → بُيُوتٌ, قَلَمٌ → أَقْلَامٌ. Pola-pola ini dihafalkan per kata." },
  ],
  tips: ["Tempel label Arab pada benda di kamarmu lengkap dengan harakatnya.", "Baca kata dari kanan, huruf demi huruf, sebelum membaca cepat."],
};
MATERIALS.pai = {
  title: "Pendidikan Agama Islam — Akidah, Ibadah & Akhlak",
  intro: "PAI merangkum keimanan (rukun iman), ibadah (rukun Islam), dan akhlak mulia. Fondasinya: mengenal Allah, para malaikat dan kitab-Nya, serta meneladani Rasulullah SAW.",
  focus: {
    TK: "Allah Tuhan kita, basmalah & hamdalah, Nabi Muhammad, masjid.",
    SD: "Rukun Islam & iman, malaikat dan tugasnya, kitab-kitab Allah, rakaat salat.",
    SMP: "Sumber hukum Islam, Isra Mikraj, zakat, dan toleransi (tasamuh).",
    SMA: "Faraid (waris), muamalah, dan aliran teologi.",
  },
  sections: [
    { h: "1. Rukun Islam & rukun iman", body: "Rukun Islam (5): syahadat, salat, zakat, puasa, haji. Rukun iman (6): iman kepada Allah, malaikat, kitab, rasul, hari kiamat, qada & qadar. Urutannya sering ditanyakan!" },
    { h: "2. Malaikat dan tugasnya", body: "Jibril wahyu, Mikail rezeki & hujan, Israfil sangkakala, Izrail nyawa, Munkar & Nakir penanya kubur, Raqib pencatat baik, Atid pencatat buruk, Malik neraka, Ridwan surga." },
    { h: "3. Kitab-kitab Allah", body: "Taurat → Musa, Zabur → Daud, Injil → Isa, Al-Qur'an → Muhammad SAW. Al-Qur'an adalah penyempurna dan penjaga kitab sebelumnya." },
    { h: "4. Rakaat salat wajib", body: "Subuh 2, Zuhur 4, Asar 4, Magrib 3, Isya 4 — total 17 rakaat sehari semalam." },
    { h: "5. Zakat", body: "Zakat mal 2,5% bila harta mencapai nisab dan berlalu haul (setahun). Zakat fitrah ditunaikan Ramadan sebelum Idulfitri." },
    { h: "6. Waris (faraid) dasar", body: "Istri: 1/8 bila ada anak, 1/4 bila tidak. Suami: 1/4 bila ada anak, 1/2 bila tidak. Ibu: 1/6 bila ada anak. Anak perempuan tunggal: 1/2." },
  ],
  tips: ["Buat kartu pasangan 'malaikat ↔ tugas' dan acak setiap hari.", "Praktikkan adab harian: basmalah sebelum makan, hamdalah sesudahnya."],
};
MATERIALS.akidah = {
  title: "Akidah Akhlak — Iman & Budi Pekerti",
  intro: "Akidah adalah keyakinan yang kokoh: sifat-sifat Allah (Asmaul Husna & sifat wajib) dan akhlak terpuji yang menjadi buahnya dalam perilaku sehari-hari.",
  focus: {
    SD: "Asmaul Husna pilihan dan akhlak terpuji vs tercela.",
    SMP: "Sifat wajib & mustahil Allah, penyakit hati.",
    SMA: "Aliran-aliran teologi Islam dan tauhid rububiyah–uluhiyah.",
  },
  sections: [
    { h: "1. Asmaul Husna", body: "Nama-nama Allah yang indah: Ar-Rahman (Pengasih), Ar-Rahim (Penyayang), Al-Khaliq (Pencipta), Al-Alim (Mengetahui), As-Sami' (Mendengar), Al-Bashir (Melihat), Ar-Razzaq (Pemberi Rezeki)." },
    { h: "2. Sifat wajib Allah", body: "Wujud (ada), Qidam (terdahulu), Baqa (kekal), Wahdaniyah (esa), Qudrat (kuasa), Iradat (berkehendak), Ilmu (mengetahui), Hayat (hidup), Sama', Bashar, Kalam." },
    { h: "3. Akhlak terpuji & tercela", body: "Terpuji (mahmudah): jujur, amanah, sabar, syukur, rendah hati. Tercela (mazmumah): riya', takabur (sombong), hasad (dengki), bakhil (kikir). Akidah yang benar melahirkan akhlak yang baik." },
    { h: "4. Aliran teologi (SMA)", body: "Jabariyah: manusia terpaksa. Qadariyah: manusia bebas penuh. Mu'tazilah: akal diutamakan. Asy'ariyah: jalan tengah — manusia berikhtiar (kasb), Allah yang menciptakan perbuatan." },
  ],
  tips: ["Hafalkan Asmaul Husna 3 nama per hari beserta artinya.", "Tulis satu akhlak terpuji yang kamu praktikkan hari ini di buku catatan."],
};
MATERIALS.fikih = {
  title: "Fikih — Hukum Ibadah & Muamalah",
  intro: "Fikih mengatur praktik ibadah dan hubungan antarmanusia: bersuci, salat, puasa, zakat, haji, sampai akad-akad muamalah seperti jual beli dan perwakilan.",
  focus: {
    SD: "Air mutlak, rukun wudu, pembatal puasa, zakat fitrah.",
    SMP: "Fardu kifayah, kadar zakat, hari haram puasa, istilah haji.",
    SMA: "Akad-akad muamalah dan riba.",
  },
  sections: [
    { h: "1. Bersuci", body: "Air mutlak (hujan, sumur, sungai) suci dan menyucikan. Rukun wudu: niat, basuh wajah, tangan sampai siku, usap kepala, basuh kaki, tertib. Tak ada air? Tayamum dengan debu suci." },
    { h: "2. Puasa", body: "Yang membatalkan: makan/minum sengaja, muntah disengaja. Yang tidak: tidur, mandi, makan karena lupa. Haram puasa pada Idulfitri, Iduladha, dan hari tasyrik." },
    { h: "3. Zakat", body: "Zakat emas, perak, dan perdagangan = 2,5% setelah nisab & haul. Zakat fitrah = bahan makanan pokok, ditunaikan Ramadan." },
    { h: "4. Istilah haji", body: "Ihram (niat & pakaian), wukuf di Arafah (puncak haji), tawaf (mengelilingi Ka'bah 7×), sa'i (Safa–Marwah 7×), tahallul (cukur rambut), jumrah (lempar batu di Mina)." },
    { h: "5. Akad muamalah", body: "Wakalah = perwakilan, ijarah = sewa jasa, kafalah = penanggungan, hawalah = pengalihan utang, mudharabah = bagi hasil, rahn = gadai. Tambahan yang disyaratkan atas utang = riba, diharamkan." },
  ],
  tips: ["Praktikkan urutan wudu sambil menyebutkan rukunnya satu per satu.", "Buat tabel akad vs artinya; soal suka menukar wakalah dengan kafalah dan hawalah."],
};
MATERIALS.quranhadis = {
  title: "Al-Qur'an Hadis — Kitabullah & Sunnah",
  intro: "Mengenal Al-Qur'an (114 surah, 30 juz) dan ilmu hadis: bagaimana sabda Nabi SAW dijaga melalui sanad dan matan selama berabad-abad.",
  focus: {
    SD: "Surah-surah pendek & artinya, wahyu pertama, jumlah surah.",
    SMP: "Klasifikasi hadis: mutawatir, ahad, marfu', mauquf.",
    SMA: "Metode tafsir dan istilah ulumul Qur'an.",
  },
  sections: [
    { h: "1. Mengenal Al-Qur'an", body: "Surah pertama Al-Fatihah (Ummul Kitab), terpanjang Al-Baqarah (286 ayat), terakhir An-Nas. Wahyu pertama: Al-'Alaq ayat 1–5 di Gua Hira. Satu-satunya surah tanpa basmalah di awal: At-Taubah." },
    { h: "2. Arti nama surah pendek", body: "Al-Fil = gajah, Al-'Asr = masa, Al-Kautsar = nikmat yang banyak, Al-Ma'un = barang berguna, An-Nashr = pertolongan, Al-Falaq = waktu subuh, An-Nas = manusia." },
    { h: "3. Klasifikasi hadis", body: "Mutawatir: perawi sangat banyak. Ahad: tidak mencapai mutawatir. Marfu': sampai kepada Nabi. Mauquf: berhenti pada sahabat. Maqthu': sampai tabi'in." },
    { h: "4. Metode tafsir", body: "Bil ma'tsur: dengan Qur'an, hadis, dan atsar sahabat. Bil ra'yi: dengan ijtihad berkaidah. Isyari: makna isyarat batin. Ilmi: pendekatan sains." },
    { h: "5. Hadis tentang niat", body: "'Innamal a'malu binniyat' — sesungguhnya setiap amal tergantung niatnya (HR. Bukhari–Muslim). Hadis pertama dalam Shahih Bukhari dan Arbain Nawawi." },
  ],
  tips: ["Hafalkan satu surah pendek beserta arti namanya setiap pekan.", "Bedakan sanad (rantai perawi) dan matan (isi hadis) dengan gambar rantai."],
};
MATERIALS.ski = {
  title: "SKI — Sejarah Kebudayaan Islam",
  intro: "Perjalanan peradaban Islam: dari Makkah dan Madinah, Khulafaur Rasyidin, dinasti-dinasti besar, sampai masa keemasan ilmu pengetahuan di Bagdad dan Andalusia.",
  focus: {
    SMP: "Khulafaur Rasyidin, Perjanjian Hudaibiyah, ibu kota dinasti.",
    SMA: "Tokoh ilmuwan Muslim & karyanya, Baitul Hikmah, Andalusia.",
  },
  sections: [
    { h: "1. Garis waktu awal Islam", body: "1 H Hijrah ke Madinah → 2 H Perang Badar → 6 H Perjanjian Hudaibiyah → 8 H Fathu Makkah → 10 H Haji Wada' → 11 H Nabi wafat." },
    { h: "2. Khulafaur Rasyidin", body: "Abu Bakar As-Siddiq → Umar bin Khattab → Utsman bin Affan (kodifikasi mushaf) → Ali bin Abi Thalib. Empat khalifah pertama setelah Nabi SAW." },
    { h: "3. Dinasti & ibu kotanya", body: "Umayyah di Damaskus, Abbasiyah di Bagdad, Fatimiyah di Kairo, Utsmaniyah di Istanbul, Safawiyah di Isfahan, Mughal di Delhi/Agra." },
    { h: "4. Masa keemasan ilmu", body: "Baitul Hikmah di Bagdad (era Al-Ma'mun) menerjemahkan & mengembangkan ilmu. Ibnu Sina: Al-Qanun (kedokteran). Al-Khawarizmi: aljabar. Ibnu Khaldun: Muqaddimah. Al-Ghazali: Ihya Ulumuddin." },
  ],
  tips: ["Gambar peta dan tandai ibu kota setiap dinasti — sejarah lebih mudah diingat lewat tempat.", "Susun kartu peristiwa–tahun dan urutkan seperti bermain domino."],
};
MATERIALS.kristen = {
  title: "Pendidikan Agama Kristen — Iman & Kasih",
  intro: "Belajar Alkitab dari Kejadian sampai Wahyu: penciptaan, tokoh-tokoh iman, kehidupan Yesus, buah Roh, dan perayaan gereja — dengan kasih sebagai hukum yang terutama.",
  focus: {
    TK: "Allah Pencipta, Yesus lahir di Betlehem, doa, dan hari Minggu.",
    SD: "Tokoh Alkitab & kisahnya, perayaan Natal–Paskah–Pentakosta, Doa Bapa Kami.",
    SMP: "Hukum terutama, Bait Allah Salomo, tokoh yang setia seperti Ayub.",
    SMA: "Surat-surat Paulus, Reformasi 1517, dan tiga sola.",
  },
  sections: [
    { h: "1. Tokoh & kisah Alkitab", body: "Nuh & bahtera, Abraham bapa orang beriman, Musa memimpin keluar dari Mesir, Daud melawan Goliat, Salomo yang berhikmat, Daniel di gua singa, Yunus & ikan besar, Yusuf yang mengampuni saudara-saudaranya." },
    { h: "2. Kehidupan Yesus", body: "Lahir di Betlehem (Natal), membaptis & mengajar, disalibkan (Jumat Agung), bangkit (Paskah), naik ke surga (Kenaikan), dan Roh Kudus turun (Pentakosta)." },
    { h: "3. Hukum yang terutama", body: "'Kasihilah Tuhan Allahmu… dan kasihilah sesamamu manusia seperti dirimu sendiri' (Matius 22:37–39) — rangkuman seluruh hukum Taurat." },
    { h: "4. Buah Roh", body: "Galatia 5:22–23: kasih, sukacita, damai sejahtera, kesabaran, kemurahan, kebaikan, kesetiaan, kelemahlembutan, penguasaan diri." },
    { h: "5. Mengenal Alkitab", body: "66 kitab: Perjanjian Lama 39 (pertama Kejadian), Perjanjian Baru 27 (terakhir Wahyu). Doa Bapa Kami diajarkan Yesus di Matius 6." },
    { h: "6. Reformasi (SMA)", body: "1517: Martin Luther & 95 tesis di Wittenberg. Semboyan: sola fide (hanya iman), sola gratia (hanya anugerah), sola scriptura (hanya Kitab Suci)." },
  ],
  tips: ["Buat kartu 'tokoh ↔ kisah' dan mainkan seperti kuis keluarga di hari Minggu.", "Hafalkan urutan perayaan dalam satu tahun gereja sambil menggambar kalender."],
};
MATERIALS["cambridge-eng"] = {
  title: "Cambridge English — Grammar & Vocabulary",
  intro: "Cambridge English builds accuracy: tenses, articles, plurals, and sentence structure tested in international style. Think in patterns, not translations.",
  focus: {
    SD: "Past tense, irregular plurals, adjectives, prepositions.",
    SMP: "Present perfect, despite/although, comparatives.",
    SMA: "Punctuation, collective nouns, advanced passive & conditionals.",
  },
  sections: [
    { h: "1. Present perfect", body: "Have/has + past participle: 'I have seen that film.' Common trap: 'have saw' is always wrong — use 'seen'." },
    { h: "2. Comparatives", body: "Good → better, bad → worse (irregular). Long adjectives use 'more': more beautiful. Never combine: 'more better' is wrong." },
    { h: "3. Punctuation & apostrophes", body: "It's = it is. Its = possessive. The team's = one team; the teams' = many teams. Read the meaning before choosing." },
    { h: "4. Collective nouns", body: "In formal British English, a committee/team acting as one unit takes a singular verb: 'The committee has reached its decision.'" },
  ],
  tips: ["Keep an error notebook: write every mistake with its correction.", "Read the whole sentence before answering — Cambridge questions hide clues at the end."],
};
MATERIALS["cambridge-sci"] = {
  title: "Cambridge Science — English for Young Scientists",
  intro: "Science vocabulary and concepts in English: plants, materials, forces, and the human body — the language of international science competitions.",
  focus: {
    SD: "Plant parts, states of matter, mammals, boiling point of water.",
    SMP: "Photosynthesis gases, units of force, chemical vs physical change.",
    SMA: "Forces in newtons, element symbols, genetics vocabulary.",
  },
  sections: [
    { h: "1. Plant parts", body: "Roots absorb, stems transport & support, leaves photosynthesise, flowers reproduce. Match part to job." },
    { h: "2. Changes", body: "Physical changes keep the same substance (melting ice, dissolving sugar). Chemical changes make new substances (burning wood, rusting iron)." },
    { h: "3. Units", body: "Force in newtons (N), energy in joules (J), power in watts (W), pressure in pascals (Pa). F = m × a." },
    { h: "4. Key numbers", body: "Water boils at 100 °C and freezes at 0 °C (at sea level). Plants absorb carbon dioxide and release oxygen." },
  ],
  tips: ["Make bilingual flashcards: English term on one side, meaning & example on the other.", "Say the unit aloud in every answer — scientists always do."],
};
MATERIALS["cambridge-math"] = {
  title: "Cambridge Maths — Numbers in English",
  intro: "The same strong mathematics, presented in English: number sequences, fractions, percentages, and algebra — exactly the style of Cambridge Primary & Lower Secondary checkpoints.",
  focus: {
    SD: "Times tables, biggest fractions, doubling sequences, perimeter.",
    SMP: "Fraction addition, linear equations, percentages.",
    SMA: "Quadratics, gradients, circle geometry, indices.",
  },
  sections: [
    { h: "1. Fractions", body: "Add with a common denominator: 3/4 + 2/3 = 9/12 + 8/12 = 17/12. Compare by converting to the same denominator or decimals." },
    { h: "2. Percentages", body: "15% of 200 = 0.15 × 200 = 30. Find 10% first, then build: 10% = 20, 5% = 10, total 30." },
    { h: "3. Linear equations", body: "3(x − 2) = 15 → x − 2 = 5 → x = 7. Undo operations in reverse order." },
    { h: "4. Circles", body: "Circumference = 2πr. With r = 7 and π ≈ 22/7: 2 × 22/7 × 7 = 44. Area = πr²." },
  ],
  tips: ["Translate the English word problem into your own words first, then compute.", "Estimate before calculating — a sensible estimate catches silly mistakes."],
};
MATERIALS.korea = {
  title: "Bahasa Korea — Hangul & Percakapan Dasar",
  intro: "Bahasa Korea memakai Hangul, alfabet ilmiah ciptaan Raja Sejong (1443) yang dirancang agar mudah dipelajari. Kalimatnya berurutan Subjek–Objek–Predikat: kata kerja selalu di akhir!",
  focus: {
    TK: "Salam, angka 1–10, warna, dan kata benda sehari-hari.",
    SD: "Kosakata sekolah & keluarga, angka Sino dan asli, partikel dasar.",
    SMP: "Partikel subjek/objek/topik, akhiran formal -입니다, kata tanya.",
    SMA: "Pola kalimat lengkap, gaya bicara sopan, dan kosakata lanjutan.",
  },
  sections: [
    { h: "1. Dua sistem angka", body: "Sino-Korea (dari Tiongkok): 일 이 삼 사 오 육 칠 팔 구 십 — untuk tanggal, uang, menit. Asli Korea: 하나 둘 셋 넷 다섯 — untuk menghitung benda dan umur. Keduanya hidup berdampingan!" },
    { h: "2. Salam & sopan santun", body: "안녕하세요 (annyeonghaseyo) = halo sopan. 감사합니다 (gamsahamnida) = terima kasih formal. Bahasa Korea sangat menjaga tingkat kesopanan." },
    { h: "3. Partikel: penanda peran kata", body: "이/가 menandai subjek, 을/를 objek, 은/는 topik. Contoh: 저는 학생입니다 (jeoneun haksaeng-imnida) = 'Saya adalah siswa' — 저 (saya) + 는 (topik) + 학생 (siswa) + 입니다 (adalah)." },
    { h: "4. Urutan kalimat SOP", body: "저는 밥을 먹어요 (saya nasi-Objek makan) — kata kerja selalu terakhir. Latih dengan menyusun kartu kata." },
    { h: "5. Kata tanya", body: "뭐 (apa), 어디 (di mana), 언제 (kapan), 누구 (siapa), 왜 (mengapa), 얼마 (berapa harga)." },
  ],
  tips: ["Tulis Hangul per suku kata dalam kotak: 한 = ㅎ+ㅏ+ㄴ. Blok suku kata selalu berbentuk kotak rapi.", "Dengarkan soal dengan tombol Dengarkan Soal lalu tirukan keras-keras — lidah perlu latihan fisik.", "Tonton satu adegan drama Korea dan tangkap 3 kata yang sudah kamu kenal."],
};
MATERIALS.jepang = {
  title: "Bahasa Jepang — Hiragana, Katakana & Kanji",
  intro: "Bahasa Jepang memakai tiga aksara sekaligus: Hiragana (aksara asli), Katakana (kata serapan asing), dan Kanji (karakter dari Tiongkok). Mulai dari Hiragana — 46 bunyi dasar yang teratur seperti tabel.",
  focus: {
    TK: "Salam, angka dengan kanji 一–十, warna, dan hewan.",
    SD: "Hiragana a–n, kosakata sekolah, partikel は dan を.",
    SMP: "Bentuk sopan -masu, kata tanya, dan kanji dasar.",
    SMA: "Pola kalimat lengkap, partikel lengkap, dan kosakata lanjutan.",
  },
  sections: [
    { h: "1. Tabel Hiragana (gojuuon)", body: "Baris bunyi: a i u e o / ka ki ku ke ko / sa shi su se so / ta chi tsu te to / na… / ha hi fu he ho / ma… / ya yu yo / ra… / wa wo n. Hafalkan per baris sambil menulis di udara." },
    { h: "2. Angka & kanji", body: "一 ichi (1), 二 ni (2), 三 san (3), 四 yon (4), 五 go (5), 六 roku (6), 七 nana (7), 八 hachi (8), 九 kyuu (9), 十 juu (10). Kanji angka berbentuk garis yang bertambah — mudah digambar!" },
    { h: "3. Partikel kunci", body: "は (dibaca 'wa') = penanda topik. を (dibaca 'o') = penanda objek. に = ke/di (arah & waktu). Contoh: わたしは学生です (watashi wa gakusei desu) = saya adalah siswa." },
    { h: "4. Bentuk sopan -masu", body: "食べる (taberu, makan) → 食べます (tabemasu). Bentuk -masu dipakai kepada guru dan orang yang dihormati." },
    { h: "5. Kanji alam", body: "山 yama (gunung), 川 kawa (sungai), 海 umi (laut), 森 mori (hutan), 水 mizu (air), 雨 ame (hujan), 雪 yuki (salju). Banyak kanji berasal dari gambar benda aslinya." },
  ],
  tips: ["Tulis setiap hiragana 5 kali sambil mengucapkan bunyinya keras-keras.", "Bedakan huruf mirip berpasangan: さ–ち, は–ほ, ね–れ–わ.", "Gunakan tombol Dengarkan Soal untuk melatih telinga membedakan bunyi panjang dan pendek."],
};
MATERIALS.mandarin = {
  title: "Bahasa Mandarin — Hanzi, Pinyin & Nada",
  intro: "Bahasa Mandarin adalah bahasa nada: kata yang sama bisa berarti berbeda hanya karena nadanya. Ditulis dengan karakter Hanzi, dibantu Pinyin (ejaan Latin) untuk belajar pengucapan.",
  focus: {
    TK: "Salam 你好, angka 一–十, warna, dan keluarga.",
    SD: "Kosakata sekolah, kata ukur 本/个, partikel 的 dan 吗.",
    SMP: "Urutan kalimat SPO, kalimat tanya, dan 4 nada.",
    SMA: "Kosakata lanjutan, pola kalimat lengkap, dan karakter gabungan.",
  },
  sections: [
    { h: "1. Empat nada", body: "Nada 1 datar tinggi (mā = ibu), nada 2 naik (má = rami), nada 3 turun-naik (mǎ = kuda), nada 4 turun tegas (mà = memarahi). Nada mengubah arti — latih dengan gerakan tangan mengikuti arah nada!" },
    { h: "2. Angka & karakter gambar", body: "一 yī, 二 èr, 三 sān, 四 sì, 五 wǔ, 六 liù, 七 qī, 八 bā, 九 jiǔ, 十 shí, 百 bǎi (100). Karakter dasar berasal dari gambar: 人 orang, 山 gunung, 水 air, 口 mulut." },
    { h: "3. Urutan kalimat SPO", body: "Sama seperti Indonesia: 我吃饭 (Wǒ chī fàn) = saya makan nasi. Ini membuat kalimat dasar Mandarin terasa akrab." },
    { h: "4. Partikel penting", body: "的 (de) = kepemilikan: 我的书 (buku saya). 吗 (ma) di akhir kalimat = penanya ya/tidak: 你好吗? (apa kabarmu?). 是 (shì) = adalah." },
    { h: "5. Kata ukur (measure words)", body: "Setiap benda punya kata ukurnya: 本 (běn) untuk buku, 个 (gè) umum, 只 (zhī) untuk hewan, 条 (tiáo) untuk benda panjang seperti ikan & sungai." },
  ],
  tips: ["Latih nada berpasangan: mā–má, mǎ–mà, sambil menggambar arah nada di udara.", "Tulis hanzi mengikuti urutan goresan: atas sebelum bawah, kiri sebelum kanan.", "Dengarkan soal Mandarin dengan tombol Dengarkan Soal, lalu ucapkan dengan nada yang sama."],
};

export function materialFor(subjectId: string): Material | null {
  return MATERIALS[subjectId] ?? null;
}

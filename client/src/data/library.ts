// Perpustakaan Belajar ZIQVA OLIM — modul-modul belajar per jenjang ×
// mata pelajaran, dengan penekanan khusus Sains/IPA yang lingkupnya
// lengkap per jenjang. Setiap modul: konsep dari dasar, contoh dalam
// kehidupan sehari-hari, dan rangkuman. Setiap soal latihan dipetakan
// ke modul yang relevan lewat kata kunci topik (moduleForQuestion),
// sehingga tombol "i" di kartu soal membuka materi yang benar-benar
// membahas topik soal itu — bukan halaman belajar umum.

import { MATERIALS } from "./materials";
import { englishMaterial, englishModule } from "./cambridge";
import { MODULE_ENRICH } from "./library-enrich";
import type { JenjangId, Question } from "./questions";

export interface LibraryModule {
  id: string;
  subjects: string[];
  jenjang: JenjangId[];
  /**
   * Modul khas kelas tertentu, per jenjang: mis. { SD: ["4","5","6"] }
   * berarti di jenjang SD modul ini hanya tampil untuk Kelas 4–6.
   * Tanpa entri untuk jenjang itu = modul umum, tampil untuk semua
   * kelas di jenjang tersebut.
   */
  kelas?: Partial<Record<JenjangId, string[]>>;
  emoji: string;
  title: string;
  keywords: string[];
  concept: string;
  example: string;
  summary: string;
  /** Contoh soal yang dibahas langkah demi langkah (pengayaan literasi). */
  worked?: string;
  /** Daftar kosakata / istilah penting modul ini, satu baris per istilah. */
  vocab?: string;
  /** Kotak "Tahukah Kamu?" — fakta seru pembangkit rasa penasaran. */
  fact?: string;
  /** Sudut literasi baca: teks pendek + pertanyaan pemahaman isi bacaan. */
  reading?: { title: string; text: string; qa: { q: string; a: string }[] };
}

const ALL: JenjangId[] = ["TK", "SD", "SMP", "SMA"];

/* ================= SAINS / IPA — lingkup lengkap per jenjang ================= */
const SAINS_MODULES: LibraryModule[] = [
  {
    id: "sains-makhluk-hidup", subjects: ["sains"], jenjang: ["TK", "SD"], emoji: "🦋",
    title: "Makhluk Hidup & Lingkungannya",
    keywords: ["hewan", "habitat", "hidup di", "metamorfosis", "kupu-kupu", "katak", "ulat", "kepompong", "tumbuhan", "tanaman", "bernapas", "tumbuh"],
    concept: "Makhluk hidup punya ciri: bernapas, bergerak, makan, tumbuh, dan berkembang biak. Setiap hewan punya rumah (habitat) yang cocok: ikan di air, burung di langit dan pohon, sapi di padang rumput. Ada hewan yang berubah bentuk selama hidupnya — itu metamorfosis. Metamorfosis sempurna (4 tahap: telur → larva/ulat → pupa/kepompong → dewasa) dialami kupu-kupu, katak, nyamuk, dan lalat. Metamorfosis tidak sempurna (telur → nimfa → dewasa) dialami belalang, kecoa, dan capung. Ayam dan kucing tidak bermetamorfosis karena anaknya mirip induknya.",
    example: "Lihat ulat di daun jambu di halaman rumah: beberapa hari lagi ia jadi kepompong, lalu keluar sebagai kupu-kupu. Itu metamorfosis sempurna yang bisa kamu amati sendiri!",
    summary: "Habitat = rumah makhluk hidup. Metamorfosis sempurna: telur–larva–pupa–dewasa (kupu-kupu, katak). Tidak sempurna: telur–nimfa–dewasa (belalang, kecoa).",
  },
  {
    id: "sains-tubuh-indera", subjects: ["sains"], jenjang: ["TK", "SD"], emoji: "👀",
    title: "Tubuh Manusia & Panca Indera",
    keywords: ["mata", "telinga", "hidung", "melihat", "mendengar", "mencium", "indera", "jantung", "paru-paru", "lambung", "otak", "hati", "ginjal", "kulit", "tulang", "organ"],
    concept: "Kita mengenal dunia lewat lima indera: mata untuk melihat, telinga untuk mendengar, hidung untuk mencium bau, lidah untuk mengecap rasa, dan kulit untuk meraba. Di dalam tubuh, organ bekerja sama: jantung memompa darah, paru-paru tempat bertukarnya oksigen dan karbon dioksida, lambung mencerna makanan, hati menetralkan racun, ginjal menyaring darah menjadi urine, otak mengatur pikiran dan seluruh kegiatan tubuh, tulang menopang dan melindungi organ.",
    example: "Saat kamu berlari, jantung berdetak lebih cepat — ia memompa lebih banyak darah berisi oksigen ke otot. Setelah istirahat, detaknya normal lagi. Tubuhmu mesin yang pintar!",
    summary: "Indera: mata–lihat, telinga–dengar, hidung–cium, lidah–rasa, kulit–raba. Jantung memompa darah; paru-paru menukar gas; ginjal menyaring darah.",
  },
  {
    id: "sains-tumbuhan", subjects: ["sains"], jenjang: ["SD", "SMP"], kelas: { SD: ["4", "5", "6"] }, emoji: "🌱",
    title: "Bagian Tumbuhan & Fotosintesis",
    keywords: ["akar", "daun", "batang", "bunga", "fotosintesis", "klorofil", "tumbuhan"],
    concept: "Tumbuhan punya bagian dengan tugas jelas: akar menyerap air dan zat hara dari tanah, batang menopang dan menyalurkan air serta makanan, daun adalah dapur tempat fotosintesis, bunga adalah alat perkembangbiakan. Fotosintesis adalah proses memasak makanan dengan bantuan cahaya matahari: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Zat hijau daun (klorofil) menangkap cahaya. Hasilnya glukosa (makanan tumbuhan) dan oksigen yang kita hirup.",
    example: "Tanaman di pot yang ditaruh di tempat gelap akan layu dan kuning, sedangkan yang kena matahari tumbuh hijau segar — bukti daun butuh cahaya untuk fotosintesis.",
    summary: "Akar menyerap, batang menyalurkan, daun memasak (fotosintesis), bunga berkembang biak. Fotosintesis: CO₂ + air + cahaya → glukosa + O₂.",
  },
  {
    id: "sains-energi-wujud", subjects: ["sains"], jenjang: ["SD", "SMP"], kelas: { SD: ["3", "4", "5", "6"] }, emoji: "🔥",
    title: "Energi & Perubahan Wujud Benda",
    keywords: ["mencair", "menguap", "membeku", "mengembun", "wujud", "energi", "panas", "konduksi", "konveksi", "radiasi", "suhu", "termometer"],
    concept: "Benda bisa berubah wujud karena panas: padat → cair disebut mencair, cair → gas menguap, gas → cair mengembun, cair → padat membeku, padat → gas menyublim. Sumber energi utama di Bumi adalah Matahari. Panas berpindah dengan tiga cara: konduksi (lewat zat padat, misalnya sendok logam yang ikut panas), konveksi (lewat aliran zat cair/gas, misalnya air mendidih), dan radiasi (tanpa perantara, misalnya panas matahari sampai ke Bumi). Suhu diukur dengan termometer.",
    example: "Embun di rumput pagi hari adalah uap air yang mengembun karena udara dingin malam. Es teh di gelas membuat dinding gelas berair — juga pengembunan!",
    summary: "Mencair, menguap, mengembun, membeku, menyublim. Panas berpindah: konduksi (padat), konveksi (aliran), radiasi (tanpa perantara).",
  },
  {
    id: "sains-bumi-antariksa", subjects: ["sains"], jenjang: ["SD", "SMP"], kelas: { SD: ["5", "6"] }, emoji: "🪐",
    title: "Bumi & Alam Semesta",
    keywords: ["planet", "merkurius", "venus", "mars", "jupiter", "saturnus", "uranus", "neptunus", "matahari", "bulan", "bintang", "tata surya", "langit", "siang", "malam"],
    concept: "Tata surya kita berpusat pada Matahari, bintang terdekat dari Bumi. Delapan planet mengorbitnya: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus. Merkurius paling dekat Matahari; Jupiter paling besar. Bintang memancarkan cahaya sendiri, sedangkan planet dan Bulan hanya memantulkan cahaya. Siang terjadi saat sisi Bumi menghadap Matahari; malam saat membelakanginya. Bulan adalah satelit alami Bumi.",
    example: "Bintang yang kamu lihat berkelip di malam cerah sebenarnya matahari-matahari jauh. Cahaya bintang terdekat kedua (setelah Matahari) butuh lebih dari 4 tahun untuk sampai ke matamu!",
    summary: "Urutan planet: Merkurius–Venus–Bumi–Mars–Jupiter–Saturnus–Uranus–Neptunus. Bintang bercahaya sendiri; planet & bulan memantulkan cahaya.",
  },
  {
    id: "sains-gaya-gerak", subjects: ["sains"], jenjang: ["SD", "SMP"], kelas: { SD: ["4", "5", "6"] }, emoji: "🧲",
    title: "Gaya & Gerak",
    keywords: ["gaya", "gravitasi", "gesek", "magnet", "otot", "newton", "massa jenis", "kecepatan", "percepatan", "jatuh"],
    concept: "Gaya adalah tarikan atau dorongan. Gravitasi Bumi menarik semua benda ke bawah — itu sebabnya buah jatuh ke tanah. Gaya gesek menahan gerak (membuat sepeda berhenti), gaya magnet menarik benda logam, gaya otot berasal dari tubuh kita. Di SMP kita menghitungnya: Hukum II Newton F = m × a (gaya = massa × percepatan, satuan Newton). Kecepatan rata-rata v = jarak : waktu. Massa jenis ρ = massa : volume.",
    example: "Sepeda meluncur lebih jauh di jalan halus daripada di jalan berkerikil karena gaya geseknya lebih kecil. Astronaut melayang di stasiun luar angkasa karena gravitasi di sana sangat lemah terasa.",
    summary: "Gravitasi menarik ke Bumi. F = m × a; v = s : t; ρ = m : V. Gesek menahan gerak, magnet menarik logam.",
  },
  {
    id: "sains-zat-materi", subjects: ["sains"], jenjang: ["SMP"], emoji: "🧪",
    title: "Zat & Materi: Campuran, Asam, dan Basa",
    keywords: ["ph", "asam", "basa", "netral", "campuran", "homogen", "heterogen", "zat", "larutan"],
    concept: "Materi di sekitar kita bisa berupa zat tunggal atau campuran. Campuran homogen tercampur merata dan tidak bisa dibedakan bagiannya (air gula, udara); campuran heterogen masih bisa dibedakan (air dengan minyak, salad buah). Sifat larutan diukur dengan pH 0–14: pH < 7 asam (cuka, air jeruk), pH = 7 netral (air murni), pH > 7 basa (sabun, pasta gigi). Semakin kecil pH semakin kuat asamnya.",
    example: "Perut terasa perih karena asam lambung berlebih? Obat maag bersifat basa untuk menetralkannya. Tukang kebun juga menguji pH tanah sebelum menanam.",
    summary: "Homogen = serba sama; heterogen = masih terpisah. pH < 7 asam, = 7 netral, > 7 basa.",
  },
  {
    id: "sains-sel-organ", subjects: ["sains", "biologi"], jenjang: ["SMP", "SMA"], emoji: "🔬",
    title: "Sel & Sistem Organ",
    keywords: ["sel", "organel", "mitokondria", "ribosom", "nukleus", "vakuola", "kloroplas", "membran", "sitoplasma", "golgi", "lisosom", "dinding sel"],
    concept: "Sel adalah unit terkecil kehidupan. Setiap organel punya tugas: mitokondria menghasilkan energi (ATP) lewat respirasi sel — dijuluki pembangkit listrik sel; ribosom membuat protein; nukleus (inti sel) mengatur seluruh kegiatan dan membawa materi genetik; kloroplas tempat fotosintesis (hanya sel tumbuhan); membran sel mengatur keluar-masuk zat; vakuola menyimpan cadangan; badan Golgi mengemas hasil protein; lisosom mencerna zat asing. Kumpulan sel sejenis membentuk jaringan, lalu organ, lalu sistem organ.",
    example: "Sel otot punya mitokondria jauh lebih banyak daripada sel kulit — karena otot butuh energi besar untuk bergerak. Bentuk mengikuti fungsi!",
    summary: "Mitokondria = energi, ribosom = protein, nukleus = kendali, kloroplas = fotosintesis, membran = pintu penjaga.",
  },
  {
    id: "sains-ekosistem", subjects: ["sains", "biologi"], jenjang: ["SMP", "SMA"], emoji: "🌳",
    title: "Ekosistem & Rantai Makanan",
    keywords: ["ekosistem", "rantai makanan", "produsen", "konsumen", "pengurai", "lingkungan", "populasi", "komunitas"],
    concept: "Ekosistem adalah kesatuan makhluk hidup (biotik) dengan lingkungannya (abiotik: air, udara, cahaya, tanah). Energi mengalir lewat rantai makanan: tumbuhan (produsen) → hewan pemakan tumbuhan (konsumen I) → pemakan daging (konsumen II) → pengurai (bakteri & jamur) yang mengembalikan zat hara ke tanah. Menghilangkan satu mata rantai mengganggu keseimbangan seluruh ekosistem.",
    example: "Jika ular sawah dibasmi, tikus merajalela dan panen padi gagal. Petani yang bijak justru memasang rumah burung hantu — pemangsa alami tikus.",
    summary: "Produsen → konsumen → pengurai. Semua makhluk saling terhubung; jaga keseimbangannya.",
  },
  {
    id: "sains-listrik-magnet", subjects: ["sains", "fisika"], jenjang: ["SMP", "SMA"], emoji: "⚡",
    title: "Listrik & Magnet",
    keywords: ["ampere", "volt", "ohm", "arus", "tegangan", "hambatan", "listrik", "magnet", "watt", "daya"],
    concept: "Arus listrik adalah aliran muatan; kuat arus diukur dalam Ampere (A), tegangan dalam Volt (V), hambatan dalam Ohm (Ω), dan daya dalam Watt (W). Hubungannya: V = I × R. Magnet punya dua kutub (utara & selatan); kutub senama tolak-menolak, tak senama tarik-menarik. Listrik dan magnet bersaudara: arus listrik menimbulkan medan magnet — prinsip motor listrik dan dinamo sepeda.",
    example: "Lampu rumah menyala karena arus mengalir dari sumber tegangan 220 V. Sekring putus saat arus berlebih — ia pengaman agar kabel tidak terbakar.",
    summary: "Arus = Ampere, tegangan = Volt, hambatan = Ohm, daya = Watt. V = I × R.",
  },
];

/* ================= BIOLOGI / FISIKA / KIMIA (SMA) ================= */
const BIO_MODULES: LibraryModule[] = [
  {
    id: "bio-respirasi", subjects: ["biologi"], jenjang: ["SMA"], emoji: "🫁",
    title: "Respirasi Sel & Energi (ATP)",
    keywords: ["respirasi", "atp", "glikolisis", "krebs", "transpor elektron", "fermentasi", "pernapasan", "trakea", "spirakel", "insang"],
    concept: "Respirasi aerob memecah glukosa menjadi energi (ATP) dalam tiga tahap: glikolisis di sitoplasma (2 ATP), siklus Krebs di mitokondria (2 ATP), dan rantai transpor elektron di membran mitokondria (±34 ATP) — tahap terakhir adalah penghasil ATP terbanyak. Tanpa oksigen, sel melakukan fermentasi yang hasilnya jauh lebih sedikit. Alat pernapasan hewan berbeda: serangga memakai trakea & spirakel, ikan memakai insang, mamalia memakai paru-paru.",
    example: "Ototmu pegal setelah lari cepat karena sel otot sempat kekurangan oksigen dan beralih ke fermentasi asam laktat. Napasmu yang terengah adalah upaya membayar 'utang oksigen'.",
    summary: "ATP terbanyak dari rantai transpor elektron (±34). Glikolisis 2, Krebs 2. Serangga: trakea; ikan: insang.",
  },
  {
    id: "bio-genetika", subjects: ["biologi"], jenjang: ["SMA"], emoji: "🧬",
    title: "Genetika: Persilangan Mendel",
    keywords: ["persilangan", "monohibrid", "genotipe", "fenotipe", "dominan", "resesif", "aa ×", "okazaki", "ligase", "replikasi", "dna"],
    concept: "Gen menentukan sifat; alel dominan menutupi alel resesif. Persilangan monohibrid Aa × Aa menghasilkan genotipe 1 AA : 2 Aa : 1 aa dan fenotipe 3 dominan : 1 resesif. Testcross Aa × aa menghasilkan 1 : 1. AA × aa menghasilkan semua Aa (dominan semua). Saat DNA menggandakan diri, enzim DNA ligase menyambung fragmen Okazaki pada untai lagging; helikase membuka pilinan, primase membuat primer.",
    example: "Petani menyilangkan mangga manis (dominan) dengan mangga asam untuk mendapat bibit unggul — prinsip yang sama dengan kotak Punnett di kelasmu.",
    summary: "Aa × Aa → fenotipe 3:1, genotipe 1:2:1. Aa × aa → 1:1. DNA ligase menyambung fragmen Okazaki.",
  },
  {
    id: "bio-enzim", subjects: ["biologi"], jenjang: ["SMA"], emoji: "🍽️",
    title: "Enzim & Pencernaan",
    keywords: ["enzim", "amilase", "pepsin", "lipase", "tripsin", "laktase", "maltase", "sukrase", "renin", "ptialin"],
    concept: "Enzim adalah protein pekerja yang mempercepat reaksi tanpa ikut habis. Setiap enzim khas untuk satu substrat: amilase (ptialin) mengubah amilum menjadi gula, pepsin & tripsin mengubah protein menjadi pepton lalu asam amino, lipase mengubah lemak menjadi asam lemak + gliserol, laktase mengubah laktosa susu, maltase mengubah maltosa menjadi glukosa, sukrase mengubah sukrosa menjadi glukosa + fruktosa, renin mengendapkan kasein susu pada bayi.",
    example: "Nasi yang dikunyah lama terasa manis — amilase di air liurmu sedang mengubah tepung nasi menjadi gula, langsung di mulut!",
    summary: "Amilase→tepung, pepsin/tripsin→protein, lipase→lemak, laktase→laktosa. Satu enzim, satu substrat.",
  },
];
const FIS_MODULES: LibraryModule[] = [
  {
    id: "fis-gerak", subjects: ["fisika", "sains"], jenjang: ["SMA", "SMP"], emoji: "🚗",
    title: "Gerak Lurus & GLBB",
    keywords: ["kecepatan awal", "percepatan", "glbb", "kecepatan akhirnya", "menempuh jarak", "kecepatan rata-rata"],
    concept: "Pada gerak lurus berubah beraturan (GLBB), kecepatan berubah tetap karena percepatan tetap: v = v₀ + at, dan jarak s = v₀t + ½at². Kecepatan rata-rata pada gerak biasa adalah v = jarak total : waktu total. Selalu perhatikan satuan: m, s, m/s, m/s².",
    example: "Mobil yang mengerem dari 20 m/s dengan perlambatan 2 m/s² berhenti dalam 10 detik — polisi memakai perhitungan ini untuk menyelidiki kecelakaan.",
    summary: "v = v₀ + at. Baca soal: cari v₀, a, t yang diketahui sebelum memilih rumus.",
  },
  {
    id: "fis-energi", subjects: ["fisika"], jenjang: ["SMA"], emoji: "🎢",
    title: "Energi Kinetik & Usaha",
    keywords: ["energi kinetik", "joule", "pegas", "periode", "getaran"],
    concept: "Energi kinetik adalah energi benda bergerak: Ek = ½mv². Kecepatan berpengaruh kuadrat — melaju dua kali lebih cepat berarti energi empat kali lebih besar (dan jarak pengereman jauh lebih panjang!). Untuk pegas, periode getaran T = 2π√(m/k): massa 4 kali lipat membuat periode hanya 2 kali lipat karena hubungan akar.",
    example: "Itulah sebabnya batas kecepatan di jalan sangat ketat: menaikkan kecepatan sedikit saja melipatgandakan energi tabrakan.",
    summary: "Ek = ½mv². T pegas = 2π√(m/k) — perhatikan akar dan kuadrat.",
  },
  {
    id: "fis-listrik", subjects: ["fisika"], jenjang: ["SMA"], emoji: "🔌",
    title: "Rangkaian Listrik: Seri & Paralel",
    keywords: ["paralel", "seri", "hambatan pengganti", "rangkai"],
    concept: "Hambatan seri dijumlahkan langsung: R = R₁ + R₂. Hambatan paralel: 1/R = 1/R₁ + 1/R₂, hasilnya selalu lebih kecil dari hambatan terkecil — karena arus punya lebih banyak jalan. Dua hambatan sama besar diparalel menghasilkan setengahnya. Instalasi rumah memakai rangkaian paralel agar setiap lampu mendapat tegangan penuh dan bisa menyala sendiri-sendiri.",
    example: "Satu lampu kamar mati tidak membuat seluruh rumah gelap — bukti instalasi rumahmu paralel, bukan seri seperti lampu hias murah.",
    summary: "Seri: jumlahkan. Paralel: 1/R = 1/R₁ + 1/R₂, hasil < hambatan terkecil.",
  },
  {
    id: "fis-gelombang", subjects: ["fisika"], jenjang: ["SMA"], emoji: "🌊",
    title: "Gelombang & Cepat Rambat",
    keywords: ["gelombang", "panjang gelombang", "frekuensi", "cepat rambat"],
    concept: "Gelombang membawa energi tanpa membawa materi. Cepat rambatnya v = λ × f: panjang gelombang (meter) dikali frekuensi (Hz). Gelombang yang frekuensinya besar dan panjang gelombangnya pendek bisa berambat sama cepatnya dengan yang sebaliknya — yang menentukan adalah hasil kalinya.",
    example: "Radio menangkap siaran karena gelombang elektromagnetik berambat pada kecepatan cahaya; stasiun berbeda dibedakan oleh frekuensinya.",
    summary: "v = λ × f. λ dalam meter, f dalam Hertz, v dalam m/s.",
  },
];
const KIM_MODULES: LibraryModule[] = [
  {
    id: "kim-unsur", subjects: ["kimia", "cambridge-sci"], jenjang: ["SMA", "SMP"], emoji: "⚛️",
    title: "Unsur & Lambang Kimia",
    keywords: ["lambang", "unsur", "simbol", "symbol", "fe", "element"],
    concept: "Setiap unsur punya lambang 1–2 huruf, huruf pertama kapital. Banyak lambang berasal dari nama Latin: Fe = besi (ferrum), Na = natrium, K = kalium, Au = emas (aurum), Ag = perak (argentum), Hg = raksa (hydrargyrum), Pb = timbal (plumbum), Sn = timah (stannum). Yang dari nama Inggris biasanya jelas: H hidrogen, O oksigen, C karbon, N nitrogen, Ca kalsium.",
    example: "Emas di cincin ditulis Au di tabel periodik — dari bahasa Latin aurum, 'cahaya fajar'. Kimia penuh sejarah!",
    summary: "Lambang Latin yang wajib hafal: Fe, Na, K, Au, Ag, Hg, Pb, Sn, Cu.",
  },
  {
    id: "kim-konfigurasi", subjects: ["kimia"], jenjang: ["SMA"], emoji: "🌀",
    title: "Konfigurasi Elektron",
    keywords: ["konfigurasi", "elektron", "[ar]", "4s", "3d"],
    concept: "Elektron mengisi orbital dari energi terendah: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p… Perhatikan: 4s terisi sebelum 3d. Gas mulia dipakai sebagai singkatan: [Ar] berarti konfigurasi argon (18 elektron). Besi Fe (Z = 26): [Ar] 4s² 3d⁶. Saat membentuk ion, logam transisi melepas elektron 4s lebih dulu.",
    example: "Konfigurasi menentukan sifat: unsur dengan elektron valensi sama (satu golongan) berperilaku mirip — itulah pola tabel periodik.",
    summary: "Urutan isi: …3p, 4s, 3d. Fe (26) = [Ar] 4s² 3d⁶.",
  },
  {
    id: "kim-ph", subjects: ["kimia"], jenjang: ["SMA"], emoji: "🧫",
    title: "pH Asam & Basa Kuat",
    keywords: ["ph larutan", "hcl", "naoh", "10⁻"],
    concept: "Untuk asam kuat, [H⁺] sama dengan konsentrasi asamnya: HCl 10⁻² M → pH = 2. Untuk basa kuat, hitung pOH dulu dari [OH⁻], lalu pH = 14 − pOH: NaOH 10⁻³ M → pOH = 3 → pH = 11. Ingat pH + pOH = 14 pada suhu kamar.",
    example: "Air aki adalah asam sulfat encer; menyentuhnya berbahaya karena pH-nya sangat rendah. Skala pH menjaga keamanan laboratorium dan kolam renang.",
    summary: "Asam kuat: pH = −log[H⁺]. Basa kuat: pH = 14 − pOH.",
  },
  {
    id: "kim-biloks-buffer", subjects: ["kimia"], jenjang: ["SMA"], emoji: "⚖️",
    title: "Bilangan Oksidasi & Larutan Penyangga",
    keywords: ["oksidasi", "penyangga", "buffer", "konjugasi"],
    concept: "Bilangan oksidasi (biloks): H umumnya +1, O umumnya −2, unsur bebas 0, dan jumlah biloks dalam senyawa netral = 0. Dalam H₂SO₄: 2(+1) + S + 4(−2) = 0 → S = +6. Larutan penyangga (buffer) adalah campuran asam lemah dengan basa konjugasinya (atau basa lemah + asam konjugasinya) yang menahan perubahan pH saat ditambah sedikit asam/basa — darah kita adalah buffer alami!",
    example: "Darah mempertahankan pH 7,4 dengan sistem buffer karbonat. Tanpa buffer, makan jeruk saja bisa mengubah pH darah secara berbahaya.",
    summary: "Jumlah biloks senyawa netral = 0. Buffer = asam lemah + basa konjugasinya.",
  },
];

/* ================= MATEMATIKA ================= */
const MATH_MODULES: LibraryModule[] = [
  {
    id: "mat-operasi", subjects: ["matematika", "cambridge-math"], jenjang: ["SD", "SMP", "SMA"], emoji: "➗",
    title: "Operasi Hitung & Urutan Pengerjaan",
    keywords: ["hasil dari", "jumlah", "selisih", "dikali", "dibagi", "kurung", "berapa hasil", "×", "÷"],
    concept: "Urutan mengerjakan hitungan campuran: kerjakan yang di dalam kurung dulu, lalu pangkat, lalu kali dan bagi (dari kiri ke kanan), terakhir tambah dan kurang. Contoh: 6 + 3 × 4 = 6 + 12 = 18 — bukan 36! Untuk soal cerita, tulis dulu apa yang diketahui dan apa yang ditanya, baru pilih operasinya: 'semuanya' biasanya tambah/kali, 'sisa' kurang, 'dibagi rata' bagi.",
    example: "Ibu membeli 3 pak permen, tiap pak isi 12, lalu diberikan 5 ke adik: 3 × 12 − 5 = 31. Kali dulu, baru kurang — sama seperti urutan di toko.",
    summary: "Kurung → pangkat → kali/bagi → tambah/kurang. Baca soal cerita dua kali sebelum menghitung.",
  },
  {
    id: "mat-pecahan", subjects: ["matematika", "cambridge-math"], jenjang: ["SD", "SMP"], kelas: { SD: ["3", "4", "5", "6"] }, emoji: "🍕",
    title: "Pecahan, Desimal & Persen",
    keywords: ["pecahan", "penyebut", "pembilang", "desimal", "persen", "%", "lebih besar", "senilai", "dibulatkan", "pembulatan"],
    concept: "Pecahan a/b artinya a bagian dari b bagian sama besar. Menjumlahkan pecahan: samakan penyebutnya dulu (1/2 + 1/4 = 2/4 + 1/4 = 3/4). Membandingkan pecahan: samakan penyebut atau ubah ke desimal. Persen adalah pecahan berpenyebut 100: 25% = 25/100 = 1/4 = 0,25. Pembulatan: lihat angka di belakang tempat yang diminta — 5 ke atas naik, di bawah 5 turun.",
    example: "Diskon 25% di toko artinya kamu membayar 75% harga. Pizza dibagi 8, kamu makan 3 potong = 3/8 pizza.",
    summary: "Samakan penyebut sebelum menjumlah pecahan. 25% = 1/4; 50% = 1/2; 75% = 3/4.",
  },
  {
    id: "mat-fpb-kpk-pola", subjects: ["matematika"], jenjang: ["SD", "SMP"], kelas: { SD: ["4", "5", "6"] }, emoji: "🔢",
    title: "FPB, KPK & Pola Bilangan",
    keywords: ["fpb", "kpk", "suku berikutnya", "pola", "barisan", "bilangan romawi", "faktor"],
    concept: "FPB (Faktor Persekutuan Terbesar) dipakai saat membagi benda ke kelompok sama banyak tanpa sisa. KPK (Kelipatan Persekutuan Terkecil) dipakai saat dua jadwal bertemu lagi (dua bus berangkat bersama). Pola bilangan: tulis selisih antar suku di bawahnya — selisih tetap berarti barisan aritmetika; selisih yang bertambah teratur berarti polanya dua tingkat. Bilangan Romawi: I=1, V=5, X=10, L=50, C=100, D=500, M=1000; huruf kecil di kiri mengurangi, di kanan menambah.",
    example: "Lampu A berkedip tiap 4 detik, lampu B tiap 6 detik. KPK 4 dan 6 = 12, jadi keduanya berkedip bersama tiap 12 detik.",
    summary: "FPB untuk membagi rata, KPK untuk jadwal bertemu. Selisih tetap = aritmetika.",
  },
  {
    id: "mat-bangun", subjects: ["matematika"], jenjang: ["SD", "SMP"], emoji: "📐",
    title: "Bangun Datar, Bangun Ruang & Sudut",
    keywords: ["luas", "keliling", "volume", "persegi", "segitiga", "lingkaran", "balok", "kubus", "tabung", "kerucut", "sudut", "sisi", "pythagoras", "siku-siku"],
    concept: "Luas persegi = s × s; persegi panjang = p × l; segitiga = ½ × alas × tinggi; lingkaran = πr² (kelilingnya 2πr). Volume balok = p × l × t; kubus = s³; tabung = πr²t. Segitiga punya 3 sisi, persegi 4 sisi sama panjang, lingkaran tak bersudut. Sudut lurus = 180°, sudut siku-siku = 90°, jumlah sudut segitiga = 180°. Teorema Pythagoras untuk segitiga siku-siku: c² = a² + b².",
    example: "Kebun 8 m × 5 m luasnya 40 m². Kolam berbentuk tabung jari-jari 7 m, tinggi 2 m, menampung π × 49 × 2 ≈ 308 m³ air.",
    summary: "Hafalkan pasangan: segitiga ½·a·t, lingkaran πr² & 2πr, balok p·l·t. Pythagoras: c² = a² + b².",
  },
  {
    id: "mat-uang-satuan", subjects: ["matematika"], jenjang: ["SD", "SMP"], kelas: { SD: ["2", "3", "4", "5", "6"] }, emoji: "💰",
    title: "Uang, Diskon, Keuntungan & Satuan",
    keywords: ["diskon", "keuntungan", "harga", "rupiah", "jam", "menit", "kg", "gram", "km", "meter", "liter"],
    concept: "Diskon = potongan harga: harga bayar = harga awal × (100% − diskon%). Untung = harga jual − harga beli; persen untung dihitung dari harga beli. Satuan: 1 km = 1.000 m, 1 kg = 1.000 g, 1 jam = 60 menit, 1 liter = 1.000 mL. Jam: selisih waktu dihitung dengan meminjam 60 menit bila menitnya kurang.",
    example: "Baju Rp100.000 diskon 20% → bayar Rp80.000. Beli pensil Rp2.000, jual Rp2.500 → untung Rp500 = 25% dari harga beli.",
    summary: "Bayar = awal × (100% − diskon). Untung% selalu dari harga beli.",
  },
  {
    id: "mat-aljabar", subjects: ["matematika"], jenjang: ["SMP", "SMA"], emoji: "🔤",
    title: "Aljabar: Persamaan & Sistem Persamaan",
    keywords: ["nilai x", "nilai y", "persamaan", "gradien", "kemiringan", "x =", "2x", "3x"],
    concept: "Huruf dalam aljabar adalah angka yang belum diketahui. Prinsip emas: lakukan operasi yang sama pada kedua ruas. 3x + 5 = 20 → 3x = 15 → x = 5. Gradien garis adalah kemiringannya: m = (y₂ − y₁) : (x₂ − x₁). Sistem dua persamaan diselesaikan dengan substitusi (ganti satu huruf dengan nilai dari persamaan lain) atau eliminasi (hilangkan satu huruf).",
    example: "Harga 2 buku + 1 pensil Rp17.000 dan 1 buku + 1 pensil Rp11.000. Kurangkan keduanya: 1 buku = Rp6.000. Itu eliminasi dalam kehidupan nyata!",
    summary: "Operasi yang sama di dua ruas. Gradien = selisih y : selisih x.",
  },
  {
    id: "mat-lanjut", subjects: ["matematika"], jenjang: ["SMA"], emoji: "📈",
    title: "Fungsi Kuadrat, Deret, Peluang & Turunan",
    keywords: ["turunan", "logaritma", "peluang", "kemungkinan", "faktorial", "permutasi", "kombinasi", "determinan", "matriks", "akar-akar", "diskriminan", "deret", "rasio", "limit", "trigonometri", "sin", "cos"],
    concept: "Persamaan kuadrat ax² + bx + c = 0: jumlah akar = −b/a, hasil kali akar = c/a, diskriminan D = b² − 4ac menentukan jenis akar. Deret geometri: Sₙ = a(rⁿ − 1)/(r − 1). Peluang = kejadian yang dicari : semua kemungkinan. Permutasi memperhatikan urutan (nPr = n!/(n−r)!), kombinasi tidak (nCr = n!/(r!(n−r)!)). Turunan pangkat: xⁿ → n·xⁿ⁻¹. Logaritma: log 100 = 2 karena 10² = 100. Sudut istimewa: sin 30° = ½, cos 60° = ½, tan 45° = 1.",
    example: "Melempar dadu: peluang mata 6 adalah 1 dari 6. Menyusun 3 finalis menjadi juara 1-2-3 adalah permutasi (urutan penting) = 3! = 6 cara.",
    summary: "Jumlah akar −b/a, kali akar c/a. Urutan penting = permutasi; tidak penting = kombinasi.",
  },
];

/* ================= BAHASA ARAB ================= */
const ARAB_MODULES: LibraryModule[] = [
  {
    id: "arab-kosakata", subjects: ["arab"], jenjang: ALL, emoji: "📖",
    title: "Kosakata Bahasa Arab (Mufradat)",
    keywords: ["artinya", "arti dari", "bahasa arabnya", "bahasa arab dari"],
    concept: "Mufradat adalah bekal utama Bahasa Arab. Cara cepat menghafal: kelompokkan per tema — benda sekolah (كِتَابٌ kitab=buku, قَلَمٌ qalam=pena, مَدْرَسَةٌ madrasah=sekolah), anggota keluarga (أَبٌ ayah, أُمٌّ ibu, أَخٌ saudara laki-laki, أُخْتٌ saudara perempuan), warna (أَحْمَرُ merah, أَزْرَقُ biru, أَخْضَرُ hijau, أَبْيَضُ putih, أَسْوَدُ hitam), dan lawan kata (كَبِيرٌ besar >< صَغِيرٌ kecil, طَوِيلٌ panjang >< قَصِيرٌ pendek, جَدِيدٌ baru >< قَدِيمٌ lama).",
    example: "Tempel label Arab di benda rumahmu: بابٌ di pintu, نَافِذَةٌ di jendela. Melihatnya setiap hari membuat hafalan menempel sendiri.",
    summary: "Hafalkan mufradat per tema dan berpasangan dengan lawan katanya.",
  },
  {
    id: "arab-dhamir-isyarah", subjects: ["arab"], jenjang: ALL, emoji: "👉",
    title: "Kata Ganti (Dhamir) & Kata Tunjuk",
    keywords: ["dhamir", "kata ganti", "kata tunjuk", "isim isyarah", "هٰذَا", "هٰذِهِ"],
    concept: "Dhamir (kata ganti orang): هُوَ dia laki-laki, هِيَ dia perempuan, أَنْتَ kamu laki-laki, أَنْتِ kamu perempuan, أَنَا saya, نَحْنُ kami/kita, هُمْ mereka laki-laki, هُنَّ mereka perempuan. Kata tunjuk dekat: هٰذَا (ini, untuk laki-laki/mudzakkar) dan هٰذِهِ (ini, untuk perempuan/muannats). Kata benda berakhiran ةٌ umumnya muannats: مَدْرَسَةٌ → هٰذِهِ مَدْرَسَةٌ. Kِتَابٌ mudzakkar → هٰذَا كِتَابٌ.",
    example: "Menunjuk buku (mudzakkar): هٰذَا كِتَابٌ. Menunjuk sekolah (muannats, ada ة): هٰذِهِ مَدْرَسَةٌ. Perhatikan akhiran ة-nya!",
    summary: "هُوَ dia (lk), هِيَ dia (pr), أَنَا saya, نَحْنُ kami. هذا untuk mudzakkar, هذه untuk muannats.",
  },
  {
    id: "arab-angka-hari", subjects: ["arab"], jenjang: ALL, emoji: "🔟",
    title: "Angka Arab & Nama Hari",
    keywords: ["angka", "bilangan", "dalam angka arab", "hari"],
    concept: "Angka Arab 1–10: وَاحِدٌ ١, اِثْنَانِ ٢, ثَلَاثَةٌ ٣, أَرْبَعَةٌ ٤, خَمْسَةٌ ٥, سِتَّةٌ ٦, سَبْعَةٌ ٧, ثَمَانِيَةٌ ٨, تِسْعَةٌ ٩, عَشَرَةٌ ١٠. Belasan memakai عَشَرَ: أَحَدَ عَشَرَ (11), اِثْنَا عَشَرَ (12). Puluhan: عِشْرُونَ (20), ثَلَاثُونَ (30), أَرْبَعُونَ (40), خَمْسُونَ (50) … تِسْعُونَ (90), مِائَةٌ (100). Hari: السَّبْتُ Sabtu, الْأَحَدُ Ahad, الْاِثْنَيْنِ Senin, الثُّلَاثَاءُ Selasa, الْأَرْبِعَاءُ Rabu, الْخَمِيسُ Kamis, الْجُمُعَةُ Jumat.",
    example: "Angka Arab timur (١٢٣) berbeda dari angka Latin (123) yang juga dipakai sebagian negara Arab. Di Indonesia, Al-Qur'an memakai angka ١٢٣.",
    summary: "1–10 hafalkan sebagai lagu. Puluhan berakhiran ُونَ: عشرون، ثلاثون، أربعون.",
  },
  {
    id: "arab-nahwu", subjects: ["arab"], jenjang: ["SMP", "SMA"], emoji: "🧩",
    title: "Nahwu Dasar: Jumlah, Fi'il & Huruf Jar",
    keywords: ["mubtada", "khabar", "fi'il", "fa'il", "jar", "jumlah", "idhafah", "mudhaf", "na'at", "man'ut", "fi'ilnya"],
    concept: "Kalimat Arab ada dua: jumlah ismiyah (diawali isim/kata benda: مُبْتَدَأٌ + خَبَرٌ, keduanya marfu') dan jumlah fi'liyah (diawali fi'il/kata kerja: فِعْلٌ + فَاعِلٌ). Kata kerja berubah menurut waktu: مَاضِي (lampau: كَتَبَ = telah menulis), مُضَارِع (sekarang/akan: يَكْتُبُ), أَمْر (perintah: اُكْتُبْ). Huruf jar (فِي، إِلَى، مِنْ، عَلَى، عَنْ، بِ، لِ، كَ) membuat kata sesudahnya majrur (berakhiran kasrah). Idhafah menyambung dua isim: كِتَابُ الطَّالِبِ (buku siswa itu).",
    example: "اَلْكِتَابُ جَدِيدٌ (buku itu baru) = jumlah ismiyah. كَتَبَ الطَّالِبُ الدَّرْسَ (siswa telah menulis pelajaran) = jumlah fi'liyah.",
    summary: "Ismiyah: mubtada + khabar. Fi'liyah: fi'il + fa'il. Setelah huruf jar, kata berharakat kasrah.",
  },
];

/* ================= AGAMA ISLAM (PAI, Akidah, Fikih, Qur'an Hadis, SKI) ================= */
const ISLAM_SUBJECTS = ["pai", "akidah", "fikih", "quranhadis", "ski"];
const ISLAM_MODULES: LibraryModule[] = [
  {
    id: "islam-rukun", subjects: ISLAM_SUBJECTS, jenjang: ALL, emoji: "🕌",
    title: "Rukun Islam & Rukun Iman",
    keywords: ["rukun islam", "rukun iman", "syahadat"],
    concept: "Rukun Islam ada 5: syahadat, salat, zakat, puasa Ramadan, dan haji bagi yang mampu. Rukun Iman ada 6: iman kepada Allah, malaikat-Nya, kitab-kitab-Nya, rasul-rasul-Nya, hari akhir, serta qada dan qadar (ketetapan baik dan buruk dari Allah). Rukun Islam adalah amalan lahir yang tampak; rukun iman adalah keyakinan di hati.",
    example: "Seperti rumah: rukun iman adalah fondasinya (keyakinan), rukun Islam adalah tiang-tiangnya (amalan). Keduanya membuat bangunan Islam berdiri kokoh.",
    summary: "Rukun Islam 5 (amalan), rukun Iman 6 (keyakinan).",
  },
  {
    id: "islam-malaikat-kitab", subjects: ["pai", "akidah", "quranhadis"], jenjang: ALL, emoji: "👼",
    title: "Malaikat, Kitab & Rasul",
    keywords: ["malaikat", "kitab suci", "diturunkan kepada nabi", "rasul", "nabi yang", "wahyu"],
    concept: "Sepuluh malaikat wajib diketahui: Jibril (wahyu), Mikail (rezeki & hujan), Israfil (sangkakala), Izrail (nyawa), Munkar dan Nakir (penanya di alam kubur), Raqib (mencatat amal baik), Atid (mencatat amal buruk), Malik (penjaga neraka), Ridwan (penjaga surga). Kitab suci: Taurat → Musa, Zabur → Dawud, Injil → Isa, Al-Qur'an → Muhammad ﷺ sebagai penyempurna. Rasul ulul azmi (paling sabar): Nuh, Ibrahim, Musa, Isa, Muhammad.",
    example: "Hafalkan malaikat dengan lagu: 'Jibril Mikail Israfil Izrail, Munkar Nakir Raqib Atid, Malik Ridwan' — sepuluh lengkap!",
    summary: "Raqib = baik, Atid = buruk, Munkar-Nakir = penanya kubur. Al-Qur'an penyempurna kitab sebelumnya.",
  },
  {
    id: "islam-asmaul-sifat", subjects: ["akidah", "pai"], jenjang: ["SD", "SMP", "SMA"], emoji: "✨",
    title: "Asmaul Husna & Sifat Allah",
    keywords: ["asmaul", "al-", "ar-", "sifat wajib", "sifat mustahil", "sifat jaiz"],
    concept: "Asmaul Husna adalah 99 nama Allah yang indah: Ar-Rahman (Maha Pengasih), Ar-Rahim (Maha Penyayang), Al-Malik (Maha Raja), As-Salam (Maha Pemberi Keselamatan), Al-Alim (Maha Mengetahui), Al-Khabir (Maha Waspada), As-Sami' (Maha Mendengar), Al-Bashir (Maha Melihat), Al-Qadir (Maha Kuasa), Al-Ghaffar (Maha Pengampun). Sifat wajib Allah antara lain wujud (ada), qidam (dahulu), baqa (kekal), wahdaniyah (esa). Sifat mustahil adalah lawannya (adam = tiada, huduts = baru). Sifat jaiz Allah hanya satu: berbuat sesuatu atau tidak berbuat.",
    example: "Saat berbuat baik diam-diam, ingat Al-Bashir: Allah Maha Melihat. Saat berbuat salah, ingat Al-Ghaffar: pintu taubat selalu terbuka.",
    summary: "Al-Alim = Mengetahui, Al-Khabir = Waspada. Sifat jaiz Allah hanya satu.",
  },
  {
    id: "islam-thaharah-salat", subjects: ["fikih", "pai"], jenjang: ["SD", "SMP", "SMA"], emoji: "💧",
    title: "Thaharah & Salat",
    keywords: ["wudu", "air", "najis", "tayamum", "salat", "rakaat", "jenazah", "jumat", "hadas"],
    concept: "Thaharah = bersuci. Air mutlak (suci & menyucikan): air hujan, sungai, sumur, embun, salju, mata air, laut. Air yang terkena najis dan berubah sifatnya tidak bisa dipakai bersuci. Najis dibagi tiga: mukhaffafah (ringan: air kencing bayi laki-laki di bawah 2 tahun yang hanya minum ASI — cukup diperciki air), mutawassithah (sedang: bangkai & darah — dicuci sampai hilang wujudnya), mughallazhah (berat: anjing & babi — dicuci 7 kali, salah satunya dengan tanah/debu bersih). Wudu membatalkan hadas kecil; mandi wajib menghilangkan hadas besar; tayamum (dengan debu) menggantikan keduanya saat tidak ada air. Rakaat salat fardu: Subuh 2, Zuhur 4, Asar 4, Magrib 3, Isya 4. Salat jenazah 4 takbir tanpa rukuk & sujud; salat Jumat 2 rakaat menggantikan Zuhur bagi laki-laki.",
    example: "Lupa membawa air saat perjalanan jauh? Islam memudahkan: tayamum dengan debu bersih, usap wajah dan tangan. Agama ini tidak memberatkan.",
    summary: "Najis anjing/babi = mughallazhah (7× cuci + tanah). Subuh 2, Zuhur 4, Asar 4, Magrib 3, Isya 4.",
  },
  {
    id: "islam-puasa-zakat-haji", subjects: ["fikih", "pai"], jenjang: ["SD", "SMP", "SMA"], emoji: "🌙",
    title: "Puasa, Zakat & Haji",
    keywords: ["puasa", "zakat", "haji", "fitrah", "nisab", "fidyah", "kaffarah", "bulan"],
    concept: "Puasa wajib di bulan Ramadan; puasa sunah antara lain Senin-Kamis, Syawal 6 hari, Arafah 9 Zulhijah. Yang membatalkan puasa: makan/minum sengaja, muntah disengaja, haid/nifas, hilang akal. Zakat fitrah: 2,5 kg (±3,5 liter) bahan makanan pokok per jiwa, dibayar sebelum salat Idulfitri. Zakat mal 2,5% bila mencapai nisab (emas 85 gram) dan haul (1 tahun). Haji wajib sekali seumur hidup bagi yang mampu (istitha'ah); umrah adalah haji kecil yang bisa kapan saja. Fidyah dibayar yang tidak mampu puasa sama sekali (lansia, sakit menahun); kaffarah adalah denda pelanggaran tertentu.",
    example: "Zakat fitrah memastikan tetangga yang kekurangan pun bisa ikut merayakan Idulfitri dengan perut kenyang — ibadah yang menyejahterakan.",
    summary: "Fitrah 2,5 kg/jiwa sebelum Idulfitri. Zakat mal 2,5%, nisab emas 85 g, haul 1 tahun.",
  },
  {
    id: "islam-quran-hadis", subjects: ["quranhadis", "pai"], jenjang: ["SD", "SMP", "SMA"], emoji: "📜",
    title: "Al-Qur'an, Surah & Hadis",
    keywords: ["surah", "al-qur'an", "alquran", "hadis", "ayat", "makkiyah", "madaniyah", "juz"],
    concept: "Al-Qur'an terdiri dari 114 surah dan 30 juz, diturunkan berangsur selama ±23 tahun kepada Nabi Muhammad ﷺ lewat Malaikat Jibril. Surah pertama turun: Al-'Alaq ayat 1–5; surah terakhir turun: Al-Maidah ayat 3. Surah terpanjang: Al-Baqarah (286 ayat); surah tanpa basmalah di awal: At-Taubah. Surah Makkiyah turun sebelum hijrah (umumnya tentang akidah), Madaniyah sesudah hijrah (banyak hukum). Hadis adalah perkataan, perbuatan, dan ketetapan Nabi ﷺ; hadis qudsi maknanya dari Allah, redaksinya dari Nabi. Hadis sahih sanadnya bersambung, rawinya adil & kuat hafalan, tanpa kejanggalan.",
    example: "Ayat kursi (Al-Baqarah 255) disebut ayat paling agung. Membaca Al-Mulk sebelum tidur adalah kebiasaan baik yang dianjurkan.",
    summary: "114 surah, 30 juz, ±23 tahun. Pertama turun Al-'Alaq 1–5; terpanjang Al-Baqarah.",
  },
  {
    id: "islam-sejarah", subjects: ["ski", "pai"], jenjang: ["SD", "SMP", "SMA"], emoji: "🏛️",
    title: "Sejarah Islam: Khulafaur & Dinasti",
    keywords: ["khalifah", "dinasti", "khulafaur", "ibu kota", "didirikan oleh", "berdiri pada", "tokoh", "penulis kitab", "gelar", "karya", "terkenal dengan", "sumbangan", "baitul hikmah"],
    concept: "Khulafaur Rasyidin: Abu Bakar (gelar Ash-Shiddiq, memerangi nabi palsu & mengumpulkan mushaf), Umar bin Khattab (Al-Faruq, pembebas Baitul Maqdis, membuat kalender Hijriah), Utsman bin Affan (Dzun Nurain, membukukan mushaf standar), Ali bin Abi Thalib (pintu ilmu, pusat pemerintahan di Kufah). Dinasti sesudahnya: Umayyah berpusat di Damaskus; Abbasiyah di Baghdad (masa keemasan ilmu, Baitul Hikmah); Fatimiyah di Kairo (mendirikan Al-Azhar); Umayyah II di Cordoba, Andalusia (perpustakaan raksasa Eropa); Ayyubiyah dipimpin Shalahuddin Al-Ayyubi yang membebaskan Al-Quds. Tokoh ilmu: Al-Khawarizmi (aljabar & angka 0), Ibnu Sina (kedokteran, Al-Qanun), Ibnu Khaldun (sosiologi, Muqaddimah).",
    example: "Kata 'algebra' berasal dari kitab Al-Khawarizmi 'Al-Jabr'. Angka 0 yang kamu pakai di matematika juga diperkenalkan lewat dunia Islam!",
    summary: "Umayyah–Damaskus, Abbasiyah–Baghdad, Fatimiyah–Kairo, Umayyah II–Cordoba. Utsman membukukan mushaf.",
  },
  {
    id: "islam-muamalah", subjects: ["fikih", "pai", "ips"], jenjang: ["SMP", "SMA"], emoji: "🤝",
    title: "Muamalah, Akad & Ekonomi Islam",
    keywords: ["akad", "jual beli", "murabahah", "mudharabah", "musyarakah", "ijarah", "riba", "waris", "faraid", "bagi hasil"],
    concept: "Muamalah mengatur hubungan antarmanusia. Akad harus jelas, sukarela, dan bebas riba (tambahan haram dalam utang), gharar (ketidakpastian), dan maysir (judi). Akad populer: murabahah (jual beli dengan margin yang disepakati), mudharabah (satu pihak modal, pihak lain mengelola, untung dibagi hasil), musyarakah (modal bersama), ijarah (sewa/upah). Ilmu waris (faraid): anak laki-laki mendapat 2 bagian dibanding anak perempuan 1 bagian; istri mendapat 1/8 bila ada anak; ibu mendapat 1/6 bila ada anak.",
    example: "Menabung di bank syariah dengan akad mudharabah: kamu pemilik dana, bank pengelola, keuntungan dibagi menurut nisbah yang disepakati di awal — bukan bunga tetap.",
    summary: "Hindari riba, gharar, maysir. Waris: laki-laki : perempuan = 2 : 1.",
  },
  {
    id: "islam-aliran", subjects: ["akidah", "pai"], jenjang: ["SMA"], emoji: "🧭",
    title: "Aliran Teologi Islam",
    keywords: ["aliran", "mu'tazilah", "mutazilah", "asy'ariyah", "asyariyah", "khawarij", "murji'ah", "murjiah", "jabariyah", "qadariyah"],
    concept: "Dalam sejarah Islam muncul aliran pemikiran akidah: Mu'tazilah menekankan akal dan keadilan Allah (manusia bebas berkehendak); Asy'ariyah jalan tengah antara akal dan wahyu (diikuti mayoritas Ahlussunnah di Indonesia); Khawarij sangat keras — mengkafirkan pelaku dosa besar dan keluar dari barisan Ali; Murji'ah menunda penilaian iman pelaku dosa besar kepada Allah; Jabariyah meyakini manusia terpaksa (takdir mutlak); Qadariyah meyakini manusia punya kehendak bebas penuh. NU mengikuti Asy'ariyah dalam akidah.",
    example: "Perbedaan pendapat para ulama masa lalu adalah khazanah berpikir — kita mempelajarinya untuk memahami, bukan untuk saling menyalahkan.",
    summary: "Asy'ariyah = jalan tengah (mayoritas Indonesia). Khawarij = keras. Mu'tazilah = akal & keadilan.",
  },
];

/* ================= AGAMA KRISTEN ================= */
const KRISTEN_MODULES: LibraryModule[] = [
  {
    id: "kristen-alkitab", subjects: ["kristen"], jenjang: ["SD", "SMP", "SMA"], emoji: "✝️",
    title: "Alkitab, Tokoh & Perjanjian",
    keywords: ["alkitab", "kitab", "perjanjian", "nabi", "rasul", "murid", "yesus", "ditulis oleh"],
    concept: "Alkitab terdiri dari Perjanjian Lama (sejarah Israel, Taurat Musa, Mazmur Daud) dan Perjanjian Baru (kehidupan Yesus dan gereja mula-mula). Tokoh kunci: Abraham bapa orang beriman; Musa memimpin Israel keluar dari Mesir dan menerima Sepuluh Perintah; Daud raja Israel penulis banyak Mazmur; Paulus rasul yang menulis banyak surat (Roma, Korintus) dan mengabarkan Injil ke bangsa-bangsa; Petrus pemimpin para rasul; Maria ibu Yesus; Yohanes Pembaptis mempersiapkan jalan Yesus. Empat Injil: Matius, Markus, Lukas, Yohanes.",
    example: "Mazmur 23 'Tuhan adalah gembalaku' ditulis Daud — dibaca jutaan orang sampai hari ini untuk menenangkan hati.",
    summary: "PL = sebelum Yesus; PB = Yesus & gereja. Injil ada 4: Matius, Markus, Lukas, Yohanes.",
  },
  {
    id: "kristen-ajaran", subjects: ["kristen"], jenjang: ["SD", "SMP", "SMA"], emoji: "❤️",
    title: "Ajaran Yesus & Kehidupan Kristen",
    keywords: ["hukum", "kasih", "perayaan", "hari raya", "natal", "paskah", "buah roh", "sakramen", "doa bapa kami"],
    concept: "Hukum yang terutama menurut Yesus: kasihilah Tuhan Allahmu dengan segenap hati, dan kasihilah sesamamu manusia seperti dirimu sendiri. Hari raya Kristen: Natal (kelahiran Yesus), Jumat Agung (penyaliban), Paskah (kebangkitan Yesus — hari raya terpenting), Kenaikan (Yesus naik ke surga 40 hari setelah Paskah), Pentakosta (turunnya Roh Kudus 50 hari setelah Paskah). Buah Roh: kasih, sukacita, damai sejahtera, kesabaran, kemurahan, kebaikan, kesetiaan, kelemahlembutan, penguasaan diri. Doa Bapa Kami diajarkan Yesus sendiri; sakramen utama Protestan: baptisan dan perjamuan kudus.",
    example: "Khotbah di Bukit mengajarkan 'berbahagialah orang yang membawa damai' — ajaran kasih yang dipraktikkan lewat melayani sesama.",
    summary: "Hukum terutama = kasih kepada Allah & sesama. Paskah = kebangkitan, perayaan terpenting.",
  },
];

/* ================= BAHASA (Inggris, Indonesia, Jawa, Korea, Jepang, Mandarin) ================= */
const LANG_MODULES: LibraryModule[] = [
  {
    id: "ing-vocab", subjects: ["inggris", "cambridge-eng"], jenjang: ["SD", "SMP", "SMA"], emoji: "🔤",
    title: "English Vocabulary & Opposites",
    keywords: ["opposite", "synonym", "means", "artinya", "smallest", "between", "word", "arrange", "complete"],
    concept: "Learn words in pairs and families: opposites (big >< small, brave >< afraid, ancient >< modern), synonyms (rapid = fast, begin = start), and number words (twenty-one … ninety-nine). Smallest means the least value; 'between' asks for the number in the middle. Arranging letters: say the word aloud, then group its letters — TWENTYTWO is TWENTY + TWO.",
    example: "Reading one short paragraph daily and guessing meanings from context grows vocabulary faster than memorizing word lists.",
    summary: "Pairs & families beat long lists. smallest = paling kecil; between = di antara.",
  },
  {
    id: "ing-grammar", subjects: ["inggris", "cambridge-eng"], jenjang: ["SD", "SMP", "SMA"], emoji: "📝",
    title: "English Grammar: Tenses, Plurals & Passive",
    keywords: ["past tense", "went", "plural", "children", "passive", "reported", "since", "for", "conditional", "subjunctive", "idiom"],
    concept: "English sentences follow Subject–Verb–Object. Irregular plurals: child→children, tooth→teeth, man→men. Irregular past: go→went, eat→ate, buy→bought. Time signals demand tenses: yesterday/last night/ago → past tense. Passive voice = be + V3 (The report was written by…), used when the doer is unknown or unimportant. Since + starting point (since 2019); for + duration (for two years). Conditional type 2 (imaginary present): If I were you, I would…",
    example: "'She went to school yesterday' — 'yesterday' forces the past form 'went', never 'goes'.",
    summary: "yesterday → past. since = titik awal, for = durasi. Passive = be + V3.",
  },
  {
    id: "indo-kata", subjects: ["indonesia"], jenjang: ALL, emoji: "🗣️",
    title: "Kosakata: Antonim, Sinonim & Peribahasa",
    keywords: ["antonim", "sinonim", "peribahasa", "lawan kata", "persamaan kata", "arti peribahasa"],
    concept: "Antonim adalah lawan kata (rajin >< malas, hemat >< boros), sinonim persamaan kata (bahagia = gembira, melihat = memandang). Peribahasa menyimpan nasihat dalam kiasan: 'Air beriak tanda tak dalam' (orang banyak bicara biasanya dangkal ilmunya), 'Berat sama dipikul, ringan sama dijinjing' (gotong royong), 'Tong kosong nyaring bunyinya' (banyak bicara, sedikit isi). Perhatikan pasangan kata yang mirip tapi beda makna, misalnya 'rendah' (posisi) dan 'rendah hati' (sifat tidak sombong).",
    example: "Saat piket kelas bersama, terapkan 'berat sama dipikul, ringan sama dijinjing' — pekerjaan terasa ringan karena dibagi.",
    summary: "Antonim = lawan, sinonim = sama. Peribahasa dipahami maknanya, bukan kata per kata.",
  },
  {
    id: "indo-baku-teks", subjects: ["indonesia"], jenjang: ["SD", "SMP", "SMA"], emoji: "✍️",
    title: "Kata Baku, Kalimat Efektif & Teks",
    keywords: ["baku", "kalimat efektif", "teks", "majas", "eyd", "ejaan", "subjek", "predikat", "kalimat utama", "gagasan"],
    concept: "Kata baku mengikuti KBBI: apotek (bukan apotik), nasihat (bukan nasehat), jadwal, kualitas, risiko. Kalimat efektif itu hemat, jelas, dan punya subjek-predikat yang tegas. Gagasan utama paragraf biasanya di awal (deduktif) atau di akhir (induktif). Majas membandingkan: metafora (langsung: 'engkau matahari hidupku'), simile memakai kata seperti/bagai, personifikasi memberi sifat manusia pada benda, hiperbola melebih-lebihkan.",
    example: "Surat resmi memakai kata baku dan kalimat efektif — tanpa kata mubazir seperti 'demi untuk'.",
    summary: "Baku = sesuai KBBI. Metafora tanpa 'seperti'; simile memakai 'seperti/bagai'.",
  },
  {
    id: "jawa-basa", subjects: ["jawa"], jenjang: ALL, emoji: "🗨️",
    title: "Bahasa Jawa: Ngoko, Krama & Kosakata",
    keywords: ["krama", "ngoko", "artine", "tegese", "bahasa jawanya", "basa"],
    concept: "Bahasa Jawa punya tingkat tutur: ngoko untuk teman sebaya & akrab, krama untuk menghormati orang lebih tua. Pasangan penting: aku–kula (saya), kowe–panjenengan (kamu), mangan–nedha/dhahar (makan), turu–sare (tidur), omah–dalem (rumah), bapak–rama, ibu–ibu, arep–kersa (mau), saiki–sapunika (sekarang), sesuk–benjing (besok), wingi (kemarin), ora–mboten (tidak), iya–inggih (ya), pira–pinten (berapa), endi–pundi (mana), lara–gerah (sakit), gedhe–ageng (besar), cilik–alit (kecil), adoh–tebih (jauh), cedhak–celak (dekat), banyu–toya (air).",
    example: "Kepada guru ucapkan 'Kula badhe tindak sekolah' (saya mau berangkat sekolah) — memakai krama menunjukkan sopan santun, nilai utama budaya Jawa.",
    summary: "Krama = hormat. Turu→sare, mangan→dhahar, omah→dalem, banyu→toya.",
  },
  {
    id: "jawa-aksara-tembang", subjects: ["jawa"], jenjang: ["SMP", "SMA"], emoji: "📜",
    title: "Aksara Jawa, Tembang & Paribasan",
    keywords: ["aksara", "hanacaraka", "tembang", "paribasan", "parikan", "macapat"],
    concept: "Aksara Jawa (hanacaraka) berjumlah 20: ha na ca ra ka, da ta sa wa la, pa dha ja ya nya, ma ga ba tha nga. Tembang macapat adalah puisi tradisional beraturan guru gatra, guru lagu, dan guru wilangan: Maskumambang (sedih), Mijil (kelahiran), Sinom (muda), Kinanthi (tuntunan), Asmaradana (cinta), Gambuh, Durma, Pangkur, Megatruh, Pucung (ringan & lucu). Paribasan adalah peribahasa Jawa, misalnya 'becik ketitik ala ketara' (baik buruk akhirnya tampak juga).",
    example: "Tembang Pucung yang pendek dan lucu sering dipakai anak bermain sambil belajar nilai kehidupan.",
    summary: "Hanacaraka 20 aksara. Macapat: dari Maskumambang sampai Pucung, tiap tembang punya watak.",
  },
  {
    id: "kor-dasar", subjects: ["korea"], jenjang: ["SD", "SMP", "SMA"], emoji: "🇰🇷",
    title: "Bahasa Korea: Hangul, Angka & Salam",
    keywords: ["hangul", "angka", "salam", "partikel", "kata tanya", "artinya", "bahasa koreanya"],
    concept: "Hangul ditulis per blok suku kata. Dua sistem angka: Sino-Korea (일 이 삼 사 오 육 칠 팔 구 십) untuk tanggal, uang, menit; asli Korea (하나 둘 셋 넷 다섯) untuk menghitung benda dan umur. Salam sopan: 안녕하세요 halo, 감사합니다 terima kasih. Partikel menandai peran kata: 이/가 subjek, 을/를 objek, 은/는 topik. Kata kerja selalu di akhir kalimat: 저는 밥을 먹어요 (saya nasi makan).",
    example: "Di drama Korea kamu dengar 'gamsahamnida' saat berterima kasih secara formal — itu bentuk paling sopan.",
    summary: "Dua angka: Sino (일 이 삼) & asli (하나 둘 셋). Kata kerja selalu terakhir.",
  },
  {
    id: "jpn-dasar", subjects: ["jepang"], jenjang: ["SD", "SMP", "SMA"], emoji: "🇯🇵",
    title: "Bahasa Jepang: Kana, Kanji & Partikel",
    keywords: ["hiragana", "katakana", "kanji", "partikel", "artinya", "bahasa jepangnya", "masu"],
    concept: "Tiga aksara: Hiragana (kata asli Jepang), Katakana (kata serapan asing), Kanji (karakter Tiongkok). Angka kanji: 一 ichi, 二 ni, 三 san, 四 yon, 五 go, 六 roku, 七 nana, 八 hachi, 九 kyuu, 十 juu. Partikel: は (wa) penanda topik, を (o) objek, に arah/waktu. Bentuk sopan memakai -masu: 食べます (tabemasu, makan). Kanji alam berasal dari gambar: 山 gunung, 川 sungai, 海 laut, 水 air, 雨 hujan, 雪 salju.",
    example: "Nama negara dan makanan asing di menu Jepang ditulis Katakana: コーヒー (koohii = kopi).",
    summary: "Hiragana asli, Katakana serapan, Kanji gambar. は=wa topik, を=o objek.",
  },
  {
    id: "man-dasar", subjects: ["mandarin"], jenjang: ["SD", "SMP", "SMA"], emoji: "🇨🇳",
    title: "Bahasa Mandarin: Nada, Hanzi & Pinyin",
    keywords: ["nada", "hanzi", "pinyin", "kata ukur", "artinya", "bahasa mandarinnya", "partikel"],
    concept: "Mandarin adalah bahasa nada: mā (ibu), má (rami), mǎ (kuda), mà (memarahi) — nada mengubah arti! Angka: 一 yī, 二 èr, 三 sān, 四 sì, 五 wǔ, 六 liù, 七 qī, 八 bā, 九 jiǔ, 十 shí, 百 bǎi. Urutan kalimat SPO sama seperti Indonesia: 我吃饭 (saya makan nasi). Partikel: 的 de (milik), 吗 ma (penanya akhir kalimat), 是 shì (adalah). Kata ukur wajib: 本 běn (buku), 个 gè (umum), 只 zhī (hewan), 条 tiáo (benda panjang).",
    example: "Salah nada bisa lucu: bertanya harga 'mǎ' malah menyebut kuda. Latih nada berpasangan sambil menggambar arahnya di udara.",
    summary: "4 nada mengubah arti. 的=milik, 吗=tanya. Kata ukur: 本 buku, 只 hewan.",
  },
];

/* ================= IPS, PPKn, INFORMATIKA ================= */
const SOSIAL_MODULES: LibraryModule[] = [
  {
    id: "ips-geografi", subjects: ["ips"], jenjang: ALL, kelas: { SD: ["4", "5", "6"] }, emoji: "🗺️",
    title: "Provinsi, Ibu Kota & Geografi Indonesia",
    keywords: ["ibu kota", "provinsi", "ibukota", "terletak di provinsi"],
    concept: "Indonesia punya 38 provinsi. Ibu kota yang sering ditanyakan: Jawa Barat–Bandung, Jawa Tengah–Semarang, Jawa Timur–Surabaya, Sumatera Utara–Medan, Sumatera Barat–Padang, Sumatera Selatan–Palembang, Kalimantan Timur–Samarinda, Sulawesi Selatan–Makassar, Bali–Denpasar, Papua–Jayapura, Aceh–Banda Aceh, Riau–Pekanbaru, Jambi–Jambi, Lampung–Bandar Lampung, Banten–Serang, Yogyakarta–Yogyakarta, Maluku–Ambon, NTT–Kupang, NTB–Mataram, Gorontalo–Gorontalo, Sulawesi Utara–Manado. Ibu kota negara kini Nusantara (IKN) di Kalimantan Timur, menggantikan Jakarta secara bertahap.",
    example: "Peta buta adalah latihan terbaik: tunjuk provinsi tanpa nama, tebak ibu kotanya, lalu cek. Ulangi sampai hafal di luar kepala.",
    summary: "38 provinsi. Pasangan tricky: Maluku–Ambon, Papua–Jayapura, Kaltim–Samarinda.",
  },
  {
    id: "ips-sejarah", subjects: ["ips"], jenjang: ALL, emoji: "🏯",
    title: "Sejarah Indonesia: Kerajaan, Pahlawan & Peristiwa",
    keywords: ["pahlawan", "kerajaan", "peristiwa", "tahun", "perjanjian", "berasal dari", "memimpin", "proklamasi", "perang"],
    concept: "Kerajaan besar: Sriwijaya (maritim, Palembang), Majapahit (Gajah Mada & Sumpah Palapa, pusat di Jawa Timur), Mataram Kuno, Demak (kerajaan Islam pertama di Jawa), Kutai (tertua, prasasti Yupa), Tarumanagara. Pahlawan & daerahnya: Pattimura–Maluku (Ambon), Martha Christina Tiahahu–Maluku (Nusalaut), Diponegoro–Jawa Tengah (Yogyakarta), Cut Nyak Dien–Aceh, Tuanku Imam Bonjol–Sumatera Barat, Kartini–Jawa Tengah (Jepara), Sudirman–Jawa Tengah (Purbalingga), Bung Tomo–Surabaya. Peristiwa: Proklamasi 17 Agustus 1945, Sumpah Pemuda 28 Oktober 1928, Pertempuran Surabaya 10 November 1945.",
    example: "Sumpah Pemuda lahir di Jakarta 1928: satu tanah air, satu bangsa, satu bahasa — Indonesia.",
    summary: "Pattimura–Ambon, Tiahahu–Nusalaut, Diponegoro–Yogyakarta. Proklamasi 17-8-1945.",
  },
  {
    id: "ips-ekonomi", subjects: ["ips"], jenjang: ["SMP", "SMA"], emoji: "🏪",
    title: "Ekonomi Dasar: Pasar, Uang & Kegiatan Ekonomi",
    keywords: ["ekonomi", "pasar", "permintaan", "penawaran", "produksi", "distribusi", "konsumsi", "inflasi", "bank", "ekspor", "impor"],
    concept: "Kegiatan ekonomi: produksi (membuat), distribusi (menyalurkan), konsumsi (memakai). Hukum pasar: harga naik → permintaan turun; barang langka → harga naik. Ekspor menjual ke luar negeri, impor membeli dari luar negeri. Inflasi adalah kenaikan harga umum terus-menerus yang menurunkan nilai uang. Bank menghimpun dan menyalurkan dana; koperasi adalah badan usaha berasas kekeluargaan (Bapak Koperasi: Moh. Hatta).",
    example: "Saat panen raya, harga cabai turun karena penawaran melimpah. Saat paceklik, sebaliknya — itulah hukum pasar bekerja di pasar tradisional dekat rumahmu.",
    summary: "Produksi–distribusi–konsumsi. Langka = mahal. Hatta = Bapak Koperasi.",
  },
  {
    id: "ppkn-pancasila", subjects: ["ppkn"], jenjang: ALL, emoji: "🇮🇩",
    title: "Pancasila, Lambang & Lembaga Negara",
    keywords: ["sila", "pancasila", "lambang", "lembaga", "presiden", "pemilu", "uud", "garuda", "bhinneka"],
    concept: "Pancasila: 1 Ketuhanan Yang Maha Esa (lambang bintang), 2 Kemanusiaan yang Adil dan Beradab (rantai), 3 Persatuan Indonesia (pohon beringin), 4 Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan (kepala banteng), 5 Keadilan Sosial bagi Seluruh Rakyat Indonesia (padi dan kapas). Garuda Pancasila ber semboyan Bhinneka Tunggal Ika (berbeda-beda tetapi tetap satu). Lembaga: Presiden (eksekutif), DPR/MPR (legislatif), MA/MK (yudikatif). Pemilu memilih presiden dan anggota DPR/DPRD. UUD 1945 adalah konstitusi; pembukaannya memuat Pancasila.",
    example: "Gotong royong membersihkan lingkungan adalah sila ke-3 dan ke-5 yang hidup dalam keseharian warga.",
    summary: "Sila 1 bintang, 2 rantai, 3 beringin, 4 banteng, 5 padi-kapas. Bhinneka Tunggal Ika = berbeda tetap satu.",
  },
  {
    id: "tik-tk", subjects: ["informatika"], jenjang: ["TK"], emoji: "🖱️",
    title: "Mengenal Komputer & Aman Bermain Gawai",
    keywords: ["mouse", "keyboard", "monitor", "speaker", "printer", "tablet", "charger", "gawai", "izin", "orang asing", "bermain"],
    concept: "Komputer dan gawai punya bagian-bagian dengan tugasnya: mouse menggerakkan panah (kursor) di layar, keyboard untuk mengetik huruf dan angka, monitor/layar menampilkan gambar dan tulisan, speaker mengeluarkan suara, printer mencetak ke kertas, charger mengisi daya baterai. Aturan aman bermain gawai: selalu minta izin orang tua, jangan bermain terlalu lama agar mata tidak lelah, jangan bicara dengan orang asing di internet, dan beri tahu orang tua bila melihat hal yang aneh.",
    example: "Sebelum meminjam HP ayah untuk belajar, kamu meminta izin dulu dan berjanji bermain 15 menit saja. Setelah selesai, kamu istirahat dan bermain bola di luar — mata dan badanmu tetap sehat!",
    summary: "Mouse = panah layar, keyboard = mengetik, monitor = menampilkan, speaker = suara. Selalu izin orang tua dan batasi waktu layar.",
  },
  {
    id: "tik-smp", subjects: ["informatika"], jenjang: ["SMP"], emoji: "🧮",
    title: "Sistem Operasi, Spreadsheet, Flowchart & Keamanan",
    keywords: ["sistem operasi", "operating system", "=sum", "=average", "spreadsheet", "sel (cell)", "flowchart", "simbol", "algoritma", "2fa", "autentikasi", "worm", "trojan", "ransomware", "spyware", "virus", "phishing", "lan"],
    concept: "Sistem operasi (Windows, Linux, Android) mengatur perangkat keras dan menjalankan aplikasi. Spreadsheet bekerja dengan sel — pertemuan baris (angka) dan kolom (huruf); rumusnya diawali '=': =SUM menjumlahkan, =AVERAGE menghitung rata-rata. Algoritma digambar sebagai flowchart: oval = mulai/selesai, persegi = proses, belah ketupat = keputusan, jajar genjang = input/output. Keamanan digital: kenali virus, worm, trojan, ransomware, spyware, dan phishing; aktifkan autentikasi dua langkah (2FA) agar akun aman.",
    example: "Menghitung total belanjaan di spreadsheet cukup dengan =SUM, dan membuat resep mie instan adalah algoritma yang bisa digambar jadi flowchart!",
    summary: "OS mengatur komputer. =SUM jumlah, =AVERAGE rata-rata. Belah ketupat = keputusan. Aktifkan 2FA.",
  },
  {
    id: "tik-sma", subjects: ["informatika"], jenjang: ["SMA"], emoji: "👨‍💻",
    title: "Pemrograman, Basis Data & Jaringan Lanjut",
    keywords: ["program", "cetak", "panjang(", "perulangan", "sql", "select", "record", "field", "foreign key", "dns", "ipv4", "dekomposisi", "abstraksi", "vpn", "osi", "serangan", "binary search", "primary key", "biner"],
    concept: "Membaca program (tracing) adalah keterampilan inti: jalankan baris demi baris dan catat nilai variabel — perulangan menjumlahkan berulang kali, misalnya total 1..n = n(n+1)/2. Basis data relasional menyimpan data dalam tabel: baris = record, kolom = field; primary key adalah identitas unik tiap baris, foreign key menghubungkan antar tabel, dan perintah SELECT mengambil data. Jaringan lanjut: DNS menerjemahkan nama domain ke alamat IP; IPv4 terdiri dari 4 oktet 0–255; VPN membuat jalur terenkripsi. Berpikir komputasional: dekomposisi (pecah masalah), pengenalan pola, abstraksi (fokus pada yang penting), dan algoritma.",
    example: "Aplikasi ojek online memakai semua ini: basis data menyimpan restoran dan menu (SELECT), DNS menemukan servernya, dan algoritma memilih rute tercepat untuk pengemudi.",
    summary: "Tracing: catat variabel tiap baris. Record = baris, field = kolom. DNS = nama → IP. Dekompilasi masalah besar jadi kecil = dekomposisi.",
  },
  {
    id: "tik-dasar", subjects: ["informatika"], jenjang: ["SD"], emoji: "💻",
    title: "Komputer, Internet & Keamanan Digital",
    keywords: ["komputer", "hardware", "software", "internet", "jaringan", "osi", "biner", "algoritma", "program", "variabel", "phishing", "malware", "cpu", "ram"],
    concept: "Komputer = hardware (perangkat keras: CPU otak pemroses, RAM ingatan jangka pendek, monitor keluaran, keyboard/mouse masukan) + software (sistem operasi seperti Windows/Linux, dan aplikasi). Biner adalah bahasa komputer berbasis 0 dan 1: 1010 = 10, 1111 = 15. Internet menghubungkan jaringan sedunia; model OSI punya 7 lapisan dari fisik sampai aplikasi. Algoritma adalah langkah-langkah logis menyelesaikan masalah; dalam program, variabel menyimpan data dan perulangan (loop) mengulang perintah. Keamanan: phishing adalah penipuan mencuri data lewat pesan/situs palsu, malware adalah perangkat lunak jahat — jangan klik tautan mencurigakan dan jangan bagikan kata sandi.",
    example: "Menyiapkan mie instan adalah algoritma: rebus air → masukkan mie → tunggu 3 menit → tiriskan → beri bumbu. Urutan yang tertukar membuat hasil berantakan — sama seperti program!",
    summary: "CPU otak, RAM ingatan pendek. Biner 1010 = 10. Phishing = penipuan data, jangan klik sembarangan.",
  },
];

/* ================= SEJARAH — garis waktu per jenjang ================= */
const SEJARAH_MODULES: LibraryModule[] = [
  {
    id: "sej-simbol", subjects: ["sejarah"], jenjang: ["TK", "SD"], emoji: "🇮🇩",
    title: "Bendera, Lagu Kebangsaan & Hari Kemerdekaan",
    keywords: ["bendera", "indonesia raya", "kemerdekaan", "garuda", "presiden pertama", "soekarno", "fatmawati", "lambang negara", "ibu kota"],
    concept: "Negara kita, Indonesia, punya simbol-simbol kebanggaan: bendera Merah Putih (merah = berani, putih = suci), lagu kebangsaan Indonesia Raya ciptaan Wage Rudolf Supratman, dan lambang negara Garuda Pancasila. Indonesia merdeka pada 17 Agustus 1945. Presiden pertama kita Ir. Soekarno, wakilnya Moh. Hatta. Bendera pusaka yang dikibarkan saat kemerdekaan dijahit oleh Ibu Fatmawati. Pahlawan adalah orang berani dan baik yang membela negara — kita menghormati mereka setiap Hari Pahlawan, 10 November.",
    example: "Setiap Senin pagi kamu upacara bendera dan menyanyikan Indonesia Raya dengan hormat — itu cara anak Indonesia berterima kasih kepada para pahlawan.",
    summary: "Bendera Merah Putih, lagu Indonesia Raya, merdeka 17 Agustus 1945, presiden pertama Soekarno.",
  },
  {
    id: "sej-kerajaan", subjects: ["sejarah"], jenjang: ["SD", "SMP"], kelas: { SD: ["4", "5", "6"] }, emoji: "👑",
    title: "Kerajaan-Kerajaan Nusantara (Garis Waktu)",
    keywords: ["kerajaan", "sriwijaya", "majapahit", "kutai", "tarumanagara", "mataram kuno", "demak", "singasari", "kediri", "pajajaran", "gajah mada", "yupa", "borobudur"],
    concept: "Ikuti garis waktunya: Kutai (abad ke-4, Kalimantan Timur, prasasti Yupa — kerajaan Hindu tertua) → Tarumanagara (Jawa Barat, prasasti Ciaruteun) → Sriwijaya (abad ke-7, Palembang, kerajaan maritim terbesar penguasa Selat Malaka) → Mataram Kuno (Jawa Tengah, membangun Borobudur) → Kediri & Singasari (Jawa Timur) → Majapahit (1293, Trowulan, dipersatukan Mahapatih Gajah Mada lewat Sumpah Palapa) → Demak (kerajaan Islam pertama di Jawa) → Aceh, Banten, dan Gowa di masa Islam. Cara mengingatnya: pusat + tokoh + peninggalan khasnya.",
    example: "Candi Borobudur yang kamu lihat di buku adalah peninggalan Mataram Kuno dari lebih dari 1.200 tahun lalu — nenek moyang kita sudah membangun mahakarya dunia!",
    summary: "Kutai tertua (Yupa), Sriwijaya maritim (Palembang), Majapahit terbesar (Gajah Mada), Demak Islam pertama di Jawa.",
  },
  {
    id: "sej-pahlawan", subjects: ["sejarah"], jenjang: ["SD", "SMP"], emoji: "🦸",
    title: "Pahlawan Daerah & Nasional",
    keywords: ["pahlawan", "pattimura", "tiahahu", "diponegoro", "cut nyak", "imam bonjol", "kartini", "sudirman", "bung tomo", "berasal dari"],
    concept: "Para pahlawan berjuang dari daerahnya masing-masing: Pattimura dari Maluku (Ambon) melawan Belanda tahun 1817; Martha Christina Tiahahu, pejuang remaja dari Nusalaut, Maluku; Pangeran Diponegoro dari Yogyakarta memimpin Perang Jawa (1825–1830); Cut Nyak Dien dari Aceh; Tuanku Imam Bonjol dari Sumatera Barat (Perang Padri); R.A. Kartini dari Jepara memperjuangkan pendidikan perempuan; Jenderal Sudirman dari Purbalingga memimpin perang gerilya; Bung Tomo membakar semangat Pertempuran Surabaya 10 November 1945.",
    example: "Nama jalan dan sekolah di kotamu banyak yang memakai nama pahlawan — coba cari tahu kisah pahlawan yang namanya jadi nama jalan sekolahmu!",
    summary: "Pattimura–Ambon, Tiahahu–Nusalaut, Diponegoro–Yogyakarta, Kartini–Jepara, Sudirman–Purbalingga.",
  },
  {
    id: "sej-penjajahan", subjects: ["sejarah"], jenjang: ["SMP", "SMA"], emoji: "⛵",
    title: "Kedatangan Bangsa Eropa & Masa Penjajahan",
    keywords: ["voc", "portugis", "houtman", "daendels", "raffles", "van den bosch", "tanam paksa", "malaka", "kerja paksa", "monopoli"],
    concept: "Garis waktunya: 1511 Portugis merebut Malaka → 1596 Belanda pertama tiba di Banten (Cornelis de Houtman) → 1602 VOC berdiri dan memonopoli rempah → 1808–1811 Daendels membangun Jalan Raya Anyer–Panarukan dengan kerja paksa → 1811–1816 Inggris memerintah lewat Raffles (menulis History of Java) → 1830 Van den Bosch menerapkan Tanam Paksa yang menyengsarakan rakyat → awal 1900-an muncul Politik Etis. Perlawanan rakyat terjadi di mana-mana: Diponegoro, Pattimura, Imam Bonjol, Cut Nyak Dien.",
    example: "Jalan raya dari Anyer sampai Panarukan yang masih dipakai sampai sekarang dibangun pada masa Daendels — sejarah bisa kamu lewati dengan kendaraan!",
    summary: "1511 Portugis, 1602 VOC, Daendels jalan raya pos, Raffles Inggris, 1830 Tanam Paksa.",
  },
  {
    id: "sej-pergerakan-proklamasi", subjects: ["sejarah"], jenjang: ["SMP", "SMA"], emoji: "✊",
    title: "Pergerakan Nasional, Sumpah Pemuda & Proklamasi",
    keywords: ["budi utomo", "sarekat islam", "wahidin", "tjokroaminoto", "sumpah pemuda", "kongres pemuda", "bpupki", "ppki", "proklamasi", "rengasdengklok", "kalijati", "jepang menduduki", "bandung lautan api", "puputan", "serangan umum", "konferensi meja bundar", "agresi"],
    concept: "Garis waktunya: 1908 Budi Utomo (gagasan dr. Wahidin, ketua dr. Sutomo) membuka Kebangkitan Nasional → 1912 Sarekat Islam dipimpin HOS Tjokroaminoto → 28 Oktober 1928 Sumpah Pemuda: satu tanah air, bangsa, bahasa → 1942 Jepang menduduki Indonesia (Belanda menyerah di Kalijati) → 1945 BPUPKI merumuskan dasar negara → 15 Agustus 1945 Jepang menyerah → 16 Agustus Rengasdengklok → 17 Agustus Proklamasi dibacakan Soekarno–Hatta → 18 Agustus UUD 1945 disahkan PPKI. Kemerdekaan dipertahankan lewat Pertempuran Surabaya, Bandung Lautan Api, Puputan Margarana, dan Serangan Umum 1 Maret 1949, sampai Belanda mengakui kedaulatan lewat Konferensi Meja Bundar 1949.",
    example: "Sumpah Pemuda diikrarkan anak-anak muda seusiamu kakak kelas — bukti pemuda bisa mengubah sejarah bangsa.",
    summary: "1908 Budi Utomo → 1928 Sumpah Pemuda → 1942 Jepang → 17 Agustus 1945 Proklamasi → 1949 pengakuan kedaulatan.",
  },
  {
    id: "sej-modern", subjects: ["sejarah"], jenjang: ["SMA"], emoji: "🏙️",
    title: "Indonesia Modern: Orde Lama, Orde Baru, Reformasi",
    keywords: ["demokrasi terpimpin", "dekrit", "g30s", "supersemar", "orde baru", "repelita", "reformasi", "habibie", "pemilu pertama", "krisis"],
    concept: "Garis waktu Indonesia modern: 1955 Pemilu pertama → 5 Juli 1959 Dekrit Presiden (kembali ke UUD 1945) membuka Demokrasi Terpimpin → 1965 Peristiwa G30S menewaskan enam jenderal dan satu perwira TNI AD → 11 Maret 1966 Supersemar menjadi dasar peralihan kekuasaan → Orde Baru (1966–1998) berfokus pembangunan lewat Repelita → 1997 krisis moneter Asia → 21 Mei 1998 Soeharto berhenti, B.J. Habibie menjadi presiden, era Reformasi dimulai → 1999 Pemilu demokratis → 1999–2002 UUD 1945 diamandemen empat kali. Pelajari masa ini secara faktual: siapa, kapan, dan apa keputusan pentingnya.",
    example: "Kakek-nenekmu hidup melewati tiga zaman berbeda — tanyakan cerita mereka; sejarah keluarga adalah pintu masuk sejarah bangsa.",
    summary: "1959 Dekrit → 1965 G30S → 1966 Supersemar → Orde Baru & Repelita → 1998 Reformasi → 1999 Pemilu demokratis.",
  },
  {
    id: "sej-dunia", subjects: ["sejarah"], jenjang: ["SMP", "SMA"], emoji: "🌍",
    title: "Sejarah Dunia: Peradaban, Perang Dunia & Perang Dingin",
    keywords: ["perang dunia", "pearl harbor", "hiroshima", "nagasaki", "perang dingin", "nato", "pakta warsawa", "mesopotamia", "revolusi industri", "revolusi prancis", "kemerdekaan amerika", "konstantinopel", "gagarin", "bulan", "tembok berlin", "uni soviet", "franz ferdinand", "polandia"],
    concept: "Peradaban awal lahir di sungai besar: Mesopotamia di antara Tigris–Eufrat, Mesir di Sungai Nil. 1453 Konstantinopel jatuh ke Turki Utsmani. 1776 Kemerdekaan Amerika Serikat; 1789 Revolusi Prancis; abad ke-18 Revolusi Industri mulai di Inggris (mesin uap James Watt). 1914–1918 Perang Dunia I (dipicu pembunuhan Franz Ferdinand di Sarajevo). 1939–1945 Perang Dunia II: invasi Jerman ke Polandia, Pearl Harbor 1941, bom atom Hiroshima–Nagasaki Agustus 1945, Jepang menyerah — yang berdampak langsung pada Proklamasi Indonesia. Setelahnya Perang Dingin AS vs Uni Soviet (NATO 1949 vs Pakta Warsawa 1955) berakhir dengan runtuhnya Tembok Berlin 1989 dan bubarnya Uni Soviet 1991. Manusia mencapai luar angkasa: Gagarin 1961, pendaratan Bulan 1969.",
    example: "Sejarah dunia dan Indonesia saling terhubung: tanpa menyerahnya Jepang pada 15 Agustus 1945, momentum Proklamasi 17 Agustus mungkin berbeda.",
    summary: "PD I 1914–1918, PD II 1939–1945, Perang Dingin berakhir 1991. Mesopotamia: Tigris–Eufrat.",
  },
];

/* ================= PAKET KOMPETISI (Nalaria, Kanguru Matematika, Kanguru Bahasa) ================= */
const KOMPETISI_MODULES: LibraryModule[] = [
  {
    id: "komp-nalaria", subjects: ["nalaria"], jenjang: ALL, emoji: "🏆",
    title: "Matematika Nalaria: Berpikir dari Cerita (Paket Kompetisi)",
    keywords: ["membeli", "kembalian", "dibagikan rata", "sisa", "kecepatan", "jarak", "rata-rata nilai", "suka matematika", "suka keduanya", "tidak suka keduanya", "dicampur", "pekerja", "tabungan", "kebun", "resep", "loyang"],
    concept: "Soal Nalaria (gaya KMNR) tidak menanyakan rumus secara langsung — ia menyembunyikan matematika di dalam cerita sehari-hari: belanja & kembalian, berbagi dengan sisa, jarak–waktu–kecepatan, perbandingan, pola, dan logika himpunan. Kuncinya: (1) lingkari yang DIKETAHUI, (2) garis bawahi yang DITANYAKAN, (3) gambar atau tulis ulang cerita dengan angka sederhana, (4) baru hitung. Jebakan khasnya: sisa pembagian yang lebih besar dari pembagi (tidak mungkin!), orang yang dihitung dua kali pada soal himpunan (yang suka keduanya), dan rata-rata yang harus dikembalikan ke jumlah total dulu (rata-rata × banyak anak). Untuk TK, soal dibacakan sebagai cerita lisan pendek dengan gambar emoji — hitung bendanya satu-satu dengan jari.",
    example: "27 permen untuk 4 anak: jangan langsung membagi di kepala. Tulis 4 × 6 = 24, sisa 27 − 24 = 3. Jawaban lengkapnya '6 permen, sisa 3' — soal nalaria hampir selalu menanyakan sisa juga!",
    summary: "Diketahui → ditanyakan → gambar/tulis → hitung. Waspadai sisa pembagian, hitung-ganda himpunan, dan rata-rata (kembalikan ke total).",
  },
  {
    id: "komp-kanguru-math", subjects: ["kanguru-matematika"], jenjang: ALL, emoji: "🦘",
    title: "Kanguru Matematika: Teka-Teki Logika yang Seru (Paket Kompetisi)",
    keywords: ["antrean", "urutan ke-", "dilipat", "lubang", "lapisan", "menghadap", "berputar", "roda", "kaki", "pola", "bayangan", "kubus kecil", "bercat", "umur"],
    concept: "Soal Kanguru Matematika (gaya IKMC) adalah teka-teki: pola gambar & angka, antrean dan tempat duduk, teka-teki umur, arah & putaran, lipat & gunting kertas, dan menghitung benda dari petunjuk (roda, kaki). Strategi juaranya adalah MENCOBA DENGAN GAMBAR: gambar antreannya, gambar lipatannya, tulis urutan kompasnya (Utara–Timur–Selatan–Barat). Rumus antrean yang wajib hafal: jumlah orang = urutan dari depan + urutan dari belakang − 1 (orangnya terhitung dua kali). Lipatan kertas: tiap lipatan menggandakan lapisan (1 lipat = 2, 2 lipat = 4, 3 lipat = 8), jadi lubang ikut berlipat ganda saat kertas dibuka. Untuk jenjang kecil, soalnya visual berbasis emoji: hitung gambarnya, cari yang berbeda, ikuti polanya.",
    example: "Rian ke-4 dari depan dan ke-3 dari belakang. Gambar: ●●●R●● — totalnya 4 + 3 − 1 = 6 anak. Tanpa gambar, jebakan '7' sangat menggoda!",
    summary: "Gambar dulu, hitung kemudian. Antrean: depan + belakang − 1. Lipatan: lapisan berlipat dua tiap lipatan.",
  },
  {
    id: "komp-kanguru-bahasa", subjects: ["kanguru-bahasa"], jenjang: ALL, emoji: "📚",
    title: "Kanguru Bahasa: Teka-Teki Kata & Logika Bahasa (Paket Kompetisi)",
    keywords: ["urutan abjad", "suku kata", "tersembunyi", "petunjuknya", "rumpang", "logis", "pola huruf", "huruf pertama", "english", "artinya", "lawan kata", "persamaan kata"],
    concept: "Soal Kanguru Bahasa (gaya IKLC) bermain dengan bahasa itu sendiri: urutan abjad (bandingkan huruf pertama, lalu huruf kedua bila sama), suku kata (tepuk tangan tiap potongan bunyi: se-ko-lah = 3), kata tersembunyi (gabungkan huruf yang tampak dengan petunjuk maknanya), pola huruf kata (huruf yang sama = huruf pola yang sama: susu = ABAB), serta kalimat rumpang yang harus LOGIS bila dibaca utuh — pilihan yang terdengar lucu hampir selalu salah. Makna & lawan kata selalu diuji DALAM konteks kalimat, jadi baca kalimat lengkapnya sebelum memilih. Untuk jenjang kecil ada pengantar Bahasa Inggris sederhana (cat = kucing, sun = matahari) dan teka-teki huruf pertama.",
    example: "Urut abjad 'buku, apel, ceri': lihat huruf awalnya saja — a (apel) < b (buku) < c (ceri). Bila huruf pertama sama, misalnya 'buku' dan 'bola', bandingkan huruf kedua: o < u, jadi bola dulu baru buku.",
    summary: "Abjad: bandingkan huruf demi huruf. Suku kata: tepuk tiap bunyi. Rumpang: baca utuh, pilih yang paling logis.",
  },
  {
    id: "komp-seamo", subjects: ["seamo"], jenjang: ALL, emoji: "🌏",
    title: "Matematika SEAMO Style: Penalaran Logis & Pola (Paket Kompetisi)",
    keywords: ["pola gambar", "pola bilangan", "berikutnya adalah", "paling besar", "paling kecil", "berbeda sendiri", "kelipatan", "ganjil", "prima", "read in english", "how many", "shared equally", "dua kali"],
    concept: "Paket ini adalah latihan ORIGINAL buatan ZIQVA OLIM bergaya SEAMO (Southeast Asian Mathematical Olympiad) — bukan soal resmi SEAMO dan bukan salinan soal lomba mana pun. Ciri khas gayanya: penalaran logis dan berpikir kritis. Jenis soalnya: (1) POLA VISUAL & GAMBAR — lanjutkan pola emoji yang berulang (A-A-B atau A-B-A-B); (2) POLA BILANGAN BERJENJANG — selisihnya sendiri berpola (berlipat dua, atau bilangan kuadrat 1, 4, 9, 16, …); (3) LOGIKA PERBANDINGAN — urutkan data dulu sebelum menyimpulkan siapa paling besar/kecil; (4) BILANGAN YANG BERBEDA SENDIRI — cari satu bilangan yang melanggar aturan kelompoknya (bukan kelipatan, satu-satunya ganjil, bukan prima); (5) SOAL CERITA BAHASA INGGRIS SEDERHANA di jenjang SMP–SMA — kata kuncinya: 'shared equally' = dibagi rata, 'gave' = memberi (berkurang), 'left' = sisa. Strategi juara: jangan menebak dari kesan pertama — tulis selisih polanya, urutkan datanya, dan terjemahkan kata kunci Inggrisnya dulu.",
    example: "Pola 5, 9, 17, 33, … Selisihnya +4, +8, +16 — selalu dua kali lipat! Berikutnya +32 → 65. Peserta yang hanya menebak '+8 terus' akan terjebak.",
    summary: "Tulis selisih pola, urutkan data sebelum menyimpulkan, terjemahkan kata kunci Inggris. Latihan original bergaya SEAMO — bukan soal resmi.",
    worked: "Contoh soal yang dibahas: Read in English: 36 stickers are shared equally among 4 students. Each student gets … Langkah 1: terjemahkan kata kuncinya — 'shared equally' artinya dibagi rata. Langkah 2: pembagian rata = 36 : 4. Langkah 3: 36 : 4 = 9. Jadi tiap siswa mendapat 9 stiker. ✅",
    vocab: "🧩 pola = aturan yang berulang pada gambar/bilangan\n➗ shared equally = dibagi rata (Bahasa Inggris)\n🎁 gave = memberi (jumlah berkurang)\n🔢 kelipatan = bilangan hasil perkalian (kelipatan 3: 3, 6, 9, 12, …)\n⭐ bilangan prima = hanya bisa dibagi 1 dan dirinya sendiri (2, 3, 5, 7, 11, …)\n📊 menyimpulkan = mengambil keputusan dari data, bukan tebakan",
    fact: "Tahukah kamu? SEAMO adalah olimpiade matematika tingkat Asia Tenggara. Peserta terbaiknya berlatih dengan cara yang sama seperti di modul ini: menulis pola dan alasan, bukan menghafal jawaban! 🌏",
  },
  {
    id: "komp-sasmo", subjects: ["sasmo"], jenjang: ALL, emoji: "🧮",
    title: "Matematika SASMO Style: Masalah Praktis & Trik Hitung Cerdas (Paket Kompetisi)",
    keywords: ["trik hitung cerdas", "pasangan gauss", "berjabat tangan", "harga per", "lebih murah", "kegiatan mulai", "kelompok berisi", "cicilan", "uang muka", "dibagi rata", "membeli"],
    concept: "Paket ini adalah latihan ORIGINAL buatan ZIQVA OLIM bergaya SASMO (Singapore and Asian Schools Math Olympiad) — bukan soal resmi SASMO dan bukan salinan soal lomba mana pun. Ciri khas gayanya: pemecahan masalah PRAKTIS sehari-hari dan TRIK HITUNG CERDAS. Bekal pentingnya: (1) TRIK GAUSS — jumlah 1 sampai n = n(n+1)/2, dengan memasangkan ujung-ujungnya (1+n, 2+(n−1), …); (2) JABAT TANGAN / PASANGAN — banyak pasangan dari n orang = n(n−1)/2, dibagi 2 karena tiap pasangan terhitung dua kali; (3) HARGA SATUAN — untuk membandingkan harga, selalu bagi sampai harga per satu benda; (4) JADWAL & WAKTU — jumlahkan semua menit kegiatan + istirahat, baru tambahkan ke jam mulai; (5) PENGELOMPOKAN & SISA — hasil bagi adalah kelompok penuh, sisa tidak pernah mencapai besar kelompok; (6) CICILAN — kurangi uang muka dulu, baru bagi rata sisanya. Untuk TK, soalnya cerita praktis sangat sederhana: berbagi rata, menggabungkan benda, dan pasangan angka 10.",
    example: "1 + 2 + … + 40 tanpa menghitung satu-satu: pasangkan 1+40 = 41, 2+39 = 41, ada 20 pasang → 20 × 41 = 820. Cepat dan elegan!",
    summary: "Gauss: n(n+1)/2. Pasangan: n(n−1)/2. Bandingkan harga satuan. Jadwal: jumlahkan semua menit. Latihan original bergaya SASMO — bukan soal resmi.",
    worked: "Contoh soal yang dibahas: Pak berisi 4 pensil harganya Rp8.000; toko sebelah menjual 1 pensil Rp2.500. Mana yang lebih murah? Langkah 1: hitung harga satuan pak: 8.000 : 4 = Rp2.000 per pensil. Langkah 2: bandingkan dengan harga satuan toko sebelah: Rp2.500. Langkah 3: Rp2.000 < Rp2.500, jadi pak isi 4 lebih murah per pensilnya. ✅",
    vocab: "⚡ trik Gauss = menjumlah 1..n dengan memasangkan ujung-ujungnya\n🤝 pasangan = dua orang/benda yang digabungkan (jabat tangan, pertandingan)\n🏷️ harga satuan = harga untuk tepat satu benda\n🕐 durasi = lama waktu suatu kegiatan\n💳 cicilan = pembayaran bertahap; uang muka dibayar di awal\n👥 kelompok penuh = kelompok yang anggotanya lengkap sesuai aturan",
    fact: "Tahukah kamu? Konon Gauss kecil (usia ±9 tahun) mengejutkan gurunya dengan menjumlah 1 sampai 100 dalam hitungan detik memakai trik pasangan — hasilnya 5.050. Trik itu masih dipakai peserta olimpiade sampai sekarang! ⚡",
  },
  {
    id: "komp-amo", subjects: ["amo"], jenjang: ALL, emoji: "🗽",
    title: "Matematika AMO Style: Cerita Amerika & Satuan Khas (Paket Kompetisi)",
    keywords: ["dozen", "lusin", "feet", "inches", "yard", "mil", "fahrenheit", "celsius", "gallon", "quarts", "road trip", "kembalian", "bekerja", "bus sekolah"],
    concept: "Paket ini adalah latihan ORIGINAL buatan ZIQVA OLIM bergaya AMO (American Mathematics Olympiad) — bukan soal resmi AMO dan bukan salinan soal lomba mana pun. Ciri khas gayanya: soal cerita dengan konteks dan satuan khas Amerika, dikerjakan dengan penalaran BERTAHAP (satu langkah logis demi satu langkah). Satuan yang wajib dikenal: 1 dozen (lusin) = 12 benda; panjang: 1 foot = 12 inches, 1 yard = 3 feet, 1 mil (mile) ≈ 1,6 km; isi: 1 gallon = 4 quarts; uang: dolar ($) dengan 1 dolar = 100 cents — hitung sampai dua angka desimal; suhu: Amerika memakai Fahrenheit, dengan rumus C = (F − 32) × 5/9, air membeku pada 32°F = 0°C dan mendidih pada 212°F = 100°C. Strategi bertahapnya: tulis Langkah 1 (yang diketahui dan hitungan pertama), Langkah 2 (memakai hasil langkah 1), dan periksa apakah satuan jawabanmu sudah sesuai yang ditanyakan (inches? km? dolar?). Untuk TK–SD, konteksnya sederhana: dozen telur, koin dolar, bus sekolah, dan road trip keluarga.",
    example: "Road trip: 4 jam per hari pada 50 mil/jam selama 3 hari. Langkah 1: per hari 4 × 50 = 200 mil. Langkah 2: 200 × 3 = 600 mil. Dua langkah pendek mengalahkan satu lompatan menebak!",
    summary: "Dozen = 12. 1 foot = 12 inches, 1 yard = 3 feet, 1 mil ≈ 1,6 km. 1 gallon = 4 quarts. C = (F−32)×5/9. Kerjakan bertahap. Latihan original bergaya AMO — bukan soal resmi.",
    worked: "Contoh soal yang dibahas: Liam bekerja 5 jam dengan upah $9 per jam, lalu membeli topi $17. Sisa uangnya? Langkah 1: upah total = 5 × $9 = $45. Langkah 2: sisa = $45 − $17 = $28. Langkah 3: periksa — sisa tidak mungkin lebih besar dari upah total. Jawabannya $28. ✅",
    vocab: "🥚 dozen = lusin = 12 benda\n📏 inch / foot / yard / mile = satuan panjang Amerika (naik bertingkat)\n🛢️ gallon & quart = satuan isi Amerika (1 gallon = 4 quarts)\n💵 dollar & cent = mata uang Amerika (1 dolar = 100 cents)\n🌡️ Fahrenheit = skala suhu Amerika; Celsius yang dipakai Indonesia\n🚗 road trip = perjalanan darat jauh khas Amerika",
    fact: "Tahukah kamu? Amerika adalah salah satu dari sedikit negara yang masih memakai mil, feet, dan Fahrenheit dalam kehidupan sehari-hari — padahal hampir seluruh dunia memakai kilometer, meter, dan Celsius. Itulah sebabnya soal bergaya Amerika selalu melatih konversi satuan! 🗽",
  },
  {
    id: "komp-jso", subjects: ["jso"], jenjang: ALL, emoji: "🔬",
    title: "Sains JSO Style: Eksperimen, Pengamatan & Penalaran Ilmiah (Paket Kompetisi)",
    keywords: ["mengapung", "tenggelam", "variabel", "percobaan", "pengamatan", "suhu", "pertumbuhan", "magnet", "bayangan", "hipotesis", "kontrol", "kesimpulan", "mencair", "tanaman"],
    concept: "Paket ini adalah latihan ORIGINAL buatan ZIQVA OLIM bergaya JSO (Junior Science Olympiad) — bukan soal resmi JSO dan bukan salinan soal lomba mana pun. Ciri khas gayanya: sains lewat EKSPERIMEN SEDERHANA, PENGAMATAN, dan PENALARAN ILMIAH untuk penalar muda. Cara berpikir ilmuwannya: (1) TEBAK dulu (hipotesis) — pernyataan yang bisa diuji dan diukur; (2) UJI dengan percobaan yang ADIL (fair test): hanya SATU hal yang dibedakan (variabel bebas), semua hal lain dibuat sama (variabel kontrol), dan selalu ada kelompok kontrol sebagai pembanding; (3) AMATI & CATAT data dalam tabel — pertumbuhan adalah selisih dua pengukuran, hari terpanas dibaca dari data tertinggi; (4) SIMPULKAN hanya dari bukti — kesimpulan tidak boleh melebihi data percobaan. Topik favoritnya: mengapung–tenggelam, kebutuhan tanaman, magnet, bayangan & cahaya, perubahan wujud, dan perubahan fisika vs kimia. Untuk TK–SD, soalnya sangat dasar dan bergambar emoji: tebak benda yang mengapung, kebutuhan tanaman, dan membaca pengamatan sederhana.",
    example: "Dua kecambah: satu di tempat terang tumbuh 9 cm, satu di tempat gelap tumbuh 3 cm, dengan air dan tanah yang sama. Karena hanya cahaya yang berbeda, kesimpulan yang sah adalah: cahaya membantu kecambah tumbuh lebih cepat — pada percobaan ini.",
    summary: "Tebak → uji secara adil (satu variabel beda) → catat data → simpulkan dari bukti. Latihan original bergaya JSO — bukan soal resmi.",
    worked: "Contoh soal yang dibahas: kecambah hari ke-1 tinggi 3 cm, hari ke-2 tinggi 7 cm. Berapa pertumbuhannya? Langkah 1: pertumbuhan bukan tinggi akhir, melainkan SELISIH dua pengukuran. Langkah 2: 7 − 3 = 4. Langkah 3: jadi kecambah bertumbuh 4 cm dalam sehari. ✅",
    vocab: "🔬 eksperimen = percobaan terencana untuk menguji dugaan\n💡 hipotesis = dugaan yang bisa diuji dan diukur\n🎛️ variabel bebas = satu hal yang sengaja dibedakan\n🔒 variabel kontrol = hal-hal yang sengaja dibuat sama\n⚖️ kelompok kontrol = kelompok tanpa perlakuan, sebagai pembanding\n📋 data = catatan hasil pengamatan yang diukur",
    fact: "Tahukah kamu? Ilmuwan sungguhan menulis SEMUA hasil pengamatannya, termasuk yang tidak sesuai dugaan — data yang 'gagal' pun berharga, karena dari situlah pertanyaan baru lahir! 🔬",
    reading: {
      title: "Percobaan Kecambah Sinta",
      text: "Sinta ingin tahu apakah cahaya membuat kecambah tumbuh lebih cepat. Ia menanam dua kecambah kacang hijau yang sama besar di dua pot yang sama, dengan tanah dan air yang sama banyak. Pot pertama ditaruh di dekat jendela yang terang, pot kedua di dalam lemari yang gelap. Setelah satu minggu, kecambah di dekat jendela tingginya 9 cm dan daunnya hijau. Kecambah di lemari tingginya 12 cm, tetapi batangnya pucat dan lemah karena meregang mencari cahaya. Sinta mencatat semuanya di buku pengamatannya.",
      qa: [
        { q: "Apa satu-satunya hal yang dibedakan Sinta dalam percobaannya?", a: "Cahaya: satu pot di dekat jendela yang terang, satu pot di lemari yang gelap. Tanah, air, pot, dan jenis kecambah dibuat sama." },
        { q: "Kecambah mana yang lebih tinggi setelah satu minggu?", a: "Kecambah di lemari yang gelap (12 cm) — ia meregang mencari cahaya." },
        { q: "Mengapa tinggi saja belum cukup untuk menyimpulkan kecambah gelap lebih sehat?", a: "Karena kecambah gelap batangnya pucat dan lemah; kesimpulan ilmiah harus memakai semua data pengamatan, bukan satu angka saja." },
      ],
    },
  },
];

/* ================= MODUL TK BARU — audit kesesuaian jenjang =================
   Modul-modul di bawah ini ditulis khusus untuk anak usia 4–6 tahun:
   pengantar Bahasa Indonesia, kalimat pendek, banyak emoji, konsep paling
   dasar. Modul lama yang isinya setara anak besar (mis. "English
   Vocabulary & Opposites" dengan ancient–modern & ninety-nine) TIDAK lagi
   tampil untuk TK — jenjangnya dibatasi SD ke atas. */
const TK_MODULES: LibraryModule[] = [
  {
    id: "ing-tk-dasar", subjects: ["inggris"], jenjang: ["TK"], emoji: "🌈",
    title: "Bahasa Inggris Seru: Warna, Hewan, Angka & Sapaan",
    keywords: ["red", "blue", "color", "warna", "cat", "dog", "hewan", "animal", "one", "two", "angka", "number", "hello", "good morning", "mata", "eye", "tangan", "hand", "body", "tubuh", "bird", "fish", "apple"],
    concept: "Halo, Teman Kecil! Ayo belajar Bahasa Inggris yang seru. 🎨 WARNA: red = merah 🔴, blue = biru 🔵, yellow = kuning 🟡, green = hijau 🟢, black = hitam ⚫, white = putih ⚪. 🐶 HEWAN: cat = kucing 🐱, dog = anjing 🐶, bird = burung 🐦, fish = ikan 🐟, duck = bebek 🦆, cow = sapi 🐮. 🔢 ANGKA 1–10: one 1, two 2, three 3, four 4, five 5, six 6, seven 7, eight 8, nine 9, ten 10. 👋 SAPAAN: hello = halo, good morning = selamat pagi, thank you = terima kasih, bye-bye = dadah! 🖐️ TUBUHKU: eye = mata 👀, nose = hidung 👃, hand = tangan ✋, head = kepala, mouth = mulut 👄. Ucapkan keras-keras sambil menunjuk bendanya, ya!",
    example: "Pagi hari kamu menyapa guru: \"Good morning, Miss!\" Lalu saat melihat kucing oranye di halaman, kamu berlatih: \"Look, a cat!\" — belajar Inggris itu seperti bermain kata setiap hari. 🐱",
    summary: "Red merah, blue biru, cat kucing, dog anjing, one-two-three = 1-2-3, hello = halo. Berani mengucapkan = berani pintar!",
    worked: "Contoh soal: Bahasa Inggris dari 'burung' adalah … Langkah 1: ingat kelompok hewan — bird itu yang bisa terbang dan berkicau. 🐦 Langkah 2: cat = kucing, dog = anjing, fish = ikan — semuanya bukan burung. Langkah 3: jadi jawabannya bird! Coba lagi: 'ikan' = fish. 🐟",
    vocab: "🔴 red = merah\n🔵 blue = biru\n🟡 yellow = kuning\n🟢 green = hijau\n🐱 cat = kucing\n🐶 dog = anjing\n🐦 bird = burung\n🐟 fish = ikan\n🍎 apple = apel\n👋 hello = halo",
    fact: "Tahukah kamu? Anak kecil bisa belajar bahasa baru jauh lebih cepat daripada orang dewasa, karena otak anak seperti spons yang menyerap bunyi. Makanya bernyanyi lagu Inggris sambil menari itu cara belajar yang hebat! 🎵",
    reading: {
      title: "Bacaan Kecil: My Cat Momo",
      text: "This is Momo. Momo is a cat. Momo is white. Momo likes fish. Momo says: meow! (Ini Momo. Momo adalah kucing. Momo berwarna putih. Momo suka ikan. Momo berkata: meong!)",
      qa: [
        { q: "Momo itu hewan apa?", a: "Kucing (cat). 🐱" },
        { q: "Apa warna Momo?", a: "Putih (white). ⚪" },
        { q: "Momo suka makan apa?", a: "Ikan (fish). 🐟" },
      ],
    },
  },
  {
    id: "mat-tk-hitung", subjects: ["matematika", "cambridge-math"], jenjang: ["TK"], emoji: "🔢",
    title: "Berhitung Seru 1–20 & Bentuk di Sekitarku",
    keywords: ["berapa banyak", "hitung", "setelah angka", "sebelum angka", "lebih banyak", "lebih sedikit", "sama banyak", "bentuk", "lingkaran", "segitiga", "persegi", "pola"],
    concept: "Ayo berhitung sambil menunjuk benda satu-satu: 1 ☝️, 2, 3, 4, 5, 6, 7, 8, 9, 10, lalu 11 sampai 20! Sentuh bendanya supaya tidak terlewat atau terhitung dua kali. Mana yang LEBIH BANYAK? Bandingkan dengan memasangkan satu-satu: yang masih punya sisa berarti lebih banyak. 🟰 SAMA BANYAK artinya jumlahnya pas berpasangan. Bentuk di sekitar kita: lingkaran ⭕ seperti roda dan piring, segitiga 🔺 seperti atap rumah, persegi ⬛ seperti ubin lantai. Pola seru: 🔴🔵🔴🔵 … sesudah biru pasti merah lagi!",
    example: "Di meja ada 4 sendok dan 6 garpu. Pasangkan satu sendok dengan satu garpu: garpu masih sisa 2, jadi garpu LEBIH BANYAK daripada sendok. Kamu baru saja membandingkan bilangan tanpa menghitung keras-keras! 🍴",
    summary: "Hitung sambil menunjuk satu-satu. Lebih banyak = ada sisa saat dipasangkan. Lingkaran, segitiga, persegi ada di mana-mana!",
    worked: "Contoh soal: Ada 🍓🍓🍓🍓🍓 stroberi. Berapa banyak stroberi? Langkah 1: tunjuk satu-satu sambil berhitung: satu, dua, tiga, empat, lima. Langkah 2: stroberi terakhir yang ditunjuk adalah yang kelima. Langkah 3: jadi ada 5 stroberi. 🍓",
    vocab: "🔢 berhitung = menyebut angka sambil menunjuk benda\n➕ tambah = menjadi lebih banyak\n➖ kurang = menjadi lebih sedikit\n🟰 sama banyak = jumlahnya pas\n⭕ lingkaran = bentuk bulat tanpa sudut\n🔺 segitiga = bentuk bersudut tiga",
    fact: "Tahukah kamu? Jari tanganmu ada 10 — itu sebabnya manusia berhitung memakai dasar sepuluh! Dulu, orang menghitung dengan jari, kerikil, dan ruas bambu. 🖐️",
  },
  {
    id: "islam-tk-ceria", subjects: ISLAM_SUBJECTS, jenjang: ["TK"], emoji: "🌟",
    title: "Islam Ceria: Allah, Doa & Anak Saleh",
    keywords: ["allah", "doa", "bismillah", "alhamdulillah", "rukun islam", "syahadat", "salat", "nabi muhammad", "malaikat", "al-fatihah", "surah pendek", "wudu"],
    concept: "Allah adalah Tuhan kita yang menciptakan langit, bumi, dan semua makhluk. Nabi kita adalah Nabi Muhammad ﷺ. Umat Islam punya 5 Rukun Islam: syahadat, salat, zakat, puasa, dan haji. Sebelum makan dan belajar, kita ucapkan BISMILLAH. Sesudah makan dan menerima hadiah, kita ucapkan ALHAMDULILLAH. 🤲 Doa anak saleh: sebelum makan, sebelum tidur, dan doa untuk ibu bapak: \"Ya Allah, sayangilah ibu bapakku seperti mereka menyayangiku waktu kecil.\" Malaikat Jibril menyampaikan wahyu Allah kepada Nabi Muhammad. Surah pertama yang kita hafal: Al-Fatihah, dibaca di setiap salat.",
    example: "Sebelum makan bekal di sekolah, kamu berdoa dan mengucap bismillah dengan suara pelan. Sesudah kenyang, kamu bilang alhamdulillah. Temanmu yang mendengar jadi ikut meniru — anak saleh menular kebaikannya! 🍱",
    summary: "Bismillah sebelum memulai, alhamdulillah sesudah selesai. Rukun Islam ada 5. Allah sayang anak yang rajin berdoa.",
    worked: "Contoh soal: Sebelum makan, kita mengucapkan … Langkah 1: ingat aturan anak saleh — memulai kebaikan dengan nama Allah. Langkah 2: ucapan sesudah selesai adalah alhamdulillah, jadi bukan itu. Langkah 3: jawaban yang tepat adalah BISMILLAH. 🤲",
    vocab: "🤲 doa = berbicara dan meminta kepada Allah\n📿 bismillah = dengan nama Allah (diucapkan saat memulai)\n🌙 salat = ibadah menghadap Allah 5 kali sehari\n⭐ syahadat = kalimat persaksian seorang muslim\n👼 malaikat = makhluk Allah yang selalu taat",
    fact: "Tahukah kamu? Surah Al-Fatihah hanya 7 ayat, tetapi dibaca berulang-ulang setiap hari oleh muslim di seluruh dunia — lebih dari seribu tahun lamanya! 📖",
  },
  {
    id: "kristen-tk-cerita", subjects: ["kristen"], jenjang: ["TK"], emoji: "🌈",
    title: "Cerita Alkitab Anak: Tuhan Sayang Aku",
    keywords: ["yesus", "nuh", "daud", "adam", "penciptaan", "bahtera", "natal", "kelahiran", "doa", "allah", "goliat", "yunus", "daniel"],
    concept: "Tuhan menciptakan langit, bumi, hewan, dan manusia — semuanya baik! 🌍 Cerita seru Alkitab untuk anak: Nuh membuat bahtera besar dan menyelamatkan hewan berpasang-pasangan dari air bah 🦒🦒; Daud yang kecil berani menghadapi raksasa Goliat karena Tuhan menyertainya; Daniel tetap setia berdoa dan Tuhan menjaganya di kandang singa 🦁; dan Yesus lahir di Betlehem pada hari Natal — kabar gembira untuk semua orang! ⭐ Yesus mengasihi anak-anak dan berkata: \"Biarkan anak-anak itu datang kepada-Ku.\" Berdoa itu berbicara dengan Tuhan, bisa kapan saja: pagi bangun tidur, sebelum makan, dan malam sebelum tidur.",
    example: "Sebelum tidur, kamu melipat tangan, menutup mata, dan berdoa: \"Tuhan Yesus, terima kasih untuk hari ini. Jaga aku dan keluargaku. Amin.\" Hati terasa tenang dan berani. 🙏",
    summary: "Tuhan menciptakan segalanya dan sayang padamu. Nuh–bahtera, Daud–Goliat, Daniel–singa, Natal–kelahiran Yesus.",
    worked: "Contoh soal: Siapa yang membuat bahtera besar untuk menyelamatkan hewan dari air bah? Langkah 1: ingat cerita air bah — hujan besar menutupi bumi. Langkah 2: Tuhan menyuruh seorang bapak yang baik membuat kapal besar. Langkah 3: bapak itu bernama NUH. 🌈",
    vocab: "🙏 doa = berbicara dengan Tuhan\n⛵ bahtera = kapal besar Nuh\n⭐ Natal = hari kelahiran Yesus\n❤️ kasih = sayang yang tulus\n📖 Alkitab = firman Tuhan",
    fact: "Tahukah kamu? Pelangi pertama kali diceritakan di Alkitab sesudah air bah surut, sebagai tanda janji Tuhan kepada Nuh. Makanya pelangi selalu terasa seperti kabar baik! 🌈",
  },
  {
    id: "kor-tk-salam", subjects: ["korea"], jenjang: ["TK"], emoji: "👋",
    title: "Bahasa Korea Seru: Salam & Angka 1–10",
    keywords: ["annyeong", "halo", "terima kasih", "angka", "hana", "satu", "warna", "hewan", "korea"],
    concept: "Ayo menyapa dalam Bahasa Korea! 👋 안녕하세요 (annyeonghaseyo) = halo! 감사합니다 (gamsahamnida) = terima kasih. 안녕히 가세요 (annyeonghi gaseyo) = sampai jumpa! 🔢 Angka asli Korea 1–10: 하나 (hana) 1, 둘 (dul) 2, 셋 (set) 3, 넷 (net) 4, 다섯 (daseot) 5, 여섯 (yeoseot) 6, 일곱 (ilgop) 7, 여덟 (yeodeol) 8, 아홉 (ahop) 9, 열 (yeol) 10. 🐶 Hewan: 개 (gae) = anjing, 고양이 (goyangi) = kucing. Ucapkan sambil bertepuk tangan mengikuti irama, ya!",
    example: "Saat menonton kartun Korea bersama kakak, kamu menyapa tokohnya: \"Annyeonghaseyo!\" Serasa punya teman baru dari negeri jauh. 🇰🇷",
    summary: "Annyeonghaseyo = halo, gamsahamnida = terima kasih. Hana, dul, set = 1, 2, 3!",
    worked: "Contoh soal: 'Satu' dalam Bahasa Korea adalah … Langkah 1: berhitung dengan lagu: hana … Langkah 2: hana adalah angka pertama yang kita nyanyikan. Langkah 3: jadi satu = 하나 (hana)! 🎵",
    vocab: "👋 안녕하세요 (annyeonghaseyo) = halo\n🙏 감사합니다 (gamsahamnida) = terima kasih\n1️⃣ 하나 (hana) = satu\n2️⃣ 둘 (dul) = dua\n3️⃣ 셋 (set) = tiga\n🐶 개 (gae) = anjing",
    fact: "Tahukah kamu? Huruf Korea bernama Hangul dan diciptakan oleh seorang raja yang baik hati, Raja Sejong, supaya semua rakyatnya bisa membaca! 👑",
  },
  {
    id: "jpn-tk-salam", subjects: ["jepang"], jenjang: ["TK"], emoji: "👋",
    title: "Bahasa Jepang Seru: Salam & Angka 1–10",
    keywords: ["konnichiwa", "halo", "arigatou", "terima kasih", "angka", "ichi", "satu", "warna", "hewan", "jepang"],
    concept: "Ayo menyapa dalam Bahasa Jepang! 👋 こんにちは (konnichiwa) = halo! おはよう (ohayou) = selamat pagi. ありがとう (arigatou) = terima kasih. さようなら (sayounara) = selamat tinggal! 🔢 Angka Jepang 1–10: 一 ichi 1, 二 ni 2, 三 san 3, 四 yon 4, 五 go 5, 六 roku 6, 七 nana 7, 八 hachi 8, 九 kyuu 9, 十 juu 10. 🐱 Hewan: ねこ (neko) = kucing, いぬ (inu) = anjing, さかな (sakana) = ikan. Di Jepang, menyapa sambil sedikit membungkuk tanda sopan. 🎎",
    example: "Pagi hari di sekolah kamu menyapa guru seperti anak Jepang: \"Ohayou!\" sambil membungkuk kecil. Sopan dan seru! 🌸",
    summary: "Konnichiwa = halo, ohayou = selamat pagi, arigatou = terima kasih. Ichi, ni, san = 1, 2, 3!",
    worked: "Contoh soal: 'Satu' dalam Bahasa Jepang adalah … Langkah 1: berhitung dari awal: ichi … Langkah 2: ichi adalah bunyi pertama saat berhitung. Langkah 3: jadi satu = 一 (ichi)! 🎵",
    vocab: "👋 こんにちは (konnichiwa) = halo\n🌅 おはよう (ohayou) = selamat pagi\n🙏 ありがとう (arigatou) = terima kasih\n1️⃣ 一 (ichi) = satu\n2️⃣ 二 (ni) = dua\n3️⃣ 三 (san) = tiga\n🐱 ねこ (neko) = kucing",
    fact: "Tahukah kamu? Di Jepang ada kereta super cepat bernama Shinkansen yang melaju lebih cepat daripada mobil balap — dan selalu tepat waktu! 🚄",
  },
  {
    id: "man-tk-salam", subjects: ["mandarin"], jenjang: ["TK"], emoji: "👋",
    title: "Bahasa Mandarin Seru: Salam & Angka 1–10",
    keywords: ["ni hao", "halo", "xiexie", "terima kasih", "angka", "yi", "satu", "warna", "hewan", "mandarin"],
    concept: "Ayo menyapa dalam Bahasa Mandarin! 👋 你好 (nǐ hǎo) = halo! 谢谢 (xièxie) = terima kasih. 再见 (zàijiàn) = sampai jumpa! 🔢 Angka Mandarin 1–10: 一 yī 1, 二 èr 2, 三 sān 3, 四 sì 4, 五 wǔ 5, 六 liù 6, 七 qī 7, 八 bā 8, 九 jiǔ 9, 十 shí 10. Sambil berhitung, gerakkan jarimu seperti bentuk angkanya: satu jari untuk yī, dua jari untuk èr! 🐱 Hewan: 猫 (māo) = kucing, 狗 (gǒu) = anjing, 鱼 (yú) = ikan.",
    example: "Di pasar, kamu menyapa penjual buah keturunan Tionghoa: \"Nǐ hǎo!\" Beliau tersenyum lebar. Satu kata halo bisa membuka pertemanan baru. 🍊",
    summary: "Nǐ hǎo = halo, xièxie = terima kasih. Yī, èr, sān = 1, 2, 3!",
    worked: "Contoh soal: 'Satu' dalam Bahasa Mandarin adalah … Langkah 1: berhitung sambil mengangkat jari: yī … Langkah 2: yī adalah angka yang pertama disebut. Langkah 3: jadi satu = 一 (yī)! 🎵",
    vocab: "👋 你好 (nǐ hǎo) = halo\n🙏 谢谢 (xièxie) = terima kasih\n1️⃣ 一 (yī) = satu\n2️⃣ 二 (èr) = dua\n3️⃣ 三 (sān) = tiga\n🐱 猫 (māo) = kucing\n🐼 熊猫 (xióngmāo) = panda",
    fact: "Tahukah kamu? Panda raksasa berasal dari Tiongkok dan hampir seluruh makanannya adalah bambu — ia bisa makan bambu selama 12 jam sehari! 🐼",
  },
];

/* ================= MODUL TOPIK BARU (pengayaan cakupan) ================= */
const EXTRA_MODULES: LibraryModule[] = [
  {
    id: "sains-benda-sekitar", subjects: ["sains"], jenjang: ["TK", "SD"], emoji: "🧸",
    title: "Benda di Sekitarku: Sifat & Kegunaannya",
    keywords: ["keras", "lembut", "kasar", "halus", "benda", "kayu", "plastik", "kaca", "kain", "basah", "kering", "mengapung", "tenggelam"],
    concept: "Setiap benda punya sifat: batu itu KERAS, kapas itu LEMBUT, amplas itu KASAR, sutra itu HALUS. Benda dibuat dari bahan yang cocok dengan tugasnya: payung dari bahan anti-air supaya kita tidak kehujanan, panci dari logam karena tahan panas, bantal dari kain dan kapas supaya empuk. Ada benda yang MENGAPUNG di air (daun, gabus, bola plastik) dan ada yang TENGGELAM (batu, koin, sendok logam). Coba tebak dulu, lalu buktikan dengan percobaan di baskom air — seperti ilmuwan cilik! 🔬",
    example: "Sendok logam tenggelam, tetapi sendok plastik mengapung. Kapal laut yang sangat besar terbuat dari baja, tetapi bentuknya berongga seperti mangkuk raksasa — makanya ia mengapung! 🚢",
    summary: "Keras–lembut, kasar–halus. Bahan dipilih sesuai tugas benda. Mengapung atau tenggelam? Tebak, lalu buktikan!",
    worked: "Contoh soal: Benda yang tenggelam di air adalah … Langkah 1: ingat hasil percobaan baskom — daun dan gabus mengapung. Langkah 2: koin logam berat dan padat. Langkah 3: jadi koin TENGGELAM. 🪙",
    vocab: "🪨 keras = sulit ditekan/dibentuk (batu, kayu)\n☁️ lembut = empuk dan mudah ditekan (kapas, bantal)\n🌊 mengapung = berada di atas permukaan air\n⚓ tenggelam = turun ke dasar air\n🧲 bahan = zat pembuat suatu benda",
    fact: "Tahukah kamu? Es mengapung di air — tidak seperti kebanyakan benda yang membeku lalu tenggelam. Karena es mengapung, ikan di danau yang membeku tetap bisa hidup di bawahnya! 🧊",
  },
  {
    id: "sains-siklus-air", subjects: ["sains"], jenjang: ["SD", "SMP"], kelas: { SD: ["5", "6"] }, emoji: "🌧️",
    title: "Siklus Air & Cuaca",
    keywords: ["siklus air", "evaporasi", "kondensasi", "presipitasi", "awan", "hujan", "cuaca", "musim", "angin", "pelangi"],
    concept: "Air di Bumi berputar terus dalam SIKLUS AIR: (1) EVAPORASI — air laut, danau, dan sungai menguap karena panas Matahari; (2) KONDENSASI — uap air naik, mendingin, dan berubah menjadi titik-titik air kecil pembentuk awan; (3) PRESIPITASI — titik air berkumpul, membesar, lalu jatuh sebagai hujan (atau salju di tempat sangat dingin); (4) air hujan berkumpul lagi di sungai dan laut — siklus berulang. Cuaca adalah keadaan udara dalam waktu singkat (cerah, berawan, hujan, berangin), sedangkan musim adalah pola cuaca panjang. Pelangi muncul saat cahaya Matahari menembus sisa titik hujan. 🌈",
    example: "Jemuran basah menjadi kering karena evaporasi — airnya tidak hilang, ia berubah menjadi uap dan naik ke langit, mungkin turun lagi sebagai hujan di kota lain minggu depan!",
    summary: "Evaporasi → kondensasi (awan) → presipitasi (hujan) → berkumpul lagi. Air tidak pernah hilang, hanya berputar.",
    worked: "Contoh soal: Uap air yang naik ke langit lalu berubah menjadi awan mengalami … Langkah 1: awan terbentuk dari uap yang mendingin. Langkah 2: perubahan gas menjadi cair disebut mengembun/kondensasi. Langkah 3: jadi jawabannya KONDENSASI. ☁️",
    vocab: "💨 evaporasi = penguapan air oleh panas\n☁️ kondensasi = uap berubah menjadi titik air (awan)\n🌧️ presipitasi = jatuhnya air dari awan (hujan/salju)\n🌡️ cuaca = keadaan udara saat ini\n🔄 siklus = perputaran yang berulang",
    fact: "Tahukah kamu? Air yang kamu minum hari ini bisa jadi adalah air yang sama yang diminum dinosaurus jutaan tahun lalu — karena air Bumi selalu berputar dan tidak pernah bertambah atau berkurang! 🦕",
  },
  {
    id: "sains-cahaya-bunyi", subjects: ["sains"], jenjang: ["SD", "SMP"], kelas: { SD: ["4", "5", "6"] }, emoji: "🔦",
    title: "Cahaya & Bunyi di Sekitar Kita",
    keywords: ["cahaya", "bayangan", "cermin", "pantul", "bunyi", "getaran", "gema", "pelangi", "lensa", "suara"],
    concept: "Cahaya merambat LURUS — itu sebabnya benda yang menghalangi cahaya membentuk BAYANGAN. Benda bening (kaca) meneruskan cahaya, benda gelap (kayu, karton) menghalanginya. Cermin memantulkan cahaya dengan teratur sehingga kita bisa bercermin; cahaya juga bisa dibiaskan, misalnya sendok tampak patah di dalam gelas air. Bunyi lahir dari GETARAN: senar gitar bergetar, gendang bergetar, pita suara kita pun bergetar. Bunyi merambat lewat udara, air, dan benda padat — tetapi TIDAK bisa merambat di ruang hampa seperti luar angkasa. Bunyi yang memantul pada dinding jauh menghasilkan GEMA.",
    example: "Berteriak di depan tebing dan mendengar suaramu kembali? Itu gema — bunyi memantul. Astronaut di Bulan tidak bisa saling mendengar tanpa radio karena di sana tidak ada udara! 🌕",
    summary: "Cahaya merambat lurus dan dipantulkan cermin. Bunyi berasal dari getaran dan butuh perantara untuk merambat.",
    worked: "Contoh soal: Kita bisa melihat wajah sendiri di cermin karena cahaya … Langkah 1: cahaya dari wajah kita menuju cermin. Langkah 2: permukaan cermin yang halus mengembalikan cahaya ke mata kita. Langkah 3: jadi cahaya DIPANTULKAN oleh cermin. 🪞",
    vocab: "🌑 bayangan = daerah gelap di belakang benda yang menghalangi cahaya\n🪞 pemantulan = cahaya kembali setelah menabrak permukaan\n〰️ getaran = gerakan bolak-balik sumber bunyi\n📣 gema = bunyi pantul yang terdengar kembali\n🔍 pembiasan = pembelokan cahaya saat berpindah medium",
    fact: "Tahukah kamu? Cahaya adalah yang tercepat di alam semesta: 300.000 kilometer per detik! Cahaya Matahari hanya butuh sekitar 8 menit untuk sampai ke Bumi. ☀️",
  },
  {
    id: "sains-makanan-sehat", subjects: ["sains"], jenjang: ["SD", "SMP"], kelas: { SD: ["5", "6"] }, emoji: "🥦",
    title: "Makanan Sehat & Sistem Pencernaan",
    keywords: ["pencernaan", "makanan", "gizi", "protein", "karbohidrat", "vitamin", "usus", "enzim pencernaan", "sehat", "mineral"],
    concept: "Tubuh kita seperti mesin yang butuh bahan bakar dan bahan bangunan. KARBOHIDRAT (nasi, roti, kentang) memberi energi; PROTEIN (telur, ikan, daging, tahu-tempe) membangun dan memperbaiki tubuh; LEMAK menyimpan cadangan energi; VITAMIN & MINERAL (sayur dan buah) menjaga daya tahan; AIR membantu semua proses. Makanan dicerna bertahap: mulut (gigi mengunyah + air liur), kerongkongan, lambung (diaduk dan diberi enzim), usus halus (sari makanan diserap ke darah — di sinilah makanan benar-benar 'masuk' ke tubuh), usus besar (air diserap), dan sisa dibuang. Pedoman praktis: isi piringku — setengah sayur-buah, sisanya makanan pokok dan lauk protein. 🍽️",
    example: "Sarapan nasi + telur + sayur bayam + susu memberi paket lengkap: energi dari nasi, protein dari telur dan susu, vitamin dari bayam. Badan siap belajar sampai siang!",
    summary: "Karbohidrat = energi, protein = pembangun, vitamin = penjaga. Sari makanan diserap di usus halus.",
    worked: "Contoh soal: Sari-sari makanan diserap ke dalam darah di … Langkah 1: ikuti perjalanan makanan — mulut, kerongkongan, lambung, lalu usus. Langkah 2: lambung hanya mengaduk dan mencampur enzim, belum menyerap sari. Langkah 3: penyerapan terjadi di USUS HALUS. ✅",
    vocab: "⚡ karbohidrat = zat pemberi energi (nasi, roti)\n🧱 protein = zat pembangun tubuh (telur, ikan, tempe)\n🛡️ vitamin = zat penjaga kesehatan (sayur, buah)\n🍽️ pencernaan = proses mengolah makanan menjadi sari\n🌀 usus halus = tempat penyerapan sari makanan",
    fact: "Tahukah kamu? Kalau usus halusmu dibentangkan, luas permukaannya bisa sebesar lapangan tenis! Lipatan dan tonjolan kecilnya (vili) membuat penyerapan makanan super efisien. 🎾",
  },
  {
    id: "mat-statistika", subjects: ["matematika", "cambridge-math"], jenjang: ["SD", "SMP"], kelas: { SD: ["3", "4", "5", "6"] }, emoji: "📊",
    title: "Statistika: Diagram, Rata-rata, Median & Modus",
    keywords: ["rata-rata", "diagram", "median", "modus", "data", "piktogram", "grafik", "mean"],
    concept: "Statistika adalah cara membaca kumpulan data. Tiga ukuran penting: (1) RATA-RATA (mean) = jumlah semua data ÷ banyaknya data; (2) MEDIAN = nilai tengah setelah data diurutkan; (3) MODUS = data yang paling sering muncul. Data disajikan dalam diagram batang (membandingkan jumlah), diagram garis (perubahan dari waktu ke waktu), diagram lingkaran (bagian dari keseluruhan), dan piktogram (gambar mewakili jumlah tertentu — perhatikan kunci gambarnya!). Jebakan klasik: rata-rata gabungan dua kelompok TIDAK bisa dirata-rata begitu saja — kembalikan ke jumlah total dulu.",
    example: "Nilai ulangan 6 siswa: 70, 80, 80, 90, 100, 80. Modusnya 80 (muncul 3 kali), mediannya 80 (nilai tengah), rata-ratanya (70+80+80+90+100+80) ÷ 6 = 500 ÷ 6 ≈ 83,3.",
    summary: "Mean = total ÷ banyak data. Median = nilai tengah terurut. Modus = paling sering muncul.",
    worked: "Contoh soal: Rata-rata nilai 70, 80, 90, 100 adalah … Langkah 1: jumlahkan semua: 70 + 80 + 90 + 100 = 340. Langkah 2: hitung banyaknya data: ada 4 nilai. Langkah 3: bagi: 340 ÷ 4 = 85. Jadi rata-ratanya 85. ✅",
    vocab: "📊 data = kumpulan keterangan/angka\n➗ rata-rata (mean) = jumlah data ÷ banyak data\n🎯 median = nilai tengah setelah diurutkan\n🔁 modus = data yang paling sering muncul\n🖼️ piktogram = diagram memakai gambar berkunci",
    fact: "Tahukah kamu? Kata 'statistik' berasal dari kata 'state' (negara) — dulu penguasa mengumpulkan data penduduk untuk mengatur kerajaannya. Sekarang statistik dipakai di mana-mana, dari cuaca sampai sepak bola! ⚽",
  },
  {
    id: "indo-bacaan-sd", subjects: ["indonesia"], jenjang: ["SD"], emoji: "📖",
    title: "Literasi Baca SD: Membaca & Memahami Cerita",
    keywords: ["bacaan", "cerita", "paragraf", "tokoh", "isi bacaan", "membaca", "pemahaman"],
    concept: "Membaca bukan sekadar mengeja kata — membaca adalah memahami isi. Cara membaca yang baik: (1) baca judulnya dan tebak isinya; (2) baca seluruh teks pelan-pelan; (3) tandai siapa tokohnya, di mana tempatnya, dan apa yang terjadi; (4) setelah membaca, coba ceritakan kembali dengan bahasamu sendiri. Pertanyaan pemahaman biasanya menanyakan: siapa tokohnya, apa yang dilakukan tokoh, di mana peristiwa terjadi, dan pelajaran baik apa yang bisa diambil. Kalau lupa jawabannya, cari lagi di teks — semua jawaban ada di dalam bacaan!",
    example: "Sesudah membaca cerita fabel, tutuplah bukunya dan ceritakan kembali kepada temanmu: awal cerita, masalahnya, dan akhir ceritanya. Kalau kamu bisa menceritakannya, berarti kamu benar-benar paham. 🗣️",
    summary: "Baca judul → baca teks → kenali tokoh, tempat, peristiwa → ceritakan kembali. Jawaban selalu ada di dalam teks.",
    worked: "Contoh soal bacaan: bacalah teks 'Kancil dan Petani' di bagian Ayo Membaca di bawah, lalu jawab: siapa yang menolong kancil? Langkah 1: baca teks sampai selesai. Langkah 2: cari kalimat yang menyebut pertolongan — 'Seekor burung hantu tua menunjukkannya jalan pulang.' Langkah 3: jadi yang menolong kancil adalah BURUNG HANTU. 🦉",
    vocab: "🧑 tokoh = orang/hewan dalam cerita\n🏞️ latar = tempat dan waktu cerita\n📜 alur = urutan peristiwa dalam cerita\n💡 amanat = pelajaran baik dari cerita\n🔍 gagasan utama = pikiran pokok paragraf",
    fact: "Tahukah kamu? Anak yang membaca 15 menit setiap hari bisa membaca sekitar satu juta kata dalam setahun — dan kosakatanya tumbuh jauh lebih cepat daripada teman yang jarang membaca! 📚",
    reading: {
      title: "Kancil dan Petani",
      text: "Di tepi hutan tinggal seekor kancil yang cerdik. Suatu pagi, kancil tersesat saat mencari timun dan masuk ke kebun seorang petani. Petani itu bernama Pak Samin. Melihat kancil ketakutan, Pak Samin tidak marah. Ia justru memberi kancil minum dan menunjukkan jalan pulang ke hutan. Seekor burung hantu tua yang melihat kejadian itu berkata, 'Kebaikan hati selalu berbuah manis.' Sejak hari itu, kancil tidak pernah lagi mencuri timun. Ia menunggu diberi oleh Pak Samin, dan mereka menjadi sahabat.",
      qa: [
        { q: "Siapa nama petani dalam cerita?", a: "Pak Samin." },
        { q: "Apa yang dilakukan Pak Samin saat melihat kancil?", a: "Ia tidak marah; ia memberi kancil minum dan menunjukkan jalan pulang ke hutan." },
        { q: "Apa amanat (pelajaran baik) dari cerita ini?", a: "Kebaikan hati selalu berbuah manis — berbuat baik membuat orang lain berubah menjadi baik dan menjadi sahabat." },
      ],
    },
  },
  {
    id: "indo-bacaan-smp", subjects: ["indonesia"], jenjang: ["SMP", "SMA"], emoji: "📰",
    title: "Literasi Baca SMP: Teks, Gagasan Utama & Simpulan",
    keywords: ["bacaan", "teks", "gagasan utama", "simpulan", "paragraf", "eksposisi", "pemahaman", "inferensi"],
    concept: "Di SMP, membaca berarti berpikir. Setiap paragraf punya GAGASAN UTAMA (biasanya pada kalimat utama di awal atau akhir paragraf) dan kalimat penjelas yang mendukungnya. Teks eksposisi menyampaikan fakta dan pendapat secara logis; teks narasi menceritakan peristiwa; teks deskripsi menggambarkan sesuatu seolah pembaca melihatnya. Membaca kritis artinya membedakan FAKTA (dapat dibuktikan: 'Suhu Bandung hari ini 24°C') dan OPINI (penilaian: 'Bandung kota ternyaman'). Simpulan bacaan harus mencakup gagasan utama seluruh teks, bukan menyalin satu kalimat. Pertanyaan 'mengapa' dan 'bagaimana' menuntut inferensi: gabungkan keterangan di teks dengan penalaranmu.",
    example: "Berita tentang banjir adalah fakta bila menyebut waktu, tempat, dan data; kolom komentar warga tentang banjir berisi opini. Pembaca cerdas memeriksa sumber dan tanggal sebelum membagikan berita. 📰",
    summary: "Gagasan utama = inti paragraf. Fakta bisa dibuktikan, opini adalah penilaian. Simpulan merangkum, bukan menyalin.",
    worked: "Contoh soal: bacalah paragraf di bagian Ayo Membaca, lalu tentukan gagasan utamanya. Langkah 1: baca semua kalimat. Langkah 2: tanyakan 'kalimat mana yang dibahas oleh kalimat-kalimat lain?' — kalimat pertama dibahas dan didukung kalimat berikutnya. Langkah 3: jadi gagasan utamanya ada pada kalimat pertama: perpustakaan adalah jendela dunia. ✅",
    vocab: "💡 gagasan utama = pikiran pokok paragraf\n📄 kalimat utama = kalimat yang memuat gagasan utama\n✔️ fakta = keterangan yang dapat dibuktikan\n💭 opini = pendapat/penilaian seseorang\n🧾 simpulan = ringkasan inti seluruh bacaan\n🔎 inferensi = simpulan dari petunjuk teks",
    fact: "Tahukah kamu? Indonesia punya tradisi literasi kuno: naskah-naskah lontar di Bali dan Jawa ditulis di atas daun palem dan sebagian masih tersimpan rapi sampai berumur ratusan tahun! 🌴",
    reading: {
      title: "Perpustakaan, Jendela Dunia",
      text: "Perpustakaan adalah jendela dunia yang terbuka untuk siapa saja. Di dalamnya, pembaca dapat berkelana ke masa lalu lewat buku sejarah, menjelajahi luar angkasa lewat buku sains, dan menyelami perasaan manusia lewat novel — tanpa beranjak dari tempat duduk. Lebih dari itu, perpustakaan melatih kemandirian: pengunjung belajar mencari, memilih, dan menilai informasi sendiri. Karena itulah, bangsa yang besar selalu merawat perpustakaannya. Buku mungkin diam, tetapi pikiran yang dibangunnya bergerak jauh melampaui dinding ruangan.",
      qa: [
        { q: "Apa gagasan utama paragraf tersebut?", a: "Perpustakaan adalah jendela dunia yang terbuka untuk siapa saja (kalimat pertama, didukung seluruh kalimat berikutnya)." },
        { q: "Menurut teks, apa manfaat perpustakaan selain membaca buku?", a: "Melatih kemandirian: pengunjung belajar mencari, memilih, dan menilai informasi sendiri." },
        { q: "Apakah kalimat 'Buku mungkin diam, tetapi pikiran yang dibangunnya bergerak jauh' termasuk fakta atau opini? Jelaskan.", a: "Opini — kalimat itu penilaian/kiasan penulis, bukan keterangan yang dapat dibuktikan dengan data." },
      ],
    },
  },
  {
    id: "ing-reading-sd", subjects: ["inggris", "cambridge-eng"], jenjang: ["SD"], emoji: "📖",
    title: "Reading Time SD: Short Stories & Questions",
    keywords: ["reading", "story", "read", "passage", "question", "bacaan", "cerita"],
    concept: "Reading in English is easier than you think! Follow these steps: (1) read the title and guess what the story is about; (2) read the whole text slowly — do not stop at every new word; (3) find WHO (the characters), WHERE (the place), and WHAT HAPPENS; (4) answer the questions by looking back at the text — the answers are hidden inside the sentences! Useful question words: who = siapa, what = apa, where = di mana, when = kapan, why = mengapa. Belajar membaca Inggris itu seperti berburu harta karun: jawabannya selalu ada di dalam teks. 🔎",
    example: "After reading a short story, close the book and retell it in your own words: 'The story is about a rabbit. The rabbit is fast but lazy…' If you can retell it, you truly understand it!",
    summary: "Title → read → who/where/what happens → find answers in the text. who=siapa, what=apa, where=di mana.",
    worked: "Worked example: read 'Benny the Rabbit' below, then answer: What does Benny like to eat? Step 1: read the whole text. Step 2: find the sentence about food — 'He likes carrots and leaves.' Step 3: so the answer is CARROTS (and leaves). 🥕",
    vocab: "📖 reading = membaca\n🧑 character = tokoh cerita\n🏞️ place = tempat kejadian\n❓ question word = kata tanya (who, what, where, when, why)\n🔎 look back = melihat kembali ke teks\n🥕 carrot = wortel",
    fact: "Did you know? The word 'bookworm' (kutu buku) is for someone who loves reading — and real bookworms are tiny insects that eat old book pages! 📚",
    reading: {
      title: "Benny the Rabbit",
      text: "Benny is a small white rabbit. He lives in a garden near a big mango tree. Every morning, Benny hops around the garden. He likes carrots and leaves. One day, Benny meets a turtle. The turtle walks slowly, but Benny hops fast. 'Let us be friends,' says Benny. Now Benny and the turtle play together every day.",
      qa: [
        { q: "What colour is Benny?", a: "White." },
        { q: "Where does Benny live?", a: "In a garden near a big mango tree." },
        { q: "Who is Benny's new friend?", a: "A turtle." },
      ],
    },
  },
  {
    id: "ing-reading-smp", subjects: ["inggris", "cambridge-eng"], jenjang: ["SMP", "SMA"], emoji: "📰",
    title: "Reading Comprehension SMP: Main Idea & Inference",
    keywords: ["reading", "passage", "main idea", "inference", "comprehension", "bacaan", "teks"],
    concept: "Strong readers do three things: (1) find the MAIN IDEA — the point every sentence supports, often in the first or last sentence of a paragraph; (2) separate FACT from OPINION — facts can be proven, opinions show feelings or judgement; (3) make INFERENCES — conclusions the writer suggests but does not state directly ('She grabbed an umbrella' → it was probably raining). Skim first for the big picture, then scan for details. For 'why' questions, combine clues in the text. Remember: comprehension questions are answered FROM the text, not from your own experience.",
    example: "A text says: 'Rafi saved his money for six months. Last Saturday, he finally bought the bicycle.' Inference: Rafi is patient and determined — the writer never says it, but the clues prove it. 🚲",
    summary: "Main idea = the supported point. Fact ≠ opinion. Inference = clues + reasoning.",
    worked: "Worked example: read the passage below and choose its main idea. Step 1: skim all sentences. Step 2: ask 'what do all these sentences support?' — every sentence is about libraries helping people learn. Step 3: so the main idea is: libraries open the world of knowledge to everyone. ✅",
    vocab: "💡 main idea = gagasan utama\n✔️ fact = a statement that can be proven\n💭 opinion = a personal judgement\n🔎 inference = a conclusion from clues\n👀 skim = read quickly for the big picture\n🎯 scan = search for specific details",
    fact: "Did you know? The longest sentence ever printed in a novel has more than 13.000 words — readers needed many bookmarks for just one sentence! 😲",
    reading: {
      title: "Libraries Open the World",
      text: "A library is far more than a room full of books. Inside a library, a student can travel to ancient Egypt through a history book, explore the deep sea through a science magazine, or learn a new language from a dictionary — all without leaving the chair. Libraries also teach independence: visitors learn to search, choose, and judge information by themselves. That is why great nations take care of their libraries. Books may be silent, but the minds they build travel far beyond the walls.",
      qa: [
        { q: "What is the main idea of the passage?", a: "Libraries open the world of knowledge to everyone (and train independence) — every sentence supports this point." },
        { q: "According to the text, what do libraries teach besides knowledge?", a: "Independence: visitors learn to search, choose, and judge information by themselves." },
        { q: "Is 'Books may be silent, but the minds they build travel far' a fact or an opinion? Why?", a: "An opinion — it is the writer's figurative judgement, not something that can be proven with data." },
      ],
    },
  },
  {
    id: "ips-asean", subjects: ["ips"], jenjang: ["SMP", "SMA"], emoji: "🌏",
    title: "ASEAN & Indonesia di Dunia",
    keywords: ["asean", "asia tenggara", "negara anggota", "sekretariat", "kerja sama", "global", "pbb", "ekspor", "impor"],
    concept: "ASEAN (Association of Southeast Asian Nations) didirikan 8 Agustus 1967 di Bangkok oleh 5 negara: Indonesia, Malaysia, Filipina, Singapura, dan Thailand. Kini anggotanya 10 negara Asia Tenggara (ditambah Brunei, Vietnam, Laos, Myanmar, Kamboja). Sekretariat ASEAN berada di Jakarta — bukti peran penting Indonesia. Kerja sama ASEAN meliputi ekonomi (perdagangan bebas kawasan), pendidikan (pertukaran pelajar), dan keamanan kawasan. Di tingkat dunia, Indonesia aktif di PBB, G20, dan pernah memelopori Gerakan Non-Blok serta Konferensi Asia-Afrika 1955 di Bandung. Politik luar negeri Indonesia: bebas dan aktif.",
    example: "Produk Indonesia seperti kopi dan minyak sawit dijual ke negara ASEAN dan dunia (ekspor), sedangkan gandum dan mesin kita datangkan dari luar (impor) — perdagangan membuat negara saling membutuhkan.",
    summary: "ASEAN lahir 1967 di Bangkok, 10 anggota, sekretariat di Jakarta. Politik luar negeri Indonesia: bebas aktif.",
    worked: "Contoh soal: Sekretariat ASEAN berkedudukan di … Langkah 1: ingat peran Indonesia sebagai salah satu pendiri terbesar. Langkah 2: Bangkok adalah tempat ASEAN didirikan, bukan sekretariatnya. Langkah 3: sekretariat tetap ASEAN berada di JAKARTA. ✅",
    vocab: "🌏 ASEAN = perhimpunan bangsa-bangsa Asia Tenggara\n🏢 sekretariat = kantor pusat organisasi\n📦 ekspor = menjual barang ke luar negeri\n📥 impor = membeli barang dari luar negeri\n🕊️ non-blok = tidak memihak blok kekuatan mana pun\n🤝 bebas aktif = politik luar negeri Indonesia",
    fact: "Tahukah kamu? Konferensi Asia-Afrika 1955 di Bandung dihadiri 29 negara dan mengguncang dunia — banyak negara Asia-Afrika merdeka terinspirasi peristiwa ini. Gedung Merdeka tempatnya masih berdiri sampai sekarang! 🏛️",
  },
  {
    id: "ppkn-hak-kewajiban", subjects: ["ppkn"], jenjang: ["SD", "SMP"], kelas: { SD: ["3", "4", "5", "6"] }, emoji: "⚖️",
    title: "Hak, Kewajiban & Musyawarah",
    keywords: ["hak", "kewajiban", "musyawarah", "mufakat", "voting", "warga negara", "aturan", "norma", "gotong royong"],
    concept: "Setiap warga negara punya HAK (sesuatu yang layak diterima: hak belajar, hak bermain, hak mendapat perlindungan) dan KEWAJIBAN (sesuatu yang harus dilakukan: kewajiban belajar, mematuhi aturan, menjaga kebersihan). Hak dan kewajiban harus SEIMBANG: menuntut hak tanpa menjalankan kewajiban membuat kehidupan bersama kacau. Keputusan bersama diambil lewat MUSYAWARAH untuk mencapai MUFAKAT (kesepakatan semua pihak) — sesuai sila ke-4 Pancasila. Bila mufakat tidak tercapai, barulah dilakukan pemungutan suara (voting) dan semua pihak menghormati hasilnya. Norma yang mengatur hidup bersama: agama, kesusilaan, kesopanan, dan hukum.",
    example: "Kelasmu bermusyawarah memilih tujuan karyawisata. Ada yang ingin ke pantai, ada yang ingin ke museum. Setelah berdiskusi baik-baik, kelas sepakat ke museum sains — itulah mufakat, dan semua ikut dengan senang hati. 🚌",
    summary: "Hak diterima, kewajiban dilakukan — keduanya seimbang. Musyawarah dulu, mufakat tujuan, voting jalan terakhir.",
    worked: "Contoh soal: Contoh kewajiban siswa di sekolah adalah … Langkah 1: kewajiban = yang harus DILAKUKAN, bukan diterima. Langkah 2: 'mendapat nilai' dan 'dipuji guru' adalah hak/akibat, bukan kewajiban. Langkah 3: 'mengerjakan tugas dan mematuhi tata tertib' adalah KEWAJIBAN. ✅",
    vocab: "🎁 hak = sesuatu yang layak diterima\n📋 kewajiban = sesuatu yang harus dilakukan\n🗣️ musyawarah = berunding untuk keputusan bersama\n🤝 mufakat = kesepakatan semua pihak\n📏 norma = aturan hidup bersama\n🗳️ voting = pemungutan suara",
    fact: "Tahukah kamu? Kata 'musyawarah' berasal dari bahasa Arab 'syawara' yang artinya saling memberi isyarat/pendapat. Tradisi berunding ini sudah hidup di desa-desa Nusantara jauh sebelum Indonesia merdeka! 🏡",
  },
];

export const LIBRARY_MODULES: LibraryModule[] = [
  ...SAINS_MODULES, ...BIO_MODULES, ...FIS_MODULES, ...KIM_MODULES,
  ...MATH_MODULES, ...ARAB_MODULES, ...ISLAM_MODULES, ...KRISTEN_MODULES,
  ...LANG_MODULES, ...SOSIAL_MODULES, ...SEJARAH_MODULES, ...KOMPETISI_MODULES,
  ...TK_MODULES, ...EXTRA_MODULES,
].map((m) => {
  // Gabungkan pengayaan (contoh dibahas, kosakata, Tahukah Kamu?) dari
  // library-enrich.ts; modul baru yang sudah membawa kolomnya sendiri
  // (TK_MODULES & EXTRA_MODULES) tidak ditimpa.
  const e = MODULE_ENRICH[m.id];
  if (!e) return m;
  return { ...m, worked: m.worked ?? e.worked, vocab: m.vocab ?? e.vocab, fact: m.fact ?? e.fact };
});

const SUBJECT_ALIAS: Record<string, string> = {
  "cambridge-sci": "sains",
};

function subjectPool(subjectId: string): string[] {
  const alias = SUBJECT_ALIAS[subjectId];
  return alias ? [subjectId, alias] : [subjectId];
}

/** Modul-modul untuk satu jenjang + mapel (termasuk fallback dari Bahan Belajar).
    Mode Cambridge (english): modul diterjemahkan lewat MODULE_EN /
    MATERIALS_EN dari cambridge.ts, termasuk kata kuncinya, supaya
    pemetaan soal -> modul tetap akurat untuk soal Bahasa Inggris. */
export function modulesFor(jenjang: JenjangId, subjectId: string, english = false, kelas?: string): LibraryModule[] {
  const pool = subjectPool(subjectId);
  const directAll = LIBRARY_MODULES.filter((m) => m.jenjang.includes(jenjang) && m.subjects.some((s) => pool.includes(s)));
  // Saringan kelas: modul yang khas kelas tertentu (m.kelas untuk jenjang
  // ini) hanya tampil bila kelas peserta termasuk di dalamnya; modul
  // umum tampil untuk semua kelas. Bila saringan mengosongkan daftar
  // (semua modul mapel ini khas kelas lain), tampilkan semua modul
  // jenjang itu agar peserta tidak kehilangan bahan belajar.
  let direct = directAll;
  if (kelas) {
    const inClass = directAll.filter((m) => {
      const tag = m.kelas?.[jenjang];
      return !tag || tag.includes(kelas);
    });
    if (inClass.length > 0) direct = inClass;
  }
  if (direct.length > 0) return english ? direct.map(englishModule) : direct;
  // Fallback: turunkan modul dari sections Bahan Belajar mapel itu.
  const rawMaterial = MATERIALS[subjectId];
  if (!rawMaterial) return [];
  const material = english ? englishMaterial(subjectId, rawMaterial) : rawMaterial;
  return material.sections.map((sec, i) => ({
    id: `derived-${subjectId}-${i}`,
    subjects: [subjectId],
    jenjang: ALL,
    emoji: "📘",
    title: sec.h.replace(/^\d+\.\s*/, ""),
    keywords: sec.h.toLowerCase().split(/[^a-zà-ÿ0-9]+/i).filter((w) => w.length > 3),
    concept: sec.body,
    example: material.tips[i % material.tips.length] ?? material.tips[0] ?? "",
    summary: material.focus[jenjang] ?? material.intro,
  }));
}

/**
 * Pemetaan soal -> modul: skor kata kunci topik pada teks soal +
 * pembahasannya, di antara modul jenjang + mapel yang sama.
 * Selalu mengembalikan modul paling relevan (fallback modul pertama).
 */
export function moduleForQuestion(jenjang: JenjangId, subjectId: string, q: Question, english = false, kelas?: string): LibraryModule | null {
  const mods = modulesFor(jenjang, subjectId, english, kelas);
  if (mods.length === 0) return null;
  const hayQ = q.q.toLowerCase();
  const hayRest = `${q.explain} ${q.options.join(" ")}`.toLowerCase();
  let best: LibraryModule | null = null;
  let bestScore = 0;
  for (const m of mods) {
    let score = 0;
    for (const kw of m.keywords) {
      if (!kw) continue;
      const k = kw.toLowerCase();
      if (hayQ.includes(k)) score += kw.length * 2;
      else if (hayRest.includes(k)) score += kw.length;
    }
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best ?? mods[0] ?? null;
}

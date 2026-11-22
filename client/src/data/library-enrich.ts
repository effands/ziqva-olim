// Pengayaan Perpustakaan Belajar — konten tambahan per modul yang sudah
// ada: contoh soal dibahas langkah demi langkah (worked), daftar kosakata
// / istilah penting (vocab), dan kotak "Tahukah Kamu?" (fact). Digabung
// ke modul di library.ts berdasarkan id modul. Semua tulisan original.

import type { LibraryModule } from "./library";

export type ModuleEnrichment = Pick<LibraryModule, "worked" | "vocab" | "fact">;

export const MODULE_ENRICH: Record<string, ModuleEnrichment> = {
  /* ---------- SAINS / IPA ---------- */
  "sains-makhluk-hidup": {
    worked: "Contoh soal: Hewan yang mengalami metamorfosis sempurna adalah … Langkah 1: ingat empat tahap metamorfosis sempurna: telur → larva → pupa → dewasa. Langkah 2: periksa pilihan — belalang hanya tiga tahap (tidak sempurna), ayam tidak berubah bentuk. Langkah 3: kupu-kupu melewati ulat dan kepompong, jadi jawabannya KUPU-KUPU. 🦋",
    vocab: "🏠 habitat = tempat tinggal alami makhluk hidup\n🦋 metamorfosis = perubahan bentuk selama hidup\n🥚 larva = anak hewan yang bentuknya berbeda dari induk (ulat)\n🛖 pupa/kepompong = tahap istirahat sebelum dewasa\n🐛 nimfa = anak hewan mirip dewasa pada metamorfosis tidak sempurna",
    fact: "Tahukah kamu? Katak memulai hidup sebagai berudu yang bernapas dengan insang di air, lalu berubah menjadi katak darat yang bernapas dengan paru-paru — satu hewan, dua cara bernapas dalam seumur hidup! 🐸",
  },
  "sains-tubuh-indera": {
    worked: "Contoh soal: Organ yang menyaring darah menjadi urine adalah … Langkah 1: ingat tugas tiap organ — jantung memompa, lambung mencerna, hati menetralkan racun. Langkah 2: menyaring darah adalah pekerjaan khusus satu organ di pinggang kita. Langkah 3: jawabannya GINJAL. ✅",
    vocab: "❤️ jantung = memompa darah ke seluruh tubuh\n🫁 paru-paru = tempat pertukaran oksigen & karbon dioksida\n🧠 otak = pusat pengatur tubuh\n🩸 ginjal = menyaring darah menjadi urine\n👅 lidah = indera pengecap rasa",
    fact: "Tahukah kamu? Jantungmu berdetak sekitar 100.000 kali setiap hari dan memompa kurang lebih 7.500 liter darah — tanpa pernah berhenti beristirahat seumur hidupmu! ❤️",
  },
  "sains-tumbuhan": {
    worked: "Contoh soal: Bagian tumbuhan yang berfungsi menyerap air dari tanah adalah … Langkah 1: urutkan tugas bagian tumbuhan dari bawah: yang di dalam tanah bertugas menyerap. Langkah 2: batang hanya menyalurkan, daun memasak, bunga berkembang biak. Langkah 3: jadi jawabannya AKAR. 🌱",
    vocab: "🌱 akar = menyerap air & zat hara\n🪵 batang = menopang & menyalurkan\n🍃 daun = tempat fotosintesis\n🌸 bunga = alat perkembangbiakan\n🟢 klorofil = zat hijau daun penangkap cahaya",
    fact: "Tahukah kamu? Satu pohon besar bisa menguapkan ratusan liter air setiap hari lewat daunnya — pohon adalah pompa air raksasa yang digerakkan Matahari! 🌳",
  },
  "sains-energi-wujud": {
    worked: "Contoh soal: Air yang dipanaskan terus-menerus akan berubah menjadi uap. Perubahan wujud ini disebut … Langkah 1: tentukan wujud awal (cair) dan wujud akhir (gas). Langkah 2: cair → gas namanya menguap; gas → cair barulah mengembun. Langkah 3: jawabannya MENGUAP. ♨️",
    vocab: "🧊 membeku = cair menjadi padat\n💧 mencair = padat menjadi cair\n♨️ menguap = cair menjadi gas\n🌫️ mengembun = gas menjadi cair\n🔥 konduksi = perpindahan panas lewat zat padat\n🌡️ suhu = derajat panas suatu benda",
    fact: "Tahukah kamu? Kamper (kapur barus) yang dibiarkan di lemari lama-lama habis tanpa pernah mencair — ia MENYUBLIM, berubah langsung dari padat menjadi gas! 👃",
  },
  "sains-bumi-antariksa": {
    worked: "Contoh soal: Planet yang paling dekat dengan Matahari adalah … Langkah 1: sebutkan urutan planet dari yang terdekat: Merkurius, Venus, Bumi, Mars… Langkah 2: yang pertama disebut adalah yang terdekat. Langkah 3: jawabannya MERKURIUS. ☀️",
    vocab: "🪐 planet = benda langit yang mengorbit bintang\n⭐ bintang = benda langit bercahaya sendiri\n🌙 satelit = pengiring planet (Bulan = satelit Bumi)\n🔄 orbit = lintasan mengelilingi benda lain\n☀️ tata surya = Matahari dan semua pengikutnya",
    fact: "Tahukah kamu? Satu hari di Venus lebih lama daripada satu tahun di Venus — planet itu berputar pada porosnya dengan sangat lambat sambil mengelilingi Matahari lebih cepat! 🪐",
  },
  "sains-gaya-gerak": {
    worked: "Contoh soal: Sebuah benda bermassa 4 kg diberi percepatan 3 m/s². Berapa gayanya? Langkah 1: tulis rumus Hukum II Newton: F = m × a. Langkah 2: masukkan angka: F = 4 × 3. Langkah 3: F = 12 Newton. ✅",
    vocab: "💪 gaya = tarikan atau dorongan (satuan Newton)\n⚖️ massa = jumlah materi benda (kg)\n🚀 percepatan = perubahan kecepatan tiap detik\n🌍 gravitasi = gaya tarik Bumi\n🛑 gaya gesek = gaya yang menahan gerak",
    fact: "Tahukah kamu? Di Bulan, gravitasi hanya seperenam Bumi — astronaut bisa melompat sangat tinggi dan jauh, tetapi massa tubuhnya tetap sama seperti di Bumi! 🌕",
  },
  "sains-zat-materi": {
    worked: "Contoh soal: Larutan cuka memiliki pH 3. Cuka bersifat … Langkah 1: ingat patokan pH: di bawah 7 = asam, 7 = netral, di atas 7 = basa. Langkah 2: pH cuka = 3, lebih kecil dari 7. Langkah 3: jadi cuka bersifat ASAM. ✅",
    vocab: "🧪 campuran homogen = tercampur merata (air gula)\n🥗 campuran heterogen = masih bisa dibedakan (salad)\n🍋 asam = pH < 7 (cuka, jeruk)\n🧼 basa = pH > 7 (sabun)\n💧 netral = pH = 7 (air murni)",
    fact: "Tahukah kamu? Air liur dan darah kita dijaga tubuh agar pH-nya hampir netral — bergeser sedikit saja, tubuh bisa sakit. Tubuhmu adalah ahli kimia yang bekerja 24 jam! 🧬",
  },
  "sains-sel-organ": {
    worked: "Contoh soal: Organel yang menghasilkan energi (ATP) bagi sel adalah … Langkah 1: ingat julukan organel — 'pembangkit listrik sel'. Langkah 2: ribosom membuat protein, nukleus mengatur, bukan menghasilkan energi. Langkah 3: jawabannya MITOKONDRIA. ⚡",
    vocab: "⚡ mitokondria = penghasil energi (ATP)\n🏭 ribosom = pembuat protein\n🧠 nukleus = pusat kendali sel\n🌿 kloroplas = tempat fotosintesis (tumbuhan)\n🚪 membran sel = penjaga keluar-masuk zat\n🧫 sitoplasma = cairan tempat organel berada",
    fact: "Tahukah kamu? Tubuhmu tersusun dari sekitar 37 TRILIUN sel — dan hampir setiap sel membawa salinan lengkap DNA-mu yang, bila direntangkan, panjangnya sekitar 2 meter! 🧬",
  },
  "sains-ekosistem": {
    worked: "Contoh soal: Dalam rantai makanan padi → tikus → ular → elang, yang berperan sebagai konsumen I adalah … Langkah 1: produsen selalu tumbuhan (padi). Langkah 2: pemakan produsen adalah konsumen I. Langkah 3: tikus memakan padi, jadi konsumen I adalah TIKUS. 🐭",
    vocab: "🌱 produsen = pembuat makanan (tumbuhan)\n🐭 konsumen I = pemakan tumbuhan\n🦅 konsumen II = pemakan konsumen I\n🍄 pengurai = bakteri & jamur pengurai sisa makhluk\n⚖️ ekosistem = kesatuan makhluk hidup & lingkungannya",
    fact: "Tahukah kamu? Serigala yang dilepas kembali ke Taman Nasional Yellowstone mengubah aliran sungai! Karena rusa terkendali, tumbuhan tepi sungai tumbuh lagi dan menahan erosi — satu predator mengubah peta alam. 🐺",
  },
  "sains-listrik-magnet": {
    worked: "Contoh soal: Tegangan 12 V mengalir pada hambatan 4 Ω. Kuat arusnya … Langkah 1: tulis Hukum Ohm: V = I × R, jadi I = V ÷ R. Langkah 2: masukkan angka: I = 12 ÷ 4. Langkah 3: I = 3 Ampere. ⚡",
    vocab: "⚡ arus listrik = aliran muatan (Ampere)\n🔋 tegangan = dorongan listrik (Volt)\n🚧 hambatan = penahan arus (Ohm)\n💡 daya = energi listrik per detik (Watt)\n🧲 kutub magnet = ujung utara & selatan magnet",
    fact: "Tahukah kamu? Petir adalah listrik alami raksasa: suhunya bisa lima kali lebih panas dari permukaan Matahari, dan arusnya ratusan ribu Ampere! 🌩️",
  },
  /* ---------- BIOLOGI SMA ---------- */
  "bio-respirasi": {
    worked: "Contoh soal: Tahap respirasi aerob yang menghasilkan ATP paling banyak adalah … Langkah 1: bandingkan hasil tiap tahap: glikolisis 2 ATP, siklus Krebs 2 ATP. Langkah 2: tahap terakhir di membran mitokondria menghasilkan ±34 ATP. Langkah 3: jawabannya RANTAI TRANSPOR ELEKTRON. ⚡",
    vocab: "⚡ ATP = mata uang energi sel\n🍞 glikolisis = pemecahan glukosa di sitoplasma\n🔄 siklus Krebs = tahap kedua di mitokondria\n⛓️ transpor elektron = penghasil ATP terbanyak\n🐜 spirakel = lubang napas serangga\n🐟 insang = alat napas ikan",
    fact: "Tahukah kamu? Setiap hari tubuhmu membuat dan memakai ATP seberat kurang lebih separuh berat badanmu — untungnya ATP didaur ulang ribuan kali, bukan dibuat sekali pakai! 🔋",
  },
  "bio-genetika": {
    worked: "Contoh soal: Persilangan Aa × Aa menghasilkan keturunan berfenotipe dominan sebanyak … Langkah 1: buat kotak Punnett: gamet A dan a dari kedua induk. Langkah 2: hasilnya AA, Aa, Aa, aa. Langkah 3: yang berfenotipe dominan adalah AA + Aa + Aa = 3 dari 4, yaitu 75%. 🧬",
    vocab: "🧬 gen = penentu sifat keturunan\n🔀 alel = variasi pasangan gen\n👑 dominan = sifat yang menutupi\n🙈 resesif = sifat yang tertutupi\n🔤 genotipe = susunan gen (Aa)\n👀 fenotipe = sifat yang tampak",
    fact: "Tahukah kamu? Gregor Mendel menemukan hukum genetika dari percobaan kacang ercis di kebun biara — ia menghitung lebih dari 28.000 tanaman dengan tangan, jauh sebelum ada komputer! 🌱",
  },
  "bio-enzim": {
    worked: "Contoh soal: Enzim yang mengubah lemak menjadi asam lemak dan gliserol adalah … Langkah 1: cocokkan enzim dengan substratnya: amilase–tepung, pepsin–protein. Langkah 2: lemak (lipid) dicerna oleh enzim yang namanya mirip: lipase. Langkah 3: jawabannya LIPASE. ✅",
    vocab: "🍚 amilase/ptialin = mencerna tepung (amilum)\n🥩 pepsin & tripsin = mencerna protein\n🧈 lipase = mencerna lemak\n🥛 laktase = mencerna laktosa susu\n🍬 maltase = mengubah maltosa menjadi glukosa\n🔑 substrat = zat yang dikerjakan enzim",
    fact: "Tahukah kamu? Air liurmu menghasilkan enzim amilase sejak gigitan pertama — itu sebabnya nasi yang dikunyah lama-lama terasa manis: tepungnya sudah berubah menjadi gula di mulut! 👅",
  },
  /* ---------- FISIKA SMA ---------- */
  "fis-gerak": {
    worked: "Contoh soal: Benda bergerak dengan v₀ = 10 m/s dan percepatan 2 m/s² selama 5 s. Kecepatan akhirnya … Langkah 1: pilih rumus GLBB: v = v₀ + at. Langkah 2: masukkan angka: v = 10 + 2 × 5. Langkah 3: v = 20 m/s. 🚗",
    vocab: "🏁 v₀ = kecepatan awal\n🏎️ v = kecepatan akhir\n📈 percepatan (a) = perubahan kecepatan per detik\n📏 GLBB = gerak lurus berubah beraturan\n⏱️ kecepatan rata-rata = jarak total ÷ waktu total",
    fact: "Tahukah kamu? Pesawat luar angkasa yang sudah lepas dari gravitasi terus meluncur tanpa mesin — sesuai Hukum I Newton: benda bergerak akan terus bergerak bila tidak ada gaya yang menghentikannya. 🚀",
  },
  "fis-energi": {
    worked: "Contoh soal: Benda 2 kg bergerak 10 m/s. Energi kinetiknya … Langkah 1: tulis rumus Ek = ½mv². Langkah 2: masukkan angka: Ek = ½ × 2 × 10² = ½ × 2 × 100. Langkah 3: Ek = 100 Joule. ✅",
    vocab: "⚡ energi kinetik = energi benda bergerak (½mv²)\n🎢 energi potensial = energi karena posisi/ketinggian\n🔋 usaha = gaya × perpindahan\n🌀 periode = waktu satu getaran penuh\n📐 Joule = satuan energi & usaha",
    fact: "Tahukah kamu? Karena kecepatan berpengaruh kuadrat pada energi kinetik, mobil yang menabrak pada 100 km/jam membawa energi EMPAT kali lipat dibanding pada 50 km/jam — alasan kuat untuk tidak ngebut! 🚦",
  },
  "fis-listrik": {
    worked: "Contoh soal: Hambatan 6 Ω dan 3 Ω dipasang paralel. Hambatan penggantinya … Langkah 1: gunakan rumus paralel: 1/R = 1/6 + 1/3 = 1/6 + 2/6 = 3/6. Langkah 2: balik hasilnya: R = 6/3. Langkah 3: R = 2 Ω (lebih kecil dari hambatan terkecil — masuk akal!). 🔌",
    vocab: "🔗 rangkaian seri = satu jalur, hambatan dijumlah\n🌿 rangkaian paralel = banyak jalur, 1/R dijumlah\n⚡ hambatan pengganti = hambatan total rangkaian\n🔋 Volt = satuan tegangan\n💡 Ampere = satuan kuat arus",
    fact: "Tahukah kamu? Lampu-lampu di rumahmu dipasang paralel — itulah sebabnya mematikan lampu kamar tidak ikut mematikan lampu dapur! 💡",
  },
  "fis-gelombang": {
    worked: "Contoh soal: Gelombang berfrekuensi 50 Hz dan panjang gelombang 2 m. Cepat rambatnya … Langkah 1: tulis rumus v = λ × f. Langkah 2: masukkan angka: v = 2 × 50. Langkah 3: v = 100 m/s. 🌊",
    vocab: "〰️ panjang gelombang (λ) = jarak satu gelombang penuh\n🔊 frekuensi (f) = getaran per detik (Hertz)\n🚀 cepat rambat (v) = λ × f\n📶 amplitudo = tinggi puncak gelombang\n🎵 bunyi = gelombang yang didengar telinga",
    fact: "Tahukah kamu? Kita melihat kilat lebih dulu daripada mendengar guntur karena cahaya merambat hampir sejuta kali lebih cepat daripada bunyi! ⚡",
  },
  /* ---------- KIMIA SMA ---------- */
  "kim-unsur": {
    worked: "Contoh soal: Lambang unsur emas adalah … Langkah 1: ingat lambang dari nama Latin: emas = aurum. Langkah 2: ambil huruf awal namanya Latin-nya: Au. Langkah 3: jawabannya Au (bukan Em atau G). 🥇",
    vocab: "⚛️ unsur = zat tunggal paling sederhana\n🔤 lambang unsur = singkatan 1–2 huruf\n🥇 Au = emas (aurum)\n🧂 Na = natrium\n🪙 Ag = perak (argentum)\n🔩 Fe = besi (ferrum)",
    fact: "Tahukah kamu? Lambang timbal adalah Pb dari bahasa Latin 'plumbum' — itu asal kata Inggris 'plumbing' (pipa), karena pipa air Romawi kuno dibuat dari timbal! 🏛️",
  },
  "kim-konfigurasi": {
    worked: "Contoh soal: Konfigurasi elektron unsur dengan nomor atom 11 (Na) adalah … Langkah 1: isi dari kulit terendah: 1s² (2), 2s² (4), 2p⁶ (10), 3s¹ (11). Langkah 2: jumlahkan: 2+2+6+1 = 11 ✔. Langkah 3: Na = 1s² 2s² 2p⁶ 3s¹, atau [Ne] 3s¹. ✅",
    vocab: "🌀 orbital = ruang tempat elektron berada\n🔢 nomor atom (Z) = jumlah proton = jumlah elektron netral\n⭐ elektron valensi = elektron kulit terluar\n🎈 gas mulia = unsur sangat stabil (He, Ne, Ar…)\n📝 [Ar] = singkatan konfigurasi argon (18 elektron)",
    fact: "Tahukah kamu? Warna kembang api berasal dari elektron unsur yang 'melompat' dan kembali ke tempatnya sambil melepas cahaya: stronsium merah, barium hijau, natrium kuning keemasan! 🎆",
  },
  "kim-ph": {
    worked: "Contoh soal: Larutan HCl 10⁻³ M mempunyai pH … Langkah 1: HCl asam kuat, jadi [H⁺] = 10⁻³. Langkah 2: pH = −log[H⁺] = −log 10⁻³. Langkah 3: pH = 3. 🧫",
    vocab: "🍋 asam kuat = terionisasi sempurna (HCl, H₂SO₄)\n🧼 basa kuat = terionisasi sempurna (NaOH, KOH)\n🔢 pH = −log[H⁺]\n🔢 pOH = −log[OH⁻]\n⚖️ pH + pOH = 14 pada suhu kamar",
    fact: "Tahukah kamu? Lambungmu berisi asam klorida dengan pH sekitar 1,5–2 — cukup kuat untuk membantu mencerna makanan dan membunuh kuman. Dinding lambung dilapisi lendir khusus agar tidak ikut tercerna! 🛡️",
  },
  "kim-biloks-buffer": {
    worked: "Contoh soal: Bilangan oksidasi S dalam H₂SO₄ adalah … Langkah 1: tulis aturan: H = +1, O = −2, total senyawa netral = 0. Langkah 2: susun persamaan: 2(+1) + S + 4(−2) = 0 → 2 + S − 8 = 0. Langkah 3: S = +6. ⚖️",
    vocab: "🔢 bilangan oksidasi = muatan semu atom dalam senyawa\n➕ oksidasi = biloks naik (melepas elektron)\n➖ reduksi = biloks turun (menerima elektron)\n🛡️ buffer = larutan penahan perubahan pH\n🔗 basa konjugasi = pasangan asam lemah setelah melepas H⁺",
    fact: "Tahukah kamu? Karat pada besi adalah reaksi oksidasi yang berjalan lambat — dan perkaratan jembatan serta kapal merugikan dunia triliunan rupiah setiap tahun. Makanya benda logam dicat! 🎨",
  },
  /* ---------- MATEMATIKA ---------- */
  "mat-operasi": {
    worked: "Contoh soal: Hasil dari 24 − 6 × 3 + 8 adalah … Langkah 1: kerjakan kali dulu: 6 × 3 = 18. Langkah 2: soal menjadi 24 − 18 + 8. Langkah 3: kerjakan dari kiri: 24 − 18 = 6, lalu 6 + 8 = 14. ✅",
    vocab: "🧮 operasi campuran = hitungan dengan lebih dari satu tanda\n( ) kurung = dikerjakan paling dulu\n✖️ perkalian & pembagian = lebih kuat dari tambah/kurang\n➕ penjumlahan = menggabungkan\n➖ pengurangan = mengambil/selisih",
    fact: "Tahukah kamu? Tanda sama dengan (=) baru dipakai sejak tahun 1557 oleh Robert Recorde — ia memilih dua garis sejajar karena 'tidak ada dua hal yang lebih sama daripada dua garis yang sama panjang'. 📏",
  },
  "mat-pecahan": {
    worked: "Contoh soal: Hasil dari 1/2 + 1/3 adalah … Langkah 1: samakan penyebut dengan KPK 2 dan 3 = 6. Langkah 2: ubah pecahannya: 1/2 = 3/6 dan 1/3 = 2/6. Langkah 3: jumlahkan pembilangnya: 3/6 + 2/6 = 5/6. 🍕",
    vocab: "🔼 pembilang = angka atas pecahan (bagian yang diambil)\n🔽 penyebut = angka bawah (total bagian sama besar)\n🍕 pecahan senilai = bernilai sama, bentuk berbeda (1/2 = 2/4)\n💯 persen = pecahan berpenyebut 100\n🔟 desimal = pecahan dengan koma (0,5 = 1/2)",
    fact: "Tahukah kamu? Orang Mesir kuno hanya menulis pecahan dengan pembilang 1 (seperti 1/3 dan 1/7) — pecahan lain ditulis sebagai jumlahan pecahan-pecahan satuan. Menulis 3/4 saja bisa jadi teka-teki panjang! 🏺",
  },
  "mat-fpb-kpk-pola": {
    worked: "Contoh soal: KPK dari 4 dan 6 adalah … Langkah 1: tulis kelipatan 4: 4, 8, 12, 16… Langkah 2: tulis kelipatan 6: 6, 12, 18… Langkah 3: kelipatan bersama terkecil yang pertama sama adalah 12. Jadi KPK = 12. 🔢",
    vocab: "✂️ FPB = faktor persekutuan terbesar (membagi rata)\n🚌 KPK = kelipatan persekutuan terkecil (jadwal bertemu)\n🔢 faktor = bilangan yang membagi habis\n🔁 kelipatan = hasil perkalian berurutan\n📈 barisan aritmetika = selisih antarsuku tetap",
    fact: "Tahukah kamu? Bilangan prima terbesar yang diketahui manusia punya lebih dari 24 juta digit — menuliskannya bisa memenuhi ribuan halaman buku, dan ia ditemukan oleh komputer yang bekerja sama dari seluruh dunia! 💻",
  },
  "mat-bangun": {
    worked: "Contoh soal: Sebuah persegi panjang berukuran 8 cm × 5 cm. Luasnya … Langkah 1: pilih rumus luas persegi panjang: L = p × l. Langkah 2: masukkan angka: L = 8 × 5. Langkah 3: L = 40 cm². Jangan lupa satuan luas memakai pangkat dua! 📐",
    vocab: "📐 luas = ukuran permukaan (satuan²)\n🔲 keliling = jumlah panjang semua sisi\n📦 volume = isi ruang bangun (satuan³)\n📏 π (pi) ≈ 3,14 atau 22/7\n🔺 Pythagoras: c² = a² + b² pada segitiga siku-siku",
    fact: "Tahukah kamu? Nilai π (pi) sudah dihitung sampai lebih dari 100 triliun angka di belakang koma oleh komputer — tetapi untuk menghitung keliling Bumi, kita cukup memakai π sampai belasan digit saja! 🌍",
  },
  "mat-uang-satuan": {
    worked: "Contoh soal: Sepatu seharga Rp200.000 didiskon 25%. Harga yang dibayar … Langkah 1: hitung diskonnya: 25% × 200.000 = Rp50.000. Langkah 2: kurangkan dari harga awal: 200.000 − 50.000. Langkah 3: yang dibayar = Rp150.000. 👟",
    vocab: "🏷️ diskon = potongan harga\n📈 untung = harga jual − harga beli\n📉 rugi = harga beli − harga jual (bila jual lebih murah)\n⚖️ 1 kg = 1.000 g; 1 km = 1.000 m\n⏰ 1 jam = 60 menit; 1 liter = 1.000 mL",
    fact: "Tahukah kamu? Kata 'rupiah' berasal dari bahasa Sanskerta 'rupyakam' yang artinya perak — logam yang dulu memang dipakai sebagai uang di Nusantara! 🪙",
  },
  "mat-aljabar": {
    worked: "Contoh soal: Jika 2x + 6 = 18, nilai x adalah … Langkah 1: kurangi kedua ruas dengan 6: 2x = 12. Langkah 2: bagi kedua ruas dengan 2: x = 6. Langkah 3: periksa: 2 × 6 + 6 = 18 ✔. 🔤",
    vocab: "🔤 variabel = huruf pengganti angka yang belum diketahui\n⚖️ persamaan = dua ruas yang nilainya sama\n📈 gradien = kemiringan garis (selisih y ÷ selisih x)\n🔀 substitusi = mengganti huruf dengan nilai/persamaan lain\n🗑️ eliminasi = menghilangkan satu variabel",
    fact: "Tahukah kamu? Kata 'aljabar' berasal dari judul kitab Al-Khawarizmi, 'Al-Jabr' — dan kata 'algoritma' berasal dari nama beliau sendiri. Satu ilmuwan, dua kata yang dipakai seluruh dunia sampai hari ini! 📚",
  },
  "mat-lanjut": {
    worked: "Contoh soal: Persamaan x² − 5x + 6 = 0. Hasil kali akar-akarnya … Langkah 1: kenali bentuk ax² + bx + c: a = 1, b = −5, c = 6. Langkah 2: hasil kali akar = c/a. Langkah 3: = 6/1 = 6. (Jumlah akarnya −b/a = 5; akarnya 2 dan 3 — cocok!) ✅",
    vocab: "🎯 diskriminan D = b² − 4ac (penentu jenis akar)\n🎲 peluang = kejadian dicari ÷ semua kemungkinan\n🔢 permutasi = susunan yang memperhatikan urutan\n🤲 kombinasi = pilihan tanpa memperhatikan urutan\n📉 turunan = laju perubahan sesaat (xⁿ → n·xⁿ⁻¹)",
    fact: "Tahukah kamu? Faktorial tumbuh luar biasa cepat: 52! (cara mengocok satu pak kartu) lebih besar daripada jumlah atom di seluruh alam semesta — makanya hampir mustahil dua kocokan kartu sama persis dalam sejarah! 🃏",
  },
  /* ---------- BAHASA ARAB ---------- */
  "arab-kosakata": {
    worked: "Contoh soal: Bahasa Arab dari 'buku' adalah … Langkah 1: ingat tema benda sekolah: buku adalah benda yang paling sering disebut. Langkah 2: قَلَمٌ adalah pena, مَدْرَسَةٌ adalah sekolah — bukan buku. Langkah 3: jadi buku = كِتَابٌ (kitābun). 📖",
    vocab: "📖 كِتَابٌ (kitābun) = buku\n✏️ قَلَمٌ (qalamun) = pena\n🏫 مَدْرَسَةٌ (madrasatun) = sekolah\n🔴 أَحْمَرُ (aḥmaru) = merah\n🔵 أَزْرَقُ (azraqu) = biru\n👨 أَبٌ (abun) = ayah\n👩 أُمٌّ (ummun) = ibu",
    fact: "Tahukah kamu? Bahasa Arab ditulis dari kanan ke kiri, dan kata-katanya banyak diserap ke Bahasa Indonesia: dunia, kabar, selamat, kursi, dan kitab semuanya berasal dari Bahasa Arab! 🌍",
  },
  "arab-dhamir-isyarah": {
    worked: "Contoh soal: Kata tunjuk yang tepat untuk مَدْرَسَةٌ adalah … Langkah 1: periksa akhir kata — مَدْرَسَةٌ berakhiran ة, tanda kata perempuan (muannats). Langkah 2: هٰذَا untuk laki-laki (mudzakkar), هٰذِهِ untuk perempuan. Langkah 3: jadi yang tepat هٰذِهِ مَدْرَسَةٌ. 👉",
    vocab: "👤 هُوَ (huwa) = dia laki-laki\n👩 هِيَ (hiya) = dia perempuan\n🙋 أَنَا (anā) = saya\n👥 نَحْنُ (naḥnu) = kami/kita\n👉 هٰذَا (hādzā) = ini (mudzakkar)\n👉 هٰذِهِ (hādzihi) = ini (muannats)\n🔤 mudzakkar = jenis laki-laki; muannats = jenis perempuan",
    fact: "Tahukah kamu? Tanda ة (ta marbuthah) hanya ada di akhir kata dan menjadi petunjuk paling mudah untuk mengenali kata perempuan dalam Bahasa Arab! 🔍",
  },
  "arab-angka-hari": {
    worked: "Contoh soal: Angka 7 dalam Bahasa Arab adalah … Langkah 1: berhitung urut: وَاحِدٌ 1, اِثْنَانِ 2, ثَلَاثَةٌ 3, أَرْبَعَةٌ 4, خَمْسَةٌ 5, سِتَّةٌ 6… Langkah 2: lanjutkan satu lagi sesudah enam. Langkah 3: angka 7 = سَبْعَةٌ (sab'atun). 🔟",
    vocab: "1️⃣ وَاحِدٌ (wāḥidun) = satu\n5️⃣ خَمْسَةٌ (khamsatun) = lima\n🔟 عَشَرَةٌ ('asyaratun) = sepuluh\n2️⃣0️⃣ عِشْرُونَ ('isyrūna) = dua puluh\n💯 مِائَةٌ (mi'atun) = seratus\n🕌 الْجُمُعَةُ (al-jumu'atu) = hari Jumat",
    fact: "Tahukah kamu? Angka yang kita pakai sehari-hari (0–9) disebut 'angka Arab' di Eropa karena diperkenalkan lewat dunia Islam — sedangkan di banyak negara Arab sendiri dipakai angka ١٢٣ yang disebut angka Arab Timur! 🔢",
  },
  "arab-nahwu": {
    worked: "Contoh soal: Kata yang menjadi majrur dalam kalimat ذَهَبْتُ إِلَى الْمَدْرَسَةِ adalah … Langkah 1: cari huruf jar dalam kalimat — إِلَى adalah huruf jar. Langkah 2: kata sesudah huruf jar selalu majrur (berharakat kasrah). Langkah 3: jadi yang majrur adalah الْمَدْرَسَةِ. 🧩",
    vocab: "🟢 mubtada = subjek di awal jumlah ismiyah\n🟢 khabar = keterangan mubtada\n🏃 fi'il = kata kerja\n👤 fa'il = pelaku pekerjaan\n🔗 huruf jar = فِي، إِلَى، مِنْ، عَلَى… (membuat kata sesudahnya kasrah)\n⏳ fi'il madhi = kata kerja lampau; mudhari = sekarang/akan",
    fact: "Tahukah kamu? Dalam Bahasa Arab, satu akar kata bisa melahirkan puluhan kata: dari akar K-T-B lahir kitab (buku), katib (penulis), maktab (kantor), dan maktabah (perpustakaan)! 🌳",
  },
  /* ---------- AGAMA ISLAM ---------- */
  "islam-rukun": {
    worked: "Contoh soal: Rukun Islam yang ketiga adalah … Langkah 1: urutkan rukun Islam: 1 syahadat, 2 salat, 3 zakat, 4 puasa, 5 haji. Langkah 2: hitung sampai urutan ketiga. Langkah 3: jawabannya ZAKAT. 🕌",
    vocab: "🕌 rukun Islam = 5 amalan pokok (syahadat, salat, zakat, puasa, haji)\n⭐ rukun Iman = 6 keyakinan pokok\n📿 syahadat = persaksian tiada tuhan selain Allah & Muhammad utusan-Nya\n🌙 puasa = menahan diri dari fajar sampai magrib\n🕋 haji = ibadah ke Makkah bagi yang mampu",
    fact: "Tahukah kamu? Salat lima waktu tersebar sepanjang hari seperti lima kali 'mengisi baterai' iman: Subuh, Zuhur, Asar, Magrib, dan Isya. Jaraknya diatur agar kita selalu ingat Allah di tengah kesibukan! 🔋",
  },
  "islam-malaikat-kitab": {
    worked: "Contoh soal: Malaikat yang bertugas menyampaikan wahyu adalah … Langkah 1: ingat pasangan malaikat–tugas: Mikail–rezeki, Israfil–sangkakala, Izrail–nyawa. Langkah 2: wahyu kepada para nabi disampaikan satu malaikat khusus. Langkah 3: jawabannya JIBRIL. 👼",
    vocab: "📨 Jibril = penyampai wahyu\n🌧️ Mikail = pembagi rezeki & hujan\n🎺 Israfil = peniup sangkakala\n⏳ Izrail = pencabut nyawa\n✍️ Raqib = pencatat amal baik; Atid = pencatat amal buruk\n❓ Munkar & Nakir = penanya di alam kubur",
    fact: "Tahukah kamu? Al-Qur'an diturunkan kepada Nabi Muhammad ﷺ lewat Malaikat Jibril selama kurang lebih 23 tahun — dimulai di Gua Hira saat beliau berusia 40 tahun. 🌙",
  },
  "islam-asmaul-sifat": {
    worked: "Contoh soal: Allah Maha Mengetahui adalah arti dari Asmaul Husna … Langkah 1: cocokkan arti: Ar-Rahman = Pengasih, Al-Malik = Raja, As-Sami' = Mendengar. Langkah 2: 'mengetahui' berakar kata 'ilmu — dalam Bahasa Arab 'alima. Langkah 3: jawabannya AL-'ALIM. ✨",
    vocab: "💗 Ar-Rahman = Maha Pengasih\n👑 Al-Malik = Maha Raja\n📚 Al-'Alim = Maha Mengetahui\n👂 As-Sami' = Maha Mendengar\n👀 Al-Bashir = Maha Melihat\n🤲 Al-Ghaffar = Maha Pengampun\n♾️ baqa = sifat wajib Allah: kekal",
    fact: "Tahukah kamu? Asmaul Husna berjumlah 99, dan menghafalkannya sambil memahami artinya membuat doa terasa lebih hidup — kita memanggil Allah dengan nama yang sesuai dengan kebutuhan kita. 🌟",
  },
  "islam-thaharah-salat": {
    worked: "Contoh soal: Jumlah rakaat salat Magrib adalah … Langkah 1: ingat pola rakaat: Subuh 2, Zuhur 4, Asar 4, Magrib 3, Isya 4. Langkah 2: Magrib adalah satu-satunya yang berjumlah ganjil tiga. Langkah 3: jawabannya 3 RAKAAT. 🌇",
    vocab: "💧 thaharah = bersuci\n🚿 wudu = membasuh anggota tertentu untuk hadas kecil\n🛁 mandi wajib = menghilangkan hadas besar\n🏜️ tayamum = bersuci dengan debu saat tidak ada air\n⚠️ najis mughallazhah = najis berat (anjing & babi): cuci 7×, satu dengan tanah\n🕌 rakaat = satu rangkaian berdiri–rukuk–sujud dalam salat",
    fact: "Tahukah kamu? Wudu yang kita lakukan sebelum salat juga dicontoh dunia kesehatan modern: membasuh tangan, wajah, dan kaki berkali-kali sehari terbukti menekan penyebaran kuman! 🧼",
  },
  "islam-puasa-zakat-haji": {
    worked: "Contoh soal: Zakat fitrah yang wajib dibayar setiap jiwa adalah … Langkah 1: ingat ukuran zakat fitrah dalam bahan makanan pokok. Langkah 2: ukurannya satu sha' ≈ 2,5 kg (sekitar 3,5 liter) beras. Langkah 3: jadi setiap jiwa membayar 2,5 KG bahan makanan pokok. 🌾",
    vocab: "🌙 puasa = menahan makan, minum & hawa nafsu\n🎁 zakat fitrah = 2,5 kg makanan pokok per jiwa\n💰 zakat mal = 2,5% harta yang mencapai nisab & haul\n⚖️ nisab = batas minimal harta wajib zakat (emas 85 g)\n📅 haul = kepemilikan genap satu tahun\n🕋 istitha'ah = kemampuan menunaikan haji",
    fact: "Tahukah kamu? Puasa Ramadan berpindah-pindah musim sepanjang hidup kita karena kalender Hijriah lebih pendek 11 hari dari kalender Masehi — dalam 33 tahun, Ramadan mengelilingi semua musim! 🔄",
  },
  "islam-quran-hadis": {
    worked: "Contoh soal: Surah terpanjang dalam Al-Qur'an adalah … Langkah 1: ingat jumlah ayat kandidat — Al-Fatihah hanya 7 ayat, Yaasiin 83 ayat. Langkah 2: surah kedua dalam mushaf memiliki 286 ayat, terbanyak. Langkah 3: jawabannya AL-BAQARAH. 📜",
    vocab: "📖 surah = kumpulan ayat (114 surah)\n📄 ayat = satuan terkecil surah\n📚 juz = pembagian Al-Qur'an (30 juz)\n🏙️ Makkiyah = surah turun sebelum hijrah\n🏡 Madaniyah = surah turun sesudah hijrah\n🗣️ hadis = perkataan, perbuatan & ketetapan Nabi ﷺ",
    fact: "Tahukah kamu? Al-Qur'an dihafal utuh oleh jutaan orang di dunia — termasuk anak-anak seusiamu. Tradisi hafalan ini menjaga teksnya tetap sama sejak lebih dari 1.400 tahun lalu! 🌟",
  },
  "islam-sejarah": {
    worked: "Contoh soal: Khalifah yang membukukan Al-Qur'an menjadi mushaf standar adalah … Langkah 1: ingat peran tiap khalifah: Abu Bakar mengumpulkan lembaran mushaf, Umar memperluas wilayah. Langkah 2: pembukuan standar resmi terjadi pada masa khalifah ketiga. Langkah 3: jawabannya UTSMAN BIN AFFAN — mushafnya disebut Mushaf Utsmani. 🏛️",
    vocab: "👑 khulafaur rasyidin = Abu Bakar, Umar, Utsman, Ali\n🏙️ ibu kota Umayyah = Damaskus; Abbasiyah = Baghdad\n📚 Baitul Hikmah = perpustakaan & pusat ilmu Baghdad\n🎓 Al-Azhar = universitas di Kairo warisan Fatimiyah\n➗ Al-Khawarizmi = penemu aljabar & penyebar angka 0",
    fact: "Tahukah kamu? Pada masa Abbasiyah, Baghdad adalah kota terbesar di dunia dan Baitul Hikmah menerjemahkan ilmu dari Yunani, Persia, dan India — fondasi bagi sains modern yang kamu pelajari di sekolah! 🌍",
  },
  "islam-muamalah": {
    worked: "Contoh soal: Dalam waris, seorang anak laki-laki dan seorang anak perempuan membagi harta 300 juta (setelah bagian lain selesai). Bagian anak laki-laki … Langkah 1: ingat perbandingan laki-laki : perempuan = 2 : 1, total bagian = 3. Langkah 2: nilai satu bagian = 300 ÷ 3 = 100 juta. Langkah 3: anak laki-laki mendapat 2 × 100 = Rp200 juta. 🤝",
    vocab: "📝 akad = perjanjian/kesepakatan jual beli\n🚫 riba = tambahan haram dalam utang-piutang\n❓ gharar = ketidakjelasan dalam akad\n🎲 maysir = perjudian/spekulasi untung-untungan\n🤝 mudharabah = kerja sama modal & pengelola, untung dibagi hasil\n⚖️ faraid = ilmu pembagian waris",
    fact: "Tahukah kamu? Prinsip bagi hasil dalam ekonomi Islam sudah dipraktikkan para pedagang Nusantara ratusan tahun lalu — sistem 'paroan' hasil panen antara pemilik sawah dan penggarap adalah contohnya! 🌾",
  },
  "islam-aliran": {
    worked: "Contoh soal: Aliran yang mengkafirkan pelaku dosa besar dan keluar dari barisan Ali bin Abi Thalib adalah … Langkah 1: ingat ciri tiap aliran: Mu'tazilah menonjolkan akal, Murji'ah menunda penilaian. Langkah 2: ciri 'keras & mengkafirkan' hanya dimiliki satu aliran. Langkah 3: jawabannya KHAWARIJ. 🧭",
    vocab: "🧠 Mu'tazilah = menonjolkan akal & keadilan Allah\n⚖️ Asy'ariyah = jalan tengah akal & wahyu (mayoritas Indonesia)\n⚔️ Khawarij = keras, mengkafirkan pelaku dosa besar\n⏸️ Murji'ah = menunda penilaian iman kepada Allah\n🎭 Jabariyah = manusia terpaksa oleh takdir\n🕊️ Qadariyah = manusia berkehendak bebas penuh",
    fact: "Tahukah kamu? Imam Asy'ari, pendiri Asy'ariyah, awalnya adalah murid terkemuka Mu'tazilah selama 40 tahun sebelum merumuskan jalan tengahnya — perdebatan ilmiah masa itu dilakukan dengan buku dan diskusi, bukan kekerasan. 📚",
  },
  /* ---------- AGAMA KRISTEN ---------- */
  "kristen-alkitab": {
    worked: "Contoh soal: Tokoh yang memimpin bangsa Israel keluar dari Mesir adalah … Langkah 1: ingat cerita Keluaran — Israel diperbudak di Mesir lalu dipimpin menyeberangi Laut Teberau. Langkah 2: Abraham adalah bapa orang beriman, Daud adalah raja — bukan pemimpin Keluaran. Langkah 3: jawabannya MUSA. ✝️",
    vocab: "📖 Perjanjian Lama = bagian Alkitab sebelum kelahiran Yesus\n📖 Perjanjian Baru = kehidupan Yesus & gereja mula-mula\n✉️ Injil = kabar baik: Matius, Markus, Lukas, Yohanes\n👑 Daud = raja Israel, penulis banyak Mazmur\n🕊️ Paulus = rasul pengabar Injil ke bangsa-bangsa",
    fact: "Tahukah kamu? Alkitab adalah buku yang paling banyak diterjemahkan di dunia — sudah tersedia dalam lebih dari 700 bahasa lengkap, termasuk banyak bahasa daerah di Indonesia! 🌍",
  },
  "kristen-ajaran": {
    worked: "Contoh soal: Hari raya Kristen yang memperingati kebangkitan Yesus adalah … Langkah 1: urutkan peristiwa: Natal = kelahiran, Jumat Agung = penyaliban. Langkah 2: kebangkitan terjadi tiga hari sesudah penyaliban. Langkah 3: jawabannya PASKAH. 🕊️",
    vocab: "🎄 Natal = kelahiran Yesus\n✝️ Jumat Agung = peringatan penyaliban Yesus\n🌅 Paskah = kebangkitan Yesus (hari raya terpenting)\n☁️ Kenaikan = Yesus naik ke surga (40 hari sesudah Paskah)\n🔥 Pentakosta = turunnya Roh Kudus (50 hari sesudah Paskah)\n🍎 Buah Roh = kasih, sukacita, damai, kesabaran…",
    fact: "Tahukah kamu? Kata 'Paskah' berhubungan dengan perayaan bangsa Israel yang mengenang keluarnya mereka dari Mesir — dua perayaan besar ini saling terhubung dalam sejarah Alkitab! 📖",
  },
  /* ---------- BAHASA ---------- */
  "ing-vocab": {
    worked: "Worked example: 'What is the opposite of ancient?' Step 1: recall the meaning — ancient = sangat tua (very old). Step 2: the opposite of very old is very new. Step 3: the answer is MODERN. Remember: learn opposites as pairs and you double your vocabulary! 🔤",
    vocab: "🔄 opposite = lawan kata (big >< small)\n🟰 synonym = persamaan kata (rapid = fast)\n🔢 number words = twenty-one … ninety-nine\n📏 smallest = paling kecil nilainya\n↔️ between = di antara dua nilai\n🧩 arrange = menyusun (huruf/kata)",
    fact: "Did you know? English has more words than almost any other language — over 170,000 words in current use — because it happily borrows words from other languages, including Indonesian words like 'bamboo' and 'orangutan'! 🦧",
  },
  "ing-grammar": {
    worked: "Worked example: 'The children … to school yesterday.' (go) Step 1: find the time signal — 'yesterday' means past. Step 2: the past form of 'go' is irregular: went (not 'goed'). Step 3: 'The children went to school yesterday.' ✅",
    vocab: "⏳ past tense = bentuk lampau (went, ate, bought)\n👥 irregular plural = children, teeth, men\n🔇 passive voice = be + V3 (was written)\n📍 since = titik awal (since 2019)\n⏱️ for = durasi (for two years)\n🔀 conditional type 2 = If I were you, I would…",
    fact: "Did you know? The verb 'set' has the most meanings in English — hundreds of them! Context is king: 'set the table', 'the sun sets', 'a set of keys' all mean different things. 👑",
  },
  "indo-kata": {
    worked: "Contoh soal: Antonim kata 'hemat' adalah … Langkah 1: ingat arti hemat = cermat memakai uang/barang. Langkah 2: lawan sifat cermat adalah suka menghamburkan. Langkah 3: jawabannya BOROS. 🗣️",
    vocab: "🔄 antonim = lawan kata\n🟰 sinonim = persamaan kata\n📜 peribahasa = ungkapan kiasan berisi nasihat\n💬 'berat sama dipikul, ringan sama dijinjing' = gotong royong\n🗣️ 'tong kosong nyaring bunyinya' = banyak bicara, sedikit ilmu",
    fact: "Tahukah kamu? Bahasa Indonesia memiliki ribuan peribahasa, dan banyak di antaranya memakai alam Nusantara: 'air', 'padi', 'perahu', dan 'hutan' muncul berulang kali karena nenek moyang kita hidup dekat dengan alam. 🌾",
  },
  "indo-baku-teks": {
    worked: "Contoh soal: Kata baku dari 'apotik' adalah … Langkah 1: ingat aturan KBBI — kata serapan disesuaikan ejaannya. Langkah 2: 'apotik' memakai akhiran -ik yang tidak baku untuk kata ini. Langkah 3: bentuk bakunya APOTEK. ✍️",
    vocab: "📖 kata baku = kata sesuai KBBI (apotek, nasihat, jadwal)\n✂️ kalimat efektif = hemat, jelas, subjek-predikat tegas\n💡 gagasan utama = inti paragraf (awal/deduktif, akhir/induktif)\n🌞 metafora = perbandingan langsung ('engkau matahariku')\n🌊 simile = perbandingan dengan seperti/bagai\n🎭 personifikasi = benda diberi sifat manusia",
    fact: "Tahukah kamu? KBBI terus bertambah: setiap edisi baru memuat ribuan kata baru dari bahasa daerah dan teknologi — bahasa Indonesia adalah bahasa yang hidup dan terus tumbuh! 🌱",
  },
  "jawa-basa": {
    worked: "Contoh soal: Krama saka tembung 'turu' yaiku … Langkah 1: ingat pasangan ngoko–krama untuk kegiatan sehari-hari. Langkah 2: turu (tidur) versi hormatnya bukan 'tilem' biasa untuk orang tua/guru. Langkah 3: jawabannya SARE. 🗨️",
    vocab: "🗨️ ngoko = tingkat tutur akrab/sebaya\n🙏 krama = tingkat tutur hormat\n🍚 mangan → nedha/dhahar = makan\n😴 turu → sare = tidur\n🏠 omah → dalem = rumah\n💧 banyu → toya = air\n🙋 aku → kula = saya",
    fact: "Tahukah kamu? Bahasa Jawa adalah bahasa daerah dengan penutur terbanyak di Indonesia — lebih dari 60 juta orang! Tingkat tuturnya yang halus mencerminkan budaya hormat yang dijaga turun-temurun. 🌾",
  },
  "jawa-aksara-tembang": {
    worked: "Contoh soal: Tembang macapat yang berwatak ringan dan lucu, cocok untuk anak, adalah … Langkah 1: ingat watak tiap tembang: Maskumambang sedih, Asmaradana cinta. Langkah 2: tembang pendek penutup rangkaian macapat terkenal jenaka. Langkah 3: jawabannya PUCUNG. 📜",
    vocab: "🔤 aksara Jawa (hanacaraka) = 20 aksara dasar\n🎵 tembang macapat = puisi tradisional beraturan\n📏 guru gatra = jumlah baris per bait\n🎶 guru lagu = bunyi akhir tiap baris\n🔢 guru wilangan = jumlah suku kata tiap baris\n💬 paribasan = peribahasa Jawa",
    fact: "Tahukah kamu? Urutan hanacaraka menyimpan cerita legenda Aji Saka tentang dua pengawal setia: 'hana caraka, data sawala, padha jayanya, maga bathanga' — ada utusan, mereka bertengkar, sama kuatnya, keduanya gugur. ⚔️",
  },
  "kor-dasar": {
    worked: "Contoh soal: Angka 'tiga' dalam sistem Sino-Korea adalah … Langkah 1: ingat dua sistem angka: Sino dipakai untuk tanggal & uang. Langkah 2: hitung Sino: 일 (il) 1, 이 (i) 2, 삼 (sam) 3. Langkah 3: jawabannya 삼 (sam). 🇰🇷",
    vocab: "🔤 Hangul = aksara Korea per blok suku kata\n🔢 Sino-Korea = 일 이 삼 사 오 (tanggal, uang, menit)\n🔢 asli Korea = 하나 둘 셋 (benda, umur)\n🏷️ partikel 이/가 = penanda subjek\n🎯 partikel 을/를 = penanda objek\n🔚 kata kerja selalu di akhir kalimat",
    fact: "Tahukah kamu? Hangul dirancang Raja Sejong pada 1443 dan dianggap salah satu aksara paling ilmiah di dunia — bentuk hurufnya meniru bentuk mulut dan lidah saat mengucapkannya! 👅",
  },
  "jpn-dasar": {
    worked: "Contoh soal: Partikel penanda topik kalimat dalam Bahasa Jepang adalah … Langkah 1: ingat tiga partikel dasar: は topik, を objek, に arah/waktu. Langkah 2: soal menanyakan topik, bukan objek. Langkah 3: jawabannya は — dibaca 'wa' khusus sebagai partikel! 🇯🇵",
    vocab: "🔤 Hiragana = aksara untuk kata asli Jepang\n🔤 Katakana = aksara untuk kata serapan asing\n🈳 Kanji = karakter dari Tiongkok (山 gunung, 川 sungai)\n🏷️ partikel は (wa) = penanda topik\n🎯 partikel を (o) = penanda objek\n🧭 partikel に (ni) = arah/waktu\n🙇 -masu = bentuk sopan kata kerja",
    fact: "Tahukah kamu? Kanji 山 (gunung) benar-benar digambar dari tiga puncak gunung, dan 川 (sungai) dari aliran air — banyak kanji adalah gambar yang disederhanakan selama ribuan tahun! 🏔️",
  },
  "man-dasar": {
    worked: "Contoh soal: Kata 'mǎ' (nada ketiga) berarti … Langkah 1: ingat empat nada berpasangan: mā ibu, má rami, mǎ …, mà memarahi. Langkah 2: nada ketiga turun-naik seperti lembah. Langkah 3: mǎ = KUDA 🐴. Hati-hati, satu nada mengubah arti!",
    vocab: "🎵 nada 1 = datar tinggi (mā ibu)\n🎵 nada 2 = naik (má rami)\n🎵 nada 3 = turun-naik (mǎ kuda)\n🎵 nada 4 = turun tajam (mà memarahi)\n📏 kata ukur 本 (běn) = untuk buku\n🐾 kata ukur 只 (zhī) = untuk hewan\n🔤 的 (de) = penanda milik",
    fact: "Tahukah kamu? Satu suku kata 'ma' dengan empat nada berbeda bisa berarti ibu, rami, kuda, atau memarahi — Bahasa Mandarin adalah bahasa paling bernada di antara bahasa besar dunia! 🎶",
  },
  /* ---------- IPS, PPKn, INFORMATIKA ---------- */
  "ips-geografi": {
    worked: "Contoh soal: Ibu kota Provinsi Sulawesi Selatan adalah … Langkah 1: ingat pasangan pulau–ibu kota besar: Sulawesi Selatan adalah provinsi terbesar di Sulawesi bagian selatan. Langkah 2: Manado itu Sulawesi Utara, Palu itu Sulawesi Tengah. Langkah 3: jawabannya MAKASSAR. 🗺️",
    vocab: "🗺️ provinsi = daerah tingkat I dipimpin gubernur\n🏙️ ibu kota = pusat pemerintahan daerah\n🧭 38 provinsi di Indonesia\n🏝️ IKN Nusantara = ibu kota negara baru di Kalimantan Timur\n🌋 kepulauan = gugusan pulau-pulau",
    fact: "Tahukah kamu? Indonesia adalah negara kepulauan terbesar di dunia dengan lebih dari 17.000 pulau — kalau kamu mengunjungi satu pulau setiap hari, butuh lebih dari 46 tahun untuk menghabiskan semuanya! 🏝️",
  },
  "ips-sejarah": {
    worked: "Contoh soal: Kerajaan maritim terbesar di Nusantara yang berpusat di Palembang adalah … Langkah 1: ingat ciri khasnya: maritim = kekuatan laut & perdagangan, pusat di Sumatera. Langkah 2: Majapahit berpusat di Jawa Timur dan agraris-maritim, Kutai di Kalimantan dan tertua. Langkah 3: jawabannya SRIWIJAYA. ⛵",
    vocab: "⛵ maritim = berhubungan dengan laut & pelayaran\n👑 kerajaan = negara dipimpin raja\n🗿 prasasti = tulisan pada batu peninggalan sejarah\n🤴 Gajah Mada = mahapatih Majapahit (Sumpah Palapa)\n📜 Sumpah Palapa = tekad menyatukan Nusantara\n🦸 pahlawan = pejuang pembela bangsa",
    fact: "Tahukah kamu? Pelaut-pelaut Nusantara dari Sulawesi berlayar sampai Australia ratusan tahun sebelum orang Eropa — mereka berdagang teripang dengan penduduk asli Australia! ⛵",
  },
  "ips-ekonomi": {
    worked: "Contoh soal: Saat panen raya, harga cabai biasanya … Langkah 1: panen raya berarti barang MELIMPAH (penawaran besar). Langkah 2: hukum pasar: barang melimpah → pembeli mudah memilih → harga turun. Langkah 3: jawabannya TURUN. 🌶️",
    vocab: "🏭 produksi = kegiatan membuat barang/jasa\n🚚 distribusi = kegiatan menyalurkan\n🛒 konsumsi = kegiatan memakai/menghabiskan\n📈 inflasi = kenaikan harga umum terus-menerus\n📦 ekspor = menjual ke luar negeri; impor = membeli dari luar\n🤝 koperasi = badan usaha berasas kekeluargaan (Moh. Hatta)",
    fact: "Tahukah kamu? Uang kertas Indonesia memuat gambar pahlawan dan kekayaan alam — memeriksa uang adalah pelajaran sejarah dan geografi gratis di dompetmu! 💵",
  },
  "ppkn-pancasila": {
    worked: "Contoh soal: Lambang sila keempat Pancasila adalah … Langkah 1: urutkan lambang: 1 bintang, 2 rantai, 3 pohon beringin, 4 … Langkah 2: sila keempat berbunyi tentang musyawarah/perwakilan, dilambangkan hewan kuat yang hidup berkelompok. Langkah 3: jawabannya KEPALA BANTENG. 🇮🇩",
    vocab: "⭐ sila 1 = bintang (Ketuhanan)\n⛓️ sila 2 = rantai (Kemanusiaan)\n🌳 sila 3 = pohon beringin (Persatuan)\n🐂 sila 4 = kepala banteng (Musyawarah)\n🌾 sila 5 = padi & kapas (Keadilan sosial)\n🦅 Bhinneka Tunggal Ika = berbeda-beda tetapi tetap satu",
    fact: "Tahukah kamu? Jumlah bulu Garuda Pancasila menyimpan tanggal kemerdekaan: sayap 17 helai, ekor 8 helai, dan leher 45 helai — 17-8-45! 🦅",
  },
  "tik-tk": {
    worked: "Contoh soal: Alat yang dipakai untuk menggerakkan panah di layar komputer adalah … Langkah 1: ingat tugas tiap alat: keyboard untuk mengetik, speaker untuk suara. Langkah 2: panah (kursor) digerakkan dengan tangan memegang alat kecil di meja. Langkah 3: jawabannya MOUSE. 🖱️",
    vocab: "🖱️ mouse = penggerak panah (kursor) di layar\n⌨️ keyboard = papan untuk mengetik\n🖥️ monitor = layar penampil gambar & tulisan\n🔊 speaker = pengeras suara\n🖨️ printer = pencetak ke kertas\n🔋 charger = pengisi daya baterai",
    fact: "Tahukah kamu? Mouse komputer pertama dibuat dari KAYU pada tahun 1964 — bentuknya kotak dengan roda kecil, dan dinamakan 'mouse' karena kabelnya mirip ekor tikus! 🐭",
  },
  "tik-dasar": {
    worked: "Contoh soal: Bilangan biner 1010 dalam desimal adalah … Langkah 1: beri nilai tempat dari kanan: 1, 2, 4, 8. Langkah 2: kalikan dengan digitnya: 1×8 + 0×4 + 1×2 + 0×1 = 8 + 0 + 2 + 0. Langkah 3: hasilnya 10. 💻",
    vocab: "🧠 CPU = otak pemroses komputer\n💾 RAM = ingatan jangka pendek komputer\n⌨️ hardware = perangkat keras; software = perangkat lunak\n0️⃣1️⃣ biner = bahasa komputer berbasis 0 dan 1\n📋 algoritma = langkah-langkah logis menyelesaikan masalah\n🎣 phishing = penipuan pencuri data lewat pesan/situs palsu",
    fact: "Tahukah kamu? Komputer pertama seukuran ruangan besar dan jauh lebih lemah daripada HP di sakumu — HP modern jutaan kali lebih cepat daripada komputer yang membawa manusia ke Bulan! 🚀",
  },
  "tik-smp": {
    worked: "Contoh soal: Di spreadsheet, rumus untuk menghitung rata-rata nilai pada sel B2 sampai B6 adalah … Langkah 1: ingat fungsi rata-rata bernama AVERAGE dan semua rumus diawali '='. Langkah 2: rentang sel ditulis dengan titik dua: B2:B6. Langkah 3: rumusnya =AVERAGE(B2:B6). 🧮",
    vocab: "🖥️ sistem operasi = pengatur komputer (Windows, Linux, Android)\n🔲 sel (cell) = pertemuan baris & kolom spreadsheet\n🧮 =SUM menjumlahkan; =AVERAGE merata-rata\n🔷 belah ketupat flowchart = simbol keputusan\n🔐 2FA = autentikasi dua langkah pengaman akun\n🦠 ransomware = malware pengunci data penebus uang",
    fact: "Tahukah kamu? Kata 'bug' untuk kesalahan program berasal dari serangga sungguhan: pada 1947, seekor ngengat ditemukan terjepit di dalam komputer Harvard dan menyebabkan gangguan! 🦋",
  },
  "tik-sma": {
    worked: "Contoh soal: Perintah SQL untuk mengambil semua data siswa dari tabel 'siswa' adalah … Langkah 1: ingat perintah pengambil data bernama SELECT dan '*' berarti semua kolom. Langkah 2: nama tabel ditulis sesudah FROM. Langkah 3: SELECT * FROM siswa. 👨‍💻",
    vocab: "🗄️ record = satu baris data; field = satu kolom\n🔑 primary key = identitas unik tiap baris\n🔗 foreign key = penghubung antar tabel\n🔍 SELECT = perintah mengambil data (SQL)\n🌐 DNS = penerjemah nama domain menjadi alamat IP\n🧩 dekomposisi = memecah masalah besar menjadi kecil",
    fact: "Tahukah kamu? Alamat IPv4 yang hanya 4 oktet sudah hampir habis untuk seluruh dunia — karena itu diciptakan IPv6 dengan jumlah alamat yang lebih banyak daripada butir pasir di semua pantai Bumi! 🏖️",
  },
  /* ---------- SEJARAH ---------- */
  "sej-simbol": {
    worked: "Contoh soal: Bendera pusaka Indonesia dijahit oleh … Langkah 1: ingat kisah Proklamasi 1945 — bendera pertama dikibarkan di Jalan Pegangsaan Timur. Langkah 2: bendera itu dijahit tangan oleh istri Presiden Soekarno. Langkah 3: jawabannya IBU FATMAWATI. 🇮🇩",
    vocab: "🚩 Merah Putih = merah berani, putih suci\n🎵 Indonesia Raya = lagu kebangsaan ciptaan W.R. Supratman\n🦅 Garuda Pancasila = lambang negara\n📅 17 Agustus 1945 = Hari Kemerdekaan\n👨 Ir. Soekarno = presiden pertama Indonesia",
    fact: "Tahukah kamu? Bendera pusaka asli jahitan Ibu Fatmawati kini disimpan sangat hati-hati dan hanya dikeluarkan pada upacara istimewa — yang dikibarkan setiap tahun di Istana adalah duplikatnya, agar yang asli tidak rusak. 🚩",
  },
  "sej-kerajaan": {
    worked: "Contoh soal: Kerajaan Hindu tertua di Indonesia adalah … Langkah 1: cari peninggalan tertua: prasasti Yupa berbentuk tiang batu di Kalimantan Timur. Langkah 2: Yupa berasal dari abad ke-4, lebih tua dari Sriwijaya dan Majapahit. Langkah 3: jawabannya KERAJAAN KUTAI. 👑",
    vocab: "🗿 prasasti Yupa = bukti Kerajaan Kutai\n⛵ Sriwijaya = kerajaan maritim Palembang\n🛕 Borobudur = peninggalan Mataram Kuno\n🤴 Gajah Mada = mahapatih Majapahit\n📜 Sumpah Palapa = tekad persatuan Nusantara\n🕌 Demak = kerajaan Islam pertama di Jawa",
    fact: "Tahukah kamu? Candi Borobudur sempat terkubur abu vulkanik dan hutan selama ratusan tahun sebelum ditemukan kembali pada 1814 — ia adalah candi Buddha terbesar di dunia! 🛕",
  },
  "sej-pahlawan": {
    worked: "Contoh soal: Pahlawan yang memimpin Perang Jawa (1825–1830) adalah … Langkah 1: ingat perang terbesar melawan Belanda di Jawa pada abad ke-19. Langkah 2: pemimpinnya seorang pangeran dari Yogyakarta yang bergerilya di hutan dan gua. Langkah 3: jawabannya PANGERAN DIPONEGORO. 🦸",
    vocab: "🦸 Pattimura = pahlawan Maluku (Ambon)\n🌺 Martha Christina Tiahahu = pejuang remaja Nusalaut\n⚔️ Diponegoro = pemimpin Perang Jawa\n🌹 Cut Nyak Dien = pejuang Aceh\n📚 R.A. Kartini = pelopor pendidikan perempuan (Jepara)\n🎖️ Jenderal Sudirman = panglima perang gerilya (Purbalingga)",
    fact: "Tahukah kamu? Martha Christina Tiahahu ikut berperang pada usia 17 tahun — seusia kakak kelas SMA — dan kisahnya diabadikan sebagai nama kapal perang TNI AL. ⚓",
  },
  "sej-penjajahan": {
    worked: "Contoh soal: VOC didirikan pada tahun … Langkah 1: susun garis waktu: Portugis merebut Malaka 1511, Belanda tiba 1596. Langkah 2: kongsi dagang Belanda dibentuk beberapa tahun sesudah kedatangan pertama. Langkah 3: VOC berdiri tahun 1602. ⛵",
    vocab: "🏢 VOC = kongsi dagang Belanda (1602)\n🌶️ monopoli = penguasaan tunggal perdagangan\n🛣️ Daendels = pembangun Jalan Raya Anyer–Panarukan\n📖 Raffles = penguasa Inggris, penulis History of Java\n🌾 Tanam Paksa (1830) = sistem Van den Bosch yang menyengsarakan rakyat",
    fact: "Tahukah kamu? Rempah-rempah seperti pala dari Kepulauan Banda dulu harganya lebih mahal daripada emas — itulah alasan kapal-kapal Eropa berlomba berlayar ke Nusantara. 🌰",
  },
  "sej-pergerakan-proklamasi": {
    worked: "Contoh soal: Sumpah Pemuda diikrarkan pada tanggal … Langkah 1: ingat Kongres Pemuda II di Jakarta tahun 1928. Langkah 2: hari Sumpah Pemuda diperingati setiap akhir Oktober. Langkah 3: jawabannya 28 OKTOBER 1928. ✊",
    vocab: "🌅 Budi Utomo (1908) = awal Kebangkitan Nasional\n🗣️ Sumpah Pemuda = satu tanah air, bangsa, bahasa\n🏛️ BPUPKI = badan perumus dasar negara (1945)\n📜 PPKI = pengesah UUD 1945 (18 Agustus 1945)\n🎙️ Proklamasi = pernyataan kemerdekaan 17 Agustus 1945\n🤝 KMB 1949 = pengakuan kedaulatan oleh Belanda",
    fact: "Tahukah kamu? Naskah Proklamasi diketik oleh Sayuti Melik pada malam 17 Agustus 1945, dan teks aslinya sempat hampir terbuang — diselamatkan oleh wartawan B.M. Diah dari keranjang sampah! 📜",
  },
  "sej-modern": {
    worked: "Contoh soal: Peristiwa Supersemar terjadi pada tahun … Langkah 1: letakkan pada garis waktu: G30S terjadi 1965, Orde Baru dimulai sesudahnya. Langkah 2: surat perintah itu ditandatangani 11 Maret setahun sesudah G30S. Langkah 3: jawabannya 1966. 🏙️",
    vocab: "📜 Dekrit Presiden 1959 = kembali ke UUD 1945\n⚠️ G30S (1965) = peristiwa terbunuhnya para jenderal TNI AD\n✉️ Supersemar (1966) = surat perintah 11 Maret\n🏗️ Repelita = rencana pembangunan lima tahun Orde Baru\n🌊 Reformasi (1998) = era perubahan sesudah Orde Baru",
    fact: "Tahukah kamu? Pemilu 1955 dianggap salah satu pemilu paling demokratis dalam sejarah Indonesia — diikuti 29 partai dan jutaan pemilih pertama kalinya, hanya 10 tahun sesudah merdeka. 🗳️",
  },
  "sej-dunia": {
    worked: "Contoh soal: Perang Dunia II di Eropa dimulai ketika Jerman menyerbu … Langkah 1: ingat awal PD II: 1 September 1939. Langkah 2: negara pertama yang diserbu Jerman adalah tetangganya di timur. Langkah 3: jawabannya POLANDIA. 🌍",
    vocab: "🏺 Mesopotamia = peradaban di antara Sungai Tigris–Eufrat\n⚙️ Revolusi Industri = perubahan produksi ke mesin (Inggris)\n💥 PD I (1914–1918) = dipicu pembunuhan Franz Ferdinand\n✈️ Pearl Harbor (1941) = serangan Jepang ke pangkalan AS\n❄️ Perang Dingin = ketegangan AS vs Uni Soviet\n🧱 Tembok Berlin runtuh 1989 = tanda akhir Perang Dingin",
    fact: "Tahukah kamu? Yuri Gagarin (1961) mengorbit Bumi hanya dalam 108 menit — satu kali putaran penuh mengelilingi planet kita lebih cepat daripada durasi satu pertandingan sepak bola! ⚽",
  },
  /* ---------- PAKET KOMPETISI ---------- */
  "komp-nalaria": {
    worked: "Contoh soal gaya Nalaria: Ibu membeli 3 pak permen, tiap pak berisi 12 permen. Diberikan 7 permen kepada tetangga. Sisa permen … Langkah 1: hitung total dulu: 3 × 12 = 36. Langkah 2: kurangi yang diberikan: 36 − 7. Langkah 3: sisanya 29 permen. Cerita selalu dipecah menjadi langkah kecil! 🏆",
    vocab: "📖 soal cerita = matematika bersembunyi dalam kalimat\n🔍 diketahui = angka yang diberikan soal\n❓ ditanyakan = yang harus dicari\n➗ sisa pembagian = yang tidak habis dibagi (harus < pembagi)\n⭕ himpunan = kumpulan anggota (hati-hati hitung ganda)\n⚖️ rata-rata = total ÷ banyaknya",
    fact: "Tahukah kamu? Olimpiade matematika nalaria melatih 'number sense' — kepekaan terhadap angka. Anak yang terbiasa soal cerita terbukti lebih mudah memahami matematika tingkat lanjut di SMP dan SMA! 🔢",
  },
  "komp-kanguru-math": {
    worked: "Contoh soal gaya Kanguru: Sari berdiri ke-5 dari depan dan ke-4 dari belakang dalam antrean. Berapa anak dalam antrean? Langkah 1: gambar antreannya: ●●●● S ●●●. Langkah 2: Sari terhitung dua kali bila dijumlah biasa (5 + 4 = 9). Langkah 3: kurangi 1: 5 + 4 − 1 = 8 anak. 🦘",
    vocab: "🧍 antrean = urutan dari depan + dari belakang − 1\n📄 lipatan kertas = lapisan berlipat dua tiap lipatan\n🧭 arah mata angin = Utara–Timur–Selatan–Barat\n🔄 putaran = 90° seperempat, 180° setengah, 360° penuh\n🧊 kubus satuan = balok kecil penyusun bangun ruang",
    fact: "Tahukah kamu? Kompetisi Kanguru Matematika diikuti lebih dari 6 juta siswa di hampir 100 negara setiap tahun — soal yang sama dikerjakan anak-anak di seluruh dunia pada hari yang berdekatan! 🌍",
  },
  "komp-kanguru-bahasa": {
    worked: "Contoh soal gaya Kanguru Bahasa: Urutan abjad yang benar dari kata 'melon, mangga, markisa' adalah … Langkah 1: huruf pertama semua 'm' — lanjut ke huruf kedua: e, a, a. Langkah 2: 'mangga' dan 'markisa' sama-sama 'ma', bandingkan huruf ketiga: n < r, jadi mangga lebih dulu. Langkah 3: urutannya mangga, markisa, melon. 📚",
    vocab: "🔤 urutan abjad = membandingkan huruf demi huruf\n👏 suku kata = potongan bunyi kata (se-ko-lah = 3)\n🔁 pola huruf = huruf sama → simbol sama (susu = ABAB)\n🧩 kata tersembunyi = kata di dalam kata lain\n✏️ kalimat rumpang = kalimat berlubang yang diisi kata paling logis",
    fact: "Tahukah kamu? Kata terpanjang dalam KBBI salah satunya adalah 'mempertanggungjawabkan' — 22 huruf! Coba tepuk suku katanya: mem-per-tang-gung-ja-wab-kan = 8 suku kata. 👏",
  },
};



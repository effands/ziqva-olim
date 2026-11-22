# Data Plan

## Context provenance
- `analisa video ini, dan bantu saya merancang sebuah web responsive yang tujuannya adalah melatih anak-anak TK sampai SMA untuk menjawab soal-soal olimpiade sesuai tingkatann jenjang pendidikan, baik sma, smk, man, sma, madrasah setara smp dan juda sd negeri, Madrasah ibtidaiyah, sekolah kristen, kelas cambridge dll` (verbatim user request; defines scope: all jenjang TK-SMA/SMK/MA, all school types)
- `pelajari dari video itu, itu hanya contoh soal anak TK olimpiade bahasa inggris, buat semua mata pelajaran ada olimpiadenya baik itu bhs inggrism matematika, ipa, sains sejara , bhs jawa dan semua mata pelajaran islam, kristen lengkapi aja` (verbatim; video is TK English example, expand to all subjects)
- `pastika responsive di hp, laptop ,tablet, nama aplikasi nya ZIQVA OLIM` (verbatim; responsive + name)
- Video analysis (builder-extracted frames from user-supplied mp4, 705s, portrait screen recording of saintisnasional.id Olimpiade Nasional PAUD/TK Season 6): format = 20 soal pilihan ganda A/B/C, timer countdown ~20:00, sticky progress `0/20`, audio player per soal (listening), tipe soal TK English: smallest number, arrange letters (T-E-W-N-T-Y-T-O-W), complete the word, number between, picture sequencing daily activities; skor akhir besar `60 (12/20 benar)` + pesan motivasi + review soal. ZIQVA OLIM replicates this exact pattern (timer, progress, audio dengarkan soal, skor akhir, review) and scales it to all jenjang/mapel.

## Tested sources
### User video (local file)
**Used by**: design reference for quiz engine (client UI pattern only, no server fetch)
**Test command**: `ffprobe + ffmpeg fps=1/60 frame extraction, read 4 frames`
**Sample output**: Q1 smallest number 7,13,17,21,24,27,30; Q2 arrange letters; picture-sequence breakfast question; final score 60 (12/20)
**Processing**: Pattern extracted manually; all ZIQVA questions are ORIGINAL authored questions in the same style, not copied from the video/site.

### Built-in question bank (authored, client-side static data)
**Used by**: quiz engine (no action fetch needed for questions)
**Test command**: n/a — authored curriculum-style olympiad questions verified by builder knowledge (math/science facts are standard textbook facts)
**Sample output**: e.g. TK English: smallest number, letter arranging, daily activity sequence (mirroring video types with new numbers/words); SD Matematika: pola bilangan, pecahan; SMP IPA: fotosintesis, gaya; SMA Fisika/Kimia/Biologi, Sejarah, PAI, Kristen, B. Jawa, B. Arab, Informatika, PPKn, IPS
**Processing**: Bank structured as jenjang (TK, SD, SMP, SMA) x mapel with 5 soal per paket, each with 4 options (3 for TK), correct index, and pembahasan. School-type filter (Umum/Negeri, Madrasah, Kristen, Cambridge) gates mapel availability.

### Akun Guru & Orang Tua (edit 2026-11-22)
**Used by**: login guru/orang tua untuk pantau skor anak (verbatim user request: `Tambah login guru & orang tua untuk pantau skor anak`)
**Processing**: Tabel baru `users` (nama, username unik, password_hash sha256+salt, role guru/orangtua, organization), `sessions` (token sesi, disimpan di localStorage perangkat), `watched_students` (daftar pantau guru/orang tua), `student_codes` (Kode Pantau 6 karakter per nama peserta, dibuat saat latihan pertama selesai dan ditampilkan di layar hasil + Prestasiku peserta). Menambahkan peserta ke daftar pantau WAJIB memasukkan Kode Pantau yang cocok — guru hanya memantau murid di daftar kelasnya sendiri, orang tua hanya anak di daftarnya; tidak ada akses ke data semua anak. `attempts.device_id` membatasi `listAttempts` (Prestasiku) hanya ke latihan dari perangkat itu sendiri. Kata sandi tidak pernah disimpan/dikirim dalam bentuk asli selain saat login/daftar.

## Long-term data behavior- **Refresh policy**: No external refresh; question bank is static authored content. Attempt history persists in DB and loads on open.
- **Growth**: One row per completed quiz in `attempts` table (jenjang, mapel, skor, benar, total, durasi detik, created_at). Unbounded but small.
- **Ordering**: History newest first; dashboard aggregates total latihan, rata-rata, skor terbaik.
- **Time semantics**: created_at is insertion instant, rendered viewer-local.

## Rejected approaches
- **Tried**: Fetching live questions from saintisnasional.id or other olympiad sites
  **Why rejected**: Login/paywall, copyright, unreliable; original authored bank in the same format is honest and self-contained.
- **Tried**: One-question-per-screen only
  **Why rejected**: Video uses scrollable list + sticky HUD; hybrid chosen: focused one-by-one with palette navigation gives same HUD (progress + timer) with better phone UX for kids.

### Soal acak prosedural + Level + Bahasa baru + Bahan Belajar + Rewards (edit 2026-11-22)
**Used by**: permintaan user berurutan: soal jangan template & selalu random/fresh (ratusan–ribuan per jenjang), contoh soal lain + Bahasa Jawa diperbanyak + Bahasa Korea/Jepang/Mandarin, menu Bahan Belajar dari dasar per mapel, rewards (poin/bintang/lencana/streak), sesi menjadi **20 soal** (menggantikan 15, mengikuti video referensi 20 soal × 1 menit), audio TTS harus bunyi di HP, animasi welcome, efek suara klik WebAudio + toggle ON/OFF, dan Level kesulitan 1–5 dengan progres naik level (skor 80+).
**Processing**:
- `client/src/data/generators.ts`: generator prosedural per jenjang×mapel×level. Soal hitungan (matematika, fisika, kimia pH, zakat, biner, peluang, gradien, turunan, log, kombinasi, dll.) jawabannya DIHITUNG kode dari parameter acak. Soal hafalan memakai bank pasangan/fakta kurikulum umum (kosakata EN/AR/Jawa/Korea/Jepang/Mandarin dengan aksara asli Hangul/Kana-Kanji/Hanzi+pinyin, malaikat, asmaul husna, sila-lambang, provinsi-ibu kota, dinasti, tokoh-karya, enzim, organel, OSI, akad, aliran, dll.) dengan pengecoh disampling berbeda tiap soal dan jendela materi bergeser per level (dasar→lanjut). Kombinasi parameter × sampling pengecoh × acak posisi opsi menghasilkan ratusan–ribuan variasi per kombinasi.
- `buildSession()` di `questions.ts`: mencampur bank tertulis (level menurut urutan soal) + hasil generator, dedupe per sesi (20 soal unik), posisi opsi diacak, dan memprioritaskan soal yang belum pernah keluar di perangkat (riwayat di localStorage `ziqva-seen-v1`, maks 600 kunci per kombinasi).
- Level 1 Pemula – 5 Ahli Olimpiade per jenjang×mapel; progres (level terbuka + skor terbaik per level) di localStorage `ziqva-levels-v1`; Mode Ujian mengunci level di atas yang terbuka, Mode Latihan bebas; skor ≥80 membuka level berikutnya.
- Rewards di localStorage `ziqva-rewards-v1`: poin (10/benar + bonus), bintang = total jawaban benar, streak hari beruntun, 11 lencana pencapaian; tampil di beranda, layar hasil, dan Prestasiku.
- Bahan Belajar (`client/src/data/materials.ts`): materi original tulisan sendiri dari pengetahuan umum kurikulum untuk semua 25 mapel (termasuk Korea/Jepang/Mandarin), berisi konsep dasar bertahap, fokus per jenjang, dan tips — bukan salinan teks situs lain.
- Audio: TTS dipanggil dari klik user, `speechSynthesis.resume()` + tunggu `voiceschanged`, pilih suara per bahasa soal (id-ID, en-US, jv-ID, ko-KR, ja-JP, zh-CN, ar-SA) dengan fallback suara default, rate 0,95, status visual "Sedang dibacakan…", pesan bantuan bila TTS tak didukung / suara OFF. Efek klik/jawaban benar-salah dibuat WebAudio API (tanpa file), volume rendah aman anak. Toggle Suara ON/OFF (header + HUD kuis) di localStorage `ziqva-sound`, default ON, mematikan semua suara. Tidak ada autoplay bersuara; sambutan welcome hanya berbunyi bila tombolnya diketuk.

### Reset Semua (edit 2026-11-22)
**Used by**: permintaan user verbatim: `oiya buat kan versi reset nya, biar nanti klo orang tua coba test dan cocok, ada tombol reset semua` — orang tua/guru coba-coba dulu, lalu mulai bersih untuk anak.
**Processing**: Tombol "🗑️ Reset Semua" di Beranda + "Zona Reset" di Prestasiku membuka modal konfirmasi dalam halaman (bukan `confirm()` yang tidak jalan di iframe) yang mewajibkan mengetik `RESET`. Aksi server baru `resetAllData` menghapus `attempts` milik `device_id` perangkat ini, menghapus `student_codes` yatim (nama yang sudah tidak punya riwayat di perangkat mana pun), dan bila ada token Guru/Ortu: mengosongkan `watched_students` akun itu + menghapus sesi tokennya. Klien lalu menghapus localStorage `ziqva-rewards-v1`, `ziqva-levels-v1`, `ziqva-seen-v1`, `ziqva-sound`, `ziqva-olim-token`, memutar `device_id` baru, dan mereset state (poin/bintang/streak/lencana 0, level kembali 1, nama kosong, suara ON, welcome tampil lagi). Akun Guru/Ortu di server TIDAK dihapus (tetap bisa login lagi); perangkat lain tidak terpengaruh.

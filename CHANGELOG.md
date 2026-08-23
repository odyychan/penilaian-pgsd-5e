# 📜 Changelog

Dokumentasi seluruh pembaruan, perbaikan, dan peningkatan fitur pada Sistem Peer-Assessment PGSD Kelas 5E FKIP Universitas Lambung Mangkurat.

---

## [2.1.14] - 2026-08-23

### 🎯 Dropdown Peran Penilai & Dynamic Section Rendering
- **Refactoring Pemilih Peran Menjadi Dropdown (`<select>`):**
  - Mengubah antarmuka pemilih peran penilai di Langkah 1 (Identitas Penilai) dari bentuk tab/radio button menjadi elemen dropdown pilihan tunggal yang elegan, ringkas, dan mobile-friendly.
- **Dynamic Section Rendering Berdasarkan Pilihan Dropdown:**
  - **Mahasiswa:** Menampilkan kontainer penginputan NIM terlebih dahulu beserta validasi real-time database kelas dan auto-fill nama lengkap penilai.
  - **Dosen & Lainnya/Tamu:** Menyembunyikan field NIM dan langsung menampilkan field input Nama Lengkap dan Email resmi.
- **Sinkronisasi Draf Penyimpanan:**
  - Nilai dropdown tersimpan dan dipulihkan secara otomatis melalui *auto-save local draft engine*.

---

## [2.1.13] - 2026-08-23

### 🎓 Smart Role-Based Evaluator Identity, NIM Auto-Lookup & Precision Submission Presensi
- **Pilihan Peran Penilai Cerdas (Mahasiswa, Dosen, Lainnya/Tamu):**
  - Menambahkan switcher peran penilai modern di Langkah 1 formulir penilaian dengan opsi segmented tab yang ramah sentuhan (*touch-friendly*).
- **Alur Validasi Instan NIM & Auto-Fill Nama Mahasiswa:**
  - Untuk peran **Mahasiswa**, sistem mewajibkan penginputan NIM dan secara instan melakukan pencocokan ke database master kelas PGSD 5E (`groupsData`).
  - Menampilkan lencana verifikasi hijau `✓ Terverifikasi` beserta informasi kelompok asal dan sesi saat NIM valid.
  - Otomatis mengisi (*auto-fill*) field **Nama Lengkap Penilai** dan menyarankan email resmi institusi (`@mhs.ulm.ac.id`), dengan tetap memberikan kebebasan kepada mahasiswa untuk menyunting nama secara manual jika ada koreksi ejaan/gelar.
  - Memberikan umpan balik validasi yang ramah dan informatif jika NIM belum terdaftar.
- **Alur Penilai Dosen & Tamu:**
  - Untuk peran **Dosen** dan **Lainnya / Tamu**, field input NIM otomatis disembunyikan/dilewati.
  - Nama dan email dapat langsung diisi secara fleksibel tanpa hambatan validasi NIM.
- **Pemisahan & Presisi 100% Status Pengisian Presensi:**
  - Validasi status pengisian form mahasiswa kelas dievaluasi secara ketat berdasarkan **NIM** dan **Peran Mahasiswa**, menjamin akurasi persentase kehadiran tanpa terdistorsi.
  - Menambahkan bagian khusus terpisah **`👨‍🏫 Dosen & Penilai Tamu Terdata`** pada sub-tab presensi untuk merangkum masukan dari dosen pengampu dan penilai tamu.
- **Pembaruan Backend Apps Script & Portal Admin:**
  - Memperbarui `submitAssessment()`, `getRecapData()`, dan `adminGetResponsesList()` di [`Code.gs`](file:///e:/Data/GitHub/Project%20Dede/Code.gs) untuk mencatat serta menyajikan kolom `Peran` dan `NIM Penilai`.
  - Memperbarui antarmuka log respons di [`admin.html`](file:///e:/Data/GitHub/Project%20Dede/admin.html) dengan badge peran visual dan pencarian terpadu.

---

## [2.1.12] - 2026-08-23

### 📋 Penambahan Fitur Presensi Pengisian Form Penilaian & Zoom 2D Pan-Scroll
- **Fitur Status Pengisian / Presensi Penilaian Mahasiswa (📋 Status Pengisian):**
  - Menambahkan sub-tab ke-3 pada dashboard rekapitulasi untuk memantau kehadiran dan partisipasi penilaian dari seluruh mahasiswa kelas 5E secara komprehensif.
  - **Statistik Metrik Ringkas:** Menampilkan kartu ringkasan real-time untuk *Total Mahasiswa Kelas*, *Sudah Mengisi Form* (dengan persentase & badge hijau), dan *Belum Mengisi Form* (dengan persentase & badge amber).
  - **Filter Multi-Kriteria & Pencarian Cepat:** Memungkinkan penyaringan data berdasarkan Sesi/Minggu, Kelompok Asal Mahasiswa, Status Form (✓ Sudah Mengisi vs ⏳ Belum Mengisi), serta kotak pencarian instan nama dan NIM.
  - **Tabel Presensi Interaktif:** Menampilkan daftar nama mahasiswa lengkap beserta NIM, kelompok, sesi, dan status pengisian.
- **Arsitektur Zoom 2D Pan-Scroll Dokumen (Mobile S/M/L):**
  - Memperbaiki pembungkus dokumen pratinjau (#printScrollContainer dan #printableReportWrapper) dengan sinkronisasi dimensi fisik berbasis piksel nyata (scaledWidth = 760 * scale dan scaledHeight = baseHeight * scale) serta 	ransform-origin: top left.
  - Mengeliminasi kendala *scroll lock* / *centering cutoff* pada layar smartphone sempit, sehingga saat dokumen diperbesar (zoom in 50% - 150%), pengguna dapat menggeser (*pan/scroll*) secara bebas secara horizontal dan vertikal ke seluruh penjuru lembar kerja.
  - Mode tombol Fit tetap menghitung skala otomatis pas layar ponsel secara instan.
- **Presisi 100% WYSIWYG Antara Preview Layar & Hasil PDF:**
  - Menghilangkan kebocoran kelas responsif CSS Tailwind (sm:grid-cols-2, dll.) di dalam kanvas lembar kerja A4, menggantinya dengan styling grid inline murni (epeat(2, minmax(0, 1fr))).
  - Menjamin tampilan pratinjau di layar mobile 320px identik 1:1 tanpa perbedaan sedikitpun dengan dokumen PDF A4 yang dicetak.

---

## [2.1.11] - 2026-08-23

### 🖥️ Optimalisasi Tata Letak Tablet & Desktop Widescreen Serta Pencegahan Teks Patah
- **Pelebaran Kontainer Utama (max-w-7xl & lg:px-8):** Memperluas lebar kontainer header navigasi, area konten utama (<main>), dan footer dari batas sempit max-w-5xl (1024px) menjadi max-w-7xl (1280px+) dengan padding adaptif (px-4 sm:px-6 lg:px-8). Hal ini mengeliminasi celah hitam/abu-abu berlebih di sisi samping kiri dan kanan pada layar Tablet (landscape/portrait), Laptop, dan Desktop monitor.
- **Pencegahan Teks Patah/Turun Baris pada Kartu Kelompok (whitespace-nowrap):**
  - Mengunci nama kelompok (${grp.kelompok}) agar selalu berada pada satu baris utuh dan tidak patah menjadi dua baris (misal: "Kelompok" lalu "1" di bawahnya).
  - Mengunci teks label badge skor RATA-RATA dan PENILAI dengan whitespace-nowrap agar tidak patah menjadi "Rata-" dan "RATA".
  - Menetapkan min-w-0 flex-1 pada pembungkus judul serta lex-shrink-0 pada kotak metrik skor.
- **Penyelarasan Grid Kartu Rekapitulasi:**
  - Grid kelompok (#rekapKelompokContainer): grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5.
  - Grid individu mahasiswa (#rekapIndividuContainer): grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5.
- **Sinkronisasi Portal:** Penyesuaian kontainer yang sama diterapkan secara konsisten pada [index.html](file:///e:/Data/GitHub/Project%20Dede/index.html) dan [dmin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html).

---

## [2.1.10] - 2026-08-23

### 📱 Optimalisasi Responsivitas Mobile-First (Mobile S/M/L) Pratinjau Dokumen
- **Adaptive Mobile Auto-Fit Scaling:** Mengimplementasikan kalkulator skala dinamis (calcAutoFitScale()) yang otomatis menghitung rasio lebar layar perangkat mobile (rentang 320px - 425px / layar non-reguler) terhadap dimensi lembar kertas A4 standar (760px).
- **Eliminasi Pemotongan Teks di Layar Sempit:** Membungkus kanvas dokumen ke dalam pembungkus responsif (printableReportWrapper) dengan 	ransform-origin: top center dan sinkronisasi tinggi adaptif sehingga seluruh elemen dokumen (Kop Surat, tabel, catatan evaluasi, tanda tangan) tampil utuh 100% tanpa terpotong di tepi kanan.
- **Penyelarasan Target Sentuh & Tata Letak Mobile:**
  - Header modal pratinjau dan kontrol zoom dibuat ringkas dengan tombol aksi berukuran minimal 40px untuk kenyamanan sentuhan (*touch-first*).
  - Tombol footer cetak disusun vertikal / peregangan responsif (*full-width touch targets*) di perangkat mobile.
  - Sinkronisasi penuh pada portal mahasiswa ([index.html](file:///e:/Data/GitHub/Project%20Dede/index.html)) dan portal pengelola ([dmin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html)).

---

## [2.1.9] - 2026-08-23

### 📄 Penerapan Arsitektur Virtual Paper & Zoom Engine (SIPENA-Dev Inspired)
- **Komponen Virtual Paper Sheet Dinamis:** Mengadopsi arsitektur lembar kertas virtual (Virtual Paper Component) terstandarisasi dengan dimensi proporsional A4 (max-w-[760px], padding: 18px 20px, dan bayangan dokumen nyata).
- **Toolbar Kontrol Skala & Zoom Interaktif:** Menambahkan toolbar pengatur skala pratinjau (Zoom In [+], Zoom Out [-], dan Reset Scale [Fit]) pada header modal pratinjau cetak untuk memudahkan pemeriksaan dokumen pada berbagai ukuran layar.
- **Penyelarasan Margin & Breather Space:** Memberikan ruang bernapas (*breathing room*) yang ideal pada sisi kanan dan kiri tabel metadata dan tabel penilaian sehingga tidak terjadi pemotongan tepian dokumen (*edge clipping*).

---

## [2.1.8] - 2026-08-23

### 🎯 Presisi 100% WYSIWYG Antara Modal Preview & Save as PDF
- **Pelebaran Kanvas Modal (max-w-5xl):** Memperluas dialog modal pratinjau cetak agar lembar dokumen A4 (794px) dapat tampil utuh tanpa terhimpit atau terpotong secara horizontal.
- **Pencegahan Wrap Teks Dosen Pengampu (white-space: nowrap):** Mengunci nama dan gelar lengkap dosen pengampu (Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.) agar selalu berada pada satu baris lurus tanpa patah/turun baris, baik pada modal pratinjau layar maupun pada dialog *Save as PDF*.
- **Kanvas Kertas A4 Otentik (*Authentic Document Sheet*):** Menyelaraskan padding lembar dokumen (24px 28px), bayangan dokumen (*box-shadow*), dan border presisi sehingga apa yang dilihat di modal preview 100% identik dengan hasil cetak PDF.

---

## [2.1.7] - 2026-08-23

### 🔍 Verifikasi Remote Headless & Sinkronisasi Presisi 100% Cetak PDF
- **Pengujian Remote Komprehensif (Playwright & Headless Chromium):** Telah dilakukan verifikasi visual dan struktural langsung pada kedua halaman ([index.html](file:///e:/Data/GitHub/Project%20Dede/index.html) dan [dmin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html)).
- **Inisialisasi Nilai Filter Default:** Memastikan nilai awal filter kelompok dan sesi selalu tervalidasi ke "ALL" saat modal cetak dibuka untuk mencegah status kosong pada pratinjau tabel admin.
- **Konsistensi Struktur & Layout 1:1:** Memastikan previewEl.innerHTML === printRoot.innerHTML bernilai 	rue (100% identik tanpa perbedaan DOM), serta memastikan file PDF fisik A4 memiliki margin bersih, tanpa pemotongan teks, dan proporsi kop serta tanda tangan yang sempurna.

---

## [2.1.6] - 2026-08-23

### 🛑 Penonaktifan Otomatisasi Deploy Vercel (Mode Pengembangan Lokal)
- **Nonaktifkan Git Auto-Deployment:** Menambahkan konfigurasi "git": { "deploymentEnabled": false } dan "ignoreCommand": "exit 0" pada file [ercel.json](file:///e:/Data/GitHub/Project%20Dede/vercel.json) untuk menghentikan build & publish otomatis ke Vercel setiap kali ada commit/push ke GitHub, guna menghemat kuota limit akun Vercel selama masa pengembangan lokal.

---

## [2.1.5] - 2026-08-23

### 📑 Penyelarasan Presisi 1:1 Modal Preview & Hasil Cetak PDF
- **Konsistensi Tampilan Preview Lembar A4:** Menstandarkan kontainer modal preview dengan kanvas kertas A4 berlatar belakang putih bersih, border presisi, dan bayangan dokumen nyata (*authentic paper preview*) sehingga 100% konsisten dengan dialog *Save as PDF*.
- **Auto-Scroll Reset ke Kop Surat:** Mengaktifkan inisialisasi reset posisi scroll (scrollTop = 0) saat modal cetak dibuka maupun saat filter kelompok/sesi diubah, memastikan Kop Surat dan judul laporan selalu tampak pertama kali di bagian atas.
- **Pencegahan Wrap Teks Metadata:** Mengoptimalkan distribusi lebar kolom pada tabel metadata identitas laporan (Mata Kuliah & Dosen Pengampu) agar nama dan gelar dosen tidak terpotong canggung pada mode cetak.

---

## [2.1.4] - 2026-08-23

### 📏 Penyesuaian Presisi Ukuran Font Standard Dokumen Cetak
- **Standarisasi Ukuran Font Isi Konten (12px):** Menyelaraskan seluruh teks tabel rekapitulasi data nilai, metadata mata kuliah, dan butir catatan evaluasi kualitatif mahasiswa ke ukuran standar 12px demi keterbacaan optimal.
- **Standarisasi Kop Surat (Proporsi 14 Basis):** Menyesuaikan proporsi teks kementerian, institusi ULM (16px), fakultas (14px), dan prodi (13px) dengan logo resmi 76px dan garis pembatas dinas ganda.
- **Standarisasi Lembar Pengesahan & TTD (12px):** Mengunci ukuran tanggal, jabatan pengampu, nama dosen penandatangan (12px), dan NIP (11px monospace).

---

## [2.1.3] - 2026-08-23

### 🏛️ Standarisasi Kop Surat Dinas & Penyelarasan Hierarki Tipografi Dokumen
- **Eliminasi Celah Atas Dokumen:** Menyesuaikan konfigurasi margin atas @page menjadi  mm serta meniadakan offset awal kontainer root sehingga dokumen tercetak tepat di batas atas margin fisik A4 tanpa celah kosong.
- **Standarisasi Kop Surat Akademik FKIP ULM:** 
  - Menerapkan tata letak resmi dinas perguruan tinggi berfont *Times New Roman*.
  - Menyesuaikan proporsi nama kementerian, institusi Universitas Lambung Mangkurat, Fakultas Keguruan dan Ilmu Pendidikan, dan Program Studi PGSD.
  - Mempertegas garis pembatas ganda (*double line*) standar dinas resmi (3px tebal atas & 1px tipis bawah).
- **Standarisasi Ukuran Font Dokumen:** 
  - Memperjelas ukuran font tabel metadata, header tabel, isi data rekapitulasi, dan kartu evaluasi kualitatif mahasiswa.
  - Memperbaiki kejelasan teks lembar pengesahan, tanda tangan dosen, serta footer metadata cetak.

---

## [2.1.2] - 2026-08-23

### 🖨️ Optimalisasi Tata Letak & Celah Ruang Cetak (*Print Canvas Optimization*)
- **Penyelarasan Margin Halaman:** Menyesuaikan margin @page guna mengeliminasi celah ruang putih berlebih (*excess whitespace gaps*) pada dialog cetak browser.
- **Peningkatan Proporsi Konten Cetak:** Mengoptimalkan ukuran font, padding sel tabel, dan ruang kartu evaluasi agar mengisi kanvas kertas A4 secara penuh dan proporsional.
- **Penyelarasan Kop Surat & Logo:** Menyesuaikan ukuran logo ULM menjadi 76px dan menyelaraskan jarak garis pembatas kop resmi agar tampak seimbang dan padat.

---

## [2.1.1] - 2026-08-23

### 🖨️ Cetak & Format Dokumen Laporan Rekapitulasi Resmi
- **Logo Resmi ULM:** Menambahkan lambang resmi Universitas Lambung Mangkurat pada sisi kiri Kop Surat laporan cetak.
- **Garis Pembatas Kop Standar Dinas:** Mengimplementasikan standar garis ganda (*double-line*) kop dinas akademik resmi (garis tebal atas dan garis tipis bawah).
- **Perbaikan Nama Dosen & Tanda Tangan:** Mengoptimalkan perataan dan pembungkusan nama dosen beserta gelar lengkap agar tampil rapi pada satu baris dengan garis bawah tunggal yang proporsional.
- **Peningkatan Ruang Tanda Tangan:** Memperluas area fisik tanda tangan dan cap stempel institusi menjadi 75px.
- **Perlindungan Pemotongan Halaman (*Page Break Protection*):** Menerapkan aturan reak-inside: avoid pada setiap kartu evaluasi, baris tabel, dan blok pengesahan agar tidak terpotong canggung saat pencetakan multi-halaman.
- **Pencegahan Teks Terpotong (*Non-breaking Formatting*):** Menerapkan format spasi tanpa putus (*non-breaking space*) pada perolehan suara presentator terbaik agar tidak menimbulkan kata menggantung (*orphan word*).

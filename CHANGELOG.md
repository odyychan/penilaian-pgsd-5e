# 📜 Changelog

Dokumentasi seluruh pembaruan, perbaikan, dan peningkatan fitur pada Sistem Peer-Assessment PGSD Kelas 5E FKIP Universitas Lambung Mangkurat.

---

## [2.1.92] - 2026-08-24

### 🚀 Ergonomic Mobile Floating Action Dock & Zero-Clutter Workspace
- **Floating Action Dock di Layar Mobile (*Thumb-Friendly Touch Ergonomics*):**
  - Memindahkan seluruh tombol kontrol Form Builder (`Undo/Redo`, `Riwayat`, `Publikasikan`, `Pratinjau`, `Tambah Pertanyaan`, `Tambah Bagian`) ke **Floating Bottom Dock (`fixed bottom-3`)** yang elegan dan melayang di jangkauan ibu jari.
  - Menghilangkan sepenuhnya header bertumpuk di bagian atas pada layar ponsel sehingga **100% ruang pandang layar ponsel bebas terbuka** untuk membaca, mengedit teks, dan mengelola opsi pertanyaan.
- **Tampilan Desktop & Tablet Tetap Presisi:**
  - Tetap menyajikan Sticky Toolbar 2-tier yang elegan dan stabil di layar desktop dan laptop tanpa saling mengganggu.

---

## [2.1.91] - 2026-08-24

### 📐 Ultra-Compact Sticky Form Builder Toolbar & Mobile Space Optimization
- **Pengurangan Jejak Vertikal Hingga 50% di Mobile (*Ultra-Compact Design*):**
  - Mengurangi tinggi Sticky Toolbar Form Builder menjadi hanya ~65px di layar ponsel sehingga ruang pandang untuk membaca dan menyunting kartu pertanyaan menjadi jauh lebih luas dan nyaman.
  - Menghilangkan scrollbar sistem horizontal yang kaku dengan utilitas `no-scrollbar` untuk pengalaman navigasi sentuh yang mulus.
- **Micro Status Bar & Sleek Action Strip:**
  - Status judul, badge, dan kontrol aksi utama tersusun ramping dengan tipografi mikro yang tajam dan proporsional.

---

## [2.1.90] - 2026-08-24

### 🛡️ 2-Tier Anti-Collision Sticky Form Builder Toolbar & Cross-Device Responsive Layout
- **Arsitektur 2-Tier Terisolasi (*Zero Overlap & Zero Collision*):**
  - Memisahkan area judul & badge status (**Tier 1**) dari baris tombol kontrol aksi (**Tier 2**) dengan batas garis pemisah yang tegas.
  - Menghilangkan sepenuhnya potensi tombol melompat ke atas badge atau teks pada seluruh resolusi laptop/tablet maupun tingkat zoom peramban.
- **Responsivitas Sempurna di Layar Mobile (Mobile-S 320px, Mobile-M 375px, Mobile-L 412px):**
  - Mengatur tombol kontrol utama dalam grid 2×2 yang seimbang dan lapang dengan target sentuh $\ge 44 	imes 44	ext{ px}$.
  - Tombol Undo, Redo, dan Riwayat tersusun dalam toolstrip tersendiri yang ringkas di samping tombol aksi.

---

## [2.1.89] - 2026-08-24

### 📌 Sticky Floating Builder Toolbar & Single-Row Status Badge Alignment
- **Penataan Rapi Badge Status (*Single-Row Alignment*):**
  - Menata `Susunan Pertanyaan`, `[ 4 Bagian • 5 Pertanyaan ]`, dan badge `[ 🟢 Form Aktif ]` / `[ 🟡 Draf Belum Terbit ]` sejajar dalam satu baris horisontal yang menyatu dan rapi tanpa ada baris bertumpuk canggung.
- **Toolbar Form Builder Sticky Melayang (*Always Accessible on Scroll*):**
  - Panel kontrol Form Builder (tombol **`Publikasikan`**, **`Pratinjau`**, **`Undo/Redo`**, **`Riwayat`**, **`Tambah Pertanyaan`**, dan **`Tambah Bagian`**) kini melayang mulus di bagian atas (*sticky top-16 z-30 with glassmorphism backdrop-blur*).
  - Admin dapat men-*scroll* hingga pertanyaan terakhir tanpa kehilangan akses ke tombol aksi utama formulir.

---

## [2.1.88] - 2026-08-24

### ⏪ Ctrl+Z Undo / Redo Engine & Form Revision History (Google Forms Style)
- **Mesin Undo / Redo Global (*Ctrl+Z & Ctrl+Y Support*):**
  - Mendukung pintasan keyboard global `Ctrl + Z` (atau `Cmd + Z`) untuk mengurungkan aksi dan `Ctrl + Y` / `Ctrl + Shift + Z` untuk mengulangi aksi di Form Builder.
  - Menghadirkan tombol toolbar **`↺ Urungkan`** dan **`↻ Ulangi`** di header Form Builder yang aktif secara dinamis sesuai tumpukan riwayat (*undo/redo stack up to 30 states*).
  - Bekerja pada semua aksi: penambahan pertanyaan/bagian, penghapusan, duplikasi, perubahan urutan/posisi, dan perubahan tipe pertanyaan.
- **Panel Histori Revisi Formulir (*Form Version History Modal*):**
  - Tombol **`📜 Riwayat`** di header Form Builder membuka modal kronologi versi formulir.
  - Menampilkan rekaman versi, timestamp, jumlah bagian, dan jumlah pertanyaan.
  - Tombol **`Pulihkan Versi Ini` (*Restore Version*)**: Mengembalikan formulir ke snapshot versi sebelumnya dalam 1-klik dengan notifikasi toast konfirmasi.

---

## [2.1.87] - 2026-08-24

### 🛡️ Comprehensive UI Polish, Zero Redundancy & Full Mobile S/M/L Responsive Audit
- **Pembersihan Redundansi & Duplikasi Teks (*Zero Redundancy*):**
  - Menghapus teks `+` ganda pada seluruh tombol header dan tombol bawah bagian sehingga teks menjadi bersih dan profesional (`Tambah Pertanyaan`, `Tambah Bagian`, `Tambah Pertanyaan ke Bagian X`).
- **Peningkatan Kontras & Keterbacaan Badge Status:**
  - Badge status draf kini menggunakan `bg-amber-100 text-amber-950 border-amber-400 font-bold` sehingga kontras dan terbaca tajam tanpa silau.
  - Badge status aktif menggunakan `bg-emerald-100 text-emerald-950 border-emerald-400 font-bold`.
- **Audit Presisi Tata Letak Multi-Perangkat (Mobile S/M/L, Tablet, Desktop, 4K):**
  - Mengatur susunan 4 tombol utama Form Builder menjadi grid 2×2 yang rapi di layar ponsel (*Mobile S 320px, Mobile M 375px, Mobile L 412px*) dan horizontal sejajar di layar Tablet/Desktop.
  - Seluruh target sentuh tombol memenuhi standar aksesibilitas $\ge 44 	imes 44	ext{ px}$ dan terbebas dari tumpang tindih (*zero overlap*).

---

## [2.1.86] - 2026-08-24

### 🧹 Form Builder Simplification, Natural Human Text & "Judul & Deskripsi Teks" Block
- **Penyederhanaan Total Alur Form Builder (*Clean & Minimalist Google Forms Style*):**
  - Membersihkan toolbar header Form Builder dari tombol-tombol template yang membingungkan, menyisakan hanya 4 aksi utama yang jelas dan terarah: **`🚀 Publikasikan`**, **`👁️ Pratinjau`**, **`+ Pertanyaan`**, dan **`+ Bagian`**.
  - Alur vertikal kanvas menjadi lebih lapang, bersih, dan sangat mudah dipahami pengguna awam.
- **Tipe Komponen Baru: `📄 Judul & Deskripsi Teks` (*Informational Text Block*):**
  - Menyediakan blok teks panduan/informasi kustom (bukan pertanyaan responden).
  - Admin dapat mengisi judul panduan dan deskripsi penjelasan yang tampil rapi di formulir mahasiswa tanpa kolom isian jawaban.
- **Audit & Perombakan Teks Alami (*Natural Human Tone*):**
  - Mengganti seluruh kalimat kaku / berbau *AI-generated* dengan bahasa Indonesia yang sederhana, komunikatif, dan langsung ke sasaran.

---

## [2.1.85] - 2026-08-24

### 📐 Popover Overflow Fix, Internal Smooth Scroll & Smart Viewport Positioning
- **Penanganan Terpotong (*Zero Clipping & Overflow Fix*):**
  - Menghapus pembatas `overflow-hidden` pada kartu bagian (*stage card*) sehingga menu popover dapat mengambang bebas di atas batas kartu tanpa terpotong.
  - Menambahkan batas tinggi `max-h-72 sm:max-h-80` dengan scrollbar internal yang halus (`overflow-y-auto custom-scrollbar`) sehingga seluruh 13 tipe pertanyaan dapat diakses dengan mudah.
- **Penempatan Cerdas Menyesuaikan Layar (*Smart Dynamic Positioning*):**
  - Menu popover secara otomatis mendeteksi ruang kosong di layar: akan mengambang ke atas (*pop upward*) jika berada di dekat batas bawah layar, atau mengambang ke bawah (*pop downward*) jika ruang di bawah mencukupi.

---

## [2.1.84] - 2026-08-24

### 💎 Modern-Minimalist Custom Popover Menu & Universal Dropdown Refinement
- **Custom Floating Popover Question Type Menu (*Pure SVG & Zero Emoji*):**
  - Menggantikan elemen `<select>` dropdown bawaan browser yang kaku dan tidak rapi dengan **Custom Floating Popover Menu** yang modern, bersih, dan elegan.
  - Dikelompokkan dengan rapi:
    - **Tipe Pertanyaan Standar:** Pilihan Ganda, Kotak Centang, Dropdown Pilihan, Jawaban Singkat, Paragraf / Ulasan, Skala Linier (1-5), dan Upload Berkas Drive.
    - **Komponen Sistem Perkuliahan:** Identitas & Peran Penilai, Pemilihan Kelompok, Nilai Presentasi (Skor), Voting Presentator Terbaik, Evaluasi Masukan, dan Teks Informasi.
  - Menggunakan ikon **100% SVG murni** yang presisi dengan tanda centang biru pada tipe yang sedang aktif.
- **Universal Modern-Minimalist Select Styling:**
  - Seluruh elemen `<select>` dropdown di seluruh aplikasi (`admin.html` dan `index.html`) dipercantik dengan custom SVG chevron down, rounded corners (0.75rem), subtle hover & focus rings, dan padding presisi.

---

## [2.1.83] - 2026-08-24

### 🔍 Multi-Point Rating Scale Labels, "Lainnya" Options & 100% End-to-End Form Sync
- **Penyempurnaan Skala Linier Multi-Point (*Customizable Multi-Point Rating Labels*):**
  - Kini **setiap angka skala dari 1 sampai 5 (atau 1 s.d. 10) memiliki kolom input teks labelnya masing-masing**:
    - `1:` [ Sangat Kurang / Tidak Sesuai ]
    - `2:` [ Kurang / Cukup Kurang ]
    - `3:` [ Cukup / Sedang ]
    - `4:` [ Baik / Sesuai ]
    - `5:` [ Sangat Baik / Sangat Sesuai ]
  - Pada formulir mahasiswa (`index.html`) dan simulator, setiap tombol rating menampilkan label deskriptif spesifik di bawah angkanya.
- **Pilihan Ganda & Kotak Centang dengan Opsi "Lainnya" (*Other Option Support*):**
  - Tombol **`+ Tambahkan opsi "Lainnya"`** memungkinkan responden mengetik jawaban terbuka bebas jika pilihan yang disediakan tidak mencukupi.
- **Sinkronisasi 100% Penuh ke Formulir Mahasiswa Saat Di-Publish:**
  - Menekan **`🚀 Publikasikan Perubahan`** langsung menyinkronkan seluruh tahapan dinamis, pertanyaan kustom, opsi ganda, dan skala nilai ke formulir mahasiswa (`index.html`).

---

## [2.1.82] - 2026-08-24

### ⚡ 1-Click Zero-Modal Question & Section Creation (Google Forms Direct Workflow)
- **Pembuatan Pertanyaan & Bagian 1-Klik Langsung di Kanvas (*Zero-Modal Experience*):**
  - Menghapus seluruh jendela pop-up / modal konfigurasi yang menyusahkan saat menambah pertanyaan atau bagian.
  - Mengklik **`+ Tambah Pertanyaan`** kini **langsung menyisipkan kartu pertanyaan baru seketika di kanvas** dengan judul awal *"Pertanyaan tanpa judul"* dan opsi *"○ Opsi 1"*.
  - Layar otomatis menyorot dan mengaktifkan kursor (*auto-focus & select*) pada kolom judul pertanyaan sehingga admin dapat langsung mengetik, mengganti tipe dari dropdown kartu, atau menambah opsi tanpa jeda.
  - Mengklik **`+ Tambah Bagian`** kini **langsung menyisipkan kartu bagian baru seketika di kanvas** dan langsung siap diketik judulnya.
- **Konfigurasi 100% di Tempat (*In-Place Configuration*):**
  - Seluruh pengaturan cakupan, tipe input, teks opsi, dan parameter pertanyaan dilakukan 100% langsung pada kartu yang bersangkutan tanpa perlu membuka popup terpisah.

---

## [2.1.81] - 2026-08-24

### 🚀 Draft vs Published Workflow & Interactive Live Form Simulator
- **Alur Kerja Draf vs Publikasi (*Draft vs Published State*):**
  - Seluruh penambahan, modifikasi, dan penghapusan tahap, pertanyaan, maupun opsi di Form Builder kini **disimpan sebagai Draf terlebih dahulu** dan **tidak langsung tayang ke mahasiswa**.
  - **Indikator Status Real-Time:** Menampilkan badge `🟡 Draf Belum Dipublikasikan` saat ada perubahan draf, dan `🟢 Form Terpublikasi & Aktif` saat sinkron.
  - **Tombol Publikasi Resmi:** Tombol **`🚀 Publikasikan Perubahan`** di header Form Builder untuk menyinkronkan draf ke Google Sheets dan resmi menayangkannya ke formulir mahasiswa.
- **Penyempurnaan Pratinjau Interaktif (*Live Form Simulator*):**
  - Tombol **`👁️ Pratinjau Form Langsung`** membuka simulator yang membaca Draf terkini yang sedang disusun admin.
  - Navigasi interaktif penuh dari tahap ke tahap (`← Tahap Sebelumnya` dan `Lanjut ke Tahap Berikutnya →`) lengkap dengan persentase progres (`25%`, `50%`, `75%`, `100%`).
  - Simulasi interaktif untuk seluruh tipe isian: pilihan peran, NIM, kelompok, slider skor dinamis, voting presentator, textarea ulasan, pilihan ganda/checkbox, dan upload berkas.
  - Tombol **`Buka Tab Baru ↗`** untuk menguji simulasi draf langsung pada tab browser terpisah.

---

## [2.1.80] - 2026-08-24

### 🎨 100% Authentic Google Forms UI & Interactive Question Engine
- **Tata Letak & Tipografi 100% Identik Google Forms (*Authentic Google Forms Canvas*):**
  - **Kartu Bagian / Tahap (*Section Card*):** Garis aksen atas ungu/indigo (`h-2.5 bg-indigo-600`), badge `Bagian X dari Y`, judul bagian bergaris bawah (*underline input*), dan deskripsi bagian.
  - **Kartu Pertanyaan (*Question Card*):** Garis vertikal ungu di sisi kiri (`border-l-4 border-indigo-600`), judul pertanyaan bergaris bawah, petunjuk/deskripsi bergaris bawah, dan **Dropdown Pemilih Tipe Pertanyaan** di sudut kanan atas kartu.
- **Dropdown Pemilih Tipe Pertanyaan Langsung di Setiap Kartu:**
  - Admin dapat mengganti tipe pertanyaan kapan saja langsung dari dropdown pada kartu:
    - 🔘 *Pilihan ganda* (`RADIO`)
    - ☑️ *Kotak centang* (`CHECKBOX`)
    - ▾ *Drop-down* (`DROPDOWN`)
    - ─ *Jawaban singkat* (`SHORT_TEXT`)
    - ≡ *Paragraf* (`TEXTAREA`)
    - 📏 *Skala linier 1-5* (`RATING_SCALE`)
    - ☁️ *Upload file ke Google Drive* (`FILE_UPLOAD`)
    - 👤 *Identitas & Peran Penilai* (`CORE_IDENTITY`)
    - 👥 *Pemilihan Kelompok* (`CORE_GROUP_SELECT`)
    - 📊 *Nilai Presentasi Skor* (`CORE_SCORE_RUBRIC`)
    - ⭐ *Voting Presentator Terbaik* (`CORE_BEST_PRESENTER`)
    - 📝 *Evaluasi Masukan Tiap Pemateri* (`CORE_MEMBER_FEEDBACK`)
    - ℹ️ *Teks Informasi & Panduan* (`INFO_BANNER`)
- **Interaksi Opsi Asli Google Forms:**
  - Pilihan ganda & Kotak centang menampilkan lingkaran radio / kotak centang asli, tombol hapus `✕` per opsi, serta tombol `+ Tambahkan opsi`.
- **Google Forms Bottom Toolbar:**
  - Tombol pindah posisi (`▲ / ▼`), `Pindah Bagian ↗`, `📑 Duplikasi`, `🗑️ Hapus`, dan saklar toggle **`Wajib diisi`** khas Google Forms.

---

## [2.1.79] - 2026-08-24

### ✍️ Direct Inline Live Editing (Google Forms Real-Time Canvas)
- **Pengeditan Langsung di Tempat (*Direct Inline WYSIWYG Editing*):**
  - Seluruh elemen formulir kini dapat langsung diketik dan disesuaikan langsung pada kanvas Form Builder tanpa perlu membuka jendela modal:
    - **Judul & Panduan Tahap:** Langsung diketik pada heading tahap.
    - **Teks Pertanyaan & Petunjuk:** Langsung diketik pada header kartu input.
    - **Pilihan Peran Penilai (`CORE_IDENTITY`):** Langsung mengedit teks peran Mahasiswa, Dosen, dan Tamu/Lainnya di kartu.
    - **Domain Email Kampus:** Langsung mengubah daftar domain resmi yang diizinkan (`mhs.ulm.ac.id, ulm.ac.id`).
    - **Petunjuk Pemilihan Kelompok (`CORE_GROUP_SELECT`):** Langsung mengedit teks instruksi kelompok.
    - **Skor Minimum & Maksimum (`CORE_SCORE_RUBRIC`):** Langsung mengetik angka batas skor pada kartu.
    - **Batas Voting Pemateri (`CORE_BEST_PRESENTER`):** Langsung mengetik kuota maksimal pilihan suara.
    - **Batas Karakter & Visibilitas Ulasan (`CORE_MEMBER_FEEDBACK`):** Langsung mengatur batas karakter dan publikasi ulasan pada kartu.
    - **Opsi Pilihan Ganda, Checkbox, dan Dropdown:** Langsung mengetik teks opsi, menambah opsi baru (`+ Tambah Opsi`), dan menghapus opsi (`✕`) di kartu.
    - **Skala Linier (1-5 / 1-10):** Langsung memilih rentang angka dan mengedit label ujung *Sangat Kurang* / *Sangat Baik*.
    - **Teks Singkat / Paragraf:** Langsung mengedit teks contoh placeholder.
- **Penyimpanan Otomatis Real-Time (*Debounced Instant Auto-Save*):**
  - Setiap ketikan atau perubahan inline langsung tersimpan otomatis secara aman ke Google Sheets dengan sinkronisasi instan ke formulir mahasiswa.

---

## [2.1.78] - 2026-08-24

### 🎨 True WYSIWYG Google Forms-Style Visual Form Builder & Live Simulator
- **Kartu Pertanyaan Visual Nyata (*Realistic Input Mockups Canvas*):**
  - Setiap pertanyaan pada kanvas Form Builder kini langsung merender tampilan visual aslinya:
    - **Identitas Penilai:** Pilihan chip peran, input NIM, dan domain email resmi.
    - **Pemilihan Kelompok:** Dropdown interaktif kelompok sesi aktif.
    - **Nilai Presentasi:** Slider rentang skor aktif (*min-max*), preset chip angka, dan track progress skor.
    - **Presentator Terbaik:** Kotak checklist pemilih dengan batasan kuota suara.
    - **Evaluasi Masukan:** Textarea masukan per pemateri dengan batas karakter.
    - **Teks Singkat / Paragraf:** Input bergaris visual dan box textarea.
    - **Skala Linier (1-5):** Deretan tombol angka rating linier.
    - **Pilihan Ganda & Checkbox:** Lingkaran radio dan kotak centang nyata.
    - **Upload Berkas Drive:** Box drag-and-drop dokumen/slide PDF.
    - **Banner Teks:** Kartu panduan edukatif beraksen.
- **Google Forms-Style Quick Action Bar:**
  - Setiap kartu dilengkapi saklar 1-klik `Wajib diisi (Required)`, tombol `Duplikasi`, `Hapus`, `Pindah Tahap ↗`, dan `Atur Parameter`.
- **Fitur Pratinjau Interaktif Langsung (*Live Form Simulator*):**
  - Tombol `👁️ Pratinjau Form Langsung` untuk mensimulasikan alur pengisian mahasiswa secara nyata dari tahap ke tahap.

---

## [2.1.77] - 2026-08-24

### 🚀 Dynamic Multi-Stage Form Builder & Intelligent Workflow Engine (Melebihi Google Forms)
- **Pengelolaan Tahapan Dinamis Penuh (*Dynamic Multi-Stage Canvas*):**
  - Tahapan (Steps/Sections) formulir kini **100% dinamis**: Admin dapat menambah tahap baru (`+ Tambah Tahap Baru`), mengubah judul/deskripsi tahap (`✏️ Ubah Tahap`), menggeser urutan tahap naik/turun (`▲ / ▼`), menduplikasi tahap (`📑 Duplikasi`), dan menghapus tahap (`🗑️ Hapus`).
  - Dilengkapi *Quick Presets* 1-klik: `+ Tahap Refleksi & Upload Berkas`, `+ Rubrik Tanya Jawab (1-5)`, dan `↺ Reset ke 4-Tahap Standar PGSD`.
- **Kustomisasi Komponen Input Fleksibel di Setiap Tahap:**
  - Setiap input di dalam setiap tahap dapat dipindahkan posisinya di dalam tahap yang sama maupun dipindahkan ke tahap lain (`Pindah Tahap ↗`).
  - Mendukung komponen bawaan/sistem (*Identitas Penilai, Pemilihan Kelompok, Rubrik Skor Min-Max, Voting Presentator Terbaik, Evaluasi Masukan Pemateri*) dan komponen kustom (*Teks Singkat, Paragraf Panjang, Skala Nilai 1-5 / 0-100, Pilihan Ganda, Kotak Centang, Dropdown, Unggah Berkas Google Drive, Banner Panduan Teks*).
- **Dynamic Client Stepper Engine (`index.html`):**
  - Stepper pengisian mahasiswa otomatis mengkalkulasi dan merender jumlah tahap ($N$ Tahap) secara presisi, termasuk tab tahapan dinamis, *progress bar percentage*, indikator `01/0N`, navigasi pintar antartahap, dan validasi *required* per tahap.
- **Sinkronisasi Atomik & Kompatibilitas 100%:**
  - Struktur `formSchema` terintegrasi dengan penyimpanan Google Sheets (`Custom_Fields_JSON` / `Form_Schema_JSON`) dengan *backward-compatibility* penuh untuk seluruh data respons yang ada.

---

## [2.1.76] - 2026-08-24

### 🎨 Pemetaan Terpadu Struktur Formulir Inti & Kustom (Unified Form Canvas Builder)
- **Visualisasi Komprehensif Seluruh Struktur Formulir (*Form Canvas Mapping*):**
  - Seluruh komponen formulir standar/bawaan (5 Blok Inti) kini dipetakan secara terstruktur di dalam kanvas Form Builder bersama pertanyaan kustom.
  - **Blok 1 (Tahap 1): Identitas & Akses Penilai** (`[Field Sistem Inti]`) - Merekam peran, NIM, nama lengkap, dan validasi domain email kampus.
  - **Blok 2 (Tahap 2): Pemilihan Kelompok Presentator** (`[Field Sistem Inti]`) - Menampilkan daftar kelompok yang tampil pada sesi aktif, terhubung langsung ke Master Kelompok di Tab 1.
  - **Blok 3 (Tahap 3): Nilai Presentasi Kelompok** (`[Rubrik Nilai Inti]`) - Menampilkan rentang skor aktif (*min-max*) dengan modal pengaturan skor interaktif.
  - **Blok 4 (Tahap 3): Pemilihan Presentator Terbaik** (`[Voting Peer Inti]`) - Menampilkan batas maksimal pemilih (*voting cap*) dengan modal penyesuaian batas suara.
  - **Blok 5 (Tahap 4): Evaluasi Masukan Tiap Pemateri** (`[Ulasan Kualitatif Inti]`) - Menampilkan batas panjang karakter, visibilitas rekap publik, dan aturan kewajiban bagi kelompok penyaji.
  - **Blok 6+ (Tahap 3/4 Dinamis): Pertanyaan & Input Tambahan Kustom** (`[Field Kustom]`) - Daftar pertanyaan kustom modular (Teks Singkat, Paragraf, Rubrik 1-5, Radio, Checkbox, Upload Berkas).
- **Modal Pengaturan Blok Inti (*Interactive Core Field Settings Modal*):**
  - Admin dapat mengklik tombol `Atur` pada masing-masing kartu blok inti untuk menyesuaikan parameter (skor, voting cap, ulasan, domain email) dalam satu dialog terfokus dengan sinkronisasi instan (*auto-save*).
- **Presisi Tampilan & Hirarki Modular:**
  - Antarmuka rapi, teratur, dan mudah dipahami oleh admin awam tanpa ambiguitas konfigurasi.

---

## [2.1.75] - 2026-08-24

### 🚀 Dynamic Form Builder & Multi-Form Management Engine (Arsitektur Multi-Form Terpadu)
- **Pusat Pengelolaan Multi-Formulir (Master Form Hub):**
  - Menghadirkan antarmuka Master Form Hub di portal admin untuk memantau dan mengelola banyak formulir perkuliahan/kelas secara terpadu.
  - Dilengkapi bilah pencarian cerdas, filter status aktif/ditutup, dan kartu formulir informatif (PIN alfanumerik 4–5 karakter, mata kuliah, dosen, sesi aktif, jumlah respons masuk).
- **Ruang Kerja Administrasi Terisolasi (Single Form Sandbox Workspace):**
  - Setiap formulir yang dikelola beroperasi di dalam ruang kerja mandiri (`?id=XXXX`) dengan 4 tab administrasi lengkap (Kelompok, Konfigurasi & Builder, Respons, Sistem).
  - Navigasi mulus dengan tombol kembali `← Hub Formulir` dan breadcrumb identitas form aktif.
- **Wizard Pembuatan Formulir Baru & Generator PIN 4–5 Karakter:**
  - Pembuatan formulir baru instan dengan auto-generate kode PIN unik 4–5 karakter (misal: `BK5E`, `IPA1`, `7K9P`) dan slug tautan URL yang bersih.
  - Pilihan inisialisasi susunan mahasiswa (Formulir Bersih Baru atau Duplikasi dari Roster Kelas).
- **Modal Bagikan Interaktif (QR Code & PIN Mahasiswa):**
  - Dilengkapi generator gambar QR Code otomatis resolusi tinggi yang dapat diunduh langsung (`.png`).
  - Tampilan kode PIN 4–5 digit berukuran besar dengan tombol salin 1-klik, serta tautan langsung mahasiswa.
- **Form Builder Terintegrasi di Tab Konfigurasi:**
  - Penambahan input pertanyaan dinamis seperti Google Forms: **Teks Singkat**, **Paragraf Panjang**, **Rubrik Skala Nilai (1-5 / 0-100)**, **Pilihan Ganda**, **Kotak Centang (Checkboxes)**, dan **Unggah Berkas (PDF/Gambar ke Google Drive)**.
  - Pilihan cakupan fleksibel: Pertanyaan Umum Formulir (*Global*) atau Rubrik per Kelompok Presentasi (*Per-Kelompok*).
  - Template instan 1-klik: *Upload Slide Presentasi (PDF)*, *Rubrik Tanya Jawab (1-5)*, dan *Refleksi Perkuliahan*.
- **Client Dynamic Renderer & PIN Switcher (`index.html`):**
  - Tombol PIN Badge di bilah atas untuk mahasiswa berpindah kelas/formulir secara cepat dengan memasukkan kode 4–5 karakter.
  - Perenderan dinamis rubrik tambahan per kelompok dan kolom umum pada tahapan penilaian mahasiswa.
  - Pengunggah berkas terintegrasi (*Base64 Reader*) untuk lampiran slide presentasi/dokumen.
- **Backend Multi-Form Engine & Drive Uploader (`Code.gs`):**
  - Lembar `Registry_Forms` untuk pencatatan metadata seluruh formulir.
  - Resolver sheet dinamis terisolasi (`Master_<ID>`, `Config_<ID>`, `Respons_<ID>`, `Rekap_<ID>`) dengan kompatibilitas penuh 100% terhadap data lama.
  - Handler Google Drive untuk penyimpanan dokumen lampiran mahasiswa.

---

## [2.1.74] - 2026-08-23

### 🎨 Penyederhanaan Teks & Harmonisasi Bahasa Panel Admin (Ramah Pengguna Awam)
- **Restrukturisasi Teks & Terminologi Minimalis Seluruh Tab Admin:**
  - Mengganti istilah teknis asing yang rumit (*REST API, Endpoint, Latency, Batch*) dengan bahasa yang lugas, komunikatif, dan mudah dipahami (*Koneksi Spreadsheet, Kecepatan Respon, Impor Banyak Sekaligus*).
  - **Header & Navigasi:** Memperbarui judul panel (`Panel Admin • Online`) dan tombol aksi langsung (`Buka Formulir ↗`).
  - **Widget Sesi Aktif:** Mengubah judul menjadi `Sesi Tampil Minggu Ini` dan opsi dropdown menjadi `Semua Sesi (Buka Semua Kelompok)`.
  - **Tab 1 (Kelompok & Mahasiswa):** Menyesuaikan judul section (`Daftar Kelompok & Mahasiswa`), tombol impor massal (`Impor Banyak Sekaligus`), dan penambahan kelompok baru (`+ Kelompok Baru`).
  - **Tab 2 (Konfigurasi):** Memperjelas subjudul section (`Informasi Perkuliahan`, `Nama Pembuat Web (Footer)`, `Aturan Penilaian & Pengisian`), serta harmonisasi opsi kewajiban penyaji (`Wajib Menilai Sesama Penyaji` vs `Bebas Menilai / Fokus Tampil`).
  - **Tab 3 (Respons):** Menyederhanakan header tabel (`Daftar Respons Masuk`), tombol hapus bersyarat (`Hapus Berdasarkan Kategori`), dan tombol baris kartu respons (`Hapus Data Ini`).
  - **Tab 4 (Sistem & Keamanan):** Memperbarui judul kartu menjadi `Koneksi Google Spreadsheet`, tombol uji (`Tes Sambungan`), dan aksi reset (`Reset Semua Penilaian (Mulai Awal)`).
- **Harmonisasi Modal Aksi & Dialog Konfirmasi:**
  - Memperbarui teks pada Modal Impor Massal, Modal Tambah Kelompok, Modal Hapus Berdasarkan Kategori, dan Modal Reset Seluruh Penilaian agar menyajikan panduan yang aman dan transparan bagi admin awam.

---

## [2.1.73] - 2026-08-23

### 📊 Sinkronisasi Status & Label Minimalis Matriks Keterisian Penilaian
- **Label Minimalis Bebas Pengisian (`Bebas`):**
  - Menambahkan *badge* status minimalis `Bebas` pada sel tabel penilaian bagi anggota kelompok penyaji yang tampil di sesi yang sama saat pengaturan `Kewajiban Menilai bagi Kelompok Penyaji` diset ke `BEBAS_PENUH_DI_SESINYA`.
  - Mengeliminasi ketidakkonsistenan tampilan tanda silang merah (`✕`) pada sesama kelompok penyaji ketika aturan bebas pengisian aktif.
- **Kalkulasi Kepatuhan Presisi & Konsistensi Status Akhir:**
  - Status akhir kolom kanan (`Selesai (Penyaji)`) kini 100% konsisten dengan sel evaluasi pada sesi minggu berjalan.
  - Saat sesi aktif tertentu dipilih (misal: `Minggu 1`), kelompok di luar sesi aktif otomatis berstatus netral (`-`), dan anggota penyaji di sesi tersebut berstatus `Selesai (Penyaji)` secara akurat.
- **Legenda / Keterangan Simbol Tabel Minimalis (*Table Legend*):**
  - Menambahkan bar keterangan minimalis di bawah tabel matriks (`Penyaji`, `Bebas`, `✓ Sudah Menilai`, `✕ Belum Menilai`, `- Di Luar Sesi Aktif`).

---

## [2.1.72] - 2026-08-23

### 🎯 Restrukturisasi Mode Eksklusif Penghapusan Respons (Per Kelompok vs Per Sesi)
- **Pemilihan Ruang Lingkup Tunggal Eksklusif (*Exclusive Scope Selection*):**
  - Mengubah antarmuka modal penghapusan bersyarat menjadi sistem seleksi tunggal eksklusif (pilih salah satu: **Per Kelompok Presentator** ATAU **Per Sesi Presentasi**).
  - Kontainer input target menyesuaikan secara dinamis: hanya menampilkan dropdown kelompok ketika mode per kelompok aktif, dan hanya menampilkan dropdown sesi ketika mode per sesi aktif.
- **Proteksi Ketat Integritas Database (*Strict Scope Protection*):**
  - Menghapus opsi *"Semua"* di dalam modal penghapusan guna memastikan pengguna wajib memilih target spesifik.
  - Backend `Code.gs` dan frontend `admin.html` secara ketat hanya menghapus baris respons yang persis cocok dengan target terpilih, menjamin data kelompok lain, lembar master, dan konfigurasi sistem terlindungi 100%.

---

## [2.1.71] - 2026-08-23

### 🗑️ Fitur Penghapusan Respons Penilaian Bersyarat (Per Kelompok & Sesi)
- **Modal Penghapusan Respons Terukur (*Scoped Response Deletion Engine*):**
  - Menambahkan tombol aksi *"Hapus per Kelompok / Sesi"* pada bilah atas Tab Respons di portal admin.
  - Menyediakan filter selektif untuk memilih target **Kelompok Presentator** dan/atau **Sesi Presentasi**.
  - **Penghitung Dampak Langsung (*Live Impact Counter*):** Menghitung dan menampilkan jumlah baris respons yang cocok secara instan beserta ringkasan implikasi reset pengisian mahasiswa.
  - **Konfirmasi Keamanan Berlapis:** Memerlukan input kata kunci konfirmasi `"HAPUS"` sebelum tombol eksekusi aktif guna mencegah kehilangan data tak disengaja.
- **Backend Handler Baru (`Code.gs`):**
  - Menambahkan endpoint `adminDeleteScopedResponses` dengan algoritma penghapusan mundur dari baris terbawah untuk menjamin integritas indeks spreadsheet.
  - Otomatis memperbarui lembar rekapitulasi nilai (`generateRekapSheet()`) dan membersihkan cache sistem.

---

## [2.1.70] - 2026-08-23

### 📑 Opsi Tampilkan/Sembunyikan Catatan Kaki (Footer Dokumen Cetak)
- **Kontrol Visibilitas Footer (*Document Footer Visibility Toggle*):**
  - Menambahkan checkbox *"Sertakan Catatan Kaki"* pada bilah filter cetak rekapitulasi.
  - Jika dicentang (default: aktif): Catatan kaki resmi (*footer*) ditampilkan di bagian dasar kanvas A4 lengkap dengan informasi otomatisasi dan cap waktu cetak.
  - Jika tidak dicentang: Catatan kaki dihapus secara bersih, dan struktur kanvas secara otomatis menyesuaikan (*responsive layout reflow*) tanpa merusak hierarki atau batas cetak.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.69] - 2026-08-23

### 🔘 Opsi Tampilkan/Sembunyikan Nama Pengirim Ulasan Evaluatif
- **Opsi Kontrol Privasi Ulasan (*Reviewer Name Visibility Toggle*):**
  - Menambahkan checkbox *"Sertakan Nama Pengirim"* pada bilah alat pratinjau cetak dokumen rekapitulasi.
  - Jika dicentang (default: aktif): Setiap catatan masukan menampilkan nama mahasiswa pengirim (*e.g. "Penjelasan runtut dan jelas" — Ahmad Fauzi*).
  - Jika tidak dicentang: Nama pengirim disembunyikan secara otomatis, menghasilkan tampilan ulasan anonim/kolektif (*e.g. "Penjelasan runtut dan jelas"*).
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.68] - 2026-08-23

### 📝 Penyederhanaan Teks Ringkasan Jumlah Kelompok dan Mahasiswa
- **Penyederhanaan Redaksi Sel Ringkasan (*Summary Label Simplification*):**
  - Mengubah teks ringkasan menjadi pola ringkas formal: *"Total X Kelompok (Y Mahasiswa)"* (misal: *Total 2 Kelompok (7 Mahasiswa)*).
  - Mengoptimalkan ruang sel tabel agar lebih proporsional, padat, dan rapi.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.67] - 2026-08-23

### 🎓 Standardisasi Skala Predikat Nilai Huruf Akademik Resmi
- **Penerapan Konversi Nilai Huruf (*Official Letter Grade Conversion*):**
  - Mengintegrasikan tabel standar konversi nilai akademik resmi ke dalam sistem perhitungan predikat laporan cetak dan badge formulir:
    - $\ge 80 \rightarrow$ **A** *(Bobot 4,00)*
    - $77 - <80 \rightarrow$ **A-** *(Bobot 3,75)*
    - $75 - <77 \rightarrow$ **B+** *(Bobot 3,50)*
    - $70 - <75 \rightarrow$ **B** *(Bobot 3,00)*
    - $67 - <70 \rightarrow$ **B-** *(Bobot 2,75)*
    - $64 - <67 \rightarrow$ **C+** *(Bobot 2,50)*
    - $60 - <64 \rightarrow$ **C** *(Bobot 2,00)*
    - $50 - <60 \rightarrow$ **D+** *(Bobot 1,50)*
    - $40 - <50 \rightarrow$ **D** *(Bobot 1,00)*
    - $00 - <40 \rightarrow$ **E** *(Bobot 0)*
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.66] - 2026-08-23

### 📊 Penambahan Satuan Mahasiswa pada Kolom Penilai Tabel Rekapitulasi
- **Standardisasi Satuan Kolom Penilai (*Evaluator Unit Suffix*):**
  - Menambahkan sufiks satuan *"Mhs"* pada setiap nilai di kolom **Penilai** pada Tabel Rekapitulasi Nilai & Peringkat Performa Kelompok (misalnya `2 Mhs`, `1 Mhs`, dst.).
  - Memperjelas bahwa angka tersebut merujuk pada kuantitas mahasiswa penilai (*peer-assessors*).
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.65] - 2026-08-23

### 🖋️ Pembersihan Placeholder & Perluasan Ruang Tanda Tangan Dosen
- **Pembersihan Teks Lembar Pengesahan (*Signature Area Optimization*):**
  - Menghapus teks placeholder *"(Tanda Tangan & Cap)"* agar lembar tanda tangan tampil murni dan formal tanpa teks bantuan visual.
  - Memperluas tinggi ruang kosong (*signature blank space*) menjadi $62\text{px}$ untuk memberikan keleluasaan pembubuhan tanda tangan basah/elektronik dan cap stempel resmi institusi.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.64] - 2026-08-23

### 🏛️ Penerapan Font Times New Roman pada Seluruh Komponen Tabel A
- **Harmonisasi Tipografi Tabel Utama (*Full Table A Typography Standardization*):**
  - Mengubah seluruh tipografi **Tabel Rekapitulasi Nilai & Peringkat Performa Kelompok** (Poin A) menjadi keluarga huruf `'Times New Roman', Times, serif`:
    - Seluruh baris header kolom `<th>` (*Rank, Kelompok Presentasi, Sesi, Penilai, Rata-Rata, Presentator Terbaik, Predikat*)
    - Seluruh sel data baris `<td>` (nomor peringkat, nama kelompok, sesi, penilai, nilai rata-rata, presentator terbaik, predikat)
    - Seluruh sel pada baris ringkasan kelas (*Rata-Rata Keseluruhan Kelas, Nilai Rata-Rata, Total Kelompok & Mahasiswa Terdaftar*)
  - Menghilangkan font monospace pada kolom data tabel untuk menjaga kesatuan tipografi dinas formal.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.63] - 2026-08-23

### 👥 Integrasi Dinamis Jumlah Mahasiswa pada Ringkasan Kelompok
- **Penyempurnaan Teks Ringkasan (*Dynamic Student Count Label*):**
  - Mengubah teks ringkasan menjadi *"Total X Kelompok Terdaftar dengan Y Mahasiswa"*.
  - Menghitung secara dinamis dan presisi jumlah mahasiswa terdaftar pada kelompok-kelompok yang aktif sesuai dengan cakupan filter yang dipilih.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.62] - 2026-08-23

### 📊 Optimalisasi Baris Ringkasan Tabel & Penggabungan Kolom Penilai
- **Penghapusan Sel Penilai Ringkasan (*Summary Cell Refinement*):**
  - Menghapus sel penilai agregat (*3 Mhs*) pada baris ringkasan kelas untuk mencegah redundansi dan kerancuan data.
  - Memperluas sel label *"Rata-Rata Keseluruhan Kelas"* menjadi rentang 4 kolom (`colspan="4"`, mencakup kolom *Rank*, *Kelompok Presentasi*, *Sesi*, dan *Penilai*).
  - Menempatkan nilai rata-rata kelas (*75.00*) tepat berada lurus di bawah kolom *Rata-Rata*.
  - Sel *"Total X Kelompok Terdaftar"* tetap mengisi rentang 2 kolom terakhir (`colspan="2"`).
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.61] - 2026-08-23

### 🏛️ Penerapan Font Times New Roman pada Lembar Pengesahan Dosen
- **Harmonisasi Tipografi Lembar Pengesahan (*Signature Block Typography*):**
  - Mengubah seluruh baris teks pada lembar tanda tangan dan pengesahan resmi dosen pengampu menjadi keluarga huruf `'Times New Roman', Times, serif`:
    - Kota & Tanggal Pengesahan (*Banjarmasin, 23 Agustus 2026*)
    - Jabatan (*Dosen Pengampu Mata Kuliah,*)
    - Label tanda tangan (*(Tanda Tangan & Cap)*)
    - Nama Lengkap & Gelar (*Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.*)
    - Nomor Induk Pegawai (*NIP. 19830514 200812 2 003*)
  - Menjamin keselarasan formal 100% dari Kop Surat hingga lembar pengesahan akhir dokumen dinas.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.60] - 2026-08-23

### 🎯 Penyelarasan Rata Tengah Sel Total Kelompok Terdaftar
- **Penyelarasan Sel Ringkasan (*Summary Cell Center Alignment*):**
  - Mengatur perataan `text-align: center; vertical-align: middle;` pada sel *"Total X Kelompok Terdaftar"* di baris ringkasan Tabel Rekapitulasi Nilai.
  - Memastikan keselarasan dan simetri visual 100% pada seluruh kolom baris ringkasan tabel.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.59] - 2026-08-23

### 📊 Penyelarasan Teks & Rata Tengah Sel Rata-Rata Keseluruhan Kelas
- **Pembersihan Teks (*Label Formatting*):**
  - Mengubah teks label baris ringkasan kelas dari *"Rata-Rata Keseluruhan Kelas:"* menjadi *"Rata-Rata Keseluruhan Kelas"* (menghapus tanda titik dua).
- **Penyelarasan Sel (*Center Alignment*):**
  - Menetapkan perataan `text-align: center; vertical-align: middle;` pada sel rentang 3 kolom (*colspan 3*) baris ringkasan kelas di Tabel Rekapitulasi Nilai.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.58] - 2026-08-23

### 🎯 Penyelarasan Rata Tengah Sel Header Tabel Rekapitulasi Nilai
- **Penyelarasan Kolom Header (*Header Cell Center Alignment*):**
  - Mengatur perataan teks rata tengah (*center aligned*) dan *vertical middle* pada seluruh sel judul kolom tabel Rekapitulasi Nilai Kelompok:
    - `Rank`
    - `Kelompok Presentasi`
    - `Sesi`
    - `Penilai`
    - `Rata-Rata`
    - `Presentator Terbaik`
    - `Predikat`
  - Memastikan distribusi visual yang seimbang, simetris, dan rapi pada lembar cetak dokumen resmi A4.
- **Sinkronisasi Dwikanal:**
  - Diterapkan pada `index.html` dan `admin.html`.

---

## [2.1.57] - 2026-08-23

### 🏛️ Penerapan Font Times New Roman pada Judul Poin A & Poin B
- **Harmonisasi Tipografi Judul Seksi (*Section Header Typography*):**
  - Mengubah font pada judul seksi **Poin A** (*A. Rekapitulasi Nilai & Peringkat Performa Kelompok*) dan **Poin B** (*B. Rangkuman Catatan Evaluasi Masukan Mahasiswa*) menjadi keluarga huruf `'Times New Roman', Times, serif`.
  - Ukuran ditetapkan pada $12\text{px}$ ($9\text{pt}$) dengan `font-weight: 800` (Bold) dan *letter-spacing* yang proporsional.
- **Sinkronisasi Dwikanal:**
  - Diterapkan secara identik pada lembar cetak mahasiswa (`index.html`) dan portal admin (`admin.html`).

---

## [2.1.56] - 2026-08-23

### 🏛️ Penerapan Font Times New Roman pada Judul Laporan & Metadata
- **Harmonisasi Tipografi Naskah Dinas (*Official Document Typography*):**
  - Mengubah jenis font pada judul *"LAPORAN REKAPITULASI HASIL PENILAIAN PRESENTASI"* dan blok metadata mata kuliah (*Mata Kuliah, Kelas/Semester, Dosen Pengampu, Cakupan Sesi*) menjadi keluarga huruf `'Times New Roman', Times, serif`.
  - Menciptakan keselarasan visual yang anggun dan formal dengan Kop Surat resmi Kementerian & Universitas Lambung Mangkurat di bagian atas.
- **Sinkronisasi Dwikanal:**
  - Diterapkan secara identik pada modul cetak mahasiswa (`index.html`) dan portal pengelola admin (`admin.html`).

---

## [2.1.55] - 2026-08-23

### 🎨 Pembersihan Kontainer Logo & Penyelarasan Transparansi Ikon
- **Akar Masalah (*Root Cause Identified & Fixed*):**
  - Gambar berkas `logo-ulm.png` dan `icon-192.png` sebenarnya sudah memiliki latar belakang transparan murni, namun kontainer pembungkus HTML pada kartu login admin dan navbar sebelumnya diberi kelas `bg-zinc-900 border border-zinc-800 rounded-2xl`, sehingga menghasilkan kotak hitam di belakang logo ULM.
- **Pembersihan Kontainer Pembungkus:**
  - Menghapus kelas `bg-zinc-900`, `border-zinc-800`, dan `rounded-2xl` pada pembungkus logo di halaman login admin ([admin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html)), header admin, dan header navbar mahasiswa ([index.html](file:///e:/Data/GitHub/Project%20Dede/index.html)).
  - Logo lambang ULM kini tampil murni dan elegan langsung di atas latar belakang halaman / kartu tanpa bingkai hitam.
- **Optimasi Konfigurasi PWA (*Manifest Any Purpose*):**
  - Menyesuaikan `purpose: "any"` pada `manifest.json` agar browser dan sistem operasi tidak memaksakan *background mask* hitam pada ikon aplikasi.

---

## [2.1.54] - 2026-08-23

### 📐 Eliminasi Margin Collapse & Perbaikan Spasi Before Poin A & B
- **Akar Masalah (*Margin Collapsing Issue Fixed*):**
  - Mengatasi efek *CSS margin-collapsing* yang sebelumnya menyebabkan jarak *before* Poin A dan Poin B menyusut dan tampak menempel rapat pada batas tabel di atasnya.
- **Penerapan Padding & Margin Spasial Eksplisit:**
  - Menetapkan ruang pemisah sebelum Poin A sebesar $16\text{px}$ (`margin-top: 14px; padding-top: 2px;`) sehingga memiliki batas visual yang tegas dari blok metadata mata kuliah.
  - Menetapkan ruang pemisah sebelum Poin B sebesar $18\text{px}$ (`margin-top: 16px; padding-top: 2px;`) sehingga memiliki jarak napas yang jelas dan terpisah dari garis tepi bawah Tabel A.
- **Sinkronisasi Dwikanal:**
  - Diperbarui pada `index.html` dan `admin.html`.

---

## [2.1.53] - 2026-08-23

### 📐 Optimalisasi Spasi Before Poin A & Poin B (6pt Spacing)
- **Peningkatan Jarak Before Poin A (*Rekapitulasi Nilai & Peringkat Performa Kelompok*):**
  - Meningkatkan jarak *before* menjadi `6pt` (`margin-top: 6pt; margin-bottom: 8px;`) setelah tabel metadata laporan.
- **Peningkatan Jarak Before Poin B (*Rangkuman Catatan Evaluasi Masukan Mahasiswa*):**
  - Meningkatkan jarak *before* menjadi `6pt` (`margin-top: 6pt; margin-bottom: 6px;`) setelah tabel ringkasan nilai kelompok.
- **Sinkronisasi Dwikanal (*Client & Admin Portal*):**
  - Menerapkan spasi 6pt yang konsisten pada `index.html` dan `admin.html`.

---

## [2.1.52] - 2026-08-23

### 📏 Presisi Spasi Tipografi Dokumen Resmi (*Official Typography Spacing*)
- **Jarak Before Judul Laporan (*Report Title Heading*):**
  - Menerapkan jarak *before* tepat `6pt` (`margin: 6pt auto 6px auto;`) pada judul utama *"LAPORAN REKAPITULASI HASIL PENILAIAN PRESENTASI"*.
- **Jarak Before Seksi A & Seksi B (*Section Headers Before Spacing*):**
  - Menetapkan jarak *before* tepat `4pt` pada judul *"A. Rekapitulasi Nilai & Peringkat Performa Kelompok"* dan *"B. Rangkuman Catatan Evaluasi Masukan Mahasiswa"*.
- **Jarak Before Lembar Pengesahan (*Signature Block Before Spacing*):**
  - Menetapkan jarak *before* tepat `12pt` (`margin-top: 12pt;`) pada blok tanggal kota dan tanda tangan dosen pengampu (*"Banjarmasin, 23 Agustus 2026"*).
- **Sinkronisasi Dwikanal (*Dual-Engine Sync*):**
  - Menerapkan ukuran spasi yang identik pada modul cetak mahasiswa (`index.html`) dan portal pengelola admin (`admin.html`).

---

## [2.1.51] - 2026-08-23

### 📑 Penanganan Komprehensif Multi-Page Document & Proteksi Page-Break Presisi
- **Arsitektur Pemecahan Halaman Otomatis (*Smart Multi-Page Fragmentation*):**
  - Mengonfigurasi margin kertas berulang `@page { size: A4 portrait; margin: 12mm 14mm 12mm 14mm !important; }` sehingga setiap halaman (Halaman 1, 2, 3, dst.) mendapatkan ruang napas tepi atas, bawah, kiri, dan kanan yang 100% konsisten.
  - Menerapkan aturan proteksi baris tabel `tbody tr { break-inside: avoid !important; }` dan `thead { display: table-header-group !important; }` sehingga baris data tabel tidak pernah terbelah di tengah garis dan judul kolom tabel otomatis diulang saat berpindah halaman.
- **Proteksi Kartu Ulasan & Judul Seksi (*No-Orphan Headers & Cards*):**
  - Judul Seksi B (*Rangkuman Catatan Evaluasi*) dilengkapi `.print-section-header` dengan `page-break-after: avoid` agar tidak pernah tertinggal sendirian di dasar halaman tanpa kartu ulasan.
  - Setiap kartu kelompok (`.print-card`) dan kotak masukan mahasiswa (`.student-review-item`) dikunci dengan `page-break-inside: avoid` sehingga blok evaluasi utuh berpindah ke halaman berikutnya bila ruang tersisa tidak cukup.
- **Integritas Lembar Pengesahan & Footer (*Signature & Footer Safety*):**
  - Blok tanda tangan dosen (`.print-signature`) dan catatan penerbitan (*footer*) dilindungi dari pemotongan (`break-inside: avoid`) dan otomatis tertata rapi di dasar dokumen baik untuk laporan 1 halaman maupun laporan berhalaman banyak (*multi-page report*).

---

## [2.1.50] - 2026-08-23

### 🎯 Penyelarasan Mutlak 100% Identik antara Preview Modal & Hasil Cetak PDF
- **Akar Masalah (*Root Cause Identified & Fixed*):**
  - Adanya perbedaan tipografi (*font-family* Arial vs System-UI) dan penanganan margin browser (@page margin vs inner container padding) yang menyebabkan pergeseran koordinat fisik antara pratinjau modal dan lembar cetak.
- **Penerapan Arsitektur Kanvas Terpadu (*Unified Zero-Margin Engine*):**
  - Mengunci margin halaman cetak `@page { size: A4 portrait; margin: 0 !important; }` sehingga kontrol margin dan dimensi lembar dipegang penuh oleh `.print-page-wrapper`.
  - Menyelaraskan dimensi fisik halaman secara presisi: lebar $210\text{mm}$ ($794\text{px}$), tinggi $297\text{mm}$ ($1123\text{px}$), serta padding dinas $10\text{mm} \times 14\text{mm}$ ($38\text{px} \times 53\text{px}$) pada pratinjau layar maupun berkas PDF cetak.
  - Menyatukan tumpukan tipografi (*font stack*) `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` dengan metrik huruf seragam di semua platform.
- **Konsistensi Total pada Portal Admin:**
  - Memperbaiki deklarasi variabel konfigurasi laporan cetak pada `admin.html` agar selaras 100% dengan modal pratinjau mahasiswa.

---

## [2.1.49] - 2026-08-23

### 📐 Optimalisasi Batas Margin Kanan & Layout Tabel Cetak Presisi
- **Pencegahan Pemotongan Garis Tepi Kanan (*Right Border Clipping Fix*):**
  - Mengubah mode kalkulasi tabel cetak menjadi `table-layout: fixed` dengan alokasi lebar kolom proporsional berbasis persentase (Rank: 6%, Kelompok: 19%, Sesi: 10%, Penilai: 9%, Rata-Rata: 11%, Presentator Terbaik: 31%, Predikat: 14%).
  - Menerapkan pembungkusan kata fleksibel (*word wrapping*) pada kolom *Presentator Terbaik* sehingga nama mahasiswa dan perolehan suara tidak memaksa tabel melebar melebihi batas kanvas kertas A4.
  - Memastikan *overflow container* berstatus `visible` saat cetak agar tidak ada elemen tepi atau border luar yang terpotong oleh browser print rasterizer.
- **Penyelarasan Margin Kertas A4 & Padding Preview:**
  - Menetapkan margin cetak `@page` sebesar `8mm 12mm 8mm 12mm` dan padding area pratinjau modal sebesar `30px 45px` ($12\text{mm}$ ekuivalen), menjamin ruang napas tepi kanan yang proporsional dan 100% identik.
- **Penataan Kolom Metadata Laporan (4-Kolom Fleksibel):**
  - Menata distribusi kolom metadata (Mata Kuliah, Dosen Pengampu, Kelas/Semester, Cakupan Sesi) agar nama dosen pengampu bergelar lengkap tertata rapi dalam satu baris.

---

## [2.1.48] - 2026-08-23

### 🔄 Penerapan Sistem Animatif Feedback & Fallback pada Seluruh Tombol Segarkan
- **Status Interaktif Beranimasi (*Live Button State Transition*):**
  - Seluruh tombol segarkan (*Segarkan Rekap*, *Segarkan Master Data*, *Segarkan Data Respons*, dan *Hapus & Segarkan Cache*) kini dilengkapi status animasi putar (*spinning icon*) dan teks indikator proses (*Menyegarkan...*).
  - Tombol dinonaktifkan sementara selama proses berlangsung untuk mencegah *duplicate request*.
- **Konfirmasi Berhasil & Fallback Offline yang Jelas (*Notif Fallback*):**
  - **Kondisi Berhasil:** Tombol bertransformasi menampilkan ikon centang hijau dengan label *Tersinkron* serta memicu *toast* sukses berwarna hijau (`Data berhasil diperbarui dari server cloud`).
  - **Kondisi Gagal / Offline:** Tombol menampilkan peringatan *Mode Offline* dan memicu notifikasi fallback *amber* (`Koneksi cloud terputus/lambat. Menampilkan data tersimpan di perangkat`) tanpa merusak atau mengosongkan tampilan data yang telah tersimpan.

---

## [2.1.47] - 2026-08-23

### 📌 Penataan Posisi Footer Presisi di Dasar Dokumen (Anchored Page-Bottom)
- **Struktur Flex Kolom Halaman Penuh (`print-page-wrapper`):**
  - Mengisolasi seluruh isi laporan (Kop, tabel evaluasi, dan tanda tangan dosen) dalam kontainer atas fleksibel (`flex: 1 0 auto`), dan menambatkan footer dokumen di bagian paling dasar lembar A4 (`margin-top: auto`).
  - Menjamin footer berada di posisi terbawah kertas (*true bottom margin*) seperti dokumen cetak formal profesional, bukan mengambang sembarangan di bawah tanda tangan.
- **Sinkronisasi & Panduan Opsi Cetak Browser ("Headers & footers"):**
  - Menyediakan panduan jelas pada bilah bawah modal cetak untuk mengosongkan centang *"Headers and footers"* di jendela browser guna menghasilkan cetakan bersih tanpa URL atau penanggalan browser ganda.
  - Memastikan batas margin aman (`8mm 10mm`) sehingga jika opsi tersebut dicentang sekalipun oleh pengguna, tidak terjadi tumpang tindih (*zero collision*).

---

## [2.1.46] - 2026-08-23

### 🏛️ Integrasi Penuh Logo Resmi ULM (Favicon, Tab Icon, PWA, Header & Portal Login)
- **Konversi & Pembangkitan Multi-Resolusi Favicon / Tab Icon:**
  - Menghasilkan file multi-resolution `favicon.ico` (16x16, 32x32, 48x48, 64x64) dan icon PNG teroptimasi (`favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) dari lambang resmi Universitas Lambung Mangkurat.
  - Memastikan waktu muat kilat (*sub-millisecond load*) dengan kualitas gambar super tajam di seluruh resolusi retina & high-DPI browser.
- **Penyelarasan Identitas Visual Web App:**
  - Mengganti ikon kotak teks pada header `index.html` dengan lambang resmi ULM.
  - Mengganti ikon gembok pada portal login admin (`admin.html`) dan ikon header dashboard admin dengan lambang resmi ULM.
  - Menambahkan konfigurasi `manifest.json` PWA lengkap dengan metadata dan asset icon ULM.

---

## [2.1.45] - 2026-08-23

### 📄 Penerapan Footer Resmi Minimalis & Penyelarasan Lembar Pengesahan Dosen
- **Redesain Footer Dokumen Cetak Minimalis & Kompak:**
  - Memindahkan teks generasi sistem dari samping tanda tangan menjadi **footer resmi minimalis** di dasar dokumen dengan garis pemisah putus-putus (*dashed hairline border*) yang elegan.
  - Kalimat disesuaikan secara profesional: `Dokumen ini diterbitkan secara otomatis oleh Sistem Peer-Assessment PGSD Kelas 5E • Universitas Lambung Mangkurat` dengan metadata `Waktu Cetak: [Tanggal]` di sisi kanan.
  - Memastikan footer tidak tumpang tindih (*zero conflict*), tidak terpotong, dan tidak memicu penambahan halaman baru.
- **Penyelarasan Blok Pengesahan Tanda Tangan Dosen:**
  - Kotak tanda tangan dosen kini berdiri mandiri dan rata kanan (*right-aligned*) mengikuti kaidah format dokumen resmi akademik dinas FKIP ULM.

---

## [2.1.44] - 2026-08-23

### 🖨️ Presisi 100% Identik Antara Pratinjau Layar & Hasil Dokumen Cetak / PDF Fisik
- **Sinkronisasi Rasio Fisik A4 1:1 (794px Canvas Parity):**
  - Mengonfigurasi container pratinjau (`#printableReportArea`) dengan dimensi fisik A4 sesungguhnya pada 96 DPI (`width: 794px` / `210mm`, `padding: 30px 38px` / `8mm 10mm`), menghasilkan lebar konten efektif `718px` yang identik dengan area cetak A4 fisik.
  - Memastikan *word wrap*, batas tabel (*table cell layout*), kotak kartu evaluasi masukan mahasiswa, dan lembar tanda tangan pengesahan tampil 100% presisi dan sama persis tanpa perbedaan sedikitpun antara modal pratinjau di layar dan hasil cetak PDF.
- **Pengujian & Verifikasi Output Nyata (Automated PDF Rendering Test):**
  - Dilakukan pengujian otomatis via Playwright untuk menghasilkan file PDF fisik asli (`official_report.pdf`), memverifikasi seluruh komponen selesai dalam 1 halaman utuh A4 (*single page fit*) dengan margin atas, bawah, kiri, dan kanan yang rapi dan konsisten.

---

## [2.1.43] - 2026-08-23

### 🎯 Isolasi Mutlak Mode Cetak & Konsistensi Margin Antar Halaman
- **Isolasi Penuh Elemen DOM Saat Cetak (`body > *:not(#printDocumentRoot)`):**
  - Menyembunyikan seluruh elemen induk dan sibling di dalam `body` (`main`, `header`, `nav`, `toast`) secara absolut saat mode cetak (`@media print`), menghilangkan celah/offset tersembunyi yang sebelumnya mendorong posisi Kop Surat ke bawah pada halaman pertama.
  - Memastikan `#printDocumentRoot` menjadi satu-satunya elemen aktif di dalam `body` saat pencetakan berlangsung.
- **Konsistensi Margin Cetak Bersih (@page 8mm):**
  - Menerapkan `@page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }` secara seragam untuk seluruh halaman fisik (baik halaman 1 maupun halaman 2), sehingga margin atas dan bawah memiliki proporsi simetris yang konsisten.
- **Kepadatan Tipografi & Layout Pas 1 Halaman:**
  - Mengoptimalkan densitas vertikal (Kop, tabel evaluasi, dan kotak tanda tangan dosen) sehingga rekapitulasi penilaian presentasi 2 kelompok pas dan tuntas dalam 1 halaman utuh A4 tanpa terpotong ke halaman berikutnya.

---

## [2.1.42] - 2026-08-23

### 🎯 Perbaikan Margin Atas & Optimalisasi 1 Halaman Penuh Dokumen Cetak
- **Eliminasi Penumpukan Margin Atas (@page margin-top 0mm):**
  - Mengatur `@page { margin: 0mm 8mm 6mm 8mm; }` untuk mencegah browser Chrome menggandakan margin atas bawaan (*default browser print margin*), sehingga tidak ada celah kosong lebar di bagian atas dan Kop Surat langsung bertengger rapi di puncak halaman.
  - Memastikan dokumen laporan resmi A4 selalu pas tercetak dalam **1 halaman penuh (*1 page fit*)** tanpa terpotong atau loncat ke halaman kedua saat menggunakan setting *Margins: Default*.
  - Menyesuaikan padding canvas pratinjau (`padding: 24px 30px`) agar tampilan modal pratinjau dan hasil cetak PDF 100% konsisten dan proporsional.

---

## [2.1.41] - 2026-08-23

### 📑 Harmonisasi Proporsi Kop Surat & Redaksi Ulasan Evaluasi Mahasiswa
- **Pembersihan Tipografi Nama Pemateri di Bagian B:**
  - Menghilangkan bullet (`•`) pada nama pemateri sehingga langsung menampilkan nama secara bersih dan minimalis (*e.g. Siti Nurhaliza*), dilengkapi badge jumlah masukan (*e.g. 2 Masukan*) di sisi kanan header kartu.
  - Bullet (`•`) kini hanya disematkan pada setiap butir kutipan masukan/ulasan.
- **Pencantuman Identitas Penilai (Author Attribution):**
  - Setiap butir ulasan pada dokumen cetak kini dilengkapi nama mahasiswa pengirim ulasan (*e.g. "Penjelasan sangat runtut dan jelas" — Ahmad Fauzi*).
- **Harmonisasi Proporsi Kop Surat & Logo ULM:**
  - Menyeimbangkan ukuran logo ULM menjadi `82×82 px` dengan cell penyeimbang simetris `88px` di sisi kiri dan kanan, sehingga teks kementerian dan universitas berada tepat di tengah (*center-aligned balance*).
  - Merapikan ketebalan garis ganda pembatas kop (*double-line border*) standar dinas resmi.

---

## [2.1.40] - 2026-08-23

### 🖨️ Presisi Margin & Standardisasi Dokumen Cetak / PDF Resmi A4
- **Standardisasi Margin Halaman (@page 10mm 12mm 10mm 12mm):**
  - Menyelaraskan margin cetak standar akademik resmi A4 (`@page { margin: 10mm 12mm 10mm 12mm; }`) pada `index.html` dan `admin.html` agar tidak terjadi pergeseran atau perbedaan ruang tepi antara preview modal dengan dialog cetak browser.
  - Memperbaiki padding lembar pratinjau (*virtual report canvas*) menjadi proporsional (`padding: 36px 44px`), sehingga tampilan layar dan hasil cetak PDF fisik memiliki rasio dan margin yang 100% simetris (*1:1 parity*).
- **Penyelarasan Header Kolom:**
  - Menyelaraskan header kolom tabel rekap cetak menjadi **Presentator Terbaik** agar konsisten di seluruh aplikasi.

---

## [2.1.39] - 2026-08-23

### ✨ Penyempurnaan Tipografi & Redaksi Minimalis Profesional pada Visual Chart
- **Pembersihan Redaksi Teks Visual Leaderboard:**
  - Mengubah judul kartu ikhtisar dari *Leaderboard & Peringkat Performa* menjadi **Ikhtisar Peringkat & Performa**.
  - Mengeliminasi instruksi teknis / embel-embel generik `(Top 10 & Scrollable)` pada subtitle dan menggantinya dengan deskripsi profesional yang ringkas: *"Nilai rata-rata kelompok dan perolehan suara presentator terbaik."*
  - Menyelaraskan sub-header grafik individu menjadi **Presentator Terbaik**.

---

## [2.1.38] - 2026-08-23

### 🧊 Pembekuan Kolom Identitas Mahasiswa & Penguncian Kelompok Dinilai Dinamis
- **Pembersihan Istilah Presensi & Standardisasi Label Status:**
  - Mengubah label sub-tab navigasi dari *Status Presensi* menjadi **Status**.
  - Mengubah judul tabel dari *Matriks Presensi Penilaian* menjadi **Matriks Keterisian Penilaian** / **Status Penilaian • [Kelompok]**, mengeliminasi kerancuan istilah karena tabel ini merupakan matriks keterisian evaluasi tugas.
  - Memperbarui subtitle dan filter label menjadi ringkas dan konsisten (*Status*, *Kelompok Penyaji*, *Kelompok Asal*).
- **Pembekuan Kolom Mahasiswa & NIM (Frozen Sticky Columns):**
  - Kolom nomor urut `#` dan **Mahasiswa & NIM** kini dibekukan secara permanen (*sticky frozen column*) di semua ukuran layar (desktop, tablet, dan smartphone).
  - Latar belakang sel sticky dibuat 100% solid (*opaque isolation*) dengan bayangan pemisah (*subtle drop-shadow*), sehingga saat tabel digeser horizontal, nama mahasiswa tetap terlihat jelas dan sel lainnya meluncur di belakangnya tanpa tumpang tindih (*zero text bleeding*).
- **Penguncian Kelompok yang Sudah Dinilai (Evaluated Group Locking & Auto 2-Way Sync):**
  - Pada formulir Step 2 (Pilih Kelompok Yang Dinilai), jika mahasiswa telah mengirimkan penilaian untuk kelompok tertentu, kartu kelompok tersebut otomatis dibekukan (*disabled*) dengan badge hijau **"Sudah Dinilai • Terkunci"**.
  - Anggota penyaji kelompok yang bersangkutan juga otomatis dibekukan dengan badge **"Kelompok Anda (Penyaji)"** untuk mencegah evaluasi diri sendiri.
  - Jika admin menghapus rekam jejak penilaian mahasiswa di panel admin, mesin sinkronisasi 2 arah *real-time* otomatis membuka kembali (*unlock*) pilihan kelompok tersebut secara instan tanpa perlu reload.

---

## [2.1.37] - 2026-08-23

### 🔄 Sinkronisasi 2 Arah Real-Time (Two-Way Realtime Engine)
- **Mesin Sinkronisasi Latar Belakang (Smart Heartbeat):**
  - Mengimplementasikan heartbeat sinkronisasi otomatis (setiap 20 detik saat halaman aktif) untuk mengambil dan memperbarui status rekapitulasi, matriks presensi, dan log respons secara *live* tanpa mengganggu interaksi pengguna atau mereset form.
  - Menambahkan sinkronisasi berkala untuk mendeteksi perubahan konfigurasi sesi aktif atau master kelompok dari Admin secara otomatis.
- **Sinkronisasi Instan Pasca-Kirim (Post-Submit Instant Invalidation):**
  - Saat mahasiswa menyelesaikan submit penilaian, cache lokal langsung diinvalidasi dan data rekapitulasi/presensi terbaru langsung diperbarui di latar belakang.
- **Reaktivitas Multi-Tab & Multi-Perangkat (Focus, Visibility & Storage Events):**
  - Mengaktifkan pendengar `visibilitychange` dan `window.focus` sehingga saat pengguna membuka kembali tab atau membuka kunci smartphone, data langsung disinkronkan secara instan.
  - Memanfaatkan event `storage` untuk sinkronisasi instan antar-tab browser di perangkat yang sama.
- **Admin Live Polling & Auto-Refresh:**
  - Panel Admin kini secara otomatis menyegarkan data daftar respons dan statistik keterisian secara berkala tanpa memerlukan klik manual tombol "Segarkan".

---

## [2.1.36] - 2026-08-23

### 🎨 Desain Highlight Header Soft Minimalis (Emerald Pastel Accent)
- **Transformasi Visual Header Kelompok Aktif:**
  - Menggantikan background hitam pekat (`bg-zinc-900 text-white`) dengan tema pastel mint/emerald yang lembut (`bg-emerald-50/80` dengan aksen garis bawah `border-b-2 border-b-emerald-500`).
  - Menyematkan badge pil sesi yang elegan (`bg-emerald-100/90 text-emerald-800 border border-emerald-200/60`) dengan dot indikator hijau segar.
  - Memberikan harmoni visual menyeluruh yang estetik, tidak membuat mata lelah, dan tetap menonjolkan kelompok yang sedang aktif/tampil secara jelas.

---

## [2.1.35] - 2026-08-23

### 🎯 Standardisasi Label Status Presensi (Zero Inconsistency)
- **Keseragaman Label "Belum Mengisi":**
  - Menyamakan seluruh indikator mahasiswa yang belum mengirimkan penilaian menjadi **"Belum Mengisi"**, menghilangkan inkonsistensi label `Belum (0/1)` pada anggota kelompok penyaji.
  - Aturan status kini konsisten untuk semua mahasiswa:
    - **Belum Mengisi:** Jika mahasiswa belum menilai satupun kelompok yang wajib dinilai.
    - **Sebagian (X/Y):** Jika mahasiswa baru menilai sebagian kelompok wajib.
    - **Selesai / Selesai (Penyaji):** Jika mahasiswa telah menuntaskan seluruh kewajiban penilaian di sesi aktif.

---

## [2.1.34] - 2026-08-23

### 🔍 Tipografi Kompak & Optimasi Kerapatan Sel Mobile
- **Font & Padding Kompak (Compact Table Typography):**
  - Mengurangi ukuran font dan padding sel tabel secara proporsional (`text-[10.5px]` untuk nama mhs, `text-[8.5px]` untuk NIM, dan `py-1 px-1.5` untuk padding sel).
  - Mengoptimalkan lebar minimum kolom (`#` 28px, `Mahasiswa & NIM` 120px, `Kel. Asal` 60px, kolom kelompok 65px) sehingga seluruh kolom utama dapat langsung muat di layar smartphone (320px–425px) tanpa terpotong berlebih.
- **Badge & Ikon Skala Halus:**
  - Lingkaran centang dan status badge berukuran ramping (`w-4 h-4` dengan ikon SVG `w-2.5 h-2.5` dan badge `text-[9.5px]`), menjaga keterbacaan tinggi dan kerapian estetis di semua perangkat.

---

## [2.1.33] - 2026-08-23

### 📱 Presisi Responsivitas Mobile-S/M/L & Eliminasi Kolisi Kolom
- **Eliminasi Tumpang Tindih Kolom Mobile (Zero Overlap):**
  - Mengubah perilaku sticky freeze tabel menjadi `md:sticky` sehingga pada layar smartphone (Mobile-S 320px, Mobile-M 375px, Mobile-L 425px), tabel melakukan *smooth horizontal scroll* secara alami tanpa terjadi tabrakan/tumpang tindih antara kolom nama dan kolom status.
  - Menambahkan petunjuk geser tabel (*horizontal scroll cue*) yang elegan di header tabel pada mode mobile.
- **Penyempurnaan Tata Letak Header Kartu Tabel:**
  - Header judul kartu status presensi disesuaikan secara responsif (`flex-col sm:flex-row`) agar judul, subtitle, dan badge hitungan mahasiswa tetap utuh dan terbaca tanpa terpotong di layar terkecil (320px).
- **Format Teks & Padding Rapi:**
  - Menerapkan `whitespace-nowrap` pada seluruh sel dan header agar nama mahasiswa dan status penilaian tidak terpotong menjadi baris berantakan saat digeser.

---

## [2.1.32] - 2026-08-23

### 🏷️ Penyesuaian Label "Kelompok Penyaji" & Default Pilihan "Semua"
- **Label Filter:** Mengubah label filter utama dari `Penyaji Target` menjadi **`Kelompok Penyaji`**.
- **Opsi Default:** Menyetel opsi default pada filter kelompok penyaji menjadi **`Semua`** secara konsisten.

---

## [2.1.31] - 2026-08-23

### ✨ Penyempurnaan Teks & Kontrol Filter Minimalis
- **Label & Opsi Dropdown Ringkas & Elegan:**
  - Mengubah label filter menjadi lebih natural dan minimalis (`Penyaji Target`, `Kelompok Asal`, `Status`).
  - Menyederhanakan teks opsi dropdown (`Semua Kelompok (Matriks)`, `Semua Kelompok`, `Semua Status`, `Selesai`, `Sebagian`, `Belum Mengisi`).
  - Menghilangkan teks deskripsi yang kaku dan panjang agar antarmuka tetap bersih, rapi, dan mudah dipindai mata.
- **Judul & Deskripsi Matriks Dinamis:**
  - Judul tabel otomatis menyesuaikan konteks: `Matriks Presensi Penilaian` saat mode matriks dan `Presensi Penilaian • [Kelompok]` saat mode fokus.
  - Subtitle kontekstual yang informatif dan padat tanpa teks berlebih.
- **Padding & Typography Polishing:**
  - Menyelaraskan padding, border halus `border-zinc-200/80`, dan placeholder pencarian yang bersih.

---

## [2.1.30] - 2026-08-23

### 🎯 Filter Presentator Interaktif & Tampilan Fokus Tabel Penilaian Per Kelompok
- **Filter Kelompok Presentator (Target Penilaian Spesifik):**
  - Menggantikan dropdown filter sesi statis dengan dropdown **Kelompok Presentator** yang dinamis (`Semua Kelompok Presentator (Matriks Lengkap)`, `Kelompok 1`, `Kelompok 2`, dst).
  - Ketika memilih presentator tertentu (misal `Kelompok 1`), tabel otomatis beralih dari matriks luas menjadi **Tabel Penilaian Khusus Kelompok Tersebut** untuk seluruh mahasiswa di kelas.
- **Dukungan Filter Mendalam (*Deep Filtering*):**
  - **Filter Kelompok Asal Mahasiswa:** Memungkinkan melihat kepatuhan penilaian mahasiswa dari kelompok asal tertentu terhadap presentator yang dipilih.
  - **Filter Status Penilaian Dinamis:**
    - Pada mode Presentator Spesifik: `Semua Status`, `Sudah Menilai [Kelompok]`, `Belum Menilai [Kelompok]`, dan `Anggota Penyaji [Kelompok]`.
    - Pada mode Matriks: `Semua Status`, `Selesai`, `Sebagian`, `Belum Mengisi`.
- **Statistik Ringkasan 4-Kartu Kontekstual & Real-Time:**
  - Kartu ringkasan di atas tabel otomatis menyesuaikan metrik sesuai kelompok presentator yang sedang dipilih:
    - `Total Mahasiswa`
    - `Sudah Menilai` (persentase & jumlah penilai)
    - `Anggota Penyaji` (jumlah anggota yang dibebaskan dari menilai kelompoknya sendiri)
    - `Belum Menilai` (persentase & jumlah yang belum menilai)
- **Tampilan Bersih & Minimalis:**
  - Kolom nama mahasiswa difreeze di kiri dengan shadow halus untuk kemudahan navigasi saat tabel digeser.

---

## [2.1.29] - 2026-08-23

### ⚡ Optimalisasi Kecepatan Muat & Desain Matriks Checklist Ultra-Minimalis (Compact Presensi)
- **Desain Minimalis Matriks Checklist (Anti-Ramai & Mudah Dibaca):**
  - Mengganti badge tebal berukuran besar dengan penanda ikon checklist presisi, halus, dan ringkas:
    - `✓` (Hijau Lingkaran Halus): Menandai kelompok yang sudah dinilai.
    - `✕` (Merah Lingkaran Halus): Menandai kelompok wajib pada sesi aktif yang belum dinilai.
    - `Penyaji` (Tag Ungu Ramping): Menandai anggota kelompok penyaji.
    - `-` (Abu-abu Pudar): Menandai kelompok pada jadwal sesi lain.
  - Penyesuaian padding baris dan font tabel agar lebih padat (*compact*), bersih, dan mudah dipindai mata layaknya buku presensi digital profesional.
  - Badge Status Kepatuhan dibuat lebih ramping dan elegan (`Selesai`, `Sebagian (X/N)`, `Belum (X/N)`).
- **Akselerasi Kecepatan Muat (Instant 0ms Stale-While-Revalidate):**
  - Menghilangkan proses loading blocking: Data rekapitulasi yang tersimpan di cache langsung dirender secara instan tanpa jeda saat beralih tab.
  - Sinkronisasi API berjalan di latar belakang (*silent sync*) tanpa mengunci antarmuka atau menampilkan spinner yang mengganggu.
  - Mengeliminasi kalkulasi render ganda (*duplicate execution*) pada sub-tab presensi.
- **Responsivitas Header Tab Mobile:**
  - Label sub-tab dinamis (`Presensi` di perangkat mobile, `Status Presensi` di desktop) untuk mencegah *text truncation* pada layar sempit.
- **100% Vector SVG Sharpness (0 Raw Emojis):**
  - Seluruh indikator checklist menggunakan SVG vektor murni yang tajam di seluruh resolusi layar (Android, iOS, Windows, Mac).

---

## [2.1.28] - 2026-08-23

### 📋 Transformasi Tabel Status Presensi Menjadi Matriks Checklist Presisi & Frozen Column
- **Tabel Matriks Checklist Kolom Dinamis:**
  - Merombak total tabel daftar status pengisian menjadi matriks checklist modern dengan kolom spesifik untuk setiap kelompok penyaji target.
  - Setiap cell kelompok dilengkapi badge status yang informatif dan elegan:
    - `👤 Penyaji` (Ungu/Purple): Menandai anggota kelompok penyaji yang tampil di kelompok tersebut.
    - `✓ Sudah` (Hijau/Emerald): Menandai bahwa mahasiswa telah menyelesaikan penilaian kelompok tersebut.
    - `✕ Belum` (Merah/Rose): Menandai kelompok yang wajib dinilai pada sesi aktif namun belum dikerjakan.
    - `-` (Abu-abu): Menandai kelompok yang dijadwalkan pada sesi lain.
- **Frozen / Sticky Column Layout (Mobile & Desktop Friendly):**
  - Kolom nomor urut `#` (`sticky left-0`) dan `Nama Mahasiswa & NIM` (`sticky left-10`) di-freeze di sisi kiri dengan shadow pembatas lembut, menjaga keterbacaan identitas mahasiswa saat pengguna melakukan scroll horizontal di perangkat layar sempit maupun lebar.
  - Kolom `Status Kepatuhan` di-freeze di sisi kanan (`sticky right-0`).
- **Highlight Sesi Aktif Minimalis & Kontras:**
  - Header kelompok yang tampil pada sesi aktif/terpilih disorot dengan styling kontras gelap (`bg-zinc-900 text-white`) disertai badge status `● Sesi Ini • Tampil`.
- **Logika Status Kelompok Penyaji Terkalibrasi (Aturan Presentator):**
  - Anggota kelompok tampil tetap diwajibkan menilai kelompok penyaji lain di sesi yang sama (jika ada lebih dari 1 kelompok).
  - Status akhir bagi anggota penyaji yang telah menilai kelompok lain diakui sebagai **`✓ Selesai (Penyaji)`** (Emerald), bukan dianggap belum mengisi.
  - Jika belum menilai kelompok penyaji lainnya, status ditandai **`⏳ Belum Menilai (X/N)`** secara proporsional.
- **Konfigurasi Fleksibel Pengaturan Admin:**
  - Menambahkan pengaturan `Kewajiban Menilai bagi Anggota Penyaji` di panel Pengaturan Admin (`admin.html`) dengan opsi `Wajib Menilai Kelompok Lain` vs `Bebas Penuh di Sesinya`.

---

## [2.1.27] - 2026-08-23

### 🎯 Integrasi Filter Sesi / Minggu pada Status Pengisian Presensi Penilaian
- **Filter Berbasis Sesi / Pertemuan (Session-Scoped Evaluation Target):**
  - Menambahkan dropdown **`Sesi / Minggu:`** pada bar kontrol tabel Status Pengisian Penilaian.
  - Memungkinkan penilai atau pengelola membatasi target evaluasi hanya pada kelompok yang tampil di sesi tertentu (misalnya: *Minggu 1* hanya Kelompok 1 dan 2 dari total 10 kelompok di kelas).
- **Kalkulasi Beban Penilaian Realistis Sesuai Jadwal Tampil:**
  - Mahasiswa yang telah menyelesaikan penilaian untuk kelompok yang tampil di sesi terpilih (misal 2 kelompok) langsung dinilai **`✓ Lengkap (2/2)`** untuk sesi tersebut, tanpa terbebani kelompok pada minggu-minggu berikutnya.
- **Kaskade Sinkronisasi Dropdown Filter:**
  - Pilihan pada dropdown *Presentator* menyesuaikan secara dinamis hanya menampilkan kelompok yang terdaftar pada sesi/minggu yang dipilih.

---

## [2.1.26] - 2026-08-23

### 📊 Rombak Total Sistem Tabel Status Pengisian Penilaian (Multi-Kelompok & Anti-Konflik)
- **Deteksi & Rincian Pengisian Parsial (Multi-Target Kelompok):**
  - Mengatasi konflik status pada evaluasi bertahap: Jika mahasiswa baru mengisi salah satu kelompok penyaji dan belum mengisi kelompok lainnya, sistem kini secara presisi mengklasifikasikan status sebagai **`Sebagian (1/N)`** alih-alih keliru menandai `Sudah Mengisi`.
  - Kolom **Rincian Penilaian Kelompok** kini menampilkan badge status visual untuk setiap kelompok penyaji target:
    - `✓ Kelompok X` (Hijau/Emerald) jika sudah dinilai.
    - `✕ Kelompok Y (Belum)` (Merah/Rose) jika belum dinilai.
    - `👤 Kelompok Z (Penyaji)` (Ungu/Purple) untuk anggota kelompok yang sedang tampil.
- **Kategori Status Akhir Komprehensif & 4 Kartu Statistik Responsif:**
  - Menghadirkan 4 kartu ringkasan dinamis:
    1. **Mode Semua Presentator:** *Total Mahasiswa*, *Lengkap (Semua Selesai)*, *Sebagian (Belum Lengkap)*, dan *Belum Mengisi (0 Kelompok)*.
    2. **Mode Presentator Tertentu:** *Total Mahasiswa*, *Sudah Menilai [Kelompok]*, *Belum Menilai [Kelompok]*, dan *Kelompok Penyaji*.
- **Dropdown Filter Status Cerdas:**
  - Pilihan opsi pada filter *Status Pengisian* beradaptasi secara dinamis sesuai mode penayangan (*Lengkap*, *Sebagian*, *Belum Mengisi* vs *Sudah Menilai*, *Belum Menilai*, *Kelompok Penyaji*).

---

## [2.1.25] - 2026-08-23

### ✨ Audit Total Tampilan Menjadi Modern-Elegan-Minimalist & Eliminasi Emoji Menyeluruh
- **De-emojifikasi Menyeluruh (Zero Raw Emojis):**
  - Mengaudit dan mengganti 100% karakter emoji raw unicode di antarmuka publik (`index.html`) maupun portal pengelola (`admin.html`) dengan ikon **inline SVG (Lucide & Heroicons design standard)** yang scalable, tajam, dan konsisten di seluruh perangkat dan resolusi layar (Mobile, Tablet, Desktop, 4K Retina).
- **Modernisasi Iconography & Tipografi Ranking:**
  - **Leaderboard Visual Chart Overview:** Mengganti emoji piala/medali dengan badges ranking monokrom & aksen emas elegan bertipografi monospace (`#1`, `#2`, `#3`) serta SVG `trending-up`, `bar-chart`, dan `star`.
  - **Action Buttons & Form Controls:** Tombol *Reset Draf*, *Isi Otomatis*, *Cetak Rekap*, *Input Massal*, *Segarkan*, dan *Hapus* kini dilengkapi inline SVG profesional.
  - **Sub-Tabs Switcher & Status Badges:** Tab navigasi (*Kelompok*, *Pemateri*, *Status Pengisian*, *Konfigurasi*, *Sistem*) dan badge sinkronisasi realtime kini menggunakan indikator status dot SVG dan layout presisi.
- **Penyempurnaan Modal Dialogs & Notifikasi Toast:**
  - Seluruh modal dialog kini menggunakan icon SVG tutup silang (`X`), status konfirmasi (`emerald check`), dan peringatan (`amber alert`).
  - Sistem toast notification melayang diperbarui dengan container badge SVG yang ramping dan modern.

---

## [2.1.24] - 2026-08-23

### ✏️ Penyempurnaan Terminologi Header Tabel Status Pengisian
- **Pembaruan Teks Header Tabel:**
  - Mengubah judul header tabel menjadi **`Daftar Status Pengisian Penilaian`** agar lebih presisi, profesional, dan sesuai dengan alur pengisian peer-assessment.

---

## [2.1.23] - 2026-08-23


### 📋 Rombak Total Sistem Filter Status Pengisian Presensi
- **Filter Berbasis Presentator, Kelompok Asal, dan Status Pengisian:**
  - Merombak total filter bar pada tab **Status Pengisian Presensi** menjadi 3 parameter:
    1. **Presentator:** Memilih kelompok tampil yang dinilai (*Semua Presentator*, *Kelompok 1*, *Kelompok 2*, dst.) untuk mengecek presensi penilaian terhadap kelompok tersebut secara spesifik.
    2. **Kelompok Asal:** Memfilter mahasiswa berdasarkan kelompok asalnya di kelas.
    3. **Status Pengisian:** Menyaring berdasarkan status `Semua Status`, `✓ Sudah Mengisi Form`, atau `⏳ Belum Mengisi Form`.
- **Kalkulasi Statistik & Badges Dinamis:**
  - Badges *Total Mahasiswa*, *Sudah Mengisi Form*, dan *Belum Mengisi Form* langsung menghitung persentase secara dinamis dan presisi sesuai kombinasi filter Presentator dan Kelompok Asal yang dipilih.
- **Tabel Presensi Responsif & Informatif:**
  - Kolom tabel disesuaikan menjadi: `#`, `Nama Mahasiswa`, `NIM`, `Kelompok Asal`, `Kelompok Dinilai`, dan `Status Pengisian`.
  - Kolom *Kelompok Dinilai* menyajikan badge kelompok mana saja yang telah dinilai oleh mahasiswa yang bersangkutan.

---

## [2.1.22] - 2026-08-23


### 🧹 De-duplikasi Antarmuka Tombol Reset Draf
- **Pembersihan Tombol Reset Draf Header Formulir:**
  - Menghapus tombol link teks *Reset Draf* pada header kartu Langkah 1 (*Identitas Penilai*) untuk mengeliminasi redundansi visual.
  - Seluruh fungsi pengosongan draf kini terpusat secara konsisten dan ergonomis pada tombol **`🗑️ Reset Draf`** di action bar bawah setiap langkah navigasi formulir (Langkah 1 s.d. 4).

---

## [2.1.21] - 2026-08-23


### 🔓 Rekapitulasi Hasil Independen dari Sesi Aktif (Full Filter-Driven)
- **Pelepasan Keterikatan Rekapitulasi dari Sesi Aktif:**
  - Seluruh bagian Dashboard Rekapitulasi Hasil (Visual Chart Leaderboard, Rekap Kelompok, Rekap Ulasan Pemateri, dan Rekap Presensi Status Pengisian) kini **tidak pernah terikat atau dibatasi oleh `Sesi_Minggu_Aktif`**.
  - Rekapitulasi menyajikan data secara menyeluruh (*Semua Sesi*) sebagai default tampilan, dan hanya berubah berdasarkan pilihan filter interaktif pengguna.
- **Filter Sesi & Kelompok Terpadu pada Rekap Kelompok & Pemateri:**
  - Menambahkan dropdown **Filter Sesi / Minggu** berdampingan dengan **Filter Kelompok** pada bar kontrol rekap, memungkinkan pengguna memfilter data spesifik per minggu pertemuan secara eksplisit atau melihat keseluruhan.
  - Dropdown filter kelompok menyesuaikan opsi secara otomatis dan dinamis berdasarkan sesi yang dipilih.
- **Sinkronisasi Komprehensif Status Pengisian Presensi:**
  - Filter sesi dan kelompok pada tabel presensi mengumpulkan seluruh sesi unik dari seluruh master data kelas (`allStudentsData`), `groupsData`, dan riwayat data `responsSheet` tanpa batasan sesi aktif.

---

## [2.1.20] - 2026-08-23


### 🗑️ Penempatan Tombol Reset Draf di Sebelah Tombol Lanjut & Visibilitas Cerdas Lintas-Step
- **Tombol Reset Draf di Setiap Langkah Navigasi (Step 1 s.d. Step 4):**
  - Menempatkan tombol **`🗑️ Reset Draf`** berdampingan langsung di sebelah tombol aksi utama (*Lanjut ke Pemilihan Kelompok*, *Lanjut ke Penilaian Skor*, *Lanjut ke Evaluasi Masukan*, dan *Kirim Penilaian*) pada action bar setiap section form.
  - Dirancang sesuai prinsip *Mobile-First* & standar aksesibilitas (target sentuh minimum 44px, styling soft-rose border `border-rose-200 bg-rose-50/60 text-rose-700`, layout flex responsif yang stabil di mobile portrait, landscape, tablet, hingga layar desktop lebar).
- **Deteksi Isian Cerdas & Visibilitas Otomatis (Smart Visibility Engine):**
  - Mengimplementasikan `hasAnyFormInputFilled()` dan `updateDraftResetButtonVisibility()` untuk mendeteksi penginputan secara real-time pada seluruh bagian formulir (NIM, Nama, Email, Pemilihan Kelompok, Pengaturan Skor, Pemilihan Presentator Terbaik, dan Masukan Tertulis Pemateri).
  - Tombol Reset Draf otomatis muncul ketika salah satu bagian input terisi atau draf tersimpan di storage lokal, dan otomatis tersembunyi saat form dalam keadaan kosong bersih.
- **Pembersihan Draf Aman & Menyeluruh:**
  - Fungsi `clearFormDraftManually()` dilengkapi dialog konfirmasi protektif untuk mencegah penghapusan draf yang tidak disengaja.

---

## [2.1.19] - 2026-08-23


### 🎓 Filter Peran Penilai di Rekapitulasi Hasil Penilaian
- **Default Sumber Data: Mahasiswa Terdaftar:**
  - Seluruh perhitungan rekapitulasi (rata-rata nilai, jumlah penilai, peringkat presentator, ulasan individu) kini secara default hanya berasal dari respons berperan **Mahasiswa terdaftar**, bukan campuran semua peran.
- **Backend: Agregasi Terpisah Per Peran (`Code.gs`):**
  - `getRecapData()` kini menghasilkan dua set data terpisah: `summaryMhs` (Mahasiswa saja) dan `summary` (semua peran, untuk backward-compatibility), diproses dalam satu iterasi data yang efisien.
- **Frontend: Role Filter Pills di Rekap:**
  - Menambahkan tiga pill filter sumber data di atas area rekapitulasi:
    - **🎓 Mahasiswa Terdaftar** (default aktif, ditandai hitam)
    - **👨‍🏫 Dosen & Lainnya** (hanya penilaian non-mahasiswa)
    - **🌐 Semua Penilai** (gabungan semua peran)
  - Switching antar pill langsung me-refresh seluruh tampilan rekap (kelompok, pemateri, chart) tanpa request ulang ke backend.
  - Badge label sumber data muncul di setiap kartu kelompok (hijau untuk Mahasiswa, ungu untuk Dosen, biru untuk Semua).
- **Filter Kelompok:** Dropdown kelompok kini menampilkan semua kelompok dari semua sumber data.

---

## [2.1.18] - 2026-08-23


### 🔄 Sinkronisasi Status Pengisian 100% Real-Time 2-Way (Presisi Tinggi)
- **Single Source of Truth — Backend ke Frontend:**
  - `getRecapData()` di [`Code.gs`](file:///e:/Data/GitHub/Project%20Dede/Code.gs) kini mengembalikan field baru: `submittedNims` (Set NIM valid), `submittedNames` (Set nama valid), `nimToKelompokMap`, dan `nameToKelompokMap`, semua diekstrak **langsung dari sheet respons** — bukan dari `evaluators[]`.
  - Eliminasi bug false-positive: `evaluasiList` (nama pemateri) tidak lagi dipakai sebagai proxy data penilai.
- **Frontend `renderRekapPresensi()` Direfactor Sepenuhnya:**
  - Status Sudah/Belum Mengisi kini dicocokkan via **NIM sebagai prioritas utama** (unik & presisi), lalu fallback nama hanya jika NIM tidak tersedia.
  - Roster mahasiswa kini menggunakan `allStudentsData` (master real-time dari backend) sebagai prioritas, bukan hanya `groupsData`.
  - Penghapusan duplikat roster via `seenNimInRoster` Set — mahasiswa yang sama tidak tampil dua kali walau ada di beberapa kelompok.
  - Sub-info **"menilai: Kelompok X"** ditampilkan di bawah nama mahasiswa yang sudah mengisi, menunjukkan kelompok mana yang dinilai.
  - Dosen & Tamu dirender dari `evaluators[]` secara terpisah — tidak mencampur dengan data presensi mahasiswa.
- **Fallback Backward Compatible:**
  - Jika backend lama (belum re-deploy) tidak mengembalikan `submittedNims`, frontend otomatis fallback ke `evaluators[]` untuk kompatibilitas.

---

## [2.1.17] - 2026-08-23


### 🐛 Perbaikan Error Kritis Pengiriman Penilaian & Optimasi Kinerja Backend
- **Fix Error `ReferenceError: sesi is not defined`:**
  - Memperbaiki bug kritis pada fungsi `submitAssessment()` di [`Code.gs`](file:///e:/Data/GitHub/Project%20Dede/Code.gs) di mana variabel `sesi` digunakan tanpa dideklarasikan terlebih dahulu dalam scope fungsi.
  - Variabel `sesi` kini diekstrak langsung dari `payload.sesi` yang dikirim frontend, dengan fallback ke `"Minggu 1"` jika tidak tersedia.
  - Tombol **Kirim Penilaian** pada Langkah 4 kini berfungsi tanpa error server.
- **Optimasi Kecepatan Tulis Data (Write Performance):**
  - Mengganti `appendRow()` dengan `getRange().setValues()` pada operasi penyimpanan respons untuk menulis langsung ke baris target tanpa overhead pencarian akhir baris oleh Apps Script.
  - ID Respons kini menggunakan rentang acak 4 digit (`1000–9999`) untuk memperkecil kemungkinan tabrakan ID pada submission bersamaan.
- **Optimasi Kecepatan Baca Cek Duplikat (Read Performance):**
  - Batch read cek duplikat kini hanya mengambil kolom C–K (9 kolom) alih-alih A–K (11 kolom), mengurangi data transfer dari Sheets API.

---

## [2.1.16] - 2026-08-23


### ⚡ Real-Time Spreadsheet Sync (No Redeploy Needed) & Penamaan Tombol 'Isi Otomatis'
- **Pembaruan Label Tombol Pintas Email:**
  - Mengubah teks tombol pintas email mahasiswa menjadi **`⚡ Isi Otomatis`** (sebelumnya `⚡ Gunakan Format NIM`) untuk instruksi yang lebih ringkas dan intuitif.
- **Roster Kelas Menyeluruh (Bypass Filter Sesi untuk Validasi NIM):**
  - Memperbarui `getFormInitialData()` pada [`Code.gs`](file:///e:/Data/GitHub/Project%20Dede/Code.gs) agar mengembalikan `allStudents` (seluruh mahasiswa kelas 5E dari semua kelompok dan sesi tanpa terpotong oleh filter sesi aktif minggu).
  - Setiap mahasiswa dari kelompok manapun (misal Kelompok 3, Minggu 2) dapat melakukan penilaian pada sesi aktif saat ini dan langsung terverifikasi dengan nama terisi otomatis.
- **Sinkronisasi Real-Time Langsung dari Spreadsheet (Tanpa Deploy Ulang):**
  - Mengimplementasikan `nocache=1` dan parameter timestamp `_t=${Date.now()}` pada pemanggilan API sehingga setiap perubahan data mahasiswa, nama, dan NIM di Google Spreadsheet langsung terbaca secara instan dan live saat halaman dibuka tanpa perlu redeploy Apps Script.
  - Menambahkan normalisasi string NIM (penghapusan spasi liar, case-insensitivity) pada [`index.html`](file:///e:/Data/GitHub/Project%20Dede/index.html).

---

## [2.1.15] - 2026-08-23

### 🔒 Kontrol Pengisian Manual & Tombol Format Email Khusus Mahasiswa
- **Penetapan Pengisian Email Manual Secara Default:**
  - Menghapus pengisian otomatis (*auto-fill*) email saat penginputan NIM untuk mencegah asumsi format email yang tidak diinginkan.
- **Tombol Pintas Format Email Mahasiswa (`⚡ Gunakan Format NIM`):**
  - Menambahkan tombol pintas manual khusus bagi mahasiswa untuk mengisikan format baku `NIM@mhs.ulm.ac.id` ke dalam field email dengan satu klik hanya jika diinginkan pengguna.
- **Pengosongan Baku Form Dosen & Penilai Tamu:**
  - Memastikan form identitas untuk peran **Dosen** dan **Lainnya / Tamu** selalu berstatus kosong (*clean form*) secara default tanpa auto-fill teks dummy/nama pengampu, serta menyembunyikan tombol pintas format email NIM.

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
  - Menghilangkan kebocoran kelas responsif CSS Tailwind (sm:grid-cols-2, dll.) di dalam kanvas lembar kerja A4, menggantinya dengan styling grid inline murni (
epeat(2, minmax(0, 1fr))).
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

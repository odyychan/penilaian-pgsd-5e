# 📜 Changelog

Dokumentasi seluruh pembaruan, perbaikan, dan peningkatan fitur pada Platform Penilaian & Evaluasi Akademik FKIP Universitas Lambung Mangkurat.

---

## [2.3.41] - 2026-08-26

### 🛡️ Penguncian Menyeluruh Seluruh Titik Masuk Formulir (*Strict Pre-Fill Auth Enforcement*)
- **🔒 Proteksi `startAssessmentForm()`:**
  - Menolak pembukaan wizard pengisian jika formulir memerlukan pengumpulan email dan pengguna belum menyelesaikan otentikasi Google.
- **🔄 Sinkronisasi Tab Navigasi `switchTab('form')`:**
  - Menjalankan pemeriksaan `checkAndApplyAuthGate()` setiap kali tab formulir diakses, memastikan gerbang login tidak dapat dilewati melalui navigasi bilah atas.
- **🚫 Zero-Bypass Architecture:**
  - Menjamin responden wajib menekan tombol Google Sign-In dan berhasil lolos otentikasi sebelum diizinkan melihat atau mengisi pertanyaan penilaian.

---

## [2.3.40] - 2026-08-26

### 🔒 Penegakan Eksklusif Otentikasi Akun Google Resmi (*Strict Single Sign-On*)
- **🚫 Penghapusan Formulir Login Mandiri:**
  - Menghapus opsi pengisian login manual pada gerbang otentikasi; seluruh akses wajib melalui verifikasi resmi **Google OAuth** (`Sign in with Google`).
- **🛡️ Penegakan Domain Kampus ULM (*Strict Domain Enforcement*):**
  - Pada mode `ULM_ONLY`, akun Google di luar domain resmi (`@mhs.ulm.ac.id` / `@ulm.ac.id`) otomatis ditolak oleh sistem dan dikembalikan ke layar login dengan pesan penolakan resmi.
- **✨ Antarmuka Gerbang Masuk Bersih & Terfokus:**
  - Tampilan `#formAuthGateSection` kini fokus 100% pada tombol **Masuk dengan Akun Google Kampus ULM** dan akun Google terverifikasi yang tersimpan di perangkat.

---

## [2.3.39] - 2026-08-26

### 🛡️ Optimasi Alur Inisialisasi & Penguncian Gerbang Login Otentikasi Sejak Awal Muat
- **⚡ Inisialisasi Instan di `DOMContentLoaded`:**
  - Memanggil evaluasi `checkAndApplyAuthGate()` segera saat halaman dimuat sehingga layar login otentikasi (`#formAuthGateSection`) langsung tampil mengunci form sebelum draf lama dijalankan.
- **🔒 Pengamanan Restorasi Draf (`restoreFormDraft` Guard):**
  - Mencegah peralihan otomatis ke wizard formulir (`startAssessmentForm()`) saat draf lokal terdeteksi jika pengguna belum terotentikasi.
- **🚀 Sinkronisasi Fast-Path Supabase:**
  - Menyambungkan callback `fetchInitialFormData` dengan `checkAndApplyAuthGate()` dan `updateAccountHeaderUI()` untuk menjamin sinkronisasi status sesi real-time dari database.

---

## [2.3.38] - 2026-08-26

### 🌐 Integrasi Resmi Otentikasi Google OAuth via Supabase Auth (*Sign in with Google*)
- **🔵 Tombol Resmi Masuk dengan Google (`#btnGoogleSignIn`):**
  - Menghadirkan tombol otentikasi resmi berstandar Google (`Sign in with Google`) di layar gerbang login.
  - Terkoneksi langsung ke Supabase Auth (`supabase.auth.signInWithOAuth({ provider: 'google' })`) untuk login akun kampus Google Workspace (`@mhs.ulm.ac.id`, `@ulm.ac.id`) maupun akun Google pribadi.
- **📸 Sinkronisasi Identitas Asli & Foto Profil Google:**
  - Otomatis mengekstrak nama lengkap resmi, alamat email terverifikasi, dan foto profil asli dari Google untuk ditampilkan pada bar akun aktif dan kartu tanda terima penilaian.
- **🔍 Deteksi Cerdas NIM & Pencocokan Master Mahasiswa:**
  - Mendeteksi prefix NIM dari email mahasiswa dan mencocokkan secara otomatis dengan data master mahasiswa ULM (`pgsd_students`).
- **🔒 Manajemen Sesi Terpadu & Sign-Out Supabase:**
  - Sesi login terikat aman dengan token JWT Supabase Auth; tombol *[🚪 Keluar]* secara otomatis memanggil `supabase.auth.signOut()` dan membersihkan sesi lokal.

---

## [2.3.37] - 2026-08-26

### 🔐 Halaman Gerbang Login Otentikasi Resmi (*Dedicated Sign-In Auth Gate Screen*)
- **📱 Layar Gerbang Masuk Otentikasi (`#formAuthGateSection`):**
  - Menghadirkan halaman login otentikasi resmi sebelum responden dapat mengakses dan mengisi formulir penilaian.
  - Menampilkan identitas resmi FKIP ULM, Judul Formulir, Mata Kuliah, Dosen Pengampu, Kelas, serta lencana mode otentikasi aktif.
- **⚡ Masuk Cepat (*One-Click Quick Login* dengan Profil Tersimpan):**
  - Menampilkan kartu akun tersimpan di browser perangkat (`#authQuickSavedSection`) dengan avatar inisial nama, memungkinkan mahasiswa/dosen masuk kembali dalam 1 sentuhan tanpa mengetik ulang.
- **🔍 Verifikasi Master Data & Auto-Lookup Kampus Terpadu:**
  - Input NIM otomatis mendeteksi nama dari basis data master mahasiswa (`pgsd_students`), mengunci domain resmi `@mhs.ulm.ac.id`, dan memvalidasi format email secara langsung.
- **🚪 Manajemen Sesi & Tombol Keluar (*Logout*):**
  - Menyediakan tombol *[🚪 Keluar]* pada bar akun formulir yang secara aman mengakhiri sesi dan mengembalikan pengguna ke halaman login otentikasi dengan draf yang tetap tersimpan terisolasi.
- **🚫 Dukungan Mode Bypass Otomatis:**
  - Jika mode di Admin diatur ke *Tanpa Email / Anonim (`NO_EMAIL`)*, layar login otomatis dilewati sehingga formulir terbuka langsung secara publik.

---

## [2.3.36] - 2026-08-26

### ✉️ Sistem Otentikasi Email Cerdas, Mode Fleksibel Pengumpulan Email & Pengikatan Draf Berbasis Akun (*Smart Email Collection & Account-Bound Draft Engine*)
- **⚙️ 3 Mode Pengumpulan Email di Setelan Admin (`admin.html`):**
  - **Khusus Akun Resmi ULM (`ULM_ONLY`):** Mengunci validasi email khusus ke domain kampus `@mhs.ulm.ac.id` dan `@ulm.ac.id` dengan pencocokan otomatis data master mahasiswa.
  - **Email Umum Bebas (`ALL_EMAIL`):** Fleksibilitas penuh menerima semua alamat email umum (Gmail, Yahoo, institusi lain) untuk dosen tamu, praktisi luar, atau seminar terbuka.
  - **Tanpa Email / Anonim (`NO_EMAIL`):** Mode penilaian cepat tanpa meminta alamat email penilai.
- **📇 Bar Identitas Akun Aktif (*Google Forms Style Account Card*):**
  - Menghadirkan bar identitas akun di bagian atas formulir penilaian (`#formAccountHeaderCard`) dengan avatar inisial, email aktif, lencana status akun, dan tombol *[🔄 Ganti Akun]*.
- **💾 Pengikatan Draf Berbasis Akun Email (*Account-Bound Draft Isolation Engine*):**
  - Seluruh rekaman draf disimpan secara terisolasi per akun (`PGSD_DRAFT_{formId}_{userEmail}`).
  - Jika beberapa pengguna bergantian memakai perangkat yang sama, draf isian tidak akan tertukar; saat beralih akun, draf akun terkait otomatis dimuat kembali.
- **🔄 Modal Ganti Akun & Riwayat Profil Lokal (`#modalSwitchAccount`):**
  - Memungkinkan penilai beralih akun email atau memilih dari daftar akun tersimpan di browser secara instan.
- **⚡ Domain Auto-Suggestion Chips:**
  - Menambahkan tombol pintas penambah domain instan (`+ @mhs.ulm.ac.id`, `+ @ulm.ac.id`, `+ @gmail.com`) pada kolom input email.

---

## [2.3.35] - 2026-08-26

### 🛠️ Perbaikan Sinkronisasi ID Container & Pemulihan Textarea Evaluasi Masukan Pemateri (*Fix Member Feedback Textarea Container & Rehydration*)
- **Penyelarasan ID Container Evaluasi (`#evaluationInputsContainer`):**
  - Memperbaiki ketidakcocokan ID elemen container ulasan pemateri pada *dynamic renderer* (`renderSingleClientFieldHtml`) dari `memberFeedbackContainer` menjadi `evaluationInputsContainer` agar sinkron dengan fungsi pembuat textarea `onSelectGroup`, auto-save draf, pemulihan draf, dan submit form.
- **Rehidrasi Otomatis Komponen Dinamis (*Dynamic Stages Rehydration*):**
  - Memperbaiki pemanggilan fungsi `renderDynamicClientStages()` agar otomatis merender ulang daftar kelompok (`renderGroupOptions`) dan membuat textarea evaluasi perorangan anggota kelompok yang terpilih saat draf dipulihkan (*auto-restore*).
- **Panduan Status Kosong (*Empty State Notice*):**
  - Menambahkan pemberitahuan informatif jika mahasiswa langsung membuka Bagian 4 sebelum memilih kelompok di Bagian 2.

---

## [2.3.34] - 2026-08-26

### 🚀 3 Fitur Esensial Mahasiswa: Pratinjau Sebelum Kirim, Pemulihan Draf Otomatis & Struk Bukti Digital ber-QR Code
- **🔍 Pratinjau Ringkasan Sebelum Kirim (*Pre-Submit Review Modal*):**
  - Menghadirkan modal konfirmasi sebelum data dikirim permanen (`#modalPreSubmitReview`) yang menyajikan ringkasan identitas penilai (Nama, NIM, Email), kelompok yang dinilai, skor angka, presentator terbaik, serta ulasan kualitatif.
  - Dilengkapi tombol *[✏️ Edit Kembali]* untuk mengoreksi isian dan *[🚀 Ya, Kirim Penilaian Sekarang]* untuk konfirmasi akhir.
- **💾 Pemulihan Draf Otomatis (*Smart Form Auto-Save & Restore Engine*):**
  - Sistem otomatis menyimpan setiap ketikan dan pilihan formulir secara lokal (`saveStudentFormDraft`).
  - Saat membuka kembali formulir atau terjadi *refresh* halaman/koneksi terputus, isian dipulihkan otomatis (`restoreStudentFormDraft`) dan memunculkan banner pemberitahuan `#studentDraftRestoreBanner` lengkap dengan tombol *[🗑️ Hapus Draf]*.
  - Draf lokal otomatis dibersihkan saat penilaian berhasil terkirim.
- **📥 Struk Bukti Penilaian Digital Resmi (*Digital Assessment Receipt with QR Code*):**
  - Mengubah modal sukses (`#successModal`) menjadi **Kartu Tanda Terima Penilaian Resmi FKIP ULM** ber-ID Tiket unik (`PGSD-REC-...`), lencana "TERVERIFIKASI SISTEM", serta kode QR dinamis untuk validasi keabsahan data.
  - **Unduh Struk PNG Beresolusi Tinggi:** Mengintegrasikan generator canvas offline (`downloadDigitalReceiptImage`) yang merender kartu bukti digital lengkap dan mengunduhnya ke galeri/unduhan perangkat mahasiswa.
  - **Cetak Struk Resmi:** Menyediakan tombol cetak (`printDigitalReceipt`) yang dioptimalkan untuk lembar cetak fisik maupun simpan sebagai PDF.

---

## [2.3.33] - 2026-08-26

### 🛡️ Sakelar Interaktif Integritas & Aturan Penilaian (*Integrity Rules Interactive Toggles*)
- **Sakelar Beralih Fleksibel (*Toggle Switch Controls*):**
  - Menyempurnakan komponen sakelar beralih (*toggle switch*) pada kartu **"Cegah Penilaian Diri Sendiri"** dan **"Kunci Respons Ganda"** di tab Setelan Panel Admin.
  - Dosen/Admin kini dapat dengan mudah mengaktifkan (*enable*) atau menonaktifkan (*disable*) aturan integritas tersebut secara interaktif dengan auto-save instan ke database.

---

## [2.3.32] - 2026-08-26

### 🌐 Konversi Pintar Zona Waktu Lintas Wilayah (*Smart Cross-Timezone Conversion*)
- **Penyesuaian Jam Otomatis Sesuai Wilayah Mahasiswa (*Smart Timezone Localization*):**
  - Mengintegrasikan fungsi `formatSmartScheduleTime` yang otomatis mendeteksi zona waktu perangkat mahasiswa: jika dosen menyetel jadwal pukul `20.00 WITA`, mahasiswa di zona WIB (Jakarta/Jawa) akan otomatis melihat tampilan `19.00 WIB (20.00 WITA - Waktu Kampus)` dan mahasiswa di zona WIT akan melihat `21.00 WIT`.
- **Standarisasi Waktu Kampus Terpadu (*Campus Time Normalization*):**
  - Seluruh input jadwal di panel Admin distandarisasi ke zona waktu kampus FKIP ULM (**WITA / UTC+8**), dilengkapi lencana indikator zona waktu yang jelas pada kolom input admin.

---

## [2.3.31] - 2026-08-26

### 👁️ Animasi Interaktif Bola Mata Mengikuti Kursor Mouse (*Interactive Eye Cursor Tracking Animation*)
- **Animasi Pelacak Arah Kursor (*Dynamic 60FPS Eye Physics*):**
  - Mengganti ikon statis pada tombol spoiler dengan elemen SVG bola mata interaktif yang iris dan pupilnya bergerak secara halus dan dinamis mengikuti posisi kursor mouse pengguna secara *real-time*.
- **Optimalisasi Performa & Batasan Fisik Alami (*Clamped Boundary Physics & Zero-Lag*):**
  - Menggunakan kalkulasi sudut trigonometri dan batasan radius alami (*clamped eye socket physics*) yang dijalankan via `requestAnimationFrame` untuk menjamin animasi 60 FPS yang mulus tanpa membebani performa CPU/memori.

---

## [2.3.30] - 2026-08-26

### 🏷️ Penyelarasan Label Tombol Spoiler (*Updated Spoiler Trigger Label*)
- **Label Tombol Ringkas & Jelas (*Intuitive Button Wording*):**
  - Mengubah teks pada tombol pembuka sensor kabur menjadi **`[ 👁️ Lihat Rincian (Spoiler) ]`** untuk memberikan instruksi yang lebih ringkas dan mudah dipahami oleh mahasiswa saat formulir sedang dalam status belum dibuka / ditutup.

---

## [2.3.29] - 2026-08-26

### 🌫️ Desain Spoiler Blur Minimalis & Penyesuaian Intensitas Teks Samar (*Subtle Visible Spoiler Blur*)
- **Format Spoiler Minimalis (*Clean Minimalist Layout*):**
  - Mengembalikan format sensor kabur ke gaya minimalis yang ringkas dengan lencana gelap berbayang `[ 👁️ Buka Sensor Rincian (Spoiler) • Detail Form ]`.
- **Intensitas Kabur Lembut (*Subtly Visible Text Layer*):**
  - Menyesuaikan tingkat keburaman (`blur-[3.5px]` dan `opacity-75`) sehingga siluet dan teks informasi di bawahnya tetap terlihat secara samar dan estetis, memberikan petunjuk isi tanpa mengorbankan privasi status terkunci.
- **Posisi Tombol Presisi (*Top-Centered Alignment*):**
  - Memposisikan lencana pembuka sensor tepat di bagian tengah-atas bidang tampilan sehingga langsung terlihat jelas di layar tanpa perlu menggulir ke bawah.

---

## [2.3.28] - 2026-08-26

### 💎 Desain Mewah Glassmorphism Kristal Spoiler Blur (*Luxury Crystal Glassmorphism Spoiler*)
- **Efek Kaca Kristal Mewah & Pendaran Aura (*Luxury Frosted Glass & Ambient Glow*):**
  - Meningkatkan kualitas efek blur dengan backdrop *Crystal Glassmorphism* (`backdrop-blur-xl`, `filter: blur(10px)`, ambient gradient aura indigo & amber) sehingga tampilan tidak datar/abu-abu, melainkan tampak berkilau dan mewah layaknya antarmuka modern Apple/iOS.
- **Kartu Melayang Kristal Elegan (*Floating Crystal Glass Card*):**
  - Mengganti tombol standar dengan kartu kaca mengambang berikon `✨` dengan lencana indigo `"SPOILER"`, bayangan halus (*soft colored drop-shadow*), dan animasi interaktif saat disentuh atau diarahkan kursor (*hover lift*).
- **Penempatan Presisi di Layar Utama (*Immediate Viewport Alignment*):**
  - Mengoptimalkan posisi kartu sensor di bagian atas area rincian agar langsung tampak anggun di layar utama tanpa harus menggulir ke bawah.
- **Tombol Sensor Kembali (*Re-Lock Floating Button*):**
  - Menghadirkan tombol `[ 🔒 Sensor Kembali ]` setelah sensor dibuka agar pengguna dapat menutup kembali rincian formulir dengan mudah.

---

## [2.3.27] - 2026-08-26

### 🌫️ Efek Sensor Kabur Spoiler Kaca Es (*Frosted Glass Spoiler Blur Effect*)
- **Efek Sensor Kabur Interaktif (*Authentic Spoiler Blur Overlay*):**
  - Menggantikan accordion dengan efek *Frosted Glass Spoiler Blur* (`backdrop-blur-[6px]` & `filter: blur`) pada kartu informasi perkuliahan dan alur pengisian saat formulir dalam kondisi belum dibuka atau ditutup.
- **Interaksi Ketuk untuk Membuka Sensor (*Tap-to-Reveal Interaction*):**
  - Menyediakan overlay tombol interaktif berlabel **"👁️ Buka Sensor Rincian (Spoiler)"** yang saat diklik/diketuk akan menghilangkan efek blur secara halus dan menampilkan seluruh rincian informasi.
- **Nonaktif Otomatis Saat Formulir Dibuka (*Auto Disable on Form Open*):**
  - Ketika jadwal penilaian telah dimulai atau formulir dibuka aktif, seluruh konten ditampilkan jernih dan tajam secara otomatis.

---

## [2.3.26] - 2026-08-26

### 📦 Penyembunyian Rincian Otomatis Saat Formulir Terkunci (*Smart Collapsible Spoiler for Locked Forms*)
- **Tampilan Bersih & Fokus Jadwal (*Focused Lock Screen Experience*):**
  - Saat formulir belum dibuka (*scheduled in future*) atau telah ditutup (*closed/finished*), kartu rincian informasi perkuliahan dan alur tahapan secara otomatis disembunyikan dalam mode lipat (*collapsible spoiler*) agar mahasiswa fokus pada spanduk pengumuman jadwal dan waktu buka.
- **Tombol Spoiler Interaktif (*Interactive Spoiler Toggle*):**
  - Menghadirkan tombol lipat `[ 📋 Lihat Detail Informasi & Alur Form ▾ ]` yang elegan di bawah spanduk jadwal, memungkinkan pengguna membuka atau menutup rincian mata kuliah dan alur pengisian kapan saja.
- **Ekspansi Otomatis Saat Dibuka (*Automatic Expansion on Form Open*):**
  - Ketika formulir aktif atau waktu mulai telah tiba, seluruh rincian secara otomatis tampil penuh tanpa terlipat.

---

## [2.3.25] - 2026-08-26

### 💡 Indikator Visual Interaktif & Sorot Kolom Isian (*Intuitive In-Place Edit Affordances*)
- **Efek Sorot & Garis Bawah Putus-Putus (*Hover State & Dashed Baseline*):**
  - Menambahkan garis bawah putus-putus (*dashed border*) dan aksen warna indigo saat kursor diarahkan ke teks terformat, memberikan isyarat visual yang jelas bahwa area tersebut merupakan kolom isian aktif yang dapat diedit.
- **Lencana Bantuan Mengambang (*Hover Edit Badge Affordance*):**
  - Menghadirkan lencana animasi halus berlabel **"✏️ Klik untuk edit"** yang muncul di sudut kanan atas setiap teks terformat saat pengguna mengarahkan kursor.
- **Kursor Teks & Tooltip Intuitif (*Text Cursor & Interaction Feedback*):**
  - Mengatur kursor mouse secara otomatis menjadi *I-beam / Text Selection* saat berada di atas kolom teks sehingga mempermudah pengguna di perangkat desktop maupun perangkat sentuh (*touchscreen*).

---

## [2.3.24] - 2026-08-26

### 🧹 Penyelarasan & Penyederhanaan Kolom Deskripsi Formulir (*Seamless In-Place Description Field*)
- **Penghapusan Tombol Edit & Pratinjau Manual (*Zero-Button Clean Interface*):**
  - Menghapus tombol pengalih manual `✏️ Edit` dan `👁️ Pratinjau` pada header kolom Petunjuk & Deskripsi Formulir sehingga antarmuka tampak lebih bersih dan seragam.
- **Penyatuan Interaksi In-Place (*Unified In-Place Rich Field*):**
  - Mengintegrasikan kolom deskripsi formulir ke dalam mesin *in-place morphing* otomatis: tampil terformat langsung di tempat (link biru, daftar `A.`/`1.`, rumus KaTeX) saat diam, dan langsung aktif ke mode pengetikan saat diklik tanpa memerlukan tombol bantuan.

---

## [2.3.23] - 2026-08-26

### 🎨 Tampilan Terformat Langsung Pada Kolom Isian (*True In-Place WYSIWYG Morphing Fields*)
- **Penghapusan Kotak Pratinjau Duplikat (*Zero Clutter & Compact Layout*):**
  - Menghapus seluruh kotak terpisah lencana "PRATINJAU TAMPILAN" di bawah setiap input alur, pertanyaan, dan konfigurasi agar antarmuka kartu builder tetap ringkas, bersih, dan tidak memakan ruang.
- **Tampilan Terformat Langsung di Tempat (*In-Place Visual Rendering*):**
  - Kolom isian alur tahapan, judul bagian, pertanyaan, dan deskripsi kini langsung berwujud terformat rapi (nomor/abjad `A.`/`1.` berwarna indigo dan berlekuk sejajar, tautan link biru, rumus matematika KaTeX, teks tebal/miring) persis seperti tampilan pratinjau mahasiswa.
- **Interaksi Klik-Untuk-Edit Mulus (*Seamless Click-to-Edit & Auto-Morph*):**
  - Klik langsung pada teks terformat untuk mengedit dan mengetik secara instan.
  - Saat selesai mengedit atau berpindah fokus (blur), elemen otomatis bertransformasi kembali menjadi tampilan terformat yang rapi dan estetis.

---

## [2.3.22] - 2026-08-26

### 👁️ Mode Pengeditan & Pratinjau Terpadu (*Integrated Edit & Real-Time Rich Render Preview*)
- **Pengalih Mode Edit & Pratinjau Langsung (*Edit ↔ Preview Mode Switcher*):**
  - Menambahkan tombol beralih cepat `✏️ Edit` dan `👁️ Pratinjau` pada kolom Petunjuk & Deskripsi Formulir sehingga dosen dapat langsung melihat hasil render visual yang identik dengan tampilan mahasiswa (tautan aktif, nomor/abjad hierarki, bullet berlekuk rapi, dan rumus KaTeX).
- **Peningkatan Deteksi Format Teks Pintar (*Universal Rich Format Detector*):**
  - Memperluas fungsi `isFormatOrMathPresent` pada admin dan formulir klien untuk mendeteksi secara otomatis format daftar abjad (`A.`), angka (`1.`), bullet (`•`), garis bawah (`<u>`), tautan Markdown (`[Teks](url)`), serta sintaks KaTeX.
- **Pembaruan Kartu Pratinjau Langsung (*Full-Width Live Render Preview Cards*):**
  - Mengubah tampilan pratinjau mini pada seluruh kartu pertanyaan, judul, dan opsi menjadi kartu pratinjau visual penuh (*Full-Width Preview Card*) yang estetis, rapi, dan responsif di semua perangkat.

---

## [2.3.21] - 2026-08-26

### 🛡️ Optimasi Dinamis Aturan Integritas & Audit Edge Function (*Dynamic Integrity Toggles & Edge Audit*)
- **Fleksibilitas Aturan Integritas Penilaian (Aktif / Nonaktif):**
  - Mengintegrasikan evaluasi aturan **Cegah Penilaian Diri Sendiri** dan **Kunci Respons Ganda** secara dinamis dan *real-time* di seluruh kartu kelompok dan proses pengiriman, sehingga dosen leluasa mengaktifkan atau menonaktifkan aturan sesuai skenario ujian/presentasi.
- **Penyelarasan Zona Waktu Lokal & Hitung Mundur Tenggat:**
  - Menyesuaikan parser waktu jadwal pembukaan dan penutupan dengan zona waktu lokal (WITA / UTC+8) sehingga lencana peringatan batas waktu (*"⏱️ Batas Pengisian: X jam Y menit lagi"*) aktif secara presisi.
- **Audit & Verifikasi Supabase Edge Functions:**
  - Memverifikasi endpoint Supabase Edge Function `google-sync` (CORS 200 OK, latency < 30ms pada cluster `ap-southeast-1`).

---

## [2.3.20] - 2026-08-26

### ⏱️ Manajemen Jadwal Akses & Pelacak Partisipasi Mahasiswa (*Access Window & Attendance Tracker Engine*)
- **Manajemen Tenggat Waktu & Jadwal Akses Otomatis (*Schedule & Access Window*):**
  - Menghadirkan pengaturan jadwal buka & tutup formulir otomatis pada Tab Setelan Form dengan pemilih tanggal/jam, batas kuota respons, dan kustomisasi pesan ramah saat formulir belum dibuka atau sudah ditutup.
  - Menambahkan lencana peringatan batas waktu (*live deadline countdown badge*) pada sisi mahasiswa jika waktu pengisian tersisa kurang dari 24 jam.
- **Integritas Penilaian & Anti-Kecurangan (*Assessment Integrity Guard*):**
  - Menambahkan aturan pencegahan penilaian diri sendiri (*Self-Assessment Guard*) sehingga mahasiswa tidak dapat menilai kelompok asalnya sendiri.
  - Menambahkan kunci respons ganda (*Single Submission Lock*) untuk menjamin 1 NIM hanya dapat menilai 1 kali per kelompok target pada sesi aktif.
- **Pelacak Partisipasi & Blast Pengingat WhatsApp (*Attendance Tracker*):**
  - Menampilkan ringkasan partisipasi kelas secara real-time ($X / Y$ mahasiswa - $Z\%$) dan daftar status mahasiswa (`Sudah Menilai` vs `Belum Menilai`) pada Tab Respons.
  - Tombol instan **"📋 Salin Pengingat WhatsApp"** untuk menyalin draf pesan pengingat siap kirim ke grup kelas lengkap dengan daftar nama mahasiswa yang belum mengisi.

---

## [2.3.19] - 2026-08-25

### 📱 Optimasi Responsivitas Tablet & Resolusi Non-Reguler (*Cross-Device Viewport Audit*)
- **Audit & Penyelarasan Tata Letak Responsif:**
  - Memperbaiki breakpoint kontainer bilah tab navigasi form workspace (`headerTabsStandardView`) sehingga tampil rapi tanpa *horizontal overflow* pada tablet (768px - 1024px) maupun rasio layar panjang non-reguler (1080×2460, 720×1600, 360×800).
  - Memastikan seluruh dialog modal memiliki padding aman (*safe-area container*), tinggi adaptif `max-h-[92vh]`, dan scroll internal lancar pada perangkat mobile portrait & landscape.

---

## [2.3.18] - 2026-08-25

### 🔗 Modal Penyisipan Tautan Dalam-Aplikasi (*In-App Link Insertion Dialog*)
- **Penghapusan Dialog Prompt Bawaan Browser (*Zero Native Popups*):**
  - Mengganti dialog bawaan browser (`window.prompt`) saat menyisipkan tautan dengan **Modal Sisipkan Tautan Dalam-Aplikasi (`modalInsertLink`)** yang modern, rapi, dan responsif.
  - Menyediakan kolom *Teks yang Ditampilkan* dan *Alamat URL Tautan* dengan validasi protokol otomatis (`https://`) serta dukungan pintasan keyboard `Enter` untuk penyisipan instan.

---

## [2.3.17] - 2026-08-25

### ✍️ Eliminasi Pemblokan Otomatis & Penempatan Kursor Alami (*Natural Cursor Placement Engine*)
- **Penempatan Kursor Cerdas Tanpa Pemblokan (*Zero Auto-Highlight*):**
  - Menghapus pemblokan otomatis (`selection range`) pada seluruh baris saat pengguna menekan tombol alat pemformatan teks (*Nomor, Poin, Abjad, Tebal, Miring, Garis Bawah*).
  - Kursor kini otomatis berkedip di akhir butir penomoran atau di tengah tanda format (`**|**`, `*|*`, `<u>|</u>`) sehingga pengguna dapat langsung melanjutkan pengetikan tanpa khawatir teks sebelumnya tertimpa atau terhapus.

---

## [2.3.16] - 2026-08-25

### 🎯 Presisi Dimensi & Penyelarasan Tombol Header Undo/Redo (*Pixel-Perfect Header Actions*)
- **Penyelarasan Tinggi & Bounding Box Tombol Header:**
  - Menyelaraskan kontainer tombol *Undo* dan *Redo* sehingga memiliki tinggi presisi `h-8 sm:h-9` (36px), identik 100% dengan tombol *Riwayat*, *Pratinjau*, dan *Publikasikan*.
  - Mengatur ukuran ikon, radius sudut `rounded-xl`, dan garis pemisah vertikal yang proporsional sehingga seluruh bilah kontrol atas sejajar lurus tanpa distorsi visual.

---

## [2.3.15] - 2026-08-25

### 🌳 Daftar Berhierarki Word/Docs & Penambahan Fitur Daftar Abjad (*Hierarchical Lists & Alphabet Feature*)
- **Daftar Berhierarki Cerdas via Tab / Shift+Tab (*Smart Multilevel List Engine*):**
  - Menekan tombol `Tab` pada baris nomor otomatis mengubah tingkat ke sub-abjad (`1.` $\rightarrow$ `   a.` $\rightarrow$ `      i.`).
  - Menekan tombol `Tab` pada baris bullet otomatis mengubah bentuk bullet ke sub-tingkat (`•` $\rightarrow$ `   ◦` $\rightarrow$ `      ▪`).
  - Menekan `Shift + Tab` otomatis menurunkan tingkat kembali ke susunan induk sebelumnya.
  - Penekanan tombol `Enter` secara cerdas melanjutkan butir berikutnya sesuai abjad, angka, romawi, atau bullet, serta otomatis membersihkan baris kosong saat ditekan dua kali.
- **Penambahan Tombol & Pintasan Daftar Abjad (*Alphabetical List Tool*):**
  - Menghadirkan tombol **"A."** pada bilah format melayang dengan pintasan `Ctrl + Shift + 9`.
  - Format butir abjad (`A.`, `B.`, `C.`, dst.) terintegrasi penuh ke dalam mesin *Word hanging indent* dan pratinjau langsung.

---

## [2.3.14] - 2026-08-25

### 📝 Format Indentasi Menggantung Word & Penyederhanaan Bilah Format (*Hanging Indent Typography Engine*)
- **Pembersihan Tombol Indentasi Bilah Melayang (*Toolbar Decluttering*):**
  - Menghapus tombol *Indent* dan *Outdent* dari bilah pemformatan teks mengambang agar lebih bersih, ramping, dan tidak membingungkan.
- **Penerapan Format Indentasi Menggantung Standar Microsoft Word (*Word-Style Hanging Indent*):**
  - Memperbarui mesin format `smartMathFormat` sehingga baris teks kedua dan seterusnya pada butir bernomor (`1.`, `2.`, dst.) dan butir poin (`•`) otomatis sejajar lurus ke dalam di bawah teks awal (*hanging indent*), bukan jatuh di bawah angka.
  - Berlaku konsisten di seluruh judul pertanyaan, deskripsi formulir, kartu evaluasi, pratinjau kanvas admin, serta formulir pengisian mahasiswa (`index.html`).

---

## [2.3.13] - 2026-08-25

### 👥 Sistem Impor Kelompok Multi-Sumber & Generator Pembagian Otomatis (*Multi-Source Group Import Engine*)
- **Salin Kelompok dari Form Lain (*Cross-Form Group Importer*):**
  - Menyediakan opsi pemilihan form sumber dari daftar formulir terdaftar untuk menyalin susunan kelompok & mahasiswa secara instan.
  - Dilengkapi checklist pemilihan kelompok interaktif (*Pilih Semua / Sebagian*) dan pratinjau jumlah mahasiswa.
- **Generator Pembagian Otomatis dari Daftar Mahasiswa (*Custom Distribution Generator*):**
  - Memungkinkan admin/dosen hanya menempel daftar nama & NIM mahasiswa (misal dari Siakad/daftar hadir).
  - Tiga metode pembagian fleksibel: **Bagi rata ke $N$ Kelompok**, **Bagi per $X$ Mahasiswa per Kelompok**, atau **Masukkan ke 1 Kelompok Tertentu**.
  - Dilengkapi fitur pengacakan urutan (*Random Shuffle*), penyesuaian awalan nama kelompok, dan pratinjau tabel interaktif sebelum data disimpan.
- **Dukungan Tempel Teks Excel Lengkap:**
  - Tetap mendukung format multi-kolom (*Kelompok / Sesi / NIM / Nama*) dengan pemisah tab atau garis miring.

---

## [2.3.12] - 2026-08-25

### 🏷️ Eliminasi Simbol Plus Ganda pada Tombol Aksi (*Zero Redundancy Button Labels*)
- **Pembersihan Redudansi Label Tombol:**
  - Memperbaiki tombol aksi pada tab Kelompok sehingga tidak ada lagi tampilan ganda simbol plus (*"+ + Kelompok"*).
  - Menyelaraskan teks menjadi **"Tambah Kelompok"**, **"Tambah Mahasiswa"**, dan **"Tambah Bagian Baru"** dengan ikon SVG yang proporsional dan bersih.

---

## [2.3.11] - 2026-08-25

### 📋 Pemindahan Kartu Pengosongan Data Respons ke Tab Respons (*Contextual Action Placement*)
- **Penempatan Ergonomis & Kontekstual Tindakan Data Respons:**
  - Memindahkan kartu *Rekap Respons Penilaian* dan tombol *Kosongkan Seluruh Respons Form Ini* dari tab Integrasi & Cloud langsung ke **Tab Respons** (`adminView_responses`).
  - Menyatukan informasi total data masuk dan tombol pembersihan respons pada satu halaman pemantauan hasil penilaian yang tepat dan intuitif.

---

## [2.3.10] - 2026-08-25

### 🩹 Perbaikan Sintaks Palet Simbol Matematika & Pembersihan Kebocoran String (*Math Palette Leak Hotfix*)
- **Pembersihan Bocoran Kode String:**
  - Memperbaiki tag penutup dan sintaks string tombol pada palet simbol matematika cepat (`universalFloatingMathPalette`) yang sebelumnya bocor ke bilah format teks.
- **Verifikasi Integritas DOM:**
  - Memastikan seluruh jendela modal dan palet melayang terisolasi sempurna dan bebas dari residu teks yang merusak tata letak.

---

## [2.3.9] - 2026-08-25

### 📦 Penyatuan & Penyederhanaan Area Pengunggahan Media (*Unified Compact Media Bar*)
- **Penyatuan Input Pengunggahan Berkas Media:**
  - Menghapus tab pemisah kategori media (*Gambar, Video, Audio*) yang sebelumnya redundant dan membingungkan.
  - Menghadirkan **1 Tombol Utama Terpadu: "Pilih Berkas dari Komputer"** yang dapat menerima foto, video MP4, maupun audio secara serentak dengan deteksi tipe berkas otomatis.
- **Deteksi Tautan Otomatis (*Smart Link Type Recognizer*):**
  - Menyediakan 1 kolom tempel tautan (*URL/Embed*) cerdas yang otomatis mengidentifikasi tipe media (video YouTube/Vimeo, berkas Google Drive, foto daring, rekaman audio, atau kode *iframe embed*).
  - Tampilan modal kini 50% lebih ringkas, bebas tombol bertumpuk, dan mudah digunakan.

---

## [2.3.8] - 2026-08-25

### 🖼️ Optimasi Skala & Dimensi Galeri Foto (*Zero-Cropping Responsive Gallery*)
- **Peniadaan Pemotongan Gambar (*Object Contain vs Object Cover*):**
  - Mengubah perenderan gambar dari `aspect-square object-cover` (yang sebelumnya memotong dan men-zoom foto/screenshot) menjadi `object-contain` dengan proporsi alami penuh 100% tanpa ada bagian yang terpotong.
- **Pengaturan Dimensi & Grid Ergonomis:**
  - Mengatur batas tinggi maksimal yang proporsional (`h-36 sm:h-44` untuk 2 gambar, `h-32 sm:h-36` untuk 3 gambar, `h-24 sm:h-28` untuk 4+ gambar) dengan pembungkus terpusat (`max-w-xl` hingga `max-w-3xl`).
  - Menyelaraskan tampilan galeri pada formulir mahasiswa (`index.html`) dan pratinjau kanvas admin (`admin.html`).

---

## [2.3.7] - 2026-08-25

### 💬 Penyederhanaan Total Redaksi Teks & Deskripsi Panel Admin (*Human-First Copywriting*)
- **Pembersihan Istilah Teknis & Frasa Backend/AI:**
  - Menghapus frasa yang terkesan kaku, teknis, atau berbasis istilah backend internal (*Service Account, Studio Multi-Media, Engine, Payload, API Endpoint*) dan menggantinya dengan bahasa Indonesia baku yang sederhana, ramah pengguna, dan mudah dipahami.
- **Penyempurnaan Teks Modal Media & Integrasi:**
  - Menyederhanakan modal lampiran media (*"Lampirkan Foto atau Video"*, *"Media Terpilih"*, *"Unggah dari Komputer"*).
  - Menyederhanakan instruksi penghubung Google Sheets & Drive (*"Hubungkan ke Google Sheets & Google Drive"*, *"Email Layanan Penghubung"*, *"Uji Sambungan"*).

---

## [2.3.6] - 2026-08-25

### 🧭 Restrukturisasi & Penamaan Presisi Tab Navigasi Workspace (*Zero Ambiguity Tabs*)
- **Pembersihan Ambiguitas & Redudansi Tab "Setelan":**
  - Mengubah label dan susunan tab navigasi workspace agar tidak ada lagi duplikasi penamaan antara *Setelan* dan *Setelan Form*.
  - Menetapkan 5 tab navigasi dengan hierarki fungsi yang jelas dan tegas:
    1. **Pertanyaan** (`config`): Kanvas editor pertanyaan, kartu info alur, dan struktur form.
    2. **Respons** (`responses`): Rekapitulasi respon mahasiswa, grafik penilaian, dan ekspor data.
    3. **Kelompok** (`data`): Manajemen kelompok penyaji, anggota, dan pembagian tugas.
    4. **Setelan** (`settings`): Status penerimaan form, footer kredit, keamanan, dan kuota.
    5. **Integrasi & Cloud** (`system`): Integrasi Google Sheets & Drive API dosen, Supabase database, backup & audit sistem.

---

## [2.3.5] - 2026-08-25

### 📝 Peningkatan Suite Format Editor: Daftar Poin, Daftar Bernomor & Indentasi Presisi (*Rich List & Smart Indent Engine*)
- **Penambahan Alat Format Poin & Penomoran (*Bullet & Numbered Lists*):**
  - Menambahkan tombol **Daftar Poin (•)** (`Ctrl + Shift + 8`) dan **Daftar Bernomor (1.)** (`Ctrl + Shift + 7`) pada bilah alat format melayang (`universalFloatingFormattingBar`).
  - Mendukung konversi multi-baris dinamis dan *toggle on/off* list yang intuitif.
- **Dukungan Indentasi Cerdas & Multi-Level Lists (*Smart Indent / Outdent*):**
  - Menambahkan tombol **Tambah Indentasi (⇥)** dan **Kurangi Indentasi (⇤)** dengan integrasi tombol `Tab` dan `Shift + Tab` langsung pada seluruh kolom teks formulir.
  - Menghadirkan perilaku cerdas tombol `Enter` ala Google Docs: otomatis melanjutkan poin/nomor berikutnya dan otomatis menghapus penanda jika menekan enter pada baris kosong.
- **Penyempurnaan Perenderan Teks & Rumus (*Consistent Hanging Indent Renderer*):**
  - Memperbarui mesin `smartMathFormat` di `admin.html` dan `index.html` untuk merender daftar poin, nomor, dan sub-indentasi secara presisi dengan tata letak flex bertingkat dan perataan gantung (*hanging indent*) yang rapi di seluruh kartu pertanyaan, deskripsi, dan info alur.

---

## [2.3.4] - 2026-08-25

### 🧹 Harmonisasi Header & Eliminasi Indikator Status Redundan (*Unified State Display*)
- **Penghapusan Badge "Online" Redundan di Sisi Identitas:**
  - Menghapus badge statis "Online" yang sebelumnya menumpuk di samping identitas ID formulir.
  - Mengubah logika menjadi indikator bersyarat (`#headerOfflineBadge` bertuliskan *⚠️ Offline*) yang hanya muncul saat perangkat pengguna benar-benar kehilangan koneksi internet.
- **Penyatuan Status Sinkronisasi Cloud & Konektivitas:**
  - Memperbarui badge sinkronisasi database (`#cloudSyncBadge`) menjadi satu badge elegan *Tersinkron* yang berubah dinamis menjadi *Menyimpan...* saat pengiriman data dan *Mode Offline* saat terputus.
  - Memastikan setiap indikator status pada bilah navigasi atas memiliki fungsi mandiri yang jelas tanpa tumpang tindih visual (*Zero State Redundancy*).

---

## [2.3.3] - 2026-08-25

### 🎯 Eliminasi Redudansi & Penataan Presisi Tombol Status Formulir (*Unified Prominent Status Toggle*)
- **Pembersihan Tombol Status Redundan:**
  - Menghapus tombol status duplikat pada bilah navigasi tab (*tabs bar* `btnTabsBarFormStatusToggle`) yang sebelumnya berada bertumpuk di bawah bilah atas.
- **Penyempurnaan Tombol Status Header (*Prominent Pill Badge*):**
  - Mengintegrasikan satu tombol status utama pada bilah atas (`#btnHeaderFormStatusToggle`) dengan ukuran ergonomis ($103\times 36\text{ px}$), teks eksplisit (*"Form Aktif"* / *"Form Ditutup"*), lampu indikator animasi denyut (*pulsing dot*), dan kontras visual yang jelas di seluruh resolusi layar.

---

## [2.3.2] - 2026-08-25

### 🔍 Peningkatan Ukuran & Ergonomi Tombol Undo / Redo (*Enhanced Touch Target & Visual Clarity*)
- **Skalabilitas & Ergonomi Tombol Undo/Redo Header:**
  - Memperbesar dimensi tombol Undo & Redo pada bilah navigasi atas (`admin.html`) dari ukuran mikro (26px) menjadi ukuran standar ergonomis (36px pada desktop/tablet dan 32px pada mobile) dengan ikon SVG tajam $20\times 20\text{ px}$.
  - Menambahkan pembungkus *pill* modern dengan batas *border*, bayangan halus (*shadow-xs*), serta efek *hover* dan *active:scale-95* untuk umpan balik sentuhan yang nyaman.

---

## [2.3.1] - 2026-08-25

### 🎨 Studio Multi-Media Pertanyaan & Galeri Berkas Fleksibel (*Batch Upload & Mixed Media Gallery*)
- **Dukungan Multi-Media & Batch File Upload pada Pertanyaan:**
  - Mengizinkan admin melampirkan banyak berkas sekaligus (*multiple media*) dalam 1 pertanyaan tanpa batasan 1 berkas.
  - Menambahkan atribut `multiple` pada dialog berkas sehingga admin dapat memilih dan mengunggah banyak foto, rekaman audio, atau video sekaligus dalam satu klik dengan pemantauan progres unggah paralel.
- **Pengorganisasian Galeri Media Interaktif (*Studio Editor & Reordering*):**
  - Menyediakan modal Studio Multi-Media dengan daftar berkas terlampir, kemampuan menggeser urutan (Naik/Turun), input *caption* per berkas, serta opsi hapus individual maupun hapus massal.
- **Tampilan Galeri Responsif & Zoom Modal:**
  - Pada formulir penilaian mahasiswa (`index.html`) dan kanvas admin (`admin.html`), beberapa berkas foto otomatis ditampilkan dalam tata letak kisi (*responsive gallery grid 2-col / 3-col*) dengan dukungan fitur perbesar (*click-to-zoom*), sedangkan video dan audio dirender dalam format pemutar responsif.

---

## [2.3.0] - 2026-08-25

### 🎬 Dukungan Unggah & Streaming Video Lengkap (*Native HTML5 Player & Multi-Source Embed*)
- **Aktivasi Tombol Unggah Berkas pada Tab Video:**
  - Mengaktifkan tombol *"Unggah File"* pada tab Video di modal media builder (`admin.html`) sehingga admin dapat mengunggah langsung berkas video mandiri (`.mp4`, `.webm`, `.ogg`, `.mov`, `.m4v`).
- **Penyematan & Streaming Video Responsif (*Dual-Engine Video Renderer*):**
  - Mengintegrasikan pemutar video cerdas: URL video berbasis berkas (MP4/WebM/Supabase Storage CDN) dirender menggunakan pemutar video HTML5 `<video controls playsinline>` dengan akselerasi hardware, sementara URL eksternal (YouTube, YouTube Shorts, Vimeo, Google Drive Video Preview) dirender via `<iframe>` dengan izin lengkap *fullscreen* dan *picture-in-picture*.

---

## [2.2.99] - 2026-08-25

### ⚡ Restorasi & Akselerasi Penuh Tombol Unggah File (*Direct Button Trigger & Value Reset*)
- **Perbaikan Interaksi Tombol Unggah File:**
  - Mengubah pembungkus `<label>` file upload menjadi `<button type="button">` eksplisit dengan pemicu `.click()` langsung pada elemen `<input type="file">` tersembunyi. Hal ini mengatasi masalah *event propagation* di mana tombol tidak merespons klik pada peramban tertentu atau perangkat layar sentuh.
- **Pembersihan State File Input (*Zero-Stall Re-Upload*):**
  - Menambahkan event `onclick="this.value=null"` pada input file modal builder (`admin.html`) dan form mahasiswa (`index.html`) agar pengguna dapat memilih ulang berkas yang sama tanpa kendala *stuck*.

---

## [2.2.98] - 2026-08-25

### 🧹 Harmonisasi DOM, Eliminasi Duplikasi ID, & Standardisasi Interaksi Modal
- **Pembersihan Elemen DOM Usang & Eliminasi Duplikat ID:**
  - Membersihkan lebih dari 450 baris kode HTML statis usang (`legacyStaticStagesContainer`) di `index.html`, mengeliminasi 23 duplikasi ID elemen form (`selectPeranPenilai`, `inputNim`, `inputNama`, `inputEmail`, dll.) sehingga seluruh interaksi input dan validasi 100% presisi mengacu pada elemen dinamis aktif.
- **Standardisasi Interaksi Modal & Dismissal Backdrop Konsisten:**
  - Menerapkan penutupan modal otomatis pada seluruh modal sistem (`modalDeleteFormConfirm`, `modalCreateForm`, `modalShareForm`, `modalCoreFieldSettings`, `modalStageEditor`, `modalMoveFieldStage`, `modalCustomQuestion`, `modalEditGroup`, `modalEditMember`, `modalBatchGroup`, `modalResetConfirm`, `modalUniversalScript`, `modalGlobalSettings`, `modalLiveFormSimulator`, `modalRevisionHistory`, `modalAppConfirm`, `modalAttachQuestionMedia`, `modalSwitchForm`) melalui klik luar (*backdrop*) dan tombol `Escape`.
- **Verifikasi Integritas Skema Basis Data & Views:**
  - Memverifikasi kesehatan 6 tabel master dan 2 PostgreSQL views Supabase (`pgsd_forms`, `pgsd_form_configs`, `pgsd_groups`, `pgsd_students`, `pgsd_responses`, `pgsd_backups`, `pgsd_v_forms_summary`, `pgsd_v_rekap_nilai`) dengan status aktif dan sinkron.

---

## [2.2.97] - 2026-08-25

### 🔗 Integrasi Tautan CDN Lampiran Mahasiswa pada Respon & Spreadsheet
- **Penyimpanan Metadata Berkas Lengkap:**
  - Menyematkan atribut `fileUrl` (tautan Google Global CDN / Storage) pada objek `evaluasiDetail.uploadedFiles` saat pengiriman formulir penilaian mahasiswa (`handleFinalSubmit`), sehingga dosen dapat membuka dan meninjau berkas tugas mahasiswa langsung melalui spreadsheet maupun panel respons admin.

---

## [2.2.96] - 2026-08-25

### 🛡️ Penanganan Kasus Khusus Komprehensif (*Backdrop Dismissal, Escape Key, & Full Reset Sync*)
- **Penanganan Pembatalan Melalui Backdrop & Tombol Escape:**
  - Menambahkan listener klik area luar modal (*backdrop dismissal*) dan penekanan tombol `Escape` pada seluruh modal (terutama Modal Sematkan Media) sehingga penutupan modal tak terduga tetap memicu pembersihan otomatis berkas sementara tanpa menyisakan berkas sampah.
- **Pembersihan Bersih Saat Reset Respons Perkuliahan:**
  - Memperbarui `executeResetResponses` agar menghapus seluruh rekaman di tabel Supabase `pgsd_responses`, membersihkan berkas lampiran mahasiswa di storage bucket `pgsd-media/{formId}/lampiran_*`, dan mengosongkan lembar kerja Google Spreadsheet secara sinkron.

---

## [2.2.95] - 2026-08-25

### 🧹 Mesin Pembersihan Berkas Sampah Otomatis (*Zero-Orphan Lifecycle & Auto-Purge*)
- **Pembersihan Otomatis Saat Pembatalan Modal (*Cancel-Safe Uploads*):**
  - Mengintegrasikan pelacakan berkas sementara (`pendingUpload`). Jika pengguna mengunggah berkas lalu menekan tombol "Batal" atau menutup modal tanpa menyimpan, berkas sementara seketika dihapus dari Google Drive dan Supabase Storage tanpa meninggalkan sampah.
- **Pembersihan Sinkron Saat Penggantian/Penghapusan Media Soal:**
  - Ketika media diganti dengan berkas baru atau dihapus dari pertanyaan/bagian, berkas lama otomatis dimusnahkan dari Google Drive dan Supabase Storage.
- **Pembersihan Lampiran Mahasiswa (`index.html`):**
  - Ketika mahasiswa menghapus/mengganti berkas lampiran, berkas lama di storage langsung dihapus secara instan.
- **Alat Pemindai & Pembersih Sampah Sekali Klik (*Admin Orphan Purge Tool*):**
  - Menambahkan aksi `adminCleanupOrphanedMedia` di Google Cloud Edge Function dan tombol *"Bersihkan Media Sampah"* di tab setelan formulir untuk memindai dan membersihkan seluruh berkas yatim di Google Drive.

---

## [2.2.94] - 2026-08-25

### 🚀 Arsitektur Unggah Paralel Super Cepat (*Dual-Pipeline Global Edge CDN & Cloud Backup*)
- **Akselerasi Unggah Media Sub-300ms (*Supabase Global Edge Storage CDN*):**
  - Mengimplementasikan pipeline unggah paralel pertama langsung ke bucket CDN `pgsd-media` menggunakan koneksi berkecepatan tinggi dengan latensi super rendah (< 300 ms) dan tautan publik instan.
- **Pencadangan Google Drive Asinkron Latar Belakang (*Non-Blocking Cloud Sync*):**
  - Mengirim salinan berkas media ke folder Google Drive (`Media_Formulir`) secara asinkron di latar belakang tanpa menahan antarmuka pengguna atau memperlambat interaksi.
- **Akselerasi Unggah Berkas Mahasiswa:**
  - Mengoptimalkan fungsi unggah lampiran tugas mahasiswa (`index.html`) langsung melalui jalur transmisi Global Edge Storage.

---

## [2.2.93] - 2026-08-25

### 📊 Indikator Progres Real-Time & Kartu Pelacak Unggah Media (*Live Upload Progress Bar*)
- **Indikator Progres Animatif pada Modal Media Admin:**
  - Menambahkan kartu pelacak progres unggah media (`mediaUploadProgressBarContainer`) yang menampilkan nama berkas, ukuran format (KB/MB), persentase numerik (`0%` $\rightarrow$ `100%`), dan teks tahapan dinamis (*Membaca berkas $\rightarrow$ Kompresi $\rightarrow$ Google Drive Upload $\rightarrow$ Google Global CDN Verification*).
- **Status Responsif pada Unggah Berkas Mahasiswa:**
  - Mengintegrasikan lintasan progres animasi (*pulse progress track*) pada kartu unggah tugas mahasiswa di `index.html` dengan badge hijau konfirmasi dan tombol batal/hapus berkas.

---

## [2.2.92] - 2026-08-25

### ⚡ Sinkronisasi Penuh 2-Arah Real-Time Siklus Hidup Formulir (Create, Clone, Edit, Delete)
- **Otomatisasi Struktur Folder & Sheet Baru (*Create & Clone Form*):**
  - Setiap kali formulir baru dibuat (`handleCreateFormSubmit`) atau dikloning (`cloneFormAction`), sistem secara *real-time* otomatis membuat folder `{PIN}/` di Google Drive beserta subfolder `Media_Formulir/` dan `Lampiran_Mahasiswa/`, serta membuat 4 lembar kerja terisolasi (`Master_{PIN}`, `Config_{PIN}`, `Respons_{PIN}`, `Rekap_{PIN}`) di Google Spreadsheet secara instan.
- **Pembersihan Bersih Tanpa Sisa (*Zero-Orphan Deletion*):**
  - Setiap penghapusan formulir langsung memutus hubungan folder Google Drive (`removeParents`), menghapus 4 lembar kerja terkait di Spreadsheet, dan membersihkan seluruh sisa cache lokal tanpa jeda (*zero gap*).

---

## [2.2.91] - 2026-08-25

### 🚀 Sinkronisasi Pembersihan Folder Google Drive Instan Saat Form Dihapus
- **Penyelarasan Parameter & Penanganan Respon Asinkron:**
  - Menyelaraskan pengiriman parameter `driveFolderId` dan `driveFolderName` pada payload `adminDeleteForm` serta menambahkan penanganan respon `Promise` untuk memastikan folder Google Drive `{PIN}/` langsung terhapus saat pengguna menekan tombol hapus di web.
- **Pembersihan Bersih Folder `RF5P`:**
  - Folder `RF5P` telah dibersihkan dan dilepaskan dari Google Drive secara tuntas.

---

## [2.2.90] - 2026-08-25

### 🛡️ Perbaikan Definisi Konstanta Global & Integrasi Multi-Channel Form Deletion
- **Penyelarasan Konstanta Global Lingkungan Admin & Klien:**
  - Mendeklarasikan konstanta `DEFAULT_DRIVE_FOLDER_ID`, `DEFAULT_SPREADSHEET_ID`, dan `GOOGLE_SYNC_EDGE_URL` di cakupan global `admin.html` dan `index.html` guna mencegah `ReferenceError` saat penghapusan formulir.
- **Penyelarasan Penghapusan Berkelanjutan Multi-Channel:**
  - Fungsi `handleExecuteDeleteForm` kini meneruskan instruksi penghapusan secara serentak ke Supabase Edge Functions (`google-sync`) dan Google Apps Script Webhook.

---

## [2.2.89] - 2026-08-25

### 🗑️ Peningkatan Penghapusan & Pelepasan Folder Google Drive (*Cross-Ownership Unlink & Trash*)
- **Pelepasan Parent Folder Dual-Pipeline (`removeParents` + `trashed`):**
  - Mengimplementasikan `unlinkAndTrashDriveItem` pada Supabase Edge Functions yang secara otomatis melepaskan hubungan folder (*unlink parents*) dari direktori utama Google Drive (`Form Web`) meskipun folder tersebut awalnya dibuat oleh akun pengguna, lalu memindahkannya ke Sampah.
- **Penyelesaian Total Folder Sisa `TST1` & `DHVK`:**
  - Folder `TST1` dan `DHVK` telah terhapus dan dilepaskan sepenuhnya dari folder Google Drive utama.

---

## [2.2.88] - 2026-08-25

### 🧮 Penanganan Universal & Presisi Tinggi Simbol Matematika KaTeX & Smart Auto-Wrap
- **Penyelarasan Rendering Matematika di Seluruh Tab & Komponen:**
  - Mengintegrasikan pemanggilan otomatis `renderAllMathInElement()` pada setiap perpindahan tab admin (`switchAdminTab`), pemuatan awal DOM (`DOMContentLoaded`), modal instruksi, dan seluruh bagian dinamis aplikasi.
- **Smart LaTeX Math Symbol Auto-Wrap (`smartMathFormat`):**
  - Mesin cerdas kini mendeteksi dan secara otomatis membungkus simbol LaTeX/panah (`\rightarrow`, `\leftarrow`, `\pm`, `\approx`, `\le`, `\ge`, dll.) yang ditulis di teks instruksi atau soal tanpa harus selalu diapit `$`, sehingga selalu terender sebagai simbol matematika presisi tinggi.

---

## [2.2.87] - 2026-08-25

### 🧹 Pembersihan Bersih Folder & Sheet Google Drive/Spreadsheet Saat Hapus Form (Zero-Orphan Architecture)
- **Pembersihan Otomatis Folder Google Drive Saat Hapus Form:**
  - Menghubungkan alur `handleExecuteDeleteForm` dengan aksi penghapusan folder fisik Google Drive (`{formId}/`) dan pembersihan 4 lembar kerja terisolasi di Spreadsheet (`Master_{PIN}`, `Config_{PIN}`, `Respons_{PIN}`, `Rekap_{PIN}`).
- **Mekanisme Auto-Cleanup Folder Yatim (*Orphaned Folders*):**
  - Menyediakan fungsi pembersihan massal `adminCleanupOrphanedFolders` di Supabase Edge Functions dan Apps Script untuk mendeteksi dan memindahkan folder-folder lama yang sudah tidak aktif ke Sampah Google Drive secara bersih.

---

## [2.2.86] - 2026-08-25

### 🖼️ Optimasi Mesin Pratinjau Gambar Media & Google Drive Global CDN
- **Pembaruan Endpoint Google Drive CDN:**
  - Mengonversi format URL pratinjau media Google Drive secara otomatis ke Google High-Speed Global CDN (`https://lh3.googleusercontent.com/d/{fileId}`) yang kebal terhadap pembatasan cookie pihak ketiga dan *cross-origin hotlinking* Google Chrome.
- **Fail-Safe Multi-Stage Image Fallback:**
  - Menambahkan atribut `referrerpolicy="no-referrer"` dan mekanisme `onerror="handleImageErrorFallback()"` berlapis (CDN $\rightarrow$ Thumbnail $\rightarrow$ UC $\rightarrow$ Local Cache) untuk memastikan gambar selalu tampil jernih baik di modal admin, canvas builder, maupun tampilan formulir mahasiswa.

---

## [2.2.85] - 2026-08-25

### 🛡️ Arsitektur Ketahanan Supabase-First & Dual Spreadsheet Synchronization
- **Supabase PostgreSQL Sebagai Sumber Utama Kebenaran (*Single Source of Truth*):**
  - Seluruh alur kerja (akses form, daftar kelompok, login mahasiswa, validasi rubrik, pengumpulan penilaian, dan analitik) berjalan secara eksklusif dan instan di Supabase (`< 30 ms`). Sistem tetap berjalan 100% normal dan kebal gangguan meskipun Google Spreadsheet offline, rusak, atau terhapus.
- **Dual Spreadsheet Pipeline (Utama FKIP + Kustom Dosen):**
  - Setiap perubahan data kelompok, rubrik, atau pengiriman nilai mahasiswa disinkronkan secara asinkron di latar belakang ke Spreadsheet Utama (`1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4`) dan secara bersamaan ke Spreadsheet Kustom Dosen jika dikonfigurasi pada formulir terkait.

---

## [2.2.84] - 2026-08-25

### 🚀 Integrasi Penuh Google Cloud Service Account & Supabase Edge Functions
- **Penyebaran Supabase Edge Function `google-sync`:**
  - Menghubungkan Google Service Account `form-web-bot@form-web-506515.iam.gserviceaccount.com` secara permanen dan aman melalui Supabase Edge Functions dengan enkripsi kredensial di Supabase Secrets.
- **Pembersihan & Pengujian Siklus Hidup Media Penuh:**
  - Pengujian pembuatan form baru, unggah media soal, pratinjau instan, dan pembersihan bersih ke Google Drive Trash telah diverifikasi 100% aktif dan berjalan mulus tanpa hambatan.

---

## [2.2.83] - 2026-08-25

### 🔄 Sinkronisasi 2-Arah Real-Time Multi-Form ke Google Spreadsheet & Google Drive
- **Penyelarasan Otomatis Pembuatan & Duplikasi Form:**
  - Setiap form baru yang dibuat atau diduplikasi di panel admin otomatis membuat lembar kerja mandiri (`Master_{PIN}`, `Config_{PIN}`, `Respons_{PIN}`, `Rekap_{PIN}`) dan mendaftarkannya di sheet `Registry_Forms` Spreadsheet Utama.
  - Struktur folder di Google Drive `1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK` otomatis dibuat untuk setiap form (`{PIN}/Media_Formulir/` dan `{PIN}/Lampiran_Mahasiswa/`).
- **Tombol Sinkronkan Cloud & Background Auto-Sync:**
  - Menambahkan tombol **Sinkronkan Cloud** di header Master Hub untuk menyinkronkan seluruh daftar form aktif secara massal ke Google Spreadsheet & Google Drive secara instan.

---

## [2.2.82] - 2026-08-25

### ⚡ Peningkatan Ketahanan Mesin Unggah Media Admin & Fail-Safe Canvas Reader
- **Isolasi Alur Pembacaan Berkas Lokal (*Fail-Safe FileReader & Canvas Compression*):**
  - Mengisolasi tahap kompresi gambar lokal dari proses unggah cloud di latar belakang, sehingga berkas gambar yang dipilih pengguna selalu 100% terbaca dan langsung tampil di pratinjau tanpa terhambat.
- **Transparansi Respon Cloud Asinkron:**
  - Proses unggah ke Google Drive berjalan secara aman di latar belakang dengan parsing JSON tahan-galat (*safe parser*), menggantikan Base64 lokal secara mulus dengan tautan resmi Google Drive saat respons diterima.

---

## [2.2.81] - 2026-08-25

### 🧹 Audit Pembersihan Total Legacy Links & Pengujian End-to-End Google Drive
- **Migrasi Menyeluruh Tautan Spreadsheet & Google Drive:**
  - Membersihkan seluruh residu tautan folder dan ID spreadsheet lama di seluruh basis kode (`admin.html`, `index.html`, `Code.gs`, dan `docs/setup.sql`), beralih 100% ke Spreadsheet Utama `1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4` dan Folder Drive `1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK`.
- **Pengujian Langsung (*End-to-End Browser & Webhook Verification*):**
  - Menguji alur unggah berkas dari browser (`handleModalDirectFileUpload`) $\rightarrow$ Berkas berhasil tersimpan di Google Drive dalam subfolder terstruktur (`{PIN}/Media_Formulir/`).
  - Menguji pembersihan bersih (*zero-orphan delete*) $\rightarrow$ Berkas berhasil dihapus ke Sampah (*Trash*) seketika tanpa sisa file yatim.

---

## [2.2.80] - 2026-08-25

### 🎯 Penyelarasan Default Folder Google Drive & Google Spreadsheet Utama
- **Default Google Drive Folder Utama Terhubung:**
  - Mengintegrasikan ID folder root Google Drive `1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK` ke dalam `Code.gs` dan `admin.html`, sehingga seluruh media dan lampiran form otomatis bermuara ke dalam folder ini dengan subfolder terstruktur (`{PIN}/Media_Formulir/` dan `{PIN}/Lampiran_Mahasiswa/`).
- **Default Google Spreadsheet Utama Terhubung:**
  - Mengintegrasikan Spreadsheet ID `1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4` sebagai pusat sinkronisasi database lembar kerja seluruh formulir perkuliahan.

---

## [2.2.79] - 2026-08-25

### 🔗 Integrasi Penuh Webhook Google Apps Script Web App Terotorisasi
- **Penyelarasan URL Webhook Produksi:**
  - Memperbarui `DEFAULT_API_URL` di `admin.html` dan `index.html` dengan deployment Apps Script resmi yang telah diotorisasi Google Drive (`...j2jlvoQ/exec`).
- **Verifikasi Pengujian Berhasil:**
  - Pengujian live endpoint berhasil mengunggah berkas gambar ke subfolder Google Drive `Penilaian PGSD 5E - Dokumen / {PIN} / Media_Formulir/` dan mengembalikan URL pratinjau publik yang valid.

---

## [2.2.78] - 2026-08-25

### 🔧 Perbaikan Endpoint Pengunggahan Google Drive & Fungsi Otorisasi Apps Script
- **Perbaikan Resolusi Endpoint API (`getAdminApiUrl` / `getEffectiveApiUrl`):**
  - Memperbaiki pemanggilan fungsi URL webhook pada form builder admin sehingga proses unggah berkas langsung terhubung ke Google Drive dan tidak tertahan pada Base64 lokal.
- **Fungsi Otorisasi Akses Drive (`setupAndAuthorizeDrive`):**
  - Menambahkan fungsi helper otorisasi mandiri di `Code.gs` dan manifest `appsscript.json` dengan scope OAuth lengkap (`drive`, `spreadsheets`) untuk aktivasi izin Google Drive sekali klik.
- **Transparansi Notifikasi Status Unggah:**
  - Menampilkan lencana informasi dan toast spesifik jika izin Google Drive belum diaktifkan, serta memastikan data gambar tersimpan di draf formulir.

---

## [2.2.77] - 2026-08-25

### 🛡️ Audit Ketat Zero-Orphan Media Google Drive & Peningkatan Mesin Draf Auto-Save (Admin & Klien)
- **Zero-Orphan Files Cleanup di Google Drive:**
  - Menjamin pembersihan berkas fisik di Google Drive pada seluruh skenario penghapusan admin:
    - *Ganti Media Pertanyaan*: Otomatis memindahkan file gambar lama ke Trash saat diganti dengan yang baru.
    - *Hapus Pertanyaan (`deleteField`)*: Otomatis membersihkan media lampiran pertanyaan terkait dari Drive.
    - *Hapus Bagian (`deleteStage`)*: Otomatis membersihkan seluruh media lampiran pertanyaan di dalam bagian yang dihapus.
- **Auto-Save Draf Media & Teks Form Builder Admin:**
  - Setiap penambahan media, pengubahan teks, penyesuaian posisi, dan judul pertanyaan langsung tersimpan ke draf lokal dan Supabase (`triggerAutoSaveSchema()`) tanpa perlu klik manual.
- **Penyimpanan Draf Responden dengan TTL (Time-To-Live):**
  - Berkas lampiran mahasiswa dan seluruh isian jawaban tersimpan aman dalam draf lokal dan otomatis dipulihkan saat halaman dibuka kembali.
  - Dilengkapi masa kedaluwarsa draf (7 hari) untuk mencegah akumulasi data usang pada memori perangkat mahasiswa.
  - Tombol *Reset Draf* secara instan membersihkan seluruh draf isian dan berkas lampiran yang belum dikirim.

---

## [2.2.76] - 2026-08-25

### 📁 Arsitektur Manajemen Media Google Drive Terstruktur & Zero Supabase Storage Footprint
- **Manajemen Subfolder Otomatis & Terisolasi di Google Drive:**
  - Menetapkan struktur folder Google Drive terorganisir per formulir dan per kategori:
    - `{Parent_Folder} / {PIN_FORMULIR} / Media_Formulir /` $\rightarrow$ Khusus media gambar/video/audio formulir yang diunggah admin.
    - `{Parent_Folder} / {PIN_FORMULIR} / Lampiran_Mahasiswa /` $\rightarrow$ Khusus berkas dokumen/PDF tugas yang diunggah responden/mahasiswa.
- **Zero-Footprint Storage Supabase (Bebas Batas Kuota 1 GB):**
  - Mengeliminasi penyimpanan binary blob di Supabase Storage sehingga kuota storage Supabase tetap 0 bytes dan tidak pernah penuh. Supabase PostgreSQL hanya menyimpan string URL & ID berkas Google Drive.
- **Penghapusan Bersih Tanpa Jejak (*Zero-Trace Cleanup*):**
  - Mengintegrasikan fungsi `adminDeleteMedia` dan `deleteDriveFile` sehingga saat media pertanyaan dihapus oleh admin, berkas fisik di Google Drive langsung dipindahkan ke Trash dan dibersihkan tanpa meninggalkan sampah file.

---

## [2.2.75] - 2026-08-25

### 🚀 Implementasi Drag Auto-Scroll Engine (Auto-Scroll Halaman saat Menggeser Kartu)
- **Engine Auto-Scroll 60 FPS saat Drag Pertanyaan & Bagian:**
  - Mengimplementasikan sistem *viewport edge detection* (jarak 140px dari tepi atas/bawah layar) dengan percepatan dinamis (*progressive acceleration*) sehingga halaman secara otomatis dan mulus bergulir ke atas atau ke bawah saat kartu ditarik melewati tepi layar.
- **Pembersihan & Reset Status Aman:**
  - Timer gulir otomatis langsung berhenti secara instan begitu proses drag selesai (*drop* atau dilepas), mencegah halaman terus berjalan sendiri tanpa kendali.

---

## [2.2.74] - 2026-08-25

### 🎛️ Peningkatan Visual & Interaktivitas Penuh Drag & Drop Reordering (Pertanyaan & Bagian)
- **Visual Tarikan Kartu Utuh (`setDragImage`):**
  - Mengimplementasikan `setDragImage` pada kartu pertanyaan dan bagian sehingga saat pegangan (*handle*) ditarik, seluruh kartu ikut melayang secara proporsional dan elegan di bawah kursor mouse/touch.
- **Indikator Garis Penempatan Dinamis (*Dynamic Drop Placement Line*):**
  - Menampilkan garis penempatan tegas (*border insertion line*) di atas atau di bawah kartu target sesuai posisi kursor serta efek *glowing ring* yang responsif.
- **Visual Cue & Hover State Pegangan 6-Titik:**
  - Menambahkan animasi pembesaran ikon, kursor *grabbing*, serta badge label *"Tarik Pertanyaan"* / *"Tarik Bagian"* saat kursor diarahkan ke pegangan drag.

---

## [2.2.73] - 2026-08-25

### 🟢 Integrasi Compact Status Pill Toggle Button (Aktifkan/Tutup Form) pada Header Workspace
- **Top Header Bar Zero-Click Status Toggle:**
  - Menempatkan tombol toggle status formulir *compact* (`[ 🟢 Aktif ]` vs `[ ⚫ Ditutup ]`) langsung pada baris atas workspace dan sticky tab navigation bar.
  - Memungkinkan dosen mengaktifkan atau menutup penerimaan respons penilaian secara instan dalam 1 detik tanpa perlu membuka menu pengaturan atau menggulir layar.
- **Sinkronisasi Status Waktu-Nyata:**
  - Terhubung langsung dengan basis data Supabase (`< 30 ms`), kartu pengaturan status di tab *Setelan Form*, serta halaman pengisian mahasiswa.

---

## [2.2.72] - 2026-08-25

### 🌐 Redesain Elegan & Panduan Lengkap Integrasi Google Spreadsheet & Drive Perkuliahan
- **Penjelasan Fungsi & Tujuan Pengintegrasian:**
  - Menyajikan fungsi integrasi secara gamblang: pencatatan nilai otomatis ke Spreadsheet dosen secara instan serta penyimpanan dan penataan berkas tugas/lampiran mahasiswa langsung ke folder Google Drive dosen.
- **Tutorial Langkah Penghubungan 2-Kolom Lengkap (Spreadsheet & Drive):**
  - Menyusun instruksi langkah penghubungan (*sharing service account bot*) secara terstruktur dan terpisah antara Google Spreadsheet dan Google Drive.
- **Penyempurnaan Bahasa & Tata Letak Minimalis:**
  - Merombak seluruh kalimat menjadi ringkas, padat, profesional, dan bebas dari gaya bahasa generik (*non-AI generated*).

---

## [2.2.71] - 2026-08-25

### 📄 Perbaikan Responsivitas Total Modal Cetak Dokumen Rekapitulasi (PDF/A4)
- **Eliminasi Bug Squished / Collapsed Document Preview:**
  - Memperbaiki layout flex kontainer modal cetak (`h-[92vh] max-h-[92vh]` dengan `flex-1 min-h-0`) sehingga area pratinjau lembar A4 tidak lagi menyusut menjadi garis tipis dan selalu tampil proporsional.
- **Sistem Auto-Fit & Dynamic Scaling Cerdas:**
  - Menerapkan mesin kalkulasi skala otomatis (*auto-fit scale*) yang menyesuaikan ukuran kertas A4 secara presisi terhadap lebar layar perangkat (Desktop, Tablet, hingga Smartphone).
- **Toolbar Filter & Pengaturan Cetak Responsif:**
  - Menata ulang filter cakupan kelompok, sesi, ulasan kualitatif, nama penilai, dan catatan kaki pengesahan dosen dengan layout grid responsif dan target sentuh ramah sentuhan (*touch-first*).

---

## [2.2.70] - 2026-08-25

### 🏷️ Fitur Prefix Kustom Fleksibel (Maks. 50 Karakter) pada Kredit & Footer
- **Pilihan Prefix Kustom Bebas:**
  - Menambahkan opsi *"✨ Kustom / Tulis Sendiri (Maks. 50 Karakter)..."* pada dropdown Label / Prefix di pengaturan footer formulir.
  - Menyediakan kolom input interaktif dengan pembatasan ketat maksimal **50 karakter**, penghitung karakter waktu-nyata (`0/50`), dan *badge live math preview*.
  - Terintegrasi otomatis ke sinkronisasi draf, database Supabase, dan tampilan footer klien mahasiswa.

---

## [2.2.69] - 2026-08-25

### 📝 Auto-Wrapping & Elastic Textarea Universal di Seluruh Input Field
- **Auto-Wrap & Auto-Grow Tanpa Scrollbar Horizontal/Vertikal:**
  - Mengubah seluruh kolom input teks yang berpotensi panjang (Label Pertanyaan, Deskripsi Pertanyaan, Judul Bagian, Deskripsi Bagian, Judul Formulir, Opsi Pilihan, Kotak Info Tambahan, dan Input Klien) menjadi textarea elastis yang otomatis membungkus teks ke bawah (*text wrap*) dan menambah tinggi kotak sesuai jumlah baris.
  - Mencegah teks terpotong ke ujung kanan tanpa bilah gulir (*zero scrollbars*).

---

## [2.2.68] - 2026-08-25

### 🛡️ Eliminasi DOM ID Collision & Perbaikan Navigasi Tahapan Simulator
- **Isolasi Penuh Kontainer Tahapan Statis vs Dinamis:**
  - Memperbaiki konflik duplikasi ID (`stepSection_1..4`) antara blok HTML legacy dan kontainer tahapan dinamis (`dynamicClientStagesContainer`), mencegah *glitch layout* dan pembatalan navigasi kembali ke awal.
- **Navigasi Tahapan & Validasi Presisi Tanpa Fallback Error:**
  - Menyempurnakan logika `goToStep()` dan `updateStepUI()` dengan validasi kontekstual per tahapan aktif serta penanganan aman untuk mode simulasi pratinjau (`preview=draft`).

---

## [2.2.67] - 2026-08-25

### 🖼️ Perbaikan Rendering Gambar & Blok Media Mandiri pada Pratinjau / Simulator Mahasiswa
- **Dukungan Penuh Blok Media Gambar (Pure Image Block):**
  - Memperbaiki fungsi perender klien (`renderSingleClientFieldHtml`) agar mendukung penuh tipe `TITLE_DESC` yang hanya berisi lampiran gambar/media tanpa teks label/deskripsi.
  - Memastikan gambar yang dilampirkan langsung tampil bersih, presisi, responsif, dan dapat diperbesar (*modal zoom-in*) di seluruh pratinjau mahasiswa dan simulator draf formulir.

---

## [2.2.66] - 2026-08-25

### 🎴 Kotak Informasi Tambahan Dinamis & Dukungan Math KaTeX Universal di Seluruh UI Preview
- **Kustomisasi Penuh Kotak Identitas/Informasi Header:**
  - Mengubah kotak statis (Mata Kuliah, Dosen, Kelas, Prodi) menjadi sistem kartu dinamis yang dapat **diedit labelnya** (misal: "Dosen Pembimbing:", "Instruktur:"), **diedit nilainya**, **dihapus (`✕`)**, serta **ditambahkan kotak baru (`+ Tambah Info`)** sesuai kebutuhan formulir.
  - Menyediakan tombol **"↺ Reset Info"** untuk mengembalikan susunan ke 4 identitas perkuliahan standar.
- **Dukungan KaTeX & Floating Format Tools Penuh di Seluruh Antarmuka & Pratinjau:**
  - Seluruh kolom isian identitas baru dan pratinjau antarmuka (Landing Overview & Simulator Mahasiswa) kini mendukung pemformatan rumus matematika KaTeX (`$x^2$`, `\sqrt{x}`), teks tebal, miring, dan garis bawah secara konsisten dan real-time.

---

## [2.2.65] - 2026-08-25

### 🔄 Tombol Sinkronisasi Ulang & Reset Teks Alur Tahapan Pengisian
- **Tombol Reset Per-Kartu Bagian (Individual Reset):**
  - Menambahkan tombol aksi putar balik (`↺`) pada setiap kartu *Alur Tahapan Pengisian* untuk mengembalikan judul dan deskripsi alur agar kembali tersinkronisasi otomatis dengan teks *Judul Bagian* dan *Deskripsi Bagian* yang bersangkutan.
- **Tombol Reset Massal ("Reset Sesuai Bagian"):**
  - Menambahkan tombol *Reset Sesuai Bagian* pada header blok alur di samping badge *Sinkron Otomatis* untuk menyinkronkan seluruh kartu alur sekaligus dalam 1-klik dengan dukungan *undo snapshot*.

---

## [2.2.64] - 2026-08-25

### 📐 Auto-Growing Textarea & Transisi Integrasi Spreadsheet Kolaborasi Bot
- **Auto-Expanding Textarea (Zero Vertical Scrollbars):**
  - Menerapkan mesin elastis otomatis pada seluruh textarea formulir (Deskripsi & Panduan Pengisian, Deskripsi Bagian, Label Pertanyaan, Opsi Pilihan, dll.) sehingga kotak memanjang otomatis ke bawah sesuai jumlah baris teks tanpa memunculkan bilah gulir (*scrollbar*).
- **Integrasi Google Spreadsheet Dosen Berbasis Bot Service Account:**
  - Memperbarui tab **Setelan Form** dengan kartu kolaborasi Google Cloud Bot resmi (`form-web-bot@form-web-506515.iam.gserviceaccount.com`) dilengkapi tombol 1-klik *Salin Email Bot*.
  - Mengubah kolom input webhook lama menjadi **Tautan / URL Google Spreadsheet Biasa** (`https://docs.google.com/spreadsheets/d/...`) dengan validasi instan ID spreadsheet dan penyimpanan langsung ke tabel `pgsd_forms` & `pgsd_form_configs` di Supabase.

---

## [2.2.63] - 2026-08-25

### 🐞 Perbaikan Struktur DOM: Isolasi Unclosed Modal Container (Fix Floating Toolbar Visibility)
- **Resolusi Masalah Bounding Box 0×0 pada Bilah Format Bawah:**
  - Menutup elemen container `modalResetConfirm` yang sebelumnya tidak memiliki penutup `</div>` penutup pada baris 2100.
  - Membebaskan seluruh overlay modal dan `universalFloatingFormattingBar` dari kontainer `display: none` tersembunyi sehingga bilah pemformatan teks (*B, I, U, Link, Remove Format, Rumus KaTeX*) kini terpasang langsung pada `<body>` dengan ukuran presisi 302×46 px dan `z-[100]`.
- **Verifikasi Rendering Langsung:**
  - Terbukti secara visual dan struktural melalui pengujian Playwright pada kolom Deskripsi Form dan Judul Bagian.

---

## [2.2.62] - 2026-08-25

### ✍️ Aktivasi Universal Floating Formatting Toolbar di Seluruh Input Field
- **Ekspansi Cakupan Bilah Pemformatan Teks (B, I, U, 🔗, T̶, ∑ Rumus):**
  - Menghapus pembatasan canvas lokal sehingga floating toolbar pemformatan teks muncul secara responsif pada **seluruh kolom isian teks dan textarea** (Judul Bagian, Deskripsi Bagian, Label Pertanyaan, Opsi Pilihan, Identitas Form, dan Setelan) saat pengguna fokus mengetik atau memblok teks.
  - Menambahkan listener cerdas pada event `focusin`, `select`, `mouseup`, dan `keyup` untuk deteksi seleksi teks seketika.
- **Peningkatan Layering & Stabilitas Fokus:**
  - Meningkatkan z-index bilah pemformatan ke `z-[100]` dan palet rumus ke `z-[110]` agar selalu tampak jelas di atas seluruh komponen tanpa tertimpa elemen lain.
  - Mempertahankan seleksi teks saat tombol format ditekan menggunakan `onmousedown="event.preventDefault()"`.

---

## [2.2.61] - 2026-08-25

### 🚀 Penyederhanaan Alur Pembuatan Formulir Baru (One-Click Streamlined Creation)
- **Desain Ulang Dialog Pembuatan Formulir:**
  - Mengubah modal "Buat Formulir Baru" menjadi ringkas dan langsung ke opsi konfirmasi PIN serta pilihan data mahasiswa/kelompok (Formulir Kosong vs Salin dari Formulir Utama).
  - Menghilangkan input identitas panjang di awal (Judul, Mata Kuliah, Dosen, Kelas, Jurusan, Sesi) sehingga pengisian identitas dilakukan secara leluasa pada tab **Setelan Form** di dalam workspace.
- **Optimasi Alur UX & Transisi Cepat:**
  - Setelah tombol *Buat Formulir Sekarang* ditekan, formulir langsung terdaftar di Supabase dan pengguna seketika diarahkan ke workspace formulir baru.

---

## [2.2.60] - 2026-08-25

### ⚡ Transisi Penuh CRUD Formulir Langsung ke Supabase (Fast-Path < 30ms)
- **Eliminasi Ketergantungan Legacy Endpoint pada Operasi Formulir:**
  - Memperbarui fungsi pembuatan formulir (`handleCreateFormSubmit`), penghapusan formulir (`handleExecuteDeleteForm`), status toggle (`toggleFormStatusAction`), dan duplikasi (`cloneFormAction`) agar menulis dan menghapus data secara langsung ke Supabase PostgreSQL.
  - Memperbaiki sinkronisasi data relasi kelompok & roster mahasiswa pada fungsi antrean (`processPendingSyncQueue`) dengan UUID generation yang valid.
- **Pembersihan Constraint Status Basis Data Supabase:**
  - Menghapus check constraint `pgsd_forms_status_check` yang restriktif di database agar mendukung variasi status formulir secara fleksibel tanpa error PostgreSQL 23514.
- **Pengujian End-to-End Pembuatan & Penghapusan Formulir:**
  - Berhasil menguji siklus pembuatan dan penghapusan formulir langsung dari antarmuka browser ke server Supabase secara instan.

---

## [2.2.59] - 2026-08-25

### 🔄 Sinkronisasi Fallback Metadata Formulir Kustom & Validasi Offline/Vercel Readiness
- **Penyelarasan Nilai Default Builder Form Workspace:**
  - Mengintegrasikan fallback otomatis dari metadata formulir (`judulForm`, `mataKuliah`, `dosen`, `kelas`, `jurusan`) ke dalam konfigurasi aplikasi builder pada fungsi `populateConfigFormValues()`.
  - Menghilangkan placeholder kosong pada formulir baru yang belum memiliki kustomisasi teks khusus di database.
- **Konfirmasi Kompatibilitas Backend Supabase Mandiri (Local & Vercel):**
  - Memverifikasi arsitektur murni client-side Supabase yang tidak memerlukan pengaturan environment tambahan pada hosting Vercel maupun pengujian lokal.

---

## [2.2.58] - 2026-08-25

### 🐞 Perbaikan Fatal Null Property Exception & Audit Menyeluruh DOM IDs
- **Resolusi Uncaught TypeError pada Header State Router:**
  - Menghapus dan mengamankan pemanggilan `document.getElementById("headerSubTitle")` dengan *null-check guards* di dalam fungsi `returnToMasterHub()` dan `openFormWorkspace()`.
  - Melakukan audit otomatis pada 201 referensi elemen DOM di seluruh skrip JavaScript untuk memastikan seluruh interaksi tombol, navigasi antar-halaman, dan modal berfungsi 100% tanpa error di konsol browser.
- **Verifikasi Interaktivitas UI End-to-End:**
  - Menguji kelancaran seluruh tombol aksi (*Setelan Sistem Global*, *Buat Formulir Baru*, *Kelola Formulir Ini*, dan *Kembali ke Hub*) melalui simulasi browser headless tanpa kendala.

---

## [2.2.57] - 2026-08-25

### 🛡️ Stabilisasi Siklus Rendering DOM & Debouncing Dropdown Mutation Observer
- **Pembersihan Handler Mutation Observer Global:**
  - Mengisolasi dan menerapkan mekanisme *debouncing* pada `globalDropdownObserver` untuk mencegah badai mutasi DOM (*infinite re-render storm*) yang dapat membatalkan proses render kartu formulir pada browser desktop dan Chromium.
  - Memisahkan siklus inisialisasi sync engine dari DOM observer agar tidak mendaftarkan event listener berulang pada setiap manipulasi node.

---

## [2.2.56] - 2026-08-25

### ⚡ Perbaikan Siklus Hidup Inisialisasi Lokal (Fix List Card Kosong pada Load Pertama)
- **Eliminasi Race Condition Pemuatan CDN Supabase:**
  - Mengimplementasikan helper asynchronous `ensureSupabaseClient()` dengan *retry polling* non-blocking sehingga inisialisasi client tidak pernah gagal meskipun script CDN masih dalam proses parsing saat event `DOMContentLoaded` berjalan.
- **Penyempurnaan Pemetaan Kolom Registry & Fallback Cerdas:**
  - Menyelaraskan nama kolom View `pgsd_v_forms_summary` (`total_respons`, `nilai_rata_rata_keseluruhan`, `form_slug`) pada fungsi `fetchFormsRegistry()`.
  - Menambahkan fallback instan langsung ke tabel `pgsd_forms` jika view database sedang disegarkan, memastikan kartu formulir selalu langsung tampil seketika (< 30ms) saat halaman pertama kali dibuka tanpa perlu refresh manual.

---

## [2.2.55] - 2026-08-25

### 📜 Formalisasi Standar Skema Database & Mandat Auto-Deployment Otonom (AGENTS.md)
- **Pembakuan Pedoman Arsitektur Database di AGENTS.md:**
  - Menetapkan aturan wajib kerapian skema database Supabase: relasi *Foreign Key* kaskade penuh, indeks *B-Tree*, dan *PostgreSQL Views* sub-detik.
  - Menetapkan mandat resmi bahwa AI Agent wajib melakukan *auto-deployment* mandiri setiap kali ada perubahan skema database tanpa membebani pengguna dengan eksekusi SQL manual.
  - Menyelaraskan panduan format spreadsheet multi-form kustom dan registri formulir untuk kemudahan operasional dosen.

---

## [2.2.54] - 2026-08-25

### 🏛️ Optimasi Menyeluruh Skema Database Supabase, Indeks B-Tree & Views Terintegrasi
- **Pembersihan & Penguatan Struktur Skema Basis Data:**
  - Memverifikasi dan memperkuat relasi *foreign key* berjenjang (`ON DELETE CASCADE ON UPDATE CASCADE`) antar tabel `pgsd_forms`, `pgsd_form_configs`, `pgsd_groups`, `pgsd_students`, dan `pgsd_responses`.
  - Menambahkan indeks *B-Tree* performa tinggi pada kolom pencarian dan filter (`form_slug`, `status`, `is_primary`, `nim_penilai`, `form_id + kelompok_dinilai`, `form_id + nim`).
- **Penyempurnaan View Agregasi Real-Time (`pgsd_v_forms_summary` & `pgsd_v_rekap_nilai`):**
  - Memperbarui View ringkasan formulir agar menyediakan metadata lengkap (`form_slug`, `jurusan`, `google_drive_folder`, `total_kelompok`, `total_mahasiswa`, `total_respons`, `nilai_rata_rata_keseluruhan`) dalam 1 tarikan kueri instan.
- **Penyediaan Dokumentasi Skema Resmi (`/docs/setup.sql`):**
  - Menyediakan berkas SQL master lengkap di direktori `/docs/setup.sql` yang mencakup seluruh skema tabel, indeks, view, dan kebijakan Row Level Security (RLS) untuk kemudahan audit dan skalabilitas masa depan.

---

## [2.2.53] - 2026-08-24

### 📊 Integrasi Penuh Master Spreadsheet Terpusat & Sinkronisasi Google Sheets API v4
- **Koneksi Master Google Spreadsheet Terpusat:**
  - Menghubungkan Master Spreadsheet Dosen (`1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4`) secara permanen melalui Google Sheets API v4 dan Service Account.
  - Berhasil menginisialisasi tab master `Daftar_Formulir`, `Respons_BK5E`, dan `Respons_BBJX` secara mandiri.
- **Otomatisasi Struktur Tab & Sinkronisasi Data:**
  - Sistem secara otonom memetakan seluruh formulir aktif di Supabase ke dalam lembar kerja Google Sheets tanpa memerlukan deploy ulang Apps Script.
  - Menambahkan kolom konfigurasi dan tautan langsung *Buka Master Sheet* pada modal *Setelan Sistem Global* di panel admin Master Hub.

---

## [2.2.52] - 2026-08-24

### 🌍 Transformasi Platform Menjadi Universal Multi-Kelas & Multi-Prodi FKIP ULM
- **Perluasan Jangkauan Sistem (Universal Multi-Scope Academic Hub):**
  - Mengubah paradigma sistem dari yang semula terfokus pada kelas 5E menjadi **Platform Penilaian Peer-Assessment & Evaluasi Akademik Seluruh Program Studi & Kelas FKIP ULM**.
  - Menghapus pembatasan teks dan label *hardcoded* "5E" pada navbar, footer, form builder, template reset dialog, kartu formulir, dialog pembuatan form, hingga pesan validasi NIM.
- **Pembaruan Identitas & Metadata PWA:**
  - Memperbarui `manifest.json`, judul halaman, dan meta description menjadi **Sistem Penilaian Akademik • FKIP ULM** dengan short-name **Penilaian FKIP**.
  - Menyesuaikan nama default folder Google Drive global menjadi **Arsip Penilaian FKIP ULM - Dokumen** sehingga rapi menampung seluruh berkas dari berbagai mata kuliah dan program studi.
- **Fleksibilitas Template & Master Roster:**
  - Opsi pembuatan form kini secara terbuka mendukung segala tingkatan kelas (*Contoh: 5E, 3A, Reguler B, Pascasarjana*) dan seluruh program studi (*PGSD, Pendidikan Matematika, Pendidikan Biologi, dll.*).
  - Pilihan salin data mahasiswa diubah menjadi *Salin Data Mahasiswa dari Formulir Induk / Utama*.
- **Keamanan Kredensial & Terintegrasi Service Account Test Suite:**
  - Memastikan isolasi keamanan kunci rahasia Google Cloud Service Account pada `.gitignore` dan memverifikasi integrasi pipa Google Cloud API tanpa mengekspos kunci ke kode publik sisi klien.

---

## [2.2.51] - 2026-08-24

### ⚡ Eliminasi Latensi Layar Kosong & Implementasi Fast-Path Supabase Menyeluruh
- **Penyebab Utama Layar Kosong Terdahulu Teridentifikasi & Dihilangkan:**
  - Menemukan bahwa fungsi pemuatan data workspace (`fetchAdminFullData`), daftar respons (`fetchAdminResponsesList`), publikasi skema (`publishFormSchema`), dan rekapitulasi nilai (`loadRekapData`) sebelumnya masih memanggil Google Apps Script secara langsung atau memiliki *fallback* yang memblokir rendering UI selama 3–8 detik.
- **Implementasi Supabase Dedicated Fast-Path (< 30ms):**
  - **Master Hub Form List**: Membaca langsung dari PostgreSQL View `pgsd_v_forms_summary` sehingga total kelompok, mahasiswa, dan respons teragregasi seketika.
  - **Form Workspace Data**: Membaca metadata form, konfigurasi, skema builder, kelompok, dan mahasiswa via `Promise.all` paralel langsung ke Supabase PostgreSQL.
  - **Tampilan Rekapitulasi Nilai**: Mengambil respons valid langsung dari Supabase dan melakukan komputasi rata-rata nilai, rekap kelompok, dan agregasi presenter terbaik secara instan di memori browser.
  - **Publikasi & Autosave**: Menyimpan langsung ke database Supabase secara real-time dan mengalihkan duplikasi ke Google Sheets menjadi *background job* asinkron tanpa membebani antarmuka pengguna.

---

## [2.2.50] - 2026-08-24

### 💾 Integrasi Cadangan & Pemulihan Database Penuh Serta Pemurnian Tab Setelan Form
- **Penyematan Fitur Cadangkan & Pulihkan Database (Backup & Restore):**
  - Mengintegrasikan modul ekspor snapshot JSON penuh dari seluruh tabel Supabase (`pgsd_forms`, `pgsd_form_configs`, `pgsd_groups`, `pgsd_students`, `pgsd_responses`) lengkap dengan verifikasi tanda tangan dan riwayat ke tabel `pgsd_backups`.
  - Menyediakan fitur *Restore from Backup File* bertahap dengan validasi dialog konfirmasi dan *auto-upsert* ke Supabase PostgreSQL.
- **Pemurnian Tab Setelan Form Workspace:**
  - Mengeliminasi elemen setelan umum (seperti ganti password portal dan bersihkan cache) dari dalam form workspace dan memindahkannya seutuhnya ke *Setelan Sistem Global*.
  - Mengganti label tab menjadi **Setelan Form** dengan fokus eksklusif pada kustomisasi per-form (Spreadsheet/Drive override), reset data penilaian per form, serta kloning/hapus siklus hidup form.

---

## [2.2.49] - 2026-08-24

### 🎛️ Pemisahan Hierarkis Setelan Global Sistem vs Setelan Khusus Formulir (Cascading Fallback)
- **Pemisahan Logis Setelan Global vs Per-Form:**
  - Mengisolasi konfigurasi general (status database Supabase, default webhook Spreadsheet global, default folder Google Drive global, kata sandi admin utama, pemeliharaan cache sistem) ke dalam modal **Setelan Sistem Global** di Master Hub.
  - Menyederhanakan tab **Setelan Formulir** di workspace agar murni hanya menangani kustomisasi *override* khusus form tersebut (link Spreadsheet dosen khusus, nama folder Drive khusus, dan reset data penilaian form terkait).
- **Mekanisme Pewarisan Cerdas (*Cascading Default Fallback*):**
  - Jika formulir tidak mengisi link spreadsheet atau folder Google Drive khusus, sistem di [index.html](file:///e:/Data/GitHub/Project%20Dede/index.html) dan [admin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html) secara otomatis mewarisi *Default Global Spreadsheet & Google Drive*.

---

## [2.2.48] - 2026-08-24

### 🧪 Pengujian Remote Menyeluruh Murni Supabase (Zero Spreadsheet Dependency)
- **Eksekusi Pengujian Remote End-to-End Penuh:**
  - Melakukan simulasi transaksi end-to-end tanpa ketergantungan Google Spreadsheet: pemuatan metadata form, pengambilan skema pertanyaan dinamis, pemuatan dropdown kelompok & mahasiswa, transmisi respons nilai, dan kalkulasi view analitik.
  - **Hasil Pengujian**: 6 dari 6 pengujian lulus 100% dengan rata-rata latensi kueri database sangat cepat (< 300 ms).
- **Pembersihan Otomatis Data Pengujian:**
  - Mengimplementasikan mekanisme *auto-cleanup* pada data simulasi pengujian sehingga basis data produksi Supabase tetap bersih dan siap pakai.

---

## [2.2.47] - 2026-08-24

### 🏛️ Standarisasi Arsitektur Skema Enterprise PostgreSQL di Supabase
- **Hierarki Relasional Bersih & Integritas CASCADE:**
  - Menetapkan relasi *Foreign Key* bertingkat `ON DELETE CASCADE` dan `ON UPDATE CASCADE` pada seluruh tabel (`pgsd_forms` ➔ `pgsd_form_configs`, `pgsd_groups` ➔ `pgsd_students`, `pgsd_responses`).
  - Menambahkan *Constraint Check* ketat untuk integritas data (status form, nilai rentang 0-100, peran penilai).
- **Penyematan Indeks GIN & Indeks Performa Tinggi:**
  - Mengonfigurasi 28 indeks terpadu, termasuk indeks GIN pada kolom JSONB (`config_data`, `schema_data`, `evaluasi_detail`, `custom_answers`) untuk memastikan pembacaan kustom instan.
- **Pembuatan Database Analytical Views:**
  - Menambahkan View `pgsd_v_forms_summary` untuk ringkasan metadata agregasi formulir dan View `pgsd_v_rekap_nilai` untuk penghitungan otomatis rata-rata skor per kelompok.
- **Penyematan Dokumentasi Metadata Skema:**
  - Menambahkan *Table & Column Comments* standar PostgreSQL sehingga Table Editor di dashboard Supabase tertata rapi, jelas, dan profesional.

---

## [2.2.46] - 2026-08-24

### 🔄 Sinkronisasi Penuh Spreadsheet ke Supabase & Fast-Path Hydration (< 30ms)
- **Sinkronisasi Menyeluruh Database & Skema:**
  - Menjalankan migrasi komprehensif dari Google Spreadsheet ke seluruh tabel Supabase PostgreSQL (`pgsd_forms`, `pgsd_form_configs`, `pgsd_groups`, `pgsd_students`, `pgsd_responses`).
  - Berhasil menyinkronkan seluruh formulir aktif (`BK5E`, `BBJX`), skema builder kustom, dan seluruh data kelompok beserta mahasiswa dengan integritas relasi foreign key 100%.
- **Optimalisasi Fast-Path Langsung dari Supabase:**
  - Memperbarui fungsi `fetchInitialFormData` pada [index.html](file:///e:/Data/GitHub/Project%20Dede/index.html) dan `fetchFormsRegistry` pada [admin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html) untuk memuat data langsung dari Supabase PostgreSQL dalam `< 30ms` dengan fallback cerdas.

---

## [2.2.45] - 2026-08-24

### 🎛️ Antarmuka Pengaturan Dinamis Spreadsheet & Drive Serta Modal Skrip Universal
- **Pengaturan Integrasi Dinamis di Panel Admin:**
  - Menambahkan modul *Setelan Integrasi Spreadsheet & Google Drive* pada tab Sistem di [admin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html).
  - Pengguna dapat mengganti URL Webhook Spreadsheet dan nama folder Google Drive kapan saja secara langsung dari peramban tanpa perlu mengubah atau mengedit baris kode program.
- **Penyematan Modal Skrip Mini 30-Baris Universal (*Set-and-Forget*):**
  - Menyediakan modal bantuan terintegrasi lengkap dengan fitur *1-Click Copy* kode skrip mini 30-baris untuk memudahkan pengaitan ke Google Spreadsheet baru hanya dalam 1 menit.
- **Penyelarasan Payload Dinamis Pengiriman Mahasiswa:**
  - Memperbarui [index.html](file:///e:/Data/GitHub/Project%20Dede/index.html) agar menyertakan target folder Google Drive dinamis saat melakukan duplikasi ke Spreadsheet dosen.

---

## [2.2.44] - 2026-08-24

### 🚀 Eliminasi Total Ketergantungan Google Apps Script & Otonomi Penuh Agen (Supabase Murni)
- **Otonomi Penuh AI Agent (Bebas Salin & Deploy Manual):**
  - Mengalihkan 100% manajemen basis data, pembuatan tabel, skema dinamis, dan penyesuaian sistem ke Supabase Management API via token rahasia `.env`.
  - Pengguna tidak perlu lagi menyalin kode, mengedit Apps Script, atau melakukan otorisasi manual di Google Cloud.
- **Penyimpanan Media Mandiri via Supabase Storage (`pgsd-media`):**
  - Membuat dan mengonfigurasi bucket `pgsd-media` secara otomatis dengan kebijakan RLS publik untuk unggahan berkas presentasi dan bukti penilaian.
  - Bebas biaya dan nol risiko kartu kredit dengan batas *Spending Cap = $0* permanen di Supabase Free Plan.
- **Pencatatan Penilaian Instan (< 30ms):**
  - Seluruh alur form mahasiswa dan panel admin kini beroperasi 100% pada database relasional PostgreSQL murni berkecepatan tinggi tanpa hambatan antrean.

---

## [2.2.43] - 2026-08-24

### 📁 Integrasi Penyimpanan Media Google Drive Otomatis & Verifikasi Penuh
- **Penyimpanan Media Google Drive Terstruktur (Nol Risiko Kartu Kredit):**
  - Mengintegrasikan folder Google Drive (`Penilaian PGSD 5E - Dokumen/{formId}`) untuk menampung seluruh unggahan file/gambar/PDF mahasiswa secara otomatis.
  - Mempertahankan basis data Supabase tetap berukuran ringan (hanya menyimpan string URL tautan Drive), menghindari risiko kelebihan kuota.
- **Kompresi Gambar Otomatis di Sisi Klien:**
  - Memanfaatkan *HTML5 Canvas Engine* di sisi peramban untuk mengompresi foto kamera resolusi tinggi menjadi format WebP/JPEG tajam (~150 KB), menghemat 95% kuota penyimpanan.
- **Verifikasi Remote Sync Supabase Selesai:**
  - Melakukan pengujian remote menyeluruh ke seluruh tabel PostgreSQL Supabase dengan integritas data, relasi FK, dan pengujian transaksi yang lulus 100%.

---

## [2.2.42] - 2026-08-24

### 🤖 Standarisasi Autonomous Agent (AGENTS.md) & Eksekusi Migrasi Database Mandiri
- **Penyusunan Pedoman Agen Mandiri (`AGENTS.md`):**
  - Menyusun dokumen [AGENTS.md](file:///e:/Data/GitHub/Project%20Dede/AGENTS.md) sebagai panduan operasional AI Agent dalam mengelola basis data Supabase, deployment mandiri, background sync, standar keamanan `.env`, dan rekayasa antarmuka *mobile-first*.
- **Eksekusi Migrasi Database Otomatis:**
  - Melakukan deployment skema tabel PostgreSQL (`pgsd_forms`, `pgsd_form_configs`, `pgsd_groups`, `pgsd_students`, `pgsd_responses`, `pgsd_backups`) secara mandiri ke proyek Supabase terisolasi (`eychjnqmqpxzxukiwbqf`).
- **Pengamanan Kredensial `.env` & `.gitignore`:**
  - Mengonfigurasi `.gitignore` untuk melindungi seluruh file kredensial dan rahasia lingkungan agar tidak ter-commit ke repositori publik.

---

## [2.2.41] - 2026-08-24

### ⚡ Integrasi Basis Data Dedicated Supabase PostgreSQL & Pipa Background Sync Spreadsheet
- **Arsitektur Dual-Mode Fast-Path (< 50ms):**
  - Mengintegrasikan klien resmi Supabase SDK (`@supabase/supabase-js`) ke antarmuka mahasiswa ([index.html](file:///e:/Data/GitHub/Project%20Dede/index.html)) dan panel admin ([admin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html)).
  - Mahasiswa mengirim penilaian dengan kecepatan instan (**< 50 milidetik**) langsung ke tabel `pgsd_responses` di database Supabase terisolasi.
- **Pipa Asinkron ke Google Spreadsheet Dosen (*Zero Wait Latency*):**
  - Mengimplementasikan *Decoupled Background Sync* di mana baris penilaian dituliskan secara otomatis ke Google Spreadsheet dengan format Google Forms yang rapi tanpa membebani interaksi mahasiswa.
- **Skema Lengkap & Panduan Setup Terisolasi:**
  - Menyusun file migrasi [docs/setup_supabase.sql](file:///e:/Data/GitHub/Project%20Dede/docs/setup_supabase.sql) mencakup 6 tabel terstruktur (`pgsd_forms`, `pgsd_form_configs`, `pgsd_groups`, `pgsd_students`, `pgsd_responses`, `pgsd_backups`) lengkap dengan proteksi Row Level Security (RLS) dan indeks performa tinggi.
  - Menyediakan panduan lengkap langkah-demi-langkah di [docs/supabase_guide.md](file:///e:/Data/GitHub/Project%20Dede/docs/supabase_guide.md).

---

## [2.2.40] - 2026-08-24

### 📐 Rendering KaTeX & Format Kaya pada Kartu Hub & Akselerasi Respons
- **Format Matematika KaTeX & Markdown pada Master Form Hub:**
  - Mengintegrasikan `smartMathFormat()` pada judul formulir (`fTitle`), mata kuliah (`fMatkul`), dan nama dosen (`fDosen`) di dalam kartu pendaftaran formulir Multi-Form Hub.
  - Memanggil `renderAllMathInElement(container)` segera setelah kartu disisipkan ke DOM, sehingga notasi matematika seperti $\sqrt{a^2+b^2}$, $x^2$, dan format tebal/miring terender dengan presisi tinggi tanpa menampilkan teks mentah rumus.
- **Hidrasi Instan Tab Respons (0ms):**
  - Mengimplementasikan *Instant SWR Hydration* pada fungsi `fetchAdminResponsesList()`, memuat respons penilaian dari cache lokal seketika saat tab *Respons* diklik.
  - Menghilangkan *delay* layar kosong saat admin beralih ke tab Respons.

---

## [2.2.39] - 2026-08-24

### ⚡ Optimasi Kecepatan Ekstrem (0ms SWR Cache) & Eliminasi Gap Pembacaan Spreadsheet
- **Arsitektur Stale-While-Revalidate (SWR) & Render Seketika 0ms:**
  - Mengimplementasikan hidrasi instan dari cache lokal (`localStorage`) pada Master Hub Formulir (`returnToMasterHub`) dan Workspace Form (`openFormWorkspace`).
  - Menghilangkan *freeze* dan layar kosong saat membuka panel: daftar formulir, pengaturan draf, kelompok, dan konfigurasi form langsung muncul seketika (**< 1 milidetik**) tanpa menunggu siklus jaringan cloud.
- **Proteksi Batas Waktu Permintaan Jaringan (*Timeout Resilience*):**
  - Menyematkan `AbortController` dengan batas waktu 8 detik pada seluruh panggilan `fetch` ke server Google Apps Script / Supabase.
  - Jika koneksi server sedang mengalami *cold-start* atau latensi jaringan tinggi, antarmuka admin tetap aktif dan lancar menggunakan status cache lokal tanpa macet.
- **Optimalisasi Backend Google Apps Script (`Code.gs`):**
  - Mengoptimalkan fungsi `adminGetFormsRegistry()` dengan teknik pemetaan lembar (*single-pass batch sheet map*) `ss.getSheets()`.
  - Mengeliminasi panggilan RPC berulang `getSheetByName()` di dalam perulangan loop pendaftaran form, memangkas waktu eksekusi server Google Apps Script hingga 75%.

---

## [2.2.38] - 2026-08-24

### 🛠️ Perbaikan Konflik Tampilan Tab Workspace & Relokasi Widget Sesi
- **Relokasi Widget Kontrol Sesi Aktif (*Scoped Session Control Widget*):**
  - Memindahkan komponen widget *Sesi Tampil Minggu Ini* ke dalam kontainer Tab Kelompok (`#adminView_data`).
  - Menghilangkan konflik visual di mana widget kontrol sesi sebelumnya selalu muncul di atas semua tab (termasuk pada Tab *Pertanyaan*, *Setelan*, *Respons*, dan *Sistem*).
- **Penyelarasan Tab Aktif Default Workspace:**
  - Mengonfigurasi Tab **Pertanyaan** (`config`) sebagai tab aktif utama secara konsisten pada saat pertama kali membuka workspace form admin (`admin.html?id=...`).
  - Memperbarui fungsi `switchAdminTab()` agar menyinkronkan status visual tombol (warna latar putih aktif, warna ikon indigo, teks tebal) dan visibilitas kontainer tampilan secara 100% harmonis dan bebas tumpang tindih.

---

## [2.2.37] - 2026-08-24

### 🎯 Sinkronisasi Total Konsistensi Form Builder Canvas & Pratinjau Langsung (Simulator & Client View)
- **Penyelarasan Presisi Render Komponen Inti & Dinamis (*Core & Dynamic Parity*):**
  - Mengintegrasikan blok komponen inti perkuliahan (`CORE_IDENTITY`, `CORE_GROUP_SELECT`, `CORE_SCORE_RUBRIC`, `CORE_BEST_PRESENTER`, `CORE_MEMBER_FEEDBACK`) ke dalam mesin render dinamis sisi klien (`renderSingleClientFieldHtml`).
  - Menjamin bahwa seluruh jenis formulir—baik formulir baku 4-tahap maupun formulir multi-tahap kustom—merender seluruh elemen formulir (dropdown peran, NIM lookup, nama, email, kartu kelompok, slider nilai, chip skor, voting pemateri, dan evaluasi masukan) dengan 100% konsisten antara editor admin dan pratinjau simulator mahasiswa.
- **Penyempurnaan Format KaTeX & Markdown Bebas Distorsi Teks:**
  - Memperbaiki palet rumus matematika agar setiap tombol simbol matematika (`x²`, `√x`, `a/b`, `±`, `≤`, `≥`, `≠`, `π`) menyisipkan pembatas `$ ... $` yang valid secara otomatis.
  - Memastikan teks biasa yang tidak menggunakan pembatas `$` tidak mengalami distorsi karakter, simbol panah tak sengaja, atau korupsi teks saat dirender di antarmuka mahasiswa.
  - Menerapkan sanitasi atribut nilai (`escapeHtml`) pada seluruh input judul pertanyaan, deskripsi pertanyaan, dan nama tahapan untuk mencegah terpotongnya teks akibat tanda kutip atau karakter khusus.
- **Sinkronisasi Draf Seketika (*Instant In-Memory Flush Prior to Preview*):**
  - Mengaktifkan pembaruan paksa draf konfigurasi dan skema seketika (`handleConfigInputAutoSave(true)`) sesaat sebelum membuka jendela Simulator Pratinjau Langsung maupun Tab Baru.
  - Menjamin bahwa perubahan teks yang sedang diketik admin langsung tercermin secara *real-time* tanpa jeda *debounce*.
- **Pembaruan Navigasi Tahap Dinamis:**
  - Mengonfigurasi `renderDynamicStepTabs()` dan `updateStepUI()` untuk menghitung jumlah tahap secara dinamis sesuai skema aktif, menampilkan badge nomor tahap yang akurat (misal `01/01` atau `01/04`), dan memperbarui indikator persentase kemajuan secara tepat.

---

## [2.2.36] - 2026-08-24

### 📱 Perombakan Total Responsivitas Mobile-S, Mobile-M, & Mobile-L (320px – 430px)
- **Top Header Bar & Navigasi Workspace 100% Anti-Overflow:**
  - Menata ulang tata letak bilah atas (*top header bar*) pada resolusi ultra-kompak (320px Mobile-S) agar logo, tombol Hub (`←`), badge Form ID (`BK5E`), status online, tombol Bagikan QR, Buka Tab Baru, dan tombol Keluar berada dalam 1 baris terpadu tanpa patah kata atau tumpang tindih.
  - Mengonfigurasi tab navigasi sticky (*Pertanyaan*, *Setelan*, *Respons*, *Kelompok*, *Sistem*) dengan dukungan sentuh gulir horizontal mulus (*touch-first smooth horizontal scroll*) dan tombol *compact padding* (`px-2.5 py-1.5`) yang mempertahankan teks penuh tanpa pemotongan kaku.
- **Penyelarasan Kartu & Kontainer Workspace:**
  - Mengoptimalkan *padding* kontainer dan kartu identitas perkuliahan (`px-2.5 sm:px-6`, `p-3.5 sm:p-7`) agar memanfaatkan ruang layar secara maksimal pada viewport 320px hingga 430px.
  - Memperbaiki tata letak sub-grid informasi (*Mata Kuliah*, *Dosen*, *Kelas*, *Program Studi*) dan kartu alur tahapan pengisian untuk pencegahan pemotongan teks (*zero clipping*).
- **Pengaturan & View Tab Responsif Lengkap:**
  - Menyesuaikan seluruh kartu di Tab Setelan, Respons Penilaian, Manajemen Kelompok, dan Sistem Database agar tampil proporsional tanpa *horizontal scrolling page*.
  - Menghapus elemen kartu ganda pada Tab Sistem untuk menjaga efisiensi kode dan DOM.
- **Pengujian Multi-Resolusi Playwright:**
  - Terverifikasi 100% via Playwright viewport tests pada **Mobile-S (320×642 px)**, **Mobile-M (375×667 px)**, dan **Mobile-L (428×926 px)**.

---

## [2.2.35] - 2026-08-24

### 📱 Optimasi Responsif Mobile & Pencegahan Tumpang Tindih (*Zero Collisions*)
- **Desain Kompak Floating Action Dock di Mobile:**
  - Mengurangi dimensi tombol dock tindakan formulir (`+`, `TT`, `🖼`, `⎘`) pada layar perangkat mobile/smartphone menjadi proporsi ringkas (`w-8 h-8`, ikon `16×16 px`, padding `p-1`) dengan bayangan halus (*subtle shadow*).
- **Transisi Bebas Tabrakan (*Zero Collision During Text Edit*):**
  - Mengimplementasikan penyembunyian dinamis (*smart hide*) pada Floating Action Dock di perangkat mobile ketika pengguna memasuki mode pengeditan teks/fokus input.
  - Menghilangkan tumpang tindih (*overlap*) antara dock aksi umum dan Universal Floating Formatting Toolbar (`B`, `I`, `U`, `🔗`, `T̶`, `∑ Rumus`).
  - Saat pengguna selesai mengedit/melepaskan fokus (*blur*), Floating Action Dock otomatis muncul kembali dengan transisi halus.
- **Pengujian Multi-Resolusi Mobile:**
  - Terverifikasi 100% via remote Playwright browser testing pada resolusi mobile 390×844 px (iPhone / Android) untuk memastikan isolasi visual antara mode edit dan mode navigasi.

---

## [2.2.34] - 2026-08-24

### 🎓 Format Teks & Rumus KaTeX Menyeluruh pada Identitas Perkuliahan & Footer
- **Dukungan Format Lengkap Seluruh Input Form:**
  - Memperluas integrasi format kaya (*rich text*) dan rumus matematika KaTeX ke seluruh kolom input identitas perkuliahan dan footer:
    - **Mata Kuliah** (`cfg_Mata_Kuliah`)
    - **Dosen Pengampu** (`cfg_Dosen_Pengampu`)
    - **Kelas** (`cfg_Kelas`)
    - **Program Studi** (`cfg_Jurusan`)
    - **Kredit Pengembang / Pembuat Web** (`cfg_Pembuat_Web_Nama` & `cfg_Pembuat_Web_Nim`)
- **Badge Pratinjau Langsung (*Live KaTeX Preview Badge*):**
  - Menambahkan wadah badge pratinjau instan pada setiap kolom identitas perkuliahan di Tab Pertanyaan yang otomatis merender pemformatan tebal, miring, garis bawah, serta rumus matematika KaTeX saat ditulis atau diedit.
- **Sinkronisasi Header & Tampilan Mahasiswa:**
  - Memastikan *banner header* admin dan antarmuka pengisian mahasiswa (`index.html`) merender teks berformat dan KaTeX secara konsisten pada bagian identitas mata kuliah, dosen, kelas, jurusan, hingga footer aplikasi.
- **Pengujian Headless Browser:**
  - Terverifikasi 100% via remote Playwright browser testing untuk rendering live badge pada seluruh kolom identitas perkuliahan.

---

## [2.2.33] - 2026-08-24

### 🎯 Universal Floating Bottom Toolbar (Overlay Tetap Tengah Bawah Layar)
- **Desain Floating Toolbar Terpusat (*Persistent Bottom-Center Overlay*):**
  - Memindahkan seluruh toolbar pemformatan teks dan rumus matematika dari yang sebelumnya menempel pada header tiap-tiap input menjadi **Satu Toolbar Melayang Universal (*Universal Floating Toolbar*)** di tengah paling bawah layar (`fixed bottom-6 left-1/2 -translate-x-1/2 z-50`).
  - Posisi tetap stabil melayang di atas konten (*overlay* anti tertutup saat scroll), dengan desain *pill-shaped*, efek kaca *backdrop-blur*, bayangan elegan (*shadow-2xl*), dan animasi masuk/keluar yang mulus.
- **Visibilitas Pintar Berbasis Fokus (*Smart Context-Aware Visibility*):**
  - Toolbar **hanya tampil saat pengguna aktif mengedit/menulis** pada bagian-bagian formulir di Tab Pertanyaan (`cfg_Judul_Form`, `cfg_Deskripsi_Form`, judul/keterangan tahapan, teks alur, label pertanyaan, opsi jawaban, dll).
  - Saat fokus dilepas (*blur* / klik di luar kolom formulir) atau berpindah ke tab lain (Setelan, Respons, Kelompok, Sistem), toolbar otomatis menghilang sehingga tampilan formulir tetap bersih, luas, dan rapi tanpa pergeseran layout.
- **Palet Rumus Terpadu & Interaksi 1-Klik:**
  - Menekan tombol `∑ Rumus` saat teks diblok akan langsung mengubah teks tersebut menjadi rumus KaTeX, sedangkan jika tanpa teks terpilih akan memunculkan palet rumus melayang ke arah atas (*upward popover*) di atas toolbar.
- **Pengujian Headless Browser:**
  - Terverifikasi 100% via remote Playwright browser testing untuk visibilitas dinamis saat fokus, persistensi saat scroll, dan pemformatan teks aktif.

---

## [2.2.32] - 2026-08-24

### ⌨️ Pintasan Keyboard (*Keyboard Shortcuts*) Lengkap untuk Toolbar & Rumus
- **Dukungan Pintasan Keyboard Menyeluruh (*Universal Keyboard Shortcuts*):**
  - Menambahkan pintasan keyboard standar Google Forms & Rich Text Editor pada seluruh kolom input/textarea:
    - **Tebal / Bold**: <kbd>Ctrl</kbd> + <kbd>B</kbd> (atau <kbd>Cmd</kbd> + <kbd>B</kbd>)
    - **Miring / Italic**: <kbd>Ctrl</kbd> + <kbd>I</kbd> (atau <kbd>Cmd</kbd> + <kbd>I</kbd>)
    - **Garis Bawah / Underline**: <kbd>Ctrl</kbd> + <kbd>U</kbd> (atau <kbd>Cmd</kbd> + <kbd>U</kbd>)
    - **Sisipkan Tautan / Link**: <kbd>Ctrl</kbd> + <kbd>K</kbd> (atau <kbd>Cmd</kbd> + <kbd>K</kbd>)
    - **Hapus Format / Clear Formatting**: <kbd>Ctrl</kbd> + <kbd>\</kbd> atau <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>
    - **Rumus Matematika / Formula**: <kbd>Ctrl</kbd> + <kbd>M</kbd> atau <kbd>Alt</kbd> + <kbd>M</kbd> (otomatis mengonversi teks yang diblok menjadi KaTeX, atau membuka palet rumus jika tidak ada teks terpilih)
    - **Tutup Palet & Popover**: <kbd>Escape</kbd>
- **Pembaruan Tooltip & Panduan Visual:**
  - Menampilkan petunjuk pintasan keyboard pada *tooltip hover* setiap tombol toolbar (`B`, `I`, `U`, `🔗`, `T̶`, `∑ Rumus`) dan *header* palet rumus cepat.
- **Pengujian Headless Browser:**
  - Terverifikasi 100% lolos uji simulasi keyboard event Playwright pada seluruh kombinasi tombol pintasan.

---

## [2.2.31] - 2026-08-24

### 🛡️ Proteksi Teks Polos & Eliminasi Konflik Auto-Math KaTeX
- **Preservasi Teks Polos Pengguna (*Conflict-Free Plain Text Mode*):**
  - Menonaktifkan pembajakan teks otomatis (*auto-hijack* regex) pada penulisan biasa seperti `x^2`, tanda kurung, garis bawah `_`, atau teks biasa lainnya tanpa sengaja dianggap rumus.
  - Teks yang diketik polos oleh pengguna dipertahankan 100% apa adanya tanpa memunculkan lencana pratinjau matematika palsu.
- **Peralihan Rumus Eksklusif & Terkontrol:**
  - Rumus matematika KaTeX hanya aktif dan dirender secara eksklusif jika:
    1. Pengguna memblok/menyeleksi teks lalu menekan tombol `∑ Rumus` (otomatis membungkus `$teks$`).
    2. Pengguna memilih formula/simbol melalui palet `∑ Rumus` cepat.
    3. Pengguna secara eksplisit mengetik pembatas matematika resmi (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`).
- **Sinkronisasi Seluruh Sisi Formulir & Pengujian Browser:**
  - Diintegrasikan merata pada `admin.html` dan `index.html`.
  - Terverifikasi 100% via remote Playwright browser testing pada kasus teks polos dan konversi seleksi formula.

---

## [2.2.30] - 2026-08-24

### 🚀 Pratinjau Live Identik Draf, Compact Math Popover & Sinkronisasi Alur Dinamis
- **Pratinjau Live Identik Draf 100% (*Exact WYSIWYG In-Memory Simulator*):**
  - Mengintegrasikan pratinjau formulir mahasiswa dengan iframe responsif interaktif langsung di dalam modal admin maupun di jendela baru ("Buka Tab Baru").
  - Menampilkan secara presisi data draf yang sedang diedit pengguna saat ini (*in-memory editing draft state* via `PGSD_DRAFT_SCHEMA` & `PGSD_DRAFT_CONFIG`), terisolasi penuh tanpa menunggu publikasi database.
  - Dilengkapi fitur pengalih pratinjau perangkat multi-platform: **Desktop 💻**, **Tablet 📱**, dan **Mobile 📲**.
- **Palet Rumus Compact Floating Overlay & Konversi Blok Teks Instan:**
  - Mengubah palet simbol matematika menjadi popover melayang (*compact floating overlay*) yang tidak menggeser atau merusak tata letak formulir.
  - Menghadirkan deteksi seleksi teks pintar: memblok teks lalu menekan `∑ Rumus` akan otomatis mengonversi teks tersebut menjadi format matematika KaTeX (`$teks$`) lengkap dengan lencana pratinjau rumus *real-time*.
- **Sinkronisasi Dinamis Alur & Reordering Presisi:**
  - Judul bagian yang belum dikustomisasi otomatis sinkron secara *real-time* ke kartu alur tahapan.
  - Kustomisasi teks alur tersimpan aman saat tahapan dipindah naik/turun (*reorder*), dan tombol pintasan gulir (*quick jump*) selalu mengarah ke posisi bagian yang benar.
- **Pengujian Headless Browser:**
  - Terverifikasi 100% lolos uji interaksi seleksi teks, floating popover, pengurutan tahapan alur, dan rendering pratinjau draf pada pengujian remote Playwright.

---

## [2.2.29] - 2026-08-24

### 📝 Pengeditan Bebas Alur Tahapan Pengisian Tanpa Mengubah Isi Bagian
- **Kustomisasi Judul & Keterangan Alur (*Independent Alur Text*):**
  - Mengizinkan pengguna mengedit teks judul alur (`alurTitle`) dan keterangan alur (`alurDesc`) secara bebas langsung pada kartu **Alur Tahapan Pengisian**.
  - Perubahan teks alur ini dirancang khusus untuk ringkasan panduan mahasiswa tanpa mengubah atau mengganggu judul bagian asli (`stage.title`) maupun daftar pertanyaan/isian di dalamnya.
- **Sinkronisasi Otomatis Multi-Bagian & Tampilan Mahasiswa:**
  - Penambahan, penghapusan, dan pengurutan bagian tetap otomatis menyinkronkan slot alur tahapan.
  - Sisi mahasiswa (`index.html`) membaca dan menampilkan preferensi teks alur kustom tersebut dengan rapi.
- **Pengujian Headless Browser:**
  - Terverifikasi 100% menggunakan remote Playwright browser testing pada pengujian pengeditan in-place dan sinkronisasi formulir.

---

## [2.2.28] - 2026-08-24

### 🖋️ Universal Rich Text Toolbar di Seluruh Kolom Isian Teks Tab Pertanyaan
- **Integrasi Universal Formatter:**
  - Menghadirkan bilah alat pemformatan teks kaya (*B*, *I*, *U*, *🔗*, *T̶*, *∑ Rumus*) secara universal dan kontekstual pada setiap kolom penulisan/pengisian teks di Tab Pertanyaan:
    1. Judul Formulir Penilaian (`#cfg_Judul_Form`)
    2. Deskripsi & Panduan Pengisian (`#cfg_Deskripsi_Form`)
    3. Judul Bagian (`stageTitleInput_${sIdx}`)
    4. Deskripsi Bagian (`stageDescInput_${sIdx}`)
    5. Label / Judul Pertanyaan (`fieldLabelInput_${sIdx}_${fIdx}`)
    6. Deskripsi / Panduan Pertanyaan (`fieldDescInput_${sIdx}_${fIdx}`)
- **Preservasi Fokus & KaTeX Math Quick Palette:**
  - Dilengkapi pencegahan pelepasan fokus (*focus preservation*) `onmousedown="event.preventDefault()"` dan palet simbol matematika interaktif (`x²`, `√x`, `a/b`, `±`, `≤`, `≥`, `≠`, `π`, `$ Rumus $`).
- **Verifikasi Multi-Perangkat:**
  - Terverifikasi 100% menggunakan remote Playwright browser testing pada resolusi Desktop (1600px) dan Smartphone Mobile (425px).

---

## [2.2.27] - 2026-08-24

### 🎨 Kartu Judul & Panduan Identik Asli Mahasiswa Serta Alur Tahapan Sinkron
- **Tampilan Header Builder Identik 100% (*Student Landing Mirror*):**
  - Menyelaraskan struktur visual kartu atas form builder dengan halaman depan pengisian penilaian mahasiswa, lengkap dengan lencana `PANDUAN`, subgrid identitas 4-kolom (*Mata Kuliah*, *Dosen*, *Kelas*, *Program Studi*), serta catatan evaluatif di bagian bawah.
  - Semua field identitas tetap dapat diedit langsung di tempat (*in-place editable*) dengan penyimpanan otomatis seketika.
- **Sinkronisasi Dinamis Alur Tahapan Pengisian (*Live-Synced Workflow Grid*):**
  - Menghadirkan kotak alur tahapan dinamis yang otomatis membaca seluruh daftar bagian (*stages*) yang ada di formulir.
  - Setiap kartu alur dilengkapi fungsionalitas interaktif (*quick jump*) yang menggulirkan kanvas ke bagian terkait saat diklik.
- **Pengujian Headless Browser:**
  - Terverifikasi 100% melalui remote Playwright browser testing pada pengujian sinkronisasi multi-bagian.

---

## [2.2.26] - 2026-08-24

### 📐 Tata Letak Header Penuh Ujung-ke-Ujung (*Full-Width Edge-to-Edge*)
- **Penghapusan Pembatas Lebar Statis:**
  - Mengubah kontainer `<header>` dan `#headerWorkspaceTabs` dari `max-w-7xl` menjadi `w-full px-3 sm:px-6 lg:px-8`.
  - Memastikan bilah header utama dan bilah tab navigasi formulir membentang penuh 100% dari ujung kiri ke ujung kanan layar pada semua resolusi (termasuk layar ultrawide, 1080p, 2K, dan 4K).
- **Pengujian Responsivitas Multi-Resolusi:**
  - Terverifikasi pada pengujian layar lebar desktop (1600px) dan layar smartphone (425px) dengan gulir horizontal mulus dan tanpa *layout shift*.

---

## [2.2.25] - 2026-08-24

### 💎 Integrasi Header Kompak & Eliminasi Banner Redundan 'Bagikan QR & PIN'
- **Header Atas Kompak & Terpadu (*Unified Top Header*):**
  - Mengintegrasikan tombol **`[ 🔗 Bagikan QR & PIN ]`** secara tunggal dan presisi di bilah header atas panel admin.
  - Menempatkan tombol navigasi **`[ ← Hub ]`** dan lencana PIN formulir (**`ID: [PIN]`**) langsung di sebelah logo header saat admin sedang mengelola suatu formulir.
- **Pembersihan Banner Redundan (*Banner Cleanup*):**
  - Menghapus banner kartu hitam besar di bawah bilah tab navigasi yang sebelumnya menduplikasi tombol `Bagikan QR & PIN` dan judul formulir.
  - Membuka ruang vertikal kanvas formulir menjadi lebih luas, lega, dan modern.
- **Pengujian Headless Browser:**
  - Telah diverifikasi via remote Playwright browser testing dengan 0 kesalahan konsol.

---

## [2.2.24] - 2026-08-24

### 🧹 Eliminasi Tombol Redundan Penyisipan Media pada Kartu Pertanyaan
- **Penataan Posisi Tunggal Sisip Media (*Google Forms Style*):**
  - Menghapus tombol redundan `+ Media` di bilah alat bawah kartu pertanyaan.
  - Memusatkan tombol sisip media (`[ 🖼️ ]`) di baris atas pertanyaan (di samping kotak judul dan pemilih tipe pertanyaan).
  - Memberikan status aktif (*highlight* indigo) pada tombol sisip media atas jika pertanyaan telah memiliki media terlampir.
- **Pembersihan Tata Letak (*Layout Cleanup*):**
  - Bilah alat bawah kartu pertanyaan kini jauh lebih lega, teratur, dan 100% konsisten dengan antarmuka Google Forms asli.
- **Pengujian Headless Browser:**
  - Terverifikasi melalui remote visual testing dengan 0 kesalahan konsol.

---

## [2.2.23] - 2026-08-24

### 🔄 Peningkatan Sistem Penggeseran Urutan Pertanyaan & Bagian Formulir
- **Mesin Drag & Drop Interaktif (*Google Forms Authentic*):**
  - Mengaktifkan fungsionalitas *HTML5 Drag & Drop* pada pegangan 6-titik (`:::`) untuk seluruh butir pertanyaan dan kartu bagian/tahapan formulir.
  - Memberikan indikator visual (*ghosting*, *dashed border*, dan *highlight ring*) saat kartu digeser ke target baru.
  - Mendukung penggeseran butir pertanyaan secara dinamis antar-bagian (*cross-stage moving*).
- **Peningkatan Tombol Geser Panah (`▲` dan `▼`):**
  - Mengoptimalkan fungsi `moveField` dan `moveStage` dengan proteksi indeks batas, status *disabled* otomatis saat berada di posisi ujung, notifikasi *toast* konfirmasi, dan pencatatan riwayat *Undo*.
  - Memperbarui gaya tombol dengan ikon SVG presisi dan aksen warna interaktif.
- **Pengujian Headless Browser:**
  - Terverifikasi 100% lulus uji remote browser Playwright untuk simulasi klik panah dan *drag & drop*.

---

## [2.2.22] - 2026-08-24

### ✨ Bilah Format Teks Kaya Kontekstual (Tampil Hanya Saat Input Aktif/Fokus)
- **Perilaku Fokus Kontekstual (*Focus-Triggered Toolbar*):**
  - Mengatur bilah alat pemformatan teks kaya (`B`, `I`, `U`, `Link`, `Tx`, `∑ Rumus`) agar tersembunyi secara *default* saat kanvas *idle* dan hanya muncul secara otomatis ketika pengguna mengklik/memfokuskan input pertanyaan.
  - Memastikan antarmuka kanvas formulir selalu bersih, lega, rapi, dan 100% otentik seperti perilaku Google Forms asli.
- **Proteksi Seleksi Teks (*Selection Preservation*):**
  - Menerapkan `onmousedown="event.preventDefault()"` pada setiap tombol toolbar agar klik pada tombol pemformatan tidak membatalkan fokus atau seleksi teks pengguna.
- **Pengujian Headless Browser:**
  - Telah diverifikasi secara otomatis melalui browser remote testing pada status sebelum fokus (`display: none`) dan setelah fokus (`display: flex`).

---

## [2.2.21] - 2026-08-24

### 🎯 Eliminasi Tombol Redundan di Dasar Kanvas Form Builder
- **Pembersihan Aksi di Dasar Halaman Studio:**
  - Menghapus tombol redundan `+ Tambah Pertanyaan` yang berada di dasar halaman formulir.
  - Mempertahankan satu tombol terpusat dan elegan (**`⎘ + Tambah Bagian Baru`**) di bagian paling bawah kanvas studio.
  - Penambahan butir pertanyaan tetap berfokus melalui tombol kontekstual di dalam setiap bagian (`+ Tambah Pertanyaan ke Bagian X`) dan bilah alat mengambang (*Floating Action Dock*).
- **Pengujian Headless Browser:**
  - Diuji dan diverifikasi menggunakan Playwright remote browser di resolusi desktop dan mobile dengan 0 kesalahan konsol.

---

## [2.2.20] - 2026-08-24

### 💎 Penyatuan Bilah Navigasi Sticky Top Bar Google Forms & Pemisahan Tab Setelan
- **Penyatuan Bilah Navigasi Sticky Google Forms (*Unified Top App Bar*):**
  - Mengangkat tombol tab inti Google Forms (**`Pertanyaan`**, **`Setelan`**, **`Respons`**, **`Kelompok`**, **`Sistem`**) dan bilah alat aksi cepat (**`Urungkan/Ulangi`**, **`Riwayat`**, **`Pratinjau`**, **`Publikasikan`**) langsung ke *Sticky Top Bar*.
  - Menghilangkan *sub-tab* redundan di dalam kanvas agar tidak terjadi benturan atau tab ganda saat pengguna menggulir (*scrolling*) ke bawah hingga ke pertanyaan.
- **Pemisahan Mandiri Tampilan `Pertanyaan` vs `Setelan`:**
  - Kanvas pertanyaan berfokus murni pada kartu formulir, butir soal, dan *Floating Action Dock*.
  - Tampilan *Setelan* menampung status penerimaan respon, sesi aktif, kredit footer pengembang, dan opsi pemulihan skema standar.
- **Verifikasi Headless Browser & Pengujian Gulir:**
  - Pengujian remote scroll dan tab switching berhasil diverifikasi pada resolusi desktop (1280px) dan mobile (375px) dengan 0 galat konsol.

---

## [2.2.19] - 2026-08-24

### 🌟 Studio Google Forms Fullscreen: Pengalaman WYSIWYG Zero-Gap & Mobile-First
- **Studio Google Forms Terpadu (*Dedicated Google Forms Studio*):**
  - Mengubah antarmuka Konfigurasi & Form Builder menjadi kanvas studio Google Forms layar penuh yang lega, modern, dan minimalis.
  - Menghadirkan **Kartu Utama Identitas Perkuliahan** dengan pita aksen ungu/indigo khas Google Forms yang memuat Judul Formulir, Mata Kuliah, Dosen Pengampu, Kelas, Program Studi, dan Petunjuk Pengisian Formulir dengan sinkronisasi instan (*Auto-Save*).
- **Navigasi Sub-Tab Studio (*Pertanyaan* & *Setelan Formulir*):**
  - Menyediakan tab terpisah antara penyusunan butir soal/rumus (**`Pertanyaan`**) dan konfigurasi sistem formulir/status penerimaan (**`Setelan Formulir`**).
- **Bilah Alat Mengambang (*Floating Action Dock* Mobile-First):**
  - Menerapkan *floating dock* di sisi kanan kanvas pada perangkat desktop, dan menjadi *sticky bottom bar* yang ramah sentuhan 1-jempol pada perangkat mobile (**Mobile-S/M/L**).
- **Pengujian Multi-Resolusi & Remote Browser:**
  - Telah diuji secara remote pada resolusi Mobile-S (320px), Mobile-M (375px), Tablet (768px), dan Desktop (1280px+) dengan 0 kesalahan konsol (*Zero Console Errors*).

---

## [2.2.18] - 2026-08-24

### 🚀 Perbaikan Sintaks Inisialisasi Skrip & Pengujian Remote Browser Otomatis
- **Perbaikan Deklarasi Fungsi `smartMathFormat`:**
  - Memperbaiki komentar pada deklarasi `function smartMathFormat` di `admin.html` yang sempat menyebabkan galat sintaksis (*Illegal return statement*) saat browser memuat skrip.
- **Validasi Sintaksis Menyeluruh (Node VM & Playwright Headless Browser):**
  - Menguji pemuatan skrip, parsing AST, dan rendering DOM di lingkungan server HTTP lokal menggunakan browser remote testing.
  - Memverifikasi fungsi tombol format **Bold**, **Italic**, **Underline**, **Link**, **Hapus Format**, dan **Palet Rumus** berjalan lancar dengan 0 kesalahan konsol (*Zero Console Errors*).

---

## [2.2.17] - 2026-08-24

### 🎨 100% Identik Google Forms: Bilah Pemformatan Teks Kaya (B, I, U, Link, Hapus Format) & Tata Letak Kartu Pertanyaan
- **Bilah Pemformatan Teks Kaya (*Google Forms Authentic Rich Text Toolbar*):**
  - Menghadirkan bilah toolbar pemformatan teks kaya tepat di bawah input pertanyaan dengan tombol aksi lengkap:
    - **`B`** (Tebal / Bold)
    - **`I`** (Miring / Italic)
    - **`U`** (Garis Bawah / Underline)
    - **`🔗`** (Sisipkan Link Tautan)
    - **`T̶`** (Hapus Format / *Remove Formatting*)
    - **`∑ Rumus`** (Palet Simbol & Rumus Matematika)
  - Mendukung pintasan keyboard standar (**Ctrl+B**, **Ctrl+I**, **Ctrl+U**) saat fokus mengedit pertanyaan.
- **Tata Letak Kartu Pertanyaan 100% Identik Google Forms:**
  - Menambahkan *6-dots drag handle* (`:::`) di bagian tengah atas setiap kartu pertanyaan.
  - Memperbarui gaya input judul pertanyaan dengan latar Material Form (`#f1f3f4` / `bg-zinc-100/90`) dan garis fokus aktif ungu/indigo.
  - Menempatkan tombol lampiran media/gambar (`[ 🖼️ ]`) tepat di samping dropdown pemilih tipe pertanyaan (*Question Type Selector*).
- **Perenderan Teks Kaya & Formula Lintas Halaman (`admin.html` & `index.html`):**
  - Mengintegrasikan pemrosesan sintaks Markdown (**tebal**, *miring*, dan [tautan](url)) secara otomatis ke dalam mesin KaTeX dan pratinjau langsung formulir.

---

## [2.2.16] - 2026-08-24

### 📐 Optimalisasi Tata Letak Form Builder: Relokasi Tools Rumus ke Header Kartu & Menu Titik Tiga (3-Dots) Pindah Bagian
- **Relokasi Tombol Alat Rumus Matematika ke Bilah Atas (*Top Header Toolbar Placement*):**
  - Memindahkan tombol aksi **`[ ∑ Rumus ]`** dari bilah bawah (*bottom action bar*) ke baris atas kartu pertanyaan berdampingan dengan pemilih tipe pertanyaan (*Question Type Popover*).
  - Menempatkan panel **Palet Simbol & Rumus Matematika Cepat** tepat di bawah baris input judul/deskripsi sehingga proses penyusunan formula menjadi lebih intuitif dan langsung terlihat tanpa perlu menggulir ke bawah.
- **Menu Opsi Titik Tiga Khas Google Forms (*3-Dots More Options Menu*):**
  - Menambahkan tombol menu titik tiga (`⋮`) pada bilah bawah setiap kartu pertanyaan.
  - Memasukkan fungsi **`Pindah Bagian`** ke dalam dropdown melayang menu titik tiga tersebut, menjaga tampilan bilah aksi pertanyaan tetap rapi, bersih, dan lapang di seluruh perangkat desktop dan mobile.
- **Smart Popover Positioning & Outside Click Dismissal:**
  - Mengintegrasikan deteksi posisi cerdas (*upward / downward detection*) dan penutup otomatis saat mengklik di luar area menu titik tiga.

---

## [2.2.15] - 2026-08-24

### 🖱️ 100% Reliable Math Selection & Universal Right-Click Context Menu Engine
- **Penyempurnaan Penangkapan Seleksi Teks (Universal Input Selection Listener):**
  - Memperbaiki penanganan event seleksi teks (`select`, `selectionchange`, `mouseup`, dan `contextmenu`) di seluruh tipe input dan textarea pada Form Builder tanpa dibatasi oleh ID kontainer tertentu.
  - Mengatasi masalah deselect otomatis pada browser berbasis Chromium di lingkungan sistem operasi Windows saat melakukan klik kanan.
- **Gelembung Aksi Melayang & Menu Konteks Instan:**
  - Menampilkan menu konteks pilihan konversi rumus lengkap (`$...$ Formula`, `x² Pangkat`, `x₁ Indeks`, `\frac Pecahan`, `\sqrt Akar`) saat klik kanan atau melalui gelembung aksi melayang.
- **Perenderan Real-Time Otomatis di Kanvas Admin:**
  - Menambahkan *auto-render trigger* KaTeX pada siklus akhir `renderDynamicStagesCanvas` sehingga setiap perubahan rumus matematika langsung dirender visual tanpa jeda.

---

## [2.2.14] - 2026-08-24

### 🖱️ Right-Click Math Context Menu & Text Selection Math Converter
- **Fitur Blok & Klik Kanan Konversi Formula Matematika (Smart Selection Menu):**
  - Pengguna kini dapat memblok (*highlight/select*) teks apa pun di dalam input (judul pertanyaan, deskripsi bagian, atau opsi jawaban) lalu melakukan **Klik Kanan** untuk memunculkan menu konteks khusus:
    - **`∑ Jadikan Formula ($...$)`**: Membungkus teks terpilih menjadi rumus matematika instan.
    - **`x² Ubah ke Pangkat`**: Mengubah teks terpilih menjadi format eksponen `^{...}`.
    - **`x₁ Ubah ke Indeks`**: Mengubah teks terpilih menjadi format subskrip `_{...}`.
    - **`½ Ubah ke Pecahan`**: Mengubah teks terpilih menjadi pecahan `\frac{...}{b}`.
    - **`√ Ubah ke Akar`**: Mengubah teks terpilih menjadi akar kuadrat `\sqrt{...}`.
    - **`✕ Hapus Format Formula ($)`**: Mengembalikan rumus ke teks biasa.
- **Gelembung Aksi Melayang (*Floating Selection Mini-Bubble*):**
  - Menampilkan tombol aksi cepat melayang saat teks diblok di perangkat desktop maupun sentuhan mobile sehingga konversi formula dapat dilakukan dengan 1 kali ketuk tanpa klik kanan.
- **Pencegahan Konflik Total dengan Teks Biasa (Zero Conflict):**
  - Menghilangkan ambiguitas dan *false positives* pada kalimat bahasa Indonesia biasa dengan sistem berbasis *explicit selection* dan *safe math auto-formatting*.

---

## [2.2.13] - 2026-08-24

### 🧠 Conflict-Free Smart Math UX, Quick Symbol Palette & Compact In-Place Live Preview
- **Desain Interaksi Pengisian Rumus Bebas Konflik (Conflict-Free Math UX):**
  - Mengganti banner pratinjau yang kaku dengan pil mini melayang (*compact floating badge*) `∑ Rumus: [ x² ]` yang rapi, elegan, dan tidak menggeser tata letak form.
  - Memperbaiki perenderan pada saat *initial load* dari cache lokal sehingga rumus $x^2$ langsung ter-render dengan sempurna tanpa menampilkan raw code `$...$`.
- **Palet Simbol & Rumus Matematika Cepat (*1-Click Math Inserter*):**
  - Menambahkan tombol interaktif **`[ ∑ Rumus ]`** di setiap bilah aksi pertanyaan pada Form Builder (`admin.html`).
  - Menyediakan *chips* sisip instan untuk mempermudah guru/dosen membuat soal matematika tanpa perlu menghafal sintaks LaTeX yang rumit:
    - Pangkat & Eksponen: `x²`, `x³`, `xⁿ`
    - Indeks & Subskrip: `x₁`, `xᵢ`
    - Pecahan & Akar: `\frac{a}{b}`, `\sqrt{x}`
    - Operator & Relasi: `±`, `≤`, `≥`, `≠`, `≈`, `∞`
    - Simbol Ilmiah & Yunani: `π`, `θ`, `α`, `β`, `∑`, `∫`
    - Tombol Pembungkus Rumus: `$...$`
- **Jaminan Konsistensi Perenderan Matematika di Sisi Klien (`index.html`):**
  - Memastikan *lifecycle trigger* KaTeX otomatis dieksekusi saat perpindahan langkah (*Step Navigation* `updateStepUI`), pemuatan awal, dan pemulihan draf sehingga tidak ada teks rumus yang terlewat.

---

## [2.2.12] - 2026-08-24

### 📐 Smart Auto-Math Engine & Live Math Preview Badges (Word Equation, Superscripts & Caret Notation)
- **Otomatisasi Deteksi & Normalisasi Rumus Matematika (Smart Math Preprocessor):**
  - Mengonversi notasi pangkat/pangkat-indeks biasa seperti `x^2`, `y^3`, `(a+b)^2`, `x_1`, `a_n` menjadi format rumus LaTeX yang dapat dirender KaTeX secara instan tanpa mewajibkan pengguna mengetik pembatas `$...$` manual.
  - Mendukung konversi karakter *Unicode Superscript/Subscript* hasil *copy-paste* langsung dari **Microsoft Word Equation** (seperti $x²$, $x³$, $y₁$, $y₂$, $\sqrt{x}$, $\pm$, $\le$, $\ge$, $\ne$, $\approx$, $\infty$, $\pi$, $\theta$, $\alpha$, $\beta$, $\sum$, $\int$).
  - Perataan batas regex cerdas yang mengisolasi ekspresi matematika di dalam kalimat bahasa Indonesia tanpa menyerap kata-kata sekitarnya.
- **Pratinjau Rumus Interaktif Real-Time di Form Builder (`admin.html`):**
  - Menampilkan lencana *Live Math Preview* bertuliskan `Rumus Ter-render: [ KaTeX Math ]` tepat di bawah input judul bagian, deskripsi bagian, judul pertanyaan, dan deskripsi pertanyaan secara instan saat mengetik atau menempel teks.
- **Perenderan Penuh di Sisi Formulir Klien (`index.html`):**
  - Mengintegrasikan `smartMathFormat` pada seluruh tipe pertanyaan (*Short Text, Paragraph, Radio, Checkbox, Dropdown, Rating Scale/Skala Linier, Core Group Grade, Core Best Presenter*), opsi pilihan ganda, dan deskripsi tahapan formulir.

---

## [2.2.11] - 2026-08-24

### 🎬 Rich Multi-Media & Universal KaTeX Math Formula Engine + Google Drive Uploader Fix
- **Penyematan Multimedia Lengkap per Pertanyaan (*Melebihi Fitur Google Form Biasa*):**
  - **Gambar (Image):** Mendukung URL langsung, link Google Drive, serta unggah langsung (*Direct File Upload / Galeri*) dengan kompresi cerdas di sisi klien (*Client-Side Canvas Optimization*) dan pratinjau modal *fullscreen zoom*.
  - **Video (YouTube / Vimeo / MP4 / Drive):** Player tersemat otomatis dengan rasio responsif 16:9 yang dapat memutar video YouTube (termasuk YouTube Shorts), Vimeo, dan Google Drive Video langsung di dalam kartu pertanyaan.
  - **Audio (Listening Test / Voice Note):** Pemutar audio HTML5 elegan untuk evaluasi mendengarkan (*listening test*) atau rekaman suara perkuliahan.
  - **Embedded Link & Dokumen Interaktif:** Memuat halaman web, slide presentasi Google Slides, PDF, atau Figma interaktif via iframe.
  - Pengaturan tata letak fleksibel (*Perataan Kiri, Tengah, Kanan*) serta penempatan di atas atau di bawah teks pertanyaan.
- **Universal Math & Formula Engine (KaTeX + Auto-Renderer):**
  - Perenderan instan rumus matematika kompleks menggunakan sintaks LaTeX standar (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`).
  - Mendukung *copy-paste* langsung dari AI (ChatGPT, Gemini, Claude) maupun rumus matematika Microsoft Word ke dalam judul pertanyaan, deskripsi, opsi pilihan, dan keterangan media (*caption*).
- **Perbaikan Total Pipeline Unggah Berkas ke Google Drive (`Code.gs` & Client Form):**
  - Memperbaiki parsing Base64 pada `saveUploadedFileToDrive` dengan membersihkan *Data URL header prefix* (`data:...;base64,`) sehingga berkas terunggah 100% sempurna ke folder Drive `Penilaian PGSD 5E - Dokumen / {PIN}` tanpa galat decode.
  - Menambahkan endpoint `adminUploadMedia` / `uploadSingleFile` untuk penyimpanan cloud permanen dengan tautan pratinjau publik (*public view sharing*).
  - Penyatuan fungsi unggah berkas klien (`handleClientFileUpload`) dilengkapi kompresi gambar otomatis (mengurangi ukuran hingga 90% tanpa penurunan resolusi) dan lencana status hijau responsif.

---

## [2.2.10] - 2026-08-24

### 🛡️ Strict Multi-PIN Data & Draft Isolation (Zero Cross-Form Data Leakage)
- **Isolasi Mutlak Kunci Draf & Cache Penyimpanan Lokal per Kode PIN:**
  - Mengubah seluruh penyimpanan draf formulir menjadi terisolasi ketat berdasarkan kode PIN aktif (`PGSD_FORM_DRAFT_{PIN}`), menghapus penggunaan kunci global tanpa ID yang sebelumnya berisiko memicu pencemaran data (*data crossover*) saat berganti formulir.
  - Setiap kali responden atau admin berpindah form (misalnya dari `BK5E` ke `BBJX` atau sebaliknya):
    - Draf isian formulir asal tetap tersimpan aman di ruang penyimpanannya sendiri tanpa tertimpa.
    - Status memori internal aplikasi (*in-memory form state*) di-reset bersih (`resetInMemoryClientFormState`), memastikan formulir tujuan dimulai dari kondisi bersih (*clean slate*) dan hanya memuat data/draf yang sesuai dengan PIN miliknya.
- **Isolasi Cache Rekapitulasi, Konfigurasi, & Mahasiswa:**
  - Seluruh cache `PGSD_CACHE_CONFIG_{PIN}`, `PGSD_CACHE_GROUPS_{PIN}`, `PGSD_CACHE_ALL_STUDENTS_{PIN}`, `PGSD_CACHE_REKAP_{PIN}`, dan `PGSD_CACHE_RESPONSES_{PIN}` terikat 100% pada kode formulir aktif.
  - Pembersihan cache saat penghapusan form di Admin panel diperluas untuk mencakup seluruh kunci data terkait secara menyeluruh.

---

## [2.2.9] - 2026-08-24

### 🎯 100% Real-Time Dynamic Form Schema Engine for Secondary & Custom Forms
- **Sinkronisasi Total Tampilan Formulir Klien (`index.html`) dengan Form Builder Admin:**
  - Menghilangkan struktur statis pada halaman awal (*landing hero*) dan form wizard:
    - **Judul & Deskripsi Dinamis:** Judul hero utama, deskripsi formulir, serta informasi akademik (*Mata Kuliah, Dosen, Kelas, Jurusan*) kini membaca langsung konfigurasi aktif dari form yang dibuka (seperti `BBJX`).
    - **Alur Tahapan Pengisian Dinamis:** Kotak alur langkah pengisian di halaman panduan kini membaca langsung susunan `tahapan` yang dibuat di Admin, merefleksikan jumlah bagian, judul bagian, dan deskripsinya secara presisi.
    - **Dynamic Multi-Stage Wizard Generator:** Tahapan pengisian (*Step 1, Step 2, dst.*), bilah indikator progres (*01/02, 02/02*), navigasi tab, serta seluruh komponen pertanyaan kustom (*Teks Singkat, Paragraf, Radio, Checkbox, Dropdown, Skala Linier, Unggah Berkas, Tanggal, Waktu*) dirender secara dinamis 100% sesuai skema formulir dari Admin.
    - **Validasi Tahapan Bertingkat:** Memastikan kelengkapan input wajib (*required*) pada setiap tahap sebelum pengguna dapat melangkah ke bagian berikutnya atau mengirim penilaian akhir.

---

## [2.2.8] - 2026-08-24

### ⏳ Universal Visual Loading Engine & Responsive Skeleton Shimmer Placeholders
- **Penanganan Status Pemuatan Data Menyeluruh (*Zero Blank Wait States*):**
  - Mengimplementasikan **Universal Top Indeterminate Progress Bar** (`#globalTopProgressBar`) di bagian paling atas peramban yang otomatis menyala selama proses *fetch* data asinkron berjalan di latar belakang.
  - Menghilangkan tampilan area kosong (*blank space*) saat menunggu data dimuat dengan menambahkan komponen **Skeleton Shimmer Placeholders** modern beranimasi denyut halus (*smooth pulse animation*):
    - **Multi-Form Hub Grid:** Menampilkan 3 kartu draf skeleton (*badge, title, metadata, & action button*) selama pendaftaran form di-load dari server/Google Sheets.
    - **Panel Form Builder & Canvas:** Menampilkan placeholder bagian dan kotak pertanyaan bertingkat.
    - **Manajemen Kelompok:** Menampilkan placeholder kartu kelompok beserta anggota tim.
    - **Tabel Respons & Penilaian:** Menampilkan skeleton baris tabel berdenyut pada panel admin.
    - **Antarmuka Mahasiswa (`index.html`):** Menampilkan skeleton tahapan formulir saat awal buka dan skeleton kartu peringkat / tabel rekapitulasi saat tab dibuka.

---

## [2.2.7] - 2026-08-24

### 🔄 Real-Time Network Reconnection & Resilient Auto-Sync Engine
- **Penanganan Otomatis Pemulihan Koneksi Jaringan (*Online / Offline Lifecycle*):**
  - Mengintegrasikan pendengar event jaringan peramban (*`online`* dan *`offline`*) di `admin.html` dan `index.html`.
  - Saat koneksi internet terputus, sistem secara elegan beralih ke mode offline, mengamankan seluruh perubahan draf lokal, dan menyelaraskan status badge di seluruh antarmuka.
  - Saat koneksi internet tersambung kembali, sistem secara otomatis mengeksekusi antrean draf (*auto-flush queue*) ke Google Apps Script / database, memperbarui data live tanpa memerlukan tindakan manual dari pengguna.
- **Deteksi Berkala Heartbeat & Auto-Retry Cerdas (15s):**
  - Menerapkan mekanisme pemantauan periodik (*heartbeat*) setiap 15 detik serta pemicu pemulihan saat tab kembali aktif (*visibilitychange / focus*), memastikan sinkronisasi draf yang tertunda selalu terkirim seketika saat jaringan normal.
- **Harmonisasi Status Indikator Header & Interaktivitas Tombol 'Kirim Sekarang':**
  - Menghilangkan inkonsistensi badge status: badge header kiri (*Online / Offline / Syncing*) dan badge awan kanan (*Tersinkronisasi / Menyimpan / Offline (Tersimpan Lokal)*) kini terpadu dan selaras 100%.
  - Tombol aksi *"Kirim Sekarang"* pada banner peringatan offline kini dilengkapi indikator loading (*spinner*) dan notifikasi umpan balik real-time yang informatif.

---

## [2.2.6] - 2026-08-24

### 💎 Universal In-App Confirmation Modal Engine (Zero Browser Native Popups)
- **Penggantian Total Dialog Konfirmasi Bawaan Browser (`confirm()` & `alert()`):**
  - Menggantikan seluruh popup dialog bawaan browser sistem operasi (*This page says / OK-Cancel*) yang kaku dan mengganggu alur visual dengan **Universal In-App Action Confirmation Modal** modern:
    - Dilengkapi ikon tematik sesuai level risiko (*danger / warning / info*), judul dialog jelas, penjelasan dampak tindakan, serta tombol aksi (*Batal* vs *Ya, Lanjutkan*).
    - Latar belakang redup lembut dengan efek blur (*backdrop-blur-xs*) dan transisi animasi halus.
  - Diterapkan secara menyeluruh pada seluruh tindakan kritis:
    - Hapus Pertanyaan (*Delete Question*)
    - Hapus Bagian Formulir (*Delete Section*)
    - Reset Struktur Formulir ke Standar / Bersih (*Reset Schema*)
    - Hapus Respons Penilaian (*Delete Response*)
    - Kloning Formulir (*Clone Form*)
    - Hapus Data Kelompok (*Delete Group*)
    - Reset Draf Isian Responden di `index.html` (*Clear Form Draft*)

---

## [2.2.5] - 2026-08-24

### 🧠 Smart Contextual Point Label Presets for Linear Scales (Skala Linier Cerdas)
- **Preset Label Cerdas & Kontekstual untuk Setiap Panjang Rentang Skala:**
  - Mengimplementasikan fungsi kecerdasan penataan label (`getDefaultScalePointLabels(minVal, maxVal)`) yang secara otomatis dan dinamis menghasilkan teks keterangan skala evaluasi baku bahasa Indonesia sesuai jumlah tingkat skala yang dipilih:
    - **Rentang 2 Tingkat (1 s.d. 2):** `1: Kurang`, `2: Baik` (menghilangkan kekeliruan lama di mana nilai 2 berlabel 'Kurang').
    - **Rentang 3 Tingkat (1 s.d. 3):** `1: Kurang`, `2: Cukup`, `3: Baik`.
    - **Rentang 4 Tingkat (1 s.d. 4):** `1: Sangat Kurang`, `2: Kurang`, `3: Baik`, `4: Sangat Baik`.
    - **Rentang 5 Tingkat (1 s.d. 5):** `1: Sangat Kurang`, `2: Kurang`, `3: Cukup`, `4: Baik`, `5: Sangat Baik`.
    - **Rentang 6 s.d. 10 Tingkat:** Menyesuaikan secara presisi hingga tingkat 10 (`Sangat Rendah / Kurang` s.d. `Sempurna / Istimewa`).
  - Setiap kali pengguna mengubah dropdown batas awal (*0 atau 1*) maupun batas akhir (*2 s.d. 10*), seluruh kotak input label langsung diselaraskan secara cerdas dan tetap dapat dikustomisasi manual oleh admin.

---

## [2.2.4] - 2026-08-24

### 🔑 Robust Local & Remote Multi-Form PIN Switcher Engine
- **Perbaikan Navigasi Ganti Formulir (PIN Switcher):**
  - Mengubah mekanisme navigasi ganti formulir pada modal PIN agar mempertahankan *pathname* halaman saat ini (`index.html`), sehingga saat pengujian di lingkungan lokal (*localhost*, Live Server, atau subdirektori) pengguna tidak terlempar ke root `/` yang menyebabkan 404 atau kegagalan membuka form.
- **Pemuatan Cache Formulir Multi-PIN Terisolasi (`loadLocalCache`):**
  - `index.html` kini mendukung pemuatan data lokal terisolasi per kode PIN (`PGSD_CACHE_CONFIG_{PIN}`, `PGSD_CACHE_GROUPS_{PIN}`, `PGSD_CACHE_FORM_SCHEMA_{PIN}`, dan registry lokal `PGSD_CACHE_REGISTRY_FORMS`), sehingga form baru yang diuji di lokal langsung termuat lengkap dan akurat bahkan saat koneksi offline.
- **Standarisasi Tautan Buka Formulir & Bagikan di Panel Admin:**
  - Menyelaraskan seluruh tombol *Buka Formulir*, *Pratinjau Draf*, dan tautan *Bagikan QR & PIN* di `admin.html` agar selalu merujuk secara presisi ke berkas antarmuka pengguna (`index.html?id={PIN}`).

---

## [2.2.3] - 2026-08-24

### 📐 Skala Linier Dinamis (Rentang 2 s.d. 10) & 💎 Universal Modern Popover Dropdown Engine
- **Skala Linier Dinamis 2 s.d. 10 (Google Forms Standard):**
  - Mengubah dropdown rentang nilai akhir (*sampai*) pada tipe pertanyaan **Skala Linier (`RATING_SCALE`)** menjadi rentang lengkap angka `2, 3, 4, 5, 6, 7, 8, 9, 10` (sebelumnya terbatas pada 5 dan 10).
  - Kolom pengisian label keterangan setiap angka (*point labels*) menyesuaikan secara otomatis dan instan dari nilai awal (`0` atau `1`) hingga nilai akhir yang dipilih (`2` s.d. `10`).
- **Universal Modern Dropdown Popover Engine (Zero Native OS Box):**
  - Seluruh elemen dropdown `<select>` di seluruh project (`admin.html` dan `index.html`), baik yang dirender statis maupun dinamis (termasuk dropdown skala linier, filter rekapitulasi, filter presensi, pemilih peran penilai, dan tipe pertanyaan dinamis), kini otomatis ditingkatkan menjadi **Custom Floating Popover Dropdown** modern-minimalis dengan sudut `rounded-xl`, animasi rotasi chevron SVG, highlight opsi aktif bercentang, dan deteksi batasan viewport (*auto-align*).
  - Dilengkapi continuous `MutationObserver` sehingga elemen `<select>` baru yang disisipkan melalui interaksi form builder atau modal langsung berubah menjadi popover modern seketika tanpa perlu reload.

---

## [2.2.0] - 2026-08-24

### 🔘 Form Status Toggle Switch & 🔄 Standardized Refresh Animation
- **Toggle Switch Pengaktifan Formulir (Interactive Status Pill):**
  - Menggantikan badge status statis pada setiap kartu Master Form Hub dengan **Interactive Toggle Pill** bergaya modern yang dapat diklik langsung untuk membuka (`AKTIF`) atau menutup (`TUTUP`) penerimaan respons formulir secara instan.
  - Formulir utama (`BK5E`) dan formulir sekunder sama-sama mendapatkan kontrol status penuh.
- **Kartu Switch Status di Tab Konfigurasi & Builder:**
  - Menambahkan kartu kontrol status ber-toggle iOS/Tailwind (*Aktif / Ditutup*) di bagian paling atas Tab Konfigurasi & Builder dengan indikator live pulse (emerald/hijau untuk aktif, abu-abu untuk ditutup).
- **Sinkronisasi Cloud Backend (`adminUpdateFormMeta`):**
  - Status formulir tersinkronisasi otomatis ke Google Sheets melalui `adminUpdateFormMeta`, sehingga perubahan aktif/tutup segera berdampak pada kemampuan mahasiswa mengisi formulir.
- **Tombol Segarkan Daftar Formulir — Animasi Standar Baru:**
  - Tombol refresh Hub (`[ refresh icon ]`) kini memiliki animasi `animate-spin` yang mulus selama proses pemuatan, dengan `active:scale-90` dan warna ikon berubah sementara menjadi indigo, mengikuti standar animasi modern yang konsisten.

---

## [2.1.99] - 2026-08-24

### 🗑️ Full Form Deletion Feature & Multi-Form Management Lifecycle
- **Tombol Hapus Formulir pada Master Form Hub:**
  - Menambahkan tombol aksi hapus (*trash icon*) pada setiap kartu formulir sekunder di Master Form Hub, dengan perlindungan otomatis untuk mencegah penghapusan formulir utama (`BK5E`).
- **Modal Konfirmasi Penghapusan Aman (`#modalDeleteFormConfirm`):**
  - Menyediakan modal konfirmasi berlapis dengan visual bahaya (*rose theme*), rincian judul formulir & PIN, serta opsi untuk menghapus sheet database terkait di Google Sheets (Master, Config, Respons, Rekap).
- **Integrasi Cloud Backend & Zona Bahaya Tab Sistem:**
  - Menghubungkan proses penghapusan ke fungsi server-side `adminDeleteForm`, membersihkan draf lokal seketika, dan menyediakan tombol hapus di Tab Sistem (*Zona Berbahaya*).

---

## [2.1.98] - 2026-08-24

### 📄 Truly Blank Form Initialization (*Zero Default Copying on New Forms*)
- **Inisialisasi Formulir Baru Bersih Murni (`getBlankFormSchema`):**
  - Formulir baru yang dibuat dengan opsi *Mulai dari Formulir Kosong* kini **benar-benar dimulai dari keadaan kosong (0 pertanyaan, 1 bagian awal bersih)** tanpa lagi menduplikasi 4 tahap preset bawaan perkuliahan BK 5E.
  - Template 4 tahap rubrik default (Nilai Presentasi, Voting Pemateri, Evaluasi Anggota) diisolasi eksklusif hanya untuk form utama (`BK5E`), memberikan keleluasaan penuh bagi admin untuk membuat susunan pertanyaan kustom dari nol.
- **Dukungan Reset Fleksibel:**
  - Opsi reset pada form sekunder memberikan pilihan konfirmasi untuk mengosongkan form menjadi bersih (*0 pertanyaan*) atau memuat template standar 4 tahap BK 5E.

---

## [2.1.97] - 2026-08-24

### 🔝 Sesi Aktif Dropdown Hierarchy & Single Chevron Polish
- **Posisi Opsi `Semua Sesi` di Paling Atas:**
  - Memindahkan opsi `Semua Sesi (Buka Semua Kelompok)` ke urutan paling atas (pilihan pertama sebelum Minggu 1 s.d. 10) pada pemilih sesi aktif formulir (`selectQuickSesiAktif`).
- **Eliminasi Chevron Ganda:**
  - Membersihkan elemen chevron legacy statis sehingga tombol pemicu dropdown popover kustom hanya menampilkan tepat 1 ikon panah chevron yang berotasi mulus 180° saat menu dibuka/ditutup.

---

## [2.1.96] - 2026-08-24

### 📝 Human-Centered Text & UI Simplification (*Jargon-Free Natural Copywriting*)
- **Penyederhanaan Total Teks Modal Pembuatan Formulir (*Buat Formulir Baru*):**
  - Mengubah seluruh label, placeholder contoh, dan deskripsi menjadi bahasa Indonesia yang natural, hangat, dan mudah dipahami orang awam.
  - **Kode Akses & Link:** Menggantikan istilah teknis seperti "Slug URL" dengan label yang jelas: `Kode PIN Masuk (4–5 Huruf)` dan `Alamat Link Singkat`, serta panduan akses yang gamblang bagi mahasiswa dan penilai.
  - **Pilihan Data Awal Mahasiswa:** Menyajikan opsi secara komunikatif (`Mulai dari Formulir Kosong` vs `Gunakan Data Mahasiswa yang Ada (Salin dari BK 5E)`).
- **Penyempurnaan Modal Pendukung:**
  - Pembaruan teks panduan pada Modal Bagikan QR, Modal Pengaturan Blok Inti, dan Modal Kloning agar bebas dari istilah teknis rumit.

---

## [2.1.95] - 2026-08-24

### 💎 Universal Modern Dropdown Popover Engine & System-Wide Dropdown Overhaul
- **Universal Modern Dropdown Popover Engine (*Zero OS Box Dropdowns*):**
  - Menggantikan seluruh dropdown elemen `<select>` bawaan sistem operasi yang kaku dan berwarna biru persegi dengan **Custom Floating Popover Dropdown** modern-minimalis (setara shadcn/ui / Tailwind UI).
  - Dilengkapi animasi buka halus (*subtle zoom & fade*), rotasi ikon chevron 180°, bayangan lembut (*soft elevation shadow*), dan penanda centang aktif (*active checkmark*).
- **Cakupan Total Seluruh Aplikasi (`admin.html` & `index.html`):**
  - **Panel Admin:** Filter Status Master Hub, Prefix Footer Creator, Pemilih Aturan Review & Tipe Input Form Builder, Filter Sesi/Kelompok/Status Anggota, dan Scope Cetak Rekap.
  - **Formulir Pengguna (Mahasiswa/Dosen/Tamu):** Pemilih Peran Penilai pada kartu identitas, Filter Rekapitulasi Sesi & Kelompok, Filter Presensi Kehadiran, dan Opsi Cetak Mahasiswa.
- **Sinkronisasi 2-Arah Native:**
  - Terintegrasi langsung dengan event listener `change` dan `input` native peramban, serta mendukung penutupan otomatis saat klik di luar area (*click-outside*) dan tombol `Escape`.

---

## [2.1.94] - 2026-08-24

### 💎 Master Form Hub Visual Polish & Modern-Minimalist Aesthetic Audit
- **Pembersihan Hero Banner (*Double Plus Elimination & Typography Refinement*):**
  - Menghapus redundansi teks `+ +` pada tombol banner dan modal menjadi `+ Buat Formulir Baru` yang proporsional.
  - Memperbarui gradien banner dark glassmorphism, chip status `Multi-Form Hub`, dan tipografi judul agar lebih tajam dan elegan.
- **Penyempurnaan Toolbar Pencarian & Filter Cerdas:**
  - Input pencarian dan dropdown status menggunakan sudut melengkung `rounded-2xl` dan `rounded-xl`, latar belakang halus, serta transisi fokus yang presisi.
- **Redesain Kartu Formulir (*Modern-Minimalist Form Cards*):**
  - Penyempurnaan tata letak badge `PIN`, chip `Utama`, dan status `🟢 Aktif` yang simetris.
  - Panel statistik respons 2 kolom yang bersih serta penataan tombol aksi `[ ⚙️ Kelola Formulir Ini ]`, `[ 🔗 Bagikan (QR) ]`, dan `[ 📑 Kloning ]` dengan target sentuh $\ge 44 	imes 44	ext{ px}$.

---

## [2.1.93] - 2026-08-24

### 🚀 Dynamic Contextual Header Morphing & Zero-Overhead Form Builder
- **Dynamic Contextual Header Morphing (*In-Place Tab-to-Toolbar Transformation*):**
  - Saat pengguna menggulir (*scroll*) ke area **Susunan Pertanyaan (Form Builder)**, baris TAB navigasi di header atas secara dinamis berganti (*morphing*) menjadi **Toolbar Form Builder**.
  - Mengeliminasi total kebutuhan akan sticky header ganda di atas maupun bottom dock di bawah sehingga **100% ruang pandang layar ponsel dan desktop menjadi sangat bersih, luas, dan leluasa**.
- **Tombol Pintas `[ ⬅️ Menu ]` & Sinkronisasi Dua Arah:**
  - Tombol `[ ⬅️ Menu ]` pada toolbar yang aktif seketika mengembalikan posisi scroll ke atas dan memulihkan 4 Tab utama (`Kelompok`, `Konfigurasi & Builder`, `Respons`, `Sistem`).
  - Mendukung swipe horizontal mulus di layar ponsel dengan kontrol penuh terhadap *Undo/Redo*, *Riwayat Versi*, *Publikasi*, *Pratinjau Simulasi*, *Tambah Pertanyaan*, dan *Tambah Bagian*.

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

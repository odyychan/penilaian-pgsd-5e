# 🤖 Antigravity Autonomous Agent Rules & Operating Guide (AGENTS.md)

Dokumen ini berfungsi sebagai instruksi inti, standar teknis, dan pedoman operasional bagi AI Agent (Antigravity) dalam mengelola, mengembangkan, dan memelihara **Platform Multi-Form Penilaian Peer-Assessment & Evaluasi Akademik FKIP Universitas Lambung Mangkurat**.

---

## 🏛️ 1. Arsitektur Sistem & Backend Eksklusif Supabase

1. **Database Utama (High-Performance PostgreSQL)**:
   - Seluruh data transaksi penilaian, metadata formulir, konfigurasi form dinamis, kelompok, dan mahasiswa dikelola secara eksklusif di database **Supabase Dedicated**:
     - `Project ID`: `eychjnqmqpxzxukiwbqf`
     - `Project URL`: `https://eychjnqmqpxzxukiwbqf.supabase.co`
     - `Tabel`: `pgsd_forms`, `pgsd_form_configs`, `pgsd_groups`, `pgsd_students`, `pgsd_responses`, `pgsd_backups`.
2. **Autonomous Deployment Mandiri oleh Agent**:
   - AI Agent memiliki wewenang dan kemampuan untuk melakukan deployment database Supabase (migrasi SQL, penambahan tabel, indeks, dan RLS) secara otomatis dan mandiri menggunakan kredensial yang tersimpan di file `.env`.
3. **Pipa Asinkron ke Google Spreadsheet (Format Google Forms)**:
   - Otak utama sistem adalah Supabase (pengiriman penilaian selesai dalam `< 50 ms`).
   - Setiap respons baru disinkronkan secara asinkron (*background job*) ke Google Spreadsheet Dosen sehingga lembar kerja tetap terisi otomatis dengan format yang rapi seperti Google Forms tanpa membebani interaksi mahasiswa.

---

## 🔒 2. Protokol Keamanan & Kredensial (Non-Negotiable)

1. **File `.env` Terisolasi**:
   - File `.env` berisi `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, dan konfigurasi rahasia lainnya **DILARANG KERAS DI-COMMIT** ke Git / repositori publik.
   - File `.env`, `.env.local`, dan sejenisnya wajib selalu terdaftar di `.gitignore`.
2. **Frontend Publik Anonim**:
   - Frontend ([index.html](file:///e:/Data/GitHub/Project%20Dede/index.html) dan [admin.html](file:///e:/Data/GitHub/Project%20Dede/admin.html)) **HANYA** diperbolehkan menggunakan `anon_key` / `publishable_key` publik dengan proteksi ketat **Row Level Security (RLS)**.
   - Kunci sensitif `service_role` atau `access_token` tidak boleh diekspos di kode sisi klien.

---

## 📱 3. Standar Desain Antarmuka & Responsivitas Mobile-First

1. **Mobile-First & Touch-First (Mandatory)**:
   - Seluruh tombol dan elemen interaktif memiliki ukuran target sentuh minimal **44×44 px** (direkomendasikan 48×48 px).
   - Layout harus stabil di seluruh resolusi (Mobile S/M/L, Tablet, Desktop, hingga 4K non-reguler) tanpa distorsi, tanpa teks terpotong, dan tanpa *horizontal overflow*.
2. **Konsistensi Rumus KaTeX & Markdown**:
   - Judul formulir, pertanyaan, deskripsi, mata kuliah, dan nama dosen yang mengandung format Markdown (`**tebal**`, `*miring*`) atau rumus matematika (`$x^2$`, `$\sqrt{a^2+b^2}$`) wajib selalu diformat menggunakan mesin `smartMathFormat()` dan dirender melalui `renderAllMathInElement()`.

---

## 🚀 4. Prosedur Rilis, Versioning, dan Git Commit

1. **Changelog & Versioning**:
   - Setiap perubahan yang selesai wajib dicatat pada file `CHANGELOG.md` dengan nomor versi semantik semisal `[2.2.42]`, `[2.2.43]`, dst.
   - Hindari mengekspos detail sensitif backend/token di dalam Changelog publik.
2. **Auto-Commit & Auto-Push**:
   - Setelah setiap pembaruan kode selesai dan diverifikasi, Agent wajib melakukan `git add .`, `git commit -m "<pesan rilis>"`, dan `git push origin main` secara otomatis tanpa menunggu perintah tambahan.

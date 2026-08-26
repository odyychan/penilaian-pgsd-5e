# 📖 Panduan Backend Supabase PostgreSQL & Google Sheets Sync

Dokumentasi arsitektur database, eksekusi migrasi, keamanan Row Level Security (RLS), dan sinkronisasi otomatis (*background sync*) ke Google Spreadsheet Dosen untuk Sistem Penilaian Presentasi PGSD 5E.

---

## 🏛️ 1. Struktur Tabel Database Supabase

| Nama Tabel | Deskripsi | Hak Akses RLS |
| :--- | :--- | :--- |
| `pgsd_forms` | Menyimpan seluruh daftar formulir (PIN, judul, mata kuliah, dosen, kelas, status, sesi aktif). | Public `SELECT`, Admin `ALL` |
| `pgsd_form_configs` | Menyimpan konfigurasi bobot rubrik & skema tahapan form builder dinamis (`JSONB`). | Public `SELECT`, Admin `ALL` |
| `pgsd_groups` | Menyimpan daftar kelompok presentasi per sesi minggu. | Public `SELECT`, Admin `ALL` |
| `pgsd_students` | Menyimpan basis data NIM & nama lengkap mahasiswa per kelompok. | Public `SELECT`, Admin `ALL` |
| `pgsd_responses` | Menyimpan rekaman nilai peer-assessment mahasiswa secara instan (< 50ms). | Public `INSERT`/`SELECT`, Admin `ALL` |
| `pgsd_backups` | Mencatat log snapshot dan berkas cadangan database. | Admin `ALL` |

---

## 🚀 2. Cara Menjalankan Skrip `setup_supabase.sql`

1. Buka Dashboard Supabase Anda: [https://supabase.com/dashboard/project/eychjnqmqpxzxukiwbqf](https://supabase.com/dashboard/project/eychjnqmqpxzxukiwbqf)
2. Di menu sebelah kiri, klik **SQL Editor** (ikon terminal/kode `>_`).
3. Klik tombol **"+ New query"**.
4. Buka file [docs/setup_supabase.sql](file:///e:/Data/GitHub/Project%20Dede/docs/setup_supabase.sql), salin seluruh isinya, dan tempelkan ke dalam SQL Editor Supabase.
5. Klik tombol hijau **"Run"** (atau tekan `Ctrl + Enter`).
6. Buka menu **Table Editor** untuk melihat seluruh tabel telah terbuat dengan rapi dan terproteksi RLS!

---

## 🔄 3. Mekanisme Sinkronisasi Google Sheets (Format Seperti Google Forms)

1. **Fast-Path (< 50ms)**:
   - Mahasiswa menekan tombol **"Kirim Penilaian"**.
   - Data langsung tersimpan di tabel `pgsd_responses` di Supabase.
   - Layar mahasiswa seketika menampilkan animasi sukses tanpa menunggu Google Sheets.
2. **Background Sync Pipeline**:
   - Sistem secara asinkron mengirimkan baris penilaian baru ke Google Apps Script Webhook.
   - Di Google Spreadsheet Dosen, baris data ditulis dengan format kolom standar Google Forms:
     - `Timestamp` | `Sesi` | `Email` | `Nama Penilai` | `NIM` | `Peran` | `Kelompok Dinilai` | `Nilai Akhir` | `Best Presenter 1` | `Best Presenter 2` | `Detail Evaluasi`
   - Kolom `synced_to_sheets` di Supabase diperbarui menjadi `true`.

---

## 🔐 4. Autentikasi Admin & Konfigurasi Supabase Secrets (`ADMIN_PASSWORD`)

Untuk menjamin keamanan tingkat tinggi tanpa mengekspos kata sandi di berkas HTML/JS sisi klien:

1. **Supabase Secrets (`ADMIN_PASSWORD`)**:
   - Buka **Project Settings** → **Configuration** → **Secrets** di Supabase Dashboard:
     `https://supabase.com/dashboard/project/eychjnqmqpxzxukiwbqf/settings/secrets`
   - Tambahkan Secret baru:
     - **Name**: `ADMIN_PASSWORD`
     - **Value**: *(Kata sandi admin kustom Anda)*
2. **Supabase Edge Function (`admin-auth`)**:
   - Berada di: `supabase/functions/admin-auth/index.ts`
   - Bertindak sebagai gerbang verifikasi kata sandi di sisi server (*server-side verification*) yang membaca langsung `Deno.env.get("ADMIN_PASSWORD")`.
   - Mengeluarkan *HMAC-SHA256 signed session token* untuk memvalidasi sesi admin tanpa menyimpan plaintext password di `localStorage`.
3. **Mengubah Kata Sandi via UI Admin atau Dashboard**:
   - **Opsi A (Via UI Admin)**: Masuk ke `/admin` → Buka **Setelan Sistem** (ikon roda gigi) → Masukkan kata sandi saat ini & kata sandi baru → Klik **Simpan**.
   - **Opsi B (Via Supabase Secrets)**: Perbarui nilai secret `ADMIN_PASSWORD` di Dashboard Supabase kapan saja. Edge function akan langsung membaca nilai terbaru secara instan.


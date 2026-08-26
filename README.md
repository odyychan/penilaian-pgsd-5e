# 🎓 Platform Penilaian Akademik & Peer-Assessment FKIP ULM (Supabase + Google Drive/Sheets + Vercel)

Sistem ini adalah aplikasi **Web Multi-Form Peer-Assessment & Executive Leaderboard** modern dengan arsitektur:
- **Frontend & Admin Portal:** Di-host di **Vercel** / **Netlify** / **GitHub Pages** (100% responsif, SPA bersih, tanpa iframe, loading instan < 30ms).
- **Backend & Database Utama:** **Supabase Dedicated Database (PostgreSQL)** berkecepatan tinggi dengan isolasi multi-form.
- **Pipa Pencadangan Otomatis:** **Google Drive API** & **Google Sheets API** untuk duplikasi data dan penyimpanan berkas mahasiswa.

---

## 📁 Struktur Monorepo Proyek

```text
├── index.html                    # Shell frontend mahasiswa (1.325 baris)
├── admin.html                    # Shell portal admin (3.494 baris)
├── sw.js                         # PWA Service Worker (Cache-first modules & offline support)
├── vercel.json                   # Konfigurasi routing, immutable caching & security headers
├── _redirects                    # Konfigurasi fallback Netlify
│
├── src/                          # Modular Architecture
│   ├── admin/                    # Modul Portal Admin
│   │   ├── admin.css             # Gaya spesifik admin
│   │   └── admin.js              # Multi-tier auth, workspace CRUD, form builder & responses
│   │
│   └── student/                  # Modul Portal Mahasiswa
│       ├── index.css             # Gaya spesifik halaman penilaian
│       ├── student.css           # Sumber stylesheet mahasiswa
│       └── student.js            # Wizard form, Google OAuth, leaderboard & PDF generator
│
├── assets/                       # Ikon PWA, logo & favicons
├── supabase/                     # Edge Functions & konfigurasi Supabase
│   └── functions/
│       ├── admin-auth/           # Edge Function autentikasi admin
│       └── google-sync/          # Edge Function pipeline sinkronisasi Google Sheets
└── docs/                         # Skema database setup.sql & dokumentasi teknis
```

---

## 🚀 Panduan Menghubungkan ke Vercel via GitHub

### Langkah Cepat (1 Klik via GitHub):
1. Pastikan seluruh perubahan kode telah ter-push ke GitHub:
   `https://github.com/odyychan/penilaian-pgsd-5e`
2. Buka dashboard [Vercel](https://vercel.com/new).
3. Pilih repository **`odyychan/penilaian-pgsd-5e`** lalu klik **Import**.
4. Biarkan pengaturan Framework Preset sebagai **Other** (karena arsitektur pure static HTML5).
5. Klik **Deploy**.
6. Vercel akan langsung mempublikasikan aplikasi dengan URL produksi global (misal: `https://penilaian-pgsd-5e.vercel.app`).
   - Halaman Formulir & Rekap: `https://penilaian-pgsd-5e.vercel.app/`
   - Portal Admin: `https://penilaian-pgsd-5e.vercel.app/admin`

Setiap kali Anda melakukan `git push origin main`, repository akan terbarui di GitHub. (Catatan: Auto-deployment Vercel dinonaktifkan untuk mode pengembangan lokal via `vercel.json`).

### Langkah Terakhir: Konfigurasi API Backend
1. Buka file **[`Index.html`](file:///d:/Project%20Dede/Index.html)** dan **[`admin.html`](file:///d:/Project%20Dede/admin.html)**.
2. Cari variabel API URL dan ubah dengan URL deployment Google Apps Script Anda:
   ```javascript
   const DEFAULT_API_URL = "TEMPELKAN_URL_APPS_SCRIPT_ANDA_DI_SINI";
   ```
3. Simpan file.

---

### Alternatif Deployment: Netlify
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop) di browser.
2. Tarik (*drag & drop*) folder `Project Dede` ke halaman tersebut, atau hubungkan langsung dengan GitHub repository.
3. Netlify akan langsung memberikan URL website publik yang siap digunakan.

---

## ⚙️ Pengelolaan via Google Spreadsheet
- **Tab `Konfigurasi`**: Mengatur Sesi Pertemuan (Minggu 1, Minggu 2, dll), batas nilai (50-100), dan sembunyikan/tampilkan ulasan publik.
- **Tab `Master_Kelompok`**: Tambah/ubah daftar anggota kelompok dan pemateri.
- **Tab `Respons_Penilaian`**: Seluruh data tersimpan otomatis.
- **Tab `Rekap_Nilai`**: Rekapitulasi nilai rata-rata dan vote pemateri terbaik secara otomatis.

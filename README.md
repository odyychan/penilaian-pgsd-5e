# 🎓 Sistem Penilaian Presentasi Mahasiswa PGSD 5E (Vercel + Netlify + Google Sheets)

Sistem ini adalah aplikasi **Web Peer-Assessment & Executive Leaderboard** modern dengan arsitektur:
- **Frontend & Admin Portal:** Di-host di **Vercel** dan **Netlify** (100% responsif, SPA bersih, tanpa iframe, tanpa banner Google, loading instan).
- **Backend API:** **Google Apps Script** (REST API Serverless yang aman, otomatis, dan tahan gangguan koneksi).
- **Database:** **Google Spreadsheet** (`1D7nQcVEbmOKjgcJ6LzKeeDQPQxhAIiCELRC9eP9w7WU`).

---

## 📁 Struktur File Proyek

1. **[`Index.html`](file:///d:/Project%20Dede/Index.html)**: Frontend web mahasiswa (Multi-step assessment form, auto-save draft, interactive score slider, and modern minimalist leaderboard).
2. **[`admin.html`](file:///d:/Project%20Dede/admin.html)**: Portal Admin lengkap (Master data kelompok & anggota, konfigurasi parameter, monitoring respons & reset jawaban, auto-sync realtime dengan offline queue).
3. **[`vercel.json`](file:///d:/Project%20Dede/vercel.json)**: Konfigurasi routing & rewrites untuk deployment instan di Vercel.
4. **[`_redirects`](file:///d:/Project%20Dede/_redirects)**: Konfigurasi rewrites untuk Netlify.
5. **[`Code.gs`](file:///d:/Project%20Dede/Code.gs)**: Backend REST API di Google Apps Script.

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

Setiap kali Anda melakukan `git push origin main`, Vercel dan Netlify akan secara otomatis mengompilasi dan memperbarui aplikasi secara realtime (*Continuous Deployment*)!

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

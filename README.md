# 🎓 Sistem Penilaian Presentasi Mahasiswa PGSD 5E (Netlify + Google Sheets)

Sistem ini adalah aplikasi **Web Peer-Assessment** modern dengan arsitektur:
- **Frontend:** Di-host di **Netlify** (100% responsif, tanpa iframe, tanpa banner Google, loading super cepat).
- **Backend API:** **Google Apps Script** (REST API Serverless yang aman dan otomatis).
- **Database:** **Google Spreadsheet** (`1D7nQcVEbmOKjgcJ6LzKeeDQPQxhAIiCELRC9eP9w7WU`).

---

## 📁 Struktur File

1. **[`Index.html`](file:///d:/Project%20Dede/Index.html)**: Frontend web mandiri untuk diunggah ke Netlify.
2. **[`Code.gs`](file:///d:/Project%20Dede/Code.gs)**: Backend REST API di Google Apps Script (mengatur simpan nilai, proteksi anti-duplikasi, validasi email institutional, dan kalkulasi rekap).

---

## 🚀 Panduan Deploy Lengkap (3 Menit)

### Langkah 1: Pasang Backend di Google Apps Script
1. Buka [Google Spreadsheet Anda](https://docs.google.com/spreadsheets/d/1D7nQcVEbmOKjgcJ6LzKeeDQPQxhAIiCELRC9eP9w7WU/edit).
2. Klik **Ekstensi (Extensions)** > **Apps Script**.
3. Di tab **`Kode.gs`**, tempel seluruh isi file **[`Code.gs`](file:///d:/Project%20Dede/Code.gs)**, lalu tekan **Ctrl + S**.
4. Klik tombol biru **Terapkan (Deploy)** > **Penerapan baru (New deployment)**.
5. Klik ikon gerigi ⚙️ di samping *Select type* > pilih **Aplikasi web (Web app)**:
   - **Deskripsi:** `Backend API Penilaian 5E`
   - **Jalankan sebagai (Execute as):** **Saya (email Anda)**
   - **Siapa yang memiliki akses (Who has access):** **Siapa saja (Anyone)**
6. Klik **Terapkan (Deploy)** > Salin **URL Aplikasi Web** (link berakhiran `/exec`).

---

### Langkah 2: Hubungkan URL API ke Frontend
1. Buka file **[`Index.html`](file:///d:/Project%20Dede/Index.html)**.
2. Di bagian bawah (sekitar baris 416), ubah:
   ```javascript
   const DEFAULT_API_URL = "TEMPELKAN_URL_APPS_SCRIPT_ANDA_DI_SINI";
   ```
3. Simpan file.

---

### Langkah 3: Publikasikan ke Netlify
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop) di browser.
2. Tarik (*drag & drop*) folder `Project Dede` ke halaman tersebut.
3. Netlify akan langsung memberikan URL website publik yang siap dibagikan ke mahasiswa di kelas!

---

## ⚙️ Pengelolaan via Google Spreadsheet
- **Tab `Konfigurasi`**: Mengatur Sesi Pertemuan (Minggu 1, Minggu 2, dll), batas nilai (50-100), dan sembunyikan/tampilkan ulasan publik.
- **Tab `Master_Kelompok`**: Tambah/ubah daftar anggota kelompok dan pemateri.
- **Tab `Respons_Penilaian`**: Seluruh data tersimpan otomatis.
- **Tab `Rekap_Nilai`**: Rekapitulasi nilai rata-rata dan vote pemateri terbaik secara otomatis.

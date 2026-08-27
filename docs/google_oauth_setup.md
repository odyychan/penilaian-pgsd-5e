# 📖 Panduan Konfigurasi Google Cloud Console & Supabase Auth

Dokumen ini berisi panduan resmi langkah demi langkah untuk mengaktifkan **Google Sign-In (OAuth 2.0)** pada Platform Penilaian Akademik FKIP Universitas Lambung Mangkurat melalui integrasi **Google Cloud Console** dan **Supabase Auth**.

---

## 🏛️ Arsitektur Integrasi

```text
[ Browser Mahasiswa ] 
        │ 1. Klik "Masuk dengan Google" (select_account)
        ▼
[ Google Cloud OAuth 2.0 ] ──> Pilih Akun @mhs.ulm.ac.id / @ulm.ac.id
        │ 2. Callback dengan Authorization Code (PKCE)
        ▼
[ Supabase Auth Server ] (https://eychjnqmqpxzxukiwbqf.supabase.co/auth/v1/callback)
        │ 3. Exchange Code -> Verified Session & Token
        ▼
[ Aplikasi Web Mahasiswa ] (https://bksd-ulm.vercel.app/?id={formId})
        │ 4. Auto-populate Profil, Kunci Identitas & Pulihkan Draf
```

---

## 🛠️ Langkah 1: Konfigurasi di Google Cloud Console

1. **Buka Google Cloud Console**:
   - Kunjungi: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Buat proyek baru atau pilih proyek yang sudah ada (misal: `Penilaian-FKIP-ULM`).

2. **Konfigurasi OAuth Consent Screen**:
   - Masuk ke menu **APIs & Services** → **OAuth consent screen**.
   - Pilih **User Type**:
     - Pilih **External** (agar dapat diakses oleh seluruh akun `@mhs.ulm.ac.id`, `@ulm.ac.id`, dan Gmail umum).
   - Isi informasi aplikasi:
     - **App name**: `Sistem Penilaian Akademik FKIP ULM`
     - **User support email**: Email admin/pengelola Anda.
     - **Developer contact information**: Email developer/admin Anda.
   - **Scopes**:
     - Tambahkan scope standar: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - Simpan dan lanjutkan hingga selesai.

3. **Buat OAuth 2.0 Client ID**:
   - Masuk ke menu **APIs & Services** → **Credentials**.
   - Klik **+ CREATE CREDENTIALS** → pilih **OAuth client ID**.
   - **Application type**: Pilih **Web application**.
   - **Name**: `Web Client Penilaian ULM`.
   - **Authorized JavaScript origins**:
     - `https://bksd-ulm.vercel.app`
     - `http://localhost:3000` *(opsional untuk dev lokal)*
     - `http://localhost:5173` *(opsional untuk dev lokal)*
   - **Authorized redirect URIs** (Sangat Penting):
     - `https://eychjnqmqpxzxukiwbqf.supabase.co/auth/v1/callback`
   - Klik **CREATE**.
   - Salin **Client ID** dan **Client Secret** yang diberikan.

---

## ⚡ Langkah 2: Konfigurasi di Dashboard Supabase

1. **Buka Dashboard Supabase**:
   - Kunjungi: [https://supabase.com/dashboard/project/eychjnqmqpxzxukiwbqf](https://supabase.com/dashboard/project/eychjnqmqpxzxukiwbqf)
2. **Navigasi ke Menu Auth Provider**:
   - Masuk ke **Authentication** (ikon gembok di sidebar kiri) → **Providers**.
3. **Aktifkan Google Provider**:
   - Cari provider **Google** dan klik untuk membuka pengaturannya.
   - Ubah toggle **Enable Google provider** menjadi **ON (Aktif)**.
   - Tempelkan **Client ID** yang didapat dari Google Cloud Console.
   - Tempelkan **Client Secret** yang didapat dari Google Cloud Console.
   - Klik **Save**.
4. **Periksa URL Configuration**:
   - Masuk ke **Authentication** → **URL Configuration**.
   - **Site URL**: `https://bksd-ulm.vercel.app`
   - **Redirect URLs**:
     - `https://bksd-ulm.vercel.app/**`
     - `https://bksd-ulm.vercel.app`
     - `http://localhost:*`

---

## 🔒 Aturan Domain & Keamanan Otomatis pada Aplikasi

Aplikasi telah dilengkapi sistem keamanan berlapis di sisi klien dan basis data:

1. **Mode Khusus Akun ULM (`ULM_ONLY`)**:
   - Sistem secara otomatis memverifikasi bahwa akun yang masuk memiliki akhiran:
     - `@mhs.ulm.ac.id` (Mahasiswa)
     - `@ulm.ac.id` (Dosen/Staff)
   - Jika pengguna masuk menggunakan akun `@gmail.com` biasa pada form `ULM_ONLY`, aplikasi secara otomatis menolak dan memunculkan dialog ramah untuk beralih ke akun ULM.

2. **Mode Email Umum (`ALL_EMAIL`)**:
   - Menerima semua akun Google terverifikasi (`@gmail.com` maupun institusi lain).

3. **Mode Tanpa Email (`NO_EMAIL`)**:
   - Menjalankan formulir secara instan dan anonim tanpa meminta login Google.

4. **Isolasi Draf Isian Penilaian**:
   - Kunci draf terikat langsung ke akun Google: `PGSD_DRAFT_{formId}_{cleanGoogleEmail}`.
   - Aman digunakan bergantian pada satu laptop/HP bersama tanpa risiko isian mahasiswa saling tertimpa.

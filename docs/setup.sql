-- =========================================================================
-- 🏛️ PLATFORM PENILAIAN & EVALUASI AKADEMIK FKIP UNIVERSITAS LAMBUNG MANGKURAT
-- 📦 File: /docs/setup.sql
-- 🛠️ Deskripsi: Skema Master Database PostgreSQL Supabase Dedicated
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 📋 TABEL 1: pgsd_forms (Master Registri Seluruh Formulir Multi-Scope)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pgsd_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id VARCHAR(50) UNIQUE NOT NULL,
    form_slug TEXT,
    judul_form TEXT NOT NULL,
    mata_kuliah TEXT NOT NULL,
    dosen TEXT NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    jurusan TEXT DEFAULT 'PGSD',
    sesi_aktif VARCHAR(50) DEFAULT 'Minggu 1',
    status VARCHAR(20) DEFAULT 'AKTIF', -- 'AKTIF', 'NONAKTIF', 'SELESAI'
    is_primary BOOLEAN DEFAULT FALSE,
    google_drive_folder TEXT DEFAULT 'Arsip Penilaian FKIP ULM - Dokumen',
    spreadsheet_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 🧩 TABEL 2: pgsd_form_configs (Konfigurasi Rubrik & Skema Builder Kustom)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pgsd_form_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id VARCHAR(50) UNIQUE NOT NULL REFERENCES pgsd_forms(form_id) ON DELETE CASCADE ON UPDATE CASCADE,
    app_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    form_schema JSONB NOT NULL DEFAULT '{"tahapan":[]}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 👥 TABEL 3: pgsd_groups (Master Kelompok per Formulir)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pgsd_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id VARCHAR(50) NOT NULL REFERENCES pgsd_forms(form_id) ON DELETE CASCADE ON UPDATE CASCADE,
    group_number INT NOT NULL,
    group_name TEXT NOT NULL,
    topic TEXT,
    drive_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_form_group UNIQUE(form_id, group_number)
);

-- =========================================================================
-- 🎓 TABEL 4: pgsd_students (Roster Mahasiswa per Kelompok & Formulir)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pgsd_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id VARCHAR(50) NOT NULL REFERENCES pgsd_forms(form_id) ON DELETE CASCADE ON UPDATE CASCADE,
    group_id UUID NOT NULL REFERENCES pgsd_groups(id) ON DELETE CASCADE,
    nim VARCHAR(50) NOT NULL,
    nama TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'Anggota', -- 'Ketua', 'Anggota'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_form_student_nim UNIQUE(form_id, nim)
);

-- =========================================================================
-- 📝 TABEL 5: pgsd_responses (Data Transaksi Respons Penilaian Mahasiswa)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pgsd_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_respons VARCHAR(50) UNIQUE NOT NULL,
    form_id VARCHAR(50) NOT NULL REFERENCES pgsd_forms(form_id) ON DELETE CASCADE ON UPDATE CASCADE,
    sesi VARCHAR(50) NOT NULL,
    email TEXT NOT NULL,
    nama_penilai TEXT NOT NULL,
    nim_penilai VARCHAR(50) NOT NULL,
    peran_penilai VARCHAR(50) DEFAULT 'Mahasiswa',
    kelompok_dinilai TEXT NOT NULL,
    nilai_kelompok NUMERIC(5,2) NOT NULL,
    best_presenter_1 TEXT,
    best_presenter_2 TEXT,
    evaluasi_detail JSONB DEFAULT '{}'::jsonb,
    custom_answers JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'VALID',
    synced_to_sheets BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 💾 TABEL 6: pgsd_backups (Riwayat Snapshot Cadangan Sistem)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pgsd_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name TEXT NOT NULL,
    version VARCHAR(20) NOT NULL,
    stats JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ⚡ INDEKS PERFORMA TINGGI (B-TREE OPTIMIZATION)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_slug ON pgsd_forms(form_slug);
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_status ON pgsd_forms(status);
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_primary ON pgsd_forms(is_primary);

CREATE INDEX IF NOT EXISTS idx_pgsd_form_configs_form_id ON pgsd_form_configs(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_groups_form_id ON pgsd_groups(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_students_form_id ON pgsd_students(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_students_nim ON pgsd_students(nim);
CREATE INDEX IF NOT EXISTS idx_pgsd_students_lookup ON pgsd_students(form_id, nim);

CREATE INDEX IF NOT EXISTS idx_pgsd_responses_form_id ON pgsd_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_created_at ON pgsd_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_nim_penilai ON pgsd_responses(nim_penilai);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_kelompok ON pgsd_responses(form_id, kelompok_dinilai);

-- =========================================================================
-- 📊 VIEWS TERINTEGRASI (AGGREGATION FAST-PATH)
-- =========================================================================
CREATE OR REPLACE VIEW pgsd_v_forms_summary AS
SELECT 
    f.id,
    f.form_id,
    COALESCE(f.form_slug, LOWER(f.form_id)) AS form_slug,
    f.judul_form,
    f.mata_kuliah,
    f.dosen,
    f.kelas,
    COALESCE(f.jurusan, 'PGSD') AS jurusan,
    f.sesi_aktif,
    f.status,
    f.is_primary,
    COALESCE(f.google_drive_folder, 'Arsip Penilaian FKIP ULM - Dokumen') AS google_drive_folder,
    f.spreadsheet_url,
    COUNT(DISTINCT g.id) AS total_kelompok,
    COUNT(DISTINCT s.id) AS total_mahasiswa,
    COUNT(DISTINCT r.id) AS total_respons,
    COALESCE(ROUND(AVG(r.nilai_kelompok)::numeric, 1), 0) AS nilai_rata_rata_keseluruhan,
    f.created_at,
    f.updated_at
FROM pgsd_forms f
LEFT JOIN pgsd_groups g ON g.form_id = f.form_id
LEFT JOIN pgsd_students s ON s.form_id = f.form_id
LEFT JOIN pgsd_responses r ON r.form_id = f.form_id
GROUP BY f.id, f.form_id, f.form_slug, f.judul_form, f.mata_kuliah, f.dosen, f.kelas, f.jurusan, f.sesi_aktif, f.status, f.is_primary, f.google_drive_folder, f.spreadsheet_url, f.created_at, f.updated_at;

CREATE OR REPLACE VIEW pgsd_v_rekap_nilai AS
SELECT 
    r.form_id,
    r.kelompok_dinilai AS nama_kelompok,
    COUNT(r.id) AS jumlah_penilai,
    ROUND(AVG(r.nilai_kelompok)::numeric, 2) AS skor_rata_rata,
    MIN(r.nilai_kelompok) AS skor_terendah,
    MAX(r.nilai_kelompok) AS skor_tertinggi,
    MAX(r.created_at) AS waktu_penilaian_terakhir
FROM pgsd_responses r
GROUP BY r.form_id, r.kelompok_dinilai;

-- =========================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE pgsd_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgsd_form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgsd_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgsd_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgsd_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgsd_backups ENABLE ROW LEVEL SECURITY;

-- Grant standard public & anon access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

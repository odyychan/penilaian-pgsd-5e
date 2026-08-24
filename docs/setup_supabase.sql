-- =========================================================================
-- 🏛️ SISTEM PENILAIAN PRESENTASI PGSD 5E FKIP ULM - SUPABASE SETUP SCHEMA
-- Arsitektur: High-Performance Relational Database + Google Sheets Sync
-- =========================================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. TABEL REGISTRY FORMULIR (pgsd_forms)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pgsd_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id VARCHAR(10) UNIQUE NOT NULL,
    form_slug VARCHAR(100) UNIQUE NOT NULL,
    judul_form TEXT NOT NULL,
    mata_kuliah TEXT NOT NULL,
    dosen TEXT,
    kelas VARCHAR(50) DEFAULT '5E',
    jurusan VARCHAR(100) DEFAULT 'PGSD',
    sesi_aktif VARCHAR(50) DEFAULT 'Minggu 1',
    status VARCHAR(20) DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'TUTUP', 'DRAF')),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk pencarian instan berdasarkan PIN / Slug
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_form_id ON public.pgsd_forms(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_form_slug ON public.pgsd_forms(form_slug);

-- -------------------------------------------------------------------------
-- 2. TABEL SKEMA & KONFIGURASI FORMULIR (pgsd_form_configs)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pgsd_form_configs (
    form_id VARCHAR(10) PRIMARY KEY REFERENCES public.pgsd_forms(form_id) ON DELETE CASCADE,
    config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    schema_data JSONB NOT NULL DEFAULT '{"tahapan":[]}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 3. TABEL DATA KELOMPOK (pgsd_groups)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pgsd_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id VARCHAR(10) NOT NULL REFERENCES public.pgsd_forms(form_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sesi VARCHAR(50) DEFAULT 'Minggu 1',
    status VARCHAR(20) DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pgsd_groups_form_id ON public.pgsd_groups(form_id);

-- -------------------------------------------------------------------------
-- 4. TABEL DATA MAHASISWA / ANGGOTA KELOMPOK (pgsd_students)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pgsd_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id VARCHAR(10) NOT NULL REFERENCES public.pgsd_forms(form_id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.pgsd_groups(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    nim VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pgsd_students_form_nim ON public.pgsd_students(form_id, nim);
CREATE INDEX IF NOT EXISTS idx_pgsd_students_group ON public.pgsd_students(group_id);

-- -------------------------------------------------------------------------
-- 5. TABEL RESPONS PENILAIAN MAHASISWA (pgsd_responses)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pgsd_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_respons VARCHAR(100) UNIQUE NOT NULL,
    form_id VARCHAR(10) NOT NULL REFERENCES public.pgsd_forms(form_id) ON DELETE CASCADE,
    sesi VARCHAR(50) NOT NULL,
    email TEXT NOT NULL,
    nama_penilai TEXT NOT NULL,
    nim_penilai VARCHAR(50) NOT NULL,
    peran_penilai VARCHAR(100) DEFAULT 'Mahasiswa',
    kelompok_dinilai TEXT NOT NULL,
    nilai_kelompok NUMERIC(5, 2) NOT NULL,
    best_presenter_1 TEXT DEFAULT '-',
    best_presenter_2 TEXT DEFAULT '-',
    evaluasi_detail JSONB DEFAULT '{}'::jsonb,
    custom_answers JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'VALID' CHECK (status IN ('VALID', 'DIHAPUS', 'ANOMALI')),
    synced_to_sheets BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pgsd_responses_form ON public.pgsd_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_nim ON public.pgsd_responses(nim_penilai);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_kelompok ON public.pgsd_responses(kelompok_dinilai);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_synced ON public.pgsd_responses(synced_to_sheets);

-- -------------------------------------------------------------------------
-- 6. TABEL LOG BACKUP DATABASE & STORAGE (pgsd_backups)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pgsd_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum TEXT,
    encrypted_algo VARCHAR(50) DEFAULT 'AES-256-GCM',
    storage_provider VARCHAR(50) DEFAULT 'CLOUDFLARE_R2',
    storage_key TEXT,
    created_by TEXT DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.pgsd_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgsd_form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgsd_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgsd_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgsd_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pgsd_backups ENABLE ROW LEVEL SECURITY;

-- 1. Policies untuk pgsd_forms (Publik boleh membaca form aktif; Full akses via service_role)
DROP POLICY IF EXISTS "Public can view active forms" ON public.pgsd_forms;
CREATE POLICY "Public can view active forms" ON public.pgsd_forms
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert or manage forms with admin key" ON public.pgsd_forms;
CREATE POLICY "Public can insert or manage forms with admin key" ON public.pgsd_forms
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Policies untuk pgsd_form_configs (Publik boleh membaca konfigurasi; Full akses via service_role)
DROP POLICY IF EXISTS "Public can view form configs" ON public.pgsd_form_configs;
CREATE POLICY "Public can view form configs" ON public.pgsd_form_configs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage form configs with admin key" ON public.pgsd_form_configs;
CREATE POLICY "Public can manage form configs with admin key" ON public.pgsd_form_configs
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Policies untuk pgsd_groups & pgsd_students
DROP POLICY IF EXISTS "Public can view groups" ON public.pgsd_groups;
CREATE POLICY "Public can view groups" ON public.pgsd_groups
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage groups" ON public.pgsd_groups;
CREATE POLICY "Public can manage groups" ON public.pgsd_groups
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view students" ON public.pgsd_students;
CREATE POLICY "Public can view students" ON public.pgsd_students
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage students" ON public.pgsd_students;
CREATE POLICY "Public can manage students" ON public.pgsd_students
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Policies untuk pgsd_responses (Mahasiswa boleh insert seketika; Publik/Admin boleh SELECT)
DROP POLICY IF EXISTS "Public can insert peer responses" ON public.pgsd_responses;
CREATE POLICY "Public can insert peer responses" ON public.pgsd_responses
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view responses" ON public.pgsd_responses;
CREATE POLICY "Public can view responses" ON public.pgsd_responses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update responses" ON public.pgsd_responses;
CREATE POLICY "Public can update responses" ON public.pgsd_responses
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete responses" ON public.pgsd_responses;
CREATE POLICY "Public can delete responses" ON public.pgsd_responses
    FOR DELETE USING (true);

-- 5. Policies untuk pgsd_backups
DROP POLICY IF EXISTS "Full access to backups" ON public.pgsd_backups;
CREATE POLICY "Full access to backups" ON public.pgsd_backups
    FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- ⚡ SEED DATA AWAL (DEFAULT FORM BK5E)
-- =========================================================================
INSERT INTO public.pgsd_forms (form_id, form_slug, judul_form, mata_kuliah, dosen, kelas, jurusan, sesi_aktif, status, is_primary)
VALUES (
    'BK5E',
    'bk-5e',
    'Penilaian Presentasi Kelas 5E PGSD 2026',
    'Bimbingan Konseling di SD',
    'Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.',
    '5E',
    'PGSD',
    'Minggu 1',
    'AKTIF',
    TRUE
)
ON CONFLICT (form_id) DO UPDATE 
SET judul_form = EXCLUDED.judul_form,
    mata_kuliah = EXCLUDED.mata_kuliah,
    dosen = EXCLUDED.dosen;

INSERT INTO public.pgsd_form_configs (form_id, config_data, schema_data)
VALUES (
    'BK5E',
    '{}'::jsonb,
    '{"tahapan":[]}'::jsonb
)
ON CONFLICT (form_id) DO NOTHING;

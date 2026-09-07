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
    form_mode VARCHAR(50) DEFAULT 'PEER_ASSESSMENT', -- 'PEER_ASSESSMENT', 'GENERAL_SURVEY', 'QUIZ', 'EVENT_REGISTRATION'
    google_drive_folder TEXT DEFAULT 'https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK',
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
    sesi VARCHAR(50),
    email TEXT,
    nama_penilai TEXT,
    nim_penilai VARCHAR(50),
    peran_penilai VARCHAR(50) DEFAULT 'Mahasiswa',
    kelompok_dinilai TEXT,
    nilai_kelompok NUMERIC(5,2),
    best_presenter_1 TEXT,
    best_presenter_2 TEXT,
    evaluasi_detail JSONB DEFAULT '{}'::jsonb, -- Mendukung partisi { _partition: { evaluasiRekan: {...}, refleksiMandiri: {...} } }
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
-- 🔐 TABEL 7: pgsd_admin_secrets (Tabel Rahasia & Salted Hash Admin - Service Role Only)
-- =========================================================================
CREATE TABLE IF NOT EXISTS pgsd_admin_secrets (
    key VARCHAR(100) PRIMARY KEY,
    value_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ⚡ INDEKS PERFORMA TINGGI (B-TREE OPTIMIZATION)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_slug ON pgsd_forms(form_slug);
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_status ON pgsd_forms(status);
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_primary ON pgsd_forms(is_primary);
CREATE INDEX IF NOT EXISTS idx_pgsd_forms_upper_form_id ON pgsd_forms (UPPER(form_id));

CREATE INDEX IF NOT EXISTS idx_pgsd_form_configs_form_id ON pgsd_form_configs(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_groups_form_id ON pgsd_groups(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_students_form_id ON pgsd_students(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_students_nim ON pgsd_students(nim);
CREATE INDEX IF NOT EXISTS idx_pgsd_students_lookup ON pgsd_students(form_id, nim);

CREATE INDEX IF NOT EXISTS idx_pgsd_responses_form_id ON pgsd_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_upper_form_id ON pgsd_responses (UPPER(form_id));
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_created_at ON pgsd_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_nim_penilai ON pgsd_responses(nim_penilai);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_kelompok ON pgsd_responses(form_id, kelompok_dinilai);
CREATE INDEX IF NOT EXISTS idx_pgsd_responses_synced ON pgsd_responses (synced_to_sheets);

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
    COALESCE(f.form_mode, 'PEER_ASSESSMENT') AS form_mode,
    COALESCE(f.google_drive_folder, 'https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK') AS google_drive_folder,
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
GROUP BY f.id, f.form_id, f.form_slug, f.judul_form, f.mata_kuliah, f.dosen, f.kelas, f.jurusan, f.sesi_aktif, f.status, f.is_primary, f.form_mode, f.google_drive_folder, f.spreadsheet_url, f.created_at, f.updated_at;

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

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Granular RLS Policies for Form Data and Transactions
DO $$
BEGIN
  -- pgsd_forms
  DROP POLICY IF EXISTS "Public can view forms" ON pgsd_forms;
  DROP POLICY IF EXISTS "Allow manage forms" ON pgsd_forms;
  CREATE POLICY "Public can view forms" ON pgsd_forms FOR SELECT USING (true);
  CREATE POLICY "Allow manage forms" ON pgsd_forms FOR ALL USING (true) WITH CHECK (true);

  -- pgsd_form_configs
  DROP POLICY IF EXISTS "Public can view configs" ON pgsd_form_configs;
  DROP POLICY IF EXISTS "Allow manage configs" ON pgsd_form_configs;
  CREATE POLICY "Public can view configs" ON pgsd_form_configs FOR SELECT USING (true);
  CREATE POLICY "Allow manage configs" ON pgsd_form_configs FOR ALL USING (true) WITH CHECK (true);

  -- pgsd_groups
  DROP POLICY IF EXISTS "Public can view groups" ON pgsd_groups;
  DROP POLICY IF EXISTS "Allow manage groups" ON pgsd_groups;
  CREATE POLICY "Public can view groups" ON pgsd_groups FOR SELECT USING (true);
  CREATE POLICY "Allow manage groups" ON pgsd_groups FOR ALL USING (true) WITH CHECK (true);

  -- pgsd_students
  DROP POLICY IF EXISTS "Public can view students" ON pgsd_students;
  DROP POLICY IF EXISTS "Allow manage students" ON pgsd_students;
  CREATE POLICY "Public can view students" ON pgsd_students FOR SELECT USING (true);
  CREATE POLICY "Allow manage students" ON pgsd_students FOR ALL USING (true) WITH CHECK (true);

  -- pgsd_responses
  DROP POLICY IF EXISTS "Public can view responses" ON pgsd_responses;
  DROP POLICY IF EXISTS "Public can insert responses" ON pgsd_responses;
  DROP POLICY IF EXISTS "Allow manage responses" ON pgsd_responses;
  CREATE POLICY "Public can view responses" ON pgsd_responses FOR SELECT USING (true);
  CREATE POLICY "Public can insert responses" ON pgsd_responses FOR INSERT WITH CHECK (true);
  CREATE POLICY "Allow manage responses" ON pgsd_responses FOR ALL USING (true) WITH CHECK (true);

  -- pgsd_backups
  DROP POLICY IF EXISTS "Allow manage backups" ON pgsd_backups;
  CREATE POLICY "Allow manage backups" ON pgsd_backups FOR ALL USING (true) WITH CHECK (true);
END
$$;

-- ============================================================================
-- 8. ATOMIC STORED PROCEDURE: CONCURRENCY, QUOTA CAP & SCHEDULE GUARD
-- ============================================================================
CREATE OR REPLACE FUNCTION pgsd_fn_submit_response_with_quota(
  p_id_respons TEXT,
  p_form_id TEXT,
  p_sesi TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_nama_penilai TEXT DEFAULT NULL,
  p_nim_penilai TEXT DEFAULT NULL,
  p_peran_penilai TEXT DEFAULT NULL,
  p_kelompok_dinilai TEXT DEFAULT NULL,
  p_nilai_kelompok NUMERIC DEFAULT NULL,
  p_best_presenter_1 TEXT DEFAULT NULL,
  p_best_presenter_2 TEXT DEFAULT NULL,
  p_evaluasi_detail JSONB DEFAULT '{}'::jsonb,
  p_custom_answers JSONB DEFAULT '{}'::jsonb,
  p_synced_to_sheets BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_form RECORD;
  v_cfg RECORD;
  v_current_count INT;
  v_max_responses INT := 0;
  v_schedule_active BOOLEAN := FALSE;
  v_start_time TIMESTAMPTZ := NULL;
  v_end_time TIMESTAMPTZ := NULL;
  v_limit_one BOOLEAN := FALSE;
  v_existing_id TEXT := NULL;
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  -- 1. Acquire exclusive row lock on the form to serialize concurrent submissions
  SELECT * INTO v_form
  FROM pgsd_forms
  WHERE form_id = p_form_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'FORM_NOT_FOUND',
      'message', 'Formulir tidak ditemukan.'
    );
  END IF;

  -- 2. Check if form is inactive
  IF v_form.status = 'INACTIVE' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'FORM_INACTIVE',
      'message', 'Formulir sedang dinonaktifkan oleh administrator.'
    );
  END IF;

  -- 3. Read config_data from pgsd_form_configs
  SELECT config_data INTO v_cfg
  FROM pgsd_form_configs
  WHERE form_id = p_form_id;

  IF v_cfg.config_data IS NOT NULL THEN
    v_schedule_active := COALESCE((v_cfg.config_data->>'Jadwal_Aktif')::boolean, FALSE);
    
    IF v_schedule_active THEN
      -- Parse start time if present
      IF (v_cfg.config_data->>'Jadwal_Mulai') IS NOT NULL AND (v_cfg.config_data->>'Jadwal_Mulai') <> '' THEN
        BEGIN
          v_start_time := (v_cfg.config_data->>'Jadwal_Mulai')::timestamptz;
        EXCEPTION WHEN OTHERS THEN
          v_start_time := NULL;
        END;
      END IF;

      -- Parse end time if present
      IF (v_cfg.config_data->>'Jadwal_Selesai') IS NOT NULL AND (v_cfg.config_data->>'Jadwal_Selesai') <> '' THEN
        BEGIN
          v_end_time := (v_cfg.config_data->>'Jadwal_Selesai')::timestamptz;
        EXCEPTION WHEN OTHERS THEN
          v_end_time := NULL;
        END;
      END IF;

      -- Check schedule window
      IF v_start_time IS NOT NULL AND v_now < v_start_time THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'FORM_NOT_OPEN_YET',
          'message', COALESCE(v_cfg.config_data->>'Pesan_Form_Belum_Buka', 'Formulir belum dibuka.'),
          'start_time', v_start_time
        );
      END IF;

      IF v_end_time IS NOT NULL AND v_now > v_end_time THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'FORM_CLOSED',
          'message', COALESCE(v_cfg.config_data->>'Pesan_Form_Ditutup', 'Batas waktu pengisian telah berakhir.'),
          'end_time', v_end_time
        );
      END IF;

      -- Max quota
      IF (v_cfg.config_data->>'Batas_Maksimal_Respons') IS NOT NULL THEN
        BEGIN
          v_max_responses := COALESCE((v_cfg.config_data->>'Batas_Maksimal_Respons')::int, 0);
        EXCEPTION WHEN OTHERS THEN
          v_max_responses := 0;
        END;
      END IF;
    END IF;

    -- Single response limit check
    v_limit_one := COALESCE((v_cfg.config_data->>'Kunci_Respons_Ganda')::boolean, FALSE);
    IF v_limit_one THEN
      IF p_email IS NOT NULL AND p_email <> '' AND p_email <> '-' THEN
        SELECT id_respons INTO v_existing_id
        FROM pgsd_responses
        WHERE form_id = p_form_id AND LOWER(TRIM(email)) = LOWER(TRIM(p_email))
        LIMIT 1;
      ELSIF p_nim_penilai IS NOT NULL AND p_nim_penilai <> '' AND p_nim_penilai <> '-' THEN
        SELECT id_respons INTO v_existing_id
        FROM pgsd_responses
        WHERE form_id = p_form_id AND TRIM(nim_penilai) = TRIM(p_nim_penilai)
        LIMIT 1;
      END IF;

      IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'ALREADY_SUBMITTED',
          'message', 'Anda sudah pernah mengirimkan respons untuk formulir ini.'
        );
      END IF;
    END IF;
  END IF;

  -- 4. Check quota cap with row lock held
  IF v_max_responses > 0 THEN
    SELECT COUNT(*) INTO v_current_count
    FROM pgsd_responses
    WHERE form_id = p_form_id;

    IF v_current_count >= v_max_responses THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'QUOTA_EXCEEDED',
        'message', COALESCE(v_cfg.config_data->>'Pesan_Form_Ditutup', 'Mohon maaf, kuota pengisian formulir telah penuh.'),
        'current_count', v_current_count,
        'max_quota', v_max_responses
      );
    END IF;
  END IF;

  -- 5. Insert atomically
  INSERT INTO pgsd_responses (
    id_respons,
    form_id,
    sesi,
    email,
    nama_penilai,
    nim_penilai,
    peran_penilai,
    kelompok_dinilai,
    nilai_kelompok,
    best_presenter_1,
    best_presenter_2,
    evaluasi_detail,
    custom_answers,
    synced_to_sheets
  ) VALUES (
    p_id_respons,
    p_form_id,
    p_sesi,
    p_email,
    p_nama_penilai,
    p_nim_penilai,
    p_peran_penilai,
    p_kelompok_dinilai,
    p_nilai_kelompok,
    p_best_presenter_1,
    p_best_presenter_2,
    p_evaluasi_detail,
    p_custom_answers,
    p_synced_to_sheets
  );

  -- Get updated count
  SELECT COUNT(*) INTO v_current_count
  FROM pgsd_responses
  WHERE form_id = p_form_id;

  RETURN jsonb_build_object(
    'success', true,
    'id_respons', p_id_respons,
    'current_count', v_current_count,
    'max_quota', v_max_responses
  );
END;
$$;

GRANT EXECUTE ON FUNCTION pgsd_fn_submit_response_with_quota TO anon, authenticated, service_role;


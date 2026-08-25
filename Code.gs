/**
 * ==============================================================================
 * BACKEND REST API - SISTEM MULTI-FORM & PENILAIAN PRESENTASI PGSD (ULTRA FAST)
 * Spreadsheet ID: 1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4
 * Google Drive Folder ID: 1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK
 * Multi-Form Engine, Dynamic Form Builder, Google Drive Uploader & Isolated Sandboxes
 * ==============================================================================
 */

// ==============================================================================
// ⚙️ KONFIGURASI SPREADSHEET & GOOGLE DRIVE DEFAULT
// ==============================================================================
const SPREADSHEET_ID = "1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4";
const DEFAULT_DRIVE_FOLDER_ID = "1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK";

// Nama Sheet Registry Pusat
const SHEET_REGISTRY = "Registry_Forms";

// Nama Tab Spreadsheet Default (Formulir Utama / Default ID: BK5E)
const DEFAULT_FORM_ID = "BK5E";
const DEFAULT_FORM_SLUG = "bk-5e";
const SHEET_CONFIG = "Konfigurasi";
const SHEET_MASTER = "Master_Kelompok";
const SHEET_RESPONS = "Respons_Penilaian";
const SHEET_REKAP = "Rekap_Nilai";

let _memoizedSpreadsheet = null;
let _memoizedSheets = {};

/**
 * Mendapatkan Objek Spreadsheet Aktif (Memoized per request)
 */
function getSpreadsheet() {
  if (_memoizedSpreadsheet) return _memoizedSpreadsheet;
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
      try {
        ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
      } catch (e) {
        throw new Error("Gagal membuka spreadsheet dengan ID '" + SPREADSHEET_ID + "'.");
      }
    } else {
      throw new Error("ID Spreadsheet belum diisi pada variabel SPREADSHEET_ID di Kode.gs.");
    }
  }
  _memoizedSpreadsheet = ss;
  return ss;
}

/**
 * Helper Pencarian Sheet Fleksibel (Memoized per request)
 */
function findSheetFlexible(ss, targetNames) {
  if (!ss) ss = getSpreadsheet();
  const cacheKey = targetNames.join("_");
  if (_memoizedSheets[cacheKey]) return _memoizedSheets[cacheKey];

  const allSheets = ss.getSheets();
  for (let target of targetNames) {
    const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (let s of allSheets) {
      const sName = s.getName().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (sName === cleanTarget) {
        _memoizedSheets[cacheKey] = s;
        return s;
      }
    }
  }
  return null;
}

/**
 * ==============================================================================
 * ️ MULTI-FORM REGISTRY & ISOLATED SHEET RESOLVER
 * ==============================================================================
 */

/**
 * Inisialisasi Sheet Registry Formulir Pusat
 */
function getRegistrySheet(ss) {
  if (!ss) ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_REGISTRY);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_REGISTRY);
    const headers = [
      "Form_ID",
      "Form_Slug",
      "Judul_Form",
      "Mata_Kuliah",
      "Dosen_Pengampu",
      "Kelas",
      "Jurusan",
      "Sesi_Aktif",
      "Status",
      "Custom_Fields_JSON",
      "Master_Sheet_Name",
      "Respons_Sheet_Name",
      "Config_Sheet_Name",
      "Rekap_Sheet_Name",
      "Created_At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRange(sheet.getRange(1, 1, 1, headers.length), "#4338CA", "#FFFFFF");

    // Seed formulir default (BK5E) menggunakan sheet yang sudah ada
    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss");
    const defaultRow = [
      DEFAULT_FORM_ID,
      DEFAULT_FORM_SLUG,
      "PENILAIAN PRESENTASI KELAS 5E PGSD 2026",
      "Bimbingan Konseling di SD",
      "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.",
      "5E",
      "PGSD",
      "Minggu 1",
      "AKTIF",
      "[]",
      SHEET_MASTER,
      SHEET_RESPONS,
      SHEET_CONFIG,
      SHEET_REKAP,
      nowStr
    ];
    sheet.getRange(2, 1, 1, defaultRow.length).setValues([defaultRow]);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

/**
 * Generate Short ID Unik (4-5 Karakter Alfanumerik)
 */
function generateShortFormId(ss) {
  if (!ss) ss = getSpreadsheet();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Tanpa karakter ambigu (0, O, 1, I)
  const regSheet = getRegistrySheet(ss);
  const existingData = regSheet.getDataRange().getValues();
  const existingIds = new Set();
  for (let i = 1; i < existingData.length; i++) {
    const id = String(existingData[i][0] || "").trim().toUpperCase();
    if (id) existingIds.add(id);
  }

  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    const len = attempt > 50 ? 5 : 4; // 4 karakter pertama, 5 jika bentrok
    for (let i = 0; i < len; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!existingIds.has(code)) {
      return code;
    }
  }
  return "F" + Math.floor(1000 + Math.random() * 9000);
}

/**
 * Generate Clean URL Slug
 */
function generateFormSlug(title, formId) {
  if (!title) return (formId || "form").toLowerCase();
  let slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 35);
  return slug || (formId || "form").toLowerCase();
}

/**
 * Mendapatkan Metadata Formulir berdasarkan ID atau Slug
 */
function getFormMeta(ss, formIdOrSlug) {
  if (!ss) ss = getSpreadsheet();
  const regSheet = getRegistrySheet(ss);
  const data = regSheet.getDataRange().getValues();

  const search = String(formIdOrSlug || "").trim().toLowerCase();

  // Jika tanpa parameter atau "default", kembalikan form default / baris pertama
  if (!search || search === "default" || search === "main") {
    if (data.length > 1) {
      return parseFormMetaRow(data[1]);
    }
  }

  // Cari berdasarkan Form_ID atau Form_Slug
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowId = String(row[0] || "").trim().toLowerCase();
    const rowSlug = String(row[1] || "").trim().toLowerCase();
    if (rowId === search || rowSlug === search) {
      return parseFormMetaRow(row);
    }
  }

  // Fallback ke form default jika tidak ditemukan
  if (data.length > 1) {
    return parseFormMetaRow(data[1]);
  }

  // Fallback darurat
  return {
    formId: DEFAULT_FORM_ID,
    formSlug: DEFAULT_FORM_SLUG,
    judulForm: "Penilaian Presentasi PGSD 5E",
    mataKuliah: "Bimbingan Konseling di SD",
    dosen: "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.",
    kelas: "5E",
    jurusan: "PGSD",
    sesiAktif: "Minggu 1",
    status: "AKTIF",
    customFields: [],
    masterSheetName: SHEET_MASTER,
    responsSheetName: SHEET_RESPONS,
    configSheetName: SHEET_CONFIG,
    rekapSheetName: SHEET_REKAP,
    createdAt: new Date().toISOString()
  };
}

function parseFormMetaRow(row) {
  let customFields = [];
  try {
    const jsonStr = String(row[9] || "[]").trim();
    if (jsonStr) customFields = JSON.parse(jsonStr);
  } catch (e) {
    customFields = [];
  }

  return {
    formId: String(row[0] || DEFAULT_FORM_ID).trim().toUpperCase(),
    formSlug: String(row[1] || DEFAULT_FORM_SLUG).trim().toLowerCase(),
    judulForm: String(row[2] || "").trim(),
    mataKuliah: String(row[3] || "").trim(),
    dosen: String(row[4] || "").trim(),
    kelas: String(row[5] || "").trim(),
    jurusan: String(row[6] || "").trim(),
    sesiAktif: String(row[7] || "Minggu 1").trim(),
    status: String(row[8] || "AKTIF").trim().toUpperCase(),
    customFields: Array.isArray(customFields) ? customFields : [],
    masterSheetName: String(row[10] || SHEET_MASTER).trim(),
    responsSheetName: String(row[11] || SHEET_RESPONS).trim(),
    configSheetName: String(row[12] || SHEET_CONFIG).trim(),
    rekapSheetName: String(row[13] || SHEET_REKAP).trim(),
    createdAt: String(row[14] || "").trim()
  };
}

/**
 * Helper Sheet Resolvers Berdasarkan Form ID (Isolasi Total)
 */
function getMasterSheet(ss, formId) {
  if (!ss) ss = getSpreadsheet();
  const meta = getFormMeta(ss, formId);
  let s = ss.getSheetByName(meta.masterSheetName);
  if (!s) {
    s = findSheetFlexible(ss, [meta.masterSheetName, "Master_Kelompok", "Master Kelompok"]);
    if (!s) {
      s = ss.insertSheet(meta.masterSheetName);
      const masterHeaders = [["Kelompok", "Sesi_Minggu", "NIM", "Nama_Lengkap", "Status_Aktif"]];
      s.getRange(1, 1, 1, 5).setValues(masterHeaders);
      formatHeaderRange(s.getRange(1, 1, 1, 5), "#047857", "#FFFFFF");
      s.autoResizeColumns(1, 5);
    }
  }
  return s;
}

function getConfigSheet(ss, formId) {
  if (!ss) ss = getSpreadsheet();
  const meta = getFormMeta(ss, formId);
  let s = ss.getSheetByName(meta.configSheetName);
  if (!s) {
    s = findSheetFlexible(ss, [meta.configSheetName, "Konfigurasi", "Config"]);
    if (!s) {
      s = ss.insertSheet(meta.configSheetName);
      const configData = [
        ["PARAMETER", "NILAI_PENGATURAN", "KETERANGAN"],
        ["Judul_Form", meta.judulForm || "Penilaian Presentasi", "Judul formulir"],
        ["Mata_Kuliah", meta.mataKuliah || "Mata Kuliah", "Nama mata kuliah"],
        ["Dosen_Pengampu", meta.dosen || "", "Nama dosen pengampu"],
        ["Kelas", meta.kelas || "5E", "Kelas mahasiswa"],
        ["Jurusan", meta.jurusan || "PGSD", "Jurusan / Program Studi"],
        ["Sesi_Minggu_Aktif", meta.sesiAktif || "Minggu 1", "Sesi pertemuan aktif"],
        ["Domain_Email_Wajib", "mhs.ulm.ac.id, ulm.ac.id", "Domain email yang diizinkan"],
        ["Tampilkan_Ulasan_Publik", "AKTIF", "Pilihan: AKTIF atau NONAKTIF"],
        ["Nilai_Kelompok_Min", "50", "Batas nilai minimum presentasi"],
        ["Nilai_Kelompok_Max", "100", "Batas nilai maksimum presentasi"],
        ["Maksimal_Karakter_Evaluasi", "500", "Batas karakter per ulasan pemateri"],
        ["Maksimal_Pilihan_Presentator_Terbaik", "2", "Maksimal pemateri terbaik yang boleh dipilih"],
        ["Kewajiban_Menilai_Penyaji", "BEBAS_PENUH_DI_SESINYA", "Aturan kewajiban menilai bagi penyaji"]
      ];
      s.getRange(1, 1, configData.length, 3).setValues(configData);
      formatHeaderRange(s.getRange(1, 1, 1, 3), "#1E3A8A", "#FFFFFF");
      s.autoResizeColumns(1, 3);
    }
  }
  return s;
}

function getResponsSheet(ss, formId) {
  if (!ss) ss = getSpreadsheet();
  const meta = getFormMeta(ss, formId);
  let s = ss.getSheetByName(meta.responsSheetName);
  if (!s) {
    s = findSheetFlexible(ss, [meta.responsSheetName, "Respons_Penilaian", "Responses"]);
    if (!s) {
      s = ss.insertSheet(meta.responsSheetName);
      const responsHeaders = [[
        "ID_Respons",
        "Timestamp",
        "Sesi_Minggu",
        "Email_Penilai",
        "Nama_Penilai",
        "Kelompok_Dinilai",
        "Nilai_Kelompok",
        "Presentator_Terbaik_1",
        "Presentator_Terbaik_2",
        "Evaluasi_Detail_JSON",
        "Status",
        "Peran",
        "NIM_Penilai",
        "Custom_Answers_JSON"
      ]];
      s.getRange(1, 1, 1, responsHeaders[0].length).setValues(responsHeaders);
      formatHeaderRange(s.getRange(1, 1, 1, responsHeaders[0].length), "#B91C1C", "#FFFFFF");
      s.autoResizeColumns(1, responsHeaders[0].length);
    }
  }
  return s;
}

function getRekapSheet(ss, formId) {
  if (!ss) ss = getSpreadsheet();
  const meta = getFormMeta(ss, formId);
  let s = ss.getSheetByName(meta.rekapSheetName);
  if (!s) {
    s = findSheetFlexible(ss, [meta.rekapSheetName, "Rekap_Nilai", "Rekapitulasi"]);
    if (!s) {
      s = ss.insertSheet(meta.rekapSheetName);
      const rekapHeaders = [["Kelompok", "Sesi_Minggu", "Jumlah_Penilai", "Rata_Rata_Nilai", "Presentator_Terbaik_Terbanyak"]];
      s.getRange(1, 1, 1, 5).setValues(rekapHeaders);
      formatHeaderRange(s.getRange(1, 1, 1, 5), "#1E40AF", "#FFFFFF");
      s.autoResizeColumns(1, 5);
    }
  }
  return s;
}

/**
 * ==============================================================================
 *  REST API ENDPOINTS (GET & POST) DENGAN CACHE ACCELERATION
 * ==============================================================================
 */

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || "";
  const formId = params.formId || params.form || params.id || "";
  const isNoCache = !e || !e.parameter || params.nocache === "1" || params._t;

  // 1. Endpoint Ambil Registry Seluruh Formulir (Master Hub)
  if (action === "adminGetFormsRegistry") {
    const data = adminGetFormsRegistry();
    return createJsonResponse(data);
  }

  // 2. Endpoint Ambil Data Awal Form (Sisi Mahasiswa)
  if (action === "getInitialData") {
    const data = getCachedInitialData(isNoCache, formId);
    return createJsonResponse(data);
  }

  // 3. Endpoint Ambil Data Rekapitulasi Nilai
  if (action === "getRecapData") {
    const data = getCachedRecapData(isNoCache, formId);
    return createJsonResponse(data);
  }

  // 4. Endpoint Admin: Ambil Semua Data Master & Config per Form
  if (action === "adminGetFullData") {
    const data = adminGetFullData(formId);
    return createJsonResponse(data);
  }

  // 5. Endpoint Admin: Ambil Seluruh Daftar Respons Penilaian per Form
  if (action === "adminGetResponsesList") {
    const data = adminGetResponsesList(formId);
    return createJsonResponse(data);
  }

  // Fallback Info
  return createJsonResponse({
    status: "API Online",
    spreadsheetId: SPREADSHEET_ID,
    message: "REST API Multi-Form & Dynamic Form Builder Aktif."
  });
}

/**
 * Handle HTTP POST Requests dari Frontend
 */
function doPost(e) {
  try {
    let payload = {};

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || "submitAssessment";
    const formId = payload.formId || payload.form || payload.id || "";
    let result = { success: false, error: "Aksi tidak dikenali." };

    // Multi-Form Registry Controllers
    if (action === "adminGetFormsRegistry") {
      result = adminGetFormsRegistry();
    } else if (action === "adminCreateForm") {
      result = adminCreateForm(payload);
    } else if (action === "adminUpdateFormMeta") {
      result = adminUpdateFormMeta(payload);
    } else if (action === "adminCloneForm") {
      result = adminCloneForm(payload);
    } else if (action === "adminDeleteForm") {
      result = adminDeleteForm(payload);
    } else if (action === "adminSyncAllForms") {
      result = adminSyncAllForms(payload);
    }

    // Form Sandbox Operations (Per-Form Scoped)
    else if (action === "uploadSingleFile" || action === "adminUploadMedia") {
      result = handleDirectFileUpload(payload);
    } else if (action === "deleteDriveFile" || action === "adminDeleteMedia") {
      result = deleteDriveFile(payload);
    } else if (action === "submitAssessment") {
      result = submitAssessment(payload);
    } else if (action === "getInitialData") {
      result = getCachedInitialData(true, formId);
    } else if (action === "getRecapData") {
      result = getCachedRecapData(true, formId);
    } else if (action === "adminGetFullData") {
      result = adminGetFullData(formId);
    } else if (action === "adminGetResponsesList") {
      result = adminGetResponsesList(formId);
    } else if (action === "adminSaveMasterData") {
      result = adminSaveMasterData(payload);
    } else if (action === "adminSaveConfig") {
      result = adminSaveConfig(payload);
    } else if (action === "adminDeleteSingleResponse") {
      result = adminDeleteSingleResponse(payload);
    } else if (action === "adminDeleteScopedResponses") {
      result = adminDeleteScopedResponses(payload);
    } else if (action === "adminResetResponses") {
      result = adminResetResponses(payload);
    }

    return createJsonResponse(result);

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "Terjadi kesalahan server: " + err.toString()
    });
  }
}

/**
 * Helper Membuat JSON Output dengan CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reset Cache saat Ada Perubahan Data
 */
function clearApiCache(formId) {
  try {
    const cache = CacheService.getScriptCache();
    const cleanId = (formId || DEFAULT_FORM_ID).trim().toUpperCase();
    cache.remove("INIT_FORM_DATA_" + cleanId);
    cache.remove("REKAP_DATA_CACHE_" + cleanId);
    cache.remove("INIT_FORM_DATA_V4");
    cache.remove("REKAP_DATA_CACHE_V4");
    cache.remove("REGISTRY_FORMS_LIST");
  } catch (e) {}
}

/**
 * Ambil Data Awal dengan Cache Cerdas
 */
function getCachedInitialData(bypassCache, formId) {
  const cleanId = (formId || DEFAULT_FORM_ID).trim().toUpperCase();
  if (!bypassCache) {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("INIT_FORM_DATA_" + cleanId);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
  }

  const liveData = getFormInitialData(formId);
  if (liveData && liveData.success) {
    try {
      const cache = CacheService.getScriptCache();
      cache.put("INIT_FORM_DATA_" + cleanId, JSON.stringify(liveData), 20);
    } catch (e) {}
  }
  return liveData;
}

/**
 * Ambil Data Rekapitulasi dengan Cache Cerdas
 */
function getCachedRecapData(bypassCache, formId) {
  const cleanId = (formId || DEFAULT_FORM_ID).trim().toUpperCase();
  if (!bypassCache) {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("REKAP_DATA_CACHE_" + cleanId);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
  }

  const liveData = getRecapData(formId);
  if (liveData && liveData.success) {
    try {
      const cache = CacheService.getScriptCache();
      cache.put("REKAP_DATA_CACHE_" + cleanId, JSON.stringify(liveData), 20);
    } catch (e) {}
  }
  return liveData;
}

/**
 * Mengambil Data Konfigurasi Spreadsheet
 */
function getConfigMap(ss, formId) {
  if (!ss) ss = getSpreadsheet();
  let sheet = getConfigSheet(ss, formId);
  
  const data = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0] || "").trim();
    const val = String(data[i][1] || "").trim();
    if (key) {
      config[key] = val;
    }
  }
  return config;
}

/**
 * ==============================================================================
 * ️ CONTROLLER: MASTER FORM REGISTRY
 * ==============================================================================
 */

/**
 * Mengambil Daftar Seluruh Formulir di Registry
 */
function adminGetFormsRegistry() {
  try {
    const ss = getSpreadsheet();
    const regSheet = getRegistrySheet(ss);
    const data = regSheet.getDataRange().getValues();
    const forms = [];

    // Batch map all sheets once to avoid slow repetitive RPC calls
    const allSheets = ss.getSheets();
    const sheetRowMap = {};
    allSheets.forEach(s => {
      sheetRowMap[s.getName()] = s.getLastRow();
    });

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const formId = String(row[0] || "").trim();
      if (!formId) continue;

      const meta = parseFormMetaRow(row);
      const lastRow = sheetRowMap[meta.responsSheetName] || 0;
      const totalResponses = lastRow > 1 ? lastRow - 1 : 0;

      forms.push({
        ...meta,
        totalResponses: totalResponses
      });
    }

    return {
      success: true,
      forms: forms
    };
  } catch (err) {
    return { success: false, error: "Gagal memuat registry formulir: " + err.toString() };
  }
}

/**
 * Membuat Formulir Baru dengan Short ID 4-5 Karakter & Sheet Terisolasi
 */
function adminCreateForm(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);

    const ss = getSpreadsheet();
    const regSheet = getRegistrySheet(ss);

    const judulForm = String(payload.judulForm || "Penilaian Presentasi Baru").trim();
    const mataKuliah = String(payload.mataKuliah || "").trim();
    const dosen = String(payload.dosen || "").trim();
    const kelas = String(payload.kelas || "").trim();
    const jurusan = String(payload.jurusan || "PGSD").trim();
    const sesiAktif = String(payload.sesiAktif || "Minggu 1").trim();

    // Generate Short ID 4-5 Karakter Unik (atau gunakan custom jika diinput)
    let formId = String(payload.customFormId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!formId || formId.length < 3 || formId.length > 6) {
      formId = generateShortFormId(ss);
    }

    // Generate Slug Unik
    let formSlug = String(payload.customSlug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!formSlug) {
      formSlug = generateFormSlug(mataKuliah || judulForm, formId);
    }

    const masterSheetName = "Master_" + formId;
    const configSheetName = "Config_" + formId;
    const responsSheetName = "Respons_" + formId;
    const rekapSheetName = "Rekap_" + formId;
    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss");

    // 1. Buat Sheet Master Terisolasi
    let sMaster = ss.insertSheet(masterSheetName);
    const masterHeaders = [["Kelompok", "Sesi_Minggu", "NIM", "Nama_Lengkap", "Status_Aktif"]];
    sMaster.getRange(1, 1, 1, 5).setValues(masterHeaders);
    formatHeaderRange(sMaster.getRange(1, 1, 1, 5), "#047857", "#FFFFFF");
    sMaster.autoResizeColumns(1, 5);

    // 2. Buat Sheet Config Terisolasi
    let sConfig = ss.insertSheet(configSheetName);
    const configData = [
      ["PARAMETER", "NILAI_PENGATURAN", "KETERANGAN"],
      ["Judul_Form", judulForm, "Judul utama pada formulir"],
      ["Mata_Kuliah", mataKuliah, "Nama mata kuliah"],
      ["Dosen_Pengampu", dosen, "Nama dosen pengampu"],
      ["Kelas", kelas, "Kelas mahasiswa"],
      ["Jurusan", jurusan, "Jurusan / Program Studi"],
      ["Sesi_Minggu_Aktif", sesiAktif, "Sesi pertemuan saat ini"],
      ["Domain_Email_Wajib", "mhs.ulm.ac.id, ulm.ac.id", "Domain email yang diizinkan"],
      ["Tampilkan_Ulasan_Publik", "AKTIF", "Pilihan: AKTIF atau NONAKTIF"],
      ["Nilai_Kelompok_Min", "50", "Batas nilai minimum presentasi"],
      ["Nilai_Kelompok_Max", "100", "Batas nilai maksimum presentasi"],
      ["Maksimal_Karakter_Evaluasi", "500", "Batas karakter per ulasan pemateri"],
      ["Maksimal_Pilihan_Presentator_Terbaik", "2", "Maksimal pemateri terbaik yang boleh dipilih"],
      ["Kewajiban_Menilai_Penyaji", "BEBAS_PENUH_DI_SESINYA", "Aturan kewajiban menilai bagi penyaji"]
    ];
    sConfig.getRange(1, 1, configData.length, 3).setValues(configData);
    formatHeaderRange(sConfig.getRange(1, 1, 1, 3), "#1E3A8A", "#FFFFFF");
    sConfig.autoResizeColumns(1, 3);

    // 3. Buat Sheet Respons Terisolasi
    let sRespons = ss.insertSheet(responsSheetName);
    const responsHeaders = [[
      "ID_Respons",
      "Timestamp",
      "Sesi_Minggu",
      "Email_Penilai",
      "Nama_Penilai",
      "Kelompok_Dinilai",
      "Nilai_Kelompok",
      "Presentator_Terbaik_1",
      "Presentator_Terbaik_2",
      "Evaluasi_Detail_JSON",
      "Status",
      "Peran",
      "NIM_Penilai",
      "Custom_Answers_JSON"
    ]];
    sRespons.getRange(1, 1, 1, responsHeaders[0].length).setValues(responsHeaders);
    formatHeaderRange(sRespons.getRange(1, 1, 1, responsHeaders[0].length), "#B91C1C", "#FFFFFF");
    sRespons.autoResizeColumns(1, responsHeaders[0].length);

    // 4. Buat Sheet Rekap Terisolasi
    let sRekap = ss.insertSheet(rekapSheetName);
    const rekapHeaders = [["Kelompok", "Sesi_Minggu", "Jumlah_Penilai", "Rata_Rata_Nilai", "Presentator_Terbaik_Terbanyak"]];
    sRekap.getRange(1, 1, 1, 5).setValues(rekapHeaders);
    formatHeaderRange(sRekap.getRange(1, 1, 1, 5), "#1E40AF", "#FFFFFF");
    sRekap.autoResizeColumns(1, 5);

    // 5. Simpan ke Registry Forms
    const newRow = [
      formId,
      formSlug,
      judulForm,
      mataKuliah,
      dosen,
      kelas,
      jurusan,
      sesiAktif,
      "AKTIF",
      "[]",
      masterSheetName,
      responsSheetName,
      configSheetName,
      rekapSheetName,
      nowStr
    ];
    regSheet.appendRow(newRow);

    // 6. Inisialisasi Subfolder Google Drive Otomatis
    let driveFolderUrl = "";
    try {
      const parentFolder = getOrCreateDriveFolder(DEFAULT_DRIVE_FOLDER_ID);
      const formFolder = getOrCreateDriveSubfolder(parentFolder, formId);
      getOrCreateDriveSubfolder(formFolder, "Media_Formulir");
      getOrCreateDriveSubfolder(formFolder, "Lampiran_Mahasiswa");
      driveFolderUrl = formFolder.getUrl();
    } catch (dErr) {
      Logger.log("Drive folder creation notice: " + dErr.toString());
    }

    lock.releaseLock();
    clearApiCache();

    return {
      success: true,
      formId: formId,
      formSlug: formSlug,
      driveFolderUrl: driveFolderUrl,
      message: `Formulir '${judulForm}' berhasil dibuat dengan Kode ID: ${formId}!`
    };
  } catch (err) {
    return { success: false, error: "Gagal membuat formulir baru: " + err.toString() };
  }
}

/**
 * Sinkronisasi Massal Seluruh Formulir ke Google Spreadsheet & Google Drive
 */
function adminSyncAllForms(payload) {
  try {
    const forms = Array.isArray(payload && payload.forms) ? payload.forms : [];
    if (!forms || forms.length === 0) {
      return { success: false, error: "Daftar formulir kosong." };
    }

    const ss = getSpreadsheet();
    const regSheet = getRegistrySheet(ss);
    const parentFolder = getOrCreateDriveFolder(DEFAULT_DRIVE_FOLDER_ID);

    const syncedResults = [];

    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      const formId = String(f.form_id || f.id || "").trim().toUpperCase();
      if (!formId) continue;

      const judulForm = String(f.judul_form || f.judul || "Penilaian Perkuliahan").trim();
      const mataKuliah = String(f.mata_kuliah || "").trim();
      const dosen = String(f.dosen || "").trim();
      const kelas = String(f.kelas || "").trim();
      const jurusan = String(f.jurusan || "PGSD").trim();
      const sesiAktif = String(f.sesi_aktif || "Minggu 1").trim();
      const status = String(f.status || "AKTIF").trim().toUpperCase();
      const formSlug = String(f.form_slug || formId.toLowerCase()).trim();

      const masterSheetName = "Master_" + formId;
      const configSheetName = "Config_" + formId;
      const responsSheetName = "Respons_" + formId;
      const rekapSheetName = "Rekap_" + formId;

      // 1. Pastikan Sheets ada di Spreadsheet
      if (!ss.getSheetByName(masterSheetName)) {
        const sMaster = ss.insertSheet(masterSheetName);
        sMaster.getRange(1, 1, 1, 5).setValues([["Kelompok", "Sesi_Minggu", "NIM", "Nama_Lengkap", "Status_Aktif"]]);
        formatHeaderRange(sMaster.getRange(1, 1, 1, 5), "#047857", "#FFFFFF");
        sMaster.autoResizeColumns(1, 5);
      }
      if (!ss.getSheetByName(configSheetName)) {
        const sConfig = ss.insertSheet(configSheetName);
        const configData = [
          ["PARAMETER", "NILAI_PENGATURAN", "KETERANGAN"],
          ["Judul_Form", judulForm, "Judul utama pada formulir"],
          ["Mata_Kuliah", mataKuliah, "Nama mata kuliah"],
          ["Dosen_Pengampu", dosen, "Nama dosen pengampu"],
          ["Kelas", kelas, "Kelas mahasiswa"],
          ["Jurusan", jurusan, "Jurusan / Program Studi"],
          ["Sesi_Minggu_Aktif", sesiAktif, "Sesi pertemuan saat ini"],
          ["Domain_Email_Wajib", "mhs.ulm.ac.id, ulm.ac.id", "Domain email yang diizinkan"],
          ["Tampilkan_Ulasan_Publik", "AKTIF", "Pilihan: AKTIF atau NONAKTIF"],
          ["Nilai_Kelompok_Min", "50", "Batas nilai minimum presentasi"],
          ["Nilai_Kelompok_Max", "100", "Batas nilai maksimum presentasi"]
        ];
        sConfig.getRange(1, 1, configData.length, 3).setValues(configData);
        formatHeaderRange(sConfig.getRange(1, 1, 1, 3), "#1E3A8A", "#FFFFFF");
        sConfig.autoResizeColumns(1, 3);
      }
      if (!ss.getSheetByName(responsSheetName)) {
        const sRespons = ss.insertSheet(responsSheetName);
        const responsHeaders = [["ID_Respons", "Timestamp", "Sesi_Minggu", "Email_Penilai", "Nama_Penilai", "Kelompok_Dinilai", "Nilai_Kelompok", "Presentator_Terbaik_1", "Presentator_Terbaik_2", "Evaluasi_Detail_JSON", "Status", "Peran", "NIM_Penilai", "Custom_Answers_JSON"]];
        sRespons.getRange(1, 1, 1, responsHeaders[0].length).setValues(responsHeaders);
        formatHeaderRange(sRespons.getRange(1, 1, 1, responsHeaders[0].length), "#B91C1C", "#FFFFFF");
        sRespons.autoResizeColumns(1, responsHeaders[0].length);
      }
      if (!ss.getSheetByName(rekapSheetName)) {
        const sRekap = ss.insertSheet(rekapSheetName);
        sRekap.getRange(1, 1, 1, 5).setValues([["Kelompok", "Sesi_Minggu", "Jumlah_Penilai", "Rata_Rata_Nilai", "Presentator_Terbaik_Terbanyak"]]);
        formatHeaderRange(sRekap.getRange(1, 1, 1, 5), "#1E40AF", "#FFFFFF");
        sRekap.autoResizeColumns(1, 5);
      }

      // 2. Pastikan Google Drive Subfolders ada
      let driveUrl = "";
      try {
        const formFolder = getOrCreateDriveSubfolder(parentFolder, formId);
        getOrCreateDriveSubfolder(formFolder, "Media_Formulir");
        getOrCreateDriveSubfolder(formFolder, "Lampiran_Mahasiswa");
        driveUrl = formFolder.getUrl();
      } catch(dErr) {}

      // 3. Upsert ke Sheet Registry_Forms
      upsertRegistryFormRow(regSheet, {
        formId: formId,
        formSlug: formSlug,
        judulForm: judulForm,
        mataKuliah: mataKuliah,
        dosen: dosen,
        kelas: kelas,
        jurusan: jurusan,
        sesiAktif: sesiAktif,
        status: status,
        masterSheet: masterSheetName,
        responsSheet: responsSheetName,
        configSheet: configSheetName,
        rekapSheet: rekapSheetName
      });

      syncedResults.push({
        formId: formId,
        judulForm: judulForm,
        driveUrl: driveUrl
      });
    }

    clearApiCache();

    return {
      success: true,
      message: `Berhasil menyinkronkan ${syncedResults.length} formulir ke Google Spreadsheet & Google Drive!`,
      syncedCount: syncedResults.length,
      results: syncedResults
    };
  } catch (err) {
    return { success: false, error: "Gagal sinkronisasi formulir: " + err.toString() };
  }
}

/**
 * Helper Upsert Row di Sheet Registry_Forms
 */
function upsertRegistryFormRow(regSheet, meta) {
  const data = regSheet.getDataRange().getValues();
  const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss");
  let foundRowIdx = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === meta.formId) {
      foundRowIdx = i + 1;
      break;
    }
  }

  const rowData = [
    meta.formId,
    meta.formSlug,
    meta.judulForm,
    meta.mataKuliah,
    meta.dosen,
    meta.kelas,
    meta.jurusan,
    meta.sesiAktif,
    meta.status,
    "[]",
    meta.masterSheet,
    meta.responsSheet,
    meta.configSheet,
    meta.rekapSheet,
    nowStr
  ];

  if (foundRowIdx > 0) {
    regSheet.getRange(foundRowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    regSheet.appendRow(rowData);
  }
}

/**
 * Mengupdate Metadata Formulir di Registry
 */
function adminUpdateFormMeta(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    const regSheet = getRegistrySheet(ss);
    const data = regSheet.getDataRange().getValues();

    const targetFormId = String(payload.formId || "").trim().toUpperCase();
    let targetRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || "").trim().toUpperCase() === targetFormId) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      lock.releaseLock();
      return { success: false, error: `Formulir dengan ID '${targetFormId}' tidak ditemukan.` };
    }

    if (payload.status) {
      regSheet.getRange(targetRow, 9).setValue(String(payload.status).toUpperCase());
    }
    if (payload.judulForm) {
      regSheet.getRange(targetRow, 3).setValue(payload.judulForm);
    }
    if (payload.mataKuliah) {
      regSheet.getRange(targetRow, 4).setValue(payload.mataKuliah);
    }
    if (payload.dosen) {
      regSheet.getRange(targetRow, 5).setValue(payload.dosen);
    }
    if (payload.sesiAktif) {
      regSheet.getRange(targetRow, 8).setValue(payload.sesiAktif);
    }
    if (payload.customFields !== undefined) {
      const customStr = typeof payload.customFields === 'string' ? payload.customFields : JSON.stringify(payload.customFields || []);
      regSheet.getRange(targetRow, 10).setValue(customStr);
    }

    lock.releaseLock();
    clearApiCache(targetFormId);

    return {
      success: true,
      message: `Metadata formulir '${targetFormId}' berhasil diperbarui.`
    };
  } catch (err) {
    return { success: false, error: "Gagal memperbarui formulir: " + err.toString() };
  }
}

/**
 * Kloning Formulir (Duplikasi Roster & Config ke Form Baru)
 */
function adminCloneForm(payload) {
  try {
    const ss = getSpreadsheet();
    const sourceFormId = String(payload.sourceFormId || DEFAULT_FORM_ID).trim().toUpperCase();
    const sourceMeta = getFormMeta(ss, sourceFormId);

    const newTitle = String(payload.newTitle || (sourceMeta.judulForm + " (Salinan)")).trim();
    const createResult = adminCreateForm({
      judulForm: newTitle,
      mataKuliah: sourceMeta.mataKuliah,
      dosen: sourceMeta.dosen,
      kelas: sourceMeta.kelas,
      jurusan: sourceMeta.jurusan,
      sesiAktif: sourceMeta.sesiAktif
    });

    if (!createResult.success) return createResult;

    const newFormId = createResult.formId;

    // Salin Master Data jika ada
    const sourceMasterSheet = ss.getSheetByName(sourceMeta.masterSheetName);
    const targetMasterSheet = ss.getSheetByName("Master_" + newFormId);

    if (sourceMasterSheet && targetMasterSheet && sourceMasterSheet.getLastRow() > 1) {
      const masterValues = sourceMasterSheet.getRange(2, 1, sourceMasterSheet.getLastRow() - 1, 5).getValues();
      targetMasterSheet.getRange(2, 1, masterValues.length, 5).setValues(masterValues);
    }

    return {
      success: true,
      formId: newFormId,
      message: `Berhasil menduplikasi form ke Kode ID baru: ${newFormId}!`
    };
  } catch (err) {
    return { success: false, error: "Gagal kloning formulir: " + err.toString() };
  }
}

/**
 * Hapus / Arsipkan Formulir
 */
function adminDeleteForm(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    const regSheet = getRegistrySheet(ss);
    const data = regSheet.getDataRange().getValues();

    const targetFormId = String(payload.formId || "").trim().toUpperCase();
    if (targetFormId === DEFAULT_FORM_ID) {
      lock.releaseLock();
      return { success: false, error: "Formulir default utama tidak boleh dihapus." };
    }

    let targetRow = -1;
    let meta = null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || "").trim().toUpperCase() === targetFormId) {
        targetRow = i + 1;
        meta = parseFormMetaRow(data[i]);
        break;
      }
    }

    if (targetRow === -1) {
      lock.releaseLock();
      return { success: false, error: "Formulir tidak ditemukan." };
    }

    // Hapus baris dari registry
    regSheet.deleteRow(targetRow);

    // Hapus sheet terisolasi jika diminta
    if (payload.deleteSheets && meta) {
      const sheetsToDelete = [meta.masterSheetName, meta.responsSheetName, meta.configSheetName, meta.rekapSheetName];
      sheetsToDelete.forEach(sName => {
        try {
          const s = ss.getSheetByName(sName);
          if (s) ss.deleteSheet(s);
        } catch (e) {}
      });
    }

    lock.releaseLock();
    clearApiCache(targetFormId);

    return {
      success: true,
      message: `Formulir '${targetFormId}' berhasil dihapus dari registry.`
    };
  } catch (err) {
    return { success: false, error: "Gagal menghapus formulir: " + err.toString() };
  }
}

/**
 * ==============================================================================
 *  CLIENT/STUDENT FORM DATA FETCHING & SUBMISSION
 * ==============================================================================
 */

/**
 * Mengambil Data Awal Form untuk Mahasiswa
 */

/**
 * Helper Skema Tahapan Default Formulir (Standard 4-Tahap PGSD)
 */
function getDefaultFormSchema(config) {
  config = config || {};
  return {
    tahapan: [
      {
        id: "tahap_1",
        title: "Identitas & Akses Penilai",
        description: "Lengkapi data identitas diri penilai sebelum memulai penilaian.",
        fields: [
          {
            id: "fld_core_identity",
            type: "CORE_IDENTITY",
            label: "Identitas Penilai (Peran, NIM, Nama Lengkap, Email Kampus)",
            description: "Merekam data penilai dan memvalidasi alamat email resmi mahasiswa serta format NIM.",
            required: true,
            scope: "GLOBAL",
            config: {
              allowedDomains: config["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id"
            }
          }
        ]
      },
      {
        id: "tahap_2",
        title: "Pemilihan Kelompok Presentator",
        description: "Pilih salah satu kelompok yang sedang presentasi di depan kelas.",
        fields: [
          {
            id: "fld_core_group",
            type: "CORE_GROUP_SELECT",
            label: "Pemilihan Kelompok Presentator Tampil",
            description: "Menampilkan daftar kelompok yang tampil pada sesi aktif minggu ini. Terhubung otomatis dengan data kelompok.",
            required: true,
            scope: "GLOBAL",
            config: {}
          }
        ]
      },
      {
        id: "tahap_3",
        title: "Skor Rubrik & Voting Presentator",
        description: "Penilaian performa materi presentasi dan pemilihan pemateri terbaik.",
        fields: [
          {
            id: "fld_core_score",
            type: "CORE_SCORE_RUBRIC",
            label: "Nilai Presentasi Kelompok (Skala Skor)",
            description: "Penilaian performa presentasi materi dengan slider skor, chip preset (70-100), dan input angka.",
            required: true,
            scope: "GLOBAL",
            config: {
              minScore: parseInt(config["Nilai_Kelompok_Min"] || 50),
              maxScore: parseInt(config["Nilai_Kelompok_Max"] || 100)
            }
          },
          {
            id: "fld_core_voting",
            type: "CORE_BEST_PRESENTER",
            label: "Pemilihan Presentator Terbaik",
            description: "Pemilihan anggota pemateri terbaik per kelompok dengan sistem checklist voting.",
            required: true,
            scope: "GLOBAL",
            config: {
              maxSelection: parseInt(config["Maksimal_Pilihan_Presentator_Terbaik"] || 2)
            }
          }
        ]
      },
      {
        id: "tahap_4",
        title: "Evaluasi Masukan Kualitatif",
        description: "Tuliskan masukan dan tanggapan objektif untuk setiap anggota pemateri kelompok.",
        fields: [
          {
            id: "fld_core_feedback",
            type: "CORE_MEMBER_FEEDBACK",
            label: "Evaluasi Masukan Kualitatif Tiap Pemateri",
            description: "Kolom ulasan tertulis terpisah untuk setiap anggota pemateri kelompok.",
            required: true,
            scope: "PER_KELOMPOK",
            config: {
              maxChars: parseInt(config["Maksimal_Karakter_Evaluasi"] || 500),
              publicDisplay: config["Tampilkan_Ulasan_Publik"] || "AKTIF",
              penyajiRule: config["Kewajiban_Menilai_Penyaji"] || "BEBAS_PENUH_DI_SESINYA"
            }
          }
        ]
      }
    ]
  };
}

/**
 * Helper Normalisasi Skema Formulir (Menjamin Kompatibilitas 100%)
 */
function normalizeFormSchema(customFieldsRaw, config) {
  if (customFieldsRaw && typeof customFieldsRaw === 'object' && Array.isArray(customFieldsRaw.tahapan)) {
    return customFieldsRaw;
  }
  const defaultSchema = getDefaultFormSchema(config);
  if (Array.isArray(customFieldsRaw) && customFieldsRaw.length > 0) {
    // Masukkan custom fields flat ke Tahap 3 (Rubrik) atau Tahap 4 (Evaluasi)
    customFieldsRaw.forEach(cf => {
      if (cf.scope === 'PER_KELOMPOK') {
        defaultSchema.tahapan[2].fields.push(cf);
      } else {
        defaultSchema.tahapan[3].fields.push(cf);
      }
    });
  }
  return defaultSchema;
}

function getFormInitialData(formId) {
  try {
    const ss = getSpreadsheet();
    const formMeta = getFormMeta(ss, formId);
    const config = getConfigMap(ss, formMeta.formId);
    let masterSheet = getMasterSheet(ss, formMeta.formId);

    const masterData = masterSheet.getDataRange().getValues();
    const sesiAktif = (config["Sesi_Minggu_Aktif"] || formMeta.sesiAktif || "").trim().toUpperCase();

    const groupsMap = {};
    const allGroupsMap = {};
    const allStudentsList = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const kelompok = String(row[0] || "").trim();
      const sesi = String(row[1] || "").trim();
      const rawNim = row[2];
      const nim = (rawNim !== null && rawNim !== undefined) ? String(rawNim).trim() : "";
      const nama = String(row[3] || "").trim();
      const status = String(row[4] || "AKTIF").trim().toUpperCase();

      if (!kelompok || !nama) continue;
      if (status === "NONAKTIF") continue;

      allStudentsList.push({
        nim: nim,
        name: nama,
        kelompok: kelompok,
        sesi: sesi
      });

      if (!allGroupsMap[kelompok]) {
        allGroupsMap[kelompok] = {
          name: kelompok,
          sesi: sesi,
          members: []
        };
      }
      allGroupsMap[kelompok].members.push({ nim: nim, name: nama });

      const sesiRow = sesi.trim().toUpperCase();
      if (sesiAktif === "SEMUA" || sesiAktif === "" || sesiRow === sesiAktif) {
        if (!groupsMap[kelompok]) {
          groupsMap[kelompok] = {
            name: kelompok,
            sesi: sesi,
            members: []
          };
        }
        groupsMap[kelompok].members.push({ nim: nim, name: nama });
      }
    }

    const groupList = Object.keys(groupsMap).map(k => groupsMap[k]);
    const allGroupList = Object.keys(allGroupsMap).map(k => allGroupsMap[k]);

    return {
      success: true,
      formMeta: formMeta,
      config: config,
      customFields: formMeta.customFields || [],
      groups: groupList.length > 0 ? groupList : allGroupList,
      allGroups: allGroupList,
      allStudents: allStudentsList,
      loggedInEmail: ""
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Validasi Institutional Email
 */
function isValidInstitutionalEmail(email, allowedDomainsStr) {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  const allowedDomains = (allowedDomainsStr || "mhs.ulm.ac.id, ulm.ac.id")
    .split(",")
    .map(d => d.trim().toLowerCase())
    .filter(Boolean);

  for (let d of allowedDomains) {
    if (email.endsWith("@" + d) || email.endsWith("." + d)) {
      return true;
    }
  }
  return false;
}

let lastDriveError = "";

/**
 * Jalankan fungsi ini satu kali di Google Apps Script Editor untuk mengotorisasi Izin Akses Google Drive & Google Sheets
 */
function setupAndAuthorizeDrive() {
  try {
    const root = getOrCreateDriveFolder(DEFAULT_DRIVE_FOLDER_ID);
    const testSub = getOrCreateDriveSubfolder(root, "BK5E");
    Logger.log("Izin Google Drive & Sheets berhasil diotorisasi!");
    Logger.log("Root Folder ID: " + root.getId());
    return {
      success: true,
      folderId: root.getId(),
      folderName: root.getName()
    };
  } catch (err) {
    Logger.log("Otorisasi error: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Upload File ke Google Drive secara Terstruktur dengan Manajemen Subfolder Otomatis
 * Struktur Folder: {Parent_Drive_Folder} / {PIN_FORMULIR} / (Media_Formulir | Lampiran_Mahasiswa)
 */
function saveUploadedFileToDrive(base64Data, fileName, mimeType, formId, category) {
  try {
    lastDriveError = "";
    if (!base64Data || typeof base64Data !== 'string') {
      lastDriveError = "Data berkas base64 kosong.";
      return null;
    }

    const cleanFormId = String(formId || DEFAULT_FORM_ID).trim().toUpperCase();
    
    // Ambil nama folder kustom dari metadata form jika dikonfigurasi
    let rootFolderName = DEFAULT_DRIVE_FOLDER_ID;
    try {
      const meta = getFormMetadata(cleanFormId);
      if (meta && meta.driveFolder && meta.driveFolder.trim()) {
        rootFolderName = meta.driveFolder.trim();
      }
    } catch(mErr) {}

    const parentFolder = getOrCreateDriveFolder(rootFolderName);
    const formFolder = getOrCreateDriveSubfolder(parentFolder, cleanFormId);

    // Kategori: "Media_Formulir" (admin) atau "Lampiran_Mahasiswa" (responden)
    const categoryName = (category === "Media_Formulir" || category === "admin" || category === "form_media")
      ? "Media_Formulir"
      : "Lampiran_Mahasiswa";
    
    const targetFolder = getOrCreateDriveSubfolder(formFolder, categoryName);

    // Strip Data URL header if present (e.g. data:image/png;base64,...)
    let cleanBase64 = base64Data;
    if (cleanBase64.indexOf(",") > -1) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.trim();

    const decoded = Utilities.base64Decode(cleanBase64);
    const safeName = (fileName || ("berkas_" + Date.now())).replace(/[\\/:*?"<>|]/g, "_");
    const blob = Utilities.newBlob(decoded, mimeType || "application/octet-stream", safeName);
    const file = targetFolder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(shareErr) {
      Logger.log("Sharing permission notice: " + shareErr.toString());
    }

    const fileId = file.getId();
    const isImage = (mimeType && mimeType.startsWith("image/")) || /\.(jpe?g|png|gif|webp|bmp)$/i.test(safeName);
    const directUrl = isImage 
      ? `https://lh3.googleusercontent.com/d/${fileId}`
      : file.getUrl();

    return {
      fileUrl: directUrl || file.getUrl(),
      fileId: fileId,
      fileName: safeName,
      folderPath: `${rootFolderName} / ${cleanFormId} / ${categoryName}`
    };
  } catch (e) {
    lastDriveError = e.toString();
    Logger.log("Error saveUploadedFileToDrive: " + e.toString());
    return null;
  }
}

/**
 * Endpoint Khusus Upload Berkas / Media Langsung ke Google Drive
 */
function handleDirectFileUpload(payload) {
  try {
    let base64Data = payload.base64 || payload.dataUrl || payload.fileData || "";
    const fileName = payload.name || payload.fileName || ("media_" + Date.now());
    const mimeType = payload.type || payload.mimeType || "application/octet-stream";
    const formId = payload.formId || DEFAULT_FORM_ID;
    const category = payload.category || "Media_Formulir";

    if (!base64Data) {
      return { success: false, error: "Data berkas (base64) kosong." };
    }

    const uploadRes = saveUploadedFileToDrive(base64Data, fileName, mimeType, formId, category);
    if (!uploadRes || !uploadRes.fileUrl) {
      return { 
        success: false, 
        error: "Gagal menyimpan berkas ke Google Drive: " + (lastDriveError || "Pastikan izin akses Drive aktif di Apps Script.") 
      };
    }

    return {
      success: true,
      fileUrl: uploadRes.fileUrl,
      fileId: uploadRes.fileId,
      fileName: fileName,
      mimeType: mimeType,
      folderPath: uploadRes.folderPath
    };
  } catch (e) {
    return { success: false, error: "Gagal memproses unggahan: " + e.toString() };
  }
}

/**
 * Hapus Berkas dari Google Drive secara Bersih Tanpa Jejak
 */
function deleteDriveFile(payload) {
  try {
    let target = payload?.fileId || payload?.fileUrl || payload?.url || (typeof payload === 'string' ? payload : '');
    if (!target) {
      return { success: false, error: "ID atau URL berkas kosong." };
    }

    let fileId = target;
    if (target.includes("id=")) {
      const match = target.match(/id=([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    } else if (target.includes("/d/")) {
      const match = target.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    }

    if (!fileId) {
      return { success: false, error: "Tidak dapat menemukan ID berkas Google Drive." };
    }

    const file = DriveApp.getFileById(fileId);
    if (file) {
      file.setTrashed(true); // Pindahkan ke Trash agar bersih seketika
      Logger.log("Drive file trashed successfully: " + fileId);
      return {
        success: true,
        message: "Berkas Google Drive berhasil dihapus secara bersih.",
        fileId: fileId
      };
    }
    return { success: false, error: "Berkas tidak ditemukan di Google Drive." };
  } catch (e) {
    Logger.log("Error deleteDriveFile: " + e.toString());
    return { success: false, error: "Gagal menghapus berkas Drive: " + e.toString() };
  }
}

function getOrCreateDriveFolder(folderNameOrId) {
  if (!folderNameOrId || folderNameOrId.trim() === "") {
    folderNameOrId = DEFAULT_DRIVE_FOLDER_ID;
  }
  
  const cleanTarget = folderNameOrId.trim();

  // 1. Jika diberikan ID Folder (alfanumerik panjang) atau URL Drive
  let targetId = cleanTarget;
  if (cleanTarget.includes("folders/")) {
    const match = cleanTarget.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match) targetId = match[1];
  } else if (cleanTarget.includes("id=")) {
    const match = cleanTarget.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) targetId = match[1];
  }

  if (targetId && targetId.length >= 25 && !targetId.includes(" ")) {
    try {
      const folder = DriveApp.getFolderById(targetId);
      if (folder) return folder;
    } catch(e) {
      Logger.log("Folder by ID not found, fallback to name search: " + e.toString());
    }
  }

  // 2. Jika diberikan nama folder, cari folder berdasarkan nama
  const folders = DriveApp.getFoldersByName(cleanTarget);
  if (folders.hasNext()) return folders.next();

  // 3. Fallback ke DEFAULT_DRIVE_FOLDER_ID
  if (DEFAULT_DRIVE_FOLDER_ID) {
    try {
      const defFolder = DriveApp.getFolderById(DEFAULT_DRIVE_FOLDER_ID);
      if (defFolder) return defFolder;
    } catch(e) {}
  }

  return DriveApp.createFolder(cleanTarget);
}

function getOrCreateDriveSubfolder(parentFolder, subfolderName) {
  const folders = parentFolder.getFoldersByName(subfolderName);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(subfolderName);
}

/**
 * Memproses Submission Penilaian
 */
function submitAssessment(payload) {
  try {
    const formId = String(payload.formId || DEFAULT_FORM_ID).trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const namaPenilai = String(payload.namaPenilai || "").trim();
    const kelompok = String(payload.kelompok || "").trim();
    const sesi = String(payload.sesi || "Minggu 1").trim();
    const nilaiKelompok = parseFloat(payload.nilaiKelompok);
    const presentatorTerbaik = Array.isArray(payload.presentatorTerbaik) ? payload.presentatorTerbaik : [];
    const evaluasiDetail = payload.evaluasiDetail || {};
    const customAnswers = payload.customAnswers || {};

    if (!email || !namaPenilai || !kelompok || isNaN(nilaiKelompok)) {
      return { success: false, error: "Semua kolom wajib diisi dengan benar!" };
    }

    const ss = getSpreadsheet();
    const formMeta = getFormMeta(ss, formId);

    // Cek status form
    if (formMeta.status === "TUTUP" || formMeta.status === "ARSIP") {
      return { success: false, error: "Formulir ini sudah ditutup untuk pengisian penilaian baru." };
    }

    const config = getConfigMap(ss, formMeta.formId);
    const peranPenilai = String(payload.peranPenilai || "Mahasiswa").trim();
    const nimPenilai = String(payload.nimPenilai || "-").trim();

    // 1. Validasi Domain Email
    const allowedDomainsStr = config["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id";
    if (peranPenilai === "Mahasiswa" && !isValidInstitutionalEmail(email, allowedDomainsStr)) {
      return {
        success: false,
        error: `Format email tidak valid atau bukan domain resmi (${allowedDomainsStr}). Contoh format: nim@mhs.ulm.ac.id`
      };
    }

    // 2. Validasi Batas Nilai
    const minVal = parseFloat(config["Nilai_Kelompok_Min"] || 50);
    const maxVal = parseFloat(config["Nilai_Kelompok_Max"] || 100);
    if (nilaiKelompok < minVal || nilaiKelompok > maxVal) {
      return {
        success: false,
        error: `Nilai presentasi kelompok harus berada dalam rentang ${minVal} - ${maxVal}!`
      };
    }

    // 3. Validasi Presentator Terbaik
    const maxBest = parseInt(config["Maksimal_Pilihan_Presentator_Terbaik"] || 2);
    if (presentatorTerbaik.length > maxBest) {
      return {
        success: false,
        error: `Anda hanya diperkenankan memilih maksimal ${maxBest} pemateri terbaik!`
      };
    }

    // 4. Proses File Upload jika ada
    if (payload.uploadedFiles && typeof payload.uploadedFiles === 'object') {
      for (let fldId in payload.uploadedFiles) {
        const fileObj = payload.uploadedFiles[fldId];
        if (fileObj && fileObj.base64) {
          const fileUrl = saveUploadedFileToDrive(fileObj.base64, fileObj.name, fileObj.type, formMeta.formId);
          customAnswers[fldId] = fileUrl || fileObj.name;
        }
      }
    }

    // 5. Lock & Atomic Write to Respons Sheet
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    let responsSheet = getResponsSheet(ss, formMeta.formId);
    const lastRow = responsSheet.getLastRow();
    const idRespons = "RESP-" + formMeta.formId + "-" + Utilities.formatDate(new Date(), "Asia/Makassar", "yyyyMMdd-HHmmss") + "-" + Math.floor(100 + Math.random() * 900);
    const now = new Date();

    const best1 = presentatorTerbaik[0] || "-";
    const best2 = presentatorTerbaik[1] || "-";
    const evaluasiJsonStr = JSON.stringify(evaluasiDetail);
    const customAnswersJsonStr = JSON.stringify(customAnswers);

    const newRow = [
      idRespons,
      now,
      sesi,
      email,
      namaPenilai,
      kelompok,
      nilaiKelompok,
      best1,
      best2,
      evaluasiJsonStr,
      "VALID",
      peranPenilai,
      nimPenilai,
      customAnswersJsonStr
    ];

    // Cek Duplikat
    if (lastRow > 1) {
      const totalRows = lastRow - 1;
      const checkData = responsSheet.getRange(2, 3, totalRows, 9).getValues();
      for (let i = 0; i < checkData.length; i++) {
        const rSesi = String(checkData[i][0] || "").trim();
        const rEmail = String(checkData[i][1] || "").trim().toLowerCase();
        const rKelompok = String(checkData[i][3] || "").trim();
        const rStatus = String(checkData[i][8] || "VALID").trim().toUpperCase();

        if (rStatus === "VALID" && rEmail === email && rKelompok === kelompok && rSesi === sesi) {
          lock.releaseLock();
          return {
            success: false,
            error: `Anda (${email}) sudah pernah mengirimkan penilaian untuk ${kelompok} pada ${sesi}.`
          };
        }
      }
    }

    const nextRow = lastRow + 1;
    responsSheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    lock.releaseLock();

    clearApiCache(formMeta.formId);

    return {
      success: true,
      message: `Penilaian untuk ${kelompok} berhasil disimpan! Terima kasih.`
    };
  } catch (err) {
    return { success: false, error: "Terjadi kesalahan server: " + err.toString() };
  }
}

/**
 * ==============================================================================
 *  REKAPITULASI & STATISTIK PENILAIAN
 * ==============================================================================
 */

/**
 * Mengambil Rekap Nilai + Data Status Pengisian Presisi Tinggi
 */
function getRecapData(formId) {
  try {
    const ss = getSpreadsheet();
    const formMeta = getFormMeta(ss, formId);
    const config = getConfigMap(ss, formMeta.formId);
    let responsSheet = getResponsSheet(ss, formMeta.formId);
    let masterSheet = getMasterSheet(ss, formMeta.formId);

    const isPublicReviewVisible = (config["Tampilkan_Ulasan_Publik"] || "AKTIF").trim().toUpperCase() === "AKTIF";

    const responsData = responsSheet.getLastRow() > 0 ? responsSheet.getDataRange().getValues() : [];
    const masterData = masterSheet.getLastRow() > 0 ? masterSheet.getDataRange().getValues() : [];

    const groupMembersMap = {};
    for (let i = 1; i < masterData.length; i++) {
      const g = String(masterData[i][0] || "").trim();
      const n = String(masterData[i][3] || "").trim();
      const nim = String(masterData[i][2] || "").trim();
      if (g && n) {
        if (!groupMembersMap[g]) groupMembersMap[g] = [];
        groupMembersMap[g].push({ name: n, nim: nim });
      }
    }

    const submittedNimSet = new Set();
    const submittedNameSet = new Set();
    const nimToKelompokMap = {};
    const nameToKelompokMap = {};

    for (let i = 1; i < responsData.length; i++) {
      const row = responsData[i];
      const status = String(row[10] || "VALID").trim().toUpperCase();
      if (status !== "VALID") continue;

      const peran = String(row[11] || "Mahasiswa").trim();
      if (peran !== "Mahasiswa") continue;

      const nim = String(row[12] || "").trim().toLowerCase();
      const namaLower = String(row[4] || "").trim().toLowerCase();
      const kelompok = String(row[5] || "").trim();

      if (nim && nim !== "-") {
        submittedNimSet.add(nim);
        if (!nimToKelompokMap[nim]) nimToKelompokMap[nim] = [];
        if (!nimToKelompokMap[nim].includes(kelompok)) nimToKelompokMap[nim].push(kelompok);
      }
      if (namaLower) {
        submittedNameSet.add(namaLower);
        if (!nameToKelompokMap[namaLower]) nameToKelompokMap[namaLower] = [];
        if (!nameToKelompokMap[namaLower].includes(kelompok)) nameToKelompokMap[namaLower].push(kelompok);
      }
    }

    const rekapByGroupMhs = {};
    const rekapByGroupAll = {};

    function initGroupEntry(map, kelompok, sesi) {
      if (!map[kelompok]) {
        map[kelompok] = {
          kelompok: kelompok,
          sesi: sesi,
          totalPenilai: 0,
          totalSkor: 0,
          rataRataSkor: 0,
          votePresentator: {},
          evaluasiList: {},
          evaluators: []
        };
      }
    }

    for (let i = 1; i < responsData.length; i++) {
      const row = responsData[i];
      const sesi = String(row[2] || "").trim();
      const namaPenilai = String(row[4] || "").trim();
      const kelompok = String(row[5] || "").trim();
      const nilaiKelompok = parseFloat(row[6]);
      const best1 = String(row[7] || "").trim();
      const best2 = String(row[8] || "").trim();
      const evaluasiJsonStr = String(row[9] || "{}").trim();
      const status = String(row[10] || "VALID").trim().toUpperCase();
      const peran = String(row[11] || "Mahasiswa").trim();
      const nimPenilai = String(row[12] || "-").trim();

      if (status !== "VALID" || !kelompok || isNaN(nilaiKelompok)) continue;

      const isMhs = peran === "Mahasiswa";
      const evaluatorObj = { name: namaPenilai, nim: nimPenilai, peran: peran, sesi: sesi };

      initGroupEntry(rekapByGroupAll, kelompok, sesi);
      const itemAll = rekapByGroupAll[kelompok];
      itemAll.totalPenilai += 1;
      itemAll.totalSkor += nilaiKelompok;
      if (namaPenilai && !itemAll.evaluators.some(e => (typeof e === 'object' ? e.name : e) === namaPenilai)) {
        itemAll.evaluators.push(evaluatorObj);
      }
      if (best1 && best1 !== "-") itemAll.votePresentator[best1] = (itemAll.votePresentator[best1] || 0) + 1;
      if (best2 && best2 !== "-") itemAll.votePresentator[best2] = (itemAll.votePresentator[best2] || 0) + 1;
      try {
        const evalObj = JSON.parse(evaluasiJsonStr);
        for (let m in evalObj) {
          const ulasan = String(evalObj[m] || "").trim();
          if (ulasan) {
            if (!itemAll.evaluasiList[m]) itemAll.evaluasiList[m] = [];
            itemAll.evaluasiList[m].push({ penilai: namaPenilai, ulasan: ulasan });
          }
        }
      } catch (e) {}

      if (isMhs) {
        initGroupEntry(rekapByGroupMhs, kelompok, sesi);
        const itemMhs = rekapByGroupMhs[kelompok];
        itemMhs.totalPenilai += 1;
        itemMhs.totalSkor += nilaiKelompok;
        if (namaPenilai && !itemMhs.evaluators.some(e => (typeof e === 'object' ? e.name : e) === namaPenilai)) {
          itemMhs.evaluators.push(evaluatorObj);
        }
        if (best1 && best1 !== "-") itemMhs.votePresentator[best1] = (itemMhs.votePresentator[best1] || 0) + 1;
        if (best2 && best2 !== "-") itemMhs.votePresentator[best2] = (itemMhs.votePresentator[best2] || 0) + 1;
        try {
          const evalObj2 = JSON.parse(evaluasiJsonStr);
          for (let m in evalObj2) {
            const ulasan = String(evalObj2[m] || "").trim();
            if (ulasan) {
              if (!itemMhs.evaluasiList[m]) itemMhs.evaluasiList[m] = [];
              itemMhs.evaluasiList[m].push({ penilai: namaPenilai, ulasan: ulasan });
            }
          }
        } catch (e) {}
      }
    }

    function buildSummaryFromMap(rekapMap) {
      return Object.keys(rekapMap).map(k => {
        const g = rekapMap[k];
        g.rataRataSkor = g.totalPenilai > 0 ? (g.totalSkor / g.totalPenilai).toFixed(2) : "0.00";
        g.rankedPresenters = Object.keys(g.votePresentator)
          .map(vName => ({ name: vName, votes: g.votePresentator[vName] }))
          .sort((a, b) => b.votes - a.votes);
        if (!isPublicReviewVisible) g.evaluasiList = {};
        return g;
      });
    }

    const summaryAll = buildSummaryFromMap(rekapByGroupAll);
    const summaryMhs = buildSummaryFromMap(rekapByGroupMhs);

    return {
      success: true,
      formMeta: formMeta,
      isPublicReviewVisible: isPublicReviewVisible,
      config: config,
      summary: summaryAll,
      summaryMhs: summaryMhs,
      groupMembersMap: groupMembersMap,
      submittedNims: Array.from(submittedNimSet),
      submittedNames: Array.from(submittedNameSet),
      nimToKelompokMap: nimToKelompokMap,
      nameToKelompokMap: nameToKelompokMap
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Menuliskan Rekap ke Sheet
 */
function generateRekapSheet(formId) {
  const ss = getSpreadsheet();
  let sheetRekap = getRekapSheet(ss, formId);
  sheetRekap.clear();

  const rekapResult = getRecapData(formId);
  if (!rekapResult.success) return;

  const headers = [
    ["Kelompok", "Sesi_Minggu", "Jumlah_Penilai", "Rata_Rata_Nilai", "Presentator_Terbaik_Terbanyak"]
  ];

  const rows = [];
  rekapResult.summary.forEach(item => {
    let topPresenter = "-";
    if (item.rankedPresenters && item.rankedPresenters.length > 0) {
      topPresenter = item.rankedPresenters.map(p => `${p.name} (${p.votes} suara)`).join(", ");
    }
    rows.push([
      item.kelompok,
      item.sesi,
      item.totalPenilai,
      item.rataRataSkor,
      topPresenter
    ]);
  });

  sheetRekap.getRange(1, 1, 1, 5).setValues(headers);
  formatHeaderRange(sheetRekap.getRange(1, 1, 1, 5), "#1E40AF", "#FFFFFF");

  if (rows.length > 0) {
    sheetRekap.getRange(2, 1, rows.length, 5).setValues(rows);
    sheetRekap.getRange(2, 4, rows.length, 1).setNumberFormat("0.00");
  }

  sheetRekap.autoResizeColumns(1, 5);
}

/**
 * Format Header Range
 */
function formatHeaderRange(range, bgColor, fontColor) {
  range.setBackground(bgColor)
    .setFontColor(fontColor)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
}

/**
 * ==============================================================================
 *  ADMIN BACKEND CONTROLLERS (DATA & CONFIG MANAGEMENT)
 * ==============================================================================
 */

/**
 * Mengambil Seluruh Data Master & Konfigurasi untuk Admin Form Terisolasi
 */
function adminGetFullData(formId) {
  try {
    const ss = getSpreadsheet();
    const formMeta = getFormMeta(ss, formId);
    const config = getConfigMap(ss, formMeta.formId);
    let masterSheet = getMasterSheet(ss, formMeta.formId);
    let responsSheet = getResponsSheet(ss, formMeta.formId);

    const masterData = masterSheet.getLastRow() > 0 ? masterSheet.getDataRange().getValues() : [];
    const groupsMap = {};

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const kelompok = String(row[0] || "").trim();
      const sesi = String(row[1] || "Minggu 1").trim();
      const nim = String(row[2] || "").trim();
      const nama = String(row[3] || "").trim();
      const status = String(row[4] || "AKTIF").trim().toUpperCase();

      if (!kelompok) continue;

      if (!groupsMap[kelompok]) {
        groupsMap[kelompok] = {
          name: kelompok,
          sesi: sesi,
          status: status,
          members: []
        };
      }

      if (nama) {
        groupsMap[kelompok].members.push({
          name: nama,
          nim: nim,
          status: status
        });
      }
    }

    const groupList = Object.keys(groupsMap).map(k => groupsMap[k]);
    const totalResponses = responsSheet && responsSheet.getLastRow() > 1 ? responsSheet.getLastRow() - 1 : 0;

    const normalizedSchema = normalizeFormSchema(formMeta.customFields, config);
    return {
      success: true,
      formMeta: formMeta,
      config: config,
      customFields: formMeta.customFields || [],
      formSchema: normalizedSchema,
      groups: groupList,
      totalResponses: totalResponses
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Menyimpan Seluruh Data Master Kelompok & Mahasiswa secara Atomik
 */
function adminSaveMasterData(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    const formId = payload.formId || DEFAULT_FORM_ID;
    let masterSheet = getMasterSheet(ss, formId);

    const groups = payload.groups || [];
    const rowsToWrite = [];

    groups.forEach(grp => {
      const groupName = String(grp.name || "").trim();
      const sesi = String(grp.sesi || "Minggu 1").trim();
      const groupStatus = String(grp.status || "AKTIF").trim().toUpperCase();
      const members = grp.members || [];

      if (!groupName) return;

      if (members.length === 0) {
        rowsToWrite.push([groupName, sesi, "-", "-", groupStatus]);
      } else {
        members.forEach(m => {
          const mName = String(m.name || "").trim();
          const mNim = String(m.nim || "").trim();
          const mStatus = String(m.status || groupStatus).trim().toUpperCase();
          if (mName) {
            rowsToWrite.push([groupName, sesi, mNim, mName, mStatus]);
          }
        });
      }
    });

    if (masterSheet.getLastRow() > 1) {
      masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 5).clearContent();
    }

    if (rowsToWrite.length > 0) {
      masterSheet.getRange(2, 1, rowsToWrite.length, 5).setValues(rowsToWrite);
    }

    lock.releaseLock();
    clearApiCache(formId);

    return {
      success: true,
      message: `Berhasil memperbarui data ${groups.length} kelompok (${rowsToWrite.length} baris data).`
    };
  } catch (err) {
    return { success: false, error: "Gagal menyimpan data master: " + err.toString() };
  }
}

/**
 * Menyimpan Konfigurasi Sistem Perkuliahan
 */
function adminSaveConfig(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    const formId = payload.formId || DEFAULT_FORM_ID;
    let configSheet = getConfigSheet(ss, formId);

    const newConfig = payload.config || {};
    const configData = configSheet.getDataRange().getValues();
    const existingKeys = {};

    for (let i = 1; i < configData.length; i++) {
      const key = String(configData[i][0] || "").trim();
      if (key) {
        existingKeys[key] = i + 1;
      }
    }

    for (let key in newConfig) {
      const val = String(newConfig[key] || "").trim();
      if (existingKeys[key]) {
        configSheet.getRange(existingKeys[key], 2).setValue(val);
      } else {
        configSheet.appendRow([key, val, "Pengaturan Tambahan"]);
      }
    }

    // Update juga custom fields jika dikirim
    if (payload.customFields !== undefined) {
      adminUpdateFormMeta({
        formId: formId,
        customFields: payload.customFields,
        judulForm: newConfig["Judul_Form"],
        mataKuliah: newConfig["Mata_Kuliah"],
        dosen: newConfig["Dosen_Pengampu"],
        sesiAktif: newConfig["Sesi_Minggu_Aktif"]
      });
    }

    lock.releaseLock();
    clearApiCache(formId);

    return {
      success: true,
      message: "Konfigurasi formulir berhasil disimpan!"
    };
  } catch (err) {
    return { success: false, error: "Gagal menyimpan konfigurasi: " + err.toString() };
  }
}

/**
 * Mereset / Menghapus Seluruh Respons Penilaian per Form
 */
function adminResetResponses(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    const formId = payload.formId || DEFAULT_FORM_ID;
    let responsSheet = getResponsSheet(ss, formId);
    let rekapSheet = getRekapSheet(ss, formId);

    if (responsSheet && responsSheet.getLastRow() > 1) {
      responsSheet.getRange(2, 1, responsSheet.getLastRow() - 1, responsSheet.getLastColumn()).clearContent();
    }

    if (rekapSheet && rekapSheet.getLastRow() > 1) {
      rekapSheet.getRange(2, 1, rekapSheet.getLastRow() - 1, rekapSheet.getLastColumn()).clearContent();
    }

    lock.releaseLock();
    clearApiCache(formId);

    return {
      success: true,
      message: "Seluruh respons penilaian pada form ini berhasil dibersihkan."
    };
  } catch (err) {
    return { success: false, error: "Gagal reset respons: " + err.toString() };
  }
}

/**
 * Mengambil Seluruh Daftar Respons Penilaian per Form
 */
function adminGetResponsesList(formId) {
  try {
    const ss = getSpreadsheet();
    const formMeta = getFormMeta(ss, formId);
    let responsSheet = getResponsSheet(ss, formMeta.formId);

    if (!responsSheet || responsSheet.getLastRow() <= 1) {
      return { success: true, formMeta: formMeta, responses: [] };
    }

    const data = responsSheet.getDataRange().getValues();
    const responses = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const idRespons = String(row[0] || ("RESP-ROW-" + (i + 1))).trim();
      const rawDate = row[1];
      let formattedDate = "-";
      if (rawDate instanceof Date) {
        formattedDate = Utilities.formatDate(rawDate, "Asia/Makassar", "dd MMM yyyy HH:mm:ss");
      } else if (rawDate) {
        formattedDate = String(rawDate);
      }

      const sesi = String(row[2] || "").trim();
      const email = String(row[3] || "").trim();
      const namaPenilai = String(row[4] || "").trim();
      const kelompok = String(row[5] || "").trim();
      const nilaiKelompok = row[6] !== undefined ? row[6] : "-";
      const best1 = String(row[7] || "-").trim();
      const best2 = String(row[8] || "-").trim();
      const evaluasiJsonStr = String(row[9] || "{}").trim();
      const status = String(row[10] || "VALID").trim().toUpperCase();
      const peran = String(row[11] || "Mahasiswa").trim();
      const nim = String(row[12] || "-").trim();
      const customAnswersStr = String(row[13] || "{}").trim();

      if (!email && !namaPenilai && !kelompok) continue;

      responses.push({
        rowIndex: i + 1,
        idRespons: idRespons,
        timestamp: formattedDate,
        sesi: sesi,
        email: email,
        namaPenilai: namaPenilai,
        peran: peran,
        nim: nim,
        kelompok: kelompok,
        nilaiKelompok: nilaiKelompok,
        best1: best1,
        best2: best2,
        evaluasiDetail: evaluasiJsonStr,
        customAnswers: customAnswersStr,
        status: status
      });
    }

    return {
      success: true,
      formMeta: formMeta,
      responses: responses.reverse()
    };
  } catch (err) {
    return { success: false, error: "Gagal mengambil daftar respons: " + err.toString() };
  }
}

/**
 * Menghapus / Mereset 1 Respons Penilaian Tertentu
 */
function adminDeleteSingleResponse(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    const formId = payload.formId || DEFAULT_FORM_ID;
    let responsSheet = getResponsSheet(ss, formId);

    if (!responsSheet || responsSheet.getLastRow() <= 1) {
      lock.releaseLock();
      return { success: false, error: "Data respons kosong." };
    }

    const idTarget = String(payload.idRespons || "").trim();
    const data = responsSheet.getDataRange().getValues();
    let targetRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || "").trim() === idTarget) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1 && payload.rowIndex) {
      targetRow = parseInt(payload.rowIndex);
    }

    if (targetRow > 1 && targetRow <= responsSheet.getLastRow()) {
      responsSheet.deleteRow(targetRow);
      lock.releaseLock();
      clearApiCache(formId);

      try {
        generateRekapSheet(formId);
      } catch (e) {}

      return {
        success: true,
        message: `Respons ID '${idTarget}' berhasil dihapus dan rekap nilai otomatis diperbarui.`
      };
    } else {
      lock.releaseLock();
      return { success: false, error: "Data respons tidak ditemukan di spreadsheet." };
    }
  } catch (err) {
    return { success: false, error: "Gagal menghapus respons: " + err.toString() };
  }
}

/**
 * Menghapus Respons Berdasarkan Pilihan Eksklusif: Per Kelompok Presentator ATAU Per Sesi
 */
function adminDeleteScopedResponses(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);

    const ss = getSpreadsheet();
    const formId = payload.formId || DEFAULT_FORM_ID;
    let responsSheet = getResponsSheet(ss, formId);

    if (!responsSheet || responsSheet.getLastRow() <= 1) {
      lock.releaseLock();
      return { success: false, error: "Data respons kosong." };
    }

    const mode = String(payload.mode || "").trim().toUpperCase();
    const targetValue = String(payload.targetValue || "").trim();

    if (!mode || (mode !== "KELOMPOK" && mode !== "SESI")) {
      lock.releaseLock();
      return { success: false, error: "Mode penghapusan tidak valid. Pilih 'KELOMPOK' atau 'SESI'." };
    }

    if (!targetValue || targetValue === "ALL") {
      lock.releaseLock();
      return { success: false, error: `Pilih target ${mode === "KELOMPOK" ? "kelompok presentator" : "sesi"} yang spesifik.` };
    }

    const data = responsSheet.getDataRange().getValues();
    let deletedCount = 0;

    for (let i = data.length - 1; i >= 1; i--) {
      let isMatch = false;

      if (mode === "KELOMPOK") {
        const rowKelompok = String(data[i][5] || "").trim();
        if (rowKelompok.toLowerCase() === targetValue.toLowerCase()) {
          isMatch = true;
        }
      } else if (mode === "SESI") {
        const rowSesi = String(data[i][2] || "").trim();
        if (rowSesi.toLowerCase() === targetValue.toLowerCase()) {
          isMatch = true;
        }
      }

      if (isMatch) {
        responsSheet.deleteRow(i + 1);
        deletedCount++;
      }
    }

    lock.releaseLock();
    clearApiCache(formId);

    if (deletedCount > 0) {
      try {
        generateRekapSheet(formId);
      } catch (e) {}
    }

    const targetLabel = (mode === "KELOMPOK") ? `Kelompok Presentasi '${targetValue}'` : `Sesi '${targetValue}'`;

    return {
      success: true,
      deletedCount: deletedCount,
      message: `${deletedCount} respons untuk ${targetLabel} berhasil dihapus dan rekapitulasi diperbarui.`
    };
  } catch (err) {
    return { success: false, error: "Gagal menghapus respons bersyarat: " + err.toString() };
  }
}

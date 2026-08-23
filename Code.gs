/**
 * ==============================================================================
 * BACKEND REST API - SISTEM PENILAIAN PRESENTASI PGSD KELAS 5E (ULTRA FAST)
 * Spreadsheet ID: 1D7nQcVEbmOKjgcJ6LzKeeDQPQxhAIiCELRC9eP9w7WU
 * Mata Kuliah: Bimbingan Konseling di SD
 * Dosen Pengampu: Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.
 * ==============================================================================
 */

// ==============================================================================
// ⚙️ KONFIGURASI SPREADSHEET
// ==============================================================================
const SPREADSHEET_ID = "1D7nQcVEbmOKjgcJ6LzKeeDQPQxhAIiCELRC9eP9w7WU";

// Nama Tab Spreadsheet Default
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

function getMasterSheet(ss) {
  if (!ss) ss = getSpreadsheet();
  let s = findSheetFlexible(ss, ["Master_Kelompok", "Master Kelompok", "DATA_KELOMPOK_PGSD_5E", "Data_Kelompok", "Data Kelompok", "Kelompok", "Data Penilaian"]);
  if (!s) {
    const sheets = ss.getSheets();
    for (let sh of sheets) {
      if (sh.getLastRow() > 0) {
        const firstRow = sh.getRange(1, 1, 1, Math.min(sh.getLastColumn() || 1, 8)).getValues()[0];
        const hasKelompok = firstRow.some(cell => String(cell).toLowerCase().includes("kelompok"));
        if (hasKelompok) {
          _memoizedSheets["master"] = sh;
          return sh;
        }
      }
    }
    initAllSheets(ss);
    s = ss.getSheetByName(SHEET_MASTER);
  }
  return s;
}

function getConfigSheet(ss) {
  if (!ss) ss = getSpreadsheet();
  let s = findSheetFlexible(ss, ["Konfigurasi", "Config", "CONFIG_APP", "Pengaturan", "Setting"]);
  if (!s) {
    initAllSheets(ss);
    s = ss.getSheetByName(SHEET_CONFIG);
  }
  return s;
}

function getResponsSheet(ss) {
  if (!ss) ss = getSpreadsheet();
  let s = findSheetFlexible(ss, ["Respons_Penilaian", "Respons Penilaian", "RESPONS_PENILAIAN", "Responses", "Jawaban Formulir 1", "Respons"]);
  if (!s) {
    initAllSheets(ss);
    s = ss.getSheetByName(SHEET_RESPONS);
  }
  return s;
}

function getRekapSheet(ss) {
  if (!ss) ss = getSpreadsheet();
  let s = findSheetFlexible(ss, ["Rekap_Nilai", "Rekap Nilai", "REKAP_NILAI", "Rekapitulasi"]);
  if (!s) {
    initAllSheets(ss);
    s = ss.getSheetByName(SHEET_REKAP);
  }
  return s;
}

/**
 * ==============================================================================
 * 🌐 REST API ENDPOINTS (GET & POST) DENGAN CACHE ACCELERATION
 * ==============================================================================
 */

/**
 * Handle HTTP GET Requests (Ultra-Fast Cached & Concurrency Ready)
 */
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";

  // 1. Endpoint Ambil Data Awal Form (Cache Accelerated ~50ms)
  if (action === "getInitialData") {
    const data = getCachedInitialData();
    return createJsonResponse(data);
  }

  // 2. Endpoint Ambil Data Rekapitulasi Nilai (Cache Accelerated ~50ms)
  if (action === "getRecapData") {
    const data = getCachedRecapData();
    return createJsonResponse(data);
  }

  // 3. Endpoint Admin: Ambil Semua Data Master & Config
  if (action === "adminGetFullData") {
    const data = adminGetFullData();
    return createJsonResponse(data);
  }

  // 4. Endpoint Admin: Ambil Seluruh Daftar Respons Penilaian
  if (action === "adminGetResponsesList") {
    const data = adminGetResponsesList();
    return createJsonResponse(data);
  }

  // 5. Fallback Info
  return createJsonResponse({
    status: "API Online",
    spreadsheetId: SPREADSHEET_ID,
    message: "REST API Backend Aktif (High Performance & Cache Accelerated)."
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
    let result = { success: false, error: "Aksi tidak dikenali." };

    if (action === "submitAssessment") {
      result = submitAssessment(payload);
    } else if (action === "getInitialData") {
      result = getCachedInitialData();
    } else if (action === "getRecapData") {
      result = getCachedRecapData();
    } else if (action === "adminGetFullData") {
      result = adminGetFullData();
    } else if (action === "adminGetResponsesList") {
      result = adminGetResponsesList();
    } else if (action === "adminSaveMasterData") {
      result = adminSaveMasterData(payload);
    } else if (action === "adminSaveConfig") {
      result = adminSaveConfig(payload);
    } else if (action === "adminDeleteSingleResponse") {
      result = adminDeleteSingleResponse(payload);
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
 * Ambil Data Awal dengan Cache (Merespons dalam hitungan milidetik)
 */
function getCachedInitialData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("INIT_FORM_DATA_V3");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  const liveData = getFormInitialData();
  if (liveData && liveData.success) {
    try {
      cache.put("INIT_FORM_DATA_V3", JSON.stringify(liveData), 300); // cache 5 menit
    } catch (e) {}
  }
  return liveData;
}

/**
 * Ambil Data Rekapitulasi dengan Cache (Sangat Cepat)
 */
function getCachedRecapData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("REKAP_DATA_CACHE_V3");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  const liveData = getRecapData();
  if (liveData && liveData.success) {
    try {
      cache.put("REKAP_DATA_CACHE_V3", JSON.stringify(liveData), 120); // cache 2 menit
    } catch (e) {}
  }
  return liveData;
}

/**
 * Reset Cache saat Ada Perubahan Data
 */
function clearApiCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove("INIT_FORM_DATA_V3");
    cache.remove("REKAP_DATA_CACHE_V3");
  } catch (e) {}
}

/**
 * Mengambil Data Konfigurasi Spreadsheet
 */
function getConfigMap(ss) {
  if (!ss) ss = getSpreadsheet();
  let sheet = getConfigSheet(ss);
  
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
 * Mengambil Data Awal Form (Langsung & Cepat)
 */
function getFormInitialData() {
  try {
    const ss = getSpreadsheet();
    const config = getConfigMap(ss);
    let masterSheet = getMasterSheet(ss);

    const masterData = masterSheet.getDataRange().getValues();
    const sesiAktif = (config["Sesi_Minggu_Aktif"] || "").trim().toUpperCase();

    const groupsMap = {};

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const kelompok = String(row[0] || "").trim();
      const sesi = String(row[1] || "").trim();
      const nim = String(row[2] || "").trim();
      const nama = String(row[3] || "").trim();
      const status = String(row[4] || "AKTIF").trim().toUpperCase();

      if (!kelompok || !nama) continue;
      if (status === "NONAKTIF") continue;

      const sesiRow = sesi.trim().toUpperCase();
      if (sesiAktif !== "SEMUA" && sesiAktif !== "" && sesiRow !== sesiAktif) {
        continue;
      }

      if (!groupsMap[kelompok]) {
        groupsMap[kelompok] = {
          name: kelompok,
          sesi: sesi,
          members: []
        };
      }

      groupsMap[kelompok].members.push({
        nim: nim,
        name: nama
      });
    }

    const groupList = Object.keys(groupsMap).map(k => groupsMap[k]);

    return {
      success: true,
      config: config,
      groups: groupList,
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

/**
 * Memproses Submission Penilaian (Ultra High Concurrency & Fast Lock Execution)
 */
function submitAssessment(payload) {
  try {
    const email = String(payload.email || "").trim().toLowerCase();
    const namaPenilai = String(payload.namaPenilai || "").trim();
    const kelompok = String(payload.kelompok || "").trim();
    const nilaiKelompok = parseFloat(payload.nilaiKelompok);
    const presentatorTerbaik = Array.isArray(payload.presentatorTerbaik) ? payload.presentatorTerbaik : [];
    const evaluasiDetail = payload.evaluasiDetail || {};

    if (!email || !namaPenilai || !kelompok || isNaN(nilaiKelompok)) {
      return { success: false, error: "Semua kolom wajib diisi dengan benar!" };
    }

    const ss = getSpreadsheet();
    const config = getConfigMap(ss);
    const sesi = String(payload.sesi || config["Sesi_Minggu_Aktif"] || "Minggu 1").trim();

    // 1. Validasi Domain Email
    const allowedDomainsStr = config["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id";
    if (!isValidInstitutionalEmail(email, allowedDomainsStr)) {
      return {
        success: false,
        error: `Format email tidak valid atau bukan domain resmi (${allowedDomainsStr}). Contoh format: nama.nim@mhs.ulm.ac.id`
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
        error: `Anda hanya diperbolehkan memilih maksimal ${maxBest} orang presentator terbaik!`
      };
    }

    // 4. Validasi Karakter Evaluasi
    const maxChars = parseInt(config["Maksimal_Karakter_Evaluasi"] || 500);
    for (let member in evaluasiDetail) {
      const text = String(evaluasiDetail[member] || "").trim();
      if (text.length > maxChars) {
        return {
          success: false,
          error: `Evaluasi untuk ${member} melebihi batas ${maxChars} karakter.`
        };
      }
    }

    // 5. Persiapkan Data Baru
    const idRespons = "RESP-" + Utilities.formatDate(new Date(), "Asia/Makassar", "yyyyMMddHHmmss") + "-" + Math.floor(Math.random() * 1000);
    const timestamp = new Date();
    const best1 = presentatorTerbaik[0] || "-";
    const best2 = presentatorTerbaik[1] || "-";
    const evaluasiJson = JSON.stringify(evaluasiDetail);

    const newRow = [
      idRespons,
      timestamp,
      sesi,
      email,
      namaPenilai,
      kelompok,
      nilaiKelompok,
      best1,
      best2,
      evaluasiJson,
      "VALID"
    ];

    // 6. Zona Kunci Singkat (Lock Duration < 200ms)
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    let responsSheet = getResponsSheet(ss);
    const lastRow = responsSheet.getLastRow();

    if (lastRow > 1) {
      // Ambil hanya kolom Sesi (3), Email (4), Kelompok (6), Status (11) untuk cek duplikat cepat
      const checkData = responsSheet.getRange(2, 1, lastRow - 1, 11).getValues();
      for (let i = 0; i < checkData.length; i++) {
        const rSesi = String(checkData[i][2] || "").trim();
        const rEmail = String(checkData[i][3] || "").trim().toLowerCase();
        const rKelompok = String(checkData[i][5] || "").trim();
        const rStatus = String(checkData[i][10] || "VALID").trim().toUpperCase();

        if (rStatus === "VALID" && rEmail === email && rKelompok === kelompok && rSesi === sesi) {
          lock.releaseLock();
          return {
            success: false,
            error: `Anda (${email}) sudah pernah mengirimkan penilaian untuk ${kelompok} pada ${sesi}.`
          };
        }
      }
    }

    responsSheet.appendRow(newRow);
    lock.releaseLock();

    // 7. Bersihkan Cache API Seketika
    clearApiCache();

    return {
      success: true,
      message: `Penilaian untuk ${kelompok} berhasil disimpan! Terima kasih.`
    };
  } catch (err) {
    return { success: false, error: "Terjadi kesalahan server: " + err.toString() };
  }
}

/**
 * Mengambil Rekap Nilai
 */
function getRecapData() {
  try {
    const ss = getSpreadsheet();
    const config = getConfigMap(ss);
    let responsSheet = getResponsSheet(ss);
    let masterSheet = getMasterSheet(ss);

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

    const rekapByGroup = {};

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

      if (status !== "VALID" || !kelompok || isNaN(nilaiKelompok)) continue;

      if (!rekapByGroup[kelompok]) {
        rekapByGroup[kelompok] = {
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

      const item = rekapByGroup[kelompok];
      item.totalPenilai += 1;
      item.totalSkor += nilaiKelompok;
      if (namaPenilai && !item.evaluators.includes(namaPenilai)) {
        item.evaluators.push(namaPenilai);
      }

      if (best1 && best1 !== "-") {
        item.votePresentator[best1] = (item.votePresentator[best1] || 0) + 1;
      }
      if (best2 && best2 !== "-") {
        item.votePresentator[best2] = (item.votePresentator[best2] || 0) + 1;
      }

      try {
        const evalObj = JSON.parse(evaluasiJsonStr);
        for (let m in evalObj) {
          const ulasan = String(evalObj[m] || "").trim();
          if (ulasan) {
            if (!item.evaluasiList[m]) item.evaluasiList[m] = [];
            item.evaluasiList[m].push({
              penilai: namaPenilai,
              ulasan: ulasan
            });
          }
        }
      } catch (e) {}
    }

    const summaryList = Object.keys(rekapByGroup).map(k => {
      const g = rekapByGroup[k];
      g.rataRataSkor = g.totalPenilai > 0 ? (g.totalSkor / g.totalPenilai).toFixed(2) : "0.00";
      
      const voteArray = Object.keys(g.votePresentator).map(vName => ({
        name: vName,
        votes: g.votePresentator[vName]
      })).sort((a, b) => b.votes - a.votes);

      g.rankedPresenters = voteArray;

      if (!isPublicReviewVisible) {
        g.evaluasiList = {};
      }

      return g;
    });

    return {
      success: true,
      isPublicReviewVisible: isPublicReviewVisible,
      config: config,
      summary: summaryList,
      groupMembersMap: groupMembersMap
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Menuliskan Rekap ke Sheet
 */
function generateRekapSheet() {
  const ss = getSpreadsheet();
  let sheetRekap = ss.getSheetByName(SHEET_REKAP);
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet(SHEET_REKAP);
  }
  sheetRekap.clear();

  const rekapResult = getRecapData();
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
 * Inisialisasi Seluruh Tab Spreadsheet
 */
function initAllSheets(ss) {
  if (!ss) ss = getSpreadsheet();

  // 1. Tab Konfigurasi
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
  }
  if (sheetConfig.getLastRow() === 0) {
    const configData = [
      ["PARAMETER", "NILAI_PENGATURAN", "KETERANGAN"],
      ["Judul_Form", "PENILAIAN PRESENTASI KELAS 5E PGSD 2026", "Judul utama pada halaman web"],
      ["Mata_Kuliah", "Bimbingan Konseling di SD", "Nama mata kuliah"],
      ["Dosen_Pengampu", "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.", "Nama dosen pengampu"],
      ["Kelas", "5E", "Kelas mahasiswa"],
      ["Jurusan", "PGSD", "Jurusan / Program Studi"],
      ["Sesi_Minggu_Aktif", "Minggu 1", "Sesi pertemuan saat ini (Contoh: Minggu 1, Minggu 2, atau 'SEMUA')"],
      ["Domain_Email_Wajib", "mhs.ulm.ac.id, ulm.ac.id", "Domain email yang diizinkan (pisahkan dengan koma)"],
      ["Tampilkan_Ulasan_Publik", "AKTIF", "Pilihan: AKTIF (ulasan terlihat di dashboard) atau SEMBUNYIKAN"],
      ["Nilai_Kelompok_Min", "50", "Batas nilai minimum presentasi"],
      ["Nilai_Kelompok_Max", "100", "Batas nilai maksimum presentasi"],
      ["Maksimal_Karakter_Evaluasi", "500", "Batas karakter per ulasan pemateri"],
      ["Maksimal_Pilihan_Presentator_Terbaik", "2", "Maksimal pemateri terbaik yang boleh dipilih"]
    ];
    sheetConfig.getRange(1, 1, configData.length, 3).setValues(configData);
    formatHeaderRange(sheetConfig.getRange(1, 1, 1, 3), "#1E3A8A", "#FFFFFF");
    sheetConfig.autoResizeColumns(1, 3);
  }

  // 2. Tab Master Kelompok
  let sheetMaster = ss.getSheetByName(SHEET_MASTER);
  if (!sheetMaster) {
    sheetMaster = ss.insertSheet(SHEET_MASTER);
  }
  if (sheetMaster.getLastRow() === 0) {
    const masterHeaders = [
      ["Kelompok", "Sesi_Minggu", "NIM", "Nama_Lengkap", "Status_Aktif"]
    ];
    const sampleMaster = [
      ["Kelompok 1", "Minggu 1", "221012310001", "Ahmad Fauzi", "AKTIF"],
      ["Kelompok 1", "Minggu 1", "221012310002", "Siti Nurhaliza", "AKTIF"],
      ["Kelompok 1", "Minggu 1", "221012310003", "Budi Santoso", "AKTIF"],
      ["Kelompok 1", "Minggu 1", "221012310004", "Dewi Lestari", "AKTIF"],
      ["Kelompok 2", "Minggu 1", "221012310005", "Rian Pratama", "AKTIF"],
      ["Kelompok 2", "Minggu 1", "221012310006", "Putri Rahayu", "AKTIF"],
      ["Kelompok 2", "Minggu 1", "221012310007", "Dimas Anggara", "AKTIF"],
      ["Kelompok 3", "Minggu 2", "221012310008", "Eka Saputra", "AKTIF"],
      ["Kelompok 3", "Minggu 2", "221012310009", "Nabila Putri", "AKTIF"]
    ];
    sheetMaster.getRange(1, 1, 1, 5).setValues(masterHeaders);
    sheetMaster.getRange(2, 1, sampleMaster.length, 5).setValues(sampleMaster);
    formatHeaderRange(sheetMaster.getRange(1, 1, 1, 5), "#047857", "#FFFFFF");
    sheetMaster.autoResizeColumns(1, 5);
  }

  // 3. Tab Respons Penilaian
  let sheetRespons = ss.getSheetByName(SHEET_RESPONS);
  if (!sheetRespons) {
    sheetRespons = ss.insertSheet(SHEET_RESPONS);
  }
  if (sheetRespons.getLastRow() === 0) {
    const responsHeaders = [
      [
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
        "Status"
      ]
    ];
    sheetRespons.getRange(1, 1, 1, responsHeaders[0].length).setValues(responsHeaders);
    formatHeaderRange(sheetRespons.getRange(1, 1, 1, responsHeaders[0].length), "#B91C1C", "#FFFFFF");
    sheetRespons.autoResizeColumns(1, responsHeaders[0].length);
  }

  // 4. Tab Rekap Nilai
  let sheetRekap = ss.getSheetByName(SHEET_REKAP);
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet(SHEET_REKAP);
  }
  if (sheetRekap.getLastRow() === 0) {
    const rekapHeaders = [
      ["Kelompok", "Sesi_Minggu", "Jumlah_Penilai", "Rata_Rata_Nilai", "Presentator_Terbaik_Terbanyak"]
    ];
    sheetRekap.getRange(1, 1, 1, 5).setValues(rekapHeaders);
    formatHeaderRange(sheetRekap.getRange(1, 1, 1, 5), "#1E40AF", "#FFFFFF");
    sheetRekap.autoResizeColumns(1, 5);
  }
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
 * 🔐 ADMIN BACKEND CONTROLLERS (DATA & CONFIG MANAGEMENT)
 * ==============================================================================
 */

/**
 * Mengambil Seluruh Data Master (Aktif/Nonaktif) & Konfigurasi untuk Admin
 */
function adminGetFullData() {
  try {
    const ss = getSpreadsheet();
    const config = getConfigMap(ss);
    let masterSheet = getMasterSheet(ss);
    let responsSheet = getResponsSheet(ss);

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
          status: status, // status kelompok ditentukan oleh anggotanya
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

    return {
      success: true,
      config: config,
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
    let masterSheet = getMasterSheet(ss);

    const groups = payload.groups || [];
    const rowsToWrite = [];

    groups.forEach(grp => {
      const groupName = String(grp.name || "").trim();
      const sesi = String(grp.sesi || "Minggu 1").trim();
      const groupStatus = String(grp.status || "AKTIF").trim().toUpperCase();
      const members = grp.members || [];

      if (!groupName) return;

      if (members.length === 0) {
        // Simpan kelompok meski belum ada anggota
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

    // Bersihkan isi sheet lama (kecuali header baris 1)
    if (masterSheet.getLastRow() > 1) {
      masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 5).clearContent();
    }

    // Tulis baris baru jika ada
    if (rowsToWrite.length > 0) {
      masterSheet.getRange(2, 1, rowsToWrite.length, 5).setValues(rowsToWrite);
    }

    lock.releaseLock();
    clearApiCache();

    return {
      success: true,
      message: `Berhasil memperbarui data ${groups.length} kelompok (${rowsToWrite.length} baris data).`
    };
  } catch (err) {
    return { success: false, error: "Gagal menyimpan data master: " + err.toString() };
  }
}

/**
 * Menyimpan Konfigurasi Sistem Perkuliahan ke CONFIG_APP
 */
function adminSaveConfig(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    let configSheet = getConfigSheet(ss);

    const newConfig = payload.config || {};
    const configData = configSheet.getDataRange().getValues();
    const existingKeys = {};

    for (let i = 1; i < configData.length; i++) {
      const key = String(configData[i][0] || "").trim();
      if (key) {
        existingKeys[key] = i + 1; // Baris 1-based
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

    lock.releaseLock();
    clearApiCache();

    return {
      success: true,
      message: "Konfigurasi sistem perkuliahan berhasil disimpan!"
    };
  } catch (err) {
    return { success: false, error: "Gagal menyimpan konfigurasi: " + err.toString() };
  }
}

/**
 * Mereset / Menghapus Seluruh Respons Penilaian
 */
function adminResetResponses(payload) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = getSpreadsheet();
    let responsSheet = getResponsSheet(ss);
    let rekapSheet = getRekapSheet(ss);

    if (responsSheet && responsSheet.getLastRow() > 1) {
      responsSheet.getRange(2, 1, responsSheet.getLastRow() - 1, responsSheet.getLastColumn()).clearContent();
    }

    if (rekapSheet && rekapSheet.getLastRow() > 1) {
      rekapSheet.getRange(2, 1, rekapSheet.getLastRow() - 1, rekapSheet.getLastColumn()).clearContent();
    }

    lock.releaseLock();
    clearApiCache();

    return {
      success: true,
      message: "Seluruh respons penilaian berhasil dibersihkan."
    };
  } catch (err) {
    return { success: false, error: "Gagal reset respons: " + err.toString() };
  }
}

/**
 * Mengambil Seluruh Daftar Respons Penilaian untuk Admin (Tabel Filterable)
 */
function adminGetResponsesList() {
  try {
    const ss = getSpreadsheet();
    let responsSheet = getResponsSheet(ss);

    if (!responsSheet || responsSheet.getLastRow() <= 1) {
      return { success: true, responses: [] };
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

      if (!email && !namaPenilai && !kelompok) continue;

      responses.push({
        rowIndex: i + 1,
        idRespons: idRespons,
        timestamp: formattedDate,
        sesi: sesi,
        email: email,
        namaPenilai: namaPenilai,
        kelompok: kelompok,
        nilaiKelompok: nilaiKelompok,
        best1: best1,
        best2: best2,
        evaluasiDetail: evaluasiJsonStr,
        status: status
      });
    }

    // Urutkan dari yang paling baru (Newest first)
    return {
      success: true,
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
    let responsSheet = getResponsSheet(ss);

    if (!responsSheet || responsSheet.getLastRow() <= 1) {
      lock.releaseLock();
      return { success: false, error: "Data respons kosong." };
    }

    const idTarget = String(payload.idRespons || "").trim();
    const data = responsSheet.getDataRange().getValues();
    let targetRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || "").trim() === idTarget) {
        targetRow = i + 1; // 1-based row
        break;
      }
    }

    if (targetRow === -1 && payload.rowIndex) {
      targetRow = parseInt(payload.rowIndex);
    }

    if (targetRow > 1 && targetRow <= responsSheet.getLastRow()) {
      responsSheet.deleteRow(targetRow);
      lock.releaseLock();
      clearApiCache();

      try {
        generateRekapSheet();
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

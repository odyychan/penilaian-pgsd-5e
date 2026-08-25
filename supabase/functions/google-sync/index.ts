import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import crypto from "node:crypto";

// =========================================================================
// ⚙️ GOOGLE WORKSPACE & SERVICE ACCOUNT CONFIGURATION
// =========================================================================
const DEFAULT_SPREADSHEET_ID = "1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4";
const DEFAULT_DRIVE_FOLDER_ID = "1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceAccount(): any {
  const b64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_B64");
  if (b64) {
    const jsonStr = atob(b64.trim());
    return JSON.parse(jsonStr);
  }
  const secret = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "";
  if (secret) {
    return JSON.parse(secret);
  }
  throw new Error("Secret GOOGLE_SERVICE_ACCOUNT_B64 belum dikonfigurasi di Supabase Secrets.");
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let _cachedToken = { token: "", expiresAt: 0 };

async function getGoogleOAuthToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken.token && _cachedToken.expiresAt > now + 60) {
    return _cachedToken.token;
  }

  const sa = getServiceAccount();
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encClaim = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encHeader}.${encClaim}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);
  let privKey = String(sa.private_key || "").trim();
  privKey = privKey.replace(/\\n/g, "\n");
  if (!privKey.endsWith("\n")) privKey += "\n";

  const signature = signer
    .sign(privKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error("Gagal memperoleh OAuth token dari Google: " + JSON.stringify(tokenData));
  }

  _cachedToken = {
    token: tokenData.access_token,
    expiresAt: now + (tokenData.expires_in || 3600),
  };

  return _cachedToken.token;
}

// Helper Drive: Cari atau buat folder
async function getOrCreateDriveFolder(token: string, folderName: string, parentFolderId?: string): Promise<string> {
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createBody: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) {
    createBody.parents = [parentFolderId];
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(createBody)
  });
  const createData = await createRes.json();
  return createData.id;
}

// Helper Drive: Unlink & Trash Folder/File secara tuntas
async function unlinkAndTrashDriveItem(token: string, fileId: string, parentFolderId: string): Promise<void> {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?removeParents=${parentFolderId}&supportsAllDrives=true`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
  } catch(e) {}

  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ trashed: true })
    });
  } catch(e) {}
}

// Helper Sheets: Dapatkan daftar sheets yang ada di spreadsheet
async function getSpreadsheetSheets(token: string, spreadsheetId: string): Promise<any[]> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return data.sheets || [];
  } catch (e) {
    return [];
  }
}

// Helper Sheets: Buat sheet baru jika belum ada
async function ensureSheetExists(token: string, spreadsheetId: string, sheetTitle: string, headerRow: string[]): Promise<void> {
  try {
    const existing = await getSpreadsheetSheets(token, spreadsheetId);
    const found = existing.find((s: any) => s.properties?.title === sheetTitle);
    if (!found) {
      // 1. Buat sheet baru
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: sheetTitle } } }]
        })
      });

      // 2. Isi header
      if (headerRow && headerRow.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1?valueInputOption=USER_ENTERED`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: [headerRow] })
        });
      }
    }
  } catch (e) {}
}

// Helper Sheets: Hapus sheets berdasarkan form ID
async function deleteSheetsForForm(token: string, spreadsheetId: string, formId: string): Promise<number> {
  try {
    const existing = await getSpreadsheetSheets(token, spreadsheetId);
    const prefixes = [`Master_${formId}`, `Config_${formId}`, `Respons_${formId}`, `Rekap_${formId}`];
    const toDelete = existing.filter((s: any) => prefixes.includes(s.properties?.title));

    if (toDelete.length > 0) {
      const requests = toDelete.map((s: any) => ({
        deleteSheet: { sheetId: s.properties.sheetId }
      }));
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests })
      });
      return toDelete.length;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

// Main Handler
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let payload: any = {};
    if (req.method === "POST") {
      try {
        payload = await req.json();
      } catch (e) {
        payload = {};
      }
    } else {
      const url = new URL(req.url);
      payload = Object.fromEntries(url.searchParams.entries());
    }

    const action = payload.action || "status";
    const token = await getGoogleOAuthToken();
    const sa = getServiceAccount();
    const spreadsheetId = payload.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const rootFolderId = payload.driveFolderId || payload.driveFolderName || DEFAULT_DRIVE_FOLDER_ID;

    // 1. Action: Status Check
    if (action === "status" || action === "test") {
      return new Response(
        JSON.stringify({
          success: true,
          status: "Google Cloud Service Account Online",
          botEmail: sa.client_email,
          defaultDriveFolder: DEFAULT_DRIVE_FOLDER_ID,
          defaultSpreadsheet: DEFAULT_SPREADSHEET_ID,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Action: Hapus Berkas dari Google Drive
    if (action === "adminDeleteMedia" || action === "deleteDriveFile") {
      let target = payload.fileId || payload.fileUrl || payload.url || "";
      let fileId = target;
      if (target.includes("id=")) {
        const match = target.match(/id=([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
      } else if (target.includes("/d/")) {
        const match = target.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
      }

      if (!fileId) {
        return new Response(
          JSON.stringify({ success: false, error: "ID berkas Google Drive tidak ditemukan." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await unlinkAndTrashDriveItem(token, fileId, rootFolderId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Berkas Google Drive berhasil dipindahkan ke Sampah secara bersih.",
          fileId: fileId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Action: Hapus Formulir & Folder Drive & Sheet Terkait (Total Zero-Orphan Deletion)
    if (action === "adminDeleteForm") {
      const targetFormId = String(payload.formId || "").trim().toUpperCase();

      if (!targetFormId) {
        return new Response(
          JSON.stringify({ success: false, error: "formId wajib diisi." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // A. Cari folder form di Google Drive dan unparent/trash
      const query = `name = '${targetFormId}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`;
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      const trashedCount = (searchData.files || []).length;

      if (searchData.files && searchData.files.length > 0) {
        for (const f of searchData.files) {
          await unlinkAndTrashDriveItem(token, f.id, rootFolderId);
        }
      }

      // B. Hapus sheet terisolasi di Google Spreadsheet
      const deletedSheetsCount = await deleteSheetsForForm(token, spreadsheetId, targetFormId);

      return new Response(
        JSON.stringify({
          success: true,
          formId: targetFormId,
          trashedFolderCount: trashedCount,
          deletedSheetsCount: deletedSheetsCount,
          message: `Formulir '${targetFormId}', ${trashedCount} folder Google Drive, dan ${deletedSheetsCount} sheet berhasil dibersihkan secara total.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Action: Buat / Kloning Form Baru (Create Drive Folder & Isolated Sheets)
    if (action === "adminCreateForm" || action === "adminCloneForm") {
      const formId = String(payload.customFormId || payload.formId || "BARU").trim().toUpperCase();

      // A. Buat Struktur Folder di Google Drive
      const formFolderId = await getOrCreateDriveFolder(token, formId, rootFolderId);
      const mediaFolderId = await getOrCreateDriveFolder(token, "Media_Formulir", formFolderId);
      const lampiranFolderId = await getOrCreateDriveFolder(token, "Lampiran_Mahasiswa", formFolderId);

      // B. Buat Sheet Terisolasi di Google Spreadsheet
      await ensureSheetExists(token, spreadsheetId, `Master_${formId}`, ["Kelompok", "Sesi_Minggu", "NIM", "Nama_Lengkap", "Status_Aktif"]);
      await ensureSheetExists(token, spreadsheetId, `Config_${formId}`, ["PARAMETER", "NILAI_PENGATURAN", "KETERANGAN"]);
      await ensureSheetExists(token, spreadsheetId, `Respons_${formId}`, ["Timestamp", "Form_ID", "ID_Kelompok", "Kelompok_Dinilai", "NIM_Penilai", "Nama_Penilai", "Total_Skor"]);
      await ensureSheetExists(token, spreadsheetId, `Rekap_${formId}`, ["Kelompok", "Sesi", "Jumlah_Penilai", "Rata_Rata_Skor", "Nilai_Akhir", "Grade"]);

      return new Response(
        JSON.stringify({
          success: true,
          formId: formId,
          driveFolderId: formFolderId,
          mediaFolderId: mediaFolderId,
          lampiranFolderId: lampiranFolderId,
          message: `Formulir '${formId}' beserta struktur folder Google Drive dan sheet berhasil disiapkan secara real-time!`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Action: Pembersihan Massal Folder & Sheet Sampah / Yatim (Zero-Orphan Cleanup)
    if (action === "adminCleanupOrphanedFolders") {
      const activeForms = Array.isArray(payload.activeFormIds) 
        ? payload.activeFormIds.map((f: any) => String(f).trim().toUpperCase()).filter(Boolean)
        : ["BK5E"];
      if (!activeForms.includes("BK5E")) activeForms.push("BK5E");

      const query = `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listRes.json();
      const trashedNames: string[] = [];

      if (listData.files && listData.files.length > 0) {
        for (const f of listData.files) {
          const fName = String(f.name || "").trim().toUpperCase();
          if (!activeForms.includes(fName) && fName !== "ARSIP" && fName !== "BACKUP" && fName !== "MEDIA") {
            await unlinkAndTrashDriveItem(token, f.id, rootFolderId);
            trashedNames.push(fName);
          }
        }
      }

      // Cleanup Orphaned Sheets in Spreadsheet
      const existingSheets = await getSpreadsheetSheets(token, spreadsheetId);
      const defaultPreserved = ["SHEET1", "REGISTRY_FORMS", "KONFIGURASI", "MASTER_KELOMPOK", "DAFTAR_FORMULIR", "RESPONS_PENILAIAN", "REKAP_NILAI"];
      const sheetsToDelete: any[] = [];

      for (const s of existingSheets) {
        const title = s.properties?.title || "";
        const titleUpper = title.trim().toUpperCase();
        const prefixes = ["MASTER_", "CONFIG_", "RESPONS_", "REKAP_"];
        for (const pfx of prefixes) {
          if (titleUpper.startsWith(pfx)) {
            const potId = titleUpper.replace(pfx, "").trim();
            if (potId && !activeForms.includes(potId) && !defaultPreserved.includes(titleUpper)) {
              sheetsToDelete.push(s.properties);
              break;
            }
          }
        }
      }

      if (sheetsToDelete.length > 0) {
        const requests = sheetsToDelete.map((sp: any) => ({
          deleteSheet: { sheetId: sp.sheetId }
        }));
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ requests })
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          trashedFolders: trashedNames,
          deletedSheetsCount: sheetsToDelete.length,
          message: `Berhasil membersihkan ${trashedNames.length} folder sampah dan ${sheetsToDelete.length} sheet yatim di Google Drive & Spreadsheet.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Action: Sinkronisasi Massal Semua Form
    if (action === "adminSyncAllForms") {
      const forms = Array.isArray(payload.forms) ? payload.forms : [];
      const syncedResults = [];

      for (let i = 0; i < forms.length; i++) {
        const f = forms[i];
        const formId = String(f.form_id || f.formId || "").trim().toUpperCase();
        if (!formId) continue;

        const formFolderId = await getOrCreateDriveFolder(token, formId, rootFolderId);
        await getOrCreateDriveFolder(token, "Media_Formulir", formFolderId);
        await getOrCreateDriveFolder(token, "Lampiran_Mahasiswa", formFolderId);

        await ensureSheetExists(token, spreadsheetId, `Master_${formId}`, ["Kelompok", "Sesi_Minggu", "NIM", "Nama_Lengkap", "Status_Aktif"]);
        await ensureSheetExists(token, spreadsheetId, `Config_${formId}`, ["PARAMETER", "NILAI_PENGATURAN", "KETERANGAN"]);
        await ensureSheetExists(token, spreadsheetId, `Respons_${formId}`, ["Timestamp", "Form_ID", "ID_Kelompok", "Kelompok_Dinilai", "NIM_Penilai", "Nama_Penilai", "Total_Skor"]);
        await ensureSheetExists(token, spreadsheetId, `Rekap_${formId}`, ["Kelompok", "Sesi", "Jumlah_Penilai", "Rata_Rata_Skor", "Nilai_Akhir", "Grade"]);

        syncedResults.push({
          formId: formId,
          driveFolderId: formFolderId
        });
      }

      // Auto-cleanup orphaned subfolders on Drive & Spreadsheet
      const activeIds = forms.map((f: any) => String(f.form_id || f.formId || "").trim().toUpperCase()).filter(Boolean);
      if (!activeIds.includes("BK5E")) activeIds.push("BK5E");

      const query = `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listRes.json();
      const trashedNames: string[] = [];

      if (listData.files && listData.files.length > 0) {
        for (const f of listData.files) {
          const fName = String(f.name || "").trim().toUpperCase();
          if (!activeIds.includes(fName) && fName !== "ARSIP" && fName !== "BACKUP" && fName !== "MEDIA") {
            await unlinkAndTrashDriveItem(token, f.id, rootFolderId);
            trashedNames.push(fName);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Berhasil menyinkronkan ${syncedResults.length} formulir dan membersihkan ${trashedNames.length} folder sampah di Google Drive & Spreadsheet!`,
          syncedCount: syncedResults.length,
          trashedFolders: trashedNames,
          results: syncedResults
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback
    return new Response(
      JSON.stringify({ success: false, error: "Aksi tidak dikenali: " + action }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || err.toString() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

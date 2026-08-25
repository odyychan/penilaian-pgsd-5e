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

      const trashRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ trashed: true })
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Berkas Google Drive berhasil dipindahkan ke Sampah secara bersih.",
          fileId: fileId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Action: Sinkronisasi Massal Semua Form
    if (action === "adminSyncAllForms") {
      const forms = Array.isArray(payload.forms) ? payload.forms : [];
      const rootFolderId = payload.driveFolderId || DEFAULT_DRIVE_FOLDER_ID;

      const syncedResults = [];

      for (let i = 0; i < forms.length; i++) {
        const f = forms[i];
        const formId = String(f.form_id || f.formId || "").trim().toUpperCase();
        if (!formId) continue;

        const formFolderId = await getOrCreateDriveFolder(token, formId, rootFolderId);
        await getOrCreateDriveFolder(token, "Media_Formulir", formFolderId);
        await getOrCreateDriveFolder(token, "Lampiran_Mahasiswa", formFolderId);

        syncedResults.push({
          formId: formId,
          driveFolderId: formFolderId
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Berhasil menyinkronkan ${syncedResults.length} formulir ke Google Drive & Spreadsheet via Service Account!`,
          syncedCount: syncedResults.length,
          results: syncedResults
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Action: Buat Form Baru
    if (action === "adminCreateForm") {
      const formId = String(payload.customFormId || payload.formId || "BARU").trim().toUpperCase();
      const rootFolderId = payload.driveFolderId || DEFAULT_DRIVE_FOLDER_ID;

      const formFolderId = await getOrCreateDriveFolder(token, formId, rootFolderId);
      await getOrCreateDriveFolder(token, "Media_Formulir", formFolderId);
      await getOrCreateDriveFolder(token, "Lampiran_Mahasiswa", formFolderId);

      return new Response(
        JSON.stringify({
          success: true,
          formId: formId,
          driveFolderId: formFolderId,
          message: `Formulir '${formId}' berhasil disiapkan di Google Drive & Spreadsheet!`
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

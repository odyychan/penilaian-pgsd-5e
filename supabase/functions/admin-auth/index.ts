import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSalt() {
  return (Deno.env.get("ADMIN_SALT") || Deno.env.get("PGSD_ADMIN_SALT") || "pgsd_5e_secret_salt_2026").trim();
}
function getSigningKey() {
  return (Deno.env.get("ADMIN_SIGNING_KEY") || Deno.env.get("PGSD_SIGNING_KEY") || "c78912e54f0a4593bc82136e7a2b9041d8e57390f12a3b4c5d6e7f8091a2b3c4").trim();
}
function getSupabaseCredentials() {
  return { url: Deno.env.get("SUPABASE_URL") || null, serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || null };
}

async function hashPassword(pass) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pass + "_" + getSalt());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSigningSecretFromDb() {
  const { url, serviceKey } = getSupabaseCredentials();
  if (!url || !serviceKey) return null;
  try {
    const res = await fetch(`${url}/rest/v1/pgsd_admin_secrets?key=eq.ADMIN_SIGNING_SECRET&select=value_hash`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
    if (res.ok) { const rows = await res.json(); if (rows && rows.length > 0 && rows[0].value_hash) return rows[0].value_hash; }
  } catch {}
  return null;
}

async function createSessionToken(signingSecret) {
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ role: "admin", iat: now, exp: expiresAt });
  const secretKey = (signingSecret || getSigningKey()) + "_" + getSalt();
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { token: `${btoa(payload)}.${sigHex}`, expiresAt };
}

async function verifySessionToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [b64Payload, sigHex] = parts;
    const payloadStr = atob(b64Payload);
    const payload = JSON.parse(payloadStr);
    if (!payload.exp || Date.now() > payload.exp) return false;
    if (payload.role !== "admin") return false;
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const dbKey = await getSigningSecretFromDb();
    const keysToTry = dbKey ? [dbKey + "_" + getSalt(), getSigningKey() + "_" + getSalt()] : [getSigningKey() + "_" + getSalt()];
    const encoder = new TextEncoder();
    for (const secretKey of keysToTry) {
      try {
        const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
        const valid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, encoder.encode(payloadStr));
        if (valid) return true;
      } catch {}
    }
    return false;
  } catch { return false; }
}

async function verifyInputPassword(inputPass) {
  const { url, serviceKey } = getSupabaseCredentials();
  if (url && serviceKey) {
    try {
      const inputHash = await hashPassword(inputPass);
      const res = await fetch(`${url}/rest/v1/pgsd_admin_secrets?key=eq.ADMIN_PASSWORD_HASH&select=value_hash`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].value_hash) {
          if (inputHash === rows[0].value_hash) return { valid: true, source: "SUPABASE_DB_CUSTOM" };
          return { valid: false, source: "DB_MISMATCH" };
        }
      }
    } catch {}
  }
  const envPass = (Deno.env.get("ADMIN_PASSWORD") || Deno.env.get("PGSD_ADMIN_PASSWORD") || "").trim();
  if (envPass && inputPass === envPass) {
    savePasswordHashToDatabase(inputPass).catch(() => {});
    saveSigningSecretToDatabase().catch(() => {});
    return { valid: true, source: "SUPABASE_ENV_SECRET" };
  }
  return { valid: false, source: "UNKNOWN" };
}

async function savePasswordHashToDatabase(newPass) {
  const { url, serviceKey } = getSupabaseCredentials();
  if (!url || !serviceKey) return false;
  try {
    const newHash = await hashPassword(newPass);
    const res = await fetch(`${url}/rest/v1/pgsd_admin_secrets`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ key: "ADMIN_PASSWORD_HASH", value_hash: newHash, updated_at: new Date().toISOString() }),
    });
    return res.ok;
  } catch { return false; }
}

async function saveSigningSecretToDatabase() {
  const { url, serviceKey } = getSupabaseCredentials();
  if (!url || !serviceKey) return false;
  const existing = await getSigningSecretFromDb();
  if (existing) return true;
  try {
    const res = await fetch(`${url}/rest/v1/pgsd_admin_secrets`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ key: "ADMIN_SIGNING_SECRET", value_hash: getSigningKey(), updated_at: new Date().toISOString() }),
    });
    return res.ok;
  } catch { return false; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let body = {};
    if (req.method === "POST") { try { body = await req.json(); } catch { body = {}; } }
    const action = body.action || url.searchParams.get("action") || "verify";

    if (action === "status") {
      const envPass = Deno.env.get("ADMIN_PASSWORD") || Deno.env.get("PGSD_ADMIN_PASSWORD");
      const { url: sbUrl, serviceKey } = getSupabaseCredentials();
      if (sbUrl && serviceKey) saveSigningSecretToDatabase().catch(() => {});
      return new Response(JSON.stringify({ success: true, auth_ready: true, has_env_secret: !!(envPass && envPass.trim()), has_db_config: !!(sbUrl && serviceKey) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    if (action === "verify") {
      const inputPass = String(body.password || "").trim();
      if (!inputPass) return new Response(JSON.stringify({ success: false, error: "Kata sandi wajib diisi." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      const { valid, source } = await verifyInputPassword(inputPass);
      if (valid) {
        saveSigningSecretToDatabase().catch(() => {});
        const dbKey = await getSigningSecretFromDb();
        const { token, expiresAt } = await createSessionToken(dbKey || undefined);
        return new Response(JSON.stringify({ success: true, message: "Autentikasi admin berhasil.", token, expires_at: expiresAt, source }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return new Response(JSON.stringify({ success: false, error: "Kata sandi admin tidak valid. Akses ditolak." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
      }
    }

    if (action === "verify_token") {
      const token = String(body.token || "").trim();
      const isValid = await verifySessionToken(token);
      return new Response(JSON.stringify({ success: isValid, valid: isValid }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: isValid ? 200 : 401 });
    }

    if (action === "change_password" || action === "update_password") {
      const currentPass = String(body.current_password || "").trim();
      const newPass = String(body.new_password || "").trim();
      if (!currentPass || !newPass) return new Response(JSON.stringify({ success: false, error: "Kata sandi lama dan baru wajib diisi." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      if (newPass.length < 6) return new Response(JSON.stringify({ success: false, error: "Kata sandi baru minimal 6 karakter." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      const { valid: isCurrentValid } = await verifyInputPassword(currentPass);
      if (!isCurrentValid) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return new Response(JSON.stringify({ success: false, error: "Kata sandi saat ini tidak cocok. Periksa kembali." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
      }
      const { url: sbUrl, serviceKey } = getSupabaseCredentials();
      if (!sbUrl || !serviceKey) return new Response(JSON.stringify({ success: false, error: "Konfigurasi database tidak tersedia. Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY diatur di Supabase Edge Function Secrets." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
      const saved = await savePasswordHashToDatabase(newPass);
      if (!saved) return new Response(JSON.stringify({ success: false, error: "Gagal menyimpan kata sandi ke database. Pastikan tabel pgsd_admin_secrets sudah dibuat via SQL Editor." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
      await saveSigningSecretToDatabase();
      const dbKey = await getSigningSecretFromDb();
      const { token, expiresAt } = await createSessionToken(dbKey || undefined);
      return new Response(JSON.stringify({ success: true, message: "Kata sandi admin berhasil diperbarui dan tersinkron ke database secara aman.", token, expires_at: expiresAt, saved_to_database: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: `Aksi "${action}" tidak dikenal.` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Internal Server Error" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});

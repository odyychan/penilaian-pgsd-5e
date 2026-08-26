import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// =========================================================================
// 🛡️ SUPABASE EDGE FUNCTION: SECURE ADMIN AUTHENTICATION & PASSWORD MANAGER
// =========================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SALT = "pgsd_5e_secret_salt_2026";
const FALLBACK_PASS = "admin5e";

// Helper: Hash password with SHA-256
async function hashPassword(pass: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pass + "_" + DEFAULT_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper: Sign session token with HMAC-SHA256
async function createSessionToken(secretKey: string): Promise<{ token: string; expiresAt: number }> {
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
  const payload = JSON.stringify({ role: "admin", iat: now, exp: expiresAt });

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey + "_" + DEFAULT_SALT);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const b64Payload = btoa(payload);
  const token = `${b64Payload}.${sigHex}`;
  return { token, expiresAt };
}

// Helper: Verify session token
async function verifySessionToken(token: string, secretKey: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [b64Payload, sigHex] = parts;
    const payloadStr = atob(b64Payload);
    const payload = JSON.parse(payloadStr);

    if (!payload.exp || Date.now() > payload.exp) return false;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey + "_" + DEFAULT_SALT);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = new Uint8Array(
      sigHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, encoder.encode(payloadStr));
  } catch {
    return false;
  }
}

// Helper: Get active admin password
async function getEffectiveAdminPassword(): Promise<{ password: string; source: string }> {
  // 1. Priority 1: Supabase Secrets (ADMIN_PASSWORD or PGSD_ADMIN_PASSWORD)
  const envPass = Deno.env.get("ADMIN_PASSWORD") || Deno.env.get("PGSD_ADMIN_PASSWORD");
  if (envPass && envPass.trim() !== "") {
    return { password: envPass.trim(), source: "SUPABASE_ENV_SECRET" };
  }

  // 2. Priority 2: Database stored custom password
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (supabaseUrl && serviceKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/pgsd_form_configs?form_id=eq.GLOBAL&select=config_json`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].config_json) {
          const cfg = rows[0].config_json;
          if (cfg.admin_password && cfg.admin_password.trim() !== "") {
            return { password: cfg.admin_password.trim(), source: "SUPABASE_DB_CUSTOM" };
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  // 3. Priority 3: Fallback default
  return { password: FALLBACK_PASS, source: "DEFAULT_FALLBACK" };
}

// Helper: Save new password to database
async function savePasswordToDatabase(newPass: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return false;

  try {
    const payload = {
      form_id: "GLOBAL",
      config_json: {
        admin_password: newPass,
        updated_at: new Date().toISOString(),
      },
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/pgsd_form_configs`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch {
    return false;
  }
}

// =========================================================================
// 🚀 MAIN HTTP HANDLER
// =========================================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let body: any = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const action = body.action || url.searchParams.get("action") || "verify";
    const { password: activePassword, source } = await getEffectiveAdminPassword();

    // ACTION: STATUS
    if (action === "status") {
      return new Response(
        JSON.stringify({
          success: true,
          auth_ready: true,
          secret_source: source,
          has_env_secret: source === "SUPABASE_ENV_SECRET",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ACTION: VERIFY
    if (action === "verify") {
      const inputPass = String(body.password || "").trim();
      if (!inputPass) {
        return new Response(
          JSON.stringify({ success: false, error: "Kata sandi wajib diisi." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (inputPass === activePassword) {
        const { token, expiresAt } = await createSessionToken(activePassword);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Autentikasi admin berhasil.",
            token: token,
            expires_at: expiresAt,
            source: source,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Kata sandi admin tidak valid. Akses ditolak.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
    }

    // ACTION: VERIFY_TOKEN
    if (action === "verify_token") {
      const token = String(body.token || "").trim();
      const isValid = await verifySessionToken(token, activePassword);
      return new Response(
        JSON.stringify({ success: isValid, valid: isValid }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: isValid ? 200 : 401 }
      );
    }

    // ACTION: CHANGE_PASSWORD
    if (action === "change_password" || action === "update_password") {
      const currentPass = String(body.current_password || "").trim();
      const newPass = String(body.new_password || "").trim();

      if (!currentPass || !newPass) {
        return new Response(
          JSON.stringify({ success: false, error: "Kata sandi lama dan baru wajib diisi." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (currentPass !== activePassword) {
        return new Response(
          JSON.stringify({ success: false, error: "Kata sandi saat ini tidak cocok." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      if (newPass.length < 4) {
        return new Response(
          JSON.stringify({ success: false, error: "Kata sandi baru minimal 4 karakter." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const saved = await savePasswordToDatabase(newPass);
      const { token, expiresAt } = await createSessionToken(newPass);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Kata sandi admin berhasil diperbarui di database Supabase.",
          token: token,
          expires_at: expiresAt,
          saved_to_database: saved,
          notice:
            source === "SUPABASE_ENV_SECRET"
              ? "Catatan: Nilai secret ADMIN_PASSWORD di Supabase Secrets mendahului database. Jika ingin menggunakan kata sandi baru secara permanen, perbarui juga ADMIN_PASSWORD di Supabase Secrets Dashboard."
              : "Kata sandi baru telah aktif secara instan.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Aksi "${action}" tidak dikenal.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal Server Error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

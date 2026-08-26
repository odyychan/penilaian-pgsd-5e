/* ============================================
 * Module: shared/config
 * Constants, SUPABASE_CONFIG, global state variables
 * ============================================ */

    const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbxEa3t09i1hk-VBEHxz99zus8Q8D67G8LaoewN6o000nIQCC5yRPFji7WWHnqip2jlvoQ/exec";
    const DEFAULT_DRIVE_FOLDER_ID = "1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK";
    const DEFAULT_SPREADSHEET_ID = "1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4";
    const GOOGLE_SYNC_EDGE_URL = "https://eychjnqmqpxzxukiwbqf.supabase.co/functions/v1/google-sync";
    const ADMIN_AUTH_EDGE_URL = "https://eychjnqmqpxzxukiwbqf.supabase.co/functions/v1/admin-auth";
    const DEFAULT_PRIMARY_FORM_ID = "BK5E";

    // High-Performance Supabase Backend Configuration
    const SUPABASE_CONFIG = {
      url: "https://eychjnqmqpxzxukiwbqf.supabase.co",
      anonKey: "sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp"
    };

    let supabaseClient = null;
    function getSupabaseClient() {
      if (!supabaseClient && window.supabase && typeof window.supabase.createClient === "function") {
        try {
          supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        } catch(e) {
          console.warn("Supabase admin client init error:", e);
        }
      }
      return supabaseClient;
    }

    async function ensureSupabaseClient(maxRetries = 25, intervalMs = 40) {
      if (supabaseClient) return supabaseClient;
      if (window.supabase && typeof window.supabase.createClient === "function") {
        return getSupabaseClient();
      }
      for (let i = 0; i < maxRetries; i++) {
        await new Promise(r => setTimeout(r, intervalMs));
        if (window.supabase && typeof window.supabase.createClient === "function") {
          return getSupabaseClient();
        }
      }
      return getSupabaseClient();
    }

    // Application State
    let formsRegistryList = [];
    let currentFormId = null; // null = Master Hub View; 'BK5E' = Workspace View
    let currentFormMeta = null;
    let adminMasterGroups = [];
    let adminAppConfig = {};
    let adminCustomQuestions = [];
    let adminResponsesList = [];
    let currentAdminTab = 'data';
    let isSyncingQueue = false;
    let configDebounceTimer = null;

    function getApiUrl() {
      return (typeof adminAppConfig !== 'undefined' && adminAppConfig && adminAppConfig["Spreadsheet_Webhook_Url"])
        || localStorage.getItem("PGSD_GLOBAL_API_URL")
        || localStorage.getItem("PGSD_API_URL")
        || DEFAULT_API_URL;
    }

    function getEffectiveApiUrl() {
      return getApiUrl();
    }

    function getAdminApiUrl() {
      return getApiUrl();
    }

    
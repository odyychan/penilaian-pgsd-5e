# PLAN.md --- Integrasi Google Cloud OAuth + Supabase Auth untuk Form Penilaian Mahasiswa

## 0. Instruksi Utama untuk Agent Antigravity

Implementasikan integrasi autentikasi Google OAuth melalui Supabase Auth
pada aplikasi penilaian mahasiswa **tanpa merusak fitur existing**.

Prioritas implementasi:

1.  Tidak boleh terjadi **OAuth login loop**.
2.  Setelah mahasiswa menekan **Mulai Mengisi Penilaian**, login Google,
    dan kembali dari OAuth callback, mahasiswa harus **langsung
    diteruskan ke form** setelah session, domain, dan roster
    tervalidasi.
3.  `formId`, terutama `DEBUG`, tidak boleh hilang selama OAuth
    redirect.
4.  Session harus dipulihkan secara deterministik sebelum UI memutuskan
    bahwa user belum login.
5.  `onAuthStateChange()` hanya berfungsi sebagai listener perubahan
    auth, **bukan satu-satunya sumber kebenaran untuk initial session
    recovery**.
6.  Semua pengujian remote/end-to-end harus dilakukan pada form sandbox
    `DEBUG` sesuai `AGENTS.md`.
7.  Jangan mengubah production data atau melakukan pengujian destructive
    pada form produksi.
8.  Pertahankan backward compatibility dengan mode form yang sudah ada.
9.  Jangan melakukan refactor besar yang tidak diperlukan. Lakukan
    perubahan minimal, terukur, dan mudah diaudit.
10. Sebelum mengubah file, baca struktur repository, `AGENTS.md`,
    implementasi auth yang sudah ada, schema/config form, dan fungsi
    draft existing.

------------------------------------------------------------------------

# 1. Tujuan

Mengintegrasikan Google Sign-In resmi menggunakan:

-   Google Cloud OAuth 2.0
-   Supabase Auth
-   PKCE OAuth flow
-   Google profile metadata
-   Supabase session persistence

Integrasi harus menyediakan:

-   autentikasi Google sebelum pengisian form bila diwajibkan;
-   validasi domain berdasarkan konfigurasi form;
-   pengisian identitas otomatis;
-   identitas read-only setelah diverifikasi;
-   pencocokan NIM terhadap roster `pgsd_students`;
-   account switcher;
-   isolasi draft berdasarkan akun Google;
-   pemulihan session setelah refresh;
-   recovery OAuth callback yang deterministic;
-   proteksi terhadap login loop.

------------------------------------------------------------------------

# 2. Scope

## 2.1 File Utama

  ---------------------------------------------------------------------------------
  File                           Status                  Tujuan
  ------------------------------ ----------------------- --------------------------
  `src/student/student.js`       MODIFY                  OAuth, auth state, auth
                                                         gate, profile, roster,
                                                         draft isolation

  `index.html`                   MODIFY                  Google Auth Gate, account
                                                         bar, domain mismatch UI

  `src/admin/admin.js`           MODIFY                  Persistensi
                                                         `Mode_Pengumpulan_Email`

  `docs/google_oauth_setup.md`   NEW                     Panduan Google Cloud +
                                                         Supabase

  `AGENTS.md`                    READ ONLY kecuali       Ikuti aturan
                                 benar-benar diperlukan  sandbox/testing
  ---------------------------------------------------------------------------------

Agent harus mencari file lain yang berkaitan dengan Supabase
initialization, CSS, config, atau form rendering sebelum implementasi.
Jangan membuat duplikasi Supabase client apabila client existing sudah
tersedia.

------------------------------------------------------------------------

# 3. Mode Pengumpulan Email

Konfigurasi form memiliki tiga mode.

  ------------------------------------------------------------------------------------------
  Mode               Login Google Domain              Identitas     Draft
  ------------- ----------------- ------------------- ------------- ------------------------
  `ULM_ONLY`                Wajib `@mhs.ulm.ac.id`,   Google +      Per akun
                                  `@ulm.ac.id`        roster        

  `ALL_EMAIL`               Wajib Semua akun Google   Google        Per akun

  `NO_EMAIL`          Tidak wajib Tidak berlaku       Existing      Anonymous/session-safe
                                                      anonymous     
                                                      flow          
  ------------------------------------------------------------------------------------------

## 3.1 ULM_ONLY

Hanya menerima alamat yang secara case-insensitive berakhir dengan:

``` text
@mhs.ulm.ac.id
@ulm.ac.id
```

Dilarang menggunakan validasi seperti:

``` js
email.includes('ulm.ac.id')
```

Gunakan exact suffix validation.

Contoh:

``` js
function isUlmEmail(email = '') {
  const normalized = String(email).trim().toLowerCase();

  return (
    normalized.endsWith('@mhs.ulm.ac.id') ||
    normalized.endsWith('@ulm.ac.id')
  );
}
```

## 3.2 ALL_EMAIL

Semua akun Google yang berhasil diautentikasi diterima.

## 3.3 NO_EMAIL

Bypass Google Auth Gate.

Jangan memaksa OAuth.

Pertahankan flow anonymous existing.

Periksa risiko draft anonymous pada shared device. Jangan secara
otomatis menggunakan satu key global yang menyebabkan draft dua
mahasiswa saling menimpa jika existing implementation sudah memiliki
identifier/session mechanism yang lebih aman.

------------------------------------------------------------------------

# 4. Prinsip Arsitektur Auth

Gunakan pemisahan state:

``` js
let authInitializing = true;
let authReady = false;
let currentSession = null;
let currentUser = null;
```

Boleh menggunakan object state jika lebih sesuai dengan codebase:

``` js
const authState = {
  initializing: true,
  ready: false,
  session: null,
  user: null,
};
```

## Aturan kritis

**UI tidak boleh memutuskan bahwa user belum login sebelum proses
initial auth selesai.**

Dengan kata lain:

``` text
authInitializing === true
```

tidak sama dengan:

``` text
user belum login
```

Selama initialization:

-   jangan tampilkan Auth Gate;
-   jangan redirect ke Google;
-   jangan menampilkan domain mismatch;
-   disable tombol Start atau tampilkan state "Memeriksa akun...".

------------------------------------------------------------------------

# 5. State Machine Utama

## 5.1 Page Bootstrap

``` text
PAGE LOAD
   |
   v
Read ?id={formId}
   |
   v
Load form configuration
   |
   v
Initialize Supabase Auth
   |
   +---- URL contains OAuth ?code=... ?
   |              |
   |             YES
   |              |
   |              v
   |     exchangeCodeForSession(code)
   |              |
   |              v
   |       obtain persisted session
   |              |
   |              v
   |     remove OAuth-only params safely
   |
   +------------ NO
                  |
                  v
             getSession()
                  |
                  v
             AUTH READY
                  |
                  v
        apply profile if available
                  |
                  v
          restore pending intent
                  |
                  v
             render page
```

## 5.2 Tombol "Mulai Mengisi Penilaian"

``` text
CLICK START
    |
    v
Is auth ready?
    |
    +-- NO --> wait / show "Memeriksa akun..."
    |
   YES
    |
    v
Read Mode_Pengumpulan_Email
    |
    +-- NO_EMAIL ------------------> OPEN FORM
    |
    +-- ULM_ONLY / ALL_EMAIL
              |
              v
        Session exists?
         /         \
       NO           YES
       |             |
       v             v
  Save AUTH      Validate user
    INTENT           |
       |             +-- ULM_ONLY --> validate domain
       v             |
 Show Auth Gate      +-- ALL_EMAIL --> accept Google account
       |
 Login Google
```

## 5.3 OAuth Return

``` text
GOOGLE LOGIN
    |
    v
SUPABASE CALLBACK
    |
    v
APP ?id=FORM_ID&code=...
    |
    v
exchangeCodeForSession()
    |
    v
getSession()/confirmed session
    |
    v
Validate email/domain
    |
    v
Match roster if applicable
    |
    v
Read AUTH_INTENT
    |
    +-- action = START_ASSESSMENT
    |   and formId matches
    |         |
    |         v
    |   clear AUTH_INTENT
    |         |
    |         v
    |   OPEN FORM AUTOMATICALLY
    |
    +-- no valid intent --> normal overview
```

**Acceptance requirement:** user tidak boleh perlu menekan tombol "Mulai
Mengisi Penilaian" untuk kedua kali setelah login yang dimulai dari
tombol tersebut.

------------------------------------------------------------------------

# 6. OAuth Intent

Sebelum `signInWithOAuth()`, simpan intent.

Contoh:

``` js
function saveAuthIntent(formId) {
  sessionStorage.setItem(
    'PGSD_AUTH_INTENT',
    JSON.stringify({
      action: 'START_ASSESSMENT',
      formId,
      createdAt: Date.now()
    })
  );
}
```

Saat callback/session recovery selesai:

``` js
function getAuthIntent() {
  try {
    return JSON.parse(
      sessionStorage.getItem('PGSD_AUTH_INTENT') || 'null'
    );
  } catch {
    return null;
  }
}
```

Intent harus:

-   cocok dengan `formId`;
-   memiliki action yang dikenal;
-   idealnya memiliki TTL agar stale intent tidak membuka form
    berhari-hari kemudian;
-   dihapus setelah berhasil dikonsumsi.

Contoh TTL:

``` js
const AUTH_INTENT_TTL_MS = 10 * 60 * 1000;
```

Jangan membuka form otomatis apabila intent invalid/expired.

------------------------------------------------------------------------

# 7. OAuth Redirect

## 7.1 Preserve formId

Misalnya:

``` text
https://bksd-ulm.vercel.app/?id=DEBUG
```

OAuth harus kembali ke form yang sama.

Bangun URL dengan `URL`, bukan concatenation raw jika memungkinkan:

``` js
function buildOAuthRedirectUrl(formId) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('id', formId);
  return url.toString();
}
```

Login:

``` js
async function handleGoogleSignIn() {
  saveAuthIntent(currentFormId);

  const redirectTo = buildOAuthRedirectUrl(currentFormId);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account'
      }
    }
  });

  if (error) {
    clearOrHandleFailedAuthIntent();
    showAuthError(error);
  }

  return data;
}
```

`prompt: 'select_account'` boleh digunakan jika sesuai UX agar
pergantian akun lebih mudah. Pastikan tidak menimbulkan regresi.

## 7.2 Jangan kehilangan `?id`

Setelah callback, URL dapat menjadi:

``` text
/?id=DEBUG&code=...
```

Saat membersihkan `code`, jangan menghapus `id`.

Gunakan:

``` js
const url = new URL(window.location.href);
url.searchParams.delete('code');

// hapus hanya OAuth-only params yang memang aman dihapus
window.history.replaceState({}, '', url.toString());
```

Jangan melakukan:

``` js
history.replaceState({}, '', '/');
```

karena akan menghilangkan `?id=DEBUG`.

------------------------------------------------------------------------

# 8. Initialization & PKCE Recovery

Buat satu fungsi initialization yang menjadi jalur resmi initial auth
recovery.

Pseudo-implementation:

``` js
async function initializeAuth() {
  authState.initializing = true;
  authState.ready = false;

  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      const { error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      url.searchParams.delete('code');
      history.replaceState({}, '', url.toString());
    }

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    authState.session = session || null;
    authState.user = session?.user || null;

  } catch (error) {
    console.error('[AUTH] Initialization failed:', error);

    authState.session = null;
    authState.user = null;

    showRecoverableAuthError(error);

  } finally {
    authState.initializing = false;
    authState.ready = true;
  }

  return authState.session;
}
```

Agent harus menyesuaikan dengan versi Supabase JS dan existing
initialization.

### Penting

Jangan blindly memanggil `exchangeCodeForSession()` berkali-kali untuk
code yang sama.

PKCE authorization code bersifat single-use.

Pastikan double initialization tidak terjadi karena:

-   duplicate script;
-   `DOMContentLoaded` ganda;
-   init dipanggil manual dan dari listener;
-   re-render memanggil init kembali.

Gunakan guard bila perlu:

``` js
let authInitPromise = null;

function ensureAuthInitialized() {
  if (!authInitPromise) {
    authInitPromise = initializeAuth();
  }

  return authInitPromise;
}
```

------------------------------------------------------------------------

# 9. onAuthStateChange

Listener tetap digunakan untuk perubahan runtime:

``` js
function initSupabaseAuthListener() {
  return supabase.auth.onAuthStateChange((event, session) => {
    authState.session = session || null;
    authState.user = session?.user || null;

    switch (event) {
      case 'SIGNED_IN':
      case 'INITIAL_SESSION':
      case 'TOKEN_REFRESHED':
      case 'USER_UPDATED':
        syncGoogleProfile(session?.user);
        break;

      case 'SIGNED_OUT':
        clearAuthenticatedProfileState();
        break;
    }
  });
}
```

Jangan menjadikan listener sebagai satu-satunya mekanisme initial
recovery.

Hindari operasi async berat atau callback yang berpotensi deadlock di
dalam `onAuthStateChange`. Bila perlu, schedule pekerjaan lanjutan di
luar callback.

------------------------------------------------------------------------

# 10. startAssessmentForm()

Refactor agar fungsi ini menjadi decision gate, bukan OAuth callback
handler.

Pseudo-code:

``` js
async function startAssessmentForm() {
  await ensureAuthInitialized();

  const mode = getCurrentEmailCollectionMode();

  if (mode === 'NO_EMAIL') {
    return openAssessmentForm();
  }

  const session = authState.session;

  if (!session?.user) {
    showGoogleAuthGate();
    return;
  }

  return continueAssessmentWithAuthenticatedUser(
    session.user,
    mode
  );
}
```

Authenticated continuation:

``` js
async function continueAssessmentWithAuthenticatedUser(user, mode) {
  const profile = extractGoogleProfile(user);

  if (!profile.email) {
    showAuthIdentityError();
    return;
  }

  if (mode === 'ULM_ONLY' && !isUlmEmail(profile.email)) {
    showDomainMismatch(profile);
    return;
  }

  const identity = await resolveStudentIdentity(profile, mode);

  if (!identity.ok) {
    showIdentityOrRosterError(identity);
    return;
  }

  applyLockedIdentity(identity);
  renderAccountBar(identity);

  await restoreDraftForIdentity(identity);

  openAssessmentForm();
}
```

------------------------------------------------------------------------

# 11. Google Profile Extraction

Ambil data hanya dari Supabase authenticated user.

Prioritas field dapat disesuaikan dengan payload aktual:

``` js
function extractGoogleProfile(user) {
  const metadata = user?.user_metadata || {};

  return {
    id: user?.id || null,
    email: user?.email?.trim().toLowerCase() || '',
    name:
      metadata.full_name ||
      metadata.name ||
      '',
    avatar:
      metadata.avatar_url ||
      metadata.picture ||
      ''
  };
}
```

Jangan percaya data dari query parameter atau localStorage sebagai
identitas Google verified.

------------------------------------------------------------------------

# 12. Auto-Match NIM

Untuk email:

``` text
2210123210001@mhs.ulm.ac.id
```

candidate NIM:

``` text
2210123210001
```

Extraction:

``` js
function extractCandidateNim(email) {
  const normalized = email.trim().toLowerCase();

  if (!normalized.endsWith('@mhs.ulm.ac.id')) {
    return null;
  }

  return normalized.split('@')[0] || null;
}
```

Prefix hanya **candidate**, belum `Roster Verified`.

Lakukan query terhadap `pgsd_students`.

Conceptual query:

``` text
SELECT ...
FROM pgsd_students
WHERE nim = candidateNim
LIMIT 1
```

Gunakan Supabase query API sesuai schema existing.

## Hasil roster

  -----------------------------------------------------------------------
  Kondisi                             Status
  ----------------------------------- -----------------------------------
  Email Google valid + NIM ditemukan  Google Verified + Roster Verified

  Email Google valid + NIM tidak      Roster mismatch
  ditemukan                           

  `@ulm.ac.id` dosen/staff            Jangan memaksakan prefix sebagai
                                      NIM

  `ALL_EMAIL` non-ULM                 Google Verified; roster
                                      optional/not applicable
  -----------------------------------------------------------------------

Jangan memberikan badge `Roster Verified` hanya karena prefix email
terlihat seperti NIM.

------------------------------------------------------------------------

# 13. Locked Identity

Setelah verified:

-   email read-only;
-   nama dari Google/roster read-only sesuai business rule;
-   NIM read-only jika berhasil match;
-   avatar berasal dari Google;
-   tampilkan badge `Google Verified`;
-   tampilkan `Roster Verified` hanya jika query roster sukses.

Untuk field yang masih dibutuhkan pada submission, hati-hati dengan HTML
`disabled`.

`disabled` input tidak ikut native form submission.

Jika submission bergantung pada pembacaan form field, prefer:

``` html
readonly
```

atau pastikan nilai tetap dimasukkan ke payload secara eksplisit.

------------------------------------------------------------------------

# 14. Account Header / Account Switcher

Di atas form tampilkan card:

``` text
[Avatar]

Masuk sebagai
Nama Mahasiswa
email@mhs.ulm.ac.id

Google Verified • Roster Verified

[Ganti Akun]
```

Requirements:

-   compact;
-   mobile responsive;
-   tidak mendominasi form;
-   avatar memiliki fallback initials/icon;
-   email tidak overflow;
-   tombol `Ganti Akun` jelas.

------------------------------------------------------------------------

# 15. Ganti Akun

Untuk domain mismatch atau explicit switch:

1.  clear current app auth state dengan cara yang sesuai;
2.  `supabase.auth.signOut()` bila memang user memilih ganti akun;
3.  simpan kembali `AUTH_INTENT` bila user sedang mencoba memulai
    assessment;
4.  mulai Google OAuth dengan account chooser;
5.  jangan menghapus draft akun lain.

Conceptual:

``` js
async function switchGoogleAccount() {
  const formId = currentFormId;

  await supabase.auth.signOut();

  saveAuthIntent(formId);

  return signInWithGoogle({
    prompt: 'select_account'
  });
}
```

Pastikan sign-out tidak secara tidak sengaja menghapus semua draft
localStorage.

------------------------------------------------------------------------

# 16. Domain Mismatch UI

Untuk `ULM_ONLY` + Gmail biasa:

``` text
Akun Google tidak sesuai

Form ini hanya dapat diisi menggunakan akun ULM:
• @mhs.ulm.ac.id
• @ulm.ac.id

Saat ini masuk sebagai:
nama@gmail.com

[Ganti Akun Google ULM]
```

Tone harus informatif, bukan error teknis.

Jangan menampilkan stack trace atau Supabase error mentah kepada
mahasiswa.

------------------------------------------------------------------------

# 17. Draft Isolation

## 17.1 Authenticated draft key

Format:

``` text
PGSD_DRAFT_{formId}_{cleanGoogleEmail}
```

Contoh:

``` text
PGSD_DRAFT_DEBUG_tester_alpha_mhs_ulm_ac_id
```

Normalizer:

``` js
function cleanEmailForKey(email = '') {
  return String(email)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
}
```

Key:

``` js
function getAuthenticatedDraftKey(formId, email) {
  return `PGSD_DRAFT_${formId}_${cleanEmailForKey(email)}`;
}
```

## 17.2 Security note

localStorage draft isolation mencegah accidental overwrite antar akun,
tetapi **bukan security boundary**.

Jangan menyebut localStorage sebagai encrypted/private storage.

Identitas authoritative tetap berasal dari authenticated Supabase
session.

## 17.3 Draft restoration

Urutan:

``` text
auth recovered
→ Google user validated
→ domain validated
→ roster resolved
→ draft key derived from authenticated email
→ restore matching draft
→ render values
```

Jangan restore draft user A sebelum current Google user diketahui.

------------------------------------------------------------------------

# 18. Draft Account Switching Test

Scenario:

``` text
Login studentA@mhs.ulm.ac.id
→ isi sebagian
→ autosave
→ logout/switch

Login studentB@mhs.ulm.ac.id
→ draft A TIDAK muncul
→ isi draft B
→ autosave

Switch kembali ke A
→ draft A kembali
→ draft B tidak tercampur
```

Wajib menjadi acceptance test.

------------------------------------------------------------------------

# 19. Submission Security

Frontend lock bukan security boundary.

Agent harus memeriksa apakah submission ke Supabase dapat memanfaatkan
authenticated user.

Jika schema existing memungkinkan tanpa migration besar:

-   simpan `auth_user_id`;
-   simpan authenticated email dari session;
-   jangan mengambil authoritative email dari editable DOM;
-   bila memungkinkan, validasi dengan RLS/server-side policy.

Jangan melakukan schema migration destructive tanpa kebutuhan dan tanpa
memeriksa repository/schema terlebih dahulu.

Jika backend saat ini belum siap untuk enforcement, dokumentasikan
sebagai hardening recommendation dan jangan memblokir core
implementation.

------------------------------------------------------------------------

# 20. Admin Configuration

Di `src/admin/admin.js`, pastikan field:

``` text
Mode_Pengumpulan_Email
```

atau nama column/config aktual memiliki canonical values:

``` text
ULM_ONLY
ALL_EMAIL
NO_EMAIL
```

Requirements:

-   create form menyimpan mode;
-   edit form memuat mode existing;
-   update menyimpan mode baru;
-   student module menerima value yang sama;
-   invalid/missing value memiliki fallback backward-compatible.

Jangan mengubah nama database field tanpa memeriksa schema existing.

------------------------------------------------------------------------

# 21. UI Google Auth Gate

Tambahkan/rapikan UI pada `index.html` atau component existing.

State minimal:

1.  `AUTH_CHECKING`
2.  `AUTH_REQUIRED`
3.  `AUTH_REDIRECTING`
4.  `AUTH_ERROR`
5.  `DOMAIN_MISMATCH`
6.  `AUTHENTICATED`

Auth gate:

``` text
Masuk untuk melanjutkan

Form ini memerlukan identitas Google terverifikasi.
Data akun digunakan untuk mengisi dan mengunci identitas penilai.

[ G  Lanjutkan dengan Google ]
```

Untuk `ULM_ONLY`, tambahkan:

``` text
Gunakan akun @mhs.ulm.ac.id atau @ulm.ac.id
```

Hindari modal bertumpuk.

------------------------------------------------------------------------

# 22. Error Handling

Tangani minimal:

  -----------------------------------------------------------------------
  Kasus                               Expected Behaviour
  ----------------------------------- -----------------------------------
  User menutup Google login           Kembali ke gate, bisa retry

  OAuth error                         Friendly retry UI

  Callback code invalid               Jangan loop otomatis

  Code sudah digunakan                Recover session jika ada; jika
                                      tidak, tampilkan retry

  Session expired                     Gate login

  Network offline                     Error network + retry

  Gmail pada `ULM_ONLY`               Domain mismatch + switch account

  Roster tidak ditemukan              Roster mismatch

  Form ID hilang                      Jangan membuka form salah

  Form tidak ditemukan                Existing not-found behaviour

  OAuth callback refresh              Tidak melakukan endless exchange

  Supabase unavailable                Recoverable error
  -----------------------------------------------------------------------

**Dilarang auto-retry OAuth redirect tanpa batas.**

------------------------------------------------------------------------

# 23. Anti-Login-Loop Guard

Implementasi dianggap gagal jika terjadi:

``` text
Start
→ Google
→ callback
→ Auth Gate
→ Google
→ callback
→ Auth Gate
```

Proteksi:

1.  await auth initialization;
2.  exchange PKCE callback sebelum gate decision;
3.  call `getSession()`;
4.  preserve `formId`;
5.  consume `AUTH_INTENT` hanya setelah session confirmed;
6.  jangan signOut saat normal callback;
7.  jangan memulai OAuth dari `onAuthStateChange`;
8.  jangan memulai OAuth otomatis hanya karena `session === null`;
9.  OAuth hanya dimulai oleh explicit user action;
10. callback error harus berhenti di recoverable error UI, bukan
    redirect ulang.

------------------------------------------------------------------------

# 24. Boot Order yang Disarankan

``` js
async function bootstrapStudentPage() {
  try {
    const formId = getFormIdFromUrl();

    await loadFormConfiguration(formId);

    initSupabaseAuthListener();

    await ensureAuthInitialized();

    if (authState.user) {
      syncGoogleProfile(authState.user);
    }

    renderOverview();

    await resumePendingAuthIntentIfEligible();

  } catch (error) {
    handleBootstrapError(error);
  }
}
```

Sesuaikan urutan jika form config dibutuhkan untuk menentukan auth mode.

Pastikan hanya ada satu bootstrap authority.

------------------------------------------------------------------------

# 25. Resume Pending Intent

Pseudo-code:

``` js
async function resumePendingAuthIntentIfEligible() {
  const intent = getValidAuthIntent();

  if (!intent) return;

  if (intent.formId !== currentFormId) {
    clearAuthIntent();
    return;
  }

  if (intent.action !== 'START_ASSESSMENT') {
    clearAuthIntent();
    return;
  }

  if (!authState.session?.user) {
    // Jangan redirect otomatis.
    // Biarkan user melihat Auth Gate/retry.
    return;
  }

  clearAuthIntent();

  await continueAssessmentWithAuthenticatedUser(
    authState.session.user,
    getCurrentEmailCollectionMode()
  );
}
```

Clear intent tepat sebelum/ketika continuation aman agar tidak terjadi
duplicate opening.

------------------------------------------------------------------------

# 26. Google Cloud Setup Documentation

Buat:

``` text
docs/google_oauth_setup.md
```

Dokumentasikan:

## Google Cloud Console

OAuth client type:

``` text
Web application
```

Authorized JavaScript Origin:

``` text
https://bksd-ulm.vercel.app
```

Authorized Redirect URI:

``` text
https://eychjnqmqpxzxukiwbqf.supabase.co/auth/v1/callback
```

Jelaskan bahwa Google Redirect URI adalah **Supabase callback**, bukan
`/?id=DEBUG`.

## Supabase

Authentication → Providers → Google:

-   enable Google;
-   Client ID;
-   Client Secret.

Authentication → URL Configuration:

Site URL:

``` text
https://bksd-ulm.vercel.app
```

Tambahkan production redirect URLs yang diperlukan, termasuk URL Vercel
yang digunakan aplikasi.

Jangan memasukkan Client Secret ke frontend atau repository.

------------------------------------------------------------------------

# 27. Security Requirements

Wajib:

-   Google Client Secret hanya di Supabase Dashboard;
-   jangan commit secret;
-   jangan expose service role key;
-   frontend hanya menggunakan Supabase anon/publishable key yang memang
    ditujukan untuk client;
-   identity authoritative berasal dari `session.user`;
-   sanitize profile text sebelum rendering;
-   gunakan `textContent` untuk nama/email jika memungkinkan;
-   jangan inject avatar URL ke HTML string tanpa existing safe
    rendering;
-   domain validation case-insensitive;
-   jangan percaya NIM hasil parsing sampai roster query berhasil;
-   jangan menjadikan localStorage sebagai bukti autentikasi.

------------------------------------------------------------------------

# 28. Syntax Verification

Setelah modifikasi seluruh JavaScript:

-   jalankan syntax validation;
-   gunakan `node --check` bila cocok;
-   atau `vm.Script` sesuai aturan repository;
-   target: **0 syntax errors**.

Jangan berhenti pada syntax check. Lakukan behavioural verification.

------------------------------------------------------------------------

# 29. Sandbox Testing

Semua remote/E2E testing:

``` text
https://bksd-ulm.vercel.app/?id=DEBUG
```

Ikuti `AGENTS.md`.

Jangan melakukan submit/destructive test ke form produksi.

------------------------------------------------------------------------

# 30. Test Matrix

  ID    Scenario                       Expected
  ----- ------------------------------ ---------------------------------
  T01   `NO_EMAIL`, logout             Form langsung terbuka
  T02   `ULM_ONLY`, logout             Auth Gate muncul
  T03   `ALL_EMAIL`, logout            Auth Gate muncul
  T04   Login ULM valid                Masuk form
  T05   Login Gmail pada `ULM_ONLY`    Ditolak ramah
  T06   Gmail pada `ALL_EMAIL`         Diterima
  T07   Refresh setelah login          Tetap login
  T08   OAuth callback                 Tidak muncul Auth Gate kedua
  T09   Callback preserve `id=DEBUG`   Tetap DEBUG
  T10   Roster match                   NIM locked + verified
  T11   Roster mismatch                Error roster, tidak spoof
  T12   Switch account                 Account chooser
  T13   Draft A → account B            Draft A tidak muncul
  T14   Kembali account A              Draft A pulih
  T15   OAuth cancelled                Retry UI, no loop
  T16   Invalid callback               Error UI, no loop
  T17   Network error                  Recoverable retry
  T18   Multiple init calls            Single effective initialization
  T19   Page refresh callback          No repeated infinite exchange
  T20   Existing admin edit            Mode email tetap benar

------------------------------------------------------------------------

# 31. Critical E2E Acceptance Test

Wajib berhasil:

``` text
1. Sign out.
2. Open:
   https://bksd-ulm.vercel.app/?id=DEBUG

3. Overview/panduan tampil.

4. Click:
   "Mulai Mengisi Penilaian"

5. Google Auth Gate tampil.

6. Click:
   "Lanjutkan dengan Google"

7. Login Google.

8. OAuth kembali ke aplikasi.

9. URL/form context tetap DEBUG.

10. Supabase session berhasil dipulihkan.

11. Domain berhasil diverifikasi.

12. Roster berhasil diverifikasi bila applicable.

13. Account card tampil.

14. Email/Nama/NIM terisi sesuai source of truth.

15. Field identity terkunci.

16. Draft account-specific dipulihkan.

17. Form LANGSUNG terbuka.

18. Auth Gate TIDAK muncul kedua kali.

19. Refresh browser.

20. Session tetap dikenali.

21. Tekan/start form lagi jika berada di overview.

22. TIDAK diminta login ulang selama session valid.
```

Jika step 17--22 gagal, jangan nyatakan task selesai.

------------------------------------------------------------------------

# 32. Remote Testing Constraint

Jangan menganggap Playwright dapat melakukan login real Google secara
otomatis jika Google memblokir automated browser.

Jika real OAuth tidak dapat diautomasi:

1.  test pre-OAuth UI dengan Playwright;
2.  test callback/session logic secara isolated/mock sesuai capability
    repository;
3.  lakukan manual real-Google smoke test;
4.  jangan membuat fake claim bahwa Google OAuth real berhasil bila
    tidak benar-benar diuji.

------------------------------------------------------------------------

# 33. Logging Sementara

Tambahkan logging yang cukup selama development:

``` text
[AUTH] bootstrap started
[AUTH] callback code detected
[AUTH] code exchange succeeded
[AUTH] session recovered
[AUTH] user authenticated
[AUTH] domain valid
[AUTH] roster matched
[AUTH] intent resumed
```

Jangan log:

-   access token;
-   refresh token;
-   Client Secret;
-   sensitive credential.

Setelah stabil, kurangi debug log yang tidak diperlukan.

------------------------------------------------------------------------

# 34. Definition of Done

Task hanya dianggap selesai jika:

-   [ ] Google OAuth provider terintegrasi.
-   [ ] PKCE callback tertangani.
-   [ ] Tidak ada OAuth login loop.
-   [ ] `?id={formId}` survive redirect.
-   [ ] `ULM_ONLY` tervalidasi.
-   [ ] `ALL_EMAIL` bekerja.
-   [ ] `NO_EMAIL` bypass auth.
-   [ ] Google profile auto-populate.
-   [ ] Identity fields locked.
-   [ ] NIM roster verification bekerja.
-   [ ] Account card tampil.
-   [ ] Switch account bekerja.
-   [ ] Draft terisolasi per authenticated email.
-   [ ] Draft dipulihkan setelah OAuth.
-   [ ] Refresh tidak memaksa login ulang jika session valid.
-   [ ] Admin email mode persist dengan benar.
-   [ ] Syntax validation 0 errors.
-   [ ] DEBUG sandbox tests lulus.
-   [ ] Dokumentasi Google OAuth dibuat.
-   [ ] Tidak ada secret di source code.
-   [ ] Tidak ada production destructive testing.
-   [ ] Agent memberikan laporan file yang diubah dan hasil test.

------------------------------------------------------------------------

# 35. Workflow Implementasi untuk Agent

## Phase 1 --- Reconnaissance

Sebelum menulis kode:

1.  Baca `AGENTS.md`.
2.  Inspect `index.html`.
3.  Inspect `src/student/student.js`.
4.  Inspect `src/admin/admin.js`.
5.  Cari:
    -   `createClient`
    -   `supabase`
    -   `signInWithOAuth`
    -   `onAuthStateChange`
    -   `getSession`
    -   `startAssessmentForm`
    -   `getFormDraftKey`
    -   `Mode_Pengumpulan_Email`
    -   `pgsd_students`
6.  Identifikasi existing form bootstrap.
7.  Identifikasi existing draft storage.
8.  Identifikasi existing CSS/modal architecture.
9.  Identifikasi schema/config naming aktual.
10. Buat ringkasan risiko sebelum edit.

## Phase 2 --- Design Alignment

Sebelum edit, pastikan mapping:

``` text
existing function → planned responsibility
```

Jangan membuat fungsi baru jika fungsi existing bisa diperbaiki dengan
aman.

## Phase 3 --- Implement Auth Core

Implement:

-   auth state;
-   single initialization promise;
-   callback exchange;
-   session recovery;
-   listener;
-   redirect URL;
-   auth intent.

## Phase 4 --- Implement Gate

Implement decision logic di `startAssessmentForm()`.

## Phase 5 --- Identity

Implement:

-   Google profile;
-   domain validation;
-   NIM candidate;
-   roster verification;
-   locked fields.

## Phase 6 --- Account UI

Implement:

-   avatar;
-   account card;
-   verified badges;
-   switch account;
-   domain mismatch.

## Phase 7 --- Draft Isolation

Implement authenticated key dan restore order.

## Phase 8 --- Admin

Verify/persist email mode.

## Phase 9 --- Documentation

Create `docs/google_oauth_setup.md`.

## Phase 10 --- Verification

Run:

-   syntax;
-   local behaviour;
-   sandbox remote;
-   regression tests;
-   auth-loop acceptance tests.

## Phase 11 --- Final Report

Agent harus memberikan:

``` text
IMPLEMENTATION SUMMARY

Files changed:
- ...
- ...

Auth flow:
- ...

Security:
- ...

Tests:
PASS ...
PASS ...
FAIL ...

Manual configuration still required:
- Google Cloud ...
- Supabase ...

Known limitations:
- ...
```

Jangan menyatakan PASS untuk test yang tidak benar-benar dijalankan.

------------------------------------------------------------------------

# 36. Prompt Eksekusi untuk Antigravity

Gunakan prompt berikut bersama file PLAN.md ini:

> Implementasikan seluruh spesifikasi pada `PLAN.md` untuk integrasi
> Google Cloud OAuth melalui Supabase Auth.
>
> Sebelum melakukan perubahan apa pun, baca `AGENTS.md` dan seluruh file
> yang relevan. Jangan langsung menulis kode berdasarkan asumsi. Petakan
> terlebih dahulu implementasi existing untuk Supabase client,
> `startAssessmentForm()`, auth listener, form configuration, draft
> storage, identity fields, roster `pgsd_students`, dan admin email
> mode.
>
> Prioritas tertinggi adalah mencegah OAuth login loop. Initial auth
> recovery harus deterministic: tangani PKCE callback bila terdapat
> `?code=...`, pulihkan Supabase session, baru tandai auth sebagai
> ready. Jangan membiarkan UI menganggap `session === null` sebelum
> initialization selesai.
>
> Jangan mengandalkan `onAuthStateChange()` sebagai satu-satunya
> mekanisme initial session recovery. Gunakan single initialization
> authority/promise agar callback code tidak ditukar lebih dari sekali.
>
> Pertahankan `?id={formId}` sepanjang OAuth redirect. Untuk sandbox,
> `?id=DEBUG` harus tetap menjadi `DEBUG` setelah login. Saat
> membersihkan OAuth query parameter, jangan menghapus `id`.
>
> Sebelum redirect Google yang berasal dari tombol
> `Mulai Mengisi Penilaian`, simpan `PGSD_AUTH_INTENT` di
> `sessionStorage`. Setelah callback sukses, session terkonfirmasi,
> domain tervalidasi, dan roster berhasil diproses, konsumsi intent
> tersebut dan lanjutkan langsung ke form. User tidak boleh harus
> menekan tombol Start untuk kedua kali.
>
> Terapkan tiga mode secara ketat: `ULM_ONLY`, `ALL_EMAIL`, dan
> `NO_EMAIL`. `ULM_ONLY` hanya menerima suffix exact `@mhs.ulm.ac.id`
> dan `@ulm.ac.id`. Jangan gunakan substring validation. `ALL_EMAIL`
> menerima authenticated Google accounts. `NO_EMAIL` harus
> mempertahankan anonymous flow dan tidak memaksa OAuth.
>
> Profile harus berasal dari authenticated `session.user`, bukan query
> parameter/localStorage. Nama, email, dan avatar diambil dari Google
> metadata. Untuk akun mahasiswa ULM, prefix email hanya menjadi
> candidate NIM; status roster verified baru boleh diberikan setelah
> query sukses ke `pgsd_students`.
>
> Lock identity fields setelah verified. Perhatikan bahwa HTML
> `disabled` tidak ikut native form submission; gunakan `readonly` atau
> pastikan payload submission mengambil identity dari authenticated
> state.
>
> Implement account header yang compact dan responsive dengan avatar,
> nama, email, badge Google Verified, badge Roster Verified bila
> applicable, serta tombol Ganti Akun. Pada domain mismatch tampilkan
> pesan ramah dan tombol Ganti Akun Google ULM.
>
> Draft authenticated harus menggunakan key deterministic
> `PGSD_DRAFT_{formId}_{cleanGoogleEmail}` dan hanya dipulihkan setelah
> authenticated identity diketahui. Switching account tidak boleh
> menghapus draft akun lain.
>
> Jangan menganggap localStorage sebagai security boundary. Jangan
> pernah menyimpan access token, refresh token, Client Secret,
> service-role key, atau credential sensitif secara manual.
>
> Semua remote testing harus menggunakan form sandbox `DEBUG` sesuai
> `AGENTS.md`. Jangan melakukan destructive test pada production
> form/data.
>
> Setelah implementasi, jalankan syntax validation dan seluruh test yang
> memungkinkan. Fokus khusus pada flow:
>
> `logout → ?id=DEBUG → Mulai Mengisi → Google login → callback → session recovered → domain validation → roster → form langsung terbuka → tidak ada Auth Gate kedua → refresh → session tetap dikenali`.
>
> Jika real Google login tidak dapat diautomasi oleh Playwright, jangan
> memalsukan hasil. Pisahkan automated test, mock/isolation test, dan
> manual smoke-test requirement secara eksplisit.
>
> Jangan melakukan refactor besar di luar scope. Pertahankan backward
> compatibility. Jika menemukan konflik antara PLAN.md dan
> implementasi/schema aktual, prioritaskan keamanan dan kompatibilitas,
> jelaskan konflik tersebut, dan lakukan perubahan minimal yang memenuhi
> intent PLAN.md.
>
> Setelah selesai, laporkan: 1. file yang diubah; 2. fungsi yang
> ditambah/diubah; 3. alur auth final; 4. proteksi anti-login-loop; 5.
> hasil test per scenario; 6. konfigurasi Google Cloud/Supabase yang
> masih harus saya lakukan manual; 7. known limitations; 8. hal apa pun
> yang belum dapat diverifikasi.
>
> Jangan menyatakan implementasi selesai sebelum critical acceptance
> flow pada PLAN.md telah diverifikasi sejauh environment memungkinkan.

------------------------------------------------------------------------

# 37. Prompt Audit Setelah Implementasi

Setelah agent selesai implementasi, jalankan prompt kedua berikut:

> Audit implementasi Google OAuth yang baru dibuat berdasarkan
> `PLAN.md`.
>
> Jangan langsung memperbaiki kode. Lakukan audit terlebih dahulu dan
> cari khusus:
>
> -   kemungkinan OAuth login loop;
> -   race condition antara `getSession`, callback exchange, listener,
>     dan `startAssessmentForm`;
> -   duplicate `exchangeCodeForSession`;
> -   hilangnya `?id=DEBUG`;
> -   stale `PGSD_AUTH_INTENT`;
> -   OAuth redirect otomatis tanpa user action;
> -   domain validation yang terlalu longgar;
> -   NIM yang dianggap verified tanpa roster query;
> -   identity field yang terlihat locked tetapi payload masih bisa
>     spoof;
> -   penggunaan `disabled` yang menyebabkan field hilang dari
>     submission;
> -   draft antar akun yang tercampur;
> -   signOut yang menghapus data yang tidak semestinya;
> -   token/secret yang ter-log atau tersimpan manual;
> -   XSS dari Google profile metadata;
> -   admin mode yang tidak persist;
> -   regression pada `NO_EMAIL`;
> -   production testing yang melanggar `AGENTS.md`.
>
> Buat tabel audit dengan kolom:
>
> `Severity | File | Function/Line | Finding | Impact | Recommended Fix`
>
> Severity gunakan:
>
> `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `PASS`.
>
> Setelah audit selesai, perbaiki semua temuan CRITICAL dan HIGH, lalu
> jalankan kembali syntax test dan sandbox regression test. Laporkan
> perubahan dan bukti hasil test. Jangan menyatakan PASS tanpa
> verifikasi.

------------------------------------------------------------------------

# 38. Prompt Debug Jika Login Masih Loop

Jika setelah deployment masih kembali ke login, gunakan:

> Debug OAuth login loop pada deployment ini tanpa melakukan refactor
> besar.
>
> Reproduce hanya pada:
>
> `https://bksd-ulm.vercel.app/?id=DEBUG`
>
> Trace secara berurutan:
>
> 1.  URL sebelum `signInWithOAuth`;
> 2.  nilai `redirectTo`;
> 3.  URL setelah kembali dari Google/Supabase;
> 4.  apakah `?id=DEBUG` masih ada;
> 5.  apakah `?code=` diterima;
> 6.  berapa kali `exchangeCodeForSession` dipanggil;
> 7.  hasil exchange;
> 8.  hasil `getSession`;
> 9.  event `onAuthStateChange`;
> 10. nilai `authInitializing/authReady`;
> 11. current authenticated email;
> 12. email collection mode;
> 13. domain validation result;
> 14. isi/validitas `PGSD_AUTH_INTENT`;
> 15. alasan tepat mengapa Auth Gate dirender kembali.
>
> Jangan log access token atau refresh token.
>
> Temukan root cause berdasarkan trace, bukan dugaan. Setelah root cause
> ditemukan, lakukan fix terkecil yang aman, kemudian ulangi flow:
>
> `logout → DEBUG → Start → Google → callback → session → form`.
>
> Keberhasilan hanya jika form terbuka tanpa Auth Gate kedua dan refresh
> tetap mempertahankan session.

------------------------------------------------------------------------

# 39. Expected Final User Experience

## ULM_ONLY

``` text
Overview
   ↓
Mulai Mengisi
   ↓
Google Auth Gate
   ↓
Login akun ULM
   ↓
Callback
   ↓
Session recovered
   ↓
ULM domain verified
   ↓
Roster verified
   ↓
Identity locked
   ↓
Draft akun dipulihkan
   ↓
Form terbuka
```

## Wrong Google Account

``` text
Login Gmail
   ↓
Session valid
   ↓
ULM domain invalid
   ↓
Domain Mismatch Card
   ↓
Ganti Akun Google ULM
   ↓
Account chooser
```

## Returning Student

``` text
Open form
   ↓
Existing Supabase session recovered
   ↓
No Google redirect
   ↓
Click Start
   ↓
Identity validated
   ↓
Draft restored
   ↓
Form
```

## Anonymous

``` text
NO_EMAIL
   ↓
Overview
   ↓
Start
   ↓
Form
```

------------------------------------------------------------------------

# 40. Non-Goals

Jangan melakukan hal berikut kecuali benar-benar diperlukan untuk
memperbaiki bug:

-   redesign seluruh aplikasi;
-   mengganti Supabase;
-   membuat backend auth baru;
-   migrasi framework;
-   mengubah database schema besar;
-   menghapus existing anonymous workflow;
-   menghapus existing drafts;
-   mengubah form produksi untuk testing;
-   menyimpan Google OAuth secret di source;
-   membuat custom password authentication.

Fokus task adalah **Google OAuth + verified identity + safe
continuation + account-isolated drafts**.

/* ============================================
 * src/student/app.js
 * Init, DOMContentLoaded, routing
 * ============================================ */

    const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbxEa3t09i1hk-VBEHxz99zus8Q8D67G8LaoewN6o000nIQCC5yRPFji7WWHnqip2jlvoQ/exec";
    const DEFAULT_DRIVE_FOLDER_ID = "1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK";
    const DEFAULT_SPREADSHEET_ID = "1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4";
    const GOOGLE_SYNC_EDGE_URL = "https://eychjnqmqpxzxukiwbqf.supabase.co/functions/v1/google-sync";
    
    function getApiUrl() {
      return localStorage.getItem("PGSD_API_URL") || DEFAULT_API_URL;
    }

    // High-Performance Supabase Backend Configuration
    const SUPABASE_CONFIG = {
      url: "https://eychjnqmqpxzxukiwbqf.supabase.co",
      anonKey: "sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp"
    };

    let supabaseClient = null;
    function getSupabaseClient() {
      if (!supabaseClient && window.supabase && typeof window.supabase.createClient === "function") {
        try {
          supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storage: window.localStorage
            }
          });
        } catch(e) {
          console.warn("Supabase init error:", e);
        }
      }
      return supabaseClient;
    }

    // Eagerly initialize supabase client
    try {
      getSupabaseClient();
    } catch(e) {}

    // Multi-Form & Dynamic Questions State
    const urlParams = new URLSearchParams(window.location.search);
    const isPreviewMode = urlParams.get('preview') === 'draft' || urlParams.get('preview') === 'true';
    const explicitPinParam = (urlParams.get('id') || urlParams.get('form') || '').toUpperCase().trim();
    let activeFormId = explicitPinParam;
    let isPortalMode = !explicitPinParam;
    let currentFormMeta = null;
    let currentFormSchema = null;
    let customFieldsData = [];
    let customUploadedFilesMap = {};
    let clientCustomFormAnswers = {};

    let activeUserAccountEmail = "";
    let activeUserAccountName = "";
    let activeUserAccountNim = "";
    let activeUserAccountAvatarUrl = "";
    let currentEvaluatorRole = "Mahasiswa";

    let currentStep = 1;
    let appConfig = {};
    let groupsData = [];
    let allStudentsData = [];
    let selectedGroupObj = null;
    let selectedBestPresenters = [];
    let currentRekapData = null;
    let currentRekapSubView = "kelompok";
    let currentRekapRoleFilter = "mhs"; // 'mhs' | 'other' | 'all'
    let isEmailValidState = false;


    let stepMetadata = {
      1: { badge: "01/04", title: "Identitas Penilai", percent: 25 },
      2: { badge: "02/04", title: "Pilih Kelompok Tampil", percent: 50 },
      3: { badge: "03/04", title: "Skor Nilai & Presentator", percent: 75 },
      4: { badge: "04/04", title: "Evaluasi Masukan Pemateri", percent: 100 }
    };

        
    // =========================================================================
    // UNIVERSAL SMART MATH & KATEX AUTO-RENDER ENGINE (EXPLICIT & CONFLICT-FREE)
    // =========================================================================
    function isFormatOrMathPresent(text) {
      if (!text || typeof text !== 'string') return false;
      const hasMath = /\$[^$]+\$|\$\$[\s\S]+\$\$|\\\([\s\S]+?\\\) |\\\[[\s\S]+?\\\]|\\(?:rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|pm|times|div|le|ge|neq|approx|sqrt|frac)/.test(text) || (text.includes('$') && text.lastIndexOf('$') > text.indexOf('$'));
      const hasMarkdown = /\*\*[^*]+\*\*|(?:\b|[^\*])\*[^*]+\*(?:\b|[^\*])|<u>[\s\S]+?<\/u>|\[[^\]]+\]\(((?:https?:\/\/|\/)[^\s\)]+)\)/.test(text);
      const hasList = /(?:^|\n)\s*(?:[•◦▪▫\-\*]|(?:\d+|[A-Za-z]|[ivxlcdmIVXLCDM]+)[\.\)])\s+/.test(text);
      return hasMath || hasMarkdown || hasList;
    }

    function smartMathFormat(text) {
      if (!text || typeof text !== 'string') return "";

      const rawLines = text.split('\n');
      let processedLines = [];

      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (!line.trim()) {
          processedLines.push('<div class="h-2"></div>');
          continue;
        }

        // 1. Bullets (•, ◦, ▪, ▫, -, *)
        const bulletMatch = line.match(/^(\s*)([•◦▪▫\-\*])\s+(.*)$/);
        // 2. Numbered (1., 2., 1.1., etc.)
        const numberMatch = line.match(/^(\s*)(\d+(?:\.\d+)*)[\.\)]\s+(.*)$/);
        // 3. Alphabetical (A., B., C., or a., b., c.)
        const alphaMatch = line.match(/^(\s*)([A-Za-z])[\.\)]\s+(.*)$/);
        // 4. Roman Numerals (i., ii., iii., IV., etc.)
        const romanMatch = line.match(/^(\s*)([ivxlcdmIVXLCDM]+)[\.\)]\s+(.*)$/);

        if (bulletMatch) {
          const indentSpaces = bulletMatch[1].length;
          const indentLevel = Math.min(6, Math.floor(indentSpaces / 2));
          const symbol = bulletMatch[2] === '-' || bulletMatch[2] === '*' ? '•' : bulletMatch[2];
          const content = bulletMatch[3];
          processedLines.push(`<div class="flex items-start gap-2.5 my-1 text-left leading-relaxed" style="padding-left: ${indentLevel * 1.5}rem;"><span class="text-indigo-600 font-bold select-none shrink-0 min-w-[0.85rem] text-center pt-0.5">${symbol}</span><span class="flex-1 min-w-0 break-words leading-relaxed">${content}</span></div>`);
        } else if (numberMatch) {
          const indentSpaces = numberMatch[1].length;
          const indentLevel = Math.min(6, Math.floor(indentSpaces / 2));
          const num = numberMatch[2];
          const content = numberMatch[3];
          processedLines.push(`<div class="flex items-start gap-2.5 my-1 text-left leading-relaxed" style="padding-left: ${indentLevel * 1.5}rem;"><span class="font-bold text-indigo-700 font-mono text-xs sm:text-sm select-none shrink-0 min-w-[1.4rem] text-right pt-0.5">${num}.</span><span class="flex-1 min-w-0 break-words leading-relaxed">${content}</span></div>`);
        } else if (alphaMatch) {
          const indentSpaces = alphaMatch[1].length;
          const indentLevel = Math.min(6, Math.floor(indentSpaces / 2));
          const letter = alphaMatch[2];
          const content = alphaMatch[3];
          processedLines.push(`<div class="flex items-start gap-2.5 my-1 text-left leading-relaxed" style="padding-left: ${indentLevel * 1.5}rem;"><span class="font-bold text-indigo-700 font-mono text-xs sm:text-sm select-none shrink-0 min-w-[1.4rem] text-right pt-0.5">${letter}.</span><span class="flex-1 min-w-0 break-words leading-relaxed">${content}</span></div>`);
        } else if (romanMatch) {
          const indentSpaces = romanMatch[1].length;
          const indentLevel = Math.min(6, Math.floor(indentSpaces / 2));
          const roman = romanMatch[2];
          const content = romanMatch[3];
          processedLines.push(`<div class="flex items-start gap-2.5 my-1 text-left leading-relaxed" style="padding-left: ${indentLevel * 1.5}rem;"><span class="font-bold text-indigo-700 font-mono text-xs sm:text-sm select-none shrink-0 min-w-[1.4rem] text-right pt-0.5">${roman}.</span><span class="flex-1 min-w-0 break-words leading-relaxed">${content}</span></div>`);
        } else {
          const indentMatch = line.match(/^(\s{2,})(.*)$/);
          if (indentMatch && indentMatch[2].trim()) {
            const indentSpaces = indentMatch[1].length;
            const indentLevel = Math.min(6, Math.floor(indentSpaces / 2));
            processedLines.push(`<div class="my-1 leading-relaxed pl-5" style="padding-left: ${(indentLevel + 1) * 1.5}rem;">${indentMatch[2]}</div>`);
          } else {
            if (rawLines.length > 1) {
              processedLines.push(`<div class="my-0.5 leading-relaxed">${line}</div>`);
            } else {
              processedLines.push(line);
            }
          }
        }
      }

      let res = processedLines.join('');

      // Convert Markdown formatting (Bold, Italic, Underline, Link)
      res = res
        .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3')
        .replace(/<u>([^<]+)<\/u>/gi, '<u>$1</u>')
        .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline font-semibold">$1</a>');

      // Auto-wrap unwrapped LaTeX math symbols so they always render beautifully
      res = res.replace(/(?<!\$|\\|\w)(\\(?:rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|pm|approx|neq|le|ge|times|div|cdot|infty|deg|alpha|beta|gamma|theta|pi|Sigma|mu|sigma)(?![a-zA-Z]))(?!\$)/g, '$$1$');

      return res;
    }

    function renderAllMathInElement(domElement) {
      const target = domElement || document.body;
      if (!target) return;
      if (typeof renderMathInElement === 'function') {
        try {
          renderMathInElement(target, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
            throwOnError: false,
            trust: true
          });
        } catch(e) {
          console.warn("KaTeX render error:", e);
        }
      }
    }

    function openClientImageZoom(src, caption = '') {
      const modal = document.getElementById("modalClientImageZoom");
      const img = document.getElementById("clientZoomedImg");
      const cap = document.getElementById("clientZoomedCaption");
      if (!modal || !img) return;
      img.src = src;
      if (cap) cap.textContent = caption;
      modal.classList.remove("hidden");
      renderAllMathInElement(cap);
    }

    function closeClientImageZoom() {
      const modal = document.getElementById("modalClientImageZoom");
      if (modal) modal.classList.add("hidden");
    }

    function extractDriveFileId(url) {
      if (!url) return '';
      url = String(url).trim();
      let match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?export=view&id=|thumbnail\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1];
      match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1];
      return '';
    }

    function convertToEmbedUrl(url, type) {
      if (!url) return '';
      url = url.trim();

      if (type === 'VIDEO') {
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
          return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
        if (vimeoMatch && vimeoMatch[1]) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        const fileId = extractDriveFileId(url);
        if (fileId) {
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
      }

      if (type === 'IMAGE') {
        const fileId = extractDriveFileId(url);
        if (fileId) {
          // Google Drive Ultra-Fast CDN Endpoint (Bypass 403 cookie restriction)
          return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
      }

      if (type === 'AUDIO') {
        const fileId = extractDriveFileId(url);
        if (fileId) {
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
      }

      return url;
    }

    function handleImageErrorFallback(imgEl, rawUrl) {
      if (!imgEl) return;
      const fileId = extractDriveFileId(rawUrl || imgEl.src);
      const curSrc = imgEl.src || '';

      if (fileId) {
        if (!curSrc.includes('thumbnail')) {
          imgEl.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
          return;
        }
        if (!curSrc.includes('uc?export=view')) {
          imgEl.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
          return;
        }
        if (!curSrc.includes('drive.usercontent.google.com')) {
          imgEl.src = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
          return;
        }
      }
    }

function normalizeMediaList(fieldOrMedia) {
      if (!fieldOrMedia) return [];
      if (Array.isArray(fieldOrMedia.mediaList) && fieldOrMedia.mediaList.length > 0) {
        return fieldOrMedia.mediaList;
      }
      if (fieldOrMedia.media && fieldOrMedia.media.url) {
        return [fieldOrMedia.media];
      }
      if (fieldOrMedia.url) {
        return [fieldOrMedia];
      }
      return [];
    }

    function renderSingleClientMediaBody(media) {
      if (!media || !media.url) return '';
      const alignClass = media.align === 'left' ? 'justify-start' : (media.align === 'right' ? 'justify-end' : 'justify-center');
      const embedUrl = convertToEmbedUrl(media.url, media.type);

      let mediaBody = '';
      if (media.type === 'IMAGE') {
        mediaBody = `
          <div class="relative group inline-block max-w-full">
            <img 
              src="${embedUrl}" 
              referrerpolicy="no-referrer" 
              crossorigin="anonymous"
              onerror="handleImageErrorFallback(this, '${(media.url || '').replace(/'/g, "\\'")}')"
              alt="${media.caption || 'Gambar Pertanyaan'}" 
              onclick="openClientImageZoom('${embedUrl}', '${(media.caption || '').replace(/'/g, "\\'")}')"
              class="max-h-60 sm:max-h-72 w-auto max-w-full rounded-2xl border border-zinc-200 shadow-xs object-contain bg-zinc-900/5 cursor-zoom-in hover:opacity-95 transition"
            >
            <div class="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition pointer-events-none flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"></path></svg>
              <span>Perbesar</span>
            </div>
          </div>
        `;
      } else if (media.type === 'VIDEO') {
        if (embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com') || embedUrl.includes('drive.google.com')) {
          mediaBody = `
            <div class="w-full max-w-lg aspect-video rounded-2xl overflow-hidden border border-zinc-200 shadow-xs bg-black">
              <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
            </div>
          `;
        } else {
          mediaBody = `
            <div class="w-full max-w-lg aspect-video rounded-2xl overflow-hidden border border-zinc-200 shadow-xs bg-black flex items-center justify-center">
              <video src="${embedUrl}" controls class="w-full h-full object-contain bg-black" playsinline preload="metadata"></video>
            </div>
          `;
        }
      } else if (media.type === 'AUDIO') {
        mediaBody = `
          <div class="w-full max-w-md p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 shadow-2xs space-y-2.5">
            <div class="flex items-center gap-2 text-xs font-bold text-indigo-950">
              <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
              <span>Dengarkan Audio Pertanyaan:</span>
            </div>
            <audio src="${embedUrl}" controls class="w-full h-9"></audio>
          </div>
        `;
      } else if (media.type === 'EMBED') {
        mediaBody = `
          <div class="w-full max-w-2xl aspect-[16/10] rounded-2xl overflow-hidden border border-zinc-200 shadow-xs bg-zinc-100">
            <iframe src="${embedUrl}" class="w-full h-full" frameborder="0"></iframe>
          </div>
        `;
      }

      return `
        <div class="space-y-2">
          <div class="flex ${alignClass}">
            ${mediaBody}
          </div>
          ${media.caption ? `<p class="text-xs text-zinc-600 text-center italic math-renderable">${media.caption}</p>` : ''}
        </div>
      `;
    }

    function renderClientMediaHtml(fieldOrMedia) {
      const mediaList = normalizeMediaList(fieldOrMedia);
      if (!mediaList || mediaList.length === 0) return '';

      if (mediaList.length === 1) {
        return renderSingleClientMediaBody(mediaList[0]);
      }

      const allImages = mediaList.every(m => m.type === 'IMAGE');
      if (allImages) {
        const count = mediaList.length;
        const gridCols = count === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-xl' : (count === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-2xl' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-3xl');
        const cardHeight = count === 2 ? 'h-40 sm:h-48' : (count === 3 ? 'h-36 sm:h-40' : 'h-28 sm:h-32');

        return `
          <div class="space-y-2 my-2.5">
            <div class="grid ${gridCols} gap-2.5 mx-auto">
              ${mediaList.map(m => `
                <div class="relative group rounded-2xl overflow-hidden border border-zinc-200/90 shadow-2xs bg-zinc-900/5 ${cardHeight} flex items-center justify-center p-1.5 cursor-zoom-in hover:border-indigo-300 transition"
                     onclick="openClientImageZoom('${convertToEmbedUrl(m.url, 'IMAGE')}', '${(m.caption||'').replace(/'/g, "\\'")}')">
                  <img src="${convertToEmbedUrl(m.url, 'IMAGE')}" 
                       alt="${m.caption || ''}" 
                       onerror="handleImageErrorFallback(this, '${(m.url||'').replace(/'/g, "\\'")}')"
                       class="max-h-full max-w-full object-contain rounded-xl group-hover:scale-102 transition duration-300">
                  <div class="absolute bottom-1.5 right-1.5 px-2 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition pointer-events-none flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"></path></svg>
                  </div>
                  ${m.caption ? `<span class="absolute bottom-1 inset-x-1 bg-zinc-950/80 text-white text-[10px] px-1.5 py-0.5 rounded-lg truncate text-center italic math-renderable">${m.caption}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div class="space-y-3 my-2.5">
          ${mediaList.map(m => renderSingleClientMediaBody(m)).join('')}
        </div>
      `;
    }

    // =========================================================================
        // AUTO-GROWING TEXTAREA ENGINE (NO SCROLLBARS, ELASTIC EXPANSION)
    // =========================================================================
    function autoResizeTextarea(el) {
      if (!el || el.tagName !== 'TEXTAREA') return;
      el.style.height = 'auto';
      el.style.height = (el.scrollHeight) + 'px';
      el.style.overflowY = 'hidden';
      el.style.overflowX = 'hidden';
    }

    function triggerGlobalAutoResize() {
      requestAnimationFrame(() => {
        document.querySelectorAll('textarea').forEach(autoResizeTextarea);
      });
    }

    document.addEventListener('input', function(e) {
      if (e.target && e.target.tagName === 'TEXTAREA') {
        autoResizeTextarea(e.target);
      }
    });

    document.addEventListener('focusin', function(e) {
      if (e.target && e.target.tagName === 'TEXTAREA') {
        autoResizeTextarea(e.target);
      }
    });

    // =========================================================================
    // UNIVERSAL PROGRESS BAR & SKELETON LOADERS ENGINE
    // =========================================================================
    let activeGlobalLoadingCount = 0;

    function showGlobalLoadingProgress() {
      activeGlobalLoadingCount++;
      const bar = document.getElementById("globalTopProgressBar");
      if (bar) {
        bar.classList.remove("opacity-0");
        bar.classList.add("opacity-100");
      }
    }

    function hideGlobalLoadingProgress() {
      activeGlobalLoadingCount = Math.max(0, activeGlobalLoadingCount - 1);
      if (activeGlobalLoadingCount === 0) {
        const bar = document.getElementById("globalTopProgressBar");
        if (bar) {
          bar.classList.remove("opacity-100");
          bar.classList.add("opacity-0");
        }
      }
    }

    function renderClientFormSkeleton() {
      const container = document.getElementById("dynamicClientStagesContainer");
      if (!container) return;
      container.innerHTML = `
        <div class="space-y-4 animate-pulse">
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div class="h-6 w-52 bg-zinc-200 rounded-lg"></div>
            <div class="h-4 w-3/4 bg-zinc-100 rounded"></div>
            <div class="space-y-3 pt-2">
              <div class="h-4 w-28 bg-zinc-200 rounded"></div>
              <div class="h-11 w-full bg-zinc-100 rounded-xl"></div>
            </div>
          </div>
        </div>
      `;
    }

    function renderRekapSkeleton() {
      const tbody = document.getElementById("rekapTableBody");
      const cardsContainer = document.getElementById("rankingCardsContainer");
      if (tbody) {
        let rowsHtml = '';
        for (let i = 0; i < 4; i++) {
          rowsHtml += `
            <tr class="animate-pulse border-b border-zinc-100">
              <td class="py-3.5 px-4"><div class="h-4 w-6 bg-zinc-200 rounded"></div></td>
              <td class="py-3.5 px-4"><div class="h-4 w-32 bg-zinc-200 rounded"></div></td>
              <td class="py-3.5 px-4"><div class="h-4 w-24 bg-zinc-200 rounded"></div></td>
              <td class="py-3.5 px-4"><div class="h-4 w-16 bg-zinc-100 rounded"></div></td>
              <td class="py-3.5 px-4"><div class="h-4 w-12 bg-zinc-200 rounded font-bold"></div></td>
            </tr>
          `;
        }
        tbody.innerHTML = rowsHtml;
      }
      if (cardsContainer) {
        cardsContainer.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
            <div class="p-5 bg-white rounded-2xl border border-zinc-200 space-y-2">
              <div class="h-4 w-20 bg-zinc-200 rounded"></div>
              <div class="h-8 w-32 bg-zinc-200 rounded"></div>
            </div>
            <div class="p-5 bg-white rounded-2xl border border-zinc-200 space-y-2">
              <div class="h-4 w-20 bg-zinc-200 rounded"></div>
              <div class="h-8 w-32 bg-zinc-200 rounded"></div>
            </div>
            <div class="p-5 bg-white rounded-2xl border border-zinc-200 space-y-2">
              <div class="h-4 w-20 bg-zinc-200 rounded"></div>
              <div class="h-8 w-32 bg-zinc-200 rounded"></div>
            </div>
          </div>
        `;
      }

// ============================================================
// SERVICE WORKER REGISTRATION (PWA Support)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] Registered, scope:', reg.scope);
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - notify user via toast
              if (typeof showToast === 'function') {
                showToast('Pembaruan tersedia! Muat ulang halaman untuk mendapatkan versi terbaru.', 'info', 8000);
              }
            }
          });
        });
      })
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}
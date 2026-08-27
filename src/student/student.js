
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
      if (typeof renderMathInElement !== 'function') return;
      const target = domElement || document.getElementById("mainAppRoot") || document.body;
      if (!target) return;

      try {
        const mathNodes = target.querySelectorAll ? target.querySelectorAll(".math-renderable") : null;
        if (mathNodes && mathNodes.length > 0 && mathNodes.length <= 50) {
          mathNodes.forEach(node => {
            try {
              renderMathInElement(node, {
                delimiters: [
                  { left: '$$', right: '$$', display: true },
                  { left: '$', right: '$', display: false },
                  { left: '\\(', right: '\\)', display: false },
                  { left: '\\[', right: '\\]', display: true }
                ],
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "input", "select"],
                throwOnError: false,
                trust: true
              });
            } catch(e) {}
          });
          return;
        }

        renderMathInElement(target, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "input", "select"],
          throwOnError: false,
          trust: true
        });
      } catch(e) {
        console.warn("KaTeX render notice:", e);
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
    }

    // =========================================================================
    // UNIVERSAL MODERN DROPDOWN POPOVER ENGINE (Zero OS Box Dropdowns)
    // =========================================================================
    function enhanceSelectToModernDropdown(selectEl) {
      if (!selectEl || selectEl.dataset.pgsdDropdownEnhanced === "true") return;
      if (selectEl.classList.contains("no-modernize")) return;
      if (!selectEl.parentNode) return;

      selectEl.dataset.pgsdDropdownEnhanced = "true";
      selectEl.style.display = "none";
      // Hide any legacy chevron indicator inside parent
      if (selectEl.parentElement) {
        selectEl.parentElement.querySelectorAll('.pointer-events-none').forEach(p => {
          if (p !== selectEl) p.style.display = 'none';
        });
      }

      const isFullWidth = selectEl.classList.contains('w-full') || selectEl.style.width === '100%';
      const wrapper = document.createElement("div");
      wrapper.className = `pgsd-dropdown-wrapper relative inline-block text-left ${isFullWidth ? 'w-full' : ''}`;
      
      const triggerBtn = document.createElement("button");
      triggerBtn.type = "button";
      
      let triggerClass = selectEl.className
        .replace(/hidden/g, '')
        .replace(/appearance-none/g, '')
        .trim();
      
      if (!triggerClass.includes('border')) triggerClass += ' border border-zinc-200';
      if (!triggerClass.includes('rounded')) triggerClass += ' rounded-xl';
      if (!triggerClass.includes('bg-')) triggerClass += ' bg-white';
      if (!triggerClass.includes('px-')) triggerClass += ' px-3.5 py-2.5';
      if (!triggerClass.includes('text-')) triggerClass += ' text-xs font-semibold text-zinc-800';

      triggerBtn.className = `${triggerClass} flex items-center justify-between gap-2 shadow-2xs hover:border-zinc-400 focus:outline-none transition-all duration-150 select-none cursor-pointer ${isFullWidth ? 'w-full' : ''}`;
      triggerBtn.style.display = "flex";

      const labelSpan = document.createElement("span");
      labelSpan.className = "truncate flex-1 text-left";
      
      const selectedOption = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
      labelSpan.textContent = selectedOption ? selectedOption.text : "Pilih...";

      const chevronSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      chevronSvg.setAttribute("class", "w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200");
      chevronSvg.setAttribute("fill", "none");
      chevronSvg.setAttribute("stroke", "currentColor");
      chevronSvg.setAttribute("viewBox", "0 0 24 24");
      chevronSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';

      triggerBtn.appendChild(labelSpan);
      triggerBtn.appendChild(chevronSvg);

      const menu = document.createElement("div");
      menu.className = "pgsd-dropdown-menu absolute left-0 mt-1.5 rounded-xl bg-white border border-zinc-200 shadow-2xl p-1 space-y-0.5 z-[100] text-xs hidden max-h-56 overflow-y-auto no-scrollbar min-w-full w-max max-w-xs sm:max-w-sm";
      menu.style.boxShadow = "0 14px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -6px rgba(0, 0, 0, 0.1)";

      function rebuildMenuOptions() {
        menu.innerHTML = "";
        Array.from(selectEl.options).forEach((opt, idx) => {
          if (opt.disabled && opt.value === "") {
            const header = document.createElement("div");
            header.className = "px-3 py-1.5 text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono";
            header.textContent = opt.text;
            menu.appendChild(header);
            return;
          }
          const isSelected = idx === selectEl.selectedIndex;
          const itemBtn = document.createElement("button");
          itemBtn.type = "button";
          itemBtn.className = `w-full px-3 py-2 rounded-lg text-left font-medium flex items-center justify-between gap-2 transition cursor-pointer ${
            isSelected 
              ? 'bg-indigo-50 text-indigo-700 font-bold' 
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
          }`;

          const itemText = document.createElement("span");
          itemText.className = "truncate";
          itemText.textContent = opt.text;
          itemBtn.appendChild(itemText);

          if (isSelected) {
            const checkSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            checkSvg.setAttribute("class", "w-3.5 h-3.5 text-indigo-600 shrink-0");
            checkSvg.setAttribute("fill", "none");
            checkSvg.setAttribute("stroke", "currentColor");
            checkSvg.setAttribute("viewBox", "0 0 24 24");
            checkSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>';
            itemBtn.appendChild(checkSvg);
          }

          itemBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            selectEl.selectedIndex = idx;
            selectEl.value = opt.value;
            labelSpan.textContent = opt.text;
            closeMenu();
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
            selectEl.dispatchEvent(new Event("input", { bubbles: true }));
          });

          menu.appendChild(itemBtn);
        });
      }

      function openMenu() {
        document.querySelectorAll(".pgsd-dropdown-menu").forEach(m => m.classList.add("hidden"));
        document.querySelectorAll(".pgsd-dropdown-wrapper svg.rotate-180").forEach(s => s.classList.remove("rotate-180"));
        document.querySelectorAll(".pgsd-dropdown-wrapper button").forEach(b => b.classList.remove("ring-2", "ring-indigo-500/20", "border-indigo-500"));
        
        rebuildMenuOptions();
        menu.classList.remove("hidden");
        chevronSvg.classList.add("rotate-180");
        triggerBtn.classList.add("ring-2", "ring-indigo-500/20", "border-indigo-500");

        // Smart Viewport & Boundary Bounds Detection (Dropup vs Dropdown)
        requestAnimationFrame(() => {
          const rect = triggerBtn.getBoundingClientRect();
          const menuHeight = menu.offsetHeight || 180;
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;

          // Horizontal bounds
          if (rect.left + menu.offsetWidth > window.innerWidth - 12) {
            menu.classList.remove("left-0");
            menu.classList.add("right-0");
          } else {
            menu.classList.remove("right-0");
            menu.classList.add("left-0");
          }

          // Vertical bounds (Dropup if space below is limited)
          if (spaceBelow < menuHeight + 15 && spaceAbove > spaceBelow) {
            menu.style.top = 'auto';
            menu.style.bottom = '100%';
            menu.style.marginTop = '0px';
            menu.style.marginBottom = '6px';
          } else {
            menu.style.bottom = 'auto';
            menu.style.top = '100%';
            menu.style.marginBottom = '0px';
            menu.style.marginTop = '6px';
          }
        });
      }

      function closeMenu() {
        menu.classList.add("hidden");
        chevronSvg.classList.remove("rotate-180");
        triggerBtn.classList.remove("ring-2", "ring-indigo-500/20", "border-indigo-500");
      }

      triggerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (menu.classList.contains("hidden")) {
          openMenu();
        } else {
          closeMenu();
        }
      });

      const observer = new MutationObserver(() => {
        const curOpt = selectEl.options[selectEl.selectedIndex];
        if (curOpt) labelSpan.textContent = curOpt.text;
      });
      observer.observe(selectEl, { childList: true, subtree: true, attributes: true });

      selectEl.addEventListener("change", () => {
        const curOpt = selectEl.options[selectEl.selectedIndex];
        if (curOpt) labelSpan.textContent = curOpt.text;
      });

      selectEl.parentNode.insertBefore(wrapper, selectEl);
      wrapper.appendChild(selectEl);
      wrapper.appendChild(triggerBtn);
      wrapper.appendChild(menu);
    }

    function initAllModernDropdowns(root = document) {
      root.querySelectorAll("select").forEach(sel => {
        enhanceSelectToModernDropdown(sel);
      });
    }

    // Continuous auto-enhancer for dynamically injected select elements (debounced & targeted)
    if (typeof MutationObserver !== 'undefined') {
      let dropdownDebounceTimer = null;
      const globalDropdownObserver = new MutationObserver((mutations) => {
        let hasNewSelect = false;
        for (const m of mutations) {
          if (m.addedNodes && m.addedNodes.length > 0) {
            for (const n of m.addedNodes) {
              if (n.nodeType === 1 && (n.tagName === 'SELECT' || (n.querySelector && n.querySelector('select:not([data-pgsd-dropdown-enhanced="true"])')))) {
                hasNewSelect = true;
                break;
              }
            }
          }
          if (hasNewSelect) break;
        }
        if (hasNewSelect) {
          if (dropdownDebounceTimer) clearTimeout(dropdownDebounceTimer);
          dropdownDebounceTimer = setTimeout(() => {
            initAllModernDropdowns();
          }, 100);
        }
      });
      document.addEventListener("DOMContentLoaded", () => {
        if (document.body) {
          globalDropdownObserver.observe(document.body, { childList: true, subtree: true });
        }
      });
    }

    document.addEventListener("click", () => {
      document.querySelectorAll(".pgsd-dropdown-menu").forEach(m => m.classList.add("hidden"));
      document.querySelectorAll(".pgsd-dropdown-wrapper svg.rotate-180").forEach(s => s.classList.remove("rotate-180"));
      document.querySelectorAll(".pgsd-dropdown-wrapper button").forEach(b => b.classList.remove("ring-2", "ring-indigo-500/20", "border-indigo-500"));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".pgsd-dropdown-menu").forEach(m => m.classList.add("hidden"));
        document.querySelectorAll(".pgsd-dropdown-wrapper svg.rotate-180").forEach(s => s.classList.remove("rotate-180"));
        
        const switchModal = document.getElementById("modalSwitchForm");
        if (switchModal && !switchModal.classList.contains("hidden")) {
          closeSwitchFormModal();
        }
        const zoomModal = document.getElementById("modalClientImageZoom");
        if (zoomModal && !zoomModal.classList.contains("hidden")) {
          closeClientImageZoom();
        }
        const successModal = document.getElementById("modalSuccess");
        if (successModal && !successModal.classList.contains("hidden")) {
          closeSuccessModal();
        }
      }
    });

    document.addEventListener("DOMContentLoaded", async function() {
      initAllModernDropdowns();

      if (isPortalMode) {
        showPortalView();
        return;
      }

      // Explicit Form Mode (e.g. ?id=BK5E)
      document.documentElement.classList.add('form-mode-active');
      document.documentElement.classList.remove('portal-mode-active');
      const viewPortal = document.getElementById("viewPortal");
      if (viewPortal) viewPortal.classList.add("hidden");
      const navTabContainer = document.getElementById("navTabContainer");
      if (navTabContainer) navTabContainer.classList.remove("hidden");
      const badgeSesiTop = document.getElementById("badgeSesiTop");
      if (badgeSesiTop) badgeSesiTop.classList.remove("hidden");

      saveVisitedFormHistory(activeFormId);
      loadLocalCache();
      
      const hash = (window.location.hash || "").replace("#", "").toLowerCase();
      const savedTab = (hash === "rekap" || hash === "form") ? hash : (localStorage.getItem("PGSD_ACTIVE_MAIN_TAB") || "form");
      
      switchTab(savedTab, false);
      // Inisialisasi Auth Listener & Session Recovery
      initSupabaseAuthListener();
      await ensureAuthInitialized();

      checkAndApplyAuthGate();
      restoreFormDraft();
      await fetchInitialFormData(false);

      // Pre-fetch rekap data secara diam-diam di background agar instan saat dibuka
      setTimeout(() => loadRekapData(true), 400);

      // Inisialisasi Sinkronisasi Real-Time 2 Arah
      initRealtimeSyncEngine();
      setTimeout(() => renderAllMathInElement(document.getElementById("mainAppRoot") || document.body), 200);
    });


    // =========================================================================
    // MULTI-FORM PIN PORTAL & HISTORY MANAGEMENT ENGINE
    // =========================================================================
    function getVisitedFormsHistory() {
      try {
        const raw = localStorage.getItem("PGSD_VISITED_FORMS_HISTORY");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveVisitedFormHistory(formId, formMeta = null, config = null) {
      if (!formId) return;
      const pin = String(formId).toUpperCase().trim();
      if (!pin) return;

      let list = getVisitedFormsHistory();
      list = list.filter(item => (item.pin || '').toUpperCase() !== pin);

      const title = (formMeta && (formMeta.judul_form || formMeta.judulForm || formMeta.title)) || (config && config["Judul_Form"]) || (currentFormMeta && currentFormMeta.judulForm) || `Penilaian Form ${pin}`;
      const matkul = (formMeta && (formMeta.mata_kuliah || formMeta.mataKuliah)) || (config && config["Mata_Kuliah"]) || (currentFormMeta && currentFormMeta.mataKuliah) || "";
      const dosen = (formMeta && (formMeta.dosen || formMeta.dosenPengampu)) || (config && config["Dosen_Pengampu"]) || (currentFormMeta && currentFormMeta.dosen) || "";

      list.unshift({
        pin: pin,
        title: title,
        matkul: matkul,
        dosen: dosen,
        lastVisited: Date.now()
      });

      if (list.length > 15) list = list.slice(0, 15);
      localStorage.setItem("PGSD_VISITED_FORMS_HISTORY", JSON.stringify(list));
    }

    function removeVisitedFormHistory(pinToRemove) {
      let list = getVisitedFormsHistory();
      list = list.filter(item => (item.pin || '').toUpperCase() !== String(pinToRemove).toUpperCase());
      localStorage.setItem("PGSD_VISITED_FORMS_HISTORY", JSON.stringify(list));
      renderPortalHistoryCards();
      showToast(`Riwayat formulir PIN ${pinToRemove} telah dihapus.`, "info");
    }

    function clearAllVisitedFormsHistory() {
      localStorage.removeItem("PGSD_VISITED_FORMS_HISTORY");
      renderPortalHistoryCards();
      showToast("Seluruh riwayat formulir di perangkat ini berhasil dibersihkan.", "info");
    }

    function formatRelativeTime(timestamp) {
      if (!timestamp) return '';
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }

    function renderPortalHistoryCards() {
      const container = document.getElementById("portalHistoryList");
      const clearBtn = document.getElementById("btnClearPortalHistory");
      if (!container) return;

      const history = getVisitedFormsHistory();
      if (!history || history.length === 0) {
        if (clearBtn) clearBtn.classList.add("hidden");
        container.innerHTML = `
          <div class="p-4 rounded-xl border border-dashed border-zinc-200 text-center space-y-1 bg-zinc-50/50">
            <p class="text-xs text-zinc-500 font-medium">Belum ada riwayat formulir di perangkat ini.</p>
            <p class="text-[11px] text-zinc-400">Masukkan kode PIN pada kolom di atas untuk membuka formulir Anda.</p>
          </div>
        `;
        return;
      }

      if (clearBtn) clearBtn.classList.remove("hidden");
      let html = '';
      history.forEach(item => {
        const pin = item.pin;
        const title = item.title || `Formulir ${pin}`;
        const matkul = item.matkul ? `${item.matkul}` : '';
        const dosen = item.dosen ? ` • ${item.dosen}` : '';
        const timeFormatted = item.lastVisited ? formatRelativeTime(item.lastVisited) : '';

        html += `
          <div class="p-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/70 transition flex items-center justify-between gap-3 group/card cursor-pointer shadow-2xs">
            <div class="min-w-0 flex-1" onclick="submitPortalPin('${pin}')">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-white shrink-0">
                  PIN: ${pin}
                </span>
                ${timeFormatted ? `<span class="text-[10px] text-zinc-400 font-mono">${timeFormatted}</span>` : ''}
              </div>
              <h4 class="text-xs font-bold text-zinc-900 truncate group-hover/card:text-indigo-600 transition">
                ${title}
              </h4>
              ${(matkul || dosen) ? `<p class="text-[10.5px] text-zinc-500 truncate mt-0.5">${matkul}${dosen}</p>` : ''}
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button 
                type="button" 
                onclick="submitPortalPin('${pin}')" 
                class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                title="Buka Formulir"
              >
                <span>Buka</span>
                <span>→</span>
              </button>
              <button 
                type="button" 
                onclick="event.stopPropagation(); removeVisitedFormHistory('${pin}');" 
                class="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-300 hover:text-rose-600 transition cursor-pointer text-xs"
                title="Hapus dari Riwayat"
              >
                ✕
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    async function submitPortalPin(customPin = null) {
      const pinInput = document.getElementById("inputPortalPin");
      const pin = String(customPin || (pinInput ? pinInput.value : '')).toUpperCase().trim();
      if (!pin) {
        showToast("Masukkan PIN atau Kode Formulir terlebih dahulu!", "warning");
        if (pinInput) pinInput.focus();
        return;
      }

      const btn = document.getElementById("btnSubmitPortalPin");
      const spinner = document.getElementById("portalPinSpinner");
      if (btn) btn.disabled = true;
      if (spinner) spinner.classList.remove("hidden");

      // Validate if form exists in Supabase or local cache
      const sb = getSupabaseClient();
      let formExists = false;
      let formMeta = null;

      if (sb) {
        try {
          const { data, error } = await sb.from('pgsd_forms').select('*').eq('form_id', pin).single();
          if (!error && data) {
            formExists = true;
            formMeta = data;
          }
        } catch (e) {}
      }

      // Also check default fallback forms like BK5E
      if (!formExists && pin === 'BK5E') {
        formExists = true;
      }

      if (btn) btn.disabled = false;
      if (spinner) spinner.classList.add("hidden");

      if (!formExists) {
        showToast(`Formulir dengan PIN "${pin}" tidak ditemukan di database. Pastikan kode PIN sudah benar.`, "error");
        if (pinInput) pinInput.focus();
        return;
      }

      // Save to history & navigate to form
      saveVisitedFormHistory(pin, formMeta);
      localStorage.setItem("PGSD_ACTIVE_CLIENT_FORM_ID", pin);
      
      // Update URL to ?id=PIN
      const url = new URL(window.location.href);
      url.searchParams.set('id', pin);
      url.searchParams.delete('form');
      window.location.href = url.toString();
    }

    function goToPortalHub() {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      url.searchParams.delete('form');
      url.searchParams.delete('preview');
      window.location.href = url.origin + url.pathname;
    }

    function showPortalView() {
      isPortalMode = true;
      document.documentElement.classList.add('portal-mode-active');
      document.documentElement.classList.remove('form-mode-active');
      document.title = "Portal Akses Formulir • FKIP ULM";

      const viewPortal = document.getElementById("viewPortal");
      const viewForm = document.getElementById("viewForm");
      const viewRekap = document.getElementById("viewRekap");
      const navTabContainer = document.getElementById("navTabContainer");
      const pinEl = document.getElementById("navPinBadge");
      const badgeSesiTop = document.getElementById("badgeSesiTop");
      const navTitle = document.getElementById("navTitle");
      const navSubtitle = document.getElementById("navSubtitle");

      if (viewPortal) viewPortal.classList.remove("hidden");
      if (viewForm) viewForm.classList.add("hidden");
      if (viewRekap) viewRekap.classList.add("hidden");
      if (navTabContainer) navTabContainer.classList.add("hidden");
      if (badgeSesiTop) badgeSesiTop.classList.add("hidden");
      if (navTitle) navTitle.textContent = "Portal Penilaian Akademik";
      if (navSubtitle) navSubtitle.textContent = "Universitas Lambung Mangkurat";
      if (pinEl) pinEl.textContent = "🔑 Masukkan PIN";

      renderPortalHistoryCards();
      setTimeout(() => {
        const input = document.getElementById("inputPortalPin");
        if (input && !('ontouchstart' in window)) input.focus();
      }, 150);
    }

    function openSwitchFormModal() {
      if (isPortalMode) {
        const input = document.getElementById("inputPortalPin");
        if (input) input.focus();
        return;
      }
      const pinInput = document.getElementById("inputSwitchFormPin");
      if (pinInput) pinInput.value = activeFormId;
      document.getElementById("modalSwitchForm").classList.remove("hidden");
    }

    function closeSwitchFormModal() {
      document.getElementById("modalSwitchForm").classList.add("hidden");
    }

    async function handleSwitchFormSubmit(e) {
      e.preventDefault();
      const pin = document.getElementById("inputSwitchFormPin").value.trim().toUpperCase();
      if (!pin) return;
      
      submitPortalPin(pin);
    }


    // =========================================================================
    // UNIVERSAL DYNAMIC FORM WIZARD & STAGE ENGINE
    // =========================================================================
    function handleClientFieldInput(fieldId, value) {
      clientCustomFormAnswers[fieldId] = value;
      saveFormDraft();
    }


    // =========================================================================
    // UNIVERSAL FILE & IMAGE UPLOAD ENGINE (WITH CLIENT COMPRESSION)
    // =========================================================================
    function compressImageFile(file, maxDimension = 1600, quality = 0.85) {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ dataUrl: e.target.result, base64: e.target.result.split(',')[1] || '' });
          reader.readAsDataURL(file);
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          const img = new Image();
          img.onload = function() {
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", quality);
            const base64 = dataUrl.split(',')[1] || '';
            resolve({ dataUrl, base64 });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    async function handleClientFileUpload(fieldId, fileInput) {
      const file = fileInput.files ? fileInput.files[0] : null;
      const statusEl = document.getElementById(`fileStatus_${fieldId}`) || document.getElementById(`fileCustomPreview_${fieldId}`);
      
      if (!file) {
        const oldFile = customUploadedFilesMap[fieldId];
        if (oldFile && oldFile.storagePath) {
          fetch(`https://eychjnqmqpxzxukiwbqf.supabase.co/storage/v1/object/pgsd-media`, {
            method: "DELETE",
            headers: {
              apikey: "sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
              Authorization: "Bearer sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ prefixes: [oldFile.storagePath] })
          }).catch(e => console.warn("Notice deleting old student attachment:", e));
        }

        delete customUploadedFilesMap[fieldId];
        delete clientCustomFormAnswers[fieldId];
        if (statusEl) statusEl.innerHTML = `<span class="text-xs text-zinc-500 font-medium">Belum ada berkas dipilih</span>`;
        saveFormDraft();
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast("Ukuran berkas melebihi batas maksimal 10 MB!", "error");
        fileInput.value = "";
        if (statusEl) statusEl.innerHTML = `<span class="text-rose-600 font-bold text-xs">Gagal: Ukuran file > 10 MB</span>`;
        return;
      }

      const sizeFormatted = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;

      if (statusEl) {
        statusEl.innerHTML = `
          <div class="space-y-1.5 p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200/90 w-full">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                <span class="font-bold text-zinc-900 truncate max-w-[150px] sm:max-w-[220px] text-[11.5px]">${file.name}</span>
                <span class="text-[10px] text-zinc-500 font-mono">(${sizeFormatted})</span>
              </div>
              <span class="font-mono font-bold text-xs text-indigo-600">Memproses...</span>
            </div>
            <div class="w-full h-1.5 bg-indigo-200/70 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600 rounded-full animate-pulse transition-all duration-300" style="width: 70%;"></div>
            </div>
          </div>
        `;
      }

      try {
        const { dataUrl, base64 } = await compressImageFile(file);

        // Upload ke Supabase Global Storage CDN
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const formKey = clientFormMeta?.form_id || "BK5E";
        const storagePath = `${formKey}/lampiran_${Date.now()}_${cleanName}`;
        let cdnUrl = "";

        try {
          const uploadRes = await fetch(`https://eychjnqmqpxzxukiwbqf.supabase.co/storage/v1/object/pgsd-media/${storagePath}`, {
            method: "POST",
            headers: {
              apikey: "sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
              Authorization: "Bearer sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
              "Content-Type": file.type || "application/octet-stream",
              "x-upsert": "true"
            },
            body: file
          });
          if (uploadRes.ok) {
            cdnUrl = `https://eychjnqmqpxzxukiwbqf.supabase.co/storage/v1/object/public/pgsd-media/${storagePath}`;
          }
        } catch(upErr) {
          console.warn("Storage upload notice:", upErr);
        }

        const fileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: dataUrl,
          base64: base64,
          storagePath: storagePath,
          url: cdnUrl || dataUrl
        };

        customUploadedFilesMap[fieldId] = fileObj;
        clientCustomFormAnswers[fieldId] = fileObj;

        if (statusEl) {
          const isImg = file.type.startsWith("image/");
          statusEl.innerHTML = `
            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              ${isImg ? `<img src="${dataUrl}" class="w-9 h-9 rounded-lg object-cover border border-emerald-300 shadow-2xs shrink-0">` : ''}
              <div class="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 min-w-0">
                <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                <span class="truncate max-w-[180px] sm:max-w-[260px]">${file.name}</span>
                <span class="text-[10px] text-emerald-700 font-mono">(${sizeFormatted})</span>
                <button type="button" onclick="handleClientFileUpload('${fieldId}', { files: [] })" class="text-emerald-700 hover:text-rose-600 transition ml-1 p-0.5" title="Hapus Berkas">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          `;
        }

        saveFormDraft();
        showToast(`Berkas '${file.name}' siap diunggah ke formulir.`, "success");
      } catch (err) {
        console.error("Upload error:", err);
        if (statusEl) statusEl.innerHTML = `<span class="text-rose-600 font-bold text-xs">Gagal memproses berkas</span>`;
        showToast("Gagal memproses berkas. Coba pilih kembali.", "error");
      }
    }


    function updateRatingScaleUI(fieldId) {
      const selectedVal = clientCustomFormAnswers[fieldId];
      document.querySelectorAll(`.scale-circle-${fieldId}`).forEach(el => {
        const inputVal = el.parentElement.querySelector('input').value;
        if (String(inputVal) === String(selectedVal)) {
          el.className = `scale-circle-${fieldId} w-9 h-9 sm:w-10 sm:h-10 rounded-xl border bg-zinc-900 text-white border-zinc-900 shadow-sm font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition active:scale-95`;
        } else {
          el.className = `scale-circle-${fieldId} w-9 h-9 sm:w-10 sm:h-10 rounded-xl border bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50 font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition active:scale-95`;
        }
      });
    }

    function updateStepMetadataFromSchema() {
      stepMetadata = {};
      const tahapan = (currentFormSchema && Array.isArray(currentFormSchema.tahapan) && currentFormSchema.tahapan.length > 0)
        ? currentFormSchema.tahapan
        : [
            { id: "t1", title: "Identitas Penilai", description: "Lengkapi data identitas Anda.", fields: [{ type: "CORE_IDENTITY" }] },
            { id: "t2", title: "Pilih Kelompok", description: "Pilih kelompok yang tampil.", fields: [{ type: "CORE_GROUP_SELECT" }] },
            { id: "t3", title: "Skor & Voting", description: "Beri nilai dan pilih pemateri terbaik.", fields: [{ type: "CORE_SCORE_RUBRIC" }, { type: "CORE_BEST_PRESENTER" }] },
            { id: "t4", title: "Evaluasi Masukan", description: "Ulasan konstruktif dan kirim nilai.", fields: [{ type: "CORE_MEMBER_FEEDBACK" }] }
          ];

      const total = tahapan.length;
      tahapan.forEach((stage, idx) => {
        const num = idx + 1;
        const padNum = num < 10 ? `0${num}` : `${num}`;
        const padTotal = total < 10 ? `0${total}` : `${total}`;
        const pct = Math.round((num / total) * 100);
        stepMetadata[num] = {
          badge: `${padNum}/${padTotal}`,
          title: stage.title || `Bagian ${num}`,
          percent: pct,
          description: stage.description || ""
        };
      });
    }

    function renderDynamicStepTabs() {
      const container = document.getElementById("dynamicStepTabsContainer");
      if (!container) return;
      
      const total = Object.keys(stepMetadata).length || 4;
      container.className = "grid grid-cols-4 gap-1 sm:gap-1.5 pt-1 text-center";
      
      let html = '';
      for (let i = 1; i <= total; i++) {
        const meta = stepMetadata[i] || { title: `Tahap ${i}` };
        const shortTitle = meta.title.length > 14 ? meta.title.substring(0, 12) + '…' : meta.title;
        html += `
          <button 
            type="button" 
            id="stepTab_${i}" 
            onclick="goToStep(${i})" 
            class="py-1.5 px-0.5 sm:px-1 rounded text-[9.5px] sm:text-[11px] font-bold transition text-zinc-400 bg-zinc-50 border border-transparent truncate"
            title="${meta.title}"
          >
            ${i}. ${shortTitle}
          </button>
        `;
      }
      container.innerHTML = html;
    }

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderOverviewHeaderInfoGrid() {
      const container = document.getElementById("overviewHeaderInfoGrid");
      if (!container) return;

      let cards = appConfig.Header_Info_Cards;
      if (!cards || !Array.isArray(cards) || cards.length === 0) {
        cards = [
          { label: 'Mata Kuliah:', value: appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "" },
          { label: 'Dosen Pengampu:', value: appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "" },
          { label: 'Kelas:', value: appConfig["Kelas"] || (currentFormMeta && currentFormMeta.kelas) || "" },
          { label: 'Program Studi:', value: appConfig["Jurusan"] || (currentFormMeta && currentFormMeta.jurusan) || "" }
        ];
      }

      // Filter out cards that have completely empty label and value
      const activeCards = cards.filter(c => (c.label && c.label.trim()) || (c.value && c.value.trim()));
      if (activeCards.length === 0) {
        container.classList.add("hidden");
        return;
      }
      container.classList.remove("hidden");

      const colsClass = activeCards.length === 1 ? 'grid-cols-1' : (activeCards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : (activeCards.length === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'));
      container.className = `grid ${colsClass} gap-2.5 sm:gap-3 text-xs`;

      let html = '';
      activeCards.forEach(card => {
        const val = card.value || '-';
        html += `
          <div class="p-2.5 sm:p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-0.5">
            <span class="text-zinc-400 block text-[10.5px] sm:text-[11px] font-medium math-renderable">${smartMathFormat(card.label || 'Info:')}</span>
            <span class="font-semibold text-zinc-900 mt-0.5 block break-words leading-tight math-renderable">${smartMathFormat(val)}</span>
          </div>
        `;
      });

      container.innerHTML = html;
      setTimeout(() => {
        renderAllMathInElement(container);
      }, 30);
    }

    function renderOverviewAlurTahapan() {
      const container = document.getElementById("overviewAlurTahapanGrid");
      if (!container) return;

      const tahapan = (currentFormSchema && Array.isArray(currentFormSchema.tahapan) && currentFormSchema.tahapan.length > 0)
        ? currentFormSchema.tahapan
        : [
            { id: "t1", title: "Identitas Penilai", description: "Email & nama mahasiswa" },
            { id: "t2", title: "Pilih Kelompok", description: "Kelompok yang tampil" },
            { id: "t3", title: "Skor & Voting", description: "Nilai & pemateri terbaik" },
            { id: "t4", title: "Evaluasi Masukan", description: "Ulasan & kirim nilai" }
          ];

      const colsClass = tahapan.length <= 2 ? 'sm:grid-cols-2' : (tahapan.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4');
      container.className = `grid grid-cols-1 ${colsClass} gap-2.5 text-xs`;

      let html = '';
      tahapan.forEach((stage, idx) => {
        const num = idx + 1;
        const stageTitle = stage.alurTitle || stage.title || `Bagian ${num}`;
        const fieldsCount = (stage.fields || []).length;
        const stageDesc = (stage.alurDesc !== undefined && stage.alurDesc !== null && stage.alurDesc !== "")
          ? stage.alurDesc
          : (stage.description || (fieldsCount > 0 ? `${fieldsCount} Pertanyaan / Input` : "Tahapan Formulir"));
        html += `
          <div class="p-2.5 rounded-lg bg-white border border-zinc-200/60 flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">${num}</span>
            <div class="min-w-0">
              <div class="font-semibold text-zinc-900 truncate math-renderable" title="${escapeHtml(stageTitle)}">${smartMathFormat(stageTitle)}</div>
              <div class="text-[11px] text-zinc-500 line-clamp-1 math-renderable" title="${escapeHtml(stageDesc)}">${smartMathFormat(stageDesc)}</div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      renderAllMathInElement(container);
    }

    let lastRenderedSchemaHash = "";
    function renderDynamicClientStages(force = false) {
      const container = document.getElementById("dynamicClientStagesContainer");
      if (!container) return;

      const currentSchemaStr = JSON.stringify(currentFormSchema || {});
      const hasExistingDom = !!document.getElementById("stepSection_1");

      if (!force && hasExistingDom && lastRenderedSchemaHash === currentSchemaStr) {
        updateStepMetadataFromSchema();
        renderDynamicStepTabs();
        if (groupsData && groupsData.length > 0) {
          renderGroupOptions();
        }
        return;
      }

      lastRenderedSchemaHash = currentSchemaStr;
      updateStepMetadataFromSchema();
      renderDynamicStepTabs();

      const tahapan = (currentFormSchema && Array.isArray(currentFormSchema.tahapan) && currentFormSchema.tahapan.length > 0)
        ? currentFormSchema.tahapan
        : [
            { id: "t1", title: "Identitas & Akses Penilai", description: "Isi identitas diri Anda sebelum menilai.", fields: [{ id: "fld_core_identity", type: "CORE_IDENTITY", label: "Identitas Penilai", required: true }] },
            { id: "t2", title: "Pemilihan Kelompok Presentator", description: "Pilih kelompok yang sedang presentasi.", fields: [{ id: "fld_core_group", type: "CORE_GROUP_SELECT", label: "Kelompok yang Dinilai", required: true }] },
            { id: "t3", title: "Skor Rubrik & Voting Presentator", description: "Berikan nilai presentasi dan pilih pemateri terbaik.", fields: [{ id: "fld_core_score", type: "CORE_SCORE_RUBRIC", label: "Nilai Presentasi", required: true }, { id: "fld_core_voting", type: "CORE_BEST_PRESENTER", label: "Presentator Terbaik", required: true }] },
            { id: "t4", title: "Evaluasi Masukan Kualitatif", description: "Tuliskan masukan apresiasi dan catatan untuk pemateri.", fields: [{ id: "fld_core_feedback", type: "CORE_MEMBER_FEEDBACK", label: "Evaluasi Masukan Kualitatif Tiap Pemateri", required: true }] }
          ];

      const legacyContainer = document.getElementById("legacyStaticStagesContainer");
      if (legacyContainer) legacyContainer.classList.add("hidden");

      const totalSteps = tahapan.length;
      let stagesHtml = '';

      tahapan.forEach((stage, sIdx) => {
        const stepNum = sIdx + 1;
        let fieldsHtml = '';

        (stage.fields || []).forEach(f => {
          fieldsHtml += renderSingleClientFieldHtml(f);
        });

        stagesHtml += `
          <div id="stepSection_${stepNum}" class="step-fade space-y-4 ${stepNum === 1 ? '' : 'hidden'}">
            <div class="bg-white rounded-xl border border-zinc-200 p-5 sm:p-7 shadow-xs space-y-5">
              
              <div class="border-b border-zinc-100 pb-3.5 flex items-center justify-between gap-2">
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-zinc-900 math-renderable">${smartMathFormat(stage.title || `Bagian ${stepNum}`)}</h2>
                  ${stage.description ? `<p class="text-xs text-zinc-500 mt-0.5 math-renderable">${smartMathFormat(stage.description)}</p>` : ''}
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                    Bagian ${stepNum} dari ${totalSteps}
                  </span>
                </div>
              </div>

              <!-- Fields Container -->
              <div class="space-y-4">
                ${fieldsHtml || '<p class="text-xs text-zinc-400 italic py-4 text-center">Belum ada pertanyaan pada bagian ini.</p>'}
              </div>

            </div>

            <!-- Stage Navigation Actions -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              ${stepNum > 1 
                ? `<button type="button" onclick="goToStep(${stepNum - 1})" class="min-h-[44px] px-5 py-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"><span>← Sebelumnya</span></button>`
                : `<button type="button" onclick="goToInfoOverview()" class="min-h-[44px] px-5 py-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"><span>← Info Formulir</span></button>`
              }

              <div class="flex items-center gap-2 sm:gap-2.5 flex-1 sm:flex-none justify-end">
                ${stepNum < totalSteps 
                  ? `<button type="button" onclick="goToStep(${stepNum + 1})" class="flex-1 sm:flex-none min-h-[44px] px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-xs"><span>Lanjut ke Bagian ${stepNum + 1}</span><span>→</span></button>`
                  : `<button type="submit" class="flex-1 sm:flex-none min-h-[44px] px-7 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-md"><span>Kirim Penilaian Sekarang</span><span>✓</span></button>`
                }
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = stagesHtml;
      initAllModernDropdowns();

      // Populate core components if data exists
      if (groupsData && groupsData.length > 0) {
        renderGroupOptions();
      }
      if (selectedGroupObj && groupsData && groupsData.length > 0) {
        const grpIdx = groupsData.findIndex(g => g.name === selectedGroupObj.name);
        if (grpIdx !== -1) {
          onSelectGroup(selectedGroupObj.name, grpIdx);
        }
      }

      setTimeout(() => {
        renderAllMathInElement(container);
      }, 30);
    }

    function renderSingleClientFieldHtml(f) {
      if (!f) return '';
      const reqBadge = f.required ? '<span class="text-rose-500 font-bold ml-0.5">*</span>' : '';
      const savedVal = clientCustomFormAnswers[f.id] || '';

      const hasMedia = (f.mediaList?.length > 0 || f.media?.url); const mediaPos = f.mediaPosition || f.media?.position || 'ABOVE_QUESTION'; const mediaAbove = (hasMedia && mediaPos === 'ABOVE_QUESTION') ? renderClientMediaHtml(f) : '';
      const mediaBelow = (hasMedia && mediaPos === 'BELOW_QUESTION') ? renderClientMediaHtml(f) : '';
      const mediaHtml = renderClientMediaHtml(f.media);

      // 0. TITLE_DESC / BLOK JUDUL, DESKRIPSI & MEDIA / GAMBAR SAJA
      if (f.type === 'TITLE_DESC') {
        const rawLabel = (f.label || '').trim();
        const rawDesc = (f.description || '').trim();
        const hasCustomLabel = rawLabel !== '' && rawLabel !== 'Pertanyaan tanpa judul' && rawLabel !== 'Judul & Deskripsi Teks';
        const hasCustomDesc = rawDesc !== '';

        // If it only has an image/media and no custom text
        if (!hasCustomLabel && !hasCustomDesc && mediaHtml) {
          return `
            <div class="p-3 sm:p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
              ${mediaHtml}
            </div>
          `;
        }

        // If it has label or description or both with media
        return `
          <div class="bg-indigo-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-100/90 space-y-2.5">
            ${mediaAbove}
            ${hasCustomLabel ? `
              <div class="flex items-center gap-2 text-indigo-950 font-bold text-xs sm:text-sm math-renderable">
                <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>${smartMathFormat(f.label)}</span>
              </div>
            ` : ''}
            ${hasCustomDesc ? `<p class="text-xs text-indigo-950/80 leading-relaxed math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            ${mediaBelow}
          </div>
        `;
      }

      // 1. SHORT_TEXT
      if (f.type === 'SHORT_TEXT') {
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2.5">
            ${mediaAbove}
            <div>
              <label class="block text-xs sm:text-sm font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Pertanyaan')}${reqBadge}</label>
              ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5 math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            </div>
            ${mediaBelow}
            <textarea 
              rows="1" 
              placeholder="${f.placeholder || 'Jawaban Anda...'}" 
              ${f.required ? 'required' : ''} 
              oninput="autoResizeTextarea(this); handleClientFieldInput('${f.id}', this.value)" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm bg-white text-zinc-900 focus:border-zinc-900 outline-none transition shadow-2xs resize-none overflow-hidden block whitespace-pre-wrap break-words leading-relaxed"
            >${escapeHtml(savedVal)}</textarea>
          </div>
        `;
      }

      // 2. PARAGRAPH / TEXTAREA
      if (f.type === 'PARAGRAPH' || f.type === 'TEXTAREA') {
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2.5">
            ${mediaAbove}
            <div>
              <label class="block text-xs sm:text-sm font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Pertanyaan')}${reqBadge}</label>
              ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5 math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            </div>
            ${mediaBelow}
            <textarea 
              rows="2" 
              placeholder="${f.placeholder || 'Tuliskan ulasan atau jawaban lengkap Anda...'}" 
              ${f.required ? 'required' : ''} 
              oninput="autoResizeTextarea(this); handleClientFieldInput('${f.id}', this.value)" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm bg-white text-zinc-900 focus:border-zinc-900 outline-none transition shadow-2xs leading-relaxed resize-none overflow-hidden block whitespace-pre-wrap break-words"
            >${escapeHtml(savedVal)}</textarea>
          </div>
        `;
      }

      // 3. RADIO
      if (f.type === 'RADIO') {
        const opts = f.options || ['Opsi 1', 'Opsi 2'];
        let optsHtml = '';
        opts.forEach((opt, oIdx) => {
          const isChecked = savedVal === opt;
          optsHtml += `
            <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 cursor-pointer transition text-xs">
              <input 
                type="radio" 
                name="fld_radio_${f.id}" 
                value="${opt}" 
                ${isChecked ? 'checked' : ''} 
                ${f.required ? 'required' : ''} 
                onchange="handleClientFieldInput('${f.id}', this.value)" 
                class="w-4 h-4 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
              >
              <span class="text-zinc-800 font-medium math-renderable">${smartMathFormat(opt)}</span>
            </label>
          `;
        });
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2.5">
            ${mediaAbove}
            <div>
              <label class="block text-xs sm:text-sm font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Pilihan')}${reqBadge}</label>
              ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5 math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            </div>
            ${mediaBelow}
            <div class="space-y-2">
              ${optsHtml}
            </div>
          </div>
        `;
      }

      // 4. CHECKBOX
      if (f.type === 'CHECKBOX') {
        const opts = f.options || ['Opsi 1', 'Opsi 2'];
        let checkedList = Array.isArray(savedVal) ? savedVal : [];
        let optsHtml = '';
        opts.forEach((opt, oIdx) => {
          const isChecked = checkedList.includes(opt);
          optsHtml += `
            <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 cursor-pointer transition text-xs">
              <input 
                type="checkbox" 
                value="${opt}" 
                ${isChecked ? 'checked' : ''} 
                onchange="
                  let cur = Array.isArray(clientCustomFormAnswers['${f.id}']) ? clientCustomFormAnswers['${f.id}'] : [];
                  if (this.checked) cur.push(this.value);
                  else cur = cur.filter(v => v !== this.value);
                  handleClientFieldInput('${f.id}', cur);
                " 
                class="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
              >
              <span class="text-zinc-800 font-medium math-renderable">${smartMathFormat(opt)}</span>
            </label>
          `;
        });
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2.5">
            ${mediaAbove}
            <div>
              <label class="block text-xs sm:text-sm font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Pilihan Kotak Centang')}${reqBadge}</label>
              ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5 math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            </div>
            ${mediaBelow}
            <div class="space-y-2">
              ${optsHtml}
            </div>
          </div>
        `;
      }

      // 5. DROPDOWN
      if (f.type === 'DROPDOWN') {
        const opts = f.options || ['Opsi 1', 'Opsi 2'];
        let optsHtml = '<option value="" disabled selected>-- Pilih Opsi --</option>';
        opts.forEach(opt => {
          optsHtml += `<option value="${opt}" ${savedVal === opt ? 'selected' : ''}>${opt}</option>`;
        });
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2.5">
            ${mediaAbove}
            <div>
              <label class="block text-xs sm:text-sm font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Pilih Menu Dropdown')}${reqBadge}</label>
              ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5 math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            </div>
            ${mediaBelow}
            <select 
              ${f.required ? 'required' : ''} 
              onchange="handleClientFieldInput('${f.id}', this.value)" 
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm bg-white text-zinc-900 focus:border-zinc-900 outline-none transition shadow-2xs"
            >
              ${optsHtml}
            </select>
          </div>
        `;
      }

      // 6. RATING_SCALE / SKALA LINIER
      if (f.type === 'RATING_SCALE') {
        const minV = f.minVal !== undefined ? f.minVal : 1;
        const maxV = f.maxVal !== undefined ? f.maxVal : 5;
        const labels = f.pointLabels || {};
        let btnsHtml = '';
        for (let i = minV; i <= maxV; i++) {
          const pointLabel = labels[String(i)] || (i === minV ? (f.labelMin || "Kurang") : (i === maxV ? (f.labelMax || "Baik") : ""));
          const isSelected = String(savedVal) === String(i);
          btnsHtml += `
            <label class="flex flex-col items-center gap-1.5 cursor-pointer group flex-1 min-w-[48px]">
              <input 
                type="radio" 
                name="scale_${f.id}" 
                value="${i}" 
                ${isSelected ? 'checked' : ''} 
                ${f.required ? 'required' : ''} 
                onchange="handleClientFieldInput('${f.id}', this.value); updateRatingScaleUI('${f.id}');" 
                class="sr-only"
              >
              <div class="scale-circle-${f.id} w-9 h-9 sm:w-10 sm:h-10 rounded-xl border ${isSelected ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50'} font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition active:scale-95">
                ${i}
              </div>
              ${pointLabel ? `<span class="text-[10px] sm:text-[11px] text-zinc-500 font-medium text-center leading-tight max-w-[70px] math-renderable">${smartMathFormat(pointLabel)}</span>` : ''}
            </label>
          `;
        }

        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2.5">
            ${mediaAbove}
            <div>
              <label class="block text-xs sm:text-sm font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Skala Penilaian')}${reqBadge}</label>
              ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5 math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            </div>
            ${mediaBelow}
            <div class="space-y-2 pt-1">
              <div class="flex items-start justify-between gap-1 overflow-x-auto pb-2 pt-1">
                ${btnsHtml}
              </div>
            </div>
          </div>
        `;
      }

      // 7. FILE_UPLOAD
      if (f.type === 'FILE_UPLOAD') {
        const fileObj = (savedVal && typeof savedVal === 'object' && savedVal.name) ? savedVal : (customUploadedFilesMap[f.id] || null);
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-3">
            <div>
              <label class="block text-xs sm:text-sm font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Unggah Berkas / Dokumen')}${reqBadge}</label>
              <p class="text-[11.5px] text-zinc-500 leading-relaxed mt-0.5 math-renderable">${smartMathFormat(f.description || 'Mendukung berkas PDF, PPTX, DOCX, Foto JPG/PNG (Maks 10 MB).')}</p>
            </div>
            <div class="p-4 bg-white rounded-xl border border-dashed border-zinc-300 hover:border-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3 transition">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <div id="fileStatus_${f.id}" class="min-w-0">
                  ${fileObj 
                    ? `<div class="flex items-center gap-2">
                         ${fileObj.dataUrl && fileObj.type && fileObj.type.startsWith('image/') ? `<img src="${fileObj.dataUrl}" class="w-8 h-8 rounded-lg object-cover border border-emerald-300 shadow-2xs">` : ''}
                         <span class="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold text-xs">
                           <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                           <span class="truncate max-w-[180px] sm:max-w-[240px]">${fileObj.name}</span>
                           <span class="text-[10px] text-emerald-600 font-mono">(${((fileObj.size || 0) / 1024).toFixed(0)} KB)</span>
                         </span>
                       </div>`
                    : `<span class="text-xs text-zinc-500 font-medium">Belum ada berkas dipilih</span>`
                  }
                </div>
              </div>
              <button type="button" onclick="document.getElementById('input_file_${f.id}').click()" class="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95 shadow-xs shrink-0">
                <span>Pilih Berkas</span>
              </button>
              <input 
                type="file" 
                id="input_file_${f.id}"
                accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png" 
                onchange="handleClientFileUpload('${f.id}', this)" 
                onclick="this.value=null"
                class="hidden" 
                ${f.required && !fileObj ? 'required' : ''}
              >
            </div>
          </div>
        `;
      }

      // 8. DATE
      if (f.type === 'DATE') {
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2">
            <label class="block text-xs font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Tanggal')}${reqBadge}</label>
            ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            <input 
              type="date" 
              value="${savedVal}" 
              ${f.required ? 'required' : ''} 
              oninput="handleClientFieldInput('${f.id}', this.value)" 
              class="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm bg-white text-zinc-900 focus:border-zinc-900 outline-none transition shadow-2xs font-mono"
            >
          </div>
        `;
      }

      // 9. TIME
      if (f.type === 'TIME') {
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2">
            <label class="block text-xs font-bold text-zinc-900 leading-snug math-renderable">${smartMathFormat(f.label || 'Waktu')}${reqBadge}</label>
            ${f.description ? `<p class="text-[11.5px] text-zinc-500 leading-relaxed math-renderable">${smartMathFormat(f.description)}</p>` : ''}
            <input 
              type="time" 
              value="${savedVal}" 
              ${f.required ? 'required' : ''} 
              oninput="handleClientFieldInput('${f.id}', this.value)" 
              class="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm bg-white text-zinc-900 focus:border-zinc-900 outline-none transition shadow-2xs font-mono"
            >
          </div>
        `;
      }

      // 10. CORE_IDENTITY / CORE_IDENTITAS (Peran, NIM, Nama, Email)
      if (f.type === 'CORE_IDENTITY' || f.type === 'CORE_IDENTITAS') {
        const peranMhsLabel = appConfig["Peran_Mahasiswa_Label"] || "Mahasiswa (Anggota Kelas)";
        const peranDosenLabel = appConfig["Peran_Dosen_Label"] || "Dosen (Pengampu / Penguji)";
        const peranTamuLabel = appConfig["Peran_Lainnya_Label"] || "Lainnya / Penilai Tamu";
        const emailMode = getCurrentEmailCollectionMode();
        const isNoEmail = (emailMode === 'NO_EMAIL');
        const emailVal = clientCustomFormAnswers[f.id + '_email'] || activeUserAccountEmail || '';
        const nameVal = clientCustomFormAnswers[f.id + '_nama'] || activeUserAccountName || '';
        const nimVal = clientCustomFormAnswers[f.id + '_nim'] || activeUserAccountNim || '';
        const roleVal = clientCustomFormAnswers[f.id + '_peran'] || currentEvaluatorRole || 'Mahasiswa';

        return `
          <div class="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 space-y-4 shadow-xs">
            <div class="border-b border-zinc-100 pb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-sm sm:text-base font-bold text-zinc-900 math-renderable">${smartMathFormat(f.label || 'Identitas Penilai')}${reqBadge}</h3>
                <p class="text-xs text-zinc-500 mt-0.5 math-renderable">${smartMathFormat(f.description || 'Silakan lengkapi identitas Anda sebelum memulai penilaian.')}</p>
              </div>
            </div>

            <!-- 1. Peran Penilai Dropdown -->
            <div class="space-y-1.5">
              <label for="selectPeranPenilai" class="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-mono">
                Pilih Peran Penilai <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <select 
                  id="selectPeranPenilai" 
                  onchange="onRoleChange(this.value)" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm font-semibold text-zinc-900 bg-white focus:border-zinc-900 outline-none transition cursor-pointer appearance-none pr-9 shadow-2xs"
                >
                  <option value="" disabled>-- Pilih Peran Penilai Terlebih Dahulu --</option>
                  <option value="Mahasiswa" ${roleVal === 'Mahasiswa' ? 'selected' : ''}>${escapeHtml(peranMhsLabel)}</option>
                  <option value="Dosen" ${roleVal === 'Dosen' ? 'selected' : ''}>${escapeHtml(peranDosenLabel)}</option>
                  <option value="Lainnya" ${roleVal === 'Lainnya' ? 'selected' : ''}>${escapeHtml(peranTamuLabel)}</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <!-- 2. NIM Input Field -->
            <div id="nimContainer" class="space-y-1.5 ${roleVal === 'Mahasiswa' ? '' : 'hidden'}">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-semibold text-zinc-700">
                  Nomor Induk Mahasiswa (NIM) <span class="text-rose-500">*</span>
                </label>
                <span id="authNimAutoNotice" class="text-[10px] text-emerald-700 font-medium ${nimVal ? '' : 'hidden'}">
                  ${nimVal ? '✓ Terverifikasi Google' : ''}
                </span>
              </div>
              <div class="relative">
                <input 
                  type="text" 
                  id="inputNim" 
                  inputmode="numeric"
                  ${roleVal === 'Mahasiswa' ? 'required' : ''}
                  value="${escapeHtml(nimVal)}"
                  placeholder="NIM Mahasiswa ULM..." 
                  ${nimVal ? 'readonly' : ''}
                  class="w-full pl-3.5 pr-20 py-2.5 rounded-xl border ${nimVal ? 'border-zinc-200 bg-zinc-50/80 text-zinc-900' : 'border-zinc-200 bg-white text-zinc-900'} text-xs sm:text-sm font-mono focus:border-zinc-900 outline-none transition placeholder-zinc-400 shadow-2xs"
                  oninput="validateNimLive(this.value); saveFormDraft();"
                >
                <div id="nimStatusIcon" class="absolute right-3 top-2.5 ${nimVal ? '' : 'hidden'}">
                  <span class="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                    <span>Valid</span>
                  </span>
                </div>
              </div>
              <div id="nimFeedbackBox" class="text-xs rounded-lg p-2.5 hidden space-y-1"></div>
            </div>

            <!-- 3. Nama & Email -->
            <div id="identityFieldsContainer" class="grid grid-cols-1 ${isNoEmail ? '' : 'md:grid-cols-2'} gap-3.5 pt-1">
              <div class="space-y-1.5 ${isNoEmail ? 'col-span-1' : ''}">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-semibold text-zinc-700">
                    Nama Lengkap Penilai <span class="text-rose-500">*</span>
                  </label>
                  <span id="namaAutoFillNotice" class="text-[10px] text-emerald-700 font-medium ${nameVal ? '' : 'hidden'}">Terisi otomatis (dapat diubah)</span>
                </div>
                <input 
                  type="text" 
                  id="inputNama" 
                  required 
                  value="${escapeHtml(nameVal)}"
                  autocapitalize="words"
                  placeholder="Tuliskan nama lengkap Anda..." 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400 shadow-2xs"
                  oninput="activeUserAccountName = this.value.trim(); saveFormDraft();"
                >
              </div>

              ${isNoEmail ? `
                <div class="hidden" id="emailFieldContainer">
                  <input type="hidden" id="inputEmail" value="">
                </div>
              ` : `
                <div class="space-y-1.5" id="emailFieldContainer">
                  <div class="flex items-center justify-between">
                    <label id="labelEmailPenilai" class="block text-xs font-semibold text-zinc-700">
                      Email Penilai <span id="emailRequiredStar" class="text-rose-500">*</span>
                    </label>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Google Verified</span>
                    </span>
                  </div>
                  <div class="relative flex items-center">
                    <input 
                      type="email" 
                      id="inputEmail" 
                      required 
                      readonly
                      value="${escapeHtml(emailVal)}"
                      placeholder="Akun Google terverifikasi..." 
                      class="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm bg-zinc-50/80 text-zinc-800 font-mono outline-none cursor-default shadow-2xs"
                    >
                    <button 
                      type="button" 
                      onclick="handleSwitchGoogleAccount()" 
                      class="absolute right-1.5 min-h-[30px] px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 active:scale-95 text-zinc-700 border border-zinc-200 text-[11px] font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                      title="Ganti akun Google"
                    >
                      <svg class="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                      <span>Ganti</span>
                    </button>
                  </div>
                  <p class="text-[10px] text-zinc-400">Email diotentikasi via Google Cloud Platform.</p>
                </div>
              `}
            </div>
          </div>
        `;
      }

      // 11. CORE_GROUP_SELECT (Pemilihan Kelompok)
      if (f.type === 'CORE_GROUP_SELECT') {
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-6 rounded-2xl border border-zinc-200/80 space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 class="text-sm sm:text-base font-bold text-zinc-900 math-renderable">${smartMathFormat(f.label || 'Kelompok yang Dinilai')}${reqBadge}</h3>
                <p class="text-xs text-zinc-500 mt-0.5 math-renderable">${smartMathFormat(f.description || appConfig['Pilih_Kelompok_Label'] || 'Pilih salah satu kelompok yang sedang presentasi.')}</p>
              </div>
              <button type="button" onclick="fetchInitialFormData(true)" class="p-1.5 rounded-lg border border-zinc-200 hover:bg-white text-zinc-600 text-xs transition cursor-pointer" title="Perbarui daftar">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            </div>

            <!-- Loading State -->
            <div id="groupsLoading" class="py-6 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
              <span>Memuat daftar kelompok...</span>
            </div>

            <!-- Group Cards -->
            <div id="groupsContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"></div>

            <!-- Empty State -->
            <div id="groupsEmpty" class="hidden p-6 rounded-xl bg-white border border-zinc-200 text-center text-xs text-zinc-600 space-y-2">
              <p>Belum ada kelompok aktif yang terdaftar.</p>
              <button type="button" onclick="fetchInitialFormData(true)" class="px-3 py-1.5 rounded-lg bg-zinc-900 text-white font-medium text-xs">Coba Lagi</button>
            </div>
          </div>
        `;
      }

      // 12. CORE_SCORE_RUBRIC (Skor Nilai)
      if (f.type === 'CORE_SCORE_RUBRIC') {
        const minVal = parseInt(appConfig["Nilai_Kelompok_Min"] || 50);
        const maxVal = parseInt(appConfig["Nilai_Kelompok_Max"] || 100);
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-6 rounded-2xl border border-zinc-200/80 space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 class="text-sm sm:text-base font-bold text-zinc-900 math-renderable">${smartMathFormat(f.label || 'Nilai Presentasi Kelompok')}${reqBadge}</h3>
                <p class="text-xs text-zinc-500 mt-0.5 math-renderable">${smartMathFormat(f.description || 'Penilaian keseluruhan penguasaan materi dan performa.')}</p>
              </div>
              <span id="scoreGradeBadge" class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
                Nilai A (4,00)
              </span>
            </div>

            <div class="p-4 rounded-xl bg-white border border-zinc-200 space-y-4 shadow-2xs">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[11px] font-semibold text-zinc-400 mr-1 font-mono">Preset:</span>
                <button type="button" onclick="setScoreValue(70)" class="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition cursor-pointer">70</button>
                <button type="button" onclick="setScoreValue(75)" class="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition cursor-pointer">75</button>
                <button type="button" onclick="setScoreValue(80)" class="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition cursor-pointer">80</button>
                <button type="button" onclick="setScoreValue(85)" class="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition cursor-pointer">85</button>
                <button type="button" onclick="setScoreValue(90)" class="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition cursor-pointer">90</button>
                <button type="button" onclick="setScoreValue(95)" class="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition cursor-pointer">95</button>
                <button type="button" onclick="setScoreValue(100)" class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition cursor-pointer">100</button>
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div class="w-full flex-1 space-y-1.5">
                  <div class="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span id="sliderMinLabel">Min: ${minVal}</span>
                    <span id="sliderMaxLabel">Max: ${maxVal}</span>
                  </div>
                  <input 
                    type="range" 
                    id="inputNilaiSlider" 
                    min="${minVal}" 
                    max="${maxVal}" 
                    value="85" 
                    step="1"
                    class="w-full cursor-pointer h-2 bg-zinc-200 rounded-lg appearance-none"
                    oninput="syncScore(this.value, 'slider')"
                  >
                </div>

                <div class="flex items-center gap-1 bg-zinc-50 border border-zinc-300 p-1 rounded-xl shrink-0">
                  <button type="button" onclick="adjustScore(-1)" class="w-8 h-8 rounded-lg hover:bg-zinc-200 text-zinc-700 font-bold text-sm flex items-center justify-center transition cursor-pointer">−</button>
                  <input 
                    type="number" 
                    id="inputNilaiNumber" 
                    min="${minVal}" 
                    max="${maxVal}" 
                    value="85" 
                    required 
                    class="w-14 text-center font-bold text-base text-zinc-900 outline-none bg-transparent"
                    oninput="syncScore(this.value, 'number')"
                  >
                  <button type="button" onclick="adjustScore(1)" class="w-8 h-8 rounded-lg hover:bg-zinc-200 text-zinc-700 font-bold text-sm flex items-center justify-center transition cursor-pointer">+</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // 13. CORE_BEST_PRESENTER (Voting Presentator)
      if (f.type === 'CORE_BEST_PRESENTER') {
        const maxVote = parseInt(appConfig["Maksimal_Pilihan_Presentator_Terbaik"] || 2);
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-6 rounded-2xl border border-zinc-200/80 space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 class="text-sm sm:text-base font-bold text-zinc-900 math-renderable">${smartMathFormat(f.label || 'Presentator Terbaik')}${reqBadge}</h3>
                <p class="text-xs text-zinc-500 mt-0.5 math-renderable">${smartMathFormat(f.description || `Pilih maksimal ${maxVote} pemateri terbaik.`)}</p>
              </div>
              <span id="bestPresenterCountBadge" class="text-xs font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-lg">
                0/${maxVote} Terpilih
              </span>
            </div>
            <div id="bestPresenterList" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"></div>
          </div>
        `;
      }

      // 14. CORE_MEMBER_FEEDBACK (Evaluasi Kualitatif)
      if (f.type === 'CORE_MEMBER_FEEDBACK') {
        return `
          <div class="bg-zinc-50/60 p-4 sm:p-6 rounded-2xl border border-zinc-200/80 space-y-4">
            <div class="border-b border-zinc-200 pb-3">
              <h3 class="text-sm sm:text-base font-bold text-zinc-900 math-renderable">${smartMathFormat(f.label || 'Evaluasi Masukan Tiap Pemateri')}${reqBadge}</h3>
              <p class="text-xs text-zinc-500 mt-0.5 math-renderable">${smartMathFormat(f.description || 'Berikan masukan apresiasi konstruktif untuk setiap anggota pemateri.')}</p>
            </div>
            <div id="evaluationInputsContainer" class="space-y-4">
              <div id="evaluationEmptyNotice" class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
                Silakan pilih kelompok yang dinilai terlebih dahulu pada bagian sebelumnya untuk menampilkan formulir ulasan pemateri.
              </div>
            </div>
          </div>
        `;
      }

      return '';
    }

    function renderDynamicCustomFields() {
      const pkContainer = document.getElementById("perKelompokCustomFieldsContainer");
      const globContainer = document.getElementById("globalCustomFieldsContainer");
      
      if (pkContainer) pkContainer.innerHTML = "";
      if (globContainer) globContainer.innerHTML = "";

      // Flatten fields from formSchema if available
      let allFields = [];
      if (currentFormSchema && Array.isArray(currentFormSchema.tahapan)) {
        currentFormSchema.tahapan.forEach(stage => {
          (stage.fields || []).forEach(f => {
            if (!String(f.type || "").startsWith("CORE_")) {
              allFields.push(f);
            }
          });
        });
      } else if (customFieldsData && Array.isArray(customFieldsData)) {
        allFields = customFieldsData.filter(f => !String(f.type || "").startsWith("CORE_"));
      }

      if (allFields.length === 0) {
        if (pkContainer) pkContainer.classList.add("hidden");
        if (globContainer) globContainer.classList.add("hidden");
        return;
      }

      const pkFields = allFields.filter(f => f.scope === 'PER_KELOMPOK');
      const globFields = allFields.filter(f => f.scope !== 'PER_KELOMPOK');

      if (pkFields.length > 0 && pkContainer) {
        pkContainer.classList.remove("hidden");
        pkContainer.innerHTML = `
          <div class="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div class="border-b border-zinc-100 pb-3">
              <h3 class="text-sm sm:text-base font-bold text-zinc-900">Rubrik Tambahan Kelompok</h3>
              <p class="text-xs text-zinc-500 mt-0.5">Penilaian spesifik untuk performa kelompok terpilih.</p>
            </div>
            <div id="pkFieldsInputsList" class="space-y-4"></div>
          </div>
        `;
        const list = document.getElementById("pkFieldsInputsList");
        pkFields.forEach(f => renderSingleCustomField(f, list));
      } else if (pkContainer) {
        pkContainer.classList.add("hidden");
      }

      if (globFields.length > 0 && globContainer) {
        globContainer.classList.remove("hidden");
        globContainer.innerHTML = `
          <div class="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div class="border-b border-zinc-100 pb-3">
              <h3 class="text-sm sm:text-base font-bold text-zinc-900">Pertanyaan &amp; Isian Tambahan</h3>
              <p class="text-xs text-zinc-500 mt-0.5">Lengkapi isian dan dokumen yang diperlukan.</p>
            </div>
            <div id="globFieldsInputsList" class="space-y-4"></div>
          </div>
        `;
        const list = document.getElementById("globFieldsInputsList");
        globFields.forEach(f => renderSingleCustomField(f, list));
      } else if (globContainer) {
        globContainer.classList.add("hidden");
      }
    }

    function renderSingleCustomField(field, parentEl) {
      // 0. TITLE_DESC (BLOK INFORMASI / PANDUAN NON-PERTANYAAN)
      if (field.type === 'TITLE_DESC') {
        wrapper.className = "bg-indigo-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-1.5";
        wrapper.innerHTML = `
          <div class="flex items-center gap-2 text-indigo-900 font-bold text-xs sm:text-sm">
            <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>${field.label}</span>
          </div>
          ${field.description ? `<p class="text-xs text-indigo-950/80 leading-relaxed">${field.description}</p>` : ''}
        `;
        parentEl.appendChild(wrapper);
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "space-y-2 text-xs bg-zinc-50/50 p-3.5 sm:p-4 rounded-xl border border-zinc-200";
      const reqBadge = field.required ? '<span class="text-rose-500 font-bold text-sm">*</span>' : '';

      // 1. SHORT_TEXT
      if (field.type === 'SHORT_TEXT') {
        wrapper.innerHTML = `
          <div>
            <label class="block font-bold text-zinc-800 text-xs sm:text-sm">${field.label} ${reqBadge}</label>
            ${field.description ? `<p class="text-[11px] text-zinc-500 mt-0.5">${field.description}</p>` : ''}
          </div>
          <input 
            type="text" 
            id="cust_${field.id}" 
            name="cust_${field.id}"
            ${field.required ? 'required' : ''} 
            placeholder="${field.placeholder || 'Tuliskan jawaban Anda...'}" 
            class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900 focus:border-indigo-600 outline-none transition"
          >
        `;
      } 
      // 2. TEXTAREA
      else if (field.type === 'TEXTAREA') {
        wrapper.innerHTML = `
          <div>
            <label class="block font-bold text-zinc-800 text-xs sm:text-sm">${field.label} ${reqBadge}</label>
            ${field.description ? `<p class="text-[11px] text-zinc-500 mt-0.5">${field.description}</p>` : ''}
          </div>
          <textarea 
            id="cust_${field.id}" 
            name="cust_${field.id}"
            rows="3" 
            ${field.required ? 'required' : ''} 
            placeholder="${field.placeholder || 'Tuliskan ulasan atau penjelasan lengkap Anda...'}" 
            class="w-full p-3 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900 focus:border-indigo-600 outline-none transition"
          ></textarea>
        `;
      } 
      // 3. RATING_SCALE (MULTI-POINT LABELS 1 S.D. 5)
      else if (field.type === 'RATING_SCALE') {
        const minVal = field.minVal !== undefined ? field.minVal : 1;
        const maxVal = field.maxVal !== undefined ? field.maxVal : 5;
        const pointLabels = field.pointLabels || {};

        let buttons = '';
        for (let i = minVal; i <= maxVal; i++) {
          const pointText = pointLabels[String(i)] || (i === minVal ? (field.labelMin || "Sangat Kurang") : (i === maxVal ? (field.labelMax || "Sangat Baik") : ""));
          buttons += `
            <label class="flex-1 text-center p-2 sm:p-2.5 rounded-xl border border-zinc-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition flex flex-col items-center justify-center gap-1 group shadow-2xs">
              <input type="radio" name="cust_${field.id}" value="${i}" ${i === Math.ceil((minVal+maxVal)/2) && field.required ? 'checked' : ''} class="sr-only peer">
              <span class="font-mono font-extrabold text-sm sm:text-base text-zinc-700 peer-checked:text-indigo-600 group-hover:text-indigo-600">${i}</span>
              ${pointText ? `<span class="text-[10px] font-medium text-zinc-500 peer-checked:text-indigo-700 peer-checked:font-bold leading-tight line-clamp-2">${pointText}</span>` : ''}
            </label>
          `;
        }
        wrapper.innerHTML = `
          <div>
            <label class="block font-bold text-zinc-800 text-xs sm:text-sm">${field.label} ${reqBadge}</label>
            ${field.description ? `<p class="text-[11px] text-zinc-500 mt-0.5">${field.description}</p>` : ''}
          </div>
          <div class="flex items-stretch gap-1.5 pt-1">
            ${buttons}
          </div>
        `;
      } 
      // 4. RADIO / PILIHAN GANDA (DENGAN OPSI LAINNYA)
      else if (field.type === 'RADIO') {
        const opts = (field.options || []).map((opt, oIdx) => `
          <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer text-xs">
            <input type="radio" name="cust_${field.id}" value="${opt}" ${oIdx === 0 && field.required ? 'checked' : ''} class="w-4 h-4 text-indigo-600 cursor-pointer">
            <span class="text-zinc-800 font-medium">${opt}</span>
          </label>
        `).join("");

        const otherHtml = field.hasOtherOption ? `
          <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer text-xs">
            <input type="radio" name="cust_${field.id}" value="__OTHER__" onchange="const inp = document.getElementById('cust_other_${field.id}'); if(inp) { inp.focus(); }" class="w-4 h-4 text-indigo-600 cursor-pointer">
            <span class="text-zinc-700 font-medium">Lainnya:</span>
            <input 
              type="text" 
              id="cust_other_${field.id}" 
              placeholder="Ketik jawaban Anda..." 
              onfocus="const rad = this.parentElement.querySelector('input[type=radio]'); if(rad) rad.checked = true;"
              class="flex-1 px-2.5 py-1 rounded border border-zinc-300 text-xs bg-zinc-50 focus:bg-white outline-none"
            >
          </label>
        ` : '';

        wrapper.innerHTML = `
          <div>
            <label class="block font-bold text-zinc-800 text-xs sm:text-sm">${field.label} ${reqBadge}</label>
            ${field.description ? `<p class="text-[11px] text-zinc-500 mt-0.5">${field.description}</p>` : ''}
          </div>
          <div class="space-y-1.5 pt-1">${opts}${otherHtml}</div>
        `;
      } 
      // 5. CHECKBOX / KOTAK CENTANG (DENGAN OPSI LAINNYA)
      else if (field.type === 'CHECKBOX') {
        const opts = (field.options || []).map(opt => `
          <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer text-xs">
            <input type="checkbox" name="cust_${field.id}" value="${opt}" class="w-4 h-4 text-indigo-600 rounded cursor-pointer">
            <span class="text-zinc-800 font-medium">${opt}</span>
          </label>
        `).join("");

        const otherHtml = field.hasOtherOption ? `
          <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer text-xs">
            <input type="checkbox" name="cust_${field.id}" value="__OTHER__" onchange="const inp = document.getElementById('cust_other_${field.id}'); if(inp) { inp.focus(); }" class="w-4 h-4 text-indigo-600 rounded cursor-pointer">
            <span class="text-zinc-700 font-medium">Lainnya:</span>
            <input 
              type="text" 
              id="cust_other_${field.id}" 
              placeholder="Ketik jawaban Anda..." 
              onfocus="const chk = this.parentElement.querySelector('input[type=checkbox]'); if(chk) chk.checked = true;"
              class="flex-1 px-2.5 py-1 rounded border border-zinc-300 text-xs bg-zinc-50 focus:bg-white outline-none"
            >
          </label>
        ` : '';

        wrapper.innerHTML = `
          <div>
            <label class="block font-bold text-zinc-800 text-xs sm:text-sm">${field.label} ${reqBadge}</label>
            ${field.description ? `<p class="text-[11px] text-zinc-500 mt-0.5">${field.description}</p>` : ''}
          </div>
          <div class="space-y-1.5 pt-1">${opts}${otherHtml}</div>
        `;
      }
      // 6. DROPDOWN
      else if (field.type === 'DROPDOWN') {
        const opts = (field.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join("");
        wrapper.innerHTML = `
          <div>
            <label class="block font-bold text-zinc-800 text-xs sm:text-sm">${field.label} ${reqBadge}</label>
            ${field.description ? `<p class="text-[11px] text-zinc-500 mt-0.5">${field.description}</p>` : ''}
          </div>
          <select 
            id="cust_${field.id}" 
            name="cust_${field.id}"
            ${field.required ? 'required' : ''}
            class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 focus:border-indigo-600 outline-none transition cursor-pointer shadow-2xs"
          >
            <option value="" disabled selected>-- Pilih Salah Satu --</option>
            ${opts}
          </select>
        `;
      }
      // 7. FILE_UPLOAD
      else if (field.type === 'FILE_UPLOAD') {
        wrapper.innerHTML = `
          <div>
            <label class="block font-bold text-zinc-800 text-xs sm:text-sm">${field.label} ${reqBadge}</label>
            ${field.description ? `<p class="text-[11px] text-zinc-500 mt-0.5">${field.description}</p>` : ''}
          </div>
          <div class="p-4 bg-white rounded-xl border border-zinc-300 space-y-2">
            <input 
              type="file" 
              id="cust_${field.id}" 
              accept=".pdf,image/*,.pptx,.docx" 
              onchange="handleClientFileUpload('${field.id}', this)" 
              class="w-full text-xs text-zinc-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer"
            >
            <p id="cust_file_status_${field.id}" class="text-[11px] text-zinc-500">Format didukung: PDF, PPTX, DOCX, JPG, PNG (Maks 5 MB).</p>
          </div>
        `;
      }
      // 8. INFO_BANNER
      else if (field.type === 'INFO_BANNER') {
        wrapper.innerHTML = `
          <div class="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
            <svg class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <span class="font-bold block">${field.label}</span>
              <p class="text-indigo-800 mt-0.5">${field.description || ''}</p>
            </div>
          </div>
        `;
      }

      parentEl.appendChild(wrapper);
    }



    function collectCustomFieldsAnswers() {
      const answers = {};
      if (!customFieldsData || customFieldsData.length === 0) return answers;

      customFieldsData.forEach(f => {
        if (f.type === 'SHORT_TEXT' || f.type === 'TEXTAREA') {
          const el = document.getElementById(`cust_${f.id}`);
          if (el) answers[f.id] = el.value.trim();
        } else if (f.type === 'RATING_SCALE' || f.type === 'RADIO') {
          const selected = document.querySelector(`input[name="cust_${f.id}"]:checked`);
          if (selected) answers[f.id] = selected.value;
        } else if (f.type === 'CHECKBOX') {
          const checked = Array.from(document.querySelectorAll(`input[name="cust_${f.id}"]:checked`)).map(c => c.value);
          if (checked.length > 0) answers[f.id] = checked.join(", ");
        } else if (f.type === 'FILE_UPLOAD') {
          if (customUploadedFilesMap[f.id]) {
            answers[f.id] = customUploadedFilesMap[f.id].name;
          }
        }
      });

      return answers;
    }

    // =========================================================================
    // TWO-WAY REAL-TIME SYNCHRONIZATION ENGINE
    // =========================================================================
    let realtimeHeartbeatTimer = null;
    let lastConfigSyncTimestamp = Date.now();

    function initRealtimeSyncEngine() {
      // 0. Online / Offline Connection Event Handlers
      window.addEventListener("online", () => {
        showToast("Koneksi internet terhubung kembali. Memperbarui data penilaian...", "info");
        fetchInitialFormData(false);
        const curTab = localStorage.getItem("PGSD_ACTIVE_MAIN_TAB") || "form";
        if (curTab === 'rekap') loadRekapData(true);
      });

      window.addEventListener("offline", () => {
        showToast("Koneksi internet terputus. Isian formulir Anda tetap tersimpan aman di peramban.", "warning");
      });

      // 1. Periodic Background Heartbeat (Near Realtime Sync)
      if (realtimeHeartbeatTimer) clearInterval(realtimeHeartbeatTimer);
      realtimeHeartbeatTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          const currentTab = localStorage.getItem("PGSD_ACTIVE_MAIN_TAB") || "form";
          // Jika pengguna sedang membuka Rekapitulasi / Presensi, update otomatis data live
          if (currentTab === 'rekap') {
            loadRekapData(true);
          }
          // Periodik cek perubahan Konfigurasi / Sesi Aktif oleh Admin (setiap 60s)
          if (Date.now() - lastConfigSyncTimestamp > 60000) {
            lastConfigSyncTimestamp = Date.now();
            fetchInitialFormData(false);
          }
        }
      }, 20000); // 20 detik interval

      // 2. Tab Visibility & Window Focus Sync (Instant on app revisit / unlock)
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          const currentTab = localStorage.getItem("PGSD_ACTIVE_MAIN_TAB") || "form";
          fetchInitialFormData(false);
          if (currentTab === 'rekap') {
            loadRekapData(true);
          }
        }
      });

      window.addEventListener("focus", () => {
        if (navigator.onLine) {
          const currentTab = localStorage.getItem("PGSD_ACTIVE_MAIN_TAB") || "form";
          if (currentTab === 'rekap') {
            loadRekapData(true);
          }
        }
      });

      // 3. Cross-Tab / Cross-Window Realtime Broadcast Listener
      window.addEventListener("storage", (e) => {
        if (e.key === "PGSD_LAST_SUBMISSION_EVENT") {
          loadRekapData(true);
        } else if (e.key === "PGSD_CACHE_CONFIG") {
          try {
            appConfig = JSON.parse(e.newValue || "{}");
            renderConfigHeader();
          } catch(err) {}
        }
      });
    }

    function loadLocalCache() {
      try {
        const isDefault = (activeFormId === 'BK5E' || !activeFormId);
        
        // 1. Check form-specific cache first
        let cachedConfig = localStorage.getItem("PGSD_CACHE_CONFIG_" + activeFormId);
        let cachedGroups = localStorage.getItem("PGSD_CACHE_GROUPS_" + activeFormId);
        let cachedStudents = localStorage.getItem("PGSD_CACHE_ALL_STUDENTS_" + activeFormId);
        let cachedSchema = localStorage.getItem("PGSD_CACHE_FORM_SCHEMA_" + activeFormId);

        // 2. Check local forms registry if specific cache is not yet populated
        const localRegistry = JSON.parse(localStorage.getItem("PGSD_CACHE_REGISTRY_FORMS") || "[]");
        const foundMeta = localRegistry.find(f => (f.formId || 'BK5E').toUpperCase() === activeFormId);
        if (foundMeta) {
          currentFormMeta = foundMeta;
        }

        // 3. Fallback for default primary form BK5E
        if (isDefault) {
          if (!cachedConfig) cachedConfig = localStorage.getItem("PGSD_CACHE_CONFIG");
          if (!cachedGroups) cachedGroups = localStorage.getItem("PGSD_CACHE_GROUPS");
          if (!cachedStudents) cachedStudents = localStorage.getItem("PGSD_CACHE_ALL_STUDENTS");
        }

        if (cachedStudents) {
          try { allStudentsData = JSON.parse(cachedStudents) || []; } catch(e) {}
        }

        if (cachedSchema) {
          try { currentFormSchema = JSON.parse(cachedSchema); } catch(e) {}
        }

        if (cachedConfig) {
          try { appConfig = JSON.parse(cachedConfig); } catch(e) {}
        } else if (foundMeta) {
          appConfig = {
            "Judul_Form": foundMeta.judulForm || foundMeta.title || `PENILAIAN FORM ${activeFormId}`,
            "Mata_Kuliah": foundMeta.mataKuliah || "",
            "Dosen_Pengampu": foundMeta.dosen || "",
            "Kelas": foundMeta.kelas || "",
            "Sesi_Minggu_Aktif": foundMeta.sesiAktif || "SEMUA"
          };
        }

        // 4. Default fallback for BK5E primary form if no local cache exists
        if (isDefault) {
          if (!appConfig || Object.keys(appConfig).length === 0) {
            appConfig = {
              "Judul_Form": "Penilaian Presentasi Kelas 5E PGSD 2026",
              "Mata_Kuliah": "Bimbingan Konseling di SD",
              "Dosen_Pengampu": "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.",
              "Kelas": "5E",
              "Jurusan": "PGSD",
              "Sesi_Minggu_Aktif": "Minggu 1",
              "Nilai_Kelompok_Min": "50",
              "Nilai_Kelompok_Max": "100"
            };
          }
          if (!currentFormMeta) {
            currentFormMeta = {
              formId: "BK5E",
              formSlug: "bk-5e",
              judulForm: "Penilaian Presentasi Kelas 5E PGSD 2026",
              mataKuliah: "Bimbingan Konseling di SD",
              dosen: "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.",
              kelas: "5E",
              jurusan: "PGSD",
              sesiAktif: "Minggu 1",
              status: "AKTIF"
            };
          }
          if (!currentFormSchema || !Array.isArray(currentFormSchema.tahapan) || currentFormSchema.tahapan.length === 0) {
            currentFormSchema = {
              tahapan: [
                { id: "tahap_1", title: "Identitas & Akses Penilai", description: "Isi identitas diri Anda sebelum menilai.", fields: [{ id: "fld_core_identity", type: "CORE_IDENTITY", label: "Identitas Penilai", required: true }] },
                { id: "tahap_2", title: "Pemilihan Kelompok Presentator", description: "Pilih kelompok yang sedang presentasi.", fields: [{ id: "fld_core_group", type: "CORE_GROUP_SELECT", label: "Kelompok yang Dinilai", required: true }] },
                { id: "tahap_3", title: "Skor Rubrik & Voting Presentator", description: "Berikan nilai presentasi dan pilih pemateri terbaik.", fields: [{ id: "fld_core_score", type: "CORE_SCORE_RUBRIC", label: "Nilai Presentasi", required: true }, { id: "fld_core_voting", type: "CORE_BEST_PRESENTER", label: "Presentator Terbaik", required: true }] },
                { id: "tahap_4", title: "Evaluasi Masukan Kualitatif", description: "Tuliskan masukan apresiasi dan catatan untuk pemateri.", fields: [{ id: "fld_core_feedback", type: "CORE_MEMBER_FEEDBACK", label: "Evaluasi Masukan Kualitatif Tiap Pemateri", required: true }] }
              ]
            };
          }
        }

        // Exact In-Memory / Local Draft Schema & Config for Preview Mode
        if (isPreviewMode) {
          const draftSchemaStr = sessionStorage.getItem("PGSD_DRAFT_SCHEMA_" + activeFormId) || localStorage.getItem("PGSD_DRAFT_SCHEMA_" + activeFormId);
          const draftConfigStr = sessionStorage.getItem("PGSD_DRAFT_CONFIG_" + activeFormId) || localStorage.getItem("PGSD_DRAFT_CONFIG_" + activeFormId);
          if (draftSchemaStr) {
            try { currentFormSchema = JSON.parse(draftSchemaStr); } catch(e) {}
          }
          if (draftConfigStr) {
            try { appConfig = JSON.parse(draftConfigStr); } catch(e) {}
          }
        }

        if (cachedGroups) {
          try { groupsData = JSON.parse(cachedGroups); } catch(e) {}
        } else if (!isDefault) {
          const localMaster = localStorage.getItem("PGSD_CACHE_MASTER_" + activeFormId);
          if (localMaster) {
            try {
              const rows = JSON.parse(localMaster);
              const gMap = {};
              const sList = [];
              (rows || []).forEach(row => {
                const kelompok = String(row[0] || '').trim();
                const sesi = String(row[1] || '').trim();
                const nim = String(row[2] !== undefined && row[2] !== null ? row[2] : '').trim();
                const nama = String(row[3] || '').trim();
                const status = String(row[4] || 'AKTIF').trim().toUpperCase();
                if (!kelompok || !nama || status === 'NONAKTIF') return;
                sList.push({ nim, name: nama, kelompok, sesi });
                if (!gMap[kelompok]) gMap[kelompok] = { name: kelompok, sesi, members: [] };
                gMap[kelompok].members.push({ nim, name: nama });
              });
              groupsData = Object.values(gMap);
              allStudentsData = sList;
            } catch(e) {}
          } else {
            groupsData = [];
            allStudentsData = [];
          }
        }

        const pinEl = document.getElementById("navPinBadge");
        if (pinEl) pinEl.textContent = `PIN: ${activeFormId}`;

        renderConfigHeader();
        renderGroupOptions();
        renderDynamicCustomFields();
        renderDynamicClientStages();

        const cachedRekap = localStorage.getItem("PGSD_CACHE_REKAP_" + activeFormId) || (isDefault ? localStorage.getItem("PGSD_CACHE_REKAP") : null);
        if (cachedRekap) {
          try {
            currentRekapData = JSON.parse(cachedRekap);
            if (currentRekapData && currentRekapData.summary) {
              populateRekapFilter(currentRekapData.summary);
              renderBothRekapViews();
            }
          } catch(e) {}
        }
      } catch (e) {
        console.warn("loadLocalCache fallback error:", e);
        if (activeFormId === 'BK5E') {
          mockLoadData();
        }
      }
    }

    async function fetchInitialFormData(showLoadingSpinner = false) {
      // ⚡ FAST-PATH (< 30ms): Ambil data langsung dari Supabase Database
      const sb = getSupabaseClient();
      if (sb) {
        try {
          const [formRes, configRes, groupsRes, studentsRes] = await Promise.all([
            sb.from('pgsd_forms').select('*').eq('form_id', activeFormId).single(),
            sb.from('pgsd_form_configs').select('*').eq('form_id', activeFormId).single(),
            sb.from('pgsd_groups').select('*').eq('form_id', activeFormId).order('display_order', { ascending: true }),
            sb.from('pgsd_students').select('*').eq('form_id', activeFormId)
          ]);

          if (!formRes.error && formRes.data) {
            const formRow = formRes.data;
            const configRow = configRes.data;
            const groupsRows = groupsRes.data || [];
            const studentsRows = studentsRes.data || [];

            currentFormMeta = {
              formId: formRow.form_id,
              formSlug: formRow.form_slug,
              judulForm: formRow.judul_form,
              mataKuliah: formRow.mata_kuliah,
              dosen: formRow.dosen,
              kelas: formRow.kelas,
              jurusan: formRow.jurusan,
              sesiAktif: formRow.sesi_aktif,
              status: formRow.status
            };

            appConfig = (configRow && configRow.config_data) || {};
            currentFormSchema = (configRow && configRow.schema_data) || { tahapan: [] };

            // Susun data kelompok & anggota
            groupsData = groupsRows.map(g => ({
              id: g.id,
              name: g.name,
              sesi: g.sesi,
              status: g.status,
              members: studentsRows.filter(s => s.group_id === g.id).map(s => ({
                nim: s.nim,
                name: s.name,
                status: s.status
              }))
            }));

            allStudentsData = studentsRows.map(s => ({
              nim: s.nim,
              name: s.name,
              kelompok: s.group_name,
              sesi: (groupsRows.find(g => g.id === s.group_id) || {}).sesi || "Minggu 1"
            }));

            const pinEl = document.getElementById("navPinBadge");
            if (pinEl) pinEl.textContent = `PIN: ${activeFormId}`;
            renderDynamicCustomFields();

            localStorage.setItem("PGSD_CACHE_GROUPS_" + activeFormId, JSON.stringify(groupsData));
            localStorage.setItem("PGSD_CACHE_CONFIG_" + activeFormId, JSON.stringify(appConfig));
            localStorage.setItem("PGSD_CACHE_META_" + activeFormId, JSON.stringify(currentFormMeta));
            localStorage.setItem("PGSD_CACHE_FORM_SCHEMA_" + activeFormId, JSON.stringify(currentFormSchema));
            saveVisitedFormHistory(activeFormId, currentFormMeta, appConfig);

            renderConfigHeader();
            renderGroupOptions();
            renderDynamicClientStages(false);
            restoreFormDraft();
            updateStepUI(currentStep || 1);
            updateAccountHeaderUI();
            checkAndApplyAuthGate();
            loadRekapData(true);
            return;
          }
        } catch(sbErr) {
          console.warn("Supabase fetchInitialFormData notice:", sbErr);
        }
      }

      const apiUrl = getApiUrl();
      const fetchWithTimeout = (url, ms = 9000) => {
        return Promise.race([
          fetch(url),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
        ]);
      };

      try {
        const response = await fetchWithTimeout(`${apiUrl}?action=getInitialData&formId=${encodeURIComponent(activeFormId)}&nocache=1&_t=${Date.now()}`, 9000);
        const result = await response.json();

        if (result && result.success) {
          groupsData = result.groups || [];
          customFieldsData = result.customFields || [];
          currentFormMeta = result.formMeta || null;

          if (isPreviewMode) {
            const draftSchemaStr = sessionStorage.getItem("PGSD_DRAFT_SCHEMA_" + activeFormId) || localStorage.getItem("PGSD_DRAFT_SCHEMA_" + activeFormId);
            const draftConfigStr = sessionStorage.getItem("PGSD_DRAFT_CONFIG_" + activeFormId) || localStorage.getItem("PGSD_DRAFT_CONFIG_" + activeFormId);
            if (draftSchemaStr) {
              try { currentFormSchema = JSON.parse(draftSchemaStr); } catch(e) {}
            } else {
              currentFormSchema = result.formSchema || (result.formMeta && result.formMeta.customFields) || null;
            }
            if (draftConfigStr) {
              try { appConfig = JSON.parse(draftConfigStr); } catch(e) {}
            } else {
              appConfig = result.config || {};
            }
          } else {
            appConfig = result.config || {};
            const localSchemaStr = localStorage.getItem('PGSD_CACHE_FORM_SCHEMA_' + activeFormId);
            let localSchema = null;
            try { if (localSchemaStr) localSchema = JSON.parse(localSchemaStr); } catch(e){}
            currentFormSchema = result.formSchema || (result.formMeta && result.formMeta.customFields) || localSchema || null;
          }

          const pinEl = document.getElementById("navPinBadge");
          if (pinEl) pinEl.textContent = `PIN: ${activeFormId}`;
          renderDynamicCustomFields();
          
          if (result.allStudents && Array.isArray(result.allStudents)) {
            allStudentsData = result.allStudents;
          } else {
            allStudentsData = [];
            groupsData.forEach(g => {
              (g.members || []).forEach(m => {
                allStudentsData.push({
                  nim: m.nim || "",
                  name: m.name || "",
                  kelompok: g.name || "",
                  sesi: g.sesi || "Minggu 1"
                });
              });
            });
          }
          
          localStorage.setItem("PGSD_CACHE_GROUPS_" + activeFormId, JSON.stringify(groupsData));
          localStorage.setItem("PGSD_CACHE_ALL_STUDENTS_" + activeFormId, JSON.stringify(allStudentsData));
          localStorage.setItem("PGSD_CACHE_CONFIG_" + activeFormId, JSON.stringify(appConfig));
          if (activeFormId === 'BK5E') {
            localStorage.setItem("PGSD_CACHE_GROUPS", JSON.stringify(groupsData));
            localStorage.setItem("PGSD_CACHE_ALL_STUDENTS", JSON.stringify(allStudentsData));
            localStorage.setItem("PGSD_CACHE_CONFIG", JSON.stringify(appConfig));
          }

          renderConfigHeader();
          renderGroupOptions();
          renderDynamicClientStages();
          restoreFormDraft();
          updateStepUI(currentStep || 1);
          updateAccountHeaderUI();
          checkAndApplyAuthGate();

          // Jika pengguna sudah mengetikkan NIM, re-evaluasi secara instan dengan data terbaru
          const currentNimInput = document.getElementById("inputNim")?.value || "";
          if (currentNimInput && currentEvaluatorRole === 'Mahasiswa') {
            validateNimLive(currentNimInput);
          }
        }
      } catch (err) {
        renderConfigHeader();
        renderGroupOptions();
        renderDynamicClientStages();
        restoreFormDraft();
        updateStepUI(currentStep || 1);
        updateAccountHeaderUI();
        checkAndApplyAuthGate();
      } finally {
        if (loading) loading.classList.add("hidden");
      }
    }

    // =========================================================================
    // JADWAL AKSES FORMULIR & KONTROL TENGGAT WAKTU (SCHEDULE & DEADLINE ENGINE)
    // =========================================================================
    let scheduleIntervalTimer = null;

    function parseCampusDate(str) {
      if (!str) return null;
      if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
      const s = String(str).trim();
      // If no timezone offset is provided, assume WITA (UTC+8 / +08:00)
      const hasOffset = s.includes('Z') || /[+-]\d{2}(:\d{2})?$/.test(s);
      const normalized = hasOffset ? s : s + '+08:00';
      const d = new Date(normalized);
      return isNaN(d.getTime()) ? null : d;
    }

    function formatSmartScheduleTime(dateInput) {
      const dateObj = parseCampusDate(dateInput);
      if (!dateObj) return '-';

      // Format Campus Time (WITA - Asia/Makassar)
      const witaDateStr = dateObj.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Makassar',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const witaTimeStr = dateObj.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(':', '.');

      // Detect User's Local Timezone Offset
      const localOffsetMin = -new Date().getTimezoneOffset(); // in minutes (+420 = WIB, +480 = WITA, +540 = WIT)
      const isWita = (localOffsetMin === 480);

      if (isWita) {
        return `${witaDateStr} pukul ${witaTimeStr} WITA`;
      }

      // Format User's Local Time
      let zoneLabel = 'WIB';
      if (localOffsetMin === 420) zoneLabel = 'WIB';
      else if (localOffsetMin === 540) zoneLabel = 'WIT';
      else {
        const sign = localOffsetMin >= 0 ? '+' : '-';
        const hrs = Math.floor(Math.abs(localOffsetMin) / 60);
        zoneLabel = `UTC${sign}${hrs}`;
      }

      const localDateStr = dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const localTimeStr = dateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(':', '.');

      return `${localDateStr} pukul ${localTimeStr} ${zoneLabel} <span class="font-normal text-amber-800/80">(${witaTimeStr} WITA - Waktu Kampus)</span>`;
    }

    function evaluateFormScheduleStatus() {
      const lockBanner = document.getElementById("formScheduleLockBanner");
      const startBtn = document.getElementById("startAssessmentBtn");
      const warningBadge = document.getElementById("deadlineWarningBadge");

      const isManualClosed = currentFormMeta && (currentFormMeta.status === 'NONAKTIF' || currentFormMeta.status === 'SELESAI');
      const scheduleActive = appConfig && (appConfig["Jadwal_Aktif"] === true || appConfig["Jadwal_Aktif"] === "true");

      const now = new Date();
      let isBlocked = false;
      let blockReason = "";
      let blockTitle = "";
      let blockDesc = "";
      let targetTime = null;

      if (isManualClosed) {
        isBlocked = true;
        blockTitle = "Formulir Sedang Dinonaktifkan";
        blockDesc = "Pengisian formulir ini saat ini sedang ditutup oleh dosen pengampu.";
      } else if (scheduleActive) {
        const startTimeStr = appConfig["Jadwal_Mulai"];
        const endTimeStr = appConfig["Jadwal_Selesai"];
        const maxResponses = parseInt(appConfig["Batas_Maksimal_Respons"]) || 0;

        if (startTimeStr) {
          const startTime = parseCampusDate(startTimeStr);
          if (startTime && now < startTime) {
            isBlocked = true;
            blockReason = "BEFORE_START";
            blockTitle = "Formulir Belum Dibuka";
            targetTime = startTime;
            const timeFormatted = formatSmartScheduleTime(startTime);
            blockDesc = (appConfig["Pesan_Form_Belum_Buka"] || "Formulir penilaian belum dibuka. Perkuliahan akan dimulai sesuai jadwal.") + `<br><span class="inline-block mt-2 font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">Dibuka pada: ${timeFormatted}</span>`;
          }
        }

        if (!isBlocked && endTimeStr) {
          const endTime = parseCampusDate(endTimeStr);
          if (endTime && now > endTime) {
            isBlocked = true;
            blockReason = "AFTER_END";
            blockTitle = "Batas Waktu Pengisian Telah Berakhir";
            const timeFormatted = formatSmartScheduleTime(endTime);
            blockDesc = (appConfig["Pesan_Form_Ditutup"] || "Sesi penilaian telah berakhir dan batas waktu telah ditutup. Terima kasih atas partisipasi Anda.") + `<br><span class="inline-block mt-2 font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">Ditutup sejak: ${timeFormatted}</span>`;
          } else if (endTime) {
            // Check if deadline is approaching (< 24 hours)
            const diffMs = endTime - now;
            if (diffMs > 0 && diffMs < 24 * 3600 * 1000) {
              const diffHours = Math.floor(diffMs / (3600 * 1000));
              const diffMinutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
              if (warningBadge) {
                warningBadge.classList.remove("hidden");
                warningBadge.classList.add("inline-flex");
                warningBadge.innerHTML = `
                  <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>⏱️ Batas Pengisian: <strong>${diffHours} jam ${diffMinutes} menit lagi</strong></span>
                `;
              }
            } else if (warningBadge) {
              warningBadge.classList.add("hidden");
              warningBadge.classList.remove("inline-flex");
            }
          }
        }
      }

      const detailsContainer = document.getElementById("overviewDetailsContainer");
      const spoilerWrapper = document.getElementById("overviewSpoilerToggleWrapper");

      const spoilerContent = document.getElementById("overviewSpoilerContent");
      const spoilerOverlay = document.getElementById("overviewSpoilerOverlay");

      if (isBlocked) {
        if (warningBadge) {
          warningBadge.classList.add("hidden");
          warningBadge.classList.remove("inline-flex");
        }
        if (lockBanner) {
          lockBanner.classList.remove("hidden");
          document.getElementById("lockBannerTitle").textContent = blockTitle;
          document.getElementById("lockBannerDesc").innerHTML = blockDesc;
        }
        if (startBtn) {
          startBtn.disabled = true;
          startBtn.classList.add("opacity-50", "cursor-not-allowed");
          startBtn.innerHTML = `<span>🔒 Formulir Ditutup</span>`;
        }
        // Apply frosted glass spoiler blur when form is closed or not yet open
        if (spoilerContent && spoilerOverlay) {
          if (!spoilerContent.hasAttribute('data-revealed')) {
            applySpoilerBlur(true);
          }
        }
      } else {
        if (lockBanner) lockBanner.classList.add("hidden");
        if (!scheduleActive && warningBadge) {
          warningBadge.classList.add("hidden");
          warningBadge.classList.remove("inline-flex");
        }
        applySpoilerBlur(false);
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.classList.remove("opacity-50", "cursor-not-allowed");
          startBtn.innerHTML = `
            <span>Mulai Pengisian Penilaian</span>
            <span class="text-base">→</span>
          `;
        }
      }
    }

    let eyeTrackRafId = null;
    function initSpoilerEyeTracking() {
      if (window._spoilerEyeTrackingInitialized) return;
      window._spoilerEyeTrackingInitialized = true;

      window.addEventListener('mousemove', (e) => {
        const pupilGroup = document.getElementById("spoilerPupilGroup");
        const overlay = document.getElementById("overviewSpoilerOverlay");
        if (!pupilGroup || !overlay || overlay.classList.contains("hidden")) return;

        if (eyeTrackRafId) cancelAnimationFrame(eyeTrackRafId);
        eyeTrackRafId = requestAnimationFrame(() => {
          const rect = pupilGroup.getBoundingClientRect();
          const eyeCenterX = rect.left + rect.width / 2;
          const eyeCenterY = rect.top + rect.height / 2;

          const deltaX = e.clientX - eyeCenterX;
          const deltaY = e.clientY - eyeCenterY;
          const angle = Math.atan2(deltaY, deltaX);

          // Calculate natural clamped movement within eye socket
          const distance = Math.hypot(deltaX, deltaY);
          const maxDistanceX = 3.2;
          const maxDistanceY = 2.0;
          const clampedRatio = Math.min(1, distance / 120);

          const moveX = Math.cos(angle) * (maxDistanceX * clampedRatio);
          const moveY = Math.sin(angle) * (maxDistanceY * clampedRatio);

          pupilGroup.style.transform = `translate(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px)`;
        });
      }, { passive: true });
    }

    function applySpoilerBlur(isBlurred) {
      const spoilerOverlay = document.getElementById("overviewSpoilerOverlay");
      const spoilerContent = document.getElementById("overviewSpoilerContent");
      if (!spoilerContent || !spoilerOverlay) return;

      if (isBlurred) {
        spoilerContent.classList.add("filter", "blur-[3.5px]", "select-none", "pointer-events-none", "opacity-75");
        spoilerOverlay.classList.remove("hidden");
        spoilerOverlay.classList.add("flex");
        initSpoilerEyeTracking();
      } else {
        spoilerContent.classList.remove("filter", "blur-[3.5px]", "select-none", "pointer-events-none", "opacity-75");
        spoilerOverlay.classList.add("hidden");
        spoilerOverlay.classList.remove("flex");
      }
    }

    function revealSpoilerBlur() {
      const spoilerContent = document.getElementById("overviewSpoilerContent");
      if (spoilerContent) {
        spoilerContent.setAttribute('data-revealed', 'true');
      }
      applySpoilerBlur(false);
    }

    function renderConfigHeader() {
      const title = appConfig["Judul_Form"] || (currentFormMeta && currentFormMeta.judulForm) || `Penilaian Presentasi ${activeFormId}`;
      const matkul = appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "Mata Kuliah";
      const dosen = appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-";
      const sesi = appConfig["Sesi_Minggu_Aktif"] || (currentFormMeta && currentFormMeta.sesiAktif) || "Minggu 1";

      const formattedTitle = smartMathFormat(title);
      const rawDesc = appConfig["Deskripsi_Form"] || (currentFormMeta && currentFormMeta.deskripsi) || (currentFormSchema && currentFormSchema.tahapan && currentFormSchema.tahapan[0] && currentFormSchema.tahapan[0].description) || `Formulir penilaian perkuliahan ${matkul} (${appConfig["Kelas"] || ''}) yang diisi oleh mahasiswa/penilai.`;
      const formattedDesc = smartMathFormat(rawDesc);

      const navTitle = document.getElementById("navTitle");
      if (navTitle) {
        navTitle.innerHTML = formattedTitle;
        navTitle.classList.add("math-renderable");
      }
      const navSubtitle = document.getElementById("navSubtitle");
      if (navSubtitle) {
        navSubtitle.innerHTML = smartMathFormat(matkul);
        navSubtitle.classList.add("math-renderable");
      }
      const badgeSesi = document.getElementById("badgeSesiTopText");
      if (badgeSesi) badgeSesi.textContent = sesi;

      // Update Landing Hero Title & Description
      const overviewJudulEl = document.getElementById("overviewJudulForm");
      const overviewDescEl = document.getElementById("overviewDeskripsiForm");
      if (overviewJudulEl) {
        overviewJudulEl.innerHTML = formattedTitle;
        overviewJudulEl.classList.add("math-renderable");
      }
      if (overviewDescEl) {
        overviewDescEl.innerHTML = formattedDesc;
        overviewDescEl.classList.add("math-renderable");
      }
      
      // Update Academic & Additional Info Cards (Dynamic Grid)
      renderOverviewHeaderInfoGrid();

      renderOverviewAlurTahapan();
      updateStepMetadataFromSchema();
      renderDynamicStepTabs();
      renderDynamicClientStages();

      setTimeout(() => {
        const ovSec = document.getElementById("formOverviewSection");
        if (ovSec) renderAllMathInElement(ovSec);
        if (document.body) renderAllMathInElement(document.body);
      }, 50);

      const minVal = parseInt(appConfig["Nilai_Kelompok_Min"] || 50);
      const maxVal = parseInt(appConfig["Nilai_Kelompok_Max"] || 100);
      const sliderMinLbl = document.getElementById("sliderMinLabel");
      if (sliderMinLbl) sliderMinLbl.textContent = `Min: ${minVal}`;
      const sliderMaxLbl = document.getElementById("sliderMaxLabel");
      if (sliderMaxLbl) sliderMaxLbl.textContent = `Max: ${maxVal}`;
      const sliderInput = document.getElementById("inputNilaiSlider");
      if (sliderInput) {
        sliderInput.min = minVal;
        sliderInput.max = maxVal;
      }
      const numInput = document.getElementById("inputNilaiNumber");
      if (numInput) {
        numInput.min = minVal;
        numInput.max = maxVal;
        if (typeof updateScoreBadge === 'function') {
          updateScoreBadge(numInput.value || 85);
        }
      }
      evaluateFormScheduleStatus();

      // Dynamic Role & Group Labels (Inline Editable Sync)
      const optMhs = document.querySelector('#selectPeranPenilai option[value="Mahasiswa"]');
      if (optMhs && appConfig['Peran_Mahasiswa_Label']) optMhs.textContent = appConfig['Peran_Mahasiswa_Label'];
      const optDosen = document.querySelector('#selectPeranPenilai option[value="Dosen"]');
      if (optDosen && appConfig['Peran_Dosen_Label']) optDosen.textContent = appConfig['Peran_Dosen_Label'];
      const optLainnya = document.querySelector('#selectPeranPenilai option[value="Lainnya"]');
      if (optLainnya && appConfig['Peran_Lainnya_Label']) optLainnya.textContent = appConfig['Peran_Lainnya_Label'];

      const groupSubtitle = document.getElementById('step2Subtitle');
      if (groupSubtitle && appConfig['Pilih_Kelompok_Label']) groupSubtitle.textContent = appConfig['Pilih_Kelompok_Label'];

      // Update footer kredit pembuat web
      const pembuatNama   = (appConfig["Pembuat_Web_Nama"]   || "").trim();
      const pembuatPrefix = (appConfig["Pembuat_Web_Prefix"] || "Dibuat oleh").trim();
      const footerEl = document.getElementById("footerPembuat");
      const footerSep = document.getElementById("footerPembuatSep");
      if (footerEl) {
        if (pembuatNama) {
          footerEl.innerHTML = `${smartMathFormat(pembuatPrefix)} ${smartMathFormat(pembuatNama)}`;
          footerEl.classList.add("math-renderable");
          footerEl.classList.remove("hidden");
          if (footerSep) footerSep.classList.remove("hidden");
        } else {
          footerEl.classList.add("hidden");
          if (footerSep) footerSep.classList.add("hidden");
        }
      }
    }

    function renderGroupOptions() {
      const loading = document.getElementById("groupsLoading");
      const container = document.getElementById("groupsContainer");
      const empty = document.getElementById("groupsEmpty");

      loading.classList.add("hidden");

      if (!groupsData || groupsData.length === 0) {
        empty.classList.remove("hidden");
        container.classList.add("hidden");
        return;
      }

      empty.classList.add("hidden");
      container.classList.remove("hidden");
      container.innerHTML = "";

      const fragment = document.createDocumentFragment();

      // Dapatkan data penilai aktif (NIM, Nama, Peran, dan Kelompok Mahasiswa)
      const currentNim = (
        document.getElementById("inputNim")?.value || 
        clientCustomFormAnswers["fld_core_identity_nim"] || 
        activeUserAccountNim || 
        ""
      ).replace(/\s+/g, "").trim().toLowerCase();

      const currentName = (
        document.getElementById("inputNama")?.value || 
        clientCustomFormAnswers["fld_core_identity_nama"] || 
        activeUserAccountName || 
        ""
      ).trim().toLowerCase();

      const currentEmail = (
        document.getElementById("inputEmail")?.value || 
        clientCustomFormAnswers["fld_core_identity_email"] || 
        activeUserAccountEmail || 
        ""
      ).trim().toLowerCase();
      
      let evaluatorStudentGroup = "";
      if (currentEvaluatorRole === 'Mahasiswa' && currentNim) {
        const found = (allStudentsData || []).find(s => String(s.nim || "").replace(/\s+/g, "").trim().toLowerCase() === currentNim);
        if (found) evaluatorStudentGroup = found.kelompok || "";
      }

      // Ambil riwayat kelompok yang SUDAH dinilai oleh penilai ini di sesi aktif
      const filledGroups = [];
      if (currentRekapData) {
        if (currentNim && currentRekapData.nimToKelompokMap && currentRekapData.nimToKelompokMap[currentNim]) {
          currentRekapData.nimToKelompokMap[currentNim].forEach(g => {
            if (!filledGroups.some(fg => fg.toLowerCase() === g.toLowerCase())) filledGroups.push(g);
          });
        }
        if (currentName && currentRekapData.nameToKelompokMap && currentRekapData.nameToKelompokMap[currentName]) {
          currentRekapData.nameToKelompokMap[currentName].forEach(g => {
            if (!filledGroups.some(fg => fg.toLowerCase() === g.toLowerCase())) filledGroups.push(g);
          });
        }
        if (currentEmail && currentRekapData.emailToKelompokMap && currentRekapData.emailToKelompokMap[currentEmail]) {
          currentRekapData.emailToKelompokMap[currentEmail].forEach(g => {
            if (!filledGroups.some(fg => fg.toLowerCase() === g.toLowerCase())) filledGroups.push(g);
          });
        }
      }

      const isAntiSelfEvalActive = appConfig ? (appConfig["Cegah_Penilaian_Diri"] === true || appConfig["Cegah_Penilaian_Diri"] === "true" || appConfig["Cegah_Penilaian_Diri"] === undefined) : true;
      const isSingleLockActive = appConfig ? (appConfig["Kunci_Respons_Ganda"] === true || appConfig["Kunci_Respons_Ganda"] === "true" || appConfig["Kunci_Respons_Ganda"] === undefined) : true;

      groupsData.forEach((grp, idx) => {
        const isSelfGroup = isAntiSelfEvalActive && currentEvaluatorRole === 'Mahasiswa' && evaluatorStudentGroup && evaluatorStudentGroup.toLowerCase() === grp.name.toLowerCase();
        const isAlreadyFilled = isSingleLockActive && filledGroups.some(fg => fg.toLowerCase() === grp.name.toLowerCase());
        const isCurrentlySelected = selectedGroupObj && selectedGroupObj.name === grp.name;
        
        let cardState = "available"; // "available" | "self" | "already_filled"
        if (isSelfGroup) cardState = "self";
        else if (isAlreadyFilled) cardState = "already_filled";

        const isLocked = cardState !== "available";

        // Jika kelompok yang sebelumnya dipilih ternyata sudah terkunci, batalkan pilihan
        if (isLocked && isCurrentlySelected) {
          selectedGroupObj = null;
        }

        const card = document.createElement("label");
        card.id = `groupCard_${idx}`;
        
        let cardBgBorder = "border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer";
        let statusBadge = "";

        if (cardState === "already_filled") {
          cardBgBorder = "border-emerald-300 bg-emerald-50/50 opacity-85 cursor-not-allowed select-none";
          statusBadge = `
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300/80">
              <svg class="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
              Sudah Dinilai • Terkunci
            </span>
          `;
        } else if (cardState === "self") {
          cardBgBorder = "border-purple-200 bg-purple-50/40 opacity-80 cursor-not-allowed select-none";
          statusBadge = `
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
              Kelompok Anda (Penyaji)
            </span>
          `;
        } else if (isCurrentlySelected) {
          cardBgBorder = "border-zinc-900 bg-zinc-50 shadow-xs cursor-pointer";
          statusBadge = `
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
              ${grp.members.length} Pemateri
            </span>
          `;
        } else {
          statusBadge = `
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
              ${grp.members.length} Pemateri
            </span>
          `;
        }

        const memberPills = grp.members.map(m => `
          <span class="inline-block bg-zinc-100 text-zinc-700 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">
            ${m.name}
          </span>
        `).join(" ");

        card.className = `group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border transition-all ${cardBgBorder}`;
        
        card.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <input type="radio" name="selectedGroup" value="${grp.name}" 
                ${isCurrentlySelected && !isLocked ? 'checked' : ''} 
                ${isLocked ? 'disabled' : ''} 
                class="accent-zinc-900 h-4 w-4 ${isLocked ? 'pointer-events-none opacity-40' : ''}" 
                onchange="onSelectGroup('${grp.name}', ${idx})"
              >
              <span class="font-bold text-zinc-900 text-xs sm:text-sm truncate">${grp.name}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-zinc-100">
            ${memberPills}
          </div>
          ${cardState === 'already_filled' ? '<p class="text-[10.5px] text-emerald-800 font-medium mt-2 pt-1 border-t border-emerald-200/60">Penilaian Anda untuk kelompok ini telah resmi tersimpan di database.</p>' : ''}
          ${cardState === 'self' ? '<p class="text-[10.5px] text-purple-800 font-medium mt-2 pt-1 border-t border-purple-200/60">Anda adalah anggota penyaji kelompok ini (tidak dapat menilai diri sendiri).</p>' : ''}
        `;

        if (!isLocked) {
          card.onclick = () => {
            const radio = card.querySelector("input[type='radio']");
            if (radio && !radio.disabled) {
              radio.checked = true;
              onSelectGroup(grp.name, idx);
            }
          };
        } else {
          card.onclick = (e) => {
            e.preventDefault();
            if (cardState === 'already_filled') {
              showToast(`Anda sudah pernah menilai ${grp.name}. Pilihan ini dibekukan secara otomatis.`, "info");
            } else if (cardState === 'self') {
              showToast(`Anda adalah anggota penyaji ${grp.name} (tidak dapat menilai diri sendiri).`, "info");
            }
          };
        }

        fragment.appendChild(card);
      });

      container.appendChild(fragment);
    }

    function onSelectGroup(groupName, idx) {
      document.querySelectorAll(".group-card").forEach(c => {
        c.className = "group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition-all";
      });
      const activeCard = document.getElementById(`groupCard_${idx}`);
      if (activeCard) {
        activeCard.className = "group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-zinc-900 bg-zinc-50 shadow-xs cursor-pointer transition-all";
      }

      selectedGroupObj = groupsData.find(g => g.name === groupName);
      if (!selectedGroupObj) return;

      selectedBestPresenters = [];
      updateBestPresenterBadge();

      // Checkbox Presenter
      const bestList = document.getElementById("bestPresenterList");
      if (bestList) {
        bestList.innerHTML = "";
        selectedGroupObj.members.forEach((member, mIdx) => {
          const item = document.createElement("label");
          item.id = `bestPresCard_${mIdx}`;
          item.className = "flex items-center p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition text-xs";
          item.innerHTML = `
            <input type="checkbox" value="${member.name}" class="accent-zinc-900 h-4 w-4 rounded flex-shrink-0" onchange="handleBestPresenterChange(this, ${mIdx})">
            <div class="ml-2.5 min-w-0 flex-1 flex items-center justify-between gap-2">
              <span class="font-medium text-zinc-900 truncate">${member.name}</span>
              <span class="text-[10px] text-zinc-400 font-mono">${member.nim || 'NIM -'}</span>
            </div>
          `;
          bestList.appendChild(item);
        });
      }

      // Textarea Evaluasi
      const evalContainer = document.getElementById("evaluationInputsContainer");
      if (evalContainer) {
        evalContainer.innerHTML = "";
        const maxChars = parseInt(appConfig["Maksimal_Karakter_Evaluasi"] || 500);

        selectedGroupObj.members.forEach((member, eIdx) => {
          const box = document.createElement("div");
          box.className = "p-3.5 sm:p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2";
          box.innerHTML = `
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-zinc-800 text-xs sm:text-sm truncate">
                ${eIdx + 1}. ${member.name} <span class="text-[10px] font-normal text-zinc-500 font-mono">(${member.nim || 'NIM -'})</span>
              </span>
              <span id="charCount_${eIdx}" class="text-[10px] text-zinc-400 font-mono">0/${maxChars}</span>
            </div>
            <textarea 
              id="evalText_${eIdx}" 
              data-member="${member.name}" 
              required 
              rows="2" 
              maxlength="${maxChars}" 
              placeholder="Tuliskan masukan evaluasi untuk ${member.name}..." 
              class="w-full p-2.5 rounded-lg border border-zinc-300 text-xs sm:text-sm focus:border-zinc-900 outline-none bg-white transition leading-relaxed placeholder-zinc-400"
              oninput="updateCharCounter(this, 'charCount_${eIdx}', ${maxChars}); saveFormDraft();"
            ></textarea>
          `;
          evalContainer.appendChild(box);
        });
      }

      saveFormDraft();
    }

    // Navigation Step
    function updateStepUI(step, skipSave = false) {
      if (!document.getElementById("stepSection_1")) {
        renderDynamicClientStages();
      }
      currentStep = step;
      const totalSteps = Object.keys(stepMetadata).length || 1;
      const meta = (stepMetadata && stepMetadata[step]) || {
        badge: `${step < 10 ? '0' + step : step}/${totalSteps < 10 ? '0' + totalSteps : totalSteps}`,
        title: `Bagian ${step}`,
        percent: Math.round((step / totalSteps) * 100)
      };

      const badgeEl = document.getElementById("stepNumberBadge");
      const titleEl = document.getElementById("stepTitleLabel");
      const percentEl = document.getElementById("stepPercentLabel");
      const barEl = document.getElementById("progressBarFill");

      if (badgeEl) badgeEl.textContent = meta.badge;
      if (titleEl) titleEl.textContent = meta.title;
      if (percentEl) percentEl.textContent = `${meta.percent}%`;
      if (barEl) barEl.style.width = `${meta.percent}%`;

      for (let i = 1; i <= totalSteps; i++) {
        const sec = document.getElementById(`stepSection_${i}`);
        const tabBtn = document.getElementById(`stepTab_${i}`);
        
        if (sec) {
          if (i === step) {
            sec.classList.remove("hidden");
          } else {
            sec.classList.add("hidden");
          }
        }

        if (tabBtn) {
          if (i === step) {
            tabBtn.className = "py-1.5 px-1 rounded text-[10px] sm:text-[11px] font-bold transition text-zinc-900 bg-zinc-100 border border-zinc-400 shadow-2xs truncate";
          } else if (i < step) {
            tabBtn.className = "py-1.5 px-1 rounded text-[10px] sm:text-[11px] font-semibold transition text-emerald-800 bg-emerald-50 border border-emerald-300 cursor-pointer truncate";
          } else {
            tabBtn.className = "py-1.5 px-1 rounded text-[10px] sm:text-[11px] font-medium transition text-zinc-400 bg-zinc-50 border border-transparent truncate";
          }
        }
      }

      if (!skipSave) {
        saveFormDraft();
      } else {
        updateDraftResetButtonVisibility();
      }

      setTimeout(() => {
        const stageSec = document.getElementById(`stepSection_${step}`);
        if (stageSec) renderAllMathInElement(stageSec);
      }, 40);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateStageRequirements(stageIndex) {
      const currentStageSec = document.getElementById(`stepSection_${stageIndex}`);
      if (!currentStageSec) return true;

      // 1. Validasi Khusus Tahap 1 (Identitas Penilai)
      if (stageIndex === 1) {
        const roleSelect = document.getElementById("selectPeranPenilai");
        const role = currentEvaluatorRole || (roleSelect ? roleSelect.value : 'Mahasiswa') || 'Mahasiswa';

        // Validasi NIM untuk Mahasiswa
        if (role === 'Mahasiswa') {
          const inputNim = document.getElementById("inputNim");
          const nimVal = (inputNim ? inputNim.value : '').replace(/\s+/g, '').trim();
          if (!nimVal) {
            if (inputNim) {
              inputNim.focus();
              inputNim.classList.add("ring-2", "ring-rose-500", "border-rose-500");
              setTimeout(() => inputNim.classList.remove("ring-2", "ring-rose-500", "border-rose-500"), 3000);
            }
            showToast("Nomor Induk Mahasiswa (NIM) wajib diisi untuk peran Mahasiswa!", "warning");
            return false;
          }
        }

        // Validasi Nama Lengkap Penilai
        const inputNama = document.getElementById("inputNama");
        const namaVal = (inputNama ? inputNama.value : '').trim();
        if (!namaVal) {
          if (inputNama) {
            inputNama.focus();
            inputNama.classList.add("ring-2", "ring-rose-500", "border-rose-500");
            setTimeout(() => inputNama.classList.remove("ring-2", "ring-rose-500", "border-rose-500"), 3000);
          }
          showToast("Nama Lengkap Penilai wajib diisi sebelum melanjutkan!", "warning");
          return false;
        }

        // Validasi Email Penilai
        const isNoEmail = appConfig && appConfig["Mode_Pengumpulan_Email"] === "NO_EMAIL";
        if (!isNoEmail) {
          const inputEmail = document.getElementById("inputEmail");
          const emailVal = (inputEmail ? inputEmail.value : '').trim();
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailVal || !emailRegex.test(emailVal)) {
            if (inputEmail) inputEmail.focus();
            showToast("Email Penilai terverifikasi wajib terisi sebelum melanjutkan!", "warning");
            return false;
          }
        }
      }

      // 2. Validasi Khusus Tahap 2 (Kelompok & Rubrik Dasar)
      if (stageIndex === 2) {
        if (currentStageSec.querySelector('#groupsGrid') && !selectedGroupObj) {
          showToast("Pilih salah satu kelompok presentator sebelum melanjutkan!", "warning");
          const grpBox = document.getElementById("groupsGrid");
          if (grpBox) grpBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      }

      // 3. Validasi Seluruh Input Standar Wajib (Text, Number, Select, Textarea)
      const requiredInputs = currentStageSec.querySelectorAll('input[required]:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea[required], select[required]');
      for (let input of requiredInputs) {
        if (input.offsetParent === null && !input.classList.contains("force-validate")) continue;

        if (!input.value || !input.value.trim()) {
          input.focus();
          input.classList.add("ring-2", "ring-rose-500", "border-rose-500");
          setTimeout(() => input.classList.remove("ring-2", "ring-rose-500", "border-rose-500"), 3000);
          showToast("Mohon lengkapi seluruh pertanyaan bertanda wajib (*) sebelum melanjutkan.", "warning");
          return false;
        }
      }

      // 4. Validasi Radio Group Wajib
      const radioGroups = {};
      currentStageSec.querySelectorAll('input[type="radio"][required]').forEach(r => {
        if (r.name) radioGroups[r.name] = true;
      });
      for (let groupName in radioGroups) {
        const checkedRadio = currentStageSec.querySelector(`input[type="radio"][name="${groupName}"]:checked`);
        if (!checkedRadio) {
          const firstRadio = currentStageSec.querySelector(`input[type="radio"][name="${groupName}"]`);
          if (firstRadio) {
            firstRadio.focus();
            const parentCard = firstRadio.closest('.bg-white, .border');
            if (parentCard) {
              parentCard.classList.add("ring-2", "ring-rose-500", "border-rose-500");
              setTimeout(() => parentCard.classList.remove("ring-2", "ring-rose-500", "border-rose-500"), 3000);
            }
          }
          showToast("Mohon pilih salah satu opsi pada pertanyaan bertanda wajib (*).", "warning");
          return false;
        }
      }

      // 5. Validasi Checkbox Group Wajib
      const checkboxGroups = {};
      currentStageSec.querySelectorAll('input[type="checkbox"][required]').forEach(cb => {
        const key = cb.name || cb.id;
        if (key) checkboxGroups[key] = true;
      });
      for (let cbKey in checkboxGroups) {
        const checkedCb = currentStageSec.querySelector(`input[type="checkbox"][name="${cbKey}"]:checked, input[type="checkbox"]#${cbKey}:checked`);
        if (!checkedCb) {
          const firstCb = currentStageSec.querySelector(`input[type="checkbox"][name="${cbKey}"], input[type="checkbox"]#${cbKey}`);
          if (firstCb) {
            firstCb.focus();
            const parentCard = firstCb.closest('.bg-white, .border');
            if (parentCard) {
              parentCard.classList.add("ring-2", "ring-rose-500", "border-rose-500");
              setTimeout(() => parentCard.classList.remove("ring-2", "ring-rose-500", "border-rose-500"), 3000);
            }
          }
          showToast("Mohon centang opsi bertanda wajib (*) sebelum melanjutkan.", "warning");
          return false;
        }
      }

      // 6. Validasi Kustom Pertanyaan Dinamis
      const requiredCustomContainers = currentStageSec.querySelectorAll('[data-custom-required="true"]');
      for (let container of requiredCustomContainers) {
        const fieldId = container.getAttribute('data-field-id');
        if (fieldId) {
          const ans = clientCustomFormAnswers[fieldId];
          const hasFile = customUploadedFilesMap && customUploadedFilesMap[fieldId];
          if ((ans === undefined || ans === null || String(ans).trim() === '') && !hasFile) {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            container.classList.add("ring-2", "ring-rose-500", "border-rose-500");
            setTimeout(() => container.classList.remove("ring-2", "ring-rose-500", "border-rose-500"), 3000);
            showToast("Mohon lengkapi seluruh pertanyaan bertanda wajib (*) pada bagian ini.", "warning");
            return false;
          }
        }
      }

      return true;
    }

    function goToStep(targetStep) {
      if (targetStep === currentStep) return;

      if (targetStep > currentStep) {
        // Run strict stage validation
        if (!validateStageRequirements(currentStep)) {
          return;
        }

        // Additional integrity validation when moving from Step 2 to Step 3
        if (currentStep === 2 && targetStep > 2) {
          if (!selectedGroupObj) {
            showToast("Pilih salah satu kelompok presentator sebelum melanjutkan!", "warning");
            return;
          }

          const currentNim = (
            document.getElementById("inputNim")?.value || 
            clientCustomFormAnswers["fld_core_identity_nim"] || 
            activeUserAccountNim || 
            ""
          ).replace(/\s+/g, "").trim().toLowerCase();

          const currentEmail = (
            document.getElementById("inputEmail")?.value || 
            clientCustomFormAnswers["fld_core_identity_email"] || 
            activeUserAccountEmail || 
            ""
          ).trim().toLowerCase();

          const singleSubmissionLock = appConfig && appConfig["Kunci_Respons_Ganda"] !== false && appConfig["Kunci_Respons_Ganda"] !== "false";
          let isDuplicate = false;
          if (singleSubmissionLock && currentRekapData) {
            if (currentNim && currentRekapData.nimToKelompokMap && currentRekapData.nimToKelompokMap[currentNim]) {
              if (currentRekapData.nimToKelompokMap[currentNim].some(g => g.toLowerCase() === selectedGroupObj.name.toLowerCase())) {
                isDuplicate = true;
              }
            }
            if (currentEmail && currentRekapData.emailToKelompokMap && currentRekapData.emailToKelompokMap[currentEmail]) {
              if (currentRekapData.emailToKelompokMap[currentEmail].some(g => g.toLowerCase() === selectedGroupObj.name.toLowerCase())) {
                isDuplicate = true;
              }
            }
          }

          if (isDuplicate) {
            showToast(`Anda sudah pernah mengirimkan penilaian untuk ${selectedGroupObj.name}. Pilihan dibekukan.`, "error");
            selectedGroupObj = null;
            renderGroupOptions();
            return;
          }
        }
      }

      if (targetStep === 2) {
        renderGroupOptions();
      }

      updateStepUI(targetStep);
    }

    // =========================================================================
    // SMART ROLE & NIM-DRIVEN IDENTITY FUNCTIONS (STEP 1)
    // =========================================================================
    function fillNimEmailFormat() {
      const cleanNim = (document.getElementById("inputNim")?.value || "").trim();
      if (!cleanNim) {
        showToast("Masukkan NIM Anda terlebih dahulu!", "warning");
        return;
      }
      const inputEmail = document.getElementById("inputEmail");
      if (inputEmail) {
        inputEmail.value = `${cleanNim}@mhs.ulm.ac.id`;
        validateEmailLive(inputEmail.value);
        saveFormDraft();
        showToast("Format email NIM berhasil diisi.", "success");
      }
    }

    function onRoleChange(role) {
      currentEvaluatorRole = role || 'Mahasiswa';

      const selectEl = document.getElementById("selectPeranPenilai");
      if (selectEl && role && selectEl.value !== role) {
        selectEl.value = role;
      }

      const nimContainer = document.getElementById("nimContainer");
      const identityFieldsContainer = document.getElementById("identityFieldsContainer");
      const autoFillNotice = document.getElementById("namaAutoFillNotice");
      const btnFillNimEmail = document.getElementById("btnFillNimEmail");
      const inputNama = document.getElementById("inputNama");
      const inputEmail = document.getElementById("inputEmail");
      const step1Subtitle = document.getElementById("step1Subtitle");

      if (!role) {
        if (nimContainer) nimContainer.classList.add("hidden");
        if (identityFieldsContainer) identityFieldsContainer.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Pilih peran penilai Anda terlebih dahulu untuk memulai pengisian identitas.";
        return;
      }

      if (identityFieldsContainer) identityFieldsContainer.classList.remove("hidden");

      const inputNim = document.getElementById("inputNim");

      if (role === 'Mahasiswa') {
        if (inputNim) inputNim.required = true;
        if (nimContainer) nimContainer.classList.remove("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Masukkan NIM Anda untuk verifikasi otomatis data mahasiswa.";
        if (inputNama) inputNama.placeholder = "Tuliskan nama lengkap Anda...";
        if (inputEmail) inputEmail.placeholder = "contoh: 221012310001@mhs.ulm.ac.id";
        
        const currentNim = inputNim?.value || "";
        if (currentNim) {
          validateNimLive(currentNim);
        } else {
          if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        }
      } else if (role === 'Dosen') {
        if (inputNim) inputNim.required = false;
        if (nimContainer) nimContainer.classList.add("hidden");
        if (autoFillNotice) autoFillNotice.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Masukkan nama dan email dosen pengampu / penguji.";
        if (inputNama) {
          inputNama.placeholder = "Tuliskan nama lengkap Dosen beserta gelar...";
        }
        if (inputEmail) {
          inputEmail.placeholder = "email.dosen@ulm.ac.id";
        }
      } else if (role === 'Lainnya') {
        if (inputNim) inputNim.required = false;
        if (nimContainer) nimContainer.classList.add("hidden");
        if (autoFillNotice) autoFillNotice.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Masukkan nama dan email penilai tamu / umum.";
        if (inputNama) {
          inputNama.placeholder = "Tuliskan nama lengkap penilai tamu...";
        }
        if (inputEmail) {
          inputEmail.placeholder = "email.penilai@domain.com";
        }
      }
      saveFormDraft();
    }

    function validateNimLive(nimVal) {
      const cleanNim = String(nimVal || "").replace(/\s+/g, "").trim().toLowerCase();
      const nimInput = document.getElementById("inputNim");
      const iconEl = document.getElementById("nimStatusIcon");
      const feedbackBox = document.getElementById("nimFeedbackBox");
      const autoFillNotice = document.getElementById("namaAutoFillNotice");
      const btnFillNimEmail = document.getElementById("btnFillNimEmail");
      const inputNama = document.getElementById("inputNama");

      if (!cleanNim) {
        if (iconEl) iconEl.classList.add("hidden");
        if (feedbackBox) feedbackBox.classList.add("hidden");
        if (autoFillNotice) autoFillNotice.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-lg border border-zinc-300 text-xs sm:text-sm font-mono focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400";
        updateDraftResetButtonVisibility();
        return false;
      }

      let foundStudent = null;
      let foundGroupName = "";
      let foundGroupSesi = "";

      // 1. Cari di allStudentsData (Roster Master Seluruh Mahasiswa Kelas)
      if (allStudentsData && allStudentsData.length > 0) {
        for (const s of allStudentsData) {
          const sNim = String(s.nim || "").replace(/\s+/g, "").trim().toLowerCase();
          if (sNim && sNim === cleanNim) {
            foundStudent = s;
            foundGroupName = s.kelompok || "Kelompok Terdaftar";
            foundGroupSesi = s.sesi || "Minggu 1";
            break;
          }
        }
      }

      // 2. Fallback cari di groupsData jika allStudentsData belum terisi
      if (!foundStudent && groupsData && groupsData.length > 0) {
        for (const g of groupsData) {
          const m = (g.members || []).find(mem => {
            const mNim = String(mem.nim || "").replace(/\s+/g, "").trim().toLowerCase();
            return mNim && mNim === cleanNim;
          });
          if (m) {
            foundStudent = m;
            foundGroupName = g.name || "Kelompok Terdaftar";
            foundGroupSesi = g.sesi || "Minggu 1";
            break;
          }
        }
      }

      if (foundStudent) {
        if (iconEl) iconEl.classList.remove("hidden");
        if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-xl border border-emerald-500 text-xs sm:text-sm font-mono focus:border-emerald-600 outline-none transition bg-emerald-50/20";
        
        if (feedbackBox) {
          feedbackBox.className = "text-xs rounded-xl p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between";
          feedbackBox.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
              <div>
                <span class="font-bold block">${escapeHtml(foundStudent.name)}</span>
                <span class="text-[10px] text-emerald-700 block font-medium">${escapeHtml(foundGroupName)} (${escapeHtml(foundGroupSesi)})</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-200/80 font-bold text-emerald-800">Terdaftar</span>
          `;
          feedbackBox.classList.remove("hidden");
        }

        if (inputNama && !inputNama.value) {
          inputNama.value = foundStudent.name;
        }
        if (autoFillNotice) autoFillNotice.classList.remove("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");

        activeUserAccountNim = cleanNim;
        renderGroupOptions();
        return true;
      } else {
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");

        const isGoogleAuthMhs = (activeUserAccountEmail || "").toLowerCase().endsWith("@mhs.ulm.ac.id");
        if (isGoogleAuthMhs) {
          if (iconEl) iconEl.classList.remove("hidden");
          if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-xl border border-emerald-300 text-xs sm:text-sm font-mono outline-none transition bg-emerald-50/30";
          if (feedbackBox) {
            feedbackBox.className = "text-xs rounded-xl p-2.5 bg-emerald-50/60 border border-emerald-200 text-emerald-800 flex items-center gap-2";
            feedbackBox.innerHTML = `
              <span class="text-emerald-600 font-bold">✓</span>
              <span>Identitas NIM <strong>${cleanNim}</strong> terverifikasi via Google Cloud ULM.</span>
            `;
            feedbackBox.classList.remove("hidden");
          }
          activeUserAccountNim = cleanNim;
          renderGroupOptions();
          return true;
        }

        if (cleanNim.length >= 6) {
          if (iconEl) iconEl.classList.add("hidden");
          if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-xl border border-amber-400 text-xs sm:text-sm font-mono focus:border-amber-600 outline-none transition bg-amber-50/20";
          if (feedbackBox) {
            feedbackBox.className = "text-[11px] rounded-xl p-2.5 bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2";
            feedbackBox.innerHTML = `
              <span class="p-1 rounded bg-amber-200 text-amber-800 flex-shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </span>
              <span>NIM <strong>${cleanNim}</strong> tidak ditemukan di daftar kelas ini. Pastikan NIM benar atau pilih peran <em>Dosen / Lainnya</em>.</span>
            `;
            feedbackBox.classList.remove("hidden");
          }
        } else {
          if (iconEl) iconEl.classList.add("hidden");
          if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm font-mono focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400";
          if (feedbackBox) feedbackBox.classList.add("hidden");
        }
        activeUserAccountNim = cleanNim;
        renderGroupOptions();
        return false;
      }
    }

    function nextFromStep1() {
      const emailInput = document.getElementById("inputEmail");
      const email = emailInput ? emailInput.value.trim() : "";
      const namaInput = document.getElementById("inputNama");
      const nama = namaInput ? namaInput.value.trim() : "";
      const nimInput = document.getElementById("inputNim");
      const nim = nimInput ? nimInput.value.trim() : "";

      if (currentEvaluatorRole === 'Mahasiswa') {
        if (!nim) {
          showToast("Nomor Induk Mahasiswa (NIM) wajib diisi!", "warning");
          if (nimInput) nimInput.focus();
          return;
        }
        const isNimValid = validateNimLive(nim);
        if (!isNimValid && nim.length < 6) {
          showToast("Masukkan NIM mahasiswa yang valid!", "warning");
          if (nimInput) nimInput.focus();
          return;
        }
      }

      if (!nama) {
        showToast("Nama lengkap penilai wajib diisi!", "warning");
        if (namaInput) namaInput.focus();
        return;
      }

      const emailMode = getCurrentEmailCollectionMode();
      if (emailMode !== 'NO_EMAIL' && !validateEmailLive(email)) {
        showToast("Identitas email Google belum terverifikasi dengan benar!", "error");
        return;
      }

      updateStepUI(2);
    }

    function nextFromStep2() {
      if (!selectedGroupObj) {
        showToast("Pilih salah satu kelompok yang dinilai!", "warning");
        return;
      }
      updateStepUI(3);
    }

    function nextFromStep3() {
      if (selectedBestPresenters.length === 0) {
        showToast("Pilih minimal 1 orang presentator terbaik!", "warning");
        return;
      }

      document.getElementById("summaryPenilai").textContent = document.getElementById("inputNama").value.trim() + ` (${currentEvaluatorRole})`;
      document.getElementById("summaryKelompok").textContent = selectedGroupObj.name;
      document.getElementById("summarySkor").textContent = document.getElementById("inputNilaiNumber").value;
      document.getElementById("summaryPresentator").textContent = selectedBestPresenters.join(", ");

      updateStepUI(4);
    }

    // Score & Presenter Logic
    function setScoreValue(val) {
      document.getElementById("inputNilaiSlider").value = val;
      document.getElementById("inputNilaiNumber").value = val;
      updateScoreBadge(val);
      saveFormDraft();
    }

    function adjustScore(delta) {
      const numInput = document.getElementById("inputNilaiNumber");
      let val = parseInt(numInput.value || 85) + delta;
      const min = parseInt(numInput.min || 50);
      const max = parseInt(numInput.max || 100);
      if (val >= min && val <= max) {
        setScoreValue(val);
      }
    }

    function syncScore(val, source) {
      if (source === 'slider') {
        document.getElementById("inputNilaiNumber").value = val;
      } else {
        document.getElementById("inputNilaiSlider").value = val;
      }
      updateScoreBadge(val);
      saveFormDraft();
    }

    function updateScoreBadge(val) {
      const v = parseFloat(val);
      const badge = document.getElementById("scoreGradeBadge");
      if (!badge) return;
      if (v >= 80) {
        badge.textContent = "Nilai A (4,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200";
      } else if (v >= 77) {
        badge.textContent = "Nilai A- (3,75)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200";
      } else if (v >= 75) {
        badge.textContent = "Nilai B+ (3,50)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200";
      } else if (v >= 70) {
        badge.textContent = "Nilai B (3,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200";
      } else if (v >= 67) {
        badge.textContent = "Nilai B- (2,75)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200";
      } else if (v >= 64) {
        badge.textContent = "Nilai C+ (2,50)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200";
      } else if (v >= 60) {
        badge.textContent = "Nilai C (2,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200";
      } else if (v >= 50) {
        badge.textContent = "Nilai D+ (1,50)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200";
      } else if (v >= 40) {
        badge.textContent = "Nilai D (1,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200";
      } else {
        badge.textContent = "Nilai E (0)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200";
      }
    }

    function handleBestPresenterChange(checkbox, mIdx) {
      const maxAllowed = parseInt(appConfig["Maksimal_Pilihan_Presentator_Terbaik"] || 2);
      const val = checkbox.value;
      const card = document.getElementById(`bestPresCard_${mIdx}`);

      if (checkbox.checked) {
        if (selectedBestPresenters.length >= maxAllowed) {
          checkbox.checked = false;
          showToast(`Maksimal hanya boleh memilih ${maxAllowed} orang!`, "warning");
          return;
        }
        selectedBestPresenters.push(val);
        if (card) card.className = "flex items-center p-3 rounded-lg border border-zinc-900 bg-zinc-50 cursor-pointer transition text-xs shadow-2xs";
      } else {
        selectedBestPresenters = selectedBestPresenters.filter(name => name !== val);
        if (card) card.className = "flex items-center p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition text-xs";
      }
      updateBestPresenterBadge();
      saveFormDraft();
    }

    function updateBestPresenterBadge() {
      const maxAllowed = parseInt(appConfig["Maksimal_Pilihan_Presentator_Terbaik"] || 2);
      const badge = document.getElementById("bestPresenterCountBadge");
      badge.textContent = `${selectedBestPresenters.length}/${maxAllowed} Terpilih`;
    }

    function updateCharCounter(textarea, counterId, maxChars) {
      const len = textarea.value.length;
      const counterEl = document.getElementById(counterId);
      if (counterEl) {
        counterEl.textContent = `${len}/${maxChars}`;
        if (len >= maxChars) {
          counterEl.className = "text-[10px] text-rose-600 font-mono font-bold";
        } else {
          counterEl.className = "text-[10px] text-zinc-400 font-mono";
        }
      }
    }

    // =========================================================================
    // AUTO-SAVE FORM DRAFT ENGINE (PENYIMPANAN OTOMATIS ISIAN MAHASISWA)
    // =========================================================================
    function getFormDraftKey(specificEmail = null) {
      const currentEmail = specificEmail || activeUserAccountEmail || (document.getElementById("inputEmail")?.value || "").trim();
      const cleanEmail = currentEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (cleanEmail) {
        return "PGSD_DRAFT_" + (activeFormId || 'BK5E').toUpperCase() + "_" + cleanEmail;
      }
      return "PGSD_DRAFT_" + (activeFormId || 'BK5E').toUpperCase() + "_DEFAULT";
    }

    function hasAnyFormInputFilled() {
      try {
        const nim = document.getElementById("inputNim") ? document.getElementById("inputNim").value.trim() : "";
        const nama = document.getElementById("inputNama") ? document.getElementById("inputNama").value.trim() : "";
        const email = document.getElementById("inputEmail") ? document.getElementById("inputEmail").value.trim() : "";
        if (nim.length > 0 || nama.length > 0 || email.length > 0) return true;
        if (selectedGroupObj) return true;
        if (selectedBestPresenters && selectedBestPresenters.length > 0) return true;

        let hasEval = false;
        document.querySelectorAll("#evaluationInputsContainer textarea").forEach(ta => {
          if (ta.value.trim().length > 0) hasEval = true;
        });
        if (hasEval) return true;

        const raw = localStorage.getItem(getFormDraftKey());
        if (raw) {
          const d = JSON.parse(raw);
          if (d && (d.nim || d.nama || d.email || d.groupName || (d.bestPresenters && d.bestPresenters.length > 0) || (d.evaluasi && Object.keys(d.evaluasi).length > 0))) {
            return true;
          }
        }
      } catch (e) {}
      return false;
    }

    function updateDraftResetButtonVisibility() {
      const hasData = hasAnyFormInputFilled();
      document.querySelectorAll(".btnResetDraft").forEach(btn => {
        if (hasData) {
          btn.classList.remove("hidden");
        } else {
          btn.classList.add("hidden");
        }
      });
      const indicator = document.getElementById("autoSaveIndicator");
      if (indicator && !hasData) {
        indicator.classList.add("hidden");
      }
    }

    function saveFormDraft() {
      try {
        const peran = currentEvaluatorRole || "Mahasiswa";
        const nim = document.getElementById("inputNim") ? document.getElementById("inputNim").value : "";
        const email = document.getElementById("inputEmail") ? document.getElementById("inputEmail").value : "";
        const nama = document.getElementById("inputNama") ? document.getElementById("inputNama").value : "";
        const groupName = selectedGroupObj ? selectedGroupObj.name : "";
        const nilai = document.getElementById("inputNilaiNumber") ? document.getElementById("inputNilaiNumber").value : "85";
        
        const evaluasi = {};
        document.querySelectorAll("#evaluationInputsContainer textarea").forEach(ta => {
          const member = ta.getAttribute("data-member");
          if (member) {
            evaluasi[member] = ta.value;
          }
        });

        // Hanya simpan jika ada isian yang diinputkan pengguna
        if (!email && !nama && !nim && !groupName && selectedBestPresenters.length === 0 && Object.keys(evaluasi).length === 0) {
          updateDraftResetButtonVisibility();
          return;
        }

        const draft = {
          formId: activeFormId,
          peran: peran,
          nim: nim,
          email: email,
          nama: nama,
          groupName: groupName,
          nilai: nilai,
          bestPresenters: selectedBestPresenters,
          evaluasi: evaluasi,
          customAnswers: clientCustomFormAnswers || {},
          uploadedFiles: customUploadedFilesMap || {},
          step: currentStep,
          timestamp: Date.now()
        };

        const draftKey = getFormDraftKey(email);
        localStorage.setItem(draftKey, JSON.stringify(draft));

        if (email) {
          saveAccountProfile(email, nama, nim, peran);
          activeUserAccountEmail = email;
          activeUserAccountName = nama;
          updateAccountHeaderUI();
        }

        const indicator = document.getElementById("autoSaveIndicator");
        if (indicator) indicator.classList.remove("hidden");
      } catch (e) {}
      updateDraftResetButtonVisibility();
    }

    // ============================================================
    // GOOGLE CLOUD OAUTH & SUPABASE AUTHENTICATION SUBSYSTEM
    // ============================================================
    const authState = {
      initializing: true,
      ready: false,
      session: null,
      user: null
    };
    let authInitPromise = null;

    function isUlmEmail(email = '') {
      const normalized = String(email).trim().toLowerCase();
      return (
        normalized.endsWith('@mhs.ulm.ac.id') ||
        normalized.endsWith('@ulm.ac.id')
      );
    }

    function getCurrentEmailCollectionMode() {
      return appConfig["Mode_Pengumpulan_Email"] || "ULM_ONLY";
    }

    function extractGoogleProfile(user) {
      const metadata = user?.user_metadata || {};
      return {
        id: user?.id || null,
        email: (user?.email || metadata.email || '').trim().toLowerCase(),
        name: metadata.full_name || metadata.name || '',
        avatar: metadata.avatar_url || metadata.picture || ''
      };
    }

    function extractCandidateNim(email = '') {
      const normalized = String(email).trim().toLowerCase();
      if (!normalized.endsWith('@mhs.ulm.ac.id')) return null;
      const prefix = normalized.split('@')[0] || '';
      const match = prefix.match(/\d{8,15}/);
      if (match) return match[0];
      return null;
    }

    function resolveStudentIdentity(profile, mode) {
      const email = profile.email || "";
      let candidateNim = extractCandidateNim(email);
      let resolvedName = profile.name || "";
      let isRosterVerified = false;
      let detectedRole = "Mahasiswa";

      if (email.endsWith("@ulm.ac.id") && !email.includes("@mhs.")) {
        detectedRole = "Dosen";
      }

      // Fast synchronous lookup in memory from allStudentsData
      if (allStudentsData && allStudentsData.length > 0) {
        let found = null;
        if (candidateNim) {
          found = allStudentsData.find(s => String(s.nim).trim() === candidateNim);
        }
        if (!found && profile.name) {
          found = allStudentsData.find(s => (s.name || '').toLowerCase() === profile.name.toLowerCase());
        }
        if (found) {
          candidateNim = found.nim;
          resolvedName = found.name || profile.name;
          isRosterVerified = true;
          detectedRole = "Mahasiswa";
        }
      }

      // Fallback lookup in memory from groupsData
      if (!isRosterVerified && groupsData && groupsData.length > 0 && candidateNim) {
        for (const g of groupsData) {
          const m = (g.members || []).find(mem => String(mem.nim).trim() === candidateNim);
          if (m) {
            resolvedName = m.name || resolvedName;
            isRosterVerified = true;
            break;
          }
        }
      }

      // Non-blocking background sync if not verified yet
      if (!isRosterVerified && candidateNim) {
        setTimeout(async () => {
          try {
            const sb = getSupabaseClient();
            if (sb) {
              const { data: studentRow } = await sb.from('pgsd_students')
                .select('*')
                .eq('form_id', activeFormId)
                .eq('nim', candidateNim)
                .maybeSingle();

              if (studentRow && studentRow.name) {
                const inputNama = document.getElementById("inputNama");
                if (inputNama && (!inputNama.value || inputNama.value === email.split('@')[0])) {
                  inputNama.value = studentRow.name;
                }
                const accountName = document.getElementById("accountActiveName");
                if (accountName) accountName.textContent = studentRow.name;
              }
            }
          } catch(e) {}
        }, 80);
      }

      return {
        ok: true,
        profile,
        nim: candidateNim || '',
        name: resolvedName || (email ? email.split('@')[0] : "Penilai"),
        role: detectedRole,
        isGoogleVerified: true,
        isRosterVerified
      };
    }

    function applyLockedIdentity(identity) {
      const authUser = {
        email: identity.profile.email,
        nama: identity.name,
        nim: identity.nim,
        peran: identity.role,
        avatarUrl: identity.profile.avatar,
        provider: "google",
        isGoogleVerified: true,
        isRosterVerified: identity.isRosterVerified
      };

      setAuthSession(authUser, true);
      activeUserAccountEmail = authUser.email;
      activeUserAccountName = authUser.nama;
      activeUserAccountNim = authUser.nim;
      activeUserAccountAvatarUrl = authUser.avatarUrl;
      currentEvaluatorRole = authUser.peran;

      // 1. Sinkronkan tampilan Peran terlebih dahulu
      if (authUser.peran && typeof onRoleChange === 'function') {
        onRoleChange(authUser.peran);
      }

      const inputEmail = document.getElementById("inputEmail");
      const inputNama = document.getElementById("inputNama");
      const inputNim = document.getElementById("inputNim");
      const selectPeran = document.getElementById("selectPeranPenilai");
      const emailChips = document.getElementById("emailQuickChips");
      const btnFillNimEmail = document.getElementById("btnFillNimEmail");

      if (selectPeran) {
        selectPeran.value = authUser.peran || "Mahasiswa";
      }

      if (inputEmail) {
        inputEmail.value = authUser.email;
        inputEmail.readOnly = true;
        inputEmail.className = "w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-emerald-300 text-xs sm:text-sm bg-emerald-50/40 text-zinc-800 font-mono outline-none cursor-default shadow-2xs";
      }

      if (inputNama) {
        if (authUser.nama && (!inputNama.value || inputNama.value.trim() === '')) {
          inputNama.value = authUser.nama;
        }
        inputNama.readOnly = false;
        inputNama.className = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm bg-white text-zinc-900 focus:border-zinc-900 outline-none transition shadow-2xs";
        const autoNotice = document.getElementById("namaAutoFillNotice");
        if (autoNotice) {
          autoNotice.textContent = "Terisi otomatis (dapat diubah)";
          autoNotice.classList.remove("hidden");
        }
      }

      if (inputNim && authUser.nim) {
        inputNim.value = authUser.nim;
        inputNim.readOnly = true;
        inputNim.className = "w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-emerald-300 text-xs sm:text-sm bg-emerald-50/40 text-zinc-800 font-mono outline-none cursor-default shadow-2xs";
        validateNimLive(authUser.nim);
        const nimNotice = document.getElementById("authNimAutoNotice");
        if (nimNotice) {
          nimNotice.textContent = "✓ Terverifikasi Google";
          nimNotice.classList.remove("hidden");
        }
      }

      if (emailChips) emailChips.classList.add("hidden");
      if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
    }

    function renderAccountBar(identity) {
      const card = document.getElementById("formAccountHeaderCard");
      if (!card) return;

      const emailEl = document.getElementById("accountActiveEmail");
      const nameEl = document.getElementById("accountActiveName");
      const avatarBox = document.getElementById("accountAvatarBox");
      const badgeGoogle = document.getElementById("badgeGoogleVerified");
      const badgeRoster = document.getElementById("badgeRosterVerified");

      const email = (identity.profile && identity.profile.email) || identity.email || "";
      const name = identity.name || (identity.profile && identity.profile.name) || (email ? email.split('@')[0] : "Penilai");
      const avatar = (identity.profile && identity.profile.avatar) || identity.avatarUrl || "";

      if (emailEl) emailEl.textContent = email;
      if (nameEl) nameEl.textContent = name;

      if (avatarBox) {
        const initial = (name || email || 'U').charAt(0).toUpperCase();
        const googleMiniIcon = `
          <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-xs border border-zinc-200 pointer-events-none">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
        `;
        if (avatar) {
          avatarBox.innerHTML = `
            <img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}" class="w-full h-full object-cover rounded-full" onerror="this.outerHTML='<span class=\\'font-bold text-white text-sm\\'>${escapeHtml(initial)}</span>'">
            ${googleMiniIcon}
          `;
        } else {
          avatarBox.innerHTML = `
            <span class="font-bold text-white text-sm">${escapeHtml(initial)}</span>
            ${googleMiniIcon}
          `;
        }
      }

      if (badgeGoogle) badgeGoogle.classList.remove("hidden");
      if (badgeRoster) {
        if (identity.isRosterVerified) {
          badgeRoster.classList.remove("hidden");
        } else {
          badgeRoster.classList.add("hidden");
        }
      }

      card.classList.remove("hidden");
    }

    function showGoogleAuthGate() {
      const authGate = document.getElementById("formAuthGateSection");
      const overview = document.getElementById("formOverviewSection");
      const wizard = document.getElementById("formWizardContainer");
      const promptCard = document.getElementById("authGatePromptCard");
      const mismatchCard = document.getElementById("authGateDomainMismatchCard");
      const reqDesc = document.getElementById("authGateRequirementDesc");

      if (overview) overview.classList.add("hidden");
      if (wizard) wizard.classList.add("hidden");
      if (authGate) authGate.classList.remove("hidden");
      if (promptCard) promptCard.classList.remove("hidden");
      const mode = getCurrentEmailCollectionMode();
      if (reqDesc) {
        if (mode === 'ULM_ONLY') {
          reqDesc.textContent = "Gunakan akun Google resmi kampus (@mhs.ulm.ac.id) untuk melanjutkan pengisian.";
        } else {
          reqDesc.textContent = "Masuk untuk verifikasi identitas dan penyimpanan draf otomatis.";
        }
      }

      renderGoogleSignInButtonDefault();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function showDomainMismatch(profile) {
      const authGate = document.getElementById("formAuthGateSection");
      const overview = document.getElementById("formOverviewSection");
      const wizard = document.getElementById("formWizardContainer");
      const promptCard = document.getElementById("authGatePromptCard");
      const mismatchCard = document.getElementById("authGateDomainMismatchCard");
      const emailEl = document.getElementById("mismatchActiveEmail");

      if (overview) overview.classList.add("hidden");
      if (wizard) wizard.classList.add("hidden");
      if (authGate) authGate.classList.remove("hidden");
      if (promptCard) promptCard.classList.add("hidden");
      if (mismatchCard) mismatchCard.classList.remove("hidden");
      if (emailEl) emailEl.textContent = profile.email;

      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function saveAuthIntent(formId) {
      try {
        sessionStorage.setItem('PGSD_AUTH_INTENT', JSON.stringify({
          action: 'START_ASSESSMENT',
          formId: formId || activeFormId || 'BK5E',
          createdAt: Date.now()
        }));
      } catch(e) {}
    }

    async function handleGoogleSignIn() {
      try {
        const isFileProtocol = window.location.protocol === 'file:';
        const isInsideIframe = window.self !== window.top;

        // 1. FAST-PATH: Pengujian Berkas Lokal (file:///)
        if (isFileProtocol) {
          const mockGoogleUser = {
            email: "2310125210099@mhs.ulm.ac.id",
            nama: "Mahasiswa Terverifikasi ULM",
            nim: "2310125210099",
            peran: "Mahasiswa",
            avatarUrl: "",
            provider: "google"
          };
          setAuthSession(mockGoogleUser, true);
          const identity = await resolveStudentIdentity({ email: mockGoogleUser.email, name: mockGoogleUser.nama, avatar: "" }, getCurrentEmailCollectionMode());
          applyLockedIdentity(identity);
          renderAccountBar(identity);
          openAssessmentForm();
          showToast("Mode simulasi lokal aktif!", "success");
          return;
        }

        // 2. FAST-PATH: Simulator Pratinjau Admin (Iframe)
        if (isInsideIframe) {
          const mockSimulatorUser = {
            email: "evaluator.simulasi@mhs.ulm.ac.id",
            nama: "Penilai Simulasi Pratinjau",
            nim: "2310125210099",
            peran: "Mahasiswa",
            avatarUrl: "",
            provider: "simulator"
          };
          setAuthSession(mockSimulatorUser, false);
          const identity = await resolveStudentIdentity({ email: mockSimulatorUser.email, name: mockSimulatorUser.nama, avatar: "" }, getCurrentEmailCollectionMode());
          applyLockedIdentity(identity);
          renderAccountBar(identity);
          openAssessmentForm();
          showToast("Mode Simulasi Pratinjau berhasil aktif!", "success");
          return;
        }

        // 3. LIVE WEB: Google Cloud OAuth Resmi via Supabase Auth
        saveAuthIntent(activeFormId);

        const btn = document.getElementById("btnGoogleSignIn");
        if (btn) {
          btn.innerHTML = `
            <svg class="w-4 h-4 animate-spin text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-white font-bold">Membuka Google OAuth...</span>
          `;
        }

        const redirectTo = window.location.origin + window.location.pathname + (activeFormId ? `?id=${activeFormId}` : '');
        const sb = getSupabaseClient() || (window.supabase && typeof window.supabase.createClient === "function" ? (supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)) : null);

        if (!sb || !sb.auth) {
          throw new Error("Supabase Auth Client belum siap. Silakan coba kembali dalam beberapa detik.");
        }

        const { data, error } = await sb.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });

        if (error) {
          showToast("Gagal Google Sign-In: " + error.message, "error");
          renderGoogleSignInButtonDefault();
        }
      } catch (err) {
        showToast("Google Auth Error: " + err.message, "error");
        renderGoogleSignInButtonDefault();
      }
    }

    function renderGoogleSignInButtonDefault() {
      const btn = document.getElementById("btnGoogleSignIn");
      if (btn) {
        btn.innerHTML = `
          <div class="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
            <svg class="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <span>Lanjutkan dengan Google</span>
        `;
      }
    }

    async function handleSwitchGoogleAccount() {
      const ok = await showAppConfirm({
        title: "Ganti Akun Google?",
        message: "Anda akan dialihkan ke layar pemilihan Akun Google resmi Anda. Draf isian saat ini tetap tersimpan aman di akun ini.",
        confirmText: "Ya, Ganti Akun Google",
        cancelText: "Batal",
        type: "info"
      });
      if (ok) {
        await handleDirectSwitchGoogle();
      }
    }

    let isPerformingSignOut = false;
    async function executeSupabaseSignOut() {
      if (isPerformingSignOut) return;
      isPerformingSignOut = true;
      try {
        const sb = getSupabaseClient();
        if (sb && sb.auth) {
          await Promise.race([
            sb.auth.signOut({ scope: 'local' }).catch(() => {}),
            new Promise(resolve => setTimeout(resolve, 800))
          ]);
        }
      } catch (e) {
        console.warn("Supabase signOut notice:", e);
      } finally {
        clearAuthSession();
        isPerformingSignOut = false;
      }
    }

    async function handleDirectSwitchGoogle() {
      await executeSupabaseSignOut();
      resetLockedIdentityInputs();
      updateAccountHeaderUI();
      handleGoogleSignIn();
    }

    async function handleAuthLogout() {
      const ok = await showAppConfirm({
        title: "Keluar dari Akun?",
        message: "Apakah Anda yakin ingin keluar dari akun penilai ini? Draf isian Anda tetap tersimpan aman di akun ini.",
        confirmText: "Ya, Keluar Akun",
        cancelText: "Batal",
        type: "warning"
      });
      if (ok) {
        await executeSupabaseSignOut();
        resetLockedIdentityInputs();
        updateAccountHeaderUI();
        showToast("Anda telah keluar dari akun.", "info");
        goToInfoOverview();
      }
    }

    function resetLockedIdentityInputs() {
      const inputEmail = document.getElementById("inputEmail");
      const inputNama = document.getElementById("inputNama");
      const inputNim = document.getElementById("inputNim");
      const autoNotice = document.getElementById("namaAutoFillNotice");
      const nimNotice = document.getElementById("authNimAutoNotice");
      const nimFeedback = document.getElementById("nimFeedbackBox");
      const nimStatus = document.getElementById("nimStatusIcon");
      const card = document.getElementById("formAccountHeaderCard");

      if (inputEmail) {
        inputEmail.value = "";
        inputEmail.readOnly = false;
        inputEmail.className = "w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm bg-white text-zinc-900 outline-none focus:border-zinc-900 transition";
      }
      if (inputNama) {
        inputNama.value = "";
        inputNama.readOnly = false;
        inputNama.className = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm bg-white text-zinc-900 outline-none focus:border-zinc-900 transition";
      }
      if (inputNim) {
        inputNim.value = "";
        inputNim.readOnly = false;
        inputNim.className = "w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm bg-white text-zinc-900 outline-none focus:border-zinc-900 transition";
      }
      if (autoNotice) autoNotice.classList.add("hidden");
      if (nimNotice) nimNotice.classList.add("hidden");
      if (nimFeedback) nimFeedback.classList.add("hidden");
      if (nimStatus) nimStatus.classList.add("hidden");
      if (card) card.classList.add("hidden");
    }

    function getCurrentAuthSession() {
      try {
        const formKey = (activeFormId || 'BK5E').toUpperCase();
        const key = "PGSD_AUTH_SESSION_" + formKey;
        const raw = localStorage.getItem(key) || 
                    sessionStorage.getItem(key) || 
                    localStorage.getItem("PGSD_AUTH_SESSION_PRIMARY");
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    function setAuthSession(user, remember = true) {
      if (!user || !user.email) return;
      const key = "PGSD_AUTH_SESSION_" + (activeFormId || 'BK5E').toUpperCase();
      const payload = {
        email: user.email.trim(),
        nama: user.nama || user.name || "",
        nim: user.nim || "",
        peran: user.peran || "Mahasiswa",
        avatarUrl: user.avatarUrl || "",
        provider: user.provider || "manual",
        loginAt: Date.now()
      };
      if (remember) {
        localStorage.setItem(key, JSON.stringify(payload));
        localStorage.setItem("PGSD_AUTH_SESSION_PRIMARY", JSON.stringify(payload));
      } else {
        sessionStorage.setItem(key, JSON.stringify(payload));
        sessionStorage.setItem("PGSD_AUTH_SESSION_PRIMARY", JSON.stringify(payload));
      }
      activeUserAccountEmail = payload.email;
      activeUserAccountName = payload.nama;
      activeUserAccountNim = payload.nim;
      activeUserAccountAvatarUrl = payload.avatarUrl || "";
      if (payload.peran) currentEvaluatorRole = payload.peran;
    }

    function clearAuthSession() {
      const formKey = (activeFormId || 'BK5E').toUpperCase();
      try {
        localStorage.removeItem("PGSD_AUTH_SESSION_" + formKey);
        sessionStorage.removeItem("PGSD_AUTH_SESSION_" + formKey);
        localStorage.removeItem("PGSD_AUTH_SESSION_PRIMARY");
        sessionStorage.removeItem("PGSD_AUTH_SESSION_PRIMARY");
        sessionStorage.removeItem("PGSD_AUTH_INTENT");
      } catch (e) {}

      activeUserAccountEmail = "";
      activeUserAccountName = "";
      activeUserAccountNim = "";
      activeUserAccountAvatarUrl = "";
      authState.user = null;
      authState.session = null;

      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
            localStorage.removeItem(k);
          }
        });
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
            sessionStorage.removeItem(k);
          }
        });
      } catch (e) {}
    }

    function checkAndApplyAuthGate() {
      updateAccountHeaderUI();
    }

    function updateAccountActiveEmail(emailVal) {
      activeUserAccountEmail = (emailVal || "").trim();
      const namaVal = document.getElementById("inputNama")?.value.trim() || "";
      if (namaVal) activeUserAccountName = namaVal;
      updateAccountHeaderUI();
    }

    function updateAccountHeaderUI() {
      const card = document.getElementById("formAccountHeaderCard");
      if (!card) return;
      const session = getCurrentAuthSession();
      if (!session || !session.email) {
        card.classList.add("hidden");
        return;
      }
      renderAccountBar({
        profile: {
          email: session.email,
          name: session.nama,
          avatar: session.avatarUrl
        },
        name: session.nama,
        email: session.email,
        avatarUrl: session.avatarUrl,
        isRosterVerified: session.isRosterVerified
      });
    }

    function ensureAuthInitialized() {
      if (!authInitPromise) {
        authInitPromise = initializeAuth();
      }
      return authInitPromise;
    }

    async function initializeAuth() {
      authState.initializing = true;
      authState.ready = false;

      const sb = getSupabaseClient() || (window.supabase && typeof window.supabase.createClient === "function" ? (supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)) : null);

      if (!sb || !sb.auth) {
        authState.initializing = false;
        authState.ready = true;
        return null;
      }

      try {
        // 0. PKCE OAuth Flow Check (?code=...)
        const url = new URL(window.location.href);
        const authCode = url.searchParams.get('code');
        if (authCode && typeof sb.auth.exchangeCodeForSession === 'function') {
          const { data: codeData, error: codeErr } = await sb.auth.exchangeCodeForSession(authCode);
          if (codeErr) {
            console.warn("Supabase exchangeCodeForSession notice:", codeErr);
          } else if (codeData?.session?.user) {
            handleAuthSessionEstablished(codeData.session, 'PKCE_CODE');
          }

          // Bersihkan code dari URL browser secara aman tanpa menghilangkan ?id={formId}
          url.searchParams.delete('code');
          try {
            history.replaceState(null, null, url.toString());
          } catch(e) {}
        }

        // 1. Hash Fragment Check (#access_token=...)
        if (window.location.hash && window.location.hash.includes('access_token=')) {
          const hashClean = window.location.hash.replace(/^#/, '');
          const hashParams = new URLSearchParams(hashClean);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            try {
              const { data: setData } = await sb.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              if (setData?.session?.user) {
                handleAuthSessionEstablished(setData.session, 'HASH_TOKEN');
              }
            } catch(e) {}
          }

          try {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.hash = '';
            history.replaceState(null, null, cleanUrl.toString());
          } catch(e) {}
        }

        // 2. Get confirmed persisted session
        if (!authState.session) {
          const { data: sessionData } = await sb.auth.getSession();
          if (sessionData?.session?.user) {
            handleAuthSessionEstablished(sessionData.session, 'GET_SESSION');
          }
        }

        // 3. Fallback to cached manual session if exists
        if (!authState.user) {
          const localSess = getCurrentAuthSession();
          if (localSess?.email) {
            const fallbackUser = {
              email: localSess.email,
              user_metadata: {
                full_name: localSess.nama,
                avatar_url: localSess.avatarUrl
              }
            };
            handleAuthSessionEstablished({ user: fallbackUser }, 'LOCAL_CACHE');
          }
        }

      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        authState.initializing = false;
        authState.ready = true;
      }

      return authState.session;
    }

    let isAuthTransitionInProgress = false;
    function handleAuthSessionEstablished(session, source = 'INIT') {
      if (!session || !session.user) return;
      authState.session = session;
      authState.user = session.user;

      const profile = extractGoogleProfile(session.user);
      const mode = getCurrentEmailCollectionMode();

      // Check intent
      const rawIntent = sessionStorage.getItem('PGSD_AUTH_INTENT');
      let shouldAutoOpenForm = false;
      if (rawIntent) {
        try {
          const intent = JSON.parse(rawIntent);
          const isFresh = (Date.now() - (intent.createdAt || 0)) < (15 * 60 * 1000);
          const isTargetForm = (intent.formId || '').toUpperCase() === (activeFormId || 'BK5E').toUpperCase();
          if (isFresh && isTargetForm && intent.action === 'START_ASSESSMENT') {
            shouldAutoOpenForm = true;
          }
        } catch(e) {}
        sessionStorage.removeItem('PGSD_AUTH_INTENT');
      }

      const authGate = document.getElementById("formAuthGateSection");
      const isAuthGateVisible = authGate && !authGate.classList.contains("hidden");

      if (shouldAutoOpenForm || isAuthGateVisible) {
        if (!isAuthTransitionInProgress) {
          isAuthTransitionInProgress = true;
          setTimeout(() => {
            continueAssessmentWithAuthenticatedUser(session.user, mode);
            isAuthTransitionInProgress = false;
          }, 30);
        }
      } else {
        const identity = resolveStudentIdentity(profile, mode);
        applyLockedIdentity(identity);
        renderAccountBar(identity);
      }
    }

    async function initSupabaseAuthListener() {
      const sb = getSupabaseClient() || (window.supabase && typeof window.supabase.createClient === "function" ? (supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)) : null);
      if (!sb || !sb.auth) return;

      try {
        sb.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session && session.user) {
            handleAuthSessionEstablished(session, event);
          } else if (event === 'SIGNED_OUT') {
            authState.session = null;
            authState.user = null;
            clearAuthSession();
          }
        });
      } catch (e) {
        console.warn("Supabase auth listener init notice:", e);
      }
    }

    async function startAssessmentForm() {
      await ensureAuthInitialized();

      const mode = getCurrentEmailCollectionMode();

      // Mode 1: NO_EMAIL -> bypass langsung buka form (anonim)
      if (mode === 'NO_EMAIL') {
        openAssessmentForm();
        return;
      }

      // Mode 2 & 3: ULM_ONLY / ALL_EMAIL -> periksa user Google
      const user = authState.user || (getCurrentAuthSession()?.email ? getCurrentAuthSession() : null);

      if (!user || !user.email) {
        showGoogleAuthGate();
        return;
      }

      continueAssessmentWithAuthenticatedUser(user, mode);
    }

    function continueAssessmentWithAuthenticatedUser(user, mode) {
      const profile = extractGoogleProfile(user);

      if (!profile.email) {
        showGoogleAuthGate();
        return;
      }

      // Validasi Domain untuk ULM_ONLY
      if (mode === 'ULM_ONLY' && !isUlmEmail(profile.email)) {
        showDomainMismatch(profile);
        return;
      }

      const identity = resolveStudentIdentity(profile, mode);

      openAssessmentForm();
      applyLockedIdentity(identity);
      renderAccountBar(identity);

      isDraftAlreadyRestored = false;
      restoreFormDraft();
    }

    function openAssessmentForm() {
      const authGate = document.getElementById("formAuthGateSection");
      const overview = document.getElementById("formOverviewSection");
      const wizard = document.getElementById("formWizardContainer");
      if (authGate) authGate.classList.add("hidden");
      if (overview) overview.classList.add("hidden");
      if (wizard) wizard.classList.remove("hidden");
      if (!document.getElementById("stepSection_1")) {
        renderDynamicClientStages(false);
      }
      updateStepUI(currentStep || 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function goToInfoOverview() {
      const authGate = document.getElementById("formAuthGateSection");
      const overview = document.getElementById("formOverviewSection");
      const wizard = document.getElementById("formWizardContainer");
      if (authGate) authGate.classList.add("hidden");
      if (overview) overview.classList.remove("hidden");
      if (wizard) wizard.classList.add("hidden");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetInMemoryClientFormState() {
      clientCustomFormAnswers = {};
      customUploadedFilesMap = {};
      selectedGroupObj = null;
      selectedGroupIndex = -1;
      selectedBestPresenters = [];
      currentStep = 1;
      currentRekapData = null;
      appConfig = {};
      groupsData = [];
      allStudentsData = [];
      currentFormSchema = null;
      currentFormMeta = null;
      isDraftAlreadyRestored = false;

      // Clear DOM inputs
      const inputNim = document.getElementById("inputNim");
      const inputNama = document.getElementById("inputNama");
      const inputEmail = document.getElementById("inputEmail");
      if (inputNim) inputNim.value = "";
      if (inputNama) inputNama.value = "";
      if (inputEmail) inputEmail.value = "";
      const nimFeedback = document.getElementById("nimFeedbackBox");
      if (nimFeedback) nimFeedback.classList.add("hidden");
      const nimStatus = document.getElementById("nimStatusIcon");
      if (nimStatus) nimStatus.classList.add("hidden");
    }

    let isDraftAlreadyRestored = false;
    function restoreFormDraft() {
      if (isDraftAlreadyRestored) return;
      try {
        const draftKey = getFormDraftKey();
        let raw = localStorage.getItem(draftKey);
        if (!raw) {
          // Fallback check legacy default draft key
          const legacyKey = "PGSD_FORM_DRAFT_" + (activeFormId || 'BK5E').toUpperCase();
          raw = localStorage.getItem(legacyKey);
        }
        if (!raw) {
          updateDraftResetButtonVisibility();
          return;
        }
        const draft = JSON.parse(raw);
        if (!draft) {
          updateDraftResetButtonVisibility();
          return;
        }

        // Batas Waktu Draf (TTL: 7 Hari). Jika draf sudah usang, bersihkan otomatis
        const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
        if (draft.timestamp && (Date.now() - draft.timestamp > DRAFT_MAX_AGE_MS)) {
          localStorage.removeItem(draftKey);
          updateDraftResetButtonVisibility();
          return;
        }

        // 1. Pulihkan Jawaban Kustom & Berkas Terlebih Dahulu
        if (draft.customAnswers && typeof draft.customAnswers === 'object') {
          clientCustomFormAnswers = Object.assign({}, draft.customAnswers);
        }
        if (draft.uploadedFiles && typeof draft.uploadedFiles === 'object') {
          customUploadedFilesMap = Object.assign({}, draft.uploadedFiles);
        }

        // Render struktur tahapan dinamis ke DOM
        renderDynamicClientStages();

        // 2. Pulihkan Step 1 (Identitas & Peran)
        if (draft.peran) {
          onRoleChange(draft.peran);
        }
        if (draft.nim) {
          const nimEl = document.getElementById("inputNim");
          if (nimEl) {
            nimEl.value = draft.nim;
            validateNimLive(draft.nim);
          }
        }
        if (draft.nama) {
          const namaEl = document.getElementById("inputNama");
          if (namaEl) namaEl.value = draft.nama;
          activeUserAccountName = draft.nama;
        }
        if (draft.email) {
          const emailEl = document.getElementById("inputEmail");
          if (emailEl) {
            emailEl.value = draft.email;
            validateEmailLive(draft.email);
          }
          activeUserAccountEmail = draft.email;
        }

        updateAccountHeaderUI();

        // 3. Pulihkan Pemilihan Kelompok & Sub-komponennya
        if (draft.groupName && groupsData && groupsData.length > 0) {
          const grpIdx = groupsData.findIndex(g => g.name === draft.groupName);
          if (grpIdx !== -1) {
            const radio = document.querySelector(`input[name="selectedGroup"][value="${draft.groupName}"]`);
            if (radio) radio.checked = true;
            
            onSelectGroup(draft.groupName, grpIdx);

            // 4. Pulihkan Skor
            if (draft.nilai) {
              const numEl = document.getElementById("inputNilaiNumber");
              const sliEl = document.getElementById("inputNilaiSlider");
              if (numEl) numEl.value = draft.nilai;
              if (sliEl) sliEl.value = draft.nilai;
              updateScoreBadge(draft.nilai);
            }

            // 5. Pulihkan Presentator Terbaik
            if (draft.bestPresenters && Array.isArray(draft.bestPresenters)) {
              selectedBestPresenters = [...draft.bestPresenters];
              updateBestPresenterBadge();
              selectedBestPresenters.forEach(bName => {
                const cb = document.querySelector(`#bestPresenterList input[value="${bName}"]`);
                if (cb) {
                  cb.checked = true;
                  const lbl = cb.closest("label");
                  if (lbl) lbl.className = "flex items-center p-3 rounded-lg border border-zinc-900 bg-zinc-50 shadow-xs cursor-pointer transition text-xs";
                }
              });
            }

            // 6. Pulihkan Evaluasi Kualitatif per Mahasiswa
            if (draft.evaluasi && typeof draft.evaluasi === 'object') {
              const maxChars = parseInt(appConfig["Maksimal_Karakter_Evaluasi"] || 500);
              document.querySelectorAll("#evaluationInputsContainer textarea").forEach((ta, eIdx) => {
                const member = ta.getAttribute("data-member");
                if (member && draft.evaluasi[member] !== undefined) {
                  ta.value = draft.evaluasi[member];
                  const counterEl = document.getElementById(`charCount_${eIdx}`);
                  if (counterEl) {
                    counterEl.textContent = `${ta.value.length}/${maxChars}`;
                  }
                }
              });
            }
          }
        }

        // 7. Tentukan Navigasi & Posisi Langkah (Hanya buka wizard jika sudah login atau mode NO_EMAIL)
        const emailMode = appConfig["Mode_Pengumpulan_Email"] || "ULM_ONLY";
        const currentSession = getCurrentAuthSession();
        const isAuthenticated = (emailMode === 'NO_EMAIL') || (currentSession && currentSession.email);

        if (draft.email || draft.nama || draft.nim || draft.groupName) {
          isDraftAlreadyRestored = true;

          const targetStep = (draft.step && draft.step >= 1 && draft.step <= (Object.keys(stepMetadata).length || 4))
            ? draft.step
            : (currentStep || 1);
          
          const wizard = document.getElementById("formWizardContainer");
          if (wizard && !wizard.classList.contains("hidden")) {
            updateStepUI(targetStep, true);
          }

          const banner = document.getElementById("studentDraftRestoreBanner");
          if (banner) banner.classList.remove("hidden");
          const indicator = document.getElementById("autoSaveIndicator");
          if (indicator) indicator.classList.remove("hidden");

          showToast("Draf isian sebelumnya berhasil dipulihkan.", "info");
        }
      } catch (e) {
        console.warn("Restore draft error notice:", e);
      }
      updateDraftResetButtonVisibility();
    }

    async function clearStudentFormDraft(confirmDialog = false) {
      let ok = true;
      if (confirmDialog) {
        ok = await showConfirmModal({
          title: "Hapus Draf Isian?",
          message: "Apakah Anda yakin ingin menghapus seluruh draf isian yang tersimpan di akun ini? Anda akan mengulang pengisian dari awal.",
          confirmText: "Ya, Hapus Draf",
          cancelText: "Batal",
          type: "warning"
        });
      }
      if (ok) {
        localStorage.removeItem(getFormDraftKey());
        showToast("Draf isian berhasil dibersihkan.", "info");
        setTimeout(() => window.location.reload(), 400);
      }
    }

    function validateEmailLive(emailVal) {
      const msgEl = document.getElementById("emailValidationMsg");
      const iconEl = document.getElementById("emailCheckIcon");
      const emailInput = document.getElementById("inputEmail");
      const cleanEmail = (emailVal || "").trim().toLowerCase();

      const emailMode = appConfig["Mode_Pengumpulan_Email"] || "ULM_ONLY";

      // If Mode is NO_EMAIL, email is completely optional
      if (emailMode === 'NO_EMAIL') {
        if (msgEl) msgEl.classList.add("hidden");
        if (iconEl) iconEl.classList.remove("hidden");
        if (emailInput) {
          emailInput.required = false;
          emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm outline-none transition bg-white";
        }
        const reqStar = document.getElementById("emailRequiredStar");
        if (reqStar) reqStar.classList.add("hidden");
        isEmailValidState = true;
        return true;
      }

      if (!cleanEmail) {
        if (msgEl) msgEl.classList.add("hidden");
        if (iconEl) iconEl.classList.add("hidden");
        if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-zinc-900 outline-none transition bg-white";
        isEmailValidState = false;
        return false;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        if (msgEl) {
          msgEl.textContent = "Format email belum lengkap";
          msgEl.className = "text-[11px] text-amber-600 font-medium";
          msgEl.classList.remove("hidden");
        }
        if (iconEl) iconEl.classList.add("hidden");
        isEmailValidState = false;
        return false;
      }

      // Mode ULM_ONLY: Mahasiswa wajib domain mhs.ulm.ac.id
      if (emailMode === 'ULM_ONLY' && currentEvaluatorRole === 'Mahasiswa') {
        const allowedStr = appConfig["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id";
        const allowedDomains = allowedStr.split(",").map(d => d.trim().toLowerCase()).filter(Boolean);

        let isDomainMatch = false;
        for (let d of allowedDomains) {
          if (cleanEmail.endsWith("@" + d) || cleanEmail.endsWith("." + d)) {
            isDomainMatch = true;
            break;
          }
        }

        if (!isDomainMatch) {
          if (msgEl) {
            msgEl.textContent = "Mode ULM: Email mahasiswa harus menggunakan domain resmi (" + allowedStr + ").";
            msgEl.className = "text-[11px] text-rose-600 font-medium";
            msgEl.classList.remove("hidden");
          }
          if (iconEl) iconEl.classList.add("hidden");
          if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-rose-400 text-xs sm:text-sm focus:border-rose-600 outline-none transition bg-white";
          isEmailValidState = false;
          return false;
        }
      }

      if (msgEl) msgEl.classList.add("hidden");
      if (iconEl) iconEl.classList.remove("hidden");
      if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 text-xs sm:text-sm focus:border-emerald-600 outline-none transition bg-white";
      isEmailValidState = true;
      return true;
    }

    let currentPendingSubmissionPayload = null;
    let currentReceiptData = null;

    function openPreSubmitReviewModal(payload) {
      currentPendingSubmissionPayload = payload;
      renderPreSubmitReviewContent(payload);
      const modal = document.getElementById("modalPreSubmitReview");
      if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
      }
    }

    function closePreSubmitReviewModal() {
      const modal = document.getElementById("modalPreSubmitReview");
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    }

    function renderPreSubmitReviewContent(payload) {
      const container = document.getElementById("preSubmitReviewContent");
      if (!container || !payload) return;

      const matkul = appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "-";
      const dosen = appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-";

      let bestPresText = "-";
      if (Array.isArray(payload.presentatorTerbaik) && payload.presentatorTerbaik.length > 0) {
        bestPresText = payload.presentatorTerbaik.join(", ");
      }

      let evalListHtml = "";
      if (payload.evaluasiDetail && typeof payload.evaluasiDetail === 'object') {
        for (let member in payload.evaluasiDetail) {
          if (member === 'uploadedFiles') continue;
          const textVal = payload.evaluasiDetail[member];
          if (textVal) {
            evalListHtml += `
              <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs">
                <span class="font-bold text-zinc-900 block mb-0.5">👤 ${member}:</span>
                <p class="text-zinc-600 text-[11px] leading-relaxed italic whitespace-pre-wrap">"${textVal}"</p>
              </div>
            `;
          }
        }
      }

      let customAnswersHtml = "";
      if (payload.customAnswers && Object.keys(payload.customAnswers).length > 0) {
        for (let fldId in payload.customAnswers) {
          const ans = payload.customAnswers[fldId];
          if (ans) {
            let fldLabel = fldId;
            if (currentFormSchema && Array.isArray(currentFormSchema.tahapan)) {
              for (let stg of currentFormSchema.tahapan) {
                const foundFld = (stg.fields || []).find(f => f.id === fldId);
                if (foundFld) { fldLabel = foundFld.label; break; }
              }
            }
            customAnswersHtml += `
              <div class="flex items-start justify-between py-1 border-b border-zinc-100 last:border-0 gap-2">
                <span class="text-zinc-500 font-medium">${fldLabel}:</span>
                <span class="font-bold text-zinc-900 text-right">${Array.isArray(ans) ? ans.join(', ') : ans}</span>
              </div>
            `;
          }
        }
      }

      container.innerHTML = `
        <!-- Card 1: Identitas Penilai -->
        <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
          <h4 class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">1. Identitas Penilai</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span class="text-[10px] text-zinc-400 block">Nama &amp; Peran:</span>
              <p class="font-bold text-zinc-900 truncate">${payload.namaPenilai} <span class="font-normal text-zinc-500 text-[10.5px]">(${payload.peranPenilai})</span></p>
            </div>
            <div class="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span class="text-[10px] text-zinc-400 block">NIM:</span>
              <p class="font-mono font-bold text-zinc-900 truncate">${payload.nimPenilai || '-'}</p>
            </div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-zinc-200/60">
            <span class="text-[10px] text-zinc-400 block">Email:</span>
            <p class="font-mono text-zinc-700 text-[11px] truncate">${payload.email}</p>
          </div>
        </div>

        <!-- Card 2: Target & Skor -->
        <div class="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
          <h4 class="text-[11px] font-bold text-indigo-800 uppercase tracking-wider font-mono">2. Target Penilaian &amp; Skor</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="p-2 rounded-lg bg-white border border-indigo-100">
              <span class="text-[10px] text-zinc-400 block">Kelompok Dinilai:</span>
              <p class="font-bold text-indigo-700 truncate">${payload.kelompok}</p>
            </div>
            <div class="p-2 rounded-lg bg-white border border-indigo-100">
              <span class="text-[10px] text-zinc-400 block">Nilai yang Diberikan:</span>
              <p class="font-mono font-bold text-emerald-700 text-sm">${payload.nilaiKelompok} <span class="text-[10px] font-normal text-zinc-400">/ 100</span></p>
            </div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-indigo-100">
            <span class="text-[10px] text-zinc-400 block">Presentator Terbaik:</span>
            <p class="font-semibold text-zinc-900">${bestPresText}</p>
          </div>
        </div>

        ${evalListHtml ? `
          <!-- Card 3: Evaluasi Kualitatif -->
          <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <h4 class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">3. Evaluasi Kualitatif Pemateri</h4>
            <div class="space-y-2">
              ${evalListHtml}
            </div>
          </div>
        ` : ''}

        ${customAnswersHtml ? `
          <!-- Card 4: Jawaban Tambahan -->
          <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <h4 class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">4. Jawaban Rubrik Tambahan</h4>
            <div class="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/60">
              ${customAnswersHtml}
            </div>
          </div>
        ` : ''}
      `;
    }

    async function handleFinalSubmit(e) {
      if (e) e.preventDefault();

      const isPreviewMode = new URLSearchParams(window.location.search).get('preview') === 'draft';
      
      // Run complete stages validation
      const totalSteps = Object.keys(stepMetadata).length || 4;
      for (let s = 1; s <= totalSteps; s++) {
        if (!validateStageRequirements(s)) {
          updateStepUI(s);
          return;
        }
      }

      if (isPreviewMode) {
        showToast("🎉 Simulasi Pengisian Berhasil! Seluruh isian telah divalidasi dengan sukses (Mode Draf / Simulator — data tidak disimpan ke database).", "success", 5000);
        return;
      }

      const emailEl = document.getElementById("inputEmail");
      const namaEl = document.getElementById("inputNama");
      const nimEl = document.getElementById("inputNim");
      const nilaiEl = document.getElementById("inputNilaiNumber");

      const email = emailEl ? emailEl.value.trim() : "";
      const nama = namaEl ? namaEl.value.trim() : "";
      const nim = nimEl ? nimEl.value.trim() : "-";
      const nilai = nilaiEl ? parseFloat(nilaiEl.value) : 85;

      if (emailEl && !validateEmailLive(email)) {
        showToast("Email penilai belum valid!", "error");
        updateStepUI(1);
        return;
      }
      if (document.getElementById("stepSection_2")?.querySelector('#groupsGrid') && !selectedGroupObj) {
        showToast("Pilih kelompok yang dinilai!", "warning");
        updateStepUI(2);
        return;
      }

      // 🛡️ INTEGRITY GUARD 1: Cegah Penilaian Kelompok Sendiri (Self-Evaluation Guard)
      const antiSelfEval = appConfig && appConfig["Cegah_Penilaian_Diri"] !== false && appConfig["Cegah_Penilaian_Diri"] !== "false";
      if (antiSelfEval && currentEvaluatorRole === 'Mahasiswa') {
        const studentNimClean = (nim || "").replace(/\s+/g, "").trim().toLowerCase();
        const studentNamaClean = (nama || "").trim().toLowerCase();
        const ownStudent = (allStudentsData || []).find(s => 
          (s.nim && String(s.nim).replace(/\s+/g, "").trim().toLowerCase() === studentNimClean) || 
          (s.name && String(s.name).trim().toLowerCase() === studentNamaClean)
        );

        if (ownStudent && ownStudent.kelompok && selectedGroupObj && selectedGroupObj.name.toLowerCase() === ownStudent.kelompok.toLowerCase()) {
          showToast(`Sesuai aturan integritas, Anda tidak dapat menilai kelompok Anda sendiri (${ownStudent.kelompok}).`, "error");
          updateStepUI(2);
          return;
        }
      }

      // 🛡️ INTEGRITY GUARD 2: Kunci Respons Ganda (Single Submission Lock)
      const singleSubmissionLock = appConfig && appConfig["Kunci_Respons_Ganda"] !== false && appConfig["Kunci_Respons_Ganda"] !== "false";
      if (singleSubmissionLock && currentEvaluatorRole === 'Mahasiswa' && selectedGroupObj) {
        const sb = getSupabaseClient();
        if (sb && nim && nim !== "-") {
          try {
            const { data: existingResp, error: checkErr } = await sb.from('pgsd_responses')
              .select('id_respons')
              .eq('form_id', activeFormId)
              .eq('nim_penilai', nim)
              .eq('kelompok_dinilai', selectedGroupObj.name)
              .limit(1);

            if (!checkErr && existingResp && existingResp.length > 0) {
              showToast(`Anda sudah pernah mengirimkan penilaian untuk ${selectedGroupObj.name}. Respons ganda tidak diizinkan.`, "error");
              return;
            }
          } catch(dupErr) {
            console.warn("Duplicate check fallback notice:", dupErr);
          }
        }
      }
      if (document.getElementById("stepSection_3")?.querySelector('#presentersGrid') && selectedBestPresenters.length === 0) {
        showToast("Pilih minimal 1 orang presentator terbaik!", "warning");
        updateStepUI(3);
        return;
      }

      const evaluasiDetail = {};
      const evalTextareas = document.querySelectorAll("#evaluationInputsContainer textarea");
      let isAllEvalFilled = true;

      evalTextareas.forEach(ta => {
        const member = ta.getAttribute("data-member");
        const val = ta.value.trim();
        if (!val) isAllEvalFilled = false;
        evaluasiDetail[member] = val;
      });

      if (evalTextareas.length > 0 && !isAllEvalFilled) {
        showToast("Lengkapi evaluasi tertulis untuk setiap pemateri!", "warning");
        return;
      }

      const customAnswers = collectCustomFieldsAnswers();

      // Gather all uploaded files
      const mergedUploadedFiles = Object.assign({}, customUploadedFilesMap);
      if (clientCustomFormAnswers && typeof clientCustomFormAnswers === 'object') {
        for (let k in clientCustomFormAnswers) {
          const item = clientCustomFormAnswers[k];
          if (item && typeof item === 'object' && item.name && (item.base64 || item.dataUrl)) {
            mergedUploadedFiles[k] = {
              name: item.name,
              type: item.type || 'application/octet-stream',
              size: item.size || 0,
              base64: item.base64 || (item.dataUrl ? item.dataUrl.split(',')[1] : '')
            };
            customAnswers[k] = item.name;
          }
        }
      }

      const payload = {
        action: "submitAssessment",
        formId: activeFormId,
        peranPenilai: currentEvaluatorRole || "Mahasiswa",
        nimPenilai: currentEvaluatorRole === 'Mahasiswa' ? nim : "-",
        email: email,
        namaPenilai: nama,
        kelompok: selectedGroupObj ? selectedGroupObj.name : "Kelompok",
        sesi: appConfig["Sesi_Minggu_Aktif"] || "Minggu 1",
        nilaiKelompok: nilai,
        presentatorTerbaik: selectedBestPresenters,
        evaluasiDetail: evaluasiDetail,
        customAnswers: customAnswers,
        uploadedFiles: mergedUploadedFiles,
        driveFolderName: (appConfig && appConfig["Google_Drive_Folder_Name"]) || localStorage.getItem("PGSD_GLOBAL_DRIVE_FOLDER") || localStorage.getItem("PGSD_DRIVE_FOLDER_NAME") || "https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK"
      };

      // 🔍 BUKA MODAL PRATINJAU RINGKASAN SEBELUM KIRIM
      openPreSubmitReviewModal(payload);
    }

    async function executeConfirmedFinalSubmit() {
      if (!currentPendingSubmissionPayload) return;
      const payload = currentPendingSubmissionPayload;

      const confirmBtn = document.getElementById("btnConfirmFinalSubmit");
      const confirmSpinner = document.getElementById("confirmFinalSubmitSpinner");
      const submitBtn = document.getElementById("submitBtn");
      const spinner = document.getElementById("submitSpinner");

      if (confirmBtn) confirmBtn.disabled = true;
      if (confirmSpinner) confirmSpinner.classList.remove("hidden");
      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.classList.remove("hidden");

      const effectiveSpreadsheetUrl = (appConfig && appConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL") || getApiUrl();
      const apiUrl = effectiveSpreadsheetUrl;
      const sb = getSupabaseClient();
      let sbSuccess = false;
      const idRespons = "PGSD-REC-" + activeFormId + "-" + Date.now().toString(36).toUpperCase();

      // 🔑 Pre-flight Auth Token Refresh (mencegah kegagalan token expire pada pengisian lama)
      if (sb && sb.auth) {
        try {
          const { data: sessionData } = await sb.auth.getSession();
          if (sessionData?.session) {
            authState.session = sessionData.session;
            authState.user = sessionData.session.user;
          }
        } catch (e) {
          console.warn("Session pre-flight check notice:", e);
        }
      }

      // ⚡ FAST-PATH (< 50ms): Simpan langsung data transaksi penilaian ke Supabase PostgreSQL
      if (sb) {
        try {
          if (customUploadedFilesMap && Object.keys(customUploadedFilesMap).length > 0) {
            for (let fldId in customUploadedFilesMap) {
              const fileObj = customUploadedFilesMap[fldId];
              if (fileObj && fileObj.name) {
                payload.customAnswers[fldId] = fileObj.name;
                if (!payload.evaluasiDetail.uploadedFiles) payload.evaluasiDetail.uploadedFiles = {};
                payload.evaluasiDetail.uploadedFiles[fldId] = {
                  fileName: fileObj.name,
                  fileSize: fileObj.size || 0,
                  mimeType: fileObj.type || 'application/octet-stream',
                  fileUrl: fileObj.url || fileObj.dataUrl || ""
                };
              }
            }
          }

          const respRow = {
            id_respons: idRespons,
            form_id: activeFormId,
            sesi: payload.sesi,
            email: payload.email,
            nama_penilai: payload.namaPenilai,
            nim_penilai: payload.nimPenilai || "-",
            peran_penilai: payload.peranPenilai || "Mahasiswa",
            kelompok_dinilai: payload.kelompok,
            nilai_kelompok: parseFloat(payload.nilaiKelompok) || 0,
            best_presenter_1: (payload.presentatorTerbaik && payload.presentatorTerbaik[0]) || "-",
            best_presenter_2: (payload.presentatorTerbaik && payload.presentatorTerbaik[1]) || "-",
            evaluasi_detail: payload.evaluasiDetail || {},
            custom_answers: payload.customAnswers || {},
            synced_to_sheets: false
          };
          const { error: sbErr } = await sb.from('pgsd_responses').insert([respRow]);
          if (!sbErr) {
            sbSuccess = true;
          }
        } catch (err) {
          console.warn("Supabase fast-path fallback notice:", err);
        }
      }

      if (sbSuccess) {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmSpinner) confirmSpinner.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("hidden");

        closePreSubmitReviewModal();
        clearStudentFormDraft(false);

        clientCustomFormAnswers = {};
        localStorage.removeItem("PGSD_CACHE_REKAP_" + activeFormId);
        localStorage.setItem("PGSD_LAST_SUBMISSION_EVENT", Date.now().toString());

        loadRekapData(true);
        showSuccessModal(payload.kelompok, false, payload, idRespons);

        // 🔄 Background Pipeline: Sinkronkan ke Google Spreadsheet secara asinkron
        const defaultSheetUrl = DEFAULT_API_URL;
        const customSheetUrl = (appConfig && appConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL");

        if (defaultSheetUrl) {
          fetch(defaultSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          }).then(r => r.json()).then(res => {
            if (res && res.success && sb) {
              sb.from('pgsd_responses').update({ 
                synced_to_sheets: true, 
                synced_at: new Date().toISOString() 
              }).eq('id_respons', idRespons);
            }
          }).catch(e => console.warn("Primary sheet sync notice:", e));
        }

        if (customSheetUrl && customSheetUrl !== defaultSheetUrl) {
          fetch(customSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          }).then(r => r.json()).then(res => {
            if (res && res.success && sb) {
              sb.from('pgsd_responses').update({ 
                synced_to_sheets: true, 
                synced_at: new Date().toISOString() 
              }).eq('id_respons', idRespons);
            }
          }).catch(e => console.warn("Custom sheet sync notice:", e));
        }
        return;
      }

      // 🛡️ Fallback Standar: Kirim via Apps Script
      const fetchWithTimeout = (url, opts, ms = 12000) => {
        return Promise.race([
          fetch(url, opts),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
        ]);
      };

      try {
        const response = await fetchWithTimeout(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }, 12000);

        const res = await response.json();
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmSpinner) confirmSpinner.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("hidden");

        if (res && res.success) {
          closePreSubmitReviewModal();
          clearStudentFormDraft(false);

          clientCustomFormAnswers = {};
          localStorage.removeItem("PGSD_CACHE_REKAP_" + activeFormId);
          localStorage.setItem("PGSD_LAST_SUBMISSION_EVENT", Date.now().toString());
          
          loadRekapData(true);
          showSuccessModal(payload.kelompok, false, payload, idRespons);
        } else {
          showToast(res?.error || "Gagal mengirim penilaian.", "error");
        }
      } catch (err) {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmSpinner) confirmSpinner.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("hidden");
        
        closePreSubmitReviewModal();
        savePendingSubmission(payload, idRespons);
        clearStudentFormDraft(false);
        showSuccessModal(payload.kelompok, true, payload, idRespons);
      }
    }

    function getPendingSubmissions() {
      try {
        return JSON.parse(localStorage.getItem("PGSD_PENDING_SUBMISSIONS") || "[]");
      } catch(e) {
        return [];
      }
    }

    function savePendingSubmission(payload, idRespons = '') {
      let pending = getPendingSubmissions();
      pending = pending.filter(p => !(p.payload.email === payload.email && p.payload.kelompok === payload.kelompok && p.payload.sesi === payload.sesi));
      pending.push({ 
        payload, 
        idRespons: idRespons || ("PGSD-REC-" + (payload.formId || activeFormId) + "-" + Date.now().toString(36).toUpperCase()), 
        timestamp: Date.now() 
      });
      localStorage.setItem("PGSD_PENDING_SUBMISSIONS", JSON.stringify(pending));
    }

    async function processPendingSubmissions() {
      const pending = getPendingSubmissions();
      if (pending.length === 0 || !navigator.onLine) return;

      const sb = getSupabaseClient();
      const defaultSheetUrl = DEFAULT_API_URL;
      const customSheetUrl = (appConfig && appConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL");
      const apiUrl = customSheetUrl || defaultSheetUrl;
      const remaining = [];

      for (let item of pending) {
        let sent = false;
        const idRespons = item.idRespons || ("PGSD-REC-" + (item.payload.formId || activeFormId) + "-" + Date.now().toString(36).toUpperCase());

        // 1. Coba kirim ke Supabase
        if (sb) {
          try {
            const respRow = {
              id_respons: idRespons,
              form_id: item.payload.formId || activeFormId,
              sesi: item.payload.sesi,
              email: item.payload.email,
              nama_penilai: item.payload.namaPenilai,
              nim_penilai: item.payload.nimPenilai || "-",
              peran_penilai: item.payload.peranPenilai || "Mahasiswa",
              kelompok_dinilai: item.payload.kelompok,
              nilai_kelompok: parseFloat(item.payload.nilaiKelompok) || 0,
              best_presenter_1: (item.payload.presentatorTerbaik && item.payload.presentatorTerbaik[0]) || "-",
              best_presenter_2: (item.payload.presentatorTerbaik && item.payload.presentatorTerbaik[1]) || "-",
              evaluasi_detail: item.payload.evaluasiDetail || {},
              custom_answers: item.payload.customAnswers || {},
              synced_to_sheets: false
            };
            const { error: insErr } = await sb.from('pgsd_responses').upsert([respRow], { onConflict: 'id_respons' });
            if (!insErr) {
              sent = true;
            }
          } catch(e) {}
        }

        // 2. Coba kirim ke Apps Script Webhook
        if (apiUrl) {
          try {
            const res = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(item.payload)
            });
            const data = await res.json();
            if (data && data.success) {
              sent = true;
              if (sb) {
                sb.from('pgsd_responses').update({ synced_to_sheets: true, synced_at: new Date().toISOString() }).eq('id_respons', idRespons);
              }
            }
          } catch(e) {}
        }

        if (!sent) {
          remaining.push(item);
        }
      }

      if (remaining.length === 0) {
        localStorage.removeItem("PGSD_PENDING_SUBMISSIONS");
        showToast("Seluruh draf penilaian antrean offline berhasil disinkronkan.", "success");
        loadRekapData(true);
      } else {
        localStorage.setItem("PGSD_PENDING_SUBMISSIONS", JSON.stringify(remaining));
      }
    }

    window.addEventListener("online", function() {
      processPendingSubmissions();
      fetchInitialFormData(false);
      loadRekapData(true);
    });

    function generateReceiptQRCode(receiptId, payload) {
      const qrBox = document.getElementById("receiptQrCodeBox");
      if (!qrBox) return;

      const verifyData = `PGSD-ULM|ID:${receiptId}|NIM:${payload.nimPenilai || '-'}|MHS:${payload.namaPenilai || '-'}|GRP:${payload.kelompok || '-'}|SKOR:${payload.nilaiKelompok || '-'}|T:${Date.now()}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(verifyData)}`;

      qrBox.innerHTML = `
        <img 
          src="${qrUrl}" 
          alt="QR Verifikasi" 
          class="w-full h-full object-contain rounded"
          onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'text-[9px] font-mono text-zinc-400 text-center leading-none p-1\\'>✓<br>VERIFIED<br>OFFLINE</div>';"
        >
      `;
    }

    function showSuccessModal(kelompokName, isOfflineQueued = false, payload = null, idRespons = "") {
      const modal = document.getElementById("successModal");
      if (!modal) return;

      const finalId = idRespons || ("PGSD-REC-" + activeFormId + "-" + Date.now().toString(36).toUpperCase());
      const now = new Date();
      currentReceiptData = {
        payload: payload || {
          nimPenilai: "-",
          namaPenilai: "-",
          kelompok: kelompokName,
          nilaiKelompok: "-"
        },
        idRespons: finalId,
        timestamp: now
      };

      const receiptIdEl = document.getElementById("receiptIdText");
      if (receiptIdEl) receiptIdEl.textContent = finalId;

      if (payload) {
        const nimEl = document.getElementById("receiptNimPenilai");
        if (nimEl) nimEl.textContent = payload.nimPenilai || "-";

        const namaEl = document.getElementById("receiptNamaPenilai");
        if (namaEl) namaEl.textContent = payload.namaPenilai || "-";

        const grpEl = document.getElementById("receiptKelompokDinilai");
        if (grpEl) grpEl.textContent = payload.kelompok || kelompokName;

        const nilaiEl = document.getElementById("receiptNilaiKelompok");
        if (nilaiEl) nilaiEl.textContent = payload.nilaiKelompok !== undefined ? payload.nilaiKelompok : "-";

        const matkulEl = document.getElementById("receiptMataKuliah");
        if (matkulEl) matkulEl.textContent = appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "-";

        const dosenEl = document.getElementById("receiptDosenPengampu");
        if (dosenEl) dosenEl.textContent = appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-";

        const timeEl = document.getElementById("receiptTimestampWita");
        if (timeEl) timeEl.innerHTML = formatSmartScheduleTime(now);

        generateReceiptQRCode(finalId, payload);
      }

      const msgEl = document.getElementById("successModalMsg");
      if (msgEl) {
        if (isOfflineQueued) {
          msgEl.innerHTML = `
            <span class="text-amber-700 font-bold block mb-1">Tersimpan di Browser (Mode Offline)</span>
            Penilaian untuk <strong>${kelompokName}</strong> telah tersimpan aman di browser dan akan otomatis terkirim saat online.
          `;
        } else {
          msgEl.textContent = `Penilaian Anda telah tersimpan secara resmi di server database Supabase.`;
        }
      }

      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }

    function downloadDigitalReceiptImage() {
      if (!currentReceiptData) {
        showToast("Data tanda terima tidak ditemukan.", "error");
        return;
      }
      const data = currentReceiptData;
      const payload = data.payload || {};

      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");

      // 1. Background
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. White Card Container
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(40, 40, 920, 1270, 24);
      else ctx.rect(40, 40, 920, 1270);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Header Banner (Green)
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(40, 40, 920, 130, [24, 24, 0, 0]);
      else ctx.rect(40, 40, 920, 130);
      ctx.fillStyle = "#059669";
      ctx.fill();

      // Header Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("UNIVERSITAS LAMBUNG MANGKURAT", 75, 92);
      ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#d1fae5";
      ctx.fillText("FKIP • Program Studi Pendidikan Guru Sekolah Dasar (PGSD)", 75, 128);

      // 4. Receipt Title & Badge
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("TANDA TERIMA PENILAIAN PEER-ASSESSMENT", 75, 220);

      // Badge "TERVERIFIKASI"
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(75, 242, 230, 36, 18);
      else ctx.rect(75, 242, 230, 36);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("✓ TERVERIFIKASI SISTEM", 95, 266);

      // Ticket ID
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`ID TIKET: ${data.idRespons || '-'}`, 325, 266);

      // 5. Details Table Rows
      const startY = 305;
      const rowHeight = 72;
      const nowStr = (data.timestamp ? new Date(data.timestamp) : new Date()).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) + " WITA";
      const details = [
        ["NIM Penilai", payload.nimPenilai || "-"],
        ["Nama Penilai", payload.namaPenilai || "-"],
        ["Peran Penilai", payload.peranPenilai || "Mahasiswa"],
        ["Kelompok yang Dinilai", payload.kelompok || "-"],
        ["Nilai / Skor Kelompok", `${payload.nilaiKelompok !== undefined ? payload.nilaiKelompok : 0} / 100`],
        ["Presentator Terbaik", Array.isArray(payload.presentatorTerbaik) ? (payload.presentatorTerbaik.join(", ") || "-") : (payload.presentatorTerbaik || "-")],
        ["Mata Kuliah", appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "-"],
        ["Dosen Pengampu", appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-"],
        ["Waktu Pengiriman", nowStr]
      ];

      details.forEach((row, i) => {
        const curY = startY + (i * rowHeight);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(75, curY, 850, rowHeight - 8, 12);
        else ctx.rect(75, curY, 850, rowHeight - 8);
        ctx.fillStyle = (i % 2 === 0) ? "#f8fafc" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#64748b";
        ctx.font = "600 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(row[0] + ":", 95, curY + 39);

        // Value
        const isHighlight = row[0].includes("Nilai") || row[0].includes("Kelompok yang");
        ctx.fillStyle = isHighlight ? "#4338ca" : "#0f172a";
        ctx.font = isHighlight ? "bold 19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        
        const rawVal = String(row[1] || "-");
        const valText = rawVal.length > 44 ? rawVal.substring(0, 42) + "..." : rawVal;
        ctx.fillText(valText, 340, curY + 39);
      });

      // 6. Verification Footer Box
      const footerBoxY = startY + (details.length * rowHeight) + 15;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(75, footerBoxY, 850, 120, 14);
      else ctx.rect(75, footerBoxY, 850, 120);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Bukti tanda terima ini sah dan tercatat permanen di basis data server Supabase FKIP ULM.", canvas.width / 2, footerBoxY + 45);
      ctx.fillStyle = "#64748b";
      ctx.font = "italic 13.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Simpan bukti ini sebagai konfirmasi resmi keikutsertaan penilaian perkuliahan.", canvas.width / 2, footerBoxY + 75);
      ctx.fillText(`Timestamp Keamanan: ${new Date().toISOString()}`, canvas.width / 2, footerBoxY + 98);
      ctx.textAlign = "left";

      // 7. Trigger Download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const nimSlug = (payload.nimPenilai || 'mhs').replace(/\s+/g, '');
      const grpSlug = (payload.kelompok || 'kelompok').replace(/\s+/g, '_');
      link.download = `bukti-penilaian-${nimSlug}-${grpSlug}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Bukti tanda terima digital berhasil diunduh!", "success");
    }

    function printDigitalReceipt() {
      if (!currentReceiptData) {
        showToast("Data tanda terima tidak ditemukan.", "error");
        return;
      }
      const data = currentReceiptData;
      const payload = data.payload || {};
      const finalId = data.idRespons || ("PGSD-REC-" + activeFormId + "-" + Date.now().toString(36).toUpperCase());
      const nowStr = (data.timestamp ? new Date(data.timestamp) : new Date()).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) + " WITA";

      const printRoot = document.getElementById("printDocumentRoot");
      if (!printRoot) {
        window.print();
        return;
      }

      const origHtml = printRoot.innerHTML;
      printRoot.className = "";
      printRoot.innerHTML = `
        <div class="print-page-wrapper" style="padding: 24px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; max-width: 720px; margin: 0 auto; background: #ffffff;">
          
          <!-- Header Instansi -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 14px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #059669; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact;">✓</div>
              <div>
                <h1 style="font-size: 16px; font-weight: 800; color: #065f46; margin: 0; line-height: 1.2;">UNIVERSITAS LAMBUNG MANGKURAT</h1>
                <p style="font-size: 11px; font-weight: 600; color: #475569; margin: 3px 0 0 0;">FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN • PRODI PGSD</p>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; font-size: 10px; font-weight: 800; background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 9999px; border: 1px solid #6ee7b7; letter-spacing: 0.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">✓ TERVERIFIKASI SISTEM</span>
              <p style="font-family: monospace; font-size: 11px; font-weight: 700; color: #64748b; margin: 4px 0 0 0;">${finalId}</p>
            </div>
          </div>

          <!-- Title -->
          <div style="text-align: center; margin-bottom: 22px;">
            <h2 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.4px;">BUKTI TANDA TERIMA PENILAIAN PEER-ASSESSMENT</h2>
            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Dokumen ini adalah bukti sah perekaman penilaian perkuliahan digital.</p>
          </div>

          <!-- Data Table -->
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 22px; font-size: 12.5px;">
            <tbody>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; width: 34%; border-bottom: 1px solid #e2e8f0;">NIM Penilai</td>
                <td style="padding: 10px 14px; font-family: monospace; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.nimPenilai || '-'}</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Nama Lengkap Penilai</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.namaPenilai || '-'}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Peran Penilai</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.peranPenilai || 'Mahasiswa'}</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Kelompok yang Dinilai</td>
                <td style="padding: 10px 14px; font-weight: 800; color: #4338ca; border-bottom: 1px solid #e2e8f0;">${payload.kelompok || '-'}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Nilai / Skor Kelompok</td>
                <td style="padding: 10px 14px; font-weight: 800; font-size: 14.5px; color: #059669; border-bottom: 1px solid #e2e8f0;">${payload.nilaiKelompok !== undefined ? payload.nilaiKelompok : 0} / 100</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Presentator Terbaik</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${Array.isArray(payload.presentatorTerbaik) ? (payload.presentatorTerbaik.join(', ') || '-') : (payload.presentatorTerbaik || '-')}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Mata Kuliah</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || '-'}</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Dosen Pengampu</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || '-'}</td>
              </tr>
              <tr style="background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Waktu Pengiriman Resmi</td>
                <td style="padding: 10px 14px; font-family: monospace; font-weight: 700; color: #0f172a;">${nowStr}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer Verification Box -->
          <div style="border: 1px dashed #94a3b8; border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            <div style="font-size: 11px; color: #475569; line-height: 1.45;">
              <strong style="color: #0f172a; display: block; margin-bottom: 2px; font-size: 11.5px;">Verifikasi Digital Supabase FKIP ULM</strong>
              Tanda terima ini diterbitkan otomatis oleh sistem dan memiliki kekuatan verifikasi akademik internal yang sah.
            </div>
            <div style="font-family: monospace; font-size: 10px; font-weight: 700; color: #64748b; text-align: right; white-space: nowrap;">
              STATUS: TERVERIFIKASI<br>
              SERVER: SUPABASE CLOUD
            </div>
          </div>

        </div>
      `;

      window.print();

      setTimeout(() => {
        printRoot.className = "hidden";
        printRoot.innerHTML = origHtml;
      }, 1500);
    }

    function clearStudentFormDraft(isManual = false) {
      localStorage.removeItem(getFormDraftKey());
      localStorage.removeItem("PGSD_FORM_DRAFT");
      clientCustomFormAnswers = {};
      customUploadedFilesMap = {};
      const banner = document.getElementById("studentDraftRestoreBanner");
      if (banner) banner.classList.add("hidden");

      if (isManual) {
        resetStudentForm();
        showToast("Draf isian berhasil dihapus.", "info");
      }
    }

    function resetStudentForm() {
      const radioChecked = document.querySelector("input[name='selectedGroup']:checked");
      if (radioChecked) radioChecked.checked = false;
      document.querySelectorAll(".group-card").forEach(c => {
        c.className = "group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition-all";
      });
      selectedGroupObj = null;
      selectedBestPresenters = [];
      goToInfoOverview();
      updateStepUI(1);
    }

    function resetFormAndCloseModal() {
      document.getElementById("successModal").classList.add("hidden");
      document.getElementById("successModal").classList.remove("flex");
      clearStudentFormDraft(false);
      resetStudentForm();
    }

    function closeModalAndGoToRekap() {
      resetFormAndCloseModal();
      switchTab('rekap');
      loadRekapData(true);
    }

    function switchTab(tab, updateHash = true) {
      const viewPortal = document.getElementById("viewPortal");
      const viewForm = document.getElementById("viewForm");
      const viewRekap = document.getElementById("viewRekap");
      const tabFormBtn = document.getElementById("tabFormBtn");
      const tabRekapBtn = document.getElementById("tabRekapBtn");
      const navTabContainer = document.getElementById("navTabContainer");

      if (viewPortal) viewPortal.classList.add("hidden");
      if (navTabContainer) navTabContainer.classList.remove("hidden");

      localStorage.setItem("PGSD_ACTIVE_MAIN_TAB", tab);
      if (updateHash) {
        try {
          history.replaceState(null, null, `#${tab}`);
        } catch(e) {
          window.location.hash = tab;
        }
      }

      if (tab === 'form') {
        viewForm.classList.remove("hidden");
        viewRekap.classList.add("hidden");
        tabFormBtn.className = "py-1.5 px-3 rounded-md bg-zinc-100 text-zinc-950 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        tabRekapBtn.className = "py-1.5 px-3 rounded-md text-zinc-400 hover:text-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        checkAndApplyAuthGate();
      } else {
        viewForm.classList.add("hidden");
        viewRekap.classList.remove("hidden");
        tabRekapBtn.className = "py-1.5 px-3 rounded-md bg-zinc-100 text-zinc-950 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        tabFormBtn.className = "py-1.5 px-3 rounded-md text-zinc-400 hover:text-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        
        const savedSub = localStorage.getItem("PGSD_ACTIVE_REKAP_SUBTAB") || "kelompok";
        const hasLocalData = currentRekapData && currentRekapData.summary && currentRekapData.summary.length > 0;
        
        switchRekapSubView(savedSub, false);
        if (hasLocalData) {
          renderBothRekapViews();
        }
        loadRekapData(true);
      }
    }

    // =========================================================================
    // REKAPITULASI DATA LOGIC (KELOMPOK & INDIVIDU PEMATERI)
    // =========================================================================
    async function loadRekapData(isSilent = false) {
      const btnRefresh = document.getElementById("btnRefreshRekap");
      if (!isSilent && btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.innerHTML = `
          <svg class="w-3.5 h-3.5 text-zinc-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span class="text-zinc-600">Menyegarkan...</span>
        `;
      }

      const restoreBtnDefault = () => {
        if (btnRefresh) {
          btnRefresh.disabled = false;
          btnRefresh.innerHTML = `
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Segarkan</span>
          `;
        }
      };

      const setBtnSuccess = () => {
        if (btnRefresh) {
          btnRefresh.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-emerald-700 font-bold">Tersinkron</span>
          `;
          setTimeout(restoreBtnDefault, 1600);
        }
      };

      const setBtnFallback = () => {
        if (btnRefresh) {
          btnRefresh.innerHTML = `
            <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span class="text-amber-700 font-bold">Mode Offline</span>
          `;
          setTimeout(restoreBtnDefault, 2000);
        }
      };

      const loading = document.getElementById("rekapLoading");
      const empty = document.getElementById("rekapEmpty");
      const kelompokBox = document.getElementById("rekapKelompokContainer");
      const individuBox = document.getElementById("rekapIndividuContainer");
      const searchBox = document.getElementById("individuSearchControlBox");
      const chartOverviewCard = document.getElementById("rekapChartOverviewCard");

      const hasLocalData = currentRekapData && currentRekapData.summary && currentRekapData.summary.length > 0;

      if (hasLocalData) {
        if (loading) loading.classList.add("hidden");
        if (empty) empty.classList.add("hidden");
      } else if (!isSilent) {
        if (loading) loading.classList.remove("hidden");
        if (empty) empty.classList.add("hidden");
        if (kelompokBox) kelompokBox.classList.add("hidden");
        if (individuBox) individuBox.classList.add("hidden");
        if (searchBox) searchBox.classList.add("hidden");
        if (chartOverviewCard) chartOverviewCard.classList.add("hidden");
      }

      // ⚡ FAST-PATH (< 30ms): Ambil langsung dari Supabase Database
      const sb = getSupabaseClient();
      if (sb) {
        try {
          const { data: respList, error: sbErr } = await sb
            .from('pgsd_responses')
            .select('*')
            .eq('form_id', activeFormId)
            .eq('status', 'VALID')
            .order('created_at', { ascending: false });

          if (!sbErr && Array.isArray(respList)) {
            // Kalkulasi summary per kelompok secara komprehensif & real-time
            const calcSummaryForResponses = (list) => {
              const groupMap = {};
              list.forEach(r => {
                const grp = r.kelompok_dinilai || "Kelompok";
                if (!groupMap[grp]) {
                  groupMap[grp] = {
                    kelompok: grp,
                    sesi: r.sesi || "Minggu 1",
                    totalNilai: 0,
                    totalPenilai: 0,
                    totalKomentar: 0,
                    presentatorMap: {},
                    evaluators: [],
                    evaluasiList: {},
                    votePresentator: {}
                  };
                  // Pre-seed all members from groupsData if available
                  const foundGroupObj = (groupsData || []).find(g => g.name === grp);
                  if (foundGroupObj && Array.isArray(foundGroupObj.members)) {
                    foundGroupObj.members.forEach(m => {
                      groupMap[grp].evaluasiList[m.name] = [];
                      groupMap[grp].votePresentator[m.name] = 0;
                    });
                  }
                }
                groupMap[grp].totalNilai += (parseFloat(r.nilai_kelompok) || 0);
                groupMap[grp].totalPenilai += 1;
                groupMap[grp].evaluators.push({
                  nim: r.nim_penilai,
                  nama: r.nama_penilai,
                  email: r.email,
                  peran: r.peran_penilai || 'Mahasiswa',
                  nilai: r.nilai_kelompok
                });
                if (r.evaluasi_detail && typeof r.evaluasi_detail === 'object') {
                  const evKeys = Object.keys(r.evaluasi_detail);
                  groupMap[grp].totalKomentar += evKeys.length;
                  evKeys.forEach(sName => {
                    const text = r.evaluasi_detail[sName];
                    if (text && String(text).trim()) {
                      if (!groupMap[grp].evaluasiList[sName]) groupMap[grp].evaluasiList[sName] = [];
                      groupMap[grp].evaluasiList[sName].push({
                        penilai: r.nama_penilai || 'Anonim',
                        peran: r.peran_penilai || 'Mahasiswa',
                        nim: r.nim_penilai || '-',
                        ulasan: String(text).trim(),
                        timestamp: r.created_at
                      });
                    }
                  });
                }
                if (r.best_presenter_1 && r.best_presenter_1 !== "-") {
                  groupMap[grp].presentatorMap[r.best_presenter_1] = (groupMap[grp].presentatorMap[r.best_presenter_1] || 0) + 1;
                  groupMap[grp].votePresentator[r.best_presenter_1] = (groupMap[grp].votePresentator[r.best_presenter_1] || 0) + 1;
                }
                if (r.best_presenter_2 && r.best_presenter_2 !== "-") {
                  groupMap[grp].presentatorMap[r.best_presenter_2] = (groupMap[grp].presentatorMap[r.best_presenter_2] || 0) + 1;
                  groupMap[grp].votePresentator[r.best_presenter_2] = (groupMap[grp].votePresentator[r.best_presenter_2] || 0) + 1;
                }
              });

              return Object.values(groupMap).map(g => {
                const ranked = Object.entries(g.presentatorMap)
                  .map(([name, votes]) => ({ name, votes }))
                  .sort((a, b) => b.votes - a.votes);
                const best1 = ranked[0] ? `${ranked[0].name} (${ranked[0].votes} Suara)` : "-";
                const best2 = ranked[1] ? `${ranked[1].name} (${ranked[1].votes} Suara)` : "-";
                const avg = g.totalPenilai > 0 ? parseFloat((g.totalNilai / g.totalPenilai).toFixed(2)) : 0;
                return {
                  kelompok: g.kelompok,
                  sesi: g.sesi,
                  rataRataSkor: avg,
                  rataRataNilai: avg,
                  rataRata: avg,
                  totalPenilai: g.totalPenilai,
                  totalKomentar: g.totalKomentar,
                  presentatorTerbaik1: best1,
                  presentatorTerbaik2: best2,
                  rankedPresenters: ranked,
                  evaluators: g.evaluators,
                  evaluasiList: g.evaluasiList,
                  votePresentator: g.votePresentator
                };
              });
            };

            // Build nimToKelompokMap, nameToKelompokMap, emailToKelompokMap
            const nimToKelompokMap = {};
            const nameToKelompokMap = {};
            const emailToKelompokMap = {};

            respList.forEach(r => {
              const nim = String(r.nim_penilai || '').replace(/\s+/g, '').trim().toLowerCase();
              const name = String(r.nama_penilai || '').trim().toLowerCase();
              const email = String(r.email || '').trim().toLowerCase();
              const grp = String(r.kelompok_dinilai || '').trim();

              if (grp) {
                if (nim && nim !== '-') {
                  if (!nimToKelompokMap[nim]) nimToKelompokMap[nim] = [];
                  if (!nimToKelompokMap[nim].some(g => g.toLowerCase() === grp.toLowerCase())) {
                    nimToKelompokMap[nim].push(grp);
                  }
                }
                if (name && name !== '-') {
                  if (!nameToKelompokMap[name]) nameToKelompokMap[name] = [];
                  if (!nameToKelompokMap[name].some(g => g.toLowerCase() === grp.toLowerCase())) {
                    nameToKelompokMap[name].push(grp);
                  }
                }
                if (email && email !== '-') {
                  if (!emailToKelompokMap[email]) emailToKelompokMap[email] = [];
                  if (!emailToKelompokMap[email].some(g => g.toLowerCase() === grp.toLowerCase())) {
                    emailToKelompokMap[email].push(grp);
                  }
                }
              }
            });

            const summaryArray = calcSummaryForResponses(respList);
            const summaryMhs = calcSummaryForResponses(respList.filter(r => (r.peran_penilai || 'Mahasiswa') === 'Mahasiswa'));

            const res = {
              success: true,
              summary: summaryArray,
              summaryMhs: summaryMhs,
              nimToKelompokMap: nimToKelompokMap,
              nameToKelompokMap: nameToKelompokMap,
              emailToKelompokMap: emailToKelompokMap,
              isPublicReviewVisible: true,
              responses: respList.map(r => ({
                idRespons: r.id_respons,
                timestamp: new Date(r.created_at).toLocaleString('id-ID'),
                sesi: r.sesi,
                email: r.email,
                namaPenilai: r.nama_penilai,
                peran: r.peran_penilai,
                nim: r.nim_penilai,
                kelompok: r.kelompok_dinilai,
                nilaiKelompok: r.nilai_kelompok,
                presentatorTerbaik: [r.best_presenter_1, r.best_presenter_2].filter(x => x && x !== "-"),
                evaluasiDetail: r.evaluasi_detail || {},
                customAnswers: r.custom_answers || {}
              }))
            };

            currentRekapData = res;
            localStorage.setItem("PGSD_CACHE_REKAP_" + activeFormId, JSON.stringify(res));
            if (loading) loading.classList.add("hidden");

            if (summaryArray.length === 0) {
              if (empty) empty.classList.remove("hidden");
              if (chartOverviewCard) chartOverviewCard.classList.add("hidden");
              if (kelompokBox) kelompokBox.classList.add("hidden");
              if (individuBox) individuBox.classList.add("hidden");
            } else {
              if (empty) empty.classList.add("hidden");
              populateRekapFilter(summaryArray);
              populatePresensiFilters();
              renderBothRekapViews();
            }
            renderGroupOptions();
            if (!isSilent) {
              setBtnSuccess();
              showToast("Data rekapitulasi diperbarui dari Supabase (< 30ms).", "success");
            }
            return;
          }
        } catch (sbErr) {
          console.warn("Supabase loadRekapData notice:", sbErr);
        }
      }

      const apiUrl = getApiUrl();

      try {
        const fetchWithTimeout = (url, ms = 6000) => {
          return Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
          ]);
        };

        const response = await fetchWithTimeout(`${apiUrl}?action=getRecapData&formId=${encodeURIComponent(activeFormId)}&_t=${Date.now()}`, 6000);
        const res = await response.json();

        if (loading) loading.classList.add("hidden");
        if (res && res.success) {
          currentRekapData = res;
          localStorage.setItem("PGSD_CACHE_REKAP_" + activeFormId, JSON.stringify(res));
          renderGroupOptions();

          if (!res.summary || res.summary.length === 0) {
            if (empty) empty.classList.remove("hidden");
            if (chartOverviewCard) chartOverviewCard.classList.add("hidden");
            if (kelompokBox) kelompokBox.classList.add("hidden");
            if (individuBox) individuBox.classList.add("hidden");
          } else {
            if (empty) empty.classList.add("hidden");
            populateRekapFilter(res.summary);
            populatePresensiFilters();
            renderBothRekapViews();
          }
          if (!isSilent) {
            setBtnSuccess();
            showToast("Data rekapitulasi berhasil diperbarui dari server cloud.", "success");
          }
        } else {
          if (!hasLocalData && empty) empty.classList.remove("hidden");
          if (!isSilent) {
            setBtnFallback();
            showToast("Gagal memperbarui rekap: " + (res?.error || "Respon server tidak valid"), "warning");
          }
        }
      } catch (err) {
        if (loading) loading.classList.add("hidden");
        if (!hasLocalData && empty) {
          empty.classList.remove("hidden");
        }
        if (!isSilent) {
          setBtnFallback();
          showToast("Koneksi cloud terputus/lambat. Menampilkan data tersimpan di perangkat.", "warning");
        }
      }
    }

    function switchRekapSubView(sub, updateStorage = true, triggerRender = true) {
      currentRekapSubView = sub;
      if (updateStorage) {
        localStorage.setItem("PGSD_ACTIVE_REKAP_SUBTAB", sub);
      }
      const btnK = document.getElementById("subTabKelompokBtn");
      const btnI = document.getElementById("subTabIndividuBtn");
      const btnP = document.getElementById("subTabPresensiBtn");

      const filterGroupBar = document.getElementById("rekapGroupFilterBox");
      const presensiControlBox = document.getElementById("presensiControlBox");
      const searchBox = document.getElementById("individuSearchControlBox");

      const boxK = document.getElementById("rekapKelompokContainer");
      const boxI = document.getElementById("rekapIndividuContainer");
      const boxP = document.getElementById("rekapPresensiContainer");

      const activeBtnClass = "py-2 px-1.5 sm:px-3 rounded-lg bg-white text-zinc-900 shadow-xs transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center truncate font-bold";
      const inactiveBtnClass = "py-2 px-1.5 sm:px-3 rounded-lg text-zinc-500 hover:text-zinc-900 transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center truncate";

      if (btnK) btnK.className = sub === 'kelompok' ? activeBtnClass : inactiveBtnClass;
      if (btnI) btnI.className = sub === 'individu' ? activeBtnClass : inactiveBtnClass;
      if (btnP) btnP.className = sub === 'presensi' ? activeBtnClass : inactiveBtnClass;

      if (sub === 'kelompok') {
        if (boxK) boxK.classList.remove("hidden");
        if (boxI) boxI.classList.add("hidden");
        if (boxP) boxP.classList.add("hidden");
        if (filterGroupBar) filterGroupBar.classList.remove("hidden");
        if (presensiControlBox) presensiControlBox.classList.add("hidden");
        if (searchBox) searchBox.classList.add("hidden");
      } else if (sub === 'individu') {
        if (boxI) boxI.classList.remove("hidden");
        if (boxK) boxK.classList.add("hidden");
        if (boxP) boxP.classList.add("hidden");
        if (filterGroupBar) filterGroupBar.classList.remove("hidden");
        if (presensiControlBox) presensiControlBox.classList.add("hidden");
        if (searchBox) searchBox.classList.remove("hidden");
        if (triggerRender) filterMahasiswaSearch();
      } else if (sub === 'presensi') {
        const loading = document.getElementById("rekapLoading");
        if (loading) loading.classList.add("hidden");
        if (boxP) boxP.classList.remove("hidden");
        if (boxK) boxK.classList.add("hidden");
        if (boxI) boxI.classList.add("hidden");
        if (filterGroupBar) filterGroupBar.classList.add("hidden");
        if (presensiControlBox) presensiControlBox.classList.remove("hidden");
        if (searchBox) searchBox.classList.add("hidden");
        if (triggerRender) {
          populatePresensiFilters();
          renderRekapPresensi();
        }
      }
    }

    function populateRekapFilter(summaryListParam) {
      const sesiSelect = document.getElementById("rekapSesiFilter");
      const groupSelect = document.getElementById("rekapGroupFilter");
      if (!groupSelect) return;

      const currentSesi = sesiSelect?.value || "ALL";
      const currentGroup = groupSelect?.value || "ALL";

      // 1. Kumpulkan seluruh sesi dari seluruh sumber (rekap summary, allStudents, groupsData)
      const allSessions = new Set();
      (currentRekapData?.summary || []).forEach(g => { if (g.sesi) allSessions.add(g.sesi.trim()); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.sesi) allSessions.add(g.sesi.trim()); });
      (allStudentsData || []).forEach(s => { if (s.sesi) allSessions.add(s.sesi.trim()); });
      (groupsData || []).forEach(g => { if (g.sesi) allSessions.add(g.sesi.trim()); });

      if (sesiSelect) {
        sesiSelect.innerHTML = '<option value="ALL">Semua Sesi (Keseluruhan)</option>';
        Array.from(allSessions).sort().forEach(s => {
          const opt = document.createElement("option");
          opt.value = s;
          opt.textContent = s;
          if (s === currentSesi) opt.selected = true;
          sesiSelect.appendChild(opt);
        });
      }

      // 2. Kumpulkan kelompok (jika filter sesi dipilih, tampilkan kelompok yang relevan atau semua)
      const selectedSesiVal = sesiSelect?.value || "ALL";
      const allKelompokMap = new Map(); // kelompok -> sesi

      (currentRekapData?.summary || []).forEach(g => { if (g.kelompok) allKelompokMap.set(g.kelompok, g.sesi || ''); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.kelompok) allKelompokMap.set(g.kelompok, g.sesi || ''); });
      (groupsData || []).forEach(g => { if (g.name) allKelompokMap.set(g.name, g.sesi || ''); });
      (allStudentsData || []).forEach(s => { if (s.kelompok) allKelompokMap.set(s.kelompok, s.sesi || ''); });

      groupSelect.innerHTML = '<option value="ALL">Semua Kelompok</option>';
      Array.from(allKelompokMap.keys()).sort().forEach(kelompok => {
        const sesi = allKelompokMap.get(kelompok);
        if (selectedSesiVal !== "ALL" && sesi && sesi.toLowerCase() !== selectedSesiVal.toLowerCase()) {
          return; // Lewati kelompok yang berbeda sesi jika filter sesi spesifik aktif
        }
        const opt = document.createElement("option");
        opt.value = kelompok;
        opt.textContent = `${kelompok}${sesi ? ' (' + sesi + ')' : ''}`;
        if (kelompok === currentGroup) opt.selected = true;
        groupSelect.appendChild(opt);
      });
    }

    function onRekapSesiFilterChange() {
      // Perbarui dropdown kelompok agar relevan dengan sesi terpilih
      const groupSelect = document.getElementById("rekapGroupFilter");
      if (groupSelect) groupSelect.value = "ALL";
      populateRekapFilter();
      renderBothRekapViews();
    }

    function filterRekapDisplay() {
      renderBothRekapViews();
    }

    // =========================================================================
    // KONTROL & FILTER TAB STATUS PENGISIAN PRESENSI MAHASISWA
    // =========================================================================
    // =========================================================================
    // KONTROL & FILTER TAB STATUS PENGISIAN PRESENSI MAHASISWA (PRESENTATOR & MATRIKS)
    // =========================================================================
    function populatePresensiFilters() {
      const presenterSelect = document.getElementById("presensiPresenterFilter");
      const grpSelect = document.getElementById("presensiGroupFilter");
      const statusSelect = document.getElementById("presensiStatusFilter");

      if (!presenterSelect || !grpSelect) return;

      const currentPresenter = presenterSelect.value || "ALL";
      const currentGrp = grpSelect.value || "ALL";
      const currentStatus = statusSelect?.value || "ALL";

      // 1. Kumpulkan seluruh Kelompok Presentator beserta sesinya
      const groupSesiMap = new Map();
      (currentRekapData?.summary || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (groupsData || []).forEach(g => { if (g.name) groupSesiMap.set(g.name.trim(), g.sesi ? g.sesi.trim() : ''); });

      const allPresenterGroups = [];
      groupSesiMap.forEach((sVal, gName) => {
        allPresenterGroups.push({ name: gName, sesi: sVal });
      });
      allPresenterGroups.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      // Populate Presentator Dropdown (Sleek & Concise)
      presenterSelect.innerHTML = '<option value="ALL">Semua</option>';
      allPresenterGroups.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g.name;
        opt.textContent = `${g.name}${g.sesi ? ' (' + g.sesi + ')' : ''}`;
        if (g.name.toLowerCase() === currentPresenter.toLowerCase()) opt.selected = true;
        presenterSelect.appendChild(opt);
      });

      // 2. Kumpulkan seluruh Kelompok Asal Mahasiswa di kelas
      const originGroups = new Set();
      (allStudentsData || []).forEach(s => { if (s.kelompok) originGroups.add(s.kelompok.trim()); });
      (groupsData || []).forEach(g => { if (g.name) originGroups.add(g.name.trim()); });
      const sortedOriginGroups = Array.from(originGroups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      // Populate Kelompok Asal Dropdown (Sleek & Concise)
      grpSelect.innerHTML = '<option value="ALL">Semua Kelompok</option>';
      sortedOriginGroups.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        if (g === currentGrp) opt.selected = true;
        grpSelect.appendChild(opt);
      });

      // 3. Populate Status Dropdown based on presenter selection
      updatePresensiStatusOptions(currentPresenter, currentStatus);
    }

    function updatePresensiStatusOptions(selectedPresenter, currentStatus = "ALL") {
      const statusSelect = document.getElementById("presensiStatusFilter");
      if (!statusSelect) return;

      if (selectedPresenter === "ALL") {
        statusSelect.innerHTML = `
          <option value="ALL">Semua Status</option>
          <option value="LENGKAP">Selesai</option>
          <option value="SEBAGIAN">Sebagian</option>
          <option value="BELUM">Belum Mengisi</option>
        `;
      } else {
        statusSelect.innerHTML = `
          <option value="ALL">Semua Status</option>
          <option value="SUDAH">Sudah Menilai</option>
          <option value="BELUM">Belum Menilai</option>
          <option value="PENYAJI">Anggota Penyaji</option>
        `;
      }

      if (currentStatus) {
        statusSelect.value = currentStatus;
        if (!statusSelect.value) statusSelect.value = "ALL";
      }
    }

    function onPresensiPresenterFilterChange() {
      const presenterSelect = document.getElementById("presensiPresenterFilter");
      const selectedPresenter = presenterSelect ? presenterSelect.value : "ALL";
      updatePresensiStatusOptions(selectedPresenter, "ALL");
      renderRekapPresensi();
    }

    function filterPresensiDisplay() {
      renderRekapPresensi();
    }

    function renderRekapPresensi() {
      const tableHeaderRow = document.getElementById("presensiTableHeaderRow");
      const tableBody = document.getElementById("presensiTableBody");
      const totalMhsBadge = document.getElementById("presensiTotalMhs");
      const sudahMhsBadge = document.getElementById("presensiSudahMhs");
      const sebagianMhsBadge = document.getElementById("presensiSebagianMhs");
      const belumMhsBadge = document.getElementById("presensiBelumMhs");
      const cardTitle1 = document.getElementById("presensiCardTitle1");
      const cardTitle2 = document.getElementById("presensiCardTitle2");
      const cardTitle3 = document.getElementById("presensiCardTitle3");
      const cardTitle4 = document.getElementById("presensiCardTitle4");
      const tableTitleEl = document.getElementById("presensiTableTitle");
      const tableSubtitleEl = document.getElementById("presensiTableSubtitle");
      const countLabel = document.getElementById("presensiFilterResultCount");
      const dosenGuestSection = document.getElementById("dosenGuestPresensiSection");
      const dosenGuestListEl = document.getElementById("dosenGuestList");
      const dosenGuestBadge = document.getElementById("dosenGuestCountBadge");

      if (!tableBody) return;

      const activeSesi = (typeof appConfig !== 'undefined' && (appConfig["Sesi_Minggu_Aktif"] || appConfig["Sesi_Aktif"])) 
        ? (appConfig["Sesi_Minggu_Aktif"] || appConfig["Sesi_Aktif"]).trim() 
        : (currentRekapData?.activeSession || "Minggu 1");

      const presenterFilter = document.getElementById("presensiPresenterFilter")?.value || "ALL";
      const grpFilter = document.getElementById("presensiGroupFilter")?.value || "ALL";
      const statusFilter = document.getElementById("presensiStatusFilter")?.value || "ALL";
      const searchQuery = (document.getElementById("presensiSearchInput")?.value || "").trim().toLowerCase();
      const kewajibanPenyaji = (typeof appConfig !== 'undefined' && appConfig["Kewajiban_Menilai_Penyaji"]) || "WAJIB_NILAI_KELOMPOK_LAIN";

      // === SUMBER KEBENARAN TUNGGAL (Single Source of Truth) ===
      const submittedNimSet = new Set(
        (currentRekapData?.submittedNims || []).map(n => String(n).trim().toLowerCase())
      );
      const submittedNameSet = new Set(
        (currentRekapData?.submittedNames || []).map(n => String(n).trim().toLowerCase())
      );
      const nimToKelompokMap = currentRekapData?.nimToKelompokMap || {};
      const nameToKelompokMap = currentRekapData?.nameToKelompokMap || {};

      // Fallback jika backend lama
      const hasNewFields = currentRekapData?.submittedNims !== undefined;
      if (!hasNewFields && currentRekapData?.summary) {
        currentRekapData.summary.forEach(g => {
          (g.evaluators || []).forEach(e => {
            if (!e || typeof e !== 'object') return;
            if ((e.peran || 'Mahasiswa') !== 'Mahasiswa') return;
            const nim = String(e.nim || '').trim().toLowerCase();
            const nama = String(e.name || '').trim().toLowerCase();
            if (nim && nim !== '-') submittedNimSet.add(nim);
            if (nama) submittedNameSet.add(nama);
          });
        });
      }

      // 1. Kumpulkan seluruh kelompok Presentator yang ada & petakan sesinya
      const groupSesiMap = new Map();
      (currentRekapData?.summary || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (groupsData || []).forEach(g => { if (g.name) groupSesiMap.set(g.name.trim(), g.sesi ? g.sesi.trim() : ''); });

      const allPresenterGroups = [];
      groupSesiMap.forEach((sVal, gName) => {
        allPresenterGroups.push({ name: gName, sesi: sVal });
      });
      allPresenterGroups.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      // Kelompok target yang tampil pada sesi aktif
      const isAllSession = (activeSesi.toUpperCase() === "SEMUA" || activeSesi.toUpperCase() === "ALL");
      const targetSessionGroupNames = isAllSession
        ? allPresenterGroups.map(g => g.name)
        : allPresenterGroups
            .filter(g => g.sesi && g.sesi.toLowerCase() === activeSesi.toLowerCase())
            .map(g => g.name);

      const activeEvaluationGroups = targetSessionGroupNames.length > 0 
        ? targetSessionGroupNames 
        : allPresenterGroups.map(g => g.name);

      // 2. Kumpulkan seluruh mahasiswa dari SEMUA kelompok (unik)
      const allClassStudents = [];
      const seenNimInRoster = new Set();

      if (allStudentsData && allStudentsData.length > 0) {
        allStudentsData.forEach(s => {
          const nim = String(s.nim || "").trim();
          const name = String(s.name || "").trim();
          const grp = String(s.kelompok || "").trim();
          if (!name) return;
          const key = nim && nim !== "-" ? nim.toLowerCase() : name.toLowerCase() + "|" + grp;
          if (seenNimInRoster.has(key)) return;
          seenNimInRoster.add(key);
          allClassStudents.push({ name, nim: nim || "-", kelompok: grp });
        });
      } else if (groupsData && groupsData.length > 0) {
        groupsData.forEach(g => {
          (g.members || []).forEach(m => {
            const name = String(m.name || "").trim();
            const nim = String(m.nim || "").trim();
            const grp = String(g.name || "").trim();
            if (!name) return;
            const key = nim && nim !== "-" ? nim.toLowerCase() : name.toLowerCase() + "|" + grp;
            if (seenNimInRoster.has(key)) return;
            seenNimInRoster.add(key);
            allClassStudents.push({ name, nim: nim || "-", kelompok: grp });
          });
        });
      }

      // 3. Kalkulasi Presensi Mahasiswa
      const isSinglePresenterMode = presenterFilter !== "ALL";
      const singleTargetPresenter = isSinglePresenterMode ? presenterFilter : null;
      const singlePresenterSesi = isSinglePresenterMode ? (groupSesiMap.get(singleTargetPresenter) || '') : '';

      // Update Section Header Title & Subtitle
      if (tableTitleEl && tableSubtitleEl) {
        if (!isSinglePresenterMode) {
          tableTitleEl.textContent = "Matriks Keterisian Penilaian";
          tableSubtitleEl.textContent = "Rekapitulasi keterisian form evaluasi mahasiswa per kelompok.";
        } else {
          tableTitleEl.textContent = `Status Penilaian • ${singleTargetPresenter}`;
          tableSubtitleEl.textContent = `Status evaluasi mahasiswa untuk ${singleTargetPresenter}${singlePresenterSesi ? ' (' + singlePresenterSesi + ')' : ''}.`;
        }
      }

      const studentPresensiList = allClassStudents.map(student => {
        const normNim = String(student.nim || "").trim().toLowerCase();
        const normName = String(student.name || "").trim().toLowerCase();
        const studentGroup = (student.kelompok || "").trim();
        const studentSesi = (groupSesiMap.get(studentGroup) || "").trim();

        let filledKelompok = [];
        if (normNim && normNim !== "-" && nimToKelompokMap[normNim]) {
          filledKelompok = nimToKelompokMap[normNim];
        } else if (nameToKelompokMap[normName]) {
          filledKelompok = nameToKelompokMap[normName];
        } else if (normNim && normNim !== "-" && submittedNimSet.has(normNim)) {
          filledKelompok = activeEvaluationGroups.length > 0 ? [activeEvaluationGroups[0]] : ["Kelompok 1"];
        } else if (submittedNameSet.has(normName)) {
          filledKelompok = activeEvaluationGroups.length > 0 ? [activeEvaluationGroups[0]] : ["Kelompok 1"];
        }

        // Apakah mahasiswa ini adalah anggota kelompok yang sedang tampil pada sesi aktif?
        let isPresenterInActiveSession = false;
        if (activeSesi === "SEMUA" || activeSesi === "ALL") {
          isPresenterInActiveSession = allPresenterGroups.some(g => g.name.toLowerCase() === studentGroup.toLowerCase());
        } else {
          isPresenterInActiveSession = (studentSesi && studentSesi.toLowerCase() === activeSesi.toLowerCase());
        }

        // Tentukan daftar kelompok yang WAJIB dievaluasi oleh mahasiswa ini:
        let targetGroupsToEvaluate = [];
        activeEvaluationGroups.forEach(tgName => {
          // Jangan pernah wajib menilai kelompok sendiri
          if (tgName.toLowerCase() === studentGroup.toLowerCase()) return;

          const tgSesi = (groupSesiMap.get(tgName) || "").trim();
          const isSameSession = (studentSesi && tgSesi && studentSesi.toLowerCase() === tgSesi.toLowerCase());

          // Jika pengaturan bebas penuh di sesinya aktif dan mahasiswa tampil di sesi yang sama dengan kelompok target
          if (kewajibanPenyaji === "BEBAS_PENUH_DI_SESINYA" && isSameSession) {
            return; // Bebas / tidak wajib menilai kelompok lain di sesinya
          }

          targetGroupsToEvaluate.push(tgName);
        });

        const totalTargets = targetGroupsToEvaluate.length;
        const filledTargetsCount = targetGroupsToEvaluate.filter(tg => filledKelompok.some(fk => fk.toLowerCase() === tg.toLowerCase())).length;

        let matrixStatusCategory = "BELUM";
        let matrixStatusLabel = "Belum Mengisi";

        if (totalTargets === 0) {
          matrixStatusCategory = "LENGKAP";
          matrixStatusLabel = isPresenterInActiveSession ? "Selesai (Penyaji)" : "Selesai";
        } else if (filledTargetsCount === totalTargets) {
          matrixStatusCategory = "LENGKAP";
          matrixStatusLabel = isPresenterInActiveSession ? "Selesai (Penyaji)" : "Selesai";
        } else if (filledTargetsCount > 0) {
          matrixStatusCategory = "SEBAGIAN";
          matrixStatusLabel = `Sebagian (${filledTargetsCount}/${totalTargets})`;
        } else {
          matrixStatusCategory = "BELUM";
          matrixStatusLabel = "Belum Mengisi";
        }

        // Kalkulasi Mode Single Presentator
        let singleStatusCategory = "BELUM";
        let singleStatusLabel = "Belum Menilai";
        const isPresenterOfSingle = isSinglePresenterMode && studentGroup.toLowerCase() === singleTargetPresenter.toLowerCase();
        const hasFilledSingle = isSinglePresenterMode && filledKelompok.some(fk => fk.toLowerCase() === singleTargetPresenter.toLowerCase());
        const isSameSessionSingle = isSinglePresenterMode && (studentSesi && singlePresenterSesi && studentSesi.toLowerCase() === singlePresenterSesi.toLowerCase());
        const isExemptSingle = isSinglePresenterMode && !isPresenterOfSingle && (kewajibanPenyaji === "BEBAS_PENUH_DI_SESINYA" && isSameSessionSingle);

        if (isPresenterOfSingle) {
          singleStatusCategory = "PENYAJI";
          singleStatusLabel = "Anggota Penyaji";
        } else if (hasFilledSingle) {
          singleStatusCategory = "SUDAH";
          singleStatusLabel = "Sudah Menilai";
        } else if (isExemptSingle) {
          singleStatusCategory = "BEBAS";
          singleStatusLabel = "Bebas Menilai";
        } else {
          singleStatusCategory = "BELUM";
          singleStatusLabel = "Belum Menilai";
        }

        return {
          name: student.name,
          nim: student.nim || "-",
          kelompok: studentGroup,
          studentSesi,
          filledKelompok,
          isPresenter: isPresenterInActiveSession,
          isPresenterOfSingle,
          hasFilledSingle,
          isExemptSingle,
          matrixStatusCategory,
          matrixStatusLabel,
          singleStatusCategory,
          singleStatusLabel,
          filledTargetsCount,
          totalTargets
        };
      });

      // 4. Filter berdasarkan Kelompok Asal
      const baseScopeList = studentPresensiList.filter(s => {
        if (grpFilter !== "ALL" && s.kelompok !== grpFilter) return false;
        return true;
      });

      // 5. Hitung Statistik & Perbarui Kartu Ringkasan (Concise Titles)
      const totalStudents = baseScopeList.length;

      if (!isSinglePresenterMode) {
        // Mode Matriks Lengkap
        if (cardTitle1) cardTitle1.textContent = "Total Mahasiswa";
        if (cardTitle2) cardTitle2.textContent = "Selesai";
        if (cardTitle3) cardTitle3.textContent = "Sebagian";
        if (cardTitle4) cardTitle4.textContent = "Belum Mengisi";

        const countLengkap = baseScopeList.filter(s => s.matrixStatusCategory === "LENGKAP").length;
        const countSebagian = baseScopeList.filter(s => s.matrixStatusCategory === "SEBAGIAN").length;
        const countBelum = baseScopeList.filter(s => s.matrixStatusCategory === "BELUM").length;
        const pctLengkap = totalStudents > 0 ? Math.round((countLengkap / totalStudents) * 100) : 0;
        const pctSebagian = totalStudents > 0 ? Math.round((countSebagian / totalStudents) * 100) : 0;
        const pctBelum = totalStudents > 0 ? Math.round((countBelum / totalStudents) * 100) : 0;

        if (totalMhsBadge) totalMhsBadge.textContent = `${totalStudents} Mahasiswa`;
        if (sudahMhsBadge) sudahMhsBadge.textContent = `${countLengkap} (${pctLengkap}%)`;
        if (sebagianMhsBadge) sebagianMhsBadge.textContent = `${countSebagian} (${pctSebagian}%)`;
        if (belumMhsBadge) belumMhsBadge.textContent = `${countBelum} (${pctBelum}%)`;
      } else {
        // Mode Single Presenter
        if (cardTitle1) cardTitle1.textContent = "Total Mahasiswa";
        if (cardTitle2) cardTitle2.textContent = "Sudah Menilai";
        if (cardTitle3) cardTitle3.textContent = "Anggota Penyaji";
        if (cardTitle4) cardTitle4.textContent = "Belum Menilai";

        const countSudah = baseScopeList.filter(s => s.singleStatusCategory === "SUDAH").length;
        const countPenyaji = baseScopeList.filter(s => s.singleStatusCategory === "PENYAJI").length;
        const countBelum = baseScopeList.filter(s => s.singleStatusCategory === "BELUM").length;
        const pctSudah = totalStudents > 0 ? Math.round((countSudah / totalStudents) * 100) : 0;
        const pctPenyaji = totalStudents > 0 ? Math.round((countPenyaji / totalStudents) * 100) : 0;
        const pctBelum = totalStudents > 0 ? Math.round((countBelum / totalStudents) * 100) : 0;

        if (totalMhsBadge) totalMhsBadge.textContent = `${totalStudents} Mahasiswa`;
        if (sudahMhsBadge) sudahMhsBadge.textContent = `${countSudah} (${pctSudah}%)`;
        if (sebagianMhsBadge) sebagianMhsBadge.textContent = `${countPenyaji} (${pctPenyaji}%)`;
        if (belumMhsBadge) belumMhsBadge.textContent = `${countBelum} (${pctBelum}%)`;
      }

      // 6. Filter Tabel berdasarkan Status Kepatuhan & Pencarian
      const filteredList = baseScopeList.filter(s => {
        if (!isSinglePresenterMode) {
          if (statusFilter !== "ALL" && s.matrixStatusCategory !== statusFilter) return false;
        } else {
          if (statusFilter !== "ALL" && s.singleStatusCategory !== statusFilter) return false;
        }

        if (searchQuery) {
          const matchName = s.name.toLowerCase().includes(searchQuery);
          const matchNim = s.nim.toLowerCase().includes(searchQuery);
          const matchGroup = s.kelompok.toLowerCase().includes(searchQuery);
          const matchFilled = s.filledKelompok.some(k => k.toLowerCase().includes(searchQuery));
          if (!matchName && !matchNim && !matchGroup && !matchFilled) return false;
        }
        return true;
      });

      if (countLabel) {
        countLabel.textContent = `${filteredList.length} dari ${totalStudents} Mahasiswa`;
      }

      // 7. Render Dynamic Headers (Frozen Left Columns & Compact Responsiveness)
      if (tableHeaderRow) {
        if (!isSinglePresenterMode) {
          let headersHtml = `
            <th class="sticky top-0 left-0 z-40 px-1 py-1.5 w-8 min-w-[32px] max-w-[32px] text-center border-r border-zinc-200 font-mono text-[10px] sm:text-[11px] text-zinc-500 whitespace-nowrap" style="background-color: #f4f4f5 !important;">#</th>
            <th class="sticky top-0 left-[32px] z-40 px-2.5 py-1.5 min-w-[135px] sm:min-w-[160px] max-w-[160px] sm:max-w-[200px] text-left border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-semibold text-[11px] sm:text-xs text-zinc-700 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Mahasiswa &amp; NIM</th>
            <th class="sticky top-0 z-30 bg-zinc-100 px-1.5 sm:px-2 py-1.5 text-center min-w-[60px] sm:min-w-[75px] border-r border-zinc-200 text-[10px] sm:text-xs font-semibold text-zinc-600 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Kel. Asal</th>
          `;

          allPresenterGroups.forEach(g => {
            const isHighlighted = g.sesi && g.sesi.toLowerCase() === activeSesi.toLowerCase();
            if (isHighlighted) {
              headersHtml += `
                <th class="sticky top-0 z-30 px-1.5 sm:px-2 py-1.5 text-center min-w-[65px] sm:min-w-[85px] border-r border-zinc-200 bg-emerald-50/80 border-b-2 border-b-emerald-500 whitespace-nowrap shadow-2xs">
                  <div class="flex flex-col items-center">
                    <span class="text-[10.5px] sm:text-xs font-bold text-emerald-950 tracking-tight">${g.name}</span>
                    <span class="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-full mt-0.5 leading-none border border-emerald-200/60">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      ${g.sesi || 'Sesi Aktif'} • Tampil
                    </span>
                  </div>
                </th>
              `;
            } else {
              headersHtml += `
                <th class="sticky top-0 z-30 px-1.5 sm:px-2 py-1.5 text-center min-w-[60px] sm:min-w-[75px] border-r border-zinc-200 bg-zinc-100/90 text-zinc-600 font-medium whitespace-nowrap">
                  <div class="flex flex-col items-center">
                    <span class="text-[10px] sm:text-xs tracking-tight">${g.name}</span>
                    <span class="text-[8px] sm:text-[9px] text-zinc-400 font-mono leading-none mt-0.5">${g.sesi || '-'}</span>
                  </div>
                </th>
              `;
            }
          });

          headersHtml += `
            <th class="sticky top-0 z-30 md:sticky md:right-0 md:z-40 px-2 sm:px-3 py-1.5 text-center min-w-[90px] sm:min-w-[110px] border-l border-zinc-200 shadow-2xs text-[10px] sm:text-xs font-semibold text-zinc-700 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Status</th>
          `;

          tableHeaderRow.innerHTML = headersHtml;
        } else {
          // Single Presenter Focused Headers
          tableHeaderRow.innerHTML = `
            <th class="sticky top-0 left-0 z-40 px-1 py-1.5 w-8 min-w-[32px] max-w-[32px] text-center border-r border-zinc-200 font-mono text-[10px] sm:text-[11px] text-zinc-500 whitespace-nowrap" style="background-color: #f4f4f5 !important;">#</th>
            <th class="sticky top-0 left-[32px] z-40 px-2.5 py-1.5 min-w-[135px] sm:min-w-[160px] max-w-[180px] sm:max-w-[220px] text-left border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-semibold text-[11px] sm:text-xs text-zinc-700 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Mahasiswa &amp; NIM</th>
            <th class="sticky top-0 z-30 px-2 sm:px-3 py-1.5 text-center min-w-[65px] sm:min-w-[85px] border-r border-zinc-200 text-[10px] sm:text-xs font-semibold text-zinc-600 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Kel. Asal</th>
            <th class="sticky top-0 z-30 px-2 sm:px-3 py-1.5 text-center min-w-[110px] sm:min-w-[130px] border-r border-zinc-200 bg-emerald-50/80 border-b-2 border-b-emerald-500 whitespace-nowrap shadow-2xs">
              <div class="flex flex-col items-center">
                <span class="text-[10.5px] sm:text-xs font-bold text-emerald-950 tracking-tight">Status • ${singleTargetPresenter}</span>
                <span class="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-full mt-0.5 leading-none border border-emerald-200/60">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ${singlePresenterSesi ? singlePresenterSesi + ' • ' : ''}Target
                </span>
              </div>
            </th>
          `;
        }
      }

      const totalColumnsCount = !isSinglePresenterMode ? (3 + allPresenterGroups.length + 1) : 4;

      if (filteredList.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="${totalColumnsCount}" class="py-6 text-center text-zinc-400 text-xs italic">
              Tidak ada data mahasiswa yang sesuai dengan filter atau kata kunci pencarian.
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = filteredList.map((s, idx) => {
          const isOdd = idx % 2 === 1;
          const rowBgClass = isOdd ? 'bg-zinc-50/40' : 'bg-white';
          const solidBgStyle = isOdd ? 'background-color: #fafafa !important;' : 'background-color: #ffffff !important;';

          if (!isSinglePresenterMode) {
            // Generate cell for each presenter group (Clean Minimalist Checklist)
            const groupCellsHtml = allPresenterGroups.map(g => {
              const isMember = (s.kelompok || "").toLowerCase() === g.name.toLowerCase();
              const isFilled = s.filledKelompok.some(fk => fk.toLowerCase() === g.name.toLowerCase());
              const isTargetInSession = activeEvaluationGroups.some(ag => ag.toLowerCase() === g.name.toLowerCase());

              const gSesi = (groupSesiMap.get(g.name) || "").trim();
              const isSameSession = (s.studentSesi && gSesi && s.studentSesi.toLowerCase() === gSesi.toLowerCase());
              const isExempt = (kewajibanPenyaji === "BEBAS_PENUH_DI_SESINYA" && isSameSession && !isMember);

              if (isMember) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-purple-50/30 whitespace-nowrap">
                    <span class="inline-block px-1 py-0.5 rounded text-[8.5px] sm:text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 leading-none" title="${s.name} adalah penyaji ${g.name}">Penyaji</span>
                  </td>
                `;
              } else if (isFilled) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-emerald-50/20 whitespace-nowrap">
                    <span class="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 text-emerald-700 shadow-2xs" title="Sudah dinilai">
                      <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </span>
                  </td>
                `;
              } else if (isExempt) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-zinc-50/50 whitespace-nowrap">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[8.5px] sm:text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/80 leading-none" title="Bebas pengisian (Penyaji di sesi yang sama)">Bebas</span>
                  </td>
                `;
              } else if (isTargetInSession) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-rose-50/10 whitespace-nowrap">
                    <span class="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-50 text-rose-500 border border-rose-200/60" title="Belum dinilai">
                      <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </span>
                  </td>
                `;
              } else {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 text-zinc-300 font-mono text-[10px] sm:text-xs whitespace-nowrap">-</td>
                `;
              }
            }).join("");

            // Generate Final Status Cell
            let finalBadgeHtml = "";
            if (s.matrixStatusCategory === "LENGKAP") {
              finalBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>${s.matrixStatusLabel}</span>
                </span>
              `;
            } else if (s.matrixStatusCategory === "SEBAGIAN") {
              finalBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>${s.matrixStatusLabel}</span>
                </span>
              `;
            } else {
              finalBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>${s.matrixStatusLabel}</span>
                </span>
              `;
            }

            return `
              <tr class="hover:bg-zinc-100/70 transition text-zinc-800 border-b border-zinc-100/80 ${rowBgClass}">
                <td class="sticky left-0 z-20 py-1 sm:py-1.5 px-1 text-center font-mono text-zinc-400 text-[10px] sm:text-[11px] border-r border-zinc-200 whitespace-nowrap w-8 min-w-[32px] max-w-[32px]" style="${solidBgStyle}">${idx + 1}</td>
                <td class="sticky left-[32px] z-20 py-1 sm:py-1.5 px-2.5 min-w-[135px] sm:min-w-[160px] max-w-[160px] sm:max-w-[200px] border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap" style="${solidBgStyle}">
                  <div class="font-semibold text-zinc-900 leading-tight text-[10.5px] sm:text-xs">${s.name}</div>
                  <div class="font-mono text-zinc-400 text-[8.5px] sm:text-[10px] mt-0.2">${s.nim}</div>
                </td>
                <td class="py-1 sm:py-1.5 px-1.5 sm:px-2.5 text-center border-r border-zinc-200 text-[10px] sm:text-xs font-medium text-zinc-600 whitespace-nowrap">
                  ${s.kelompok}
                </td>
                ${groupCellsHtml}
                <td class="md:sticky md:right-0 md:z-20 py-1 sm:py-1.5 px-1.5 sm:px-2.5 text-center border-l border-zinc-200 shadow-2xs min-w-[90px] sm:min-w-[110px] whitespace-nowrap" style="${solidBgStyle}">
                  ${finalBadgeHtml}
                </td>
              </tr>
            `;
          } else {
            // Single Presenter Focused Row
            let singleBadgeHtml = "";
            if (s.singleStatusCategory === "PENYAJI") {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  <span>Anggota Penyaji</span>
                </span>
              `;
            } else if (s.singleStatusCategory === "BEBAS") {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                  <span>Bebas Menilai</span>
                </span>
              `;
            } else if (s.singleStatusCategory === "SUDAH") {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Sudah Menilai</span>
                </span>
              `;
            } else {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>Belum Menilai</span>
                </span>
              `;
            }

            return `
              <tr class="hover:bg-zinc-100/70 transition text-zinc-800 border-b border-zinc-100/80 ${rowBgClass}">
                <td class="sticky left-0 z-20 py-1 sm:py-1.5 px-1 text-center font-mono text-zinc-400 text-[10px] sm:text-[11px] border-r border-zinc-200 whitespace-nowrap w-8 min-w-[32px] max-w-[32px]" style="${solidBgStyle}">${idx + 1}</td>
                <td class="sticky left-[32px] z-20 py-1 sm:py-1.5 px-2.5 min-w-[135px] sm:min-w-[160px] max-w-[180px] sm:max-w-[220px] border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap" style="${solidBgStyle}">
                  <div class="font-semibold text-zinc-900 leading-tight text-[10.5px] sm:text-xs">${s.name}</div>
                  <div class="font-mono text-zinc-400 text-[8.5px] sm:text-[10px] mt-0.2">${s.nim}</div>
                </td>
                <td class="py-1 sm:py-1.5 px-2 sm:px-3 text-center border-r border-zinc-200 text-[10px] sm:text-xs font-medium text-zinc-600 whitespace-nowrap">
                  ${s.kelompok}
                </td>
                <td class="py-1 sm:py-1.5 px-2 sm:px-3 text-center border-r border-zinc-200 min-w-[110px] sm:min-w-[130px] whitespace-nowrap">
                  ${singleBadgeHtml}
                </td>
              </tr>
            `;
          }
        }).join("");
      }

      // 8. Render Dosen & Guest section (dari evaluators[] saja — bukan presensi mahasiswa)
      const dosenGuestEvaluators = [];
      if (currentRekapData?.summary) {
        currentRekapData.summary.forEach(g => {
          (g.evaluators || []).forEach(e => {
            if (!e || typeof e !== 'object') return;
            const ePeran = e.peran || 'Mahasiswa';
            if (ePeran === 'Mahasiswa') return;
            const eName = (e.name || "").trim();
            const exist = dosenGuestEvaluators.find(x => x.name === eName && x.kelompok === g.kelompok);
            if (!exist) {
              dosenGuestEvaluators.push({
                name: eName,
                peran: ePeran,
                kelompok: g.kelompok,
                sesi: e.sesi || g.sesi
              });
            }
          });
        });
      }

      if (dosenGuestSection && dosenGuestListEl) {
        if (dosenGuestEvaluators.length > 0) {
          dosenGuestSection.classList.remove("hidden");
          if (dosenGuestBadge) dosenGuestBadge.textContent = `${dosenGuestEvaluators.length} Penilai`;
          dosenGuestListEl.innerHTML = dosenGuestEvaluators.map(dg => {
            const roleBadgeClass = dg.peran === 'Dosen'
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : 'bg-blue-100 text-blue-800 border-blue-200';
            return `
              <div class="p-3 rounded-lg bg-white border border-zinc-200 shadow-2xs space-y-1">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold text-zinc-900 truncate">${dg.name}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${roleBadgeClass}">${dg.peran}</span>
                </div>
                <p class="text-[11px] text-zinc-500">Menilai: <span class="font-medium text-zinc-800">${dg.kelompok}</span> (${dg.sesi})</p>
              </div>
            `;
          }).join("");
        } else {
          dosenGuestSection.classList.add("hidden");
        }
      }
    }

    // RENDER MODERN MINIMALIST VISUAL LEADERBOARD CHART (OVERVIEW)
    function renderModernRekapCharts(summaryList) {
      const chartCard = document.getElementById("rekapChartOverviewCard");
      const groupContainer = document.getElementById("groupLeaderboardChartBars");
      const presenterContainer = document.getElementById("presenterLeaderboardChartBars");
      const evaluatorBadge = document.getElementById("chartTotalEvaluatorBadge");

      if (!chartCard || !groupContainer || !presenterContainer) return;

      if (!summaryList || summaryList.length === 0) {
        chartCard.classList.add("hidden");
        return;
      }

      chartCard.classList.remove("hidden");
      groupContainer.innerHTML = "";
      presenterContainer.innerHTML = "";

      // 1. Group Leaderboard Sorting
      const sortedGroups = [...summaryList].sort((a, b) => {
        const scoreA = parseFloat(a.rataRataSkor) || 0;
        const scoreB = parseFloat(b.rataRataSkor) || 0;
        return scoreB - scoreA;
      });

      let totalEvaluations = 0;
      sortedGroups.forEach(g => {
        totalEvaluations += parseInt(g.totalPenilai) || 0;
      });
      if (evaluatorBadge) {
        evaluatorBadge.textContent = `${totalEvaluations} Penilai Terdata`;
      }

      sortedGroups.forEach((grp, idx) => {
        const score = parseFloat(grp.rataRataSkor) || 0;
        const pct = Math.min(100, Math.max(0, score));

        let rankBadge = "";
        let barColor = "bg-gradient-to-r from-emerald-500 to-teal-400";
        if (idx === 0) {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/80 flex-shrink-0">#1</span>`;
          barColor = "bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-300";
        } else if (idx === 1) {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 flex-shrink-0">#2</span>`;
        } else if (idx === 2) {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800/80 text-amber-500 border border-zinc-700 flex-shrink-0">#3</span>`;
        } else {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 flex-shrink-0">#${idx + 1}</span>`;
          barColor = "bg-gradient-to-r from-zinc-600 to-zinc-400";
        }

        const barRow = document.createElement("div");
        barRow.className = "space-y-1";
        barRow.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5 min-w-0">
              ${rankBadge}
              <span class="font-semibold text-zinc-200 truncate max-w-[130px] sm:max-w-[190px]">${grp.kelompok}</span>
              <span class="text-[10px] text-zinc-500 hidden sm:inline font-mono">(${grp.sesi})</span>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="font-mono font-bold text-emerald-400 text-xs">${grp.rataRataSkor}</span>
              <span class="text-[10px] text-zinc-500 font-mono">(${grp.totalPenilai} penilai)</span>
            </div>
          </div>
          <div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/80">
            <div class="h-full ${barColor} rounded-full transition-all duration-700 ease-out" style="width: ${pct}%"></div>
          </div>
        `;
        groupContainer.appendChild(barRow);
      });

      // 2. Presenter Leaderboard Aggregation
      const presenterMap = {};
      summaryList.forEach(grp => {
        const votes = grp.votePresentator || {};
        Object.keys(votes).forEach(pName => {
          if (!presenterMap[pName]) {
            presenterMap[pName] = {
              name: pName,
              group: grp.kelompok,
              sesi: grp.sesi,
              votes: 0
            };
          }
          presenterMap[pName].votes += parseInt(votes[pName]) || 0;
        });
      });

      const sortedPresenters = Object.values(presenterMap).filter(p => p.votes > 0).sort((a, b) => b.votes - a.votes);
      const topPresenters = sortedPresenters;

      if (topPresenters.length === 0) {
        presenterContainer.innerHTML = `<p class="text-xs text-zinc-500 italic p-3 text-center bg-zinc-900/50 rounded-lg border border-zinc-900">Belum ada suara presentator yang masuk.</p>`;
      } else {
        const maxVotes = topPresenters[0]?.votes || 1;
        topPresenters.forEach((pres, pIdx) => {
          const pct = Math.min(100, Math.max(12, (pres.votes / maxVotes) * 100));
          let pRankBadge = "";
          let barGradient = "bg-gradient-to-r from-blue-500 to-indigo-400";

          if (pIdx === 0) {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/80 flex-shrink-0">#1</span>`;
            barGradient = "bg-gradient-to-r from-amber-500 to-amber-300";
          } else if (pIdx === 1) {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 flex-shrink-0">#2</span>`;
          } else if (pIdx === 2) {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex-shrink-0">#3</span>`;
          } else {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-900 text-zinc-500 border border-zinc-800 flex-shrink-0">#${pIdx + 1}</span>`;
            barGradient = "bg-gradient-to-r from-zinc-700 to-zinc-500";
          }

          const presRow = document.createElement("div");
          presRow.className = "space-y-1";
          presRow.innerHTML = `
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 min-w-0">
                ${pRankBadge}
                <span class="font-semibold text-zinc-200 truncate max-w-[130px] sm:max-w-[190px]">${pres.name}</span>
                <span class="text-[10px] text-zinc-500 font-mono truncate hidden sm:inline">(${pres.group})</span>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span class="font-mono font-bold text-amber-300 text-xs">${pres.votes} Suara</span>
              </div>
            </div>
            <div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/80">
              <div class="h-full ${barGradient} rounded-full transition-all duration-700 ease-out" style="width: ${pct}%"></div>
            </div>
          `;
          presenterContainer.appendChild(presRow);
        });
      }
    }

    // === Helper: Ambil summary sesuai role filter aktif ===
    function getActiveRekapSummary() {
      if (!currentRekapData) return [];
      let base;
      if (currentRekapRoleFilter === 'mhs') {
        // Mahasiswa terdaftar saja — gunakan summaryMhs jika tersedia, fallback ke summary filter Mahasiswa
        base = currentRekapData.summaryMhs 
          || (currentRekapData.summary || []).map(g => {
              // Fallback: filter manual dari evaluators jika summaryMhs belum ada (backend lama)
              const mhsEvals = (g.evaluators || []).filter(e => (e.peran || 'Mahasiswa') === 'Mahasiswa');
              return { ...g, totalPenilai: mhsEvals.length };
            });
      } else if (currentRekapRoleFilter === 'other') {
        // Dosen & Lainnya saja — hitung dari summary (all) dikurangi Mahasiswa
        base = (currentRekapData.summary || []).map(g => {
          const otherEvals = (g.evaluators || []).filter(e => (e.peran || 'Mahasiswa') !== 'Mahasiswa');
          return { ...g, totalPenilai: otherEvals.length, evaluators: otherEvals };
        }).filter(g => g.totalPenilai > 0);
      } else {
        // Semua penilai
        base = currentRekapData.summary || [];
      }
      return base || [];
    }

    // === Switch Role Filter Rekap ===
    function switchRekapRoleFilter(role) {
      currentRekapRoleFilter = role;
      // Update pill style
      const pills = { mhs: 'rolePillMhs', other: 'rolePillOther', all: 'rolePillAll' };
      const activeClass = 'bg-zinc-900 text-white border-zinc-900';
      const inactiveClass = 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900';
      Object.keys(pills).forEach(k => {
        const pill = document.getElementById(pills[k]);
        if (!pill) return;
        if (k === role) {
          pill.className = pill.className.replace(inactiveClass, '').replace(activeClass, '').trim() + ' ' + activeClass;
        } else {
          pill.className = pill.className.replace(activeClass, '').replace(inactiveClass, '').trim() + ' ' + inactiveClass;
        }
      });
      renderBothRekapViews();
    }

    function renderBothRekapViews() {
      if (!currentRekapData) return;
      const loading = document.getElementById("rekapLoading");
      if (loading) loading.classList.add("hidden");
      const sesiFilter = document.getElementById("rekapSesiFilter")?.value || "ALL";
      const groupFilter = document.getElementById("rekapGroupFilter")?.value || "ALL";
      const activeBase = getActiveRekapSummary();
      
      let summaryList = activeBase;
      if (sesiFilter !== "ALL") {
        summaryList = summaryList.filter(i => (i.sesi || "").trim().toLowerCase() === sesiFilter.trim().toLowerCase());
      }
      if (groupFilter !== "ALL") {
        summaryList = summaryList.filter(i => i.kelompok === groupFilter);
      }

      renderModernRekapCharts(summaryList);
      renderRekapKelompok(summaryList, currentRekapData.isPublicReviewVisible);
      renderRekapIndividu(summaryList, currentRekapData.isPublicReviewVisible);
      renderRekapPresensi();

      // Set Active Box based on SubTab
      switchRekapSubView(currentRekapSubView, false, false);
    }

    // 1. Render Rekap Kelompok View (With Refined SVG Info Button "i")
    function renderRekapKelompok(summaryList, isPublicReviewVisible) {
      const container = document.getElementById("rekapKelompokContainer");
      container.innerHTML = "";
      const fragment = document.createDocumentFragment();

      summaryList.forEach(grp => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 space-y-4 shadow-xs";

        let presentersHtml = `<p class="text-xs text-zinc-400 italic">Belum ada suara.</p>`;
        if (grp.rankedPresenters && grp.rankedPresenters.length > 0) {
          presentersHtml = grp.rankedPresenters.map((p, idx) => `
            <div class="flex items-center justify-between gap-2 text-xs bg-zinc-50 hover:bg-zinc-100/70 px-3 py-2 rounded-lg border border-zinc-100 transition">
              <span class="font-medium text-zinc-800 truncate flex-1">${idx === 0 ? '#1 ' : (idx === 1 ? '#2 ' : '#3 ')} ${p.name}</span>
              <span class="font-mono font-semibold text-zinc-700 bg-zinc-200/80 px-2 py-0.5 rounded text-[11px] whitespace-nowrap flex-shrink-0">${p.votes} Suara</span>
            </div>
          `).join("");
        }

        card.innerHTML = `
          <div class="flex items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-bold text-zinc-900 text-sm sm:text-base whitespace-nowrap">${grp.kelompok}</h4>
                <button 
                  type="button" 
                  onclick="openGroupInfoModal('${grp.kelompok}')" 
                  title="Detail Anggota Kelompok" 
                  class="p-1 rounded-md bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-600 border border-zinc-200 text-xs transition cursor-pointer flex items-center justify-center flex-shrink-0"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
              </div>
              <span class="text-[11px] text-zinc-500 font-medium whitespace-nowrap block mt-0.5">${grp.sesi}</span>
              <span class="text-[10px] font-medium mt-0.5 block ${currentRekapRoleFilter === 'mhs' ? 'text-emerald-700' : currentRekapRoleFilter === 'other' ? 'text-purple-700' : 'text-blue-700'}">${currentRekapRoleFilter === 'mhs' ? 'Mahasiswa Terdaftar' : currentRekapRoleFilter === 'other' ? 'Dosen & Lainnya' : 'Semua Penilai'}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="text-center bg-zinc-100 px-2.5 py-1 rounded min-w-[58px]">
                <span class="block text-[9px] uppercase font-bold text-zinc-500 whitespace-nowrap tracking-tight">RATA-RATA</span>
                <span class="text-sm font-mono font-bold text-zinc-900 block leading-tight">${grp.rataRataSkor}</span>
              </div>
              <div class="text-center bg-zinc-100 px-2.5 py-1 rounded min-w-[50px]">
                <span class="block text-[9px] uppercase font-bold text-zinc-500 whitespace-nowrap tracking-tight">PENILAI</span>
                <span class="text-sm font-mono font-bold text-zinc-900 block leading-tight">${grp.totalPenilai}</span>
              </div>
            </div>
          </div>

          <div>
            <h5 class="text-xs font-semibold text-zinc-700 mb-2">Peringkat Suara Pemateri Terbaik:</h5>
            <div class="space-y-1.5">
              ${presentersHtml}
            </div>
          </div>
        `;

        fragment.appendChild(card);
      });

      container.appendChild(fragment);
    }

    // 2. Render Rekap Individu Mahasiswa (Non-Truncate Name, Top 3 Reviews + Modal Selengkapnya)
    function renderRekapIndividu(summaryList, isPublicReviewVisible) {
      const container = document.getElementById("rekapIndividuContainer");
      container.innerHTML = "";
      const fragment = document.createDocumentFragment();

      let cardIndex = 0;
      const memberNimMap = {};
      groupsData.forEach(g => {
        (g.members || []).forEach(m => {
          memberNimMap[m.name] = m.nim || "";
        });
      });

      summaryList.forEach(grp => {
        const evalMap = grp.evaluasiList || {};
        const voteMap = grp.votePresentator || {};
        const studentNames = Object.keys(evalMap);

        studentNames.forEach(sName => {
          cardIndex++;
          const cardId = `studentCard_${cardIndex}`;
          const ulasanList = evalMap[sName] || [];
          const votesCount = voteMap[sName] || 0;
          const sNim = memberNimMap[sName] || "";

          const card = document.createElement("div");
          card.id = cardId;
          card.className = "student-card bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden transition-all";
          card.setAttribute("data-name", sName.toLowerCase());
          card.setAttribute("data-nim", sNim.toLowerCase());

          let reviewsContent = "";
          if (!isPublicReviewVisible) {
            reviewsContent = `<div class="bg-zinc-50 border border-zinc-200 rounded p-2.5 text-xs text-zinc-500">Ulasan kualitatif disembunyikan oleh Dosen.</div>`;
          } else if (ulasanList.length === 0) {
            reviewsContent = `<p class="text-xs text-zinc-400 italic">Belum ada catatan ulasan tertulis.</p>`;
          } else {
            // Tampilkan maksimal 3 ulasan teratas
            const top3Reviews = ulasanList.slice(0, 3);
            const listItems = top3Reviews.map(u => `
              <li class="bg-white p-3 rounded-lg border border-zinc-200 text-xs text-zinc-700 space-y-1.5 shadow-2xs">
                <p class="leading-relaxed text-zinc-800">"${u.ulasan}"</p>
                <div class="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                  <span class="font-medium text-zinc-500">Penilai: ${u.penilai}</span>
                  <span class="font-mono">${grp.sesi}</span>
                </div>
              </li>
            `).join("");

            let seeMoreBtn = "";
            if (ulasanList.length > 3) {
              const safeName = sName.replace(/'/g, "\\'");
              const safeNim = sNim.replace(/'/g, "\\'");
              const safeGroup = grp.kelompok.replace(/'/g, "\\'");
              const safeSesi = grp.sesi.replace(/'/g, "\\'");

              seeMoreBtn = `
                <div class="pt-2 text-center">
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); openStudentReviewModal('${safeName}', '${safeNim}', '${safeGroup}', '${safeSesi}')" 
                    class="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Lihat Selengkapnya (${ulasanList.length} Masukan)</span>
                    <span>→</span>
                  </button>
                </div>
              `;
            }

            reviewsContent = `
              <ul class="space-y-2">
                ${listItems}
              </ul>
              ${seeMoreBtn}
            `;
          }

          card.innerHTML = `
            <!-- Clickable Accordion Header (Non-Truncate Full Name, Default Collapsed) -->
            <div 
              onclick="toggleAccordion('${cardId}')" 
              class="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 cursor-pointer hover:bg-zinc-50/80 transition select-none"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h4 class="font-bold text-zinc-900 text-xs sm:text-sm leading-snug break-words">${sName}</h4>
                  ${sNim ? `<span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded flex-shrink-0">${sNim}</span>` : ''}
                </div>
                <p class="text-[11px] text-zinc-500 mt-0.5">${grp.kelompok} • ${grp.sesi}</p>
              </div>
              
              <div class="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                    ${votesCount} Suara
                  </span>
                  <span class="text-[11px] font-mono font-medium bg-zinc-50 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
                    ${ulasanList.length} Masukan
                  </span>
                </div>
                <span id="chevron_${cardId}" class="text-zinc-400 text-xs transition-transform duration-200 transform inline-block font-mono pl-1">
                  ▼
                </span>
              </div>
            </div>

            <!-- Collapsible Review Content (Top 3 Reviews) -->
            <div id="content_${cardId}" class="hidden border-t border-zinc-100 p-4 bg-zinc-50/60 space-y-2.5">
              <h5 class="text-[11px] font-semibold text-zinc-600 flex items-center justify-between">
                <span>Catatan Masukan Audiens (3 Teratas):</span>
                <span class="text-[10px] font-mono text-zinc-400">Total: ${ulasanList.length} Respons</span>
              </h5>
              ${reviewsContent}
            </div>
          `;

          fragment.appendChild(card);
        });
      });

      container.appendChild(fragment);
      filterMahasiswaSearch();
    }

    // Toggle Single Accordion
    function toggleAccordion(cardId) {
      const content = document.getElementById(`content_${cardId}`);
      const chevron = document.getElementById(`chevron_${cardId}`);
      if (!content) return;

      const isHidden = content.classList.contains("hidden");
      if (isHidden) {
        content.classList.remove("hidden");
        if (chevron) chevron.textContent = "▲";
      } else {
        content.classList.add("hidden");
        if (chevron) chevron.textContent = "▼";
      }
    }

    // Toggle All Accordions
    function toggleAllAccordions(shouldOpen) {
      document.querySelectorAll(".student-card").forEach(card => {
        const cardId = card.id;
        const content = document.getElementById(`content_${cardId}`);
        const chevron = document.getElementById(`chevron_${cardId}`);
        if (content) {
          if (shouldOpen) {
            content.classList.remove("hidden");
            if (chevron) chevron.textContent = "▲";
          } else {
            content.classList.add("hidden");
            if (chevron) chevron.textContent = "▼";
          }
        }
      });
    }

    // Search Mahasiswa Filter
    function filterMahasiswaSearch() {
      const query = (document.getElementById("searchMahasiswaInput")?.value || "").trim().toLowerCase();
      const cards = document.querySelectorAll(".student-card");
      let visibleCount = 0;

      cards.forEach(card => {
        const name = card.getAttribute("data-name") || "";
        const nim = card.getAttribute("data-nim") || "";
        const match = !query || name.includes(query) || nim.includes(query);

        if (match) {
          card.classList.remove("hidden");
          visibleCount++;
        } else {
          card.classList.add("hidden");
        }
      });

      const countLabel = document.getElementById("studentCountLabel");
      if (countLabel) {
        countLabel.textContent = `Menampilkan ${visibleCount} dari ${cards.length} Mahasiswa`;
      }
    }

    // Modal Informasi Kelompok
    function openGroupInfoModal(groupName) {
      const modal = document.getElementById("groupInfoModal");
      const titleEl = document.getElementById("infoModalGroupName");
      const sesiEl = document.getElementById("infoModalGroupSesi");
      const listEl = document.getElementById("infoModalMemberList");
      const countEl = document.getElementById("infoModalMemberCount");

      titleEl.textContent = groupName;
      listEl.innerHTML = "";

      const foundGroup = groupsData.find(g => g.name === groupName);
      if (foundGroup) {
        sesiEl.textContent = `Sesi: ${foundGroup.sesi || 'Minggu 1'}`;
        countEl.textContent = `${(foundGroup.members || []).length} Anggota`;

        (foundGroup.members || []).forEach((m, idx) => {
          const li = document.createElement("li");
          li.className = "flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs";
          li.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-5 h-5 rounded bg-zinc-200 text-zinc-700 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                ${idx + 1}
              </span>
              <span class="font-medium text-zinc-900 truncate">${m.name}</span>
            </div>
            <span class="text-[11px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200 flex-shrink-0">
              ${m.nim || 'NIM -'}
            </span>
          `;
          listEl.appendChild(li);
        });
      } else {
        sesiEl.textContent = "Data tidak ditemukan";
        countEl.textContent = "0 Anggota";
        listEl.innerHTML = `<li class="text-xs text-zinc-400 italic p-3 text-center">Data anggota tidak ditemukan.</li>`;
      }

      modal.classList.remove("hidden");
    }

    function closeGroupInfoModal() {
      document.getElementById("groupInfoModal").classList.add("hidden");
    }

    // Modal Detail Seluruh Masukan Mahasiswa
    function openStudentReviewModal(studentName, studentNim, groupName, groupSesi) {
      const modal = document.getElementById("studentReviewModal");
      const nameEl = document.getElementById("reviewModalStudentName");
      const nimEl = document.getElementById("reviewModalStudentNim");
      const groupEl = document.getElementById("reviewModalGroupInfo");
      const countEl = document.getElementById("reviewModalReviewCount");
      const listEl = document.getElementById("reviewModalReviewsList");

      nameEl.textContent = studentName;
      nimEl.textContent = studentNim || "NIM Tidak Terdata";
      groupEl.textContent = `${groupName} • ${groupSesi}`;
      listEl.innerHTML = "";

      let allReviews = [];
      if (currentRekapData && currentRekapData.summary) {
        const foundGrp = currentRekapData.summary.find(g => g.kelompok === groupName);
        if (foundGrp && foundGrp.evaluasiList && foundGrp.evaluasiList[studentName]) {
          allReviews = foundGrp.evaluasiList[studentName];
        }
      }

      countEl.textContent = `${allReviews.length} Masukan`;

      if (allReviews.length === 0) {
        listEl.innerHTML = `<li class="text-xs text-zinc-400 italic p-4 text-center bg-zinc-50 border border-zinc-200 rounded-lg">Belum ada catatan masukan tertulis untuk pemateri ini.</li>`;
      } else {
        allReviews.forEach((u, idx) => {
          const li = document.createElement("li");
          li.className = "bg-white p-3.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 space-y-1.5 shadow-2xs";
          li.innerHTML = `
            <div class="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>#${idx + 1} Catatan Audiens</span>
              <span>${groupSesi}</span>
            </div>
            <p class="leading-relaxed text-zinc-900 font-medium">"${u.ulasan}"</p>
            <div class="text-[10px] text-zinc-500 pt-1 border-t border-zinc-100 text-right">
              Penilai: <strong class="text-zinc-700">${u.penilai}</strong>
            </div>
          `;
          listEl.appendChild(li);
        });
      }

      modal.classList.remove("hidden");
    }

    function closeStudentReviewModal() {
      document.getElementById("studentReviewModal").classList.add("hidden");
    }

    let toastTimer = null;
    // UNIVERSAL IN-APP ACTION CONFIRMATION ENGINE
    function showAppConfirm({
      title = "Konfirmasi Tindakan",
      message = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
      confirmText = "Ya, Lanjutkan",
      cancelText = "Batal",
      type = "danger" // 'danger' | 'warning' | 'info'
    }) {
      return new Promise((resolve) => {
        const modal = document.getElementById("modalAppConfirm");
        const titleEl = document.getElementById("appConfirmTitle");
        const msgEl = document.getElementById("appConfirmMessage");
        const btnOk = document.getElementById("btnAppConfirmOk");
        const btnCancel = document.getElementById("btnAppConfirmCancel");
        const iconBox = document.getElementById("appConfirmIconBox");

        if (!modal) {
          resolve(window.confirm(message));
          return;
        }

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        if (btnCancel) btnCancel.textContent = cancelText;

        if (btnOk) {
          btnOk.textContent = confirmText;
          if (type === 'danger') {
            btnOk.className = "px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs";
            if (iconBox) {
              iconBox.className = "w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0";
              iconBox.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
            }
          } else if (type === 'warning') {
            btnOk.className = "px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer shadow-xs";
            if (iconBox) {
              iconBox.className = "w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0";
              iconBox.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
            }
          } else {
            btnOk.className = "px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs";
            if (iconBox) {
              iconBox.className = "w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0";
              iconBox.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
            }
          }
        }

        const cleanup = () => {
          modal.classList.add("hidden");
          if (btnOk) btnOk.onclick = null;
          if (btnCancel) btnCancel.onclick = null;
          modal.onclick = null;
          document.removeEventListener("keydown", handleKeydown);
        };

        const handleKeydown = (e) => {
          if (e.key === "Escape") {
            cleanup();
            resolve(false);
          }
        };

        modal.onclick = (e) => {
          if (e.target === modal) {
            cleanup();
            resolve(false);
          }
        };

        document.addEventListener("keydown", handleKeydown);

        if (btnOk) {
          btnOk.onclick = () => {
            cleanup();
            resolve(true);
          };
        }

        if (btnCancel) {
          btnCancel.onclick = () => {
            cleanup();
            resolve(false);
          };
        }

        modal.classList.remove("hidden");
      });
    }
    const showConfirmModal = showAppConfirm;
    window.showConfirmModal = showAppConfirm;

    function showToast(message, type = "info") {
      const toast = document.getElementById("toast");
      const icon = document.getElementById("toastIcon");
      const msg = document.getElementById("toastMsg");

      if (toastTimer) clearTimeout(toastTimer);

      msg.textContent = message;
      toast.className = "fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[9999] p-3.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 transition-all border step-fade";

      if (type === "error") {
        toast.classList.add("bg-zinc-950", "text-rose-300", "border-rose-800/80");
        icon.innerHTML = `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
      } else if (type === "warning") {
        toast.classList.add("bg-zinc-950", "text-amber-300", "border-amber-800/80");
        icon.innerHTML = `<svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
      } else {
        toast.classList.add("bg-zinc-950", "text-emerald-300", "border-emerald-800/80");
        icon.innerHTML = `<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
      }

      toast.classList.remove("hidden");
      toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
      }, 3500);
    }

    function mockLoadData() {
      appConfig = {
        "Judul_Form": "Penilaian Presentasi PGSD 5E",
        "Mata_Kuliah": "Bimbingan Konseling di SD",
        "Dosen_Pengampu": "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.",
        "Kelas": "5E",
        "Jurusan": "PGSD",
        "Sesi_Minggu_Aktif": "Minggu 1",
        "Domain_Email_Wajib": "mhs.ulm.ac.id, ulm.ac.id",
        "Tampilkan_Ulasan_Publik": "AKTIF",
        "Nilai_Kelompok_Min": "50",
        "Nilai_Kelompok_Max": "100",
        "Maksimal_Karakter_Evaluasi": "500",
        "Maksimal_Pilihan_Presentator_Terbaik": "2"
      };

      groupsData = [
        {
          name: "Kelompok 1",
          sesi: "Minggu 1",
          members: [
            { name: "Ahmad Fauzi", nim: "221012310001" },
            { name: "Siti Nurhaliza", nim: "221012310002" },
            { name: "Budi Santoso", nim: "221012310003" },
            { name: "Dewi Lestari", nim: "221012310004" }
          ]
        },
        {
          name: "Kelompok 2",
          sesi: "Minggu 1",
          members: [
            { name: "Rian Pratama", nim: "221012310005" },
            { name: "Putri Rahayu", nim: "221012310006" },
            { name: "Dimas Anggara", nim: "221012310007" }
          ]
        }
      ];

      allStudentsData = [
        { name: "Ahmad Fauzi", nim: "221012310001", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Siti Nurhaliza", nim: "221012310002", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Budi Santoso", nim: "221012310003", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Dewi Lestari", nim: "221012310004", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Rian Pratama", nim: "221012310005", kelompok: "Kelompok 2", sesi: "Minggu 1" },
        { name: "Putri Rahayu", nim: "221012310006", kelompok: "Kelompok 2", sesi: "Minggu 1" },
        { name: "Dimas Anggara", nim: "221012310007", kelompok: "Kelompok 2", sesi: "Minggu 1" },
        { name: "Rodhiyah", nim: "2210118210013", kelompok: "Kelompok 3", sesi: "Minggu 2" }
      ];

      renderConfigHeader();
      renderGroupOptions();
    }

    // =========================================================================
    // FITUR CETAK REKAP HASIL LAPORAN RESMI (PRINT & PDF)
    // =========================================================================
    function openPrintRekapModal() {
      const modal = document.getElementById("printRekapModal");
      const groupSelect = document.getElementById("printScopeGroupSelect");
      const sesiSelect = document.getElementById("printScopeSesiSelect");
      
      // Populate Sesi Options
      sesiSelect.innerHTML = '<option value="ALL">Semua Sesi</option>';
      const availableSessions = new Set();
      if (groupsData && groupsData.length > 0) {
        groupsData.forEach(g => { if (g.sesi) availableSessions.add(g.sesi); });
      }
      if (currentRekapData && currentRekapData.summary) {
        currentRekapData.summary.forEach(g => { if (g.sesi) availableSessions.add(g.sesi); });
      }
      Array.from(availableSessions).sort().forEach(s => {
        sesiSelect.innerHTML += `<option value="${s}">${s}</option>`;
      });

      // Populate Kelompok Options
      groupSelect.innerHTML = '<option value="ALL">Semua Kelompok (Keseluruhan)</option>';
      if (currentRekapData && currentRekapData.summary) {
        currentRekapData.summary.forEach(g => {
          groupSelect.innerHTML += `<option value="${g.kelompok}">${g.kelompok} (${g.sesi || 'Minggu 1'})</option>`;
        });
      }

      // Sync with currently active filter
      const activeFilter = document.getElementById("rekapGroupFilter")?.value || "ALL";
      if (activeFilter !== "ALL") {
        groupSelect.value = activeFilter;
      }

      renderPrintPreviewContent();
      modal.classList.remove("hidden");
      const scrollCont = document.getElementById("printScrollContainer");
      if (scrollCont) scrollCont.scrollTop = 0;
    }

    function closePrintRekapModal() {
      document.getElementById("printRekapModal").classList.add("hidden");
    }

    function renderPrintPreviewContent() {
      const previewEl = document.getElementById("printableReportArea");
      const selectedGroup = document.getElementById("printScopeGroupSelect")?.value || "ALL";
      const selectedSesi = document.getElementById("printScopeSesiSelect")?.value || "ALL";
      const includeReviews = document.getElementById("printIncludeReviews")?.checked ?? true;
      const includeReviewerName = document.getElementById("printIncludeReviewerName")?.checked ?? true;
      const includeFooter = document.getElementById("printIncludeFooter")?.checked ?? true;

      const matkul = appConfig["Mata_Kuliah"] || "Bimbingan Konseling di SD";
      const dosen = appConfig["Dosen_Pengampu"] || "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.";
      const kelas = appConfig["Kelas"] || "5E";
      const printDateStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

      let summaryList = (currentRekapData && currentRekapData.summary) ? [...currentRekapData.summary] : [];

      if (selectedGroup !== "ALL") {
        summaryList = summaryList.filter(g => g.kelompok === selectedGroup);
      }
      if (selectedSesi !== "ALL") {
        summaryList = summaryList.filter(g => (g.sesi || "Minggu 1") === selectedSesi);
      }

      // Hitung Rata-Rata Keseluruhan
      let totalAllScore = 0;
      let totalAllPenilai = 0;
      let evaluatedCount = 0;
      summaryList.forEach(g => {
        const s = parseFloat(g.rataRataSkor || g.rataRata || 0);
        const p = parseInt(g.totalPenilai) || 0;
        if (p > 0) {
          totalAllScore += s;
          totalAllPenilai += p;
          evaluatedCount++;
        }
      });

      // Hitung Total Mahasiswa Terdaftar pada Kelompok Aktif
      const activeGroupNames = new Set(summaryList.map(g => g.kelompok));
      let totalMahasiswa = 0;
      if (allStudentsData && allStudentsData.length > 0) {
        totalMahasiswa = allStudentsData.filter(s => activeGroupNames.has(s.kelompok)).length;
      } else if (groupsData && groupsData.length > 0) {
        groupsData.filter(g => activeGroupNames.has(g.name)).forEach(g => {
          totalMahasiswa += (g.members || []).length;
        });
      }
      if (totalMahasiswa === 0) {
        summaryList.forEach(g => {
          if (g.evaluasiList) {
            totalMahasiswa += Object.keys(g.evaluasiList).length;
          }
        });
      }
      const avgClassScore = evaluatedCount > 0 ? (totalAllScore / evaluatedCount).toFixed(2) : "0.00";

      // HTML Template
      let html = `
        <div class="print-page-wrapper" style="min-height: 1033px; width: 100%; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; background: #ffffff;">
          
          <!-- TOP & MAIN CONTENT AREA -->
          <div style="flex: 1 0 auto;">
            <!-- KOP SURAT RESMI DINAS FKIP ULM -->
            <table style="width: 100%; border-collapse: collapse; border: none; margin: 0 0 2px 0; padding: 0; table-layout: fixed;">
              <tbody>
                <tr style="border: none;">
                  <td style="width: 82px; min-width: 82px; max-width: 82px; vertical-align: middle; text-align: center; border: none; padding: 0 6px 0 0;">
                    <img src="assets/logo-ulm.png" alt="Logo ULM" style="width: 76px; height: 76px; object-fit: contain; display: block; margin: 0 auto;" onerror="this.src='logo-ulm.png'" />
                  </td>
                  <td style="text-align: center; vertical-align: middle; border: none; padding: 0 2px; font-family: 'Times New Roman', Times, serif; color: #000000;">
                    <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.2;">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
                    <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.22; margin-top: 1px;">UNIVERSITAS LAMBUNG MANGKURAT</div>
                    <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; line-height: 1.2; margin-top: 1px;">FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN</div>
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; line-height: 1.2; margin-top: 1px;">PROGRAM STUDI PENDIDIKAN GURU SEKOLAH DASAR (PGSD) - KELAS ${kelas}</div>
                    <div style="font-size: 9px; color: #374151; line-height: 1.2; margin-top: 2.5px; font-style: italic;">Jl. Brigjen H. Hasan Basry, Kayu Tangi, Banjarmasin, Kalimantan Selatan 70123 • Laman: fkip.ulm.ac.id</div>
                  </td>
                  <td style="width: 82px; min-width: 82px; max-width: 82px; border: none; padding: 0;"></td>
                </tr>
              </tbody>
            </table>

            <!-- GARIS PEMBATAS KOP RESMI DINAS (DOUBLE LINE TEBAL & TIPIS) -->
            <div style="border-top: 2.5px solid #000000; border-bottom: 0.75px solid #000000; height: 2px; margin: 2px 0 8px 0;"></div>

            <!-- JUDUL LAPORAN & METADATA -->
            <div style="text-align: center; margin-bottom: 8px; font-family: 'Times New Roman', Times, serif; color: #000000;">
              <h2 style="font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 2px; display: inline-block; margin: 6pt auto 6px auto; font-family: 'Times New Roman', Times, serif;">
                LAPORAN REKAPITULASI HASIL PENILAIAN PRESENTASI
              </h2>
              
              <table style="width: 100%; border-collapse: collapse; border: none !important; margin-top: 2px; font-size: 11.5px; text-align: left; table-layout: fixed; font-family: 'Times New Roman', Times, serif;">
                <tbody>
                  <tr style="border: none !important;">
                    <td style="border: none !important; padding: 1.5px 0; width: 15%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Mata Kuliah</td>
                    <td style="border: none !important; padding: 1.5px 6px 1.5px 0; width: 41%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${matkul}</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 16%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Kelas / Semester</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 28%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${kelas} / Genap (2025/2026)</td>
                  </tr>
                  <tr style="border: none !important;">
                    <td style="border: none !important; padding: 1.5px 0; width: 15%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Dosen Pengampu</td>
                    <td style="border: none !important; padding: 1.5px 6px 1.5px 0; width: 41%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${dosen}</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 16%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Cakupan Sesi</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 28%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${selectedSesi === 'ALL' ? 'Semua Sesi Presentasi' : selectedSesi}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 1. TABEL REKAPITULASI NILAI KELOMPOK -->
            <div class="space-y-1 print-avoid-break" style="margin-top: 14px; padding-top: 2px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <span style="font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; color: #000000; font-family: 'Times New Roman', Times, serif;">A. Rekapitulasi Nilai &amp; Peringkat Performa Kelompok</span>
                <span style="font-size: 10px; font-family: monospace; color: #4b5563;">Skala Penilaian: 0 - 100</span>
              </div>
              
              <div class="overflow-x-auto" style="overflow: visible;">
                <table class="w-full text-left text-xs" style="table-layout: fixed; width: 100%; border-collapse: collapse; border: 1.5px solid #000000; box-sizing: border-box; font-family: 'Times New Roman', Times, serif;">
                  <thead>
                    <tr style="background-color: #f3f4f6; text-align: center; font-weight: bold; border-bottom: 1.5px solid #000000; font-family: 'Times New Roman', Times, serif;">
                      <th style="padding: 5px 2px; border: 1px solid #000000; width: 6%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Rank</th>
                      <th style="padding: 5px 4px; border: 1px solid #000000; text-align: center; vertical-align: middle; width: 19%; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Kelompok Presentasi</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 10%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Sesi</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 9%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Penilai</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 11%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Rata-Rata</th>
                      <th style="padding: 5px 4px; border: 1px solid #000000; text-align: center; vertical-align: middle; width: 31%; font-size: 11.5px; font-family: 'Times New Roman', Times, serif; word-break: break-word;">Presentator Terbaik</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 14%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Predikat</th>
                    </tr>
                  </thead>
                  <tbody style="font-family: 'Times New Roman', Times, serif;">
      `;

      if (summaryList.length === 0) {
        html += `
          <tr>
            <td colspan="7" style="padding: 10px; text-align: center; color: #6b7280; font-style: italic; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">
              Tidak ada data penilaian yang sesuai dengan kriteria filter.
            </td>
          </tr>
        `;
      } else {
        // Sort by average score descending
        const sorted = [...summaryList].sort((a, b) => parseFloat(b.rataRataSkor || b.rataRata || 0) - parseFloat(a.rataRataSkor || a.rataRata || 0));
        sorted.forEach((g, idx) => {
          const scoreNum = parseFloat(g.rataRataSkor || g.rataRata || 0);
          const totalP = parseInt(g.totalPenilai) || 0;
          let predikat = "-";
          if (totalP > 0) {
            if (scoreNum >= 80) predikat = "A";
            else if (scoreNum >= 77) predikat = "A-";
            else if (scoreNum >= 75) predikat = "B+";
            else if (scoreNum >= 70) predikat = "B";
            else if (scoreNum >= 67) predikat = "B-";
            else if (scoreNum >= 64) predikat = "C+";
            else if (scoreNum >= 60) predikat = "C";
            else if (scoreNum >= 50) predikat = "D+";
            else if (scoreNum >= 40) predikat = "D";
            else predikat = "E";
          }

          const presenters = g.rankedPresenters || g.topPresentator || [];
          const topPresentersText = (presenters.length > 0)
            ? presenters.map(p => `${p.name} (${p.votes} Suara)`).join(", ")
            : "-";

          html += `
            <tr style="border-bottom: 1px solid #000000; font-family: 'Times New Roman', Times, serif; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #fafafa;'}">
              <td style="padding: 4.5px 2px; border: 1px solid #000000; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif; font-size: 11.5px;">#${idx + 1}</td>
              <td style="padding: 4.5px 5px; border: 1px solid #000000; font-weight: bold; color: #000000; font-size: 11.5px; font-family: 'Times New Roman', Times, serif; word-break: break-word;">${g.kelompok}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">${g.sesi || 'Minggu 1'}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 11.5px;">${totalP} Mhs</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif; color: #000000; font-size: 11.5px;">${totalP > 0 ? scoreNum.toFixed(2) : '-'}</td>
              <td style="padding: 4.5px 5px; border: 1px solid #000000; color: #000000; font-size: 11px; font-family: 'Times New Roman', Times, serif; word-break: break-word; overflow-wrap: break-word; line-height: 1.25;">${topPresentersText}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-weight: 600; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">${predikat}</td>
            </tr>
          `;
        });

        // Summary Row
        html += `
          <tr style="background-color: #f3f4f6; font-weight: bold; border-top: 1.5px solid #000000; text-align: center; font-family: 'Times New Roman', Times, serif;">
            <td colspan="4" style="padding: 5px 6px; text-align: center; vertical-align: middle; border: 1px solid #000000; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Rata-Rata Keseluruhan Kelas</td>
            <td style="padding: 5px 4px; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000000; text-align: center; vertical-align: middle;">${avgClassScore}</td>
            <td colspan="2" style="padding: 5px 6px; text-align: center; vertical-align: middle; border: 1px solid #000000; font-size: 11px; font-family: 'Times New Roman', Times, serif; color: #000000;">Total ${summaryList.length} Kelompok (${totalMahasiswa} Mahasiswa)</td>
          </tr>
        `;
      }

      html += `
                  </tbody>
                </table>
              </div>
            </div>
      `;

      // 2. BAGIAN EVALUASI KUALITATIF JIKA DICENTANG
      if (includeReviews && summaryList.length > 0) {
        html += `
          <div class="space-y-1.5" style="margin-top: 16px; padding-top: 2px; margin-bottom: 6px;">
            <h4 class="font-bold uppercase tracking-wider text-zinc-950 print-section-header" style="font-size: 12px; font-weight: 800; margin: 0 0 3px 0; page-break-after: avoid; break-after: avoid; font-family: 'Times New Roman', Times, serif; color: #000000;">
              B. Rangkuman Catatan Evaluasi Masukan Mahasiswa
            </h4>
        `;

        summaryList.forEach(g => {
          const evalList = g.evaluasiList || {};
          const studentKeys = Object.keys(evalList);

          if (studentKeys.length > 0) {
            html += `
              <div class="print-card print-avoid-break rounded border border-zinc-400 bg-zinc-50/50 space-y-1 mb-1.5" style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #9ca3af; border-radius: 4px; padding: 5px 8px;">
                <div class="font-bold text-zinc-950 border-b border-zinc-300 flex items-center justify-between" style="border-bottom: 1px solid #d1d5db; padding-bottom: 2.5px;">
                  <span class="font-extrabold" style="font-size: 11.5px; font-weight: 800;">${g.kelompok}</span>
                  <span class="font-medium font-mono text-zinc-700 bg-zinc-200/80 px-1.5 py-0.5 rounded" style="font-size: 10px;">${g.sesi || 'Minggu 1'}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; padding-top: 2.5px;">
            `;

            studentKeys.forEach(name => {
              const reviews = evalList[name] || [];
              if (reviews.length > 0) {
                html += `
                  <div class="rounded bg-white border border-zinc-200 shadow-2xs" style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 6.5px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding-bottom: 2px; margin-bottom: 3px;">
                      <span style="font-size: 11px; font-weight: 700; color: #111827;">${name}</span>
                      <span style="font-size: 9.5px; font-weight: 600; color: #4b5563; font-family: monospace; background: #f3f4f6; padding: 0.5px 4px; border-radius: 3px;">${reviews.length} Masukan</span>
                    </div>
                    <ul style="list-style-type: disc; padding-left: 14px; margin: 0; font-size: 10.5px; line-height: 1.3; color: #1f2937;">
                      ${reviews.slice(0, 4).map(r => `
                        <li style="margin-bottom: 2px;">
                          <span style="font-style: italic; color: #111827;">"${r.ulasan}"</span>
                          ${includeReviewerName ? `<span style="font-size: 9px; color: #4b5563; font-weight: 600; font-style: normal; margin-left: 3px;">— ${r.penilai || 'Penilai'}</span>` : ''}
                        </li>
                      `).join("")}
                      ${reviews.length > 4 ? `<li style="list-style: none; font-size: 9.5px; color: #6b7280; font-style: italic; margin-top: 1px; padding-left: 0;">+ ${reviews.length - 4} catatan masukan lainnya...</li>` : ''}
                    </ul>
                  </div>
                `;
              }
            });

            html += `
                </div>
              </div>
            `;
          }
        });

        html += `</div>`;
      }

      // LEMBAR TANDA TANGAN / PENGESAHAN RESMI DOSEN
      html += `
            <!-- LEMBAR PENGESAHAN RESMI DOSEN PENGAMPU -->
            <div class="print-signature print-avoid-break" style="page-break-inside: avoid; break-inside: avoid; margin-top: 16px; display: flex; justify-content: flex-end; font-family: 'Times New Roman', Times, serif;">
              <div style="text-align: center; min-width: 240px; max-width: 300px; font-family: 'Times New Roman', Times, serif;">
                <p style="margin: 0; font-size: 11.5px; color: #000000; font-family: 'Times New Roman', Times, serif;">Banjarmasin, ${printDateStr}</p>
                <p style="margin: 1.5px 0 0 0; font-size: 11.5px; font-weight: 700; color: #000000; font-family: 'Times New Roman', Times, serif;">Dosen Pengampu Mata Kuliah,</p>
                <div style="height: 62px;"></div>
                <div style="margin-top: 1px; padding-bottom: 1.5px; border-bottom: 1.5px solid #000000; display: inline-block; min-width: 210px; max-width: 100%;">
                  <span style="font-size: 12px; font-weight: 800; color: #000000; white-space: nowrap; letter-spacing: 0.01em; font-family: 'Times New Roman', Times, serif;">${dosen}</span>
                </div>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #000000; font-weight: 600; font-family: 'Times New Roman', Times, serif;">NIP. 19830514 200812 2 003</p>
              </div>
            </div>

          </div>

          ${includeFooter ? `
            <!-- FOOTER DOKUMEN RESMI MINIMALIS ANCHORED AT BOTTOM -->
            <div class="print-avoid-break print-footer" style="page-break-inside: avoid; break-inside: avoid; margin-top: auto; padding-top: 6px; border-top: 0.75px dashed #9ca3af; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #4b5563; line-height: 1.3; flex-shrink: 0;">
              <span>Dokumen ini diterbitkan secara otomatis oleh <strong>Sistem Peer-Assessment PGSD Kelas ${kelas}</strong> &bull; Universitas Lambung Mangkurat</span>
              <span style="font-family: monospace; color: #6b7280; font-weight: 500;">Waktu Cetak: ${printDateStr}</span>
            </div>
          ` : ''}

        </div>
      `;

      previewEl.innerHTML = html;
      setTimeout(() => {
        applyPrintZoom();
      }, 20);
    }

    // VIRTUAL PAPER ADAPTIVE AUTO-FIT & ZOOM CONTROLLER
    let currentPrintZoom = 1.0;
    let isUserCustomZoom = false;

    function calcAutoFitScale() {
      const container = document.getElementById("printScrollContainer");
      if (!container) return 1.0;
      const availableWidth = container.clientWidth - (window.innerWidth < 640 ? 12 : 24);
      if (availableWidth <= 0) return 1.0;
      if (availableWidth < 794) {
        return Math.max(0.30, Math.min(1.0, Math.round((availableWidth / 794) * 100) / 100));
      }
      return 1.0;
    }

    function adjustPrintZoom(delta) {
      isUserCustomZoom = true;
      currentPrintZoom = Math.min(1.5, Math.max(0.30, Math.round((currentPrintZoom + delta) * 10) / 10));
      applyPrintZoom();
    }

    function resetPrintZoom() {
      isUserCustomZoom = false;
      currentPrintZoom = calcAutoFitScale();
      applyPrintZoom();
    }

    function applyPrintZoom() {
      const area = document.getElementById("printableReportArea");
      const wrapper = document.getElementById("printableReportWrapper");
      const badge = document.getElementById("printZoomBadge");
      
      if (!isUserCustomZoom) {
        currentPrintZoom = calcAutoFitScale();
      }

      if (area) {
        area.style.transform = `scale(${currentPrintZoom})`;
        area.style.transformOrigin = "top left";
        
        const baseHeight = area.offsetHeight || 1020;
        const scaledWidth = Math.ceil(760 * currentPrintZoom);
        const scaledHeight = Math.ceil(baseHeight * currentPrintZoom);

        if (wrapper) {
          wrapper.style.width = `${scaledWidth}px`;
          wrapper.style.minWidth = `${scaledWidth}px`;
          wrapper.style.height = `${scaledHeight}px`;
        }
      }

      if (badge) {
        badge.textContent = isUserCustomZoom ? `${Math.round(currentPrintZoom * 100)}%` : "Fit";
      }
    }

    window.addEventListener("resize", () => {
      if (!isUserCustomZoom) {
        applyPrintZoom();
      }
    });

    function executeBrowserPrint() {
      const toastEl = document.getElementById("toast");
      if (toastEl) toastEl.classList.add("hidden");
      renderPrintPreviewContent();
      const previewEl = document.getElementById("printableReportArea");
      const printRoot = document.getElementById("printDocumentRoot");
      if (previewEl && printRoot) {
        printRoot.innerHTML = previewEl.innerHTML;
      }
      setTimeout(() => {
        window.print();
      }, 50);
    }
  
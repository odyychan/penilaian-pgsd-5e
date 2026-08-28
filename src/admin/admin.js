
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

    // =========================================================================
    // UNIVERSAL IN-PLACE RICH TEXT DISPLAY ENGINE (WYSIWYG IN-PLACE FORMATTING)
    // =========================================================================
    function syncInPlaceRichField(inputEl) {
      if (!inputEl) return;
      if (inputEl.id === 'textUniversalScriptCode' || inputEl.id === 'backupJsonTextarea' || inputEl.id === 'inputPassword' || inputEl.id === 'hubSearchFormsInput') return;

      const container = inputEl.parentElement;
      if (!container) return;

      const targetId = inputEl.id || '';
      let displayEl = targetId ? container.querySelector(`:scope > .in-place-rich-display[data-for="${targetId}"]`) : null;
      const val = (inputEl.value || '').trim();
      const hasRichFormat = isFormatOrMathPresent(val);

      if (!displayEl && targetId) {
        displayEl = document.createElement('div');
        displayEl.setAttribute('data-for', targetId);
        displayEl.setAttribute('title', 'Klik untuk mengedit');
        displayEl.className = 'in-place-rich-display cursor-pointer hover:cursor-text select-text leading-relaxed transition-all duration-150 group/richDisplay relative hidden';

        // Match typography and input border affordance based on target input
        if (targetId === 'cfg_Judul_Form') {
          displayEl.className += ' text-lg sm:text-2xl font-extrabold text-zinc-900 border-b-2 border-dashed border-zinc-300 hover:border-indigo-600 pb-1 sm:pb-1.5 leading-tight';
        } else if (targetId === 'cfg_Deskripsi_Form') {
          displayEl.className += ' text-xs sm:text-sm text-zinc-700 bg-zinc-50/50 hover:bg-zinc-100/80 border-b-2 border-dashed border-zinc-300 hover:border-indigo-600 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-t-lg';
        } else if (targetId.startsWith('alurTitleInput_') || targetId.startsWith('stageTitleInput_')) {
          displayEl.className += ' font-bold text-zinc-900 text-xs sm:text-sm border-b border-dashed border-zinc-300 hover:border-indigo-600 px-1 py-0.5 rounded hover:bg-zinc-50/70';
        } else if (targetId.startsWith('alurDescInput_') || targetId.startsWith('stageDescInput_')) {
          displayEl.className += ' text-[11px] text-zinc-600 border-b border-dashed border-zinc-200 hover:border-indigo-400 px-1 py-0.5 rounded hover:bg-zinc-50/70';
        } else if (targetId.startsWith('fieldLabelInput_')) {
          displayEl.className += ' text-xs sm:text-sm font-semibold text-zinc-900 border-b-2 border-dashed border-zinc-300 hover:border-indigo-600 px-2 py-1.5 bg-zinc-50/40 hover:bg-zinc-100/70 rounded-t-lg';
        } else if (targetId.startsWith('fieldDescInput_')) {
          displayEl.className += ' text-xs text-zinc-500 border-b border-dashed border-zinc-200 hover:border-indigo-400 px-2 py-1 rounded hover:bg-zinc-50/70';
        } else {
          displayEl.className += ' text-xs sm:text-sm text-zinc-700 border-b border-dashed border-zinc-300 hover:border-indigo-500 px-1 py-0.5 rounded hover:bg-zinc-50/70';
        }

        displayEl.addEventListener('click', () => {
          displayEl.classList.add('hidden');
          inputEl.classList.remove('hidden');
          inputEl.focus();
          autoResizeTextarea(inputEl);
        });

        inputEl.insertAdjacentElement('afterend', displayEl);
      }

      const isFocused = document.activeElement === inputEl;

      if (displayEl) {
        if (hasRichFormat && !isFocused && val !== '') {
          const editBadgeHtml = '<span class="opacity-0 group-hover/richDisplay:opacity-100 transition-opacity absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-zinc-900/90 text-white text-[9.5px] font-mono font-bold flex items-center gap-1 shadow-xs pointer-events-none select-none z-10">✏️ Klik untuk edit</span>';
          displayEl.innerHTML = smartMathFormat(val) + editBadgeHtml;
          renderAllMathInElement(displayEl);
          displayEl.classList.remove('hidden');
          inputEl.classList.add('hidden');
        } else {
          displayEl.classList.add('hidden');
          inputEl.classList.remove('hidden');
        }
      }
    }

    function initAllInPlaceRichFields(root = document) {
      if (!root) return;
      const elements = root.querySelectorAll('textarea, input[type="text"]');
      elements.forEach(el => {
        if (isMathEligibleInput(el)) {
          syncInPlaceRichField(el);
        }
      });
    }

    function updateLiveMathBadge(val, badgeId) {
      let inputEl = null;
      if (badgeId.startsWith('liveMathAlurTitle_')) {
        const idx = badgeId.replace('liveMathAlurTitle_', '');
        inputEl = document.getElementById(`alurTitleInput_${idx}`);
      } else if (badgeId.startsWith('liveMathAlurDesc_')) {
        const idx = badgeId.replace('liveMathAlurDesc_', '');
        inputEl = document.getElementById(`alurDescInput_${idx}`);
      } else if (badgeId.startsWith('liveMathQuestionLabel_')) {
        const parts = badgeId.replace('liveMathQuestionLabel_', '');
        inputEl = document.getElementById(`fieldLabelInput_${parts}`);
      } else if (badgeId.startsWith('liveMathQuestionDesc_')) {
        const parts = badgeId.replace('liveMathQuestionDesc_', '');
        inputEl = document.getElementById(`fieldDescInput_${parts}`);
      } else if (badgeId.startsWith('liveMathStageTitle_')) {
        const idx = badgeId.replace('liveMathStageTitle_', '');
        inputEl = document.getElementById(`stageTitleInput_${idx}`);
      } else if (badgeId.startsWith('liveMathStageDesc_')) {
        const idx = badgeId.replace('liveMathStageDesc_', '');
        inputEl = document.getElementById(`stageDescInput_${idx}`);
      } else if (badgeId === 'liveMathCfgJudul') {
        inputEl = document.getElementById('cfg_Judul_Form');
      } else if (badgeId === 'liveMathCfgDesc') {
        inputEl = document.getElementById('cfg_Deskripsi_Form');
      }

      if (inputEl) {
        syncInPlaceRichField(inputEl);
      }
    }

    // Returns empty string to completely eliminate duplicate preview badges below inputs
    function getLiveMathBadgeHtml(rawText, containerId) {
      return '';
    }

    // =========================================================================
    // UNIVERSAL GOOGLE FORMS RICH TEXT FORMATTER (B, I, U, Link, Remove Format, Math)
    // =========================================================================
        function applyUniversalTextFormat(inputSelector, formatType, callback) {
      const input = typeof inputSelector === 'string' ? document.querySelector(inputSelector) : inputSelector;
      if (!input) return;

      const start = typeof input.selectionStart === 'number' ? input.selectionStart : 0;
      const end = typeof input.selectionEnd === 'number' ? input.selectionEnd : 0;
      const val = input.value || "";

      pushUndoSnapshot(`Format Teks (${formatType})`);

      // 1. Line-based Transformations: Bullet, Number, Alphabet, Indent, Outdent
      if (['bullet', 'number', 'alpha', 'indent', 'outdent'].includes(formatType)) {
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = val.indexOf('\n', end);
        if (lineEnd === -1) lineEnd = val.length;

        const targetBlock = val.substring(lineStart, lineEnd);
        const lines = targetBlock.split('\n');
        let newLines = [];

        if (formatType === 'bullet') {
          const allBulleted = lines.every(l => /^\s*[•◦▪▫\-\*]\s+/.test(l));
          if (allBulleted) {
            newLines = lines.map(l => l.replace(/^(\s*)[•◦▪▫\-\*]\s+/, '$1'));
          } else {
            newLines = lines.map(l => {
              const cleaned = l.replace(/^(\s*)(?:[•◦▪▫\-\*]|(?:\d+|[A-Za-z]|[ivxlcdm]+)[\.\)])\s+/, '$1');
              const leadingSpaces = cleaned.match(/^\s*/)[0];
              const textContent = cleaned.substring(leadingSpaces.length);
              const symbol = leadingSpaces.length >= 4 ? '▪' : (leadingSpaces.length >= 2 ? '◦' : '•');
              return `${leadingSpaces}${symbol} ${textContent}`;
            });
          }
        } else if (formatType === 'number') {
          const allNumbered = lines.every(l => /^\s*\d+\.\s+/.test(l));
          if (allNumbered) {
            newLines = lines.map(l => l.replace(/^(\s*)\d+\.\s+/, '$1'));
          } else {
            let num = 1;
            newLines = lines.map(l => {
              const cleaned = l.replace(/^(\s*)(?:[•◦▪▫\-\*]|(?:\d+|[A-Za-z]|[ivxlcdm]+)[\.\)])\s+/, '$1');
              const leadingSpaces = cleaned.match(/^\s*/)[0];
              const textContent = cleaned.substring(leadingSpaces.length);
              return `${leadingSpaces}${num++}. ${textContent}`;
            });
          }
        } else if (formatType === 'alpha') {
          const allAlpha = lines.every(l => /^\s*[A-Za-z]\.\s+/.test(l));
          if (allAlpha) {
            newLines = lines.map(l => l.replace(/^(\s*)[A-Za-z]\.\s+/, '$1'));
          } else {
            let charCode = 65; // 'A'
            newLines = lines.map(l => {
              const cleaned = l.replace(/^(\s*)(?:[•◦▪▫\-\*]|(?:\d+|[A-Za-z]|[ivxlcdm]+)[\.\)])\s+/, '$1');
              const leadingSpaces = cleaned.match(/^\s*/)[0];
              const textContent = cleaned.substring(leadingSpaces.length);
              const letter = String.fromCharCode(charCode++);
              return `${leadingSpaces}${letter}. ${textContent}`;
            });
          }
        } else if (formatType === 'indent') {
          newLines = lines.map(l => `  ${l}`);
        } else if (formatType === 'outdent') {
          newLines = lines.map(l => {
            if (l.startsWith('  ')) return l.substring(2);
            if (l.startsWith(' ')) return l.substring(1);
            if (l.startsWith('\t')) return l.substring(1);
            return l;
          });
        }

        const replacement = newLines.join('\n');
        input.value = val.substring(0, lineStart) + replacement + val.substring(lineEnd);
        input.focus();
        const newCursor = lineStart + replacement.length;
        input.setSelectionRange(newCursor, newCursor);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof callback === 'function') callback(input.value);
        return;
      }

      // 2. Inline Text Formatting
      const selected = val.substring(start, end);
      let replacement = "";
      let cursorOffset = 0;

      if (formatType === 'bold') {
        if (selected) {
          if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
            replacement = selected.slice(2, -2);
          } else {
            replacement = `**${selected}**`;
          }
          cursorOffset = replacement.length;
        } else {
          replacement = `****`;
          cursorOffset = 2; // Place cursor right between ** and **
        }
      } else if (formatType === 'italic') {
        if (selected) {
          if (selected.startsWith('*') && selected.endsWith('*') && selected.length >= 2 && !selected.startsWith('**')) {
            replacement = selected.slice(1, -1);
          } else {
            replacement = `*${selected}*`;
          }
          cursorOffset = replacement.length;
        } else {
          replacement = `**`;
          cursorOffset = 1; // Place cursor right between * and *
        }
      } else if (formatType === 'underline') {
        if (selected) {
          if (selected.startsWith('<u>') && selected.endsWith('</u>') && selected.length >= 7) {
            replacement = selected.slice(3, -4);
          } else {
            replacement = `<u>${selected}</u>`;
          }
          cursorOffset = replacement.length;
        } else {
          replacement = `<u></u>`;
          cursorOffset = 3; // Place cursor right between <u> and </u>
        }
      } else if (formatType === 'link') {
        openInsertLinkModal(input, start, end, selected);
        return;
      } else if (formatType === 'remove_format') {
        const cleanText = (str) => {
          return str
            .replace(/^(\s*)(?:[•◦▪▫\-\*]|(?:\d+|[A-Za-z]|[ivxlcdm]+)[\.\)])\s+/gm, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/(^|[^\*])\*([^*]+)\*([^\*]|$)/g, '$1$2$3')
            .replace(/<u>([^<]+)<\/u>/gi, '$1')
            .replace(/<b>([^<]+)<\/b>/gi, '$1')
            .replace(/<i>([^<]+)<\/i>/gi, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\$([^\$]+)\$/g, '$1');
        };

        if (selected) {
          replacement = cleanText(selected);
          cursorOffset = replacement.length;
        } else {
          input.value = cleanText(val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          if (typeof callback === 'function') callback(input.value);
          showAdminToast("Format teks dan poin dibersihkan.", "info");
          return;
        }
      }

      input.value = val.substring(0, start) + replacement + val.substring(end);
      input.focus();
      const newCursor = start + cursorOffset;
      input.setSelectionRange(newCursor, newCursor);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      if (typeof callback === 'function') {
        callback(input.value);
      }
    }

        // =========================================================================
    // IN-APP LINK INSERTION CONTROLLERS (ZERO NATIVE PROMPTS)
    // =========================================================================
    let pendingLinkContext = null;

    function openInsertLinkModal(targetInput, start, end, selectedText) {
      pendingLinkContext = {
        input: targetInput,
        start: typeof start === 'number' ? start : 0,
        end: typeof end === 'number' ? end : 0,
        selected: selectedText || ""
      };

      const displayInput = document.getElementById("inputLinkDisplayText");
      const urlInput = document.getElementById("inputLinkUrl");

      if (displayInput) displayInput.value = selectedText || "Tautan Website";
      if (urlInput) urlInput.value = "https://";

      document.getElementById("modalInsertLink")?.classList.remove("hidden");

      setTimeout(() => {
        if (!selectedText && displayInput) {
          displayInput.focus();
          displayInput.select();
        } else if (urlInput) {
          urlInput.focus();
          urlInput.setSelectionRange(8, 8); // after https://
        }
      }, 60);
    }

    function closeInsertLinkModal() {
      document.getElementById("modalInsertLink")?.classList.add("hidden");
      if (pendingLinkContext?.input) {
        pendingLinkContext.input.focus();
      }
      pendingLinkContext = null;
    }

    function applyInsertLinkFromModal() {
      if (!pendingLinkContext || !pendingLinkContext.input) {
        closeInsertLinkModal();
        return;
      }

      const { input, start, end } = pendingLinkContext;
      const displayInput = document.getElementById("inputLinkDisplayText");
      const urlInput = document.getElementById("inputLinkUrl");

      let text = (displayInput?.value || "").trim() || "Tautan";
      let url = (urlInput?.value || "").trim();

      if (!url || url === "https://" || url === "http://") {
        showAdminToast("Masukkan alamat URL tautan yang valid.", "warning");
        urlInput?.focus();
        return;
      }

      if (!/^https?:\/\//i.test(url) && !url.startsWith('/') && !url.startsWith('#')) {
        url = 'https://' + url;
      }

      const val = input.value || "";
      const replacement = `[${text}](${url})`;

      pushUndoSnapshot('Sisipkan Tautan');
      input.value = val.substring(0, start) + replacement + val.substring(end);
      input.focus();
      const newCursor = start + replacement.length;
      input.setSelectionRange(newCursor, newCursor);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      closeInsertLinkModal();
      showAdminToast("Tautan berhasil disisipkan!", "success");
    }

    function handleUniversalMathButtonClick(targetInputId) {
      const input = document.getElementById(targetInputId) || document.querySelector(targetInputId);
      if (!input) {
        toggleUniversalMathPalette(targetInputId);
        return;
      }

      const start = typeof input.selectionStart === 'number' ? input.selectionStart : 0;
      const end = typeof input.selectionEnd === 'number' ? input.selectionEnd : 0;
      const val = input.value || "";
      const selected = val.substring(start, end);

      // If text is blocked / selected by user:
      if (selected && selected.trim()) {
        pushUndoSnapshot('Format Rumus Matematika');
        let formattedMath = "";
        const trimmed = selected.trim();
        
        if (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length >= 2) {
          // Unwrap if already wrapped
          formattedMath = trimmed.slice(1, -1);
        } else {
          // Wrap into KaTeX formula
          formattedMath = `$${trimmed}$`;
        }

        input.value = val.substring(0, start) + formattedMath + val.substring(end);
        input.focus();
        const newCursor = start + formattedMath.length;
        input.setSelectionRange(newCursor, newCursor);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        showAdminToast("Teks terpilih berhasil diubah menjadi rumus matematika KaTeX!", "success");
        return;
      }

      // If NO text selected: toggle the compact floating popover/overlay!
      toggleUniversalMathPalette(targetInputId);
    }

    function toggleUniversalMathPalette(targetInputId) {
      const palette = document.getElementById(`quickMathPalette_${targetInputId}`);
      if (!palette) return;

      // Close all other open palettes first
      document.querySelectorAll('.math-floating-palette').forEach(p => {
        if (p.id !== `quickMathPalette_${targetInputId}`) p.classList.add("hidden");
      });

      palette.classList.toggle("hidden");
    }

    function insertUniversalMathSymbol(inputSelector, symbol, callback) {
      const input = typeof inputSelector === 'string' ? document.querySelector(inputSelector) : inputSelector;
      if (!input) return;

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const val = input.value || "";

      let insertVal = symbol;
      if (symbol === '$...$') {
        const selected = val.substring(start, end) || 'x';
        insertVal = `$${selected}$`;
      }

      input.value = val.substring(0, start) + insertVal + val.substring(end);
      input.focus();
      input.setSelectionRange(start + insertVal.length, start + insertVal.length);
      input.dispatchEvent(new Event('input', { bubbles: true }));

      if (typeof callback === 'function') {
        callback(input.value);
      }
    }

    // =========================================================================
    // UNIVERSAL FLOATING BOTTOM FORMATTING TOOLBAR ENGINE (FIXED CENTER BOTTOM OVERLAY)
    // =========================================================================
    let currentActiveFormInput = null;
    let floatingToolbarHideTimeout = null;

    function isMathEligibleInput(el) {
      if (!el) return false;
      const tag = el.tagName ? el.tagName.toUpperCase() : '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
      if (tag === 'INPUT') {
        const type = (el.type || 'text').toLowerCase();
        if (['checkbox', 'radio', 'button', 'submit', 'file', 'hidden', 'password'].includes(type)) return false;
        if (el.id === 'inputPassword' || el.id === 'hubSearchFormsInput') return false;
      }
      return !el.readOnly && !el.disabled;
    }

    function isInsideFormCanvas(el) {
      return isMathEligibleInput(el);
    }

    function showUniversalFloatingFormattingBar(targetInput) {
      if (!isMathEligibleInput(targetInput)) return;

      currentActiveFormInput = targetInput;
      if (floatingToolbarHideTimeout) {
        clearTimeout(floatingToolbarHideTimeout);
        floatingToolbarHideTimeout = null;
      }

      const bar = document.getElementById("universalFloatingFormattingBar");
      if (bar) {
        bar.classList.remove("hidden");
        bar.classList.add("flex");
      }

      // Hide mobile action dock (+, TT, Media, Bagian) during active text edit so they never overlap
      const actionDock = document.getElementById("googleFormsFloatingDock");
      if (actionDock) {
        actionDock.classList.add("max-sm:hidden");
      }
    }

    function hideUniversalFloatingFormattingBar() {
      if (floatingToolbarHideTimeout) clearTimeout(floatingToolbarHideTimeout);
      floatingToolbarHideTimeout = setTimeout(() => {
        const active = document.activeElement;
        if (active && isMathEligibleInput(active)) {
          currentActiveFormInput = active;
          return;
        }

        const bar = document.getElementById("universalFloatingFormattingBar");
        if (bar) {
          bar.classList.add("hidden");
          bar.classList.remove("flex");
        }
        const palette = document.getElementById("universalFloatingMathPalette");
        if (palette) {
          palette.classList.add("hidden");
        }

        // Restore action dock when text edit mode ends
        const actionDock = document.getElementById("googleFormsFloatingDock");
        if (actionDock) {
          actionDock.classList.remove("max-sm:hidden");
        }
      }, 250);
    }

    function applyActiveFieldFormat(formatType) {
      const target = currentActiveFormInput || (isMathEligibleInput(document.activeElement) ? document.activeElement : null);
      if (target && isMathEligibleInput(target)) {
        target.focus();
        applyUniversalTextFormat(target, formatType);
      } else {
        showAdminToast("Pilih atau fokuskan salah satu kolom isian teks terlebih dahulu.", "info");
      }
    }

    function handleActiveFieldMathButtonClick() {
      const target = currentActiveFormInput || (isMathEligibleInput(document.activeElement) ? document.activeElement : null);
      if (!target || !isMathEligibleInput(target)) {
        showAdminToast("Pilih atau fokuskan salah satu kolom isian teks terlebih dahulu.", "info");
        return;
      }

      target.focus();
      const start = typeof target.selectionStart === 'number' ? target.selectionStart : 0;
      const end = typeof target.selectionEnd === 'number' ? target.selectionEnd : 0;
      const val = target.value || "";
      const selected = val.substring(start, end);

      if (selected && selected.trim()) {
        pushUndoSnapshot('Format Rumus Matematika');
        const trimmed = selected.trim();
        let formattedMath = "";
        if (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length >= 2) {
          formattedMath = trimmed.slice(1, -1);
        } else {
          formattedMath = `$${trimmed}$`;
        }

        target.value = val.substring(0, start) + formattedMath + val.substring(end);
        const newCursor = start + formattedMath.length;
        target.setSelectionRange(newCursor, newCursor);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        showAdminToast("Teks terpilih berhasil diubah menjadi rumus matematika KaTeX! (Ctrl + M)", "success");
        return;
      }

      toggleUniversalFloatingMathPalette();
    }

    function toggleUniversalFloatingMathPalette() {
      const palette = document.getElementById("universalFloatingMathPalette");
      if (!palette) return;
      palette.classList.toggle("hidden");
    }

    function insertActiveFieldMathSymbol(symbol) {
      const target = currentActiveFormInput || (isMathEligibleInput(document.activeElement) ? document.activeElement : null);
      if (!target || !isMathEligibleInput(target)) return;

      target.focus();
      insertUniversalMathSymbol(target, symbol);
    }

    // Cleaned up helper returning empty string to prevent inline layout shifts on cards
    function getRichTextToolbarHtml(targetInputId, customClass = '') {
      return '';
    }

    // Backward-compatibility aliases
    function applyFieldTextFormat(sIdx, fIdx, formatType) {
      applyUniversalTextFormat(`#fieldLabelInput_${sIdx}_${fIdx}`, formatType);
    }
    function toggleQuickMathPalette(sIdx, fIdx) {
      toggleUniversalFloatingMathPalette();
    }
    function insertMathSymbolAtField(sIdx, fIdx, symbol) {
      insertUniversalMathSymbol(`#fieldLabelInput_${sIdx}_${fIdx}`, symbol);
    }
    function handleUniversalMathButtonClick(targetInputId) {
      handleActiveFieldMathButtonClick();
    }
    function toggleUniversalMathPalette(targetInputId) {
      toggleUniversalFloatingMathPalette();
    }

    document.addEventListener("click", (e) => {
      if (!e.target.closest('#universalFloatingFormattingBar') && !e.target.closest('#universalFloatingMathPalette')) {
        const palette = document.getElementById("universalFloatingMathPalette");
        if (palette) palette.classList.add("hidden");
      }
    });

    // Smart Universal Focus & Selection Trackers: show bottom floating formatting bar on ANY input focus / select / typing
    document.addEventListener('focusin', function(e) {
      if (isMathEligibleInput(e.target)) {
        showUniversalFloatingFormattingBar(e.target);
        const container = e.target.parentElement;
        if (container && e.target.id) {
          const displayEl = container.querySelector(`:scope > .in-place-rich-display[data-for="${e.target.id}"]`);
          if (displayEl) displayEl.classList.add('hidden');
          e.target.classList.remove('hidden');
        }
      }
    }, true);

    document.addEventListener('focusout', function(e) {
      hideUniversalFloatingFormattingBar();
      if (isMathEligibleInput(e.target)) {
        syncInPlaceRichField(e.target);
      }
    }, true);

    document.addEventListener('select', function(e) {
      if (isMathEligibleInput(e.target)) {
        showUniversalFloatingFormattingBar(e.target);
      }
    }, true);

    document.addEventListener('mouseup', function(e) {
      const active = document.activeElement;
      if (isMathEligibleInput(active)) {
        showUniversalFloatingFormattingBar(active);
      }
    });

    document.addEventListener('keyup', function(e) {
      const active = document.activeElement;
      if (isMathEligibleInput(active)) {
        showUniversalFloatingFormattingBar(active);
      }
    });

    // =========================================================================
    // AUTO-GROWING TEXTAREA ENGINE (NO SCROLLBARS, ELASTIC EXPANSION)
    // =========================================================================
    function autoResizeTextarea(el) {
      if (!el || el.tagName !== 'TEXTAREA') return;
      if (el.id === 'textUniversalScriptCode' || el.id === 'backupJsonTextarea') return;
      el.style.height = 'auto';
      const newHeight = Math.max(el.scrollHeight, 38);
      el.style.height = newHeight + 'px';
      el.style.overflowY = 'hidden';
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
    // UNIVERSAL KEYBOARD SHORTCUTS ENGINE (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K, Ctrl+\, Ctrl+M)
    // =========================================================================
    // =========================================================================
    // UNIVERSAL KEYBOARD SHORTCUTS & SMART TAB/ENTER LIST ENGINE
    // =========================================================================
    document.addEventListener('keydown', function(e) {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const target = document.activeElement;
      const isTextInput = isMathEligibleInput(target) && !target.readOnly && !target.disabled;

      if (isTextInput) {
        const key = (e.key || '').toLowerCase();
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;
        const val = target.value || '';

                // 1. Hierarchical Tab / Shift+Tab List Indentation (Word & Google Docs Engine)
        if (e.key === 'Tab') {
          e.preventDefault();
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          let lineEnd = val.indexOf('\n', end);
          if (lineEnd === -1) lineEnd = val.length;

          const targetBlock = val.substring(lineStart, lineEnd);
          const lines = targetBlock.split('\n');

          const transformedLines = lines.map(line => {
            if (e.shiftKey) {
              // SHIFT + TAB: DECREASE INDENTATION (OUTDENT LEVEL)
              // Level 3 roman i. -> Level 2 letter a.
              const romanMatch = line.match(/^(\s{4,})([ivxlcdm]+)\.\s+(.*)$/i);
              if (romanMatch) {
                return `  a. ${romanMatch[3]}`;
              }
              // Level 2 letter a. -> Level 1 number 1.
              const alphaMatch = line.match(/^(\s{2,})([a-z])\.\s+(.*)$/);
              if (alphaMatch) {
                return `1. ${alphaMatch[3]}`;
              }
              // Level 2 number 1. (under Alpha A.) -> Level 1 Alpha A.
              const numSubMatch = line.match(/^(\s{2,})(\d+)\.\s+(.*)$/);
              if (numSubMatch) {
                return `A. ${numSubMatch[3]}`;
              }
              // Level 3 bullet ▪ -> Level 2 bullet ◦
              const squareBulletMatch = line.match(/^(\s{4,})[▪▫]\s+(.*)$/);
              if (squareBulletMatch) {
                return `  ◦ ${squareBulletMatch[2]}`;
              }
              // Level 2 bullet ◦ -> Level 1 bullet •
              const openBulletMatch = line.match(/^(\s{2,})[◦\-]\s+(.*)$/);
              if (openBulletMatch) {
                return `• ${openBulletMatch[2]}`;
              }
              // Generic whitespace outdent
              if (line.startsWith('  ')) return line.substring(2);
              if (line.startsWith(' ')) return line.substring(1);
              if (line.startsWith('\t')) return line.substring(1);
              return line;
            } else {
              // TAB: INCREASE INDENTATION (HIERARCHICAL INDENT LEVEL)
              // Level 1 Root Number (1.) -> Level 2 Letter (  a.)
              const rootNumMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
              if (rootNumMatch && rootNumMatch[1].length < 2) {
                return `  a. ${rootNumMatch[3]}`;
              }
              // Level 2 Letter (  a.) -> Level 3 Roman (    i.)
              const alphaMatch = line.match(/^(\s{2,3})([a-z])\.\s+(.*)$/);
              if (alphaMatch) {
                return `    i. ${alphaMatch[3]}`;
              }
              // Level 1 Root Alpha (A.) -> Level 2 Sub-Number (  1.)
              const rootAlphaMatch = line.match(/^(\s*)([A-Z])\.\s+(.*)$/);
              if (rootAlphaMatch && rootAlphaMatch[1].length < 2) {
                return `  1. ${rootAlphaMatch[3]}`;
              }
              // Level 2 Sub-Number (  1.) -> Level 3 Sub-Letter (    a.)
              if (rootNumMatch && rootNumMatch[1].length >= 2) {
                return `    a. ${rootNumMatch[3]}`;
              }
              // Level 1 Root Bullet (•) -> Level 2 Sub-Bullet (  ◦)
              const rootBulletMatch = line.match(/^(\s*)•\s+(.*)$/);
              if (rootBulletMatch && rootBulletMatch[1].length < 2) {
                return `  ◦ ${rootBulletMatch[2]}`;
              }
              // Level 2 Sub-Bullet (  ◦) -> Level 3 Sub-Bullet (    ▪)
              const subBulletMatch = line.match(/^(\s{2,3})[◦\-]\s+(.*)$/);
              if (subBulletMatch) {
                return `    ▪ ${subBulletMatch[2]}`;
              }
              // Non-list line: simple 2-space indent
              return `  ${line}`;
            }
          });

          const replacement = transformedLines.join('\n');
          target.value = val.substring(0, lineStart) + replacement + val.substring(lineEnd);
          target.setSelectionRange(lineStart + replacement.length, lineStart + replacement.length);
          target.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }

        // 2. Smart Enter Key List Continuation (Numbers, Letters, Romans, Bullets)
        if (e.key === 'Enter' && target.tagName === 'TEXTAREA' && !e.shiftKey && !isCtrlOrCmd) {
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          const currentLine = val.substring(lineStart, start);

          const bulletMatch = currentLine.match(/^(\s*)([•◦▪▫\-\*])\s*(.*)$/);
          const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);
          const alphaUpperMatch = currentLine.match(/^(\s*)([A-Z])\.\s*(.*)$/);
          const alphaLowerMatch = currentLine.match(/^(\s*)([a-z])\.\s*(.*)$/);
          const romanMatch = currentLine.match(/^(\s*)(i|ii|iii|iv|v|vi|vii|viii|ix|x)\.\s*(.*)$/i);

          if (romanMatch) {
            e.preventDefault();
            const indent = romanMatch[1];
            const currentRoman = romanMatch[2].toLowerCase();
            const content = romanMatch[3];
            if (content.trim() === '') {
              // Outdent on empty Enter
              if (indent.length >= 4) {
                target.value = val.substring(0, lineStart) + '  a. ' + val.substring(start);
                target.setSelectionRange(lineStart + 5, lineStart + 5);
              } else {
                target.value = val.substring(0, lineStart) + val.substring(start);
                target.setSelectionRange(lineStart, lineStart);
              }
            } else {
              const romanOrder = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'];
              const rIdx = romanOrder.indexOf(currentRoman);
              const nextRoman = rIdx !== -1 && rIdx < romanOrder.length - 1 ? romanOrder[rIdx + 1] : 'i';
              const nextStr = `\n${indent}${nextRoman}. `;
              target.value = val.substring(0, start) + nextStr + val.substring(end);
              target.setSelectionRange(start + nextStr.length, start + nextStr.length);
            }
            target.dispatchEvent(new Event('input', { bubbles: true }));
            autoResizeTextarea(target);
            return;
          } else if (alphaLowerMatch) {
            e.preventDefault();
            const indent = alphaLowerMatch[1];
            const charCode = alphaLowerMatch[2].charCodeAt(0);
            const content = alphaLowerMatch[3];
            if (content.trim() === '') {
              if (indent.length >= 2) {
                target.value = val.substring(0, lineStart) + '1. ' + val.substring(start);
                target.setSelectionRange(lineStart + 3, lineStart + 3);
              } else {
                target.value = val.substring(0, lineStart) + val.substring(start);
                target.setSelectionRange(lineStart, lineStart);
              }
            } else {
              const nextChar = charCode < 122 ? String.fromCharCode(charCode + 1) : 'a';
              const nextStr = `\n${indent}${nextChar}. `;
              target.value = val.substring(0, start) + nextStr + val.substring(end);
              target.setSelectionRange(start + nextStr.length, start + nextStr.length);
            }
            target.dispatchEvent(new Event('input', { bubbles: true }));
            autoResizeTextarea(target);
            return;
          } else if (alphaUpperMatch) {
            e.preventDefault();
            const indent = alphaUpperMatch[1];
            const charCode = alphaUpperMatch[2].charCodeAt(0);
            const content = alphaUpperMatch[3];
            if (content.trim() === '') {
              target.value = val.substring(0, lineStart) + val.substring(start);
              target.setSelectionRange(lineStart, lineStart);
            } else {
              const nextChar = charCode < 90 ? String.fromCharCode(charCode + 1) : 'A';
              const nextStr = `\n${indent}${nextChar}. `;
              target.value = val.substring(0, start) + nextStr + val.substring(end);
              target.setSelectionRange(start + nextStr.length, start + nextStr.length);
            }
            target.dispatchEvent(new Event('input', { bubbles: true }));
            autoResizeTextarea(target);
            return;
          } else if (numberMatch) {
            e.preventDefault();
            const indent = numberMatch[1];
            const currentNum = parseInt(numberMatch[2], 10);
            const content = numberMatch[3];
            if (content.trim() === '') {
              if (indent.length >= 2) {
                target.value = val.substring(0, lineStart) + 'A. ' + val.substring(start);
                target.setSelectionRange(lineStart + 3, lineStart + 3);
              } else {
                target.value = val.substring(0, lineStart) + val.substring(start);
                target.setSelectionRange(lineStart, lineStart);
              }
            } else {
              const nextNumber = `\n${indent}${currentNum + 1}. `;
              target.value = val.substring(0, start) + nextNumber + val.substring(end);
              target.setSelectionRange(start + nextNumber.length, start + nextNumber.length);
            }
            target.dispatchEvent(new Event('input', { bubbles: true }));
            autoResizeTextarea(target);
            return;
          } else if (bulletMatch) {
            e.preventDefault();
            const indent = bulletMatch[1];
            const bulletSymbol = bulletMatch[2];
            const content = bulletMatch[3];
            if (content.trim() === '') {
              if (indent.length >= 4) {
                target.value = val.substring(0, lineStart) + '  ◦ ' + val.substring(start);
                target.setSelectionRange(lineStart + 4, lineStart + 4);
              } else if (indent.length >= 2) {
                target.value = val.substring(0, lineStart) + '• ' + val.substring(start);
                target.setSelectionRange(lineStart + 2, lineStart + 2);
              } else {
                target.value = val.substring(0, lineStart) + val.substring(start);
                target.setSelectionRange(lineStart, lineStart);
              }
            } else {
              const nextBullet = `\n${indent}${bulletSymbol} `;
              target.value = val.substring(0, start) + nextBullet + val.substring(end);
              target.setSelectionRange(start + nextBullet.length, start + nextBullet.length);
            }
            target.dispatchEvent(new Event('input', { bubbles: true }));
            autoResizeTextarea(target);
            return;
          }
        }

                // 8. Ctrl + Shift + 9 -> Alphabet List (A.)
        if (isCtrlOrCmd && e.shiftKey && (e.key === '9' || e.code === 'Digit9')) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'alpha');
          return;
        }

        // 1. Ctrl + B -> Bold
        if (isCtrlOrCmd && key === 'b' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'bold');
          return;
        }

        // 2. Ctrl + I -> Italic
        if (isCtrlOrCmd && key === 'i' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'italic');
          return;
        }

        // 3. Ctrl + U -> Underline
        if (isCtrlOrCmd && key === 'u' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'underline');
          return;
        }

        // 4. Ctrl + Shift + 8 (or Ctrl + Shift + U) -> Bullet List
        if (isCtrlOrCmd && ((key === '8' && e.shiftKey) || (key === 'u' && e.shiftKey))) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'bullet');
          return;
        }

        // 5. Ctrl + Shift + 7 (or Ctrl + Shift + O) -> Numbered List
        if (isCtrlOrCmd && ((key === '7' && e.shiftKey) || (key === 'o' && e.shiftKey))) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'number');
          return;
        }

        // 6. Ctrl + ] -> Indent, Ctrl + [ -> Outdent
        if (isCtrlOrCmd && key === ']') {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'indent');
          return;
        }
        if (isCtrlOrCmd && key === '[') {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'outdent');
          return;
        }

        // 7. Ctrl + K -> Link
        if (isCtrlOrCmd && key === 'k' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'link');
          return;
        }

        // 8. Ctrl + \ or Ctrl + Shift + X -> Remove Formatting
        if ((isCtrlOrCmd && (e.key === '\\' || (key === 'x' && e.shiftKey))) && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          applyUniversalTextFormat(target, 'remove_format');
          return;
        }

        // 9. Ctrl + M or Alt + M -> Formula / Math
        if ((isCtrlOrCmd && key === 'm') || (e.altKey && key === 'm')) {
          e.preventDefault();
          e.stopPropagation();
          handleActiveFieldMathButtonClick();
          return;
        }
      }

      // Escape key: close open floating math palettes
      if (e.key === 'Escape') {
        const palette = document.getElementById("universalFloatingMathPalette");
        if (palette) palette.classList.add('hidden');
        hideMathContextMenu();
        hideFloatingSelectionBubble();
      }
    }, true);

    // =========================================================================
    // SMART MATH SELECTION, RIGHT-CLICK & FLOATING ACTION ENGINE (100% RELIABLE)
    // =========================================================================
    let activeMathSelectionTarget = null;
    let activeMathSelectionRange = { start: 0, end: 0, text: "" };

    function captureActiveSelection(el) {
      if (!isMathEligibleInput(el)) return null;
      try {
        const start = typeof el.selectionStart === 'number' ? el.selectionStart : 0;
        const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : 0;
        const val = el.value || '';
        if (end > start) {
          const selected = val.substring(start, end).trim();
          if (selected.length > 0) {
            activeMathSelectionTarget = el;
            activeMathSelectionRange = { start, end, text: selected };
            return activeMathSelectionRange;
          }
        }
      } catch(e) {}
      return null;
    }

    function initMathContextMenuEvents() {
      // 1. Capture selection as user drags / selects with mouse or keyboard
      document.addEventListener('select', function(e) {
        if (isMathEligibleInput(e.target)) {
          captureActiveSelection(e.target);
        }
      }, true);

      document.addEventListener('selectionchange', function() {
        const el = document.activeElement;
        if (isMathEligibleInput(el)) {
          captureActiveSelection(el);
        }
      });

      // 2. Mouseup: check if text was selected, show floating bubble
      document.addEventListener('mouseup', function(e) {
        if (e.target.closest('#mathSelectionContextMenu') || e.target.closest('#mathSelectionFloatingBubble')) {
          return;
        }

        setTimeout(() => {
          const el = document.activeElement;
          const sel = captureActiveSelection(el);
          if (sel && sel.text.length > 0 && !isContextMenuOpen()) {
            showFloatingSelectionBubble(e.clientX, e.clientY, el);
          } else {
            hideFloatingSelectionBubble();
          }
        }, 40);
      });

      // 3. Right-Click (contextmenu): capture selection and show context menu
      document.addEventListener('contextmenu', function(e) {
        let el = e.target;
        if (!isMathEligibleInput(el)) {
          el = document.activeElement;
        }

        if (isMathEligibleInput(el)) {
          let sel = null;
          if (activeMathSelectionTarget === el && activeMathSelectionRange.text && activeMathSelectionRange.end > activeMathSelectionRange.start) {
            sel = activeMathSelectionRange;
          } else {
            sel = captureActiveSelection(el);
          }

          if (sel && sel.text.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            showMathContextMenu(e.clientX, e.clientY, sel.text);
            return false;
          }
        }
        hideMathContextMenu();
      }, true);

      // 4. Click outside to dismiss
      document.addEventListener('mousedown', function(e) {
        if (!e.target.closest('#mathSelectionContextMenu') && !e.target.closest('#mathSelectionFloatingBubble')) {
          hideMathContextMenu();
          hideFloatingSelectionBubble();
        }
      });

      // 5. Escape key to dismiss
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          hideMathContextMenu();
          hideFloatingSelectionBubble();
        }
      });
    }

    function showMathContextMenu(x, y, text) {
      hideFloatingSelectionBubble();
      const menu = document.getElementById("mathSelectionContextMenu");
      const snippet = document.getElementById("mathContextMenuSelectedSnippet");
      if (!menu) return;

      if (snippet) snippet.textContent = `"${text.length > 25 ? text.slice(0, 25) + '...' : text}"`;

      menu.classList.remove("hidden");
      const rect = menu.getBoundingClientRect();
      const posX = Math.min(x, window.innerWidth - rect.width - 16);
      const posY = Math.min(y, window.innerHeight - rect.height - 16);

      menu.style.left = `${Math.max(12, posX)}px`;
      menu.style.top = `${Math.max(12, posY)}px`;
    }

    function hideMathContextMenu() {
      const menu = document.getElementById("mathSelectionContextMenu");
      if (menu) menu.classList.add("hidden");
    }

    function showFloatingSelectionBubble(x, y, el) {
      const bubble = document.getElementById("mathSelectionFloatingBubble");
      if (!bubble) return;

      bubble.classList.remove("hidden");

      let targetX = x;
      let targetY = y - 45;

      if (el) {
        const elRect = el.getBoundingClientRect();
        targetX = Math.max(elRect.left + 50, Math.min(elRect.right - 50, x));
        targetY = Math.max(20, elRect.top - 42);
      }

      const posX = Math.max(80, Math.min(window.innerWidth - 80, targetX));
      const posY = Math.max(10, targetY);

      bubble.style.left = `${posX}px`;
      bubble.style.top = `${posY}px`;
    }

    function hideFloatingSelectionBubble() {
      const bubble = document.getElementById("mathSelectionFloatingBubble");
      if (bubble) bubble.classList.add("hidden");
    }

    function isContextMenuOpen() {
      const menu = document.getElementById("mathSelectionContextMenu");
      return menu && !menu.classList.contains("hidden");
    }

    function openMathContextMenuFromBubble(e) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      const bubble = document.getElementById("mathSelectionFloatingBubble");
      if (!bubble) return;
      const rect = bubble.getBoundingClientRect();
      showMathContextMenu(rect.left + rect.width / 2, rect.bottom + 6, activeMathSelectionRange.text || "Rumus");
    }

    function applyMathTransformation(type) {
      const input = activeMathSelectionTarget || document.activeElement;
      if (!input || !isMathEligibleInput(input)) return;

      const { start, end, text } = activeMathSelectionRange;
      if (typeof start !== 'number' || typeof end !== 'number' || end <= start) return;

      const fullVal = input.value || "";
      const selectedPart = fullVal.substring(start, end);
      const cleanCore = selectedPart.replace(/^\$|\$$/g, '').trim();

      let transformed = selectedPart;

      if (type === 'WRAP_FORMULA') {
        if (selectedPart.startsWith('$') && selectedPart.endsWith('$') && selectedPart.length >= 2) {
          transformed = selectedPart.slice(1, -1);
        } else {
          transformed = `$${cleanCore}$`;
        }
      } else if (type === 'POWER') {
        transformed = `$x^{${cleanCore}}$`;
      } else if (type === 'INDEX') {
        transformed = `$x_{${cleanCore}}$`;
      } else if (type === 'FRACTION') {
        transformed = `$\\frac{${cleanCore}}{b}$`;
      } else if (type === 'SQRT') {
        transformed = `$\\sqrt{${cleanCore}}$`;
      } else if (type === 'UNWRAP') {
        transformed = cleanCore;
      }

      const newVal = fullVal.substring(0, start) + transformed + fullVal.substring(end);
      input.value = newVal;
      input.focus();
      
      const newSelStart = start;
      const newSelEnd = start + transformed.length;
      try {
        input.setSelectionRange(newSelStart, newSelEnd);
      } catch(e) {}

      // Trigger input & change events
      const inputEvt = new Event('input', { bubbles: true, cancelable: true });
      input.dispatchEvent(inputEvt);
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

      if (typeof input.oninput === 'function') {
        input.oninput.call(input, inputEvt);
      }

      hideMathContextMenu();
      hideFloatingSelectionBubble();
      showAdminToast("Formula matematika diterapkan: " + transformed, "info");
    }

    // =========================================================================
    // RICH MULTI-MEDIA ENGINE (IMAGE, VIDEO, AUDIO, EMBED)
    // =========================================================================
    let currentMediaEditing = { sIdx: -1, fIdx: -1, type: 'IMAGE', localDataUrl: '' };

    function extractDriveFileId(url) {
      if (!url) return '';
      url = String(url).trim();
      let match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?export=view&id=|thumbnail\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1];
      match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1];
      return '';
    }

// =========================================================================
    // 🎨 MULTI-MEDIA STUDIO & GALLERY ENGINE FOR QUESTIONS
    // =========================================================================
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

    function extractDriveFileId(url) {
      if (!url) return '';
      if (url.includes('lh3.googleusercontent.com/d/')) {
        const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m) return m[1];
      }
      if (url.includes('drive.google.com')) {
        const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m1) return m1[1];
        const m2 = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (m2) return m2[1];
      }
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

    function renderSingleMediaItemPreview(m, isGallery = false) {
      const embedUrl = convertToEmbedUrl(m.url, m.type);
      const alignClass = m.align === 'left' ? 'justify-start' : (m.align === 'right' ? 'justify-end' : 'justify-center');

      let body = '';
      if (m.type === 'IMAGE') {
        body = `
          <div class="relative group inline-block max-w-full">
            <img src="${embedUrl}" 
                 referrerpolicy="no-referrer" 
                 crossorigin="anonymous"
                 onerror="handleImageErrorFallback(this, '${(m.url || '').replace(/'/g, "\\'")}')" 
                 alt="${m.caption || 'Gambar Pertanyaan'}" 
                 class="max-h-56 sm:max-h-64 w-auto max-w-full object-contain rounded-xl border border-zinc-200 shadow-xs bg-zinc-900/5">
          </div>
        `;
      } else if (m.type === 'VIDEO') {
        if (embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com') || embedUrl.includes('drive.google.com')) {
          body = `
            <div class="w-full max-w-lg aspect-video rounded-xl overflow-hidden border border-zinc-200 shadow-xs bg-black">
              <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
            </div>
          `;
        } else {
          body = `
            <div class="w-full max-w-lg aspect-video rounded-xl overflow-hidden border border-zinc-200 shadow-xs bg-black flex items-center justify-center">
              <video src="${embedUrl}" controls class="w-full h-full object-contain bg-black" playsinline preload="metadata"></video>
            </div>
          `;
        }
      } else if (m.type === 'AUDIO') {
        body = `
          <div class="w-full max-w-md p-3 rounded-xl bg-zinc-50 border border-zinc-200 shadow-2xs space-y-1.5">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
              <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
              <span>Audio Pertanyaan</span>
            </div>
            <audio src="${embedUrl}" controls class="w-full h-8"></audio>
          </div>
        `;
      } else if (m.type === 'EMBED') {
        body = `
          <div class="w-full max-w-xl aspect-[16/10] rounded-xl overflow-hidden border border-zinc-200 shadow-xs bg-zinc-100">
            <iframe src="${embedUrl}" class="w-full h-full" frameborder="0"></iframe>
          </div>
        `;
      }

      return `
        <div class="w-full space-y-1.5">
          <div class="flex ${alignClass}">
            ${body}
          </div>
          ${m.caption ? `<p class="text-xs text-zinc-600 italic text-center math-renderable">${m.caption}</p>` : ''}
        </div>
      `;
    }

    function getBuilderMediaPreviewHtml(fieldOrMedia, sIdx, fIdx) {
      const mediaList = normalizeMediaList(fieldOrMedia);
      if (!mediaList || mediaList.length === 0) return '';

      const count = mediaList.length;
      let contentHtml = '';

      if (count === 1) {
        contentHtml = renderSingleMediaItemPreview(mediaList[0], false);
      } else {
        const allImages = mediaList.every(m => m.type === 'IMAGE');
        if (allImages) {
          const gridCols = count === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-xl' : (count === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-2xl' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-3xl');
          const cardHeight = count === 2 ? 'h-36 sm:h-44' : (count === 3 ? 'h-32 sm:h-36' : 'h-24 sm:h-28');
          contentHtml = `
            <div class="grid ${gridCols} gap-2.5 mx-auto my-1.5">
              ${mediaList.map(m => `
                <div class="relative group rounded-xl overflow-hidden border border-zinc-200/90 bg-zinc-900/5 shadow-2xs ${cardHeight} flex items-center justify-center p-1.5 hover:border-indigo-300 transition">
                  <img src="${convertToEmbedUrl(m.url, 'IMAGE')}" 
                       alt="${m.caption || ''}" 
                       onerror="handleImageErrorFallback(this, '${(m.url||'').replace(/'/g, "\\'")}')"
                       class="max-h-full max-w-full object-contain rounded-lg">
                  ${m.caption ? `<span class="absolute bottom-1 inset-x-1 bg-zinc-950/80 text-white text-[9.5px] px-1.5 py-0.5 rounded truncate text-center math-renderable">${m.caption}</span>` : ''}
                </div>
              `).join('')}
            </div>
          `;
        } else {
          contentHtml = `
            <div class="space-y-3 my-1.5">
              ${mediaList.map(m => renderSingleMediaItemPreview(m, false)).join('')}
            </div>
          `;
        }
      }

      return `
        <div class="p-3 bg-zinc-50/80 rounded-2xl border border-zinc-200/90 space-y-2 my-2.5">
          <div class="flex items-center justify-between gap-2 border-b border-zinc-200/60 pb-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                ${count > 1 ? `GALERI MEDIA (${count} BERKAS)` : `MEDIA ${mediaList[0].type}`}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" onclick="openAttachMediaModal(${sIdx}, ${fIdx})" class="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-[11px] text-zinc-700 font-semibold cursor-pointer shadow-2xs">
                Kelola Media
              </button>
              <button type="button" onclick="handleRemoveMedia(${sIdx}, ${fIdx})" class="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[11px] text-rose-600 font-semibold cursor-pointer shadow-2xs">
                Hapus Semua
              </button>
            </div>
          </div>
          ${contentHtml}
        </div>
      `;
    }

    function openAttachMediaModal(sIdx, fIdx) {
      currentMediaEditing.sIdx = sIdx;
      currentMediaEditing.fIdx = fIdx;
      currentMediaEditing.pendingUploads = [];
      const field = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!field) return;

      currentMediaEditing.mediaList = JSON.parse(JSON.stringify(normalizeMediaList(field)));
      currentMediaEditing.position = field.mediaPosition || field.media?.position || 'ABOVE_QUESTION';
      currentMediaEditing.type = 'IMAGE';

      const posEl = document.getElementById("selectMediaPosition");
      if (posEl) posEl.value = currentMediaEditing.position;
      const urlEl = document.getElementById("inputMediaUrl");
      if (urlEl) urlEl.value = "";
      const capEl = document.getElementById("inputMediaCaption");
      if (capEl) capEl.value = "";
      const alignEl = document.getElementById("selectMediaAlign");
      if (alignEl) alignEl.value = "center";

      switchMediaModalType('IMAGE');
      renderMediaModalList();
      document.getElementById("modalAttachQuestionMedia").classList.remove("hidden");
    }

    function closeAttachMediaModal(isSaved = false) {
      if (!isSaved && currentMediaEditing.pendingUploads && currentMediaEditing.pendingUploads.length > 0) {
        currentMediaEditing.pendingUploads.forEach(item => cleanupDriveMediaFile(item));
        currentMediaEditing.pendingUploads = [];
      }

      document.getElementById("modalAttachQuestionMedia").classList.add("hidden");
      const prog = document.getElementById("mediaUploadProgressBarContainer");
      if (prog) prog.classList.add("hidden");
    }

    function switchMediaModalType(type) {
      currentMediaEditing.type = type;
      ['IMAGE', 'VIDEO', 'AUDIO', 'EMBED'].forEach(t => {
        const tab = document.getElementById(`mediaTab_${t}`);
        if (tab) {
          if (t === type) {
            tab.className = "py-1.5 rounded-lg bg-white text-zinc-950 shadow-2xs text-center transition cursor-pointer font-bold";
          } else {
            tab.className = "py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 text-center transition cursor-pointer";
          }
        }
      });

      const label = document.getElementById("mediaUrlLabel");
      const help = document.getElementById("mediaUrlHelp");
      const uploadBtn = document.getElementById("btnMediaDirectUpload");

      if (type === 'IMAGE') {
        if (label) label.textContent = "Tautan / URL Gambar:";
        if (help) help.textContent = "Mendukung tautan langsung (JPG/PNG/GIF), Google Drive share link, atau klik Unggah Berkas.";
        if (uploadBtn) uploadBtn.classList.remove("hidden");
      } else if (type === 'VIDEO') {
        if (label) label.textContent = "Tautan Video (YouTube, Vimeo, Drive, MP4):";
        if (help) help.textContent = "Mendukung link YouTube biasa/shorts, Vimeo, Google Drive Video, direct link MP4/WebM, atau klik Unggah Berkas.";
        if (uploadBtn) uploadBtn.classList.remove("hidden");
      } else if (type === 'AUDIO') {
        if (label) label.textContent = "Tautan Berkas Audio (MP3, WAV, Drive Audio):";
        if (help) help.textContent = "Mendukung file audio MP3/WAV online, Google Drive audio, atau rekaman soal.";
        if (uploadBtn) uploadBtn.classList.remove("hidden");
      } else if (type === 'EMBED') {
        if (label) label.textContent = "Tautan Halaman / Embed Iframe:";
        if (help) help.textContent = "Mendukung link web interaktif, slide presentasi Google Slides, Figma, atau PDF online.";
        if (uploadBtn) uploadBtn.classList.add("hidden");
      }
    }

    function setMediaUploadProgress(percent, stageText, isSuccess = false, isError = false) {
      const container = document.getElementById("mediaUploadProgressBarContainer");
      const bar = document.getElementById("mediaUploadProgressBar");
      const percentEl = document.getElementById("mediaUploadPercentage");
      const stageEl = document.getElementById("mediaUploadStageText");
      const iconEl = document.getElementById("mediaUploadProgressIcon");
      const saveBtn = document.querySelector("button[onclick='handleSaveModalMedia()']");
      const uploadBtn = document.getElementById("btnMediaDirectUpload");

      if (!container || !bar) return;
      container.classList.remove("hidden");

      bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
      if (stageEl) stageEl.textContent = stageText;

      if (isSuccess) {
        bar.className = "h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out shadow-xs";
        container.className = "p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 space-y-2.5 transition-all";
        if (percentEl) percentEl.className = "font-mono font-bold text-xs text-emerald-700 shrink-0";
        if (stageEl) stageEl.className = "text-[11px] text-emerald-700 font-semibold block";
        if (iconEl) {
          iconEl.className = "w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs";
          iconEl.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`;
        }
        if (saveBtn) saveBtn.disabled = false;
        if (uploadBtn) uploadBtn.classList.remove("pointer-events-none", "opacity-60");
      } else if (isError) {
        bar.className = "h-full bg-rose-500 rounded-full transition-all duration-300 ease-out shadow-xs";
        container.className = "p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200/90 space-y-2.5 transition-all";
        if (percentEl) percentEl.className = "font-mono font-bold text-xs text-rose-700 shrink-0";
        if (stageEl) stageEl.className = "text-[11px] text-rose-700 font-semibold block";
        if (iconEl) {
          iconEl.className = "w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs";
          iconEl.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        }
        if (saveBtn) saveBtn.disabled = false;
        if (uploadBtn) uploadBtn.classList.remove("pointer-events-none", "opacity-60");
      } else {
        bar.className = "h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out shadow-xs";
        container.className = "p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 space-y-2.5 transition-all";
        if (percentEl) percentEl.className = "font-mono font-bold text-xs text-indigo-600 shrink-0";
        if (stageEl) stageEl.className = "text-[11px] text-indigo-700 font-semibold block";
        if (iconEl) {
          iconEl.className = "w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs";
          iconEl.innerHTML = `<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
        }
        if (saveBtn) saveBtn.disabled = true;
        if (uploadBtn) uploadBtn.classList.add("pointer-events-none", "opacity-60");
      }
    }

    function readSingleMediaFile(file) {
      return new Promise((resolve) => {
        const directReader = new FileReader();
        directReader.onload = (e) => {
          const rawDataUrl = e.target.result;
          const rawBase64 = (rawDataUrl && rawDataUrl.includes(',')) ? rawDataUrl.split(',')[1] : '';

          if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
            return resolve({ dataUrl: rawDataUrl, base64: rawBase64 });
          }

          const img = new Image();
          img.onload = function() {
            try {
              let width = img.width || 800;
              let height = img.height || 600;
              const maxDim = 1600;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);
              const compDataUrl = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.88);
              const compBase64 = compDataUrl.split(',')[1] || rawBase64;
              resolve({ dataUrl: compDataUrl, base64: compBase64 });
            } catch(cvsErr) {
              resolve({ dataUrl: rawDataUrl, base64: rawBase64 });
            }
          };
          img.onerror = () => resolve({ dataUrl: rawDataUrl, base64: rawBase64 });
          img.src = rawDataUrl;
        };
        directReader.onerror = () => resolve({ dataUrl: '', base64: '' });
        directReader.readAsDataURL(file);
      });
    }

    async function handleModalDirectFileUpload(fileInput) {
      const files = fileInput.files ? Array.from(fileInput.files) : [];
      if (files.length === 0) return;

      const totalFiles = files.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        if (file.size > 50 * 1024 * 1024) {
          showAdminToast(`Berkas "${file.name}" melebihi batas 50 MB!`, "warning");
          continue;
        }

        const fileNameEl = document.getElementById("mediaUploadFileName");
        const fileSizeEl = document.getElementById("mediaUploadFileSize");
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) {
          fileSizeEl.textContent = file.size > 1024 * 1024 
            ? `(${(file.size / (1024 * 1024)).toFixed(1)} MB)` 
            : `(${(file.size / 1024).toFixed(0)} KB)`;
        }

        setMediaUploadProgress(
          Math.round(((i) / totalFiles) * 100) + 10,
          `Mengunggah berkas ${i + 1} dari ${totalFiles} (${file.name})...`
        );

        let mType = 'IMAGE';
        if (file.type.startsWith('video/')) mType = 'VIDEO';
        else if (file.type.startsWith('audio/')) mType = 'AUDIO';

        let dataUrl = "";
        let base64 = "";

        try {
          const res = await readSingleMediaFile(file);
          dataUrl = res.dataUrl;
          base64 = res.base64;
        } catch (err) {
          console.error("Local file read error:", err);
          continue;
        }

        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${currentFormId || 'BK5E'}/${Date.now()}_${cleanFileName}`;
        const cdnPublicUrl = `https://eychjnqmqpxzxukiwbqf.supabase.co/storage/v1/object/public/pgsd-media/${storagePath}`;
        let cdnUploadSuccess = false;

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
            cdnUploadSuccess = true;
          }
        } catch(cdnErr) {
          console.warn("Direct CDN upload notice:", cdnErr);
        }

        const newItem = {
          id: "med_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          type: mType,
          url: cdnUploadSuccess ? cdnPublicUrl : dataUrl,
          fileId: "",
          storagePath: storagePath,
          caption: "",
          align: "center"
        };

        currentMediaEditing.mediaList.push(newItem);
        currentMediaEditing.pendingUploads.push(newItem);

        // Background Google Drive Sync
        const apiUrl = getAdminApiUrl();
        if (navigator.onLine && apiUrl && !apiUrl.includes("localhost") && base64) {
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "adminUploadMedia",
              formId: currentFormId || DEFAULT_PRIMARY_FORM_ID,
              category: "Media_Formulir",
              name: file.name,
              type: file.type,
              base64: base64
            })
          }).then(r => r.text()).then(rawText => {
            let resJson = null;
            try { resJson = JSON.parse(rawText); } catch(pe) {}
            if (resJson && resJson.success && resJson.fileUrl) {
              newItem.fileId = resJson.fileId || "";
              if (!cdnUploadSuccess) {
                newItem.url = resJson.fileUrl;
                renderMediaModalList();
              }
            }
          }).catch(e => console.warn("Background Drive sync notice:", e));
        }
      }

      setMediaUploadProgress(100, `✅ Berhasil mengunggah ${totalFiles} berkas!`, true);
      renderMediaModalList();
      showAdminToast(`${totalFiles} berkas media berhasil dilampirkan!`, "success");
    }

    function detectLinkMediaType(url) {
      if (!url) return 'IMAGE';
      url = String(url).trim();
      if (url.startsWith('<iframe') || url.includes('iframe') || /docs.google.com/(presentation|document)/i.test(url)) return 'EMBED';
      if (/youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|mov|m4v|mkv)(\?.*)?$/i.test(url)) return 'VIDEO';
      if (/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(url)) return 'AUDIO';
      if (/\.(pdf)(\?.*)?$/i.test(url)) return 'EMBED';
      return 'IMAGE';
    }

    function handleAddLinkMedia() {
      const urlEl = document.getElementById("inputMediaUrl");
      let url = (urlEl?.value || "").trim();
      const capEl = document.getElementById("inputMediaCaption");
      const caption = (capEl?.value || "").trim();
      const alignEl = document.getElementById("selectMediaAlign");
      const align = alignEl?.value || "center";

      if (!url) {
        showAdminToast("Mohon masukkan tautan / URL terlebih dahulu.", "warning");
        return;
      }

      let detectedType = detectLinkMediaType(url);
      if (url.startsWith('<iframe')) {
        const srcMatch = url.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          url = srcMatch[1];
          detectedType = 'EMBED';
        }
      }

      const newItem = {
        id: "med_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        type: detectedType,
        url: url,
        fileId: "",
        storagePath: "",
        caption: caption,
        align: align
      };

      currentMediaEditing.mediaList.push(newItem);
      if (urlEl) urlEl.value = "";
      if (capEl) capEl.value = "";
      renderMediaModalList();
      showAdminToast("Tautan media berhasil ditambahkan!", "success");
    }

    function renderMediaModalList() {
      const listContainer = document.getElementById("mediaItemsListContainer");
      const btnDel = document.getElementById("btnDeleteModalMedia");
      if (!listContainer) return;

      const mediaList = currentMediaEditing.mediaList || [];
      if (btnDel) {
        if (mediaList.length > 0) btnDel.classList.remove("hidden");
        else btnDel.classList.add("hidden");
      }

      if (mediaList.length === 0) {
        listContainer.innerHTML = `
          <div class="p-6 rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 text-center space-y-2">
            <div class="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <p class="text-xs font-semibold text-zinc-700">Belum ada foto atau video yang dilampirkan</p>
            <p class="text-[11px] text-zinc-400">Pilih berkas dari komputer atau masukkan tautan di bawah.</p>
          </div>
        `;
        updateMediaModalLivePreview();
        return;
      }

      listContainer.innerHTML = mediaList.map((m, idx) => {
        const embedUrl = convertToEmbedUrl(m.url, m.type);
        let thumb = '';
        if (m.type === 'IMAGE') {
          thumb = `<img src="${embedUrl}" onerror="handleImageErrorFallback(this, '${(m.url||'').replace(/'/g, "\\'")}')" class="w-14 h-14 rounded-lg object-cover border border-zinc-200 bg-zinc-100 shrink-0">`;
        } else if (m.type === 'VIDEO') {
          thumb = `<div class="w-14 h-14 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0"><svg class="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>`;
        } else if (m.type === 'AUDIO') {
          thumb = `<div class="w-14 h-14 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg></div>`;
        } else {
          thumb = `<div class="w-14 h-14 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></div>`;
        }

        return `
          <div class="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs flex items-start gap-3 transition">
            ${thumb}
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                  #${idx + 1} ${m.type}
                </span>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="moveMediaItem(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} class="p-1 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-20 cursor-pointer" title="Geser Naik">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"></path></svg>
                  </button>
                  <button type="button" onclick="moveMediaItem(${idx}, 1)" ${idx === mediaList.length - 1 ? 'disabled' : ''} class="p-1 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-20 cursor-pointer" title="Geser Turun">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  <button type="button" onclick="handleRemoveMediaItem(${idx})" class="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 cursor-pointer" title="Hapus Berkas Ini">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
              <input type="text" value="${(m.caption || '').replace(/"/g, '&quot;')}" oninput="updateMediaItemCaption(${idx}, this.value)" placeholder="Keterangan teks di bawah media ini (opsional)..." class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs focus:border-indigo-600 outline-none bg-zinc-50/50">
            </div>
          </div>
        `;
      }).join('');

      updateMediaModalLivePreview();
    }

    function updateMediaItemCaption(idx, val) {
      if (currentMediaEditing.mediaList && currentMediaEditing.mediaList[idx]) {
        currentMediaEditing.mediaList[idx].caption = val;
        updateMediaModalLivePreview();
      }
    }

    function moveMediaItem(idx, dir) {
      const list = currentMediaEditing.mediaList;
      const target = idx + dir;
      if (target < 0 || target >= list.length) return;
      const temp = list[idx];
      list[idx] = list[target];
      list[target] = temp;
      renderMediaModalList();
    }

    function handleRemoveMediaItem(idx) {
      const item = currentMediaEditing.mediaList[idx];
      if (item) {
        cleanupDriveMediaFile(item);
        currentMediaEditing.mediaList.splice(idx, 1);
        renderMediaModalList();
        showAdminToast("Berkas media dihapus dari daftar.", "info");
      }
    }

    function updateMediaModalLivePreview() {
      const container = document.getElementById("mediaModalPreviewContainer");
      if (!container) return;

      const mediaList = currentMediaEditing.mediaList || [];
      if (mediaList.length === 0) {
        container.innerHTML = '<span class="text-zinc-400 italic">Pratinjau media akan tampil di sini.</span>';
        return;
      }

      container.innerHTML = mediaList.map(m => renderSingleMediaItemPreview(m, mediaList.length > 1)).join('');
      renderAllMathInElement(container);
    }

    function cleanupDriveMediaFile(mediaObj) {
      if (!mediaObj) return;
      let fileId = mediaObj.fileId || "";
      let fileUrl = mediaObj.url || mediaObj.fileUrl || "";

      if (!fileId && fileUrl) {
        fileId = extractDriveFileId(fileUrl);
      }

      // 1. Supabase Cloud Edge Function (Service Account)
      if (fileId && typeof GOOGLE_SYNC_EDGE_URL !== 'undefined' && GOOGLE_SYNC_EDGE_URL) {
        fetch(GOOGLE_SYNC_EDGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "adminDeleteMedia",
            formId: currentFormId || DEFAULT_PRIMARY_FORM_ID,
            fileId: fileId,
            fileUrl: fileUrl,
            driveFolderId: DEFAULT_DRIVE_FOLDER_ID
          })
        }).catch(e => console.warn("Cloud Edge media delete notice:", e));
      }

      // 2. Apps Script Webhook
      const apiUrl = getAdminApiUrl();
      if (fileId && apiUrl && !apiUrl.includes("localhost")) {
        fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "adminDeleteMedia",
            formId: currentFormId || DEFAULT_PRIMARY_FORM_ID,
            fileId: fileId,
            fileUrl: fileUrl
          })
        }).catch(err => console.warn("Notice cleaning drive media:", err));
      }

      // 3. Supabase Storage Deletion
      let sbStoragePath = mediaObj.storagePath || "";
      if (!sbStoragePath && fileUrl && fileUrl.includes("/storage/v1/object/public/pgsd-media/")) {
        sbStoragePath = fileUrl.split("/storage/v1/object/public/pgsd-media/")[1];
      }

      if (sbStoragePath) {
        fetch(`https://eychjnqmqpxzxukiwbqf.supabase.co/storage/v1/object/pgsd-media`, {
          method: "DELETE",
          headers: {
            apikey: "sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
            Authorization: "Bearer sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ prefixes: [sbStoragePath] })
        }).catch(e => console.warn("Supabase storage delete notice:", e));
      }
    }

    async function cleanupAllOrphanMediaFiles(isManual = false) {
      if (!currentFormId) return;
      if (isManual) showAdminToast("Memindai dan membersihkan berkas media sampah...", "info");

      const activeUrls = [];
      const activeFileIds = [];
      (adminFormSchema.tahapan || []).forEach(stage => {
        (stage.fields || []).forEach(f => {
          const list = normalizeMediaList(f);
          list.forEach(m => {
            if (m && m.url) {
              activeUrls.push(m.url);
              if (m.fileId) activeFileIds.push(m.fileId);
            }
          });
        });
      });

      if (typeof GOOGLE_SYNC_EDGE_URL !== 'undefined' && GOOGLE_SYNC_EDGE_URL) {
        try {
          const res = await fetch(GOOGLE_SYNC_EDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "adminCleanupOrphanedMedia",
              formId: currentFormId,
              activeUrls: activeUrls,
              activeFileIds: activeFileIds,
              driveFolderId: DEFAULT_DRIVE_FOLDER_ID
            })
          });
          const data = await res.json();
          if (isManual) {
            showAdminToast(data.message || "Pembersihan berkas sampah di Google Drive berhasil!", "success");
          }
        } catch(e) {
          if (isManual) showAdminToast("Gagal membersihkan media: " + e.message, "error");
        }
      }
    }

    function handleSaveModalMedia() {
      const { sIdx, fIdx } = currentMediaEditing;
      const field = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!field) return;

      const mediaList = currentMediaEditing.mediaList || [];
      const position = document.getElementById("selectMediaPosition")?.value || "ABOVE_QUESTION";

      pushUndoSnapshot('Kelola Media Pertanyaan');

      field.mediaList = mediaList;
      field.mediaPosition = position;
      field.media = mediaList.length > 0 ? Object.assign({}, mediaList[0], { position: position }) : null;

      currentMediaEditing.pendingUploads = [];

      closeAttachMediaModal(true);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      triggerAutoSaveSchema();
      showAdminToast(`${mediaList.length} berkas media berhasil disimpan di draf!`, "success");
    }

    function handleRemoveMedia(sIdx, fIdx) {
      const field = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!field) return;

      const mediaListToDelete = normalizeMediaList(field);
      pushUndoSnapshot('Hapus Media Pertanyaan');
      delete field.media;
      delete field.mediaList;
      delete field.mediaPosition;
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      triggerAutoSaveSchema();

      if (mediaListToDelete.length > 0) {
        mediaListToDelete.forEach(m => cleanupDriveMediaFile(m));
        showAdminToast(`${mediaListToDelete.length} media dihapus dan dibersihkan dari cloud.`, "info");
      } else {
        showAdminToast("Media pertanyaan dihapus.", "info");
      }
    }

    function handleRemoveModalMedia() {
      const { sIdx, fIdx } = currentMediaEditing;
      handleRemoveMedia(sIdx, fIdx);
      closeAttachMediaModal(true);
    }

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

    function renderHubFormsSkeleton() {
      const container = document.getElementById("hubFormsGrid");
      const emptyEl = document.getElementById("emptyHubForms");
      if (emptyEl) emptyEl.classList.add("hidden");
      if (!container) return;

      let skeletonHtml = '';
      for (let i = 0; i < 3; i++) {
        skeletonHtml += `
          <div class="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4 animate-pulse">
            <div class="flex items-center justify-between">
              <div class="h-6 w-20 bg-zinc-200 rounded-lg"></div>
              <div class="h-6 w-16 bg-zinc-200 rounded-full"></div>
            </div>
            <div class="space-y-2">
              <div class="h-5 w-3/4 bg-zinc-200 rounded"></div>
              <div class="h-3.5 w-1/2 bg-zinc-100 rounded"></div>
            </div>
            <div class="p-3 bg-zinc-50 rounded-xl space-y-2">
              <div class="h-3 w-2/3 bg-zinc-200 rounded"></div>
              <div class="h-3 w-1/2 bg-zinc-200 rounded"></div>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-zinc-100">
              <div class="h-9 flex-1 bg-zinc-200 rounded-xl"></div>
              <div class="h-9 w-10 bg-zinc-100 rounded-xl"></div>
            </div>
          </div>
        `;
      }
      container.innerHTML = skeletonHtml;
    }

    function renderStagesSkeleton() {
      const container = document.getElementById("dynamicStagesCanvasContainer");
      if (!container) return;
      container.innerHTML = `
        <div class="space-y-4 animate-pulse">
          <div class="p-5 rounded-2xl bg-white border border-zinc-200 space-y-3 shadow-xs">
            <div class="h-6 w-48 bg-zinc-200 rounded-lg"></div>
            <div class="h-4 w-full bg-zinc-100 rounded"></div>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-zinc-200 space-y-3 shadow-xs">
            <div class="h-5 w-64 bg-zinc-200 rounded"></div>
            <div class="h-10 w-full bg-zinc-100 rounded-xl"></div>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-zinc-200 space-y-3 shadow-xs">
            <div class="h-5 w-56 bg-zinc-200 rounded"></div>
            <div class="h-10 w-full bg-zinc-100 rounded-xl"></div>
          </div>
        </div>
      `;
    }

    function renderGroupsSkeleton() {
      const container = document.getElementById("adminGroupsContainer");
      if (!container) return;
      let html = '';
      for (let i = 0; i < 4; i++) {
        html += `
          <div class="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3 animate-pulse">
            <div class="flex items-center justify-between">
              <div class="h-5 w-28 bg-zinc-200 rounded-md"></div>
              <div class="h-5 w-16 bg-zinc-100 rounded-full"></div>
            </div>
            <div class="h-4 w-40 bg-zinc-100 rounded"></div>
            <div class="flex flex-wrap gap-1.5 pt-2">
              <div class="h-6 w-24 bg-zinc-100 rounded-lg"></div>
              <div class="h-6 w-28 bg-zinc-100 rounded-lg"></div>
              <div class="h-6 w-20 bg-zinc-100 rounded-lg"></div>
            </div>
          </div>
        `;
      }
      container.innerHTML = html;
    }

    function renderResponsesSkeleton() {
      const tbody = document.getElementById("tableResponsesBody");
      if (!tbody) return;
      let html = '';
      for (let i = 0; i < 4; i++) {
        html += `
          <tr class="animate-pulse border-b border-zinc-100">
            <td class="py-3 px-4"><div class="h-4 w-6 bg-zinc-200 rounded"></div></td>
            <td class="py-3 px-4"><div class="h-4 w-28 bg-zinc-200 rounded"></div></td>
            <td class="py-3 px-4"><div class="h-4 w-36 bg-zinc-200 rounded"></div></td>
            <td class="py-3 px-4"><div class="h-4 w-20 bg-zinc-100 rounded"></div></td>
            <td class="py-3 px-4"><div class="h-4 w-12 bg-zinc-200 rounded font-bold"></div></td>
            <td class="py-3 px-4"><div class="h-6 w-14 bg-zinc-100 rounded-lg"></div></td>
          </tr>
        `;
      }
      tbody.innerHTML = html;
    }

    // =========================================================================
    // SYNC STATE & OFFLINE RECOVERY ENGINE
    // =========================================================================
    let realtimeAdminSyncTimer = null;

    function setSyncState(state, customText) {
      const badge = document.getElementById("cloudSyncBadge");
      const dot = document.getElementById("cloudSyncDot");
      const text = document.getElementById("cloudSyncText");
      const banner = document.getElementById("offlineSyncBanner");
      const offlineBadge = document.getElementById("headerOfflineBadge");

      const isOnline = navigator.onLine;

      if (offlineBadge) {
        if (!isOnline || state === 'offline') {
          offlineBadge.classList.remove("hidden");
        } else {
          offlineBadge.classList.add("hidden");
        }
      }

      if (!badge || !dot || !text) return;
      badge.classList.remove("hidden");

      if (state === 'saving') {
        badge.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/80 transition-all shadow-2xs";
        dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0";
        text.textContent = customText || "Menyimpan...";
      } else if (state === 'synced') {
        badge.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700/70 transition-all shadow-2xs";
        dot.className = "w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0";
        text.textContent = customText || "Tersinkron";
        if (banner) banner.classList.add("hidden");
      } else if (state === 'offline' || state === 'error') {
        badge.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/90 transition-all shadow-2xs";
        dot.className = "w-2 h-2 rounded-full bg-rose-500 flex-shrink-0";
        text.textContent = customText || (state === 'offline' ? "Mode Offline" : "Gagal Kirim");
        if (banner) banner.classList.remove("hidden");
      }
    }

    function getPendingSyncQueue() {
      try {
        return JSON.parse(localStorage.getItem("PGSD_ADMIN_PENDING_SYNC") || "[]");
      } catch (e) {
        return [];
      }
    }

    function savePendingSyncQueue(queue) {
      if (!queue || queue.length === 0) {
        localStorage.removeItem("PGSD_ADMIN_PENDING_SYNC");
      } else {
        localStorage.setItem("PGSD_ADMIN_PENDING_SYNC", JSON.stringify(queue));
      }
    }

    function queueSyncTask(type, payload) {
      let queue = getPendingSyncQueue();
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      queue = queue.filter(t => !(t.type === type && t.formId === formKey));
      queue.push({
        type: type,
        formId: formKey,
        payload: payload,
        timestamp: Date.now()
      });
      savePendingSyncQueue(queue);
      processPendingSyncQueue();
    }

    async function processPendingSyncQueue(isManualTrigger = false) {
      if (isSyncingQueue) return false;
      const queue = getPendingSyncQueue();
      if (queue.length === 0) {
        setSyncState('synced');
        return true;
      }

      if (!navigator.onLine) {
        setSyncState('offline', 'Offline (Tersimpan Lokal)');
        return false;
      }

      isSyncingQueue = true;
      setSyncState('saving');

      const sb = getSupabaseClient();
      const apiUrl = getApiUrl();
      let allSuccess = true;

      while (queue.length > 0) {
        const task = queue[0];
        let action = task.type === 'groups' ? 'adminSaveMasterData' : 'adminSaveConfig';
        let bodyPayload = { action: action, formId: task.formId };
        if (task.type === 'groups') {
          bodyPayload.groups = task.payload;
        } else {
          bodyPayload.config = task.payload;
          bodyPayload.customFields = adminFormSchema;
          bodyPayload.formSchema = adminFormSchema;
        }

        // ⚡ FAST-PATH (< 30ms): Simpan langsung ke Supabase PostgreSQL
        if (sb && task.formId) {
          try {
            if (task.type === 'config') {
              await sb.from('pgsd_form_configs').upsert({
                form_id: task.formId,
                config_data: task.payload || adminAppConfig,
                schema_data: adminFormSchema,
                updated_at: new Date().toISOString()
              });
            } else if (task.type === 'groups' && Array.isArray(task.payload)) {
              // Hapus dan simpan ulang groups & students untuk form ini
              await sb.from('pgsd_students').delete().eq('form_id', task.formId);
              await sb.from('pgsd_groups').delete().eq('form_id', task.formId);

              for (let gIdx = 0; gIdx < task.payload.length; gIdx++) {
                const g = task.payload[gIdx];
                const { data: insertedG, error: gErr } = await sb.from('pgsd_groups').insert([{
                  form_id: task.formId,
                  name: g.name,
                  sesi: g.sesi || "Minggu 1",
                  status: g.status || "AKTIF",
                  display_order: gIdx + 1
                }]).select();

                if (!gErr && insertedG && insertedG[0] && Array.isArray(g.members) && g.members.length > 0) {
                  const studentsToInsert = g.members.map((m, mIdx) => ({
                    form_id: task.formId,
                    group_id: insertedG[0].id,
                    group_name: g.name,
                    nim: m.nim || "-",
                    name: m.name || `Mahasiswa ${mIdx + 1}`,
                    status: m.status || "AKTIF"
                  }));
                  await sb.from('pgsd_students').insert(studentsToInsert);
                }
              }
            }
          } catch (sbErr) {
            console.warn("Supabase fast sync notice:", sbErr);
          }
        }

        // 🔄 Asynchronous Background Forward to Google Sheets (Utama & Kustom - Non-blocking)
        const defaultSheetUrl = DEFAULT_API_URL;
        const customUrl = (adminAppConfig && adminAppConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL");

        // 1. Kirim ke Spreadsheet Utama
        if (defaultSheetUrl) {
          fetch(defaultSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(bodyPayload)
          }).catch(e => console.warn("Primary sheet sync queue notice:", e));
        }

        // 2. Kirim juga ke Spreadsheet Kustom Formulir jika dikonfigurasi berbeda
        if (customUrl && customUrl !== defaultSheetUrl) {
          fetch(customUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(bodyPayload)
          }).catch(e => console.warn("Custom sheet sync queue notice:", e));
        }

        queue.shift();
        savePendingSyncQueue(queue);
      }

      isSyncingQueue = false;
      setSyncState('synced');
      return allSuccess;
    }

    // =========================================================================
    // REALTIME RECONNECTION & AUTO-SYNC ENGINE
    // =========================================================================
    function initRealtimeSyncEngine() {
      // 1. Online / Offline Window Events
      window.addEventListener("online", async () => {
        setSyncState('saving', 'Menyambungkan...');
        showAdminToast("Koneksi internet terhubung kembali. Memulai sinkronisasi otomatis...", "info");
        const ok = await processPendingSyncQueue(true);
        if (ok) {
          showAdminToast("Sinkronisasi otomatis berhasil. Seluruh data telah diperbarui!", "success");
        }
      });

      window.addEventListener("offline", () => {
        setSyncState('offline', 'Offline (Tersimpan Lokal)');
        showAdminToast("Koneksi internet terputus. Seluruh perubahan tersimpan aman di browser Anda.", "warning");
      });

      // 2. Periodic Background Heartbeat & Auto-Retry (Every 15s)
      if (realtimeAdminSyncTimer) clearInterval(realtimeAdminSyncTimer);
      realtimeAdminSyncTimer = setInterval(async () => {
        if (navigator.onLine && !isSyncingQueue) {
          const pending = getPendingSyncQueue();
          if (pending.length > 0) {
            await processPendingSyncQueue();
          }
        }
      }, 15000);

      // 3. Tab Visibility Change / Revisit Sync
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          const pending = getPendingSyncQueue();
          if (pending.length > 0) {
            await processPendingSyncQueue();
          }
        }
      });

      // 4. Cross-Tab Storage Event (Multi-Tab Sync)
      window.addEventListener("storage", (e) => {
        if (e.key === "PGSD_CACHE_CONFIG_" + currentFormId || e.key === "PGSD_CACHE_CONFIG") {
          try {
            adminAppConfig = JSON.parse(e.newValue || "{}");
            renderWorkspaceConfigDetails();
          } catch(err) {}
        }
      });
    }

    async function handleManualSyncRetry(btn) {
      if (isSyncingQueue) return;
      const originalContent = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
          <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Mengirim...</span>
        `;
      }

      const success = await processPendingSyncQueue(true);
      if (success) {
        showAdminToast("Koneksi berhasil! Seluruh draf tersinkronkan ke Google Sheets.", "success");
      } else {
        showAdminToast("Server belum dapat dijangkau. Data Anda tetap tersimpan aman di browser dan akan otomatis dikirim saat koneksi pulih.", "warning");
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    }

    function triggerAutoSaveMasterData() {
      queueSyncTask('groups', adminMasterGroups);
    }

    function triggerAutoSaveConfig() {
      queueSyncTask('config', adminAppConfig);
    }

    // =========================================================================
    // AUTHENTICATION & ROUTING INIT
    // =========================================================================
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

    // Continuous auto-enhancer for dynamically injected select elements (debounced)
    if (typeof MutationObserver !== 'undefined') {
      let dropdownDebounceTimer = null;
      const globalDropdownObserver = new MutationObserver(() => {
        if (dropdownDebounceTimer) clearTimeout(dropdownDebounceTimer);
        dropdownDebounceTimer = setTimeout(() => {
          initAllModernDropdowns();
        }, 100);
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
        
        const attachModal = document.getElementById("modalAttachQuestionMedia");
        if (attachModal && !attachModal.classList.contains("hidden")) {
          closeAttachMediaModal(false);
        }
        const createModal = document.getElementById("modalCreateNewForm");
        if (createModal && !createModal.classList.contains("hidden")) {
          closeCreateFormModal();
        }
        const resetModal = document.getElementById("modalResetConfirm");
        if (resetModal && !resetModal.classList.contains("hidden")) {
          closeResetConfirmModal();
        }
        const settingsModal = document.getElementById("modalGlobalSettings");
        if (settingsModal && !settingsModal.classList.contains("hidden")) {
          closeGlobalSettingsModal();
        }
      }
    });

    document.addEventListener("DOMContentLoaded", async function() {
      initAllModernDropdowns();
      const token = sessionStorage.getItem("PGSD_ADMIN_SESSION_TOKEN");
      if (token) {
        // 🔒 Server-Side Token Verification via Supabase Edge Function
        try {
          const resp = await fetch(ADMIN_AUTH_EDGE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_CONFIG.anonKey,
              "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
            },
            body: JSON.stringify({ action: "verify_token", token: token })
          });
          const resData = await resp.json();
          if (resp.ok && resData && resData.valid) {
            sessionStorage.setItem("PGSD_ADMIN_AUTH", "true");
            showDashboard();
          } else {
            sessionStorage.removeItem("PGSD_ADMIN_AUTH");
            sessionStorage.removeItem("PGSD_ADMIN_SESSION_TOKEN");
          }
        } catch(e) {
          // If network check fails, verify token expiration locally
          try {
            const parts = token.split(".");
            if (parts.length === 2) {
              const payload = JSON.parse(atob(parts[0]));
              if (payload.exp && Date.now() < payload.exp && payload.role === "admin") {
                showDashboard();
              } else {
                sessionStorage.removeItem("PGSD_ADMIN_AUTH");
                sessionStorage.removeItem("PGSD_ADMIN_SESSION_TOKEN");
              }
            }
          } catch(err) {
            sessionStorage.removeItem("PGSD_ADMIN_AUTH");
            sessionStorage.removeItem("PGSD_ADMIN_SESSION_TOKEN");
          }
        }
      } else {
        sessionStorage.removeItem("PGSD_ADMIN_AUTH");
      }
      setTimeout(() => renderAllMathInElement(document.body), 100);
    });

    async function handleLogin(e) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      const enteredPass = document.getElementById("inputPassword")?.value.trim();
      const submitBtn = (e && e.target && typeof e.target.querySelector === "function") 
        ? e.target.querySelector('button[type="submit"]') 
        : document.querySelector('#loginScreen button[type="submit"]');
      const errMsg = document.getElementById("loginErrorMsg");
      const card = document.getElementById("loginCard");
      
      if (!enteredPass) return;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Memverifikasi...</span>';
      }
      if (errMsg) errMsg.classList.add("hidden");

      let isAuthenticated = false;
      let errorText = "Kata sandi admin tidak valid. Akses ditolak.";

      // 🛡️ 100% SUPABASE EDGE FUNCTION AUTHENTICATION (Zero Local Hash Bypass)
      try {
        const resp = await fetch(ADMIN_AUTH_EDGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_CONFIG.anonKey,
            "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
          },
          body: JSON.stringify({ action: "verify", password: enteredPass })
        });

        const resData = await resp.json();
        if (resp.ok && resData && resData.success) {
          isAuthenticated = true;
          if (resData.token) {
            sessionStorage.setItem("PGSD_ADMIN_SESSION_TOKEN", resData.token);
            sessionStorage.setItem("PGSD_ADMIN_AUTH", "true");
          }
        } else {
          if (resData && resData.error) errorText = resData.error;
        }
      } catch (err) {
        console.error("Edge function auth connection error:", err);
        errorText = "Gagal menghubungi server autentikasi Supabase. Periksa koneksi internet Anda.";
      }

      if (isAuthenticated) {
        showDashboard();
      } else {
        if (errMsg) {
          errMsg.textContent = errorText;
          errMsg.classList.remove("hidden");
        }
        if (card) {
          card.classList.add("shake");
          setTimeout(() => card.classList.remove("shake"), 500);
        }
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Buka Panel Admin</span>';
      }
    }

    function handleLogout() {
      sessionStorage.removeItem("PGSD_ADMIN_AUTH");
      sessionStorage.removeItem("PGSD_ADMIN_SESSION_TOKEN");
      window.location.reload();
    }

    function showDashboard() {
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("adminDashboard").classList.remove("hidden");
      document.getElementById("inputApiUrl").value = getApiUrl();

      // Periksa parameter URL (apakah sedang membuka specific form ID)
      const urlParams = new URLSearchParams(window.location.search);
      const paramId = urlParams.get('id') || urlParams.get('form');

      if (paramId) {
        openFormWorkspace(paramId, false);
      } else {
        returnToMasterHub(false);
      }

      initAdminRealtimeSync();
    }

    // =========================================================================
    // MASTER FORM HUB CONTROLLERS
    // =========================================================================

    async function syncAllFormsToSpreadsheetAndDrive(formsData, isManual = false) {
      const apiUrl = getAdminApiUrl();
      if (!apiUrl || apiUrl.includes("localhost") || !navigator.onLine) {
        if (isManual) showAdminToast("Webhook Google Spreadsheet belum terkonfigurasi.", "warning");
        return;
      }

      const listToSync = formsData || formsRegistryList;
      if (!Array.isArray(listToSync) || listToSync.length === 0) return;

      if (isManual) showAdminToast("Menyinkronkan formulir ke Google Spreadsheet & Google Drive...", "info");

      try {
        const payload = {
          action: "adminSyncAllForms",
          driveFolderId: DEFAULT_DRIVE_FOLDER_ID,
          forms: listToSync.map(f => ({
            form_id: f.form_id || f.formId,
            form_slug: f.form_slug || f.formSlug,
            judul_form: f.judul_form || f.judulForm,
            mata_kuliah: f.mata_kuliah || f.mataKuliah,
            dosen: f.dosen,
            kelas: f.kelas,
            jurusan: f.jurusan,
            sesi_aktif: f.sesi_aktif || f.sesiAktif,
            status: f.status
          }))
        };

        // 1. Sinkronisasi via Supabase Cloud Edge Function (Google Service Account)
        let edgeSuccess = false;
        if (typeof GOOGLE_SYNC_EDGE_URL !== 'undefined' && GOOGLE_SYNC_EDGE_URL) {
          try {
            const edgeResp = await fetch(GOOGLE_SYNC_EDGE_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const edgeJson = await edgeResp.json();
            if (edgeJson && edgeJson.success) edgeSuccess = true;
          } catch(e) {
            console.warn("Cloud Edge sync notice:", e);
          }
        }

        // 2. Sinkronisasi via Google Apps Script Webhook
        if (apiUrl) {
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          }).catch(e => console.warn("Apps Script sync notice:", e));
        }

        if (isManual) {
          showAdminToast("Sinkronisasi 2 arah ke Google Spreadsheet & Google Drive berhasil!", "success");
        }
      } catch(err) {
        if (isManual) showAdminToast("Gagal sinkronisasi ke Spreadsheet: " + err.message, "error");
      }
    }

    async function handleRefreshHubRegistry(btn) {
      const refreshBtn = btn || document.getElementById("btnRefreshHubRegistry");
      const svg = refreshBtn ? refreshBtn.querySelector("svg") : null;
      if (refreshBtn) refreshBtn.disabled = true;
      if (svg) svg.classList.add("animate-spin", "text-indigo-600");

      try {
        await fetchFormsRegistry(true);
        await syncAllFormsToSpreadsheetAndDrive(formsRegistryList, true);
      } catch (err) {
        showAdminToast("Gagal memperbarui daftar formulir: " + err, "error");
      } finally {
        setTimeout(() => {
          if (refreshBtn) refreshBtn.disabled = false;
          if (svg) svg.classList.remove("animate-spin", "text-indigo-600");
        }, 350);
      }
    }

    async function toggleFormStatusAction(formId, currentStatus) {
      const targetForm = formId || currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const newStatus = currentStatus === 'AKTIF' ? 'TUTUP' : 'AKTIF';

      const formItem = formsRegistryList.find(f => (f.formId || DEFAULT_PRIMARY_FORM_ID) === targetForm);
      if (formItem) {
        formItem.status = newStatus;
        localStorage.setItem("PGSD_CACHE_REGISTRY_FORMS", JSON.stringify(formsRegistryList));
      }
      if (currentFormMeta) currentFormMeta.status = newStatus;

      renderHubFormsGrid();
      updateWorkspaceStatusUI(newStatus === 'AKTIF');

      showAdminToast(
        `Status formulir '${targetForm}': ${newStatus === 'AKTIF' ? 'AKTIF — Menerima Respons' : 'DITUTUP'}`,
        "info"
      );

      // ⚡ FAST-PATH (< 30ms): Simpan langsung ke Supabase PostgreSQL
      const sb = await ensureSupabaseClient();
      if (sb && targetForm) {
        try {
          await sb.from('pgsd_forms').update({
            status: newStatus,
            updated_at: new Date().toISOString()
          }).eq('form_id', targetForm);
        } catch (sbErr) {
          console.warn("Supabase toggle status notice:", sbErr);
        }
      }

      const apiUrl = getApiUrl();
      if (apiUrl) {
        fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "adminUpdateFormMeta", formId: targetForm, status: newStatus })
        }).catch(err => console.warn("Cloud status sync deferred:", err));
      }
    }

    function handleHeaderStatusToggleClick() {
      const isCurrentlyActive = (currentFormMeta?.status || 'AKTIF') === 'AKTIF';
      toggleFormStatusAction(currentFormId || DEFAULT_PRIMARY_FORM_ID, isCurrentlyActive ? 'AKTIF' : 'TUTUP');
    }

    function handleWorkspaceStatusToggle(isChecked) {
      const currentStatus = isChecked ? 'TUTUP' : 'AKTIF';
      toggleFormStatusAction(currentFormId || DEFAULT_PRIMARY_FORM_ID, currentStatus);
    }

    function updateWorkspaceStatusUI(isActive) {
      ["toggleWorkspaceFormStatus_config", "toggleWorkspaceFormStatus"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = isActive;
      });

      // Update Header Compact Status Button
      const headerBtn = document.getElementById("btnHeaderFormStatusToggle");
      const headerDot = document.getElementById("headerStatusDot");
      const headerText = document.getElementById("headerStatusText");

      if (headerBtn && headerDot && headerText) {
        if (isActive) {
          headerBtn.className = "h-9 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0 bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/90";
          headerDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-xs";
          headerText.textContent = "Form Aktif";
          headerBtn.title = "Status Formulir: AKTIF — Menerima respons mahasiswa (Klik untuk mengubah status)";
        } else {
          headerBtn.className = "h-9 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0 bg-zinc-800/90 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200";
          headerDot.className = "w-2.5 h-2.5 rounded-full bg-zinc-500 shrink-0";
          headerText.textContent = "Form Ditutup";
          headerBtn.title = "Status Formulir: DITUTUP — Mahasiswa tidak dapat mengisi (Klik untuk mengaktifkan)";
        }
      }

      const badge = document.getElementById("workspaceStatusLabelBadge");
      const desc = document.getElementById("workspaceStatusDescText");
      const iconBox = document.getElementById("workspaceStatusIconBox");
      const card = document.getElementById("workspaceFormStatusCard");

      if (isActive) {
        if (badge) {
          badge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300";
          badge.textContent = "Aktif (Menerima Respons)";
        }
        if (desc) desc.textContent = "Formulir terbuka dan dapat diakses mahasiswa/penilai untuk mengirimkan penilaian.";
        if (iconBox) {
          iconBox.className = "w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0";
          iconBox.innerHTML = '<span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>';
        }
        if (card) card.className = "bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200";
      } else {
        if (badge) {
          badge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-300";
          badge.textContent = "Ditutup (Tidak Menerima Respons)";
        }
        if (desc) desc.textContent = "Formulir ditutup oleh admin. Mahasiswa tidak dapat mengisi penilaian baru.";
        if (iconBox) {
          iconBox.className = "w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 text-zinc-500 border border-zinc-200 shrink-0";
          iconBox.innerHTML = '<span class="w-3 h-3 rounded-full bg-zinc-400"></span>';
        }
        if (card) card.className = "bg-zinc-50/80 rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200";
      }
    }

    async function returnToMasterHub(updateUrlState = true) {
      currentFormId = null;
      currentFormMeta = null;

      if (updateUrlState) {
        const url = new URL(window.location);
        url.searchParams.delete('id');
        url.searchParams.delete('form');
        window.history.pushState({}, '', url);
      }

      document.getElementById("adminHubContainer").classList.remove("hidden");
      document.getElementById("adminSingleWorkspaceContainer").classList.add("hidden");
      document.getElementById("headerWorkspaceTabs").classList.add("hidden");
      document.getElementById("headerWorkspaceActions")?.classList.add("hidden");
      document.getElementById("cloudSyncBadge")?.classList.add("hidden");
      
      document.getElementById("headerBtnReturnToHub")?.classList.add("hidden");
      document.getElementById("headerBtnReturnToHub")?.classList.remove("flex");
      document.getElementById("activeFormIdBadge")?.classList.add("hidden");

      if (document.getElementById("headerMainTitle")) document.getElementById("headerMainTitle").textContent = "Pusat Pengelolaan Seluruh Formulir Penilaian";
      if (document.getElementById("headerSubTitle")) document.getElementById("headerSubTitle").textContent = "FKIP Universitas Lambung Mangkurat";
      
      const btnBukaForm = document.getElementById("btnBukaFormActive");
      if (btnBukaForm) btnBukaForm.href = getRespondentFormUrl();

      // 🚀 Instant SWR Hydration: Tampilkan cache/fallback seketika (0 ms)
      fallbackRegistryList();
      renderHubFormsGrid();

      // Kemudian sinkronkan dengan cloud di latar belakang
      await fetchFormsRegistry();
    }

    async function fetchFormsRegistry(forceFresh = false) {
      showGlobalLoadingProgress();

      // ⚡ FAST-PATH (< 30ms): Query langsung dari Supabase Database
      const sb = await ensureSupabaseClient();
      if (sb) {
        try {
          let { data: formsData, error: sbErr } = await sb
            .from('pgsd_v_forms_summary')
            .select('*')
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });

          // Fallback langsung ke tabel pgsd_forms jika view mengalami kendala
          if (sbErr || !Array.isArray(formsData) || formsData.length === 0) {
            const { data: rawForms, error: rawErr } = await sb
              .from('pgsd_forms')
              .select('*')
              .order('is_primary', { ascending: false })
              .order('created_at', { ascending: true });
            if (!rawErr && Array.isArray(rawForms) && rawForms.length > 0) {
              formsData = rawForms;
              sbErr = null;
            }
          }

          if (!sbErr && Array.isArray(formsData) && formsData.length > 0) {
            formsRegistryList = formsData.map(f => ({
              formId: f.form_id,
              formSlug: f.form_slug || (f.form_id ? f.form_id.toLowerCase() : ''),
              judulForm: f.judul_form || "Formulir Penilaian",
              mataKuliah: f.mata_kuliah || "-",
              dosen: f.dosen || "-",
              kelas: f.kelas || "-",
              jurusan: f.jurusan || "PGSD",
              sesiAktif: f.sesi_aktif || "Minggu 1",
              status: (f.status || "AKTIF").toUpperCase(),
              isPrimary: !!f.is_primary,
              totalKelompok: f.total_kelompok || 0,
              totalMahasiswa: f.total_mahasiswa || 0,
              totalResponses: f.total_respons !== undefined ? f.total_respons : (f.total_responses || 0),
              rataRata: f.nilai_rata_rata_keseluruhan || 0,
              createdAt: f.created_at
            }));

            localStorage.setItem("PGSD_CACHE_REGISTRY_FORMS", JSON.stringify(formsRegistryList));
            hideGlobalLoadingProgress();
            renderHubFormsGrid();
            initAllModernDropdowns();
            setTimeout(() => {
              const containerEl = document.getElementById("hubFormsGrid");
              if (containerEl) renderAllMathInElement(containerEl);
            }, 60);

            // Asynchronous background sync ke Google Spreadsheet & Drive
            syncAllFormsToSpreadsheetAndDrive(formsData, false);
            return;
          }
        } catch (e) {
          console.warn("Supabase fetchFormsRegistry notice:", e);
        }
      }

      // Fallback lokal jika jaringan offline
      fallbackRegistryList();
      hideGlobalLoadingProgress();
      renderHubFormsGrid();
      initAllModernDropdowns();
    }

    function fallbackRegistryList() {
      const cached = localStorage.getItem("PGSD_CACHE_REGISTRY_FORMS");
      if (cached) {
        try { 
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            formsRegistryList = parsed;
            return;
          }
        } catch(e){}
      }
      formsRegistryList = [{
        formId: DEFAULT_PRIMARY_FORM_ID,
        formSlug: "bk-5e",
        judulForm: "Penilaian Presentasi Kelas 5E PGSD 2026",
        mataKuliah: "Bimbingan Konseling di SD",
        dosen: "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.",
        kelas: "5E",
        jurusan: "PGSD",
        sesiAktif: "Minggu 1",
        status: "AKTIF",
        totalResponses: 0
      }];
      try {
        localStorage.setItem("PGSD_CACHE_REGISTRY_FORMS", JSON.stringify(formsRegistryList));
      } catch(e){}
    }

    // ============================================================
    // MODE PENGEMBANG & SANDBOX DEBUGGING ISOLATED ENGINE
    // ============================================================
    function isDebugModeEnabled() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("debug") === "true" || urlParams.get("debug") === "1") return true;
      return localStorage.getItem("PGSD_DEBUG_MODE") === "true";
    }

    function toggleDebugMode() {
      const current = isDebugModeEnabled();
      const next = !current;
      localStorage.setItem("PGSD_DEBUG_MODE", next ? "true" : "false");
      if (typeof showToast === "function") {
        showToast(next ? "🛠️ Mode Debug Aktif: Form Sandbox DEBUG ditampilkan." : "Mode Debug Dinonaktifkan.", "info");
      }
      renderHubFormsGrid();
      updateDebugModeUI();
    }

    function updateDebugModeUI() {
      const isDebug = isDebugModeEnabled();
      const toggleInput = document.getElementById("toggleDebugModeInput");
      if (toggleInput) toggleInput.checked = isDebug;
    }

    function renderHubFormsGrid() {
      const container = document.getElementById("hubFormsGrid");
      const emptyEl = document.getElementById("emptyHubForms");
      const countEl = document.getElementById("hubTotalFormsCount");
      container.innerHTML = "";

      const isDebug = isDebugModeEnabled();
      updateDebugModeUI();

      const query = (document.getElementById("searchHubFormsInput")?.value || "").trim().toLowerCase();
      const statusFilter = document.getElementById("filterHubStatusSelect")?.value || "ALL";

      let visibleCount = 0;

      formsRegistryList.forEach(form => {
        const fId = form.formId || DEFAULT_PRIMARY_FORM_ID;
        const isDebugForm = (fId === "DEBUG" || (fId && fId.toUpperCase().startsWith("DBG_")));

        // Sembunyikan form DEBUG jika Mode Debug TIDAK aktif
        if (isDebugForm && !isDebug) return;

        const fTitle = form.judulForm || "Formulir Penilaian";
        const fMatkul = form.mataKuliah || "Mata Kuliah";
        const fDosen = form.dosen || "-";
        const fSesi = form.sesiAktif || "Minggu 1";
        const fStatus = (form.status || "AKTIF").toUpperCase();
        const fResponses = form.totalResponses !== undefined ? form.totalResponses : 0;

        let isMatch = true;
        if (query) {
          const matchText = `${fId} ${fTitle} ${fMatkul} ${fDosen} ${form.kelas || ''}`.toLowerCase();
          if (!matchText.includes(query)) isMatch = false;
        }

        if (statusFilter !== "ALL" && fStatus !== statusFilter) {
          isMatch = false;
        }

        if (!isMatch) return;
        visibleCount++;

        const isPrimary = fId === DEFAULT_PRIMARY_FORM_ID;
        const isFormActive = fStatus === 'AKTIF';
        const statusBadge = `
          <button 
            type="button" 
            onclick="event.stopPropagation(); toggleFormStatusAction('${fId}', '${fStatus}')" 
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 ${
              isFormActive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
                : 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:bg-zinc-200'
            }"
            title="${isFormActive ? 'Formulir Aktif (Klik untuk Menutup)' : 'Formulir Ditutup (Klik untuk Mengaktifkan)'}"
          >
            <span class="w-2 h-2 rounded-full ${isFormActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}"></span>
            <span>${isFormActive ? 'Aktif' : 'Ditutup'}</span>
            <span class="w-6 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${isFormActive ? 'bg-emerald-600 justify-end' : 'bg-zinc-300 justify-start'}">
              <span class="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></span>
            </span>
          </button>
        `;

        const card = document.createElement("div");
        card.className = `bg-white rounded-2xl border ${isDebugForm ? 'border-amber-400/90 ring-2 ring-amber-400/20 bg-amber-500/[0.02]' : 'border-zinc-200/90'} p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-zinc-300 transition-all duration-200 group`;

        card.innerHTML = `
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="px-2.5 py-1 rounded-lg ${isDebugForm ? 'bg-amber-100 text-amber-900 border border-amber-300 font-mono font-extrabold text-xs tracking-wider' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono font-bold text-xs tracking-wider'}">
                  PIN: ${fId}
                </span>
                ${isDebugForm ? '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">🛠️ Sandbox QA</span>' : ''}
              </div>
              <div class="flex items-center gap-1.5">
                ${statusBadge}
                ${!isPrimary ? `
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); openDeleteFormModal('${fId}', '${encodeURIComponent(fTitle)}')" 
                    class="w-7 h-7 rounded-full border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition shadow-2xs active:scale-95" 
                    title="Hapus Formulir Ini"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="space-y-1">
              <h3 class="font-bold text-sm sm:text-base text-zinc-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">${smartMathFormat(fTitle)}</h3>
              <p class="text-xs font-semibold text-zinc-600 truncate">${smartMathFormat(fMatkul)}</p>
              <p class="text-[11.5px] text-zinc-400 truncate">Dosen: ${smartMathFormat(fDosen)} • Kelas ${escapeHtml(form.kelas || '-')}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-zinc-100 text-xs">
              <div class="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
                <span class="text-zinc-400 block text-[10px] font-medium">Sesi Aktif</span>
                <span class="font-bold text-zinc-800 truncate block mt-0.5">${escapeHtml(fSesi)}</span>
              </div>
              <div class="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
                <span class="text-zinc-400 block text-[10px] font-medium">Respons Masuk</span>
                <span class="font-bold text-emerald-700 truncate block mt-0.5">${fResponses} Data</span>
              </div>
            </div>
          </div>

          <div class="space-y-2 pt-2.5 border-t border-zinc-100">
            <button 
              type="button" 
              onclick="openFormWorkspace('${fId}')" 
              class="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <svg class="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>Kelola Formulir Ini</span>
            </button>

            <div class="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                onclick="openShareModal('${fId}')" 
                class="py-2 px-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 active:scale-98 text-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Bagikan QR Code & PIN"
              >
                <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
                <span>Bagikan</span>
              </button>

              <button 
                type="button" 
                onclick="window.open(getRespondentFormUrl('${fId}'), '_blank')" 
                class="py-2 px-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-300 active:scale-98 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Buka Formulir Mahasiswa di Tab Baru"
              >
                <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                <span>Buka Form</span>
              </button>

              <button 
                type="button" 
                onclick="cloneFormAction('${fId}')" 
                class="py-2 px-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 active:scale-98 text-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Salin / Duplikat Form Ini"
              >
                <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
                </svg>
                <span>Salin</span>
              </button>
            </div>
          </div>
        `;

        container.appendChild(card);
      });

      if (visibleCount === 0) {
        emptyEl.classList.remove("hidden");
      } else {
        emptyEl.classList.add("hidden");
      }

      renderAllMathInElement(container);
    }

    // =========================================================================
    // ⚙️ SINGLE FORM WORKSPACE CONTROLLERS (ISOLASI TOTAL)
    // =========================================================================
    async function openFormWorkspace(formId, updateUrlState = true) {
      currentFormId = formId || DEFAULT_PRIMARY_FORM_ID;

      if (updateUrlState) {
        const url = new URL(window.location);
        url.searchParams.set('id', currentFormId);
        window.history.pushState({}, '', url);
      }

      document.getElementById("adminHubContainer").classList.add("hidden");
      document.getElementById("adminSingleWorkspaceContainer").classList.remove("hidden");
      document.getElementById("headerWorkspaceTabs").classList.remove("hidden");
      document.getElementById("headerWorkspaceActions")?.classList.remove("hidden");
      document.getElementById("cloudSyncBadge")?.classList.remove("hidden");

      document.getElementById("headerBtnReturnToHub")?.classList.remove("hidden");
      document.getElementById("headerBtnReturnToHub")?.classList.add("flex");
      document.getElementById("activeFormIdBadge")?.classList.remove("hidden");

      // Update Form Title & Headers
      if (document.getElementById("headerMainTitle")) document.getElementById("headerMainTitle").textContent = "Panel Admin Form";
      if (document.getElementById("headerSubTitle")) document.getElementById("headerSubTitle").textContent = `Mengelola Form PIN: ${currentFormId}`;
      if (document.getElementById("activeFormIdBadge")) {
        document.getElementById("activeFormIdBadge").classList.remove("hidden");
        document.getElementById("activeFormIdBadge").classList.add("flex");
        const spanEl = document.getElementById("activeFormIdBadgeText");
        if (spanEl) spanEl.textContent = `ID: ${currentFormId}`;
        else document.getElementById("activeFormIdBadge").textContent = `ID: ${currentFormId}`;
      }

      const btnBukaForm = document.getElementById("btnBukaFormActive");
      if (btnBukaForm) btnBukaForm.href = getRespondentFormUrl(currentFormId);

      const savedTab = localStorage.getItem("PGSD_ADMIN_ACTIVE_TAB") || "config";
      switchAdminTab(savedTab, false);
      initContextualHeaderMorphing();

      // 🚀 Instant SWR Hydration: Tampilkan draf & data lokal seketika (0 ms)
      const cachedMeta = localStorage.getItem(`PGSD_CACHE_META_${currentFormId}`);
      const cachedConfig = localStorage.getItem(`PGSD_CACHE_CONFIG_${currentFormId}`);
      const cachedGroups = localStorage.getItem(`PGSD_CACHE_GROUPS_${currentFormId}`);
      const localDraft = localStorage.getItem(`PGSD_DRAFT_SCHEMA_${currentFormId}`);
      
      if (cachedMeta) { try { currentFormMeta = JSON.parse(cachedMeta); } catch(e){} }
      if (cachedConfig) { try { adminAppConfig = JSON.parse(cachedConfig); } catch(e){} }
      if (cachedGroups) { try { adminMasterGroups = JSON.parse(cachedGroups); } catch(e){} }
      if (localDraft) {
        try { adminFormSchema = JSON.parse(localDraft); } catch(e){}
      } else {
        adminFormSchema = currentFormId === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema();
      }
      initOrNormalizeFormSchema();
      populateConfigFormValues();
      renderCustomQuestionsList();
      renderMasterGroups();
      populateMasterSesiFilter();
      populateResponseGroupFilter();

      // Lanjutkan sinkronisasi penuh dengan server cloud di latar belakang
      await fetchAdminFullData();
    }

    function switchAdminTab(tabKey, updateHash = true) {
      if (!tabKey) tabKey = 'config';
      currentAdminTab = tabKey;
      localStorage.setItem("PGSD_ADMIN_ACTIVE_TAB", tabKey);
      const tabs = ['config', 'settings', 'responses', 'data', 'system'];
      
      tabs.forEach(t => {
        const view = document.getElementById(`adminView_${t}`);
        const btn = document.getElementById(`adminTabBtn_${t}`);
        
        if (t === tabKey) {
          if (view) {
            view.classList.remove("hidden");
            renderAllMathInElement(view);
          }
          if (btn) {
            btn.className = "h-8.5 sm:h-9 px-3 rounded-xl bg-white text-zinc-950 shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center whitespace-nowrap shrink-0 text-xs font-bold";
            const icon = btn.querySelector('svg');
            if (icon) icon.className = "w-3.5 h-3.5 text-indigo-600 shrink-0";
          }
        } else {
          if (view) view.classList.add("hidden");
          if (btn) {
            btn.className = "h-8.5 sm:h-9 px-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition flex items-center justify-center gap-1.5 cursor-pointer text-center whitespace-nowrap shrink-0 text-xs font-medium";
            const icon = btn.querySelector('svg');
            if (icon) icon.className = "w-3.5 h-3.5 shrink-0";
          }
        }
      });

      // Floating action dock only visible on Question Canvas
      const dock = document.getElementById("googleFormsFloatingDock");
      if (dock) {
        if (tabKey === 'config') {
          dock.classList.remove("hidden");
          setTimeout(updateFloatingDockPosition, 60);
        } else {
          dock.classList.add("hidden");
        }
      }

      if (tabKey === 'responses' && adminResponsesList.length === 0) {
        fetchAdminResponsesList();
      }
    }

    // =========================================================================
    // FETCH FULL DATA UNTUK FORM WORKSPACE TERISOLASI
    // =========================================================================
    async function fetchAdminFullData() {
      const refreshBtn = document.getElementById("btnRefreshMasterData");
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Menyegarkan...</span>
        `;
      }

      const restoreBtnDefault = () => {
        if (refreshBtn) {
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = `
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Segarkan</span>
          `;
        }
      };

      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;

      // ⚡ FAST-PATH (< 30ms): Query langsung dari Supabase Database
      const sb = await ensureSupabaseClient();
      if (sb) {
        try {
          const [formRes, configRes, groupsRes, studentsRes, respCountRes] = await Promise.all([
            sb.from('pgsd_forms').select('*').eq('form_id', targetForm).single(),
            sb.from('pgsd_form_configs').select('*').eq('form_id', targetForm).single(),
            sb.from('pgsd_groups').select('*').eq('form_id', targetForm).order('display_order', { ascending: true }),
            sb.from('pgsd_students').select('*').eq('form_id', targetForm),
            sb.from('pgsd_responses').select('id', { count: 'exact', head: true }).eq('form_id', targetForm).eq('status', 'VALID')
          ]);

          if (!formRes.error && formRes.data) {
            const formRow = formRes.data;
            const configRow = configRes.data;
            const groupsRows = groupsRes.data || [];
            const studentsRows = studentsRes.data || [];
            const totalResp = respCountRes.count || 0;

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

            adminAppConfig = (configRow && configRow.config_data) || {};
            adminFormSchema = (configRow && configRow.schema_data) || (targetForm === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema());

            adminMasterGroups = groupsRows.map(g => ({
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

            initOrNormalizeFormSchema();

            try {
              localStorage.setItem(`PGSD_CACHE_META_${targetForm}`, JSON.stringify(currentFormMeta));
              localStorage.setItem(`PGSD_CACHE_CONFIG_${targetForm}`, JSON.stringify(adminAppConfig));
              localStorage.setItem(`PGSD_CACHE_GROUPS_${targetForm}`, JSON.stringify(adminMasterGroups));
              localStorage.setItem(`PGSD_DRAFT_SCHEMA_${targetForm}`, JSON.stringify(adminFormSchema));
            } catch(e){}

            const titleBanner = document.getElementById("activeFormTitleBanner");
            if (titleBanner) titleBanner.textContent = currentFormMeta.judulForm || adminAppConfig["Judul_Form"] || "Penilaian Presentasi";
            const subjBanner = document.getElementById("activeFormSubjectBanner");
            if (subjBanner) subjBanner.textContent = `${currentFormMeta.mataKuliah || adminAppConfig["Mata_Kuliah"] || ""} • ${currentFormMeta.dosen || adminAppConfig["Dosen_Pengampu"] || ""}`;
            document.getElementById("labelTotalResponses").textContent = `${totalResp} Data`;
            
            renderMasterGroups();
            populateConfigFormValues();
            const isFormCurrentlyActive = (currentFormMeta?.status || 'AKTIF') === 'AKTIF';
            updateWorkspaceStatusUI(isFormCurrentlyActive);
            renderCustomQuestionsList();
            populateMasterSesiFilter();
            populateResponseGroupFilter();
            setSyncState('synced');
            restoreBtnDefault();
            return;
          }
        } catch (sbErr) {
          console.warn("Supabase fetchAdminFullData notice:", sbErr);
        }
      }

      const apiUrl = getApiUrl();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${apiUrl}?action=adminGetFullData&formId=${encodeURIComponent(targetForm)}&_t=${Date.now()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const res = await response.json();

        if (res.success) {
          currentFormMeta = res.formMeta || {};
          adminMasterGroups = res.groups || [];
          adminAppConfig = res.config || {};
          adminCustomQuestions = res.customFields || [];
          if (res.formSchema && res.formSchema.tahapan) {
            adminFormSchema = res.formSchema;
          } else if (typeof res.customFields === 'object' && res.customFields.tahapan) {
            adminFormSchema = res.customFields;
          } else {
            const localDraft = localStorage.getItem(`PGSD_DRAFT_SCHEMA_${targetForm}`);
            if (localDraft) {
              try {
                adminFormSchema = JSON.parse(localDraft);
              } catch(e) {
                adminFormSchema = targetForm === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema();
              }
            } else {
              adminFormSchema = targetForm === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema();
            }
          }
          initOrNormalizeFormSchema();

          // Simpan cache lokal agar pembukaan selanjutnya instan 0ms
          try {
            localStorage.setItem(`PGSD_CACHE_META_${targetForm}`, JSON.stringify(currentFormMeta));
            localStorage.setItem(`PGSD_CACHE_CONFIG_${targetForm}`, JSON.stringify(adminAppConfig));
            localStorage.setItem(`PGSD_CACHE_GROUPS_${targetForm}`, JSON.stringify(adminMasterGroups));
            localStorage.setItem(`PGSD_DRAFT_SCHEMA_${targetForm}`, JSON.stringify(adminFormSchema));
          } catch(e){}

          const titleBanner = document.getElementById("activeFormTitleBanner");
          if (titleBanner) titleBanner.textContent = currentFormMeta.judulForm || adminAppConfig["Judul_Form"] || "Penilaian Presentasi";
          const subjBanner = document.getElementById("activeFormSubjectBanner");
          if (subjBanner) subjBanner.textContent = `${currentFormMeta.mataKuliah || adminAppConfig["Mata_Kuliah"] || ""} • ${currentFormMeta.dosen || adminAppConfig["Dosen_Pengampu"] || ""}`;
          document.getElementById("labelTotalResponses").textContent = `${res.totalResponses || 0} Data`;
          
          renderMasterGroups();
          populateConfigFormValues();
          const isFormCurrentlyActive = (currentFormMeta?.status || 'AKTIF') === 'AKTIF';
          updateWorkspaceStatusUI(isFormCurrentlyActive);
          renderCustomQuestionsList();
          populateMasterSesiFilter();
          populateResponseGroupFilter();
          setSyncState('synced');
        } else {
          showAdminToast("Gagal memuat data formulir: " + res.error, "error");
          const localDraft = localStorage.getItem(`PGSD_DRAFT_SCHEMA_${targetForm}`);
          if (localDraft) {
            try { adminFormSchema = JSON.parse(localDraft); } catch(e) { adminFormSchema = targetForm === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema(); }
          } else {
            adminFormSchema = targetForm === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema();
          }
          initOrNormalizeFormSchema();
          renderMasterGroups();
          populateConfigFormValues();
          const isFormCurrentlyActive = (currentFormMeta?.status || 'AKTIF') === 'AKTIF';
          updateWorkspaceStatusUI(isFormCurrentlyActive);
          renderCustomQuestionsList();
        }
      } catch (err) {
        console.warn("Sync fetch timed out or offline, using local cached state:", err);
        const localDraft = localStorage.getItem(`PGSD_DRAFT_SCHEMA_${targetForm}`);
        if (localDraft) {
          try { adminFormSchema = JSON.parse(localDraft); } catch(e) { adminFormSchema = targetForm === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema(); }
        } else {
          adminFormSchema = targetForm === DEFAULT_PRIMARY_FORM_ID ? getDefaultFormSchema(adminAppConfig) : getBlankFormSchema();
        }
        initOrNormalizeFormSchema();
        renderMasterGroups();
        populateConfigFormValues();
        const isFormCurrentlyActive = (currentFormMeta?.status || 'AKTIF') === 'AKTIF';
        updateWorkspaceStatusUI(isFormCurrentlyActive);
        renderCustomQuestionsList();
      } finally {
        restoreBtnDefault();
      }
    }

    // =========================================================================
    // TAB 1: RENDER GROUPS & MEMBERS
    // =========================================================================
    function renderMasterGroups() {
      const container = document.getElementById("masterGroupsListContainer");
      const emptyEl = document.getElementById("emptyMasterGroups");
      container.innerHTML = "";

      const query = (document.getElementById("searchMasterInput")?.value || "").trim().toLowerCase();
      const sesiFilter = document.getElementById("filterMasterSesiSelect")?.value || "ALL";

      let visibleCount = 0;

      adminMasterGroups.forEach((grp, gIdx) => {
        const gName = grp.name || "";
        const gSesi = grp.sesi || "Minggu 1";
        const gStatus = grp.status || "AKTIF";
        const members = grp.members || [];

        let isMatch = true;
        if (query) {
          if (!gName.toLowerCase().includes(query) && !gSesi.toLowerCase().includes(query)) {
            const hasMember = members.some(m => (m.name || "").toLowerCase().includes(query) || (m.nim || "").toLowerCase().includes(query));
            if (!hasMember) isMatch = false;
          }
        }

        if (sesiFilter !== "ALL" && gSesi !== sesiFilter) {
          isMatch = false;
        }

        if (!isMatch) return;
        visibleCount++;

        const card = document.createElement("div");
        card.className = "bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 space-y-3 shadow-xs flex flex-col justify-between";

        const memberRows = members.map((m, mIdx) => `
          <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
            <div class="min-w-0 flex-1">
              <span class="font-semibold text-zinc-900 truncate block">${m.name}</span>
              <p class="text-[10px] text-zinc-400 font-mono truncate">${m.nim || 'NIM -'}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button type="button" onclick="openEditMemberModal(${gIdx}, ${mIdx})" class="p-1 rounded hover:bg-zinc-200 text-zinc-600 transition cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button type="button" onclick="deleteMember(${gIdx}, ${mIdx})" class="p-1 rounded hover:bg-rose-100 text-rose-600 transition cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
        `).join("");

        card.innerHTML = `
          <div class="space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="font-bold text-sm text-zinc-900">${gName}</h3>
                <span class="text-[11px] font-medium text-indigo-600 font-mono">${gSesi}</span>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" onclick="openEditGroupModal(${gIdx})" class="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button type="button" onclick="deleteGroup(${gIdx})" class="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>

            <div class="space-y-1.5 pt-1">
              ${members.length > 0 ? memberRows : '<p class="text-[11px] text-zinc-400 italic">Belum ada anggota mahasiswa.</p>'}
            </div>
          </div>

          <button type="button" onclick="openAddMemberModal(${gIdx})" class="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-500 text-zinc-600 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Tambah Mahasiswa</span>
          </button>
        `;

        container.appendChild(card);
      });

      if (visibleCount === 0) {
        emptyEl.classList.remove("hidden");
      } else {
        emptyEl.classList.add("hidden");
      }
    }

    // =========================================================================
    // DYNAMIC HEADER INFO CARDS ENGINE (CUSTOMIZABLE METADATA CARDS)
    // =========================================================================
    function getStandardDefaultHeaderCards() {
      return [
        { id: 'matkul', label: 'Mata Kuliah:', value: adminAppConfig["Mata_Kuliah"] || (currentFormMeta?.mataKuliah || ""), placeholder: 'Nama Mata Kuliah' },
        { id: 'dosen', label: 'Dosen Pengampu:', value: adminAppConfig["Dosen_Pengampu"] || (currentFormMeta?.dosen || ""), placeholder: 'Nama Dosen Pengampu' },
        { id: 'kelas', label: 'Kelas:', value: adminAppConfig["Kelas"] || (currentFormMeta?.kelas || "5E"), placeholder: '5E' },
        { id: 'jurusan', label: 'Program Studi:', value: adminAppConfig["Jurusan"] || (currentFormMeta?.jurusan || "PGSD"), placeholder: 'PGSD' }
      ];
    }

    function initOrGetHeaderInfoCards() {
      if (!adminAppConfig.Header_Info_Cards || !Array.isArray(adminAppConfig.Header_Info_Cards) || adminAppConfig.Header_Info_Cards.length === 0) {
        adminAppConfig.Header_Info_Cards = getStandardDefaultHeaderCards();
      }
      return adminAppConfig.Header_Info_Cards;
    }

    function renderBuilderHeaderInfoCards() {
      const container = document.getElementById("builderHeaderInfoGrid");
      if (!container) return;

      const cards = initOrGetHeaderInfoCards();
      if (cards.length === 0) {
        container.className = "p-3 rounded-lg bg-zinc-100/80 text-center text-xs text-zinc-500 italic";
        container.innerHTML = 'Belum ada kartu informasi tambahan. Klik tombol "+ Tambah Info" di atas.';
        return;
      }

      const colsClass = cards.length === 1 ? 'grid-cols-1' : (cards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : (cards.length === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'));
      container.className = `grid ${colsClass} gap-2.5 sm:gap-3 text-xs`;

      let html = '';
      cards.forEach((card, idx) => {
        html += `
          <div class="group/hdrCard p-2.5 sm:p-3 rounded-xl bg-zinc-50/90 border border-zinc-200/80 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100/50 transition shadow-2xs relative flex flex-col justify-between">
            <div class="flex items-center justify-between gap-1 mb-1">
              <textarea 
                rows="1" 
                placeholder="Label (contoh: Dosen:)" 
                title="Klik untuk mengubah label informasi ini"
                oninput="autoResizeTextarea(this); handleHeaderCardLabelChange(${idx}, this.value)" 
                class="text-zinc-500 font-bold text-[10.5px] sm:text-[11px] bg-transparent border-b border-dashed border-transparent hover:border-zinc-300 focus:border-indigo-600 focus:text-indigo-900 outline-none w-full px-0.5 py-0.5 rounded transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-snug"
              >${escapeHtml(card.label || '')}</textarea>
              <button 
                type="button" 
                onclick="deleteHeaderInfoCard(${idx})" 
                class="w-5 h-5 rounded-md hover:bg-rose-50 text-zinc-400 hover:text-rose-600 flex items-center justify-center text-xs opacity-0 group-hover/hdrCard:opacity-100 focus:opacity-100 transition cursor-pointer shrink-0" 
                title="Hapus kotak informasi ini"
              >
                ✕
              </button>
            </div>

            <div class="space-y-0.5">
              <textarea 
                rows="1" 
                id="headerCardInput_${idx}"
                placeholder="${escapeHtml(card.placeholder || 'Isi nilai...')}" 
                oninput="autoResizeTextarea(this); handleHeaderCardValueChange(${idx}, this.value)" 
                class="w-full font-semibold text-zinc-900 bg-transparent border-b border-zinc-300 hover:border-zinc-500 focus:border-indigo-600 outline-none pb-0.5 transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-snug"
              >${escapeHtml(card.value || '')}</textarea>
              ${getLiveMathBadgeHtml(card.value, `liveMathHeaderCard_${idx}`)}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      setTimeout(() => {
        renderAllMathInElement(container);
      }, 40);
    }

    function handleHeaderCardLabelChange(idx, val) {
      const cards = initOrGetHeaderInfoCards();
      if (!cards[idx]) return;
      cards[idx].label = val;
      syncLegacyConfigFromHeaderCards();
      handleConfigInputAutoSave();
    }

    function handleHeaderCardValueChange(idx, val) {
      const cards = initOrGetHeaderInfoCards();
      if (!cards[idx]) return;
      cards[idx].value = val;
      updateLiveMathBadge(val, `liveMathHeaderCard_${idx}`);
      syncLegacyConfigFromHeaderCards();
      handleConfigInputAutoSave();
    }

    function addNewHeaderInfoCard() {
      pushUndoSnapshot('Tambah Kotak Info');
      const cards = initOrGetHeaderInfoCards();
      cards.push({
        id: 'info_' + Date.now().toString(36),
        label: 'Info Baru:',
        value: '',
        placeholder: 'Isi nilai...'
      });
      renderBuilderHeaderInfoCards();
      handleConfigInputAutoSave();
      showAdminToast("Kotak informasi baru berhasil ditambahkan.", "success");
    }

    function deleteHeaderInfoCard(idx) {
      pushUndoSnapshot('Hapus Kotak Info');
      const cards = initOrGetHeaderInfoCards();
      if (!cards[idx]) return;
      const removed = cards.splice(idx, 1);
      renderBuilderHeaderInfoCards();
      syncLegacyConfigFromHeaderCards();
      handleConfigInputAutoSave();
      showAdminToast(`Kotak '${removed[0]?.label || 'Info'}' berhasil dihapus.`, "info");
    }

    function resetHeaderInfoCards() {
      pushUndoSnapshot('Reset Kotak Info');
      adminAppConfig.Header_Info_Cards = getStandardDefaultHeaderCards();
      renderBuilderHeaderInfoCards();
      syncLegacyConfigFromHeaderCards();
      handleConfigInputAutoSave();
      showAdminToast("Kotak informasi dikembalikan ke susunan 4 identitas standar.", "success");
    }

    function syncLegacyConfigFromHeaderCards() {
      const cards = initOrGetHeaderInfoCards();
      cards.forEach(c => {
        const lbl = (c.label || '').toLowerCase();
        if (c.id === 'matkul' || lbl.includes('mata kuliah') || lbl.includes('matkul')) {
          adminAppConfig["Mata_Kuliah"] = c.value;
        } else if (c.id === 'dosen' || lbl.includes('dosen')) {
          adminAppConfig["Dosen_Pengampu"] = c.value;
        } else if (c.id === 'kelas' || lbl.includes('kelas')) {
          adminAppConfig["Kelas"] = c.value;
        } else if (c.id === 'jurusan' || lbl.includes('prodi') || lbl.includes('program studi') || lbl.includes('jurusan')) {
          adminAppConfig["Jurusan"] = c.value;
        }
      });
    }

    function updateEmailModeCardsUI(activeMode) {
      document.querySelectorAll(".email-mode-card").forEach(card => {
        const input = card.querySelector('input[name="cfg_Mode_Pengumpulan_Email"]');
        if (input) {
          if (input.value === activeMode) {
            card.className = "email-mode-card relative p-3.5 rounded-xl border border-indigo-300 bg-indigo-50/50 flex flex-col justify-between gap-2.5 cursor-pointer transition select-none group shadow-xs";
          } else {
            card.className = "email-mode-card relative p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 flex flex-col justify-between gap-2.5 cursor-pointer transition select-none group shadow-2xs";
          }
        }
      });
    }

    function handleEmailModeCardChange(mode) {
      adminAppConfig["Mode_Pengumpulan_Email"] = mode;
      updateEmailModeCardsUI(mode);
    }

    // =========================================================================
    // TAB 2: CONFIG & FORM BUILDER
    // =========================================================================
    function populateConfigFormValues() {
      // Synchronize config fallback with currentFormMeta
      if (currentFormMeta) {
        if (!adminAppConfig["Judul_Form"] && currentFormMeta.judulForm) adminAppConfig["Judul_Form"] = currentFormMeta.judulForm;
        if (!adminAppConfig["Mata_Kuliah"] && currentFormMeta.mataKuliah) adminAppConfig["Mata_Kuliah"] = currentFormMeta.mataKuliah;
        if (!adminAppConfig["Dosen_Pengampu"] && currentFormMeta.dosen) adminAppConfig["Dosen_Pengampu"] = currentFormMeta.dosen;
        if (!adminAppConfig["Kelas"] && currentFormMeta.kelas) adminAppConfig["Kelas"] = currentFormMeta.kelas;
        if (!adminAppConfig["Jurusan"] && currentFormMeta.jurusan) adminAppConfig["Jurusan"] = currentFormMeta.jurusan;
      }

      const keys = [
        "Judul_Form", "Mata_Kuliah", "Dosen_Pengampu", "Kelas", "Jurusan", "Deskripsi_Form",
        "Pembuat_Web_Prefix", "Pembuat_Web_Nama", "Pembuat_Web_Nim",
        "Nilai_Kelompok_Min", "Nilai_Kelompok_Max",
        "Maksimal_Pilihan_Presentator_Terbaik", "Maksimal_Karakter_Evaluasi",
        "Tampilkan_Ulasan_Publik", "Kewajiban_Menilai_Penyaji",
        "Jadwal_Aktif", "Jadwal_Mulai", "Jadwal_Selesai", "Batas_Maksimal_Respons",
        "Pesan_Form_Belum_Buka", "Pesan_Form_Ditutup",
        "Cegah_Penilaian_Diri", "Kunci_Respons_Ganda"
      ];

      keys.forEach(k => {
        const el = document.getElementById(`cfg_${k}`);
        if (el && adminAppConfig[k] !== undefined) {
          if (el.type === 'checkbox') {
            el.checked = adminAppConfig[k] === true || adminAppConfig[k] === 'true';
          } else {
            el.value = adminAppConfig[k];
          }
        }
      });

      // Sync Mode Pengumpulan Email (Google Forms Style)
      const currentEmailMode = adminAppConfig["Mode_Pengumpulan_Email"] || "ULM_ONLY";
      document.querySelectorAll('input[name="cfg_Mode_Pengumpulan_Email"]').forEach(radio => {
        radio.checked = (radio.value === currentEmailMode);
      });
      updateEmailModeCardsUI(currentEmailMode);

      handleScheduleToggle(document.getElementById('cfg_Jadwal_Aktif')?.checked || false);

      const settingsBadge = document.getElementById("settingsFormIdBadge");
      if (settingsBadge) settingsBadge.textContent = currentFormId || DEFAULT_PRIMARY_FORM_ID;

      if (document.getElementById('cfg_Judul_Form')) {
        updateLiveMathBadge(adminAppConfig["Judul_Form"] || "", 'liveMathCfgJudul');
      }
      if (document.getElementById('cfg_Deskripsi_Form')) {
        updateLiveMathBadge(adminAppConfig["Deskripsi_Form"] || "", 'liveMathCfgDesc');
      }
      if (document.getElementById('cfg_Mata_Kuliah')) {
        updateLiveMathBadge(adminAppConfig["Mata_Kuliah"] || "", 'liveMathCfgMataKuliah');
      }
      if (document.getElementById('cfg_Dosen_Pengampu')) {
        updateLiveMathBadge(adminAppConfig["Dosen_Pengampu"] || "", 'liveMathCfgDosenPengampu');
      }
      if (document.getElementById('cfg_Kelas')) {
        updateLiveMathBadge(adminAppConfig["Kelas"] || "", 'liveMathCfgKelas');
      }
      if (document.getElementById('cfg_Jurusan')) {
        updateLiveMathBadge(adminAppConfig["Jurusan"] || "", 'liveMathCfgJurusan');
      }
      if (document.getElementById('cfg_Pembuat_Web_Nama')) {
        updateLiveMathBadge(adminAppConfig["Pembuat_Web_Nama"] || "", 'liveMathCfgPembuatNama');
      }
      if (document.getElementById('cfg_Pembuat_Web_Nim')) {
        updateLiveMathBadge(adminAppConfig["Pembuat_Web_Nim"] || "", 'liveMathCfgPembuatNim');
      }

      // Sync Prefix Selection / Custom State
      syncPrefixSelectFromValue(adminAppConfig["Pembuat_Web_Prefix"]);

      // Render Dynamic Header Info Cards in form header
      renderBuilderHeaderInfoCards();

      // Populate Spreadsheet & Drive custom settings
      if (document.getElementById("inputApiUrl")) {
        document.getElementById("inputApiUrl").value = adminAppConfig["Spreadsheet_Url"] || adminAppConfig["Spreadsheet_Webhook_Url"] || (currentFormMeta?.spreadsheetUrl || "");
      }
      if (document.getElementById("inputDriveFolderName")) {
        document.getElementById("inputDriveFolderName").value = adminAppConfig["Google_Drive_Folder_Name"] || "";
      }

      const currentSesi = adminAppConfig["Sesi_Minggu_Aktif"] || "Minggu 1";
      const lblSesi = document.getElementById("labelCurrentActiveSesi");
      const selSesi = document.getElementById("selectQuickSesiAktif");
      if (lblSesi) lblSesi.textContent = currentSesi;
      if (selSesi) selSesi.value = currentSesi;

      // Automatically expand all textareas to content height without scrollbars
      triggerGlobalAutoResize();
      initAllInPlaceRichFields();
    }

    function handleConfigInputAutoSave(immediate = false) {
      const keys = [
        "Judul_Form", "Mata_Kuliah", "Dosen_Pengampu", "Kelas", "Jurusan", "Deskripsi_Form",
        "Pembuat_Web_Prefix", "Pembuat_Web_Nama", "Pembuat_Web_Nim",
        "Nilai_Kelompok_Min", "Nilai_Kelompok_Max",
        "Maksimal_Pilihan_Presentator_Terbaik", "Maksimal_Karakter_Evaluasi",
        "Tampilkan_Ulasan_Publik", "Kewajiban_Menilai_Penyaji",
        "Jadwal_Aktif", "Jadwal_Mulai", "Jadwal_Selesai", "Batas_Maksimal_Respons",
        "Pesan_Form_Belum_Buka", "Pesan_Form_Ditutup",
        "Cegah_Penilaian_Diri", "Kunci_Respons_Ganda"
      ];

      keys.forEach(k => {
        const el = document.getElementById(`cfg_${k}`);
        if (el) {
          if (el.type === 'checkbox') {
            adminAppConfig[k] = el.checked;
          } else {
            adminAppConfig[k] = el.value;
          }
        }
      });

      const selEmailMode = document.querySelector('input[name="cfg_Mode_Pengumpulan_Email"]:checked');
      if (selEmailMode) {
        adminAppConfig["Mode_Pengumpulan_Email"] = selEmailMode.value;
        updateEmailModeCardsUI(selEmailMode.value);
      }

      if (document.getElementById('cfg_Judul_Form')) {
        updateLiveMathBadge(document.getElementById('cfg_Judul_Form').value, 'liveMathCfgJudul');
      }
      if (document.getElementById('cfg_Deskripsi_Form')) {
        updateLiveMathBadge(document.getElementById('cfg_Deskripsi_Form').value, 'liveMathCfgDesc');
      }
      if (document.getElementById('cfg_Mata_Kuliah')) {
        updateLiveMathBadge(document.getElementById('cfg_Mata_Kuliah').value, 'liveMathCfgMataKuliah');
      }
      if (document.getElementById('cfg_Dosen_Pengampu')) {
        updateLiveMathBadge(document.getElementById('cfg_Dosen_Pengampu').value, 'liveMathCfgDosenPengampu');
      }
      if (document.getElementById('cfg_Kelas')) {
        updateLiveMathBadge(document.getElementById('cfg_Kelas').value, 'liveMathCfgKelas');
      }
      if (document.getElementById('cfg_Jurusan')) {
        updateLiveMathBadge(document.getElementById('cfg_Jurusan').value, 'liveMathCfgJurusan');
      }
      if (document.getElementById('cfg_Pembuat_Web_Nama')) {
        updateLiveMathBadge(document.getElementById('cfg_Pembuat_Web_Nama').value, 'liveMathCfgPembuatNama');
      }
      if (document.getElementById('cfg_Pembuat_Web_Nim')) {
        updateLiveMathBadge(document.getElementById('cfg_Pembuat_Web_Nim').value, 'liveMathCfgPembuatNim');
      }

      // Synchronize top banner in real-time
      const activeTitleBanner = document.getElementById("activeFormTitleBanner");
      const activeSubjBanner = document.getElementById("activeFormSubjectBanner");
      if (activeTitleBanner && adminAppConfig["Judul_Form"]) {
        activeTitleBanner.innerHTML = smartMathFormat(adminAppConfig["Judul_Form"]);
        activeTitleBanner.classList.add("math-renderable");
        renderAllMathInElement(activeTitleBanner);
      }
      if (activeSubjBanner) {
        activeSubjBanner.innerHTML = `${smartMathFormat(adminAppConfig["Mata_Kuliah"] || '-')} • ${smartMathFormat(adminAppConfig["Dosen_Pengampu"] || '-')}`;
        activeSubjBanner.classList.add("math-renderable");
        renderAllMathInElement(activeSubjBanner);
      }

      if (configDebounceTimer) clearTimeout(configDebounceTimer);
      if (immediate) {
        triggerAutoSaveConfig();
      } else {
        configDebounceTimer = setTimeout(() => {
          triggerAutoSaveConfig();
        }, 800);
      }
    }

    function handleQuickSesiChange(val) {
      adminAppConfig["Sesi_Minggu_Aktif"] = val;
      document.getElementById("labelCurrentActiveSesi").textContent = val;
      triggerAutoSaveConfig();
      showAdminToast(`Sesi aktif diubah menjadi '${val}' (Tersimpan Otomatis).`, "success");
    }

    // Prefix Custom Logic (Max 50 Characters)
    function handlePrefixSelectChange(val) {
      const customContainer = document.getElementById("customPrefixContainer");
      const customInput = document.getElementById("cfg_Pembuat_Web_Prefix_Custom");
      const hiddenInput = document.getElementById("cfg_Pembuat_Web_Prefix");
      const charCounter = document.getElementById("prefixCharCounter");

      if (val === '__CUSTOM__') {
        if (customContainer) customContainer.classList.remove("hidden");
        if (charCounter) charCounter.classList.remove("hidden");
        const customVal = (customInput ? customInput.value : "") || "";
        if (hiddenInput) hiddenInput.value = customVal;
        if (charCounter) charCounter.textContent = `${customVal.length}/50`;
        updateLiveMathBadge(customVal, 'liveMathCfgPrefix');
        if (customInput) customInput.focus();
      } else {
        if (customContainer) customContainer.classList.add("hidden");
        if (charCounter) charCounter.classList.add("hidden");
        if (hiddenInput) hiddenInput.value = val;
      }
      handleConfigInputAutoSave(true);
    }

    function handleCustomPrefixInput(val) {
      if (val.length > 50) {
        val = val.substring(0, 50);
        const customInput = document.getElementById("cfg_Pembuat_Web_Prefix_Custom");
        if (customInput) customInput.value = val;
      }
      const charCounter = document.getElementById("prefixCharCounter");
      if (charCounter) {
        charCounter.textContent = `${val.length}/50`;
        if (val.length >= 45) {
          charCounter.className = "text-[9.5px] font-mono text-rose-500 font-bold";
        } else {
          charCounter.className = "text-[9.5px] font-mono text-zinc-400";
        }
      }
      const hiddenInput = document.getElementById("cfg_Pembuat_Web_Prefix");
      if (hiddenInput) hiddenInput.value = val;
      updateLiveMathBadge(val, 'liveMathCfgPrefix');
      handleConfigInputAutoSave();
    }

    function syncPrefixSelectFromValue(prefixVal) {
      const select = document.getElementById("cfg_Pembuat_Web_Prefix_Select");
      const customContainer = document.getElementById("customPrefixContainer");
      const customInput = document.getElementById("cfg_Pembuat_Web_Prefix_Custom");
      const hiddenInput = document.getElementById("cfg_Pembuat_Web_Prefix");
      const charCounter = document.getElementById("prefixCharCounter");

      const standardOptions = ["Dibuat oleh", "Dikembangkan oleh", "Design & Development by", "Kredit Sistem:"];
      const currentVal = prefixVal !== undefined && prefixVal !== null ? prefixVal : "Dibuat oleh";

      if (hiddenInput) hiddenInput.value = currentVal;

      if (standardOptions.includes(currentVal)) {
        if (select) select.value = currentVal;
        if (customContainer) customContainer.classList.add("hidden");
        if (charCounter) charCounter.classList.add("hidden");
        if (customInput) customInput.value = "";
      } else {
        if (select) select.value = "__CUSTOM__";
        if (customContainer) customContainer.classList.remove("hidden");
        if (charCounter) {
          charCounter.classList.remove("hidden");
          charCounter.textContent = `${(currentVal || "").length}/50`;
        }
        if (customInput) customInput.value = (currentVal || "").substring(0, 50);
        updateLiveMathBadge(currentVal, 'liveMathCfgPrefix');
      }
    }

    // =========================================================================
    // DYNAMIC MULTI-STAGE FORM BUILDER & INTELLIGENT WORKFLOW ENGINE
    // =========================================================================
    let adminFormSchema = null;

    function getBlankFormSchema() {
      return {
        version: 1,
        updatedAt: new Date().toISOString(),
        tahapan: [
          {
            id: "stage_1",
            title: "Bagian 1",
            description: "",
            fields: []
          }
        ]
      };
    }

    function getDefaultFormSchema(config) {
      config = config || adminAppConfig || {};
      return {
        tahapan: [
          {
            id: "tahap_1",
            title: "Identitas & Akses Penilai",
            description: "Isi identitas diri Anda sebelum menilai.",
            fields: [
              {
                id: "fld_core_identity",
                type: "CORE_IDENTITY",
                label: "Identitas Penilai (Peran, NIM, Nama Lengkap, Email Kampus)",
                description: "Data identitas penilai (peran, NIM, nama, dan email resmi).",
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
            description: "Pilih kelompok yang sedang presentasi.",
            fields: [
              {
                id: "fld_core_group",
                type: "CORE_GROUP_SELECT",
                label: "Pemilihan Kelompok Presentator Tampil",
                description: "Pilihan kelompok presentator yang tampil pada sesi aktif.",
                required: true,
                scope: "GLOBAL",
                config: {}
              }
            ]
          },
          {
            id: "tahap_3",
            title: "Skor Rubrik & Voting Presentator",
            description: "Berikan nilai presentasi dan pilih pemateri terbaik.",
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
                description: "Voting pemilihan pemateri terbaik per kelompok.",
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
            description: "Tuliskan masukan apresiasi dan catatan untuk pemateri.",
            fields: [
              {
                id: "fld_core_feedback",
                type: "CORE_MEMBER_FEEDBACK",
                label: "Evaluasi Masukan Kualitatif Tiap Pemateri",
                description: "Ulasan kualitatif untuk setiap anggota pemateri kelompok.",
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

    function initOrNormalizeFormSchema() {
      if (!adminFormSchema || !adminFormSchema.tahapan || !Array.isArray(adminFormSchema.tahapan)) {
        if (currentFormId === DEFAULT_PRIMARY_FORM_ID) {
          adminFormSchema = getDefaultFormSchema(adminAppConfig);
        } else {
          adminFormSchema = getBlankFormSchema();
        }
      }
    }

    function renderCustomQuestionsList() {
      initOrNormalizeFormSchema();
      renderDynamicStagesCanvas();
    }

    // =========================================================================
    // 1-CLICK INSTANT DIRECT CREATION (ZERO MODAL - GOOGLE FORMS STYLE)
    // =========================================================================

    // =========================================================================
    // UNDO / REDO ENGINE & VERSION HISTORY (GOOGLE FORMS EXPERIENCE)
    // =========================================================================
    let undoHistoryStack = [];
    let redoHistoryStack = [];
    const MAX_HISTORY_LIMIT = 30;

    function pushUndoSnapshot(actionName = "Perubahan Formulir") {
      if (!adminFormSchema) return;
      const snapshot = {
        action: actionName,
        timestamp: Date.now(),
        schema: JSON.parse(JSON.stringify(adminFormSchema)),
        config: JSON.parse(JSON.stringify(adminAppConfig || {}))
      };
      undoHistoryStack.push(snapshot);
      if (undoHistoryStack.length > MAX_HISTORY_LIMIT) {
        undoHistoryStack.shift();
      }
      redoHistoryStack = [];
      updateUndoRedoButtonsState();
    }

    function formBuilderUndo() {
      if (undoHistoryStack.length === 0) {
        showAdminToast("Tidak ada perubahan untuk diurungkan (Undo).", "info");
        return;
      }

      const currentSnapshot = {
        action: "Sebelum Urungkan",
        timestamp: Date.now(),
        schema: JSON.parse(JSON.stringify(adminFormSchema)),
        config: JSON.parse(JSON.stringify(adminAppConfig || {}))
      };
      redoHistoryStack.push(currentSnapshot);

      const prevSnapshot = undoHistoryStack.pop();
      adminFormSchema = JSON.parse(JSON.stringify(prevSnapshot.schema));
      if (prevSnapshot.config) {
        adminAppConfig = JSON.parse(JSON.stringify(prevSnapshot.config));
      }

      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      updateUndoRedoButtonsState();
      showAdminToast("Perubahan berhasil diurungkan (Undo).", "info");
    }

    function formBuilderRedo() {
      if (redoHistoryStack.length === 0) {
        showAdminToast("Tidak ada perubahan untuk diulangi (Redo).", "info");
        return;
      }

      const currentSnapshot = {
        action: "Sebelum Ulangi",
        timestamp: Date.now(),
        schema: JSON.parse(JSON.stringify(adminFormSchema)),
        config: JSON.parse(JSON.stringify(adminAppConfig || {}))
      };
      undoHistoryStack.push(currentSnapshot);

      const nextSnapshot = redoHistoryStack.pop();
      adminFormSchema = JSON.parse(JSON.stringify(nextSnapshot.schema));
      if (nextSnapshot.config) {
        adminAppConfig = JSON.parse(JSON.stringify(nextSnapshot.config));
      }

      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      updateUndoRedoButtonsState();
      showAdminToast("Perubahan berhasil diulangi (Redo).", "info");
    }

    function updateUndoRedoButtonsState() {
      const undoBtn = document.getElementById("btnHeaderBuilderUndo");
      const redoBtn = document.getElementById("btnHeaderBuilderRedo");
      const isUndoDisabled = undoHistoryStack.length === 0;
      const isRedoDisabled = redoHistoryStack.length === 0;

      if (undoBtn) undoBtn.disabled = isUndoDisabled;
      if (redoBtn) redoBtn.disabled = isRedoDisabled;
    }

    // Global Shortcut Listener for Ctrl+Z and Ctrl+Y / Ctrl+Shift+Z
    document.addEventListener("keydown", function(e) {
      const isConfigTabActive = !document.getElementById("adminTab_config")?.classList.contains("hidden");
      if (!isConfigTabActive) return;

      const activeTag = document.activeElement?.tagName;
      const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isTyping || document.activeElement.type === 'checkbox' || document.activeElement.type === 'radio') {
          e.preventDefault();
          formBuilderUndo();
        }
      }

      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        if (!isTyping || document.activeElement.type === 'checkbox' || document.activeElement.type === 'radio') {
          e.preventDefault();
          formBuilderRedo();
        }
      }

      // Rich Text Formatting Shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'u')) {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          const fieldId = activeEl.getAttribute('data-field-id');
          if (fieldId && adminFormSchema && adminFormSchema.tahapan) {
            let sIdx = -1, fIdx = -1;
            adminFormSchema.tahapan.forEach((stg, si) => {
              (stg.fields || []).forEach((fld, fi) => {
                if (fld.id === fieldId) { sIdx = si; fIdx = fi; }
              });
            });
            if (sIdx !== -1 && fIdx !== -1) {
              e.preventDefault();
              const type = e.key.toLowerCase() === 'b' ? 'bold' : (e.key.toLowerCase() === 'i' ? 'italic' : 'underline');
              applyFieldTextFormat(sIdx, fIdx, type);
            }
          }
        }
      }
    });

    // =========================================================================
    // REVISION HISTORY SNAPSHOTS ENGINE
    // =========================================================================
    function recordRevisionSnapshot(label = "Publikasi Formulir") {
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const revKey = `PGSD_FORM_REVISIONS_${formKey}`;
      let revs = [];
      try {
        revs = JSON.parse(localStorage.getItem(revKey) || "[]");
      } catch(e) { revs = []; }

      const newRev = {
        id: "rev_" + Date.now().toString(36),
        label: label,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' }),
        stagesCount: (adminFormSchema?.tahapan || []).length,
        fieldsCount: (adminFormSchema?.tahapan || []).reduce((acc, s) => acc + (s.fields?.length || 0), 0),
        schema: JSON.parse(JSON.stringify(adminFormSchema)),
        config: JSON.parse(JSON.stringify(adminAppConfig || {}))
      };

      revs.unshift(newRev);
      if (revs.length > 30) revs = revs.slice(0, 30);
      localStorage.setItem(revKey, JSON.stringify(revs));
    }

    function openRevisionHistoryModal() {
      renderRevisionHistoryList();
      document.getElementById("modalRevisionHistory").classList.remove("hidden");
    }

    function closeRevisionHistoryModal() {
      document.getElementById("modalRevisionHistory").classList.add("hidden");
    }

    function renderRevisionHistoryList() {
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const revKey = `PGSD_FORM_REVISIONS_${formKey}`;
      let revs = [];
      try {
        revs = JSON.parse(localStorage.getItem(revKey) || "[]");
      } catch(e) { revs = []; }

      const listContainer = document.getElementById("revisionListContainer");
      if (!listContainer) return;

      if (revs.length === 0) {
        listContainer.innerHTML = `
          <div class="p-8 text-center bg-white rounded-2xl border border-zinc-200 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h5 class="font-bold text-zinc-700 text-xs">Belum Ada Riwayat Tersimpan</h5>
            <p class="text-[11px] text-zinc-400">Riwayat revisi akan otomatis tercatat setiap kali Anda mempublikasikan formulir atau mereset susunan.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = revs.map((r, idx) => `
        <div class="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-indigo-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10.5px] font-mono font-bold">
                ${idx === 0 ? 'Terkini' : '#' + (revs.length - idx)}
              </span>
              <span class="font-bold text-zinc-900 text-xs">${r.label || 'Revisi Formulir'}</span>
            </div>
            <p class="text-[11px] text-zinc-500">
               ${r.dateStr} • <span class="font-mono">${r.stagesCount} Bagian, ${r.fieldsCount} Pertanyaan</span>
            </p>
          </div>

          <button 
            type="button" 
            onclick="restoreRevisionVersion('${r.id}')"
            class="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-indigo-600 hover:text-white text-zinc-700 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0"
            title="Kembalikan formulir ke versi ini"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span>Pulihkan Versi Ini</span>
          </button>
        </div>
      `).join("");
    }

    function restoreRevisionVersion(revId) {
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const revKey = `PGSD_FORM_REVISIONS_${formKey}`;
      let revs = [];
      try {
        revs = JSON.parse(localStorage.getItem(revKey) || "[]");
      } catch(e) { revs = []; }

      const targetRev = revs.find(r => r.id === revId);
      if (!targetRev || !targetRev.schema) {
        showAdminToast("Gagal memuat versi revisi.", "error");
        return;
      }

      pushUndoSnapshot("Sebelum Pulihkan Versi " + targetRev.dateStr);
      adminFormSchema = JSON.parse(JSON.stringify(targetRev.schema));
      if (targetRev.config) {
        adminAppConfig = JSON.parse(JSON.stringify(targetRev.config));
      }

      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      closeRevisionHistoryModal();
      showAdminToast(`Formulir berhasil dipulihkan ke versi (${targetRev.dateStr})!`, "success");
    }

    // =========================================================================
    // GOOGLE FORMS CONTEXT-AWARE FLOATING DOCK ENGINE
    // =========================================================================
    let activeFocusedContext = {
      type: 'header', // 'question' | 'stage' | 'header'
      sIdx: 0,
      fIdx: null,
      el: null
    };

    function setActiveFormCard(type, sIdx = 0, fIdx = null, element = null) {
      activeFocusedContext = {
        type: type || 'question',
        sIdx: (sIdx !== null && sIdx !== undefined) ? parseInt(sIdx, 10) : 0,
        fIdx: (fIdx !== null && fIdx !== undefined) ? parseInt(fIdx, 10) : null,
        el: element || (fIdx !== null ? document.getElementById(`questionCard_${sIdx}_${fIdx}`) : document.getElementById(`stageCard_${sIdx}`))
      };

      // Visual highlighting: Remove active class from previous, add to current
      document.querySelectorAll('.active-google-card').forEach(el => {
        el.classList.remove('active-google-card', 'ring-2', 'ring-indigo-500/25', 'shadow-md');
      });

      if (activeFocusedContext.el) {
        activeFocusedContext.el.classList.add('active-google-card', 'ring-2', 'ring-indigo-500/25', 'shadow-md');
      }

      updateFloatingDockPosition();
    }

    function updateFloatingDockPosition() {
      const dock = document.getElementById("googleFormsFloatingDock");
      if (!dock) return;

      // Only show when inside questions builder tab
      const qTab = document.getElementById("adminView_questions");
      if (!qTab || qTab.classList.contains("hidden")) {
        dock.style.display = "none";
        return;
      }
      dock.style.display = "flex";

      // Mobile Mode (< 640px): Stay docked at bottom center
      if (window.innerWidth < 640) {
        dock.style.position = "fixed";
        dock.style.left = "50%";
        dock.style.top = "auto";
        dock.style.bottom = "14px";
        dock.style.transform = "translateX(-50%)";
        dock.style.zIndex = "45";
        return;
      }

      // Desktop Mode: Follow currently active card or default container
      let targetEl = activeFocusedContext.el;
      if (!targetEl || !document.body.contains(targetEl)) {
        targetEl = document.querySelector('[id^="questionCard_"]') || document.getElementById('headerFormCard') || document.querySelector('[id^="stageCard_"]');
        if (targetEl) activeFocusedContext.el = targetEl;
      }

      if (!targetEl) return;

      const rect = targetEl.getBoundingClientRect();
      const dockWidth = dock.offsetWidth || 48;
      const dockHeight = dock.offsetHeight || 180;

      // Position to the right side of the active card
      const targetRight = rect.right + 14;
      const maxLeft = window.innerWidth - dockWidth - 16;
      const finalLeft = Math.min(targetRight, maxLeft);

      // Top aligned with active card, clamped to visible viewport
      const minTop = 80;
      const maxTop = window.innerHeight - dockHeight - 20;
      const idealTop = rect.top + 6;
      const clampedTop = Math.max(minTop, Math.min(idealTop, maxTop));

      dock.style.position = "fixed";
      dock.style.left = `${finalLeft}px`;
      dock.style.top = `${clampedTop}px`;
      dock.style.bottom = "auto";
      dock.style.transform = "none";
      dock.style.zIndex = "45";
    }

    // Scroll & Resize Listeners for Smooth Glide Tracking
    window.addEventListener('scroll', () => {
      if (window.innerWidth >= 640) updateFloatingDockPosition();
    }, { passive: true });

    window.addEventListener('resize', () => {
      updateFloatingDockPosition();
    });

    // FLOATING DOCK CONTEXTUAL ACTIONS
    function handleFloatingDockAddQuestion() {
      if (activeFocusedContext.type === 'question' && activeFocusedContext.fIdx !== null) {
        insertQuestionDirectBelow(activeFocusedContext.sIdx, activeFocusedContext.fIdx);
      } else if (activeFocusedContext.type === 'stage' && activeFocusedContext.sIdx !== null) {
        addNewQuestionDirect(activeFocusedContext.sIdx);
      } else {
        const lastStageIdx = adminFormSchema && adminFormSchema.tahapan ? adminFormSchema.tahapan.length - 1 : 0;
        addNewQuestionDirect(lastStageIdx >= 0 ? lastStageIdx : 0);
      }
    }

    function handleFloatingDockAddText() {
      if (activeFocusedContext.type === 'question' && activeFocusedContext.fIdx !== null) {
        insertQuestionDirectBelow(activeFocusedContext.sIdx, activeFocusedContext.fIdx, 'DESCRIPTION', 'Judul & Deskripsi Tambahan');
      } else {
        const titleEl = document.getElementById('cfg_Judul_Form');
        if (titleEl) {
          titleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          titleEl.focus();
        }
      }
    }

    function handleFloatingDockAddMedia() {
      if (activeFocusedContext.type === 'question' && activeFocusedContext.fIdx !== null) {
        openAttachMediaModal(activeFocusedContext.sIdx, activeFocusedContext.fIdx);
      } else {
        openAttachMediaModal(activeFocusedContext.sIdx || 0, 0);
      }
    }

    function handleFloatingDockAddStage() {
      if (activeFocusedContext.sIdx !== null && activeFocusedContext.sIdx !== undefined) {
        insertStageDirectAfter(activeFocusedContext.sIdx);
      } else {
        addNewStageDirect();
      }
    }

    function insertQuestionDirectBelow(sIdx, fIdx, type = "RADIO", label = "Pertanyaan tanpa judul") {
      pushUndoSnapshot('Tambah Pertanyaan');
      initOrNormalizeFormSchema();
      if (sIdx === undefined || sIdx === null || sIdx < 0) sIdx = 0;
      if (!adminFormSchema.tahapan[sIdx]) sIdx = 0;
      if (!adminFormSchema.tahapan[sIdx].fields) adminFormSchema.tahapan[sIdx].fields = [];

      const newFieldId = "fld_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const newField = {
        id: newFieldId,
        type: type,
        label: label,
        description: "",
        required: false,
        scope: "GLOBAL",
        options: type === 'DESCRIPTION' ? [] : ["Opsi 1"]
      };

      const targetIdx = (fIdx !== null && fIdx !== undefined && fIdx >= 0) ? fIdx + 1 : adminFormSchema.tahapan[sIdx].fields.length;
      adminFormSchema.tahapan[sIdx].fields.splice(targetIdx, 0, newField);
      
      renderDynamicStagesCanvas();
      markSchemaAsDirty();

      setTimeout(() => {
        const inputEl = document.querySelector(`textarea[data-field-id="${newFieldId}"]`) || document.querySelector(`input[data-field-id="${newFieldId}"]`);
        const cardEl = document.getElementById(`questionCard_${sIdx}_${targetIdx}`);
        if (cardEl) {
          setActiveFormCard('question', sIdx, targetIdx, cardEl);
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (inputEl) {
          inputEl.focus();
          if (typeof inputEl.select === 'function') inputEl.select();
        }
      }, 120);

      showAdminToast("Pertanyaan baru disisipkan tepat di bawah elemen aktif!", "success");
    }

    function insertStageDirectAfter(sIdx) {
      pushUndoSnapshot('Tambah Bagian Baru');
      initOrNormalizeFormSchema();
      const insertAt = (sIdx !== null && sIdx !== undefined && sIdx >= 0) ? sIdx + 1 : adminFormSchema.tahapan.length;
      const newStageId = "tahap_" + (insertAt + 1) + "_" + Date.now().toString(36);
      const newFieldId = "fld_" + Date.now().toString(36);

      const newStage = {
        id: newStageId,
        nama: `Bagian ${insertAt + 1} Tanpa Judul`,
        petunjuk: "Ketik petunjuk khusus untuk bagian evaluasi ini...",
        fields: [
          {
            id: newFieldId,
            type: "RADIO",
            label: "Pertanyaan tanpa judul",
            description: "",
            required: false,
            scope: "GLOBAL",
            options: ["Opsi 1"]
          }
        ]
      };

      adminFormSchema.tahapan.splice(insertAt, 0, newStage);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();

      setTimeout(() => {
        const stageEl = document.getElementById(`stageCard_${insertAt}`);
        if (stageEl) {
          setActiveFormCard('stage', insertAt, null, stageEl);
          stageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 120);

      showAdminToast(`Bagian baru (Bagian ${insertAt + 1}) berhasil ditambahkan!`, "success");
    }

    function addNewQuestionDirect(sIdx = 0) {
      insertQuestionDirectBelow(sIdx, null);
    }

    function addNewStageDirect() {
      const lastIdx = adminFormSchema && adminFormSchema.tahapan ? adminFormSchema.tahapan.length - 1 : 0;
      insertStageDirectAfter(lastIdx);
    }

    let inlineSaveTimeout = null;
    let isFormSchemaDirty = false;
    let currentSimulatorStage = 0;

    function markSchemaAsDirty() {
      isFormSchemaDirty = true;
      updatePublishStatusBadge();
      saveDraftSchemaLocally();
    }

    function updatePublishStatusBadge() {
      const badgeHeader = document.getElementById("headerBuilderPublishStatusBadge");
      const badgeBody = document.getElementById("builderPublishStatusBadgeBody");
      const btnHeader = document.getElementById("btnHeaderPublishSchema");

      if (isFormSchemaDirty) {
        if (badgeHeader) {
          badgeHeader.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 animate-pulse shadow-2xs whitespace-nowrap shrink-0";
          badgeHeader.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Draf</span>`;
        }
        if (badgeBody) {
          badgeBody.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-400 animate-pulse shadow-2xs shrink-0";
          badgeBody.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-600"></span><span>Draf Belum Terbit</span>`;
        }
        if (btnHeader) btnHeader.classList.add("ring-2", "ring-emerald-400", "ring-offset-1");
      } else {
        if (badgeHeader) {
          badgeHeader.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 shadow-2xs whitespace-nowrap shrink-0";
          badgeHeader.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>Aktif</span>`;
        }
        if (badgeBody) {
          badgeBody.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-400 shadow-2xs shrink-0";
          badgeBody.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-600"></span><span>Form Terpublikasi & Aktif</span>`;
        }
        if (btnHeader) btnHeader.classList.remove("ring-2", "ring-emerald-400", "ring-offset-1");
      }
    }

    function initContextualHeaderMorphing() {
      // Kept for backward compatibility; header is now permanently unified Google Forms style
    }

    function jumpToConfigTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function saveDraftSchemaLocally() {
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      try {
        localStorage.setItem(`PGSD_DRAFT_SCHEMA_${formKey}`, JSON.stringify(adminFormSchema));
        localStorage.setItem(`PGSD_DRAFT_CONFIG_${formKey}`, JSON.stringify(adminAppConfig));
      } catch (e) {
        console.warn("Could not save draft locally:", e);
      }
    }

    function triggerDebouncedAutoSave() {
      markSchemaAsDirty();
    }

    function triggerAutoSaveSchema() {
      markSchemaAsDirty();
    }

    async function publishFormSchema() {
      initOrNormalizeFormSchema();
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      setSyncState('saving');

      // ⚡ FAST-PATH (< 30ms): Simpan langsung ke Supabase PostgreSQL
      const sb = await ensureSupabaseClient();
      let sbSuccess = false;

      if (sb) {
        try {
          const { error: confErr } = await sb.from('pgsd_form_configs').upsert({
            form_id: formKey,
            config_data: adminAppConfig,
            schema_data: adminFormSchema,
            updated_at: new Date().toISOString()
          });

          // Juga perbarui metadata di pgsd_forms
          await sb.from('pgsd_forms').update({
            judul_form: adminAppConfig["Judul_Form"] || (currentFormMeta && currentFormMeta.judulForm) || "Penilaian Presentasi",
            mata_kuliah: adminAppConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "-",
            dosen: adminAppConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-",
            kelas: adminAppConfig["Kelas"] || (currentFormMeta && currentFormMeta.kelas) || "5E",
            jurusan: adminAppConfig["Jurusan"] || (currentFormMeta && currentFormMeta.jurusan) || "PGSD",
            sesi_aktif: adminAppConfig["Sesi_Minggu_Aktif"] || (currentFormMeta && currentFormMeta.sesiAktif) || "Minggu 1",
            updated_at: new Date().toISOString()
          }).eq('form_id', formKey);

          if (!confErr) {
            sbSuccess = true;
          }
        } catch (err) {
          console.warn("Supabase publish notice:", err);
        }
      }

      isFormSchemaDirty = false;
      updatePublishStatusBadge();
      setSyncState('synced');
      localStorage.setItem(`PGSD_CACHE_FORM_SCHEMA_${formKey}`, JSON.stringify(adminFormSchema));
      recordRevisionSnapshot("Publikasi Form: " + (adminFormSchema.tahapan.length) + " Bagian");
      localStorage.setItem(`PGSD_CACHE_CONFIG_${formKey}`, JSON.stringify(adminAppConfig));
      localStorage.removeItem(`PGSD_DRAFT_SCHEMA_${formKey}`);
      
      showAdminToast("Formulir BERHASIL Dipublikasikan! Versi terbaru aktif seketika.", "success");

      // 🔄 Asynchronous Background Sync to Google Sheets
      const customUrl = (adminAppConfig && adminAppConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL") || getApiUrl();
      if (customUrl) {
        fetch(customUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "adminSaveConfig",
            formId: formKey,
            config: adminAppConfig,
            customFields: adminFormSchema,
            formSchema: adminFormSchema
          })
        }).catch(e => console.warn("Background sheet sync publish notice:", e));
      }
    }

    function handleInlineStageUpdate(sIdx, prop, val) {
      if (!adminFormSchema || !adminFormSchema.tahapan[sIdx]) return;
      const stage = adminFormSchema.tahapan[sIdx];
      stage[prop] = val;
      markSchemaAsDirty();

      if (prop === 'title') {
        updateLiveMathBadge(val, `liveMathStageTitle_${sIdx}`);
        // If alurTitle was NOT explicitly customized by user, sync the alur title in real-time
        if (!stage.isCustom_alurTitle) {
          const alurTitleInput = document.getElementById(`alurTitleInput_${sIdx}`);
          if (alurTitleInput && document.activeElement !== alurTitleInput) {
            alurTitleInput.value = val || `Bagian ${sIdx + 1}`;
          }
          updateLiveMathBadge(val || `Bagian ${sIdx + 1}`, `liveMathAlurTitle_${sIdx}`);
        }
      } else if (prop === 'description') {
        updateLiveMathBadge(val, `liveMathStageDesc_${sIdx}`);
        // If alurDesc was NOT explicitly customized by user, sync the alur desc in real-time
        if (!stage.isCustom_alurDesc) {
          const alurDescInput = document.getElementById(`alurDescInput_${sIdx}`);
          if (alurDescInput && document.activeElement !== alurDescInput) {
            alurDescInput.value = val || "";
          }
          updateLiveMathBadge(val || "", `liveMathAlurDesc_${sIdx}`);
        }
      }
    }

    function handleInlineFieldUpdate(sIdx, fIdx, prop, val) {
      if (!adminFormSchema || !adminFormSchema.tahapan[sIdx]?.fields[fIdx]) return;
      adminFormSchema.tahapan[sIdx].fields[fIdx][prop] = val;
      markSchemaAsDirty();

      if (prop === 'label') updateLiveMathBadge(val, `liveMathQuestionLabel_${sIdx}_${fIdx}`);
      else if (prop === 'description') updateLiveMathBadge(val, `liveMathQuestionDesc_${sIdx}_${fIdx}`);
    }

    function handleInlineConfigUpdate(key, val) {
      adminAppConfig[key] = val;
      markSchemaAsDirty();
    }


    // =========================================================================
    // MODERN-MINIMALIST QUESTION TYPE POPOVER MENU ENGINE (ZERO EMOJI, PURE SVG)
    // =========================================================================
    const QUESTION_TYPES_DEF = [
      {
        category: "Tipe Pertanyaan & Teks",
        items: [
          { type: "RADIO", label: "Pilihan Ganda", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="2"></circle><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>` },
          { type: "CHECKBOX", label: "Kotak Centang", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` },
          { type: "DROPDOWN", label: "Dropdown Pilihan", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>` },
          { type: "SHORT_TEXT", label: "Jawaban Singkat", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h6"></path></svg>` },
          { type: "TEXTAREA", label: "Paragraf / Ulasan", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h10"></path></svg>` },
          { type: "RATING_SCALE", label: "Skala Linier", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>` },
          { type: "STAR_RATING", label: "Rating Bintang ⭐", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>` },
          { type: "MATRIX_GRID", label: "Matriks Rubrik Kisi", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16M10 6v12M16 6v12"></path></svg>` },
          { type: "RANKING", label: "Peringkat Prioritas", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>` },
          { type: "SIGNATURE", label: "Tanda Tangan Digital", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>` },
          { type: "URL_LINK", label: "Input Tautan / Link", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>` },
          { type: "DATE", label: "Tanggal", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>` },
          { type: "TIME", label: "Waktu / Jam", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` },
          { type: "FILE_UPLOAD", label: "Upload Berkas", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>` },
          { type: "TITLE_DESC", label: "Judul & Deskripsi Teks", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>` },
        ]
      },
      {
        category: "Komponen Khusus Penilaian",
        items: [
          { type: "CORE_IDENTITY", label: "Identitas & Peran Penilai", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>` },
          { type: "CORE_GROUP_SELECT", label: "Pemilihan Kelompok", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>` },
          { type: "CORE_SCORE_RUBRIC", label: "Nilai Presentasi (Skor)", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>` },
          { type: "CORE_BEST_PRESENTER", label: "Voting Presentator Terbaik", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>` },
          { type: "CORE_MEMBER_FEEDBACK", label: "Evaluasi Masukan Tiap Pemateri", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>` },
          { type: "INFO_BANNER", label: "Teks Informasi & Panduan", icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` },
        ]
      }
    ];

    function getQTypeDef(type) {
      for (const cat of QUESTION_TYPES_DEF) {
        const found = cat.items.find(it => it.type === type);
        if (found) return found;
      }
      return { type: type, label: type, icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` };
    }

    function getModernQuestionTypePopoverHtml(f, sIdx, fIdx) {
      const activeDef = getQTypeDef(f.type);
      const isCore = String(f.type || "").startsWith("CORE_");

      let menuItemsHtml = "";
      QUESTION_TYPES_DEF.forEach((cat, cIdx) => {
        const catItemsHtml = cat.items.map(it => {
          const isActive = it.type === f.type;
          return `
            <button 
              type="button" 
              onclick="selectQuestionTypeFromPopover(${sIdx}, ${fIdx}, '${it.type}')" 
              class="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 text-xs transition cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-zinc-100 text-zinc-700 font-medium'}"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'} flex items-center justify-center shrink-0 shadow-2xs">
                  ${it.icon}
                </span>
                <span>${it.label}</span>
              </div>
              ${isActive ? `<svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>` : ''}
            </button>
          `;
        }).join("");

        menuItemsHtml += `
          <div class="${cIdx > 0 ? 'border-t border-zinc-100 pt-2 mt-2' : ''}">
            <div class="px-3 py-1 text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider font-mono">${cat.category}</div>
            <div class="space-y-0.5 mt-1">${catItemsHtml}</div>
          </div>
        `;
      });

      return `
        <div class="relative inline-block text-left w-full sm:w-auto" id="qTypeDropdownContainer_${sIdx}_${fIdx}">
          <button 
            type="button" 
            onclick="toggleQTypeDropdown(${sIdx}, ${fIdx}, event)" 
            class="w-full sm:w-auto px-3.5 py-2 rounded-xl border ${isCore ? 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950' : 'border-zinc-200 hover:border-indigo-400 bg-white hover:bg-zinc-50 text-zinc-800'} text-xs font-semibold flex items-center justify-between gap-3 transition shadow-2xs cursor-pointer active:scale-98"
            title="Ubah tipe pertanyaan"
          >
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-lg ${isCore ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'} flex items-center justify-center shrink-0">
                ${activeDef.icon}
              </span>
              <span class="font-bold text-zinc-900">${activeDef.label}</span>
            </div>
            <svg class="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          <!-- Floating Popover Menu (Scrollable & Non-Clipping) -->
          <div 
            id="qTypeMenu_${sIdx}_${fIdx}" 
            class="hidden absolute right-0 top-full mt-1.5 w-72 max-w-[92vw] max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar rounded-2xl bg-white border border-zinc-200 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
            onclick="event.stopPropagation()"
          >
            ${menuItemsHtml}
          </div>
        </div>
      `;
    }

    function toggleQTypeDropdown(sIdx, fIdx, e) {
      if (e) e.stopPropagation();
      const menuId = `qTypeMenu_${sIdx}_${fIdx}`;
      const menu = document.getElementById(menuId);
      const container = document.getElementById(`qTypeDropdownContainer_${sIdx}_${fIdx}`);
      if (!menu || !container) return;

      const isHidden = menu.classList.contains("hidden");
      
      // Close all open menus first
      document.querySelectorAll("[id^='qTypeMenu_']").forEach(el => el.classList.add("hidden"));

      if (isHidden) {
        // Smart Upward vs Downward positioning based on viewport space
        const rect = container.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < 310 && spaceAbove > 310) {
          menu.classList.remove("top-full", "mt-1.5");
          menu.classList.add("bottom-full", "mb-1.5");
        } else {
          menu.classList.remove("bottom-full", "mb-1.5");
          menu.classList.add("top-full", "mt-1.5");
        }

        menu.classList.remove("hidden");
      }
    }

    function selectQuestionTypeFromPopover(sIdx, fIdx, newType) {
      handleQuestionTypeSwitch(sIdx, fIdx, newType);
      // Close menus
      document.querySelectorAll("[id^='qTypeMenu_']").forEach(el => el.classList.add("hidden"));
    }

    function toggleFieldMoreMenu(sIdx, fIdx, e) {
      if (e) e.stopPropagation();
      const menuId = `fieldMoreMenu_${sIdx}_${fIdx}`;
      const menu = document.getElementById(menuId);
      const container = document.getElementById(`fieldMoreMenuContainer_${sIdx}_${fIdx}`);
      if (!menu || !container) return;

      const isHidden = menu.classList.contains("hidden");
      
      // Close all open menus first
      closeAllFieldMoreMenus();
      document.querySelectorAll("[id^='qTypeMenu_']").forEach(el => el.classList.add("hidden"));

      if (isHidden) {
        const rect = container.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceAbove < 120 && spaceBelow > 120) {
          menu.classList.remove("bottom-full", "mb-1.5");
          menu.classList.add("top-full", "mt-1.5");
        } else {
          menu.classList.remove("top-full", "mt-1.5");
          menu.classList.add("bottom-full", "mb-1.5");
        }

        menu.classList.remove("hidden");
      }
    }

    function closeAllFieldMoreMenus() {
      document.querySelectorAll("[id^='fieldMoreMenu_']").forEach(el => el.classList.add("hidden"));
    }

    // Global listener to close popovers on click outside
    document.addEventListener("click", () => {
      document.querySelectorAll("[id^='qTypeMenu_']").forEach(el => el.classList.add("hidden"));
      closeAllFieldMoreMenus();
    });

    function handleQuestionTypeSwitch(sIdx, fIdx, newType) {
      pushUndoSnapshot('Ganti Tipe Pertanyaan');
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      f.type = newType;
      if ((newType === 'RADIO' || newType === 'CHECKBOX' || newType === 'DROPDOWN') && (!f.options || f.options.length === 0)) {
        f.options = ['Opsi 1', 'Opsi 2'];
      }
      if (newType === 'RATING_SCALE') {
        const minV = f.minVal !== undefined ? f.minVal : 1;
        const maxV = f.maxVal !== undefined ? f.maxVal : 5;
        f.minVal = minV;
        f.maxVal = maxV;
        f.pointLabels = getDefaultScalePointLabels(minV, maxV);
        f.labelMin = f.pointLabels[String(minV)] || "Sangat Kurang";
        f.labelMax = f.pointLabels[String(maxV)] || "Sangat Baik";
      }
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      showAdminToast(`Tipe pertanyaan diubah menjadi '${newType}'.`, "info");
    }

    function getDefaultScalePointLabels(minVal, maxVal) {
      const count = maxVal - minVal + 1;
      const labels = {};

      const presets = {
        2: ["Kurang", "Baik"],
        3: ["Kurang", "Cukup", "Baik"],
        4: ["Sangat Kurang", "Kurang", "Baik", "Sangat Baik"],
        5: ["Sangat Kurang", "Kurang", "Cukup", "Baik", "Sangat Baik"],
        6: ["Sangat Kurang", "Kurang", "Agak Kurang", "Cukup Baik", "Baik", "Sangat Baik"],
        7: ["Sangat Kurang", "Kurang", "Agak Kurang", "Netral / Cukup", "Agak Baik", "Baik", "Sangat Baik"],
        8: ["Sangat Rendah", "Rendah", "Kurang", "Hampir Cukup", "Cukup", "Cukup Baik", "Baik", "Sangat Baik"],
        9: ["Sangat Rendah", "Rendah", "Sangat Kurang", "Kurang", "Cukup / Sedang", "Cukup Baik", "Baik", "Sangat Baik", "Luar Biasa"],
        10: ["Sangat Kurang", "Kurang Sekali", "Kurang", "Agak Kurang", "Hampir Cukup", "Cukup", "Cukup Baik", "Baik", "Sangat Baik", "Sempurna / Istimewa"],
        11: ["Nol / Kosong", "Sangat Kurang", "Kurang Sekali", "Kurang", "Agak Kurang", "Hampir Cukup", "Cukup", "Cukup Baik", "Baik", "Sangat Baik", "Sempurna / Istimewa"]
      };

      const presetList = presets[count] || [];
      let idx = 0;
      for (let i = minVal; i <= maxVal; i++) {
        if (idx < presetList.length) {
          labels[String(i)] = presetList[idx];
        } else {
          labels[String(i)] = (i === minVal ? "Sangat Kurang" : (i === maxVal ? "Sangat Baik" : "Nilai " + i));
        }
        idx++;
      }

      return labels;
    }

    function handleScaleRangeChange(sIdx, fIdx, prop, val) {
      pushUndoSnapshot('Ubah Rentang Skala Linier');
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      
      f[prop] = val;
      const minV = f.minVal !== undefined ? f.minVal : 1;
      const maxV = f.maxVal !== undefined ? f.maxVal : 5;

      // Smart dynamic reassignment of point labels for the exact new scale length
      f.pointLabels = getDefaultScalePointLabels(minV, maxV);
      f.labelMin = f.pointLabels[String(minV)] || "Sangat Kurang";
      f.labelMax = f.pointLabels[String(maxV)] || "Sangat Baik";

      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      showAdminToast(`Rentang skala diubah menjadi ${minV} s.d. ${maxV} dengan label cerdas.`, "info");
    }

    function handleInlineScalePointLabelUpdate(sIdx, fIdx, pointKey, val) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      if (!f.pointLabels) f.pointLabels = {};
      f.pointLabels[String(pointKey)] = val;
      markSchemaAsDirty();
      updateLiveMathBadge(val, `liveMathScalePoint_${sIdx}_${fIdx}_${pointKey}`);
    }

    function handleInlineToggleOtherOption(sIdx, fIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      f.hasOtherOption = !f.hasOtherOption;
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      showAdminToast(f.hasOtherOption ? "Opsi 'Lainnya' diaktifkan pada pertanyaan ini." : "Opsi 'Lainnya' dinonaktifkan.", "info");
    }

    function handleInlineOptionUpdate(sIdx, fIdx, optIdx, val) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f || !f.options) return;
      f.options[optIdx] = val;
      markSchemaAsDirty();
      updateLiveMathBadge(val, `liveMathOpt_${sIdx}_${fIdx}_${optIdx}`);
    }

    function handleInlineAddOption(sIdx, fIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      if (!f.options) f.options = [];
      f.options.push(`Opsi ${f.options.length + 1}`);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
    }

    function handleInlineDeleteOption(sIdx, fIdx, optIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f || !f.options || f.options.length <= 1) return;
      f.options.splice(optIdx, 1);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
    }

    function handleInlineMatrixRowUpdate(sIdx, fIdx, rIdx, val) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f || !f.matrixRows) return;
      f.matrixRows[rIdx] = val;
      markSchemaAsDirty();
    }

    function handleInlineAddMatrixRow(sIdx, fIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      if (!f.matrixRows) f.matrixRows = [];
      f.matrixRows.push(`Kriteria ${f.matrixRows.length + 1}`);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
    }

    function handleInlineDeleteMatrixRow(sIdx, fIdx, rIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f || !f.matrixRows || f.matrixRows.length <= 1) return;
      f.matrixRows.splice(rIdx, 1);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
    }

    function handleInlineMatrixColUpdate(sIdx, fIdx, cIdx, val) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f || !f.matrixCols) return;
      f.matrixCols[cIdx] = val;
      markSchemaAsDirty();
    }

    function handleInlineAddMatrixCol(sIdx, fIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      if (!f.matrixCols) f.matrixCols = [];
      f.matrixCols.push(`${f.matrixCols.length + 1}: Pilihan`);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
    }

    function handleInlineDeleteMatrixCol(sIdx, fIdx, cIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f || !f.matrixCols || f.matrixCols.length <= 1) return;
      f.matrixCols.splice(cIdx, 1);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
    }

    function getGoogleFormsVisualBodyHtml(f, sIdx, fIdx) {
      // 0. TITLE_DESC / BLOK INFORMASI TEKS SAJA
      if (f.type === 'TITLE_DESC') {
        return `
          <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
            <div class="flex items-center gap-1.5 text-indigo-700 font-bold">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Blok Informasi / Panduan Bebas</span>
            </div>
            <p class="text-[11px] text-zinc-500">Teks judul dan deskripsi di atas akan tampil sebagai petunjuk bagi responden tanpa kolom isian jawaban.</p>
          </div>
        `;
      }

      const scoreMin = adminAppConfig["Nilai_Kelompok_Min"] || 50;
      const scoreMax = adminAppConfig["Nilai_Kelompok_Max"] || 100;
      const votingMax = adminAppConfig["Maksimal_Pilihan_Presentator_Terbaik"] || 2;
      const reviewMaxChars = adminAppConfig["Maksimal_Karakter_Evaluasi"] || 500;
      const emailDomain = adminAppConfig["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id";

      // 1. RADIO / PILIHAN GANDA
      if (f.type === 'RADIO') {
        const options = (f.options && f.options.length > 0) ? f.options : ['Opsi 1', 'Opsi 2'];
        const optsHtml = options.map((o, optIdx) => `
          <div class="space-y-1 group">
            <div class="flex items-center gap-2.5 text-xs">
              <span class="w-4 h-4 rounded-full border-2 border-zinc-400 shrink-0"></span>
              <textarea 
                rows="1" 
                placeholder="Teks opsi..."
                oninput="autoResizeTextarea(this); handleInlineOptionUpdate(${sIdx}, ${fIdx}, ${optIdx}, this.value)"
                class="flex-1 px-2.5 py-1.5 rounded-md border-b border-transparent hover:border-zinc-300 focus:border-indigo-600 text-xs text-zinc-800 bg-transparent focus:bg-white outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-snug"
              >${escapeHtml(o)}</textarea>
              <button 
                type="button" 
                onclick="handleInlineDeleteOption(${sIdx}, ${fIdx}, ${optIdx})" 
                ${options.length <= 1 ? 'disabled' : ''}
                class="w-6 h-6 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 disabled:opacity-20 flex items-center justify-center cursor-pointer transition" 
                title="Hapus Opsi"
              >✕</button>
            </div>
            ${getLiveMathBadgeHtml(o, `liveMathOpt_${sIdx}_${fIdx}_${optIdx}`)}
          </div>
        `).join('');

        return `
          <div class="space-y-2 pt-1">
            <div class="space-y-1.5">${optsHtml}</div>
            
            ${f.hasOtherOption ? `
              <div class="flex items-center gap-2.5 text-xs">
                <span class="w-4 h-4 rounded-full border-2 border-zinc-400 shrink-0"></span>
                <span class="text-zinc-600 font-medium">Lainnya:</span>
                <span class="text-zinc-400 italic flex-1 border-b border-dotted border-zinc-300 py-1">Teks jawaban bebas oleh responden</span>
                <button type="button" onclick="handleInlineToggleOtherOption(${sIdx}, ${fIdx})" class="w-6 h-6 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 flex items-center justify-center cursor-pointer" title="Hapus Opsi Lainnya">✕</button>
              </div>
            ` : ''}

            <div class="flex items-center gap-3 pt-1 text-xs">
              <button 
                type="button" 
                onclick="handleInlineAddOption(${sIdx}, ${fIdx})"
                class="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
              >
                <span>+ Tambahkan opsi</span>
              </button>
              ${!f.hasOtherOption ? `
                <span class="text-zinc-300">atau</span>
                <button 
                  type="button" 
                  onclick="handleInlineToggleOtherOption(${sIdx}, ${fIdx})"
                  class="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  tambahkan "Lainnya"
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }

      // 2. CHECKBOX / KOTAK CENTANG
      if (f.type === 'CHECKBOX') {
        const options = (f.options && f.options.length > 0) ? f.options : ['Pilihan 1', 'Pilihan 2'];
        const optsHtml = options.map((o, optIdx) => `
          <div class="space-y-1 group">
            <div class="flex items-center gap-2.5 text-xs">
              <span class="w-4 h-4 rounded border-2 border-zinc-400 shrink-0"></span>
              <textarea 
                rows="1" 
                placeholder="Teks opsi..."
                oninput="autoResizeTextarea(this); handleInlineOptionUpdate(${sIdx}, ${fIdx}, ${optIdx}, this.value)"
                class="flex-1 px-2.5 py-1.5 rounded-md border-b border-transparent hover:border-zinc-300 focus:border-indigo-600 text-xs text-zinc-800 bg-transparent focus:bg-white outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-snug"
              >${escapeHtml(o)}</textarea>
              <button 
                type="button" 
                onclick="handleInlineDeleteOption(${sIdx}, ${fIdx}, ${optIdx})" 
                ${options.length <= 1 ? 'disabled' : ''}
                class="w-6 h-6 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 disabled:opacity-20 flex items-center justify-center cursor-pointer transition" 
                title="Hapus Opsi"
              >✕</button>
            </div>
            ${getLiveMathBadgeHtml(o, `liveMathOpt_${sIdx}_${fIdx}_${optIdx}`)}
          </div>
        `).join('');

        return `
          <div class="space-y-2 pt-1">
            <div class="space-y-1.5">${optsHtml}</div>

            ${f.hasOtherOption ? `
              <div class="flex items-center gap-2.5 text-xs">
                <span class="w-4 h-4 rounded border-2 border-zinc-400 shrink-0"></span>
                <span class="text-zinc-600 font-medium">Lainnya:</span>
                <span class="text-zinc-400 italic flex-1 border-b border-dotted border-zinc-300 py-1">Teks jawaban bebas oleh responden</span>
                <button type="button" onclick="handleInlineToggleOtherOption(${sIdx}, ${fIdx})" class="w-6 h-6 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 flex items-center justify-center cursor-pointer" title="Hapus Opsi Lainnya">✕</button>
              </div>
            ` : ''}

            <div class="flex items-center gap-3 pt-1 text-xs">
              <button 
                type="button" 
                onclick="handleInlineAddOption(${sIdx}, ${fIdx})"
                class="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
              >
                <span>+ Tambahkan opsi centang</span>
              </button>
              ${!f.hasOtherOption ? `
                <span class="text-zinc-300">atau</span>
                <button 
                  type="button" 
                  onclick="handleInlineToggleOtherOption(${sIdx}, ${fIdx})"
                  class="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  tambahkan "Lainnya"
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }

      // 3. DROPDOWN
      if (f.type === 'DROPDOWN') {
        const options = (f.options && f.options.length > 0) ? f.options : ['Pilihan 1', 'Pilihan 2'];
        const optsHtml = options.map((o, optIdx) => `
          <div class="space-y-1 group">
            <div class="flex items-center gap-2.5 text-xs">
              <span class="w-4 font-mono text-zinc-400 font-bold text-xs shrink-0 text-center">${optIdx + 1}.</span>
              <textarea 
                rows="1" 
                placeholder="Teks opsi dropdown..."
                oninput="autoResizeTextarea(this); handleInlineOptionUpdate(${sIdx}, ${fIdx}, ${optIdx}, this.value)"
                class="flex-1 px-2.5 py-1.5 rounded-md border-b border-transparent hover:border-zinc-300 focus:border-indigo-600 text-xs text-zinc-800 bg-transparent focus:bg-white outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-snug"
              >${escapeHtml(o)}</textarea>
              <button 
                type="button" 
                onclick="handleInlineDeleteOption(${sIdx}, ${fIdx}, ${optIdx})" 
                ${options.length <= 1 ? 'disabled' : ''}
                class="w-6 h-6 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 disabled:opacity-20 flex items-center justify-center cursor-pointer transition" 
                title="Hapus Opsi"
              >✕</button>
            </div>
            ${getLiveMathBadgeHtml(o, `liveMathOpt_${sIdx}_${fIdx}_${optIdx}`)}
          </div>
        `).join('');

        return `
          <div class="space-y-2 pt-1">
            <div class="space-y-1.5">${optsHtml}</div>
            <div class="flex items-center gap-2 pt-1">
              <span class="w-4 font-mono text-zinc-300 font-bold text-xs shrink-0 text-center">•</span>
              <button 
                type="button" 
                onclick="handleInlineAddOption(${sIdx}, ${fIdx})"
                class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                + Tambahkan opsi pilihan
              </button>
            </div>
          </div>
        `;
      }

      // 4. SHORT TEXT
      if (f.type === 'SHORT_TEXT') {
        return `
          <div class="pt-2 pb-1 space-y-1.5">
            <input 
              type="text" 
              value="${f.placeholder || ''}" 
              placeholder="Contoh teks bantuan jawaban..."
              oninput="handleInlineFieldUpdate(${sIdx}, ${fIdx}, 'placeholder', this.value)"
              class="w-full sm:w-3/4 px-3 py-2 rounded-lg border border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 text-xs text-zinc-800 bg-white outline-none transition shadow-2xs"
            >
            <div class="w-full sm:w-3/4 pb-1 border-b-2 border-dotted border-zinc-300 text-zinc-400 text-xs italic">
              Teks jawaban singkat (akan diisi oleh responden)
            </div>
          </div>
        `;
      }

      // 5. TEXTAREA
      if (f.type === 'TEXTAREA') {
        return `
          <div class="pt-2 pb-1 space-y-1.5">
            <input 
              type="text" 
              value="${f.placeholder || ''}" 
              placeholder="Contoh teks bantuan ulasan..."
              oninput="handleInlineFieldUpdate(${sIdx}, ${fIdx}, 'placeholder', this.value)"
              class="w-full px-3 py-2 rounded-lg border border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 text-xs text-zinc-800 bg-white outline-none transition shadow-2xs"
            >
            <div class="w-full pb-4 border-b-2 border-dotted border-zinc-300 text-zinc-400 text-xs italic">
              Teks jawaban panjang / paragraf (akan diisi oleh responden)
            </div>
          </div>
        `;
      }

      // 6. RATING SCALE / SKALA LINIER (SMART DYNAMIC LABELS FOR ALL RANGES)
      if (f.type === 'RATING_SCALE') {
        const minV = f.minVal !== undefined ? f.minVal : 1;
        const maxV = f.maxVal !== undefined ? f.maxVal : 5;
        
        if (!f.pointLabels || typeof f.pointLabels !== 'object' || Object.keys(f.pointLabels).length === 0) {
          f.pointLabels = getDefaultScalePointLabels(minV, maxV);
          f.labelMin = f.pointLabels[String(minV)] || "Sangat Kurang";
          f.labelMax = f.pointLabels[String(maxV)] || "Sangat Baik";
        }

        const defaultSmartMap = getDefaultScalePointLabels(minV, maxV);

        let pointInputsHtml = '';
        for (let i = minV; i <= maxV; i++) {
          const currentLabel = f.pointLabels[String(i)] !== undefined ? f.pointLabels[String(i)] : (defaultSmartMap[String(i)] || "");
          pointInputsHtml += `
            <div class="space-y-1">
              <div class="flex items-center gap-2 text-xs">
                <span class="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-300 font-mono font-bold text-zinc-700 flex items-center justify-center shrink-0 text-xs shadow-2xs">${i}</span>
                <input 
                  type="text" 
                  value="${escapeHtml(currentLabel)}" 
                  placeholder="Label teks nilai ${i} (contoh: ${defaultSmartMap[String(i)] || 'Keterangan...'})..."
                  oninput="handleInlineScalePointLabelUpdate(${sIdx}, ${fIdx}, '${i}', this.value)"
                  class="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 bg-white text-xs text-zinc-800 outline-none transition shadow-2xs"
                >
              </div>
              ${getLiveMathBadgeHtml(currentLabel, `liveMathScalePoint_${sIdx}_${fIdx}_${i}`)}
            </div>
          `;
        }

        return `
          <div class="space-y-3 pt-2 text-xs">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <span class="text-zinc-600 font-bold">Rentang Skala Angka:</span>
                <select 
                  onchange="handleScaleRangeChange(${sIdx}, ${fIdx}, 'minVal', parseInt(this.value))"
                  class="px-2.5 py-1 rounded-lg border border-zinc-300 bg-white text-xs font-mono font-bold cursor-pointer"
                >
                  <option value="1" ${minV === 1 ? 'selected' : ''}>1</option>
                  <option value="0" ${minV === 0 ? 'selected' : ''}>0</option>
                </select>
                <span class="text-zinc-400 font-medium">sampai</span>
                <select 
                  onchange="handleScaleRangeChange(${sIdx}, ${fIdx}, 'maxVal', parseInt(this.value))"
                  class="px-2.5 py-1 rounded-lg border border-zinc-300 bg-white text-xs font-mono font-bold cursor-pointer"
                >
                  <option value="2" ${maxV === 2 ? 'selected' : ''}>2</option>
                  <option value="3" ${maxV === 3 ? 'selected' : ''}>3</option>
                  <option value="4" ${maxV === 4 ? 'selected' : ''}>4</option>
                  <option value="5" ${maxV === 5 ? 'selected' : ''}>5</option>
                  <option value="6" ${maxV === 6 ? 'selected' : ''}>6</option>
                  <option value="7" ${maxV === 7 ? 'selected' : ''}>7</option>
                  <option value="8" ${maxV === 8 ? 'selected' : ''}>8</option>
                  <option value="9" ${maxV === 9 ? 'selected' : ''}>9</option>
                  <option value="10" ${maxV === 10 ? 'selected' : ''}>10</option>
                </select>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
              <span class="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider font-mono block">Keterangan Label Setiap Angka (${minV} s.d. ${maxV}):</span>
              <div class="space-y-1.5">
                ${pointInputsHtml}
              </div>
            </div>
          </div>
        `;
      }

      // 6B. STAR_RATING / RATING BINTANG
      if (f.type === 'STAR_RATING') {
        const maxStars = f.maxStars || 5;
        let starsHtml = '';
        for (let i = 1; i <= maxStars; i++) {
          starsHtml += `
            <span class="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center text-base shadow-2xs">
              ★
            </span>
          `;
        }
        return `
          <div class="space-y-3 pt-2 text-xs">
            <div class="flex items-center gap-3">
              <span class="text-zinc-600 font-bold">Maksimal Bintang:</span>
              <select 
                onchange="handleInlineFieldUpdate(${sIdx}, ${fIdx}, 'maxStars', parseInt(this.value))"
                class="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-mono font-bold cursor-pointer"
              >
                <option value="5" ${maxStars === 5 ? 'selected' : ''}>5 Bintang (⭐⭐⭐⭐⭐)</option>
                <option value="7" ${maxStars === 7 ? 'selected' : ''}>7 Bintang</option>
                <option value="10" ${maxStars === 10 ? 'selected' : ''}>10 Bintang</option>
              </select>
            </div>
            <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center gap-2 overflow-x-auto">
              ${starsHtml}
              <span class="text-xs text-zinc-500 font-medium ml-2">(${maxStars} Skala Penilaian Bintang)</span>
            </div>
          </div>
        `;
      }

      // 6C. MATRIX_GRID / RUBRIK MATRIKS KISI
      if (f.type === 'MATRIX_GRID') {
        const rows = (f.matrixRows && f.matrixRows.length > 0) ? f.matrixRows : ['Kriteria 1: Sistematika', 'Kriteria 2: Penguasaan Teori', 'Kriteria 3: Kerapian Slide'];
        const cols = (f.matrixCols && f.matrixCols.length > 0) ? f.matrixCols : ['1: Kurang', '2: Cukup', '3: Baik', '4: Sangat Baik'];

        const rowsHtml = rows.map((r, rIdx) => `
          <div class="flex items-center gap-2 text-xs">
            <span class="w-5 font-mono text-zinc-400 font-bold text-xs shrink-0 text-center">${rIdx + 1}.</span>
            <input 
              type="text" 
              value="${escapeHtml(r)}" 
              placeholder="Nama Kriteria / Indikator ${rIdx + 1}..."
              oninput="handleInlineMatrixRowUpdate(${sIdx}, ${fIdx}, ${rIdx}, this.value)"
              class="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 bg-white text-xs text-zinc-800 outline-none transition shadow-2xs"
            >
            <button 
              type="button" 
              onclick="handleInlineDeleteMatrixRow(${sIdx}, ${fIdx}, ${rIdx})" 
              ${rows.length <= 1 ? 'disabled' : ''}
              class="w-6 h-6 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 disabled:opacity-20 flex items-center justify-center cursor-pointer transition" 
              title="Hapus Kriteria"
            >✕</button>
          </div>
        `).join('');

        const colsHtml = cols.map((c, cIdx) => `
          <div class="flex items-center gap-1.5 text-xs">
            <span class="w-4 font-mono text-indigo-400 font-bold text-xs shrink-0">${cIdx + 1}</span>
            <input 
              type="text" 
              value="${escapeHtml(c)}" 
              placeholder="Opsi ${cIdx + 1}..."
              oninput="handleInlineMatrixColUpdate(${sIdx}, ${fIdx}, ${cIdx}, this.value)"
              class="w-28 px-2 py-1 rounded-lg border border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 bg-white text-xs text-zinc-800 outline-none transition shadow-2xs"
            >
            <button 
              type="button" 
              onclick="handleInlineDeleteMatrixCol(${sIdx}, ${fIdx}, ${cIdx})" 
              ${cols.length <= 1 ? 'disabled' : ''}
              class="w-5 h-5 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 disabled:opacity-20 flex items-center justify-center cursor-pointer transition" 
              title="Hapus Kolom"
            >✕</button>
          </div>
        `).join('');

        return `
          <div class="space-y-3 pt-2 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Baris Kriteria -->
              <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-zinc-700 uppercase tracking-wider font-mono text-[10.5px]">Baris Kriteria (${rows.length})</span>
                  <button type="button" onclick="handleInlineAddMatrixRow(${sIdx}, ${fIdx})" class="text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer text-[11px]">+ Tambah Kriteria</button>
                </div>
                <div class="space-y-1.5">${rowsHtml}</div>
              </div>

              <!-- Kolom Skala -->
              <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-zinc-700 uppercase tracking-wider font-mono text-[10.5px]">Kolom Skala / Opsi (${cols.length})</span>
                  <button type="button" onclick="handleInlineAddMatrixCol(${sIdx}, ${fIdx})" class="text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer text-[11px]">+ Tambah Kolom</button>
                </div>
                <div class="flex flex-wrap gap-2">${colsHtml}</div>
              </div>
            </div>
          </div>
        `;
      }

      // 6D. RANKING / PERINGKAT PRIORITAS
      if (f.type === 'RANKING') {
        const options = (f.options && f.options.length > 0) ? f.options : ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
        const optsHtml = options.map((o, optIdx) => `
          <div class="flex items-center gap-2.5 text-xs p-2 bg-white rounded-lg border border-zinc-200 shadow-2xs">
            <span class="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold flex items-center justify-center text-xs shrink-0">${optIdx + 1}</span>
            <input 
              type="text" 
              value="${escapeHtml(o)}" 
              placeholder="Opsi peringkat ${optIdx + 1}..."
              oninput="handleInlineOptionUpdate(${sIdx}, ${fIdx}, ${optIdx}, this.value)"
              class="flex-1 px-2 py-1 rounded border-b border-transparent focus:border-indigo-600 text-xs text-zinc-800 outline-none transition"
            >
            <div class="flex items-center gap-1 text-zinc-400">
              <span class="text-[10px] font-mono">▲▼</span>
            </div>
            <button 
              type="button" 
              onclick="handleInlineDeleteOption(${sIdx}, ${fIdx}, ${optIdx})" 
              ${options.length <= 2 ? 'disabled' : ''}
              class="w-6 h-6 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 disabled:opacity-20 flex items-center justify-center cursor-pointer transition"
            >✕</button>
          </div>
        `).join('');

        return `
          <div class="space-y-2 pt-1 text-xs">
            <div class="space-y-1.5">${optsHtml}</div>
            <button type="button" onclick="handleInlineAddOption(${sIdx}, ${fIdx})" class="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer text-xs pt-1">
              + Tambahkan Opsi Peringkat
            </button>
          </div>
        `;
      }

      // 6E. SIGNATURE / TANDA TANGAN DIGITAL
      if (f.type === 'SIGNATURE') {
        return `
          <div class="pt-2">
            <div class="p-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/70 flex flex-col items-center justify-center text-center space-y-2 text-xs">
              <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </div>
              <div>
                <h5 class="font-bold text-zinc-800">Pad Tanda Tangan Digital (Canvas)</h5>
                <p class="text-[11px] text-zinc-500">Responden akan membubuhkan tanda tangan langsung di layar sentuh / kursor mouse sebagai pengesahan evaluasi.</p>
              </div>
            </div>
          </div>
        `;
      }

      // 6F. URL_LINK / INPUT TAUTAN
      if (f.type === 'URL_LINK') {
        return `
          <div class="pt-2 pb-1 space-y-1.5 text-xs">
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <span class="absolute left-3 top-2.5 text-zinc-400">🔗</span>
                <input 
                  type="text" 
                  value="${f.placeholder || ''}" 
                  placeholder="https://drive.google.com/... atau https://canva.com/..." 
                  oninput="handleInlineFieldUpdate(${sIdx}, ${fIdx}, 'placeholder', this.value)"
                  class="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 text-xs text-zinc-800 bg-white outline-none transition shadow-2xs font-mono"
                >
              </div>
            </div>
            <p class="text-[10.5px] text-zinc-400 italic">Validasi URL tautan otomatis (Google Drive, Canva, SlideShare, GitHub, dll).</p>
          </div>
        `;
      }

      // 6G. DATE & TIME
      if (f.type === 'DATE') {
        return `
          <div class="pt-2 text-xs">
            <input type="date" disabled class="px-3 py-2 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-600 font-mono text-xs cursor-not-allowed">
            <span class="text-zinc-400 text-xs ml-2 italic">(Pemilih Tanggal Kalender)</span>
          </div>
        `;
      }
      if (f.type === 'TIME') {
        return `
          <div class="pt-2 text-xs">
            <input type="time" disabled class="px-3 py-2 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-600 font-mono text-xs cursor-not-allowed">
            <span class="text-zinc-400 text-xs ml-2 italic">(Pemilih Waktu / Jam)</span>
          </div>
        `;
      }

      // 7. FILE UPLOAD
      if (f.type === 'FILE_UPLOAD') {
        return `
          <div class="pt-2">
            <div class="p-5 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <div>
                  <h5 class="font-bold text-zinc-800">Unggah Berkas ke Google Drive</h5>
                  <p class="text-[11px] text-zinc-500">Mendukung berkas PDF, PPTX, DOCX, Foto JPG/PNG (Maks 5 MB).</p>
                </div>
              </div>
              <span class="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 font-semibold text-zinc-700 shadow-2xs">
                Pilih Berkas
              </span>
            </div>
          </div>
        `;
      }

      // 8. CORE IDENTITY
      if (f.type === 'CORE_IDENTITY') {
        const peranMhsLabel = adminAppConfig["Peran_Mahasiswa_Label"] || "Mahasiswa (Anggota Kelas)";
        const peranDosenLabel = adminAppConfig["Peran_Dosen_Label"] || "Dosen (Pengampu / Penguji)";
        const peranTamuLabel = adminAppConfig["Peran_Lainnya_Label"] || "Penilai Tamu / Lainnya";

        return `
          <div class="space-y-3 pt-1">
            <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">Opsi Pilihan Peran Penilai:</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              
              <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1">
                <span class="text-[10px] text-zinc-500 block font-mono font-semibold">1. Peran Mahasiswa:</span>
                <input 
                  type="text" 
                  value="${peranMhsLabel}" 
                  oninput="handleInlineConfigUpdate('Peran_Mahasiswa_Label', this.value)"
                  class="w-full text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:border-indigo-400 focus:border-indigo-600 px-2.5 py-1.5 rounded-lg outline-none transition shadow-2xs"
                >
              </div>

              <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1">
                <span class="text-[10px] text-zinc-500 block font-mono font-semibold">2. Peran Dosen:</span>
                <input 
                  type="text" 
                  value="${peranDosenLabel}" 
                  oninput="handleInlineConfigUpdate('Peran_Dosen_Label', this.value)"
                  class="w-full text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:border-indigo-400 focus:border-indigo-600 px-2.5 py-1.5 rounded-lg outline-none transition shadow-2xs"
                >
              </div>

              <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1">
                <span class="text-[10px] text-zinc-500 block font-mono font-semibold">3. Peran Tamu:</span>
                <input 
                  type="text" 
                  value="${peranTamuLabel}" 
                  oninput="handleInlineConfigUpdate('Peran_Lainnya_Label', this.value)"
                  class="w-full text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:border-indigo-400 focus:border-indigo-600 px-2.5 py-1.5 rounded-lg outline-none transition shadow-2xs"
                >
              </div>

            </div>

            <div class="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1">
              <span class="text-[10px] text-zinc-500 font-mono font-semibold block">Domain Email Kampus yang Diizinkan:</span>
              <input 
                type="text" 
                value="${emailDomain}" 
                placeholder="mhs.ulm.ac.id, ulm.ac.id"
                oninput="handleInlineConfigUpdate('Domain_Email_Wajib', this.value)"
                class="w-full text-xs font-mono font-semibold text-indigo-700 bg-white border border-zinc-200 hover:border-indigo-400 focus:border-indigo-600 px-3 py-1.5 rounded-lg outline-none transition shadow-2xs"
              >
            </div>
          </div>
        `;
      }

      // 9. CORE GROUP SELECT
      if (f.type === 'CORE_GROUP_SELECT') {
        const groupLabel = adminAppConfig["Pilih_Kelompok_Label"] || "Pilih Kelompok Presentator yang Tampil Hari Ini...";
        return `
          <div class="space-y-2 pt-1">
            <div class="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1.5">
              <span class="text-[10px] text-zinc-500 font-mono font-semibold block">Teks Petunjuk Pilihan Kelompok:</span>
              <input 
                type="text" 
                value="${groupLabel}" 
                oninput="handleInlineConfigUpdate('Pilih_Kelompok_Label', this.value)"
                class="w-full text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 hover:border-indigo-400 focus:border-indigo-600 px-3 py-2 rounded-lg outline-none transition shadow-2xs"
              >
              <p class="text-[11px] text-zinc-400">Daftar kelompok otomatis bersumber dari Tab Kelompok &amp; Mahasiswa.</p>
            </div>
          </div>
        `;
      }

      // 10. CORE SCORE RUBRIC
      if (f.type === 'CORE_SCORE_RUBRIC') {
        return `
          <div class="space-y-2 pt-1">
            <div class="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span class="font-bold text-zinc-700">Rentang Batas Nilai Presentasi:</span>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1">
                    <span class="text-[11px] text-zinc-400 font-mono">Skor Min:</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value="${scoreMin}" 
                      oninput="handleInlineConfigUpdate('Nilai_Kelompok_Min', parseInt(this.value || 50))"
                      class="w-16 text-xs font-mono font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-1 rounded-lg text-center outline-none shadow-2xs"
                    >
                  </div>
                  <span class="text-zinc-400">s.d.</span>
                  <div class="flex items-center gap-1">
                    <span class="text-[11px] text-zinc-400 font-mono">Skor Max:</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value="${scoreMax}" 
                      oninput="handleInlineConfigUpdate('Nilai_Kelompok_Max', parseInt(this.value || 100))"
                      class="w-16 text-xs font-mono font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-1 rounded-lg text-center outline-none shadow-2xs"
                    >
                  </div>
                </div>
              </div>
              <div class="relative w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" style="width: 70%;"></div>
              </div>
            </div>
          </div>
        `;
      }

      // 11. CORE BEST PRESENTER
      if (f.type === 'CORE_BEST_PRESENTER') {
        return `
          <div class="space-y-2 pt-1">
            <div class="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
              <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span class="text-zinc-700 font-bold">Batas Maksimal Pilihan Suara:</span>
                <div class="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    value="${votingMax}" 
                    oninput="handleInlineConfigUpdate('Maksimal_Pilihan_Presentator_Terbaik', parseInt(this.value || 2))"
                    class="w-16 text-xs font-mono font-bold text-blue-800 bg-white border border-blue-300 px-2 py-1 rounded-lg text-center outline-none shadow-2xs"
                  >
                  <span class="text-xs text-zinc-500 font-medium">Orang Pemateri Terbaik</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // 12. CORE MEMBER FEEDBACK
      if (f.type === 'CORE_MEMBER_FEEDBACK') {
        const reviewPublic = adminAppConfig["Tampilkan_Ulasan_Publik"] || "AKTIF";
        const penyajiRule = adminAppConfig["Kewajiban_Menilai_Penyaji"] || "BEBAS_PENUH_DI_SESINYA";

        return `
          <div class="space-y-2 pt-1">
            <div class="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                <div class="space-y-1">
                  <span class="text-[10px] text-zinc-500 font-mono font-semibold block">Batas Maks Karakter:</span>
                  <input 
                    type="number" 
                    min="50" 
                    max="2000" 
                    value="${reviewMaxChars}" 
                    oninput="handleInlineConfigUpdate('Maksimal_Karakter_Evaluasi', parseInt(this.value || 500))"
                    class="w-full text-xs font-mono font-bold text-amber-800 bg-white border border-amber-300 px-2.5 py-1.5 rounded-lg outline-none shadow-2xs"
                  >
                </div>

                <div class="space-y-1">
                  <span class="text-[10px] text-zinc-500 font-mono font-semibold block">Tampilkan ke Publik:</span>
                  <select 
                    onchange="handleInlineConfigUpdate('Tampilkan_Ulasan_Publik', this.value)"
                    class="w-full text-xs font-medium text-zinc-800 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="AKTIF" ${reviewPublic === 'AKTIF' ? 'selected' : ''}>Tampilkan di Rekap</option>
                    <option value="NONAKTIF" ${reviewPublic === 'NONAKTIF' ? 'selected' : ''}>Khusus Admin</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <span class="text-[10px] text-zinc-500 font-mono font-semibold block">Aturan Bagi Penyaji:</span>
                  <select 
                    onchange="handleInlineConfigUpdate('Kewajiban_Menilai_Penyaji', this.value)"
                    class="w-full text-xs font-medium text-zinc-800 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="BEBAS_PENUH_DI_SESINYA" ${penyajiRule === 'BEBAS_PENUH_DI_SESINYA' ? 'selected' : ''}>Bebas Menilai</option>
                    <option value="WAJIB_NILAI_KELOMPOK_LAIN" ${penyajiRule === 'WAJIB_NILAI_KELOMPOK_LAIN' ? 'selected' : ''}>Wajib Nilai Kelompok Lain</option>
                  </select>
                </div>

              </div>
            </div>
          </div>
        `;
      }

      // 13. INFO BANNER
      if (f.type === 'INFO_BANNER') {
        return `
          <div class="pt-1">
            <div class="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5">
              <svg class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div class="space-y-1 flex-1">
                <span class="font-bold text-indigo-950 block">${f.label || 'Teks Informasi'}</span>
                <p class="text-indigo-800">${f.description || 'Petunjuk edukatif atau panduan pengisian.'}</p>
              </div>
            </div>
          </div>
        `;
      }

      return '';
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

    function handleInlineAlurUpdate(sIdx, prop, val) {
      if (!adminFormSchema || !adminFormSchema.tahapan[sIdx]) return;
      const stage = adminFormSchema.tahapan[sIdx];
      const trimmed = (val || "").trim();

      if (trimmed === '') {
        delete stage[prop];
        stage['isCustom_' + prop] = false;
        const defaultVal = prop === 'alurTitle' ? (stage.title || `Bagian ${sIdx + 1}`) : (stage.description || "");
        updateLiveMathBadge(defaultVal, prop === 'alurTitle' ? `liveMathAlurTitle_${sIdx}` : `liveMathAlurDesc_${sIdx}`);
      } else {
        stage[prop] = val;
        stage['isCustom_' + prop] = true;
        updateLiveMathBadge(val, prop === 'alurTitle' ? `liveMathAlurTitle_${sIdx}` : `liveMathAlurDesc_${sIdx}`);
      }
      markSchemaAsDirty();
    }

    function resetAlurStageText(sIdx) {
      if (!adminFormSchema || !adminFormSchema.tahapan[sIdx]) return;
      pushUndoSnapshot('Reset Teks Alur Bagian');
      const stage = adminFormSchema.tahapan[sIdx];
      
      delete stage.alurTitle;
      delete stage.alurDesc;
      stage.isCustom_alurTitle = false;
      stage.isCustom_alurDesc = false;

      const num = sIdx + 1;
      const targetTitle = stage.title || `Bagian ${num}`;
      const targetDesc = stage.description || (stage.fields && stage.fields.length > 0 ? `${stage.fields.length} Pertanyaan / Input` : "Tahapan Formulir");

      const titleInput = document.getElementById(`alurTitleInput_${sIdx}`);
      const descInput = document.getElementById(`alurDescInput_${sIdx}`);
      if (titleInput) titleInput.value = targetTitle;
      if (descInput) descInput.value = targetDesc;

      updateLiveMathBadge(targetTitle, `liveMathAlurTitle_${sIdx}`);
      updateLiveMathBadge(targetDesc, `liveMathAlurDesc_${sIdx}`);

      markSchemaAsDirty();
      showAdminToast(`Teks alur Bagian ${num} diset ulang mengikuti Judul & Deskripsi Bagian.`, "success");
    }

    function resetAllAlurStagesText() {
      if (!adminFormSchema || !Array.isArray(adminFormSchema.tahapan) || adminFormSchema.tahapan.length === 0) return;
      pushUndoSnapshot('Reset Seluruh Teks Alur');

      adminFormSchema.tahapan.forEach((stage, sIdx) => {
        delete stage.alurTitle;
        delete stage.alurDesc;
        stage.isCustom_alurTitle = false;
        stage.isCustom_alurDesc = false;
      });

      renderBuilderAlurTahapan();
      markSchemaAsDirty();
      showAdminToast("Seluruh kartu alur berhasil disinkronkan mengikuti Judul & Deskripsi Bagian!", "success");
    }

    function renderBuilderAlurTahapan() {
      const container = document.getElementById("builderAlurTahapanGrid");
      if (!container) return;

      const tahapan = (adminFormSchema && Array.isArray(adminFormSchema.tahapan) && adminFormSchema.tahapan.length > 0)
        ? adminFormSchema.tahapan
        : [];

      if (tahapan.length === 0) {
        container.className = "p-3 rounded-lg bg-zinc-100/80 text-center text-xs text-zinc-500 italic";
        container.innerHTML = "Belum ada bagian alur yang dibuat. Tambahkan bagian baru di bawah.";
        return;
      }

      const colsClass = tahapan.length <= 2 ? 'sm:grid-cols-2' : (tahapan.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4');
      container.className = `grid grid-cols-1 ${colsClass} gap-3 text-xs`;

      let html = '';
      tahapan.forEach((stage, idx) => {
        const num = idx + 1;
        const fieldsCount = (stage.fields || []).length;
        const currentAlurTitle = stage.alurTitle !== undefined && stage.alurTitle !== null ? stage.alurTitle : (stage.title || `Bagian ${num}`);
        const currentAlurDesc = stage.alurDesc !== undefined && stage.alurDesc !== null ? stage.alurDesc : (stage.description || (fieldsCount > 0 ? `${fieldsCount} Pertanyaan / Input` : "Tahapan Formulir"));
        
        html += `
          <div 
            class="group/alurCard p-2.5 rounded-xl bg-white border border-zinc-200/90 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 flex items-start gap-2 transition shadow-2xs relative"
          >
            <span class="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${num}</span>
            
            <div class="min-w-0 flex-1 space-y-0.5">
              
              <!-- Editable Alur Title Block -->
              <div class="group/fieldBlock">
                <div class="flex items-center justify-end">
                  ${getRichTextToolbarHtml(`alurTitleInput_${idx}`, 'mb-1')}
                </div>
                <textarea 
                  rows="1" 
                  id="alurTitleInput_${idx}"
                  placeholder="Judul Alur Bagian ${num}..."
                  title="Klik untuk mengubah teks judul alur (hanya tampil di panduan)"
                  oninput="autoResizeTextarea(this); handleInlineAlurUpdate(${idx}, 'alurTitle', this.value)"
                  class="w-full font-bold text-zinc-900 text-xs bg-transparent hover:bg-zinc-50 focus:bg-white border-b border-dashed border-transparent hover:border-zinc-300 focus:border-indigo-600 px-1 py-0.5 rounded outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-snug"
                >${escapeHtml(currentAlurTitle)}</textarea>
                ${getLiveMathBadgeHtml(currentAlurTitle, `liveMathAlurTitle_${idx}`)}
              </div>

              <!-- Editable Alur Description Block -->
              <div class="group/fieldBlock">
                <div class="flex items-center justify-end">
                  ${getRichTextToolbarHtml(`alurDescInput_${idx}`, 'mb-1')}
                </div>
                <textarea 
                  rows="1" 
                  id="alurDescInput_${idx}"
                  placeholder="Keterangan alur (opsional)..."
                  title="Klik untuk mengubah keterangan alur (hanya tampil di panduan)"
                  oninput="autoResizeTextarea(this); handleInlineAlurUpdate(${idx}, 'alurDesc', this.value)"
                  class="w-full text-[11px] text-zinc-500 bg-transparent hover:bg-zinc-50 focus:bg-white border-b border-dashed border-transparent hover:border-zinc-300 focus:border-indigo-600 px-1 py-0.5 rounded outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-relaxed"
                >${escapeHtml(currentAlurDesc)}</textarea>
                ${getLiveMathBadgeHtml(currentAlurDesc, `liveMathAlurDesc_${idx}`)}
              </div>

            </div>

            <!-- Card Action Buttons (Reset to Section & Quick Jump) -->
            <div class="flex items-center gap-0.5 shrink-0 mt-0.5">
              <button 
                type="button" 
                onclick="resetAlurStageText(${idx})" 
                class="p-1 rounded-lg hover:bg-amber-50 text-zinc-300 hover:text-amber-600 transition cursor-pointer" 
                title="Reset alur agar mengikuti Judul & Deskripsi Bagian ${num}"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
              <button 
                type="button" 
                onclick="scrollToStageCard(${idx})" 
                class="p-1 rounded-lg hover:bg-indigo-50 text-zinc-300 hover:text-indigo-600 transition cursor-pointer" 
                title="Gulir langsung ke Bagian ${num}"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      setTimeout(() => {
        renderAllMathInElement(container);
        initAllInPlaceRichFields(container);
      }, 40);
    }

    function scrollToStageCard(stageIdx) {
      const card = document.getElementById(`stageCard_${stageIdx}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('ring-2', 'ring-indigo-500');
        setTimeout(() => card.classList.remove('ring-2', 'ring-indigo-500'), 1500);
      }
    }

    function renderDynamicStagesCanvas() {
      initOrNormalizeFormSchema();
      renderBuilderAlurTahapan();
      const container = document.getElementById("dynamicStagesCanvasContainer");
      const statsBadgeHeader = document.getElementById("headerBuilderStatsBadge");
      const statsBadgeBody = document.getElementById("builderStatsBadgeBody");
      if (!container) return;
      container.innerHTML = "";

      const tahapan = adminFormSchema.tahapan;
      let totalFieldsCount = 0;
      tahapan.forEach(t => { totalFieldsCount += (t.fields || []).length; });

      if (statsBadgeHeader) statsBadgeHeader.textContent = `${tahapan.length}B • ${totalFieldsCount}P`;
      if (statsBadgeBody) statsBadgeBody.textContent = `${tahapan.length} Bagian • ${totalFieldsCount} Pertanyaan`;

      updatePublishStatusBadge();

      tahapan.forEach((stage, sIdx) => {
        const stageCard = document.createElement("div");
        stageCard.id = `stageCard_${sIdx}`;
        stageCard.setAttribute("data-stage-idx", sIdx);
        stageCard.ondragover = (e) => handleStageCardDragOver(e, sIdx);
        stageCard.ondragenter = (e) => handleStageCardDragEnter(e, sIdx);
        stageCard.ondragleave = (e) => handleStageCardDragLeave(e);
        stageCard.ondrop = (e) => handleStageCardDrop(e, sIdx);
        stageCard.className = "bg-white rounded-2xl border-2 border-zinc-200 shadow-xs space-y-0 transition hover:border-zinc-300 relative";

        const fields = stage.fields || [];

        const fieldCardsHtml = fields.map((f, fIdx) => {
          const isCore = String(f.type || "").startsWith("CORE_");
          const visualBody = getGoogleFormsVisualBodyHtml(f, sIdx, fIdx);

          return `
            <!-- AUTHENTIC GOOGLE FORMS QUESTION CARD -->
            <div 
              id="questionCard_${sIdx}_${fIdx}"
              data-stage-idx="${sIdx}"
              data-field-idx="${fIdx}"
              onclick="setActiveFormCard('question', ${sIdx}, ${fIdx}, this)"
              onfocusin="setActiveFormCard('question', ${sIdx}, ${fIdx}, this)"
              ondragover="handleQuestionCardDragOver(event, ${sIdx}, ${fIdx})"
              ondragenter="handleQuestionCardDragEnter(event, ${sIdx}, ${fIdx})"
              ondragleave="handleQuestionCardDragLeave(event)"
              ondrop="handleQuestionCardDrop(event, ${sIdx}, ${fIdx})"
              class="group/qcard bg-white rounded-xl border border-zinc-200 border-l-4 border-l-indigo-600 shadow-sm p-4 sm:p-6 space-y-3.5 transition hover:shadow-md relative cursor-pointer"
            >
              
              <!-- 6-Dots Drag Handle Centered (Google Forms Style Drag & Drop) -->
              <div 
                draggable="true"
                ondragstart="handleQuestionCardDragStart(event, ${sIdx}, ${fIdx})"
                ondragend="handleQuestionCardDragEnd(event)"
                class="flex items-center justify-center -mt-1.5 -mb-1 text-zinc-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing select-none py-1 px-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all duration-150 group/handle mx-auto"
                title="Klik dan tarik handle 6-titik ini untuk memindahkan urutan pertanyaan"
              >
                <div class="flex items-center gap-1.5">
                  <svg class="w-6 h-4 group-hover/handle:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6-14a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                  </svg>
                  <span class="text-[10px] font-mono font-bold uppercase tracking-wider hidden group-hover/handle:inline text-indigo-600 transition">Tarik Pertanyaan</span>
                </div>
              </div>

              <!-- Top Row: Question Title & Dropdown Type Selector (Authentic Google Forms Layout) -->
              <div class="flex flex-col md:flex-row md:items-start justify-between gap-3">
                
                <!-- Left: Question Title Input Box & Authentic Formatting Toolbar -->
                <div class="flex-1 space-y-2 min-w-0">
                  
                  <!-- Question Label Field Block -->
                  <div class="group/fieldBlock space-y-1.5">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 font-mono font-bold text-indigo-700 flex items-center justify-center flex-shrink-0 text-xs">
                          ${fIdx + 1}
                        </span>
                        <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Pertanyaan</span>
                      </div>
                      ${getRichTextToolbarHtml(`fieldLabelInput_${sIdx}_${fIdx}`)}
                    </div>
                    <div class="relative">
                      <textarea 
                        rows="1" 
                        id="fieldLabelInput_${sIdx}_${fIdx}"
                        data-field-id="${f.id}"
                        placeholder="Pertanyaan tanpa judul"
                        oninput="autoResizeTextarea(this); handleInlineFieldUpdate(${sIdx}, ${fIdx}, 'label', this.value)"
                        class="w-full text-sm sm:text-base font-semibold text-zinc-900 bg-zinc-100/90 hover:bg-zinc-100 focus:bg-zinc-100 border-b-2 border-zinc-300 hover:border-zinc-500 focus:border-indigo-600 px-3 py-2.5 rounded-t-lg outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-relaxed"
                      >${escapeHtml(f.label)}</textarea>
                    </div>
                    ${getLiveMathBadgeHtml(f.label, `liveMathQuestionLabel_${sIdx}_${fIdx}`)}
                  </div>

                  <!-- Question Description Field Block -->
                  <div class="group/fieldBlock space-y-1 pt-1">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <span class="text-[10.5px] font-medium text-zinc-400 font-mono">Deskripsi Pertanyaan (Opsional):</span>
                      ${getRichTextToolbarHtml(`fieldDescInput_${sIdx}_${fIdx}`)}
                    </div>
                    <textarea 
                      rows="1" 
                      id="fieldDescInput_${sIdx}_${fIdx}"
                      placeholder="Teks deskripsi / panduan pengisian pertanyaan (opsional)..." 
                      oninput="autoResizeTextarea(this); handleInlineFieldUpdate(${sIdx}, ${fIdx}, 'description', this.value)"
                      class="w-full text-xs text-zinc-600 bg-transparent border-b border-dashed border-zinc-300 hover:border-zinc-500 focus:border-indigo-600 px-1 py-1 outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-relaxed"
                    >${escapeHtml(f.description || '')}</textarea>
                    ${getLiveMathBadgeHtml(f.description, `liveMathQuestionDesc_${sIdx}_${fIdx}`)}
                  </div>
                </div>

                <!-- Right: Authentic Google Forms Question Type Selector Popover Button -->
                <div class="shrink-0 flex items-center gap-1.5 self-start md:self-auto">
                  
                  <!-- Insert Media directly on question (Google Forms Style) -->
                  <button 
                    type="button" 
                    onclick="openAttachMediaModal(${sIdx}, ${fIdx})" 
                    class="p-2 rounded-xl border ${(f.mediaList?.length > 0 || f.media?.url) ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'} transition cursor-pointer shadow-2xs shrink-0" 
                    title="${(f.mediaList?.length > 0 || f.media?.url) ? 'Media Terlampir (' + normalizeMediaList(f).length + ' Berkas - Klik untuk kelola)' : 'Sisipkan Media Gambar/Video untuk Pertanyaan ini'}"
                  >
                    <svg class="w-4 h-4 ${(f.mediaList?.length > 0 || f.media?.url) ? 'text-indigo-600' : 'text-zinc-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </button>

                  <div class="flex-1 md:flex-initial min-w-0">
                    ${getModernQuestionTypePopoverHtml(f, sIdx, fIdx)}
                  </div>
                </div>

              </div>

              <!-- Media Preview (If attached ABOVE question) -->
              ${(f.mediaList?.length > 0 || f.media?.url) && ((f.mediaPosition || f.media?.position || 'ABOVE_QUESTION') === 'ABOVE_QUESTION') ? getBuilderMediaPreviewHtml(f, sIdx, fIdx) : ''}

              <!-- Middle: Authentic Google Forms Question Body -->
              <div class="pt-1">
                ${visualBody}
              </div>

              <!-- Media Preview (If attached BELOW question) -->
              ${(f.mediaList?.length > 0 || f.media?.url) && ((f.mediaPosition || f.media?.position) === 'BELOW_QUESTION') ? getBuilderMediaPreviewHtml(f, sIdx, fIdx) : ''}

              <!-- Bottom Row: Google Forms Action Toolbar -->
              <div class="flex items-center justify-between gap-3 pt-3.5 border-t border-zinc-200/80 text-xs">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" onclick="moveField(${sIdx}, ${fIdx}, -1)" ${fIdx === 0 ? 'disabled' : ''} class="p-1.5 rounded-lg border border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-25 text-zinc-600 cursor-pointer transition shadow-2xs" title="Geser Pertanyaan Naik (▲)">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"></path></svg>
                  </button>
                  <button type="button" onclick="moveField(${sIdx}, ${fIdx}, 1)" ${fIdx === fields.length - 1 ? 'disabled' : ''} class="p-1.5 rounded-lg border border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-25 text-zinc-600 cursor-pointer transition shadow-2xs" title="Geser Pertanyaan Turun (▼)">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  <span class="text-[10px] font-mono text-zinc-400 hidden sm:inline ml-1">• Tersimpan di Draf</span>
                </div>

                <div class="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <button type="button" onclick="duplicateField(${sIdx}, ${fIdx})" class="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 cursor-pointer transition" title="Duplikasi Pertanyaan">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                  </button>
                  <button type="button" onclick="deleteField(${sIdx}, ${fIdx})" class="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer transition" title="Hapus Pertanyaan">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                  <div class="h-5 w-px bg-zinc-300"></div>
                  <!-- Google Forms Required Switch -->
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <span class="text-xs font-semibold text-zinc-700">Wajib diisi</span>
                    <input type="checkbox" onchange="toggleFieldRequired(${sIdx}, ${fIdx})" ${f.required ? 'checked' : ''} class="w-4 h-4 text-indigo-600 rounded cursor-pointer">
                  </label>

                  <!-- 3-Dots More Options Menu -->
                  <div class="relative inline-block text-left" id="fieldMoreMenuContainer_${sIdx}_${fIdx}">
                    <button 
                      type="button" 
                      onclick="toggleFieldMoreMenu(${sIdx}, ${fIdx}, event)" 
                      class="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 cursor-pointer transition flex items-center justify-center" 
                      title="Opsi Pertanyaan Lainnya (Titik Tiga)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                      </svg>
                    </button>

                    <!-- Dropdown Floating Menu -->
                    <div 
                      id="fieldMoreMenu_${sIdx}_${fIdx}" 
                      class="hidden absolute right-0 bottom-full mb-1.5 w-48 rounded-xl bg-white border border-zinc-200 shadow-xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                      onclick="event.stopPropagation()"
                    >
                      <button 
                        type="button" 
                        onclick="openMoveFieldModal(${sIdx}, ${fIdx}); closeAllFieldMoreMenus();" 
                        class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 text-zinc-700 hover:text-indigo-900 font-medium flex items-center gap-2 transition cursor-pointer"
                      >
                        <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                        <span>Pindah Bagian</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          `;
        }).join("");

        stageCard.innerHTML = `
          <!-- Section Top Accent Stripe -->
          <div class="bg-indigo-600 h-2.5 w-full"></div>

          <!-- Section Header Card (Google Forms Style) -->
          <div class="p-5 sm:p-7 space-y-4 border-b border-zinc-100">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200">
                  Bagian ${sIdx + 1} dari ${tahapan.length}
                </span>
                <span class="text-xs text-zinc-400 font-mono">(${fields.length} Pertanyaan)</span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <!-- 6-Dots Drag Handle for Section -->
                <div 
                  draggable="true"
                  ondragstart="handleStageCardDragStart(event, ${sIdx})"
                  ondragend="handleStageCardDragEnd(event)"
                  class="flex items-center text-zinc-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing p-1.5 px-2 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all duration-150 mr-0.5 group/stageHandle"
                  title="Klik dan tarik handle 6-titik ini untuk memindahkan seluruh Bagian"
                >
                  <svg class="w-4 h-4 group-hover/stageHandle:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6-14a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                  </svg>
                  <span class="text-[10px] font-mono font-bold uppercase tracking-wider hidden group-hover/stageHandle:inline text-indigo-600 ml-1 transition">Tarik Bagian</span>
                </div>

                <button type="button" onclick="moveStage(${sIdx}, -1)" ${sIdx === 0 ? 'disabled' : ''} class="p-1.5 rounded-lg border border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-25 text-zinc-600 cursor-pointer transition shadow-2xs" title="Geser Bagian Naik (▲)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"></path></svg>
                </button>
                <button type="button" onclick="moveStage(${sIdx}, 1)" ${sIdx === tahapan.length - 1 ? 'disabled' : ''} class="p-1.5 rounded-lg border border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-25 text-zinc-600 cursor-pointer transition shadow-2xs" title="Geser Bagian Turun (▼)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <button type="button" onclick="duplicateStage(${sIdx})" class="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 cursor-pointer" title="Duplikasi Bagian">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                </button>
                <button type="button" onclick="deleteStage(${sIdx})" ${tahapan.length <= 1 ? 'disabled' : ''} class="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-25 cursor-pointer" title="Hapus Bagian">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>

            <!-- Underlined Section Title & Description -->
            <div class="space-y-3">
              <!-- Stage Title Field Block -->
              <div class="group/fieldBlock space-y-1.5">
                <div class="flex items-center justify-between flex-wrap gap-1">
                  <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Judul Bagian</label>
                  ${getRichTextToolbarHtml(`stageTitleInput_${sIdx}`)}
                </div>
                <textarea 
                  rows="1" 
                  id="stageTitleInput_${sIdx}"
                  data-stage-id="${stage.id || ('tahap_' + (sIdx+1))}"
                  placeholder="Judul Bagian (contoh: Evaluasi Presentasi, dll)..."
                  oninput="autoResizeTextarea(this); handleInlineStageUpdate(${sIdx}, 'title', this.value)"
                  class="w-full text-base sm:text-xl font-bold text-zinc-900 bg-transparent border-b-2 border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 px-1 py-1.5 outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-snug"
                >${escapeHtml(stage.title)}</textarea>
                ${getLiveMathBadgeHtml(stage.title, `liveMathStageTitle_${sIdx}`)}
              </div>

              <!-- Stage Description Field Block -->
              <div class="group/fieldBlock space-y-1.5 pt-1">
                <div class="flex items-center justify-between flex-wrap gap-1">
                  <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Deskripsi Bagian (Opsional)</label>
                  ${getRichTextToolbarHtml(`stageDescInput_${sIdx}`)}
                </div>
                <textarea 
                  rows="1" 
                  id="stageDescInput_${sIdx}"
                  placeholder="Deskripsi Bagian (opsional, contoh: Berikan penilaian objektif)..."
                  oninput="autoResizeTextarea(this); handleInlineStageUpdate(${sIdx}, 'description', this.value)"
                  class="w-full text-xs sm:text-sm text-zinc-600 bg-transparent border-b border-zinc-200 hover:border-zinc-400 focus:border-indigo-600 px-1 py-1 outline-none transition resize-none overflow-hidden block whitespace-pre-wrap break-words leading-relaxed"
                >${escapeHtml(stage.description || '')}</textarea>
                ${getLiveMathBadgeHtml(stage.description, `liveMathStageDesc_${sIdx}`)}
              </div>
            </div>
          </div>

          <!-- Section Questions List Area -->
          <div class="p-4 sm:p-6 space-y-4 bg-zinc-50/50">
            ${fields.length > 0 ? fieldCardsHtml : `
              <div class="p-8 rounded-xl border-2 border-dashed border-zinc-300 text-center text-xs text-zinc-400 space-y-2 bg-white">
                <p class="font-bold text-zinc-700 text-sm">Bagian ini belum memiliki pertanyaan.</p>
                <p>Klik tombol "+ Tambah Pertanyaan ke Bagian ${sIdx + 1}" di bawah untuk membuat pertanyaan.</p>
              </div>
            `}

            <!-- Add Question Button at Bottom of Section -->
            <div class="pt-2">
              <button 
                type="button" 
                onclick="addNewQuestionDirect(${sIdx})" 
                class="w-full py-3 px-4 rounded-xl border-2 border-dashed border-indigo-300 bg-white hover:bg-indigo-50/60 hover:border-indigo-500 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-99 cursor-pointer shadow-2xs"
                title="Klik untuk langsung membuat pertanyaan baru di bagian ini"
              >
                <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                <span>Tambah Pertanyaan ke Bagian ${sIdx + 1}</span>
              </button>
            </div>
          </div>
        `;

        container.appendChild(stageCard);
      });
      initAllModernDropdowns(container);
      setTimeout(() => {
        renderAllMathInElement(container);
        initAllInPlaceRichFields(container);
        updateFloatingDockPosition();
      }, 50);
    }

    // LIVE FORM SIMULATOR ENGINE (EXACT AUTHENTIC DRAFT PREVIEW & RESPONSIVE DEVICE MODES)
    function setSimulatorDevice(mode) {
      const wrapper = document.getElementById("simulatorDeviceWrapper");
      const btnD = document.getElementById("simDevBtnDesktop");
      const btnT = document.getElementById("simDevBtnTablet");
      const btnM = document.getElementById("simDevBtnMobile");
      if (!wrapper) return;

      [btnD, btnT, btnM].forEach(b => {
        if (b) {
          b.className = "px-2.5 py-1 rounded-md font-medium text-zinc-400 hover:text-white transition cursor-pointer";
        }
      });

      if (mode === 'mobile') {
        wrapper.className = "w-[390px] max-w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-700 transition-all duration-300";
        if (btnM) btnM.className = "px-2.5 py-1 rounded-md font-medium text-white bg-zinc-800 transition cursor-pointer shadow-xs";
      } else if (mode === 'tablet') {
        wrapper.className = "w-[768px] max-w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-700 transition-all duration-300";
        if (btnT) btnT.className = "px-2.5 py-1 rounded-md font-medium text-white bg-zinc-800 transition cursor-pointer shadow-xs";
      } else {
        wrapper.className = "w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 transition-all duration-300";
        if (btnD) btnD.className = "px-2.5 py-1 rounded-md font-medium text-white bg-zinc-800 transition cursor-pointer shadow-xs";
      }
    }

    function openLiveFormSimulator() {
      handleConfigInputAutoSave(true);
      initOrNormalizeFormSchema();
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      
      // Save current in-memory draft state into sessionStorage and localStorage
      try {
        sessionStorage.setItem("PGSD_DRAFT_SCHEMA_" + formKey, JSON.stringify(adminFormSchema));
        sessionStorage.setItem("PGSD_DRAFT_CONFIG_" + formKey, JSON.stringify(adminAppConfig));
        localStorage.setItem("PGSD_DRAFT_SCHEMA_" + formKey, JSON.stringify(adminFormSchema));
        localStorage.setItem("PGSD_DRAFT_CONFIG_" + formKey, JSON.stringify(adminAppConfig));
      } catch(e) {
        console.warn("Error saving draft before simulator:", e);
      }

      const activeTitle = document.getElementById("simActiveTitle");
      if (activeTitle) activeTitle.textContent = adminAppConfig["Judul_Form"] || "Formulir";

      const modal = document.getElementById("modalLiveFormSimulator");
      const iframe = document.getElementById("simulatorIframe");
      if (!modal) return;
      modal.classList.remove("hidden");

      if (iframe) {
        iframe.src = getRespondentFormUrl(formKey, { preview: "draft", t: Date.now() });
      }
    }

    function closeLiveFormSimulator() {
      const modal = document.getElementById("modalLiveFormSimulator");
      const iframe = document.getElementById("simulatorIframe");
      if (modal) modal.classList.add("hidden");
      if (iframe) iframe.src = "about:blank";
    }

    function openLivePreviewInNewTab() {
      handleConfigInputAutoSave(true);
      initOrNormalizeFormSchema();
      const formKey = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      try {
        sessionStorage.setItem("PGSD_DRAFT_SCHEMA_" + formKey, JSON.stringify(adminFormSchema));
        sessionStorage.setItem("PGSD_DRAFT_CONFIG_" + formKey, JSON.stringify(adminAppConfig));
        localStorage.setItem("PGSD_DRAFT_SCHEMA_" + formKey, JSON.stringify(adminFormSchema));
        localStorage.setItem("PGSD_DRAFT_CONFIG_" + formKey, JSON.stringify(adminAppConfig));
      } catch(e) {}
      
      const fullUrl = getRespondentFormUrl(formKey, { preview: "draft", t: Date.now() });
      window.open(fullUrl, '_blank');
    }

    function toggleFieldRequired(sIdx, fIdx) {
      const f = adminFormSchema.tahapan[sIdx].fields[fIdx];
      if (f) {
        f.required = !f.required;
        renderDynamicStagesCanvas();
        markSchemaAsDirty();
        showAdminToast(`'${f.label}' sekarang ${f.required ? 'Wajib diisi' : 'Opsional'}.`, "info");
      }
    }

    function duplicateField(sIdx, fIdx) {
      pushUndoSnapshot('Duplikat Pertanyaan');
      const f = adminFormSchema.tahapan[sIdx].fields[fIdx];
      if (!f) return;
      const copy = JSON.parse(JSON.stringify(f));
      copy.id = "fld_" + Date.now().toString(36);
      copy.label = `${f.label} (Salinan)`;
      adminFormSchema.tahapan[sIdx].fields.splice(fIdx + 1, 0, copy);
      renderDynamicStagesCanvas();
      markSchemaAsDirty();
      showAdminToast(`Pertanyaan '${f.label}' berhasil diduplikasi ke Draf!`, "success");
    }

    // STAGE CRUD ACTIONS
    function openAddStageModal() {
      document.getElementById("modalStageTitleText").textContent = "Tambah Tahap Baru";
      document.getElementById("stage_edit_id").value = "";
      document.getElementById("stage_input_title").value = `Tahap ${adminFormSchema.tahapan.length + 1}`;
      document.getElementById("stage_input_description").value = "";
      document.getElementById("modalStageEditor").classList.remove("hidden");
    }

    function openEditStageModal(sIdx) {
      const stage = adminFormSchema.tahapan[sIdx];
      if (!stage) return;
      document.getElementById("modalStageTitleText").textContent = `Ubah Tahap ${sIdx + 1}`;
      document.getElementById("stage_edit_id").value = stage.id || `tahap_${sIdx + 1}`;
      document.getElementById("stage_input_title").value = stage.title || "";
      document.getElementById("stage_input_description").value = stage.description || "";
      document.getElementById("modalStageEditor").classList.remove("hidden");
    }

    function closeStageEditorModal() {
      document.getElementById("modalStageEditor").classList.add("hidden");
    }

    function handleSaveStage(e) {
      e.preventDefault();
      const editId = document.getElementById("stage_edit_id").value;
      const title = document.getElementById("stage_input_title").value.trim();
      const desc = document.getElementById("stage_input_description").value.trim();

      if (editId) {
        const stage = adminFormSchema.tahapan.find(t => t.id === editId);
        if (stage) {
          stage.title = title;
          stage.description = desc;
        }
      } else {
        const newId = "tahap_" + Date.now().toString(36);
        adminFormSchema.tahapan.push({
          id: newId,
          title: title,
          description: desc,
          fields: []
        });
      }

      closeStageEditorModal();
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast("Tahap formulir berhasil disimpan & disinkronkan.", "success");
    }

    function moveStage(sIdx, dir) {
      const targetIdx = sIdx + dir;
      if (targetIdx < 0 || targetIdx >= adminFormSchema.tahapan.length) return;
      pushUndoSnapshot('Pindah Posisi Bagian');
      const temp = adminFormSchema.tahapan[sIdx];
      adminFormSchema.tahapan[sIdx] = adminFormSchema.tahapan[targetIdx];
      adminFormSchema.tahapan[targetIdx] = temp;
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast(`Bagian '${adminFormSchema.tahapan[targetIdx].title || (targetIdx + 1)}' dipindahkan ke Posisi ${targetIdx + 1}!`, "success");
    }

    function duplicateStage(sIdx) {
      pushUndoSnapshot('Duplikat Bagian');
      const stage = adminFormSchema.tahapan[sIdx];
      if (!stage) return;
      const copyFields = JSON.parse(JSON.stringify(stage.fields || [])).map(f => ({
        ...f,
        id: "fld_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 4)
      }));

      const newStage = {
        id: "tahap_" + Date.now().toString(36),
        title: `${stage.title} (Salinan)`,
        description: stage.description || "",
        fields: copyFields
      };

      adminFormSchema.tahapan.splice(sIdx + 1, 0, newStage);
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast(`Tahap '${stage.title}' berhasil diduplikasi!`, "success");
    }

    async function deleteStage(sIdx) {
      if (adminFormSchema.tahapan.length <= 1) {
        showAdminToast("Formulir wajib memiliki minimal 1 Bagian pengisian.", "warning");
        return;
      }
      const stage = adminFormSchema.tahapan[sIdx];
      const count = (stage.fields || []).length;
      const ok = await showAppConfirm({
        title: "Hapus Bagian Formulir?",
        message: `Apakah Anda yakin ingin menghapus '${stage.title}' beserta seluruh (${count}) pertanyaan di dalamnya?`,
        confirmText: "Ya, Hapus Bagian",
        type: "danger"
      });
      if (!ok) return;

      // Bersihkan seluruh berkas media di dalam bagian ini dari Google Drive
      (stage.fields || []).forEach(field => {
        if (field.media) cleanupDriveMediaFile(field.media);
      });

      pushUndoSnapshot('Hapus Bagian');
      adminFormSchema.tahapan.splice(sIdx, 1);
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast("Bagian berhasil dihapus dan berkas media dibersihkan.", "info");
    }

    // FIELD CRUD ACTIONS
    let editingFieldStageIdx = -1;
    let editingFieldIndex = -1;

    function openAddFieldModal(targetStageIdx = 0) {
      editingFieldStageIdx = targetStageIdx;
      editingFieldIndex = -1;

      document.getElementById("modalQuestionTitle").textContent = "Tambah Input / Pertanyaan Baru";
      document.getElementById("q_edit_id").value = "";
      document.getElementById("q_label").value = "";
      document.getElementById("q_scope").value = "GLOBAL";
      document.getElementById("q_type").value = "SHORT_TEXT";
      document.getElementById("q_required").checked = false;
      document.getElementById("q_options_text").value = "";
      document.getElementById("q_allow_other").checked = false;
      document.getElementById("q_matrix_rows").value = "Sistematika Presentasi\nPenguasaan Teori & Konsep\nKerapian Slide & Visual\nKemampuan Menjawab Pertanyaan";
      document.getElementById("q_matrix_cols").value = "1: Kurang, 2: Cukup, 3: Baik, 4: Sangat Baik";
      document.getElementById("q_star_max").value = "5";
      document.getElementById("q_min_val").value = "1";
      document.getElementById("q_max_val").value = "5";
      document.getElementById("q_placeholder").value = "";
      document.getElementById("q_hint").value = "";
      document.getElementById("q_min_chars").value = "";
      document.getElementById("q_max_chars").value = "";
      document.getElementById("q_min_select").value = "";
      document.getElementById("q_max_select").value = "";
      document.getElementById("q_media_url").value = "";

      handleQuestionTypeChange();
      document.getElementById("modalCustomQuestion").classList.remove("hidden");
    }

    function openEditFieldModal(sIdx, fIdx) {
      editingFieldStageIdx = sIdx;
      editingFieldIndex = fIdx;
      const field = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!field) return;

      document.getElementById("modalQuestionTitle").textContent = "Ubah Input / Pertanyaan";
      document.getElementById("q_edit_id").value = field.id;
      document.getElementById("q_label").value = field.label || "";
      document.getElementById("q_scope").value = field.scope || "GLOBAL";
      document.getElementById("q_type").value = field.type || "SHORT_TEXT";
      document.getElementById("q_required").checked = !!field.required;

      document.getElementById("q_options_text").value = (field.options || []).join("\n");
      document.getElementById("q_allow_other").checked = !!field.hasOtherOption;
      document.getElementById("q_matrix_rows").value = (field.matrixRows || []).join("\n");
      document.getElementById("q_matrix_cols").value = (field.matrixCols || []).join(", ");
      document.getElementById("q_star_max").value = String(field.maxStars || 5);
      document.getElementById("q_min_val").value = field.minVal !== undefined ? field.minVal : 1;
      document.getElementById("q_max_val").value = field.maxVal !== undefined ? field.maxVal : 5;
      document.getElementById("q_placeholder").value = field.placeholder || "";
      document.getElementById("q_hint").value = field.hint || field.rubricHint || "";
      document.getElementById("q_min_chars").value = field.minChars || "";
      document.getElementById("q_max_chars").value = field.maxChars || "";
      document.getElementById("q_min_select").value = field.minSelect || "";
      document.getElementById("q_max_select").value = field.maxSelect || "";
      document.getElementById("q_media_url").value = (field.media?.url || field.mediaUrl || "");

      handleQuestionTypeChange();
      document.getElementById("modalCustomQuestion").classList.remove("hidden");
    }

    function openEditCoreFieldDirect(coreType) {
      if (coreType === 'CORE_IDENTITY') openEditCoreFieldModal('IDENTITY');
      else if (coreType === 'CORE_GROUP_SELECT') switchAdminTab('data');
      else if (coreType === 'CORE_SCORE_RUBRIC') openEditCoreFieldModal('SCORE');
      else if (coreType === 'CORE_BEST_PRESENTER') openEditCoreFieldModal('VOTING');
      else if (coreType === 'CORE_MEMBER_FEEDBACK') openEditCoreFieldModal('REVIEW');
    }

    function handleQuestionTypeChange() {
      const t = document.getElementById("q_type").value;
      const optBox = document.getElementById("q_options_container");
      const allowOtherLabel = document.getElementById("q_allow_other_label");
      const matrixBox = document.getElementById("q_matrix_container");
      const starBox = document.getElementById("q_star_container");
      const rateBox = document.getElementById("q_rating_container");

      if (optBox) {
        if (['RADIO', 'CHECKBOX', 'DROPDOWN', 'RANKING'].includes(t)) {
          optBox.classList.remove("hidden");
          if (['RADIO', 'CHECKBOX'].includes(t)) {
            allowOtherLabel?.classList.remove("hidden");
          } else {
            allowOtherLabel?.classList.add("hidden");
          }
        } else {
          optBox.classList.add("hidden");
        }
      }

      if (matrixBox) {
        if (t === 'MATRIX_GRID') matrixBox.classList.remove("hidden");
        else matrixBox.classList.add("hidden");
      }

      if (starBox) {
        if (t === 'STAR_RATING') starBox.classList.remove("hidden");
        else starBox.classList.add("hidden");
      }

      if (rateBox) {
        if (t === 'RATING_SCALE') rateBox.classList.remove("hidden");
        else rateBox.classList.add("hidden");
      }
    }

    function handleSaveCustomQuestion(e) {
      e.preventDefault();
      const editId = document.getElementById("q_edit_id").value;
      const label = document.getElementById("q_label").value.trim();
      const scope = document.getElementById("q_scope").value;
      const type = document.getElementById("q_type").value;
      const required = document.getElementById("q_required").checked;
      const allowOther = document.getElementById("q_allow_other").checked;

      let options = [];
      if (['RADIO', 'CHECKBOX', 'DROPDOWN', 'RANKING'].includes(type)) {
        options = document.getElementById("q_options_text").value
          .split(/[\n,]/)
          .map(s => s.trim())
          .filter(Boolean);
        if (options.length === 0) {
          options = type === 'RANKING' ? ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'] : ['Opsi 1', 'Opsi 2'];
        }
      }

      let matrixRows = [];
      let matrixCols = [];
      if (type === 'MATRIX_GRID') {
        matrixRows = document.getElementById("q_matrix_rows").value
          .split(/\n/)
          .map(s => s.trim())
          .filter(Boolean);
        if (matrixRows.length === 0) matrixRows = ['Kriteria 1', 'Kriteria 2'];

        matrixCols = document.getElementById("q_matrix_cols").value
          .split(/[\n,]/)
          .map(s => s.trim())
          .filter(Boolean);
        if (matrixCols.length === 0) matrixCols = ['1: Kurang', '2: Cukup', '3: Baik', '4: Sangat Baik'];
      }

      const maxStars = parseInt(document.getElementById("q_star_max").value || 5);
      const minVal = parseInt(document.getElementById("q_min_val").value || 1);
      const maxVal = parseInt(document.getElementById("q_max_val").value || 5);
      const placeholder = document.getElementById("q_placeholder").value.trim();
      const hint = document.getElementById("q_hint").value.trim();
      const minChars = parseInt(document.getElementById("q_min_chars").value) || null;
      const maxChars = parseInt(document.getElementById("q_max_chars").value) || null;
      const minSelect = parseInt(document.getElementById("q_min_select").value) || null;
      const maxSelect = parseInt(document.getElementById("q_max_select").value) || null;
      const mediaUrl = document.getElementById("q_media_url").value.trim();

      const fieldObj = {
        id: editId || ("fld_" + Date.now().toString(36)),
        label: label,
        scope: scope,
        type: type,
        required: required,
        options: options,
        hasOtherOption: allowOther,
        matrixRows: matrixRows,
        matrixCols: matrixCols,
        maxStars: maxStars,
        minVal: minVal,
        maxVal: maxVal,
        placeholder: placeholder,
        hint: hint,
        minChars: minChars,
        maxChars: maxChars,
        minSelect: minSelect,
        maxSelect: maxSelect
      };

      if (mediaUrl) {
        fieldObj.media = { url: mediaUrl, position: 'ABOVE_QUESTION' };
      }

      const sIdx = editingFieldStageIdx >= 0 ? editingFieldStageIdx : 0;
      if (!adminFormSchema.tahapan[sIdx]) {
        adminFormSchema.tahapan[sIdx] = { id: `tahap_${sIdx + 1}`, title: `Tahap ${sIdx + 1}`, fields: [] };
      }
      if (!adminFormSchema.tahapan[sIdx].fields) adminFormSchema.tahapan[sIdx].fields = [];

      if (editingFieldIndex >= 0) {
        adminFormSchema.tahapan[sIdx].fields[editingFieldIndex] = fieldObj;
      } else {
        adminFormSchema.tahapan[sIdx].fields.push(fieldObj);
      }

      closeCustomQuestionModal();
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast("Pertanyaan berhasil disimpan ke Tahap " + (sIdx + 1), "success");
    }

    function moveField(sIdx, fIdx, dir) {
      const fields = adminFormSchema.tahapan[sIdx]?.fields;
      if (!fields) return;
      const targetIdx = fIdx + dir;
      if (targetIdx < 0 || targetIdx >= fields.length) return;
      pushUndoSnapshot('Pindah Posisi Pertanyaan');
      const temp = fields[fIdx];
      fields[fIdx] = fields[targetIdx];
      fields[targetIdx] = temp;
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast(`Pertanyaan '${fields[targetIdx].label || 'tanpa judul'}' dipindahkan ke Nomor ${targetIdx + 1}!`, "success");
    }

    // =========================================================================
    // DRAG AND DROP REORDERING & AUTO-SCROLL ENGINE (GOOGLE FORMS AUTHENTIC)
    // =========================================================================
    let draggedQuestionData = null; // { sIdx, fIdx }
    let draggedStageIdx = null; // sIdx
    let dragAutoScrollTimer = null;
    let dragAutoScrollVelocity = 0; // -speed for up, +speed for down

    function startDragAutoScrollLoop() {
      if (dragAutoScrollTimer) return;
      dragAutoScrollTimer = setInterval(() => {
        if (dragAutoScrollVelocity !== 0) {
          window.scrollBy(0, dragAutoScrollVelocity);
          if (document.documentElement) {
            document.documentElement.scrollTop += dragAutoScrollVelocity;
          }
          if (document.body) {
            document.body.scrollTop += dragAutoScrollVelocity;
          }
        }
      }, 16);
    }

    function handleGlobalDragOverForAutoScroll(e) {
      if (!draggedQuestionData && draggedStageIdx === null) {
        dragAutoScrollVelocity = 0;
        return;
      }

      if (e && e.preventDefault) e.preventDefault();

      const clientY = e.clientY;
      const windowH = window.innerHeight || document.documentElement.clientHeight;
      const edgeThreshold = 140; // 140px from top / bottom edge

      if (clientY < edgeThreshold) {
        // Upper edge proximity: smooth progressive acceleration
        const intensity = Math.max(0, Math.min(1, (edgeThreshold - clientY) / edgeThreshold));
        dragAutoScrollVelocity = -Math.round(5 + intensity * 25); // -5px to -30px per frame
      } else if (clientY > windowH - edgeThreshold) {
        // Lower edge proximity: smooth progressive acceleration
        const intensity = Math.max(0, Math.min(1, (clientY - (windowH - edgeThreshold)) / edgeThreshold));
        dragAutoScrollVelocity = Math.round(5 + intensity * 25); // +5px to +30px per frame
      } else {
        dragAutoScrollVelocity = 0;
      }
    }

    // Attach global dragover and end listeners for auto-scrolling
    window.addEventListener("dragover", handleGlobalDragOverForAutoScroll, { passive: false });
    window.addEventListener("dragend", cleanupQuestionDragClasses);
    window.addEventListener("drop", cleanupQuestionDragClasses);

    function cleanupQuestionDragClasses() {
      dragAutoScrollVelocity = 0;
      if (dragAutoScrollTimer) {
        clearInterval(dragAutoScrollTimer);
        dragAutoScrollTimer = null;
      }
      document.body.classList.remove("cursor-grabbing", "select-none");
      document.querySelectorAll(".group\\/qcard").forEach(c => {
        c.classList.remove(
          "opacity-30", "border-dashed", "border-indigo-500", "bg-indigo-50/50", "scale-[0.98]", "shadow-inner",
          "border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20"
        );
      });
      document.querySelectorAll('[id^="stageCard_"]').forEach(c => {
        c.classList.remove(
          "opacity-30", "border-dashed", "border-indigo-500", "bg-indigo-50/50", "scale-[0.98]", "shadow-inner",
          "border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20"
        );
      });
    }

    function handleQuestionCardDragStart(e, sIdx, fIdx) {
      if (!adminFormSchema?.tahapan[sIdx]?.fields[fIdx]) return;
      draggedQuestionData = { sIdx, fIdx };
      draggedStageIdx = null;
      document.body.classList.add("cursor-grabbing", "select-none");
      startDragAutoScrollLoop();

      const card = document.getElementById(`questionCard_${sIdx}_${fIdx}`);
      if (e && e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'QUESTION', sIdx, fIdx }));
        if (card && e.dataTransfer.setDragImage) {
          const rect = card.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          e.dataTransfer.setDragImage(card, Math.max(15, Math.min(clickX, rect.width - 15)), Math.max(15, Math.min(clickY, 40)));
        }
      }

      if (card) {
        setTimeout(() => {
          card.classList.add("opacity-30", "border-dashed", "border-indigo-500", "bg-indigo-50/50", "scale-[0.98]", "shadow-inner");
        }, 0);
      }
    }

    function handleQuestionCardDragEnd(e) {
      cleanupQuestionDragClasses();
      draggedQuestionData = null;
    }

    function handleQuestionCardDragOver(e, sIdx, fIdx) {
      if (!draggedQuestionData) return;
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.dataTransfer) e.dataTransfer.dropEffect = 'move';

      handleGlobalDragOverForAutoScroll(e);

      const card = document.getElementById(`questionCard_${sIdx}_${fIdx}`);
      if (card) {
        if (draggedQuestionData.sIdx === sIdx && draggedQuestionData.fIdx === fIdx) {
          card.classList.remove("border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
          return;
        }

        const rect = card.getBoundingClientRect();
        const isUpper = e.clientY < (rect.top + rect.height / 2);

        document.querySelectorAll(".group\\/qcard").forEach(c => {
          if (c !== card) {
            c.classList.remove("border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
          }
        });

        if (isUpper) {
          card.classList.remove("border-b-4", "border-b-indigo-600");
          card.classList.add("border-t-4", "border-t-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
        } else {
          card.classList.remove("border-t-4", "border-t-indigo-600");
          card.classList.add("border-b-4", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
        }
      }
    }

    function handleQuestionCardDragEnter(e, sIdx, fIdx) {
      if (!draggedQuestionData) return;
      if (e && e.preventDefault) e.preventDefault();
    }

    function handleQuestionCardDragLeave(e) {
      const target = e?.currentTarget;
      if (target) {
        target.classList.remove("border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
      }
    }

    function handleQuestionCardDrop(e, targetSIdx, targetFIdx) {
      if (e && e.preventDefault) e.preventDefault();
      if (!draggedQuestionData) return;
      const { sIdx: srcSIdx, fIdx: srcFIdx } = draggedQuestionData;

      const srcStage = adminFormSchema?.tahapan[srcSIdx];
      const targetStage = adminFormSchema?.tahapan[targetSIdx];
      if (!srcStage?.fields || !targetStage?.fields) {
        cleanupQuestionDragClasses();
        draggedQuestionData = null;
        return;
      }
      if (!srcStage.fields[srcFIdx]) {
        cleanupQuestionDragClasses();
        draggedQuestionData = null;
        return;
      }

      const targetCard = document.getElementById(`questionCard_${targetSIdx}_${targetFIdx}`);
      let insertFIdx = targetFIdx;
      if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        const isDropAfter = e.clientY >= (rect.top + rect.height / 2);
        if (isDropAfter) {
          insertFIdx = targetFIdx + 1;
        }
      }

      if (srcSIdx === targetSIdx && srcFIdx < insertFIdx) {
        insertFIdx--;
      }

      if (srcSIdx === targetSIdx && srcFIdx === insertFIdx) {
        cleanupQuestionDragClasses();
        draggedQuestionData = null;
        return;
      }

      pushUndoSnapshot('Pindah Urutan Pertanyaan');

      const [movedField] = srcStage.fields.splice(srcFIdx, 1);
      targetStage.fields.splice(insertFIdx, 0, movedField);

      cleanupQuestionDragClasses();
      draggedQuestionData = null;

      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast(`Pertanyaan '${movedField.label || 'tanpa judul'}' berhasil dipindahkan ke Bagian ${targetSIdx + 1} (No. ${insertFIdx + 1})!`, "success");
    }

    // STAGE (BAGIAN) DRAG AND DROP
    function handleStageCardDragStart(e, sIdx) {
      if (!adminFormSchema?.tahapan[sIdx]) return;
      draggedStageIdx = sIdx;
      draggedQuestionData = null;
      document.body.classList.add("cursor-grabbing", "select-none");
      startDragAutoScrollLoop();

      const stageCard = document.getElementById(`stageCard_${sIdx}`);
      if (e && e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'STAGE', sIdx }));
        if (stageCard && e.dataTransfer.setDragImage) {
          const rect = stageCard.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          e.dataTransfer.setDragImage(stageCard, Math.max(20, Math.min(clickX, rect.width - 20)), Math.max(20, Math.min(clickY, 50)));
        }
      }

      if (stageCard) {
        setTimeout(() => {
          stageCard.classList.add("opacity-30", "border-dashed", "border-indigo-500", "bg-indigo-50/50", "scale-[0.98]", "shadow-inner");
        }, 0);
      }
    }

    function handleStageCardDragEnd(e) {
      cleanupQuestionDragClasses();
      draggedStageIdx = null;
    }

    function handleStageCardDragOver(e, sIdx) {
      if (draggedStageIdx === null) return;
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.dataTransfer) e.dataTransfer.dropEffect = 'move';

      handleGlobalDragOverForAutoScroll(e);

      const stageCard = document.getElementById(`stageCard_${sIdx}`);
      if (stageCard) {
        if (draggedStageIdx === sIdx) {
          stageCard.classList.remove("border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
          return;
        }

        const rect = stageCard.getBoundingClientRect();
        const isUpper = e.clientY < (rect.top + rect.height / 2);

        document.querySelectorAll('[id^="stageCard_"]').forEach(sc => {
          if (sc !== stageCard) {
            sc.classList.remove("border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
          }
        });

        if (isUpper) {
          stageCard.classList.remove("border-b-4", "border-b-indigo-600");
          stageCard.classList.add("border-t-4", "border-t-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
        } else {
          stageCard.classList.remove("border-t-4", "border-t-indigo-600");
          stageCard.classList.add("border-b-4", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
        }
      }
    }

    function handleStageCardDragEnter(e, sIdx) {
      if (draggedStageIdx === null) return;
      if (e && e.preventDefault) e.preventDefault();
    }

    function handleStageCardDragLeave(e) {
      const target = e?.currentTarget;
      if (target) {
        target.classList.remove("border-t-4", "border-b-4", "border-t-indigo-600", "border-b-indigo-600", "ring-2", "ring-indigo-400/50", "bg-indigo-50/20");
      }
    }

    function handleStageCardDrop(e, targetSIdx) {
      if (e && e.preventDefault) e.preventDefault();
      if (draggedStageIdx === null) return;

      const tahapan = adminFormSchema?.tahapan;
      if (!tahapan || !tahapan[draggedStageIdx] || !tahapan[targetSIdx]) {
        cleanupQuestionDragClasses();
        draggedStageIdx = null;
        return;
      }

      const targetCard = document.getElementById(`stageCard_${targetSIdx}`);
      let insertSIdx = targetSIdx;
      if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        const isDropAfter = e.clientY >= (rect.top + rect.height / 2);
        if (isDropAfter) {
          insertSIdx = targetSIdx + 1;
        }
      }

      if (draggedStageIdx < insertSIdx) {
        insertSIdx--;
      }

      if (draggedStageIdx === insertSIdx) {
        cleanupQuestionDragClasses();
        draggedStageIdx = null;
        return;
      }

      pushUndoSnapshot('Pindah Urutan Bagian');
      const [movedStage] = tahapan.splice(draggedStageIdx, 1);
      tahapan.splice(insertSIdx, 0, movedStage);

      cleanupQuestionDragClasses();
      draggedStageIdx = null;

      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast(`Bagian '${movedStage.title}' berhasil dipindahkan ke Urutan ${insertSIdx + 1}!`, "success");
    }

    async function deleteField(sIdx, fIdx) {
      const f = adminFormSchema.tahapan[sIdx]?.fields[fIdx];
      if (!f) return;
      const ok = await showAppConfirm({
        title: "Hapus Pertanyaan?",
        message: `Apakah Anda yakin ingin menghapus '${f.label || 'Pertanyaan tanpa judul'}' dari Bagian ${sIdx + 1}?`,
        confirmText: "Ya, Hapus Pertanyaan",
        type: "danger"
      });
      if (!ok) return;

      // Bersihkan media berkas pertanyaan ini dari Google Drive
      if (f.media) {
        cleanupDriveMediaFile(f.media);
      }

      pushUndoSnapshot('Hapus Pertanyaan');
      adminFormSchema.tahapan[sIdx].fields.splice(fIdx, 1);
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast("Pertanyaan berhasil dihapus dan berkas media dibersihkan.", "info");
    }

    // MOVE FIELD ACROSS STAGES
    function openMoveFieldModal(sIdx, fIdx) {
      document.getElementById("move_source_stage_idx").value = sIdx;
      document.getElementById("move_source_field_idx").value = fIdx;
      const sel = document.getElementById("move_target_stage_select");
      sel.innerHTML = "";

      adminFormSchema.tahapan.forEach((t, idx) => {
        sel.innerHTML += `<option value="${idx}" ${idx === sIdx ? 'disabled' : ''}>Tahap ${idx + 1}: ${t.title} ${idx === sIdx ? '(Tahap Saat Ini)' : ''}</option>`;
      });

      document.getElementById("modalMoveFieldStage").classList.remove("hidden");
    }

    function closeMoveFieldModal() {
      document.getElementById("modalMoveFieldStage").classList.add("hidden");
    }

    function handleExecuteMoveField(e) {
      e.preventDefault();
      const sIdx = parseInt(document.getElementById("move_source_stage_idx").value);
      const fIdx = parseInt(document.getElementById("move_source_field_idx").value);
      const targetStageIdx = parseInt(document.getElementById("move_target_stage_select").value);

      if (isNaN(sIdx) || isNaN(fIdx) || isNaN(targetStageIdx) || sIdx === targetStageIdx) return;

      const field = adminFormSchema.tahapan[sIdx].fields.splice(fIdx, 1)[0];
      if (!adminFormSchema.tahapan[targetStageIdx].fields) adminFormSchema.tahapan[targetStageIdx].fields = [];
      adminFormSchema.tahapan[targetStageIdx].fields.push(field);

      closeMoveFieldModal();
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast(`'${field.label}' berhasil dipindahkan ke Tahap ${targetStageIdx + 1}!`, "success");
    }

    // PRESETS & RESET
    function addStagePreset(presetKey) {
      initOrNormalizeFormSchema();
      if (presetKey === 'REFLEKSI_UPLOAD') {
        const newStage = {
          id: "tahap_" + Date.now().toString(36),
          title: "Refleksi & Unggah Dokumen Presentasi",
          description: "Unggah berkas slide PDF materi kelompok dan sampaikan refleksi pembelajaran hari ini.",
          fields: [
            {
              id: "fld_slide_" + Date.now().toString(36),
              label: "Lampiran Dokumen / Slide PPT Materi (PDF)",
              scope: "GLOBAL",
              type: "FILE_UPLOAD",
              required: false,
              description: "Format PDF, PPTX, JPG, PNG (Maks 5 MB)."
            },
            {
              id: "fld_refleksi_" + Date.now().toString(36),
              label: "Kesan & Refleksi Perkuliahan Hari Ini",
              scope: "GLOBAL",
              type: "TEXTAREA",
              required: false,
              description: "Catatan atau evaluasi pengalaman presentasi."
            }
          ]
        };
        adminFormSchema.tahapan.push(newStage);
        showAdminToast("Tahap baru 'Refleksi & Unggah Dokumen' berhasil ditambahkan!", "success");
      } else if (presetKey === 'RUBRIK_QNA') {
        const targetStage = adminFormSchema.tahapan[2] || adminFormSchema.tahapan[adminFormSchema.tahapan.length - 1];
        targetStage.fields.push({
          id: "fld_qna_" + Date.now().toString(36),
          label: "Penguasaan Materi & Sesi Tanya Jawab",
          scope: "PER_KELOMPOK",
          type: "RATING_SCALE",
          minVal: 1,
          maxVal: 5,
          required: true,
          description: "Rubrik kemampuan menjawab pertanyaan audiens."
        });
        showAdminToast("Input 'Rubrik Tanya Jawab' berhasil ditambahkan!", "success");
      }
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
    }

    async function resetToDefaultStandardSchema() {
      if (currentFormId === DEFAULT_PRIMARY_FORM_ID) {
        const ok = await showAppConfirm({
          title: "Reset ke Standar Perkuliahan?",
          message: "Kembalikan formulir ini ke template 4 tahap standar perkuliahan (Nilai Presentasi, Voting & Evaluasi)?",
          confirmText: "Ya, Kembalikan Standar",
          type: "warning"
        });
        if (!ok) return;
        adminFormSchema = getDefaultFormSchema(adminAppConfig);
      } else {
        const ok = await showAppConfirm({
          title: "Kosongkan Formulir?",
          message: "Apakah Anda ingin mengosongkan formulir ini menjadi bersih (0 pertanyaan)?",
          confirmText: "Ya, Kosongkan Formulir",
          type: "warning"
        });
        if (ok) {
          adminFormSchema = getBlankFormSchema();
        } else {
          return;
        }
      }
      recordRevisionSnapshot("Reset Formulir");
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast("Struktur formulir berhasil diperbarui.", "info");
    }

    function triggerAutoSaveSchema() {
      queueSyncTask('config', adminAppConfig);
    }
    // CORE FIELD MODAL CONTROLLERS
    function openEditCoreFieldModal(mode) {
      document.getElementById("core_settings_mode").value = mode;
      const titleEl = document.getElementById("modalCoreSettingsTitle");
      const subEl = document.getElementById("modalCoreSettingsSubtitle");

      const pScore = document.getElementById("core_panel_score");
      const pVoting = document.getElementById("core_panel_voting");
      const pReview = document.getElementById("core_panel_review");
      const pIdentity = document.getElementById("core_panel_identity");

      pScore.classList.add("hidden");
      pVoting.classList.add("hidden");
      pReview.classList.add("hidden");
      pIdentity.classList.add("hidden");

      if (mode === 'SCORE') {
        titleEl.textContent = "Pengaturan Rentang Skor Presentasi";
        subEl.textContent = "Atur batas nilai minimum dan maksimum penilaian kelompok.";
        document.getElementById("core_score_min").value = adminAppConfig["Nilai_Kelompok_Min"] || 50;
        document.getElementById("core_score_max").value = adminAppConfig["Nilai_Kelompok_Max"] || 100;
        pScore.classList.remove("hidden");
      } else if (mode === 'VOTING') {
        titleEl.textContent = "Pengaturan Voting Presentator Terbaik";
        subEl.textContent = "Atur batas maksimal pemateri terbaik yang boleh dipilih.";
        document.getElementById("core_voting_max").value = adminAppConfig["Maksimal_Pilihan_Presentator_Terbaik"] || 2;
        pVoting.classList.remove("hidden");
      } else if (mode === 'REVIEW') {
        titleEl.textContent = "Pengaturan Ulasan Kualitatif Tiap Pemateri";
        subEl.textContent = "Atur panjang karakter, visibilitas ulasan, dan aturan kelompok penyaji.";
        document.getElementById("core_review_max_chars").value = adminAppConfig["Maksimal_Karakter_Evaluasi"] || 500;
        document.getElementById("core_review_public").value = adminAppConfig["Tampilkan_Ulasan_Publik"] || "AKTIF";
        document.getElementById("core_review_penyaji_rule").value = adminAppConfig["Kewajiban_Menilai_Penyaji"] || "BEBAS_PENUH_DI_SESINYA";
        pReview.classList.remove("hidden");
      } else if (mode === 'IDENTITY') {
        titleEl.textContent = "Pengaturan Validasi Domain Email Penilai";
        subEl.textContent = "Tentukan domain email resmi yang diizinkan untuk mengisi form.";
        document.getElementById("core_identity_domains").value = adminAppConfig["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id";
        pIdentity.classList.remove("hidden");
      }

      document.getElementById("modalCoreFieldSettings").classList.remove("hidden");
    }

    function closeCoreFieldSettingsModal() {
      document.getElementById("modalCoreFieldSettings").classList.add("hidden");
    }

    function handleSaveCoreSettings(e) {
      e.preventDefault();
      const mode = document.getElementById("core_settings_mode").value;

      if (mode === 'SCORE') {
        adminAppConfig["Nilai_Kelompok_Min"] = parseInt(document.getElementById("core_score_min").value || 50);
        adminAppConfig["Nilai_Kelompok_Max"] = parseInt(document.getElementById("core_score_max").value || 100);
      } else if (mode === 'VOTING') {
        adminAppConfig["Maksimal_Pilihan_Presentator_Terbaik"] = parseInt(document.getElementById("core_voting_max").value || 2);
      } else if (mode === 'REVIEW') {
        adminAppConfig["Maksimal_Karakter_Evaluasi"] = parseInt(document.getElementById("core_review_max_chars").value || 500);
        adminAppConfig["Tampilkan_Ulasan_Publik"] = document.getElementById("core_review_public").value;
        adminAppConfig["Kewajiban_Menilai_Penyaji"] = document.getElementById("core_review_penyaji_rule").value;
      } else if (mode === 'IDENTITY') {
        adminAppConfig["Domain_Email_Wajib"] = document.getElementById("core_identity_domains").value.trim();
      }

      closeCoreFieldSettingsModal();
      populateConfigFormValues();
          const isFormCurrentlyActive = (currentFormMeta?.status || 'AKTIF') === 'AKTIF';
          updateWorkspaceStatusUI(isFormCurrentlyActive);
      renderUnifiedFormCanvas();
      triggerAutoSaveConfig();
      showAdminToast("Pengaturan komponen formulir berhasil diperbarui (Tersimpan Otomatis).", "success");
    }


    function openAddQuestionModal() {
      document.getElementById("modalQuestionTitle").textContent = "Tambah Pertanyaan Kustom";
      document.getElementById("q_edit_id").value = "";
      document.getElementById("q_label").value = "";
      document.getElementById("q_scope").value = "GLOBAL";
      document.getElementById("q_type").value = "TEXTAREA";
      document.getElementById("q_required").checked = false;
      handleQuestionTypeChange();
      document.getElementById("modalCustomQuestion").classList.remove("hidden");
    }

    function openEditQuestionModal(idx) {
      const q = adminCustomQuestions[idx];
      if (!q) return;
      document.getElementById("modalQuestionTitle").textContent = "Ubah Pertanyaan Kustom";
      document.getElementById("q_edit_id").value = q.id;
      document.getElementById("q_label").value = q.label;
      document.getElementById("q_scope").value = q.scope || "GLOBAL";
      document.getElementById("q_type").value = q.type || "TEXTAREA";
      document.getElementById("q_required").checked = !!q.required;
      if (q.options) document.getElementById("q_options_text").value = q.options.join(", ");
      if (q.minVal) document.getElementById("q_min_val").value = q.minVal;
      if (q.maxVal) document.getElementById("q_max_val").value = q.maxVal;
      handleQuestionTypeChange();
      document.getElementById("modalCustomQuestion").classList.remove("hidden");
    }

    function closeCustomQuestionModal() {
      document.getElementById("modalCustomQuestion").classList.add("hidden");
    }

    function handleQuestionTypeChange() {
      const t = document.getElementById("q_type").value;
      const optBox = document.getElementById("q_options_container");
      const rateBox = document.getElementById("q_rating_container");
      if (t === 'RADIO' || t === 'CHECKBOX') optBox.classList.remove("hidden");
      else optBox.classList.add("hidden");

      if (t === 'RATING_SCALE') rateBox.classList.remove("hidden");
      else rateBox.classList.add("hidden");
    }

    function handleSaveCustomQuestion(e) {
      e.preventDefault();
      const editId = document.getElementById("q_edit_id").value;
      const label = document.getElementById("q_label").value.trim();
      const scope = document.getElementById("q_scope").value;
      const type = document.getElementById("q_type").value;
      const required = document.getElementById("q_required").checked;

      let options = [];
      if (type === 'RADIO' || type === 'CHECKBOX') {
        options = document.getElementById("q_options_text").value
          .split(/[,\n]/)
          .map(s => s.trim())
          .filter(Boolean);
      }

      const minVal = parseInt(document.getElementById("q_min_val").value || 1);
      const maxVal = parseInt(document.getElementById("q_max_val").value || 5);

      const qObj = {
        id: editId || ("fld_" + Date.now().toString(36)),
        label: label,
        scope: scope,
        type: type,
        required: required,
        options: options,
        minVal: minVal,
        maxVal: maxVal
      };

      if (editId) {
        const idx = adminCustomQuestions.findIndex(q => q.id === editId);
        if (idx !== -1) adminCustomQuestions[idx] = qObj;
      } else {
        adminCustomQuestions.push(qObj);
      }

      closeCustomQuestionModal();
      renderCustomQuestionsList();
      triggerAutoSaveConfig();
      showAdminToast("Pertanyaan kustom berhasil disimpan & disinkronkan.", "success");
    }

    function deleteQuestion(idx) {
      adminCustomQuestions.splice(idx, 1);
      renderCustomQuestionsList();
      triggerAutoSaveConfig();
      showAdminToast("Pertanyaan dihapus.", "info");
    }

    function moveQuestion(idx, dir) {
      const target = idx + dir;
      if (target < 0 || target >= adminCustomQuestions.length) return;
      const temp = adminCustomQuestions[idx];
      adminCustomQuestions[idx] = adminCustomQuestions[target];
      adminCustomQuestions[target] = temp;
      renderCustomQuestionsList();
      triggerAutoSaveConfig();
    }

    function addQuestionPreset(presetKey) {
      if (presetKey === 'UPLOAD_SLIDE') {
        adminCustomQuestions.push({
          id: "fld_slide_" + Date.now().toString(36),
          label: "Lampiran Dokumen / Slide Presentasi (PDF)",
          scope: "GLOBAL",
          type: "FILE_UPLOAD",
          required: false,
          allowedTypes: ["pdf", "pptx", "jpg", "png"]
        });
      } else if (presetKey === 'RUBRIK_QNA') {
        adminCustomQuestions.push({
          id: "fld_qna_" + Date.now().toString(36),
          label: "Penguasaan Materi & Tanya Jawab",
          scope: "PER_KELOMPOK",
          type: "RATING_SCALE",
          minVal: 1,
          maxVal: 5,
          required: true
        });
      } else if (presetKey === 'REFLEKSI') {
        adminCustomQuestions.push({
          id: "fld_refleksi_" + Date.now().toString(36),
          label: "Kesan & Refleksi Perkuliahan Hari Ini",
          scope: "GLOBAL",
          type: "TEXTAREA",
          required: false
        });
      }
      renderCustomQuestionsList();
      triggerAutoSaveConfig();
      showAdminToast("Template pertanyaan berhasil ditambahkan!", "success");
    }

    // =========================================================================
    // TAB 3: RESPONSES LIST & SCOPED DELETE
    // =========================================================================
    async function fetchAdminResponsesList(force = false) {
      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      
      // 🚀 Instant SWR Hydration: Tampilkan cache respons seketika (0 ms)
      if (!force && adminResponsesList.length === 0) {
        const cached = localStorage.getItem(`PGSD_CACHE_RESPONSES_${targetForm}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              adminResponsesList = parsed;
              renderAdminResponsesList();
            }
          } catch(e){}
        }
      }

      // ⚡ FAST-PATH: Ambil langsung dari Supabase Database (< 40ms)
      const sb = await ensureSupabaseClient();
      if (sb) {
        try {
          const { data: sbResponses, error: sbErr } = await sb
            .from('pgsd_responses')
            .select('*')
            .eq('form_id', targetForm)
            .order('created_at', { ascending: false });

          if (!sbErr && Array.isArray(sbResponses)) {
            adminResponsesList = sbResponses.map(r => ({
              rowIndex: r.id,
              idRespons: r.id_respons,
              timestamp: new Date(r.created_at).toLocaleString('id-ID'),
              sesi: r.sesi,
              email: r.email,
              namaPenilai: r.nama_penilai,
              peran: r.peran_penilai || "Mahasiswa",
              nim: r.nim_penilai,
              kelompok: r.kelompok_dinilai,
              nilaiKelompok: r.nilai_kelompok,
              best1: r.best_presenter_1,
              best2: r.best_presenter_2,
              evaluasiDetail: JSON.stringify(r.evaluasi_detail || {}),
              customAnswers: JSON.stringify(r.custom_answers || {}),
              status: r.status || "VALID",
              syncedToSheets: r.synced_to_sheets || false,
              syncedAt: r.synced_at
            }));
            try {
              localStorage.setItem(`PGSD_CACHE_RESPONSES_${targetForm}`, JSON.stringify(adminResponsesList));
            } catch(e){}
            renderAdminResponsesList();
            return;
          }
        } catch(err) {
          console.warn("Supabase fetch responses fallback notice:", err);
        }
      }

      // 🛡️ Fallback Standar: Jika Supabase belum memiliki data, baca via Google Apps Script
      const apiUrl = getApiUrl();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${apiUrl}?action=adminGetResponsesList&formId=${encodeURIComponent(targetForm)}&_t=${Date.now()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const res = await response.json();

        if (res.success && Array.isArray(res.responses)) {
          adminResponsesList = res.responses;
          try {
            localStorage.setItem(`PGSD_CACHE_RESPONSES_${targetForm}`, JSON.stringify(adminResponsesList));
          } catch(e){}
          renderAdminResponsesList();
        }
      } catch (e) {
        console.warn("fetchAdminResponsesList timed out or failed:", e);
      }
    }

        // =========================================================================
    // JADWAL AKSES & PELACAK PARTISIPASI MAHASISWA (ATTENDANCE TRACKER)
    // =========================================================================
    let currentAttendanceFilter = 'ALL';

    function handleScheduleToggle(enabled) {
      const container = document.getElementById('scheduleFieldsContainer');
      if (!container) return;
      if (enabled) {
        container.classList.remove('opacity-40', 'pointer-events-none');
      } else {
        container.classList.add('opacity-40', 'pointer-events-none');
      }
    }

    function setAttendanceTrackerFilter(filter) {
      currentAttendanceFilter = filter;
      ['ALL', 'MISSING', 'SUBMITTED'].forEach(f => {
        const btn = document.getElementById(`btnTrackerFilter_${f}`);
        if (btn) {
          if (f === filter) {
            btn.className = "px-2.5 py-1 rounded-lg font-bold bg-white text-zinc-900 shadow-2xs cursor-pointer text-xs transition";
          } else {
            btn.className = "px-2.5 py-1 rounded-lg font-medium text-zinc-500 hover:bg-white/60 cursor-pointer text-xs transition";
          }
        }
      });
      renderAdminAttendanceTracker();
    }

    function getAllRosterStudents() {
      const students = [];
      (adminMasterGroups || []).forEach(g => {
        (g.members || []).forEach(m => {
          students.push({
            nim: (m.nim || "").trim(),
            nama: (m.name || m.nama || "").trim(),
            kelompok: g.name || "Kelompok",
            role: m.status || m.role || 'Anggota'
          });
        });
      });
      return students;
    }

    function renderAdminAttendanceTracker() {
      const listContainer = document.getElementById("attendanceTrackerListContainer");
      if (!listContainer) return;
      listContainer.innerHTML = "";

      const allStudents = getAllRosterStudents();
      const searchQuery = (document.getElementById("trackerSearchInput")?.value || "").trim().toLowerCase();

      let submittedCount = 0;
      let missingCount = 0;

      const studentStatuses = allStudents.map(student => {
        const studentNimClean = student.nim.toLowerCase();
        const studentNamaClean = student.nama.toLowerCase();

        // Find responses sent by this student
        const matchedResponses = (adminResponsesList || []).filter(r => {
          const rNim = (r.nim || "").trim().toLowerCase();
          const rNama = (r.namaPenilai || "").trim().toLowerCase();
          return (rNim && studentNimClean && rNim === studentNimClean) || (rNama && studentNamaClean && rNama === studentNamaClean);
        });

        const isSubmitted = matchedResponses.length > 0;
        if (isSubmitted) submittedCount++;
        else missingCount++;

        return {
          ...student,
          isSubmitted,
          submittedCount: matchedResponses.length,
          ratedGroups: matchedResponses.map(r => r.kelompok)
        };
      });

      // Update counters & progress bar
      const totalStudents = allStudents.length;
      const percent = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

      const elPercent = document.getElementById("trackerParticipationPercent");
      const elCountSub = document.getElementById("trackerCountSubmitted");
      const elCountMis = document.getElementById("trackerCountMissing");
      const elBar = document.getElementById("trackerProgressBar");

      const pillAll = document.getElementById("countPill_ALL");
      const pillMis = document.getElementById("countPill_MISSING");
      const pillSub = document.getElementById("countPill_SUBMITTED");

      if (elPercent) elPercent.textContent = `${percent}%`;
      if (elCountSub) elCountSub.textContent = `🟢 Sudah: ${submittedCount}`;
      if (elCountMis) elCountMis.textContent = `🔴 Belum: ${missingCount}`;
      if (elBar) elBar.style.width = `${percent}%`;

      if (pillAll) pillAll.textContent = totalStudents;
      if (pillMis) pillMis.textContent = missingCount;
      if (pillSub) pillSub.textContent = submittedCount;

      // Filter and render cards
      let visibleStudents = studentStatuses.filter(s => {
        if (currentAttendanceFilter === 'MISSING' && s.isSubmitted) return false;
        if (currentAttendanceFilter === 'SUBMITTED' && !s.isSubmitted) return false;
        if (searchQuery) {
          const text = `${s.nama} ${s.nim} ${s.kelompok}`.toLowerCase();
          if (!text.includes(searchQuery)) return false;
        }
        return true;
      });

      if (visibleStudents.length === 0) {
        listContainer.innerHTML = `
          <div class="col-span-full p-4 text-center text-xs text-zinc-400">
            Tidak ada mahasiswa yang sesuai dengan filter saat ini.
          </div>
        `;
        return;
      }

      visibleStudents.forEach((st, idx) => {
        const card = document.createElement("div");
        card.className = `p-3 rounded-xl border flex items-center justify-between gap-2.5 transition ${st.isSubmitted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-zinc-200 shadow-2xs'}`;

        card.innerHTML = `
          <div class="min-w-0 flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${st.isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${st.isSubmitted ? '✓' : '✕'}
            </span>
            <div class="min-w-0">
              <h5 class="font-bold text-xs text-zinc-900 truncate">${st.nama}</h5>
              <div class="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                <span>${st.nim || '-'}</span>
                <span>•</span>
                <span class="font-sans font-semibold text-zinc-600">${st.kelompok}</span>
              </div>
            </div>
          </div>

          <div class="shrink-0 text-right">
            ${st.isSubmitted 
              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200/80 block">
                  ${st.submittedCount} Nilai
                 </span>`
              : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-200/80 block">
                  Belum
                 </span>`
            }
          </div>
        `;

        listContainer.appendChild(card);
      });
    }

    function copyWhatsAppAttendanceReminder() {
      const allStudents = getAllRosterStudents();
      const missingStudents = allStudents.filter(student => {
        const studentNimClean = student.nim.toLowerCase();
        const studentNamaClean = student.nama.toLowerCase();
        const hasSubmitted = (adminResponsesList || []).some(r => {
          const rNim = (r.nim || "").trim().toLowerCase();
          const rNama = (r.namaPenilai || "").trim().toLowerCase();
          return (rNim && studentNimClean && rNim === studentNimClean) || (rNama && studentNamaClean && rNama === studentNamaClean);
        });
        return !hasSubmitted;
      });

      const judulForm = adminAppConfig["Judul_Form"] || currentFormMeta?.judulForm || "Penilaian Peer-Assessment";
      const mataKuliah = adminAppConfig["Mata_Kuliah"] || currentFormMeta?.mataKuliah || "Mata Kuliah";
      const kelas = adminAppConfig["Kelas"] || currentFormMeta?.kelas || "5E";
      const dosen = adminAppConfig["Dosen_Pengampu"] || currentFormMeta?.dosen || "Dosen Pengampu";

      const deadline = adminAppConfig["Jadwal_Aktif"] && adminAppConfig["Jadwal_Selesai"]
        ? new Date(adminAppConfig["Jadwal_Selesai"]).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WITA'
        : "Segera sebelum perkuliahan berakhir";

      const formUrl = new URL(window.location.href);
      formUrl.pathname = formUrl.pathname.replace(/admin\.html$/i, "index.html");
      if (!formUrl.pathname.endsWith("index.html")) formUrl.pathname = formUrl.pathname.replace(/\/?$/, "/index.html");
      formUrl.search = `?id=${encodeURIComponent(currentFormId || DEFAULT_PRIMARY_FORM_ID)}`;

      let message = `📢 *PENGINGAT PENGISIAN PENILAIAN PEER-ASSESSMENT*
`;
      message += `----------------------------------------
`;
      message += `📖 *Mata Kuliah:* ${mataKuliah}
`;
      message += `🏫 *Kelas:* ${kelas} | *Dosen:* ${dosen}
`;
      message += `📝 *Formulir:* ${judulForm}
`;
      message += `⏱️ *Batas Waktu:* ${deadline}
`;
      message += `----------------------------------------

`;

      if (missingStudents.length === 0) {
        message += `🎉 *Luar biasa!* Seluruh mahasiswa (${allStudents.length} orang) telah menyelesaikan pengisian penilaian peer-assessment. Terima kasih!`;
      } else {
        message += `Berikut daftar *${missingStudents.length} mahasiswa* yang *belum mengisi* formulir penilaian:

`;
        missingStudents.forEach((st, idx) => {
          message += `${idx + 1}. ${st.nama} (${st.nim}) - ${st.kelompok}
`;
        });
        message += `
Mohon rekan-rekan di atas untuk segera mengisi penilaian melalui tautan resmi berikut:
`;
        message += `🔗 *${formUrl.toString()}*

`;
        message += `Terima kasih atas kerja sama dan kedisiplinan rekan-rekan semua. 🙏`;
      }

      navigator.clipboard.writeText(message).then(() => {
        showAdminToast(`Draf pesan WhatsApp (${missingStudents.length} mahasiswa belum mengisi) berhasil disalin!`, "success");
      }).catch(err => {
        const textarea = document.createElement("textarea");
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showAdminToast(`Draf pesan WhatsApp (${missingStudents.length} mahasiswa) berhasil disalin!`, "success");
      });
    }

    function renderAdminResponsesList() {
      const container = document.getElementById("adminResponsesCardsContainer");
      const emptyEl = document.getElementById("emptyAdminResponses");
      container.innerHTML = "";

      const query = (document.getElementById("searchResponseInput")?.value || "").trim().toLowerCase();
      const groupFilter = document.getElementById("filterResponseGroupSelect")?.value || "ALL";
      const roleFilter = document.getElementById("filterResponseRoleSelect")?.value || "ALL";

      let visibleCount = 0;

      adminResponsesList.forEach(r => {
        let isMatch = true;
        if (query) {
          const text = `${r.namaPenilai} ${r.nim} ${r.email} ${r.kelompok}`.toLowerCase();
          if (!text.includes(query)) isMatch = false;
        }
        if (groupFilter !== "ALL" && r.kelompok !== groupFilter) isMatch = false;
        if (roleFilter !== "ALL" && (r.peran || "Mahasiswa") !== roleFilter) isMatch = false;

        if (!isMatch) return;
        visibleCount++;

        const card = document.createElement("div");
        card.className = "bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-3 flex flex-col justify-between";

        const sheetsBadge = r.syncedToSheets 
          ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">✓ Sheets</span>`
          : `<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">⏳ Belum Sinkron</span>`;

        card.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-1 text-[10px] text-zinc-400 font-mono">
              <span>${r.timestamp}</span>
              <div class="flex items-center gap-1">
                ${sheetsBadge}
                <span class="px-1.5 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-700">${r.sesi}</span>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-xs text-zinc-900">${r.namaPenilai}</span>
                <span class="text-[9px] px-1 rounded bg-zinc-100 font-mono text-zinc-600">${r.peran || 'Mahasiswa'}</span>
              </div>
              <p class="text-[10px] text-zinc-400 font-mono">${r.nim || r.email}</p>
            </div>
            <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs flex items-center justify-between">
              <div>
                <span class="text-[10px] text-zinc-400 block">Menilai:</span>
                <span class="font-bold text-zinc-800">${r.kelompok}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-zinc-400 block">Skor:</span>
                <span class="font-mono font-bold text-sm text-indigo-700">${r.nilaiKelompok}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-xs">
            <button 
              type="button" 
              onclick="openAdminResponseDetailModal('${escapeHtml(r.idRespons)}')" 
              class="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <span>🔍 Detail</span>
            </button>
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-zinc-400 font-mono">ID: ${r.idRespons}</span>
              <button type="button" onclick="deleteSingleResponse('${r.idRespons}', ${r.rowIndex})" class="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer" title="Hapus Data Ini">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        `;

        container.appendChild(card);
      });

      if (visibleCount === 0) emptyEl.classList.remove("hidden");
      else emptyEl.classList.add("hidden");
      renderAdminAttendanceTracker();
    }

    function openAdminResponseDetailModal(idRespons) {
      const resp = adminResponsesList.find(r => String(r.idRespons) === String(idRespons));
      if (!resp) return;

      const modal = document.getElementById("modalAdminResponseDetail");
      const body = document.getElementById("adminResponseDetailBody");
      if (!modal || !body) return;

      let customAnsObj = {};
      try {
        customAnsObj = typeof resp.customAnswers === 'string' ? JSON.parse(resp.customAnswers) : (resp.customAnswers || {});
      } catch(e) {
        customAnsObj = {};
      }

      let evalDetailObj = {};
      try {
        evalDetailObj = typeof resp.evaluasiDetail === 'string' ? JSON.parse(resp.evaluasiDetail) : (resp.evaluasiDetail || {});
      } catch(e) {
        evalDetailObj = {};
      }

      let customAnswersHtml = '';
      if (Object.keys(customAnsObj).length > 0) {
        for (let fldId in customAnsObj) {
          const ans = customAnsObj[fldId];
          if (ans !== undefined && ans !== null && ans !== '') {
            let fldDef = null;
            let fldLabel = fldId;
            if (adminFormSchema && Array.isArray(adminFormSchema.tahapan)) {
              for (let stg of adminFormSchema.tahapan) {
                fldDef = (stg.fields || []).find(f => f.id === fldId);
                if (fldDef) { fldLabel = fldDef.label || fldId; break; }
              }
            }

            let displayVal = '';
            if (typeof ans === 'string' && ans.startsWith('data:image/')) {
              displayVal = `
                <div class="mt-1">
                  <img src="${ans}" alt="Tanda Tangan Digital" class="h-16 max-w-[220px] object-contain border border-zinc-200 rounded-xl bg-white p-2 shadow-2xs">
                  <span class="text-[10px] text-zinc-400 font-mono block mt-1">Tanda Tangan Digital Terverifikasi</span>
                </div>
              `;
            } else if (typeof ans === 'object' && !Array.isArray(ans)) {
              const rows = fldDef?.matrixRows || [];
              const items = Object.keys(ans).map(k => {
                const rowName = rows[parseInt(k)] || `Kriteria ${parseInt(k)+1}`;
                return `<div class="text-xs text-zinc-700 py-1 flex items-center justify-between border-b border-zinc-100 last:border-0"><span class="font-medium">${escapeHtml(rowName)}</span> <span class="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">${escapeHtml(ans[k])}</span></div>`;
              }).join('');
              displayVal = `<div class="mt-1.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-0.5">${items}</div>`;
            } else if (Array.isArray(ans)) {
              displayVal = `<span class="font-bold text-zinc-900">${ans.map(escapeHtml).join(', ')}</span>`;
            } else if (String(ans).startsWith('http://') || String(ans).startsWith('https://')) {
              displayVal = `<a href="${escapeHtml(ans)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-mono font-semibold text-xs flex items-center gap-1"><span>${escapeHtml(ans)}</span> <span>↗</span></a>`;
            } else {
              displayVal = `<span class="font-bold text-zinc-900">${escapeHtml(String(ans))}</span>`;
            }

            customAnswersHtml += `
              <div class="p-3.5 rounded-2xl bg-white border border-zinc-200/80 space-y-1">
                <span class="text-[11px] font-bold text-zinc-500 uppercase font-mono">${escapeHtml(fldLabel)}</span>
                <div>${displayVal}</div>
              </div>
            `;
          }
        }
      }

      let evalHtml = '';
      if (Object.keys(evalDetailObj).length > 0) {
        for (let mNim in evalDetailObj) {
          const ulasan = evalDetailObj[mNim];
          evalHtml += `
            <div class="p-3 rounded-xl bg-white border border-zinc-200/70 space-y-1 text-xs">
              <span class="font-semibold text-zinc-800">👤 Mahasiswa / NIM: <span class="font-mono text-zinc-600">${escapeHtml(mNim)}</span></span>
              <p class="text-zinc-700 italic bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 whitespace-pre-wrap">"${escapeHtml(ulasan)}"</p>
            </div>
          `;
        }
      }

      body.innerHTML = `
        <!-- Identitas Penilai & Target -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-3.5 rounded-2xl bg-white border border-zinc-200 space-y-1.5 text-xs">
            <span class="text-[10.5px] font-bold text-zinc-400 uppercase font-mono">Penilai</span>
            <p class="font-bold text-zinc-900 text-sm">${escapeHtml(resp.namaPenilai)}</p>
            <p class="font-mono text-zinc-500 text-[11px]">NIM: ${escapeHtml(resp.nim || '-')} • Peran: ${escapeHtml(resp.peran || 'Mahasiswa')}</p>
            <p class="font-mono text-zinc-500 text-[11px] truncate">${escapeHtml(resp.email || '-')}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 text-xs">
            <span class="text-[10.5px] font-bold text-indigo-700 uppercase font-mono">Kelompok & Nilai</span>
            <p class="font-bold text-indigo-950 text-sm">${escapeHtml(resp.kelompok)}</p>
            <div class="flex items-center gap-2 pt-0.5">
              <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-xs">Skor: ${resp.nilaiKelompok} / 100</span>
              <span class="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium text-[11px]">${escapeHtml(resp.sesi || 'Sesi')}</span>
            </div>
            <p class="text-[11px] text-zinc-500">Waktu: ${escapeHtml(resp.timestamp)}</p>
          </div>
        </div>

        <!-- Ulasan Kualitatif Pemateri -->
        ${evalHtml ? `
          <div class="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200 space-y-2.5">
            <span class="text-[11px] font-bold text-zinc-500 uppercase font-mono">Catatan Ulasan Pemateri</span>
            <div class="space-y-2">${evalHtml}</div>
          </div>
        ` : ''}

        <!-- Rubrik & Pertanyaan Kustom -->
        ${customAnswersHtml ? `
          <div class="space-y-2.5">
            <span class="text-[11px] font-bold text-zinc-500 uppercase font-mono px-1">Jawaban Rubrik & Pertanyaan Tambahan</span>
            <div class="space-y-2">${customAnswersHtml}</div>
          </div>
        ` : ''}
      `;

      modal.classList.remove("hidden");
    }

    function closeAdminResponseDetailModal() {
      const modal = document.getElementById("modalAdminResponseDetail");
      if (modal) modal.classList.add("hidden");
    }

    async function syncUnsyncedResponsesToSheets() {
      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const sb = await ensureSupabaseClient();
      const apiUrl = (currentFormConfig && currentFormConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL") || getApiUrl();

      if (!apiUrl) {
        showAdminToast("Tautan Spreadsheet Webhook belum dikonfigurasi.", "warning");
        return;
      }

      const btn = document.getElementById("btnSyncUnsyncedToSheets");
      if (btn) btn.disabled = true;
      showAdminToast("Memeriksa respons yang belum tersinkron ke Spreadsheet...", "info");

      try {
        let unsyncedList = [];
        if (sb) {
          const { data, error } = await sb
            .from('pgsd_responses')
            .select('*')
            .eq('form_id', targetForm)
            .or('synced_to_sheets.is.null,synced_to_sheets.eq.false');
          if (!error && Array.isArray(data)) {
            unsyncedList = data;
          }
        }

        if (unsyncedList.length === 0) {
          showAdminToast("Seluruh respons sudah tersinkronisasi 100% dengan Google Spreadsheet.", "success");
          if (btn) btn.disabled = false;
          return;
        }

        let successCount = 0;
        for (const r of unsyncedList) {
          const payload = {
            action: "submitAssessment",
            formId: r.form_id,
            peranPenilai: r.peran_penilai || "Mahasiswa",
            nimPenilai: r.nim_penilai || "-",
            email: r.email,
            namaPenilai: r.nama_penilai,
            kelompok: r.kelompok_dinilai,
            sesi: r.sesi,
            nilaiKelompok: r.nilai_kelompok,
            presentatorTerbaik: [r.best_presenter_1, r.best_presenter_2].filter(Boolean),
            evaluasiDetail: r.evaluasi_detail || {},
            customAnswers: r.custom_answers || {},
            driveFolderName: (currentFormConfig && currentFormConfig["Google_Drive_Folder_Name"]) || "https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK"
          };

          try {
            const res = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(payload)
            });
            const resJson = await res.json();
            if (resJson && resJson.success) {
              successCount++;
              if (sb) {
                await sb.from('pgsd_responses').update({
                  synced_to_sheets: true,
                  synced_at: new Date().toISOString()
                }).eq('id', r.id);
              }
            }
          } catch(e) {}
        }

        showAdminToast(`Berhasil menyinkronkan ${successCount} dari ${unsyncedList.length} respons ke Spreadsheet.`, "success");
        fetchAdminResponsesList(true);
      } catch (err) {
        showAdminToast("Sinkronisasi gagal: " + err.message, "error");
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    async function deleteSingleResponse(idRespons, rowIndex) {
      const ok = await showAppConfirm({
        title: "Hapus Respons Penilaian?",
        message: `Hapus respons ID '${idRespons}' secara permanen? Data penilaian ini akan dihapus dari sistem.`,
        confirmText: "Ya, Hapus Respons",
        type: "danger"
      });
      if (!ok) return;
      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const apiUrl = getApiUrl();

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "adminDeleteSingleResponse",
            formId: targetForm,
            idRespons: idRespons,
            rowIndex: rowIndex
          })
        });
        const res = await response.json();
        if (res.success) {
          showAdminToast("Respons berhasil dihapus.", "success");
          fetchAdminResponsesList(true);
        } else {
          showAdminToast("Gagal menghapus: " + res.error, "error");
        }
      } catch (e) {
        showAdminToast("Error koneksi saat menghapus respons.", "error");
      }
    }

    // SCOPED DELETE CONTROLLERS
    function openScopedDeleteModal() {
      populateScopedTargets();
      document.getElementById("inputScopedConfirmKeyword").value = "";
      document.getElementById("btnExecuteScopedDelete").disabled = true;
      document.getElementById("scopedDeleteModal").classList.remove("hidden");
      updateScopedImpactStats();
    }

    function closeScopedDeleteModal() {
      document.getElementById("scopedDeleteModal").classList.add("hidden");
    }

    function populateScopedTargets() {
      const gSel = document.getElementById("scopedTargetGroupSelect");
      const sSel = document.getElementById("scopedTargetSesiSelect");
      gSel.innerHTML = "";
      sSel.innerHTML = "";

      const groups = Array.from(new Set(adminMasterGroups.map(g => g.name))).filter(Boolean);
      groups.forEach(g => {
        gSel.innerHTML += `<option value="${g}">${g}</option>`;
      });

      const sesis = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5", "Minggu 6", "Minggu 7", "Minggu 8", "Minggu 9", "Minggu 10"];
      sesis.forEach(s => {
        sSel.innerHTML += `<option value="${s}">${s}</option>`;
      });
    }

    function handleScopeTypeChange() {
      const val = document.querySelector('input[name="scopedDeleteScopeType"]:checked')?.value;
      const gBox = document.getElementById("scopedTargetGroupContainer");
      const sBox = document.getElementById("scopedTargetSesiContainer");
      if (val === 'KELOMPOK') {
        gBox.classList.remove("hidden");
        sBox.classList.add("hidden");
      } else {
        gBox.classList.add("hidden");
        sBox.classList.remove("hidden");
      }
      updateScopedImpactStats();
    }

    function updateScopedImpactStats() {
      const mode = document.querySelector('input[name="scopedDeleteScopeType"]:checked')?.value || 'KELOMPOK';
      const targetVal = mode === 'KELOMPOK' 
        ? document.getElementById("scopedTargetGroupSelect").value 
        : document.getElementById("scopedTargetSesiSelect").value;

      let matchCount = 0;
      adminResponsesList.forEach(r => {
        if (mode === 'KELOMPOK' && r.kelompok === targetVal) matchCount++;
        else if (mode === 'SESI' && r.sesi === targetVal) matchCount++;
      });

      document.getElementById("scopedMatchingCountBadge").textContent = `${matchCount} Data Cocok`;
    }

    function validateScopedConfirmKeyword(val) {
      const btn = document.getElementById("btnExecuteScopedDelete");
      btn.disabled = val.trim().toUpperCase() !== 'HAPUS';
    }

    async function executeScopedDelete(e) {
      e.preventDefault();
      const mode = document.querySelector('input[name="scopedDeleteScopeType"]:checked')?.value || 'KELOMPOK';
      const targetVal = mode === 'KELOMPOK' 
        ? document.getElementById("scopedTargetGroupSelect").value 
        : document.getElementById("scopedTargetSesiSelect").value;

      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const apiUrl = getApiUrl();

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "adminDeleteScopedResponses",
            formId: targetForm,
            mode: mode,
            targetValue: targetVal
          })
        });
        const res = await response.json();
        if (res.success) {
          closeScopedDeleteModal();
          showAdminToast(res.message || "Respons kategori berhasil dihapus.", "success");
          fetchAdminResponsesList(true);
        } else {
          showAdminToast("Gagal menghapus: " + res.error, "error");
        }
      } catch (err) {
        showAdminToast("Error server saat menghapus.", "error");
      }
    }

    // =========================================================================
    // CREATION WIZARD & SHARE MODAL CONTROLLERS
    // =========================================================================
    function openCreateFormModal() {
      generateRandomWizPin();
      document.getElementById("modalCreateForm").classList.remove("hidden");
    }

    function closeCreateFormModal() {
      document.getElementById("modalCreateForm").classList.add("hidden");
    }

    function generateRandomWizPin() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let pin = "";
      for (let i = 0; i < 4; i++) {
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const pinInput = document.getElementById("wiz_Form_Id");
      if (pinInput) pinInput.value = pin;
      handleWizTitleInput();
    }

    function handleWizTitleInput() {
      const pin = (document.getElementById("wiz_Form_Id")?.value || "").trim().toUpperCase();
      const slugInput = document.getElementById("wiz_Form_Slug");
      if (slugInput) slugInput.value = pin.toLowerCase();
      const preview = document.getElementById("wizUrlPreview");
      if (preview) preview.textContent = `/?id=${pin}`;
    }

    async function handleCreateFormSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById("btnSubmitCreateForm");
      btn.disabled = true;
      btn.innerHTML = `<span>Membuat Formulir...</span>`;

      let customFormId = document.getElementById("wiz_Form_Id")?.value?.trim()?.toUpperCase();
      if (!customFormId) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (let i = 0; i < 4; i++) customFormId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      let customSlug = customFormId.toLowerCase();
      const judulForm = "Penilaian Perkuliahan";
      const mataKuliah = "-";
      const dosen = "-";
      const kelas = "5E";
      const jurusan = "PGSD";
      const sesi = "Minggu 1";
      const rosterOption = document.querySelector('input[name="wizRosterOption"]:checked')?.value || 'empty';

      try {
        // ⚡ FAST-PATH (< 30ms): Simpan langsung ke Supabase PostgreSQL
        const sb = await ensureSupabaseClient();
        if (!sb) throw new Error("Koneksi Supabase belum siap.");

        const newFormRow = {
          form_id: customFormId,
          form_slug: customSlug,
          judul_form: judulForm,
          mata_kuliah: mataKuliah,
          dosen: dosen,
          kelas: kelas,
          jurusan: jurusan,
          sesi_aktif: sesi,
          status: 'AKTIF',
          is_primary: false,
          google_drive_folder: 'https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK'
        };

        const { error: insErr } = await sb.from('pgsd_forms').insert([newFormRow]);
        if (insErr) throw new Error(insErr.message || JSON.stringify(insErr));

        const initialConfig = {
          Judul_Form: judulForm,
          Mata_Kuliah: mataKuliah,
          Dosen_Pengampu: dosen,
          Kelas: kelas,
          Jurusan: jurusan,
          Deskripsi_Form: '',
          Sesi_Minggu_Aktif: sesi,
          Domain_Email_Wajib: 'mhs.ulm.ac.id, ulm.ac.id',
          Nilai_Kelompok_Min: '50',
          Nilai_Kelompok_Max: '100',
          Pembuat_Web_Prefix: 'Dibuat oleh',
          Pembuat_Web_Nama: '',
          Pembuat_Web_Nim: '',
          Tampilkan_Ulasan_Publik: 'AKTIF',
          Kewajiban_Menilai_Penyaji: 'BEBAS_PENUH_DI_SESINYA',
          Maksimal_Karakter_Evaluasi: '500',
          Maksimal_Pilihan_Presentator_Terbaik: '2'
        };

        const initialSchema = getBlankFormSchema();

        await sb.from('pgsd_form_configs').upsert({
          form_id: customFormId,
          config_data: initialConfig,
          schema_data: initialSchema,
          updated_at: new Date().toISOString()
        });

        if (rosterOption === 'clone_default' && Array.isArray(adminMasterGroups) && adminMasterGroups.length > 0) {
          for (let gIdx = 0; gIdx < adminMasterGroups.length; gIdx++) {
            const g = adminMasterGroups[gIdx];
            const { data: gData } = await sb.from('pgsd_groups').insert([{
              form_id: customFormId,
              name: g.name,
              sesi: g.sesi || sesi || "Minggu 1",
              status: g.status || 'AKTIF',
              display_order: gIdx + 1
            }]).select();

            if (gData && gData[0] && Array.isArray(g.members) && g.members.length > 0) {
              const sToInsert = g.members.map((m, mIdx) => ({
                form_id: customFormId,
                group_id: gData[0].id,
                group_name: g.name,
                nim: m.nim || "-",
                name: m.name || `Mahasiswa ${mIdx + 1}`,
                status: m.status || "AKTIF"
              }));
              await sb.from('pgsd_students').insert(sToInsert);
            }
          }
        }

        closeCreateFormModal();
        showAdminToast(`Formulir PIN: ${customFormId} berhasil dibuat! Silakan atur mata kuliah, dosen, dan pertanyaan di sini.`, "success");

        localStorage.setItem(`PGSD_DRAFT_SCHEMA_${customFormId}`, JSON.stringify(initialSchema));
        localStorage.setItem(`PGSD_CACHE_CONFIG_${customFormId}`, JSON.stringify(initialConfig));
        adminFormSchema = initialSchema;

        // Background 2-Way Realtime Sync ke Google Drive & Google Spreadsheet
        const createPayload = {
          action: "adminCreateForm",
          formId: customFormId,
          customFormId: customFormId,
          customSlug: customSlug,
          judulForm: judulForm,
          mataKuliah: mataKuliah,
          dosen: dosen,
          kelas: kelas,
          jurusan: jurusan,
          sesiAktif: sesi,
          driveFolderId: DEFAULT_DRIVE_FOLDER_ID
        };

        if (typeof GOOGLE_SYNC_EDGE_URL !== 'undefined' && GOOGLE_SYNC_EDGE_URL) {
          fetch(GOOGLE_SYNC_EDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createPayload)
          }).then(r => r.json()).then(res => {
            console.log("Cloud Edge form create success:", res);
          }).catch(e => console.warn("Cloud Edge form create notice:", e));
        }

        const apiUrl = getApiUrl();
        if (apiUrl) {
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(createPayload)
          }).catch(e => console.warn("Background sheet sync notice:", e));
        }

        await fetchFormsRegistry(true);
        openFormWorkspace(customFormId);
      } catch (err) {
        showAdminToast("Gagal membuat formulir: " + err.message, "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Buat Formulir Sekarang</span>`;
      }
    }

    // =========================================================================
    // FORM DELETION HANDLERS
    // =========================================================================
    let pendingDeleteFormId = null;

    function openDeleteFormModal(formId, encodedTitle) {
      if (!formId || formId === DEFAULT_PRIMARY_FORM_ID) {
        showAdminToast("Formulir utama (BK 5E) tidak dapat dihapus.", "error");
        return;
      }
      pendingDeleteFormId = formId;
      const decodedTitle = decodeURIComponent(encodedTitle || formId);
      document.getElementById("deleteTargetFormTitle").textContent = `${decodedTitle} (PIN: ${formId})`;
      document.getElementById("checkDeleteGoogleSheets").checked = true;
      document.getElementById("modalDeleteFormConfirm").classList.remove("hidden");
    }

    function closeDeleteFormModal() {
      pendingDeleteFormId = null;
      document.getElementById("modalDeleteFormConfirm").classList.add("hidden");
    }

    async function handleExecuteDeleteForm() {
      if (!pendingDeleteFormId) return;
      const formIdToDelete = pendingDeleteFormId;
      const btn = document.getElementById("btnConfirmExecuteDeleteForm");
      
      btn.disabled = true;
      btn.innerHTML = `<span>Menghapus dari Database...</span>`;

      try {
        // ⚡ FAST-PATH (< 30ms): Hapus langsung di Supabase (Cascade otomatis menghapus configs, groups, students, responses)
        const sb = await ensureSupabaseClient();
        if (sb) {
          const { error: delErr } = await sb.from('pgsd_forms').delete().eq('form_id', formIdToDelete);
          if (delErr) throw new Error(delErr.message);
        }

        // Hapus cache lokal
        localStorage.removeItem(`PGSD_DRAFT_SCHEMA_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_CACHE_FORM_SCHEMA_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_CACHE_CONFIG_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_CACHE_GROUPS_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_CACHE_MASTER_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_CACHE_RESPONSES_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_CACHE_REKAP_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_FORM_DRAFT_${formIdToDelete}`);
        localStorage.removeItem(`PGSD_REVISIONS_${formIdToDelete}`);

        formsRegistryList = formsRegistryList.filter(f => (f.formId || DEFAULT_PRIMARY_FORM_ID) !== formIdToDelete);
        localStorage.setItem("PGSD_CACHE_REGISTRY_FORMS", JSON.stringify(formsRegistryList));

        closeDeleteFormModal();
        showAdminToast(`Formulir '${formIdToDelete}' berhasil dihapus dari Supabase.`, "success");

        // Background forward ke Google Apps Script & Cloud Webhook untuk hapus sheet & folder Drive
        const defaultSheetUrl = DEFAULT_API_URL;
        const customSheetUrl = (adminAppConfig && adminAppConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL");
        const deletePayload = {
          action: "adminDeleteForm",
          formId: formIdToDelete,
          deleteSheets: true,
          deleteDriveFolder: true,
          driveFolderName: DEFAULT_DRIVE_FOLDER_ID,
          driveFolderId: DEFAULT_DRIVE_FOLDER_ID
        };

        // 1. Background forward ke Supabase Edge Function (Google Service Account)
        if (typeof GOOGLE_SYNC_EDGE_URL !== 'undefined' && GOOGLE_SYNC_EDGE_URL) {
          fetch(GOOGLE_SYNC_EDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deletePayload)
          }).then(r => r.json()).then(res => {
            console.log("Cloud Edge form delete success:", res);
          }).catch(e => console.warn("Cloud Edge Function delete notice:", e));
        }

        // 2. Background forward ke Google Apps Script Primary & Custom Webhook jika ada
        if (defaultSheetUrl) {
          fetch(defaultSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(deletePayload)
          }).catch(e => console.warn("Primary sheet delete notice:", e));
        }

        if (customSheetUrl && customSheetUrl !== defaultSheetUrl) {
          fetch(customSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(deletePayload)
          }).catch(e => console.warn("Custom sheet delete notice:", e));
        }

        if (currentFormId === formIdToDelete) {
          returnToMasterHub(true);
        } else {
          renderHubFormsGrid();
        }
      } catch (err) {
        showAdminToast("Gagal menghapus formulir: " + err.message, "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          <span>Ya, Hapus Formulir</span>
        `;
      }
    }

    // RESPONDENT URL RESOLVER (CLEAN & BULLETPROOF FOR PROD / DEV)
    function getRespondentFormUrl(formId, extraParams = {}) {
      const fId = formId || currentFormId || DEFAULT_PRIMARY_FORM_ID;
      let baseUrl = "";
      if (window.location.protocol === 'file:') {
        const path = window.location.pathname.replace(/admin\.html$/i, "index.html");
        baseUrl = `file://${path}`;
      } else {
        const origin = window.location.origin;
        // Strip trailing /admin, /admin.html, /index.html from pathname
        let pathname = window.location.pathname.replace(/\/(admin(\.html)?|index\.html)?$/i, '');
        if (!pathname.endsWith('/')) pathname += '/';
        baseUrl = `${origin}${pathname}`;
      }

      const params = new URLSearchParams();
      params.set('id', fId);
      if (extraParams && typeof extraParams === 'object') {
        for (const [k, v] of Object.entries(extraParams)) {
          if (v !== undefined && v !== null && v !== '') {
            params.set(k, v);
          }
        }
      }
      return `${baseUrl}?${params.toString()}`;
    }

    // SHARE MODAL & QR CODE (Instant 0ms In-Memory Generator)
    function openShareModal(formId) {
      const fId = formId || currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const fullUrl = getRespondentFormUrl(fId);

      document.getElementById("sharePinText").textContent = fId;
      document.getElementById("shareDirectLinkInput").value = fullUrl;

      const qrContainer = document.getElementById("shareQrCodeContainer");
      const imgEl = document.getElementById("shareQrCodeImg");

      // ⚡ INSTANT IN-MEMORY QR CODE RENDERING (< 1ms)
      if (typeof QRCode === "function" && qrContainer) {
        qrContainer.innerHTML = "";
        try {
          new QRCode(qrContainer, {
            text: fullUrl,
            width: 210,
            height: 210,
            colorDark: "#18181b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
        } catch (qrErr) {
          console.warn("Local QRCode engine fallback:", qrErr);
          if (imgEl) {
            imgEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
            qrContainer.appendChild(imgEl);
          }
        }
      } else if (imgEl) {
        imgEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
      }

      document.getElementById("modalShareForm").classList.remove("hidden");
    }

    function closeShareModal() {
      document.getElementById("modalShareForm").classList.add("hidden");
    }

    function copySharePin() {
      const pin = document.getElementById("sharePinText").textContent;
      navigator.clipboard.writeText(pin);
      showAdminToast(`Kode PIN '${pin}' berhasil disalin ke clipboard!`, "success");
    }

    function copyShareDirectLink() {
      const link = document.getElementById("shareDirectLinkInput").value;
      navigator.clipboard.writeText(link);
      showAdminToast("Tautan responden formulir berhasil disalin!", "success");
    }

    function downloadQrCodePng() {
      const qrContainer = document.getElementById("shareQrCodeContainer");
      const pin = document.getElementById("sharePinText").textContent;
      const canvas = qrContainer?.querySelector("canvas");
      const img = qrContainer?.querySelector("img") || document.getElementById("shareQrCodeImg");

      const a = document.createElement("a");
      a.download = `QR-Form-${pin}.png`;

      if (canvas) {
        a.href = canvas.toDataURL("image/png");
        a.click();
      } else if (img && img.src) {
        a.href = img.src;
        a.target = "_blank";
        a.click();
      }
    }

    // CUSTOM / EDIT FORM PIN ID HANDLERS
    let targetChangingFormId = null;

    function promptChangeFormId(targetFormId) {
      const fId = targetFormId || currentFormId || DEFAULT_PRIMARY_FORM_ID;
      targetChangingFormId = fId;
      
      const currentInput = document.getElementById("inputCurrentFormIdDisplay");
      const newInput = document.getElementById("inputNewFormIdValue");
      const errEl = document.getElementById("changeFormIdError");
      
      if (currentInput) currentInput.value = fId;
      if (newInput) {
        newInput.value = fId;
        setTimeout(() => {
          newInput.focus();
          newInput.select();
        }, 150);
      }
      if (errEl) {
        errEl.classList.add("hidden");
        errEl.textContent = "";
      }

      document.getElementById("modalChangeFormId")?.classList.remove("hidden");
    }

    function closeChangeFormIdModal() {
      document.getElementById("modalChangeFormId")?.classList.add("hidden");
      targetChangingFormId = null;
    }

    async function submitChangeFormId() {
      const oldId = targetChangingFormId || currentFormId;
      const newId = (document.getElementById("inputNewFormIdValue")?.value || "").trim().toUpperCase();
      const errEl = document.getElementById("changeFormIdError");
      const btn = document.getElementById("btnSaveNewFormId");

      if (!newId || newId.length < 2) {
        if (errEl) {
          errEl.textContent = "Kode PIN ID minimal 2 karakter!";
          errEl.classList.remove("hidden");
        }
        return;
      }

      if (newId === oldId) {
        closeChangeFormIdModal();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="flex items-center gap-1"><svg class="w-3.5 h-3.5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Menyimpan...</span>';
      }

      try {
        const sb = await ensureSupabaseClient();
        if (sb) {
          // Check if newId already exists in database
          const { data: existing, error: checkErr } = await sb
            .from('pgsd_forms')
            .select('form_id')
            .eq('form_id', newId)
            .maybeSingle();

          if (existing && existing.form_id) {
            if (errEl) {
              errEl.textContent = `Kode PIN '${newId}' sudah digunakan oleh formulir lain. Gunakan kode unik lain.`;
              errEl.classList.remove("hidden");
            }
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = '<span>Simpan Perubahan ID</span>';
            }
            return;
          }

          // Update primary key on pgsd_forms (Cascades to child tables via ON UPDATE CASCADE)
          const { error: updateErr } = await sb
            .from('pgsd_forms')
            .update({ form_id: newId, updated_at: new Date().toISOString() })
            .eq('form_id', oldId);

          if (updateErr) {
            console.error("Supabase form_id update error:", updateErr);
            throw new Error(updateErr.message || "Gagal memperbarui ID di database Supabase.");
          }
        }

        // Migrate local storage cache keys
        const keysToMigrate = [
          `PGSD_CACHE_META_`,
          `PGSD_CACHE_CONFIG_`,
          `PGSD_CACHE_GROUPS_`,
          `PGSD_DRAFT_SCHEMA_`
        ];
        keysToMigrate.forEach(prefix => {
          const oldVal = localStorage.getItem(`${prefix}${oldId}`);
          if (oldVal) {
            localStorage.setItem(`${prefix}${newId}`, oldVal);
            localStorage.removeItem(`${prefix}${oldId}`);
          }
        });

        // Update registry list in memory
        const regIdx = formsRegistryList.findIndex(f => (f.formId || f.form_id) === oldId);
        if (regIdx !== -1) {
          formsRegistryList[regIdx].formId = newId;
          formsRegistryList[regIdx].form_id = newId;
        }

        // If currently in workspace for this form, update currentFormId and UI
        if (currentFormId === oldId) {
          currentFormId = newId;
          if (currentFormMeta) {
            currentFormMeta.formId = newId;
            currentFormMeta.form_id = newId;
          }

          // Update URL
          const url = new URL(window.location);
          url.searchParams.set('id', newId);
          window.history.replaceState({}, '', url);

          // Update Header Badges
          const badge = document.getElementById("activeFormIdBadge");
          if (badge) {
            const spanText = badge.querySelector('span');
            if (spanText) spanText.textContent = `ID: ${newId}`;
            else badge.textContent = `ID: ${newId}`;
          }
          if (document.getElementById("headerSubTitle")) {
            document.getElementById("headerSubTitle").textContent = `Mengelola Form PIN: ${newId}`;
          }

          // Update Share Modal if open
          const sharePin = document.getElementById("sharePinText");
          if (sharePin) sharePin.textContent = newId;
          const shareLink = document.getElementById("shareDirectLinkInput");
          if (shareLink) {
            const fullUrl = getRespondentFormUrl(newId);
            shareLink.value = fullUrl;
            const qrContainer = document.getElementById("shareQrCodeContainer");
            if (typeof QRCode === "function" && qrContainer) {
              qrContainer.innerHTML = "";
              try {
                new QRCode(qrContainer, {
                  text: fullUrl,
                  width: 210,
                  height: 210,
                  colorDark: "#18181b",
                  colorLight: "#ffffff",
                  correctLevel: QRCode.CorrectLevel.M
                });
              } catch (e) {}
            } else {
              const qrImg = document.getElementById("shareQrCodeImg");
              if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
            }
          }

          const btnBuka = document.getElementById("btnBukaFormActive");
          if (btnBuka) btnBuka.href = getRespondentFormUrl(newId);
        }

        renderHubFormsGrid();
        closeChangeFormIdModal();
        showAdminToast(`Kode PIN formulir berhasil diubah menjadi '${newId}'!`, "success");

      } catch (err) {
        console.error("Change form id error:", err);
        if (errEl) {
          errEl.textContent = err.message || "Gagal mengubah ID formulir.";
          errEl.classList.remove("hidden");
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>Simpan Perubahan ID</span>';
        }
      }
    }

    async function cloneFormAction(sourceFormId) {
      const ok = await showAppConfirm({
        title: "Salin Formulir?",
        message: `Salin susunan kelompok & pengaturan dari form '${sourceFormId}' ke formulir baru?`,
        confirmText: "Ya, Salin Form",
        type: "info"
      });
      if (!ok) return;

      try {
        const sb = await ensureSupabaseClient();
        if (!sb) throw new Error("Koneksi Supabase belum siap.");

        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let newPin = "";
        for (let i = 0; i < 4; i++) newPin += chars.charAt(Math.floor(Math.random() * chars.length));

        const [srcFormRes, srcConfigRes, srcGroupsRes, srcStudentsRes] = await Promise.all([
          sb.from('pgsd_forms').select('*').eq('form_id', sourceFormId).single(),
          sb.from('pgsd_form_configs').select('*').eq('form_id', sourceFormId).single(),
          sb.from('pgsd_groups').select('*').eq('form_id', sourceFormId).order('display_order', { ascending: true }),
          sb.from('pgsd_students').select('*').eq('form_id', sourceFormId)
        ]);

        const srcForm = srcFormRes.data;
        const srcConfig = srcConfigRes.data;
        const srcGroups = srcGroupsRes.data || [];
        const srcStudents = srcStudentsRes.data || [];

        const newJudul = `Salinan ${srcForm?.judul_form || sourceFormId}`;

        await sb.from('pgsd_forms').insert([{
          form_id: newPin,
          form_slug: newPin.toLowerCase(),
          judul_form: newJudul,
          mata_kuliah: srcForm?.mata_kuliah || "Mata Kuliah",
          dosen: srcForm?.dosen || "-",
          kelas: srcForm?.kelas || "-",
          jurusan: srcForm?.jurusan || "PGSD",
          sesi_aktif: srcForm?.sesi_aktif || "Minggu 1",
          status: 'AKTIF',
          is_primary: false,
          google_drive_folder: srcForm?.google_drive_folder || 'https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK'
        }]);

        const initialBlankSchema = srcConfig?.schema_data || getBlankFormSchema();
        await sb.from('pgsd_form_configs').upsert({
          form_id: newPin,
          config_data: srcConfig?.config_data || {},
          schema_data: initialBlankSchema,
          updated_at: new Date().toISOString()
        });

        if (srcGroups.length > 0) {
          for (let g of srcGroups) {
            const { data: insertedG } = await sb.from('pgsd_groups').insert([{
              form_id: newPin,
              name: g.name,
              sesi: g.sesi,
              status: g.status,
              display_order: g.display_order
            }]).select();

            if (insertedG && insertedG[0]) {
              const grpStudents = srcStudents.filter(s => s.group_id === g.id);
              const sToInsert = grpStudents.map(s => ({
                form_id: newPin,
                group_id: insertedG[0].id,
                group_name: g.name,
                nim: s.nim,
                name: s.name,
                status: s.status
              }));
              if (sToInsert.length > 0) {
                await sb.from('pgsd_students').insert(sToInsert);
              }
            }
          }
        }

        // Background 2-Way Realtime Sync ke Google Drive & Google Spreadsheet
        const clonePayload = {
          action: "adminCloneForm",
          formId: newPin,
          sourceFormId: sourceFormId,
          judulForm: newJudul,
          driveFolderId: DEFAULT_DRIVE_FOLDER_ID
        };

        if (typeof GOOGLE_SYNC_EDGE_URL !== 'undefined' && GOOGLE_SYNC_EDGE_URL) {
          fetch(GOOGLE_SYNC_EDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clonePayload)
          }).then(r => r.json()).then(res => {
            console.log("Cloud Edge form clone success:", res);
          }).catch(e => console.warn("Cloud Edge form clone notice:", e));
        }

        const apiUrl = getApiUrl();
        if (apiUrl) {
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(clonePayload)
          }).catch(e => console.warn("Background sheet sync notice:", e));
        }

        showAdminToast(`Formulir '${sourceFormId}' berhasil diduplikasi ke PIN: ${newPin}!`, "success");
        localStorage.setItem(`PGSD_DRAFT_SCHEMA_${newPin}`, JSON.stringify(initialBlankSchema));
        adminFormSchema = initialBlankSchema;

        await fetchFormsRegistry(true);
        openFormWorkspace(newPin);
      } catch (e) {
        showAdminToast("Error saat kloning form: " + e.message, "error");
      }
    }

    // =========================================================================
    // MODAL DIALOG CONTROLLERS (MEMBER, GROUP, BATCH, PRINT, RESET)
    // =========================================================================
    function openAddGroupModal() {
      document.getElementById("modalGroupTitle").textContent = "Tambah Kelompok Baru";
      document.getElementById("editGroupIndex").value = "-1";
      document.getElementById("inputGroupName").value = `Kelompok ${adminMasterGroups.length + 1}`;
      document.getElementById("selectGroupSesi").value = adminAppConfig["Sesi_Minggu_Aktif"] || "Minggu 1";
      document.getElementById("selectGroupStatus").value = "AKTIF";
      document.getElementById("modalEditGroup").classList.remove("hidden");
    }

    function openEditGroupModal(gIdx) {
      const g = adminMasterGroups[gIdx];
      if (!g) return;
      document.getElementById("modalGroupTitle").textContent = "Ubah Kelompok";
      document.getElementById("editGroupIndex").value = gIdx;
      document.getElementById("inputGroupName").value = g.name;
      document.getElementById("selectGroupSesi").value = g.sesi;
      document.getElementById("selectGroupStatus").value = g.status || "AKTIF";
      document.getElementById("modalEditGroup").classList.remove("hidden");
    }

    function closeGroupModal() {
      document.getElementById("modalEditGroup").classList.add("hidden");
    }

    function handleSaveGroup(e) {
      e.preventDefault();
      const gIdx = parseInt(document.getElementById("editGroupIndex").value);
      const name = document.getElementById("inputGroupName").value.trim();
      const sesi = document.getElementById("selectGroupSesi").value;
      const status = document.getElementById("selectGroupStatus").value;

      if (gIdx >= 0) {
        adminMasterGroups[gIdx].name = name;
        adminMasterGroups[gIdx].sesi = sesi;
        adminMasterGroups[gIdx].status = status;
      } else {
        adminMasterGroups.push({ name: name, sesi: sesi, status: status, members: [] });
      }

      closeGroupModal();
      renderMasterGroups();
      triggerAutoSaveMasterData();
      showAdminToast("Data kelompok berhasil disimpan (Tersimpan Otomatis).", "success");
    }

    async function deleteGroup(gIdx) {
      const grp = adminMasterGroups[gIdx];
      if (!grp) return;
      const ok = await showAppConfirm({
        title: "Hapus Kelompok?",
        message: `Hapus '${grp.name}' beserta seluruh anggotanya?`,
        confirmText: "Ya, Hapus Kelompok",
        type: "danger"
      });
      if (!ok) return;
      adminMasterGroups.splice(gIdx, 1);
      renderMasterGroups();
      triggerAutoSaveMasterData();
      showAdminToast("Kelompok berhasil dihapus.", "info");
    }

    function openAddMemberModal(gIdx) {
      document.getElementById("modalMemberTitle").textContent = `Tambah Mahasiswa ke ${adminMasterGroups[gIdx].name}`;
      document.getElementById("editMemberGroupIndex").value = gIdx;
      document.getElementById("editMemberIndex").value = "-1";
      document.getElementById("inputMemberName").value = "";
      document.getElementById("inputMemberNim").value = "";
      document.getElementById("selectMemberStatus").value = "AKTIF";
      document.getElementById("modalEditMember").classList.remove("hidden");
    }

    function openEditMemberModal(gIdx, mIdx) {
      const m = adminMasterGroups[gIdx]?.members[mIdx];
      if (!m) return;
      document.getElementById("modalMemberTitle").textContent = "Ubah Data Mahasiswa";
      document.getElementById("editMemberGroupIndex").value = gIdx;
      document.getElementById("editMemberIndex").value = mIdx;
      document.getElementById("inputMemberName").value = m.name;
      document.getElementById("inputMemberNim").value = m.nim || "";
      document.getElementById("selectMemberStatus").value = m.status || "AKTIF";
      document.getElementById("modalEditMember").classList.remove("hidden");
    }

    function closeMemberModal() {
      document.getElementById("modalEditMember").classList.add("hidden");
    }

    function handleSaveMember(e) {
      e.preventDefault();
      const gIdx = parseInt(document.getElementById("editMemberGroupIndex").value);
      const mIdx = parseInt(document.getElementById("editMemberIndex").value);
      const name = document.getElementById("inputMemberName").value.trim();
      const nim = document.getElementById("inputMemberNim").value.trim();
      const status = document.getElementById("selectMemberStatus").value;

      if (!adminMasterGroups[gIdx].members) adminMasterGroups[gIdx].members = [];

      if (mIdx >= 0) {
        adminMasterGroups[gIdx].members[mIdx] = { name: name, nim: nim, status: status };
      } else {
        adminMasterGroups[gIdx].members.push({ name: name, nim: nim, status: status });
      }

      closeMemberModal();
      renderMasterGroups();
      triggerAutoSaveMasterData();
      showAdminToast("Data mahasiswa berhasil disimpan.", "success");
    }

    function deleteMember(gIdx, mIdx) {
      adminMasterGroups[gIdx].members.splice(mIdx, 1);
      renderMasterGroups();
      triggerAutoSaveMasterData();
      showAdminToast("Mahasiswa dihapus dari kelompok.", "info");
    }

    // =========================================================================
    // 👥 ADVANCED MULTI-SOURCE GROUP & STUDENT IMPORT ENGINE
    // =========================================================================
    let activeBatchImportTab = 'from_form';
    let loadedSourceFormGroups = [];
    let customGeneratedGroups = [];

    function switchBatchImportTab(tab) {
      activeBatchImportTab = tab;
      const tabs = ['from_form', 'custom_distribute', 'text_excel'];
      tabs.forEach(t => {
        const btn = document.getElementById('tabBtnImport_' + (t === 'from_form' ? 'form' : (t === 'custom_distribute' ? 'custom' : 'excel')));
        const panel = document.getElementById('importPanel_' + t);
        if (t === tab) {
          if (btn) {
            btn.className = "py-2 px-2 rounded-lg bg-white text-zinc-900 shadow-2xs text-center transition cursor-pointer font-bold";
          }
          if (panel) panel.classList.remove("hidden");
        } else {
          if (btn) {
            btn.className = "py-2 px-2 rounded-lg text-zinc-500 hover:text-zinc-900 text-center transition cursor-pointer";
          }
          if (panel) panel.classList.add("hidden");
        }
      });
    }

    function openBatchGroupModal() {
      // 1. Reset text inputs
      document.getElementById("batchInputText").value = "";
      document.getElementById("customMhsListInput").value = "";
      document.getElementById("customMhsCountBadge").textContent = "0 Mahasiswa";
      document.getElementById("batchStatSummary").textContent = "Terdeteksi: 0 Kelompok, 0 Mahasiswa";
      document.getElementById("batchStatValid").textContent = "Status: Menunggu input";

      // 2. Populate Source Form dropdown
      const select = document.getElementById("selectSourceFormToImport");
      if (select) {
        select.innerHTML = '<option value="">Pilih Formulir Sumber...</option>';
        formsRegistryList.forEach(f => {
          if (f.formId !== currentFormId) {
            const opt = document.createElement("option");
            opt.value = f.formId;
            opt.textContent = `${f.formId} • ${f.judulForm || 'Formulir'} (${f.mataKuliah || '-'} - ${f.kelas || '-'})`;
            select.appendChild(opt);
          }
        });
      }

      document.getElementById("sourceFormGroupsPreviewContainer")?.classList.add("hidden");
      switchBatchImportTab('from_form');
      document.getElementById("modalBatchGroup").classList.remove("hidden");
    }

    function closeBatchGroupModal() {
      document.getElementById("modalBatchGroup").classList.add("hidden");
    }

    async function handleSourceFormSelectionChange(sourceFormId) {
      const previewBox = document.getElementById("sourceFormGroupsPreviewContainer");
      const listContainer = document.getElementById("sourceFormGroupsChecklist");
      const countLabel = document.getElementById("sourceFormGroupsCountLabel");
      if (!sourceFormId) {
        if (previewBox) previewBox.classList.add("hidden");
        loadedSourceFormGroups = [];
        return;
      }

      loadedSourceFormGroups = [];
      let rawGroups = null;

      // 1. Try LocalStorage cache
      try {
        const cached = localStorage.getItem("PGSD_CACHE_GROUPS_" + sourceFormId);
        if (cached) rawGroups = JSON.parse(cached);
      } catch(e){}

      // 2. Try Supabase
      if (!rawGroups || rawGroups.length === 0) {
        try {
          const sb = getSupabaseClient();
          if (sb) {
            const { data } = await sb.from('pgsd_groups').select('*').eq('form_id', sourceFormId).order('display_order', { ascending: true });
            if (data && data.length > 0) rawGroups = data;
          }
        } catch(e){}
      }

      if (!rawGroups || rawGroups.length === 0) {
        showAdminToast("Formulir ini belum memiliki data kelompok.", "warning");
        if (previewBox) previewBox.classList.add("hidden");
        return;
      }

      loadedSourceFormGroups = rawGroups.map(g => {
        const parsedMembers = Array.isArray(g.members) ? g.members : (typeof g.members === 'string' ? JSON.parse(g.members || '[]') : []);
        return {
          id: g.id || "grp_" + Math.random().toString(36).substring(2, 8),
          name: g.name || g.nama_kelompok || "Kelompok",
          sesi: g.sesi || "Minggu 1",
          status: g.status || "AKTIF",
          members: parsedMembers
        };
      });

      renderSourceFormGroupsChecklist();
      if (previewBox) previewBox.classList.remove("hidden");
    }

    function renderSourceFormGroupsChecklist() {
      const listContainer = document.getElementById("sourceFormGroupsChecklist");
      const countLabel = document.getElementById("sourceFormGroupsCountLabel");
      if (!listContainer) return;

      let totalMhs = 0;
      loadedSourceFormGroups.forEach(g => { totalMhs += (g.members || []).length; });
      if (countLabel) countLabel.textContent = `Ditemukan ${loadedSourceFormGroups.length} Kelompok (${totalMhs} Mahasiswa):`;

      listContainer.innerHTML = loadedSourceFormGroups.map((g, idx) => `
        <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 hover:bg-indigo-50/60 border border-zinc-200 cursor-pointer transition">
          <div class="flex items-center gap-2.5 min-w-0">
            <input type="checkbox" class="source-group-checkbox w-4 h-4 text-indigo-600 rounded cursor-pointer" data-idx="${idx}" checked>
            <div class="truncate">
              <span class="font-bold text-zinc-900 block truncate">${escapeHtml(g.name)}</span>
              <span class="text-[10px] text-zinc-500 font-mono">${escapeHtml(g.sesi)} • ${(g.members||[]).length} Mahasiswa</span>
            </div>
          </div>
          <span class="text-[10.5px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold shrink-0">
            ${(g.members||[]).length} Mhs
          </span>
        </label>
      `).join('');
    }

    function toggleSelectAllSourceGroups(selectAll) {
      document.querySelectorAll('.source-group-checkbox').forEach(cb => {
        cb.checked = selectAll;
      });
    }

    // CUSTOM DISTRIBUTION ENGINE
    function handleDistributeModeChange() {
      const mode = document.querySelector('input[name="customDistributeMode"]:checked')?.value || 'N_GROUPS';
      const boxN = document.getElementById("paramBoxNumGroups");
      const boxPer = document.getElementById("paramBoxPerGroupCount");
      const boxSingle = document.getElementById("paramBoxSingleGroup");

      if (boxN) boxN.classList.toggle("hidden", mode !== 'N_GROUPS');
      if (boxPer) boxPer.classList.toggle("hidden", mode !== 'PER_GROUP_COUNT');
      if (boxSingle) boxSingle.classList.toggle("hidden", mode !== 'SINGLE_GROUP');

      generateCustomDistributionPreview();
    }

    function parseCustomStudentsList() {
      const text = document.getElementById("customMhsListInput")?.value || "";
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const students = [];

      lines.forEach(l => {
        let nim = "";
        let name = "";
        if (l.includes("\t")) {
          const parts = l.split("\t").map(p => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            nim = parts[0];
            name = parts.slice(1).join(" ");
          } else {
            name = parts[0] || "";
          }
        } else if (l.includes(",")) {
          const parts = l.split(",").map(p => p.trim()).filter(Boolean);
          nim = parts[0];
          name = parts.slice(1).join(" ");
        } else if (l.includes("/")) {
          const parts = l.split("/").map(p => p.trim()).filter(Boolean);
          nim = parts[0];
          name = parts.slice(1).join(" ");
        } else {
          // Space separated: check if first word is digits (NIM)
          const parts = l.split(/\s+/);
          if (/^\d{6,}/.test(parts[0])) {
            nim = parts[0];
            name = parts.slice(1).join(" ");
          } else {
            name = l;
          }
        }

        if (name || nim) {
          students.push({ nim: nim, name: name || nim, status: "AKTIF" });
        }
      });

      return students;
    }

    function handleCustomMhsInputLive() {
      const students = parseCustomStudentsList();
      const badge = document.getElementById("customMhsCountBadge");
      if (badge) badge.textContent = `${students.length} Mahasiswa`;
      generateCustomDistributionPreview();
    }

    function generateCustomDistributionPreview() {
      let students = parseCustomStudentsList();
      const previewList = document.getElementById("customDistributionResultList");
      if (!previewList) return;

      if (students.length === 0) {
        customGeneratedGroups = [];
        previewList.innerHTML = '<p class="text-[11px] text-zinc-400 italic text-center py-2">Masukkan daftar mahasiswa di atas untuk melihat pembagian kelompok.</p>';
        return;
      }

      // Shuffle if checked
      const shouldShuffle = document.getElementById("checkShuffleMhs")?.checked;
      if (shouldShuffle) {
        students = [...students].sort(() => Math.random() - 0.5);
      }

      const mode = document.querySelector('input[name="customDistributeMode"]:checked')?.value || 'N_GROUPS';
      const prefix = (document.getElementById("inputParamGroupPrefix")?.value || "Kelompok").trim();
      const sesi = (document.getElementById("inputParamGroupSesi")?.value || "Minggu 1").trim();

      const groups = [];

      if (mode === 'SINGLE_GROUP') {
        const gName = (document.getElementById("inputParamSingleGroupName")?.value || "Kelompok 1").trim();
        groups.push({
          id: "grp_" + Math.random().toString(36).substring(2, 8),
          name: gName,
          sesi: sesi,
          status: "AKTIF",
          members: students
        });
      } else if (mode === 'PER_GROUP_COUNT') {
        const perCount = Math.max(1, parseInt(document.getElementById("inputParamPerGroupCount")?.value || 4));
        let gIdx = 1;
        for (let i = 0; i < students.length; i += perCount) {
          const chunk = students.slice(i, i + perCount);
          groups.push({
            id: "grp_" + Math.random().toString(36).substring(2, 8),
            name: `${prefix} ${gIdx}`,
            sesi: sesi,
            status: "AKTIF",
            members: chunk
          });
          gIdx++;
        }
      } else {
        // N_GROUPS
        const numGroups = Math.max(1, parseInt(document.getElementById("inputParamNumGroups")?.value || 6));
        for (let i = 0; i < numGroups; i++) {
          groups.push({
            id: "grp_" + Math.random().toString(36).substring(2, 8),
            name: `${prefix} ${i + 1}`,
            sesi: sesi,
            status: "AKTIF",
            members: []
          });
        }
        students.forEach((s, idx) => {
          groups[idx % numGroups].members.push(s);
        });
      }

      customGeneratedGroups = groups;

      previewList.innerHTML = groups.map(g => `
        <div class="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
          <div class="flex items-center justify-between font-bold text-zinc-900 text-xs">
            <span>${escapeHtml(g.name)} (${escapeHtml(g.sesi)})</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">${g.members.length} Anggota</span>
          </div>
          <div class="text-[11px] text-zinc-600 space-y-0.5 pl-1">
            ${g.members.map((m, mIdx) => `
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-zinc-400 font-mono text-[9.5px]">${mIdx + 1}.</span>
                <span class="font-semibold text-zinc-800">${escapeHtml(m.name)}</span>
                ${m.nim ? `<span class="text-zinc-400 font-mono text-[10px]">(${escapeHtml(m.nim)})</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    // UNIVERSAL SUBMIT DISPATCHER
    function submitActiveBatchImport() {
      const mode = document.querySelector('input[name="batchMode"]:checked')?.value || 'append';
      let groupsToImport = [];

      if (activeBatchImportTab === 'from_form') {
        const checkboxes = document.querySelectorAll('.source-group-checkbox:checked');
        if (checkboxes.length === 0) {
          showAdminToast("Pilih minimal satu kelompok untuk disalin.", "warning");
          return;
        }
        checkboxes.forEach(cb => {
          const idx = parseInt(cb.getAttribute('data-idx'));
          if (loadedSourceFormGroups[idx]) {
            groupsToImport.push(JSON.parse(JSON.stringify(loadedSourceFormGroups[idx])));
          }
        });
      } else if (activeBatchImportTab === 'custom_distribute') {
        if (customGeneratedGroups.length === 0) {
          showAdminToast("Masukkan daftar mahasiswa terlebih dahulu.", "warning");
          return;
        }
        groupsToImport = JSON.parse(JSON.stringify(customGeneratedGroups));
      } else {
        // text_excel
        const text = document.getElementById("batchInputText")?.value || "";
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        const groupsMap = {};

        lines.forEach(line => {
          const parts = line.includes("\t") ? line.split("\t") : line.split("/");
          if (parts.length >= 2) {
            const gName = parts[0].trim();
            const sesi = parts.length >= 4 ? parts[1].trim() : "Minggu 1";
            const nim = parts.length >= 4 ? parts[2].trim() : (parts.length === 3 ? parts[1].trim() : "");
            const name = parts.length >= 4 ? parts[3].trim() : (parts.length === 3 ? parts[2].trim() : parts[1].trim());

            if (gName && name) {
              if (!groupsMap[gName]) groupsMap[gName] = { name: gName, sesi: sesi, status: "AKTIF", members: [] };
              groupsMap[gName].members.push({ name: name, nim: nim, status: "AKTIF" });
            }
          }
        });
        groupsToImport = Object.keys(groupsMap).map(k => groupsMap[k]);
      }

      if (groupsToImport.length === 0) {
        showAdminToast("Tidak ada data valid untuk diimpor.", "warning");
        return;
      }

      if (mode === 'overwrite') {
        adminMasterGroups = groupsToImport;
      } else {
        groupsToImport.forEach(newG => {
          const existing = adminMasterGroups.find(g => g.name.toLowerCase() === newG.name.toLowerCase());
          if (existing) {
            newG.members.forEach(m => {
              const alreadyHas = existing.members.some(em => (em.nim && em.nim === m.nim) || em.name.toLowerCase() === m.name.toLowerCase());
              if (!alreadyHas) existing.members.push(m);
            });
          } else {
            adminMasterGroups.push(newG);
          }
        });
      }

      closeBatchGroupModal();
      renderMasterGroups();
      triggerAutoSaveMasterData();
      showAdminToast(`Berhasil mengimpor ${groupsToImport.length} kelompok!`, "success");
    }

    // TOAST HELPER
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
          btnOk.onclick = null;
          btnCancel.onclick = null;
        };

        btnOk.onclick = () => {
          cleanup();
          resolve(true);
        };

        btnCancel.onclick = () => {
          cleanup();
          resolve(false);
        };

        modal.classList.remove("hidden");
      });
    }

    function showAdminToast(msg, type = "info") {
      const container = document.getElementById("floatingToastContainer");
      if (!container) return;

      const toast = document.createElement("div");
      const colors = {
        success: "bg-emerald-950/90 text-emerald-200 border-emerald-700",
        error: "bg-rose-950/90 text-rose-200 border-rose-700",
        warning: "bg-amber-950/90 text-amber-200 border-amber-700",
        info: "bg-zinc-900/90 text-zinc-100 border-zinc-700"
      };

      toast.className = `px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 pointer-events-auto toast-enter ${colors[type] || colors.info}`;
      toast.textContent = msg;

      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.remove("toast-enter");
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    }

    // REALTIME SYNC
    let adminRealtimeTimer = null;
    function initAdminRealtimeSync() {
      if (adminRealtimeTimer) clearInterval(adminRealtimeTimer);
      adminRealtimeTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine && !isSyncingQueue) {
          if (currentFormId) {
            const activeTab = localStorage.getItem("PGSD_ADMIN_ACTIVE_TAB") || "data";
            if (activeTab === 'responses') fetchAdminResponsesList(true);
          } else {
            fetchFormsRegistry(true);
          }
        }
      }, 30000);
    }

    function populateMasterSesiFilter() {
      const s = document.getElementById("filterMasterSesiSelect");
      if (!s) return;
      s.innerHTML = '<option value="ALL">Semua Sesi Minggu</option>';
      const sesis = Array.from(new Set(adminMasterGroups.map(g => g.sesi))).filter(Boolean);
      sesis.forEach(ses => {
        s.innerHTML += `<option value="${ses}">${ses}</option>`;
      });
    }

    function populateResponseGroupFilter() {
      const s = document.getElementById("filterResponseGroupSelect");
      if (!s) return;
      s.innerHTML = '<option value="ALL">Semua Kelompok Dinilai</option>';
      const grps = Array.from(new Set(adminMasterGroups.map(g => g.name))).filter(Boolean);
      grps.forEach(g => {
        s.innerHTML += `<option value="${g}">${g}</option>`;
      });
    }

    function openResetConfirmModal() {
      document.getElementById("modalResetConfirm").classList.remove("hidden");
    }

    function closeResetConfirmModal() {
      document.getElementById("modalResetConfirm").classList.add("hidden");
    }

    async function executeResetResponses() {
      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      try {
        // 1. Kosongkan respons di basis data utama Supabase
        const sb = await ensureSupabaseClient();
        if (sb) {
          await sb.from('pgsd_responses').delete().eq('form_id', targetForm);
        }

        // 2. Bersihkan berkas lampiran mahasiswa di Supabase Storage
        fetch(`https://eychjnqmqpxzxukiwbqf.supabase.co/storage/v1/object/pgsd-media`, {
          method: "DELETE",
          headers: {
            apikey: "sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
            Authorization: "Bearer sb_publishable__vL9IPWnyC8uJRSQYLN_yg_qDHDflEp",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ prefixes: [`${targetForm}/lampiran_`] })
        }).catch(e => console.warn("Notice cleaning storage attachments on reset:", e));

        // 3. Reset baris lembar kerja di Google Spreadsheet
        const apiUrl = getApiUrl();
        if (apiUrl && !apiUrl.includes("localhost")) {
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "adminResetResponses", formId: targetForm })
          }).catch(e => console.warn("Notice resetting sheet responses:", e));
        }

        closeResetConfirmModal();
        showAdminToast("Semua data respons penilaian pada formulir ini berhasil dikosongkan.", "success");
        await fetchAdminFullData();
        await fetchAdminResponsesList(true);
      } catch (e) {
        showAdminToast("Gagal reset data respons: " + e.message, "error");
      }
    }

    function clearLocalAppCache() {
      localStorage.clear();
      showAdminToast("Cache lokal browser berhasil dibersihkan!", "success");
      setTimeout(() => window.location.reload(), 600);
    }

    function openGlobalSettingsModal() {
      const globalMasterSheet = localStorage.getItem("PGSD_GLOBAL_MASTER_SHEET_URL") || "https://docs.google.com/spreadsheets/d/1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4/edit";
      const globalUrl = localStorage.getItem("PGSD_GLOBAL_API_URL") || localStorage.getItem("PGSD_API_URL") || "";
      const globalFolder = localStorage.getItem("PGSD_GLOBAL_DRIVE_FOLDER") || localStorage.getItem("PGSD_DRIVE_FOLDER_NAME") || "https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK";
      
      const inputMasterSheet = document.getElementById("inputGlobalMasterSheetUrl");
      const inputUrl = document.getElementById("inputGlobalApiUrl");
      const inputFolder = document.getElementById("inputGlobalDriveFolder");
      const linkMaster = document.getElementById("linkOpenMasterSheet");
      
      if (inputMasterSheet) inputMasterSheet.value = globalMasterSheet;
      if (linkMaster) linkMaster.href = globalMasterSheet;
      if (inputUrl) inputUrl.value = globalUrl;
      if (inputFolder) inputFolder.value = globalFolder;

      const statForms = document.getElementById("statGlobalForms");
      const statGroups = document.getElementById("statGlobalGroups");
      const statStudents = document.getElementById("statGlobalStudents");
      if (statForms) statForms.textContent = formsRegistryList.length || "2";

      updateDebugModeUI();

      const modal = document.getElementById("modalGlobalSettings");
      if (modal) modal.classList.remove("hidden");
    }

    function closeGlobalSettingsModal() {
      const modal = document.getElementById("modalGlobalSettings");
      if (modal) modal.classList.add("hidden");
    }

    function saveGlobalSystemSettings() {
      const masterSheet = document.getElementById("inputGlobalMasterSheetUrl")?.value.trim() || "https://docs.google.com/spreadsheets/d/1MAZqzRyau1mECqamnU9Bj3TALRJYDrA1WLQFesJ4wG4/edit";
      const globalUrl = document.getElementById("inputGlobalApiUrl")?.value.trim() || "";
      const globalFolder = document.getElementById("inputGlobalDriveFolder")?.value.trim() || "https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK";

      if (masterSheet) {
        localStorage.setItem("PGSD_GLOBAL_MASTER_SHEET_URL", masterSheet);
      }
      if (globalUrl) {
        localStorage.setItem("PGSD_GLOBAL_API_URL", globalUrl);
        localStorage.setItem("PGSD_API_URL", globalUrl);
      }
      if (globalFolder) {
        localStorage.setItem("PGSD_GLOBAL_DRIVE_FOLDER", globalFolder);
        localStorage.setItem("PGSD_DRIVE_FOLDER_NAME", globalFolder);
      }

      closeGlobalSettingsModal();
      showAdminToast("Setelan Sistem Global & Master Spreadsheet berhasil disimpan.", "success");
    }

    async function updateGlobalAdminPassword() {
      const currentPass = document.getElementById("inputGlobalCurrentAdminPassword")?.value.trim();
      const newPass = document.getElementById("inputGlobalNewAdminPassword")?.value.trim();
      const btn = document.getElementById("btnUpdateAdminPass");

      if (!currentPass) {
        showAdminToast("Masukkan kata sandi admin saat ini!", "warning");
        document.getElementById("inputGlobalCurrentAdminPassword")?.focus();
        return;
      }
      if (!newPass || newPass.length < 4) {
        showAdminToast("Kata sandi baru minimal 4 karakter!", "warning");
        document.getElementById("inputGlobalNewAdminPassword")?.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="flex items-center gap-1"><svg class="w-3 h-3 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Menyimpan...</span>';
      }

      // 🛡️ 100% SECURE EDGE FUNCTION PASSWORD UPDATE
      try {
        const resp = await fetch(ADMIN_AUTH_EDGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_CONFIG.anonKey,
            "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`
          },
          body: JSON.stringify({
            action: "change_password",
            current_password: currentPass,
            new_password: newPass
          })
        });

        const data = await resp.json();
        if (resp.ok && data.success) {
          if (data.token) sessionStorage.setItem("PGSD_ADMIN_SESSION_TOKEN", data.token);

          if (document.getElementById("inputGlobalCurrentAdminPassword")) {
            document.getElementById("inputGlobalCurrentAdminPassword").value = "";
          }
          if (document.getElementById("inputGlobalNewAdminPassword")) {
            document.getElementById("inputGlobalNewAdminPassword").value = "";
          }
          showAdminToast(data.message || "Kata sandi admin berhasil diperbarui secara aman!", "success");
        } else {
          showAdminToast(data?.error || "Gagal mengubah kata sandi admin.", "error");
        }
      } catch (err) {
        console.error("Update admin pass error:", err);
        showAdminToast("Error koneksi ke server autentikasi Supabase.", "error");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>Simpan</span>';
        }
      }
    }

    async function testGlobalApiConnection() {
      const resEl = document.getElementById("globalConnectionStatusResult");
      resEl.classList.remove("hidden");
      resEl.className = "text-xs pt-1 font-mono text-zinc-500";
      resEl.textContent = "Menguji koneksi ke endpoint Spreadsheet Global...";

      const apiUrl = document.getElementById("inputGlobalApiUrl")?.value.trim() || getApiUrl();
      const startTime = Date.now();

      try {
        const response = await fetch(`${apiUrl}?action=adminGetFormsRegistry&_t=${Date.now()}`);
        const latency = Date.now() - startTime;
        resEl.className = "text-xs pt-1 font-mono text-emerald-600 font-bold";
        resEl.textContent = `Status: Terhubung (${latency} ms) • Siap Menerima Data`;
      } catch (e) {
        resEl.className = "text-xs pt-1 font-mono text-amber-600 font-medium";
        resEl.textContent = "Catatan: Webhook aktif. Pastikan setelan deployment di Apps Script adalah 'Anyone'.";
      }
    }

    function copyBotEmailToClipboard(btn) {
      const email = "form-web-bot@form-web-506515.iam.gserviceaccount.com";
      navigator.clipboard.writeText(email).then(() => {
        showAdminToast("Email Bot Google Cloud berhasil disalin ke clipboard!", "success");
        if (btn) {
          const originalText = btn.innerHTML;
          btn.innerHTML = `<span class="text-emerald-700 font-bold">✓ Email Tersalin!</span>`;
          setTimeout(() => btn.innerHTML = originalText, 2500);
        }
      }).catch(() => {
        showAdminToast("Gagal menyalin otomatis. Silakan salin manual: " + email, "info");
      });
    }

    function saveApiUrl() {
      const url = document.getElementById("inputApiUrl")?.value.trim() || "";
      const driveFolder = document.getElementById("inputDriveFolderName")?.value.trim() || "";
      
      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      adminAppConfig["Spreadsheet_Url"] = url;
      adminAppConfig["Spreadsheet_Webhook_Url"] = url;
      adminAppConfig["Google_Drive_Folder_Name"] = driveFolder;

      localStorage.setItem(`PGSD_CACHE_CONFIG_${targetForm}`, JSON.stringify(adminAppConfig));

      // Simpan ke Supabase Database pgsd_form_configs & pgsd_forms
      const sb = getSupabaseClient();
      if (sb && targetForm) {
        sb.from('pgsd_form_configs').upsert({
          form_id: targetForm,
          config_data: adminAppConfig,
          updated_at: new Date().toISOString()
        }).then(({ error }) => {
          if (!error) console.log("Per-form custom config synced to Supabase:", targetForm);
        });

        sb.from('pgsd_forms').update({
          spreadsheet_url: url || null,
          updated_at: new Date().toISOString()
        }).eq('form_id', targetForm).then(({ error }) => {
          if (!error) console.log("Form spreadsheet_url updated in pgsd_forms:", targetForm);
        });
      }

      showAdminToast(url || driveFolder ? `Setelan Google Spreadsheet formulir '${targetForm}' berhasil disimpan.` : `Formulir '${targetForm}' kini menggunakan Default Master FKIP.`, "success");
    }

    function openUniversalScriptModal() {
      const modal = document.getElementById("modalUniversalScript");
      if (modal) modal.classList.remove("hidden");
    }

    function closeUniversalScriptModal() {
      const modal = document.getElementById("modalUniversalScript");
      if (modal) modal.classList.add("hidden");
    }

    function copyUniversalScriptCode(btn) {
      const textarea = document.getElementById("textUniversalScriptCode");
      if (!textarea) return;
      
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(textarea.value).then(() => {
        showAdminToast("Kode skrip 30-baris berhasil disalin ke clipboard!", "success");
        if (btn) {
          const originalText = btn.innerHTML;
          btn.innerHTML = `<span>✓ Tersalin!</span>`;
          setTimeout(() => btn.innerHTML = originalText, 2000);
        }
      }).catch(() => {
        showAdminToast("Gagal menyalin otomatis. Silakan salin teks secara manual.", "warning");
      });
    }

    async function testApiConnection() {
      const resEl = document.getElementById("connectionStatusResult");
      resEl.classList.remove("hidden");
      resEl.className = "text-xs pt-1 font-mono text-zinc-500";
      resEl.textContent = "Memeriksa tautan Google Spreadsheet & format ID...";

      const customUrl = document.getElementById("inputApiUrl")?.value.trim();
      if (!customUrl) {
        resEl.className = "text-xs pt-1 font-mono text-indigo-600 font-semibold";
        resEl.textContent = "Status: Menggunakan Spreadsheet Master Utama FKIP (Tersambung Otomatis).";
        return;
      }

      const match = customUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        resEl.className = "text-xs pt-1 font-mono text-emerald-600 font-bold";
        resEl.textContent = `✓ Format Spreadsheet Valid (ID: ${match[1].slice(0, 10)}...). Pastikan email bot diundang sebagai Editor.`;
        showAdminToast("Format Google Spreadsheet valid!", "success");
      } else if (customUrl.startsWith("http")) {
        resEl.className = "text-xs pt-1 font-mono text-emerald-600 font-bold";
        resEl.textContent = "✓ Tautan kustom terdaftar. Pastikan bot diundang sebagai Editor.";
        showAdminToast("Tautan kustom berhasil didaftarkan.", "success");
      } else {
        resEl.className = "text-xs pt-1 font-mono text-rose-600 font-bold";
        resEl.textContent = "✕ Format URL tidak valid. Gunakan link Google Spreadsheet: https://docs.google.com/spreadsheets/d/...";
        showAdminToast("Format tautan tidak valid.", "warning");
      }
    }

    function handleCloneActiveWorkspaceForm() {
      if (currentFormId) {
        cloneFormAction(currentFormId);
      }
    }

    function handleDeleteActiveWorkspaceForm() {
      if (currentFormId) {
        openDeleteFormModal(currentFormId, currentFormMeta?.judulForm || currentFormId);
      }
    }

    async function downloadGlobalDatabaseBackup() {
      showGlobalLoadingProgress();
      const sb = await ensureSupabaseClient();
      try {
        let forms = [], configs = [], groups = [], students = [], responses = [];
        if (sb) {
          const [fRes, cRes, gRes, sRes, rRes] = await Promise.all([
            sb.from('pgsd_forms').select('*'),
            sb.from('pgsd_form_configs').select('*'),
            sb.from('pgsd_groups').select('*'),
            sb.from('pgsd_students').select('*'),
            sb.from('pgsd_responses').select('*')
          ]);
          forms = fRes.data || [];
          configs = cRes.data || [];
          groups = gRes.data || [];
          students = sRes.data || [];
          responses = rRes.data || [];
        }

        const backupPayload = {
          app: "PGSD_5E_ASSESSMENT_SYSTEM",
          version: "2.2.50",
          timestamp: new Date().toISOString(),
          counts: {
            forms: forms.length,
            configs: configs.length,
            groups: groups.length,
            students: students.length,
            responses: responses.length
          },
          data: {
            forms: forms,
            configs: configs,
            groups: groups,
            students: students,
            responses: responses
          }
        };

        const jsonStr = JSON.stringify(backupPayload, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
        a.href = url;
        a.download = `pgsd_5e_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Record in pgsd_backups
        if (sb) {
          sb.from('pgsd_backups').insert([{
            backup_name: `Backup_${dateStr}`,
            description: `Full manual backup of ${forms.length} forms and ${responses.length} responses`,
            record_counts: backupPayload.counts,
            payload: backupPayload,
            created_by: 'Admin'
          }]).then(() => {});
        }

        showAdminToast(`Cadangan database (${forms.length} form, ${students.length} mhs) berhasil diunduh!`, "success");
      } catch (err) {
        showAdminToast("Gagal membuat cadangan database: " + err, "error");
      } finally {
        hideGlobalLoadingProgress();
      }
    }

    async function handleRestoreDatabaseFileInput(input) {
      const file = input.files && input.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backupObj = JSON.parse(text);

        if (!backupObj || backupObj.app !== "PGSD_5E_ASSESSMENT_SYSTEM" || !backupObj.data) {
          showAdminToast("Format file cadangan tidak valid atau tidak cocok!", "error");
          input.value = "";
          return;
        }

        const counts = backupObj.counts || {};
        const ok = await showAppConfirm({
          title: "Pulihkan Basis Data?",
          message: `File ini berisi: ${counts.forms || 0} Formulir, ${counts.groups || 0} Kelompok, ${counts.students || 0} Mahasiswa, ${counts.responses || 0} Respons. Lanjutkan pemulihan ke Supabase?`,
          confirmText: "Ya, Pulihkan Sekarang",
          type: "warning"
        });

        if (!ok) {
          input.value = "";
          return;
        }

        showGlobalLoadingProgress();
        const sb = getSupabaseClient();
        if (sb) {
          const d = backupObj.data;
          if (d.forms && d.forms.length > 0) {
            await sb.from('pgsd_forms').upsert(d.forms);
          }
          if (d.configs && d.configs.length > 0) {
            await sb.from('pgsd_form_configs').upsert(d.configs);
          }
          if (d.groups && d.groups.length > 0) {
            await sb.from('pgsd_groups').upsert(d.groups);
          }
          if (d.students && d.students.length > 0) {
            await sb.from('pgsd_students').upsert(d.students);
          }
          if (d.responses && d.responses.length > 0) {
            await sb.from('pgsd_responses').upsert(d.responses);
          }
        }

        showAdminToast("Basis data berhasil dipulihkan secara utuh!", "success");
        await fetchFormsRegistry(true);
      } catch (err) {
        showAdminToast("Gagal memulihkan database: " + err, "error");
      } finally {
        input.value = "";
        hideGlobalLoadingProgress();
      }
    }

    // PRINT MODAL FUNCTIONS
    let adminPrintZoom = 1.0;

    function openAdminPrintModal() {
      populateAdminPrintScopeOptions();
      const modal = document.getElementById("printRekapModal");
      if (modal) modal.classList.remove("hidden");
      renderAdminPrintPreviewContent();
      setTimeout(() => {
        resetAdminPrintZoom();
      }, 50);
    }

    function closeAdminPrintModal() {
      const modal = document.getElementById("printRekapModal");
      if (modal) modal.classList.add("hidden");
    }

    function populateAdminPrintScopeOptions() {
      const gSel = document.getElementById("adminPrintScopeGroupSelect");
      const sSel = document.getElementById("adminPrintScopeSesiSelect");
      if (!gSel || !sSel) return;
      gSel.innerHTML = '<option value="ALL">Semua Kelompok (Keseluruhan)</option>';
      sSel.innerHTML = '<option value="ALL">Semua Sesi</option>';
      const groups = Array.from(new Set((adminMasterGroups || []).map(g => g.name))).filter(Boolean);
      groups.forEach(g => gSel.innerHTML += `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`);
      const sesis = Array.from(new Set((adminMasterGroups || []).map(g => g.sesi))).filter(Boolean);
      sesis.forEach(s => sSel.innerHTML += `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`);
    }

    function renderAdminPrintPreviewContent() {
      const container = document.getElementById("printableReportArea");
      if (!container) return;

      const scopeGroup = document.getElementById("adminPrintScopeGroupSelect")?.value || "ALL";
      const scopeSesi = document.getElementById("adminPrintScopeSesiSelect")?.value || "ALL";
      const includeReviews = document.getElementById("adminPrintIncludeReviews")?.checked ?? true;
      const includeReviewerName = document.getElementById("adminPrintIncludeReviewerName")?.checked ?? true;
      const includeFooter = document.getElementById("adminPrintIncludeFooter")?.checked ?? true;

      const matkul = adminAppConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "Bimbingan Konseling di SD";
      const dosen = adminAppConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.";
      const kelas = adminAppConfig["Kelas"] || (currentFormMeta && currentFormMeta.kelas) || "5E";
      const rawJurusan = (adminAppConfig["Jurusan"] || (currentFormMeta && currentFormMeta.jurusan) || "PGSD").trim();
      let prodiKop = "PROGRAM STUDI PENDIDIKAN GURU SEKOLAH DASAR (PGSD)";
      if (rawJurusan && rawJurusan.toUpperCase() !== "PGSD") {
        if (rawJurusan.toUpperCase().startsWith("PROGRAM STUDI") || rawJurusan.toUpperCase().startsWith("PRODI")) {
          prodiKop = rawJurusan.toUpperCase();
        } else {
          prodiKop = `PROGRAM STUDI ${rawJurusan.toUpperCase()}`;
        }
      }
      const printDateStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

      // Filter groups & build unified summary list
      const allResponses = Array.isArray(adminResponsesList) ? adminResponsesList : [];
      let groupsToDisplay = Array.isArray(adminMasterGroups) ? [...adminMasterGroups] : [];

      if (scopeGroup !== "ALL") {
        groupsToDisplay = groupsToDisplay.filter(g => g.name === scopeGroup);
      }
      if (scopeSesi !== "ALL") {
        groupsToDisplay = groupsToDisplay.filter(g => (g.sesi || "Minggu 1") === scopeSesi);
      }

      let summaryList = groupsToDisplay.map(g => {
        const groupResponses = allResponses.filter(r => (r.kelompok_dinilai || r.kelompok) === g.name && (scopeSesi === 'ALL' || (r.sesi || 'Minggu 1') === (g.sesi || 'Minggu 1')));
        const countPenilai = groupResponses.length;
        let avgScore = 0;
        if (countPenilai > 0) {
          const sum = groupResponses.reduce((acc, r) => acc + (parseFloat(r.nilai_kelompok || r.nilaiKelompok) || 0), 0);
          avgScore = parseFloat((sum / countPenilai).toFixed(2));
        }

        // Aggregate best presenters
        const presenterVotes = {};
        groupResponses.forEach(r => {
          [r.best_presenter_1, r.best_presenter_2].forEach(p => {
            if (p && p !== '-' && p !== 'null') {
              presenterVotes[p] = (presenterVotes[p] || 0) + 1;
            }
          });
        });
        const rankedPresenters = Object.entries(presenterVotes)
          .map(([name, votes]) => ({ name, votes }))
          .sort((a, b) => b.votes - a.votes);

        // Aggregate qualitative reviews
        const allAdminStudents = (adminMasterGroups || []).flatMap(g => (g.members || []).map(m => ({ ...m, kelompok: g.name })));
        const evaluasiList = {};
        groupResponses.forEach(r => {
          const penilaiName = r.nama_penilai || r.namaPenilai || 'Penilai';
          const evalDetail = r.evaluasi_detail || r.evaluasiDetail || {};
          if (typeof evalDetail === 'object' && evalDetail !== null) {
            Object.entries(evalDetail).forEach(([memberKey, ulasanText]) => {
              if (memberKey === 'uploadedFiles' || !ulasanText) return;
              let memberName = memberKey;
              const foundStud = allAdminStudents.find(s => String(s.nim).trim() === String(memberKey).trim());
              if (foundStud && foundStud.name) {
                memberName = `${foundStud.name} (${memberKey})`;
              }
              if (!evaluasiList[memberName]) evaluasiList[memberName] = [];
              evaluasiList[memberName].push({
                penilai: penilaiName,
                ulasan: ulasanText
              });
            });
          }
        });

        return {
          kelompok: g.name,
          sesi: g.sesi || 'Minggu 1',
          totalPenilai: countPenilai,
          rataRataSkor: avgScore,
          rankedPresenters: rankedPresenters,
          evaluasiList: evaluasiList
        };
      });

      // Hitung Rata-Rata Keseluruhan
      let totalAllScore = 0;
      let totalAllPenilai = 0;
      let evaluatedCount = 0;
      summaryList.forEach(g => {
        const s = parseFloat(g.rataRataSkor || 0);
        const p = parseInt(g.totalPenilai) || 0;
        if (p > 0) {
          totalAllScore += s;
          totalAllPenilai += p;
          evaluatedCount++;
        }
      });

      // Hitung Total Mahasiswa Terdaftar
      const activeGroupNames = new Set(summaryList.map(g => g.kelompok));
      let totalMahasiswa = 0;
      (adminMasterGroups || []).filter(g => activeGroupNames.has(g.name)).forEach(g => {
        totalMahasiswa += (g.members || []).length;
      });
      const avgClassScore = evaluatedCount > 0 ? (totalAllScore / evaluatedCount).toFixed(2) : "0.00";

      // Resolve dynamic header cards
      let cards = adminAppConfig.Header_Info_Cards;
      if (!cards || !Array.isArray(cards) || cards.length === 0) {
        const rawMatkul = adminAppConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "";
        const rawDosen  = adminAppConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "";
        const rawKelas  = adminAppConfig["Kelas"] || (currentFormMeta && currentFormMeta.kelas) || "";
        const rawProdi  = adminAppConfig["Jurusan"] || (currentFormMeta && currentFormMeta.jurusan) || "";
        
        cards = [];
        if (rawMatkul) cards.push({ label: 'Mata Kuliah:', value: rawMatkul });
        if (rawDosen)  cards.push({ label: 'Dosen Pengampu:', value: rawDosen });
        if (rawKelas)  cards.push({ label: 'Kelas:', value: rawKelas });
        if (rawProdi)  cards.push({ label: 'Program Studi:', value: rawProdi });
      }

      const activeCards = cards.filter(c => (c.label && c.label.trim()) || (c.value && c.value.trim()));
      let rawMetaItems = activeCards.map(c => ({
        label: (c.label || 'Info').trim().replace(/:$/, ''),
        value: (c.value || '-').trim()
      }));

      const hasSesiCard = rawMetaItems.some(item => item.label.toLowerCase().includes('sesi') || item.label.toLowerCase().includes('cakupan'));
      if (!hasSesiCard) {
        rawMetaItems.push({
          label: 'Cakupan Sesi',
          value: scopeSesi === 'ALL' ? 'Semua Sesi Presentasi' : scopeSesi
        });
      }

      // Smart Academic Metadata Pairing
      const leftColItems = [];
      const rightColItems = [];

      rawMetaItems.forEach(item => {
        const lblLower = item.label.toLowerCase();
        if (lblLower.includes('matkul') || lblLower.includes('mata kuliah') || lblLower.includes('dosen') || lblLower.includes('pengampu')) {
          leftColItems.push(item);
        } else if (lblLower.includes('kelas') || lblLower.includes('prodi') || lblLower.includes('jurusan') || lblLower.includes('program studi')) {
          rightColItems.push(item);
        } else {
          if (leftColItems.length <= rightColItems.length) {
            leftColItems.push(item);
          } else {
            rightColItems.push(item);
          }
        }
      });

      const maxRows = Math.max(leftColItems.length, rightColItems.length);
      let metadataTableHtml = '';
      if (maxRows > 0) {
        let rowsHtml = '';
        for (let i = 0; i < maxRows; i++) {
          const leftItem = leftColItems[i];
          const rightItem = rightColItems[i];
          rowsHtml += `
            <tr style="border: none !important;">
              ${leftItem ? `
                <td style="border: none !important; padding: 1.5px 0; width: 17%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif; white-space: nowrap;">${escapeHtml(leftItem.label)}</td>
                <td style="border: none !important; padding: 1.5px 8px 1.5px 0; width: 47%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif; line-height: 1.25;">: ${escapeHtml(leftItem.value)}</td>
              ` : `
                <td style="border: none !important; width: 17%;"></td>
                <td style="border: none !important; width: 47%;"></td>
              `}
              ${rightItem ? `
                <td style="border: none !important; padding: 1.5px 0; width: 16%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif; white-space: nowrap;">${escapeHtml(rightItem.label)}</td>
                <td style="border: none !important; padding: 1.5px 0; width: 20%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif; line-height: 1.25;">: ${escapeHtml(rightItem.value)}</td>
              ` : `
                <td style="border: none !important; width: 16%;"></td>
                <td style="border: none !important; width: 20%;"></td>
              `}
            </tr>
          `;
        }
        metadataTableHtml = `
          <table style="width: 100%; border-collapse: collapse; border: none !important; margin-top: 2px; font-size: 11.5px; text-align: left; table-layout: fixed; font-family: 'Times New Roman', Times, serif;">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        `;
      }

      // Title determination
      const formTitle = adminAppConfig["Judul_Form"] || (currentFormMeta && currentFormMeta.judulForm) || "";
      let reportTitle = "LAPORAN REKAPITULASI HASIL PENILAIAN PRESENTASI";
      if (formTitle && !formTitle.toLowerCase().includes("penilaian presentasi") && formTitle.length < 50) {
        reportTitle = `LAPORAN REKAPITULASI ${formTitle.toUpperCase().replace(/^PENILAIAN\s+/i, 'HASIL PENILAIAN ')}`;
      }

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
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; line-height: 1.2; margin-top: 1px;">${prodiKop}</div>
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
                ${escapeHtml(reportTitle)}
              </h2>
              ${metadataTableHtml}
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
        const sorted = [...summaryList].sort((a, b) => parseFloat(b.rataRataSkor || 0) - parseFloat(a.rataRataSkor || 0));
        sorted.forEach((g, idx) => {
          const scoreNum = parseFloat(g.rataRataSkor || 0);
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

          const presenters = g.rankedPresenters || [];
          const topPresentersText = (presenters.length > 0)
            ? presenters.map(p => `${p.name} (${p.votes} Suara)`).join(", ")
            : "-";

          html += `
            <tr style="border-bottom: 1px solid #000000; font-family: 'Times New Roman', Times, serif; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #fafafa;'}">
              <td style="padding: 4.5px 2px; border: 1px solid #000000; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif; font-size: 11.5px;">#${idx + 1}</td>
              <td style="padding: 4.5px 5px; border: 1px solid #000000; font-weight: bold; color: #000000; font-size: 11.5px; font-family: 'Times New Roman', Times, serif; word-break: break-word;">${escapeHtml(g.kelompok)}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">${escapeHtml(g.sesi || 'Minggu 1')}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 11.5px;">${totalP} Mhs</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif; color: #000000; font-size: 11.5px;">${totalP > 0 ? scoreNum.toFixed(2) : '-'}</td>
              <td style="padding: 4.5px 5px; border: 1px solid #000000; color: #000000; font-size: 11px; font-family: 'Times New Roman', Times, serif; word-break: break-word; overflow-wrap: break-word; line-height: 1.25;">${escapeHtml(topPresentersText)}</td>
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
                  <span class="font-extrabold" style="font-size: 11.5px; font-weight: 800;">${escapeHtml(g.kelompok)}</span>
                  <span class="font-medium font-mono text-zinc-700 bg-zinc-200/80 px-1.5 py-0.5 rounded" style="font-size: 10px;">${escapeHtml(g.sesi || 'Minggu 1')}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; padding-top: 2.5px;">
            `;

            studentKeys.forEach(name => {
              const reviews = evalList[name] || [];
              if (reviews.length > 0) {
                html += `
                  <div class="rounded bg-white border border-zinc-200 shadow-2xs" style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 6.5px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding-bottom: 2px; margin-bottom: 3px;">
                      <span style="font-size: 11px; font-weight: 700; color: #111827;">${escapeHtml(name)}</span>
                      <span style="font-size: 9.5px; font-weight: 600; color: #4b5563; font-family: monospace; background: #f3f4f6; padding: 0.5px 4px; border-radius: 3px;">${reviews.length} Masukan</span>
                    </div>
                    <ul style="list-style-type: disc; padding-left: 14px; margin: 0; font-size: 10.5px; line-height: 1.3; color: #1f2937;">
                      ${reviews.slice(0, 4).map(r => `
                        <li style="margin-bottom: 2px;">
                          <span style="font-style: italic; color: #111827;">"${escapeHtml(r.ulasan)}"</span>
                          ${includeReviewerName ? `<span style="font-size: 9px; color: #4b5563; font-weight: 600; font-style: normal; margin-left: 3px;">— ${escapeHtml(r.penilai || 'Penilai')}</span>` : ''}
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
              <div style="text-align: center; min-width: 260px; max-width: 380px; width: fit-content; font-family: 'Times New Roman', Times, serif;">
                <p style="margin: 0; font-size: 11.5px; color: #000000; font-family: 'Times New Roman', Times, serif;">Banjarmasin, ${printDateStr}</p>
                <p style="margin: 1.5px 0 0 0; font-size: 11.5px; font-weight: 700; color: #000000; font-family: 'Times New Roman', Times, serif;">Dosen Pengampu Mata Kuliah,</p>
                <div style="height: 60px;"></div>
                <div style="margin-top: 1px; padding: 0 6px 1.5px 6px; border-bottom: 1.5px solid #000000; display: inline-block; min-width: 220px; max-width: 100%;">
                  <span style="font-size: 12px; font-weight: 800; color: #000000; white-space: nowrap; letter-spacing: 0.01em; font-family: 'Times New Roman', Times, serif;">${escapeHtml(dosen)}</span>
                </div>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #000000; font-weight: 600; font-family: 'Times New Roman', Times, serif;">NIP. 19830514 200812 2 003</p>
              </div>
            </div>

          </div>

          ${includeFooter ? `
            <!-- FOOTER DOKUMEN RESMI MINIMALIS ANCHORED AT BOTTOM -->
            <div class="print-avoid-break print-footer" style="page-break-inside: avoid; break-inside: avoid; margin-top: auto; padding-top: 6px; border-top: 0.75px dashed #9ca3af; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #4b5563; line-height: 1.3; flex-shrink: 0;">
              <span>Dokumen ini diterbitkan secara otomatis oleh <strong>Sistem Peer-Assessment ${escapeHtml(rawJurusan || 'FKIP')} Kelas ${escapeHtml(kelas)}</strong> &bull; Universitas Lambung Mangkurat</span>
              <span style="font-family: monospace; color: #6b7280; font-weight: 500;">Waktu Cetak: ${printDateStr}</span>
            </div>
          ` : ''}

        </div>
      `;

      container.innerHTML = html;
      requestAnimationFrame(() => {
        applyPrintZoom();
      });
    }

    function adjustAdminPrintZoom(delta) {
      adminPrintZoom = Math.max(0.3, Math.min(1.8, Math.round((adminPrintZoom + delta) * 10) / 10));
      applyPrintZoom(false);
    }

    function resetAdminPrintZoom() {
      const scrollContainer = document.getElementById("adminPrintScrollContainer");
      if (scrollContainer) {
        const availableW = scrollContainer.clientWidth - 40;
        const autoFitScale = Math.min(1.0, Math.max(0.35, availableW / 820));
        adminPrintZoom = Math.round(autoFitScale * 100) / 100;
      } else {
        adminPrintZoom = 1.0;
      }
      applyPrintZoom(true);
    }

    function applyPrintZoom(isFit = false) {
      const area = document.getElementById("printableReportArea");
      const wrapper = document.getElementById("adminPrintableReportWrapper");
      const badge = document.getElementById("adminPrintZoomBadge");

      if (area && wrapper) {
        const actualH = area.scrollHeight || 1123;
        area.style.transform = `scale(${adminPrintZoom})`;
        wrapper.style.width = `${Math.round(794 * adminPrintZoom)}px`;
        wrapper.style.height = `${Math.round(actualH * adminPrintZoom)}px`;
      }
      if (badge) {
        badge.textContent = isFit ? `Fit (${Math.round(adminPrintZoom * 100)}%)` : `${Math.round(adminPrintZoom * 100)}%`;
      }
    }

    function executeAdminBrowserPrint() {
      const area = document.getElementById("printableReportArea");
      const root = document.getElementById("printDocumentRoot");
      if (area && root) {
        root.innerHTML = area.innerHTML;
        window.print();
      }
    }
  
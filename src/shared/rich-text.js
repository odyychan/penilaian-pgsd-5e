/* src/shared/rich-text.js */
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

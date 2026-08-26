/* src/shared/keyboard.js */
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

/* src/shared/math.js */
/* ============================================
 * Module: shared/utils
 * Math rendering, rich text, UI utilities, keyboard shortcuts, media
 * ============================================ */

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

/* ============================================
 * src/student/form.js
 * Form rendering, step nav, wizard
 * ============================================ */

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

    // Continuous auto-enhancer for dynamically injected select elements
    if (typeof MutationObserver !== 'undefined') {
      const globalDropdownObserver = new MutationObserver(() => {
        initAllModernDropdowns();
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
      saveVisitedFormHistory(activeFormId);
      loadLocalCache();
      
      const hash = (window.location.hash || "").replace("#", "").toLowerCase();
      const savedTab = (hash === "rekap" || hash === "form") ? hash : (localStorage.getItem("PGSD_ACTIVE_MAIN_TAB") || "form");
      
      switchTab(savedTab, false);
      updateStepUI(1);
      
      checkAndApplyAuthGate();
      restoreFormDraft();
      fetchInitialFormData(false);

      // Pre-fetch rekap data secara diam-diam di background agar instan saat dibuka
      setTimeout(() => loadRekapData(true), 400);

      // Inisialisasi Sinkronisasi Real-Time 2 Arah
      initRealtimeSyncEngine();
      setTimeout(() => renderAllMathInElement(document.body), 200);
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
      const viewPortal = document.getElementById("viewPortal");
      const viewForm = document.getElementById("viewForm");
      const viewRekap = document.getElementById("viewRekap");
      const navTabContainer = document.getElementById("navTabContainer");
      const pinEl = document.getElementById("navPinBadge");
      const badgeSesiTopText = document.getElementById("badgeSesiTopText");

      if (viewPortal) viewPortal.classList.remove("hidden");
      if (viewForm) viewForm.classList.add("hidden");
      if (viewRekap) viewRekap.classList.add("hidden");
      if (navTabContainer) navTabContainer.classList.add("hidden");
      if (pinEl) pinEl.textContent = "🔑 Masukkan PIN";
      if (badgeSesiTopText) badgeSesiTopText.textContent = "Portal Akses";

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

    function renderDynamicClientStages() {
      const container = document.getElementById("dynamicClientStagesContainer");
      if (!container) return;

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
        renderAllMathInElement(document.getElementById("formOverviewSection"));
      }, 50);
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
        const emailVal = clientCustomFormAnswers[f.id + '_email'] || activeUserAccountEmail || '';
        const nameVal = clientCustomFormAnswers[f.id + '_nama'] || activeUserAccountName || '';
        const nimVal = clientCustomFormAnswers[f.id + '_nim'] || activeUserAccountNim || '';
        const roleVal = clientCustomFormAnswers[f.id + '_peran'] || currentEvaluatorRole || 'Mahasiswa';

        return `
          <div class="bg-zinc-50/60 p-4 sm:p-6 rounded-2xl border border-zinc-200/80 space-y-4">
            <div class="border-b border-zinc-200 pb-3 flex items-center justify-between gap-2">
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
                  class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm font-semibold text-zinc-900 bg-white focus:border-zinc-900 outline-none transition cursor-pointer appearance-none pr-9 shadow-2xs"
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
                <span id="authNimAutoNotice" class="text-[10px] text-emerald-700 font-medium ${nimVal ? '' : 'hidden'}">Nama terverifikasi</span>
              </div>
              <div class="relative">
                <input 
                  type="text" 
                  id="inputNim" 
                  inputmode="numeric"
                  value="${escapeHtml(nimVal)}"
                  placeholder="Masukkan NIM Anda (contoh: 2310125210099)..." 
                  class="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm font-mono focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400"
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
            <div id="identityFieldsContainer" class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-semibold text-zinc-700">
                    Nama Lengkap Penilai <span class="text-rose-500">*</span>
                  </label>
                  <span id="namaAutoFillNotice" class="text-[10px] text-emerald-700 font-medium ${nameVal ? '' : 'hidden'}">Terisi otomatis</span>
                </div>
                <input 
                  type="text" 
                  id="inputNama" 
                  required 
                  value="${escapeHtml(nameVal)}"
                  autocapitalize="words"
                  placeholder="Tuliskan nama lengkap Anda..." 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400"
                  oninput="saveFormDraft();"
                >
              </div>

              <div class="space-y-1.5" id="emailFieldContainer">
                <div class="flex items-center justify-between">
                  <label id="labelEmailPenilai" class="block text-xs font-semibold text-zinc-700">
                    Email Penilai <span id="emailRequiredStar" class="text-rose-500">*</span>
                  </label>
                  <button 
                    type="button" 
                    id="btnFillNimEmail" 
                    onclick="fillNimEmailFormat()" 
                    class="${nimVal ? 'flex' : 'hidden'} text-[10px] font-mono font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-300 transition cursor-pointer items-center gap-1"
                    title="Isi otomatis email format NIM@mhs.ulm.ac.id"
                  >
                    <span>⚡ Isi dari NIM</span>
                  </button>
                </div>
                <input 
                  type="email" 
                  id="inputEmail" 
                  required 
                  inputmode="email"
                  value="${escapeHtml(emailVal)}"
                  placeholder="contoh: nama.nim@mhs.ulm.ac.id" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400"
                  oninput="validateEmailLive(this.value); updateAccountActiveEmail(this.value); saveFormDraft();"
                >
                <div id="emailQuickChips" class="flex flex-wrap items-center gap-1 pt-0.5">
                  <span class="text-[9.5px] text-zinc-400 font-mono">Domain:</span>
                  <button type="button" onclick="appendEmailDomain('@mhs.ulm.ac.id')" class="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-700 text-[10px] font-mono text-zinc-600 border border-zinc-200 transition cursor-pointer">+ @mhs.ulm.ac.id</button>
                  <button type="button" onclick="appendEmailDomain('@ulm.ac.id')" class="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-700 text-[10px] font-mono text-zinc-600 border border-zinc-200 transition cursor-pointer">+ @ulm.ac.id</button>
                  <button type="button" onclick="appendEmailDomain('@gmail.com')" class="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-700 text-[10px] font-mono text-zinc-600 border border-zinc-200 transition cursor-pointer">+ @gmail.com</button>
                </div>
                <p id="emailValidationMsg" class="text-[11px] font-medium hidden"></p>
              </div>
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
            renderDynamicClientStages();
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

      document.getElementById("navTitle").innerHTML = formattedTitle;
      document.getElementById("navSubtitle").innerHTML = smartMathFormat(matkul);
      document.getElementById("badgeSesiTopText").textContent = sesi;

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
        renderAllMathInElement(document.getElementById("formOverviewSection"));
        renderAllMathInElement(document.body);
      }, 50);

      const minVal = parseInt(appConfig["Nilai_Kelompok_Min"] || 50);
      const maxVal = parseInt(appConfig["Nilai_Kelompok_Max"] || 100);
      document.getElementById("sliderMinLabel").textContent = `Min: ${minVal}`;
      document.getElementById("sliderMaxLabel").textContent = `Max: ${maxVal}`;
      document.getElementById("inputNilaiSlider").min = minVal;
      document.getElementById("inputNilaiSlider").max = maxVal;
      document.getElementById("inputNilaiNumber").min = minVal;
      document.getElementById("inputNilaiNumber").max = maxVal;
      updateScoreBadge(document.getElementById("inputNilaiNumber").value || 85);
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
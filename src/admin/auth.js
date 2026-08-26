/* ============================================
 * Module: admin/auth
 * Authentication, login, session management
 * ============================================ */

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

    const ADMIN_SALT = "pgsd_5e_secret_salt_2026";
    const KNOWN_VALID_HASHES = [
      "519f462f10356f848856d12bcf480baa6645feba14bd700632222d27963d993d", // admin5e
      "3a87ec7c568711dda677cbe019f9de2972a67e2d1e5e962868ba414ed780f0a3", // admin
      "b6b860c8955de4c335b39590f589546823f29dd1be4a4df61b8ae35c766f8662", // pgsd5e
      "e0443fd6a4f12a8265870f282bf3d9cbe6355d029713544775a0ebc939a64e08", // bksd5e
      "bda83e164180c6971d599bef0de56b118c38713c589f8b38ce8aba88e8847a18"  // dede5e
    ];

    async function hashAdminPassword(pass) {
      const msgUint8 = new TextEncoder().encode(pass + "_" + ADMIN_SALT);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    document.addEventListener("DOMContentLoaded", async function() {
      initAllModernDropdowns();
      const isAuth = sessionStorage.getItem("PGSD_ADMIN_AUTH");
      if (isAuth === "true") {
        showDashboard();
      }
      setTimeout(() => renderAllMathInElement(document.body), 100);
    });

    async function handleLogin(e) {
      e.preventDefault();
      const enteredPass = document.getElementById("inputPassword")?.value.trim();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const errMsg = document.getElementById("loginErrorMsg");
      const card = document.getElementById("loginCard");
      
      if (!enteredPass) return;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Memverifikasi...</span>';
      }
      if (errMsg) errMsg.classList.add("hidden");

      let isAuthenticated = false;

      // 1. First attempt: Supabase Edge Function (if deployed & available)
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

        if (resp.ok) {
          const resData = await resp.json();
          if (resData && resData.success) {
            isAuthenticated = true;
            if (resData.token) sessionStorage.setItem("PGSD_ADMIN_SESSION_TOKEN", resData.token);
          }
        }
      } catch (err) {
        console.warn("Edge function auth unavailable, falling back to secure hash engine:", err);
      }

      // 2. Fallback attempt: Check against Supabase Database / Salted SHA-256 Hashes
      if (!isAuthenticated) {
        try {
          const passHash = await hashAdminPassword(enteredPass);
          const customHash = localStorage.getItem("PGSD_CUSTOM_ADMIN_HASH");

          // Check against Database GLOBAL config in Supabase if exists
          try {
            const sb = await ensureSupabaseClient();
            if (sb) {
              const { data: dbCfg } = await sb.from('pgsd_form_configs').select('config_data').eq('form_id', 'GLOBAL').maybeSingle();
              if (dbCfg && dbCfg.config_data && dbCfg.config_data.admin_password) {
                if (enteredPass === dbCfg.config_data.admin_password || passHash === dbCfg.config_data.admin_password_hash) {
                  isAuthenticated = true;
                }
              }
            }
          } catch(e) {}

          if (!isAuthenticated) {
            if (customHash && passHash === customHash) {
              isAuthenticated = true;
            } else if (KNOWN_VALID_HASHES.includes(passHash)) {
              isAuthenticated = true;
            }
          }
        } catch(e) {
          console.error("Local hash verification error:", e);
        }
      }

      if (isAuthenticated) {
        sessionStorage.setItem("PGSD_ADMIN_AUTH", "true");
        showDashboard();
      } else {
        if (errMsg) {
          errMsg.textContent = "Kata sandi admin tidak valid. Silakan coba lagi.";
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
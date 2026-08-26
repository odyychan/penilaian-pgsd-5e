/* ============================================
 * Module: admin/forms
 * Form workspace, fetch data, config, form CRUD
 * ============================================ */

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
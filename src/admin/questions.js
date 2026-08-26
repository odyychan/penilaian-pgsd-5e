/* ============================================
 * Module: admin/questions
 * Form builder, question editor, floating dock, drag-drop
 * ============================================ */

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

      if (field.options) document.getElementById("q_options_text").value = field.options.join(", ");
      if (field.minVal) document.getElementById("q_min_val").value = field.minVal;
      if (field.maxVal) document.getElementById("q_max_val").value = field.maxVal;

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

    function handleSaveCustomQuestion(e) {
      e.preventDefault();
      const editId = document.getElementById("q_edit_id").value;
      const label = document.getElementById("q_label").value.trim();
      const scope = document.getElementById("q_scope").value;
      const type = document.getElementById("q_type").value;
      const required = document.getElementById("q_required").checked;

      let options = [];
      if (type === 'RADIO' || type === 'CHECKBOX' || type === 'DROPDOWN') {
        options = document.getElementById("q_options_text").value
          .split(/[\n,]/)
          .map(s => s.trim())
          .filter(Boolean);
      }

      const minVal = parseInt(document.getElementById("q_min_val").value || 1);
      const maxVal = parseInt(document.getElementById("q_max_val").value || 5);

      const fieldObj = {
        id: editId || ("fld_" + Date.now().toString(36)),
        label: label,
        scope: scope,
        type: type,
        required: required,
        options: options,
        minVal: minVal,
        maxVal: maxVal
      };

      const sIdx = editingFieldStageIdx >= 0 ? editingFieldStageIdx : 0;
      if (!adminFormSchema.tahapan[sIdx].fields) adminFormSchema.tahapan[sIdx].fields = [];

      if (editingFieldIndex >= 0) {
        adminFormSchema.tahapan[sIdx].fields[editingFieldIndex] = fieldObj;
      } else {
        adminFormSchema.tahapan[sIdx].fields.push(fieldObj);
      }

      closeCustomQuestionModal();
      renderDynamicStagesCanvas();
      triggerAutoSaveSchema();
      showAdminToast("Input berhasil disimpan ke Tahap " + (sIdx + 1), "success");
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
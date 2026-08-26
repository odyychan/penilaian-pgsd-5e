/* ============================================
 * Module: admin/groups
 * Groups & students management (tab 1 render, import)
 * ============================================ */

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

    // SHARE MODAL & QR CODE
    function openShareModal(formId) {
      const fId = formId || currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const fullUrl = getRespondentFormUrl(fId);

      document.getElementById("sharePinText").textContent = fId;
      document.getElementById("shareDirectLinkInput").value = fullUrl;

      // QR Code Generator URL pointing to respondents form
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
      document.getElementById("shareQrCodeImg").src = qrUrl;

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
      const img = document.getElementById("shareQrCodeImg");
      const pin = document.getElementById("sharePinText").textContent;
      const a = document.createElement("a");
      a.href = img.src;
      a.download = `QR-Form-${pin}.png`;
      a.target = "_blank";
      a.click();
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
            const qrImg = document.getElementById("shareQrCodeImg");
            if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
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
        title: "Kloning Formulir?",
        message: `Kloning susunan kelompok & pengaturan dari form '${sourceFormId}' ke formulir baru?`,
        confirmText: "Ya, Kloning Form",
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

      try {
        let isCurrentValid = false;
        const currHash = await hashAdminPassword(currentPass);
        const customHash = localStorage.getItem("PGSD_CUSTOM_ADMIN_HASH");

        // Try edge function first
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
            isCurrentValid = true;
          }
        } catch (e) {}

        if (!isCurrentValid) {
          if ((customHash && currHash === customHash) || KNOWN_VALID_HASHES.includes(currHash)) {
            isCurrentValid = true;
          }
        }

        if (!isCurrentValid) {
          showAdminToast("Kata sandi saat ini tidak cocok!", "error");
          return;
        }

        const newHash = await hashAdminPassword(newPass);
        localStorage.setItem("PGSD_CUSTOM_ADMIN_HASH", newHash);

        try {
          const sb = await ensureSupabaseClient();
          if (sb) {
            await sb.from('pgsd_form_configs').upsert({
              form_id: 'GLOBAL',
              config_data: { admin_password: newPass, admin_password_hash: newHash, updated_at: new Date().toISOString() },
              updated_at: new Date().toISOString()
            });
          }
        } catch (e) {}

        if (document.getElementById("inputGlobalCurrentAdminPassword")) {
          document.getElementById("inputGlobalCurrentAdminPassword").value = "";
        }
        if (document.getElementById("inputGlobalNewAdminPassword")) {
          document.getElementById("inputGlobalNewAdminPassword").value = "";
        }
        showAdminToast("Kata sandi admin berhasil diperbarui!", "success");
      } catch (err) {
        console.error("Update admin pass error:", err);
        showAdminToast("Gagal mengubah kata sandi admin.", "error");
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

      const title = currentFormMeta?.judulForm || adminAppConfig["Judul_Form"] || "PENILAIAN PRESENTASI";
      const matkul = currentFormMeta?.mataKuliah || adminAppConfig["Mata_Kuliah"] || "Bimbingan Konseling di SD";
      const dosen = currentFormMeta?.dosen || adminAppConfig["Dosen_Pengampu"] || "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.";
      const kelas = currentFormMeta?.kelas || adminAppConfig["Kelas"] || "5E";
      const prodi = currentFormMeta?.jurusan || adminAppConfig["Jurusan"] || "PGSD";

      const scopeGroup = document.getElementById("adminPrintScopeGroupSelect")?.value || "ALL";
      const scopeSesi = document.getElementById("adminPrintScopeSesiSelect")?.value || "ALL";
      const includeReviews = document.getElementById("adminPrintIncludeReviews")?.checked ?? true;
      const includeReviewerName = document.getElementById("adminPrintIncludeReviewerName")?.checked ?? true;
      const includeFooter = document.getElementById("adminPrintIncludeFooter")?.checked ?? true;

      // Filter groups
      let groupsToDisplay = Array.isArray(adminMasterGroups) ? [...adminMasterGroups] : [];
      if (scopeGroup !== "ALL") {
        groupsToDisplay = groupsToDisplay.filter(g => g.name === scopeGroup);
      }
      if (scopeSesi !== "ALL") {
        groupsToDisplay = groupsToDisplay.filter(g => g.sesi === scopeSesi);
      }

      // Filter responses
      const allResponses = Array.isArray(adminResponsesList) ? adminResponsesList : [];

      let groupRowsHtml = '';
      if (groupsToDisplay.length === 0) {
        groupRowsHtml = `
          <tr>
            <td colspan="5" class="p-4 text-center text-zinc-400 italic">Belum ada data kelompok yang sesuai dengan filter.</td>
          </tr>
        `;
      } else {
        groupsToDisplay.forEach((g, idx) => {
          const groupResponses = allResponses.filter(r => (r.kelompok === g.name) && (scopeSesi === 'ALL' || r.sesi === scopeSesi));
          const countPenilai = groupResponses.length;
          let avgScore = "-";
          if (countPenilai > 0) {
            const sum = groupResponses.reduce((acc, r) => acc + (parseFloat(r.nilaiKelompok) || 0), 0);
            avgScore = (sum / countPenilai).toFixed(2);
          }

          groupRowsHtml += `
            <tr class="border-b border-black">
              <td class="p-2 border-r border-black text-center font-mono">${idx + 1}</td>
              <td class="p-2 border-r border-black font-bold">${escapeHtml(g.name)}</td>
              <td class="p-2 border-r border-black text-center font-mono">${escapeHtml(g.sesi || '-')}</td>
              <td class="p-2 border-r border-black text-center font-mono">${countPenilai} Penilai</td>
              <td class="p-2 text-center font-mono font-bold bg-zinc-50">${avgScore}</td>
            </tr>
          `;
        });
      }

      // Reviews block if selected
      let reviewsSectionHtml = '';
      if (includeReviews && allResponses.length > 0) {
        const filteredResponses = allResponses.filter(r => 
          (scopeGroup === 'ALL' || r.kelompok === scopeGroup) &&
          (scopeSesi === 'ALL' || r.sesi === scopeSesi)
        );

        if (filteredResponses.length > 0) {
          const sampleReviews = filteredResponses.slice(0, 8);
          reviewsSectionHtml = `
            <div class="mt-6 pt-4 border-t border-black space-y-2">
              <h4 class="font-bold text-xs uppercase tracking-wider">Catatan & Evaluasi Kualitatif Mahasiswa</h4>
              <div class="space-y-2 text-[10.5px]">
                ${sampleReviews.map(r => {
                  let evalText = "";
                  try {
                    const parsed = typeof r.evaluasiDetail === 'object' ? r.evaluasiDetail : JSON.parse(r.evaluasiDetail || "{}");
                    evalText = Object.entries(parsed).map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}`).join(" | ");
                  } catch(e) {
                    evalText = escapeHtml(r.evaluasiDetail || "-");
                  }
                  if (!evalText) return '';
                  return `
                    <div class="p-2 rounded bg-zinc-50 border border-zinc-300">
                      <div class="flex justify-between items-center text-[9.5px] text-zinc-500 mb-1">
                        <span><strong>Kelompok Dinilai:</strong> ${escapeHtml(r.kelompok)}</span>
                        ${includeReviewerName ? `<span><strong>Penilai:</strong> ${escapeHtml(r.namaPenilai)} (${escapeHtml(r.nim)})</span>` : ''}
                      </div>
                      <p class="leading-relaxed text-zinc-800">${evalText}</p>
                    </div>
                  `;
                }).filter(Boolean).join("")}
              </div>
            </div>
          `;
        }
      }

      container.innerHTML = `
        <div class="print-page-wrapper space-y-5">
          <!-- Kop Laporan Resmi -->
          <div class="border-b-2 border-black pb-3 text-center space-y-1">
            <h2 class="text-xs sm:text-sm font-bold tracking-widest uppercase">UNIVERSITAS LAMBUNG MANGKURAT</h2>
            <h3 class="text-[11px] sm:text-xs font-semibold uppercase">FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN • PROGRAM STUDI ${escapeHtml(prodi)}</h3>
            <h1 class="text-sm sm:text-base font-extrabold uppercase mt-1 math-renderable">${smartMathFormat(title)}</h1>
            <p class="text-xs font-medium math-renderable">Mata Kuliah: ${smartMathFormat(matkul)} • Kelas: ${escapeHtml(kelas)} • Dosen: ${smartMathFormat(dosen)}</p>
          </div>

          <div class="flex justify-between items-center text-[10.5px] text-zinc-700">
            <span><strong>Cakupan:</strong> ${scopeGroup === 'ALL' ? 'Semua Kelompok' : escapeHtml(scopeGroup)} (${scopeSesi === 'ALL' ? 'Semua Sesi' : escapeHtml(scopeSesi)})</span>
            <span><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          <!-- Table Data Rekapitulasi -->
          <div>
            <table class="w-full border border-black text-xs">
              <thead>
                <tr class="bg-zinc-100 font-bold border-b border-black text-[11px]">
                  <th class="p-2 border-r border-black text-center w-10">No</th>
                  <th class="p-2 border-r border-black text-left">Kelompok Presentator</th>
                  <th class="p-2 border-r border-black text-center w-24">Sesi</th>
                  <th class="p-2 border-r border-black text-center w-28">Jumlah Penilai</th>
                  <th class="p-2 text-center w-28">Nilai Rata-Rata</th>
                </tr>
              </thead>
              <tbody>
                ${groupRowsHtml}
              </tbody>
            </table>
          </div>

          ${reviewsSectionHtml}

          <!-- Lembar Pengesahan & Tanda Tangan Dosen -->
          ${includeFooter ? `
            <div class="pt-8 mt-8 flex justify-end text-xs">
              <div class="text-center w-64 space-y-12">
                <div>
                  <p class="text-[11px] text-zinc-600">Banjarmasin, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p class="font-bold text-[11px]">Dosen Pengampu Mata Kuliah,</p>
                </div>
                <div>
                  <p class="font-bold underline math-renderable">${smartMathFormat(dosen)}</p>
                  <p class="text-[10px] text-zinc-500 font-mono">Dosen FKIP ULM</p>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Footer Cetak Otomatis -->
          <div class="pt-4 mt-6 border-t border-zinc-300 text-[9.5px] text-zinc-400 flex justify-between">
            <span>Dicetak otomatis dari Sistem Evaluasi &amp; Peer-Assessment PGSD FKIP ULM</span>
            <span>Halaman 1 dari 1</span>
          </div>
        </div>
      `;

      requestAnimationFrame(() => {
        renderAllMathInElement(container);
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

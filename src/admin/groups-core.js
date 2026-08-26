/* src/admin/groups-core.js */
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
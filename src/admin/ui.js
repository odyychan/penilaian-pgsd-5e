/* ============================================
 * Module: admin/ui
 * Master hub, tab switching, toast, dropdown, UI controllers
 * ============================================ */

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

    function renderHubFormsGrid() {
      const container = document.getElementById("hubFormsGrid");
      const emptyEl = document.getElementById("emptyHubForms");
      const countEl = document.getElementById("hubTotalFormsCount");
      container.innerHTML = "";

      const query = (document.getElementById("searchHubFormsInput")?.value || "").trim().toLowerCase();
      const statusFilter = document.getElementById("filterHubStatusSelect")?.value || "ALL";

      let visibleCount = 0;
      if (countEl) countEl.textContent = `${formsRegistryList.length} Formulir Terdaftar`;

      formsRegistryList.forEach(form => {
        const fId = form.formId || DEFAULT_PRIMARY_FORM_ID;
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
        card.className = "bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-zinc-300 transition-all duration-200 group";

        card.innerHTML = `
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono font-bold text-xs tracking-wider">
                  PIN: ${fId}
                </span>
                ${isPrimary ? '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">Utama</span>' : ''}
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
                title="Kloning / Duplikat Form Ini"
              >
                <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
                </svg>
                <span>Kloning</span>
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
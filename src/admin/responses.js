/* ============================================
 * Module: admin/responses
 * Responses list, attendance tracker, modal controllers
 * ============================================ */

    // TAB 3: RESPONSES LIST & SCOPED DELETE
    // =========================================================================
    async function fetchAdminResponsesList(force = false) {
      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      
      // 🚀 Instant SWR Hydration: Tampilkan cache respons seketika (0 ms)
      if (!force && adminResponsesList.length === 0) {
        const cached = localStorage.getItem(`PGSD_CACHE_RESPONSES_${targetForm}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              adminResponsesList = parsed;
              renderAdminResponsesList();
            }
          } catch(e){}
        }
      }

      // ⚡ FAST-PATH: Ambil langsung dari Supabase Database (< 40ms)
      const sb = await ensureSupabaseClient();
      if (sb) {
        try {
          const { data: sbResponses, error: sbErr } = await sb
            .from('pgsd_responses')
            .select('*')
            .eq('form_id', targetForm)
            .order('created_at', { ascending: false });

          if (!sbErr && Array.isArray(sbResponses)) {
            adminResponsesList = sbResponses.map(r => ({
              rowIndex: r.id,
              idRespons: r.id_respons,
              timestamp: new Date(r.created_at).toLocaleString('id-ID'),
              sesi: r.sesi,
              email: r.email,
              namaPenilai: r.nama_penilai,
              peran: r.peran_penilai || "Mahasiswa",
              nim: r.nim_penilai,
              kelompok: r.kelompok_dinilai,
              nilaiKelompok: r.nilai_kelompok,
              best1: r.best_presenter_1,
              best2: r.best_presenter_2,
              evaluasiDetail: JSON.stringify(r.evaluasi_detail || {}),
              customAnswers: JSON.stringify(r.custom_answers || {}),
              status: r.status || "VALID"
            }));
            try {
              localStorage.setItem(`PGSD_CACHE_RESPONSES_${targetForm}`, JSON.stringify(adminResponsesList));
            } catch(e){}
            renderAdminResponsesList();
            return;
          }
        } catch(err) {
          console.warn("Supabase fetch responses fallback notice:", err);
        }
      }

      // 🛡️ Fallback Standar: Jika Supabase belum memiliki data, baca via Google Apps Script
      const apiUrl = getApiUrl();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${apiUrl}?action=adminGetResponsesList&formId=${encodeURIComponent(targetForm)}&_t=${Date.now()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const res = await response.json();

        if (res.success && Array.isArray(res.responses)) {
          adminResponsesList = res.responses;
          try {
            localStorage.setItem(`PGSD_CACHE_RESPONSES_${targetForm}`, JSON.stringify(adminResponsesList));
          } catch(e){}
          renderAdminResponsesList();
        }
      } catch (e) {
        console.warn("fetchAdminResponsesList timed out or failed:", e);
      }
    }

        // =========================================================================
    // JADWAL AKSES & PELACAK PARTISIPASI MAHASISWA (ATTENDANCE TRACKER)
    // =========================================================================
    let currentAttendanceFilter = 'ALL';

    function handleScheduleToggle(enabled) {
      const container = document.getElementById('scheduleFieldsContainer');
      if (!container) return;
      if (enabled) {
        container.classList.remove('opacity-40', 'pointer-events-none');
      } else {
        container.classList.add('opacity-40', 'pointer-events-none');
      }
    }

    function setAttendanceTrackerFilter(filter) {
      currentAttendanceFilter = filter;
      ['ALL', 'MISSING', 'SUBMITTED'].forEach(f => {
        const btn = document.getElementById(`btnTrackerFilter_${f}`);
        if (btn) {
          if (f === filter) {
            btn.className = "px-2.5 py-1 rounded-lg font-bold bg-white text-zinc-900 shadow-2xs cursor-pointer text-xs transition";
          } else {
            btn.className = "px-2.5 py-1 rounded-lg font-medium text-zinc-500 hover:bg-white/60 cursor-pointer text-xs transition";
          }
        }
      });
      renderAdminAttendanceTracker();
    }

    function getAllRosterStudents() {
      const students = [];
      (adminMasterGroups || []).forEach(g => {
        (g.members || []).forEach(m => {
          students.push({
            nim: (m.nim || "").trim(),
            nama: (m.name || m.nama || "").trim(),
            kelompok: g.name || "Kelompok",
            role: m.status || m.role || 'Anggota'
          });
        });
      });
      return students;
    }

    function renderAdminAttendanceTracker() {
      const listContainer = document.getElementById("attendanceTrackerListContainer");
      if (!listContainer) return;
      listContainer.innerHTML = "";

      const allStudents = getAllRosterStudents();
      const searchQuery = (document.getElementById("trackerSearchInput")?.value || "").trim().toLowerCase();

      let submittedCount = 0;
      let missingCount = 0;

      const studentStatuses = allStudents.map(student => {
        const studentNimClean = student.nim.toLowerCase();
        const studentNamaClean = student.nama.toLowerCase();

        // Find responses sent by this student
        const matchedResponses = (adminResponsesList || []).filter(r => {
          const rNim = (r.nim || "").trim().toLowerCase();
          const rNama = (r.namaPenilai || "").trim().toLowerCase();
          return (rNim && studentNimClean && rNim === studentNimClean) || (rNama && studentNamaClean && rNama === studentNamaClean);
        });

        const isSubmitted = matchedResponses.length > 0;
        if (isSubmitted) submittedCount++;
        else missingCount++;

        return {
          ...student,
          isSubmitted,
          submittedCount: matchedResponses.length,
          ratedGroups: matchedResponses.map(r => r.kelompok)
        };
      });

      // Update counters & progress bar
      const totalStudents = allStudents.length;
      const percent = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

      const elPercent = document.getElementById("trackerParticipationPercent");
      const elCountSub = document.getElementById("trackerCountSubmitted");
      const elCountMis = document.getElementById("trackerCountMissing");
      const elBar = document.getElementById("trackerProgressBar");

      const pillAll = document.getElementById("countPill_ALL");
      const pillMis = document.getElementById("countPill_MISSING");
      const pillSub = document.getElementById("countPill_SUBMITTED");

      if (elPercent) elPercent.textContent = `${percent}%`;
      if (elCountSub) elCountSub.textContent = `🟢 Sudah: ${submittedCount}`;
      if (elCountMis) elCountMis.textContent = `🔴 Belum: ${missingCount}`;
      if (elBar) elBar.style.width = `${percent}%`;

      if (pillAll) pillAll.textContent = totalStudents;
      if (pillMis) pillMis.textContent = missingCount;
      if (pillSub) pillSub.textContent = submittedCount;

      // Filter and render cards
      let visibleStudents = studentStatuses.filter(s => {
        if (currentAttendanceFilter === 'MISSING' && s.isSubmitted) return false;
        if (currentAttendanceFilter === 'SUBMITTED' && !s.isSubmitted) return false;
        if (searchQuery) {
          const text = `${s.nama} ${s.nim} ${s.kelompok}`.toLowerCase();
          if (!text.includes(searchQuery)) return false;
        }
        return true;
      });

      if (visibleStudents.length === 0) {
        listContainer.innerHTML = `
          <div class="col-span-full p-4 text-center text-xs text-zinc-400">
            Tidak ada mahasiswa yang sesuai dengan filter saat ini.
          </div>
        `;
        return;
      }

      visibleStudents.forEach((st, idx) => {
        const card = document.createElement("div");
        card.className = `p-3 rounded-xl border flex items-center justify-between gap-2.5 transition ${st.isSubmitted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-zinc-200 shadow-2xs'}`;

        card.innerHTML = `
          <div class="min-w-0 flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${st.isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${st.isSubmitted ? '✓' : '✕'}
            </span>
            <div class="min-w-0">
              <h5 class="font-bold text-xs text-zinc-900 truncate">${st.nama}</h5>
              <div class="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                <span>${st.nim || '-'}</span>
                <span>•</span>
                <span class="font-sans font-semibold text-zinc-600">${st.kelompok}</span>
              </div>
            </div>
          </div>

          <div class="shrink-0 text-right">
            ${st.isSubmitted 
              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200/80 block">
                  ${st.submittedCount} Nilai
                 </span>`
              : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-200/80 block">
                  Belum
                 </span>`
            }
          </div>
        `;

        listContainer.appendChild(card);
      });
    }

    function copyWhatsAppAttendanceReminder() {
      const allStudents = getAllRosterStudents();
      const missingStudents = allStudents.filter(student => {
        const studentNimClean = student.nim.toLowerCase();
        const studentNamaClean = student.nama.toLowerCase();
        const hasSubmitted = (adminResponsesList || []).some(r => {
          const rNim = (r.nim || "").trim().toLowerCase();
          const rNama = (r.namaPenilai || "").trim().toLowerCase();
          return (rNim && studentNimClean && rNim === studentNimClean) || (rNama && studentNamaClean && rNama === studentNamaClean);
        });
        return !hasSubmitted;
      });

      const judulForm = adminAppConfig["Judul_Form"] || currentFormMeta?.judulForm || "Penilaian Peer-Assessment";
      const mataKuliah = adminAppConfig["Mata_Kuliah"] || currentFormMeta?.mataKuliah || "Mata Kuliah";
      const kelas = adminAppConfig["Kelas"] || currentFormMeta?.kelas || "5E";
      const dosen = adminAppConfig["Dosen_Pengampu"] || currentFormMeta?.dosen || "Dosen Pengampu";

      const deadline = adminAppConfig["Jadwal_Aktif"] && adminAppConfig["Jadwal_Selesai"]
        ? new Date(adminAppConfig["Jadwal_Selesai"]).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WITA'
        : "Segera sebelum perkuliahan berakhir";

      const formUrl = new URL(window.location.href);
      formUrl.pathname = formUrl.pathname.replace(/admin\.html$/i, "index.html");
      if (!formUrl.pathname.endsWith("index.html")) formUrl.pathname = formUrl.pathname.replace(/\/?$/, "/index.html");
      formUrl.search = `?id=${encodeURIComponent(currentFormId || DEFAULT_PRIMARY_FORM_ID)}`;

      let message = `📢 *PENGINGAT PENGISIAN PENILAIAN PEER-ASSESSMENT*
`;
      message += `----------------------------------------
`;
      message += `📖 *Mata Kuliah:* ${mataKuliah}
`;
      message += `🏫 *Kelas:* ${kelas} | *Dosen:* ${dosen}
`;
      message += `📝 *Formulir:* ${judulForm}
`;
      message += `⏱️ *Batas Waktu:* ${deadline}
`;
      message += `----------------------------------------

`;

      if (missingStudents.length === 0) {
        message += `🎉 *Luar biasa!* Seluruh mahasiswa (${allStudents.length} orang) telah menyelesaikan pengisian penilaian peer-assessment. Terima kasih!`;
      } else {
        message += `Berikut daftar *${missingStudents.length} mahasiswa* yang *belum mengisi* formulir penilaian:

`;
        missingStudents.forEach((st, idx) => {
          message += `${idx + 1}. ${st.nama} (${st.nim}) - ${st.kelompok}
`;
        });
        message += `
Mohon rekan-rekan di atas untuk segera mengisi penilaian melalui tautan resmi berikut:
`;
        message += `🔗 *${formUrl.toString()}*

`;
        message += `Terima kasih atas kerja sama dan kedisiplinan rekan-rekan semua. 🙏`;
      }

      navigator.clipboard.writeText(message).then(() => {
        showAdminToast(`Draf pesan WhatsApp (${missingStudents.length} mahasiswa belum mengisi) berhasil disalin!`, "success");
      }).catch(err => {
        const textarea = document.createElement("textarea");
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showAdminToast(`Draf pesan WhatsApp (${missingStudents.length} mahasiswa) berhasil disalin!`, "success");
      });
    }

    function renderAdminResponsesList() {
      const container = document.getElementById("adminResponsesCardsContainer");
      const emptyEl = document.getElementById("emptyAdminResponses");
      container.innerHTML = "";

      const query = (document.getElementById("searchResponseInput")?.value || "").trim().toLowerCase();
      const groupFilter = document.getElementById("filterResponseGroupSelect")?.value || "ALL";
      const roleFilter = document.getElementById("filterResponseRoleSelect")?.value || "ALL";

      let visibleCount = 0;

      adminResponsesList.forEach(r => {
        let isMatch = true;
        if (query) {
          const text = `${r.namaPenilai} ${r.nim} ${r.email} ${r.kelompok}`.toLowerCase();
          if (!text.includes(query)) isMatch = false;
        }
        if (groupFilter !== "ALL" && r.kelompok !== groupFilter) isMatch = false;
        if (roleFilter !== "ALL" && (r.peran || "Mahasiswa") !== roleFilter) isMatch = false;

        if (!isMatch) return;
        visibleCount++;

        const card = document.createElement("div");
        card.className = "bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-3 flex flex-col justify-between";

        card.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-1 text-[10px] text-zinc-400 font-mono">
              <span>${r.timestamp}</span>
              <span class="px-1.5 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-700">${r.sesi}</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-xs text-zinc-900">${r.namaPenilai}</span>
                <span class="text-[9px] px-1 rounded bg-zinc-100 font-mono text-zinc-600">${r.peran || 'Mahasiswa'}</span>
              </div>
              <p class="text-[10px] text-zinc-400 font-mono">${r.nim || r.email}</p>
            </div>
            <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs flex items-center justify-between">
              <div>
                <span class="text-[10px] text-zinc-400 block">Menilai:</span>
                <span class="font-bold text-zinc-800">${r.kelompok}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-zinc-400 block">Skor:</span>
                <span class="font-mono font-bold text-sm text-indigo-700">${r.nilaiKelompok}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
            <span class="text-[10px] text-zinc-400 font-mono truncate">ID: ${r.idRespons}</span>
            <button type="button" onclick="deleteSingleResponse('${r.idRespons}', ${r.rowIndex})" class="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer" title="Hapus Data Ini">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        `;

        container.appendChild(card);
      });

      if (visibleCount === 0) emptyEl.classList.remove("hidden");
      else emptyEl.classList.add("hidden");
      renderAdminAttendanceTracker();
    }

    async function deleteSingleResponse(idRespons, rowIndex) {
      const ok = await showAppConfirm({
        title: "Hapus Respons Penilaian?",
        message: `Hapus respons ID '${idRespons}' secara permanen? Data penilaian ini akan dihapus dari sistem.`,
        confirmText: "Ya, Hapus Respons",
        type: "danger"
      });
      if (!ok) return;
      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const apiUrl = getApiUrl();

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "adminDeleteSingleResponse",
            formId: targetForm,
            idRespons: idRespons,
            rowIndex: rowIndex
          })
        });
        const res = await response.json();
        if (res.success) {
          showAdminToast("Respons berhasil dihapus.", "success");
          fetchAdminResponsesList(true);
        } else {
          showAdminToast("Gagal menghapus: " + res.error, "error");
        }
      } catch (e) {
        showAdminToast("Error koneksi saat menghapus respons.", "error");
      }
    }

    // SCOPED DELETE CONTROLLERS
    function openScopedDeleteModal() {
      populateScopedTargets();
      document.getElementById("inputScopedConfirmKeyword").value = "";
      document.getElementById("btnExecuteScopedDelete").disabled = true;
      document.getElementById("scopedDeleteModal").classList.remove("hidden");
      updateScopedImpactStats();
    }

    function closeScopedDeleteModal() {
      document.getElementById("scopedDeleteModal").classList.add("hidden");
    }

    function populateScopedTargets() {
      const gSel = document.getElementById("scopedTargetGroupSelect");
      const sSel = document.getElementById("scopedTargetSesiSelect");
      gSel.innerHTML = "";
      sSel.innerHTML = "";

      const groups = Array.from(new Set(adminMasterGroups.map(g => g.name))).filter(Boolean);
      groups.forEach(g => {
        gSel.innerHTML += `<option value="${g}">${g}</option>`;
      });

      const sesis = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5", "Minggu 6", "Minggu 7", "Minggu 8", "Minggu 9", "Minggu 10"];
      sesis.forEach(s => {
        sSel.innerHTML += `<option value="${s}">${s}</option>`;
      });
    }

    function handleScopeTypeChange() {
      const val = document.querySelector('input[name="scopedDeleteScopeType"]:checked')?.value;
      const gBox = document.getElementById("scopedTargetGroupContainer");
      const sBox = document.getElementById("scopedTargetSesiContainer");
      if (val === 'KELOMPOK') {
        gBox.classList.remove("hidden");
        sBox.classList.add("hidden");
      } else {
        gBox.classList.add("hidden");
        sBox.classList.remove("hidden");
      }
      updateScopedImpactStats();
    }

    function updateScopedImpactStats() {
      const mode = document.querySelector('input[name="scopedDeleteScopeType"]:checked')?.value || 'KELOMPOK';
      const targetVal = mode === 'KELOMPOK' 
        ? document.getElementById("scopedTargetGroupSelect").value 
        : document.getElementById("scopedTargetSesiSelect").value;

      let matchCount = 0;
      adminResponsesList.forEach(r => {
        if (mode === 'KELOMPOK' && r.kelompok === targetVal) matchCount++;
        else if (mode === 'SESI' && r.sesi === targetVal) matchCount++;
      });

      document.getElementById("scopedMatchingCountBadge").textContent = `${matchCount} Data Cocok`;
    }

    function validateScopedConfirmKeyword(val) {
      const btn = document.getElementById("btnExecuteScopedDelete");
      btn.disabled = val.trim().toUpperCase() !== 'HAPUS';
    }

    async function executeScopedDelete(e) {
      e.preventDefault();
      const mode = document.querySelector('input[name="scopedDeleteScopeType"]:checked')?.value || 'KELOMPOK';
      const targetVal = mode === 'KELOMPOK' 
        ? document.getElementById("scopedTargetGroupSelect").value 
        : document.getElementById("scopedTargetSesiSelect").value;

      const targetForm = currentFormId || DEFAULT_PRIMARY_FORM_ID;
      const apiUrl = getApiUrl();

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "adminDeleteScopedResponses",
            formId: targetForm,
            mode: mode,
            targetValue: targetVal
          })
        });
        const res = await response.json();
        if (res.success) {
          closeScopedDeleteModal();
          showAdminToast(res.message || "Respons kategori berhasil dihapus.", "success");
          fetchAdminResponsesList(true);
        } else {
          showAdminToast("Gagal menghapus: " + res.error, "error");
        }
      } catch (err) {
        showAdminToast("Error server saat menghapus.", "error");
      }
    }

    // =========================================================================
    // CREATION WIZARD & SHARE MODAL CONTROLLERS
    // =========================================================================
    function openCreateFormModal() {
      generateRandomWizPin();
      document.getElementById("modalCreateForm").classList.remove("hidden");
    }

    function closeCreateFormModal() {
      document.getElementById("modalCreateForm").classList.add("hidden");
    }

    function generateRandomWizPin() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let pin = "";
      for (let i = 0; i < 4; i++) {
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const pinInput = document.getElementById("wiz_Form_Id");
      if (pinInput) pinInput.value = pin;
      handleWizTitleInput();
    }

    function handleWizTitleInput() {
      const pin = (document.getElementById("wiz_Form_Id")?.value || "").trim().toUpperCase();
      const slugInput = document.getElementById("wiz_Form_Slug");
      if (slugInput) slugInput.value = pin.toLowerCase();
      const preview = document.getElementById("wizUrlPreview");
      if (preview) preview.textContent = `/?id=${pin}`;
    }

    async function handleCreateFormSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById("btnSubmitCreateForm");
      btn.disabled = true;
      btn.innerHTML = `<span>Membuat Formulir...</span>`;

      let customFormId = document.getElementById("wiz_Form_Id")?.value?.trim()?.toUpperCase();
      if (!customFormId) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (let i = 0; i < 4; i++) customFormId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      let customSlug = customFormId.toLowerCase();
      const judulForm = "Penilaian Perkuliahan";
      const mataKuliah = "-";
      const dosen = "-";
      const kelas = "5E";
      const jurusan = "PGSD";
      const sesi = "Minggu 1";
      const rosterOption = document.querySelector('input[name="wizRosterOption"]:checked')?.value || 'empty';

      try {
        // ⚡ FAST-PATH (< 30ms): Simpan langsung ke Supabase PostgreSQL
        const sb = await ensureSupabaseClient();
        if (!sb) throw new Error("Koneksi Supabase belum siap.");

        const newFormRow = {
          form_id: customFormId,
          form_slug: customSlug,
          judul_form: judulForm,
          mata_kuliah: mataKuliah,
          dosen: dosen,
          kelas: kelas,
          jurusan: jurusan,
          sesi_aktif: sesi,
          status: 'AKTIF',
          is_primary: false,
          google_drive_folder: 'https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK'
        };

        const { error: insErr } = await sb.from('pgsd_forms').insert([newFormRow]);
        if (insErr) throw new Error(insErr.message || JSON.stringify(insErr));

        const initialConfig = {
          Judul_Form: judulForm,
          Mata_Kuliah: mataKuliah,
          Dosen_Pengampu: dosen,
          Kelas: kelas,
          Jurusan: jurusan,
          Deskripsi_Form: '',
          Sesi_Minggu_Aktif: sesi,
          Domain_Email_Wajib: 'mhs.ulm.ac.id, ulm.ac.id',
          Nilai_Kelompok_Min: '50',
          Nilai_Kelompok_Max: '100',
          Pembuat_Web_Prefix: 'Dibuat oleh',
          Pembuat_Web_Nama: '',
          Pembuat_Web_Nim: '',
          Tampilkan_Ulasan_Publik: 'AKTIF',
          Kewajiban_Menilai_Penyaji: 'BEBAS_PENUH_DI_SESINYA',
          Maksimal_Karakter_Evaluasi: '500',
          Maksimal_Pilihan_Presentator_Terbaik: '2'
        };

        const initialSchema = getBlankFormSchema();

        await sb.from('pgsd_form_configs').upsert({
          form_id: customFormId,
          config_data: initialConfig,
          schema_data: initialSchema,
          updated_at: new Date().toISOString()
        });

        if (rosterOption === 'clone_default' && Array.isArray(adminMasterGroups) && adminMasterGroups.length > 0) {
          for (let gIdx = 0; gIdx < adminMasterGroups.length; gIdx++) {
            const g = adminMasterGroups[gIdx];
            const { data: gData } = await sb.from('pgsd_groups').insert([{
              form_id: customFormId,
              name: g.name,
              sesi: g.sesi || sesi || "Minggu 1",
              status: g.status || 'AKTIF',
              display_order: gIdx + 1
            }]).select();

            if (gData && gData[0] && Array.isArray(g.members) && g.members.length > 0) {
              const sToInsert = g.members.map((m, mIdx) => ({
                form_id: customFormId,
                group_id: gData[0].id,
                group_name: g.name,
                nim: m.nim || "-",
                name: m.name || `Mahasiswa ${mIdx + 1}`,
                status: m.status || "AKTIF"
              }));
              await sb.from('pgsd_students').insert(sToInsert);
            }
          }
        }

        closeCreateFormModal();
        showAdminToast(`Formulir PIN: ${customFormId} berhasil dibuat! Silakan atur mata kuliah, dosen, dan pertanyaan di sini.`, "success");

        localStorage.setItem(`PGSD_DRAFT_SCHEMA_${customFormId}`, JSON.stringify(initialSchema));
        localStorage.setItem(`PGSD_CACHE_CONFIG_${customFormId}`, JSON.stringify(initialConfig));
        adminFormSchema = initialSchema;

        // Background 2-Way Realtime Sync ke Google Drive & Google Spreadsheet
        const createPayload = {
          action: "adminCreateForm",
          formId: customFormId,
          customFormId: customFormId,
          customSlug: customSlug,
          judulForm: judulForm,
          mataKuliah: mataKuliah,
          dosen: dosen,
          kelas: kelas,
          jurusan: jurusan,
          sesiAktif: sesi,
          driveFolderId: DEFAULT_DRIVE_FOLDER_ID
        };

        if (typeof GOOGLE_SYNC_EDGE_URL !== 'undefined' && GOOGLE_SYNC_EDGE_URL) {
          fetch(GOOGLE_SYNC_EDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createPayload)
          }).then(r => r.json()).then(res => {
            console.log("Cloud Edge form create success:", res);
          }).catch(e => console.warn("Cloud Edge form create notice:", e));
        }

        const apiUrl = getApiUrl();
        if (apiUrl) {
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(createPayload)
          }).catch(e => console.warn("Background sheet sync notice:", e));
        }

        await fetchFormsRegistry(true);
        openFormWorkspace(customFormId);
      } catch (err) {
        showAdminToast("Gagal membuat formulir: " + err.message, "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Buat Formulir Sekarang</span>`;
      }
    }

    // =========================================================================
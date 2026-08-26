/* ============================================
 * src/student/auth.js
 * Google OAuth, session, account bar
 * ============================================ */


      if (btnK) btnK.className = sub === 'kelompok' ? activeBtnClass : inactiveBtnClass;
      if (btnI) btnI.className = sub === 'individu' ? activeBtnClass : inactiveBtnClass;
      if (btnP) btnP.className = sub === 'presensi' ? activeBtnClass : inactiveBtnClass;

      if (sub === 'kelompok') {
        if (boxK) boxK.classList.remove("hidden");
        if (boxI) boxI.classList.add("hidden");
        if (boxP) boxP.classList.add("hidden");
        if (filterGroupBar) filterGroupBar.classList.remove("hidden");
        if (presensiControlBox) presensiControlBox.classList.add("hidden");
        if (searchBox) searchBox.classList.add("hidden");
      } else if (sub === 'individu') {
        if (boxI) boxI.classList.remove("hidden");
        if (boxK) boxK.classList.add("hidden");
        if (boxP) boxP.classList.add("hidden");
        if (filterGroupBar) filterGroupBar.classList.remove("hidden");
        if (presensiControlBox) presensiControlBox.classList.add("hidden");
        if (searchBox) searchBox.classList.remove("hidden");
        if (triggerRender) filterMahasiswaSearch();
      } else if (sub === 'presensi') {
        const loading = document.getElementById("rekapLoading");
        if (loading) loading.classList.add("hidden");
        if (boxP) boxP.classList.remove("hidden");
        if (boxK) boxK.classList.add("hidden");
        if (boxI) boxI.classList.add("hidden");
        if (filterGroupBar) filterGroupBar.classList.add("hidden");
        if (presensiControlBox) presensiControlBox.classList.remove("hidden");
        if (searchBox) searchBox.classList.add("hidden");
        if (triggerRender) {
          populatePresensiFilters();
          renderRekapPresensi();
        }
      }
    }

    function populateRekapFilter(summaryListParam) {
      const sesiSelect = document.getElementById("rekapSesiFilter");
      const groupSelect = document.getElementById("rekapGroupFilter");
      if (!groupSelect) return;

      const currentSesi = sesiSelect?.value || "ALL";
      const currentGroup = groupSelect?.value || "ALL";

      // 1. Kumpulkan seluruh sesi dari seluruh sumber (rekap summary, allStudents, groupsData)
      const allSessions = new Set();
      (currentRekapData?.summary || []).forEach(g => { if (g.sesi) allSessions.add(g.sesi.trim()); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.sesi) allSessions.add(g.sesi.trim()); });
      (allStudentsData || []).forEach(s => { if (s.sesi) allSessions.add(s.sesi.trim()); });
      (groupsData || []).forEach(g => { if (g.sesi) allSessions.add(g.sesi.trim()); });

      if (sesiSelect) {
        sesiSelect.innerHTML = '<option value="ALL">Semua Sesi (Keseluruhan)</option>';
        Array.from(allSessions).sort().forEach(s => {
          const opt = document.createElement("option");
          opt.value = s;
          opt.textContent = s;
          if (s === currentSesi) opt.selected = true;
          sesiSelect.appendChild(opt);
        });
      }

      // 2. Kumpulkan kelompok (jika filter sesi dipilih, tampilkan kelompok yang relevan atau semua)
      const selectedSesiVal = sesiSelect?.value || "ALL";
      const allKelompokMap = new Map(); // kelompok -> sesi

      (currentRekapData?.summary || []).forEach(g => { if (g.kelompok) allKelompokMap.set(g.kelompok, g.sesi || ''); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.kelompok) allKelompokMap.set(g.kelompok, g.sesi || ''); });
      (groupsData || []).forEach(g => { if (g.name) allKelompokMap.set(g.name, g.sesi || ''); });
      (allStudentsData || []).forEach(s => { if (s.kelompok) allKelompokMap.set(s.kelompok, s.sesi || ''); });

      groupSelect.innerHTML = '<option value="ALL">Semua Kelompok</option>';
      Array.from(allKelompokMap.keys()).sort().forEach(kelompok => {
        const sesi = allKelompokMap.get(kelompok);
        if (selectedSesiVal !== "ALL" && sesi && sesi.toLowerCase() !== selectedSesiVal.toLowerCase()) {
          return; // Lewati kelompok yang berbeda sesi jika filter sesi spesifik aktif
        }
        const opt = document.createElement("option");
        opt.value = kelompok;
        opt.textContent = `${kelompok}${sesi ? ' (' + sesi + ')' : ''}`;
        if (kelompok === currentGroup) opt.selected = true;
        groupSelect.appendChild(opt);
      });
    }

    function onRekapSesiFilterChange() {
      // Perbarui dropdown kelompok agar relevan dengan sesi terpilih
      const groupSelect = document.getElementById("rekapGroupFilter");
      if (groupSelect) groupSelect.value = "ALL";
      populateRekapFilter();
      renderBothRekapViews();
    }

    function filterRekapDisplay() {
      renderBothRekapViews();
    }

    // =========================================================================
    // KONTROL & FILTER TAB STATUS PENGISIAN PRESENSI MAHASISWA
    // =========================================================================
    // =========================================================================
    // KONTROL & FILTER TAB STATUS PENGISIAN PRESENSI MAHASISWA (PRESENTATOR & MATRIKS)
    // =========================================================================
    function populatePresensiFilters() {
      const presenterSelect = document.getElementById("presensiPresenterFilter");
      const grpSelect = document.getElementById("presensiGroupFilter");
      const statusSelect = document.getElementById("presensiStatusFilter");

      if (!presenterSelect || !grpSelect) return;

      const currentPresenter = presenterSelect.value || "ALL";
      const currentGrp = grpSelect.value || "ALL";
      const currentStatus = statusSelect?.value || "ALL";

      // 1. Kumpulkan seluruh Kelompok Presentator beserta sesinya
      const groupSesiMap = new Map();
      (currentRekapData?.summary || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (groupsData || []).forEach(g => { if (g.name) groupSesiMap.set(g.name.trim(), g.sesi ? g.sesi.trim() : ''); });

      const allPresenterGroups = [];
      groupSesiMap.forEach((sVal, gName) => {
        allPresenterGroups.push({ name: gName, sesi: sVal });
      });
      allPresenterGroups.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      // Populate Presentator Dropdown (Sleek & Concise)
      presenterSelect.innerHTML = '<option value="ALL">Semua</option>';
      allPresenterGroups.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g.name;
        opt.textContent = `${g.name}${g.sesi ? ' (' + g.sesi + ')' : ''}`;
        if (g.name.toLowerCase() === currentPresenter.toLowerCase()) opt.selected = true;
        presenterSelect.appendChild(opt);
      });

      // 2. Kumpulkan seluruh Kelompok Asal Mahasiswa di kelas
      const originGroups = new Set();
      (allStudentsData || []).forEach(s => { if (s.kelompok) originGroups.add(s.kelompok.trim()); });
      (groupsData || []).forEach(g => { if (g.name) originGroups.add(g.name.trim()); });
      const sortedOriginGroups = Array.from(originGroups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      // Populate Kelompok Asal Dropdown (Sleek & Concise)
      grpSelect.innerHTML = '<option value="ALL">Semua Kelompok</option>';
      sortedOriginGroups.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        if (g === currentGrp) opt.selected = true;
        grpSelect.appendChild(opt);
      });

      // 3. Populate Status Dropdown based on presenter selection
      updatePresensiStatusOptions(currentPresenter, currentStatus);
    }

    function updatePresensiStatusOptions(selectedPresenter, currentStatus = "ALL") {
      const statusSelect = document.getElementById("presensiStatusFilter");
      if (!statusSelect) return;

      if (selectedPresenter === "ALL") {
        statusSelect.innerHTML = `
          <option value="ALL">Semua Status</option>
          <option value="LENGKAP">Selesai</option>
          <option value="SEBAGIAN">Sebagian</option>
          <option value="BELUM">Belum Mengisi</option>
        `;
      } else {
        statusSelect.innerHTML = `
          <option value="ALL">Semua Status</option>
          <option value="SUDAH">Sudah Menilai</option>
          <option value="BELUM">Belum Menilai</option>
          <option value="PENYAJI">Anggota Penyaji</option>
        `;
      }

      if (currentStatus) {
        statusSelect.value = currentStatus;
        if (!statusSelect.value) statusSelect.value = "ALL";
      }
    }

    function onPresensiPresenterFilterChange() {
      const presenterSelect = document.getElementById("presensiPresenterFilter");
      const selectedPresenter = presenterSelect ? presenterSelect.value : "ALL";
      updatePresensiStatusOptions(selectedPresenter, "ALL");
      renderRekapPresensi();
    }

    function filterPresensiDisplay() {
      renderRekapPresensi();
    }

    function renderRekapPresensi() {
      const tableHeaderRow = document.getElementById("presensiTableHeaderRow");
      const tableBody = document.getElementById("presensiTableBody");
      const totalMhsBadge = document.getElementById("presensiTotalMhs");
      const sudahMhsBadge = document.getElementById("presensiSudahMhs");
      const sebagianMhsBadge = document.getElementById("presensiSebagianMhs");
      const belumMhsBadge = document.getElementById("presensiBelumMhs");
      const cardTitle1 = document.getElementById("presensiCardTitle1");
      const cardTitle2 = document.getElementById("presensiCardTitle2");
      const cardTitle3 = document.getElementById("presensiCardTitle3");
      const cardTitle4 = document.getElementById("presensiCardTitle4");
      const tableTitleEl = document.getElementById("presensiTableTitle");
      const tableSubtitleEl = document.getElementById("presensiTableSubtitle");
      const countLabel = document.getElementById("presensiFilterResultCount");
      const dosenGuestSection = document.getElementById("dosenGuestPresensiSection");
      const dosenGuestListEl = document.getElementById("dosenGuestList");
      const dosenGuestBadge = document.getElementById("dosenGuestCountBadge");

      if (!tableBody) return;

      const activeSesi = (typeof appConfig !== 'undefined' && (appConfig["Sesi_Minggu_Aktif"] || appConfig["Sesi_Aktif"])) 
        ? (appConfig["Sesi_Minggu_Aktif"] || appConfig["Sesi_Aktif"]).trim() 
        : (currentRekapData?.activeSession || "Minggu 1");

      const presenterFilter = document.getElementById("presensiPresenterFilter")?.value || "ALL";
      const grpFilter = document.getElementById("presensiGroupFilter")?.value || "ALL";
      const statusFilter = document.getElementById("presensiStatusFilter")?.value || "ALL";
      const searchQuery = (document.getElementById("presensiSearchInput")?.value || "").trim().toLowerCase();
      const kewajibanPenyaji = (typeof appConfig !== 'undefined' && appConfig["Kewajiban_Menilai_Penyaji"]) || "WAJIB_NILAI_KELOMPOK_LAIN";

      // === SUMBER KEBENARAN TUNGGAL (Single Source of Truth) ===
      const submittedNimSet = new Set(
        (currentRekapData?.submittedNims || []).map(n => String(n).trim().toLowerCase())
      );
      const submittedNameSet = new Set(
        (currentRekapData?.submittedNames || []).map(n => String(n).trim().toLowerCase())
      );
      const nimToKelompokMap = currentRekapData?.nimToKelompokMap || {};
      const nameToKelompokMap = currentRekapData?.nameToKelompokMap || {};

      // Fallback jika backend lama
      const hasNewFields = currentRekapData?.submittedNims !== undefined;
      if (!hasNewFields && currentRekapData?.summary) {
        currentRekapData.summary.forEach(g => {
          (g.evaluators || []).forEach(e => {
            if (!e || typeof e !== 'object') return;
            if ((e.peran || 'Mahasiswa') !== 'Mahasiswa') return;
            const nim = String(e.nim || '').trim().toLowerCase();
            const nama = String(e.name || '').trim().toLowerCase();
            if (nim && nim !== '-') submittedNimSet.add(nim);
            if (nama) submittedNameSet.add(nama);
          });
        });
      }

      // 1. Kumpulkan seluruh kelompok Presentator yang ada & petakan sesinya
      const groupSesiMap = new Map();
      (currentRekapData?.summary || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (currentRekapData?.summaryMhs || []).forEach(g => { if (g.kelompok) groupSesiMap.set(g.kelompok.trim(), g.sesi ? g.sesi.trim() : ''); });
      (groupsData || []).forEach(g => { if (g.name) groupSesiMap.set(g.name.trim(), g.sesi ? g.sesi.trim() : ''); });

      const allPresenterGroups = [];
      groupSesiMap.forEach((sVal, gName) => {
        allPresenterGroups.push({ name: gName, sesi: sVal });
      });
      allPresenterGroups.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      // Kelompok target yang tampil pada sesi aktif
      const isAllSession = (activeSesi.toUpperCase() === "SEMUA" || activeSesi.toUpperCase() === "ALL");
      const targetSessionGroupNames = isAllSession
        ? allPresenterGroups.map(g => g.name)
        : allPresenterGroups
            .filter(g => g.sesi && g.sesi.toLowerCase() === activeSesi.toLowerCase())
            .map(g => g.name);

      const activeEvaluationGroups = targetSessionGroupNames.length > 0 
        ? targetSessionGroupNames 
        : allPresenterGroups.map(g => g.name);

      // 2. Kumpulkan seluruh mahasiswa dari SEMUA kelompok (unik)
      const allClassStudents = [];
      const seenNimInRoster = new Set();

      if (allStudentsData && allStudentsData.length > 0) {
        allStudentsData.forEach(s => {
          const nim = String(s.nim || "").trim();
          const name = String(s.name || "").trim();
          const grp = String(s.kelompok || "").trim();
          if (!name) return;
          const key = nim && nim !== "-" ? nim.toLowerCase() : name.toLowerCase() + "|" + grp;
          if (seenNimInRoster.has(key)) return;
          seenNimInRoster.add(key);
          allClassStudents.push({ name, nim: nim || "-", kelompok: grp });
        });
      } else if (groupsData && groupsData.length > 0) {
        groupsData.forEach(g => {
          (g.members || []).forEach(m => {
            const name = String(m.name || "").trim();
            const nim = String(m.nim || "").trim();
            const grp = String(g.name || "").trim();
            if (!name) return;
            const key = nim && nim !== "-" ? nim.toLowerCase() : name.toLowerCase() + "|" + grp;
            if (seenNimInRoster.has(key)) return;
            seenNimInRoster.add(key);
            allClassStudents.push({ name, nim: nim || "-", kelompok: grp });
          });
        });
      }

      // 3. Kalkulasi Presensi Mahasiswa
      const isSinglePresenterMode = presenterFilter !== "ALL";
      const singleTargetPresenter = isSinglePresenterMode ? presenterFilter : null;
      const singlePresenterSesi = isSinglePresenterMode ? (groupSesiMap.get(singleTargetPresenter) || '') : '';

      // Update Section Header Title & Subtitle
      if (tableTitleEl && tableSubtitleEl) {
        if (!isSinglePresenterMode) {
          tableTitleEl.textContent = "Matriks Keterisian Penilaian";
          tableSubtitleEl.textContent = "Rekapitulasi keterisian form evaluasi mahasiswa per kelompok.";
        } else {
          tableTitleEl.textContent = `Status Penilaian • ${singleTargetPresenter}`;
          tableSubtitleEl.textContent = `Status evaluasi mahasiswa untuk ${singleTargetPresenter}${singlePresenterSesi ? ' (' + singlePresenterSesi + ')' : ''}.`;
        }
      }

      const studentPresensiList = allClassStudents.map(student => {
        const normNim = String(student.nim || "").trim().toLowerCase();
        const normName = String(student.name || "").trim().toLowerCase();
        const studentGroup = (student.kelompok || "").trim();
        const studentSesi = (groupSesiMap.get(studentGroup) || "").trim();

        let filledKelompok = [];
        if (normNim && normNim !== "-" && nimToKelompokMap[normNim]) {
          filledKelompok = nimToKelompokMap[normNim];
        } else if (nameToKelompokMap[normName]) {
          filledKelompok = nameToKelompokMap[normName];
        } else if (normNim && normNim !== "-" && submittedNimSet.has(normNim)) {
          filledKelompok = activeEvaluationGroups.length > 0 ? [activeEvaluationGroups[0]] : ["Kelompok 1"];
        } else if (submittedNameSet.has(normName)) {
          filledKelompok = activeEvaluationGroups.length > 0 ? [activeEvaluationGroups[0]] : ["Kelompok 1"];
        }

        // Apakah mahasiswa ini adalah anggota kelompok yang sedang tampil pada sesi aktif?
        let isPresenterInActiveSession = false;
        if (activeSesi === "SEMUA" || activeSesi === "ALL") {
          isPresenterInActiveSession = allPresenterGroups.some(g => g.name.toLowerCase() === studentGroup.toLowerCase());
        } else {
          isPresenterInActiveSession = (studentSesi && studentSesi.toLowerCase() === activeSesi.toLowerCase());
        }

        // Tentukan daftar kelompok yang WAJIB dievaluasi oleh mahasiswa ini:
        let targetGroupsToEvaluate = [];
        activeEvaluationGroups.forEach(tgName => {
          // Jangan pernah wajib menilai kelompok sendiri
          if (tgName.toLowerCase() === studentGroup.toLowerCase()) return;

          const tgSesi = (groupSesiMap.get(tgName) || "").trim();
          const isSameSession = (studentSesi && tgSesi && studentSesi.toLowerCase() === tgSesi.toLowerCase());

          // Jika pengaturan bebas penuh di sesinya aktif dan mahasiswa tampil di sesi yang sama dengan kelompok target
          if (kewajibanPenyaji === "BEBAS_PENUH_DI_SESINYA" && isSameSession) {
            return; // Bebas / tidak wajib menilai kelompok lain di sesinya
          }

          targetGroupsToEvaluate.push(tgName);
        });

        const totalTargets = targetGroupsToEvaluate.length;
        const filledTargetsCount = targetGroupsToEvaluate.filter(tg => filledKelompok.some(fk => fk.toLowerCase() === tg.toLowerCase())).length;

        let matrixStatusCategory = "BELUM";
        let matrixStatusLabel = "Belum Mengisi";

        if (totalTargets === 0) {
          matrixStatusCategory = "LENGKAP";
          matrixStatusLabel = isPresenterInActiveSession ? "Selesai (Penyaji)" : "Selesai";
        } else if (filledTargetsCount === totalTargets) {
          matrixStatusCategory = "LENGKAP";
          matrixStatusLabel = isPresenterInActiveSession ? "Selesai (Penyaji)" : "Selesai";
        } else if (filledTargetsCount > 0) {
          matrixStatusCategory = "SEBAGIAN";
          matrixStatusLabel = `Sebagian (${filledTargetsCount}/${totalTargets})`;
        } else {
          matrixStatusCategory = "BELUM";
          matrixStatusLabel = "Belum Mengisi";
        }

        // Kalkulasi Mode Single Presentator
        let singleStatusCategory = "BELUM";
        let singleStatusLabel = "Belum Menilai";
        const isPresenterOfSingle = isSinglePresenterMode && studentGroup.toLowerCase() === singleTargetPresenter.toLowerCase();
        const hasFilledSingle = isSinglePresenterMode && filledKelompok.some(fk => fk.toLowerCase() === singleTargetPresenter.toLowerCase());
        const isSameSessionSingle = isSinglePresenterMode && (studentSesi && singlePresenterSesi && studentSesi.toLowerCase() === singlePresenterSesi.toLowerCase());
        const isExemptSingle = isSinglePresenterMode && !isPresenterOfSingle && (kewajibanPenyaji === "BEBAS_PENUH_DI_SESINYA" && isSameSessionSingle);

        if (isPresenterOfSingle) {
          singleStatusCategory = "PENYAJI";
          singleStatusLabel = "Anggota Penyaji";
        } else if (hasFilledSingle) {
          singleStatusCategory = "SUDAH";
          singleStatusLabel = "Sudah Menilai";
        } else if (isExemptSingle) {
          singleStatusCategory = "BEBAS";
          singleStatusLabel = "Bebas Menilai";
        } else {
          singleStatusCategory = "BELUM";
          singleStatusLabel = "Belum Menilai";
        }

        return {
          name: student.name,
          nim: student.nim || "-",
          kelompok: studentGroup,
          studentSesi,
          filledKelompok,
          isPresenter: isPresenterInActiveSession,
          isPresenterOfSingle,
          hasFilledSingle,
          isExemptSingle,
          matrixStatusCategory,
          matrixStatusLabel,
          singleStatusCategory,
          singleStatusLabel,
          filledTargetsCount,
          totalTargets
        };
      });

      // 4. Filter berdasarkan Kelompok Asal
      const baseScopeList = studentPresensiList.filter(s => {
        if (grpFilter !== "ALL" && s.kelompok !== grpFilter) return false;
        return true;
      });

      // 5. Hitung Statistik & Perbarui Kartu Ringkasan (Concise Titles)
      const totalStudents = baseScopeList.length;

      if (!isSinglePresenterMode) {
        // Mode Matriks Lengkap
        if (cardTitle1) cardTitle1.textContent = "Total Mahasiswa";
        if (cardTitle2) cardTitle2.textContent = "Selesai";
        if (cardTitle3) cardTitle3.textContent = "Sebagian";
        if (cardTitle4) cardTitle4.textContent = "Belum Mengisi";

        const countLengkap = baseScopeList.filter(s => s.matrixStatusCategory === "LENGKAP").length;
        const countSebagian = baseScopeList.filter(s => s.matrixStatusCategory === "SEBAGIAN").length;
        const countBelum = baseScopeList.filter(s => s.matrixStatusCategory === "BELUM").length;
        const pctLengkap = totalStudents > 0 ? Math.round((countLengkap / totalStudents) * 100) : 0;
        const pctSebagian = totalStudents > 0 ? Math.round((countSebagian / totalStudents) * 100) : 0;
        const pctBelum = totalStudents > 0 ? Math.round((countBelum / totalStudents) * 100) : 0;

        if (totalMhsBadge) totalMhsBadge.textContent = `${totalStudents} Mahasiswa`;
        if (sudahMhsBadge) sudahMhsBadge.textContent = `${countLengkap} (${pctLengkap}%)`;
        if (sebagianMhsBadge) sebagianMhsBadge.textContent = `${countSebagian} (${pctSebagian}%)`;
        if (belumMhsBadge) belumMhsBadge.textContent = `${countBelum} (${pctBelum}%)`;
      } else {
        // Mode Single Presenter
        if (cardTitle1) cardTitle1.textContent = "Total Mahasiswa";
        if (cardTitle2) cardTitle2.textContent = "Sudah Menilai";
        if (cardTitle3) cardTitle3.textContent = "Anggota Penyaji";
        if (cardTitle4) cardTitle4.textContent = "Belum Menilai";

        const countSudah = baseScopeList.filter(s => s.singleStatusCategory === "SUDAH").length;
        const countPenyaji = baseScopeList.filter(s => s.singleStatusCategory === "PENYAJI").length;
        const countBelum = baseScopeList.filter(s => s.singleStatusCategory === "BELUM").length;
        const pctSudah = totalStudents > 0 ? Math.round((countSudah / totalStudents) * 100) : 0;
        const pctPenyaji = totalStudents > 0 ? Math.round((countPenyaji / totalStudents) * 100) : 0;
        const pctBelum = totalStudents > 0 ? Math.round((countBelum / totalStudents) * 100) : 0;

        if (totalMhsBadge) totalMhsBadge.textContent = `${totalStudents} Mahasiswa`;
        if (sudahMhsBadge) sudahMhsBadge.textContent = `${countSudah} (${pctSudah}%)`;
        if (sebagianMhsBadge) sebagianMhsBadge.textContent = `${countPenyaji} (${pctPenyaji}%)`;
        if (belumMhsBadge) belumMhsBadge.textContent = `${countBelum} (${pctBelum}%)`;
      }

      // 6. Filter Tabel berdasarkan Status Kepatuhan & Pencarian
      const filteredList = baseScopeList.filter(s => {
        if (!isSinglePresenterMode) {
          if (statusFilter !== "ALL" && s.matrixStatusCategory !== statusFilter) return false;
        } else {
          if (statusFilter !== "ALL" && s.singleStatusCategory !== statusFilter) return false;
        }

        if (searchQuery) {
          const matchName = s.name.toLowerCase().includes(searchQuery);
          const matchNim = s.nim.toLowerCase().includes(searchQuery);
          const matchGroup = s.kelompok.toLowerCase().includes(searchQuery);
          const matchFilled = s.filledKelompok.some(k => k.toLowerCase().includes(searchQuery));
          if (!matchName && !matchNim && !matchGroup && !matchFilled) return false;
        }
        return true;
      });

      if (countLabel) {
        countLabel.textContent = `${filteredList.length} dari ${totalStudents} Mahasiswa`;
      }

      // 7. Render Dynamic Headers (Frozen Left Columns & Compact Responsiveness)
      if (tableHeaderRow) {
        if (!isSinglePresenterMode) {
          let headersHtml = `
            <th class="sticky top-0 left-0 z-40 px-1 py-1.5 w-8 min-w-[32px] max-w-[32px] text-center border-r border-zinc-200 font-mono text-[10px] sm:text-[11px] text-zinc-500 whitespace-nowrap" style="background-color: #f4f4f5 !important;">#</th>
            <th class="sticky top-0 left-[32px] z-40 px-2.5 py-1.5 min-w-[135px] sm:min-w-[160px] max-w-[160px] sm:max-w-[200px] text-left border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-semibold text-[11px] sm:text-xs text-zinc-700 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Mahasiswa &amp; NIM</th>
            <th class="sticky top-0 z-30 bg-zinc-100 px-1.5 sm:px-2 py-1.5 text-center min-w-[60px] sm:min-w-[75px] border-r border-zinc-200 text-[10px] sm:text-xs font-semibold text-zinc-600 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Kel. Asal</th>
          `;

          allPresenterGroups.forEach(g => {
            const isHighlighted = g.sesi && g.sesi.toLowerCase() === activeSesi.toLowerCase();
            if (isHighlighted) {
              headersHtml += `
                <th class="sticky top-0 z-30 px-1.5 sm:px-2 py-1.5 text-center min-w-[65px] sm:min-w-[85px] border-r border-zinc-200 bg-emerald-50/80 border-b-2 border-b-emerald-500 whitespace-nowrap shadow-2xs">
                  <div class="flex flex-col items-center">
                    <span class="text-[10.5px] sm:text-xs font-bold text-emerald-950 tracking-tight">${g.name}</span>
                    <span class="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-full mt-0.5 leading-none border border-emerald-200/60">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      ${g.sesi || 'Sesi Aktif'} • Tampil
                    </span>
                  </div>
                </th>
              `;
            } else {
              headersHtml += `
                <th class="sticky top-0 z-30 px-1.5 sm:px-2 py-1.5 text-center min-w-[60px] sm:min-w-[75px] border-r border-zinc-200 bg-zinc-100/90 text-zinc-600 font-medium whitespace-nowrap">
                  <div class="flex flex-col items-center">
                    <span class="text-[10px] sm:text-xs tracking-tight">${g.name}</span>
                    <span class="text-[8px] sm:text-[9px] text-zinc-400 font-mono leading-none mt-0.5">${g.sesi || '-'}</span>
                  </div>
                </th>
              `;
            }
          });

          headersHtml += `
            <th class="sticky top-0 z-30 md:sticky md:right-0 md:z-40 px-2 sm:px-3 py-1.5 text-center min-w-[90px] sm:min-w-[110px] border-l border-zinc-200 shadow-2xs text-[10px] sm:text-xs font-semibold text-zinc-700 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Status</th>
          `;

          tableHeaderRow.innerHTML = headersHtml;
        } else {
          // Single Presenter Focused Headers
          tableHeaderRow.innerHTML = `
            <th class="sticky top-0 left-0 z-40 px-1 py-1.5 w-8 min-w-[32px] max-w-[32px] text-center border-r border-zinc-200 font-mono text-[10px] sm:text-[11px] text-zinc-500 whitespace-nowrap" style="background-color: #f4f4f5 !important;">#</th>
            <th class="sticky top-0 left-[32px] z-40 px-2.5 py-1.5 min-w-[135px] sm:min-w-[160px] max-w-[180px] sm:max-w-[220px] text-left border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-semibold text-[11px] sm:text-xs text-zinc-700 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Mahasiswa &amp; NIM</th>
            <th class="sticky top-0 z-30 px-2 sm:px-3 py-1.5 text-center min-w-[65px] sm:min-w-[85px] border-r border-zinc-200 text-[10px] sm:text-xs font-semibold text-zinc-600 whitespace-nowrap" style="background-color: #f4f4f5 !important;">Kel. Asal</th>
            <th class="sticky top-0 z-30 px-2 sm:px-3 py-1.5 text-center min-w-[110px] sm:min-w-[130px] border-r border-zinc-200 bg-emerald-50/80 border-b-2 border-b-emerald-500 whitespace-nowrap shadow-2xs">
              <div class="flex flex-col items-center">
                <span class="text-[10.5px] sm:text-xs font-bold text-emerald-950 tracking-tight">Status • ${singleTargetPresenter}</span>
                <span class="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-full mt-0.5 leading-none border border-emerald-200/60">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ${singlePresenterSesi ? singlePresenterSesi + ' • ' : ''}Target
                </span>
              </div>
            </th>
          `;
        }
      }

      const totalColumnsCount = !isSinglePresenterMode ? (3 + allPresenterGroups.length + 1) : 4;

      if (filteredList.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="${totalColumnsCount}" class="py-6 text-center text-zinc-400 text-xs italic">
              Tidak ada data mahasiswa yang sesuai dengan filter atau kata kunci pencarian.
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = filteredList.map((s, idx) => {
          const isOdd = idx % 2 === 1;
          const rowBgClass = isOdd ? 'bg-zinc-50/40' : 'bg-white';
          const solidBgStyle = isOdd ? 'background-color: #fafafa !important;' : 'background-color: #ffffff !important;';

          if (!isSinglePresenterMode) {
            // Generate cell for each presenter group (Clean Minimalist Checklist)
            const groupCellsHtml = allPresenterGroups.map(g => {
              const isMember = (s.kelompok || "").toLowerCase() === g.name.toLowerCase();
              const isFilled = s.filledKelompok.some(fk => fk.toLowerCase() === g.name.toLowerCase());
              const isTargetInSession = activeEvaluationGroups.some(ag => ag.toLowerCase() === g.name.toLowerCase());

              const gSesi = (groupSesiMap.get(g.name) || "").trim();
              const isSameSession = (s.studentSesi && gSesi && s.studentSesi.toLowerCase() === gSesi.toLowerCase());
              const isExempt = (kewajibanPenyaji === "BEBAS_PENUH_DI_SESINYA" && isSameSession && !isMember);

              if (isMember) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-purple-50/30 whitespace-nowrap">
                    <span class="inline-block px-1 py-0.5 rounded text-[8.5px] sm:text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 leading-none" title="${s.name} adalah penyaji ${g.name}">Penyaji</span>
                  </td>
                `;
              } else if (isFilled) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-emerald-50/20 whitespace-nowrap">
                    <span class="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 text-emerald-700 shadow-2xs" title="Sudah dinilai">
                      <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </span>
                  </td>
                `;
              } else if (isExempt) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-zinc-50/50 whitespace-nowrap">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[8.5px] sm:text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/80 leading-none" title="Bebas pengisian (Penyaji di sesi yang sama)">Bebas</span>
                  </td>
                `;
              } else if (isTargetInSession) {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 bg-rose-50/10 whitespace-nowrap">
                    <span class="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-50 text-rose-500 border border-rose-200/60" title="Belum dinilai">
                      <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </span>
                  </td>
                `;
              } else {
                return `
                  <td class="py-1 sm:py-1.5 px-1 text-center border-r border-zinc-200 text-zinc-300 font-mono text-[10px] sm:text-xs whitespace-nowrap">-</td>
                `;
              }
            }).join("");

            // Generate Final Status Cell
            let finalBadgeHtml = "";
            if (s.matrixStatusCategory === "LENGKAP") {
              finalBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>${s.matrixStatusLabel}</span>
                </span>
              `;
            } else if (s.matrixStatusCategory === "SEBAGIAN") {
              finalBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>${s.matrixStatusLabel}</span>
                </span>
              `;
            } else {
              finalBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>${s.matrixStatusLabel}</span>
                </span>
              `;
            }

            return `
              <tr class="hover:bg-zinc-100/70 transition text-zinc-800 border-b border-zinc-100/80 ${rowBgClass}">
                <td class="sticky left-0 z-20 py-1 sm:py-1.5 px-1 text-center font-mono text-zinc-400 text-[10px] sm:text-[11px] border-r border-zinc-200 whitespace-nowrap w-8 min-w-[32px] max-w-[32px]" style="${solidBgStyle}">${idx + 1}</td>
                <td class="sticky left-[32px] z-20 py-1 sm:py-1.5 px-2.5 min-w-[135px] sm:min-w-[160px] max-w-[160px] sm:max-w-[200px] border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap" style="${solidBgStyle}">
                  <div class="font-semibold text-zinc-900 leading-tight text-[10.5px] sm:text-xs">${s.name}</div>
                  <div class="font-mono text-zinc-400 text-[8.5px] sm:text-[10px] mt-0.2">${s.nim}</div>
                </td>
                <td class="py-1 sm:py-1.5 px-1.5 sm:px-2.5 text-center border-r border-zinc-200 text-[10px] sm:text-xs font-medium text-zinc-600 whitespace-nowrap">
                  ${s.kelompok}
                </td>
                ${groupCellsHtml}
                <td class="md:sticky md:right-0 md:z-20 py-1 sm:py-1.5 px-1.5 sm:px-2.5 text-center border-l border-zinc-200 shadow-2xs min-w-[90px] sm:min-w-[110px] whitespace-nowrap" style="${solidBgStyle}">
                  ${finalBadgeHtml}
                </td>
              </tr>
            `;
          } else {
            // Single Presenter Focused Row
            let singleBadgeHtml = "";
            if (s.singleStatusCategory === "PENYAJI") {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  <span>Anggota Penyaji</span>
                </span>
              `;
            } else if (s.singleStatusCategory === "BEBAS") {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                  <span>Bebas Menilai</span>
                </span>
              `;
            } else if (s.singleStatusCategory === "SUDAH") {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Sudah Menilai</span>
                </span>
              `;
            } else {
              singleBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] sm:text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>Belum Menilai</span>
                </span>
              `;
            }

            return `
              <tr class="hover:bg-zinc-100/70 transition text-zinc-800 border-b border-zinc-100/80 ${rowBgClass}">
                <td class="sticky left-0 z-20 py-1 sm:py-1.5 px-1 text-center font-mono text-zinc-400 text-[10px] sm:text-[11px] border-r border-zinc-200 whitespace-nowrap w-8 min-w-[32px] max-w-[32px]" style="${solidBgStyle}">${idx + 1}</td>
                <td class="sticky left-[32px] z-20 py-1 sm:py-1.5 px-2.5 min-w-[135px] sm:min-w-[160px] max-w-[180px] sm:max-w-[220px] border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] whitespace-nowrap" style="${solidBgStyle}">
                  <div class="font-semibold text-zinc-900 leading-tight text-[10.5px] sm:text-xs">${s.name}</div>
                  <div class="font-mono text-zinc-400 text-[8.5px] sm:text-[10px] mt-0.2">${s.nim}</div>
                </td>
                <td class="py-1 sm:py-1.5 px-2 sm:px-3 text-center border-r border-zinc-200 text-[10px] sm:text-xs font-medium text-zinc-600 whitespace-nowrap">
                  ${s.kelompok}
                </td>
                <td class="py-1 sm:py-1.5 px-2 sm:px-3 text-center border-r border-zinc-200 min-w-[110px] sm:min-w-[130px] whitespace-nowrap">
                  ${singleBadgeHtml}
                </td>
              </tr>
            `;
          }
        }).join("");
      }

      // 8. Render Dosen & Guest section (dari evaluators[] saja — bukan presensi mahasiswa)
      const dosenGuestEvaluators = [];
      if (currentRekapData?.summary) {
        currentRekapData.summary.forEach(g => {
          (g.evaluators || []).forEach(e => {
            if (!e || typeof e !== 'object') return;
            const ePeran = e.peran || 'Mahasiswa';
            if (ePeran === 'Mahasiswa') return;
            const eName = (e.name || "").trim();
            const exist = dosenGuestEvaluators.find(x => x.name === eName && x.kelompok === g.kelompok);
            if (!exist) {
              dosenGuestEvaluators.push({
                name: eName,
                peran: ePeran,
                kelompok: g.kelompok,
                sesi: e.sesi || g.sesi
              });
            }
          });
        });
      }

      if (dosenGuestSection && dosenGuestListEl) {
        if (dosenGuestEvaluators.length > 0) {
          dosenGuestSection.classList.remove("hidden");
          if (dosenGuestBadge) dosenGuestBadge.textContent = `${dosenGuestEvaluators.length} Penilai`;
          dosenGuestListEl.innerHTML = dosenGuestEvaluators.map(dg => {
            const roleBadgeClass = dg.peran === 'Dosen'
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : 'bg-blue-100 text-blue-800 border-blue-200';
            return `
              <div class="p-3 rounded-lg bg-white border border-zinc-200 shadow-2xs space-y-1">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold text-zinc-900 truncate">${dg.name}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${roleBadgeClass}">${dg.peran}</span>
                </div>
                <p class="text-[11px] text-zinc-500">Menilai: <span class="font-medium text-zinc-800">${dg.kelompok}</span> (${dg.sesi})</p>
              </div>
            `;
          }).join("");
        } else {
          dosenGuestSection.classList.add("hidden");
        }
      }
    }

    // RENDER MODERN MINIMALIST VISUAL LEADERBOARD CHART (OVERVIEW)
    function renderModernRekapCharts(summaryList) {
      const chartCard = document.getElementById("rekapChartOverviewCard");
      const groupContainer = document.getElementById("groupLeaderboardChartBars");
      const presenterContainer = document.getElementById("presenterLeaderboardChartBars");
      const evaluatorBadge = document.getElementById("chartTotalEvaluatorBadge");

      if (!chartCard || !groupContainer || !presenterContainer) return;

      if (!summaryList || summaryList.length === 0) {
        chartCard.classList.add("hidden");
        return;
      }

      chartCard.classList.remove("hidden");
      groupContainer.innerHTML = "";
      presenterContainer.innerHTML = "";

      // 1. Group Leaderboard Sorting
      const sortedGroups = [...summaryList].sort((a, b) => {
        const scoreA = parseFloat(a.rataRataSkor) || 0;
        const scoreB = parseFloat(b.rataRataSkor) || 0;
        return scoreB - scoreA;
      });

      let totalEvaluations = 0;
      sortedGroups.forEach(g => {
        totalEvaluations += parseInt(g.totalPenilai) || 0;
      });
      if (evaluatorBadge) {
        evaluatorBadge.textContent = `${totalEvaluations} Penilai Terdata`;
      }

      sortedGroups.forEach((grp, idx) => {
        const score = parseFloat(grp.rataRataSkor) || 0;
        const pct = Math.min(100, Math.max(0, score));

        let rankBadge = "";
        let barColor = "bg-gradient-to-r from-emerald-500 to-teal-400";
        if (idx === 0) {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/80 flex-shrink-0">#1</span>`;
          barColor = "bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-300";
        } else if (idx === 1) {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 flex-shrink-0">#2</span>`;
        } else if (idx === 2) {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800/80 text-amber-500 border border-zinc-700 flex-shrink-0">#3</span>`;
        } else {
          rankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 flex-shrink-0">#${idx + 1}</span>`;
          barColor = "bg-gradient-to-r from-zinc-600 to-zinc-400";
        }
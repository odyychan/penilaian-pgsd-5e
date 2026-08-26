/* ============================================
 * src/student/print.js
 * Print report, PDF, helpers
 * ============================================ */


        const barRow = document.createElement("div");
        barRow.className = "space-y-1";
        barRow.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5 min-w-0">
              ${rankBadge}
              <span class="font-semibold text-zinc-200 truncate max-w-[130px] sm:max-w-[190px]">${grp.kelompok}</span>
              <span class="text-[10px] text-zinc-500 hidden sm:inline font-mono">(${grp.sesi})</span>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="font-mono font-bold text-emerald-400 text-xs">${grp.rataRataSkor}</span>
              <span class="text-[10px] text-zinc-500 font-mono">(${grp.totalPenilai} penilai)</span>
            </div>
          </div>
          <div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/80">
            <div class="h-full ${barColor} rounded-full transition-all duration-700 ease-out" style="width: ${pct}%"></div>
          </div>
        `;
        groupContainer.appendChild(barRow);
      });

      // 2. Presenter Leaderboard Aggregation
      const presenterMap = {};
      summaryList.forEach(grp => {
        const votes = grp.votePresentator || {};
        Object.keys(votes).forEach(pName => {
          if (!presenterMap[pName]) {
            presenterMap[pName] = {
              name: pName,
              group: grp.kelompok,
              sesi: grp.sesi,
              votes: 0
            };
          }
          presenterMap[pName].votes += parseInt(votes[pName]) || 0;
        });
      });

      const sortedPresenters = Object.values(presenterMap).filter(p => p.votes > 0).sort((a, b) => b.votes - a.votes);
      const topPresenters = sortedPresenters;

      if (topPresenters.length === 0) {
        presenterContainer.innerHTML = `<p class="text-xs text-zinc-500 italic p-3 text-center bg-zinc-900/50 rounded-lg border border-zinc-900">Belum ada suara presentator yang masuk.</p>`;
      } else {
        const maxVotes = topPresenters[0]?.votes || 1;
        topPresenters.forEach((pres, pIdx) => {
          const pct = Math.min(100, Math.max(12, (pres.votes / maxVotes) * 100));
          let pRankBadge = "";
          let barGradient = "bg-gradient-to-r from-blue-500 to-indigo-400";

          if (pIdx === 0) {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/80 flex-shrink-0">#1</span>`;
            barGradient = "bg-gradient-to-r from-amber-500 to-amber-300";
          } else if (pIdx === 1) {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 flex-shrink-0">#2</span>`;
          } else if (pIdx === 2) {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex-shrink-0">#3</span>`;
          } else {
            pRankBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-900 text-zinc-500 border border-zinc-800 flex-shrink-0">#${pIdx + 1}</span>`;
            barGradient = "bg-gradient-to-r from-zinc-700 to-zinc-500";
          }

          const presRow = document.createElement("div");
          presRow.className = "space-y-1";
          presRow.innerHTML = `
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 min-w-0">
                ${pRankBadge}
                <span class="font-semibold text-zinc-200 truncate max-w-[130px] sm:max-w-[190px]">${pres.name}</span>
                <span class="text-[10px] text-zinc-500 font-mono truncate hidden sm:inline">(${pres.group})</span>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span class="font-mono font-bold text-amber-300 text-xs">${pres.votes} Suara</span>
              </div>
            </div>
            <div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/80">
              <div class="h-full ${barGradient} rounded-full transition-all duration-700 ease-out" style="width: ${pct}%"></div>
            </div>
          `;
          presenterContainer.appendChild(presRow);
        });
      }
    }

    // === Helper: Ambil summary sesuai role filter aktif ===
    function getActiveRekapSummary() {
      if (!currentRekapData) return [];
      let base;
      if (currentRekapRoleFilter === 'mhs') {
        // Mahasiswa terdaftar saja — gunakan summaryMhs jika tersedia, fallback ke summary filter Mahasiswa
        base = currentRekapData.summaryMhs 
          || (currentRekapData.summary || []).map(g => {
              // Fallback: filter manual dari evaluators jika summaryMhs belum ada (backend lama)
              const mhsEvals = (g.evaluators || []).filter(e => (e.peran || 'Mahasiswa') === 'Mahasiswa');
              return { ...g, totalPenilai: mhsEvals.length };
            });
      } else if (currentRekapRoleFilter === 'other') {
        // Dosen & Lainnya saja — hitung dari summary (all) dikurangi Mahasiswa
        base = (currentRekapData.summary || []).map(g => {
          const otherEvals = (g.evaluators || []).filter(e => (e.peran || 'Mahasiswa') !== 'Mahasiswa');
          return { ...g, totalPenilai: otherEvals.length, evaluators: otherEvals };
        }).filter(g => g.totalPenilai > 0);
      } else {
        // Semua penilai
        base = currentRekapData.summary || [];
      }
      return base || [];
    }

    // === Switch Role Filter Rekap ===
    function switchRekapRoleFilter(role) {
      currentRekapRoleFilter = role;
      // Update pill style
      const pills = { mhs: 'rolePillMhs', other: 'rolePillOther', all: 'rolePillAll' };
      const activeClass = 'bg-zinc-900 text-white border-zinc-900';
      const inactiveClass = 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900';
      Object.keys(pills).forEach(k => {
        const pill = document.getElementById(pills[k]);
        if (!pill) return;
        if (k === role) {
          pill.className = pill.className.replace(inactiveClass, '').replace(activeClass, '').trim() + ' ' + activeClass;
        } else {
          pill.className = pill.className.replace(activeClass, '').replace(inactiveClass, '').trim() + ' ' + inactiveClass;
        }
      });
      renderBothRekapViews();
    }

    function renderBothRekapViews() {
      if (!currentRekapData) return;
      const loading = document.getElementById("rekapLoading");
      if (loading) loading.classList.add("hidden");
      const sesiFilter = document.getElementById("rekapSesiFilter")?.value || "ALL";
      const groupFilter = document.getElementById("rekapGroupFilter")?.value || "ALL";
      const activeBase = getActiveRekapSummary();
      
      let summaryList = activeBase;
      if (sesiFilter !== "ALL") {
        summaryList = summaryList.filter(i => (i.sesi || "").trim().toLowerCase() === sesiFilter.trim().toLowerCase());
      }
      if (groupFilter !== "ALL") {
        summaryList = summaryList.filter(i => i.kelompok === groupFilter);
      }

      renderModernRekapCharts(summaryList);
      renderRekapKelompok(summaryList, currentRekapData.isPublicReviewVisible);
      renderRekapIndividu(summaryList, currentRekapData.isPublicReviewVisible);
      renderRekapPresensi();

      // Set Active Box based on SubTab
      switchRekapSubView(currentRekapSubView, false, false);
    }

    // 1. Render Rekap Kelompok View (With Refined SVG Info Button "i")
    function renderRekapKelompok(summaryList, isPublicReviewVisible) {
      const container = document.getElementById("rekapKelompokContainer");
      container.innerHTML = "";
      const fragment = document.createDocumentFragment();

      summaryList.forEach(grp => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 space-y-4 shadow-xs";

        let presentersHtml = `<p class="text-xs text-zinc-400 italic">Belum ada suara.</p>`;
        if (grp.rankedPresenters && grp.rankedPresenters.length > 0) {
          presentersHtml = grp.rankedPresenters.map((p, idx) => `
            <div class="flex items-center justify-between gap-2 text-xs bg-zinc-50 hover:bg-zinc-100/70 px-3 py-2 rounded-lg border border-zinc-100 transition">
              <span class="font-medium text-zinc-800 truncate flex-1">${idx === 0 ? '#1 ' : (idx === 1 ? '#2 ' : '#3 ')} ${p.name}</span>
              <span class="font-mono font-semibold text-zinc-700 bg-zinc-200/80 px-2 py-0.5 rounded text-[11px] whitespace-nowrap flex-shrink-0">${p.votes} Suara</span>
            </div>
          `).join("");
        }

        card.innerHTML = `
          <div class="flex items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-bold text-zinc-900 text-sm sm:text-base whitespace-nowrap">${grp.kelompok}</h4>
                <button 
                  type="button" 
                  onclick="openGroupInfoModal('${grp.kelompok}')" 
                  title="Detail Anggota Kelompok" 
                  class="p-1 rounded-md bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-600 border border-zinc-200 text-xs transition cursor-pointer flex items-center justify-center flex-shrink-0"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
              </div>
              <span class="text-[11px] text-zinc-500 font-medium whitespace-nowrap block mt-0.5">${grp.sesi}</span>
              <span class="text-[10px] font-medium mt-0.5 block ${currentRekapRoleFilter === 'mhs' ? 'text-emerald-700' : currentRekapRoleFilter === 'other' ? 'text-purple-700' : 'text-blue-700'}">${currentRekapRoleFilter === 'mhs' ? 'Mahasiswa Terdaftar' : currentRekapRoleFilter === 'other' ? 'Dosen & Lainnya' : 'Semua Penilai'}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="text-center bg-zinc-100 px-2.5 py-1 rounded min-w-[58px]">
                <span class="block text-[9px] uppercase font-bold text-zinc-500 whitespace-nowrap tracking-tight">RATA-RATA</span>
                <span class="text-sm font-mono font-bold text-zinc-900 block leading-tight">${grp.rataRataSkor}</span>
              </div>
              <div class="text-center bg-zinc-100 px-2.5 py-1 rounded min-w-[50px]">
                <span class="block text-[9px] uppercase font-bold text-zinc-500 whitespace-nowrap tracking-tight">PENILAI</span>
                <span class="text-sm font-mono font-bold text-zinc-900 block leading-tight">${grp.totalPenilai}</span>
              </div>
            </div>
          </div>

          <div>
            <h5 class="text-xs font-semibold text-zinc-700 mb-2">Peringkat Suara Pemateri Terbaik:</h5>
            <div class="space-y-1.5">
              ${presentersHtml}
            </div>
          </div>
        `;

        fragment.appendChild(card);
      });

      container.appendChild(fragment);
    }

    // 2. Render Rekap Individu Mahasiswa (Non-Truncate Name, Top 3 Reviews + Modal Selengkapnya)
    function renderRekapIndividu(summaryList, isPublicReviewVisible) {
      const container = document.getElementById("rekapIndividuContainer");
      container.innerHTML = "";
      const fragment = document.createDocumentFragment();

      let cardIndex = 0;
      const memberNimMap = {};
      groupsData.forEach(g => {
        (g.members || []).forEach(m => {
          memberNimMap[m.name] = m.nim || "";
        });
      });

      summaryList.forEach(grp => {
        const evalMap = grp.evaluasiList || {};
        const voteMap = grp.votePresentator || {};
        const studentNames = Object.keys(evalMap);

        studentNames.forEach(sName => {
          cardIndex++;
          const cardId = `studentCard_${cardIndex}`;
          const ulasanList = evalMap[sName] || [];
          const votesCount = voteMap[sName] || 0;
          const sNim = memberNimMap[sName] || "";

          const card = document.createElement("div");
          card.id = cardId;
          card.className = "student-card bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden transition-all";
          card.setAttribute("data-name", sName.toLowerCase());
          card.setAttribute("data-nim", sNim.toLowerCase());

          let reviewsContent = "";
          if (!isPublicReviewVisible) {
            reviewsContent = `<div class="bg-zinc-50 border border-zinc-200 rounded p-2.5 text-xs text-zinc-500">Ulasan kualitatif disembunyikan oleh Dosen.</div>`;
          } else if (ulasanList.length === 0) {
            reviewsContent = `<p class="text-xs text-zinc-400 italic">Belum ada catatan ulasan tertulis.</p>`;
          } else {
            // Tampilkan maksimal 3 ulasan teratas
            const top3Reviews = ulasanList.slice(0, 3);
            const listItems = top3Reviews.map(u => `
              <li class="bg-white p-3 rounded-lg border border-zinc-200 text-xs text-zinc-700 space-y-1.5 shadow-2xs">
                <p class="leading-relaxed text-zinc-800">"${u.ulasan}"</p>
                <div class="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                  <span class="font-medium text-zinc-500">Penilai: ${u.penilai}</span>
                  <span class="font-mono">${grp.sesi}</span>
                </div>
              </li>
            `).join("");

            let seeMoreBtn = "";
            if (ulasanList.length > 3) {
              const safeName = sName.replace(/'/g, "\\'");
              const safeNim = sNim.replace(/'/g, "\\'");
              const safeGroup = grp.kelompok.replace(/'/g, "\\'");
              const safeSesi = grp.sesi.replace(/'/g, "\\'");

              seeMoreBtn = `
                <div class="pt-2 text-center">
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); openStudentReviewModal('${safeName}', '${safeNim}', '${safeGroup}', '${safeSesi}')" 
                    class="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Lihat Selengkapnya (${ulasanList.length} Masukan)</span>
                    <span>→</span>
                  </button>
                </div>
              `;
            }

            reviewsContent = `
              <ul class="space-y-2">
                ${listItems}
              </ul>
              ${seeMoreBtn}
            `;
          }

          card.innerHTML = `
            <!-- Clickable Accordion Header (Non-Truncate Full Name, Default Collapsed) -->
            <div 
              onclick="toggleAccordion('${cardId}')" 
              class="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 cursor-pointer hover:bg-zinc-50/80 transition select-none"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h4 class="font-bold text-zinc-900 text-xs sm:text-sm leading-snug break-words">${sName}</h4>
                  ${sNim ? `<span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded flex-shrink-0">${sNim}</span>` : ''}
                </div>
                <p class="text-[11px] text-zinc-500 mt-0.5">${grp.kelompok} • ${grp.sesi}</p>
              </div>
              
              <div class="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                    ${votesCount} Suara
                  </span>
                  <span class="text-[11px] font-mono font-medium bg-zinc-50 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
                    ${ulasanList.length} Masukan
                  </span>
                </div>
                <span id="chevron_${cardId}" class="text-zinc-400 text-xs transition-transform duration-200 transform inline-block font-mono pl-1">
                  ▼
                </span>
              </div>
            </div>

            <!-- Collapsible Review Content (Top 3 Reviews) -->
            <div id="content_${cardId}" class="hidden border-t border-zinc-100 p-4 bg-zinc-50/60 space-y-2.5">
              <h5 class="text-[11px] font-semibold text-zinc-600 flex items-center justify-between">
                <span>Catatan Masukan Audiens (3 Teratas):</span>
                <span class="text-[10px] font-mono text-zinc-400">Total: ${ulasanList.length} Respons</span>
              </h5>
              ${reviewsContent}
            </div>
          `;

          fragment.appendChild(card);
        });
      });

      container.appendChild(fragment);
      filterMahasiswaSearch();
    }

    // Toggle Single Accordion
    function toggleAccordion(cardId) {
      const content = document.getElementById(`content_${cardId}`);
      const chevron = document.getElementById(`chevron_${cardId}`);
      if (!content) return;

      const isHidden = content.classList.contains("hidden");
      if (isHidden) {
        content.classList.remove("hidden");
        if (chevron) chevron.textContent = "▲";
      } else {
        content.classList.add("hidden");
        if (chevron) chevron.textContent = "▼";
      }
    }

    // Toggle All Accordions
    function toggleAllAccordions(shouldOpen) {
      document.querySelectorAll(".student-card").forEach(card => {
        const cardId = card.id;
        const content = document.getElementById(`content_${cardId}`);
        const chevron = document.getElementById(`chevron_${cardId}`);
        if (content) {
          if (shouldOpen) {
            content.classList.remove("hidden");
            if (chevron) chevron.textContent = "▲";
          } else {
            content.classList.add("hidden");
            if (chevron) chevron.textContent = "▼";
          }
        }
      });
    }

    // Search Mahasiswa Filter
    function filterMahasiswaSearch() {
      const query = (document.getElementById("searchMahasiswaInput")?.value || "").trim().toLowerCase();
      const cards = document.querySelectorAll(".student-card");
      let visibleCount = 0;

      cards.forEach(card => {
        const name = card.getAttribute("data-name") || "";
        const nim = card.getAttribute("data-nim") || "";
        const match = !query || name.includes(query) || nim.includes(query);

        if (match) {
          card.classList.remove("hidden");
          visibleCount++;
        } else {
          card.classList.add("hidden");
        }
      });

      const countLabel = document.getElementById("studentCountLabel");
      if (countLabel) {
        countLabel.textContent = `Menampilkan ${visibleCount} dari ${cards.length} Mahasiswa`;
      }
    }

    // Modal Informasi Kelompok
    function openGroupInfoModal(groupName) {
      const modal = document.getElementById("groupInfoModal");
      const titleEl = document.getElementById("infoModalGroupName");
      const sesiEl = document.getElementById("infoModalGroupSesi");
      const listEl = document.getElementById("infoModalMemberList");
      const countEl = document.getElementById("infoModalMemberCount");

      titleEl.textContent = groupName;
      listEl.innerHTML = "";

      const foundGroup = groupsData.find(g => g.name === groupName);
      if (foundGroup) {
        sesiEl.textContent = `Sesi: ${foundGroup.sesi || 'Minggu 1'}`;
        countEl.textContent = `${(foundGroup.members || []).length} Anggota`;

        (foundGroup.members || []).forEach((m, idx) => {
          const li = document.createElement("li");
          li.className = "flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs";
          li.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-5 h-5 rounded bg-zinc-200 text-zinc-700 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                ${idx + 1}
              </span>
              <span class="font-medium text-zinc-900 truncate">${m.name}</span>
            </div>
            <span class="text-[11px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200 flex-shrink-0">
              ${m.nim || 'NIM -'}
            </span>
          `;
          listEl.appendChild(li);
        });
      } else {
        sesiEl.textContent = "Data tidak ditemukan";
        countEl.textContent = "0 Anggota";
        listEl.innerHTML = `<li class="text-xs text-zinc-400 italic p-3 text-center">Data anggota tidak ditemukan.</li>`;
      }

      modal.classList.remove("hidden");
    }

    function closeGroupInfoModal() {
      document.getElementById("groupInfoModal").classList.add("hidden");
    }

    // Modal Detail Seluruh Masukan Mahasiswa
    function openStudentReviewModal(studentName, studentNim, groupName, groupSesi) {
      const modal = document.getElementById("studentReviewModal");
      const nameEl = document.getElementById("reviewModalStudentName");
      const nimEl = document.getElementById("reviewModalStudentNim");
      const groupEl = document.getElementById("reviewModalGroupInfo");
      const countEl = document.getElementById("reviewModalReviewCount");
      const listEl = document.getElementById("reviewModalReviewsList");

      nameEl.textContent = studentName;
      nimEl.textContent = studentNim || "NIM Tidak Terdata";
      groupEl.textContent = `${groupName} • ${groupSesi}`;
      listEl.innerHTML = "";

      let allReviews = [];
      if (currentRekapData && currentRekapData.summary) {
        const foundGrp = currentRekapData.summary.find(g => g.kelompok === groupName);
        if (foundGrp && foundGrp.evaluasiList && foundGrp.evaluasiList[studentName]) {
          allReviews = foundGrp.evaluasiList[studentName];
        }
      }

      countEl.textContent = `${allReviews.length} Masukan`;

      if (allReviews.length === 0) {
        listEl.innerHTML = `<li class="text-xs text-zinc-400 italic p-4 text-center bg-zinc-50 border border-zinc-200 rounded-lg">Belum ada catatan masukan tertulis untuk pemateri ini.</li>`;
      } else {
        allReviews.forEach((u, idx) => {
          const li = document.createElement("li");
          li.className = "bg-white p-3.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 space-y-1.5 shadow-2xs";
          li.innerHTML = `
            <div class="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>#${idx + 1} Catatan Audiens</span>
              <span>${groupSesi}</span>
            </div>
            <p class="leading-relaxed text-zinc-900 font-medium">"${u.ulasan}"</p>
            <div class="text-[10px] text-zinc-500 pt-1 border-t border-zinc-100 text-right">
              Penilai: <strong class="text-zinc-700">${u.penilai}</strong>
            </div>
          `;
          listEl.appendChild(li);
        });
      }

      modal.classList.remove("hidden");
    }

    function closeStudentReviewModal() {
      document.getElementById("studentReviewModal").classList.add("hidden");
    }

    let toastTimer = null;
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
    const showConfirmModal = showAppConfirm;
    window.showConfirmModal = showAppConfirm;

    function showToast(message, type = "info") {
      const toast = document.getElementById("toast");
      const icon = document.getElementById("toastIcon");
      const msg = document.getElementById("toastMsg");

      if (toastTimer) clearTimeout(toastTimer);

      msg.textContent = message;
      toast.className = "fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[9999] p-3.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 transition-all border step-fade";

      if (type === "error") {
        toast.classList.add("bg-zinc-950", "text-rose-300", "border-rose-800/80");
        icon.innerHTML = `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
      } else if (type === "warning") {
        toast.classList.add("bg-zinc-950", "text-amber-300", "border-amber-800/80");
        icon.innerHTML = `<svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
      } else {
        toast.classList.add("bg-zinc-950", "text-emerald-300", "border-emerald-800/80");
        icon.innerHTML = `<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
      }

      toast.classList.remove("hidden");
      toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
      }, 3500);
    }

    function mockLoadData() {
      appConfig = {
        "Judul_Form": "Penilaian Presentasi PGSD 5E",
        "Mata_Kuliah": "Bimbingan Konseling di SD",
        "Dosen_Pengampu": "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.",
        "Kelas": "5E",
        "Jurusan": "PGSD",
        "Sesi_Minggu_Aktif": "Minggu 1",
        "Domain_Email_Wajib": "mhs.ulm.ac.id, ulm.ac.id",
        "Tampilkan_Ulasan_Publik": "AKTIF",
        "Nilai_Kelompok_Min": "50",
        "Nilai_Kelompok_Max": "100",
        "Maksimal_Karakter_Evaluasi": "500",
        "Maksimal_Pilihan_Presentator_Terbaik": "2"
      };

      groupsData = [
        {
          name: "Kelompok 1",
          sesi: "Minggu 1",
          members: [
            { name: "Ahmad Fauzi", nim: "221012310001" },
            { name: "Siti Nurhaliza", nim: "221012310002" },
            { name: "Budi Santoso", nim: "221012310003" },
            { name: "Dewi Lestari", nim: "221012310004" }
          ]
        },
        {
          name: "Kelompok 2",
          sesi: "Minggu 1",
          members: [
            { name: "Rian Pratama", nim: "221012310005" },
            { name: "Putri Rahayu", nim: "221012310006" },
            { name: "Dimas Anggara", nim: "221012310007" }
          ]
        }
      ];

      allStudentsData = [
        { name: "Ahmad Fauzi", nim: "221012310001", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Siti Nurhaliza", nim: "221012310002", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Budi Santoso", nim: "221012310003", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Dewi Lestari", nim: "221012310004", kelompok: "Kelompok 1", sesi: "Minggu 1" },
        { name: "Rian Pratama", nim: "221012310005", kelompok: "Kelompok 2", sesi: "Minggu 1" },
        { name: "Putri Rahayu", nim: "221012310006", kelompok: "Kelompok 2", sesi: "Minggu 1" },
        { name: "Dimas Anggara", nim: "221012310007", kelompok: "Kelompok 2", sesi: "Minggu 1" },
        { name: "Rodhiyah", nim: "2210118210013", kelompok: "Kelompok 3", sesi: "Minggu 2" }
      ];

      renderConfigHeader();
      renderGroupOptions();
    }

    // =========================================================================
    // FITUR CETAK REKAP HASIL LAPORAN RESMI (PRINT & PDF)
    // =========================================================================
    function openPrintRekapModal() {
      const modal = document.getElementById("printRekapModal");
      const groupSelect = document.getElementById("printScopeGroupSelect");
      const sesiSelect = document.getElementById("printScopeSesiSelect");
      
      // Populate Sesi Options
      sesiSelect.innerHTML = '<option value="ALL">Semua Sesi</option>';
      const availableSessions = new Set();
      if (groupsData && groupsData.length > 0) {
        groupsData.forEach(g => { if (g.sesi) availableSessions.add(g.sesi); });
      }
      if (currentRekapData && currentRekapData.summary) {
        currentRekapData.summary.forEach(g => { if (g.sesi) availableSessions.add(g.sesi); });
      }
      Array.from(availableSessions).sort().forEach(s => {
        sesiSelect.innerHTML += `<option value="${s}">${s}</option>`;
      });

      // Populate Kelompok Options
      groupSelect.innerHTML = '<option value="ALL">Semua Kelompok (Keseluruhan)</option>';
      if (currentRekapData && currentRekapData.summary) {
        currentRekapData.summary.forEach(g => {
          groupSelect.innerHTML += `<option value="${g.kelompok}">${g.kelompok} (${g.sesi || 'Minggu 1'})</option>`;
        });
      }

      // Sync with currently active filter
      const activeFilter = document.getElementById("rekapGroupFilter")?.value || "ALL";
      if (activeFilter !== "ALL") {
        groupSelect.value = activeFilter;
      }

      renderPrintPreviewContent();
      modal.classList.remove("hidden");
      const scrollCont = document.getElementById("printScrollContainer");
      if (scrollCont) scrollCont.scrollTop = 0;
    }

    function closePrintRekapModal() {
      document.getElementById("printRekapModal").classList.add("hidden");
    }

    function renderPrintPreviewContent() {
      const previewEl = document.getElementById("printableReportArea");
      const selectedGroup = document.getElementById("printScopeGroupSelect")?.value || "ALL";
      const selectedSesi = document.getElementById("printScopeSesiSelect")?.value || "ALL";
      const includeReviews = document.getElementById("printIncludeReviews")?.checked ?? true;
      const includeReviewerName = document.getElementById("printIncludeReviewerName")?.checked ?? true;
      const includeFooter = document.getElementById("printIncludeFooter")?.checked ?? true;

      const matkul = appConfig["Mata_Kuliah"] || "Bimbingan Konseling di SD";
      const dosen = appConfig["Dosen_Pengampu"] || "Dr. Ririanti Rachmayanie Jamain, S.Psi., M.Pd.";
      const kelas = appConfig["Kelas"] || "5E";
      const printDateStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

      let summaryList = (currentRekapData && currentRekapData.summary) ? [...currentRekapData.summary] : [];

      if (selectedGroup !== "ALL") {
        summaryList = summaryList.filter(g => g.kelompok === selectedGroup);
      }
      if (selectedSesi !== "ALL") {
        summaryList = summaryList.filter(g => (g.sesi || "Minggu 1") === selectedSesi);
      }

      // Hitung Rata-Rata Keseluruhan
      let totalAllScore = 0;
      let totalAllPenilai = 0;
      let evaluatedCount = 0;
      summaryList.forEach(g => {
        const s = parseFloat(g.rataRataSkor || g.rataRata || 0);
        const p = parseInt(g.totalPenilai) || 0;
        if (p > 0) {
          totalAllScore += s;
          totalAllPenilai += p;
          evaluatedCount++;
        }
      });

      // Hitung Total Mahasiswa Terdaftar pada Kelompok Aktif
      const activeGroupNames = new Set(summaryList.map(g => g.kelompok));
      let totalMahasiswa = 0;
      if (allStudentsData && allStudentsData.length > 0) {
        totalMahasiswa = allStudentsData.filter(s => activeGroupNames.has(s.kelompok)).length;
      } else if (groupsData && groupsData.length > 0) {
        groupsData.filter(g => activeGroupNames.has(g.name)).forEach(g => {
          totalMahasiswa += (g.members || []).length;
        });
      }
      if (totalMahasiswa === 0) {
        summaryList.forEach(g => {
          if (g.evaluasiList) {
            totalMahasiswa += Object.keys(g.evaluasiList).length;
          }
        });
      }
      const avgClassScore = evaluatedCount > 0 ? (totalAllScore / evaluatedCount).toFixed(2) : "0.00";

      // HTML Template
      let html = `
        <div class="print-page-wrapper" style="min-height: 1033px; width: 100%; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; background: #ffffff;">
          
          <!-- TOP & MAIN CONTENT AREA -->
          <div style="flex: 1 0 auto;">
            <!-- KOP SURAT RESMI DINAS FKIP ULM -->
            <table style="width: 100%; border-collapse: collapse; border: none; margin: 0 0 2px 0; padding: 0; table-layout: fixed;">
              <tbody>
                <tr style="border: none;">
                  <td style="width: 82px; min-width: 82px; max-width: 82px; vertical-align: middle; text-align: center; border: none; padding: 0 6px 0 0;">
                    <img src="assets/logo-ulm.png" alt="Logo ULM" style="width: 76px; height: 76px; object-fit: contain; display: block; margin: 0 auto;" onerror="this.src='logo-ulm.png'" />
                  </td>
                  <td style="text-align: center; vertical-align: middle; border: none; padding: 0 2px; font-family: 'Times New Roman', Times, serif; color: #000000;">
                    <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.2;">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
                    <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.22; margin-top: 1px;">UNIVERSITAS LAMBUNG MANGKURAT</div>
                    <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; line-height: 1.2; margin-top: 1px;">FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN</div>
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; line-height: 1.2; margin-top: 1px;">PROGRAM STUDI PENDIDIKAN GURU SEKOLAH DASAR (PGSD) - KELAS ${kelas}</div>
                    <div style="font-size: 9px; color: #374151; line-height: 1.2; margin-top: 2.5px; font-style: italic;">Jl. Brigjen H. Hasan Basry, Kayu Tangi, Banjarmasin, Kalimantan Selatan 70123 • Laman: fkip.ulm.ac.id</div>
                  </td>
                  <td style="width: 82px; min-width: 82px; max-width: 82px; border: none; padding: 0;"></td>
                </tr>
              </tbody>
            </table>

            <!-- GARIS PEMBATAS KOP RESMI DINAS (DOUBLE LINE TEBAL & TIPIS) -->
            <div style="border-top: 2.5px solid #000000; border-bottom: 0.75px solid #000000; height: 2px; margin: 2px 0 8px 0;"></div>

            <!-- JUDUL LAPORAN & METADATA -->
            <div style="text-align: center; margin-bottom: 8px; font-family: 'Times New Roman', Times, serif; color: #000000;">
              <h2 style="font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: #000000; border-bottom: 1.5px solid #000000; padding-bottom: 2px; display: inline-block; margin: 6pt auto 6px auto; font-family: 'Times New Roman', Times, serif;">
                LAPORAN REKAPITULASI HASIL PENILAIAN PRESENTASI
              </h2>
              
              <table style="width: 100%; border-collapse: collapse; border: none !important; margin-top: 2px; font-size: 11.5px; text-align: left; table-layout: fixed; font-family: 'Times New Roman', Times, serif;">
                <tbody>
                  <tr style="border: none !important;">
                    <td style="border: none !important; padding: 1.5px 0; width: 15%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Mata Kuliah</td>
                    <td style="border: none !important; padding: 1.5px 6px 1.5px 0; width: 41%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${matkul}</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 16%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Kelas / Semester</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 28%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${kelas} / Genap (2025/2026)</td>
                  </tr>
                  <tr style="border: none !important;">
                    <td style="border: none !important; padding: 1.5px 0; width: 15%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Dosen Pengampu</td>
                    <td style="border: none !important; padding: 1.5px 6px 1.5px 0; width: 41%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${dosen}</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 16%; font-weight: 600; color: #1f2937; vertical-align: top; font-family: 'Times New Roman', Times, serif;">Cakupan Sesi</td>
                    <td style="border: none !important; padding: 1.5px 0; width: 28%; font-weight: 700; color: #000000; vertical-align: top; word-break: break-word; font-family: 'Times New Roman', Times, serif;">: ${selectedSesi === 'ALL' ? 'Semua Sesi Presentasi' : selectedSesi}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 1. TABEL REKAPITULASI NILAI KELOMPOK -->
            <div class="space-y-1 print-avoid-break" style="margin-top: 14px; padding-top: 2px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <span style="font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; color: #000000; font-family: 'Times New Roman', Times, serif;">A. Rekapitulasi Nilai &amp; Peringkat Performa Kelompok</span>
                <span style="font-size: 10px; font-family: monospace; color: #4b5563;">Skala Penilaian: 0 - 100</span>
              </div>
              
              <div class="overflow-x-auto" style="overflow: visible;">
                <table class="w-full text-left text-xs" style="table-layout: fixed; width: 100%; border-collapse: collapse; border: 1.5px solid #000000; box-sizing: border-box; font-family: 'Times New Roman', Times, serif;">
                  <thead>
                    <tr style="background-color: #f3f4f6; text-align: center; font-weight: bold; border-bottom: 1.5px solid #000000; font-family: 'Times New Roman', Times, serif;">
                      <th style="padding: 5px 2px; border: 1px solid #000000; width: 6%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Rank</th>
                      <th style="padding: 5px 4px; border: 1px solid #000000; text-align: center; vertical-align: middle; width: 19%; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Kelompok Presentasi</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 10%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Sesi</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 9%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Penilai</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 11%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Rata-Rata</th>
                      <th style="padding: 5px 4px; border: 1px solid #000000; text-align: center; vertical-align: middle; width: 31%; font-size: 11.5px; font-family: 'Times New Roman', Times, serif; word-break: break-word;">Presentator Terbaik</th>
                      <th style="padding: 5px 3px; border: 1px solid #000000; width: 14%; text-align: center; vertical-align: middle; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Predikat</th>
                    </tr>
                  </thead>
                  <tbody style="font-family: 'Times New Roman', Times, serif;">
      `;

      if (summaryList.length === 0) {
        html += `
          <tr>
            <td colspan="7" style="padding: 10px; text-align: center; color: #6b7280; font-style: italic; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif;">
              Tidak ada data penilaian yang sesuai dengan kriteria filter.
            </td>
          </tr>
        `;
      } else {
        // Sort by average score descending
        const sorted = [...summaryList].sort((a, b) => parseFloat(b.rataRataSkor || b.rataRata || 0) - parseFloat(a.rataRataSkor || a.rataRata || 0));
        sorted.forEach((g, idx) => {
          const scoreNum = parseFloat(g.rataRataSkor || g.rataRata || 0);
          const totalP = parseInt(g.totalPenilai) || 0;
          let predikat = "-";
          if (totalP > 0) {
            if (scoreNum >= 80) predikat = "A";
            else if (scoreNum >= 77) predikat = "A-";
            else if (scoreNum >= 75) predikat = "B+";
            else if (scoreNum >= 70) predikat = "B";
            else if (scoreNum >= 67) predikat = "B-";
            else if (scoreNum >= 64) predikat = "C+";
            else if (scoreNum >= 60) predikat = "C";
            else if (scoreNum >= 50) predikat = "D+";
            else if (scoreNum >= 40) predikat = "D";
            else predikat = "E";
          }

          const presenters = g.rankedPresenters || g.topPresentator || [];
          const topPresentersText = (presenters.length > 0)
            ? presenters.map(p => `${p.name} (${p.votes} Suara)`).join(", ")
            : "-";

          html += `
            <tr style="border-bottom: 1px solid #000000; font-family: 'Times New Roman', Times, serif; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #fafafa;'}">
              <td style="padding: 4.5px 2px; border: 1px solid #000000; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif; font-size: 11.5px;">#${idx + 1}</td>
              <td style="padding: 4.5px 5px; border: 1px solid #000000; font-weight: bold; color: #000000; font-size: 11.5px; font-family: 'Times New Roman', Times, serif; word-break: break-word;">${g.kelompok}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">${g.sesi || 'Minggu 1'}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 11.5px;">${totalP} Mhs</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-weight: bold; font-family: 'Times New Roman', Times, serif; color: #000000; font-size: 11.5px;">${totalP > 0 ? scoreNum.toFixed(2) : '-'}</td>
              <td style="padding: 4.5px 5px; border: 1px solid #000000; color: #000000; font-size: 11px; font-family: 'Times New Roman', Times, serif; word-break: break-word; overflow-wrap: break-word; line-height: 1.25;">${topPresentersText}</td>
              <td style="padding: 4.5px 3px; border: 1px solid #000000; text-align: center; font-weight: 600; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">${predikat}</td>
            </tr>
          `;
        });

        // Summary Row
        html += `
          <tr style="background-color: #f3f4f6; font-weight: bold; border-top: 1.5px solid #000000; text-align: center; font-family: 'Times New Roman', Times, serif;">
            <td colspan="4" style="padding: 5px 6px; text-align: center; vertical-align: middle; border: 1px solid #000000; font-size: 11.5px; font-family: 'Times New Roman', Times, serif;">Rata-Rata Keseluruhan Kelas</td>
            <td style="padding: 5px 4px; border: 1px solid #000000; font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000000; text-align: center; vertical-align: middle;">${avgClassScore}</td>
            <td colspan="2" style="padding: 5px 6px; text-align: center; vertical-align: middle; border: 1px solid #000000; font-size: 11px; font-family: 'Times New Roman', Times, serif; color: #000000;">Total ${summaryList.length} Kelompok (${totalMahasiswa} Mahasiswa)</td>
          </tr>
        `;
      }

      html += `
                  </tbody>
                </table>
              </div>
            </div>
      `;

      // 2. BAGIAN EVALUASI KUALITATIF JIKA DICENTANG
      if (includeReviews && summaryList.length > 0) {
        html += `
          <div class="space-y-1.5" style="margin-top: 16px; padding-top: 2px; margin-bottom: 6px;">
            <h4 class="font-bold uppercase tracking-wider text-zinc-950 print-section-header" style="font-size: 12px; font-weight: 800; margin: 0 0 3px 0; page-break-after: avoid; break-after: avoid; font-family: 'Times New Roman', Times, serif; color: #000000;">
              B. Rangkuman Catatan Evaluasi Masukan Mahasiswa
            </h4>
        `;

        summaryList.forEach(g => {
          const evalList = g.evaluasiList || {};
          const studentKeys = Object.keys(evalList);

          if (studentKeys.length > 0) {
            html += `
              <div class="print-card print-avoid-break rounded border border-zinc-400 bg-zinc-50/50 space-y-1 mb-1.5" style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #9ca3af; border-radius: 4px; padding: 5px 8px;">
                <div class="font-bold text-zinc-950 border-b border-zinc-300 flex items-center justify-between" style="border-bottom: 1px solid #d1d5db; padding-bottom: 2.5px;">
                  <span class="font-extrabold" style="font-size: 11.5px; font-weight: 800;">${g.kelompok}</span>
                  <span class="font-medium font-mono text-zinc-700 bg-zinc-200/80 px-1.5 py-0.5 rounded" style="font-size: 10px;">${g.sesi || 'Minggu 1'}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; padding-top: 2.5px;">
            `;

            studentKeys.forEach(name => {
              const reviews = evalList[name] || [];
              if (reviews.length > 0) {
                html += `
                  <div class="rounded bg-white border border-zinc-200 shadow-2xs" style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 6.5px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding-bottom: 2px; margin-bottom: 3px;">
                      <span style="font-size: 11px; font-weight: 700; color: #111827;">${name}</span>
                      <span style="font-size: 9.5px; font-weight: 600; color: #4b5563; font-family: monospace; background: #f3f4f6; padding: 0.5px 4px; border-radius: 3px;">${reviews.length} Masukan</span>
                    </div>
                    <ul style="list-style-type: disc; padding-left: 14px; margin: 0; font-size: 10.5px; line-height: 1.3; color: #1f2937;">
                      ${reviews.slice(0, 4).map(r => `
                        <li style="margin-bottom: 2px;">
                          <span style="font-style: italic; color: #111827;">"${r.ulasan}"</span>
                          ${includeReviewerName ? `<span style="font-size: 9px; color: #4b5563; font-weight: 600; font-style: normal; margin-left: 3px;">— ${r.penilai || 'Penilai'}</span>` : ''}
                        </li>
                      `).join("")}
                      ${reviews.length > 4 ? `<li style="list-style: none; font-size: 9.5px; color: #6b7280; font-style: italic; margin-top: 1px; padding-left: 0;">+ ${reviews.length - 4} catatan masukan lainnya...</li>` : ''}
                    </ul>
                  </div>
                `;
              }
            });

            html += `
                </div>
              </div>
            `;
          }
        });

        html += `</div>`;
      }

      // LEMBAR TANDA TANGAN / PENGESAHAN RESMI DOSEN
      html += `
            <!-- LEMBAR PENGESAHAN RESMI DOSEN PENGAMPU -->
            <div class="print-signature print-avoid-break" style="page-break-inside: avoid; break-inside: avoid; margin-top: 16px; display: flex; justify-content: flex-end; font-family: 'Times New Roman', Times, serif;">
              <div style="text-align: center; min-width: 240px; max-width: 300px; font-family: 'Times New Roman', Times, serif;">
                <p style="margin: 0; font-size: 11.5px; color: #000000; font-family: 'Times New Roman', Times, serif;">Banjarmasin, ${printDateStr}</p>
                <p style="margin: 1.5px 0 0 0; font-size: 11.5px; font-weight: 700; color: #000000; font-family: 'Times New Roman', Times, serif;">Dosen Pengampu Mata Kuliah,</p>
                <div style="height: 62px;"></div>
                <div style="margin-top: 1px; padding-bottom: 1.5px; border-bottom: 1.5px solid #000000; display: inline-block; min-width: 210px; max-width: 100%;">
                  <span style="font-size: 12px; font-weight: 800; color: #000000; white-space: nowrap; letter-spacing: 0.01em; font-family: 'Times New Roman', Times, serif;">${dosen}</span>
                </div>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #000000; font-weight: 600; font-family: 'Times New Roman', Times, serif;">NIP. 19830514 200812 2 003</p>
              </div>
            </div>

          </div>

          ${includeFooter ? `
            <!-- FOOTER DOKUMEN RESMI MINIMALIS ANCHORED AT BOTTOM -->
            <div class="print-avoid-break print-footer" style="page-break-inside: avoid; break-inside: avoid; margin-top: auto; padding-top: 6px; border-top: 0.75px dashed #9ca3af; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #4b5563; line-height: 1.3; flex-shrink: 0;">
              <span>Dokumen ini diterbitkan secara otomatis oleh <strong>Sistem Peer-Assessment PGSD Kelas ${kelas}</strong> &bull; Universitas Lambung Mangkurat</span>
              <span style="font-family: monospace; color: #6b7280; font-weight: 500;">Waktu Cetak: ${printDateStr}</span>
            </div>
          ` : ''}

        </div>
      `;

      previewEl.innerHTML = html;
      setTimeout(() => {
        applyPrintZoom();
      }, 20);
    }

    // VIRTUAL PAPER ADAPTIVE AUTO-FIT & ZOOM CONTROLLER
    let currentPrintZoom = 1.0;
    let isUserCustomZoom = false;

    function calcAutoFitScale() {
      const container = document.getElementById("printScrollContainer");
      if (!container) return 1.0;
      const availableWidth = container.clientWidth - (window.innerWidth < 640 ? 12 : 24);
      if (availableWidth <= 0) return 1.0;
      if (availableWidth < 794) {
        return Math.max(0.30, Math.min(1.0, Math.round((availableWidth / 794) * 100) / 100));
      }
      return 1.0;
    }

    function adjustPrintZoom(delta) {
      isUserCustomZoom = true;
      currentPrintZoom = Math.min(1.5, Math.max(0.30, Math.round((currentPrintZoom + delta) * 10) / 10));
      applyPrintZoom();
    }

    function resetPrintZoom() {
      isUserCustomZoom = false;
      currentPrintZoom = calcAutoFitScale();
      applyPrintZoom();
    }

    function applyPrintZoom() {
      const area = document.getElementById("printableReportArea");
      const wrapper = document.getElementById("printableReportWrapper");
      const badge = document.getElementById("printZoomBadge");
      
      if (!isUserCustomZoom) {
        currentPrintZoom = calcAutoFitScale();
      }

      if (area) {
        area.style.transform = `scale(${currentPrintZoom})`;
        area.style.transformOrigin = "top left";
        
        const baseHeight = area.offsetHeight || 1020;
        const scaledWidth = Math.ceil(760 * currentPrintZoom);
        const scaledHeight = Math.ceil(baseHeight * currentPrintZoom);

        if (wrapper) {
          wrapper.style.width = `${scaledWidth}px`;
          wrapper.style.minWidth = `${scaledWidth}px`;
          wrapper.style.height = `${scaledHeight}px`;
        }
      }

      if (badge) {
        badge.textContent = isUserCustomZoom ? `${Math.round(currentPrintZoom * 100)}%` : "Fit";
      }
    }

    window.addEventListener("resize", () => {
      if (!isUserCustomZoom) {
        applyPrintZoom();
      }
    });

    function executeBrowserPrint() {
      const toastEl = document.getElementById("toast");
      if (toastEl) toastEl.classList.add("hidden");
      renderPrintPreviewContent();
      const previewEl = document.getElementById("printableReportArea");
      const printRoot = document.getElementById("printDocumentRoot");
      if (previewEl && printRoot) {
        printRoot.innerHTML = previewEl.innerHTML;
      }
      setTimeout(() => {
        window.print();
      }, 50);
    }

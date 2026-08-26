/* ============================================
 * src/student/submission.js
 * Submit, integrity guard, receipt
 * ============================================ */

        }
        if (currentName && currentRekapData.nameToKelompokMap && currentRekapData.nameToKelompokMap[currentName]) {
          currentRekapData.nameToKelompokMap[currentName].forEach(g => {
            if (!filledGroups.some(fg => fg.toLowerCase() === g.toLowerCase())) filledGroups.push(g);
          });
        }
        if (currentEmail && currentRekapData.emailToKelompokMap && currentRekapData.emailToKelompokMap[currentEmail]) {
          currentRekapData.emailToKelompokMap[currentEmail].forEach(g => {
            if (!filledGroups.some(fg => fg.toLowerCase() === g.toLowerCase())) filledGroups.push(g);
          });
        }
      }

      const isAntiSelfEvalActive = appConfig ? (appConfig["Cegah_Penilaian_Diri"] === true || appConfig["Cegah_Penilaian_Diri"] === "true" || appConfig["Cegah_Penilaian_Diri"] === undefined) : true;
      const isSingleLockActive = appConfig ? (appConfig["Kunci_Respons_Ganda"] === true || appConfig["Kunci_Respons_Ganda"] === "true" || appConfig["Kunci_Respons_Ganda"] === undefined) : true;

      groupsData.forEach((grp, idx) => {
        const isSelfGroup = isAntiSelfEvalActive && currentEvaluatorRole === 'Mahasiswa' && evaluatorStudentGroup && evaluatorStudentGroup.toLowerCase() === grp.name.toLowerCase();
        const isAlreadyFilled = isSingleLockActive && filledGroups.some(fg => fg.toLowerCase() === grp.name.toLowerCase());
        const isCurrentlySelected = selectedGroupObj && selectedGroupObj.name === grp.name;
        
        let cardState = "available"; // "available" | "self" | "already_filled"
        if (isSelfGroup) cardState = "self";
        else if (isAlreadyFilled) cardState = "already_filled";

        const isLocked = cardState !== "available";

        // Jika kelompok yang sebelumnya dipilih ternyata sudah terkunci, batalkan pilihan
        if (isLocked && isCurrentlySelected) {
          selectedGroupObj = null;
        }

        const card = document.createElement("label");
        card.id = `groupCard_${idx}`;
        
        let cardBgBorder = "border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer";
        let statusBadge = "";

        if (cardState === "already_filled") {
          cardBgBorder = "border-emerald-300 bg-emerald-50/50 opacity-85 cursor-not-allowed select-none";
          statusBadge = `
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300/80">
              <svg class="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
              Sudah Dinilai • Terkunci
            </span>
          `;
        } else if (cardState === "self") {
          cardBgBorder = "border-purple-200 bg-purple-50/40 opacity-80 cursor-not-allowed select-none";
          statusBadge = `
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
              Kelompok Anda (Penyaji)
            </span>
          `;
        } else if (isCurrentlySelected) {
          cardBgBorder = "border-zinc-900 bg-zinc-50 shadow-xs cursor-pointer";
          statusBadge = `
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
              ${grp.members.length} Pemateri
            </span>
          `;
        } else {
          statusBadge = `
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
              ${grp.members.length} Pemateri
            </span>
          `;
        }

        const memberPills = grp.members.map(m => `
          <span class="inline-block bg-zinc-100 text-zinc-700 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">
            ${m.name}
          </span>
        `).join(" ");

        card.className = `group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border transition-all ${cardBgBorder}`;
        
        card.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <input type="radio" name="selectedGroup" value="${grp.name}" 
                ${isCurrentlySelected && !isLocked ? 'checked' : ''} 
                ${isLocked ? 'disabled' : ''} 
                class="accent-zinc-900 h-4 w-4 ${isLocked ? 'pointer-events-none opacity-40' : ''}" 
                onchange="onSelectGroup('${grp.name}', ${idx})"
              >
              <span class="font-bold text-zinc-900 text-xs sm:text-sm truncate">${grp.name}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-zinc-100">
            ${memberPills}
          </div>
          ${cardState === 'already_filled' ? '<p class="text-[10.5px] text-emerald-800 font-medium mt-2 pt-1 border-t border-emerald-200/60">Penilaian Anda untuk kelompok ini telah resmi tersimpan di database.</p>' : ''}
          ${cardState === 'self' ? '<p class="text-[10.5px] text-purple-800 font-medium mt-2 pt-1 border-t border-purple-200/60">Anda adalah anggota penyaji kelompok ini (tidak dapat menilai diri sendiri).</p>' : ''}
        `;

        if (!isLocked) {
          card.onclick = () => {
            const radio = card.querySelector("input[type='radio']");
            if (radio && !radio.disabled) {
              radio.checked = true;
              onSelectGroup(grp.name, idx);
            }
          };
        } else {
          card.onclick = (e) => {
            e.preventDefault();
            if (cardState === 'already_filled') {
              showToast(`Anda sudah pernah menilai ${grp.name}. Pilihan ini dibekukan secara otomatis.`, "info");
            } else if (cardState === 'self') {
              showToast(`Anda adalah anggota penyaji ${grp.name} (tidak dapat menilai diri sendiri).`, "info");
            }
          };
        }

        fragment.appendChild(card);
      });

      container.appendChild(fragment);
    }

    function onSelectGroup(groupName, idx) {
      document.querySelectorAll(".group-card").forEach(c => {
        c.className = "group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition-all";
      });
      const activeCard = document.getElementById(`groupCard_${idx}`);
      if (activeCard) {
        activeCard.className = "group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-zinc-900 bg-zinc-50 shadow-xs cursor-pointer transition-all";
      }

      selectedGroupObj = groupsData.find(g => g.name === groupName);
      if (!selectedGroupObj) return;

      selectedBestPresenters = [];
      updateBestPresenterBadge();

      // Checkbox Presenter
      const bestList = document.getElementById("bestPresenterList");
      if (bestList) {
        bestList.innerHTML = "";
        selectedGroupObj.members.forEach((member, mIdx) => {
          const item = document.createElement("label");
          item.id = `bestPresCard_${mIdx}`;
          item.className = "flex items-center p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition text-xs";
          item.innerHTML = `
            <input type="checkbox" value="${member.name}" class="accent-zinc-900 h-4 w-4 rounded flex-shrink-0" onchange="handleBestPresenterChange(this, ${mIdx})">
            <div class="ml-2.5 min-w-0 flex-1 flex items-center justify-between gap-2">
              <span class="font-medium text-zinc-900 truncate">${member.name}</span>
              <span class="text-[10px] text-zinc-400 font-mono">${member.nim || 'NIM -'}</span>
            </div>
          `;
          bestList.appendChild(item);
        });
      }

      // Textarea Evaluasi
      const evalContainer = document.getElementById("evaluationInputsContainer");
      if (evalContainer) {
        evalContainer.innerHTML = "";
        const maxChars = parseInt(appConfig["Maksimal_Karakter_Evaluasi"] || 500);

        selectedGroupObj.members.forEach((member, eIdx) => {
          const box = document.createElement("div");
          box.className = "p-3.5 sm:p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2";
          box.innerHTML = `
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-zinc-800 text-xs sm:text-sm truncate">
                ${eIdx + 1}. ${member.name} <span class="text-[10px] font-normal text-zinc-500 font-mono">(${member.nim || 'NIM -'})</span>
              </span>
              <span id="charCount_${eIdx}" class="text-[10px] text-zinc-400 font-mono">0/${maxChars}</span>
            </div>
            <textarea 
              id="evalText_${eIdx}" 
              data-member="${member.name}" 
              required 
              rows="2" 
              maxlength="${maxChars}" 
              placeholder="Tuliskan masukan evaluasi untuk ${member.name}..." 
              class="w-full p-2.5 rounded-lg border border-zinc-300 text-xs sm:text-sm focus:border-zinc-900 outline-none bg-white transition leading-relaxed placeholder-zinc-400"
              oninput="updateCharCounter(this, 'charCount_${eIdx}', ${maxChars}); saveFormDraft();"
            ></textarea>
          `;
          evalContainer.appendChild(box);
        });
      }

      saveFormDraft();
    }

    // Flow Navigation: Info Form vs Wizard Form
    function startAssessmentForm() {
      const authGate = document.getElementById("formAuthGateSection");
      const overview = document.getElementById("formOverviewSection");
      const wizard = document.getElementById("formWizardContainer");
      if (authGate) authGate.classList.add("hidden");
      if (overview) overview.classList.add("hidden");
      if (wizard) wizard.classList.remove("hidden");
      if (!document.getElementById("stepSection_1")) {
        renderDynamicClientStages();
      }
      updateStepUI(currentStep || 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goToInfoOverview() {
      const authGate = document.getElementById("formAuthGateSection");
      const overview = document.getElementById("formOverviewSection");
      const wizard = document.getElementById("formWizardContainer");
      if (authGate) authGate.classList.add("hidden");
      if (overview) overview.classList.remove("hidden");
      if (wizard) wizard.classList.add("hidden");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Navigation Step
    function updateStepUI(step, skipSave = false) {
      if (!document.getElementById("stepSection_1")) {
        renderDynamicClientStages();
      }
      currentStep = step;
      const totalSteps = Object.keys(stepMetadata).length || 1;
      const meta = (stepMetadata && stepMetadata[step]) || {
        badge: `${step < 10 ? '0' + step : step}/${totalSteps < 10 ? '0' + totalSteps : totalSteps}`,
        title: `Bagian ${step}`,
        percent: Math.round((step / totalSteps) * 100)
      };

      const badgeEl = document.getElementById("stepNumberBadge");
      const titleEl = document.getElementById("stepTitleLabel");
      const percentEl = document.getElementById("stepPercentLabel");
      const barEl = document.getElementById("progressBarFill");

      if (badgeEl) badgeEl.textContent = meta.badge;
      if (titleEl) titleEl.textContent = meta.title;
      if (percentEl) percentEl.textContent = `${meta.percent}%`;
      if (barEl) barEl.style.width = `${meta.percent}%`;

      for (let i = 1; i <= totalSteps; i++) {
        const sec = document.getElementById(`stepSection_${i}`);
        const tabBtn = document.getElementById(`stepTab_${i}`);
        
        if (sec) {
          if (i === step) {
            sec.classList.remove("hidden");
          } else {
            sec.classList.add("hidden");
          }
        }

        if (tabBtn) {
          if (i === step) {
            tabBtn.className = "py-1.5 px-1 rounded text-[10px] sm:text-[11px] font-bold transition text-zinc-900 bg-zinc-100 border border-zinc-400 shadow-2xs truncate";
          } else if (i < step) {
            tabBtn.className = "py-1.5 px-1 rounded text-[10px] sm:text-[11px] font-semibold transition text-emerald-800 bg-emerald-50 border border-emerald-300 cursor-pointer truncate";
          } else {
            tabBtn.className = "py-1.5 px-1 rounded text-[10px] sm:text-[11px] font-medium transition text-zinc-400 bg-zinc-50 border border-transparent truncate";
          }
        }
      }

      if (!skipSave) {
        saveFormDraft();
      } else {
        updateDraftResetButtonVisibility();
      }

      setTimeout(() => {
        const stageSec = document.getElementById(`stepSection_${step}`);
        if (stageSec) renderAllMathInElement(stageSec);
        renderAllMathInElement(document.getElementById("dynamicStagesContainer") || document.body);
      }, 40);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function goToStep(targetStep) {
      if (targetStep === currentStep) return;

      if (targetStep > currentStep) {
        // Validate required fields inside current stage
        const currentStageSec = document.getElementById(`stepSection_${currentStep}`);
        if (currentStageSec) {
          const requiredInputs = currentStageSec.querySelectorAll('input[required], textarea[required], select[required]');
          for (let input of requiredInputs) {
            if (!input.value || !input.value.trim()) {
              input.focus();
              showToast("Mohon lengkapi seluruh pertanyaan bertanda wajib (*) sebelum melanjutkan.", "warning");
              return;
            }
          }
        }

        // Additional integrity validation when moving from Step 2 to Step 3
        if (currentStep === 2 && targetStep > 2) {
          if (!selectedGroupObj) {
            showToast("Pilih salah satu kelompok presentator sebelum melanjutkan!", "warning");
            return;
          }

          const currentNim = (
            document.getElementById("inputNim")?.value || 
            clientCustomFormAnswers["fld_core_identity_nim"] || 
            activeUserAccountNim || 
            ""
          ).replace(/\s+/g, "").trim().toLowerCase();

          const currentEmail = (
            document.getElementById("inputEmail")?.value || 
            clientCustomFormAnswers["fld_core_identity_email"] || 
            activeUserAccountEmail || 
            ""
          ).trim().toLowerCase();

          const singleSubmissionLock = appConfig && appConfig["Kunci_Respons_Ganda"] !== false && appConfig["Kunci_Respons_Ganda"] !== "false";
          let isDuplicate = false;
          if (singleSubmissionLock && currentRekapData) {
            if (currentNim && currentRekapData.nimToKelompokMap && currentRekapData.nimToKelompokMap[currentNim]) {
              if (currentRekapData.nimToKelompokMap[currentNim].some(g => g.toLowerCase() === selectedGroupObj.name.toLowerCase())) {
                isDuplicate = true;
              }
            }
            if (currentEmail && currentRekapData.emailToKelompokMap && currentRekapData.emailToKelompokMap[currentEmail]) {
              if (currentRekapData.emailToKelompokMap[currentEmail].some(g => g.toLowerCase() === selectedGroupObj.name.toLowerCase())) {
                isDuplicate = true;
              }
            }
          }

          if (isDuplicate) {
            showToast(`Anda sudah pernah mengirimkan penilaian untuk ${selectedGroupObj.name}. Pilihan dibekukan.`, "error");
            selectedGroupObj = null;
            renderGroupOptions();
            return;
          }
        }
      }

      if (targetStep === 2) {
        renderGroupOptions();
      }

      updateStepUI(targetStep);
    }

    // =========================================================================
    // SMART ROLE & NIM-DRIVEN IDENTITY FUNCTIONS (STEP 1)
    // =========================================================================
    function fillNimEmailFormat() {
      const cleanNim = (document.getElementById("inputNim")?.value || "").trim();
      if (!cleanNim) {
        showToast("Masukkan NIM Anda terlebih dahulu!", "warning");
        return;
      }
      const inputEmail = document.getElementById("inputEmail");
      if (inputEmail) {
        inputEmail.value = `${cleanNim}@mhs.ulm.ac.id`;
        validateEmailLive(inputEmail.value);
        saveFormDraft();
        showToast("Format email NIM berhasil diisi.", "success");
      }
    }

    function onRoleChange(role) {
      currentEvaluatorRole = role || 'Mahasiswa';

      const selectEl = document.getElementById("selectPeranPenilai");
      if (selectEl && role && selectEl.value !== role) {
        selectEl.value = role;
      }

      const nimContainer = document.getElementById("nimContainer");
      const identityFieldsContainer = document.getElementById("identityFieldsContainer");
      const autoFillNotice = document.getElementById("namaAutoFillNotice");
      const btnFillNimEmail = document.getElementById("btnFillNimEmail");
      const inputNama = document.getElementById("inputNama");
      const inputEmail = document.getElementById("inputEmail");
      const step1Subtitle = document.getElementById("step1Subtitle");

      if (!role) {
        if (nimContainer) nimContainer.classList.add("hidden");
        if (identityFieldsContainer) identityFieldsContainer.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Pilih peran penilai Anda terlebih dahulu untuk memulai pengisian identitas.";
        return;
      }

      if (identityFieldsContainer) identityFieldsContainer.classList.remove("hidden");

      if (role === 'Mahasiswa') {
        if (nimContainer) nimContainer.classList.remove("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Masukkan NIM Anda untuk verifikasi otomatis data mahasiswa.";
        if (inputNama) inputNama.placeholder = "Tuliskan nama lengkap Anda...";
        if (inputEmail) inputEmail.placeholder = "contoh: 221012310001@mhs.ulm.ac.id";
        
        const currentNim = document.getElementById("inputNim")?.value || "";
        if (currentNim) {
          validateNimLive(currentNim);
        } else {
          if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        }
      } else if (role === 'Dosen') {
        if (nimContainer) nimContainer.classList.add("hidden");
        if (autoFillNotice) autoFillNotice.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Masukkan nama dan email dosen pengampu / penguji.";
        if (inputNama) {
          inputNama.placeholder = "Tuliskan nama lengkap Dosen beserta gelar...";
        }
        if (inputEmail) {
          inputEmail.placeholder = "email.dosen@ulm.ac.id";
        }
      } else if (role === 'Lainnya') {
        if (nimContainer) nimContainer.classList.add("hidden");
        if (autoFillNotice) autoFillNotice.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (step1Subtitle) step1Subtitle.textContent = "Masukkan nama dan email penilai tamu / umum.";
        if (inputNama) {
          inputNama.placeholder = "Tuliskan nama lengkap penilai tamu...";
        }
        if (inputEmail) {
          inputEmail.placeholder = "email.penilai@domain.com";
        }
      }
      saveFormDraft();
    }

    function validateNimLive(nimVal) {
      const cleanNim = String(nimVal || "").replace(/\s+/g, "").trim().toLowerCase();
      const nimInput = document.getElementById("inputNim");
      const iconEl = document.getElementById("nimStatusIcon");
      const feedbackBox = document.getElementById("nimFeedbackBox");
      const autoFillNotice = document.getElementById("namaAutoFillNotice");
      const btnFillNimEmail = document.getElementById("btnFillNimEmail");
      const inputNama = document.getElementById("inputNama");

      if (!cleanNim) {
        if (iconEl) iconEl.classList.add("hidden");
        if (feedbackBox) feedbackBox.classList.add("hidden");
        if (autoFillNotice) autoFillNotice.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");
        if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-lg border border-zinc-300 text-xs sm:text-sm font-mono focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400";
        updateDraftResetButtonVisibility();
        return false;
      }

      let foundStudent = null;
      let foundGroupName = "";
      let foundGroupSesi = "";

      // 1. Cari di allStudentsData (Roster Master Seluruh Mahasiswa Kelas)
      if (allStudentsData && allStudentsData.length > 0) {
        for (const s of allStudentsData) {
          const sNim = String(s.nim || "").replace(/\s+/g, "").trim().toLowerCase();
          if (sNim && sNim === cleanNim) {
            foundStudent = s;
            foundGroupName = s.kelompok || "Kelompok Terdaftar";
            foundGroupSesi = s.sesi || "Minggu 1";
            break;
          }
        }
      }

      // 2. Fallback cari di groupsData jika allStudentsData belum terisi
      if (!foundStudent && groupsData && groupsData.length > 0) {
        for (const g of groupsData) {
          const m = (g.members || []).find(mem => {
            const mNim = String(mem.nim || "").replace(/\s+/g, "").trim().toLowerCase();
            return mNim && mNim === cleanNim;
          });
          if (m) {
            foundStudent = m;
            foundGroupName = g.name || "Kelompok Terdaftar";
            foundGroupSesi = g.sesi || "Minggu 1";
            break;
          }
        }
      }

      if (foundStudent) {
        if (iconEl) iconEl.classList.remove("hidden");
        if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-lg border border-emerald-500 text-xs sm:text-sm font-mono focus:border-emerald-600 outline-none transition bg-emerald-50/20";
        
        if (feedbackBox) {
          feedbackBox.className = "text-xs rounded-lg p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between";
          feedbackBox.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
              <div>
                <span class="font-bold block">${foundStudent.name}</span>
                <span class="text-[10px] text-emerald-700 block font-medium">${foundGroupName} (${foundGroupSesi})</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-200/80 font-bold text-emerald-800">Terdaftar</span>
          `;
          feedbackBox.classList.remove("hidden");
        }

        // Auto-fill nama mahasiswa (tetap dapat disunting manual)
        if (inputNama) {
          inputNama.value = foundStudent.name;
        }
        if (autoFillNotice) autoFillNotice.classList.remove("hidden");
        
        // Tampilkan tombol khusus jika ingin mengisi format NIM@mhs.ulm.ac.id
        if (btnFillNimEmail) {
          btnFillNimEmail.classList.remove("hidden");
        }

        activeUserAccountNim = cleanNim;
        renderGroupOptions();
        return true;
      } else {
        if (iconEl) iconEl.classList.add("hidden");
        if (autoFillNotice) autoFillNotice.classList.add("hidden");
        if (btnFillNimEmail) btnFillNimEmail.classList.add("hidden");

        if (cleanNim.length >= 6) {
          if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-lg border border-amber-400 text-xs sm:text-sm font-mono focus:border-amber-600 outline-none transition bg-amber-50/20";
          if (feedbackBox) {
            feedbackBox.className = "text-[11px] rounded-lg p-2.5 bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2";
            feedbackBox.innerHTML = `
              <span class="p-1 rounded bg-amber-200 text-amber-800 flex-shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </span>
              <span>NIM <strong>${cleanNim}</strong> tidak ditemukan di daftar mahasiswa kelas ini. Pastikan digit NIM sudah benar atau pilih peran <em>Dosen / Lainnya</em>.</span>
            `;
            feedbackBox.classList.remove("hidden");
          }
        } else {
          if (nimInput) nimInput.className = "w-full pl-3.5 pr-16 py-2.5 rounded-lg border border-zinc-300 text-xs sm:text-sm font-mono focus:border-zinc-900 outline-none transition bg-white placeholder-zinc-400";
          if (feedbackBox) feedbackBox.classList.add("hidden");
        }
        activeUserAccountNim = cleanNim;
        renderGroupOptions();
        return false;
      }
    }

    function nextFromStep1() {
      const email = document.getElementById("inputEmail").value.trim();
      const nama = document.getElementById("inputNama").value.trim();
      const nim = document.getElementById("inputNim") ? document.getElementById("inputNim").value.trim() : "";

      if (currentEvaluatorRole === 'Mahasiswa') {
        if (!nim) {
          showToast("Nomor Induk Mahasiswa (NIM) wajib diisi!", "warning");
          document.getElementById("inputNim").focus();
          return;
        }
        const isNimValid = validateNimLive(nim);
        if (!isNimValid && nim.length < 6) {
          showToast("Masukkan NIM mahasiswa yang valid!", "warning");
          document.getElementById("inputNim").focus();
          return;
        }
      }

      if (!nama) {
        showToast("Nama lengkap penilai wajib diisi!", "warning");
        document.getElementById("inputNama").focus();
        return;
      }

      if (!validateEmailLive(email)) {
        showToast("Masukkan alamat email yang valid!", "error");
        document.getElementById("inputEmail").focus();
        return;
      }

      updateStepUI(2);
    }

    function nextFromStep2() {
      if (!selectedGroupObj) {
        showToast("Pilih salah satu kelompok yang dinilai!", "warning");
        return;
      }
      updateStepUI(3);
    }

    function nextFromStep3() {
      if (selectedBestPresenters.length === 0) {
        showToast("Pilih minimal 1 orang presentator terbaik!", "warning");
        return;
      }

      document.getElementById("summaryPenilai").textContent = document.getElementById("inputNama").value.trim() + ` (${currentEvaluatorRole})`;
      document.getElementById("summaryKelompok").textContent = selectedGroupObj.name;
      document.getElementById("summarySkor").textContent = document.getElementById("inputNilaiNumber").value;
      document.getElementById("summaryPresentator").textContent = selectedBestPresenters.join(", ");

      updateStepUI(4);
    }

    // Score & Presenter Logic
    function setScoreValue(val) {
      document.getElementById("inputNilaiSlider").value = val;
      document.getElementById("inputNilaiNumber").value = val;
      updateScoreBadge(val);
      saveFormDraft();
    }

    function adjustScore(delta) {
      const numInput = document.getElementById("inputNilaiNumber");
      let val = parseInt(numInput.value || 85) + delta;
      const min = parseInt(numInput.min || 50);
      const max = parseInt(numInput.max || 100);
      if (val >= min && val <= max) {
        setScoreValue(val);
      }
    }

    function syncScore(val, source) {
      if (source === 'slider') {
        document.getElementById("inputNilaiNumber").value = val;
      } else {
        document.getElementById("inputNilaiSlider").value = val;
      }
      updateScoreBadge(val);
      saveFormDraft();
    }

    function updateScoreBadge(val) {
      const v = parseFloat(val);
      const badge = document.getElementById("scoreGradeBadge");
      if (!badge) return;
      if (v >= 80) {
        badge.textContent = "Nilai A (4,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200";
      } else if (v >= 77) {
        badge.textContent = "Nilai A- (3,75)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200";
      } else if (v >= 75) {
        badge.textContent = "Nilai B+ (3,50)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200";
      } else if (v >= 70) {
        badge.textContent = "Nilai B (3,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200";
      } else if (v >= 67) {
        badge.textContent = "Nilai B- (2,75)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200";
      } else if (v >= 64) {
        badge.textContent = "Nilai C+ (2,50)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200";
      } else if (v >= 60) {
        badge.textContent = "Nilai C (2,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200";
      } else if (v >= 50) {
        badge.textContent = "Nilai D+ (1,50)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200";
      } else if (v >= 40) {
        badge.textContent = "Nilai D (1,00)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200";
      } else {
        badge.textContent = "Nilai E (0)";
        badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200";
      }
    }

    function handleBestPresenterChange(checkbox, mIdx) {
      const maxAllowed = parseInt(appConfig["Maksimal_Pilihan_Presentator_Terbaik"] || 2);
      const val = checkbox.value;
      const card = document.getElementById(`bestPresCard_${mIdx}`);

      if (checkbox.checked) {
        if (selectedBestPresenters.length >= maxAllowed) {
          checkbox.checked = false;
          showToast(`Maksimal hanya boleh memilih ${maxAllowed} orang!`, "warning");
          return;
        }
        selectedBestPresenters.push(val);
        if (card) card.className = "flex items-center p-3 rounded-lg border border-zinc-900 bg-zinc-50 cursor-pointer transition text-xs shadow-2xs";
      } else {
        selectedBestPresenters = selectedBestPresenters.filter(name => name !== val);
        if (card) card.className = "flex items-center p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition text-xs";
      }
      updateBestPresenterBadge();
      saveFormDraft();
    }

    function updateBestPresenterBadge() {
      const maxAllowed = parseInt(appConfig["Maksimal_Pilihan_Presentator_Terbaik"] || 2);
      const badge = document.getElementById("bestPresenterCountBadge");
      badge.textContent = `${selectedBestPresenters.length}/${maxAllowed} Terpilih`;
    }

    function updateCharCounter(textarea, counterId, maxChars) {
      const len = textarea.value.length;
      const counterEl = document.getElementById(counterId);
      if (counterEl) {
        counterEl.textContent = `${len}/${maxChars}`;
        if (len >= maxChars) {
          counterEl.className = "text-[10px] text-rose-600 font-mono font-bold";
        } else {
          counterEl.className = "text-[10px] text-zinc-400 font-mono";
        }
      }
    }

    // =========================================================================
    // AUTO-SAVE FORM DRAFT ENGINE (PENYIMPANAN OTOMATIS ISIAN MAHASISWA)
    // =========================================================================
    function hasAnyFormInputFilled() {
      try {
        const nim = document.getElementById("inputNim") ? document.getElementById("inputNim").value.trim() : "";
        const nama = document.getElementById("inputNama") ? document.getElementById("inputNama").value.trim() : "";
        const email = document.getElementById("inputEmail") ? document.getElementById("inputEmail").value.trim() : "";
        if (nim.length > 0 || nama.length > 0 || email.length > 0) return true;
        if (selectedGroupObj) return true;
        if (selectedBestPresenters && selectedBestPresenters.length > 0) return true;

        let hasEval = false;
        document.querySelectorAll("#evaluationInputsContainer textarea").forEach(ta => {
          if (ta.value.trim().length > 0) hasEval = true;
        });
        if (hasEval) return true;

        const raw = localStorage.getItem(getFormDraftKey());
        if (raw) {
          const d = JSON.parse(raw);
          if (d && (d.nim || d.nama || d.email || d.groupName || (d.bestPresenters && d.bestPresenters.length > 0) || (d.evaluasi && Object.keys(d.evaluasi).length > 0))) {
            return true;
          }
        }
      } catch (e) {}
      return false;
    }

    function updateDraftResetButtonVisibility() {
      const hasData = hasAnyFormInputFilled();
      document.querySelectorAll(".btnResetDraft").forEach(btn => {
        if (hasData) {
          btn.classList.remove("hidden");
        } else {
          btn.classList.add("hidden");
        }
      });
      const indicator = document.getElementById("autoSaveIndicator");
      if (indicator && !hasData) {
        indicator.classList.add("hidden");
      }
    }

    function saveFormDraft() {
      try {
        const peran = currentEvaluatorRole || "Mahasiswa";
        const nim = document.getElementById("inputNim") ? document.getElementById("inputNim").value : "";
        const email = document.getElementById("inputEmail") ? document.getElementById("inputEmail").value : "";
        const nama = document.getElementById("inputNama") ? document.getElementById("inputNama").value : "";
        const groupName = selectedGroupObj ? selectedGroupObj.name : "";
        const nilai = document.getElementById("inputNilaiNumber") ? document.getElementById("inputNilaiNumber").value : "85";
        
        const evaluasi = {};
        document.querySelectorAll("#evaluationInputsContainer textarea").forEach(ta => {
          const member = ta.getAttribute("data-member");
          if (member) {
            evaluasi[member] = ta.value;
          }
        });

        // Hanya simpan jika ada isian yang diinputkan pengguna
        if (!email && !nama && !nim && !groupName && selectedBestPresenters.length === 0 && Object.keys(evaluasi).length === 0) {
          updateDraftResetButtonVisibility();
          return;
        }

        const draft = {
          formId: activeFormId,
          peran: peran,
          nim: nim,
          email: email,
          nama: nama,
          groupName: groupName,
          nilai: nilai,
          bestPresenters: selectedBestPresenters,
          evaluasi: evaluasi,
          customAnswers: clientCustomFormAnswers || {},
          uploadedFiles: customUploadedFilesMap || {},
          step: currentStep,
          timestamp: Date.now()
        };

        const draftKey = getFormDraftKey(email);
        localStorage.setItem(draftKey, JSON.stringify(draft));

        if (email) {
          saveAccountProfile(email, nama, nim, peran);
          activeUserAccountEmail = email;
          activeUserAccountName = nama;
          updateAccountHeaderUI();
        }

        const indicator = document.getElementById("autoSaveIndicator");
        if (indicator) indicator.classList.remove("hidden");
      } catch (e) {}
      updateDraftResetButtonVisibility();
    }

    function getFormDraftKey(specificEmail = null) {
      const emailInput = document.getElementById("inputEmail");
      const currentEmail = specificEmail || (emailInput && emailInput.value.trim()) || activeUserAccountEmail || "";
      const cleanEmail = currentEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (cleanEmail) {
        return "PGSD_DRAFT_" + (activeFormId || 'BK5E').toUpperCase() + "_" + cleanEmail;
      }
      return "PGSD_DRAFT_" + (activeFormId || 'BK5E').toUpperCase() + "_DEFAULT";
    }

    // =========================================================================
    // GOOGLE FORMS STYLE: ACCOUNT SESSION & PROFILE MEMORY
    // =========================================================================
    function appendEmailDomain(domain) {
      const emailInput = document.getElementById("inputEmail");
      if (!emailInput) return;
      let val = emailInput.value.trim();
      if (!val) {
        const nim = document.getElementById("inputNim")?.value.trim();
        val = nim || "user";
      }
      if (val.includes("@")) {
        val = val.split("@")[0] + domain;
      } else {
        val = val + domain;
      }
      emailInput.value = val;
      validateEmailLive(val);
      updateAccountActiveEmail(val);
      saveFormDraft();
    }

    function appendSwitchModalDomain(domain) {
      const input = document.getElementById("switchModalInputEmail");
      if (!input) return;
      let val = input.value.trim();
      if (!val) {
        const nim = document.getElementById("switchModalInputNim")?.value.trim();
        val = nim || "user";
      }
      if (val.includes("@")) {
        val = val.split("@")[0] + domain;
      } else {
        val = val + domain;
      }
      input.value = val;
    }

    function updateAccountActiveEmail(emailVal) {
      activeUserAccountEmail = (emailVal || "").trim();
      const namaVal = document.getElementById("inputNama")?.value.trim() || "";
      if (namaVal) activeUserAccountName = namaVal;
      updateAccountHeaderUI();
    }

    function updateAccountHeaderUI() {
      const card = document.getElementById("formAccountHeaderCard");
      if (card) card.classList.add("hidden");
    }

    function getSavedAccountProfiles() {
      try {
        return JSON.parse(localStorage.getItem("PGSD_SAVED_PROFILES") || "[]");
      } catch (e) {
        return [];
      }
    }

    function saveAccountProfile(email, name, nim, role) {
      if (!email || !email.includes("@")) return;
      let profiles = getSavedAccountProfiles();
      profiles = profiles.filter(p => p.email.toLowerCase() !== email.toLowerCase());
      profiles.unshift({
        email: email.trim(),
        name: name || "",
        nim: nim || "",
        role: role || "Mahasiswa",
        lastUsed: Date.now()
      });
      if (profiles.length > 5) profiles = profiles.slice(0, 5);
      try {
        localStorage.setItem("PGSD_SAVED_PROFILES", JSON.stringify(profiles));
      } catch (e) {}
    }

    async function handleSwitchGoogleAccount() {
      const ok = await showAppConfirm({
        title: "Ganti Akun Google?",
        message: "Anda akan dialihkan ke layar pemilihan Akun Google resmi Anda. Draf isian saat ini tetap tersimpan aman di akun ini.",
        confirmText: "Ya, Ganti Akun Google",
        cancelText: "Batal",
        type: "info"
      });
      if (ok) {
        clearAuthSession();
        handleGoogleSignIn();
      }
    }

    // =========================================================================
    // DEDICATED AUTHENTICATION GATE & SESSION CONTROLLER (GOOGLE FORMS STYLE)
    // =========================================================================
    function getCurrentAuthSession() {
      try {
        const formKey = (activeFormId || 'BK5E').toUpperCase();
        const key = "PGSD_AUTH_SESSION_" + formKey;
        const raw = localStorage.getItem(key) || 
                    sessionStorage.getItem(key) || 
                    localStorage.getItem("PGSD_AUTH_SESSION_BK5E") || 
                    sessionStorage.getItem("PGSD_AUTH_SESSION_BK5E") || 
                    localStorage.getItem("PGSD_AUTH_SESSION_PRIMARY");
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    function setAuthSession(user, remember = true) {
      if (!user || !user.email) return;
      const key = "PGSD_AUTH_SESSION_" + (activeFormId || 'BK5E').toUpperCase();
      const payload = {
        email: user.email.trim(),
        nama: user.nama || user.name || "",
        nim: user.nim || "",
        peran: user.peran || "Mahasiswa",
        avatarUrl: user.avatarUrl || "",
        provider: user.provider || "manual",
        loginAt: Date.now()
      };
      if (remember) {
        localStorage.setItem(key, JSON.stringify(payload));
        localStorage.setItem("PGSD_AUTH_SESSION_PRIMARY", JSON.stringify(payload));
        localStorage.setItem("PGSD_AUTH_SESSION_BK5E", JSON.stringify(payload));
      } else {
        sessionStorage.setItem(key, JSON.stringify(payload));
        sessionStorage.setItem("PGSD_AUTH_SESSION_PRIMARY", JSON.stringify(payload));
        sessionStorage.setItem("PGSD_AUTH_SESSION_BK5E", JSON.stringify(payload));
      }
      activeUserAccountEmail = payload.email;
      activeUserAccountName = payload.nama;
      activeUserAccountNim = payload.nim;
      activeUserAccountAvatarUrl = payload.avatarUrl || "";
      if (payload.peran) currentEvaluatorRole = payload.peran;
      saveAccountProfile(payload.email, payload.nama, payload.nim, payload.peran);
    }

    function clearAuthSession() {
      const key = "PGSD_AUTH_SESSION_" + (activeFormId || 'BK5E').toUpperCase();
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      localStorage.removeItem("PGSD_AUTH_SESSION_PRIMARY");
      sessionStorage.removeItem("PGSD_AUTH_SESSION_PRIMARY");
      localStorage.removeItem("PGSD_AUTH_SESSION_BK5E");
      sessionStorage.removeItem("PGSD_AUTH_SESSION_BK5E");
      activeUserAccountEmail = "";
      activeUserAccountName = "";
      activeUserAccountNim = "";
      activeUserAccountAvatarUrl = "";
      try {
        if (supabaseClient && supabaseClient.auth) {
          supabaseClient.auth.signOut();
        }
      } catch (e) {}
    }

    function checkAndApplyAuthGate() {
      const authGate = document.getElementById("formAuthGateSection");
      const overview = document.getElementById("formOverviewSection");
      const wizard = document.getElementById("formWizardContainer");

      if (authGate) authGate.classList.add("hidden");

      // Tampilkan halaman Overview (Panduan Form) secara default jika wizard belum dibuka
      if (overview && (!wizard || wizard.classList.contains("hidden"))) {
        overview.classList.remove("hidden");
      }

      updateAccountHeaderUI();
    }

    function handleAuthRoleChange(role) {
      const nimContainer = document.getElementById("authNimContainer");
      const btnFillEmail = document.getElementById("btnAuthFillNimEmail");
      if (role === 'Mahasiswa') {
        if (nimContainer) nimContainer.classList.remove("hidden");
        if (btnFillEmail) btnFillEmail.classList.remove("hidden");
      } else {
        if (nimContainer) nimContainer.classList.add("hidden");
        if (btnFillEmail) btnFillEmail.classList.add("hidden");
      }
    }

    function validateAuthNimLive(nimVal) {
      const cleanNim = (nimVal || "").trim();
      const statusIcon = document.getElementById("authNimStatusIcon");
      const autoNotice = document.getElementById("authNimAutoNotice");
      const feedbackBox = document.getElementById("authNimFeedbackBox");
      const namaInput = document.getElementById("authInputNama");
      const btnFillEmail = document.getElementById("btnAuthFillNimEmail");

      if (!cleanNim) {
        if (statusIcon) statusIcon.classList.add("hidden");
        if (autoNotice) autoNotice.classList.add("hidden");
        if (feedbackBox) feedbackBox.classList.add("hidden");
        if (btnFillEmail) btnFillEmail.classList.add("hidden");
        return;
      }

      if (btnFillEmail) btnFillEmail.classList.remove("hidden");

      if (allStudentsData && allStudentsData.length > 0) {
        const found = allStudentsData.find(s => String(s.nim).trim() === cleanNim);
        if (found) {
          if (statusIcon) statusIcon.classList.remove("hidden");
          if (autoNotice) autoNotice.classList.remove("hidden");
          if (namaInput && (!namaInput.value || namaInput.value === '')) {
            namaInput.value = found.name;
          }
          if (feedbackBox) {
            feedbackBox.className = "text-xs rounded-lg p-2 bg-emerald-50 text-emerald-800 border border-emerald-200";
            feedbackBox.innerHTML = `<span>Terdaftar sebagai: <strong>${escapeHtml(found.name)}</strong> (${escapeHtml(found.kelompok || 'Mahasiswa')})</span>`;
            feedbackBox.classList.remove("hidden");
          }
          return;
        }
      }

      if (statusIcon) statusIcon.classList.add("hidden");
      if (autoNotice) autoNotice.classList.add("hidden");
      if (feedbackBox) {
        if (cleanNim.length >= 6) {
          feedbackBox.className = "text-xs rounded-lg p-2 bg-zinc-50 text-zinc-600 border border-zinc-200";
          feedbackBox.innerHTML = `<span>NIM format mandiri. Silakan pastikan nama lengkap sudah benar.</span>`;
          feedbackBox.classList.remove("hidden");
        } else {
          feedbackBox.classList.add("hidden");
        }
      }
    }

    function fillAuthNimEmailFormat() {
      const nim = document.getElementById("authInputNim")?.value.trim();
      const emailInput = document.getElementById("authInputEmail");
      if (!nim || !emailInput) return;
      emailInput.value = `${nim}@mhs.ulm.ac.id`;
      validateAuthEmailLive(emailInput.value);
    }

    function appendAuthDomain(domain) {
      const emailInput = document.getElementById("authInputEmail");
      if (!emailInput) return;
      let val = emailInput.value.trim();
      if (!val) {
        const nim = document.getElementById("authInputNim")?.value.trim();
        val = nim || "user";
      }
      if (val.includes("@")) {
        val = val.split("@")[0] + domain;
      } else {
        val = val + domain;
      }
      emailInput.value = val;
      validateAuthEmailLive(val);
    }

    function validateAuthEmailLive(emailVal) {
      const msgEl = document.getElementById("authEmailValidationMsg");
      const emailInput = document.getElementById("authInputEmail");
      const cleanEmail = (emailVal || "").trim().toLowerCase();
      const emailMode = appConfig["Mode_Pengumpulan_Email"] || "ULM_ONLY";
      const selRole = document.querySelector('input[name="authRole"]:checked')?.value || "Mahasiswa";

      if (!cleanEmail) {
        if (msgEl) msgEl.classList.add("hidden");
        if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-indigo-600 outline-none transition bg-white placeholder-zinc-400";
        return false;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        if (msgEl) {
          msgEl.textContent = "Format email belum lengkap";
          msgEl.className = "text-[11px] text-amber-600 font-medium";
          msgEl.classList.remove("hidden");
        }
        return false;
      }

      if (emailMode === 'ULM_ONLY' && selRole === 'Mahasiswa') {
        const allowedStr = appConfig["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id";
        const allowedDomains = allowedStr.split(",").map(d => d.trim().toLowerCase()).filter(Boolean);

        let isDomainMatch = false;
        for (let d of allowedDomains) {
          if (cleanEmail.endsWith("@" + d) || cleanEmail.endsWith("." + d)) {
            isDomainMatch = true;
            break;
          }
        }

        if (!isDomainMatch) {
          if (msgEl) {
            msgEl.textContent = "Mode ULM: Email mahasiswa harus domain (" + allowedStr + ").";
            msgEl.className = "text-[11px] text-rose-600 font-medium";
            msgEl.classList.remove("hidden");
          }
          if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-rose-400 text-xs sm:text-sm focus:border-rose-600 outline-none transition bg-white";
          return false;
        }
      }

      if (msgEl) msgEl.classList.add("hidden");
      if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 text-xs sm:text-sm focus:border-emerald-600 outline-none transition bg-white";
      return true;
    }

    function handleAuthLoginSubmit(e) {
      if (e) e.preventDefault();

      const selRole = document.querySelector('input[name="authRole"]:checked')?.value || "Mahasiswa";
      const nimVal = document.getElementById("authInputNim")?.value.trim() || "";
      const namaVal = document.getElementById("authInputNama")?.value.trim() || "";
      const emailVal = document.getElementById("authInputEmail")?.value.trim() || "";
      const remember = document.getElementById("authRememberMe")?.checked ?? true;

      if (!emailVal) {
        showToast("Alamat email wajib diisi untuk masuk!", "warning");
        return;
      }
      if (!namaVal) {
        showToast("Nama lengkap wajib diisi!", "warning");
        return;
      }
      if (selRole === 'Mahasiswa' && !nimVal) {
        showToast("Nomor Induk Mahasiswa (NIM) wajib diisi!", "warning");
        return;
      }

      if (!validateAuthEmailLive(emailVal)) {
        showToast("Format alamat email belum valid!", "warning");
        return;
      }

      const user = {
        email: emailVal,
        nama: namaVal,
        nim: nimVal,
        peran: selRole
      };

      setAuthSession(user, remember);

      showToast(`Selamat datang, ${namaVal}! Anda berhasil masuk.`, "success");

      checkAndApplyAuthGate();

      // Trigger draft restore for this user
      isDraftAlreadyRestored = false;
      restoreFormDraft();
    }

    function handleAuthQuickLogin(email, name, nim, role) {
      const user = {
        email: email,
        nama: name,
        nim: nim,
        peran: role || "Mahasiswa"
      };
      setAuthSession(user, true);
      showToast(`Berhasil masuk sebagai ${email}.`, "success");
      checkAndApplyAuthGate();
      isDraftAlreadyRestored = false;
      restoreFormDraft();
    }

    async function handleAuthLogout() {
      const ok = await showAppConfirm({
        title: "Keluar dari Akun?",
        message: "Apakah Anda yakin ingin keluar dari akun penilai ini? Draf isian Anda tetap tersimpan aman di akun ini.",
        confirmText: "Ya, Keluar Akun",
        cancelText: "Batal",
        type: "warning"
      });
      if (ok) {
        clearAuthSession();
        showToast("Anda telah keluar dari akun.", "info");
        checkAndApplyAuthGate();
      }
    }

    // =========================================================================
    // OFFICIAL GOOGLE OAUTH AUTHENTICATION VIA SUPABASE AUTH
    // =========================================================================
    async function handleGoogleSignIn() {
      try {
        const isFileProtocol = window.location.protocol === 'file:';
        const isInsideIframe = window.self !== window.top;

        // 1. FAST-PATH: Pengujian Berkas Lokal (file:///)
        // Karena browser & Google melarang OAuth redirect ke file:///, gunakan verifikasi simulasi instan
        if (isFileProtocol) {
          const mockGoogleUser = {
            email: "2310125210099@mhs.ulm.ac.id",
            nama: "Mahasiswa Terverifikasi ULM",
            nim: "2310125210099",
            peran: "Mahasiswa",
            avatarUrl: "",
            provider: "google"
          };
          setAuthSession(mockGoogleUser, true);
          checkAndApplyAuthGate();
          startAssessmentForm();
          showToast("Berhasil masuk akun Google resmi ULM (@mhs.ulm.ac.id)!", "success");
          return;
        }

        // 2. FAST-PATH: Simulator Pratinjau Admin (Iframe)
        // Iframe browser memblokir dialog Google OAuth karena header X-Frame-Options Google
        if (isInsideIframe) {
          const mockSimulatorUser = {
            email: "evaluator.simulasi@mhs.ulm.ac.id",
            nama: "Penilai Simulasi Pratinjau",
            nim: "2310125210099",
            peran: "Mahasiswa",
            avatarUrl: "",
            provider: "simulator"
          };
          setAuthSession(mockSimulatorUser, false);
          checkAndApplyAuthGate();
          startAssessmentForm();
          showToast("Mode Simulasi Pratinjau berhasil aktif!", "success");
          return;
        }

        // 3. LIVE WEB: Google Cloud OAuth Resmi via Supabase Auth
        const btn = document.getElementById("btnGoogleSignIn");
        if (btn) {
          btn.innerHTML = `
            <svg class="w-4 h-4 animate-spin text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-white font-bold">Membuka Google OAuth...</span>
          `;
        }

        const redirectUrl = window.location.origin + window.location.pathname + (activeFormId ? `?id=${activeFormId}` : '');
        const sb = getSupabaseClient() || (window.supabase && typeof window.supabase.createClient === "function" ? (supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)) : null);

        if (!sb || !sb.auth) {
          throw new Error("Supabase Auth Client belum siap. Silakan coba kembali dalam beberapa detik.");
        }

        const { data, error } = await sb.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });

        if (error) {
          showToast("Gagal Google Sign-In: " + error.message, "error");
          renderGoogleSignInButtonDefault();
        }
      } catch (err) {
        showToast("Google Auth Error: " + err.message, "error");
        renderGoogleSignInButtonDefault();
      }
    }

    function renderGoogleSignInButtonDefault() {
      const btn = document.getElementById("btnGoogleSignIn");
      if (btn) {
        btn.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
            <svg class="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <span class="group-hover:text-zinc-100 transition">Masuk dengan Akun Google (ULM / Gmail)</span>
        `;
      }
    }

    async function initSupabaseAuthListener() {
      const sb = getSupabaseClient() || (window.supabase && typeof window.supabase.createClient === "function" ? (supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)) : null);

      // 0. PKCE OAuth Flow Check (?code=...)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        if (authCode && sb && sb.auth && typeof sb.auth.exchangeCodeForSession === 'function') {
          const btn = document.getElementById("btnGoogleSignIn");
          if (btn) {
            btn.innerHTML = `
              <svg class="w-4 h-4 animate-spin text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-white font-bold">Menyelesaikan Otentikasi Google...</span>
            `;
          }
          const { data: codeData, error: codeErr } = await sb.auth.exchangeCodeForSession(authCode);
          if (codeErr) {
            console.error("Supabase exchangeCodeForSession error:", codeErr);
            showToast("Gagal memproses sesi login Google: " + (codeErr.message || codeErr), "error", 6000);
            renderGoogleSignInButtonDefault();
          } else if (codeData && codeData.session && codeData.session.user) {
            await applySupabaseGoogleUser(codeData.session.user);
            try {
              const cleanUrl = new URL(window.location.href);
              cleanUrl.searchParams.delete('code');
              history.replaceState(null, null, cleanUrl.toString());
            } catch (e) {}
            return;
          }
        }
      } catch (pkceErr) {
        console.warn("PKCE code exchange notice:", pkceErr);
      }

      // 1. Direct Instant Extraction from URL Hash Fragment (#access_token=...)
      try {
        const rawHash = window.location.hash || '';
        if (rawHash.includes('access_token=')) {
          const hashClean = rawHash.replace(/^#/, '');
          const hashParams = new URLSearchParams(hashClean);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            try {
              const base64Url = accessToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
              const payload = JSON.parse(jsonPayload);

              if (payload && (payload.email || payload.user_metadata?.email)) {
                const email = (payload.email || payload.user_metadata?.email).toLowerCase().trim();
                const userObj = {
                  email: email,
                  user_metadata: payload.user_metadata || {}
                };
                await applySupabaseGoogleUser(userObj);
              }
            } catch (jwtErr) {
              console.warn("Direct JWT token parse notice:", jwtErr);
            }

            if (sb && sb.auth && refreshToken) {
              try {
                await sb.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });
              } catch (setErr) {}
            }
          }
        }
      } catch (hashErr) {
        console.warn("OAuth Hash extraction notice:", hashErr);
      }

      if (!sb || !sb.auth) return;

      try {
        // 2. Check initial session from Supabase Client
        const { data: sessionData } = await sb.auth.getSession();
        if (sessionData && sessionData.session && sessionData.session.user) {
          await applySupabaseGoogleUser(sessionData.session.user);
        }

        // 3. Listen to auth state changes
        sb.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session && session.user) {
            await applySupabaseGoogleUser(session.user);
          }
        });
      } catch (e) {
        console.warn("Supabase auth listener init notice:", e);
      }
    }

    async function applySupabaseGoogleUser(user) {
      if (!user || !user.email) return;

      const email = user.email.toLowerCase().trim();

      // Ensure appConfig is populated from cache or Supabase if currently empty
      if (!appConfig || Object.keys(appConfig).length === 0) {
        const cachedConfig = localStorage.getItem("PGSD_CACHE_CONFIG_" + activeFormId);
        if (cachedConfig) {
          try { appConfig = JSON.parse(cachedConfig); } catch(e) {}
        }
      }
      if (!appConfig || Object.keys(appConfig).length === 0) {
        const sb = getSupabaseClient();
        if (sb) {
          try {
            const { data: configRow } = await sb.from('pgsd_form_configs').select('*').eq('form_id', activeFormId).single();
            if (configRow && configRow.config_data) {
              appConfig = configRow.config_data;
            }
          } catch(e) {}
        }
      }

      const emailMode = appConfig["Mode_Pengumpulan_Email"] || "ALL_EMAIL";

      // Domain enforcement only if explicitly ULM_ONLY
      if (emailMode === 'ULM_ONLY') {
        const allowedStr = appConfig["Domain_Email_Wajib"] || "mhs.ulm.ac.id, ulm.ac.id";
        const allowedDomains = allowedStr.split(",").map(d => d.trim().toLowerCase()).filter(Boolean);

        let isDomainMatch = false;
        for (let d of allowedDomains) {
          if (email.endsWith("@" + d) || email.endsWith("." + d)) {
            isDomainMatch = true;
            break;
          }
        }

        if (!isDomainMatch) {
          clearAuthSession();
          showToast(`Akun Google "${email}" bukan akun resmi kampus ULM (${allowedStr}). Silakan login menggunakan akun @mhs.ulm.ac.id atau @ulm.ac.id.`, "error", 8000);
          checkAndApplyAuthGate();
          return;
        }
      }

      const rawName = user.user_metadata?.full_name || user.user_metadata?.name || "";
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

      // Smart NIM extraction if email is NIM@mhs.ulm.ac.id
      let extractedNim = "";
      let matchedName = rawName;
      let detectedRole = "Mahasiswa";

      const emailMatch = email.match(/^([0-9]{8,15})@/);
      if (emailMatch) {
        extractedNim = emailMatch[1];
      }

      // Check against master student data
      if (allStudentsData && allStudentsData.length > 0) {
        let found = null;
        if (extractedNim) {
          found = allStudentsData.find(s => String(s.nim).trim() === extractedNim);
        }
        if (!found && rawName) {
          found = allStudentsData.find(s => (s.name || '').toLowerCase() === rawName.toLowerCase());
        }
        if (found) {
          extractedNim = found.nim;
          matchedName = found.name;
          detectedRole = "Mahasiswa";
        }
      }

      if (email.endsWith("@ulm.ac.id") && !email.includes("@mhs.")) {
        detectedRole = "Dosen";
      }

      const authUser = {
        email: email,
        nama: matchedName || email.split("@")[0],
        nim: extractedNim,
        peran: detectedRole,
        avatarUrl: avatarUrl,
        provider: "google"
      };

      setAuthSession(authUser, true);
      activeUserAccountAvatarUrl = avatarUrl;
      activeUserAccountEmail = email;
      activeUserAccountName = matchedName || email.split("@")[0];
      activeUserAccountNim = extractedNim;
      if (detectedRole) currentEvaluatorRole = detectedRole;

      // Populate Step 1 fields in DOM
      const inputEmail = document.getElementById("inputEmail");
      const inputNama = document.getElementById("inputNama");
      const inputNim = document.getElementById("inputNim");
      if (inputEmail) inputEmail.value = email;
      if (inputNama && matchedName) inputNama.value = matchedName;
      if (inputNim && extractedNim) {
        inputNim.value = extractedNim;
        validateNimLive(extractedNim);
      }
      if (detectedRole) onRoleChange(detectedRole);
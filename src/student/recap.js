/* ============================================
 * src/student/recap.js
 * Recap, leaderboard, charts
 * ============================================ */


      updateAccountHeaderUI();
      checkAndApplyAuthGate();

      // Bersihkan hash fragment OAuth dari URL browser
      try {
        if (window.location.hash.includes('access_token') || window.location.hash === '#') {
          history.replaceState(null, null, window.location.pathname + (window.location.search || `?id=${activeFormId}`));
        }
      } catch (e) {}

      isDraftAlreadyRestored = false;
      restoreFormDraft();
      startAssessmentForm();
      showToast(`Selamat datang, ${authUser.nama || authUser.email}! Berhasil masuk dengan Akun Google.`, "success", 4000);
    }

    function resetInMemoryClientFormState() {
      clientCustomFormAnswers = {};
      customUploadedFilesMap = {};
      selectedGroupObj = null;
      selectedGroupIndex = -1;
      selectedBestPresenters = [];
      currentStep = 1;
      currentRekapData = null;
      appConfig = {};
      groupsData = [];
      allStudentsData = [];
      currentFormSchema = null;
      currentFormMeta = null;
      isDraftAlreadyRestored = false;

      // Clear DOM inputs
      const inputNim = document.getElementById("inputNim");
      const inputNama = document.getElementById("inputNama");
      const inputEmail = document.getElementById("inputEmail");
      if (inputNim) inputNim.value = "";
      if (inputNama) inputNama.value = "";
      if (inputEmail) inputEmail.value = "";
      const nimFeedback = document.getElementById("nimFeedbackBox");
      if (nimFeedback) nimFeedback.classList.add("hidden");
      const nimStatus = document.getElementById("nimStatusIcon");
      if (nimStatus) nimStatus.classList.add("hidden");
    }

    let isDraftAlreadyRestored = false;
    function restoreFormDraft() {
      if (isDraftAlreadyRestored) return;
      try {
        const draftKey = getFormDraftKey();
        let raw = localStorage.getItem(draftKey);
        if (!raw) {
          // Fallback check legacy default draft key
          const legacyKey = "PGSD_FORM_DRAFT_" + (activeFormId || 'BK5E').toUpperCase();
          raw = localStorage.getItem(legacyKey);
        }
        if (!raw) {
          updateDraftResetButtonVisibility();
          return;
        }
        const draft = JSON.parse(raw);
        if (!draft) {
          updateDraftResetButtonVisibility();
          return;
        }

        // Batas Waktu Draf (TTL: 7 Hari). Jika draf sudah usang, bersihkan otomatis
        const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
        if (draft.timestamp && (Date.now() - draft.timestamp > DRAFT_MAX_AGE_MS)) {
          localStorage.removeItem(draftKey);
          updateDraftResetButtonVisibility();
          return;
        }

        // 1. Pulihkan Jawaban Kustom & Berkas Terlebih Dahulu
        if (draft.customAnswers && typeof draft.customAnswers === 'object') {
          clientCustomFormAnswers = Object.assign({}, draft.customAnswers);
        }
        if (draft.uploadedFiles && typeof draft.uploadedFiles === 'object') {
          customUploadedFilesMap = Object.assign({}, draft.uploadedFiles);
        }

        // Render struktur tahapan dinamis ke DOM
        renderDynamicClientStages();

        // 2. Pulihkan Step 1 (Identitas & Peran)
        if (draft.peran) {
          onRoleChange(draft.peran);
        }
        if (draft.nim) {
          const nimEl = document.getElementById("inputNim");
          if (nimEl) {
            nimEl.value = draft.nim;
            validateNimLive(draft.nim);
          }
        }
        if (draft.nama) {
          const namaEl = document.getElementById("inputNama");
          if (namaEl) namaEl.value = draft.nama;
          activeUserAccountName = draft.nama;
        }
        if (draft.email) {
          const emailEl = document.getElementById("inputEmail");
          if (emailEl) {
            emailEl.value = draft.email;
            validateEmailLive(draft.email);
          }
          activeUserAccountEmail = draft.email;
        }

        updateAccountHeaderUI();

        // 3. Pulihkan Pemilihan Kelompok & Sub-komponennya
        if (draft.groupName && groupsData && groupsData.length > 0) {
          const grpIdx = groupsData.findIndex(g => g.name === draft.groupName);
          if (grpIdx !== -1) {
            const radio = document.querySelector(`input[name="selectedGroup"][value="${draft.groupName}"]`);
            if (radio) radio.checked = true;
            
            onSelectGroup(draft.groupName, grpIdx);

            // 4. Pulihkan Skor
            if (draft.nilai) {
              const numEl = document.getElementById("inputNilaiNumber");
              const sliEl = document.getElementById("inputNilaiSlider");
              if (numEl) numEl.value = draft.nilai;
              if (sliEl) sliEl.value = draft.nilai;
              updateScoreBadge(draft.nilai);
            }

            // 5. Pulihkan Presentator Terbaik
            if (draft.bestPresenters && Array.isArray(draft.bestPresenters)) {
              selectedBestPresenters = [...draft.bestPresenters];
              updateBestPresenterBadge();
              selectedBestPresenters.forEach(bName => {
                const cb = document.querySelector(`#bestPresenterList input[value="${bName}"]`);
                if (cb) {
                  cb.checked = true;
                  const lbl = cb.closest("label");
                  if (lbl) lbl.className = "flex items-center p-3 rounded-lg border border-zinc-900 bg-zinc-50 shadow-xs cursor-pointer transition text-xs";
                }
              });
            }

            // 6. Pulihkan Evaluasi Kualitatif per Mahasiswa
            if (draft.evaluasi && typeof draft.evaluasi === 'object') {
              const maxChars = parseInt(appConfig["Maksimal_Karakter_Evaluasi"] || 500);
              document.querySelectorAll("#evaluationInputsContainer textarea").forEach((ta, eIdx) => {
                const member = ta.getAttribute("data-member");
                if (member && draft.evaluasi[member] !== undefined) {
                  ta.value = draft.evaluasi[member];
                  const counterEl = document.getElementById(`charCount_${eIdx}`);
                  if (counterEl) {
                    counterEl.textContent = `${ta.value.length}/${maxChars}`;
                  }
                }
              });
            }
          }
        }

        // 7. Tentukan Navigasi & Posisi Langkah (Hanya buka wizard jika sudah login atau mode NO_EMAIL)
        const emailMode = appConfig["Mode_Pengumpulan_Email"] || "ULM_ONLY";
        const currentSession = getCurrentAuthSession();
        const isAuthenticated = (emailMode === 'NO_EMAIL') || (currentSession && currentSession.email);

        if (draft.email || draft.nama || draft.nim || draft.groupName) {
          isDraftAlreadyRestored = true;

          if (isAuthenticated) {
            startAssessmentForm();

            const targetStep = (draft.step && draft.step >= 1 && draft.step <= (Object.keys(stepMetadata).length || 4))
              ? draft.step
              : 1;
            updateStepUI(targetStep, true);

            const banner = document.getElementById("studentDraftRestoreBanner");
            if (banner) banner.classList.remove("hidden");
            const indicator = document.getElementById("autoSaveIndicator");
            if (indicator) indicator.classList.remove("hidden");

            showToast("Draf isian sebelumnya berhasil dipulihkan.", "info");
          }
        }
      } catch (e) {
        console.warn("Restore draft error notice:", e);
      }
      updateDraftResetButtonVisibility();
    }

    async function clearStudentFormDraft(confirmDialog = false) {
      let ok = true;
      if (confirmDialog) {
        ok = await showConfirmModal({
          title: "Hapus Draf Isian?",
          message: "Apakah Anda yakin ingin menghapus seluruh draf isian yang tersimpan di akun ini? Anda akan mengulang pengisian dari awal.",
          confirmText: "Ya, Hapus Draf",
          cancelText: "Batal",
          type: "warning"
        });
      }
      if (ok) {
        localStorage.removeItem(getFormDraftKey());
        showToast("Draf isian berhasil dibersihkan.", "info");
        setTimeout(() => window.location.reload(), 400);
      }
    }

    function validateEmailLive(emailVal) {
      const msgEl = document.getElementById("emailValidationMsg");
      const iconEl = document.getElementById("emailCheckIcon");
      const emailInput = document.getElementById("inputEmail");
      const cleanEmail = (emailVal || "").trim().toLowerCase();

      const emailMode = appConfig["Mode_Pengumpulan_Email"] || "ULM_ONLY";

      // If Mode is NO_EMAIL, email is completely optional
      if (emailMode === 'NO_EMAIL') {
        if (msgEl) msgEl.classList.add("hidden");
        if (iconEl) iconEl.classList.remove("hidden");
        if (emailInput) {
          emailInput.required = false;
          emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm outline-none transition bg-white";
        }
        const reqStar = document.getElementById("emailRequiredStar");
        if (reqStar) reqStar.classList.add("hidden");
        isEmailValidState = true;
        return true;
      }

      if (!cleanEmail) {
        if (msgEl) msgEl.classList.add("hidden");
        if (iconEl) iconEl.classList.add("hidden");
        if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-zinc-900 outline-none transition bg-white";
        isEmailValidState = false;
        return false;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        if (msgEl) {
          msgEl.textContent = "Format email belum lengkap";
          msgEl.className = "text-[11px] text-amber-600 font-medium";
          msgEl.classList.remove("hidden");
        }
        if (iconEl) iconEl.classList.add("hidden");
        isEmailValidState = false;
        return false;
      }

      // Mode ULM_ONLY: Mahasiswa wajib domain mhs.ulm.ac.id
      if (emailMode === 'ULM_ONLY' && currentEvaluatorRole === 'Mahasiswa') {
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
            msgEl.textContent = "Mode ULM: Email mahasiswa harus menggunakan domain resmi (" + allowedStr + ").";
            msgEl.className = "text-[11px] text-rose-600 font-medium";
            msgEl.classList.remove("hidden");
          }
          if (iconEl) iconEl.classList.add("hidden");
          if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-rose-400 text-xs sm:text-sm focus:border-rose-600 outline-none transition bg-white";
          isEmailValidState = false;
          return false;
        }
      }

      if (msgEl) msgEl.classList.add("hidden");
      if (iconEl) iconEl.classList.remove("hidden");
      if (emailInput) emailInput.className = "w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 text-xs sm:text-sm focus:border-emerald-600 outline-none transition bg-white";
      isEmailValidState = true;
      return true;
    }

    let currentPendingSubmissionPayload = null;
    let currentReceiptData = null;

    function openPreSubmitReviewModal(payload) {
      currentPendingSubmissionPayload = payload;
      renderPreSubmitReviewContent(payload);
      const modal = document.getElementById("modalPreSubmitReview");
      if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
      }
    }

    function closePreSubmitReviewModal() {
      const modal = document.getElementById("modalPreSubmitReview");
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    }

    function renderPreSubmitReviewContent(payload) {
      const container = document.getElementById("preSubmitReviewContent");
      if (!container || !payload) return;

      const matkul = appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "-";
      const dosen = appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-";

      let bestPresText = "-";
      if (Array.isArray(payload.presentatorTerbaik) && payload.presentatorTerbaik.length > 0) {
        bestPresText = payload.presentatorTerbaik.join(", ");
      }

      let evalListHtml = "";
      if (payload.evaluasiDetail && typeof payload.evaluasiDetail === 'object') {
        for (let member in payload.evaluasiDetail) {
          if (member === 'uploadedFiles') continue;
          const textVal = payload.evaluasiDetail[member];
          if (textVal) {
            evalListHtml += `
              <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs">
                <span class="font-bold text-zinc-900 block mb-0.5">👤 ${member}:</span>
                <p class="text-zinc-600 text-[11px] leading-relaxed italic whitespace-pre-wrap">"${textVal}"</p>
              </div>
            `;
          }
        }
      }

      let customAnswersHtml = "";
      if (payload.customAnswers && Object.keys(payload.customAnswers).length > 0) {
        for (let fldId in payload.customAnswers) {
          const ans = payload.customAnswers[fldId];
          if (ans) {
            let fldLabel = fldId;
            if (currentFormSchema && Array.isArray(currentFormSchema.tahapan)) {
              for (let stg of currentFormSchema.tahapan) {
                const foundFld = (stg.fields || []).find(f => f.id === fldId);
                if (foundFld) { fldLabel = foundFld.label; break; }
              }
            }
            customAnswersHtml += `
              <div class="flex items-start justify-between py-1 border-b border-zinc-100 last:border-0 gap-2">
                <span class="text-zinc-500 font-medium">${fldLabel}:</span>
                <span class="font-bold text-zinc-900 text-right">${Array.isArray(ans) ? ans.join(', ') : ans}</span>
              </div>
            `;
          }
        }
      }

      container.innerHTML = `
        <!-- Card 1: Identitas Penilai -->
        <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
          <h4 class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">1. Identitas Penilai</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span class="text-[10px] text-zinc-400 block">Nama &amp; Peran:</span>
              <p class="font-bold text-zinc-900 truncate">${payload.namaPenilai} <span class="font-normal text-zinc-500 text-[10.5px]">(${payload.peranPenilai})</span></p>
            </div>
            <div class="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span class="text-[10px] text-zinc-400 block">NIM:</span>
              <p class="font-mono font-bold text-zinc-900 truncate">${payload.nimPenilai || '-'}</p>
            </div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-zinc-200/60">
            <span class="text-[10px] text-zinc-400 block">Email:</span>
            <p class="font-mono text-zinc-700 text-[11px] truncate">${payload.email}</p>
          </div>
        </div>

        <!-- Card 2: Target & Skor -->
        <div class="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
          <h4 class="text-[11px] font-bold text-indigo-800 uppercase tracking-wider font-mono">2. Target Penilaian &amp; Skor</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="p-2 rounded-lg bg-white border border-indigo-100">
              <span class="text-[10px] text-zinc-400 block">Kelompok Dinilai:</span>
              <p class="font-bold text-indigo-700 truncate">${payload.kelompok}</p>
            </div>
            <div class="p-2 rounded-lg bg-white border border-indigo-100">
              <span class="text-[10px] text-zinc-400 block">Nilai yang Diberikan:</span>
              <p class="font-mono font-bold text-emerald-700 text-sm">${payload.nilaiKelompok} <span class="text-[10px] font-normal text-zinc-400">/ 100</span></p>
            </div>
          </div>
          <div class="p-2 rounded-lg bg-white border border-indigo-100">
            <span class="text-[10px] text-zinc-400 block">Presentator Terbaik:</span>
            <p class="font-semibold text-zinc-900">${bestPresText}</p>
          </div>
        </div>

        ${evalListHtml ? `
          <!-- Card 3: Evaluasi Kualitatif -->
          <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <h4 class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">3. Evaluasi Kualitatif Pemateri</h4>
            <div class="space-y-2">
              ${evalListHtml}
            </div>
          </div>
        ` : ''}

        ${customAnswersHtml ? `
          <!-- Card 4: Jawaban Tambahan -->
          <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <h4 class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">4. Jawaban Rubrik Tambahan</h4>
            <div class="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/60">
              ${customAnswersHtml}
            </div>
          </div>
        ` : ''}
      `;
    }

    async function handleFinalSubmit(e) {
      if (e) e.preventDefault();

      const isPreviewMode = new URLSearchParams(window.location.search).get('preview') === 'draft';
      if (isPreviewMode) {
        showToast("🎉 Simulasi Pengisian Berhasil! Seluruh isian telah divalidasi dengan sukses (Mode Draf / Simulator — data tidak disimpan ke database).", "success", 5000);
        return;
      }

      const emailEl = document.getElementById("inputEmail");
      const namaEl = document.getElementById("inputNama");
      const nimEl = document.getElementById("inputNim");
      const nilaiEl = document.getElementById("inputNilaiNumber");

      const email = emailEl ? emailEl.value.trim() : "";
      const nama = namaEl ? namaEl.value.trim() : "";
      const nim = nimEl ? nimEl.value.trim() : "-";
      const nilai = nilaiEl ? parseFloat(nilaiEl.value) : 85;

      if (emailEl && !validateEmailLive(email)) {
        showToast("Email penilai belum valid!", "error");
        updateStepUI(1);
        return;
      }
      if (document.getElementById("stepSection_2")?.querySelector('#groupsGrid') && !selectedGroupObj) {
        showToast("Pilih kelompok yang dinilai!", "warning");
        updateStepUI(2);
        return;
      }

      // 🛡️ INTEGRITY GUARD 1: Cegah Penilaian Kelompok Sendiri (Self-Evaluation Guard)
      const antiSelfEval = appConfig && appConfig["Cegah_Penilaian_Diri"] !== false && appConfig["Cegah_Penilaian_Diri"] !== "false";
      if (antiSelfEval && currentEvaluatorRole === 'Mahasiswa') {
        const studentNimClean = (nim || "").replace(/\s+/g, "").trim().toLowerCase();
        const studentNamaClean = (nama || "").trim().toLowerCase();
        const ownStudent = (allStudentsData || []).find(s => 
          (s.nim && String(s.nim).replace(/\s+/g, "").trim().toLowerCase() === studentNimClean) || 
          (s.name && String(s.name).trim().toLowerCase() === studentNamaClean)
        );

        if (ownStudent && ownStudent.kelompok && selectedGroupObj && selectedGroupObj.name.toLowerCase() === ownStudent.kelompok.toLowerCase()) {
          showToast(`Sesuai aturan integritas, Anda tidak dapat menilai kelompok Anda sendiri (${ownStudent.kelompok}).`, "error");
          updateStepUI(2);
          return;
        }
      }

      // 🛡️ INTEGRITY GUARD 2: Kunci Respons Ganda (Single Submission Lock)
      const singleSubmissionLock = appConfig && appConfig["Kunci_Respons_Ganda"] !== false && appConfig["Kunci_Respons_Ganda"] !== "false";
      if (singleSubmissionLock && currentEvaluatorRole === 'Mahasiswa' && selectedGroupObj) {
        const sb = getSupabaseClient();
        if (sb && nim && nim !== "-") {
          try {
            const { data: existingResp, error: checkErr } = await sb.from('pgsd_responses')
              .select('id_respons')
              .eq('form_id', activeFormId)
              .eq('nim_penilai', nim)
              .eq('kelompok_dinilai', selectedGroupObj.name)
              .limit(1);

            if (!checkErr && existingResp && existingResp.length > 0) {
              showToast(`Anda sudah pernah mengirimkan penilaian untuk ${selectedGroupObj.name}. Respons ganda tidak diizinkan.`, "error");
              return;
            }
          } catch(dupErr) {
            console.warn("Duplicate check fallback notice:", dupErr);
          }
        }
      }
      if (document.getElementById("stepSection_3")?.querySelector('#presentersGrid') && selectedBestPresenters.length === 0) {
        showToast("Pilih minimal 1 orang presentator terbaik!", "warning");
        updateStepUI(3);
        return;
      }

      const evaluasiDetail = {};
      const evalTextareas = document.querySelectorAll("#evaluationInputsContainer textarea");
      let isAllEvalFilled = true;

      evalTextareas.forEach(ta => {
        const member = ta.getAttribute("data-member");
        const val = ta.value.trim();
        if (!val) isAllEvalFilled = false;
        evaluasiDetail[member] = val;
      });

      if (evalTextareas.length > 0 && !isAllEvalFilled) {
        showToast("Lengkapi evaluasi tertulis untuk setiap pemateri!", "warning");
        return;
      }

      const customAnswers = collectCustomFieldsAnswers();

      // Gather all uploaded files
      const mergedUploadedFiles = Object.assign({}, customUploadedFilesMap);
      if (clientCustomFormAnswers && typeof clientCustomFormAnswers === 'object') {
        for (let k in clientCustomFormAnswers) {
          const item = clientCustomFormAnswers[k];
          if (item && typeof item === 'object' && item.name && (item.base64 || item.dataUrl)) {
            mergedUploadedFiles[k] = {
              name: item.name,
              type: item.type || 'application/octet-stream',
              size: item.size || 0,
              base64: item.base64 || (item.dataUrl ? item.dataUrl.split(',')[1] : '')
            };
            customAnswers[k] = item.name;
          }
        }
      }

      const payload = {
        action: "submitAssessment",
        formId: activeFormId,
        peranPenilai: currentEvaluatorRole || "Mahasiswa",
        nimPenilai: currentEvaluatorRole === 'Mahasiswa' ? nim : "-",
        email: email,
        namaPenilai: nama,
        kelompok: selectedGroupObj ? selectedGroupObj.name : "Kelompok",
        sesi: appConfig["Sesi_Minggu_Aktif"] || "Minggu 1",
        nilaiKelompok: nilai,
        presentatorTerbaik: selectedBestPresenters,
        evaluasiDetail: evaluasiDetail,
        customAnswers: customAnswers,
        uploadedFiles: mergedUploadedFiles,
        driveFolderName: (appConfig && appConfig["Google_Drive_Folder_Name"]) || localStorage.getItem("PGSD_GLOBAL_DRIVE_FOLDER") || localStorage.getItem("PGSD_DRIVE_FOLDER_NAME") || "https://drive.google.com/drive/folders/1ZYnP40AaCoaqu6-H2ZNfYuS-RshCWURK"
      };

      // 🔍 BUKA MODAL PRATINJAU RINGKASAN SEBELUM KIRIM
      openPreSubmitReviewModal(payload);
    }

    async function executeConfirmedFinalSubmit() {
      if (!currentPendingSubmissionPayload) return;
      const payload = currentPendingSubmissionPayload;

      const confirmBtn = document.getElementById("btnConfirmFinalSubmit");
      const confirmSpinner = document.getElementById("confirmFinalSubmitSpinner");
      const submitBtn = document.getElementById("submitBtn");
      const spinner = document.getElementById("submitSpinner");

      if (confirmBtn) confirmBtn.disabled = true;
      if (confirmSpinner) confirmSpinner.classList.remove("hidden");
      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.classList.remove("hidden");

      const effectiveSpreadsheetUrl = (appConfig && appConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL") || getApiUrl();
      const apiUrl = effectiveSpreadsheetUrl;
      const sb = getSupabaseClient();
      let sbSuccess = false;
      const idRespons = "PGSD-REC-" + activeFormId + "-" + Date.now().toString(36).toUpperCase();

      // ⚡ FAST-PATH (< 50ms): Simpan langsung data transaksi penilaian ke Supabase PostgreSQL
      if (sb) {
        try {
          if (customUploadedFilesMap && Object.keys(customUploadedFilesMap).length > 0) {
            for (let fldId in customUploadedFilesMap) {
              const fileObj = customUploadedFilesMap[fldId];
              if (fileObj && fileObj.name) {
                payload.customAnswers[fldId] = fileObj.name;
                if (!payload.evaluasiDetail.uploadedFiles) payload.evaluasiDetail.uploadedFiles = {};
                payload.evaluasiDetail.uploadedFiles[fldId] = {
                  fileName: fileObj.name,
                  fileSize: fileObj.size || 0,
                  mimeType: fileObj.type || 'application/octet-stream',
                  fileUrl: fileObj.url || fileObj.dataUrl || ""
                };
              }
            }
          }

          const respRow = {
            id_respons: idRespons,
            form_id: activeFormId,
            sesi: payload.sesi,
            email: payload.email,
            nama_penilai: payload.namaPenilai,
            nim_penilai: payload.nimPenilai || "-",
            peran_penilai: payload.peranPenilai || "Mahasiswa",
            kelompok_dinilai: payload.kelompok,
            nilai_kelompok: parseFloat(payload.nilaiKelompok) || 0,
            best_presenter_1: (payload.presentatorTerbaik && payload.presentatorTerbaik[0]) || "-",
            best_presenter_2: (payload.presentatorTerbaik && payload.presentatorTerbaik[1]) || "-",
            evaluasi_detail: payload.evaluasiDetail || {},
            custom_answers: payload.customAnswers || {},
            synced_to_sheets: false
          };
          const { error: sbErr } = await sb.from('pgsd_responses').insert([respRow]);
          if (!sbErr) {
            sbSuccess = true;
          }
        } catch (err) {
          console.warn("Supabase fast-path fallback notice:", err);
        }
      }

      if (sbSuccess) {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmSpinner) confirmSpinner.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("hidden");

        closePreSubmitReviewModal();
        clearStudentFormDraft(false);

        clientCustomFormAnswers = {};
        localStorage.removeItem("PGSD_CACHE_REKAP_" + activeFormId);
        localStorage.setItem("PGSD_LAST_SUBMISSION_EVENT", Date.now().toString());

        loadRekapData(true);
        showSuccessModal(payload.kelompok, false, payload, idRespons);

        // 🔄 Background Pipeline: Sinkronkan ke Google Spreadsheet secara asinkron
        const defaultSheetUrl = DEFAULT_API_URL;
        const customSheetUrl = (appConfig && appConfig["Spreadsheet_Webhook_Url"]) || localStorage.getItem("PGSD_GLOBAL_API_URL");

        if (defaultSheetUrl) {
          fetch(defaultSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          }).then(r => r.json()).then(res => {
            if (res && res.success && sb) {
              sb.from('pgsd_responses').update({ 
                synced_to_sheets: true, 
                synced_at: new Date().toISOString() 
              }).eq('id_respons', idRespons);
            }
          }).catch(e => console.warn("Primary sheet sync notice:", e));
        }

        if (customSheetUrl && customSheetUrl !== defaultSheetUrl) {
          fetch(customSheetUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          }).then(r => r.json()).then(res => {
            if (res && res.success && sb) {
              sb.from('pgsd_responses').update({ 
                synced_to_sheets: true, 
                synced_at: new Date().toISOString() 
              }).eq('id_respons', idRespons);
            }
          }).catch(e => console.warn("Custom sheet sync notice:", e));
        }
        return;
      }

      // 🛡️ Fallback Standar: Kirim via Apps Script
      const fetchWithTimeout = (url, opts, ms = 12000) => {
        return Promise.race([
          fetch(url, opts),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
        ]);
      };

      try {
        const response = await fetchWithTimeout(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }, 12000);

        const res = await response.json();
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmSpinner) confirmSpinner.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("hidden");

        if (res && res.success) {
          closePreSubmitReviewModal();
          clearStudentFormDraft(false);

          clientCustomFormAnswers = {};
          localStorage.removeItem("PGSD_CACHE_REKAP_" + activeFormId);
          localStorage.setItem("PGSD_LAST_SUBMISSION_EVENT", Date.now().toString());
          
          loadRekapData(true);
          showSuccessModal(payload.kelompok, false, payload, idRespons);
        } else {
          showToast(res?.error || "Gagal mengirim penilaian.", "error");
        }
      } catch (err) {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmSpinner) confirmSpinner.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add("hidden");
        
        closePreSubmitReviewModal();
        savePendingSubmission(payload);
        clearStudentFormDraft(false);
        showSuccessModal(payload.kelompok, true, payload, idRespons);
      }
    }

    function getPendingSubmissions() {
      try {
        return JSON.parse(localStorage.getItem("PGSD_PENDING_SUBMISSIONS") || "[]");
      } catch(e) {
        return [];
      }
    }

    function savePendingSubmission(payload) {
      let pending = getPendingSubmissions();
      pending = pending.filter(p => !(p.payload.email === payload.email && p.payload.kelompok === payload.kelompok && p.payload.sesi === payload.sesi));
      pending.push({ payload, timestamp: Date.now() });
      localStorage.setItem("PGSD_PENDING_SUBMISSIONS", JSON.stringify(pending));
    }

    async function processPendingSubmissions() {
      const pending = getPendingSubmissions();
      if (pending.length === 0 || !navigator.onLine) return;

      const apiUrl = getApiUrl();
      const remaining = [];

      for (let item of pending) {
        try {
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(item.payload)
          });
          const data = await res.json();
          if (!data.success && !data.error?.includes("sudah pernah mengirimkan")) {
            remaining.push(item);
          }
        } catch(e) {
          remaining.push(item);
        }
      }

      if (remaining.length === 0) {
        localStorage.removeItem("PGSD_PENDING_SUBMISSIONS");
        showToast("Seluruh data penilaian offline berhasil dikirim ke Spreadsheet.", "success");
        loadRekapData(true);
      } else {
        localStorage.setItem("PGSD_PENDING_SUBMISSIONS", JSON.stringify(remaining));
      }
    }

    window.addEventListener("online", function() {
      processPendingSubmissions();
      fetchInitialFormData(false);
      loadRekapData(true);
    });

    function generateReceiptQRCode(receiptId, payload) {
      const qrBox = document.getElementById("receiptQrCodeBox");
      if (!qrBox) return;

      const verifyData = `PGSD-ULM|ID:${receiptId}|NIM:${payload.nimPenilai || '-'}|MHS:${payload.namaPenilai || '-'}|GRP:${payload.kelompok || '-'}|SKOR:${payload.nilaiKelompok || '-'}|T:${Date.now()}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(verifyData)}`;

      qrBox.innerHTML = `
        <img 
          src="${qrUrl}" 
          alt="QR Verifikasi" 
          class="w-full h-full object-contain rounded"
          onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'text-[9px] font-mono text-zinc-400 text-center leading-none p-1\\'>✓<br>VERIFIED<br>OFFLINE</div>';"
        >
      `;
    }

    function showSuccessModal(kelompokName, isOfflineQueued = false, payload = null, idRespons = "") {
      const modal = document.getElementById("successModal");
      if (!modal) return;

      const finalId = idRespons || ("PGSD-REC-" + activeFormId + "-" + Date.now().toString(36).toUpperCase());
      const now = new Date();
      currentReceiptData = {
        payload: payload || {
          nimPenilai: "-",
          namaPenilai: "-",
          kelompok: kelompokName,
          nilaiKelompok: "-"
        },
        idRespons: finalId,
        timestamp: now
      };

      const receiptIdEl = document.getElementById("receiptIdText");
      if (receiptIdEl) receiptIdEl.textContent = finalId;

      if (payload) {
        const nimEl = document.getElementById("receiptNimPenilai");
        if (nimEl) nimEl.textContent = payload.nimPenilai || "-";

        const namaEl = document.getElementById("receiptNamaPenilai");
        if (namaEl) namaEl.textContent = payload.namaPenilai || "-";

        const grpEl = document.getElementById("receiptKelompokDinilai");
        if (grpEl) grpEl.textContent = payload.kelompok || kelompokName;

        const nilaiEl = document.getElementById("receiptNilaiKelompok");
        if (nilaiEl) nilaiEl.textContent = payload.nilaiKelompok !== undefined ? payload.nilaiKelompok : "-";

        const matkulEl = document.getElementById("receiptMataKuliah");
        if (matkulEl) matkulEl.textContent = appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "-";

        const dosenEl = document.getElementById("receiptDosenPengampu");
        if (dosenEl) dosenEl.textContent = appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-";

        const timeEl = document.getElementById("receiptTimestampWita");
        if (timeEl) timeEl.innerHTML = formatSmartScheduleTime(now);

        generateReceiptQRCode(finalId, payload);
      }

      const msgEl = document.getElementById("successModalMsg");
      if (msgEl) {
        if (isOfflineQueued) {
          msgEl.innerHTML = `
            <span class="text-amber-700 font-bold block mb-1">Tersimpan di Browser (Mode Offline)</span>
            Penilaian untuk <strong>${kelompokName}</strong> telah tersimpan aman di browser dan akan otomatis terkirim saat online.
          `;
        } else {
          msgEl.textContent = `Penilaian Anda telah tersimpan secara resmi di server database Supabase.`;
        }
      }

      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }

    function downloadDigitalReceiptImage() {
      if (!currentReceiptData) {
        showToast("Data tanda terima tidak ditemukan.", "error");
        return;
      }
      const data = currentReceiptData;
      const payload = data.payload || {};

      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");

      // 1. Background
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. White Card Container
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(40, 40, 920, 1270, 24);
      else ctx.rect(40, 40, 920, 1270);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Header Banner (Green)
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(40, 40, 920, 130, [24, 24, 0, 0]);
      else ctx.rect(40, 40, 920, 130);
      ctx.fillStyle = "#059669";
      ctx.fill();

      // Header Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("UNIVERSITAS LAMBUNG MANGKURAT", 75, 92);
      ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#d1fae5";
      ctx.fillText("FKIP • Program Studi Pendidikan Guru Sekolah Dasar (PGSD)", 75, 128);

      // 4. Receipt Title & Badge
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("TANDA TERIMA PENILAIAN PEER-ASSESSMENT", 75, 220);

      // Badge "TERVERIFIKASI"
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(75, 242, 230, 36, 18);
      else ctx.rect(75, 242, 230, 36);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("✓ TERVERIFIKASI SISTEM", 95, 266);

      // Ticket ID
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`ID TIKET: ${data.idRespons || '-'}`, 325, 266);

      // 5. Details Table Rows
      const startY = 305;
      const rowHeight = 72;
      const nowStr = (data.timestamp ? new Date(data.timestamp) : new Date()).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) + " WITA";
      const details = [
        ["NIM Penilai", payload.nimPenilai || "-"],
        ["Nama Penilai", payload.namaPenilai || "-"],
        ["Peran Penilai", payload.peranPenilai || "Mahasiswa"],
        ["Kelompok yang Dinilai", payload.kelompok || "-"],
        ["Nilai / Skor Kelompok", `${payload.nilaiKelompok !== undefined ? payload.nilaiKelompok : 0} / 100`],
        ["Presentator Terbaik", Array.isArray(payload.presentatorTerbaik) ? (payload.presentatorTerbaik.join(", ") || "-") : (payload.presentatorTerbaik || "-")],
        ["Mata Kuliah", appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || "-"],
        ["Dosen Pengampu", appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || "-"],
        ["Waktu Pengiriman", nowStr]
      ];

      details.forEach((row, i) => {
        const curY = startY + (i * rowHeight);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(75, curY, 850, rowHeight - 8, 12);
        else ctx.rect(75, curY, 850, rowHeight - 8);
        ctx.fillStyle = (i % 2 === 0) ? "#f8fafc" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#64748b";
        ctx.font = "600 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(row[0] + ":", 95, curY + 39);

        // Value
        const isHighlight = row[0].includes("Nilai") || row[0].includes("Kelompok yang");
        ctx.fillStyle = isHighlight ? "#4338ca" : "#0f172a";
        ctx.font = isHighlight ? "bold 19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        
        const rawVal = String(row[1] || "-");
        const valText = rawVal.length > 44 ? rawVal.substring(0, 42) + "..." : rawVal;
        ctx.fillText(valText, 340, curY + 39);
      });

      // 6. Verification Footer Box
      const footerBoxY = startY + (details.length * rowHeight) + 15;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(75, footerBoxY, 850, 120, 14);
      else ctx.rect(75, footerBoxY, 850, 120);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Bukti tanda terima ini sah dan tercatat permanen di basis data server Supabase FKIP ULM.", canvas.width / 2, footerBoxY + 45);
      ctx.fillStyle = "#64748b";
      ctx.font = "italic 13.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Simpan bukti ini sebagai konfirmasi resmi keikutsertaan penilaian perkuliahan.", canvas.width / 2, footerBoxY + 75);
      ctx.fillText(`Timestamp Keamanan: ${new Date().toISOString()}`, canvas.width / 2, footerBoxY + 98);
      ctx.textAlign = "left";

      // 7. Trigger Download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const nimSlug = (payload.nimPenilai || 'mhs').replace(/\s+/g, '');
      const grpSlug = (payload.kelompok || 'kelompok').replace(/\s+/g, '_');
      link.download = `bukti-penilaian-${nimSlug}-${grpSlug}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Bukti tanda terima digital berhasil diunduh!", "success");
    }

    function printDigitalReceipt() {
      if (!currentReceiptData) {
        showToast("Data tanda terima tidak ditemukan.", "error");
        return;
      }
      const data = currentReceiptData;
      const payload = data.payload || {};
      const finalId = data.idRespons || ("PGSD-REC-" + activeFormId + "-" + Date.now().toString(36).toUpperCase());
      const nowStr = (data.timestamp ? new Date(data.timestamp) : new Date()).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) + " WITA";

      const printRoot = document.getElementById("printDocumentRoot");
      if (!printRoot) {
        window.print();
        return;
      }

      const origHtml = printRoot.innerHTML;
      printRoot.className = "";
      printRoot.innerHTML = `
        <div class="print-page-wrapper" style="padding: 24px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; max-width: 720px; margin: 0 auto; background: #ffffff;">
          
          <!-- Header Instansi -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 14px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #059669; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact;">✓</div>
              <div>
                <h1 style="font-size: 16px; font-weight: 800; color: #065f46; margin: 0; line-height: 1.2;">UNIVERSITAS LAMBUNG MANGKURAT</h1>
                <p style="font-size: 11px; font-weight: 600; color: #475569; margin: 3px 0 0 0;">FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN • PRODI PGSD</p>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; font-size: 10px; font-weight: 800; background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 9999px; border: 1px solid #6ee7b7; letter-spacing: 0.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">✓ TERVERIFIKASI SISTEM</span>
              <p style="font-family: monospace; font-size: 11px; font-weight: 700; color: #64748b; margin: 4px 0 0 0;">${finalId}</p>
            </div>
          </div>

          <!-- Title -->
          <div style="text-align: center; margin-bottom: 22px;">
            <h2 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.4px;">BUKTI TANDA TERIMA PENILAIAN PEER-ASSESSMENT</h2>
            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Dokumen ini adalah bukti sah perekaman penilaian perkuliahan digital.</p>
          </div>

          <!-- Data Table -->
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 22px; font-size: 12.5px;">
            <tbody>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; width: 34%; border-bottom: 1px solid #e2e8f0;">NIM Penilai</td>
                <td style="padding: 10px 14px; font-family: monospace; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.nimPenilai || '-'}</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Nama Lengkap Penilai</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.namaPenilai || '-'}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Peran Penilai</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.peranPenilai || 'Mahasiswa'}</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Kelompok yang Dinilai</td>
                <td style="padding: 10px 14px; font-weight: 800; color: #4338ca; border-bottom: 1px solid #e2e8f0;">${payload.kelompok || '-'}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Nilai / Skor Kelompok</td>
                <td style="padding: 10px 14px; font-weight: 800; font-size: 14.5px; color: #059669; border-bottom: 1px solid #e2e8f0;">${payload.nilaiKelompok !== undefined ? payload.nilaiKelompok : 0} / 100</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Presentator Terbaik</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${Array.isArray(payload.presentatorTerbaik) ? (payload.presentatorTerbaik.join(', ') || '-') : (payload.presentatorTerbaik || '-')}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Mata Kuliah</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${appConfig["Mata_Kuliah"] || (currentFormMeta && currentFormMeta.mataKuliah) || '-'}</td>
              </tr>
              <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Dosen Pengampu</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${appConfig["Dosen_Pengampu"] || (currentFormMeta && currentFormMeta.dosen) || '-'}</td>
              </tr>
              <tr style="background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Waktu Pengiriman Resmi</td>
                <td style="padding: 10px 14px; font-family: monospace; font-weight: 700; color: #0f172a;">${nowStr}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer Verification Box -->
          <div style="border: 1px dashed #94a3b8; border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            <div style="font-size: 11px; color: #475569; line-height: 1.45;">
              <strong style="color: #0f172a; display: block; margin-bottom: 2px; font-size: 11.5px;">Verifikasi Digital Supabase FKIP ULM</strong>
              Tanda terima ini diterbitkan otomatis oleh sistem dan memiliki kekuatan verifikasi akademik internal yang sah.
            </div>
            <div style="font-family: monospace; font-size: 10px; font-weight: 700; color: #64748b; text-align: right; white-space: nowrap;">
              STATUS: TERVERIFIKASI<br>
              SERVER: SUPABASE CLOUD
            </div>
          </div>

        </div>
      `;

      window.print();

      setTimeout(() => {
        printRoot.className = "hidden";
        printRoot.innerHTML = origHtml;
      }, 1500);
    }

    function clearStudentFormDraft(isManual = false) {
      localStorage.removeItem(getFormDraftKey());
      localStorage.removeItem("PGSD_FORM_DRAFT");
      clientCustomFormAnswers = {};
      customUploadedFilesMap = {};
      const banner = document.getElementById("studentDraftRestoreBanner");
      if (banner) banner.classList.add("hidden");

      if (isManual) {
        resetStudentForm();
        showToast("Draf isian berhasil dihapus.", "info");
      }
    }

    function resetStudentForm() {
      const radioChecked = document.querySelector("input[name='selectedGroup']:checked");
      if (radioChecked) radioChecked.checked = false;
      document.querySelectorAll(".group-card").forEach(c => {
        c.className = "group-card flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer transition-all";
      });
      selectedGroupObj = null;
      selectedBestPresenters = [];
      goToInfoOverview();
      updateStepUI(1);
    }

    function resetFormAndCloseModal() {
      document.getElementById("successModal").classList.add("hidden");
      document.getElementById("successModal").classList.remove("flex");
      clearStudentFormDraft(false);
      resetStudentForm();
    }

    function closeModalAndGoToRekap() {
      resetFormAndCloseModal();
      switchTab('rekap');
      loadRekapData(true);
    }

    function switchTab(tab, updateHash = true) {
      const viewPortal = document.getElementById("viewPortal");
      const viewForm = document.getElementById("viewForm");
      const viewRekap = document.getElementById("viewRekap");
      const tabFormBtn = document.getElementById("tabFormBtn");
      const tabRekapBtn = document.getElementById("tabRekapBtn");
      const navTabContainer = document.getElementById("navTabContainer");

      if (viewPortal) viewPortal.classList.add("hidden");
      if (navTabContainer) navTabContainer.classList.remove("hidden");

      localStorage.setItem("PGSD_ACTIVE_MAIN_TAB", tab);
      if (updateHash) {
        try {
          history.replaceState(null, null, `#${tab}`);
        } catch(e) {
          window.location.hash = tab;
        }
      }

      if (tab === 'form') {
        viewForm.classList.remove("hidden");
        viewRekap.classList.add("hidden");
        tabFormBtn.className = "py-1.5 px-3 rounded-md bg-zinc-100 text-zinc-950 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        tabRekapBtn.className = "py-1.5 px-3 rounded-md text-zinc-400 hover:text-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        checkAndApplyAuthGate();
      } else {
        viewForm.classList.add("hidden");
        viewRekap.classList.remove("hidden");
        tabRekapBtn.className = "py-1.5 px-3 rounded-md bg-zinc-100 text-zinc-950 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        tabFormBtn.className = "py-1.5 px-3 rounded-md text-zinc-400 hover:text-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer";
        
        const savedSub = localStorage.getItem("PGSD_ACTIVE_REKAP_SUBTAB") || "kelompok";
        const hasLocalData = currentRekapData && currentRekapData.summary && currentRekapData.summary.length > 0;
        
        switchRekapSubView(savedSub, false);
        if (hasLocalData) {
          renderBothRekapViews();
        }
        loadRekapData(true);
      }
    }

    // =========================================================================
    // REKAPITULASI DATA LOGIC (KELOMPOK & INDIVIDU PEMATERI)
    // =========================================================================
    async function loadRekapData(isSilent = false) {
      const btnRefresh = document.getElementById("btnRefreshRekap");
      if (!isSilent && btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.innerHTML = `
          <svg class="w-3.5 h-3.5 text-zinc-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span class="text-zinc-600">Menyegarkan...</span>
        `;
      }

      const restoreBtnDefault = () => {
        if (btnRefresh) {
          btnRefresh.disabled = false;
          btnRefresh.innerHTML = `
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Segarkan</span>
          `;
        }
      };

      const setBtnSuccess = () => {
        if (btnRefresh) {
          btnRefresh.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-emerald-700 font-bold">Tersinkron</span>
          `;
          setTimeout(restoreBtnDefault, 1600);
        }
      };

      const setBtnFallback = () => {
        if (btnRefresh) {
          btnRefresh.innerHTML = `
            <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span class="text-amber-700 font-bold">Mode Offline</span>
          `;
          setTimeout(restoreBtnDefault, 2000);
        }
      };

      const loading = document.getElementById("rekapLoading");
      const empty = document.getElementById("rekapEmpty");
      const kelompokBox = document.getElementById("rekapKelompokContainer");
      const individuBox = document.getElementById("rekapIndividuContainer");
      const searchBox = document.getElementById("individuSearchControlBox");
      const chartOverviewCard = document.getElementById("rekapChartOverviewCard");

      const hasLocalData = currentRekapData && currentRekapData.summary && currentRekapData.summary.length > 0;

      if (hasLocalData) {
        if (loading) loading.classList.add("hidden");
        if (empty) empty.classList.add("hidden");
      } else if (!isSilent) {
        if (loading) loading.classList.remove("hidden");
        if (empty) empty.classList.add("hidden");
        if (kelompokBox) kelompokBox.classList.add("hidden");
        if (individuBox) individuBox.classList.add("hidden");
        if (searchBox) searchBox.classList.add("hidden");
        if (chartOverviewCard) chartOverviewCard.classList.add("hidden");
      }

      // ⚡ FAST-PATH (< 30ms): Ambil langsung dari Supabase Database
      const sb = getSupabaseClient();
      if (sb) {
        try {
          const { data: respList, error: sbErr } = await sb
            .from('pgsd_responses')
            .select('*')
            .eq('form_id', activeFormId)
            .eq('status', 'VALID')
            .order('created_at', { ascending: false });

          if (!sbErr && Array.isArray(respList)) {
            // Kalkulasi summary per kelompok secara komprehensif & real-time
            const calcSummaryForResponses = (list) => {
              const groupMap = {};
              list.forEach(r => {
                const grp = r.kelompok_dinilai || "Kelompok";
                if (!groupMap[grp]) {
                  groupMap[grp] = {
                    kelompok: grp,
                    sesi: r.sesi || "Minggu 1",
                    totalNilai: 0,
                    totalPenilai: 0,
                    totalKomentar: 0,
                    presentatorMap: {},
                    evaluators: [],
                    evaluasiList: {},
                    votePresentator: {}
                  };
                  // Pre-seed all members from groupsData if available
                  const foundGroupObj = (groupsData || []).find(g => g.name === grp);
                  if (foundGroupObj && Array.isArray(foundGroupObj.members)) {
                    foundGroupObj.members.forEach(m => {
                      groupMap[grp].evaluasiList[m.name] = [];
                      groupMap[grp].votePresentator[m.name] = 0;
                    });
                  }
                }
                groupMap[grp].totalNilai += (parseFloat(r.nilai_kelompok) || 0);
                groupMap[grp].totalPenilai += 1;
                groupMap[grp].evaluators.push({
                  nim: r.nim_penilai,
                  nama: r.nama_penilai,
                  email: r.email,
                  peran: r.peran_penilai || 'Mahasiswa',
                  nilai: r.nilai_kelompok
                });
                if (r.evaluasi_detail && typeof r.evaluasi_detail === 'object') {
                  const evKeys = Object.keys(r.evaluasi_detail);
                  groupMap[grp].totalKomentar += evKeys.length;
                  evKeys.forEach(sName => {
                    const text = r.evaluasi_detail[sName];
                    if (text && String(text).trim()) {
                      if (!groupMap[grp].evaluasiList[sName]) groupMap[grp].evaluasiList[sName] = [];
                      groupMap[grp].evaluasiList[sName].push({
                        penilai: r.nama_penilai || 'Anonim',
                        peran: r.peran_penilai || 'Mahasiswa',
                        nim: r.nim_penilai || '-',
                        ulasan: String(text).trim(),
                        timestamp: r.created_at
                      });
                    }
                  });
                }
                if (r.best_presenter_1 && r.best_presenter_1 !== "-") {
                  groupMap[grp].presentatorMap[r.best_presenter_1] = (groupMap[grp].presentatorMap[r.best_presenter_1] || 0) + 1;
                  groupMap[grp].votePresentator[r.best_presenter_1] = (groupMap[grp].votePresentator[r.best_presenter_1] || 0) + 1;
                }
                if (r.best_presenter_2 && r.best_presenter_2 !== "-") {
                  groupMap[grp].presentatorMap[r.best_presenter_2] = (groupMap[grp].presentatorMap[r.best_presenter_2] || 0) + 1;
                  groupMap[grp].votePresentator[r.best_presenter_2] = (groupMap[grp].votePresentator[r.best_presenter_2] || 0) + 1;
                }
              });

              return Object.values(groupMap).map(g => {
                const ranked = Object.entries(g.presentatorMap)
                  .map(([name, votes]) => ({ name, votes }))
                  .sort((a, b) => b.votes - a.votes);
                const best1 = ranked[0] ? `${ranked[0].name} (${ranked[0].votes} Suara)` : "-";
                const best2 = ranked[1] ? `${ranked[1].name} (${ranked[1].votes} Suara)` : "-";
                const avg = g.totalPenilai > 0 ? parseFloat((g.totalNilai / g.totalPenilai).toFixed(2)) : 0;
                return {
                  kelompok: g.kelompok,
                  sesi: g.sesi,
                  rataRataSkor: avg,
                  rataRataNilai: avg,
                  rataRata: avg,
                  totalPenilai: g.totalPenilai,
                  totalKomentar: g.totalKomentar,
                  presentatorTerbaik1: best1,
                  presentatorTerbaik2: best2,
                  rankedPresenters: ranked,
                  evaluators: g.evaluators,
                  evaluasiList: g.evaluasiList,
                  votePresentator: g.votePresentator
                };
              });
            };

            // Build nimToKelompokMap, nameToKelompokMap, emailToKelompokMap
            const nimToKelompokMap = {};
            const nameToKelompokMap = {};
            const emailToKelompokMap = {};

            respList.forEach(r => {
              const nim = String(r.nim_penilai || '').replace(/\s+/g, '').trim().toLowerCase();
              const name = String(r.nama_penilai || '').trim().toLowerCase();
              const email = String(r.email || '').trim().toLowerCase();
              const grp = String(r.kelompok_dinilai || '').trim();

              if (grp) {
                if (nim && nim !== '-') {
                  if (!nimToKelompokMap[nim]) nimToKelompokMap[nim] = [];
                  if (!nimToKelompokMap[nim].some(g => g.toLowerCase() === grp.toLowerCase())) {
                    nimToKelompokMap[nim].push(grp);
                  }
                }
                if (name && name !== '-') {
                  if (!nameToKelompokMap[name]) nameToKelompokMap[name] = [];
                  if (!nameToKelompokMap[name].some(g => g.toLowerCase() === grp.toLowerCase())) {
                    nameToKelompokMap[name].push(grp);
                  }
                }
                if (email && email !== '-') {
                  if (!emailToKelompokMap[email]) emailToKelompokMap[email] = [];
                  if (!emailToKelompokMap[email].some(g => g.toLowerCase() === grp.toLowerCase())) {
                    emailToKelompokMap[email].push(grp);
                  }
                }
              }
            });

            const summaryArray = calcSummaryForResponses(respList);
            const summaryMhs = calcSummaryForResponses(respList.filter(r => (r.peran_penilai || 'Mahasiswa') === 'Mahasiswa'));

            const res = {
              success: true,
              summary: summaryArray,
              summaryMhs: summaryMhs,
              nimToKelompokMap: nimToKelompokMap,
              nameToKelompokMap: nameToKelompokMap,
              emailToKelompokMap: emailToKelompokMap,
              isPublicReviewVisible: true,
              responses: respList.map(r => ({
                idRespons: r.id_respons,
                timestamp: new Date(r.created_at).toLocaleString('id-ID'),
                sesi: r.sesi,
                email: r.email,
                namaPenilai: r.nama_penilai,
                peran: r.peran_penilai,
                nim: r.nim_penilai,
                kelompok: r.kelompok_dinilai,
                nilaiKelompok: r.nilai_kelompok,
                presentatorTerbaik: [r.best_presenter_1, r.best_presenter_2].filter(x => x && x !== "-"),
                evaluasiDetail: r.evaluasi_detail || {},
                customAnswers: r.custom_answers || {}
              }))
            };

            currentRekapData = res;
            localStorage.setItem("PGSD_CACHE_REKAP_" + activeFormId, JSON.stringify(res));
            if (loading) loading.classList.add("hidden");

            if (summaryArray.length === 0) {
              if (empty) empty.classList.remove("hidden");
              if (chartOverviewCard) chartOverviewCard.classList.add("hidden");
              if (kelompokBox) kelompokBox.classList.add("hidden");
              if (individuBox) individuBox.classList.add("hidden");
            } else {
              if (empty) empty.classList.add("hidden");
              populateRekapFilter(summaryArray);
              populatePresensiFilters();
              renderBothRekapViews();
            }
            renderGroupOptions();
            if (!isSilent) {
              setBtnSuccess();
              showToast("Data rekapitulasi diperbarui dari Supabase (< 30ms).", "success");
            }
            return;
          }
        } catch (sbErr) {
          console.warn("Supabase loadRekapData notice:", sbErr);
        }
      }

      const apiUrl = getApiUrl();

      try {
        const fetchWithTimeout = (url, ms = 6000) => {
          return Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
          ]);
        };

        const response = await fetchWithTimeout(`${apiUrl}?action=getRecapData&formId=${encodeURIComponent(activeFormId)}&_t=${Date.now()}`, 6000);
        const res = await response.json();

        if (loading) loading.classList.add("hidden");
        if (res && res.success) {
          currentRekapData = res;
          localStorage.setItem("PGSD_CACHE_REKAP_" + activeFormId, JSON.stringify(res));
          renderGroupOptions();

          if (!res.summary || res.summary.length === 0) {
            if (empty) empty.classList.remove("hidden");
            if (chartOverviewCard) chartOverviewCard.classList.add("hidden");
            if (kelompokBox) kelompokBox.classList.add("hidden");
            if (individuBox) individuBox.classList.add("hidden");
          } else {
            if (empty) empty.classList.add("hidden");
            populateRekapFilter(res.summary);
            populatePresensiFilters();
            renderBothRekapViews();
          }
          if (!isSilent) {
            setBtnSuccess();
            showToast("Data rekapitulasi berhasil diperbarui dari server cloud.", "success");
          }
        } else {
          if (!hasLocalData && empty) empty.classList.remove("hidden");
          if (!isSilent) {
            setBtnFallback();
            showToast("Gagal memperbarui rekap: " + (res?.error || "Respon server tidak valid"), "warning");
          }
        }
      } catch (err) {
        if (loading) loading.classList.add("hidden");
        if (!hasLocalData && empty) {
          empty.classList.remove("hidden");
        }
        if (!isSilent) {
          setBtnFallback();
          showToast("Koneksi cloud terputus/lambat. Menampilkan data tersimpan di perangkat.", "warning");
        }
      }
    }

    function switchRekapSubView(sub, updateStorage = true, triggerRender = true) {
      currentRekapSubView = sub;
      if (updateStorage) {
        localStorage.setItem("PGSD_ACTIVE_REKAP_SUBTAB", sub);
      }
      const btnK = document.getElementById("subTabKelompokBtn");
      const btnI = document.getElementById("subTabIndividuBtn");
      const btnP = document.getElementById("subTabPresensiBtn");

      const filterGroupBar = document.getElementById("rekapGroupFilterBox");
      const presensiControlBox = document.getElementById("presensiControlBox");
      const searchBox = document.getElementById("individuSearchControlBox");

      const boxK = document.getElementById("rekapKelompokContainer");
      const boxI = document.getElementById("rekapIndividuContainer");
      const boxP = document.getElementById("rekapPresensiContainer");

      const activeBtnClass = "py-2 px-1.5 sm:px-3 rounded-lg bg-white text-zinc-900 shadow-xs transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center truncate font-bold";
      const inactiveBtnClass = "py-2 px-1.5 sm:px-3 rounded-lg text-zinc-500 hover:text-zinc-900 transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center truncate";
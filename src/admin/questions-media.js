/* src/admin/questions-media.js */
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
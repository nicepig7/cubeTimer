/**
 * QQTimer - Modern Application & UI Orchestrator
 * Coordinates Timer Engine, Statistics, Audio, Storage, and UI Views.
 */

(function (window) {
  'use strict';

  window.QQTimer = window.QQTimer || {};

  // Application Configuration & Settings
  const config = {
    holdThreshold: 300,      // ms required to hold spacebar before ready
    useInspection: false,    // WCA 15-second inspection
    precision: 2,           // 2 = 1/100s, 3 = 1/1000s
    soundEnabled: true,     // Web Audio sound FX
    bldMode: false          // BLD memorization mode
  };
  window.QQTimer.Config = config;

  // Aliases for submodules
  const Audio = window.QQTimer.Audio;
  const Storage = window.QQTimer.Storage;
  const Stats = window.QQTimer.Stats;
  const TimerEngine = window.QQTimer.TimerEngine;
  const TimerState = window.QQTimer.TimerState;
  const CheatSheet = window.QQTimer.CheatSheet;
  const ImportExport = window.QQTimer.ImportExport;

  // Session & Solves State
  let sessionID = 0;
  let solves = [];          // Array of { time, penalty, comment, scramble, date }
  let currentScramble = "";
  let lastScramble = "";
  let currentStats = null;

  // DOM Elements Map
  const el = {};

  // Keyboard Hold State
  let isSpaceDown = false;
  let holdTimer = null;

  // ============================================================
  // Toast Notification
  // ============================================================
  function showToast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(el.toastTimeout);
    el.toastTimeout = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2200);
  }

  // ============================================================
  // Solves & Statistics View Controllers
  // ============================================================
  function updateAndRenderStats() {
    currentStats = Stats.calculateAllStats(solves);
    renderSolvesList();
    renderStats();
  }

  function renderSolvesList() {
    if (!el.solvesList) return;
    el.solvesList.innerHTML = '';
    el.solvesCount.textContent = `${currentStats.validCount}/${currentStats.totalCount}`;

    if (solves.length === 0) {
      el.solvesList.innerHTML = `
        <div style="text-align: center; color: var(--text-sub); padding: 2rem 0; font-size: 0.85rem;">
          No solves yet in this session.<br>Hold Space to start timer!
        </div>`;
      return;
    }

    // Render in reverse chronological order (newest first)
    for (let i = solves.length - 1; i >= 0; i--) {
      const item = solves[i];
      const div = document.createElement('div');
      div.className = 'solve-item';
      div.dataset.index = i;

      const isBest = currentStats.bestSingle && currentStats.bestSingle.index === i;
      const isWorst = currentStats.worstSingle && currentStats.worstSingle.index === i;
      if (isBest) div.classList.add('is-best');
      if (isWorst) div.classList.add('is-worst');

      const timeFormatted = Stats.formatTime(item.time, config.precision, item.penalty);

      div.innerHTML = `
        <div class="solve-left">
          <span class="solve-index">#${i + 1}</span>
          <span class="solve-time" title="Click to view details">${timeFormatted}</span>
          ${item.comment ? `<span class="solve-comment" title="${item.comment}">[${item.comment}]</span>` : ''}
          ${isBest ? `<span style="font-size: 0.65rem; color: var(--accent-emerald); font-weight: 700; background: rgba(16, 185, 129, 0.15); padding: 1px 5px; border-radius: 4px;">PB</span>` : ''}
        </div>
        <div class="solve-actions">
          <button class="solve-action-btn solve-btn-penalty" data-penalty="2" title="Toggle +2">+2</button>
          <button class="solve-action-btn solve-btn-penalty" data-penalty="1" title="Toggle DNF">DNF</button>
          <button class="solve-action-btn solve-action-del" title="Delete solve">✕</button>
        </div>
      `;

      // Event Listeners
      div.querySelector('.solve-time').addEventListener('click', () => showSolveDetails(i));
      div.querySelector('.solve-action-del').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSolve(i);
      });

      const penaltyBtns = div.querySelectorAll('.solve-btn-penalty');
      penaltyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const p = parseInt(btn.dataset.penalty, 10);
          togglePenalty(i, p);
        });
      });

      el.solvesList.appendChild(div);
    }
  }

  function renderStats() {
    if (!el.statBestSingle) return;

    el.statBestSingle.textContent = currentStats.bestSingle ? Stats.formatTime(currentStats.bestSingle.time) : '--';
    el.statWorstSingle.textContent = currentStats.worstSingle ? Stats.formatTime(currentStats.worstSingle.time) : '--';

    el.statAo5Cur.textContent = currentStats.currentAo5 ? (currentStats.currentAo5.avg === -1 ? 'DNF' : Stats.formatTime(currentStats.currentAo5.avg)) : '--';
    el.statAo5Best.textContent = currentStats.bestAo5 ? Stats.formatTime(currentStats.bestAo5.avg) : '--';

    el.statAo12Cur.textContent = currentStats.currentAo12 ? (currentStats.currentAo12.avg === -1 ? 'DNF' : Stats.formatTime(currentStats.currentAo12.avg)) : '--';
    el.statAo12Best.textContent = currentStats.bestAo12 ? Stats.formatTime(currentStats.bestAo12.avg) : '--';

    el.statMo3Cur.textContent = currentStats.currentMo3 ? (currentStats.currentMo3.avg === -1 ? 'DNF' : Stats.formatTime(currentStats.currentMo3.avg)) : '--';
    el.statMo3Best.textContent = currentStats.bestMo3 ? Stats.formatTime(currentStats.bestMo3.avg) : '--';

    el.statSessAvg.textContent = currentStats.sessionAvg ? (currentStats.sessionAvg === -1 ? 'DNF' : Stats.formatTime(currentStats.sessionAvg)) : '--';
    el.statSessMean.textContent = currentStats.sessionMean ? (currentStats.sessionMean === -1 ? 'DNF' : Stats.formatTime(currentStats.sessionMean)) : '--';
  }

  // ============================================================
  // Solve Operations & Modals
  // ============================================================
  function togglePenalty(index, penaltyType) {
    if (!solves[index]) return;
    solves[index].penalty = (solves[index].penalty === penaltyType) ? 0 : penaltyType;
    Storage.saveSession(sessionID, solves);
    updateAndRenderStats();
  }

  function deleteSolve(index) {
    const item = solves[index];
    const timeFormatted = Stats.formatTime(item.time, config.precision, item.penalty);
    if (confirm(`Delete solve #${index + 1} (${timeFormatted})?`)) {
      solves.splice(index, 1);
      Storage.saveSession(sessionID, solves);
      updateAndRenderStats();
      showToast('Solve deleted');
    }
  }

  function resetSession() {
    if (solves.length === 0) return;
    if (confirm(`Are you sure you want to reset ALL ${solves.length} solves in Session ${sessionID + 1}?`)) {
      solves = [];
      Storage.saveSession(sessionID, solves);
      updateAndRenderStats();
      if (el.avgInspection) el.avgInspection.style.display = 'none';
      showToast(`Session ${sessionID + 1} reset`);
    }
  }

  function inspectAverage(avgData, name) {
    if (!avgData || !el.avgInspection) return;
    const { startIndex, size, avg, sd, trimmedIndices } = avgData;
    const sub = solves.slice(startIndex, startIndex + size);

    el.avgInspectionTitle.textContent = `${name}: ${avg === -1 ? 'DNF' : Stats.formatTime(avg)} ${sd ? `(σ = ${sd.toFixed(2)})` : ''}`;

    let html = '';
    sub.forEach((s, idx) => {
      const isTrimmed = trimmedIndices && trimmedIndices.includes(idx);
      const formatted = Stats.formatTime(s.time, config.precision, s.penalty);
      html += `<div>${idx + 1}. <span class="${isTrimmed ? 'trimmed' : ''}">${isTrimmed ? `(${formatted})` : formatted}</span></div>`;
    });

    el.avgInspectionList.innerHTML = html;
    el.avgInspection.style.display = 'flex';
  }

  function showSolveDetails(index) {
    const item = solves[index];
    if (!item) return;

    el.modalSolveTitle.textContent = `Solve #${index + 1} Details`;
    el.detailTime.textContent = Stats.formatTime(item.time, config.precision, item.penalty);
    el.detailScramble.textContent = item.scramble || currentScramble || 'Scramble not recorded';
    el.detailCommentInput.value = item.comment || '';

    el.btnSaveComment.onclick = () => {
      item.comment = el.detailCommentInput.value.trim();
      Storage.saveSession(sessionID, solves);
      renderSolvesList();
      closeModal(el.modalSolveDetails);
      showToast('Comment updated');
    };

    openModal(el.modalSolveDetails);
  }

  function renderQuickPenaltyBar(solveIndex) {
    if (!el.quickPenaltyBar) return;
    el.quickPenaltyBar.style.display = 'flex';

    const solve = solves[solveIndex];
    const updateButtons = () => {
      el.btnPenaltyOk.className = 'penalty-btn' + (solve.penalty === 0 ? ' active-ok' : '');
      el.btnPenaltyPlus2.className = 'penalty-btn' + (solve.penalty === 2 ? ' active-plus2' : '');
      el.btnPenaltyDnf.className = 'penalty-btn' + (solve.penalty === 1 ? ' active-dnf' : '');
    };
    updateButtons();

    el.btnPenaltyOk.onclick = () => {
      solve.penalty = 0;
      updateButtons();
      el.timerDisplay.textContent = Stats.formatTime(solve.time, config.precision, 0);
      Storage.saveSession(sessionID, solves);
      updateAndRenderStats();
    };

    el.btnPenaltyPlus2.onclick = () => {
      solve.penalty = (solve.penalty === 2) ? 0 : 2;
      updateButtons();
      el.timerDisplay.textContent = Stats.formatTime(solve.time, config.precision, solve.penalty);
      Storage.saveSession(sessionID, solves);
      updateAndRenderStats();
    };

    el.btnPenaltyDnf.onclick = () => {
      solve.penalty = (solve.penalty === 1) ? 0 : 1;
      updateButtons();
      el.timerDisplay.textContent = Stats.formatTime(solve.time, config.precision, solve.penalty);
      Storage.saveSession(sessionID, solves);
      updateAndRenderStats();
    };

    el.btnLeaveComment.onclick = () => {
      showSolveDetails(solveIndex);
    };
  }

  // ============================================================
  // Scramble Generation Integration
  // ============================================================
  function generateNewScramble() {
    try {
      if (window.scramblers && window.scramblers['333'] && typeof window.scramblers['333'].initialize === 'function') {
        window.scramblers['333'].initialize(null, Math);
        if (typeof window.scramblers['333'].setRandomSource === 'function') {
          window.scramblers['333'].setRandomSource(Math);
        }
      }

      const puzzleType = el.puzzleModeSelect ? el.puzzleModeSelect.value : '333';
      const scrambleLen = (puzzleType === '2gen' || puzzleType === 'roux' || puzzleType === '333o') ? 25 : 0;

      lastScramble = currentScramble;
      if (typeof window.generateScramble === 'function') {
        currentScramble = window.generateScramble(puzzleType, scrambleLen);
      } else {
        currentScramble = "R U R' U' ...";
      }

      if (el.scrambleDisplay) {
        el.scrambleDisplay.textContent = currentScramble;
      }
    } catch (e) {
      console.error('Error generating scramble:', e);
      currentScramble = "Error loading scramble: " + e.message;
      if (el.scrambleDisplay) el.scrambleDisplay.textContent = currentScramble;
    }
  }

  // ============================================================
  // TimerEngine Setup & Callbacks
  // ============================================================
  function setupTimerEngine() {
    TimerEngine.setCallbacks({
      onStateChange: (newState) => {
        el.timerStage.className = `timer-stage state-${newState}`;

        if (newState === TimerState.IDLE) {
          el.timerHint.innerHTML = `<span class="key-badge">SPACE</span> Hold to start`;
        } else if (newState === TimerState.HOLDING) {
          el.timerHint.innerHTML = `<span class="key-badge">HOLDING</span> Keep holding...`;
        } else if (newState === TimerState.READY) {
          el.timerHint.innerHTML = `<span class="key-badge" style="color: var(--accent-emerald);">READY</span> Release to start!`;
        } else if (newState === TimerState.RUNNING) {
          el.timerHint.innerHTML = `Press any key or touch to stop`;
        } else if (newState === TimerState.INSPECTING) {
          el.timerHint.innerHTML = `<span class="key-badge" style="color: var(--accent-crimson);">INSPECTION</span> Space to start solve`;
        }
      },

      onTick: (elapsed, secondsLeft, isInspection, penalty) => {
        if (isInspection) {
          if (penalty === 1) {
            el.timerDisplay.textContent = 'DNF';
          } else if (penalty === 2) {
            el.timerDisplay.textContent = '+2';
          } else {
            el.timerDisplay.textContent = secondsLeft.toString();
          }
        } else {
          const formatted = Stats.formatTime(elapsed, config.precision, 0);
          el.timerDisplay.textContent = formatted;
          if (CheatSheet.isOpen()) {
            CheatSheet.updateLiveTimer(formatted, true);
          }
        }
      },

      onSolveStart: () => {
        if (CheatSheet.isOpen()) {
          CheatSheet.updateLiveTimer('0.00', true);
        }
      },

      onSolveStop: (elapsed, penalty) => {
        const formatted = Stats.formatTime(elapsed, config.precision, penalty);
        el.timerDisplay.textContent = formatted;
        if (CheatSheet.isOpen()) {
          CheatSheet.updateLiveTimer(formatted, false);
        }

        // Record solve
        const newSolve = {
          time: elapsed,
          penalty: penalty,
          comment: '',
          scramble: currentScramble,
          date: Date.now()
        };
        solves.push(newSolve);
        Storage.saveSession(sessionID, solves);

        // Update UI
        updateAndRenderStats();
        renderQuickPenaltyBar(solves.length - 1);
        generateNewScramble();
      }
    });
  }

  // ============================================================
  // Keyboard & Touch Event Controllers
  // ============================================================
  function handleKeyDown(e) {
    // If typing in inputs/textareas, allow Escape to close CheatSheet
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        if (CheatSheet.isOpen()) {
          CheatSheet.close();
          document.activeElement.blur();
          e.preventDefault();
        }
      }
      return;
    }

    const state = TimerEngine.getState();

    // Escape Handler
    if (e.key === 'Escape') {
      if (CheatSheet.isOpen()) {
        CheatSheet.close();
        e.preventDefault();
        return;
      }
      if (state === TimerState.RUNNING || state === TimerState.INSPECTING) {
        TimerEngine.resetToIdle();
        el.timerDisplay.textContent = 'ready';
        return;
      }
    }

    // Spacebar Handler
    if (e.code === 'Space') {
      if (CheatSheet.isOpen()) {
        CheatSheet.close();
      }

      e.preventDefault();
      if (isSpaceDown) return; // Prevent key repeat
      isSpaceDown = true;

      if (state === TimerState.RUNNING) {
        TimerEngine.stopSolve();
        return;
      }

      if (state === TimerState.IDLE) {
        if (config.useInspection) {
          TimerEngine.startInspection();
          return;
        }

        TimerEngine.setState(TimerState.HOLDING);
        holdTimer = setTimeout(() => {
          if (isSpaceDown && TimerEngine.getState() === TimerState.HOLDING) {
            TimerEngine.setState(TimerState.READY);
            Audio.playSound('ready');
          }
        }, config.holdThreshold);
      } else if (state === TimerState.INSPECTING) {
        TimerEngine.setState(TimerState.HOLDING);
        holdTimer = setTimeout(() => {
          if (isSpaceDown && TimerEngine.getState() === TimerState.HOLDING) {
            TimerEngine.setState(TimerState.READY);
            Audio.playSound('ready');
          }
        }, config.holdThreshold);
      }
      return;
    }

    const key = e.key;
    const code = e.code;

    // Cheat Sheet Main Stage Shortcuts: 1 (F2L), 2 (OLL), 3 (PLL)
    // NOTE: Allowed during RUNNING without interrupting the timer!
    if (code === 'Numpad1' || key === '1') {
      e.preventDefault();
      CheatSheet.open('F2L');
      return;
    }
    if (code === 'Numpad2' || key === '2') {
      e.preventDefault();
      CheatSheet.open('OLL');
      return;
    }
    if (code === 'Numpad3' || key === '3') {
      e.preventDefault();
      CheatSheet.open('PLL');
      return;
    }

    // Cheat Sheet Sub-navigation when open (Dual-hand: QWERTY / Numpad 4-9 & Arrows)
    if (CheatSheet.isOpen()) {
      const handled = CheatSheet.handleSubNavKey(code, key);
      if (handled) {
        e.preventDefault();
        return;
      }
      // If timer is running and cheatsheet is open, protect running timer from unmapped keystrokes
      if (state === TimerState.RUNNING) {
        return;
      }
    }

    // Any other key while running (and CheatSheet closed) stops timer immediately
    if (state === TimerState.RUNNING) {
      e.preventDefault();
      TimerEngine.stopSolve();
      return;
    }
  }

  function handleKeyUp(e) {
    if (e.code === 'Space') {
      isSpaceDown = false;
      clearTimeout(holdTimer);

      const state = TimerEngine.getState();
      if (state === TimerState.READY) {
        TimerEngine.startSolve();
      } else if (state === TimerState.HOLDING) {
        // Released too early before threshold
        if (config.useInspection && (performance.now() - TimerEngine.getInspectionStartTime()) < 17000) {
          TimerEngine.setState(TimerState.INSPECTING);
        } else {
          TimerEngine.setState(TimerState.IDLE);
        }
      }
    }
  }

  function setupTouchEvents() {
    let touchHoldTimer = null;

    el.timerStage.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const state = TimerEngine.getState();

      if (state === TimerState.RUNNING) {
        TimerEngine.stopSolve();
        return;
      }
      if (state === TimerState.IDLE) {
        if (config.useInspection) {
          TimerEngine.startInspection();
          return;
        }
        TimerEngine.setState(TimerState.HOLDING);
        touchHoldTimer = setTimeout(() => {
          TimerEngine.setState(TimerState.READY);
          Audio.playSound('ready');
        }, config.holdThreshold);
      } else if (state === TimerState.INSPECTING) {
        TimerEngine.setState(TimerState.HOLDING);
        touchHoldTimer = setTimeout(() => {
          TimerEngine.setState(TimerState.READY);
          Audio.playSound('ready');
        }, config.holdThreshold);
      }
    }, { passive: false });

    el.timerStage.addEventListener('touchend', (e) => {
      e.preventDefault();
      clearTimeout(touchHoldTimer);
      const state = TimerEngine.getState();

      if (state === TimerState.READY) {
        TimerEngine.startSolve();
      } else if (state === TimerState.HOLDING) {
        if (config.useInspection) {
          TimerEngine.setState(TimerState.INSPECTING);
        } else {
          TimerEngine.setState(TimerState.IDLE);
        }
      }
    }, { passive: false });
  }

  // ============================================================
  // Modal Utilities
  // ============================================================
  function openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  // ============================================================
  // Application Lifecycle & DOM Initialization
  // ============================================================
  function init() {
    // 1. Cache DOM Elements
    el.timerStage = document.getElementById('timerStage');
    el.timerDisplay = document.getElementById('timerDisplay');
    el.timerHint = document.getElementById('timerHint');

    el.puzzleModeSelect = document.getElementById('puzzleModeSelect');
    el.sessionSelect = document.getElementById('sessionSelect');

    el.scrambleDisplay = document.getElementById('scrambleDisplay');
    el.btnNextScramble = document.getElementById('btnNextScramble');
    el.btnCopyScramble = document.getElementById('btnCopyScramble');
    el.btnLastScramble = document.getElementById('btnLastScramble');

    el.solvesList = document.getElementById('solvesList');
    el.solvesCount = document.getElementById('solvesCount');
    el.btnResetSession = document.getElementById('btnResetSession');

    el.statBestSingle = document.getElementById('statBestSingle');
    el.statWorstSingle = document.getElementById('statWorstSingle');
    el.statAo5Cur = document.getElementById('statAo5Cur');
    el.statAo5Best = document.getElementById('statAo5Best');
    el.statAo12Cur = document.getElementById('statAo12Cur');
    el.statAo12Best = document.getElementById('statAo12Best');
    el.statMo3Cur = document.getElementById('statMo3Cur');
    el.statMo3Best = document.getElementById('statMo3Best');
    el.statSessAvg = document.getElementById('statSessAvg');
    el.statSessMean = document.getElementById('statSessMean');

    el.avgInspection = document.getElementById('avgInspection');
    el.avgInspectionTitle = document.getElementById('avgInspectionTitle');
    el.avgInspectionList = document.getElementById('avgInspectionList');
    el.btnCloseAvgInspection = document.getElementById('btnCloseAvgInspection');

    el.quickPenaltyBar = document.getElementById('quickPenaltyBar');
    el.btnPenaltyOk = document.getElementById('btnPenaltyOk');
    el.btnPenaltyPlus2 = document.getElementById('btnPenaltyPlus2');
    el.btnPenaltyDnf = document.getElementById('btnPenaltyDnf');
    el.btnLeaveComment = document.getElementById('btnLeaveComment');

    el.btnSettings = document.getElementById('btnSettings');
    el.btnShortcuts = document.getElementById('btnShortcuts');
    el.btnCheatSheet = document.getElementById('btnCheatSheet');
    el.btnExport = document.getElementById('btnExport');
    el.btnImport = document.getElementById('btnImport');

    el.modalSettings = document.getElementById('modalSettings');
    el.modalShortcuts = document.getElementById('modalShortcuts');
    el.modalCheatSheet = document.getElementById('modalCheatSheet');
    el.modalSolveDetails = document.getElementById('modalSolveDetails');
    el.modalImportExport = document.getElementById('modalImportExport');

    el.settingInspection = document.getElementById('settingInspection');
    el.settingHoldTime = document.getElementById('settingHoldTime');
    el.settingPrecision = document.getElementById('settingPrecision');
    el.settingSound = document.getElementById('settingSound');

    el.modalSolveTitle = document.getElementById('modalSolveTitle');
    el.detailTime = document.getElementById('detailTime');
    el.detailScramble = document.getElementById('detailScramble');
    el.detailCommentInput = document.getElementById('detailCommentInput');
    el.btnSaveComment = document.getElementById('btnSaveComment');

    el.toast = document.getElementById('toast');

    // 2. Setup TimerEngine
    setupTimerEngine();

    // 3. Populate Sessions 1 to 25
    el.sessionSelect.innerHTML = '';
    for (let s = 0; s < 25; s++) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = `Session ${s + 1}`;
      el.sessionSelect.appendChild(opt);
    }

    el.sessionSelect.addEventListener('change', () => {
      sessionID = parseInt(el.sessionSelect.value, 10);
      solves = Storage.loadSession(sessionID);
      updateAndRenderStats();
      if (el.avgInspection) el.avgInspection.style.display = 'none';
      if (el.quickPenaltyBar) el.quickPenaltyBar.style.display = 'none';
      showToast(`Switched to Session ${sessionID + 1}`);
    });

    el.btnResetSession.addEventListener('click', resetSession);

    // 4. Scramble Buttons
    el.btnNextScramble.addEventListener('click', generateNewScramble);
    el.btnCopyScramble.addEventListener('click', () => {
      if (!currentScramble) return;
      navigator.clipboard.writeText(currentScramble).then(() => {
        showToast('Scramble copied to clipboard!');
      }).catch(() => {
        showToast('Copy failed');
      });
    });

    el.btnLastScramble.addEventListener('click', () => {
      if (lastScramble) {
        alert('Previous Scramble:\n' + lastScramble);
      } else {
        showToast('No previous scramble available');
      }
    });

    if (el.puzzleModeSelect) {
      el.puzzleModeSelect.addEventListener('change', () => {
        generateNewScramble();
      });
    }

    // 5. Stat Cards Click (Constituent Solves Inspection)
    document.getElementById('cardAo5').addEventListener('click', () => {
      if (currentStats && currentStats.currentAo5) inspectAverage(currentStats.currentAo5, 'Current Ao5');
    });
    document.getElementById('cardAo12').addEventListener('click', () => {
      if (currentStats && currentStats.currentAo12) inspectAverage(currentStats.currentAo12, 'Current Ao12');
    });
    document.getElementById('cardMo3').addEventListener('click', () => {
      if (currentStats && currentStats.currentMo3) inspectAverage(currentStats.currentMo3, 'Current Mo3');
    });

    if (el.btnCloseAvgInspection) {
      el.btnCloseAvgInspection.addEventListener('click', () => {
        el.avgInspection.style.display = 'none';
      });
    }

    // 6. Generic Modal Triggers & Close Handlers
    el.btnSettings.addEventListener('click', () => openModal(el.modalSettings));
    el.btnShortcuts.addEventListener('click', () => openModal(el.modalShortcuts));

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(el.modalSettings);
        closeModal(el.modalShortcuts);
        closeModal(el.modalCheatSheet);
        closeModal(el.modalSolveDetails);
        closeModal(el.modalImportExport);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay);
          if (overlay === el.modalCheatSheet) {
            CheatSheet.close();
          }
        }
      });
    });

    // 7. Settings Synchronization
    el.settingInspection.checked = config.useInspection;
    el.settingInspection.addEventListener('change', () => {
      config.useInspection = el.settingInspection.checked;
    });

    el.settingHoldTime.value = config.holdThreshold;
    el.settingHoldTime.addEventListener('change', () => {
      config.holdThreshold = parseInt(el.settingHoldTime.value, 10) || 300;
    });

    el.settingPrecision.value = config.precision;
    el.settingPrecision.addEventListener('change', () => {
      config.precision = parseInt(el.settingPrecision.value, 10) || 2;
      updateAndRenderStats();
    });

    el.settingSound.checked = config.soundEnabled;
    el.settingSound.addEventListener('change', () => {
      config.soundEnabled = el.settingSound.checked;
    });

    // 8. Cheat Sheet Module Initialization
    CheatSheet.init({
      modal: el.modalCheatSheet,
      btnTrigger: el.btnCheatSheet,
      btnClose: document.getElementById('btnCloseCheatSheet'),
      title: document.getElementById('cheatSheetTitle'),
      stageTabs: document.querySelectorAll('.stage-tab-btn'),
      subTabs: document.getElementById('cheatSheetSubTabs'),
      search: document.getElementById('cheatSheetSearch'),
      clearSearch: document.getElementById('btnClearSearch'),
      grid: document.getElementById('cheatSheetGrid'),
      liveTimer: document.getElementById('cheatSheetLiveTimer'),
      liveStatus: document.getElementById('cheatSheetLiveStatus'),
      liveTime: document.getElementById('cheatSheetLiveTime')
    }, showToast);

    // 9. Import / Export Module Initialization
    ImportExport.init({
      btnExport: el.btnExport,
      btnImport: el.btnImport,
      modal: el.modalImportExport,
      title: document.getElementById('importExportTitle'),
      textarea: document.getElementById('importExportText'),
      btnExecute: document.getElementById('btnExecuteImport')
    }, {
      getSolves: () => solves,
      getSessionID: () => sessionID,
      openModal: openModal,
      closeModal: closeModal,
      showToast: showToast,
      onImport: (imported) => {
        solves.push(...imported);
        Storage.saveSession(sessionID, solves);
        updateAndRenderStats();
      }
    });

    // 10. Setup Keyboard & Touch Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    setupTouchEvents();

    // 11. Initial State Hydration
    generateNewScramble();
    solves = Storage.loadSession(sessionID);
    updateAndRenderStats();
    TimerEngine.setState(TimerState.IDLE);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);

/**
 * QQTimer - CFOP Cheat Sheet Module
 * Interactive CFOP algorithm modal with 2-column layout, instant search,
 * dual-hand hotkeys (QWERTY + Numpad), and live timer synchronization.
 */

(function (window) {
  'use strict';

  window.QQTimer = window.QQTimer || {};

  // Stage and Sub-page definitions for clean pagination
  const STAGE_PAGES = {
    PLL: {
      title: 'PLL Algorithms (21 Cases - Permute Last Layer)',
      pages: [
        { id: 1, keyLabel: 'Q', name: '코너 & 엣지 (7개)', filter: (c) => c.group.includes('Corners') || c.group.includes('Edges') },
        { id: 2, keyLabel: 'W', name: '인접 교환 (6개)', filter: (c) => c.group.includes('Adjacent') },
        { id: 3, keyLabel: 'E', name: 'G-Perm (4개)', filter: (c) => c.group.includes('G-Permutations') },
        { id: 4, keyLabel: 'R', name: '대각 교환 (4개)', filter: (c) => c.group.includes('Diagonal') }
      ]
    },
    OLL: {
      title: 'OLL Algorithms (57 Cases - Orient Last Layer)',
      pages: [
        { id: 1, keyLabel: 'Q', name: '1페이지 (1~12)', filter: (c, idx) => idx >= 0 && idx < 12 },
        { id: 2, keyLabel: 'W', name: '2페이지 (13~24)', filter: (c, idx) => idx >= 12 && idx < 24 },
        { id: 3, keyLabel: 'E', name: '3페이지 (25~36)', filter: (c, idx) => idx >= 24 && idx < 36 },
        { id: 4, keyLabel: 'R', name: '4페이지 (37~48)', filter: (c, idx) => idx >= 36 && idx < 48 },
        { id: 5, keyLabel: 'T', name: '5페이지 (49~57)', filter: (c, idx) => idx >= 48 && idx < 57 }
      ]
    },
    F2L: {
      title: 'F2L Algorithms (41 Cases - First Two Layers)',
      pages: [
        { id: 1, keyLabel: 'Q', name: '1페이지: 기본 & 쉬운형 (10개)', filter: (c) => ['Case 1A', 'Case 1B', 'Case 2', 'Case 3', 'Case 17A', 'Case 17B', 'Case 18A', 'Case 18B', 'Case 19A', 'Case 19B'].includes(c.case) },
        { id: 2, keyLabel: 'W', name: '2페이지: 슬롯 & 분리형 (12개)', filter: (c) => ['Case 4A', 'Case 4B', 'Case 5A', 'Case 5B', 'Case 6', 'Case 7', 'Case 8A', 'Case 8B', 'Case 9A', 'Case 9B', 'Case 10A', 'Case 10B'].includes(c.case) },
        { id: 3, keyLabel: 'E', name: '3페이지: 코너상향 & 엣지 (12개)', filter: (c) => ['Case 11A', 'Case 11B', 'Case 12A', 'Case 12B', 'Case 13A', 'Case 13B', 'Case 14A', 'Case 14B', 'Case 15A', 'Case 15B', 'Case 16A', 'Case 16B'].includes(c.case) },
        { id: 4, keyLabel: 'R', name: '4페이지: 특수형 & 고급 (8개)', filter: (c) => ['Case 20A', 'Case 20B', 'Case 21A', 'Case 21B', 'Case 22A', 'Case 22B', 'Case 23A', 'Case 23B'].includes(c.case) }
      ]
    }
  };

  const state = {
    isOpen: false,
    currentStage: 'PLL',
    currentSubPage: 1,
    searchQuery: '',
    database: null
  };

  let dom = {};
  let showToast = () => {};

  async function loadDatabase() {
    if (window.CFOP_SOLUTIONS) {
      state.database = window.CFOP_SOLUTIONS;
      return state.database;
    }
    try {
      const resp = await fetch('./solve/solutions.json');
      if (resp.ok) {
        state.database = await resp.json();
      }
    } catch (e) {
      console.warn('Could not fetch solutions.json:', e);
    }
    return state.database;
  }

  function render() {
    if (!state.database || !dom.grid) return;
    const stageConf = STAGE_PAGES[state.currentStage];
    const stageData = state.database.stages[state.currentStage] || [];

    // Title
    if (dom.title) {
      dom.title.textContent = stageConf ? stageConf.title : `${state.currentStage} Algorithms`;
    }

    // Stage Tab active classes
    if (dom.stageTabs) {
      dom.stageTabs.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.stage === state.currentStage);
      });
    }

    // Sub Tabs Rendering
    if (dom.subTabs && stageConf) {
      dom.subTabs.innerHTML = '';
      stageConf.pages.forEach(p => {
        const subBtn = document.createElement('button');
        subBtn.className = `sub-tab-btn ${p.id === state.currentSubPage && !state.searchQuery ? 'active' : ''}`;
        subBtn.innerHTML = `<span class="sub-key">${p.keyLabel}</span><span>${p.name}</span>`;
        subBtn.onclick = () => {
          state.currentSubPage = p.id;
          state.searchQuery = '';
          if (dom.search) dom.search.value = '';
          if (dom.clearSearch) dom.clearSearch.style.display = 'none';
          render();
        };
        dom.subTabs.appendChild(subBtn);
      });
    }

    // Filter Items
    let items = [];
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = stageData.filter(item =>
        (item.case && item.case.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.group && item.group.toLowerCase().includes(q)) ||
        (item.algorithm && item.algorithm.toLowerCase().includes(q))
      );
    } else {
      const curPageConf = stageConf ? stageConf.pages.find(p => p.id === state.currentSubPage) : null;
      if (curPageConf && curPageConf.filter) {
        items = stageData.filter((item, idx) => curPageConf.filter(item, idx));
      } else {
        items = stageData;
      }
    }

    // Render 2-Column Cards Grid
    dom.grid.innerHTML = '';
    if (items.length === 0) {
      dom.grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <div>검색 결과가 없습니다: "<strong>${state.searchQuery}</strong>"</div>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'solution-row-card';
      card.title = `클릭하여 공식 복사: ${item.algorithm}`;

      card.innerHTML = `
        <div class="sol-icon-box">
          <img src="./${item.icon}" alt="${item.case}" loading="lazy">
        </div>
        <div class="sol-info-box">
          <div class="sol-meta-line">
            <span class="sol-case-badge">${item.case}</span>
            <span class="sol-name-badge">${item.name !== item.case ? item.name : (item.group || '')}</span>
          </div>
          <div class="sol-alg-line" title="${item.algorithm}">${item.algorithm}</div>
        </div>
        <div class="sol-copy-icon">📋</div>
      `;

      card.onclick = () => {
        if (!item.algorithm || item.algorithm.includes('Solved')) {
          showToast(`${item.case}: 기본 완성 상태`);
          return;
        }
        navigator.clipboard.writeText(item.algorithm).then(() => {
          showToast(`📋 [${item.case}] 공식 복사 완료: ${item.algorithm}`);
        }).catch(() => {
          showToast(`복사 완료: ${item.algorithm}`);
        });
      };

      dom.grid.appendChild(card);
    });
  }

  function updateLiveTimer(formattedTime, isRunning) {
    if (!dom.liveTimer || !dom.liveTime) return;
    if (isRunning) {
      dom.liveTimer.classList.add('is-running');
      if (dom.liveStatus) dom.liveStatus.textContent = 'RUNNING';
      dom.liveTime.textContent = formattedTime;
    } else {
      dom.liveTimer.classList.remove('is-running');
      if (dom.liveStatus) dom.liveStatus.textContent = 'TIMER';
      dom.liveTime.textContent = formattedTime;
    }
  }

  function open(stage = null, subPage = null) {
    if (!state.database) {
      loadDatabase().then(() => open(stage, subPage));
      return;
    }

    if (stage) {
      if (state.isOpen && state.currentStage === stage && (subPage === null || subPage === state.currentSubPage)) {
        close();
        return;
      }
      state.currentStage = stage;
      state.currentSubPage = subPage !== null ? subPage : 1;
    }

    state.isOpen = true;
    if (dom.modal) dom.modal.classList.add('active');
    render();
  }

  function close() {
    state.isOpen = false;
    if (dom.modal) dom.modal.classList.remove('active');
    state.searchQuery = '';
    if (dom.search) dom.search.value = '';
    if (dom.clearSearch) dom.clearSearch.style.display = 'none';
  }

  function handleSubNavKey(code, key) {
    if (!state.isOpen) return false;

    const stageConf = STAGE_PAGES[state.currentStage];
    const maxPages = stageConf ? stageConf.pages.length : 1;

    // Dual-hand mapping (Left: QWERTY, Right: 456789)
    const subPageMap = {
      'KeyQ': 1, 'q': 1, 'Q': 1, 'ㅂ': 1, 'Numpad4': 1, 'Digit4': 1, '4': 1,
      'KeyW': 2, 'w': 2, 'W': 2, 'ㅈ': 2, 'Numpad5': 2, 'Digit5': 2, '5': 2,
      'KeyE': 3, 'e': 3, 'E': 3, 'ㄷ': 3, 'Numpad6': 3, 'Digit6': 3, '6': 3,
      'KeyR': 4, 'r': 4, 'R': 4, 'ㄱ': 4, 'Numpad7': 4, 'Digit7': 4, '7': 4,
      'KeyT': 5, 't': 5, 'T': 5, 'ㅅ': 5, 'Numpad8': 5, 'Digit8': 5, '8': 5,
      'KeyY': 6, 'y': 6, 'Y': 6, 'ㅛ': 6, 'Numpad9': 6, 'Digit9': 6, '9': 6
    };

    const matchedPage = subPageMap[code] || subPageMap[key];
    if (matchedPage !== undefined) {
      if (matchedPage <= maxPages) {
        state.currentSubPage = matchedPage;
        state.searchQuery = '';
        if (dom.search) dom.search.value = '';
        if (dom.clearSearch) dom.clearSearch.style.display = 'none';
        render();
      }
      return true;
    }

    if (key === 'ArrowLeft') {
      if (state.currentSubPage > 1) {
        state.currentSubPage--;
        render();
      }
      return true;
    }

    if (key === 'ArrowRight') {
      if (state.currentSubPage < maxPages) {
        state.currentSubPage++;
        render();
      }
      return true;
    }

    return false;
  }

  function init(elements, toastHandler) {
    dom = elements;
    if (typeof toastHandler === 'function') {
      showToast = toastHandler;
    }

    loadDatabase();

    if (dom.btnTrigger) {
      dom.btnTrigger.addEventListener('click', () => open(state.currentStage));
    }

    if (dom.btnClose) {
      dom.btnClose.addEventListener('click', close);
    }

    if (dom.stageTabs) {
      dom.stageTabs.forEach(btn => {
        btn.addEventListener('click', () => {
          const stage = btn.dataset.stage;
          if (stage) {
            state.currentStage = stage;
            state.currentSubPage = 1;
            state.searchQuery = '';
            if (dom.search) dom.search.value = '';
            render();
          }
        });
      });
    }

    if (dom.search) {
      dom.search.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        if (dom.clearSearch) {
          dom.clearSearch.style.display = state.searchQuery ? 'block' : 'none';
        }
        render();
      });
    }

    if (dom.clearSearch) {
      dom.clearSearch.addEventListener('click', () => {
        state.searchQuery = '';
        if (dom.search) {
          dom.search.value = '';
          dom.search.focus();
        }
        dom.clearSearch.style.display = 'none';
        render();
      });
    }
  }

  const CheatSheet = {
    init: init,
    open: open,
    close: close,
    render: render,
    updateLiveTimer: updateLiveTimer,
    handleSubNavKey: handleSubNavKey,
    isOpen: function () {
      return state.isOpen;
    },
    getCurrentStage: function () {
      return state.currentStage;
    }
  };

  window.QQTimer.CheatSheet = CheatSheet;
})(window);

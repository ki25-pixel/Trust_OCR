// ★ 구형 2.x / 1.x 모델 완전 삭제 -> Google 권장 최신 gemini-3.8-flash 최우선 고정
let FAILOVER_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.0-flash"
];

let isModelsDiscovered = false;
let modelDiscoveryPromise = null;
let preferredWorkingModelIndex = 0;

const deadOrQuotaExhaustedModels = new Set();

function setElText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = (val !== undefined && val !== null) ? val : '';
}

function setElHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = (html !== undefined && html !== null) ? html : '';
}

async function discoverAvailableModels(activeKey) {
  if (isModelsDiscovered && FAILOVER_MODELS.length > 0) return FAILOVER_MODELS;
  if (modelDiscoveryPromise) return modelDiscoveryPromise;

  modelDiscoveryPromise = (async () => {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(activeKey)}`);
      if (!res.ok) return FAILOVER_MODELS;
      const data = await res.json();
      if (!data.models || !Array.isArray(data.models)) return FAILOVER_MODELS;

      const EXCLUDE_KEYWORDS = [
        "tts", "audio", "speech", "voice", "imagen", "image", "video",
        "embedding", "aqa", "attribution", "bisect", "learnlm", "robotics",
        "thinking", "vision", "1.0", "1.5", "2.0", "2.5"
      ];

      const validModels = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace(/^models\//, ""))
        .filter(name => {
          const lower = name.toLowerCase();
          if (!lower.startsWith("gemini-3")) return false;
          for (const bad of EXCLUDE_KEYWORDS) {
            if (lower.includes(bad)) return false;
          }
          return true;
        });

      if (validModels.length > 0) {
        validModels.sort((a, b) => {
          const getScore = (name) => {
            let s = 0;
            if (name === "gemini-3.8-flash") s += 1000;
            if (name === "gemini-3.8-flash-lite") s += 800;
            if (name.startsWith("gemini-3.8-flash")) s += 500;
            if (/^gemini-3\.[0-9]+-flash$/.test(name)) s += 300;
            if (name.includes("flash")) s += 100;
            if (name.includes("pro")) s -= 50;
            if (name.includes("preview") || name.includes("exp")) s -= 20;
            return s;
          };
          return getScore(b) - getScore(a);
        });
        if (!validModels.includes("gemini-3.8-flash")) {
          validModels.unshift("gemini-3.8-flash");
        }
        FAILOVER_MODELS = validModels.slice(0, 4);
      } else {
        FAILOVER_MODELS = ["gemini-3.8-flash"];
      }

      isModelsDiscovered = true;
      preferredWorkingModelIndex = 0;
      const activeFirst = FAILOVER_MODELS.find(m => !deadOrQuotaExhaustedModels.has(m)) || FAILOVER_MODELS[0];
      refreshApiKeyStatusUI(activeFirst);
    } catch (e) {
      FAILOVER_MODELS = ["gemini-3.8-flash"];
    } finally {
      modelDiscoveryPromise = null;
    }
    return FAILOVER_MODELS;
  })();

  return modelDiscoveryPromise;
}

function parseNumericAmount(val) {
  if (!val) return 0;
  const digits = String(val).replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function formatWonSymbol(val) {
  const num = parseNumericAmount(val);
  if (!num) return "";
  return `₩${num.toLocaleString('ko-KR')}-`;
}

function numberToKoreanCurrency(num) {
  const n = parseNumericAmount(num);
  if (!n || n <= 0) return "";

  const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const smallUnits = ["", "십", "백", "천"];
  const bigUnits = ["", "만", "억", "조", "경"];

  let result = "";
  let unitIdx = 0;
  let temp = n;

  while (temp > 0) {
    const part = temp % 10000;
    if (part > 0) {
      let partStr = "";
      let p = part;
      for (let i = 0; i < 4; i++) {
        const d = p % 10;
        if (d > 0) partStr = digits[d] + smallUnits[i] + partStr;
        p = Math.floor(p / 10);
      }
      result = partStr + bigUnits[unitIdx] + result;
    }
    temp = Math.floor(temp / 10000);
    unitIdx++;
  }
  return `금 ${result}원정`;
}

function recalculateFeeAndRate() {
  const feeNumStr = document.getElementById('meta-fee-num')?.value || contractState.contractMeta.feeAmountNum;
  const feeVal = parseNumericAmount(feeNumStr);

  const korStr = numberToKoreanCurrency(feeVal);
  contractState.contractMeta.feeAmountKor = korStr;
  const korInput = document.getElementById('meta-fee-kor');
  if (korInput) korInput.value = korStr;

  let totalLimit = 0;
  contractState.priorityBeneficiaries.forEach(pb => {
    totalLimit += parseNumericAmount(pb.limitAmount);
  });

  let rateStr = "";
  if (totalLimit > 0 && feeVal > 0) {
    const rawRate = (feeVal / totalLimit) * 100;
    const formattedRate = parseFloat(rawRate.toFixed(3));
    rateStr = `${formattedRate}%`;
  }

  contractState.contractMeta.feeRate = rateStr;
  const rateInput = document.getElementById('meta-fee-rate');
  if (rateInput) rateInput.value = rateStr;
}

window.handleFeeNumericInput = function(val) {
  contractState.contractMeta.feeAmountNum = val;
  recalculateFeeAndRate();
  window.updateDocumentPreviews();
};

window.formatFeeNumericBlur = function(inputEl) {
  if (!inputEl) return;
  const formatted = formatWonSymbol(inputEl.value);
  inputEl.value = formatted;
  contractState.contractMeta.feeAmountNum = formatted;
  recalculateFeeAndRate();
  window.updateDocumentPreviews();
};

window.formatPBLimitBlur = function(index, inputEl) {
  if (!inputEl) return;
  const formatted = formatWonSymbol(inputEl.value);
  inputEl.value = formatted;
  if (contractState.priorityBeneficiaries[index]) {
    contractState.priorityBeneficiaries[index].limitAmount = formatted;
  }
  recalculateFeeAndRate();
  window.updateDocumentPreviews();
};

function getJosa(word, josaType) {
  if (!word) return "";
  const trimmed = String(word).trim();
  if (!trimmed) return "";
  const lastChar = trimmed.charCodeAt(trimmed.length - 1);
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
    const defaults = { '은/는': '는', '이/가': '가', '을/를': '를', '과/와': '와', '이라/라': '라', '으로/로': '로' };
    return defaults[josaType] || '';
  }
  const hasBatchim = (lastChar - 0xAC00) % 28 !== 0;
  switch (josaType) {
    case '은/는': return hasBatchim ? '은' : '는';
    case '이/가': return hasBatchim ? '이' : '가';
    case '을/를': return hasBatchim ? '을' : '를';
    case '과/와': return hasBatchim ? '과' : '와';
    case '이라/라': return hasBatchim ? '이라' : '라';
    case '으로/로':
      const jong = (lastChar - 0xAC00) % 28;
      return (jong === 0 || jong === 8) ? '로' : '으로';
    default: return '';
  }
}

// =========================================================================
// ★ 상태 객체 전면 공란 초기화
// =========================================================================
let vendorDatabase = [];
let isAdminAuthenticated = false;
let currentDocSubTab = "doc1";

let contractState = {
  trusters: [
    {
      id: "T1",
      type: "corporation",
      name: "",
      idNumber: "",
      bizNo: "",
      bizType: "",
      ceoName: "",
      address: "",
      isDebtor: false,
      isRepresentative: true,
      shareRatio: ""
    }
  ],
  debtor: {
    isSameAsTruster: false,
    type: "corporation",
    name: "",
    idNumber: "",
    ceoName: "",
    address: "",
    bizNo: ""
  },
  trustee: {
    name: "한국투자부동산신탁 주식회사",
    address: "서울특별시 강남구 테헤란로 518, 섬유센터 7층(대치동)",
    ceoName: "대표이사 이 국 형",
    corpNumber: "110111-7125720"
  },
  priorityBeneficiaries: [
    {
      id: "PB1",
      rank: "1순위",
      name: "",
      corpNumber: "",
      bizNo: "",
      ceoName: "",
      address: "",
      loanAgreementDate: "",
      limitAmount: ""
    }
  ],
  agentBankName: "",
  hasManualAgentBank: false,
  contractMeta: {
    copyCount: 4,
    contractDate: "",
    feeRate: "",
    feeAmountKor: "",
    feeAmountNum: "",
    trustPeriod: "",
    propertySummary: ""
  }
};

window.switchTab = function(tabId) {
  try {
    if (tabId === 'settings' && !isAdminAuthenticated) {
      const pwInput = document.getElementById('admin-pw-input');
      if (pwInput) pwInput.value = '';
      document.getElementById('admin-auth-error')?.classList.add('hidden');
      document.getElementById('admin-auth-modal')?.classList.remove('hidden');
      return;
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('bg-blue-600', 'text-white', 'shadow');
      btn.classList.add('text-slate-400', 'hover:text-white');
    });
    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-blue-600', 'text-white', 'shadow');
      activeBtn.classList.remove('text-slate-400');
    }

    if (tabId === 'database') renderVendorTables();
    if (tabId === 'generator') {
      ensureTemplatesInjected();
      recalculateFeeAndRate();
      window.updateDocumentPreviews();
    }
    if (tabId === 'settings') refreshApiKeyStatusUI();
  } catch (err) {
    console.error("탭 전환 오류:", err);
  }
};

window.switchDocSubTab = function(docId) {
  try {
    currentDocSubTab = docId;
    ensureTemplatesInjected();
    window.updateDocumentPreviews();

    document.querySelectorAll('.doc-paper').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.doc-subtab').forEach(btn => {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('bg-slate-900', 'text-slate-400');
    });

    const viewMap = {
      'doc1': 'doc-view-1',
      'doc2-1': 'doc-view-2-1',
      'doc2-2': 'doc-view-2-2',
      'doc2-3': 'doc-view-2-3',
      'doc3-1': 'doc-view-3-1',
      'doc3-2': 'doc-view-3-2'
    };

    const targetViewId = viewMap[docId] || 'doc-view-1';
    const activeView = document.getElementById(targetViewId);
    const activeBtn = document.getElementById(`subtab-${docId}`);

    if (activeView) activeView.classList.remove('hidden');
    if (activeBtn) {
      activeBtn.classList.add('bg-blue-600', 'text-white');
      activeBtn.classList.remove('bg-slate-900', 'text-slate-400');
    }
  } catch (err) {}
};

function ensureTemplatesInjected() {
  const printArea = document.getElementById('print-area');
  if (printArea && printArea.children.length === 0 && typeof window.injectDocumentTemplates === 'function') {
    window.injectDocumentTemplates();
  }
}

function getStoredApiKey() {
  try { return (localStorage.getItem('gemini_ocr_api_key') || '').trim(); } catch (e) { return ''; }
}

function loadPersistentVendorDatabase() {
  try {
    const saved = localStorage.getItem('trust_vendor_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        vendorDatabase = parsed;
        updateNativeDatalist();
        return;
      }
    }
  } catch (e) {}
  vendorDatabase = [];
  saveVendorDatabaseToStorage();
}

function saveVendorDatabaseToStorage() {
  try { localStorage.setItem('trust_vendor_db', JSON.stringify(vendorDatabase)); } catch (e) {}
  const count = vendorDatabase.length;
  setElText('stat-total-vendors', count);
  setElText('db-count-badge', count);
  updateNativeDatalist();
}

function updateNativeDatalist() {
  const dl = document.getElementById('vendor-master-datalist');
  if (!dl) return;
  dl.innerHTML = vendorDatabase.map(v => `<option value="${v.companyName || ''}">${v.representative || ''} | ${v.corpRegNo || ''}</option>`).join('');
}

window.resetVendorDBToDefault = function() {
  if (!confirm("모든 거래처 DB를 삭제하시겠습니까?")) return;
  vendorDatabase = [];
  saveVendorDatabaseToStorage();
  renderVendorTables();
  showToast('거래처 DB가 초기화되었습니다.');
};

function initializeApplication() {
  try {
    ensureTemplatesInjected();

    const key = getStoredApiKey();
    const apiKeyInput = document.getElementById('gemini-api-key');
    if (apiKeyInput && key) apiKeyInput.value = key;
    if (apiKeyInput) {
      apiKeyInput.addEventListener('input', function() {
        isModelsDiscovered = false;
        deadOrQuotaExhaustedModels.clear();
        try { localStorage.setItem('gemini_ocr_api_key', this.value.trim()); } catch(e) {}
        refreshApiKeyStatusUI();
      });
    }

    loadPersistentVendorDatabase();
    renderVendorTables();
    renderTrusterUI();
    renderPriorityBeneficiaryUI();
    recalculateFeeAndRate();
    refreshApiKeyStatusUI();
    window.updateDocumentPreviews();

    if (key && key.length > 5) {
      discoverAvailableModels(key);
    }
  } catch (initErr) {
    console.error("초기화 오류:", initErr);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
  initializeApplication();
}

function refreshApiKeyStatusUI(activeModelName) {
  const key = getStoredApiKey();
  const dot = document.getElementById('api-status-dot');
  const badge = document.getElementById('active-model-name-badge');

  if (key && key.length > 5) {
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2';
    if (badge) {
      badge.className = 'text-emerald-400 ml-1 font-mono font-bold';
      badge.textContent = activeModelName || FAILOVER_MODELS[preferredWorkingModelIndex] || "gemini-3.8-flash";
    }
  } else {
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400 mr-2';
    if (badge) {
      badge.className = 'text-amber-400 ml-1 font-mono font-bold';
      badge.textContent = 'Key 미설정';
    }
  }
  const input = document.getElementById('gemini-api-key');
  if (input && key) input.value = key;
}

function getFilteredVendors(query, showAll = false) {
  if (showAll || !query || !String(query).trim()) return vendorDatabase;
  const q = String(query).trim().toLowerCase();
  return vendorDatabase.filter(v =>
    (v.companyName && String(v.companyName).toLowerCase().includes(q)) ||
    (v.representative && String(v.representative).toLowerCase().includes(q)) ||
    (v.corpRegNo && String(v.corpRegNo).toLowerCase().includes(q)) ||
    (v.address && String(v.address).toLowerCase().includes(q))
  );
}

function closeAllAutocompletes() {
  document.querySelectorAll('.custom-autocomplete-popup').forEach(el => el.classList.add('hidden'));
  document.getElementById('debtor-autocomplete')?.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-wrapper') && !e.target.closest('#debtor-name-wrapper')) {
    closeAllAutocompletes();
  }
});

window.openTrusterDropdown = function(index, showAll = false) {
  closeAllAutocompletes();
  const input = document.getElementById(`truster-name-${index}`);
  const dropdown = document.getElementById(`truster-autocomplete-${index}`);
  if (!dropdown) return;
  const list = getFilteredVendors(input ? input.value : '', showAll);
  renderDropdownItems(dropdown, list, (vendor) => applyVendorToTruster(index, vendor));
  dropdown.classList.remove('hidden');
};

window.handleTrusterTyping = function(index, val) {
  contractState.trusters[index].name = val;
  const exactMatch = vendorDatabase.find(v => v.companyName === String(val).trim());
  if (exactMatch) { applyVendorToTruster(index, exactMatch); return; }
  window.openTrusterDropdown(index, false);
  window.updateDocumentPreviews();
};

function applyVendorToTruster(index, v) {
  const t = contractState.trusters[index];
  if (!t || !v) return;
  t.name = v.companyName || '';
  t.idNumber = v.corpRegNo || '';
  t.bizNo = v.bizNo || '';
  t.bizType = v.bizType || '부동산업 / 신탁 및 자산관리';
  t.address = v.address || '';
  t.type = v.type || 'corporation';
  t.ceoName = v.ceoName || (t.type === 'corporation' ? `대표이사 ${v.representative || ''}` : '');
  closeAllAutocompletes();
  renderTrusterUI();
  window.updateDocumentPreviews();
}

window.openDebtorDropdown = function(showAll = false) {
  closeAllAutocompletes();
  const input = document.getElementById('debtor-name');
  const dropdown = document.getElementById('debtor-autocomplete');
  if (!dropdown) return;
  const list = getFilteredVendors(input ? input.value : '', showAll);
  renderDropdownItems(dropdown, list, (vendor) => applyVendorToDebtor(vendor));
  dropdown.classList.remove('hidden');
};

window.handleDebtorTyping = function(val) {
  contractState.debtor.name = val;
  const exactMatch = vendorDatabase.find(v => v.companyName === String(val).trim());
  if (exactMatch) { applyVendorToDebtor(exactMatch); return; }
  window.openDebtorDropdown(false);
  window.updateDocumentPreviews();
};

function applyVendorToDebtor(v) {
  if (!v) return;
  contractState.debtor.name = v.companyName || '';
  contractState.debtor.idNumber = v.corpRegNo || '';
  contractState.debtor.address = v.address || '';
  contractState.debtor.type = v.type || 'corporation';
  contractState.debtor.ceoName = v.ceoName || (contractState.debtor.type === 'corporation' ? `대표이사 ${v.representative || ''}` : '');
  contractState.debtor.bizNo = v.bizNo || '';
  syncDebtorInputsFromState();
  closeAllAutocompletes();
  window.updateDocumentPreviews();
}

function syncDebtorInputsFromState() {
  const d = contractState.debtor;
  if (document.getElementById('debtor-name')) document.getElementById('debtor-name').value = d.name || '';
  if (document.getElementById('debtor-idNumber')) document.getElementById('debtor-idNumber').value = d.idNumber || '';
  if (document.getElementById('debtor-ceoName')) document.getElementById('debtor-ceoName').value = d.ceoName || '';
  if (document.getElementById('debtor-type')) document.getElementById('debtor-type').value = d.type || 'corporation';
  if (document.getElementById('debtor-address')) document.getElementById('debtor-address').value = d.address || '';
}

window.handleDebtorManualChange = function() {
  contractState.debtor.name = document.getElementById('debtor-name')?.value || '';
  contractState.debtor.idNumber = document.getElementById('debtor-idNumber')?.value || '';
  contractState.debtor.ceoName = document.getElementById('debtor-ceoName')?.value || '';
  contractState.debtor.type = document.getElementById('debtor-type')?.value || 'corporation';
  contractState.debtor.address = document.getElementById('debtor-address')?.value || '';
  window.updateDocumentPreviews();
};

window.openPBDropdown = function(index, showAll = false) {
  closeAllAutocompletes();
  const input = document.getElementById(`pb-name-${index}`);
  const dropdown = document.getElementById(`pb-autocomplete-${index}`);
  if (!dropdown) return;
  const list = getFilteredVendors(input ? input.value : '', showAll);
  renderDropdownItems(dropdown, list, (vendor) => applyVendorToPB(index, vendor));
  dropdown.classList.remove('hidden');
};

window.handlePBTyping = function(index, val) {
  contractState.priorityBeneficiaries[index].name = val;
  const exactMatch = vendorDatabase.find(v => v.companyName === String(val).trim());
  if (exactMatch) { applyVendorToPB(index, exactMatch); return; }
  window.openPBDropdown(index, false);
  window.updateDocumentPreviews();
};

function applyVendorToPB(index, v) {
  const pb = contractState.priorityBeneficiaries[index];
  if (!pb || !v) return;
  pb.name = v.companyName || '';
  pb.corpNumber = v.corpRegNo || '';
  pb.bizNo = v.bizNo || '';
  pb.address = v.address || '';
  pb.ceoName = v.ceoName || `대표자 ${v.representative || ''}`;
  closeAllAutocompletes();
  renderPriorityBeneficiaryUI();
  window.updateDocumentPreviews();
}

function renderDropdownItems(dropdownEl, list, onSelectCallback) {
  dropdownEl.innerHTML = '';
  if (list.length === 0) {
    dropdownEl.innerHTML = `<div class="p-3 text-center text-xs text-slate-400">일치하는 거래처가 없습니다.</div>`;
    return;
  }
  list.forEach(v => {
    const item = document.createElement('div');
    item.className = 'p-2.5 hover:bg-blue-950/80 cursor-pointer flex items-center justify-between text-xs transition-colors';
    item.onmousedown = (e) => { e.preventDefault(); onSelectCallback(v); };
    item.innerHTML = `
      <div class="truncate pr-2">
        <div class="flex items-center gap-1.5">
          <strong class="text-white font-bold">${v.companyName || ''}</strong>
          <span class="text-[10px] text-slate-400">(${v.representative || ''})</span>
        </div>
      </div>
      <span class="shrink-0 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-semibold">자동채움</span>
    `;
    dropdownEl.appendChild(item);
  });
}

function renderTrusterUI() {
  const container = document.getElementById('trusters-container');
  if (!container) return;
  const isMulti = contractState.trusters.length >= 2;
  const badge = document.getElementById('badge-multi-truster');
  if (badge) {
    badge.textContent = isMulti ? `다수 위탁자 (${contractState.trusters.length}인)` : '단독 위탁자';
    badge.className = isMulti 
      ? 'text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700 font-bold'
      : 'text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700';
  }

  const copyEl = document.getElementById('meta-copy-count');
  if (copyEl) copyEl.value = isMulti ? 5 : 4;
  contractState.contractMeta.copyCount = isMulti ? 5 : 4;

  container.innerHTML = '';
  contractState.trusters.forEach((t, index) => {
    const row = document.createElement('div');
    row.className = 'p-3 bg-slate-900/90 rounded-lg border border-slate-700 space-y-2';
    row.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="font-bold text-xs text-blue-300">위탁자 ${index + 1} ${t.isRepresentative ? '<span class="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 ml-1">대표위탁자</span>' : ''}</span>
          <select onchange="window.updateTrusterField(${index}, 'type', this.value)" class="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none">
            <option value="corporation" ${t.type === 'corporation' ? 'selected' : ''}>법인</option>
            <option value="individual" ${t.type === 'individual' ? 'selected' : ''}>개인</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <label class="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
            <input type="checkbox" ${t.isDebtor ? 'checked' : ''} onchange="window.updateTrusterField(${index}, 'isDebtor', this.checked)" class="rounded bg-slate-800 text-blue-500">
            <span>채무자 겸임</span>
          </label>
          ${isMulti ? `
            <label class="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
              <input type="radio" name="rep_truster" ${t.isRepresentative ? 'checked' : ''} onchange="window.setRepresentativeTruster(${index})" class="text-blue-500">
              <span>대표 지정</span>
            </label>
            <div class="flex items-center gap-1 text-[11px] text-slate-300">
              <span>지분율:</span>
              <input type="text" value="${t.shareRatio \vert{}\vert{} ''}" oninput="window.updateTrusterField(${index}, 'shareRatio', this.value)" class="w-14 bg-slate-950 border border-slate-700 p-1 rounded text-center text-xs"> %
            </div>
          ` : ''}
          ${contractState.trusters.length > 1 ? `
            <button type="button" onclick="window.removeTrusterRow(${index})" class="text-slate-400 hover:text-rose-400 text-xs px-1 cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>
          ` : ''}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div class="relative autocomplete-wrapper">
          <div class="relative flex items-center">
            <input type="text" id="truster-name-${index}" list="vendor-master-datalist" autocomplete="off"
              value="${t.name || ''}"
              onfocus="window.openTrusterDropdown(${index}, true)"
              oninput="window.handleTrusterTyping(${index}, this.value)"
              placeholder="업체명/성명 클릭 또는 입력..."
              class="w-full bg-slate-950 border border-blue-500/60 text-white p-2 pr-7 rounded focus:outline-none focus:border-blue-400 font-bold">
            <button type="button" onclick="window.openTrusterDropdown(${index}, true)" class="absolute right-2 text-blue-400 hover:text-white px-1">
              <i class="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
          </div>
          <div id="truster-autocomplete-${index}" class="custom-autocomplete-popup hidden absolute left-0 right-0 top-full mt-1 bg-slate-900 border-2 border-blue-500 rounded-lg shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-800"></div>
        </div>

        <input type="text" value="${t.idNumber || ''}" oninput="window.updateTrusterField(${index}, 'idNumber', this.value)" placeholder="법인/주민등록번호" class="bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none font-mono">
        <input type="text" value="${t.ceoName || ''}" oninput="window.updateTrusterField(${index}, 'ceoName', this.value)" placeholder="대표자 직책/성명 (법인)" class="bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none">
      </div>

      <div class="text-xs">
        <input type="text" value="${t.address || ''}" oninput="window.updateTrusterField(${index}, 'address', this.value)" placeholder="주소" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none">
      </div>
    `;
    container.appendChild(row);
  });

  checkDebtorSync();
}

function renderPriorityBeneficiaryUI() {
  const container = document.getElementById('pb-container');
  if (!container) return;
  container.innerHTML = '';

  contractState.priorityBeneficiaries.forEach((pb, index) => {
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-900/90 rounded-lg border border-slate-700 space-y-2 text-xs';
    item.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold text-amber-300">우선수익자 ${index + 1} (${pb.rank})</span>
        ${contractState.priorityBeneficiaries.length > 1 ? `
          <button type="button" onclick="window.removePriorityBeneficiaryRow(${index})" class="text-slate-400 hover:text-rose-400 text-xs px-1 cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>
        ` : ''}
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="relative autocomplete-wrapper">
          <div class="relative flex items-center">
            <input type="text" id="pb-name-${index}" list="vendor-master-datalist" autocomplete="off"
              value="${pb.name || ''}"
              onfocus="window.openPBDropdown(${index}, true)"
              oninput="window.handlePBTyping(${index}, this.value)"
              placeholder="금융기관명 클릭 또는 입력..."
              class="w-full bg-slate-950 border border-amber-500/60 text-white p-2 pr-7 rounded focus:outline-none focus:border-amber-400 font-bold">
            <button type="button" onclick="window.openPBDropdown(${index}, true)" class="absolute right-2 text-amber-400 hover:text-white px-1">
              <i class="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
          </div>
          <div id="pb-autocomplete-${index}" class="custom-autocomplete-popup hidden absolute left-0 right-0 top-full mt-1 bg-slate-900 border-2 border-amber-500 rounded-lg shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-800"></div>
        </div>

        <input type="text" value="${pb.limitAmount || ''}" 
          oninput="window.updatePBField(${index}, 'limitAmount', this.value)" 
          onblur="window.formatPBLimitBlur(${index}, this)"
          placeholder="우선수익권금액 (₩)" class="bg-slate-950 border border-slate-700 text-amber-300 p-2 rounded font-mono font-bold focus:outline-none">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input type="text" value="${pb.corpNumber || ''}" oninput="window.updatePBField(${index}, 'corpNumber', this.value)" placeholder="법인등록번호" class="bg-slate-950 border border-slate-700 text-white p-2 rounded font-mono">
        <input type="text" value="${pb.ceoName || ''}" oninput="window.updatePBField(${index}, 'ceoName', this.value)" placeholder="대표자 직책/성명" class="bg-slate-950 border border-slate-700 text-white p-2 rounded">
      </div>
      <input type="text" value="${pb.address || ''}" oninput="window.updatePBField(${index}, 'address', this.value)" placeholder="주소" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded">
    `;
    container.appendChild(item);
  });

  const autoAgent = contractState.priorityBeneficiaries.length >= 2;
  if (autoAgent && !contractState.agentBankName) {
    contractState.agentBankName = contractState.priorityBeneficiaries[0].name;
    const agEl = document.getElementById('agent-bank-name');
    if (agEl) agEl.value = contractState.agentBankName;
  }
  const chkEl = document.getElementById('check-manual-agent');
  if (chkEl) chkEl.checked = autoAgent || contractState.hasManualAgentBank;
}

window.addTrusterRow = function() {
  const idx = contractState.trusters.length + 1;
  contractState.trusters.push({
    id: `T${idx}`, type: "corporation", name: "", idNumber: "", bizNo: "", bizType: "", ceoName: "", address: "", isDebtor: false, isRepresentative: false, shareRatio: ""
  });
  renderTrusterUI();
  window.updateDocumentPreviews();
};

window.removeTrusterRow = function(index) {
  if (contractState.trusters.length <= 1) return;
  contractState.trusters.splice(index, 1);
  if (!contractState.trusters.some(t => t.isRepresentative)) contractState.trusters[0].isRepresentative = true;
  renderTrusterUI();
  window.updateDocumentPreviews();
};

window.updateTrusterField = function(index, field, value) {
  if (!contractState.trusters[index]) return;
  contractState.trusters[index][field] = value;
  if (field === 'isDebtor') checkDebtorSync();
  if (field === 'type') renderTrusterUI();
  window.updateDocumentPreviews();
};

window.setRepresentativeTruster = function(index) {
  contractState.trusters.forEach((t, i) => t.isRepresentative = (i === index));
  renderTrusterUI();
  window.updateDocumentPreviews();
};

function checkDebtorSync() {
  const debtorTruster = contractState.trusters.find(t => t.isDebtor);
  const debtorBox = document.getElementById('debtor-inputs-box');
  const syncNotice = document.getElementById('debtor-sync-notice');
  const statusTag = document.getElementById('debtor-status-tag');

  if (debtorTruster) {
    contractState.debtor.isSameAsTruster = true;
    contractState.debtor.name = debtorTruster.name;
    contractState.debtor.idNumber = debtorTruster.idNumber;
    contractState.debtor.address = debtorTruster.address;
    contractState.debtor.type = debtorTruster.type;
    contractState.debtor.ceoName = debtorTruster.ceoName;
    syncDebtorInputsFromState();

    debtorBox?.classList.add('opacity-40', 'pointer-events-none');
    syncNotice?.classList.remove('hidden');
    if (statusTag) {
      statusTag.textContent = "위탁자 겸임 연동 중";
      statusTag.className = "text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700";
    }
  } else {
    contractState.debtor.isSameAsTruster = false;
    debtorBox?.classList.remove('opacity-40', 'pointer-events-none');
    syncNotice?.classList.add('hidden');
    if (statusTag) {
      statusTag.textContent = "별도 채무자";
      statusTag.className = "text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700";
    }
  }
  window.updateDocumentPreviews();
}

window.addPriorityBeneficiaryRow = function() {
  const idx = contractState.priorityBeneficiaries.length + 1;
  contractState.priorityBeneficiaries.push({
    id: `PB${idx}`, rank: `1순위`, name: "", corpNumber: "", bizNo: "", ceoName: "", address: "", loanAgreementDate: "", limitAmount: ""
  });
  renderPriorityBeneficiaryUI();
  recalculateFeeAndRate();
  window.updateDocumentPreviews();
};

window.removePriorityBeneficiaryRow = function(index) {
  if (contractState.priorityBeneficiaries.length <= 1) return;
  contractState.priorityBeneficiaries.splice(index, 1);
  renderPriorityBeneficiaryUI();
  recalculateFeeAndRate();
  window.updateDocumentPreviews();
};

window.updatePBField = function(index, field, value) {
  if (!contractState.priorityBeneficiaries[index]) return;
  contractState.priorityBeneficiaries[index][field] = value;
  if (field === 'limitAmount') recalculateFeeAndRate();
  window.updateDocumentPreviews();
};

window.handleAgentBankToggle = function() {
  contractState.hasManualAgentBank = document.getElementById('check-manual-agent')?.checked || false;
  window.updateDocumentPreviews();
};

// =========================================================================
// 7. 실시간 문서 업데이트 브릿지 엔진
// =========================================================================

window.updateDocumentPreviews = function() {
  try {
    ensureTemplatesInjected();
    recalculateFeeAndRate();

    contractState.contractMeta.contractDate = document.getElementById('contract-date')?.value || "";
    contractState.contractMeta.copyCount = document.getElementById('meta-copy-count')?.value || 4;
    contractState.contractMeta.trustPeriod = document.getElementById('meta-trust-period')?.value || "";
    contractState.contractMeta.propertySummary = document.getElementById('meta-property-summary')?.value || "";
    contractState.agentBankName = (document.getElementById('agent-bank-name')?.value || '').trim();

    const rawDate = contractState.contractMeta.contractDate;
    let formattedDateKorean = "        년     월     일";
    if (rawDate) {
      const parts = rawDate.split('-');
      formattedDateKorean = `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
    }

    const isMultiTruster = contractState.trusters.length >= 2;
    const debtor = contractState.debtor;
    const trustee = contractState.trustee;
    const pbs = contractState.priorityBeneficiaries;

    // 1. 표지 (templates-contract.js가 훅을 통해 처리)

    // 2. 고객거래확인서 렌더링
    const indTrusters = contractState.trusters.filter(t => t.type === 'individual');
    const cddIndHtml = (indTrusters.length > 0 ? indTrusters : contractState.trusters).map((t, idx) => {
      const label = contractState.trusters.length > 1 ? `위탁자${contractState.trusters.indexOf(t) + 1} (${t.name || ''})` : `위탁자 (${t.name || ''})`;
      return typeof window.buildIndividualCddHtml === 'function' ? window.buildIndividualCddHtml(t, label, formattedDateKorean, idx > 0) : '';
    }).join('');
    setElHtml('cdd-truster-ind-container', cddIndHtml);

    const corpTrusters = contractState.trusters.filter(t => t.type === 'corporation');
    const cddCorpHtml = (corpTrusters.length > 0 ? corpTrusters : contractState.trusters).map((t, idx) => {
      const label = contractState.trusters.length > 1 ? `위탁자${contractState.trusters.indexOf(t) + 1} (${t.name || ''})` : `위탁자 (${t.name || ''})`;
      return typeof window.buildCorpCddHtml === 'function' ? window.buildCorpCddHtml(t, label, false, formattedDateKorean, idx > 0) : '';
    }).join('');
    setElHtml('cdd-truster-corp-container', cddCorpHtml);

    const cddPbHtml = pbs.map((pb, idx) => {
      const label = `${pb.rank || ''} 우선수익자${pbs.length > 1 ? ' ' + (idx + 1) : ''} (${pb.name || ''})`;
      return typeof window.buildCorpCddHtml === 'function' ? window.buildCorpCddHtml(pb, label, true, formattedDateKorean, idx > 0) : '';
    }).join('');
    setElHtml('cdd-pb-container', cddPbHtml);

    // 3. 실제소유자확인서 렌더링
    const boTrusterHtml = (corpTrusters.length > 0 ? corpTrusters : contractState.trusters).map((t, idx) => {
      const label = contractState.trusters.length > 1 ? `위탁자${contractState.trusters.indexOf(t) + 1} (${t.name || ''})` : `위탁자 (${t.name || ''})`;
      return typeof window.buildBeneficialOwnerHtml === 'function' ? window.buildBeneficialOwnerHtml(t, label, false, formattedDateKorean, idx > 0) : '';
    }).join('');
    setElHtml('bo-truster-container', boTrusterHtml);

    const boPbHtml = pbs.map((pb, idx) => {
      const label = `${pb.rank || ''} 우선수익자${pbs.length > 1 ? ' ' + (idx + 1) : ''} (${pb.name || ''})`;
      return typeof window.buildBeneficialOwnerHtml === 'function' ? window.buildBeneficialOwnerHtml(pb, label, true, formattedDateKorean, idx > 0) : '';
    }).join('');
    setElHtml('bo-pb-container', boPbHtml);

  } catch (err) {
    console.warn("미리보기 업데이트 오류:", err);
  }
};

// =========================================================================
// 8. 워드 다운로드 및 테이블 등 부수 기능
// =========================================================================

function buildWordDocumentHtml(bodyInnerHtml, title = "신탁서류") {
  return `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 20mm 15mm 20mm 15mm; mso-page-orientation: portrait; }
        body { font-family: 'Batang', 'Noto Serif KR', serif; font-size: 10pt; line-height: 1.6; color: #000000; }
        h1 { font-size: 18pt; text-align: center; margin-bottom: 20pt; font-weight: bold; }
        h2 { font-size: 14pt; margin-top: 14pt; margin-bottom: 6pt; font-weight: bold; }
        h3 { font-size: 12pt; margin-top: 12pt; margin-bottom: 4pt; font-weight: bold; }
        h4 { font-size: 10.5pt; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; border: 1.5pt solid #000000; margin: 8pt 0; }
        th, td { border: 0.75pt solid #000000; padding: 4.5pt 6pt; font-size: 9.5pt; vertical-align: middle; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        p { margin: 3pt 0; font-size: 9.5pt; text-align: justify; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .page-break { page-break-before: always; mso-special-character: line-break; }
      </style>
    </head>
    <body>${bodyInnerHtml}</body>
    </html>
  `;
}

function saveBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}

window.downloadCurrentDocAsDocx = function() {
  ensureTemplatesInjected();
  window.updateDocumentPreviews();
  const activePaper = document.querySelector('.doc-paper:not(.hidden)');
  if (!activePaper) return;
  const subtabKey = currentDocSubTab;
  let filename = "담보신탁계약서";
  if (subtabKey === 'doc2-1') filename = "고객거래확인서_위탁자개인용";
  else if (subtabKey === 'doc2-2') filename = "고객거래확인서_위탁자법인용";
  else if (subtabKey === 'doc2-3') filename = "고객거래확인서_우선수익자용";
  else if (subtabKey === 'doc3-1') filename = "실제소유자확인서_위탁자법인용";
  else if (subtabKey === 'doc3-2') filename = "실제소유자확인서_우선수익자용";

  const clone = activePaper.cloneNode(true);
  clone.querySelectorAll('.no-print').forEach(el => el.remove());
  const wordHtml = buildWordDocumentHtml(clone.innerHTML, filename);

  if (typeof htmlDocx !== 'undefined') {
    try {
      saveBlobFile(htmlDocx.asBlob(wordHtml), `${filename}.docx`);
      showToast(`${filename}.docx 다운로드 완료!`);
      return;
    } catch (e) {}
  }
  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveBlobFile(blob, `${filename}.docx`);
  showToast(`${filename}.docx 다운로드 완료!`);
};

window.downloadAllDocsAsDocx = function() {
  ensureTemplatesInjected();
  window.updateDocumentPreviews();
  const docs = ['doc-view-1', 'doc-view-2-1', 'doc-view-2-2', 'doc-view-2-3', 'doc-view-3-1', 'doc-view-3-2'];
  let combinedInnerHtml = "";
  docs.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('.no-print').forEach(n => n.remove());
      if (idx > 0) combinedInnerHtml += `<div class="page-break" style="page-break-before: always; mso-special-character: line-break;"></div>`;
      combinedInnerHtml += clone.innerHTML;
    }
  });
  
  const rawDate = contractState.contractMeta.contractDate;
  const dateStr = rawDate ? rawDate.replace(/-/g, '') : '초안';
  const filename = `신탁서류3종_통합본_${dateStr}.docx`;
  const fullHtml = buildWordDocumentHtml(combinedInnerHtml, "신탁서류3종 통합본");

  if (typeof htmlDocx !== 'undefined') {
    try {
      saveBlobFile(htmlDocx.asBlob(fullHtml), filename);
      showToast(`서류 전체 .docx 다운로드 완료!`);
      return;
    } catch(e) {}
  }
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveBlobFile(blob, filename);
  showToast(`서류 전체 .docx 다운로드 완료!`);
};

function renderVendorTables() {
  const tbody = document.getElementById('vendor-main-tbody');
  const dashTbody = document.getElementById('dashboard-vendor-tbody');
  if (!tbody || !dashTbody) return;
  tbody.innerHTML = '';
  dashTbody.innerHTML = '';

  vendorDatabase.forEach(v => {
    tbody.innerHTML += `
      <tr class="hover:bg-slate-800/40">
        <td class="p-4 font-mono text-cyan-400">${v.id || ''}</td>
        <td class="p-4 font-bold text-white">${v.companyName || ''}</td>
        <td class="p-4">${v.representative || ''}</td>
        <td class="p-4 font-mono">${v.corpRegNo || ''}</td>
        <td class="p-4 font-mono">${v.bizNo || '-'}</td>
        <td class="p-4 truncate max-w-xs">${v.address || ''}</td>
        <td class="p-4 text-center space-x-1">
          <button type="button" onclick="window.quickAssignFromDB('${v.id}', 'truster')" class="px-2 py-1 bg-blue-600/30 text-blue-300 rounded hover:bg-blue-600 hover:text-white">위탁자</button>
          <button type="button" onclick="window.quickAssignFromDB('${v.id}', 'debtor')" class="px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded hover:bg-indigo-600 hover:text-white">채무자</button>
          <button type="button" onclick="window.quickAssignFromDB('${v.id}', 'pb')" class="px-2 py-1 bg-amber-600/30 text-amber-300 rounded hover:bg-amber-600 hover:text-white">우선수익자</button>
        </td>
        <td class="p-4 text-right">
          <button type="button" onclick="window.deleteVendor('${v.id}')" class="text-slate-500 hover:text-rose-400"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  });

  vendorDatabase.slice(0, 5).forEach(v => {
    dashTbody.innerHTML += `
      <tr class="hover:bg-slate-900/60">
        <td class="p-3 font-mono text-cyan-400">${v.id || ''}</td>
        <td class="p-3 font-bold text-white">${v.companyName || ''}</td>
        <td class="p-3">${v.representative || ''}</td>
        <td class="p-3 font-mono">${v.corpRegNo || ''}</td>
        <td class="p-3 truncate max-w-xs">${v.address || ''}</td>
        <td class="p-3 text-right space-x-1">
          <button type="button" onclick="window.quickAssignFromDB('${v.id}', 'truster')" class="text-[11px] px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded">위탁</button>
          <button type="button" onclick="window.quickAssignFromDB('${v.id}', 'debtor')" class="text-[11px] px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded">채무</button>
          <button type="button" onclick="window.quickAssignFromDB('${v.id}', 'pb')" class="text-[11px] px-2 py-0.5 bg-amber-600/30 text-amber-300 rounded">우선</button>
        </td>
      </tr>
    `;
  });

  saveVendorDatabaseToStorage();
}

window.quickAssignFromDB = function(id, role) {
  const v = vendorDatabase.find(item => item.id === id);
  if (!v) return;
  if (role === 'truster') applyVendorToTruster(0, v);
  else if (role === 'debtor') applyVendorToDebtor(v);
  else if (role === 'pb') applyVendorToPB(0, v);
  window.switchTab('generator');
};

window.filterVendorTable = function() {
  const q = (document.getElementById('db-search-input')?.value || '').toLowerCase();
  document.querySelectorAll('#vendor-main-tbody tr').forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
};

window.deleteVendor = function(id) {
  if (!confirm("거래처를 삭제하시겠습니까?")) return;
  vendorDatabase = vendorDatabase.filter(v => v.id !== id);
  renderVendorTables();
  showToast('삭제되었습니다.');
};

window.openAddVendorModal = function() { document.getElementById('add-vendor-modal')?.classList.remove('hidden'); };
window.closeAddVendorModal = function() { document.getElementById('add-vendor-modal')?.classList.add('hidden'); };

window.submitManualVendor = function() {
  const comp = (document.getElementById('modal-company')?.value || '').trim();
  const rep = (document.getElementById('modal-rep')?.value || '').trim();
  const no = (document.getElementById('modal-corpno')?.value || '').trim();
  const addr = (document.getElementById('modal-address')?.value || '').trim();
  if (!comp) return;

  vendorDatabase.unshift({
    id: `VND-2026-${String(vendorDatabase.length + 1).padStart(3, '0')}`,
    companyName: comp, representative: rep, corpRegNo: no, address: addr, bizNo: 'N/A', type: "corporation", ceoName: `대표이사 ${rep}`, source: '수동 등록'
  });
  saveVendorDatabaseToStorage();
  renderVendorTables();
  window.closeAddVendorModal();
  showToast('신규 거래처 등록 완료!');
};

function showToast(msg) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'pointer-events-auto bg-slate-900 text-white text-xs px-4 py-3 rounded-xl border border-cyan-500/50 shadow-2xl flex items-center gap-2';
  t.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

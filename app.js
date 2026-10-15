const FAILOVER_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3-flash"];

// 한국어 조사 자동 처리 헬퍼
function getJosa(word, josaType) {
  if (!word) return "";
  const trimmed = word.trim();
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

// 기본 거래처 마스터 DB
const DEFAULT_SEED_VENDORS = [
  {
    id: "VND-2026-001",
    companyName: "(주)한국개발신탁파트너스",
    representative: "홍길동",
    corpRegNo: "110111-1234567",
    bizNo: "123-81-45678",
    address: "서울특별시 강남구 테헤란로 100",
    bizType: "부동산업 / 신탁 및 자산관리",
    type: "corporation",
    ceoName: "대표이사 홍길동",
    source: "기본 마스터"
  },
  {
    id: "VND-2026-002",
    companyName: "(주)대한종합건설",
    representative: "김철수",
    corpRegNo: "110111-2345678",
    bizNo: "214-82-65432",
    address: "서울특별시 서초구 서초대로 200",
    bizType: "건설업 / 토목건축",
    type: "corporation",
    ceoName: "대표이사 김철수",
    source: "기본 마스터"
  },
  {
    id: "VND-2026-003",
    companyName: "(주)우리금융은행",
    representative: "이대표",
    corpRegNo: "110111-3456789",
    bizNo: "101-81-99887",
    address: "서울특별시 중구 소공로 51",
    bizType: "금융업 / 은행",
    type: "corporation",
    ceoName: "은행장 이대표",
    source: "기본 마스터"
  },
  {
    id: "VND-2026-004",
    companyName: "(주)하나저축은행",
    representative: "박금융",
    corpRegNo: "110111-4567890",
    bizNo: "116-81-33221",
    address: "서울특별시 영등포구 여의대로 66",
    bizType: "금융업 / 상호저축은행",
    type: "corporation",
    ceoName: "대표이사 박금융",
    source: "기본 마스터"
  }
];

let vendorDatabase = [];
let isAdminAuthenticated = false;
let currentUploadedFile = null;
let cachedFileBase64 = null;
let cachedMimeType = null;
let currentDocSubTab = "doc1";

let contractState = {
  trusters: [
    {
      id: "T1",
      type: "corporation",
      name: "(주)한국개발신탁파트너스",
      idNumber: "110111-1234567",
      ceoName: "대표이사 홍길동",
      address: "서울특별시 강남구 테헤란로 100",
      isDebtor: false,
      isRepresentative: true,
      shareRatio: "100"
    }
  ],
  debtor: {
    isSameAsTruster: false,
    type: "corporation",
    name: "(주)대한종합건설",
    idNumber: "110111-2345678",
    ceoName: "대표이사 김철수",
    address: "서울특별시 서초구 서초대로 200",
    bizNo: "214-82-65432"
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
      name: "(주)우리금융은행",
      corpNumber: "110111-3456789",
      ceoName: "은행장 이대표",
      address: "서울특별시 중구 소공로 51",
      loanAgreementDate: "2026.04.09.",
      limitAmount: "\\3,000,000,000-"
    }
  ],
  agentBankName: "",
  hasManualAgentBank: false,
  contractMeta: {
    copyCount: 4,
    contractDate: "2026-04-09",
    feeRate: "0.2%",
    feeAmountKor: "금 일천오백만원정",
    feeAmountNum: "\\ 15,000,000-",
    trustPeriod: "24개월",
    propertySummary: "서울특별시 강남구 테헤란로 100 대 850㎡ 및 지상 철근콘크리트 평슬래브 5층 근린생활시설"
  }
};

function getStoredApiKey() {
  return (localStorage.getItem('gemini_ocr_api_key') || '').trim();
}

function loadPersistentVendorDatabase() {
  const saved = localStorage.getItem('trust_vendor_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        vendorDatabase = parsed;
        updateNativeDatalist();
        return;
      }
    } catch (e) {}
  }
  vendorDatabase = JSON.parse(JSON.stringify(DEFAULT_SEED_VENDORS));
  saveVendorDatabaseToStorage();
}

function saveVendorDatabaseToStorage() {
  localStorage.setItem('trust_vendor_db', JSON.stringify(vendorDatabase));
  const count = vendorDatabase.length;
  const statEl = document.getElementById('stat-total-vendors');
  if (statEl) statEl.textContent = count;
  const b = document.getElementById('db-count-badge');
  if (b) b.textContent = count;
  updateNativeDatalist();
}

function updateNativeDatalist() {
  const dl = document.getElementById('vendor-master-datalist');
  if (!dl) return;
  dl.innerHTML = vendorDatabase.map(v => `<option value="${v.companyName}">${v.representative} | ${v.corpRegNo}</option>`).join('');
}

function resetVendorDBToDefault() {
  if (!confirm("거래처 DB를 기본 마스터 데이터로 초기화하시겠습니까?")) return;
  vendorDatabase = JSON.parse(JSON.stringify(DEFAULT_SEED_VENDORS));
  saveVendorDatabaseToStorage();
  renderVendorTables();
  showToast('거래처 DB가 기본 마스터로 초기화되었습니다.');
}

window.onload = function() {
  // 1) templates.js의 법률 서식 HTML을 #print-area에 주입
  if (typeof injectDocumentTemplates === 'function') {
    injectDocumentTemplates();
  }

  // 2) API Key 복원
  const key = getStoredApiKey();
  const apiKeyInput = document.getElementById('gemini-api-key');
  if (apiKeyInput && key) apiKeyInput.value = key;
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', function() {
      localStorage.setItem('gemini_ocr_api_key', this.value.trim());
      refreshApiKeyStatusUI();
    });
  }

  // 3) DB 로드 및 UI 초기화
  loadPersistentVendorDatabase();
  renderVendorTables();
  setupFileUploadListeners();
  setupGlobalClickOutside();
  syncDebtorInputsFromState();

  renderTrusterUI();
  renderPriorityBeneficiaryUI();
  refreshApiKeyStatusUI();
  updateDocumentPreviews();
};

function refreshApiKeyStatusUI() {
  const key = getStoredApiKey();
  const dot = document.getElementById('api-status-dot');
  const badge = document.getElementById('active-model-name-badge');

  if (key && key.length > 5) {
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2';
    if (badge) {
      badge.className = 'text-emerald-400 ml-1 font-mono font-bold';
      badge.textContent = FAILOVER_MODELS[0];
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

// =========================================================================
// 실시간 자동완성 & 원클릭 자동채움
// =========================================================================

function getFilteredVendors(query, showAll = false) {
  if (showAll || !query || !query.trim()) return vendorDatabase;
  const q = query.trim().toLowerCase();
  return vendorDatabase.filter(v =>
    (v.companyName && v.companyName.toLowerCase().includes(q)) ||
    (v.representative && v.representative.toLowerCase().includes(q)) ||
    (v.corpRegNo && v.corpRegNo.toLowerCase().includes(q)) ||
    (v.address && v.address.toLowerCase().includes(q))
  );
}

function closeAllAutocompletes() {
  document.querySelectorAll('.custom-autocomplete-popup').forEach(el => el.classList.add('hidden'));
  document.getElementById('debtor-autocomplete')?.classList.add('hidden');
}

function setupGlobalClickOutside() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper') && !e.target.closest('#debtor-name-wrapper')) {
      closeAllAutocompletes();
    }
  });
}

function openTrusterDropdown(index, showAll = false) {
  closeAllAutocompletes();
  const input = document.getElementById(`truster-name-${index}`);
  const dropdown = document.getElementById(`truster-autocomplete-${index}`);
  if (!dropdown) return;
  const list = getFilteredVendors(input ? input.value : '', showAll);
  renderDropdownItems(dropdown, list, (vendor) => applyVendorToTruster(index, vendor));
  dropdown.classList.remove('hidden');
}

function handleTrusterTyping(index, val) {
  contractState.trusters[index].name = val;
  const exactMatch = vendorDatabase.find(v => v.companyName === val.trim());
  if (exactMatch) { applyVendorToTruster(index, exactMatch); return; }
  openTrusterDropdown(index, false);
  updateDocumentPreviews();
}

function applyVendorToTruster(index, v) {
  const t = contractState.trusters[index];
  t.name = v.companyName;
  t.idNumber = v.corpRegNo;
  t.address = v.address;
  t.type = v.type || 'corporation';
  t.ceoName = v.ceoName || (t.type === 'corporation' ? `대표이사 ${v.representative}` : '');
  closeAllAutocompletes();
  renderTrusterUI();
  updateDocumentPreviews();
  showToast(`위탁자${index + 1}에 [${v.companyName}] 정보가 자동 채움되었습니다.`);
}

function openDebtorDropdown(showAll = false) {
  closeAllAutocompletes();
  const input = document.getElementById('debtor-name');
  const dropdown = document.getElementById('debtor-autocomplete');
  if (!dropdown) return;
  const list = getFilteredVendors(input ? input.value : '', showAll);
  renderDropdownItems(dropdown, list, (vendor) => applyVendorToDebtor(vendor));
  dropdown.classList.remove('hidden');
}

function handleDebtorTyping(val) {
  contractState.debtor.name = val;
  const exactMatch = vendorDatabase.find(v => v.companyName === val.trim());
  if (exactMatch) { applyVendorToDebtor(exactMatch); return; }
  openDebtorDropdown(false);
  updateDocumentPreviews();
}

function applyVendorToDebtor(v) {
  contractState.debtor.name = v.companyName;
  contractState.debtor.idNumber = v.corpRegNo;
  contractState.debtor.address = v.address;
  contractState.debtor.type = v.type || 'corporation';
  contractState.debtor.ceoName = v.ceoName || (contractState.debtor.type === 'corporation' ? `대표이사 ${v.representative}` : '');
  contractState.debtor.bizNo = v.bizNo || '';
  syncDebtorInputsFromState();
  closeAllAutocompletes();
  updateDocumentPreviews();
  showToast(`채무자에 [${v.companyName}] 정보가 자동 채움되었습니다.`);
}

function syncDebtorInputsFromState() {
  const d = contractState.debtor;
  if (document.getElementById('debtor-name')) document.getElementById('debtor-name').value = d.name || '';
  if (document.getElementById('debtor-idNumber')) document.getElementById('debtor-idNumber').value = d.idNumber || '';
  if (document.getElementById('debtor-ceoName')) document.getElementById('debtor-ceoName').value = d.ceoName || '';
  if (document.getElementById('debtor-type')) document.getElementById('debtor-type').value = d.type || 'corporation';
  if (document.getElementById('debtor-address')) document.getElementById('debtor-address').value = d.address || '';
}

function handleDebtorManualChange() {
  contractState.debtor.name = document.getElementById('debtor-name').value;
  contractState.debtor.idNumber = document.getElementById('debtor-idNumber').value;
  contractState.debtor.ceoName = document.getElementById('debtor-ceoName').value;
  contractState.debtor.type = document.getElementById('debtor-type').value;
  contractState.debtor.address = document.getElementById('debtor-address').value;
  updateDocumentPreviews();
}

function openPBDropdown(index, showAll = false) {
  closeAllAutocompletes();
  const input = document.getElementById(`pb-name-${index}`);
  const dropdown = document.getElementById(`pb-autocomplete-${index}`);
  if (!dropdown) return;
  const list = getFilteredVendors(input ? input.value : '', showAll);
  renderDropdownItems(dropdown, list, (vendor) => applyVendorToPB(index, vendor));
  dropdown.classList.remove('hidden');
}

function handlePBTyping(index, val) {
  contractState.priorityBeneficiaries[index].name = val;
  const exactMatch = vendorDatabase.find(v => v.companyName === val.trim());
  if (exactMatch) { applyVendorToPB(index, exactMatch); return; }
  openPBDropdown(index, false);
  updateDocumentPreviews();
}

function applyVendorToPB(index, v) {
  const pb = contractState.priorityBeneficiaries[index];
  pb.name = v.companyName;
  pb.corpNumber = v.corpRegNo;
  pb.address = v.address;
  pb.ceoName = v.ceoName || `대표자 ${v.representative}`;
  closeAllAutocompletes();
  renderPriorityBeneficiaryUI();
  updateDocumentPreviews();
  showToast(`우선수익자${index + 1}에 [${v.companyName}] 정보가 자동 채움되었습니다.`);
}

function renderDropdownItems(dropdownEl, list, onSelectCallback) {
  dropdownEl.innerHTML = '';
  if (list.length === 0) {
    dropdownEl.innerHTML = `<div class="p-3 text-center text-xs text-slate-400">일치하는 거래처가 없습니다.</div>`;
    return;
  }
  const header = document.createElement('div');
  header.className = 'px-3 py-1.5 bg-slate-950 text-[10px] text-cyan-400 font-bold flex justify-between items-center';
  header.innerHTML = `<span>거래처 DB 추천 목록 (${list.length}건)</span><span>클릭 시 자동채움</span>`;
  dropdownEl.appendChild(header);

  list.forEach(v => {
    const item = document.createElement('div');
    item.className = 'p-2.5 hover:bg-blue-950/80 cursor-pointer flex items-center justify-between text-xs transition-colors';
    item.onmousedown = (e) => { e.preventDefault(); onSelectCallback(v); };
    item.innerHTML = `
      <div class="truncate pr-2">
        <div class="flex items-center gap-1.5">
          <strong class="text-white font-bold">${v.companyName}</strong>
          <span class="text-[10px] text-slate-400">(${v.representative})</span>
        </div>
        <p class="text-[10px] text-slate-400 font-mono truncate mt-0.5">${v.corpRegNo} | ${v.address}</p>
      </div>
      <span class="shrink-0 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-semibold">자동채움</span>
    `;
    dropdownEl.appendChild(item);
  });
}

// =========================================================================
// 동적 위탁자 & 우선수익자 UI 빌더
// =========================================================================

function renderTrusterUI() {
  const container = document.getElementById('trusters-container');
  const isMulti = contractState.trusters.length >= 2;
  const badge = document.getElementById('badge-multi-truster');
  if (badge) {
    badge.textContent = isMulti ? `다수 위탁자 (${contractState.trusters.length}인)` : '단독 위탁자';
    badge.className = isMulti 
      ? 'text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700 font-bold'
      : 'text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700';
  }

  document.getElementById('meta-copy-count').value = isMulti ? 5 : 4;
  contractState.contractMeta.copyCount = isMulti ? 5 : 4;

  container.innerHTML = '';
  contractState.trusters.forEach((t, index) => {
    const row = document.createElement('div');
    row.className = 'p-3 bg-slate-900/90 rounded-lg border border-slate-700 space-y-2';
    row.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold text-xs text-blue-300">위탁자 ${index + 1} ${t.isRepresentative ? '<span class="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 ml-1">대표위탁자</span>' : ''}</span>
        <div class="flex items-center gap-3">
          <label class="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
            <input type="checkbox" ${t.isDebtor ? 'checked' : ''} onchange="updateTrusterField(${index}, 'isDebtor', this.checked)" class="rounded bg-slate-800 text-blue-500">
            <span>채무자 겸임</span>
          </label>
          ${isMulti ? `
            <label class="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
              <input type="radio" name="rep_truster" ${t.isRepresentative ? 'checked' : ''} onchange="setRepresentativeTruster(${index})" class="text-blue-500">
              <span>대표 지정</span>
            </label>
            <div class="flex items-center gap-1 text-[11px] text-slate-300">
              <span>지분율:</span>
              <input type="text" value="${t.shareRatio || ''}" oninput="updateTrusterField(${index}, 'shareRatio', this.value)" class="w-14 bg-slate-950 border border-slate-700 p-1 rounded text-center text-xs"> %
            </div>
          ` : ''}
          ${contractState.trusters.length > 1 ? `
            <button type="button" onclick="removeTrusterRow(${index})" class="text-slate-400 hover:text-rose-400 text-xs"><i class="fa-solid fa-trash-can"></i></button>
          ` : ''}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div class="relative autocomplete-wrapper">
          <div class="relative flex items-center">
            <input type="text" id="truster-name-${index}" list="vendor-master-datalist" autocomplete="off"
              value="${t.name || ''}"
              onfocus="openTrusterDropdown(${index}, true)"
              oninput="handleTrusterTyping(${index}, this.value)"
              placeholder="업체명/성명 클릭 또는 입력..."
              class="w-full bg-slate-950 border border-blue-500/60 text-white p-2 pr-7 rounded focus:outline-none focus:border-blue-400 font-bold">
            <button type="button" onclick="openTrusterDropdown(${index}, true)" class="absolute right-2 text-blue-400 hover:text-white px-1">
              <i class="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
          </div>
          <div id="truster-autocomplete-${index}" class="custom-autocomplete-popup hidden absolute left-0 right-0 top-full mt-1 bg-slate-900 border-2 border-blue-500 rounded-lg shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-800"></div>
        </div>

        <input type="text" value="${t.idNumber || ''}" oninput="updateTrusterField(${index}, 'idNumber', this.value)" placeholder="법인/주민등록번호" class="bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none font-mono">
        <input type="text" value="${t.ceoName || ''}" oninput="updateTrusterField(${index}, 'ceoName', this.value)" placeholder="대표자 직책/성명 (법인)" class="bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none">
      </div>

      <div class="text-xs">
        <input type="text" value="${t.address || ''}" oninput="updateTrusterField(${index}, 'address', this.value)" placeholder="주소" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none">
      </div>
    `;
    container.appendChild(row);
  });

  checkDebtorSync();
}

function renderPriorityBeneficiaryUI() {
  const container = document.getElementById('pb-container');
  container.innerHTML = '';

  contractState.priorityBeneficiaries.forEach((pb, index) => {
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-900/90 rounded-lg border border-slate-700 space-y-2 text-xs';
    item.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold text-amber-300">우선수익자 ${index + 1} (${pb.rank})</span>
        ${contractState.priorityBeneficiaries.length > 1 ? `
          <button type="button" onclick="removePriorityBeneficiaryRow(${index})" class="text-slate-400 hover:text-rose-400 text-xs"><i class="fa-solid fa-trash-can"></i></button>
        ` : ''}
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="relative autocomplete-wrapper">
          <div class="relative flex items-center">
            <input type="text" id="pb-name-${index}" list="vendor-master-datalist" autocomplete="off"
              value="${pb.name || ''}"
              onfocus="openPBDropdown(${index}, true)"
              oninput="handlePBTyping(${index}, this.value)"
              placeholder="금융기관명 클릭 또는 입력..."
              class="w-full bg-slate-950 border border-amber-500/60 text-white p-2 pr-7 rounded focus:outline-none focus:border-amber-400 font-bold">
            <button type="button" onclick="openPBDropdown(${index}, true)" class="absolute right-2 text-amber-400 hover:text-white px-1">
              <i class="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
          </div>
          <div id="pb-autocomplete-${index}" class="custom-autocomplete-popup hidden absolute left-0 right-0 top-full mt-1 bg-slate-900 border-2 border-amber-500 rounded-lg shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-800"></div>
        </div>

        <input type="text" value="${pb.limitAmount || ''}" oninput="updatePBField(${index}, 'limitAmount', this.value)" placeholder="우선수익권금액" class="bg-slate-950 border border-slate-700 text-amber-300 p-2 rounded font-mono focus:outline-none">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input type="text" value="${pb.corpNumber || ''}" oninput="updatePBField(${index}, 'corpNumber', this.value)" placeholder="법인등록번호" class="bg-slate-950 border border-slate-700 text-white p-2 rounded font-mono">
        <input type="text" value="${pb.ceoName || ''}" oninput="updatePBField(${index}, 'ceoName', this.value)" placeholder="대표자 직책/성명" class="bg-slate-950 border border-slate-700 text-white p-2 rounded">
      </div>
      <input type="text" value="${pb.address || ''}" oninput="updatePBField(${index}, 'address', this.value)" placeholder="주소" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded">
    `;
    container.appendChild(item);
  });

  const autoAgent = contractState.priorityBeneficiaries.length >= 2;
  if (autoAgent && !contractState.agentBankName) {
    contractState.agentBankName = contractState.priorityBeneficiaries[0].name;
    document.getElementById('agent-bank-name').value = contractState.agentBankName;
  }
  document.getElementById('check-manual-agent').checked = autoAgent || contractState.hasManualAgentBank;
}

function addTrusterRow() {
  const idx = contractState.trusters.length + 1;
  contractState.trusters.push({
    id: `T${idx}`, type: "corporation", name: "", idNumber: "", ceoName: "", address: "", isDebtor: false, isRepresentative: false, shareRatio: "50"
  });
  renderTrusterUI();
  updateDocumentPreviews();
}

function removeTrusterRow(index) {
  if (contractState.trusters.length <= 1) return;
  contractState.trusters.splice(index, 1);
  if (!contractState.trusters.some(t => t.isRepresentative)) contractState.trusters[0].isRepresentative = true;
  renderTrusterUI();
  updateDocumentPreviews();
}

function updateTrusterField(index, field, value) {
  contractState.trusters[index][field] = value;
  if (field === 'isDebtor') checkDebtorSync();
  updateDocumentPreviews();
}

function setRepresentativeTruster(index) {
  contractState.trusters.forEach((t, i) => t.isRepresentative = (i === index));
  renderTrusterUI();
  updateDocumentPreviews();
}

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

    debtorBox.classList.add('opacity-40', 'pointer-events-none');
    syncNotice.classList.remove('hidden');
    statusTag.textContent = "위탁자 겸임 연동 중";
    statusTag.className = "text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700";
  } else {
    contractState.debtor.isSameAsTruster = false;
    debtorBox.classList.remove('opacity-40', 'pointer-events-none');
    syncNotice.classList.add('hidden');
    statusTag.textContent = "별도 채무자";
    statusTag.className = "text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700";
  }
  updateDocumentPreviews();
}

function addPriorityBeneficiaryRow() {
  const idx = contractState.priorityBeneficiaries.length + 1;
  contractState.priorityBeneficiaries.push({
    id: `PB${idx}`, rank: `1순위`, name: "", corpNumber: "", ceoName: "", address: "", loanAgreementDate: "2026.04.09.", limitAmount: "\\1,000,000,000-"
  });
  renderPriorityBeneficiaryUI();
  updateDocumentPreviews();
}

function removePriorityBeneficiaryRow(index) {
  if (contractState.priorityBeneficiaries.length <= 1) return;
  contractState.priorityBeneficiaries.splice(index, 1);
  renderPriorityBeneficiaryUI();
  updateDocumentPreviews();
}

function updatePBField(index, field, value) {
  contractState.priorityBeneficiaries[index][field] = value;
  updateDocumentPreviews();
}

function handleAgentBankToggle() {
  contractState.hasManualAgentBank = document.getElementById('check-manual-agent').checked;
  updateDocumentPreviews();
}

// =========================================================================
// 계약서 및 부속서류 실시간 렌더링 엔진
// =========================================================================

function updateDocumentPreviews() {
  contractState.contractMeta.contractDate = document.getElementById('contract-date').value || "2026-04-09";
  contractState.contractMeta.copyCount = document.getElementById('meta-copy-count').value || 4;
  contractState.contractMeta.feeRate = document.getElementById('meta-fee-rate').value || "0.2%";
  contractState.contractMeta.feeAmountKor = document.getElementById('meta-fee-kor').value || "금 일천오백만원정";
  contractState.contractMeta.feeAmountNum = document.getElementById('meta-fee-num').value || "\\ 15,000,000-";
  contractState.contractMeta.trustPeriod = document.getElementById('meta-trust-period').value || "24개월";
  contractState.contractMeta.propertySummary = document.getElementById('meta-property-summary').value || "신탁부동산 표시";
  contractState.agentBankName = document.getElementById('agent-bank-name').value.trim();

  const isMultiTruster = contractState.trusters.length >= 2;
  const hasAgentBank = contractState.priorityBeneficiaries.length >= 2 || 
                       contractState.hasManualAgentBank || 
                       (contractState.agentBankName.length > 0);

  const [year, month, day] = contractState.contractMeta.contractDate.split('-');
  const formattedDateKorean = `${year}년 ${month}월 ${day}일`;

  const debtor = contractState.debtor;
  const trustee = contractState.trustee;
  const pbs = contractState.priorityBeneficiaries;
  const firstPbName = pbs[0]?.name || "우선수익자";

  // 표지
  const coverBox = document.getElementById('cover-parties-box');
  let coverHtml = "";
  if (!isMultiTruster) {
    const t = contractState.trusters[0];
    if (t.isDebtor) {
      coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">위탁자 겸 채무자</span><span class="col-span-2 font-bold text-blue-900">${t.name}</span></div>`;
    } else {
      coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">위탁자</span><span class="col-span-2 font-bold text-blue-900">${t.name}</span></div>`;
      coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">채무자</span><span class="col-span-2 font-bold text-indigo-900">${debtor.name}</span></div>`;
    }
  } else {
    let hasTrusterDebtor = false;
    contractState.trusters.forEach((t, i) => {
      const label = t.isDebtor ? `위탁자${i + 1} 겸 채무자` : `위탁자${i + 1}`;
      if (t.isDebtor) hasTrusterDebtor = true;
      coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">${label}</span><span class="col-span-2 font-bold text-blue-900">${t.name}</span></div>`;
    });
    if (!hasTrusterDebtor) {
      coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">채무자</span><span class="col-span-2 font-bold text-indigo-900">${debtor.name}</span></div>`;
    }
  }
  coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">수탁자</span><span class="col-span-2 font-bold">${trustee.name}</span></div>`;
  pbs.forEach(pb => {
    coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">${pb.rank} 우선수익자</span><span class="col-span-2 font-bold text-amber-900">${pb.name}</span></div>`;
  });
  coverBox.innerHTML = coverHtml;

  // 전문
  const preambleEl = document.getElementById('d1-preamble-text');
  if (!isMultiTruster) {
    const tName = contractState.trusters[0]?.name || "위탁자";
    preambleEl.innerHTML = `<strong>${tName}</strong>(이하 “위탁자”이라 함)은 아래 정의된 신탁부동산을 수탁자인 <strong>한국투자부동산신탁</strong>에 신탁하고 수탁자는 이를 인수함에 있어서, 위탁자, 수탁자 및 수익자의 권리의무를 정하기 위하여 다음과 같이 부동산담보신탁계약(이하 “이 신탁계약”이라 한다)을 체결한다.`;
  } else {
    const n = contractState.trusters.length;
    let pText = "";
    for (let i = 0; i < n - 1; i++) {
      pText += `${contractState.trusters[i].name}(이하 “위탁자${i + 1}”이라 함), `;
    }
    pText = pText.slice(0, -2);
    pText += ` 및 ${contractState.trusters[n - 1].name}(이하 “위탁자${n}”이라 하며, "위탁자1” 내지 “위탁자${n}”을 통칭하여 "위탁자"라 함)는 아래 정의된 신탁부동산을 수탁자인 <strong>한국투자부동산신탁</strong>에 신탁하고 수탁자는 이를 인수함에 있어서, 위탁자, 수탁자 및 수익자의 권리의무를 정하기 위하여 다음과 같이 부동산담보신탁계약(이하 “이 신탁계약”이라 한다)을 체결한다.`;
    preambleEl.innerHTML = pText;
  }

  // 작성 부수 및 날인란
  document.getElementById('d1-copy-count-text').textContent = 
    `이 신탁계약을 증명하기 위해 계약서를 ${contractState.contractMeta.copyCount}부 작성하여 위탁자, 수탁자가 각각 1부씩 보관 및 1부는 신탁등기에 사용하며, 신탁등기용을 제외한 나머지 계약서는 수탁자 천공으로 갈음한다.`;
  document.getElementById('d1-contract-date-display').textContent = formattedDateKorean;

  const sigBox = document.getElementById('d1-signatures-box');
  let sigHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
  contractState.trusters.forEach((t, i) => {
    const label = !isMultiTruster 
      ? (t.isDebtor ? "위탁자 겸 채무자" : "위 탁 자") 
      : (t.isDebtor ? `위탁자${i + 1} 겸 채무자` : `위탁자${i + 1}`);
    sigHtml += `
      <div>
        <div class="font-bold text-blue-900 mb-1">【 ${label} 】</div>
        ${t.type === 'corporation' ? `
          <div>상&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;호 : <span class="font-bold">${t.name}</span></div>
          <div>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : <span>${t.address}</span></div>
          <div>대&nbsp;&nbsp;&nbsp;표&nbsp;&nbsp;&nbsp;자 : <span class="font-bold">${t.ceoName || '대표이사 ' + t.name}</span> &nbsp;&nbsp;(인)</div>
          <div>법인등록번호 : <span>${t.idNumber}</span></div>
        ` : `
          <div>성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명 : <span class="font-bold">${t.name}</span> &nbsp;&nbsp;(인)</div>
          <div>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : <span>${t.address}</span></div>
          <div>등록번호 : <span>${t.idNumber}</span></div>
        `}
      </div>
    `;
  });

  if (!contractState.trusters.some(t => t.isDebtor)) {
    sigHtml += `
      <div>
        <div class="font-bold text-indigo-900 mb-1">【 채 무 자 】</div>
        ${debtor.type === 'corporation' ? `
          <div>상&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;호 : <span class="font-bold">${debtor.name}</span></div>
          <div>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : <span>${debtor.address}</span></div>
          <div>대&nbsp;&nbsp;&nbsp;표&nbsp;&nbsp;&nbsp;자 : <span class="font-bold">${debtor.ceoName || '대표이사 ' + debtor.name}</span> &nbsp;&nbsp;(인)</div>
          <div>법인등록번호 : <span>${debtor.idNumber}</span></div>
        ` : `
          <div>성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명 : <span class="font-bold">${debtor.name}</span> &nbsp;&nbsp;(인)</div>
          <div>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : <span>${debtor.address}</span></div>
          <div>등록번호 : <span>${debtor.idNumber}</span></div>
        `}
      </div>
    `;
  }
  sigHtml += `</div>`;

  sigHtml += `<div class="border-t border-slate-300 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">`;
  sigHtml += `
    <div>
      <div class="font-bold text-slate-900 mb-1">【 수 탁 자 】</div>
      <div>상&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;호 : <span class="font-bold">${trustee.name}</span></div>
      <div>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : <span>${trustee.address}</span></div>
      <div>대&nbsp;&nbsp;&nbsp;표&nbsp;&nbsp;&nbsp;자 : <span class="font-bold">${trustee.ceoName}</span> &nbsp;&nbsp;(인)</div>
      <div>법인등록번호 : <span>${trustee.corpNumber}</span></div>
    </div>
  `;

  pbs.forEach((pb, idx) => {
    sigHtml += `
      <div>
        <div class="font-bold text-amber-900 mb-1">【 ${pb.rank} 우선수익자 ${pbs.length > 1 ? (idx + 1) : ''} 】</div>
        <div>상&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;호 : <span class="font-bold">${pb.name}</span></div>
        <div>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : <span>${pb.address}</span></div>
        <div>대&nbsp;&nbsp;&nbsp;표&nbsp;&nbsp;&nbsp;자 : <span class="font-bold">${pb.ceoName || '대표자'}</span> &nbsp;&nbsp;(인)</div>
        <div>법인등록번호 : <span>${pb.corpNumber}</span></div>
      </div>
    `;
  });
  sigHtml += `</div>`;
  sigBox.innerHTML = sigHtml;

  // 별첨 1
  const annex1Box = document.getElementById('d1-annex1-box');
  if (!isMultiTruster) {
    annex1Box.innerHTML = `
      <p>1. 토지 및 건물 : ${contractState.contractMeta.propertySummary}</p>
      <p class="font-semibold text-right pt-2">(이상 소유자 ${contractState.trusters[0]?.name || ''})</p>
      <p class="text-right font-bold">- 이 상 -</p>
    `;
  } else {
    let a1Html = "";
    contractState.trusters.forEach((t, i) => {
      a1Html += `
        <div class="mb-2">
          <p>【위탁자${i + 1} 소유 부동산】</p>
          <p>${contractState.contractMeta.propertySummary} (지분 비율 ${t.shareRatio || 100}%)</p>
          <p class="font-semibold text-right">- 이상 ${t.name} 소유 -</p>
        </div>
      `;
    });
    a1Html += `<p class="text-right font-bold pt-2">- 이 상 -</p>`;
    annex1Box.innerHTML = a1Html;
  }

  // 별첨 2
  const pbBox = document.getElementById('d1-annex2-pb-box');
  let pbHtml = "";
  pbs.forEach(pb => {
    pbHtml += `
      <table class="doc-table mb-3">
        <tr><th class="w-1/4">순위</th><td colspan="2"><strong>${pb.rank}</strong></td></tr>
        <tr><th>성 명(상 호)</th><td colspan="2" class="font-bold">${pb.name}</td></tr>
        <tr><th>법인등록번호</th><td colspan="2">${pb.corpNumber}</td></tr>
        <tr><th>주&nbsp;&nbsp;&nbsp;&nbsp;소</th><td colspan="2">${pb.address}</td></tr>
        <tr><th>피담보채권</th><td colspan="2">[${debtor.name}]와 [우선수익자] 사이에 [${pb.loanAgreementDate || '대출약정일'}] 체결된 [대출약정서]에 기한 [대출원리금채권 등]</td></tr>
        <tr><th>채무자</th><td colspan="2" class="font-bold">${debtor.name}</td></tr>
        <tr><th>우선수익권금액</th><td colspan="2" class="font-bold text-indigo-900 text-sm">${pb.limitAmount}</td></tr>
      </table>
    `;
  });
  pbBox.innerHTML = pbHtml;

  const trustersBox = document.getElementById('d1-annex2-trusters-box');
  if (!isMultiTruster) {
    const t = contractState.trusters[0];
    trustersBox.innerHTML = `
      <table class="doc-table">
        <tr><th class="w-1/4">상 호(성 명)</th><td class="font-bold">${t.name}</td></tr>
        <tr><th>법인등록번호(생년월일)</th><td>${t.idNumber}</td></tr>
        <tr><th>주&nbsp;&nbsp;&nbsp;&nbsp;소</th><td>${t.address}</td></tr>
      </table>
    `;
  } else {
    let tHtml = "";
    contractState.trusters.forEach((t, i) => {
      tHtml += `
        <div class="mb-3">
          <span class="font-bold text-xs text-blue-900">수익자 ${i + 1}</span>
          <table class="doc-table">
            <tr><th class="w-1/4">상 호(성 명)</th><td class="font-bold">${t.name}</td></tr>
            <tr><th>법인등록번호(생년월일)</th><td>${t.idNumber}</td></tr>
            <tr><th>주&nbsp;&nbsp;&nbsp;&nbsp;소</th><td>${t.address}</td></tr>
          </table>
          <p class="text-[10.5px] text-slate-700 mt-1">※각 수익자의 지분은 신탁한 지분의 비율에 의함 (수익자별 지분율 : ${t.name} ${t.shareRatio || 0} %)</p>
        </div>
      `;
    });
    trustersBox.innerHTML = tHtml;
  }

  document.getElementById('d1-annex2-debtor-box').innerHTML = `
    <table class="doc-table">
      <tr><th class="w-1/4">상 호(성 명)</th><td class="font-bold">${debtor.name}</td></tr>
      <tr><th>법인등록번호(생년월일)</th><td>${debtor.idNumber}</td></tr>
      <tr><th>주&nbsp;&nbsp;&nbsp;&nbsp;소</th><td>${debtor.address}</td></tr>
    </table>
  `;

  // 별첨 3
  document.getElementById('d1-annex3-rate').textContent = contractState.contractMeta.feeRate;
  document.getElementById('d1-annex3-fee').textContent = `${contractState.contractMeta.feeAmountKor}(${contractState.contractMeta.feeAmountNum})`;

  // 별첨 4 특약 동적 생성
  const consentSubject = hasAgentBank ? "대리금융기관" : "우선수익자 전원";
  const agentBankDisplayName = contractState.agentBankName || firstPbName;
  const repTruster = contractState.trusters.find(t => t.isRepresentative) || contractState.trusters[0];
  const repTrusterIdx = contractState.trusters.indexOf(repTruster) + 1;

  let a4Html = `
    <p><strong>제1조 (수익자의 범위)</strong><br>
    ① 신탁특약에서 수익자라 함은 [별첨 2]의 [나. 수익자] 표에 기재된 사람을 말한다. 신탁특약에서 수익자라 함은 신탁특약에서 달리 정함이 없는 한 우선수익자를 포함하지 아니한다.<br>
    ${hasAgentBank ? `② 우선수익자 전원은 본 신탁계약의 체결로써 ${agentBankDisplayName}${getJosa(agentBankDisplayName, '을/를')} 본 계약에 관한 대리금융기관으로 선임하여 본 신탁계약에 관한 우선수익자로서의 일체의 권한을 위 “대리금융기관”에 위임한다.` : ''}
    </p>
    <p><strong>제2조 (우선수익자의 수익권 등)</strong> 우선수익자는 별첨 2의 우선수익권금액 한도 내에서 피담보채권 상당액을 신탁본문 제22조 제1항의 순위에 따라 우선 변제받을 권리를 가진다.</p>
    <p><strong>제3조 (우선수익자가 여럿인 경우의 의사결정 등)</strong> 우선수익자로서의 일반적인 의사결정은 최선순위 우선수익자의 의사에 따른다.</p>
    <p><strong>제4조 (우선수익자 및 수익자의 변경 등)</strong><br>
    ① 신탁본문 제8조 제1항에도 불구하고 우선수익자는 다른 우선수익자 전원에 대한 통지 및 수탁자의 사전 서면 동의가 있는 경우에 한하여 우선수익자를 변경하거나 우선수익권에 대하여 질권을 설정할 수 있다.<br>
    ② 신탁본문 제8조 제2항에도 불구하고 수익자는 다른 수익자 전원 및 <strong>${consentSubject}</strong>의 사전 서면 동의 및 수탁자의 사전 서면 동의가 있는 경우에 한하여 수익자를 변경하거나 수익권에 대하여 질권을 설정할 수 있다.
    </p>
    <p><strong>제5조 (수탁자에 관한 사항)</strong> 수탁자는 채무자의 기한이익 상실 여부 또는 우선수익자의 피담보채권액을 직접 실사할 의무가 없으며, 제출 자료에 기하여 환가·정산 업무를 수행한다.</p>
    <p><strong>제6조 (추가신탁 및 공동담보)</strong> 신탁재산 전부는 우선수익자의 피담보채권 만족 및 신탁보수·비용 회수를 위하여 공동담보로 제공된 것으로 본다.</p>
    <p><strong>제7조 (신탁재산 처분 사유 발생시 점유·사용의 제한)</strong> 처분 사유 발생 시 수탁자는 우선수익자와 협의하여 위탁자의 신탁부동산에 대한 점유·사용 권한을 제한할 수 있다.</p>
    <p><strong>제8조 (위탁자의 신탁재산 처분 등)</strong><br>
    ① 위탁자는 우선수익자에 대한 채무를 변제하기 위하여 필요한 경우 <strong>${consentSubject}</strong> 및 수탁자의 사전 서면 동의를 얻어 신탁부동산의 일부 또는 전부를 처분할 수 있다.<br>
    ③ 제1항에 따라 처분된 신탁부동산의 매수인이 매매대금을 완납하고 그에 대한 소유권이전을 위하여 위탁자가 <strong>${consentSubject}</strong>의 서면 동의를 얻어 신탁해지를 요청하는 경우 수탁자는 신탁계약을 해지하고 위탁자에게 소유권을 귀속시킬 수 있다.<br>
    ④ 제3항의 경우 위탁자가 <strong>${consentSubject}</strong>의 서면 동의를 얻어 수탁자에게 서면 요청하는 경우 수탁자는 매수인과 직접 매매계약을 체결하고 소유권을 직접 이전할 수 있다.
    </p>
  `;

  if (isMultiTruster) {
    a4Html += `
      <div class="p-2.5 bg-blue-50/70 border border-blue-200 rounded my-2">
        <p><strong>제8조의 2 (위탁자가 수인인 경우)</strong><br>
        ① 위탁자 중 일부 또는 지분의 일부에 대한 변동사항은 다른 지분의 권리관계에 영향을 미치지 아니한다.<br>
        ② 위탁자 중 어느 1인에 관하여 본 신탁계약이 무효 또는 취소되는 경우에도 나머지 위탁자와의 관계에서 본 신탁계약은 유효하게 존속한다.<br>
        ③ 위탁자가 수인인 경우 수인의 위탁자는 본 신탁계약상 위탁자의 의무를 연대하여 부담한다.<br>
        ④ 각 수익자는 각 자신이 신탁한 신탁부동산의 지분비율에 의한 돈을 지급받을 수 있다.
        </p>
        <p class="mt-2"><strong>제8조의3 (대표위탁자 선정)</strong><br>
        위탁자들은 자신의 대리인으로 위탁자${repTrusterIdx}인 <strong>${repTruster.name}</strong>${getJosa(repTruster.name, '을/를')} 대표위탁자로 선임하고, 대표위탁자가 위탁자 전원을 대리하여 권한을 행사한다.
        </p>
      </div>
    `;
  }

  a4Html += `
    <p><strong>제9조 ~ 제17조</strong> (임대차보증금, 온비드 공매, 신탁종료, 소송수행, 조세, 세무·회계, 관할합의 및 본문 보완 규정은 표준 신탁특약과 동일함)</p>
    <p class="p-2.5 bg-amber-50 border border-amber-300 rounded font-semibold text-amber-950">
      <strong>제18조 (신탁보수)</strong><br>
      ${!hasAgentBank ? `
        신탁본문 및 신탁특약의 다른 모든 조항에도 불구하고 [별첨3] 담보신탁보수는 1순위 우선수익자인 <strong>${firstPbName}</strong>${getJosa(firstPbName, '이/가')} 신탁등기 접수일까지 수탁자에게 지급하기로 하고, 이 경우 수탁자는 <strong>${firstPbName}</strong>에게 (세금)계산서를 발급하기로 한다.
      ` : `
        신탁본문 및 신탁특약의 다른 모든 조항에도 불구하고 [별첨3] 담보신탁보수는 대리금융기관인 <strong>${agentBankDisplayName}</strong>${getJosa(agentBankDisplayName, '이/가')} 신탁등기 접수일까지 수탁자에게 지급하기로 하고, 이 경우 수탁자는 대리금융기관인 <strong>${agentBankDisplayName}</strong>에게 (세금)계산서를 발급하기로 한다.
      `}
    </p>
    <p><strong>제19조 (신탁기간)</strong><br>
    신탁본문 제3조에도 불구하고 본 신탁계약에 따른 신탁기간은 담보신탁등기일로부터 [<strong>${contractState.contractMeta.trustPeriod}</strong>]까지로 하며, 신탁기간 만료시 우선수익자의 채무가 전액 변제되지 않은 경우, 신탁계약은 종료하지 아니한다.
    </p>
  `;
  document.getElementById('d1-annex4-articles-box').innerHTML = a4Html;

  // 서류 2 & 3 매핑
  const mainTruster = contractState.trusters[0];
  document.getElementById('d2-1-name').textContent = mainTruster.name;
  document.getElementById('d2-1-id').textContent = mainTruster.idNumber;
  document.getElementById('d2-1-addr').textContent = mainTruster.address;
  document.getElementById('d2-1-confirm-name').textContent = mainTruster.name;
  document.getElementById('d2-1-date').textContent = formattedDateKorean;
  document.getElementById('d2-1-sig-name').textContent = mainTruster.name;

  document.getElementById('d2-2-name').textContent = mainTruster.name;
  document.getElementById('d2-2-bizno').textContent = mainTruster.idNumber;
  document.getElementById('d2-2-addr').textContent = mainTruster.address;
  document.getElementById('d2-2-baddr').textContent = mainTruster.address;
  document.getElementById('d2-2-rep').textContent = mainTruster.ceoName || mainTruster.name;
  document.getElementById('d2-2-date').textContent = formattedDateKorean;
  document.getElementById('d2-2-sig-full').textContent = `${mainTruster.name} ${mainTruster.ceoName || '대표이사 ' + mainTruster.name}`;

  const firstPb = pbs[0] || {};
  document.getElementById('d2-3-name').textContent = firstPb.name || '';
  document.getElementById('d2-3-bizno').textContent = firstPb.corpNumber || '';
  document.getElementById('d2-3-addr').textContent = firstPb.address || '';
  document.getElementById('d2-3-rep').textContent = firstPb.ceoName || '대표자';
  document.getElementById('d2-3-date').textContent = formattedDateKorean;
  document.getElementById('d2-3-sig-full').textContent = `${firstPb.name || ''} ${firstPb.ceoName || '대표자'}`;

  document.getElementById('d3-1-name').textContent = mainTruster.name;
  document.getElementById('d3-1-bizno').textContent = mainTruster.idNumber;
  document.getElementById('d3-1-owner-name').textContent = mainTruster.ceoName ? mainTruster.ceoName.replace(/.*대표이사\s*/, '') : mainTruster.name;
  document.getElementById('d3-1-owner-share').textContent = mainTruster.shareRatio ? `${mainTruster.shareRatio}%` : "100%";
  document.getElementById('d3-1-author-name').textContent = mainTruster.ceoName || mainTruster.name;
  document.getElementById('d3-1-author-comp').textContent = mainTruster.name;
  document.getElementById('d3-1-date').textContent = formattedDateKorean;
  document.getElementById('d3-1-sig-full').textContent = `${mainTruster.name} ${mainTruster.ceoName || '대표이사'}`;

  document.getElementById('d3-2-name').textContent = firstPb.name || '';
  document.getElementById('d3-2-bizno').textContent = firstPb.corpNumber || '';
  document.getElementById('d3-2-author-name').textContent = firstPb.ceoName || '대표자';
  document.getElementById('d3-2-author-comp').textContent = firstPb.name || '';
  document.getElementById('d3-2-date').textContent = formattedDateKorean;
  document.getElementById('d3-2-sig-full').textContent = `${firstPb.name || ''} ${firstPb.ceoName || '대표자'}`;
}

function switchDocSubTab(docId) {
  currentDocSubTab = docId;
  document.querySelectorAll('.doc-paper').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.doc-subtab').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-slate-900', 'text-slate-400');
  });
  const activeView = document.getElementById(`doc-view-${docId.replace('doc', '')}`);
  const activeBtn = document.getElementById(`subtab-${docId}`);
  if (activeView) activeView.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-blue-600', 'text-white');
    activeBtn.classList.remove('bg-slate-900', 'text-slate-400');
  }
}

// =========================================================================
// WORD (.docx) 다운로드 엔진
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

function downloadCurrentDocAsDocx() {
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
}

function downloadAllDocsAsDocx() {
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
  const filename = `신탁서류3종_통합본_${document.getElementById('contract-date').value}.docx`;
  const fullHtml = buildWordDocumentHtml(combinedInnerHtml, "신탁서류3종 통합본");

  if (typeof htmlDocx !== 'undefined') {
    try {
      saveBlobFile(htmlDocx.asBlob(fullHtml), filename);
      showToast(`서류 3종 전체 .docx 다운로드 완료!`);
      return;
    } catch(e) {}
  }
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveBlobFile(blob, filename);
  showToast(`서류 3종 전체 .docx 다운로드 완료!`);
}

// =========================================================================
// 탭 전환, OCR, 거래처 DB 관리
// =========================================================================
function switchTab(tabId) {
  if (tabId === 'settings' && !isAdminAuthenticated) {
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('admin-auth-error').classList.add('hidden');
    document.getElementById('admin-auth-modal').classList.remove('hidden');
    return;
  }
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

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
  if (tabId === 'generator') updateDocumentPreviews();
  if (tabId === 'settings') refreshApiKeyStatusUI();
}

function verifyAdminPassword() {
  const input = document.getElementById('admin-pw-input').value;
  const pwd = localStorage.getItem('admin_system_pw') || 'admin123';
  if (input === pwd) {
    isAdminAuthenticated = true;
    document.getElementById('admin-auth-modal').classList.add('hidden');
    showToast('관리자 인증 완료');
    switchTab('settings');
  } else {
    document.getElementById('admin-auth-error').classList.remove('hidden');
  }
}

function cancelAdminAuth() { document.getElementById('admin-auth-modal').classList.add('hidden'); }
function lockAdminSettings() { isAdminAuthenticated = false; switchTab('dashboard'); showToast('로그아웃 되었습니다.'); }

function changeAdminPassword() {
  const newPw = document.getElementById('new-admin-pw').value;
  const confirmPw = document.getElementById('confirm-admin-pw').value;
  if (!newPw || newPw !== confirmPw) { showToast('비밀번호가 일치하지 않습니다.'); return; }
  localStorage.setItem('admin_system_pw', newPw);
  showToast('비밀번호가 변경되었습니다.');
}

function saveAdminApiKey() {
  const k = document.getElementById('gemini-api-key').value.trim();
  if (!k) return;
  localStorage.setItem('gemini_ocr_api_key', k);
  refreshApiKeyStatusUI();
  showToast('API Key가 영구 저장되었습니다.');
}

async function testGoogleAPIConnection() {
  const key = getStoredApiKey() || document.getElementById('gemini-api-key').value.trim();
  if (!key) { showToast('저장된 API Key가 없습니다.'); return; }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${FAILOVER_MODELS[0]}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
    });
    if (res.ok) { showToast('API Key 정상 연결 확인!'); refreshApiKeyStatusUI(); }
    else { showToast(`연결 오류: HTTP ${res.status}`); }
  } catch(e) { showToast(`네트워크 오류`); }
}

function appendDiagnosticLog(msg, type = 'info') {
  const terminal = document.getElementById('diagnostic-terminal');
  if (!terminal) return;
  const div = document.createElement('div');
  div.className = type === 'success' ? 'text-emerald-400 font-semibold' : (type === 'error' ? 'text-rose-400' : 'text-slate-400');
  div.textContent = `[${new Date().toTimeString().split(' ')[0]}] ${msg}`;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

function clearDiagnosticLog() { document.getElementById('diagnostic-terminal').innerHTML = ''; }

function setupFileUploadListeners() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  if (!dropZone || !fileInput) return;
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
  });
  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) handleSelectedFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleSelectedFile(e.target.files[0]);
  });
}

async function handleSelectedFile(file) {
  currentUploadedFile = file;
  document.getElementById('file-preview-card').classList.remove('hidden');
  document.getElementById('preview-filename').textContent = file.name;
  document.getElementById('preview-file-size').textContent = (file.size / 1024).toFixed(1) + ' KB';
  appendDiagnosticLog(`파일 로드: ${file.name}`);
  const reader = new FileReader();
  reader.onload = async () => {
    cachedFileBase64 = reader.result.split(',')[1];
    cachedMimeType = file.type || 'application/pdf';
    executeHighPrecisionOCR();
  };
  reader.readAsDataURL(file);
}

async function executeHighPrecisionOCR() {
  if (!cachedFileBase64) return;
  const key = getStoredApiKey();
  if (!key) { showToast('설정 탭에서 API Key를 먼저 등록해 주세요.'); return; }
  const pBar = document.getElementById('ocr-progress-bar');
  const badge = document.getElementById('ocr-status-badge');
  pBar.classList.remove('hidden');
  badge.textContent = '분석 중...';

  const promptText = `대한민국 사업자등록증 및 등기부등본의 다음 6가지 정보를 JSON으로만 반환하세요:
{"companyName":"","representative":"","corpRegNo":"","address":"","bizNo":"","bizType":""}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${FAILOVER_MODELS[0]}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: cachedMimeType, data: cachedFileBase64 } }, { text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    document.getElementById('ocr-company-name').value = parsed.companyName || '';
    document.getElementById('ocr-representative').value = parsed.representative || '';
    document.getElementById('ocr-corp-no').value = parsed.corpRegNo || '';
    document.getElementById('ocr-address').value = parsed.address || '';
    document.getElementById('ocr-biz-no').value = parsed.bizNo || '';
    document.getElementById('ocr-biz-type').value = parsed.bizType || '';
    badge.textContent = '완료';
    appendDiagnosticLog(`[성공] ${parsed.companyName}`, 'success');
    showToast('추출 완료!');
  } catch (err) {
    badge.textContent = '실패';
    appendDiagnosticLog(`오류: ${err.message}`, 'error');
  } finally {
    pBar.classList.add('hidden');
  }
}

function saveExtractedToDB() {
  const comp = document.getElementById('ocr-company-name').value.trim();
  const rep = document.getElementById('ocr-representative').value.trim();
  const corpNo = document.getElementById('ocr-corp-no').value.trim();
  const addr = document.getElementById('ocr-address').value.trim();
  const bizNo = document.getElementById('ocr-biz-no').value.trim();
  const btype = document.getElementById('ocr-biz-type').value.trim();
  if (!comp || !rep) { showToast('필수 정보를 입력해 주세요.'); return; }

  const newVendor = {
    id: `VND-2026-${String(vendorDatabase.length + 1).padStart(3, '0')}`,
    companyName: comp, representative: rep, corpRegNo: corpNo, bizNo: bizNo || 'N/A', address: addr, bizType: btype || '일반업종', type: "corporation", ceoName: `대표이사 ${rep}`, source: 'AI OCR'
  };
  vendorDatabase.unshift(newVendor);
  saveVendorDatabaseToStorage();
  renderVendorTables();
  applyVendorToTruster(0, newVendor);
  showToast(`[${comp}] DB 저장 및 위탁자 자동 지정 완료!`);
}

function clearOCRForm() {
  document.getElementById('ocr-result-form').reset();
  document.getElementById('file-preview-card').classList.add('hidden');
  cachedFileBase64 = null;
}

function renderVendorTables() {
  const tbody = document.getElementById('vendor-main-tbody');
  const dashTbody = document.getElementById('dashboard-vendor-tbody');
  if (!tbody || !dashTbody) return;
  tbody.innerHTML = '';
  dashTbody.innerHTML = '';

  vendorDatabase.forEach(v => {
    tbody.innerHTML += `
      <tr class="hover:bg-slate-800/40">
        <td class="p-4 font-mono text-cyan-400">${v.id}</td>
        <td class="p-4 font-bold text-white">${v.companyName}</td>
        <td class="p-4">${v.representative}</td>
        <td class="p-4 font-mono">${v.corpRegNo}</td>
        <td class="p-4 font-mono">${v.bizNo || '-'}</td>
        <td class="p-4 truncate max-w-xs">${v.address}</td>
        <td class="p-4 text-center space-x-1">
          <button onclick="quickAssignFromDB('${v.id}', 'truster')" class="px-2 py-1 bg-blue-600/30 text-blue-300 rounded hover:bg-blue-600 hover:text-white">위탁자</button>
          <button onclick="quickAssignFromDB('${v.id}', 'debtor')" class="px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded hover:bg-indigo-600 hover:text-white">채무자</button>
          <button onclick="quickAssignFromDB('${v.id}', 'pb')" class="px-2 py-1 bg-amber-600/30 text-amber-300 rounded hover:bg-amber-600 hover:text-white">우선수익자</button>
        </td>
        <td class="p-4 text-right">
          <button onclick="deleteVendor('${v.id}')" class="text-slate-500 hover:text-rose-400"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  });

  vendorDatabase.slice(0, 5).forEach(v => {
    dashTbody.innerHTML += `
      <tr class="hover:bg-slate-900/60">
        <td class="p-3 font-mono text-cyan-400">${v.id}</td>
        <td class="p-3 font-bold text-white">${v.companyName}</td>
        <td class="p-3">${v.representative}</td>
        <td class="p-3 font-mono">${v.corpRegNo}</td>
        <td class="p-3 truncate max-w-xs">${v.address}</td>
        <td class="p-3 text-right space-x-1">
          <button onclick="quickAssignFromDB('${v.id}', 'truster')" class="text-[11px] px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded">위탁</button>
          <button onclick="quickAssignFromDB('${v.id}', 'debtor')" class="text-[11px] px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded">채무</button>
          <button onclick="quickAssignFromDB('${v.id}', 'pb')" class="text-[11px] px-2 py-0.5 bg-amber-600/30 text-amber-300 rounded">우선</button>
        </td>
      </tr>
    `;
  });

  saveVendorDatabaseToStorage();
}

function quickAssignFromDB(id, role) {
  const v = vendorDatabase.find(item => item.id === id);
  if (!v) return;
  if (role === 'truster') applyVendorToTruster(0, v);
  else if (role === 'debtor') applyVendorToDebtor(v);
  else if (role === 'pb') applyVendorToPB(0, v);
  switchTab('generator');
}

function filterVendorTable() {
  const q = document.getElementById('db-search-input').value.toLowerCase();
  document.querySelectorAll('#vendor-main-tbody tr').forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function deleteVendor(id) {
  if (!confirm("거래처를 삭제하시겠습니까?")) return;
  vendorDatabase = vendorDatabase.filter(v => v.id !== id);
  renderVendorTables();
  showToast('삭제되었습니다.');
}

function openAddVendorModal() { document.getElementById('add-vendor-modal').classList.remove('hidden'); }
function closeAddVendorModal() { document.getElementById('add-vendor-modal').classList.add('hidden'); }

function submitManualVendor() {
  const comp = document.getElementById('modal-company').value.trim();
  const rep = document.getElementById('modal-rep').value.trim();
  const no = document.getElementById('modal-corpno').value.trim();
  const addr = document.getElementById('modal-address').value.trim();
  if (!comp) return;

  vendorDatabase.unshift({
    id: `VND-2026-${String(vendorDatabase.length + 1).padStart(3, '0')}`,
    companyName: comp, representative: rep, corpRegNo: no, address: addr, bizNo: 'N/A', type: "corporation", ceoName: `대표이사 ${rep}`, source: '수동 등록'
  });
  saveVendorDatabaseToStorage();
  renderVendorTables();
  closeAddVendorModal();
  showToast('신규 거래처 등록 완료!');
}

function showToast(msg) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'pointer-events-auto bg-slate-900 text-white text-xs px-4 py-3 rounded-xl border border-cyan-500/50 shadow-2xl flex items-center gap-2';
  t.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

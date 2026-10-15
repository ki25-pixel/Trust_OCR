const FAILOVER_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3-flash"];

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

const DEFAULT_SEED_VENDORS = [
  { id: "VND-2026-001", companyName: "(주)한국개발신탁파트너스", representative: "홍길동", corpRegNo: "110111-1234567", bizNo: "123-81-45678", address: "서울특별시 강남구 테헤란로 100", bizType: "부동산업", type: "corporation", ceoName: "대표이사 홍길동", source: "기본 마스터" },
  { id: "VND-2026-002", companyName: "(주)대한종합건설", representative: "김철수", corpRegNo: "110111-2345678", bizNo: "214-82-65432", address: "서울특별시 서초구 서초대로 200", bizType: "건설업", type: "corporation", ceoName: "대표이사 김철수", source: "기본 마스터" },
  { id: "VND-2026-003", companyName: "(주)우리금융은행", representative: "이대표", corpRegNo: "110111-3456789", bizNo: "101-81-99887", address: "서울특별시 중구 소공로 51", bizType: "금융업", type: "corporation", ceoName: "은행장 이대표", source: "기본 마스터" },
  { id: "VND-2026-004", companyName: "이신탁", representative: "이신탁", corpRegNo: "750101-1******", bizNo: "N/A", address: "서울특별시 송파구 올림픽로 88", bizType: "개인", type: "individual", ceoName: "", source: "기본 마스터" }
];

let vendorDatabase = [];
let isAdminAuthenticated = false;
let currentUploadedFile = null;
let cachedFileBase64 = null;
let cachedMimeType = null;
let currentDocSubTab = "doc1";

let contractState = {
  trusters: [
    { id: "T1", type: "corporation", name: "(주)한국개발신탁파트너스", idNumber: "110111-1234567", ceoName: "대표이사 홍길동", address: "서울특별시 강남구 테헤란로 100", isDebtor: false, isRepresentative: true, shareRatio: "100" }
  ],
  debtor: { isSameAsTruster: false, type: "corporation", name: "(주)대한종합건설", idNumber: "110111-2345678", ceoName: "대표이사 김철수", address: "서울특별시 서초구 서초대로 200", bizNo: "214-82-65432" },
  trustee: { name: "한국투자부동산신탁 주식회사", address: "서울특별시 강남구 테헤란로 518, 섬유센터 7층(대치동)", ceoName: "대표이사 이 국 형", corpNumber: "110111-7125720" },
  priorityBeneficiaries: [
    { id: "PB1", rank: "1순위", name: "(주)우리금융은행", corpNumber: "110111-3456789", ceoName: "은행장 이대표", address: "서울특별시 중구 소공로 51", loanAgreementDate: "2026.04.09.", limitAmount: "\\3,000,000,000-" }
  ],
  agentBankName: "",
  hasManualAgentBank: false,
  contractMeta: { copyCount: 4, contractDate: "2026-04-09", feeRate: "0.2%", feeAmountKor: "금 일천오백만원정", feeAmountNum: "\\ 15,000,000-", trustPeriod: "24개월", propertySummary: "서울특별시 강남구 테헤란로 100 대 850㎡ 및 지상 철근콘크리트 평슬래브 5층 근린생활시설" }
};

function getStoredApiKey() { return (localStorage.getItem('gemini_ocr_api_key') || '').trim(); }

function loadPersistentVendorDatabase() {
  const saved = localStorage.getItem('trust_vendor_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) { vendorDatabase = parsed; updateNativeDatalist(); return; }
    } catch (e) {}
  }
  vendorDatabase = JSON.parse(JSON.stringify(DEFAULT_SEED_VENDORS));
  saveVendorDatabaseToStorage();
}

function saveVendorDatabaseToStorage() {
  localStorage.setItem('trust_vendor_db', JSON.stringify(vendorDatabase));
  const count = vendorDatabase.length;
  document.getElementById('stat-total-vendors').textContent = count;
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
  if (typeof injectDocumentTemplates === 'function') injectDocumentTemplates();

  const key = getStoredApiKey();
  const apiKeyInput = document.getElementById('gemini-api-key');
  if (apiKeyInput && key) apiKeyInput.value = key;
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', function() {
      localStorage.setItem('gemini_ocr_api_key', this.value.trim());
      refreshApiKeyStatusUI();
    });
  }

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
    if (badge) { badge.className = 'text-emerald-400 ml-1 font-mono font-bold'; badge.textContent = FAILOVER_MODELS[0]; }
  } else {
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400 mr-2';
    if (badge) { badge.className = 'text-amber-400 ml-1 font-mono font-bold'; badge.textContent = 'Key 미설정'; }
  }
  const input = document.getElementById('gemini-api-key');
  if (input && key) input.value = key;
}

// 자동완성 및 자동채움 로직
function getFilteredVendors(query, showAll = false) {
  if (showAll || !query || !query.trim()) return vendorDatabase;
  const q = query.trim().toLowerCase();
  return vendorDatabase.filter(v => (v.companyName && v.companyName.toLowerCase().includes(q)) || (v.representative && v.representative.toLowerCase().includes(q)) || (v.corpRegNo && v.corpRegNo.toLowerCase().includes(q)));
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
  renderDropdownItems(dropdown, list, (v) => applyVendorToTruster(index, v));
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
  t.name = v.companyName; t.idNumber = v.corpRegNo; t.address = v.address; t.type = v.type || 'corporation'; t.ceoName = v.ceoName || `대표이사 ${v.representative}`;
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
  renderDropdownItems(dropdown, list, (v) => applyVendorToDebtor(v));
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
  contractState.debtor.name = v.companyName; contractState.debtor.idNumber = v.corpRegNo; contractState.debtor.address = v.address; contractState.debtor.type = v.type || 'corporation'; contractState.debtor.ceoName = v.ceoName || `대표이사 ${v.representative}`; contractState.debtor.bizNo = v.bizNo || '';
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
  renderDropdownItems(dropdown, list, (v) => applyVendorToPB(index, v));
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
  pb.name = v.companyName; pb.corpNumber = v.corpRegNo; pb.address = v.address; pb.ceoName = v.ceoName || `대표자 ${v.representative}`;
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

function renderTrusterUI() {
  const container = document.getElementById('trusters-container');
  const isMulti = contractState.trusters.length >= 2;
  const badge = document.getElementById('badge-multi-truster');
  if (badge) {
    badge.textContent = isMulti ? `다수 위탁자 (${contractState.trusters.length}인)` : '단독 위탁자';
    badge.className = isMulti ? 'text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700 font-bold' : 'text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700';
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
              <input type="text" value="${t.shareRatio \vert{}\vert{} ''}" oninput="updateTrusterField(${index}, 'shareRatio', this.value)" class="w-14 bg-slate-950 border border-slate-700 p-1 rounded text-center text-xs"> %
            </div>
          ` : ''}
          ${contractState.trusters.length > 1 ? `
            <button type="button" onclick="removeTrusterRow(${index})" class="text-slate-400 hover:text-rose-400 text-xs ml-1"><i class="fa-solid fa-trash-can"></i></button>
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
        <input type="text" value="${t.ceoName || ''}" oninput="updateTrusterField(${index}, 'ceoName', this.value)" placeholder="대표자 직책/성명" class="bg-slate-950 border border-slate-700 text-white p-2 rounded focus:outline-none">
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
  contractState.trusters.push({ id: `T${contractState.trusters.length + 1}`, type: "corporation", name: "", idNumber: "", ceoName: "", address: "", isDebtor: false, isRepresentative: false, shareRatio: "50" });
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
  } else {
    contractState.debtor.isSameAsTruster = false;
    debtorBox.classList.remove('opacity-40', 'pointer-events-none');
    syncNotice.classList.add('hidden');
    statusTag.textContent = "별도 채무자";
  }
  updateDocumentPreviews();
}

function addPriorityBeneficiaryRow() {
  contractState.priorityBeneficiaries.push({ id: `PB${contractState.priorityBeneficiaries.length + 1}`, rank: `1순위`, name: "", corpNumber: "", ceoName: "", address: "", loanAgreementDate: "2026.04.09.", limitAmount: "\\1,000,000,000-" });
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

// 렌더링 엔진
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
  const hasAgentBank = contractState.priorityBeneficiaries.length >= 2 || contractState.hasManualAgentBank || (contractState.agentBankName.length > 0);
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
    coverHtml += t.isDebtor ? `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">위탁자 겸 채무자</span><span class="col-span-2 font-bold text-blue-900">${t.name}</span></div>` :
      `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">위탁자</span><span class="col-span-2 font-bold text-blue-900">${t.name}</span></div><div class="grid grid-cols-3 p-2.5"><span class="font-bold">채무자</span><span class="col-span-2 font-bold text-indigo-900">${debtor.name}</span></div>`;
  } else {
    contractState.trusters.forEach((t, i) => {
      coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">${t.isDebtor ? `위탁자${i+1} 겸 채무자` : `위탁자${i+1}`}</span><span class="col-span-2 font-bold text-blue-900">${t.name}</span></div>`;
    });
  }
  coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">수탁자</span><span class="col-span-2 font-bold">${trustee.name}</span></div>`;
  pbs.forEach(pb => { coverHtml += `<div class="grid grid-cols-3 p-2.5"><span class="font-bold">${pb.rank} 우선수익자</span><span class="col-span-2 font-bold text-amber-900">${pb.name}</span></div>`; });
  coverBox.innerHTML = coverHtml;

  // 전문
  const preambleEl = document.getElementById('d1-preamble-text');
  if (!isMultiTruster) {
    preambleEl.innerHTML = `<strong>${contractState.trusters[0]?.name || "위탁자"}</strong>(이하 “위탁자”이라 함)은 아래 정의된 신탁부동산을 수탁자인 <strong>한국투자부동산신탁</strong>에 신탁하고 수탁자는 이를 인수함에 있어서, 위탁자, 수탁자 및 수익자의 권리의무를 정하기 위하여 다음과 같이 부동산담보신탁계약(이하 “이 신탁계약”이라 한다)을 체결한다[cite: 3].`;
  } else {
    let pText = "";
    contractState.trusters.forEach((t, i) => { pText += `${t.name}(이하 “위탁자${i+1}”이라 함), `; });
    preambleEl.innerHTML = pText.slice(0, -2) + `는 아래 정의된 신탁부동산을 수탁자인 <strong>한국투자부동산신탁</strong>에 신탁하고 수탁자는 이를 인수함에 있어서, 위탁자, 수탁자 및 수익자의 권리의무를 정하기 위하여 다음과 같이 부동산담보신탁계약을 체결한다[cite: 3].`;
  }

  document.getElementById('d1-copy-count-text').textContent = `이 신탁계약을 증명하기 위해 계약서를 ${contractState.contractMeta.copyCount}부 작성하여 위탁자, 수탁자가 각각 1부씩 보관 및 1부는 신탁등기에 사용하며, 신탁등기용을 제외한 나머지 계약서는 수탁자 천공으로 갈음한다.`;
  document.getElementById('d1-contract-date-display').textContent = formattedDateKorean;

  // 날인란
  const sigBox = document.getElementById('d1-signatures-box');
  let sigHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
  contractState.trusters.forEach((t, i) => {
    sigHtml += `<div><div class="font-bold text-blue-900 mb-1">【 ${t.isDebtor ? `위탁자${i+1} 겸 채무자` : `위 탁 자`} 】</div>상호/성명: <strong>${t.name}</strong><br>주소: ${t.address}<br>등록번호: ${t.idNumber}</div>`;
  });
  if (!contractState.trusters.some(t => t.isDebtor)) {
    sigHtml += `<div><div class="font-bold text-indigo-900 mb-1">【 채 무 자 】</div>상호/성명: <strong>${debtor.name}</strong><br>주소: ${debtor.address}<br>등록번호: ${debtor.idNumber}</div>`;
  }
  sigHtml += `</div><div class="border-t border-slate-300 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">`;
  sigHtml += `<div><div class="font-bold text-slate-900 mb-1">【 수 탁 자 】</div>상호: <strong>${trustee.name}</strong><br>주소: ${trustee.address}</div>`;
  pbs.forEach(pb => { sigHtml += `<div><div class="font-bold text-amber-900 mb-1">【 ${pb.rank} 우선수익자 】</div>상호: <strong>${pb.name}</strong><br>주소: ${pb.address}</div>`; });
  sigHtml += `</div>`;
  sigBox.innerHTML = sigHtml;

  // 별첨 1 ~ 3
  document.getElementById('d1-annex1-box').innerHTML = `<p>1. 토지 및 건물 : ${contractState.contractMeta.propertySummary}</p>`;
  
  const pbBox = document.getElementById('d1-annex2-pb-box');
  pbBox.innerHTML = pbs.map(pb => `<table class="doc-table mb-2"><tr><th>상호</th><td>${pb.name}</td></tr><tr><th>우선수익권금액</th><td>${pb.limitAmount}</td></tr></table>`).join('');
  
  document.getElementById('d1-annex2-trusters-box').innerHTML = `<table class="doc-table"><tr><th>상호/성명</th><td>${contractState.trusters[0].name}</td></tr></table>`;
  document.getElementById('d1-annex2-debtor-box').innerHTML = `<table class="doc-table"><tr><th>상호</th><td>${debtor.name}</td></tr></table>`;
  
  document.getElementById('d1-annex3-rate').textContent = contractState.contractMeta.feeRate;
  document.getElementById('d1-annex3-fee').textContent = `${contractState.contractMeta.feeAmountKor}(${contractState.contractMeta.feeAmountNum})`;

  // 별첨 4 특약
  const consentSubject = hasAgentBank ? "대리금융기관" : "우선수익자 전원";
  const agentBankDisplayName = contractState.agentBankName || firstPbName;
  document.getElementById('d1-annex4-articles-box').innerHTML = `
    <p><strong>제1조 (수익자의 범위)</strong> ① 신탁특약에서 수익자라 함은 [별첨 2]의 [나. 수익자] 표에 기재된 사람을 말한다[cite: 3]. ${hasAgentBank ? `<br>② 우선수익자 전원은 ${agentBankDisplayName}을 대리금융기관으로 선임함.` : ''}</p>
    <p><strong>제4조 (우선수익자 및 수익자의 변경 등)</strong> ② 수익자는 ${consentSubject}의 동의 없이 변경할 수 없다[cite: 3].</p>
    <p class="p-2 bg-amber-50 border border-amber-300 rounded font-semibold text-amber-950"><strong>제18조 (신탁보수)</strong> 담보신탁보수는 ${!hasAgentBank ? firstPbName : agentBankDisplayName}이 신탁등기 접수일까지 수탁자에게 지급하기로 함.</p>
    <p><strong>제19조 (신탁기간)</strong> 본 계약의 신탁기간은 [<strong>${contractState.contractMeta.trustPeriod}</strong>]로 함[cite: 3].</p>
  `;

  // 고객거래 및 실소유자 확인서 매핑
  document.getElementById('d2-1-name').textContent = mainTruster.name;
  document.getElementById('d2-1-addr').textContent = mainTruster.address;
  document.getElementById('d2-1-date').textContent = formattedDateKorean;
  document.getElementById('d2-1-sig-name').textContent = mainTruster.name;

  document.getElementById('d2-2-name').textContent = mainTruster.name;
  document.getElementById('d2-2-addr').textContent = mainTruster.address;
  document.getElementById('d2-2-rep').textContent = mainTruster.ceoName || mainTruster.name;
  document.getElementById('d2-2-date').textContent = formattedDateKorean;
  document.getElementById('d2-2-sig-full').textContent = `${mainTruster.name} 대표이사`;

  document.getElementById('d2-3-name').textContent = firstPb.name || '';
  document.getElementById('d2-3-addr').textContent = firstPb.address || '';
  document.getElementById('d2-3-rep').textContent = firstPb.ceoName || '';
  document.getElementById('d2-3-date').textContent = formattedDateKorean;
  document.getElementById('d2-3-sig-full').textContent = `${firstPb.name || ''} 대표자`;

  document.getElementById('d3-1-name').textContent = mainTruster.name;
  document.getElementById('d3-1-owner-name').textContent = mainTruster.representative || '';
  document.getElementById('d3-1-author-name').textContent = mainTruster.representative || '';
  document.getElementById('d3-1-author-comp').textContent = mainTruster.name;
  document.getElementById('d3-1-date').textContent = formattedDateKorean;
  document.getElementById('d3-1-sig-full').textContent = `${mainTruster.name} 대표이사`;

  document.getElementById('d3-2-name').textContent = firstPb.name || '';
  document.getElementById('d3-2-author-name').textContent = firstPb.ceoName || '';
  document.getElementById('d3-2-author-comp').textContent = firstPb.name || '';
  document.getElementById('d3-2-date').textContent = formattedDateKorean;
  document.getElementById('d3-2-sig-full').textContent = `${firstPb.name || ''} 대표자`;
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
  if (activeBtn) { activeBtn.classList.add('bg-blue-600', 'text-white'); activeBtn.classList.remove('bg-slate-900', 'text-slate-400'); }
}

// DOCX 변환 및 관리자 설정
function buildWordDocumentHtml(bodyInnerHtml, title = "신탁서류") {
  return `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${title}</title><style>body{font-family:'Batang',serif;font-size:10pt;}table{border-collapse:collapse;width:100%;border:1.5pt solid #000;}th,td{border:0.75pt solid #000;padding:4pt;font-size:9.5pt;}</style></head><body>${bodyInnerHtml}</body></html>`;
}
function saveBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}
function downloadCurrentDocAsDocx() {
  const activePaper = document.querySelector('.doc-paper:not(.hidden)');
  if (!activePaper) return;
  const clone = activePaper.cloneNode(true);
  const html = buildWordDocumentHtml(clone.innerHTML, "담보신탁계약서류");
  saveBlobFile(new Blob(['\ufeff', html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), "담보신탁계약서.docx");
  showToast('.docx 다운로드 완료!');
}
function downloadAllDocsAsDocx() {
  const docs = ['doc-view-1', 'doc-view-2-1', 'doc-view-2-2', 'doc-view-2-3', 'doc-view-3-1', 'doc-view-3-2'];
  let combined = "";
  docs.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      if (idx > 0) combined += `<br style='page-break-before:always;'>`;
      combined += el.innerHTML;
    }
  });
  const fullHtml = buildWordDocumentHtml(combined, "신탁서류3종 통합본");
  saveBlobFile(new Blob(['\ufeff', fullHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), "신탁서류3종_통합본.docx");
  showToast('서류 3종 전체 .docx 다운로드 완료!');
}

function switchTab(tabId) {
  if (tabId === 'settings' && !isAdminAuthenticated) {
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('admin-auth-error').classList.add('hidden');
    document.getElementById('admin-auth-modal').classList.remove('hidden');
    return;
  }
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(btn => { btn.classList.remove('bg-blue-600', 'text-white', 'shadow'); btn.classList.add('text-slate-400'); });
  document.getElementById(`nav-${tabId}`)?.classList.add('bg-blue-600', 'text-white', 'shadow');
  if (tabId === 'database') renderVendorTables();
  if (tabId === 'generator') updateDocumentPreviews();
  if (tabId === 'settings') refreshApiKeyStatusUI();
}

function verifyAdminPassword() {
  if (document.getElementById('admin-pw-input').value === (localStorage.getItem('admin_system_pw') || 'admin123')) {
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
  if (!newPw || newPw !== document.getElementById('confirm-admin-pw').value) { showToast('비밀번호가 일치하지 않습니다.'); return; }
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
  const key = getStoredApiKey();
  if (!key) { showToast('저장된 API Key가 없습니다.'); return; }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${FAILOVER_MODELS[0]}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
    });
    if (res.ok) { showToast('API Key 정상 연결 확인!'); refreshApiKeyStatusUI(); }
    else { showToast(`연결 오류: HTTP ${res.status}`); }
  } catch(e) { showToast(`네트워크 오류`); }
}

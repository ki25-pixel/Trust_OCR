const FAILOVER_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3-flash"];

// 1. 한국어 조사 자동 처리 헬퍼
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

// 2. 기본 거래처 마스터 DB (핵심 예시 2개)
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
    source: "기본 예시"
  },
  {
    id: "VND-2026-002",
    companyName: "(주)우리금융은행",
    representative: "이대표",
    corpRegNo: "110111-3456789",
    bizNo: "101-81-99887",
    address: "서울특별시 중구 소공로 51",
    bizType: "금융업 / 은행",
    type: "corporation",
    ceoName: "은행장 이대표",
    source: "기본 예시"
  }
];

let vendorDatabase = [];
let isAdminAuthenticated = false;
let currentUploadedFile = null;
let cachedFileBase64 = null;
let cachedMimeType = null;
let currentDocSubTab = "doc1";

// 3. 계약서 동적 상태 객체
let contractState = {
  trusters: [
    {
      id: "T1",
      type: "corporation",
      name: "(주)한국개발신탁파트너스",
      idNumber: "110111-1234567",
      ceoName: "대표이사 홍길동",
      address: "서울특별시 강남구 테헤란로 100",
      isDebtor: true,
      isRepresentative: true,
      shareRatio: "100"
    }
  ],
  debtor: {
    isSameAsTruster: true,
    type: "corporation",
    name: "(주)한국개발신탁파트너스",
    idNumber: "110111-1234567",
    ceoName: "대표이사 홍길동",
    address: "서울특별시 강남구 테헤란로 100",
    bizNo: "123-81-45678"
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

// DOM 요소 안전 접근 헬퍼
function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text !== undefined && text !== null ? text : '';
}
function safeSetHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html !== undefined && html !== null ? html : '';
}
function safeGetValue(id, fallback = '') {
  const el = document.getElementById(id);
  return el ? el.value : fallback;
}

// 4. API Key 영구 저장 및 복원
function getStoredApiKey() {
  return (localStorage.getItem('gemini_ocr_api_key') || '').trim();
}
function setStoredApiKey(keyStr) {
  const clean = (keyStr || '').trim();
  if (clean.length > 5) {
    localStorage.setItem('gemini_ocr_api_key', clean);
  }
}

function refreshApiKeyStatusUI() {
  const key = getStoredApiKey();
  const dot = document.getElementById('api-status-dot');
  const badge = document.getElementById('active-model-name-badge');
  const input = document.getElementById('gemini-api-key');

  if (input && key && input.value !== key) {
    input.value = key;
  }

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
}

// 5. 거래처 DB 로드 (2개 예시로 전환)
function loadPersistentVendorDatabase() {
  const migrated = localStorage.getItem('trust_db_v3_migrated');
  const saved = localStorage.getItem('trust_vendor_db');

  if (saved && migrated === 'true') {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        vendorDatabase = parsed;
        updateNativeDatalist();
        return;
      }
    } catch (e) {}
  }

  // 사용자가 수동 등록/OCR 한 것만 유지
  let userAdded = [];
  if (saved) {
    try {
      const oldParsed = JSON.parse(saved);
      if (Array.isArray(oldParsed)) {
        userAdded = oldParsed.filter(v => v.source === 'AI OCR' || v.source === '수동 등록');
      }
    } catch (e) {}
  }

  vendorDatabase = [...userAdded, ...JSON.parse(JSON.stringify(DEFAULT_SEED_VENDORS))];
  localStorage.setItem('trust_db_v3_migrated', 'true');
  saveVendorDatabaseToStorage();
}

function saveVendorDatabaseToStorage() {
  localStorage.setItem('trust_vendor_db', JSON.stringify(vendorDatabase));
  const count = vendorDatabase.length;
  safeSetText('stat-total-vendors', count);
  safeSetText('db-count-badge', count);
  updateNativeDatalist();
}

function updateNativeDatalist() {
  const dl = document.getElementById('vendor-master-datalist');
  if (!dl) return;
  dl.innerHTML = vendorDatabase.map(v => `<option value="${v.companyName}">${v.representative} | ${v.corpRegNo}</option>`).join('');
}

// 6. 애플리케이션 안전 초기화
let isAppInitialized = false;
function initApplication() {
  if (isAppInitialized) return;
  isAppInitialized = true;

  try {
    if (typeof injectDocumentTemplates === 'function') {
      injectDocumentTemplates();
    }
  } catch (e) {
    console.error("Template injection error:", e);
  }

  try {
    refreshApiKeyStatusUI();
    const apiKeyInput = document.getElementById('gemini-api-key');
    if (apiKeyInput) {
      apiKeyInput.addEventListener('input', function() {
        const val = this.value.trim();
        if (val.length > 5) {
          setStoredApiKey(val);
          refreshApiKeyStatusUI();
        }
      });
    }
  } catch (e) {
    console.error("API Key init error:", e);
  }

  try {
    loadPersistentVendorDatabase();
    renderVendorTables();
    setupFileUploadListeners();
    setupGlobalClickOutside();
    syncDebtorInputsFromState();
    renderTrusterUI();
    renderPriorityBeneficiaryUI();
    updateDocumentPreviews();
    appendDiagnosticLog("시스템 초기화 완료 (예시 거래처 2개 & 503 자동우회 활성화)");
  } catch (e) {
    console.error("UI init error:", e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApplication);
} else {
  initApplication();
}
window.addEventListener('load', initApplication);

// =========================================================================
// 탭 전환 엔진
// =========================================================================
function switchTab(tabId) {
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
    if (tabId === 'generator') updateDocumentPreviews();
    if (tabId === 'settings') refreshApiKeyStatusUI();
  } catch (err) {
    console.error("Tab switch error:", err);
  }
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
  if (!t) return;
  t.name = v.companyName;
  t.idNumber = v.corpRegNo;
  t.address = v.address;
  t.type = v.type || 'corporation';
  t.ceoName = v.ceoName || (t.type === 'corporation' ? `대표이사 ${v.representative}` : '');
  closeAllAutocompletes();
  renderTrusterUI();
  updateDocumentPreviews();
  showToast(`위탁자${index + 1}에 [${v.companyName}] 정보가 자동 채움되었습니다.`, 'success');
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
  showToast(`채무자에 [${v.companyName}] 정보가 자동 채움되었습니다.`, 'success');
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
  contractState.debtor.name = safeGetValue('debtor-name');
  contractState.debtor.idNumber = safeGetValue('debtor-idNumber');
  contractState.debtor.ceoName = safeGetValue('debtor-ceoName');
  contractState.debtor.type = safeGetValue('debtor-type', 'corporation');
  contractState.debtor.address = safeGetValue('debtor-address');
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
  if (!pb) return;
  pb.name = v.companyName;
  pb.corpNumber = v.corpRegNo;
  pb.address = v.address;
  pb.ceoName = v.ceoName || `대표자 ${v.representative}`;
  closeAllAutocompletes();
  renderPriorityBeneficiaryUI();
  updateDocumentPreviews();
  showToast(`우선수익자${index + 1}에 [${v.companyName}] 정보가 자동 채움되었습니다.`, 'success');
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
// AI OCR 실행 엔진 (503 지수 백오프 자동 우회)
// =========================================================================
function setupFileUploadListeners() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  if (!dropZone || !fileInput) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) handleSelectedFile(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleSelectedFile(e.target.files[0]);
  });
}

async function handleSelectedFile(file) {
  currentUploadedFile = file;
  document.getElementById('file-preview-card')?.classList.remove('hidden');
  safeSetText('preview-filename', file.name);
  safeSetText('preview-file-size', (file.size / 1024).toFixed(1) + ' KB');
  appendDiagnosticLog(`파일 스캔 준비 완료: ${file.name}`);

  const reader = new FileReader();
  reader.onload = async () => {
    cachedFileBase64 = reader.result.split(',')[1];
    cachedMimeType = file.type || 'application/pdf';
    // 자동으로 파싱 시작
    executeHighPrecisionOCR();
  };
  reader.readAsDataURL(file);
}

// 지연 대기 함수
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 비표준 JSON 파서
function safeExtractJSON(rawText) {
  if (!rawText) throw new Error("AI 응답이 비어있습니다.");
  let clean = rawText.trim().replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(clean);
  } catch (initialErr) {
    try {
      let repaired = clean
        .replace(/\/\/[^\n\r]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"');
      return JSON.parse(repaired);
    } catch (repairErr) {
      throw initialErr;
    }
  }
}

// ★ 503 방어: 지수 백오프 및 다중 우회 로직
async function callWithRetryAndFailover(payload, activeKey, onStepUpdate) {
  let lastError = null;

  for (let mIdx = 0; mIdx < FAILOVER_MODELS.length; mIdx++) {
    const model = FAILOVER_MODELS[mIdx];
    const isFallback = mIdx > 0;

    if (isFallback) {
      appendDiagnosticLog(`[트래픽 분산 우회] 예비 모델 "${model}"(으)로 전환 시도 중...`, 'warn');
      if (onStepUpdate) onStepUpdate(`과부하 우회: 예비 모델 (${model}) 호출 중...`);
    } else {
      appendDiagnosticLog(`AI OCR 요청 시작: 모델 "${model}"...`);
      if (onStepUpdate) onStepUpdate(`Google AI (${model}) 분석 요청 중...`);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeKey)}`;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          appendDiagnosticLog(`[성공 200 OK] 모델 "${model}" 정상 응답 수신!`, 'success');
          return { model, data };
        }

        const errText = await response.text();
        let parsedMsg = errText;
        try {
          const j = JSON.parse(errText);
          parsedMsg = j.error?.message || errText;
        } catch(e) {}

        if (response.status === 503 || response.status === 429) {
          lastError = new Error(`HTTP ${response.status} (${model}): ${parsedMsg}`);
          if (attempt < MAX_RETRIES) {
            const waitMs = (attempt + 1) * 1500;
            appendDiagnosticLog(`[서버 과부하 ${response.status}] ${waitMs / 1000}초 후 자동 재시도 (${attempt + 1}/${MAX_RETRIES})...`, 'warn');
            if (onStepUpdate) onStepUpdate(`서버 혼잡 감지: ${waitMs / 1000}초 후 자동 재시도 중...`);
            await sleep(waitMs);
            continue;
          } else {
            appendDiagnosticLog(`모델 "${model}" 응답 지연. 다음 모델로 즉시 우회합니다.`, 'warn');
            break;
          }
        } else {
          lastError = new Error(`HTTP ${response.status} (${model}): ${parsedMsg}`);
          appendDiagnosticLog(`모델 전환 (${response.status}): 다음 모델 시도`, 'warn');
          break;
        }
      } catch (netErr) {
        lastError = netErr;
        if (attempt < MAX_RETRIES) {
          await sleep(1500);
          continue;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("모든 AI 모델에서 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
}

async function executeHighPrecisionOCR() {
  if (!cachedFileBase64) return;
  const key = getStoredApiKey();
  if (!key) { 
    showToast('설정(Admin) 탭에서 API Key를 먼저 등록해 주세요.', 'error'); 
    return; 
  }

  const pBar = document.getElementById('ocr-progress-bar');
  const pFill = document.getElementById('ocr-progress-fill');
  const stepText = document.getElementById('ocr-step-text');
  const badge = document.getElementById('ocr-status-badge');

  pBar?.classList.remove('hidden');
  if (pFill) pFill.style.width = '40%';
  if (badge) {
    badge.textContent = 'AI 분석 중...';
    badge.className = 'text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 animate-pulse';
  }

  const promptText = `대한민국 사업자등록증 및 등기사항전부증명서의 다음 6가지 정보를 정밀 판독하여 반드시 아래 JSON 형식으로만 반환하세요:
{
  "companyName": "법인명 또는 상호명",
  "representative": "대표자 성명",
  "corpRegNo": "13자리 법인등록번호(없으면 사업자번호 기재)",
  "address": "본점 소재지 도로명 전체 주소",
  "bizNo": "10자리 사업자등록번호",
  "bizType": "업태 및 종목"
}`;

  const payload = {
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: cachedMimeType, data: cachedFileBase64 } },
        { text: promptText }
      ]
    }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const result = await callWithRetryAndFailover(payload, key, (statusMsg) => {
      if (stepText) stepText.textContent = statusMsg;
    });

    const rawText = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = safeExtractJSON(rawText);

    if (document.getElementById('ocr-company-name')) document.getElementById('ocr-company-name').value = parsed.companyName || '';
    if (document.getElementById('ocr-representative')) document.getElementById('ocr-representative').value = parsed.representative || '';
    if (document.getElementById('ocr-corp-no')) document.getElementById('ocr-corp-no').value = parsed.corpRegNo || '';
    if (document.getElementById('ocr-address')) document.getElementById('ocr-address').value = parsed.address || '';
    if (document.getElementById('ocr-biz-no')) document.getElementById('ocr-biz-no').value = parsed.bizNo || '';
    if (document.getElementById('ocr-biz-type')) document.getElementById('ocr-biz-type').value = parsed.bizType || '';

    if (pFill) pFill.style.width = '100%';
    if (badge) {
      badge.textContent = `파싱 성공`;
      badge.className = 'text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold';
    }
    appendDiagnosticLog(`[성공] ${parsed.companyName}`, 'success');
    showToast(`[${parsed.companyName}] 서류 정보 추출 완료!`, 'success');
  } catch (err) {
    if (badge) {
      badge.textContent = '파싱 실패';
      badge.className = 'text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400';
    }
    appendDiagnosticLog(`오류: ${err.message}`, 'error');
    showToast(`오류: ${err.message.substring(0, 45)}...`, 'error');
  } finally {
    setTimeout(() => pBar?.classList.add('hidden'), 800);
  }
}

// -------------------------------------------------------------------------
// 나머지 공통 헬퍼 함수들은 기존 코드와 동일하게 유지
// (window 전역 바인딩 포함)
// -------------------------------------------------------------------------
// ...

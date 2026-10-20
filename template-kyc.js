// =========================================================================
// [모듈 1] 고객거래확인서 및 실제소유자확인서 전용 템플릿 (template-kyc.js)
// - app.js의 updateDocumentPreviews()와 100% 호환 연동
// =========================================================================

// 1. 고객거래확인서 [개인·개인사업자 用] (위탁자 개인용)
window.buildIndividualCddHtml = function(party, roleLabel, formattedDate, isPageBreak) {
  const name = party.name || '';
  const idNum = party.idNumber ? String(party.idNumber).substring(0, 8) : '[RRN Omitted]';
  const addr = party.address || '';

  return `
    <div class="${isPageBreak ? 'page-break pt-8 mt-8 border-t-2 border-dashed border-slate-300' : ''}">
      <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div>
          <span class="text-[11px] text-blue-700 font-bold block">별지1. [${roleLabel} — 개인·개인사업자용]</span>
          <h1 class="text-xl font-bold font-serif">고객거래 확인서 [개인ᆞ개인사업자 用]</h1>
        </div>
        <table class="border border-slate-700 text-center text-[10px] w-28">
          <tr class="bg-slate-100">
            <td class="border border-slate-700 py-0.5 font-semibold">담당자</td>
            <td class="border border-slate-700 py-0.5 font-semibold">부서장</td>
          </tr>
          <tr>
            <td class="border border-slate-700 h-10"></td>
            <td class="border border-slate-700 h-10"></td>
          </tr>
        </table>
      </div>

      <p class="text-[10px] text-slate-600 leading-tight mt-2 text-justify">
        특정 금융거래정보의 보고 및 이용 등에 관한 법률에 따라 고객님께서 회사와 거래 시에는 고객확인 및 검증을 위하여 아래의 내용을 기재하셔야 합니다. 회사는 기재된 정보의 확인을 위해 추가 자료 제출을 요청할 수 있으며, 제공하신 정보는 법령에서 정한 용도 외의 목적으로 사용되지 않습니다.
      </p>

      <div class="text-[11px] font-bold text-slate-900 flex justify-between pt-2">
        <span>▶ 고객 기본정보 (${roleLabel})</span>
        <span>고객구분(체크): ▣ 개인 &nbsp;&nbsp; □ 개인사업자</span>
      </div>

      <table class="doc-table">
        <tr>
          <th class="w-1/6">성명</th>
          <td class="w-1/3">한글: <strong>${name}</strong><br><span class="text-[10px] text-slate-400">영문: (외국인 필수)</span></td>
          <th class="w-1/6">생년월일/식별번호</th>
          <td>${idNum}</td>
        </tr>
        <tr>
          <th>자택/직장 구분</th>
          <td>▣ 자택 &nbsp;&nbsp; □ 직장</td>
          <th>연락처</th>
          <td>자택/직장: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 휴대전화: 010-****-****</td>
        </tr>
        <tr>
          <th>주소</th>
          <td colspan="3">${addr}</td>
        </tr>
        <tr>
          <th>외국인 정보</th>
          <td>국적: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 여권/외국인등록번호:</td>
          <th>거주성 및 성별</th>
          <td>▣ 거주자 □ 비거주자 / □ 남 □ 여</td>
        </tr>
        <tr>
          <th>직업구분</th>
          <td colspan="3">
            □ 급여소득자 &nbsp;&nbsp; ▣ 개인사업자 &nbsp;&nbsp; □ 자유직/전문직(변호사, 회계사, 세무사, 의사 등)<br>
            □ 주부 &nbsp;&nbsp; □ 학생 &nbsp;&nbsp; □ 무직 &nbsp;&nbsp; □ 기타 ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
          </td>
        </tr>
      </table>

      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 직장 / 사업체 정보 (EDD 대상)</div>
      <table class="doc-table">
        <tr>
          <th class="w-1/6">직장명(상호)</th>
          <td class="w-1/3"></td>
          <th class="w-1/6">업종(업태/종목)</th>
          <td></td>
        </tr>
        <tr>
          <th>부서명 / 직위</th>
          <td></td>
          <th>사업자등록번호</th>
          <td></td>
        </tr>
        <tr>
          <th>직장/사업장 주소</th>
          <td colspan="3"></td>
        </tr>
      </table>

      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 거래 정보 (EDD 대상)</div>
      <table class="doc-table">
        <tr>
          <th class="w-1/4">거래 목적</th>
          <td>□ 관리신탁 &nbsp;&nbsp; □ 처분신탁 &nbsp;&nbsp; ▣ 담보신탁 &nbsp;&nbsp; □ 분양관리신탁 &nbsp;&nbsp; □ 토지신탁 &nbsp;&nbsp; □ 대리사무 &nbsp;&nbsp; □ 기타</td>
        </tr>
        <tr>
          <th>거래 자금의 원천 및 출처</th>
          <td>
            □ 근로및연금소득 &nbsp;&nbsp; ▣ 사업소득 &nbsp;&nbsp; □ 부동산임대소득 &nbsp;&nbsp; □ 부동산양도소득<br>
            □ 금융소득(이자/배당) &nbsp;&nbsp; □ 상속/증여 &nbsp;&nbsp; □ 차입금 &nbsp;&nbsp; □ 기타 ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
          </td>
        </tr>
        <tr>
          <th>거래 자금의 실소유자 여부</th>
          <td>▣ 예 (본인) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; □ 아니오 (실소유자 성명: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 본인과의 관계: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</td>
        </tr>
        <tr>
          <th>총 자산규모 (추정)</th>
          <td>□ 5억원 미만 &nbsp;&nbsp; □ 5억원~10억원 미만 &nbsp;&nbsp; □ 10억원~20억원 미만 &nbsp;&nbsp; ▣ 20억원 이상</td>
        </tr>
      </table>

      <div class="bg-slate-50 p-3 border border-slate-300 rounded text-[11px] mt-3">
        본 거래의 당사자인 (<strong>${name}</strong>)은(는) 상기 기재한 내용이 사실과 일치하며, 본 거래와 관련한 고객확인 안내 사항을 (<strong>충분히 이해하였음</strong>)을 확인합니다.
      </div>

      <div class="text-right pt-4 text-[12px] space-y-1.5">
        <p class="font-bold text-slate-900">${formattedDate}</p>
        <p>[본인 작성 시] &nbsp;&nbsp; 성명 : <strong class="underline text-sm font-bold">${name}</strong> &nbsp;&nbsp; (서명 또는 인)</p>
      </div>
    </div>
  `;
};

// 2. 고객거래확인서 [법인·단체 用] (위탁자 법인용 & 우선수익자 금융기관용 공통)
window.buildCorpCddHtml = function(party, roleLabel, isFinancial, formattedDate, isPageBreak) {
  const name = party.name || '';
  const bizNo = party.bizNo && party.bizNo !== 'N/A' ? party.bizNo : (party.corpNumber || party.idNumber || '');
  const corpNo = party.corpNumber || party.idNumber || '';
  const addr = party.address || '';
  const bizType = isFinancial ? '금융업 / 여신 및 대금업' : (party.bizType || '부동산업 / 신탁 및 자산관리 등');
  const rawCeo = party.ceoName || party.name || '대표이사';
  const pureCeo = String(rawCeo).replace(/^(대표이사|대표자|은행장|이사장)\s*/, '').trim() || rawCeo;
  const fullSig = `${name} ${rawCeo.includes(pureCeo) ? rawCeo : (isFinancial ? '대표자 ' : '대표이사 ') + pureCeo}`;

  return `
    <div class="${isPageBreak ? 'page-break pt-8 mt-8 border-t-2 border-dashed border-slate-300' : ''}">
      <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div>
          <span class="text-[11px] ${isFinancial ? 'text-amber-700' : 'text-blue-700'} font-bold block">별지1. [${roleLabel} — 법인·단체용]</span>
          <h1 class="text-xl font-bold font-serif">고객거래 확인서 [법인ᆞ단체 用]</h1>
        </div>
        <table class="border border-slate-700 text-center text-[10px] w-28">
          <tr class="bg-slate-100">
            <td class="border border-slate-700 py-0.5 font-semibold">담당자</td>
            <td class="border border-slate-700 py-0.5 font-semibold">부서장</td>
          </tr>
          <tr>
            <td class="border border-slate-700 h-10"></td>
            <td class="border border-slate-700 h-10"></td>
          </tr>
        </table>
      </div>

      <p class="text-[10px] text-slate-600 leading-tight mt-2 text-justify">
        특정 금융거래정보의 보고 및 이용 등에 관한 법률에 따라 고객님께서 회사와 거래 시에는 고객확인 및 검증을 위하여 아래의 내용을 기재하셔야 합니다.
      </p>

      <div class="text-[11px] font-bold text-slate-900 flex justify-between pt-2">
        <span>▶ 고객 기본정보 (${roleLabel})</span>
        <span>고객구분(체크): ■ 영리 법인(단체) &nbsp;&nbsp; □ 비영리 법인(단체) &nbsp;&nbsp; ${isFinancial ? '■ 금융기관' : '□ 기타단체'}</span>
      </div>

      <table class="doc-table">
        <tr>
          <th class="w-1/5">법인(단체)명</th>
          <td class="w-1/3">한글: <strong>${name}</strong><br><span class="text-[10px] text-slate-400">영문:</span></td>
          <th class="w-1/5">사업자등록번호<br>(법인등록번호)</th>
          <td>${bizNo}<br><span class="text-[10px] text-slate-500">(${corpNo})</span></td>
        </tr>
        <tr>
          <th>본점 소재지 주소</th>
          <td colspan="3">${addr}</td>
        </tr>
        <tr>
          <th>사업장 주소</th>
          <td colspan="3">${addr}</td>
        </tr>
        <tr>
          <th>업종 (업태/종목)</th>
          <td>${bizType}</td>
          <th>설립목적 / 연락처</th>
          <td>${isFinancial ? '금융 및 여신업' : '영리사업 및 부동산개발'}</td>
        </tr>
      </table>

      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 대표자 정보</div>
      <table class="doc-table">
        <tr>
          <th class="w-1/5">대표자 성명</th>
          <td class="w-1/3"><strong>${pureCeo}</strong></td>
          <th class="w-1/5">국적 / 성별</th>
          <td>대한민국</td>
        </tr>
      </table>

      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 법인(단체) 일반 정보 (EDD 대상)</div>
      <table class="doc-table">
        <tr>
          <th class="w-1/5">기업 규모</th>
          <td class="w-1/3">${isFinancial ? '■ 금융기관 / 공익법인' : '□ 대기업 &nbsp;&nbsp; ■ 중소기업 &nbsp;&nbsp; □ 기타'}</td>
          <th class="w-1/5">상장 여부</th>
          <td>□ 상장(코스피/코스닥) &nbsp;&nbsp; ■ 비상장</td>
        </tr>
      </table>

      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 거래 정보 (EDD 대상)</div>
      <table class="doc-table">
        <tr>
          <th class="w-1/4">거래 목적</th>
          <td>□ 토지신탁 &nbsp;&nbsp; ■ 담보신탁 ${isFinancial ? '(우선수익권 담보취득)' : ''} &nbsp;&nbsp; □ 분양관리신탁 &nbsp;&nbsp; □ 처분/관리신탁 &nbsp;&nbsp; □ 대리사무</td>
        </tr>
        <tr>
          <th>거래 자금의 원천 및 출처</th>
          <td>${isFinancial ? '■ 금융자금 (대출채권 피담보채권 확보)' : '■ 사업/운영자금 &nbsp;&nbsp; □ 차입금 &nbsp;&nbsp; □ 유상증자/출자금 &nbsp;&nbsp; □ 자산처분대금 &nbsp;&nbsp; □ 기타'}</td>
        </tr>
      </table>

      <div class="bg-slate-50 p-3 border border-slate-300 rounded text-[11px] mt-3">
        상기 기재한 내용이 사실과 일치하며, 고객확인과 관련하여 내용을 충분히 안내 받았음을 확인합니다.
      </div>

      <div class="text-right pt-4 text-[12px] space-y-1.5">
        <p class="font-bold text-slate-900">${formattedDate}</p>
        <p>[대표자 작성 시] &nbsp;&nbsp; <strong class="underline text-sm font-bold">${fullSig}</strong> &nbsp;&nbsp; (인)</p>
      </div>
    </div>
  `;
};

// 3. 실제소유자확인서 [법인·단체 用] (위탁자 법인 미대상 vs 우선수익자 금융기관 생략대상 자동 분기)
window.buildBeneficialOwnerHtml = function(party, roleLabel, isFinancial, formattedDate, isPageBreak) {
  const name = party.name || '';
  const bizNo = party.bizNo && party.bizNo !== 'N/A' ? party.bizNo : (party.corpNumber || party.idNumber || '');
  const rawCeo = party.ceoName || party.name || '대표이사';
  const pureCeo = String(rawCeo).replace(/^(대표이사|대표자|은행장|이사장)\s*/, '').trim() || rawCeo;
  const fullSig = `${name} ${rawCeo.includes(pureCeo) ? rawCeo : (isFinancial ? '대표자 ' : '대표이사 ') + pureCeo}`;
  const shareRatio = party.shareRatio ? `${party.shareRatio}%` : '100%';

  if (!isFinancial) {
    // [3-①] 일반 영리법인 (위탁자 법인 - 확인 미대상, 1~3단계 체크리스트 및 주주명부 기준)
    return `
      <div class="${isPageBreak ? 'page-break pt-8 mt-8 border-t-2 border-dashed border-slate-300' : ''}">
        <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
          <div>
            <span class="text-[11px] text-blue-700 font-bold block">별지2. [${roleLabel} — 위탁자 법인용]</span>
            <h1 class="text-xl font-bold font-serif">실제소유자 확인서 [법인ᆞ단체 用]</h1>
          </div>
          <table class="border border-slate-700 text-center text-[10px] w-28">
            <tr class="bg-slate-100">
              <td class="border border-slate-700 py-0.5 font-semibold">담당자</td>
              <td class="border border-slate-700 py-0.5 font-semibold">부서장</td>
            </tr>
            <tr>
              <td class="border border-slate-700 h-10"></td>
              <td class="border border-slate-700 h-10"></td>
            </tr>
          </table>
        </div>

        <p class="text-[10px] text-slate-600 leading-tight mt-2 text-justify">
          특정 금융거래정보의 보고 및 이용 등에 관한 법률 시행령 제10조의5에 따라 법인 또는 단체 고객과 거래 시 실제소유자(최종적으로 법인을 지배하거나 통제하는 자연인)를 확인하여야 합니다.
        </p>

        <div class="text-[11px] font-bold text-slate-900 pt-2">▶ 법인(단체) 기본 정보 (${roleLabel})</div>
        <table class="doc-table">
          <tr>
            <th class="w-1/4">법인(단체)명</th>
            <td class="w-1/4"><strong>${name}</strong></td>
            <th class="w-1/4">사업자번호 등 실명번호</th>
            <td class="w-1/4">${bizNo}</td>
          </tr>
          <tr>
            <th>실제소유자 확인 생략 여부</th>
            <td colspan="3">
              □ 대상 (□ 국가·지방자치단체 &nbsp; □ 공공단체 &nbsp; □ 금융회사등 &nbsp; □ 사업보고서 제출대상법인)<br>
              <strong>■ 미대상</strong> (자본시장법 제159조 제출대상 외 일반영리법인)
            </td>
          </tr>
        </table>

        <div class="text-[11px] font-bold text-slate-900 pt-1">
          ▶ 실제소유자 확인 정보 (3단계 순차 확인 절차)<br>
          <span class="text-[10px] font-normal text-slate-600">※ 주주명부 등 지분 확인서류를 근거로 아래 1단계~3단계 순서에 따라 실제소유자(자연인)를 확인합니다.</span>
        </div>

        <table class="doc-table">
          <tr>
            <th class="w-1/4">실제소유자 확인 방법</th>
            <td colspan="2">■ 주주명부 &nbsp;&nbsp; □ 사원명부 &nbsp;&nbsp; □ 이사명부 &nbsp;&nbsp; □ 정관/규약 &nbsp;&nbsp; □ 주식등변동상황명세서</td>
          </tr>
          <tr>
            <th rowspan="3">실제소유자 구분<br>(단계별 판정)</th>
            <td colspan="2">
              <strong>[1단계] 의결권 있는 발행주식 총수의 25% 이상 지분 소유 자연인 확인</strong><br>
              1-① 25% 이상의 지분을 소유한 자연인이 있으며, 확인서류로 그 사실이 확인됩니까?<br>
              <strong>■ 예</strong> (“예” 체크 시 아래 “실제소유자 정보” 작성) &nbsp;&nbsp;&nbsp;&nbsp; □ 아니오 (2단계로 이동)
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <strong>[2단계] 1단계에서 확인할 수 없는 경우 (25% 이상 소유자가 없거나 법인만 존재하는 경우)</strong><br>
              2-① 단독 또는 공동으로 최대 지분을 소유한 자연인이 있습니까? &nbsp; □ 예 &nbsp; □ 아니오<br>
              2-② 대표자 또는 임원의 과반수를 선임한 주주(자연인)가 있습니까? &nbsp; □ 예 &nbsp; □ 아니오<br>
              2-③ 위 외에 법인·단체를 사실상 지배하는 자연인이 있습니까? &nbsp; □ 예 &nbsp; □ 아니오
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <strong>[3단계] 1단계 및 2단계에서 확인할 수 없는 경우</strong><br>
              3-① 해당 법인 또는 단체의 대표자(대표이사)가 있습니까? &nbsp; □ 예 &nbsp; □ 아니오
            </td>
          </tr>
        </table>

        <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 실제소유자 정보 (자연인 기재)</div>
        <table class="doc-table">
          <tr>
            <th class="w-1/4">성명 (자연인)</th>
            <td class="w-1/4"><strong>${pureCeo}</strong></td>
            <th class="w-1/4">국적</th>
            <td class="w-1/4">대한민국</td>
          </tr>
          <tr>
            <th>생년월일 / 식별정보</th>
            <td>-</td>
            <th>지분율 (%)</th>
            <td><strong>${shareRatio}</strong></td>
          </tr>
        </table>

        <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 작성자 정보 (서류 제출 및 확인서 작성자)</div>
        <table class="doc-table">
          <tr>
            <th class="w-1/4">작성자 성명</th>
            <td class="w-1/4">${pureCeo}</td>
            <th class="w-1/4">소속 회사명 / 직위</th>
            <td class="w-1/4">${name} / 대표이사</td>
          </tr>
        </table>

        <div class="bg-slate-50 p-2.5 border border-slate-300 rounded text-[11px] mt-3">
          상기 기재한 내용이 사실과 일치하며, 실제소유자 확인과 관련하여 내용을 충분히 안내 받았음을 확인합니다.
        </div>

        <div class="text-right pt-4 text-[12px] space-y-1.5">
          <p class="font-bold text-slate-900">${formattedDate}</p>
          <p>작성자 : &nbsp;&nbsp; <strong class="underline text-sm font-bold">${fullSig}</strong> &nbsp;&nbsp; (인)</p>
        </div>
      </div>
    `;
  } else {
    // [3-②] 금융기관 (우선수익자 - 금융회사등 확인 생략 대상)
    return `
      <div class="${isPageBreak ? 'page-break pt-8 mt-8 border-t-2 border-dashed border-slate-300' : ''}">
        <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
          <div>
            <span class="text-[11px] text-amber-700 font-bold block">별지2. [${roleLabel} — 우선수익자 금융기관용]</span>
            <h1 class="text-xl font-bold font-serif">실제소유자 확인서 [법인ᆞ단체 用]</h1>
          </div>
          <table class="border border-slate-700 text-center text-[10px] w-28">
            <tr class="bg-slate-100">
              <td class="border border-slate-700 py-0.5 font-semibold">담당자</td>
              <td class="border border-slate-700 py-0.5 font-semibold">부서장</td>
            </tr>
            <tr>
              <td class="border border-slate-700 h-10"></td>
              <td class="border border-slate-700 h-10"></td>
            </tr>
          </table>
        </div>

        <p class="text-[10px] text-slate-600 leading-tight mt-2 text-justify">
          특정 금융거래정보의 보고 및 이용 등에 관한 법률 시행령 제10조의5에 따라 법인 또는 단체 고객과 거래 시 실제소유자 확인 대상 여부를 기재합니다.
        </p>

        <div class="text-[11px] font-bold text-slate-900 pt-2">▶ 법인(단체) 기본 정보 (${roleLabel})</div>
        <table class="doc-table">
          <tr>
            <th class="w-1/4">법인(단체)명</th>
            <td class="w-1/4"><strong>${name}</strong></td>
            <th class="w-1/4">사업자번호 등 실명번호</th>
            <td class="w-1/4">${bizNo}</td>
          </tr>
          <tr>
            <th>실제소유자 확인 생략 여부</th>
            <td colspan="3">
              <strong>■ 대상 (□ 국가ᆞ지방자치단체 &nbsp; □ 공공단체 &nbsp; ■ 금융회사등 &nbsp; □ 사업보고서 제출대상법인)</strong><br>
              □ 미대상
            </td>
          </tr>
        </table>

        <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 실제소유자 확인 정보 (금융회사등 확인 생략 대상)</div>
        <table class="doc-table">
          <tr>
            <th class="w-1/4">실제소유자 확인 방법</th>
            <td colspan="2">□ 주주명부 &nbsp;&nbsp; □ 사원명부 &nbsp;&nbsp; □ 이사명부 &nbsp;&nbsp; □ 정관/규약 &nbsp;&nbsp; ■ 해당없음(확인생략 대상)</td>
          </tr>
          <tr>
            <th>[1단계 ~ 3단계]</th>
            <td colspan="2" class="text-slate-500 py-2">
              ※ 특정금융정보법 시행령에 따른 금융회사등 확인 생략 대상 법인으로 세부 단계 판정을 생략함
            </td>
          </tr>
        </table>

        <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 실제소유자 정보 (확인 생략 대상 - 공란 처리)</div>
        <table class="doc-table bg-slate-50 text-slate-400">
          <tr>
            <th class="w-1/4">성명</th>
            <td class="w-1/4">- (금융회사등 확인 생략) -</td>
            <th class="w-1/4">국적</th>
            <td class="w-1/4">-</td>
          </tr>
          <tr>
            <th>생년월일</th>
            <td>-</td>
            <th>지분율 (%)</th>
            <td>-</td>
          </tr>
        </table>

        <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 작성자 정보</div>
        <table class="doc-table">
          <tr>
            <th class="w-1/4">작성자 성명</th>
            <td class="w-1/4">${pureCeo}</td>
            <th class="w-1/4">소속 기관명 / 직위</th>
            <td class="w-1/4">${name} / 대표자</td>
          </tr>
        </table>

        <div class="bg-slate-50 p-2.5 border border-slate-300 rounded text-[11px] mt-3">
          상기 기재한 내용이 사실과 일치하며, 실제소유자 확인과 관련하여 내용을 충분히 안내 받았음을 확인합니다.
        </div>

        <div class="text-right pt-4 text-[12px] space-y-1.5">
          <p class="font-bold text-slate-900">${formattedDate}</p>
          <p>작성자 : &nbsp;&nbsp; <strong class="underline text-sm font-bold">${fullSig}</strong> &nbsp;&nbsp; (인)</p>
        </div>
      </div>
    `;
  }
};
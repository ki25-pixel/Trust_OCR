// 서류 3종(총 6개 뷰)의 원본 법률 양식을 #print-area에 렌더링하는 모듈
function injectDocumentTemplates() {
  const printArea = document.getElementById('print-area');
  if (!printArea) return;

  printArea.innerHTML = `
    <!-- 1. 담보신탁계약서 (본문 제1조 ~ 제31조 및 별첨 1~4 전문) -->
    <div id="doc-view-1" class="doc-paper p-8 sm:p-14 text-xs leading-relaxed space-y-6">
      <div class="text-center border-b-2 border-slate-900 pb-6 mb-8">
        <h1 class="text-3xl font-bold tracking-tight mb-8">부동산담보신탁계약서</h1>
        <div class="max-w-md mx-auto border border-slate-800 divide-y divide-slate-700 text-left">
          <div id="cover-parties-box"></div>
        </div>
      </div>

      <p class="text-justify font-serif text-[12px] leading-relaxed" id="d1-preamble-text"></p>

      <div class="space-y-4 text-[11px] text-justify text-slate-800 leading-relaxed">
        <p><strong>제1조 (신탁목적)</strong> 이 신탁계약에 따른 신탁은 채무자의 우선수익자에 대한 채무 이행을 담보하기 위하여, 위탁자는 신탁부동산의 소유권을 수탁자에게 이전하고 수탁자는 신탁부동산의 소유권을 보전 및 관리하며 이 신탁계약에서 정해진 사유 발생 시 신탁부동산을 처분하여 그 처분대가 등 신탁재산을 이 신탁계약에 정해진 바에 따라 지급하는 것을 목적으로 한다.</p>
        <div>
          <strong>제2조 (용어의 정의)</strong> 이 신탁계약에서 사용하는 용어는 아래에서 정의하는 의미를 갖는다.<br>
          1. “위탁자”란 신탁부동산을 수탁자에게 위탁하는 자를 말한다.<br>
          2. “수탁자”란 이 신탁계약에 따라 신탁부동산을 신탁재산으로 인수하는 자를 말한다.<br>
          3. “수익자”란 이 신탁계약에 따라 신탁재산으로부터 금전의 지급을 받거나 그 밖의 이 신탁계약상의 권리를 갖고 의무를 부담하는 자로서 별첨2에 적힌 자를 말하며, 이 신탁계약상 별도로 규정하지 않는 한 우선수익자를 포함한다.<br>
          4. “우선수익자”란 수익자들 중에서 이 신탁계약에 따라 신탁재산으로부터 우선적으로 지급을 받을 권리를 갖고 의무를 부담하는 자로서 별첨2에 적힌 자를 말한다.<br>
          5. “수익권”이란 이 신탁계약에 따라 수익자가 신탁재산으로부터 금전을 지급받을 권리 그 밖의 이 신탁계약상 수익자가 갖는 모든 권리를 말한다.<br>
          6. “우선수익권”이란 이 신탁계약에 따라 우선수익자가 신탁재산으로부터 금전의 지급을 받거나 그 밖의 이 신탁계약상 우선수익자가 갖게 되는 권리를 말한다.<br>
          7. “우선수익권금액”이란 우선수익자가 이 신탁계약에 따라 신탁부동산의 처분대금 등 신탁재산으로부터 피담보채권의 변제를 위하여 우선하여 지급받게 될 금액의 한도로서, 별첨2에 적힌 것을 말한다.<br>
          8. “피담보채권”이란 이 신탁계약에 따라 우선수익자가 신탁재산으로 그 변제를 담보하고자 하는 채권으로서 신탁재산을 담보로 하며 이는 별첨2에 적힌 것을 말한다.<br>
          9. “채무자”란 피담보채권에 관한 채무를 이행하여야 하는 자로서 별첨2에 적힌 자를 말한다.<br>
          10. “신탁부동산”이란 이 신탁계약에 따라 위탁자가 수탁자에게 신탁하는 별첨1에 적힌 부동산을 말한다.<br>
          11. “신탁재산”이란 이 신탁계약 제4조에 따라 신탁재산에 속하는 재산을 말한다.<br>
          12. “신탁기간”은 이 신탁계약 제3조에 정의된 기간을 말한다.<br>
          13. “신탁특약”이란 위탁자와 수탁자가 이 신탁계약에서 정하지 아니한 사항 또는 이 신탁계약과 달리 정하고자 하는 사항을 정하기 위하여 이 신탁계약의 별첨4에 첨부된 신탁특약을 말한다.
        </div>
        <p><strong>제3조 (신탁기간)</strong> 이 신탁계약에 따른 신탁기간은 담보신탁등기일로부터 우선수익자 채권변제시까지로 한다. 다만 위 신탁기간이 만료되기 전에 제26조 제1항에 정해진 사유로 이 신탁계약에 따른 신탁이 종료된 경우에는 신탁기간도 이 신탁의 종료 시점에 종료된 것으로 본다.</p>
        <p><strong>제4조 (신탁재산의 범위)</strong> 신탁부동산과 신탁부동산의 관리, 처분, 운용, 수용, 멸실, 훼손 그 밖의 사유로 수탁자가 얻은 재산(수용보상금, 보험금 등 신탁재산에 관한 물상대위권에 기하여 취득한 금전을 포함하며, 이에 국한되지 않는다)은 신탁재산에 속한다.</p>
        <p><strong>제5조 (위탁자의 변경)</strong> ① 위탁자는 수탁자 및 수익자 전원의 동의를 받아 위탁자의 지위를 제3자에게 이전할 수 있다. 이로 인한 신탁원부 등에 적힌 내용 변경 및 수익권증서 발행에 따른 비용은 위탁자가 부담한다. ② 제1항의 경우 위탁자가 여러 명일 때에는 다른 위탁자의 동의도 받아야 한다.</p>
        <p><strong>제6조 (수익자 지정 및 수익권증서)</strong> ① 수탁자는 위탁자가 이 신탁계약에 따른 위탁자가 아닌 제3자를 수익자로 지정한 경우 그 지정 사실을 지체 없이 해당 수익자에게 통지하여야 한다. ② 위탁자가 제3자를 수익자로 지정한 경우 수익자는 이 신탁계약의 내용을 알고 있으며 이에 동의한다는 취지의 승낙서에 이름을 적고 도장을 찍어 수탁자에게 제출하여야 한다. ③ 수탁자는 수익자의 요청이 있는 경우 이 신탁계약에 따른 수익자의 권리를 증명하기 위한 증서로서 수익권증서를 발행하여 해당 수익자에게 교부한다.</p>
        <p><strong>제7조 (우선수익권)</strong> ① 우선수익자는 이 신탁계약에 따라 수탁자가 신탁부동산을 처분하는 경우 피담보채권의 변제를 위하여 별첨2에 적힌 우선수익권금액을 한도로 신탁부동산의 처분대금 등 신탁재산으로부터 수익자보다 우선하여 지급받을 권리를 가지며, 우선수익자가 수인인 경우 우선수익자 사이의 순위는 별첨2에 적힌 순위에 따른다. ② 우선수익자의 피담보채권이 변제된 경우에는 해당 우선수익자의 우선수익권은 소멸한다.</p>
        <p><strong>제8조 (수익권의 양도, 수익자의 추가 지정 또는 변경 등)</strong> ① 우선수익자는 수탁자의 사전 동의를 받아 이 신탁계약에 따른 우선수익권을 제3자에게 양도하거나 질권을 설정할 수 있다. 다만 우선수익권은 그 피담보채권과 함께 양도되어야 하며, 그 양수인이 이 신탁계약상 우선수익자의 의무를 승계하는 조건으로만 양도되어야 한다. ② 제1항의 경우를 제외하고 수익자가 수익권을 양도하거나 질권설정 등 처분행위를 하고자 하는 경우에는 수탁자의 사전 동의를 받아야 한다.</p>
        <p><strong>제9조 (신탁부동산의 소유권이전의무 등)</strong> ① 위탁자는 이 신탁계약 체결 후 지체 없이 신탁부동산의 소유권이전등기 등 신탁재산의 공시에 필요한 서류를 수탁자에게 제공하고 수탁자가 합리적으로 요구하는 조치를 취하여야 한다. ② 제1항의 등기에 필요한 비용은 위탁자가 부담한다.</p>
        <p><strong>제10조 (신탁부동산의 관리 등)</strong> ① 위탁자는 신탁부동산의 보존·유지·수선 등 관리에 필요한 모든 조치를 다하고 세금과 공과금 등 이에 필요한 비용을 부담한다. ② 이 신탁계약 체결일 이전에 위탁자가 신탁부동산에 관하여 체결한 임대차계약은 유효하고, 이 신탁계약 체결일 이후에도 위탁자는 신탁부동산을 타인에게 임대하거나 직접 점유 또는 사용할 수 있다. ③ 제2항에도 불구하고 위탁자는 이 신탁계약 체결일 이후 신탁부동산에 대하여 임대차계약의 체결, 저당권설정, 전세권설정 등의 처분행위를 하고자 하는 경우에는 수탁자 및 수익자의 사전 서면 동의를 받아야 한다.</p>
        <p><strong>제11조 (임대차 등)</strong> ① 이 신탁계약 체결 후 위탁자가 제10조 제3항에 따라 수탁자 및 수익자의 사전 서면 동의를 받아 신탁부동산에 관한 임대차계약을 체결하는 경우에도 임대차계약은 위탁자 이름으로 체결하고, 위탁자가 임차인으로부터 임대차보증금 및 임대료 등을 직접 지급받는다. ② 제1항의 경우 위탁자는 그 임대차계약으로 인하여 수탁자에게 발생되는 손실, 비용 등을 부담하여야 한다.</p>
        <p><strong>제12조 (보험계약)</strong> ① 위탁자는 수탁자가 시장상황을 고려하여 합리적으로 정한 종류, 기간, 부보금액, 방법으로 신탁부동산에 대한 보험계약을 체결하여야 하며 신탁기간 동안 이를 유지하여야 한다. ② 수탁자가 신탁부동산에 관한 보험금을 받은 경우 신탁기간의 만료 전이라도 그 보험금으로 제22조에서 정한 방법에 따라 정산할 수 있다.</p>
        <p><strong>제13조 (선관주의의무 및 하자담보책임)</strong> ① 수탁자는 선량한 관리자의 주의의무로서 신탁부동산의 소유권을 보존·관리하고 그 밖의 신탁사무를 처리한다. ② 수탁자가 신탁사무를 처리하는 과정에서 수탁자의 고의 또는 과실로 인하여 위탁자 또는 수익자에게 손해가 발생하는 경우에는 그 손해를 배상할 책임이 있다.</p>
        <p><strong>제14조 (신탁재산에 속하는 금전의 운용방법)</strong> ① 수탁자는 신탁재산에 속하는 금전을 「자본시장과 금융투자업에 관한 법률」 등 관계법령에서 정하는 방법에 따라 운용한다. ② 수탁자는 신탁재산을 다른 신탁재산 및 수탁자의 고유재산과 구분하여 관리하여야 한다.</p>
        <p><strong>제15조 (비용 등의 부담)</strong> ① 신탁재산에 관한 세금과 공과금, 유지관리비, 지료 등 그 밖의 신탁사무의 처리에 필요한 비용 그리고 신탁사무 처리에 있어서 수탁자의 책임 없는 사유로 발생한 손실 등은 위탁자가 부담한다. ② 위탁자가 제1항의 비용 등을 지급하지 않는 경우 수탁자는 신탁재산에 속하는 금전으로 이를 지급할 수 있다.</p>
        <p><strong>제16조 (신탁의 계산 및 수익의 교부)</strong> 이 신탁계약에 따른 신탁이 종료한 경우 수탁자는 지체 없이 신탁사무에 관한 최종의 계산을 하고, 수익자와 귀속권리자의 승인을 받아야 한다.</p>
        <p><strong>제17조 (신탁보수)</strong> ① 신탁보수는 담보보수, 환가처분보수 및 매매계약사무보수로 구분한다. ② 담보보수는 별첨3에 적힌 산식에 의하여 계산하여 나온 금액으로 하며, 이 신탁계약에 따른 신탁이 중도에 해지되는 경우에도 담보보수는 반환하지 아니한다. ③ 환가처분보수는 환가처분 시 적용하며 제2항에서 정한 보수 외에 별도로 신탁부동산의 처분가격을 기준으로 별첨3에 적힌 산식에 의하여 계산한다.</p>
        <p><strong>제18조 (신탁부동산의 처분)</strong> 수탁자는 채무자가 피담보채권에 관한 채무를 불이행하여 기한의 이익이 상실된 경우 위탁자에게 14일 이상의 기간을 부여하여 위반사유를 해결할 것을 요구하였음에도 불구하고 적절한 조치를 취하지 아니하는 때에는 우선수익자의 서면 요청에 의하여 신탁부동산을 처분할 수 있다.</p>
        <p><strong>제19조 (처분방법)</strong> 신탁부동산의 처분은 공개시장에서 경쟁을 통하여 처분(공매)하는 것을 원칙으로 한다. 다만 공매가 되지 아니한 경우에는 다음 회차 공매 시작 전까지 직전 회차 공매 조건 이상으로 수의계약을 체결할 수 있다.</p>
        <p><strong>제20조 (예정가격)</strong> 신탁부동산의 공매 시 예정가격은 수탁자가 선정하는 감정평가 전문기관의 감정평가액 이상으로 수탁자가 결정하는 것을 원칙으로 한다.</p>
        <p><strong>제21조 (처분대금 납부기한)</strong> 신탁부동산의 공매는 그 매매대금을 매매계약의 체결일로부터 60일 이내에 완납하는 것을 조건으로 하여야 한다.</p>
        <p><strong>제22조 (처분대금 등 정산)</strong> 수탁자가 신탁부동산을 환가하여 정산하는 경우의 순위는 1. 신탁사무 비용 및 신탁보수, 2. 신탁등기 전 소액임대차보증금, 3. 신탁등기 전 대항력 있는 임차보증금 및 근저당권, 4. 대항력을 갖춘 임차보증금, 5. 우선수익자의 피담보채권, 6. 잔액이 있을 경우 수익자 교부 순서에 의한다.</p>
        <p><strong>제23조 (명도의무)</strong> 위탁자는 신탁부동산의 처분이 결정된 경우 지체 없이 신탁부동산을 수탁자 또는 매수인에게 명도하여야 한다.</p>
        <p><strong>제24조 (신탁해지 및 책임부담)</strong> ① 위탁자와 수익자는 합의하여 언제든지 신탁을 종료할 수 있다. 다만 위탁자가 존재하지 아니하는 경우에는 그러하지 아니하다. ② 위탁자가 신탁이익의 전부를 누리는 신탁은 위탁자나 그 상속인이 언제든지 종료할 수 있다. ③ 위탁자, 수익자 또는 위탁자의 상속인이 정당한 이유 없이 수탁자에게 불리한 시기에 신탁을 종료한 경우 위탁자, 수익자 또는 위탁자의 상속인은 그 손해를 배상하여야 한다. ④ 제1항부터 제3항까지의 규정에도 불구하고 신탁특약으로서 달리 정한 경우에는 그 특약에 따른다.</p>
        <p><strong>제25조 (수탁자의 사임)</strong> 수탁자는 위탁자와 수익자의 승낙을 받은 경우 또는 정당한 사유가 있는 경우에 한하여 사임할 수 있다.</p>
        <p><strong>제26조 (신탁의 종료)</strong> 이 신탁계약에 따른 신탁은 신탁기간의 만료, 신탁목적의 달성, 처분대금의 정산 완료 또는 신탁해지에 의하여 종료한다.</p>
        <p><strong>제27조 (신고사항)</strong> 위탁자 또는 그 상속인은 인감, 주소, 상호, 대표자 등의 변경이 있는 경우 지체 없이 수탁자에게 서면 신고하여야 한다.</p>
        <p><strong>제28조 (소송수행)</strong> 신탁부동산에 관한 소송은 위탁자 또는 우선수익자의 책임과 비용으로 수행함을 원칙으로 한다.</p>
        <p><strong>제29조 (관할법원)</strong> 이 신탁계약에 관하여 분쟁이 발생하는 경우에는 관할법원은 「민사소송법」에서 정하는 바에 따른다.</p>
        <p><strong>제30조 (관계법규등 준용)</strong> 이 신탁계약에 정하지 아니한 사항은 별도의 약정이 없는 한 관계법규등에 정하는 바에 따른다.</p>
        <p><strong>제31조 (신탁계약과 신탁특약의 관계)</strong> 위탁자와 수탁자는 관계법규에 위반하지 않는 범위 내에서 특약을 정할 수 있으며, 신탁특약의 내용은 이 신탁계약의 내용에 우선한다.</p>
      </div>

      <p class="text-center font-bold my-4">- 이하 날인을 위한 여백 -</p>
      <p class="text-[11px]" id="d1-copy-count-text"></p>
      <div class="text-center font-bold text-sm my-6 text-slate-900" id="d1-contract-date-display"></div>
      <div class="border border-slate-900 p-4 space-y-4 text-[11px]" id="d1-signatures-box"></div>

      <!-- 별첨 1 ~ 4 -->
      <div class="page-break pt-8">
        <h3 class="font-bold text-sm mb-3">【별첨 1】 신탁부동산의 표시</h3>
        <div class="border border-slate-700 p-4 bg-slate-50 space-y-2 text-[11px] leading-relaxed" id="d1-annex1-box"></div>
      </div>

      <div class="pt-6">
        <h3 class="font-bold text-sm mb-3">【별첨 2】 우선수익자 및 수익자 등의 표시</h3>
        <div class="space-y-4">
          <div><h4 class="font-bold text-xs mb-1 text-amber-900">가. 우선수익자</h4><div id="d1-annex2-pb-box"></div></div>
          <div><h4 class="font-bold text-xs mb-1 text-blue-900">나. 수익자</h4><div id="d1-annex2-trusters-box"></div></div>
          <div><h4 class="font-bold text-xs mb-1 text-indigo-900">다. 채무자</h4><div id="d1-annex2-debtor-box"></div></div>
        </div>
      </div>

      <div class="pt-6">
        <h3 class="font-bold text-sm mb-2">【별첨 3】 신탁보수</h3>
        <div class="border border-slate-700 p-4 space-y-3 bg-slate-50 text-[11px]">
          <div>
            <strong>1. 담보보수</strong><br>
            보수산정 방법 : 수익권증서상의 수익한도금액 X 약 <span id="d1-annex3-rate"></span><br>
            보수액 : <strong id="d1-annex3-fee" class="text-cyan-900 font-bold"></strong> (VAT 별도)
          </div>
          <div>
            <strong>2. 환가처분보수</strong>
            <table class="doc-table mt-1.5">
              <tr><th>처분가격</th><th>보수율</th></tr>
              <tr><td>1억원까지</td><td>8/1000</td></tr>
              <tr><td>2억원까지</td><td>7/1000</td></tr>
              <tr><td>5억원까지</td><td>6/1000</td></tr>
              <tr><td>10억원까지</td><td>5/1000</td></tr>
              <tr><td>10억원초과</td><td>4/1000</td></tr>
            </table>
            <span class="text-[10px] text-slate-500">주) 신탁보수는 기준금액 단계별 보수를 누적 산정한다.</span>
          </div>
        </div>
      </div>

      <div class="page-break pt-8">
        <h3 class="font-bold text-sm mb-3">【별첨 4】 신탁특약</h3>
        <p class="text-[11px] mb-3">부동산담보신탁계약 기본계약 제31조의 규정과 관련하여, 당사자들은 다음과 같이 신탁특약을 정하고 신탁특약을 신탁본문에 우선하여 적용하기로 합의한다.</p>
        <div class="space-y-3 text-[11px] leading-relaxed text-slate-800" id="d1-annex4-articles-box"></div>
      </div>
    </div>

    <!-- 2-①. 고객거래확인서 [개인·개인사업자 用] (위탁자 개인용) -->
    <div id="doc-view-2-1" class="doc-paper hidden p-8 sm:p-14 text-xs leading-relaxed space-y-4">
      <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div><span class="text-[11px] text-slate-500 block">별지1.</span><h1 class="text-xl font-bold font-serif">고객거래 확인서 [개인ᆞ개인사업자 用]</h1></div>
        <table class="border border-slate-700 text-center text-[10px] w-28">
          <tr class="bg-slate-100"><td class="border border-slate-700 py-0.5">담당자</td><td class="border border-slate-700 py-0.5">부서장</td></tr>
          <tr><td class="border border-slate-700 h-10"></td><td class="border border-slate-700 h-10"></td></tr>
        </table>
      </div>
      <p class="text-[10px] text-slate-600 leading-tight">「특정 금융거래정보의 보고 및 이용 등에 관한 법률」 제5조의2에 따라 고객님께서 회사와 거래 시에는 고객확인 및 검증을 위하여 아래의 내용을 기재하셔야 합니다.</p>
      <div class="text-[11px] font-bold text-slate-900 flex justify-between pt-1"><span>▶ 고객 기본정보</span><span>고객구분(체크): ▣ 개인 &nbsp;&nbsp; □ 개인사업자</span></div>
      <table class="doc-table">
        <tr><th class="w-1/6">성명</th><td class="w-1/3">한글: <strong id="d2-1-name"></strong></td><th class="w-1/6">생년월일/식별정보</th><td id="d2-1-id"></td></tr>
        <tr><th>자택/직장 구분</th><td>▣ 자택 &nbsp;&nbsp; □ 직장</td><th>연락처</th><td>TEL: &nbsp;&nbsp;&nbsp;&nbsp; Mobile: 010-****-****</td></tr>
        <tr><th>주소</th><td colspan="3" id="d2-1-addr"></td></tr>
        <tr><th>직업구분</th><td colspan="3">□ 급여소득자 &nbsp;&nbsp; ▣ 개인사업자 &nbsp;&nbsp; □ 전문직 &nbsp;&nbsp; □ 주부 &nbsp;&nbsp; □ 학생 &nbsp;&nbsp; □ 기타</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 거래 정보 (EDD 대상)</div>
      <table class="doc-table">
        <tr><th class="w-1/4">거래 목적</th><td>□ 토지신탁 &nbsp;&nbsp; ▣ 담보신탁 &nbsp;&nbsp; □ 분양관리신탁 &nbsp;&nbsp; □ 기타</td></tr>
        <tr><th>자금의 원천 및 출처</th><td>▣ 사업소득 &nbsp;&nbsp; □ 부동산임대소득 &nbsp;&nbsp; □ 금융소득 &nbsp;&nbsp; □ 기타</td></tr>
        <tr><th>거래 자금의 실소유자 여부</th><td>▣ 예 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; □ 아니오</td></tr>
      </table>
      <div class="bg-slate-50 p-3 border border-slate-300 rounded text-[11px] mt-4">본 거래의 당사자인 (<strong id="d2-1-confirm-name"></strong>)은 상기 거래와 관련한 내용을 (<strong>충분히 이해하였음</strong>)을 확인합니다.</div>
      <div class="text-right pt-6 text-[12px] space-y-2">
        <p class="font-bold text-slate-900" id="d2-1-date"></p>
        <p>[본인 작성 시] &nbsp;&nbsp; 성명 : <strong id="d2-1-sig-name" class="underline text-sm font-bold"></strong> &nbsp;&nbsp; (인)</p>
      </div>
    </div>

    <!-- 2-②. 고객거래확인서 [법인·단체 用] (위탁자 법인용) -->
    <div id="doc-view-2-2" class="doc-paper hidden p-8 sm:p-14 text-xs leading-relaxed space-y-4">
      <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div><span class="text-[11px] text-slate-500 block">별지1.</span><h1 class="text-xl font-bold font-serif">고객거래 확인서 [법인ᆞ단체 用]</h1></div>
        <table class="border border-slate-700 text-center text-[10px] w-28">
          <tr class="bg-slate-100"><td class="border border-slate-700 py-0.5">담당자</td><td class="border border-slate-700 py-0.5">부서장</td></tr>
          <tr><td class="border border-slate-700 h-10"></td><td class="border border-slate-700 h-10"></td></tr>
        </table>
      </div>
      <div class="text-[11px] font-bold text-slate-900 flex justify-between pt-1"><span>▶ 고객 기본정보 (위탁자 법인용)</span><span>고객구분(체크): ■ 영리 법인(단체) &nbsp;&nbsp; □ 비영리 법인(단체)</span></div>
      <table class="doc-table">
        <tr><th class="w-1/5">법인(단체)명</th><td class="w-1/3">한글: <strong id="d2-2-name"></strong></td><th class="w-1/5">사업자번호 등 실명번호</th><td id="d2-2-bizno"></td></tr>
        <tr><th>본점 주소</th><td colspan="3" id="d2-2-addr"></td></tr>
        <tr><th>사업장 주소</th><td colspan="3" id="d2-2-baddr"></td></tr>
        <tr><th>업종 (업태/종목)</th><td colspan="3">부동산업 / 신탁 및 자산관리 등</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 대표자 정보</div>
      <table class="doc-table">
        <tr><th class="w-1/5">대표자 성명</th><td class="w-1/3"><strong id="d2-2-rep"></strong></td><th class="w-1/5">국적</th><td>대한민국</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 거래 정보 (EDD 대상)</div>
      <table class="doc-table">
        <tr><th class="w-1/4">거래 목적</th><td>□ 토지신탁 &nbsp;&nbsp; ■ 담보신탁 &nbsp;&nbsp; □ 분양관리신탁 &nbsp;&nbsp; □ 기타</td></tr>
        <tr><th>거래 자금의 원천 및 출처</th><td>■ 운영자금 &nbsp;&nbsp; □ 차입금 &nbsp;&nbsp; □ 유형자산처분 &nbsp;&nbsp; □ 기타</td></tr>
      </table>
      <div class="bg-slate-50 p-3 border border-slate-300 rounded text-[11px] mt-4">상기 기재한 내용이 사실과 일치하며, 고객확인과 관련하여 내용을 충분히 안내 받았음을 확인합니다.</div>
      <div class="text-right pt-6 text-[12px] space-y-2">
        <p class="font-bold text-slate-900" id="d2-2-date"></p>
        <p>[대표자 작성 시] &nbsp;&nbsp; <strong id="d2-2-sig-full" class="underline text-sm font-bold"></strong> &nbsp;&nbsp; (인)</p>
      </div>
    </div>

    <!-- 2-③. 고객거래확인서 [법인·단체 用] (우선수익자 금융기관용) -->
    <div id="doc-view-2-3" class="doc-paper hidden p-8 sm:p-14 text-xs leading-relaxed space-y-4">
      <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div><span class="text-[11px] text-slate-500 block">별지1.</span><h1 class="text-xl font-bold font-serif">고객거래 확인서 [법인ᆞ단체 用]</h1></div>
        <table class="border border-slate-700 text-center text-[10px] w-28">
          <tr class="bg-slate-100"><td class="border border-slate-700 py-0.5">담당자</td><td class="border border-slate-700 py-0.5">부서장</td></tr>
          <tr><td class="border border-slate-700 h-10"></td><td class="border border-slate-700 h-10"></td></tr>
        </table>
      </div>
      <div class="text-[11px] font-bold text-slate-900 flex justify-between pt-1"><span>▶ 고객 기본정보 (1순위 우선수익자 - 금융기관)</span><span>고객구분: ■ 영리 법인(단체) &nbsp;&nbsp; □ 비영리 법인(단체)</span></div>
      <table class="doc-table">
        <tr><th class="w-1/5">법인(단체)명</th><td class="w-1/3">한글: <strong id="d2-3-name"></strong></td><th class="w-1/5">사업자번호 등 실명번호</th><td id="d2-3-bizno"></td></tr>
        <tr><th>본점 주소</th><td colspan="3" id="d2-3-addr"></td></tr>
        <tr><th>업종 (업태/종목)</th><td>금융업</td><th>설립목적</th><td>대금업</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 대표자 정보</div>
      <table class="doc-table">
        <tr><th class="w-1/5">대표자 성명</th><td class="w-1/3"><strong id="d2-3-rep"></strong></td><th class="w-1/5">국적</th><td>대한민국</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 거래 정보 (EDD 대상)</div>
      <table class="doc-table">
        <tr><th class="w-1/4">거래 목적</th><td>□ 토지신탁 &nbsp;&nbsp; ■ 담보신탁 (우선수익권 담보취득) &nbsp;&nbsp; □ 기타</td></tr>
        <tr><th>거래 자금의 출처</th><td>■ 금융자금 (대출채권 피담보채권 확보)</td></tr>
      </table>
      <div class="bg-slate-50 p-3 border border-slate-300 rounded text-[11px] mt-4">상기 기재한 내용이 사실과 일치하며, 고객확인과 관련하여 내용을 충분히 안내 받았음을 확인합니다.</div>
      <div class="text-right pt-6 text-[12px] space-y-2">
        <p class="font-bold text-slate-900" id="d2-3-date"></p>
        <p>[대표자 작성 시] &nbsp;&nbsp; <strong id="d2-3-sig-full" class="underline text-sm font-bold"></strong> &nbsp;&nbsp; (인)</p>
      </div>
    </div>

    <!-- 3-①. 실제소유자확인서 [법인·단체 用] (위탁자 법인) -->
    <div id="doc-view-3-1" class="doc-paper hidden p-8 sm:p-14 text-xs leading-relaxed space-y-4">
      <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div><span class="text-[11px] text-slate-500 block">별지2.</span><h1 class="text-xl font-bold font-serif">실제소유자 확인서 [법인ᆞ단체 用]</h1></div>
        <table class="border border-slate-700 text-center text-[10px] w-28">
          <tr class="bg-slate-100"><td class="border border-slate-700 py-0.5">담당자</td><td class="border border-slate-700 py-0.5">부서장</td></tr>
          <tr><td class="border border-slate-700 h-10"></td><td class="border border-slate-700 h-10"></td></tr>
        </table>
      </div>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 법인(단체) 기본 정보 (위탁자 법인)</div>
      <table class="doc-table">
        <tr><th class="w-1/4">법인(단체)명</th><td class="w-1/4"><strong id="d3-1-name"></strong></td><th class="w-1/4">사업자번호 등 실명번호</th><td class="w-1/4" id="d3-1-bizno"></td></tr>
        <tr><th>실제소유자 확인 생략 여부</th><td colspan="3">□ 대상 &nbsp;&nbsp; <strong>■ 미대상</strong> (자본시장법 제159조 제출대상 외 일반영리법인)</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 실제소유자 확인 정보 (3단계 절차)</div>
      <table class="doc-table">
        <tr><th class="w-1/4">실제소유자 확인 방법</th><td colspan="2">■ 주주명부 &nbsp;&nbsp; □ 사원명부 &nbsp;&nbsp; □ 이사명부 &nbsp;&nbsp; □ 정관/규약</td></tr>
        <tr><th>[1단계]</th><td colspan="2">1-① 25%이상의 지분을 소유한 자가 있으며 확인됩니까? &nbsp; <strong>■ 예</strong> &nbsp;&nbsp; □ 아니오</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 실제소유자 정보 (자연인)</div>
      <table class="doc-table">
        <tr><th class="w-1/4">성명</th><td class="w-1/4"><strong id="d3-1-owner-name"></strong></td><th class="w-1/4">국적</th><td class="w-1/4">대한민국</td></tr>
        <tr><th>생년월일/식별정보</th><td id="d3-1-owner-birth">-</td><th>지분율(%)</th><td><strong id="d3-1-owner-share">100%</strong></td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 작성자 정보</div>
      <table class="doc-table">
        <tr><th class="w-1/4">성명</th><td class="w-1/4" id="d3-1-author-name"></td><th class="w-1/4">소속 회사명</th><td class="w-1/4" id="d3-1-author-comp"></td></tr>
      </table>
      <div class="text-right pt-6 text-[12px] space-y-2">
        <p class="font-bold text-slate-900" id="d3-1-date"></p>
        <p>작성자 : &nbsp;&nbsp; <strong id="d3-1-sig-full" class="underline text-sm font-bold"></strong> &nbsp;&nbsp; (인)</p>
      </div>
    </div>

    <!-- 3-②. 실제소유자확인서 [법인·단체 用] (우선수익자용 - 금융회사등 생략) -->
    <div id="doc-view-3-2" class="doc-paper hidden p-8 sm:p-14 text-xs leading-relaxed space-y-4">
      <div class="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div><span class="text-[11px] text-slate-500 block">별지2.</span><h1 class="text-xl font-bold font-serif">실제소유자 확인서 [법인ᆞ단체 用]</h1></div>
        <table class="border border-slate-700 text-center text-[10px] w-28">
          <tr class="bg-slate-100"><td class="border border-slate-700 py-0.5">담당자</td><td class="border border-slate-700 py-0.5">부서장</td></tr>
          <tr><td class="border border-slate-700 h-10"></td><td class="border border-slate-700 h-10"></td></tr>
        </table>
      </div>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 법인(단체) 기본 정보</div>
      <table class="doc-table">
        <tr><th class="w-1/4">법인(단체)명</th><td class="w-1/4"><strong id="d3-2-name"></strong></td><th class="w-1/4">사업자번호 등 실명번호</th><td class="w-1/4" id="d3-2-bizno"></td></tr>
        <tr><th>실제소유자 확인 생략 여부</th><td colspan="3"><strong>■ 대상 (□ 국가ᆞ지방자치단체 □ 공공단체 ■ 금융회사등 □ 사업보고서 제출대상)</strong></td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 실제소유자 정보 (확인 생략 대상 - 공란 처리)</div>
      <table class="doc-table bg-slate-50 text-slate-400">
        <tr><th class="w-1/4">성명</th><td class="w-1/4">- (생략) -</td><th class="w-1/4">국적</th><td class="w-1/4">-</td></tr>
      </table>
      <div class="text-[11px] font-bold text-slate-900 pt-1">▶ 작성자 정보</div>
      <table class="doc-table">
        <tr><th class="w-1/4">성명</th><td class="w-1/4" id="d3-2-author-name"></td><th class="w-1/4">소속 기관명</th><td class="w-1/4" id="d3-2-author-comp"></td></tr>
      </table>
      <div class="text-right pt-6 text-[12px] space-y-2">
        <p class="font-bold text-slate-900" id="d3-2-date"></p>
        <p>작성자 : &nbsp;&nbsp; <strong id="d3-2-sig-full" class="underline text-sm font-bold"></strong> &nbsp;&nbsp; (인)</p>
      </div>
    </div>
  `;
}
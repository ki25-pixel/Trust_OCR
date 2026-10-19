// =========================================================================
// 1. 고객거래확인서 & 실제소유자확인서 빌더 (Word 호환 표준 Table 구조)
// =========================================================================

window.buildIndividualCddHtml = function(party, roleLabel, formattedDate, isPageBreak) {
  const name = party.name || '';
  const idNum = party.idNumber || '';
  const addr = party.address || '';

  return `
    <div class="${isPageBreak ? 'word-page-break' : ''}" style="${isPageBreak ? 'page-break-before: always; margin-top: 30pt;' : ''}">
      <table class="doc-table" style="width:100%; border:none; margin-bottom:6pt;">
        <tr style="border:none;">
          <td style="border:none; width:70%; vertical-align:bottom; padding:0;">
            <div style="font-size:9.5pt; font-weight:bold; color:#1d4ed8;">별지1. [${roleLabel}]</div>
            <div style="font-size:15pt; font-weight:bold; font-family:'Batang', serif;">고객거래 확인서 [개인ᆞ개인사업자 用]</div>
          </td>
          <td style="border:none; width:30%; padding:0;" align="right">
            <table class="doc-table" style="width:120pt; border:1pt solid #000; text-align:center; font-size:8.5pt;">
              <tr><th style="width:50%; padding:2pt;">담당자</th><th style="width:50%; padding:2pt;">부서장</th></tr>
              <tr><td style="height:28pt;">&nbsp;</td><td style="height:28pt;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="font-size:8.5pt; line-height:1.4; margin-bottom:6pt;">
        「특정 금융거래정보의 보고 및 이용 등에 관한 법률」 제5조의2에 따라 고객님께서 회사와 거래 시에는 고객확인 및 검증을 위하여 아래의 내용을 기재하셔야 하며, 제공하신 정보는 동법에서 정한 용도 외의 목적으로 사용되지 않습니다. 회사는 기재된 정보확인 및 검증을 위해 추가적인 문서 및 자료 제출을 요청할 수 있으며, 이를 거부하거나 검증이 불가능한 경우 거래가 제한되거나 거절됩니다.
      </p>

      <div style="font-size:9.5pt; font-weight:bold; margin-top:6pt; margin-bottom:3pt;">
        ▶ 고객 기본정보 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&

// 1. 개인용 고객거래확인서 생성 함수
window.buildIndividualCddHtml = function(party, roleLabel, formattedDate, isPageBreak) {
  const name = party.name || '';
  const idNum = party.idNumber || '';
  const addr = party.address || '';

  return `
    ${isPageBreak ? '<p class="word-page-break"><br clear="all" style="mso-special-character:line-break; page-break-before:always;"></p>' : ''}
    <div>
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px;">
        <div>
          <span style="font-size:10pt; font-weight:bold;">별지1. [${roleLabel}]</span>
          <h1 style="font-size:16pt; font-weight:bold; margin:4px 0 0 0; text-align:left;">고객거래 확인서 [개인ᆞ개인사업자 用]</h1>
        </div>
        <table class="doc-table" style="width:120px; text-align:center; font-size:9pt; margin:0;" border="1" cellspacing="0" cellpadding="4">
          <tr style="background-color:#f3f4f6;"><td style="width:50%;">담당자</td><td style="width:50%;">부서장</td></tr>
          <tr><td style="height:35px;">&nbsp;</td><td style="height:35px;">&nbsp;</td></tr>
        </table>
      </div>
      <p style="font-size:9.5pt; line-height:1.4; margin-bottom:8px;">「특정 금융거래정보의 보고 및 이용 등에 관한 법률」 제5조의2에 따라 고객님께서 회사와 거래 시에는 고객확인 및 검증을 위하여 아래의 내용을 기재하셔야 하며, 제공하신 정보는 동법에서 정한 용도 외의 목적으로 사용되지 않습니다. 회사는 기재된 정보확인 및 검증을 위해 추가적인 문서 및 자료 제출을 요청할 수 있으며, 이를 거부하거나 검증이 불가능한 경우 거래가 제한되거나 거절됩니다.</p>
      <p style="font-size:10pt; font-weight:bold; margin:8px 0 4px 0;">▶ 고객 기본정보 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&

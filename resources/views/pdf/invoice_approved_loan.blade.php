<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Loan Support Service Agreement – Connected Education</title>
<link href="https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Arial&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: #d0d0d0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #000;
  }

  .page-wrapper {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 0;
    padding: 30px 20px;
  }

  .page-wrapper.single {
    justify-content: center;
  }

  .page {
    background: #fff;
    width: 595px;
    min-height: 842px;
    padding: 40px 45px 50px 45px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    flex-shrink: 0;
  }

/* FROM: */
.page-wrapper {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 0;
    padding: 30px 20px;
}

/* TO: */
.page-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 30px 20px;
}

  .header-note {
    font-size: 8pt;
    color: #000;
    margin-bottom: 18px;
    font-style: italic;
  }

  .page-footer {
    position: absolute;
    bottom: 18px;
    right: 45px;
    font-size: 8.5pt;
    color: #555;
    font-style: italic;
  }

  /* Title block */
  .contract-title-block {
    text-align: center;
    margin-bottom: 14px;
  }

  .contract-title-block .template-note {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    text-decoration: underline;
    margin-bottom: 6px;
  }

  .contract-main-title {
    font-weight: bold;
    font-size: 11pt;
    text-align: center;
    text-decoration: underline;
    margin-bottom: 10px;
  }

  .intro-note {
    font-size: 9pt;
    margin-bottom: 10px;
    line-height: 1.5;
  }

  .intro-note em { font-style: italic; }
  .intro-note u { text-decoration: underline; }
  .intro-note a-like { text-decoration: underline; font-style: italic; }

  .preamble {
    font-size: 9pt;
    line-height: 1.55;
    margin-bottom: 12px;
  }

  .dynamic-name {
    color: #000;
    font-weight: bold;
    font-style: normal;
  }

  /* Sections */
  .section-title {
    font-weight: bold;
    font-size: 9.5pt;
    margin-top: 11px;
    margin-bottom: 5px;
  }

  .section-body {
    font-size: 9pt;
    line-height: 1.55;
    margin-bottom: 4px;
  }

  .section-body p {
    margin-bottom: 3px;
  }

  ul.doc-list {
    margin: 4px 0 4px 28px;
    padding: 0;
  }

  ul.doc-list li {
    list-style-type: disc;
    font-size: 9pt;
    line-height: 1.55;
    margin-bottom: 1px;
  }

  b, strong { font-weight: bold; }
  u { text-decoration: underline; }
  em { font-style: italic; }

  /* Section 6 fee highlight */
  .fee-highlight { font-weight: bold; }

  /* Strikethrough-ish red text in right col */
  .red-bold { color: #c00; font-weight: bold; }

  /* No refund */
  .no-refund { font-weight: bold; text-decoration: underline; }

  /* Cost transparency box */
  .dynamic-box {
    border: 1.5px solid #c00;
    padding: 12px 14px;
    margin: 12px 0;
    background: #fff;
  }

  .dynamic-box .dynamic-label {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    margin-bottom: 6px;
  }

  .dynamic-box .service-name {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    margin-bottom: 6px;
  }

  .dynamic-box .checkbox-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 6px 0;
    font-size: 9pt;
  }

  .dynamic-box .checkbox-line input[type="checkbox"] {
    margin-top: 2px;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .contract-desc-label {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    margin: 8px 0 4px 0;
  }

  .end-dynamic {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    margin-top: 10px;
  }

  /* Signatures */
  .sig-section {
    margin-top: 14px;
  }

  .sig-title {
    font-weight: bold;
    font-size: 9.5pt;
    margin-bottom: 6px;
  }

  .sig-company {
    font-weight: bold;
    font-size: 9pt;
    margin-bottom: 8px;
    text-decoration: underline;
  }

  .sig-line {
    font-size: 9pt;
    line-height: 1.8;
  }

  .sig-line span { font-weight: bold; }

  .sig-seal-box {
    margin-top: 12px;
    width: 150px;
    height: 50px;
    border: 1px solid #000;
  }

  .final-note {
    font-size: 9pt;
    margin-top: 22px;
    line-height: 1.55;
    font-style: italic;
  }

  .final-note u { text-decoration: underline; }

  /* Print / individual page spacing */
  .spread { margin-bottom: 20px; }

  @media print {
    body { background: white; }
    .page-wrapper { padding: 0; gap: 0; }
    .page { box-shadow: none; margin: 0; }
    .page + .page { margin-left: 0; page-break-before: always; }
  }
</style>
</head>
<body>

<!-- ===== SPREAD 1: Page 1 (left) + Page 2 (right) ===== -->
<div class="page-wrapper spread">

  <!-- PAGE 1 -->
  <div class="page">
    <div class="header-note">Thanks for choosing Connected Education for your study abroad journey.</div>

    <div class="contract-title-block">
      <div class="template-note">The BELOW WORDING WILL BE SET THROUGH THE CONTRACT TEMPLATE DATA FIELD – "LOAN SERVICE CONTRACT"</div>
    </div>

    <div class="contract-main-title">LOAN SUPPORT SERVICE AGREEMENT</div>

    <div class="intro-note">
      **Please note this contract is in immediate effect <u>once you agree</u> to the terms and conditions, and a <u><em>confirmation</em></u> of this agreement is sent to your email along with your NID &amp; photo.
    </div>

    <div class="preamble section-body">
      This Agreement ("Agreement") is made between, <span class="dynamic-name">[DYNAMIC CLIENT FULL NAME]</span> (the "Client") and <strong>Connected Education</strong> (the "Service Provider"), for the purpose of setting forth the exclusive terms and conditions by which the Client desires to acquire the below described services from the Service Provider. In consideration of the mutual obligations specified in this agreement, the parties intending to be legally bound hereby, agree to the following:
    </div>

    <div class="section-title">1. PURPOSE OF THE AGREEMENT</div>
    <div class="section-body">
      <p>The Client intends to apply for an <strong>education-related bank loan</strong> from one or more banks or financial institutions in Bangladesh ("Lender"). Connected Education shall provide <strong>loan facilitation, documentation support, and coordination services only</strong>, acting strictly as an education consultant and intermediary. The Client purchases this service to obtain professional assistance and convenience, <strong>not a guaranteed financial outcome</strong>.</p>
    </div>

    <div class="section-title">2. ROLE DISCLOSURE &amp; LIMITATION</div>
    <div class="section-body">
      <p>Connected Education is <u><strong>not a bank, lender, or financial institution</strong></u>. Connected Education does not:</p>
      <ul class="doc-list">
        <li>Approve or reject loans</li>
        <li>Determine interest rates or loan amounts</li>
        <li>Control bank processing or disbursement</li>
        <li>Hold, receive, or manage any loan funds</li>
      </ul>
      <p style="margin-top:4px;">All loan decisions are made <strong>solely by the Lender</strong>.</p>
    </div>

    <div class="section-title">3. SCOPE OF LOAN SUPPORT SERVICES.</div>
    <div class="section-body">
      <p>Connected Education shall provide:</p>
      <p>3.1 Indicative guidance on loan eligibility criteria</p>
      <p>3.2 Bank document checklist preparation and explanation</p>
      <p>3.3 Assistance in compiling required documents</p>
      <p>3.4 Drafting and formatting of supporting letters based on Client-provided information</p>
      <p>3.5 Coordination with bank officials and relationship managers</p>
      <p>3.6 Submission support and reasonable follow-up on application status</p>
      <p style="margin-top:4px;">The Service Provider's responsibility is limited to <strong>professional support services only</strong>.</p>
    </div>

    <div class="section-title">4. NO GUARANTEE DISCLAIMER</div>
    <div class="section-body">
      <p>4.1 Loan approval, amount, interest rate, security requirements, and disbursement timeline are <strong>not guaranteed</strong>.</p>
      <p>4.2 Visa approval is <strong>independent</strong> of loan approval and not guaranteed.</p>
      <p>4.3 No statement shall be interpreted as a promise of outcome.</p>
    </div>

    <div class="section-title">5. CLIENT RESPONSIBILITIES</div>
    <div class="section-body">
      <p>The Client agrees to:</p>
      <p>5.1 Provide accurate, complete, and verifiable information</p>
      <p>5.2 Submit genuine documents only</p>
      <p>5.3 Respond promptly to bank or documentation requests</p>
      <p>5.4 Attend verification meetings or calls if required</p>
      <p>5.5 Review and understand all bank-issued documents before signing</p>
      <p style="margin-top:4px;">False or forged documentation results in <strong>immediate termination</strong> without refund.</p>
    </div>

    <div class="page-footer">Connected.</div>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <div class="header-note">Thanks for choosing Connected Education for your study abroad journey.</div>

    <div class="section-title">6. SERVICE FEES &amp; PAYMENT</div>
    <div class="section-body">
      <p>6.1 Loan Support Service Fee to be received by Connected: <span class="fee-highlight">BDT 5,000 /- (Already included in the loan cost chart).</span></p>
      <p>6.2 This fee is charged for professional services and is <strong>independent of loan outcome</strong>.</p>
      <p>6.3 The service fee does not include any bank-imposed charges.</p>
      <p>6.4 This fee is <u><strong>strictly non-refundable.</strong></u></p>
      <p style="margin-top:5px;">This fee covers professional loan facilitation and documentation support only.</p>
    </div>

    <div class="section-title">7. STRICT NO REFUND POLICY</div>
    <div class="section-body">
      <p><strong>7.1 All fees paid are strictly non-refundable under all circumstances.</strong></p>
      <p>7.2 No refunds shall be issued due to:</p>
      <ul class="doc-list">
        <li>Loan rejection or partial approval</li>
        <li>Bank delays or policy changes</li>
        <li>Visa refusal or delay</li>
        <li>Client withdrawal or non-cooperation</li>
      </ul>
      <p style="margin-top:4px;">7.3 The Client waives all rights to refunds, chargebacks, or reversals.</p>
    </div>

    <div class="section-title">8. BANK FEES, INTEREST &amp; SECURITY OBLIGATIONS</div>

    <div class="section-body">
      <p><strong>8.1 Bank Service Charges</strong></p>
      <p>All bank charges, including but not limited to:</p>
      <ul class="doc-list">
        <li>Processing fees</li>
        <li>CIB charges</li>
        <li>Interest charges</li>
        <li>Legal, valuation, and documentation fees</li>
      </ul>
      <p style="margin-top:4px;">are payable <strong>directly by the Client to the Lender</strong>.</p>
      <p><u>Connected Education does not collect or control these charges.</u></p>
    </div>

    <div class="section-body" style="margin-top:8px;">
      <p><strong>8.2 Interest Rates &amp; Repayment</strong></p>
      <p>8.2.1 Interest rates are determined solely by the Lender and may change per bank policy.</p>
      <p>8.2.2 Connected Education does not guarantee or negotiate interest rates.</p>
      <p>8.2.3 The Client is fully responsible for: Interest payments</p>
      <p style="margin-top:4px;">Any default or enforcement action is strictly between the Client and the Lender.</p>
    </div>

    <div class="section-body" style="margin-top:8px;">
      <p><strong>8.3 Security Deposits, Collateral &amp; Guarantees</strong></p>
      <p>8.3.1 The Lender will require a Loan Security Deposit</p>
      <p>8.3.2 <u>All</u> security is provided <strong>directly by the Client to the Lender</strong>.</p>
      <p>8.3.3 Connected Education:</p>
      <ul class="doc-list">
        <li>Does not hold or manage any security</li>
        <li>Is not responsible for valuation, lien creation, or release</li>
        <li>Bears no liability if security is enforced by the bank</li>
      </ul>
    </div>

    <div class="page-footer">Connected.</div>
  </div>

</div><!-- end spread 1 -->


<!-- ===== SPREAD 2: Page 3 (left) + Page 4 (right) ===== -->
<div class="page-wrapper spread">

  <!-- PAGE 3 -->
  <div class="page">
    <div class="header-note">Thanks for choosing Connected Education for your study abroad journey.</div>

    <div class="section-body" style="margin-bottom:8px;">
      <p><strong>8.4 Loan Disbursement &amp; Fund Utilization</strong></p>
      <p>8.4.1 The Lender controls:</p>
      <ul class="doc-list">
        <li>Disbursement method</li>
        <li>Timing and staging of funds</li>
      </ul>
      <p style="margin-top:4px;">8.4.2 Funds may be:</p>
      <ul class="doc-list">
        <li>Paid directly to the institution, or</li>
        <li>Released to the Client's account with restrictions</li>
      </ul>
      <p style="margin-top:4px;">Connected Education has no control over disbursement decisions.</p>
    </div>

    <div class="section-body" style="margin-bottom:8px;">
      <p><strong>8.5 No Financial or Legal Advice</strong></p>
      <p>Connected Education does not provide financial, investment, or legal advice regarding loan agreements.<br>Clients are advised to consult the Lender or independent advisors.</p>
    </div>

    <div class="section-title">9. BANK CONTROL &amp; FUND VERIFICATION (CREDIBILITY CLAUSE)</div>
    <div class="section-body">
      <p>9.1 If a loan is sanctioned:</p>
      <ul class="doc-list">
        <li>A loan account is opened <strong>in the Client's name</strong></li>
        <li>A <strong>bank-issued debit card</strong> is provided</li>
        <li>Mobile/online banking access is provided per bank policy</li>
      </ul>
      <p style="margin-top:4px;">9.2 The Client may verify funds:</p>
      <ul class="doc-list">
        <li>Through the bank's official app</li>
        <li>At any branch of the issuing bank</li>
      </ul>
      <p style="margin-top:4px;">9.3 Connected Education never accesses or controls loan funds.</p>
    </div>

    <div class="section-title">10. CONFIDENTIALITY &amp; DATA CONSENT</div>
    <div class="section-body">
      <p>10.1 Client data shall be used solely for service delivery.</p>
      <p>10.2 The Client authorizes sharing of information with:</p>
      <ul class="doc-list">
        <li>Banks</li>
        <li>Notary, translation, courier services if required</li>
      </ul>
      <p style="margin-top:4px;">10.3 The Client consents to communication via electronic means.</p>
    </div>

    <div class="section-title">11. THIRD-PARTY SERVICES</div>
    <div class="section-body">
      <p>Third-party services are arranged as convenience only. Connected Education is not liable for third-party actions or delays.</p>
    </div>

    <div class="section-title">12. TERMINATION</div>
    <div class="section-body">
      <p>12.1 Connected Education may terminate immediately for:</p>
      <ul class="doc-list">
        <li>Fraud or misrepresentation</li>
        <li>Illegal requests</li>
        <li>Material breach of this Agreement</li>
      </ul>
      <p style="margin-top:4px;">12.2 No refund shall be issued upon termination.</p>
    </div>

    <div class="page-footer">Connected.</div>
  </div>

  <!-- PAGE 4 -->
  <div class="page">
    <div class="header-note">Thanks for choosing Connected Education for your study abroad journey.</div>

    <div class="section-title">13. LIMITATION OF LIABILITY</div>
    <div class="section-body">
      <p>Connected Education is not liable for bank decisions, delays, or financial losses.<br>Any liability is limited to proven gross negligence, capped at the service fee paid.</p>
    </div>

    <div class="section-title">14. INDEMNITY</div>
    <div class="section-body">
      <p>The Client indemnifies Connected Education against claims arising from:</p>
      <ul class="doc-list">
        <li>False information</li>
        <li>Forged documents</li>
        <li>Breach of law</li>
      </ul>
    </div>

    <div class="section-title">15. DISPUTE RESOLUTION &amp; JURISDICTION</div>
    <div class="section-body">
      <p>Disputes shall first be addressed amicably. Failing resolution, courts of <strong>Dhaka, Bangladesh</strong> shall have exclusive jurisdiction.</p>
    </div>

    <div class="section-title">16. GOVERNING LAW</div>
    <div class="section-body">
      <p>This Agreement is governed by the laws of the <strong>People's Republic of Bangladesh</strong>.</p>
    </div>

    <div class="section-title">17. ENTIRE AGREEMENT</div>
    <div class="section-body">
      <p>This document constitutes the entire agreement between the Parties.<br>Any modification must be in writing and signed by both Parties.</p>
    </div>

    <div class="section-title">18. CLIENT ACKNOWLEDGEMENT</div>
    <div class="section-body">
      <p>By signing, the Client confirms understanding of:</p>
      <ul class="doc-list">
        <li>No refund policy</li>
        <li>Bank-controlled funds</li>
        <li>Interest and security obligations</li>
        <li>Connected Education's limited role</li>
      </ul>
      <p style="margin-top:5px;">The Client acknowledges that <strong>interest obligations continue regardless of visa outcome</strong> unless otherwise agreed with the bank in writing. The refund amount will be paid out to client by the end of the loan term.</p>
    </div>

    <div class="section-title">CLIENT ACKNOWLEDGEMENT OF COSTS</div>
    <div class="section-body">
      <p>By signing this Agreement, the Client confirms that:</p>
      <ul class="doc-list">
        <li><strong>All loan-related costs have been explained</strong></li>
        <li>No cost has been represented as <strong>fixed or guaranteed</strong></li>
        <li>Final amounts depend solely on the bank</li>
        <li>Connected Education has <strong>no control</strong> over bank pricing or policies.</li>
      </ul>
    </div>

    <div class="section-body" style="margin-top:10px;">
      <p><strong>[SEE NEXT PAGE FOR ALL COST DETAILS]</strong></p>
    </div>

    <div class="page-footer">Connected.</div>
  </div>

</div><!-- end spread 2 -->


<!-- ===== PAGE 5: Cost Transparency (single, centered) ===== -->
<div class="page-wrapper single">

  <div class="page">
    <div class="header-note">Thanks for choosing Connected Education for your study abroad journey.</div>

    <div class="contract-main-title" style="margin-top:8px; font-size:10pt;">SECTION: COST TRANSPARENCY – LOAN-RELATED COSTS &amp; CHARGES</div>

    <div class="section-body" style="margin-top:10px;">
      <p>This section provides <u>a overview</u> of all <strong>costs</strong> that will be incurred by the Client in connection with an education loan arranged through a bank or financial institution.</p>
    </div>

    <div class="section-body" style="margin-top:8px;">
      <p>The Client acknowledges that Connected Education's service fee of 5,000 BDT is already included within the quoted loan cost. All other loan-related charges are <strong>determined solely by the bank.</strong></p>
    </div>

    <div class="dynamic-box">
      <div class="dynamic-label">[DYNAMIC SECTION] – We need 2 fields for this section: " Service Name" &amp; "Contract Description"</div>

      <div class="service-name">Service Name: 60 Lacs BDT Loan (6 months)</div>

      <div class="checkbox-line">
        <input type="checkbox" disabled>
        <span>60 Lac BDT Loan Service for 6 months = 170,000 BDT/-</span>
      </div>

      <div class="contract-desc-label">Contract Description for 60 <u>Lacs BDT Loan</u> □</div>

      <div class="section-body">
        <p>Client has purchased <u>60,00,000</u> BDT loan <strong>service</strong>. Client deposited 170,000 BDT. Will receive a refund of 16,800 BDT <u>within 3 months from the date of purchase.</u></p>
      </div>

      <div class="end-dynamic">[END OF DYNAMIC SECTION]</div>
    </div>

    <div class="sig-section">
      <div class="sig-title">SIGNATURES</div>
      <div class="sig-company">Connected Education</div>
      <div class="sig-line">
        <p>Signatory: Syed <u>Md Zeehad</u></p>
        <p>Position: CEO</p>
        <p>Service Provider's Seal &amp; Signature:</p>
      </div>
      <div class="sig-seal-box"></div>
    </div>

    <div class="final-note">
      **Please note this contract will be in immediate effect <u>once you agree</u> to the terms and conditions, and a <u><em>confirmation</em></u> of this agreement is sent to your email along with your NID &amp; photo.
    </div>

    <div class="page-footer">Connected.</div>
  </div>

</div><!-- end page 5 -->

</body>
</html>
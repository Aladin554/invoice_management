@php
$customer = $invoice->customer;
$fullName = trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
$fullName = $fullName !== '' ? $fullName : 'Client';

$initials = collect(preg_split('/\s+/', $fullName) ?: [])
->filter()
->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
->take(3)
->implode('');

$studentPhotoSrc = is_string($studentPhotoSrc ?? null) && trim($studentPhotoSrc) !== '' ? $studentPhotoSrc : null;
$hasStudentPhoto = $studentPhotoSrc !== null;
$serviceProviderSignatureSrc = is_string($serviceProviderSignatureSrc ?? null) && trim($serviceProviderSignatureSrc) !== ''
    ? $serviceProviderSignatureSrc
    : null;
$showServiceProviderSignature = $invoice->status === 'approved' && $serviceProviderSignatureSrc !== null;

$hasSignatureDetails =
filled($invoice->student_signature_name) ||
filled($invoice->student_signed_at) ||
$hasStudentPhoto;
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Loan Support Service Agreement</title>
    <style>
        @page {
            margin: 34px 38px 52px;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9pt;
            line-height: 1.16;
            color: #000;
            margin: 0;
        }

        .page-break {
            page-break-before: always;
        }

        .top-bar {
            width: 100%;
            border-collapse: collapse;
        }

        .top-bar td {
            vertical-align: top;
        }

        .top-bar .message {
            padding-right: 16px;
        }

        .initial-box {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            border: 1px solid #000;
            width: 120px;
            height: 60px;
            text-align: center;
            font-size: 8pt;
            padding: 6px 4px;
        }

        h1 {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            margin: 8px 0 18px;
        }

        h2 {
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
            margin: 3px 0;
        }

        .section-heading {
            margin-bottom: 16px;
        }

        h3 {
            font-size: 9pt;
            font-weight: bold;
            margin: 12px 0 6px;
        }

        p {
            margin: 0 0 10px;
        }

        ul {
            margin: 0 0 10px 18px;
            padding: 0;
        }

        li {
            margin-bottom: 3px;
        }

        .bold,
        strong {
            font-weight: bold;
        }

        .italic {
            font-style: italic;
        }

        .underline {
            text-decoration: underline;
        }

        .box {
            border: 1px solid #000;
            padding: 12px;
            margin-top: 12px;
        }

        .dynamic-box {
            border: 1px solid #000;
            padding: 12px;
            margin: 14px 0;
        }

        .exhibit-box {
            padding: 0;
            margin-top: 12px;
        }

        .red {
            color: #000;
            font-weight: bold;
        }

        .checkbox-list li {
            list-style: none;
        }

        .checkbox-list li,
        .service-line {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
        }

        .service-line {
            margin: 0 0 7px;
        }

        .service-description {
            margin: 0 0 10px 18px;
        }

        .service-description p,
        .service-description ul,
        .service-description ol {
            margin: 0 0 6px;
        }

        .service-description ul,
        .service-description ol {
            padding-left: 16px;
        }

        .service-description li {
            margin-bottom: 2px;
        }

        .service-description > :last-child {
            margin-bottom: 0;
        }

        .qa-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
        }

        .qa-table td {
            border: 1px solid #000;
            padding: 8px 10px;
            vertical-align: top;
        }

        .qa-question {
            width: 44%;
            font-weight: bold;
            background: #f3f3f3;
        }

        .signature-box {
            margin-top: 14px;
        }

        .signature-photo {
            margin-top: 10px;
            width: 120px;
            height: auto;
            border: 1px solid #000;
            padding: 4px;
        }

        .service-provider-signature {
            display: block;
            margin-top: 8px;
            width: 160px;
            max-width: 100%;
            height: auto;
        }

        .footer-note {
            margin-top: 14px;
            font-size: 8pt;
        }

        .compact {
            margin-bottom: 7px;
        }

        .page-footer {
            position: fixed;
            right: 0;
            bottom: -26px;
            font-family: "Abril Fatface", Georgia, "Times New Roman", serif;
            font-size: 14pt;
            font-weight: normal;
            letter-spacing: 0.02em;
            text-align: right;
            text-transform: lowercase;
        }

        .section-num {
            font-weight: bold;
        }
    </style>
</head>

<body>

    <div class="page-footer">connected.</div>

    <table class="top-bar">
        <tr>
            <td class="message">
                <p>Thanks for choosing Connected Education for your study abroad journey.</p>
            </td>
        </tr>
    </table>

    <h3 style="font-size: 9pt; margin: 8px 0 10px;">Date: {{ optional($invoice->invoice_date)->format('Y-m-d') ?: '-' }}</h3>

    <h1>LOAN SUPPORT SERVICE AGREEMENT</h1>

    <p class="italic bold">
        **Please note this contract is in immediate effect <span class="underline">once you agree</span> to the terms and conditions, and a <span class="underline">confirmation</span> of this agreement is sent to your email along with your NID &amp; photo.
    </p>

    <p>
        This Agreement ("Agreement") is made between <span class="bold">[DYNAMIC CLIENT FULL NAME]</span> (the "Client") and <strong>Connected Education</strong> (the "Service Provider"), for the purpose of setting forth the exclusive terms and conditions by which the Client desires to acquire the below described services from the Service Provider. In consideration of the mutual obligations specified in this Agreement, the parties intending to be legally bound hereby, agree to the following:
    </p>

    <h3>1. PURPOSE OF THE AGREEMENT</h3>

    <p>The Client intends to apply for an <span class="underline">education-related bank loan</span> from one or more banks or financial institutions in Bangladesh ("Lender"). Connected Education shall provide <strong>loan facilitation, documentation support, and coordination services only</strong>, acting strictly as an education consultant and intermediary. The Client purchases this service to obtain professional assistance and convenience, <strong>not a guaranteed financial outcome</strong>.</p>

    <h3>2. ROLE DISCLOSURE &amp; LIMITATION</h3>

    <p>Connected Education is <span class="underline bold">not a bank, lender, or financial institution.</span> Connected Education does not:</p>

    <ul>
        <li>Approve or reject loans</li>
        <li>Determine interest rates or loan amounts</li>
        <li>Control bank processing or disbursement</li>
        <li>Hold, receive, or manage any loan funds</li>
    </ul>

    <p>All loan decisions are made <strong>solely by the Lender.</strong></p>

    <h3>3. SCOPE OF LOAN SUPPORT SERVICES.</h3>

    <p>Connected Education shall provide:</p>
    <p class="compact">3.1 Indicative guidance on loan eligibility criteria</p>
    <p class="compact">3.2 Bank document checklist preparation and explanation</p>
    <p class="compact">3.3 Assistance in compiling required documents</p>
    <p class="compact">3.4 Drafting and formatting of supporting letters based on Client-provided information</p>
    <p class="compact">3.5 Coordination with bank officials and relationship managers</p>
    <p class="compact">3.6 Submission support and reasonable follow-up on application status</p>

    <p>The Service Provider's responsibility is limited to <strong>professional support services only</strong>.</p>

    <h3>4. NO GUARANTEE DISCLAIMER</h3>

    <p class="compact">4.1 Loan approval, amount, interest rate, security requirements, and disbursement timeline are <strong>not guaranteed</strong>.</p>
    <p class="compact">4.2 Visa approval is <strong>independent</strong> of loan approval and not guaranteed.</p>
    <p>4.3 No statement shall be interpreted as a promise of outcome.</p>

    <h3>5. CLIENT RESPONSIBILITIES</h3>

    <p>The Client agrees to:</p>
    <p class="compact">5.1 Provide accurate, complete, and verifiable information</p>
    <p class="compact">5.2 Submit genuine documents only</p>
    <p class="compact">5.3 Respond promptly to bank or documentation requests</p>
    <p class="compact">5.4 Attend verification meetings or calls if required</p>
    <p>5.5 Review and understand all bank-issued documents before signing</p>

    <p>False or forged documentation results in <strong>immediate termination</strong> without refund.</p>

    <h3>6. SERVICE FEES &amp; PAYMENT</h3>

    <p class="compact">6.1 Loan Support Service Fee to be received by Connected: <strong>BDT 5,000 /- (Already included in the loan cost chart)</strong></p>
    <p class="compact">6.2 This fee is charged for professional services and is <strong>independent of loan outcome.</strong></p>
    <p class="compact">6.3 The service fee does not include any bank-imposed charges.</p>
    <p>6.4 This fee is <span class="bold underline">strictly non-refundable.</span></p>

    <p>This fee covers professional loan facilitation and documentation support only.</p>

    <h3>7. STRICT NO REFUND POLICY</h3>

    <p><strong>7.1 All fees paid are strictly non-refundable under all circumstances.</strong></p>
    <p>7.2 No refunds shall be issued due to:</p>

    <ul>
        <li>Loan rejection or partial approval</li>
        <li>Bank delays or policy changes</li>
        <li>Visa refusal or delay</li>
        <li>Client withdrawal or non-cooperation</li>
    </ul>

    <p>7.3 The Client waives all rights to refunds, chargebacks, or reversals.</p>

    <h3>8. BANK FEES, INTEREST &amp; SECURITY OBLIGATIONS</h3>

    <h3 style="font-weight: bold; margin-top: 6px;">8.1 Bank Service Charges</h3>

    <p>All bank charges, including but not limited to:</p>

    <ul>
        <li>Processing fees</li>
        <li>CIB charges</li>
        <li>Interest charges</li>
        <li>Legal, valuation, and documentation fees</li>
    </ul>

    <p>are payable <strong>directly by the Client to the Lender.</strong></p>

    <p><span class="underline italic">Connected Education does not collect or control these charges.</span></p>

    <h3 style="font-weight: bold; margin-top: 6px;">8.2 Interest Rates &amp; Repayment</h3>

    <p class="compact">8.2.1 Interest rates are determined solely by the Lender and may change per bank policy.</p>
    <p class="compact">8.2.2 Connected Education does not guarantee or negotiate interest rates.</p>
    <p>8.2.3 The Client is fully responsible for: Interest payments</p>

    <p>Any default or enforcement action is strictly between the Client and the Lender.</p>

    <h3 style="font-weight: bold; margin-top: 6px;">8.3 Security Deposits, Collateral &amp; Guarantees</h3>

    <p class="compact">8.3.1 The Lender will require a Loan Security Deposit</p>
    <p>8.3.2 All security is provided <strong>directly by the Client to the Lender.</strong></p>
    <p>8.3.3 Connected Education:</p>

    <ul>
        <li>Does not hold or manage any security</li>
        <li>Is not responsible for valuation, lien creation, or release</li>
        <li>Bears no liability if security is enforced by the bank</li>
    </ul>

    <!-- <div class="page-break"></div> -->

    <h3>8.4 Loan Disbursement &amp; Fund Utilization</h3>

    <p>8.4.1 The Lender controls:</p>

    <ul>
        <li>Disbursement method</li>
        <li>Timing and staging of funds</li>
    </ul>

    <p>8.4.2 Funds may be:</p>

    <ul>
        <li>Paid directly to the institution, or</li>
        <li>Released to the Client's account with restrictions</li>
    </ul>

    <p>Connected Education has no control over disbursement decisions.</p>

    <h3>8.5 No Financial or Legal Advice</h3>

    <p>Connected Education does not provide financial, investment, or legal advice regarding loan agreements.</p>
    <p>Clients are advised to consult the Lender or independent advisors.</p>

    <h3>9. BANK CONTROL &amp; FUND VERIFICATION (CREDIBILITY CLAUSE)</h3>

    <p>9.1 If a loan is sanctioned:</p>

    <ul>
        <li>A loan account is opened <strong>in the Client's name</strong></li>
        <li>A <strong>bank-issued debit card</strong> is provided</li>
        <li>Mobile/online banking access is provided per bank policy</li>
    </ul>

    <p>9.2 The Client may verify funds:</p>

    <ul>
        <li>Through the bank's official app</li>
        <li>At any branch of the issuing bank</li>
    </ul>

    <p>9.3 Connected Education never accesses or controls loan funds.</p>

    <h3>10. CONFIDENTIALITY &amp; DATA CONSENT</h3>

    <p class="compact">10.1 Client data shall be used solely for service delivery.</p>
    <p>10.2 The Client authorizes sharing of information with:</p>
    <ul>
        <li>Banks</li>
        <li>Notary, translation, courier services if required</li>
    </ul>

    <p>10.3 The Client consents to communication via electronic means.</p>

    <h3>11. THIRD-PARTY SERVICES</h3>

    <p>Third-party services are arranged as convenience only. Connected Education is not liable for third-party actions or delays.</p>

    <h3>12. TERMINATION</h3>

    <p>12.1 Connected Education may terminate immediately for:</p>
    <ul>
        <li>Fraud or misrepresentation</li>
        <li>Illegal requests</li>
        <li>Material breach of this Agreement</li>
    </ul>

    <p>12.2 No refund shall be issued upon termination.</p>

    <h3>13. LIMITATION OF LIABILITY</h3>

    <p>Connected Education is not liable for bank decisions, delays, or financial losses.</p>
    <p>Any liability is limited to proven gross negligence, capped at the service fee paid.</p>

    <h3>14. INDEMNITY</h3>

    <p>The Client indemnifies Connected Education against claims arising from:</p>
    <ul>
        <li>False information</li>
        <li>Forged documents</li>
        <li>Breach of law</li>
    </ul>

    <h3>15. DISPUTE RESOLUTION &amp; JURISDICTION</h3>

    <p>Disputes shall first be addressed amicably. Failing resolution, courts of <strong>Dhaka, Bangladesh</strong> shall have exclusive jurisdiction.</p>

    <h3>16. GOVERNING LAW</h3>

    <p>This Agreement is governed by the laws of the <strong>People's Republic of Bangladesh</strong>.</p>

    <h3>17. ENTIRE AGREEMENT</h3>

    <p>This document constitutes the entire agreement between the Parties.</p>
    <p>Any modification must be in writing and signed by both Parties.</p>

    <h3>18. CLIENT ACKNOWLEDGEMENT</h3>

    <p>By signing, the Client confirms understanding of:</p>
    <ul>
        <li>No refund policy</li>
        <li>Bank-controlled funds</li>
        <li>Interest and security obligations</li>
        <li>Connected Education's limited role</li>
    </ul>

    <p>The Client acknowledges that <strong>interest obligations continue regardless of visa outcome</strong> unless otherwise agreed with the bank in writing. The refund amount will be paid out to client by the end of the loan term.</p>

    <h3>CLIENT ACKNOWLEDGEMENT OF COSTS</h3>

    <p>By signing this Agreement, the Client confirms that:</p>
    <ul>
        <li>All <strong>loan-related costs have been explained</strong></li>
        <li>No cost has been represented as <strong>fixed or guaranteed</strong></li>
        <li>Final amounts depend solely on the bank</li>
        <li>Connected Education has <strong>no control</strong> over bank pricing or policies.</li>
    </ul>

    <!-- <p style="font-weight: bold;">[SEE NEXT PAGE FOR ALL COST DETAILS]</p>

    <div class="page-break"></div> -->

    <h2 style="text-align: center; margin-bottom: 14px;">SECTION: COST TRANSPARENCY – LOAN-RELATED COSTS &amp; CHARGES</h2>

    <p>This section provides <span class="underline italic">a overview</span> of all costs that will be incurred by the Client in connection with an education loan arranged through a bank or financial institution.</p>

    <p>The Client acknowledges that <strong>Connected Education's service fee of 5,000 BDT is already included within the quoted loan cost.</strong> All other loan-related charges are <strong>determined solely by the bank.</strong></p>

    <div class="dynamic-box">

        @if(!empty($selectedServiceRows))
            @foreach($selectedServiceRows as $serviceRow)
                <p class="service-line">
                    &#9745;
                    <span class="bold">{{ $serviceRow['name'] }}</span> - {{ $serviceRow['amount'] }}
                </p>

                @if(!empty($serviceRow['description_html']))
                    <div class="service-description">
                        {!! $serviceRow['description_html'] !!}
                    </div>
                @endif
            @endforeach
        @else
            <p class="service-line">
                &#9744;
                <span class="bold">No selected service package recorded on this invoice.</span>
            </p>
        @endif

    </div>

    <h3 style="text-decoration: underline; margin-top: 20px; font-weight: bold;">DIGITAL ACCEPTANCE</h3>

    <p>The Client agrees that any form of digital acceptance, including clicking "Confirm &amp; Submit," proceeding after reviewing the contract, or enrolling through the Connected system, shall constitute a legally binding agreement equivalent to a physical signature. The Client confirms that they have reviewed all terms prior to acceptance.</p>

    <p><span class="bold underline">Connected Education</span></p>

    <p><strong>Signatory</strong>: Syed Md Zeehad</p>

    <p><strong>Position</strong>: CEO</p>

    <p><strong>Service Provider's Seal &amp; Signature:</strong></p>
    @if($showServiceProviderSignature)
    <img src="{{ $serviceProviderSignatureSrc }}" alt="Connected Education Signature" class="service-provider-signature">
    @endif

    @if($hasProfileAgreementSection)
    <div class="page-break"></div>

    <h2 class="section-heading">Profile Agreement for the Client:</h2>

    <p>
        This agreement ensures that all details regarding the client's profile are accurately represented and mutually understood. To avoid any discrepancies during the application process, we request the following information from you to ensure the accuracy of your profile and our services.
    </p>

    <table class="qa-table">
        @foreach($profileAgreementRows as $row)
        <tr>
            <td class="qa-question">{{ $row['question'] }}</td>
            <td>{{ $row['answer'] }}</td>
        </tr>
        @endforeach
    </table>
    @endif

    @if($hasSignatureDetails)
    <div class="box signature-box">
        <p class="bold">Client Confirmation</p>
        <p><span class="bold">Signed Name:</span> {{ $invoice->student_signature_name ?: '-' }}</p>
        <p><span class="bold">Signed At:</span> {{ optional($invoice->student_signed_at)->format('Y-m-d H:i') ?: '-' }}</p>
        @if($hasStudentPhoto)
        <p><span class="bold">Student Photo:</span></p>
        <img src="{{ $studentPhotoSrc }}" alt="Student Photo" class="signature-photo">
        @endif
        @if($studentNidSrc)
        <p><span class="bold">National ID:</span></p>
        <img src="{{ $studentNidSrc }}" alt="National ID" class="signature-photo">
        @endif
    </div>
    @endif

    <p class="footer-note">**Please note this contract is in immediate effect <span class="underline">once you agree</span> to the terms and conditions, and a <span class="underline">confirmation</span> of this agreement is sent to your email along with your NID &amp; photo.</p>

    @if(filled($footerText ?? null))
    <p class="footer-note">{{ $footerText }}</p>
    @endif

</body>

</html>

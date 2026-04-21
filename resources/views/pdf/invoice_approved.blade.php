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
    <title>Connected Service Agreement</title>
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
            margin: 8px 0 10px;
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

        .exhibit-box {
            border: 1px solid #000;
            padding: 12px;
            margin-top: 12px;
        }

        .red {
            color: #000;
            font-weight: bold;
        }

        .line {
            display: inline-block;
            border-bottom: 1px solid #000;
            width: 300px;
            min-height: 14px;
            padding: 0 2px 2px;
            vertical-align: bottom;
        }

        .line-empty::after {
            content: " ";
        }

        .short-line {
            width: 200px;
        }

        .long-line {
            width: 350px;
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

        .profile-lines {
            margin-left: 34px;
        }

        .profile-lines p {
            margin-bottom: 7px;
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

    <h3 class="bold">Date: {{ optional($invoice->invoice_date)->format('Y-m-d') ?: '-' }}</h3>

    <h1>STUDY ABROAD SERVICE AGREEMENT</h1>

    <p class="italic bold mt-2">
        **Please note this contract is in immediate effect <span class="underline">once you agree</span> to the terms and conditions, and a <span class="underline">confirmation</span> of this agreement is sent to your email along with your NID &amp; photo.
    </p>

    <p>
        This Agreement ("Agreement") is made between <span class="bold">{{$fullName}}</span> (the "Client") and Connected Education (the "Service Provider"), for the purpose of setting forth the exclusive terms and conditions by which the Client desires to acquire the below described services from the Service Provider. In consideration of the mutual obligations specified in this Agreement, the parties intending to be legally bound hereby, agree to the following:
    </p>

    <p>
        <span class="bold">Description of the Services.</span> Client retains the above Service Provider, and the Service Provider agrees to perform for the Client, the services set forth in <span class="underline">Exhibit A</span> on Page 4 of this Agreement (the "Services"). Any Service outside of the scope as defined in Exhibit A to this Agreement will require a new Agreement for other services agreed to by the Parties.
    </p>

    <p>
        Payments must be made to the Service Provider via mobile payment methods, credit card, cash, cheque, or any other approved method of payment accepted by the Service Provider.
    </p>

    <p>
        Refund will be <strong class="underline">ONLY</strong> issued, if the Client doesn't achieve their desired outcome due to a <span class="bold">fault</span> of the Service Provider which leads to a <strong>negative outcome</strong> in their application process. In such case, client <span class="bold underline">must provide detailed evidence</span> of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client's inquiries expeditiously for more than <span class="bold">48hrs</span>, a refund will be issued. In this case repetitive occurring of such incidents must be shown as evidence. Please note, the Service Provider <span class="underline">will not be liable</span> for any issues arising from the lack of diligence by any <span class="underline">third-party provider</span> such as banks, notary public etc. However, <strong>Service Provider will take any actions required to meet the needs of the Client and provide satisfactory services.</strong>
    </p>

    <p class="bold">Client <span class="underline">will also not be eligible</span> for a refund if:</p>

    <ul>
        <li>Client's academic grade average is below 70% or they have any subject grades below C.</li>
        <li>Client changes their preferences and decides not to continue with the service due to personal reasons.</li>
        <li>Client wishes to discontinue for medical reasons or any accidents in the family.</li>
        <li>Client can't provide required or sufficient documents for their application.</li>
        <li>Client forges document.</li>
        <li>Client willingly takes risks against the Service Provider's recommendations or not willing to take appropriate steps to meet application requirements.</li>
        <li>Client processes their application separately elsewhere without informing the Service Provider.</li>
        <li>Client is unresponsive for more than 2 weeks.</li>
        <li>Client is presented limited institution and program options due to below average academic profile (grades below 70% or C, IELTS score below 6.0 and 5.5 in each band score, no GMAT/GRE scores <span class="underline">etc</span>).</li>
        <li>Client can't reach Service Provider outside of office hours, government holidays and announced breaks.</li>
        <li>Client has an educational gap of over 3 years for an intended Bachelor's degree and over 5 years for an intended Master's degree.</li>
        <li>Client doesn't receive offer of admission from university due to a competitive cut-off score and limited seat availability.</li>
        <li>Client is aged over 28 years.</li>
        <li>Client doesn't receive admission or visa approval due to changes in admission requirements and immigration regulations <strong class="underline">after</strong> their purchase.</li>
        <li>Client changes destination preference after signing up.</li>
        <li>Client purchases service within 2 weeks of application deadline.</li>
    </ul>

    <p>
        <strong>Please note, Client will <span class="underline">STRICTLY</span> not be eligible for a refund on our visa package. No exceptions will be made for any cases. Even if Client pauses their journey during admission phase, and doesn't wish to proceed at all, the visa package fee <span class="underline">will not be refunded</span> under any circumstances.</strong>
    </p>

    <p>
        Refund will be <span class="underline">ONLY</span> issued, if the Client doesn't achieve their desired outcome due to a <span class="bold">fault</span> of the Service Provider. In such case, client <span class="bold underline">must provide detailed evidence</span> of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client's inquiries <strong>repetitively</strong> for more than <span class="bold">48hrs</span>, a refund will be issued. In this case <strong>repetitive</strong> occurring of such incidents must be shown as evidence.
    </p>

    <p>
        Alternatively, in the case of a visa refusal, the Client can choose to re-apply for their visa, where the Service Provider <span class="underline">will not</span> charge any additional fees.
    </p>

    <p><strong>Expenses.</strong> From time to time throughout the duration of this Service Agreement, the Service Provider may incur certain expenses such as application fees, supplemental fees, notarization, tax certificate assessment etc. that are <span class="bold underline">not included</span> as part of the Fee for our Services to this Agreement. The Service Provider agrees to keep an exact record of any and all expenses acquired while performing the Services. The Service Provider will submit an invoice itemizing each expense, along with proof of purchase and receipt, upon completion of such Services. Service Provider agrees to obtain the Client's written consent before making any purchase. Client shall also bear all expenses related to notarization and other administrative fees during the visa process.</p>

    <p><strong>Term and Termination.</strong> This Service Agreement shall be effective on the date hereof and shall continue until the expressly agree upon date of the completion of the Services, unless it is earlier terminated in accordance with the terms of this Agreement. The "Term". The Client understands that the Service Provider may terminate this Agreement at any time if the Client fails to pay for the Services provided under this Agreement or if the Client breaches any other material provision listed in this Service Agreement in the manner as defined above.</p>

    <p><strong>Independent Contractor.</strong> Client and Service Provider expressly agree and understand that the above-listed Service Provider is an independent contractor hired by the Client and nothing in this Agreement shall be construed in any way or manner, to create between them a relationship of employment or employee, principal and agent, partners or any other relationship other than that of independent parties contracting with each other solely for the purpose of carrying out the provisions of the Agreement. The Service Provider is solely responsible for directing and controlling the performance of the Services, including the time, place and manner in which the Services are performed. The Service Provider shall use its best efforts, energy and skill in its own name and in such manner as it sees fit.</p>

    <p><strong>Confidentiality.</strong> Throughout the duration of this Agreement, it may be necessary for the Service Provider to have access to the Client's confidential and protected information for the sole purpose of performing the Services subject to this Agreement. The Service Provider is not permitted to share or disclose such confidential information whatsoever, unless mandated by law, without written permission from the Client. The Service Provider's obligation of confidentiality will survive the termination of this Agreement and stay in place indefinitely.</p>

    <p><strong>Return of Property.</strong> The Service Provider shall promptly return to the Client all copies, whether in written, electronic, or other form or media, of the Client's Confidential Information, or destroy all such copies and certify in writing to the Client that such Confidential Information has been destroyed.</p>

    <p><strong>Exclusivity.</strong> The Client respectively agrees that they are not free to enter into other similar Agreements with other parties offering similar services. In such case their packages will be <span class="underline">IMMEDIATELY CANCELLED</span> WITH NO REFUNDS being applicable.</p>

    <p><strong>Dispute Resolution.</strong> Parties to this Agreement shall first attempt to settle any dispute through good-faith negotiation. If the dispute cannot be settled between the parties via negotiation, either party may initiate mediation or binding arbitration in the court of Dhaka, Bangladesh. If the parties do not wish to mediate or arbitrate the dispute and litigation is necessary, this Agreement will be interpreted based on the laws of Dhaka, Bangladesh, without regard to the conflict of law provisions of such state. The Parties agree dispute will be resolved in a court of competent jurisdiction in Dhaka, Bangladesh.</p>

    <p><strong>Governing Law.</strong> This Service Agreement shall be governed in all respects by the laws of Dhaka, Bangladesh, without regard to the conflict of law provisions of such state. This Agreement shall be binding upon the successors and assigns of the respective parties.</p>

    <p><strong>Legal Fees.</strong> Should a dispute between the named Parties arise lead to legal action, the prevailing Party shall be entitled to any reasonable legal fees, including, but not limited to attorneys' fees.</p>

    <p><strong>Professional Conduct.</strong> Both parties herein agree <span class="bold underline">must meet</span> generally accepted standards of professional conduct.</p>

    <p><span class="italic">***If the client is found to be involved in any baseless activities against Connected leading to harming our brand and reputation, the contract will be immediately breached without prior notice or further discussion. The Service Provider will not refund any fees to the Client.</span></p>

    <p><strong>Amendment.</strong> This Agreement may be amended only by a writing signed by all of the Parties hereto.</p>

    <!-- <p style="text-align: center; font-weight: bold;">[SEE NEXT PAGE FOR SERVICE DETAILS]</p> -->

    <!-- <div class="page-break"></div> -->

    <h2>EXHIBIT A</h2>
    <h2 class="section-heading">SERVICE(S)</h2>

    <p class="mt-3">
        The Client hereby confirms that they have reviewed the available service options and agrees to purchase the following service package and agrees to the corresponding terms, scope of services, and applicable fees outlined herein.
    </p>

    <div class="exhibit-box">
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

    <!-- <div class="page-break"></div> -->

    <p><strong>Please note, the Client shall bear all expenses related to:</strong></p>

    <ul>
        <li>University/College Application Fees</li>
        <li>All Notary and Lawyer Fees</li>
        <li>Property Assessment</li>
        <li>Document Translation</li>
        <li>Transcript Mailing Charges</li>
        <li>Visa Application and Biometric Fees</li>
        <li>Medical Exam Costs</li>
        <li>VFS Visa Application Fee and Biometric Appointment Fee</li>
        <li>Student file opening fee for tuition fee transmittance</li>
    </ul>

    <p><strong>In case, Client seeks:</strong></p>

    <ul>
        <li>Loan support from Service Provider, there will be an additional fee. Please speak with your counsellor.</li>
        <li>Visa Application Documents Notary Service, there will be an additional fee. Please speak with your counsellor.</li>
        <li>Credit card support from Service Provider for purchases below $300, there will be a 2,000 BDT fee which is non-refundable. Over $300, will be charged a 5,000 BDT fee. <span class="underline bold">(non-refundable)</span> <span class="underline">This fee is non-refundable.</span></li>
        <li>Future immigration services, they will have to purchase our other services accordingly.</li>
    </ul>

    <p>Thanks again for choosing Connected Education for your study abroad journey.</p>

    <h3 style="text-decoration: underline; margin-top: 20px;">DIGITAL ACCEPTANCE</h3>

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
        <p><span class="bold">National ID:</span> {{ $invoice->student_nid ?: '-' }}</p>
        <p><span class="bold">Signed At:</span> {{ optional($invoice->student_signed_at)->format('Y-m-d H:i') ?: '-' }}</p>
        @if($hasStudentPhoto)
        <p><span class="bold">Student Photo:</span></p>
        <img src="{{ $studentPhotoSrc }}" alt="Student Photo" class="signature-photo">
        @endif
    </div>
    @endif

    <p class="footer-note">**Please note this contract is in immediate effect <span class="underline">once you agree</span> to the terms and conditions, and a <span class="underline">confirmation</span> of this agreement is sent to your email along with your NID &amp; photo.</p>

    @if(filled($footerText ?? null))
    <p class="footer-note">{{ $footerText }}</p>
    @endif

</body>

</html>

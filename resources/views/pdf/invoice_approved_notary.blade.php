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
    <title>Notary Service Agreement</title>
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
            padding: 0;
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

    <h1>NOTARY SERVICE AGREEMENT</h1>

    <p class="italic bold mt-2">
        Please note this contract is in immediate effect <span class="underline">once you agree</span> to the terms and conditions, and a <span class="underline">confirmation</span> is sent to your email along with your NID &amp; photo.
    </p>

    <p>
        This Agreement ("Agreement") is made between <span class="red bold">{{$fullName}}</span> (the "Client") and Connected Education (the "Service Provider"). This Agreement governs the provision of notary, documentation, translation, and submission support services through the Connected system. The Client acknowledges that all services are digitally structured, automatically generated, and assigned based on the selections made at the time of purchase, whether individually or as part of a bundled package.
    </p>

    <h3>2. SERVICE STRUCTURE</h3>

    <p>
        The Service Provider agrees to deliver the services selected by the Client as outlined in <span class="red bold">Exhibit A (Pages 4)</span>. This section forms an integral part of this Agreement and reflects the exact combination of services purchased. Any service not included in this section shall not be considered part of this Agreement and will require a separate purchase and agreement. The Client understands that service combinations, scope, and pricing are system-generated based on the selections made within the Connected platform.
    </p>

    <h3>3. PAYMENT TERMS</h3>

    <p>
        The Client agrees to make full payment through approved methods prior to the commencement of services. All pricing is automatically calculated by the system and may vary depending on whether the Client selects individual services or a bundled package, as well as whether the Client is able to provide the required documentation independently or requires assistance in obtaining such documents. The Client acknowledges that the final payable amount is clearly displayed before confirmation and agrees to proceed accordingly.
    </p>

    <h3>4. THIRD-PARTY DEPENDENCY</h3>

    <p>
        The Client understands that the Service Provider operates as a facilitator of documentation and notary-related services, many of which involve third-party entities including but not limited to notary public offices, government authorities, tax offices, and other administrative bodies. The Service Provider does not control the processing time, decisions, or outcomes of these third parties. While the Service Provider will use its best efforts to review, prepare, and process all documentation accurately and professionally, all final outputs remain subject to external authorities.
    </p>

    <h3>5. CLIENT REVIEW &amp; CONFIRMATION</h3>

    <p>
        Prior to final submission or processing, a comprehensive review document will be provided to the Client for review prior to final submission or processing. It is the sole responsibility of the Client to carefully review all information, documents, translations, and details for accuracy and completeness. Once the Client confirms that all documents are correct and approves proceeding, such confirmation shall serve as a binding declaration that the Client has verified all information and that no errors, omissions, or discrepancies exist. Following this confirmation, the Service Provider shall not be held liable for any mistakes, inaccuracies, or issues arising from the submitted documents.
    </p>

    <h3>6. FINALITY OF SUBMISSION</h3>

    <p>
        The Client acknowledges that once documents are submitted, processed, or forwarded to third-party authorities, no modifications, corrections, or reversals may be possible. The Client further understands that Connected Education does not have the authority to alter or amend any submitted documentation after approval has been given.
    </p>

    <h3>7. NO REFUND POLICY</h3>

    <p>
        The Client agrees that all payments made under this Agreement are <span class="bold underline">strictly non-refundable</span>. This is due to the nature of the services, which involve third-party processing, administrative handling, and time-based execution that cannot be reversed. No refunds will be issued under any circumstances, including but not limited to delays, rejections, dissatisfaction with outcomes, or changes in the Client's personal situation.
    </p>

    <h3>8. CLIENT OBLIGATIONS</h3>

    <p>
        The Client agrees to provide all required documents in a timely manner and to ensure that all information submitted is accurate and complete. The Client further agrees to cooperate fully throughout the process. Any delays, complications, or negative outcomes resulting from incomplete documentation, incorrect information, or lack of responsiveness shall not be the responsibility of the Service Provider.
    </p>

    <h3>9. TERMINATION</h3>

    <p>
        The Service Provider reserves the right to terminate this Agreement at any time if the Client fails to comply with the terms outlined herein, including but not limited to providing false information, non-cooperation, or failure to complete payment. In such cases, no refund shall be applicable.
    </p>

    <h3>10. GOVERNING LAW</h3>

    <p>
        This Agreement shall be governed by and interpreted in accordance with the laws of Dhaka, Bangladesh. Any disputes arising under this Agreement shall be subject to the jurisdiction of the courts of Dhaka, Bangladesh.
    </p>

    <h3>11. PROFESSIONAL CONDUCT &amp; BRAND PROTECTION</h3>

    <p>
        The Client agrees that any actions intended to harm the reputation, operations, or credibility of Connected Education through false claims, misleading information, or public defamation shall result in immediate termination of this Agreement without notice and without any financial compensation.
    </p>

    <h3>12. FINAL DECLARATION</h3>

    <p>
        The Client confirms that they have carefully reviewed all documents, service selections, pricing, and terms outlined in this Agreement. By proceeding, the Client accepts all conditions stated above and acknowledges full responsibility for the accuracy of all submitted information.
    </p>

    <p style="text-align: center; font-weight: bold;">[SEE NEXT PAGE FOR SERVICE DETAILS]</p>

    <div class="page-break"></div>

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

    <div class="page-break"></div>

    <h3 style="text-decoration: underline; margin-top: 20px;">FINAL DECLARATION</h3>

    <p>
        The Client confirms that they have carefully reviewed all course details, service inclusions, pricing, and terms outlined in this Agreement. By proceeding, the Client accepts all conditions stated above and acknowledges full responsibility for the accuracy of all submitted information.
    </p>

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

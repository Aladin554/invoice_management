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
    <title>IELTS Service Agreement</title>
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
    text-align: right;
}

.footer-logo {
    height: 10px;   /* smaller than before */
    width: auto;
    opacity: 0.9;
}
    </style>
</head>

<body>

    <div class="page-footer">
        <img src="{{ $companyLogoSrc ?? public_path('react/images/logo/connected_logo.png') }}" alt="Connected logo" class="footer-logo">
    </div>

    <table class="top-bar">
        <tr>
            <td class="message">
                <p>Thanks for choosing Connected Education for your study abroad journey.</p>
            </td>
        </tr>
    </table>

    <h1>IELTS SERVICE AGREEMENT</h1>

    <p class="italic bold mt-2">
        **Please note this contract is in immediate effect <span class="underline">once you agree</span> to the terms and conditions, and a <span class="underline">confirmation</span> is sent to your email along with your NID &amp; photo.
    </p>

    <p>
        This Agreement ("Agreement") is made between <span class="red bold">{{$fullName}}</span> (the "Client") and Connected Education (the "Service Provider"). This Agreement governs the provision of IELTS and English training services delivered through Connected Education. The Client acknowledges that all services are structured, generated, and assigned based on the course selection made at the time of purchase, whether individually or as part of a bundled package.
    </p>

    <h3>DESCRIPTION OF THE SERVICES</h3>

    <p>
        The Service Provider agrees to deliver the training services selected by the Client as outlined in <span class="underline">Exhibit A</span> (Service Selection Section). This section forms an integral part of this Agreement and reflects the exact course or package purchased by the Client.
    </p>

    <h3>PAYMENT TERMS</h3>

    <p>
        The Client agrees to make full payment through approved methods prior to the commencement of services. All pricing is system-generated based on the selected course or bundle and is clearly displayed before confirmation. The Client acknowledges that once payment is made and access to the course is granted, the service is considered activated.
    </p>

    <h3>SERVICE DELIVERY</h3>

    <p>
        The Client understands that the Service Provider will deliver training through a structured system that may include online classes, offline sessions, recorded materials, speaking sessions, mock tests, and resource access depending on the selected package. The Service Provider will use its best efforts to maintain quality instruction, structured learning, and professional guidance throughout the course duration.
    </p>

    <h3>CLIENT RESPONSIBILITY</h3>

    <p>
        The Client agrees to attend classes regularly, follow the course structure, and actively participate in all learning activities. The Client acknowledges that performance in IELTS depends on personal effort, consistency, and practice, and that the Service Provider cannot guarantee any specific score or outcome.
    </p>

    <h3>REFUND POLICY</h3>

    <p>
        The Client will be eligible for a refund only if the Client is not satisfied with the quality of the service within the first four (4) classes from the start of the course. In such cases, the Client must provide clear and reasonable justification demonstrating that the service did not meet expected standards. Beyond this initial period, all payments are <span class="bold underline">strictly non-refundable</span> under any circumstances, including lack of participation, change of plans, dissatisfaction with progress, or personal reasons.
    </p>

    <h3>ACCESS &amp; USAGE</h3>

    <p>
        The Client understands that access to course materials, recordings, and sessions depends on the selected package. Certain features such as lifetime access, unlimited speaking sessions, or retake options are only available under specific packages as defined in Exhibit A. Access rights are non-transferable and are strictly limited to the registered Client.
    </p>

    <h3>EXPENSES</h3>

    <p>
        The Client agrees that any additional expenses related to IELTS registration, external exams, or third-party services are not included in this Agreement and must be borne separately by the Client.
    </p>

    <h3>TERMINATION</h3>

    <p>
        The Service Provider reserves the right to terminate this Agreement if the Client fails to comply with the terms outlined herein, including but not limited to non-payment, misconduct, or violation of class policies. In such cases, no refund shall be applicable.
    </p>

    <h3>DIGITAL ACCEPTANCE</h3>

    <p>
        The Client agrees that any form of digital acceptance, including clicking "Confirm &amp; Submit," proceeding after reviewing the contract, or enrolling through the Connected system, shall constitute a legally binding agreement equivalent to a physical signature. The Client confirms that they have reviewed their course selection, details, and terms prior to acceptance.
    </p>

    <h3>GOVERNING LAW</h3>

    <p>
        This Agreement shall be governed by and interpreted in accordance with the laws of Dhaka, Bangladesh. Any disputes arising under this Agreement shall be subject to the jurisdiction of the courts of Dhaka, Bangladesh.
    </p>

    <h3>PROFESSIONAL CONDUCT &amp; BRAND PROTECTION</h3>

    <p>
        The Client agrees to maintain professional conduct throughout the course. Any actions intended to harm the reputation, operations, or credibility of Connected Education through false claims, misconduct, or disruption may result in immediate termination of the service without refund.
    </p>

    <!-- <div class="page-break"></div> -->

    <h2>EXHIBIT A – SERVICE DETAILS</h2>

    <p>
        This section is generated based on the Client's selected course or package and includes the exact details of the purchased service, including course type, duration, features, and pricing. The Client acknowledges that this section accurately reflects their purchase and forms an essential part of this Agreement.
    </p>

    <div class="exhibit-box">

        @if(!empty($selectedServiceRows))
            @foreach($selectedServiceRows as $serviceRow)
                <p class="service-line">
                    ☑
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
                ☑
                <span class="bold">IELTS Bundle Package = 40k BDT /-</span>
            </p>
            <p style="margin-top: 10px;">
                <span class="red bold">Contract Description for the above:</span>
            </p>
            <p>Dummy text.</p>
            <p class="red bold">[END OF DYNAMIC SECTION]</p>
        @endif
    </div>

    <!-- <div class="page-break"></div> -->

    <h3 style="text-decoration: underline; margin-top: 20px;">FINAL DECLARATION</h3>

    <p>
        The Client confirms that they have carefully reviewed all course details, service inclusions, pricing, and terms outlined in this Agreement. By proceeding, the Client accepts all conditions stated above and acknowledges full responsibility for their participation and performance in the training program.
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
        This agreement ensures that all details regarding the client's profile are accurately represented and mutually understood. To avoid any discrepancies during the training process, we request the following information from you to ensure the accuracy of your profile and our services.
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

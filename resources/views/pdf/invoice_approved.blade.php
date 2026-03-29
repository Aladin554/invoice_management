@php
    $customer = $invoice->customer;
    $fullName = trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
    $fullName = $fullName !== '' ? $fullName : 'Client';

    $initials = collect(preg_split('/\s+/', $fullName) ?: [])
        ->filter()
        ->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
        ->take(3)
        ->implode('');

    $primaryItem = $invoice->items->first();
    $additionalItems = $invoice->items->slice(1)->values();
    $contractHeading = $invoice->contractTemplate?->name ?: ($primaryItem?->name ?: 'Selected Service Package');
    $contractDescription = trim((string) ($invoice->contractTemplate?->description ?? ''));

    $selectedDocuments = collect($customer?->available_documents ?? [])->filter()->values()->all();
    $selectedEnglishProficiencies = collect($customer?->english_language_proficiencies ?? [])->filter()->values()->all();

    $studentPhotoPath = $invoice->student_photo_path
        ? public_path('storage/' . ltrim($invoice->student_photo_path, '/'))
        : null;
    $hasStudentPhoto = is_string($studentPhotoPath) && $studentPhotoPath !== '' && file_exists($studentPhotoPath);

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
            margin: 32px 38px;
        }

        body {
            font-family: DejaVu Sans, Calibri, Arial, Helvetica, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            margin: 0;
        }

        .page-break {
            page-break-before: always;
        }

        .top-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }

        .top-bar td {
            vertical-align: top;
        }

        .initial-box {
            border: 1px solid #000;
            width: 120px;
            height: 60px;
            text-align: center;
            font-size: 10pt;
            padding-top: 8px;
        }

        h1 {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            margin: 10px 0 16px;
        }

        h2 {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin: 6px 0;
        }

        p {
            margin: 8px 0;
        }

        ul {
            margin: 8px 0 12px 20px;
            padding: 0;
        }

        li {
            margin-bottom: 5px;
        }

        .bold {
            font-weight: bold;
        }

        .italic {
            font-style: italic;
        }

        .underline {
            text-decoration: underline;
        }

        .muted {
            color: #555;
        }

        .box {
            border: 1px solid #000;
            padding: 15px;
            margin-top: 15px;
        }

        .red {
            color: #b91c1c;
            font-weight: bold;
        }

        .line {
            display: inline-block;
            border-bottom: 1px solid #000;
            min-height: 15px;
            padding: 0 4px 2px;
            vertical-align: bottom;
        }

        .line-empty::after {
            content: " ";
        }

        .short-line {
            min-width: 180px;
        }

        .line-default {
            min-width: 280px;
        }

        .long-line {
            min-width: 340px;
        }

        .checkbox-list {
            margin-left: 0;
        }

        .checkbox-list li {
            list-style: none;
        }

        .meta-table,
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }

        .meta-table td,
        .summary-table td,
        .summary-table th {
            border: 1px solid #000;
            padding: 7px 9px;
            vertical-align: top;
        }

        .summary-table th {
            text-align: left;
            background: #f3f4f6;
        }

        .service-line {
            margin: 8px 0;
        }

        .signature-box {
            margin-top: 18px;
        }

        .signature-photo {
            margin-top: 10px;
            width: 120px;
            height: auto;
            border: 1px solid #000;
            padding: 4px;
        }

        .footer-note {
            margin-top: 18px;
            font-size: 10pt;
            color: #333;
        }
    </style>
</head>
<body>

<table class="top-bar">
    <tr>
        <td>
            <p>Thanks for choosing Connected Education for your study abroad journey.</p>
        </td>
        <td style="width: 130px; text-align: right;">
            <div class="initial-box">
                Client Initials
                <div style="margin-top: 10px; font-size: 15pt; font-weight: bold;">{{ $initials !== '' ? $initials : '-' }}</div>
            </div>
        </td>
    </tr>
</table>

<h1>CONNECTED SERVICE AGREEMENT</h1>

<p class="italic bold">
    Please note this contract will be in immediate effect once you agree to the terms and conditions, and a confirmation of this agreement is sent to your email along with your photo.
</p>

<p>
    This Agreement (“Agreement”) is made between <span class="bold">{{ $fullName }}</span> and Connected Inc. (the “Service Provider”), for the purpose of setting forth the exclusive terms and conditions by which the Client desires to acquire the below described services from the Service Provider. In consideration of the mutual obligations specified in this agreement, the parties intending to be legally bound hereby, agree to the following: 
</p>

<table class="meta-table">
    <tr>
        <td><span class="bold">Invoice Number:</span> {{ $invoice->invoice_number ?: '-' }}</td>
        <td><span class="bold">Invoice Date:</span> {{ optional($invoice->invoice_date)->format('Y-m-d') ?: '-' }}</td>
    </tr>
    <tr>
        <td><span class="bold">Payment Method:</span> {{ $invoice->payment_method ? ucwords(str_replace('_', ' ', (string) $invoice->payment_method)) : '-' }}</td>
        <td><span class="bold">Branch:</span> {{ $invoice->branch?->name ?: '-' }}</td>
    </tr>
</table>

<p class="bold">Description of the Services.</p>

<p>
    Description of the Services. Client retains the above Service Provider, and the Service Provider agrees to perform for the Client, the services set forth in Exhibit A to this Agreement (the “Services”). Any Service outside of the scope as defined in Exhibit A to this Agreement will require a new Agreement for other services agreed to by the Parties.
Payments must be made to the Service Provider via mobile payment methods, credit card, cash, cheque, or any other approved method of payment accepted by the Service Provider. 
Refund will be ONLY issued, if the Client doesn’t achieve their desired outcome due to a fault of the Service Provider. In such case, client must provide detailed evidence of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client’s inquiries repetitively for more than 48hrs, a refund will be issued. In this case repetitive occurring of such incidents must be shown as evidence. Please note, the Service Provider will not be liable for any issues Service Provider will take any actions required to meet the needs of the Client and provide satisfactory services. 

</p>



<p class="bold">Client will also not be eligible for a refund if:</p>

<ul>
    <li>Client’s academic grade average is below 70% where this affects admission or visa eligibility.</li>
    <li>Client changes their preferences after services have already started.</li>
    <li>Client wishes to discontinue after work has begun on the file.</li>
    <li>Client cannot provide the required documents in time.</li>
    <li>Client submits forged or misleading documents.</li>
    <li>Client takes risks against professional advice from the Service Provider.</li>
    <li>Client continues processing elsewhere while using Connected services.</li>
    <li>Client remains unresponsive for a prolonged period of time.</li>
    <li>Client has limited available options due to profile restrictions.</li>
    <li>Client cannot meet provider, embassy, or institution requirements.</li>
    <li>Client has a study gap that significantly limits application options.</li>
    <li>Client does not receive an offer because of profile or institution criteria.</li>
    <li>Client is over the preferred age range for the selected pathway.</li>
    <li>Client does not receive admission or visa approval for reasons outside the Service Provider’s control.</li>
</ul>

<p>Please note, Client will STRICTLY not be eligible for a refund on our visa package. No exceptions will be made for any cases. Refund will be ONLY issued, if the Client doesn’t achieve their desired outcome due to a fault of the Service Provider. In such case, client must provide detailed evidence of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client’s inquiries repetitively for more than 48hrs, a refund will be issued. In this case repetitive occurring of such incidents must be shown as evidence. Please note, the Service Provider will not be liable for any issues arising from the lack of diligence by any third-party provider.
Alternatively, in the case of a visa refusal, the Client can choose to re-apply for their visa, where the Service Provider will not charge any additional fees.  
</p>

<div class="page-break"></div>
<p>Expenses. From time to time throughout the duration of this Service Agreement, the Service Provider may incur certain expenses such as application fees, supplemental fees, notarization, tax certificate assessment etc. that are not included as part of the Fee for our Services to this Agreement. 
The Service Provider agrees to keep an exact record of any and all expenses acquired while performing the Services. The Service Provider will submit an invoice itemizing each expense, along with proof of purchase and receipt, upon completion of such Services.  
Service Provider agrees to obtain the Client’s written consent before making any purchase. Client shall also bear all expenses related to notarization and other administrative fees during the visa process.
Term and Termination. This Service Agreement shall be effective on the date hereof and shall continue until the expressly agree upon date of the completion of the Services, unless it is earlier terminated in accordance with the terms of this Agreement (the “Term”). 
The Client understands that the Service Provider may terminate this Agreement at any time if the Client fails to pay for the Services provided under this Agreement or if the Client breaches any other material provision listed in this Service Agreement in the manner as defined above. Client agrees to pay any outstanding balances within 15 business days of termination. 
Independent Contractor. Client and Service Provider expressly agree and understand that the above-listed Service Provider is an independent contractor hired by the Client and nothing in this Agreement shall be construed in any way or manner, to create between them a relationship of employer and employee, principal and agent, partners or any other relationship other than that of independent parties contracting with each other solely for the purpose of carrying out the provisions of the Agreement.
Accordingly, the Service Provider acknowledges that neither the Service Provider or the Service Provider’s Employees are not eligible for any benefits, including, but not limited to, health insurance, retirement plans or stock option plans. The Service Provider is not the agent of Client or its Company and is not authorized and shall not have the power or authority to bind Client or its Company or incur any liability or obligation, or act on behalf of Client or its Company. At no time shall the Service Provider represent that it is an agent of the Client or its Company, or that any of the views, advice, statements and/or information that may be provided while performing the Services are those for the Client. 
The Service Provider is not entitled to receive any other compensation or any benefits from the Client. Except as otherwise required by law, the Client shall not withhold any sums or payments made to the Service Provider for social security or other federal, state, or local tax liabilities or contributions, and all withholdings, liabilities, and contributions shall be solely the Service Provider’s responsibility. The Service Provider further understands and agrees that the Services are not covered under the unemployment compensation laws and are not intended to be covered by workers’ compensation laws. 
The Service Provider is solely responsible for directing and controlling the performance of the Services, including the time, place and manner in which the Services are performed. The Service Provider shall use its best efforts, energy and skill in its own name and in such manner as it sees fit.
Confidentiality. Throughout the duration of this Agreement, it may be necessary for the Service Provider to have access to the Client’s confidential and protected information for the sole purpose of performing the Services subject to this Agreement. 
The Service Provider is not permitted to share or disclose such confidential information whatsoever, unless mandated by law, without written permission from the Client. The Service Provider’s obligation of confidentiality will survive the termination of this Service Agreement and stay in place indefinitely. Upon the termination of this Agreement, the Service Provider agrees to return to the Client any and all Confidential Information that is the property of the Client. 
Return of Property. The Service Provider shall promptly return to the Client all copies, whether in written, electronic, or other form or media, of the Client’s Confidential Information, or destroy all such copies and certify in writing to the Client that such Confidential Information has been destroyed. In addition, the Service Provider shall also destroy all copies of any Notes created by the Service Provider or its authorized Representatives and certify in writing to the Client that such copies have been destroyed.
</p>
<div class="page-break"></div>
<p>Exclusivity. The Client subject to this Agreement understand and acknowledge that this Agreement is exclusive. The Client respectively agrees that they are not free to enter into other similar Agreements with other parties offering similar services. In such case their packages will be IMMEDIATELY CANCELLED WITH NO REFUNDS being applicable. 
Warranty. The Service Provider shall provide its services and meet its obligations set forth in this Agreement in a timely and satisfactory workmanlike manner, using its knowledge and recommendations for performing its services which generally meets standards in the Service Provider’s region and community, and agrees to provide a standard of care, equal or superior to care used by other professionals in the same profession.
The Service Provider shall perform the services in compliance with the terms and conditions of the Agreement.
Dispute Resolution. Parties to this Agreement shall first attempt to settle any dispute through good-faith negotiation. If the dispute cannot be settled between the parties via negotiation, either party may initiate mediation or binding arbitration in the court of Dhaka, Bangladesh.
If the parties do not wish to mediate or arbitrate the dispute and litigation is necessary, this Agreement will be interpreted based on the laws of Dhaka, Bangladesh. without regard to the conflict of law provisions of such state. The Parties agree the dispute will be resolved in a court of competent jurisdiction in Dhaka, Bangladesh. 
Governing Law. This Service Agreement shall be governed in all respects by the laws of Dhaka, Bangladesh, without regard to the conflict of law provisions of such state. This Agreement shall be binding upon the successors and assigns of the respective parties.
Legal Fees. Should a dispute between the named Parties arise lead to legal action, the prevailing Party shall be entitled to any reasonable legal fees, including, but not limited to attorneys’ fees.
Professional Conduct. Both parties herein agree must meet generally accepted standards of professional conduct. If the client is found to be involved in any baseless activities against Connected leading to harming our brand and reputation, the contract will be immediately breached without prior notice or further discussion. The Service Provider will not refund any fees to the Client.
Amendment. This Agreement may be amended only by a writing signed by all of the Parties hereto.
</p>

<div class="page-break"></div>

<h2>EXHIBIT A</h2>
<h2>SERVICE(S)</h2>

<p>
    The Client hereby confirms that they have reviewed the available service options and selected the package(s) and add-on service(s) recorded below.
</p>

<div class="box">
    <p class="red">[{{ mb_strtoupper($contractHeading) }}]</p>

    @if($primaryItem)
        <p class="service-line">&#9745; <span class="bold">{{ $primaryItem->name }}</span> - {{ number_format((float) $primaryItem->line_total, 2) }}</p>
    @else
        <p class="service-line">&#9744; <span class="bold">Primary service package not recorded on this invoice.</span></p>
    @endif

    <p class="italic">
        {{ $contractDescription !== '' ? $contractDescription : 'This agreement remains active for the selected service term and processing stage agreed between the Client and Connected.' }}
    </p>

    <p class="underline">
        If applicable, after admission approval, visa processing, dependant support, and related add-on services will proceed according to the approved service scope and invoice.
    </p>

    <p class="bold">Service Provider agrees to provide:</p>

    <ul>
        <li>Personalized Program Counselling</li>
        <li>Detailed Program Reports</li>
        <li>SOP Writing Guidance</li>
        <li>Templates for transcripts, references, and CV support</li>
        <li>Scholarship Application Support where applicable</li>
        <li>Application Submission Assistance</li>
        <li>Interview Grooming Guidance</li>
        <li>English Training Support where applicable</li>
        <li>Career Development Guidance</li>
        <li>Additional academic support based on the selected package</li>
    </ul>

    <p class="bold">Additional services:</p>

    @forelse($additionalItems as $item)
        <p class="service-line">&#9745; {{ $item->name }} - {{ number_format((float) $item->line_total, 2) }}</p>
    @empty
        <p class="service-line">&#9744; No additional services selected on this invoice.</p>
    @endforelse

    <table class="summary-table">
        <tr>
            <th style="width: 34%;">Subtotal</th>
            <td>{{ number_format((float) $invoice->subtotal, 2) }}</td>
        </tr>
        <tr>
            <th>Discount</th>
            <td>{{ number_format((float) $discountAmount, 2) }}</td>
        </tr>
        <tr>
            <th>Total</th>
            <td><span class="bold">{{ number_format((float) $invoice->total, 2) }}</span></td>
        </tr>
    </table>
</div>

<p class="bold">Client shall bear expenses:</p>

<ul>
    <li>University Fees</li>
    <li>Legal Fees</li>
    <li>Translation Charges</li>
    <li>Visa Fees</li>
    <li>Medical Costs</li>
</ul>

<p class="bold">In case Client seeks:</p>

<ul>
    <li>Loan support, additional fee may apply.</li>
    <li>Notary package, additional fee may apply.</li>
    <li>Credit card support, the support fee may be non-refundable.</li>
    <li>Future immigration or post-arrival services, separate pricing may apply.</li>
</ul>

<div class="page-break"></div>

<h2>Profile Agreement for the Client:</h2>

<p>
    This agreement ensures that all details regarding the client's profile are accurately represented and mutually understood before application, admission, visa, and related service processing begins.
</p>

<ul>
    <li class="bold">Academic Profile (Mention Grades and Grading Scale Percentage):</li>
</ul>

<p>SSC or O Level <span class="line line-default {{ filled($customer?->academic_profile_ssc) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_ssc ?: '' }}</span></p>
<p>HSC or A Level <span class="line line-default {{ filled($customer?->academic_profile_hsc) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_hsc ?: '' }}</span></p>
<p>Bachelor <span class="line long-line {{ filled($customer?->academic_profile_bachelor) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_bachelor ?: '' }}</span></p>
<p>Masters <span class="line long-line {{ filled($customer?->academic_profile_masters) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_masters ?: '' }}</span></p>

<ul>
    <li class="bold">Study Gap <span class="line short-line {{ filled($customer?->study_gap) ? '' : 'line-empty' }}">{{ $customer?->study_gap ?: '' }}</span></li>
    <li class="bold">Total Funds Being Shown for Applicant <span class="line line-default {{ filled($customer?->total_funds_for_applicant) ? '' : 'line-empty' }}">{{ $customer?->total_funds_for_applicant ?: '' }}</span></li>
    <li class="bold">Total Funds Being Shown for Accompanying Members <span class="line line-default {{ filled($customer?->total_funds_for_accompanying_members) ? '' : 'line-empty' }}">{{ $customer?->total_funds_for_accompanying_members ?: '' }}</span></li>
    <li class="bold">Number of Members Who Will Be Moving Abroad <span class="line short-line {{ !is_null($customer?->moving_abroad_member_count) ? '' : 'line-empty' }}">{{ $customer?->moving_abroad_member_count ?? '' }}</span></li>
</ul>

<ul>
    <li class="bold">Documents Student Can Provide:</li>
</ul>

<ul class="checkbox-list">
    @foreach($documentLabels as $value => $label)
        <li>{{ in_array($value, $selectedDocuments, true) ? '☑' : '☐' }} {{ $label }}</li>
    @endforeach
</ul>

<p class="bold">English Language Proficiency:</p>

<ul class="checkbox-list">
    @foreach($englishLabels as $value => $label)
        <li>{{ in_array($value, $selectedEnglishProficiencies, true) ? '☑' : '☐' }} {{ $label }}</li>
    @endforeach
</ul>

@if($hasSignatureDetails)
    <div class="box signature-box">
        <p class="bold">Client Confirmation</p>
        <p><span class="bold">Signed Name:</span> {{ $invoice->student_signature_name ?: '-' }}</p>
        <p><span class="bold">Signed At:</span> {{ optional($invoice->student_signed_at)->format('Y-m-d H:i') ?: '-' }}</p>
        @if($hasStudentPhoto)
            <p><span class="bold">Student Photo:</span></p>
            <img src="{{ $studentPhotoPath }}" alt="Student Photo" class="signature-photo">
        @endif
    </div>
@endif

<p class="footer-note">
    {{ $footerText }}
</p>

</body>
</html>

@php
$customer = $invoice->customer;
$fullName = trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
$fullName = $fullName !== '' ? $fullName : 'Client';

$initials = collect(preg_split('/\s+/', $fullName) ?: [])
->filter()
->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
->take(3)
->implode('');

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
            color: #c00;
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

        .profile-lines {
            margin-left: 34px;
        }

        .profile-lines p {
            margin-bottom: 7px;
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
            font-size: 10pt;
            font-weight: bold;
            text-align: right;
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
            <td style="width: 130px; text-align: right;">
                <div class="initial-box">
                    <div>Client Initials</div>
                    <div style="margin-top: 10px; font-size: 15pt; font-weight: bold;">{{ $initials !== '' ? $initials : '-' }}</div>
                </div>
            </td>
        </tr>
    </table>

    <h3 class="bold">Date: {{ optional($invoice->invoice_date)->format('Y-m-d') ?: '-' }}</h3>

    <h1>CONNECTED SERVICE AGREEMENT</h1>

    <p class="italic bold mt-2">
        **Please note this contract will be in immediate effect once you agree to the terms and conditions, and a confirmation of this agreement is sent to your email along with your photo.
    </p>

    <p>
        This Agreement ("Agreement") is made between <span class="bold">{{ $fullName }}</span> and Connected Inc. (the "Service Provider"), for the purpose of setting forth the exclusive terms and conditions by which the Client desires to acquire the below described services from the Service Provider. In consideration of the mutual obligations specified in this agreement, the parties intending to be legally bound hereby, agree to the following.
    </p>

    <p>
       <span class="bold">Description of the Services.</span> Client retains the above Service Provider, and the Service Provider agrees to perform for the Client, the services set forth in <span class="bold underline">Exhibit A</span> to this Agreement (the "Services"). Any Service outside of the scope as defined in <span>Exhibit A</span> to this Agreement will require a new Agreement for other services agreed to by the Parties.
    </p>

    <p>
        Payments must be made to the Service Provider via mobile payment methods, credit card, cash, cheque, or any other approved method of payment accepted by the Service Provider.
    </p>

    <p>
        Refund will be <strong class="underline">ONLY</strong> issued, if the Client does not achieve their desired outcome due to a <span class="bold">fault</span> of the Service Provider. In such case, client <strong class="underline">must provide detailed evidence</strong> of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client's inquiries <strong>repetitively</strong> for more than <strong>48hrs</strong>, a refund will be issued. In this case <strong>repetitive</strong> occurring of such incidents must be shown as evidence. Please note, the Service Provider <strong class="underline">will not be liable</strong> for any issues. <strong>Service Provider will take any actions required to meet the needs of the Client and provide satisfactory services.</strong>
    </p>

    <p class="bold">Client <span class="underline">will also not be eligible</span> for a refund if:</p>

    <ul>
        <li>Client's academic grade average is below 70% or they have any subject grades below C.</li>
        <li>Client changes their preferences and decides not to continue with the service due to personal reasons.</li>
        <li>Client wishes to discontinue for medical reasons or any accidents in the family.</li>
        <li>Client cannot provide required or sufficient documents for their application.</li>
        <li>Client forges document.</li>
        <li>Client willingly takes risks against the Service Provider's recommendations or is not willing to take appropriate steps to meet application requirements.</li>
        <li>Client processes their application separately elsewhere without informing the Service Provider.</li>
        <li>Client is unresponsive for more than 2 weeks.</li>
        <li>Client is presented limited institution and program options due to below average academic profile.</li>
        <li>Client cannot reach Service Provider outside of office hours, government holidays, or announced breaks.</li>
        <li>Client has an educational gap of over 3 years for an intended Bachelor's degree and over 5 years for an intended Master's degree.</li>
        <li>Client does not receive offer of admission from university due to a competitive cut-off score and limited seat availability.</li>
        <li>Client is aged over 28 years.</li>
        <li>Client does not receive admission or visa approval due to changes in admission requirements and immigration regulations <strong class="underline">after</strong> their purchase.</li>
    </ul>

    <p>
        <strong>Please note, Client will STRICTLY not be eligible for a refund on our visa package. No exceptions will be made for any cases.</strong> Refund will be <strong class="underline">ONLY</strong> issued, if the Client does not achieve their desired outcome due to a fault of the Service Provider. In such case, client <strong class="underline">must provide detailed evidence</strong> of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client's inquiries repetitively for more than <strong>48hrs</strong>, a refund will be issued. In this case repetitive occurring of such incidents must be shown as evidence. Please note, the Service Provider <strong class="underline">will not be liable</strong> for any issues arising from the lack of diligence by any <strong class="underline">third-party provider</strong>.
    </p>

    <p>
        Alternatively, in the case of a visa refusal, the Client can choose to re-apply for their visa, where the Service Provider <strong class="underline">will not</strong> charge any additional fees.
    </p>

    <!-- <div class="page-break"></div> -->

    <p><strong>Expenses.</strong> From time to time throughout the duration of this Service Agreement, the Service Provider may incur certain expenses such as application fees, supplemental fees, notarization, tax certificate assessment etc. that are <strong>not included</strong> as part of the Fee for our Services to this Agreement.</p>
    <p>The Service Provider agrees to keep an exact record of any and all expenses acquired while performing the Services. The Service Provider will submit an invoice itemizing each expense, along with proof of purchase and receipt, upon completion of such Services.</p>
    <p>Service Provider agrees to obtain the Client's written consent before making any purchase. Client shall also bear all expenses related to notarization and other administrative fees during the visa process.</p>
    <p><strong>Term and Termination.</strong> This Service Agreement shall be effective on the date hereof and shall continue until the expressly agree upon date of the completion of the Services, unless it is earlier terminated in accordance with the terms of this Agreement (the "Term").</p>
    <p>The Client understands that the Service Provider may terminate this Agreement at any time if the Client fails to pay for the Services provided under this Agreement or if the Client breaches any other material provision listed in this Service Agreement in the manner as defined above. Client agrees to pay any outstanding balances within 15 business days of termination.</p>
    <p><strong>Independent Contractor.</strong> Client and Service Provider expressly agree and understand that the above-listed Service Provider is an independent contractor hired by the Client and nothing in this Agreement shall be construed in any way or manner, to create between them a relationship of employer and employee, principal and agent, partners or any other relationship other than that of independent parties contracting with each other solely for the purpose of carrying out the provisions of the Agreement.</p>
    <p>Accordingly, the Service Provider acknowledges that neither the Service Provider or the Service Provider's Employees are eligible for any benefits, including, but not limited to, health insurance, retirement plans or stock option plans. The Service Provider is not the agent of Client or its Company and is not authorized and shall not have the power or authority to bind Client or its Company or incur any liability or obligation, or act on behalf of Client or its Company. At no time shall the Service Provider represent that it is an agent of the Client or its Company, or that any of the views, advice, statements and/or information that may be provided while performing the Services are those for the Client.</p>
    <p>The Service Provider is not entitled to receive any other compensation or any benefits from the Client. Except as otherwise required by law, the Client shall not withhold any sums or payments made to the Service Provider for social security or other federal, state, or local tax liabilities or contributions, and all withholdings, liabilities, and contributions shall be solely the Service Provider's responsibility. The Service Provider further understands and agrees that the Services are not covered under the unemployment compensation laws and are not intended to be covered by workers' compensation laws.</p>
    <p>The Service Provider is solely responsible for directing and controlling the performance of the Services, including the time, place and manner in which the Services are performed. The Service Provider shall use its best efforts, energy and skill in its own name and in such manner as it sees fit.</p>
    <p><strong>Confidentiality.</strong> Throughout the duration of this Agreement, it may be necessary for the Service Provider to have access to the Client's confidential and protected information for the sole purpose of performing the Services subject to this Agreement.</p>
    <p>The Service Provider is not permitted to share or disclose such confidential information whatsoever, unless mandated by law, without written permission from the Client. The Service Provider's obligation of confidentiality will survive the termination of this Service Agreement and stay in place indefinitely. Upon the termination of this Agreement, the Service Provider agrees to return to the Client any and all Confidential Information that is the property of the Client.</p>
    <p><strong>Return of Property.</strong> The Service Provider shall promptly return to the Client all copies, whether in written, electronic, or other form or media, of the Client's Confidential Information, or destroy all such copies and certify in writing to the Client that such Confidential Information has been destroyed. In addition, the Service Provider shall also destroy all copies of any Notes created by the Service Provider or its authorized Representatives and certify in writing to the Client that such copies have been destroyed.</p>

    <!-- <div class="page-break"></div> -->

    <p><strong>Exclusivity.</strong> The Client subject to this Agreement understand and acknowledge that this Agreement is exclusive. <strong>The Client respectively agrees that they are not free to enter into other similar Agreements with other parties offering similar services. In such case their packages will be <span class="underline">IMMEDIATELY CANCELLED WITH</span> NO REFUNDS being applicable.</strong></p>
    <p><strong>Warranty.</strong> The Service Provider shall provide its services and meet its obligations set forth in this Agreement in a timely and satisfactory workmanlike manner, using its knowledge and recommendations for performing its services which generally meets standards in the Service Provider's region and community, and agrees to provide a standard of care, equal or superior to care used by other professionals in the same profession.</p>
    <p>The Service Provider shall perform the services in compliance with the terms and conditions of the Agreement.</p>
    <p><strong>Dispute Resolution.</strong> Parties to this Agreement shall first attempt to settle any dispute through good-faith negotiation. If the dispute cannot be settled between the parties via negotiation, either party may initiate mediation or binding arbitration in the court of Dhaka, Bangladesh.</p>
    <p>If the parties do not wish to mediate or arbitrate the dispute and litigation is necessary, this Agreement will be interpreted based on the laws of Dhaka, Bangladesh, without regard to the conflict of law provisions of such state. The Parties agree the dispute will be resolved in a court of competent jurisdiction in Dhaka, Bangladesh.</p>
    <p><strong>Governing Law.</strong> This Service Agreement shall be governed in all respects by the laws of Dhaka, Bangladesh, without regard to the conflict of law provisions of such state. This Agreement shall be binding upon the successors and assigns of the respective parties.</p>
    <p><strong>Professional Conduct.</strong> Both parties herein agree <strong>must meet</strong> generally accepted standards of professional conduct. <strong class="underline">If the client is found to be involved in any baseless activities against Connected leading to harming our brand and reputation,the contract will be immediately breached without prior notice or further discussion. The Service Provider will not refund any fees to the Client</strong>.</p>
    <p><strong>Amendment.</strong> This Agreement may be amended only by a writing signed by all of the Parties hereto.</p>

    <div class="page-break"></div>

    <h2>EXHIBIT A</h2>
    <h2 class="section-heading">SERVICE(S)</h2>

    <p class="mt-3">
        The Client hereby confirms that they have reviewed the available service options and selected the package(s) and add-on service(s) recorded below.
    </p>

    <div class="exhibit-box">
        <p class="red">{{ mb_strtoupper($contractHeading) }}</p>

        @if($hasPrimaryService)
        <p class="service-line">&#9745; <span class="bold">{{ $primaryServiceName }}</span> - {{ $primaryServiceAmount }}</p>
        @else
        <p class="service-line">&#9744; <span class="bold">Primary service package not recorded on this invoice.</span></p>
        @endif

        <p class="italic">
            <span class="underline">**Active for 2 years from date of purchase</span>
        </p>

        <p class="underline">
            **If applicable, after admission approval if client wishes to proceed with Australia visa package, client must pay the above-mentioned visa package fee before visa application submission. No late payment will be accepted
        </p>

        <p><strong>Service Provider agrees to provide the following services under the Admission Package:</strong></p>

        <ul>
            <li>Personalized Program Counselling</li>
            <li>Detailed Program Reports</li>
            <li>SOP Writing</li>
            <li>Provide Templates for Transcripts, References and CV</li>
            <li>Scholarship Application</li>
            <li>Application Submission</li>
            <li>Interview Grooming / CAS Clearance / GS Clearance (as applicable)</li>
            <li>Unlimited Daily English-Speaking Training Classes</li>
            <li>Career Development Training (Essentials Masterclass)</li>
            <li>IELTS Online Masterclass</li>
        </ul>

        <p class="bold">Should the Client wish to purchase additional services in the future in order to continue their study abroad application journey, the following service packages and corresponding fees shall apply.</p>


        @forelse($additionalServiceRows as $serviceRow)
        <strong class="service-line">&#9744; {{ $serviceRow['name'] }} - {{ $serviceRow['amount'] }}</strong>
        @empty
        <strong class="service-line">&#9744; No additional services listed for this template.</strong>
        @endforelse

        <p class="italic underline">
            ***Please note, the above service fees are applicable for applications to our partner universities. If you wish to apply to institutions outside our partner list, you will need to pay an additional BDT 50,000 before filing your visa application.
        </p>
    </div>

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
        <li>GS Clearance Notary package, there will be an additional fee. Please speak with your counsellor.</li>
        <li>	Credit card support from Service Provider for purchases below $300, there will be a 2,000 BDT fee which is non-refundable. Over $300, will be charged a 5,000 BDT fee. <strong class="underline">(non-refundable)</strong></li>
        <li>Future immigration services, they will have to purchase our other services accordingly.</li>
    </ul>

    <div class="page-break"></div>

    <h2 class="section-heading">Profile Agreement for the Client:</h2>

    <p>
        This agreement ensures that all details regarding the client's profile are accurately represented and mutually understood. To avoid any discrepancies during the application process, we require an additional signature from the client. This signature confirms that the client has thoroughly reviewed and agreed to the information provided, ensuring alignment with the terms outlined in the contract for maintaining transparency and accountability throughout the process, protecting both the client and the company from potential misunderstandings.
    </p>
    <ul>
        <li class="bold">Academic Profile (Mention Grades and Grading Scale Percentage):</li>
    </ul>

    <div class="profile-lines">
        <p>SSC or O Level <span class="line {{ filled($customer?->academic_profile_ssc) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_ssc ?: '' }}</span></p>
        <p>HSC or A Level <span class="line {{ filled($customer?->academic_profile_hsc) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_hsc ?: '' }}</span></p>
        <p>Bachelor <span class="line long-line {{ filled($customer?->academic_profile_bachelor) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_bachelor ?: '' }}</span></p>
        <p>Masters <span class="line long-line {{ filled($customer?->academic_profile_masters) ? '' : 'line-empty' }}">{{ $customer?->academic_profile_masters ?: '' }}</span></p>
    </div>
    <ul>

        <li class="bold">Study Gap <span class="line short-line {{ filled($customer?->study_gap) ? '' : 'line-empty' }}">{{ $customer?->study_gap ?: '' }}</span></li>
        <li class="bold">Total Funds Being Shown for Applicant <span class="line {{ filled($customer?->total_funds_for_applicant) ? '' : 'line-empty' }}">{{ $customer?->total_funds_for_applicant ?: '' }}</span></li>
        <li class="bold">Total Funds Being Shown for Accompanying Members <span class="line {{ filled($customer?->total_funds_for_accompanying_members) ? '' : 'line-empty' }}">{{ $customer?->total_funds_for_accompanying_members ?: '' }}</span></li>
        <li class="bold">Number of Members Who Will Be Moving Abroad <span class="line short-line {{ !is_null($customer?->moving_abroad_member_count) ? '' : 'line-empty' }}">{{ $customer?->moving_abroad_member_count ?? '' }}</span></li>
    </ul>

    <ul>
        <li class="bold">Documents Student Can Provide:</li>
    </ul>

    <ul class="checkbox-list">
        @foreach($documentLabels as $value => $label)
        <li>{!! in_array($value, $selectedDocuments, true) ? '&#9745;' : '&#9744;' !!} {{ $label }}</li>
        @endforeach
    </ul>

    <p class="bold">English Language Proficiency:</p>

    <ul class="checkbox-list">
        @foreach($englishLabels as $value => $label)
        <li>{!! in_array($value, $selectedEnglishProficiencies, true) ? '&#9745;' : '&#9744;' !!} {{ $label }}</li>
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

    @if(filled($footerText ?? null))
    <p class="footer-note">{{ $footerText }}</p>
    @endif

</body>

</html>

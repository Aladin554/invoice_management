@php
$customer = $invoice->customer;
$fullName = trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
$fullName = $fullName !== '' ? $fullName : 'Client';

$initials = collect(preg_split('/\s+/', $fullName) ?: [])
->filter()
->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
->take(3)
->implode('');

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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Study Abroad Service Agreement - Connected Education</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Arial';
    font-size: 9pt;
    background: #d0d0d0;
    color: #000;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    margin: 10mm auto;
    padding: 14mm 16mm 20mm 16mm;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  }
  .page-footer {
    position: absolute;
    bottom: 8mm;
    right: 16mm;
    font-size: 8.5pt;
    color: #555;
    font-style: italic;
  }
  .top-note {
    font-size: 8.5pt;
    color: #555;
    margin-bottom: 8mm;
    font-style: italic;
  }
  h1.agreement-title {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 6pt;
    color: #000;
  }
  .red-bold {
    color: #c00;
    font-weight: bold;
    font-size: 9.5pt;
    display: block;
    margin-bottom: 5pt;
  }
  .italic-bold-note {
    font-style: italic;
    font-weight: bold;
    font-size: 9pt;
    margin-bottom: 7pt;
    display: block;
  }
  .italic-bold-note u { text-decoration: underline; }
  p {
    margin-bottom: 5pt;
    line-height: 1.45;
    font-size: 9.5pt;
    text-align: justify;
  }
  .section-title { font-weight: bold; }
  ul {
    margin-left: 16pt;
    margin-bottom: 5pt;
  }
  ul li {
    font-size: 9.5pt;
    line-height: 1.4;
    margin-bottom: 2pt;
    list-style-type: disc;
  }
  .underline { text-decoration: underline; }
  .exhibit-box {
    border: 1.5pt solid #888;
    padding: 8pt 10pt;
    margin-bottom: 7pt;
  }
  .red-instruction {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    display: block;
    margin-bottom: 4pt;
  }
  .dynamic-label {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    display: block;
    margin-bottom: 4pt;
  }
  .mock-table {
    border: 1pt solid #aaa;
    width: 100%;
    margin: 5pt 0;
    border-collapse: collapse;
  }
  .mock-table td, .mock-table th {
    border: 1pt solid #aaa;
    padding: 3pt 5pt;
    font-size: 8pt;
  }
  .mock-table th { background: #eee; font-weight: bold; }
  .btn-mock {
    background: #2ecc71;
    color: #fff;
    border: none;
    border-radius: 3pt;
    padding: 2pt 7pt;
    font-size: 7.5pt;
    float: right;
  }
  .end-dynamic {
    color: #c00;
    font-weight: bold;
    font-size: 9.5pt;
    display: block;
    margin: 6pt 0 3pt 0;
  }
  .remaining-note {
    color: #c00;
    font-weight: bold;
    font-size: 9pt;
    display: block;
    margin-bottom: 4pt;
  }
  .partner-note {
    border: 1.5pt solid #000;
    padding: 6pt 8pt;
    margin-bottom: 8pt;
    font-size: 8.5pt;
    font-style: italic;
  }
  .signature-block { margin-top: 8pt; }
  .sig-line { margin-bottom: 3pt; }
</style>
</head>
<body>

<!-- ========== PAGE 1 ========== -->
<div class="page">
  <div class="top-note">Thanks for choosing Connected Education for your study abroad journey.</div>

 <h3 class="bold">Date: {{ optional($invoice->invoice_date)->format('Y-m-d') ?: '-' }}</h3>
  <h1 class="agreement-title">STUDY ABROAD SERVICE AGREEMENT</h1>

  <span class="italic-bold-note">**Please note this contract is in immediate effect <u>once you agree</u> to the terms and conditions, and a <u>confirmation</u> of this agreement is sent to your email with your NID &amp; photo.</span>

  <p>This Agreement ("Agreement") is made between, {{ $fullName }} and <strong>Connected Education</strong> (the "Service Provider"), for the purpose of setting forth the exclusive terms and conditions by which the Client desires to acquire the below described services from the Service Provider. In consideration of the mutual obligations specified in this agreement, the parties intending to be legally bound hereby, agree to the following:</p>

  <p><span class="section-title">Description of the Services.</span> Client retains the above Service Provider, and the Service Provider agrees to perform for the Client, the services set forth in <strong><u>Exhibit A on Page 4</u></strong> of this Agreement (the "Services"). Any Service outside of the scope as defined in Exhibit A is not included. If Client requires a new Agreement for other services agreed to by the Parties.</p>

  <p>Payments must be made to the Service Provider via mobile payment methods, credit card, cash, cheque, or any other approved method of payment accepted by the Service Provider.</p>

  <p>Refund will be <strong><u>ONLY</u></strong> issued, if the Client doesn't achieve their desired outcome due to a <strong><u>fault</u></strong> of the Service Provider which leads to a negative outcome in their application process. In such case, client <strong><u>must provide detailed evidence</u></strong> of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client's inquiries repetitively for more than 48hrs, a refund will be issued. In this case <span class="underline">repetitive</span> occurring of such incidents must be shown as evidence. Please note, the Service Provider <span class="underline">will not be liable</span> for any issues arising from the lack of diligence by any <span class="underline">third-party provider</span> such as banks, notary public etc. However, <strong>Service Provider will take any actions required to meet the needs of the Client and provide satisfactory services.</strong></p>

  <p><strong>Client <u>will also not be eligible</u> for a refund if:</strong></p>
  <ul>
    <li>Client's academic grade average is below 70% or they have any subject grades below C.</li>
    <li>Client changes their preferences and decides to not continue with the service due to personal reasons.</li>
    <li>Client wishes to discontinue for medical reasons or any accidents in the family.</li>
    <li>Client can't provide required or sufficient documents for their application.</li>
    <li>Client forges document.</li>
    <li>Client willingly takes risks against the Service Provider's recommendations or not willing to take appropriate steps to meet application requirements.</li>
    <li>Client processes their application separately elsewhere without informing the Service Provider.</li>
    <li>Client is unresponsive for more than 2 weeks.</li>
    <li>Client is presented limited institution and program options due to below average academic profile (grades below 70% or C, IELTS score below 6.0 and 6.5 in each band scores, no GMAT/GRE scores etc).</li>
    <li>Client can't reach Service Provider outside of office hours, government holidays or announced breaks.</li>
    <li>Client has an educational gap of over 3 years for an intended Bachelor's degree and over 5 years for an intended Master's degree.</li>
    <li>Client doesn't receive offer of admission from university due to a competitive cut-off score and limited seat availability</li>
    <li>Client is aged over 28 years.</li>
    <li>Client doesn't receive admission or visa approval due to changes in admission requirements and immigration regulations <span class="underline">after</span> their purchase.</li>
    <li>Client changes destination preference after signing up.</li>
    <li>Client purchases service within 2 weeks of application deadline.</li>
  </ul>

  <p><strong>Please note, Client will <u>STRICTLY</u> not be eligible for a refund on our visa package. No exceptions will be made for any cases.</strong> Even if client pauses their journey during admission phase, and doesn't wish to proceed at all, the visa package fee <span class="underline">will not be refunded</span> under any circumstances.</p>

  <p>Refund will be <strong><u>ONLY</u></strong> issued, if the Client doesn't achieve their desired outcome due to a <strong><u>fault</u></strong> of the Service Provider. In such case, client <strong><u>must provide detailed evidence</u></strong> of any faults conducted by the Service Provider. Also, if Service Provider is unresponsive towards Client's inquiries <span class="underline">repetitively</span> for more than <strong>48hrs</strong>, a refund will be issued. In this case <span class="underline">repetitive</span> occurring of such incidents must be shown as evidence.</p>

  <p>Alternatively, in the case of a visa refusal, the Client can choose to re-apply for their visa, where the Service Provider <span class="underline">will not</span> charge any additional fees.</p>

  <div class="page-footer">Connected.</div>
</div>

<!-- ========== PAGE 2 ========== -->
<div class="page">
  <p><span class="section-title">Expenses.</span> From time to time throughout the duration of this Service Agreement, the Service Provider may incur certain expenses such as application fees, supplemental fees, notarization, tax certificate assessment etc. that are <strong><u>not included</u></strong> as part of the Fee for our Services to this Agreement. The Service Provider agrees to keep an exact record of any and all expenses acquired while performing the Services. The Service Provider will submit an invoice itemizing each expense, along with proof of purchase and receipt, upon completion of such Services. Service Provider agrees to obtain the Client's written consent before making any purchase. Client shall also bear all expenses related to notarization and other administrative fees during the visa process.</p>

  <p><span class="section-title">Term and Termination.</span> This Service Agreement shall be effective on the date hereof and shall continue until the expressly agree upon date of the completion of the Services, unless it is earlier terminated in accordance with the terms of this Agreement (the "Term"). The Client understands that the Service Provider may terminate this Agreement at any time if the Client fails to pay for the Services provided under this Agreement or if the Client breaches any other material provision listed in this Service Agreement in the manner as defined above.</p>

  <p><span class="section-title">Independent Contractor.</span> Client and Service Provider expressly agree and understand that the above-listed Service Provider is an independent contractor hired by the Client and nothing in this Agreement shall be construed in any way or manner, to create between them a relationship of employer and employee, principal and agent, partners or any other relationship other than that of independent parties contracting with each other solely for the purpose of carrying out the provisions of the Agreement. The Service Provider is solely responsible for directing and controlling the performance of the Services, including the time, place and manner in which the Services are performed. The Service Provider shall use its best efforts, energy and skill in its own name and in such manner as it sees fit.</p>

  <p><span class="section-title">Confidentiality.</span> Throughout the duration of this Agreement, it may be necessary for the Service Provider to have access to the Client's confidential and protected information for the sole purpose of performing the Services subject to this Agreement. The Service Provider is not permitted to share or disclose such confidential information whatsoever, unless mandated by law, without written permission from the Client. The Service Provider's obligation of confidentiality will survive the termination of this Service Agreement and stay in place indefinitely.</p>

  <p><span class="section-title">Return of Property.</span> The Service Provider shall promptly return to the Client all copies, whether in written, electronic, or other form or media, of the Client's Confidential Information, or destroy all such copies and certify in writing to the Client that such Confidential Information has been destroyed.</p>

  <p><span class="section-title">Exclusivity.</span> The Client respectively agrees that they are not free to enter into other similar Agreements with other parties offering similar services. In such case their packages will be <strong><u>IMMEDIATELY CANCELLED</u></strong> WITH NO REFUNDS being applicable.</p>

  <p><span class="section-title">Dispute Resolution.</span> Parties to this Agreement shall first attempt to settle any dispute through good-faith negotiation. If the dispute cannot be settled between the parties via negotiation, either party may initiate mediation or binding arbitration in the court of Dhaka, Bangladesh. If the parties do not wish to mediate or arbitrate the dispute and litigation is necessary, this Agreement will be interpreted based on the laws of Dhaka, Bangladesh, without regard to the conflict of law provisions of such state. The Parties agree the dispute will be resolved in a court of competent jurisdiction in Dhaka, Bangladesh.</p>

  <p><span class="section-title">Governing Law.</span> This Service Agreement shall be governed in all respects by the laws of Dhaka, Bangladesh, without regard to the conflict of law provisions of such state. This Agreement shall be binding upon the successors and assigns of the respective parties.</p>

  <p><span class="section-title">Legal Fees.</span> Should a dispute between the named Parties arise lead to legal action, the prevailing Party shall be entitled to any reasonable legal fees, including, but not limited to attorneys' fees.</p>

  <p><span class="section-title">Professional Conduct.</span> Both parties herein agree <strong>must meet</strong> generally accepted standards of professional conduct.</p>

  <p><strong>***If the client is found to be involved in any baseless activities against Connected leading to harming our brand and reputation, this contract will be immediately breached without prior notice or further discussion. The Service Provider will not refund any fees to the Client.</strong></p>

  <p><span class="section-title">Amendment.</span> This Agreement may be amended only by a writing signed by all of the Parties hereto.</p>

  <p><strong>[SEE NEXT PAGE FOR SERVICE DETAILS]</strong></p>

  <div class="page-footer">Connected.</div>
</div>

<!-- ========== PAGE 3 ========== -->
<div class="page">
  <h1 class="agreement-title">EXHIBIT A<br>SERVICE(S)</h1>

  <p>The Client hereby confirms that they have reviewed the available service options and agrees to purchase the following service package and agrees to the corresponding terms, scope of services, and applicable fees outlined herein.</p>

  <div class="exhibit">



<p class="red">{{ mb_strtoupper($contractHeading) }}</p>

        

        @if(!empty($selectedServiceRows))
        @foreach($selectedServiceRows as $serviceRow)
        <p style="margin-top:4pt;"><span class="bold">{{ $serviceRow['name'] }}</span> - {{ $serviceRow['amount'] }}</p>
        <p style="color:#c00; font-weight:bold; margin-top:4pt;">Contract DESCRIPTION for <span class="bold">{{ $serviceRow['name'] }}</span></p></p>
        
        @endforeach
        @else
        <p class="service-line"><span class="bold">No selected service package recorded on this invoice.</span></p>
        @endif
        @if(filled($contractDescription ?? null))
        <p class="compact">{{ $contractDescription }}</p>
        @endif
    
  </div>
  </div>

  <div class="page-footer">Connected.</div>
</div>

<!-- ========== PAGE 4 ========== -->
<div class="page">
  <p><strong>**Please note, the Client shall bear all expenses related to:</strong></p>
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
    <li>Credit card support from Service Provider for purchases below $300, there will be a 2,000 BDT fee which is non-refundable. Over $300, will be charged a 3,000 BDT fee. <strong><u>(non-refundable)</u></strong></li>
    <li>Future immigration services, they will have to purchase our other services accordingly.</li>
  </ul>

  <p>Thanks again for choosing Connected Education for your study abroad journey.</p>

  <div class="signature-block">
    <br>
    <p><strong><u>Connected Education</u></strong></p>
    <br>
    <p class="sig-line">Signatory: Syed Md Zeehad</p>
    <p class="sig-line">Position: CEO</p>
    <p class="sig-line">Service Provider's Seal &amp; Signature:</p>
    <br><br><br>
  </div>

  <p><strong>**Please note this contract will be in immediate effect <u>once you agree</u> to the terms and conditions, and a <u>confirmation</u> of this agreement is sent to your email along with your NID &amp; photo.</strong></p>

  <div class="page-footer">Connected.</div>
</div>

</body>
</html>
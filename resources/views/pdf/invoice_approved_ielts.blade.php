@php
$customer = $invoice->customer;
$fullName = trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
$fullName = $fullName !== '' ? $fullName : 'Client';

$initials = collect(preg_split('/\s+/', $fullName) ?: [])
    ->filter()
    ->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
    ->take(3)
    ->implode('');

$selectedServiceRows = collect(
    $selectedServiceRows ?? $invoice->items
        ->map(function ($item) {
            $name = trim((string) ($item->name ?? ''));
            if ($name === '') {
                return null;
            }

            $amount = (float) ($item->line_total ?? $item->price ?? 0);
            $decimals = abs($amount - floor($amount)) < 0.00001 ? 0 : 2;
            $description = trim((string) ($item->description ?? ''));

            return [
                'name' => $name,
                'amount' => 'BDT ' . number_format($amount, $decimals) . '/-',
                'description' => $description !== '' ? $description : null,
            ];
        })
        ->filter()
        ->values()
        ->all()
)
    ->map(function ($row) {
        if (!is_array($row)) {
            return null;
        }

        $name = trim((string) ($row['name'] ?? ''));
        if ($name === '') {
            return null;
        }

        return [
            'name' => $name,
            'amount' => trim((string) ($row['amount'] ?? '-')),
            'checked' => array_key_exists('checked', $row) ? (bool) $row['checked'] : true,
        ];
    })
    ->filter()
    ->values()
    ->all();

$contractDescription = trim((string) ($contractDescription ?? $invoice->contractTemplate?->description ?? ''));
$contractHeading = trim((string) ($contractHeading ?? $invoice->contractTemplate?->name ?? 'IELTS SERVICE AGREEMENT'));
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>IELTS Service Agreement – Connected Education</title>
<style>
  @page { size: A4; margin: 15mm 16mm 18mm 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  body {
    background: #fff;
    font-family: 'Times New Roman', Times, serif;
    font-size: 11.2px;
    color: #111;
  }

  .page {
    page-break-after: always;
  }

  .page.last-page {
    page-break-after: auto;
  }

  .top-note {
    font-size: 9.5px;
    color: #555;
    margin-bottom: 22px;
  }

  .footer {
    margin-top: 10mm;
    text-align: right;
    font-size: 10px;
    color: #666;
    font-style: italic;
  }

  .doc-title {
    text-align: center;
    font-weight: bold;
    font-size: 13px;
    text-decoration: underline;
    letter-spacing: 0.4px;
    margin-bottom: 16px;
  }

  .bold-notice {
    font-weight: bold;
    font-size: 11px;
    margin-bottom: 14px;
    line-height: 1.55;
  }

  .intro-para {
    font-size: 11px;
    line-height: 1.65;
    margin-bottom: 14px;
  }

  .dynamic-name {
    color: #cc0000;
    font-weight: bold;
  }

  .sh {
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    margin-top: 15px;
    margin-bottom: 5px;
    letter-spacing: 0.3px;
  }

  .bt {
    font-size: 11px;
    line-height: 1.65;
  }

  .non-refundable {
    text-decoration: underline;
    font-style: italic;
  }

  .tri {
    display: inline-block;
    width: 0; height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid #444;
    margin-right: 5px;
    vertical-align: middle;
    position: relative;
    top: -1px;
  }

  .sh-tri {
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    margin-top: 15px;
    margin-bottom: 5px;
    letter-spacing: 0.3px;
  }

  .exhibit-box {
    border: 1.5px solid #999;
    padding: 14px 16px;
    margin: 14px 0 20px 0;
  }

  .ex-red {
    color: #cc0000;
    font-weight: bold;
    font-size: 11px;
    margin-bottom: 10px;
    line-height: 1.5;
  }

  .ex-checkbox-row {
    margin-bottom: 12px;
    font-size: 11px;
    font-weight: bold;
    line-height: 1.5;
  }

  .sq {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1.5px solid #555;
    margin-top: 1px;
    margin-right: 8px;
    text-align: center;
    line-height: 10px;
    font-size: 10px;
    font-weight: bold;
    vertical-align: top;
  }

  .checkbox-label {
    display: inline-block;
    width: 94%;
    vertical-align: top;
  }

  .ex-desc-label {
    color: #cc0000;
    font-weight: bold;
    font-size: 11px;
    margin-bottom: 3px;
  }

  .end-dynamic {
    color: #cc0000;
    font-weight: bold;
    font-size: 11px;
    margin-top: 6px;
  }

  .final-title {
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    margin-bottom: 8px;
    letter-spacing: 0.3px;
  }

  .sig-block { margin-top: 26px; }

  .sig-org {
    text-decoration: underline;
    font-size: 11px;
    margin-bottom: 7px;
  }

  .sig-line {
    font-size: 11px;
    line-height: 1.85;
  }

  .bottom-note {
    margin-top: 80px;
    font-size: 11px;
    font-weight: bold;
    font-style: italic;
    line-height: 1.65;
  }

  p, li, div, span {
    word-wrap: break-word;
  }
</style>
</head>
<body>

<!-- ══════════════════ PAGE 1 ══════════════════ -->
<div class="page">
  <p class="top-note">Thanks for choosing Connected Education for your study abroad journey.</p>

  <div class="doc-title">IELTS SERVICE AGREEMENT</div>

  <p class="bold-notice">**Please note this contract is in immediate effect once you agree to the terms and conditions, and a confirmation is sent to your email along with your NID &amp; photo.</p>

  <p class="intro-para">
    This Agreement ("Agreement") is made between <span class="dynamic-name">{{ $fullName }}</span> (the "Client") and Connected
    <strong>Education</strong> (the "Service Provider"). This Agreement governs the provision of IELTS and English training services
    delivered through Connected Education. The Client acknowledges that all services are structured, generated, and
    assigned based on the course selection made at the time of purchase, whether individually or as part of a bundled
    package.
  </p>

  <div class="sh">DESCRIPTION OF THE SERVICES</div>
  <p class="bt">The Service Provider agrees to deliver the training services selected by the Client as outlined in <strong>Exhibit A (Service Selection Section)</strong>. This section forms an integral part of this Agreement and reflects the exact course or package purchased by the Client.</p>

  <div class="sh">PAYMENT TERMS</div>
  <p class="bt">The Client agrees to make full payment through approved methods prior to the commencement of services. All pricing is system-generated based on the selected course or bundle and is clearly displayed before confirmation. The Client acknowledges that once payment is made and access to the course is granted, the service is considered activated.</p>

  <div class="sh">SERVICE DELIVERY</div>
  <p class="bt">The Client understands that the Service Provider will deliver training through a structured system that may include online classes, offline sessions, recorded materials, speaking sessions, mock tests, and resource access depending on the selected package. The Service Provider will use its best efforts to maintain quality instruction, structured learning, and professional guidance throughout the course duration.</p>

  <div class="sh">CLIENT RESPONSIBILITY</div>
  <p class="bt">The Client agrees to attend classes regularly, follow the course structure, and actively participate in all learning activities. The Client acknowledges that performance in IELTS depends on personal effort, consistency, and practice, and that the Service Provider cannot guarantee any specific score or outcome.</p>

  <div class="sh">REFUND POLICY</div>
  <p class="bt">The Client agrees that a refund will only be considered if the Client is unsatisfied with the quality of the service within the first four (4) classes from the start of the course. In such cases, the Client must provide clear and reasonable justification demonstrating that the service did not meet expected standards. Beyond this initial period, all payments are <span class="non-refundable">strictly non-refundable</span> under any circumstances, including lack of participation, change of plans, dissatisfaction with progress, or personal reasons.</p>

  <div class="sh">ACCESS &amp; USAGE</div>
  <p class="bt">The Client understands that access to course materials, recordings, and sessions depends on the selected package. Certain features such as lifetime access, unlimited speaking sessions, or retake options are only available under specific packages as defined in Exhibit A. Access rights are non-transferable and are strictly limited to the registered Client.</p>

  <div class="footer">Connected.</div>
</div>

<!-- ══════════════════ PAGE 2 ══════════════════ -->
<div class="page">
  <p class="top-note">Thanks for choosing Connected Education for your study abroad journey.</p>

  <div class="sh" style="margin-top:0;">EXPENSES</div>
  <p class="bt">The Client agrees that any additional expenses related to IELTS registration, external exams, or third-party services are not included in this Agreement and must be borne separately by the Client.</p>

  <div class="sh">TERMINATION</div>
  <p class="bt">The Service Provider reserves the right to terminate this Agreement if the Client fails to comply with the terms outlined herein, including but not limited to non-payment, misconduct, or violation of class policies. In such cases, no refund shall be applicable.</p>

  <div class="sh">DIGITAL ACCEPTANCE</div>
  <p class="bt">The Client agrees that any form of digital acceptance, including clicking "Confirm &amp; Submit," proceeding after reviewing the contract, or enrolling through the Connected system, shall constitute a legally binding agreement equivalent to a physical signature. The Client confirms that they have reviewed their course selection, details, and terms prior to acceptance.</p>

  <div class="sh-tri">
    <span class="tri"></span>
    GOVERNING LAW
  </div>
  <p class="bt">This Agreement shall be governed by and interpreted in accordance with the laws of Dhaka, Bangladesh. Any disputes arising under this Agreement shall be subject to the jurisdiction of the courts of Dhaka, Bangladesh.</p>

  <div class="sh">PROFESSIONAL CONDUCT &amp; BRAND PROTECTION</div>
  <p class="bt">The Client agrees to maintain professional conduct throughout the course. Any actions intended to harm the reputation, operations, or credibility of Connected Education through false claims, misconduct, or disruption may result in immediate termination of the service without refund.</p>

  <div class="footer">Connected.</div>
</div>

<!-- ══════════════════ PAGE 3 ══════════════════ -->
<div class="page last-page">
  <p class="top-note">Thanks for choosing Connected Education for your study abroad journey.</p>

  <div class="doc-title">EXHIBIT A – SERVICE DETAILS</div>

  <p class="bt" style="margin-bottom:14px;">
    This section is generated based on the Client's selected course or package and includes the exact details of the
    purchased service, including course type, duration, features, and pricing. The Client acknowledges that this section
    accurately reflects their purchase and forms an essential part of this Agreement.
  </p>

  <div class="exhibit-box">
    @if(!empty($selectedServiceRows))
      @foreach($selectedServiceRows as $serviceRow)
      <div class="ex-red">Service Type: {{ $serviceRow['name'] }} = {{ $serviceRow['amount'] }}</div>

      <div class="ex-checkbox-row">
        <span class="sq">{{ !empty($serviceRow['checked']) ? 'X' : '' }}</span>
        <span class="checkbox-label">{{ $serviceRow['name'] }} = {{ $serviceRow['amount'] }}</span>
      </div>

      @if(filled($contractDescription))
      <div class="ex-desc-label">Contract Description for {{ $serviceRow['name'] }}:</div>
      <p class="bt">{{ $contractDescription }}</p>
      @endif

      @endforeach
    @else
      <div class="ex-red">No selected service package recorded on this invoice.</div>
    @endif

    <div class="end-dynamic">[END OF DYNAMIC SECTION]</div>
  </div>

  <div style="margin-top: 32px;"></div>

  <div class="final-title">FINAL DECLARATION</div>
  <p class="bt">
    The Client confirms that they have carefully reviewed all course details, service inclusions, pricing, and terms outlined
    in this Agreement. By proceeding, the Client accepts all conditions stated above and acknowledges full responsibility
    for their participation and performance in the training program.
  </p>

  <div class="sig-block">
    <div class="sig-org">Connected Education</div>
    <p class="sig-line">Signatory: Syed Md Zeehad</p>
    <p class="sig-line">Position: CEO</p>
    <p class="sig-line">Service Provider's Seal &amp; Signature:</p>
  </div>

  <div class="bottom-note">
    **Please note this contract is in immediate effect <u>once you agree</u> to the terms and conditions, and a
    <u>confirmation</u> of this agreement is sent to your email along with your NID &amp; photo.
  </div>

  <div class="footer">Connected.</div>
</div>

</body>
</html>

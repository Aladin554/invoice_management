<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Connected Education Agreement</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
    <p>Dear {{ $invoice->customer?->first_name ?? 'Student' }},</p>

    <p>
      Thank you for choosing Connected Education and trusting us to be part of your study abroad
      journey. We are excited to support you and look forward to helping you explore the full
      value of the services you have selected.
    </p>

    <p>
      This email confirms that your profile information, contract acknowledgment, and service
      submission have been successfully received and securely recorded in our system.
    </p>

    <p>
      Your signed service contract PDF is attached to this email. You can also use the download
      links below for your records.
    </p>

    @if($publicLink)
      <p>You can also view your secure invoice page here:</p>
      <p>
        <a href="{{ $publicLink }}">{{ $publicLink }}</a>
      </p>
    @endif

    @if($approvedPdfUrl)
      <p>Contract PDF:</p>
      <p>
        <a href="{{ $approvedPdfUrl }}">Download signed contract PDF</a>
      </p>
    @endif

    @if($receiptPdfUrl)
      <p>Receipt PDF:</p>
      <p>
        <a href="{{ $receiptPdfUrl }}">Download receipt PDF</a>
      </p>
    @endif

    @if($noRefundContractUrl)
      <p>No Refund PDF:</p>
      <p>
        <a href="{{ $noRefundContractUrl }}">Download no refund PDF</a>
      </p>
    @endif

    <p>
      Please keep these documents for your records, as they outline the details of your selected
      service, submitted academic/profile information, and the agreed terms and conditions
      governing our engagement.
    </p>

    <p>
      Kindly note that in order to maintain full transparency and data integrity, the submitted
      profile information has now been permanently locked and can no longer be modified by either
      the student or Connected Education.
    </p>

    <p>If you have any questions regarding your submission, please contact our team directly.</p>

    <p>
      Thank you once again for choosing Connected Education. We are excited to be part of your
      journey and look forward to helping you take the next step toward your international
      education goals.
    </p>

    <p>
      Warm regards,<br>
      Connected Education<br>
      Your Gateway to the World
    </p>
  </body>
</html>

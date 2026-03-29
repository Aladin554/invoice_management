<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invoice Approved</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #222;">
    <h2>Your Invoice Has Been Approved</h2>
    <p>Dear {{ $invoice->customer?->first_name ?? 'Student' }},</p>
    <p>Your invoice has been approved. The final approved invoice PDF is attached to this email.</p>
    <p>You can also view the final documents here:</p>
    @if($publicLink)
      <p>
        <a href="{{ $publicLink }}">{{ $publicLink }}</a>
      </p>
    @endif
    @if($approvedPdfUrl)
      <p>
        Contract Attachment: <a href="{{ $approvedPdfUrl }}">Download Approved Preview PDF</a>
      </p>
    @endif
    @if($studentPhotoUrl)
      <p>
        Student Photo: <a href="{{ $studentPhotoUrl }}">{{ $studentPhotoUrl }}</a>
      </p>
    @endif
    <p>Thank you,<br>Connected</p>
  </body>
</html>

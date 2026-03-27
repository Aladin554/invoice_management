<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invoice Preview</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #222;">
    <h2>Invoice Preview Ready</h2>
    <p>Dear {{ $invoice->customer?->first_name ?? 'Student' }},</p>
    <p>Your invoice is ready for review. Please use the secure link below:</p>
    <p>
      <a href="{{ $previewLink }}">{{ $previewLink }}</a>
    </p>
    <p>If you have any questions, please contact our team.</p>
    <p>Thank you,<br>Connected</p>
  </body>
</html>

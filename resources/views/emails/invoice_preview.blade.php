<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Draft Agreement For Review</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
    <p>Dear {{ $invoice->customer?->first_name ?? 'Student' }},</p>

    <p>
      Thank you for choosing Connected Education. Your service draft has now been prepared and is
      ready for your review.
    </p>

    <p>Please use the secure link below to carefully review all details before proceeding:</p>

    <p>
      <a href="{{ $previewLink }}">{{ $previewLink }}</a>
    </p>

    <p>Within this draft, you will be able to review:</p>

    <ul style="margin: 0 0 16px 20px; padding: 0;">
      <li>Your selected service</li>
      <li>Invoice and payment details</li>
      <li>Full service contract and terms &amp; conditions</li>
      <li>No Refund Form (If selected)</li>
    </ul>

    <p>
      We strongly encourage you to review all information carefully before submission, as the
      details you provide will be used by our team to assess your profile, guide your counselling,
      and deliver our services accurately.
    </p>

    <p>
      Please note that once your final submission is completed through the secure link, your
      submitted profile and agreement will become permanently locked and cannot be edited by either
      you or Connected Education.
    </p>

    <p>
      If you have any questions or require clarification before proceeding, please contact our team
      prior to submission.
    </p>

    <p>
      We are excited to support you on your study abroad journey and look forward to working with
      you.
    </p>

    <p>
      Warm regards,<br>
      Connected Education<br>
      Your Gateway to the World
    </p>
  </body>
</html>

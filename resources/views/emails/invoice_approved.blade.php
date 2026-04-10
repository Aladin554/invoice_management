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

    <p>For your reference, attached to this email you will find copies of the following documents:</p>

    <ul style="margin: 0 0 16px 20px; padding: 0;">
      <li>Your Receipt</li>
      <li>Signed Service Contract</li>
      <li>Submitted Student Profile Information (If selected)</li>
      <li>No Refund Form (If selected)</li>
    </ul>

    @if($publicLink)
      <p>You can also view the above through this link:</p>
      <p>
        <a href="{{ $publicLink }}">{{ $publicLink }}</a>
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

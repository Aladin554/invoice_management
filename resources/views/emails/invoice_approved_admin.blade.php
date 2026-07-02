<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invoice Approved</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
    <p>Hello,</p>

    <p>
      An invoice has just been approved in the Connected Invoice system. Summary below:
    </p>

    <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin: 12px 0;">
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Receipt Number</td>
        <td style="border: 1px solid #ddd;">{{ $invoice->display_invoice_number ?: $invoice->id }}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Customer</td>
        <td style="border: 1px solid #ddd;">
          {{ trim(($invoice->customer?->first_name ?? '') . ' ' . ($invoice->customer?->last_name ?? '')) ?: '-' }}
          @if($invoice->customer?->email)
            ({{ $invoice->customer->email }})
          @endif
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Branch</td>
        <td style="border: 1px solid #ddd;">{{ $invoice->branch?->name ?? '-' }}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Sales Person</td>
        <td style="border: 1px solid #ddd;">
          {{ trim(($invoice->salesPerson?->first_name ?? '') . ' ' . ($invoice->salesPerson?->last_name ?? '')) ?: '-' }}
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Assistant Sales Person</td>
        <td style="border: 1px solid #ddd;">
          {{ trim(($invoice->assistantSalesPerson?->first_name ?? '') . ' ' . ($invoice->assistantSalesPerson?->last_name ?? '')) ?: '-' }}
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Payment Method</td>
        <td style="border: 1px solid #ddd;">{{ $invoice->payment_method ?? '-' }}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Total</td>
        <td style="border: 1px solid #ddd;">{{ number_format((float) $invoice->total, 2) }} BDT</td>
      </tr>
      <tr>
        <td style="font-weight: bold; border: 1px solid #ddd;">Approved At</td>
        <td style="border: 1px solid #ddd;">{{ optional($invoice->super_admin_approved_at)->format('M j, Y g:i A') ?? '-' }}</td>
      </tr>
    </table>

    @if($publicLink)
      <p>Customer invoice page:</p>
      <p><a href="{{ $publicLink }}">{{ $publicLink }}</a></p>
    @endif

    @if($approvedPdfUrl)
      <p><a href="{{ $approvedPdfUrl }}">Download signed contract PDF</a></p>
    @endif

    @if($receiptPdfUrl)
      <p><a href="{{ $receiptPdfUrl }}">Download receipt PDF</a></p>
    @endif

    <p>
      Connected Education<br>
      Invoice Management System
    </p>
  </body>
</html>

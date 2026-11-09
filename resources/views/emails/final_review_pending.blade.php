<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Final Review Pending</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
    <p>Hello,</p>

    <p>
      The following {{ $invoices->count() === 1 ? 'invoice is' : $invoices->count() . ' invoices are' }}
      waiting for your <strong>Final Review</strong> approval in the Connected Invoice system.
      They cannot move forward until you approve them.
    </p>

    <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin: 12px 0;">
      <tr style="background: #f3f4f6;">
        <th style="border: 1px solid #ddd; text-align: left;">Receipt Number</th>
        <th style="border: 1px solid #ddd; text-align: left;">Customer</th>
        <th style="border: 1px solid #ddd; text-align: left;">Branch</th>
        <th style="border: 1px solid #ddd; text-align: right;">Total (BDT)</th>
        <th style="border: 1px solid #ddd; text-align: right;">Due (BDT)</th>
        <th style="border: 1px solid #ddd; text-align: left;">Cash Reviewed</th>
        <th style="border: 1px solid #ddd; text-align: left;"></th>
      </tr>
      @foreach($invoices as $invoice)
        <tr>
          <td style="border: 1px solid #ddd;">{{ $invoice->display_invoice_number ?: $invoice->id }}</td>
          <td style="border: 1px solid #ddd;">
            {{ trim(($invoice->customer?->first_name ?? '') . ' ' . ($invoice->customer?->last_name ?? '')) ?: '-' }}
          </td>
          <td style="border: 1px solid #ddd;">{{ $invoice->branch?->name ?? '-' }}</td>
          <td style="border: 1px solid #ddd; text-align: right;">{{ number_format((float) $invoice->total, 2) }}</td>
          <td style="border: 1px solid #ddd; text-align: right;">{{ number_format((float) $invoice->due_amount, 2) }}</td>
          <td style="border: 1px solid #ddd;">
            @if($invoice->cash_manager_approved_at)
              {{ trim(($invoice->cashManager?->first_name ?? '') . ' ' . ($invoice->cashManager?->last_name ?? '')) ?: 'Yes' }},
              {{ $invoice->cash_manager_approved_at->copy()->timezone('Asia/Dhaka')->format('M j, Y g:i A') }}
            @else
              -
            @endif
          </td>
          <td style="border: 1px solid #ddd;">
            <a href="{{ $panelUrl }}/invoices/{{ $invoice->id }}/preview">Open</a>
          </td>
        </tr>
      @endforeach
    </table>

    <p>
      Review them all in the <a href="{{ $panelUrl }}/invoices">Invoices page</a> (Final Review tab).
    </p>

    <p style="color: #666; font-size: 12px;">
      This reminder is sent at 10:00 AM and 4:00 PM (Bangladesh time) every day while any invoice is waiting for Final Review.
    </p>
  </body>
</html>

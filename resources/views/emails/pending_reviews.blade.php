<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invoices Waiting for Approval</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
    <p>Hello,</p>

    <p>
      The following invoices are waiting for your approval in the Connected Invoice system.
      They cannot move forward until they are approved.
    </p>

    @php
      $th = 'border: 1px solid #ddd; text-align: left;';
      $td = 'border: 1px solid #ddd;';
      $name = fn ($person) => trim(($person?->first_name ?? '') . ' ' . ($person?->last_name ?? ''));
    @endphp

    @if($cashReview->isNotEmpty())
      <h3 style="margin: 20px 0 4px;">Cash Review ({{ $cashReview->count() }})</h3>
      <p style="margin: 0 0 8px; color: #555;">Cash was received for these invoices and has not been verified yet.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin: 0 0 12px;">
        <tr style="background: #f3f4f6;">
          <th style="{{ $th }}">Receipt Number</th>
          <th style="{{ $th }}">Customer</th>
          <th style="{{ $th }}">Branch</th>
          <th style="{{ $th }} text-align: right;">Total (BDT)</th>
          <th style="{{ $th }} text-align: right;">Due (BDT)</th>
          <th style="{{ $th }}"></th>
        </tr>
        @foreach($cashReview as $invoice)
          <tr>
            <td style="{{ $td }}">{{ $invoice->display_invoice_number ?: $invoice->id }}</td>
            <td style="{{ $td }}">{{ $name($invoice->customer) ?: '-' }}</td>
            <td style="{{ $td }}">{{ $invoice->branch?->name ?? '-' }}</td>
            <td style="{{ $td }} text-align: right;">{{ number_format((float) $invoice->total, 2) }}</td>
            <td style="{{ $td }} text-align: right;">{{ number_format((float) $invoice->due_amount, 2) }}</td>
            <td style="{{ $td }}"><a href="{{ $panelUrl }}/invoices/{{ $invoice->id }}/preview">Open</a></td>
          </tr>
        @endforeach
      </table>
    @endif

    @if($finalReview->isNotEmpty())
      <h3 style="margin: 20px 0 4px;">Final Review ({{ $finalReview->count() }})</h3>
      <p style="margin: 0 0 8px; color: #555;">These invoices are waiting for your Final Review.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin: 0 0 12px;">
        <tr style="background: #f3f4f6;">
          <th style="{{ $th }}">Receipt Number</th>
          <th style="{{ $th }}">Customer</th>
          <th style="{{ $th }}">Branch</th>
          <th style="{{ $th }} text-align: right;">Total (BDT)</th>
          <th style="{{ $th }} text-align: right;">Due (BDT)</th>
          <th style="{{ $th }}">Cash Reviewed</th>
          <th style="{{ $th }}"></th>
        </tr>
        @foreach($finalReview as $invoice)
          <tr>
            <td style="{{ $td }}">{{ $invoice->display_invoice_number ?: $invoice->id }}</td>
            <td style="{{ $td }}">{{ $name($invoice->customer) ?: '-' }}</td>
            <td style="{{ $td }}">{{ $invoice->branch?->name ?? '-' }}</td>
            <td style="{{ $td }} text-align: right;">{{ number_format((float) $invoice->total, 2) }}</td>
            <td style="{{ $td }} text-align: right;">{{ number_format((float) $invoice->due_amount, 2) }}</td>
            <td style="{{ $td }}">
              @if($invoice->cash_manager_approved_at)
                {{ $name($invoice->cashManager) ?: 'Yes' }},
                {{ $invoice->cash_manager_approved_at->copy()->timezone('Asia/Dhaka')->format('M j, Y g:i A') }}
              @else
                -
              @endif
            </td>
            <td style="{{ $td }}"><a href="{{ $panelUrl }}/invoices/{{ $invoice->id }}/preview">Open</a></td>
          </tr>
        @endforeach
      </table>
    @endif

    <p>
      Review them all in the <a href="{{ $panelUrl }}/invoices">Invoices page</a> (Cash Review and Final Review tabs).
    </p>

    <p style="color: #666; font-size: 12px;">
      This reminder is sent at 10:00 AM and 4:00 PM (Bangladesh time) every day while any invoice is waiting for Cash Review or Final Review.
    </p>
  </body>
</html>

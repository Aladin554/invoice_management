<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Receipt PDF</title>
    <style>
        @page {
            margin: 28px;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            font-size: 10px;
            line-height: 1.45;
            margin: 0;
            background: #ffffff;
        }

        .card {
            border: 1px solid #dbe3ef;
            border-radius: 18px;
            overflow: hidden;
            background: #ffffff;
        }

        .card-header {
            padding: 24px 26px;
            border-bottom: 1px solid #dbe3ef;
            background: #f7fbff;
        }

        .header-table,
        .summary-table,
        .line-items,
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .logo-cell {
            width: 180px;
            vertical-align: middle;
        }

        .logo {
            max-width: 140px;
            max-height: 84px;
        }

        .workspace-cell {
            width: 220px;
            vertical-align: middle;
            text-align: center;
            padding: 0 18px;
        }

        .workspace-note {
            display: inline-block;
            max-width: 220px;
            border: 1px solid #dbe3ef;
            border-radius: 18px;
            background: #ffffff;
            color: #475569;
            font-size: 11px;
            font-weight: 600;
            padding: 14px 16px;
        }

        .meta-cell {
            width: 210px;
            vertical-align: middle;
            text-align: right;
        }

        .invoice-title {
            font-size: 22px;
            letter-spacing: 0.08em;
            font-weight: 300;
            color: #1e293b;
            margin-bottom: 8px;
        }

        .branch-label {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
        }

        .branch-address {
            margin-top: 4px;
            font-size: 10px;
            line-height: 1.55;
            color: #475569;
        }

        .summary-wrapper {
            padding: 22px 26px;
            border-bottom: 1px solid #dbe3ef;
        }

        .bill-to-cell {
            width: 54%;
            vertical-align: top;
            padding-right: 24px;
        }

        .summary-meta-cell {
            width: 46%;
            vertical-align: top;
        }

        .eyebrow {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 10px;
        }

        .customer-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
        }

        .customer-line {
            font-size: 11px;
            color: #334155;
            margin-bottom: 2px;
        }

        .invoice-summary-item {
            width: 100%;
            border-collapse: collapse;
        }

        .invoice-summary-item td {
            padding: 3px 0;
            font-size: 11px;
        }

        .invoice-summary-label {
            width: 140px;
            font-weight: 700;
            color: #0f172a;
            padding-right: 16px;
            white-space: nowrap;
        }

        .invoice-summary-value {
            text-align: right;
            color: #334155;
            white-space: nowrap;
        }

        .line-items thead th {
            padding: 12px 26px;
            background: #f8fafc;
            border-bottom: 1px solid #dbe3ef;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #64748b;
            text-align: left;
        }

        .line-items thead th:last-child {
            text-align: right;
        }

        .line-items tbody td {
            padding: 14px 26px;
            border-bottom: 1px solid #e8eef6;
            vertical-align: top;
        }

        .line-items tbody tr:last-child td {
            border-bottom: none;
        }

        .item-name {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
        }

        .item-description-title {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 5px;
        }

        .item-description {
            font-size: 10px;
            color: #475569;
        }

        .item-description p,
        .item-description ul,
        .item-description ol {
            margin: 0 0 6px;
        }

        .item-description ul,
        .item-description ol {
            padding-left: 16px;
        }

        .item-description li {
            margin-bottom: 3px;
        }

        .item-description > :last-child {
            margin-bottom: 0;
        }

        .item-amount {
            width: 170px;
            text-align: right;
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
        }

        .totals-wrapper {
            border-top: 1px solid #dbe3ef;
            padding: 18px 26px 22px;
        }

        .totals-table {
            margin-left: auto;
            width: 340px;
        }

        .totals-table td {
            padding: 4px 0;
            font-size: 11px;
            color: #334155;
        }

        .totals-label {
            font-weight: 700;
            color: #0f172a;
        }

        .totals-value {
            width: 170px;
            text-align: right;
            white-space: nowrap;
        }

        .total-row td {
            background: #f1f5f9;
            padding: 10px 12px;
        }

        .total-row .totals-label {
            font-size: 12px;
        }

        .total-row .totals-value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
        }

        .footer-text {
            margin-top: 16px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-header">
            <table class="header-table">
                <tr>
                    <td class="logo-cell">
                        @if($companyLogoSrc)
                            <img src="{{ $companyLogoSrc }}" alt="Connected logo" class="logo">
                        @else
                            <div style="font-size: 28px; font-family: 'Abril Fatface', cursive; font-weight: 400;">
                                Connected.
                            </div>
                        @endif
                    </td>
                    @if($showWorkspaceNote)
                        <td class="workspace-cell">
                            <div class="workspace-note">{{ $workspaceNote }}</div>
                        </td>
                    @endif
                    <td class="meta-cell">
                        <div class="invoice-title">INVOICE</div>
                        <div class="branch-label">{{ $branchLabel }}</div>
                        @if($branchAddress !== '')
                            <div class="branch-address">{{ $branchAddress }}</div>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <div class="summary-wrapper">
            <table class="summary-table">
                <tr>
                    <td class="bill-to-cell">
                        <div class="eyebrow">Bill To</div>
                        <div class="customer-name">{{ $customerName }}</div>
                        <div class="customer-line">{{ $customerPhone }}</div>
                        <div class="customer-line">{{ $customerEmail }}</div>
                    </td>
                    <td class="summary-meta-cell">
                        <table class="invoice-summary-item" width="100%">
                            <tr>
                                <td class="invoice-summary-label">Receipt Number:</td>
                                <td class="invoice-summary-value">{{ $receiptNumber }}</td>
                            </tr>
                            <tr>
                                <td class="invoice-summary-label">Invoice Date:</td>
                                <td class="invoice-summary-value">{{ $invoiceDateLabel }}</td>
                            </tr>
                            <tr>
                                <td class="invoice-summary-label">Payment Method:</td>
                                <td class="invoice-summary-value">{{ $paymentMethodLabel }}</td>
                            </tr>
                            @if($paymentStatusLabel)
                                <tr>
                                    <td class="invoice-summary-label">Payment Status:</td>
                                    <td class="invoice-summary-value">{{ $paymentStatusLabel }}</td>
                                </tr>
                            @endif
                        </table>
                    </td>
                </tr>
            </table>
        </div>

        <table class="line-items">
            <thead>
                <tr>
                    <th>Services / Items</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                @forelse($receiptItems as $item)
                    <tr>
                        <td>
                            <div class="item-name">{{ $item['name'] }}</div>
                            @if(!empty($item['description_html']))
                                <div class="item-description-title">Description</div>
                                <div class="item-description">{!! $item['description_html'] !!}</div>
                            @endif
                        </td>
                        <td class="item-amount">{{ $item['amount'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td>No services have been added to this invoice.</td>
                        <td class="item-amount">$0.00</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="totals-wrapper">
            <table class="totals-table">
                <tr>
                    <td class="totals-label">Subtotal</td>
                    <td class="totals-value">{{ $subtotalFormatted }}</td>
                </tr>
                @if($hasDiscount)
                    <tr>
                        <td class="totals-label">{{ $discountLabel }}</td>
                        <td class="totals-value">-{{ $discountFormatted }}</td>
                    </tr>
                @endif
                <tr class="total-row">
                    <td class="totals-label">Total:</td>
                    <td class="totals-value">{{ $totalFormatted }}</td>
                </tr>
            </table>
        </div>
    </div>

    @if($footerText !== '')
        <div class="footer-text">{{ $footerText }}</div>
    @endif
</body>
</html>
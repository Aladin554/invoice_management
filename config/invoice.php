<?php

return [
    'header_text' => env('INVOICE_HEADER_TEXT', 'Connected Invoice'),
    'footer_text' => env('INVOICE_FOOTER_TEXT', 'Thank you for choosing Connected.'),
    'company_logo_url' => env('COMPANY_LOGO_URL', '/images/logo/connected_logo.png'),
    'frontend_url' => env('FRONTEND_URL', config('app.url')),
    'no_refund_contract_url' => env('NO_REFUND_CONTRACT_URL'),
];

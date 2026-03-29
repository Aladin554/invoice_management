<?php

namespace App\Support;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoicePdfRenderer
{
    public function renderApprovedInvoice(Invoice $invoice): string
    {
        $invoice->loadMissing(['items', 'branch', 'customer', 'contractTemplate']);

        return Pdf::loadView('pdf.invoice_approved', [
            'invoice' => $invoice,
            'headerText' => config('invoice.header_text'),
            'footerText' => config('invoice.footer_text'),
            'discountAmount' => $this->discountAmount($invoice),
            'documentLabels' => $this->documentLabels(),
            'englishLabels' => $this->englishLabels(),
        ])->setPaper('a4')->output();
    }

    public function fileName(Invoice $invoice): string
    {
        $baseName = $invoice->invoice_number ?: 'invoice-' . $invoice->id;
        $safeBaseName = preg_replace('/[^A-Za-z0-9\-_]+/', '-', $baseName) ?: 'invoice';

        return trim($safeBaseName, '-') . '.pdf';
    }

    private function discountAmount(Invoice $invoice): float
    {
        $subtotal = (float) $invoice->subtotal;
        $discountValue = (float) $invoice->discount_value;

        if ($invoice->discount_type === 'percent') {
            return round($subtotal * $discountValue / 100, 2);
        }

        return round($discountValue, 2);
    }

    private function documentLabels(): array
    {
        return [
            'ssc_or_o_level_transcript' => 'SSC or O Level transcript',
            'ssc_or_o_level_certificate' => 'SSC or O Level certificate',
            'hsc_or_a_level_transcript' => 'HSC or A Level transcript',
            'hsc_or_a_level_certificate' => 'HSC or A Level certificate',
            'bachelor_transcript' => 'Bachelor transcript',
            'bachelor_certificate' => 'Bachelor certificate',
            'masters_transcript' => 'Masters transcript',
            'masters_certificate' => 'Masters certificate',
            'passport' => 'Passport',
            'recommendation_letter' => 'Recommendation letter',
            'extracurricular_activities' => 'Extracurricular activities',
            'portfolio' => 'Portfolio',
            'cv' => 'CV',
            'work_experience_certificates' => 'Work Experience Certificates',
        ];
    }

    private function englishLabels(): array
    {
        return [
            'ielts' => 'IELTS',
            'sat' => 'SAT',
            'pte' => 'PTE',
            'toefl' => 'TOEFL',
            'duolingo' => 'Duolingo',
            'moi' => 'MOI',
            'gre' => 'GRE',
            'gmat' => 'GMAT',
        ];
    }
}

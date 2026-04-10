<?php

namespace App\Support;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoicePdfRenderer
{
    public function renderAgreement(Invoice $invoice): string
    {
        return Pdf::loadView('pdf.invoice_approved', $this->viewData($invoice))
            ->setPaper('a4')
            ->output();
    }

    public function renderApprovedInvoice(Invoice $invoice): string
    {
        return $this->renderAgreement($invoice);
    }

    public function fileName(Invoice $invoice): string
    {
        $baseName = $invoice->invoice_number ?: 'invoice-' . $invoice->id;
        $safeBaseName = preg_replace('/[^A-Za-z0-9\-_]+/', '-', $baseName) ?: 'invoice';

        return trim($safeBaseName, '-') . '.pdf';
    }

    public function contractDownloadUrl(Invoice $invoice): ?string
    {
        if (!$invoice->public_token || !$this->hasAgreementData($invoice)) {
            return null;
        }

        return url('/api/invoices/public/' . $invoice->public_token . '/contract-pdf');
    }

    public function approvedPdfUrl(Invoice $invoice): ?string
    {
        if (!$invoice->public_token || $invoice->status !== 'approved') {
            return null;
        }

        return url('/api/invoices/public/' . $invoice->public_token . '/approved-pdf');
    }

    public function viewData(Invoice $invoice): array
    {
        $invoice->loadMissing([
            'items',
            'branch',
            'customer',
            'contractTemplate.service',
            'contractTemplate.services',
        ]);

        $serviceSection = $this->serviceSectionData($invoice);

        return [
            'invoice' => $invoice,
            'headerText' => config('invoice.header_text'),
            'footerText' => config('invoice.footer_text'),
            'discountAmount' => $this->discountAmount($invoice),
            'documentLabels' => $this->documentLabels(),
            'englishLabels' => $this->englishLabels(),
            'contractHeading' => $serviceSection['contract_heading'],
            'contractDescription' => $serviceSection['contract_description'],
            'primaryServiceName' => $serviceSection['primary_service_name'],
            'primaryServiceAmount' => $serviceSection['primary_service_amount'],
            'hasPrimaryService' => $serviceSection['has_primary_service'],
            'selectedServiceRows' => $serviceSection['selected_service_rows'],
            'additionalServiceRows' => $serviceSection['additional_service_rows'],
        ];
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

    private function serviceSectionData(Invoice $invoice): array
    {
        $template = $invoice->contractTemplate;
        $invoiceItems = $invoice->items->values();

        $normalizeServiceName = static function ($value): string {
            $value = preg_replace('/\s+/', ' ', trim((string) $value));

            return mb_strtolower($value ?? '');
        };

        $findMatchingInvoiceItem = static function ($service) use ($invoiceItems, $normalizeServiceName) {
            if (!$service) {
                return null;
            }

            $serviceId = $service->id ?? null;
            $serviceName = $normalizeServiceName($service->name ?? '');

            return $invoiceItems->first(function ($item) use ($serviceId, $serviceName, $normalizeServiceName) {
                if ($serviceId && (int) ($item->service_id ?? 0) === (int) $serviceId) {
                    return true;
                }

                return $serviceName !== '' && $normalizeServiceName($item->name ?? '') === $serviceName;
            });
        };

        $formatAmount = static function ($amount): string {
            $amount = (float) $amount;
            $decimals = abs($amount - floor($amount)) < 0.00001 ? 0 : 2;

            return 'BDT ' . number_format($amount, $decimals) . '/-';
        };

        $templateServices = collect([$template?->service])
            ->merge(collect($template?->services ?? []))
            ->filter()
            ->unique(function ($service) use ($normalizeServiceName) {
                $serviceId = $service->id ?? null;

                if ($serviceId) {
                    return 'id:' . $serviceId;
                }

                return 'name:' . $normalizeServiceName($service->name ?? '');
            })
            ->values();

        $selectedServiceRows = $invoiceItems
            ->map(function ($item) use ($formatAmount) {
                $name = trim((string) ($item->name ?? ''));
                if ($name === '') {
                    return null;
                }

                return [
                    'name' => $name,
                    'amount' => $formatAmount($item->line_total ?? $item->price ?? 0),
                ];
            })
            ->filter()
            ->values();

        if ($selectedServiceRows->isEmpty() && $templateServices->isNotEmpty()) {
            $fallbackService = $templateServices->first();

            $selectedServiceRows = collect([[
                'name' => trim((string) ($fallbackService->name ?? 'Selected service package')),
                'amount' => $formatAmount($fallbackService->price ?? 0),
            ]]);
        }

        $primarySelectedService = $selectedServiceRows->first();

        $additionalServiceRows = $templateServices
            ->reject(fn ($service) => (bool) $findMatchingInvoiceItem($service))
            ->map(function ($service) use ($formatAmount) {
                return [
                    'name' => $service->name,
                    'amount' => $formatAmount($service->price ?? 0),
                ];
            })
            ->values()
            ->all();

        return [
            'contract_heading' => $template?->name
                ?: ($primarySelectedService['name'] ?? ($templateServices->first()?->name ?: 'Selected Service Package')),
            'contract_description' => trim((string) ($template?->description ?? '')),
            'primary_service_name' => $primarySelectedService['name'] ?? 'Primary service package not recorded',
            'primary_service_amount' => $primarySelectedService['amount']
                ?? $formatAmount($templateServices->first()?->price ?? 0),
            'has_primary_service' => $primarySelectedService !== null,
            'selected_service_rows' => $selectedServiceRows->all(),
            'additional_service_rows' => $additionalServiceRows,
        ];
    }

    private function hasAgreementData(Invoice $invoice): bool
    {
        $invoice->loadMissing('items');

        return (bool) $invoice->contract_template_id || $invoice->items->isNotEmpty();
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

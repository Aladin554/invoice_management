<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Models\Payment;
use App\Models\PaymentRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExpenseReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ((int) Auth::user()->role_id !== 1) {
            return response()->json(['message' => 'Only Owner can view the expense report'], 403);
        }

        $period = $request->input('period', 'monthly');
        if (!in_array($period, ['daily', 'monthly', 'yearly'], true)) {
            $period = 'monthly';
        }

        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // One count per real workflow status, so the report never silently
        // drops a stage as the workflow evolves (payment_pending was a
        // leftover from an earlier design that nothing sets anymore).
        $statusCounts = PaymentRequest::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalExpenses = $this->applyDateRange(Payment::query(), $dateFrom, $dateTo)->sum('amount_paid');

        $summary = $this->buildSummary($period, $dateFrom, $dateTo);

        $categoryWise = $this->buildCategoryWiseTotals($dateFrom, $dateTo);

        // Every Payment row is money that was actually settled — i.e. an
        // approved & paid request — so this is already the full approved
        // transaction list for the selected date range (no arbitrary cap).
        $approvedTransactions = $this->applyDateRange(
            Payment::with([
                'paymentRequest:id,employee_id,category_id,purpose',
                'paymentRequest.employee:id,first_name,last_name',
                'paymentRequest.category:id,name',
            ]),
            $dateFrom,
            $dateTo
        )
            ->latest('payment_date')
            ->get();

        return response()->json([
            'total_expenses' => $totalExpenses,
            'status_counts' => [
                'submitted' => $statusCounts->get(PaymentRequest::STATUS_SUBMITTED, 0),
                'finance_approved' => $statusCounts->get(PaymentRequest::STATUS_FINANCE_APPROVED, 0),
                'money_provided' => $statusCounts->get(PaymentRequest::STATUS_MONEY_PROVIDED, 0),
                'finance_rejected' => $statusCounts->get(PaymentRequest::STATUS_FINANCE_REJECTED, 0),
                'owner_rejected' => $statusCounts->get(PaymentRequest::STATUS_OWNER_REJECTED, 0),
                'payment_rejected' => $statusCounts->get(PaymentRequest::STATUS_PAYMENT_REJECTED, 0),
                'paid' => $statusCounts->get(PaymentRequest::STATUS_PAID, 0),
            ],
            'period' => $period,
            'summary' => $summary,
            'category_wise' => $categoryWise,
            'approved_transactions' => $approvedTransactions,
        ]);
    }

    private function applyDateRange(Builder $query, ?string $dateFrom, ?string $dateTo): Builder
    {
        if ($dateFrom) {
            $query->where('payment_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('payment_date', '<=', $dateTo);
        }

        return $query;
    }

    /**
     * A settled payment's requests can now span several categories (each
     * item picks its own), so a paid amount is split across categories by
     * each category's share of the item prices — a request with Food 60 +
     * Transport 40 that settled for 90 attributes 54 to Food and 36 to
     * Transport, rather than crediting the whole 90 to one category.
     * Requests without an itemized breakdown (legacy data) fall back to the
     * request's own single category.
     */
    private function buildCategoryWiseTotals(?string $dateFrom, ?string $dateTo)
    {
        $payments = $this->applyDateRange(
            Payment::with('paymentRequest:id,category_id,items'),
            $dateFrom,
            $dateTo
        )->get();

        $totalsByCategory = [];

        foreach ($payments as $payment) {
            $paymentRequest = $payment->paymentRequest;
            if (!$paymentRequest) {
                continue;
            }

            $items = collect($paymentRequest->items ?? []);
            $itemsSum = $items->sum('price');

            if ($items->isEmpty() || $itemsSum <= 0) {
                $categoryId = $paymentRequest->category_id;
                $totalsByCategory[$categoryId] = ($totalsByCategory[$categoryId] ?? 0) + (float) $payment->amount_paid;
                continue;
            }

            foreach ($items->groupBy('category_id') as $categoryId => $categoryItems) {
                $share = $categoryItems->sum('price') / $itemsSum;
                $totalsByCategory[$categoryId] = ($totalsByCategory[$categoryId] ?? 0) + ((float) $payment->amount_paid * $share);
            }
        }

        $categoryNames = ExpenseCategory::whereIn('id', array_keys($totalsByCategory))->pluck('name', 'id');

        return collect($totalsByCategory)
            ->map(fn ($total, $categoryId) => [
                'category' => $categoryNames->get($categoryId, 'Unknown'),
                'total' => round($total, 2),
            ])
            ->sortByDesc('total')
            ->values();
    }

    private function buildSummary(string $period, ?string $dateFrom, ?string $dateTo)
    {
        $query = Payment::query();

        switch ($period) {
            case 'daily':
                $defaultFrom = now()->subDays(29)->startOfDay();
                $format = '%Y-%m-%d';
                break;
            case 'yearly':
                $defaultFrom = now()->subYears(4)->startOfYear();
                $format = '%Y';
                break;
            case 'monthly':
            default:
                $defaultFrom = now()->subMonths(11)->startOfMonth();
                $format = '%Y-%m';
                break;
        }

        $query->where('payment_date', '>=', $dateFrom ?: $defaultFrom);

        if ($dateTo) {
            $query->where('payment_date', '<=', $dateTo);
        }

        return $query
            ->selectRaw("DATE_FORMAT(payment_date, '{$format}') as label, SUM(amount_paid) as total")
            ->groupBy('label')
            ->orderBy('label')
            ->get();
    }
}

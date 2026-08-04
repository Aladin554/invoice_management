<?php

namespace App\Http\Controllers;

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

        $categoryWise = $this->applyDateRange(
            Payment::query()
                ->join('payment_requests', 'payment_requests.id', '=', 'payments.payment_request_id')
                ->join('expense_categories', 'expense_categories.id', '=', 'payment_requests.category_id'),
            $dateFrom,
            $dateTo
        )
            ->selectRaw('expense_categories.name as category, SUM(payments.amount_paid) as total')
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')
            ->get();

        $recentTransactions = $this->applyDateRange(
            Payment::with([
                'paymentRequest:id,employee_id,category_id',
                'paymentRequest.employee:id,first_name,last_name',
                'paymentRequest.category:id,name',
            ]),
            $dateFrom,
            $dateTo
        )
            ->latest('payment_date')
            ->limit(10)
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
            'recent_transactions' => $recentTransactions,
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

<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AssistantSalesPersonController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ContractTemplateController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseReportController;
use App\Http\Controllers\ExpenseSettingsController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoicePublicController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentRequestController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SalesPersonController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WhatsAppSettingsController;
use App\Http\Middleware\CheckPanelAccess;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

Route::get('/invoices/public/{token}', [InvoicePublicController::class, 'show']);
Route::get('/invoices/public/{token}/contract-pdf', [InvoicePublicController::class, 'downloadContractPdf']);
Route::get('/invoices/public/{token}/no-refund-contract-pdf', [InvoicePublicController::class, 'downloadNoRefundContractPdf']);
Route::get('/invoices/public/{token}/approved-pdf', [InvoicePublicController::class, 'downloadApprovedPdf']);
Route::get('/invoices/public/{token}/receipt-pdf', [InvoicePublicController::class, 'downloadReceiptPdf']);
Route::post('/invoices/public/{token}/submit', [InvoicePublicController::class, 'submit']);
Route::post('/invoices/public/{token}/customer-profile', [InvoicePublicController::class, 'updateCustomerProfile']);
Route::post('/invoices/public/{token}/sign', [InvoicePublicController::class, 'sign']);

Route::middleware(['auth:sanctum', CheckPanelAccess::class, 'admin.ip'])->group(function () {
    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/me', [UserController::class, 'me']);
    Route::get('/profile', [UserController::class, 'showProfile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);

    Route::apiResource('users', UserController::class);
    Route::patch('/users/{id}/toggle-permission', [UserController::class, 'togglePermission']);

    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('sales-persons', SalesPersonController::class);
    Route::apiResource('assistant-sales-persons', AssistantSalesPersonController::class);
    Route::apiResource('services', ServiceController::class);
    Route::apiResource('branches', BranchController::class);
    Route::apiResource('contract-templates', ContractTemplateController::class);

    Route::get('/invoice-report', [InvoiceController::class, 'report']);
    Route::get('/invoices/approval-notifications', [InvoiceController::class, 'approvalNotifications']);
    Route::get('/invoices/form-options', [InvoiceController::class, 'formOptions']);
    Route::get('/invoices/{invoice}/no-refund-contract-pdf', [InvoiceController::class, 'downloadNoRefundContractPdf']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('/invoices/{invoice}/preview', [InvoiceController::class, 'preview']);
    Route::post('/invoices/{invoice}/approve-cash', [InvoiceController::class, 'approveCash']);
    Route::post('/invoices/{invoice}/approve', [InvoiceController::class, 'approve']);
    Route::post('/invoices/{invoice}/resend-approved-email', [InvoiceController::class, 'resendApprovedEmail']);
    Route::post('/invoices/{invoice}/admin-sign', [InvoiceController::class, 'adminSign']);
    Route::post('/invoices/{invoice}/assign-editor', [InvoiceController::class, 'assignEditor']);

    Route::get('/expense/categories', [ExpenseCategoryController::class, 'index']);
    Route::post('/expense/categories', [ExpenseCategoryController::class, 'store']);
    Route::put('/expense/categories/{id}', [ExpenseCategoryController::class, 'update']);
    Route::delete('/expense/categories/{id}', [ExpenseCategoryController::class, 'destroy']);

    Route::get('/expense/report', [ExpenseReportController::class, 'index']);
    Route::get('/expense/requests', [PaymentRequestController::class, 'index']);
    Route::post('/expense/requests', [PaymentRequestController::class, 'store']);
    Route::get('/expense/requests/{id}', [PaymentRequestController::class, 'show']);
    Route::post('/expense/requests/{id}/finance-review', [PaymentRequestController::class, 'financeReview']);
    Route::post('/expense/requests/{id}/owner-review', [PaymentRequestController::class, 'ownerReview']);
    Route::post('/expense/requests/{id}/settle', [PaymentRequestController::class, 'settle']);
    Route::post('/expense/requests/{id}/payment', [PaymentController::class, 'store']);

    Route::get('/settings/whatsapp', [WhatsAppSettingsController::class, 'show']);
    Route::put('/settings/whatsapp', [WhatsAppSettingsController::class, 'update']);
    Route::post('/settings/whatsapp/test', [WhatsAppSettingsController::class, 'test']);

    Route::get('/settings/expense', [ExpenseSettingsController::class, 'show']);
    Route::put('/settings/expense', [ExpenseSettingsController::class, 'update']);
});

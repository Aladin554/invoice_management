<?php

namespace App\Http\Controllers;

use App\Models\ExpenseSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExpenseSettingsController extends Controller
{
    private function isOwner(): bool
    {
        return (int) Auth::user()->role_id === 1;
    }

    public function show(): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can view expense settings'], 403);
        }

        $settings = ExpenseSetting::current();

        return response()->json([
            'owner_approval_required' => $settings->owner_approval_required,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can update expense settings'], 403);
        }

        $request->validate([
            'owner_approval_required' => 'required|boolean',
        ]);

        $settings = ExpenseSetting::current();
        $settings->owner_approval_required = $request->boolean('owner_approval_required');
        $settings->updated_by = Auth::id();
        $settings->save();

        return response()->json([
            'message' => 'Expense settings saved successfully',
            'owner_approval_required' => $settings->owner_approval_required,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Bank::orderBy('name')->pluck('name'));
    }

    /**
     * Called opportunistically whenever someone types a custom bank name via
     * "Other" on an invoice/due-payment form — not a management screen, so
     * any authenticated staff member can add one. Reuses an existing row
     * (the "name" column's collation already matches case-insensitively)
     * instead of erroring on a near-duplicate.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = trim($validated['name']);

        $bank = Bank::where('name', $name)->first() ?? Bank::create(['name' => $name]);

        return response()->json($bank, 201);
    }
}

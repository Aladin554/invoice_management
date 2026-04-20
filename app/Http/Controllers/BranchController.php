<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    private function isSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user && ((int) $user->role_id === 1 || $user->role?->name === 'superadmin');
    }

    public function index(): JsonResponse
    {
        $branches = Branch::orderBy('name')->get();

        return response()->json($branches);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized - superadmin only'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:branches,name',
            'full_address' => 'nullable|string|max:1000',
        ]);

        $branch = Branch::create($validated);

        return response()->json($branch, 201);
    }

    public function show(Branch $branch): JsonResponse
    {
        return response()->json($branch);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized - superadmin only'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:branches,name,' . $branch->id,
            'full_address' => 'nullable|string|max:1000',
        ]);

        $branch->update($validated);

        return response()->json($branch);
    }

    public function destroy(Branch $branch): JsonResponse
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized - superadmin only'], 403);
        }

        $branch->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}

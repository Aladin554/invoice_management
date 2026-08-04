<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExpenseCategoryController extends Controller
{
    private function isOwner(): bool
    {
        return (int) Auth::user()->role_id === 1;
    }

    public function index(): JsonResponse
    {
        $categories = ExpenseCategory::orderBy('name')->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can manage expense categories'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:expense_categories,name',
        ]);

        $category = ExpenseCategory::create([
            'name' => $request->name,
            'is_active' => true,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can manage expense categories'], 403);
        }

        $category = ExpenseCategory::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255|unique:expense_categories,name,' . $category->id,
            'is_active' => 'sometimes|boolean',
        ]);

        $category->fill($request->only(['name', 'is_active']));
        $category->save();

        return response()->json($category);
    }

    public function destroy(int $id): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can manage expense categories'], 403);
        }

        $category = ExpenseCategory::findOrFail($id);

        if ($category->paymentRequests()->exists()) {
            return response()->json(['message' => 'Cannot delete a category already used by requests. Deactivate it instead.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}

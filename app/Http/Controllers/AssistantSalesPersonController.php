<?php

namespace App\Http\Controllers;

use App\Models\AssistantSalesPerson;
use Illuminate\Http\Request;

class AssistantSalesPersonController extends Controller
{
    public function index()
    {
        return response()->json(AssistantSalesPerson::orderByDesc('id')->get(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:assistant_sales_people,email',
            'phone' => 'required|string|max:50',
        ]);

        $assistantSalesPerson = AssistantSalesPerson::create($validated);

        return response()->json($assistantSalesPerson, 201);
    }

    public function show($id)
    {
        $assistantSalesPerson = AssistantSalesPerson::find($id);
        if (!$assistantSalesPerson) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($assistantSalesPerson, 200);
    }

    public function update(Request $request, $id)
    {
        $assistantSalesPerson = AssistantSalesPerson::find($id);
        if (!$assistantSalesPerson) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:assistant_sales_people,email,' . $id,
            'phone' => 'required|string|max:50',
        ]);

        $assistantSalesPerson->update($validated);

        return response()->json($assistantSalesPerson, 200);
    }

    public function destroy($id)
    {
        $assistantSalesPerson = AssistantSalesPerson::find($id);
        if (!$assistantSalesPerson) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $assistantSalesPerson->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}

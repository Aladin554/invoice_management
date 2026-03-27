<?php

namespace App\Http\Controllers;

use App\Models\SalesPerson;
use Illuminate\Http\Request;

class SalesPersonController extends Controller
{
    public function index()
    {
        return response()->json(SalesPerson::orderByDesc('id')->get(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:sales_people,email',
            'phone' => 'required|string|max:50',
        ]);

        $salesPerson = SalesPerson::create($validated);

        return response()->json($salesPerson, 201);
    }

    public function show($id)
    {
        $salesPerson = SalesPerson::find($id);
        if (!$salesPerson) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($salesPerson, 200);
    }

    public function update(Request $request, $id)
    {
        $salesPerson = SalesPerson::find($id);
        if (!$salesPerson) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:sales_people,email,' . $id,
            'phone' => 'required|string|max:50',
        ]);

        $salesPerson->update($validated);

        return response()->json($salesPerson, 200);
    }

    public function destroy($id)
    {
        $salesPerson = SalesPerson::find($id);
        if (!$salesPerson) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $salesPerson->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}

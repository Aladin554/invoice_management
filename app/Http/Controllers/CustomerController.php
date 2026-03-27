<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithCustomerProfile;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use InteractsWithCustomerProfile;

    public function index()
    {
        return response()->json(Customer::orderByDesc('id')->get(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email',
            'phone' => 'required|string|max:50',
            ...$this->customerProfileRules(),
        ]);

        $customer = Customer::create(array_merge(
            $validated,
            $this->customerProfilePayload($validated)
        ));

        return response()->json($customer, 201);
    }

    public function show($id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($customer, 200);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email,' . $id,
            'phone' => 'required|string|max:50',
            ...$this->customerProfileRules(),
        ]);

        $customer->update(array_merge(
            $validated,
            $this->customerProfilePayload($validated)
        ));

        return response()->json($customer, 200);
    }

    public function destroy($id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $customer->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}

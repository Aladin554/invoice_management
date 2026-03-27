<?php

namespace App\Http\Controllers;

use App\Models\ContractTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ContractTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ContractTemplate::query()->with(['service', 'services']);

        if ($request->boolean('active')) {
            $query->where('is_active', true);
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'service_id' => 'nullable|exists:services,id',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
            'is_active' => 'nullable|boolean',
            'file' => 'nullable|file|mimes:pdf,doc,docx',
        ]);

        if ($request->hasFile('file')) {
            $validated['file_path'] = $request->file('file')->store('contract-templates', 'public');
        }

        $template = ContractTemplate::create($validated);
        $template->services()->sync($request->input('service_ids', []));

        return response()->json($template->load(['service', 'services']), 201);
    }

    public function show(ContractTemplate $contractTemplate): JsonResponse
    {
        return response()->json($contractTemplate->load(['service', 'services']));
    }

    public function update(Request $request, ContractTemplate $contractTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'service_id' => 'nullable|exists:services,id',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
            'is_active' => 'nullable|boolean',
            'file' => 'nullable|file|mimes:pdf,doc,docx',
        ]);

        if ($request->hasFile('file')) {
            if ($contractTemplate->file_path) {
                Storage::disk('public')->delete($contractTemplate->file_path);
            }
            $validated['file_path'] = $request->file('file')->store('contract-templates', 'public');
        }

        $contractTemplate->update($validated);
        $contractTemplate->services()->sync($request->input('service_ids', []));

        return response()->json($contractTemplate->load(['service', 'services']));
    }

    public function destroy(ContractTemplate $contractTemplate): JsonResponse
    {
        if ($contractTemplate->file_path) {
            Storage::disk('public')->delete($contractTemplate->file_path);
        }

        $contractTemplate->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}

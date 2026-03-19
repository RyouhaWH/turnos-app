<?php

namespace App\Http\Controllers;

use App\Models\WhatsAppRecipient;
use Illuminate\Http\Request;

class WhatsAppRecipientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $recipients = WhatsAppRecipient::orderBy('name')->get();
        return inertia('whatsapp-recipients/index', [
            'recipients' => $recipients
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
            'identifier_id' => 'required|string|max:255|unique:whats_app_recipients,identifier_id',
            'is_active' => 'boolean',
        ]);

        WhatsAppRecipient::create($validated);

        return back()->with('success', 'Destinatario creado exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $recipient = WhatsAppRecipient::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
            'identifier_id' => 'required|string|max:255|unique:whats_app_recipients,identifier_id,' . $recipient->id,
            'is_active' => 'boolean',
        ]);

        $recipient->update($validated);

        return back()->with('success', 'Destinatario actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $recipient = WhatsAppRecipient::findOrFail($id);
        $recipient->delete();

        return back()->with('success', 'Destinatario eliminado exitosamente.');
    }
}

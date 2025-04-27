'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // Changed icon

// Interfaces match API structure
interface Confirmation {
    id: string;
    name: string;
    guests: number;
    confirmedAt: string;
}
interface EventDetails {
    name: string;
    date: string;
}
interface EventListItem { // For the dropdown
    id: string;
    name: string;
    date: string;
}

export default function AdminAttendancePage() {
    // Event List & Selection State
    const [events, setEvents] = useState<EventListItem[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [selectedEventDetails, setSelectedEventDetails] = useState<EventDetails | null>(null);
    const [confirmations, setConfirmations] = useState<Confirmation[]>([]);

    // Loading & Error State
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingConfirmations, setLoadingConfirmations] = useState(false);
    const [error, setError] = useState<string | null>(null); // General/Confirmation error
    const [createEventError, setCreateEventError] = useState<string | null>(null); // Specific error for event creation

    // Confirmation List State
    const [totalGuests, setTotalGuests] = useState(0);

    // Inline Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedGuests, setEditedGuests] = useState(1);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    // New Event Form State
    const [newEventId, setNewEventId] = useState('');
    const [newEventName, setNewEventName] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false); // To toggle form visibility
    const [isDeletingEvent, setIsDeletingEvent] = useState(false); // State for event deletion

    // --- Data Fetching ---

    // Fetch the list of available events (now callable)
    const fetchEventList = useCallback(async (selectEventAfterFetch?: string) => {
        setLoadingEvents(true);
        setError(null);
        setCreateEventError(null); // Clear create error when refreshing list
        try {
            const response = await fetch('/api/confirm'); // GET without params fetches event list
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ao buscar lista de eventos: ${response.status}`);
            }
            const data: EventListItem[] = await response.json();
            setEvents(data);

            // Select an event: either the newly created one or the first one
            const eventToSelect = selectEventAfterFetch ?? (data.length > 0 ? data[0].id : '');
            if(eventToSelect && (!selectedEventId || selectEventAfterFetch)) {
                 setSelectedEventId(eventToSelect);
            } else if (!eventToSelect && selectedEventId) {
                 // If list becomes empty, deselect
                 setSelectedEventId('');
            }

        } catch (err: unknown) {
            console.error("Failed to fetch event list:", err);
            // Type check before accessing message
            const message = err instanceof Error ? err.message : "Falha ao carregar lista de eventos.";
            setError(message);
        } finally {
            setLoadingEvents(false);
        }
    }, [selectedEventId]); // Include selectedEventId to avoid re-selecting unnecessarily if it's already set

    // Initial fetch on mount
    useEffect(() => {
        fetchEventList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Fetch confirmations for the selected event
    const fetchConfirmationsForEvent = useCallback(async () => {
        if (!selectedEventId) {
            setConfirmations([]);
            setSelectedEventDetails(null);
            setTotalGuests(0);
            return;
        }
        setLoadingConfirmations(true);
        setError(null);
        setConfirmations([]);
        setSelectedEventDetails(null);
        setTotalGuests(0);

        try {
            const response = await fetch(`/api/confirm?eventId=${selectedEventId}`);
             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Erro ao buscar confirmações: ${response.status}`);
            }
            const data: { details: EventDetails, confirmations: Confirmation[] } = await response.json();
            setConfirmations(data.confirmations || []);
            setSelectedEventDetails(data.details || null);
        } catch (err: unknown) {
            console.error(`Failed to fetch confirmations for ${selectedEventId}:`, err);
            // Type check before accessing message
             const message = err instanceof Error ? err.message : `Falha ao carregar confirmações para o evento selecionado.`;
            setError(message);
        } finally {
            setLoadingConfirmations(false);
        }
    }, [selectedEventId]);

    // Trigger confirmation fetch when selectedEventId changes
    useEffect(() => {
        fetchConfirmationsForEvent();
    }, [fetchConfirmationsForEvent]);

    // Recalculate total guests whenever confirmations change
    useEffect(() => {
        const total = confirmations.reduce((sum, confirmation) => sum + confirmation.guests, 0);
        setTotalGuests(total);
    }, [confirmations]);

    // --- Event Creation Handler ---
     const handleCreateEventSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateEventError(null);
        setIsCreatingEvent(true);

        // Basic frontend validation
        if (!newEventId.trim() || !/^[a-z0-9-]+$/.test(newEventId.trim())) {
             setCreateEventError('ID do Evento inválido. Use apenas letras minúsculas, números e hífens.');
             setIsCreatingEvent(false);
             return;
        }
         if (!newEventName.trim() || !newEventDate.trim()) {
             setCreateEventError('Nome e Data do evento são obrigatórios.');
             setIsCreatingEvent(false);
             return;
         }

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: newEventId.trim(),
                    name: newEventName.trim(),
                    date: newEventDate.trim(),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Erro ${response.status} ao criar evento.`);
            }

            // Success! Clear form, hide it, refresh event list and select the new one
            console.log("Event created:", result);
            setNewEventId('');
            setNewEventName('');
            setNewEventDate('');
            setShowCreateForm(false); // Hide form on success
            await fetchEventList(result.eventId); // Refresh list and select the new event

        } catch (err: unknown) {
            console.error("Create event failed:", err);
             // Type check before accessing message
             const message = err instanceof Error ? err.message : "Ocorreu um erro ao criar o evento.";
            setCreateEventError(message);
        } finally {
            setIsCreatingEvent(false);
        }
    };

    // --- Event Deletion Handler ---
    const handleDeleteEvent = async () => {
        if (!selectedEventId || !selectedEventDetails) {
            setError("Nenhum evento selecionado para excluir.");
            return;
        }

        // Double confirmation
        if (!window.confirm(`ATENÇÃO! Tem certeza que deseja excluir o evento "${selectedEventDetails.name}" e TODAS as suas confirmações? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setError(null);
        setCreateEventError(null); // Clear other errors
        setIsDeletingEvent(true);

        try {
            const response = await fetch(`/api/events?eventId=${selectedEventId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `Erro ${response.status} ao excluir evento.`);
            }

            // Success! Refresh list, selection will be cleared automatically by fetchEventList
            console.log("Event deleted:", result.message);
            await fetchEventList(); // Refresh list

        } catch (err: unknown) {
            console.error("Delete event failed:", err);
            // Type check before accessing message
            const message = err instanceof Error ? err.message : "Ocorreu um erro ao excluir o evento.";
            setError(message); // Show error in main error area
        } finally {
            setIsDeletingEvent(false);
        }
    };

    // --- Delete Confirmation Handler ---
    const handleDelete = async (confirmationId: string) => {
         if (!selectedEventId || !confirmationId) return;
        if (!window.confirm(`Tem certeza que deseja excluir esta confirmação do evento ${selectedEventDetails?.name}?`)) {
            return;
        }
        setError(null);
        try {
            const response = await fetch(`/api/confirm?eventId=${selectedEventId}&id=${confirmationId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao excluir confirmação.');
            }
            setConfirmations(prev => prev.filter(c => c.id !== confirmationId));
        } catch (err: unknown) {
            console.error("Delete failed:", err);
            // Type check before accessing message
             const message = err instanceof Error ? err.message : "Ocorreu um erro ao excluir.";
            setError(message);
        }
    };

    // --- Edit Confirmation Handlers ---
    const handleStartEdit = (confirmation: Confirmation) => {
        setEditingId(confirmation.id);
        setEditedName(confirmation.name);
        setEditedGuests(confirmation.guests);
        setError(null);
    };
    const handleCancelEdit = () => { setEditingId(null); };
    const handleSaveEdit = async (confirmationId: string) => {
        if (!selectedEventId || !confirmationId) return;
        if (!editedName.trim() || editedGuests < 1) {
            setError("Nome não pode ser vazio e convidados deve ser pelo menos 1."); return;
        }
        setIsSubmittingEdit(true);
        setError(null);
        try {
            const response = await fetch(`/api/confirm?eventId=${selectedEventId}&id=${confirmationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editedName, guests: editedGuests }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao salvar alterações.');
            }
            const updatedConfirmationData = await response.json();
            setConfirmations(prev => prev.map(c => (c.id === confirmationId ? updatedConfirmationData.data : c)));
            setEditingId(null);
        } catch (err: unknown) {
            console.error("Save edit failed:", err);
            // Type check before accessing message
             const message = err instanceof Error ? err.message : "Ocorreu um erro ao salvar as alterações.";
            setError(message);
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    // --- Helper ---
    const formatDate = (dateString: string) => {
         try { return new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }); }
         catch /* Removed unused (e) */ { return 'Data Inválida'; }
    };

    // --- Render ---
    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-orange-50 font-sans">
            <div className="w-full max-w-5xl bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-semibold text-gray-800 mb-4 text-center">
                    Admin - Gerenciar Eventos e Presenças
                </h1>

                 {/* Section: Create New Event */}
                <div className="mb-8 border-b pb-6">
                     <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="mb-4 text-orange-700 hover:text-orange-900 font-medium"
                    >
                        {showCreateForm ? '[-] Ocultar Formulário de Novo Evento' : '[+] Criar Novo Evento'}
                    </button>

                     {showCreateForm && (
                        <form onSubmit={handleCreateEventSubmit} className="space-y-4 p-4 border rounded bg-gray-50">
                            <h3 className="text-lg font-medium text-gray-800">Criar Novo Evento</h3>
                             <div>
                                <label htmlFor="newEventId" className="block text-sm font-medium text-gray-700">ID do Evento (slug)</label>
                                <input
                                    type="text" id="newEventId" value={newEventId}
                                    onChange={(e) => setNewEventId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    required placeholder="ex: minha-festa-2025"
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900" // Added text color
                                />
                                 <p className="text-xs text-gray-500 mt-1">Use apenas letras minúsculas, números e hífens. Este será parte do link de confirmação.</p>
                            </div>
                             <div>
                                <label htmlFor="newEventName" className="block text-sm font-medium text-gray-700">Nome do Evento</label>
                                <input
                                    type="text" id="newEventName" value={newEventName}
                                    onChange={(e) => setNewEventName(e.target.value)}
                                    required placeholder="Nome Completo do Evento"
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900" // Added text color
                                />
                            </div>
                             <div>
                                <label htmlFor="newEventDate" className="block text-sm font-medium text-gray-700">Data do Evento</label>
                                <input
                                    type="text" id="newEventDate" value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    required placeholder="Ex: 25 de Dezembro de 2025"
                                     className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900" // Added text color
                                />
                             </div>

                            {createEventError && <p className="text-sm text-red-600">Erro: {createEventError}</p>}

                             <button
                                type="submit"
                                disabled={isCreatingEvent}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                             >
                                {isCreatingEvent ? 'Criando...' : 'Criar Evento'}
                             </button>
                        </form>
                    )}
                </div>


                 {/* Section: View Confirmations */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Visualizar Confirmações Para:
                        </label>
                        <select
                            id="event-select" value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            disabled={loadingEvents || events.length === 0}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900" // Added text color
                        >
                            {loadingEvents ? (<option>Carregando eventos...</option>)
                             : events.length === 0 ? (<option>Nenhum evento encontrado</option>)
                             : ( <>
                                    <option value="">-- Selecione um Evento --</option>
                                    {events.map(event => (<option key={event.id} value={event.id}>{event.name} ({event.date})</option>))}
                                </>
                             )
                            }
                        </select>
                     </div>
                     {/* Add Delete Event Button Here */}
                     {selectedEventId && selectedEventDetails && (
                         <button
                            onClick={handleDeleteEvent}
                            disabled={isDeletingEvent || loadingConfirmations}
                            className="ml-4 bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             {isDeletingEvent ? 'Excluindo Evento...' : 'Excluir Evento Selecionado'}
                         </button>
                     )}
                </div>

                {/* Loading/Error Display */}
                {loadingConfirmations && <p className="text-center text-gray-600">Carregando confirmações...</p>}
                {error && <p className="my-4 text-center text-red-600 bg-red-100 p-2 rounded border border-red-300">Erro: {error}</p>}

                {/* Confirmation Table Area */}
                {!loadingEvents && selectedEventId && selectedEventDetails && (
                    <>
                         <h2 className="text-2xl font-medium text-orange-800 mb-4 text-center">
                            {selectedEventDetails.name} - {selectedEventDetails.date}
                         </h2>
                         {/* Added Event ID and Confirmation Link */}
                         <div className="mb-4 text-center text-sm text-gray-500">
                            <p>ID do Evento: <code className="bg-gray-200 px-1 rounded">{selectedEventId}</code></p>
                            <p>
                                Link de Confirmação:
                                <a
                                    href={`/confirm/${selectedEventId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-600 hover:text-orange-800 hover:underline ml-1"
                                >
                                    {`/confirm/${selectedEventId}`}
                                </a>
                            </p>
                         </div>
                         {/* Adjusted layout for Totals and Refresh button */}
                         <div className="flex justify-between items-center mb-6 text-center">
                             <div> {/* Empty div to push total to center-ish if needed, or adjust flex properties */}
                             </div>
                            <div className="flex-grow">
                                <p className="text-lg text-gray-700">Total de Convidados Confirmados: <span className="font-bold text-orange-700">{totalGuests}</span></p>
                                <p className="text-sm text-gray-500">({confirmations.length} confirmações recebidas)</p>
                            </div>
                            <button
                                onClick={fetchConfirmationsForEvent} // Call the fetch function
                                disabled={loadingConfirmations} // Disable while loading
                                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Atualizar lista" // Updated title
                             >
                                <ArrowPathIcon className="h-5 w-5" aria-hidden="true" /> {/* Changed icon */}
                             </button>
                         </div>
                        <div className="overflow-x-auto">
                             <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100"><tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Convidados</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmado Em</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                     {loadingConfirmations ? (
                                        <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Carregando...</td></tr>
                                     ) : confirmations.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Nenhuma confirmação para este evento.</td></tr>
                                    ) : (
                                         confirmations.map((confirmation) => (
                                             <tr key={confirmation.id} className={`hover:bg-orange-50 transition-colors duration-150 ${editingId === confirmation.id ? 'bg-orange-100' : ''}`}>
                                                 {/* Name */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                     {editingId === confirmation.id
                                                      ? <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full px-2 py-1 border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900" disabled={isSubmittingEdit} /> // Text color fix
                                                      : confirmation.name }
                                                 </td>
                                                {/* Guests */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                     {editingId === confirmation.id
                                                      ? <input type="number" value={editedGuests} onChange={(e) => setEditedGuests(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="w-20 px-2 py-1 border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-center text-gray-900" disabled={isSubmittingEdit} /> // Text color fix
                                                      : confirmation.guests }
                                                </td>
                                                {/* Confirmed At */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(confirmation.confirmedAt)}</td>
                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                     {editingId === confirmation.id ? ( <>
                                                             <button onClick={() => handleSaveEdit(confirmation.id)} disabled={isSubmittingEdit} className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmittingEdit ? 'Salvando...' : 'Salvar'}</button>
                                                             <button onClick={handleCancelEdit} disabled={isSubmittingEdit} className="text-gray-600 hover:text-gray-900 disabled:opacity-50">Cancelar</button>
                                                         </> ) : ( <>
                                                             <button onClick={() => handleStartEdit(confirmation)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                                             <button onClick={() => handleDelete(confirmation.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                                         </> )}
                                                 </td>
                                             </tr>
                                         ))
                                     )}
                                 </tbody>
                             </table>
                        </div>
                    </>
                )}
                {/* Show message if no event is selected or no events exist */}
                 {!loadingEvents && events.length > 0 && !selectedEventId && !loadingConfirmations && (
                    <p className="text-center text-gray-500 mt-6">Por favor, selecione um evento acima para ver as confirmações.</p>
                 )}
                  {!loadingEvents && events.length === 0 && !error && (
                    <p className="text-center text-gray-500 mt-6">Nenhum evento encontrado. Crie um novo evento usando o formulário acima.</p>
                 )}
            </div>
            <footer className="mt-8 text-center text-gray-500 text-sm">
                Visualização de admin.
            </footer>
        </main>
    );
} 
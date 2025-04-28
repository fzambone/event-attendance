'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Same interface as in API
/* Removed unused Confirmation import
interface Confirmation {
    id: string;
    name: string;
    guests: number;
    confirmedAt: string;
}
*/

// Interface for event details fetched from API
interface EventDetails {
    name: string;
    date: string;
}

export default function ConfirmPage() {
    const params = useParams<{ key: string }>();
    const eventId = params.key; // 'key' from the route is our eventId

    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
    const [isLoadingEvent, setIsLoadingEvent] = useState(true);
    const [eventError, setEventError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [guests, setGuests] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState(''); // Renamed from 'error'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch event details when component mounts or eventId changes
    useEffect(() => {
        const fetchEventDetails = async () => {
            if (!eventId) return; // Don't fetch if eventId isn't available yet

            setIsLoadingEvent(true);
            setEventError(null);
            setEventDetails(null); // Clear previous details

            try {
                // Use the GET endpoint with eventId query param
                const response = await fetch(`/api/confirm?eventId=${eventId}`);
                if (!response.ok) {
                     if (response.status === 400) {
                        throw new Error("Link de evento inválido."); // Specific message for bad event ID
                     }
                     const errorData = await response.json();
                     throw new Error(errorData.message || `Erro ${response.status} ao buscar detalhes do evento.`);
                }
                const data = await response.json(); // API returns { details: {...}, confirmations: [...] }
                if (data && data.details) {
                    setEventDetails(data.details);
                } else {
                     throw new Error("Detalhes do evento não encontrados na resposta da API.");
                }
            } catch (err: unknown) {
                console.error("Failed to fetch event details:", err);
                 // Type check before accessing message
                const message = err instanceof Error ? err.message : "Falha ao carregar informações do evento.";
                setEventError(message);
            } finally {
                setIsLoadingEvent(false);
            }
        };

        fetchEventDetails();
    }, [eventId]); // Re-run if eventId changes

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitError('');
        setIsSubmitting(true);

        if (!name.trim()) {
            setSubmitError('Por favor, informe seu nome.');
            setIsSubmitting(false);
            return;
        }
        if (guests < 1) {
            setSubmitError('O número de convidados deve ser pelo menos 1.');
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSend = { name, guests, eventId }; // Include eventId
            console.log('Data being sent to API:', dataToSend);

            const response = await fetch('/api/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Falha ao enviar confirmação');
            }

            console.log('API Response:', result);
            setSubmitted(true);

        } catch (err: unknown) {
            console.error('Submission error:', err);
            // Type check before accessing message
            const message = err instanceof Error ? err.message : 'Ocorreu um erro. Por favor, tente novamente.';
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---

    // Loading state for event details
     if (isLoadingEvent) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-orange-50 font-sans">
                 <p className="text-gray-600">Carregando detalhes do evento...</p>
            </main>
        );
    }

    // Error state for event details (invalid link / fetch error)
     if (eventError || !eventDetails) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-orange-50 font-sans">
                 <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h1 className="text-2xl font-semibold text-red-700 mb-4">Erro</h1>
                    <p className="text-gray-600">{eventError || "Não foi possível carregar os detalhes do evento."}</p>
                    <p className="text-gray-500 text-sm mt-2">Verifique o link ou contate o organizador.</p>
                 </div>
            </main>
        );
    }

    // Success state after submission
    if (submitted) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-orange-50 font-sans">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h1 className="text-2xl font-semibold text-green-700 mb-4">Obrigado!</h1>
                     <p className="text-gray-600">Sua confirmação para <span className="font-semibold">{eventDetails.name}</span> ({guests} {guests === 1 ? 'pessoa' : 'pessoas'}) foi recebida.</p>
                    <p className="text-gray-600 mt-2">Esperamos você em {eventDetails.date}!</p>
                </div>
            </main>
        );
    }

    // Default state: show the form for the specific event
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-orange-50 font-sans">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                 {/* Display Event Details */}
                <h1 className="text-3xl font-semibold text-gray-800 mb-2 text-center">Confirme sua Presença</h1>
                <p className="text-xl text-orange-700 mb-1 text-center">{eventDetails.name}</p>
                 <p className="text-md text-gray-500 mb-6 text-center">{eventDetails.date}</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Seu Nome
                        </label>
                        <input
                            type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                            placeholder="Informe seu nome completo"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Pessoas (incluindo você)
                        </label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            id="guests"
                            value={guests}
                            onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 1))}
                            min="1"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                        />
                    </div>

                    {submitError && <p className="mb-4 text-sm text-red-600">Erro: {submitError}</p>}

                    <button
                        type="submit" disabled={isSubmitting}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Confirmando...' : 'Confirmar Presença'}
                    </button>
                </form>
            </div>
            <footer className="mt-8 text-center text-gray-500 text-sm">
                Uma ferramenta simples de confirmação.
                <br/>Criada por: Fernando R. Zambone
            </footer>
        </main>
    );
} 
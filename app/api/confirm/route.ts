import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// --- Interfaces (Keep for structure, matches DB columns now) ---
interface EventDetails {
    name: string;
    date: string;
}
interface Confirmation {
    id: string; // UUID from DB
    name: string;
    guests: number;
    confirmed_at: string; // Timestamptz from DB
}
interface EventListItem {
    id: string;
    name: string;
    date: string;
}
// --- End Interfaces ---

// --- API Handlers ---

// --- POST Handler for Confirming Attendance ---
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, guests, eventId } = body;

        // --- Input Validation ---
        if (!eventId || typeof eventId !== 'string') {
            return NextResponse.json({ message: 'ID de evento inválido ou ausente.' }, { status: 400 });
        }
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ message: 'Nome é obrigatório.' }, { status: 400 });
        }
        const numGuests = parseInt(guests, 10);
        if (isNaN(numGuests) || numGuests < 1) {
            return NextResponse.json({ message: 'O número de convidados deve ser pelo menos 1.' }, { status: 400 });
        }
        // --- End Validation ---

        // Check if event exists before attempting to add confirmation
        const eventCheck = await sql`SELECT 1 FROM events WHERE id = ${eventId.trim()}`;
        if (eventCheck.rowCount === 0) {
            return NextResponse.json({ message: 'ID de evento inválido ou não encontrado.' }, { status: 404 });
        }

        // Add the new confirmation to the database
        const result = await sql`
            INSERT INTO confirmations (event_id, name, guests)
            VALUES (${eventId.trim()}, ${name.trim()}, ${numGuests})
            RETURNING id, name, guests, confirmed_at
        `;

        const newConfirmation = result.rows[0] as Confirmation;

        return NextResponse.json({ message: 'Confirmação bem-sucedida!', data: newConfirmation }, { status: 201 });

    } catch (error: any) {
        console.error('API POST Error:', error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ message: 'Formato JSON inválido no corpo da requisição.' }, { status: 400 });
        }
        return NextResponse.json({ message: error.message || 'Erro Interno do Servidor' }, { status: 500 });
    }
}

// --- GET Handler for Fetching Data ---
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (eventId) {
            // Request is for a specific event's details and confirmations
            // 1. Fetch event details
            const eventResult = await sql`SELECT name, date FROM events WHERE id = ${eventId}`;
            if (eventResult.rowCount === 0) {
                return NextResponse.json({ message: 'ID de evento inválido ou não encontrado.' }, { status: 404 });
            }
            const eventDetails = eventResult.rows[0] as EventDetails;

            // 2. Fetch confirmations for this event
            const confirmationsResult = await sql`
                SELECT id, name, guests, confirmed_at
                FROM confirmations
                WHERE event_id = ${eventId}
                ORDER BY confirmed_at DESC
            `;
            const confirmations = confirmationsResult.rows as Confirmation[];

            // 3. Combine and return
            return NextResponse.json({ details: eventDetails, confirmations: confirmations }, { status: 200 });

        } else {
            // Request is for the list of all events
            const eventsResult = await sql`
                SELECT id, name, date
                FROM events
                ORDER BY created_at DESC
            `; // Assuming created_at column exists from schema
            const eventList = eventsResult.rows as EventListItem[];
            return NextResponse.json(eventList, { status: 200 });
        }

    } catch (error: any) {
        console.error('API GET Error:', error);
        return NextResponse.json({ message: error.message || 'Erro Interno do Servidor ao buscar dados.' }, { status: 500 });
    }
}

// --- DELETE Handler for Removing a Confirmation ---
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const confirmationId = searchParams.get('id'); // This is the UUID of the confirmation

        if (!eventId) {
            return NextResponse.json({ message: 'ID do Evento é obrigatório.' }, { status: 400 });
        }
        if (!confirmationId) {
            return NextResponse.json({ message: 'ID da confirmação é obrigatório para exclusão.' }, { status: 400 });
        }

        // Check if confirmationId is a valid UUID format (basic check)
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(confirmationId)) {
            return NextResponse.json({ message: 'ID da confirmação inválido.' }, { status: 400 });
        }

        const result = await sql`
            DELETE FROM confirmations
            WHERE id = ${confirmationId} AND event_id = ${eventId}
        `;

        if (result.rowCount === 0) {
            // Could be wrong confirmation ID or wrong event ID for that confirmation
            return NextResponse.json({ message: 'Confirmação não encontrada neste evento ou ID inválido.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Confirmação excluída com sucesso.' }, { status: 200 });

    } catch (error: any) {
        console.error('API DELETE Error:', error);
        return NextResponse.json({ message: error.message || 'Erro Interno do Servidor ao excluir.' }, { status: 500 });
    }
}

// --- PUT Handler for Updating a Confirmation ---
export async function PUT(request: NextRequest) {
     try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const confirmationId = searchParams.get('id'); // Confirmation UUID

         if (!eventId) {
            return NextResponse.json({ message: 'ID do Evento é obrigatório.' }, { status: 400 });
        }
         if (!confirmationId) {
            return NextResponse.json({ message: 'ID da confirmação é obrigatório para atualização.' }, { status: 400 });
        }
        // UUID Check
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(confirmationId)) {
            return NextResponse.json({ message: 'ID da confirmação inválido.' }, { status: 400 });
        }

        const body = await request.json();
        const { name, guests } = body;
        const numGuests = parseInt(guests, 10);

        if (!name || typeof name !== 'string' || name.trim().length === 0 || isNaN(numGuests) || numGuests < 1) {
             return NextResponse.json({ message: 'Dados inválidos para atualização (Nome e Convidados >= 1 são obrigatórios).' }, { status: 400 });
        }

        const result = await sql`
            UPDATE confirmations
            SET name = ${name.trim()}, guests = ${numGuests}
            WHERE id = ${confirmationId} AND event_id = ${eventId}
            RETURNING id, name, guests, confirmed_at
        `;

        if (result.rowCount === 0) {
            return NextResponse.json({ message: 'Confirmação não encontrada neste evento ou ID inválido para atualização.' }, { status: 404 });
        }

        const updatedConfirmation = result.rows[0] as Confirmation;
        return NextResponse.json({ message: 'Confirmação atualizada com sucesso.', data: updatedConfirmation }, { status: 200 });

    } catch (error: any) {
        console.error('API PUT Error:', error);
         if (error instanceof SyntaxError) {
             return NextResponse.json({ message: 'Formato JSON inválido no corpo da requisição.' }, { status: 400 });
        }
        return NextResponse.json({ message: error.message || 'Erro Interno do Servidor ao atualizar.' }, { status: 500 });
    }
} 
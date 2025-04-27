import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres'; // Import Vercel Postgres SDK

// --- POST Handler for Creating Events ---
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, name, date } = body;

        // --- Validation ---
        if (!eventId || !/^[a-z0-9-]+$/.test(eventId)) {
            return NextResponse.json({ message: 'ID do Evento inválido. Use apenas letras minúsculas, números e hífens.' }, { status: 400 });
        }
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ message: 'Nome do evento é obrigatório.' }, { status: 400 });
        }
        if (!date || typeof date !== 'string' || date.trim().length === 0) {
            return NextResponse.json({ message: 'Data do evento é obrigatória.' }, { status: 400 });
        }
        // --- End Validation ---

        try {
             await sql`
                INSERT INTO events (id, name, date)
                VALUES (${eventId.trim()}, ${name.trim()}, ${date.trim()})
            `;
        } catch (error: unknown) {
            // Check for unique constraint violation (duplicate eventId)
            if (error instanceof Error && error.message.includes('23505')) { // PostgreSQL unique violation error code
                 return NextResponse.json({ message: `O ID de evento "${eventId}" já existe.` }, { status: 409 }); // 409 Conflict
            }
             // Re-throw other database errors or handle them
            throw error;
        }

        // Return the newly created event info
        return NextResponse.json({ message: 'Evento criado com sucesso!', eventId: eventId, event: { name, date } }, { status: 201 });

    } catch (error: unknown) {
        console.error('API Create Event Error:', error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ message: 'Formato JSON inválido no corpo da requisição.' }, { status: 400 });
        }
        // Handle potential database errors passed up or thrown
        const message = error instanceof Error ? error.message : 'Erro Interno do Servidor ao criar evento.';
        return NextResponse.json({ message }, { status: 500 });
    }
}

// --- DELETE Handler for Deleting Events ---
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventIdToDelete = searchParams.get('eventId');

        if (!eventIdToDelete) {
            return NextResponse.json({ message: 'ID do Evento é obrigatório para exclusão.' }, { status: 400 });
        }

        const result = await sql`
            DELETE FROM events
            WHERE id = ${eventIdToDelete}
        `;

        // Check if any row was actually deleted
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Evento com ID "${eventIdToDelete}" não encontrado.` }, { status: 404 }); // 404 Not Found
        }

        // Success (ON DELETE CASCADE handles confirmations automatically)
        return NextResponse.json({ message: 'Evento e suas confirmações foram excluídos com sucesso!' }, { status: 200 });

    } catch (error: unknown) {
        console.error('API Delete Event Error:', error);
        // Handle potential database errors
        const message = error instanceof Error ? error.message : 'Erro Interno do Servidor ao excluir evento.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
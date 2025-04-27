import { NextRequest, NextResponse } from 'next/server';

const adminPassword = process.env.ADMIN_PASSWORD;
const authCookieName = 'admin-auth'; // Same name as in middleware

export async function POST(request: NextRequest) {
    if (!adminPassword) {
        console.error('ADMIN_PASSWORD environment variable is not set.');
        return NextResponse.json({ message: 'Configuração de servidor incompleta.' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
             return NextResponse.json({ message: 'Senha é obrigatória.' }, { status: 400 });
        }

        if (password === adminPassword) {
            // Password is correct, set the cookie and redirect
            // Use NextResponse to set cookies in Route Handlers/Middleware
            const redirectUrl = new URL('/admin/attendance', request.nextUrl.origin);
            const response = NextResponse.redirect(redirectUrl.toString(), { status: 302 });

            // Set the cookie on the response
            response.cookies.set(authCookieName, 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                sameSite: 'lax',
            });

            return response;

        } else {
            // Password incorrect
            const loginUrl = new URL('/admin/login?error=invalid', request.nextUrl.origin);
            return NextResponse.redirect(loginUrl.toString(), { status: 302 });
        }

    } catch (error) {
        console.error('API Admin Login Error:', error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ message: 'Formato JSON inválido.' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Erro Interno do Servidor' }, { status: 500 });
    }
} 
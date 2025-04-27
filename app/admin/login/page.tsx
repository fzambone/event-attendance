'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Inner component that uses useSearchParams
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const initialError = searchParams.get('error'); // Check for error from API redirect

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            // The API route will handle redirection on success.
            // If the response comes back here, it means login failed.
            if (!response.ok) {
                const result = await response.json();
                 setError(result.message || 'Falha no login.');
            } else {
                 // Fetch might resolve even on redirect status codes,
                 // check status explicitly or rely on API redirect.
                 // If API redirects successfully, this part might not even run.
                 // For safety, try router push, though middleware should handle it.
                 router.push('/admin/attendance');
            }

        } catch (err) {
            console.error('Login error:', err);
            setError('Ocorreu um erro ao tentar fazer login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Admin Login
            </h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Digite a senha de admin"
                    />
                </div>

                {(error || initialError) && (
                    <p className="mb-4 text-sm text-red-600 text-center">
                       {error || (initialError === 'invalid' ? 'Senha incorreta.' : 'Erro no login.')}
                    </p>
                )}


                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}

// Main page component wraps the LoginForm in Suspense
export default function AdminLoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100 font-sans">
            <Suspense fallback={<div>Carregando...</div>}> {/* Suspense wrapper */}
                <LoginForm />
            </Suspense>
        </main>
    );
} 
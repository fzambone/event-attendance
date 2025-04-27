import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-orange-50 font-sans">
      <main className="text-center bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">
          Confirmação de Presença em Eventos
        </h1>
        <p className="text-gray-600 mb-6">
          Esta aplicação gerencia confirmações de presença para diversos eventos.
          Cada evento possui um link de confirmação único (ex: `/confirm/nome-do-evento`).
        </p>
        <Link
          href="/admin/login"
          className="inline-block bg-orange-600 text-white py-2 px-6 rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Login do Admin
        </Link>
      </main>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        Uma ferramenta simples para gerenciar presenças em eventos.
      </footer>
    </div>
  );
}

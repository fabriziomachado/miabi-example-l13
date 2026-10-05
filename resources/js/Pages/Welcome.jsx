export default function Welcome({ app }) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
            <div className="max-w-lg text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Miabi example</p>
                <h1 className="mt-3 text-4xl font-semibold">{app}</h1>
                <p className="mt-4 text-zinc-300">
                    Laravel 13 + React (Inertia) running on Miabi.
                </p>
            </div>
        </main>
    );
}

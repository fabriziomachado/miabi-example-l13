export default function Welcome({ app, runtime }) {
    const container = runtime?.container ?? '—';
    const node = runtime?.node ?? '—';

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
            <div className="max-w-lg text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Miabi example</p>
                <h1 className="mt-3 text-4xl font-semibold">{app}</h1>
                <p className="mt-4 text-zinc-300">
                    Laravel 13 + React (Inertia) running on Miabi.
                </p>

                <div
                    className="mt-10 inline-flex flex-col items-start gap-1.5 rounded-md border border-zinc-700/70 bg-zinc-900/70 px-4 py-3 text-left font-mono text-sm leading-relaxed text-zinc-300"
                    title="Identidade da tarefa Swarm (container / node)"
                    aria-label={`Container ${container}, node ${node}`}
                >
                    <div className="max-w-full break-all">
                        <span className="mr-2 text-zinc-500">ctr</span>
                        {container}
                    </div>
                    <div className="max-w-full break-all">
                        <span className="mr-2 text-zinc-500">node</span>
                        {node}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function Welcome({ app, runtime }) {
    const container = runtime?.container ?? '—';
    const node = runtime?.node ?? '—';

    return (
        <main className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
            <div className="max-w-lg text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Miabi example</p>
                <h1 className="mt-3 text-4xl font-semibold">{app}</h1>
                <p className="mt-4 text-zinc-300">
                    Laravel 13 + React (Inertia) running on Miabi.
                </p>
            </div>

            <div
                className="pointer-events-none fixed bottom-3 right-3 z-10 max-w-[min(100vw-1.5rem,20rem)] rounded border border-zinc-800/80 bg-zinc-950/70 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-zinc-500 backdrop-blur-sm"
                title="Identidade da tarefa Swarm (container / node)"
                aria-label={`Container ${container}, node ${node}`}
            >
                <div className="truncate">
                    <span className="text-zinc-600">ctr</span> {container}
                </div>
                <div className="truncate">
                    <span className="text-zinc-600">node</span> {node}
                </div>
            </div>
        </main>
    );
}

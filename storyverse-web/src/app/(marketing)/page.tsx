import Link from "next/link";
import { ArrowRight, Orbit, Sparkles } from "lucide-react";

export default function MarketingPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-space-grid bg-[size:42px_42px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.22),transparent_44%)]" />

      <section className="relative z-10 w-full max-w-4xl rounded-3xl border border-cosmos-200/20 bg-panel/70 p-10 shadow-nebula backdrop-blur-xl">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-cosmos-900/70 px-3 py-1 text-xs tracking-[0.2em] text-cosmos-200 uppercase">
          <Orbit className="h-3.5 w-3.5 text-neon-cyan" />
          StoryVerse
        </div>

        <h1 className="font-display text-4xl leading-tight text-cosmos-100 md:text-6xl">
          Navigate an Infinite Story Universe
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted md:text-lg">
          Explore Movies, History, and Novels as one living 3D graph. Ask AI to
          connect impossible worlds and reveal hidden narrative pathways.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/universe"
            className="inline-flex items-center gap-2 rounded-full bg-neon-cyan px-5 py-2.5 font-medium text-cosmos-950 transition hover:bg-cyan-300"
          >
            Enter Universe
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="inline-flex items-center gap-2 text-sm text-cosmos-200/80">
            <Sparkles className="h-4 w-4 text-neon-rose" />
            Agentic GraphRAG storytelling engine
          </p>
        </div>
      </section>
    </main>
  );
}

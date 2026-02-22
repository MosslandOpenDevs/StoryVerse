import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-cosmos-200/10 bg-gradient-to-br from-cosmos-900/80 via-cosmos-800/60 to-cosmos-900/80 p-10 text-center backdrop-blur-xl sm:p-14">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.08),transparent_60%)]" />

        <div className="relative">
          <h2 className="font-display text-2xl tracking-wide text-cosmos-100 sm:text-3xl">
            Ready to Bridge Worlds?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted sm:text-base">
            Step into the StoryVerse and discover how every narrative is
            connected. No limits, no boundaries — just stories.
          </p>
          <div className="mt-8">
            <Link
              href="/universe"
              className="group inline-flex items-center gap-2 rounded-full bg-neon-cyan px-7 py-3 font-medium text-cosmos-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            >
              Enter the Universe
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

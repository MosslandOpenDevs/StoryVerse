import Link from "next/link";
import { ArrowRight, ChevronDown, Film, BookOpen, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function ConstellationSvg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full animate-float opacity-20"
      viewBox="0 0 800 600"
      fill="none"
      aria-hidden
    >
      {/* Constellation nodes */}
      <circle cx="120" cy="100" r="3" fill="#22d3ee" />
      <circle cx="250" cy="80" r="2" fill="#a855f7" />
      <circle cx="380" cy="150" r="3" fill="#f472b6" />
      <circle cx="500" cy="60" r="2" fill="#22d3ee" />
      <circle cx="650" cy="130" r="3" fill="#a855f7" />
      <circle cx="180" cy="300" r="2" fill="#f472b6" />
      <circle cx="350" cy="350" r="3" fill="#22d3ee" />
      <circle cx="550" cy="280" r="2" fill="#a855f7" />
      <circle cx="700" cy="350" r="3" fill="#f472b6" />
      <circle cx="100" cy="480" r="2" fill="#22d3ee" />
      <circle cx="300" cy="500" r="3" fill="#a855f7" />
      <circle cx="480" cy="450" r="2" fill="#f472b6" />
      <circle cx="620" cy="520" r="3" fill="#22d3ee" />
      {/* Constellation lines */}
      <line x1="120" y1="100" x2="250" y2="80" stroke="#22d3ee" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="250" y1="80" x2="380" y2="150" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="380" y1="150" x2="500" y2="60" stroke="#f472b6" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="500" y1="60" x2="650" y2="130" stroke="#22d3ee" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="180" y1="300" x2="350" y2="350" stroke="#a855f7" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="350" y1="350" x2="550" y2="280" stroke="#f472b6" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="550" y1="280" x2="700" y2="350" stroke="#22d3ee" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="120" y1="100" x2="180" y2="300" stroke="#a855f7" strokeOpacity="0.1" strokeWidth="1" />
      <line x1="380" y1="150" x2="350" y2="350" stroke="#22d3ee" strokeOpacity="0.1" strokeWidth="1" />
      <line x1="650" y1="130" x2="700" y2="350" stroke="#f472b6" strokeOpacity="0.1" strokeWidth="1" />
      <line x1="100" y1="480" x2="300" y2="500" stroke="#a855f7" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="300" y1="500" x2="480" y2="450" stroke="#22d3ee" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="480" y1="450" x2="620" y2="520" stroke="#f472b6" strokeOpacity="0.15" strokeWidth="1" />
    </svg>
  );
}

const DOMAIN_ICONS = [
  { icon: Film, label: "Movies", color: "text-domain-movie", glow: "shadow-movie" },
  { icon: Landmark, label: "History", color: "text-domain-history", glow: "shadow-history" },
  { icon: BookOpen, label: "Novels", color: "text-domain-novel", glow: "shadow-novel" },
] as const;

export function HeroSection() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-24">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-space-grid bg-[size:42px_42px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.18),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.12),transparent_40%)]" />
      <ConstellationSvg />

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl md:text-7xl">
          <span className="gradient-text-hero">Explore Stories</span>
          <br />
          <span className="text-cosmos-100">Across Worlds</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
          Connect Movies, History, and Novels through AI-powered narrative
          bridges. Discover the hidden links between every story ever told.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Badge domain="Movie">Movie</Badge>
          <Badge domain="History">History</Badge>
          <Badge domain="Novel">Novel</Badge>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/universe"
            className="group inline-flex items-center gap-2 rounded-full bg-neon-cyan px-6 py-3 font-medium text-cosmos-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
          >
            Start Exploring
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/20 px-5 py-3 text-sm text-cosmos-200 transition-colors hover:border-neon-cyan/40 hover:text-cosmos-100"
          >
            See How It Works
            <ChevronDown className="h-4 w-4" />
          </a>
        </div>

        {/* Domain icons */}
        <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12">
          {DOMAIN_ICONS.map(({ icon: Icon, label, color, glow }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className={`rounded-xl border border-cosmos-200/10 bg-cosmos-900/60 p-3 ${glow} transition-shadow hover:shadow-lg`}
              >
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <span className="text-xs text-cosmos-200/60">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Orbit, Home } from "lucide-react";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cosmos-200/10 bg-cosmos-950/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-sm tracking-[0.2em] text-cosmos-100 uppercase transition-colors hover:text-neon-cyan"
        >
          <Orbit className="h-5 w-5 text-neon-cyan" />
          StoryVerse
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-cosmos-200/80 transition-colors hover:text-cosmos-100"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </nav>
    </header>
  );
}

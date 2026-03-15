"use client";

import Link from "next/link";
import { Orbit, Home, Globe } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cosmos-200/10 bg-cosmos-950/80 backdrop-blur-lg">
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-50 rounded border border-cosmos-300/60 bg-cosmos-900/90 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-cosmos-100 transition-all focus-visible:not-sr-only focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmos-200/90"
      >
        Skip to main content
      </a>
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6" aria-label="Primary">        <Link
          href="/"
          aria-label="Visit StoryVerse home"
          className="inline-flex items-center gap-2 font-display text-sm tracking-[0.2em] text-cosmos-100 uppercase transition-colors hover:text-neon-cyan"
        >
          <Orbit className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
          StoryVerse
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label={isActive("/") ? "Current page: Home" : "Go to home"}
            aria-current={isActive("/") ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors hover:text-cosmos-100 ${
              isActive("/") ? "text-neon-cyan" : "text-cosmos-200/80"
            }`}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/universe"
            aria-label={isActive("/universe") ? "Current page: Universe" : "Go to story universe"}
            aria-current={isActive("/universe") ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors hover:text-cosmos-100 ${
              isActive("/universe") ? "text-neon-cyan" : "text-cosmos-200/80"
            }`}
          >
            <Globe className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Universe</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

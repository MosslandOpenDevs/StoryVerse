import { Orbit } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-cosmos-200/10 bg-cosmos-950/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="inline-flex items-center gap-2 text-xs text-cosmos-200/60">
          <Orbit className="h-3.5 w-3.5 text-neon-cyan/60" />
          <span className="font-display tracking-wider uppercase">
            StoryVerse
          </span>
        </div>
        <p className="text-xs text-cosmos-200/40">
          Agentic GraphRAG storytelling engine
        </p>
      </div>
    </footer>
  );
}

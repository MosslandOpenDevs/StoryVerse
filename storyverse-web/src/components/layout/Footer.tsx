import { Orbit } from "lucide-react";

export function Footer() {
  const now = new Date();

  return (
    <footer className="border-t border-cosmos-200/10 bg-cosmos-950/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="inline-flex items-center gap-2 text-xs text-cosmos-200/60">
          <Orbit className="h-3.5 w-3.5 text-neon-cyan/60" />
          <span className="font-display tracking-wider uppercase">
            StoryVerse
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-cosmos-200/40">
            Agentic GraphRAG storytelling engine
          </p>
          <p className="text-[10px] uppercase tracking-wider text-cosmos-200/50">
            © {now.getFullYear()} · UI status: production-ready
          </p>
        </div>
      </div>
    </footer>
  );
}

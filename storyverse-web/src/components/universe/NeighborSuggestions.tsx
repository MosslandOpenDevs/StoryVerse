"use client";

import type { StorySuggestion } from "@/lib/agents/navigatorAgent";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";
import { cn } from "@/lib/utils";

const DOMAIN_BORDER_COLORS: Record<StoryMedium, string> = {
  Movie: "border-domain-movie/30 hover:border-domain-movie/60",
  History: "border-domain-history/30 hover:border-domain-history/60",
  Novel: "border-domain-novel/30 hover:border-domain-novel/60",
};

const DOMAIN_GLOW: Record<StoryMedium, string> = {
  Movie: "hover:shadow-[0_0_12px_rgba(96,165,250,0.2)]",
  History: "hover:shadow-[0_0_12px_rgba(52,211,153,0.2)]",
  Novel: "hover:shadow-[0_0_12px_rgba(244,114,182,0.2)]",
};

interface NeighborSuggestionsProps {
  suggestions: StorySuggestion[];
  onSelect: (id: string) => void;
}

export function NeighborSuggestions({
  suggestions,
  onSelect,
}: NeighborSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-cosmos-200/15 bg-panel/60 p-5 backdrop-blur-xl">
      <h4 className="mb-3 font-display text-xs tracking-wider text-cosmos-200/60 uppercase">
        Neighbor Stories
      </h4>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSelect(suggestion.id)}
            className={cn(
              "rounded-lg border bg-cosmos-900/50 px-3 py-2 text-left transition-all duration-200",
              DOMAIN_BORDER_COLORS[suggestion.medium],
              DOMAIN_GLOW[suggestion.medium],
            )}
          >
            <span className="block text-xs font-medium text-cosmos-100">
              {suggestion.title}
            </span>
            <span className="mt-0.5 block text-[10px] text-cosmos-200/50">
              {suggestion.medium}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

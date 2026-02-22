"use client";

import type { StoryCatalogItem } from "@/lib/agents/catalogSeed";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DOMAIN_BORDER_GRADIENTS: Record<StoryMedium, string> = {
  Movie: "from-domain-movie to-transparent",
  History: "from-domain-history to-transparent",
  Novel: "from-domain-novel to-transparent",
};

const DOMAIN_HOVER_SHADOWS: Record<StoryMedium, string> = {
  Movie: "hover:shadow-movie",
  History: "hover:shadow-history",
  Novel: "hover:shadow-novel",
};

const DOMAIN_BG_RADIALS: Record<StoryMedium, string> = {
  Movie: "bg-[radial-gradient(circle_at_50%_0%,rgba(96,165,250,0.05),transparent_70%)]",
  History: "bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.05),transparent_70%)]",
  Novel: "bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.05),transparent_70%)]",
};

type SelectionState = "source" | "target" | "none";

interface StoryCardProps {
  story: StoryCatalogItem;
  selectionState: SelectionState;
  onClick: () => void;
}

export function StoryCard({ story, selectionState, onClick }: StoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]",
        DOMAIN_BG_RADIALS[story.medium],
        selectionState === "source"
          ? "glow-border-cyan border-neon-cyan/60 bg-panel/70"
          : selectionState === "target"
            ? "glow-border-violet border-neon-violet/60 bg-panel/70"
            : `border-cosmos-200/10 bg-panel/50 ${DOMAIN_HOVER_SHADOWS[story.medium]}`,
      )}
    >
      {/* Top gradient border strip */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r",
          DOMAIN_BORDER_GRADIENTS[story.medium],
        )}
      />

      {/* Selection label */}
      {selectionState !== "none" && (
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
            selectionState === "source"
              ? "bg-neon-cyan/20 text-neon-cyan"
              : "bg-neon-violet/20 text-neon-violet",
          )}
        >
          {selectionState === "source" ? "SOURCE" : "TARGET"}
        </span>
      )}

      <div className="relative">
        <Badge domain={story.medium} className="mb-2">
          {story.medium}
        </Badge>
        <h3 className="font-display text-sm tracking-wide text-cosmos-100">
          {story.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
          {story.summary}
        </p>
      </div>
    </button>
  );
}

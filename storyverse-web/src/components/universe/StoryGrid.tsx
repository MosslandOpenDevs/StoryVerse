"use client";

import type { StoryCatalogItem } from "@/lib/agents/catalogSeed";
import { StoryCard } from "./StoryCard";

interface StoryGridProps {
  catalog: StoryCatalogItem[];
  selectedSourceId: string;
  selectedTargetId: string;
  onStoryClick: (storyId: string) => void;
}

export function StoryGrid({
  catalog,
  selectedSourceId,
  selectedTargetId,
  onStoryClick,
}: StoryGridProps) {
  const guideText =
    selectedSourceId === ""
      ? "Click a story to select as Source"
      : selectedTargetId === ""
        ? "Now click a story to select as Target"
        : "Pair selected — generate a bridge or pick new stories";

  return (
    <div>
      <p className="mb-4 text-xs text-cosmos-200/60">{guideText}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {catalog.map((story) => {
          const selectionState =
            story.id === selectedSourceId
              ? "source"
              : story.id === selectedTargetId
                ? "target"
                : "none";

          return (
            <StoryCard
              key={story.id}
              story={story}
              selectionState={selectionState as "source" | "target" | "none"}
              onClick={() => onStoryClick(story.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

"use client";

import type { StoryCatalogItem } from "@/lib/agents/catalogSeed";
import { StoryCard } from "./StoryCard";

interface StoryGridProps {
  catalog: StoryCatalogItem[];
  selectedSourceId: string;
  selectedTargetId: string;
  onStoryClick: (storyId: string) => void;
  uiLocale: "en" | "ko";
}

const COPY = {
  en: {
    selectSource: "Click a story to select as Source",
    selectTarget: "Now click a story to select as Target",
    pairReady: "Pair selected — generate a bridge or pick new stories",
    empty: "No stories match your search or filters. Try clearing filters or changing the search term.",
  },
  ko: {
    selectSource: "스토리를 눌러 출발 노드로 선택하세요",
    selectTarget: "이제 다른 스토리를 눌러 도착 노드로 선택하세요",
    pairReady: "페어 선택 완료 — 브리지를 생성하거나 새 스토리를 고르세요",
    empty: "검색어나 필터와 일치하는 스토리가 없어요. 필터를 지우거나 검색어를 바꿔보세요.",
  },
} as const;

export function StoryGrid({
  catalog,
  selectedSourceId,
  selectedTargetId,
  onStoryClick,
  uiLocale,
}: StoryGridProps) {
  const copy = COPY[uiLocale] ?? COPY.en;
  const guideText =
    selectedSourceId === ""
      ? copy.selectSource
      : selectedTargetId === ""
        ? copy.selectTarget
        : copy.pairReady;

  if (catalog.length === 0) {
    return (
      <div className="rounded-md border border-cosmos-300/15 p-4 text-xs text-cosmos-200/65">
        {copy.empty}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-xs text-cosmos-200/60" aria-live="polite">
        {guideText}
      </p>
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

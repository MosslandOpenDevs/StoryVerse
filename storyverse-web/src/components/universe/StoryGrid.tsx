"use client";

import type { StoryCatalogItem } from "@/lib/agents/catalogSeed";
import { StoryCard } from "./StoryCard";

interface StoryGridProps {
  catalog: StoryCatalogItem[];
  totalCount: number;
  selectedSourceId: string;
  selectedTargetId: string;
  onStoryClick: (storyId: string) => void;
  uiLocale: "en" | "ko";
  hasActiveSearch: boolean;
  hasActiveMediumFilter: boolean;
  mediumSuggestions: Array<{ medium: string; count: number }>;
  quickRecoveryTerms: readonly string[];
  onApplyQuickRecoveryTerm: (term: string) => void;
  onApplyMediumSuggestion: (medium: string) => void;
  onClearSearch: () => void;
  onClearMediumFilter: () => void;
  onClearAllFilters: () => void;
}

const COPY = {
  en: {
    selectSource: "Click a story to select as Source",
    selectTarget: "Now click a story to select as Target",
    pairReady: "Pair selected — generate a bridge or pick new stories",
    empty: "No stories match your search or filters. Try clearing filters or changing the search term.",
    mediumRecovery: "Switch medium",
    quickRecovery: "Try a quick recovery pick",
    results: "results",
    showingAll: "Showing full catalog",
    filtersActive: "Filters active",
    clearSearch: "Clear search",
    clearMedium: "Show all mediums",
    clearAll: "Reset all filters",
  },
  ko: {
    selectSource: "스토리를 눌러 출발 노드로 선택하세요",
    selectTarget: "이제 다른 스토리를 눌러 도착 노드로 선택하세요",
    pairReady: "페어 선택 완료 — 브리지를 생성하거나 새 스토리를 고르세요",
    empty: "검색어나 필터와 일치하는 스토리가 없어요. 필터를 지우거나 검색어를 바꿔보세요.",
    mediumRecovery: "다른 매체에서 보기",
    quickRecovery: "빠른 복구 추천",
    results: "개 결과",
    showingAll: "전체 카탈로그 표시 중",
    filtersActive: "필터 적용 중",
    clearSearch: "검색 지우기",
    clearMedium: "매체 전체 보기",
    clearAll: "필터 모두 초기화",
  },
} as const;

export function StoryGrid({
  catalog,
  totalCount,
  selectedSourceId,
  selectedTargetId,
  onStoryClick,
  uiLocale,
  hasActiveSearch,
  hasActiveMediumFilter,
  mediumSuggestions,
  quickRecoveryTerms,
  onApplyQuickRecoveryTerm,
  onApplyMediumSuggestion,
  onClearSearch,
  onClearMediumFilter,
  onClearAllFilters,
}: StoryGridProps) {
  const copy = COPY[uiLocale] ?? COPY.en;
  const guideText =
    selectedSourceId === ""
      ? copy.selectSource
      : selectedTargetId === ""
        ? copy.selectTarget
        : copy.pairReady;
  const mediumSuggestionByKey = mediumSuggestions.reduce(
    (acc, { medium, count }) => {
      const key = medium.trim().toLowerCase();
      if (!key) {
        return acc;
      }

      const current = acc[key];
      if (!current) {
        acc[key] = { medium, count };
        return acc;
      }

      current.count += count;
      return acc;
    },
    {} as Record<string, { medium: string; count: number }>
  );

  const hasActiveFilters = hasActiveSearch || hasActiveMediumFilter;
  const uniqueMediumSuggestions = Object.values(mediumSuggestionByKey);
  const uniqueQuickRecoveryTerms = [
    ...new Set(
      quickRecoveryTerms
        .map((term) => term.trim())
        .filter((term) => term.length > 0)
    ),
  ];

  if (catalog.length === 0) {
    return (
      <div className="rounded-md border border-cosmos-300/15 bg-cosmos-900/20 p-4 text-xs text-cosmos-200/65">
        <p>{copy.empty}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hasActiveSearch ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
            >
              {copy.clearSearch}
            </button>
          ) : null}
          {hasActiveMediumFilter ? (
            <button
              type="button"
              onClick={onClearMediumFilter}
              className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-[11px] font-medium text-violet-100 transition hover:border-violet-200/50 hover:bg-violet-300/15"
            >
              {copy.clearMedium}
            </button>
          ) : null}
          {(hasActiveSearch || hasActiveMediumFilter) ? (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="rounded-full border border-cosmos-500 px-3 py-1 text-[11px] font-medium text-cosmos-100 transition hover:border-cosmos-300 hover:bg-cosmos-800/50"
            >
              {copy.clearAll}
            </button>
          ) : null}
        </div>
        {uniqueMediumSuggestions.length > 0 ? (
          <div className="mt-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-cosmos-300/60">{copy.mediumRecovery}</p>
            <div className="flex flex-wrap gap-2">
              {uniqueMediumSuggestions.map(({ medium, count }) => (
                <button
                  key={medium}
                  type="button"
                  onClick={() => onApplyMediumSuggestion(medium)}
                  className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-[11px] font-medium text-violet-100 transition hover:border-violet-200/50 hover:bg-violet-300/15"
                >
                  {medium} ({count})
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {uniqueQuickRecoveryTerms.length > 0 ? (
          <div className="mt-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-cosmos-300/60">{copy.quickRecovery}</p>
            <div className="flex flex-wrap gap-2">
              {uniqueQuickRecoveryTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onApplyQuickRecoveryTerm(term)}
                  className="rounded-full border border-cosmos-300/20 bg-cosmos-950/40 px-3 py-1 text-[11px] font-medium text-cosmos-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-cosmos-200/60" aria-live="polite">
          {guideText}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-cosmos-700/50 bg-cosmos-900/40 px-2.5 py-1 text-cosmos-100/85">
            {catalog.length}/{totalCount} {copy.results}
          </span>
          {hasActiveFilters ? (
            <>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-emerald-100/85">
                {copy.filtersActive}
              </span>
              {hasActiveSearch ? (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
                >
                  {copy.clearSearch}
                </button>
              ) : null}
              {hasActiveMediumFilter ? (
                <button
                  type="button"
                  onClick={onClearMediumFilter}
                  className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 font-medium text-violet-100 transition hover:border-violet-200/50 hover:bg-violet-300/15"
                >
                  {copy.clearMedium}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClearAllFilters}
                className="rounded-full border border-cosmos-500 px-3 py-1 font-medium text-cosmos-100 transition hover:border-cosmos-300 hover:bg-cosmos-800/50"
              >
                {copy.clearAll}
              </button>
            </>
          ) : (
            <span className="rounded-full border border-cosmos-700/50 bg-cosmos-900/30 px-2.5 py-1 text-cosmos-200/65">
              {copy.showingAll}
            </span>
          )}
        </div>
      </div>
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

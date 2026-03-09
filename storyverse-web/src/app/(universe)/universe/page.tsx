"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { StoryGrid } from "@/components/universe/StoryGrid";
import { BridgePanel } from "@/components/universe/BridgePanel";
import { useUniverseState } from "@/components/universe/useUniverseState";
import { SEED_CATALOG, type StoryCatalogItem } from "@/lib/agents/catalogSeed";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";
import { fetchCatalogAction } from "./actions";

const MEDIUM_FILTERS: Array<StoryMedium | "All"> = ["All", "Movie", "History", "Novel"];
const STORY_MEDIA: StoryMedium[] = ["Movie", "History", "Novel"];
const SEARCH_QUERY_PARAM = "q";
const MEDIUM_FILTER_PARAM = "medium";
const QUICK_FILTERS = ["Sherlock", "galaxy", "dynasty", "rebellion"] as const;

const COPY = {
  en: {
    title: "Story Universe",
    updatingCatalog: "Updating catalog...",
    updatedAt: "Updated",
    storiesCountSuffix: "stories",
    refreshCatalog: "Refresh catalog",
    refreshCatalogAria: "Refresh story catalog",
    refreshError: "Unable to refresh the full catalog.",
    retry: "Retry",
    searchLabel: "Search stories",
    searchPlaceholder: "Try: Sherlock, galaxy, Jedi, or novel",
    searchHelp: "Search matches titles, summaries, mediums, and aliases.",
    searchShortcutHelp: "Press / to focus search and Esc to clear filters.",
    quickFiltersLabel: "Quick picks",
    clearFilters: "Clear filters",
    activeFilters: "Active filters",
    removeSearchFilter: "Remove search filter",
    removeMediumFilter: "Remove medium filter",
    revealSelectedStories: "Reveal selected stories",
    hiddenSelectionPrefix: "Active selection is hidden by the current filters:",
    hiddenSource: "Source",
    hiddenTarget: "Target",
    showingPrefix: "Showing",
    filtersActive: "Filters active",
    selectedStoriesPreserved: "Selected stories preserved",
    loadingUniverse: "Loading universe...",
    mediumLabels: {
      All: "All",
      Movie: "Movie",
      History: "History",
      Novel: "Novel",
    },
    mediumCountSuffix: "stories",
    mediumCountLabel: "matching stories",
  },
  ko: {
    title: "스토리 유니버스",
    updatingCatalog: "카탈로그 업데이트 중...",
    updatedAt: "업데이트",
    storiesCountSuffix: "개 스토리",
    refreshCatalog: "카탈로그 새로고침",
    refreshCatalogAria: "스토리 카탈로그 새로고침",
    refreshError: "전체 카탈로그를 새로고침하지 못했어요.",
    retry: "다시 시도",
    searchLabel: "스토리 검색",
    searchPlaceholder: "예: Sherlock, galaxy, Jedi, novel",
    searchHelp: "제목, 요약, 매체, 별칭 기준으로 검색해요.",
    searchShortcutHelp: "/ 키로 검색에 바로 이동하고 Esc로 필터를 지울 수 있어요.",
    quickFiltersLabel: "빠른 탐색",
    clearFilters: "필터 지우기",
    activeFilters: "활성 필터",
    removeSearchFilter: "검색 필터 제거",
    removeMediumFilter: "매체 필터 제거",
    revealSelectedStories: "선택한 스토리 다시 표시",
    hiddenSelectionPrefix: "현재 선택이 필터에 가려져 있어요:",
    hiddenSource: "출발",
    hiddenTarget: "도착",
    showingPrefix: "표시 중",
    filtersActive: "필터 적용 중",
    selectedStoriesPreserved: "선택 스토리 유지됨",
    loadingUniverse: "유니버스 로딩 중...",
    mediumLabels: {
      All: "전체",
      Movie: "영화",
      History: "역사",
      Novel: "소설",
    },
    mediumCountSuffix: "개",
    mediumCountLabel: "일치 스토리",
  },
} as const;

function parseMediumFilter(value: string | null): StoryMedium | "All" {
  if (value === "Movie" || value === "History" || value === "Novel") {
    return value;
  }

  return "All";
}

function UniverseContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialStoryId = searchParams.get("story") ?? undefined;
  const [catalog, setCatalog] = useState<StoryCatalogItem[]>(SEED_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [lastCatalogRefreshAt, setLastCatalogRefreshAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get(SEARCH_QUERY_PARAM) ?? "");
  const [mediumFilter, setMediumFilter] = useState<StoryMedium | "All">(() =>
    parseMediumFilter(searchParams.get(MEDIUM_FILTER_PARAM)),
  );

  const loadCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    try {
      const fullCatalog = await fetchCatalogAction();
      setCatalog(fullCatalog);
      setCatalogError(null);
      setLastCatalogRefreshAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setCatalogError("refresh_failed");
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  // Fetch full dynamic catalog on mount
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const nextSearchQuery = searchParams.get(SEARCH_QUERY_PARAM) ?? "";
    const nextMediumFilter = parseMediumFilter(searchParams.get(MEDIUM_FILTER_PARAM));

    if (nextSearchQuery !== searchQuery) {
      setSearchQuery(nextSearchQuery);
    }

    if (nextMediumFilter !== mediumFilter) {
      setMediumFilter(nextMediumFilter);
    }
  }, [mediumFilter, searchParams, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length > 0) {
      params.set(SEARCH_QUERY_PARAM, trimmedQuery);
    } else {
      params.delete(SEARCH_QUERY_PARAM);
    }

    if (mediumFilter !== "All") {
      params.set(MEDIUM_FILTER_PARAM, mediumFilter);
    } else {
      params.delete(MEDIUM_FILTER_PARAM);
    }

    const currentParams = searchParams.toString();
    const nextParams = params.toString();

    if (currentParams === nextParams) {
      return;
    }

    const nextUrl = nextParams.length > 0 ? `${pathname}?${nextParams}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [mediumFilter, pathname, router, searchParams, searchQuery]);

  const trimmedSearchQuery = searchQuery.trim();
  const hasActiveFilters = trimmedSearchQuery.length > 0 || mediumFilter !== "All";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const activeTagName =
        target instanceof HTMLElement ? target.tagName.toLowerCase() : "";
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          activeTagName === "input" ||
          activeTagName === "textarea" ||
          activeTagName === "select");

      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isEditable) {
          return;
        }

        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === "Escape") {
        const isSearchFocused = document.activeElement === searchInputRef.current;
        if (!isSearchFocused && !hasActiveFilters) {
          return;
        }

        event.preventDefault();
        setSearchQuery("");
        setMediumFilter("All");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasActiveFilters]);

  const matchesSearch = useCallback((story: StoryCatalogItem, normalizedQuery: string) => {
    if (normalizedQuery.length === 0) {
      return true;
    }

    const haystack = [story.title, story.summary, story.medium, ...story.aliases]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  }, []);

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return catalog.filter((story) => {
      const matchesMedium = mediumFilter === "All" || story.medium === mediumFilter;
      if (!matchesMedium) {
        return false;
      }

      return matchesSearch(story, normalizedQuery);
    });
  }, [catalog, matchesSearch, mediumFilter, searchQuery]);

  const mediumAvailability = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const counts = STORY_MEDIA.reduce(
      (acc, medium) => ({ ...acc, [medium]: 0 }),
      {} as Record<StoryMedium, number>,
    );

    for (const story of catalog) {
      if (!matchesSearch(story, normalizedQuery)) {
        continue;
      }

      counts[story.medium] += 1;
    }

    return {
      All: catalog.filter((story) => matchesSearch(story, normalizedQuery)).length,
      ...counts,
    } satisfies Record<StoryMedium | "All", number>;
  }, [catalog, matchesSearch, searchQuery]);

  const state = useUniverseState(catalog, initialStoryId);
  const copy = COPY[state.uiLocale] ?? COPY.en;
  const visibleStoryIds = useMemo(() => new Set(filteredCatalog.map((story) => story.id)), [filteredCatalog]);
  const hiddenSourceStory = useMemo(
    () =>
      state.selectedSourceId && !visibleStoryIds.has(state.selectedSourceId)
        ? catalog.find((story) => story.id === state.selectedSourceId) ?? null
        : null,
    [catalog, state.selectedSourceId, visibleStoryIds],
  );
  const hiddenTargetStory = useMemo(
    () =>
      state.selectedTargetId && !visibleStoryIds.has(state.selectedTargetId)
        ? catalog.find((story) => story.id === state.selectedTargetId) ?? null
        : null,
    [catalog, state.selectedTargetId, visibleStoryIds],
  );
  const hasHiddenSelection = hiddenSourceStory !== null || hiddenTargetStory !== null;

  return (
    <main className="min-h-dvh bg-cosmos-950 pt-14 text-cosmos-100">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 bg-space-grid bg-[size:42px_42px] opacity-10" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.08),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.06),transparent_50%)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        {/* Story Grid — left side */}
        <section className="w-full lg:w-[55%]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg tracking-wide text-cosmos-100">
              {copy.title}
            </h2>
            <div className="flex items-center gap-3">
              {isCatalogLoading ? (
                <span className="text-xs text-cosmos-300/70">
                  {copy.updatingCatalog}
                </span>
              ) : lastCatalogRefreshAt ? (
                <span className="text-xs text-cosmos-300/60">
                  {copy.updatedAt} {lastCatalogRefreshAt}
                </span>
              ) : null}
              <span className="text-xs text-cosmos-200/40">
                {catalog.length} {copy.storiesCountSuffix}
              </span>
              <button
                type="button"
                className="rounded-md border border-cosmos-300/20 px-3 py-1.5 text-xs font-medium text-cosmos-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void loadCatalog();
                }}
                disabled={isCatalogLoading}
                aria-label={copy.refreshCatalogAria}
              >
                {copy.refreshCatalog}
              </button>
            </div>
          </div>
          {catalogError ? (
            <div className="mb-4 flex items-center gap-3 rounded-md border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs text-red-100/90">
              <span>{catalogError === "refresh_failed" ? copy.refreshError : catalogError}</span>
              <button
                type="button"
                className="rounded border border-red-200/30 px-2 py-1 text-[11px] font-medium text-red-100 transition hover:bg-red-200/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void loadCatalog();
                }}
                disabled={isCatalogLoading}
              >
                {copy.retry}
              </button>
            </div>
          ) : null}
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-cosmos-300/15 bg-cosmos-900/20 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-xs text-cosmos-200/80">
                <span className="mb-1 block text-cosmos-100/85">{copy.searchLabel}</span>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="w-full rounded-md border border-cosmos-300/20 bg-cosmos-950/60 px-2.5 py-1.5 text-sm text-cosmos-100 placeholder:text-cosmos-400/50 focus:border-cyan-300/50 focus:outline-none"
                />
              </label>
              <p className="text-[11px] text-cosmos-300/70">
                {copy.searchHelp}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-cosmos-300/80">
                <span className="text-cosmos-400/80">{copy.quickFiltersLabel}</span>
                {QUICK_FILTERS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="rounded-full border border-cosmos-300/20 bg-cosmos-950/50 px-2.5 py-1 text-cosmos-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                    onClick={() => {
                      setSearchQuery(term);
                      setMediumFilter("All");
                      searchInputRef.current?.focus();
                      searchInputRef.current?.select();
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-cosmos-400/70">
                {copy.searchShortcutHelp}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0 sm:justify-end">
              {MEDIUM_FILTERS.map((medium) => {
                const availableCount = mediumAvailability[medium];
                const isDisabled = availableCount === 0 && medium !== "All";

                return (
                  <button
                    key={medium}
                    type="button"
                    onClick={() => setMediumFilter(medium)}
                    disabled={isDisabled}
                    aria-label={`${copy.mediumLabels[medium]} · ${availableCount} ${copy.mediumCountLabel}`}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${mediumFilter === medium ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-cosmos-700 text-cosmos-200/80 hover:border-cosmos-400 hover:text-cosmos-100"} ${isDisabled ? "cursor-not-allowed opacity-40 hover:border-cosmos-700 hover:text-cosmos-200/80" : ""}`}
                  >
                    {copy.mediumLabels[medium]} <span className="opacity-70">({availableCount})</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setMediumFilter("All");
                }}
                disabled={!hasActiveFilters}
                className="rounded-full border border-cosmos-600 px-3 py-1.5 text-[11px] font-medium text-cosmos-200/80 transition-colors hover:border-cosmos-300 hover:text-cosmos-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copy.clearFilters}
              </button>
            </div>
          </div>
          {hasActiveFilters ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-cosmos-300/15 bg-cosmos-900/20 px-3 py-2 text-xs text-cosmos-100/85">
              <span className="text-cosmos-300/70">{copy.activeFilters}</span>
              {trimmedSearchQuery.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={copy.removeSearchFilter}
                  className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
                >
                  q: {trimmedSearchQuery} ×
                </button>
              ) : null}
              {mediumFilter !== "All" ? (
                <button
                  type="button"
                  onClick={() => setMediumFilter("All")}
                  aria-label={copy.removeMediumFilter}
                  className="rounded-full border border-violet-300/30 bg-violet-300/10 px-2.5 py-1 text-[11px] font-medium text-violet-100 transition hover:border-violet-200/50 hover:bg-violet-300/15"
                >
                  {copy.mediumLabels[mediumFilter]} ×
                </button>
              ) : null}
            </div>
          ) : null}
          {hasHiddenSelection ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100/90">
              <span>
                {copy.hiddenSelectionPrefix}
                {hiddenSourceStory
                  ? ` ${copy.hiddenSource}: ${hiddenSourceStory.title}.`
                  : ""}
                {hiddenTargetStory
                  ? ` ${copy.hiddenTarget}: ${hiddenTargetStory.title}.`
                  : ""}
              </span>
              <button
                type="button"
                className="rounded border border-amber-200/30 px-2 py-1 text-[11px] font-medium text-amber-50 transition hover:bg-amber-200/10"
                onClick={() => {
                  setSearchQuery("");
                  setMediumFilter("All");
                }}
              >
                {copy.revealSelectedStories}
              </button>
            </div>
          ) : null}
          <StoryGrid
            catalog={filteredCatalog}
            totalCount={catalog.length}
            selectedSourceId={state.selectedSourceId}
            selectedTargetId={state.selectedTargetId}
            onStoryClick={state.handleStoryCardClick}
            uiLocale={state.uiLocale}
            hasActiveSearch={trimmedSearchQuery.length > 0}
            hasActiveMediumFilter={mediumFilter !== "All"}
            onClearSearch={() => setSearchQuery("")}
            onClearMediumFilter={() => setMediumFilter("All")}
            onClearAllFilters={() => {
              setSearchQuery("");
              setMediumFilter("All");
            }}
          />
          <p className="mt-2 text-[10px] text-cosmos-300/70">
            {copy.showingPrefix} {filteredCatalog.length} / {catalog.length} {copy.storiesCountSuffix}
            {hasActiveFilters ? ` · ${copy.filtersActive}` : ""}
            {hasHiddenSelection ? ` · ${copy.selectedStoriesPreserved}` : ""}
          </p>
        </section>

        {/* Bridge Panel — right side */}
        <section className="w-full lg:w-[45%]">
          <BridgePanel state={state} />
        </section>
      </div>
    </main>
  );
}

export default function UniversePage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="grid min-h-dvh place-items-center bg-cosmos-950 text-cosmos-200">
            {COPY.en.loadingUniverse}
          </div>
        }
      >
        <UniverseContent />
      </Suspense>
    </>
  );
}

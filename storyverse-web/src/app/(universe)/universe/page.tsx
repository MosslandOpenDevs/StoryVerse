"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { StoryGrid } from "@/components/universe/StoryGrid";
import { BridgePanel } from "@/components/universe/BridgePanel";
import { useUniverseState } from "@/components/universe/useUniverseState";
import { SEED_CATALOG, type StoryCatalogItem } from "@/lib/agents/catalogSeed";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";
import { fetchCatalogAction } from "./actions";

const MEDIUM_FILTERS: Array<StoryMedium | "All"> = ["All", "Movie", "History", "Novel"];
const SEARCH_QUERY_PARAM = "q";
const MEDIUM_FILTER_PARAM = "medium";

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
    clearFilters: "Clear filters",
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
    clearFilters: "필터 지우기",
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
      params.set(SEARCH_QUERY_PARAM, searchQuery);
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

  const hasActiveFilters = searchQuery.trim().length > 0 || mediumFilter !== "All";

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return catalog.filter((story) => {
      const matchesMedium = mediumFilter === "All" || story.medium === mediumFilter;
      if (!matchesMedium) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const haystack = [story.title, story.summary, story.medium, ...story.aliases]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [catalog, mediumFilter, searchQuery]);

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
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0 sm:justify-end">
              {MEDIUM_FILTERS.map((medium) => (
                <button
                  key={medium}
                  type="button"
                  onClick={() => setMediumFilter(medium)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${mediumFilter === medium ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-cosmos-700 text-cosmos-200/80 hover:border-cosmos-400 hover:text-cosmos-100"}`}
                >
                  {copy.mediumLabels[medium]}
                </button>
              ))}
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
            selectedSourceId={state.selectedSourceId}
            selectedTargetId={state.selectedTargetId}
            onStoryClick={state.handleStoryCardClick}
            uiLocale={state.uiLocale}
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

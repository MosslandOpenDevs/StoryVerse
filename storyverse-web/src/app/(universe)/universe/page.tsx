"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, ExternalLink, X } from "lucide-react";
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
const SOURCE_PARAM = "source";
const TARGET_PARAM = "target";
const LEGACY_STORY_PARAM = "story";
const QUICK_FILTERS = ["Sherlock", "galaxy", "dynasty", "rebellion"] as const;
const QUICK_FILTER_SHORTCUTS = ["1", "2", "3", "4"] as const;
const SEARCH_QUERY_STORAGE_KEY = "storyverse-universe-search-query";
const MEDIUM_FILTER_STORAGE_KEY = "storyverse-universe-medium-filter";

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
    searchShortcutHelp: "Press / to focus search, 1-4 for quick picks, A/M/H/N for medium filters, L to copy the filtered view, O to open the filtered view in a new tab, Shift+L to copy the selected pair when ready, and Esc to clear filters.",
    quickFiltersLabel: "Quick picks",
    clearFilters: "Clear filters",
    copyFilteredView: "Copy filtered view",
    openFilteredView: "Open filtered view",
    copiedFilteredView: "View link copied",
    copyFilteredViewFailed: "Copy failed",
    activeFilters: "Active filters",
    removeSearchFilter: "Remove search filter",
    removeMediumFilter: "Remove medium filter",
    revealSelectedStories: "Reveal selected stories",
    hiddenSelectionPrefix: "Active selection is hidden by the current filters:",
    hiddenSource: "Source",
    hiddenTarget: "Target",
    selectedPairLabel: "Selected pair",
    selectedPairReady: "Ready to generate",
    selectedPairPending: "Pick target",
    pickSource: "Pick source",
    pickTarget: "Pick target",
    generateBridgeCta: "Generate bridge",
    pairLinkCopied: "Pair link copied",
    copyPairLink: "Copy pair link",
    openPairLink: "Open pair link",
    bridgePromptCopied: "Bridge prompt copied",
    copyPrompt: "Copy prompt",
    swapPair: "Swap pair",
    clearSelection: "Clear selection",
    showingPrefix: "Showing",
    filtersActive: "Filters active",
    selectedStoriesPreserved: "Selected stories preserved",
    recentPairsLabel: "Recent pairs",
    recentPairsEmpty: "No recent pairs yet. Generate a bridge to pin one here.",
    recentPairsResume: "Resume",
    recentPairsActive: "Active",
    recentPairsRemove: "Remove pair",
    copyRecentPairsBundle: "Copy recents",
    recentPairsBundleCopied: "Recents copied",
    recentPairsClearAll: "Clear all",
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
    searchShortcutHelp: "/ 키로 검색에 바로 이동하고 1-4로 빠른 탐색, A/M/H/N으로 매체 필터를 바꾸고, L로 필터 화면 링크를 복사하고, O로 필터 화면을 새 탭에서 열고, Shift+L로 준비된 선택 페어 링크를 복사하고, Esc로 필터를 지울 수 있어요.",
    quickFiltersLabel: "빠른 탐색",
    clearFilters: "필터 지우기",
    copyFilteredView: "필터 화면 링크 복사",
    openFilteredView: "필터 화면 새 탭 열기",
    copiedFilteredView: "화면 링크 복사됨",
    copyFilteredViewFailed: "복사 실패",
    activeFilters: "활성 필터",
    removeSearchFilter: "검색 필터 제거",
    removeMediumFilter: "매체 필터 제거",
    revealSelectedStories: "선택한 스토리 다시 표시",
    hiddenSelectionPrefix: "현재 선택이 필터에 가려져 있어요:",
    hiddenSource: "출발",
    hiddenTarget: "도착",
    selectedPairLabel: "선택된 페어",
    selectedPairReady: "생성 준비 완료",
    selectedPairPending: "도착 노드를 고르세요",
    pickSource: "출발 선택",
    pickTarget: "도착 선택",
    generateBridgeCta: "브리지 생성",
    pairLinkCopied: "페어 링크 복사됨",
    copyPairLink: "페어 링크 복사",
    openPairLink: "페어 링크 열기",
    bridgePromptCopied: "브리지 프롬프트 복사됨",
    copyPrompt: "프롬프트 복사",
    swapPair: "페어 바꾸기",
    clearSelection: "선택 초기화",
    showingPrefix: "표시 중",
    filtersActive: "필터 적용 중",
    selectedStoriesPreserved: "선택 스토리 유지됨",
    recentPairsLabel: "최근 페어",
    recentPairsEmpty: "아직 최근 페어가 없어요. 브리지를 한 번 생성하면 여기에 고정돼요.",
    recentPairsResume: "이어보기",
    recentPairsActive: "Active",
    recentPairsRemove: "페어 제거",
    copyRecentPairsBundle: "최근 페어 묶음 복사",
    recentPairsBundleCopied: "최근 페어 복사됨",
    recentPairsClearAll: "전체 지우기",
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

function loadStoredUniverseSearchQuery() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(SEARCH_QUERY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveStoredUniverseSearchQuery(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(SEARCH_QUERY_STORAGE_KEY, value);
      return;
    }

    window.localStorage.removeItem(SEARCH_QUERY_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep the search UX non-blocking.
  }
}

function loadStoredUniverseMediumFilter() {
  if (typeof window === "undefined") {
    return "All" as const;
  }

  try {
    return parseMediumFilter(window.localStorage.getItem(MEDIUM_FILTER_STORAGE_KEY));
  } catch {
    return "All" as const;
  }
}

function saveStoredUniverseMediumFilter(value: StoryMedium | "All") {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value !== "All") {
      window.localStorage.setItem(MEDIUM_FILTER_STORAGE_KEY, value);
      return;
    }

    window.localStorage.removeItem(MEDIUM_FILTER_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep the filter UX non-blocking.
  }
}

function UniverseContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSourceId = searchParams.get(SOURCE_PARAM) ?? searchParams.get(LEGACY_STORY_PARAM) ?? undefined;
  const initialTargetId = searchParams.get(TARGET_PARAM) ?? undefined;
  const [catalog, setCatalog] = useState<StoryCatalogItem[]>(SEED_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [lastCatalogRefreshAt, setLastCatalogRefreshAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get(SEARCH_QUERY_PARAM) ?? "");
  const [mediumFilter, setMediumFilter] = useState<StoryMedium | "All">(() =>
    parseMediumFilter(searchParams.get(MEDIUM_FILTER_PARAM)),
  );
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [promptCopyFeedback, setPromptCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [filterLinkCopyFeedback, setFilterLinkCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const state = useUniverseState(catalog, initialSourceId, initialTargetId);

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
    const nextSearchQuery = searchParams.get(SEARCH_QUERY_PARAM);
    const nextMediumFilterParam = searchParams.get(MEDIUM_FILTER_PARAM);
    const resolvedSearchQuery = nextSearchQuery ?? loadStoredUniverseSearchQuery();
    const resolvedMediumFilter = nextMediumFilterParam
      ? parseMediumFilter(nextMediumFilterParam)
      : loadStoredUniverseMediumFilter();

    if (resolvedSearchQuery !== searchQuery) {
      setSearchQuery(resolvedSearchQuery);
    }

    if (resolvedMediumFilter !== mediumFilter) {
      setMediumFilter(resolvedMediumFilter);
    }
  }, [mediumFilter, searchParams, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedQuery = searchQuery.trim();

    saveStoredUniverseSearchQuery(trimmedQuery);
    saveStoredUniverseMediumFilter(mediumFilter);

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

    if (state.selectedSourceId) {
      params.set(SOURCE_PARAM, state.selectedSourceId);
    } else {
      params.delete(SOURCE_PARAM);
    }

    if (state.selectedTargetId) {
      params.set(TARGET_PARAM, state.selectedTargetId);
    } else {
      params.delete(TARGET_PARAM);
    }

    params.delete(LEGACY_STORY_PARAM);

    const currentParams = searchParams.toString();
    const nextParams = params.toString();

    if (currentParams === nextParams) {
      return;
    }

    const nextUrl = nextParams.length > 0 ? `${pathname}?${nextParams}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [mediumFilter, pathname, router, searchParams, searchQuery, state.selectedSourceId, state.selectedTargetId]);

  const trimmedSearchQuery = searchQuery.trim();
  const hasActiveFilters = trimmedSearchQuery.length > 0 || mediumFilter !== "All";
  const activeQuickFilterTerm =
    mediumFilter === "All"
      ? QUICK_FILTERS.find((term) => term.toLowerCase() === trimmedSearchQuery.toLowerCase()) ?? null
      : null;

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

      if (isEditable) {
        if (event.key === "Escape") {
          const input = searchInputRef.current;
          if (document.activeElement === input && input && input.value.length === 0 && mediumFilter === "All") {
            input.blur();
          }
        }
        return;
      }

      if (event.key === "Escape") {
        if (state.selectedSourceId || state.selectedTargetId) {
          return;
        }

        const isSearchFocused = document.activeElement === searchInputRef.current;
        if (!isSearchFocused && !hasActiveFilters) {
          return;
        }

        event.preventDefault();
        setSearchQuery("");
        setMediumFilter("All");
        searchInputRef.current?.blur();
        return;
      }

      const quickFilterIndex = Number.parseInt(event.key, 10) - 1;
      const quickFilterTerm = QUICK_FILTERS[quickFilterIndex];
      if (quickFilterTerm) {
        event.preventDefault();
        setSearchQuery(quickFilterTerm);
        setMediumFilter("All");
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      const copyFilteredViewShortcut =
        event.key === "l" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey;
      if (copyFilteredViewShortcut) {
        event.preventDefault();

        const params = new URLSearchParams();
        const trimmedQueryForLink = searchQuery.trim();
        if (trimmedQueryForLink.length > 0) {
          params.set(SEARCH_QUERY_PARAM, trimmedQueryForLink);
        }
        if (mediumFilter !== "All") {
          params.set(MEDIUM_FILTER_PARAM, mediumFilter);
        }

        const nextUrl = params.toString().length > 0
          ? `${window.location.origin}${pathname}?${params.toString()}`
          : `${window.location.origin}${pathname}`;

        void navigator.clipboard.writeText(nextUrl)
          .then(() => setFilterLinkCopyFeedback("success"))
          .catch(() => setFilterLinkCopyFeedback("error"));
        return;
      }

      const copySelectionLinkShortcut =
        event.key === "L" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.shiftKey;
      if (copySelectionLinkShortcut) {
        if (!state.selectedSourceId || !state.selectedTargetId) {
          return;
        }

        event.preventDefault();
        const params = new URLSearchParams();
        const trimmedQueryForLink = searchQuery.trim();

        if (trimmedQueryForLink.length > 0) {
          params.set(SEARCH_QUERY_PARAM, trimmedQueryForLink);
        }
        if (mediumFilter !== "All") {
          params.set(MEDIUM_FILTER_PARAM, mediumFilter);
        }
        params.set(SOURCE_PARAM, state.selectedSourceId);
        params.set(TARGET_PARAM, state.selectedTargetId);

        const nextUrl = `${window.location.origin}${pathname}?${params.toString()}`;

        void navigator.clipboard.writeText(nextUrl)
          .then(() => setCopyFeedback("success"))
          .catch(() => setCopyFeedback("error"));
        return;
      }

      const openFilteredViewShortcut =
        event.key === "o" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey;
      if (openFilteredViewShortcut) {
        event.preventDefault();

        const params = new URLSearchParams();
        const trimmedQueryForLink = searchQuery.trim();
        if (trimmedQueryForLink.length > 0) {
          params.set(SEARCH_QUERY_PARAM, trimmedQueryForLink);
        }
        if (mediumFilter !== "All") {
          params.set(MEDIUM_FILTER_PARAM, mediumFilter);
        }
        if (state.selectedSourceId) {
          params.set(SOURCE_PARAM, state.selectedSourceId);
        }
        if (state.selectedTargetId) {
          params.set(TARGET_PARAM, state.selectedTargetId);
        }

        const nextUrl = params.toString().length > 0
          ? `${window.location.origin}${pathname}?${params.toString()}`
          : `${window.location.origin}${pathname}`;

        window.open(nextUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const mediumShortcutMap: Partial<Record<string, StoryMedium | "All">> = {
        a: "All",
        A: "All",
        m: "Movie",
        M: "Movie",
        h: "History",
        H: "History",
        n: "Novel",
        N: "Novel",
      };
      const nextMediumFilter = mediumShortcutMap[event.key];
      if (nextMediumFilter) {
        event.preventDefault();
        setMediumFilter(nextMediumFilter);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasActiveFilters, mediumFilter, pathname, searchQuery, state.selectedSourceId, state.selectedTargetId]);

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

  const copy = COPY[state.uiLocale] ?? COPY.en;
  const visibleStoryIds = useMemo(() => new Set(filteredCatalog.map((story) => story.id)), [filteredCatalog]);
  const validRecentPairs = useMemo(
    () =>
      state.recentPairs
        .flatMap((pair, recentIndex) => {
          const source = catalog.find((story) => story.id === pair.sourceId);
          const target = catalog.find((story) => story.id === pair.targetId);
          return source && target && source.id !== target.id ? [{ ...pair, recentIndex }] : [];
        })
        .slice(0, 3),
    [catalog, state.recentPairs],
  );
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
  const selectedSourceStory = useMemo(
    () => (state.selectedSourceId ? catalog.find((story) => story.id === state.selectedSourceId) ?? null : null),
    [catalog, state.selectedSourceId],
  );
  const selectedTargetStory = useMemo(
    () => (state.selectedTargetId ? catalog.find((story) => story.id === state.selectedTargetId) ?? null : null),
    [catalog, state.selectedTargetId],
  );
  const hasReadySelection = Boolean(
    selectedSourceStory &&
    selectedTargetStory &&
    selectedSourceStory.id !== selectedTargetStory.id,
  );

  const buildPairLink = useCallback((sourceId: string, targetId: string) => {
    const params = new URLSearchParams();
    const trimmedQueryForLink = searchQuery.trim();

    if (trimmedQueryForLink.length > 0) {
      params.set(SEARCH_QUERY_PARAM, trimmedQueryForLink);
    }

    if (mediumFilter !== "All") {
      params.set(MEDIUM_FILTER_PARAM, mediumFilter);
    }

    params.set(SOURCE_PARAM, sourceId);
    params.set(TARGET_PARAM, targetId);

    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [mediumFilter, pathname, searchQuery]);

  const handleCopySelectionLink = useCallback(async () => {
    if (!state.selectedSourceId || !state.selectedTargetId) {
      return;
    }

    const nextUrl = buildPairLink(state.selectedSourceId, state.selectedTargetId);

    try {
      await navigator.clipboard.writeText(nextUrl);
      setCopyFeedback("success");
    } catch {
      setCopyFeedback("error");
    }
  }, [buildPairLink, state.selectedSourceId, state.selectedTargetId]);

  const handleOpenSelectionLink = useCallback(() => {
    if (!state.selectedSourceId || !state.selectedTargetId) {
      return;
    }

    const nextUrl = buildPairLink(state.selectedSourceId, state.selectedTargetId);
    window.open(nextUrl, "_blank", "noopener,noreferrer");
  }, [buildPairLink, state.selectedSourceId, state.selectedTargetId]);

  const handleCopyRecentPairLink = useCallback(async (sourceId: string, targetId: string) => {
    try {
      await navigator.clipboard.writeText(buildPairLink(sourceId, targetId));
      setCopyFeedback("success");
    } catch {
      setCopyFeedback("error");
    }
  }, [buildPairLink]);

  const handleCopyRecentPairsBundle = useCallback(async () => {
    if (validRecentPairs.length === 0) {
      return;
    }

    const lines = [
      state.uiLocale === "ko" ? "StoryVerse 최근 페어" : "StoryVerse recent pairs",
      ...validRecentPairs.map((pair, index) => `${index + 1}. ${pair.sourceTitle} → ${pair.targetTitle}\n${buildPairLink(pair.sourceId, pair.targetId)}`),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n\n"));
      setCopyFeedback("success");
    } catch {
      setCopyFeedback("error");
    }
  }, [buildPairLink, state.uiLocale, validRecentPairs]);

  const buildFilteredViewUrl = useCallback(() => {
    const params = new URLSearchParams();
    const trimmedQueryForLink = searchQuery.trim();

    if (trimmedQueryForLink.length > 0) {
      params.set(SEARCH_QUERY_PARAM, trimmedQueryForLink);
    }

    if (mediumFilter !== "All") {
      params.set(MEDIUM_FILTER_PARAM, mediumFilter);
    }

    if (state.selectedSourceId) {
      params.set(SOURCE_PARAM, state.selectedSourceId);
    }

    if (state.selectedTargetId) {
      params.set(TARGET_PARAM, state.selectedTargetId);
    }

    return params.toString().length > 0
      ? `${window.location.origin}${pathname}?${params.toString()}`
      : `${window.location.origin}${pathname}`;
  }, [mediumFilter, pathname, searchQuery, state.selectedSourceId, state.selectedTargetId]);

  const handleCopyFilteredView = useCallback(async () => {
    const nextUrl = buildFilteredViewUrl();

    try {
      await navigator.clipboard.writeText(nextUrl);
      setFilterLinkCopyFeedback("success");
    } catch {
      setFilterLinkCopyFeedback("error");
    }
  }, [buildFilteredViewUrl]);

  const handleOpenFilteredView = useCallback(() => {
    const nextUrl = buildFilteredViewUrl();
    window.open(nextUrl, "_blank", "noopener,noreferrer");
  }, [buildFilteredViewUrl]);

  const handleCopyPrompt = useCallback(async () => {
    if (!state.selectedSourceId || !state.selectedTargetId) {
      return;
    }

    const source = state.catalog.find((story) => story.id === state.selectedSourceId);
    const target = state.catalog.find((story) => story.id === state.selectedTargetId);
    if (!source || !target) return;

    const prompt = state.uiLocale === "ko"
      ? `${source.title}를 ${target.title}와 연결해줘.`
      : `Connect ${source.title} to ${target.title}.`;

    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopyFeedback("success");
    } catch {
      setPromptCopyFeedback("error");
    }
  }, [state.catalog, state.selectedSourceId, state.selectedTargetId, state.uiLocale]);

  useEffect(() => {
    if (copyFeedback === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopyFeedback("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copyFeedback]);

  useEffect(() => {
    if (promptCopyFeedback === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPromptCopyFeedback("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [promptCopyFeedback]);

  useEffect(() => {
    if (filterLinkCopyFeedback === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFilterLinkCopyFeedback("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [filterLinkCopyFeedback]);

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
                {QUICK_FILTERS.map((term, index) => {
                  const isActive = activeQuickFilterTerm === term;

                  return (
                    <button
                      key={term}
                      type="button"
                      className={`rounded-full border px-2.5 py-1 text-cosmos-100 transition ${isActive ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-50 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]" : "border-cosmos-300/20 bg-cosmos-950/50 hover:border-cyan-300/40 hover:bg-cyan-300/10"}`}
                      onClick={() => {
                        setSearchQuery(term);
                        setMediumFilter("All");
                        searchInputRef.current?.focus();
                        searchInputRef.current?.select();
                      }}
                      title={`${QUICK_FILTER_SHORTCUTS[index]} · ${term}`}
                      aria-label={`${QUICK_FILTER_SHORTCUTS[index]} · ${term}`}
                      aria-pressed={isActive}
                    >
                      <span className={`mr-1 ${isActive ? "text-cyan-100/90" : "text-cosmos-400/80"}`}>{QUICK_FILTER_SHORTCUTS[index]}</span>
                      {term}
                    </button>
                  );
                })}
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
                  void handleCopyFilteredView();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-cosmos-600 px-3 py-1.5 text-[11px] font-medium text-cosmos-200/80 transition-colors hover:border-cosmos-300 hover:text-cosmos-100"
                aria-label={
                  filterLinkCopyFeedback === "success"
                    ? copy.copiedFilteredView
                    : filterLinkCopyFeedback === "error"
                      ? copy.copyFilteredViewFailed
                      : copy.copyFilteredView
                }
                title={
                  filterLinkCopyFeedback === "success"
                    ? copy.copiedFilteredView
                    : filterLinkCopyFeedback === "error"
                      ? copy.copyFilteredViewFailed
                      : copy.copyFilteredView
                }
              >
                {filterLinkCopyFeedback === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>
                  {filterLinkCopyFeedback === "success"
                    ? copy.copiedFilteredView
                    : filterLinkCopyFeedback === "error"
                      ? copy.copyFilteredViewFailed
                      : copy.copyFilteredView}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleOpenFilteredView();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-cosmos-600 px-3 py-1.5 text-[11px] font-medium text-cosmos-200/80 transition-colors hover:border-cosmos-300 hover:text-cosmos-100"
                aria-label={copy.openFilteredView}
                title={copy.openFilteredView}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{copy.openFilteredView}</span>
              </button>
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
          {(selectedSourceStory || selectedTargetStory || validRecentPairs.length > 0) ? (
            <div className="mb-3 flex flex-col gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-xs text-cyan-50/95">
              {(selectedSourceStory || selectedTargetStory) ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan-100/70">{copy.selectedPairLabel}</span>
                    <span className={`rounded-full border px-2.5 py-1 font-medium ${hasReadySelection ? "border-emerald-200/35 bg-emerald-300/15 text-emerald-50" : "border-amber-200/30 bg-amber-300/10 text-amber-50"}`}>
                      {hasReadySelection ? copy.selectedPairReady : copy.selectedPairPending}
                    </span>
                    <span className="rounded-full border border-cyan-200/20 bg-cosmos-950/40 px-2.5 py-1 font-medium">
                      {selectedSourceStory?.title ?? copy.pickSource}
                    </span>
                    <span className="text-cyan-100/60">→</span>
                    <span className="rounded-full border border-cyan-200/20 bg-cosmos-950/40 px-2.5 py-1 font-medium">
                      {selectedTargetStory?.title ?? copy.pickTarget}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => state.generateBridge()}
                      disabled={!hasReadySelection || state.isPending}
                      className="rounded-full border border-cyan-200/40 px-3 py-1.5 text-[11px] font-medium text-cyan-50 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copy.generateBridgeCta}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopySelectionLink();
                      }}
                      disabled={!hasReadySelection}
                      className="rounded-full border border-cyan-200/30 px-3 py-1.5 text-[11px] font-medium text-cyan-50 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copyFeedback === "success" ? copy.pairLinkCopied : copyFeedback === "error" ? copy.copyFilteredViewFailed : copy.copyPairLink}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSelectionLink()}
                      disabled={!hasReadySelection}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/30 px-3 py-1.5 text-[11px] font-medium text-cyan-50 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {copy.openPairLink}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyPrompt();
                      }}
                      disabled={!hasReadySelection}
                      className="rounded-full border border-cyan-200/30 px-3 py-1.5 text-[11px] font-medium text-cyan-50 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {promptCopyFeedback === "success"
                        ? copy.bridgePromptCopied
                        : promptCopyFeedback === "error"
                          ? copy.copyFilteredViewFailed
                          : copy.copyPrompt}
                    </button>
                    <button
                      type="button"
                      onClick={() => state.swapSelection()}
                      disabled={!hasReadySelection || state.isPending}
                      className="rounded-full border border-cyan-200/20 px-3 py-1.5 text-[11px] font-medium text-cyan-100/85 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copy.swapPair}
                    </button>
                    <button
                      type="button"
                      onClick={() => state.clearSelection()}
                      disabled={!selectedSourceStory && !selectedTargetStory}
                      className="rounded-full border border-cyan-200/20 px-3 py-1.5 text-[11px] font-medium text-cyan-100/85 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copy.clearSelection}
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 border-t border-cyan-200/10 pt-3">
                <span className="text-cyan-100/70">{copy.recentPairsLabel}</span>
                {validRecentPairs.length > 0 ? (
                  validRecentPairs.map((pair, index) => {
                    const isActiveRecentPair =
                      state.selectedSourceId === pair.sourceId &&
                      state.selectedTargetId === pair.targetId;

                    return (
                    <div
                      key={`${pair.sourceId}:${pair.targetId}:${pair.savedAt}`}
                      className="flex items-center overflow-hidden rounded-full border border-cyan-200/20 bg-cosmos-950/40 text-[11px] font-medium text-cyan-50"
                    >
                      <button
                        type="button"
                        onClick={() => state.resumeRecentPair(pair)}
                        disabled={isActiveRecentPair}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 transition hover:bg-cyan-200/10 disabled:cursor-default disabled:bg-emerald-300/15 disabled:text-emerald-50"
                        title={`${isActiveRecentPair ? copy.recentPairsActive : copy.recentPairsResume} ${pair.sourceTitle} → ${pair.targetTitle}`}
                      >
                        <span className="mr-1 text-cyan-200/60">#{index + 1}</span>
                        {pair.sourceTitle} → {pair.targetTitle}
                        {isActiveRecentPair ? (
                          <span className="rounded-full border border-emerald-200/35 bg-emerald-300/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-50">
                            {copy.recentPairsActive}
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleCopyRecentPairLink(pair.sourceId, pair.targetId);
                        }}
                        className="border-l border-cyan-200/10 px-2 py-1 text-cyan-100/75 transition hover:bg-cyan-200/10 hover:text-cyan-50"
                        aria-label={`${copy.copyPairLink} ${pair.sourceTitle} → ${pair.targetTitle}`}
                        title={`${copy.copyPairLink} ${pair.sourceTitle} → ${pair.targetTitle}`}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={buildPairLink(pair.sourceId, pair.targetId)}
                        target="_blank"
                        rel="noreferrer"
                        className="border-l border-cyan-200/10 px-2 py-1 text-cyan-100/75 transition hover:bg-cyan-200/10 hover:text-cyan-50"
                        aria-label={`${copy.openPairLink} ${pair.sourceTitle} → ${pair.targetTitle}`}
                        title={`${copy.openPairLink} ${pair.sourceTitle} → ${pair.targetTitle}`}
                      >
                        ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => state.removeRecentPairAt(pair.recentIndex)}
                        className="border-l border-cyan-200/10 px-2 py-1 text-cyan-100/75 transition hover:bg-cyan-200/10 hover:text-cyan-50"
                        aria-label={`${copy.recentPairsRemove} ${pair.sourceTitle} → ${pair.targetTitle}`}
                        title={`${copy.recentPairsRemove} ${pair.sourceTitle} → ${pair.targetTitle}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    );
                  })
                ) : (
                  <span className="text-cyan-100/60">{copy.recentPairsEmpty}</span>
                )}
                {validRecentPairs.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyRecentPairsBundle();
                      }}
                      className="rounded-full border border-cyan-200/15 px-2.5 py-1 text-[11px] font-medium text-cyan-100/80 transition hover:bg-cyan-200/10"
                    >
                      {copyFeedback === "success" ? copy.recentPairsBundleCopied : copy.copyRecentPairsBundle}
                    </button>
                    <button
                      type="button"
                      onClick={() => state.clearRecentPairs()}
                      className="rounded-full border border-cyan-200/15 px-2.5 py-1 text-[11px] font-medium text-cyan-100/80 transition hover:bg-cyan-200/10"
                    >
                      {copy.recentPairsClearAll}
                    </button>
                  </>
                ) : null}
              </div>
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
            quickRecoveryTerms={QUICK_FILTERS}
            onApplyQuickRecoveryTerm={(term) => {
              setSearchQuery(term);
              setMediumFilter("All");
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            }}
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
          <BridgePanel
            state={state}
            onCopyLink={handleCopySelectionLink}
            onOpenLink={handleOpenSelectionLink}
            onCopyPrompt={handleCopyPrompt}
            copyFeedback={copyFeedback}
            promptCopyFeedback={promptCopyFeedback}
          />
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

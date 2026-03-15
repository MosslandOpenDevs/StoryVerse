"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, CircleHelp, Copy, ExternalLink, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketingSection = {
  id: string;
  label: string;
  hint: string;
};

type SectionMatchMeta = {
  section: MarketingSection;
  matchedFields: string[];
};

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenizeSearchText(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function buildSectionAliases(section: MarketingSection) {
  const labelTokens = tokenizeSearchText(section.label);
  const idTokens = tokenizeSearchText(section.id);
  const hintTokens = tokenizeSearchText(section.hint);
  const acronym = labelTokens.map((token) => token[0]).join("");

  return Array.from(new Set([
    section.label,
    section.id,
    section.hint,
    labelTokens.join(" "),
    idTokens.join(" "),
    idTokens.join(""),
    hintTokens.join(" "),
    acronym,
  ].filter(Boolean)));
}

function includesAllSearchTokens(haystacks: string[], searchTokens: string[]) {
  if (searchTokens.length === 0) {
    return false;
  }

  return searchTokens.every((token) => haystacks.some((haystack) => haystack.includes(token)));
}

const LAST_ACTIVE_MARKETING_SECTION_STORAGE_KEY = "storyverse-last-marketing-section";
const RECENT_MARKETING_SECTION_TRAIL_STORAGE_KEY = "storyverse-recent-marketing-sections";
const PINNED_MARKETING_SECTION_STORAGE_KEY = "storyverse-pinned-marketing-sections";
const MARKETING_SHORTCUT_GUIDE_STORAGE_KEY = "storyverse-marketing-shortcut-guide";
const MARKETING_FILTER_QUERY_STORAGE_KEY = "storyverse-marketing-filter-query";
const MARKETING_FILTER_QUERY_PARAM = "nav";
const MAX_RECENT_MARKETING_SECTION_TRAIL = 3;
const MAX_PINNED_MARKETING_SECTIONS = 4;

const SECTIONS: MarketingSection[] = [
  { id: "hero", label: "Hero", hint: "Top overview" },
  { id: "how-it-works", label: "How it works", hint: "3-step flow" },
  { id: "story-catalog", label: "Catalog", hint: "Browse stories" },
  { id: "launch-storyverse", label: "Launch", hint: "Jump into universe" },
];

function getSectionByShortcutKey(shortcutKey: string) {
  const shortcutIndex = Number.parseInt(shortcutKey, 10) - 1;
  if (Number.isNaN(shortcutIndex) || shortcutIndex < 0 || shortcutIndex >= SECTIONS.length) {
    return null;
  }

  return SECTIONS[shortcutIndex] ?? null;
}

function getSectionMatchMeta(section: MarketingSection, normalizedSearchQuery: string): SectionMatchMeta | null {
  if (!normalizedSearchQuery) {
    return { section, matchedFields: [] };
  }

  const searchTokens = tokenizeSearchText(normalizedSearchQuery);
  const normalizedLabel = normalizeSearchText(section.label);
  const normalizedId = normalizeSearchText(section.id);
  const normalizedHint = normalizeSearchText(section.hint);
  const normalizedAliases = buildSectionAliases(section).map((alias) => normalizeSearchText(alias));
  const matchedFields: string[] = [];

  if (normalizedLabel.includes(normalizedSearchQuery) || includesAllSearchTokens([normalizedLabel], searchTokens)) {
    matchedFields.push("label");
  }
  if (normalizedId.includes(normalizedSearchQuery) || includesAllSearchTokens([normalizedId], searchTokens)) {
    matchedFields.push("section id");
  }
  if (normalizedHint.includes(normalizedSearchQuery) || includesAllSearchTokens([normalizedHint], searchTokens)) {
    matchedFields.push("hint");
  }
  if (includesAllSearchTokens(normalizedAliases, searchTokens)) {
    matchedFields.push("aliases");
  }

  return matchedFields.length > 0 ? { section, matchedFields: Array.from(new Set(matchedFields)) } : null;
}

function buildAnchorUrl(anchorId: string) {
  if (typeof window === "undefined") {
    return `#${anchorId}`;
  }

  const url = new URL(window.location.href);
  url.hash = anchorId;
  return url.toString();
}

function jumpToSection(anchorId: string) {
  const section = document.getElementById(anchorId);
  if (!section) return false;

  section.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${anchorId}`);
  window.setTimeout(() => {
    section.focus({ preventScroll: true });
  }, 220);

  return true;
}

function openSectionLink(anchorId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  window.open(buildAnchorUrl(anchorId), "_blank", "noopener,noreferrer");
  return true;
}

async function copySectionLink(anchorId: string) {
  await navigator.clipboard.writeText(buildAnchorUrl(anchorId));
}

async function copyFilteredViewLink(query: string, anchorId?: string | null) {
  if (typeof window === "undefined") {
    const normalizedQuery = query.trim();
    const search = normalizedQuery ? `?${MARKETING_FILTER_QUERY_PARAM}=${encodeURIComponent(normalizedQuery)}` : "";
    const hash = anchorId ? `#${anchorId}` : "";
    await Promise.resolve();
    return `${search}${hash}` || "#";
  }

  const url = new URL(window.location.href);
  const normalizedQuery = query.trim();

  if (normalizedQuery) {
    url.searchParams.set(MARKETING_FILTER_QUERY_PARAM, normalizedQuery);
  } else {
    url.searchParams.delete(MARKETING_FILTER_QUERY_PARAM);
  }

  url.hash = anchorId ?? "";
  await navigator.clipboard.writeText(url.toString());
  return url.toString();
}

async function copyShortcutGuide() {
  const lines = [
    "StoryVerse landing quick-nav",
    "",
    "? → Open or close the shortcuts guide",
    "1-4 → Jump directly to Hero, How it works, Catalog, or Launch",
    "[ / ] → Move to previous or next section",
    "J / K → Vim-style previous or next section jump",
    "Home / End → Jump to the first or last section",
    "/ → Focus the section filter",
    "↑ / ↓ → Move through filtered matches",
    "Enter → Jump to the selected filtered match",
    "Cmd/Ctrl+Enter → Open the selected filtered match in a new tab",
    "Alt+Enter → Copy the selected filtered match link",
    "Esc → Clear the filter or close the guide",
    "C → Copy the direct link for the current section",
    "O → Open the direct link for the current section in a new tab",
    "B → Copy the reusable navigation bundle",
    "R → Resume the last saved section",
    "Shift+R → Reset saved nav state (pins, trail, last stop, filter)",
    "F → Pin or unpin the current section",
    "5-8 → Jump to pinned sections",
    "9 → Jump to the latest recent-trail section",
    "Copy filtered view → Copy the current nav-filtered URL with the selected or active section",
    "Shift+L (while filter is focused) → Copy the current filtered landing view link",
    "Shift+C (while filter is focused) → Copy the filtered result bundle",
    "Selected filter actions → Copy a previous/current/next route context bundle",
    "Shift+F (while filter is focused) → Pin or unpin all filtered matches",
    "Shift+P → Copy the pinned section bundle",
    "Shift+T → Copy the recent trail bundle",
    "",
    ...SECTIONS.map((section, index) => `${index + 1} → ${section.label} (${buildAnchorUrl(section.id)})`),
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

async function copyFilteredResultsBundle(query: string, sections: MarketingSection[]) {
  const lines = [
    "StoryVerse filtered landing quick-nav",
    "",
    `Filter query: ${query || "—"}`,
    `Match count: ${sections.length}`,
    "",
    ...(sections.length
      ? sections.map((section, index) => `${index + 1}. ${section.label} (${buildAnchorUrl(section.id)})`)
      : ["No matched sections."]),
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

async function copyRouteContextBundle({
  query,
  selectedSection,
  contextSections,
}: {
  query: string;
  selectedSection: MarketingSection;
  contextSections: MarketingSection[];
}) {
  const lines = [
    "StoryVerse filtered landing route context",
    "",
    `Filter query: ${query || "—"}`,
    `Selected section: ${selectedSection.label} (${buildAnchorUrl(selectedSection.id)})`,
    `Context count: ${contextSections.length}`,
    "",
    ...contextSections.map((section, index) => {
      const position = section.id === selectedSection.id
        ? "selected"
        : section.id === contextSections[0]?.id
          ? "previous"
          : section.id === contextSections[contextSections.length - 1]?.id
            ? "next"
            : "nearby";
      return `${index + 1}. ${section.label} [${position}] (${buildAnchorUrl(section.id)})`;
    }),
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

async function copyPinnedResultsBundle(sections: MarketingSection[]) {
  const lines = [
    "StoryVerse pinned landing quick-nav",
    "",
    `Pinned count: ${sections.length}`,
    "",
    ...(sections.length
      ? sections.map((section, index) => `${index + 1}. ${section.label} (${buildAnchorUrl(section.id)})`)
      : ["No pinned sections."]),
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

async function copyNavigationBundle({
  activeSection,
  resumeSection,
  pinnedSections,
  recentTrailSections,
}: {
  activeSection: MarketingSection | null;
  resumeSection: MarketingSection | null;
  pinnedSections: MarketingSection[];
  recentTrailSections: MarketingSection[];
}) {
  const lines = [
    "StoryVerse landing navigation bundle",
    "",
    `Current section: ${activeSection ? `${activeSection.label} (${buildAnchorUrl(activeSection.id)})` : "Top"}`,
    `Last stop: ${resumeSection ? `${resumeSection.label} (${buildAnchorUrl(resumeSection.id)})` : "—"}`,
    "",
    "Pinned sections:",
    ...(pinnedSections.length
      ? pinnedSections.map((section, index) => `${index + 1}. ${section.label} (${buildAnchorUrl(section.id)})`)
      : ["—"]),
    "",
    "Recent trail:",
    ...(recentTrailSections.length
      ? recentTrailSections.map((section, index) => `${index + 1}. ${section.label} (${buildAnchorUrl(section.id)})`)
      : ["—"]),
    "",
    "All direct jumps:",
    ...SECTIONS.map((section, index) => `${index + 1} → ${section.label} (${buildAnchorUrl(section.id)})`),
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

async function copyRecentTrailBundle(sections: MarketingSection[]) {
  const lines = [
    "StoryVerse recent landing quick-nav trail",
    "",
    `Recent count: ${sections.length}`,
    "",
    ...(sections.length
      ? sections.map((section, index) => `${index + 1}. ${section.label} (${buildAnchorUrl(section.id)})`)
      : ["No recent sections."]),
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

async function copyRescueBundle({
  query,
  activeSection,
  fallbackSections,
}: {
  query: string;
  activeSection: MarketingSection | null;
  fallbackSections: MarketingSection[];
}) {
  const lines = [
    "StoryVerse rescue landing quick-nav bundle",
    "",
    `Missed filter: ${query || "—"}`,
    `Current section: ${activeSection ? `${activeSection.label} (${buildAnchorUrl(activeSection.id)})` : "Top"}`,
    "",
    "Suggested recovery jumps:",
    ...(fallbackSections.length
      ? fallbackSections.map((section, index) => `${index + 1}. ${section.label} (${buildAnchorUrl(section.id)})`)
      : ["No recovery jumps saved yet."]),
  ];

  await navigator.clipboard.writeText(lines.join("\n"));
}

function loadRecentTrail() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const storedTrail = window.localStorage.getItem(RECENT_MARKETING_SECTION_TRAIL_STORAGE_KEY);
    if (!storedTrail) return [] as string[];

    const parsedTrail = JSON.parse(storedTrail);
    if (!Array.isArray(parsedTrail)) return [] as string[];

    return parsedTrail.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENT_MARKETING_SECTION_TRAIL);
  } catch {
    return [] as string[];
  }
}

function saveRecentTrail(sectionIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RECENT_MARKETING_SECTION_TRAIL_STORAGE_KEY,
      JSON.stringify(sectionIds.slice(0, MAX_RECENT_MARKETING_SECTION_TRAIL)),
    );
  } catch {
    // Ignore storage access issues.
  }
}

function loadPinnedSections() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const storedPinned = window.localStorage.getItem(PINNED_MARKETING_SECTION_STORAGE_KEY);
    if (!storedPinned) return [] as string[];

    const parsedPinned = JSON.parse(storedPinned);
    if (!Array.isArray(parsedPinned)) return [] as string[];

    return parsedPinned
      .filter((value): value is string => typeof value === "string")
      .slice(0, MAX_PINNED_MARKETING_SECTIONS);
  } catch {
    return [] as string[];
  }
}

function savePinnedSections(sectionIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PINNED_MARKETING_SECTION_STORAGE_KEY,
      JSON.stringify(sectionIds.slice(0, MAX_PINNED_MARKETING_SECTIONS)),
    );
  } catch {
    // Ignore storage access issues.
  }
}

function clearStoredLastStop() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LAST_ACTIVE_MARKETING_SECTION_STORAGE_KEY);
  } catch {
    // Ignore storage access issues.
  }
}

function clearStoredNavigationState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LAST_ACTIVE_MARKETING_SECTION_STORAGE_KEY);
    window.localStorage.removeItem(RECENT_MARKETING_SECTION_TRAIL_STORAGE_KEY);
    window.localStorage.removeItem(PINNED_MARKETING_SECTION_STORAGE_KEY);
    window.localStorage.removeItem(MARKETING_FILTER_QUERY_STORAGE_KEY);
  } catch {
    // Ignore storage access issues.
  }
}

function loadFilterQueryFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return new URL(window.location.href).searchParams.get(MARKETING_FILTER_QUERY_PARAM)?.trim() ?? "";
  } catch {
    return "";
  }
}

function saveFilterQueryToUrl(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(MARKETING_FILTER_QUERY_PARAM, value);
    } else {
      url.searchParams.delete(MARKETING_FILTER_QUERY_PARAM);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Ignore URL access issues.
  }
}

function loadStoredFilterQuery() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(MARKETING_FILTER_QUERY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveStoredFilterQuery(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(MARKETING_FILTER_QUERY_STORAGE_KEY, value);
      return;
    }

    window.localStorage.removeItem(MARKETING_FILTER_QUERY_STORAGE_KEY);
  } catch {
    // Ignore storage access issues.
  }
}

export function MarketingQuickNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? "hero");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [recentTrail, setRecentTrail] = useState<string[]>([]);
  const [pinnedSections, setPinnedSections] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [navigationBundleCopyState, setNavigationBundleCopyState] = useState<"idle" | "done" | "error">("idle");
  const [rescueBundleCopyState, setRescueBundleCopyState] = useState<"idle" | "done" | "error">("idle");
  const [shortcutGuideOpen, setShortcutGuideOpen] = useState(false);
  const [shortcutGuideCopyState, setShortcutGuideCopyState] = useState<"idle" | "done" | "error">("idle");
  const [filteredResultsCopyState, setFilteredResultsCopyState] = useState<"idle" | "done" | "error">("idle");
  const [filteredViewLinkCopyState, setFilteredViewLinkCopyState] = useState<"idle" | "done" | "error">("idle");
  const [pinnedResultsCopyState, setPinnedResultsCopyState] = useState<"idle" | "done" | "error">("idle");
  const [recentTrailCopyState, setRecentTrailCopyState] = useState<"idle" | "done" | "error">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const [selectedFilteredIndex, setSelectedFilteredIndex] = useState(0);
  const [showAllFilteredResults, setShowAllFilteredResults] = useState(false);
  const clearCopyStateTimeoutRef = useRef<number | null>(null);
  const clearNavigationBundleCopyStateTimeoutRef = useRef<number | null>(null);
  const clearRescueBundleCopyStateTimeoutRef = useRef<number | null>(null);
  const clearShortcutGuideCopyStateTimeoutRef = useRef<number | null>(null);
  const clearFilteredResultsCopyStateTimeoutRef = useRef<number | null>(null);
  const clearFilteredViewLinkCopyStateTimeoutRef = useRef<number | null>(null);
  const clearPinnedResultsCopyStateTimeoutRef = useRef<number | null>(null);
  const clearRecentTrailCopyStateTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const shortcutGuidePanelRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = useMemo(() => SECTIONS.findIndex((section) => section.id === activeId), [activeId]);
  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === activeId) ?? SECTIONS[0] ?? { id: "hero", label: "Hero", hint: "Top overview" },
    [activeId],
  );
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const filteredSectionMatches = useMemo(() => {
    if (!normalizedSearchQuery) {
      return SECTIONS.map((section) => ({ section, matchedFields: [] }));
    }

    return SECTIONS.map((section) => getSectionMatchMeta(section, normalizedSearchQuery)).filter(
      (match): match is SectionMatchMeta => Boolean(match),
    );
  }, [normalizedSearchQuery]);
  const filteredSections = filteredSectionMatches.map((match) => match.section);
  const selectedFilteredSection = filteredSections[Math.min(selectedFilteredIndex, Math.max(filteredSections.length - 1, 0))] ?? null;
  const selectedFilteredMatch = filteredSectionMatches[Math.min(selectedFilteredIndex, Math.max(filteredSectionMatches.length - 1, 0))] ?? null;
  const visibleFilteredMatches = (showAllFilteredResults ? filteredSectionMatches : filteredSectionMatches.slice(0, 5)).map((match) => ({
    match,
    index: filteredSectionMatches.findIndex((itemMatch) => itemMatch.section.id === match.section.id),
  }));
  const activeHashLabel = `#${activeSection.id}`;
  const activePositionLabel = activeIndex >= 0 ? `${activeIndex + 1}/${SECTIONS.length}` : `1/${SECTIONS.length}`;
  const canJumpPrev = activeIndex > 0;
  const canJumpNext = activeIndex >= 0 && activeIndex < SECTIONS.length - 1;
  const progressPercent = SECTIONS.length > 1 && activeIndex >= 0 ? Math.round((activeIndex / (SECTIONS.length - 1)) * 100) : 100;
  const previousSection = canJumpPrev ? SECTIONS[Math.max(0, activeIndex - 1)] ?? null : null;
  const nextSection = canJumpNext ? SECTIONS[Math.min(SECTIONS.length - 1, activeIndex + 1)] ?? null : null;
  const recentTrailSections = recentTrail
    .filter((sectionId) => sectionId !== activeSection.id)
    .map((sectionId) => SECTIONS.find((section) => section.id === sectionId) ?? null)
    .filter((section): section is MarketingSection => Boolean(section));
  const resumeSection = useMemo(
    () => (resumeId ? SECTIONS.find((section) => section.id === resumeId) ?? null : null),
    [resumeId],
  );
  const showResumeButton = Boolean(resumeSection) && resumeSection?.id !== activeSection.id;

  useEffect(() => {
    setSelectedFilteredIndex(0);
    setShowAllFilteredResults(false);
  }, [normalizedSearchQuery]);

  useEffect(() => {
    if (!filteredSections.length) {
      setSelectedFilteredIndex(0);
      return;
    }

    setSelectedFilteredIndex((current) => Math.min(current, filteredSections.length - 1));
  }, [filteredSections]);

  useEffect(() => {
    const sections = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (section): section is HTMLElement => Boolean(section),
    );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const nextActiveId = visibleEntries[0]?.target.id;
        if (!nextActiveId) return;
        setActiveId((current) => (current === nextActiveId ? current : nextActiveId));
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    setRecentTrail(loadRecentTrail().filter((sectionId) => SECTIONS.some((section) => section.id === sectionId)));
    setPinnedSections(loadPinnedSections().filter((sectionId) => SECTIONS.some((section) => section.id === sectionId)));

    try {
      setShortcutGuideOpen(window.localStorage.getItem(MARKETING_SHORTCUT_GUIDE_STORAGE_KEY) === "open");
    } catch {
      // Ignore storage access issues.
    }

    const urlFilterQuery = loadFilterQueryFromUrl();
    const storedFilterQuery = loadStoredFilterQuery().trim();
    const initialFilterQuery = urlFilterQuery || storedFilterQuery;
    if (initialFilterQuery) {
      setSearchQuery((current) => current || initialFilterQuery);
    }

    const hashId = window.location.hash.replace(/^#/, "");
    if (hashId && SECTIONS.some((section) => section.id === hashId)) {
      setActiveId(hashId);
      setResumeId(hashId);
      return () => observer.disconnect();
    }

    try {
      const storedId = window.localStorage.getItem(LAST_ACTIVE_MARKETING_SECTION_STORAGE_KEY);
      if (storedId && SECTIONS.some((section) => section.id === storedId)) {
        setResumeId(storedId);
        setActiveId((current) => current || storedId);
      }
    } catch {
      // Ignore storage access issues.
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const hashId = window.location.hash.replace(/^#/, "");
      if (!hashId || !SECTIONS.some((section) => section.id === hashId)) return;
      setActiveId(hashId);
      setResumeId(hashId);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;

    try {
      window.localStorage.setItem(LAST_ACTIVE_MARKETING_SECTION_STORAGE_KEY, activeId);
      setResumeId(activeId);
    } catch {
      // Ignore storage access issues.
    }

    setRecentTrail((current) => {
      const nextTrail = [activeId, ...current.filter((sectionId) => sectionId !== activeId)].slice(0, MAX_RECENT_MARKETING_SECTION_TRAIL);
      saveRecentTrail(nextTrail);
      return nextTrail;
    });
  }, [activeId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MARKETING_SHORTCUT_GUIDE_STORAGE_KEY, shortcutGuideOpen ? "open" : "closed");
    } catch {
      // Ignore storage access issues.
    }
  }, [shortcutGuideOpen]);

  useEffect(() => {
    const normalizedFilterQuery = searchQuery.trim();
    saveStoredFilterQuery(normalizedFilterQuery);
    saveFilterQueryToUrl(normalizedFilterQuery);
  }, [searchQuery]);

  const togglePinnedSection = useCallback((sectionId: string) => {
    setPinnedSections((current) => {
      const nextPinned = current.includes(sectionId)
        ? current.filter((value) => value !== sectionId)
        : [sectionId, ...current.filter((value) => value !== sectionId)].slice(0, MAX_PINNED_MARKETING_SECTIONS);
      savePinnedSections(nextPinned);
      return nextPinned;
    });
  }, []);

  useEffect(() => {
    if (copyState === "idle") return;

    if (clearCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearCopyStateTimeoutRef.current);
    }

    clearCopyStateTimeoutRef.current = window.setTimeout(() => setCopyState("idle"), copyState === "done" ? 1600 : 2200);

    return () => {
      if (clearCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearCopyStateTimeoutRef.current);
      }
    };
  }, [copyState]);

  useEffect(() => {
    if (navigationBundleCopyState === "idle") return;

    if (clearNavigationBundleCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearNavigationBundleCopyStateTimeoutRef.current);
    }

    clearNavigationBundleCopyStateTimeoutRef.current = window.setTimeout(
      () => setNavigationBundleCopyState("idle"),
      navigationBundleCopyState === "done" ? 1800 : 2200,
    );

    return () => {
      if (clearNavigationBundleCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearNavigationBundleCopyStateTimeoutRef.current);
      }
    };
  }, [navigationBundleCopyState]);

  useEffect(() => {
    if (rescueBundleCopyState === "idle") return;

    if (clearRescueBundleCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearRescueBundleCopyStateTimeoutRef.current);
    }

    clearRescueBundleCopyStateTimeoutRef.current = window.setTimeout(
      () => setRescueBundleCopyState("idle"),
      rescueBundleCopyState === "done" ? 1800 : 2200,
    );

    return () => {
      if (clearRescueBundleCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearRescueBundleCopyStateTimeoutRef.current);
      }
    };
  }, [rescueBundleCopyState]);

  useEffect(() => {
    if (shortcutGuideCopyState === "idle") return;

    if (clearShortcutGuideCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearShortcutGuideCopyStateTimeoutRef.current);
    }

    clearShortcutGuideCopyStateTimeoutRef.current = window.setTimeout(
      () => setShortcutGuideCopyState("idle"),
      shortcutGuideCopyState === "done" ? 1800 : 2200,
    );

    return () => {
      if (clearShortcutGuideCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearShortcutGuideCopyStateTimeoutRef.current);
      }
    };
  }, [shortcutGuideCopyState]);

  useEffect(() => {
    if (filteredResultsCopyState === "idle") return;

    if (clearFilteredResultsCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearFilteredResultsCopyStateTimeoutRef.current);
    }

    clearFilteredResultsCopyStateTimeoutRef.current = window.setTimeout(
      () => setFilteredResultsCopyState("idle"),
      filteredResultsCopyState === "done" ? 1600 : 2200,
    );

    return () => {
      if (clearFilteredResultsCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearFilteredResultsCopyStateTimeoutRef.current);
      }
    };
  }, [filteredResultsCopyState]);

  useEffect(() => {
    if (filteredViewLinkCopyState === "idle") return;

    if (clearFilteredViewLinkCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearFilteredViewLinkCopyStateTimeoutRef.current);
    }

    clearFilteredViewLinkCopyStateTimeoutRef.current = window.setTimeout(
      () => setFilteredViewLinkCopyState("idle"),
      filteredViewLinkCopyState === "done" ? 1600 : 2200,
    );

    return () => {
      if (clearFilteredViewLinkCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearFilteredViewLinkCopyStateTimeoutRef.current);
      }
    };
  }, [filteredViewLinkCopyState]);

  useEffect(() => {
    if (pinnedResultsCopyState === "idle") return;

    if (clearPinnedResultsCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearPinnedResultsCopyStateTimeoutRef.current);
    }

    clearPinnedResultsCopyStateTimeoutRef.current = window.setTimeout(
      () => setPinnedResultsCopyState("idle"),
      pinnedResultsCopyState === "done" ? 1600 : 2200,
    );

    return () => {
      if (clearPinnedResultsCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearPinnedResultsCopyStateTimeoutRef.current);
      }
    };
  }, [pinnedResultsCopyState]);

  useEffect(() => {
    if (recentTrailCopyState === "idle") return;

    if (clearRecentTrailCopyStateTimeoutRef.current !== null) {
      window.clearTimeout(clearRecentTrailCopyStateTimeoutRef.current);
    }

    clearRecentTrailCopyStateTimeoutRef.current = window.setTimeout(
      () => setRecentTrailCopyState("idle"),
      recentTrailCopyState === "done" ? 1600 : 2200,
    );

    return () => {
      if (clearRecentTrailCopyStateTimeoutRef.current !== null) {
        window.clearTimeout(clearRecentTrailCopyStateTimeoutRef.current);
      }
    };
  }, [recentTrailCopyState]);

  useEffect(() => {
    if (!shortcutGuideOpen) return;

    shortcutGuidePanelRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!shortcutGuidePanelRef.current) return;
      if (shortcutGuidePanelRef.current.contains(event.target as Node)) return;
      setShortcutGuideOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [shortcutGuideOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget =
        target?.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT";

      const isSearchFocused = document.activeElement === searchInputRef.current;

      if ((event.key === "?" || (event.key === "/" && event.shiftKey)) && !event.altKey && !event.metaKey && !event.ctrlKey && !isTypingTarget) {
        event.preventDefault();
        setShortcutGuideOpen((current) => !current);
        return;
      }

      if (event.key === "/" && !event.altKey && !event.shiftKey && (!isTypingTarget || isSearchFocused)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === "Escape" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        if (shortcutGuideOpen) {
          event.preventDefault();
          setShortcutGuideOpen(false);
          return;
        }

        if (document.activeElement === searchInputRef.current || searchQuery) {
          event.preventDefault();
          setSearchQuery("");
          setSelectedFilteredIndex(0);
          searchInputRef.current?.blur();
        }
        return;
      }

      if (isSearchFocused && filteredSections.length > 0) {
        if (event.shiftKey && event.key.toLowerCase() === "f") {
          event.preventDefault();
          const everyFilteredSectionPinned = filteredSections.every((section) => pinnedSections.includes(section.id));
          const nextPinnedSections = everyFilteredSectionPinned
            ? pinnedSections.filter((sectionId) => !filteredSections.some((section) => section.id === sectionId))
            : [
                ...filteredSections.map((section) => section.id),
                ...pinnedSections.filter((sectionId) => !filteredSections.some((section) => section.id === sectionId)),
              ].slice(0, MAX_PINNED_MARKETING_SECTIONS);
          savePinnedSections(nextPinnedSections);
          setPinnedSections(nextPinnedSections);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedFilteredIndex((current) => (current + 1) % filteredSections.length);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelectedFilteredIndex((current) => (current - 1 + filteredSections.length) % filteredSections.length);
          return;
        }

        if (event.key === "Enter" && event.metaKey && selectedFilteredSection) {
          event.preventDefault();
          openSectionLink(selectedFilteredSection.id);
          return;
        }

        if (event.key === "Enter" && event.ctrlKey && selectedFilteredSection) {
          event.preventDefault();
          openSectionLink(selectedFilteredSection.id);
          return;
        }

        if (event.key === "Enter" && event.altKey && selectedFilteredSection) {
          event.preventDefault();
          copySectionLink(selectedFilteredSection.id)
            .then(() => setCopyState("done"))
            .catch(() => setCopyState("error"));
          return;
        }

        if (event.shiftKey && event.key.toLowerCase() === "c") {
          event.preventDefault();
          copyFilteredResultsBundle(searchQuery.trim(), filteredSections)
            .then(() => setFilteredResultsCopyState("done"))
            .catch(() => setFilteredResultsCopyState("error"));
          return;
        }

        if (event.shiftKey && event.key.toLowerCase() === "l") {
          event.preventDefault();
          copyFilteredViewLink(searchQuery.trim(), selectedFilteredSection?.id ?? activeSection.id)
            .then(() => setFilteredViewLinkCopyState("done"))
            .catch(() => setFilteredViewLinkCopyState("error"));
          return;
        }
      }

      if (event.shiftKey && event.key.toLowerCase() === "p") {
        if (!pinnedSections.length) {
          return;
        }

        const pinnedSectionsForCopy = pinnedSections
          .map((sectionId) => SECTIONS.find((section) => section.id === sectionId) ?? null)
          .filter((section): section is MarketingSection => Boolean(section));
        if (!pinnedSectionsForCopy.length) {
          return;
        }

        event.preventDefault();
        copyPinnedResultsBundle(pinnedSectionsForCopy)
          .then(() => setPinnedResultsCopyState("done"))
          .catch(() => setPinnedResultsCopyState("error"));
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "t") {
        if (!recentTrailSections.length) {
          return;
        }

        event.preventDefault();
        copyRecentTrailBundle(recentTrailSections)
          .then(() => setRecentTrailCopyState("done"))
          .catch(() => setRecentTrailCopyState("error"));
        return;
      }

      if (isTypingTarget || event.metaKey || event.ctrlKey) {
        return;
      }

      if (isSearchFocused && event.key === "Enter" && selectedFilteredSection) {
        event.preventDefault();
        if (!jumpToSection(selectedFilteredSection.id)) return;
        setActiveId(selectedFilteredSection.id);
        return;
      }

      if (event.key === "[" || event.key.toLowerCase() === "k") {
        event.preventDefault();
        const previousSection = SECTIONS[Math.max(0, activeIndex - 1)];
        if (!previousSection || !canJumpPrev || !jumpToSection(previousSection.id)) return;
        setActiveId(previousSection.id);
        return;
      }

      if (event.key === "]" || event.key.toLowerCase() === "j") {
        event.preventDefault();
        const nextSection = SECTIONS[Math.min(SECTIONS.length - 1, activeIndex + 1)];
        if (!nextSection || !canJumpNext || !jumpToSection(nextSection.id)) return;
        setActiveId(nextSection.id);
        return;
      }

      const shortcutSection = getSectionByShortcutKey(event.key);
      if (shortcutSection) {
        event.preventDefault();
        if (!jumpToSection(shortcutSection.id)) return;
        setActiveId(shortcutSection.id);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        const firstSection = SECTIONS[0];
        if (!firstSection || !jumpToSection(firstSection.id)) return;
        setActiveId(firstSection.id);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        const lastSection = SECTIONS[SECTIONS.length - 1];
        if (!lastSection || !jumpToSection(lastSection.id)) return;
        setActiveId(lastSection.id);
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        copySectionLink(activeSection.id)
          .then(() => setCopyState("done"))
          .catch(() => setCopyState("error"));
        return;
      }

      if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        openSectionLink(activeSection.id);
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        const pinnedSectionItemsForBundle = pinnedSections
          .map((sectionId) => SECTIONS.find((section) => section.id === sectionId) ?? null)
          .filter((section): section is MarketingSection => Boolean(section));
        copyNavigationBundle({
          activeSection,
          resumeSection,
          pinnedSections: pinnedSectionItemsForBundle,
          recentTrailSections,
        })
          .then(() => setNavigationBundleCopyState("done"))
          .catch(() => setNavigationBundleCopyState("error"));
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetNavigationState();
        return;
      }

      if (event.key.toLowerCase() === "r" && resumeId) {
        event.preventDefault();
        if (!jumpToSection(resumeId)) return;
        setActiveId(resumeId);
        return;
      }

      if (/^[5-8]$/.test(event.key)) {
        const pinnedIndex = Number(event.key) - 5;
        const pinnedSectionId = pinnedSections[pinnedIndex] ?? null;
        const pinnedSection = pinnedSectionId ? SECTIONS.find((section) => section.id === pinnedSectionId) ?? null : null;
        if (!pinnedSection) return;

        event.preventDefault();
        if (!jumpToSection(pinnedSection.id)) return;
        setActiveId(pinnedSection.id);
        return;
      }

      if (event.key === "9") {
        const recentSectionId = recentTrail.find((sectionId) => sectionId !== activeSection.id) ?? null;
        const recentSection = recentSectionId ? SECTIONS.find((section) => section.id === recentSectionId) ?? null : null;
        if (!recentSection) return;

        event.preventDefault();
        if (!jumpToSection(recentSection.id)) return;
        setActiveId(recentSection.id);
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        togglePinnedSection(activeSection.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, activeSection, canJumpNext, canJumpPrev, filteredSections, pinnedSections, recentTrail, recentTrailSections, resumeId, resumeSection, searchQuery, selectedFilteredSection, shortcutGuideOpen, togglePinnedSection]);

  const pinnedSectionItems = pinnedSections
    .map((sectionId) => SECTIONS.find((section) => section.id === sectionId) ?? null)
    .filter((section): section is MarketingSection => Boolean(section));
  const selectedFilteredRouteContextSections = selectedFilteredSection
    ? filteredSections.slice(
        Math.max(0, selectedFilteredIndex - 1),
        Math.min(filteredSections.length, selectedFilteredIndex + 2),
      )
    : [];
  const selectedFilteredPrevSection = selectedFilteredSection && selectedFilteredIndex > 0
    ? filteredSections[selectedFilteredIndex - 1] ?? null
    : null;
  const selectedFilteredNextSection = selectedFilteredSection && selectedFilteredIndex < filteredSections.length - 1
    ? filteredSections[selectedFilteredIndex + 1] ?? null
    : null;
  const everyFilteredSectionPinned = filteredSections.length > 0 && filteredSections.every((section) => pinnedSections.includes(section.id));
  const filteredPinPreview = Array.from(new Set([
    selectedFilteredSection?.id ?? null,
    ...filteredSections.map((section) => section.id),
    ...pinnedSections.filter((sectionId) => !filteredSections.some((section) => section.id === sectionId)),
  ].filter((sectionId): sectionId is string => Boolean(sectionId)))).slice(0, MAX_PINNED_MARKETING_SECTIONS);
  const willTrimFilteredPins = !everyFilteredSectionPinned && filteredSections.length > MAX_PINNED_MARKETING_SECTIONS;
  const fallbackSections = Array.from(new Map(
    [activeSection, resumeSection, ...pinnedSectionItems, ...recentTrailSections]
      .filter((section): section is MarketingSection => Boolean(section))
      .map((section) => [section.id, section]),
  ).values()).slice(0, 4);
  const isActiveSectionPinned = pinnedSections.includes(activeSection.id);

  function resetNavigationState() {
    clearStoredNavigationState();
    setResumeId(null);
    setPinnedSections([]);
    setRecentTrail([]);
    setSearchQuery("");
    setSelectedFilteredIndex(0);
    setShowAllFilteredResults(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      const firstSection = SECTIONS[0];
      if (!firstSection) return;
      setActiveId(firstSection.id);
      document.getElementById(firstSection.id)?.focus({ preventScroll: true });
    }, 220);
  }

  return (
    <div className="sticky top-16 z-40 px-6 pb-2">
      <div className="mx-auto max-w-5xl rounded-2xl border border-cosmos-200/10 bg-cosmos-950/70 px-4 py-3 shadow-[0_0_30px_rgba(2,6,23,0.35)] backdrop-blur-xl">
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-cosmos-900/80" aria-hidden="true">
          <div
            className="h-full rounded-full bg-neon-cyan transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cosmos-200/65">
            <Sparkles className="h-4 w-4 text-neon-cyan" />
            Landing quick nav
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!canJumpPrev) return;
                const previousSection = SECTIONS[Math.max(0, activeIndex - 1)];
                if (!previousSection || !jumpToSection(previousSection.id)) return;
                setActiveId(previousSection.id);
              }}
              disabled={!canJumpPrev}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                canJumpPrev
                  ? "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100"
                  : "cursor-not-allowed border-cosmos-200/10 bg-cosmos-900/40 text-cosmos-200/35",
              )}
              aria-label="Jump to previous section"
              title="Jump to previous section"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            {showResumeButton && resumeSection ? (
              <button
                type="button"
                onClick={() => {
                  if (!jumpToSection(resumeSection.id)) return;
                  setActiveId(resumeSection.id);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-cosmos-100 transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/14"
                title={`Resume ${resumeSection.label}`}
              >
                Resume {resumeSection.label}
              </button>
            ) : null}

            {SECTIONS.map((section) => {
              const isActive = section.id === activeSection?.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    if (!jumpToSection(section.id)) return;
                    setActiveId(section.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "border-neon-cyan/60 bg-neon-cyan/12 text-cosmos-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                      : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/70 hover:border-neon-cyan/35 hover:text-cosmos-100",
                  )}
                  aria-pressed={isActive}
                  title={`${section.label} · ${section.hint} · press ${SECTIONS.findIndex((candidate) => candidate.id === section.id) + 1}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current/20 px-1 text-[10px] font-semibold leading-none text-cosmos-200/55">
                      {SECTIONS.findIndex((candidate) => candidate.id === section.id) + 1}
                    </span>
                    <span>{section.label}</span>
                  </span>
                  <span className="hidden text-[10px] text-cosmos-200/45 sm:inline">{section.hint}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                if (!canJumpNext) return;
                const nextSection = SECTIONS[Math.min(SECTIONS.length - 1, activeIndex + 1)];
                if (!nextSection || !jumpToSection(nextSection.id)) return;
                setActiveId(nextSection.id);
              }}
              disabled={!canJumpNext}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                canJumpNext
                  ? "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100"
                  : "cursor-not-allowed border-cosmos-200/10 bg-cosmos-900/40 text-cosmos-200/35",
              )}
              aria-label="Jump to next section"
              title="Jump to next section"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span
              className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70"
              title={`Section ${activePositionLabel}`}
            >
              {activePositionLabel}
            </span>

            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70">
              Progress {progressPercent}%
            </span>

            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70">
              {activeHashLabel}
            </span>

            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55 sm:hidden">
              ? for shortcuts
            </span>

            <span className="hidden items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55 sm:inline-flex">
              1-4 / [ ] / J K / Home / End / / / B / C / O / R / F / ?
            </span>

            <button
              type="button"
              onClick={() => setShortcutGuideOpen((current) => !current)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                shortcutGuideOpen
                  ? "border-neon-cyan/50 bg-neon-cyan/12 text-cosmos-100"
                  : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100",
              )}
              title="Show landing shortcuts guide"
              aria-expanded={shortcutGuideOpen}
            >
              <CircleHelp className="h-3.5 w-3.5" />
              {shortcutGuideOpen ? "Hide help" : "Shortcuts"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetNavigationState();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
              title="Reset saved landing navigation state"
            >
              Reset nav state
            </button>

            <button
              type="button"
              onClick={() => {
                togglePinnedSection(activeSection.id);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActiveSectionPinned
                  ? "border-neon-cyan/50 bg-neon-cyan/12 text-cosmos-100"
                  : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100",
              )}
              title={`${isActiveSectionPinned ? "Unpin" : "Pin"} ${activeSection.label}`}
            >
              {isActiveSectionPinned ? "Pinned" : "Pin current"}
            </button>

            <button
              type="button"
              onClick={() => {
                openSectionLink(activeSection.id);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
              title={`Open ${activeSection.label} in a new tab`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>

            <button
              type="button"
              onClick={() => {
                copyNavigationBundle({
                  activeSection,
                  resumeSection,
                  pinnedSections: pinnedSectionItems,
                  recentTrailSections,
                })
                  .then(() => setNavigationBundleCopyState("done"))
                  .catch(() => setNavigationBundleCopyState("error"));
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
              title="Copy reusable navigation bundle"
            >
              {navigationBundleCopyState === "done"
                ? "Bundle copied"
                : navigationBundleCopyState === "error"
                  ? "Copy failed"
                  : "Copy navigation bundle"}
            </button>

            <button
              type="button"
              onClick={() => {
                copySectionLink(activeSection.id)
                  .then(() => setCopyState("done"))
                  .catch(() => setCopyState("error"));
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
              title={`Copy direct link to ${activeSection.label}`}
            >
              <Copy className="h-3.5 w-3.5" />
              {copyState === "done"
                ? "Link copied"
                : copyState === "error"
                  ? "Copy failed"
                  : `Copy ${activeSection.label}`}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cosmos-200/10 pt-3 text-xs text-cosmos-200/65">
          <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/70">
            Prev {previousSection?.label ?? "—"}
          </span>
          <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/70">
            Next {nextSection?.label ?? "—"}
          </span>
          <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/70">
            Last stop {resumeSection?.label ?? "—"}
          </span>
          {resumeSection ? (
            <>
              <button
                type="button"
                onClick={() => {
                  openSectionLink(resumeSection.id);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title={`Open last stop ${resumeSection.label}`}
              >
                Open last stop #{resumeSection.id}
              </button>
              <button
                type="button"
                onClick={() => {
                  copySectionLink(resumeSection.id)
                    .then(() => setCopyState("done"))
                    .catch(() => setCopyState("error"));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title={`Copy last stop ${resumeSection.label}`}
              >
                Copy last stop #{resumeSection.id}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearStoredLastStop();
                  setResumeId(null);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title={`Forget saved last stop ${resumeSection.label}`}
              >
                Forget last stop
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cosmos-200/10 pt-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cosmos-200/45" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onFocus={() => setIsSearchInputFocused(true)}
              onBlur={() => setIsSearchInputFocused(false)}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                if (event.key !== "Enter" || !selectedFilteredSection) {
                  return;
                }

                event.preventDefault();

                if (event.metaKey || event.ctrlKey) {
                  openSectionLink(selectedFilteredSection.id);
                  return;
                }

                if (event.altKey) {
                  copySectionLink(selectedFilteredSection.id)
                    .then(() => setCopyState("done"))
                    .catch(() => setCopyState("error"));
                  return;
                }

                if (!jumpToSection(selectedFilteredSection.id)) return;
                setActiveId(selectedFilteredSection.id);
              }}
              placeholder="Filter sections (/ to focus, ↑/↓ choose, Enter to jump, Esc to clear)"
              aria-label="Filter marketing sections"
              className="w-full rounded-full border border-cosmos-200/10 bg-cosmos-900/70 py-2 pl-9 pr-3 text-xs text-cosmos-100 outline-none transition-colors placeholder:text-cosmos-200/35 focus:border-neon-cyan/45"
            />
          </div>
          <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70">
            Matches {filteredSections.length}/{SECTIONS.length}
          </span>
          {normalizedSearchQuery ? (
            <>
              <button
                type="button"
                onClick={() => {
                  copyFilteredViewLink(searchQuery.trim(), selectedFilteredSection?.id ?? activeSection.id)
                    .then(() => setFilteredViewLinkCopyState("done"))
                    .catch(() => setFilteredViewLinkCopyState("error"));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title="Copy the current filtered landing view"
              >
                {filteredViewLinkCopyState === "done"
                  ? "View link copied"
                  : filteredViewLinkCopyState === "error"
                    ? "Copy failed"
                    : "Copy filtered view"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
              >
                Clear filter
              </button>
            </>
          ) : null}
        </div>

        {(isSearchInputFocused || normalizedSearchQuery) ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-cosmos-200/50">
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/60 px-2.5 py-1">↑/↓ choose</span>
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/60 px-2.5 py-1">Enter jump</span>
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/60 px-2.5 py-1">Cmd/Ctrl+Enter open</span>
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/60 px-2.5 py-1">Alt+Enter copy link</span>
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/60 px-2.5 py-1">Shift+L copy filtered view</span>
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/60 px-2.5 py-1">Shift+C copy matches</span>
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/60 px-2.5 py-1">Shift+F pin matches</span>
          </div>
        ) : null}

        {selectedFilteredSection && normalizedSearchQuery ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cosmos-200/10 pt-3">
            <span className="inline-flex items-center rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-cosmos-100">
              Selected {selectedFilteredIndex + 1}/{filteredSections.length} · {selectedFilteredSection.label}
              {selectedFilteredMatch?.matchedFields.length ? ` · via ${selectedFilteredMatch.matchedFields.join(", ")}` : ""}
            </span>
            <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
              {selectedFilteredSection.hint}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!jumpToSection(selectedFilteredSection.id)) return;
                setActiveId(selectedFilteredSection.id);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-cosmos-100 transition-colors hover:border-neon-cyan/60 hover:bg-neon-cyan/14"
            >
              Jump selected
            </button>
            <button
              type="button"
              onClick={() => {
                togglePinnedSection(selectedFilteredSection.id);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                pinnedSections.includes(selectedFilteredSection.id)
                  ? "border-neon-cyan/45 bg-neon-cyan/10 text-cosmos-100"
                  : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100",
              )}
              title={`${pinnedSections.includes(selectedFilteredSection.id) ? "Unpin" : "Pin"} ${selectedFilteredSection.label}`}
            >
              {pinnedSections.includes(selectedFilteredSection.id) ? "Unpin selected" : "Pin selected"}
            </button>
            <button
              type="button"
              onClick={() => {
                openSectionLink(selectedFilteredSection.id);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
            >
              Open #{selectedFilteredSection.id}
            </button>
            <button
              type="button"
              onClick={() => {
                copySectionLink(selectedFilteredSection.id)
                  .then(() => setCopyState("done"))
                  .catch(() => setCopyState("error"));
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
            >
              Copy #{selectedFilteredSection.id}
            </button>
            <button
              type="button"
              onClick={() => {
                const nextPinnedSections = everyFilteredSectionPinned
                  ? pinnedSections.filter((sectionId) => !filteredSections.some((section) => section.id === sectionId))
                  : [
                      ...filteredSections.map((section) => section.id),
                      ...pinnedSections.filter((sectionId) => !filteredSections.some((section) => section.id === sectionId)),
                    ].slice(0, MAX_PINNED_MARKETING_SECTIONS);
                savePinnedSections(nextPinnedSections);
                setPinnedSections(nextPinnedSections);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                everyFilteredSectionPinned
                  ? "border-neon-cyan/45 bg-neon-cyan/10 text-cosmos-100"
                  : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100",
              )}
              title={`${everyFilteredSectionPinned ? "Unpin" : "Pin"} ${filteredSections.length} filtered matches`}
            >
              {everyFilteredSectionPinned ? `Unpin ${filteredSections.length} matches` : `Pin ${filteredSections.length} matches`}
            </button>
            <button
              type="button"
              onClick={() => {
                copyFilteredResultsBundle(searchQuery.trim(), filteredSections)
                  .then(() => setFilteredResultsCopyState("done"))
                  .catch(() => setFilteredResultsCopyState("error"));
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
              title={`Copy filtered result bundle for ${filteredSections.length} matches`}
            >
              {filteredResultsCopyState === "done"
                ? `Copied ${filteredSections.length} matches`
                : filteredResultsCopyState === "error"
                  ? "Copy failed"
                  : `Copy ${filteredSections.length} matches`}
            </button>
            {selectedFilteredRouteContextSections.length > 1 ? (
              <>
                <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                  Route context
                  {selectedFilteredPrevSection ? ` · prev ${selectedFilteredPrevSection.label}` : ""}
                  {selectedFilteredNextSection ? ` · next ${selectedFilteredNextSection.label}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    copyRouteContextBundle({
                      query: searchQuery.trim(),
                      selectedSection: selectedFilteredSection,
                      contextSections: selectedFilteredRouteContextSections,
                    })
                      .then(() => setFilteredResultsCopyState("done"))
                      .catch(() => setFilteredResultsCopyState("error"));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                  title={`Copy route context for ${selectedFilteredSection.label}`}
                >
                  {filteredResultsCopyState === "done"
                    ? "Route copied"
                    : filteredResultsCopyState === "error"
                      ? "Route copy failed"
                      : "Copy route context"}
                </button>
                {selectedFilteredPrevSection ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!jumpToSection(selectedFilteredPrevSection.id)) return;
                      setActiveId(selectedFilteredPrevSection.id);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                    title={`Jump to the section before ${selectedFilteredSection.label}`}
                  >
                    Prev in route → {selectedFilteredPrevSection.label}
                  </button>
                ) : null}
                {selectedFilteredNextSection ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!jumpToSection(selectedFilteredNextSection.id)) return;
                      setActiveId(selectedFilteredNextSection.id);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                    title={`Jump to the section after ${selectedFilteredSection.label}`}
                  >
                    Next in route → {selectedFilteredNextSection.label}
                  </button>
                ) : null}
              </>
            ) : null}
            {!everyFilteredSectionPinned ? (
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                Pin preview {filteredPinPreview.length}/{MAX_PINNED_MARKETING_SECTIONS}
                {selectedFilteredSection ? ` · keeps ${selectedFilteredSection.label}` : ""}
                {willTrimFilteredPins ? " · first 4 only" : ""}
              </span>
            ) : null}
          </div>
        ) : null}

        {normalizedSearchQuery && filteredSectionMatches.length > 0 ? (
          <div className="mt-3 grid gap-2 border-t border-cosmos-200/10 pt-3">
            {visibleFilteredMatches.map(({ match, index }) => {
              const { section, matchedFields } = match;
              const isSelected = selectedFilteredSection?.id === section.id;
              const isActive = activeSection.id === section.id;
              const isPinned = pinnedSections.includes(section.id);

              return (
                <div
                  key={`filtered-${section.id}`}
                  className={cn(
                    "flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2",
                    isSelected
                      ? "border-neon-cyan/40 bg-neon-cyan/10"
                      : "border-cosmos-200/10 bg-cosmos-900/45",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFilteredIndex(index);
                      if (!jumpToSection(section.id)) return;
                      setActiveId(section.id);
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected || isActive
                        ? "border-neon-cyan/45 bg-neon-cyan/10 text-cosmos-100"
                        : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100",
                    )}
                  >
                    #{index + 1} {section.label}
                  </button>
                  <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70">
                    #{section.id}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                    {section.hint}
                  </span>
                  {matchedFields.map((field) => (
                    <span
                      key={`${section.id}-${field}`}
                      className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55"
                    >
                      match {field}
                    </span>
                  ))}
                  {isActive ? (
                    <span className="inline-flex items-center rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-cosmos-100">
                      live section
                    </span>
                  ) : null}
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFilteredIndex(index);
                        openSectionLink(section.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFilteredIndex(index);
                        togglePinnedSection(section.id);
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isPinned
                          ? "border-neon-cyan/45 bg-neon-cyan/10 text-cosmos-100"
                          : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100",
                      )}
                    >
                      {isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFilteredIndex(index);
                        copySectionLink(section.id)
                          .then(() => setCopyState("done"))
                          .catch(() => setCopyState("error"));
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredSectionMatches.length > 5 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-cosmos-200/50">
                <span>
                  {showAllFilteredResults
                    ? `Showing all ${filteredSectionMatches.length} matches. Use ↑ / ↓ to move through the full result set, then Enter to jump.`
                    : "Showing top 5 matches. Use ↑ / ↓ to move through the full result set, then Enter to jump."}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllFilteredResults((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                >
                  {showAllFilteredResults ? "Show top 5" : `Show all ${filteredSectionMatches.length}`}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {normalizedSearchQuery && filteredSectionMatches.length === 0 ? (
          <div className="mt-3 grid gap-3 border-t border-cosmos-200/10 pt-3 text-xs text-cosmos-200/55">
            <div>
              No sections match that filter yet. Try hero, catalog, launch, or section ids like story-catalog.
              {fallbackSections.length ? " You can also jump back into your live, pinned, or recent sections below." : ""}
            </div>
            {fallbackSections.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {fallbackSections.map((section) => {
                  const isLive = activeSection.id === section.id;
                  const isPinned = pinnedSections.includes(section.id);
                  const isResume = resumeSection?.id === section.id;
                  const isRecent = recentTrailSections.some((recentSection) => recentSection.id === section.id);
                  const badges = [
                    isLive ? "live" : null,
                    isPinned ? "pinned" : null,
                    isResume ? "last stop" : null,
                    isRecent ? "recent" : null,
                  ].filter(Boolean).join(" · ");

                  return (
                    <button
                      key={`rescue-${section.id}`}
                      type="button"
                      onClick={() => {
                        if (!jumpToSection(section.id)) return;
                        setActiveId(section.id);
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isLive
                          ? "border-neon-cyan/45 bg-neon-cyan/10 text-cosmos-100"
                          : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/75 hover:border-neon-cyan/35 hover:text-cosmos-100",
                      )}
                      title={`Jump to ${section.label}${badges ? ` · ${badges}` : ""}`}
                    >
                      Rescue → {section.label}
                      {badges ? <span className="text-cosmos-200/50">{badges}</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-cosmos-100 transition-colors hover:border-neon-cyan/60 hover:bg-neon-cyan/14"
                  title="Clear the empty filter and keep navigating"
                >
                  Clear filter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    copyRescueBundle({
                      query: searchQuery.trim(),
                      activeSection,
                      fallbackSections,
                    })
                      .then(() => setRescueBundleCopyState("done"))
                      .catch(() => setRescueBundleCopyState("error"));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                  title={`Copy rescue bundle for ${fallbackSections.length} fallback sections`}
                >
                  {rescueBundleCopyState === "done"
                    ? `Copied rescue bundle (${fallbackSections.length})`
                    : rescueBundleCopyState === "error"
                      ? "Copy failed"
                      : `Copy rescue bundle (${fallbackSections.length})`}
                </button>
              </div>
          </div>
        ) : null}

        {shortcutGuideOpen ? (
          <div
            ref={shortcutGuidePanelRef}
            role="dialog"
            aria-label="Landing shortcuts guide"
            aria-modal="false"
            tabIndex={-1}
            className="mt-3 grid gap-2 border-t border-cosmos-200/10 pt-3 text-xs text-cosmos-200/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 font-medium text-cosmos-100">
                <CircleHelp className="h-3.5 w-3.5" /> Landing shortcuts guide
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    copyShortcutGuide()
                      .then(() => setShortcutGuideCopyState("done"))
                      .catch(() => setShortcutGuideCopyState("error"));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                >
                  {shortcutGuideCopyState === "done"
                    ? "Guide copied"
                    : shortcutGuideCopyState === "error"
                      ? "Copy failed"
                      : "Copy guide"}
                </button>
                <button
                  type="button"
                  onClick={() => setShortcutGuideOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">? toggle guide</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">click outside closes guide</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">1-4 jump sections</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">[ ] / J K previous-next</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Home / End first-last</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">/ filter (restores after refresh)</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Copy filtered view shareable URL</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">↑ / ↓ select</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Enter jump selected</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Esc clear or close</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">B copy navigation bundle</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">C copy current</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">O open current</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">R resume last stop</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Shift+R reset saved nav state</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">F pin current</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">5-8 pinned recall</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">9 recent bounceback</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Shift+F pin filtered matches</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Shift+P copy pinned bundle</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Shift+T copy recent trail</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SECTIONS.map((section, index) => (
                <button
                  key={`guide-${section.id}`}
                  type="button"
                  onClick={() => {
                    if (!jumpToSection(section.id)) return;
                    setActiveId(section.id);
                    setShortcutGuideOpen(false);
                  }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cosmos-200/10 bg-cosmos-900/45 px-3 py-2 text-left transition-colors hover:border-neon-cyan/35 hover:bg-cosmos-900/70"
                  title={`Jump to ${section.label}`}
                >
                  <span className="inline-flex items-center gap-2 font-medium text-cosmos-100">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current/20 px-1 text-[10px] font-semibold leading-none text-cosmos-200/55">
                      {index + 1}
                    </span>
                    {section.label}
                  </span>
                  <span className="text-cosmos-200/50">#{section.id}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {pinnedSectionItems.length > 0 ? (
          <div className="mt-3 grid gap-2 border-t border-cosmos-200/10 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-cosmos-200/45">Pinned lanes</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                5-8 keyboard recall
              </span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                Shift+P copy bundle
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pinnedSectionItems.map((section, index) => {
                const isActive = section.id === activeSection.id;

                return (
                  <div
                    key={`pinned-${section.id}`}
                    className={cn(
                      "flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2",
                      isActive
                        ? "border-neon-cyan/40 bg-neon-cyan/10"
                        : "border-cosmos-200/10 bg-cosmos-900/45",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!jumpToSection(section.id)) return;
                        setActiveId(section.id);
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        isActive
                          ? "border-neon-cyan/60 bg-neon-cyan/12 text-cosmos-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                          : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/70 hover:border-neon-cyan/35 hover:text-cosmos-100",
                      )}
                      title={`Jump to pinned section ${section.label}`}
                    >
                      Pin {index + 1}
                      <span className="text-cosmos-200/55">{section.label}</span>
                    </button>
                    <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                      #{section.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        openSectionLink(section.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                      title={`Open pinned section ${section.label}`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        copySectionLink(section.id)
                          .then(() => setCopyState("done"))
                          .catch(() => setCopyState("error"));
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                      title={`Copy pinned section ${section.label}`}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPinnedSections((current) => {
                          const nextPinned = current.filter((sectionId) => sectionId !== section.id);
                          savePinnedSections(nextPinned);
                          return nextPinned;
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                      title={`Remove pinned section ${section.label}`}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  copyPinnedResultsBundle(pinnedSectionItems)
                    .then(() => setPinnedResultsCopyState("done"))
                    .catch(() => setPinnedResultsCopyState("error"));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title={`Copy pinned section bundle for ${pinnedSectionItems.length} sections`}
              >
                {pinnedResultsCopyState === "done"
                  ? `Copied ${pinnedSectionItems.length} pins`
                  : pinnedResultsCopyState === "error"
                    ? "Copy failed"
                    : `Copy ${pinnedSectionItems.length} pins`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPinnedSections([]);
                  savePinnedSections([]);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title="Clear pinned sections"
              >
                Clear pins
              </button>
            </div>
          </div>
        ) : null}

        {recentTrailSections.length > 0 ? (
          <div className="mt-3 grid gap-2 border-t border-cosmos-200/10 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-cosmos-200/45">Recent trail</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                9 operator bounceback
              </span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                Shift+T copy trail
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {recentTrailSections.map((section, index) => {
                const isActive = section.id === activeSection.id;

                return (
                  <div
                    key={`trail-${section.id}`}
                    className={cn(
                      "flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2",
                      isActive
                        ? "border-neon-cyan/40 bg-neon-cyan/10"
                        : "border-cosmos-200/10 bg-cosmos-900/45",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!jumpToSection(section.id)) return;
                        setActiveId(section.id);
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        isActive
                          ? "border-neon-cyan/60 bg-neon-cyan/12 text-cosmos-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                          : "border-cosmos-200/10 bg-cosmos-900/70 text-cosmos-200/70 hover:border-neon-cyan/35 hover:text-cosmos-100",
                      )}
                      title={`Jump back to ${section.label}`}
                    >
                      Trail {index + 1}
                      <span className="text-cosmos-200/55">{section.label}</span>
                    </button>
                    <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
                      #{section.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        openSectionLink(section.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                      title={`Open recent section ${section.label}`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        copySectionLink(section.id)
                          .then(() => setCopyState("done"))
                          .catch(() => setCopyState("error"));
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                      title={`Copy recent section ${section.label}`}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentTrail((current) => {
                          const nextTrail = current.filter((sectionId) => sectionId !== section.id);
                          saveRecentTrail(nextTrail);
                          return nextTrail;
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/75 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                      title={`Remove recent section ${section.label}`}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  copyRecentTrailBundle(recentTrailSections)
                    .then(() => setRecentTrailCopyState("done"))
                    .catch(() => setRecentTrailCopyState("error"));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title={`Copy recent trail bundle for ${recentTrailSections.length} sections`}
              >
                {recentTrailCopyState === "done"
                  ? `Copied ${recentTrailSections.length} trail items`
                  : recentTrailCopyState === "error"
                    ? "Copy failed"
                    : `Copy ${recentTrailSections.length} trail items`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecentTrail([]);
                  saveRecentTrail([]);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70 transition-colors hover:border-neon-cyan/35 hover:text-cosmos-100"
                title="Clear recent section trail"
              >
                Clear trail
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

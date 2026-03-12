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
    "Esc → Clear the filter or close the guide",
    "C → Copy the direct link for the current section",
    "O → Open the direct link for the current section in a new tab",
    "R → Resume the last saved section",
    "F → Pin or unpin the current section",
    "Shift+C (while filter is focused) → Copy the filtered result bundle",
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

export function MarketingQuickNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? "hero");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [recentTrail, setRecentTrail] = useState<string[]>([]);
  const [pinnedSections, setPinnedSections] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [shortcutGuideOpen, setShortcutGuideOpen] = useState(false);
  const [shortcutGuideCopyState, setShortcutGuideCopyState] = useState<"idle" | "done" | "error">("idle");
  const [filteredResultsCopyState, setFilteredResultsCopyState] = useState<"idle" | "done" | "error">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilteredIndex, setSelectedFilteredIndex] = useState(0);
  const [showAllFilteredResults, setShowAllFilteredResults] = useState(false);
  const clearCopyStateTimeoutRef = useRef<number | null>(null);
  const clearShortcutGuideCopyStateTimeoutRef = useRef<number | null>(null);
  const clearFilteredResultsCopyStateTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

        if (event.shiftKey && event.key.toLowerCase() === "c") {
          event.preventDefault();
          copyFilteredResultsBundle(searchQuery.trim(), filteredSections)
            .then(() => setFilteredResultsCopyState("done"))
            .catch(() => setFilteredResultsCopyState("error"));
          return;
        }
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

      if (event.key.toLowerCase() === "r" && resumeId) {
        event.preventDefault();
        if (!jumpToSection(resumeId)) return;
        setActiveId(resumeId);
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        togglePinnedSection(activeSection.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, activeSection.id, canJumpNext, canJumpPrev, filteredSections, resumeId, searchQuery, selectedFilteredSection, shortcutGuideOpen, togglePinnedSection]);

  const recentTrailSections = recentTrail
    .filter((sectionId) => sectionId !== activeSection.id)
    .map((sectionId) => SECTIONS.find((section) => section.id === sectionId) ?? null)
    .filter((section): section is MarketingSection => Boolean(section));
  const pinnedSectionItems = pinnedSections
    .map((sectionId) => SECTIONS.find((section) => section.id === sectionId) ?? null)
    .filter((section): section is MarketingSection => Boolean(section));
  const fallbackSections = Array.from(new Map(
    [activeSection, resumeSection, ...pinnedSectionItems, ...recentTrailSections]
      .filter((section): section is MarketingSection => Boolean(section))
      .map((section) => [section.id, section]),
  ).values()).slice(0, 4);
  const isActiveSectionPinned = pinnedSections.includes(activeSection.id);

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
              1-4 / [ ] / J K / Home / End / / / C / O / R / F / ?
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
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter" && selectedFilteredSection) {
                  event.preventDefault();
                  if (!jumpToSection(selectedFilteredSection.id)) return;
                  setActiveId(selectedFilteredSection.id);
                }
              }}
              placeholder="Filter sections (/ to focus, ↑/↓ choose, Enter to jump)"
              aria-label="Filter marketing sections"
              className="w-full rounded-full border border-cosmos-200/10 bg-cosmos-900/70 py-2 pl-9 pr-3 text-xs text-cosmos-100 outline-none transition-colors placeholder:text-cosmos-200/35 focus:border-neon-cyan/45"
            />
          </div>
          <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/70">
            Matches {filteredSections.length}/{SECTIONS.length}
          </span>
          {normalizedSearchQuery ? (
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
          ) : null}
        </div>

        {selectedFilteredSection && normalizedSearchQuery ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cosmos-200/10 pt-3">
            <span className="inline-flex items-center rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-cosmos-100">
              Selected {selectedFilteredIndex + 1}/{filteredSections.length} · {selectedFilteredSection.label}
              {selectedFilteredMatch?.matchedFields.length ? ` · via ${selectedFilteredMatch.matchedFields.join(", ")}` : ""}
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
          </div>
        ) : null}

        {shortcutGuideOpen ? (
          <div className="mt-3 grid gap-2 border-t border-cosmos-200/10 pt-3 text-xs text-cosmos-200/70">
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
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">1-4 jump sections</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">[ ] / J K previous-next</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Home / End first-last</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">/ filter</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">↑ / ↓ select</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Enter jump selected</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">Esc clear or close</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">C copy current</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">O open current</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">R resume last stop</span>
              <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 font-medium">F pin current</span>
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
                1-4 keyboard recall
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
                5-7 operator bounceback
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

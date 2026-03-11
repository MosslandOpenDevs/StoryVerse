"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Copy, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketingSection = {
  id: string;
  label: string;
  hint: string;
};

const LAST_ACTIVE_MARKETING_SECTION_STORAGE_KEY = "storyverse-last-marketing-section";
const RECENT_MARKETING_SECTION_TRAIL_STORAGE_KEY = "storyverse-recent-marketing-sections";
const MAX_RECENT_MARKETING_SECTION_TRAIL = 3;

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

export function MarketingQuickNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? "hero");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [recentTrail, setRecentTrail] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const clearCopyStateTimeoutRef = useRef<number | null>(null);

  const activeIndex = useMemo(() => SECTIONS.findIndex((section) => section.id === activeId), [activeId]);
  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === activeId) ?? SECTIONS[0] ?? { id: "hero", label: "Hero", hint: "Top overview" },
    [activeId],
  );
  const activeHashLabel = `#${activeSection.id}`;
  const activePositionLabel = activeIndex >= 0 ? `${activeIndex + 1}/${SECTIONS.length}` : `1/${SECTIONS.length}`;
  const canJumpPrev = activeIndex > 0;
  const canJumpNext = activeIndex >= 0 && activeIndex < SECTIONS.length - 1;
  const progressPercent = SECTIONS.length > 1 && activeIndex >= 0 ? Math.round((activeIndex / (SECTIONS.length - 1)) * 100) : 100;
  const resumeSection = useMemo(
    () => (resumeId ? SECTIONS.find((section) => section.id === resumeId) ?? null : null),
    [resumeId],
  );
  const showResumeButton = Boolean(resumeSection) && resumeSection?.id !== activeSection.id;

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
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget =
        target?.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT";

      if (isTypingTarget || event.metaKey || event.ctrlKey) {
        return;
      }

      if (event.key === "[" || event.key.toLowerCase() === "j") {
        event.preventDefault();
        const previousSection = SECTIONS[Math.max(0, activeIndex - 1)];
        if (!previousSection || !canJumpPrev || !jumpToSection(previousSection.id)) return;
        setActiveId(previousSection.id);
        return;
      }

      if (event.key === "]" || event.key.toLowerCase() === "k") {
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, activeSection.id, canJumpNext, canJumpPrev, resumeId]);

  const recentTrailSections = recentTrail
    .map((sectionId) => SECTIONS.find((section) => section.id === sectionId) ?? null)
    .filter((section): section is MarketingSection => Boolean(section));

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

          <span className="inline-flex items-center rounded-full border border-cosmos-200/10 bg-cosmos-900/70 px-3 py-1.5 text-xs font-medium text-cosmos-200/55">
            1-4 / [ ] / J K / Home / End / C / O / R
          </span>

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

        {recentTrailSections.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cosmos-200/10 pt-3">
            <span className="text-[11px] uppercase tracking-[0.22em] text-cosmos-200/45">Recent trail</span>
            {recentTrailSections.map((section, index) => {
              const isActive = section.id === activeSection.id;

              return (
                <button
                  key={`trail-${section.id}`}
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
        ) : null}
      </div>
    </div>
  </div>
  );
}

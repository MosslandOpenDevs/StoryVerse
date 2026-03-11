"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketingSection = {
  id: string;
  label: string;
  hint: string;
};

const SECTIONS: MarketingSection[] = [
  { id: "hero", label: "Hero", hint: "Top overview" },
  { id: "how-it-works", label: "How it works", hint: "3-step flow" },
  { id: "story-catalog", label: "Catalog", hint: "Browse stories" },
  { id: "launch-storyverse", label: "Launch", hint: "Jump into universe" },
];

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

export function MarketingQuickNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? "hero");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === activeId) ?? SECTIONS[0] ?? { id: "hero", label: "Hero", hint: "Top overview" },
    [activeId],
  );

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

    const hashId = window.location.hash.replace(/^#/, "");
    if (hashId && SECTIONS.some((section) => section.id === hashId)) {
      setActiveId(hashId);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (copyState === "idle") return;

    const timeout = window.setTimeout(() => setCopyState("idle"), copyState === "done" ? 1600 : 2200);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  return (
    <div className="sticky top-16 z-40 px-6 pb-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-cosmos-200/10 bg-cosmos-950/70 px-4 py-3 backdrop-blur-xl shadow-[0_0_30px_rgba(2,6,23,0.35)]">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cosmos-200/65">
          <Sparkles className="h-4 w-4 text-neon-cyan" />
          Landing quick nav
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
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
                title={`${section.label} · ${section.hint}`}
              >
                <span>{section.label}</span>
                <span className="hidden text-[10px] text-cosmos-200/45 sm:inline">{section.hint}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard
              .writeText(buildAnchorUrl(activeSection.id))
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
  );
}

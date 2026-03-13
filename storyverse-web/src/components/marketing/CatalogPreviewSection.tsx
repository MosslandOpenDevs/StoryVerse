"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StoryCatalogItem } from "@/lib/agents/catalogSeed";
import { Badge } from "@/components/ui/badge";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";
import { cn } from "@/lib/utils";

const DOMAIN_BORDER_COLORS: Record<StoryMedium, string> = {
  Movie: "from-domain-movie to-transparent",
  History: "from-domain-history to-transparent",
  Novel: "from-domain-novel to-transparent",
};

const DOMAIN_HOVER_SHADOWS: Record<StoryMedium, string> = {
  Movie: "hover:shadow-movie",
  History: "hover:shadow-history",
  Novel: "hover:shadow-novel",
};

const DOMAIN_BG_RADIALS: Record<StoryMedium, string> = {
  Movie: "bg-[radial-gradient(circle_at_50%_0%,rgba(96,165,250,0.06),transparent_70%)]",
  History: "bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.06),transparent_70%)]",
  Novel: "bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.06),transparent_70%)]",
};

interface CatalogPreviewSectionProps {
  catalog: StoryCatalogItem[];
}

type CatalogMediumFilter = "All" | StoryMedium;

const FILTERS: CatalogMediumFilter[] = ["All", "Movie", "History", "Novel"];

export function CatalogPreviewSection({ catalog }: CatalogPreviewSectionProps) {
  const [activeFilter, setActiveFilter] = useState<CatalogMediumFilter>("All");
  const hasStories = catalog.length > 0;

  const filteredCatalog = useMemo(
    () => (activeFilter === "All" ? catalog : catalog.filter((story) => story.medium === activeFilter)),
    [activeFilter, catalog],
  );

  const countsByMedium = useMemo(
    () => ({
      All: catalog.length,
      Movie: catalog.filter((story) => story.medium === "Movie").length,
      History: catalog.filter((story) => story.medium === "History").length,
      Novel: catalog.filter((story) => story.medium === "Novel").length,
    }),
    [catalog],
  );

  const hasFilteredStories = filteredCatalog.length > 0;

  return (
    <section id="story-catalog" tabIndex={-1} className="relative scroll-mt-24 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-2xl tracking-wide text-cosmos-100 sm:text-3xl">
          Story Catalog
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          {hasStories
            ? activeFilter === "All"
              ? `${catalog.length} stories waiting to be connected`
              : `${filteredCatalog.length} ${activeFilter.toLowerCase()} ${filteredCatalog.length === 1 ? "story" : "stories"} ready to explore`
            : "Catalog is being prepared. Refresh once generation completes."}
        </p>

        {hasStories ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter === activeFilter;
              const count = countsByMedium[filter];

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "border-neon-cyan/55 bg-neon-cyan/12 text-cosmos-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                      : "border-cosmos-200/10 bg-cosmos-900/60 text-cosmos-200/70 hover:border-neon-cyan/35 hover:text-cosmos-100",
                  )}
                  aria-pressed={isActive}
                  title={`Show ${filter === "All" ? "all" : filter.toLowerCase()} stories`}
                >
                  <span>{filter}</span>
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-current/20 px-1.5 text-[10px] leading-none text-cosmos-200/60">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {hasStories && !hasFilteredStories ? (
          <div className="mt-10 rounded-3xl border border-cosmos-200/10 bg-panel/40 px-6 py-8 text-center text-sm text-muted backdrop-blur-xl">
            No {activeFilter.toLowerCase()} stories are available yet. Try another lane.
          </div>
        ) : null}

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hasFilteredStories
            ? filteredCatalog.map((story) => (
                <Link
                  key={story.id}
                  href={`/universe?story=${story.id}`}
                  className={`group relative overflow-hidden rounded-2xl border border-cosmos-200/10 bg-panel/50 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${DOMAIN_HOVER_SHADOWS[story.medium]} ${DOMAIN_BG_RADIALS[story.medium]}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${DOMAIN_BORDER_COLORS[story.medium]}`}
                  />

                  <div className="relative">
                    <Badge domain={story.medium} className="mb-3">
                      {story.medium}
                    </Badge>
                    <h3 className="font-display text-sm tracking-wide text-cosmos-100">
                      {story.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                      {story.summary}
                    </p>
                  </div>
                </Link>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}

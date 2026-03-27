"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
type CatalogMediumQueryValue = "movie" | "history" | "novel";

const FILTERS: CatalogMediumFilter[] = ["All", "Movie", "History", "Novel"];
const QUERY_TO_FILTER_MAP: Record<CatalogMediumQueryValue, StoryMedium> = {
  movie: "Movie",
  history: "History",
  novel: "Novel",
};

function getFilterFromMediumQuery(queryValue: string | null): CatalogMediumFilter {
  if (!queryValue) {
    return "All";
  }

  const normalizedValue = queryValue.toLowerCase() as CatalogMediumQueryValue;
  return QUERY_TO_FILTER_MAP[normalizedValue] ?? "All";
}

function getMediumQueryFromFilter(filter: CatalogMediumFilter): CatalogMediumQueryValue | null {
  if (filter === "All") {
    return null;
  }

  return filter.toLowerCase() as CatalogMediumQueryValue;
}

export function CatalogPreviewSection({ catalog }: CatalogPreviewSectionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = getFilterFromMediumQuery(searchParams.get("medium"));
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

  const filterStatusText = useMemo(() => {
    if (!hasStories) {
      return "Story catalog is loading. Stories are being prepared.";
    }

    if (activeFilter === "All") {
      return `${catalog.length} story${catalog.length === 1 ? '' : 's'} available.`;
    }

    return `${filteredCatalog.length} ${activeFilter.toLowerCase()} story${filteredCatalog.length === 1 ? '' : 's'} available.`;
  }, [activeFilter, catalog.length, filteredCatalog.length, hasStories]);

  const hasFilteredStories = filteredCatalog.length > 0;

  const handleFilterChange = (nextFilter: CatalogMediumFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextMediumQuery = getMediumQueryFromFilter(nextFilter);

    if (nextMediumQuery) {
      params.set("medium", nextMediumQuery);
    } else {
      params.delete("medium");
    }

    const nextQueryString = params.toString();
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <section id="story-catalog" tabIndex={-1} className="relative scroll-mt-24 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-2xl tracking-wide text-cosmos-100 sm:text-3xl">
          Story Catalog
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted" aria-live="polite">
          {filterStatusText}
        </p>
        <p id="catalog-filter-status" className="sr-only" aria-live="polite">
          {filterStatusText}
        </p>

        {hasStories ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter === activeFilter;
              const count = countsByMedium[filter];
              const isUnavailable = !isActive && count === 0;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handleFilterChange(filter)}
                  disabled={isUnavailable}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-cosmos-950",
                    isActive
                      ? "border-neon-cyan/55 bg-neon-cyan/12 text-cosmos-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                      : "border-cosmos-200/10 bg-cosmos-900/60 text-cosmos-200/70 hover:border-neon-cyan/35 hover:text-cosmos-100",
                    isUnavailable ? "cursor-not-allowed opacity-50" : "",
                  )}
                  aria-pressed={isActive}
                  aria-label={`Show ${filter === "All" ? "all" : filter.toLowerCase()} stories (${count} item${count === 1 ? "" : "s"})`}
                  aria-disabled={isUnavailable}
                  title={isUnavailable ? `No ${filter === "All" ? "all" : filter.toLowerCase()} stories available yet` : `Show ${filter === "All" ? "all" : filter.toLowerCase()} stories`}
                >
                  <span>{filter}</span>
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-current/20 px-1.5 text-[10px] leading-none text-cosmos-200/60">
                    {count}
                  </span>
                </button>
              );
            })}
            {activeFilter !== "All" ? (
              <button
                type="button"
                onClick={() => handleFilterChange("All")}
                className="inline-flex items-center rounded-full border border-cosmos-200/20 px-3 py-1.5 text-xs font-medium text-cosmos-200/80 transition-all hover:border-cosmos-200/45 hover:text-cosmos-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-cosmos-950"
                aria-label="Clear story catalog lane filter"
              >
                Clear lane filter
              </button>
            ) : null}
          </div>
        ) : null}

        {hasStories && !hasFilteredStories ? (
          <div className="mt-10 rounded-3xl border border-cosmos-200/10 bg-panel/40 px-6 py-8 text-center text-sm text-muted backdrop-blur-xl">
            <p>No {activeFilter.toLowerCase()} stories are available yet. Try another lane.</p>
            <button
              type="button"
              onClick={() => handleFilterChange("All")}
              className="mt-4 inline-flex items-center rounded-full border border-cosmos-200/20 px-4 py-2 text-xs font-medium text-cosmos-100 transition-colors hover:border-cosmos-200/45 hover:bg-cosmos-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-cosmos-950"
            >
              Clear lane filter
            </button>
          </div>
        ) : null}

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hasFilteredStories
            ? filteredCatalog.map((story) => (
                <Link
                  key={story.id}
                  href={`/universe?story=${story.id}`}
                  className={`group relative overflow-hidden rounded-2xl border border-cosmos-200/10 bg-panel/50 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-cosmos-950 ${DOMAIN_HOVER_SHADOWS[story.medium]} ${DOMAIN_BG_RADIALS[story.medium]}`}
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

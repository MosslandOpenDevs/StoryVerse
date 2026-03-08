"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { StoryGrid } from "@/components/universe/StoryGrid";
import { BridgePanel } from "@/components/universe/BridgePanel";
import { useUniverseState } from "@/components/universe/useUniverseState";
import { SEED_CATALOG, type StoryCatalogItem } from "@/lib/agents/catalogSeed";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";
import { fetchCatalogAction } from "./actions";

const MEDIUM_FILTERS: Array<StoryMedium | "All"> = ["All", "Movie", "History", "Novel"];

function UniverseContent() {
  const searchParams = useSearchParams();
  const initialStoryId = searchParams.get("story") ?? undefined;
  const [catalog, setCatalog] = useState<StoryCatalogItem[]>(SEED_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [lastCatalogRefreshAt, setLastCatalogRefreshAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediumFilter, setMediumFilter] = useState<StoryMedium | "All">("All");

  const loadCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    try {
      const fullCatalog = await fetchCatalogAction();
      setCatalog(fullCatalog);
      setCatalogError(null);
      setLastCatalogRefreshAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setCatalogError("Unable to refresh the full catalog.");
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  // Fetch full dynamic catalog on mount
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

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
              Story Universe
            </h2>
            <div className="flex items-center gap-3">
              {isCatalogLoading ? (
                <span className="text-xs text-cosmos-300/70">
                  Updating catalog...
                </span>
              ) : lastCatalogRefreshAt ? (
                <span className="text-xs text-cosmos-300/60">
                  Updated {lastCatalogRefreshAt}
                </span>
              ) : null}
              <span className="text-xs text-cosmos-200/40">
                {catalog.length} stories
              </span>
              <button
                type="button"
                className="rounded-md border border-cosmos-300/20 px-3 py-1.5 text-xs font-medium text-cosmos-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void loadCatalog();
                }}
                disabled={isCatalogLoading}
                aria-label="Refresh story catalog"
              >
                Refresh catalog
              </button>
            </div>
          </div>
          {catalogError ? (
            <div className="mb-4 flex items-center gap-3 rounded-md border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs text-red-100/90">
              <span>{catalogError}</span>
              <button
                type="button"
                className="rounded border border-red-200/30 px-2 py-1 text-[11px] font-medium text-red-100 transition hover:bg-red-200/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void loadCatalog();
                }}
                disabled={isCatalogLoading}
              >
                Retry
              </button>
            </div>
          ) : null}
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-cosmos-300/15 bg-cosmos-900/20 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-xs text-cosmos-200/80">
                <span className="mb-1 block text-cosmos-100/85">Search stories</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Try: Sherlock, galaxy, Jedi, or novel"
                  className="w-full rounded-md border border-cosmos-300/20 bg-cosmos-950/60 px-2.5 py-1.5 text-sm text-cosmos-100 placeholder:text-cosmos-400/50 focus:border-cyan-300/50 focus:outline-none"
                />
              </label>
              <p className="text-[11px] text-cosmos-300/70">
                Search matches titles, summaries, mediums, and aliases.
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
                  {medium}
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
                Clear filters
              </button>
            </div>
          </div>
          <StoryGrid
            catalog={filteredCatalog}
            selectedSourceId={state.selectedSourceId}
            selectedTargetId={state.selectedTargetId}
            onStoryClick={state.handleStoryCardClick}
          />
          <p className="mt-2 text-[10px] text-cosmos-300/70">
            Showing {filteredCatalog.length} / {catalog.length} stories
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
            Loading universe...
          </div>
        }
      >
        <UniverseContent />
      </Suspense>
    </>
  );
}

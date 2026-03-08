"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { StoryGrid } from "@/components/universe/StoryGrid";
import { BridgePanel } from "@/components/universe/BridgePanel";
import { useUniverseState } from "@/components/universe/useUniverseState";
import { SEED_CATALOG, type StoryCatalogItem } from "@/lib/agents/catalogSeed";
import { fetchCatalogAction } from "./actions";

function UniverseContent() {
  const searchParams = useSearchParams();
  const initialStoryId = searchParams.get("story") ?? undefined;
  const [catalog, setCatalog] = useState<StoryCatalogItem[]>(SEED_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [lastCatalogRefreshAt, setLastCatalogRefreshAt] = useState<string | null>(null);

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
          <StoryGrid
            catalog={catalog}
            selectedSourceId={state.selectedSourceId}
            selectedTargetId={state.selectedTargetId}
            onStoryClick={state.handleStoryCardClick}
          />
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

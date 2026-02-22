"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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

  // Fetch full dynamic catalog on mount
  useEffect(() => {
    void fetchCatalogAction().then(setCatalog);
  }, []);

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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg tracking-wide text-cosmos-100">
              Story Universe
            </h2>
            <span className="text-xs text-cosmos-200/40">
              {catalog.length} stories
            </span>
          </div>
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

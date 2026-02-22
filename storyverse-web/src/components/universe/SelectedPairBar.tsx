"use client";

import { ArrowLeftRight, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoryCatalogItem } from "@/lib/agents/catalogSeed";
import { findCatalogNodeIn } from "./useUniverseState";
import type { StoryMedium } from "@/lib/agents/navigatorAgent";

const DOMAIN_DOT_COLORS: Record<StoryMedium, string> = {
  Movie: "bg-domain-movie",
  History: "bg-domain-history",
  Novel: "bg-domain-novel",
};

interface SelectedPairBarProps {
  catalog: StoryCatalogItem[];
  selectedSourceId: string;
  selectedTargetId: string;
  onSwap: () => void;
  onClear: () => void;
  onGenerate: () => void;
  isPending: boolean;
}

export function SelectedPairBar({
  catalog,
  selectedSourceId,
  selectedTargetId,
  onSwap,
  onClear,
  onGenerate,
  isPending,
}: SelectedPairBarProps) {
  const source = findCatalogNodeIn(catalog, selectedSourceId);
  const target = findCatalogNodeIn(catalog, selectedTargetId);

  if (!source && !target) return null;

  return (
    <div className="rounded-xl border border-cosmos-200/15 bg-panel/60 p-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Source */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {source ? (
            <>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOMAIN_DOT_COLORS[source.medium]}`}
              />
              <span className="truncate text-sm text-cosmos-100">
                {source.title}
              </span>
            </>
          ) : (
            <span className="text-sm text-cosmos-200/40">Select source...</span>
          )}
        </div>

        {/* Arrow */}
        <span className="shrink-0 text-xs text-cosmos-200/40">→</span>

        {/* Target */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {target ? (
            <>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOMAIN_DOT_COLORS[target.medium]}`}
              />
              <span className="truncate text-sm text-cosmos-100">
                {target.title}
              </span>
            </>
          ) : (
            <span className="text-sm text-cosmos-200/40">Select target...</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {source && target && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onSwap}
              disabled={isPending}
              title="Swap"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onClear}
            disabled={isPending}
            title="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Generate bridge CTA */}
      {source && target && source.id !== target.id && (
        <Button
          className="mt-3 w-full gap-2"
          onClick={onGenerate}
          disabled={isPending}
        >
          {isPending ? (
            <>
              Generating Bridge...
              <span
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-cosmos-100/40 border-t-cosmos-100/90 animate-spin"
                aria-hidden
              />
            </>
          ) : (
            <>
              Generate Bridge
              <Zap className="h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

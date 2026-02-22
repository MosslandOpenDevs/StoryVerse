"use client";

import type { LatestResult } from "./useUniverseState";

interface BridgeResultCardProps {
  result: LatestResult;
}

export function BridgeResultCard({ result }: BridgeResultCardProps) {
  if (!result) return null;

  return (
    <div className="animate-slide-up overflow-hidden rounded-2xl border border-cosmos-200/15 bg-panel/60 backdrop-blur-xl">
      {/* Left gradient border accent */}
      <div className="flex">
        <div className="w-1 shrink-0 bg-gradient-to-b from-neon-violet via-neon-cyan to-neon-violet" />
        <div className="flex-1 p-5">
          <h3 className="font-display text-base tracking-wide text-cosmos-100">
            {result.scenario.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-cosmos-200/90">
            {result.scenario.bridge}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-cosmos-200/50">
            <span>{result.source.title}</span>
            <span className="text-neon-cyan">→</span>
            <span>{result.target.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import type { RankedNodeCandidate } from "./useUniverseState";
import { cn } from "@/lib/utils";

interface ClarificationPanelProps {
  clarificationPrompts: string[];
  sourceCandidates: RankedNodeCandidate[];
  targetCandidates: RankedNodeCandidate[];
  selectedSourceId: string;
  selectedTargetId: string;
  onSelectSource: (id: string) => void;
  onSelectTarget: (id: string) => void;
  onRunCorrected: () => void;
  onRunQuery: (prompt: string) => void;
  isCorrectedRunReady: boolean;
  uiLocale: "en" | "ko";
  isPending: boolean;
}

function formatCandidateLabel(candidate: RankedNodeCandidate): string {
  return candidate.score <= 0
    ? candidate.title
    : `${candidate.title} (${candidate.score})`;
}

export function ClarificationPanel({
  clarificationPrompts,
  sourceCandidates,
  targetCandidates,
  selectedSourceId,
  selectedTargetId,
  onSelectSource,
  onSelectTarget,
  onRunCorrected,
  onRunQuery,
  isCorrectedRunReady,
  uiLocale,
  isPending,
}: ClarificationPanelProps) {
  const hasClarificationPrompts = clarificationPrompts.length > 0;
  const hasCandidates = sourceCandidates.length > 0 && targetCandidates.length > 0;

  if (!hasClarificationPrompts && !hasCandidates) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-neon-cyan/20 bg-panel/60 p-4 backdrop-blur-xl">
      {hasClarificationPrompts && (
        <div className="space-y-2">
          <p className="text-xs text-cosmos-200/70">
            {uiLocale === "ko" ? "해석 교정 제안" : "Clarification suggestions"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {clarificationPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-neon-cyan/30 px-2.5 py-1 text-[11px] text-cosmos-100 transition-colors hover:border-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
                onClick={() => onRunQuery(prompt)}
                disabled={isPending}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasCandidates && (
        <div className="space-y-3">
          <p className="text-xs text-cosmos-200/70">
            {uiLocale === "ko" ? "감지된 노드 교정" : "Adjust detected nodes"}
          </p>

          {/* Source candidates */}
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-wider text-cosmos-200/50 uppercase">
              {uiLocale === "ko" ? "출발" : "Source"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sourceCandidates.map((candidate) => (
                <button
                  key={`source-${candidate.id}`}
                  type="button"
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50",
                    selectedSourceId === candidate.id
                      ? "border-neon-cyan text-cosmos-100 bg-neon-cyan/10"
                      : "border-cosmos-700/50 text-cosmos-200/70 hover:border-cosmos-500",
                  )}
                  onClick={() => onSelectSource(candidate.id)}
                  disabled={isPending}
                >
                  {formatCandidateLabel(candidate)}
                </button>
              ))}
            </div>
          </div>

          {/* Target candidates */}
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-wider text-cosmos-200/50 uppercase">
              {uiLocale === "ko" ? "도착" : "Target"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {targetCandidates.map((candidate) => (
                <button
                  key={`target-${candidate.id}`}
                  type="button"
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50",
                    selectedTargetId === candidate.id
                      ? "border-neon-violet text-cosmos-100 bg-neon-violet/10"
                      : "border-cosmos-700/50 text-cosmos-200/70 hover:border-cosmos-500",
                  )}
                  onClick={() => onSelectTarget(candidate.id)}
                  disabled={isPending}
                >
                  {formatCandidateLabel(candidate)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={onRunCorrected}
              disabled={isPending || !isCorrectedRunReady}
            >
              {uiLocale === "ko" ? "교정 질의 실행" : "Run corrected query"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

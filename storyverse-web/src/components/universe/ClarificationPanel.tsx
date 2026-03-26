"use client";

import { Button } from "@/components/ui/button";
import type { ClarificationChoice, RankedNodeCandidate } from "./useUniverseState";
import { cn } from "@/lib/utils";

interface ClarificationPanelProps {
  clarificationChoices: ClarificationChoice[];
  sourceCandidates: RankedNodeCandidate[];
  targetCandidates: RankedNodeCandidate[];
  selectedSourceId: string;
  selectedTargetId: string;
  onSelectSource: (id: string) => void;
  onSelectTarget: (id: string) => void;
  onRunCorrected: () => void;
  onRunChoice: (choice: ClarificationChoice) => void;
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
  clarificationChoices,
  sourceCandidates,
  targetCandidates,
  selectedSourceId,
  selectedTargetId,
  onSelectSource,
  onSelectTarget,
  onRunCorrected,
  onRunChoice,
  isCorrectedRunReady,
  uiLocale,
  isPending,
}: ClarificationPanelProps) {
  const hasClarificationChoices = clarificationChoices.length > 0;
  const hasCandidates = sourceCandidates.length > 0 && targetCandidates.length > 0;

  if (!hasClarificationChoices && !hasCandidates) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-neon-cyan/20 bg-panel/60 p-4 backdrop-blur-xl">
      {hasClarificationChoices && (
        <div className="space-y-2">
          <p className="text-xs text-cosmos-200/70">
            {uiLocale === "ko" ? "해석 교정 제안" : "Clarification suggestions"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {clarificationChoices.map((choice) => (
              <button
                key={`${choice.sourceId}:${choice.targetId}`}
                type="button"
                className="rounded-full border border-neon-cyan/30 px-2.5 py-1 text-[11px] text-cosmos-100 transition-colors hover:border-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
                onClick={() => onRunChoice(choice)}
                disabled={isPending}
                aria-label={
                  uiLocale === "ko"
                    ? `교정 제안 실행: ${choice.prompt}`
                    : `Run clarification suggestion: ${choice.prompt}`
                }
              >
                {choice.prompt}
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
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={uiLocale === "ko" ? "출발 후보" : "Source candidates"}
            >
              {sourceCandidates.map((candidate) => {
                const isSelected = selectedSourceId === candidate.id;

                return (
                  <button
                    key={`source-${candidate.id}`}
                    type="button"
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50",
                      isSelected
                        ? "border-neon-cyan text-cosmos-100 bg-neon-cyan/10"
                        : "border-cosmos-700/50 text-cosmos-200/70 hover:border-cosmos-500",
                    )}
                    onClick={() => onSelectSource(candidate.id)}
                    disabled={isPending}
                    aria-pressed={isSelected}
                    aria-label={
                      uiLocale === "ko"
                        ? `${candidate.title} 출발 후보${isSelected ? ', 선택됨' : ''}`
                        : `${candidate.title} source candidate${isSelected ? ', selected' : ''}`
                    }
                  >
                    {formatCandidateLabel(candidate)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target candidates */}
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-wider text-cosmos-200/50 uppercase">
              {uiLocale === "ko" ? "도착" : "Target"}
            </p>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={uiLocale === "ko" ? "도착 후보" : "Target candidates"}
            >
              {targetCandidates.map((candidate) => {
                const isSelected = selectedTargetId === candidate.id;

                return (
                  <button
                    key={`target-${candidate.id}`}
                    type="button"
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50",
                      isSelected
                        ? "border-neon-violet text-cosmos-100 bg-neon-violet/10"
                        : "border-cosmos-700/50 text-cosmos-200/70 hover:border-cosmos-500",
                    )}
                    onClick={() => onSelectTarget(candidate.id)}
                    disabled={isPending}
                    aria-pressed={isSelected}
                    aria-label={
                      uiLocale === "ko"
                        ? `${candidate.title} 도착 후보${isSelected ? ', 선택됨' : ''}`
                        : `${candidate.title} target candidate${isSelected ? ', selected' : ''}`
                    }
                  >
                    {formatCandidateLabel(candidate)}
                  </button>
                );
              })}
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

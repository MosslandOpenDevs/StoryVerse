"use client";

import { Compass } from "lucide-react";
import { QueryInput } from "./QueryInput";
import { SelectedPairBar } from "./SelectedPairBar";
import { BridgeResultCard } from "./BridgeResultCard";
import { TimelineBeats } from "./TimelineBeats";
import { RiskBadge } from "./RiskBadge";
import { NeighborSuggestions } from "./NeighborSuggestions";
import { ClarificationPanel } from "./ClarificationPanel";
import { ChatHistory } from "./ChatHistory";
import type { useUniverseState } from "./useUniverseState";

type UniverseState = ReturnType<typeof useUniverseState>;

interface BridgePanelProps {
  state: UniverseState;
}

export function BridgePanel({ state }: BridgePanelProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto max-h-[calc(100dvh-5rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base tracking-[0.14em] text-cosmos-100 uppercase">
            Command Deck
          </h2>
          <p className="mt-0.5 text-xs text-cosmos-200/50">
            Agentic bridge generation across story domains
          </p>
        </div>
        <Compass className="h-5 w-5 text-neon-cyan" />
      </div>

      <div className="space-y-4">
        {/* Selected pair bar */}
        <SelectedPairBar
          catalog={state.catalog}
          selectedSourceId={state.selectedSourceId}
          selectedTargetId={state.selectedTargetId}
          onSwap={state.swapSelection}
          onClear={state.clearSelection}
          onGenerate={state.generateBridge}
          isPending={state.isPending}
        />

        {/* Query input */}
        <QueryInput
          query={state.query}
          onQueryChange={state.setQuery}
          onSubmit={state.submitQuery}
          onRunQuery={state.runQuery}
          recentQueries={state.recentQueries}
          uiLocale={state.uiLocale}
          isPending={state.isPending}
        />

        {/* Clarification panel */}
        <ClarificationPanel
          clarificationChoices={state.clarificationChoices}
          sourceCandidates={state.sourceCandidates}
          targetCandidates={state.targetCandidates}
          selectedSourceId={state.selectedSourceId}
          selectedTargetId={state.selectedTargetId}
          onSelectSource={state.setSelectedSourceId}
          onSelectTarget={state.setSelectedTargetId}
          onRunCorrected={state.runCorrectedQuery}
          onRunChoice={state.runClarificationChoice}
          isCorrectedRunReady={state.isCorrectedRunReady}
          uiLocale={state.uiLocale}
          isPending={state.isPending}
        />

        {/* Bridge result */}
        {state.latestResult && (
          <>
            <BridgeResultCard result={state.latestResult} />
            <TimelineBeats beats={state.latestResult.scenario.timelineBeats} />
            <RiskBadge risk={state.latestResult.scenario.risk} />
            <NeighborSuggestions
              suggestions={state.latestResult.suggestions}
              onSelect={(id) => state.handleStoryCardClick(id)}
            />
          </>
        )}

        {/* Chat history */}
        <ChatHistory messages={state.messages} />
      </div>
    </div>
  );
}

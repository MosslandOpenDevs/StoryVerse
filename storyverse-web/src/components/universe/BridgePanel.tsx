"use client";

import { Compass, Keyboard } from "lucide-react";
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
  onCopyLink: () => void;
  onCopyPrompt: () => void;
  copyFeedback: "idle" | "success" | "error";
  promptCopyFeedback: "idle" | "success" | "error";
}

const SHORTCUT_COPY = {
  en: {
    title: "Shortcut guide",
    summary: "Keep the keyboard nearby for faster bridge runs.",
    query: "Query",
    history: "History",
    selection: "Selection",
    focus: "Focus command input",
    submit: "Run typed command",
    browseHistory: "Browse recent queries",
    jumpHistory: "Jump oldest/newest recent query",
    clearHistoryItem: "Remove active recent query",
    clearAllHistory: "Clear all recent queries",
    clearInput: "Exit history or clear input",
    generate: "Generate bridge for selected pair",
    copyLink: "Copy current selection link",
    copyPrompt: "Copy ready-to-run bridge prompt",
    copyView: "Copy the current filtered universe view",
    copyPair: "Copy the current selected pair link",
    swap: "Swap source and target",
    reset: "Clear selected pair",
  },
  ko: {
    title: "단축키 가이드",
    summary: "브리지 작업을 더 빠르게 돌릴 수 있는 키보드 요약입니다.",
    query: "입력",
    history: "히스토리",
    selection: "선택 페어",
    focus: "명령 입력 포커스",
    submit: "현재 입력 실행",
    browseHistory: "최근 실행 탐색",
    jumpHistory: "가장 오래된/최신 최근 실행으로 점프",
    clearHistoryItem: "현재 최근 실행 항목 삭제",
    clearAllHistory: "최근 실행 전체 삭제",
    clearInput: "히스토리 종료 또는 입력 지우기",
    generate: "선택된 페어 브리지 생성",
    copyLink: "현재 선택 링크 복사",
    copyPrompt: "바로 실행 가능한 브리지 프롬프트 복사",
    copyView: "현재 필터 화면 링크 복사",
    copyPair: "현재 선택 페어 링크 복사",
    swap: "출발/도착 교체",
    reset: "선택 페어 초기화",
  },
} as const;

export function BridgePanel({ state, onCopyLink, onCopyPrompt, copyFeedback, promptCopyFeedback }: BridgePanelProps) {
  const shortcutCopy = SHORTCUT_COPY[state.uiLocale] ?? SHORTCUT_COPY.en;

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
        <details className="rounded-xl border border-cosmos-200/15 bg-panel/40 p-3 text-xs text-cosmos-200/75 backdrop-blur-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-cosmos-100 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-neon-cyan" />
              {shortcutCopy.title}
            </span>
            <span className="text-[11px] text-cosmos-300/60">/ · ⌘/Ctrl+K · ↑/↓ · L · Shift+L · Enter</span>
          </summary>
          <p className="mt-2 text-[11px] text-cosmos-200/55">{shortcutCopy.summary}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cosmos-300/60">{shortcutCopy.query}</p>
              <ul className="space-y-1 text-[11px] leading-5 text-cosmos-200/75">
                <li><span className="text-cosmos-100">/</span>, <span className="text-cosmos-100">⌘/Ctrl+K</span> — {shortcutCopy.focus}</li>
                <li><span className="text-cosmos-100">Enter</span> — {shortcutCopy.submit}</li>
                <li><span className="text-cosmos-100">L</span> — {shortcutCopy.copyView}</li>
                <li><span className="text-cosmos-100">Shift+L</span> — {shortcutCopy.copyPair}</li>
                <li><span className="text-cosmos-100">Esc</span>, <span className="text-cosmos-100">⌘/Ctrl+L</span> — {shortcutCopy.clearInput}</li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cosmos-300/60">{shortcutCopy.history}</p>
              <ul className="space-y-1 text-[11px] leading-5 text-cosmos-200/75">
                <li><span className="text-cosmos-100">↑/↓</span>, <span className="text-cosmos-100">Ctrl/⌘+P,N</span> — {shortcutCopy.browseHistory}</li>
                <li><span className="text-cosmos-100">Home/End</span> — {shortcutCopy.jumpHistory}</li>
                <li><span className="text-cosmos-100">Ctrl/⌘+⌫/Del</span> — {shortcutCopy.clearHistoryItem}</li>
                <li><span className="text-cosmos-100">Ctrl/⌘+Shift+⌫/Del</span> — {shortcutCopy.clearAllHistory}</li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cosmos-300/60">{shortcutCopy.selection}</p>
              <ul className="space-y-1 text-[11px] leading-5 text-cosmos-200/75">
                <li><span className="text-cosmos-100">Enter</span> — {shortcutCopy.generate}</li>
                <li><span className="text-cosmos-100">C</span> — {shortcutCopy.copyLink}</li>
                <li><span className="text-cosmos-100">P</span> — {shortcutCopy.copyPrompt}</li>
                <li><span className="text-cosmos-100">S</span> — {shortcutCopy.swap}</li>
                <li><span className="text-cosmos-100">Esc</span>, <span className="text-cosmos-100">⌫</span> — {shortcutCopy.reset}</li>
              </ul>
            </div>
          </div>
        </details>

        {/* Selected pair bar */}
        <SelectedPairBar
          catalog={state.catalog}
          selectedSourceId={state.selectedSourceId}
          selectedTargetId={state.selectedTargetId}
          onSwap={state.swapSelection}
          onClear={state.clearSelection}
          onGenerate={state.generateBridge}
          onCopyLink={onCopyLink}
          onCopyPrompt={onCopyPrompt}
          copyFeedback={copyFeedback}
          promptCopyFeedback={promptCopyFeedback}
          uiLocale={state.uiLocale}
          isPending={state.isPending}
        />

        {/* Query input */}
        <QueryInput
          query={state.query}
          onQueryChange={state.setQuery}
          onSubmit={state.submitQuery}
          onRunQuery={state.runQuery}
          recentQueries={state.recentQueries}
          onClearRecentQueries={state.clearRecentQueries}
          onRemoveRecentQuery={state.removeRecentQueryAt}
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
            <BridgeResultCard result={state.latestResult} uiLocale={state.uiLocale} />
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

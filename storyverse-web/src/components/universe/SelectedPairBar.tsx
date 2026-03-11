"use client";

import { useEffect } from "react";
import { ArrowLeftRight, Check, Copy, ExternalLink, X, Zap } from "lucide-react";
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
  onCopyLink: () => void;
  onOpenLink: () => void;
  onCopyPrompt: () => void;
  copyFeedback: "idle" | "success" | "error";
  promptCopyFeedback: "idle" | "success" | "error";
  uiLocale: "en" | "ko";
  isPending: boolean;
}

const LABELS = {
  en: {
    selectionTitle: "Selected pair",
    selectionHelp: "Pick any two nodes to generate a bridge.",
    sourceEmpty: "Select source…",
    targetEmpty: "Select target…",
    sourceLabel: "Source",
    targetLabel: "Target",
    swap: "Swap",
    clear: "Clear",
    generate: "Generate Bridge",
    generating: "Generating Bridge…",
    copyLink: "Copy selection link",
    openLink: "Open selection link",
    copyPrompt: "Copy bridge prompt",
    copied: "Link copied",
    promptCopied: "Prompt copied",
    copyFailed: "Copy failed",
    ready: "Ready",
    incomplete: "Select one more node",
    shortcuts: "Shortcuts: Enter generate · C copy link · O open link · P copy prompt · S swap · Esc/Backspace clear",
  },
  ko: {
    selectionTitle: "선택된 페어",
    selectionHelp: "노드 두 개를 고르면 브리지를 생성할 수 있어요.",
    sourceEmpty: "출발 노드를 고르세요…",
    targetEmpty: "도착 노드를 고르세요…",
    sourceLabel: "출발",
    targetLabel: "도착",
    swap: "서로 바꾸기",
    clear: "초기화",
    generate: "브리지 생성",
    generating: "브리지 생성 중…",
    copyLink: "선택 링크 복사",
    openLink: "선택 링크 열기",
    copyPrompt: "브리지 프롬프트 복사",
    copied: "링크 복사됨",
    promptCopied: "프롬프트 복사됨",
    copyFailed: "복사 실패",
    ready: "생성 준비 완료",
    incomplete: "노드를 하나 더 선택하세요",
    shortcuts: "단축키: Enter 생성 · C 링크 복사 · O 링크 열기 · P 프롬프트 복사 · S 교체 · Esc/Backspace 초기화",
  },
} as const;

export function SelectedPairBar({
  catalog,
  selectedSourceId,
  selectedTargetId,
  onSwap,
  onClear,
  onGenerate,
  onCopyLink,
  onOpenLink,
  onCopyPrompt,
  copyFeedback,
  promptCopyFeedback,
  uiLocale,
  isPending,
}: SelectedPairBarProps) {
  const source = findCatalogNodeIn(catalog, selectedSourceId);
  const target = findCatalogNodeIn(catalog, selectedTargetId);
  const labels = LABELS[uiLocale] ?? LABELS.en;
  const isPairReady = Boolean(source && target && source.id !== target.id);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPending) return;

      const targetElement = event.target;
      const tagName = targetElement instanceof HTMLElement ? targetElement.tagName.toLowerCase() : "";
      const isEditable =
        targetElement instanceof HTMLElement &&
        (targetElement.isContentEditable ||
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select");

      if (isEditable) {
        return;
      }

      if (event.key === "Enter" && isPairReady) {
        event.preventDefault();
        onGenerate();
        return;
      }

      if ((event.key === "c" || event.key === "C") && isPairReady) {
        event.preventDefault();
        onCopyLink();
        return;
      }

      if ((event.key === "o" || event.key === "O") && isPairReady) {
        event.preventDefault();
        onOpenLink();
        return;
      }

      if ((event.key === "p" || event.key === "P") && isPairReady) {
        event.preventDefault();
        onCopyPrompt();
        return;
      }

      if ((event.key === "s" || event.key === "S") && isPairReady) {
        event.preventDefault();
        onSwap();
        return;
      }

      if ((event.key === "Escape" || event.key === "Backspace") && (source || target)) {
        event.preventDefault();
        onClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPairReady, isPending, onClear, onCopyLink, onCopyPrompt, onGenerate, onOpenLink, onSwap, source, target]);

  if (!source && !target) return null;

  return (
    <div className="rounded-xl border border-cosmos-200/15 bg-panel/60 p-3 backdrop-blur-xl">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cosmos-200/65">
            {labels.selectionTitle}
          </p>
          <p className="mt-1 text-[11px] text-cosmos-200/50">
            {labels.selectionHelp}
          </p>
          <p className="mt-1 text-[10px] text-cosmos-300/45">
            {labels.shortcuts}
          </p>
        </div>
        <span className="rounded-full border border-cosmos-200/15 bg-cosmos-900/50 px-2 py-1 text-[10px] text-cosmos-200/70">
          {source && target && source.id !== target.id ? labels.ready : labels.incomplete}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Source */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {source ? (
            <>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOMAIN_DOT_COLORS[source.medium]}`}
              />
              <div className="min-w-0">
                <div className="truncate text-sm text-cosmos-100">{source.title}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-cosmos-200/45">
                  {labels.sourceLabel} · {source.medium}
                </div>
              </div>
            </>
          ) : (
            <span className="text-sm text-cosmos-200/40">{labels.sourceEmpty}</span>
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
              <div className="min-w-0">
                <div className="truncate text-sm text-cosmos-100">{target.title}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-cosmos-200/45">
                  {labels.targetLabel} · {target.medium}
                </div>
              </div>
            </>
          ) : (
            <span className="text-sm text-cosmos-200/40">{labels.targetEmpty}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {source && target && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onCopyLink}
                disabled={isPending}
                title={copyFeedback === "success" ? labels.copied : copyFeedback === "error" ? labels.copyFailed : labels.copyLink}
                aria-label={copyFeedback === "success" ? labels.copied : copyFeedback === "error" ? labels.copyFailed : labels.copyLink}
              >
                {copyFeedback === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onOpenLink}
                disabled={isPending}
                title={labels.openLink}
                aria-label={labels.openLink}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onCopyPrompt}
                disabled={isPending}
                title={promptCopyFeedback === "success" ? labels.promptCopied : promptCopyFeedback === "error" ? labels.copyFailed : labels.copyPrompt}
                aria-label={promptCopyFeedback === "success" ? labels.promptCopied : promptCopyFeedback === "error" ? labels.copyFailed : labels.copyPrompt}
              >
                {promptCopyFeedback === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onSwap}
                disabled={isPending}
                title={labels.swap}
                aria-label={labels.swap}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onClear}
            disabled={isPending}
            title={labels.clear}
            aria-label={labels.clear}
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
              {labels.generating}
              <span
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-cosmos-100/40 border-t-cosmos-100/90 animate-spin"
                aria-hidden
              />
            </>
          ) : (
            <>
              {labels.generate}
              <Zap className="h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

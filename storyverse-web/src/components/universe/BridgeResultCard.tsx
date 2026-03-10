"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LatestResult } from "./useUniverseState";

interface BridgeResultCardProps {
  result: LatestResult;
  uiLocale: "en" | "ko";
}

const LABELS = {
  en: {
    copy: "Copy bridge summary",
    copyFull: "Copy full brief",
    copyTimeline: "Copy timeline beats",
    copyNeighbors: "Copy next hops",
    copied: "Copied",
    copyFailed: "Copy failed",
    sourceTarget: "Source → Target",
    timeline: "Timeline beats",
    risk: "Risk",
    neighbors: "Next story hops",
    shortcutHint: "Shortcuts: B full brief · T timeline · N next hops",
    noNeighbors: "No next hops yet",
  },
  ko: {
    copy: "브리지 요약 복사",
    copyFull: "전체 브리프 복사",
    copyTimeline: "타임라인 비트 복사",
    copyNeighbors: "다음 확장 후보 복사",
    copied: "복사됨",
    copyFailed: "복사 실패",
    sourceTarget: "출발 → 도착",
    timeline: "타임라인 비트",
    risk: "리스크",
    neighbors: "다음 확장 후보",
    shortcutHint: "단축키: B 전체 브리프 · T 타임라인 · N 다음 후보",
    noNeighbors: "아직 다음 후보가 없어요",
  },
} as const;

export function BridgeResultCard({ result, uiLocale }: BridgeResultCardProps) {
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [copyFullFeedback, setCopyFullFeedback] = useState<"idle" | "success" | "error">("idle");
  const [copyTimelineFeedback, setCopyTimelineFeedback] = useState<"idle" | "success" | "error">("idle");
  const [copyNeighborsFeedback, setCopyNeighborsFeedback] = useState<"idle" | "success" | "error">("idle");
  const labels = LABELS[uiLocale] ?? LABELS.en;
  const shareText = result
    ? [
        result.scenario.title,
        `${result.source.title} → ${result.target.title}`,
        "",
        result.scenario.bridge,
      ].join("\n")
    : "";
  const timelineShareText = result
    ? [
        result.scenario.title,
        `${labels.timeline}:`,
        ...result.scenario.timelineBeats.map((beat, index) => `${index + 1}. ${beat}`),
      ].join("\n")
    : "";
  const neighborsShareText = result
    ? [
        result.scenario.title,
        `${labels.neighbors}:`,
        ...(result.suggestions.length > 0
          ? result.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion.title}`)
          : [labels.noNeighbors]),
      ].join("\n")
    : "";
  const fullShareText = result
    ? [
        result.scenario.title,
        `${labels.sourceTarget}: ${result.source.title} → ${result.target.title}`,
        "",
        result.scenario.bridge,
        "",
        `${labels.timeline}:`,
        ...result.scenario.timelineBeats.map((beat, index) => `${index + 1}. ${beat}`),
        "",
        `${labels.risk}: ${result.scenario.risk}`,
        "",
        neighborsShareText,
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n")
    : "";

  const resetFeedback = (setter: (value: "idle" | "success" | "error" | ((current: "idle" | "success" | "error") => "idle" | "success" | "error")) => void) => {
    window.setTimeout(() => {
      setter((current) => (current === "idle" ? current : "idle"));
    }, 1500);
  };

  const handleCopy = useCallback(async () => {
    if (!shareText) return;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopyFeedback("success");
    } catch {
      setCopyFeedback("error");
    }

    resetFeedback(setCopyFeedback);
  }, [shareText]);

  const handleCopyFull = useCallback(async () => {
    if (!fullShareText) return;

    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopyFullFeedback("success");
    } catch {
      setCopyFullFeedback("error");
    }

    resetFeedback(setCopyFullFeedback);
  }, [fullShareText]);

  const handleCopyTimeline = useCallback(async () => {
    if (!timelineShareText) return;

    try {
      await navigator.clipboard.writeText(timelineShareText);
      setCopyTimelineFeedback("success");
    } catch {
      setCopyTimelineFeedback("error");
    }

    resetFeedback(setCopyTimelineFeedback);
  }, [timelineShareText]);

  const handleCopyNeighbors = useCallback(async () => {
    if (!neighborsShareText) return;

    try {
      await navigator.clipboard.writeText(neighborsShareText);
      setCopyNeighborsFeedback("success");
    } catch {
      setCopyNeighborsFeedback("error");
    }

    resetFeedback(setCopyNeighborsFeedback);
  }, [neighborsShareText]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (isEditable || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        void handleCopyFull();
        return;
      }

      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        void handleCopyTimeline();
        return;
      }

      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        void handleCopyNeighbors();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopyFull, handleCopyNeighbors, handleCopyTimeline]);

  if (!result) return null;

  const copyLabel =
    copyFeedback === "success"
      ? labels.copied
      : copyFeedback === "error"
        ? labels.copyFailed
        : labels.copy;
  const copyFullLabel =
    copyFullFeedback === "success"
      ? labels.copied
      : copyFullFeedback === "error"
        ? labels.copyFailed
        : labels.copyFull;
  const copyTimelineLabel =
    copyTimelineFeedback === "success"
      ? labels.copied
      : copyTimelineFeedback === "error"
        ? labels.copyFailed
        : labels.copyTimeline;
  const copyNeighborsLabel =
    copyNeighborsFeedback === "success"
      ? labels.copied
      : copyNeighborsFeedback === "error"
        ? labels.copyFailed
        : labels.copyNeighbors;

  return (
    <div className="animate-slide-up overflow-hidden rounded-2xl border border-cosmos-200/15 bg-panel/60 backdrop-blur-xl">
      <div className="flex">
        <div className="w-1 shrink-0 bg-gradient-to-b from-neon-violet via-neon-cyan to-neon-violet" />
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-base tracking-wide text-cosmos-100">
                {result.scenario.title}
              </h3>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-cosmos-200/50">
                <span>{result.source.title}</span>
                <span className="text-neon-cyan">→</span>
                <span>{result.target.title}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={handleCopy}
                title={copyLabel}
                aria-label={copyLabel}
              >
                {copyFeedback === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copyLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={handleCopyFull}
                title={copyFullLabel}
                aria-label={copyFullLabel}
              >
                {copyFullFeedback === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copyFullLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={handleCopyTimeline}
                title={copyTimelineLabel}
                aria-label={copyTimelineLabel}
              >
                {copyTimelineFeedback === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copyTimelineLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={handleCopyNeighbors}
                title={copyNeighborsLabel}
                aria-label={copyNeighborsLabel}
              >
                {copyNeighborsFeedback === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copyNeighborsLabel}
              </Button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-cosmos-200/90">
            {result.scenario.bridge}
          </p>
          <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-cosmos-200/40">
            {labels.sourceTarget}
          </div>
          <p className="mt-2 text-[10px] text-cosmos-300/55">
            {labels.shortcutHint}
          </p>
        </div>
      </div>
    </div>
  );
}

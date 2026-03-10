"use client";

import { useState } from "react";
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
    copied: "Copied",
    copyFailed: "Copy failed",
    sourceTarget: "Source → Target",
  },
  ko: {
    copy: "브리지 요약 복사",
    copied: "복사됨",
    copyFailed: "복사 실패",
    sourceTarget: "출발 → 도착",
  },
} as const;

export function BridgeResultCard({ result, uiLocale }: BridgeResultCardProps) {
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");

  if (!result) return null;

  const labels = LABELS[uiLocale] ?? LABELS.en;
  const shareText = [
    result.scenario.title,
    `${result.source.title} → ${result.target.title}`,
    "",
    result.scenario.bridge,
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyFeedback("success");
    } catch {
      setCopyFeedback("error");
    }

    window.setTimeout(() => {
      setCopyFeedback((current) => (current === "idle" ? current : "idle"));
    }, 1500);
  };

  const copyLabel =
    copyFeedback === "success"
      ? labels.copied
      : copyFeedback === "error"
        ? labels.copyFailed
        : labels.copy;

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
          </div>
          <p className="mt-3 text-sm leading-relaxed text-cosmos-200/90">
            {result.scenario.bridge}
          </p>
          <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-cosmos-200/40">
            {labels.sourceTarget}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Bot, Check, Copy, Sparkles } from "lucide-react";
import type { ChatMessage } from "./useUniverseState";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
  messages: ChatMessage[];
  uiLocale: "en" | "ko";
}

const QUERY_LOG_STORAGE_KEY = "storyverse-universe-query-log-open";

const LABELS = {
  en: {
    title: "Query Log",
    copy: "Copy query log",
    copied: "Query log copied",
    copyFailed: "Copy failed",
    shortcutHint: "Tip: keep this open to review recent bridge runs.",
    assistant: "assistant",
    user: "user",
  },
  ko: {
    title: "질의 로그",
    copy: "질의 로그 복사",
    copied: "질의 로그 복사됨",
    copyFailed: "복사 실패",
    shortcutHint: "팁: 최근 브리지 실행 흐름을 보려면 열어둔 채로 쓰세요.",
    assistant: "assistant",
    user: "user",
  },
} as const;

export function ChatHistory({ messages, uiLocale }: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const labels = LABELS[uiLocale] ?? LABELS.en;

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(QUERY_LOG_STORAGE_KEY);
      if (storedValue === "true") {
        setIsOpen(true);
      }
    } catch {
      // Ignore storage read failures and keep the log collapsed by default.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(QUERY_LOG_STORAGE_KEY, String(isOpen));
    } catch {
      // Ignore storage write failures and keep the log interactive.
    }
  }, [isOpen]);

  useEffect(() => {
    if (copyFeedback === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopyFeedback("idle");
    }, copyFeedback === "success" ? 1600 : 2200);

    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  const historyText = useMemo(
    () =>
      messages
        .slice(1)
        .map((message, index) => `${index + 1}. [${message.role}] ${message.content}`)
        .join("\n\n"),
    [messages],
  );

  const copyLabel =
    copyFeedback === "success"
      ? labels.copied
      : copyFeedback === "error"
        ? labels.copyFailed
        : labels.copy;

  // Only show if there are more than the initial welcome message
  if (messages.length <= 1) return null;

  return (
    <div className="rounded-2xl border border-cosmos-200/15 bg-panel/60 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left transition-colors hover:text-cosmos-100"
        >
          <div>
            <span className="font-display text-xs tracking-wider text-cosmos-200/60 uppercase">
              {labels.title} ({messages.length - 1})
            </span>
            <p className="mt-1 text-[11px] text-cosmos-300/45">{labels.shortcutHint}</p>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-cosmos-200/40" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-cosmos-200/40" />
          )}
        </button>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cosmos-200/15 px-2.5 py-1 text-[11px] text-cosmos-200/75 transition-colors hover:border-cosmos-200/30 hover:text-cosmos-100"
          onClick={() => {
            if (!historyText) {
              return;
            }

            void navigator.clipboard.writeText(historyText)
              .then(() => {
                setCopyFeedback("success");
              })
              .catch(() => {
                setCopyFeedback("error");
              });
          }}
          title={copyLabel}
          aria-label={copyLabel}
        >
          {copyFeedback === "success" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copyLabel}
        </button>
      </div>

      {isOpen && (
        <div className="max-h-64 space-y-2 overflow-y-auto border-t border-cosmos-200/10 p-4">
          {messages.slice(1).map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm leading-relaxed",
                message.role === "assistant"
                  ? "bg-cosmos-800/50 text-cosmos-200/80"
                  : "bg-neon-violet/10 text-cosmos-100",
              )}
            >
              <div className="mb-1 flex items-center gap-1.5 text-[10px] tracking-wider text-cosmos-200/40 uppercase">
                {message.role === "assistant" ? (
                  <Bot className="h-3 w-3 text-neon-cyan/60" />
                ) : (
                  <Sparkles className="h-3 w-3 text-neon-rose/60" />
                )}
                {message.role === "assistant" ? labels.assistant : labels.user}
              </div>
              <p className="whitespace-pre-wrap text-xs">{message.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

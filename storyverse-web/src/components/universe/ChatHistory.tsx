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
const QUERY_LOG_ROLE_FILTER_STORAGE_KEY = "storyverse-universe-query-log-role-filter";

type RoleFilter = "all" | "user" | "assistant";

const LABELS = {
  en: {
    title: "Query Log",
    copy: "Copy query log",
    copied: "Query log copied",
    copyFailed: "Copy failed",
    shortcutHint: "Tip: keep this open to review recent bridge runs.",
    searchPlaceholder: "Filter visible messages",
    clearSearch: "Clear search",
    noMatches: "No messages match that filter yet.",
    assistant: "assistant",
    user: "user",
    all: "all",
    visible: "visible",
  },
  ko: {
    title: "질의 로그",
    copy: "질의 로그 복사",
    copied: "질의 로그 복사됨",
    copyFailed: "복사 실패",
    shortcutHint: "팁: 최근 브리지 실행 흐름을 보려면 열어둔 채로 쓰세요.",
    searchPlaceholder: "표시 중인 메시지 필터",
    clearSearch: "검색 지우기",
    noMatches: "해당 필터에 맞는 메시지가 아직 없습니다.",
    assistant: "assistant",
    user: "user",
    all: "전체",
    visible: "표시 중",
  },
} as const;

export function ChatHistory({ messages, uiLocale }: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const labels = LABELS[uiLocale] ?? LABELS.en;

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(QUERY_LOG_STORAGE_KEY);
      if (storedValue === "true") {
        setIsOpen(true);
      }

      const storedRoleFilter = window.localStorage.getItem(QUERY_LOG_ROLE_FILTER_STORAGE_KEY);
      if (storedRoleFilter === "all" || storedRoleFilter === "user" || storedRoleFilter === "assistant") {
        setRoleFilter(storedRoleFilter);
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
    try {
      window.localStorage.setItem(QUERY_LOG_ROLE_FILTER_STORAGE_KEY, roleFilter);
    } catch {
      // Ignore storage write failures and keep the log interactive.
    }
  }, [roleFilter]);

  useEffect(() => {
    if (copyFeedback === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopyFeedback("idle");
    }, copyFeedback === "success" ? 1600 : 2200);

    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  const historyMessages = useMemo(() => messages.slice(1), [messages]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const roleFilteredMessages = useMemo(
    () => historyMessages.filter((message) => roleFilter === "all" || message.role === roleFilter),
    [historyMessages, roleFilter],
  );
  const visibleMessages = useMemo(
    () =>
      roleFilteredMessages.filter((message) => {
        if (!normalizedSearchQuery) {
          return true;
        }

        return `${message.role} ${message.content}`.toLowerCase().includes(normalizedSearchQuery);
      }),
    [normalizedSearchQuery, roleFilteredMessages],
  );
  const userMessageCount = useMemo(
    () => historyMessages.filter((message) => message.role === "user").length,
    [historyMessages],
  );
  const assistantMessageCount = useMemo(
    () => historyMessages.filter((message) => message.role === "assistant").length,
    [historyMessages],
  );
  const historyText = useMemo(
    () =>
      visibleMessages
        .map((message, index) => `${index + 1}. [${message.role}] ${message.content}`)
        .join("\n\n"),
    [visibleMessages],
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
              {labels.title} ({historyMessages.length})
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
        <div className="border-t border-cosmos-200/10 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-cosmos-200/65">
            {(["all", "user", "assistant"] as const).map((filter) => {
              const isActive = roleFilter === filter;
              const count =
                filter === "all"
                  ? historyMessages.length
                  : filter === "user"
                    ? userMessageCount
                    : assistantMessageCount;
              const label = filter === "all" ? labels.all : labels[filter];

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRoleFilter(filter)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 transition-colors",
                    isActive
                      ? "border-cosmos-200/40 bg-cosmos-200/10 text-cosmos-50"
                      : "border-cosmos-200/10 text-cosmos-200/65 hover:border-cosmos-200/25 hover:text-cosmos-100",
                  )}
                  aria-pressed={isActive}
                >
                  {label} {count}
                </button>
              );
            })}
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              aria-label={labels.searchPlaceholder}
              className="min-w-[11rem] flex-1 rounded-full border border-cosmos-200/10 bg-cosmos-950/30 px-3 py-1 text-[11px] text-cosmos-100 outline-none transition-colors placeholder:text-cosmos-300/35 focus:border-cosmos-200/30"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full border border-cosmos-200/10 px-2.5 py-1 text-cosmos-200/65 transition-colors hover:border-cosmos-200/25 hover:text-cosmos-100"
              >
                {labels.clearSearch}
              </button>
            ) : null}
            <span className="rounded-full border border-cosmos-200/10 px-2.5 py-1 text-cosmos-300/55">
              {labels.visible} {visibleMessages.length}/{roleFilteredMessages.length}
            </span>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {visibleMessages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-cosmos-200/10 px-3 py-4 text-xs text-cosmos-300/55">
                {normalizedSearchQuery ? labels.noMatches : `${labels.visible} 0`}
              </div>
            ) : (
              visibleMessages.map((message) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

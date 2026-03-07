"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STARTER_PROMPTS } from "./useUniverseState";

interface QueryInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRunQuery: (prompt: string) => void;
  recentQueries: string[];
  onClearRecentQueries: () => void;
  uiLocale: "en" | "ko";
  isPending: boolean;
}

export function QueryInput({
  query,
  onQueryChange,
  onSubmit,
  onRunQuery,
  recentQueries,
  onClearRecentQueries,
  uiLocale,
  isPending,
}: QueryInputProps) {
  const placeholder =
    uiLocale === "ko"
      ? '예시: "셜록 홈즈를 스타워즈와 연결해줘."'
      : 'Try: "Connect Sherlock Holmes to Star Wars."';
  const isSubmitDisabled = isPending || query.trim().length === 0;
  const starterPrompts = STARTER_PROMPTS[uiLocale] ?? STARTER_PROMPTS.en;
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [historyDraft, setHistoryDraft] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const isFocusShortcut =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.shiftKey &&
        !event.altKey;
      const isSlashFocusShortcut =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey;

      if (!isFocusShortcut && !isSlashFocusShortcut) {
        return;
      }

      if (isEditableTarget && target !== inputRef.current) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isPending) return;

    if (event.key === "Escape" && query.length > 0) {
      event.preventDefault();
      onQueryChange("");
      setHistoryIndex(null);
      setHistoryDraft("");
      return;
    }

    if (event.key === "ArrowUp" && recentQueries.length > 0) {
      event.preventDefault();
      if (historyIndex === null) {
        setHistoryDraft(query);
      }
      const nextIndex =
        historyIndex === null
          ? 0
          : Math.min(historyIndex + 1, recentQueries.length - 1);
      setHistoryIndex(nextIndex);
      onQueryChange(recentQueries[nextIndex] ?? "");
      return;
    }

    if (event.key === "ArrowDown" && recentQueries.length > 0) {
      event.preventDefault();
      if (historyIndex === null) {
        return;
      }
      const nextIndex = historyIndex - 1;
      if (nextIndex < 0) {
        setHistoryIndex(null);
        onQueryChange(historyDraft);
        return;
      }
      setHistoryIndex(nextIndex);
      onQueryChange(recentQueries[nextIndex] ?? "");
    }
  };

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={onSubmit}>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setHistoryIndex(null);
            setHistoryDraft("");
            onQueryChange(e.target.value);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          aria-label="Universe command query"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isSubmitDisabled}>
          {isPending ? (
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-cosmos-100/40 border-t-cosmos-100/90 animate-spin"
              aria-hidden
            />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </Button>
      </form>

      <p className="text-[10px] text-cosmos-200/50">
        {uiLocale === "ko"
          ? "팁: ↑/↓로 최근 실행 탐색 · Esc 로 입력 지우기 · / 또는 ⌘/Ctrl+K 로 포커스"
          : "Tip: ↑/↓ browses recent queries · Esc clears input · / or ⌘/Ctrl+K focuses input"}
      </p>

      {/* Starter prompts */}
      <div className="flex flex-wrap gap-1.5">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full border border-cosmos-700/50 bg-cosmos-900/40 px-2.5 py-1 text-[11px] text-cosmos-200/80 transition-colors hover:border-cosmos-500 hover:text-cosmos-100 disabled:opacity-50"
            onClick={() => onRunQuery(prompt)}
            disabled={isPending}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Recent queries */}
      {recentQueries.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-cosmos-200/60">
              {uiLocale === "ko" ? "최근 실행" : "Recent queries"}
            </p>
            <button
              type="button"
              className="text-[10px] uppercase tracking-wide text-cosmos-300/70 transition-colors hover:text-cosmos-100 disabled:opacity-50"
              onClick={onClearRecentQueries}
              disabled={isPending}
            >
              {uiLocale === "ko" ? "지우기" : "Clear"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentQueries.map((prompt, index) => {
              const isHistoryActive = historyIndex === index;
              return (
                <button
                  key={`recent-${index}-${prompt}`}
                  type="button"
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50 ${
                    isHistoryActive
                      ? "border-cosmos-400 bg-cosmos-800/70 text-cosmos-100"
                      : "border-cosmos-700/50 bg-cosmos-900/40 text-cosmos-200/80 hover:border-cosmos-500 hover:text-cosmos-100"
                  }`}
                  onClick={() => onRunQuery(prompt)}
                  disabled={isPending}
                  aria-current={isHistoryActive ? "true" : undefined}
                >
                  {prompt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

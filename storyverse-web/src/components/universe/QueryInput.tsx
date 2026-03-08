"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_QUERY_LENGTH, STARTER_PROMPTS } from "./useUniverseState";

interface QueryInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRunQuery: (prompt: string) => void;
  recentQueries: string[];
  onClearRecentQueries: () => void;
  onRemoveRecentQuery: (index: number) => void;
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
  onRemoveRecentQuery,
  uiLocale,
  isPending,
}: QueryInputProps) {
  const placeholder =
    uiLocale === "ko"
      ? '예시: "셜록 홈즈를 스타워즈와 연결해줘."'
      : 'Try: "Connect Sherlock Holmes to Star Wars."';
  const isSubmitDisabled = isPending || query.trim().length === 0;
  const starterPrompts = STARTER_PROMPTS[uiLocale] ?? STARTER_PROMPTS.en;
  const remainingChars = Math.max(0, MAX_QUERY_LENGTH - query.length);
  const isLimitReached = remainingChars === 0;
  const isNearLimit = remainingChars > 0 && remainingChars < 20;
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [historyDraft, setHistoryDraft] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canClearQuery = historyIndex !== null || query.length > 0;
  const clearQueryLabel =
    historyIndex !== null
      ? uiLocale === "ko"
        ? "히스토리 종료하고 원래 입력 복원"
        : "Exit history and restore draft"
      : uiLocale === "ko"
        ? "입력 지우기"
        : "Clear query";

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

      // Never hijack a literal slash while user is actively typing in an editable field.
      if (isSlashFocusShortcut && isEditableTarget) {
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

  useEffect(() => {
    if (historyIndex === null) {
      return;
    }

    if (recentQueries.length === 0) {
      setHistoryIndex(null);
      onQueryChange(historyDraft);
      return;
    }

    if (historyIndex >= recentQueries.length) {
      const nextIndex = recentQueries.length - 1;
      setHistoryIndex(nextIndex);
      onQueryChange(recentQueries[nextIndex] ?? "");
    }
  }, [historyDraft, historyIndex, onQueryChange, recentQueries]);

  const handleRemoveRecentQuery = (index: number) => {
    if (historyIndex !== null) {
      if (index === historyIndex) {
        setHistoryIndex(null);
        onQueryChange(historyDraft);
      } else if (index < historyIndex) {
        setHistoryIndex(historyIndex - 1);
      }
    }

    onRemoveRecentQuery(index);
  };

  const handleClearRecentQueries = () => {
    if (recentQueries.length <= 1) {
      onClearRecentQueries();
      return true;
    }

    const shouldClear = window.confirm(
      uiLocale === "ko"
        ? `최근 실행 ${recentQueries.length}개를 모두 지울까요?`
        : `Clear all ${recentQueries.length} recent queries?`,
    );

    if (!shouldClear) {
      return false;
    }

    onClearRecentQueries();
    return true;
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isPending) return;

    if (event.key === "Enter" && event.nativeEvent.isComposing) {
      event.preventDefault();
      return;
    }

    const target = event.currentTarget;
    const cursorStart = target.selectionStart ?? query.length;
    const cursorEnd = target.selectionEnd ?? query.length;
    const isCaretCollapsed = cursorStart === cursorEnd;
    const normalizedKey = event.key.toLowerCase();
    const usePrevHistoryShortcut =
      (event.ctrlKey || event.metaKey) &&
      normalizedKey === "p" &&
      !event.shiftKey &&
      !event.altKey;
    const useNextHistoryShortcut =
      (event.ctrlKey || event.metaKey) &&
      normalizedKey === "n" &&
      !event.shiftKey &&
      !event.altKey;
    const useRemoveHistoryShortcut =
      (event.ctrlKey || event.metaKey) &&
      (event.key === "Backspace" || event.key === "Delete") &&
      !event.shiftKey &&
      !event.altKey;
    const useClearAllHistoryShortcut =
      (event.ctrlKey || event.metaKey) &&
      (event.key === "Backspace" || event.key === "Delete") &&
      event.shiftKey &&
      !event.altKey;
    const useClearInputShortcut =
      (event.ctrlKey || event.metaKey) &&
      normalizedKey === "l" &&
      !event.shiftKey &&
      !event.altKey;
    const useOldestHistoryShortcut =
      historyIndex !== null &&
      event.key === "Home" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;
    const useNewestHistoryShortcut =
      historyIndex !== null &&
      event.key === "End" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;

    if (event.key === "Escape") {
      if (historyIndex !== null) {
        event.preventDefault();
        setHistoryIndex(null);
        onQueryChange(historyDraft);
        return;
      }

      if (query.length > 0) {
        event.preventDefault();
        onQueryChange("");
        setHistoryIndex(null);
        setHistoryDraft("");
        return;
      }
    }

    if (useClearInputShortcut) {
      if (historyIndex !== null || query.length > 0) {
        event.preventDefault();
        onQueryChange("");
        setHistoryIndex(null);
        setHistoryDraft("");
      }
      return;
    }

    if (useClearAllHistoryShortcut && recentQueries.length > 0) {
      event.preventDefault();
      const didClear = handleClearRecentQueries();
      if (didClear) {
        setHistoryIndex(null);
        setHistoryDraft("");
        onQueryChange("");
      }
      return;
    }

    if (useOldestHistoryShortcut && recentQueries.length > 0) {
      event.preventDefault();
      const oldestIndex = recentQueries.length - 1;
      setHistoryIndex(oldestIndex);
      onQueryChange(recentQueries[oldestIndex] ?? "");
      return;
    }

    if (useNewestHistoryShortcut && recentQueries.length > 0) {
      event.preventDefault();
      setHistoryIndex(0);
      onQueryChange(recentQueries[0] ?? "");
      return;
    }

    if (useRemoveHistoryShortcut && historyIndex !== null) {
      event.preventDefault();
      const nextQueries = recentQueries.filter((_, index) => index !== historyIndex);
      const removedIndex = historyIndex;
      onRemoveRecentQuery(removedIndex);

      if (nextQueries.length === 0) {
        setHistoryIndex(null);
        onQueryChange(historyDraft);
        return;
      }

      const nextIndex = Math.min(removedIndex, nextQueries.length - 1);
      setHistoryIndex(nextIndex);
      onQueryChange(nextQueries[nextIndex] ?? "");
      return;
    }

    if ((event.key === "ArrowUp" || usePrevHistoryShortcut) && recentQueries.length > 0) {
      // Keep native caret movement unless cursor is at the start (or history mode is active).
      if (
        !usePrevHistoryShortcut &&
        historyIndex === null &&
        (!isCaretCollapsed || cursorStart > 0)
      ) {
        return;
      }

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

    if ((event.key === "ArrowDown" || useNextHistoryShortcut) && recentQueries.length > 0) {
      // Keep native caret movement unless cursor is at the end (or history mode is active).
      if (
        !useNextHistoryShortcut &&
        historyIndex === null &&
        (!isCaretCollapsed || cursorEnd < query.length)
      ) {
        return;
      }

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
            onQueryChange(e.target.value.slice(0, MAX_QUERY_LENGTH));
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          aria-label="Universe command query"
          className="flex-1"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={isPending || !canClearQuery}
          onClick={() => {
            if (historyIndex !== null) {
              onQueryChange(historyDraft);
              setHistoryIndex(null);
            } else {
              onQueryChange("");
            }
            setHistoryDraft("");
            inputRef.current?.focus();
          }}
          aria-label={clearQueryLabel}
          title={clearQueryLabel}
        >
          <X className="h-4 w-4" />
        </Button>
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

      <p
        className={`text-[10px] ${isLimitReached ? "text-rose-300/90" : isNearLimit ? "text-amber-300/80" : "text-cosmos-200/50"}`}
        aria-live="polite"
      >
        {uiLocale === "ko"
          ? isLimitReached
            ? `입력 한도(${MAX_QUERY_LENGTH}자)에 도달했어요.`
            : `입력 가능 남은 글자: ${remainingChars}`
          : isLimitReached
            ? `Character limit reached (${MAX_QUERY_LENGTH}).`
            : `Remaining characters: ${remainingChars}`}
      </p>

      {historyIndex !== null && recentQueries.length > 0 && (
        <p className="text-[10px] text-cosmos-200/70" aria-live="polite">
          {uiLocale === "ko"
            ? `히스토리 탐색 중 ${historyIndex + 1}/${recentQueries.length} · Esc로 원래 입력 복귀`
            : `Browsing history ${historyIndex + 1}/${recentQueries.length} · press Esc to restore draft`}
        </p>
      )}

      <p className="text-[10px] text-cosmos-200/50">
        {uiLocale === "ko"
          ? "팁: 입력 맨앞/맨뒤에서 ↑/↓ 또는 Ctrl/⌘+P,N으로 최근 실행 탐색 · 히스토리 탐색 중 Home/End로 가장 오래된/최신 항목으로 점프 · Ctrl/⌘+Backspace/Delete로 현재 항목 삭제 · Ctrl/⌘+Shift+Backspace/Delete로 전체 삭제 · Esc 또는 Ctrl/⌘+L 로 히스토리 종료/입력 지우기 · 최근 실행 칩의 ×로 개별 삭제 · / 또는 ⌘/Ctrl+K 로 포커스"
          : "Tip: At input edges, ↑/↓ or Ctrl/⌘+P,N browses recent queries · while browsing history, Home/End jumps to oldest/newest · Ctrl/⌘+Backspace/Delete removes the active item · Ctrl/⌘+Shift+Backspace/Delete clears all recent queries · Esc or Ctrl/⌘+L exits history or clears input · use × on a recent chip to remove it · / or ⌘/Ctrl+K focuses input"}
      </p>

      {/* Starter prompts */}
      <div className="flex flex-wrap gap-1.5">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="max-w-full rounded-full border border-cosmos-700/50 bg-cosmos-900/40 px-2.5 py-1 text-[11px] text-cosmos-200/80 transition-colors hover:border-cosmos-500 hover:text-cosmos-100 disabled:opacity-50"
            onClick={() => onRunQuery(prompt)}
            disabled={isPending}
            title={prompt}
          >
            <span className="block max-w-[min(70vw,28rem)] truncate">{prompt}</span>
          </button>
        ))}
      </div>

      {/* Recent queries */}
      {recentQueries.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-cosmos-200/60">
              {uiLocale === "ko"
                ? `최근 실행 (${recentQueries.length})`
                : `Recent queries (${recentQueries.length})`}
            </p>
            <button
              type="button"
              className="text-[10px] uppercase tracking-wide text-cosmos-300/70 transition-colors hover:text-cosmos-100 disabled:opacity-50"
              onClick={handleClearRecentQueries}
              disabled={isPending}
              aria-label={uiLocale === "ko" ? "최근 실행 전체 지우기" : "Clear all recent queries"}
              title={uiLocale === "ko" ? "최근 실행 전체 지우기" : "Clear all recent queries"}
            >
              {uiLocale === "ko" ? "전체 지우기" : "Clear all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentQueries.map((prompt, index) => {
              const isHistoryActive = historyIndex === index;
              return (
                <div
                  key={`recent-${index}-${prompt}`}
                  className={`group flex max-w-full items-center overflow-hidden rounded-full border text-[11px] transition-colors ${
                    isHistoryActive
                      ? "border-cosmos-400 bg-cosmos-800/70 text-cosmos-100"
                      : "border-cosmos-700/50 bg-cosmos-900/40 text-cosmos-200/80 hover:border-cosmos-500 hover:text-cosmos-100"
                  }`}
                  aria-current={isHistoryActive ? "true" : undefined}
                >
                  <button
                    type="button"
                    className="max-w-[min(70vw,26rem)] truncate px-2.5 py-1 text-left"
                    onClick={() => onRunQuery(prompt)}
                    disabled={isPending}
                    title={prompt}
                  >
                    <span className="block max-w-[min(70vw,24rem)] truncate">{prompt}</span>
                  </button>
                  <button
                    type="button"
                    className="border-l border-cosmos-700/50 px-1.5 py-1 text-cosmos-300/70 transition-colors hover:text-cosmos-100 disabled:opacity-50"
                    onClick={() => handleRemoveRecentQuery(index)}
                    disabled={isPending}
                    aria-label={uiLocale === "ko" ? "해당 최근 항목 삭제" : "Remove recent query"}
                    title={uiLocale === "ko" ? "해당 최근 항목 삭제" : "Remove recent query"}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

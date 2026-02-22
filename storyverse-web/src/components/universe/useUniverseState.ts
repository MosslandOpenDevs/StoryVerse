"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import {
  runUniverseCommandAction,
  runUniverseCommandByNodeIdsAction,
} from "@/app/(universe)/universe/actions";
import {
  STORY_CATALOG,
  type StoryCatalogItem,
} from "@/lib/agents/catalog";
import type { QueryResolutionStrategy } from "@/lib/agents/queryParser";

type UniverseCommandActionResult = Awaited<
  ReturnType<typeof runUniverseCommandAction>
>;
type UniverseCommandActionSuccess = Extract<
  UniverseCommandActionResult,
  { ok: true }
>;
type UniverseCommandActionFailure = Extract<
  UniverseCommandActionResult,
  { ok: false }
>;
type ResolutionMetadata = UniverseCommandActionSuccess["result"]["resolution"];
export type RankedNodeCandidate = ResolutionMetadata["sourceCandidates"][number];

export type MessageRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
};

export type LatestResult = UniverseCommandActionSuccess["result"] | null;

export const STARTER_PROMPTS = [
  "Connect Sherlock Holmes to Star Wars.",
  "Bridge Cleopatra to Blade Runner.",
  "Show a path from Dune to the Roman Empire.",
  "셜록 홈즈를 스타워즈와 연결해줘.",
  "클레오파트라와 블레이드 러너 연결해줘.",
];

const RECENT_QUERIES_KEY = "storyverse:recent-queries";
const RECENT_QUERIES_LIMIT = 5;

function buildErrorReply(failure: UniverseCommandActionFailure): string {
  return `Command failed [${failure.code}]: ${failure.error}`;
}

function buildUnexpectedErrorReply(error: string): string {
  return `Command failed [CLIENT]: ${error}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown client error.";
}

function formatResolutionLabel(resolution: QueryResolutionStrategy): string {
  switch (resolution) {
    case "manual_selection":
      return "manual selection";
    case "explicit_pair":
      return "explicit command";
    case "mention_pair":
      return "mention-based";
    case "single_mention_fallback":
      return "single mention + fallback";
    case "default_fallback":
      return "default fallback";
    default:
      return "unknown";
  }
}

function buildClarificationPrompts(
  resolution: ResolutionMetadata,
  sourceTitle: string,
  targetTitle: string,
): string[] {
  const locale = resolution.locale;
  const sourceOptions = resolution.sourceCandidates.map((c) => c.title);
  const targetOptions = resolution.targetCandidates.map((c) => c.title);
  const prompts: string[] = [];
  const seen = new Set<string>();

  for (const sourceOption of sourceOptions) {
    for (const targetOption of targetOptions) {
      if (sourceOption === sourceTitle && targetOption === targetTitle) continue;
      const prompt =
        locale === "ko"
          ? `${sourceOption}를 ${targetOption}와 연결해줘.`
          : `Connect ${sourceOption} to ${targetOption}.`;
      if (seen.has(prompt)) continue;
      seen.add(prompt);
      prompts.push(prompt);
      if (prompts.length >= 3) return prompts;
    }
  }
  return prompts;
}

function buildAssistantSummary(result: UniverseCommandActionResult): string {
  if (!result.ok) return buildErrorReply(result);

  const r = result.result;
  const resolution = r.resolution;
  const suggestionText = r.suggestions
    .map((s, i) => `${i + 1}. ${s.title}`)
    .join(" | ");

  const lines = [
    `Bridge: ${r.scenario.bridge}`,
    `Source -> Target: ${r.source.title} -> ${r.target.title}`,
    `Resolution: ${formatResolutionLabel(resolution.strategy)} (${resolution.confidence}, ${resolution.locale})`,
    `Top neighbors: ${suggestionText}`,
    `Risk: ${r.scenario.risk}`,
  ];

  if (resolution.clarificationPrompt) {
    lines.push(`Clarify: ${resolution.clarificationPrompt}`);
  }
  return lines.join("\n");
}

function createMessage(role: MessageRole, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

export function findCatalogNode(nodeId: string): StoryCatalogItem | null {
  return STORY_CATALOG.find((item) => item.id === nodeId) ?? null;
}

export function useUniverseState(initialStoryId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      "Command Deck online. Ask me to connect any two stories in the universe.",
    ),
  ]);
  const [query, setQuery] = useState("");
  const [clarificationPrompts, setClarificationPrompts] = useState<string[]>(
    [],
  );
  const [sourceCandidates, setSourceCandidates] = useState<
    RankedNodeCandidate[]
  >([]);
  const [targetCandidates, setTargetCandidates] = useState<
    RankedNodeCandidate[]
  >([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialStoryId ?? "",
  );
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [uiLocale, setUiLocale] =
    useState<ResolutionMetadata["locale"]>("en");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [latestResult, setLatestResult] = useState<LatestResult>(null);
  const [isPending, startTransition] = useTransition();

  // Load recent queries from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_QUERIES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentQueries(
          parsed
            .filter((item): item is string => typeof item === "string")
            .slice(0, RECENT_QUERIES_LIMIT),
        );
      }
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  const pushRecentQuery = (rawQuery: string) => {
    const normalized = rawQuery.trim();
    if (!normalized) return;
    setRecentQueries((prev) => {
      const next = [
        normalized,
        ...prev.filter((item) => item !== normalized),
      ].slice(0, RECENT_QUERIES_LIMIT);
      try {
        window.localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(next));
      } catch {
        // Ignore write failures.
      }
      return next;
    });
  };

  const applyActionResult = (result: UniverseCommandActionResult) => {
    if (result.ok) {
      setUiLocale(result.result.resolution.locale);
      setLatestResult(result.result);
      setSelectedSourceId(result.result.source.id);
      setSelectedTargetId(result.result.target.id);
    }

    if (result.ok && result.result.resolution.needsClarification) {
      setSourceCandidates(result.result.resolution.sourceCandidates);
      setTargetCandidates(result.result.resolution.targetCandidates);
      setClarificationPrompts(
        buildClarificationPrompts(
          result.result.resolution,
          result.result.source.title,
          result.result.target.title,
        ),
      );
    } else {
      setSourceCandidates([]);
      setTargetCandidates([]);
      setClarificationPrompts([]);
    }

    setMessages((prev) => [
      ...prev,
      createMessage("assistant", buildAssistantSummary(result)),
    ]);
  };

  const runQuery = (rawQuery: string) => {
    if (isPending) return;
    const normalized = rawQuery.trim();
    if (!normalized) return;

    pushRecentQuery(normalized);
    setMessages((prev) => [...prev, createMessage("user", normalized)]);
    setQuery("");
    setClarificationPrompts([]);
    setSourceCandidates([]);
    setTargetCandidates([]);

    startTransition(() => {
      void runUniverseCommandAction(normalized)
        .then(applyActionResult)
        .catch((error: unknown) => {
          setSourceCandidates([]);
          setTargetCandidates([]);
          setClarificationPrompts([]);
          setMessages((prev) => [
            ...prev,
            createMessage(
              "assistant",
              buildUnexpectedErrorReply(
                `Unexpected client failure: ${getErrorMessage(error)}`,
              ),
            ),
          ]);
        });
    });
  };

  const runNodeSelectionQuery = (
    sourceId: string,
    targetId: string,
    prompt: string,
  ) => {
    if (isPending) return;

    pushRecentQuery(prompt);
    setMessages((prev) => [...prev, createMessage("user", prompt)]);
    setQuery("");
    setClarificationPrompts([]);
    setSourceCandidates([]);
    setTargetCandidates([]);

    startTransition(() => {
      void runUniverseCommandByNodeIdsAction(sourceId, targetId, prompt)
        .then(applyActionResult)
        .catch((error: unknown) => {
          setSourceCandidates([]);
          setTargetCandidates([]);
          setClarificationPrompts([]);
          setMessages((prev) => [
            ...prev,
            createMessage(
              "assistant",
              buildUnexpectedErrorReply(
                `Unexpected client failure: ${getErrorMessage(error)}`,
              ),
            ),
          ]);
        });
    });
  };

  const runCorrectedQuery = () => {
    if (isPending) return;
    const sourceTitle = sourceCandidates.find(
      (c) => c.id === selectedSourceId,
    )?.title;
    const targetTitle = targetCandidates.find(
      (c) => c.id === selectedTargetId,
    )?.title;
    if (!sourceTitle || !targetTitle || sourceTitle === targetTitle) return;

    const correctedPrompt =
      uiLocale === "ko"
        ? `${sourceTitle}를 ${targetTitle}와 연결해줘.`
        : `Connect ${sourceTitle} to ${targetTitle}.`;
    runNodeSelectionQuery(selectedSourceId, selectedTargetId, correctedPrompt);
  };

  const handleStoryCardClick = (storyId: string) => {
    if (selectedSourceId === "" || selectedSourceId === storyId) {
      setSelectedSourceId(storyId);
      setSelectedTargetId("");
    } else if (selectedTargetId === "" || selectedTargetId === storyId) {
      if (storyId === selectedSourceId) return;
      setSelectedTargetId(storyId);
    } else {
      // Both already selected — restart with new source
      setSelectedSourceId(storyId);
      setSelectedTargetId("");
      setLatestResult(null);
    }
  };

  const swapSelection = () => {
    setSelectedSourceId(selectedTargetId);
    setSelectedTargetId(selectedSourceId);
  };

  const clearSelection = () => {
    setSelectedSourceId("");
    setSelectedTargetId("");
    setLatestResult(null);
  };

  const generateBridge = () => {
    if (isPending) return;
    const source = findCatalogNode(selectedSourceId);
    const target = findCatalogNode(selectedTargetId);
    if (!source || !target || source.id === target.id) return;

    const prompt =
      uiLocale === "ko"
        ? `${source.title}를 ${target.title}와 연결해줘.`
        : `Connect ${source.title} to ${target.title}.`;
    runNodeSelectionQuery(source.id, target.id, prompt);
  };

  const submitQuery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runQuery(query);
  };

  const isCorrectedRunReady =
    selectedSourceId !== "" &&
    selectedTargetId !== "" &&
    selectedSourceId !== selectedTargetId;

  return {
    // State
    messages,
    query,
    setQuery,
    clarificationPrompts,
    sourceCandidates,
    targetCandidates,
    selectedSourceId,
    setSelectedSourceId,
    selectedTargetId,
    setSelectedTargetId,
    uiLocale,
    recentQueries,
    latestResult,
    isPending,
    isCorrectedRunReady,

    // Actions
    runQuery,
    runNodeSelectionQuery,
    runCorrectedQuery,
    handleStoryCardClick,
    swapSelection,
    clearSelection,
    generateBridge,
    submitQuery,
  };
}

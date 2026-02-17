"use client";

import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Bot, Compass, SendHorizontal, Sparkles } from "lucide-react";
import {
  runUniverseCommandAction,
  runUniverseCommandByNodeIdsAction,
} from "@/app/(universe)/universe/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  STORY_CATALOG,
  type StoryCatalogItem,
} from "@/lib/agents/catalog";
import type { QueryResolutionStrategy } from "@/lib/agents/queryParser";
import { cn } from "@/lib/utils";

type MessageRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
};

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
type RankedNodeCandidate = ResolutionMetadata["sourceCandidates"][number];
type CanvasSelectionSignal = {
  nodeId: string;
  token: number;
};

const STARTER_PROMPTS = [
  "Connect Sherlock Holmes to Star Wars.",
  "Bridge Cleopatra to Blade Runner.",
  "Show a path from Dune to the Roman Empire.",
  "셜록 홈즈를 스타워즈와 연결해줘.",
  "클레오파트라와 블레이드 러너 연결해줘.",
];
const RECENT_QUERIES_KEY = "storyverse:recent-queries";
const RECENT_QUERIES_LIMIT = 5;
const MANUAL_NODE_OPTIONS = [...STORY_CATALOG].sort((left, right) =>
  left.title.localeCompare(right.title),
);
const DEFAULT_MANUAL_SOURCE_ID = MANUAL_NODE_OPTIONS[0]?.id ?? "";
const DEFAULT_MANUAL_TARGET_ID =
  MANUAL_NODE_OPTIONS.find((item) => item.id !== DEFAULT_MANUAL_SOURCE_ID)?.id ??
  "";

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
  const sourceOptions = resolution.sourceCandidates.map(
    (candidate) => candidate.title,
  );
  const targetOptions = resolution.targetCandidates.map(
    (candidate) => candidate.title,
  );
  const prompts: string[] = [];
  const seen = new Set<string>();

  for (const sourceOption of sourceOptions) {
    for (const targetOption of targetOptions) {
      if (sourceOption === sourceTitle && targetOption === targetTitle) {
        continue;
      }
      const prompt =
        locale === "ko"
          ? `${sourceOption}를 ${targetOption}와 연결해줘.`
          : `Connect ${sourceOption} to ${targetOption}.`;
      if (seen.has(prompt)) {
        continue;
      }
      seen.add(prompt);
      prompts.push(prompt);
      if (prompts.length >= 3) {
        return prompts;
      }
    }
  }

  return prompts;
}

function formatCandidateLabel(candidate: RankedNodeCandidate): string {
  if (candidate.score <= 0) {
    return candidate.title;
  }

  return `${candidate.title} (${candidate.score})`;
}

function findCandidateTitle(
  candidates: RankedNodeCandidate[],
  candidateId: string,
): string | null {
  const candidate = candidates.find((item) => item.id === candidateId);
  return candidate?.title ?? null;
}

function findCatalogNode(nodeId: string): StoryCatalogItem | null {
  return STORY_CATALOG.find((item) => item.id === nodeId) ?? null;
}

function buildAssistantReplyFromResult(
  result: UniverseCommandActionResult,
): string {
  if (!result.ok) {
    return buildErrorReply(result);
  }

  const resolution = result.result.resolution;
  const isKorean = resolution.locale === "ko";
  const hintText =
    resolution.strategy === "default_fallback"
      ? isKorean
        ? 'Tip: 인식 가능한 노드를 찾지 못했습니다. "A를 B와 연결해줘." 형식으로 입력해 주세요.'
        : 'Tip: I could not detect known nodes. Try "Connect A to B."'
      : resolution.strategy === "single_mention_fallback"
        ? isKorean
          ? "Tip: 노드를 하나만 찾았습니다. 두 번째 노드를 함께 적어 주세요."
          : "Tip: I found one node; mention a second node for a stronger bridge."
        : null;

  const suggestionText = result.result.suggestions
    .map((suggestion, index) => `${index + 1}. ${suggestion.title}`)
    .join(" | ");

  const lines = [
    `Bridge: ${result.result.scenario.bridge}`,
    `Source -> Target: ${result.result.source.title} -> ${result.result.target.title}`,
    `Resolution: ${formatResolutionLabel(resolution.strategy)} (${resolution.confidence}, ${resolution.locale})`,
    `Top neighbors: ${suggestionText}`,
    `Risk: ${result.result.scenario.risk}`,
  ];

  if (resolution.clarificationPrompt) {
    lines.push(`Clarify: ${resolution.clarificationPrompt}`);
  }

  if (hintText) {
    lines.push(hintText);
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

interface CommandDeckProps {
  canvasSelectionSignal?: CanvasSelectionSignal | null;
}

export function CommandDeck({ canvasSelectionSignal }: CommandDeckProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      "Command Deck online. Ask me to connect any two stories in the universe.",
    ),
  ]);
  const [query, setQuery] = useState("");
  const [clarificationPrompts, setClarificationPrompts] = useState<string[]>([]);
  const [sourceCandidates, setSourceCandidates] = useState<RankedNodeCandidate[]>([]);
  const [targetCandidates, setTargetCandidates] = useState<RankedNodeCandidate[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [manualSourceId, setManualSourceId] = useState<string>(
    DEFAULT_MANUAL_SOURCE_ID,
  );
  const [manualTargetId, setManualTargetId] = useState<string>(
    DEFAULT_MANUAL_TARGET_ID,
  );
  const [autoRunCanvasBridge, setAutoRunCanvasBridge] = useState(false);
  const [nextCanvasSlot, setNextCanvasSlot] = useState<"source" | "target">(
    "source",
  );
  const [uiLocale, setUiLocale] = useState<ResolutionMetadata["locale"]>("en");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const lastAppliedCanvasSelectionToken = useRef<number | null>(null);
  const runNodeSelectionQueryRef = useRef<
    (sourceId: string, targetId: string, prompt: string) => void
  >(() => {});
  const isManualRunReady =
    manualSourceId !== "" &&
    manualTargetId !== "" &&
    manualSourceId !== manualTargetId;
  const isCorrectedRunReady =
    selectedSourceId !== "" &&
    selectedTargetId !== "" &&
    selectedSourceId !== selectedTargetId;
  const manualSourceTitle = findCatalogNode(manualSourceId)?.title ?? "";
  const manualTargetTitle = findCatalogNode(manualTargetId)?.title ?? "";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_QUERIES_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentQueries(
          parsed
            .filter((item): item is string => typeof item === "string")
            .slice(0, RECENT_QUERIES_LIMIT),
        );
      }
    } catch {
      // Ignore malformed local storage payloads.
    }
  }, []);

  const pushRecentQuery = (rawQuery: string) => {
    const normalizedQuery = rawQuery.trim();
    if (!normalizedQuery) {
      return;
    }

    setRecentQueries((prev) => {
      const next = [normalizedQuery, ...prev.filter((item) => item !== normalizedQuery)].slice(
        0,
        RECENT_QUERIES_LIMIT,
      );
      try {
        window.localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(next));
      } catch {
        // Ignore local storage write failures.
      }
      return next;
    });
  };

  const applyActionResult = (result: UniverseCommandActionResult) => {
    if (result.ok) {
      setUiLocale(result.result.resolution.locale);
      setManualSourceId(result.result.source.id);
      setManualTargetId(result.result.target.id);
      setNextCanvasSlot("source");
    }

    if (result.ok && result.result.resolution.needsClarification) {
      setSourceCandidates(result.result.resolution.sourceCandidates);
      setTargetCandidates(result.result.resolution.targetCandidates);
      setSelectedSourceId(result.result.source.id);
      setSelectedTargetId(result.result.target.id);
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
      setSelectedSourceId("");
      setSelectedTargetId("");
      setClarificationPrompts([]);
    }

    setMessages((prev) => [
      ...prev,
      createMessage("assistant", buildAssistantReplyFromResult(result)),
    ]);
  };

  const runQuery = (rawQuery: string) => {
    if (isPending) {
      return;
    }

    const normalizedQuery = rawQuery.trim();
    if (!normalizedQuery) {
      return;
    }

    pushRecentQuery(normalizedQuery);
    setMessages((prev) => [...prev, createMessage("user", normalizedQuery)]);
    setQuery("");
    setClarificationPrompts([]);
    setSourceCandidates([]);
    setTargetCandidates([]);
    setSelectedSourceId("");
    setSelectedTargetId("");

    startTransition(() => {
      void runUniverseCommandAction(normalizedQuery)
        .then((result) => {
          applyActionResult(result);
        })
        .catch((error: unknown) => {
          setSourceCandidates([]);
          setTargetCandidates([]);
          setSelectedSourceId("");
          setSelectedTargetId("");
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
    if (isPending) {
      return;
    }

    pushRecentQuery(prompt);
    setMessages((prev) => [...prev, createMessage("user", prompt)]);
    setQuery("");
    setClarificationPrompts([]);
    setSourceCandidates([]);
    setTargetCandidates([]);
    setSelectedSourceId("");
    setSelectedTargetId("");

    startTransition(() => {
      void runUniverseCommandByNodeIdsAction(sourceId, targetId, prompt)
        .then((result) => {
          applyActionResult(result);
        })
        .catch((error: unknown) => {
          setSourceCandidates([]);
          setTargetCandidates([]);
          setSelectedSourceId("");
          setSelectedTargetId("");
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

  runNodeSelectionQueryRef.current = runNodeSelectionQuery;

  useEffect(() => {
    if (!canvasSelectionSignal) {
      return;
    }
    if (isPending) {
      return;
    }
    if (lastAppliedCanvasSelectionToken.current === canvasSelectionSignal.token) {
      return;
    }
    lastAppliedCanvasSelectionToken.current = canvasSelectionSignal.token;

    const selectedNodeId = canvasSelectionSignal.nodeId;
    const selectedNode = findCatalogNode(selectedNodeId);
    if (!selectedNode) {
      return;
    }

    if (nextCanvasSlot === "source") {
      setManualSourceId(selectedNodeId);
      if (manualTargetId === selectedNodeId) {
        const fallback = MANUAL_NODE_OPTIONS.find(
          (item) => item.id !== selectedNodeId,
        );
        setManualTargetId(fallback?.id ?? selectedNodeId);
      }
      setNextCanvasSlot("target");
      return;
    }

    let resolvedSourceId = manualSourceId;
    const resolvedTargetId = selectedNodeId;
    if (manualSourceId === selectedNodeId) {
      const fallback = MANUAL_NODE_OPTIONS.find(
        (item) => item.id !== selectedNodeId,
      );
      resolvedSourceId = fallback?.id ?? selectedNodeId;
      setManualSourceId(resolvedSourceId);
    }
    setManualTargetId(resolvedTargetId);
    setNextCanvasSlot("source");

    if (autoRunCanvasBridge && resolvedSourceId !== resolvedTargetId) {
      const sourceNode = findCatalogNode(resolvedSourceId);
      const targetNode = findCatalogNode(resolvedTargetId);
      if (sourceNode && targetNode) {
        const prompt =
          uiLocale === "ko"
            ? `${sourceNode.title}를 ${targetNode.title}와 연결해줘.`
            : `Connect ${sourceNode.title} to ${targetNode.title}.`;
        runNodeSelectionQueryRef.current(sourceNode.id, targetNode.id, prompt);
      }
    }
  }, [
    autoRunCanvasBridge,
    canvasSelectionSignal,
    isPending,
    manualSourceId,
    manualTargetId,
    nextCanvasSlot,
    uiLocale,
  ]);

  const runCorrectedQuery = () => {
    if (isPending) {
      return;
    }

    const sourceTitle = findCandidateTitle(sourceCandidates, selectedSourceId);
    const targetTitle = findCandidateTitle(targetCandidates, selectedTargetId);
    if (!sourceTitle || !targetTitle || sourceTitle === targetTitle) {
      return;
    }

    const correctedPrompt =
      uiLocale === "ko"
        ? `${sourceTitle}를 ${targetTitle}와 연결해줘.`
        : `Connect ${sourceTitle} to ${targetTitle}.`;

    runNodeSelectionQuery(selectedSourceId, selectedTargetId, correctedPrompt);
  };

  const runManualSelectionQuery = () => {
    if (isPending) {
      return;
    }

    const sourceNode = findCatalogNode(manualSourceId);
    const targetNode = findCatalogNode(manualTargetId);
    if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) {
      return;
    }

    const manualPrompt =
      uiLocale === "ko"
        ? `${sourceNode.title}를 ${targetNode.title}와 연결해줘.`
        : `Connect ${sourceNode.title} to ${targetNode.title}.`;

    runNodeSelectionQuery(sourceNode.id, targetNode.id, manualPrompt);
  };

  const handleManualSourceChange = (nextSourceId: string) => {
    setManualSourceId(nextSourceId);
    setNextCanvasSlot("target");

    if (manualTargetId === nextSourceId) {
      const fallback = MANUAL_NODE_OPTIONS.find((item) => item.id !== nextSourceId);
      setManualTargetId(fallback?.id ?? nextSourceId);
    }
  };

  const handleManualTargetChange = (nextTargetId: string) => {
    setManualTargetId(nextTargetId);
    setNextCanvasSlot("source");

    if (manualSourceId === nextTargetId) {
      const fallback = MANUAL_NODE_OPTIONS.find((item) => item.id !== nextTargetId);
      setManualSourceId(fallback?.id ?? nextTargetId);
    }
  };

  const submitQuery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runQuery(query);
  };

  return (
    <section className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center p-4 md:items-start md:justify-end md:p-6">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-cosmos-200/20 bg-panel/80 p-4 shadow-nebula backdrop-blur-xl">
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base tracking-[0.14em] text-cosmos-100 uppercase">
              Command Deck
            </h2>
            <p className="mt-1 text-xs text-cosmos-200/70">
              Agentic bridge generation across story domains
            </p>
          </div>
          <Compass className="h-5 w-5 text-neon-cyan" />
        </header>

        <div className="mb-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-cosmos-700/60 bg-cosmos-950/55 p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm leading-relaxed",
                message.role === "assistant"
                  ? "bg-cosmos-800/70 text-cosmos-100"
                  : "bg-neon-violet/20 text-cosmos-100",
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase">
                {message.role === "assistant" ? (
                  <Bot className="h-3 w-3 text-neon-cyan" />
                ) : (
                  <Sparkles className="h-3 w-3 text-neon-rose" />
                )}
                {message.role}
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>

        <form className="space-y-3" onSubmit={submitQuery}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Try: "Connect Sherlock Holmes to Star Wars."'
            aria-label="Universe command query"
          />
          <div className="flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                size="sm"
                variant="ghost"
                className="h-auto rounded-full border border-cosmos-700/70 px-2.5 py-1 text-[11px] leading-tight text-cosmos-200 hover:border-cosmos-500"
                onClick={() => runQuery(prompt)}
                disabled={isPending}
              >
                {prompt}
              </Button>
            ))}
          </div>
          {recentQueries.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] text-cosmos-200/75">
                {uiLocale === "ko" ? "최근 실행" : "Recent queries"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recentQueries.map((prompt) => (
                  <Button
                    key={`recent-${prompt}`}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-auto rounded-full border border-cosmos-700/70 px-2.5 py-1 text-[11px] leading-tight text-cosmos-200 hover:border-cosmos-500"
                    onClick={() => runQuery(prompt)}
                    disabled={isPending}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {clarificationPrompts.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] text-cosmos-200/75">
                {uiLocale === "ko"
                  ? "해석 교정 제안"
                  : "Clarification suggestions"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {clarificationPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-auto rounded-full border border-neon-cyan/40 px-2.5 py-1 text-[11px] leading-tight text-cosmos-100 hover:border-neon-cyan"
                    onClick={() => runQuery(prompt)}
                    disabled={isPending}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {sourceCandidates.length > 0 && targetCandidates.length > 0 ? (
            <div className="space-y-2 rounded-md border border-cosmos-700/70 bg-cosmos-950/45 p-2">
              <p className="text-[11px] text-cosmos-200/75">
                {uiLocale === "ko" ? "감지된 노드 교정" : "Adjust detected nodes"}
              </p>
              <div className="space-y-1.5">
                <p className="text-[10px] tracking-[0.1em] text-cosmos-200/65 uppercase">
                  {uiLocale === "ko" ? "출발" : "Source"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sourceCandidates.map((candidate) => (
                    <Button
                      key={`source-${candidate.id}`}
                      type="button"
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-auto rounded-full border px-2.5 py-1 text-[11px] leading-tight",
                        selectedSourceId === candidate.id
                          ? "border-neon-cyan text-cosmos-100"
                          : "border-cosmos-700/70 text-cosmos-200 hover:border-cosmos-500",
                      )}
                      onClick={() => setSelectedSourceId(candidate.id)}
                      disabled={isPending}
                    >
                      {formatCandidateLabel(candidate)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] tracking-[0.1em] text-cosmos-200/65 uppercase">
                  {uiLocale === "ko" ? "도착" : "Target"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {targetCandidates.map((candidate) => (
                    <Button
                      key={`target-${candidate.id}`}
                      type="button"
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-auto rounded-full border px-2.5 py-1 text-[11px] leading-tight",
                        selectedTargetId === candidate.id
                          ? "border-neon-cyan text-cosmos-100"
                          : "border-cosmos-700/70 text-cosmos-200 hover:border-cosmos-500",
                      )}
                      onClick={() => setSelectedTargetId(candidate.id)}
                      disabled={isPending}
                    >
                      {formatCandidateLabel(candidate)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={runCorrectedQuery}
                  disabled={isPending || !isCorrectedRunReady}
                >
                  {uiLocale === "ko" ? "교정 질의 실행" : "Run corrected query"}
                </Button>
              </div>
            </div>
          ) : null}
          {MANUAL_NODE_OPTIONS.length > 1 ? (
            <div className="space-y-2 rounded-md border border-cosmos-700/70 bg-cosmos-950/45 p-2">
              <p className="text-[11px] text-cosmos-200/75">
                {uiLocale === "ko" ? "수동 노드 선택 실행" : "Manual node selection"}
              </p>
              <p className="text-[10px] text-cosmos-200/60">
                {uiLocale === "ko"
                  ? "캔버스의 강조된 카탈로그 노드를 클릭하면 Source/Target이 순서대로 채워집니다."
                  : "Click highlighted catalog nodes in the canvas to fill source/target in order."}
              </p>
              <p className="text-[11px] text-cosmos-100/85">
                {uiLocale === "ko"
                  ? `현재 선택: ${manualSourceTitle || "-"} → ${manualTargetTitle || "-"}`
                  : `Current pair: ${manualSourceTitle || "-"} → ${manualTargetTitle || "-"}`}
              </p>
              <div className="flex items-center justify-between gap-2 rounded-md border border-cosmos-700/70 bg-cosmos-950/55 px-2 py-1.5">
                <p className="text-[10px] text-cosmos-200/75">
                  {uiLocale === "ko"
                    ? "빠른 브리지 모드 (2회 클릭 후 자동 실행)"
                    : "Quick bridge mode (auto-run after two picks)"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-auto rounded-full border px-2.5 py-1 text-[10px] leading-tight",
                    autoRunCanvasBridge
                      ? "border-neon-cyan/70 text-cosmos-100"
                      : "border-cosmos-700/70 text-cosmos-200 hover:border-cosmos-500",
                  )}
                  onClick={() => setAutoRunCanvasBridge((prev) => !prev)}
                  disabled={isPending}
                >
                  {autoRunCanvasBridge
                    ? uiLocale === "ko"
                      ? "켜짐"
                      : "On"
                    : uiLocale === "ko"
                      ? "꺼짐"
                      : "Off"}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-[10px] tracking-[0.1em] text-cosmos-200/65 uppercase">
                  {uiLocale === "ko" ? "출발" : "Source"}
                  <select
                    className="w-full rounded-md border border-cosmos-700/70 bg-cosmos-950/85 px-2 py-1.5 text-[11px] normal-case tracking-normal text-cosmos-100 outline-none ring-neon-cyan/45 focus:ring-2"
                    value={manualSourceId}
                    onChange={(event) => handleManualSourceChange(event.target.value)}
                    disabled={isPending}
                  >
                    {MANUAL_NODE_OPTIONS.map((item) => (
                      <option key={`manual-source-${item.id}`} value={item.id}>
                        {item.title} ({item.medium})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-[10px] tracking-[0.1em] text-cosmos-200/65 uppercase">
                  {uiLocale === "ko" ? "도착" : "Target"}
                  <select
                    className="w-full rounded-md border border-cosmos-700/70 bg-cosmos-950/85 px-2 py-1.5 text-[11px] normal-case tracking-normal text-cosmos-100 outline-none ring-neon-cyan/45 focus:ring-2"
                    value={manualTargetId}
                    onChange={(event) => handleManualTargetChange(event.target.value)}
                    disabled={isPending}
                  >
                    {MANUAL_NODE_OPTIONS.map((item) => (
                      <option key={`manual-target-${item.id}`} value={item.id}>
                        {item.title} ({item.medium})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={runManualSelectionQuery}
                  disabled={isPending || !isManualRunReady}
                >
                  {uiLocale === "ko"
                    ? "수동 선택으로 실행"
                    : "Run with manual selection"}
                </Button>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs text-cosmos-200/70">
              {isPending
                ? uiLocale === "ko"
                  ? "명령 실행 중..."
                  : "Running bridge synthesis..."
                : nextCanvasSlot === "target"
                  ? uiLocale === "ko"
                    ? "캔버스에서 목표 노드를 1개 더 선택하면 자동 실행됩니다."
                    : "Pick a target node next in canvas for auto-run."
                  : uiLocale === "ko"
                    ? "빠른 실행이 필요하면 캔버스에서 노드를 연달아 2번 클릭해 주세요."
                    : "Need quick run? Click two catalog nodes in sequence on canvas."}
            </p>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={isPending}
            >
              {isPending
                ? uiLocale === "ko"
                  ? "실행 중..."
                  : "Running..."
                : uiLocale === "ko"
                  ? "실행"
                  : "Run"}
              {isPending ? (
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-cosmos-100/40 border-t-cosmos-100/90 align-middle animate-spin"
                  aria-hidden
                />
              ) : (
                <SendHorizontal className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

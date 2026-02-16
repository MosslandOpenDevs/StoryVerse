import { type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { STORY_CATALOG } from "./catalog";
import {
  navigatorAgent,
  type StoryNodeContext,
  type StorySuggestion,
} from "./navigatorAgent";
import {
  storytellerAgent,
  type StoryEndpoint,
  type WhatIfScenario,
} from "./storytellerAgent";
import {
  resolveQueryNodes,
  type QueryParserOptions,
  type QueryResolutionLocale,
  type QueryResolutionResult,
  type RankedNodeCandidate,
} from "./queryParser";

type ResolutionMetadata = Omit<QueryResolutionResult, "source" | "target">;

export interface UniverseCommandResult {
  query: string;
  source: StoryNodeContext;
  target: StoryNodeContext;
  resolution: ResolutionMetadata;
  suggestions: StorySuggestion[];
  scenario: WhatIfScenario;
}

function toEndpoint(node: StoryNodeContext): StoryEndpoint {
  return {
    id: node.id,
    title: node.title,
    medium: node.medium,
    summary: node.summary,
  };
}

function resolveModel(): LanguageModel | undefined {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    return undefined;
  }

  const openai = createOpenAI({ apiKey });
  return openai("gpt-4o-mini");
}

function normalizePreferredMedium(value: string): StoryNodeContext["medium"] | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "movie") {
    return "Movie";
  }
  if (normalized === "history") {
    return "History";
  }
  if (normalized === "novel") {
    return "Novel";
  }
  return null;
}

function resolveParserOptions(): QueryParserOptions | undefined {
  const preferredMediaRaw = process.env["QUERY_PREFERRED_MEDIA"];
  const ambiguityMarginRaw = process.env["QUERY_AMBIGUITY_MARGIN"];

  const preferredMediumOrder = preferredMediaRaw
    ? preferredMediaRaw
        .split(",")
        .map((value) => normalizePreferredMedium(value))
        .filter((value): value is StoryNodeContext["medium"] => value !== null)
    : [];

  const ambiguityMargin = ambiguityMarginRaw
    ? Number.parseInt(ambiguityMarginRaw, 10)
    : NaN;
  const hasAmbiguityMargin =
    Number.isFinite(ambiguityMargin) && ambiguityMargin >= 1 && ambiguityMargin <= 40;

  if (preferredMediumOrder.length === 0 && !hasAmbiguityMargin) {
    return undefined;
  }

  return {
    ...(preferredMediumOrder.length > 0 ? { preferredMediumOrder } : {}),
    ...(hasAmbiguityMargin ? { ambiguityMargin } : {}),
  };
}

function toSingleCandidate(
  node: StoryNodeContext,
  score = 100,
): RankedNodeCandidate[] {
  return [
    {
      id: node.id,
      title: node.title,
      score,
    },
  ];
}

function inferLocaleFromQuery(query: string): QueryResolutionLocale {
  return /[가-힣]/u.test(query) ? "ko" : "en";
}

function createManualResolutionMetadata(
  source: StoryNodeContext,
  target: StoryNodeContext,
  query: string,
): ResolutionMetadata {
  return {
    strategy: "manual_selection",
    confidence: "high",
    locale: inferLocaleFromQuery(query),
    needsClarification: false,
    sourceCandidates: toSingleCandidate(source),
    targetCandidates: toSingleCandidate(target),
  };
}

async function runUniverseCommandFromResolved(
  query: string,
  source: StoryNodeContext,
  target: StoryNodeContext,
  resolution: ResolutionMetadata,
): Promise<UniverseCommandResult> {
  const model = resolveModel();

  const [suggestions, scenario] = await Promise.all([
    navigatorAgent({
      currentNode: source,
      limit: 4,
      ...(model ? { model } : {}),
    }),
    storytellerAgent({
      source: toEndpoint(source),
      target: toEndpoint(target),
      ...(model ? { model } : {}),
    }),
  ]);

  return {
    query,
    source,
    target,
    resolution,
    suggestions,
    scenario,
  };
}

function findCatalogNodeById(nodeId: string): StoryNodeContext | null {
  return STORY_CATALOG.find((item) => item.id === nodeId) ?? null;
}

export async function runUniverseCommand(
  query: string,
): Promise<UniverseCommandResult> {
  const parserOptions = resolveParserOptions();
  const resolved = resolveQueryNodes(query, undefined, parserOptions);
  const { source, target, ...resolution } = resolved;

  return runUniverseCommandFromResolved(query, source, target, resolution);
}

export async function runUniverseCommandByNodeIds(
  sourceId: string,
  targetId: string,
  query?: string,
): Promise<UniverseCommandResult> {
  const source = findCatalogNodeById(sourceId);
  if (!source) {
    throw new Error(`Unknown source node id: ${sourceId}`);
  }

  const target = findCatalogNodeById(targetId);
  if (!target) {
    throw new Error(`Unknown target node id: ${targetId}`);
  }

  const queryText =
    query?.trim() || `Connect ${source.title} to ${target.title}.`;
  const resolution = createManualResolutionMetadata(source, target, queryText);

  return runUniverseCommandFromResolved(queryText, source, target, resolution);
}

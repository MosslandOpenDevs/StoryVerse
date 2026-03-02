import { STORY_CATALOG, type StoryCatalogItem } from "./catalog";

export type QueryResolutionStrategy =
  | "manual_selection"
  | "explicit_pair"
  | "mention_pair"
  | "single_mention_fallback"
  | "default_fallback";

export type QueryResolutionConfidence = "high" | "medium" | "low";
export type QueryResolutionLocale = "ko" | "en";

export type RankedNodeCandidate = {
  id: string;
  title: string;
  score: number;
};

export type QueryResolutionResult = {
  source: StoryCatalogItem;
  target: StoryCatalogItem;
  strategy: QueryResolutionStrategy;
  confidence: QueryResolutionConfidence;
  locale: QueryResolutionLocale;
  needsClarification: boolean;
  clarificationPrompt?: string;
  sourceCandidates: RankedNodeCandidate[];
  targetCandidates: RankedNodeCandidate[];
};

export type QueryParserOptions = {
  preferredMediumOrder?: StoryCatalogItem["medium"][];
  ambiguityMargin?: number;
};

type MentionedCatalogNode = {
  item: StoryCatalogItem;
  score: number;
  firstPosition: number;
};

type CatalogMatch = {
  item: StoryCatalogItem;
  score: number;
};

function normalizeInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferResolutionLocale(query: string): QueryResolutionLocale {
  return /[가-힣]/u.test(query) ? "ko" : "en";
}

export function extractPairFromQuery(query: string): [string, string] | null {
  const raw = query.trim();
  const pairPatterns = [
    /(?:connect|bridge|link)\s+(.+?)\s+to\s+(.+?)[.?!]*$/i,
    /(?:connect|bridge|link)\s+(.+?)\s+(?:and|with)\s+(.+?)[.?!]*$/i,
    /(?:show|find)\s+(?:a\s+)?path\s+from\s+(.+?)\s+to\s+(.+?)[.?!]*$/i,
    /(?:show|find)\s+(?:a\s+)?path\s+between\s+(.+?)\s+and\s+(.+?)[.?!]*$/i,
    /(?:what\s+if\s+)?(.+?)\s+(?:meets|versus|vs)\s+(.+?)[.?!]*$/i,
    /(?:what\s+if\s+)?(.+?)\s+x\s+(.+?)[.?!]*$/i,
    /(?:what\s+if\s+)?(.+?)\s*&\s*(.+?)[.?!]*$/i,
    /(.+?)\s*(?:를|을)\s+(.+?)\s*(?:와|과|랑|이랑)\s*(?:연결|브리지|링크|이어)(?:해\s*줘|해\s*주세요|줘|주세요)?[.?!]*$/u,
    /(.+?)\s*(?:와|과|랑|이랑)\s+(.+?)\s*(?:를|을)?\s*(?:연결|브리지|링크|이어)(?:해\s*줘|해\s*주세요|줘|주세요)?[.?!]*$/u,
    /(.+?)\s*(?:에서|부터)\s+(.+?)\s*(?:까지)\s*(?:경로|길)(?:를)?\s*(?:보여\s*줘|찾아\s*줘|보여\s*주세요|찾아\s*주세요)?[.?!]*$/u,
  ] as const;

  for (const pattern of pairPatterns) {
    const match = raw.match(pattern);
    if (match?.[1] && match[2]) {
      return [match[1], match[2]];
    }
  }

  const splitPattern = /^(.+?)\s*(?:->|vs\.?|\/)\s*(.+?)[.?!]*$/i;
  const splitMatch = raw.match(splitPattern);
  if (splitMatch?.[1] && splitMatch[2]) {
    return [splitMatch[1], splitMatch[2]];
  }

  return null;
}

function scoreCatalogMatch(input: string, item: StoryCatalogItem): number {
  const normalized = normalizeInput(input);
  if (!normalized) {
    return 0;
  }

  const title = normalizeInput(item.title);
  if (title === normalized) {
    return 100;
  }
  if (title.includes(normalized) || normalized.includes(title)) {
    return 80;
  }

  const aliasScore = item.aliases.reduce((maxScore, alias) => {
    const normalizedAlias = normalizeInput(alias);
    if (normalizedAlias === normalized) {
      return Math.max(maxScore, 90);
    }
    if (
      normalizedAlias.includes(normalized) ||
      normalized.includes(normalizedAlias)
    ) {
      return Math.max(maxScore, 70);
    }
    return maxScore;
  }, 0);

  return aliasScore;
}

function rankCatalogMatches(
  input: string,
  catalog: readonly StoryCatalogItem[],
  options?: QueryParserOptions,
): CatalogMatch[] {
  const preferredMediumOrder = options?.preferredMediumOrder ?? [];

  return catalog
    .map((item) => ({
      item,
      score:
        scoreCatalogMatch(input, item) +
        (() => {
          const mediumIndex = preferredMediumOrder.indexOf(item.medium);
          if (mediumIndex < 0) {
            return 0;
          }
          return Math.max(0, preferredMediumOrder.length - mediumIndex);
        })(),
    }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);
}

function pickNodeFromMatches(
  matches: CatalogMatch[],
  catalog: readonly StoryCatalogItem[],
  defaultIndex: number,
): StoryCatalogItem {
  if (matches[0]) {
    return matches[0].item;
  }

  const fallback = catalog[defaultIndex] ?? catalog[0];
  if (!fallback) {
    throw new Error("Story catalog is empty.");
  }
  return fallback;
}

function isAmbiguous(
  matches: CatalogMatch[],
  options?: QueryParserOptions,
): boolean {
  const first = matches[0];
  const second = matches[1];
  const ambiguityMargin = options?.ambiguityMargin ?? 15;

  if (!first) {
    return true;
  }

  if (!second) {
    return first.score < 80;
  }

  if (first.score >= 95) {
    return false;
  }

  return first.score - second.score <= ambiguityMargin;
}

function toRankedCandidates(
  matches: CatalogMatch[],
  fallback: StoryCatalogItem,
  limit = 3,
): RankedNodeCandidate[] {
  const ranked = matches.slice(0, limit).map((match) => ({
    id: match.item.id,
    title: match.item.title,
    score: match.score,
  }));

  if (ranked.some((candidate) => candidate.id === fallback.id)) {
    return ranked;
  }

  return [
    {
      id: fallback.id,
      title: fallback.title,
      score: 0,
    },
    ...ranked,
  ].slice(0, limit);
}

function singleCandidate(
  node: StoryCatalogItem,
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

function findTokenPosition(normalizedQuery: string, candidate: string): number {
  if (!candidate) {
    return -1;
  }

  const queryWithBoundaries = ` ${normalizedQuery} `;
  const candidateWithBoundaries = ` ${candidate} `;
  const boundaryPosition = queryWithBoundaries.indexOf(candidateWithBoundaries);
  if (boundaryPosition >= 0) {
    return boundaryPosition;
  }

  if (/[가-힣]/u.test(candidate)) {
    return normalizedQuery.indexOf(candidate);
  }

  return -1;
}

function findMentionedNodes(
  query: string,
  catalog: readonly StoryCatalogItem[],
): StoryCatalogItem[] {
  const normalizedQuery = normalizeInput(query);
  if (!normalizedQuery) {
    return [];
  }

  const candidates: MentionedCatalogNode[] = [];

  for (const item of catalog) {
    const titleToken = normalizeInput(item.title);
    const aliasTokens = item.aliases.map((alias) => normalizeInput(alias)).filter(Boolean);
    const tokens = [titleToken, ...aliasTokens];
    let bestScore = 0;
    let bestPosition = Number.POSITIVE_INFINITY;

    for (const token of tokens) {
      const position = findTokenPosition(normalizedQuery, token);
      if (position < 0) {
        continue;
      }

      const isTitleToken = token === titleToken;
      const tokenLengthBonus = Math.min(token.length, 30);
      const mentionScore = (isTitleToken ? 120 : 95) + tokenLengthBonus;

      if (mentionScore > bestScore) {
        bestScore = mentionScore;
      }
      if (position < bestPosition) {
        bestPosition = position;
      }
    }

    if (bestScore > 0) {
      candidates.push({
        item,
        score: bestScore,
        firstPosition: bestPosition,
      });
    }
  }

  return candidates
    .sort((left, right) => {
      if (left.firstPosition !== right.firstPosition) {
        return left.firstPosition - right.firstPosition;
      }
      return right.score - left.score;
    })
    .map((candidate) => candidate.item);
}

function sortByPreferredMedium(
  items: readonly StoryCatalogItem[],
  preferredMediumOrder: StoryCatalogItem["medium"][],
): StoryCatalogItem[] {
  if (preferredMediumOrder.length === 0) {
    return [...items];
  }

  return [...items].sort((left, right) => {
    const leftIndex = preferredMediumOrder.indexOf(left.medium);
    const rightIndex = preferredMediumOrder.indexOf(right.medium);
    const normalizedLeft = leftIndex < 0 ? Number.POSITIVE_INFINITY : leftIndex;
    const normalizedRight = rightIndex < 0 ? Number.POSITIVE_INFINITY : rightIndex;
    return normalizedLeft - normalizedRight;
  });
}

function resolveFallbackTarget(
  source: StoryCatalogItem,
  catalog: readonly StoryCatalogItem[],
  options?: QueryParserOptions,
): StoryCatalogItem {
  const candidates = catalog.filter((item) => item.id !== source.id);
  if (candidates.length === 0) {
    return source;
  }

  const preferredMediumOrder = options?.preferredMediumOrder ?? [];
  const ordered = sortByPreferredMedium(candidates, preferredMediumOrder);
  return ordered[0] ?? source;
}

function resolveDefaultPair(
  catalog: readonly StoryCatalogItem[],
  options?: QueryParserOptions,
): [StoryCatalogItem, StoryCatalogItem] {
  const preferredMediumOrder = options?.preferredMediumOrder ?? [];
  const orderedCatalog = sortByPreferredMedium(catalog, preferredMediumOrder);
  const source = orderedCatalog[0] ?? catalog[0];
  const target =
    source &&
    resolveFallbackTarget(source, orderedCatalog, options);

  if (!source || !target) {
    throw new Error("Story catalog must contain at least two nodes.");
  }

  return [source, target];
}

function ensureDifferentNodes(
  first: StoryCatalogItem,
  second: StoryCatalogItem,
  catalog: readonly StoryCatalogItem[],
): [StoryCatalogItem, StoryCatalogItem] {
  if (first.id !== second.id) {
    return [first, second];
  }

  const fallback = catalog.find((item) => item.id !== first.id);
  return [first, fallback ?? second];
}

function buildExplicitClarificationPrompt(
  locale: QueryResolutionLocale,
  sourceAmbiguous: boolean,
  targetAmbiguous: boolean,
  sourceCandidates: RankedNodeCandidate[],
  targetCandidates: RankedNodeCandidate[],
): string | null {
  const prompts: string[] = [];

  if (sourceAmbiguous) {
    const sourceOptions = sourceCandidates
      .slice(0, 2)
      .map((candidate) => candidate.title)
      .join(" / ");
    if (sourceOptions) {
      prompts.push(
        locale === "ko"
          ? `출발 노드 후보: ${sourceOptions}`
          : `source could be ${sourceOptions}`,
      );
    }
  }

  if (targetAmbiguous) {
    const targetOptions = targetCandidates
      .slice(0, 2)
      .map((candidate) => candidate.title)
      .join(" / ");
    if (targetOptions) {
      prompts.push(
        locale === "ko"
          ? `도착 노드 후보: ${targetOptions}`
          : `target could be ${targetOptions}`,
      );
    }
  }

  if (prompts.length === 0) {
    return null;
  }

  if (locale === "ko") {
    return `확인이 필요합니다: ${prompts.join("; ")}.`;
  }
  return `Please clarify: ${prompts.join("; ")}.`;
}

function buildResult(
  base: Omit<QueryResolutionResult, "clarificationPrompt">,
  clarificationPrompt?: string,
): QueryResolutionResult {
  if (!clarificationPrompt) {
    return base;
  }

  return {
    ...base,
    clarificationPrompt,
  };
}

function joinCandidateTitles(
  locale: QueryResolutionLocale,
  candidates: RankedNodeCandidate[],
  limit = 2,
): string {
  const titles = candidates
    .slice(0, limit)
    .map((candidate) => candidate.title)
    .filter(Boolean);

  if (titles.length === 0) {
    return locale === "ko" ? "추천 노드 없음" : "no suggestions";
  }
  return titles.join(locale === "ko" ? " 또는 " : " or ");
}

export function resolveNodesFromQuery(
  query: string,
  catalog: readonly StoryCatalogItem[] = STORY_CATALOG,
  options?: QueryParserOptions,
): [StoryCatalogItem, StoryCatalogItem] {
  const resolved = resolveQueryNodes(query, catalog, options);
  return [resolved.source, resolved.target];
}

export function resolveQueryNodes(
  query: string,
  catalog: readonly StoryCatalogItem[] = STORY_CATALOG,
  options?: QueryParserOptions,
): QueryResolutionResult {
  const locale = inferResolutionLocale(query);
  const explicitPair = extractPairFromQuery(query);
  if (explicitPair) {
    const sourceMatches = rankCatalogMatches(explicitPair[0], catalog, options);
    const targetMatches = rankCatalogMatches(explicitPair[1], catalog, options);
    const sourceNode = pickNodeFromMatches(sourceMatches, catalog, 0);
    const targetNode = pickNodeFromMatches(targetMatches, catalog, 1);
    const [source, target] = ensureDifferentNodes(sourceNode, targetNode, catalog);
    const sourceCandidates = toRankedCandidates(sourceMatches, source);
    const targetCandidates = toRankedCandidates(targetMatches, target);
    const sourceAmbiguous = isAmbiguous(sourceMatches, options);
    const targetAmbiguous = isAmbiguous(targetMatches, options);
    const needsClarification = sourceAmbiguous || targetAmbiguous;
    const confidence: QueryResolutionConfidence = needsClarification
      ? "low"
      : sourceMatches[0] && targetMatches[0] && sourceMatches[0].score >= 90 && targetMatches[0].score >= 90
        ? "high"
        : "medium";
    const clarificationPrompt = buildExplicitClarificationPrompt(
      locale,
      sourceAmbiguous,
      targetAmbiguous,
      sourceCandidates,
      targetCandidates,
    );

    return buildResult(
      {
        source,
        target,
        strategy: "explicit_pair",
        confidence,
        locale,
        needsClarification,
        sourceCandidates,
        targetCandidates,
      },
      clarificationPrompt ?? undefined,
    );
  }

  const mentionedNodes = findMentionedNodes(query, catalog);
  if (mentionedNodes[0] && mentionedNodes[1]) {
    const [source, target] = ensureDifferentNodes(
      mentionedNodes[0],
      mentionedNodes[1],
      catalog,
    );
    return {
      source,
      target,
      strategy: "mention_pair",
      confidence: "high",
      locale,
      needsClarification: false,
      sourceCandidates: singleCandidate(source),
      targetCandidates: singleCandidate(target),
    };
  }

  if (mentionedNodes[0]) {
    const source = mentionedNodes[0];
    const defaultTarget = resolveFallbackTarget(source, catalog, options);
    const [resolvedSource, resolvedTarget] = ensureDifferentNodes(
      source,
      defaultTarget,
      catalog,
    );
    const preferredMediumOrder = options?.preferredMediumOrder ?? [];
    const targetCandidates = sortByPreferredMedium(
      catalog.filter((item) => item.id !== resolvedSource.id),
      preferredMediumOrder,
    )
      .slice(0, 3)
      .map((item, index) => ({
        id: item.id,
        title: item.title,
        score: Math.max(0, 70 - index * 10),
      }));
    const suggestionHint = joinCandidateTitles(locale, targetCandidates);

    return buildResult(
      {
        source: resolvedSource,
        target: resolvedTarget,
        strategy: "single_mention_fallback",
        confidence: "low",
        locale,
        needsClarification: true,
        sourceCandidates: singleCandidate(resolvedSource),
        targetCandidates,
      },
      locale === "ko"
        ? `노드를 하나만 찾았습니다. 두 번째 노드를 지정해 주세요 (예: ${suggestionHint}).`
        : `I detected only one node. Please specify a second node (for example: ${suggestionHint}).`,
    );
  }

  const [source, target] = resolveDefaultPair(catalog, options);
  const preferredMediumOrder = options?.preferredMediumOrder ?? [];
  const orderedCatalog = sortByPreferredMedium(catalog, preferredMediumOrder);
  const sourceCandidates = orderedCatalog.slice(0, 3).map((item, index) => ({
    id: item.id,
    title: item.title,
    score: Math.max(0, 60 - index * 10),
  }));
  const targetCandidates = orderedCatalog
    .filter((item) => item.id !== source.id)
    .slice(0, 3)
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      score: Math.max(0, 60 - index * 10),
    }));
  const sourceHint = sourceCandidates[0]?.title;
  const targetHint = targetCandidates[0]?.title;

  return buildResult(
    {
      source,
      target,
      strategy: "default_fallback",
      confidence: "low",
      locale,
      needsClarification: true,
      sourceCandidates,
      targetCandidates,
    },
    locale === "ko"
      ? sourceHint && targetHint
        ? `질의를 명확히 해석하지 못했습니다. 예: "${sourceHint}를 ${targetHint}와 연결해줘."`
        : '질의를 명확히 해석하지 못했습니다. "A를 B와 연결해줘."처럼 직접 지정해 주세요.'
      : sourceHint && targetHint
        ? `I could not confidently map your query. Try: "Connect ${sourceHint} to ${targetHint}."`
        : 'I could not confidently map your query. Try a direct command like "Connect A to B."',
  );
}

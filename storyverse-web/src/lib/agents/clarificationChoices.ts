import type { QueryResolutionLocale, RankedNodeCandidate } from "./queryParser";

export interface ClarificationChoice {
  sourceId: string;
  targetId: string;
  prompt: string;
}

interface BuildClarificationChoicesInput {
  locale: QueryResolutionLocale;
  sourceCandidates: RankedNodeCandidate[];
  targetCandidates: RankedNodeCandidate[];
  selectedSourceId: string;
  selectedTargetId: string;
  maxChoices?: number;
}

function hasBatchim(text: string): boolean {
  const trimmed = text.trim();
  const lastChar = trimmed.at(-1);
  if (!lastChar) return false;
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function withObjectParticle(word: string): string {
  return `${word}${hasBatchim(word) ? "을" : "를"}`;
}

function withAndParticle(word: string): string {
  return `${word}${hasBatchim(word) ? "과" : "와"}`;
}

function toPrompt(
  locale: QueryResolutionLocale,
  sourceTitle: string,
  targetTitle: string,
): string {
  return locale === "ko"
    ? `${withObjectParticle(sourceTitle)} ${withAndParticle(targetTitle)} 연결해줘.`
    : `Connect ${sourceTitle} to ${targetTitle}.`;
}

export function buildClarificationChoices({
  locale,
  sourceCandidates,
  targetCandidates,
  selectedSourceId,
  selectedTargetId,
  maxChoices = 3,
}: BuildClarificationChoicesInput): ClarificationChoice[] {
  if (maxChoices <= 0) return [];

  const choices: ClarificationChoice[] = [];
  const seenPairIds = new Set<string>();

  for (const sourceOption of sourceCandidates) {
    for (const targetOption of targetCandidates) {
      if (
        sourceOption.id === selectedSourceId &&
        targetOption.id === selectedTargetId
      ) {
        continue;
      }

      const pairKey = `${sourceOption.id}::${targetOption.id}`;
      if (seenPairIds.has(pairKey)) continue;
      seenPairIds.add(pairKey);

      choices.push({
        sourceId: sourceOption.id,
        targetId: targetOption.id,
        prompt: toPrompt(locale, sourceOption.title, targetOption.title),
      });
      if (choices.length >= maxChoices) return choices;
    }
  }

  return choices;
}

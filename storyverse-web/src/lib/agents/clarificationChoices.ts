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

function toPrompt(
  locale: QueryResolutionLocale,
  sourceTitle: string,
  targetTitle: string,
): string {
  return locale === "ko"
    ? `${sourceTitle}를 ${targetTitle}와 연결해줘.`
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

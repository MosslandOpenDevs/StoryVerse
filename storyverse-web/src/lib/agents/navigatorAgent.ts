import { generateText, type LanguageModel } from "ai";
import neo4j from "neo4j-driver";

export type StoryMedium = "Movie" | "History" | "Novel";

export interface StoryNodeContext {
  id: string;
  title: string;
  medium: StoryMedium;
  summary: string;
}

export interface NavigatorAgentInput {
  currentNode: StoryNodeContext;
  limit?: number;
  model?: LanguageModel;
  /**
   * Real catalog nodes used to build neighbour suggestions when the graph is
   * unavailable or returns nothing. Every fallback suggestion references a real
   * catalog id so it stays selectable/generatable in the UI.
   */
  catalog?: StoryNodeContext[];
}

export interface StorySuggestion {
  id: string;
  title: string;
  medium: StoryMedium;
  explanation: string;
  graphScore: number;
}

const NAVIGATOR_SYSTEM_PROMPT = `
You are NavigatorAgent for StoryVerse.
Use GraphRAG reasoning to rank related stories by narrative adjacency.
Favor high thematic overlap, causal influence, and character/idea lineage.
Respond with one title per line sorted from strongest to weakest.
`.trim();

const RELATED_STORY_QUERY = `
MATCH (origin:Story {id: $storyId})-[:RELATED_TO]-(candidate:Story)
RETURN
  candidate.id AS id,
  candidate.title AS title,
  candidate.medium AS medium,
  coalesce(candidate.summary, '') AS summary,
  coalesce(candidate.rank, 0.0) AS graphScore
ORDER BY graphScore DESC
LIMIT $limit
`;

function createDriver() {
  const uri = process.env["NEO4J_URI"];
  const username = process.env["NEO4J_USERNAME"];
  const password = process.env["NEO4J_PASSWORD"];

  if (!uri || !username || !password) {
    return null;
  }

  return neo4j.driver(uri, neo4j.auth.basic(username, password));
}

function normalizeMedium(mediumValue: unknown): StoryMedium {
  if (
    mediumValue === "Movie" ||
    mediumValue === "History" ||
    mediumValue === "Novel"
  ) {
    return mediumValue;
  }

  return "Novel";
}

async function fetchGraphNeighbors(
  storyId: string,
  limit: number,
): Promise<StorySuggestion[]> {
  const driver = createDriver();
  if (!driver) {
    return [];
  }

  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(RELATED_STORY_QUERY, { storyId, limit });
    return result.records.map((record) => {
      const idValue = record.get("id");
      const titleValue = record.get("title");
      const mediumValue = record.get("medium");
      const summaryValue = record.get("summary");
      const graphScoreValue = record.get("graphScore");

      return {
        id: String(idValue),
        title: String(titleValue),
        medium: normalizeMedium(mediumValue),
        explanation: String(summaryValue || "Related through graph proximity."),
        graphScore: Number(graphScoreValue) || 0,
      };
    });
  } finally {
    await session.close();
    await driver.close();
  }
}

function buildFallbackSuggestions(
  context: StoryNodeContext,
  limit: number,
  catalog: StoryNodeContext[],
): StorySuggestion[] {
  // Suggest real catalog stories (never synthetic ids), so every suggestion is
  // selectable and can be bridged. Lead with cross-medium picks for variety,
  // then same-medium, preserving catalog order within each group.
  const others = catalog.filter((item) => item.id !== context.id);
  const crossMedium = others.filter((item) => item.medium !== context.medium);
  const sameMedium = others.filter((item) => item.medium === context.medium);

  return [...crossMedium, ...sameMedium].slice(0, limit).map((item, index) => ({
    id: item.id,
    title: item.title,
    medium: item.medium,
    explanation:
      item.medium === context.medium
        ? `Same medium (${item.medium}) — catalog suggestion while the graph is unavailable.`
        : `Cross-medium (${context.medium} ↔ ${item.medium}) — catalog suggestion while the graph is unavailable.`,
    graphScore: Math.max(0.1, 1 - index * 0.15),
  }));
}

function reorderByModelText(
  candidates: StorySuggestion[],
  modelText: string,
): StorySuggestion[] {
  const rankedTitles = new Set(
    modelText
      .split("\n")
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean),
  );

  return [...candidates].sort(
    (left, right) =>
      Number(rankedTitles.has(right.title)) - Number(rankedTitles.has(left.title)),
  );
}

export async function navigatorAgent(
  input: NavigatorAgentInput,
): Promise<StorySuggestion[]> {
  const limit = input.limit ?? 6;
  const graphCandidates = await fetchGraphNeighbors(input.currentNode.id, limit);
  const candidates =
    graphCandidates.length > 0
      ? graphCandidates
      : buildFallbackSuggestions(input.currentNode, limit, input.catalog ?? []);

  if (!input.model) {
    return candidates.slice(0, limit);
  }

  const candidateLines = candidates
    .map((candidate, index) => `${index + 1}. ${candidate.title} (${candidate.medium})`)
    .join("\n");

  const { text } = await generateText({
    model: input.model,
    system: NAVIGATOR_SYSTEM_PROMPT,
    prompt: `
Current node: ${input.currentNode.title} (${input.currentNode.medium})
Summary: ${input.currentNode.summary}

Candidates:
${candidateLines}
    `.trim(),
  });

  return reorderByModelText(candidates, text).slice(0, limit);
}

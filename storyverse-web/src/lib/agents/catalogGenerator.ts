import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import neo4j from "neo4j-driver";
import {
  invalidateCatalogCache,
  appendGeneratedFile,
  getFullCatalog,
} from "./catalog";
import type { StoryMedium } from "./navigatorAgent";

const OLLAMA_BASE_URL =
  process.env["OLLAMA_BASE_URL"] || "http://100.126.186.77:11434/v1";
const OLLAMA_MODEL = process.env["OLLAMA_MODEL"] || "qwen3:32b";

const MEDIA: StoryMedium[] = ["Movie", "History", "Novel"];

const GENERATION_SYSTEM_PROMPT = `You are a story catalog curator for StoryVerse — an AI-powered narrative bridge engine.
Generate unique, well-known stories for a given domain (Movie, History, or Novel).

Requirements:
- Each story must be a real, widely recognized work or historical topic
- Do NOT duplicate any story already in the catalog (listed below)
- Provide a concise 1-sentence summary focused on thematic essence
- Provide 2-4 aliases (alternative names, abbreviations, Korean names)
- Generate a URL-safe slug id (lowercase, hyphens, no special chars)

Respond ONLY with valid JSON — an array of objects with fields:
  id (string), title (string), medium (string), summary (string), aliases (string[])

Do not include markdown fences, explanations, or anything outside the JSON array.`;

function createDriver() {
  const uri = process.env["NEO4J_URI"];
  const username = process.env["NEO4J_USERNAME"];
  const password = process.env["NEO4J_PASSWORD"];

  if (!uri || !username || !password) {
    return null;
  }

  return neo4j.driver(uri, neo4j.auth.basic(username, password));
}

function createModel() {
  const ollama = createOpenAI({
    baseURL: OLLAMA_BASE_URL,
    apiKey: "ollama",
  });
  return ollama(OLLAMA_MODEL);
}

interface GeneratedStory {
  id: string;
  title: string;
  medium: StoryMedium;
  summary: string;
  aliases: string[];
}

export interface GenerationResult {
  generated: GeneratedStory[];
  skipped: string[];
  errors: string[];
}

async function generateStoriesForDomain(
  domain: StoryMedium,
  count: number,
  existingTitles: Set<string>,
  existingIds: Set<string>,
): Promise<{ stories: GeneratedStory[]; error?: string }> {
  const model = createModel();
  const existingList = [...existingTitles].join(", ");

  let text: string;
  try {
    const result = await generateText({
      model,
      system: GENERATION_SYSTEM_PROMPT,
      prompt: `Generate ${count} ${domain} stories.

Already in catalog (DO NOT duplicate): ${existingList}

Return a JSON array of ${count} ${domain} story objects.`,
    });
    text = result.text;
  } catch (err) {
    return {
      stories: [],
      error: `AI generation failed for ${domain}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as unknown[];

    if (!Array.isArray(parsed)) {
      return { stories: [], error: "AI did not return a JSON array." };
    }

    const stories: GeneratedStory[] = [];

    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("title" in item) ||
        !("summary" in item)
      ) {
        continue;
      }

      const obj = item as Record<string, unknown>;
      const id = String(obj["id"]).toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const title = String(obj["title"]);

      if (existingIds.has(id) || existingTitles.has(title.toLowerCase())) {
        continue;
      }

      const aliases = Array.isArray(obj["aliases"])
        ? (obj["aliases"] as unknown[]).filter(
            (a): a is string => typeof a === "string",
          )
        : [];

      stories.push({
        id,
        title,
        medium: domain,
        summary: String(obj["summary"]),
        aliases,
      });

      existingIds.add(id);
      existingTitles.add(title.toLowerCase());
    }

    return { stories };
  } catch {
    return { stories: [], error: `Failed to parse AI response for ${domain}.` };
  }
}

async function writeStoriesToNeo4j(stories: GeneratedStory[]): Promise<void> {
  const driver = createDriver();
  if (!driver) {
    throw new Error("Neo4j not configured.");
  }

  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    for (const story of stories) {
      await session.run(
        `MERGE (s:Story {id: $id})
         SET s.title = $title,
             s.medium = $medium,
             s.summary = $summary,
             s.aliases = $aliases,
             s.isCatalog = true,
             s.createdAt = coalesce(s.createdAt, datetime())`,
        {
          id: story.id,
          title: story.title,
          medium: story.medium,
          summary: story.summary,
          aliases: story.aliases,
        },
      );
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

/**
 * Generate new stories via AI and persist them in Neo4j.
 *
 * @param countPerDomain — number of new stories to generate per domain (Movie/History/Novel)
 */
export async function generateCatalogStories(
  countPerDomain = 4,
): Promise<GenerationResult> {
  // Load all existing stories (seed + Neo4j + file) to avoid duplication
  const fullCatalog = await getFullCatalog();
  const existingTitles = new Set(
    fullCatalog.map((item) => item.title.toLowerCase()),
  );
  const existingIds = new Set(fullCatalog.map((item) => item.id));

  const allGenerated: GeneratedStory[] = [];
  const allSkipped: string[] = [];
  const allErrors: string[] = [];

  for (const domain of MEDIA) {
    const { stories, error } = await generateStoriesForDomain(
      domain,
      countPerDomain,
      existingTitles,
      existingIds,
    );

    if (error) {
      allErrors.push(error);
    }

    allGenerated.push(...stories);
  }

  if (allGenerated.length > 0) {
    // Try Neo4j first, fall back to file-based storage
    try {
      await writeStoriesToNeo4j(allGenerated);
    } catch (err) {
      allErrors.push(
        `Neo4j write failed (using file fallback): ${err instanceof Error ? err.message : "unknown"}`,
      );
    }

    // Always persist to file as backup / fallback
    appendGeneratedFile(allGenerated);
    invalidateCatalogCache();
  }

  return {
    generated: allGenerated,
    skipped: allSkipped,
    errors: allErrors,
  };
}

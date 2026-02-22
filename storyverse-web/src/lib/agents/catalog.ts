import fs from "node:fs";
import path from "node:path";
import neo4j from "neo4j-driver";
import type { StoryNodeContext } from "./navigatorAgent";
import { SEED_CATALOG } from "./catalogSeed";

// Re-export for server-side consumers
export { SEED_CATALOG };
export type { StoryCatalogItem } from "./catalogSeed";

/** @deprecated Use getFullCatalog() for dynamic catalog. */
export const STORY_CATALOG = SEED_CATALOG;

// ---------------------------------------------------------------------------
// Dynamic catalog: SEED + generated stories (Neo4j or file-based fallback)
// ---------------------------------------------------------------------------

type StoryCatalogItem = StoryNodeContext & { aliases: string[] };

const SEED_IDS = new Set(SEED_CATALOG.map((item) => item.id));

let cachedCatalog: StoryCatalogItem[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// File-based fallback storage when Neo4j is not available
const GENERATED_FILE = path.join(
  process.cwd(),
  "data",
  "generated-catalog.json",
);

function createDriver() {
  const uri = process.env["NEO4J_URI"];
  const username = process.env["NEO4J_USERNAME"];
  const password = process.env["NEO4J_PASSWORD"];

  if (!uri || !username || !password) {
    return null;
  }

  return neo4j.driver(uri, neo4j.auth.basic(username, password));
}

function normalizeMedium(value: unknown): StoryNodeContext["medium"] {
  if (value === "Movie" || value === "History" || value === "Novel") {
    return value;
  }
  return "Novel";
}

function parseAliases(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

async function fetchGeneratedFromNeo4j(): Promise<StoryCatalogItem[]> {
  const driver = createDriver();
  if (!driver) {
    return [];
  }

  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (s:Story {isCatalog: true})
       RETURN s.id AS id, s.title AS title, s.medium AS medium,
              coalesce(s.summary, '') AS summary,
              coalesce(s.aliases, []) AS aliases
       ORDER BY s.createdAt DESC`,
    );

    return result.records
      .map((record) => ({
        id: String(record.get("id")),
        title: String(record.get("title")),
        medium: normalizeMedium(record.get("medium")),
        summary: String(record.get("summary")),
        aliases: parseAliases(record.get("aliases")),
      }))
      .filter((item) => !SEED_IDS.has(item.id));
  } catch {
    return [];
  } finally {
    await session.close();
    await driver.close();
  }
}

// ---------------------------------------------------------------------------
// File-based generated catalog (fallback when Neo4j is unavailable)
// ---------------------------------------------------------------------------

function readGeneratedFile(): StoryCatalogItem[] {
  try {
    if (!fs.existsSync(GENERATED_FILE)) return [];
    const raw = fs.readFileSync(GENERATED_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoryCatalogItem =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "title" in item,
    );
  } catch {
    return [];
  }
}

export function appendGeneratedFile(stories: StoryCatalogItem[]): void {
  try {
    const dir = path.dirname(GENERATED_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const existing = readGeneratedFile();
    const existingIds = new Set(existing.map((s) => s.id));
    const newStories = stories.filter((s) => !existingIds.has(s.id));
    const merged = [...existing, ...newStories];
    fs.writeFileSync(GENERATED_FILE, JSON.stringify(merged, null, 2), "utf-8");
  } catch {
    // Silently fail — file writes are best-effort
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns seed catalog + AI-generated stories.
 * Tries Neo4j first, falls back to local file storage.
 * Results are cached for 5 minutes. Server-only.
 */
export async function getFullCatalog(): Promise<StoryCatalogItem[]> {
  if (cachedCatalog && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedCatalog;
  }

  // Try Neo4j first
  const fromNeo4j = await fetchGeneratedFromNeo4j();

  // Fall back to file if Neo4j returned nothing
  const generated = fromNeo4j.length > 0 ? fromNeo4j : readGeneratedFile();

  cachedCatalog = [...SEED_CATALOG, ...generated];
  cachedAt = Date.now();
  return cachedCatalog;
}

/** Invalidate the in-memory cache (called after generation). */
export function invalidateCatalogCache(): void {
  cachedCatalog = null;
  cachedAt = 0;
}

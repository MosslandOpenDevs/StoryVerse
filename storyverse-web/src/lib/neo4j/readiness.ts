import neo4j from "neo4j-driver";

export interface Neo4jReadiness {
  // "skipped" = not configured (intentional degraded mode, still ready);
  // "ok" = reachable; "down" = configured but unreachable.
  status: "ok" | "down" | "skipped";
  latencyMs?: number;
  error?: string;
}

const CACHE_TTL_MS = 10_000;
let cache: { at: number; value: Neo4jReadiness } | null = null;

/**
 * Lightweight connectivity probe for readiness checks. Returns "skipped" when
 * Neo4j is not configured (degraded mode is a valid state), "ok" when reachable,
 * and "down" when configured but unreachable within `timeoutMs`. Results are
 * cached briefly so frequent health polls don't hammer the database.
 */
export async function checkNeo4jReadiness(
  timeoutMs = 1500,
): Promise<Neo4jReadiness> {
  const uri = process.env["NEO4J_URI"];
  const username = process.env["NEO4J_USERNAME"];
  const password = process.env["NEO4J_PASSWORD"];

  if (!uri || !username || !password) {
    return { status: "skipped" };
  }

  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const startedAt = Date.now();
  let value: Neo4jReadiness;
  try {
    await Promise.race([
      driver.verifyConnectivity(),
      new Promise((_resolve, reject) =>
        setTimeout(
          () => reject(new Error(`Neo4j readiness timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
    value = { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    value = {
      status: "down",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await driver.close().catch(() => {});
  }

  cache = { at: Date.now(), value };
  return value;
}

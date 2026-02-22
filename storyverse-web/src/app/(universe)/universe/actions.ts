"use server";

import {
  runUniverseCommand,
  runUniverseCommandByNodeIds,
  type UniverseCommandResult,
} from "@/lib/agents/orchestrator";
import { getFullCatalog, type StoryCatalogItem } from "@/lib/agents/catalog";

const ACTION_TIMEOUT_MS = 15000;
const ACTION_MAX_ATTEMPTS = 2;
const ACTION_RETRY_BASE_DELAY_MS = 150;

class ActionTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Action timed out after ${timeoutMs}ms.`);
    this.name = "ActionTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new ActionTimeoutError(timeoutMs));
    }, timeoutMs);

    void promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function isTimeoutError(error: unknown): error is ActionTimeoutError {
  return error instanceof ActionTimeoutError;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export type UniverseCommandErrorCode =
  | "EMPTY_QUERY"
  | "INVALID_SELECTION"
  | "TIMEOUT"
  | "EXECUTION_FAILED";

export interface UniverseCommandActionSuccess {
  ok: true;
  result: UniverseCommandResult;
}

export interface UniverseCommandActionFailure {
  ok: false;
  code: UniverseCommandErrorCode;
  error: string;
}

export type UniverseCommandActionResult =
  | UniverseCommandActionSuccess
  | UniverseCommandActionFailure;

async function isValidCatalogNodeId(nodeId: string): Promise<boolean> {
  const catalog = await getFullCatalog();
  return catalog.some((item) => item.id === nodeId);
}

async function executeCommand(
  run: () => Promise<UniverseCommandResult>,
  context: Record<string, unknown>,
): Promise<UniverseCommandActionResult> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= ACTION_MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await withTimeout(run(), ACTION_TIMEOUT_MS);
      return {
        ok: true,
        result,
      };
    } catch (error) {
      lastError = error;
      if (isTimeoutError(error)) {
        break;
      }

      if (attempt < ACTION_MAX_ATTEMPTS) {
        await sleep(ACTION_RETRY_BASE_DELAY_MS * attempt);
        continue;
      }
    }
  }

  console.error("Universe command action failed", {
    ...context,
    error: lastError,
  });

  if (isTimeoutError(lastError)) {
    return {
      ok: false,
      code: "TIMEOUT",
      error: `Command timed out after ${ACTION_TIMEOUT_MS / 1000}s. Try a shorter prompt.`,
    };
  }

  return {
    ok: false,
    code: "EXECUTION_FAILED",
    error: "Command execution failed. Check AI/Neo4j configuration and retry.",
  };
}

export async function runUniverseCommandAction(
  query: string,
): Promise<UniverseCommandActionResult> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      ok: false,
      code: "EMPTY_QUERY",
      error: "Query is empty. Ask to connect two story nodes.",
    };
  }

  return executeCommand(() => runUniverseCommand(trimmedQuery), {
    action: "runUniverseCommandAction",
    query: trimmedQuery,
  });
}

export async function runUniverseCommandByNodeIdsAction(
  sourceId: string,
  targetId: string,
  query = "",
): Promise<UniverseCommandActionResult> {
  const normalizedSourceId = sourceId.trim();
  const normalizedTargetId = targetId.trim();

  if (!normalizedSourceId || !normalizedTargetId) {
    return {
      ok: false,
      code: "INVALID_SELECTION",
      error: "Source/target node selection is required.",
    };
  }

  if (normalizedSourceId === normalizedTargetId) {
    return {
      ok: false,
      code: "INVALID_SELECTION",
      error: "Source and target must be different nodes.",
    };
  }

  if (
    !(await isValidCatalogNodeId(normalizedSourceId)) ||
    !(await isValidCatalogNodeId(normalizedTargetId))
  ) {
    return {
      ok: false,
      code: "INVALID_SELECTION",
      error: "Selected nodes are not available in the catalog.",
    };
  }

  return executeCommand(
    () =>
      runUniverseCommandByNodeIds(
        normalizedSourceId,
        normalizedTargetId,
        query,
      ),
    {
      action: "runUniverseCommandByNodeIdsAction",
      sourceId: normalizedSourceId,
      targetId: normalizedTargetId,
      query,
    },
  );
}

export async function fetchCatalogAction(): Promise<StoryCatalogItem[]> {
  return getFullCatalog();
}

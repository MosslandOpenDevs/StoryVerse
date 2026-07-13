"use server";

import {
  runUniverseCommand,
  runUniverseCommandByNodeIds,
  type UniverseCommandResult,
} from "@/lib/agents/orchestrator";
import { getFullCatalog, type StoryCatalogItem } from "@/lib/agents/catalog";
import {
  executeCommand,
  emptyQueryFailure,
  validateNodeSelection,
  type CommandErrorCode,
} from "@/lib/agents/commandRunner";

export type UniverseCommandErrorCode = CommandErrorCode;

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

function logActionError(error: unknown, context: Record<string, unknown>): void {
  console.error("Universe command action failed", { ...context, error });
}

async function isValidCatalogNodeId(nodeId: string): Promise<boolean> {
  const catalog = await getFullCatalog();
  return catalog.some((item) => item.id === nodeId);
}

export async function runUniverseCommandAction(
  query: string,
): Promise<UniverseCommandActionResult> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return emptyQueryFailure();
  }

  return executeCommand(
    () => runUniverseCommand(trimmedQuery),
    { action: "runUniverseCommandAction", query: trimmedQuery },
    { onError: logActionError },
  );
}

export async function runUniverseCommandByNodeIdsAction(
  sourceId: string,
  targetId: string,
  query = "",
): Promise<UniverseCommandActionResult> {
  const selectionFailure = await validateNodeSelection(
    sourceId,
    targetId,
    isValidCatalogNodeId,
  );
  if (selectionFailure) {
    return selectionFailure;
  }

  return executeCommand(
    () =>
      runUniverseCommandByNodeIds(sourceId.trim(), targetId.trim(), query),
    {
      action: "runUniverseCommandByNodeIdsAction",
      sourceId: sourceId.trim(),
      targetId: targetId.trim(),
      query,
    },
    { onError: logActionError },
  );
}

export async function fetchCatalogAction(): Promise<StoryCatalogItem[]> {
  return getFullCatalog();
}

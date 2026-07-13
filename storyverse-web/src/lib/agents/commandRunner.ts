// Pure, framework-free core for the universe server actions: timeout + retry
// execution and selection validation. Kept out of the "use server" file so it
// can be unit-tested with the node:test parser-tests harness.

export const ACTION_TIMEOUT_MS = 15000;
export const ACTION_MAX_ATTEMPTS = 2;
export const ACTION_RETRY_BASE_DELAY_MS = 150;

export type CommandErrorCode =
  | "EMPTY_QUERY"
  | "INVALID_SELECTION"
  | "TIMEOUT"
  | "EXECUTION_FAILED";

export interface CommandFailure {
  ok: false;
  code: CommandErrorCode;
  error: string;
}

export type CommandRun<T> = { ok: true; result: T } | CommandFailure;

export class ActionTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Action timed out after ${timeoutMs}ms.`);
    this.name = "ActionTimeoutError";
  }
}

export function isTimeoutError(error: unknown): error is ActionTimeoutError {
  return error instanceof ActionTimeoutError;
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
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

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ExecuteOptions {
  timeoutMs?: number;
  maxAttempts?: number;
  retryBaseDelayMs?: number;
  onError?: (error: unknown, context: Record<string, unknown>) => void;
}

/**
 * Runs `run` with a per-attempt timeout and bounded retries. Timeouts fail fast
 * (never retried); other failures retry with linear backoff up to maxAttempts.
 */
export async function executeCommand<T>(
  run: () => Promise<T>,
  context: Record<string, unknown>,
  options: ExecuteOptions = {},
): Promise<CommandRun<T>> {
  const timeoutMs = options.timeoutMs ?? ACTION_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? ACTION_MAX_ATTEMPTS;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? ACTION_RETRY_BASE_DELAY_MS;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await withTimeout(run(), timeoutMs);
      return { ok: true, result };
    } catch (error) {
      lastError = error;
      if (isTimeoutError(error)) {
        break;
      }

      if (attempt < maxAttempts) {
        await sleep(retryBaseDelayMs * attempt);
        continue;
      }
    }
  }

  options.onError?.(lastError, context);

  if (isTimeoutError(lastError)) {
    return {
      ok: false,
      code: "TIMEOUT",
      error: `Command timed out after ${Math.round(timeoutMs / 1000)}s. Try a shorter prompt.`,
    };
  }

  return {
    ok: false,
    code: "EXECUTION_FAILED",
    error: "Command execution failed. Check AI/Neo4j configuration and retry.",
  };
}

export function emptyQueryFailure(): CommandFailure {
  return {
    ok: false,
    code: "EMPTY_QUERY",
    error: "Query is empty. Ask to connect two story nodes.",
  };
}

/**
 * Validates a source/target node-id selection. Returns a failure describing the
 * problem, or null when the selection is valid.
 */
export async function validateNodeSelection(
  sourceId: string,
  targetId: string,
  isValidId: (id: string) => boolean | Promise<boolean>,
): Promise<CommandFailure | null> {
  const source = sourceId.trim();
  const target = targetId.trim();

  if (!source || !target) {
    return {
      ok: false,
      code: "INVALID_SELECTION",
      error: "Source/target node selection is required.",
    };
  }

  if (source === target) {
    return {
      ok: false,
      code: "INVALID_SELECTION",
      error: "Source and target must be different nodes.",
    };
  }

  if (!(await isValidId(source)) || !(await isValidId(target))) {
    return {
      ok: false,
      code: "INVALID_SELECTION",
      error: "Selected nodes are not available in the catalog.",
    };
  }

  return null;
}

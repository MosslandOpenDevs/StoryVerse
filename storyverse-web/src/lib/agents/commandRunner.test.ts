import test from "node:test";
import assert from "node:assert/strict";
import {
  executeCommand,
  validateNodeSelection,
  emptyQueryFailure,
  withTimeout,
  ActionTimeoutError,
} from "./commandRunner";

const FAST = { timeoutMs: 40, maxAttempts: 2, retryBaseDelayMs: 5 } as const;

test("emptyQueryFailure returns the EMPTY_QUERY code", () => {
  const failure = emptyQueryFailure();
  assert.equal(failure.ok, false);
  assert.equal(failure.code, "EMPTY_QUERY");
});

test("executeCommand returns the result on success", async () => {
  const run = await executeCommand(async () => 42, {}, FAST);
  assert.equal(run.ok, true);
  assert.equal(run.ok && run.result, 42);
});

test("executeCommand retries non-timeout failures up to maxAttempts", async () => {
  let calls = 0;
  const run = await executeCommand(
    async () => {
      calls += 1;
      throw new Error("boom");
    },
    {},
    FAST,
  );

  assert.equal(calls, 2, "should attempt exactly maxAttempts times");
  assert.equal(run.ok, false);
  assert.equal(run.ok === false && run.code, "EXECUTION_FAILED");
});

test("executeCommand succeeds on a retry after a transient failure", async () => {
  let calls = 0;
  const run = await executeCommand(
    async () => {
      calls += 1;
      if (calls === 1) throw new Error("transient");
      return "recovered";
    },
    {},
    FAST,
  );

  assert.equal(calls, 2);
  assert.equal(run.ok, true);
  assert.equal(run.ok && run.result, "recovered");
});

test("executeCommand times out and does NOT retry", async () => {
  let calls = 0;
  const run = await executeCommand(
    async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 200));
      return "too-slow";
    },
    {},
    FAST,
  );

  assert.equal(calls, 1, "timeouts must fail fast, not retry");
  assert.equal(run.ok, false);
  assert.equal(run.ok === false && run.code, "TIMEOUT");
});

test("withTimeout rejects with ActionTimeoutError when the promise is slow", async () => {
  await assert.rejects(
    () => withTimeout(new Promise((resolve) => setTimeout(resolve, 100)), 20),
    (error: unknown) => error instanceof ActionTimeoutError,
  );
});

test("validateNodeSelection flags empty ids", async () => {
  const failure = await validateNodeSelection("", "roman-empire", () => true);
  assert.equal(failure?.code, "INVALID_SELECTION");
  assert.match(failure?.error ?? "", /required/i);
});

test("validateNodeSelection flags identical source and target", async () => {
  const failure = await validateNodeSelection("dune", "dune", () => true);
  assert.equal(failure?.code, "INVALID_SELECTION");
  assert.match(failure?.error ?? "", /different/i);
});

test("validateNodeSelection flags ids missing from the catalog", async () => {
  const validIds = new Set(["dune", "roman-empire"]);
  const failure = await validateNodeSelection("dune", "ghost-node", (id) =>
    validIds.has(id),
  );
  assert.equal(failure?.code, "INVALID_SELECTION");
  assert.match(failure?.error ?? "", /not available/i);
});

test("validateNodeSelection returns null for a valid distinct pair", async () => {
  const validIds = new Set(["dune", "roman-empire"]);
  const failure = await validateNodeSelection("dune", "roman-empire", (id) =>
    validIds.has(id),
  );
  assert.equal(failure, null);
});

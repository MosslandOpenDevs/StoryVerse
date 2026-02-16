import test from "node:test";
import assert from "node:assert/strict";
import {
  runUniverseCommand,
  runUniverseCommandByNodeIds,
} from "./orchestrator";

const DISABLED_AGENT_ENV: Record<string, string | undefined> = {
  OPENAI_API_KEY: undefined,
  NEO4J_URI: undefined,
  NEO4J_USERNAME: undefined,
  NEO4J_PASSWORD: undefined,
};

async function withEnvOverrides(
  overrides: Record<string, string | undefined>,
  run: () => Promise<void>,
): Promise<void> {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("runs manual node-id command with deterministic metadata", async () => {
  await withEnvOverrides(DISABLED_AGENT_ENV, async () => {
    const result = await runUniverseCommandByNodeIds("dune", "roman-empire");

    assert.equal(result.source.id, "dune");
    assert.equal(result.target.id, "roman-empire");
    assert.equal(result.resolution.strategy, "manual_selection");
    assert.equal(result.resolution.confidence, "high");
    assert.equal(result.resolution.locale, "en");
    assert.equal(result.resolution.needsClarification, false);
    assert.equal(result.suggestions.length, 4);
    assert.ok(result.scenario.bridge.length > 0);
  });
});

test("infers korean locale for manual node-id command when query is korean", async () => {
  await withEnvOverrides(DISABLED_AGENT_ENV, async () => {
    const result = await runUniverseCommandByNodeIds(
      "sherlock-holmes",
      "star-wars",
      "셜록 홈즈를 스타워즈와 연결해줘.",
    );

    assert.equal(result.resolution.strategy, "manual_selection");
    assert.equal(result.resolution.locale, "ko");
    assert.equal(result.source.id, "sherlock-holmes");
    assert.equal(result.target.id, "star-wars");
  });
});

test("runs explicit query orchestration without clarification", async () => {
  await withEnvOverrides(DISABLED_AGENT_ENV, async () => {
    const result = await runUniverseCommand("Connect Cleopatra to Blade Runner.");

    assert.equal(result.source.id, "cleopatra");
    assert.equal(result.target.id, "blade-runner");
    assert.equal(result.resolution.strategy, "explicit_pair");
    assert.equal(result.resolution.needsClarification, false);
    assert.equal(result.resolution.confidence, "high");
    assert.equal(result.suggestions.length, 4);
    assert.ok(result.scenario.title.includes("Cleopatra"));
    assert.ok(result.scenario.title.includes("Blade Runner"));
  });
});

test("applies parser policy environment for default fallback resolution", async () => {
  await withEnvOverrides(
    {
      ...DISABLED_AGENT_ENV,
      QUERY_PREFERRED_MEDIA: "History,Movie,Novel",
      QUERY_AMBIGUITY_MARGIN: "7",
    },
    async () => {
      const result = await runUniverseCommand("unknown multiverse request");

      assert.equal(result.resolution.strategy, "default_fallback");
      assert.equal(result.resolution.needsClarification, true);
      assert.equal(result.source.medium, "History");
      assert.equal(result.target.medium, "History");
      assert.notEqual(result.source.id, result.target.id);
    },
  );
});

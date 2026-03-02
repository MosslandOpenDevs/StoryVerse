import test from "node:test";
import assert from "node:assert/strict";
import { buildClarificationChoices } from "./clarificationChoices";

test("builds actionable english clarification choices and excludes current pair", () => {
  const choices = buildClarificationChoices({
    locale: "en",
    sourceCandidates: [
      { id: "sherlock-holmes", title: "Sherlock Holmes", score: 97 },
      { id: "cleopatra", title: "Cleopatra", score: 60 },
    ],
    targetCandidates: [
      { id: "star-wars", title: "Star Wars", score: 95 },
      { id: "blade-runner", title: "Blade Runner", score: 61 },
    ],
    selectedSourceId: "sherlock-holmes",
    selectedTargetId: "star-wars",
  });

  assert.equal(choices.length, 3);
  assert.deepEqual(choices[0], {
    sourceId: "sherlock-holmes",
    targetId: "blade-runner",
    prompt: "Connect Sherlock Holmes to Blade Runner.",
  });
  assert.deepEqual(choices[1], {
    sourceId: "cleopatra",
    targetId: "star-wars",
    prompt: "Connect Cleopatra to Star Wars.",
  });
  assert.deepEqual(choices[2], {
    sourceId: "cleopatra",
    targetId: "blade-runner",
    prompt: "Connect Cleopatra to Blade Runner.",
  });
});

test("builds korean clarification prompts", () => {
  const choices = buildClarificationChoices({
    locale: "ko",
    sourceCandidates: [{ id: "dune", title: "듄", score: 91 }],
    targetCandidates: [{ id: "roman-empire", title: "로마 제국", score: 90 }],
    selectedSourceId: "none",
    selectedTargetId: "none",
    maxChoices: 1,
  });

  assert.deepEqual(choices, [
    {
      sourceId: "dune",
      targetId: "roman-empire",
      prompt: "듄를 로마 제국와 연결해줘.",
    },
  ]);
});

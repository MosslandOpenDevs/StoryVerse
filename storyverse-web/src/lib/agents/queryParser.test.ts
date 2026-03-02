import test from "node:test";
import assert from "node:assert/strict";
import type { StoryCatalogItem } from "./catalog";
import {
  extractPairFromQuery,
  resolveNodesFromQuery,
  resolveQueryNodes,
} from "./queryParser";

function pairIds(query: string): [string, string] {
  const [source, target] = resolveNodesFromQuery(query);
  return [source.id, target.id];
}

test("extracts explicit english connect intent", () => {
  assert.deepEqual(extractPairFromQuery("Connect Sherlock Holmes to Star Wars."), [
    "Sherlock Holmes",
    "Star Wars",
  ]);
});

test("extracts compact arrow style pair", () => {
  const resolution = resolveQueryNodes("Cleopatra -> Blade Runner");
  assert.deepEqual(pairIds("Cleopatra -> Blade Runner"), [
    "cleopatra",
    "blade-runner",
  ]);
  assert.equal(resolution.strategy, "explicit_pair");
  assert.equal(resolution.confidence, "high");
  assert.equal(resolution.locale, "en");
  assert.equal(resolution.needsClarification, false);
});

test("extracts korean connect intent", () => {
  const resolution = resolveQueryNodes("셜록 홈즈를 스타워즈와 연결해줘.");
  assert.deepEqual(pairIds("셜록 홈즈를 스타워즈와 연결해줘."), [
    "sherlock-holmes",
    "star-wars",
  ]);
  assert.equal(resolution.locale, "ko");
});

test("extracts korean spoken connective intent with '이랑'", () => {
  assert.deepEqual(pairIds("듄이랑 로마 제국 이어줘"), [
    "dune",
    "roman-empire",
  ]);
});

test("extracts korean spoken connective intent with '랑'", () => {
  assert.deepEqual(pairIds("클레오파트라랑 블레이드 러너 연결해줘"), [
    "cleopatra",
    "blade-runner",
  ]);
});

test("extracts korean path intent", () => {
  assert.deepEqual(pairIds("듄에서 로마 제국까지 경로 보여줘"), [
    "dune",
    "roman-empire",
  ]);
});

test("extracts versus style pair intent", () => {
  const resolution = resolveQueryNodes("What if Dune meets Roman Empire?");
  assert.deepEqual(pairIds("What if Dune meets Roman Empire?"), ["dune", "roman-empire"]);
  assert.equal(resolution.strategy, "explicit_pair");
  assert.equal(resolution.needsClarification, false);
});

test("extracts x-style crossover pair intent", () => {
  const resolution = resolveQueryNodes("Dune x Roman Empire");
  assert.deepEqual(pairIds("Dune x Roman Empire"), ["dune", "roman-empire"]);
  assert.equal(resolution.strategy, "explicit_pair");
  assert.equal(resolution.needsClarification, false);
});

test("extracts ampersand-style crossover pair intent", () => {
  const resolution = resolveQueryNodes("Dune & Roman Empire");
  assert.deepEqual(pairIds("Dune & Roman Empire"), ["dune", "roman-empire"]);
  assert.equal(resolution.strategy, "explicit_pair");
  assert.equal(resolution.needsClarification, false);
});

test("resolves mention-based queries without explicit command verbs", () => {
  const resolution = resolveQueryNodes(
    "Could Dune collide with Imperial Rome under a single prophecy?",
  );
  assert.deepEqual(
    pairIds("Could Dune collide with Imperial Rome under a single prophecy?"),
    ["dune", "roman-empire"],
  );
  assert.equal(resolution.strategy, "mention_pair");
  assert.equal(resolution.confidence, "high");
  assert.equal(resolution.needsClarification, false);
});

test("keeps mention order for alias-based queries", () => {
  assert.deepEqual(pairIds("What if Rome collides with Dune?"), [
    "roman-empire",
    "dune",
  ]);
});

test("falls back to default pair for unknown input", () => {
  const resolution = resolveQueryNodes("Totally unknown multiverse entities");
  assert.deepEqual(pairIds("Totally unknown multiverse entities"), [
    "sherlock-holmes",
    "star-wars",
  ]);
  assert.equal(resolution.strategy, "default_fallback");
  assert.equal(resolution.needsClarification, true);
  assert.equal(resolution.confidence, "low");
  assert.equal(resolution.locale, "en");
  assert.ok(resolution.clarificationPrompt);
  assert.ok(
    resolution.clarificationPrompt?.includes('Connect Sherlock Holmes to Star Wars.'),
  );
});

test("uses single mention fallback when only one node is detected", () => {
  const resolution = resolveQueryNodes("Tell me more about Dune");
  assert.equal(resolution.strategy, "single_mention_fallback");
  assert.equal(resolution.needsClarification, true);
  assert.equal(resolution.confidence, "low");
  assert.equal(resolution.locale, "en");
  assert.ok(resolution.clarificationPrompt);
  assert.ok(resolution.clarificationPrompt?.includes("for example:"));
  assert.ok(resolution.clarificationPrompt?.includes("or"));
});

test("returns korean locale and korean clarification prompt", () => {
  const resolution = resolveQueryNodes("듄만 알려줘");
  assert.equal(resolution.locale, "ko");
  assert.equal(resolution.strategy, "single_mention_fallback");
  assert.ok(resolution.clarificationPrompt?.includes("두 번째 노드"));
  assert.ok(resolution.clarificationPrompt?.includes("예:"));
});

test("flags ambiguous explicit terms and provides candidates", () => {
  const resolution = resolveQueryNodes("Connect Empire to Dune");
  assert.equal(resolution.strategy, "explicit_pair");
  assert.equal(resolution.needsClarification, true);
  assert.equal(resolution.confidence, "low");
  assert.ok(resolution.clarificationPrompt);
  assert.equal(resolution.sourceCandidates[0]?.title, "Roman Empire");
  assert.equal(resolution.sourceCandidates[1]?.title, "Napoleon Bonaparte");
});

test("applies preferred medium order for ambiguous explicit matches", () => {
  const catalog: StoryCatalogItem[] = [
    {
      id: "movie-legend",
      title: "Legend Movie",
      medium: "Movie",
      summary: "Movie candidate.",
      aliases: ["legend"],
    },
    {
      id: "history-legend",
      title: "Legend History",
      medium: "History",
      summary: "History candidate.",
      aliases: ["legend"],
    },
    {
      id: "dune",
      title: "Dune",
      medium: "Novel",
      summary: "Dune entry.",
      aliases: ["dune"],
    },
  ];

  const defaultResolution = resolveQueryNodes("Connect legend to dune", catalog);
  assert.equal(defaultResolution.source.id, "movie-legend");

  const preferredResolution = resolveQueryNodes("Connect legend to dune", catalog, {
    preferredMediumOrder: ["History", "Movie", "Novel"],
    ambiguityMargin: 1,
  });
  assert.equal(preferredResolution.source.id, "history-legend");
});

test("applies preferred medium order to single-mention fallback target", () => {
  const resolution = resolveQueryNodes("Tell me more about Sherlock Holmes", undefined, {
    preferredMediumOrder: ["History", "Movie", "Novel"],
  });
  assert.equal(resolution.strategy, "single_mention_fallback");
  assert.equal(resolution.source.id, "sherlock-holmes");
  assert.equal(resolution.target.medium, "History");
});

test("orders single-mention fallback candidates by preferred medium", () => {
  const catalog: StoryCatalogItem[] = [
    {
      id: "alpha-novel",
      title: "Alpha Saga",
      medium: "Novel",
      summary: "Source novel node.",
      aliases: ["alpha"],
    },
    {
      id: "movie-prime",
      title: "Cinema Prime",
      medium: "Movie",
      summary: "Movie candidate.",
      aliases: ["cinema"],
    },
    {
      id: "history-archive",
      title: "Empire Archive",
      medium: "History",
      summary: "History candidate.",
      aliases: ["empire"],
    },
    {
      id: "novel-orbit",
      title: "Orbit Chronicle",
      medium: "Novel",
      summary: "Novel candidate.",
      aliases: ["orbit"],
    },
  ];

  const resolution = resolveQueryNodes("Tell me about alpha", catalog, {
    preferredMediumOrder: ["History", "Movie", "Novel"],
  });

  assert.equal(resolution.strategy, "single_mention_fallback");
  assert.equal(resolution.source.id, "alpha-novel");
  assert.equal(resolution.target.id, "history-archive");
  assert.deepEqual(
    resolution.targetCandidates.map((candidate) => candidate.id),
    ["history-archive", "movie-prime", "novel-orbit"],
  );
});

test("orders default fallback candidates by preferred medium", () => {
  const catalog: StoryCatalogItem[] = [
    {
      id: "alpha-novel",
      title: "Alpha Saga",
      medium: "Novel",
      summary: "Novel node.",
      aliases: ["alpha"],
    },
    {
      id: "movie-prime",
      title: "Cinema Prime",
      medium: "Movie",
      summary: "Movie node.",
      aliases: ["cinema"],
    },
    {
      id: "history-archive",
      title: "Empire Archive",
      medium: "History",
      summary: "History node.",
      aliases: ["empire"],
    },
    {
      id: "novel-orbit",
      title: "Orbit Chronicle",
      medium: "Novel",
      summary: "Second novel node.",
      aliases: ["orbit"],
    },
  ];

  const resolution = resolveQueryNodes("Unmapped request", catalog, {
    preferredMediumOrder: ["History", "Movie", "Novel"],
  });

  assert.equal(resolution.strategy, "default_fallback");
  assert.equal(resolution.source.id, "history-archive");
  assert.equal(resolution.target.id, "movie-prime");
  assert.deepEqual(
    resolution.sourceCandidates.map((candidate) => candidate.id),
    ["history-archive", "movie-prime", "alpha-novel"],
  );
  assert.deepEqual(
    resolution.targetCandidates.map((candidate) => candidate.id),
    ["movie-prime", "alpha-novel", "novel-orbit"],
  );
});

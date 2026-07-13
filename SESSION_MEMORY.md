# StoryVerse Session Memory

Last updated: 2026-07-13

## Repo State
- Branch: `main`
- HEAD: `29d4719`
- Status: clean
- Remote: `origin` uses HTTPS
  - `https://github.com/MosslandOpenDevs/StoryVerse.git`
- Docs refresh + a v0.2 stabilization pass done this session on branch
  `claude/readme-content-updates-76426e`:
  - security: next 15.5.20 (CVE-2025-66478), generate API fail-closed in prod,
    ops-check wrapper fix, MIT LICENSE, SECURITY.md, .env.example
  - grounding: real catalog neighbours (no synthetic ids), abstain on
    low confidence, evidence-grounded storyteller, deep-link-only auto-run
  - /api/health readiness (Neo4j probe → ready/checks), footer reflects it
  - shortcut collisions resolved + WCAG 2.1.4 disable toggle
  - action command-runner extracted and tested

## What Was Completed
- Bootstrapped `storyverse-web` app and CI.
- Implemented agentic orchestration path:
  - parser (`queryParser.ts`)
  - orchestrator (`orchestrator.ts`) with graceful degraded mode
    (Neo4j/OpenAI env vars all optional; seed catalog +
    `data/generated-catalog.json` fallback + heuristic navigator suggestions)
  - server actions (`actions.ts`): 15s timeout, 2 attempts, 150ms backoff,
    error codes `EMPTY_QUERY` / `INVALID_SELECTION` / `TIMEOUT` / `EXECUTION_FAILED`
  - clarification choice builder (`clarificationChoices.ts`)
  - 2D card-based universe UI orchestrated by `BridgePanel.tsx`
    (no 3D canvas — `CommandDeck.tsx` / `UniverseCanvas.tsx` are gone)
- Added health monitoring suite:
  - `/api/health` route returning ok/service/version/nodeEnv/uptimeSec/timestamp
    with `Cache-Control: no-store`
  - live footer status: 15s polling, manual refresh button, 20s staleness threshold
- Added universe search/filter toolbar:
  - live search match counts, medium suggestions for empty searches,
    sports-style pair input, recovery suggestion aggregation
  - keyboard shortcuts (ctrl/cmd+enter submit, escape-key clearing,
    open-filtered-view shortcut)
  - URL deep links via `q` / `medium` / `source` / `target` params
    (`story` kept as legacy alias), persisted across sessions
- Added `MarketingQuickNav.tsx` — large sticky landing nav with search filter,
  pinned sections, recent trail, shortcut keys, shareable filter URLs,
  copy actions, and a shortcuts guide
- Added catalog preview filters on the landing page:
  - medium filters persisted in URL, filter status feedback,
    story lane clear action, empty-state reset
- Accessibility pass (~20 commits):
  - skip-to-content anchors, focusable main landmark, aria-current nav state,
    labeled controls and starter queries, screen-reader announcements for
    results/health/filter state, visible focus states on catalog controls
- Added tests:
  - parser tests (`queryParser.test.ts`)
  - orchestrator tests (`orchestrator.test.ts`)
  - clarification choice tests (`clarificationChoices.test.ts`)

## Quality Gate
- Latest full check passed:
  - `npm run check` in `storyverse-web`
  - includes lint + test:parser + build
- Test count at last run: 79 passing via `node --test`
  (62 queryParser / 5 orchestrator / 2 clarificationChoices / 10 commandRunner)

## Important Files
- `storyverse-web/src/lib/agents/queryParser.ts`
- `storyverse-web/src/lib/agents/queryParser.test.ts`
- `storyverse-web/src/lib/agents/orchestrator.ts`
- `storyverse-web/src/lib/agents/orchestrator.test.ts`
- `storyverse-web/src/lib/agents/clarificationChoices.ts`
- `storyverse-web/src/lib/agents/clarificationChoices.test.ts`
- `storyverse-web/src/app/(universe)/universe/actions.ts`
- `storyverse-web/src/app/(universe)/universe/page.tsx`
- `storyverse-web/src/components/universe/useUniverseState.ts`
- `storyverse-web/src/components/universe/BridgePanel.tsx`
- `storyverse-web/src/components/layout/Footer.tsx`
- `storyverse-web/src/components/marketing/MarketingQuickNav.tsx`
- `storyverse-web/src/app/api/health/route.ts`
- `storyverse-web/README.md`
- `storyverse-web/agents.md`

## Suggested Next Tasks
1. Provenance/review-state catalog schema + seed `RELATED_TO` graph edges for
   generated stories (real GraphRAG grounding beyond the evidence pass).
2. Neo4j driver singleton + indexes/migrations (currently per-call drivers).
3. Structured storyteller output (title/timeline/risk still templated).
4. Story detail pages.
5. Major migrations as isolated PRs: Next 16, AI SDK 7.
6. Ops (outside repo): restore sv.moss.land TLS + synthetic smoke checks.

## Resume Commands
```bash
cd storyverse-web
npm ci
npm run check
npm run dev
```

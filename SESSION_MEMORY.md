# StoryVerse Session Memory

Last updated: 2026-07-13

## Repo State
- Branch: `main`
- HEAD: `29d4719`
- Status: clean
- Remote: `origin` uses HTTPS
  - `https://github.com/MosslandOpenDevs/StoryVerse.git`
- Docs refresh (README/agents docs) done this session on branch `claude/readme-content-updates-76426e`.

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
- Test count at last run: 68 passing via `node --test`
  (62 queryParser / 4 orchestrator / 2 clarificationChoices)

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
1. Add dedicated action-level tests for `INVALID_SELECTION`, timeout, and retry
   behavior (still missing — no `actions.test.ts`).
2. Seed `RELATED_TO` graph edges for generated stories so navigator suggestions
   work beyond the heuristic fallback.
3. Add story detail pages.

## Resume Commands
```bash
cd storyverse-web
npm ci
npm run check
npm run dev
```

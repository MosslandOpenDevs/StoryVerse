# StoryVerse Session Memory

Last updated: 2026-02-16

## Repo State
- Branch: `main`
- HEAD: `747021d`
- Status: clean (`main...origin/main`)
- Remote: `origin` uses SSH
  - `git@github.com:MosslandOpenDevs/StoryVerse.git`

## What Was Completed
- Bootstrapped `storyverse-web` app and CI.
- Implemented agentic orchestration path:
  - parser (`queryParser.ts`)
  - orchestrator (`orchestrator.ts`)
  - server actions (`actions.ts`)
  - UI command deck (`CommandDeck.tsx`)
- Added richer query resolution metadata:
  - strategy, confidence, locale, clarification flag, candidate lists
- Added parser policies:
  - preferred medium order (`QUERY_PREFERRED_MEDIA`)
  - ambiguity margin (`QUERY_AMBIGUITY_MARGIN`)
- Added manual node-id execution flow:
  - `runUniverseCommandByNodeIdsAction`
  - UI correction chips run by node IDs (no reparsing drift)
- Added manual source/target selectors in Command Deck.
- Linked Universe canvas and command deck:
  - highlighted catalog anchor nodes in canvas
  - click-to-stage source/target in command deck
  - optional quick bridge mode (auto-run after two picks)
- Added tests:
  - parser tests (`queryParser.test.ts`)
  - orchestrator tests (`orchestrator.test.ts`)

## Quality Gate
- Latest full check passed:
  - `npm run check` in `storyverse-web`
  - includes lint + tests + build
- Test count at last run: 20 passing

## Important Files
- `storyverse-web/src/lib/agents/queryParser.ts`
- `storyverse-web/src/lib/agents/queryParser.test.ts`
- `storyverse-web/src/lib/agents/orchestrator.ts`
- `storyverse-web/src/lib/agents/orchestrator.test.ts`
- `storyverse-web/src/app/(universe)/universe/actions.ts`
- `storyverse-web/src/components/universe/CommandDeck.tsx`
- `storyverse-web/src/components/universe/UniverseCanvas.tsx`
- `storyverse-web/src/app/(universe)/universe/page.tsx`
- `storyverse-web/README.md`
- `storyverse-web/agents.md`

## Suggested Next Tasks
1. Add source/target visual badges (`S`/`T`) on selected catalog anchors in `UniverseCanvas`.
2. Sync manual selection + quick mode state with URL query for shareable deep links.
3. Add dedicated action-level tests for `INVALID_SELECTION`, timeout, and retry behavior.

## Resume Commands
```bash
cd storyverse-web
npm ci
npm run check
npm run dev
```

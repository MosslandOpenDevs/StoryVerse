# StoryVerse Web

StoryVerse is an agentic storytelling interface where users connect movies, history, and novels through a 3D universe graph.

## Run Locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks

```bash
npm run check
npm run lint
npm run test:parser
npm run build
```

`test:parser` compiles and runs agent tests in:
- `src/lib/agents/queryParser.test.ts`
- `src/lib/agents/orchestrator.test.ts`

## Key Paths

- `src/app/(marketing)/page.tsx`: marketing landing page (`/`)
- `src/app/(universe)/universe/page.tsx`: main exploration UI (`/universe`)
- `src/components/universe/UniverseCanvas.tsx`: 3D node rendering and interactions
- `src/components/universe/CommandDeck.tsx`: query input + response panel
- `src/lib/agents/queryParser.ts`: natural-language query -> source/target node resolution
- `src/lib/agents/orchestrator.ts`: calls navigator/storyteller agents and composes result
- `src/lib/agents/navigatorAgent.ts`: neighbor suggestion logic (Neo4j + optional model ranking)
- `src/lib/agents/storytellerAgent.ts`: what-if scenario generation workflow
- `src/lib/agents/catalog.ts`: canonical story nodes and aliases
- `src/lib/agents/queryParser.test.ts`: parser regression tests (English/Korean + ambiguity)
- `src/lib/agents/orchestrator.test.ts`: orchestration regression tests (manual selection + parser policy env)

## Environment Variables

- `OPENAI_API_KEY` (optional, enables model-enhanced generation)
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `QUERY_PREFERRED_MEDIA` (optional, comma list: `Movie,History,Novel`)
- `QUERY_AMBIGUITY_MARGIN` (optional, integer `1..40`)

## Notes

- Query resolution returns strategy/confidence/candidates metadata used by `CommandDeck` for clarification prompts.
- Query parser supports options (`preferredMediumOrder`, `ambiguityMargin`) for controlled disambiguation.
- Preferred medium order also affects fallback target selection when only one node (or none) is detected.
- Preferred medium order now also drives fallback candidate chip ordering for consistent clarification UX.
- Query parser infers locale (`ko`/`en`) and localizes clarification prompts.
- `CommandDeck` now supports in-place source/target correction from candidate chips.
- Candidate correction executes by node ID to avoid reparsing ambiguity.
- `CommandDeck` also provides direct manual source/target selection from the catalog and executes by node ID.
- Clicking highlighted catalog anchor nodes in `UniverseCanvas` stages source/target in `CommandDeck`.
- Manual selection includes a quick bridge mode that auto-runs after two canvas picks.
- `CommandDeck` stores up to 5 recent queries in local storage for quick reruns.
- Server action failures return explicit codes: `EMPTY_QUERY`, `INVALID_SELECTION`, `TIMEOUT`, `EXECUTION_FAILED`.

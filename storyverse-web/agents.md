# StoryVerse Agent Guide

## Purpose
StoryVerse is an Agentic AI web service where users explore an infinite story universe (Movies, History, Novels) through a 2D card-based catalog and AI-generated bridges between stories.

## Tech Baseline
- Frontend: Next.js 15.5 App Router, TypeScript, TailwindCSS
- AI/Data: Vercel AI SDK, LangGraph, Neo4j (optional; graceful degraded mode)
- UI: Shadcn-style component patterns, Lucide icons

## Project Structure
- `src/app/(marketing)/page.tsx`: Public landing page (`/`)
- `src/app/(universe)/universe/page.tsx`: Main exploration view (`/universe`)
- `src/app/(universe)/universe/actions.ts`: Server Actions for command execution
- `src/app/api/`: Route handlers — `catalog`, `catalog/generate`, `health`
- `src/components/universe/BridgePanel.tsx`: Right-panel orchestrator composing the sub-components below
- `src/components/universe/`: `StoryGrid`, `StoryCard`, `SelectedPairBar`, `QueryInput`, `ClarificationPanel`, `BridgeResultCard`, `TimelineBeats`, `RiskBadge`, `NeighborSuggestions`, `ChatHistory`
- `src/components/universe/useUniverseState.ts`: Client-side universe state (selection, queries, persistence)
- `src/components/marketing/`: Landing sections incl. `MarketingQuickNav.tsx` (sticky nav with filter/pins/trail/shortcuts)
- `src/components/layout/`: `Header`, `Footer` (footer polls `/api/health`)
- `src/lib/agents/queryParser.ts`: NL query parsing and source/target node resolution
- `src/lib/agents/navigatorAgent.ts`: GraphRAG-style related-node suggestions; without Neo4j it suggests real catalog neighbours (cross-medium first) so suggestions stay selectable — never synthetic node ids
- `src/lib/agents/storytellerAgent.ts`: "What If" scenario generation between nodes
- `src/lib/agents/orchestrator.ts`: Multi-agent orchestration and result composition
- `src/lib/agents/clarificationChoices.ts`: One-click clarification prompt builder (Korean particle-aware)
- `src/lib/agents/catalog.ts` / `catalogSeed.ts` / `catalogGenerator.ts`: Seed catalog, AI catalog generation, and file-based fallback storage
- `src/lib/agents/*.test.ts`: `queryParser.test.ts`, `orchestrator.test.ts`, `clarificationChoices.test.ts`
- `src/components/ui/*`: Reusable UI primitives
- `scripts/ops-check.sh`: Operational smoke check (`npm run ops:check`)

## Coding Rules
1. Always use **Server Actions** for Neo4j and any database/network side effects.
2. Never call Neo4j directly from Client Components.
3. Keep agent orchestration logic in `src/lib/agents`.
4. Prefer strict typing: no `any`, explicit interfaces for request/response payloads.
5. Keep client-only interaction layers (`useUniverseState`, universe components) isolated from server-side orchestration logic.
6. Keep UI overlays lightweight; heavy computations should run server-side.
7. Add feature-level documentation when introducing new agents, graph schemas, or routes.

## Agent Workflow Convention
1. `queryParser` resolves source/target nodes from user query text.
2. If ambiguity exists, parser emits clarification metadata (confidence, candidates, prompt, locale).
3. User can override parser output via candidate chips; overrides execute by node ID (`manual_selection`).
4. `navigatorAgent` retrieves and ranks candidate neighbors around the source node.
5. `storytellerAgent` composes speculative cross-domain links between source and target.
6. Universe UI presents suggestions and scenarios through `BridgePanel`, which composes the universe sub-components.

## Parser Options
- `preferredMediumOrder`: orders candidate ranking, fallback targets, default pairs, and candidate lists by preferred media (not only explicit-pair disambiguation)
- `ambiguityMargin`: controls how close top candidates can be before clarification is required

## Clarification UX
- `ClarificationPanel` renders parser candidate chips for source/target correction, plus one-click `ClarificationChoice` prompts built by `src/lib/agents/clarificationChoices.ts` (Korean particle-aware prompt text)
- correction prompts and clarification messages are localized using parser locale (`ko`/`en`)
- corrected runs execute through node IDs to avoid reparsing drift
- source/target selection happens via story-card clicks: first click sets source, second sets target, a third restarts with a new source (`useUniverseState.handleStoryCardClick`)
- auto-run: only the deep-link pair present in the URL **at page load** executes automatically (the page snapshots `?source=<id>&target=<id>` on mount, so manual card staging does NOT auto-run — Generate Bridge / Enter is required). `story` is a legacy alias for `source`; `q`/`medium` prefill search and filter
- abstain: for free-text queries flagged `needsClarification`, the orchestrator returns clarification + a best-guess pair but no bridge (`scenario: null`) rather than fabricating one; manual/node-id runs (`manual_selection`) always generate
- recent user queries are persisted locally on submit (before execution, regardless of success) for quick replay

## Action Error Codes
- `EMPTY_QUERY`: user sent blank query
- `INVALID_SELECTION`: node selection payload is invalid or missing
- `TIMEOUT`: orchestration exceeded action timeout (15s, 2 attempts, 150ms backoff)
- `EXECUTION_FAILED`: non-timeout agent/runtime failure after retry

## Validation Commands
- `npm run check`: runs lint + parser tests + build
- `npm run lint`: static lint checks
- `npm run test:parser`: parser + orchestrator + clarification tests (68 tests via `node --test`)
- `npm run build`: production build validation
- `npm run ops:check`: operational smoke check script

## Environment Variables
- `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` (optional; without them the app runs in degraded mode: seed catalog + `data/generated-catalog.json` file fallback + heuristic navigator suggestions)
- `OPENAI_API_KEY` (optional; gates `gpt-4o-mini` for storyteller generation and navigator re-ranking)
- `OLLAMA_BASE_URL` (optional; catalog generation endpoint — the code default points at an internal lab host, so set your own, e.g. `http://localhost:11434/v1`)
- `OLLAMA_MODEL` (optional; catalog generation model, default `qwen3:32b`)
- `CATALOG_GENERATE_SECRET` (protects `POST /api/catalog/generate`)
- `QUERY_PREFERRED_MEDIA` (optional parser policy, e.g. `History,Novel,Movie`)
- `QUERY_AMBIGUITY_MARGIN` (optional parser ambiguity threshold, 1..40)

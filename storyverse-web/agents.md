# StoryVerse Agent Guide

## Purpose
StoryVerse is an Agentic AI web service where users explore an infinite story universe (Movies, History, Novels) through an interactive 3D knowledge graph.

## Tech Baseline
- Frontend: Next.js 15.5 App Router, TypeScript, TailwindCSS
- 3D: React Three Fiber, Drei, Leva
- AI/Data: Vercel AI SDK, LangGraph, Neo4j
- UI: Shadcn-style component patterns, Lucide icons

## Project Structure
- `src/app/(marketing)/page.tsx`: Public landing page (`/`)
- `src/app/(universe)/universe/page.tsx`: Main exploration view (`/universe`)
- `src/app/(universe)/universe/actions.ts`: Server Actions for command execution
- `src/components/universe/UniverseCanvas.tsx`: 3D graph renderer and interactions
- `src/components/universe/CommandDeck.tsx`: Floating chat/control overlay
- `src/lib/agents/queryParser.ts`: NL query parsing and source/target node resolution
- `src/lib/agents/navigatorAgent.ts`: GraphRAG-style related-node suggestions
- `src/lib/agents/storytellerAgent.ts`: "What If" scenario generation between nodes
- `src/lib/agents/orchestrator.ts`: Multi-agent orchestration and result composition
- `src/lib/agents/catalog.ts`: Canonical node catalog and alias mapping
- `src/lib/agents/queryParser.test.ts`: Parser test cases (English/Korean variants)
- `src/lib/agents/orchestrator.test.ts`: Orchestrator regression tests (manual ID flow + env policy)
- `src/components/ui/*`: Reusable UI primitives

## Coding Rules
1. Always use **Server Actions** for Neo4j and any database/network side effects.
2. Never call Neo4j directly from Client Components.
3. Keep agent orchestration logic in `src/lib/agents`.
4. Prefer strict typing: no `any`, explicit interfaces for request/response payloads.
5. Keep 3D rendering (`R3F`) isolated from AI/data orchestration logic.
6. Keep UI overlays lightweight; heavy computations should run server-side.
7. Add feature-level documentation when introducing new agents, graph schemas, or routes.

## Agent Workflow Convention
1. `queryParser` resolves source/target nodes from user query text.
2. If ambiguity exists, parser emits clarification metadata (confidence, candidates, prompt, locale).
3. User can override parser output via candidate chips; overrides execute by node ID (`manual_selection`).
4. `navigatorAgent` retrieves and ranks candidate neighbors around the source node.
5. `storytellerAgent` composes speculative cross-domain links between source and target.
6. Universe UI presents suggestions and scenarios through `CommandDeck`.

## Parser Options
- `preferredMediumOrder`: boosts ranking for preferred media during explicit pair disambiguation
- `ambiguityMargin`: controls how close top candidates can be before clarification is required

## Clarification UX
- `CommandDeck` renders parser candidate chips for source/target correction
- correction prompts and clarification messages are localized using parser locale (`ko`/`en`)
- corrected runs execute through node IDs to avoid reparsing drift
- manual source/target dropdown selection is available for direct ID-based execution
- clicking highlighted catalog anchors in `UniverseCanvas` stages source/target order in `CommandDeck`
- optional quick bridge mode auto-runs once source and target are staged by two canvas clicks
- recent successful user queries are persisted locally for quick replay

## Action Error Codes
- `EMPTY_QUERY`: user sent blank query
- `INVALID_SELECTION`: node selection payload is invalid or missing
- `TIMEOUT`: orchestration exceeded action timeout
- `EXECUTION_FAILED`: non-timeout agent/runtime failure after retry

## Validation Commands
- `npm run check`: runs lint + parser tests + build
- `npm run lint`: static lint checks
- `npm run test:parser`: parser + orchestrator regression tests
- `npm run build`: production build validation

## Environment Variables
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- LLM provider keys required by Vercel AI SDK model adapter of choice.
- `QUERY_PREFERRED_MEDIA` (optional parser policy, e.g. `History,Novel,Movie`)
- `QUERY_AMBIGUITY_MARGIN` (optional parser ambiguity threshold, 1..40)

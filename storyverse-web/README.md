# StoryVerse Web

Next.js application for StoryVerse — an agentic storytelling interface where users connect movies, history, and novels through AI-powered narrative bridges.

## Run Locally

```bash
npm ci
npm run dev
```

Open `http://localhost:16100`.

## Quality Checks

```bash
npm run check    # lint + test:parser + build
npm run lint
npm run test:parser
npm run build
```

`test:parser` compiles and runs agent tests in:
- `src/lib/agents/queryParser.test.ts`
- `src/lib/agents/orchestrator.test.ts`

---

## Architecture

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/(marketing)/page.tsx` | Marketing landing page — Hero, How It Works, Catalog Preview, CTA |
| `/universe` | `src/app/(universe)/universe/page.tsx` | Main exploration UI — split grid + bridge panel layout |

### Component Structure

```
src/components/
├── layout/
│   ├── Header.tsx              # Fixed glassmorphism navigation bar
│   └── Footer.tsx              # Marketing page footer
├── marketing/
│   ├── HeroSection.tsx         # Constellation SVG + gradient headline + CTAs
│   ├── HowItWorksSection.tsx   # 3-step feature cards
│   ├── CatalogPreviewSection.tsx  # Dynamic story catalog grid
│   └── CtaSection.tsx          # Final call-to-action block
├── universe/
│   ├── useUniverseState.ts     # Central state hook (selection, queries, results)
│   ├── StoryCard.tsx           # Domain-colored card with source/target glow states
│   ├── StoryGrid.tsx           # 2-column responsive story grid
│   ├── SelectedPairBar.tsx     # Source → Target bar with swap/clear/generate
│   ├── BridgePanel.tsx         # Right panel orchestrator
│   ├── QueryInput.tsx          # Search input + starter prompts + recent queries
│   ├── BridgeResultCard.tsx    # Scenario narrative with gradient border
│   ├── TimelineBeats.tsx       # Vertical timeline with neon dots
│   ├── RiskBadge.tsx           # Risk assessment card (neon-rose)
│   ├── NeighborSuggestions.tsx  # Clickable suggestion cards
│   ├── ClarificationPanel.tsx  # Disambiguation UI for ambiguous queries
│   └── ChatHistory.tsx         # Collapsible query/result log
└── ui/
    ├── badge.tsx               # Domain-aware badge (Movie/History/Novel)
    ├── button.tsx              # Button variants (default/outline/secondary/ghost)
    ├── card.tsx                # CVA card (glass/solid variants)
    └── input.tsx               # Text input primitive
```

### Agent Pipeline

| File | Role |
|------|------|
| `src/lib/agents/orchestrator.ts` | Calls navigator/storyteller agents, composes result |
| `src/lib/agents/queryParser.ts` | Natural-language query → source/target node resolution |
| `src/lib/agents/navigatorAgent.ts` | Neighbor suggestion logic (Neo4j + optional model ranking) |
| `src/lib/agents/storytellerAgent.ts` | What-if scenario generation workflow |
| `src/lib/agents/catalog.ts` | Server-side catalog with Neo4j dynamic loading + 5-min cache |
| `src/lib/agents/catalogSeed.ts` | Client-safe static seed data (8 stories) |
| `src/lib/agents/catalogGenerator.ts` | AI story generation via Ollama |

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/catalog` | GET | Returns full dynamic catalog (seed + generated) |
| `/api/catalog/generate` | POST | Triggers AI story generation via Ollama |

---

## Dynamic Catalog

The story catalog starts with 8 seed stories and expands dynamically through AI generation.

### How It Works

1. **Seed catalog** (`catalogSeed.ts`): 8 hand-curated stories across Movie/History/Novel
2. **Dynamic expansion**: AI generates new stories via Ollama, persisted in Neo4j
3. **Full catalog** (`catalog.ts`): Combines seed + Neo4j-generated stories with 5-minute cache
4. **Client loading**: Universe page fetches the full catalog via server action on mount

### Generate New Stories

```bash
# Generate 12 stories (4 per domain)
curl -X POST http://localhost:16100/api/catalog/generate

# Custom count per domain
curl -X POST http://localhost:16100/api/catalog/generate \
  -H "Content-Type: application/json" \
  -d '{"countPerDomain": 6}'

# Schedule weekly via cron (every Monday 3 AM)
# 0 3 * * 1 curl -X POST http://localhost:16100/api/catalog/generate
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEO4J_URI` | Yes | Neo4j connection URI |
| `NEO4J_USERNAME` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | Yes | Neo4j password |
| `OPENAI_API_KEY` | Optional | Enables model-enhanced bridge generation |
| `OLLAMA_BASE_URL` | Optional | Ollama server URL (default: `http://100.126.186.77:11434/v1`) |
| `OLLAMA_MODEL` | Optional | Ollama model name (default: `qwen3:32b`) |
| `CATALOG_GENERATE_SECRET` | Optional | Bearer token for catalog generation API |
| `QUERY_PREFERRED_MEDIA` | Optional | Comma list: `Movie,History,Novel` |
| `QUERY_AMBIGUITY_MARGIN` | Optional | Integer `1..40` |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `cosmos-950` (#020617) | Page and card backgrounds |
| Foreground | `cosmos-100` (#dbeafe) | Primary text |
| Accent Cyan | `neon-cyan` (#22d3ee) | CTAs, source selection, links |
| Accent Violet | `neon-violet` (#a855f7) | Target selection, decorative |
| Accent Rose | `neon-rose` (#f472b6) | Risk badges, alerts |
| Domain Movie | `#60a5fa` | Movie badges, borders, glows |
| Domain History | `#34d399` | History badges, borders, glows |
| Domain Novel | `#f472b6` | Novel badges, borders, glows |
| Display Font | Orbitron | Headings, logos |
| Body Font | Space Grotesk | Body text |

---

## Notes

- Query resolution returns strategy/confidence/candidates metadata used by `ClarificationPanel` for disambiguation.
- Query parser supports options (`preferredMediumOrder`, `ambiguityMargin`) for controlled disambiguation.
- Preferred medium order also affects fallback target selection and candidate chip ordering.
- Query parser infers locale (`ko`/`en`) and localizes clarification prompts.
- `useUniverseState` hook manages all universe page state: selection, queries, results, and actions.
- Story cards support sequential selection: first click → Source (cyan glow), second click → Target (violet glow).
- Manual selection auto-runs bridge generation when both source and target are selected.
- Recent queries stored in localStorage (up to 5) for quick reruns.
- Server action failures return explicit codes: `EMPTY_QUERY`, `INVALID_SELECTION`, `TIMEOUT`, `EXECUTION_FAILED`.

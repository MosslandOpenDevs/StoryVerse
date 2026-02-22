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

## Design Philosophy

### Stories are a graph, not a list

Every narrative — a Hollywood blockbuster, a pivotal historical event, a classic novel — exists in relation to others. Characters echo across centuries, power structures recur in new costumes, moral dilemmas reappear in every genre. StoryVerse makes these invisible threads visible by modeling stories as nodes in a knowledge graph and letting AI synthesize the bridges between them.

### AI as a creative collaborator, not a black box

The system decomposes narrative bridging into specialized agents: a **Parser** that understands what the user is asking (in English or Korean), a **Navigator** that traverses the graph for thematic neighbors, and a **Storyteller** that weaves a plausible cross-domain "What If" scenario with timeline beats and risk assessment. Each agent's contribution is transparent and individually testable.

### The catalog should grow itself

The initial 8 hand-curated seed stories are a starting point, not a ceiling. StoryVerse includes an AI-powered catalog generator (backed by Ollama) that periodically creates new story entries balanced across domains, writes them to Neo4j, and makes them immediately available to users — a living, expanding universe that rewards repeat visits.

### Design is not decoration

The visual layer isn't a skin over functionality — it's part of the product's argument. The dark cosmic theme, domain-specific color coding, glassmorphism cards, and micro-animations all serve information hierarchy and emotional resonance. Every hover glow, gradient border, and timeline dot is a deliberate design decision.

### Ops quality is product quality

A beautiful frontend with silent failures is a broken product. StoryVerse embeds operational diagnostics as a first-class concern: route-level status codes, endpoint fail ratios, latency context, and explicit fallback policies. When something degrades, the system tells you — it doesn't pretend everything is fine.

---

## Design System

### Color Palette

**Cosmos Dark Theme:**

| Token | Hex | Role |
|-------|-----|------|
| `cosmos-950` | `#020617` | Page background, deepest layer |
| `panel` | `#0b1228` | Card and panel backgrounds |
| `cosmos-100` | `#dbeafe` | Primary foreground text |
| `muted` | `#8aa0d1` | Secondary text, descriptions |

**Neon Accent Colors:**

| Token | Hex | Role |
|-------|-----|------|
| `neon-cyan` | `#22d3ee` | Primary actions, source selection, links, CTAs |
| `neon-violet` | `#a855f7` | Target selection, decorative gradients |
| `neon-rose` | `#f472b6` | Risk badges, alerts, warning states |

**Domain Colors** — Every story is immediately identifiable by its medium:

| Domain | Hex | Applied to |
|--------|-----|------------|
| Movie | `#60a5fa` (blue) | Badges, card top-borders, hover glows, dot indicators |
| History | `#34d399` (emerald) | Badges, card top-borders, hover glows, dot indicators |
| Novel | `#f472b6` (pink) | Badges, card top-borders, hover glows, dot indicators |

### Typography

| Font | Type | Usage |
|------|------|-------|
| **Orbitron** | Display (Google Fonts) | Headings, logos, labels, step numbers — tracked with uppercase styling |
| **Space Grotesk** | Body (Google Fonts) | Body text, descriptions, narrative content |

### Shadow System

Domain-specific glow shadows create depth and reinforce color coding:

| Shadow | Effect |
|--------|--------|
| `nebula` | Dual cyan+violet glow (`0 0 30px cyan/25%, 0 0 60px violet/20%`) |
| `movie` | Blue glow (`0 0 20px blue/30%, 0 0 40px blue/15%`) |
| `history` | Green glow (`0 0 20px green/30%, 0 0 40px green/15%`) |
| `novel` | Pink glow (`0 0 20px pink/30%, 0 0 40px pink/15%`) |

### Animation Keyframes

| Animation | Duration | Behavior |
|-----------|----------|----------|
| `fade-in` | 0.5s ease-out | Opacity 0→1 |
| `slide-up` | 0.5s ease-out | translateY(12px)→0 with opacity fade |
| `pulse-glow` | 2s infinite | Cyan glow shadow oscillating 0.4→0.7 opacity |
| `shimmer` | 3s linear infinite | Background-position sweep (loading state) |
| `float` | 6s ease-in-out infinite | translateY(±8px) gentle bobbing |

### Visual Principles

- **Glassmorphism**: Cards and panels use `backdrop-blur-xl` with semi-transparent backgrounds (`bg-panel/50`, `bg-panel/60`) and subtle borders (`border-cosmos-200/10..15`)
- **Domain color coding**: Every story is immediately identifiable by its medium through gradient top-borders (3px), colored badges, and themed glow effects on hover
- **Micro-animations**: `fade-in`, `slide-up`, `pulse-glow`, `float` keyframes for entrance effects, loading states, and decorative motion
- **Hover dynamics**: Cards scale to `1.02x` with domain-colored box-shadows; buttons pulse with neon glow
- **Constellation motif**: Decorative SVG overlay on the hero section — colored dots (cyan/violet/rose) connected by faint lines, slowly floating with 6s animation
- **Gradient text**: Hero headline uses `-webkit-background-clip: text` with cyan→violet gradient
- **Staggered reveals**: Timeline beats enter with 150ms incremental delay per item
- **Space-grid background**: 42px-interval linear grid pattern at 8–20% opacity across all pages
- **Radial nebula layers**: Overlapping radial gradients (cyan at 30%/50%, violet at 60%/70%) creating depth

---

## Page Layouts

### Homepage (`/`) — 4 Sections

```
┌─────────────────────────────────────────────┐
│  Header (fixed, glassmorphism nav bar)      │
│  · bg-cosmos-950/80, backdrop-blur-lg       │
│  · Orbit icon + "StoryVerse" (Orbitron)     │
├─────────────────────────────────────────────┤
│  Hero Section (min-h-dvh)                   │
│  · Background: space-grid + radial cyan     │
│    (18%) + radial violet (12%) +            │
│    constellation SVG (float animation)      │
│  · Headline: "Explore Stories Across        │
│    Worlds" (gradient-text-hero cyan→violet)  │
│  · 3 domain badges inline (Movie/History/   │
│    Novel)                                   │
│  · Primary CTA: "Start Exploring"           │
│    (rounded-full, bg-neon-cyan, glow        │
│    shadow, arrow with hover translate-x)    │
│  · Secondary CTA: "See How It Works"        │
│    (outline, chevron-down icon)             │
│  · Domain icon row: Film/Landmark/BookOpen  │
│    (domain-colored glows, hover scale)      │
├─────────────────────────────────────────────┤
│  How It Works (3 glassmorphism cards)       │
│  · Card 1: "Pick Two Stories"               │
│    (MousePointerClick icon, cyan accent)    │
│  · Card 2: "AI Builds the Bridge"           │
│    (Cpu icon, violet accent)                │
│  · Card 3: "Explore Connections"            │
│    (Compass icon, rose accent)              │
│  · Each: 3px gradient top-border, backdrop- │
│    blur-xl, watermark step number (6xl,     │
│    5% opacity), hover glow shadow           │
├─────────────────────────────────────────────┤
│  Story Catalog Preview (dynamic grid)       │
│  · 4-col (lg) / 2-col (sm) / 1-col grid    │
│  · Each card: domain gradient top-border +  │
│    radial bg (6% opacity) + badge + title   │
│    + summary                                │
│  · Hover: scale(1.02) + domain glow shadow  │
│  · Click → /universe?story={id}             │
├─────────────────────────────────────────────┤
│  CTA Section                                │
│  · "Ready to Bridge Worlds?" heading        │
│  · bg-gradient-to-br cosmos-900/800/900     │
│  · Decorative radial cyan center (8%)       │
│  · "Enter the Universe" button              │
├─────────────────────────────────────────────┤
│  Footer                                     │
│  · "StoryVerse · Agentic GraphRAG           │
│    storytelling engine"                     │
└─────────────────────────────────────────────┘
```

### Universe Page (`/universe`) — Split Layout

```
Desktop (lg+):
┌──────────────────────────────────────────────┐
│  Header (fixed)                              │
├────────────────────┬─────────────────────────┤
│  Story Grid (55%)  │  Bridge Panel (45%)     │
│                    │                         │
│  Guide text:       │  "Command Deck" header  │
│  "Click a story    │  (Orbitron, Compass     │
│   to select as     │   icon, cyan)           │
│   Source"          │                         │
│                    │  ┌─────────────────────┐│
│  ┌──────┐┌──────┐ │  │ Selected Pair Bar   ││
│  │ Card ││ Card │ │  │ Source → Target      ││
│  │ glow ││      │ │  │ [Swap] [Clear]       ││
│  └──────┘└──────┘ │  │ [Generate Bridge]    ││
│  ┌──────┐┌──────┐ │  └─────────────────────┘│
│  │ Card ││ Card │ │                         │
│  │      ││      │ │  ┌─────────────────────┐│
│  └──────┘└──────┘ │  │ Query Input         ││
│  ...2-col grid    │  │ + Starter prompts    ││
│                    │  │ + Recent queries     ││
│                    │  └─────────────────────┘│
│                    │                         │
│                    │  ┌─────────────────────┐│
│                    │  │ Bridge Result Card  ││
│                    │  │ (violet→cyan left   ││
│                    │  │  border gradient)   ││
│                    │  └─────────────────────┘│
│                    │                         │
│                    │  ┌─────────────────────┐│
│                    │  │ Timeline Beats      ││
│                    │  │ (neon dots + glow   ││
│                    │  │  lines, staggered   ││
│                    │  │  fade-in)           ││
│                    │  └─────────────────────┘│
│                    │                         │
│                    │  ┌─────────────────────┐│
│                    │  │ Risk Badge          ││
│                    │  │ (rose accent, pulse)││
│                    │  └─────────────────────┘│
│                    │                         │
│                    │  ┌─────────────────────┐│
│                    │  │ Neighbor Suggest.   ││
│                    │  │ (domain-colored     ││
│                    │  │  mini-cards)        ││
│                    │  └─────────────────────┘│
│                    │                         │
│                    │  ┌─────────────────────┐│
│                    │  │ Chat History        ││
│                    │  │ (collapsible log)   ││
│                    │  └─────────────────────┘│
├────────────────────┴─────────────────────────┤

Mobile: vertical stack (Story Grid → Bridge Panel)
```

---

## Component Architecture

### UI Primitives (`src/components/ui/`)

| Component | Variants | Key Design Details |
|-----------|----------|-------------------|
| `button.tsx` | `default` (cyan bg, glow), `ghost` (transparent), `outline` (border reveal on hover), `secondary` (cosmos-800 bg) | Sizes: sm/default/lg/icon. Focus ring: neon-cyan 2px. Disabled: opacity-50 |
| `card.tsx` | `glass` (backdrop-blur-xl, panel/60 bg, nebula shadow), `solid` (cosmos-900/80, no blur) | CVA-based. Subcomponents: CardHeader, CardContent. rounded-2xl |
| `badge.tsx` | `Movie` (blue bg/border/text), `History` (green), `Novel` (pink) | rounded-full, 15% opacity bg, 30% opacity border, domain text color |
| `input.tsx` | — | cosmos-900/70 bg, cosmos-700/80 border, focus ring neon-cyan, placeholder cosmos-200/50 |

### Layout Components (`src/components/layout/`)

| Component | Design Details |
|-----------|---------------|
| `Header.tsx` | Fixed z-50, h-14, `bg-cosmos-950/80 backdrop-blur-lg`, border-bottom cosmos-200/10. Orbit icon (neon-cyan) + "StoryVerse" (Orbitron, tracking-[0.2em]). Hover: text transitions to neon-cyan |
| `Footer.tsx` | `bg-cosmos-950/60 backdrop-blur-sm`, border-top cosmos-200/10. Brand + tagline at cosmos-200/40 |

### Marketing Components (`src/components/marketing/`)

| Component | Design Details |
|-----------|---------------|
| `HeroSection.tsx` | min-h-dvh centered. 4 background layers: space-grid (20%), radial cyan (18%), radial violet (12%), ConstellationSVG (float 6s, 20% opacity). Constellation: colored dots (cyan/violet/rose 2–3px radius) connected by faint lines (1px, 10–20% strokeOpacity). Gradient headline via `gradient-text-hero`. Primary CTA: rounded-full bg-neon-cyan with arrow hover translate-x. Domain icon row: Film/Landmark/BookOpen with domain glow shadows |
| `HowItWorksSection.tsx` | 3 cards: cyan (MousePointerClick), violet (Cpu), rose (Compass). Each card: rounded-2xl, border-cosmos-200/10, bg-panel/50 backdrop-blur-xl, 3px gradient top-border, watermark step number (text-6xl cosmos-200/5), h-8 w-8 icon. Hover: domain-specific glow shadow |
| `CatalogPreviewSection.tsx` | Grid: 4-col lg / 2-col sm / 1-col. Cards: rounded-2xl, backdrop-blur-xl, 3px domain gradient top-border, radial bg gradient (6% domain color). Hover: scale-[1.02] + domain glow shadow. Links to `/universe?story={id}` |
| `CtaSection.tsx` | rounded-3xl, bg-gradient-to-br cosmos-900→800→900, backdrop-blur-xl. Decorative radial cyan (8%). "Enter the Universe" CTA matches hero primary button |

### Universe Components (`src/components/universe/`)

| Component | Design Details |
|-----------|---------------|
| `StoryCard.tsx` | Button-based, rounded-2xl, hover scale-[1.02]. **Source state**: glow-border-cyan, border-neon-cyan/60, bg-panel/70, "SOURCE" badge (cyan bg/text). **Target state**: glow-border-violet, border-neon-violet/60, bg-panel/70, "TARGET" badge (violet bg/text). **Default**: domain hover shadow. 3px domain gradient top-border. Radial domain bg (5% opacity). Badge + title (Orbitron) + summary (line-clamp-2) |
| `StoryGrid.tsx` | 2-col sm / 1-col grid, gap-3. Context-aware guide text: "Click a story to select as Source" → "Now click a story to select as Target" → "Pair selected" |
| `SelectedPairBar.tsx` | rounded-xl, bg-panel/60 backdrop-blur-xl. Source/Target: domain dot (2.5px colored) + truncated title, "→" separator. Actions: ArrowLeftRight swap, X clear (h-7 w-7 ghost buttons). "Generate Bridge" full-width CTA with Zap icon; pending state shows spinner (border-2 animate-spin) |
| `BridgePanel.tsx` | max-h-[calc(100dvh-5rem)] overflow-y-auto. "Command Deck" header (Orbitron, tracking-[0.14em], uppercase, Compass icon neon-cyan). Orchestrates: SelectedPairBar → QueryInput → ClarificationPanel → BridgeResultCard → TimelineBeats → RiskBadge → NeighborSuggestions → ChatHistory |
| `QueryInput.tsx` | Input + icon submit button. Placeholder: `'Try: "Connect Sherlock Holmes to Star Wars."'`. 5 starter prompt chips: rounded-full, border-cosmos-700/50, bg-cosmos-900/40, text-[11px], hover brightens. Recent queries section (localStorage, up to 5). Submit shows spinner when pending |
| `BridgeResultCard.tsx` | animate-slide-up on mount. rounded-2xl, bg-panel/60 backdrop-blur-xl. Left border accent: w-1 `bg-gradient-to-b from-neon-violet via-neon-cyan to-neon-violet`. Scenario title (Orbitron) + bridge narrative (text-sm leading-relaxed). Footer: "Source → Target" in text-[11px] |
| `TimelineBeats.tsx` | rounded-2xl, bg-panel/60 backdrop-blur-xl. "TIMELINE BEATS" uppercase label. Vertical timeline: neon-cyan dots (11px, border-2, cyan glow shadow `0 0 6px`) + 1px gradient connecting line (cyan/40→transparent). Each beat: animate-fade-in with `animationDelay: ${index * 150}ms` |
| `RiskBadge.tsx` | animate-fade-in. rounded-xl, border-neon-rose/20, bg-neon-rose/5. AlertTriangle icon (neon-rose, animate-pulse). "NARRATIVE RISK" uppercase label |
| `NeighborSuggestions.tsx` | "NEIGHBOR STORIES" uppercase label. flex-wrap grid of buttons: rounded-lg, bg-cosmos-900/50. Per-domain border colors (30%→60% on hover) + domain glow shadow. Title (text-xs) + medium label (text-[10px]) |
| `ClarificationPanel.tsx` | rounded-2xl, border-neon-cyan/20, bg-panel/60 backdrop-blur-xl. Clarification prompt chips (rounded-full, border-neon-cyan/30, hover bg-neon-cyan/10). Source candidates: "SOURCE" label + chips (selected: border-neon-cyan, bg-neon-cyan/10). Target candidates: "TARGET" label + chips (selected: border-neon-violet). Score display if > 0. Bilingual labels (EN/KO) |
| `ChatHistory.tsx` | Collapsible (ChevronDown/Right toggle). max-h-64 overflow-y-auto. User messages: bg-neon-violet/10, Sparkles icon (rose). Assistant messages: bg-cosmos-800/50, Bot icon (cyan). Role labels: text-[10px] tracking-wider uppercase |
| `useUniverseState.ts` | Central state hook. Manages: messages[], query, clarificationPrompts[], sourceCandidates[], targetCandidates[], selectedSourceId/TargetId, uiLocale (en/ko via Hangul detection), recentQueries (localStorage), latestResult, isPending. Actions: runQuery, runNodeSelectionQuery, runCorrectedQuery, handleStoryCardClick (sequential: 1st→source, 2nd→target), swapSelection, clearSelection, generateBridge, submitQuery |

---

## Agentic Pipeline

### Architecture

```
User Query (EN/KO)
  │
  ▼
┌─────────────────────┐
│   Query Parser      │  Bilingual NLP → source/target node resolution
│   5 strategies:     │  100-point scoring, ambiguity detection,
│   explicit_pair     │  locale inference (Hangul → ko)
│   mention_pair      │
│   single_fallback   │
│   default_fallback  │
│   manual_selection   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Orchestrator      │  Parallel execution of Navigator + Storyteller
│                     │  Reads: OPENAI_API_KEY, QUERY_PREFERRED_MEDIA,
│                     │         QUERY_AMBIGUITY_MARGIN
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│Navigat.│ │Storytell.│
│ Agent  │ │  Agent   │
│        │ │          │
│Neo4j   │ │ LLM      │
│GraphRAG│ │ LangGraph│
│+ LLM   │ │ workflow │
│ranking │ │          │
└────┬───┘ └────┬─────┘
     │          │
     ▼          ▼
┌─────────────────────┐
│ UniverseCommandResult│
│  · source/target    │
│  · resolution meta  │
│  · suggestions[]    │
│  · scenario (title, │
│    bridge, timeline,│
│    risk)            │
└─────────────────────┘
```

### Query Parser (`queryParser.ts`)

Resolves natural-language queries into source/target story node pairs.

**Resolution Strategies (precedence order):**

| Strategy | Trigger | Example |
|----------|---------|---------|
| `explicit_pair` | Pattern: "Connect A to B", "Bridge A and B", Korean: "A를 B와 연결" | "Connect Sherlock Holmes to Star Wars" |
| `mention_pair` | Exactly 2 stories detected in text | "What if Dune and Cleopatra shared a timeline?" |
| `single_mention_fallback` | Only 1 story detected → auto-selects fallback target | "Tell me about Blade Runner" |
| `default_fallback` | No stories detected → uses preferred medium order | "Show me something interesting" |
| `manual_selection` | Explicit node IDs (card click) | User clicks two story cards |

**Scoring System (100-point scale):**

| Match Type | Score |
|------------|-------|
| Exact title match | 100 |
| Exact alias match | 90 |
| Title substring match | 80 |
| Alias substring match | 70 |
| + Preferred medium bonus | +(preferredMediaLength - mediumIndex) |

**Ambiguity Detection**: If score difference between top 2 candidates < `QUERY_AMBIGUITY_MARGIN`, triggers clarification UI with ranked candidate chips.

**Bilingual Support**: Korean detected via Hangul Unicode range (가-힣). Clarification prompts, labels, and suggestions localized per `uiLocale`.

### Navigator Agent (`navigatorAgent.ts`)

Finds related neighbor stories via Neo4j graph traversal + optional LLM ranking.

1. Queries Neo4j: `MATCH (origin:Story {id})-[:RELATED_TO]-(candidate:Story)` ordered by graphScore
2. If graph returns results → use them
3. If no graph results → synthetic fallback suggestions with thematic templates
4. If LLM available (GPT-4o-mini) → re-rank candidates by analyzing thematic fit

Output: `StorySuggestion[]` — id, title, medium, explanation, graphScore

### Storyteller Agent (`storytellerAgent.ts`)

Generates "What If" cross-domain scenarios using LLM + LangGraph workflow.

**Workflow steps:**
1. `create_bridge_hypothesis` — synthesize narrative bridge between source and target
2. `build_scenario_timeline` — generate scenario title, 4-beat timeline, risk assessment

**Output:** `WhatIfScenario` — title, bridge narrative, timelineBeats[4], risk

**Default timeline structure:**
1. Inciting Event: signal links both worlds
2. Escalation: both reinterpret as existential threat
3. Convergence: protagonists negotiate alliance
4. Resolution: shared myth redefines both canons

### Catalog Generator (`catalogGenerator.ts`)

AI-powered story catalog expansion via Ollama (OpenAI-compatible API).

- **Model**: qwen3:32b at `100.126.186.77:11434`
- **Generation**: Per domain (Movie/History/Novel), configurable count
- **Deduplication**: Against full catalog (seed + Neo4j + file) by ID and title
- **Persistence**: Neo4j primary, file-based fallback (`data/generated-catalog.json`)
- **Schedule**: Every 3 hours via cron, 4 stories per domain (12 total per run)

---

## Architecture

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

### Agent Pipeline Files

| File | Role |
|------|------|
| `src/lib/agents/orchestrator.ts` | Parallel execution of navigator + storyteller agents, composes `UniverseCommandResult` |
| `src/lib/agents/queryParser.ts` | Bilingual natural-language query → source/target node resolution with 5 strategies |
| `src/lib/agents/navigatorAgent.ts` | Neo4j GraphRAG neighbor traversal + optional LLM re-ranking |
| `src/lib/agents/storytellerAgent.ts` | LangGraph "What If" scenario generation (bridge, timeline, risk) |
| `src/lib/agents/catalog.ts` | Server-side catalog: Neo4j dynamic loading + file fallback + 5-min cache |
| `src/lib/agents/catalogSeed.ts` | Client-safe static seed data (8 stories, no server imports) |
| `src/lib/agents/catalogGenerator.ts` | AI catalog expansion via Ollama (qwen3:32b) |

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/catalog` | GET | Returns full dynamic catalog (seed + Neo4j-generated) |
| `/api/catalog/generate` | POST | Triggers AI story generation via Ollama. Auth: Bearer token or localhost-only |

---

## Dynamic Catalog

The story catalog starts with 8 seed stories and expands dynamically through AI generation.

### How It Works

1. **Seed catalog** (`catalogSeed.ts`): 8 hand-curated stories across Movie/History/Novel — client-safe, no server imports
2. **Dynamic expansion**: AI generates new stories via Ollama, persisted in Neo4j (file fallback when unavailable)
3. **Full catalog** (`catalog.ts`): Combines seed + Neo4j-generated + file-generated stories with 5-minute in-memory cache
4. **Client loading**: Universe page fetches the full catalog via server action on mount, falls back to seed data during loading

### Generate New Stories

```bash
# Generate 12 stories (4 per domain)
curl -X POST http://localhost:16100/api/catalog/generate

# Custom count per domain
curl -X POST http://localhost:16100/api/catalog/generate \
  -H "Content-Type: application/json" \
  -d '{"countPerDomain": 6}'

# Current cron schedule: every 3 hours
# 0 */3 * * * curl -s -X POST http://localhost:16100/api/catalog/generate ...
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEO4J_URI` | Yes | Neo4j connection URI (e.g. `bolt://localhost:7687`) |
| `NEO4J_USERNAME` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | Yes | Neo4j password |
| `OPENAI_API_KEY` | Optional | Enables GPT-4o-mini for enhanced bridge generation and navigator ranking |
| `OLLAMA_BASE_URL` | Optional | Ollama server URL (default: `http://100.126.186.77:11434/v1`) |
| `OLLAMA_MODEL` | Optional | Ollama model name (default: `qwen3:32b`) |
| `CATALOG_GENERATE_SECRET` | Optional | Bearer token for catalog generation API |
| `QUERY_PREFERRED_MEDIA` | Optional | Comma list: `Movie,History,Novel` — affects fallback target and candidate ordering |
| `QUERY_AMBIGUITY_MARGIN` | Optional | Integer `1..40` — score threshold for triggering clarification UI |

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

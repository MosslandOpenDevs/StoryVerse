# StoryVerse Monorepo

> **Narrative universe interface where agentic storytelling, visual craft, and operational reliability are engineered together.**

![Status](https://img.shields.io/badge/Status-Active_Development-0ea5e9)
![Domain](https://img.shields.io/badge/Domain-Agentic_Narrative-black)
![Stack](https://img.shields.io/badge/Stack-Next.js_·_Neo4j_·_Ollama-black)
![License](https://img.shields.io/badge/License-MIT-black)

---

## Background

Most story products optimize for either experience quality or runtime reliability, rarely both. StoryVerse was built with a deliberate **triple-axis model**:

- **Axis A — Immersive narrative UX**: A visually rich, modern 2D interface where users explore and connect stories across Movies, History, and Novels through AI-powered narrative bridges.
- **Axis B — Agentic intelligence**: A multi-agent pipeline (Parser → Navigator → Storyteller) that resolves natural-language queries, traverses a Neo4j knowledge graph, and synthesizes cross-domain "What-If" scenarios.
- **Axis C — Operational transparency**: Route-level diagnostics, explicit fallback policies, and auditable failure codes — so degradation is surfaced, not hidden.

This matters because API health can appear green while public routes silently degrade. StoryVerse treats narrative quality and SRE quality as one inseparable product.

---

## Mission

Deliver a compelling, AI-driven narrative universe that lets anyone discover hidden connections between the stories that shape our world — while remaining operationally transparent under continuous deployment.

---

## Vision

StoryVerse aims to become a reusable blueprint for **agentic content systems** where:

- Creative modules are composable and domain-portable
- The story catalog grows autonomously through AI generation
- User-path reliability is measurable at every route
- Fallback policy behavior is auditable, not accidental
- Visual design and engineering rigor reinforce each other

---

## Project Philosophy

### Stories are a graph, not a list

Every narrative — whether a Hollywood blockbuster, a pivotal historical event, or a classic novel — exists in relation to others. Characters echo across centuries, power structures recur in new costumes, and moral dilemmas reappear in every genre. StoryVerse makes these invisible threads visible by modeling stories as nodes in a knowledge graph and letting AI synthesize the bridges between them.

### AI as a creative collaborator, not a black box

The system doesn't just "generate text." It decomposes the problem into specialized agents — a **Parser** that understands what the user is asking (in English or Korean), a **Navigator** that traverses the graph for thematic neighbors, and a **Storyteller** that weaves a plausible cross-domain scenario with timeline beats and risk assessment. Each agent's contribution is transparent and individually testable.

### The catalog should grow itself

The initial 8 hand-curated stories are a seed, not a ceiling. StoryVerse includes an AI-powered catalog generator (backed by Ollama) that periodically creates new story entries balanced across domains, writes them to Neo4j, and makes them immediately available to users. The goal: a living, expanding universe that rewards repeat visits.

### Design is not decoration

The visual layer isn't a skin over functionality — it's part of the product's argument. The dark cosmic theme, domain-specific color coding (Movie blue, History green, Novel pink), glassmorphism cards, and micro-animations all serve information hierarchy and emotional resonance. Every hover glow, gradient border, and timeline dot is a deliberate design decision.

### Ops quality is product quality

A beautiful frontend with silent failures is a broken product. StoryVerse embeds operational diagnostics as a first-class concern: route-level status codes, endpoint fail ratios, latency context, and explicit fallback policies. When something degrades, the system tells you — it doesn't pretend everything is fine.

---

## Development Progress

### Completed

| Phase | Description | Status |
|-------|-------------|--------|
| Agentic Pipeline | Parser → Navigator → Storyteller agent chain with Neo4j GraphRAG | Done |
| Query Resolution | Bilingual (EN/KO) natural-language parsing with 5 resolution strategies, confidence levels, and clarification UX | Done |
| 3D Universe (v1) | Three.js-based 16,000-node 3D visualization with interactive CommandDeck | Done (retired) |
| **2D Redesign (v2)** | Complete UX/UI overhaul to modern card-based 2D layout with glassmorphism dark theme | **Done** |
| **Dynamic Catalog** | AI auto-generation via Ollama, Neo4j storage, cron-triggerable API endpoint | **Done** |
| Ops Diagnostics | Route/API status codes, fail ratios, latency metrics, tunnel churn detection | Done |

### In Progress / Planned

- Neo4j graph seeding automation (RELATED_TO relationships for generated stories)
- Story detail pages with full bridge visualization
- User session persistence and favorites
- Multi-language UI (beyond query parsing)

---

## UX/UI Design

### Design System

| Token | Value | Usage |
|-------|-------|-------|
| **Background** | `cosmos-950` (#020617) | Page and card backgrounds |
| **Foreground** | `cosmos-100` (#dbeafe) | Primary text |
| **Muted** | `#8aa0d1` | Secondary text |
| **Accent Cyan** | `neon-cyan` (#22d3ee) | CTAs, source selection, links |
| **Accent Violet** | `neon-violet` (#a855f7) | Target selection, decorative |
| **Accent Rose** | `neon-rose` (#f472b6) | Risk badges, alerts |
| **Domain Movie** | `#60a5fa` | Movie badges, borders, glows |
| **Domain History** | `#34d399` | History badges, borders, glows |
| **Domain Novel** | `#f472b6` | Novel badges, borders, glows |
| **Display Font** | Orbitron | Headings, logos, labels |
| **Body Font** | Space Grotesk | Body text, descriptions |

### Visual Principles

- **Glassmorphism**: Cards use `backdrop-blur-xl` with semi-transparent backgrounds and subtle borders
- **Domain color coding**: Every story is immediately identifiable by its medium through gradient top-borders, colored badges, and themed glow effects
- **Micro-animations**: `fade-in`, `slide-up`, `pulse-glow`, `float` keyframes for entrance effects, loading states, and decorative motion
- **Hover dynamics**: Cards scale to 1.02x with domain-colored box-shadows; buttons pulse with neon glow
- **Constellation motif**: A decorative SVG overlay on the hero page evokes a star-map aesthetic — nodes connected by faint lines, slowly floating

### Homepage (`/`) — 4 Sections

```
┌─────────────────────────────────────────────┐
│  Header (fixed, glassmorphism nav bar)      │
├─────────────────────────────────────────────┤
│  Hero Section                               │
│  · Constellation SVG background (animated)  │
│  · Gradient headline: "Explore Stories      │
│    Across Worlds"                           │
│  · Domain badges (Movie / History / Novel)  │
│  · Dual CTA: "Start Exploring" + "How It   │
│    Works"                                   │
│  · Domain icon row with colored glows       │
├─────────────────────────────────────────────┤
│  How It Works (3 step cards)                │
│  · Pick Two Stories → AI Builds Bridge →    │
│    Explore Connections                      │
│  · Glassmorphism cards with gradient top    │
│    borders and background step numbers      │
├─────────────────────────────────────────────┤
│  Story Catalog Preview (dynamic grid)       │
│  · All catalog stories in responsive grid   │
│  · Domain-colored borders + hover glow      │
│  · Click → /universe?story={id}             │
├─────────────────────────────────────────────┤
│  CTA Section + Footer                       │
│  · "Ready to Bridge Worlds?" call-to-action │
└─────────────────────────────────────────────┘
```

### Universe Page (`/universe`) — Split Layout

```
Desktop:
┌──────────────────────────────────────────────┐
│  Header                                      │
├────────────────────┬─────────────────────────┤
│  Story Grid (55%)  │  Bridge Panel (45%)     │
│                    │                         │
│  [Story Card]      │  Command Deck header    │
│  [Story Card]      │  Selected Pair Bar      │
│  [Story Card]      │  Query Input + Prompts  │
│  [Story Card]      │  Clarification Panel    │
│  ...2-col grid     │  Bridge Result Card     │
│                    │  Timeline Beats         │
│                    │  Risk Badge             │
│                    │  Neighbor Suggestions   │
│                    │  Chat History (toggle)  │
├────────────────────┴─────────────────────────┤

Mobile: vertical stack (grid → panel)
```

### Component Architecture (Universe)

| Component | Responsibility |
|-----------|---------------|
| `StoryCard` | Domain-colored card with source/target glow states, hover scale |
| `StoryGrid` | 2-column responsive grid of all catalog stories |
| `SelectedPairBar` | Source → Target display with swap/clear/generate actions |
| `QueryInput` | Search bar + starter prompt chips + recent queries |
| `BridgeResultCard` | Scenario title + bridge narrative with violet→cyan gradient border |
| `TimelineBeats` | Vertical timeline with neon dots and staggered fade-in |
| `RiskBadge` | Neon-rose warning card with pulse animation |
| `NeighborSuggestions` | Clickable suggestion cards with domain-colored borders |
| `ClarificationPanel` | Node disambiguation UI for ambiguous queries |
| `ChatHistory` | Collapsible query/result log |
| `BridgePanel` | Right-side orchestrator composing all bridge sub-components |
| `useUniverseState` | Central state hook: selection, queries, results, actions |

---

## Architecture

```mermaid
flowchart LR
  User[Browser] --> Web[storyverse-web]
  Web --> Orchestrator[Agent Orchestrator]
  Orchestrator --> Parser[Query Parser]
  Orchestrator --> Navigator[Navigator Agent]
  Orchestrator --> Storyteller[Storyteller Agent]
  Navigator --> Neo4j[(Neo4j Graph)]
  Web --> CatalogAPI[/api/catalog]
  CatalogAPI --> Neo4j
  Web --> GenerateAPI[/api/catalog/generate]
  GenerateAPI --> Ollama[Ollama LLM]
  GenerateAPI --> Neo4j
  Web --> Ops[ops-check]
  Ops --> Metrics[Route Codes + Fail Ratios + Latency]
```

## Repository Scope

| Component | Role |
|-----------|------|
| `storyverse-web` | Next.js web client, API routes, agent pipeline, ops diagnostics |
| `storyverse-web/src/lib/agents/` | Agentic narrative pipeline (parser, navigator, storyteller, catalog) |
| `storyverse-web/src/components/` | UI components (universe, marketing, layout, primitives) |
| `storyverse-web/scripts/ops-check.sh` | Route/API status, fail counts, ratios, latency context |

---

## Operational Policy

The project follows a **fallback-allowing operational policy** (Policy A) under primary-route instability:

- Primary degradation is surfaced as warning/degraded
- Fallback success is still captured for continuity
- Strict-fail transitions are policy-controlled, not accidental
- Server action failures return explicit codes: `EMPTY_QUERY`, `INVALID_SELECTION`, `TIMEOUT`, `EXECUTION_FAILED`

---

## Quick Start

```bash
cd storyverse-web
npm ci
npm run dev
```

Open `http://localhost:16100`

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEO4J_URI` | Yes | Neo4j connection URI |
| `NEO4J_USERNAME` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | Yes | Neo4j password |
| `OPENAI_API_KEY` | Optional | Enables model-enhanced bridge generation |
| `OLLAMA_BASE_URL` | Optional | Ollama server URL (default: `http://192.168.1.96:11434/v1`) |
| `OLLAMA_MODEL` | Optional | Ollama model name (default: `llama3`) |
| `CATALOG_GENERATE_SECRET` | Optional | Bearer token for catalog generation API |
| `QUERY_PREFERRED_MEDIA` | Optional | Comma list: `Movie,History,Novel` |
| `QUERY_AMBIGUITY_MARGIN` | Optional | Integer `1..40` |

### Generate New Stories

```bash
# Trigger AI catalog generation (4 stories per domain = 12 new stories)
curl -X POST http://localhost:16100/api/catalog/generate

# With custom count
curl -X POST http://localhost:16100/api/catalog/generate \
  -H "Content-Type: application/json" \
  -d '{"countPerDomain": 6}'

# Schedule weekly via cron (every Monday 3 AM)
# 0 3 * * 1 curl -X POST http://localhost:16100/api/catalog/generate
```

## Quality Gate

```bash
cd storyverse-web
npm run check   # lint + test:parser + build
```

## License

MIT

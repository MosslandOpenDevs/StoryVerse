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
npm run check      # lint + test:parser + build
npm run lint
npm run test:parser
npm run build
npm run ops:check  # endpoint availability/latency probe (scripts/ops-check.sh)
```

`test:parser` compiles and runs 68 agent tests via `node --test`:
- `src/lib/agents/queryParser.test.ts` (62 tests)
- `src/lib/agents/orchestrator.test.ts` (4 tests)
- `src/lib/agents/clarificationChoices.test.ts` (2 tests)

---

## Design Philosophy

### Stories are a graph, not a list

Every narrative — a Hollywood blockbuster, a pivotal historical event, a classic novel — exists in relation to others. Characters echo across centuries, power structures recur in new costumes, moral dilemmas reappear in every genre. StoryVerse makes these invisible threads visible by modeling stories as nodes in a knowledge graph and letting AI synthesize the bridges between them.

### AI as a creative collaborator, not a black box

The system decomposes narrative bridging into specialized agents: a **Parser** that understands what the user is asking (in English or Korean), a **Navigator** that traverses the graph for thematic neighbors, and a **Storyteller** that weaves a plausible cross-domain "What If" scenario with timeline beats and risk assessment. Each agent's contribution is transparent and individually testable.

### The catalog should grow itself

The initial 8 hand-curated seed stories are a starting point, not a ceiling. StoryVerse includes an AI-powered catalog generator (backed by Ollama) that creates new story entries balanced across domains — on demand or from an external schedule — writes them to Neo4j (with a file fallback), and makes them immediately available to users — a living, expanding universe that rewards repeat visits.

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

### Homepage (`/`) — Quick Nav + 4 Sections

```
┌─────────────────────────────────────────────┐
│  Header (fixed, glassmorphism nav bar)      │
│  · bg-cosmos-950/80, backdrop-blur-lg       │
│  · Skip link + Orbit icon + "StoryVerse"    │
│    (Orbitron) + Home/Universe nav links     │
├─────────────────────────────────────────────┤
│  Marketing Quick Nav (sticky under header)  │
│  · Progress bar across the 4 sections       │
│  · Prev/Next/Resume + section filter        │
│    (?nav= URL sync) + pins (max 4) +        │
│    recent trail (max 3)                     │
│  · ~25 keyboard shortcuts (? opens guide)   │
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
│  Footer (live health footer)                │
│  · Brand + "Agentic GraphRAG storytelling   │
│    engine" tagline                          │
│  · Polls /api/health every 15s · manual     │
│    Refresh · fresh / stale (>20s) labeling  │
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
│  Catalog toolbar:  │  "Command Deck" header  │
│  refresh button +  │  (Orbitron, Compass     │
│  updated-at time + │   icon, cyan)           │
│  story count       │                         │
│                    │  ┌─────────────────────┐│
│  Search box (/)    │  │ Shortcut Guide (?)  ││
│  title/summary/    │  │ (collapsible)       ││
│  medium/aliases    │  └─────────────────────┘│
│  + quick picks 1-4 │  ┌─────────────────────┐│
│  + medium lanes    │  │ Selected Pair Bar   ││
│  A/M/H/N w/ counts │  │ Source → Target      ││
│  + copy/open       │  │ [Copy][Open][Prompt]││
│  filtered view     │  │ [Swap] [Clear]       ││
│                    │  │ [Generate Bridge]    ││
│  Active-filter     │  └─────────────────────┘│
│  chips + hidden-   │  ┌─────────────────────┐│
│  selection notice  │  │ Recent Pairs (1-5)  ││
│                    │  │ resume/copy/open/   ││
│  Selected-pair +   │  │ remove per slot     ││
│  recent-pairs      │  └─────────────────────┘│
│  strips (max 3)    │  ┌─────────────────────┐│
│                    │  │ Query Input         ││
│  Guide text:       │  │ + Starter prompts    ││
│  "Click a story    │  │ + Recent queries     ││
│   to select as     │  └─────────────────────┘│
│   Source"          │  ┌─────────────────────┐│
│                    │  │ Clarification Panel ││
│  ┌──────┐┌──────┐ │  └─────────────────────┘│
│  │ Card ││ Card │ │  ┌─────────────────────┐│
│  │ glow ││      │ │  │ Bridge Result Card  ││
│  └──────┘└──────┘ │  │ (violet→cyan left   ││
│  ┌──────┐┌──────┐ │  │  border gradient)   ││
│  │ Card ││ Card │ │  └─────────────────────┘│
│  │      ││      │ │  ┌─────────────────────┐│
│  └──────┘└──────┘ │  │ Timeline Beats      ││
│  ...2-col grid    │  │ (neon dots + glow   ││
│                    │  │  lines, staggered   ││
│                    │  │  fade-in)           ││
│                    │  └─────────────────────┘│
│                    │  ┌─────────────────────┐│
│                    │  │ Risk Badge          ││
│                    │  │ (rose accent, pulse)││
│                    │  └─────────────────────┘│
│                    │  ┌─────────────────────┐│
│                    │  │ Neighbor Suggest.   ││
│                    │  │ (domain-colored     ││
│                    │  │  mini-cards)        ││
│                    │  └─────────────────────┘│
│                    │  ┌─────────────────────┐│
│                    │  │ Chat History        ││
│                    │  │ ("Query Log",       ││
│                    │  │  collapsible)       ││
│                    │  └─────────────────────┘│
├────────────────────┴─────────────────────────┤

Mobile: vertical stack (Story Grid → Bridge Panel)
```

**Universe page state & shortcuts:**

- Search box filters by title, summary, medium, and aliases; medium lanes (All/Movie/History/Novel) show live match counts and disable when empty
- Filters and selection sync to URL params `q` / `medium` / `source` / `target` (`story` is accepted as a legacy alias for `source`) and persist to localStorage
- Quick filters 1-4 apply preset search terms (Sherlock / galaxy / dynasty / rebellion)
- Keyboard: `/` focuses search · A/M/H/N switch medium lanes · L copies the filtered-view link · Shift+L copies the selected-pair link (when a pair is ready) · O opens the filtered view in a new tab · Esc cascades (clear selection → clear search/filters → blur search)
- Active-filter chips are removable one by one; an amber hidden-selection notice appears when the current filters hide a selected story ("Reveal selected stories" resets filters)
- Left column shows a selected-pair strip (generate / copy link / open / copy prompt / swap / clear) and a recent-pairs strip (max 3 shown, resume/copy/open/remove per pair + copy-recents bundle + clear all)
- Catalog header: refresh button (disabled while loading), last-refresh timestamp, story count, and a retryable error banner on refresh failure

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
| `Header.tsx` | Fixed z-50, h-14, `bg-cosmos-950/80 backdrop-blur-lg`, border-bottom cosmos-200/10. "Skip to main content" link (sr-only until focused) targeting `#main-content`. Orbit icon (neon-cyan) + "StoryVerse" (Orbitron, tracking-[0.2em]). Home + Universe nav links with icons; the active route (including nested paths) gets neon-cyan text and `aria-current="page"`. Hover: text transitions to neon-cyan |
| `Footer.tsx` | Live health footer. `bg-cosmos-950/60 backdrop-blur-sm`, border-top cosmos-200/10. Brand + tagline at cosmos-200/40. Polls `GET /api/health` every 15s (`cache: "no-store"`) and shows live/degraded/checking status with `fresh` / `stale Ns` labeling once the health timestamp is older than 20s (also rendered as within/over SLA), `service@version · nodeEnv · snapshot time`, a "checked at" clock, and a manual Refresh button (disabled + `aria-busy` while loading). Status line uses `role="status"` with `aria-live="polite"` |

### Marketing Components (`src/components/marketing/`)

| Component | Design Details |
|-----------|---------------|
| `MarketingQuickNav.tsx` | Sticky quick nav (top-16, z-40) pinned under the header. Progress bar tracks scroll position across the 4 landing sections (`hero` / `how-it-works` / `story-catalog` / `launch-storyverse`) via IntersectionObserver. Prev/Next buttons + "Resume" jump to the last visited section (localStorage). Section filter box synced to the `?nav=` URL param + localStorage, with ↑/↓ match navigation, Enter jump, Cmd/Ctrl+Enter open-in-new-tab, Alt+Enter copy-link. Pins (max 4: `F` toggles current section, Shift+F pins/unpins all filtered matches, keys `5-8` jump to pinned slots) and recent trail (max 3, key `9` jumps to the latest trail entry, Shift+T copies the trail bundle). Clipboard bundles: `C` section link, `O` open section link, `B` full navigation bundle, Shift+P pinned bundle, Shift+C filtered-results bundle, Shift+L filtered-view link, plus a rescue bundle when a filter has no matches. `?` toggles a copyable shortcut guide (~25 shortcuts); other keys: `1-4` direct section jumps, `[`/`]` prev/next (vim-style `K` prev / `J` next), Home/End first/last, `R` resume, Shift+R resets all saved nav state, Esc clears the filter / closes the guide |
| `HeroSection.tsx` | min-h-dvh centered. 4 background layers: space-grid (20%), radial cyan (18%), radial violet (12%), ConstellationSVG (float 6s, 20% opacity). Constellation: colored dots (cyan/violet/rose 2–3px radius) connected by faint lines (1px, 10–20% strokeOpacity). Gradient headline via `gradient-text-hero`. Primary CTA: rounded-full bg-neon-cyan with arrow hover translate-x. Domain icon row: Film/Landmark/BookOpen with domain glow shadows |
| `HowItWorksSection.tsx` | 3 cards: cyan (MousePointerClick), violet (Cpu), rose (Compass). Each card: rounded-2xl, border-cosmos-200/10, bg-panel/50 backdrop-blur-xl, 3px gradient top-border, watermark step number (text-6xl cosmos-200/5), h-8 w-8 icon. Hover: domain-specific glow shadow |
| `CatalogPreviewSection.tsx` | Section id `story-catalog`. Medium lane filter (All/Movie/History/Novel with live counts) + result status line. Grid: 4-col lg / 2-col sm / 1-col. Cards: rounded-2xl, backdrop-blur-xl, 3px domain gradient top-border, radial bg gradient (6% domain color). Hover: scale-[1.02] + domain glow shadow. Links to `/universe?story={id}` (legacy alias for `source`) |
| `CtaSection.tsx` | rounded-3xl, bg-gradient-to-br cosmos-900→800→900, backdrop-blur-xl. Decorative radial cyan (8%). "Enter the Universe" CTA matches hero primary button |

### Universe Components (`src/components/universe/`)

| Component | Design Details |
|-----------|---------------|
| `StoryCard.tsx` | Button-based, rounded-2xl, hover scale-[1.02]. **Source state**: glow-border-cyan, border-neon-cyan/60, bg-panel/70, "SOURCE" badge (cyan bg/text). **Target state**: glow-border-violet, border-neon-violet/60, bg-panel/70, "TARGET" badge (violet bg/text). **Default**: domain hover shadow. 3px domain gradient top-border. Radial domain bg (5% opacity). Badge + title (Orbitron) + summary (line-clamp-2) |
| `StoryGrid.tsx` | 2-col sm / 1-col grid, gap-3. Context-aware guide text: "Click a story to select as Source" → "Now click a story to select as Target" → "Pair selected". Header shows a `{filtered}/{total} results` badge plus "Filters active" / "Showing full catalog" state with inline clear-search / clear-medium / reset-all buttons. Empty state offers recovery UI: filter-clearing buttons, per-medium "Switch medium" suggestions with match counts, and quick-recovery search chips |
| `SelectedPairBar.tsx` | rounded-xl, bg-panel/60 backdrop-blur-xl. Source/Target: domain dot (2.5px colored) + truncated title + medium label, "→" separator, Ready / "Select one more node" status pill. Actions when both selected: copy pair link, open pair link in new tab, copy bridge prompt (each with copied/failed feedback), ArrowLeftRight swap, X clear (h-7 w-7 ghost buttons). Global shortcuts while a pair is ready (ignored while typing): Enter generate · C copy link · O open link · P copy prompt · S swap · Esc/Backspace clear. "Generate Bridge" full-width CTA with Zap icon; pending state shows spinner (border-2 animate-spin) |
| `BridgePanel.tsx` | max-h-[calc(100dvh-5rem)] overflow-y-auto. "Command Deck" header (Orbitron, tracking-[0.14em], uppercase, Compass icon neon-cyan). Orchestrates: collapsible Shortcut Guide (`?` toggles, Esc closes, open state persisted in localStorage) → SelectedPairBar → Recent Bridge Pairs → QueryInput → ClarificationPanel → BridgeResultCard → TimelineBeats → RiskBadge → NeighborSuggestions → ChatHistory. Recent Bridge Pairs section: last 5 generated source→target pairs (catalog-validated) as chips with slot number, locale + medium badges, saved-at time, and resume / copy-link / open-in-new-tab / remove buttons plus a "Clear all" (confirm when ≥2 pairs). Digit shortcuts: `1-5` resume a slot; the in-app guide also lists Shift/Alt modifier combos for remove/copy/open, but those currently fail on most layouts because the handler parses `event.key` (shifted digits become symbols) — use the per-pair buttons instead |
| `QueryInput.tsx` | Input + clear + icon submit buttons. Placeholder: `'Try: "Connect Sherlock Holmes to Star Wars."'` (Korean variant per locale). 240-char limit (`MAX_QUERY_LENGTH`) with live remaining-character counter (amber under 20 left, rose at limit). Focus shortcuts: Cmd/Ctrl+K (a `/` binding exists too, but on the universe page the catalog-search `/` handler wins); Ctrl/Cmd+Enter submits immediately; IME guard blocks Enter mid-composition. History browsing over recent queries: ↑/↓ at input edges or Ctrl/Cmd+P/N, Home/End jump to oldest/newest, Ctrl/Cmd+Backspace/Delete removes the active item, Ctrl/Cmd+Shift+Backspace/Delete clears all (confirm when ≥2 items), Esc or Ctrl/Cmd+L exits history restoring the draft or clears the input; browsing position announced via aria-live. 3 starter prompt chips per locale (EN/KO): rounded-full, border-cosmos-700/50, bg-cosmos-900/40, text-[11px], hover brightens. Recent queries section (localStorage, up to 5) with per-chip × delete and "Clear all". Submit shows spinner when pending |
| `BridgeResultCard.tsx` | animate-slide-up on mount. rounded-2xl, bg-panel/60 backdrop-blur-xl. Left border accent: w-1 `bg-gradient-to-b from-neon-violet via-neon-cyan to-neon-violet`. Scenario title (Orbitron) + bridge narrative (text-sm leading-relaxed). 4 clipboard actions with copied/failed feedback: copy bridge summary, copy full brief (title + bridge + timeline + risk + next hops), copy timeline beats, copy next hops. Global shortcuts (ignored while typing): B full brief · T timeline · N next hops. Footer: "Source → Target" in text-[11px] + shortcut hint |
| `TimelineBeats.tsx` | rounded-2xl, bg-panel/60 backdrop-blur-xl. "TIMELINE BEATS" uppercase label. Vertical timeline: neon-cyan dots (11px, border-2, cyan glow shadow `0 0 6px`) + 1px gradient connecting line (cyan/40→transparent). Each beat: animate-fade-in with `animationDelay: ${index * 150}ms` |
| `RiskBadge.tsx` | animate-fade-in. rounded-xl, border-neon-rose/20, bg-neon-rose/5. AlertTriangle icon (neon-rose, animate-pulse). "NARRATIVE RISK" uppercase label |
| `NeighborSuggestions.tsx` | "NEIGHBOR STORIES" uppercase label. flex-wrap grid of buttons: rounded-lg, bg-cosmos-900/50. Per-domain border colors (30%→60% on hover) + domain glow shadow. Title (text-xs) + medium label (text-[10px]) |
| `ClarificationPanel.tsx` | rounded-2xl, border-neon-cyan/20, bg-panel/60 backdrop-blur-xl. One-click clarification choice chips (up to 3 alternate source→target pairs built by `clarificationChoices.ts`) that immediately run the corrected pair; Korean prompts get the correct particles (을/를, 와/과) via final-consonant (batchim) detection. Source candidates: "SOURCE" label + chips (selected: border-neon-cyan, bg-neon-cyan/10, `aria-pressed`). Target candidates: "TARGET" label + chips (selected: border-neon-violet). Score display if > 0. "Run corrected query" button enabled once distinct source/target are chosen. Bilingual labels (EN/KO) |
| `ChatHistory.tsx` | "Query Log" — collapsible (ChevronDown/Right toggle; open state and role filter persisted in localStorage) with message count in the header. Role filter chips (all/user/assistant with counts), text search over visible messages, `visible x/y` badge, and a copy-log button that copies the currently filtered view (copied/failed feedback). max-h-64 overflow-y-auto. User messages: bg-neon-violet/10, Sparkles icon (rose). Assistant messages: bg-cosmos-800/50, Bot icon (cyan). Role labels: text-[10px] tracking-wider uppercase |
| `useUniverseState.ts` | Central state hook. Manages: messages[], query (normalized to 240 chars), clarificationChoices[], sourceCandidates[], targetCandidates[], selectedSourceId/TargetId, uiLocale (en/ko via Hangul detection), recentQueries (localStorage `storyverse:recent-queries`, limit 5), recentPairs (localStorage `storyverse:recent-pairs`, limit 5, deduped by source:target), latestResult, isPending. Persists the active selection to localStorage (`storyverse:active-selection`) and restores it on load when neither `source` nor `target` URL param is present. Auto-runs bridge generation once per pair whenever both `source` and `target` appear in the URL and no result is shown — this covers deep links and, because the page mirrors manual selection into the URL, freshly staged card pairs as well. Actions: runQuery, runNodeSelectionQuery, runCorrectedQuery, runClarificationChoice, handleStoryCardClick (sequential: 1st→source, 2nd→target, 3rd restarts with a new source), swapSelection, clearSelection, resumeRecentPair, removeRecentPairAt / clearRecentPairs, removeRecentQueryAt / clearRecentQueries, generateBridge, submitQuery |

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

**Ambiguity Detection** (evaluated per side — source and target independently):

- No candidates matched → ambiguous
- Exactly one candidate → ambiguous only if its score < 80
- Top score ≥ 95 → never ambiguous
- Otherwise ambiguous when `top1 − top2 <= margin` (default margin 15; override via `QUERY_AMBIGUITY_MARGIN`, valid range 1..40)

Ambiguity on either side triggers the clarification UI with ranked candidate chips.

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

**Workflow** (LangGraph `entrypoint("storyteller-agent")` composed of two `task`s):
1. `create-bridge-hypothesis` — synthesize narrative bridge between source and target (LLM when a model is provided; deterministic relic-discovery fallback otherwise)
2. `build-scenario-timeline` — generate scenario title, 4-beat timeline, risk assessment

**Output:** `WhatIfScenario` — title, bridge narrative, timelineBeats[4], risk

**Default timeline structure:**
1. Inciting Event: signal links both worlds
2. Escalation: both reinterpret as existential threat
3. Convergence: protagonists negotiate alliance
4. Resolution: shared myth redefines both canons

### Catalog Generator (`catalogGenerator.ts`)

AI-powered story catalog expansion via Ollama (OpenAI-compatible API).

- **Model**: `OLLAMA_MODEL` (default `qwen3:32b`) served from `OLLAMA_BASE_URL` (OpenAI-compatible endpoint; the code default points at an internal lab host — set your own, e.g. `http://localhost:11434/v1`)
- **Generation**: Per domain (Movie/History/Novel), configurable count (`countPerDomain`, default 4, clamped 1–10)
- **Deduplication**: Against full catalog (seed + Neo4j + file) by ID and title
- **Persistence**: Neo4j primary, file-based fallback (`data/generated-catalog.json`)
- **Schedule**: Not built-in — trigger `POST /api/catalog/generate` manually or from an external cron (see example below)

---

## Architecture

### Component Structure

```
src/components/
├── layout/
│   ├── Header.tsx              # Fixed glassmorphism navigation bar
│   └── Footer.tsx              # Marketing page footer
├── marketing/
│   ├── MarketingQuickNav.tsx   # Sticky landing quick-nav (progress, filter, pins, trail, shortcuts)
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
| `src/lib/agents/clarificationChoices.ts` | Builds one-click clarification pair prompts (up to 3) with Korean particle handling (을/를, 와/과) |
| `src/lib/agents/navigatorAgent.ts` | Neo4j GraphRAG neighbor traversal + optional LLM re-ranking |
| `src/lib/agents/storytellerAgent.ts` | LangGraph "What If" scenario generation (bridge, timeline, risk) |
| `src/lib/agents/catalog.ts` | Server-side catalog: Neo4j dynamic loading + file fallback + 5-min cache |
| `src/lib/agents/catalogSeed.ts` | Client-safe static seed data (8 stories, no server imports) |
| `src/lib/agents/catalogGenerator.ts` | AI catalog expansion via Ollama (qwen3:32b) |

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Liveness snapshot: `ok`, `service`, `version`, `nodeEnv`, `uptimeSec`, `timestamp`. Served with `Cache-Control: no-store`; polled by the footer every 15s |
| `/api/catalog` | GET | Returns full dynamic catalog (seed + generated) as `{ count, catalog }` |
| `/api/catalog/generate` | POST | Triggers AI story generation via Ollama. Auth: Bearer token; required in production (refused when `NODE_ENV=production` and no secret is set), localhost-only in development |

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

# Example external cron schedule (the app ships no scheduler): every 3 hours
# 0 */3 * * * curl -s -X POST http://localhost:16100/api/catalog/generate ...
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEO4J_URI` | Optional | Neo4j connection URI (e.g. `bolt://localhost:7687`). If any of the three `NEO4J_*` values is missing, the app runs in graceful degraded mode: the catalog serves seed stories + the `data/generated-catalog.json` file fallback, and the navigator produces heuristic fallback suggestions instead of graph traversal |
| `NEO4J_USERNAME` | Optional | Neo4j username (all three `NEO4J_*` values are needed to enable graph features) |
| `NEO4J_PASSWORD` | Optional | Neo4j password (all three `NEO4J_*` values are needed to enable graph features) |
| `OPENAI_API_KEY` | Optional | Enables GPT-4o-mini for enhanced bridge generation and navigator ranking |
| `OLLAMA_BASE_URL` | Optional | OpenAI-compatible Ollama endpoint for catalog generation; the code default points at an internal lab host — set your own (e.g. `http://localhost:11434/v1`) |
| `OLLAMA_MODEL` | Optional | Ollama model name (default: `qwen3:32b`) |
| `CATALOG_GENERATE_SECRET` | Prod required | Bearer token for the catalog generation API. Required in production — `POST /api/catalog/generate` is refused when `NODE_ENV=production` and no secret is set. In development, requests whose `Host` is `localhost`/`127.0.0.1` are allowed without it (a convenience gate, not a security boundary) |
| `QUERY_PREFERRED_MEDIA` | Optional | Comma list: `Movie,History,Novel` — affects fallback target and candidate ordering |
| `QUERY_AMBIGUITY_MARGIN` | Optional | Integer `1..40` — max score gap between top candidates still treated as ambiguous (default 15) |

---

## Notes

- Query resolution returns strategy/confidence/candidates metadata used by `ClarificationPanel` for disambiguation.
- Query parser supports options (`preferredMediumOrder`, `ambiguityMargin`) for controlled disambiguation.
- Preferred medium order also affects fallback target selection and candidate chip ordering.
- Query parser infers locale (`ko`/`en`) and localizes clarification prompts.
- `useUniverseState` hook manages all universe page state: selection, queries, results, and actions.
- Story cards support sequential selection: first click → Source (cyan glow), second click → Target (violet glow); a third click restarts with a new source.
- Once both `source` and `target` are present in the URL and no result is displayed, the pair auto-runs once (per pair). Because the page mirrors manual card selection into the URL, staging a fresh pair effectively auto-generates too; the explicit "Generate Bridge" button (or Enter) covers re-runs and resumed pairs while a result is on screen.
- Recent queries and recent bridge pairs are stored in localStorage (up to 5 each) for quick reruns; the active pair selection also persists across reloads.
- Server actions run with a 15s timeout, up to 2 attempts, and 150ms incremental retry backoff (timeouts are not retried).
- Server action failures return explicit codes: `EMPTY_QUERY`, `INVALID_SELECTION`, `TIMEOUT`, `EXECUTION_FAILED`.

# StoryVerse

<p align="center">
  <img src="./docs/assets/readme/hero.svg" alt="StoryVerse cover" width="100%" />
</p>

<p align="center">
  <strong>Agentic narrative interface with route-aware operational diagnostics.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js"/>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white"/>
</p>

## Overview

StoryVerse is designed to do two jobs simultaneously:

- deliver a high-quality narrative exploration UX (`/`, `/universe`)
- provide precise operational context when real user routes degrade

This dual focus is critical in environments where API health alone can hide actual user-facing instability.

## What’s in this repository

- `storyverse-web/` — primary Next.js application
- parser / navigator / storyteller agent modules
- operational scripts with route/API diagnostics and fallback-aware reporting

## Architecture snapshot

```mermaid
flowchart LR
  User[Browser User] --> Web[storyverse-web]
  Web --> Agents[Agent Orchestrator]
  Agents --> Modules[Parser / Navigator / Storyteller]
  Web --> Ops[ops-check.sh]
  Ops --> Metrics[Route Code + Fail Ratio + API Code]
```

## Why this architecture

- Story UX and operational quality are tracked together, not separately.
- Route-level status and fail ratio expose degraded paths quickly.
- Fallback behavior can be monitored without pretending primary is healthy.

## Developer quickstart

```bash
cd storyverse-web
npm ci
npm run dev
```

Open: <http://localhost:6100>

## Quality gates

```bash
cd storyverse-web
npm run check
```

Includes lint, parser tests, and production build verification.

## Operations workflow

```bash
cd storyverse-web
bash scripts/ops-check.sh
```

Ops report fields include (evolving):

- primary/selected route codes
- endpoint fail counts and fail ratios
- API health code coverage
- latency context per route group

## Roadmap focus

- stronger route-chain diagnostics (edge → proxy → upstream)
- rolling trend metrics for fail ratio and recovery windows
- better degradation classification for alerting and summaries

## Security and privacy

- No credentials in docs or screenshots.
- No private network/internal token references in public outputs.
- Keep operational reports sanitized before broad sharing.

## License

MIT (or project-defined license)

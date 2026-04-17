# Engine Foundations — Context

## 1. Feature

Implement Phase 2 ("Engine Foundations") from the initial architecture plan. This produces the five foundational engine modules that every later engine module depends on: seeded PRNG, graph data structure, topology DTO with constraint validators, binary-heap event queue, and link model. No simulation, no UI, no scoring — just data structures and validators.

## 2. Source Material

This feature is Phase 2 of the phased build plan in:

- [Initial Architecture — Plan](../2026-04-17-initial-architecture/3-plan.md) — Phase 2 section defines the files, their responsibilities, and the deployable check.
- [Initial Architecture — Research](../2026-04-17-initial-architecture/2-research.md) — Sections 3–4 define the module breakdown and data-shape contracts that these classes must conform to.
- [Initial Architecture — Context](../2026-04-17-initial-architecture/0-context.md) — Architectural commitments (pure client-side, seeded PRNG, IIFE module pattern, no build step).

## 3. Depends On

- Phase 1 (Project Skeleton) — already complete. `index.html`, `css/style.css`, `js/dcn.js` exist and the `window.DCN` namespace is bootstrapped.

## 4. What This Feature Produces

Five files under `js/engine/`:

- `prng.js` — Mulberry32 seeded PRNG
- `event-queue.js` — binary-heap priority queue keyed by event time
- `link.js` — link model (bandwidth, latency, in-flight packet queue)
- `graph.js` — graph data structure (nodes, links, adjacency, degree, BFS, Dijkstra)
- `topology.js` — topology DTO + constraint validators

Plus `index.html` updates to load all five in dependency order.

## 5. Out of Scope

- Simulation (Phase 3)
- All-reduce strategies (Phase 3)
- Scoring / evaluator (Phase 3)
- Any UI work (Phase 4+)

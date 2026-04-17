# DES Kernel + Scoring — Context

## 1. Feature

Implement Phase 3 ("DES Kernel + Scoring") from the [initial architecture plan](../2026-04-17-initial-architecture/3-plan.md). This produces the end-to-end simulation and scoring pipeline: given a topology, the evaluator runs both all-reduce strategies through the discrete-event simulator, picks the winner, scores it, and returns `{ score, events, validation, strategy }`.

## 2. Source Material

This feature is Phase 3 of the phased build plan in:

- [Initial Architecture — Plan](../2026-04-17-initial-architecture/3-plan.md) — Phase 3 section defines the files, their responsibilities, and the deployable check.
- [Initial Architecture — Research](../2026-04-17-initial-architecture/2-research.md) — Sections 3-4 define the module breakdown and data-shape contracts (Topology input, Evaluator result, event shape).
- [Initial Architecture — Context](../2026-04-17-initial-architecture/0-context.md) — Architectural commitments (pure client-side, seeded PRNG, IIFE module pattern, engine as pure function).

Proposal documents with domain context:

- [4-proposed-solution.md](../../proposal/2026-04-13-datacenter-network-gamification/4-proposed-solution.md) — DES engine description, all-reduce strategies, scoring breakdown (effective PFLOPS, communication overhead, diameter, bisection bandwidth, bottleneck identification).
- [6-timeline.md](../../proposal/2026-04-13-datacenter-network-gamification/6-timeline.md) — Week 2 scope: DES engine, all-reduce simulation, PFLOP scoring formula.
- [3-problem-space.md](../../proposal/2026-04-13-datacenter-network-gamification/3-problem-space.md) — ns-3 event-queue architecture reference, fat-tree/dragonfly/Jellyfish topologies.

## 3. Depends On

- Phase 1 (Project Skeleton) — complete. `index.html`, `css/style.css`, `js/dcn.js` exist.
- Phase 2 (Engine Foundations) — complete. `prng.js`, `graph.js`, `topology.js`, `event-queue.js`, `link.js` exist under `js/engine/`.

## 4. What This Feature Produces

Six files under `js/engine/`:

- `simulator.js` — DES kernel. `Simulator.simulate(topology, schedule, seed) -> { events, completionTime }`.
- `all-reduce-ring.js` — Ring all-reduce packet schedule generator.
- `all-reduce-tree.js` — Tree all-reduce packet schedule generator.
- `bisection-bandwidth.js` — Bisection bandwidth calculator (exact for small graphs, spectral for larger).
- `scorer.js` — Graph-theoretic metrics (diameter, bottleneck) and the PFLOPS formula.
- `evaluator.js` — Top-level orchestrator: validate, run both strategies, pick best, return full result.

Plus `index.html` updates to add `<script>` tags for all six files.

## 5. Open Questions for Research

These must be resolved in `2-research.md` before the plan can be written:

- **PFLOPS formula.** The proposal references "effective PFLOPS" but never defines the exact formula. We need to design a concrete scoring function that maps simulation results (completion time, topology metrics) to a PFLOPS number.
- **Packet schedule shape.** The exact data structure that `all-reduce-ring.js` and `all-reduce-tree.js` produce and that `simulator.js` consumes. What fields does each scheduled packet have?
- **Simulator internals.** How the DES kernel processes the schedule: event types, how per-link queuing works with the existing `Link.inFlightQueue`, what events are emitted for the UI timeline.
- **Bisection bandwidth details.** The exact brute-force enumeration for small graphs and the spectral (Fiedler) approximation for larger ones. How the Laplacian is computed and eigenvalue extracted in plain JS without a linear algebra library.
- **Bottleneck identification.** How the scorer identifies the bottleneck link from the simulation results.
- **Communication overhead definition.** What "communication overhead" means concretely in the score breakdown.

## 6. Out of Scope

- Any UI work (Phase 4+).
- Level system, encyclopedia, progress persistence (Phase 6+).
- Planarity validation implementation (Phase 7).
- 3D editor (Phase 8).

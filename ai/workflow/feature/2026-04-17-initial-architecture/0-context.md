# Initial Architecture — Context

## 1. Feature

The goal of this feature is to design the overall software architecture of the browser-based datacenter networking game described in the proposal. That means defining module boundaries, the data flow between the editor / simulation / scoring / level system / encyclopedia, the file and directory layout, and how state moves between components. No code is written in this feature — it ends with an architecture document we can build subsequent feature phases against.

## 2. Source Material

The architecture is constrained by what the proposal has already committed to. These are the documents that define the project:

- [4-proposed-solution.md](../../proposal/2026-04-13-datacenter-network-gamification/4-proposed-solution.md) — the three-component breakdown (editor, DES engine, level system + encyclopedia) and feasibility notes.
- [5-deliverables.md](../../proposal/2026-04-13-datacenter-network-gamification/5-deliverables.md) — acceptance criteria, including the `js/engine/`, `js/ui/`, `js/levels/`, `js/encyclopedia/` directory split.
- [6-timeline.md](../../proposal/2026-04-13-datacenter-network-gamification/6-timeline.md) — week-by-week build order, which constrains the architecture (graph model first, then DES, then editor, then visualization, then levels).
- [3-problem-space.md](../../proposal/2026-04-13-datacenter-network-gamification/3-problem-space.md) — design influences (ns-3 event-queue architecture, fat-tree/dragonfly/Jellyfish topologies the encyclopedia must represent).
- [0-context.md](../../proposal/2026-04-13-datacenter-network-gamification/0-context.md) — the original framing.

## 3. Architectural Commitments Already Made

These decisions are locked in by the proposal and should not be relitigated as part of this feature.

### Runtime & deployment

- Pure client-side: no backend, no database, no build step.
- The user opens `index.html` and plays.
- Targets modern Chrome, Firefox, and Edge.

### Rendering

- Canvas 2D for early levels (fixed-grid and free 2D placement).
- Three.js (loaded from CDN) for the 3D levels (7–8).

### Determinism

- Seeded PRNG so identical topologies produce identical scores across browsers and platforms.

### Simulation model

- Packet-level discrete-event simulation.
- Event-queue architecture inspired by ns-3.
- Per-link queuing with bandwidth and latency parameters.
- All-reduce workload evaluated under both ring and tree strategies; the best score wins.

### Scale

- Up to 25 nodes and roughly 300 possible links.
- Tens of thousands of events per simulation — milliseconds of compute.

### Constraint system

- Max degree, max cable length, total cable budget, planarity.
- Constraints are toggled per level rather than globally.

### Level progression

- 8 levels, ramping fixed-grid 2D → free 2D → 3D.
- Each completed level unlocks an encyclopedia entry (fat-tree, torus, dragonfly, Clos, Jellyfish, etc.).

### Top-level directory split

Per Deliverable 2:

- `js/engine/`
- `js/ui/`
- `js/levels/`
- `js/encyclopedia/`

## 4. What This Feature Will Decide

The open architectural questions that this feature must answer in `2-research.md` and `3-plan.md`. This is a starting list, not exhaustive — the conversation may add or remove items.

- Module boundaries inside `js/engine/` (graph model vs. DES kernel vs. all-reduce strategies vs. scoring).
- How the editor publishes a topology to the engine, and how the engine streams events back to the UI for animation.
- Where level configuration lives (constraints, node count, scoring weights, unlocked encyclopedia entry) and its data shape.
- Game state persistence: localStorage? per-level best score? which encyclopedia entries are unlocked?
- The shape of the score breakdown object that the engine returns to the UI (effective PFLOPS, communication overhead, diameter, bisection bandwidth, bottleneck identification).
- Animation loop ownership: does the DES emit a complete timeline that the UI replays, or does the UI step the DES forward frame by frame?

## 5. Out of Scope

- Any code. This feature produces only architecture documents.
- Choosing specific algorithms beyond what the proposal already names (Dijkstra, Boyer-Myrvold, ring/tree all-reduce). Algorithmic detail belongs in a later feature.
- UI styling and visual design.

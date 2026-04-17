# Initial Architecture — Plan

This is the phased build plan derived from [2-research.md](2-research.md). Each phase leaves the repo in a deployable state: `index.html` opens in a browser and either does something useful or shows a clean placeholder. No phase ends with broken behavior or orphaned references.

The phasing roughly mirrors the week-by-week schedule in [6-timeline.md](../../proposal/2026-04-13-datacenter-network-gamification/6-timeline.md): engine in weeks 1-2 (Phases 1-3), interactive editor + animation in weeks 3-4 (Phases 4-5), full level system + 3D in week 5 (Phases 6-8), encyclopedia and docs in week 6 (Phases 9-10).

Status legend (per [feature/WORKFLOW.md](../../feature/WORKFLOW.md)): no prefix = pending, `⋯` = in progress, `✓` = done. Update headings as we go.

## Phase 1 — Project Skeleton

**Goal.** A blank styled page that loads cleanly with the global namespace bootstrapped. Nothing functional yet, but the file layout, CSS, and IIFE/namespace pattern are real and used by every later phase.

**Files added.**
- `index.html` — boilerplate; `<head>` links one stylesheet; `<body>` has a single `<div id="app">` placeholder; `<script>` tags for the namespace bootstrap and (commented-out for now) `vendor/three.min.js`.
- `css/style.css` — minimal CSS reset and basic layout for `#app`.
- `vendor/three.min.js` — vendored copy of Three.js (downloaded once, committed). Loaded but not yet used.
- `js/dcn.js` — runs first; sets `window.DCN = { engine: {}, ui: {}, levels: {}, encyclopedia: {} };`.

**Deployable check.** Open `index.html` from `file://`. Page loads with no console errors. `window.DCN` is defined with four empty sub-namespaces. `THREE` is defined globally.

## Phase 2 — Engine Foundations

**Goal.** The data structures every later engine module depends on: PRNG, graph, topology DTO + constraint validators, event queue, link model. No simulation yet.

**Files added under `js/engine/`.**
- `prng.js` — `Prng` class. Mulberry32. `next()` returns `[0, 1)`.
- `graph.js` — `Graph` class. Nodes, links, adjacency, degree, BFS, Dijkstra.
- `topology.js` — `Topology` DTO + builder. Constraint validation methods (`validateMaxDegree`, `validateMaxCableLength`, `validateCableBudget`, `validateRequirePlanar`). Planarity left as a stub returning `true` until Phase 7 enables it.
- `event-queue.js` — `EventQueue` class. Binary-heap priority queue keyed by event time.
- `link.js` — `Link` model. Bandwidth, latency, in-flight packet queue.

**index.html update.** Add `<script>` tags for each new file in dependency order, after `js/dcn.js`.

**Deployable check.** Page still loads. From the console, `new DCN.engine.Graph()`, `new DCN.engine.Prng(42)`, etc. all construct and behave correctly.

## Phase 3 — DES Kernel + Scoring

**Goal.** End-to-end engine. Given a topology, the evaluator runs both all-reduce strategies, picks the winner, and returns `{ score, events, validation, strategy }`.

**Files added under `js/engine/`.**
- `simulator.js` — `Simulator.simulate(topology, schedule, seed) -> { events, completionTime }`. Drives the event queue, advances per-link queues, emits a sorted event timeline.
- `all-reduce-ring.js` — emits the ring-strategy packet schedule for a given topology + workload.
- `all-reduce-tree.js` — emits the tree-strategy packet schedule.
- `bisection-bandwidth.js` — `calc(graph)` picks `_calcExact` (brute-force partition enumeration) for `nodeCount <= EXACT_MAX_NODES` and `_calcSpectral` (Fiedler value of the graph Laplacian) otherwise. `EXACT_MAX_NODES = 20` lives as a module-level constant.
- `scorer.js` — diameter, bottleneck identification, PFLOPS formula. Delegates bisection bandwidth to `bisection-bandwidth.js`.
- `evaluator.js` — orchestrator. Validates the topology, runs both schedules through the simulator, calls the scorer, picks the higher-scoring strategy, returns the full result object.

**Deployable check.** From the console, `DCN.engine.Evaluator.evaluate(topology)` on a hand-built 4-node topology returns a sensible score and a non-empty `events` array sorted by `t`. Both `ring` and `tree` strategies execute without errors.

## Phase 4 — Canvas 2D Editor (Fixed-Grid) + Run Button + Score Panel

**Goal.** Minimum-viable interactive game. The user sees nodes on a grid, clicks two nodes to connect them, clicks Run, and sees a score. No level system yet — a single hardcoded test scenario inside `app.js` is enough.

**Files added under `js/ui/`.**
- `editor-2d.js` — `Editor2d` class. Fixed-grid mode only (free-placement comes in Phase 7). Click-to-connect, click-to-disconnect. Reads back the current topology.
- `score-panel.js` — `ScorePanel` class. Renders the score breakdown (PFLOPS, diameter, bisection bandwidth, completion time, bottleneck link).
- `app.js` — `App` class. Wires editor + a Run button to the evaluator + score-panel. Hardcodes a test scenario (4 nodes on a grid) at startup.

**index.html update.** Add a Run button, an empty `<div>` for the editor canvas, an empty `<div>` for the score panel.

**Deployable check.** Open page, see 4 nodes, connect them, click Run, see a score. Editing after Run leaves the displayed score visible but visibly stale (e.g., greyed out) until Run is clicked again.

## Phase 5 — Animator

**Goal.** When the user clicks Run, packets visibly fly across the topology in addition to the score appearing. Editor is locked while playback is active.

**Files added under `js/ui/`.**
- `animator.js` — `Animator` class. Owns `isPlaying`, `playbackSpeed`, and a playback head. Methods: `play(events) / pause() / stop() / setSpeed(multiplier)`. Iterates `requestAnimationFrame`, advances the head by `playbackSpeed * deltaTime`, instructs the active editor to render all events with `t <= head`.

**Files updated.**
- `js/ui/editor-2d.js` — adds a `renderEvents(events, head)` method that draws packet glyphs and link congestion overlays.
- `js/ui/app.js` — adds Play / Pause / Stop buttons + 0.5x / 1x / 2x / 5x speed buttons. After Run completes, hands the events to the animator instead of (or in addition to) just storing them. Disables the editor while `animator.isPlaying`.

**Deployable check.** Click Run, watch packets traverse links, see links go red when contended. Try editing during playback — editor is unresponsive until Stop is clicked or playback ends. Speed buttons change playback rate immediately.

## Phase 6 — First Encyclopedia Entries + Level System + Levels 1-3

**Goal.** The game proper. Three real levels, a level-select UI, progress saved across reloads. The hardcoded test scenario from Phase 4 is replaced by the real level loader.

**Files added under `js/encyclopedia/`.**
- `entries/<entry-id>.js` × at least 3 — one per starter level. Each exports `{ id, name, paragraphs, papers, properties, generateTopology(nodeCount) }`. The first three entries are likely simple canonical topologies (e.g., complete graph, ring, small fat-tree) appropriate to the starter level node counts.
- `entries.js` — re-exports the array of all loaded entries so `level-loader.js` can look them up by id.

**Files added under `js/levels/`.**
- `levels.js` — array of level configs for levels 1-3. Each follows the shape from [2-research.md Section 4](2-research.md): id, name, nodeCount, editorMode, initialNodePositions, constraints, starThresholds (ratios), referenceEntryId, encyclopediaUnlock.
- `level-loader.js` — loads a level into the editor, activates the level's constraints, looks up the level's `referenceEntryId`, calls that entry's `generateTopology(level.nodeCount)`, runs the evaluator on it once at load time, caches `referencePflops`.
- `progress-store.js` — localStorage wrapper. Read/write the persistence schema from [2-research.md Section 4](2-research.md) under key `dcn.progress.v1`.

**Files added under `js/ui/`.**
- `constraint-panel.js` — live constraint validation feedback while the user edits.

**Files updated.**
- `js/ui/app.js` — replaces the hardcoded test scenario with a level select (dropdown or row of buttons). On level select, calls `level-loader`, hands the level config to the editor and constraint panel. After a successful Run, computes `ratio = playerPflops / referencePflops`, looks up `starRating` from the level's thresholds, persists best-by-level if improved, unlocks the level's encyclopedia entry on completion (3 stars, or some completion criterion).

**Deployable check.** Pick level 1, build a topology, hit Run. See a star rating based on the ratio. Refresh the page; the best score persists; the unlocked encyclopedia entry id is in `localStorage`. All three starter levels are playable end-to-end.

## Phase 7 — Free Placement + Spatial Constraints + Levels 4-6

**Goal.** The middle three levels, which introduce free 2D placement and the spatial constraints (cable length, cable budget, planarity).

**Files updated under `js/ui/`.**
- `editor-2d.js` — adds free-placement mode (drag nodes, snap-off-grid). Mode is selected by the level's `editorMode` field.

**Files updated under `js/engine/`.**
- `topology.js` — fills in the planarity validator using a Boyer-Myrvold implementation (or a simpler edge-crossing-count fallback if Boyer-Myrvold proves unwieldy — flagged as a Phase 7 risk in the timeline). The other validators (cable length, cable budget) become live (they were stubbed `return true` until now).

**Files added.**
- `js/encyclopedia/entries/<entry-id>.js` × 3 — encyclopedia entries for levels 4-6 (e.g., torus, dragonfly, Clos).
- 3 more entries in `js/levels/levels.js`.

**Deployable check.** Levels 1-6 all playable. Constraint panel shows real-time violations as the user edits (e.g., red flag for "cable budget exceeded by 12 m"). Planar-required levels reject non-planar designs at validation time.

## Phase 8 — 3D Editor + Levels 7-8

**Goal.** Final two levels in 3D, on top of the vendored Three.js.

**Files added under `js/ui/`.**
- `editor-3d.js` — `Editor3d` class. Three.js scene. Drag nodes in 3D (orbit camera, projected mouse). Same interface as `Editor2d` (`renderEvents`, topology read/write) so the animator and app don't care which one is active.

**Files updated.**
- `js/ui/app.js` — picks the editor (`Editor2d` vs `Editor3d`) based on `level.editorMode`.
- `index.html` — uncomments the `vendor/three.min.js` `<script>` tag.

**Files added.**
- `js/encyclopedia/entries/<entry-id>.js` × 2 — encyclopedia entries for levels 7-8.
- 2 more entries in `js/levels/levels.js`.

**Risk.** If 3D wiring proves harder than expected, the timeline's stated fallback is to descope levels 7-8 to 2D-free with more nodes. That decision belongs at the start of this phase, not at the end.

**Deployable check.** All 8 levels playable. Switching from a 2D level to a 3D level swaps the editor cleanly with no console errors. Animator works identically in both editors.

## Phase 9 — Encyclopedia UI

**Goal.** Browse unlocked encyclopedia entries with full prose, a Canvas-rendered diagram from the entry's `generateTopology`, and the list of papers.

**Files added under `js/encyclopedia/`.**
- `encyclopedia-ui.js` — `EncyclopediaUi` class. Modal/panel that lists all entries, greys out locked ones, and on selection shows the prose paragraphs, a diagram drawn by calling the entry's `generateTopology(<some nodeCount>)` and rendering through the same canvas drawing helpers used by `editor-2d.js`, and the papers list as clickable links.

**Files updated.**
- `js/ui/app.js` — adds an Encyclopedia button that opens the modal.

**Deployable check.** Click Encyclopedia. See all entries, with locked ones visibly distinct. Click an unlocked entry. Prose, diagram, and papers all display correctly. The diagram looks correct for the entry's known topology family.

## Phase 10 — README + Scoring Documentation

**Goal.** Deliverable 2 (Source Code and Documentation) from [5-deliverables.md](../../proposal/2026-04-13-datacenter-network-gamification/5-deliverables.md).

**Files added.**
- `README.md` — How to run (open `index.html`, no install). Project structure (mirrors [2-research.md Section 2-3](2-research.md)). Description of the simulation model. Explanation of the PFLOPS scoring formula. Description of constraint definitions and how to add a new level.

**Files updated.**
- Inline doc comments on the non-obvious engine internals: PFLOPS formula in `scorer.js`, the exact-vs-spectral cutover in `bisection-bandwidth.js`, the playback head math in `animator.js`. Comments explain *why*, not *what*, per [AGENTS.md](../../../../AGENTS.md).

**Deployable check.** A reader who has never seen the project can open `README.md`, follow the run instructions, and play. The scoring section makes the displayed score breakdown understandable without reading the source.

## Notes That Apply To Every Phase

- **No backend.** No new POST endpoints, so the WORKFLOW's request-processor-parity rule is vacuous here.
- **No DB.** No migration concerns. Persistence is `localStorage` only and the `version: 1` field gives us a future migration hook.
- **Pre-emptive bugfixing.** Per [feature/WORKFLOW.md](../../feature/WORKFLOW.md), each phase begins by reading the code from previous phases that the new code will sit on top of, looking for bugs before adding new behavior.
- **Coding standards.** All code in every phase complies with [AGENTS.md](../../../../AGENTS.md): IIFE per file, one class per file, kebab-case filenames matching the class name, `static` utility classes have no constructor, `_`-prefixed private methods, guard clauses, named intermediate variables, no destructuring on the LHS, no arrow function method definitions, no `else` after a returning branch, etc.
- **Three.js is a hard dependency from Phase 8 onward.** The vendored copy in `vendor/three.min.js` makes it impossible for it to fail to load.

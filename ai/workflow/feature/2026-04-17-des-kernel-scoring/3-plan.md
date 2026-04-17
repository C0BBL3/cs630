# DES Kernel + Scoring — Plan

Phased build plan derived from [2-research.md](2-research.md). Each phase leaves the repo deployable: `index.html` opens with no console errors and all previously working functionality still works. New modules are accessible from the console for manual testing.

Status legend: no prefix = pending, `⋯` = in progress, `✓` = done.

## ✓ Phase 1 — Bisection Bandwidth

**Goal.** The bisection bandwidth calculator, which has no dependencies on other Phase 3 modules and is the most self-contained piece.

**File added.**
- `js/engine/bisection-bandwidth.js` — `BisectionBandwidth` static utility class. Entry point: `BisectionBandwidth.calc(graph)`. Delegates to `_calcExact(graph)` for `nodeCount <= EXACT_MAX_NODES` (20) and `_calcSpectral(graph)` otherwise. Module-level constant: `EXACT_MAX_NODES = 20`.

`_calcExact`: enumerate all subsets of size `floor(N/2)`, compute total crossing bandwidth for each, return the minimum. Subset enumeration via a recursive generator or iterative bit-manipulation.

`_calcSpectral`: build the graph Laplacian (weighted by bandwidth), compute the Fiedler vector via power iteration (projected onto the subspace orthogonal to the constant vector, seeded deterministically), sort nodes by Fiedler component, split at the median, return the crossing bandwidth of that partition.

**index.html update.** Add `<script src="js/engine/bisection-bandwidth.js"></script>` after the Phase 2 tags.

**Deployable check.** From the console: build a small graph (4 nodes, known topology), call `DCN.engine.BisectionBandwidth.calc(graph)`, verify the result matches hand calculation. For a complete graph on 4 nodes with bandwidth 1, bisection bandwidth = 4.

## ✓ Phase 2 — All-Reduce Strategies

**Goal.** Both schedule generators, independent of the simulator. They produce schedule arrays that can be inspected in the console.

**Files added.**
- `js/engine/all-reduce-ring.js` — `AllReduceRing` static utility class. Entry point: `AllReduceRing.generateSchedule(topology)`. Builds a nearest-neighbor greedy ring ordering via BFS distances, then generates the scatter-reduce + all-gather schedule: `2 * (nodeCount - 1)` phases, chunk size = `payloadBytes / nodeCount`. Returns the schedule array.
- `js/engine/all-reduce-tree.js` — `AllReduceTree` static utility class. Entry point: `AllReduceTree.generateSchedule(topology)`. Finds the optimal root (minimum BFS depth across all candidate roots), builds a BFS spanning tree, then generates the reduce-up + broadcast-down schedule: `2 * treeDepth` phases, full `payloadBytes` per send. Returns the schedule array.

**index.html update.** Add `<script>` tags for both files after `bisection-bandwidth.js`.

**Deployable check.** Build a 4-node topology by hand, call `AllReduceRing.generateSchedule(topology)` and `AllReduceTree.generateSchedule(topology)` from the console. Verify the ring schedule has `2 * 3 = 6` phases with 4 sends each (24 entries total). Verify the tree schedule has `2 * depth` phases. Inspect `packetId` values and `sizeBytes`.

## ✓ Phase 3 — Simulator

**Goal.** The DES kernel. Given a topology and a schedule, it runs the discrete-event simulation and returns the event timeline and completion time.

**File added.**
- `js/engine/simulator.js` — `Simulator` static utility class. Entry point: `Simulator.simulate(topology, schedule)`. Returns `{ events, completionTime, linkUtilizations }`.

Internal mechanics (per [2-research.md](2-research.md) Section 3):
- Builds the graph, precomputes all-pairs BFS shortest paths.
- Creates per-link-per-direction state (`busyUntil = 0`).
- Processes phases sequentially; within a phase, all sends are injected at `phaseStartTime`.
- Store-and-forward: each hop enqueues a `send` event, which schedules an `arrive` event after `transmissionDelay + latency`. The link's `busyUntil` handles queuing delays.
- Tracks cumulative busy time per link for utilization.
- Returns events sorted by `t`.

**index.html update.** Add `<script src="js/engine/simulator.js"></script>` after the strategy tags.

**Deployable check.** Build a 4-node ring topology, generate a ring schedule, run `Simulator.simulate(topology, schedule)`. Verify: events array is non-empty and sorted by `t`, `completionTime > 0`, `linkUtilizations` has entries for each link used. Verify that adding a cross-link reduces `completionTime`.

## ✓ Phase 4 — Scorer + Evaluator

**Goal.** The scoring function and the top-level orchestrator. After this phase, the full pipeline works end-to-end: `Evaluator.evaluate(topology)` returns the complete result object.

**Files added.**
- `js/engine/scorer.js` — `Scorer` static utility class. Module-level constants: `FLOPS_PER_NODE = 1e15`, `COMPUTE_SECONDS_PER_ITERATION = 0.01`. Entry point: `Scorer.score(topology, completionTime, linkUtilizations)`. Computes `diameter`, `bisectionBandwidth`, `bottleneckLinkId`, `communicationOverhead`, and `pflops`.
- `js/engine/evaluator.js` — `Evaluator` static utility class. Entry point: `Evaluator.evaluate(topology, constraints)`. Orchestration flow per [2-research.md](2-research.md) Section 8: assign link IDs → check connectivity → validate constraints → generate and simulate both strategies → score both → pick winner → return result.

Handles degenerate cases:
- 1 node: `completionTime = 0`, `pflops = FLOPS_PER_NODE`, empty events.
- Disconnected graph: returns `validation.valid = false` with a connectivity violation.
- Constraint violations: returns violations, null score, empty events.

**index.html update.** Add `<script>` tags for both files, `scorer.js` before `evaluator.js`.

**Deployable check.** From the console: build a 4-node topology with nodes, links (bandwidth `12.5e9`, latency `0.000005`), and workload (`{ type: 'all-reduce', payloadBytes: 100e6, iterations: 1 }`). Call `DCN.engine.Evaluator.evaluate(topology)`. Verify:
- `validation.valid` is `true`.
- `strategy` is `'ring'` or `'tree'`.
- `score.pflops` is a positive number less than `4e15`.
- `score.diameter` is a positive integer.
- `score.bisectionBandwidth` is a positive number.
- `score.bottleneckLinkId` is a valid link index.
- `events` is a non-empty array sorted by `t`.
- Removing a link and re-evaluating produces a lower `pflops`.
- Disconnecting the graph produces `validation.valid = false`.

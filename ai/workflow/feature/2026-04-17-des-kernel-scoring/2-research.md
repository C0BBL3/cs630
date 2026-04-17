# DES Kernel + Scoring — Research

## 1. Decisions Settled in This Document

These design decisions are resolved here and drive the plan in `3-plan.md`.

- **PFLOPS formula.** `effectivePflops = peakPflops / (1 + communicationOverhead)`, where `peakPflops = nodeCount * FLOPS_PER_NODE` and `communicationOverhead = completionTime / COMPUTE_SECONDS_PER_ITERATION`. Constants: `FLOPS_PER_NODE = 1e15` (1 PFLOPS per node), `COMPUTE_SECONDS_PER_ITERATION = 0.01` (10 ms).
- **Simulator model.** Store-and-forward, full-duplex links, per-direction queuing, BFS shortest-path routing. The simulator manages its own per-link state — it does not mutate the existing `Link` objects.
- **Schedule shape.** The strategies produce an array of `{ phase, fromNode, toNode, sizeBytes, packetId }` entries. The simulator processes all sends within a phase in parallel; the next phase starts when all current-phase packets are delivered.
- **One iteration.** The simulator runs a single all-reduce round regardless of the workload's `iterations` field. The `iterations` factor cancels out of the PFLOPS formula, so simulating one round is sufficient for scoring.
- **Connectivity is mandatory.** The evaluator checks graph connectivity (BFS from node 0) before attempting any strategy. A disconnected graph is a validation failure.
- **Star rating is NOT computed by the evaluator.** It depends on `referencePflops`, which is a level-loader concern. The evaluator returns `pflops`; the app computes the ratio and star rating.
- **Link IDs.** Assigned by the evaluator during preprocessing as sequential integers matching position in `topology.links`.

## 2. PFLOPS Scoring Formula

The game models a cluster of GPU nodes running a distributed training workload. Each training iteration has two sequential phases: local computation (fixed, network-independent) and all-reduce communication (variable, depends on topology). The effective throughput of the cluster depends on how much time the network adds.

### Formula

```
peakPflops              = nodeCount * FLOPS_PER_NODE
communicationOverhead   = completionTime / COMPUTE_SECONDS_PER_ITERATION
effectivePflops         = peakPflops / (1 + communicationOverhead)
```

Intuition:
- If `communicationOverhead = 0` (instantaneous network), `effectivePflops = peakPflops`. Perfect linear scaling.
- If `communicationOverhead = 1` (communication takes as long as compute), efficiency is 50%.
- As communication overhead grows, effective PFLOPS drops toward zero.

### Constants

| Constant | Value | Rationale |
|----------|-------|-----------|
| `FLOPS_PER_NODE` | `1e15` (1 PFLOPS) | Makes a 4-node cluster score around 4 PFLOPS peak, and a 25-node cluster around 25 PFLOPS peak — readable numbers. |
| `COMPUTE_SECONDS_PER_ITERATION` | `0.01` (10 ms) | Tuned so that typical communication times (5-30 ms for small topologies with 100 Gbps links and 100 MB payloads) produce overheads in the 0.5-3.0 range, giving scaling efficiencies between 25% and 67%. This makes topology quality clearly visible in the score. |

Both constants live as module-level constants in `scorer.js`.

### Why iterations cancel

In the BSP model, each training iteration is: compute (`COMPUTE_SECONDS_PER_ITERATION`) → communicate (`completionTime`) → repeat. Over `K` iterations:

```
totalWork = K * nodeCount * FLOPS_PER_NODE * COMPUTE_SECONDS_PER_ITERATION
totalTime = K * (COMPUTE_SECONDS_PER_ITERATION + completionTime)
effectivePflops = totalWork / totalTime
              = nodeCount * FLOPS_PER_NODE * COMPUTE_SECONDS_PER_ITERATION / (COMPUTE_SECONDS_PER_ITERATION + completionTime)
              = peakPflops / (1 + communicationOverhead)
```

`K` cancels. One simulated all-reduce round is sufficient.

## 3. DES Simulator Model

### Core loop

The simulator is a static utility class with no constructor. Its entry point:

```
Simulator.simulate(topology, schedule) -> { events, completionTime }
```

Processing:
1. Build a `Graph` from the topology.
2. Create per-link-per-direction state: `busyUntil` initialized to 0. Each undirected link has two directions, keyed as `"linkId-forward"` and `"linkId-reverse"` (where forward = from < to, reverse = from > to).
3. Precompute shortest paths between all pairs via BFS from each node (all-pairs BFS). Store predecessor arrays for path reconstruction. For N <= 25 nodes, this is 25 BFS calls — trivial.
4. For each phase in the schedule (ascending order):
    a. Set `phaseStartTime` to the completion time of the previous phase (0 for phase 0).
    b. For each send in the current phase, compute its multi-hop path from the precomputed shortest paths.
    c. Inject a `send` event at `phaseStartTime` for the first hop of each packet.
    d. Process events from the event queue until all packets in this phase are delivered.
5. `completionTime` = delivery time of the last packet in the last phase.
6. Return the sorted event timeline and completionTime.

### Store-and-forward queuing

When a packet wants to transmit on a link in a given direction at time `t`:

```
transmitStart    = max(t, busyUntil)         // wait if link is busy
transmissionDelay = sizeBytes / link.bandwidth
transmitEnd      = transmitStart + transmissionDelay
arriveTime       = transmitEnd + link.latency

busyUntil        = transmitEnd               // link is free after transmission ends
```

The queuing delay is `max(0, busyUntil - t)`. This models output-port FIFO queuing at each hop.

### Full-duplex links

Each link has independent bandwidth in each direction. A packet from A→B and a packet from B→A on the same link can transmit simultaneously without contention. The simulator tracks `busyUntil` separately for each direction.

### Event types

The simulator emits two event types into the timeline:

- `'send'` — a packet begins traversing a link hop. Fields: `{ t, type: 'send', linkId, packetId, fromNode, toNode }`.
- `'arrive'` — a packet reaches the far end of a link hop. Same fields with `type: 'arrive'`.

For a multi-hop route, one logical packet generates a `send`/`arrive` pair for each hop. The `packetId` ties them together. The animator uses SEND→ARRIVE pairs to draw a packet moving along a link, interpolating position between `t_send` and `t_arrive`.

When a packet arrives at an intermediate node and must forward to the next hop, there is no explicit "queue" or "wait" event. The gap between `arrive` at node X and the next `send` from node X (for the same packetId) represents queuing time, and the animator can show the packet sitting at node X during that gap.

### Routing

BFS shortest path (minimum hops). All links have equal hop weight. If the BFS discovers multiple shortest paths, adjacency-list order breaks ties deterministically.

Latency-weighted routing (Dijkstra) is not used. BFS matches player intuition: adding a shortcut reduces path length. All links within a level typically share the same latency and bandwidth, so hop count is the dominant factor.

### Link state ownership

The simulator creates its own lightweight state objects — it does NOT mutate `Link.inFlightQueue` or any properties on the topology's link objects. This keeps the engine a pure function: the same topology can be evaluated multiple times without reset.

### Utilization tracking

During simulation, the simulator tracks cumulative busy time per link (across both directions, summed). After simulation completes, `utilization = totalBusyTime / completionTime` for each link. The link with the highest utilization is the bottleneck. This data is returned alongside the event timeline so the scorer can identify the bottleneck link.

## 4. All-Reduce Strategies

Both strategies produce a schedule (array of `{ phase, fromNode, toNode, sizeBytes, packetId }`) that the simulator consumes.

### 4.1 Ring All-Reduce

**Logical ring ordering.** The N nodes are arranged in a logical ring. The ordering determines which pairs of nodes communicate in each phase. A good ordering minimizes the physical path length (hops) between consecutive ring neighbors, reducing congestion and completion time.

Algorithm for ring ordering (nearest-neighbor greedy):
1. Start at node 0.
2. BFS from the current node. Pick the nearest unvisited node (ties broken by node ID).
3. Repeat until all nodes are visited.
4. Close the ring: the last node's successor is node 0.

This is a greedy TSP heuristic on the BFS-distance metric. For 25 nodes, it runs in milliseconds.

**Schedule generation.** For N nodes with payload P bytes:

- Chunk size = `payloadBytes / nodeCount` (integer division, remainder distributed to first chunks).
- **Scatter-reduce phase:** N-1 steps (phases 0 through N-2). In step `i`, each node `j` sends one chunk to its ring successor `(j+1) mod N`.
- **All-gather phase:** N-1 steps (phases N-1 through 2N-3). Same communication pattern as scatter-reduce.
- Total phases: `2 * (nodeCount - 1)`.

Each phase produces N sends (one per node), all happening in parallel.

### 4.2 Tree All-Reduce

**Spanning tree construction.** A BFS spanning tree is built from the root node that minimizes tree depth. The algorithm:
1. For each node, run BFS and record the maximum depth.
2. Pick the node with the smallest maximum depth as the root.
3. Build the BFS spanning tree from that root.

For 25 nodes, this is 25 BFS calls — trivial.

**Schedule generation.** For tree depth D and payload P bytes:

- **Reduce phase:** D steps (phases 0 through D-1). In phase `i`, every node at depth `D - i` sends `payloadBytes` to its parent. Siblings at the same depth send to different parents on different links, so they proceed in parallel.
- **Broadcast phase:** D steps (phases D through 2D-1). In phase `i`, every node at depth `i - D` sends `payloadBytes` to each of its children.
- Total phases: `2 * treeDepth`.

The tree all-reduce sends the full payload per edge (no chunking). This means higher per-link load than ring, but fewer total phases when the tree is shallow. Tree excels on low-diameter topologies; ring excels on high-bisection-bandwidth topologies.

### 4.3 Strategy comparison

The evaluator runs both strategies and picks the one with lower `completionTime` (equivalently, higher PFLOPS). This rewards topologies that support at least one strategy well, and the player doesn't need to know which one wins.

Characteristics that favor each:

| Property | Favors ring | Favors tree |
|----------|-------------|-------------|
| Many nodes, uniform degree | Yes | |
| Low diameter, star-like | | Yes |
| High bisection bandwidth | Yes | |
| Long ring paths | | Yes (shorter tree paths) |

## 5. Schedule Data Shape

```
[
    { phase: 0, fromNode: 0, toNode: 1, sizeBytes: 25000000, packetId: 'r-0-0' },
    { phase: 0, fromNode: 1, toNode: 2, sizeBytes: 25000000, packetId: 'r-0-1' },
    ...
]
```

Fields:
- `phase` — integer, ascending. All sends in the same phase are injected simultaneously.
- `fromNode` — source node ID (the logical sender, not necessarily adjacent).
- `toNode` — destination node ID.
- `sizeBytes` — packet size in bytes.
- `packetId` — unique string identifying this packet across all events. Convention: `'r-{phase}-{senderIndex}'` for ring, `'t-{phase}-{nodeId}'` for tree.

## 6. Bisection Bandwidth

### Definition

The bisection bandwidth of a graph is the minimum total bandwidth of edges crossing any balanced partition (two halves differing in size by at most one node).

### 6.1 Exact computation (nodeCount <= EXACT_MAX_NODES)

Enumerate all balanced partitions:
1. Generate all subsets of size `floor(N/2)` from the N nodes.
2. For each subset, compute the total bandwidth of edges with one endpoint in the subset and one outside.
3. The bisection bandwidth is the minimum total crossing bandwidth.

Complexity: `C(N, floor(N/2))` partitions. For N=20: 184,756 partitions. At ~50 edges per partition check: ~9M operations. Completes in <100ms in JavaScript.

### 6.2 Spectral approximation (nodeCount > EXACT_MAX_NODES)

Uses the Fiedler vector (eigenvector of the second-smallest eigenvalue of the graph Laplacian) to find a near-optimal partition.

Algorithm:
1. Build the graph Laplacian matrix L = D - A, where D is the degree matrix and A is the adjacency matrix. For weighted graphs, A[i][j] = bandwidth of edge (i,j), and D[i][i] = sum of bandwidths of edges incident to node i.
2. Compute the Fiedler vector using power iteration on the projected Laplacian:
    a. Start with a random vector `v` (seeded by the topology's PRNG seed for determinism).
    b. Project out the null-space component: `v[i] -= mean(v)`.
    c. Iterate: `v = L * v`, normalize, re-project, until convergence (or a fixed number of iterations, e.g., 100).
    d. The converging vector is the Fiedler vector.
3. Sort nodes by their Fiedler vector component.
4. Split at the median: the `floor(N/2)` nodes with the smallest components form one side.
5. Count the actual total bandwidth of edges crossing this partition.

This does NOT compute the true minimum bisection bandwidth — it finds a single good partition via spectral methods and reports the crossing bandwidth for that partition. For the game, this is a sufficient approximation. The spectral method tends to find partitions within a small constant factor of optimal.

### Module-level constant

```
EXACT_MAX_NODES = 20
```

### Class structure

`BisectionBandwidth` is a static utility class (no constructor). Entry point: `BisectionBandwidth.calc(graph)`. Internally delegates to `_calcExact(graph)` or `_calcSpectral(graph)` based on node count.

## 7. Scorer

`Scorer` is a static utility class. Entry point:

```
Scorer.score(topology, completionTime, linkUtilizations) -> scoreObject
```

It computes:
- `diameter` — delegates to `graph.calcDiameter()` (already implemented in Phase 2).
- `bisectionBandwidth` — delegates to `BisectionBandwidth.calc(graph)`.
- `bottleneckLinkId` — the link ID with the highest utilization from the `linkUtilizations` map.
- `completionTime` — passed through from the simulator.
- `communicationOverhead` — `completionTime / COMPUTE_SECONDS_PER_ITERATION`.
- `pflops` — the PFLOPS formula from Section 2.

The scorer does NOT compute `starRating`. That is the app's job (ratio of player PFLOPS to reference PFLOPS, looked up against level thresholds).

## 8. Evaluator

`Evaluator` is a static utility class. Entry point:

```
Evaluator.evaluate(topology, constraints) -> evaluatorResult
```

Orchestration flow:
1. **Assign link IDs.** Each link in `topology.links` gets an `id` equal to its array index if it doesn't already have one.
2. **Check connectivity.** BFS from node 0. If not all nodes are reachable, return early with a validation failure: `{ constraint: 'connectivity', message: 'Network is disconnected ...' }`.
3. **Validate constraints.** Call `topology.validate(constraints)` if constraints are provided. If validation fails, return early with violations. Score and events are null.
4. **Build graph.** Call `topology.buildGraph()`.
5. **Generate ring schedule.** `AllReduceRing.generateSchedule(topology)`.
6. **Simulate ring.** `Simulator.simulate(topology, ringSchedule)` → `{ events, completionTime, linkUtilizations }`.
7. **Score ring.** `Scorer.score(topology, ringCompletionTime, ringLinkUtilizations)`.
8. **Generate tree schedule.** `AllReduceTree.generateSchedule(topology)`.
9. **Simulate tree.** Same as step 6.
10. **Score tree.** Same as step 7.
11. **Pick winner.** The strategy with higher `pflops` wins.
12. **Return.** The winning strategy's score, events, and strategy name.

### Result shape

```
{
    validation: { valid: true, violations: [] },
    strategy: 'ring',
    score: {
        pflops: 2.85,
        diameter: 3,
        bisectionBandwidth: 2.5e10,
        bottleneckLinkId: 4,
        completionTime: 0.018,
        communicationOverhead: 1.8,
    },
    events: [
        { t: 0, type: 'send', linkId: 0, packetId: 'r-0-0', fromNode: 0, toNode: 1 },
        { t: 0.002, type: 'arrive', linkId: 0, packetId: 'r-0-0', fromNode: 0, toNode: 1 },
        ...
    ],
}
```

When validation fails (disconnected or constraint violations):

```
{
    validation: { valid: false, violations: [{ constraint: 'connectivity', message: '...' }] },
    strategy: null,
    score: null,
    events: [],
}
```

### Constraints parameter

`constraints` is optional. When omitted (e.g., when evaluating a reference topology for star-rating calibration), the evaluator skips constraint validation and proceeds directly to simulation.

### Degenerate cases

- **1 node:** No communication needed. `completionTime = 0`, `communicationOverhead = 0`, `pflops = peakPflops = FLOPS_PER_NODE`. Events array is empty.
- **2 nodes:** Ring and tree produce identical schedules (one send each direction). Both are simulated and scored.

## 9. Unit Conventions

All modules use these units consistently:

| Quantity | Unit | Example |
|----------|------|---------|
| Bandwidth | bytes/second | `12.5e9` (100 Gbps) |
| Latency | seconds | `0.000005` (5 μs) |
| Payload / packet size | bytes | `100e6` (100 MB) |
| Time (events, completion) | seconds | `0.018` |
| FLOPS | FLOPS/second | `1e15` (1 PFLOPS) |

The existing `Link.calcTransmissionDelay(packetSizeBytes)` returns `packetSizeBytes / bandwidth`, which yields seconds. This is consistent.

## 10. Module Dependencies and Load Order

### Dependency graph

```
evaluator.js
├── Topology        (topology.js — Phase 2)
├── Simulator       (simulator.js)
│   ├── EventQueue  (event-queue.js — Phase 2)
│   └── Graph       (graph.js — Phase 2)
├── AllReduceRing   (all-reduce-ring.js)
│   └── Graph
├── AllReduceTree   (all-reduce-tree.js)
│   └── Graph
└── Scorer          (scorer.js)
    ├── BisectionBandwidth (bisection-bandwidth.js)
    │   └── Graph
    └── Graph
```

### index.html script order (new tags, after existing Phase 2 tags)

1. `js/engine/bisection-bandwidth.js`
2. `js/engine/all-reduce-ring.js`
3. `js/engine/all-reduce-tree.js`
4. `js/engine/simulator.js`
5. `js/engine/scorer.js`
6. `js/engine/evaluator.js`

All six depend on Phase 2 modules (Graph, EventQueue, Topology, Prng) which are already loaded.

## 11. Relationship to Existing Code

### What Phase 2 provides that Phase 3 builds on

- **`Graph`** — adjacency, BFS, Dijkstra, `calcDiameter()`, `getLinkBetween()`. Used by the simulator for routing, by bisection-bandwidth for partitioning, and by the scorer for diameter.
- **`Topology`** — wraps nodes/links/workload/seed, `buildGraph()`, `validate(constraints)`. The evaluator's primary input.
- **`EventQueue`** — binary-heap priority queue on `event.t`. The simulator's core data structure.
- **`Link`** — bandwidth, latency, delay calculations. The simulator reads bandwidth and latency from topology links. `Link.inFlightQueue` exists but is not used by the simulator (the simulator manages its own per-link state).
- **`Prng`** — seeded PRNG. Used by the spectral bisection-bandwidth method for deterministic initialization of the power-iteration vector.

### What Phase 3 does NOT touch

- No changes to Phase 2 files. All six new files are additive.
- No UI code. The evaluator returns a result object; Phase 4 will wire it to the editor and score panel.
- No level or encyclopedia code. Phase 6 will use the evaluator to compute reference PFLOPS.

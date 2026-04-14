# Proposed Solution

## Thesis Statement

A browser-based game that lets users design datacenter network topologies under progressive constraints -- and immediately see how their design performs under a simulated all-reduce workload via packet-level discrete-event simulation -- can bridge the gap between abstract graph theory and practical datacenter engineering intuition that no existing tool addresses.

## Approach

The core insight is that the relationship between network topology and distributed computing performance is best understood by *building and failing*, not by reading. When a user connects 25 nodes in a ring and watches packets queue up at a single bottleneck link while their PFLOP score plummets, they learn why bisection bandwidth matters in a way that no textbook diagram can convey. When they add a single cross-link and see their score jump, they discover the power of reducing network diameter firsthand.

The system has three interlocking components:

1. **An interactive network editor** where users place nodes and draw connections. Early levels use a fixed 2D grid (removing spatial complexity so users focus on connectivity). Middle levels introduce free node placement and spatial constraints (cable length limits, total cable budgets). Late levels move to 3D, where physical layout and wiring cost become part of the design problem.

2. **A deterministic packet-level discrete-event simulation engine** that models all-reduce communication across the user's topology. Each link has bandwidth and latency parameters. Packets queue at congested links, producing realistic contention. The engine evaluates multiple communication strategies (ring all-reduce, tree all-reduce) and scores the topology using the best one. Because the simulation uses a seeded pseudorandom number generator for workload distribution, identical topologies produce identical scores on any browser and any platform.

3. **A progressive level system with an unlockable topology encyclopedia.** Eight levels ramp from 4 nodes with no constraints to 25 nodes with all constraints active. Each completed level unlocks an encyclopedia entry about a real-world datacenter topology (fat-tree, torus, dragonfly, Clos, etc.), showing its graph-theoretic properties and how the player's design compares.

## Feasibility

The project is feasible for the following reasons:

- **Computational scale is trivial.** 25 nodes produce at most 300 possible links. Even a full packet-level DES of an all-reduce across 25 nodes generates at most tens of thousands of events. JavaScript can process millions of events per second in a simple priority-queue loop. The simulation will complete in milliseconds on any modern browser.

- **No backend required.** The entire application runs client-side: HTML/CSS for layout, Canvas 2D for early levels, Three.js (loaded from CDN) for 3D levels. No server, no database, no deployment infrastructure. A user opens `index.html` and plays.

- **Established simulation architecture.** The DES engine follows the same event-queue architecture used by ns-3, the gold-standard network simulator, but stripped down to the essentials needed for a 25-node all-reduce. The core data structures (priority queue, link queuing model, packet representation) are straightforward to implement.

- **Graph algorithms are well-understood.** Shortest path (Dijkstra), diameter calculation, bisection bandwidth estimation, and planarity testing (Boyer-Myrvold) are all textbook algorithms with well-documented implementations. No novel algorithmic work is required.

- **Proven educational model.** Existing work (Conquer the Net, NetEmulator) demonstrates that interactive, browser-based tools are effective for teaching networking concepts. This project extends the approach from device configuration to topology design.

## Expected Outcomes

1. **A playable 8-level browser game** where users design datacenter network topologies under progressive constraints and receive immediate performance feedback via animated packet-level simulation and a detailed score breakdown (effective PFLOPS, communication overhead, diameter, bisection bandwidth, bottleneck identification).

2. **A deterministic, cross-platform simulation engine** that models all-reduce communication at packet granularity with congestion and queuing effects, producing consistent scores across all browsers and operating systems.

3. **A topology encyclopedia** with entries on 6-8 real-world datacenter topologies, each including a diagram, graph-theoretic properties, real-world usage examples, and a comparison against the player's best design for the corresponding level.

4. **An academic paper** analyzing (a) the simulation model and its relationship to real datacenter performance, (b) the graph-theoretic properties that determine all-reduce efficiency, and (c) how progressive constraints guide users toward discovering known optimal topologies.

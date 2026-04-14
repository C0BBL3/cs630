# An Analysis and Gamification of Networking in Data Centers

## 1. Introduction

Datacenter network topology is one of the most consequential decisions in high-performance computing infrastructure, yet it remains one of the least intuitive. The choice of how to interconnect compute nodes -- ring, mesh, fat-tree, torus, dragonfly, Clos -- directly determines the effective throughput of distributed workloads. In modern AI training, the all-reduce communication pattern (where every node must share its computed gradients with every other node) means that a poor interconnect can idle billions of dollars of GPU hardware while data waits in transit. Industry estimates suggest that communication overhead can consume 30-50% of total training time in large distributed ML jobs, and the interconnect topology is the primary lever for reducing it.

Despite this, the relationship between graph-theoretic properties of a network (degree, diameter, bisection bandwidth) and real workload performance is rarely taught in an interactive or intuitive way. Students and practitioners learn these topologies as static diagrams in textbooks -- they memorize that a fat-tree has full bisection bandwidth, or that a torus has low diameter, but they never experience *why* these properties matter by building a topology themselves and watching it succeed or fail under load.

Consider a concrete example: 25 compute nodes, each capable of 1 PFLOP, must perform an all-reduce operation. Connected as a simple ring, the all-reduce requires 24 sequential hops along the slowest link -- even with 400 Gbps links, communication time dominates and effective cluster performance drops far below 25 PFLOPS. A fat-tree connecting the same 25 nodes completes the same all-reduce with far fewer bottlenecks, but requires more cabling and switch hardware. This engineering trade-off is real and consequential, but it is invisible in a textbook diagram.

**Research question:** Can a gamified, interactive network topology designer -- where users build datacenter interconnects under realistic constraints and receive immediate performance feedback -- serve as an effective tool for teaching the relationship between graph-theoretic network properties and distributed computing performance?

## 2. State of the Art

Existing work in this space falls into three categories that do not overlap.

**Topology research** has produced a rich set of datacenter network designs. Al-Fares et al. [1] proposed the fat-tree topology using commodity Ethernet switches to achieve full bisection bandwidth, scaling to 27,648 hosts. Kim et al. [2] introduced the dragonfly topology, which organizes high-radix routers into fully-connected groups to reduce network diameter to three hops, cutting cost by 20-52% compared to alternatives at scale. Singla et al. [3] challenged the assumption that structured topologies are always optimal, showing that Jellyfish's random graph topology supports 25% more servers than fat-trees using identical equipment while enabling incremental expansion. Singh et al. [4] documented Google's decade-long evolution of multi-stage Clos networks, scaling 100x to over 1 Pbps of bisection bandwidth. These papers are rigorous and foundational, but they present topologies for an expert audience -- a reader must already understand concepts like bisection bandwidth and network diameter to appreciate the contributions.

**Network simulation** provides tools for researchers to evaluate topology performance. ns-3 [5] is the gold-standard open-source discrete-event simulator, offering packet-level fidelity but requiring C++ compilation and significant expertise. FatTreeSim [6] demonstrated that parallel discrete-event simulation works for fat-tree topologies at extreme scale, achieving 305 million events per second on 16,384 cores. Long et al. [7] showed that packet-level simulation of all-reduce workloads is tractable, achieving 744x speedup over ns-3 with under 1% error by exploiting repetitive traffic patterns in distributed training. These are powerful research instruments, but none is accessible to learners or designed for interactive use.

**Educational gamification** has produced interactive tools for networking concepts. Arevalillo-Herráez et al. [8] developed Conquer the Net, a game for practicing basic network configuration commands (IP addressing, routing tables) in cooperative and competitive scenarios. NetEmulator [9] provides a web-based drag-and-drop topology builder where students send packets and receive real-time feedback on configuration errors. Both tools teach device configuration and protocol behavior, but neither addresses topology design or connects topology structure to aggregate performance metrics.

The gap is clear: no existing tool lets users design datacenter network topologies under realistic constraints and receive immediate, quantitative feedback on how their design affects distributed workload performance. The topology papers tell you *what* works. The simulators let you *measure* performance. The educational tools teach *configuration*. Nothing teaches topology *design* through experience.

## 3. Proposed Solution

The core insight behind this project is that the relationship between network topology and distributed computing performance is best understood by building and failing, not by reading. When a user connects 25 nodes in a ring and watches packets queue up at a single bottleneck link while their PFLOP score drops, they learn why bisection bandwidth matters in a way no diagram can convey. When they add a single cross-link and see their score jump, they discover the power of reducing network diameter firsthand.

The solution is a browser-based game with three interlocking components:

**An interactive network editor** where users place nodes and draw connections. Early levels use a fixed 2D grid so users focus purely on connectivity. Middle levels introduce free node placement and spatial constraints (cable length limits, total cable budgets). Late levels move to 3D, where physical layout and wiring cost become part of the design problem.

**A deterministic packet-level discrete-event simulation engine** that models all-reduce communication across the user's topology. Each link has bandwidth and latency parameters. Packets queue at congested links, producing realistic contention effects. The engine evaluates multiple communication strategies (ring all-reduce, tree all-reduce) and scores the topology using the best one. Because the simulation uses a seeded pseudorandom number generator, identical topologies produce identical scores on any browser and platform -- no wall-clock timing is involved.

**A progressive level system with an unlockable topology encyclopedia.** Eight levels ramp from 4 nodes with no constraints (a tutorial) to 25 nodes with all constraints active (max degree, cable length, cable budget, planarity). Each completed level unlocks an encyclopedia entry about a real-world topology -- fat-tree, torus, dragonfly, Clos -- showing its graph-theoretic properties and how the player's design compares.

The simulation engine follows the same event-queue architecture used by ns-3 but stripped down to the essentials for a 25-node all-reduce. At this scale, the computation is trivial: 25 nodes produce at most 300 possible links, generating at most tens of thousands of simulation events. JavaScript processes millions of events per second in a simple priority-queue loop, so the simulation completes in milliseconds. The entire application runs client-side (HTML/CSS/JS, Canvas 2D, Three.js from CDN) with no backend, no build step, and no installation -- a user opens a single HTML file and plays.

### Milestones

1. **Core graph model**: Node/edge data structures, shortest path (Dijkstra), diameter, bisection bandwidth calculations.
2. **Simulation engine**: Packet-level DES with event queue, link queuing model, seeded PRNG, ring and tree all-reduce strategies, PFLOP scoring formula.
3. **2D editor and first levels**: Canvas-based fixed-position editor, click-to-connect interaction, constraint validation (degree, cable length), levels 1-3 playable.
4. **Scoring visualization**: Animated packet flow, bottleneck highlighting, score breakdown panel (effective PFLOPS, communication overhead, diameter, bisection bandwidth), star rating.
5. **Advanced levels**: 2D free placement mode, cable budget and planarity constraints, levels 4-6.
6. **3D mode**: Three.js integration, 3D node placement and edge drawing, levels 7-8.
7. **Encyclopedia and polish**: Unlockable topology entries, comparison of player designs to known topologies, tutorial overlays, UI polish.
8. **Academic paper**: System design analysis, topology property analysis, player-design comparison data.

## 4. Deliverables

1. **Complete browser-based game**: A fully playable 8-level datacenter network topology design game with a packet-level DES engine, animated visualization, scoring breakdown, and unlockable topology encyclopedia. Runs in any modern browser (Chrome, Firefox, Edge) with no installation.

2. **Source code and documentation**: Complete source code repository with a README covering how to run the game, project structure, simulation model description, scoring formula explanation, and constraint/level configuration documentation.

3. **Project report**: A formal academic paper covering problem motivation, related work, system architecture, simulation model analysis, and results comparing topology properties to simulated all-reduce performance.

4. **Final presentation slides**: Slide deck covering the project end-to-end, incorporating feedback received during the project presentation.

## 5. Timeline

8-week timeline from April 14 to June 8, 2026.

| Week | Dates | Tasks | Milestone |
|------|-------|-------|-----------|
| 1 | Apr 14-20 | Graph data structure, shortest path, diameter, bisection bandwidth calculations | Core graph model complete |
| 2 | Apr 21-27 | Packet-level DES engine (event queue, link queuing, seeded PRNG), all-reduce simulation (ring + tree), PFLOP scoring | Simulation engine produces scores |
| 3 | Apr 28 - May 4 | Canvas 2D editor (fixed positions, click-to-connect), constraint validation (degree, cable length), levels 1-3 | First 3 levels playable |
| 4 | May 5-11 | Animated packet visualization, score breakdown panel, star rating, bottleneck highlighting | Scoring and animation working |
| 5 | May 12-18 | 2D free placement, cable budget + planarity constraints, levels 4-6, Three.js 3D editor, levels 7-8 | All 8 levels playable |
| 6 | May 19-25 | Topology encyclopedia, UI polish, tutorial overlays, README and code documentation, begin writing report | Game feature-complete |
| 7 | May 26 - Jun 1 | Complete project report draft, prepare and deliver project presentation | Presentation delivered |
| 8 | Jun 2-8 | Incorporate presentation feedback into slides, revise and finalize report, final bug fixes | All deliverables submitted |

The critical path runs through the simulation engine: the graph model (week 1) enables the DES engine (week 2), which enables the editor (week 3) and visualization (week 4), which enable the report (weeks 6-8). If the simulation engine slips, all downstream work is delayed. Week 5 is the most aggressive; if it slips, week 6's polish and encyclopedia work can absorb the overflow, as the encyclopedia is the first feature to descope.

## 6. References

[1] Al-Fares, M., Loukissas, A., and Vahdat, A. "A Scalable, Commodity Data Center Network Architecture." ACM SIGCOMM 2008, pp. 63-74. https://www.scirp.org/(S(czeh4tfqyw2orz553k1w0r45))/reference/referencespapers?referenceid=2006753

[2] Kim, J., Dally, W.J., Scott, S., and Abts, D. "Technology-Driven, Highly-Scalable Dragonfly Topology." ISCA 2008, pp. 77-88. https://www.cs.umd.edu/class/spring2021/cmsc714/student-slides/XW-1.pdf

[3] Singla, A., Hong, C.-Y., Popa, L., and Godfrey, P.B. "Jellyfish: Networking Data Centers Randomly." NSDI 2012, pp. 225-238. https://experts.illinois.edu/en/publications/jellyfish-networking-data-centers-randomly/

[4] Singh, A., et al. "Jupiter Rising: A Decade of Clos Topologies and Centralized Control in Google's Datacenter Network." ACM SIGCOMM 2015. https://dl.acm.org/doi/10.1145/2975159

[5] ns-3 Network Simulator. https://nsnam.org

[6] Liu, N., Haider, A., Jin, D., and Sun, X.-H. "Modeling and Simulation of Extreme-Scale Fat-Tree Networks for HPC Systems and Data Centers." ACM Trans. Model. Comput. Simul. 27(2), 2017. https://publish.illinois.edu/science-of-security-lablet/files/2014/05/A-Modeling-and-Simulation-of-Extreme-Scale-Fat-Tree-Networks-for-HPC-Systems-and-Data-Centers.pdf

[7] Long, F., et al. "Supercharging Packet-level Network Simulation of Large Model Training via Memoization and Fast-Forwarding." arXiv:2602.10615, 2026. https://arxiv.org/abs/2602.10615

[8] Arevalillo-Herráez, M., Morán-Gómez, R., and Claver, J.M. "Conquer the Net: An Educational Computer Game to Learn the Basic Configuration of Networking Components." Computer Applications in Engineering Education, 20(1), 2012, pp. 72-77. https://onlinelibrary.wiley.com/doi/10.1002/cae.20374

[9] NetEmulator. https://netemulator.com

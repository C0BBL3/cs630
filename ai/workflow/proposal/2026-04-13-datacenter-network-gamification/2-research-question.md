# Research Question

## Problem Statement

Datacenter network topology is one of the most consequential decisions in high-performance computing infrastructure, yet it remains one of the least intuitive. The choice of how to interconnect compute nodes -- ring, mesh, fat-tree, torus, dragonfly, Clos -- directly determines the effective throughput of distributed workloads. In modern AI training, for example, the all-reduce communication pattern (where every node must share its computed gradients with every other node) means that a poor interconnect can idle billions of dollars of GPU hardware while data waits in transit. General knowledge: industry estimates suggest that communication overhead can consume 30-50% of total training time in large distributed ML jobs, and the interconnect topology is the primary lever for reducing it.

Despite this, the relationship between graph-theoretic properties of a network (degree, diameter, bisection bandwidth, planarity) and real workload performance is rarely taught in an interactive or intuitive way. Students and practitioners learn these topologies as static diagrams in textbooks -- they memorize that a fat-tree has full bisection bandwidth, or that a torus has low diameter, but they never experience *why* these properties matter by building a topology themselves and watching it succeed or fail under load.

**Concrete example**: Consider 25 compute nodes, each capable of 1 PFLOP, that must perform an all-reduce operation. If connected as a simple ring, the all-reduce requires 24 sequential hops along the slowest link -- even if each link is 400 Gbps, the communication time dominates and effective cluster performance drops far below 25 PFLOPS. A fat-tree connecting the same 25 nodes can complete the same all-reduce with far fewer bottlenecks, but requires more cabling and switch hardware. The engineering trade-off is real, but it is invisible in a textbook diagram.

## Research Question

**Can a gamified, interactive network topology designer -- where users build datacenter interconnects under realistic constraints and receive immediate performance feedback -- serve as an effective tool for teaching the relationship between graph-theoretic network properties and distributed computing performance?**

## Significance

General knowledge: datacenter network design is a multi-billion dollar decision space. Hyperscalers like Google, Meta, and Microsoft invest heavily in custom network fabrics (Google's Jupiter, Meta's fabric for AI training clusters) precisely because topology choices at scale translate directly into compute efficiency. Yet the engineers making these decisions often learned the underlying theory from static lectures and problem sets that do not build intuition for the trade-offs involved.

Speculating: an interactive tool that lets users experience the consequences of topology choices -- seeing their ring topology bottleneck in real time, or discovering that adding a single cross-link dramatically reduces diameter -- could build deeper intuition than traditional instruction. Gamification (progressive levels, scoring, unlockable content) adds motivation and structure to what would otherwise be an open-ended design exercise.

Beyond education, the simulation engine itself produces a lightweight but grounded model of how topology affects all-reduce performance. The analysis comparing player-designed topologies against known optimal solutions provides a dataset for studying how humans approach network design problems -- which heuristics they gravitate toward, where their intuitions fail, and how constraint pressure shapes their designs.

## Scope

**In scope:**
- A browser-based interactive game with 8 progressive levels, from 4-node 2D layouts to 25-node 3D designs
- A packet-level discrete-event simulation engine modeling all-reduce communication with per-link latency, bandwidth, and queuing/congestion effects -- deterministic and cross-platform consistent via seeded PRNG
- A constraint system (max degree, cable length, cable budget, planarity) that introduces engineering trade-offs
- Animated packet-level visualization showing congestion, queuing, and bottlenecks in real time
- An unlockable encyclopedia comparing player designs to real-world datacenter topologies
- An academic paper analyzing the design, the simulation model, and the relationship between topology properties and performance

**Out of scope:**
- Real hardware benchmarking or validation against physical datacenter measurements
- Multi-tenant or multi-workload simulation (we focus on the all-reduce pattern only)
- User studies or formal educational effectiveness measurement (the paper analyzes the system design and topology theory, not pedagogical outcomes)

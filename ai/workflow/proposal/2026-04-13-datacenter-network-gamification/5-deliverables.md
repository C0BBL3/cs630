# Deliverables

## Code Deliverables

### 1. Complete Browser-Based Game
**Description:** A fully playable browser-based datacenter network topology design game with 8 progressive levels, a packet-level discrete-event simulation engine, animated data flow visualization, scoring breakdown, and an unlockable topology encyclopedia.

**Acceptance criteria:**
- All 8 levels are playable from start to finish in any modern browser (Chrome, Firefox, Edge)
- The network editor supports 2D fixed, 2D free placement, and 3D modes
- Constraints (max degree, cable length, cable budget, planarity) are validated in real-time
- The simulation produces deterministic, platform-consistent scores via seeded PRNG
- Animated packet-level visualization shows congestion and bottlenecks
- Score breakdown displays effective PFLOPS, communication overhead, diameter, bisection bandwidth, and bottleneck identification
- Encyclopedia entries unlock upon level completion

**Dependencies:** None.

### 2. Source Code and Documentation
**Description:** Complete source code repository with a README covering setup instructions (open `index.html`), project structure, a description of the simulation model, and an explanation of the scoring formula.

**Acceptance criteria:**
- README explains how to run the game (no build step, no installation)
- Code is organized into clearly named directories (`js/engine/`, `js/ui/`, `js/levels/`, `js/encyclopedia/`)
- The simulation model and PFLOP scoring formula are documented
- Constraint definitions and level configurations are documented

**Dependencies:** Deliverable 1.

## Written Deliverables

### 3. Project Report
**Description:** A formal academic paper analyzing the system design, the simulation model, and the relationship between graph-theoretic network properties and all-reduce performance. Covers problem motivation, related work, system architecture, topology analysis, and results comparing player-achievable designs against known optimal topologies.

**Acceptance criteria:**
- Includes all sections: Introduction, Background, System Design, Analysis, Results, Discussion, Conclusion, References
- All cited sources are real and verifiable
- Analysis includes concrete comparisons between topology properties (degree, diameter, bisection bandwidth) and simulated PFLOP performance
- Figures and diagrams illustrate the game interface, simulation model, and topology comparisons

**Dependencies:** Deliverable 1 (gameplay data and screenshots needed for the report).

### 4. Final Presentation Slides
**Description:** Slide deck presenting the project, incorporating feedback received during the project presentation.

**Acceptance criteria:**
- Covers problem motivation, related work, system design, demo highlights, results, and conclusions
- Reflects feedback from the initial project presentation
- Includes diagrams, screenshots, and score comparison data from the game

**Dependencies:** Deliverable 3.

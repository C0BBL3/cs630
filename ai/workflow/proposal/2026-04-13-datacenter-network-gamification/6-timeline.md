# Timeline

8-week timeline from April 14 to June 8, 2026. Project presentation in week 7; final deliverables due end of week 8.

## Timeline Table

| Week | Dates | Deliverable | Tasks | Milestone |
|------|-------|-------------|-------|-----------|
| 1 | Apr 14-20 | Game (D1) | Graph data structure, shortest path, diameter, bisection bandwidth calculations | Core graph model complete |
| 2 | Apr 21-27 | Game (D1) | Packet-level DES engine (event queue, link queuing, seeded PRNG), all-reduce simulation (ring + tree), PFLOP scoring formula | Simulation engine produces scores |
| 3 | Apr 28 - May 4 | Game (D1) | Canvas 2D editor (fixed positions, click-to-connect), constraint validation (degree, cable length), levels 1-3 | First 3 levels playable |
| 4 | May 5-11 | Game (D1) | Animated packet visualization, score breakdown panel, star rating system, bottleneck highlighting | Scoring and animation working |
| 5 | May 12-18 | Game (D1) | 2D free placement mode, cable budget + planarity constraints, levels 4-6, Three.js 3D editor, levels 7-8 | All 8 levels playable |
| 6 | May 19-25 | Game (D1), Docs (D2), Report (D3) | Topology encyclopedia with unlockable entries, UI polish, tutorial overlays. README and code documentation. Begin writing project report. | Game feature-complete. Documentation done. |
| 7 | May 26 - Jun 1 | Report (D3), Slides (D4) | Complete project report draft. Prepare and deliver project presentation. | Presentation delivered |
| 8 | Jun 2-8 | Report (D3), Slides (D4) | Incorporate presentation feedback into slides. Revise and finalize project report. Final bug fixes. | All deliverables submitted |

## Critical Path

The critical path runs through the simulation engine:

1. **Graph model** (week 1) -- everything else depends on this
2. **DES engine + scoring** (week 2) -- the editor and visualization are useless without a working simulation
3. **2D editor + first levels** (week 3) -- needed to validate the simulation produces meaningful scores
4. **Animation + scoring display** (week 4) -- needed to make the game playable and to generate screenshots/data for the report
5. **All levels complete** (week 5) -- the report's analysis section requires data from all 8 levels

If the simulation engine slips, every downstream task (editor, visualization, encyclopedia, report) is delayed.

## Risk and Buffer

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DES engine takes longer than one week | Medium | High -- delays everything | Week 1's graph model is straightforward; if it finishes early, start DES in week 1 to create buffer |
| 3D mode (Three.js) is harder than expected | Medium | Medium -- only affects levels 7-8 | 3D levels can be descoped to 2D free-placement with more nodes if Three.js integration stalls |
| Planarity checking algorithm is complex to implement | Low | Low -- only affects level 5 | Use an existing open-source JS implementation or simplify to a "max edge crossings" constraint |
| Report writing takes longer than expected | Medium | High -- it's a required deliverable | Begin writing background and system design sections in week 6 alongside polish work, not in week 7 |

**Buffer**: Week 5 is the most aggressive (2D free placement, planarity, 3D mode, and 3 levels in one week). If earlier weeks run ahead of schedule, week 5's load is reduced. If week 5 slips, week 6's polish and encyclopedia work can absorb the overflow since those are lower-priority features. The encyclopedia is the first feature to cut if time is tight -- it enhances the game but is not required for a complete, playable, scoreable experience.

# Engine Tests

All tests run in the browser console. There is no test framework — each file is a self-contained snippet you paste into DevTools.

## Setup

1. Open `index.html` in a browser (e.g. double-click the file, or use a local server like `npx serve .`).
2. Open DevTools → **Console** (F12 or Ctrl+Shift+I on Windows, Cmd+Option+I on Mac).

## Running Tests

There are 9 test files. You can run them in any order — each is independent — but the dependency order below is the most natural if you want to verify bottom-up.

### Layer 1 — Foundation classes (no engine dependencies)

| File | What it tests | Expected output |
|------|---------------|-----------------|
| `test-prng.js` | Seeded PRNG determinism | Two `Prng(42)` instances produce identical sequences |
| `test-event-queue.js` | Min-heap priority queue | Dequeues events in ascending `t` order; returns `null` when empty |
| `test-link.js` | Link transmission/total delay | `calcTransmissionDelay(500)` → `0.5`, `calcTotalDelay(500)` → `0.505` |

### Layer 2 — Graph and Topology

| File | What it tests | Expected output |
|------|---------------|-----------------|
| `test-graph.js` | Degree, neighbors, BFS, Dijkstra, diameter | 4-node path: diameter `3`, BFS distances `{0:0, 1:1, 2:2, 3:3}` |
| `test-topology.js` | `buildGraph`, `validate` (degree, cable length, cable budget) | Triangle topology: degree-2 passes, degree-1 fails; cable budget 10 fails (total is 12) |

### Layer 3 — Algorithms

| File | What it tests | Expected output |
|------|---------------|-----------------|
| `test-bisection-bandwidth.js` | Exact bisection bandwidth for various topologies | 10 cases: single node → `0`, pair → `100`, K4 → `4`, ring → `20`, star → `10`, etc. |
| `test-all-reduce-strategies.js` | Ring and tree schedule generation | 4-node ring: ring produces 6 phases / 24 entries; tree produces 4 phases / 6 entries |

### Layer 4 — Simulation and Evaluation

| File | What it tests | Expected output |
|------|---------------|-----------------|
| `test-simulator.js` | Full DES simulation on a 4-node ring | Prints `completionTime`, event count, and `linkUtilizations` object |
| `test-evaluator.js` | End-to-end evaluator (6 sub-tests) | Single node → 1e15 PFLOPS; disconnected → fails; 2-node/ring/star → valid scores; high-latency → lower PFLOPS |

## How to paste a test

1. Open the test file in your editor (e.g. `js/tests/test-graph.js`).
2. Select all the content (Ctrl+A).
3. Paste it into the browser console and press Enter.
4. Read the `console.log` output and compare against the comments in the file.

## Quick "run everything" approach

Paste the files one at a time into the console in the order listed above. Each file prints labeled output, so you can scroll through the console and verify all results in one session.

## Troubleshooting

- **`DCN is not defined`** — Make sure you opened `index.html`, not a blank tab. All engine modules attach to `window.DCN.engine`.
- **`TypeError: ... is not a constructor`** — A script tag may be missing from `index.html`. Check that all `<script>` tags are present and in the correct order.
- **Stale results after code changes** — Hard-refresh the page (Ctrl+Shift+R) before re-running tests to pick up the latest source files.
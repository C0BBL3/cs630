# Project Skeleton — Plan

Single-phase plan derived from [2-research.md](2-research.md). Implements Phase 1 of the [parent architecture plan](../2026-04-17-initial-architecture/3-plan.md).

Status legend: no prefix = pending, `⋯` = in progress, `✓` = done.

## ✓ Phase 1 — Create Skeleton Files

**Goal.** A blank styled page that loads cleanly with the global namespace bootstrapped. The file layout, CSS, and IIFE/namespace pattern are real and used by every later phase.

**Files added.**

- `index.html` — HTML5 boilerplate. `<head>` links `css/style.css`. `<body>` has `<div id="app"></div>`. Script tag for `js/dcn.js` at end of body. Comment placeholder for Three.js (deferred to Phase 8).
- `css/style.css` — Minimal CSS reset (`margin: 0`, `padding: 0`, `box-sizing: border-box`). `#app` fills the viewport.
- `js/dcn.js` — IIFE that sets `window.DCN = { engine: {}, ui: {}, levels: {}, encyclopedia: {} }`.

**Deployable check.** Open `index.html` from `file://`. Page loads with no console errors. `window.DCN` is defined in the console with four empty sub-namespaces.

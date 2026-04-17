# Project Skeleton — Context

## 1. Feature

This feature implements Phase 1 from the [initial architecture plan](../2026-04-17-initial-architecture/3-plan.md): a blank styled page that loads cleanly with the global namespace bootstrapped. Nothing functional yet, but the file layout, CSS, and IIFE/namespace pattern are real and used by every later phase.

## 2. Source Material

- [Initial architecture — research](../2026-04-17-initial-architecture/2-research.md) — module loading convention (IIFE + `window.DCN`), top-level layout, naming/style conventions.
- [Initial architecture — plan](../2026-04-17-initial-architecture/3-plan.md) — Phase 1 definition (files added, deployable check).
- [5-deliverables.md](../../proposal/2026-04-13-datacenter-network-gamification/5-deliverables.md) — directory split commitment (`js/engine/`, `js/ui/`, `js/levels/`, `js/encyclopedia/`).

## 3. Scope

Three files:
- `index.html` — boilerplate; links one stylesheet; `<div id="app">`; `<script>` for `js/dcn.js`.
- `css/style.css` — minimal CSS reset and basic layout for `#app`.
- `js/dcn.js` — IIFE that sets `window.DCN = { engine: {}, ui: {}, levels: {}, encyclopedia: {} }`.

## 4. Deviations From Parent Plan

- **Three.js deferred.** The parent plan includes `vendor/three.min.js` in Phase 1. We defer it to Phase 8 since nothing uses it until then. `index.html` will carry a comment placeholder instead of a commented-out `<script>` tag.

## 5. Out of Scope

- Any engine, UI, or level code.
- `vendor/` directory and Three.js.
- Any visual content beyond a clean blank page.

# Project Skeleton — Research

This feature is small enough that all open questions were resolved during the parent architecture research. This document confirms the decisions that apply and notes the one deviation.

## 1. Module Loading Pattern

Per [initial architecture research, Section 6](../2026-04-17-initial-architecture/2-research.md):

- Each `.js` file is wrapped in an IIFE: `(function() { ... })()`.
- Class files end with `window.DCN.<subns>.<ClassName> = <ClassName>;` inside the IIFE.
- `js/dcn.js` is the one exception — it creates the namespace itself rather than attaching a class to it.

The IIFE pattern replaces CommonJS (`require`/`module.exports`) from [AGENTS.md](../../../../AGENTS.md) because this project is a pure browser app with no build step, loaded via `<script>` tags from `file://`. All other AGENTS.md conventions (one class per file, kebab-case filenames, guard clauses, named intermediates, etc.) still apply.

## 2. File Details

### `index.html`

Standard HTML5 boilerplate. One `<link>` to `css/style.css`. One `<div id="app">` in the body. One `<script>` tag for `js/dcn.js`. A comment placeholder for Three.js (deferred to Phase 8).

Script tags go at the end of `<body>` so the DOM is ready before any JS executes. This avoids the need for `DOMContentLoaded` listeners in the skeleton phase.

### `css/style.css`

Minimal reset (`margin`, `padding`, `box-sizing`) plus `#app` filling the viewport. No colors, fonts, or decorative styling — those belong to later UI phases.

### `js/dcn.js`

The namespace bootstrap. Sets `window.DCN` with four empty sub-namespace objects matching the committed directory split: `engine`, `ui`, `levels`, `encyclopedia`.

## 3. Open Questions

None. All decisions are inherited from the parent architecture.

# THE MOST IMPORTANT RULE

DO NOT, UNDER ANY CIRCUMSTANCES, EDIT AN EXISTING CODE FILE WITHOUT ASKING FOR AND RECEIVING PERMISSION FIRST.

You can edit .md files within the folder that we're doing all our planning etc. in, but that's it.

# New Rules that Sometimes Get Violated in Existing Code

Don't go out of your way and make out-of-scope updates to existing code to fix these rule violations, but be sure to follow these rules and fix any violations in any code we're touching anyway. It's more important to follow these rules than to maintain consistency within code that violates them.

## Use `const`, NOT `let`, whenever possible

- Use `const` for any local variable that is not reassigned after its initial assignment. This is the default for most named intermediate values — fetch results, computed values, extracted properties.
- Use `let` only for variables that are explicitly reassigned later in the same scope (e.g., accumulators, loop counters, values conditionally overwritten).
- Exception: `for...of` loop variables always use `let` regardless of whether they are reassigned inside the loop body (`for (let item of items)`). This is the established convention throughout the codebase.

## Use natural spacing; never tab-align

Do not pad variable declarations or object properties with extra spaces to align `=` or `:` across lines. Use a single space on each side of `=`, and a single space after `:`.

Exception: aligning end-of-line `//` comments after a column of short code lines is acceptable when it improves readability (e.g., a column of array entries each annotated with a reason).

```js
// BAD
let shortName     = 'short';
let veryLongName  = 'thisisaverylongname';

let names = {
    short:    'short',
    veryLong: 'thisisverylong',
};

// GOOD
const shortName = 'short';
const veryLongName = 'thisisaverylongname';

const names = {
    short: 'short',
    veryLong: 'thisisverylong',
};
```

# Suggesting Architecture Refactors

If the existing code architecture is getting in the way of implementing a clean solution, **say so and propose a refactor before proceeding**. Do not silently build on a messy foundation just because the user asked for a feature on top of it.

Signs that a refactor should be proposed:
- You are adding a second mechanism to do something the first mechanism already does partially (two streams of logic that could be one)
- You are overriding a method only to call `super` and add one thing, when the parent could simply accept an argument
- You are working around a design limitation rather than fixing it
- The new code would be significantly simpler if a small existing piece were restructured first

When you spot this, stop and surface it explicitly:

> "The current architecture has X problem. If we refactor Y first, the new code becomes Z. Should I do that before proceeding?"

Then wait for confirmation before implementing the refactor. Include the refactor as an explicit phase or step in the plan, placed before the work that depends on it.

Do not propose refactors for their own sake — only when they directly unblock a simpler implementation of the immediate task.

# Coding Style Conventions

## How to Use This File

**Keep it up to date.** Whenever a correction is made during a coding session — a style fix, a structural improvement, a naming decision, anything — check whether the rationale is already captured here. If it is not, add it immediately. If it is unclear whether it belongs or how to phrase it, ask. This file is only useful if it reflects every lesson learned.

---

## Core Philosophy

These two principles drive every other rule in this file. When in doubt, come back to them.

### 1. Every value must be inspectable without running code

A developer debugging this codebase should be able to understand any line by hovering over variable names. They should never have to manually invoke a function or evaluate an expression in the console just to see what an intermediate value is.

This means: **every intermediate value gets its own named variable.** Never nest a function call inside a subscript, another function call, or a conditional. If a value is worth computing, it is worth naming.

```js
// BAD — to debug this, you'd have to manually call getContentPlaceholder() yourself
replacements[this.getContentPlaceholder()] = contentString;

// GOOD — hover over contentPlaceholder to see its value instantly
const contentPlaceholder = this.getContentPlaceholder();
replacements[contentPlaceholder] = contentString;
```

### 2. Keep functions small and modular. Never merge them.

Smaller functions are easier to read, test, name, and reuse. When a function grows, decompose it into named helpers — never inline logic upward into the caller.

If you are tempted to merge two functions because they are always called together, resist. The right answer is a thin orchestrating function that calls both:

```js
// BAD — merged into one wall of text; neither half can be tested or reused independently
async buildPrompt(item) {
    const contentString = await this.getContentString(item);
    const contentPlaceholder = this.getContentPlaceholder();
    replacements[contentPlaceholder] = contentString;
    // ... 20 more lines of replacement logic ...
    return Utils.replaceKeysWithValues(template, replacements);
}

// GOOD — orchestrator calls focused helpers
async buildPrompt(item) {
    const template = this.getPromptTemplate();
    const replacements = await this.getPromptReplacements(item);
    return Utils.replaceKeysWithValues(template, replacements);
}

async getPromptReplacements(item) {
    // focused: only builds the replacements object
}
```

### Summary

| Principle | Rule |
|---|---|
| Inspectable | Every computed value has a named variable |
| Modular | Every distinct responsibility has its own function |
| Readable | Code reads top-to-bottom like prose |
| Flat | Guard clauses eliminate nesting; happy path stays at the left margin |
| Named | Variable and function names describe meaning, not mechanics |

---

## Never Introduce Redundant Field Aliases

Do not add a second field to an object that holds the same value as an existing field under a slightly different name. This creates confusion about which field to use and forces callers to reason about whether the two fields are always in sync.

**Don't do this:**
```js
const job = {
    type: jobType,
    jobType,   // redundant alias — same value as `type`
    ...
};
```

**Do this:**
```js
const type = agent.getJobType();
const job = {
    type,
    ...
};
```

If the existing field name is unclear, rename it — don't add a second field alongside it.

---

## Never Remove Existing Validations Without Asking

Do not remove a `Utils.validateExists(...)`, `Utils.validateValuesExist(...)`, or any other validation call unless the entire surrounding block of code is being deleted. If you are refactoring code and a validation appears to be "no longer necessary," stop and ask before removing it. Validations exist because someone was burned; removing them silently reintroduces risk.

---

## Never Remove Existing Logical Whitespace Groupings

When refactoring a block of code (e.g. rewriting an object literal as an array), preserve the blank-line groupings from the original. The groupings express intent about which items belong together — removing them throws away that information.

**Don't do this** (flattening a grouped list):
```js
// Original had blank lines separating checkers / legacy / generators / calculators
return [
    TopicChecker,
    LessonChecker,
    ExampleChecker,
    LegacyExampleChecker,   // blank line before this was intentional
    QuestionCloner,         // blank line before this was intentional
    QuestionTimeSetter,     // blank line before this was intentional
];
```

**Do this** (preserve the groups):
```js
return [
    TopicChecker,
    LessonChecker,
    ExampleChecker,

    LegacyExampleChecker,

    QuestionCloner,

    QuestionTimeSetter,
];
```

---

## NEVER Duplicate Existing Functionality — Search First, Always

**This rule is absolute. Violating it is one of the most common and costly mistakes.**

Before writing any piece of logic — a query, a loop, a transformation, a mapping, a helper method — stop and ask: *does this already exist somewhere in the codebase?* If you are not sure, search for it. If you still cannot find it, ask explicitly before writing it from scratch.

This applies at every level:

- **Utility functions**: check `external-use/utils.js` before writing a loop, transformation, merge, or validation inline.
- **Service/loader methods**: if a class already fetches or computes something, call that method rather than re-querying or re-computing it yourself. A method that already aggregates 10 things should be called once — never replaced by 10 separate calls.
- **Mappings and config**: if a mapping (e.g. agent name → content type) already exists in a loader or registry class, expose it from there. Never copy the mapping into a second place.

```js
// BAD — AgentLogger duplicates BotJobLoader's job-fetching logic by calling each method individually
const topicJobs = await BotJobLoader.fetchTopicCheckJobs();
const lessonJobs = await BotJobLoader.fetchLessonCheckJobs();
// ... 8 more calls ...

// GOOD — BotJobLoader already aggregates all of this; call it once
const allJobs = await BotJobLoader.fetchNewContentProcessingJobs();
```

```js
// BAD — reimplements Utils.propagateValues inline
for (let placeholder of Object.keys(stringsByPlaceholder)) {
    replacements[placeholder] = stringsByPlaceholder[placeholder];
}

// GOOD
Utils.propagateValues(stringsByPlaceholder, replacements);
```

**This also applies to existing code you are given.** If the codebase already has 10 parallel methods doing the same thing, do not preserve that complexity — consolidate it. Inherited mess is not an excuse to write more mess.

```js
// BAD — 10 parallel fetch methods that all do the same thing
static async fetchTopicCheckJobs() {
    return await this._constructJobs(TopicChecker);
}
static async fetchLessonCheckJobs() {
    return await this._constructJobs(LessonChecker);
}
// ... 8 more identical methods ...

// GOOD — one loop over the agents array
static async fetchNewContentProcessingJobs() {
    const agents = this.getAgents();
    const jobPromises = agents.map(agent => this._constructJobs(agent));
    const jobArrays = await Promise.all(jobPromises);
    // flatten and return
}
```

When in doubt: **search before writing. Ask before duplicating.**

Two utility functions that are especially easy to miss and reimplementing manually is a common mistake:

- **`Utils.byId(items, key='id')`** — converts an array (or object) to a hash keyed by `item[key]`. Use this instead of any manual `for` loop that builds `hash[item.id] = item`. It also accepts a custom key: `Utils.byId(dprs, 'prerequisiteTopicId')`.
- **`Utils.toDict(arr)`** — converts an array of primitives to a membership hash (`{ value: 1 }`). Use this when you only need to check presence, not retrieve the object.

```js
// BAD — manual hash-building loop
const topicsById = {};
for (let topic of topics) {
    topicsById[topic.id] = topic;
}

// GOOD
const topicsById = Utils.byId(topics);

// BAD — manual membership hash
const ids = {};
for (let id of idArray) {
    ids[id] = 1;
}

// GOOD
const ids = Utils.toDict(idArray);
```

---

## Accumulating Into a Map: Name the Array Before Pushing

When building a map of arrays inside a loop, do not double-index the map. Assign the array to a named variable first, initialize it if absent, then push to the variable:

```js
// BAD — map[key] appears three times; the push is anonymous
if (!enabledAgentsByContentTypeJobType[contentTypeJobType]) {
    enabledAgentsByContentTypeJobType[contentTypeJobType] = [];
}
enabledAgentsByContentTypeJobType[contentTypeJobType].push(agent);

// GOOD — name the array once; push reads cleanly against the name
let enabledAgents = enabledAgentsByContentTypeJobType[contentTypeJobType];
if (!enabledAgents) {
    enabledAgents = [];
    enabledAgentsByContentTypeJobType[contentTypeJobType] = enabledAgents;
}
enabledAgents.push(agent);
```

This is the named-intermediate-variable rule applied to map accumulation. The key appears exactly twice — once to read, once to assign — and the push operates on a named value the reader can inspect.

---

## Never Fetch Inside a Loop

Never run a database query (or any async fetch) inside a loop over items. This turns O(1) work into O(n) round-trips and is always wrong.

Instead, pull all the data you need in a single query before the loop, then look up values from the in-memory result.

```js
// BAD — one query per item
for (let item of items) {
    const agentJob = await db.execute(`SELECT * FROM agentJob WHERE contentId = [id]`, { id: item.id });
    // ...
}

// GOOD — one query for all items, then look up in memory
const contentIds = items.map(item => item.id);
const agentJobs = await db.execute(`SELECT * FROM agentJob WHERE contentId IN (${contentIds.join(',')})`);
const agentJobByContentId = {};
for (let agentJob of agentJobs) {
    agentJobByContentId[agentJob.contentId] = agentJob;
}

for (let item of items) {
    const agentJob = agentJobByContentId[item.id];
    // ...
}
```

This applies to all fetches: database queries, API calls, file reads. If you find yourself writing `await` inside a `for` loop, stop and redesign.

---

## Plan Status — Mark Steps Complete

Every time you finish a phase or step of a plan, immediately update the heading in the plan file to mark it complete. Do not wait until the end of a session or until the whole phase is done.

Use `✓` for done, `⋯` for in progress, no prefix for pending:

```md
## ✓ Phase 1 — Rename Legacy Files
## ⋯ Phase 2 — Refactor ContentCheckEvaluator
### ✓ Step 2.1 — Generalize augmentPromptReplacements
### ⋯ Step 2.2 — Refactor ContentCheckEvaluator
#### ✓ Step 2.2.1 — Merge the two replacement streams
#### Step 2.2.2 — Create question-check-evaluator.js
```

Whenever working on a plan, follow `ai/PLANS.md` for the full planning conventions — including how to update status annotations in the plan file.
See `ai/PLANS.md` for the full planning conventions.

---

## Core Philosophy: Code That Reads Like an Essay

The overriding goal is code that can be read top-to-bottom like prose, without stopping to decode anything. A reader should be able to understand *what* is happening and *why* from the code itself, with comments filling in intent where the code alone isn't enough. Concretely, this means:

- **Never cram.** Every discrete thought gets its own line and its own named variable.
- **Flatten aggressively.** Guard clauses and early returns eliminate nesting so the happy path stays at the left margin.
- **Name things to narrate.** Variable names describe what a value *means*, not what it *is* mechanically.
- **Decompose into named steps.** Long operations are broken into small methods or named intermediate variables that together read like a table of contents.

---

## Module System

- Use CommonJS (`require` / `module.exports`). No ES modules (`import`/`export`).
- All `require` statements go at the top of the file, before any other code.
- Order `require` statements: Node.js built-ins first, then npm packages, then local/relative requires.
- Each file exports exactly one class: `module.exports = ClassName;` on the last line, preceded by a blank line.

## Complete File Structure

Every file follows the same skeleton, top to bottom:

```js
const NodeBuiltin = require('node-builtin'); // Node.js built-ins
const NpmPackage = require('npm-package'); // npm packages

const LocalClass = require('./local-class'); // local/relative requires

const SOME_CONSTANT = 'value'; // module-level constants

class MyClass {

    // ...

}

module.exports = MyClass;
```

Rules:
- Separate the three `require` groups (built-ins, npm, local) with blank lines between groups.
- A blank line separates the last `require` group from any module-level constants.
- A blank line separates the constants block from the class declaration.
- The file ends with `module.exports = ClassName;`, preceded by a blank line.
- If there are no module-level constants, the `require` block flows directly into the class declaration with one blank line.

## Node.js Compatibility

Write code that runs on Node.js v8 and later. The two permitted exceptions are `async`/`await` (v8+, and the callback-hell alternative is not acceptable) and static class field syntax (`static FOO = ...`, already established in the codebase).

Do **not** use any of the following, regardless of whether the current server version supports them — the rule exists so code never breaks when deployed to an older environment:

- **Optional chaining** (`user?.name`) — use an explicit `if` check instead
- **Nullish coalescing** (`value ?? default`) — use an explicit `if` check instead
- **Logical assignment operators** (`&&=`, `||=`, `??=`) — use explicit assignments
- **`Array.at()`**, **`Object.hasOwn()`**, or other methods introduced after ES2016

When you need a null-safe property access, write it out:

**Don't do this:**
```js
const name = user?.profile?.name;
```

**Do this:**
```js
if (!user || !user.profile) {
    return;
}

const name = user.profile.name;
```

## File & Directory Naming

- File names use **kebab-case** and match the class name (e.g., `task-node.js` exports `TaskNode`, `xp-award-calculator.js` exports `XpAwardCalculator`).
- Directories use kebab-case.

## Class Structure

- All code is organized into classes. One class per file.
- Class declaration: `class ClassName {` with a **blank line immediately after** the opening brace.
- When a class is designed to be subclassed, include a `/* Child classes must implement ... */` block comment at the top of the class body listing the required methods.
- End the class body with `}` and a blank line before `module.exports`.

```js
class MyClass {

    /* 
    Child classes must implement:
    - static foo()
    */

    static bar() { ... }

}

module.exports = MyClass;
```

### No JavaScript getter/setter syntax

Do not use JavaScript's `get` and `set` property syntax. Use regular methods instead:

**Don't do this:**
```js
get taskId() {
    return this.task.id;
}
```

**Do this:**
```js
getTaskId() {
    return this.task.id;
}
```

Getter syntax hides that a method call is happening and makes it impossible to add parameters later. Regular methods are explicit and consistent with the method naming conventions above.

### Method ordering

Organize a class body into sections in this order:

1. **INITIALIZATION** — `constructor`, `initialize()`, and static factory/entry-point methods that kick off the class's work
2. **Main public methods** — the primary interface of the class
3. **HELPERS** — private (`_`-prefixed) and other supporting methods

Label each group with the appropriate section divider. Within each group, order methods so that callers appear before callees — a reader should encounter a method before the methods it calls.

## Variable Declarations

- Use `const` for any local variable that is not reassigned after its initial assignment. This is the default for most named intermediate values — fetch results, computed values, extracted properties.
- Use `let` only for variables that are explicitly reassigned later in the same scope (e.g., accumulators, loop counters, values conditionally overwritten).
- Exception: `for...of` loop variables always use `let` (`for (let item of items)`), regardless of whether the variable is reassigned inside the loop body. This is the established convention.
- Use `const` for module-level constants (before the class definition).
- Use `var` only when interfacing with legacy code that already uses it; never introduce new `var` declarations.
- Module-level mutable state (rare) uses `let` or `var` before the class definition.

## Naming Conventions

### **NO AMBIGUOUS NAMES — EVER**

Every name must say exactly what it contains. A reader should never have to look at how a variable is assigned to understand what it holds. If the name could describe more than one thing, it is wrong.

Common offenders and their fixes:

| Ambiguous | What's wrong | Better |
|---|---|---|
| `records` | Which records? From which table? | `agentJobRecords`, `topicRecords` |
| `record` | Same problem — which record? | `agentJobRecord`, `activeRecord` |
| `result` | Every function returns a result | `fetchResult`, `agentJobResult` |
| `data` | Everything is data | `agentJobRecords`, `courseData` |
| `items` | Items of what? | `pendingJobs`, `contentItems` |
| `list` | A list of what? | `agentNameList`, `typeKeyList` |
| `arr` | An array of what? | `agentNames`, `typeKeys` |
| `obj` | An object of what? | `agentJobRecord`, `configOptions` |
| `val` / `value` | A value of what? | `secondsSinceSubmitted`, `estimatedTime` |
| `flag` | A flag for what? | `isEnabled`, `shouldSkip` |
| `info` | Information about what? | `agentInfo`, `jobInfo` |
| `map` | A map of what to what? | `agentNamesByTypeKey`, `recordsByHash` |

This rule is not just about variable names — it applies to method parameters too. A parameter named `record` is as ambiguous as a variable named `record`. Name it `agentJobRecord`, `topicRecord`, etc.

When you find yourself reaching for a generic name, that is a signal to stop and ask: what exactly does this hold? Then name it that.

### Exception: well-understood infrastructure variables

A small set of names are conventional placeholders for a specific infrastructure concept. Using them does not introduce ambiguity because the type of value is obvious from context:

- `result` — the raw return value of a `db.execute(...)` call (the object with `.rows`)
- `row` — a single row from `result.rows`
- `item`, `items` — generic loop variable or collection in illustrative examples, not in production code

In production code, always choose descriptive names. These exceptions apply only where the variable's role is obvious from the surrounding infrastructure pattern.

### Exception: omit the type when the function name already establishes it

When a variable holds the primary subject of the current function and the function name already names it, the variable can use the short form (`record`, `records`) rather than repeating the type (`agentJobRecord`, `agentJobRecords`). The function name is the context — the variable inherits it.

```js
// GOOD — the function fetchAgentJobRecordsNotStarted already says what kind of records
// these are; inside fetchNewContentProcessingJobs, "records" is unambiguous
const records = await this.fetchAgentJobRecordsNotStarted();
for (let record of records) {
    // ...
}
```

This exception is narrow: it applies only to the primary subject of the function, and only when the called function's name already fully describes the type. All other variables in the same function still follow the full-name rule.

### Don't append `Record` to variable names unless it is necessary to disambiguate

Call it `topic`, not `topicRecord` — unless the same scope contains both a raw DB record and a separate domain object for the same entity and you need to tell them apart. The `Record` suffix exists to resolve ambiguity, not to annotate the obvious. If you are only ever dealing with one representation of a topic, `topic` is the right name.

```js
// BAD — "Record" adds noise when there is only one kind of topic in scope
const topicRecord = await this._fetchTopic(topicId);
const exampleRecord = await this._fetchExample(exampleId);

// GOOD
const topic = await this._fetchTopic(topicId);
const example = await this._fetchExample(exampleId);

// OK — Record suffix is justified here because both representations coexist
const topicRecord = result.rows[0].topic;   // raw DB row
const topic = new Topic(topicRecord);        // domain object
```

---

| Thing | Convention | Example |
|---|---|---|
| Classes | PascalCase | `AssignmentSelector` |
| Variables & methods | camelCase | `numTasks`, `selectTasks()` |
| Module-level constants | SCREAMING_SNAKE_CASE | `const MAX_REPNUM = ...` |
| Enum values (static class props) | SCREAMING_SNAKE_CASE | `AgentRole.TOPIC_CHECKER` |
| "Private" / internal methods | `_` prefix | `_processNext()`, `_execute()` |

The `_` prefix marks a **method** as an internal implementation detail — callers outside the class should not use it. It is a signal, not enforcement.

- Public methods (`processNext`, `selectTasks`) are the class's stable interface. External callers only use these.
- Private methods (`_processNext`, `_callLlm`) are called only from within the class itself — to decompose a public method into named steps.

Instance **properties** never get `_` prefixes, even when they are internal state. The convention is for methods only.

### Method Naming Patterns

- **Boolean-returning predicates**: `checkIf...()` or `check...()`  (e.g., `checkIfInitialized()`, `checkIfAssessment()`)
- **Async data retrieval**: `fetch...()`  (e.g., `fetchItemsToProcess()`, `fetchAgent()`)
- **Synchronous getters**: `get...()`  (e.g., `getGravityRankFromUid()`)
- **Computations**: `calc...()`  (e.g., `calcCourseProgress()`)
- **Mutations / writes**: `update...()`, `set...()`, `mark...()`, `insert...()`
- **Initialization**: `initialize...()` or `init...()`
- **Compound actions** (two sequential things): `methodA_methodB()` separated by `_`  (e.g., `checkIfProcessing_updateIfNot()`, `loadCachedKnowledgeIfNotRecalcMode_switchToRecalcModeIfUnable()`)

### Variable Names Must Mirror the Function They Call

When assigning the result of a function call to a variable, the variable name must match the function name — drop only the verb prefix. This keeps the call site readable and makes it instantly clear which function produced the value.

```js
// BAD — "new" prefix obscures the origin; the variable no longer mirrors the function
const newExampleCheckJobs = await this.fetchExampleCheckJobs();
const newQuestionCheckJobs = await this.fetchQuestionCheckJobs();

// GOOD — variable names match the function names directly
const exampleCheckJobs = await this.fetchExampleCheckJobs();
const questionCheckJobs = await this.fetchQuestionCheckJobs();
```

This applies everywhere, including when two variants coexist. If you have both `fetchLegacyExampleCheckJobs()` and `fetchExampleCheckJobs()`, the variables are named to match:

```js
const legacyExampleCheckJobs = await this.fetchLegacyExampleCheckJobs();
const exampleCheckJobs = await this.fetchExampleCheckJobs();
```

Never invent a prefix (`new`, `raw`, `fresh`) to disambiguate — instead, make the function name itself carry the distinction, and let the variable mirror it.

### Naming `Promise.all` result arrays

When `Promise.all` resolves an array of calls to the same method, name the result by mirroring the method name and appending `_arr`:

```js
// BAD — "records" is vague; could be agent records, job records, anything
const checkPromises = agents.map(agent => agent.checkIfActiveRecordExists());
const records = await Promise.all(checkPromises);

// GOOD — mirrors checkIfActiveRecordExists(); _arr signals a parallel index array
const checkPromises = agents.map(agent => agent.checkIfActiveRecordExists());
const activeRecordExists_arr = await Promise.all(checkPromises);
```

The `_arr` suffix signals that this is an ordered collection whose indices line up with the source array (`agents[i]` ↔ `activeRecordExists_arr[i]`). This makes the subsequent indexed loop self-documenting.

### Store full objects in collections — extract fields at use time

When storing items in a map or array, store the full object, not a pre-extracted field. Let the consumer decide which field it needs. Pre-stripping a field throws away information and locks in the consumer's needs at write time.

```js
// BAD — pre-strips .name; the consumer can no longer access any other field
enabledAgents.push(agent.name);

// later:
const agentName = enabledAgents[randomIndex]; // looks like a name, but what if we later need agent.getJobType()?

// GOOD — store the full agent; extract .name at the point of use
enabledAgents.push(agent);

// later:
const agentName = enabledAgents[randomIndex].name; // clear: this is a name, extracted from an agent
```

This applies to maps, arrays, and any other collection. The rule of thumb: if you are calling `.someField` before pushing, stop and ask whether the consumer might ever need a different field.

## Indentation & Spacing

- **4 spaces** per indent level (no tabs).
- One blank line between methods inside a class.
- Opening brace `{` on the same line as the statement (K&R style).
- In a class body, there is a blank line after the opening `{` and typically a blank line before the closing `}`.

### Blank lines within a method body

Blank lines inside a method act as paragraph breaks — they tell the reader "one thought ended and another began." Follow these rules:

- **After the guard-clause block**: one blank line separates the precondition checks from the main body.
- **Between distinct logical phases**: one blank line separates each phase, mirroring the `// If we get here` comments or section-comment dividers.
- **Never within a single step**: do not add blank lines in the middle of a tightly coupled sequence (e.g., fetching a value and immediately guarding on it).

```js
static async processItem(itemId) {
    if (!itemId) {
        return;
    }

    // If we get here, itemId exists.

    const item = await this.fetchItem(itemId);
    if (!item) {
        return;
    }

    // If we get here, item was found.

    const result = this.calcResult(item);
    await this.saveResult(result);
}
```

The trigger for a blank line is a change of logical phase, not the presence of guards. A method with no guards but multiple distinct phases still gets paragraph breaks:

```js
static async fetchNewContentProcessingJobs() {
    const agents = this.getAgents();

    const jobPromises = agents.map(agent => this._constructJobs(agent));
    const jobArrays = await Promise.all(jobPromises);

    let jobs = [];
    for (let agentJobs of jobArrays) {
        jobs = jobs.concat(agentJobs);
    }
    return jobs;
}
```

A method with no guards and a single continuous body (one unbroken chain of tightly coupled steps) needs no internal blank lines.

### Multi-line argument lists

When a function call or definition has many parameters and would exceed a comfortable line length, break to one argument per line, indented 4 spaces from the opening line. The closing `)` sits on its own line at the base indent level:

**Don't do this:**
```js
const result = await this.processSubmission(studentId, courseId, taskId, submissionData, options);
```

**Do this:**
```js
const result = await this.processSubmission(
    studentId,
    courseId,
    taskId,
    submissionData,
    options,
);
```

The same formatting applies to method definitions with many parameters:

```js
static async processSubmission(
    studentId,
    courseId,
    taskId,
    submissionData,
) {
    // ...
}
```

When the arguments fit comfortably on one line, keep them on one line. Only expand when the line becomes hard to read.

## Quotes

- Both single and double quotes are acceptable; double quotes are slightly more common in `require()` calls but consistency within a file is preferred over switching styles.

## Semicolons

- Semicolons at the end of every statement.

## Template Literals

Use template literals (backtick strings) for any string that embeds a variable or expression. Do not concatenate with `+` when interpolation is possible.

**Don't do this:**
```js
logger.info('Processing item ' + item.id + ' for student ' + studentId);
throw new Error('Invalid status: ' + status + ' for item ' + item.id);
```

**Do this:**
```js
logger.info(`Processing item ${item.id} for student ${studentId}`);
throw new Error(`Invalid status: ${status} for item ${item.id}`);
```

Plain string literals without any interpolation can use single or double quotes as normal. Template literals are for interpolation, not a wholesale replacement for quoted strings.

## Comments

### Block comments for class/file-level documentation

Use `/* ... */` at the top of the class body to document subclass contracts, usage examples, and return-value shapes:

```js
class XpAwardCalculator {

    /*
    USAGE
    const result = await XpAwardCalculator.calcPoints(task);

    Returns { pointsAwarded: int, ... }
    */
```

### Inline line comments

Use `//` for inline explanations. Comments explain *why*, not *what*. Never write comments that merely restate what the code does.

### Comment placement

Place comments on their own line, directly above the code they describe:

```js
// We use gravity rank here because direct score comparison breaks for
// topics with different maximum point values.
const rank = this.getGravityRankFromUid(topic.uid);
```

Inline end-of-line comments are acceptable only for a very short qualifier — a few words that directly annotate a specific value or decision on that line:

```js
return TopicCheckEvaluator; // the class itself, not an instance
```

If the annotation takes more than one short clause, put it on its own line above instead. Never write a multi-sentence explanation at the end of a line of code.

### Section dividers inside a class

A class body is divided into standard top-level sections in this order:

1. **Main public methods** — no divider; these sit directly after the opening `{` (or after the top-of-class block comment). This is the primary interface.
2. **INITIALIZATION** — marked with the dash-style major divider.
3. **HELPERS** — marked with the slash-style divider.

The dash-style divider is used for `INITIALIZATION` only:

```js
    // -------------------------------------------------------
    //
    //                    INITIALIZATION
    //
    // -------------------------------------------------------
```

The slash-style divider is used for `HELPERS` and any other named groupings:

```js
    ///////////////////////////////////////
    // HELPERS

    static helper1() { ... }
```

If a class is small enough that a section has only one or two methods and the grouping is obvious, you may omit the divider for that section rather than adding ceremony for its own sake. The dividers exist to help readers navigate — use them when they aid navigation.

Within a method body, labeled phases use a simple all-caps `//` comment with no decorators (see Labeled Steps Within a Long Method).

### Execution-flow narration

After a series of guard clauses, use `// If we get here, ...` comments to explain what is still true at that point in the function:

```js
    if (!takingFinal) {
        return instructionProgress;
    }

    // If we get here, student is taking final.

    if (instructionProgress < 1) {
        // ...
    }
```

### Disabled / debugging code

Leave disabled `console.log` and debugging code as comments rather than deleting, when it may be useful to re-enable:

```js
    // console.log(`${yyyymmdd} | Task ${task.id} ...`);
```

Feature flags for debugging are module-level booleans:

```js
const BACKFILL_REASONS = false;
```

## Avoiding Nesting: Guard Clauses and Early Returns

The most important structural rule is **keep the main logic at the outermost indent level**. Achieve this by returning (or throwing) as soon as a precondition fails, instead of wrapping the rest of the function in an `if` block.

**Don't do this:**
```js
if (condition) {
    // ... main body ...
    // ... many lines deep ...
}
```

**Do this:**
```js
if (!condition) {
    return;
}

// ... main body at the top level ...
```

When a function has multiple guard clauses, each one peels off a case and the remaining code can assume all guards passed. Pair each guard with a `// If we get here, ...` comment to say what is now known:

```js
if (!takingFinal) {
    return instructionProgress;
}

// If we get here, student is taking final.

if (instructionProgress < 1) {
    return COMPLETED_INSTRUCTION * instructionProgress;
}

// If we get here, student has completed course instruction.

const completedFinalReview = this.checkIfCompletedCourseInstructionAndReviewForFinal();
if (!completedFinalReview) {
    return COMPLETED_INSTRUCTION;
}

// If we get here, student has completed final review.
```

Each `// If we get here` comment is a free summary of the preconditions that every remaining line can rely on.

Once you've written `// If we get here, X is true`, do not then write `if (X) { ... }` — the comment already established that X is true. Trust the comment and write the body at the top level.

## Never Use `else` After a Returning Branch

Once a branch ends with `return` or `throw`, an `else` is wrong — the reader already knows the remaining code only runs when the condition was false. Writing `else` anyway adds noise and makes the code look uncertain about its own logic.

**Don't do this:**
```js
if (!item) {
    return;
} else {
    this.process(item);
}
```

**Do this:**
```js
if (!item) {
    return;
}

this.process(item);
```

This applies even when both branches return a value:

**Don't do this:**
```js
if (isCompleted) {
    return this.calcFinalScore();
} else {
    return this.calcPartialScore();
}
```

**Do this:**
```js
if (isCompleted) {
    return this.calcFinalScore();
}

return this.calcPartialScore();
```

`else` is only valid when **neither branch returns or throws** — a true binary decision where both sides continue execution:

```js
if (isActive) {
    this.activate();
} else {
    this.deactivate();
}
```

Even then, ask whether a guard clause and a single unconditional call would be cleaner.

## Named Intermediate Variables

Never embed a complex sub-expression directly inside a larger expression. Pull it out, give it a descriptive name, and let the name do the explaining.

**Don't do this:**
```js
if (streamTask.checkIfLesson() && !streamTask.passed) {
    // ...
}
```

**Do this:**
```js
const isFailedLesson = (streamTask.checkIfLesson() && !streamTask.passed);
if (!isFailedLesson) {
    return;
}
```

**Don't do this:**
```js
return this.calcProgressOfNextExam() - this.graph.calcCourseInstructionProgress();
```

**Do this:**
```js
const currentProgress = this.graph.calcCourseInstructionProgress();
const examProgress = this.calcProgressOfNextExam();
const remainingProgress = examProgress - currentProgress;
return remainingProgress;
```

The rule of thumb: if you have to think for even a moment about what a sub-expression means, it needs a name. Variable names like `madeForwardProgressFromPrevToCur`, `isFailedLesson`, `prevLessonIsFailed` are full sentences that make the `if` statement that follows trivially readable.

This applies directly to compound `if` conditions. Any condition that combines two or more checks with `&&` or `||` should be extracted to a named boolean first:

**Don't do this:**
```js
if (task.type == 'assessment' && !task.completed && task.dueDate < today) {
    // ...
}
```

**Do this:**
```js
const isAssessment = (task.type == 'assessment');
const isIncomplete = !task.completed;
const isPastDue = (task.dueDate < today);
const isOverdueAssessment = (isAssessment && isIncomplete && isPastDue);
if (!isOverdueAssessment) {
    return;
}
```

There are two exceptions where a compound `if` condition may stay inline without a named boolean:

**1. Parameter validation guards** — checking that several required values are present. The surrounding `throw` makes the intent obvious:

```js
if (!topicId || !courseId || !promptFolder) {
    throw new Error(`...`);
}
```

**2. Existence guards combined with a single logical check** — when the leading `&&` operands are null checks (ensuring the objects exist) and the final operand is the actual boolean test, and the whole condition reads naturally from the names, extract is not required:

```js
// OK — the && operands are existence guards; the meaning is clear inline
if (kprNode && topicNode && kprNode.checkIfRedundantPrereqOf(topicNode)) {
    continue;
}
```

In any other case where the condition mixes domain logic across multiple subexpressions, extract each subexpression to a named boolean first.

When computing a lookup key for an object inside a loop, assign it as a property on the object rather than a throwaway local. A property survives the loop — it is inspectable on the object in the debugger and follows it wherever it goes. A local variable evaporates the moment the loop advances.

**Don't do this:**
```js
for (let row of result.rows) {
    const jobRecord = row.agentJob;
    const key = `${jobRecord.contentType}-${jobRecord.contentId}-${jobRecord.jobType}`;
    recordsByHash[key] = jobRecord;
}
```

**Do this:**
```js
for (let row of result.rows) {
    const jobRecord = row.agentJob;
    jobRecord.hash = `${jobRecord.contentType}-${jobRecord.contentId}-${jobRecord.jobType}`;
    recordsByHash[jobRecord.hash] = jobRecord;
}
```

Wrap boolean comparisons in parentheses to make the return value explicit:
```js
return (remainingProgress <= 0 && finishedReview);
```

Exception: when a function's only job is to evaluate and return a single logical expression, and the function name already says what the result means, a named intermediate is not required. The function name is the documentation:

```js
// GOOD — the function name already says what this returns; the expression IS the result
checkIfComplete() {
    return (remainingProgress <= 0 && finishedReview);
}
```

This exception applies only when the entire function body is that single `return` statement. If there is any other logic above the return, extract the boolean.

### Before/after snapshots use `_before` / `_after` suffixes

When a function captures a value before a mutation and then compares it afterward, name the two snapshots with `_before` and `_after` suffixes. This makes the comparison self-documenting without needing a separate intermediate boolean.

**Don't do this:**
```js
const numBefore = group.numQuestionsToGenerate;
// ... mutation ...
const madeProgress = (group.numQuestionsToGenerate < numBefore);
if (!madeProgress) {
    // ...
}
```

**Do this:**
```js
const numQuestionsRemaining_before = group.numQuestionsToGenerate;
// ... mutation ...
const numQuestionsRemaining_after = group.numQuestionsToGenerate;

const stuck = (numQuestionsRemaining_after >= numQuestionsRemaining_before);
if (stuck) {
    // ...
}
```

Also note: name the boolean to describe the bad state directly (`stuck`) rather than the negation of a good state (`!madeProgress`). The `if` condition then reads as a plain statement of what went wrong.

### Helpers that own a mutation should snapshot before-state themselves

If a helper function is responsible for performing a mutation (insert, update, refresh), it should capture the before-state at its own top rather than accepting it as a parameter. This keeps the caller clean and makes the helper fully self-contained.

**Don't do this:**
```js
// caller snapshots before and passes it in
const numBefore = group.numQuestionsToGenerate;
await this._update(group, response, numBefore);
```

**Do this:**
```js
// helper captures its own before-state
static async _update(group, response) {
    const numQuestionsRemaining_before = group.numQuestionsToGenerate;
    // ... mutation ...
    const numQuestionsRemaining_after = group.numQuestionsToGenerate;
}
```

## One Thing Per Line

Each line should express exactly one idea. Never chain calls or stack conditions just because you can.

**Don't do this:**
```js
const tasks = this.student.getPriorityTopicRecordGroups().filter(g => g.length > 0).map(g => g[0]);
```

**Do this:**
```js
const groups = this.student.getPriorityTopicRecordGroups();
const nonEmptyGroups = groups.filter(g => g.length > 0);
const tasks = nonEmptyGroups.map(g => g[0]);
```

This applies to all method chains without exception — `.map().filter()`, fluent builder APIs, everything. If a `.` appears after a closing `)`, the expression almost certainly needs a named intermediate variable before it.

## Ternary Operators

Ternary expressions are allowed only for simple single-line assignments where both branches are plain values — never nested, never inside a larger expression, never in a `return` statement, and never when either branch requires a function call or computation.

**Don't do this:**
```js
return isCompleted ? this.calcFinalScore() : this.calcPartialScore();

const ratio = total > 0 ? (passed / total) : 0;
```

**Do this:**
```js
if (isCompleted) {
    return this.calcFinalScore();
}
return this.calcPartialScore();

let ratio = 0;
if (total > 0) {
    ratio = passed / total;
}
```

A plain value assignment is the one case where a ternary earns its keep:

```js
const label = isActive ? 'Active' : 'Inactive';
```

When in doubt, use `if`/`else`.

## Arrow Functions

Arrow functions are acceptable only as short, single-expression callbacks passed directly to `.map()` or `.filter()`, where the expression extracts or tests a single value:

```js
const ids = items.map(item => item.id);
const active = items.filter(item => item.active);
```

Do **not** use `.map()` with an arrow function to construct new objects with multiple properties. Use a `for...of` loop with explicit `push` instead — it is easier to read and debug:

**Don't do this:**
```js
const edges = items.map(item => ({
    parentId: item.prereq.id,
    parentName: item.prereq.name,
    childId: item.topic.id,
    childName: item.topic.name,
}));
```

**Do this:**
```js
const edges = [];
for (let item of items) {
    edges.push({
        parentId: item.prereq.id,
        parentName: item.prereq.name,
        childId: item.topic.id,
        childName: item.topic.name,
    });
}
```

Do **not** use arrow functions with a block body (`=> { ... }`). Any callback complex enough to need a block body should be extracted as a named method instead.

Do **not** use arrow functions as method or function definitions:

**Don't do this:**
```js
static getLabel = () => { ... }
const process = (item) => { ... };
```

**Do this:**
```js
static getLabel() { ... }
static process(item) { ... }
```

## Iteration

- Use `for...of` for all iteration over arrays and iterables. Never use `.forEach()`.
- Use `.map()` and `.filter()` only when they produce a distinct result assigned to a named intermediate variable. The result of a `.map()` or `.filter()` call is always a meaningful value that deserves a name — it is never just a stepping stone to another chained call.
- Use an index-based `for` loop (`for (let i = 0; ...)`) only when the index itself is semantically meaningful (e.g., iterating a fixed-size window, building indexed parameters). Do not use it as a substitute for `for...of`.

**Don't do this:**
```js
items.forEach(item => this.process(item));
```

**Do this:**
```js
for (let item of items) {
    this.process(item);
}
```

**Don't do this:**
```js
const ids = items.filter(item => item.active).map(item => item.id);
```

**Do this:**
```js
const activeItems = items.filter(item => item.active);
const ids = activeItems.map(item => item.id);
```

- Never use `.reduce()`. An accumulation is always clearer as a `for...of` loop with a named accumulator:

**Don't do this:**
```js
const total = items.reduce((sum, item) => sum + item.points, 0);
```

**Do this:**
```js
let total = 0;
for (let item of items) {
    total += item.points;
}
```

- Never use `for...in`. Use `for...of Object.keys()` when you need to iterate the keys of a plain object:

```js
// Don't do this
for (let key in params) {
    // ...
}

// Do this
for (let key of Object.keys(params)) {
    const value = params[key];
    // ...
}
```

## Decomposing Long Methods into Named Steps

When a method performs several sequential phases, either:

1. **Extract each phase into its own named method** and call them in order from the parent method — the parent then reads like a table of contents:

```js
static async processRawPoints(rawPoints, streamTask, assignmentTasks) {
    const points = this.fillPointsResultTemplateWithRawPoints(rawPoints);

    this.labelPenaltyReasons(points, streamTask, assignmentTasks);
    await this.labelPlateauPointsAwardedAndSuspendAccount(points, streamTask);

    this.validatePoints(points, streamTask.id);
    return points;
}
```

2. **Label the phases with section comments** when they're best kept inline:

```js
////////////////////////////////////////
// REPAIRS

const assessmentRepairs = this.selectAssessmentRepairTasks();
if (this.selectedTasks.length > 0) {
    return this.selectedTasks;
}

////////////////////////////////////////
// MALIGNANT HOLES

const malignantHoleTasks = this.selectMalignantHoleInstructionTasks();

////////////////////////////////////////
// NORMAL TASKS
```

The choice between extracting a method versus using a section comment is based on reuse and complexity. Extract when the phase is reusable or complex enough to warrant its own unit. Use a section comment when the logic is tightly coupled to the parent's local state.

### Mutable result objects

A common decomposition pattern is the **result object**: a plain object created at the start of an operation and passed through a chain of helper methods that progressively fill in its fields. The orchestrating method reads like a table of contents; the helpers do the work.

```js
static async processPoints(rawPoints, streamTask) {
    const points = this.buildPointsTemplate();

    this.labelPenaltyReasons(points, streamTask);
    await this.applyPlateau(points, streamTask);

    this.validatePoints(points);
    return points;
}
```

Each helper mutates `points` directly rather than returning a new value. This avoids threading return values through several layers and keeps the orchestrator's intent visible at a glance. Use this pattern when a method would otherwise need to pass a growing number of computed values between steps.

## Object Literals for Parallel Data

When an object literal has many entries that are logically parallel (e.g., a result template or config block), use blank lines to separate logical sub-groups. Do **not** pad keys with extra spaces to align the values — use natural spacing:

```js
return {
    pointsAwarded: null,
    rawPointsAwarded: null,
    pointsAdjustmentReason: null,

    speedPointsAwarded: null,

    plateau: false,
    plateauAfterRemediation: false,
    remediationTasks: [],

    suspendAccount: false,
    suspendAccountReasons: {
        tooManyPenalties: false,
        tooManySeverePenalties: false,
        tooMuchNegativeXp: false
    },
};
```

Blank lines within the object separate logical sub-groups. Do not add extra whitespace to align colons or values across lines.

## Parallel Structure for Parallel Logic

When a set of operations are structurally identical (same shape, different subject), make them look identical:

```js
const assessmentRepairs = this.selectAssessmentRepairTasks();
const lessonRepairs = this.selectLessonRepairTasks();
const multistepRepairs = this.selectMultistepRepairTasks();
```

```js
if (this.belowLimit()) {
    const reviews = this.selectRequiredReviews();
}
if (this.belowLimit()) {
    const multisteps = this.selectMultistepTasks();
}
if (this.belowLimit()) {
    const instruction = this.selectInstructionTasks();
}
```

If the pattern is genuinely parallel, the code should look it — same structure, same indentation, same level of detail, no exceptions.

## Naming That Describes Meaning, Not Mechanics

Variable names should answer "what does this represent?" not "what type is this?":

| Mechanical (avoid) | Meaning-based (prefer) |
|---|---|
| `result` | `unrepairedAssessmentAnswers` |
| `flag` | `isFailedLesson` |
| `diff` | `madeForwardProgressFromPrevToCur` |
| `prevTask` | `prevLessonTask` |
| `n` | `numRequiredMultistepsBehind` |
| `val` | `remainingProgress` |
| `existingKeys` | `recordsByHash` |

For booleans, the name should read naturally in an `if` statement: `if (madeForwardProgressFromPrevToCur)` reads like a sentence. `if (diff)` does not.

For lookup maps, the name should describe both what's stored and how it's keyed: `recordsByHash`, `jobsByContentId`, `agentsByName`. A name like `existingKeys` only says it's a set of keys — it says nothing about what those keys point to.

### Compound key variables must name their components

When a variable holds a compound string key built from multiple fields, its name must say what those fields are — not just that it is "a key":

```js
// BAD — "typeKey" says it's a key, but a key for what? Built from what?
const typeKey = `${contentType}-${jobType}`;

// GOOD — the name says exactly what the two components are
const contentTypeJobType = `${contentType}-${jobType}`;
```

The same rule applies to the maps that use these keys. `enabledAgentsByContentTypeJobType` tells you immediately what the key is and what the values are. `agentMap` or `agentsByKey` tells you nothing.

## Labeled Steps Within a Long Method

When a long method handles a sequence of distinct cases (e.g., several adjustment types), label each case with a short all-caps comment that acts as a subheading:

```js
// FUZZY FAIL

if (points.pointsAwarded == 0 && ...) {
    points.pointsAwarded = streamTask.calcFuzzyFailPointsAwarded();
    if (points.pointsAwarded > 0) {
        points.pointsAdjustmentReason = 'fuzzyFail';
        return;
    }
}

// ACCOMODATION

if (points.pointsAwarded < 0) {
    const allowNegativeXp = await this.checkIfNegativeXpAllowed(streamTask.id);
    if (!allowNegativeXp) {
        // ...
        return;
    }
}

// HONEYMOON

if (points.pointsAwarded < 0) {
    // ...
}
```

Each label announces the next section and lets the reader skip to what they care about. Each section ends by returning if it handled the case, so the reader knows that reaching the next label means the previous case was not triggered.

## Control Flow

- **Guard clauses first**: check preconditions at the top of a function and return/throw early rather than deeply nesting logic. Prefer an early-returning guard over wrapping the main body in a positive `if` block.
- Never use `switch` statements. Use `if`/`else if` chains with labeled-step section comments instead — the section-comment pattern is more readable and consistent with the rest of the codebase.
- **Always expand `if` statements to multiple lines.** Never put the body on the same line as the condition. No exceptions.

**Don't do this:**
```js
if (!item) { return; }
if (this.belowLimit()) { this.selectTasks(); }
```

**Do this:**
```js
if (!item) {
    return;
}

if (this.belowLimit()) {
    this.selectTasks();
}
```

## Short-Circuit Evaluation

Do not use `&&` as a hidden `if` statement, and do not use `||` as a default-value operator. Both hide logic that should be explicit.

**Don't do this:**
```js
isReady && this.process();
const name = user.name || 'Anonymous';
```

**Do this:**
```js
if (isReady) {
    this.process();
}

let name = user.name;
if (!user.name) {
    name = 'Anonymous';
}
```

The `||` operator is especially dangerous because it triggers on any falsy value (`0`, `''`, `false`), not just absent values — the same silent correctness bug the section below warns against.

The one permitted exception is `|| []` (and `|| {}`) when defaulting an absent collection to an empty one. An empty array or object is never a meaningful value that could be accidentally swallowed, so the falsy-value trap does not apply:

```js
const items = someHash[key] || [];
```

## Null and Falsy Checks

### `==` vs `===`

Use `==` and `!=` by default. JavaScript's loose equality is permissive enough for most comparisons and avoids unnecessary noise.

Use strict `===` or `!==` only when you specifically need to distinguish `null` from `undefined` — for example, when `null` means "explicitly cleared" and `undefined` means "was never set," and those two states must be handled differently:

```js
// Fine — == works correctly here
if (item.status == 'Active') {
    // ...
}
if (count != 0) {
    // ...
}

// Use === only when the null/undefined distinction matters

// means: result was explicitly set to null
if (result === null) {
    // ...
}
// means: result was never assigned
if (result === undefined) {
    // ...
}
```

### Never use `!arr.length` to check for an empty array

Always use `arr.length == 0`. The `!arr.length` form is falsy-checking a number, which is both less explicit and inconsistent with how every other length check reads.

```js
// BAD
if (!jobs.length) {
    return [];
}

// GOOD
if (jobs.length == 0) {
    return [];
}
```

This applies everywhere — guard clauses, loop conditions, inline checks. `length == 0` says exactly what it means.

### Falsy vs strict null checks

Use a falsy guard (`if (!x)`) for values that are genuinely optional — when `null`, `undefined`, and an empty string are all equally "not present":

```js
const item = await this.fetchNext();
if (!item) {
    return;
}
```

Use strict `=== null` (or `!== null`) when `0`, `false`, or `''` are valid values that must be preserved. Using a falsy guard on a value that can legitimately be `0` is a silent correctness bug:

```js
// BAD: silently skips the branch when pointsAwarded is 0
if (!points.pointsAwarded) {
    // ...
}

// GOOD: only skips when genuinely absent
if (points.pointsAwarded === null) {
    // ...
}
```

When in doubt, ask: "Is `0` a meaningful value here?" If yes, use strict equality.

### MySQL tinyint(1) boolean columns

MySQL boolean columns (stored as `tinyint(1)`) arrive in JavaScript as `1` or `0`. Treat them as plain truthy/falsy values — do not compare against `1` explicitly:

```js
// BAD — unnecessarily explicit comparison
const isLiveTopic = (question.topic.live == 1);

// GOOD — 1 is truthy, 0 is falsy; the direct assignment reads naturally
const isLiveTopic = question.topic.live;
```

## Type Checks

Use `typeof` to branch on the primitive type of a value that can legitimately arrive in multiple forms:

```js
if (typeof prompt == 'string') {
    // single string prompt
} else if (typeof prompt == 'object') {
    // array of message objects
}
```

Use `instanceof ClassName` to branch on which subclass a node or object belongs to:

```js
if (node instanceof Topic) {
    // topic-specific logic
} else if (node instanceof MultistepType) {
    // multistep-specific logic
}
```

Do not use either as a substitute for a null check. For values that may simply be absent, use the normal falsy or strict null guards described above.

## Error Handling

- Always throw `new Error(descriptiveMessage)`.
- Include contextual data in the message using template literals: `` `Invalid value: ${val}` ``.
- In `catch` blocks, re-throw with `throw new Error(error)` after logging/reporting the error to Slack.
- Use `Utils.postErrorToSlack(error, context)` to report errors to Slack before re-throwing.

### Throw vs. return null

Return `null` (or `[]`) for **expected empty cases** — situations the caller should anticipate, like a queue that may simply have nothing in it:

```js
static async fetchNext() {
    const rows = await db.execute(...);
    if (rows.length == 0) {
        return null; // nothing queued; caller handles this
    }
    return rows[0];
}
```

Throw for **true error conditions** — data that should exist but doesn't, invalid inputs, violated invariants. Don't use `return null` as a silent failure for things the caller cannot meaningfully recover from.

When a method performs a side effect and has no result to return, end the method with no return statement at all. A bare `return;` is reserved for early exits (guard clauses) in the middle of a method — at the very end of a method it is just noise:

```js
// Don't do this:
async saveResult(result) {
    await db.execute(`INSERT INTO results ...`, result);
    return; // unnecessary at end of method
}

// Do this:
async saveResult(result) {
    await db.execute(`INSERT INTO results ...`, result);
}
```

### Multi-param validation errors

When validating multiple constructor or method parameters, use a multiline template literal so every value is visible at once in the error output:

```js
if (!topicId || !courseId || !promptFolder) {
    throw new Error(`
Invalid params:
    topicId      = ${topicId}
    courseId     = ${courseId}
    promptFolder = ${promptFolder}
    `);
}
```

### Where try/catch belongs

`try/catch` belongs at **boundary layers only** — not scattered through domain logic. The three valid placements are:

**1. Worker/processor boundary** — wraps the top-level job handler so one bad job cannot crash the worker. The catch block calls `Alerter.privateError()` and swallows the error:

```js
async processTask(task) {
    try {
        await this._processTask(task);
    } catch (error) {
        Alerter.privateError(error, `Processing task ${task.id}`);
        // swallow: one bad task should not crash the worker
    }
}
```

**2. External API / LLM boundary** — wraps a retry loop. The catch block reports each failed attempt; after exhausting retries, the error propagates:

```js
const MAX_ATTEMPTS = 3;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
        await this._callLlm(item);
        return;
    } catch (error) {
        Utils.postErrorToSlack(error, `Attempt ${attempt} failed for item ${item.id}`);
    }
}
throw new Error(`All ${MAX_ATTEMPTS} attempts failed for item ${item.id}`);
```

**3. Defensive optional operations** — wraps a non-critical side effect (e.g., writing a backup file) where failure must not abort the main flow. The catch block calls `Alerter.privateError()` and swallows.

Inner domain logic — calculators, models, selectors — never catches errors. If something goes wrong inside, it throws and lets the boundary layer decide what to do.

## Async / Await

- Use `async`/`await` throughout. No raw `.then()` chains.
- Wrap callback-based APIs (e.g., `request`, `mysql`) in `new Promise((resolve, reject) => { ... })` helpers. The wrapper itself does not need to be `async` — it returns a `Promise` directly, and callers `await` it as normal:

```js
static query(sql, params) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (error, rows) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(rows);
        });
    });
}
```

### Only use `async` when the method contains `await`

Do not declare a method `async` unless it actually uses `await`. An `async` label on a method that has no `await` wraps the return value in a Promise unnecessarily and misleads the reader into thinking the method does async work.

**Don't do this:**
```js
async getLabel() {
    return this.label;
}
```

**Do this:**
```js
getLabel() {
    return this.label;
}
```

### Parallel async operations

When multiple async operations are independent of each other, run them in parallel with `Promise.all` rather than awaiting them sequentially:

**Don't do this (sequential when parallel is possible):**
```js
const user = await fetchUser(userId);
const course = await fetchCourse(courseId);
```

**Do this:**
```js
const fetchResults = await Promise.all([
    fetchUser(userId),
    fetchCourse(courseId),
]);
const user = fetchResults[0];
const course = fetchResults[1];
```

Only await sequentially when a later operation depends on the result of an earlier one.

### `await` inside loops

`await` inside a `for...of` loop is correct when each iteration **depends on the result of the previous one**. It is a bug when iterations are independent — it turns parallel work into a serial queue, multiplying the total latency by the number of items.

**Don't do this when items are independent:**
```js
for (let item of items) {
    await this.processItem(item); // each item waits for the previous one to finish
}
```

**Do this:**
```js
const processingPromises = items.map(item => this.processItem(item));
await Promise.all(processingPromises);
```

Ask: "Does iteration N need the result of iteration N-1?" If no, use `Promise.all`.

## Logging

The codebase has distinct logging systems for different layers. Use the right one for the layer you are in:

- **Worker / app layer** (`app.js`, `base-worker.js`, top-level scripts): use the Winston `logger` instance — `logger.info(...)`, `logger.error(...)`.
- **Model layer**: use the `Logger` class — `Logger.narrate()`, `Logger.warn()`. These are gated by `GlobalMode` flags and produce no output unless the relevant flag is on. Do not substitute bare `console.log` calls here.
- **Calculator / algorithm classes**: accept a `log=false` parameter and gate any debug output behind it. Do not add unconditional `console.log` calls to these classes.
- **Stateful simulation / diagnostic classes**: expose a `this.log(text)` instance method gated by `this.shouldLog`.

Never add unconditional `console.log` calls in production code paths. If you add a log for debugging, either gate it behind the appropriate flag or leave it as a commented-out `// console.log(...)` per the disabled-code convention.

## SQL

- Write multi-line SQL in template literals.
- SQL keywords (`SELECT`, `FROM`, `WHERE`, `ORDER BY`, etc.) in uppercase.
- Use `[paramName]` placeholder syntax for bound parameters (matching the `db.execute(sql, params)` helper).
- Indent the SQL body 4 spaces within the template literal:
- **Never use table aliases or abbreviations.** Always reference tables by their full name — in `SELECT`, `JOIN`, `WHERE`, and everywhere else. If a query joins two instances of the same table and an alias is unavoidable, use a descriptive full-word alias (e.g. `courseSizes`), never a single letter or abbreviation (e.g. `ct`, `c`, `ct2`).

- **When a query joins the same table more than once, use `given` prefixes to distinguish input-tied rows from generic DB rows.** The instance that represents arbitrary records from the database keeps the plain table name (e.g. `courseModule`, `courseTopic`). The instance that is anchored to a specific input parameter — even indirectly — gets a `given` prefix while keeping the rest of the table name intact (e.g. `givenCourseTopic`, `givenCourseModule`, `givenCourseUnit`). The `given` chain propagates: if `givenCourseTopic` joins to a `courseModule` to find its parent, that module is `givenCourseModule`; the unit reached through that module is `givenCourseUnit`; and so on. Only when the query fans *out* from the given anchor to arbitrary records does the naming switch back to the plain table name.

  Never rename a table alias to something conceptually different from the original table name (e.g. `topicRow` for `courseTopic`, `topicsModule` for `courseModule`). The alias should always be recognisable as a `given`-prefixed variant of the real table name.

  A concrete example — building a unit outline for a given topic:

  ```sql
  -- givenCourseTopic, givenCourseModule, givenCourseUnit: anchored to the input topicId
  -- courseModule, courseTopic, topic: arbitrary records fanned out from the given unit
  FROM courseTopic givenCourseTopic
  INNER JOIN courseModule givenCourseModule ON givenCourseModule.id = givenCourseTopic.moduleId
  INNER JOIN courseUnit givenCourseUnit ON givenCourseUnit.id = givenCourseModule.unitId
  INNER JOIN courseModule ON
      courseModule.unitId = givenCourseUnit.id AND
      courseModule.courseId = [courseId]
  LEFT JOIN courseTopic ON
      courseTopic.moduleId = courseModule.id AND
      courseTopic.courseId = [courseId]
  LEFT JOIN topic ON topic.id = courseTopic.topicId
  WHERE
      givenCourseTopic.topicId = [topicId] AND
      givenCourseTopic.courseId = [courseId]
  ```

```js
const result = await db.execute(`
    SELECT
        item.id,
        item.status
    FROM item
    WHERE
        item.status = 'Submitted'
`, { someParam });
```

- Place `AND` and `OR` connectives at the **end** of the preceding line, never at the start of the next line:

```sql
-- BAD
WHERE
    item.status = 'Submitted'
    AND item.deleted = 0

-- GOOD
WHERE
    item.status = 'Submitted' AND
    item.deleted = 0
```

This applies equally inside `JOIN ... ON` clauses and anywhere else connectives appear across multiple lines.

- In single-table queries, do not prefix column names or the `WHERE` condition with the table name — it adds noise without aiding clarity:

```js
// BAD — table prefix is redundant when only one table is in the query
SELECT user.firstName FROM user WHERE user.id = [userId]

// GOOD
SELECT firstName FROM user WHERE id = [userId]
```

Only use `table.column` prefixes in multi-table queries (joins) where the prefix disambiguates which table a column belongs to.

### Blank lines between logical groups in a query

Use blank lines in a SQL query the same way you use them in code — to separate distinct logical phases. A blank line after the `SELECT` block, between the anchor join chain and the fan-out joins, or before the `WHERE` clause makes the query's structure immediately scannable. A reader should be able to see the query's shape without reading every condition.

```sql
SELECT
    givenCourseUnit.name,
    courseModule.id,
    courseModule.name,
    topic.name

FROM courseTopic givenCourseTopic
INNER JOIN courseModule givenCourseModule ON givenCourseModule.id = givenCourseTopic.moduleId
INNER JOIN courseUnit givenCourseUnit ON givenCourseUnit.id = givenCourseModule.unitId

INNER JOIN courseModule ON courseModule.unitId = givenCourseUnit.id
LEFT JOIN courseTopic ON courseTopic.moduleId = courseModule.id
LEFT JOIN topic ON topic.id = courseTopic.topicId

WHERE
    givenCourseTopic.topicId = [topicId] AND
    givenCourseTopic.courseId = [courseId]
```

### Don't add redundant JOIN conditions

Only include conditions in a `JOIN ... ON` clause that are genuinely needed to establish the relationship. If a column is already constrained by the join path — because the table being joined was reached through a chain that already pins the value — do not repeat it as an explicit condition.

**Example:** if `givenCourseUnit` was reached through `givenCourseModule`, which was reached through `givenCourseTopic` where `courseId = [courseId]`, then all `courseModule` rows with `unitId = givenCourseUnit.id` are already in that course. Adding `AND courseModule.courseId = [courseId]` is noise.

```sql
-- BAD — courseId is already implied by the given chain
INNER JOIN courseModule ON
    courseModule.unitId = givenCourseUnit.id AND
    courseModule.courseId = [courseId]

-- GOOD — the relationship is fully established by unitId alone
INNER JOIN courseModule ON courseModule.unitId = givenCourseUnit.id
```

### One item per line when a SQL clause has multiple items

This rule applies universally to every SQL clause — `SELECT`, `JOIN ... ON`, `WHERE`, `ORDER BY`, `GROUP BY`, and anything else. If a clause has a single item or condition, it can stay on one line. If it has more than one, each item goes on its own line indented below the keyword. Never put the first item on the keyword line and hang the rest below it.

```sql
-- BAD — multiple items crammed onto one line
SELECT courseUnit.name, courseModule.name, topic.name FROM ...
ORDER BY courseUnit.number, courseModule.number, courseTopic.number
INNER JOIN courseModule ON courseModule.unitId = courseUnit.id AND courseModule.courseId = [courseId]

-- GOOD — each item on its own line
SELECT
    courseUnit.name,
    courseModule.name,
    topic.name
FROM ...

ORDER BY
    courseUnit.number,
    courseModule.number,
    courseTopic.number

INNER JOIN courseModule ON
    courseModule.unitId = courseUnit.id AND
    courseModule.courseId = [courseId]
```

Single item stays on one line:

```sql
SELECT courseId FROM ...
ORDER BY number
INNER JOIN course ON course.id = courseTopic.courseId
```

### `WHERE` clause formatting

A `WHERE` clause follows the same rule — one line when there is a single condition, expanded when there are multiple. Never put the first condition on the `WHERE` line and hang subsequent conditions below it.

**Don't do this:**
```sql
WHERE started IS NULL
  AND completed IS NULL
```

**Do this (one-liner when it fits):**
```sql
WHERE started IS NULL AND completed IS NULL
```

**Do this (fully expanded when it doesn't):**
```sql
WHERE
    started IS NULL AND
    completed IS NULL
```

---

### Never return raw `result.rows` — always map to the table record

`db.execute` returns rows namespaced under their table name (e.g. `row.agentJob`, `row.topic`). Never return `result.rows` directly from a fetch method. Always map to the specific record the caller actually wants:

```js
// BAD — returns raw wrapper objects; callers must know to access row.agentJob
return result.rows;

// GOOD — returns the agentJob records themselves
return result.rows.map(row => row.agentJob);
```

The function name signals what is returned. A method named `fetchAgentJobRecordsNotStarted` should return agentJob records, not row wrappers. Only return raw rows if the method name explicitly says it returns rows (e.g. `fetchAgentJobRowsNotStarted`), and even then prefer to map first.

---

### Guard against empty `IN ()` lists

MySQL does not allow an empty `IN ()` list — it is a parse error. Any time you build an `IN` clause dynamically from an array, guard against the empty case before executing the query:

```js
// BAD — crashes with ER_PARSE_ERROR if items is empty
const ids = items.map(item => item.id);
const idList = ids.join(', ');
const result = await db.execute(`SELECT * FROM foo WHERE id IN (${idList})`);

// GOOD — return early so the query is never reached
if (!items.length) {
    return;
}

const ids = items.map(item => item.id);
const idList = ids.join(', ');
const result = await db.execute(`SELECT * FROM foo WHERE id IN (${idList})`);
```

This applies to all dynamically-built `IN` clauses: single-value lists, multi-tuple lists, etc.

## Static vs Instance Methods

- **Utility / service classes** with no mutable state use entirely `static` methods and are never instantiated (or instantiated only to share state across a call chain). These classes have **no constructor at all** — omit it entirely.
- **Stateful classes** (e.g., `Model`, `AssignmentSelector`) use instance methods and are constructed with a `constructor(params)`.
- When a stateful class has a constructor that is effectively empty (no assignments yet), add a `// pass` comment in its body.

A pure static utility class looks like this — no constructor, no instance methods:

```js
class MathUtils {

    static calcAverage(values) {
        // ...
    }

    static calcMedian(values) {
        // ...
    }

}

module.exports = MathUtils;
```

The absence of a constructor signals to the reader: this class has no state and is never instantiated.

### Inheritance

**Omit the constructor entirely if it does nothing.** If a subclass has no constructor logic — no property assignments, no validation, nothing — do not define a constructor at all. JavaScript automatically delegates to `super()`. An empty `constructor() { super(); }` is noise.

```js
// BAD — adds nothing; remove it
class QuestionCheckEvaluator extends ContentCheckEvaluator {
    constructor() {
        super();
    }
    // ...
}

// GOOD — no constructor needed; JS handles the delegation
class QuestionCheckEvaluator extends ContentCheckEvaluator {
    // ...
}
```

When subclassing, call `super(params)` first in the constructor, before setting any subclass-specific properties. The base class constructor sets up shared state; the subclass constructor then adds only what is unique to it:

```js
class TopicChecker extends BaseChecker {

    constructor(params) {
        super(params);
        this.topicId = params.topicId;
    }

}
```

JavaScript requires `super()` to be called before accessing `this` in a subclass constructor — always put it first.

Subclass methods that override a base class method should call `super.methodName()` when they need the base class behavior and extend it, not replace it wholesale. If the subclass is replacing the behavior entirely, it simply defines the method without calling `super`.

### Polymorphism via class references

When a base class needs to delegate to a class that subclasses will vary, override a method that *returns the class itself* — not an instance of it. The base class then calls static methods on the returned class reference:

```js
// In base class:
static async evaluate(item) {
    const EvaluatorClass = this.getEvaluator();
    return await EvaluatorClass.check(item.id);
}

// In subclass:
static getEvaluator() {
    return TopicCheckEvaluator; // the class itself, not new TopicCheckEvaluator()
}
```

This is the primary polymorphism mechanism in this codebase. Don't pass instances when you mean to pass behavior.

### The `constructor` / `initialize()` split

When a class needs async work before it can be used, split setup into two parts:

- **`constructor(params)`** — synchronous only. Assigns received parameters to `this` properties. Never queries the database, reads files, or calls any async function. Sets `this.isInitialized = false`.
- **`async initialize()`** — async setup. Fetches data, builds internal state, or performs any work that requires `await`. Must be idempotent: the first line guards against repeat calls.

Every public method calls `await this.initialize()` at its very top, before doing anything else. This makes initialization lazy and transparent to callers — they just call the method without having to think about setup.

```js
class Model {

    constructor(params) {
        this.courseId = params.courseId;
        this.isInitialized = false;
    }

    async selectTasks(numTasks) {
        await this.initialize();

        // ... rest of method
    }

    // -------------------------------------------------------
    //
    //                    INITIALIZATION
    //
    // -------------------------------------------------------

    async initialize() {
        if (this.checkIfInitialized()) {
            return;
        }

        await this.loadData();

        this.isInitialized = true;
    }

    checkIfInitialized() {
        return (this.isInitialized == true);
    }

}
```

The result: constructing the object is always cheap and synchronous. The first method call handles async setup automatically. No caller ever has to `await` a constructor or remember to call `initialize()` manually.

### Constructing an instance of the calling subclass from a static method

When a static method needs to instantiate "whichever subclass is currently executing," use `new this()`:

```js
static async run(itemId) {
    const instance = new this(); // constructs the calling subclass, not the base class
    await instance.initialize(itemId);
    return instance.execute();
}
```

Do not hardcode the subclass name in the base class. `new this()` is the correct way to enable polymorphic instance creation from a static context.

## Enumerated Types

Implement enums as plain classes with `static` string (or number) properties, one value per line:

```js
class AgentRole {
    static TOPIC_CHECKER = 'Topic Checker';
    static LESSON_CHECKER = 'Lesson Checker';
}

module.exports = AgentRole;
```

## Object Literals

- Use property shorthand when the key and variable name are the same: `{ x, index: i }`.
- Multi-line object literals for readability when there are 3+ properties.

## Destructuring

Do not use destructuring assignment. Assign properties one per line — it is easier to scan, easier to extend, and consistent with the parallel structure convention.

**Don't do this:**
```js
const { id, courseId, topicId } = item;
const [first, second] = results;
```

**Do this:**
```js
const id = item.id;
const courseId = item.courseId;
const topicId = item.topicId;

const first = results[0];
const second = results[1];
```

Note: **object construction** shorthand (`{ id, name }` when building an object to pass or return) is fine and encouraged — see Object Literals. The ban applies only to *extracting* values via destructuring on the left-hand side of an assignment.

## Spread Operator

The spread operator (`...`) is allowed in two specific cases:

**1. Spreading an array into a variadic function call** — most commonly `Math.min` and `Math.max`:

```js
const min = Math.min(...values);
const max = Math.max(...values);
```

**2. Appending one array to another** — use `concat`, not `splice`:

```js
// BAD
arr.splice(arr.length, 0, ...newItems);

// GOOD
arr = arr.concat(newItems);
```

`splice` with spread is reserved for inserting at a specific interior position. For simple appending, `concat` is clearer.

Do **not** use object spread (`{...obj}`) to copy or merge objects. Assign properties explicitly one per line — it is consistent with the destructuring ban and keeps each assignment visible and named.

**Don't do this:**
```js
const options = { ...defaults, timeout: 5000 };
```

**Do this:**
```js
const options = {};
options.retries = defaults.retries;
options.timeout = 5000;
```

## `Object.assign`

`Object.assign` is acceptable in one specific pattern: copying a database record's fields directly onto `this` in a model constructor, when the record's columns map 1:1 to instance properties:

```js
constructor(topicRecord) {
    Utils.validateKeyValuesExist(topicRecord, ['id']);
    Object.assign(this, topicRecord);
}
```

Outside this constructor-copy pattern, do not use `Object.assign`. Assign properties explicitly one per line.

## Default Parameters

Use default parameter values for optional boolean flags and optional arguments:

```js
static async calcPoints(rawInput, log=false) { ... }
```

## Named Booleans at the Call Site

When passing `true` or `false` to a method and the meaning isn't immediately obvious from the method's name, extract the argument into a named variable first:

**Don't do this:**
```js
this.processItem(item, true, false);
await this.build(versionNumber, true);
```

**Do this:**
```js
const shouldSkipValidation = true;
const shouldNotify = false;
this.processItem(item, shouldSkipValidation, shouldNotify);

const isForced = true;
await this.build(versionNumber, isForced);
```

The one exception: `log=false` is a well-established convention in this codebase for enabling debug output. Passing `true` as the last argument to enable logging (`calcPoints(task, true)`) is universally understood and does not need a named variable.

## Module-Level Constants

Declare module-level constants before the class definition, after the `require` block:

```js
const Utils = require('./utils');

const MAX_REPNUM = 10;
const BACKFILL_REASONS = false;

class MyClass { ... }
```

## Magic Values

Do not embed magic number or string literals directly inside method bodies. Pull them to a named module-level constant so the name explains what the value means:

**Don't do this:**
```js
if (numAttempts > 3) {
    // ...
}
if (daysSince > 1) {
    // ...
}
```

**Do this:**
```js
const MAX_ATTEMPTS = 3;
const REBUILD_INTERVAL_DAYS = 1;

// ...

if (numAttempts > MAX_ATTEMPTS) {
    // ...
}
if (daysSince > REBUILD_INTERVAL_DAYS) {
    // ...
}
```

The threshold for "magic" is: any literal whose meaning isn't immediately obvious from context, or any literal that might need to change as requirements evolve. A literal `0` used as an empty-check is not magic. A literal `3` used as a retry limit is.

---

## Simplicity

Prefer the simplest implementation that satisfies the actual requirements. Do not add infrastructure, abstraction layers, or generalization for hypothetical future cases that have not yet materialized.

**Extend the existing mechanism before adding a new one.** If an existing hook or method can be made to handle a new case with a small, backward-compatible change, do that. Only introduce a second mechanism when the first genuinely cannot handle the new case.

```js
// BAD — two separate loops to resolve placeholders, adding a new resolution pass
//       for dynamic values instead of putting them in the existing mechanism
augmentPromptReplacements(replacements) {
    for (let placeholder of Object.keys(this.getFilenamesByPlaceholder())) {
        // ... resolve static filenames ...
    }
    for (let key of Object.keys(replacements)) { // second pass for dynamic arrays
        // ... resolve arrays set by _getPromptReplacements ...
    }
}

// GOOD — one loop; dynamic values are resolved by the caller before they reach
//        augmentPromptReplacements (i.e., _getFormatSpecificRubric returns a string)
augmentPromptReplacements(replacements) {
    const filenamesByPlaceholder = this.getFilenamesByPlaceholder();

    for (let placeholder of Object.keys(filenamesByPlaceholder)) {
        let filenames = filenamesByPlaceholder[placeholder];
        if (!Array.isArray(filenames)) {
            filenames = [filenames]; // coalesce string into array
        }

        const fileContents = filenames.map(name => this.readPromptsFile(name));
        replacements[placeholder] = fileContents.join('\n\n');
    }
}
```

**Stop at the known cases.** Do not build frameworks that handle cases you cannot name concretely. When you find yourself writing "this makes it easy to add more X later," stop and ask whether you actually need to add more X.

**Don't extract a helper just to wrap parameters.** A helper method that requires the same parameters as the caller, does exactly what the caller would do inline, and is never reused elsewhere is not simplification — it is obfuscation. It forces the reader to jump to another function to see what is happening, and the extracted method name adds no information beyond what the inline code already says. Only extract a helper when it has a clearly distinct responsibility, is reused in more than one place, or is complex enough that naming it genuinely aids comprehension of the caller.

**Split on distinct sub-operations; keep together what flows as one thought.** The right test for extraction is not line count — it is whether a block of code has its own clearly nameable purpose and return value that is *separate* from the surrounding flow. Two cases pull in opposite directions:

- **Keep together** when code forms a single continuous flow: one query whose results are immediately processed in a loop to build one output. Splitting a fetch helper from its processing just makes the reader jump between functions to follow one unbroken thought. The query and the loop are the same thought.

- **Extract a helper** when a block performs a focused sub-operation with its own clear name and return value — especially a search/lookup that either returns something or throws. That pattern interrupts the parent's flow if left inline, but reads cleanly as a named call:

```js
// BAD — the search logic sits in the middle of _parseStems and clutters it
_parseStems(responseText, format) {
    const parsed = JSON.parse(responseText);
    let formatEntry = null;
    for (let entry of parsed.ranked_formats) {
        if (entry.format === format) {
            formatEntry = entry;
        }
    }
    if (!formatEntry) {
        throw new Error(`...`);
    }
    return formatEntry.proposed_stems.map(s => s.stem);
}

// GOOD — the lookup is its own function; _parseStems reads as a clean sequence of steps
_parseStems(responseText, format) {
    const parsed = JSON.parse(responseText);
    const formatEntry = this._findFormatEntry(parsed.ranked_formats, format);
    const proposedStems = formatEntry.proposed_stems;
    return proposedStems.map(proposedStem => proposedStem.stem);
}

_findFormatEntry(rankedFormats, format) {
    for (let entry of rankedFormats) {
        if (entry.format === format) {
            return entry;
        }
    }
    throw new Error(`No ranked_formats entry found for format ${format}`);
}
```

The signal to extract: the inline block has its own preconditions, its own return value, and can be named in a way that makes the caller read like a clean sequence of named steps. The signal to keep together: the code uses the same running state (a `lines` array, an accumulating object, a result set) throughout and has no natural seam to name.

**Fix the source, not the symptom.** When a bug is caused by missing normalization or missing data transformation upstream, fix the upstream gap. Do not add defensive handling inside lower-level utilities to compensate for callers that forgot to normalize — that spreads responsibility, adds complexity to reusable code, and obscures the real problem. The right place to fix a missing `unescapeLaTeX` call is the function that forgot to call it, not every parser that might encounter the un-normalized data.

**Simplicity trumps cleverness.** A straightforward override that reads and joins two files is better than a general resolution pipeline that converts arrays in `replacements` to strings on a second pass. The simpler solution is easier to read, debug, and change.

**When a child class needs a generalization of base class behavior, put it in the base class.** If a new case is a natural extension of what the base class already does — even if no other subclass currently uses it — add it to the base. Do not push logic down into a single subclass just because "most children don't need it." A base class that handles all reasonable variants of its own behavior is cleaner than a subclass that patches around a base that stopped short.

```js
// BAD — base class only handles PASS and FAIL; QuestionCheckEvaluator overrides
//       just to wedge in the third case it needs
_convertClassificationToEvaluation(classification, responseText) {
    // base: only PASS and FAIL
}

// in QuestionCheckEvaluator:
_convertClassificationToEvaluation(classification, responseText) {
    if (classification == CLASSIFICATION_PASS_WITH_REVISIONS) {
        return ContentCheck.PASSED_WITH_REVISIONS;
    }
    return super._convertClassificationToEvaluation(classification, responseText);
}

// GOOD — base class owns all three cases; no override needed in any subclass
_convertClassificationToEvaluation(classification, responseText) {
    if (classification == CLASSIFICATION_PASS) {
        return ContentCheck.PASSED;
    }
    if (classification == CLASSIFICATION_FAIL) {
        return ContentCheck.FAILED;
    }
    if (classification == CLASSIFICATION_PASS_WITH_REVISIONS) {
        return ContentCheck.PASSED_WITH_REVISIONS;
    }
    this.throwError(`...`);
}
```

**Don't collect into an intermediate array just to feed a single subsequent loop.** If a loop computes a list and the only thing that happens next is iterating that list once, skip the collection and act inline. An intermediate array is only justified if it is used in more than one place, passed to another function for a distinct purpose, or needed for a length check.

```js
// BAD — missingDprTopics is collected only to be looped immediately
const missingDprTopics = dprTopics.filter(t => !existingById[t.id]);
for (let t of missingDprTopics) {
    console.log(...);
}

// GOOD — inline guard, no intermediate
for (let dprTopic of dprTopics) {
    if (!existingById[dprTopic.id]) {
        console.log(...);
    }
}
```

**Data reshaping belongs in the service layer.** When a consuming class needs data from a service grouped or indexed by a field, add a `fetchAllXByY()` method to the service rather than a private grouping helper in the consumer. Services own their data's shape.

```js
// BAD — grouping helper lives in the consumer
static _groupKprsByTopicId(allKprs) { ... }

// GOOD — service exposes the grouped form directly
static async fetchAllKeyPrerequisitesByTopicId() { ... }
```

**Every parameter in a function signature must be used in the body.** Before finalising a method, verify that every parameter appears in the implementation. Unused parameters are a sign the signature was designed for an earlier version of the code.

---

## Never Nest Calls — Every Intermediate Value Gets a Name

Never nest a function call inside a subscript, another call, or a conditional. If a value is computed, it must be assigned to a named variable before it is used. This applies even when the nesting is short.

The reason is debuggability: a developer should be able to understand any line by hovering over variable names in their IDE. Nested calls force them to run functions manually in the console just to see what an intermediate value is.

```js
// BAD — contentPlaceholder is invisible during debugging
replacements[this.getContentPlaceholder()] = contentString;

// GOOD — hover over contentPlaceholder to see its value instantly
const contentPlaceholder = this.getContentPlaceholder();
replacements[contentPlaceholder] = contentString;
```

```js
// BAD — the index value and the function result are both hidden
return items[getActiveIndex()].name;

// GOOD
const activeIndex = getActiveIndex();
const activeItem = items[activeIndex];
return activeItem.name;
```

This rule applies everywhere: array subscripts, object keys, `if` conditions, function arguments, and return values. If it is computed, name it.

This includes chained subscript access on database results. Never chain `rows[0][''].field` on a single line:

```js
// BAD — the row object is invisible; can't hover to inspect it
return result.rows[0][''].count;

// GOOD — name the row first
const row = result.rows[0];
return row[''].count;
```

The one exception is a simple reroute — a function whose entire body is a single delegating call where all arguments are already named variables. In that case, returning the call directly is fine:

```js
// OK — single reroute, all arguments are named variables
static async checkForAvailablePlacementOrSupplemental(studentId, courseId) {
    const constraint = `AND type IN ('Placement', 'Supplemental')`;
    return await this.checkForAvailableTask(studentId, courseId, constraint);
}

// NOT OK — nested call hides an intermediate value; unravel it
getPromptTemplate() {
    return this.readPromptsFile(this.getPromptTemplateFilename()); // what did getPromptTemplateFilename() return?
}

// GOOD
getPromptTemplate() {
    const filename = this.getPromptTemplateFilename();
    return this.readPromptsFile(filename);
}

// NOT OK — there is real logic above the return; name the result
async buildPrompt(item) {
    const template = this.getPromptTemplate();
    const replacements = await this.getPromptReplacements(item);
    // ... validation ...
    const prompt = Utils.replaceKeysWithValues(template, replacements);
    return prompt;
}
```

---

## Keep Functions Small and Modular

When a function grows, decompose it into focused helpers. Never merge two functions into one on the grounds that they are always called together. The right response to two functions that always run in sequence is a thin orchestrating function that calls both — not collapsing them into one body.

```js
// BAD — getPromptReplacements logic merged into buildPrompt; neither can be tested or reused alone
async buildPrompt(item) {
    const template = this.getPromptTemplate();
    const contentString = await this.getContentString(item);
    const contentPlaceholder = this.getContentPlaceholder();
    replacements[contentPlaceholder] = contentString;
    // ... all the file-reading logic ...
    return Utils.replaceKeysWithValues(template, replacements);
}

// GOOD — orchestrator delegates to a focused helper
async buildPrompt(item) {
    const template = this.getPromptTemplate();
    const replacements = await this.getPromptReplacements(item);
    return Utils.replaceKeysWithValues(template, replacements);
}

async getPromptReplacements(item) {
    // focused: only builds the replacements object
}
```

Signs a function needs to be decomposed:
- It has more than one distinct responsibility
- Parts of it could be useful independently
- Reading it requires scanning more than ~15 lines to understand what it does
- Adding a comment like `// Step 1: ...` before a block of code inside it

A folder will be initialized with a context file, which describes the feature.

You will proceed through this workflow one step at a time, asking for confirmation before proceeding to the next step.

If you have any questions at any step, you will ask. You will ask questions when anything is unclear and you will not suggest or carry out any updates you are unsure about unless given an explicit OK from me.

You will not edit this file or the context file.

## Step 0: Confirm setup

You will be given a path to a feature specification folder within the feature/ folder.

The feature specification folder will be initialized with a context file which contains a description of the feature to be built along with any additional context that may be helpful.

## Step 1: Create commands.md

The provided context may not be enough information to fully specify the details of the feature to be built, or there may be additional information that would simply be helpful to have.

First, decide what information is missing or would meaningfully help. If the context file is fully sufficient without any additional data, say so and skip straight to Step 2.

Otherwise, create folders queries/ and scripts/ as needed.

### queries/

In queries/, create a file queries/1-selects.md and list any select queries that I should run against the database to provide you with more information.

List the queries in succession. Every line should start with "SELECT".

```
SELECT ...
SELECT ...
SELECT ...
```

That way, I can copy/paste them into my query runner and dump the entire output. Put these queries on one line each, consecutively, so that I can easily copy/paste them. Make sure the queries are valid, given the database schema in `ai/context/db-schema.md`. Consult `ai/context/db-schema.md` whenever you need to know table names, column names, or relationships — do not guess column names.

Create a file queries/1-results.md where I can paste the results.

If it turns out you need more queries afterwards, just create another round of files queries/{2-selects.md, 2-results.md}. We can do as many rounds as you need.

### scripts/

If you need information beyond just raw queries, then you can create a scripts/ folder and put scripts in there that you want me to run.

Each script should be given a clear name.

Again, if it turns out you need to create and have me run more scripts afterwards, just let me know. We can do as many rounds as you need.

### commands.md

Create a single file commands.md in the feature folder. This is a living file — you will add to it over the course of the session whenever you need me to run something.

It should be a list of commands that I can copy and paste into my terminal and run from the repo root folder, organized into labeled rounds:

```
# Dump — Round 1

node ai/tools/dump queries ai/workflows/feature/2026-04-01-my-feature/queries/1-selects.md > ai/workflows/feature/2026-04-01-my-feature/queries/1-results.md

# Dump — Round 2

node ai/tools/dump queries ai/workflows/feature/2026-04-01-my-feature/queries/2-selects.md > ai/workflows/feature/2026-04-01-my-feature/queries/2-results.md
node ai/workflows/feature/2026-04-01-my-feature/scripts/fetch-user-groups.js > ai/workflows/feature/2026-04-01-my-feature/scripts/fetch-user-groups-results.md
```

When you need a new round of commands, append the new section to commands.md. Do not create a separate file.

### Important

This step is just to initialize the data dump. We can continue augmenting the dump as needed. At any step downstream, we can revisit this step to run more queries and scripts.

## Step 2: Create 2-research.md

Before making any recommendations, read the relevant existing code. You need to understand the current architecture before you can plan how to extend it. If the context points at a particular area of the codebase, read it first. Do not plan against assumptions when you can read the facts.

Once you have read the relevant code, describe what needs to be done in 2-research.md.

Ask as many follow-up questions as you need to be confident that you have all the necessary context and architectural/implementation details to create a good and highly specific plan.

All code produced in this workflow must comply with the coding standards in `AGENTS.md`. Read `AGENTS.md` before writing any code if you are not already fully familiar with it.

## Step 3: Create 3-plan.md

Using 2-research.md, you will create a phased plan in 3-plan.md.

Each phase must leave the repo in a deployable state: the code compiles, existing functionality still works, and you could ship it if you had to — even if the new feature is not yet fully visible. A phase that breaks existing behavior or leaves orphaned references until the next phase completes is wrongly scoped, regardless of how small it is.

Each phase should be small enough that I can hold all the intended code updates in my own working memory without straining, but not so small that we're doing basically the same thing over and over.

### Database migrations

If a phase adds or modifies database columns, tables, or indexes, the plan must include an explicit migration step for that phase. Migrations must be backward-compatible: the old code must continue to work against the migrated schema until the new code is deployed. This means:

- Add columns as nullable (or with a default) rather than NOT NULL without a default.
- Do not rename or drop a column in the same phase that removes the code referencing the old name — deprecate first, remove in a later phase.
- If backfilling existing rows is required, write a one-time script and include it in the plan. Estimate row count and flag if it could lock the table.
- Never run a schema change and a data migration in the same transaction if the table is large.

## Step 4: Execute phases in 3-plan.md

We will proceed one phase at a time. I may ask you to elaborate further before implementation, sometimes even splitting the plan further.

### Splits

If I ask you to split the phase, then you will nest the splits: e.g., splitting phase 2 into phases 2.1 and 2.2 to be executed one at a time, or even splitting phase 2.1 into 2.1.1 and 2.1.2. There is no limit to the nesting depth, and should always execute one at a time.

### Refinements

If I ask you to edit or refine a phase, you WILL NOT edit earlier phases, but you WILL carry edits downstream into later phases as appropriate.

If the refinement is substantial, I may ask you to scope/plan it out in a new file scratch.md where we can hash it out until it's ready to insert back into the original 3-plan.md.

### Pre-Emptive Bugfixing

BEFORE building each phase, systematically check the code you are about to build on top of for bugs. This is mandatory — do not wait to be asked. If the foundation has bugs, the new code will inherit them and they will be harder to find later.

### Implementation

Once I have asked you to execute a phase, you will create an implementation plan using Cursor's native planning functionality, and then I will click the Build button.

### Mark Complete

Before marking a phase complete, verify the following checklist:
- The code compiles and the server starts without errors
- Existing functionality that the changed code touches still works
- The pre-emptive bugfix check was done before the phase started
- Every new POST endpoint has a corresponding request-processor implementation
- Any DB migration for this phase has been written and is backward-compatible

Only after all of the above are satisfied should you mark the phase `✓`.

When we finish executing a phase of the plan, you will update status annotations in 3-plan.md per the following conventions:

Every phase and step heading must carry a status prefix so the current state of the plan is visible at a glance.

| Prefix | Meaning |
|--------|---------|
| `✓` | Done — fully implemented |
| `⋯` | In progress — partially done or actively being worked |
| *(none)* | Pending — not yet started |

Apply the prefix directly before the heading text:

```md
## ✓ Phase 1 — Rename Legacy Files

## ⋯ Phase 2 — Refactor ContentCheckEvaluator

### ✓ Step 2.1 — Generalize augmentPromptReplacements

### ⋯ Step 2.2 — Refactor ContentCheckEvaluator

#### ⋯ Step 2.2.1 — Merge the two replacement streams

#### Step 2.2.2 — Create question-check-evaluator.js (pending 2.2.1)
```

Update annotations in the plan file as work progresses — do not wait until a whole phase is complete. Marking a Cursor todo as completed is not sufficient — the `✓` heading in 3-plan.md must also be updated.

### Request-Processor Parity

Any new POST endpoint or action added as part of this feature also needs a corresponding implementation in `/request-processors/`. This is the parallel architecture that will eventually replace the current action layer. If you add a new endpoint without a request-processor, the feature will regress when the migration happens. For every new POST endpoint, add this to the phase's completion checklist.

## Step 5: Verify

Before declaring the feature done, verify that it actually works as intended end-to-end. This is not the same as "no bugs found" — it is a confirmation that the feature behaves correctly for the cases it was built for.

Write a short `5-verification.md` that lists the specific scenarios you tested (or asked me to test), what you expected, and what actually happened. If anything did not behave as expected, treat it as a bug and loop back to Step 4 before proceeding.

## Step 6: Deploy

Now, the entire plan has been implemented and verified. Before deploying, run a proper audit using `ai/workflows/audit/WORKFLOW.md` with context type **C** — pass the feature folder as context and the audit workflow will read it to identify all files added or modified. "Check for bugs" is not a step — a structured audit is.

Once the audit is complete and all critical and high findings are resolved, we can go ahead and deploy.

If any phase included a DB schema migration, flag before deploying whether the migration is reversible. If it is not reversible (e.g., a column drop, a destructive backfill), call that out explicitly so we can decide on a rollback strategy before the deploy goes out.
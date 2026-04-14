A folder will be initialized with a context file, which describes the proposal topic.

You will proceed through this workflow one step at a time, asking for confirmation before proceeding to the next step.

If you have any questions at any step, you will ask. You will ask questions when anything is unclear and you will not suggest or carry out any updates you are unsure about unless given an explicit OK from me.

You will not edit this file or the context file.

## Step 0: Confirm setup

You will be given a path to a proposal folder within the proposal/ folder.

The proposal folder will be initialized with a context file which contains:

- The broad topic area or problem domain
- The target audience (course instructor, review committee, funding body, etc.)
- Any formatting constraints (page length, required sections, citation style, etc.)
- How the project relates to the proposal (case study, implementation vehicle, existing prototype, etc.)
- Any specific deliverable requirements that the proposal must address

Read the context file and confirm your understanding of the scope before proceeding. If anything is ambiguous -- the audience, the expected depth, what counts as a deliverable -- ask before moving on.

## Step 1: Create commands.md

The proposal may draw on the project's codebase, architecture, and data to motivate the problem or demonstrate feasibility. The context file alone may not provide enough raw material.

First, decide what information is missing or would meaningfully strengthen the proposal. If the context file is fully sufficient without any additional data from the codebase or database, say so and skip straight to Step 2.

Otherwise, create folders queries/ and scripts/ as needed.

### queries/

In queries/, create a file queries/1-selects.md and list any select queries that I should run against the database to provide you with more information.

List the queries in succession. Every line should start with "SELECT".

```
SELECT ...
SELECT ...
SELECT ...
```

That way, I can copy/paste them into my query runner and dump the entire output. Put these queries on one line each, consecutively, so that I can easily copy/paste them. Make sure the queries are valid, given the database schema in `ai/context/db-schema.md`. Consult `ai/context/db-schema.md` whenever you need to know table names, column names, or relationships -- do not guess column names.

Create a file queries/1-results.md where I can paste the results.

If it turns out you need more queries afterwards, just create another round of files queries/{2-selects.md, 2-results.md}. We can do as many rounds as you need.

### scripts/

If you need information beyond just raw queries -- for example, aggregating metrics, sampling representative data, or profiling code paths -- then you can create a scripts/ folder and put scripts in there that you want me to run.

Each script should be given a clear name.

Again, if it turns out you need to create and have me run more scripts afterwards, just let me know. We can do as many rounds as you need.

### commands.md

Create a single file commands.md in the proposal folder. This is a living file -- you will add to it over the course of the session whenever you need me to run something.

It should be a list of commands that I can copy and paste into my terminal and run from the repo root folder, organized into labeled rounds:

```
# Data — Round 1

node ai/tools/dump queries ai/workflow/proposal/2026-04-13-my-proposal/queries/1-selects.md > ai/workflow/proposal/2026-04-13-my-proposal/queries/1-results.md

# Data — Round 2

node ai/tools/dump queries ai/workflow/proposal/2026-04-13-my-proposal/queries/2-selects.md > ai/workflow/proposal/2026-04-13-my-proposal/queries/2-results.md
```

When you need a new round of commands, append the new section to commands.md. Do not create a separate file.

### Important

This step is just to initialize the data gathering. We can continue augmenting the data as needed. At any step downstream, we can revisit this step to run more queries and scripts.

## Step 2: Create 2-research-question.md

This is the intellectual foundation of the proposal. Before writing, read the relevant parts of the codebase so you understand what the project actually does -- not just what the context file says it does.

2-research-question.md should contain:

1. **Problem statement** -- A clear description of the problem being addressed. What is broken, missing, inefficient, or poorly understood in the current landscape? Why does this problem matter? Who is affected by it?

2. **Research question** -- A precise, answerable question that the proposed work will investigate. The question should be specific enough to guide the work but broad enough to produce meaningful findings.

3. **Significance** -- Why this problem is important. What are the real-world consequences of leaving it unsolved? What improvements become possible if it is solved? Ground this in concrete impact, not abstract hand-waving.

4. **Scope** -- What the proposed work will and will not address. Drawing a clear boundary prevents scope creep and sets honest expectations.

### Speculation rule

Every claim about the problem's importance or prevalence must be grounded. If you are reasoning from general knowledge rather than a specific source you can cite, you must say so explicitly:

- "Established: ..." -- when citing a specific, verifiable source
- "General knowledge: ..." -- when stating something widely accepted but not tied to a single source
- "Speculating: ..." -- when inferring something you have not directly verified

Wait for confirmation before proceeding. The research question shapes every section that follows -- getting it right here is critical.

## Step 3: Create 3-problem-space.md

Survey the existing work in the problem space. This section establishes credibility by showing awareness of what has already been done and positions the proposed work relative to the field.

3-problem-space.md should contain:

1. **Published work** -- For each relevant publication or project, include:
   - Full citation (author, title, publication venue, year, DOI or URL where available)
   - A one-to-two sentence summary of its approach and findings
   - How it relates to the research question from Step 2 -- does it address the same problem, a subset of it, or a related problem?
   - What it does well and where it falls short relative to the proposed work

2. **Common approaches** -- A synthesis of the major strategies or techniques used across the literature. Group related work by approach rather than listing papers one by one. This shows you understand the landscape, not just individual papers.

3. **Gap analysis** -- What the existing work collectively does not solve. This is the opening that the proposed work will fill. The gap should connect directly back to the research question from Step 2.

Do not fabricate citations. If you are unsure whether a source exists or whether you are remembering it correctly, say so and flag it for me to verify. It is far better to have three solid, real citations than ten that might not exist.

Wait for confirmation before proceeding.

## Step 4: Create 4-proposed-solution.md

Present the thesis and proposed approach. This is where the proposal transitions from "here is the problem" to "here is what we will do about it."

4-proposed-solution.md should contain:

1. **Thesis statement** -- A clear, concise statement of the proposed answer to the research question. This is the central claim that the project will attempt to support.

2. **Approach** -- How the project will investigate or implement the proposed solution. What methodology, architecture, or techniques will be used? How does the approach differ from or improve upon the existing work identified in Step 3?

3. **Feasibility** -- Why there is reason to believe this approach will work. This can draw on:
   - Existing code or architecture in the project that demonstrates partial progress
   - Results from related work that suggest the approach is sound
   - Theoretical grounding or established principles that support the design

4. **Expected outcomes** -- What the project will produce if successful. Be specific: not "better performance" but "reduced processing time for X by Y%" or "a working implementation of Z that handles cases A, B, and C."

Wait for confirmation before proceeding.

## Step 5: Create 5-deliverables.md

This step is collaborative every time -- every proposal has different requirements, so we will discuss the deliverables together before writing them down.

Before drafting, present a proposed list of deliverables based on your understanding of the context file, the research question, and the proposed solution. Ask me to confirm, add, remove, or modify deliverables before finalizing.

Once we agree on the deliverables, 5-deliverables.md should contain:

For each deliverable:

1. **Name** -- A short, descriptive label
2. **Description** -- What this deliverable is and what it demonstrates or proves
3. **Acceptance criteria** -- How we will know it is complete. What does "done" look like concretely?
4. **Dependencies** -- Which other deliverables (if any) must be completed first

Group deliverables by type if there are several (e.g., code deliverables, written deliverables, presentation deliverables). Order them so that dependencies flow top to bottom -- no deliverable should depend on one listed below it.

Wait for confirmation before proceeding.

## Step 6: Create 6-timeline.md

Using the deliverables from Step 5, create a timeline that maps each deliverable and its constituent tasks to specific time periods.

6-timeline.md should contain:

1. **Timeline table** -- A clear mapping of tasks to time periods. Use whatever granularity makes sense for the project (weeks, sprints, milestones). The table should show:
   - The time period
   - The deliverable(s) being worked on
   - The specific tasks within that deliverable
   - Any milestones or checkpoints

2. **Critical path** -- Which tasks are on the critical path? If any single task slips, which downstream deliverables are affected?

3. **Risk and buffer** -- Where is the schedule tight? Which tasks have the most uncertainty? Where is buffer built in?

The timeline must account for all deliverables from Step 5. Every deliverable must appear in at least one time period. If a deliverable spans multiple periods, show which tasks happen in which period.

Wait for confirmation before proceeding.

## Step 7: Create 7-first-draft.md

Assemble all sections into a single cohesive first draft in 7-first-draft.md.

The document should follow this structure:

1. **Introduction** -- Drawing from 2-research-question.md. States the problem, the research question, why it matters, and the scope.
2. **Problem Space** -- Drawing from 3-problem-space.md. Surveys existing work, identifies the gap.
3. **Proposed Solution** -- Drawing from 4-proposed-solution.md. Presents the thesis, approach, feasibility, and expected outcomes.
4. **Deliverables** -- Drawing from 5-deliverables.md. Lists what the project will produce.
5. **Timeline** -- Drawing from 6-timeline.md. Maps deliverables and tasks to time periods.
6. **References** -- All cited sources from the document, consolidated in one place.

This is not a simple concatenation. The assembly must:

1. **Smooth transitions** -- Ensure each section flows naturally into the next.
2. **Eliminate redundancy** -- Remove duplicated explanations that appeared across section drafts.
3. **Unify terminology** -- If different sections used different terms for the same concept, pick one and apply it consistently.
4. **Verify the narrative arc** -- The proposal should tell a coherent story: here is a problem, here is what others have done, here is what we will do differently, here is what we will produce, and here is when.

Wait for confirmation before proceeding.

## Step 8: Revision

Review the first draft and iteratively revise it. This step has multiple substeps, each producing a numbered file.

### Step 8.1: Create 8.1-revision.md

Read 7-first-draft.md and create 8.1-revision.md -- a revision notes file that identifies:

- Which paragraphs contain more detail than necessary for the proposal's target length
- Which sections are over- or under-length relative to the formatting constraints in the context file
- Specific cuts, merges, or rewrites needed to bring each section to the right density
- Any structural issues (redundancy, missing transitions, inconsistent terminology) that survived assembly

Do not edit the draft itself in this step. This file is a revision plan, not an edit.

Wait for confirmation before proceeding.

### Step 8.2: Create 8.2-trimmed.md

Apply the revision notes from 8.1-revision.md to produce a trimmed version of the proposal in 8.2-trimmed.md. This is a complete, standalone document -- not a diff or a set of patches.

Verify that:

1. Each section meets the length targets identified in 8.1-revision.md
2. No content was lost that the formatting constraints require
3. The narrative arc still holds after cuts
4. All references cited in the body still appear in the references section, and vice versa

Wait for confirmation before proceeding.

### Further substeps (8.3, 8.4, ...)

If additional rounds of revision are needed (based on feedback or further review), create additional substep files following the same pattern:

- Odd substeps (8.3, 8.5, ...) are revision notes identifying issues
- Even substeps (8.4, 8.6, ...) are revised drafts applying those notes

Each revision round produces a complete, standalone document. Continue until the proposal is ready for finalization.

Wait for confirmation before proceeding to Step 9.

## Step 9: Create 9-final.md

Copy the last revision draft (the highest-numbered even substep from Step 8) into 9-final.md.

Before declaring the proposal complete, do a final check:

1. The introduction accurately frames the final content
2. The references section includes every source cited in the body and no sources that are not cited
3. The proposal addresses all requirements from the context file
4. The deliverables and timeline are consistent with each other
5. The formatting matches any constraints specified in the context file
6. Each section meets the length targets from the context file

Present the final proposal and confirm that it is ready.

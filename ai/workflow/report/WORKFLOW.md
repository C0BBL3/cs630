A folder will be initialized with a context file, which describes the report topic.

You will proceed through this workflow one step at a time, asking for confirmation before proceeding to the next step.

If you have any questions at any step, you will ask. You will ask questions when anything is unclear and you will not suggest or carry out any updates you are unsure about unless given an explicit OK from me.

You will not edit this file or the context file.

## Step 0: Confirm setup

You will be given a path to a report folder within the report/ folder.

The report folder will be initialized with a context file which contains:

- The report topic and research question(s)
- The target audience (technical report, white paper, course deliverable, etc.)
- Any formatting constraints (page length, required sections, citation style, etc.)
- How the project relates to the topic (case study, implementation reference, primary subject, etc.)

Read the context file and confirm your understanding of the scope before proceeding. If anything is ambiguous -- the audience, the expected depth, the role of the project in the report -- ask before moving on.

## Step 1: Create commands.md

The report will draw on the project's codebase, architecture, and data as evidence. The context file alone may not provide enough raw material.

First, decide what information is missing or would meaningfully strengthen the report. If the context file is fully sufficient without any additional data from the codebase or database, say so and skip straight to Step 2.

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

Create a single file commands.md in the report folder. This is a living file -- you will add to it over the course of the session whenever you need me to run something.

It should be a list of commands that I can copy and paste into my terminal and run from the repo root folder, organized into labeled rounds:

```
# Data — Round 1

node ai/tools/dump queries ai/workflow/report/2026-04-13-my-report/queries/1-selects.md > ai/workflow/report/2026-04-13-my-report/queries/1-results.md

# Data — Round 2

node ai/tools/dump queries ai/workflow/report/2026-04-13-my-report/queries/2-selects.md > ai/workflow/report/2026-04-13-my-report/queries/2-results.md
node ai/workflow/report/2026-04-13-my-report/scripts/collect-metrics.js > ai/workflow/report/2026-04-13-my-report/scripts/collect-metrics-results.md
```

When you need a new round of commands, append the new section to commands.md. Do not create a separate file.

### Important

This step is just to initialize the data gathering. We can continue augmenting the data as needed. At any step downstream, we can revisit this step to run more queries and scripts.

## Step 2: Create 2-literature.md

Survey the landscape around the report topic. This step produces the raw material for the Background and Related Work sections of the report.

Before writing, read the relevant parts of the codebase so you understand what the project actually does -- not just what the context file says it does. Ground your literature survey in a real understanding of the system.

2-literature.md should contain:

1. **Related work** -- Existing approaches, tools, frameworks, or research that address the same problem space as the report topic. For each entry, include the name/title, a one-sentence summary of what it does, and how it relates to or differs from the approach taken in this project.

2. **Key concepts** -- Definitions or explanations of domain-specific terms and concepts that the report will use. A reader unfamiliar with the field should be able to read this section and then follow the rest of the report.

3. **Gaps and contributions** -- What the existing landscape does not address (or addresses poorly) that this project's approach handles. This frames the "why this matters" argument for the report.

Cite sources with enough detail to look them up (author, title, year, URL where available). Do not fabricate citations -- if you are unsure of a source, say so and flag it for me to verify.

### Speculation rule

Every claim in the literature survey must be grounded. If you are reasoning from general knowledge rather than a specific source you can cite, you must say so explicitly:

- "Established: ..." -- when citing a specific, verifiable source
- "General knowledge: ..." -- when stating something widely accepted but not tied to a single source
- "Speculating: ..." -- when inferring something you have not directly verified

## Step 3: Create 3-outline.md

Using the context file, the data gathered in Step 1, and the literature survey from Step 2, create a structured outline of the report in 3-outline.md.

The outline should follow standard technical report structure, adapted as needed for the specific topic:

1. **Abstract** -- One-paragraph summary of the entire report
2. **Introduction** -- Problem statement, motivation, and scope
3. **Background / Related Work** -- Drawing from 2-literature.md
4. **Methodology / Architecture** -- How the project approaches the problem
5. **Implementation** -- Key technical details, design decisions, code-level specifics
6. **Results / Analysis** -- What the approach achieves; data, metrics, or qualitative analysis
7. **Discussion** -- Interpretation of results, limitations, trade-offs, lessons learned
8. **Conclusion** -- Summary of contributions and future work
9. **References** -- All cited sources

For each section in the outline:

- Write a one-sentence summary of the section's purpose
- List the specific evidence, data, or code from the project that this section will reference
- Note any additional data that needs to be gathered (loop back to Step 1 if needed)

If the context file specifies a different structure (e.g., a required section ordering for a course deliverable), follow that structure instead and note where it diverges from the default.

Wait for confirmation before proceeding. The outline is the architectural blueprint of the report -- getting it right here prevents expensive rewrites later.

## Step 4: Draft sections

Write each section of the report as a separate numbered markdown file within a drafts/ folder:

```
drafts/4.1-abstract.md
drafts/4.2-introduction.md
drafts/4.3-background.md
drafts/4.4-methodology.md
drafts/4.5-implementation.md
drafts/4.6-results.md
drafts/4.7-discussion.md
drafts/4.8-conclusion.md
drafts/4.9-references.md
```

Proceed one section at a time. After completing each section draft, present it and wait for confirmation before moving to the next.

### Drafting rules

- **Ground every claim.** Every technical claim about the project must be traceable to specific code, data, or architecture you have read. Do not describe what you think the system does -- describe what the code shows it does.

- **Show, don't just tell.** When discussing implementation details, include relevant code snippets, data structures, or architectural patterns from the project. These are the evidence that makes a technical report credible.

- **Maintain consistent voice.** Write in third person, present tense for describing the system ("The system processes..."), past tense for describing what was done ("The architecture was designed to..."). Stay consistent throughout.

- **Flag gaps.** If a section needs data you do not yet have, do not fill the gap with speculation. Instead, write a placeholder marked `[NEEDS DATA: description of what's needed]` and note that we need to loop back to Step 1.

- **Respect scope.** Each section should do its job and nothing more. Do not preview conclusions in the introduction or rehash background in the discussion.

### If the context file specifies additional sections

Add them to the drafts/ folder with appropriate numbering. Follow the same one-at-a-time drafting process.

## Step 5: Create 5-assembly.md

Assemble all section drafts into a single cohesive document in 5-assembly.md.

This is not a simple concatenation. The assembly pass must:

1. **Smooth transitions** -- Ensure each section flows naturally into the next. Add bridging sentences where needed.
2. **Eliminate redundancy** -- Remove duplicated explanations that appeared in multiple section drafts.
3. **Resolve cross-references** -- Ensure that forward references ("as discussed in Section 5") and backward references ("as noted in the Introduction") all point to the right places.
4. **Unify terminology** -- If different section drafts used different terms for the same concept, pick one and apply it consistently.
5. **Verify the narrative arc** -- Read the assembled document start to finish and confirm that it tells a coherent story: problem, context, approach, evidence, interpretation, conclusion.

Present the assembled document and wait for confirmation before proceeding.

## Step 6: Create 6-review.md

Perform a systematic review of 5-assembly.md. This is a structured editing pass, not a casual reread.

Check each of the following and document findings in 6-review.md:

### Logical flow

- Does each paragraph follow from the previous one?
- Are there logical leaps where an intermediate step is missing?
- Does the argument build toward the conclusion, or does it meander?

### Unsupported claims

- Is every factual claim backed by a citation, a code reference, or data?
- Are there sentences that sound authoritative but lack evidence?
- Are speculation markers ("General knowledge", "Speculating") used correctly and sparingly?

### Accuracy

- Do code snippets and architectural descriptions match what is actually in the codebase?
- Are metrics and data points correctly reported?
- Are cited sources real and accurately summarized?

### Audience alignment

- Is the technical depth appropriate for the stated audience?
- Are domain-specific terms defined before use?
- Would a reader in the target audience be able to follow the argument without external references?

### Completeness

- Does the report address all aspects of the research question from the context file?
- Are there obvious follow-up questions that the report raises but does not address?
- Does the conclusion actually follow from the evidence presented?

For each finding, note the location in the document and the recommended revision. Categorize findings as:

- **Critical** -- Must fix; the report is incorrect or misleading without the change
- **Important** -- Should fix; the report is weaker without the change
- **Minor** -- Nice to fix; polish and clarity improvements

Wait for confirmation on which findings to address before proceeding.

## Step 7: Create 7-final.md

Incorporate the agreed-upon revisions from 6-review.md into a final version of the report in 7-final.md.

Before declaring the report complete, do a final check:

1. The abstract accurately summarizes the final content (not an earlier draft)
2. The references section includes every source cited in the body and no sources that are not cited
3. The report addresses the research question(s) stated in the context file
4. The formatting matches any constraints specified in the context file

Present the final report and confirm that it is ready.

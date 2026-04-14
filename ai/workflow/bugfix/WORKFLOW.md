A folder will be initialized with a context file, which describes the issue.

You will proceed through this workflow one step at a time, asking for confirmation before proceeding to the next phase.

If you have any questions at any step, you will ask. You will ask questions when anything is unclear and you will not suggest or carry out any updates you are unsure about unless given an explicit OK from me.

You will not edit this file or the context file.

## Step 0: Confirm setup

You will be given a path to an support issue folder within the bugfix/ folder.

The support issue folder will be initialized with a context file which contains a description of the support issue along with any additional context that we were able to find in the system logs.

Full production server logs should be available at `ai/context/server-logs/`. The server logs in UTC. Note that the logs may be out of date -- if you need more recent logs, tell the user to pull them and place them in `ai/context/server-logs/`.

## Step 1: Create commands.md

The provided context may not be enough information to fully diagnose the issue, or there may be additional information that would simply be helpful to have.

First, decide what information is missing or would meaningfully help. If the context file is fully sufficient to diagnose the issue without any additional data, say so and skip straight to Step 2.

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

Create a single file commands.md in the issue folder. This is a living file — you will add to it over the course of the session whenever you need me to run something.

It should be a list of commands that I can copy and paste into my terminal and run from the repo root folder, organized into labeled rounds:

```
# Dump — Round 1

node ai/tools/dump queries ai/bugfix/2026-03-21-fix-bug/queries/1-selects.md > ai/bugfix/2026-03-21-fix-bug/queries/1-results.md

# Dump — Round 2

node ai/tools/dump queries ai/bugfix/2026-03-21-fix-bug/queries/2-selects.md > ai/bugfix/2026-03-21-fix-bug/queries/2-results.md
node ai/bugfix/2026-03-21-fix-bug/scripts/fetch-stripe-subscriptions.js > ai/bugfix/2026-03-21-fix-bug/scripts/fetch-stripe-subscriptions-results.md
```

When you need a new round of commands, append the new section to commands.md. Do not create a separate file.

### Important

This step is just to initialize the data dump. We can continue augmenting the dump as needed. At any step downstream, we can revisit this step to run more queries and scripts.

## Step 2: Create 2-diagnosis.md

Before writing anything, read the relevant source files. Logs and data can point you at a symptom; only the code can reveal the root cause. If the context suggests the bug is in a particular controller, service, or utility, read it before forming a hypothesis. A diagnosis written without reading the code is speculation, not diagnosis.

Diagnose the support issue using the provided context, database dump, and code.

Put the diagnosis in 2-diagnosis.md, and state how confident you are that this describes the full issue at the root cause.

If you are not completely confident, tell me what we can check or try to make you more confident that your diagnosis is correct.

### Check for the same bug elsewhere

Once you have identified the root cause, search the codebase for the same pattern. A logic or naming bug in one place often appears in parallel code — other controllers, services, or methods doing the same thing a different way. If you find other instances, note them in 2-diagnosis.md. The fix step will address them all.

### Check the corresponding request-processor

Per the CTO note: any bug found in a controller or action is likely to exist in the corresponding `/request-processor` as well, since that is the parallel architecture being migrated to. Diagnose both at this step, not just at the fix step — otherwise the fix plan will be incomplete.

### Check for existing data corruption

Some bugs don't just prevent correct behavior going forward — they have been silently corrupting rows for days, weeks, or months. Ask explicitly: has this bug already left bad data in the DB? If so, the fix needs two parts: code that prevents future corruption, and a one-time remediation script that cleans up what has already been damaged. Note both in 2-diagnosis.md so the fix plan accounts for them.

### "Not a bug" verdict

The diagnosis may conclude that the reported issue is not actually a bug. If that's your conclusion, say so clearly in 2-diagnosis.md and explain your reasoning. Then write 3-fix.md with "No fix needed" and why, and skip straight to 4-summary.md. Do not continue through the remaining steps.

### Speculation rule

Every claim in the diagnosis must follow tight logic from evidence — code you have read or data you have seen. If you are reasoning by inference or analogy rather than from direct evidence, you must say so explicitly. Use language like:

- "Confirmed: ..." — when the claim follows directly from code or data you have read
- "Speculating: ..." — when you are inferring something you have not directly verified

Do not state a hypothesis as a fact. Do not omit the qualifier to keep the prose cleaner. If you cannot verify something without more data, say what data you need and why.

The threshold for "Confirmed" is: all evidence for the claim is fully contained in code you have read or data you have seen. If the claim depends on anything you have *not* read or seen — a caller you didn't check, a config value you don't know, a runtime behavior you are inferring — it is "Speculating." When in doubt, get more data before concluding.

This rule applies everywhere in the workflow — not just 2-diagnosis.md.

## Step 3: Create 3-fix.md

Based on your diagnosis, plan the least invasive bugfix that addresses the root cause of the issue.

Put your proposed fix in 3-fix.md, and state how confident you are that this fixes the full issue at the root cause.

If you are not completely confident, tell me what we can check or try to make you more confident that your proposed fix is correct.

IMPORTANT: it's more important to address the source of the issue as far back as possible, than for the bugfix to be non-invasive. I'm just saying that, provided you've addressed the source issue as far back as possible, make the fix as non-invasive as possible. Prefer root-cause fixes over non-root-cause fixes, and then prefer less invasive root-cause fixes over more invasive root-cause fixes.

IMPORTANT NOTE FROM CTO: Any changes made to an /action needs to also update the corresponding /request-processor, which is the new architecture that just hasn't been rolled out yet. Or basically any kind of a POST request type update. Just remind Claude to consider whether parallel functionality might exist in a request-processor that needs to be updated based on the proposed fix. Otherwise when I finally migrate everything over, that bug will go right back into production.

## Step 4: Create 4-summary.md

Summarize the issue, diagnosis, and fix as concisely and plainly as possible so that a busy coder can fix the bug manually.

Structure your summary in a way that's it's very easy to skim and can be understood by someone with one brain cell left at 3am on the verge of falling asleep.

Don't provide any details unrelated to the core problem and fix, but do state your level of confidence that this describes and fixes the full issue at the root cause -- and if you are not completely confident, tell me what we can check or try to make you more confident that this will resolve the issue at the root cause.

Be sure to paste the explicit code fix so that the coder can implement it by copying/pasting (and very briefly highlight what change is being made and why).

Keep it stupid simple.

Put your summary in 4-summary.md.

Do not implement any code changes at any point before Step 7. Steps 4 through 6 are planning and preparation only. Implementation happens in Step 7, after all planning steps are complete and I have explicitly told you to proceed.

## Step 5: Create 5-externalities.md

Sometimes our bugfixes have resulted in externalities, where the bug we intended to fix is fixed, but then it creates a new issue that we didn't think to handle.

Check for any externalities that will result from this bugfix. If you miss any externalities, we are screwed.

For each of the following, actively ask the question — do not just scan for obvious problems:

- **Other callers of the changed code** — does anything else call the function or method being modified? If so, does the fix break or change behavior for those callers?
- **Same bug elsewhere** — does the same bug pattern appear in other files or methods that are not being fixed? If so, note them explicitly so they can be addressed separately.
- **Removed constraints** — does the fix remove a validation, guard, or check that was quietly preventing a different problem? Confirm that removing it does not open a new hole.
- **API response shape changes** — if the fix changes what an endpoint returns, are there clients (frontend, mobile, external API consumers) that depend on the old shape?
- **DB state assumptions** — does the fix assume DB rows are in a particular state? If existing data does not match that assumption, the fix may fail or produce incorrect results for old records.
- **Request-processor parity** — per the CTO note in Step 3, check whether the same externality risk applies to any corresponding request-processor that is being updated in parallel.

## Step 6: Create 6-test.md

Before implementing anything, set up a local test so we can verify the bug exists and then verify the fix works.

This step has two phases:

### If the bug cannot be reproduced locally

Some bugs only manifest in production — due to production-specific data, timing conditions, third-party integrations, or environment differences that cannot be replicated locally. If this is the case:

1. Say so explicitly at the top of 6-test.md.
2. Describe the closest approximation available locally and what it does and does not cover.
3. Document what specific production signals (log lines, DB state, user reports) would confirm that the fix worked after deployment.
4. Note that verification will happen post-deploy rather than pre-deploy, and what to watch for.

Do not fabricate a local test that does not actually reproduce the bug.

### Phase A — Gather test data

You will almost certainly need specific local IDs (student IDs, task IDs, question IDs, etc.) to construct exact test instructions. Do not write placeholder instructions.

Add a new round to commands.md with queries or scripts that retrieve the specific local IDs needed for testing. For example:

```
# Test — Round 1

node ai/tools/dump queries ai/bugfix/2026-03-21-fix-bug/queries/3-selects.md > ai/bugfix/2026-03-21-fix-bug/queries/3-results.md
```

Tell me to run those commands, then wait for me to report the results before writing 4-test.md.

If the first round of results isn't enough to pin down an exact URL or action, add another round to commands.md and ask me to run those too. Repeat until you have everything you need.

### Phase B — Write 6-test.md

Once you have the real IDs, write 6-test.md. It must contain no placeholders — every URL, ID, and action must be fully specified. It should contain:

1. **Setup** — the exact commands to run to put the local database into a state where the bug is reproducible (if any DB changes are needed). Reference the commands.md rounds by label.

2. **Reproduce the bug** — the exact URL to visit and/or exact UI actions to take. No blanks to fill in.

3. **Expected (broken) behavior** — what you see before the fix.

4. **Apply the fix** — a reminder to implement the code change.

5. **Re-run setup** — note if setup commands need to be re-run after a crash due to partially mutated state.

6. **Verify the fix** — the exact URL to revisit and/or exact UI actions to repeat.

7. **Expected (fixed) behavior** — what you should see after the fix.

Wait for confirmation before proceeding to Step 7.

## Step 7: Implement and test

Once I give the go-ahead:

1. Implement the fix from 3-fix.md.
2. I will follow 6-test.md to verify the fix in the UI.

### If the fix does not work

If testing reveals the bug is not fixed — or a new problem appears — do not proceed to Step 8. Instead:

1. Document what was observed (what you expected vs. what actually happened).
2. Return to Step 2 and revise 2-diagnosis.md. The failed test is new evidence; update the diagnosis to account for it.
3. Revise 3-fix.md and 4-summary.md accordingly.
4. Repeat until the fix is verified.

## Step 8: Create 7-debrief.md

After the fix is verified, create 7-debrief.md. This is a permanent record of the full investigation — written for someone who wants to understand what happened, why, and how it was resolved, including what was actually done during testing. It is distinct from 4-summary.md, which is a brief for someone who needs to implement a fix and hasn't been following along.

7-debrief.md should contain:

1. **What the bug was** — a plain description of the reported issue and the actual root cause
2. **What the fix was** — the exact code change made, with before/after
3. **Confidence level** — how confident you are this fully resolves the issue at the root cause
4. **Local testing** — a complete record of what was done to verify:
   - Which student/task/question IDs were used
   - The exact setup commands that were run
   - The before and after behavior that was observed

The local testing section should be complete enough that someone could re-run the test from scratch using only 7-debrief.md.

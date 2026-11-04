# Oral-lens hackathon execution plan

Updated: 4 November 2026, Asia/Kolkata

Participant submission target: before 5 November 2026, 12:00 AM IST

Submission deadline recorded from the supplied guide: 5 November 2026, 7:30 AM IST

This is the working control document for the participant, Codex, and Meta-powered Codex sessions. It defines what to build, what not to build, how to verify each milestone, and how the final demonstration should represent inherited and new work. It does not replace the official rules or establish organizer approval.

Before changing code, read:

1. `AGENTS.md`
2. `.agents/skills/oral-lens-hackathon/SKILL.md`
3. This execution plan
4. The task-specific document linked from this plan

## 1. Project definition

### One-sentence product

Oral-lens is a research evidence-review workspace that helps oral cancer researchers and student literature reviewers inspect whether draft claims are supported by selected papers, identify missing evidence, compare reported study details, correct AI drafts, and export a traceable review.

### Primary users

- Oral cancer researchers reviewing a small selected literature set.
- Final-year students preparing source-checked literature reviews.

### Primary problem

Literature reviewers must repeatedly search papers, locate relevant passages, compare methods and outcomes, and determine whether a draft statement is supported. Generic chat and basic RAG can produce fluent summaries without preserving enough evidence identity, missing-information state, revision history, or human-review boundaries.

### Intended outcome

A reviewer finishes with an evidence brief containing:

- the selected papers and original research claim;
- exact retrieved passages with stable local source identity;
- a structured model assessment and explicit limitations;
- an honest insufficient-evidence state when the selected corpus is inadequate;
- reviewer corrections and review status;
- a comparison of study fields linked to evidence;
- a traceable export of the saved revision.

## 2. Non-negotiable boundaries

Oral-lens is a literature-research tool. It must not:

- accept patient cases or oral lesion photographs for assessment;
- diagnose, screen, triage, estimate individual risk or prognosis;
- recommend treatment or provide personalized medical advice;
- claim that a similarity score, quote match, model response, or reviewer click proves scientific truth;
- describe absence from retrieved excerpts as absence from the entire paper or research literature;
- treat study differences as contradictions without a defensible comparison;
- allow retrieved text to override system instructions or authorize tools;
- let a model set the human-reviewed state;
- fabricate papers, passages, quotations, page numbers, results, evaluation scores, permissions, or demo outcomes.

Out-of-scope medical requests must be declined without embedding medical advice inside a disclaimer.

## 3. Hackathon constraints and judging alignment

The maintained rules reference is `doc/hackathon_rules.md`. Important constraints for all implementation decisions:

- The repository must be public at submission time.
- Team size is at most four.
- The product must make meaningful use of Meta models.
- The three-minute demo must identify and show only event-built functionality as new.
- Inherited work must be disclosed; wrapping or renaming it does not make it new.
- Rights, policy compliance, and originality are eligibility requirements, not scoring bonuses.
- Avoid the supplied anti-project patterns: medical advice, basic RAG, a simple education chatbot, or a simple image analyzer.

### Rubric-to-product map

| Rubric | Weight | Evidence Oral-lens should demonstrate |
| --- | ---: | --- |
| Impact | 30% | A concrete literature-review task, a useful evidence brief, user feedback, and measured workflow results rather than disease statistics alone |
| Meta AI tooling | 25% | Meta performs structured evidence assessment, bounded gap identification and reassessment; the UI exposes useful model decisions and abstention rather than only a provider badge |
| Technical depth and execution | 20% | Typed state, bounded LangGraph routing, read-only scoped retrieval, passage provenance, validation, stale-state handling, clear errors, tests, and reproducible setup |
| Demo | 25% | A reliable three-minute journey from claim to evidence, insufficiency/correction, comparison, and export with new versus inherited work clearly labeled |

Every proposed feature must either improve the core user outcome, establish verification evidence, or strengthen the final demo. Framework usage alone earns no points.

## 4. Inherited foundation versus event work

`doc/contribution_manifest.md` is authoritative. Never infer originality from this summary.

### Inherited foundation

- Original FastAPI application structure and some routes.
- PostgreSQL/pgvector corpus infrastructure.
- Existing oral-cancer paper data and embeddings.
- Retrieval and visualization foundations, including the historical 3D map.
- Imported static assets and earlier ingestion utilities where recorded.

These can support the new product but must not be showcased as newly created hackathon features.

### New or modified event work already present

- uv-based project setup, locked dependencies, environment guidance, and read-only database inspection.
- Shared Meta Model API completion client and manual smoke test.
- Typed claim-review request/result schemas.
- Selected-paper pgvector retrieval exposed as a bounded LangChain tool.
- LangGraph scope, retrieval, assessment, source-check, and bounded follow-up workflow.
- Native structured-output schema and application validation.
- CLI access to the same review workflow.
- React product/presentation views.
- Browser-local review-thread history, execution tree, and evidence inspector.
- Project-local launcher for a separate Meta-powered Codex development session.

### Important current limitations

- Search returns at most six passages. A selected paper can still receive no passage when more than six papers are selected or the local corpus has no usable text for it.
- Reviewer corrections and authoritative human-review transitions are not persisted.
- Structured study comparison is not implemented.
- Traceable export is not implemented.
- Browser interaction has not been fully automated or verified end to end.
- Existing live cases demonstrate control flow, not scientific-quality performance.
- Corpus redistribution rights and organizer interpretation of Indie reuse remain unresolved.

## 5. Current technical architecture

### Backend

- Python 3.13 managed with uv.
- FastAPI for HTTP routes.
- Pydantic for input, workflow-state, and provider-output validation.
- SQLAlchemy with PostgreSQL and pgvector.
- Meta Model API for model reasoning and structured output.

### AI workflow

- LangChain Core supplies typed tool boundaries where useful.
- LangGraph defines explicit state, nodes, conditional edges, and bounded loops.
- Python application logic—not the model—controls corpus scope, search budgets, validation, source identity, terminal state, and human-review authority.
- The Meta model interprets the research claim and supplied evidence, proposes an assessment, states limitations, and may propose a bounded follow-up query.

### Frontend

- React, TypeScript, and Vite.
- Product workspace for paper selection, claim review, result inspection, session history, and graph trace.
- Presentation mode for the problem, product workflow, contribution disclosure, and live-product handoff.
- Three.js is installed but should not be expanded unless it materially improves the evidence-review demo.

### Persistence

- Connected PostgreSQL data must remain read-only during review and inspection unless a specific, designed write path is approved and implemented.
- Current frontend review threads are browser-local and are not authoritative multi-user persistence.
- Any saved human corrections require explicit revision semantics and a separate application-owned storage design.

Read `doc/tech_stack.md`, `doc/flow.md`, and `doc/session_threads.md` before architecture changes.

## 6. Target product workflow

1. The reviewer searches for and selects up to ten papers.
2. The reviewer enters a literature claim or comparison question.
3. The backend rejects patient-specific or otherwise out-of-scope requests.
4. Retrieval searches only the selected papers and preserves passage identity.
5. Meta produces a typed draft assessment using only supplied evidence.
6. Python validates cited passage IDs and exact quoted text.
7. If required evidence is missing, Meta may propose one scoped follow-up query.
8. Python decides whether the follow-up is allowed and runs it within the same paper scope.
9. The workflow stops after the configured budget, repeated evidence, validation failure, or a usable draft.
10. The interface shows the assessment, limitations, evidence, workflow trace, and unresolved gaps.
11. The reviewer may correct fields or conclusions; only the reviewer can mark the saved revision reviewed.
12. The product exports the exact saved revision with evidence references, limitations, and review status.

The current implementation covers steps 1–10 in a non-persistent form. Steps 11–12 are priority work.

## 7. Prioritized implementation roadmap

Work in this order. Do not start a later milestone merely because it looks more impressive.

### Milestone 0 — Baseline and safety freeze

Status: mostly present; re-verify before further changes.

Tasks:

- Run the backend offline tests.
- Run the frontend build and session-history tests.
- Record the current Git status without discarding participant changes.
- Confirm environment files remain ignored.
- Confirm legacy `/query` stays disabled by default.
- Confirm the connected database is used read-only by review paths.
- Select stable demo papers and record why they are safe/useful examples.

Acceptance criteria:

- Existing tests pass or failures are recorded before new work.
- No secret is tracked or printed.
- No database write occurs.
- A small fixed demo set includes at least one supported and one insufficient-evidence case.

### Milestone 1 — Balanced selected-paper retrieval

Priority: highest backend improvement.

Status update, 4 November: implemented and checked with 72 offline tests and one read-only two-paper database query. Coverage is not scientific relevance; see `workflow_lesson_02.md`.

Problem: global top-k similarity can return many passages from one paper and none from another, making a comparison claim impossible even when multiple papers were selected.

Target behavior:

- Retrieve a small per-paper candidate set for every selected paper that has qualifying text.
- Preserve the original similarity score and passage identity.
- Merge candidates deterministically under a global passage budget.
- Report papers with no returned evidence explicitly.
- Keep follow-up retrieval within the original paper IDs.
- Deduplicate passages without treating repeated evidence as new.

Suggested design:

1. Run vector similarity within each selected paper.
2. Take the best candidate per paper first.
3. Fill remaining slots by global score from the unused candidates.
4. Preserve a predictable tie-breaker such as paper ID and row ID.
5. Return coverage diagnostics separately from semantic assessment.

Do not label per-paper allocation as better scientific evidence. It is a retrieval-coverage policy.

Acceptance tests:

- Two selected papers with matching passages both receive representation when the budget permits.
- A paper without matching/available text is reported, not fabricated.
- One-paper behavior remains valid.
- Follow-up search cannot expand paper scope.
- Duplicate passage IDs are not counted twice.
- Query and result order are deterministic in fixtures.

Likely files:

- `app/review_search.py`
- `app/review_workflow.py`
- `app/review_schemas.py`
- `tests/test_review.py`
- `tests/test_follow_up.py`
- relevant workflow documentation

### Milestone 2 — Structured study comparison

Priority: strongest differentiation from basic RAG.

Target fields for the first slice:

- study or model type;
- specimen/population description;
- sample size when explicitly reported;
- method or exposure/intervention as reported;
- outcome measures;
- principal reported finding;
- limitations explicitly available in the supplied passages;
- missing/not available state.

Contract:

- Every substantive value must cite one or more passage IDs.
- Missing values remain missing; Meta must not fill them from general knowledge.
- Values are model-proposed until reviewed.
- Comparison describes reported differences; it does not automatically declare contradiction, superiority, causality, or clinical applicability.
- Editing a cited value invalidates dependent assessment state until reassessed.

Acceptance tests:

- Complete field with a valid citation.
- Missing field remains explicit.
- Invalid passage ID fails validation.
- Quote mismatch fails source validation.
- Two studies with different outcome measures are marked non-comparable or limited rather than contradictory.
- The UI can inspect each value’s evidence without showing a wall of text.

Likely new areas:

- typed comparison schemas and workflow node;
- comparison API response or a versioned extension of the review response;
- React comparison table and evidence inspector integration;
- synthetic fixtures plus selected real-paper walkthroughs.

### Milestone 3 — Reviewer corrections and revision state

Priority: required to make the product a review workspace rather than a chatbot.

Target behavior:

- A reviewer can edit a proposed claim conclusion or comparison field.
- The application stores model proposal separately from reviewer correction.
- Only an explicit reviewer action can mark a revision reviewed.
- A correction records timestamp, revision number, changed field, and optional note.
- New model assessment or evidence changes create a new draft revision and cannot overwrite a later reviewer edit.
- Stale updates are rejected using an expected revision/version.

Recommended first persistence scope:

- Design application-owned tables or a clearly isolated local persistence layer.
- Do not mutate inherited corpus tables.
- Add migrations only after reviewing the exact schema and rollback behavior.
- Keep anonymous/local-demo limitations explicit if authentication is not implemented.

Acceptance tests:

- Model output always starts unreviewed.
- Reviewer correction is preserved separately.
- Stale revision update fails safely.
- Reassessment invalidates affected reviewed status without deleting history.
- Failed model calls preserve the last saved revision.
- The UI distinguishes model-proposed, source-checked, corrected, and reviewed.

### Milestone 4 — Traceable Markdown export

Priority: converts the workflow into a useful artifact.

Target behavior:

- Export the selected saved revision, not transient UI state.
- Include selected-paper identifiers, claim, assessment, comparison fields, exact evidence references, limitations, unresolved gaps, review status, revision, model/prompt metadata, and generation time.
- Clearly label unreviewed drafts and failed/partial states.
- Prefer Markdown for the MVP; HTML is optional only after Markdown is reliable.
- Never export invented page numbers or imply full-paper coverage.

Acceptance tests:

- Export matches the requested saved revision.
- Reviewed and unreviewed states are clearly different.
- Missing source locations remain unavailable rather than guessed.
- Special characters and multiline excerpts render safely.
- Failed or incomplete reviews cannot masquerade as complete.

### Milestone 5 — Evaluation harness

Priority: needed for credible execution and impact claims.

Create a small, independently checked set covering:

- supported claim;
- partially supported claim;
- unsupported claim where evidence explicitly conflicts;
- insufficient evidence;
- non-comparable study methods/outcomes;
- invalid citation or quote;
- repeated follow-up evidence;
- out-of-scope medical request;
- provider failure or malformed output;
- reviewer correction and stale revision.

Record for every run:

- case ID and source scope;
- expected control-flow behavior;
- actual terminal state;
- passage/reference validity;
- reviewer/annotator and expertise limitations;
- model, prompt, and code version;
- tokens/latency where available;
- failure and caveat.

Do not call synthetic workflow tests a scientific benchmark. Do not claim clinical validation. A useful MVP report can measure citation validity, abstention behavior, selected-paper coverage, workflow completion, and task time while stating limitations.

### Milestone 6 — Interface and demo hardening

Target behavior:

- Keep titles and controls concise; avoid returning to the earlier cluttered layout.
- Show the session tree and evidence inspector without duplicating full assessment text.
- Make loading, failure, insufficient-evidence, unreviewed, and reviewed states obvious.
- Preserve a stable demo path even when the API fails.
- If a recorded/replayed result is used, label it accurately; do not present it as live.
- Use the inherited 3D map only as disclosed context, not the central new feature.

Verification:

- Backend tests.
- Frontend TypeScript production build.
- Session-history tests.
- Manual browser walkthrough at desktop and narrow viewport.
- One real end-to-end supported case.
- One real end-to-end insufficient-evidence case.
- One safe provider-failure case.
- No secrets in browser bundles, logs, screenshots, or video.

### Milestone 7 — Submission preparation

Tasks:

- Reconcile every demo statement with `doc/contribution_manifest.md`.
- Confirm repository public access anonymously.
- Confirm team list and representative.
- Resolve or disclose license/rights status for code, corpus excerpts, images, fonts, and reference designs.
- Record any organizer clarification on Indie reuse and research scope.
- Freeze a tagged/committed demo revision only when the participant chooses.
- Record a demo under three minutes.
- Verify video and repository links independently.
- Submit before the internal target, preserving confirmation.

## 8. Three-minute demo plan

Target duration: 2:40–2:55, leaving margin.

### 0:00–0:20 — Problem and user

- Identify the user: oral cancer researcher or student literature reviewer.
- State the problem: a fluent literature claim can hide missing or mismatched evidence.
- Avoid implying that Oral-lens improves diagnosis or patient outcomes.

### 0:20–0:35 — Originality disclosure

- Inherited: corpus, embeddings, pgvector foundation, historical visualization.
- New event work: bounded Meta evidence-review workflow, validation, trace, comparison/corrections/export if implemented and verified.

### 0:35–1:35 — Live claim review

- Select the prepared papers.
- Enter a concise comparison claim.
- Run the workflow.
- Show the node trace: scope, retrieval, assessment, source validation, and bounded follow-up when applicable.
- Open one exact source passage.

### 1:35–2:15 — Useful research outcome

- Show the structured comparison.
- Highlight a missing or non-comparable field.
- Make one reviewer correction and show that only the human action changes review state.

### 2:15–2:40 — Export and engineering

- Export the saved revision.
- Briefly show source identity, limitations, revision, and review status.
- Mention Meta structured reasoning, LangGraph bounded routing, and read-only scoped retrieval in user-benefit terms.

### 2:40–2:55 — Close

- State the intended benefit: a faster, more inspectable evidence-review process.
- State the limit: research support, not medical advice or scientific validation.

If comparison, corrections, or export are not implemented and verified, remove them from the demo instead of simulating completion.

## 9. Development protocol for Codex

### Required behavior for every coding task

1. Read `AGENTS.md`, the repository skill, and this plan.
2. Inspect relevant source and tests before proposing changes.
3. State whether touched functionality is inherited, modified inherited, or new.
4. Explain the implementation in plain language before editing when introducing a new framework concept.
5. Keep the task within one milestone and one small working slice.
6. Preserve unrelated participant changes in a dirty worktree.
7. Use `apply_patch` for manual edits.
8. Never read, print, copy, or commit values from `.env` or `.env.meta`.
9. Do not write to the connected research database unless the participant explicitly authorizes a designed write path.
10. Run proportionate tests and report exactly what they establish.
11. Update affected documentation and the contribution manifest when behavior changes.
12. Do not commit, push, publish, deploy, contact organizers, or spend credits unless explicitly requested.

### Task completion report

Every implementation response should report:

- outcome;
- files changed;
- user-visible behavior;
- tests/checks run and results;
- whether a live Meta request was made and potential credit use;
- inherited/new-work classification;
- remaining limitations and the next recommended task.

## 10. Prompt templates for Meta-powered Codex

### A. Analysis-only prompt

```text
Read AGENTS.md, .agents/skills/oral-lens-hackathon/SKILL.md, and
doc/hackathon_execution_plan.md. Then inspect the files relevant to Milestone 1.

Do not edit files yet. Explain:
1. current behavior,
2. the concrete observed failure,
3. the smallest proposed design,
4. provenance and safety implications,
5. tests required,
6. inherited versus new functionality.

Keep the proposal within balanced selected-paper retrieval. Do not add unrelated
frameworks, UI redesigns, database writes, or medical features.
```

### B. Implementation prompt after approving the design

```text
Implement the approved Milestone 1 slice from doc/hackathon_execution_plan.md.

Constraints:
- preserve selected-paper scope and read-only retrieval;
- keep passage IDs, hashes, source type, chunk index, and similarity values;
- deterministic allocation and deduplication;
- no database schema or frontend changes;
- do not access secrets or make live Meta requests;
- add focused offline tests;
- update the affected workflow documentation and contribution manifest;
- preserve unrelated working-tree changes.

After implementation, run the focused tests and the full offline backend suite.
Report files changed, test results, provenance implications, and limitations.
```

### C. Code-review prompt

```text
Review the current uncommitted changes against AGENTS.md and
doc/hackathon_execution_plan.md. Prioritize correctness, source provenance,
medical-scope violations, unbounded model/tool behavior, stale review state,
database-write risk, secret exposure, and misleading new-work claims.

Do not edit files. Return findings ordered by severity with exact file/line
references, then list missing tests and remaining risks. Do not praise or
summarize before the findings.
```

## 11. Decision log

| Decision | Reason | Revisit when |
| --- | --- | --- |
| FastAPI instead of Django | Existing project foundation and typed API workflow already use FastAPI | A concrete missing requirement justifies migration cost |
| LangGraph for orchestration | Explicit state, conditional routing, bounded loops, and inspectable events | It adds complexity without observable user benefit |
| LangChain Core only where useful | Typed tool boundary without adopting unnecessary abstractions | A real integration requires another component |
| Meta model for product reasoning | Required hackathon tooling and already verified basic API access | Provider availability or official rules change |
| Python controls tools and budgets | Safer corpus scope, deterministic validation, and honest failure states | A model-selected tool design can meet equal safeguards and improve UX |
| Browser-local threads for current UI | Quick non-authoritative history without corpus writes | Reviewer corrections require durable revision persistence |
| Markdown export first | Inspectable, portable, testable MVP artifact | Markdown export is reliable and HTML adds a user need |
| No new 3D work in MVP | The inherited map does not solve the core review task | A tested evidence relationship view materially improves comprehension |

## 12. Stop conditions for proposed features

Do not implement a feature when it:

- moves the product toward diagnosis, screening, treatment, or patient advice;
- is primarily a model/provider badge or framework showcase;
- cannot be completed and verified before demo freeze;
- obscures inherited work or depends on unconfirmed rights;
- requires unbounded model calls or arbitrary model-selected execution;
- weakens provenance, revision history, or honest insufficiency;
- adds visual complexity without improving the three-minute user journey;
- consumes credits without a defined validation question and stopping budget.

## 13. Immediate next action

The 4 November submission audit verified 70 offline backend tests, frontend build and session-history checks, local database connectivity, and public repository visibility. Follow `submission_package.md` to publish the reviewed working tree, record the video, and complete the submission before the participant's midnight target. The earlier milestones remain a roadmap for future work; do not present unfinished milestones as hackathon features.

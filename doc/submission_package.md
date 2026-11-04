# Oral-lens submission package

Prepared: 4 November 2026, Asia/Kolkata. Replace bracketed placeholders before submitting. Keep claims aligned with the committed repository and recorded demo.

## Project identity

**Project name:** Oral-lens

**Track:** Indie Developer

**Theme:** Build for Your World

**Tagline:** Inspect a literature claim from statement to source.

**Repository:** https://github.com/KEYUR141/Oral-lens

**Demo video:** `[PUBLIC VIDEO URL]`

**Team:** `[PARTICIPANT NAME(S), MAXIMUM FOUR]`

## Short description

Oral-lens is a Meta-powered evidence-review workspace for oral cancer researchers and student literature reviewers. Reviewers select papers, enter a research claim, and inspect a structured assessment against exact retrieved passages. A bounded workflow can seek missing evidence once, validate cited IDs and quotations, and stop honestly when the selected excerpts are insufficient.

## Problem

Literature reviewers spend significant time locating passages, comparing what studies actually report, and checking whether a draft conclusion overstates its sources. A fluent retrieval answer can hide missing evidence, mismatched study details, or unsupported certainty. Researchers need an inspectable draft review, not another answer box.

## Solution

Oral-lens keeps the review path visible. The reviewer chooses the paper scope. The application retrieves exact passages from those papers, asks a Meta model for a typed claim assessment, mechanically checks its citations and quotations, and shows the workflow as a selectable execution tree. When evidence is incomplete, the model may propose one focused follow-up query; Python enforces the original paper scope and search budget. Repeated or inadequate evidence ends in an explicit unresolved state rather than a fabricated conclusion.

## How Meta AI is used

- Meta Muse Spark 1.3 performs research-scope classification and structured claim assessment.
- Native JSON-schema output constrains the assessment fields and evidence-gap decision.
- Meta can identify specific missing information and propose a bounded follow-up search query.
- The second assessment receives only validated passages returned by the application.
- Python retains authority over tool execution, selected-paper scope, call budgets, passage identity, source checks, and terminal state.

This is more than a provider swap: Meta's structured reasoning drives a visible evidence-seeking and abstention workflow, while deterministic application controls keep the result inspectable.

## Technical implementation

- FastAPI and Pydantic for the typed review API and validation.
- LangGraph for explicit nodes, conditional routing, and a bounded follow-up loop.
- LangChain Core for the typed selected-paper retrieval tool.
- PostgreSQL and pgvector for read-only semantic retrieval over the local corpus.
- React, TypeScript, and Vite for the review workspace and presentation mode.
- Browser-local versioned thread history and a selectable execution tree derived from actual backend events.
- Exact passage IDs, excerpt hashes, source labels, and quote validation are preserved in results.

## Safety and research boundaries

Oral-lens is limited to literature research. It does not accept patient cases or provide diagnosis, screening, individual prognosis, treatment recommendations, or medical advice. Model assessments remain unreviewed drafts. Source matching does not prove semantic or scientific correctness, and a missing excerpt does not prove that evidence is absent from the full paper or wider literature.

## What was built during the hackathon

- Meta Model API client with structured output and sanitized failure handling.
- Typed review schemas and conditional evidence-gap rules.
- Read-only selected-paper retrieval tool.
- Bounded LangGraph claim-review workflow.
- Exact source/citation checks and explicit stopping states.
- Shared CLI and FastAPI access to the workflow.
- React paper-selection and evidence-review workspace.
- Browser-local review threads, execution tree, and evidence inspector.
- Presentation view and validation documentation.
- Automated backend and frontend behavioral checks.

## Disclosed inherited foundation

The participant's earlier Oral Cancer X project supplied the FastAPI/PostgreSQL/pgvector corpus foundation, ingestion and embedding infrastructure, local paper data, and historical 3D visualization. Those components are disclosed as inherited and are not presented as new hackathon functionality. The repository contains a pinned source baseline, import hashes, and a detailed contribution manifest.

## Verified evidence

- 72 offline backend tests passed on 4 November 2026 after the selected-paper coverage update.
- Frontend session-history/execution-tree checks passed.
- TypeScript and the Vite production build passed.
- A live supported claim completed with one search and passing source checks.
- A live missing-detail claim completed two searches, detected repeated evidence, and stopped with `no_new_evidence` and `insufficient_evidence`.
- A live two-paper comparison added a second-search passage and stopped with `search_budget_exhausted` and `insufficient_evidence`.
- The connected corpus was inspected read-only: 146 papers and 4,666 passage rows.
- A read-only retrieval check with the previous two-paper example returned passages from both selected papers; this is a coverage check, not a scientific-quality result.

These observations verify specific software paths. They are not a clinical validation or a scientific-quality benchmark.

## Current limitations

- No public hosted application is included; the demo runs locally.
- Review results are drafts and thread history is browser-local.
- Durable researcher corrections, structured study comparison, and reviewed export are not implemented.
- A search returns at most six passages, so more than six selected papers cannot all be represented in one search; coverage is not semantic relevance.
- Browser automation and a scientific-quality evaluation set are not included.
- Corpus/source redistribution rights and the organizer's interpretation of Indie reuse remain separate submission considerations.

## Three-minute video script

### 0:00–0:18 — Problem

> A fluent literature summary can still overstate its sources. Oral-lens helps oral cancer researchers and students inspect whether a draft claim is supported by the papers they selected.

Show the presentation title and the research-workspace transition. Do not spend the demo on general disease statistics.

### 0:18–0:32 — Originality disclosure

> I reused my earlier pgvector corpus and embedding foundation. During this hackathon I built the Meta-powered evidence-review workflow, structured validation, bounded follow-up search, execution trace, and this React review workspace.

Show the contribution disclosure briefly.

### 0:32–0:55 — Select evidence scope

Open Product. Search for `SLC38A1`, select the prepared paper, and show the claim:

> The selected study reports its specimen type and outcome measures.

Explain that the user—not the model—chooses the paper scope.

### 0:55–1:35 — Run and inspect

Run Review once. While waiting, explain:

> LangGraph controls a bounded workflow. Meta returns typed assessments and may identify an evidence gap, but Python controls retrieval scope, validates cited passages, and limits the workflow to two searches.

When complete, show status, source-check state, and the execution tree. Open the assessment and one cited source passage.

### 1:35–2:12 — Honest insufficiency

Open the prepared prior thread for:

> The selected study reports the exact number of mouse specimens and their ages.

Show the two searches, repeated passage, `no_new_evidence`, and `insufficient_evidence` result.

> Oral-lens does not convert missing excerpts into an answer. It records what was searched and why the workflow stopped.

Using a previously completed browser-local thread is acceptable only if the narration calls it a prepared prior run, not a live model call.

### 2:12–2:35 — Engineering depth

Show the source ID/hash or run details briefly.

> Model assessment, mechanical source checks, and human-review status remain separate. Retrieved text is treated as data, and the connected corpus is read-only.

### 2:35–2:52 — Close

> Oral-lens turns a research statement into an inspectable evidence trail. It supports literature review; it does not provide medical advice or claim scientific validation.

End on the product, not the inherited 3D visualization.

## Recording checklist

- [ ] Video is 2:40–2:55, never over 3:00.
- [ ] Browser zoom and text are readable at video resolution.
- [ ] Notifications, API keys, database credentials, terminal history, and personal tabs are hidden.
- [ ] The prepared paper and claims are selected before recording.
- [ ] PostgreSQL, backend, and frontend are already running.
- [ ] One live run is attempted only once to control latency and credits.
- [ ] Any prior run is explicitly called a prepared prior run.
- [ ] Inherited versus new work is stated aloud and shown.
- [ ] No unimplemented comparison, correction, export, deployment, or validation claim is made.
- [ ] Repository and video URLs are public in an incognito window.

## Submission checklist

- [ ] Replace every bracketed placeholder in this file/form copy.
- [ ] Choose and add an appropriate repository license; do not assume public visibility alone is open source.
- [ ] Commit the verified working tree.
- [ ] Push the submission commit to the public repository.
- [ ] Confirm the repository default branch shows the new README and product code.
- [ ] Confirm no secret or ignored local artifact is included.
- [ ] Add the public video URL.
- [ ] Confirm track, theme, team members, and representative.
- [ ] Complete rights/attribution disclosures.
- [ ] Submit and preserve the confirmation before the participant's midnight target.

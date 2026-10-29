# Oral-lens documentation

Updated: 29 October 2026, Asia/Kolkata. These documents are the repository's design specification. They describe planned behavior unless explicitly marked implemented. They do not establish organizer approval or claim clinical validation.

## Product and primary user

Oral-lens helps oral cancer researchers and student literature reviewers compare what papers report and assess whether their draft conclusions are supported by inspected evidence.

The first target task is a student preparing a literature review from a small selected set of papers. A draft paragraph is the proposed demonstration starting point; a research question is also supported by the design. The precise research topic and demo papers have not been selected.

The useful result is an editable evidence brief containing a study comparison, source passages, claim assessments, reviewer corrections, and unresolved limitations.

## Read by task

| Document | Purpose |
| --- | --- |
| [workflow_lesson_02.md](workflow_lesson_02.md) | Conditional follow-up search, fixed corpus scope, deduplication, budgets and assessment history |
| [frontend_demo.md](frontend_demo.md) | Product/presentation views, live API wiring, source-checked population statistics and CLI comparison |
| [workflow_lesson_01.md](workflow_lesson_01.md) | First LangGraph implementation, quiz feedback, code walkthrough, API usage and verification limits |
| [tech_stack.md](tech_stack.md) | Framework decisions, component responsibilities, integration and deployment approach |
| [local_setup.md](local_setup.md) | Actual environment, connection, read-only inspection, abstract loader, and ingestion commands |
| [meta_setup.md](meta_setup.md) | Canonical Meta environment names, manual smoke test, provider error handling, and live-access verification limits |
| [uv_workflow.md](uv_workflow.md) | Project declarations, lockfile, dependency groups, run/add/sync, and compatibility exports |
| [database_inventory.md](database_inventory.md) | Observed connected database counts, text/vector checks, coverage, and limits |
| [coding_models.md](coding_models.md) | Why Codex can use Meta models and how development inference differs from product inference |
| [Frontend setup](../frontend/README.md) | React/TypeScript/Vite starter, Three.js, npm commands, and backend development proxy |
| [existing_product_diff.md](existing_product_diff.md) | Source-backed baseline comparison, substantive new work, measurable usefulness |
| [flow.md](flow.md) | User journey, tool contracts, state, provenance, errors, and exports |
| [hackathon_rules.md](hackathon_rules.md) | Rule snapshot, judging weights, behavioral boundaries, outstanding clarifications, submission checklist |
| [contribution_manifest.md](contribution_manifest.md) | Exact baseline references, inherited/new work classification, evidence for demo claims |
| [Repository skill](../.agents/skills/oral-lens-hackathon/SKILL.md) | Reusable instructions for Codex working on these tasks |

## MVP deliverables

1. A selected, rights-cleared literature corpus; begin with approximately 15–25 relevant papers if available.
2. Passage retrieval and a source viewer that preserve document identity and location.
3. Meta-powered structured extraction into an editable study comparison.
4. A claim audit with evidence links, missing-information handling, and bounded follow-up retrieval.
5. Saved researcher corrections and Markdown/HTML export with review status visible.
6. An independently annotated evaluation set, actual results, and a three-minute working demo of new functionality.

Hindi briefs and updating an existing review when a new paper arrives are stretch ideas. A new 3D explorer, voice, image analysis, medical advice, and a full systematic-review or meta-analysis engine are outside the MVP.

## Current status and next steps

- Present: inherited Python backend/ingestion/embedding/visualization code; project-local configuration; new read-only API/CLI inspection and a dry-run abstract loader. See local setup for verification limits.
- Copied locally at the participant's request: 149 raw metadata records, 146 curated records, 146 precomputed abstract embeddings, and historical visualization assets. These assets are ignored by Git; PDFs/full-text files were absent from the source checkout.
- Frontend demo: charcoal/blue product workspace connects paper search and the draft claim-review API; a separate presentation view includes sourced population statistics and chapter controls. TypeScript/production build pass; browser behavior and live end-to-end review remain unverified. Saved edits, study comparison, export and a React 3D map remain planned. See frontend_demo.md.
- Meta foundation: shared completion client, manual smoke test, and migrated inherited answer function use Meta_Muse_API_KEY/Meta_Muse_MODEL. The participant reported a successful basic live smoke test. The new non-persistent /reviews/assess graph has offline control-flow tests; combined live review behavior remains unverified. See workflow_lesson_01.md.
- Planned: Meta evidence-review tools, study comparison, claim audit, full React workspace, reviewed export, and quality benchmarks. A provider migration alone is not those capabilities. No measured research-workflow improvement is available yet.
- Verified read-only database: PostgreSQL 17.6, pgvector 0.8.1, 146 papers and 4,666 rows; full-text coverage 79 papers and caption coverage 72. See the inventory for checks and limits.
- Environment: uv project management, existing .venv reused, locked dependency groups, and 50 passing offline checks (16 setup, 18 Meta, 16 review/search checks).
- Pending: source rights for redistribution, Meta review-capability verification, and organizer clarification on Indie reuse, research scope, and build dates.

Continue independent design and new implementation within the agreed scope while clarifying dependencies. Record actual implementation and verification evidence in the manifest as work proceeds. Do not turn a pending clarification into a claim of approval.

## Documentation convention

Keep implementation status separate from design intent. When behavior changes, update the relevant document, source/API contracts, and contribution manifest together. Use source-backed examples or explicitly labeled synthetic fixtures. This directory is self-contained; it does not require the parent workspace's planning files.

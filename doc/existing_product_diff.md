# How Oral-lens differs from Oral Cancer X

Status: source-backed baseline comparison and planned product changes, 27 October 2026. The new application capabilities below are not implemented yet.

## The problem we intend to solve

The primary users are oral cancer researchers and student literature reviewers. The working hypothesis is that finding papers is only part of their workload: they also need to compare study methods and findings, check draft conclusions, and retain the supporting evidence for later review.

The intended outcome is a saved, editable evidence review that the user can inspect, correct, and export. Validate its usefulness through actual review tasks; disease importance alone does not measure product impact.

## Observed baseline

Source repository: [Oral Cancer X](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution).

Observed source commit: [`26749ed838fdcade14307e6314f3abf20543f404`](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/commit/26749ed838fdcade14307e6314f3abf20543f404), authored 15 July 2026. This is the upstream baseline, not a commit in Oral-lens. On 27 October, its local backend code and ignored corpus/model files were copied into Oral-lens at the participant's request. See [import_manifest.json](import_manifest.json) for original hashes and [local_setup.md](local_setup.md) for setup changes. The comparison below describes the fixed original baseline versus the still-planned new review workflow.

The [baseline README](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/blob/26749ed838fdcade14307e6314f3abf20543f404/README.md) describes resumable ingestion, abstract/full-text/caption embeddings, pgvector retrieval, Gemini generation, and a UMAP/Three.js explorer. It reports 146 papers and 4,666 embedded rows; those are historical reported counts, not a verified Oral-lens inventory.

In the reviewed [retrieval code](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/blob/26749ed838fdcade14307e6314f3abf20543f404/app/retrieval.py), matches are deduplicated by paper. The returned records omit matched `embedding_text` and `chunk_index`. The [generation code](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/blob/26749ed838fdcade14307e6314f3abf20543f404/app/llm.py) supplies abstracts to Gemini even when retrieval matched full text or captions. The [schema](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/blob/26749ed838fdcade14307e6314f3abf20543f404/db/models.py) contains embedding text and chunk identity but does not expose page/section provenance fields.

The prior app was not executed during the original documentation task. The subsequent setup adds local backend checks; these do not establish model quality or complete operation against the participant's database. Claims about missing baseline features refer to the inspected flow, not an exhaustive audit of every historical branch.

## Product and engineering comparison

| Dimension | Observed earlier project | Planned Oral-lens contribution |
| --- | --- | --- |
| Main task | Research question answering and corpus exploration | Study comparison and audit of a draft literature conclusion |
| Input | Question text | Research question or draft paragraph plus explicit corpus scope |
| Retrieval | Semantic matches grouped into paper records | Passage-level evidence with multiple passages per study and scoped follow-up retrieval |
| Generation context | Abstracts supplied to the answer prompt | Exact passages, surrounding context, study fields, and limitations |
| Model role | Generate a cited answer after retrieval | Extract structured findings, request evidence tools, assess support, propose review changes |
| Output | Answer text and source list | Persistent study table, claim assessments, provenance, reviewer changes, export |
| Verification | Prompt instructions requesting citations | Source-span/numerical checks plus separately evaluated semantic assessment |
| User control | Read the answer and inspect sources | Inspect fields, correct findings, accept/reject proposals, preserve revisions |
| Main interface | Query API and 3D embedding viewer | Evidence table, draft/claim panel, source viewer, actual run activity |
| Evaluation | No performance claim established by this review | Annotated extraction/support cases and measured research-task performance |

## What makes the difference substantive

A new model, more tool calls, multilingual output, or a redesigned chat box would not by themselves establish a useful new product. Retrieval remains part of Oral-lens; the additional work must change what the user can accomplish.

The MVP should meet all these observable conditions:

1. A reviewer can compare relevant study fields side by side and see explicitly missing values.
2. An extracted finding opens at its exact passage, with stable document identity and available location information.
3. A draft claim has evidence-linked assessments, including insufficient support and non-comparable studies when applicable.
4. The model can request a targeted follow-up search and retain the actual sources inspected.
5. User corrections are saved; model proposals cannot silently become user-reviewed findings.
6. Export preserves citations, review state, corpus limits, and unresolved issues.

The organizer determines eligibility under the basic-RAG exclusion. These acceptance conditions are our product and engineering commitments, not a guarantee of approval.

## Reuse versus new work

Potential inherited infrastructure includes ingestion stages, embedding code/model choice, persistence helpers, and retrieval foundations. Reuse requires an appropriate rights basis, attribution, and clarification of the Indie-track rule. Existing code remains inherited even if copied into a fresh repository or wrapped as a tool.

Planned new work includes passage provenance, the Meta adapter/tool loop, structured study records, source validation, claim/comparability assessment, the review workspace, revision handling, exports, and an evaluation harness. Classify modified inherited components separately from wholly new modules. Track exact paths, dates, and evidence in [contribution_manifest.md](contribution_manifest.md).

## Demonstration scenario

Select real papers after inspecting the available rights-cleared corpus. A student submits a draft conclusion, sees the studies behind it, opens a methods/limitations passage, and corrects an overstated interpretation if the sources establish that it is overstated. The student saves and exports the review.

The demo must work for both a supported claim and an insufficiently supported claim. Do not invent disagreements, sample sizes, source quotations, or results to create a dramatic correction. Synthetic development fixtures must be labeled and cannot masquerade as findings from real studies.

## Measure usefulness before claiming it

Use approximately 30 independently annotated cases covering extraction, supported/unsupported claims, missing evidence, numerical errors, non-comparable studies, and out-of-scope medical requests. Record annotator expertise, cases, expected outcomes, model/prompt/corpus versions, and actual failures.

Compare, where applicable, the old retrieve-and-answer flow, a single Meta generation pass, and the new workflow on the same evidence and task. Report extraction correctness, citation/quote fidelity, semantic-support precision, abstention, latency, and usage/cost when available. Report denominators and coverage alongside precision so blanket abstention does not look like success.

If potential users are available, observe two or three researchers/students completing comparable tasks with and without Oral-lens. Record completion time, correction burden, and output quality; account for order/learning effects. Small-sample usability evidence is exploratory. Until measurements exist, all improvement claims remain hypotheses, not results or clinical validation.

## Judging connection

- Impact (30%): a useful reviewed artifact and observed user value.
- Meta tooling (25%): effective evidence-seeking and structured work in the live product.
- Technical execution (20%): traceable records, evaluated checks, failures handled, reproducible implementation.
- Demo (25%): a complete visible review with source inspection and an export.

Keep inherited functionality out of the feature showcase and disclose it as foundation. Detailed rules and remaining clarifications are in [hackathon_rules.md](hackathon_rules.md).

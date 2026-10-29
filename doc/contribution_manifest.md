# Contribution manifest

Updated: 29 October 2026. Purpose: distinguish prior work, modifications to inherited components, and genuinely new hackathon work. This is an evidence record, not a statement of organizer approval.

## Baselines

| Baseline | Exact reference | Meaning |
| --- | --- | --- |
| Oral-lens initial repository | `18daa0024e2b558df459e63e46064e009a7a85d0`, authored 25 October 2026 | Initial README before this documentation task; not a functioning application |
| Oral Cancer X source baseline | [`26749ed838fdcade14307e6314f3abf20543f404`](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/commit/26749ed838fdcade14307e6314f3abf20543f404), authored 15 July 2026 | Local source checkout matches this commit; 28 source/static files copied on 27 October, then selected files adapted for local setup |

The initial Oral-lens commit predates the stated build window. Its existence is disclosed, not presented as event implementation. A source commit and a destination commit are different references; record both for future imports.

## Imported inherited foundation

On 27 October the participant explicitly instructed Codex to copy their local Oral Cancer X code/functionality into Oral-lens and prepare environment files for database inspection. That instruction authorizes the local copy. It does not establish organizer approval for Indie reuse or third-party asset redistribution rights. No remote publication or database write was performed.

[import_manifest.json](import_manifest.json) records all 28 source/static paths and original SHA-256 hashes, whether each file is unchanged or modified, destination hashes at setup, and hashes/sizes of five ignored local artifacts. The source checkout remains unchanged. Later changes must update attribution/classification; the hashes describe the setup snapshot, not an automatic integrity service.

| Existing component | Location in Oral Cancer X | Imported use | Evidence and changes |
| --- | --- | --- | --- |
| Resumable ingestion | `ingestion/*.py` | Copied stages; project-local paths, lazy stage imports, configurable discovery, explicit writes | Source paths/hashes in JSON manifest; visualization-only stage executed on 27 October; no discovery/embedding ingestion performed |
| Embedding implementation | `embeddings/*.py` | Copied code; lazy transformer import, configurable model, write checks before model loading | Inherited model choice; model weights not downloaded by setup |
| Persistence | `db/database.py`, `db/models.py`, `db/upsert.py` | Adapted URL/env handling, enforced inspection read-only transactions, explicit schema/write guard, actual insert counts | No live database schema creation or ingestion; tests cover guards |
| Retrieval | `app/retrieval.py` | Copied unchanged | Historical paper-deduplicated retrieval; not the new provenance-aware review search |
| Generation | `app/llm.py`, `app/main.py` | Inherited retrieval/prompt/source formatting; on 29 October provider changed to shared Meta client, query still disabled by default | Modified inherited behavior; not the new review workflow; no successful live model call or generation-quality claim |
| Explorer | `static/visualize.html`, `app/visualize.py`, `app/viz_routes.py`, `embeddings/build_visualization.py` | Copied inherited display; local paths and optional warm-up | Local model/manifest rebuilt from 4,666 rows; stored-vector transform and GET routes verified; inherited functionality excluded from new-feature showcase |
| Local data/model files | Two data JSON files, abstract embedding JSON, UMAP joblib and manifest | Copied locally and ignored by Git | 149 raw metadata records; 146 curated and embedded abstracts; no PDFs/full-text/images were present; no redistribution clearance claimed |

Do not import all prior content merely because it is public. The participant's ownership and third-party permissions must be established for the actual files/assets used. Changing a provider or wrapper does not make the entire inherited component new.

## Work completed in this repository

| Contribution | Paths | Date | Classification | Evidence and limits |
| --- | --- | --- | --- | --- |
| Documentation index and product scope | `README.md`, `doc/README.md` | 27 Oct 2026 | New documentation; root README extends an inherited title | Files exist; links and implementation-status claims checked in the documentation task |
| Technology decisions | `doc/tech_stack.md` | 27 Oct 2026 | New design documentation | Design only; no installed/runtime compatibility claim |
| Baseline comparison | `doc/existing_product_diff.md` | 27 Oct 2026 | New analysis based on disclosed prior sources | Source references pinned; new review features still planned |
| Review/tool workflow | `doc/flow.md` | 27 Oct 2026 | New design documentation | Contracts and diagrams only; no working tool claim |
| Rules/judging reference | `doc/hackathon_rules.md` | 27 Oct 2026 | Organizer material transcribed/summarized with project interpretation | Participant guide and screenshot attributed; not original organizer rules authored by us |
| Contribution tracking | `doc/contribution_manifest.md` | 27 Oct 2026 | New provenance record | Initial references and current work classified |
| Codex repository guidance | `AGENTS.md`, `.agents/skills/oral-lens-hackathon/SKILL.md` | 27 Oct 2026 | New development instructions | Skill format and local references checked; instructions do not guarantee agent behavior or eligibility |
| Local configuration/environment | `.env.example`, `.gitignore`, `utils/settings.py`, `requirements-core.txt`, `requirements-dev.txt`, `requirements-lock.txt`, `doc/local_setup.md`; modified inherited `requirements.txt` | 27 Oct 2026 | New setup tooling plus inherited dependency choices | Isolated Python 3.13 environment installed; dependency consistency checked; real `.env` and artifacts ignored |
| Read-only inspection | `db/inspection.py`, `app/db_routes.py`, `scripts/inspect_db.py` | 27 Oct 2026 | New setup functionality | After participant configured credentials, read-only status and sample data succeeded: 146 papers, 4,666 rows; no database changes |
| Existing-embedding loader | `scripts/load_local_abstracts.py` | 27 Oct 2026 | New local import helper | Dry run validated 146 768-dimensional abstract records without DB access; no insertion performed |
| Setup behavioral checks | `tests/test_setup.py` | 27 Oct 2026 | New automated checks | 16 tests pass, including Windows Unicode-output regression, startup/config, read-only guards and dry-run imports; not a research-quality benchmark |
| uv project migration | `pyproject.toml`, `uv.lock`, `.python-version`, generated `requirements*.txt`, `doc/uv_workflow.md` | 27 Oct 2026 | New environment/project management | Existing environment reused; locked offline sync and uv-run tests pass; no database or model-provider configuration changed |
| Database coverage inventory | `doc/database_inventory.md` | 27 Oct 2026 | New read-only analysis | Explicitly read-only checks of source coverage, 768-dimensional vectors, empty text and duplicate keys; not scientific validation |
| Visualization artifact refresh | Ignored `embeddings/models/umap_model.joblib`, `embeddings/models/viz_manifest.json`; `doc/visualization_build.json` | 27 Oct 2026 | Regenerated local output of inherited functionality | 4,666 finite 3D points across 146 papers; source counts and database IDs match; stored-vector transform and both GET routes pass; no database write or new-model feature claimed |
| Frontend foundation | `frontend/` including package.json, package-lock.json, src, and vite.config.ts | 27 Oct 2026 | Vite create-vite 9.3.1 React/TypeScript template plus new project starter content and local API proxy; third-party packages remain their authors' work | React 19.3.1, Three.js 0.186.1 and TypeScript types installed; npm dependency tree and Three.js Scene/camera imports checked; TypeScript and production build pass; no review interface, browser/WebGL rendering, or new visualization capability claimed |
| Meta client and smoke test | `app/muse.py`, `test_muse_llm.py`, `tests/test_muse.py`, `.env.example`, provider updates in `app/llm.py`/`app/main.py`, and `doc/meta_setup.md` | 29 Oct 2026 | New shared client/test tooling plus modified inherited answer function | Canonical Meta_Muse settings, bounded requests, sanitized errors; 18 new mocked checks plus 16 prior checks pass; key absent, no live request, no billing-verification outcome claimed |

No commit or push has been made by these tasks. Record the real destination commit when files are committed; never invent a SHA. Inherited backend and setup work do not substitute for the planned new review product.

## Planned event contributions

| Feature | Expected code/data area | Status | Evidence needed before showcasing |
| --- | --- | --- | --- |
| Passage provenance and source viewer | Backend passage records, migrations, frontend source panel | Planned | Passage/version identity, source location accuracy, missing-location behavior |
| Meta provider adapter and bounded tool loop | `app/muse.py` completion transport present; review tool loop remains to build | Partially implemented; live access unverified | Successful real Meta run plus actual review tool events and budget/error handling still required |
| Structured study comparison | Finding records and review workspace | Planned | Source-linked fields, missing values, independently annotated extraction cases |
| Claim and comparability assessment | Claim records and assessment flow | Planned | Supported/insufficient/non-comparable cases with actual source evidence and measured errors |
| Researcher edits and revision history | Review APIs and frontend controls | Planned | Persisted corrections, stale-write protection, user-only reviewed state |
| Reviewed Markdown/HTML export | Export endpoint and UI action | Planned | Saved revision matches export, citations/status/limits preserved |
| Evaluation harness and results | Evaluation fixtures, scripts, reports | Planned | Independent references, actual runs, denominators, baseline comparison and limitations |
| Public working demo | Deployment configuration and demo script | Planned | Accessible product, repeatable scenario, three-minute new-work video |

Areas in the planned-feature table are conceptual and do not claim those modules exist. Replace them with real paths as implementation lands. The imported corpus-inspection helpers and abstract loader do not implement the planned AI tools or evidence-review workflow. Reclassify edits to imported code as modified inherited work, even when the resulting capability is new.

## Updating this record

For each implemented contribution record actual file paths, source/import references where applicable, work date, inherited/modified/new classification, destination commit when available, verification evidence, and whether it is included in the demo. Keep source licenses and asset permissions with the imported content or linked inventory.

Change planned to implemented only after the code exists, and to verified only after the relevant check/run passes. Keep failures and caveats. Do not turn a proposal, mock, or replay into a live-feature claim. Read [hackathon_rules.md](hackathon_rules.md) before preparing submission statements.

## First claim-review slice: 29 October 2026

New work: app/review_schemas.py, app/review_search.py, app/review_workflow.py, app/review_routes.py and tests/test_review.py; route integration modifies inherited app/main.py. LangGraph and LangChain Core are third-party dependencies installed and locked with uv; requirements exports regenerated. The graph performs scope classification, read-only selected-paper passage search, Meta draft assessment and exact source checks. Sixteen synthetic workflow/search checks plus 34 earlier tests pass (50 total). Tests are offline; the combined database/Meta workflow and retrieval quality are not live-verified. No DB writes, commit, push, human review, persistence, UI or export are claimed. See [lesson 1](workflow_lesson_01.md). The participant separately supplied successful basic Meta smoke output (MUSE_OK, 33 tokens, 2.97 seconds); this is user-reported evidence, not an agent-run review benchmark.

## Frontend demo views: 29 October 2026

New React product/presentation implementation in frontend/src/App.tsx, App.css and index.css replaces the local starter. Participant screenshots in frontend/reference_designs guide the charcoal/blue appearance; screenshots and third-party logos are not embedded. Product wires existing read-only paper APIs and the new draft review API, with source/assessment/human statuses separate and request JSON for CLI comparison. Presentation includes source-checked 2024 IARC estimates, research-task framing, chapter controls and an explicitly inherited map link. See [frontend demo](frontend_demo.md) for sources and limits. TypeScript, Vite production build and server-rendered content checks pass; browser interaction/layout and live UI-to-Meta behavior are unverified. No deployment, DB write, model request, saved corrections or export implemented in this frontend task.

Frontend icon repair, 29 October 2026: replaced corrupted text glyphs in product/presentation controls and branding with a shared inline SVG component (frontend/src/Icon.tsx); repaired affected punctuation and CSS separator. TypeScript and production build pass. No backend change or new dependency.

Terminal review command, 29 October 2026: new scripts/review_cli.py reuses read-only inspection and the same run_review function as FastAPI. Supports paper listing, interactive/argument/JSON request input, check-only validation, structured output and meaningful exit codes. Four new CLI checks pass; 54 total offline tests pass. No new dependency, DB writes or live model call in this task.

Scope-check failure repair, 29 October 2026: app/review_workflow.py raises the scope output limit from 128 to 512 and reports safe stage diagnostics; app/review_schemas.py adds diagnostics; app/muse.py preserves finish metadata on empty output. Live scope-only reproduction failed with empty output at 128, then succeeded at 512 (264 completion tokens, 400 total). No patient data, database access or retries in those two diagnostic calls. Four new regression cases; 58 offline tests pass. Full live retrieval/assessment remains unverified.

Bounded follow-up review, 29 October 2026: new assessment gap/query schema and LangGraph conditional routing in app/review_schemas.py and app/review_workflow.py, with at most two scoped searches and three Meta calls. Deduplicates passage IDs, preserves source identity, rejects scope changes, records per-search/assessment history and explicit no-new-evidence/budget stops. Eleven new offline regression cases in tests/test_follow_up.py; 69 total tests pass. Frontend displays search count, stop reason and warnings; TypeScript/Vite build pass. See [lesson 2](workflow_lesson_02.md). No live two-search run, DB write, persistence or native tool-calling integration claimed. Earlier participant-supplied single-search output reached awaiting_review with matching source quotes; it is not a scientific-quality benchmark.

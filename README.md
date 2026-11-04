# Oral-lens

Oral-lens is a Meta-powered evidence-review workspace for oral cancer researchers and student literature reviewers. A reviewer selects papers, enters a research claim, and receives a source-linked draft assessment that can explicitly stop with insufficient evidence.

It is a literature-research tool. It does not accept patient cases or provide diagnosis, screening, prognosis, treatment recommendations, or medical advice.

## Why it exists

Ordinary retrieval chat can produce fluent answers while hiding whether the selected papers actually support a statement. Oral-lens keeps the review process inspectable:

- retrieval is restricted to papers selected by the reviewer;
- retrieval allocates a passage per selected paper when the evidence budget permits, and identifies papers with no returned passage;
- exact passages retain local source identity and hashes;
- Meta returns a typed assessment with limitations and cited passage IDs;
- Python checks cited IDs and exact quotations before displaying the draft;
- a bounded LangGraph workflow may run one focused follow-up search;
- repeated or unavailable evidence produces an explicit stopping reason;
- the interface separates model assessment, mechanical source checks, and human-review status;
- browser-local threads preserve the original claim, paper scope, results, and execution trace.

Source validation does not prove scientific correctness. Results remain unreviewed drafts, and missing evidence in the inspected excerpts does not prove that evidence is absent from the full paper or wider literature.

## Working demo flow

1. Search the connected corpus and select up to ten papers.
2. Enter a literature claim or comparison question.
3. Inspect the scope check, selected-paper retrieval, Meta assessment, source checks, and any bounded follow-up search.
4. Open the exact passages cited by the assessment.
5. Review the terminal state, limitations, and unresolved evidence gaps.
6. Revisit prior runs through browser-local thread history and the execution tree.

The current MVP does not persist researcher corrections to the server, generate a reviewed export, or claim systematic-review coverage.

## New hackathon work

The event-built product work includes:

- a shared Meta Model API client with bounded requests, structured-output support, and sanitized failures;
- typed claim-review schemas and native JSON-schema constraints;
- a read-only selected-paper retrieval tool;
- a LangGraph workflow for scope checking, retrieval, assessment, source validation, and bounded follow-up search;
- explicit insufficient-evidence, repeated-evidence, validation-failure, and budget-exhaustion states;
- a CLI that runs the same review workflow as the HTTP API;
- a React product workspace with paper selection, review threads, an execution tree, and focused evidence inspection;
- a separate presentation view for the problem, workflow, and live-product handoff;
- offline backend and frontend behavioral checks.

See the [contribution manifest](doc/contribution_manifest.md) for dates, paths, classifications, verification evidence, and limitations.

## Inherited foundation

Oral-lens builds on the participant's earlier [Oral Cancer X](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution) project. The inherited foundation includes the FastAPI/PostgreSQL/pgvector corpus infrastructure, ingestion and embedding foundations, local paper data, and the historical 3D visualization.

Those components are disclosed as inherited and are not presented as new hackathon functionality. The exact source baseline and imported-file hashes are recorded in [the import manifest](doc/import_manifest.json).

## Architecture

```text
React + TypeScript
        |
        v
FastAPI review API
        |
        v
Bounded LangGraph workflow
   |                 |
   v                 v
Meta Model API   LangChain retrieval tool
                         |
                         v
                 PostgreSQL + pgvector
```

Python—not the model—controls paper scope, call budgets, passage validation, terminal states, and human-review authority. The connected corpus is accessed read-only by the review workflow.

## Run locally

Requirements:

- Python 3.13 and [uv](https://docs.astral.sh/uv/)
- Node.js and npm
- PostgreSQL with pgvector and the configured local corpus
- a Meta Model API key

Create an ignored root `.env` from `.env.example`, then set the local database values and:

```dotenv
Meta_Muse_API_KEY=
Meta_Muse_MODEL=muse-spark-1.3
DB_READ_ONLY=true
```

Never commit the real `.env`.

Install and start the backend:

```powershell
uv sync --locked
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, start the frontend:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open:

- Product workspace: `http://127.0.0.1:5173/#product`
- Presentation mode: `http://127.0.0.1:5173/#present`
- FastAPI documentation: `http://127.0.0.1:8000/docs`

Submitting a claim uses Meta API credits. Do not enter patient information.

## CLI review

List papers:

```powershell
uv run python -m scripts.review_cli papers --limit 12 --search "tongue"
```

Run an interactive review:

```powershell
uv run python -m scripts.review_cli review
```

Validate input without using the database or Meta API:

```powershell
uv run python -m scripts.review_cli review --check-only
```

## Verification

Run the offline backend suite:

```powershell
uv run --locked --offline pytest -q
```

Run the frontend checks:

```powershell
cd frontend
npm.cmd run test:session
npm.cmd run build
```

Submission audit on 4 November 2026:

- 72 backend tests passed after the selected-paper coverage update;
- session-history and execution-tree checks passed;
- TypeScript and the Vite production build passed;
- `.env` and `.env.meta` were confirmed ignored;
- Meta configuration was detected locally without sending a request.
- A read-only two-paper retrieval check returned passages from both selected papers.

These checks establish software behavior covered by the tests. They are not clinical validation or a scientific-quality benchmark.

## Documentation

- [Hackathon execution plan](doc/hackathon_execution_plan.md)
- [Rules, judging rubric, and submission checklist](doc/hackathon_rules.md)
- [Current interface validation record](doc/interface_validation.md)
- [Workflow lesson 1](doc/workflow_lesson_01.md)
- [Bounded follow-up workflow](doc/workflow_lesson_02.md)
- [Review threads and execution tree](doc/session_threads.md)
- [Technology stack](doc/tech_stack.md)
- [Product differentiation](doc/existing_product_diff.md)
- [User and AI workflow](doc/flow.md)
- [Database inventory](doc/database_inventory.md)
- [Local setup](doc/local_setup.md)
- [Meta setup](doc/meta_setup.md)
- [Contribution manifest](doc/contribution_manifest.md)

## Current limitations

- No public hosted deployment is included.
- Review results and thread history are local drafts; thread history uses browser storage.
- Researcher corrections, durable revision history, structured study comparison, and reviewed export remain future work.
- Retrieval quality has not been established through a scientific benchmark.
- The historical visualization and corpus foundation are inherited.
- Source redistribution rights and hackathon interpretation of Indie reuse must be handled independently of the software checks.

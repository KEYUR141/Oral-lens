# Oral-lens

<div align="center">

### From a research claim to an inspectable evidence trail

**A Meta-powered literature-review workspace for oral cancer researchers and student reviewers.**

[![Meta Model API](https://img.shields.io/badge/Meta_Model_API-Muse_Spark_1.3-0668E1?style=for-the-badge&logo=meta&logoColor=white)](https://dev.meta.ai/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.x-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Bounded_Workflow-1C3C3C?style=for-the-badge)](https://docs.langchain.com/oss/python/langgraph/overview)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)

[Problem](#the-problem) · [Product](#see-the-product) · [Workflow](#how-a-review-works) · [Architecture](#architecture) · [Run locally](#run-locally) · [Evidence](#verification)

</div>

> [!IMPORTANT]
> Oral-lens supports **literature research**. It does not accept patient cases or provide diagnosis, screening, prognosis, treatment recommendations, or medical advice. Every model assessment is an unreviewed draft.

## The problem

A fluent literature answer can still overstate its sources. Reviewers must determine whether a claim is supported by the papers they selected, which exact passages support it, what information is missing, and whether a follow-up search found anything new.

Basic retrieval chat usually hides that process behind one answer box. Oral-lens keeps it visible:

- the reviewer chooses the paper scope;
- retrieval stays inside that scope and exposes uncovered papers;
- Meta returns a typed assessment with cited passage IDs and limitations;
- Python validates the cited IDs and exact quotations;
- one bounded follow-up search can target a specific evidence gap;
- repeated or unavailable evidence produces an explicit stopping reason;
- model assessment, mechanical source checks, and human review remain separate.

## See the product

### Browse the existing corpus and choose the scope

Reviewers can browse titles, search stored document content, preview stored excerpts, and manually select up to ten papers. Search suggestions never become evidence automatically.

![Oral-lens paper library with title browsing, document search, manual selection, and execution-tree preview](output_ss/paper-library.png)

### Follow the completed review

Each run is preserved as a browser-local thread. The execution tree exposes scope classification, searches, new passages, the Meta draft, source checks, and the terminal state. Selecting a node opens its real run data and source text.

![Completed Oral-lens evidence review with selected papers, Meta draft, execution tree, source checks, and human-review status](output_ss/evidence-review.png)

<details>
<summary><strong>See the corpus inventory and presentation workflow</strong></summary>

The presentation starts with source-linked 2024 estimates for lip and oral cavity cancer. These population figures establish research context; they are not a measured outcome of Oral-lens.

![Oral-lens research context showing source-linked 2024 lip and oral cavity cancer estimates](output_ss/research-context.png)

The connected read-only corpus contains 146 papers and 4,666 stored rows. Row counts describe stored abstracts and extracted passages; they do not measure paper completeness or scientific validity.

![Read-only Oral-lens corpus inventory showing paper and stored-row coverage](output_ss/corpus-inventory.png)

The presentation mode explains the implemented review in four steps.

![Oral-lens presentation showing the bounded inspectable review workflow](output_ss/bounded-workflow.png)

</details>

## How a review works

```mermaid
flowchart LR
    U[Reviewer selects papers<br/>and enters a claim] --> S[Scope check]
    S -->|Literature research| R[Selected-paper retrieval]
    S -->|Medical advice or<br/>patient request| X[Stop: out of scope]
    R --> M[Meta typed assessment]
    M -->|Evidence sufficient| V[Validate passage IDs<br/>and exact quotes]
    M -->|Specific evidence gap| Q[Meta proposes one<br/>focused query]
    Q --> G{Python guardrails}
    G -->|Same paper scope<br/>and budget available| R2[One follow-up search]
    G -->|Invalid or exhausted| I[Stop: insufficient evidence]
    R2 -->|New passages| M2[Meta reassessment]
    R2 -->|Repeated or no evidence| I
    M2 --> V
    V --> O[Inspectable draft<br/>awaiting human review]
```

The model reasons about the claim and available passages. The application controls retrieval scope, call budgets, passage identity, validation, and terminal states. The graph performs at most **two searches and three Meta calls**.

### What the reviewer can inspect

| Layer | What Oral-lens shows | What it does not claim |
| --- | --- | --- |
| Retrieval | Exact stored excerpts, paper identity, source type, local passage ID | That similarity proves scientific relevance |
| Meta assessment | Support status, explanation, cited passages, limitations, evidence gap | That a model response is scientific truth |
| Source checks | Whether cited IDs exist and quotes occur in their referenced excerpts | That matching text semantically proves the claim |
| Human review | Explicit `not reviewed` or reviewer-controlled state | Automatic expert approval |

## Why Meta is central

Oral-lens uses **Muse Spark 1.3 through Meta Model API** for:

1. research-scope classification before retrieval;
2. JSON-schema constrained claim assessment;
3. identifying the exact missing information;
4. proposing a focused follow-up query; and
5. reassessing the claim after new passages are returned.

This is not a provider label on top of retrieval. Meta drives the evidence-gap decision inside the graph, while deterministic application code decides whether any proposed search is allowed and verifies the returned citations.

## Architecture

```mermaid
flowchart TB
    subgraph Client[React + TypeScript]
        UI[Paper library and claim composer]
        TREE[Review threads and execution tree]
        INSPECT[Passage and run inspector]
    end

    subgraph API[FastAPI + Pydantic]
        ROUTES[Typed review and inspection APIs]
        GRAPH[Bounded LangGraph workflow]
        CHECKS[Scope, budget, citation and quote checks]
    end

    subgraph Intelligence[Reasoning and retrieval]
        META[Meta Model API<br/>Muse Spark 1.3]
        TOOL[LangChain selected-paper search tool]
    end

    subgraph Data[Read-only research corpus]
        PG[(PostgreSQL + pgvector)]
        CORPUS[146 papers<br/>4,666 stored rows]
    end

    UI --> ROUTES
    ROUTES --> GRAPH
    GRAPH --> META
    GRAPH --> TOOL
    GRAPH --> CHECKS
    TOOL --> PG
    PG --> CORPUS
    GRAPH --> TREE
    CHECKS --> INSPECT
```

| Area | Technology | Responsibility |
| --- | --- | --- |
| Interface | React 19, TypeScript, Vite | Paper discovery, local threads, execution tree, evidence inspection, presentation mode |
| API | FastAPI, Pydantic | Typed request/response contracts and sanitized failures |
| Orchestration | LangGraph | Explicit nodes, conditional routing, and bounded follow-up |
| Retrieval tool | LangChain Core | Read-only search restricted to user-selected paper IDs |
| Model | Meta Model API, Muse Spark 1.3 | Scope classification, structured assessment, evidence-gap reasoning |
| Corpus | PostgreSQL, pgvector | Stored abstracts, full-text chunks, captions, and embeddings |
| Environment | uv | Reproducible Python dependency and command workflow |
| Visualization | Three.js | Themed rendering of the inherited 3D corpus projection |

## Hackathon contribution boundary

Transparent attribution is part of the product story.

| Inherited from the earlier Oral Cancer X project | Built during this hackathon |
| --- | --- |
| PostgreSQL/pgvector corpus and local paper data | Meta Model API client and structured-output contracts |
| Ingestion and embedding foundation | Selected-paper retrieval with coverage reporting |
| Original FastAPI foundation | Bounded LangGraph review and follow-up workflow |
| Historical UMAP/3D visualization data | Citation and exact-quotation validation |
|  | Explicit insufficient/repeated-evidence states |
|  | Shared CLI and review API |
|  | React paper library, review threads, execution tree, and evidence inspector |
|  | Themed in-page corpus view and presentation mode |

The pinned baseline, imported-file hashes, dates, classifications, and verification evidence are in the [contribution manifest](doc/contribution_manifest.md) and [import manifest](doc/import_manifest.json).

## Run locally

### Requirements

- Python 3.13 and [uv](https://docs.astral.sh/uv/)
- Node.js and npm
- PostgreSQL with pgvector and the configured corpus
- Meta Model API credentials

Create an ignored `.env` from `.env.example` and configure the database plus:

```dotenv
Meta_Muse_API_KEY=
Meta_Muse_MODEL=muse-spark-1.3
DB_READ_ONLY=true
```

Never commit the real `.env`.

### Start the backend

```powershell
uv sync --locked
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Start the frontend

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

| View | Local URL |
| --- | --- |
| Product workspace | `http://127.0.0.1:5173/#product` |
| Presentation mode | `http://127.0.0.1:5173/#present` |
| FastAPI documentation | `http://127.0.0.1:8000/docs` |

Submitting a review uses Meta API credits. Do not enter patient information.

## CLI review

The CLI and HTTP API call the same workflow.

```powershell
# Browse papers
uv run python -m scripts.review_cli papers --limit 12 --search "tongue"

# Run an interactive review
uv run python -m scripts.review_cli review

# Validate input without the database or Meta API
uv run python -m scripts.review_cli review --check-only
```

## Verification

The latest repository checks establish covered software behavior, not clinical validity or scientific accuracy.

| Check | Verified result |
| --- | --- |
| Backend suite | **74 tests passed** |
| Frontend session state | History round-trip, interruption, corruption, scope snapshot, and tree checks passed |
| Frontend build | TypeScript and Vite production build passed |
| Connected corpus | Read-only inspection returned **146 papers / 4,666 rows** |
| Supported live path | One search, source checks passed, draft awaiting human review |
| Missing-detail live path | Two searches, repeated evidence detected, `no_new_evidence`, `insufficient_evidence` |
| Two-paper retrieval | Returned passages from both selected papers when the six-passage budget permitted |
| Content discovery | Exact SLC38A1 text match ranked before broader embedding suggestions |

Run the checks locally:

```powershell
uv run pytest -q

cd frontend
npm.cmd run test:session
npm.cmd run build
```

## Current limitations

- The application is demonstrated locally; no public hosted product is included.
- Review results are drafts and thread history is stored in the browser.
- Durable researcher corrections, structured study comparison, and reviewed export are future work.
- Stored excerpts do not provide verified PDF page or document-version provenance.
- Retrieval quality has not been established with an independently annotated scientific benchmark.
- The corpus, embeddings, and historical visualization foundation are inherited.

## Documentation

| Read this | For |
| --- | --- |
| [Submission package](doc/submission_package.md) | Form copy, three-minute demo flow, and final checklist |
| [Contribution manifest](doc/contribution_manifest.md) | New/inherited classification and verification history |
| [Workflow specification](doc/flow.md) | User, AI, validation, and failure flows |
| [Technology stack](doc/tech_stack.md) | Architecture and dependency decisions |
| [Product differentiation](doc/existing_product_diff.md) | Earlier project versus Oral-lens |
| [Interface validation](doc/interface_validation.md) | Recorded live paths and known failures |
| [Local setup](doc/local_setup.md) | Environment, database, and runtime instructions |
| [Meta setup](doc/meta_setup.md) | Provider configuration and smoke testing |
| [Hackathon rules](doc/hackathon_rules.md) | Supplied rules, judging rubric, and submission checks |

---

<div align="center">

**Oral-lens makes the boundary between a claim, its evidence, and its uncertainty visible.**

Research support only · Human verification required

</div>

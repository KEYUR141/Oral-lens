# Oral-lens

An oral cancer literature review workspace for researchers and student literature reviewers. The planned product compares studies, links findings to source passages, and helps researchers check draft conclusions and export a reviewed evidence brief.

**Status: inherited backend, local database tooling, frontend starter, and Meta completion client, 29 October 2026.** The Meta smoke test and shared answer client are implemented; live model access is not yet verified. The evidence-review workflow, complete React workspace, benchmark results, and deployment remain planned.

## Test Meta Muse

Set `Meta_Muse_API_KEY` locally in `.env` and choose `Meta_Muse_MODEL` (the example uses `muse-spark-1.3`). Then run:

```powershell
uv run python test_muse_llm.py --check-config
uv run python test_muse_llm.py
```

The first command checks settings without a request; the second makes one bounded API call and reports success or a sanitized provider/network error. See [Meta setup](doc/meta_setup.md). No billing verification is bypassed.

## Connect and inspect your database

The configured database was checked read-only: **146 papers, 4,666 rows**. See the [inventory and coverage report](doc/database_inventory.md). Keep credentials in the ignored root `.env` and `DB_READ_ONLY=true` while inspecting. The isolated `.venv` is now managed by uv.

```powershell
uv sync --locked
uv run python -m scripts.inspect_db status
uv run python -m scripts.inspect_db papers --limit 10
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for database status, paper metadata, and passage browsing. No LLM key is needed. See [local setup](doc/local_setup.md) for dependency installation, connection options, a dry-run loader for the copied abstract embeddings, and explicit ingestion commands.

## Frontend starter

The [frontend](frontend/README.md) contains React, TypeScript, Vite, and Three.js. Start it in a separate terminal:

```powershell
cd frontend
npm.cmd run dev
```

Open `http://127.0.0.1:5173`. The development server proxies `/api/*` to the backend on port 8000. Use `npm.cmd ci` to install the locked frontend dependencies on a fresh checkout and `npm.cmd run build` to type-check and build. The study-review interface and React-based 3D scene remain future work.

## Project documentation

- [Documentation index and MVP](doc/README.md)
- [Local environment and database setup](doc/local_setup.md)
- [Meta Muse configuration and smoke test](doc/meta_setup.md)
- [uv project workflow](doc/uv_workflow.md)
- [Existing database inventory](doc/database_inventory.md)
- [Codex with Meta coding models](doc/coding_models.md)
- [Technology stack](doc/tech_stack.md)
- [Differences from Oral Cancer X](doc/existing_product_diff.md)
- [User flow, AI tools, and failure behavior](doc/flow.md)
- [Hackathon rules, judging, and submission checks](doc/hackathon_rules.md)
- [Inherited and new contribution manifest](doc/contribution_manifest.md)

## Codex instructions

Start with [AGENTS.md](AGENTS.md). The repository skill is [oral-lens-hackathon](.agents/skills/oral-lens-hackathon/SKILL.md); it covers implementation, documentation, evaluation, and submission review for this project. Open Codex in this repository so its repository guidance and skill can be discovered.

## Existing foundation

The earlier [Oral Cancer X project](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution) supplies the inherited implementation, imported at the participant's explicit request. Exact source paths/hashes and local-only copied assets are recorded in [import_manifest.json](doc/import_manifest.json). Local data, model artifacts, credentials, and the virtual environment are ignored by Git. This copy does not establish hackathon reuse approval or third-party asset redistribution rights; keep those questions separate from local development.

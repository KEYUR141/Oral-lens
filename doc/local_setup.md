# Local setup and database inspection

Updated: 29 October 2026. The inherited FastAPI backend, ingestion stages, embedding code, and 3D visualization files are copied into Oral-lens. The new Meta evidence-review product remains planned. No existing database was initialized, modified, or populated by the import task.

## What was copied

- Python modules under `app/`, `db/`, `embeddings/`, `ingestion/`, and `utils/`, plus `static/visualize.html`.
- Local ignored assets: 149 raw paper metadata records, 146 curated records, 146 precomputed abstract embeddings, and inherited UMAP/visualization artifacts.
- No source `.git`, credentials, virtual environment, logs, archive notes, or source README/docs were copied over the Oral-lens documentation.
- No PDFs, extracted full text, or figure images were present in the supplied local source. The old README's historical 4,666 database rows are not a local database dump. Connect to the existing database to learn what actually exists.

The local data/model files are ignored by Git and are not being redistributed. See [import_manifest.json](import_manifest.json) for source hashes and [contribution_manifest.md](contribution_manifest.md) for attribution. A historical visualization manifest can display old points without establishing that the configured database contains those rows; rebuild it after changing databases/corpus.

## Environment

The setup now uses uv project management with the existing local `.venv`. Commands below work in PowerShell without activation; see [uv_workflow.md](uv_workflow.md) for dependency groups and practice commands:

```powershell
cd D:\Django_Python_Practice\Meta_AI_Dev_Hacka\Oral-lens
uv run python --version
```

For a fresh checkout, create the environment, install dependencies, and create `.env` if it does not exist:

```powershell
uv sync --locked
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

`pyproject.toml` declares dependencies and groups; `uv.lock` records the exact cross-platform resolution. Ordinary `uv sync` installs the full default groups, including tests. Model weights are not downloaded during dependency installation. The requirements files are generated pip compatibility exports, described in [uv_workflow.md](uv_workflow.md), and should not be edited as separate dependency sources.

## Connect your existing PostgreSQL database

Edit the ignored root `.env` locally. Supply the existing database's values:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=oral_cancer_rag
DB_USER=postgres
DB_PASSWORD=
DB_SSLMODE=prefer
DB_READ_ONLY=true
```

Use the actual password and database name; they are not supplied by this setup. For hosted PostgreSQL, use its hostname/user and required SSL mode. A database connection does not need Gemini or Meta credentials.

Alternatively set `DATABASE_URL` to a complete PostgreSQL URL; it takes precedence over the DB connection fields. Set SSL URL options there when using it. The installed driver is psycopg2. Passwords in individual `DB_PASSWORD` fields do not need URL encoding; passwords embedded in a URL do. Quote dotenv values when needed, especially spaces and `#`. Do not paste credentials into chat or commit `.env`.

The app always loads `Oral-lens/.env`, independent of shell working directory. Existing process environment variables take precedence. Restart the server or rerun commands after editing settings.

## Inspect before adding anything

```powershell
uv run python -m scripts.inspect_db status
uv run python -m scripts.inspect_db papers --limit 10
uv run python -m scripts.inspect_db papers --search biomarker --limit 10
uv run python -m scripts.inspect_db paper YOUR_PAPER_ID
uv run python -m scripts.inspect_db passages YOUR_PAPER_ID --source fulltext --limit 5
```

Status reports PostgreSQL/pgvector versions, table presence, total embedded rows, distinct paper count, and row counts by source. Inspection commands use read-only transactions and do not create schemas or call an LLM. Missing-table and unavailable-connection states are reported explicitly; database URLs/passwords are not printed.

Browse the same information through Swagger:

```powershell
uv run python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs`:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | App liveness only; does not claim database readiness |
| `GET /database/status` | Actual read-only database summary |
| `GET /papers` | Paginated distinct papers; optional title search |
| `GET /papers/{paper_id}` | Paper metadata and available source counts |
| `GET /papers/{paper_id}/passages` | Paginated inherited abstract/full-text/caption text |
| `GET /visualize` | Inherited explorer page |
| `GET /visualize/manifest` | Local inherited/generated visualization manifest |

Keep this development server on localhost; these inspection endpoints have no authentication and are not prepared for public database browsing. Passage inspection exposes inherited row IDs and text; document-version/page-level evidence provenance remains future work.

## Optional: validate and load existing abstract embeddings

This checks the local file without opening a database connection:

```powershell
uv run python -m scripts.load_local_abstracts
```

It validates unique IDs, required metadata, and 768 finite numeric values per vector. It does not establish scientific correctness, source rights, or embedding-model provenance beyond the recorded inherited file.

If the configured database already has those abstracts, no import is needed. If you intend to add them, first set `DB_READ_ONLY=false` in `.env`, confirm the target database, and run:

```powershell
uv run python -m scripts.load_local_abstracts --apply
```

The loader inserts missing `(paper_id, source, chunk_index)` records and leaves conflicts unchanged. It reports actual inserted/skipped counts; it does not update existing metadata. It requires the inherited papers schema and pgvector.

For a new empty database only, with writes enabled and the proper database permissions:

```powershell
uv run python -m db.models
```

This explicitly creates the vector extension and inherited table/indexes; it is not a migration or repair tool for an existing incompatible schema. It does not create the PostgreSQL database itself. Return `DB_READ_ONLY=true` after intended writes. Inspection endpoints remain read-only even while ingestion writes are enabled.

## Optional: discover and ingest additional literature

The copied pipeline remains available; nothing runs automatically. First inspect its stages:

```powershell
uv run python -m ingestion.run_pipeline --list
```

Set `PAPER_SEARCH_QUERY` and `PAPER_SEARCH_YEARS` in `.env`; the example covers 2012–2026. A Semantic Scholar key is optional in configuration, subject to provider access/rate limits. The inherited search selects a bounded top-cited/recent subset and is not exhaustive.

Run individual stages to inspect intermediate data:

```powershell
uv run python -m ingestion.run_pipeline --stage fetch_papers
uv run python -m ingestion.run_pipeline --stage clean_papers
uv run python -m ingestion.run_pipeline --stage finalize_papers
```

These stages replace their local JSON outputs. Preserve a local corpus snapshot or use a separate `DATA_DIR` if you need the old versions. Review the curated output before embedding. With database writes explicitly enabled:

```powershell
uv run python -m ingestion.run_pipeline --stage embed_abstracts
uv run python -m ingestion.run_pipeline --stage download_pdfs
uv run python -m ingestion.run_pipeline --stage extract_fulltext
uv run python -m ingestion.run_pipeline --stage embed_fulltext
uv run python -m ingestion.run_pipeline --stage extract_visuals
uv run python -m ingestion.run_pipeline --stage embed_captions
uv run python -m ingestion.run_pipeline --stage build_visualization
```

Embedding is the first operation that loads/downloads the configured sentence-transformer weights. Keep the model compatible with the existing stored vectors; changing to a different embedding model requires deliberate re-embedding/versioning. The old unique-key conflict handling skips existing rows rather than replacing them. Check rights before downloading/processing new documents. Full-text and figure stages need actual permitted PDFs; the local abstract JSON alone cannot restore them.

## Meta client, inherited query and future work

`POST /query` is retained as an inherited retrieval-and-answer baseline but disabled by default (`ENABLE_LEGACY_QUERY=false`). Its answer generator now uses the shared Meta client, configured by `Meta_Muse_API_KEY` and `Meta_Muse_MODEL`; Gemini credentials are no longer used by runtime code. Database inspection and ingestion need no model key. Use `uv run python test_muse_llm.py --check-config` to validate settings without a request and the same command without the flag for one small live request. See [Meta setup](meta_setup.md). Live access remains unverified until the participant adds the key. The new evidence-review workflow does not exist yet; optional baseline generation is not the hackathon feature showcase or a guarantee of medical-request handling.

`WARM_UP_UMAP=false` avoids loading the serialized UMAP model at startup. Visualization query requests need ML dependencies, embedding weights, a matching UMAP bundle, and a connected database. Rebuild the local visualization files if their versions or corpus no longer match.

## Verification

```powershell
uv run python -m pytest -q
uv run python -m compileall -q app db embeddings ingestion scripts utils
```

The automated setup checks cover startup without database/model calls, read-only transaction enforcement, blocked schema writes, pagination/filter validation, sanitized failures, and the dry-run importer. They are not live database integration, ingestion correctness, model-quality, or clinical-validation results. Run actual read-only database status after supplying your local credentials.

Verification recorded during setup: 15 tests passed, all 146 local abstract embeddings passed the dry-run checks, dependency consistency passed, and the API imported without eagerly loading torch, sentence-transformers, UMAP, or a Gemini client. All ten pipeline-stage modules imported successfully, without executing their stages. The copied serialized UMAP model was not deserialized or compatibility-tested. The actual database-status attempt returned a sanitized OperationalError with the unconfigured defaults. No successful connection, real data count, schema write, or ingestion is claimed.

After the participant configured credentials, the live database check succeeded in a read-only transaction: 146 papers, 4,666 rows, no missing embeddings or empty stored text, and no duplicate source keys. The Windows Unicode output issue is fixed and 16 tests now pass through uv. See [database_inventory.md](database_inventory.md) for coverage and limitations. The earlier unconfigured connection failure above is historical setup evidence, not the current connection state.

On 27 October, `build_visualization` was run explicitly and rebuilt the local UMAP model and manifest from all 4,666 database rows. Checks confirmed finite coordinates, matching source counts/database row IDs, a successful transform of one stored vector, and HTTP 200 for `/visualize` and `/visualize/manifest`. See [visualization_build.json](visualization_build.json) for artifact hashes and checks. No database writes, model-weight downloads, or LLM calls occurred. Natural-language visualization search was not exercised. Restart an already running backend if it has cached the earlier UMAP bundle.

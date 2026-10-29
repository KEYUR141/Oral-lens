# Working with uv

Updated: 29 October 2026. Oral-lens now uses uv project management. The existing `.venv` was reused, a universal lock was resolved, the local environment was synchronized without downloading model weights, and setup checks passed.

## Files and ownership

| File | Role |
| --- | --- |
| `pyproject.toml` | Editable project metadata, dependency declarations/groups, and pytest configuration |
| `uv.lock` | uv-managed exact resolution across supported platforms; commit it with dependency changes |
| `.python-version` | Requests Python 3.13; project currently supports the tested 3.13 minor series |
| `.venv/` | Ignored local Python environment managed by uv |
| `.cache/uv/` | Ignored project-local package cache configured in pyproject.toml |
| `requirements*.txt` | Generated pip-compatible exports; do not edit them as independent dependency lists |

`pyproject.toml` is the declaration source and `uv.lock` is the resolution source. Keep both in version control. The project is configured with `package=false`: it is run from this repository, not built/installed as a distributable Python package.

## Everyday commands

Run these from Oral-lens:

```powershell
uv sync
uv run python -m scripts.inspect_db status
uv run python -m scripts.inspect_db papers --limit 10
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
uv run pytest -q
```

`uv sync` creates/updates the local environment from the project. `uv run` executes inside it without manual activation and normally checks that it matches the project. For a reproducibility check use `uv sync --locked`; `uv lock --check` checks lockfile freshness. Offline commands work only when the required interpreter, metadata, and artifacts are cached.

## Dependency groups

| Selection | Included packages/purpose |
| --- | --- |
| Main dependencies | FastAPI, database access, settings, HTTP requests; enough for corpus inspection |
| dev | pytest and HTTPX for setup/API checks |
| ml | sentence-transformers, PyMuPDF, Pillow for inherited embedding/document work |
| legacy | Historical Gemini SDK retained from the baseline environment; no longer used by active answer-generation code |
| visualization | UMAP, scikit-learn, joblib for the inherited explorer |

All four groups are defaults, so ordinary `uv sync` preserves the full inherited local functionality plus tests. This is a project choice. A lightweight environment can be selected explicitly:

```powershell
uv sync --no-default-groups --group dev
uv run --no-default-groups --group dev python -m scripts.inspect_db status
```

Sync is exact: selecting fewer groups can remove excluded packages from `.venv`. Run `uv sync` again to restore the default full environment. Data, credentials, and embedding-model files are separate from dependency groups and are not deleted by this workflow.

## Practicing dependency changes

Use `uv add`/`uv remove` when intentionally changing project dependencies. They maintain declarations, lock, and environment together. For example, if you decide to add a development linter:

```powershell
uv add --group dev ruff
uv run ruff check .
uv remove --group dev ruff
```

This is a practice example, not a change performed during setup. Choose a dependency only when you need it, inspect the resulting pyproject/lock diff, and run the relevant checks. `uv pip install` operates at the environment level and does not maintain project declarations; prefer `uv add` for ongoing work.

To deliberately update an existing package, use `uv lock --upgrade-package PACKAGE_NAME` followed by `uv sync` and verification. Avoid a broad upgrade during the demo freeze without a reason.

## Refresh pip compatibility exports

After an intentional dependency change, regenerate the exports rather than editing them:

```powershell
uv export --locked --no-default-groups --no-hashes --no-emit-project --output-file requirements-core.txt
uv export --locked --no-group dev --no-hashes --no-emit-project --output-file requirements.txt
uv export --locked --no-default-groups --group dev --no-hashes --no-emit-project --output-file requirements-dev.txt
uv export --locked --all-groups --no-hashes --no-emit-project --output-file requirements-lock.txt
```

The last file retains its earlier name for compatibility; it is now an export, not a manually maintained pip freeze. Exported requirements may contain platform markers and packages not installed on Windows. The current local sync checked 88 project packages; the universal resolution contains 109 packages. Neither count includes downloaded embedding weights or establishes ML artifact compatibility.

## Credentials and model configuration

uv project management does not supply database credentials, activate Meta credits, or change the coding model. Application settings still come from the ignored `.env`, with `Meta_Muse_API_KEY` and `Meta_Muse_MODEL` for the shared Meta client. Standard `uv run` does not automatically export that file to every arbitrary external command; our Python app loads it explicitly. For external tools that need those variables, use an explicit environment-loading mechanism, such as `uv run --env-file .env ...`, only with commands intended to receive them.

## Sources

- [uv projects](https://docs.astral.sh/uv/guides/projects/)
- [Migrating pip workflows to uv](https://docs.astral.sh/uv/guides/migration/pip-to-project/)

The workflow and local commands were verified during this migration. No production deployment, model API request, or database write was performed.

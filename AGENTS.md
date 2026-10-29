# Oral-lens repository guidance

Oral-lens is a research literature review workspace for oral cancer researchers and student literature reviewers. The intended result is an editable evidence review with study comparisons, exact source passages, claim assessments, and researcher corrections.

## Task context

For implementation, product documentation, evaluation, or submission work, read the repository skill at [.agents/skills/oral-lens-hackathon/SKILL.md](.agents/skills/oral-lens-hackathon/SKILL.md) and follow its relevant document links. The human-readable source of project rules and judging weights is [doc/hackathon_rules.md](doc/hackathon_rules.md).

Use [doc/README.md](doc/README.md) to route to the stack, product differences, flow, and contribution record. Inherited backend code and new inspection/setup tooling are now present; the new Meta review workflow remains planned. Read [doc/local_setup.md](doc/local_setup.md) for actual commands and [doc/uv_workflow.md](doc/uv_workflow.md) for dependency management. Use `uv run pytest -q` for setup checks. Inspect the current tree before claiming other features exist.

## Project invariants

- Keep the product within literature research. Do not implement medical advice, patient diagnosis/screening/triage, individual risk/prognosis, or treatment recommendations.
- Preserve exact source identity, passage evidence, missing information, and the distinction between source checks, model assessments, and human review.
- The model can propose findings; only user actions set human-reviewed state. Never label invented/failed references verified.
- Use the selected FastAPI/React/PostgreSQL architecture unless a concrete task changes that decision. Keep Meta inference and credentials on the backend.
- Preserve prior-work attribution and actual work dates. Keep inherited, modified inherited, new, planned, implemented, and verified states accurate in [doc/contribution_manifest.md](doc/contribution_manifest.md).
- Showcase only verified new event functionality. A provider swap, renamed project, extra tools, or inherited 3D viewer does not establish a new contribution by itself.
- The rubric is Impact 30%, Meta tooling 25%, Technical execution 20%, Demo 25%. Eligibility, originality, and rights remain requirements independent of scoring.
- Keep local `.env`, data, model artifacts, logs, and environments out of Git. Never initialize, ingest into, or modify the user's connected database just to inspect it. Database inspection must force a read-only transaction even if ingestion writes are enabled.
- Manage dependencies through `pyproject.toml` and `uv.lock`, using `uv add`/`uv sync`. Requirements files are generated compatibility exports, not independent sources to edit. Preserve default dependency groups unless intentionally changing the supported workflow.
- Frontend dependencies live separately in `frontend/package.json` and `frontend/package-lock.json` and use npm. See [frontend/README.md](frontend/README.md). On Windows, use `npm.cmd` if PowerShell blocks npm.ps1. Run `npm.cmd run build` from frontend for frontend changes; it includes TypeScript checks. Keep credentials on the backend and do not expose root .env values through Vite variables.

## Working and verification

Proceed with authorized work and routine decisions. If a task depends on unresolved rights or organizer interpretation, identify that specific dependency, record available evidence, and continue independent work; do not invent permission or add a blanket approval gate.

Update affected documentation when behavior changes. Run checks appropriate to the actual change; documentation edits need link/status consistency checks, while application changes need relevant behavioral checks. Report what was checked, what remains planned, and material limitations. Do not claim submission readiness, clinical validation, organizer approval, or benchmark improvements without evidence.

## Code Review Rules

Flag medical-advice behavior, fabricated citations/numbers/results, missing provenance, model writes to human-reviewed state, stale assessments after edits, unbounded tool loops, unrestricted model tool execution, misleading inherited-work claims, and export/deployment behavior that conceals failed or incomplete runs. Use the rules document for submission-specific checks.

## Learning while building

The participant is new to LangChain and LangGraph and wants to learn them through this project. Introduce each concept in plain Python terms before its first use, explain why the project needs it, and walk through the resulting code and execution. Build one small working slice at a time and offer a short experiment the participant can run. Explain tool schemas, model-selected calls versus application-controlled steps, graph state, nodes, edges, bounded loops, and persistence as they become relevant. Do not require quizzes or repeated approval to continue authorized work.

Use selected LangChain components and LangGraph where they serve the evidence-review workflow, after checking Meta provider compatibility. Neither framework is universally required for AI engineering or earns an automatic judging bonus. Keep framework adoption, implemented behavior, and verified results distinct; prioritize a useful working demo over extra abstractions.

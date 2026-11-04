# Interface validation and demonstration

Prepared 30 October 2026, Asia/Kolkata. Actual live outcomes must be recorded after execution; suggested claims below are test inputs, not scientific findings or guaranteed model decisions.

## Local services

Backend: `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000` from the repository root.

Frontend: `npm.cmd run dev` from `frontend`.

Open [product](http://127.0.0.1:5173/#product) or [presentation](http://127.0.0.1:5173/#present). A React browser session is not required for CLI testing, but both use the same review function. Model calls happen only when a review is submitted.

If the interface cannot load papers, first check PostgreSQL. During this task `postgresql-x64-17` was stopped, and a read-only connection attempt was refused. Starting the service from this session failed due to Windows service permissions. The participant must start it using Services or an administrator PowerShell:

```powershell
Start-Service -Name 'postgresql-x64-17'
```

This starts the existing local database service; do not initialize, recreate or ingest the database. The development servers can stay running while the service starts. Refresh the page afterward.

## First real interface test

1. Search paper titles for `SLC38A1`.
2. Select the paper titled `Investigation of Roles of SLC38A1 in Proliferation and Differentiation of Mouse Tongue Epithelium and Expression in Human Oral Tongue Squamous Cell Carcinoma`. Its participant-supplied earlier CLI run used paper ID `0986658f4460652bba1b5565e7fae1209e644def`.
3. Enter: `The selected study reports its specimen type and outcome measures.`
4. Select Review evidence once. Inspect the actual status, support, source checks, human-review state and limitations. A different model decision from the earlier CLI result is possible.
5. Open cited passages. Check the actual quoted text and abstract/full-text label. Source matching does not prove interpretation is correct.
6. Inspect the evidence search trail: query, scoped-paper count, returned-passage count and new-passage count. If there was a follow-up, repeated IDs must not be counted as new evidence.
7. Open Run details to inspect search history, assessment history, stop reason and usage. Copy the request JSON if you need an equivalent CLI run. Separate runs may vary and consume credits again.

## Three cases to validate

| Case | Preparation and observation |
| --- | --- |
| Sufficient initial evidence | Begin with the previously successful specimen/outcome claim. Check whether this run stops after one search, and whether its citations support its interpretation. |
| Follow-up adds evidence | Choose related papers with stored methods/full-text passages. Inspect `The selected studies used comparable specimen types and outcome measures.` A valid trial needs a real gap proposal and new passage IDs on search two; do not force or fabricate this outcome. |
| Follow-up adds nothing | Use a specific detail unavailable in inspected material, for example `The selected study reports a preregistration identifier and five-year follow-up outcomes.` If a follow-up occurs but finds only old IDs or no passages, expect `no_new_evidence` and an explicit warning. Confirm against the actual source; this test claim does not assert the study contains those details. |

Do not call a case passed solely because the HTTP response was 200. Provider/JSON failures stay failures. If the model does not propose a follow-up, record the actual route rather than relabeling it as a follow-up demonstration. Deterministic routing tests remain available with `uv run pytest tests/test_follow_up.py -q`; they are synthetic, not live research evidence.

## Initial verification (before the participant started PostgreSQL)

- Frontend and backend development servers started successfully.
- Frontend proxy `/api/health` returned 200.
- Paper requests returned 503 because local PostgreSQL was stopped; direct read-only connection diagnosis reported connection refused.
- New visible search-trail rendering compiles; TypeScript/production build and 69 backend tests pass.
- No new Meta review requests were sent during this task because database connectivity was blocked.
- Browser automation is unavailable; browser interactions and the three new live cases remain pending. Presentation and API proxy checks do not establish full end-to-end operation.

## Presentation handoff

Use Present to introduce the problem, then Open product demo for an actual run. Retain the explicit inherited-map label. Show the evidence and limitations, not just the generated paragraph. Saved review edits/export remain unimplemented; do not imply those actions are available in the demo.

## Follow-up verification: 30 October 2026

The participant started PostgreSQL. Through the frontend proxy, `/api/database/status` and paper search now return HTTP 200 with 146 papers and 4,666 rows. Both local development servers remain running.

Live runs exposed prompt-only output failures: schema echoes, invalid JSON and inconsistent evidence-gap proposals. `app/muse.py` now accepts an optional response schema and sends Meta's documented `response_format` JSON-schema field. The assessment provider schema additionally requires the gap fields and expresses their consistency with `anyOf`. Python independently validates the same business rules and exact citations. No automatic retries, prose extraction, relaxed validation or fake successful result was added. Diagnostics expose only controlled metadata and validation field/type codes, never Pydantic input/context or raw provider bodies.

[Meta structured-output documentation](https://dev.meta.ai/docs/structured-output) was consulted on 30 October. Provider acceptance was verified live with muse-spark-1.3. Structured output constrains the data shape; it does not validate scientific interpretation.

Actual observations:

| Run | Transport | Observed result |
| --- | --- | --- |
| Specimen/outcome claim on SLC38A1 | Frontend proxy POST | awaiting_review, supported, one search, source checks passed, no errors; 2,126 tokens; 43.84 seconds |
| Preregistration/five-year test claim | Frontend proxy POST | awaiting_review, unsupported, one search; no follow-up proposed. This did not demonstrate the intended no-new-evidence branch. Scientific interpretation of absence in an abstract still needs human assessment. |
| Two-paper comparability before cross-field schema rules | Frontend proxy POST | failed assessment validation; retained as failure rather than a successful demo |
| Two-paper comparability after cross-field schema rules | Direct shared workflow | two searches; second search added passage 4126; insufficient_evidence with search_budget_exhausted; no diagnostics; 7,579 tokens |

The comparison selected the SLC38A1 paper and `1a467c0fd20c0b35bc008a2001bfd44ce8e884ee` (depth of invasion study). Both searches returned passages from the latter paper. The query/scope filter remained fixed, but top-k similarity did not provide balanced paper coverage. New passages do not imply sufficient or independent evidence. Improving per-paper coverage is an identified next retrieval task.

Raw research responses are saved only under ignored `.cache/live_validation` for local inspection; they are not fixture data displayed as live results. Offline tests: 70 pass. No corpus or review database writes were performed. Full browser click/render behavior is still unverified because browser automation is unavailable.

Final proxy case: `The selected study reports the exact number of mouse specimens and their ages.` on SLC38A1 completed in 15.04 seconds using 2,277 tokens. Status/support insufficient_evidence, two searches, no_new_evidence, source checks passed, no diagnostics. Both searches returned passage 115; the second new_passage_ids list was empty. This verifies the duplicate/no-new-evidence branch live through the frontend proxy. It does not prove the complete paper lacks those details. Backend restarted with the final schema rules; no browser replay or cached response is substituted for live requests.

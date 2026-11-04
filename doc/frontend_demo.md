# Product and presentation frontend

Started 29 October 2026; presentation updated 5 November 2026. Local React/TypeScript frontend; no deployment or new backend behavior in these presentation changes.

## Visual references

The two participant-supplied screenshots in `frontend/reference_designs` guide the implementation: the Meta page's charcoal surfaces, large sans-serif type, rounded buttons/panels and blue accents; the second reference's faint grid and chapter markers. The chapter dots now sit on one horizontal line above the slide, and the grid uses longer, more visible 72-pixel cells. The screenshots remain reference material, not published background images. No Meta logo or official endorsement is claimed. The product uses the Oral-lens name.

## Run the two views

Start the backend from the repository root:

```powershell
uv run uvicorn app.main:app --reload
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm.cmd run dev
```

- Product: `http://127.0.0.1:5173/#product`
- Presentation: `http://127.0.0.1:5173/#present`

The presentation can be read without a working backend. The retained product component requests read-only corpus status and paper listings when the app opens; failures there do not block presentation content. Product state stays in memory when switching views, and refresh clears it. No model call occurs until the user submits a valid claim with selected papers. There are no automatic model retries.

Vite's existing `/api` proxy forwards to FastAPI on port 8000. Production hosting/proxy configuration is not included in this local demo. API docs and inherited-map links target the local backend on port 8000.

## Product behavior

1. Load actual corpus counts from GET `/database/status`; show an unavailable state instead of invented counts.
2. A new thread opens the existing paper library above the claim composer. Browse ten papers at a time or filter titles with GET `/papers`. The separate "Search document content" tab submits a research-topic phrase to POST `/papers/search/semantic`: exact full-text indexed term matches appear first, followed by inherited embedding suggestions. This is discovery within the stored corpus, not a model assessment or exhaustive literature search. The UI labels each match type and does not automatically select papers.
3. Preview a paper's stored abstract and first three passages through GET `/papers/{paper_id}` and `/papers/{paper_id}/passages`. Topic search also opens its exact matched stored row through GET `/passages/{row_id}`. These excerpts lack verified PDF page or document-version provenance. Manually select up to ten papers; this selected scope alone is sent to the claim-review workflow. Search and preview calls do not spend Meta API credits. Newer search/preview responses supersede stale ones.
4. Enter a 5-2,000-character research claim and POST it with selected paper IDs to `/reviews/assess`.
5. Show waiting state, transport failure, or the actual returned domain result. HTTP 200 alone does not establish success: failed, out-of-scope and insufficient-evidence statuses remain visible.
6. Display model support, mechanical source checks and human review independently. Render returned text as React text, never raw HTML. Expand actual passages and retain truncated-excerpt labels. Citation links open the referenced excerpt; unknown citations in a failed result remain visibly failed.
7. Inspect response JSON, model/usage and completed events. Copy request JSON to compare the exact same request with CLI/API docs. Each submitted claim captures its own scope and result in browser-local history.

There is no simulated progress or hard-coded model result. Backend events appear after the synchronous request completes. No acceptance buttons, saved reviews or export functionality are implied. Network errors leave the run outcome unconfirmed; inspect the backend before retrying a potentially billable call.

### CLI comparison

Copy request JSON from the interface into a local `review-request.json` (avoid patient data), then run:

```powershell
$reviewBody = Get-Content -Raw -LiteralPath .\review-request.json
$reviewResult = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/reviews/assess -ContentType 'application/json' -Body $reviewBody
$reviewResult | ConvertTo-Json -Depth 20
```

Compare status, assessment, citations and errors, allowing for model variability between separate requests. Each submission is a separate, potentially billable run. This does not replay a stored result.

## Presentation content and sources

Six chapters cover sourced disease burden, the research corpus, the literature-review task, the implemented workflow, the earlier-versus-current project comparison, and the live-product handoff. Previous/next, chapter buttons, arrow keys when focus is outside interactive controls, and an optional browser fullscreen control are available. Responsive layouts and reduced-motion preferences are supported in CSS. Desktop and mobile presentation layouts were checked locally in headless Chrome.

The corpus chapter calls the read-only `/database/status` endpoint and shows distinct paper count separately from stored rows. Source cards show row and paper coverage for abstracts, full-text chunks and figure captions. If the backend is unavailable, it explicitly labels the 5 November 2026 read-only inventory as a snapshot. Two example paper titles matching “oral” appear only when the live paper listing responds. The snapshot was rechecked through `scripts.inspect_db status` on 5 November: 146 distinct papers, 4,666 rows, 146 abstract rows, 4,117 full-text rows from 79 papers, and 403 caption rows from 72 papers. These structural counts do not establish scientific validity or completeness.

The comparison chapter uses the inspected [Oral Cancer X baseline](https://github.com/KEYUR141/Oral-Cancer-X-AI-Integrated-Solution/tree/26749ed838fdcade14307e6314f3abf20543f404) and the current event-built workflow. It identifies inherited corpus/embedding/UMAP infrastructure and labels saved corrections, the study comparison table and export as planned. It does not claim those features as implemented.

Statistics are estimates for **2024, both sexes, all ages, lip and oral cavity**. They must not be described as current daily death counts, all head and neck cancers, or prevented deaths attributable to Oral-lens.

| Displayed figure | Source checked 29 October 2026 | Location/version shown by source |
| --- | --- | --- |
| 194,108 estimated deaths worldwide | [IARC global lip/oral-cavity fact sheet](https://gco.iarc.who.int/media/globocan/factsheets/cancers/1-lip-oral-cavity-fact-sheet.pdf) | Page 1, mortality; GLOBOCAN 2024, footer 08.07.2026 |
| 86,307 estimated deaths in India | [IARC India fact sheet](https://gco.iarc.who.int/media/globocan/factsheets/populations/356-india-fact-sheet.pdf) | Page 2, lip/oral-cavity row, deaths column; GLOBOCAN 2024, September 2026 |

Live PDF contents were checked rather than relying on older search-index snippets that still showed 2022 values. These URLs may be updated by the publisher; recheck both year and values together before the final recording. Links and year/category labels are visible in the presentation. The fact-sheet layouts/images are not copied into the app.

The research task is framed as our design hypothesis. There is no fabricated user study, quantified workload estimate, demonstrated time saving or mortality-reduction claim. Population burden motivates the context; it does not establish product impact.

The live-product chapter now opens a full-screen React/Three.js corpus map within the same charcoal-and-blue app. The layout and interaction take inspiration from the participant's [GapMap embedding map](https://github.com/KEYUR141/GapMap/blob/main/frontend/src/EmbeddingMap.tsx): a spacious rotating 3D scene, reference grid, category legend, and side inspector. Oral-lens uses its own corpus categories and does not draw GapMap's scenario links because those relationships do not exist in this dataset. It fetches the existing `/visualize/manifest` through the Vite API proxy. The corpus, embeddings, UMAP coordinates and original oral cancer map are inherited; the themed React rendering and in-page interaction were added on 4 November. The inspector labels abstract previews accurately and reports an unavailable manifest or WebGL failure instead of showing an empty result. Saved corrections, study comparison and export remain planned. Keep the final hackathon feature showcase focused on verified new work.

## Learning notes and check

`Workspace` uses React state for selected papers, claim and results. `fetch` calls our FastAPI proxy; credentials stay on the server. The response's business status is checked by rendering it explicitly, independently of HTTP success. `Presentation` has separate chapter state. A hash switches views without requiring a routing dependency, while the workspace stays mounted so a view change does not discard its in-flight result.

Try answering:

1. Why can an HTTP-200 review still be shown as failed?
2. Why are source-validation and model-support labels separate?
3. Why must the mortality figures retain their year and exact cancer category?

## Verification

TypeScript/production build and server-rendered content checks for both modes pass. The map uses the already installed Three.js dependency. The backend manifest route returned 4,666 points in a read-only local check. Local headless Chrome checks confirmed WebGL rendering at desktop and mobile sizes, click-to-inspect for a corpus point, and Escape to close. Other keyboard interactions, browser fullscreen, clipboard and live UI-to-Meta completion remain unverified. No API credits or database writes were used by this frontend task. See the contribution manifest for attribution.

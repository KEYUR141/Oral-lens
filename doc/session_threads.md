# Review threads and execution tree

Implemented 30 October 2026. This frontend redesign replaces the long results page with a thread, execution tree and focused inspector. Existing backend calls and inference budgets are unchanged.

## Use the interface

1. Open Product. Create a new thread or select an existing thread on the left.
2. Use Choose papers above the composer to search/select up to ten papers. The picker collapses when a claim is submitted.
3. Enter a research claim and select Send review. The original claim and paper selection become an immutable turn snapshot. The result is attached to that same turn, even if another thread is viewed while the request runs.
4. Select Inspect run on any response to view that turn's execution tree. Select a search, assessment or source-check node for its details. Search nodes have passage leaves labeled new or seen.
5. Select a passage leaf or citation to inspect exact source text. Full source excerpts, limitations and raw JSON no longer fill the center conversation.
6. Submit another claim to append a new review. Earlier claims/results stay in the thread. Clear local history removes this feature's browser-stored threads; it does not touch PostgreSQL, other application storage or a running server request. Clearing is disabled while a run is active.

The center shows compact claim/draft-result pairs. The right inspector distinguishes mechanical source checks, model interpretation and human review. Failures remain visible. A node's presence means its corresponding event was returned by the backend; it is not proof of scientific correctness. The backend records some response events before schema validation, so the tree says response received rather than inventing successful parsing. Earlier source-check events do not have independent saved verdicts; the inspector labels the final run status explicitly.

## What history means

This is a history of scoped claim reviews, **not conversational model memory**. Earlier messages are not automatically sent to Meta, and selecting an old result does not modify the current draft. Each turn keeps its own selected papers, claim, creation time, complete returned result and failure/interruption state. The paper scope for a new turn remains an explicit selection.

History is serialized under `oral-lens.review-threads.v1` in browser localStorage. It survives ordinary refreshes on the same browser/profile/origin, subject to browser availability, clearing and quota. The UI visibly labels Local history. This is neither database review persistence nor account/device synchronization, and it does not implement researcher acceptance, revisions, checkpoint resume or export. Use a single tab for editing; simultaneous tabs do not merge changes.

History begins with reviews submitted through the updated interface. Earlier unsaved runs from the old workspace are not automatically recovered or imported.

Stored data includes research text and source excerpts; do not enter patient data. Saving failures produce a memory-only warning. Invalid stored data is not silently overwritten; explicit Clear local history resets that key. There are no automatic model requests or retries when restoring history. A previously running turn becomes interrupted with unknown server outcome because browser storage cannot establish whether the server finished or incurred charges.

## Files and learning map

| File | Purpose |
| --- | --- |
| [reviewTypes.ts](../frontend/src/reviewTypes.ts) | Paper, assessment, result, turn and thread data shapes |
| [sessionHistory.ts](../frontend/src/sessionHistory.ts) | Versioned serialization, loaded-data checks and interrupted-run restoration |
| [SessionTree.tsx](../frontend/src/SessionTree.tsx) | Converts actual event/search/assessment records into selectable nodes and passage children |
| [Workbench.tsx](../frontend/src/Workbench.tsx) | Thread state, scoped composer, requests, result snapshots and node inspector |
| [Workbench.css](../frontend/src/Workbench.css) | Charcoal/blue three-column layout, tree connectors and responsive stacking |

The tree is a UI representation of execution records; it does not replace the Python LangGraph or expose hidden model reasoning. A plain nested list with buttons avoids adding a graph-layout dependency. Native button/list semantics allow keyboard traversal. During a request only a waiting node is shown; intermediate live progress is not available without backend streaming.

## Verification

```powershell
cd frontend
npm.cmd run test:session
npm.cmd run build
```

Offline checks exercise round-trip preservation across threads, interrupted-run recovery, invalid/corrupt storage, usage validation, immutable scope snapshots, duplicate passage attribution, no fabricated running steps, and server-rendered tree controls. TypeScript/production build passes. Browser clicking, layout, quota failure and clipboard behavior are not verified by those checks. No new dependency, backend change, live Meta request, database write or dev-server startup is performed by this redesign.

Manual browser check: submit a claim, inspect a search and passage, submit another claim, inspect the first run again, switch threads, then refresh. Confirm that each old claim retains its own source scope and result and that no review runs merely because history was opened.

Copy reduction: supporting helper paragraphs and node subtitles were removed at the participant's request. Node details remain accessible through selection; actual evidence, failure states and review-status labels are retained. The Local history badge and Clear local history control remain visible.

# Existing database inventory

Inspected: 27 October 2026. The participant supplied PostgreSQL credentials locally in the ignored `.env`. All checks used an explicitly read-only transaction; `SHOW transaction_read_only` returned `on`. No schema creation, ingestion, updates, or model API calls were performed.

## Connection and counts

| Item | Observed value |
| --- | --- |
| PostgreSQL | 17.6 |
| pgvector extension | 0.8.1 |
| Visible inherited table | papers |
| Distinct paper IDs | 146 |
| Total stored rows | 4,666 |
| Abstract metadata year range | 2012–2025 |

| Source | Stored rows | Distinct papers |
| --- | --- | --- |
| abstract | 146 | 146 |
| fulltext | 4,117 | 79 |
| figure_captions | 403 | 72 |

The source coverage leaves 67 of the 146 papers without full-text rows. Caption coverage is 72 papers, rather than all 79 papers with full-text rows. New 2026 literature has not been established in this database by these checks.

## Structural checks

- All 4,666 rows contain an embedding; every embedding has 768 dimensions.
- No empty text was found using `COALESCE(embedding_text, abstract)` with whitespace trimming.
- No duplicate `(paper_id, source, chunk_index)` groups were found.
- Sample metadata listing works, including a title containing a Greek character.
- The inherited full-text/caption rows have null year fields in this inventory; use their paper's abstract metadata when the year is needed.

These checks establish structural availability, not scientific validity, completeness, relevance, peer-review status, rights, or citation support. Stored text may still contain extraction errors or incomplete context. No claim is made that every study is eligible for the final demonstration.

## What this means for development

The connected database has enough existing material to start selecting a small MVP review corpus and building passage inspection. Before collecting more papers, choose a narrow review task and inspect its candidate sources for relevance, available methods/results/limitations, and rights. Additional ingestion is useful when that specific task exposes an evidence gap; it is not needed merely to increase corpus size.

The local source checkout did not include PDFs or figure images. Database text and caption availability does not mean those original files exist in Oral-lens. Page/version provenance and the new study/claim review records remain future implementation work.

## Reproduce the read-only checks

```powershell
uv run python -m scripts.inspect_db status
uv run python -m scripts.inspect_db papers --limit 10
uv run python -m scripts.inspect_db papers --search biomarker --limit 10
```

See [local_setup.md](local_setup.md) for per-paper and passage browsing, and [uv_workflow.md](uv_workflow.md) for environment management. Credentials, hostname, user identity, database URLs, source excerpts, and patient data are intentionally absent from this report.

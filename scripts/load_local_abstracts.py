"""Validate copied abstract embeddings; insert only with --apply and DB_READ_ONLY=false."""

import argparse
import json
import math
from pathlib import Path

from utils.settings import PROJECT_ROOT


def load_rows(path: Path) -> list[dict]:
    records = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(records, list):
        raise ValueError('Expected a JSON list of abstract records.')
    rows = []
    seen = set()
    for index, record in enumerate(records, 1):
        if not isinstance(record, dict):
            raise ValueError(f'Record {index} is not an object.')
        paper_id = record.get('paper_id')
        vector = record.get('embedding')
        if not isinstance(paper_id, str) or not paper_id or not record.get('title'):
            raise ValueError(f'Record {index} has no paper ID or title.')
        if paper_id in seen:
            raise ValueError(f'Record {index} repeats a paper ID.')
        if (not isinstance(vector, list) or len(vector) != 768 or
                any(isinstance(value, bool) or not isinstance(value, (int, float)) or
                    not math.isfinite(value) for value in vector)):
            raise ValueError(f'Record {index} does not contain 768 finite numeric embedding values.')
        seen.add(paper_id)
        rows.append({
            'paper_id': paper_id, 'title': record['title'],
            'abstract': record.get('abstract'), 'year': record.get('year'),
            'citation_count': record.get('citation_count'),
            'is_open_access': record.get('is_open_access', False),
            'publication_types': record.get('publication_types') or [],
            'open_access_pdf_url': record.get('open_access_pdf_url'),
            'embedding_text': record.get('embedding_text'), 'embedding': vector,
            'source': 'abstract', 'chunk_index': 0,
        })
    return rows


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--file', type=Path,
                        default=PROJECT_ROOT / 'embeddings' / 'oral_cancer_papers_embedded.json')
    parser.add_argument('--apply', action='store_true', help='Insert missing abstract rows into the configured database.')
    args = parser.parse_args(argv)
    rows = load_rows(args.file)
    print(f'Validated {len(rows)} inherited abstract records with 768-dimensional embeddings.')
    if not args.apply:
        print('Dry run: no database connection or changes. Use --apply after enabling DB writes to insert missing rows.')
        return 0
    from db.upsert import upsert_rows
    inserted = upsert_rows(rows)
    print(f'Inserted {inserted} rows; {len(rows) - inserted} existing rows were left unchanged.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

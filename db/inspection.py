"""Read-only inspection of the existing papers table. No model calls or schema writes."""
from sqlalchemy import text
from db.database import get_db


class SchemaNotReadyError(RuntimeError):
    pass


def _require_papers(connection):
    if connection.execute(text("SELECT to_regclass('papers')")).scalar_one() is None:
        raise SchemaNotReadyError(
            'No visible papers table. Check DB_NAME/user/schema. '
            'Initialize only a new database with python -m db.models after enabling writes.'
        )


def database_status():
    with get_db(read_only=True) as connection:
        version = connection.execute(text('SHOW server_version')).scalar_one()
        extension = connection.execute(text(
            "SELECT extversion FROM pg_extension WHERE extname = 'vector'"
        )).scalar_one_or_none()
        table = connection.execute(text("SELECT to_regclass('papers')")).scalar_one()
        result = {
            'connected': True, 'postgresql_version': version, 'pgvector_version': extension,
            'papers_table_exists': table is not None, 'inspection_read_only': True,
            'total_rows': 0, 'distinct_papers': 0, 'rows_by_source': [],
        }
        if table is None:
            return result
        totals = connection.execute(text(
            'SELECT COUNT(*) AS total_rows, COUNT(DISTINCT paper_id) AS distinct_papers FROM papers'
        )).mappings().one()
        result.update(dict(totals))
        result['rows_by_source'] = [dict(row) for row in connection.execute(text(
            'SELECT source, COUNT(*) AS rows, COUNT(DISTINCT paper_id) AS papers '
            'FROM papers GROUP BY source ORDER BY source'
        )).mappings()]
        return result


def list_papers(limit=20, offset=0, search=None):
    if not 1 <= limit <= 100 or offset < 0:
        raise ValueError('limit must be 1?100 and offset must be nonnegative.')
    # Distinct selection prefers abstract metadata; pagination occurs after grouping.
    sql = text("""
        SELECT paper_id, title, year, citation_count, open_access_pdf_url, source
        FROM (
            SELECT DISTINCT ON (paper_id)
                paper_id, title, year, citation_count, open_access_pdf_url, source
            FROM papers
            WHERE (:search IS NULL OR title ILIKE :search)
            ORDER BY paper_id, CASE WHEN source = 'abstract' THEN 0 ELSE 1 END, id
        ) chosen
        ORDER BY year DESC NULLS LAST, paper_id
        LIMIT :limit OFFSET :offset
    """)
    with get_db(read_only=True) as connection:
        _require_papers(connection)
        rows = connection.execute(sql, {
            'search': f'%{search}%' if search else None, 'limit': limit, 'offset': offset
        }).mappings()
        return {'limit': limit, 'offset': offset, 'items': [dict(row) for row in rows]}


def paper_detail(paper_id):
    with get_db(read_only=True) as connection:
        _require_papers(connection)
        paper = connection.execute(text("""
            SELECT paper_id, title, abstract, year, citation_count, publication_types,
                   open_access_pdf_url, source
            FROM papers WHERE paper_id = :paper_id
            ORDER BY CASE WHEN source = 'abstract' THEN 0 ELSE 1 END, id LIMIT 1
        """), {'paper_id': paper_id}).mappings().first()
        if paper is None:
            return None
        result = dict(paper)
        result['rows_by_source'] = [dict(row) for row in connection.execute(text(
            'SELECT source, COUNT(*) AS rows FROM papers WHERE paper_id = :paper_id '
            'GROUP BY source ORDER BY source'
        ), {'paper_id': paper_id}).mappings()]
        return result


def paper_passages(paper_id, limit=20, offset=0, source=None):
    if not 1 <= limit <= 100 or offset < 0:
        raise ValueError('limit must be 1?100 and offset must be nonnegative.')
    if source not in {None, 'abstract', 'fulltext', 'figure_captions'}:
        raise ValueError('Unknown passage source.')
    with get_db(read_only=True) as connection:
        _require_papers(connection)
        rows = connection.execute(text("""
            SELECT id, paper_id, source, chunk_index, title,
                   COALESCE(embedding_text, abstract) AS text, image_path
            FROM papers
            WHERE paper_id = :paper_id AND (:source IS NULL OR source = :source)
            ORDER BY source, chunk_index, id LIMIT :limit OFFSET :offset
        """), {'paper_id': paper_id, 'source': source, 'limit': limit, 'offset': offset}).mappings()
        return {'paper_id': paper_id, 'limit': limit, 'offset': offset,
                'items': [dict(row) for row in rows],
                'provenance_note': 'Inherited rows do not yet establish document versions or page-level provenance.'}

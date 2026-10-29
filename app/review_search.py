"""Scoped, read-only vector search that preserves matched passage text."""
import hashlib
import math

from langchain_core.tools import tool
from pydantic import Field
from sqlalchemy import bindparam, text
from typing import Annotated

from app.review_schemas import Passage, ReviewRequest
from db.database import get_db


@tool
def search_literature(query: str, paper_ids: list[str],
                      limit: Annotated[int, Field(ge=1, le=8)] = 6) -> list[dict]:
    """Return matched stored excerpts only from the researcher's selected papers.

    Similarity ranks candidates; it does not establish relevance or scientific support.
    """
    request = ReviewRequest(claim=query, paper_ids=paper_ids)
    from app.retrieval import embed_query
    vector = [float(value) for value in embed_query(request.claim)]
    if len(vector) != 768 or not all(math.isfinite(value) for value in vector):
        raise ValueError('Expected a finite 768-dimensional query embedding.')
    sql = text('''
        SELECT id, paper_id, title, source, chunk_index,
               COALESCE(NULLIF(embedding_text, ''), abstract) AS passage_text,
               1 - (embedding <=> CAST(:vector AS vector)) AS similarity
        FROM papers
        WHERE paper_id IN :paper_ids AND embedding IS NOT NULL
          AND source IN ('abstract', 'fulltext', 'figure_captions')
          AND LENGTH(TRIM(COALESCE(NULLIF(embedding_text, ''), abstract, ''))) > 0
        ORDER BY embedding <=> CAST(:vector AS vector), id
        LIMIT :limit
    ''').bindparams(bindparam('paper_ids', expanding=True))
    with get_db(read_only=True) as connection:
        rows = connection.execute(sql, {'paper_ids': request.paper_ids,
                                       'vector': str(vector), 'limit': limit}).mappings()
        passages = []
        for row in rows:
            original = row['passage_text']
            excerpt = original[:3000]
            passages.append(Passage(
                passage_id=row['id'], paper_id=row['paper_id'], title=row['title'],
                source=row['source'], chunk_index=row['chunk_index'], text=excerpt,
                text_sha256=hashlib.sha256(excerpt.encode()).hexdigest(),
                truncated=len(original) > len(excerpt),
                similarity=max(-1.0, min(1.0, float(row['similarity']))),
            ).model_dump())
    return passages

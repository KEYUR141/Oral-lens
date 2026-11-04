"""Local development endpoints for read-only corpus inspection."""
from typing import Annotated, Literal
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from db import inspection
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=['Database inspection'])
Limit = Annotated[int, Query(ge=1, le=100)]
Offset = Annotated[int, Query(ge=0)]


class SemanticPaperSearch(BaseModel):
    query: str = Field(min_length=3, max_length=300)
    limit: int = Field(default=12, ge=1, le=20)


def _read(operation, *args, **kwargs):
    try:
        return operation(*args, **kwargs)
    except inspection.SchemaNotReadyError as error:
        raise HTTPException(status_code=503, detail=str(error)) from None
    except Exception as error:
        logger.warning('Database inspection unavailable (%s).', type(error).__name__)
        raise HTTPException(status_code=503, detail=(
            'Database unavailable. Check .env, PostgreSQL connectivity and permissions.'
        )) from None


@router.get('/database/status')
def status():
    return _read(inspection.database_status)


@router.get('/papers')
def papers(limit: Limit = 20, offset: Offset = 0,
           search: Annotated[str | None, Query(max_length=300)] = None):
    return _read(inspection.list_papers, limit, offset, search)


@router.post('/papers/search/semantic')
def semantic_papers(request: SemanticPaperSearch):
    """Read-only content discovery; the caller selects the final paper scope."""
    if not request.query.strip():
        raise HTTPException(status_code=422, detail='Enter a research topic to search.')
    try:
        lexical_matches = inspection.search_paper_content(request.query, request.limit)
    except Exception as error:
        logger.warning('Content search unavailable (%s).', type(error).__name__)
        raise HTTPException(status_code=503, detail='Content search unavailable. Check the database.') from None
    papers_by_id = {}
    for match in lexical_matches:
        papers_by_id.setdefault(match['paper_id'], {**match, 'match_method': 'text'})
    embedding_status = 'not_needed'
    if len(papers_by_id) < request.limit:
        from app.retrieval import embed_query
        from app.visualize import nearest_rows
        try:
            vector_matches = nearest_rows(embed_query(request.query), top_k=min(request.limit * 5, 100))
            embedding_status = 'available'
        except Exception as error:
            logger.warning('Embedding search unavailable (%s).', type(error).__name__)
            embedding_status = 'unavailable'
            vector_matches = []
        for match in vector_matches:
            papers_by_id.setdefault(match['paper_id'], {**match, 'match_method': 'embedding'})
    note = ('Embedding suggestions unavailable; showing text matches only.' if embedding_status == 'unavailable'
            else 'Indexed text matches appear first, followed by inherited embedding suggestions.')
    return {'query': request.query, 'items': list(papers_by_id.values())[:request.limit],
            'embedding_status': embedding_status,
            'note': f'{note} Ranking does not establish scientific relevance or claim support.'}


@router.get('/papers/{paper_id}')
def paper(paper_id: str):
    result = _read(inspection.paper_detail, paper_id)
    if result is None:
        raise HTTPException(status_code=404, detail='Paper not found.')
    return result


@router.get('/papers/{paper_id}/passages')
def passages(paper_id: str, limit: Limit = 20, offset: Offset = 0,
             source: Literal['abstract', 'fulltext', 'figure_captions'] | None = None):
    return _read(inspection.paper_passages, paper_id, limit, offset, source)


@router.get('/passages/{row_id}')
def passage(row_id: int):
    result = _read(inspection.passage_by_id, row_id)
    if result is None:
        raise HTTPException(status_code=404, detail='Stored passage not found.')
    return result

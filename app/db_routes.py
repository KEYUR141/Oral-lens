"""Local development endpoints for read-only corpus inspection."""
from typing import Annotated, Literal
from fastapi import APIRouter, HTTPException, Query

from db import inspection
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=['Database inspection'])
Limit = Annotated[int, Query(ge=1, le=100)]
Offset = Annotated[int, Query(ge=0)]


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

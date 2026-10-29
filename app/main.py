"""Oral-lens inherited backend and local, read-only corpus inspection."""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.db_routes import router as db_router
from app.viz_routes import router as viz_router
from app.review_routes import router as review_router
from utils.logger import get_logger
from utils.settings import DATA_DIR, env_bool

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(application):
    # No database writes, model downloads or LLM calls occur at startup.
    if env_bool('WARM_UP_UMAP'):
        from app.visualize import get_umap_bundle, project_query
        try:
            get_umap_bundle()
            project_query([0.0] * 768)
        except Exception as error:
            logger.warning('Optional UMAP warm-up unavailable (%s).', type(error).__name__)
    yield


app = FastAPI(
    title='Oral-lens corpus API',
    description='Inherited research corpus functionality and read-only database inspection. '
                'A first, non-persistent Meta claim-review workflow is available at /reviews/assess.',
    version='0.1.0',
    lifespan=lifespan,
)
app.mount('/images', StaticFiles(directory=str(DATA_DIR / 'pdfs' / 'images'), check_dir=False), name='images')
app.include_router(db_router)
app.include_router(viz_router)
app.include_router(review_router)


class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=10, ge=1, le=50)


class SourceSchema(BaseModel):
    number: int
    title: str
    year: int | None = None
    similarity: float
    citation_count: int | None = None
    pdf_url: str | None = None
    image_path: str | None = None


class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: list[SourceSchema]
    papers_retrieved: int
    response_time_ms: float


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'Oral-lens corpus API', 'version': '0.1.0',
            'database_checked': False, 'legacy_query_enabled': env_bool('ENABLE_LEGACY_QUERY')}


@app.post('/query', response_model=QueryResponse, tags=['Inherited baseline'])
def query(request: QueryRequest):
    if not env_bool('ENABLE_LEGACY_QUERY'):
        raise HTTPException(status_code=503, detail=(
            'Inherited literature query is disabled. Use /papers to inspect data. '
            'Use /reviews/assess for the new draft claim-review workflow.'
        ))
    if not request.query.strip():
        raise HTTPException(status_code=400, detail='Query cannot be empty.')
    try:
        from app.retrieval import retrieve
        from app.llm import generate_answer
        started = time.monotonic()
        papers = retrieve(request.query, top_k=request.top_k)
        result = generate_answer(request.query, papers)
        return QueryResponse(**result, papers_retrieved=len(papers),
                             response_time_ms=(time.monotonic() - started) * 1000)
    except Exception as error:
        logger.warning('Inherited query unavailable (%s).', type(error).__name__)
        raise HTTPException(status_code=503, detail=(
            'Inherited query unavailable. Check database, embedding dependencies and Meta Muse configuration.'
        )) from None

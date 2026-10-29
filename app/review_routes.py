"""Synchronous route keeps blocking embedding/HTTP work off the async event loop."""
from fastapi import APIRouter

from app.review_schemas import ReviewRequest, ReviewResult
from app.review_workflow import run_review

router = APIRouter(tags=['Draft evidence review'])


@router.post('/reviews/assess', response_model=ReviewResult)
def assess_claim(request: ReviewRequest):
    return run_review(request)

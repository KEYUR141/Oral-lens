"""Contracts for the first, non-persistent evidence-review slice."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class ReviewRequest(StrictModel):
    claim: str = Field(min_length=5, max_length=2000)
    paper_ids: list[str] = Field(min_length=1, max_length=10)

    @field_validator('paper_ids')
    @classmethod
    def valid_ids(cls, values):
        if any(not value.strip() or len(value) > 200 for value in values):
            raise ValueError('Paper IDs must be nonempty and at most 200 characters.')
        return list(dict.fromkeys(value.strip() for value in values))


class Passage(StrictModel):
    # Preserve stored source whitespace exactly so excerpt hashes remain meaningful.
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=False)
    passage_id: int = Field(gt=0)
    paper_id: str
    title: str
    source: Literal['abstract', 'fulltext', 'figure_captions']
    chunk_index: int | None
    text: str = Field(min_length=1, max_length=3000)
    text_sha256: str
    truncated: bool
    similarity: float = Field(ge=-1, le=1)


class ScopeDecision(StrictModel):
    decision: Literal['literature_review', 'out_of_scope']


class EvidenceReference(StrictModel):
    passage_id: int = Field(gt=0)
    quote: str = Field(min_length=1, max_length=1000)


class Assessment(StrictModel):
    support: Literal['supported', 'partially_supported', 'unsupported', 'insufficient_evidence']
    explanation: str = Field(min_length=1, max_length=2000)
    evidence: list[EvidenceReference] = Field(max_length=8)
    limitations: list[str] = Field(min_length=1, max_length=8)
    needs_more_evidence: StrictBool = False
    missing_information: str | None = Field(default=None, min_length=5, max_length=1000)
    follow_up_query: str | None = Field(default=None, min_length=5, max_length=500)

    @model_validator(mode='after')
    def coherent_search_proposal(self):
        if self.needs_more_evidence:
            if not self.missing_information or not self.follow_up_query:
                raise ValueError('An evidence gap requires a specific missing item and search query.')
            if self.support not in {'partially_supported', 'insufficient_evidence'}:
                raise ValueError('A conclusive assessment cannot request missing evidence.')
        elif self.follow_up_query is not None:
            raise ValueError('A search query requires an evidence gap.')
        return self

    @field_validator('limitations')
    @classmethod
    def bounded_limitations(cls, values):
        if any(not value or len(value) > 1000 for value in values):
            raise ValueError('Each limitation must contain 1-1000 characters.')
        return values


class ReviewResult(StrictModel):
    claim: str
    paper_ids: list[str]
    status: Literal['awaiting_review', 'insufficient_evidence', 'out_of_scope', 'failed']
    human_review: Literal['not_reviewed'] = 'not_reviewed'
    assessment: Assessment | None = None
    passages: list[Passage] = Field(default_factory=list)
    source_validation: Literal['passed', 'failed', 'not_checked'] = 'not_checked'
    errors: list[str] = Field(default_factory=list)
    diagnostics: list[dict[str, str | int | None]] = Field(default_factory=list)
    events: list[str] = Field(default_factory=list)
    model: str | None = None
    usage: dict[str, int] = Field(default_factory=dict)
    search_count: int = Field(default=0, ge=0, le=2)
    search_history: list[dict] = Field(default_factory=list)
    assessment_history: list[Assessment] = Field(default_factory=list)
    stop_reason: str | None = None
    warnings: list[str] = Field(default_factory=list)
    prompt_version: str = 'claim-review-v2'
    provenance_note: str = ('Passage IDs are local database row IDs; hashes identify the exact '
                            'supplied excerpt, not a document version. Page locations are unavailable. '
                            'Source checks do not establish semantic correctness. Results are not saved.')

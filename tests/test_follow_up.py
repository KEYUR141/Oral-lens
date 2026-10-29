"""Offline cases for scope, deduplication, failures and the two-search budget."""
from unittest.mock import Mock

import pytest

from app.review_schemas import ReviewRequest
from app.review_workflow import build_review_graph
from tests.test_review import assessment, completion, passage


def gap(**updates):
    return assessment(support='insufficient_evidence', needs_more_evidence=True,
                      missing_information='Specimen details are missing.',
                      follow_up_query='specimen types tissue sampling methods', **updates)


def run(search_results, answers):
    search = Mock(side_effect=search_results)
    generate = Mock(side_effect=[completion({'decision': 'literature_review'})] + [completion(a) for a in answers])
    result = build_review_graph(search, generate).invoke({'request': ReviewRequest(
        claim='Compare specimen types.', paper_ids=['p1', 'p2'])}, {'recursion_limit': 12})['result']
    return result, search, generate


def test_follow_up_adds_only_new_passages_and_reassesses():
    result, search, generate = run([[passage()], [passage(), passage(passage_id=2, paper_id='p2')]],
                                   [gap(), assessment()])
    assert result.status == 'awaiting_review'
    assert result.search_count == 2
    assert [p.passage_id for p in result.passages] == [1, 2]
    assert result.search_history[1]['new_passage_ids'] == [2]
    assert search.call_args.args[0]['paper_ids'] == ['p1', 'p2']
    assert search.call_args.args[0]['query'] == 'specimen types tissue sampling methods'
    assert generate.call_count == 3
    assert len(result.assessment_history) == 2
    assert result.source_validation == 'passed'
    assert result.human_review == 'not_reviewed'


@pytest.mark.parametrize('second', [[passage()], []])
def test_no_new_evidence_stops_without_reassessment(second):
    result, search, generate = run([[passage()], second], [gap()])
    assert result.status == 'insufficient_evidence'
    assert result.stop_reason == 'no_new_evidence'
    assert len(result.passages) == 1
    assert result.search_history[1]['new_passage_ids'] == []
    assert generate.call_count == 2
    assert search.call_count == 2


def test_budget_stops_unresolved_second_assessment():
    result, search, generate = run([[passage()], [passage(passage_id=2)]], [gap(), gap()])
    assert result.stop_reason == 'search_budget_exhausted'
    assert result.status == 'insufficient_evidence'
    assert search.call_count == 2
    assert generate.call_count == 3


@pytest.mark.parametrize('second', [[passage(passage_id=3, paper_id='outside')],
                                  [passage(text='Changed source')], RuntimeError('secret DB URL')])
def test_invalid_follow_up_preserves_prior_evidence_and_fails(second):
    result, _, generate = run([[passage()], second], [gap()])
    assert result.status == 'failed'
    assert result.errors == ['follow_up_search_failed']
    assert len(result.passages) == 1
    assert generate.call_count == 2
    assert 'secret' not in result.model_dump_json()


def test_invalid_proposal_cannot_expand_scope():
    proposal = gap() | {'paper_ids': ['outside']}
    result, search, _ = run([[passage()]], [proposal])
    assert result.errors == ['assessment_failed']
    assert search.call_count == 1


def test_missing_query_fails_before_follow_up():
    proposal = gap() | {'follow_up_query': None}
    result, search, _ = run([[passage()]], [proposal])
    assert result.errors == ['assessment_failed']
    assert search.call_count == 1


def test_invalid_citation_blocks_follow_up():
    result, search, _ = run([[passage()]], [gap(evidence=[{'passage_id': 99, 'quote': 'fake'}])])
    assert result.source_validation == 'failed'
    assert search.call_count == 1


def test_reassessment_failure_does_not_reuse_prior_success_state():
    result, _, _ = run([[passage()], [passage(passage_id=2)]],
                       [gap(), {'unexpected': 'invalid response'}])
    assert result.status == 'failed'
    assert result.source_validation == 'not_checked'
    assert result.errors == ['assessment_failed']
    assert len(result.assessment_history) == 1
    assert len(result.passages) == 2

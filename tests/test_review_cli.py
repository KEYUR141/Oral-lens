import json
from unittest.mock import Mock

from scripts.review_cli import main


def test_check_only_without_workflow(monkeypatch, capsys):
    from app import review_workflow
    run = Mock(side_effect=AssertionError('Must not run'))
    monkeypatch.setattr(review_workflow, 'run_review', run)
    assert main(['review', '--claim', 'Compare study methods.', '--paper-id', 'p1', '--check-only']) == 0
    assert json.loads(capsys.readouterr().out)['model_called'] is False
    run.assert_not_called()


def test_json_request_and_failed_result(tmp_path, monkeypatch, capsys):
    from app import review_workflow
    from app.review_schemas import ReviewResult
    path = tmp_path / 'request.json'
    path.write_text(json.dumps({'claim': 'Compare methods.', 'paper_ids': ['p1']}), encoding='utf-8-sig')
    monkeypatch.setattr(review_workflow, 'run_review', lambda request: ReviewResult(
        claim=request.claim, paper_ids=request.paper_ids, status='failed', errors=['scope_check_failed']))
    assert main(['review', '--request', str(path)]) == 1
    assert json.loads(capsys.readouterr().out)['status'] == 'failed'


def test_invalid_input_does_not_run(capsys):
    assert main(['review', '--claim', 'x', '--paper-id', 'p1']) == 2
    assert 'Invalid input' in capsys.readouterr().err


def test_interactive_input(monkeypatch, capsys):
    answers = iter(['Compare study methods.', 'p1, p2'])
    monkeypatch.setattr('builtins.input', lambda prompt: next(answers))
    assert main(['review', '--check-only']) == 0
    assert json.loads(capsys.readouterr().out)['request']['paper_ids'] == ['p1', 'p2']

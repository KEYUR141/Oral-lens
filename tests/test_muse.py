import importlib
from unittest.mock import MagicMock

import pytest
import requests

from app import llm, muse


@pytest.fixture
def configured(monkeypatch):
    monkeypatch.setenv('Meta_Muse_API_KEY', 'synthetic-private-test-key')
    monkeypatch.setenv('Meta_Muse_MODEL', 'muse-spark-1.3')


def response(status, body):
    result = MagicMock()
    result.status_code = status
    result.json.return_value = body
    return result


def test_new_names_are_required_and_old_names_are_not_used(monkeypatch):
    monkeypatch.setenv('Meta_Muse_API_KEY', '')
    monkeypatch.setenv('MODEL_API_KEY', 'synthetic-old-key')
    with pytest.raises(muse.MuseConfigurationError, match='Meta_Muse_API_KEY'):
        muse.get_muse_configuration()


def test_missing_model_is_actionable(configured, monkeypatch):
    monkeypatch.setenv('Meta_Muse_MODEL', '')
    with pytest.raises(muse.MuseConfigurationError, match='Meta_Muse_MODEL'):
        muse.get_muse_configuration()


def test_configuration_repr_hides_key(configured):
    assert 'synthetic-private-test-key' not in repr(muse.get_muse_configuration())


def test_completion_uses_meta_endpoint_and_bounded_request(configured, monkeypatch):
    post = MagicMock(return_value=response(200, {
        'choices': [{'message': {'content': 'MUSE_OK'}, 'finish_reason': 'stop'}],
        'usage': {'prompt_tokens': 8, 'completion_tokens': 3, 'total_tokens': 11},
    }))
    monkeypatch.setattr(muse.requests, 'post', post)
    result = muse.complete([{'role': 'user', 'content': 'Synthetic test'}], max_tokens=128)
    assert result.text == 'MUSE_OK'
    assert result.usage['total_tokens'] == 11
    assert post.call_args.args[0] == 'https://api.meta.ai/v1/chat/completions'
    assert post.call_args.kwargs['allow_redirects'] is False
    assert post.call_args.kwargs['json']['max_tokens'] == 128
    assert post.call_args.kwargs['json']['model'] == 'muse-spark-1.3'
    post.assert_called_once()


@pytest.mark.parametrize('status', [401, 402, 403, 404, 429, 500])
def test_provider_error_is_not_retried_and_key_is_redacted(configured, monkeypatch, status):
    post = MagicMock(return_value=response(status, {'error': {
        'code': 'verification_required',
        'message': 'Synthetic error synthetic-private-test-key',
    }}))
    monkeypatch.setattr(muse.requests, 'post', post)
    with pytest.raises(muse.MuseAPIError) as error:
        muse.complete([{'role': 'user', 'content': 'Synthetic test'}])
    assert error.value.status_code == status
    assert 'synthetic-private-test-key' not in str(error.value)
    post.assert_called_once()


def test_timeout_is_safe_and_not_retried(configured, monkeypatch):
    post = MagicMock(side_effect=requests.Timeout('synthetic-private-test-key'))
    monkeypatch.setattr(muse.requests, 'post', post)
    with pytest.raises(muse.MuseAPIError) as error:
        muse.complete([{'role': 'user', 'content': 'Synthetic test'}])
    assert error.value.code == 'timeout'
    assert 'synthetic-private-test-key' not in str(error.value)
    post.assert_called_once()


@pytest.mark.parametrize('body', [None, {}, {'choices': []}, {'choices': [{'message': {'content': ''}}]}])
def test_empty_or_malformed_success_is_not_reported_as_working(configured, monkeypatch, body):
    monkeypatch.setattr(muse.requests, 'post', MagicMock(return_value=response(200, body)))
    with pytest.raises(muse.MuseAPIError):
        muse.complete([{'role': 'user', 'content': 'Synthetic test'}])


def test_smoke_import_and_check_config_never_send_a_request(configured, monkeypatch, capsys):
    post = MagicMock(side_effect=AssertionError('No real request expected'))
    monkeypatch.setattr(muse.requests, 'post', post)
    script = importlib.import_module('test_muse_llm')
    assert script.main(['--check-config']) == 0
    post.assert_not_called()
    assert 'synthetic-private-test-key' not in capsys.readouterr().out


def test_smoke_with_missing_key_stops_before_network(monkeypatch, capsys):
    monkeypatch.setenv('Meta_Muse_API_KEY', '')
    post = MagicMock(side_effect=AssertionError('No real request expected'))
    monkeypatch.setattr(muse.requests, 'post', post)
    script = importlib.import_module('test_muse_llm')
    assert script.main([]) == 2
    assert 'Meta_Muse_API_KEY' in capsys.readouterr().err
    post.assert_not_called()


def test_inherited_answer_generator_now_uses_meta(monkeypatch):
    complete = MagicMock(return_value=muse.MuseCompletion('Synthetic cited answer [1].', 'muse-spark-1.3', {}))
    monkeypatch.setattr(llm, 'complete', complete)
    paper = {'title': 'Synthetic research fixture', 'year': 2026, 'similarity': 0.9,
             'abstract': 'Synthetic methods and limitations.', 'citation_count': 0}
    result = llm.generate_answer('Compare study methods.', [paper])
    assert result['answer'] == 'Synthetic cited answer [1].'
    assert result['sources'][0]['title'] == paper['title']
    complete.assert_called_once()

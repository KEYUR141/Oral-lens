import json
import io
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from db import database, inspection
from scripts.inspect_db import main as inspect_main
from scripts.load_local_abstracts import load_rows, main as load_main


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_and_docs_start_without_database_or_model(monkeypatch, client):
    monkeypatch.setattr(database.engine, 'connect', MagicMock(side_effect=AssertionError('No DB access expected')))
    assert client.get('/health').json()['database_checked'] is False
    assert client.get('/docs').status_code == 200
    paths = client.get('/openapi.json').json()['paths']
    assert '/papers/{paper_id}/passages' in paths


def test_legacy_query_disabled_before_retrieval(monkeypatch, client):
    monkeypatch.setenv('ENABLE_LEGACY_QUERY', 'false')
    response = client.post('/query', json={'query': 'Compare study designs.'})
    assert response.status_code == 503
    assert 'disabled' in response.json()['detail']


def test_inspection_errors_do_not_disclose_driver_details(monkeypatch, client):
    secret = 'postgresql://user:do-not-disclose@private-host/database'
    monkeypatch.setattr(inspection, 'database_status', MagicMock(side_effect=RuntimeError(secret)))
    response = client.get('/database/status')
    assert response.status_code == 503
    assert secret not in response.text


def test_papers_pagination_and_filter_pass_through(monkeypatch, client):
    operation = MagicMock(return_value={'items': [], 'limit': 5, 'offset': 10})
    monkeypatch.setattr(inspection, 'list_papers', operation)
    response = client.get('/papers', params={'limit': 5, 'offset': 10, 'search': 'biomarker'})
    assert response.status_code == 200
    operation.assert_called_once_with(5, 10, 'biomarker')
    assert client.get('/papers?limit=101').status_code == 422
    assert client.get('/papers?offset=-1').status_code == 422


def test_semantic_paper_discovery_deduplicates_and_never_auto_selects(monkeypatch, client):
    from app import retrieval, visualize
    lexical = MagicMock(return_value=[
        {'id': 1, 'paper_id': 'paper-a', 'title': 'A', 'year': 2024, 'source': 'abstract', 'rank': 0.2},
    ])
    embed = MagicMock(return_value=[0.1, 0.2])
    nearest = MagicMock(return_value=[
        {'id': 1, 'paper_id': 'paper-a', 'title': 'A', 'source': 'abstract', 'similarity': 0.8},
        {'id': 2, 'paper_id': 'paper-a', 'title': 'A', 'source': 'fulltext', 'similarity': 0.7},
        {'id': 3, 'paper_id': 'paper-b', 'title': 'B', 'source': 'abstract', 'similarity': 0.6},
    ])
    monkeypatch.setattr(retrieval, 'embed_query', embed)
    monkeypatch.setattr(visualize, 'nearest_rows', nearest)
    monkeypatch.setattr(inspection, 'search_paper_content', lexical)
    response = client.post('/papers/search/semantic', json={'query': 'mouse tongue', 'limit': 2})
    assert response.status_code == 200
    assert [item['paper_id'] for item in response.json()['items']] == ['paper-a', 'paper-b']
    assert 'paper_ids' not in response.json()
    assert [item['match_method'] for item in response.json()['items']] == ['text', 'embedding']
    lexical.assert_called_once_with('mouse tongue', 2)
    embed.assert_called_once_with('mouse tongue')
    nearest.assert_called_once_with([0.1, 0.2], top_k=10)
    assert client.post('/papers/search/semantic', json={'query': '  '}).status_code == 422
    assert client.post('/papers/search/semantic', json={'query': 'x' * 301}).status_code == 422


def test_missing_paper_returns_404(monkeypatch, client):
    monkeypatch.setattr(inspection, 'paper_detail', lambda paper_id: None)
    assert client.get('/papers/missing').status_code == 404


def test_stored_passage_preview_is_read_only_route(monkeypatch, client):
    operation = MagicMock(return_value={
        'id': 115, 'paper_id': 'paper-a', 'source': 'abstract', 'chunk_index': 0, 'text': 'Stored excerpt.'
    })
    monkeypatch.setattr(inspection, 'passage_by_id', operation)
    assert client.get('/passages/115').json()['text'] == 'Stored excerpt.'
    operation.assert_called_once_with(115)
    assert client.get('/passages/not-an-id').status_code == 422


def test_source_filter_rejected_before_database(client):
    assert client.get('/papers/example/passages?source=arbitrary').status_code == 422


def test_special_character_password_is_not_parsed_as_url(monkeypatch):
    monkeypatch.setenv('DATABASE_URL', '')
    password = 'p@ss:/?# and spaces'
    monkeypatch.setenv('DB_PASSWORD', password)
    url = database.build_database_url()
    assert url.password == password
    assert password not in str(url)


def test_database_url_takes_precedence(monkeypatch):
    monkeypatch.setenv('DATABASE_URL', 'postgresql://reader:secret@db.example/research?sslmode=require')
    monkeypatch.setenv('DB_HOST', 'ignored.example')
    url = database.build_database_url()
    assert url.host == 'db.example'
    assert url.drivername == 'postgresql+psycopg2'
    assert url.query['sslmode'] == 'require'


@pytest.mark.parametrize('environment,requested', [('true', False), ('false', True)])
def test_inspection_transaction_cannot_bypass_readonly(monkeypatch, environment, requested):
    monkeypatch.setenv('DB_READ_ONLY', environment)
    connection = MagicMock()
    monkeypatch.setattr(database.engine, 'connect', MagicMock())
    database.engine.connect.return_value.__enter__.return_value = connection
    with database.get_db(read_only=requested):
        pass
    assert str(connection.execute.call_args.args[0]) == 'SET TRANSACTION READ ONLY'
    connection.rollback.assert_called_once()
    connection.commit.assert_not_called()


def test_write_transaction_rolls_back_on_error(monkeypatch):
    monkeypatch.setenv('DB_READ_ONLY', 'false')
    connection = MagicMock()
    monkeypatch.setattr(database.engine, 'connect', MagicMock())
    database.engine.connect.return_value.__enter__.return_value = connection
    with pytest.raises(RuntimeError):
        with database.get_db():
            raise RuntimeError('simulated failure')
    connection.rollback.assert_called_once()
    connection.commit.assert_not_called()


def test_schema_creation_blocked_before_connect(monkeypatch):
    from db.models import create_tables
    monkeypatch.setenv('DB_READ_ONLY', 'true')
    connect = MagicMock(side_effect=AssertionError('No connection should open'))
    monkeypatch.setattr(database.engine, 'connect', connect)
    with pytest.raises(RuntimeError, match='writes are disabled'):
        create_tables()
    connect.assert_not_called()


def test_inspection_cli_hides_connection_details(monkeypatch, capsys):
    monkeypatch.setattr(inspection, 'database_status', MagicMock(side_effect=RuntimeError('secret-password')))
    assert inspect_main(['status']) == 1
    assert 'secret-password' not in capsys.readouterr().err


def test_inspection_cli_roundtrips_unicode_on_windows_codepage(monkeypatch):
    result = {'items': [{'title': 'Synthetic PA28γ study – comparison'}]}
    monkeypatch.setattr(inspection, 'list_papers', lambda *args: result)
    output = io.BytesIO()
    stream = io.TextIOWrapper(output, encoding='cp1252')
    monkeypatch.setattr('sys.stdout', stream)
    assert inspect_main(['papers', '--limit', '1']) == 0
    stream.flush()
    assert json.loads(output.getvalue().decode('cp1252')) == result


def test_local_abstract_loader_is_dry_run_by_default(tmp_path, monkeypatch, capsys):
    path = tmp_path / 'abstracts.json'
    path.write_text(json.dumps([{'paper_id': 'fixture', 'title': 'Synthetic fixture',
                                'embedding': [0.0] * 768}]), encoding='utf-8')
    monkeypatch.setattr(database.engine, 'connect', MagicMock(side_effect=AssertionError('No DB expected')))
    assert load_main(['--file', str(path)]) == 0
    assert 'Dry run' in capsys.readouterr().out


def test_loader_rejects_invalid_vector_before_database(tmp_path):
    path = tmp_path / 'bad.json'
    path.write_text(json.dumps([{'paper_id': 'fixture', 'title': 'Synthetic fixture',
                                'embedding': [0.0] * 767}]), encoding='utf-8')
    with pytest.raises(ValueError, match='768'):
        load_rows(path)

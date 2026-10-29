"""Small Meta-only completion client shared by the app and manual smoke test."""

import os
import re
from dataclasses import dataclass, field

import requests

from utils import settings

META_CHAT_URL = 'https://api.meta.ai/v1/chat/completions'


class MuseConfigurationError(ValueError):
    """An actionable configuration error that never includes credential values."""


class MuseAPIError(RuntimeError):
    def __init__(self, message: str, *, status_code: int | None = None,
                 code: str | None = None, finish_reason: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.finish_reason = finish_reason


@dataclass(frozen=True)
class MuseConfiguration:
    api_key: str = field(repr=False)
    model: str


@dataclass(frozen=True)
class MuseCompletion:
    text: str
    model: str
    usage: dict
    finish_reason: str | None = None


def get_muse_configuration() -> MuseConfiguration:
    api_key = os.getenv('Meta_Muse_API_KEY', '').strip()
    model = os.getenv('Meta_Muse_MODEL', '').strip()
    if not api_key:
        raise MuseConfigurationError('Set Meta_Muse_API_KEY in Oral-lens/.env. Do not share it in chat.')
    if not model:
        raise MuseConfigurationError('Set Meta_Muse_MODEL in Oral-lens/.env, for example muse-spark-1.3.')
    if not re.fullmatch(r'muse-[a-zA-Z0-9_.-]+', model):
        raise MuseConfigurationError('Meta_Muse_MODEL must be a Meta Muse model ID, not a display name or API key.')
    return MuseConfiguration(api_key=api_key, model=model)


def _redact(value: str, api_key: str, limit: int = 400) -> str:
    return value.replace(api_key, '[redacted]')[:limit]


def _error_details(response, api_key):
    try:
        body = response.json()
    except ValueError:
        return None, None
    error = body.get('error') if isinstance(body, dict) else None
    if not isinstance(error, dict):
        return None, None
    code = error.get('code')
    message = error.get('message')
    return (
        _redact(str(code), api_key, 100) if code is not None else None,
        _redact(message, api_key) if isinstance(message, str) else None,
    )


def complete(messages: list[dict], *, max_tokens: int = 1500,
             reasoning_effort: str = 'minimal', timeout: float = 60) -> MuseCompletion:
    config = get_muse_configuration()
    if not 1 <= max_tokens <= 4096 or not 0 < timeout <= 120:
        raise ValueError('Use 1–4096 output tokens and a timeout of 1–120 seconds.')
    try:
        response = requests.post(
            META_CHAT_URL,
            headers={'Authorization': f'Bearer {config.api_key}', 'Content-Type': 'application/json'},
            json={'model': config.model, 'messages': messages,
                  'max_tokens': max_tokens, 'reasoning_effort': reasoning_effort},
            timeout=(10, timeout),
            allow_redirects=False,
        )
    except requests.Timeout:
        raise MuseAPIError('Meta request timed out. No automatic retry was made.', code='timeout') from None
    except requests.RequestException:
        raise MuseAPIError(
            'Could not reach Meta Model API. Check network/proxy access; billing was not verified.',
            code='connection_error',
        ) from None

    if response.status_code != 200:
        code, detail = _error_details(response, config.api_key)
        explanations = {
            400: 'Meta rejected the request. Check the model ID and supported parameters.',
            401: 'Meta rejected authentication. Check or regenerate the API key.',
            402: 'Meta requires billing/payment action. Complete verification in the Meta dashboard.',
            403: 'Meta denied access. Check model/account permissions and any verification requirements.',
            404: 'The configured model or endpoint was not found or is unavailable to this account.',
            429: 'Meta reported a rate limit or quota restriction. Check account usage and credits.',
        }
        explanation = explanations.get(response.status_code, 'Meta returned an unsuccessful response.')
        message = f'HTTP {response.status_code}: {explanation}'
        if detail:
            message += f' Provider message: {detail}'
        raise MuseAPIError(message, status_code=response.status_code, code=code)

    try:
        body = response.json()
        choice = body['choices'][0]
        message = choice['message']
        content = message.get('content')
        if isinstance(content, list):
            content = ''.join(part.get('text', '') for part in content
                              if isinstance(part, dict) and isinstance(part.get('text'), str))
        if not isinstance(content, str) or not content.strip():
            raise MuseAPIError(
                'Meta accepted the request but returned no visible text. '
                'Check output budget, finish reason, or model response handling.',
                status_code=200, code='empty_output',
                finish_reason=choice.get('finish_reason'),
            )
        usage = body.get('usage')
        usage = {name: value for name, value in usage.items()
                 if name in {'prompt_tokens', 'completion_tokens', 'total_tokens'}
                 and isinstance(value, int)} if isinstance(usage, dict) else {}
        return MuseCompletion(
            text=_redact(content.strip(), config.api_key, len(content)),
            model=config.model,
            usage=usage,
            finish_reason=choice.get('finish_reason'),
        )
    except (ValueError, KeyError, IndexError, TypeError, AttributeError):
        raise MuseAPIError(
            'Meta returned an unexpected response format; generation could not be confirmed.',
            status_code=200, code='invalid_response',
        ) from None

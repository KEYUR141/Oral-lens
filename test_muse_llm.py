"""Manual, bounded Meta API smoke test. Importing this file never makes a request.

Run: uv run python test_muse_llm.py
Config only: uv run python test_muse_llm.py --check-config
"""

import argparse
import json
import os
import sys
import time

from app.muse import MuseAPIError, MuseConfigurationError, complete, get_muse_configuration


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-config', action='store_true', help='Validate settings without contacting Meta.')
    parser.add_argument('--max-tokens', type=int, default=128, choices=range(16, 513), metavar='16..512')
    args = parser.parse_args(argv)
    try:
        config = get_muse_configuration()
        if args.check_config:
            print(json.dumps({'configured': True, 'model': config.model, 'request_sent': False}))
            return 0
        started = time.monotonic()
        result = complete(
            [{'role': 'user', 'content': 'Reply with exactly MUSE_OK.'}],
            max_tokens=args.max_tokens, timeout=30,
        )
        print(json.dumps({
            'ok': True, 'provider': 'Meta Model API', 'model': result.model,
            'reply': result.text[:200], 'usage': result.usage,
            'finish_reason': result.finish_reason,
            'elapsed_seconds': round(time.monotonic() - started, 2),
        }, ensure_ascii=True, indent=2))
        return 0
    except MuseConfigurationError as error:
        print(json.dumps({'ok': False, 'request_sent': False, 'error': str(error),
                          'key_configured': bool(os.getenv('Meta_Muse_API_KEY', '').strip())}), file=sys.stderr)
        return 2
    except MuseAPIError as error:
        print(json.dumps({'ok': False, 'http_status': error.status_code,
                          'error_code': error.code, 'error': str(error)}, ensure_ascii=True, indent=2),
              file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())

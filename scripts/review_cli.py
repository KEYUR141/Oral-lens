"""Run the same draft review as the interface, directly from the terminal."""
import argparse
import json
import sys
from pathlib import Path

from pydantic import ValidationError

from app.review_schemas import ReviewRequest


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    papers = sub.add_parser('papers', help='List paper IDs without model calls.')
    papers.add_argument('--search')
    papers.add_argument('--limit', type=int, default=12)
    papers.add_argument('--offset', type=int, default=0)
    review = sub.add_parser('review', help='Review a claim; prompts when no input is supplied.')
    review.add_argument('--claim')
    review.add_argument('--paper-id', action='append', dest='paper_ids', help='Repeat for each selected paper.')
    review.add_argument('--request', type=Path, help='UTF-8 JSON request copied from the interface.')
    review.add_argument('--check-only', action='store_true', help='Validate input without DB/model access.')
    args = parser.parse_args(argv)
    if args.command == 'papers':
        from scripts.inspect_db import main as inspect
        options = ['papers', '--limit', str(args.limit), '--offset', str(args.offset)]
        if args.search:
            options.extend(['--search', args.search])
        return inspect(options)
    if args.request and (args.claim is not None or args.paper_ids is not None):
        parser.error('--request cannot be combined with --claim or --paper-id.')
    try:
        if args.request:
            request = ReviewRequest.model_validate_json(args.request.read_text(encoding='utf-8-sig'))
        else:
            claim = args.claim
            paper_ids = args.paper_ids
            if claim is None and paper_ids is None:
                print('Research literature only. No patient data. Runs use Meta credits; results are not saved.', file=sys.stderr)
                claim = input('Research claim: ')
                paper_ids = [value.strip() for value in input('Paper IDs (comma-separated): ').split(',')]
            request = ReviewRequest.model_validate({'claim': claim, 'paper_ids': paper_ids})
    except (OSError, UnicodeError, ValidationError, EOFError):
        print('Invalid input. Provide a 5-2000 character claim and 1-10 nonempty paper IDs, '
              'or a readable UTF-8 JSON request containing claim and paper_ids.', file=sys.stderr)
        return 2
    if args.check_only:
        print(json.dumps({'input_valid': True, 'request': request.model_dump(),
                          'model_called': False}, ensure_ascii=True, indent=2))
        return 0
    print('Running scope check, retrieval, assessment and source checks. Meta credits may be used.', file=sys.stderr)
    try:
        from app.review_workflow import run_review
        result = run_review(request)
    except Exception:
        print('Review could not complete. Check local configuration and backend dependencies. '
              'No automatic retry was made.', file=sys.stderr)
        return 1
    # ASCII escaping avoids Windows terminal encoding failures for paper text.
    print(json.dumps(result.model_dump(), ensure_ascii=True, indent=2))
    return 1 if result.status == 'failed' else 3 if result.status == 'out_of_scope' else 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print('\nInterrupted; no automatic retry. An in-flight provider request may still be billed.', file=sys.stderr)
        raise SystemExit(130)

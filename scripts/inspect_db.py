"""Inspect the existing database without schema changes, writes, or model API calls."""
import argparse
import json
import sys


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('status')
    papers = sub.add_parser('papers')
    papers.add_argument('--limit', type=int, default=20)
    papers.add_argument('--offset', type=int, default=0)
    papers.add_argument('--search')
    detail = sub.add_parser('paper')
    detail.add_argument('paper_id')
    passages = sub.add_parser('passages')
    passages.add_argument('paper_id')
    passages.add_argument('--limit', type=int, default=20)
    passages.add_argument('--offset', type=int, default=0)
    passages.add_argument('--source', choices=['abstract', 'fulltext', 'figure_captions'])
    args = parser.parse_args(argv)
    try:
        from db.inspection import database_status, list_papers, paper_detail, paper_passages
        if args.command == 'status':
            result = database_status()
        elif args.command == 'papers':
            result = list_papers(args.limit, args.offset, args.search)
        elif args.command == 'paper':
            result = paper_detail(args.paper_id)
            if result is None:
                print('Paper not found.', file=sys.stderr)
                return 1
        else:
            result = paper_passages(args.paper_id, args.limit, args.offset, args.source)
        # ASCII-safe JSON round-trips Unicode titles on Windows legacy code pages.
        print(json.dumps(result, indent=2, ensure_ascii=True, default=str))
        return 0
    except Exception as error:
        # Never print a URL, password, raw SQL or driver message.
        if type(error).__name__ == 'SchemaNotReadyError':
            print(str(error), file=sys.stderr)
        else:
            print('Database inspection failed. Check Oral-lens/.env, PostgreSQL availability, '
                  'network access and account permissions. No data was changed. '
                  f'Error type: {type(error).__name__}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())

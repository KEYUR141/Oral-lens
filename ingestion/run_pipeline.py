"""Run explicitly selected inherited ingestion stages; nothing runs on API startup."""
import argparse
from importlib import import_module

from ingestion.config import ensure_data_directories
from utils.logger import get_logger

logger = get_logger(__name__)
STAGES = [
    ('fetch_papers', 'ingestion.fetch_papers'),
    ('clean_papers', 'ingestion.clean_papers'),
    ('finalize_papers', 'ingestion.finalize_papers'),
    ('embed_abstracts', 'embeddings.embed_papers'),
    ('download_pdfs', 'ingestion.download_pdfs'),
    ('extract_fulltext', 'ingestion.extract_fulltext'),
    ('embed_fulltext', 'embeddings.embed_fulltext'),
    ('extract_visuals', 'ingestion.extract_visuals'),
    ('embed_captions', 'embeddings.embed_captions'),
    ('build_visualization', 'embeddings.build_visualization'),
]
WRITE_STAGES = {'embed_abstracts', 'embed_fulltext', 'embed_captions'}


def main(stage: str = 'all'):
    names = [name for name, _ in STAGES]
    if stage != 'all' and stage not in names:
        raise ValueError(f'Unknown stage {stage}. Valid stages: {names}')
    selected = [(name, module) for name, module in STAGES if stage == 'all' or stage == name]
    if any(name in WRITE_STAGES for name, _ in selected):
        from db.database import require_db_writes
        require_db_writes()
    ensure_data_directories()
    for name, module in selected:
        logger.info('Running stage: %s', name)
        import_module(module).main()
    logger.info('Pipeline complete.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', default='all', choices=['all', *[name for name, _ in STAGES]])
    parser.add_argument('--list', action='store_true', help='List stages without fetching or writing.')
    args = parser.parse_args()
    if args.list:
        for name, _ in STAGES:
            print(name)
    else:
        main(args.stage)

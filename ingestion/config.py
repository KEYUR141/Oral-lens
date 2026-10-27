"""Inherited paths resolved against this repository, independent of shell CWD."""
from pathlib import Path
from utils.settings import DATA_DIR as ROOT_DATA_DIR

DATA_DIR = str(ROOT_DATA_DIR)
RAW_DIR = str(ROOT_DATA_DIR / 'raw')
PROCESSED_DIR = str(ROOT_DATA_DIR / 'processed')
PDF_DIR = str(ROOT_DATA_DIR / 'pdfs')
PDF_RAW_DIR = str(ROOT_DATA_DIR / 'pdfs' / 'raw')
EXTRACTED_TEXT_DIR = str(ROOT_DATA_DIR / 'pdfs' / 'extracted_text')
IMAGES_DIR = str(ROOT_DATA_DIR / 'pdfs' / 'images')
VISUALS_DIR = str(ROOT_DATA_DIR / 'pdfs' / 'visuals')
RAW_PAPERS_FILE = str(ROOT_DATA_DIR / 'raw' / 'oral_cancer_papers.json')
CLEAN_PAPERS_FILE = str(ROOT_DATA_DIR / 'processed' / 'oral_cancer_papers_clean.json')
FINAL_PAPERS_FILE = str(ROOT_DATA_DIR / 'processed' / 'oral_cancer_papers_final.json')


def ensure_data_directories():
    for directory in (RAW_DIR, PROCESSED_DIR, PDF_RAW_DIR, EXTRACTED_TEXT_DIR, IMAGES_DIR, VISUALS_DIR):
        Path(directory).mkdir(parents=True, exist_ok=True)

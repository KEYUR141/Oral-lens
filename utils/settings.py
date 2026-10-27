"""Project-local configuration shared by the API, scripts and ingestion."""

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = PROJECT_ROOT / '.env'
load_dotenv(ENV_FILE, override=False)


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {'1', 'true', 'yes', 'on'}:
        return True
    if normalized in {'0', 'false', 'no', 'off'}:
        return False
    raise ValueError(f'{name} must be true or false.')


def project_path(value: str) -> Path:
    path = Path(value).expanduser()
    return path.resolve() if path.is_absolute() else (PROJECT_ROOT / path).resolve()


DATA_DIR = project_path(os.getenv('DATA_DIR', 'data'))
MODEL_DIR = PROJECT_ROOT / 'embeddings' / 'models'
if os.getenv('HF_HOME'):
    os.environ['HF_HOME'] = str(project_path(os.environ['HF_HOME']))


import logging
from pathlib import Path
from datetime import datetime


# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Log directory
LOG_DIR = PROJECT_ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Log file
LOG_FILE = LOG_DIR / f"mechnova_{datetime.now():%Y%m%d_%H%M%S}.log"


def get_logger(name):

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        file_handler = logging.FileHandler(LOG_FILE)
        file_handler.setFormatter(formatter)

        logger.addHandler(file_handler)

    return logger

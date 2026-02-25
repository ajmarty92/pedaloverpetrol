import logging
import sys

from src.core.settings import settings


def setup_logging() -> None:
    root = logging.getLogger()
    root.setLevel(settings.log_level.upper())

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(settings.log_level.upper())
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    if not root.handlers:
        root.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)

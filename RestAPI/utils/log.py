import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
import os

class TruncatingFormatter(logging.Formatter):
    def __init__(self, fmt=None, datefmt=None, max_length=1000):
        super().__init__(fmt=fmt, datefmt=datefmt)
        self.max_length = max_length

    def format(self, record):
        original_message = super().format(record)
        if len(original_message) > self.max_length:
            return original_message[:self.max_length] + '... [Message truncated]'
        return original_message

class LoggerManager:
    _instance = None  # Class attribute to hold the single instance

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(LoggerManager, cls).__new__(cls)
        return cls._instance

    def __init__(
        self,
        log_level=os.getenv("LOG_LEVEL", default="WARNING"),
        log_file="../Logs/app.log",
    ):
        # Only set up the logger once
        if not hasattr(self, 'logger'):
            self.log_level = log_level
            self.log_file = log_file
            self.logger = self.setup_logger()

    def setup_logger(self):
        logger = logging.getLogger("REST API Flask Server")
        logger.setLevel(self.log_level)
        log_formatter = TruncatingFormatter(
        "%(asctime)s %(threadName)s %(levelname)s %(name)s %(message)s", max_length=2000
    )

        # Create a console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(log_formatter)
        console_handler.setLevel(self.log_level)
        logger.addHandler(console_handler)

        # Create a rotating file handler (optional — skip if directory missing)
        try:
            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
            rotate_handler = RotatingFileHandler(
                filename=self.log_file, maxBytes=10000000, backupCount=10
            )
            rotate_handler.setFormatter(log_formatter)
            rotate_handler.setLevel(self.log_level)
            logger.addHandler(rotate_handler)
        except Exception:
            pass

        return logger

import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

class LoggerManager:
    def __init__(self, log_level=logging.DEBUG, log_file="app.log"):
        self.log_level = log_level
        self.log_file = log_file
        self.logger = self.setup_logger()

    def setup_logger(self):
        logger = logging.getLogger('REST API Flask Server: %s' % (datetime.now()))
        logger.setLevel(self.log_level)
        log_formatter = logging.Formatter('%(asctime)s %(threadName)s %(levelname)s %(name)s %(message)s')

        # Create a console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(log_formatter)
        console_handler.setLevel(self.log_level)
        logger.addHandler(console_handler)

        # Create a rotating file handler
        rotate_handler = RotatingFileHandler(filename=self.log_file, maxBytes=10000000, backupCount=10)
        rotate_handler.setFormatter(log_formatter)
        rotate_handler.setLevel(self.log_level)
        logger.addHandler(rotate_handler)

        return logger

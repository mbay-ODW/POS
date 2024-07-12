from pymongo import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import ConnectionFailure
from utils.log import LoggerManager
import time
import os
import sys


class Database(object):
    logger = LoggerManager().logger
    _instance = None
    MAX_RECONNECT_ATTEMPTS = 3
    RECONNECT_DELAY = 10  # in seconds

    @classmethod
    def get_instance(cls, db_name=None):
        if cls._instance is None:
            cls._instance = cls(db_name)
        return cls._instance

    def __init__(self, db_name):
        if Database._instance is not None:
            raise Exception("This class is a singleton")
        else:
            Database._instance = self
            self._init_connection(db_name)

    def _init_connection(self, db_name):
        self.logger.debug(f"Initializing database object")
        attempts = 0
        while attempts < self.MAX_RECONNECT_ATTEMPTS:
            try:
                host = os.getenv("DATABASE_HOST", default="mongodb+srv://localhost:27017")
                cert = os.getenv("DATABASE_CERT_FILE", default="../dev-X509-cert.pem")
                self.client = MongoClient(
                    host=f"{host}?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority",
                    tls=True,
                    tlsCertificateKeyFile=f"{cert}",
                    server_api=ServerApi("1"),
                    serverSelectionTimeoutMS=1000,
                    socketTimeoutMS=1000,
                )
                self.db = self.client[db_name]
                break
            except ConnectionFailure as e:
                self.logger.error(
                    f"Received the following error: {e}. Attempting to reconnect."
                )
                attempts += 1
                time.sleep(self.RECONNECT_DELAY)
            except Exception as e:
                self.logger.error(
                    f"Received the following error: {e}. Raising Disconnect Exception"
                )
        if attempts == self.MAX_RECONNECT_ATTEMPTS:
            self.logger.critical(
                f"Received the following error: {e}. Raising Disconnect Exception"
            )
            sys.exit("Critical exception, can not connect to mongo.")

    def close_connection(self):
        try:
            self.client.close()
        except Exception as e:
            self.logger.error(f"Received the following error: {e}.")

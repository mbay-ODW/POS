from pymongo import MongoClient
import logging

class Disconnect(Exception):
    pass

class Database(object):
    logger = logging.getLogger(__name__)
    def __init__(self):
        self.logger.debug(f'Initializing database object')
        try:
            #self.client = MongoClient(host=['localhost:27021','localhost:27022','localhost:27023',],replicaset='iLager')
            #self.client = MongoClient(host='localhost:27017', serverSelectionTimeoutMS=1000, socketTimeoutMS=1000)
            self.client = MongoClient(host='mongodb:27017', serverSelectionTimeoutMS=1000, socketTimeoutMS=1000)
            #self.client = MongoClient(port=27017, serverSelectionTimeoutMS=1000, socketTimeoutMS=1000)
            self.db=self.client.Test
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Raising Disconnect Exception')
            raise Disconnect
    def close_connection(self):
        try:
            self.client.close()
        except Exception as e:
            self.logger.error(f'Received the following error: {e}.')


from resources.base import BaseList, SpecificBase
from flask import abort
import logging



class SchemasList(BaseList):
    logger = logging.getLogger(__name__)
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.schema
    def post(self):
        abort(403)
    


class SpecificSchemas(SpecificBase):
    logger = logging.getLogger(__name__)
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.schema
    def delete(self,id):
        abort(403)
from resources.base import BaseList, SpecificBase
from utils.log import LoggerManager

class ProductsList(BaseList):
    logger = LoggerManager().logger
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.products

class SpecificProducts(SpecificBase):
    logger = LoggerManager().logger
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.products
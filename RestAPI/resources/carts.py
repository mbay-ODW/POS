from resources.base import BaseList, SpecificBase
from utils.log import LoggerManager

class CartsList(BaseList):
    logger = LoggerManager().logger
    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__(api=None, *args, **kwargs)
        self.DatabaseConnector = self.Database.db.carts

class SpecificCarts(SpecificBase):
    logger = LoggerManager().logger
    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__(api=None, *args, **kwargs)
        self.DatabaseConnector = self.Database.db.carts
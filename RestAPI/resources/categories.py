from resources.base import BaseList, SpecificBase
from utils.log import LoggerManager

class CategoriesList(BaseList):
    logger = LoggerManager().logger
    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__(api=None, *args, **kwargs)
        self.DatabaseConnector = self.Database.db.categories

class SpecificCategories(SpecificBase):
    logger = LoggerManager().logger
    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__(api=None, *args, **kwargs)
        self.DatabaseConnector = self.Database.db.categories
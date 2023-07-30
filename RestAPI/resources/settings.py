from resources.base import BaseList, SpecificBase
from logger import LoggerManager


class SettingsList(BaseList):
    logger = LoggerManager().logger
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.settings
    


class SpecificSetting(SpecificBase):
    logger = LoggerManager().logger
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.settings
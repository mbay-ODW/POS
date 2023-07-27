from resources.base import BaseList, SpecificBase
import logging


class TerminalList(BaseList):
    logger = logging.getLogger(__name__)
    def __init__(self):
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.terminals
        
    


class SpecificTerminal(SpecificBase):
    logger = logging.getLogger(__name__)
    def __init__(self):
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.terminals
        
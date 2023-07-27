import logging
from flask import jsonify, make_response, request, abort, Flask
from utils.documents import log, check_document_exist
from utils.documents import check_id_is_valid
from bson import ObjectId, Timestamp
from utils.database import Database

class Printing():
    logger = logging.getLogger('__main__.' + __name__)
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        self.Database = Database()
        self.DatabaseConnector = self.Database.db.orders

    @log
    @check_id_is_valid
    @check_document_exist
    def post(self,id):
        try:
            order = self.DatabaseConnector.find_one({'_id': ObjectId(id)})
            self.logger.debug(f'Received the following order from the database: {order}. Returning document and 200 as status_code.')
            ### here comes the logic for printing
            return make_response(jsonify({"message": "success"}), 200)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    
    def __del__(self):
        self.Database.close_connection()
        
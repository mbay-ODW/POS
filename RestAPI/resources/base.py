from dataclasses import field
from typing import Collection
from flask_restful import Api, Resource, reqparse
from utils.database import Database
from utils.documents import check_body_is_json
from utils.documents import prep_document_for_response
from utils.documents import log, check_document_exist
from utils.documents import check_id_is_valid
from flask import jsonify, make_response, request, abort, Flask
from pymongo.operations import UpdateOne,InsertOne
from bson import ObjectId, Timestamp
from datetime import datetime
import time
from logger import LoggerManager
from functools import wraps


class BaseList(Resource):
    logger = LoggerManager().logger
    def __init__(self):
        self.Database = Database()
    @log
    def get(self):
        try: 
            # Adding start argument or using 0 if none delivered as ?start=0
            start=request.args.get('start', 0)
            # Adding limit argument or using 50 if none delivered as ?limit=200
            limit=request.args.get('limit', 50)
            # Adding arguments from field to the projection. ?fields=test,test2,test3 will be seen as three fields that will be used.
            fields=request.args.get('fields','')
            projection = {}
            if len(fields) > 0:
                for i in fields.split(','):
                    projection.update({i: 1})
            # Adding sorting argument or fields to be used sorting for, if none delivered id will be used. Example: ?sortBy=group,name
            sortBy=request.args.get('sortBy','_id')
            # Get all documents in collection
            self.logger.debug(f'Requesting all documents from the database')
            entries = self.DatabaseConnector.find({},projection).limit(int(limit)).skip(int(start)).sort(sortBy)
            self.logger.debug(f'Preparing the documents for beeing able to be returned via body')
            documents = [prep_document_for_response(x) for x in entries]
            self.logger.debug(f'The following documents have been processed and are returned: {documents}')
            return make_response(jsonify(documents), 200)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    @log
    @check_body_is_json
    def post(self):
        try:
            # Create a new item based on the json in the body of the post request.
            object = request.get_json(force=True)
            # Adding lastModified to object
            self.logger.debug(f'Adding lastModified to the json object')
            object.update({"lastModified": Timestamp(datetime.utcnow(),1)})
            self.logger.debug(f'Adding creationTime to the json object')
            object.update({"creationTime": Timestamp(datetime.utcnow(),1)})
            self.logger.debug(f'Writing json object to the database.')
            # Remove the "_id" key from the object variable, if it exists
            object.pop("_id", None)
            id = self.DatabaseConnector.insert_one(object)
            # Check if the object was inserted
            if (id.inserted_id) :
                self.logger.info(f'Document was created.')
                self.logger.debug(f'Has the following id: {id.inserted_id}')
                return make_response(jsonify({"message": "success", "id": str(id.inserted_id)}), 201)
            else:
                self.logger.error(f'Document could have not been written to database.')
                return make_response(jsonify({"message": "Document was not inserted"}), 500)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    @log
    def __del__(self):
        self.Database.close_connection()

class SpecificBase(Resource):
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    @log
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        self.Database = Database()

    @log
    @check_id_is_valid
    @check_document_exist
    def get(self,id):
        try:
            # Get a specific item
            document = self.DatabaseConnector.find_one({'_id': ObjectId(id)})
            self.logger.debug(f'Received the following document from the database: {document}. Returning document and 200 as status_code.')
            return make_response(jsonify(prep_document_for_response(document)), 200)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    
    @log
    @check_body_is_json 
    @check_document_exist
    def put(self,id):
        try:
            # Update one or multiple fields in a specific item
            payload = request.get_json(force=True)
            self.logger.debug(payload)
            query = {}
            fragments = {}
            for i in payload:
                self.logger.debug(f'The  i looks like: {i}')
                if i != "creationTime":
                    self.logger.debug("updating fragment")
                    fragments.update({ i: payload[i]})
                else:
                    self.logger.debug("not updating fragment")
            fragments.update({"lastModified": Timestamp(datetime.utcnow(),1)})
            # Remove the "_id" key from the object variable, if it exists
            fragments.pop("_id", None)
            query['$set'] = fragments
            self.logger.debug(f'The  fragments array looks like: {fragments}')
            result = self.DatabaseConnector.update_one({'_id': ObjectId(id)},query)
            self.logger.debug(result)
            if (result.matched_count > 0):
                self.logger.info(f'Document was updated.')
                return make_response(jsonify({'message': 'success'}), 200)
            else:
                self.logger.error(f'Document could have not been written to database.')
                return make_response(jsonify({'message': 'Document was not updated'}), 500)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    @log
    @check_document_exist
    def delete(self,id):
        try:    
            # delete a document
            result = self.DatabaseConnector.delete_one({'_id': ObjectId(id)})
            # If delete_count is 1 it can be considered to be deleted.
            if (result.deleted_count == 1):
                self.logger.info(f'Document was deleted.')
                return make_response(jsonify({'message': 'success'}), 204)
            else:
                # It seems nothing was deleted
                self.logger.error(f'Document could not be deleted from database.')
                return make_response(jsonify({'message': 'Document could not be deleted.'}), 500)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    @log
    def __del__(self):
        self.Database.close_connection()
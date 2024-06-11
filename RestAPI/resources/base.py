from dataclasses import field
from typing import Collection
from flask_restx import Resource
from utils.database import Database
from utils.documents import check_body_is_json, prep_document_for_database
from utils.documents import prep_document_for_response
from utils.documents import log, check_document_exist
from utils.documents import check_id_is_valid, check_product_exist
from utils.documents import validate_query_params
from flask import jsonify, make_response, request, abort, Flask
from pymongo.operations import UpdateOne,InsertOne
from bson import ObjectId, Timestamp
from datetime import datetime,timezone
import time, os
from utils.log import LoggerManager
from functools import wraps

from urllib.parse import urlencode

caching = bool(os.getenv("CACHING", default=False))
if caching:
    from utils.cache import CacheManager

    cache = CacheManager.get_cache()


class BaseList(Resource):
    logger = LoggerManager().logger

    def __init__(self, api=None, *args, **kwargs):
        self.Database = Database.get_instance()
        # If i hand over an empty filter i can later on use that BaseList for the other GetByCase etc. as well since its only filter based changes
        self.filter = {}

    @log
    @validate_query_params
    def get(self, *args, **kwargs):
        try:
            if caching:
                self.cache_key = f"{request.path}?{urlencode(sorted(request.args.items()))}"
                self.logger.debug(
                    f"Checking if data is in cache for key: {self.cache_key} "
                )
                if cache.get(self.cache_key):
                    self.logger.debug("Getting data from cache")
                    self.logger.debug(cache.get(self.cache_key))
                    return cache.get(self.cache_key)
                self.logger.debug("Data is not in cache") 
            # Adding start argument or using 0 if none delivered as ?start=0
            skip = int(request.args.get("skip", 0))
            # Adding limit argument or using 50 if none delivered its unlimited
            pageSize = request.args.get("pageSize")
            if pageSize is not None:
                pageSize = int(pageSize)
            # Adding arguments from field to the projection. ?fields=test,test2,test3 will be seen as three fields that will be used.
            fields = request.args.get("fields", "")
            projection = {}
            if len(fields) > 0:
                for i in fields.split(","):
                    projection.update({i: 1})
            # Adding sorting argument or fields to be used sorting for, if none delivered id will be used. Example: ?sortBy=group,name
            sortBy = request.args.get("sortBy", "_id")
            self.logger.debug(f'Requesting all documents from the database')
            entries = self.DatabaseConnector.find(self.filter, projection)
            if pageSize is not None:
                entries = entries.limit(int(pageSize)).skip(int(skip))
            entries = entries.sort(sortBy, -1)
            self.logger.debug(f'Preparing the documents for beeing able to be returned via body')
            documents = [prep_document_for_response(x) for x in entries]
            self.logger.debug(f'The following documents have been processed and are returned: {documents}')
            response = {}
            response['data'] = documents
            total_count = self.DatabaseConnector.count_documents({})
            response['total'] = total_count
            if caching:
                cache.set(self.cache_key, make_response(jsonify(response), 200))
            return make_response(jsonify(response), 200)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    @log
    @check_body_is_json
    def post(self, *args, **kwargs):
        try:
            # Create a new item based on the json in the body of the post request.
            object = request.get_json(force=True)
            # Adding lastModified to object
            self.logger.debug(f'Adding lastModified to the json object')
            object.update({"lastModified": datetime.now(timezone.utc)})
            self.logger.debug(f'Adding creationTime to the json object')
            object.update({"creationTime": datetime.now(timezone.utc)})
            self.username = request.headers.get("Remote-User", "Unknown")
            self.logger.debug(f"Adding createdBy to the json object")
            object.update({"createdBy": str(self.username)})
            object.update({"modifiedBy": str(self.username)})
            object, e = prep_document_for_database(object)
            if e:
                self.logger.error(f"Received that error: {e}")
                return make_response(
                    jsonify({"message": f"{e}"}), 400
                )
            self.logger.debug(f'Writing json object to the database.')
            # Remove the "_id" key from the object variable, if it exists
            object.pop("_id", None)
            id = self.DatabaseConnector.insert_one(object)
            # Check if the object was inserted
            if (id.inserted_id) :
                self.logger.info(f'Document was created.')
                self.logger.debug(f'Has the following id: {id.inserted_id}')
                if caching:
                    self.logger.debug("Cache cleared")
                    cache.clear()
                return make_response(jsonify({"message": "success", "_id": str(id.inserted_id)}), 201)
            else:
                self.logger.error(f'Document could have not been written to database.')
                return make_response(jsonify({"message": "Document was not inserted"}), 500)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)

    def __del__(self):
        pass

class SpecificBase(Resource):
    logger = LoggerManager().logger

    @log
    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        self.Database = Database.get_instance()
    @log
    @check_id_is_valid
    @check_document_exist
    @validate_query_params
    def get(self, *args, **kwargs):
        try:
            id = kwargs.get("id")
            if caching:
                self.cache_key = f"{request.path}?{urlencode(sorted(request.args.items()))}"
                self.logger.debug(
                    f"Checking if data is in cache for key: {self.cache_key} "
                )
                if cache.get(self.cache_key):
                    self.logger.debug("Getting data from cache")
                    self.logger.debug(cache.get(self.cache_key))
                    return cache.get(self.cache_key)
                self.logger.debug("Data is not in cache")
            # Get a specific item
            document = self.DatabaseConnector.find_one({'_id': ObjectId(id)})
            self.logger.debug(f'Received the following document from the database: {document}. Returning document and 200 as status_code.')
            if caching:
                self.logger.debug("Data added to cache")
                cache.set(
                    self.cache_key,
                    make_response(jsonify(prep_document_for_response(document)), 200),
                )
            return make_response(jsonify(prep_document_for_response(document)), 200)
        except Exception as e:
            self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
            return make_response(jsonify({"message": str(e)}),500)
    
    @log
    @check_id_is_valid
    @check_body_is_json
    @check_document_exist
    def put(self, *args, **kwargs):
        try:
            id = kwargs.get("id")
            existing_doc = self.DatabaseConnector.find_one({"_id": ObjectId(id)})
            # Update one or multiple fields in a specific item
            payload = request.get_json(force=True)
            self.logger.debug(payload)
            for key in payload:
                if key not in [
                    "creationTime",
                    "createdBy",
                    "_id",
                ]:  # Exclude fields that shouldn't be updated
                    existing_doc[key] = payload[key]
            existing_doc.update({"lastModified": datetime.now(timezone.utc)})
            self.username = request.headers.get("Remote-User", "Unknown")
            self.logger.debug(f"Adding createdBy to the json object")
            existing_doc.update({"modifiedBy": str(self.username)})
            existing_doc, e = prep_document_for_database(existing_doc)
            if e:
                self.logger.error(f"Received that error: {e}")
                return make_response(
                    jsonify({"message": f"{e}"}), 400
                )
            # Remove the "_id" key from the object variable, if it exists
            existing_doc.pop("_id", None)
            result = self.DatabaseConnector.replace_one(
                {"_id": ObjectId(id)}, existing_doc
            )
            self.logger.debug(result)
            if result.matched_count > 0:
                self.logger.info(f"Document was updated.")
                if caching:
                    self.logger.debug("Cache cleared")
                    cache.clear()
                return make_response(jsonify({"message": "success"}), 200)
            else:
                self.logger.error(f"Document have not been written to database.")
                return make_response(
                    jsonify({"message": "Document was not updated"}), 500
                )
        except Exception as e:
            self.logger.error(
                f"Received the following error: {e}. Can not proceed, returning error message and status_code 500."
            )
            return make_response(jsonify({"message": str(e)}), 500)
    
    @log
    @check_id_is_valid
    @check_body_is_json
    @check_document_exist
    def patch(self, *args, **kwargs):
        try:
            id = kwargs.get("id")
            self.logger.debug(f"The id of patch request is: {id}")
            # Update one or multiple fields in a specific article
            payload = request.get_json(force=True)
            fields = payload
            filter = { '_id': ObjectId(id) }
            query = {}
            fragments = {}
            for i in fields:
                fragments.update({ i: fields[i]})
            fragments.update({"lastModified": datetime.now(timezone.utc)})
            self.username = request.headers.get("Remote-User", "Unknown")
            self.logger.debug(f"Updating modifiedBy to the json object")
            fragments.update({"modifiedBy": str(self.username)})
            fragments.pop("_id",None)
            query['$set'] = fragments
            result = self.DatabaseConnector.update_one(filter,query)
            self.logger.debug(result)
            if result.matched_count > 0:
                self.logger.info(f"Document was updated.")
                if caching:
                    self.logger.debug("Cache cleared")
                    cache.clear()
                return make_response(jsonify({"message": "success"}), 200)
            else:
                self.logger.error(f"Document has not been written to database.")
                return make_response(
                    jsonify({"message": "Document was not updated"}), 500
                )
        except Exception as e:
            self.logger.error(
                f"Received the following error: {e}. Can not proceed, returning error message and status_code 500."
            )
            return make_response(jsonify({"message": str(e)}), 500)

    @log
    @check_id_is_valid
    @check_document_exist
    def delete(self, *args, **kwargs):
        try:
            # delete a document
            id = kwargs.get("id")
            result = self.DatabaseConnector.delete_one({"_id": ObjectId(id)})
            # If delete_count is 1 it can be considered to be deleted.
            if result.deleted_count == 1:
                self.logger.info(f"Document was deleted.")
                if caching:
                    self.logger.debug("Cache cleared")
                    cache.clear()
                return make_response(jsonify({"message": "success"}), 204)
            else:
                # It seems nothing was deleted
                self.logger.error(f"Document could not be deleted from database.")
                return make_response(
                    jsonify({"message": "Document could not be deleted."}), 500
                )
        except Exception as e:
            self.logger.error(
                f"Received the following error: {e}. Can not proceed, returning error message and status_code 500."
            )
            return make_response(jsonify({"message": str(e)}), 500)

    def __del__(self):
        pass
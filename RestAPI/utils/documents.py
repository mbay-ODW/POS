from flask import abort, current_app, jsonify, request, make_response
from bson import ObjectId, Timestamp
import json
import logging
from functools import wraps
from utils.log import LoggerManager
from datetime import datetime, timezone, timedelta

from utils.database import Database



logger = LoggerManager().logger

def repl_objectid_str(document):
    if isinstance(document, dict):
        for key, value in document.items():
            if isinstance(value, ObjectId):
                document[key] = str(value)
            elif isinstance(value, dict):
                # Recursively apply the function to dictionaries
                document[key] = repl_objectid_str(value)
            elif isinstance(value, list):
                document[key] = [repl_objectid_str(item) for item in value]
    elif isinstance(document, list):
        # Recursively apply the function to list elements
        document = [repl_objectid_str(item) for item in document]
    return document

def repl_str_objectid(document):
    try:
        # Convert fields at the root level
        for field in ["category"]:
            if field in document:
                try:
                    document[field] = ObjectId(document[field])
                except Exception as e:
                    logger.error(f"Problem converting {field} to ObjectId: {e}")
                    raise Exception(f"Problem converting {field} to ObjectId: {e}")
        return document, None
    except Exception as e:
        return document, e

def repl_timestamp_str(document):
    for key,value in document.items():
        if (isinstance(document[key],Timestamp)):
            timestamp_str = str(document[key].as_datetime())
            document[key] = timestamp_str
        elif (isinstance(value, dict)):
            repl_timestamp_str(value)
    return document


def check_body_is_json(function):
    @wraps(function)
    def validated_json(*args, **kwargs):
        logging.debug(f'Checking that the following data is a valid json object: {request.get_data()}')
        try:
            json.loads(request.get_data())
            logging.debug(f'Data is valid json')
            return function(*args, **kwargs)
        except ValueError as err:
            logging.debug(f'Data is not a valid json, received the following error: {err}')
            return make_response(jsonify({"message": "Data is not a valid json"}),400)
    return validated_json


def prep_document_for_response(document):
    logging.debug(f'Preparing the following document for transformation of ObjectID and Timestamps: {document}')
    logging.debug(f'Preparing the document for objectID transformation.')
    document = repl_objectid_str(document)
    logging.debug(f'Preparing the document for timestamp transformation.')
    document = repl_timestamp_str(document)
    logging.debug(f'Returning document')
    return document



def prep_document_for_database(document):
    logger.debug(
        f"Preparing the following document for transformation of strings into ObjectID´s: {document}"
    )
    document,e = repl_str_objectid(document)
    logger.debug(f"Returning document")
    return document,e


def check_document_exist(function):
    @wraps(function)
    def checked_document(self,*args, **kwargs):
        if not self.DatabaseConnector.find_one({'_id': ObjectId(kwargs['id'])},{'_id':1}):
            return make_response(jsonify({"message": "Document does not exist"}),404)
        return function(self,*args,**kwargs)
    return checked_document


def log(orig_func):
    @wraps(orig_func)
    def wrapper(self,*args, **kwargs):
        self.logger.debug(f'Ran the function "{orig_func.__name__}" in {type(self).__name__} from {type(self).__module__} with args: {args}, and kwargs: {kwargs}')
        return orig_func(self,*args, **kwargs)
    return wrapper


def check_id_is_valid(function):
    @wraps(function)
    def checked_id(self,*args, **kwargs):
        id = kwargs.get('id', '')
        try:
            ObjectId(id)
            return function(self,*args,**kwargs)
        except:
            return make_response(jsonify({"message": "Id is not a valid id"}),404) 
    return checked_id


def check_product_exist(function):
    @wraps(function)
    def checked_document(self, *args, **kwargs):
        case = kwargs.get("id")
        ReferencConnector = Database.get_instance().db.products
        if case is None or not ReferencConnector.find_one(
            {"_id": ObjectId(case)}, {"_id": 1}
        ):
            logger.error("Product does not exist")
            return make_response(jsonify({"message": "Product does not exist"}), 404)
        logger.debug("Product does exist")
        return function(self, *args, **kwargs)


def validate_query_params(function):
    @wraps(function)
    def validate(self, *args, **kwargs):
        # creating allowed list of params
        allowed_params = ['skip','pageSize','start','end','fields','active','sortBy']
        allowed_fields = ['_id','name','shortName']
        allowed_sorts = ['_id','date','categeory','shortName']
        request_params = request.args 
        logger.debug(f"Validating request parameters: {request.args}")         
        for i in request_params:
            try:
                if i not in allowed_params:
                    logger.error("Parameter not in allowed list")
                    return make_response(
                            jsonify({"message": "Parameter used is not known"}), 400
                        )
                elif i == "skip":
                    skip = request.args.get("skip")
                    int(skip)
                elif i== "pageSize":
                    pageSize = request.args.get("pageSize")
                    logger.debug(pageSize)
                    int(pageSize)
                elif i == "active":
                    active = request.args.get("active").lower()
                    if active not in ['true','false','yes','no','1','0']:
                        logger.error("active parameter not in allowed list")
                        raise Exception
                elif i == "start":
                    start = request.args.get("start")
                    datetime.strptime(start, "%Y-%m-%d")
                elif i == "end":
                    end = request.args.get("end")
                    datetime.strptime(end, "%Y-%m-%d")
                elif i == "fields":
                    fields = request.args.get("fields").split(',')
                    for i in fields:
                        if i not in allowed_fields:
                            logger.error("field parameter not in allowed list")
                            raise Exception
                elif i == "sortBy":
                    sortBy = request.args.get("sortBy")
                    if sortBy not in allowed_sorts:
                        logger.error("sortBy parameter not in allowed list")
                        raise Exception
                else:
                    logger.error(f"Unknown parameter i: {i}")
                    raise Exception
            except:
                    logger.error("Parameter is not valid")
                    return make_response(
                            jsonify({"message": "Parameter given is not valid"}), 400
                        )
        return function(self, *args, **kwargs)
    logger.debug("Validation successully applied")
    return validate
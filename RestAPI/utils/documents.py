from flask import abort, current_app, jsonify, request, make_response
from bson import ObjectId, Timestamp
import json
import logging
from functools import wraps
from logger import LoggerManager



logger = LoggerManager().logger

def repl_objectid_str(document):
    for key,value in document.items():
        if (isinstance(document[key],ObjectId)):
            object_str = str(document[key])
            document[key] = object_str
        elif (isinstance(value, dict)):
            repl_objectid_str(value)
    return document

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
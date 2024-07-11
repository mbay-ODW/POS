import time
from utils.database import Database
from resources.base import BaseList, SpecificBase
from flask import jsonify, make_response, request, abort
from bson import Timestamp, ObjectId
from flask_restx import Resource
from pymongo.operations import UpdateOne,InsertOne
from datetime import datetime, timezone
from utils.log import LoggerManager
from utils.documents import log
from utils.documents import check_id_is_valid, check_order_exist
import json
from utils.print import Printing


class OrdersList(BaseList):
    logger = LoggerManager().logger
    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__(api=None, *args, **kwargs)
        self.DatabaseConnector = self.Database.db.orders
    
    def post(self, *args, **kwargs):
        incomingRequest = super().post(api=None, *args, **kwargs)
        bulk_operations = []
        if incomingRequest.status_code in [200,201]:
            try:
                order = request.get_json(force=True)
                orderId = order['_id']
                for i in order['orders']:
                    product_id = i['product']["id"]
                    amount = -1 * i['amount'] 
                    filter = { '_id': ObjectId(product_id) }
                    query = {}
                    query['$inc'] = { 'stock.current': amount }
                    query['$set'] = { 'lastModified' : datetime.now(timezone.utc)}
                    bulk_operations.append(UpdateOne(filter,query))
                self.logger.debug(bulk_operations)
                """if not Printing().checkStatus:
                    return make_response(jsonify({"message": "Printer not ready"}), 500)"""
                result = self.Database.db.products.bulk_write(bulk_operations)
                self.logger.debug(f'Changed {result.modified_count} product stocks')
                """Printing(str(orderId))"""
                return make_response(jsonify({"message": "success", "_id": str(orderId)}), 201)
            except Exception as e:
                self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
                return make_response(jsonify({"message": str(e)}),500)


class SpecificOrders(SpecificBase):
    logger = LoggerManager().logger
    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__(api=None, *args, **kwargs)
        self.DatabaseConnector = self.Database.db.orders
    
    def put(self, *args, **kwargs):
        try:
            id = kwargs.get("id")
            newOrder = request.get_json(force=True)
            oldOrder = self.DatabaseConnector.find_one({'_id': ObjectId(id)})
            bulk_operations = []
            # First getting the old order, changing the stock of each product back
            try:
                for i in oldOrder['orders']:
                    product_id = i['product']["id"]
                    amount = i['amount'] 
                    self.logger.debug(f'old order amount: {amount}')
                    filter = { '_id': ObjectId(product_id) }
                    query = {}
                    query['$inc'] = { 'stock.current': amount }
                    query['$set'] = { 'lastModified' : datetime.now(timezone.utc)}
                    bulk_operations.append(UpdateOne(filter,query))
            except Exception as e:
                    self.logger.warning(f'Could not update stock to old values: {e}')
            # Now getting the new order, changing the stock of each product
            try:
                for i in newOrder['orders']:
                    product_id = i['product']["id"]
                    amount =  -1 * i['amount']
                    self.logger.debug(f'new order amount: {amount}') 
                    filter = { '_id': ObjectId(product_id) }
                    query = {}
                    query['$inc'] = { 'stock.current': amount }
                    query['$set'] = { 'lastModified' : datetime.now(timezone.utc)}
                    bulk_operations.append(UpdateOne(filter,query))
            except Exception as e:
                    self.logger.warning(f'Could not update stock to new values: {e}')
            try:
                self.logger.debug(bulk_operations)
                result = self.Database.db.products.bulk_write(bulk_operations)
                self.logger.debug(f'Changed {result.modified_count} product stocks')
            except Exception as e:
                    self.logger.warning(f'Could not update product stock while editing the order: {e}')
            try:    
                incomingRequest = super().put(id=id)
            except Exception as e:
                return make_response(jsonify({"message": str(e)}),500)
            if incomingRequest.status_code in [200,201]:
                return make_response(jsonify({"message": "success"}), 201)
        except Exception as e:
                self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
                return make_response(jsonify({"message": str(e)}),500)

    def delete(self, *args, **kwargs):
        try:
            id = kwargs.get("id")
            order = self.DatabaseConnector.find_one({'_id': ObjectId(id)})
            self.logger.debug(order)
            bulk_operations = []
            for i in order['orders']:
                try:
                    product_id = i['product']["id"]
                    amount = i['amount'] 
                    filter = { '_id': ObjectId(product_id) }
                    query = {}
                    query['$inc'] = { 'stock.current': amount }
                    query['$set'] = { 'lastModified' : datetime.now(timezone.utc)}
                    bulk_operations.append(UpdateOne(filter,query))
                    self.logger.debug(bulk_operations)
                except Exception as e:
                    self.logger.warning(f'Could not update product stock while deleting: {e}')
            try:
                result = self.Database.db.products.bulk_write(bulk_operations)
                self.logger.debug(f'Changed {result.modified_count} product stocks')
            except Exception as e:
                self.logger.warning(f'Could not update stock: {e}')
            try:    
                incomingRequest = super().delete(id=id)
            except Exception as e:
                return make_response(jsonify({"message": str(e)}),500)
            if incomingRequest.status_code in [204]:
                return make_response(jsonify({"message": "success"}), 204)
        except Exception as e:
                self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
                return make_response(jsonify({"message": str(e)}),500)



class PrintSpecificOrder(Resource):
    logger = LoggerManager().logger

    def __init__(self, api=None, *args, **kwargs):
        self.logger.debug(f'Starting init of {__name__}.')
        self.Database = Database.get_instance()
        self.DatabaseConnector = self.Database.db.orders

    
    @log
    def post(self, *args, **kwargs):
        try:
            id = kwargs.get("id")
            self.logger.debug(f"Received the following order: {id}")
            order = self.DatabaseConnector.find_one({"_id":ObjectId(id)})
            printer = Printing()
            time.sleep(0.5)
            printer.print(order)
            
                #return make_response(jsonify("Printer not working"), 500)
            return make_response(jsonify("id"), 200)
        except Exception as e:
                self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
                return make_response(jsonify({"message": str(e)}),500)
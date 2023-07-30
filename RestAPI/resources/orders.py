from resources.base import BaseList, SpecificBase
from flask import jsonify, make_response, request, abort
from bson import Timestamp, ObjectId
from pymongo.operations import UpdateOne,InsertOne
from datetime import datetime
from logger import LoggerManager
import json
from utils.print import Printing


class OrdersList(BaseList):
    logger = LoggerManager().logger
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.orders
    
    def post(self):
        incomingRequest = super().post()
        bulk_operations = []
        if incomingRequest.status_code in [200,201]:
            try:
                order = request.get_json(force=True)
                orderId = order['_id']
                for i in order['orders']:
                    product_id = i['product']['id']
                    amount = -1 * i['amount'] 
                    filter = { '_id': ObjectId(product_id) }
                    query = {}
                    query['$inc'] = { 'stock.current': amount }
                    query['$set'] = { 'lastModified' : Timestamp(datetime.utcnow(),1)}
                    bulk_operations.append(UpdateOne(filter,query))
                self.logger.debug(bulk_operations)
                if not Printing().checkStatus:
                    return make_response(jsonify({"message": "Printer not ready"}), 500)
                result = self.Database.db.products.bulk_write(bulk_operations)
                self.logger.debug(f'Changed {result.modified_count} product stocks')
                Printing(str(orderId))
                return make_response(jsonify({"message": "success", "id": str(orderId)}), 201)
            except Exception as e:
                self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
                return make_response(jsonify({"message": str(e)}),500)


class SpecificOrders(SpecificBase):
    logger = LoggerManager().logger
    def __init__(self):
        self.logger.debug(f'Starting init of {__name__}.')
        # Use the init of the baseclass additionally with super
        super().__init__()
        self.DatabaseConnector = self.Database.db.orders
    
    def put(self,id):
        try:
            newOrder = request.get_json(force=True)
            oldOrder = self.DatabaseConnector.find_one({'_id': ObjectId(id)})
            bulk_operations = []
            # First getting the old order, changing the stock of each product back
            for i in oldOrder['orders']:
                product_id = i['product']['id']
                amount = i['amount'] 
                self.logger.debug(f'old order amount: {amount}')
                filter = { '_id': ObjectId(product_id) }
                query = {}
                query['$inc'] = { 'stock.current': amount }
                query['$set'] = { 'lastModified' : Timestamp(datetime.utcnow(),1)}
                bulk_operations.append(UpdateOne(filter,query))
            # Now getting the new order, changing the stock of each product
            for i in newOrder['orders']:
                product_id = i['product']['id']
                amount =  -1 * i['amount']
                self.logger.debug(f'new order amount: {amount}') 
                filter = { '_id': ObjectId(product_id) }
                query = {}
                query['$inc'] = { 'stock.current': amount }
                query['$set'] = { 'lastModified' : Timestamp(datetime.utcnow(),1)}
                bulk_operations.append(UpdateOne(filter,query))
            self.logger.debug(bulk_operations)
            result = self.Database.db.products.bulk_write(bulk_operations)
            self.logger.debug(f'Changed {result.modified_count} product stocks')
            try:    
                incomingRequest = super().put(id=id)
            except Exception as e:
                return make_response(jsonify({"message": str(e)}),500)
            if incomingRequest.status_code in [200,201]:
                return make_response(jsonify({"message": "success"}), 201)
        except Exception as e:
                self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
                return make_response(jsonify({"message": str(e)}),500)

    def delete(self,id):
        try:
            order = self.DatabaseConnector.find_one({'_id': ObjectId(id)})
            bulk_operations = []
            for i in order['orders']:
                product_id = i['product']['id']
                amount = i['amount'] 
                filter = { '_id': ObjectId(product_id) }
                query = {}
                query['$inc'] = { 'stock.current': amount }
                query['$set'] = { 'lastModified' : Timestamp(datetime.utcnow(),1)}
                bulk_operations.append(UpdateOne(filter,query))
                self.logger.debug(bulk_operations)
            result = self.Database.db.products.bulk_write(bulk_operations)
            self.logger.debug(f'Changed {result.modified_count} product stocks')
            try:    
                incomingRequest = super().delete(id=id)
            except Exception as e:
                return make_response(jsonify({"message": str(e)}),500)
            if incomingRequest.status_code in [204]:
                return make_response(jsonify({"message": "success"}), 204)
        except Exception as e:
                self.logger.error(f'Received the following error: {e}. Can not proceed, returning error message and status_code 500.')
                return make_response(jsonify({"message": str(e)}),500)

        
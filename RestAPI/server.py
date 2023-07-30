import sys
from flask import Flask,jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
import uuid
from datetime import timedelta, datetime
import utils.initialize

from logger import LoggerManager


import logging

app = Flask(__name__)
api = Api(app,catch_all_404s=True)
CORS(app)
app.config['DEBUG'] = True

# Setting up Logging for the API Server
version = 'v1'

logger = LoggerManager().logger


try:
    logger.info("Checking if database has settings")
    utils.initialize.start()
except Exception as e:
    logger.error(e)

try:
    logger.debug('Adding products resources')
    from resources.products import ProductsList
    from resources.products import SpecificProducts
    api.add_resource(ProductsList, '/v1/products')
    api.add_resource(SpecificProducts, '/v1/products/<string:id>')
    logger.debug('Products resources added')
except Exception as e:
    logger.error(f'Error while adding products resources: {e}')

try:
    logger.debug('Adding orders resources')
    from resources.orders import OrdersList
    from resources.orders import SpecificOrders
    api.add_resource(OrdersList, '/v1/orders')
    api.add_resource(SpecificOrders, '/v1/orders/<string:id>')
    logger.debug('Orders resources added')
except Exception as e:
    logger.error(f'Error while adding orders resources: {e}')


try:
    logger.debug('Adding settings resources')
    from resources.settings import SettingsList
    from resources.settings import SpecificSetting
    api.add_resource(SettingsList, '/v1/settings')
    api.add_resource(SpecificSetting, '/v1/settings/<string:id>')
    logger.debug('Settings resources added')
except Exception as e:
    logger.error(f'Error while adding settings resources: {e}')

try:
    logger.debug('Adding schema resources')
    from resources.schema import SchemasList
    from resources.schema import SpecificSchemas
    api.add_resource(SchemasList, '/v1/schemas')
    api.add_resource(SpecificSchemas, '/v1/schemas/<string:id>')
    logger.debug('Schema resources added')
except Exception as e:
    logger.error(f'Error while adding schema resources: {e}')



if __name__ == '__main__':
    logger.info('Starting Server')
    app.run(host="0.0.0.0", port=3001)
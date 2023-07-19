import sys
from flask import Flask,jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
import uuid
from datetime import timedelta, datetime

import logging
from logging.handlers import RotatingFileHandler

import logging

app = Flask(__name__)
api = Api(app,catch_all_404s=True)
CORS(app)
app.config['DEBUG'] = True

# Setting up Logging for the API Server
version = 'v1'
logFile = '../Logs/APIServer.log'
logLevel = logging.DEBUG

# Create the logger object
logger = logging.getLogger('REST API Flask Server: %s' %(datetime.now()))
logger.setLevel(logLevel)
log_formatter = logging.Formatter('%(asctime)s %(threadName)s %(levelname)s %(name)s %(message)s')

# Create a console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logLevel)
logger.addHandler(console_handler)

# Create a rotating file handler
rotate_handler = RotatingFileHandler(filename=logFile, maxBytes=10000000, backupCount=10)
rotate_handler.setFormatter(log_formatter)
rotate_handler.setLevel(logLevel)
logger.addHandler(rotate_handler)


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
    logger.debug('Adding groups resources')
    from resources.groups import GroupsList
    from resources.groups import SpecificGroups
    api.add_resource(GroupsList, '/v1/groups')
    api.add_resource(SpecificGroups, '/v1/groups/<string:id>')
    logger.debug('Groups resources added')
except Exception as e:
    logger.error(f'Error while adding groups resources: {e}')

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
    logger.debug('Adding permissions resources')
    from resources.permissions import PermissionsList
    from resources.permissions import SpecificPermission
    api.add_resource(PermissionsList, '/v1/permissions')
    api.add_resource(SpecificPermission, '/v1/permissions/<string:id>')
    logger.debug('Permissions resources added')
except Exception as e:
    logger.error(f'Error while adding permissions resources: {e}')

try:
    logger.debug('Adding roles resources')
    from resources.roles import RolesList
    from resources.roles import SpecificRoles
    api.add_resource(RolesList, '/v1/roles')
    api.add_resource(SpecificRoles, '/v1/roles/<string:id>')
    logger.debug('Roles resources added')
except Exception as e:
    logger.error(f'Error while adding roles resources: {e}')

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
    logger.debug('Adding sites resources')
    from resources.sites import SitesList
    from resources.sites import SpecificSites
    api.add_resource(SitesList, '/v1/sites')
    api.add_resource(SpecificSites, '/v1/sites/<string:id>')
    logger.debug('Sites resources added')
except Exception as e:
    logger.error(f'Error while adding sites resources: {e}')

try:
    logger.debug('Adding terminals resources')
    from resources.terminals import TerminalList
    from resources.terminals import SpecificTerminal
    api.add_resource(TerminalList, '/v1/terminals')
    api.add_resource(SpecificTerminal, '/v1/terminals/<string:id>')
    logger.debug('Terminals resources added')
except Exception as e:
    logger.error(f'Error while adding terminals resources: {e}')

try:
    logger.debug('Adding users resources')
    from resources.users import UsersList
    from resources.users import SpecificUsers
    api.add_resource(UsersList, '/v1/users')
    api.add_resource(SpecificUsers, '/v1/users/<string:id>')
    logger.debug('Users resources added')
except Exception as e:
    logger.error(f'Error while adding users resources: {e}')

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
    app.run(host="0.0.0.0", port=3000)
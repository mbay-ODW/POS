from flask import Flask
from flask_restx import Api
from flask_cors import CORS
import os
import flask_monitoringdashboard as dashboard
import eventlet
if not os.getenv("TESTING"):
    eventlet.monkey_patch()

# Setting up Logging for the API Server
version = "v1"
environments = os.getenv("ENV_FILE", default="../.env")

try:
    from dotenv import load_dotenv
    load_dotenv(environments)
except Exception as e:
    print(e)
environments = os.getenv("ENV_FILE", default="../.env")

try:
    from dotenv import load_dotenv
    load_dotenv(environments)
except Exception as e:
    print(e)

from utils.log import LoggerManager

logger = LoggerManager().logger

import utils.initialize

# Creating app
try:
    logger.info("Creating Flask App")

    app = Flask(__name__)
    cors = CORS(
        app,
        supports_credentials=True,
        methods=["GET", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"],
        origins=[
            "http://localhost",
            "*",
        ],
    )
    app.config["DEBUG"] = False

    caching = bool(os.getenv("CACHING", default=False))
    if caching:
        logger.debug("Adding cache")
        from utils.cache import CacheManager

        cache = CacheManager.get_cache(app)
        # Initialize Cache with your app
        cache.init_app(app)

    api = Api(app, catch_all_404s=True)
    from utils.socketio_instance import socketio
    socketio.init_app(app)
except Exception as e:
    logger.error(e)
    quit()


try:
    logger.info("Adding http limiter to all RestAPI endpoints")
    from utils.limiter import limiter
    limiter.init_app(app)
except Exception as e:
    logger.error(e)

try:
    logger.info("Checking database and its settings")
    utils.initialize.start()
except Exception as e:
    logger.error(e)
    quit()

try:
    logger.debug('Adding auth + users resources')
    from resources.auth import Login, Me
    from resources.users import UsersList, SpecificUser
    api.add_resource(Login, '/api/v1/auth/login')
    api.add_resource(Me, '/api/v1/auth/me')
    api.add_resource(UsersList, '/api/v1/users')
    api.add_resource(SpecificUser, '/api/v1/users/<string:id>')
    logger.debug('Auth + users resources added')
except Exception as e:
    logger.error(f'Error while adding auth resources: {e}')

# Adding Health endpoint
try:
    logger.debug("Adding health endpoint resources")
    from resources.health import Healthendpoint

    api.add_resource(Healthendpoint, f"/api/health")
    logger.debug("Settings healthendpoint added")
except Exception as e:
    logger.error(f"Error while adding healthendpoint resource: {e}")

try:
    logger.debug('Adding products resources')
    from resources.products import ProductsList
    from resources.products import SpecificProducts
    api.add_resource(ProductsList, '/api/v1/products')
    api.add_resource(SpecificProducts, '/api/v1/products/<string:id>')
    logger.debug('Products resources added')
except Exception as e:
    logger.error(f'Error while adding products resources: {e}')

try:
    logger.debug('Adding carts resources')
    from resources.carts import CartsList
    from resources.carts import SpecificCarts
    api.add_resource(CartsList, '/api/v1/carts')
    api.add_resource(SpecificCarts, '/api/v1/carts/<string:id>')
    logger.debug('Carts resources added')
except Exception as e:
    logger.error(f'Error while adding carts resources: {e}')

try:
    logger.debug('Adding orders resources')
    from resources.orders import OrdersList
    from resources.orders import SpecificOrders
    from resources.orders import PrintSpecificOrder
    api.add_resource(OrdersList, '/api/v1/orders')
    api.add_resource(SpecificOrders, '/api/v1/orders/<string:id>')
    api.add_resource(PrintSpecificOrder, '/api/v1/print/orders/<string:id>')
    logger.debug('Orders resources added')
except Exception as e:
    logger.error(f'Error while adding orders resources: {e}')


try:
    logger.debug('Adding stations resources')
    from resources.stations import StationsList
    from resources.stations import SpecificStations
    api.add_resource(StationsList, '/api/v1/stations')
    api.add_resource(SpecificStations, '/api/v1/stations/<string:id>')
    logger.debug('Stations resources added')
except Exception as e:
    logger.error(f'Error while adding stations resources: {e}')


try:
    logger.debug('Adding categories resources')
    from resources.categories import CategoriesList
    from resources.categories import SpecificCategories
    api.add_resource(CategoriesList, '/api/v1/categories')
    api.add_resource(SpecificCategories, '/api/v1/categories/<string:id>')
    logger.debug('Categories resources added')
except Exception as e:
    logger.error(f'Error while adding categories resources: {e}')


try:
    logger.debug('Adding statistics resource')
    from resources.statistics import Statistics
    api.add_resource(Statistics, '/api/v1/statistics')
    logger.debug('Statistics resource added')
except Exception as e:
    logger.error(f'Error while adding statistics resource: {e}')

try:
    logger.debug('Adding settings resources')
    from resources.settings import SettingsList
    from resources.settings import SpecificSetting
    api.add_resource(SettingsList, '/api/v1/settings')
    api.add_resource(SpecificSetting, '/api/v1/settings/<string:id>')
    logger.debug('Settings resources added')
except Exception as e:
    logger.error(f'Error while adding settings resources: {e}')

try:
    logger.info("Adding dashboard for flask monitoring")
    dashboard.config.init_from(envvar='FLASK_MONITORING_DASHBOARD_CONFIG')
    dashboard.bind(app)
except Exception as e:
    logger.error(e)

if __name__ == "__main__":
    try:
        logger.info("Starting Server")
        from utils.socketio_instance import socketio
        socketio.run(app, host="0.0.0.0", port=3000, debug=False)
    except Exception as e:
        logger.error(e)
        quit()
from flask import Flask
from flask_restx import Api
from flask_cors import CORS
import os
import flask_monitoringdashboard as dashboard

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
            "http://localhost:4200",
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
    logger.info("Adding dashboard for flask monitoring")
    dashboard.config.init_from(envvar='FLASK_MONITORING_DASHBOARD_CONFIG')
    dashboard.bind(app)
except Exception as e:
    logger.error(e)

if __name__ == "__main__":
    try:
        logger.info("Starting Server")
        app.run(host="0.0.0.0", port=3000, debug=False)
    except Exception as e:
        logger.error(e)
        # Quit the whole application
        quit()
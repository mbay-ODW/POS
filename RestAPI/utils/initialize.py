import yaml
from utils.database import Database
from utils.log import LoggerManager
import os
import time


logger = LoggerManager().logger


def read_config(filename):
    with open(filename, "r") as file:
        return yaml.safe_load(file)


def check_and_create_database():
    logger.info("Waiting for MongoDB to be ready")
    try:
        db_name = os.getenv("DATABASE_NAME", "POS")
        client = Database.get_instance(db_name)
        db_ready = False
        while not db_ready:
            try:
                client.client.is_mongos
                db_ready = True
                logger.info("MongoDB is ready")
            except:
                logger.debug("Still waiting for MongoDB, rechecking in 5 seconds")
                time.sleep(5)
    except Exception as e:
        logger.error(e)
        quit()


def check_and_create_collections(collections):
    try:
        client = Database.get_instance()
        list_collection_names = client.db.list_collection_names()
        for section_name, entries in collections.items():
            for i in entries:
                try:
                    collection_name = i["name"]
                except:
                    pass
            if collection_name not in list_collection_names:
                logger.debug(f"Creating collection {collection_name}")
                client.db.create_collection(collection_name)
    except Exception as e:
        logger.error(f"Error occurred: {e}")


def start():
    check_and_create_database()
    collections_file = "./utils/collections.yaml"
    collections = read_config(collections_file)
    check_and_create_collections(collections)


if __name__ == "__main__":
    start()

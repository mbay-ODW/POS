import pymongo
import yaml
from datetime import datetime
from utils.database import Database
from bson import ObjectId, Timestamp
from utils.log import LoggerManager


logger = LoggerManager().logger

def read_config(filename):
    with open(filename, 'r') as file:
        return yaml.safe_load(file)


def check_and_create_entries(config):
    try:
        client = Database()
        DatabaseConnector = client.db.settings
        for section_name, entries in config.items():
            query = {"name": section_name}
            existing_entry = DatabaseConnector.find_one(query)
            document = {}
            if existing_entry is None:
                for i in entries:
                    document.update(i)
                document['name'] = section_name
                document['lastModified'] = Timestamp(datetime.utcnow(), 1)
                document['creationTime'] = Timestamp(datetime.utcnow(), 1)
                document['schemaVersion'] = "1.0"
                DatabaseConnector.insert_one(document)
                logger.info(f"Inserted new entry: {document}")
            else:
                logger.info(f"Entry '{section_name}' already exists. Skipping insertion.")
    except Exception as e:
        logger.error(f"Error occurred: {e}")


def start():
    config_file = "./utils/config.yaml"
    config = read_config(config_file)
    check_and_create_entries(config)


if __name__ == "__main__":
    start()

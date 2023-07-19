import pymongo
import random
import string
from datetime import datetime

# MongoDB connection
client = pymongo.MongoClient("mongodb://localhost:27017/")

# Create testing database
db = client["Test"]

# Generate random string
def random_string(length):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for i in range(length))

# Create orders collection
orders_collection = db["orders"]
for _ in range(10):
    orders_data = {
        "issuer": random_string(5),
        "terminal": random_string(10),
        "orders": [
            {"id": random.randint(1, 100),
             "product": {"id": random_string(10), "name": random_string(10), "category": random_string(5)},
             "site": {"id": random_string(10), "name": random_string(10)},
             "amount": random.randint(1, 5)}
            for _ in range(random.randint(1, 5))
        ],
        "state": {"delivered": random.choice([True, False]),
                  "lastModified": datetime.now().isoformat()},
        "schemaVersion": "1.0",
        "creationTime": datetime.now().isoformat(),
        "lastModified": datetime.now().isoformat()
    }
    orders_collection.insert_one(orders_data)

# Create permissions collection
permissions_collection = db["permissions"]
for _ in range(10):
    permissions_data = {
        "name": random_string(10),
        "type": random.choice(["GET", "POST", "PUT", "DELETE"]),
        "endpoint": random_string(10),
        "schemaVersion": "1.0",
        "lastModified": datetime.now().isoformat(),
        "creationTime": datetime.now().isoformat()
    }
    permissions_collection.insert_one(permissions_data)

# Create products collection
products_collection = db["products"]
for _ in range(10):
    products_data = {
        "category": random_string(5),
        "name": random_string(10),
        "shortName": random_string(5),
        "site": {"id": random_string(10), "lastModified": datetime.now().isoformat()},
        "active": random.choice([True, False]),
        "stock": {"current": random.randint(0, 100)},
        "price": {"current": random.uniform(0, 100)},
        "image": "Base64",
        "thresholds": {"warning": random.randint(0, 100),
                       "critical": random.randint(0, 100),
                       "info": random.randint(0, 100)},
        "schemaVersion": "1.0",
        "lastModified": datetime.now().isoformat(),
        "creationTime": datetime.now().isoformat()
    }
    products_collection.insert_one(products_data)

# Create roles collection
roles_collection = db["roles"]
for _ in range(10):
    roles_data = {
        "name": random_string(5),
        "permissions": [random_string(10) for _ in range(random.randint(1, 5))],
        "schemaVersion": "1.0",
        "lastModified": datetime.now().isoformat(),
        "creationTime": datetime.now().isoformat()
    }
    roles_collection.insert_one(roles_data)

# Create settings collection
settings_collection = db["settings"]
for _ in range(10):
    settings_data = {
        "name": random_string(10),
        "shortName": random_string(5),
        "category": random_string(10),
        "schemaVersion": "1.0",
        "settings": [{"key1": random_string(5)}, {"key2": random_string(5)}],
        "lastModified": datetime.now().isoformat(),
        "creationTime": datetime.now().isoformat()
    }
    settings_collection.insert_one(settings_data)

# Create sites collection
sites_collection = db["sites"]
for _ in range(10):
    sites_data = {
        "name": random_string(10),
        "shortName": random_string(5),
        "schemaVersion": "1.0",
        "lastModified": datetime.now().isoformat(),
        "creationTime": datetime.now().isoformat()
    }
    sites_collection.insert_one(sites_data)

# Create terminals collection
terminals_collection = db["terminals"]
for _ in range(10):
    terminals_data = {
        "name": random_string(10),
        "schemaVersion": "1.0",
        "lastModified": datetime.now().isoformat(),
        "creationTime": datetime.now().isoformat()
    }
    terminals_collection.insert_one(terminals_data)

# Create users collection
users_collection = db["users"]
for _ in range(10):
    users_data = {
        "name": random_string(10),
        "roles": [random_string(10) for _ in range(random.randint(1, 5))],
        "schemaVersion": "1.0",
        "lastModified": datetime.now().isoformat(),
        "creationTime": datetime.now().isoformat()
    }
    users_collection.insert_one(users_data)

# Close the MongoDB connection
client.close()

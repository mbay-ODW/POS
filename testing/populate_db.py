from pymongo import MongoClient
from bson import Timestamp, ObjectId
import base64
import random
from datetime import datetime, timedelta

# Sample product data
products_data = []

# Generate data for 100 products
for i in range(100):
    product_data = {
        "category": f"Category-{i+1}",
        "name": f"Product-{i+1}",
        "shortname": f"Prod{i+1}",
        "active": random.choice([True, False]),
        "stock": {"current": random.randint(1, 100)},
        "price": {"current": round(random.uniform(1, 100), 2)},
        "image": f"Base64EncodedImage{i+1}",  # Replace this with the actual base64 encoded image data
        "thresholds": {"warning": random.randint(20, 50), "info": random.randint(30, 60)},
        "schemaVersion": "1.0",
        "lastModified": Timestamp(datetime.utcnow() - timedelta(days=random.randint(0, 365)), 1),
        "creationTime": Timestamp(datetime.utcnow() - timedelta(days=random.randint(0, 365)), 1),
    }
    products_data.append(product_data)

# Sample order data
orders_data = []

# Function to generate order data with random products and amounts
def generate_order_data():
    product_ids = [str(product["_id"]) for product in products_data]  # Get existing product IDs
    order = {
        "_id": str(ObjectId()),
        "orders": [
            {
                "id": i + 1,
                "product": {
                    "id": random.choice(product_ids),  # Random product ID from existing products
                    "name": f"Product-{i+1}",  # Use the same name as product for simplicity
                },
                "amount": random.randint(1, 10),  # Random amount between 1 and 10
            }
            for i in range(random.randint(1, 5))  # Random number of orders per order
        ],
        "state": {"delivered": random.choice([True, False])},
        "schemaVersion": "1.0",
        "creationTime": Timestamp(datetime.utcnow() - timedelta(days=random.randint(0, 365)), 1),
        "lastModified": Timestamp(datetime.utcnow() - timedelta(days=random.randint(0, 365)), 1),
    }
    return order

# Generate data for 100 orders
for i in range(100):
    orders_data.append(generate_order_data())

def populate_database():
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")  # Replace with your MongoDB connection string
    db = client["your_database_name"]  # Replace "your_database_name" with your actual database name

    # Insert sample product data into the database
    products_collection = db["products"]
    for product_data in products_data:
        products_collection.insert_one(product_data)

    # Insert sample order data into the database
    orders_collection = db["orders"]
    for order_data in orders_data:
        # Check if product IDs in the order actually exist in the products collection
        for order in order_data["orders"]:
            product_id = order["product"]["id"]
            product = products_collection.find_one({"_id": ObjectId(product_id)})
            if product is None:
                raise ValueError(f"Product with ID '{product_id}' does not exist.")
        # Insert the order into the orders collection
        orders_collection.insert_one(order_data)

    # Close the MongoDB connection
    client.close()

if __name__ == "__main__":
    populate_database()

import pytest
import mongomock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(autouse=True)
def patch_mongo(monkeypatch):
    """Replace real MongoDB with mongomock for all tests."""
    client = mongomock.MongoClient()
    db = client["test_pos"]

    import utils.database as db_module
    instance = object.__new__(db_module.Database)
    instance.db = db
    monkeypatch.setattr(db_module.Database, "_instance", instance)
    monkeypatch.setattr(db_module.Database, "get_instance", staticmethod(lambda: instance))
    return instance


@pytest.fixture
def app(patch_mongo):
    os.environ.setdefault("DATABASE_HOST", "mongodb://localhost:27017")
    os.environ.setdefault("DATABASE_NAME", "test_pos")
    os.environ.setdefault("CACHING", "")
    from server import app as flask_app
    flask_app.config["TESTING"] = True
    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(patch_mongo):
    return patch_mongo.db

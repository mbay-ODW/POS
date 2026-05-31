import pytest
import mongomock
import sys
import os

# Must be set before any server import
os.environ["TESTING"] = "true"
os.environ.setdefault("DATABASE_HOST", "mongodb://localhost:27017")
os.environ.setdefault("DATABASE_NAME", "test_pos")
os.environ.setdefault("CACHING", "")
os.environ.setdefault("JWT_SECRET", "test-secret")

# Run pytest from the RestAPI directory so relative paths resolve correctly
RESTAPI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RESTAPI_DIR)
os.chdir(RESTAPI_DIR)


def _make_instance(db_module, db):
    instance = object.__new__(db_module.Database)
    instance.db = db
    instance.client = mongomock.MongoClient()
    return instance


@pytest.fixture(autouse=True)
def patch_mongo(monkeypatch):
    """Replace real MongoDB with mongomock for all tests."""
    mock_client = mongomock.MongoClient()
    db = mock_client["test_pos"]

    import utils.database as db_module
    instance = _make_instance(db_module, db)

    monkeypatch.setattr(db_module.Database, "_instance", instance)
    monkeypatch.setattr(
        db_module.Database, "get_instance",
        staticmethod(lambda *args, **kwargs: instance)
    )
    return instance


@pytest.fixture
def app(patch_mongo, monkeypatch):
    # Prevent initialize.start() from reading YAML files or touching real DB
    import utils.initialize as init_module
    monkeypatch.setattr(init_module, "start", lambda: None)

    from server import app as flask_app
    flask_app.config["TESTING"] = True
    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(patch_mongo):
    return patch_mongo.db

from flask_caching import Cache
import redis
import os

from utils.log import LoggerManager

logger = LoggerManager().logger


class CacheManager:
    _instance = None

    @classmethod
    def get_cache(cls, app=None):
        if cls._instance is None and app is not None:
            # Attempt to connect to Redis
            try:
                logger.debug("Trying to get redis as cache")
                caching_time=int(os.getenv("CACHE_TIME", default=3600))
                r = redis.Redis(host="redis", port=6379, db=0)
                r.ping()  # Ping Redis to check connection
                cache_config = {
                    "CACHE_TYPE": "RedisCache",
                    "CACHE_REDIS_HOST": "redis",
                    "CACHE_REDIS_PORT": 6379,
                    "CACHE_REDIS_DB": 0,
                    "CACHE_REDIS_URL": "redis://redis:6379/0",
                    "CACHE_DEFAULT_TIMEOUT": caching_time,
                }
                logger.info("Using redis cache")
            except redis.exceptions.ConnectionError:
                logger.warning("Redis not available, trying to use simplecache")
                # Fallback to simple cache if Redis connection fails
                cache_config = {
                    "CACHE_TYPE": "SimpleCache",
                    "CACHE_DEFAULT_TIMEOUT": caching_time,
                }
                logger.warning("Using Simplecache")
            cls._instance = Cache(app, config=cache_config)

        return cls._instance

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Setup the Rate Limiter
limiter = Limiter(
    get_remote_address, default_limits=["3600 per hour", "120 per minute"]
)

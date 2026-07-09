from flask_socketio import SocketIO

# async_mode: 'eventlet' wenn verfügbar (bessere WebSocket-Performance),
# sonst 'threading' (keine nativen Abhängigkeiten, reicht für ein POS).
try:
    import eventlet  # noqa: F401
    _ASYNC_MODE = "eventlet"
except ImportError:
    _ASYNC_MODE = "threading"

socketio = SocketIO(cors_allowed_origins="*", async_mode=_ASYNC_MODE)

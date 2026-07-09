"""
SocketIO-Instanz mit sanftem Fallback.

- Ist flask-socketio installiert: echte Echtzeit-Updates (WebSocket).
  async_mode = 'eventlet' falls verfügbar, sonst 'threading'.
- Fehlt flask-socketio: Dummy-Objekt. init_app/emit sind No-Ops, run()
  startet den normalen Flask-Server. Die Vorlauf-Screens aktualisieren
  sich dann per Polling-Fallback im Frontend.
"""

try:
    from flask_socketio import SocketIO

    try:
        import eventlet  # noqa: F401
        _ASYNC_MODE = "eventlet"
    except ImportError:
        _ASYNC_MODE = "threading"

    socketio = SocketIO(cors_allowed_origins="*", async_mode=_ASYNC_MODE)
    HAS_SOCKETIO = True

except ImportError:
    HAS_SOCKETIO = False

    class _DummySocketIO:
        """No-op Ersatz, wenn flask-socketio nicht installiert ist."""

        def init_app(self, app, *args, **kwargs):
            pass

        def emit(self, *args, **kwargs):
            pass

        def run(self, app, host="0.0.0.0", port=3000, debug=False, **kwargs):
            # Normaler Flask-Server (threaded für parallele Requests)
            app.run(host=host, port=port, debug=debug, threaded=True)

    socketio = _DummySocketIO()

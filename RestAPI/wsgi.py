from server import app
from utils.socketio_instance import socketio

if __name__ == "__main__":
    socketio.run(app)

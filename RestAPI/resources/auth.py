import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from flask import request, make_response, jsonify
from flask_restx import Resource
from bson import ObjectId
from utils.database import Database
from utils.log import LoggerManager

logger = LoggerManager().logger
JWT_SECRET = os.getenv('JWT_SECRET', 'change-me-in-production')
JWT_EXPIRY_HOURS = int(os.getenv('JWT_EXPIRY_HOURS', '24'))


def _generate_token(user_id: str, username: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'username': username,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])


def require_auth(f):
    """Decorator: validates JWT, injects user info into kwargs."""
    from functools import wraps
    @wraps(f)
    def decorated(self, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return make_response(jsonify({'message': 'Nicht authentifiziert'}), 401)
        try:
            payload = decode_token(auth_header[7:])
            kwargs['_user'] = payload
            return f(self, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return make_response(jsonify({'message': 'Token abgelaufen'}), 401)
        except Exception:
            return make_response(jsonify({'message': 'Ungültiger Token'}), 401)
    return decorated


def require_role(roles: list):
    """Decorator: requires auth + one of the listed roles."""
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def decorated(self, *args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return make_response(jsonify({'message': 'Nicht authentifiziert'}), 401)
            try:
                payload = decode_token(auth_header[7:])
                if payload.get('role') not in roles:
                    return make_response(jsonify({'message': 'Keine Berechtigung'}), 403)
                kwargs['_user'] = payload
                return f(self, *args, **kwargs)
            except jwt.ExpiredSignatureError:
                return make_response(jsonify({'message': 'Token abgelaufen'}), 401)
            except Exception:
                return make_response(jsonify({'message': 'Ungültiger Token'}), 401)
        return decorated
    return decorator


class Login(Resource):
    def post(self):
        try:
            db = Database.get_instance().db
            body = request.get_json(force=True)
            username = body.get('username', '').strip()
            password = body.get('password', '')
            if not username or not password:
                return make_response(jsonify({'message': 'Benutzername und Passwort erforderlich'}), 400)
            user = db.users.find_one({'username': username, 'active': True})
            if not user or not bcrypt.checkpw(password.encode(), user['password']):
                return make_response(jsonify({'message': 'Ungültige Anmeldedaten'}), 401)
            token = _generate_token(str(user['_id']), user['username'], user['role'])
            db.users.update_one({'_id': user['_id']}, {'$set': {'lastLogin': datetime.now(timezone.utc)}})
            return make_response(jsonify({
                'token': token,
                'username': user['username'],
                'role': user['role'],
            }), 200)
        except Exception as e:
            logger.error(f'Login error: {e}')
            return make_response(jsonify({'message': str(e)}), 500)


class Me(Resource):
    @require_auth
    def get(self, *args, **kwargs):
        user = kwargs.get('_user', {})
        return make_response(jsonify({
            'username': user.get('username'),
            'role': user.get('role'),
        }), 200)

import bcrypt
from datetime import datetime, timezone
from flask import request, make_response, jsonify
from flask_restx import Resource
from bson import ObjectId
from utils.database import Database
from utils.log import LoggerManager
from utils.documents import prep_document_for_response
from resources.auth import require_role

logger = LoggerManager().logger


class UsersList(Resource):
    def __init__(self, api=None, *args, **kwargs):
        self.db = Database.get_instance().db

    @require_role(['manager'])
    def get(self, *args, **kwargs):
        try:
            users = list(self.db.users.find({}, {'password': 0}))
            return make_response(jsonify({
                'data': [prep_document_for_response(u) for u in users],
                'total': len(users),
            }), 200)
        except Exception as e:
            return make_response(jsonify({'message': str(e)}), 500)

    @require_role(['manager'])
    def post(self, *args, **kwargs):
        try:
            body = request.get_json(force=True)
            username = body.get('username', '').strip()
            password = body.get('password', '')
            role = body.get('role', 'personal')
            if not username or not password:
                return make_response(jsonify({'message': 'Benutzername und Passwort erforderlich'}), 400)
            if role not in ('manager', 'personal'):
                return make_response(jsonify({'message': 'Ungültige Rolle'}), 400)
            if self.db.users.find_one({'username': username}):
                return make_response(jsonify({'message': 'Benutzername bereits vergeben'}), 409)
            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
            result = self.db.users.insert_one({
                'username': username,
                'password': hashed,
                'role': role,
                'active': True,
                'creationTime': datetime.now(timezone.utc),
                'createdBy': kwargs.get('_user', {}).get('username', 'system'),
            })
            return make_response(jsonify({'message': 'success', '_id': str(result.inserted_id)}), 201)
        except Exception as e:
            return make_response(jsonify({'message': str(e)}), 500)


class SpecificUser(Resource):
    def __init__(self, api=None, *args, **kwargs):
        self.db = Database.get_instance().db

    @require_role(['manager'])
    def put(self, *args, **kwargs):
        try:
            uid = kwargs.get('id')
            body = request.get_json(force=True)
            update = {}
            if 'role' in body and body['role'] in ('manager', 'personal'):
                update['role'] = body['role']
            if 'active' in body:
                update['active'] = bool(body['active'])
            if 'password' in body and body['password']:
                update['password'] = bcrypt.hashpw(body['password'].encode(), bcrypt.gensalt())
            if not update:
                return make_response(jsonify({'message': 'Nichts zu aktualisieren'}), 400)
            update['lastModified'] = datetime.now(timezone.utc)
            self.db.users.update_one({'_id': ObjectId(uid)}, {'$set': update})
            return make_response(jsonify({'message': 'success'}), 200)
        except Exception as e:
            return make_response(jsonify({'message': str(e)}), 500)

    @require_role(['manager'])
    def delete(self, *args, **kwargs):
        try:
            uid = kwargs.get('id')
            # Prevent deleting yourself
            if uid == kwargs.get('_user', {}).get('sub'):
                return make_response(jsonify({'message': 'Eigenen Account nicht löschbar'}), 400)
            self.db.users.delete_one({'_id': ObjectId(uid)})
            return make_response(jsonify({'message': 'success'}), 204)
        except Exception as e:
            return make_response(jsonify({'message': str(e)}), 500)

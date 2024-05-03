from flask_restx import Resource
from utils.log import LoggerManager
from flask import jsonify, make_response


class Healthendpoint(Resource):
    logger = LoggerManager().logger

    def __init__(self, api=None, *args, **kwargs):
        pass

    def get(self, *args, **kwargs):
        return make_response(jsonify({"message": "UP"}), 200)

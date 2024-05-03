from flask import request, make_response, jsonify


from functools import wraps

from utils.log import LoggerManager

logger = LoggerManager().logger


def check_headers(function):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                logger.debug(f"Checking headers and authelia cookie")
                headers = request.headers
                logger.debug(f"Thats the headers found: {headers}")
                if not "Remote-Groups" or not "Remote-Name" in headers:
                    logger.error("Remote-Groups is missing in headers")
                    return make_response(
                        jsonify({"message": "Required headers are missing"}), 401
                    )
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(
                    f"Remote-Groups is missing in headers, thats the whole headers: {request.headers}. Received the following error: {e}"
                )
                return make_response(
                    jsonify({"message": "Remote-Groups is missing in headers"}), 401
                )

        return decorated_function

    return decorator


def get_roles_from_header(function):
    @wraps(function)
    def groups(self, *args, **kwargs):
        try:
            groupHeaders = request.headers["Remote-Groups"].split(",")
            logger.debug(groupHeaders)
            if "admin" in groupHeaders:
                logger.debug("its admin")
                self.group = "admin"
            elif "user" in groupHeaders:
                self.group = "user"
            else:
                self.group = "None"
                logger.error("No Remote-Group")
            logger.debug("Returning admin")
            return function(self, *args, **kwargs)
        except Exception as e:
            logger.error(
                f"Remote-Groups is missing in headers, thats the whole headers: {request.headers}. Thats the error that was received: {e}"
            )
            return make_response(
                jsonify({"message": "Remote-Groups is missing in headers"}), 401
            )

    return groups


def roles_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(self, *args, **kwargs):
            try:
                logger.debug(f"Checking whether {allowed_roles} is in groups of user")
                groups = request.headers["Remote-Groups"].split(",")
                logger.debug(f"Thats the groups found in headers: {groups}")
                for i in allowed_roles:
                    if i in groups:
                        logger.debug(f"allowed_roles is in groups")
                        return f(self, *args, **kwargs)
                    else:
                        logger.error("Not allowed for user")
                        return make_response(jsonify({"message": "Not allowed"}), 403)
                return f(self, *args, **kwargs)
            except Exception as e:
                logger.error(
                    f"Remote-Groups is missing in headers, thats the whole headers: {request.headers}. Received the following error: {e}"
                )
                return make_response(
                    jsonify({"message": "Remote-Groups is missing in headers"}), 401
                )

        return decorated_function

    return decorator

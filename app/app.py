import os

from flask import Flask, render_template
from werkzeug.exceptions import HTTPException

from app.database.db import Base, engine
from app.routes.food import food_bp
from app.routes.workout import workout_bp

import app.models.food 
import app.models.food_log
import app.models.exercise
import app.models.exercise_execution
import app.models.exercise_muscle_group
import app.models.muscle_group
import app.models.users
import app.models.workout_session
import app.models.workout_set

def create_app():
    app = Flask(__name__)

    app.register_blueprint(food_bp)
    app.register_blueprint(workout_bp)

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return {"error": error.description}, error.code

    @app.errorhandler(Exception)
    def handle_unexpected_exception(_error):
        return {"error": "Erro interno da aplicação"}, 500

    if os.getenv("AUTO_CREATE_TABLES") == "1":
        Base.metadata.create_all(bind=engine)

    @app.route("/health")
    def health():
        return {"status": "ok"}, 200

    @app.route("/")
    def home():
        return render_template("index.html")

    return app

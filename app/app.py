from flask import Flask
from app.database.db import Base, engine
from app.routes.food import food_bp

import app.models.food 
import app.models.food_log
import app.models.users

def create_app():
    app = Flask(__name__)

    app.register_blueprint(food_bp)

    # Tabelas temporárias
    # Utilizar migrations posteriormente
    Base.metadata.create_all(bind=engine)

    @app.route("/")
    def home():
        return {"message": "API online"}

    return app

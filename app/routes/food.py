from flask import Blueprint, request, jsonify
from app.database.db import SessionLocal
from app.services.food_service import create_food_log

food_bp = Blueprint("food", __name__)

@food_bp.route("/food-log", methods=["POST"])
def create_food_log_route():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON inválido"}), 400

    food_id = data.get("food_id")
    quantity = data.get("quantity")

    if not food_id or not quantity:
        return jsonify({"error": "food_id e quantity são obrigatórios"}), 400

    db = SessionLocal()

    try:
        # temporário: user fixo
        user_id = 1

        food_log = create_food_log(db, user_id, food_id, quantity)

        return jsonify({
            "id": food_log.id,
            "calories": float(food_log.calories),
            "protein": float(food_log.protein),
            "carbs": float(food_log.carbs),
            "lipids": float(food_log.lipids)
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()

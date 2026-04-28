from datetime import datetime
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request

from app.database.deps import get_db
from app.models import food
from app.services.food_service import (
    create_food,
    create_food_log,
    list_food_logs_by_date,
    list_foods,
)

food_bp = Blueprint("food", __name__)


def _error_response(message, status_code):
    return jsonify({"error": message}), status_code


def _parse_json_object():
    if not request.is_json:
        raise ValueError("Content-Type deve ser application/json")

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("JSON inválido")

    return data


def _parse_positive_decimal(data, field_name):
    if field_name not in data:
        raise ValueError(f"{field_name} é obrigatório")

    value = data[field_name]
    if isinstance(value, bool):
        raise TypeError(f"{field_name} deve ser numérico")

    try:
        parsed_value = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise TypeError(f"{field_name} deve ser numérico") from None

    if parsed_value <= 0:
        raise ValueError(f"{field_name} deve ser maior que zero")

    return parsed_value


def _parse_positive_int(data, field_name):
    if field_name not in data:
        raise ValueError(f"{field_name} é obrigatório")

    value = data[field_name]
    if isinstance(value, bool):
        raise TypeError(f"{field_name} deve ser inteiro")

    try:
        parsed_value = int(value)
    except (TypeError, ValueError):
        raise TypeError(f"{field_name} deve ser inteiro") from None

    if str(parsed_value) != str(value).strip() and not isinstance(value, int):
        raise TypeError(f"{field_name} deve ser inteiro")

    if parsed_value <= 0:
        raise ValueError(f"{field_name} deve ser maior que zero")

    return parsed_value


def _parse_required_string(data, field_name):
    if field_name not in data:
        raise ValueError(f"{field_name} é obrigatório")

    value = data[field_name]
    if not isinstance(value, str):
        raise TypeError(f"{field_name} deve ser texto")

    normalized_value = value.strip()
    if not normalized_value:
        raise ValueError(f"{field_name} é obrigatório")

    return normalized_value


def _parse_iso_date(value):
    if value is None or not str(value).strip():
        raise ValueError("date é obrigatório no formato YYYY-MM-DD")

    try:
        return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()
    except ValueError:
        raise ValueError("date deve estar no formato YYYY-MM-DD") from None


def _serialize_food(food):
    return {
        "id": food.id,
        "name": food.name,
        "calories": float(food.calories),
        "carbs": float(food.carbs),
        "protein": float(food.protein),
        "lipids": float(food.lipids),
    }


def _serialize_food_log(food_log, food_name=None):
    return {
        "id": food_log.id,
        "food_id": food_log.food_id,
        "food_name": food_name,
        "quantity": float(food_log.quantity),
        "calories": float(food_log.calories),
        "protein": float(food_log.protein),
        "carbs": float(food_log.carbs),
        "lipids": float(food_log.lipids),
        "created_at": food_log.created_at.isoformat(),
    }


@food_bp.route("/food", methods=["GET"])
def list_foods_route():
    try:
        with get_db() as db:
            foods = list_foods(db)

        return jsonify([_serialize_food(food) for food in foods]), 200
    except Exception:
        return _error_response("Não foi possível listar os alimentos", 422)


@food_bp.route("/food", methods=["POST"])
def create_food_route():
    try:
        data = _parse_json_object()

        name = _parse_required_string(data, "name")
        calories = _parse_positive_decimal(data, "calories")
        carbs = _parse_positive_decimal(data, "carbs")
        protein = _parse_positive_decimal(data, "protein")
        lipids = _parse_positive_decimal(data, "lipids")

        with get_db() as db:
            food = create_food(db, name, calories, carbs, protein, lipids)

        return jsonify(_serialize_food(food)), 201
    except (ValueError, TypeError) as error:
        return _error_response(str(error), 400)
    except Exception:
        return _error_response("Não foi possível criar o alimento", 422)


@food_bp.route("/food-log", methods=["GET"])
def list_food_logs_route():
    try:
        target_date = _parse_iso_date(request.args.get("date"))

        with get_db() as db:
            user_id = 1
            rows = list_food_logs_by_date(db, user_id, target_date)

        return jsonify(
            [_serialize_food_log(food_log, food.name) for food_log, food in rows]
        ), 200
    except ValueError as error:
        return _error_response(str(error), 400)
    except Exception:
        return _error_response("Não foi possível listar os registros", 422)


@food_bp.route("/food-log", methods=["POST"])
def create_food_log_route():
    try:
        data = _parse_json_object()

        food_id = _parse_positive_int(data, "food_id")
        quantity = _parse_positive_decimal(data, "quantity")

        with get_db() as db:
            user_id = 1
            food_log = create_food_log(db, user_id, food_id, quantity)

        return jsonify(_serialize_food_log(food_log)), 201
    except (ValueError, TypeError) as error:
        return _error_response(str(error), 400)
    except Exception:
        return _error_response("Não foi possível processar a solicitação", 422)

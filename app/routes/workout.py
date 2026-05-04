from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request

from app.database.deps import get_db
from app.services.workout_service import (
    create_exercise,
    create_workout_session,
    get_workout_session_by_id,
    list_exercises,
    list_workout_sessions_by_date,
)

workout_bp = Blueprint("workout", __name__)


def _error_response(message, status_code):
    return jsonify({"error": message}), status_code


def _parse_json_object():
    if not request.is_json:
        raise ValueError("Content-Type deve ser application/json")

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("JSON inválido")

    return data


def _parse_positive_int_value(value, field_name):
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


def _parse_non_negative_decimal_value(value, field_name):
    if isinstance(value, bool):
        raise TypeError(f"{field_name} deve ser numérico")

    try:
        parsed_value = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise TypeError(f"{field_name} deve ser numérico") from None

    if parsed_value < 0:
        raise ValueError(f"{field_name} não pode ser negativo")

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


def _parse_string_list(data, field_name):
    if field_name not in data:
        raise ValueError(f"{field_name} é obrigatório")

    value = data[field_name]
    if not isinstance(value, list):
        raise TypeError(f"{field_name} deve ser uma lista")

    normalized = []
    for item in value:
        if not isinstance(item, str):
            raise TypeError(f"{field_name} deve conter apenas texto")
        item = item.strip()
        if item:
            normalized.append(item)

    if not normalized:
        raise ValueError(f"{field_name} deve conter ao menos um item")

    return normalized


def _parse_iso_date(value):
    if value is None or not str(value).strip():
        raise ValueError("date é obrigatório no formato YYYY-MM-DD")

    try:
        return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()
    except ValueError:
        raise ValueError("date deve estar no formato YYYY-MM-DD") from None


def _parse_optional_iso_datetime(value):
    if value is None:
        return datetime.now(timezone.utc)

    normalized = str(value).strip()
    if not normalized:
        return datetime.now(timezone.utc)

    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"

    try:
        parsed_value = datetime.fromisoformat(normalized)
    except ValueError:
        raise ValueError("created_at deve estar em ISO 8601 válido") from None

    if parsed_value.tzinfo is None:
        return parsed_value.replace(tzinfo=timezone.utc)

    return parsed_value.astimezone(timezone.utc)


def _parse_exercise_payload(data):
    return {
        "name": _parse_required_string(data, "name"),
        "muscle_groups": _parse_string_list(data, "muscle_groups"),
    }


def _parse_set_payload(data, index):
    if not isinstance(data, dict):
        raise TypeError(f"sets[{index}] deve ser um objeto")

    if "reps" not in data:
        raise ValueError(f"sets[{index}].reps é obrigatório")
    if "weight" not in data:
        raise ValueError(f"sets[{index}].weight é obrigatório")

    return {
        "reps": _parse_positive_int_value(data["reps"], f"sets[{index}].reps"),
        "weight": _parse_non_negative_decimal_value(data["weight"], f"sets[{index}].weight"),
    }


def _parse_execution_payload(data, index):
    if not isinstance(data, dict):
        raise TypeError(f"exercises[{index}] deve ser um objeto")

    if "exercise_id" not in data:
        raise ValueError(f"exercises[{index}].exercise_id é obrigatório")
    if "sets" not in data:
        raise ValueError(f"exercises[{index}].sets é obrigatório")
    if not isinstance(data["sets"], list):
        raise TypeError(f"exercises[{index}].sets deve ser uma lista")

    sets_payload = [
        _parse_set_payload(set_payload, set_index)
        for set_index, set_payload in enumerate(data["sets"], start=1)
    ]

    if not sets_payload:
        raise ValueError(f"exercises[{index}].sets deve conter ao menos uma série")

    return {
        "exercise_id": _parse_positive_int_value(
            data["exercise_id"], f"exercises[{index}].exercise_id"
        ),
        "sets": sets_payload,
    }


def _parse_workout_session_payload(data):
    exercises = data.get("exercises")
    if not isinstance(exercises, list):
        raise TypeError("exercises deve ser uma lista")
    if not exercises:
        raise ValueError("exercises deve conter ao menos uma execução")

    return {
        "created_at": _parse_optional_iso_datetime(data.get("created_at")),
        "exercises": [
            _parse_execution_payload(execution_payload, index)
            for index, execution_payload in enumerate(exercises, start=1)
        ],
    }


def _serialize_exercise(exercise, muscle_groups):
    return {
        "id": exercise.id,
        "name": exercise.name,
        "muscle_groups": muscle_groups,
    }


def _serialize_workout_set(workout_set):
    return {
        "id": workout_set.id,
        "reps": workout_set.reps,
        "weight": float(workout_set.weight),
        "order": workout_set.set_order,
    }


def _serialize_workout_session(row):
    session = row["session"]
    return {
        "id": session.id,
        "created_at": session.created_at.isoformat(),
        "exercises": [
            {
                "execution_id": execution_row["execution"].id,
                "order": execution_row["execution"].execution_order,
                "exercise_id": execution_row["exercise"].id,
                "exercise_name": execution_row["exercise"].name,
                "muscle_groups": execution_row["muscle_groups"],
                "sets": [
                    _serialize_workout_set(workout_set)
                    for workout_set in execution_row["sets"]
                ],
            }
            for execution_row in row["executions"]
        ],
    }


@workout_bp.route("/exercise", methods=["GET"])
def list_exercises_route():
    try:
        with get_db() as db:
            rows = list_exercises(db)
            response_payload = [
                _serialize_exercise(row["exercise"], row["muscle_groups"])
                for row in rows
            ]

        return jsonify(response_payload), 200
    except Exception:
        return _error_response("Não foi possível listar os exercícios", 422)


@workout_bp.route("/exercise", methods=["POST"])
def create_exercise_route():
    try:
        data = _parse_json_object()
        payload = _parse_exercise_payload(data)

        with get_db() as db:
            row = create_exercise(db, payload["name"], payload["muscle_groups"])
            response_payload = _serialize_exercise(
                row["exercise"], row["muscle_groups"]
            )

        return jsonify(response_payload), 201
    except (ValueError, TypeError) as error:
        return _error_response(str(error), 400)
    except Exception:
        return _error_response("Não foi possível criar o exercício", 422)


@workout_bp.route("/workout-session", methods=["GET"])
def list_workout_sessions_route():
    try:
        target_date = _parse_iso_date(request.args.get("date"))

        with get_db() as db:
            user_id = 1
            rows = list_workout_sessions_by_date(db, user_id, target_date)
            response_payload = [_serialize_workout_session(row) for row in rows]

        return jsonify(response_payload), 200
    except ValueError as error:
        return _error_response(str(error), 400)
    except Exception:
        return _error_response("Não foi possível listar os treinos", 422)


@workout_bp.route("/workout-session", methods=["POST"])
def create_workout_session_route():
    try:
        data = _parse_json_object()
        payload = _parse_workout_session_payload(data)

        with get_db() as db:
            user_id = 1
            session = create_workout_session(
                db,
                user_id=user_id,
                created_at=payload["created_at"],
                exercises=payload["exercises"],
            )
            created_row = get_workout_session_by_id(db, user_id, session.id)
            response_payload = _serialize_workout_session(created_row)

        return jsonify(response_payload), 201
    except (ValueError, TypeError) as error:
        status_code = 404 if "não encontrado" in str(error).lower() else 400
        return _error_response(str(error), status_code)
    except Exception:
        return _error_response("Não foi possível registrar o treino", 422)

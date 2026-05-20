from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.exc import IntegrityError

from app.models.food import Food
from app.models.food_log import FoodLog


def _calculate_macros(food, quantity):
    factor = float(quantity) / float(food.base_quantity)

    return {
        "calories": float(food.calories) * factor,
        "carbs": float(food.carbs) * factor,
        "protein": float(food.protein) * factor,
        "lipids": float(food.lipids) * factor,
    }


def _get_food_or_raise(db, food_id):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise ValueError("Food não encontrado")
    return food


def _get_food_log_or_raise(db, user_id, food_log_id):
    food_log = (
        db.query(FoodLog)
        .filter(FoodLog.id == food_log_id)
        .filter(FoodLog.user_id == user_id)
        .first()
    )
    if not food_log:
        raise ValueError("Registro alimentar não encontrado")
    return food_log


def list_foods(db):
    return db.query(Food).order_by(Food.name.asc()).all()


def create_food(db, name, base_quantity, calories, carbs, protein, lipids):
    normalized_name = name.strip()
    if not normalized_name:
        raise ValueError("name é obrigatório")

    food = Food(
        name=normalized_name,
        base_quantity=base_quantity,
        calories=calories,
        carbs=carbs,
        protein=protein,
        lipids=lipids,
    )

    try:
        db.add(food)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Já existe um alimento com esse nome") from None

    db.refresh(food)
    return food


def update_food(db, food_id, fields):
    food = _get_food_or_raise(db, food_id)

    for field_name, value in fields.items():
        setattr(food, field_name, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Já existe um alimento com esse nome") from None

    db.refresh(food)
    return food


def delete_food(db, food_id):
    food = _get_food_or_raise(db, food_id)

    has_logs = db.query(FoodLog.id).filter(FoodLog.food_id == food_id).first()
    if has_logs:
        raise ValueError("Não é possível excluir um alimento já utilizado em registros")

    db.delete(food)
    db.commit()


def list_food_logs_by_date(db, user_id, target_date: date):
    start_at = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    end_at = start_at + timedelta(days=1)

    return (
        db.query(FoodLog, Food)
        .join(Food, Food.id == FoodLog.food_id)
        .filter(FoodLog.user_id == user_id)
        .filter(FoodLog.created_at >= start_at)
        .filter(FoodLog.created_at < end_at)
        .order_by(FoodLog.created_at.desc())
        .all()
    )


def list_food_logs_by_date_range(db, user_id, start_date: date, end_date: date):
    start_at = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    end_at = datetime.combine(end_date, time.min, tzinfo=timezone.utc) + timedelta(
        days=1
    )

    return (
        db.query(FoodLog, Food)
        .join(Food, Food.id == FoodLog.food_id)
        .filter(FoodLog.user_id == user_id)
        .filter(FoodLog.created_at >= start_at)
        .filter(FoodLog.created_at < end_at)
        .order_by(FoodLog.created_at.desc())
        .all()
    )


def create_food_log(db, user_id, food_id, quantity):
    if quantity <= 0:
        raise ValueError("Quantidade deve ser maior que zero")

    if quantity > 5000:
        raise ValueError("Quantidade fora do limite plausível")

    food = _get_food_or_raise(db, food_id)
    macros = _calculate_macros(food, quantity)

    food_log = FoodLog(
        user_id=user_id,
        food_id=food_id,
        quantity=quantity,
        calories=macros["calories"],
        carbs=macros["carbs"],
        protein=macros["protein"],
        lipids=macros["lipids"],
    )

    db.add(food_log)
    db.commit()
    db.refresh(food_log)

    return food_log, food


def update_food_log(db, user_id, food_log_id, fields):
    food_log = _get_food_log_or_raise(db, user_id, food_log_id)

    food_id = fields.get("food_id", food_log.food_id)
    quantity = fields.get("quantity", food_log.quantity)

    if quantity <= 0:
        raise ValueError("Quantidade deve ser maior que zero")

    if quantity > 5000:
        raise ValueError("Quantidade fora do limite plausível")

    food = _get_food_or_raise(db, food_id)
    macros = _calculate_macros(food, quantity)

    food_log.food_id = food.id
    food_log.quantity = quantity
    food_log.calories = macros["calories"]
    food_log.carbs = macros["carbs"]
    food_log.protein = macros["protein"]
    food_log.lipids = macros["lipids"]

    db.commit()
    db.refresh(food_log)

    return food_log, food


def delete_food_log(db, user_id, food_log_id):
    food_log = _get_food_log_or_raise(db, user_id, food_log_id)
    db.delete(food_log)
    db.commit()

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.exc import IntegrityError

from app.models.food import Food
from app.models.food_log import FoodLog


def list_foods(db):
    return db.query(Food).order_by(Food.name.asc()).all()


def create_food(db, name, calories, carbs, protein, lipids):
    normalized_name = name.strip()
    if not normalized_name:
        raise ValueError("name é obrigatório")

    food = Food(
        name=normalized_name,
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


def create_food_log(db, user_id, food_id, quantity):
    if quantity <= 0:
        raise ValueError("Quantidade deve ser maior que zero")

    if quantity > 5000:
        raise ValueError("Quantidade fora do limite plausível")

    food = db.query(Food).filter(Food.id == food_id).first()

    if not food:
        raise ValueError("Food não encontrado")

    factor = float(quantity) / 100

    calories = float(food.calories) * factor
    carbs = float(food.carbs) * factor
    protein = float(food.protein) * factor
    lipids = float(food.lipids) * factor

    food_log = FoodLog(
        user_id=user_id,
        food_id=food_id,
        quantity=quantity,
        calories=calories,
        carbs=carbs,
        protein=protein,
        lipids=lipids,
    )

    db.add(food_log)
    db.commit()
    db.refresh(food_log)

    return food_log

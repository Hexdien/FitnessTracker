from app.models.food import Food
from app.models.food_log import FoodLog

def create_food_log(db, user_id, food_id, quantity):

    # Validações básicas
    if quantity <= 0:
        raise ValueError("Quantidade deve ser maior que zero")

    if quantity > 5000:
        raise ValueError("Quantidade fora do limite plausível")


    food = db.query(Food).filter(Food.id == food_id).first()

    if not food:
        raise ValueError("Food não encontrado")


    # Calculos lógicos básicos baseado na regra de 3
    factor = float(quantity) / 100

    calories = float(food.calories) * factor
    carbs = float(food.carbs) * factor
    protein = float(food.protein) * factor
    lipids = float(food.lipids) * factor


    # Montagem de query
    food_log = FoodLog(
        user_id=user_id,
        food_id=food_id,
        quantity=quantity,
        calories=calories,
        carbs=carbs,
        protein=protein,
        lipids=lipids
    )


    # Manipulação do banco de dados
    db.add(food_log)
    db.commit()
    db.refresh(food_log)

    return food_log

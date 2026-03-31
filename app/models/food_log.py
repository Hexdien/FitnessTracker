from sqlalchemy import Column, Integer, Numeric, ForeignKey, DateTime
from datetime import datetime
from app.database.db import Base


class FoodLog(Base):
    __tablename__ = "food_logs"


    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    food_id  = Column(Integer, ForeignKey("food.id"), nullable=False)

    quantity = Column(Numeric, nullable=False)
    carbs = Column(Numeric, nullable=False)
    calories = Column(Numeric, nullable=False)
    protein = Column(Numeric, nullable=False)
    lipids = Column(Numeric, nullable=False)

    created_at =  Column(DateTime, default=datetime.utcnow, nullable=False)


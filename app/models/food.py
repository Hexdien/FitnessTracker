from sqlalchemy import Column, Integer, String, Numeric
from app.database.db import Base

class Food(Base):
    __tablename__ = "food"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    base_quantity = Column(Numeric, nullable=False, default=100)
    calories = Column(Numeric, nullable=False)
    carbs = Column(Numeric, nullable=False)
    protein = Column(Numeric, nullable=False)
    lipids = Column(Numeric, nullable=False)

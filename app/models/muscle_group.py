from sqlalchemy import Column, Integer, String

from app.database.db import Base


class MuscleGroup(Base):
    __tablename__ = "muscle_groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

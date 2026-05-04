from sqlalchemy import Column, ForeignKey, Integer, Numeric

from app.database.db import Base


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True)
    exercise_execution_id = Column(Integer, ForeignKey("exercise_executions.id"), nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Numeric, nullable=False)
    set_order = Column(Integer, nullable=False)

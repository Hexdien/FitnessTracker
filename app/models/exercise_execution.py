from sqlalchemy import Column, ForeignKey, Integer

from app.database.db import Base


class ExerciseExecution(Base):
    __tablename__ = "exercise_executions"

    id = Column(Integer, primary_key=True)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    execution_order = Column(Integer, nullable=False)

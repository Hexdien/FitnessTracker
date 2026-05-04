from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint

from app.database.db import Base


class ExerciseMuscleGroup(Base):
    __tablename__ = "exercise_muscle_groups"
    __table_args__ = (
        UniqueConstraint("exercise_id", "muscle_group_id", name="uq_exercise_muscle_group"),
    )

    id = Column(Integer, primary_key=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    muscle_group_id = Column(Integer, ForeignKey("muscle_groups.id"), nullable=False)

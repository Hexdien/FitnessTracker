"""initial schema

Revision ID: 20260518_0001
Revises: None
Create Date: 2026-05-18
"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "food",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("base_quantity", sa.Numeric(), nullable=False),
        sa.Column("calories", sa.Numeric(), nullable=False),
        sa.Column("carbs", sa.Numeric(), nullable=False),
        sa.Column("protein", sa.Numeric(), nullable=False),
        sa.Column("lipids", sa.Numeric(), nullable=False),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("username"),
    )

    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "muscle_groups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "food_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("food_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(), nullable=False),
        sa.Column("carbs", sa.Numeric(), nullable=False),
        sa.Column("calories", sa.Numeric(), nullable=False),
        sa.Column("protein", sa.Numeric(), nullable=False),
        sa.Column("lipids", sa.Numeric(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["food_id"], ["food.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "exercise_muscle_groups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("muscle_group_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"]),
        sa.ForeignKeyConstraint(["muscle_group_id"], ["muscle_groups.id"]),
        sa.UniqueConstraint(
            "exercise_id",
            "muscle_group_id",
            name="uq_exercise_muscle_group",
        ),
    )

    op.create_table(
        "workout_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "exercise_executions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("workout_session_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("execution_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"]),
        sa.ForeignKeyConstraint(["workout_session_id"], ["workout_sessions.id"]),
    )

    op.create_table(
        "workout_sets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("exercise_execution_id", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=False),
        sa.Column("weight", sa.Numeric(), nullable=False),
        sa.Column("set_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["exercise_execution_id"], ["exercise_executions.id"]),
    )


def downgrade():
    op.drop_table("workout_sets")
    op.drop_table("exercise_executions")
    op.drop_table("workout_sessions")
    op.drop_table("exercise_muscle_groups")
    op.drop_table("food_logs")
    op.drop_table("muscle_groups")
    op.drop_table("exercises")
    op.drop_table("users")
    op.drop_table("food")

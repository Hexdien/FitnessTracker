from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config.config import Config
from app.database.db import Base

import app.models.exercise
import app.models.exercise_execution
import app.models.exercise_muscle_group
import app.models.food
import app.models.food_log
import app.models.muscle_group
import app.models.users
import app.models.workout_session
import app.models.workout_set

config = context.config
config.set_main_option("sqlalchemy.url", Config.SQLALCHEMY_DATABASE_URI)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(
        url=Config.SQLALCHEMY_DATABASE_URI,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    configuration = config.get_section(config.config_ini_section, {})
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

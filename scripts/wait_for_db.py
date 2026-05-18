import os
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.config.config import Config


def wait_for_db():
    attempts = int(os.getenv("DB_WAIT_ATTEMPTS", "30"))
    delay_seconds = float(os.getenv("DB_WAIT_DELAY", "2"))
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

    for attempt in range(1, attempts + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("Database is ready.")
            return
        except SQLAlchemyError as error:
            if attempt == attempts:
                raise
            print(f"Database unavailable ({attempt}/{attempts}): {error}")
            time.sleep(delay_seconds)


if __name__ == "__main__":
    wait_for_db()

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from app.database.db import Base


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)

    #TODO: Futuramente String será enum
    role = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

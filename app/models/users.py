from sqlalchemy import Column, Integer, String, Numeric, DateTime
from datetime import datetime
from app.database.db import Base

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)


    #TODO: Futuramente String será enum
    role = Column(String, nullable=False)
    created_at =  Column(DateTime, default=datetime.utcnow, nullable=False)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config.config import Config

engine_kwargs = {}

if Config.SQLALCHEMY_DATABASE_URI.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

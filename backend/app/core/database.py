
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Locate .env from the project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)

# Build a safe MySQL connection URL
connection_url = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("APP_DB_USER"),
    password=os.getenv("APP_DB_PASSWORD"),
    host=os.getenv("APP_DB_HOST"),
    port=int(os.getenv("APP_DB_PORT", "3306")),
    database=os.getenv("APP_DB_NAME"),
)

engine = create_engine(
    connection_url,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

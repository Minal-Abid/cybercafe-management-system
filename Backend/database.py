import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import sqlalchemy.exc

#env_path = Path(__file__).resolve().parent / ".env"


from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Base class for models
Base = declarative_base()

# Test DB connection
try:
    with engine.connect() as conn:
        print("✅ Database connection successful.")
except sqlalchemy.exc.SQLAlchemyError as e:
    print("❌ Database connection failed:", str(e))

import os
import sqlalchemy.exc
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Get database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine
engine = create_engine(DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Test DB connection
try:
    with engine.connect() as conn:
        print("✅ Database connection successful.")
except sqlalchemy.exc.SQLAlchemyError as e:
    print("❌ Database connection failed:", str(e))

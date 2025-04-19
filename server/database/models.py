from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Define the database connection
DATABASE_URL = "postgresql://postgres:postgres@db:5432/mydatabase"


# Create SQLAlchemy engine and session factory
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Document(Base):
    __tablename__ = 'documents'

    path = Column(String,  primary_key=True)
    hash = Column(String, nullable=True)
    email = Column(String, nullable=False)


def create_tables():
    Base.metadata.create_all(bind=engine)


create_tables()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

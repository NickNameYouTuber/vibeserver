from sqlalchemy import Column, Integer, String, JSON
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    language = Column(String)
    type = Column(String)
    settings = Column(JSON)
    git_repo = Column(String, nullable=True)
    status = Column(String, default="stopped")
    port = Column(Integer, unique=True)
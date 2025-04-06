from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String)
    settings_schema = Column(JSON)  # JSON схема настроек
    files = Column(JSON)  # JSON с содержимым файлов шаблона

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    template_id = Column(Integer, ForeignKey('templates.id'))
    settings = Column(JSON)
    port = Column(Integer, unique=True)
    status = Column(String, default="stopped")
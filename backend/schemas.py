from pydantic import BaseModel
from typing import Optional, Dict

class TemplateBase(BaseModel):
    name: str
    type: str
    settings_schema: Dict
    files: Dict

class TemplateCreate(TemplateBase):
    pass

class Template(TemplateBase):
    id: int

    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    name: str
    template_id: int
    settings: Dict

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    port: int
    status: str

    class Config:
        orm_mode = True
from pydantic import BaseModel
from typing import Optional, Dict

class ProjectBase(BaseModel):
    name: str
    language: str
    type: str
    settings: Dict

class ProjectCreate(ProjectBase):
    create_git: bool = False

class Project(ProjectBase):
    id: int
    git_repo: Optional[str] = None
    status: str
    port: int

    class Config:
        orm_mode = True
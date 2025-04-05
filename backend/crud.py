from sqlalchemy.orm import Session
from models import Project
from schemas import ProjectCreate

def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: ProjectCreate):
    db_project = Project(
        name=project.name,
        language=project.language,
        type=project.type,
        settings=project.settings,
        port=get_next_port(db)
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def get_next_port(db: Session):
    last_project = db.query(Project).order_by(Project.port.desc()).first()
    return last_project.port + 1 if last_project else 5000
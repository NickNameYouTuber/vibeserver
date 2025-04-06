from sqlalchemy.orm import Session
from models import Template, Project
from schemas import TemplateCreate, ProjectCreate

def get_template(db: Session, template_id: int):
    return db.query(Template).filter(Template.id == template_id).first()

def get_templates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Template).offset(skip).limit(limit).all()

def create_template(db: Session, template: TemplateCreate):
    db_template = Template(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

def update_template(db: Session, template_id: int, template: TemplateCreate):
    db_template = get_template(db, template_id)
    if db_template:
        for key, value in template.dict().items():
            setattr(db_template, key, value)
        db.commit()
        db.refresh(db_template)
    return db_template

def delete_template(db: Session, template_id: int):
    db_template = get_template(db, template_id)
    if db_template:
        db.delete(db_template)
        db.commit()
    return db_template

def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: ProjectCreate):
    db_project = Project(
        name=project.name,
        template_id=project.template_id,
        settings=project.settings,
        port=get_next_port(db)
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def get_next_port(db: Session):
    last_project = db.query(Project).order_by(Project.port.desc()).first()
    return last_project.port + 1 if last_project else 6000
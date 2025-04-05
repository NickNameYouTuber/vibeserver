from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from schemas import ProjectCreate, Project
from crud import get_projects, get_project, create_project
from project_templates import create_project_directory, generate_project_files
from docker_manager import build_and_run_container, restart_container, stop_container
from nginx_manager import add_project_to_nginx, remove_project_from_nginx

app = FastAPI(
    title="VibeServer Backend",
    description="API для управления проектами с Docker и Nginx",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/projects/", response_model=Project)
def create_new_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Создать новый проект: генерирует файлы, запускает контейнер и добавляет в Nginx."""
    db_project = create_project(db, project)
    create_project_directory(db_project.name)
    generate_project_files(db_project.type, db_project.name)
    container = build_and_run_container(db_project.name, db_project.port)
    add_project_to_nginx(db_project.name, db_project.port)
    db_project.status = "running"
    db.commit()
    return db_project

@app.get("/projects/", response_model=list[Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список всех проектов."""
    projects = get_projects(db, skip=skip, limit=limit)
    return projects

@app.get("/projects/{project_id}", response_model=Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    """Получить информацию о проекте по ID."""
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.post("/projects/{project_id}/restart")
def restart_project(project_id: int, db: Session = Depends(get_db)):
    """Перезапустить проект."""
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    restart_container(db_project.name)
    return {"message": "Project restarted"}

@app.post("/projects/{project_id}/stop")
def stop_project(project_id: int, db: Session = Depends(get_db)):
    """Остановить проект."""
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    stop_container(db_project.name)
    db_project.status = "stopped"
    db.commit()
    return {"message": "Project stopped"}
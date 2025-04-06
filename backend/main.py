import os
import re
import json
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from schemas import TemplateCreate, Template, ProjectCreate, Project
from crud import (
    get_templates, get_template, create_template, update_template, delete_template,
    get_projects, get_project, create_project
)
from project_templates import create_project_directory, generate_project_files
from docker_manager import build_and_run_container, restart_container, stop_container
from nginx_manager import add_project_to_nginx, remove_project_from_nginx
import docker
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VibeServer Backend",
    description="API для управления проектами с Docker и Nginx",
    version="1.0.0"
)

# CORS settings
origins = [
    "http://192.168.1.99:5173",
    "http://192.168.1.99:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize Together client
TOGETHER_API_KEY = "2095db14a0eb43fa91c48f9c2f98178fe3f93f379cc40129961773c0cecc4469"
if not TOGETHER_API_KEY:
    raise ValueError("TOGETHER_API_KEY environment variable is not set")

from together import Together

client = Together(api_key=TOGETHER_API_KEY)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for AI generation request
class Description(BaseModel):
    description: str

# Template endpoints
@app.post("/templates/", response_model=Template)
def create_new_template(template: TemplateCreate, db: Session = Depends(get_db)):
    return create_template(db, template)

@app.get("/templates/", response_model=list[Template])
def read_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_templates(db, skip=skip, limit=limit)

@app.get("/templates/{template_id}", response_model=Template)
def read_template(template_id: int, db: Session = Depends(get_db)):
    db_template = get_template(db, template_id)
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_template

@app.put("/templates/{template_id}", response_model=Template)
def update_existing_template(template_id: int, template: TemplateCreate, db: Session = Depends(get_db)):
    db_template = update_template(db, template_id, template)
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_template

@app.delete("/templates/{template_id}")
def delete_existing_template(template_id: int, db: Session = Depends(get_db)):
    db_template = delete_template(db, template_id)
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

@app.post("/templates/ai-generate", response_model=Template)
def generate_template_with_ai(data: Description, db: Session = Depends(get_db)):
    prompt = f"""Generate a project template for a {data.description} project. Provide the template as a JSON object enclosed in ```json and ``` tags, with the following structure:
{{
    "name": "Template Name",
    "type": "project_type",
    "settings_schema": {{
        "setting1": {{"type": "string", "default": "value"}},
        "setting2": {{"type": "boolean", "default": true}}
    }},
    "files": {{
        "file1.ext": "file content with {{ setting1 }} placeholders",
        "Dockerfile": "FROM base_image\\nWORKDIR /app\\nCOPY . /app\\nRUN install_commands\\nEXPOSE 6000\\nCMD [\"command\", \"to\", \"run\", \"app\"]"
    }}
}}
Важно:
- Всегда включайте 'Dockerfile' в раздел 'files'.
- Настройте Dockerfile в зависимости от типа проекта, указанного в описании.
- Используйте двойные фигурные скобки {{ setting_name }} как плейсхолдеры в содержимом ЛЮБЫХ ФАЙЛОВ КОТОРЫЕ БЕРУТ ДАННЫЕ ИЗ settings_schema. Так как используется jinja2 для их автозаполнения.
- Убедитесь, что настройки в settings_schema соответствуют плейсхолдерам в файлах.
Пример для проекта на Python Flask:
{{
    "name": "Flask App",
    "type": "flask",
    "settings_schema": {{
        "debug": {{"type": "boolean", "default": true}}
    }},
    "files": {{
        "app.py": "from flask import Flask\\napp = Flask(__name__)\\n\\n@app.route('/')\\ndef hello():\\n    return 'Hello, World!'\\n\\nif __name__ == '__main__':\\n    app.run(host=\"0.0.0.0\", port=5000, debug={{ debug }})",
        "requirements.txt": "flask",
        "Dockerfile": "FROM python:3.9-slim\\nWORKDIR /app\\nCOPY . /app\\nRUN pip install -r requirements.txt\\nEXPOSE 6000\\nCMD [\"python\", \"app.py\"]"
    }}
}}

ВСЕ ДАННЫЕ КОТОРЫЕ БЕРУТСЯ ИЗ settings_schema в files ДОЛЖНЫ БЫТЬ В ДВОЙНЫХ!!! ФИГУРНЫХ СКОБКАХ, НЕ В ОДИНОЧНЫХ! МЕЖДУ СКОБКАМИ ПРОБЕЛЫ НЕ СТАВЬ, то есть две открывающие/закрывающие скобки пишутся слитно!
"""

    try:
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",  # Замените на вашу модель Together
            messages=[
                {"role":"system","content":"Generate a Python script to modify settings_schema in files to use double curly brackets instead of single curly brackets. Ensure that there are no spaces between the brackets.\n\n# Steps\n\n1. **Read the File**: Open the file containing the settings_schema and read its content.\n2. **Replace Single Curly Brackets**: Use a regular expression or string replacement method to replace all occurrences of single curly brackets `{` and `}` with double curly brackets `{{` and `}}` respectively, ensuring no spaces are added between the brackets.\n3. **Write the Changes**: Overwrite the original file with the modified content or save it as a new file.\n\n# Output Format\n\nThe output should be the modified settings_schema with all single curly brackets replaced by double curly brackets, without any spaces between them.\n\n# Examples\n\n**Input:**\n```json\n{\n  \"key\": \"{value}\"\n}\n```\n\n**Output:**\n```json\n{\n  \"key\": \"{{value}}\"\n}\n```\n\n# Notes\n\n- Ensure the script can handle nested curly brackets correctly.\n- Consider adding error handling for file operations.\n- The script should be able to process large files efficiently.\n- Provide an option to specify the input and output file paths.\n- Use Python's built-in `re` module for regular expression replacements or the `str.replace()` method for simplicity."},
                {"role":"user","content":prompt}],
            max_tokens=4000,
            temperature=0.9,
        )
        generated_text = response.choices[0].message.content

        logger.info(f"generated_text {generated_text}")

        # Извлечение JSON из ответа
        match = re.search(r'```json(.*?)```', generated_text, re.DOTALL)
        if not match:
            raise ValueError("В ответе не найден блок JSON")

        json_str = match.group(1).strip()

        logger.info(f"json_str {json_str}")

        template_data = json.loads(json_str)

        # Проверка наличия обязательных ключей
        required_keys = ['name', 'type', 'settings_schema', 'files']
        for key in required_keys:
            if key not in template_data:
                raise ValueError(f"Отсутствует ключ в данных шаблона: {key}")

        # Проверка наличия Dockerfile
        if 'Dockerfile' not in template_data['files']:
            raise ValueError("В разделе 'files' отсутствует Dockerfile")

        # Создание шаблона в базе данных
        template_create = TemplateCreate(**template_data)
        db_template = create_template(db, template_create)
        return db_template
    except Exception as e:
        logger.error(f"Не удалось сгенерировать шаблон с AI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка генерации шаблона: {str(e)}")
    
# Project endpoints
@app.post("/projects/", response_model=Project)
def create_new_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = create_project(db, project)
    template = get_template(db, project.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    try:
        create_project_directory(db_project.name)
        generate_project_files(template, db_project)
        container = build_and_run_container(db_project.name, db_project.port)
        add_project_to_nginx(db_project.name, db_project.port)
        db_project.status = "running"
        db.commit()
        return db_project
    except Exception as e:
        db.rollback()
        logger.error(f"Project creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@app.get("/projects/", response_model=list[Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = get_projects(db, skip=skip, limit=limit)
    return projects

@app.get("/projects/{project_id}", response_model=Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.post("/projects/{project_id}/restart")
def restart_project(project_id: int, db: Session = Depends(get_db)):
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    restart_container(db_project.name)
    return {"message": "Project restarted"}

@app.post("/projects/{project_id}/stop")
def stop_project(project_id: int, db: Session = Depends(get_db)):
    db_project = get_project(db, project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    stop_container(db_project.name)
    db_project.status = "stopped"
    db.commit()
    return {"message": "Project stopped"}

@app.get("/projects/{project_name}/logs")
def get_project_logs(project_name: str):
    try:
        client = docker.from_env()
        container = client.containers.get(project_name)
        logs = container.logs().decode('utf-8')
        return {"logs": logs}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")
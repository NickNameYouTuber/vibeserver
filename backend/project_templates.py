import os
from jinja2 import Template as JinjaTemplate
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_project_directory(project_name):
    project_dir = f"projects/{project_name}"
    os.makedirs(project_dir, exist_ok=True)
    logger.info(f"Created directory: {project_dir}")
    return project_dir

def generate_project_files(template, project):
    project_dir = f"projects/{project.name}"
    try:
        os.makedirs(project_dir, exist_ok=True)
        logger.info(f"Ensuring directory exists: {project_dir}")
        
        # Создаем копию настроек и преобразуем булевы значения для Python
        settings = project.settings.copy()

        logger.info(f"settings : {settings}")
        for key, value in settings.items():
            logger.info(f"key : {key}")
            if value == 'true':
                settings[key] = "True"
            elif value == 'false':
                settings[key] = "False"
        
        # Генерируем файлы с использованием преобразованных настроек
        for file_name, file_content in template.files.items():
            # Полный путь к файлу
            file_path = os.path.join(project_dir, file_name)
            # Создаем директории, если они не существуют
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            # Рендерим содержимое файла с помощью Jinja2
            jinja_template = JinjaTemplate(file_content)
            rendered_content = jinja_template.render(**settings)
            # Записываем файл
            with open(file_path, 'w') as f:
                f.write(rendered_content)
            logger.info(f"Generated file: {file_path}")
    except Exception as e:
        logger.error(f"Failed to generate project files: {str(e)}")
        raise
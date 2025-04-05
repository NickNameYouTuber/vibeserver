import shutil
import os

def create_project_directory(project_name):
    os.makedirs(f"projects/{project_name}", exist_ok=True)

def generate_project_files(project_type, project_name):
    template_dir = f"templates/{project_type}"
    project_dir = f"projects/{project_name}"
    shutil.copytree(template_dir, project_dir, dirs_exist_ok=True)
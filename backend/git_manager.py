import subprocess
import os
from typing import Optional

def init_git(project_name: str, git_type: str, git_repo: Optional[str] = None):
    project_dir = f"projects/{project_name}"
    os.makedirs(project_dir, exist_ok=True)
    if git_type == "local":
        subprocess.run(["git", "init"], cwd=project_dir, check=True)
    elif git_type == "github" and git_repo:
        subprocess.run(["git", "clone", git_repo, project_name], cwd="projects", check=True)
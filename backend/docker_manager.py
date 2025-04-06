import logging
from typing import Optional
import docker
import os

client = docker.from_env()

logger = logging.getLogger(__name__)

def build_and_run_container(project_name, port):
    project_dir = f"projects/{project_name}"
    try:
        tag = project_name.lower()
        logger.info(f"Building image from {project_dir} with tag {tag}")
        client.images.build(path=project_dir, tag=tag)
        try:
            old_container = client.containers.get(project_name)
            old_container.stop()
            old_container.remove()
            logger.info(f"Removed existing container: {project_name}")
        except docker.errors.NotFound:
            logger.info(f"No existing container found for {project_name}")
        container = client.containers.run(
            tag,
            detach=True,
            ports={'6000/tcp': port},
            name=project_name
        )
        logger.info(f"Started container {project_name} on port {port}")
        return container
    except docker.errors.APIError as e:
        logger.error(f"Docker API error: {str(e)}")
        raise Exception(f"Failed to build/run container: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise Exception(f"Failed to build/run container: {str(e)}")

def restart_container(project_name: str):
    try:
        container = client.containers.get(project_name)
        container.restart()
    except docker.errors.NotFound:
        raise Exception(f"Container {project_name} not found")

def stop_container(project_name: str):
    try:
        container = client.containers.get(project_name)
        container.stop()
    except docker.errors.NotFound:
        raise Exception(f"Container {project_name} not found")
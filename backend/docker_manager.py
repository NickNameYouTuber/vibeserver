import docker

client = docker.from_env()

def build_and_run_container(project_name, port):
    try:
        # Используем lowercase для тега
        tag = project_name.lower()
        client.images.build(path=f"projects/{project_name}", tag=tag)
        # Удаляем старый контейнер, если он есть
        try:
            old_container = client.containers.get(project_name)
            old_container.stop()
            old_container.remove()
        except docker.errors.NotFound:
            pass
        # Запускаем новый контейнер
        container = client.containers.run(
            tag,
            detach=True,
            ports={'5000/tcp': port},  # Flask внутри слушает 5000, снаружи — заданный порт
            name=project_name
        )
        return container
    except docker.errors.APIError as e:
        raise Exception(f"Failed to build/run container: {str(e)}")

def restart_container(project_name):
    try:
        container = client.containers.get(project_name)
        container.restart()
    except docker.errors.NotFound:
        raise Exception(f"Container {project_name} not found")

def stop_container(project_name):
    try:
        container = client.containers.get(project_name)
        container.stop()
    except docker.errors.NotFound:
        raise Exception(f"Container {project_name} not found")
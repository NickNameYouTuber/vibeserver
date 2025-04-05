import os
import tempfile

NGINX_CONF_PATH = "/etc/nginx/sites-available/vibeserver"

def add_project_to_nginx(project_name, port):
    # Базовый шаблон конфигурации сервера, если файл ещё не существует
    base_config = """server {
    listen 80;
    server_name localhost 127.0.0.1;

    location / {
        return 200 "Welcome to VibeServer!";
        add_header Content-Type text/plain;
    }
}
"""
    # Конфигурация для нового проекта
    project_config = f"""    location /{project_name}/ {{
        proxy_pass http://127.0.0.1:{port}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
"""

    # Если файл ещё не существует, создаём его с помощью sudo
    if not os.path.exists(NGINX_CONF_PATH):
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as temp_file:
            temp_file.write(base_config)
            temp_file_path = temp_file.name
        os.system(f"sudo mv {temp_file_path} {NGINX_CONF_PATH}")
        os.system(f"sudo chown root:root {NGINX_CONF_PATH}")
        os.system(f"sudo chmod 644 {NGINX_CONF_PATH}")

    # Читаем текущий файл (нужен sudo для доступа)
    temp_file_path = tempfile.mktemp()
    os.system(f"sudo cp {NGINX_CONF_PATH} {temp_file_path}")
    
    with open(temp_file_path, "r") as f:
        content = f.read()

    # Проверяем, есть ли уже такой location
    if f"location /{project_name}/" not in content:
        # Вставляем новый блок перед последней закрывающей скобкой
        new_content = content.rstrip("}\n") + project_config + "}\n"
        with open(temp_file_path, "w") as f:
            f.write(new_content)
        
        # Копируем обратно с sudo и перезагружаем Nginx
        os.system(f"sudo mv {temp_file_path} {NGINX_CONF_PATH}")
        os.system("sudo nginx -t && sudo nginx -s reload")
    else:
        os.remove(temp_file_path)  # Удаляем временный файл, если ничего не изменилось
        
def remove_project_from_nginx(project_name):
    # Используем список строк и игнорируем блоки для данного проекта
    with open(NGINX_CONF_PATH, "r") as f:
        lines = f.readlines()
    
    new_lines = []
    skip = False
    for line in lines:
        # Если строка содержит начало блока для нужного проекта – начинаем пропускать
        if f"location /{project_name}/" in line:
            skip = True
        # Если встречаем закрывающую скобку и находимся в режиме пропуска – завершаем пропуск
        elif skip and "}" in line:
            skip = False
            continue
        if not skip:
            new_lines.append(line)
    
    with open(NGINX_CONF_PATH, "w") as f:
        f.writelines(new_lines)
    os.system("sudo nginx -s reload")

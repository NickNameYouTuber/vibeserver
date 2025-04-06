import os
import tempfile

NGINX_CONF_PATH = "/etc/nginx/sites-available/vibeserver"

def add_project_to_nginx(project_name, port):
    base_config = """server {
    listen 80;
    server_name 192.168.1.99 127.0.0.1;

    location / {
        return 200 "Welcome to VibeServer!";
        add_header Content-Type text/plain;
    }
}
"""
    project_config = f"""    location /{project_name}/ {{
        proxy_pass http://127.0.0.1:{port}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
"""

    if not os.path.exists(NGINX_CONF_PATH):
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as temp_file:
            temp_file.write(base_config)
            temp_file_path = temp_file.name
        os.system(f"sudo mv {temp_file_path} {NGINX_CONF_PATH}")
        os.system(f"sudo chown root:root {NGINX_CONF_PATH}")
        os.system(f"sudo chmod 644 {NGINX_CONF_PATH}")

    temp_file_path = tempfile.mktemp()
    os.system(f"sudo cp {NGINX_CONF_PATH} {temp_file_path}")

    with open(temp_file_path, "r") as f:
        lines = f.readlines()

    if any(f"location /{project_name}/" in line for line in lines):
        os.remove(temp_file_path)
        return

    new_lines = []
    inserted = False
    for i, line in enumerate(lines):
        if "}" in line.strip() and i == len(lines) - 1:
            new_lines.append(project_config)
            new_lines.append(line)
            inserted = True
        else:
            new_lines.append(line)

    if not inserted:
        new_lines.append(project_config)

    with open(temp_file_path, "w") as f:
        f.writelines(new_lines)

    os.system(f"sudo mv {temp_file_path} {NGINX_CONF_PATH}")
    os.system("sudo nginx -t && sudo nginx -s reload")

def remove_project_from_nginx(project_name):
    temp_file_path = tempfile.mktemp()
    os.system(f"sudo cp {NGINX_CONF_PATH} {temp_file_path}")

    with open(temp_file_path, "r") as f:
        lines = f.readlines()

    new_lines = []
    skip = False
    brace_count = 0

    for line in lines:
        if f"location /{project_name}/" in line:
            skip = True
            brace_count = line.count("{") - line.count("}")
            continue
        if skip:
            brace_count += line.count("{") - line.count("}")
            if brace_count <= 0:
                skip = False
            continue
        new_lines.append(line)

    with open(temp_file_path, "w") as f:
        f.writelines(new_lines)

    os.system(f"sudo mv {temp_file_path} {NGINX_CONF_PATH}")
    os.system("sudo nginx -t && sudo nginx -s reload")
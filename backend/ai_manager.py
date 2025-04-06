import openai

openai.api_key = "your-api-key"  # Replace with your actual API key

def generate_project_with_ai(description: str):
    response = openai.Completion.create(
        engine="davinci-codex",
        prompt=f"Generate a {description} project",
        max_tokens=1000
    )
    generated_code = response.choices[0].text
    return generated_code
import os
import json
from openai import OpenAI

PROMPT_TEMPLATE = """You are a support ticket classifier. Analyze the following ticket and respond ONLY with valid JSON.

Title: {title}
Description: {description}

Respond with exactly this JSON format:
{{"category": "<category>", "priority": "<priority>"}}

Where:
- category must be one of: billing, technical, account, general
- priority must be one of: low, medium, high, critical

Respond with JSON only, no other text."""

DEFAULTS = {"category": "general", "priority": "medium"}

VALID_CATEGORIES = {'billing', 'technical', 'account', 'general'}
VALID_PRIORITIES = {'low', 'medium', 'high', 'critical'}


def classify_ticket(title: str, description: str) -> dict:
    try:
        api_key = os.environ.get('OPENAI_API_KEY', '')
        if not api_key:
            return DEFAULTS.copy()

        client = OpenAI(api_key=api_key)
        model = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')

        prompt = PROMPT_TEMPLATE.format(title=title, description=description)

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        content = response.choices[0].message.content.strip()
        result = json.loads(content)

        category = result.get('category', 'general')
        priority = result.get('priority', 'medium')

        if category not in VALID_CATEGORIES:
            category = 'general'
        if priority not in VALID_PRIORITIES:
            priority = 'medium'

        return {"category": category, "priority": priority}
    except Exception:
        return DEFAULTS.copy()

import json
import os

from openai import OpenAI

from .models import Ticket

PROMPT_TEMPLATE = """You are an assistant that classifies support tickets.
Return ONLY valid JSON with keys: category and priority.
Allowed category values: billing, technical, account, general.
Allowed priority values: low, medium, high, critical.
Choose the single best values based on the user's description.

Ticket description:
{description}
"""


class TicketClassifier:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

    def classify(self, description: str):
        fallback = {
            'suggested_category': Ticket.CATEGORY_GENERAL,
            'suggested_priority': Ticket.PRIORITY_MEDIUM,
        }

        if not self.api_key:
            return fallback

        try:
            client = OpenAI(api_key=self.api_key)
            response = client.chat.completions.create(
                model=self.model,
                temperature=0,
                response_format={'type': 'json_object'},
                messages=[
                    {'role': 'system', 'content': 'You classify support tickets into strict enums.'},
                    {'role': 'user', 'content': PROMPT_TEMPLATE.format(description=description)},
                ],
            )
            content = response.choices[0].message.content or '{}'
            parsed = json.loads(content)
            category = parsed.get('category', '').strip().lower()
            priority = parsed.get('priority', '').strip().lower()

            valid_categories = {choice[0] for choice in Ticket.CATEGORY_CHOICES}
            valid_priorities = {choice[0] for choice in Ticket.PRIORITY_CHOICES}

            if category not in valid_categories:
                category = fallback['suggested_category']
            if priority not in valid_priorities:
                priority = fallback['suggested_priority']

            return {
                'suggested_category': category,
                'suggested_priority': priority,
            }
        except Exception:
            return fallback

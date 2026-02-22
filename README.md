# Support Ticket System

A full-stack Support Ticket System built for the Tech Intern assessment using:
- Backend: Django + Django REST Framework + PostgreSQL
- Frontend: React (Vite)
- LLM Integration: OpenAI Chat Completions (`gpt-4o-mini` by default)
- Infrastructure: Docker + Docker Compose

## Why OpenAI
OpenAI was selected for fast JSON-mode responses and straightforward API ergonomics in Python. JSON response mode helps reduce parsing errors for strict enum outputs (`category`, `priority`).

## Features
- Submit support tickets with required title/description
- LLM-assisted ticket classification via `/api/tickets/classify/`
- Editable category/priority suggestions before submit
- Ticket list with combined filtering (`category`, `priority`, `status`) and `search`
- Inline ticket status updates
- Stats dashboard backed by DB-level aggregation
- Fully containerized stack with one command startup

## API Endpoints
- `POST /api/tickets/`
- `GET /api/tickets/`
- `PATCH /api/tickets/<id>/`
- `GET /api/tickets/stats/`
- `POST /api/tickets/classify/`

## LLM Prompt
Prompt is stored in `backend/tickets/llm_service.py` as `PROMPT_TEMPLATE`.

It explicitly constrains output to JSON with enum values:
- category: `billing | technical | account | general`
- priority: `low | medium | high | critical`

## Graceful Failure Strategy
If OpenAI is unavailable, API key is missing, or output is invalid:
- classify endpoint returns safe defaults (`general`, `medium`)
- ticket submission remains fully functional

## Setup
### 1) Optional: create `.env` from `.env.example`
Example:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
POSTGRES_DB=tickets_db
POSTGRES_USER=tickets_user
POSTGRES_PASSWORD=tickets_password
```

### 2) Run everything
```bash
docker-compose up --build
```

### 3) Access apps
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/tickets/`

## Design Decisions
- DB-level constraints: enforced using model field constraints + `CheckConstraint` for enum/blank guards
- Stats query logic: uses ORM `aggregate/annotate` (no Python loops for aggregation math)
- Frontend architecture: single-page React app focused on assessment functionality over styling
- Auto-refresh behavior: stats + tickets refresh after submit and status changes

## Quick Verification
- Postman collection: `postman/SupportTicketSystem.postman_collection.json`
	- Import collection and run requests in order.
	- `Create Ticket` test stores `ticketId` automatically for patch request.
- PowerShell smoke test: `scripts/smoke-test.ps1`
	- Run after services are up:

```powershell
./scripts/smoke-test.ps1
```

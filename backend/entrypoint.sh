#!/bin/sh
set -e

python - <<'PY'
import os
import time
import psycopg2

db_name = os.getenv('POSTGRES_DB', 'tickets_db')
db_user = os.getenv('POSTGRES_USER', 'tickets_user')
db_password = os.getenv('POSTGRES_PASSWORD', 'tickets_password')
db_host = os.getenv('POSTGRES_HOST', 'db')
db_port = int(os.getenv('POSTGRES_PORT', '5432'))

for _ in range(30):
	try:
		psycopg2.connect(
			dbname=db_name,
			user=db_user,
			password=db_password,
			host=db_host,
			port=db_port,
		).close()
		break
	except psycopg2.OperationalError:
		time.sleep(1)
else:
	raise RuntimeError('Database is not ready after waiting 30 seconds.')
PY

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000

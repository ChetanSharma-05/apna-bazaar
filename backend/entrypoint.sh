#!/bin/sh
set -eu

python manage.py migrate --noinput

if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  python manage.py shell -c 'import os; from django.contrib.auth import get_user_model; User=get_user_model(); username=os.environ["DJANGO_SUPERUSER_USERNAME"]; user=User.objects.filter(username=username).first(); user or User.objects.create_superuser(username=username, email=os.getenv("DJANGO_SUPERUSER_EMAIL", ""), password=os.environ["DJANGO_SUPERUSER_PASSWORD"])'
fi

exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2 --timeout 120

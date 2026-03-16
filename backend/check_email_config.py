import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import EmailConfiguration

configs = EmailConfiguration.objects.all()
print(f"Total configs: {configs.count()}")
for c in configs:
    # Use getattr for password to avoid issues if field name is slightly different
    print(f"ID: {c.id}, Title: {c.title}, Host: {c.email_host}, Active: {c.is_active}")

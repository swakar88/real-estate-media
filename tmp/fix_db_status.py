import sys
import os

# Setup Django
sys.path.append('c:/Dev/Krishna/real-estate-media/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from api.models import ClientShoot

def fix_status(shoot_id):
    try:
        s = ClientShoot.objects.get(id=shoot_id)
        s.payment_status = 'paid'
        s.save()
        print(f"Shoot {shoot_id} standardized to 'paid'")
    except ClientShoot.DoesNotExist:
        print(f"Shoot {shoot_id} not found")

if __name__ == "__main__":
    fix_status(7)

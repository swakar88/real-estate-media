import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append('c:/Dev/Krishna/real-estate-media/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') 
django.setup()

from api.models import ClientShoot

try:
    shoot = ClientShoot.objects.get(id=7)
    print(f"Prop: {shoot.property_address}")
    print(f"Current Status: {shoot.status}, Current Payment: {shoot.payment_status}")
    shoot.payment_status = 'paid'
    shoot.status = 'delivered'
    shoot.save()
    print("Successfully updated shoot 7 to paid/delivered")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
